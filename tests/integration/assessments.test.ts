// Phase 3: the exercise catalog, marking, quizzes and practice exams against
// the real seed (seed/0003_exercises.sql). The rules checked here: answer keys
// never reach the browser before an answer is marked, everything stays inside
// its course, and exam-mode feedback only arrives on submit.
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";
import { GET as apiGET, POST } from "@/app/api/courses/[course]/[kind]/[slug]/[action]/route";
import sitemap from "@/app/sitemap";
import { signAttempt } from "@/lib/grading/attempt-token";
import { checkInAttempt, startAttempt, startCustomAttempt, submitAttempt } from "@/server/assessments/attempts";
import { getExam, getQuiz, getQuizQuestions, listExams, listPracticeTopics, listQuizzes } from "@/server/assessments/catalog";
import { type CourseScope, resolveCourse } from "@/server/courses/scope";
import { getPublicExercise, getPublicExercises, idsForSlugs, listExercises, listLessonExercises } from "@/server/exercises/catalog";
import { getAssessmentSecret } from "@/server/platform/env";
import { signIn } from "@/server/auth/sign-in";
import { loadRealSeed, migrate } from "./db-helpers";
import { STUDENT_PASSWORD, makeStudent } from "./student-helpers";

const CPP = "programming-fundamentals";
const PY = "programming-applications";
const CV = "computer-vision";

beforeAll(async () => {
  await migrate();
  await loadRealSeed();
});

async function scope(slug: string): Promise<CourseScope> {
  const course = await resolveCourse(slug);
  if (!course) throw new Error(`no course ${slug}`);
  return course;
}

async function correctOptionIds(exerciseId: string): Promise<string[]> {
  const rows = await env.DB.prepare("SELECT id FROM exercise_options WHERE exercise_id = ? AND is_correct = 1").bind(exerciseId).all<{ id: string }>();
  return rows.results.map((r) => r.id);
}

async function answer(exerciseId: string, kind: string): Promise<string> {
  const row = await env.DB.prepare("SELECT value FROM exercise_answers WHERE exercise_id = ? AND kind = ? ORDER BY sort_order LIMIT 1")
    .bind(exerciseId, kind)
    .first<{ value: string }>();
  if (!row) throw new Error(`no ${kind} for ${exerciseId}`);
  return row.value;
}

