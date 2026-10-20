// A course's own settings: create, edit, rename, publish/archive, delete.
// Creating, publishing, renaming and deleting courses is for administrators;
// a course admin may edit the title, description and tags of their course.
import { isAdmin } from "@/lib/auth/permissions";
import { isValidSlug } from "@/lib/slug";
import { newId } from "@/lib/ids";
import { getBindings } from "@/server/platform/env";
import { auditStatement, revisionStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, str } from "./context";
import type { AdminCourse, CourseStatus } from "./courses";
import { renameCourseUrls } from "./search-index";
import { deletePrefix } from "./resources";
import { moveSeoPath, readSeo, seoStatements } from "./seo";

interface CourseInput {
  title: string;
  shortTitle: string;
  slug: string;
  description: string;
  primaryLanguage: "cpp" | "python";
  tags: string[];
}

function readCourse(raw: Record<string, unknown>): { input: CourseInput; errors: Record<string, string> } {
  const tagsText = typeof raw.tags === "string" ? raw.tags : Array.isArray(raw.tags) ? raw.tags.join(",") : "";
  const input: CourseInput = {
    title: str(raw.title, 300),
    shortTitle: str(raw.shortTitle, 120),
    slug: str(raw.slug, 120).toLowerCase(),
    description: str(raw.description, 4000),
    primaryLanguage: raw.primaryLanguage === "cpp" ? "cpp" : "python",
    tags: [...new Set(tagsText.split(",").map((t) => t.trim()).filter(Boolean))].slice(0, 12).map((t) => t.slice(0, 40)),
  };
  const errors: Record<string, string> = {};
  if (input.title.length < 3 || input.title.length > 120) errors.title = "Give the course a title (3 to 120 characters).";
  if (input.shortTitle.length < 2 || input.shortTitle.length > 40) errors.shortTitle = "Give a short name for menus (2 to 40 characters).";
  if (!isValidSlug(input.slug)) errors.slug = "Use lower-case words joined by hyphens, like data-structures.";
  if (input.description.length < 20 || input.description.length > 600) errors.description = "Describe the course in 20 to 600 characters (it is shown on the course page and in search results).";
  return { input, errors };
}

export async function createCourse(actor: Actor, raw: Record<string, unknown>): Promise<AdminResult<{ slug: string }>> {
  if (!isAdmin(actor.staff)) return fail("Only administrators can add courses.");
  const { input, errors } = readCourse(raw);
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  const id = newId("crs");
  const now = Date.now();
  try {
    await db.batch([
      db
        .prepare(
          `INSERT INTO courses (id, slug, title, short_title, description, primary_language, tags, status, sort_order, created_by, updated_by, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, 'draft', coalesce(max(sort_order), 0) + 1, ?, ?, ?, ? FROM courses`,
        )
        .bind(id, input.slug, input.title, input.shortTitle, input.description, input.primaryLanguage, JSON.stringify(input.tags), actor.staff.id, actor.staff.id, now, now),
      auditStatement({ actorId: actor.staff.id, courseId: id, action: "course.create", entityType: "course", entityId: id, after: { title: input.title, slug: input.slug }, ip: actor.ip }, now),
    ]);
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another course already uses this slug." });
    throw error;
  }
  return done({ slug: input.slug }, "Course created as a draft. Add topics and lectures, then publish it.");
}

/**
 * Saves a course's details and its search-engine settings. Renaming the slug
 * (administrators only) moves every address under /courses/<slug>/, so the
 * search index and SEO paths follow; old links stop working.
 */
