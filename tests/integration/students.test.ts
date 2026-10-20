// Phase 5: student accounts and everything kept on them. The rules checked
// here: accounts are optional and never open the admin, recovery works
// without email, everything a student saves stays in its course, a student
// only ever sees their own history, deleting an account deletes its data, and
// the admin's analytics count students only.
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as coursePOST } from "@/app/api/courses/[course]/[kind]/[slug]/[action]/route";
import { GET as meGET } from "@/app/api/me/route";
import { GET as myCourseGET, POST as myCoursePOST } from "@/app/api/me/courses/[course]/[action]/route";
import { GET as exportGET } from "@/app/api/me/export/route";
import { POST as signOutPOST } from "@/app/api/me/sign-out/route";
import { getCourseAnalytics } from "@/server/admin/student-analytics";
import { deleteStudent, listStudents, resetStudentPassword, setStudentActive } from "@/server/admin/students";
import { listPracticeTopics } from "@/server/assessments/catalog";
import { accountFromRequest } from "@/server/auth/request-session";
import { createSession, findSession } from "@/server/auth/sessions";
import { signIn } from "@/server/auth/sign-in";
import { type CourseScope, resolveCourse } from "@/server/courses/scope";
import { listExercises } from "@/server/exercises/catalog";
import { changePassword, deleteOwnAccount, getAccount, recoverWithCode, registerStudent, replaceRecoveryCode } from "@/server/students/accounts";
import { getCourseDashboard, listCourseCards } from "@/server/students/dashboard";
import { exportAccountData } from "@/server/students/export";
import { getAttemptReview, listAttempts, listPracticeAnswers } from "@/server/students/history";
import { getCourseState, getDraft, listBookmarks, saveDraft, setBookmark, setLectureStatus } from "@/server/students/progress";
import { course as adminCourse, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";
import { STUDENT_PASSWORD, makeStudent } from "./student-helpers";

const CPP = "programming-fundamentals";
const PY = "programming-applications";

beforeAll(async () => {
  await migrate();
  await loadRealSeed();
});

async function scope(slug: string): Promise<CourseScope> {
  const found = await resolveCourse(slug);
  if (!found) throw new Error(`no course ${slug}`);
  return found;
}

async function liveLecture(courseSlug: string): Promise<string> {
  const row = await env.DB.prepare(
    "SELECT l.slug FROM lessons l JOIN courses c ON c.id = l.course_id WHERE c.slug = ? AND l.status = 'published' ORDER BY l.sort_order LIMIT 1",
  )
    .bind(courseSlug)
    .first<{ slug: string }>();
  return row!.slug;
}

async function correctOptionIds(exerciseId: string): Promise<string[]> {
  const rows = await env.DB.prepare("SELECT id FROM exercise_options WHERE exercise_id = ? AND is_correct = 1").bind(exerciseId).all<{ id: string }>();
  return rows.results.map((r) => r.id);
}

const origin = "http://localhost";
function req(path: string, init: { method?: string; cookie?: string; body?: unknown } = {}): Request {
  return new Request(`${origin}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.cookie ? { Cookie: init.cookie } : {}),
      ...(init.body !== undefined ? { "Content-Type": "application/json", Origin: origin } : {}),
      ...(init.method === "POST" ? { Origin: origin } : {}),
    },
    ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
  });
}

function courseAction(course: string, kind: string, slug: string, action: string, body: unknown, cookie?: string) {
  return coursePOST(req(`/api/courses/${course}/${kind}/${slug}/${action}`, { method: "POST", body, cookie }), {
    params: Promise.resolve({ course, kind, slug, action }),
  });
}

function mine(course: string, action: string, init: { method?: string; cookie?: string; body?: unknown; query?: string } = {}) {
  const request = req(`/api/me/courses/${course}/${action}${init.query ?? ""}`, init);
  const ctx = { params: Promise.resolve({ course, action }) };
  return init.method === "POST" ? myCoursePOST(request, ctx) : myCourseGET(request, ctx);
}

describe("student accounts", () => {
  it("signs up with name, email and password only, gets a student session and a recovery code", async () => {
    const bad = await registerStudent({ email: "not-an-email", name: "A", password: "short", turnstileToken: null, ip: null, userAgent: null });
    expect(bad).toMatchObject({ ok: false, fieldErrors: { email: expect.any(String), name: expect.any(String), password: expect.any(String) } });

    const sara = await makeStudent("Sara");
    expect(sara.recoveryCode).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    const session = await findSession(sara.token);
    expect(session?.idleMs).toBe(7 * 24 * 3600_000);
    const account = await accountFromRequest(req("/", { cookie: sara.cookie }));
    expect(account).toMatchObject({ id: sara.id, siteRoles: ["student"], studentSession: true });

    // The same email can't sign up twice (any case).
    const again = await registerStudent({ email: sara.email.toUpperCase(), name: "Sara", password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: null });
    expect(again).toMatchObject({ ok: false, fieldErrors: { email: expect.stringMatching(/already an account/) } });

    // Nothing but these is stored: no phone, no university id, and the recovery code only as a hash.
    const stored = await env.DB.prepare("SELECT value FROM verifications WHERE identifier = ?").bind(`recovery:${sara.id}`).first<{ value: string }>();
    expect(stored!.value).toMatch(/^[0-9a-f]{64}$/);
    expect(stored!.value).not.toContain(sara.recoveryCode.replace(/-/g, ""));
  });

  it("limits sign-ups from one address", async () => {
    const ip = "198.51.100.200";
    for (let i = 0; i < 20; i++) {
      const made = await registerStudent({ email: `burst${i}-${crypto.randomUUID().slice(0, 6)}@example.com`, name: "Burst", password: STUDENT_PASSWORD, turnstileToken: null, ip, userAgent: null });
      expect(made.ok).toBe(true);
    }
    const blocked = await registerStudent({ email: `burst-last@example.com`, name: "Burst", password: STUDENT_PASSWORD, turnstileToken: null, ip, userAgent: null });
    expect(blocked).toMatchObject({ ok: false, error: expect.stringMatching(/Too many attempts/) });
  });

  it("students sign in like staff, but a student session never opens the admin", async () => {
    const sara = await makeStudent();
    const signedIn = await signIn({ email: sara.email, password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: "test" });
    expect(signedIn).toMatchObject({ ok: true, isStaff: false });
    const me = await (await meGET(req("/api/me", { cookie: sara.cookie }))).json();
    expect(me).toEqual({ user: { name: "Sara", email: sara.email, isStaff: false, canOpenAdmin: false, title: "Student" } });
    expect(await (await meGET(req("/api/me"))).json()).toEqual({ user: null });
  });

  it("tells the header each staff account's title", async () => {
    const cv = await adminCourse("computer-vision");
    const accounts = [
      [await makeStaff("title-admin", "admin"), "Administrator"],
      [await makeStaff("title-course-admin", "editor", { [cv.id]: "course_admin" }), "Course admin"],
      [await makeStaff("title-editor", "editor", { [cv.id]: "editor" }), "Editor"],
    ] as const;
    for (const [actor, title] of accounts) {
      const { token } = await createSession(actor.staff.id, { ip: null, userAgent: "test" });
      const me = await (await meGET(req("/api/me", { cookie: `ce_session=${token}` }))).json();
      expect(me).toEqual({ user: { name: actor.staff.name, email: actor.staff.email, isStaff: true, canOpenAdmin: true, title } });
    }
  });

  it("recovers with the recovery code: new password, other devices signed out, a new code", async () => {
    const sara = await makeStudent();
    const wrong = await recoverWithCode({ email: sara.email, code: "AAAA-BBBB-CCCC-DDDD", password: "a brand new password", turnstileToken: null, ip: null, userAgent: null });
    expect(wrong).toMatchObject({ ok: false });
    const ok = await recoverWithCode({ email: sara.email, code: sara.recoveryCode.toLowerCase().replace(/-/g, " "), password: "a brand new password", turnstileToken: null, ip: null, userAgent: null });
    expect(ok).toMatchObject({ ok: true });
    expect(await findSession(sara.token)).toBeNull();
    // The used code no longer works; the new one does.
    const reuse = await recoverWithCode({ email: sara.email, code: sara.recoveryCode, password: "another new password", turnstileToken: null, ip: null, userAgent: null });
    expect(reuse.ok).toBe(false);
    if (!ok.ok) return;
    expect(ok.value.recoveryCode).not.toBe(sara.recoveryCode);
    expect(await signIn({ email: sara.email, password: "a brand new password", turnstileToken: null, ip: null, userAgent: null })).toMatchObject({ ok: true });
  });

  it("never recovers a staff account with a code", async () => {
    const admin = await makeStaff("admin-recover", "admin");
    const codes = await replaceRecoveryCode(admin.staff.id, "anything");
    expect(codes.ok).toBe(false);
  });

  it("changes the password (signing out other devices) and makes a new recovery code with the password", async () => {
    const sara = await makeStudent();
    const other = await signIn({ email: sara.email, password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: "phone" });
    const session = (await findSession(sara.token))!;
    const bad = await changePassword(sara.id, sara.email, session.id, { currentPassword: "nope", newPassword: "x", confirmPassword: "x" });
    expect(bad).toMatchObject({ ok: false, fieldErrors: { currentPassword: expect.any(String) } });
    const good = await changePassword(sara.id, sara.email, session.id, { currentPassword: STUDENT_PASSWORD, newPassword: "fresh new passphrase", confirmPassword: "fresh new passphrase" });
    expect(good.ok).toBe(true);
    expect(await findSession(sara.token)).not.toBeNull();
    if (other.ok) expect(await findSession(other.token)).toBeNull();
    expect((await replaceRecoveryCode(sara.id, "wrong password")).ok).toBe(false);
    const fresh = await replaceRecoveryCode(sara.id, "fresh new passphrase");
    expect(fresh).toMatchObject({ ok: true, value: { recoveryCode: expect.any(String) } });
    expect(await getAccount(sara.id)).toMatchObject({ hasRecoveryCode: true, isStaff: false, mustChangePassword: false });
  });

  it("signs out with POST only from this site, clearing the cookie", async () => {
    const sara = await makeStudent();
    const foreign = new Request(`${origin}/api/me/sign-out`, { method: "POST", headers: { Cookie: sara.cookie, Origin: "https://evil.example" } });
    expect((await signOutPOST(foreign)).status).toBe(403);
    const res = await signOutPOST(req("/api/me/sign-out", { method: "POST", cookie: sara.cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.getSetCookie()[0]).toMatch(/^ce_session=; Path=\/; Max-Age=0; HttpOnly/);
    expect(await findSession(sara.token)).toBeNull();
  });
});

describe("progress, bookmarks and drafts", () => {
  it("keeps lecture progress per course, never letting one course's lecture into another", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const py = await scope(PY);
    const lecture = await liveLecture(CPP);
    expect(await setLectureStatus(sara.id, cpp, lecture, "started")).toBe("started");
    expect(await setLectureStatus(sara.id, cpp, lecture, "completed")).toBe("completed");
    // Opening it again doesn't undo "done".
    expect(await setLectureStatus(sara.id, cpp, lecture, "started")).toBe("completed");
    expect(await setLectureStatus(sara.id, py, lecture, "completed")).toBeNull();
    expect((await getCourseState(sara.id, cpp)).lectures).toEqual({ [lecture]: "completed" });
    expect((await getCourseState(sara.id, py)).lectures).toEqual({});
    expect(await setLectureStatus(sara.id, cpp, lecture, "not_completed")).toBe("started");
  });

  it("saves through the API only for a signed-in student, from this site", async () => {
    const sara = await makeStudent();
    const lecture = await liveLecture(CPP);
    expect(await (await mine(CPP, "state")).json()).toEqual({ signedIn: false });
    expect((await mine(CPP, "progress", { method: "POST", body: { lecture, status: "completed" } })).status).toBe(401);
    const saved = await mine(CPP, "progress", { method: "POST", body: { lecture, status: "completed" }, cookie: sara.cookie });
    expect(await saved.json()).toEqual({ status: "completed" });
    const state = await (await mine(CPP, "state", { cookie: sara.cookie })).json();
    expect(state).toMatchObject({ signedIn: true, lectures: { [lecture]: "completed" } });
    expect((await mine(CPP, "state", { cookie: sara.cookie })).headers.get("Cache-Control")).toContain("no-store");
    const foreign = new Request(`${origin}/api/me/courses/${CPP}/progress`, {
      method: "POST",
      headers: { Cookie: sara.cookie, Origin: "https://evil.example", "Content-Type": "application/json" },
      body: JSON.stringify({ lecture, status: "completed" }),
    });
    expect((await myCoursePOST(foreign, { params: Promise.resolve({ course: CPP, action: "progress" }) })).status).toBe(403);
  });

  it("bookmarks lectures, questions and quizzes in their own course only", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const py = await scope(PY);
    const lecture = await liveLecture(CPP);
    const question = (await listExercises(cpp))[0]!;
    expect(await setBookmark(sara.id, cpp, "lecture", lecture, true)).toBe(true);
    expect(await setBookmark(sara.id, cpp, "question", question.slug, true)).toBe(true);
    expect(await setBookmark(sara.id, cpp, "quiz", "fundamentals-checkpoint", true)).toBe(true);
    expect(await setBookmark(sara.id, cpp, "lecture", lecture, true)).toBe(true); // twice is still one
    expect(await setBookmark(sara.id, py, "lecture", lecture, true)).toBeNull();
    expect(await setBookmark(sara.id, cpp, "quiz", "final-quiz-model-b", true)).toBeNull(); // models aren't public
    const list = await listBookmarks(sara.id, cpp);
    expect(list.map((b) => `${b.kind}:${b.slug}`).sort()).toEqual([`lecture:${lecture}`, "question:" + question.slug, "quiz:fundamentals-checkpoint"].sort());
    expect(list.find((b) => b.kind === "lecture")!.href).toBe(`/courses/${CPP}/lectures/${lecture}`);
    expect(await listBookmarks(sara.id, py)).toEqual([]);
    expect(await setBookmark(sara.id, cpp, "lecture", lecture, false)).toBe(false);
    expect((await getCourseState(sara.id, cpp)).bookmarks.sort()).toEqual(["question:" + question.slug, "quiz:fundamentals-checkpoint"].sort());
  });

  it("keeps code drafts for code questions only, per student", async () => {
    const sara = await makeStudent();
    const omar = await makeStudent("Omar");
    const cpp = await scope(CPP);
    const all = await listExercises(cpp);
    const code = all.find((q) => q.type === "write_code")!;
    const mcq = all.find((q) => q.type === "mcq")!;
    expect(await saveDraft(sara.id, cpp, code.slug, "int main() { return 0; }")).toBe(true);
    expect(await getDraft(sara.id, cpp, code.slug)).toMatchObject({ code: "int main() { return 0; }" });
    expect(await getDraft(omar.id, cpp, code.slug)).toBeNull();
    expect(await saveDraft(sara.id, cpp, mcq.slug, "x")).toBe(false);
    expect(await saveDraft(sara.id, await scope(PY), code.slug, "x")).toBe(false);
    expect(await saveDraft(sara.id, cpp, code.slug, "")).toBe(true);
    expect(await getDraft(sara.id, cpp, code.slug)).toBeNull();
  });
});

describe("answers, history and the dashboard", () => {
  it("records practice answers for signed-in students only", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const q = (await listExercises(cpp, { type: "mcq" }))[0]!;
    const right = await correctOptionIds(q.id);
    const before = await env.DB.prepare("SELECT count(*) AS n FROM exercise_attempts").first<{ n: number }>();
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: right } }); // a guest
    expect((await env.DB.prepare("SELECT count(*) AS n FROM exercise_attempts").first<{ n: number }>())!.n).toBe(before!.n);
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: ["wrong-id"] } }, sara.cookie);
    expect((await getCourseState(sara.id, cpp)).answers[q.slug]).toMatchObject({ status: "wrong" });
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: right } }, sara.cookie);
    // A later wrong answer never hides a success.
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: ["wrong-id"] } }, sara.cookie);
    expect((await getCourseState(sara.id, cpp)).answers[q.slug]).toMatchObject({ status: "correct" });
    const practice = await listPracticeAnswers(sara.id, cpp);
    expect(practice.map((p) => p.correct)).toEqual([false, true, false]);
    expect(await listPracticeAnswers(sara.id, await scope(PY))).toEqual([]);
  });

  it("keeps quiz attempts with every answer, and only their student can open the review", async () => {
    const sara = await makeStudent();
    const omar = await makeStudent("Omar");
    const cpp = await scope(CPP);
    const started = (await (await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "start", {}, sara.cookie)).json()) as { token: string; questions: { id: string; type: string }[] };
    const responses: Record<string, unknown> = {};
    for (const q of started.questions) if (q.type === "mcq") responses[q.id] = { kind: "mcq", selected: await correctOptionIds(q.id) };
    const res = await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "submit", { token: started.token, responses }, sara.cookie);
    expect(res.status).toBe(200);
    const result = (await res.json()) as { score: number; maxScore: number };

    const attempts = await listAttempts(sara.id, cpp);
    expect(attempts).toHaveLength(1);
    expect(attempts[0]).toMatchObject({ kind: "quiz", state: "submitted", score: result.score, maxScore: result.maxScore, retakeHref: `/courses/${CPP}/quizzes/fundamentals-checkpoint` });
    const review = await getAttemptReview(sara.id, cpp, attempts[0]!.id);
    expect(review!.questions).toHaveLength(started.questions.length);
    const mcq = review!.questions.find((q) => q.question.type === "mcq")!;
    expect(mcq).toMatchObject({ answered: true, correct: true });
    expect(mcq.review.correctOptionIds.length).toBeGreaterThan(0);
    // Not answered questions are kept as not answered, not as wrong answers.
    const skipped = review!.questions.filter((q) => q.question.type !== "mcq");
    expect(skipped.every((q) => !q.answered)).toBe(true);
    // Nobody else can open it, and it isn't in another course.
    expect(await getAttemptReview(omar.id, cpp, attempts[0]!.id)).toBeNull();
    expect(await getAttemptReview(sara.id, await scope(PY), attempts[0]!.id)).toBeNull();
    expect(await listAttempts(omar.id, cpp)).toEqual([]);
    // Submitting twice doesn't change the stored result.
    await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "submit", { token: started.token, responses: {} }, sara.cookie);
    expect((await listAttempts(sara.id, cpp))[0]!.score).toBe(result.score);
  });

  it("keeps practice exams and exams the student built", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const exam = (await (await courseAction(CPP, "exams", "fundamentals-practice-exam", "start", {}, sara.cookie)).json()) as { token: string };
    expect((await courseAction(CPP, "exams", "fundamentals-practice-exam", "submit", { token: exam.token, responses: {} }, sara.cookie)).status).toBe(200);
    const options = { topics: (await listPracticeTopics(cpp)).map((t) => t.slug), count: 10, minutes: 0, feedback: "after_submit" };
    const built = await courseAction(CPP, "custom", "exam", "start", { options }, sara.cookie);
    expect(built.status).toBe(200);
    const custom = (await built.json()) as { token: string };
    expect((await courseAction(CPP, "custom", "exam", "submit", { token: custom.token, responses: {} }, sara.cookie)).status).toBe(200);
    const kinds = (await listAttempts(sara.id, cpp)).map((a) => `${a.kind}:${a.state}`).sort();
    expect(kinds).toEqual(["custom:submitted", "exam:submitted"]);
    for (const a of await listAttempts(sara.id, cpp)) expect(await getAttemptReview(sara.id, cpp, a.id)).not.toBeNull();
  });

  it("builds the dashboard per course, with achievements and suggestions", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const q = (await listExercises(cpp, { type: "mcq" }))[0]!;
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: await correctOptionIds(q.id) } }, sara.cookie);
    await setLectureStatus(sara.id, cpp, await liveLecture(CPP), "completed");
    const d = await getCourseDashboard(sara.id, cpp);
    expect(d).toMatchObject({ lecturesDone: 1, questionsSolved: 1, answers: 1, right: 1 });
    expect(d.lecturesTotal).toBeGreaterThan(1);
    expect(d.achievements.filter((a) => a.earnedAt !== null).map((a) => a.slug).sort()).toEqual(["first-correct", "first-lecture"]);
    expect(d.recommendations.length).toBeGreaterThan(0);
    expect(d.streak.current).toBe(1);
    // Achievements are stored once.
    await getCourseDashboard(sara.id, cpp);
    const stored = await env.DB.prepare("SELECT count(*) AS n FROM student_achievements WHERE user_id = ?").bind(sara.id).first<{ n: number }>();
    expect(stored!.n).toBe(2);
    const cards = await listCourseCards(sara.id);
    expect(cards.find((c) => c.course.slug === CPP)).toMatchObject({ lecturesDone: 1, questionsSolved: 1 });
    expect(cards.find((c) => c.course.slug === PY)).toMatchObject({ lecturesDone: 0, questionsSolved: 0, lastActive: null });
  });
});

describe("the student's own data", () => {
  it("exports everything kept, without passwords, tokens or the recovery code", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    await setBookmark(sara.id, cpp, "lecture", await liveLecture(CPP), true);
    const res = await exportGET(req("/api/me/export", { cookie: sara.cookie }));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toMatch(/attachment; filename="code-expert-my-data-/);
    const text = await res.text();
    expect(text).toContain(sara.email);
    expect(text).not.toContain(sara.token);
    expect(text).not.toMatch(/\$|scrypt|pbkdf2/i);
    expect(text).not.toContain(sara.recoveryCode);
    expect(((await exportAccountData(sara.id)) as { bookmarks: unknown[] }).bookmarks).toHaveLength(1);
    expect((await exportGET(req("/api/me/export"))).status).toBe(401);
  });

  it("deletes the account and everything saved with it", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    await setLectureStatus(sara.id, cpp, await liveLecture(CPP), "completed");
    await setBookmark(sara.id, cpp, "quiz", "fundamentals-checkpoint", true);
    const q = (await listExercises(cpp, { type: "mcq" }))[0]!;
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: [] } }, sara.cookie);
    await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "start", {}, sara.cookie);
    await getCourseDashboard(sara.id, cpp);

    expect(await deleteOwnAccount(sara.id, { confirm: "delete", password: STUDENT_PASSWORD })).toMatchObject({ ok: false, fieldErrors: { confirm: expect.any(String) } });
    expect(await deleteOwnAccount(sara.id, { confirm: "DELETE", password: "wrong" })).toMatchObject({ ok: false });
    expect(await deleteOwnAccount(sara.id, { confirm: "DELETE", password: STUDENT_PASSWORD })).toMatchObject({ ok: true });
    for (const table of ["users", "accounts", "sessions", "user_roles", "student_progress", "bookmarks", "exercise_attempts", "quiz_attempts", "student_achievements", "code_submissions"]) {
      const column = table === "users" ? "id" : "user_id";
      const left = await env.DB.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${column} = ?`).bind(sara.id).first<{ n: number }>();
      expect(left!.n, table).toBe(0);
    }
    const codes = await env.DB.prepare("SELECT count(*) AS n FROM verifications WHERE identifier LIKE ?").bind(`%${sara.id}`).first<{ n: number }>();
    expect(codes!.n).toBe(0);
  });

  it("staff accounts can't delete themselves here", async () => {
    const admin = await makeStaff("admin-self-delete", "admin");
    expect(await deleteOwnAccount(admin.staff.id, { confirm: "DELETE", password: "x" })).toMatchObject({ ok: false });
  });
});

