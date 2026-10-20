// A signed-in student's progress in ONE course: lectures read, questions
// answered (in practice, quizzes and exams), bookmarks and saved code drafts.
//
// Every function takes the student's user id and a CourseScope, and every query
// filters by both. A slug from another course finds nothing, and the composite
// foreign keys refuse a row that mixes two courses.
import { newId } from "@/lib/ids";
import { hashToken } from "@/lib/auth/session-token";
import { isValidSlug } from "@/lib/slug";
import type { CourseScope } from "@/server/courses/scope";
import type { PracticeRecord } from "@/lib/grading/practice-record";
import { MAX_CODE_LENGTH } from "@/server/grading/grade";
import { getBindings } from "@/server/platform/env";

export type LectureStatus = "started" | "completed";
export type BookmarkKind = "lecture" | "question" | "file" | "quiz";
export const BOOKMARK_KINDS: readonly BookmarkKind[] = ["lecture", "question", "file", "quiz"];

export interface AnswerMemory {
  /**
   * "correct" once the server marked it right anywhere. "passed_tests": never
   * marked right, but the student's program passed every test in their own
   * browser (write-the-code, or a fix written differently from the known ones);
   * not a mark. "wrong" otherwise.
   */
  status: "correct" | "passed_tests" | "wrong";
  /** Latest answer (ms). */
  at: number;
}

/** What the course's pages need to show the student's marks (GET /api/me/courses/<course>/state). */
export interface CourseState {
  lectures: Record<string, LectureStatus>;
  answers: Record<string, AnswerMemory>;
  /** "<kind>:<slug>" */
  bookmarks: string[];
}

const LIVE_LESSON = "(l.status = 'published' OR (l.status = 'scheduled' AND l.publish_at <= ?))";
const LIVE_QUIZ = "(q.status = 'published' OR (q.status = 'scheduled' AND q.publish_at <= ?))";
const NOT_RESERVED = "coalesce(json_extract(e.settings, '$.reserved'), 0) = 0";

/**
 * Every marked answer of one student in one course, from all four places
 * answers are kept: practice (exercise_attempts), quizzes (quiz_responses),
 * practice exams (exam_attempt_questions) and custom exams
 * (custom_exam_questions). Unanswered questions have is_correct NULL and are
 * left out. Bind ?1 = user id, ?2 = course id.
 */
export const ANSWERS_CTE = `answers (exercise_id, ok, at, source) AS (
    SELECT exercise_id, is_correct, created_at, 'practice' FROM exercise_attempts
     WHERE user_id = ?1 AND course_id = ?2 AND is_correct IS NOT NULL
    UNION ALL
    SELECT r.exercise_id, r.is_correct, r.answered_at, 'quiz' FROM quiz_responses r
      JOIN quiz_attempts a ON a.course_id = r.course_id AND a.id = r.attempt_id
     WHERE a.user_id = ?1 AND a.course_id = ?2 AND r.is_correct IS NOT NULL
    UNION ALL
    SELECT x.exercise_id, x.is_correct, coalesce(x.saved_at, a.submitted_at, a.started_at), 'exam' FROM exam_attempt_questions x
      JOIN exam_attempts a ON a.course_id = x.course_id AND a.id = x.exam_attempt_id
     WHERE a.user_id = ?1 AND a.course_id = ?2 AND x.is_correct IS NOT NULL
    UNION ALL
    SELECT x.exercise_id, x.is_correct, coalesce(a.submitted_at, a.started_at), 'custom' FROM custom_exam_questions x
      JOIN custom_exam_attempts a ON a.course_id = x.course_id AND a.id = x.attempt_id
     WHERE a.user_id = ?1 AND a.course_id = ?2 AND x.is_correct IS NOT NULL
  )`;