export async function updateCourse(actor: Actor, course: AdminCourse, raw: Record<string, unknown>): Promise<AdminResult<{ slug: string }>> {
  if (denied(actor, "settings", course)) return fail(NO_PERMISSION);
  const { input, errors } = readCourse({ ...raw, slug: raw.slug ?? course.slug });
  const { seo, errors: seoErrors } = readSeo(raw);
  Object.assign(errors, seoErrors);
  if (!isAdmin(actor.staff)) input.slug = course.slug;
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  const now = Date.now();
  const renamed = input.slug !== course.slug;
  const statements: D1PreparedStatement[] = [
    db
      .prepare("UPDATE courses SET slug = ?, title = ?, short_title = ?, description = ?, primary_language = ?, tags = ?, updated_by = ?, updated_at = ? WHERE id = ?")
      .bind(input.slug, input.title, input.shortTitle, input.description, input.primaryLanguage, JSON.stringify(input.tags), actor.staff.id, now, course.id),
  ];
  if (renamed) statements.push(renameCourseUrls(course.id, course.slug, input.slug), ...moveSeoPath(course.id, `/courses/${course.slug}`, `/courses/${input.slug}`));
  statements.push(
    ...seoStatements(course.id, `/courses/${input.slug}`, seo, actor.staff.id, now),
    revisionStatement({ courseId: course.id, entityType: "course", entityId: course.id, snapshot: input, authorId: actor.staff.id, now }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: renamed ? "course.rename" : "course.update",
        entityType: "course",
        entityId: course.id,
        before: { title: course.title, slug: course.slug },
        after: { title: input.title, slug: input.slug },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another course already uses this slug." });
    throw error;
  }
  return done({ slug: input.slug }, renamed ? "Course saved. Its address changed, so old links to it no longer work." : "Course saved.");
}

/** Publish, move back to draft, or archive (hidden from students, kept for staff). Administrators only. */
export async function setCourseStatus(actor: Actor, course: AdminCourse, status: CourseStatus): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail("Only administrators can publish or archive a course.");
  if (status === "published") {
    const live = await getBindings()
      .db.prepare("SELECT count(*) AS n FROM lessons WHERE course_id = ? AND (status = 'published' OR (status = 'scheduled' AND publish_at <= ?))")
      .bind(course.id, Date.now())
      .first<{ n: number }>();
    if (!live?.n) return fail("Publish at least one lecture in this course first, so students don't land on an empty course.");
  }
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db
      .prepare("UPDATE courses SET status = ?, published_at = CASE WHEN ? = 'published' THEN coalesce(published_at, ?) ELSE published_at END, updated_by = ?, updated_at = ? WHERE id = ?")
      .bind(status, status, now, actor.staff.id, now, course.id),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: `course.${status === "published" ? "publish" : status === "archived" ? "archive" : "unpublish"}`, entityType: "course", entityId: course.id, before: { status: course.status }, after: { title: course.title, status }, ip: actor.ip }, now),
  ]);
  return done(undefined, status === "published" ? "Course published." : status === "archived" ? "Course archived: students can't see it any more." : "Course moved back to draft.");
}

export async function reorderCourses(actor: Actor, ids: unknown): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const { results } = await db.prepare("SELECT id FROM courses").all<{ id: string }>();
  if (!Array.isArray(ids) || ids.length !== results.length || !results.every((r) => ids.includes(r.id))) {
    return fail("The list changed while you were working. Reload the page and try again.");
  }
  await db.batch([
    ...ids.map((id, i) => db.prepare("UPDATE courses SET sort_order = ? WHERE id = ?").bind(i + 1, String(id))),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "course.reorder", entityType: "course", entityId: null, ip: actor.ip }),
  ]);
  return done(undefined, "New order saved.");
}

/**
 * Deletes a course and everything in it (lectures, questions, quizzes, files,
 * students' progress in it). Only an archived course can be deleted, and only
 * after typing its slug. Cannot be undone.
 */
export async function deleteCourse(actor: Actor, course: AdminCourse, typedSlug: string): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail("Only administrators can delete a course.");
  if (course.status !== "archived") return fail("Archive the course first. Archiving hides it from students and can be undone; deleting can't.");
  if (typedSlug.trim() !== course.slug) return fail("Type the course's slug exactly to confirm.", { confirm: `Type ${course.slug} to confirm.` });
  const { db, files } = getBindings();
  const now = Date.now();
  // Quiz questions point at questions without a cascade; remove them first, then the course (everything else cascades).
  await db.batch([
    db.prepare("DELETE FROM quiz_questions WHERE course_id = ?").bind(course.id),
    db.prepare("DELETE FROM search_index WHERE course_id = ?").bind(course.id),
    db.prepare("DELETE FROM courses WHERE id = ?").bind(course.id),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "course.delete", entityType: "course", entityId: course.id, before: { title: course.title, slug: course.slug }, after: { title: course.title }, ip: actor.ip }, now),
  ]);
  await deletePrefix(files, `courses/${course.id}/`);
  return done(undefined, `"${course.title}" was deleted.`);
}
