// How students are doing in one course, for the course's Students tab in the
// admin. Only numbers about groups: no names, no emails, no single student's
// answers. Only signed-in students are counted (guests leave nothing on the
// server), and staff accounts are left out so testing the site doesn't skew
// the numbers. Every query is limited to this one course.
import { type Actor, NO_PERMISSION, denied } from "./context";
import type { AdminCourse } from "./courses";
import { getBindings } from "@/server/platform/env";

/** A question needs this many answers before it can be called hard. */
export const HARD_MIN_ANSWERS = 5;
export const TREND_WEEKS = 8;
const WEEK_MS = 7 * 86_400_000;

export interface CourseAnalytics {
  students: { ever: number; active7: number; active30: number; returning: number };
  answers: number;
  right: number;
  attemptsSubmitted: number;
  lecturesCompleted: number;
  trend: { weekStart: number; students: number; answers: number; lecturesCompleted: number }[];
  topics: { title: string; answers: number; right: number; students: number }[];
  hardest: { slug: string; title: string; type: string; topic: string | null; answers: number; right: number }[];
  quizzes: { title: string; slug: string; attempts: number; students: number; averagePercent: number | null; passed: number }[];
  lectures: { slug: string; title: string; lectureNumber: number | null; topic: string; started: number; completed: number }[];
}

/** Students in this course: the student role and no staff role. ?1 is the course. */
const CTES = `
  students (id) AS (
    SELECT r.user_id FROM user_roles r WHERE r.role_id = 'student'
    EXCEPT SELECT r.user_id FROM user_roles r WHERE r.role_id IN ('admin', 'editor')
  ),
  answers (user_id, exercise_id, ok, at) AS (
    SELECT user_id, exercise_id, is_correct, created_at FROM exercise_attempts
     WHERE course_id = ?1 AND is_correct IS NOT NULL AND user_id IN (SELECT id FROM students)
    UNION ALL
    SELECT a.user_id, r.exercise_id, r.is_correct, r.answered_at FROM quiz_responses r
      JOIN quiz_attempts a ON a.course_id = r.course_id AND a.id = r.attempt_id
     WHERE r.course_id = ?1 AND r.is_correct IS NOT NULL AND a.user_id IN (SELECT id FROM students)
    UNION ALL
    SELECT a.user_id, x.exercise_id, x.is_correct, coalesce(x.saved_at, a.submitted_at, a.started_at) FROM exam_attempt_questions x
      JOIN exam_attempts a ON a.course_id = x.course_id AND a.id = x.exam_attempt_id
     WHERE x.course_id = ?1 AND x.is_correct IS NOT NULL AND a.user_id IN (SELECT id FROM students)
    UNION ALL
    SELECT a.user_id, x.exercise_id, x.is_correct, coalesce(a.submitted_at, a.started_at) FROM custom_exam_questions x
      JOIN custom_exam_attempts a ON a.course_id = x.course_id AND a.id = x.attempt_id
     WHERE x.course_id = ?1 AND x.is_correct IS NOT NULL AND a.user_id IN (SELECT id FROM students)
  ),
  activity (user_id, at) AS (
    SELECT user_id, at FROM answers
    UNION ALL SELECT user_id, updated_at FROM student_progress WHERE course_id = ?1 AND user_id IN (SELECT id FROM students)
    UNION ALL SELECT user_id, started_at FROM quiz_attempts WHERE course_id = ?1 AND user_id IN (SELECT id FROM students)
    UNION ALL SELECT user_id, started_at FROM exam_attempts WHERE course_id = ?1 AND user_id IN (SELECT id FROM students)
    UNION ALL SELECT user_id, started_at FROM custom_exam_attempts WHERE course_id = ?1 AND user_id IN (SELECT id FROM students)
  )`;

/** `<quiz>-model-<letter>` is a model of `<quiz>`: its results count for the quiz. */
const MODEL_SLUG = /^(.+)-model-[b-z]$/;

