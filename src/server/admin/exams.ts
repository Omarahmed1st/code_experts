// Practice exams in the admin: settings and the rules that draw questions from
// the course's bank. A published exam must be drawable every time.
import { isValidSlug } from "@/lib/slug";
import { newId } from "@/lib/ids";
import type { DrawRule } from "@/lib/grading/exam-draw";
import { getBindings } from "@/server/platform/env";
import { auditStatement, revisionStatement } from "./audit";
import { drawable, loadBankQuestions, rulesAlwaysDraw } from "./bank";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, str } from "./context";
import type { AdminCourse } from "./courses";

export type ExamStatus = "draft" | "published" | "archived";
export const EXAM_TYPES = ["mcq", "trace", "correct_code"] as const;

export interface AdminExamRow {
  id: string;
  slug: string;
  title: string;
  status: ExamStatus;
  timeLimitSec: number;
  questions: number;
  updatedAt: number;
}

export async function listAdminExams(course: AdminCourse): Promise<AdminExamRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT x.id, x.slug, x.title, x.status, x.time_limit_sec AS timeLimitSec, x.updated_at AS updatedAt,
              coalesce((SELECT sum(question_count) FROM exam_template_rules r WHERE r.course_id = x.course_id AND r.exam_template_id = x.id), 0) AS questions
         FROM exam_templates x WHERE x.course_id = ? ORDER BY x.created_at, x.title`,
    )
    .bind(course.id)
    .all<AdminExamRow>();
  return results;
}

export interface ExamRuleDraft {
  count: number;
  type: (typeof EXAM_TYPES)[number] | null;
  difficulty: "easy" | "medium" | "hard" | null;
  topicId: string | null;
  points: number;
}

export interface ExamDraft {
  title: string;
  slug: string;
  descriptionMd: string;
  scope: "course" | "topic" | "mixed_topics";
  minutes: number;
  passThreshold: number;
  shuffleQuestions: boolean;
  status: ExamStatus;
  rules: ExamRuleDraft[];
}

export async function getExamForEdit(course: AdminCourse, id: string): Promise<{ id: string; draft: ExamDraft } | null> {
  const { db } = getBindings();
  const [exam, rules] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT slug, title, description_md AS descriptionMd, scope, time_limit_sec AS timeLimitSec, pass_threshold AS passThreshold,
                shuffle_questions AS shuffleQuestions, status FROM exam_templates WHERE course_id = ? AND id = ?`,
      )
      .bind(course.id, id),
    db
      .prepare(
        `SELECT question_count AS count, type, difficulty, topic_id AS topicId, points_each AS points
           FROM exam_template_rules WHERE course_id = ? AND exam_template_id = ? ORDER BY id`,
      )
      .bind(course.id, id),
  ]);
  const e = exam?.results[0];
  if (!e) return null;
  return {
    id,
    draft: {
      title: String(e.title),
      slug: String(e.slug),
      descriptionMd: String(e.descriptionMd ?? ""),
      scope: e.scope as ExamDraft["scope"],
      minutes: Math.round(Number(e.timeLimitSec) / 60),
      passThreshold: Number(e.passThreshold),
      shuffleQuestions: e.shuffleQuestions === 1,
      status: e.status as ExamStatus,
      rules: (rules?.results ?? []).map((r) => ({
        count: Number(r.count),
        type: (r.type as ExamRuleDraft["type"]) ?? null,
        difficulty: (r.difficulty as ExamRuleDraft["difficulty"]) ?? null,
        topicId: (r.topicId as string | null) ?? null,
        points: Number(r.points),
      })),
    },
  };
}

export function readExamDraft(raw: unknown): ExamDraft {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const num = (v: unknown) => (v === "" || v === null || v === undefined ? Number.NaN : Number(v));
  return {
    title: str(r.title, 400),
    slug: str(r.slug, 120).toLowerCase(),
    descriptionMd: str(r.descriptionMd, 10_000),
    scope: r.scope === "topic" || r.scope === "mixed_topics" ? r.scope : "course",
    minutes: num(r.minutes),
    passThreshold: num(r.passThreshold),
    shuffleQuestions: r.shuffleQuestions === true,
    status: r.status === "published" || r.status === "archived" ? r.status : "draft",
    rules: (Array.isArray(r.rules) ? r.rules : []).slice(0, 40).map((x) => {
      const o = (x && typeof x === "object" ? x : {}) as Record<string, unknown>;
      return {
        count: num(o.count),
        type: (EXAM_TYPES as readonly string[]).includes(o.type as string) ? (o.type as ExamRuleDraft["type"]) : null,
        difficulty: o.difficulty === "easy" || o.difficulty === "medium" || o.difficulty === "hard" ? o.difficulty : null,
        topicId: typeof o.topicId === "string" && o.topicId ? o.topicId : null,
        points: num(o.points),
      };
    }),
  };
}

/** How many questions each rule can draw from right now (published, scorable, not reserved). */
export async function ruleAvailability(course: AdminCourse, rules: readonly ExamRuleDraft[]): Promise<number[]> {
  const pool = (await loadBankQuestions(course.id)).filter(drawable);
  return rules.map((r) => pool.filter((q) => (r.type === null || q.type === r.type) && (r.difficulty === null || q.difficulty === r.difficulty) && (r.topicId === null || q.topicId === r.topicId)).length);
}

