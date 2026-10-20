// Starting, checking and submitting quiz and exam attempts.
//
// The attempt lives in a signed token (src/lib/grading/attempt-token.ts):
// which questions, in which order, their points and the deadline. Guests and
// students use the same tokens; for signed-in students the API route also
// writes the attempt to D1 (src/server/students/attempts.ts). Marking always happens here, on the server, with
// the answer keys; exam-mode answers and explanations are only returned by
// submit, never before.
import { type AttemptClaims, isPastDeadline, newNonce, signAttempt, verifyAttempt } from "@/lib/grading/attempt-token";
import { drawAcrossTopics, drawExamWithRetries, pickModel } from "@/lib/grading/exam-draw";
import { type ScoreSummary, scoreAttempt, shuffled } from "@/lib/grading/scoring";
import type { CourseScope } from "@/server/courses/scope";
import { type PublicExercise, getPublicExercises } from "@/server/exercises/catalog";
import { type Review, isBlank, loadAnswerKeys, markResponse, parseResponse, reviewFor } from "@/server/grading/grade";
import { getAssessmentSecret } from "@/server/platform/env";
import { SCORABLE_TYPES, type ScorableType, getCustomBank, getExam, getExamDrawData, getQuiz, getQuizQuestions, listPracticeTopics } from "./catalog";

export class AssessmentError extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 409 | 503,
    message: string,
  ) {
    super(message);
  }
}

export type AttemptKind = AttemptClaims["kind"];

export interface StartedAttempt {
  token: string;
  kind: AttemptKind;
  title: string;
  /** practice: a mark after each question; exam: marks and answers only after submitting. */
  feedback: "immediate" | "after_submit";
  startedAt: number;
  deadlineAt: number | null;
  passThreshold: number;
  questions: PublicExercise[];
  points: number[];
  /** Quizzes with several models: which one this attempt got ("A", "B", …). */
  model?: string;
}

/** Uniform random numbers from the platform's secure generator. */
function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
}

function withShuffledOptions(questions: PublicExercise[], allowed: boolean): PublicExercise[] {
  return questions.map((q) => (allowed && q.shuffleOptions && q.type === "mcq" ? { ...q, options: shuffled(q.options, secureRandom) } : q));
}

function secret(): string {
  try {
    return getAssessmentSecret();
  } catch (error) {
    console.error("assessments:", error);
    throw new AssessmentError(503, "Quizzes are not available right now.");
  }
}

/** `avoidModel`: the model this browser got last time, so a new attempt gets a different one. */
export async function startAttempt(
  scope: CourseScope,
  kind: "quiz" | "exam",
  slug: string,
  now = Date.now(),
  avoidModel: string | null = null,
): Promise<StartedAttempt> {
  let title: string;
  let feedback: StartedAttempt["feedback"];
  let passThreshold: number;
  let timeLimitSec: number | null;
  let refId: string;
  let order: { id: string; points: number }[];
  let shuffleOptions = true;
  let model: string | undefined;

  if (kind === "quiz") {
    const quiz = await getQuiz(scope, slug);
    if (!quiz) throw new AssessmentError(404, "This quiz doesn't exist in this course.");
    ({ title, feedback, passThreshold, timeLimitSec } = quiz);
    refId = quiz.id;
    const picked = pickModel(quiz.models, avoidModel, secureRandom);
    if (picked) {
      refId = picked.id;
      model = picked.label;
      title = modelTitle(title, picked.label);
    }
    shuffleOptions = quiz.shuffleOptions;
    order = await getQuizQuestions(scope, refId);
    if (quiz.shuffleQuestions) order = shuffled(order, secureRandom);
  } else {
    const exam = await getExam(scope, slug);
    if (!exam) throw new AssessmentError(404, "This practice exam doesn't exist in this course.");
    ({ title, passThreshold, timeLimitSec } = exam);
    feedback = "after_submit";
    refId = exam.id;
    const { rules, bank } = await getExamDrawData(scope, exam.id);
    const drawn = drawExamWithRetries(rules, bank, secureRandom);
    if (!drawn) throw new AssessmentError(503, "This course doesn't have enough questions for this exam yet.");
    order = drawn.ids.map((id, i) => ({ id, points: drawn.points[i] ?? 1 }));
    if (exam.shuffleQuestions) order = shuffled(order, secureRandom);
  }
  if (order.length === 0) throw new AssessmentError(404, "This quiz has no questions yet.");
  const started = await finishStart(scope, { kind, refId, title, feedback, passThreshold, timeLimitSec, order, shuffleOptions, now });
  return model ? { ...started, model } : started;
}

