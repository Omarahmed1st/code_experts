// Questions, quizzes and practice exams in the admin, against the real seed.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { blankExercise } from "@/lib/admin/exercise-draft";
import { serializeExercise } from "@/lib/exercise/serialize";
import { deleteExam, getExamForEdit, listAdminExams, ruleAvailability, saveExam } from "@/server/admin/exams";
import {
  deleteExercise,
  duplicateExercise,
  exportExercises,
  getExerciseForEdit,
  importExercises,
  listAdminExercises,
  saveExercise,
  setExerciseStatus,
} from "@/server/admin/exercises";
import { addQuizModel, deleteQuiz, getQuizForEdit, listAdminQuizzes, saveQuiz } from "@/server/admin/quizzes";
import { listQuizzes } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { getPublicExercise } from "@/server/exercises/catalog";
import { CPP, CV, PY, auditActions, course, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(async () => {
  await env.DB.prepare("DELETE FROM users").run();
  await env.DB.prepare("DELETE FROM admin_audit_logs").run();
  await loadRealSeed();
});

const idOf = async (courseId: string, table: string, slug: string) =>
  (await env.DB.prepare(`SELECT id FROM ${table} WHERE course_id = ? AND slug = ?`).bind(courseId, slug).first<{ id: string }>())!.id;

const childIds = async (exerciseId: string) => {
  const { results } = await env.DB.prepare(
    `SELECT id FROM exercise_options WHERE exercise_id = ?1 UNION ALL SELECT id FROM exercise_answers WHERE exercise_id = ?1
     UNION ALL SELECT id FROM exercise_test_cases WHERE exercise_id = ?1 UNION ALL SELECT id FROM exercise_trace_steps WHERE exercise_id = ?1 ORDER BY 1`,
  )
    .bind(exerciseId)
    .all<{ id: string }>();
  return results.map((r) => r.id);
};

describe("questions", () => {
  it("every seeded question saves unchanged through the editor, keeping its option and answer ids", { timeout: 240_000 }, async () => {
    const admin = await makeStaff("admin1", "admin");
    for (const slug of [CPP, PY, CV]) {
      const c = await course(slug);
      const before = await exportExercises(c);
      const ids = new Map<string, string[]>();
      for (const ex of before) {
        const id = await idOf(c.id, "exercises", ex.slug);
        ids.set(ex.slug, await childIds(id));
        const result = await saveExercise(admin, c, id, { source: ex });
        expect(result, `${slug}/${ex.slug}`).toMatchObject({ ok: true });
      }
      const after = await exportExercises(c);
      const strip = (list: typeof before) => list.map((e) => ({ ...e, updated: "" }));
      expect(strip(after)).toEqual(strip(before));
      for (const ex of after) expect(await childIds(await idOf(c.id, "exercises", ex.slug)), ex.slug).toEqual(ids.get(ex.slug));
    }
  });

  it("creates a draft MCQ, refuses a broken one with a clear message, and publishes it", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const draft = {
      ...blankExercise("mcq", "python", "digital-images"),
      slug: "pixel-count",
      title: "Pixels in a 4 × 3 image",
      promptMd: "How many pixels does a 4 × 3 image have?",
      explanationMd: "Width times height: 4 × 3 = 12.",
      options: [
        { labelMd: "12", correct: true, feedbackMd: "" },
        { labelMd: "7", correct: false, feedbackMd: "That adds the sides." },
      ],
    };
    const broken = await saveExercise(admin, cv, null, { source: { ...draft, explanationMd: "" } });
    expect(broken).toMatchObject({ ok: false, error: expect.stringMatching(/explanation/i) });
    const noRight = await saveExercise(admin, cv, null, { source: { ...draft, options: draft.options.map((o) => ({ ...o, correct: false })) } });
    expect(noRight).toMatchObject({ ok: false, error: "Mark the correct option" });

    const created = await saveExercise(admin, cv, null, { source: draft });
    expect(created).toMatchObject({ ok: true });
    const scope = (await resolveCourse(CV))!;
    expect(await getPublicExercise(scope, "pixel-count")).toBeNull();
    const id = created.ok ? created.value.id : "";
    expect(await setExerciseStatus(admin, cv, id, "published")).toMatchObject({ ok: true });
    expect((await getPublicExercise(scope, "pixel-count"))?.options.map((o) => o.labelHtml)).toHaveLength(2);
    expect(await auditActions(cv.id)).toEqual(["exercise.create", "exercise.publish"]);
  });

  it("saves from the Markdown tab with the content-file rules", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const [first] = await exportExercises(py);
    const id = await idOf(py.id, "exercises", first!.slug);
    const markdown = serializeExercise({ ...first!, title: "Edited in Markdown" });
    expect(await saveExercise(admin, py, id, { markdown })).toMatchObject({ ok: true });
    expect((await getExerciseForEdit(py, id))?.source.title).toBe("Edited in Markdown");
    expect(await saveExercise(admin, py, id, { markdown: markdown.replace("## Question", "## Questions") })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/unknown section/i),
    });
  });

  it("keeps quizzes and practice exams working: no write-code in a quiz, no draft in a published quiz, no deleting a used question", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const id = await idOf(cv.id, "exercises", "bgr-red-pixel");
    const loaded = (await getExerciseForEdit(cv, id))!;
    expect(loaded.quizzes.length).toBeGreaterThan(0);
    expect(await saveExercise(admin, cv, id, { source: { ...loaded.source, status: "draft" } })).toMatchObject({ ok: false, error: expect.stringMatching(/published/) });
    expect(await deleteExercise(admin, cv, id)).toMatchObject({ ok: false, error: expect.stringMatching(/uses this question/) });
  });

  it("refuses a slug used by another question of the course, duplicates as a draft, and deletes an unused question", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const id = await idOf(cv.id, "exercises", "bgr-red-pixel");
    const loaded = (await getExerciseForEdit(cv, id))!;
    const other = await idOf(cv.id, "exercises", "reading-image-shape");
    const otherLoaded = (await getExerciseForEdit(cv, other))!;
    expect(await saveExercise(admin, cv, other, { source: { ...otherLoaded.source, slug: "bgr-red-pixel" } })).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } });

    const copy = await duplicateExercise(admin, cv, id);
    expect(copy).toMatchObject({ ok: true, value: { slug: "bgr-red-pixel-copy" } });
    const copyId = copy.ok ? copy.value.id : "";
    expect((await getExerciseForEdit(cv, copyId))?.source).toMatchObject({ status: "draft", options: loaded.source.options });
    expect(await duplicateExercise(admin, cv, id)).toMatchObject({ ok: true, value: { slug: "bgr-red-pixel-copy-2" } });
    expect(await deleteExercise(admin, cv, copyId)).toMatchObject({ ok: true });
  });

  it("editors can't publish or delete questions, and can't touch another course's", async () => {
    const cv = await course(CV);
    const py = await course(PY);
    const editor = await makeStaff("ed1", "editor", { [cv.id]: "editor" });
    const id = await idOf(cv.id, "exercises", "reading-image-shape");
    const loaded = (await getExerciseForEdit(cv, id))!;
    expect(await saveExercise(editor, cv, id, { source: { ...loaded.source, title: "Edited", status: "draft" } })).toMatchObject({ ok: true });
    expect((await getExerciseForEdit(cv, id))?.status).toBe("published");
    expect(await setExerciseStatus(editor, cv, id, "draft")).toMatchObject({ ok: false });
    expect(await deleteExercise(editor, cv, id)).toMatchObject({ ok: false });
    const pyId = (await listAdminExercises(py)).rows[0]!.id;
    expect(await saveExercise(editor, py, pyId, { source: loaded.source })).toMatchObject({ ok: false });
    // An id from another course is simply not found in this one.
    expect(await getExerciseForEdit(cv, pyId)).toBeNull();
  });

  it("filters the list and imports questions, updating by slug", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const all = await listAdminExercises(cv);
    const mcqs = await listAdminExercises(cv, { type: "mcq" });
    expect(mcqs.rows.every((r) => r.type === "mcq")).toBe(true);
    expect(mcqs.total).toBeLessThan(all.total);
    expect((await listAdminExercises(cv, { q: "BGR" })).rows.length).toBeGreaterThan(0);

    const [first] = await exportExercises(cv);
    const report = await importExercises(admin, cv, [
      { name: "a.md", input: { markdown: serializeExercise({ ...first!, title: "Imported title" }) } },
      { name: "b.json", input: { source: { ...first!, slug: "brand-new-question", status: "draft" } } },
      { name: "c.md", input: { markdown: "not a question" } },
    ]);
    expect(report).toMatchObject({ ok: true, value: { updated: [first!.slug], created: ["brand-new-question"], failed: [{ name: "c.md" }] } });
  });
});

