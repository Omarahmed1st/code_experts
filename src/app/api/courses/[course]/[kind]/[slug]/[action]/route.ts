// The practice API. Every answer is marked here, on the server, with answer
// keys the browser never sees beforehand. Everything is scoped to the course
// in the URL: a question, quiz or exam from another course is "not found".
//
//   POST /api/courses/<course>/exercises/<exercise>/check   mark one practice answer
//   POST /api/courses/<course>/quizzes/<quiz>/status        attempts left (quizzes with an attempt limit)
//   POST /api/courses/<course>/quizzes/<quiz>/start         start an attempt (signed token + questions)
//   POST /api/courses/<course>/quizzes/<quiz>/check         practice quizzes: mark one answer now
//   POST /api/courses/<course>/quizzes/<quiz>/submit        mark the whole attempt
//   POST /api/courses/<course>/exams/<exam>/start           draw a practice exam
//   POST /api/courses/<course>/exams/<exam>/submit          mark it
//   POST /api/courses/<course>/custom/exam/start            draw a custom exam from the topics the student chose
//   POST /api/courses/<course>/custom/exam/check            custom exam with answers as you go: mark one answer
//   POST /api/courses/<course>/custom/exam/submit           mark it
//
// Signed-in students (Phase 5): the same calls also keep their answers and
// attempts (src/server/students). Quizzes with an attempt limit need an
// account, and the limit counts per student.
import { type AttemptClaims } from "@/lib/grading/attempt-token";
import { practiceRecord } from "@/lib/grading/practice-record";
import { MAX_CODE_LENGTH } from "@/server/grading/grade";
import {
  AssessmentError,
  CUSTOM_SLUG,
  type StartedAttempt,
  checkExercise,
  checkInAttempt,
  readAttemptClaims,
  startAttempt,
  startCustomAttempt,
  submitAttempt,
} from "@/server/assessments/attempts";
import { lastModel, modelCookie, tryStatus } from "@/lib/grading/attempt-limit";
import { getQuiz } from "@/server/assessments/catalog";
import { type RequestAccount, accountFromRequest } from "@/server/auth/request-session";
import { quizTries, recordLimitedStart, recordStart, recordSubmit } from "@/server/students/attempts";
import { recordPracticeAnswer } from "@/server/students/progress";
import { type CourseScope, resolveCourse } from "@/server/courses/scope";
import { getPublicExercise } from "@/server/exercises/catalog";
import { json, jsonError, readJson } from "@/server/http/json";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ course: string; kind: string; slug: string; action: string }> };

const ACTIONS: Record<string, readonly string[]> = {
  exercises: ["check"],
  quizzes: ["status", "start", "check", "submit"],
  exams: ["start", "submit"],
  custom: ["start", "check", "submit"],
};

/** One answer is at most a program; a submission is at most 60 answers of that size. */
const ONE_ANSWER_BYTES = MAX_CODE_LENGTH + 4096;
const SUBMIT_BYTES = 60 * ONE_ANSWER_BYTES;

export async function POST(request: Request, { params }: Context) {
  const { course: courseSlug, kind, slug, action } = await params;
  if (!ACTIONS[kind]?.includes(action)) return jsonError(404, "Not found.");
  const course = await resolveCourse(courseSlug);
  if (!course) return jsonError(404, "This course doesn't exist.");

  if (kind === "custom" && slug !== CUSTOM_SLUG) return jsonError(404, "Not found.");
  const limit = action === "submit" ? SUBMIT_BYTES : action === "start" ? 4096 : ONE_ANSWER_BYTES;
  const body = (action === "start" && kind !== "custom") || action === "status" ? {} : await readJson(request, limit);
  if (body === null || typeof body !== "object") return jsonError(400, "The request couldn't be read.");
  const b = body as Record<string, unknown>;

  try {
    const user = await accountFromRequest(request);
    if (kind === "exercises") {
      const exercise = await getPublicExercise(course, slug);
      if (!exercise) return jsonError(404, "This question doesn't exist in this course.");
      const review = await checkExercise(course, exercise.id, b.response);
      if (user) await recordPracticeAnswer(user.id, course, exercise.id, b.response, practiceRecord(review, b.response));
      return json(review);
    }
    if (kind === "custom" && action === "start") return json(await recorded(user, await startCustomAttempt(course, b.options)));
    if (kind === "quizzes" && (action === "status" || action === "start")) return await quizStart(request, course, slug, action, user);
    const attemptKind = kind === "quizzes" ? "quiz" : kind === "exams" ? "exam" : "custom";
    if (action === "start" && attemptKind !== "custom") return json(await recorded(user, await startAttempt(course, attemptKind, slug)));
    if (action === "check" && attemptKind !== "exam") return json(await checkInAttempt(course, attemptKind, slug, b.token, b.exerciseId, b.response));
    const result = await submitAttempt(course, attemptKind, slug, b.token, b.responses);
    if (user) {
      const claims = await readAttemptClaims(b.token);
      const responses = b.responses && typeof b.responses === "object" ? (b.responses as Record<string, unknown>) : {};
      if (claims) await recordSubmit(user.id, claims, result, responses);
    }
    return json(result);
  } catch (error) {
    if (error instanceof AssessmentError) return jsonError(error.status, error.message);
    console.error("practice api:", error);
    return jsonError(500, "Something went wrong while marking. Please try again.");
  }
}