const modelTitle = (title: string, label: string) => `${title} (Model ${label})`;

/** Loads the drawn questions and signs the attempt. */
async function finishStart(
  scope: CourseScope,
  a: {
    kind: AttemptKind;
    refId: string;
    title: string;
    feedback: StartedAttempt["feedback"];
    passThreshold: number;
    timeLimitSec: number | null;
    order: { id: string; points: number }[];
    shuffleOptions: boolean;
    now: number;
  },
): Promise<StartedAttempt> {
  // Exam mode: no hints. The questions come back in the attempt's order.
  const questions = withShuffledOptions(
    await getPublicExercises(scope, a.order.map((q) => q.id), { withHints: a.feedback === "immediate" }),
    a.shuffleOptions,
  );
  const ids = questions.map((q) => q.id);
  const points = ids.map((id) => a.order.find((q) => q.id === id)?.points ?? 1);
  const claims: AttemptClaims = {
    v: 1,
    kind: a.kind,
    courseId: scope.courseId,
    refId: a.refId,
    questions: ids,
    points,
    startedAt: a.now,
    deadlineAt: a.timeLimitSec ? a.now + a.timeLimitSec * 1000 : null,
    nonce: newNonce(),
    ...(a.kind === "custom" ? { custom: { title: a.title, feedback: a.feedback, passThreshold: a.passThreshold } } : {}),
  };
  return {
    token: await signAttempt(claims, secret()),
    kind: a.kind,
    title: a.title,
    feedback: a.feedback,
    startedAt: a.now,
    deadlineAt: claims.deadlineAt,
    passThreshold: a.passThreshold,
    questions,
    points,
  };
}

// ------------------------------------------------------------- custom exams

/** Choices offered on the "build your own exam" page. */
export const CUSTOM_COUNTS = [5, 10, 15, 20, 30] as const;
export const CUSTOM_MINUTES = [0, 10, 15, 20, 30, 45, 60] as const;
export const CUSTOM_PASS_THRESHOLD = 60;

export interface CustomExamOptions {
  /** Topic slugs of this course. */
  topics: string[];
  count: number;
  /** 0: no timer. */
  minutes: number;
  feedback: StartedAttempt["feedback"];
  types: ScorableType[];
}

/** The student's choices, checked, or null when they don't make sense. */
export function parseCustomOptions(raw: unknown): CustomExamOptions | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const topics = r.topics;
  if (!Array.isArray(topics) || topics.length === 0 || topics.length > 50) return null;
  if (!topics.every((t) => typeof t === "string" && /^[a-z0-9-]{1,80}$/.test(t))) return null;
  const count = r.count;
  const minutes = r.minutes;
  if (!(CUSTOM_COUNTS as readonly unknown[]).includes(count) || !(CUSTOM_MINUTES as readonly unknown[]).includes(minutes)) return null;
  if (r.feedback !== "immediate" && r.feedback !== "after_submit") return null;
  const types = r.types === undefined ? [...SCORABLE_TYPES] : r.types;
  if (!Array.isArray(types) || types.length === 0 || !types.every((t) => (SCORABLE_TYPES as readonly unknown[]).includes(t))) return null;
  return {
    topics: [...new Set(topics as string[])],
    count: count as number,
    minutes: minutes as number,
    feedback: r.feedback,
    types: [...new Set(types as ScorableType[])],
  };
}

function customTitle(topicTitles: string[]): string {
  if (topicTitles.length === 1) return `Custom exam: ${topicTitles[0]}`;
  if (topicTitles.length <= 3) return `Custom exam: ${topicTitles.slice(0, -1).join(", ")} and ${topicTitles.at(-1)}`;
  return `Custom exam: ${topicTitles.slice(0, 2).join(", ")} and ${topicTitles.length - 2} more topics`;
}

