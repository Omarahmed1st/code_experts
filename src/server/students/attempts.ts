// Quiz and exam attempts of signed-in students, kept in D1 (Phase 5).
//
// The attempt itself still travels as a signed token (src/lib/grading/attempt-token.ts),
// so guests and students take quizzes the same way. For a signed-in student the
// same claims are also written down: the attempt row when it starts (so the
// attempt limit counts per student and unfinished attempts show in the
// history), then the score and every answer when it is submitted.
//
//   quizzes        quiz_attempts         + quiz_responses
//   practice exams exam_attempts         + exam_attempt_questions
//   custom exams   custom_exam_attempts  + custom_exam_questions   (migration 0005)
//
// The row id comes from the token's random nonce, so submitting twice (or
// from two tabs) updates one attempt instead of adding a second.
import type { AttemptClaims } from "@/lib/grading/attempt-token";
import { LOCK_WINDOW_MS } from "@/lib/grading/attempt-limit";
import type { AttemptResult } from "@/server/assessments/attempts";
import type { CourseScope } from "@/server/courses/scope";
import { getBindings } from "@/server/platform/env";
import { storableJson } from "./progress";

type Kind = AttemptClaims["kind"];

const TABLES = {
  quiz: { attempts: "quiz_attempts", prefix: "qat" },
  exam: { attempts: "exam_attempts", prefix: "xat" },
  custom: { attempts: "custom_exam_attempts", prefix: "cat" },
} as const;

/** The D1 id of a token's attempt. Nonces are base64url, so the id is plain text. */
export function attemptRowId(kind: Kind, nonce: string): string {
  return `${TABLES[kind].prefix}_${nonce.replace(/[^A-Za-z0-9_-]/g, "")}`;
}

