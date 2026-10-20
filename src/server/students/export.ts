// "Download my data": everything kept for one account, as JSON. Never
// includes password hashes, session tokens or the recovery code.
import { getBindings } from "@/server/platform/env";

function parse(text: unknown): unknown {
  if (typeof text !== "string") return text ?? null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function exportAccountData(userId: string, now = Date.now()): Promise<Record<string, unknown> | null> {
  const { db } = getBindings();
  const q = (sql: string) => db.prepare(sql).bind(userId);
  const [user, sessions, progress, practice, quizAttempts, quizAnswers, examAttempts, examAnswers, customAttempts, customAnswers, drafts, bookmarks, achievements] =
    await db.batch<Record<string, unknown>>([
      q("SELECT email, name, created_at AS createdAt FROM users WHERE id = ?"),
      q("SELECT created_at AS signedInAt, updated_at AS lastUsed, expires_at AS expiresAt, ip_address AS ipAddress, user_agent AS browser FROM sessions WHERE user_id = ?"),
      q(`SELECT c.slug AS course, l.slug AS lecture, p.status, p.completed_at AS completedAt, p.updated_at AS updatedAt
           FROM student_progress p JOIN courses c ON c.id = p.course_id JOIN lessons l ON l.course_id = p.course_id AND l.id = p.lesson_id WHERE p.user_id = ?`),
      q(`SELECT c.slug AS course, e.slug AS question, a.response, a.is_correct AS correct, a.self_check AS testedInBrowser, a.created_at AS answeredAt
           FROM exercise_attempts a JOIN courses c ON c.id = a.course_id JOIN exercises e ON e.course_id = a.course_id AND e.id = a.exercise_id
          WHERE a.user_id = ? ORDER BY a.created_at`),
      q(`SELECT a.id, c.slug AS course, z.slug AS quiz, a.status, a.started_at AS startedAt, a.submitted_at AS submittedAt, a.score, a.max_score AS maxScore, a.passed
           FROM quiz_attempts a JOIN courses c ON c.id = a.course_id JOIN quizzes z ON z.course_id = a.course_id AND z.id = a.quiz_id WHERE a.user_id = ? ORDER BY a.started_at`),
      q(`SELECT r.attempt_id AS attempt, e.slug AS question, r.response, r.is_correct AS correct, r.points_awarded AS points
           FROM quiz_responses r JOIN quiz_attempts a ON a.id = r.attempt_id JOIN exercises e ON e.course_id = r.course_id AND e.id = r.exercise_id WHERE a.user_id = ?`),
      q(`SELECT a.id, c.slug AS course, t.slug AS exam, a.status, a.started_at AS startedAt, a.submitted_at AS submittedAt, a.score, a.max_score AS maxScore, a.passed
           FROM exam_attempts a JOIN courses c ON c.id = a.course_id JOIN exam_templates t ON t.course_id = a.course_id AND t.id = a.exam_template_id WHERE a.user_id = ? ORDER BY a.started_at`),
      q(`SELECT x.exam_attempt_id AS attempt, e.slug AS question, x.position, x.response, x.is_correct AS correct, x.points_awarded AS points
           FROM exam_attempt_questions x JOIN exam_attempts a ON a.id = x.exam_attempt_id JOIN exercises e ON e.course_id = x.course_id AND e.id = x.exercise_id WHERE a.user_id = ?`),
      q(`SELECT a.id, c.slug AS course, a.title, a.status, a.started_at AS startedAt, a.submitted_at AS submittedAt, a.score, a.max_score AS maxScore, a.passed
           FROM custom_exam_attempts a JOIN courses c ON c.id = a.course_id WHERE a.user_id = ? ORDER BY a.started_at`),
      q(`SELECT x.attempt_id AS attempt, e.slug AS question, x.position, x.response, x.is_correct AS correct, x.points_awarded AS points
           FROM custom_exam_questions x JOIN custom_exam_attempts a ON a.id = x.attempt_id JOIN exercises e ON e.course_id = x.course_id AND e.id = x.exercise_id WHERE a.user_id = ?`),
      q(`SELECT c.slug AS course, e.slug AS question, s.language, s.source AS code, s.updated_at AS savedAt
           FROM code_submissions s JOIN courses c ON c.id = s.course_id JOIN exercises e ON e.course_id = s.course_id AND e.id = s.exercise_id WHERE s.user_id = ?`),
      q(`SELECT c.slug AS course, coalesce('lecture:' || l.slug, 'question:' || e.slug, 'file:' || r.slug, 'quiz:' || z.slug) AS target, b.created_at AS createdAt
           FROM bookmarks b JOIN courses c ON c.id = b.course_id
           LEFT JOIN lessons l ON l.course_id = b.course_id AND l.id = b.lesson_id
           LEFT JOIN exercises e ON e.course_id = b.course_id AND e.id = b.exercise_id
           LEFT JOIN resources r ON r.course_id = b.course_id AND r.id = b.resource_id
           LEFT JOIN quizzes z ON z.course_id = b.course_id AND z.id = b.quiz_id
          WHERE b.user_id = ?`),
      q(`SELECT c.slug AS course, a.slug AS achievement, a.title, s.awarded_at AS awardedAt
           FROM student_achievements s JOIN courses c ON c.id = s.course_id JOIN achievements a ON a.course_id = s.course_id AND a.id = s.achievement_id WHERE s.user_id = ?`),
    ]);
  const account = user?.results[0];
  if (!account) return null;
  const rows = (r: D1Result<Record<string, unknown>> | undefined, jsonColumns: string[] = []) =>
    (r?.results ?? []).map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, jsonColumns.includes(k) ? parse(v) : v])));
  return {
    about: "Everything Code_Expert keeps for your account. Times are milliseconds since 1 January 1970 (UTC).",
    exportedAt: now,
    account,
    signedInDevices: rows(sessions),
    lectures: rows(progress),
    practiceAnswers: rows(practice, ["response"]),
    quizzes: rows(quizAttempts).map((a) => ({ ...a, answers: rows(quizAnswers, ["response"]).filter((x) => x.attempt === a.id) })),
    practiceExams: rows(examAttempts).map((a) => ({ ...a, answers: rows(examAnswers, ["response"]).filter((x) => x.attempt === a.id) })),
    customExams: rows(customAttempts).map((a) => ({ ...a, answers: rows(customAnswers, ["response"]).filter((x) => x.attempt === a.id) })),
    codeDrafts: rows(drafts),
    bookmarks: rows(bookmarks),
    achievements: rows(achievements),
  };
}