/** Draws a custom exam from the topics the student chose, spread evenly over them. */
export async function startCustomAttempt(scope: CourseScope, rawOptions: unknown, now = Date.now()): Promise<StartedAttempt> {
  const options = parseCustomOptions(rawOptions);
  if (!options) throw new AssessmentError(400, "Choose at least one topic, how many questions, and a timer.");
  const chosen = (await listPracticeTopics(scope)).filter((t) => options.topics.includes(t.slug));
  if (chosen.length === 0) throw new AssessmentError(400, "Those topics don't have questions in this course yet.");
  const bank = await getCustomBank(
    scope,
    chosen.map((t) => t.id),
    options.types,
  );
  if (bank.length === 0) throw new AssessmentError(400, "There are no questions of those types in those topics yet. Try more types or topics.");
  const drawn = drawAcrossTopics(bank, options.count, secureRandom);
  return finishStart(scope, {
    kind: "custom",
    refId: "custom",
    title: customTitle(chosen.map((t) => t.title)),
    feedback: options.feedback,
    passThreshold: CUSTOM_PASS_THRESHOLD,
    timeLimitSec: options.minutes > 0 ? options.minutes * 60 : null,
    order: drawn.map((q) => ({ id: q.id, points: 1 })),
    shuffleOptions: true,
    now,
  });
}

interface AttemptRef {
  id: string;
  title: string;
  passThreshold: number;
  timeLimitSec: number | null;
  feedback: StartedAttempt["feedback"];
}

/** What the attempt belongs to: the quiz or exam in the database, or (custom exams) the signed claims themselves. */
async function refFor(scope: CourseScope, kind: AttemptKind, slug: string, claims: AttemptClaims | null): Promise<AttemptRef | null> {
  if (kind === "custom") {
    if (slug !== CUSTOM_SLUG || !claims?.custom) return null;
    const { title, feedback, passThreshold } = claims.custom;
    const timeLimitSec = claims.deadlineAt === null ? null : Math.round((claims.deadlineAt - claims.startedAt) / 1000);
    return { id: "custom", title, feedback, passThreshold, timeLimitSec };
  }
  if (kind === "quiz") {
    const quiz = await getQuiz(scope, slug);
    // An attempt at one of the quiz's models belongs to that model.
    const model = quiz?.models.find((m) => m.id === claims?.refId);
    return quiz && model ? { ...quiz, id: model.id, title: modelTitle(quiz.title, model.label) } : quiz;
  }
  const exam = await getExam(scope, slug);
  return exam ? { ...exam, feedback: "after_submit" } : null;
}

/** The claims of a validly signed token (no course or deadline checks: callers did those). */
export async function readAttemptClaims(token: unknown): Promise<AttemptClaims | null> {
  return typeof token === "string" ? verifyAttempt(token, secret()) : null;
}

/** Custom exams live at /api/courses/<course>/custom/exam/… */
export const CUSTOM_SLUG = "exam";

/** Claims of a token that belongs to this course's quiz, exam or custom exam, or an AssessmentError. */
async function claimsFor(scope: CourseScope, kind: AttemptKind, slug: string, token: unknown): Promise<{ claims: AttemptClaims; ref: AttemptRef }> {
  const claims = typeof token === "string" ? await verifyAttempt(token, secret()) : null;
  const ref = await refFor(scope, kind, slug, claims);
  if (!ref && kind === "custom" && slug === CUSTOM_SLUG) throw new AssessmentError(400, "This attempt isn't valid. Build the exam again.");
  if (!ref) throw new AssessmentError(404, "This quiz doesn't exist in this course.");
  if (!claims || claims.kind !== kind || claims.courseId !== scope.courseId || claims.refId !== ref.id) {
    throw new AssessmentError(400, "This attempt isn't valid. Start the quiz again.");
  }
  return { claims, ref };
}

/**
 * Practice quizzes and custom exams with "answers as I go": mark one answer
 * straight away. Refused in exam mode (exam-mode quizzes, practice exams and
 * custom exams with answers at the end).
 */
