// Search-engine title and description overrides (seo_metadata), per page path.
// Used for a course's home page and its lectures; the public pages read them
// through getSeoOverride (src/server/seo.ts).
import { newId } from "@/lib/ids";
import type { SeoOverride } from "@/server/seo";
import { getSeoOverride } from "@/server/seo";
import { getBindings } from "@/server/platform/env";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, str } from "./context";
import type { AdminCourse } from "./courses";

export const SEO_LIMITS = { title: 70, description: 170 } as const;

export function readSeo(raw: Record<string, unknown>): { seo: SeoOverride; errors: Record<string, string> } {
  const seo: SeoOverride = {
    title: str(raw.seoTitle, 300) || null,
    description: str(raw.seoDescription, 1000) || null,
    noindex: raw.noindex === true || raw.noindex === "on" || raw.noindex === "true",
  };
  const errors: Record<string, string> = {};
  if (seo.title && seo.title.length > SEO_LIMITS.title) errors.seoTitle = `Keep the search title under ${SEO_LIMITS.title} characters (search engines cut longer ones).`;
  if (seo.description && seo.description.length > SEO_LIMITS.description) errors.seoDescription = `Keep the search description under ${SEO_LIMITS.description} characters.`;
  return { seo, errors };
}

/** Replaces the override for a path; nothing set removes it. */
export function seoStatements(courseId: string, path: string, seo: SeoOverride, actorId: string, now = Date.now()): D1PreparedStatement[] {
  const { db } = getBindings();
  const remove = db.prepare("DELETE FROM seo_metadata WHERE path = ? AND course_id = ?").bind(path, courseId);
  if (!seo.title && !seo.description && !seo.noindex) return [remove];
  return [
    remove,
    db
      .prepare("INSERT INTO seo_metadata (id, course_id, path, title, description, noindex, updated_by, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(newId("seo"), courseId, path, seo.title, seo.description, seo.noindex ? 1 : 0, actorId, now),
  ];
}

/** After a slug change: the override follows the page to its new path (and the paths under it, for a course). */
export function moveSeoPath(courseId: string, oldPath: string, newPath: string): D1PreparedStatement[] {
  const { db } = getBindings();
  return [
    db.prepare("UPDATE seo_metadata SET path = ? WHERE course_id = ? AND path = ?").bind(newPath, courseId, oldPath),
    db
      .prepare("UPDATE seo_metadata SET path = ? || substr(path, ?) WHERE course_id = ? AND substr(path, 1, ?) = ?")
      .bind(`${newPath}/`, oldPath.length + 2, courseId, oldPath.length + 1, `${oldPath}/`),
  ];
}

export async function getSeo(path: string): Promise<SeoOverride> {
  return (await getSeoOverride(path)) ?? { title: null, description: null, noindex: false };
}

export async function saveSeo(actor: Actor, course: AdminCourse, path: string, raw: Record<string, unknown>): Promise<AdminResult> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  if (!path.startsWith(`/courses/${course.slug}`)) return fail(NO_PERMISSION);
  const { seo, errors } = readSeo(raw);
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  await db.batch([
    ...seoStatements(course.id, path, seo, actor.staff.id),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "seo.update", entityType: "seo", entityId: path, after: seo, ip: actor.ip }),
  ]);
  return done(undefined, "Search settings saved.");
}
