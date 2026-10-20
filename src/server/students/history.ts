// A student's history in one course: quiz and exam attempts (with a review of
// each submitted one) and recent practice answers.
import { DEADLINE_GRACE_MS } from "@/lib/grading/attempt-token";
import { type ScoredQuestion, scoreAttempt } from "@/lib/grading/scoring";
import type { CourseScope } from "@/server/courses/scope";
import { type PublicExercise, getPublicExercises } from "@/server/exercises/catalog";
import { type Review, loadAnswerKeys, markResponse, parseResponse, reviewFor } from "@/server/grading/grade";
import { getBindings } from "@/server/platform/env";

export type HistoryKind = "quiz" | "exam" | "custom";
export type AttemptState = "submitted" | "in_progress" | "unfinished";

export interface AttemptRow {
  kind: HistoryKind;
  id: string;
  title: string;
  state: AttemptState;
  startedAt: number;
  submittedAt: number | null;
  score: number | null;
  maxScore: number | null;
  percent: number | null;
  passed: boolean | null;
  /** Where to take it again (quizzes and exams). */
  retakeHref: string;
  /** The review of a submitted attempt. */
  reviewHref: string | null;
}

/** `<quiz>-model-<letter>` belongs to `<quiz>` (see src/server/assessments/catalog.ts). */
const MODEL_SLUG = /^(.+)-model-[b-z]$/;

interface RawAttempt {
  kind: HistoryKind;
  id: string;
  status: "in_progress" | "submitted" | "expired";
  startedAt: number;
  deadlineAt: number | null;
  submittedAt: number | null;
  score: number | null;
  maxScore: number | null;
  passed: number | null;
  refSlug: string | null;
  title: string;
}

const ATTEMPTS_SQL = `
  SELECT 'quiz' AS kind, a.id, a.status, a.started_at AS startedAt, a.deadline_at AS deadlineAt, a.submitted_at AS submittedAt,
         a.score, a.max_score AS maxScore, a.passed, q.slug AS refSlug, q.title
    FROM quiz_attempts a JOIN quizzes q ON q.course_id = a.course_id AND q.id = a.quiz_id
   WHERE a.user_id = ?1 AND a.course_id = ?2
  UNION ALL
  SELECT 'exam', a.id, a.status, a.started_at, a.deadline_at, a.submitted_at, a.score, a.max_score, a.passed, t.slug, t.title
    FROM exam_attempts a JOIN exam_templates t ON t.course_id = a.course_id AND t.id = a.exam_template_id
   WHERE a.user_id = ?1 AND a.course_id = ?2
  UNION ALL
  SELECT 'custom', a.id, a.status, a.started_at, a.deadline_at, a.submitted_at, a.score, a.max_score, a.passed, NULL, a.title
    FROM custom_exam_attempts a
   WHERE a.user_id = ?1 AND a.course_id = ?2`;

function toRow(scope: CourseScope, r: RawAttempt, now: number): AttemptRow {
  const base = `/courses/${scope.slug}`;
  const refSlug = r.refSlug ? (MODEL_SLUG.exec(r.refSlug)?.[1] ?? r.refSlug) : null;
  const expired = r.status === "expired" || (r.status === "in_progress" && r.deadlineAt !== null && now > r.deadlineAt + DEADLINE_GRACE_MS);
  const state: AttemptState = r.status === "submitted" ? "submitted" : expired ? "unfinished" : "in_progress";
  return {
    kind: r.kind,
    id: r.id,
    title: r.title,
    state,
    startedAt: r.startedAt,
    submittedAt: r.submittedAt,
    score: r.score,
    maxScore: r.maxScore,
    percent: r.score !== null && r.maxScore ? Math.floor((r.score * 100) / r.maxScore) : null,
    passed: r.passed === null ? null : r.passed === 1,
    retakeHref: r.kind === "quiz" ? `${base}/quizzes/${refSlug}` : r.kind === "exam" ? `${base}/exams/${refSlug}` : `${base}/build-exam`,
    reviewHref: state === "submitted" ? `/dashboard/${scope.slug}/history/${r.id}` : null,
  };
}