describe("students in the admin", () => {
  it("only administrators list and manage student accounts, and staff never appear as students", async () => {
    const admin = await makeStaff("admin-students", "admin");
    const cv = await adminCourse("computer-vision");
    const editor = await makeStaff("editor-students", "editor", { [cv.id]: "editor" });
    const sara = await makeStudent("Sara Findme");
    expect((await listStudents(editor, "")).rows).toEqual([]);
    const found = await listStudents(admin, "findme");
    expect(found.rows.map((r) => r.id)).toEqual([sara.id]);
    expect((await listStudents(admin, "")).rows.some((r) => r.id === admin.staff.id || r.id === editor.staff.id)).toBe(false);
    // LIKE wildcards are matched literally.
    expect((await listStudents(admin, "%")).rows).toEqual([]);

    expect((await resetStudentPassword(editor, sara.id)).ok).toBe(false);
    const reset = await resetStudentPassword(admin, sara.id);
    expect(reset).toMatchObject({ ok: true, value: { temporaryPassword: expect.any(String) } });
    expect(await findSession(sara.token)).toBeNull();
    if (reset.ok) expect(await signIn({ email: sara.email, password: reset.value.temporaryPassword, turnstileToken: null, ip: null, userAgent: null })).toMatchObject({ ok: true });
    expect(await getAccount(sara.id)).toMatchObject({ mustChangePassword: true });
    // Staff aren't touched from here.
    expect((await resetStudentPassword(admin, editor.staff.id)).ok).toBe(false);

    expect((await setStudentActive(admin, sara.id, false)).ok).toBe(true);
    expect(await signIn({ email: sara.email, password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: null })).toMatchObject({ ok: false });
    expect((await setStudentActive(admin, sara.id, true)).ok).toBe(true);

    expect(await deleteStudent(admin, sara.id, "someone@else.com")).toMatchObject({ ok: false });
    expect(await deleteStudent(admin, sara.id, sara.email)).toMatchObject({ ok: true });
    expect(await env.DB.prepare("SELECT 1 FROM users WHERE id = ?").bind(sara.id).first()).toBeNull();
    const log = await env.DB.prepare("SELECT action FROM admin_audit_logs WHERE entity_id = ? ORDER BY created_at, rowid").bind(sara.id).all<{ action: string }>();
    expect(log.results.map((r) => r.action)).toEqual(["student.reset_password", "student.disable", "student.enable", "student.delete"]);
  });

  it("course analytics count students in that course only, never staff", async () => {
    const admin = await makeStaff("admin-analytics", "admin");
    const cppAdmin = await adminCourse(CPP);
    const pyAdmin = await adminCourse(PY);
    const cvEditor = await makeStaff("editor-analytics", "editor", { [(await adminCourse("computer-vision")).id]: "editor" });
    const before = await getCourseAnalytics(admin, cppAdmin);
    if ("error" in before) throw new Error(before.error);

    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const q = (await listExercises(cpp, { type: "mcq" }))[0]!;
    await courseAction(CPP, "exercises", q.slug, "check", { response: { selected: await correctOptionIds(q.id) } }, sara.cookie);
    await setLectureStatus(sara.id, cpp, await liveLecture(CPP), "completed");
    // A staff member answering while signed in isn't counted.
    await env.DB.prepare("INSERT INTO exercise_attempts (id, course_id, exercise_id, user_id, response, is_correct, created_at) VALUES ('exa_staff', ?, ?, ?, '{}', 0, ?)")
      .bind(cpp.courseId, q.id, admin.staff.id, Date.now())
      .run();

    const after = await getCourseAnalytics(admin, cppAdmin);
    if ("error" in after) throw new Error(after.error);
    expect(after.students.ever).toBe(before.students.ever + 1);
    expect(after.students.active7).toBe(before.students.active7 + 1);
    expect(after.answers).toBe(before.answers + 1);
    expect(after.right).toBe(before.right + 1);
    expect(after.lecturesCompleted).toBe(before.lecturesCompleted + 1);
    expect(after.trend).toHaveLength(8);
    expect(after.trend.at(-1)!.answers).toBeGreaterThanOrEqual(1);
    expect(after.quizzes.some((x) => x.slug === "final-quiz-model-b")).toBe(false);
    expect(after.lectures.length).toBeGreaterThan(0);

    const py = await getCourseAnalytics(admin, pyAdmin);
    if ("error" in py) throw new Error(py.error);
    expect(py.answers).toBe(0);
    expect(await getCourseAnalytics(cvEditor, cppAdmin)).toEqual({ error: expect.any(String) });
  });
});