/** Writes down a signed-in student's new attempt (guests: nothing is stored). */
async function recorded(user: RequestAccount | null, started: StartedAttempt): Promise<StartedAttempt> {
  if (!user) return started;
  const claims = await readAttemptClaims(started.token);
  if (claims) await recordStart(user.id, claims);
  return started;
}

/**
 * "status" reports attempts left (quizzes with an attempt limit). "start" is
 * refused while locked, otherwise starts and records the attempt.
 *
 * Quizzes with an attempt limit (the final quiz) need a student account: the
 * attempts are counted per student in quiz_attempts, so a private window or
 * another browser doesn't give more tries. Quizzes with several models give
 * each attempt a model other than the last one (the student's last attempt,
 * or for guests a cookie).
 */
async function quizStart(request: Request, course: CourseScope, slug: string, action: string, user: RequestAccount | null): Promise<Response> {
  const quiz = await getQuiz(course, slug);
  if (!quiz) return jsonError(404, "This quiz doesn't exist in this course.");
  if (quiz.maxAttempts === null && action === "status") return json({ maxAttempts: null, used: 0, unlockAt: null, signInRequired: false });
  const now = Date.now();
  const quizIds = quiz.models.length > 0 ? quiz.models.map((m) => m.id) : [quiz.id];
  const cookies = request.headers.get("cookie");
  const path = `/api/courses/${course.slug}/quizzes/${slug}`;
  const secure = new URL(request.url).protocol === "https:";

  if (quiz.maxAttempts !== null && !user) {
    if (action === "status") return json({ maxAttempts: quiz.maxAttempts, used: 0, unlockAt: null, signInRequired: true });
    return json({ error: "Sign in to take this quiz. Its attempts are counted on your account.", signInRequired: true }, 401);
  }

  let avoid = lastModel(cookies, quiz.id);
  if (user) {
    const { tries, lastQuizId } = await quizTries(user.id, course, quizIds, now);
    avoid = quiz.models.find((m) => m.id === lastQuizId)?.label ?? null;
    if (quiz.maxAttempts !== null) {
      const status = tryStatus(tries, quiz.maxAttempts);
      if (action === "status") return json({ ...status, signInRequired: false });
      if (status.unlockAt !== null) return json({ error: lockedMessage(quiz.maxAttempts), ...status }, 429);
    }
  }

  const started = await startAttempt(course, "quiz", slug, now, avoid);
  if (user) {
    const claims = (await readAttemptClaims(started.token)) as AttemptClaims;
    if (quiz.maxAttempts === null) await recordStart(user.id, claims);
    else if (!(await recordLimitedStart(user.id, claims, quizIds, quiz.maxAttempts))) {
      const { tries } = await quizTries(user.id, course, quizIds, now);
      return json({ error: lockedMessage(quiz.maxAttempts), ...tryStatus(tries, quiz.maxAttempts) }, 429);
    }
    return json(started);
  }
  const response = json(started);
  if (started.model) response.headers.append("Set-Cookie", modelCookie(started.model, quiz.id, path, secure));
  return response;
}

function lockedMessage(max: number): string {
  return `You've used all ${max} attempts. This quiz opens again 24 hours after the first of them.`;
}

export function GET() {
  return jsonError(405, "Use POST.");
}