export async function getCourseAnalytics(actor: Actor, course: AdminCourse, now = Date.now()): Promise<CourseAnalytics | { error: string }> {
  if (denied(actor, "view", course)) return { error: NO_PERMISSION };
  const { db } = getBindings();
  const trendFrom = Math.floor(now / WEEK_MS) * WEEK_MS - (TREND_WEEKS - 1) * WEEK_MS;
  const [overview, trend, trendLectures, topics, hardest, quizzes, lectures] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `WITH ${CTES}
         SELECT
           (SELECT count(DISTINCT user_id) FROM activity) AS ever,
           (SELECT count(DISTINCT user_id) FROM activity WHERE at >= ?2) AS active7,
           (SELECT count(DISTINCT user_id) FROM activity WHERE at >= ?3) AS active30,
           (SELECT count(*) FROM (SELECT user_id FROM activity GROUP BY user_id HAVING count(DISTINCT at / 86400000) >= 2)) AS returningCount,
           (SELECT count(*) FROM answers) AS answers,
           (SELECT coalesce(sum(ok), 0) FROM answers) AS rightCount,
           (SELECT count(*) FROM student_progress WHERE course_id = ?1 AND status = 'completed' AND user_id IN (SELECT id FROM students)) AS lecturesCompleted,
           (SELECT count(*) FROM quiz_attempts WHERE course_id = ?1 AND status = 'submitted' AND user_id IN (SELECT id FROM students))
             + (SELECT count(*) FROM exam_attempts WHERE course_id = ?1 AND status = 'submitted' AND user_id IN (SELECT id FROM students))
             + (SELECT count(*) FROM custom_exam_attempts WHERE course_id = ?1 AND status = 'submitted' AND user_id IN (SELECT id FROM students)) AS attemptsSubmitted`,
      )
      .bind(course.id, now - 7 * 86_400_000, now - 30 * 86_400_000),
    db
      .prepare(
        `WITH ${CTES}
         SELECT w.weekStart, w.students, coalesce(x.answers, 0) AS answers
           FROM (SELECT (at / ${WEEK_MS}) * ${WEEK_MS} AS weekStart, count(DISTINCT user_id) AS students FROM activity WHERE at >= ?2 GROUP BY 1) w
           LEFT JOIN (SELECT (at / ${WEEK_MS}) * ${WEEK_MS} AS weekStart, count(*) AS answers FROM answers WHERE at >= ?2 GROUP BY 1) x USING (weekStart)`,
      )
      .bind(course.id, trendFrom),
    db
      .prepare(
        `SELECT (completed_at / ${WEEK_MS}) * ${WEEK_MS} AS weekStart, count(*) AS n FROM student_progress
          WHERE course_id = ?1 AND status = 'completed' AND completed_at >= ?2
            AND user_id IN (SELECT user_id FROM user_roles WHERE role_id = 'student' EXCEPT SELECT user_id FROM user_roles WHERE role_id IN ('admin', 'editor'))
          GROUP BY completed_at / ${WEEK_MS}`,
      )
      .bind(course.id, trendFrom),
    db
      .prepare(
        `WITH ${CTES}
         SELECT t.title, count(a.exercise_id) AS answers, coalesce(sum(a.ok), 0) AS rightCount, count(DISTINCT a.user_id) AS students
           FROM topics t
           LEFT JOIN exercises e ON e.course_id = t.course_id AND e.topic_id = t.id
           LEFT JOIN answers a ON a.exercise_id = e.id
          WHERE t.course_id = ?1 AND t.status <> 'archived'
          GROUP BY t.id ORDER BY t.sort_order, t.title`,
      )
      .bind(course.id),
    db
      .prepare(
        `WITH ${CTES}
         SELECT e.slug, e.title, e.type, t.title AS topic, count(*) AS answers, coalesce(sum(a.ok), 0) AS rightCount
           FROM answers a
           JOIN exercises e ON e.course_id = ?1 AND e.id = a.exercise_id
           LEFT JOIN topics t ON t.course_id = e.course_id AND t.id = e.topic_id
          GROUP BY e.id HAVING count(*) >= ?2
          ORDER BY (1.0 * coalesce(sum(a.ok), 0)) / count(*), count(*) DESC LIMIT 10`,
      )
      .bind(course.id, HARD_MIN_ANSWERS),
    db
      .prepare(
        `SELECT q.slug, q.title, count(a.id) AS attempts, count(DISTINCT a.user_id) AS students,
                avg(CASE WHEN a.max_score > 0 THEN 100.0 * a.score / a.max_score END) AS averagePercent,
                coalesce(sum(a.passed), 0) AS passed
           FROM quizzes q
           LEFT JOIN quiz_attempts a ON a.course_id = q.course_id AND a.quiz_id = q.id AND a.status = 'submitted'
                 AND a.user_id IN (SELECT user_id FROM user_roles WHERE role_id = 'student' EXCEPT SELECT user_id FROM user_roles WHERE role_id IN ('admin', 'editor'))
          WHERE q.course_id = ?1 AND q.status <> 'archived'
          GROUP BY q.id ORDER BY q.title`,
      )
      .bind(course.id),
    db
      .prepare(
        `SELECT l.slug, l.title, l.lecture_number AS lectureNumber, t.title AS topic,
                count(p.user_id) AS started, coalesce(sum(p.status = 'completed'), 0) AS completed
           FROM lessons l
           JOIN topics t ON t.course_id = l.course_id AND t.id = l.topic_id
           LEFT JOIN student_progress p ON p.course_id = l.course_id AND p.lesson_id = l.id
                 AND p.user_id IN (SELECT user_id FROM user_roles WHERE role_id = 'student' EXCEPT SELECT user_id FROM user_roles WHERE role_id IN ('admin', 'editor'))
          WHERE l.course_id = ?1 AND l.status = 'published'
          GROUP BY l.id ORDER BY t.sort_order, l.sort_order, l.lecture_number`,
      )
      .bind(course.id),
  ]);

  const o = (overview?.results[0] ?? {}) as Record<string, number>;
  const n = (v: unknown) => Number(v ?? 0);

  const weekly = new Map((trend?.results ?? []).map((r) => [n(r.weekStart), r]));
  const weeklyLectures = new Map((trendLectures?.results ?? []).map((r) => [n(r.weekStart), n(r.n)]));
  const trendRows = Array.from({ length: TREND_WEEKS }, (_, i) => {
    const weekStart = trendFrom + i * WEEK_MS;
    const r = weekly.get(weekStart);
    return { weekStart, students: n(r?.students), answers: n(r?.answers), lecturesCompleted: weeklyLectures.get(weekStart) ?? 0 };
  });

  // Models of a quiz are shown as the quiz they belong to.
  const quizMap = new Map<string, CourseAnalytics["quizzes"][number] & { sum: number; scored: number }>();
  for (const r of quizzes?.results ?? []) {
    const slug = String(r.slug);
    const base = MODEL_SLUG.exec(slug)?.[1] ?? slug;
    const entry = quizMap.get(base) ?? { title: base === slug ? String(r.title) : "", slug: base, attempts: 0, students: 0, averagePercent: null, passed: 0, sum: 0, scored: 0 };
    if (base === slug) entry.title = String(r.title);
    entry.attempts += n(r.attempts);
    entry.students += n(r.students); // a student who took two models counts twice; close enough for a summary
    entry.passed += n(r.passed);
    if (r.averagePercent !== null && r.averagePercent !== undefined) {
      entry.sum += Number(r.averagePercent) * n(r.attempts);
      entry.scored += n(r.attempts);
    }
    quizMap.set(base, entry);
  }

  return {
    students: { ever: n(o.ever), active7: n(o.active7), active30: n(o.active30), returning: n(o.returningCount) },
    answers: n(o.answers),
    right: n(o.rightCount),
    attemptsSubmitted: n(o.attemptsSubmitted),
    lecturesCompleted: n(o.lecturesCompleted),
    trend: trendRows,
    topics: (topics?.results ?? []).map((r) => ({ title: String(r.title), answers: n(r.answers), right: n(r.rightCount), students: n(r.students) })),
    hardest: (hardest?.results ?? []).map((r) => ({
      slug: String(r.slug),
      title: String(r.title),
      type: String(r.type),
      topic: r.topic === null ? null : String(r.topic),
      answers: n(r.answers),
      right: n(r.rightCount),
    })),
    quizzes: [...quizMap.values()].map(({ sum, scored, ...q }) => ({ ...q, title: q.title || q.slug, averagePercent: scored > 0 ? Math.round(sum / scored) : null })),
    lectures: (lectures?.results ?? []).map((r) => ({
      slug: String(r.slug),
      title: String(r.title),
      lectureNumber: r.lectureNumber === null ? null : n(r.lectureNumber),
      topic: String(r.topic),
      started: n(r.started),
      completed: n(r.completed),
    })),
  };
}