export async function listAttempts(userId: string, scope: CourseScope, limit = 50, now = Date.now()): Promise<AttemptRow[]> {
  const { results } = await getBindings()
    .db.prepare(`${ATTEMPTS_SQL} ORDER BY startedAt DESC LIMIT ?3`)
    .bind(userId, scope.courseId, Math.min(Math.max(limit, 1), 200))
    .all<RawAttempt>();
  return results.map((r) => toRow(scope, r, now));
}

export interface PracticeRow {
  slug: string;
  title: string;
  type: string;
  /** The server's mark; null when it can't mark the answer (see practiceRecord). */
  correct: boolean | null;
  /** The browser's own test run, for code answers. Never a mark. */
  selfCheck: "passed" | "failed" | null;
  at: number;
}

/** The latest practice answers (single questions and practice sets). */
export async function listPracticeAnswers(userId: string, scope: CourseScope, limit = 30): Promise<PracticeRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT e.slug, e.title, e.type, a.is_correct AS correct, a.self_check AS selfCheck, a.created_at AS at FROM exercise_attempts a
         JOIN exercises e ON e.course_id = a.course_id AND e.id = a.exercise_id
        WHERE a.user_id = ? AND a.course_id = ? AND e.status = 'published'
        ORDER BY a.created_at DESC LIMIT ?`,
    )
    .bind(userId, scope.courseId, Math.min(Math.max(limit, 1), 200))
    .all<{ slug: string; title: string; type: string; correct: number | null; selfCheck: "passed" | "failed" | null; at: number }>();
  return results.map((r) => ({ ...r, correct: r.correct === null ? null : r.correct === 1 }));
}

// ---------------------------------------------------------------------------
// Reviewing one submitted attempt
// ---------------------------------------------------------------------------

export interface ReviewedQuestion {
  question: PublicExercise;
  /** What the student sent, as stored. */
  response: unknown;
  answered: boolean;
  correct: boolean;
  points: number;
  pointsAwarded: number;
  review: Review;
}

export interface AttemptReview {
  row: AttemptRow;
  passThreshold: number;
  byTopic: { title: string; correct: number; total: number; score: number; maxScore: number }[];
  questions: ReviewedQuestion[];
}

interface StoredAnswer {
  exerciseId: string;
  position: number;
  points: number;
  response: string | null;
  isCorrect: number | null;
  pointsAwarded: number | null;
}

function kindOfId(id: string): HistoryKind | null {
  if (id.startsWith("qat_")) return "quiz";
  if (id.startsWith("xat_")) return "exam";
  if (id.startsWith("cat_")) return "custom";
  return null;
}

/** A submitted attempt of this student in this course, with every question's answer and explanation. Null otherwise. */
export async function getAttemptReview(userId: string, scope: CourseScope, attemptId: string, now = Date.now()): Promise<AttemptReview | null> {
  const kind = kindOfId(attemptId);
  if (!kind || attemptId.length > 80) return null;
  const { db } = getBindings();
  const raw = await db.prepare(`SELECT * FROM (${ATTEMPTS_SQL}) WHERE id = ?3 AND kind = ?4`).bind(userId, scope.courseId, attemptId, kind).first<RawAttempt>();
  if (!raw || raw.status !== "submitted") return null;
  const row = toRow(scope, raw, now);

  let answers: StoredAnswer[];
  let passThreshold: number;
  if (kind === "quiz") {
    const [attempt, responses] = await db.batch<Record<string, unknown>>([
      db
        .prepare(
          `SELECT a.question_order AS questionOrder, a.quiz_id AS quizId, q.pass_threshold AS passThreshold FROM quiz_attempts a
             JOIN quizzes q ON q.course_id = a.course_id AND q.id = a.quiz_id WHERE a.id = ? AND a.user_id = ?`,
        )
        .bind(attemptId, userId),
      db
        .prepare(
          `SELECT r.exercise_id AS exerciseId, r.response, r.is_correct AS isCorrect, r.points_awarded AS pointsAwarded, coalesce(qq.points, 1) AS points
             FROM quiz_responses r
             JOIN quiz_attempts a ON a.id = r.attempt_id
             LEFT JOIN quiz_questions qq ON qq.course_id = r.course_id AND qq.quiz_id = a.quiz_id AND qq.exercise_id = r.exercise_id
            WHERE r.attempt_id = ? AND r.course_id = ?`,
        )
        .bind(attemptId, scope.courseId),
    ]);
    const a = attempt?.results[0] as { questionOrder: string; passThreshold: number } | undefined;
    if (!a) return null;
    passThreshold = a.passThreshold;
    const order = JSON.parse(a.questionOrder) as string[];
    const byId = new Map((responses?.results ?? []).map((r) => [r.exerciseId as string, r]));
    answers = order.flatMap((id, i) => {
      const r = byId.get(id);
      return r ? [{ exerciseId: id, position: i + 1, points: Number(r.points), response: r.response as string | null, isCorrect: r.isCorrect as number | null, pointsAwarded: r.pointsAwarded as number | null }] : [];
    });
  } else {
    const table = kind === "exam" ? "exam_attempt_questions" : "custom_exam_questions";
    const column = kind === "exam" ? "exam_attempt_id" : "attempt_id";
    const threshold =
      kind === "exam"
        ? db.prepare("SELECT t.pass_threshold AS passThreshold FROM exam_attempts a JOIN exam_templates t ON t.course_id = a.course_id AND t.id = a.exam_template_id WHERE a.id = ?").bind(attemptId)
        : db.prepare("SELECT pass_threshold AS passThreshold FROM custom_exam_attempts WHERE id = ?").bind(attemptId);
    const [t, rows] = await db.batch<Record<string, unknown>>([
      threshold,
      db
        .prepare(
          `SELECT exercise_id AS exerciseId, position, points, response, is_correct AS isCorrect, points_awarded AS pointsAwarded
             FROM ${table} WHERE ${column} = ? AND course_id = ? ORDER BY position`,
        )
        .bind(attemptId, scope.courseId),
    ]);
    passThreshold = Number(t?.results[0]?.passThreshold ?? 60);
    answers = (rows?.results ?? []) as unknown as StoredAnswer[];
  }

  const ids = answers.map((a) => a.exerciseId);
  const [keys, publicQuestions] = await Promise.all([loadAnswerKeys(scope, ids), getPublicExercises(scope, ids, { anyStatus: true })]);
  const questionById = new Map(publicQuestions.map((q) => [q.id, q]));
  const questions: ReviewedQuestion[] = [];
  const scored: ScoredQuestion[] = [];
  const topicTitles = new Map<string, string>();
  for (const a of answers) {
    const key = keys.get(a.exerciseId);
    const question = questionById.get(a.exerciseId);
    if (!key || !question) continue; // deleted since
    let response: unknown;
    try {
      response = a.response ? JSON.parse(a.response) : null;
    } catch {
      response = null;
    }
    const answered = a.isCorrect !== null;
    const correct = a.isCorrect === 1;
    // The explanation and the right answer, worked out again from today's answer key.
    const review = { ...reviewFor(key, markResponse(key, parseResponse(key.type, response))), correct: answered ? correct : false };
    questions.push({ question, response, answered, correct, points: a.points, pointsAwarded: a.pointsAwarded ?? 0, review });
    if (key.topic) topicTitles.set(key.topic.id, key.topic.title);
    scored.push({ exerciseId: a.exerciseId, points: a.points, correct, topic: key.topic?.id ?? null });
  }
  const summary = scoreAttempt(scored, passThreshold);
  return {
    row,
    passThreshold,
    byTopic: summary.byTopic.map((t) => ({ title: t.topic ? (topicTitles.get(t.topic) ?? "Other") : "Other", correct: t.correct, total: t.total, score: t.score, maxScore: t.maxScore })),
    questions,
  };
}