export async function saveExam(actor: Actor, course: AdminCourse, id: string | null, raw: unknown): Promise<AdminResult<{ id: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const current = id ? await getExamForEdit(course, id) : null;
  if (id && !current) return fail("This practice exam doesn't exist in this course any more.");
  const d = readExamDraft(raw);
  if (denied(actor, "publish", course)) d.status = current?.draft.status ?? "draft";

  const errors: Record<string, string> = {};
  if (d.title.length < 2 || d.title.length > 160) errors.title = "Give the exam a title (2 to 160 characters).";
  if (!isValidSlug(d.slug)) errors.slug = "Use lower-case words joined by hyphens, like midterm-practice.";
  if (!Number.isInteger(d.minutes) || d.minutes < 1 || d.minutes > 600) errors.minutes = "Use 1 to 600 minutes.";
  if (!Number.isInteger(d.passThreshold) || d.passThreshold < 0 || d.passThreshold > 100) errors.passThreshold = "Use a pass mark from 0 to 100 percent.";
  if (d.rules.length === 0) errors.rules = "Add at least one rule: how many questions to draw, and of which kind.";
  if (d.rules.some((r) => !Number.isInteger(r.count) || r.count < 1 || r.count > 100)) errors.rules = "Each rule draws 1 to 100 questions.";
  else if (d.rules.some((r) => !Number.isInteger(r.points) || r.points < 1 || r.points > 100)) errors.rules = "Each question is worth 1 to 100 points.";
  else if (d.rules.reduce((n, r) => n + r.count, 0) > 150) errors.rules = "An exam draws at most 150 questions.";
  const topicIds = [...new Set(d.rules.map((r) => r.topicId).filter((t): t is string => t !== null))];
  if (topicIds.length) {
    const { results } = await db
      .prepare(`SELECT id FROM topics WHERE course_id = ? AND id IN (${topicIds.map(() => "?").join(", ")})`)
      .bind(course.id, ...topicIds)
      .all<{ id: string }>();
    if (results.length !== topicIds.length) errors.rules = "A rule uses a topic that isn't in this course.";
  }
  if (!errors.rules && d.status === "published") {
    const pool = (await loadBankQuestions(course.id)).filter(drawable);
    if (!rulesAlwaysDraw(d.rules as DrawRule[], pool)) errors.rules = "The course doesn't have enough published questions for these rules. Lower a count or widen a rule.";
  }
  if (Object.keys(errors).length) return fail(Object.keys(errors).length === 1 ? Object.values(errors)[0]! : "Check the highlighted fields.", errors);

  const examId = current?.id ?? newId("exam");
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  if (current) {
    statements.push(
      db
        .prepare(
          `UPDATE exam_templates SET slug = ?, title = ?, description_md = ?, scope = ?, time_limit_sec = ?, pass_threshold = ?, shuffle_questions = ?, status = ?, updated_at = ?
            WHERE course_id = ? AND id = ?`,
        )
        .bind(d.slug, d.title, d.descriptionMd, d.scope, d.minutes * 60, d.passThreshold, d.shuffleQuestions ? 1 : 0, d.status, now, course.id, examId),
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO exam_templates (id, course_id, slug, title, description_md, scope, time_limit_sec, pass_threshold, shuffle_questions, status, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(examId, course.id, d.slug, d.title, d.descriptionMd, d.scope, d.minutes * 60, d.passThreshold, d.shuffleQuestions ? 1 : 0, d.status, now, now),
    );
  }
  statements.push(db.prepare("DELETE FROM exam_template_rules WHERE course_id = ? AND exam_template_id = ?").bind(course.id, examId));
  // Rule ids sort in rule order (the draw reads them ORDER BY id).
  const ruleBase = newId("rule");
  d.rules.forEach((r, i) =>
    statements.push(
      db
        .prepare(
          `INSERT INTO exam_template_rules (id, course_id, exam_template_id, topic_id, type, difficulty, question_count, points_each)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(`${ruleBase}_${String(i + 1).padStart(2, "0")}`, course.id, examId, r.topicId, r.type, r.difficulty, r.count, r.points),
    ),
  );
  statements.push(
    revisionStatement({ courseId: course.id, entityType: "exam_template", entityId: examId, snapshot: d, authorId: actor.staff.id, now }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: !current ? "exam.create" : current.draft.status !== d.status ? `exam.${d.status === "published" ? "publish" : d.status === "archived" ? "archive" : "unpublish"}` : "exam.update",
        entityType: "exam_template",
        entityId: examId,
        before: current ? { title: current.draft.title, slug: current.draft.slug, status: current.draft.status } : undefined,
        after: { title: d.title, slug: d.slug, status: d.status, rules: d.rules.length },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another practice exam in this course already uses this slug." });
    throw error;
  }
  return done({ id: examId }, current ? "Practice exam saved." : "Practice exam created.");
}

export async function deleteExam(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const exam = await getExamForEdit(course, id);
  if (!exam) return fail("This practice exam doesn't exist in this course any more.");
  const { db } = getBindings();
  await db.batch([
    db.prepare("DELETE FROM exam_templates WHERE course_id = ? AND id = ?").bind(course.id, id),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "exam.delete", entityType: "exam_template", entityId: id, before: { title: exam.draft.title, slug: exam.draft.slug }, after: { title: exam.draft.title }, ip: actor.ip }),
  ]);
  return done(undefined, "Practice exam deleted.");
}
