import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";

export const FK = /FOREIGN KEY constraint failed/;

/** Applies migrations/ to the test D1 (idempotent: d1_migrations remembers what ran). */
export async function migrate(): Promise<void> {
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
}

/**
 * Empties the test data and seeds three courses, each with one topic, lecture,
 * MCQ question, quiz, resource, exam template and achievement, plus one user.
 * Same fixture as the original Python checks (ids like t_c_cpp, l_c_py).
 */
export async function resetAndSeed(): Promise<void> {
  const db = env.DB;
  await db.batch([
    db.prepare("DELETE FROM courses"), // cascades to every course-owned row
    db.prepare("DELETE FROM users"),
    db.prepare("DELETE FROM ad_placements"),
    db.prepare("DELETE FROM ad_exclusions"),
    db.prepare("DELETE FROM site_settings"),
    db.prepare("DELETE FROM contact_messages"),
    db.prepare("DELETE FROM rate_limits"),
    db.prepare("DELETE FROM search_index"),
  ]);
  const statements: D1PreparedStatement[] = [];
  for (const [cid, slug, lang] of [
    ["c_cpp", "cpp", "cpp"],
    ["c_py", "python", "python"],
    ["c_cv", "computer-vision", "python"],
  ] as const) {
    statements.push(
      db
        .prepare("INSERT INTO courses (id, slug, title, short_title, primary_language, status) VALUES (?, ?, ?, ?, ?, 'published')")
        .bind(cid, slug, slug, slug, lang),
      db.prepare("INSERT INTO topics (id, course_id, slug, title) VALUES (?, ?, 'loops', 'Loops')").bind(`t_${cid}`, cid),
      db
        .prepare("INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES (?, ?, ?, 'for-loops', 'For loops')")
        .bind(`l_${cid}`, cid, `t_${cid}`),
      db
        .prepare(
          "INSERT INTO exercises (id, course_id, topic_id, lesson_id, slug, type, title, prompt_md, difficulty, grading_mode) " +
            "VALUES (?, ?, ?, ?, 'q1', 'mcq', 'Q', 'What prints?', 'easy', 'auto')",
        )
        .bind(`e_${cid}`, cid, `t_${cid}`, `l_${cid}`),
      db.prepare("INSERT INTO quizzes (id, course_id, slug, title) VALUES (?, ?, 'quiz-1', 'Quiz 1')").bind(`q_${cid}`, cid),
      db
        .prepare("INSERT INTO resources (id, course_id, slug, title, kind) VALUES (?, ?, 'lecture-1', 'Lecture 1', 'presentation')")
        .bind(`r_${cid}`, cid),
      db
        .prepare("INSERT INTO exam_templates (id, course_id, slug, title, time_limit_sec) VALUES (?, ?, 'midterm', 'Midterm', 3600)")
        .bind(`x_${cid}`, cid),
      db
        .prepare("INSERT INTO achievements (id, course_id, slug, title) VALUES (?, ?, 'first-step', 'First step')")
        .bind(`a_${cid}`, cid),
    );
  }
  statements.push(db.prepare("INSERT INTO users (id, email) VALUES ('u1', 'student@example.com')"));
  await db.batch(statements);
}

export async function run(sql: string): Promise<void> {
  await env.DB.prepare(sql).run();
}

/** Runs `sql` and returns the error message, or null if it succeeded. */
export async function errorOf(sql: string): Promise<string | null> {
  try {
    await run(sql);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Row counts per course for one table. */
export async function countsByCourse(table: string): Promise<Record<string, number>> {
  const { results } = await env.DB.prepare(`SELECT course_id, count(*) AS n FROM ${table} GROUP BY course_id`).all<{
    course_id: string;
    n: number;
  }>();
  return Object.fromEntries(results.map((r) => [r.course_id, r.n]));
}

/** Clears the courses table and runs seed/*.sql, exactly as `npm run db:seed:local` does. */
export async function loadRealSeed(): Promise<void> {
  await env.DB.prepare("DELETE FROM courses").run();
  for (const file of env.SEED) {
    for (const query of file.queries) await env.DB.prepare(query).run();
  }
}