function post(course: string, kind: string, slug: string, action: string, body?: unknown) {
  const request = new Request(`http://localhost/api/courses/${course}/${kind}/${slug}/${action}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return POST(request, { params: Promise.resolve({ course, kind, slug, action }) });
}

describe("the question catalog", () => {
  it("has at least the brief's starter set (12 MCQ, 8 trace, 8 correct, 8 write), never listing reserved questions", async () => {
    const all = (await Promise.all([CPP, PY, CV].map(async (c) => listExercises(await scope(c))))).flat();
    const types = all.map((e) => e.type);
    expect(types.filter((t) => t === "mcq").length).toBeGreaterThanOrEqual(12);
    expect(types.filter((t) => t === "trace").length).toBeGreaterThanOrEqual(8);
    expect(types.filter((t) => t === "correct_code").length).toBeGreaterThanOrEqual(8);
    expect(types.filter((t) => t === "write_code").length).toBeGreaterThanOrEqual(8);
    expect(all.some((e) => e.slug.startsWith("final-"))).toBe(false);
  });

  it("keeps each course's questions to itself", async () => {
    const py = await scope(PY);
    const cpp = await scope(CPP);
    expect(await getPublicExercise(py, "string-negative-index")).not.toBeNull();
    expect(await getPublicExercise(cpp, "string-negative-index")).toBeNull();
    const pyIds = (await listExercises(py)).map((e) => e.id);
    // Ids from another course are dropped, not served.
    expect(await getPublicExercises(cpp, pyIds)).toEqual([]);
    expect(await idsForSlugs(cpp, ["string-negative-index", "trace-countdown-by-twos"])).toHaveLength(1);
  });

  it("filters by type, difficulty and lecture", async () => {
    const cpp = await scope(CPP);
    const traces = await listExercises(cpp, { type: "trace" });
    expect(traces.length).toBeGreaterThan(0);
    expect(traces.every((e) => e.type === "trace")).toBe(true);
    const easy = await listExercises(cpp, { difficulty: "easy" });
    expect(easy.every((e) => e.difficulty === "easy")).toBe(true);
    const lesson = await env.DB.prepare("SELECT lesson_id AS id FROM exercises WHERE slug = 'correct-sum-1-to-n'").first<{ id: string }>();
    const forLesson = await listLessonExercises(cpp, lesson!.id);
    expect(forLesson.map((e) => e.slug)).toContain("correct-sum-1-to-n");
  });

  it("never sends answers, solutions, explanations or hidden tests to the browser", async () => {
    for (const c of [CPP, PY, CV]) {
      const s = await scope(c);
      const ids = (await listExercises(s)).map((e) => e.id);
      const text = JSON.stringify(await getPublicExercises(s, ids));
      expect(text).not.toMatch(/"(isCorrect|is_correct|correct|feedbackMd|feedback_md|solution|explanation\w*|accepted\w*|traceOutput|steps)"/);
      // A trace answer and a model solution, verbatim, must not appear anywhere.
      for (const id of ids) {
        const out = await env.DB.prepare("SELECT value FROM exercise_answers WHERE exercise_id = ? AND kind = 'reference_solution'").bind(id).first<{ value: string }>();
        if (out) expect(text).not.toContain(JSON.stringify(out.value).slice(1, -1));
      }
      const hidden = await env.DB.prepare(
        "SELECT expected_stdout AS s FROM exercise_test_cases WHERE course_id = ? AND is_hidden = 1",
      )
        .bind(s.courseId)
        .all<{ s: string }>();
      for (const h of hidden.results) expect(text).not.toContain(JSON.stringify(h.s).slice(1, -1));
    }
  });
});

describe("POST …/exercises/<slug>/check", () => {
  it("marks a right and a wrong multiple choice answer, with feedback after", async () => {
    const q = await getPublicExercise(await scope(CPP), "while-semicolon-after-condition");
    const right = await correctOptionIds(q!.id);
    const wrong = q!.options.map((o) => o.id).filter((id) => !right.includes(id));

    const ok = await post(CPP, "exercises", q!.slug, "check", { response: { selected: right } });
    expect(ok.status).toBe(200);
    const okReview = (await ok.json()) as { correct: boolean; correctOptionIds: string[]; explanationHtml: string };
    expect(okReview.correct).toBe(true);
    expect(okReview.correctOptionIds).toEqual(right);
    expect(okReview.explanationHtml.length).toBeGreaterThan(20);

    const no = await post(CPP, "exercises", q!.slug, "check", { response: { selected: [wrong[0]] } });
    expect(((await no.json()) as { correct: boolean }).correct).toBe(false);
  });

  it("marks a trace answer, forgiving trailing spaces", async () => {
    const q = await getPublicExercise(await scope(CPP), "trace-countdown-by-twos");
    const expected = await answer(q!.id, "trace_output");
    const res = await post(CPP, "exercises", q!.slug, "check", { response: { answer: `${expected.trimEnd()}  \n` } });
    const review = (await res.json()) as { correct: boolean; expectedOutput: string; steps: unknown[] };
    expect(review.correct).toBe(true);
    expect(review.expectedOutput).toBe(expected);
    expect(review.steps.length).toBeGreaterThan(0);
  });

  it("accepts any listed fix for correct-the-code, ignoring layout", async () => {
    const q = await getPublicExercise(await scope(CPP), "correct-sum-1-to-n");
    const solution = await answer(q!.id, "reference_solution");
    const squashed = solution.replace(/\n\s*/g, " ");
    const good = await post(CPP, "exercises", q!.slug, "check", { response: { code: squashed } });
    expect(((await good.json()) as { correct: boolean; matchedSolution: string }).correct).toBe(true);
    const accepted = await answer(q!.id, "accepted_solution");
    const alt = await post(CPP, "exercises", q!.slug, "check", { response: { code: accepted } });
    expect(((await alt.json()) as { correct: boolean }).correct).toBe(true);
    const broken = await post(CPP, "exercises", q!.slug, "check", { response: { code: q!.code } });
    expect(((await broken.json()) as { correct: boolean }).correct).toBe(false);
  });

  it("returns the model solution for write-the-code without marking it (tests ran in the browser)", async () => {
    const res = await post(CPP, "exercises", "write-even-numbers-up-to-n", "check", { response: { code: "int main() {}", tests: { passed: 0, total: 3 } } });
    const review = (await res.json()) as { correct: boolean | null; solution: string };
    expect(review.correct).toBeNull();
    expect(review.solution).toContain("main");
  });

  it("refuses another course's question, junk answers, unknown actions and GET", async () => {
    expect((await post(CPP, "exercises", "string-negative-index", "check", { response: { selected: [] } })).status).toBe(404);
    expect((await post("no-such-course", "exercises", "x", "check", {})).status).toBe(404);
    expect((await post(CPP, "exercises", "trace-countdown-by-twos", "check", { response: { answer: 42 } })).status).toBe(400);
    expect((await post(CPP, "exercises", "trace-countdown-by-twos", "delete", {})).status).toBe(404);
    expect((await post(CPP, "quizzes", "fundamentals-checkpoint", "nope", {})).status).toBe(404);
    expect(apiGET().status).toBe(405);
    const notJson = new Request("http://localhost/x", { method: "POST", headers: { "Content-Type": "text/plain" }, body: "{}" });
    const res = await POST(notJson, { params: Promise.resolve({ course: CPP, kind: "exercises", slug: "trace-countdown-by-twos", action: "check" }) });
    expect(res.status).toBe(400);
  });
});

describe("quizzes", () => {
  it("lists each course's own quizzes and exams", async () => {
    const cppQuizzes = (await listQuizzes(await scope(CPP))).map((q) => q.slug);
    expect(cppQuizzes).toEqual(expect.arrayContaining(["fundamentals-checkpoint", "loops-timed-quiz", "final-quiz", "final-quiz-practice", "for-loops-quiz"]));
    expect((await listQuizzes(await scope(PY))).map((q) => q.slug).sort()).toEqual([
      "input-and-output-quiz", "lists-quiz", "objects-quiz", "operators-quiz", "python-graphics-quiz",
      "python-introduction-quiz", "strings-and-lists-checkpoint", "strings-quiz", "variables-and-data-types-quiz",
    ]);
    expect((await listQuizzes(await scope(CV))).map((q) => q.slug).sort()).toEqual([
      "brightness-and-contrast-quiz", "digital-images-quiz", "edge-detection-quiz", "feature-detection-quiz",
      "feature-matching-quiz", "filtering-quiz", "image-enhancement-quiz", "image-resizing-quiz",
      "introduction-to-computer-vision-quiz", "jetson-projects-quiz", "noise-reduction-quiz",
      "pixels-and-color-channels-quiz", "pixels-checkpoint", "reading-and-displaying-images-quiz",
    ]);
    expect(await getQuiz(await scope(PY), "fundamentals-checkpoint")).toBeNull();
    expect((await listExams(await scope(CPP))).map((e) => e.slug)).toEqual(["fundamentals-practice-exam"]);
    expect(await listExams(await scope(PY))).toEqual([]);
  });

  it("runs a practice quiz: start, check one answer, submit and score", async () => {
    const cpp = await scope(CPP);
    const started = await startAttempt(cpp, "quiz", "fundamentals-checkpoint");
    expect(started.feedback).toBe("immediate");
    expect(started.deadlineAt).toBeNull();
    expect(started.questions.every((q) => q.type !== "write_code")).toBe(true);
    expect(started.questions[0]?.hintsHtml.length).toBeGreaterThan(0);

    const responses: Record<string, unknown> = {};
    for (const q of started.questions) {
      if (q.type === "mcq") responses[q.id] = { selected: await correctOptionIds(q.id) };
      else if (q.type === "trace") responses[q.id] = { answer: await answer(q.id, "trace_output") };
      else responses[q.id] = { code: await answer(q.id, "reference_solution") };
    }
    const first = started.questions[0]!;
    const review = await checkInAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, first.id, responses[first.id]);
    expect(review.correct).toBe(true);

    const result = await submitAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, responses);
    expect(result.percent).toBe(100);
    expect(result.passed).toBe(true);
    expect(result.score).toBe(result.maxScore);
    expect(result.maxScore).toBe(started.points.reduce((a, b) => a + b, 0));

    // Nothing answered: 0, not passed, each question marked "not answered".
    const blank = await submitAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, {});
    expect(blank.score).toBe(0);
    expect(blank.passed).toBe(false);
    expect(blank.questions.every((q) => !q.answered)).toBe(true);
  });

  it("exam mode: no hints, no marking before submit, and a deadline", async () => {
    const cpp = await scope(CPP);
    const now = Date.now();
    const started = await startAttempt(cpp, "quiz", "loops-timed-quiz", now);
    expect(started.feedback).toBe("after_submit");
    expect(started.deadlineAt).toBe(now + 15 * 60_000);
    expect(started.questions.every((q) => q.hintsHtml.length === 0)).toBe(true);
    const q = started.questions[0]!;
    await expect(checkInAttempt(cpp, "quiz", "loops-timed-quiz", started.token, q.id, { selected: [] })).rejects.toMatchObject({ status: 403 });
    const res = await post(CPP, "quizzes", "loops-timed-quiz", "check", { token: started.token, exerciseId: q.id, response: { selected: [] } });
    expect(res.status).toBe(403);

    // Too late: refused after the grace period, accepted just inside it.
    await expect(submitAttempt(cpp, "quiz", "loops-timed-quiz", started.token, {}, now + 15 * 60_000 + 61_000)).rejects.toMatchObject({ status: 409 });
    await expect(submitAttempt(cpp, "quiz", "loops-timed-quiz", started.token, {}, now + 15 * 60_000 + 30_000)).resolves.toBeTruthy();
  });

  it("refuses tampered, foreign and mismatched tokens", async () => {
    const cpp = await scope(CPP);
    const py = await scope(PY);
    const started = await startAttempt(cpp, "quiz", "fundamentals-checkpoint");
    await expect(submitAttempt(cpp, "quiz", "fundamentals-checkpoint", `${started.token}x`, {})).rejects.toMatchObject({ status: 400 });
    await expect(submitAttempt(cpp, "quiz", "loops-timed-quiz", started.token, {})).rejects.toMatchObject({ status: 400 });
    await expect(submitAttempt(cpp, "exam", "fundamentals-practice-exam", started.token, {})).rejects.toMatchObject({ status: 400 });
    // A token for another course's quiz, even well signed, is not valid here.
    const pyStarted = await startAttempt(py, "quiz", "strings-and-lists-checkpoint");
    await expect(submitAttempt(cpp, "quiz", "fundamentals-checkpoint", pyStarted.token, {})).rejects.toMatchObject({ status: 400 });
    // A question that isn't in the attempt can't be checked through it.
    const pyQuestion = pyStarted.questions[0]!.id;
    await expect(checkInAttempt(cpp, "quiz", "fundamentals-checkpoint", started.token, pyQuestion, { selected: [] })).rejects.toMatchObject({ status: 400 });
    // A forged token that adds another course's question: the signature fails.
    const forged = await signAttempt(
      { v: 1, kind: "quiz", courseId: cpp.courseId, refId: (await getQuiz(cpp, "fundamentals-checkpoint"))!.id, questions: [pyQuestion], points: [1], startedAt: 0, deadlineAt: null, nonce: "x" },
      "some-other-secret-0123456789-0123456789",
    );
    await expect(submitAttempt(cpp, "quiz", "fundamentals-checkpoint", forged, {})).rejects.toMatchObject({ status: 400 });
    // Signed with the real secret but listing another course's question: it isn't marked.
    const sneaky = await signAttempt(
      { v: 1, kind: "quiz", courseId: cpp.courseId, refId: (await getQuiz(cpp, "fundamentals-checkpoint"))!.id, questions: [pyQuestion], points: [1], startedAt: 0, deadlineAt: null, nonce: "x" },
      getAssessmentSecret(),
    );
    const result = await submitAttempt(cpp, "quiz", "fundamentals-checkpoint", sneaky, { [pyQuestion]: { selected: [] } });
    expect(result.questions).toEqual([]);
  });

  it("the HTTP flow works end to end", async () => {
    const start = await post(PY, "quizzes", "strings-and-lists-checkpoint", "start");
    expect(start.status).toBe(200);
    const started = (await start.json()) as { token: string; questions: { id: string }[] };
    const submit = await post(PY, "quizzes", "strings-and-lists-checkpoint", "submit", { token: started.token, responses: {} });
    expect(submit.status).toBe(200);
    expect(((await submit.json()) as { questions: unknown[] }).questions).toHaveLength(started.questions.length);
    expect((await post(PY, "quizzes", "strings-and-lists-checkpoint", "submit", { token: "nope", responses: {} })).status).toBe(400);
  });
});

describe("practice exams", () => {
  it("draws by the template's rules, never repeating a question, from its own course", async () => {
    const cpp = await scope(CPP);
    const exam = await getExam(cpp, "fundamentals-practice-exam");
    expect(exam).toEqual(expect.objectContaining({ questionCount: 6, totalPoints: 7, timeLimitSec: 1200 }));
    const own = new Set((await listExercises(cpp)).map((e) => e.id));
    const seen = new Set<string>();
    for (let i = 0; i < 10; i++) {
      const started = await startAttempt(cpp, "exam", "fundamentals-practice-exam");
      const ids = started.questions.map((q) => q.id);
      expect(new Set(ids).size).toBe(6);
      expect(ids.every((id) => own.has(id))).toBe(true);
      const types = started.questions.map((q) => q.type).sort();
      expect(types).toEqual(["correct_code", "mcq", "mcq", "mcq", "trace", "trace"]);
      expect(started.points.reduce((a, b) => a + b, 0)).toBe(7);
      expect(started.questions.every((q) => q.hintsHtml.length === 0)).toBe(true);
      ids.forEach((id) => seen.add(id));
    }
    // Random draws: across ten attempts more than one set of questions appears.
    expect(seen.size).toBeGreaterThan(6);
  });

  it("marks only on submit, with a result for every drawn question", async () => {
    const cpp = await scope(CPP);
    const started = await startAttempt(cpp, "exam", "fundamentals-practice-exam");
    expect((await post(CPP, "exams", "fundamentals-practice-exam", "check", { token: started.token })).status).toBe(404);
    const result = await submitAttempt(cpp, "exam", "fundamentals-practice-exam", started.token, {});
    expect(result.questions).toHaveLength(6);
    expect(result.maxScore).toBe(7);
  });

  it("is not found in another course", async () => {
    expect((await post(PY, "exams", "fundamentals-practice-exam", "start")).status).toBe(404);
  });
});

describe("sitemap", () => {
  it("lists question libraries and quizzes pages, never practice sets or quiz runners", async () => {
    const urls = (await sitemap()).map((e) => e.url);
    if (urls.length === 0) return; // no PUBLIC_SITE_URL / not production: sitemap is empty by design
    expect(urls.some((u) => u.endsWith(`/courses/${CPP}/exercises`))).toBe(true);
    expect(urls.some((u) => u.includes("/practice"))).toBe(false);
    expect(urls.some((u) => /\/quizzes\/[^/]+$/.test(u))).toBe(false);
  });
});

// Topics that have a lecture but no practice questions (and so no topic quiz) yet.
// Every topic has questions since 2026-10-16. If a new topic is added before its
// questions are written, list it here, and remove it once its questions and quiz exist.
const TOPICS_WITHOUT_QUESTIONS_YET: Record<string, string[]> = {
  [CPP]: [],
  [PY]: [],
  [CV]: [],
};

describe("a quiz for every topic", () => {
  it("every topic that has lectures has its own practice quiz, using only that topic's questions", async () => {
    for (const c of [CPP, PY, CV]) {
      const s = await scope(c);
      const lectureTopics = await env.DB.prepare(
        "SELECT DISTINCT t.slug, (SELECT count(*) FROM exercises e WHERE e.topic_id = t.id) AS questions FROM lessons l JOIN topics t ON t.id = l.topic_id WHERE l.course_id = ?",
      )
        .bind(s.courseId)
        .all<{ slug: string; questions: number }>();
      const quizzes = await listQuizzes(s);
      // The known gap stays exactly as listed: no new topic slips in without questions.
      const withoutQuestions = lectureTopics.results.filter((t) => t.questions === 0).map((t) => t.slug).sort();
      expect(withoutQuestions, c).toEqual(TOPICS_WITHOUT_QUESTIONS_YET[c]);
      for (const { slug } of lectureTopics.results.filter((t) => t.questions > 0)) {
        const quiz = quizzes.find((q) => q.topic?.slug === slug);
        expect(quiz, `${c}/${slug}`).toBeTruthy();
        expect(quiz!.questionCount).toBeGreaterThanOrEqual(4);
        expect(quiz!.feedback).toBe("immediate");
        const wrongTopic = await env.DB.prepare(
          "SELECT count(*) AS n FROM quiz_questions qq JOIN exercises e ON e.id = qq.exercise_id WHERE qq.quiz_id = ? AND e.topic_id <> (SELECT id FROM topics WHERE course_id = ? AND slug = ?)",
        )
          .bind(quiz!.id, s.courseId, slug)
          .first<{ n: number }>();
        expect(wrongTopic!.n).toBe(0);
      }
    }
  });
});

describe("the final C++ quiz", () => {
  async function modelQuestions(cpp: CourseScope) {
    const quiz = (await getQuiz(cpp, "final-quiz"))!;
    return Promise.all(quiz.models.map(async (m) => ({ ...m, ids: (await getQuizQuestions(cpp, m.id)).map((q) => q.id) })));
  }

  it("has 4 models of 35 hard-leaning questions, a 1-hour timer and 2 attempts", async () => {
    const cpp = await scope(CPP);
    const quiz = await getQuiz(cpp, "final-quiz");
    expect(quiz).toEqual(expect.objectContaining({ questionCount: 35, totalPoints: 35, mode: "exam", feedback: "after_submit", timeLimitSec: 3600, maxAttempts: 2 }));
    expect(quiz!.models.map((m) => [m.label, m.questionCount])).toEqual([["A", 35], ["B", 35], ["C", 35], ["D", 35]]);
    for (const m of quiz!.models) {
      const mix = await env.DB.prepare(
        "SELECT sum(e.difficulty = 'hard') AS hard, sum(e.difficulty = 'easy') AS easy, sum(qq.points) AS points FROM quiz_questions qq JOIN exercises e ON e.id = qq.exercise_id WHERE qq.quiz_id = ?",
      )
        .bind(m.id)
        .first<{ hard: number; easy: number; points: number }>();
      expect(mix!.hard).toBeGreaterThanOrEqual(20);
      expect(mix!.easy).toBe(0);
      expect(mix!.points).toBe(35);
    }
    // The models are never listed or opened on their own.
    expect((await listQuizzes(cpp)).some((q) => q.slug.includes("-model-"))).toBe(false);
    expect(await getQuiz(cpp, "final-quiz-model-b")).toBeNull();
    expect((await post(CPP, "quizzes", "final-quiz-model-b", "start")).status).toBe(404);
  });

  it("at least 20% of the questions are in all 4 models, and no question is in any other quiz", async () => {
    const cpp = await scope(CPP);
    const models = await modelQuestions(cpp);
    const inAll = models[0]!.ids.filter((id) => models.every((m) => m.ids.includes(id)));
    expect(inAll.length).toBeGreaterThanOrEqual(7);
    // Apart from the shared ones, each model's questions are its own.
    const own = models.map((m) => m.ids.filter((id) => !inAll.includes(id)));
    expect(new Set(own.flat()).size).toBe(own.flat().length);
    const family = models.map((m) => m.id);
    const outside = await env.DB.prepare(
      `SELECT count(*) AS n FROM quiz_questions WHERE exercise_id IN (SELECT exercise_id FROM quiz_questions WHERE quiz_id IN (${family.map(() => "?").join(",")})) AND quiz_id NOT IN (${family.map(() => "?").join(",")})`,
    )
      .bind(...family, ...family)
      .first<{ n: number }>();
    expect(outside!.n).toBe(0);
  });

  it("its questions have no pages, aren't in practice, search, custom exams or practice exams", async () => {
    const cpp = await scope(CPP);
    const reserved = await env.DB.prepare("SELECT id, slug FROM exercises WHERE course_id = ? AND json_extract(settings, '$.reserved') = 1")
      .bind(cpp.courseId)
      .all<{ id: string; slug: string }>();
    expect(reserved.results.length).toBe(new Set((await modelQuestions(cpp)).flatMap((m) => m.ids)).size);
    const one = reserved.results[0]!;
    expect(await getPublicExercise(cpp, one.slug)).toBeNull();
    expect((await post(CPP, "exercises", one.slug, "check", { response: { selected: [] } })).status).toBe(404);
    expect(await idsForSlugs(cpp, [one.slug])).toEqual([]);
    const indexed = await env.DB.prepare("SELECT count(*) AS n FROM search_index WHERE entity_id IN (SELECT id FROM exercises WHERE json_extract(settings, '$.reserved') = 1)").first<{ n: number }>();
    expect(indexed!.n).toBe(0);
    const modelPages = await env.DB.prepare("SELECT count(*) AS n FROM search_index WHERE entity_type = 'quiz' AND url LIKE '%-model-%'").first<{ n: number }>();
    expect(modelPages!.n).toBe(0);
    const ids = new Set(reserved.results.map((r) => r.id));
    for (let i = 0; i < 5; i++) {
      const custom = await startCustomAttempt(cpp, { topics: (await listPracticeTopics(cpp)).map((t) => t.slug), count: 30, minutes: 0, feedback: "after_submit" });
      expect(custom.questions.some((q) => ids.has(q.id))).toBe(false);
      const exam = await startAttempt(cpp, "exam", "fundamentals-practice-exam");
      expect(exam.questions.some((q) => ids.has(q.id))).toBe(false);
    }
  });

  it("each start gets a model at random, never the one this browser had last, and it is marked as that model", async () => {
    const cpp = await scope(CPP);
    const models = await modelQuestions(cpp);
    const seen = new Set<string>();
    let last: string | null = null;
    for (let i = 0; i < 24; i++) {
      const started = await startAttempt(cpp, "quiz", "final-quiz", Date.now(), last);
      expect(started.model).toMatch(/^[A-D]$/);
      expect(started.model).not.toBe(last);
      expect(started.title).toBe(`Final quiz (Model ${started.model})`);
      const model = models.find((m) => m.label === started.model)!;
      expect(started.questions.map((q) => q.id).sort()).toEqual([...model.ids].sort());
      seen.add(started.model!);
      last = started.model!;
    }
    expect(seen.size).toBe(4);
    const started = await startAttempt(cpp, "quiz", "final-quiz");
    const result = await submitAttempt(cpp, "quiz", "final-quiz", started.token, {});
    expect(result.title).toBe(started.title);
    expect(result.questions).toHaveLength(35);
  });

  it("needs a student account, locks after 2 attempts for 24 hours per student across all models, and other quizzes stay open", async () => {
    const call = (action: "start" | "status", cookie?: string) =>
      POST(
        new Request(`https://example.test/api/courses/${CPP}/quizzes/final-quiz/${action}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
          body: "{}",
        }),
        { params: Promise.resolve({ course: CPP, kind: "quizzes", slug: "final-quiz", action }) },
      );
    // Guests are asked to sign in: a private window can't give more tries.
    const guest = await call("start");
    expect(guest.status).toBe(401);
    expect(await guest.json()).toEqual(expect.objectContaining({ signInRequired: true }));
    expect(await (await call("status")).json()).toEqual(expect.objectContaining({ signInRequired: true, maxAttempts: 2 }));

    const sara = await makeStudent("Sara");
    const first = await call("start", sara.cookie);
    expect(first.status).toBe(200);
    const firstModel = ((await first.json()) as { model: string }).model;
    // Signed in, nothing is kept in cookies: the attempts are on the account.
    expect(first.headers.getSetCookie()).toEqual([]);
    const second = await call("start", sara.cookie);
    expect(second.status).toBe(200);
    expect(((await second.json()) as { model: string }).model).not.toBe(firstModel);
    const third = await call("start", sara.cookie);
    expect(third.status).toBe(429);
    expect(((await third.json()) as { unlockAt: number }).unlockAt).toBeGreaterThan(Date.now() + 23 * 3600_000);
    expect(await (await call("status", sara.cookie)).json()).toEqual(expect.objectContaining({ maxAttempts: 2, used: 2, signInRequired: false }));

    // Signing in again on another device doesn't reset the count.
    const again = await signIn({ email: sara.email, password: STUDENT_PASSWORD, turnstileToken: null, ip: null, userAgent: "phone" });
    expect(again.ok).toBe(true);
    if (again.ok) expect((await call("start", `ce_session=${again.token}`)).status).toBe(429);

    // Another student is not affected, and quizzes without a limit stay open (and set no cookie when signed in).
    const omar = await makeStudent("Omar");
    expect((await call("start", omar.cookie)).status).toBe(200);
    const practice = await post(CPP, "quizzes", "final-quiz-practice", "start");
    expect(practice.status).toBe(200);
    expect(practice.headers.get("Set-Cookie")).toBeNull();
  });

  it("the practice version is bigger, easier, and has no attempt limit", async () => {
    const cpp = await scope(CPP);
    const practice = await getQuiz(cpp, "final-quiz-practice");
    expect(practice).toEqual(expect.objectContaining({ mode: "practice", maxAttempts: null, timeLimitSec: null }));
    expect(practice!.questionCount).toBeGreaterThan(35);
    const hard = await env.DB.prepare("SELECT count(*) AS n FROM quiz_questions qq JOIN exercises e ON e.id = qq.exercise_id WHERE qq.quiz_id = ? AND e.difficulty = 'hard'")
      .bind(practice!.id)
      .first<{ n: number }>();
    expect(hard!.n).toBe(0);
  });
});

