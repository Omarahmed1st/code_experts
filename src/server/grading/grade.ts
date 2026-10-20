// Server-side marking. The only module (with admin, in Phase 4) that reads
// answer keys: correct options, trace outputs, solutions, hidden tests and
// explanations. It returns them only together with a mark, i.e. after the
// student has answered.
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import { exerciseAnswers, exerciseOptions, exerciseTraceSteps, exercises, topics } from "@/db/schema";
import { type Ask, isAsk } from "@/lib/exercise/ask";
import { matchesAnySolution } from "@/lib/grading/code-match";
import { DEFAULT_COMPARE, isCompareMode } from "@/lib/grading/output";
import { gradeMcq, gradeTrace } from "@/lib/grading/scoring";
import { renderInlineMarkdown, renderMarkdown } from "@/lib/markdown/render";
import type { CourseScope } from "@/server/courses/scope";
import { type ExerciseType, MAX_IDS_PER_QUERY } from "@/server/exercises/catalog";

export interface AnswerKey {
  id: string;
  slug: string;
  title: string;
  type: ExerciseType;
  codeLanguage: string | null;
  points: number;
  topic: { id: string; title: string } | null;
  settings: { multiple?: boolean; compare?: string; caseSensitive?: boolean; ask?: string };
  explanationMd: string;
  options: { id: string; correct: boolean; feedbackMd: string }[];
  traceOutputs: string[];
  referenceSolution: string | null;
  acceptedSolutions: string[];
  steps: { stepNo: number; line: number | null; explanation: string; variables: Record<string, unknown>; output: string }[];
}

/** What the student sent. Shapes are checked by parseResponse before anything is marked. */
export type StudentResponse =
  | { kind: "mcq"; selected: string[] }
  | { kind: "trace"; answer: string }
  | { kind: "code"; code: string; tests?: { passed: number; total: number } };

export const MAX_CODE_LENGTH = 65_536;
export const MAX_ANSWER_LENGTH = 10_000;

/** A response for this question type, or null when it is malformed. */
export function parseResponse(type: ExerciseType, raw: unknown): StudentResponse | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (type === "mcq") {
    if (!Array.isArray(r.selected) || r.selected.length > 20 || !r.selected.every((s) => typeof s === "string" && s.length <= 64)) return null;
    return { kind: "mcq", selected: r.selected as string[] };
  }
  if (type === "trace") {
    if (typeof r.answer !== "string" || r.answer.length > MAX_ANSWER_LENGTH) return null;
    return { kind: "trace", answer: r.answer };
  }
  if (typeof r.code !== "string" || r.code.length > MAX_CODE_LENGTH) return null;
  const t = r.tests as Record<string, unknown> | undefined;
  const tests =
    t && Number.isInteger(t.passed) && Number.isInteger(t.total) && (t.total as number) >= 0 && (t.passed as number) <= (t.total as number)
      ? { passed: t.passed as number, total: t.total as number }
      : undefined;
  return { kind: "code", code: r.code, tests };
}

/** An empty answer: counted as not answered in quizzes. */
export function isBlank(response: StudentResponse | null): boolean {
  if (!response) return true;
  if (response.kind === "mcq") return response.selected.length === 0;
  if (response.kind === "trace") return response.answer.trim() === "";
  return response.code.trim() === "";
}

/** Answer keys for questions of this course (published or not; callers decide what may be graded). */
export async function loadAnswerKeys(scope: CourseScope, ids: readonly string[]): Promise<Map<string, AnswerKey>> {
  // D1 allows 100 bound values per query, so long lists are read in batches.
  const all = [...new Set(ids)];
  const batches = await Promise.all(
    Array.from({ length: Math.ceil(all.length / MAX_IDS_PER_QUERY) }, (_, i) =>
      answerKeyBatch(scope, all.slice(i * MAX_IDS_PER_QUERY, (i + 1) * MAX_IDS_PER_QUERY)),
    ),
  );
  return new Map(batches.flatMap((m) => [...m]));
}

