// Topics of one course: list, create, edit, reorder, delete.
import { isValidSlug } from "@/lib/slug";
import { newId } from "@/lib/ids";
import { getBindings } from "@/server/platform/env";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, str } from "./context";
import type { AdminCourse } from "./courses";
import { searchStatements } from "./search-index";

export type TopicStatus = "draft" | "published" | "archived";

export interface AdminTopic {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: TopicStatus;
  sortOrder: number;
  lectures: number;
  questions: number;
}

export async function listTopics(course: AdminCourse): Promise<AdminTopic[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT t.id, t.slug, t.title, t.description, t.status, t.sort_order AS sortOrder,
              (SELECT count(*) FROM lessons l WHERE l.course_id = t.course_id AND l.topic_id = t.id) AS lectures,
              (SELECT count(*) FROM exercises e WHERE e.course_id = t.course_id AND e.topic_id = t.id) AS questions
         FROM topics t WHERE t.course_id = ? ORDER BY t.sort_order, t.title`,
    )
    .bind(course.id)
    .all<AdminTopic>();
  return results;
}

interface TopicInput {
  title: string;
  slug: string;
  description: string;
  status: TopicStatus;
}

function readTopic(raw: Record<string, unknown>): { input: TopicInput; errors: Record<string, string> } {
  const input: TopicInput = {
    title: str(raw.title, 200),
    slug: str(raw.slug, 100).toLowerCase(),
    description: str(raw.description, 1000),
    status: raw.status === "published" || raw.status === "archived" ? raw.status : "draft",
  };
  const errors: Record<string, string> = {};
  if (input.title.length < 2 || input.title.length > 120) errors.title = "Give the topic a title (2 to 120 characters).";
  if (!isValidSlug(input.slug)) errors.slug = "Use lower-case words joined by hyphens, like for-loops.";
  if (input.description.length > 400) errors.description = "Keep the description under 400 characters.";
  return { input, errors };
}

function searchRow(course: AdminCourse, id: string, t: TopicInput) {
  return searchStatements({
    courseId: course.id,
    entityType: "topic",
    entityId: id,
    row: t.status === "published" ? { url: `/courses/${course.slug}/topics/${t.slug}`, title: t.title, body: t.description } : null,
  });
}

export async function saveTopic(actor: Actor, course: AdminCourse, id: string | null, raw: Record<string, unknown>): Promise<AdminResult<{ id: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { input, errors } = readTopic(raw);
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  const now = Date.now();
  const existing = id
    ? await db.prepare("SELECT id, status, title, slug FROM topics WHERE course_id = ? AND id = ?").bind(course.id, id).first<{ id: string; status: TopicStatus; title: string; slug: string }>()
    : null;
  if (id && !existing) return fail("This topic doesn't exist in this course any more.");
  // Editors can't change what students see: new topics start as drafts and the status stays as it was.
  if (denied(actor, "publish", course)) input.status = existing?.status ?? "draft";
  const topicId = existing?.id ?? newId("top");
  try {
    if (existing) {
      await db.batch([
        db
          .prepare("UPDATE topics SET title = ?, slug = ?, description = ?, status = ?, updated_at = ? WHERE course_id = ? AND id = ?")
          .bind(input.title, input.slug, input.description, input.status, now, course.id, topicId),
        ...searchRow(course, topicId, input),
        auditStatement({
          actorId: actor.staff.id,
          courseId: course.id,
          action: existing.status !== input.status ? statusAction(input.status) : "topic.update",
          entityType: "topic",
          entityId: topicId,
          before: { title: existing.title, slug: existing.slug, status: existing.status },
          after: { title: input.title, slug: input.slug, status: input.status },
          ip: actor.ip,
        }, now),
      ]);
    } else {
      await db.batch([
        db
          .prepare(
            `INSERT INTO topics (id, course_id, slug, title, description, status, sort_order, created_at, updated_at)
             SELECT ?, ?, ?, ?, ?, ?, coalesce(max(sort_order), 0) + 1, ?, ? FROM topics WHERE course_id = ?`,
          )
          .bind(topicId, course.id, input.slug, input.title, input.description, input.status, now, now, course.id),
        ...searchRow(course, topicId, input),
        auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "topic.create", entityType: "topic", entityId: topicId, after: { title: input.title, slug: input.slug }, ip: actor.ip }, now),
      ]);
    }
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another topic in this course already uses this slug." });
    throw error;
  }
  return done({ id: topicId }, existing ? "Topic saved." : "Topic added.");
}

function statusAction(status: TopicStatus): string {
  return status === "published" ? "topic.publish" : status === "archived" ? "topic.archive" : "topic.unpublish";
}

/** Saves a new order: `ids` must be exactly this course's topics. */
export async function reorderTopics(actor: Actor, course: AdminCourse, ids: unknown): Promise<AdminResult> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const current = await listTopics(course);
  if (!Array.isArray(ids) || ids.length !== current.length || !current.every((t) => ids.includes(t.id))) {
    return fail("The list changed while you were working. Reload the page and try again.");
  }
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    ...ids.map((id, i) => db.prepare("UPDATE topics SET sort_order = ?, updated_at = ? WHERE course_id = ? AND id = ?").bind(i + 1, now, course.id, String(id))),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "topic.reorder", entityType: "topic", entityId: null, ip: actor.ip }, now),
  ]);
  return done(undefined, "New order saved.");
}

export async function deleteTopic(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const topic = await db
    .prepare(
      `SELECT t.title, t.slug, (SELECT count(*) FROM lessons l WHERE l.course_id = t.course_id AND l.topic_id = t.id) AS lectures,
              (SELECT count(*) FROM exam_template_rules r WHERE r.course_id = t.course_id AND r.topic_id = t.id) AS rules
         FROM topics t WHERE t.course_id = ? AND t.id = ?`,
    )
    .bind(course.id, id)
    .first<{ title: string; slug: string; lectures: number; rules: number }>();
  if (!topic) return fail("This topic doesn't exist in this course any more.");
  if (topic.lectures > 0) return fail(`Move this topic's ${topic.lectures} lecture${topic.lectures === 1 ? "" : "s"} to another topic first.`);
  // A practice exam rule that draws from this topic would be deleted with it (ON DELETE CASCADE), so ask first.
  if (topic.rules > 0) return fail("A practice exam draws questions from this topic. Change that exam's rules first.");
  const now = Date.now();
  // The database unlinks questions, files and quizzes tagged with the topic (trigger); they stay in the course.
  await db.batch([
    db.prepare("DELETE FROM topics WHERE course_id = ? AND id = ?").bind(course.id, id),
    ...searchStatements({ courseId: course.id, entityType: "topic", entityId: id, row: null }),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "topic.delete", entityType: "topic", entityId: id, before: { title: topic.title, slug: topic.slug }, after: { title: topic.title }, ip: actor.ip }, now),
  ]);
  return done(undefined, "Topic deleted.");
}
