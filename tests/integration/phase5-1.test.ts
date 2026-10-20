// Phase 5.1 audit: regression tests for the defects found and fixed, and a
// sweep of cross-course requests through every public and personal endpoint.
//
//   B01  a browser's own test count was saved as a mark (write the code, and
//        correct-the-code fixes that don't match a known fix)
//   B04  two submissions of one attempt at the same moment: the later one
//        replaced the first one's stored answers
//   B06  `id TEXT PRIMARY KEY` accepted NULL (migration 0006 triggers)
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { POST as coursePOST } from "@/app/api/courses/[course]/[kind]/[slug]/[action]/route";
import { GET as myCourseGET, POST as myCoursePOST } from "@/app/api/me/courses/[course]/[action]/route";
import { GET as resourceFileGET } from "@/app/(site)/courses/[course]/resources/[resource]/files/[role]/route";
import { getCourseAnalytics } from "@/server/admin/student-analytics";
import { readAttemptClaims, startAttempt, submitAttempt } from "@/server/assessments/attempts";
import { type CourseScope, resolveCourse } from "@/server/courses/scope";
import { listExercises } from "@/server/exercises/catalog";
import { getCourseDashboard } from "@/server/students/dashboard";
import { exportAccountData } from "@/server/students/export";
import { getAttemptReview, listAttempts, listPracticeAnswers } from "@/server/students/history";
import { getCourseState } from "@/server/students/progress";
import { recordStart, recordSubmit } from "@/server/students/attempts";
import { course as adminCourse, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";
import { makeStudent } from "./student-helpers";

const CPP = "programming-fundamentals";
const PY = "programming-applications";
const CV = "computer-vision";

beforeAll(async () => {
  await migrate();
  await loadRealSeed();
});

async function scope(slug: string): Promise<CourseScope> {
  const found = await resolveCourse(slug);
  if (!found) throw new Error(`no course ${slug}`);
  return found;
}

const origin = "http://localhost";
function req(path: string, init: { method?: string; cookie?: string; body?: unknown } = {}): Request {
  return new Request(`${origin}${path}`, {
    method: init.method ?? "GET",
    headers: {
      ...(init.cookie ? { Cookie: init.cookie } : {}),
      ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
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

async function referenceSolution(exerciseId: string): Promise<string> {
  const row = await env.DB.prepare("SELECT value FROM exercise_answers WHERE exercise_id = ? AND kind = 'reference_solution'").bind(exerciseId).first<{ value: string }>();
  return row!.value;
}

async function storedPractice(userId: string): Promise<{ isCorrect: number | null; selfCheck: string | null }[]> {
  const rows = await env.DB.prepare("SELECT is_correct AS isCorrect, self_check AS selfCheck FROM exercise_attempts WHERE user_id = ? ORDER BY created_at, rowid")
    .bind(userId)
    .all<{ isCorrect: number | null; selfCheck: string | null }>();
  return rows.results;
}

/** Published, non-reserved questions of a type with no ask (a plain write-the-code or correct-the-code question). */
async function plainQuestion(courseSlug: string, type: "write_code" | "correct_code") {
  const all = await listExercises(await scope(courseSlug), { type });
  const q = all.find((x) => !x.ask);
  if (!q) throw new Error(`no ${type} question in ${courseSlug}`);
  return q;
}

describe("B01: browser test counts are never stored as marks", () => {
  it("write the code: a browser report of 'all tests passed' is kept as a self-check, not a mark", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const q = await plainQuestion(CPP, "write_code");
    // What any student could send by hand: no program at all, and "3 of 3 passed".
    const res = await courseAction(CPP, "exercises", q.slug, "check", { response: { code: "int main() {}", tests: { passed: 3, total: 3 } } }, sara.cookie);
    expect(res.status).toBe(200);
    expect(((await res.json()) as { correct: boolean | null }).correct).toBeNull();
    expect(await storedPractice(sara.id)).toEqual([{ isCorrect: null, selfCheck: "passed" }]);

    // It shows as "passed in your browser", never as solved, and counts for nothing.
    expect((await getCourseState(sara.id, cpp)).answers[q.slug]).toMatchObject({ status: "passed_tests" });
    const dash = await getCourseDashboard(sara.id, cpp);
    expect(dash.questionsSolved).toBe(0);
    expect(dash.right).toBe(0);
    expect(dash.achievements.filter((a) => a.earnedAt !== null).map((a) => a.slug)).not.toContain("first-correct");
    const [row] = await listPracticeAnswers(sara.id, cpp);
    expect(row).toMatchObject({ correct: null, selfCheck: "passed" });
    const exported = (await exportAccountData(sara.id))!.practiceAnswers as { correct: unknown; testedInBrowser: unknown }[];
    expect(exported[0]).toMatchObject({ correct: null, testedInBrowser: "passed" });

    // A failing run is kept as a failed self-check, also not a mark.
    await courseAction(CPP, "exercises", q.slug, "check", { response: { code: "int main() {}", tests: { passed: 1, total: 3 } } }, sara.cookie);
    expect((await storedPractice(sara.id))[1]).toEqual({ isCorrect: null, selfCheck: "failed" });
    // The full pass earlier is not hidden by the later failure.
    expect((await getCourseState(sara.id, cpp)).answers[q.slug]).toMatchObject({ status: "passed_tests" });
  });

  it("correct the code: a known fix is a server mark; a different fix that passed in the browser is left unmarked", async () => {
    const omar = await makeStudent("Omar");
    const cpp = await scope(CPP);
    const q = await plainQuestion(CPP, "correct_code");
    const solution = await referenceSolution(q.id);

    // A fix that matches a known fix: right, whatever the browser says.
    await courseAction(CPP, "exercises", q.slug, "check", { response: { code: solution, tests: { passed: 0, total: 3 } } }, omar.cookie);
    // A different program (an extra empty statement) that the browser says passed: not marked either way.
    const different = solution.replace(/\{/, "{ ;");
    const review = (await (await courseAction(CPP, "exercises", q.slug, "check", { response: { code: different, tests: { passed: 3, total: 3 } } }, omar.cookie)).json()) as {
      correct: boolean | null;
      matchedSolution?: boolean;
    };
    expect(review).toMatchObject({ correct: false, matchedSolution: false });
    // The same different program with failing tests: wrong.
    await courseAction(CPP, "exercises", q.slug, "check", { response: { code: different, tests: { passed: 1, total: 3 } } }, omar.cookie);
    // Not run at all: wrong (as before).
    await courseAction(CPP, "exercises", q.slug, "check", { response: { code: different } }, omar.cookie);
    expect(await storedPractice(omar.id)).toEqual([
      { isCorrect: 1, selfCheck: "failed" },
      { isCorrect: null, selfCheck: "passed" },
      { isCorrect: 0, selfCheck: "failed" },
      { isCorrect: 0, selfCheck: null },
    ]);
    expect((await getCourseState(omar.id, cpp)).answers[q.slug]).toMatchObject({ status: "correct" });
  });

  it("the admin's analytics count only server marks", async () => {
    const student = await makeStudent("Lina");
    const py = await scope(PY);
    const q = await plainQuestion(PY, "write_code");
    for (let i = 0; i < 5; i++) {
      await courseAction(PY, "exercises", q.slug, "check", { response: { code: "print(1)", tests: { passed: 2, total: 2 } } }, student.cookie);
    }
    const admin = await makeStaff("usr_p51_admin", "admin");
    const analytics = await getCourseAnalytics(admin, await adminCourse(PY));
    if ("error" in analytics) throw new Error(analytics.error);
    expect(analytics.right).toBe(0);
    expect(analytics.hardest.find((h) => h.slug === q.slug)).toBeUndefined();
    void py;
  });

  it("migration 0006 moves earlier write-the-code marks to self_check and leaves other marks alone", async () => {
    const zaid = await makeStudent("Zaid");
    const cpp = await scope(CPP);
    const write = await plainQuestion(CPP, "write_code");
    const mcq = (await listExercises(cpp, { type: "mcq" }))[0]!;
    // Rows as Phase 5 stored them: the browser's result in is_correct.
    await env.DB.batch([
      env.DB.prepare("INSERT INTO exercise_attempts (id, course_id, exercise_id, user_id, response, is_correct) VALUES ('exa_old1', ?, ?, ?, '{}', 1)").bind(cpp.courseId, write.id, zaid.id),
      env.DB.prepare("INSERT INTO exercise_attempts (id, course_id, exercise_id, user_id, response, is_correct) VALUES ('exa_old2', ?, ?, ?, '{}', 0)").bind(cpp.courseId, write.id, zaid.id),
      env.DB.prepare("INSERT INTO exercise_attempts (id, course_id, exercise_id, user_id, response, is_correct) VALUES ('exa_old3', ?, ?, ?, '{}', 1)").bind(cpp.courseId, mcq.id, zaid.id),
    ]);
    const migration = env.TEST_MIGRATIONS.find((m) => m.name.startsWith("0006_"))!;
    const update = migration.queries.find((sql) => sql.includes("UPDATE exercise_attempts"))!;
    await env.DB.prepare(update).run();
    const rows = await env.DB.prepare("SELECT id, is_correct AS isCorrect, self_check AS selfCheck FROM exercise_attempts WHERE user_id = ? ORDER BY id")
      .bind(zaid.id)
      .all();
    expect(rows.results).toEqual([
      { id: "exa_old1", isCorrect: null, selfCheck: "passed" },
      { id: "exa_old2", isCorrect: null, selfCheck: "failed" },
      { id: "exa_old3", isCorrect: 1, selfCheck: null },
    ]);
  });
});

describe("B04: one attempt is stored once, even when it is submitted twice at the same moment", () => {
  it("keeps the first submission when two arrive together", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const started = await startAttempt(cpp, "quiz", "fundamentals-checkpoint");
    const claims = (await readAttemptClaims(started.token))!;
    await recordStart(sara.id, claims);
    const correct: Record<string, unknown> = {};
    for (const q of started.questions) {
      if (q.type !== "mcq") continue;
      const right = await env.DB.prepare("SELECT id FROM exercise_options WHERE exercise_id = ? AND is_correct = 1").bind(q.id).all<{ id: string }>();
      correct[q.id] = { selected: right.results.map((r) => r.id) };
    }
    const good = await submitAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, correct);
    const blank = await submitAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, {});
    expect(good.score).toBeGreaterThan(blank.score);

    // Both pass the "already submitted?" check before either writes.
    const kept = await Promise.all([recordSubmit(sara.id, claims, good, correct), recordSubmit(sara.id, claims, blank, {})]);
    expect(kept.filter(Boolean)).toHaveLength(1);
    const winner = kept[0] ? good : blank;
    const [attempt] = await listAttempts(sara.id, cpp);
    expect(attempt!.score).toBe(winner.score);
    // The stored answers belong to the same submission as the stored score.
    const review = await getAttemptReview(sara.id, cpp, attempt!.id);
    expect(review!.questions.reduce((n, q) => n + q.pointsAwarded, 0)).toBe(winner.score);
  });

  it("a later submission of a submitted attempt changes nothing", async () => {
    const sara = await makeStudent();
    const cpp = await scope(CPP);
    const exam = (await (await courseAction(CPP, "exams", "fundamentals-practice-exam", "start", {}, sara.cookie)).json()) as { token: string };
    expect((await courseAction(CPP, "exams", "fundamentals-practice-exam", "submit", { token: exam.token, responses: {} }, sara.cookie)).status).toBe(200);
    const claims = (await readAttemptClaims(exam.token))!;
    const fake = { ...(await submitAttempt(cpp, "exam", "fundamentals-practice-exam", exam.token, {})), score: 999 };
    expect(await recordSubmit(sara.id, claims, fake, {})).toBe(false);
    expect((await listAttempts(sara.id, cpp))[0]!.score).toBe(0);
  });
});

describe("B06: text primary keys refuse NULL (migration 0006)", () => {
  it("refuses a NULL id on insert and update, and still accepts a real id", async () => {
    await expect(env.DB.prepare("INSERT INTO users (id, email) VALUES (NULL, 'null-id@example.com')").run()).rejects.toThrow(/users\.id may not be NULL/);
    await env.DB.prepare("INSERT INTO users (id, email) VALUES ('usr_p51_real', 'real-id@example.com')").run();
    await expect(env.DB.prepare("UPDATE users SET id = NULL WHERE id = 'usr_p51_real'").run()).rejects.toThrow(/users\.id may not be NULL/);
    await expect(env.DB.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (NULL, 0, 1)").run()).rejects.toThrow(/rate_limits\.key may not be NULL/);
  });

  it("covers every table whose primary key is a single TEXT column, and none holds a NULL key", async () => {
    const tables = await env.DB.prepare(
      `SELECT m.name AS tableName, p.name AS col FROM sqlite_master m, pragma_table_info(m.name) p
        WHERE m.type = 'table' AND m.name NOT LIKE 'sqlite_%' AND m.name NOT LIKE '_cf_%' AND m.name <> 'd1_migrations' AND p.pk = 1 AND upper(p.type) = 'TEXT'
          AND (SELECT count(*) FROM pragma_table_info(m.name) q WHERE q.pk > 0) = 1`,
    ).all<{ tableName: string; col: string }>();
    expect(tables.results.length).toBeGreaterThan(30);
    const triggers = new Set(
      (await env.DB.prepare("SELECT name FROM sqlite_master WHERE type = 'trigger'").all<{ name: string }>()).results.map((r) => r.name),
    );
    for (const { tableName, col } of tables.results) {
      expect(triggers.has(`${tableName}_${col}_not_null_insert`), tableName).toBe(true);
      expect(triggers.has(`${tableName}_${col}_not_null_update`), tableName).toBe(true);
      const nulls = await env.DB.prepare(`SELECT count(*) AS n FROM ${tableName} WHERE ${col} IS NULL`).first<{ n: number }>();
      expect(nulls!.n, tableName).toBe(0);
    }
  });
});

describe("course isolation sweep: one course's things through another course's addresses", () => {
  /** A slug that exists in `from` and in no other course. */
  async function onlyIn(table: string, from: string, extra = "1 = 1"): Promise<string> {
    const row = await env.DB.prepare(
      `SELECT x.slug FROM ${table} x JOIN courses c ON c.id = x.course_id
        WHERE c.slug = ? AND ${extra} AND NOT EXISTS (SELECT 1 FROM ${table} y WHERE y.slug = x.slug AND y.course_id <> x.course_id) LIMIT 1`,
    )
      .bind(from)
      .first<{ slug: string }>();
    if (!row) throw new Error(`no ${table} only in ${from}`);
    return row.slug;
  }

  it("questions, quizzes and practice exams of course A are 'not found' under course B", async () => {
    const question = await onlyIn("exercises", CPP, "x.status = 'published'");
    const quiz = await onlyIn("quizzes", CPP, "x.status = 'published'");
    const exam = await onlyIn("exam_templates", CPP, "x.status = 'published'");
    for (const other of [PY, CV]) {
      expect((await courseAction(other, "exercises", question, "check", { response: { selected: [] } })).status).toBe(404);
      expect((await courseAction(other, "quizzes", quiz, "start", {})).status).toBe(404);
      expect((await courseAction(other, "quizzes", quiz, "status", {})).status).toBe(404);
      expect((await courseAction(other, "exams", exam, "start", {})).status).toBe(404);
    }
    // Control: the same requests work in their own course.
    expect((await courseAction(CPP, "quizzes", quiz, "start", {})).status).not.toBe(404);
  });

  it("an attempt token from course A is refused by course B's submit and check", async () => {
    const started = (await (await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "start", {})).json()) as { token: string; questions: { id: string }[] };
    const pyQuiz = await onlyIn("quizzes", PY, "x.status = 'published'");
    const submit = await courseAction(PY, "quizzes", pyQuiz, "submit", { token: started.token, responses: {} });
    expect(submit.status).toBe(400);
    const check = await courseAction(PY, "quizzes", pyQuiz, "check", { token: started.token, exerciseId: started.questions[0]!.id, response: { selected: [] } });
    expect([400, 403]).toContain(check.status);
  });

  it("a student's lecture progress, bookmarks and drafts can't cross courses, and course B shows nothing of course A", async () => {
    const sara = await makeStudent();
    const lecture = await onlyIn("lessons", CPP, "x.status = 'published'");
    const question = await onlyIn("exercises", CPP, "x.status = 'published' AND x.type IN ('write_code', 'correct_code')");
    expect((await mine(PY, "progress", { method: "POST", cookie: sara.cookie, body: { lecture, status: "completed" } })).status).toBe(404);
    expect((await mine(PY, "bookmark", { method: "POST", cookie: sara.cookie, body: { kind: "lecture", slug: lecture, on: true } })).status).toBe(404);
    expect((await mine(PY, "draft", { method: "POST", cookie: sara.cookie, body: { question, code: "x" } })).status).toBe(400);
    // Control in the right course.
    expect((await mine(CPP, "progress", { method: "POST", cookie: sara.cookie, body: { lecture, status: "completed" } })).status).toBe(200);
    expect((await mine(CPP, "bookmark", { method: "POST", cookie: sara.cookie, body: { kind: "lecture", slug: lecture, on: true } })).status).toBe(200);
    const inPy = (await (await mine(PY, "state", { cookie: sara.cookie })).json()) as { lectures: object; bookmarks: string[]; answers: object };
    expect(inPy).toMatchObject({ lectures: {}, bookmarks: [], answers: {} });
    const draftInPy = (await (await mine(PY, "draft", { cookie: sara.cookie, query: `?question=${question}` })).json()) as { draft: unknown };
    expect(draftInPy.draft).toBeNull();
  });

  it("an attempt review of course A can't be opened through course B", async () => {
    const sara = await makeStudent();
    const started = (await (await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "start", {}, sara.cookie)).json()) as { token: string };
    await courseAction(CPP, "quizzes", "fundamentals-checkpoint", "submit", { token: started.token, responses: {} }, sara.cookie);
    const [attempt] = await listAttempts(sara.id, await scope(CPP));
    expect(await getAttemptReview(sara.id, await scope(CPP), attempt!.id)).not.toBeNull();
    for (const other of [PY, CV]) {
      expect(await getAttemptReview(sara.id, await scope(other), attempt!.id)).toBeNull();
      expect(await listAttempts(sara.id, await scope(other))).toEqual([]);
    }
  });

  it("a resource file of course A is not served through course B", async () => {
    const cpp = await scope(CPP);
    await env.DB.batch([
      env.DB.prepare("INSERT INTO resources (id, course_id, slug, title, kind, status, access) VALUES ('res_p51', ?, 'p51-slides', 'Slides', 'presentation', 'published', 'public')").bind(cpp.courseId),
      env.DB.prepare(
        "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) VALUES ('rf_p51', ?, 'res_p51', 'preview', ?, 'slides.pdf', 'application/pdf', 9, 'x')",
      ).bind(cpp.courseId, `courses/${cpp.courseId}/resources/res_p51/slides.pdf`),
    ]);
    await env.FILES.put(`courses/${cpp.courseId}/resources/res_p51/slides.pdf`, "%PDF-1.4\n");
    const get = (course: string) =>
      resourceFileGET(new Request(`${origin}/courses/${course}/resources/p51-slides/files/preview`), {
        params: Promise.resolve({ course, resource: "p51-slides", role: "preview" }),
      });
    expect((await get(CPP)).status).toBe(200);
    expect((await get(PY)).status).toBe(404);
    expect((await get(CV)).status).toBe(404);
  });
});