async function answerKeyBatch(scope: CourseScope, unique: readonly string[]): Promise<Map<string, AnswerKey>> {
  if (unique.length === 0) return new Map();
  const db = getDb();
  const [rows, optionRows, answerRows, stepRows] = await Promise.all([
    db
      .select({
        id: exercises.id,
        slug: exercises.slug,
        title: exercises.title,
        type: exercises.type,
        codeLanguage: exercises.codeLanguage,
        points: exercises.points,
        settings: exercises.settings,
        explanationMd: exercises.explanationMd,
        topicId: topics.id,
        topicTitle: topics.title,
      })
      .from(exercises)
      .leftJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
      .where(and(eq(exercises.courseId, scope.courseId), inArray(exercises.id, unique))),
    db
      .select({ id: exerciseOptions.id, exerciseId: exerciseOptions.exerciseId, correct: exerciseOptions.isCorrect, feedbackMd: exerciseOptions.feedbackMd })
      .from(exerciseOptions)
      .where(and(eq(exerciseOptions.courseId, scope.courseId), inArray(exerciseOptions.exerciseId, unique)))
      .orderBy(asc(exerciseOptions.sortOrder)),
    db
      .select({ exerciseId: exerciseAnswers.exerciseId, kind: exerciseAnswers.kind, value: exerciseAnswers.value })
      .from(exerciseAnswers)
      .where(and(eq(exerciseAnswers.courseId, scope.courseId), inArray(exerciseAnswers.exerciseId, unique)))
      .orderBy(asc(exerciseAnswers.sortOrder)),
    db
      .select({
        exerciseId: exerciseTraceSteps.exerciseId,
        stepNo: exerciseTraceSteps.stepNo,
        line: exerciseTraceSteps.lineNo,
        explanation: exerciseTraceSteps.explanation,
        variables: exerciseTraceSteps.variables,
        output: exerciseTraceSteps.output,
      })
      .from(exerciseTraceSteps)
      .where(and(eq(exerciseTraceSteps.courseId, scope.courseId), inArray(exerciseTraceSteps.exerciseId, unique)))
      .orderBy(asc(exerciseTraceSteps.stepNo)),
  ]);
  return new Map(
    rows.map((row) => {
      const answers = answerRows.filter((a) => a.exerciseId === row.id);
      const key: AnswerKey = {
        id: row.id,
        slug: row.slug,
        title: row.title,
        type: row.type,
        codeLanguage: row.codeLanguage,
        points: row.points,
        topic: row.topicId && row.topicTitle ? { id: row.topicId, title: row.topicTitle } : null,
        settings: (row.settings ?? {}) as AnswerKey["settings"],
        explanationMd: row.explanationMd,
        options: optionRows.filter((o) => o.exerciseId === row.id).map(({ id, correct, feedbackMd }) => ({ id, correct, feedbackMd })),
        traceOutputs: answers.filter((a) => a.kind === "trace_output").map((a) => a.value),
        referenceSolution: answers.find((a) => a.kind === "reference_solution")?.value ?? null,
        acceptedSolutions: answers.filter((a) => a.kind === "accepted_solution").map((a) => a.value),
        steps: stepRows
          .filter((s) => s.exerciseId === row.id)
          .map(({ stepNo, line, explanation, variables, output }) => ({ stepNo, line, explanation, variables: variables ?? {}, output })),
      };
      return [row.id, key] as const;
    }),
  );
}

export interface Mark {
  /** true / false; null when the server can't mark it (write-the-code until the Phase 9 runner). */
  correct: boolean | null;
  /** correct_code: the fix matches the solution or an accepted fix. */
  matchedSolution?: boolean;
}

export function markResponse(key: AnswerKey, response: StudentResponse | null): Mark {
  if (!response) return { correct: false };
  switch (key.type) {
    case "mcq": {
      if (response.kind !== "mcq") return { correct: false };
      const correctIds = key.options.filter((o) => o.correct).map((o) => o.id);
      return { correct: gradeMcq(correctIds, response.selected).correct };
    }
    case "trace": {
      if (response.kind !== "trace") return { correct: false };
      const mode = isCompareMode(key.settings.compare) ? key.settings.compare : DEFAULT_COMPARE.mode;
      return { correct: gradeTrace(key.traceOutputs, response.answer, { mode, caseSensitive: key.settings.caseSensitive !== false }) };
    }
    case "correct_code": {
      if (response.kind !== "code" || (key.codeLanguage !== "cpp" && key.codeLanguage !== "python")) return { correct: false };
      const solutions = [key.referenceSolution, ...key.acceptedSolutions].filter((s): s is string => s !== null);
      const matched = matchesAnySolution(response.code, solutions, key.codeLanguage);
      return { correct: matched, matchedSolution: matched };
    }
    case "write_code":
      return { correct: null };
  }
}

/** The answer, explanation and trace table, sent only once the question has been answered. */
export interface Review {
  exerciseId: string;
  type: ExerciseType;
  /** The question's format (src/lib/exercise/ask.ts), or null. */
  ask: Ask | null;
  correct: boolean | null;
  matchedSolution?: boolean;
  correctOptionIds: string[];
  /** Feedback for every option, by option id (HTML). */
  optionFeedback: Record<string, string>;
  /** Trace: the expected output. */
  expectedOutput: string | null;
  steps: { stepNo: number; line: number | null; html: string; variables: Record<string, string>; output: string }[];
  solution: string | null;
  solutionLanguage: string | null;
  explanationHtml: string;
}

export function reviewFor(key: AnswerKey, mark: Mark): Review {
  return {
    exerciseId: key.id,
    type: key.type,
    ask: isAsk(key.settings.ask) ? key.settings.ask : null,
    correct: mark.correct,
    ...(mark.matchedSolution !== undefined ? { matchedSolution: mark.matchedSolution } : {}),
    correctOptionIds: key.options.filter((o) => o.correct).map((o) => o.id),
    optionFeedback: Object.fromEntries(key.options.filter((o) => o.feedbackMd).map((o) => [o.id, renderInlineMarkdown(o.feedbackMd)])),
    expectedOutput: key.type === "trace" ? (key.traceOutputs[0] ?? "") : null,
    steps: key.steps.map((s) => ({
      stepNo: s.stepNo,
      line: s.line,
      html: renderInlineMarkdown(s.explanation),
      variables: Object.fromEntries(Object.entries(s.variables).map(([k, v]) => [k, String(v)])),
      output: s.output,
    })),
    solution: key.type === "correct_code" || key.type === "write_code" ? key.referenceSolution : null,
    solutionLanguage: key.codeLanguage,
    explanationHtml: renderMarkdown(key.explanationMd),
  };
}
