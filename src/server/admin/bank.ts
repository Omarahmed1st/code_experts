// The question bank practice exams draw from, and the check that every
// published practice exam can still be drawn after a change.
import { type DrawCandidate, type DrawRule, drawExam } from "@/lib/grading/exam-draw";
import { getBindings } from "@/server/platform/env";

export interface BankQuestion extends DrawCandidate {
  status: string;
  reserved: boolean;
}

/** Every question of the course with what the draw needs. */
export async function loadBankQuestions(courseId: string): Promise<BankQuestion[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT id, type, difficulty, topic_id AS topicId, status, coalesce(json_extract(settings, '$.reserved'), 0) AS reserved
         FROM exercises WHERE course_id = ?`,
    )
    .bind(courseId)
    .all<{ id: string; type: string; difficulty: string; topicId: string | null; status: string; reserved: number }>();
  return results.map((r) => ({ ...r, reserved: r.reserved === 1 }));
}

/** What practice exams may draw: published, scorable (not write_code) and not reserved for a quiz. */
export const drawable = (q: BankQuestion) => q.status === "published" && q.type !== "write_code" && !q.reserved;

export async function loadExamRules(courseId: string, onlyPublished = true): Promise<Map<string, { title: string; rules: DrawRule[] }>> {
  const { db } = getBindings();
  const [exams, rules] = await db.batch<Record<string, unknown>>([
    db.prepare(`SELECT id, title FROM exam_templates WHERE course_id = ? ${onlyPublished ? "AND status = 'published'" : ""}`).bind(courseId),
    db
      .prepare(
        `SELECT exam_template_id AS examId, question_count AS count, type, difficulty, topic_id AS topicId, points_each AS points
           FROM exam_template_rules WHERE course_id = ? ORDER BY id`,
      )
      .bind(courseId),
  ]);
  const out = new Map<string, { title: string; rules: DrawRule[] }>();
  for (const e of exams?.results ?? []) out.set(String(e.id), { title: String(e.title), rules: [] });
  for (const r of rules?.results ?? []) {
    out.get(String(r.examId))?.rules.push({
      count: Number(r.count),
      type: (r.type as string | null) ?? null,
      difficulty: (r.difficulty as string | null) ?? null,
      topicId: (r.topicId as string | null) ?? null,
      points: Number(r.points),
    });
  }
  return out;
}

/** True when the rules can be drawn from the bank every time (checked with many seeded draws, like the content build). */
export function rulesAlwaysDraw(rules: readonly DrawRule[], bank: readonly DrawCandidate[]): boolean {
  if (rules.length === 0) return false;
  let seed = 1;
  const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let i = 0; i < 100; i++) if (!drawExam(rules, bank, random)) return false;
  return true;
}

/** Titles of published practice exams that could no longer be drawn if the bank looked like `bank`. */
export async function examsBrokenBy(courseId: string, bank: readonly BankQuestion[]): Promise<string[]> {
  const exams = await loadExamRules(courseId);
  const pool = bank.filter(drawable);
  return [...exams.values()].filter((e) => !rulesAlwaysDraw(e.rules, pool)).map((e) => e.title);
}