export async function checkInAttempt(
  scope: CourseScope,
  kind: "quiz" | "custom",
  slug: string,
  token: unknown,
  exerciseId: unknown,
  rawResponse: unknown,
  now = Date.now(),
): Promise<Review> {
  if (kind === "quiz") {
    // Checked before the token, so exam mode never marks anything early, whatever is sent.
    const quiz = await getQuiz(scope, slug);
    if (!quiz) throw new AssessmentError(404, "This quiz doesn't exist in this course.");
    if (quiz.feedback !== "immediate") throw new AssessmentError(403, "In exam mode, answers are marked when you submit.");
  }
  const { claims, ref } = await claimsFor(scope, kind, slug, token);
  if (ref.feedback !== "immediate") throw new AssessmentError(403, "In exam mode, answers are marked when you submit.");
  if (typeof exerciseId !== "string" || !claims.questions.includes(exerciseId)) {
    throw new AssessmentError(400, "That question isn't part of this attempt.");
  }
  if (isPastDeadline(claims, now)) throw new AssessmentError(409, "Time is up for this attempt.");
  const key = (await loadAnswerKeys(scope, [exerciseId])).get(exerciseId);
  if (!key) throw new AssessmentError(404, "That question isn't available any more.");
  const response = parseResponse(key.type, rawResponse);
  if (!response) throw new AssessmentError(400, "That answer couldn't be read.");
  return reviewFor(key, markResponse(key, response));
}

export interface QuestionResult {
  exerciseId: string;
  title: string;
  points: number;
  pointsAwarded: number;
  answered: boolean;
  review: Review;
}

export interface AttemptResult extends ScoreSummary {
  kind: AttemptKind;
  title: string;
  passThreshold: number;
  submittedAt: number;
  startedAt: number;
  timeLimitSec: number | null;
  /** Topic titles for byTopic (by topic id). */
  topicTitles: Record<string, string>;
  questions: QuestionResult[];
}

export async function submitAttempt(
  scope: CourseScope,
  kind: AttemptKind,
  slug: string,
  token: unknown,
  rawResponses: unknown,
  now = Date.now(),
): Promise<AttemptResult> {
  const { claims, ref } = await claimsFor(scope, kind, slug, token);
  if (isPastDeadline(claims, now)) {
    throw new AssessmentError(409, "The time limit passed before your answers arrived, so this attempt can't be marked. Start a new attempt.");
  }
  if (rawResponses !== undefined && (typeof rawResponses !== "object" || rawResponses === null || Array.isArray(rawResponses))) {
    throw new AssessmentError(400, "Those answers couldn't be read.");
  }
  const responses = (rawResponses ?? {}) as Record<string, unknown>;
  const keys = await loadAnswerKeys(scope, claims.questions);

  const results: QuestionResult[] = [];
  const scored = claims.questions.flatMap((id, i) => {
    const key = keys.get(id);
    if (!key) return []; // deleted since the attempt started: left out of the score
    const response = parseResponse(key.type, responses[id]);
    // write_code is never in quizzes or exams; if it were, it couldn't be marked.
    const mark = key.type === "write_code" ? { correct: false } : markResponse(key, response);
    const points = claims.points[i] ?? 1;
    results.push({
      exerciseId: id,
      title: key.title,
      points,
      pointsAwarded: mark.correct ? points : 0,
      answered: !isBlank(response),
      review: reviewFor(key, mark),
    });
    return [{ exerciseId: id, points, correct: mark.correct === true, topic: key.topic?.id ?? null }];
  });
  const summary = scoreAttempt(scored, ref.passThreshold);
  const topicTitles: Record<string, string> = {};
  for (const key of keys.values()) if (key.topic) topicTitles[key.topic.id] = key.topic.title;
  return {
    ...summary,
    kind,
    title: ref.title,
    passThreshold: ref.passThreshold,
    submittedAt: now,
    startedAt: claims.startedAt,
    timeLimitSec: ref.timeLimitSec,
    topicTitles,
    questions: results,
  };
}

/** Marks a single practice question (exercise pages and practice sets). */
export async function checkExercise(scope: CourseScope, exerciseId: string, rawResponse: unknown): Promise<Review> {
  const key = (await loadAnswerKeys(scope, [exerciseId])).get(exerciseId);
  if (!key) throw new AssessmentError(404, "This question doesn't exist in this course.");
  const response = parseResponse(key.type, rawResponse);
  if (!response) throw new AssessmentError(400, "That answer couldn't be read.");
  return reviewFor(key, markResponse(key, response));
}