function insertAttempt(userId: string, claims: AttemptClaims, status: "in_progress" | "submitted"): D1PreparedStatement {
  const { db } = getBindings();
  const id = attemptRowId(claims.kind, claims.nonce);
  if (claims.kind === "quiz") {
    return db
      .prepare(
        `INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id, status, question_order, started_at, deadline_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      )
      .bind(id, claims.courseId, claims.refId, userId, status, JSON.stringify(claims.questions), claims.startedAt, claims.deadlineAt);
  }
  if (claims.kind === "exam") {
    return db
      .prepare(
        `INSERT INTO exam_attempts (id, course_id, exam_template_id, user_id, status, started_at, deadline_at)
         VALUES (?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
      )
      // Practice exams always have a time limit; the fallback only guards the NOT NULL.
      .bind(id, claims.courseId, claims.refId, userId, status, claims.startedAt, claims.deadlineAt ?? claims.startedAt);
  }
  const custom = claims.custom!;
  return db
    .prepare(
      `INSERT INTO custom_exam_attempts (id, course_id, user_id, title, feedback, pass_threshold, status, started_at, deadline_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`,
    )
    .bind(id, claims.courseId, userId, custom.title.slice(0, 300), custom.feedback, custom.passThreshold, status, claims.startedAt, claims.deadlineAt);
}

/**
 * The drawn questions of an exam or custom exam, in order (quizzes keep the
 * order in quiz_attempts.question_order). One statement whatever the length:
 * D1 allows 100 bound values per query, so the list goes in as JSON.
 */
function insertQuestionRows(claims: AttemptClaims): D1PreparedStatement | null {
  if (claims.kind === "quiz") return null;
  const table = claims.kind === "exam" ? "exam_attempt_questions" : "custom_exam_questions";
  const attemptColumn = claims.kind === "exam" ? "exam_attempt_id" : "attempt_id";
  const rows = claims.questions.map((exerciseId, i) => ({ e: exerciseId, p: i + 1, pt: claims.points[i] ?? 1 }));
  return getBindings()
    .db.prepare(
      `INSERT INTO ${table} (course_id, ${attemptColumn}, exercise_id, position, points)
       SELECT ?1, ?2, json_extract(j.value, '$.e'), json_extract(j.value, '$.p'), json_extract(j.value, '$.pt') FROM json_each(?3) j
       WHERE 1 ON CONFLICT DO NOTHING`,
    )
    .bind(claims.courseId, attemptRowId(claims.kind, claims.nonce), JSON.stringify(rows));
}

/** Writes down an attempt that a signed-in student just started. */
export async function recordStart(userId: string, claims: AttemptClaims): Promise<void> {
  const statements = [insertAttempt(userId, claims, "in_progress")];
  const questions = insertQuestionRows(claims);
  if (questions) statements.push(questions);
  await getBindings().db.batch(statements);
}

/**
 * Starts an attempt at a quiz with an attempt limit, only if the student has
 * fewer than `maxAttempts` starts at it (any of its models) in the last 24
 * hours. The check and the insert are one statement, so two tabs can't both
 * slip through. Returns false when the limit was reached.
 */
export async function recordLimitedStart(userId: string, claims: AttemptClaims, quizIds: readonly string[], maxAttempts: number): Promise<boolean> {
  const id = attemptRowId("quiz", claims.nonce);
  const result = await getBindings()
    .db.prepare(
      `INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id, status, question_order, started_at, deadline_at)
       SELECT ?1, ?2, ?3, ?4, 'in_progress', ?5, ?6, ?7
        WHERE (SELECT count(*) FROM quiz_attempts
                WHERE user_id = ?4 AND course_id = ?2 AND quiz_id IN (SELECT value FROM json_each(?8)) AND started_at > ?9) < ?10`,
    )
    .bind(
      id,
      claims.courseId,
      claims.refId,
      userId,
      JSON.stringify(claims.questions),
      claims.startedAt,
      claims.deadlineAt,
      JSON.stringify(quizIds),
      claims.startedAt - LOCK_WINDOW_MS,
      maxAttempts,
    )
    .run();
  return (result.meta.changes ?? 0) > 0;
}

/** Start times in the last 24 hours (oldest first) and the model of the latest attempt, for a quiz's attempt limit. */
export async function quizTries(userId: string, scope: CourseScope, quizIds: readonly string[], now = Date.now()): Promise<{ tries: number[]; lastQuizId: string | null }> {
  const { db } = getBindings();
  const [recent, last] = await db.batch<{ startedAt?: number; quizId?: string }>([
    db
      .prepare(
        `SELECT started_at AS startedAt FROM quiz_attempts
          WHERE user_id = ?1 AND course_id = ?2 AND quiz_id IN (SELECT value FROM json_each(?3)) AND started_at > ?4 ORDER BY started_at`,
      )
      .bind(userId, scope.courseId, JSON.stringify(quizIds), now - LOCK_WINDOW_MS),
    db
      .prepare(
        `SELECT quiz_id AS quizId FROM quiz_attempts
          WHERE user_id = ?1 AND course_id = ?2 AND quiz_id IN (SELECT value FROM json_each(?3)) ORDER BY started_at DESC LIMIT 1`,
      )
      .bind(userId, scope.courseId, JSON.stringify(quizIds)),
  ]);
  return {
    tries: (recent?.results ?? []).map((r) => Number(r.startedAt)),
    lastQuizId: (last?.results[0]?.quizId as string | undefined) ?? null,
  };
}

/**
 * Writes down a submitted attempt: the score, and each answer with its mark.
 * Unanswered questions are kept with no mark (is_correct NULL), so they never
 * count as mistakes. An attempt that is already submitted, or belongs to
 * someone else, is left alone.
 */
export async function recordSubmit(
  userId: string,
  claims: AttemptClaims,
  result: AttemptResult,
  rawResponses: Record<string, unknown>,
): Promise<boolean> {
  const { db } = getBindings();
  const table = TABLES[claims.kind].attempts;
  const id = attemptRowId(claims.kind, claims.nonce);
  const existing = await db.prepare(`SELECT user_id AS userId, status FROM ${table} WHERE id = ?`).bind(id).first<{ userId: string; status: string }>();
  if (existing && (existing.userId !== userId || existing.status === "submitted")) return false;

  const answers = result.questions.map((q) => ({
    e: q.exerciseId,
    r: storableJson(rawResponses[q.exerciseId] ?? {}),
    c: q.answered ? (q.review.correct === true ? 1 : 0) : null,
    a: q.pointsAwarded,
  }));
  const statements: D1PreparedStatement[] = [];
  // Started as a guest and submitted after signing in: the attempt row is made now.
  if (!existing) {
    statements.push(insertAttempt(userId, claims, "in_progress"));
    const questions = insertQuestionRows(claims);
    if (questions) statements.push(questions);
  }
  // Two submissions of one attempt at the same moment (two tabs, a double click)
  // both get past the check above. The batch is one transaction and D1 runs one
  // at a time, so each write below also checks, inside its transaction, that the
  // attempt isn't submitted yet: the first submission is kept, the second
  // changes nothing. The answers go first, the status last.
  const open = `(SELECT status FROM ${table} WHERE id = ?1 AND user_id = ?9) <> 'submitted'`;
  if (claims.kind === "quiz") {
    statements.push(
      db
        .prepare(
          `INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id, response, is_correct, points_awarded, answered_at)
           SELECT ?1 || ':' || json_extract(j.value, '$.e'), ?2, ?1, json_extract(j.value, '$.e'), json_extract(j.value, '$.r'),
                  json_extract(j.value, '$.c'), json_extract(j.value, '$.a'), ?3
             FROM json_each(?4) j
            WHERE ${open}
           ON CONFLICT (attempt_id, exercise_id) DO UPDATE SET response = excluded.response, is_correct = excluded.is_correct,
              points_awarded = excluded.points_awarded, answered_at = excluded.answered_at`,
        )
        .bind(id, claims.courseId, result.submittedAt, JSON.stringify(answers), null, null, null, null, userId),
    );
  } else {
    const questionTable = claims.kind === "exam" ? "exam_attempt_questions" : "custom_exam_questions";
    const attemptColumn = claims.kind === "exam" ? "exam_attempt_id" : "attempt_id";
    const savedAt = claims.kind === "exam" ? ", saved_at = ?3" : "";
    statements.push(
      db
        .prepare(
          `UPDATE ${questionTable}
              SET response = (SELECT json_extract(j.value, '$.r') FROM json_each(?2) j WHERE json_extract(j.value, '$.e') = exercise_id),
                  is_correct = (SELECT json_extract(j.value, '$.c') FROM json_each(?2) j WHERE json_extract(j.value, '$.e') = exercise_id),
                  points_awarded = (SELECT json_extract(j.value, '$.a') FROM json_each(?2) j WHERE json_extract(j.value, '$.e') = exercise_id)
                  ${savedAt}
            WHERE ${attemptColumn} = ?1 AND ${open}`,
        )
        .bind(id, JSON.stringify(answers), claims.kind === "exam" ? result.submittedAt : null, null, null, null, null, null, userId),
    );
  }
  statements.push(
    db
      .prepare(`UPDATE ${table} SET status = 'submitted', submitted_at = ?, score = ?, max_score = ?, passed = ? WHERE id = ? AND user_id = ? AND status <> 'submitted'`)
      .bind(result.submittedAt, result.score, result.maxScore, result.passed ? 1 : 0, id, userId),
  );
  const results = await db.batch(statements);
  return (results.at(-1)?.meta.changes ?? 0) > 0;
}
