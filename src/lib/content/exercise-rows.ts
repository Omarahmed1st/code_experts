// One question as database rows, and back. Shared by the content build
// (tools/build-content.ts, which writes them as SQL) and the admin (which
// writes them with D1), so a question saved either way is stored the same.
// Pure.
import type { ExerciseSettings, ExerciseSource } from "../exercise/source.ts";
import { markdownToPlainText } from "../lesson/source.ts";
import type { CompareMode } from "../grading/output.ts";

export type SqlValue = string | number | boolean | null;
export type Row = Record<string, SqlValue>;

/** What the database stores in exercises.settings: the parsed settings plus the hidden verify program. */
export interface StoredSettings extends ExerciseSettings {
  /** The checker's proof program (pseudocode traces, ask: count / value). Never sent to students. */
  verify?: { language: "cpp" | "python"; code: string };
}

export interface ExerciseRowContext {
  id: string;
  courseId: string;
  topicId: string | null;
  lessonId: string | null;
  updatedAt: number;
  /** Id for the i-th row of a child table (options, answers, tests, hints, steps). */
  childId: (table: "opt" | "ans" | "tst" | "hnt" | "stp", index: number) => string;
}

export interface ExerciseRows {
  exercise: Row;
  /** Insert in this order, after the exercise row. */
  children: { table: string; row: Row }[];
}

export const EXERCISE_COLUMNS = [
  "id", "course_id", "topic_id", "lesson_id", "slug", "type", "title", "prompt_md", "code", "code_language",
  "expected_behavior_md", "explanation_md", "difficulty", "grading_mode", "settings", "points", "status", "is_demo", "updated_at",
] as const;

export const CHILD_TABLES = ["exercise_options", "exercise_answers", "exercise_test_cases", "exercise_hints", "exercise_trace_steps"] as const;

export function storedSettings(ex: ExerciseSource): StoredSettings {
  return ex.verifyCode !== null && ex.verifyLanguage ? { ...ex.settings, verify: { language: ex.verifyLanguage, code: ex.verifyCode } } : { ...ex.settings };
}

export function exerciseRows(ex: ExerciseSource, ctx: ExerciseRowContext): ExerciseRows {
  const { courseId, id } = ctx;
  const exercise: Row = {
    id,
    course_id: courseId,
    topic_id: ctx.topicId,
    lesson_id: ctx.lessonId,
    slug: ex.slug,
    type: ex.type,
    title: ex.title,
    prompt_md: ex.promptMd,
    code: ex.code,
    code_language: ex.codeLanguage,
    expected_behavior_md: ex.expectedBehaviorMd,
    explanation_md: ex.explanationMd,
    difficulty: ex.difficulty,
    grading_mode: ex.type === "mcq" || ex.type === "trace" ? "auto" : "reference_review",
    settings: JSON.stringify(storedSettings(ex)),
    points: ex.points,
    status: ex.status,
    is_demo: ex.demo,
    updated_at: ctx.updatedAt,
  };
  const children: ExerciseRows["children"] = [];
  ex.options.forEach((o, i) =>
    children.push({
      table: "exercise_options",
      row: { id: ctx.childId("opt", i), course_id: courseId, exercise_id: id, label_md: o.labelMd, is_correct: o.correct, feedback_md: o.feedbackMd, sort_order: i + 1 },
    }),
  );
  const answers: { kind: string; value: string }[] = [
    ...(ex.type === "trace" ? ex.outputs.map((value) => ({ kind: "trace_output", value })) : []),
    ...(ex.solution !== null ? [{ kind: "reference_solution", value: ex.solution }] : []),
    ...ex.accepted.map((value) => ({ kind: "accepted_solution", value })),
  ];
  answers.forEach((a, i) =>
    children.push({ table: "exercise_answers", row: { id: ctx.childId("ans", i), course_id: courseId, exercise_id: id, kind: a.kind, value: a.value, sort_order: i + 1 } }),
  );
  ex.tests.forEach((t, i) =>
    children.push({
      table: "exercise_test_cases",
      row: {
        id: ctx.childId("tst", i),
        course_id: courseId,
        exercise_id: id,
        name: t.name,
        stdin: t.stdin,
        expected_stdout: t.stdout,
        compare_mode: ex.settings.compare ?? "trim_trailing",
        is_hidden: t.hidden,
        sort_order: i + 1,
      },
    }),
  );
  ex.hints.forEach((h, i) =>
    children.push({ table: "exercise_hints", row: { id: ctx.childId("hnt", i), course_id: courseId, exercise_id: id, hint_md: h, sort_order: i + 1 } }),
  );
  ex.steps.forEach((s, i) =>
    children.push({
      table: "exercise_trace_steps",
      row: {
        id: ctx.childId("stp", i),
        course_id: courseId,
        exercise_id: id,
        step_no: i + 1,
        line_no: s.line,
        explanation: s.explanation,
        variables: JSON.stringify(s.variables),
        output: s.output,
      },
    }),
  );
  return { exercise, children };
}