describe("build your own exam", () => {
  it("draws from the chosen topics only, evenly, with the chosen size, timer and feedback", async () => {
    const cpp = await scope(CPP);
    const topics = await listPracticeTopics(cpp);
    const pick = topics.filter((t) => ["for-loops", "operators", "variables"].includes(t.slug));
    expect(pick).toHaveLength(3);
    const now = Date.now();
    const started = await startCustomAttempt(cpp, { topics: pick.map((t) => t.slug), count: 15, minutes: 20, feedback: "after_submit" }, now);
    expect(started.kind).toBe("custom");
    expect(started.questions).toHaveLength(15);
    expect(started.deadlineAt).toBe(now + 20 * 60_000);
    expect(started.feedback).toBe("after_submit");
    expect(started.questions.every((q) => q.hintsHtml.length === 0)).toBe(true);
    expect(started.title).toContain("Variables");
    const perTopic = pick.map((t) => started.questions.filter((q) => q.topic?.slug === t.slug).length);
    expect(perTopic).toEqual([5, 5, 5]);
    expect(started.questions.every((q) => q.type !== "write_code")).toBe(true);
    // Answers at the end: no checking before submit.
    await expect(checkInAttempt(cpp, "custom", "exam", started.token, started.questions[0]!.id, { selected: [] })).rejects.toMatchObject({ status: 403 });
    const result = await submitAttempt(cpp, "custom", "exam", started.token, {});
    expect(result.questions).toHaveLength(15);
    expect(result.passThreshold).toBe(60);
    expect(result.title).toBe(started.title);
  });

  it("can check as you go, filter by type, and gives everything when topics are small", async () => {
    const cpp = await scope(CPP);
    const started = await startCustomAttempt(cpp, { topics: ["while-loops"], count: 30, minutes: 0, feedback: "immediate", types: ["trace"] });
    expect(started.deadlineAt).toBeNull();
    expect(started.questions.length).toBeGreaterThan(0);
    expect(started.questions.length).toBeLessThan(30);
    expect(started.questions.every((q) => q.type === "trace")).toBe(true);
    const q = started.questions[0]!;
    const review = await checkInAttempt(cpp, "custom", "exam", started.token, q.id, { answer: await answer(q.id, "trace_output") });
    expect(review.correct).toBe(true);
  });

  it("refuses bad choices, other courses' topics and quiz tokens; works over HTTP", async () => {
    const cpp = await scope(CPP);
    await expect(startCustomAttempt(cpp, { topics: [], count: 10, minutes: 0, feedback: "immediate" })).rejects.toMatchObject({ status: 400 });
    await expect(startCustomAttempt(cpp, { topics: ["for-loops"], count: 7, minutes: 0, feedback: "immediate" })).rejects.toMatchObject({ status: 400 });
    await expect(startCustomAttempt(cpp, { topics: ["for-loops"], count: 10, minutes: 0, feedback: "immediate", types: ["write_code"] })).rejects.toMatchObject({ status: 400 });
    await expect(startCustomAttempt(cpp, { topics: ["strings"], count: 10, minutes: 0, feedback: "immediate" })).rejects.toMatchObject({ status: 400 });
    const quizToken = (await startAttempt(cpp, "quiz", "fundamentals-checkpoint")).token;
    await expect(submitAttempt(cpp, "custom", "exam", quizToken, {})).rejects.toMatchObject({ status: 400 });
    const res = await post(CPP, "custom", "exam", "start", { options: { topics: ["for-loops"], count: 5, minutes: 10, feedback: "immediate" } });
    expect(res.status).toBe(200);
    expect((await post(CPP, "custom", "other", "start", {})).status).toBe(404);
    expect((await post(CPP, "custom", "exam", "start", { options: { topics: ["for-loops"] } })).status).toBe(400);
  });
});