export async function getCourseState(userId: string, scope: CourseScope, now = Date.now()): Promise<CourseState> {
  const { db } = getBindings();
  const [lectures, answers, selfChecks, bookmarks] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT l.slug, p.status FROM student_progress p
           JOIN lessons l ON l.course_id = p.course_id AND l.id = p.lesson_id
          WHERE p.user_id = ?1 AND p.course_id = ?2 AND ${LIVE_LESSON.replace("?", "?3")}`,
      )
      .bind(userId, scope.courseId, now),
    db
      .prepare(
        `WITH ${ANSWERS_CTE}
         SELECT e.slug, max(a.ok) AS solved, max(a.at) AS at FROM answers a
           JOIN exercises e ON e.course_id = ?2 AND e.id = a.exercise_id
          WHERE e.status = 'published' AND ${NOT_RESERVED}
          GROUP BY e.id`,
      )
      .bind(userId, scope.courseId),
    // Browser self-checks: shown to the student, never counted as marks.
    db
      .prepare(
        `SELECT e.slug, max(a.created_at) AS at FROM exercise_attempts a
           JOIN exercises e ON e.course_id = a.course_id AND e.id = a.exercise_id
          WHERE a.user_id = ?1 AND a.course_id = ?2 AND a.self_check = 'passed' AND e.status = 'published' AND ${NOT_RESERVED}
          GROUP BY e.id`,
      )
      .bind(userId, scope.courseId),
    db.prepare(BOOKMARK_LIST_SQL).bind(userId, scope.courseId, now),
  ]);
  const memory: Record<string, AnswerMemory> = {};
  for (const r of selfChecks?.results ?? []) memory[r.slug as string] = { status: "passed_tests", at: Number(r.at) };
  for (const r of answers?.results ?? []) {
    const slug = r.slug as string;
    const before = memory[slug];
    if (r.solved === 1) memory[slug] = { status: "correct", at: Number(r.at) };
    // A wrong mark doesn't hide a later (or earlier) full pass in the browser.
    else if (!before) memory[slug] = { status: "wrong", at: Number(r.at) };
    else memory[slug] = { status: before.status, at: Math.max(before.at, Number(r.at)) };
  }
  return {
    lectures: Object.fromEntries((lectures?.results ?? []).map((r) => [r.slug as string, r.status as LectureStatus])),
    answers: memory,
    bookmarks: (bookmarks?.results ?? []).map((r) => `${r.kind as string}:${r.slug as string}`),
  };
}

// ---------------------------------------------------------------------------
// Lectures
// ---------------------------------------------------------------------------

async function liveLessonId(scope: CourseScope, slug: string, now: number): Promise<string | null> {
  if (!isValidSlug(slug)) return null;
  const row = await getBindings()
    .db.prepare(`SELECT l.id FROM lessons l WHERE l.course_id = ? AND l.slug = ? AND ${LIVE_LESSON}`)
    .bind(scope.courseId, slug, now)
    .first<{ id: string }>();
  return row?.id ?? null;
}

/**
 * "started" when a lecture is opened (never undoes "completed"), "completed"
 * from the Mark as done button, "not_completed" to take that back.
 */
export async function setLectureStatus(
  userId: string,
  scope: CourseScope,
  lectureSlug: string,
  status: LectureStatus | "not_completed",
  now = Date.now(),
): Promise<LectureStatus | null> {
  const lessonId = await liveLessonId(scope, lectureSlug, now);
  if (!lessonId) return null;
  const { db } = getBindings();
  if (status === "started") {
    await db
      .prepare(
        `INSERT INTO student_progress (user_id, course_id, lesson_id, status, updated_at) VALUES (?, ?, ?, 'started', ?)
         ON CONFLICT (user_id, lesson_id) DO NOTHING`,
      )
      .bind(userId, scope.courseId, lessonId, now)
      .run();
    const row = await db.prepare("SELECT status FROM student_progress WHERE user_id = ? AND lesson_id = ?").bind(userId, lessonId).first<{ status: LectureStatus }>();
    return row?.status ?? "started";
  }
  const done = status === "completed";
  await db
    .prepare(
      `INSERT INTO student_progress (user_id, course_id, lesson_id, status, completed_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)
       ON CONFLICT (user_id, lesson_id) DO UPDATE SET status = excluded.status, completed_at = excluded.completed_at, updated_at = excluded.updated_at`,
    )
    .bind(userId, scope.courseId, lessonId, done ? "completed" : "started", done ? now : null, now)
    .run();
  return done ? "completed" : "started";
}

// ---------------------------------------------------------------------------
// Practice answers
// ---------------------------------------------------------------------------

/** One answer to a practice question (single question pages and practice sets). */
/** `record.correct` is the server's mark (or null); `record.selfCheck` the browser's own test run, kept apart (see practiceRecord). */
export async function recordPracticeAnswer(
  userId: string,
  scope: CourseScope,
  exerciseId: string,
  response: unknown,
  record: PracticeRecord,
  now = Date.now(),
): Promise<void> {
  const { correct, selfCheck } = record;
  await getBindings()
    .db.prepare(
      "INSERT INTO exercise_attempts (id, course_id, exercise_id, user_id, response, is_correct, self_check, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(newId("exa"), scope.courseId, exerciseId, userId, storableJson(response), correct === null ? null : correct ? 1 : 0, selfCheck, now)
    .run();
}

/** JSON for a response column: what the student sent, cut down if it is unreasonably large. */
export function storableJson(value: unknown): string {
  const text = JSON.stringify(value ?? {});
  return text.length <= MAX_CODE_LENGTH + 4096 ? text : JSON.stringify({ note: "too large to keep" });
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

/** The student's bookmarks in this course whose targets are still public. ?1 user, ?2 course, ?3 now. */
const BOOKMARK_LIST_SQL = `
  SELECT 'lecture' AS kind, l.slug, l.title, b.created_at AS createdAt FROM bookmarks b
    JOIN lessons l ON l.course_id = b.course_id AND l.id = b.lesson_id
   WHERE b.user_id = ?1 AND b.course_id = ?2 AND ${LIVE_LESSON.replace("?", "?3")}
  UNION ALL
  SELECT 'question', e.slug, e.title, b.created_at FROM bookmarks b
    JOIN exercises e ON e.course_id = b.course_id AND e.id = b.exercise_id
   WHERE b.user_id = ?1 AND b.course_id = ?2 AND e.status = 'published' AND ${NOT_RESERVED}
  UNION ALL
  SELECT 'file', r.slug, r.title, b.created_at FROM bookmarks b
    JOIN resources r ON r.course_id = b.course_id AND r.id = b.resource_id
   WHERE b.user_id = ?1 AND b.course_id = ?2 AND r.status = 'published' AND r.access = 'public'
  UNION ALL
  SELECT 'quiz', q.slug, q.title, b.created_at FROM bookmarks b
    JOIN quizzes q ON q.course_id = b.course_id AND q.id = b.quiz_id
   WHERE b.user_id = ?1 AND b.course_id = ?2 AND ${LIVE_QUIZ.replace("?", "?3")}
  ORDER BY 4 DESC`;

export interface BookmarkView {
  kind: BookmarkKind;
  slug: string;
  title: string;
  createdAt: number;
  href: string;
}

export function bookmarkHref(courseSlug: string, kind: BookmarkKind, slug: string): string {
  const base = `/courses/${courseSlug}`;
  if (kind === "lecture") return `${base}/lectures/${slug}`;
  if (kind === "question") return `${base}/exercises/${slug}`;
  if (kind === "file") return `${base}/resources/${slug}`;
  return `${base}/quizzes/${slug}`;
}

export async function listBookmarks(userId: string, scope: CourseScope, now = Date.now()): Promise<BookmarkView[]> {
  const { results } = await getBindings()
    .db.prepare(BOOKMARK_LIST_SQL)
    .bind(userId, scope.courseId, now)
    .all<{ kind: BookmarkKind; slug: string; title: string; createdAt: number }>();
  return results.map((r) => ({ ...r, href: bookmarkHref(scope.slug, r.kind, r.slug) }));
}

/** How to find a public bookmark target by slug. ?1 course, ?2 slug, ?3 now. */
const TARGET: Record<BookmarkKind, { column: string; sql: string }> = {
  lecture: { column: "lesson_id", sql: `SELECT l.id FROM lessons l WHERE l.course_id = ?1 AND l.slug = ?2 AND ${LIVE_LESSON.replace("?", "?3")}` },
  question: {
    column: "exercise_id",
    sql: `SELECT e.id FROM exercises e WHERE e.course_id = ?1 AND e.slug = ?2 AND e.status = 'published' AND ${NOT_RESERVED} AND ?3 IS NOT NULL`,
  },
  file: {
    column: "resource_id",
    sql: "SELECT r.id FROM resources r WHERE r.course_id = ?1 AND r.slug = ?2 AND r.status = 'published' AND r.access = 'public' AND ?3 IS NOT NULL",
  },
  // Models (`<quiz>-model-b`, …) are never shown on their own: bookmark the quiz.
  quiz: {
    column: "quiz_id",
    sql: `SELECT q.id FROM quizzes q WHERE q.course_id = ?1 AND q.slug = ?2 AND q.slug NOT GLOB '*-model-[b-z]' AND ${LIVE_QUIZ.replace("?", "?3")}`,
  },
};

/** Adds or removes one bookmark. Returns whether it is bookmarked now, or null when the target isn't public in this course. */
export async function setBookmark(userId: string, scope: CourseScope, kind: BookmarkKind, slug: string, on: boolean, now = Date.now()): Promise<boolean | null> {
  if (!BOOKMARK_KINDS.includes(kind) || !isValidSlug(slug)) return null;
  const { db } = getBindings();
  const target = TARGET[kind];
  const row = await db.prepare(target.sql).bind(scope.courseId, slug, now).first<{ id: string }>();
  if (!row) return null;
  if (on) {
    // The unique index bookmarks_target_uq makes a second bookmark of the same thing a no-op.
    await db
      .prepare(`INSERT INTO bookmarks (id, user_id, course_id, ${target.column}, created_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT DO NOTHING`)
      .bind(newId("bmk"), userId, scope.courseId, row.id, now)
      .run();
  } else {
    await db.prepare(`DELETE FROM bookmarks WHERE user_id = ? AND course_id = ? AND ${target.column} = ?`).bind(userId, scope.courseId, row.id).run();
  }
  return on;
}

// ---------------------------------------------------------------------------
// Code drafts (write the code, correct the code)
// ---------------------------------------------------------------------------

/** One draft per student and question: the id is derived from both, so saving again overwrites it. */
async function draftId(userId: string, exerciseId: string): Promise<string> {
  return `drf_${(await hashToken(`${userId}:${exerciseId}`)).slice(0, 24)}`;
}

async function draftTarget(scope: CourseScope, slug: string): Promise<{ id: string; language: "cpp" | "python" } | null> {
  if (!isValidSlug(slug)) return null;
  const row = await getBindings()
    .db.prepare(
      `SELECT e.id, e.code_language AS language FROM exercises e
        WHERE e.course_id = ? AND e.slug = ? AND e.status = 'published' AND ${NOT_RESERVED}
          AND e.type IN ('write_code', 'correct_code') AND e.code_language IN ('cpp', 'python')`,
    )
    .bind(scope.courseId, slug)
    .first<{ id: string; language: "cpp" | "python" }>();
  return row ?? null;
}

export async function getDraft(userId: string, scope: CourseScope, exerciseSlug: string): Promise<{ code: string; savedAt: number } | null> {
  const target = await draftTarget(scope, exerciseSlug);
  if (!target) return null;
  const row = await getBindings()
    .db.prepare("SELECT source, updated_at AS savedAt FROM code_submissions WHERE id = ? AND user_id = ? AND course_id = ? AND status = 'draft'")
    .bind(await draftId(userId, target.id), userId, scope.courseId)
    .first<{ source: string; savedAt: number }>();
  return row ? { code: row.source, savedAt: row.savedAt } : null;
}

/** Saves (or, with an empty code, removes) the student's draft. False when the question can't have drafts. */
export async function saveDraft(userId: string, scope: CourseScope, exerciseSlug: string, code: unknown, now = Date.now()): Promise<boolean> {
  if (typeof code !== "string" || code.length > MAX_CODE_LENGTH) return false;
  const target = await draftTarget(scope, exerciseSlug);
  if (!target) return false;
  const { db } = getBindings();
  const id = await draftId(userId, target.id);
  if (code.trim() === "") {
    await db.prepare("DELETE FROM code_submissions WHERE id = ? AND user_id = ?").bind(id, userId).run();
    return true;
  }
  await db
    .prepare(
      `INSERT INTO code_submissions (id, course_id, exercise_id, user_id, language, source, status, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'draft', ?7, ?7)
       ON CONFLICT (id) DO UPDATE SET source = excluded.source, updated_at = excluded.updated_at
        WHERE code_submissions.user_id = excluded.user_id`,
    )
    .bind(id, scope.courseId, target.id, userId, target.language, code, now)
    .run();
  return true;
}