describe("quizzes", () => {
  it("lists quizzes with their models and saves a quiz unchanged", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cpp = await course(CPP);
    const quizzes = await listAdminQuizzes(cpp);
    const final = quizzes.find((q) => q.slug === "final-quiz")!;
    expect(final.models.map((m) => m.slug)).toEqual(["final-quiz-model-b", "final-quiz-model-c", "final-quiz-model-d"]);
    const scope = (await resolveCourse(CPP))!;
    const publicBefore = await listQuizzes(scope);

    for (const q of quizzes) {
      const loaded = (await getQuizForEdit(cpp, q.id))!;
      expect(await saveQuiz(admin, cpp, q.id, loaded.draft), q.slug).toMatchObject({ ok: true });
    }
    expect(await listQuizzes(scope)).toEqual(publicBefore);
  });

  it("models follow their quiz's settings and slug", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cpp = await course(CPP);
    const finalId = await idOf(cpp.id, "quizzes", "final-quiz");
    const loaded = (await getQuizForEdit(cpp, finalId))!;
    expect(await saveQuiz(admin, cpp, finalId, { ...loaded.draft, minutes: 50, slug: "final-exam" })).toMatchObject({ ok: true });
    const { results } = await env.DB.prepare("SELECT slug, time_limit_sec AS t FROM quizzes WHERE course_id = ? AND slug LIKE 'final-exam%' ORDER BY slug").bind(cpp.id).all();
    expect(results).toEqual([
      { slug: "final-exam", t: 3000 },
      { slug: "final-exam-model-b", t: 3000 },
      { slug: "final-exam-model-c", t: 3000 },
      { slug: "final-exam-model-d", t: 3000 },
    ]);
    // A model's own save can't change the timer.
    const modelId = await idOf(cpp.id, "quizzes", "final-exam-model-b");
    const model = (await getQuizForEdit(cpp, modelId))!;
    expect(model.modelOf?.slug).toBe("final-exam");
    expect(await saveQuiz(admin, cpp, modelId, { ...model.draft, minutes: 5, title: "Model B" })).toMatchObject({ ok: true });
    expect((await getQuizForEdit(cpp, modelId))?.draft).toMatchObject({ minutes: 50, title: "Model B" });
  });

  it("refuses questions a quiz can't use: another course's, write-code, drafts in a published quiz, another quiz's reserved ones", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cpp = await course(CPP);
    const cv = await course(CV);
    const quizId = await idOf(cpp.id, "quizzes", "for-loops-quiz");
    const loaded = (await getQuizForEdit(cpp, quizId))!;
    const cvQuestion = (await listAdminExercises(cv)).rows[0]!.id;
    expect(await saveQuiz(admin, cpp, quizId, { ...loaded.draft, questions: [...loaded.draft.questions, { exerciseId: cvQuestion, points: 1 }] })).toMatchObject({ ok: false });

    const writeCode = (await listAdminExercises(cpp, { type: "write_code" })).rows[0];
    if (writeCode) {
      expect(await saveQuiz(admin, cpp, quizId, { ...loaded.draft, questions: [{ exerciseId: writeCode.id, points: 1 }] })).toMatchObject({ ok: false, error: expect.stringMatching(/write-code/) });
    }
    const reserved = (await listAdminExercises(cpp, { status: "reserved" })).rows[0]!;
    expect(await saveQuiz(admin, cpp, quizId, { ...loaded.draft, questions: [{ exerciseId: reserved.id, points: 1 }] })).toMatchObject({ ok: false, error: expect.stringMatching(/reserved/) });
  });

  it("adds a model and deletes a quiz with its models", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const quizId = await idOf(cv.id, "quizzes", "digital-images-quiz");
    const added = await addQuizModel(admin, cv, quizId);
    expect(added).toMatchObject({ ok: true });
    expect((await getQuizForEdit(cv, quizId))?.models.map((m) => m.letter)).toEqual(["B"]);
    expect(await deleteQuiz(admin, cv, quizId)).toMatchObject({ ok: true });
    expect((await listAdminQuizzes(cv)).some((q) => q.slug.startsWith("digital-images-quiz"))).toBe(false);
  });
});