describe("question formats", () => {
  it("put in order: the program is never sent, the lines come shuffled, and the right order is marked correct", async () => {
    const cpp = await scope(CPP);
    const q = (await getPublicExercise(cpp, "order-average-of-marks"))!;
    expect(q.ask).toBe("order");
    expect(q.code).toBeNull();
    expect(q.codeLines).toEqual([]);
    expect(JSON.stringify(q)).not.toContain("[order]");
    const right = ["    float a, b;", '    cout << "Enter two marks: ";', "    cin >> a >> b;", "    float average = (a + b) / 2;", '    cout << "Average: " << average << endl;'];
    expect([...q.order!.pieces.map((p) => p.text)].sort()).toEqual([...right].sort());
    expect(q.order!.pieces.map((p) => p.text)).not.toEqual(right);
    const program = (block: string[]) => [...q.order!.before.map((l) => l.text), ...block, ...q.order!.after.map((l) => l.text)].join("\n") + "\n";
    const good = await post(CPP, "exercises", q.slug, "check", { response: { code: program(right) } });
    expect(((await good.json()) as { correct: boolean }).correct).toBe(true);
    // The other valid order (prompt before the declaration) is accepted too; a wrong one isn't.
    const swapped = [right[1]!, right[0]!, ...right.slice(2)];
    expect(((await (await post(CPP, "exercises", q.slug, "check", { response: { code: program(swapped) } })).json()) as { correct: boolean }).correct).toBe(true);
    const wrong = [right[0]!, right[2]!, right[1]!, ...right.slice(3)];
    const review = (await (await post(CPP, "exercises", q.slug, "check", { response: { code: program(wrong) } })).json()) as { correct: boolean; ask: string; solution: string };
    expect(review.correct).toBe(false);
    expect(review.ask).toBe("order");
    expect(review.solution).not.toContain("[order]");
  });

  it("fill in the blanks, how many times and find the value are marked on the server", async () => {
    const cpp = await scope(CPP);
    const blanks = (await getPublicExercise(cpp, "blanks-sum-of-n-numbers"))!;
    expect(blanks.ask).toBe("blanks");
    const filled = blanks.code!.replace("sum = ___;", "sum = 0;").replace("i ___ n", "i <= n").replace("sum = ___;", "sum = sum + x;");
    const mark = async (slug: string, response: unknown) => ((await (await post(CPP, "exercises", slug, "check", { response })).json()) as { correct: boolean }).correct;
    expect(await mark(blanks.slug, { code: filled })).toBe(true);
    expect(await mark(blanks.slug, { code: filled.replace("i <= n", "i < n") })).toBe(false);
    expect(await mark("count-while-doubling-runs", { answer: " 5 " })).toBe(true);
    expect(await mark("count-while-doubling-runs", { answer: "4" })).toBe(false);
    expect(await mark("value-for-total-after-loop", { answer: "16" })).toBe(true);
  });
});