/** Title, question and code only: the explanation would give the answer away in search snippets. Null = not searchable. */
export function exerciseSearchBody(ex: ExerciseSource): string | null {
  if (ex.status !== "published" || ex.settings.reserved) return null;
  return [markdownToPlainText(ex.promptMd), markdownToPlainText(ex.expectedBehaviorMd), ex.settings.ask === "order" ? "" : (ex.code ?? "")]
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// ---------------------------------------------------------------------------
// Back from the database
// ---------------------------------------------------------------------------

export interface StoredExercise {
  slug: string;
  type: ExerciseSource["type"];
  title: string;
  promptMd: string;
  code: string | null;
  codeLanguage: ExerciseSource["codeLanguage"];
  expectedBehaviorMd: string;
  explanationMd: string;
  difficulty: ExerciseSource["difficulty"];
  settings: unknown;
  points: number;
  status: "draft" | "published" | "archived";
  isDemo: boolean;
  updatedAt: number;
  topicSlug: string | null;
  lessonSlug: string | null;
  options: { labelMd: string; isCorrect: boolean; feedbackMd: string }[];
  answers: { kind: string; value: string }[];
  tests: { name: string; stdin: string; expectedStdout: string; isHidden: boolean }[];
  hints: string[];
  steps: { lineNo: number | null; explanation: string; variables: unknown; output: string }[];
}

/** A stored question as the parser's shape (children already in order). Archived counts as draft. */
export function exerciseFromRows(row: StoredExercise): ExerciseSource {
  const raw = (row.settings && typeof row.settings === "object" ? row.settings : {}) as StoredSettings;
  const { verify, ...settings } = raw;
  return {
    slug: row.slug,
    type: row.type,
    title: row.title,
    topic: row.topicSlug,
    lesson: row.lessonSlug,
    difficulty: row.difficulty,
    points: row.points,
    status: row.status === "published" ? "published" : "draft",
    demo: row.isDemo,
    updated: new Date(row.updatedAt).toISOString().slice(0, 10),
    promptMd: row.promptMd,
    code: row.code,
    codeLanguage: row.codeLanguage,
    verifyCode: verify?.code ?? null,
    verifyLanguage: verify?.language ?? null,
    expectedBehaviorMd: row.expectedBehaviorMd,
    explanationMd: row.explanationMd,
    settings: settings as ExerciseSettings,
    options: row.options.map((o) => ({ labelMd: o.labelMd, correct: o.isCorrect, feedbackMd: o.feedbackMd })),
    outputs: row.answers.filter((a) => a.kind === "trace_output").map((a) => a.value),
    solution: row.answers.find((a) => a.kind === "reference_solution")?.value ?? null,
    accepted: row.answers.filter((a) => a.kind === "accepted_solution").map((a) => a.value),
    tests: row.tests.map((t) => ({ name: t.name, stdin: t.stdin, stdout: t.expectedStdout, hidden: t.isHidden })),
    hints: row.hints,
    steps: row.steps.map((s) => ({
      line: s.lineNo,
      explanation: s.explanation,
      variables: (s.variables && typeof s.variables === "object" ? s.variables : {}) as Record<string, string>,
      output: s.output,
    })),
  };
}

export const DEFAULT_COMPARE: CompareMode = "trim_trailing";