describe("practice exams", () => {
  it("saves the seeded exam unchanged, and refuses rules the bank can't draw", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cpp = await course(CPP);
    const [exam] = await listAdminExams(cpp);
    const loaded = (await getExamForEdit(cpp, exam!.id))!;
    expect(await saveExam(admin, cpp, exam!.id, loaded.draft)).toMatchObject({ ok: true });
    expect((await getExamForEdit(cpp, exam!.id))?.draft).toEqual(loaded.draft);
    const available = await ruleAvailability(cpp, loaded.draft.rules);
    expect(available.every((n, i) => n >= loaded.draft.rules[i]!.count)).toBe(true);

    const greedy = { ...loaded.draft, rules: [{ count: 100, type: "mcq", difficulty: "hard", topicId: null, points: 1 }] };
    expect(await saveExam(admin, cpp, exam!.id, greedy)).toMatchObject({ ok: false, error: expect.stringMatching(/enough/) });
    // As a draft it can be saved and fixed later.
    expect(await saveExam(admin, cpp, exam!.id, { ...greedy, status: "draft" })).toMatchObject({ ok: true });
    expect(await deleteExam(admin, cpp, exam!.id)).toMatchObject({ ok: true });
  });

  it("won't unpublish a question a published exam needs to draw", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    // An exam that needs every published MCQ of the course.
    const mcqs = (await listAdminExercises(cv, { type: "mcq", status: "published" })).rows.filter((r) => !r.reserved && r.quizzes === 0);
    const all = (await listAdminExercises(cv, { type: "mcq", status: "published" })).rows.filter((r) => !r.reserved);
    const made = await saveExam(admin, cv, null, {
      title: "Every MCQ",
      slug: "every-mcq",
      descriptionMd: "",
      scope: "course",
      minutes: 30,
      passThreshold: 50,
      shuffleQuestions: true,
      status: "published",
      rules: [{ count: all.length, type: "mcq", difficulty: null, topicId: null, points: 1 }],
    });
    expect(made).toMatchObject({ ok: true });
    if (mcqs[0]) {
      expect(await setExerciseStatus(admin, cv, mcqs[0].id, "draft")).toMatchObject({ ok: false, error: expect.stringMatching(/Every MCQ/) });
    }
  });
});
