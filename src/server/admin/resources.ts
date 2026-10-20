// Course files in the admin (slides, PDFs, handouts…): details, the uploaded
// original and preview PDF in R2, replacing, attaching to lectures, deleting.
// R2 keys are always courses/<course_id>/resources/<resource_id>/<file id>.
import { type RESOURCE_ACCESS, RESOURCE_KIND } from "@/db/enums";
import { FORMAT_INFO, PREVIEW_RULE, RESOURCE_RULES, safeFileName } from "@/lib/files/sniff";
import { isValidSlug } from "@/lib/slug";
import { newId } from "@/lib/ids";
import { markdownToPlainText } from "@/lib/lesson/source";
import { getBindings } from "@/server/platform/env";
import { UploadError, receiveUpload } from "@/server/files/upload";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, str } from "./context";
import type { AdminCourse } from "./courses";
import { searchStatements } from "./search-index";

export type ResourceKind = (typeof RESOURCE_KIND)[number];
export type ResourceAccess = (typeof RESOURCE_ACCESS)[number];
export type ResourceStatus = "draft" | "published" | "archived";
export type FileRole = "original" | "preview";

export interface AdminResourceFile {
  role: FileRole;
  filename: string;
  contentType: string;
  sizeBytes: number;
  createdAt: number;
}

export interface AdminResource {
  id: string;
  slug: string;
  title: string;
  descriptionMd: string;
  kind: ResourceKind;
  access: ResourceAccess;
  downloadable: boolean;
  status: ResourceStatus;
  topicId: string | null;
  topicTitle: string | null;
  updatedAt: number;
  files: AdminResourceFile[];
  lectures: { id: string; title: string }[];
}

export async function listAdminResources(course: AdminCourse): Promise<AdminResource[]> {
  const { db } = getBindings();
  const [res, files, links] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT r.id, r.slug, r.title, r.description_md AS descriptionMd, r.kind, r.access, r.downloadable, r.status, r.topic_id AS topicId,
                t.title AS topicTitle, r.updated_at AS updatedAt
           FROM resources r LEFT JOIN topics t ON t.course_id = r.course_id AND t.id = r.topic_id
          WHERE r.course_id = ? ORDER BY r.sort_order, r.title`,
      )
      .bind(course.id),
    db
      .prepare("SELECT resource_id AS resourceId, role, filename, content_type AS contentType, size_bytes AS sizeBytes, created_at AS createdAt FROM resource_files WHERE course_id = ?")
      .bind(course.id),
    db
      .prepare(
        `SELECT lr.resource_id AS resourceId, l.id, l.title FROM lesson_resources lr JOIN lessons l ON l.course_id = lr.course_id AND l.id = lr.lesson_id
          WHERE lr.course_id = ? ORDER BY l.sort_order`,
      )
      .bind(course.id),
  ]);
  return (res?.results ?? []).map((r) => ({
    ...(r as unknown as AdminResource),
    downloadable: r.downloadable === 1,
    files: ((files?.results ?? []) as unknown as (AdminResourceFile & { resourceId: string })[])
      .filter((f) => f.resourceId === r.id)
      .map(({ resourceId: _r, ...f }) => {
        void _r;
        return f;
      })
      .sort((a, b) => a.role.localeCompare(b.role)),
    lectures: ((links?.results ?? []) as { resourceId: string; id: string; title: string }[]).filter((l) => l.resourceId === r.id).map(({ id, title }) => ({ id, title })),
  }));
}

export async function getAdminResource(course: AdminCourse, id: string): Promise<AdminResource | null> {
  return (await listAdminResources(course)).find((r) => r.id === id) ?? null;
}

interface ResourceInput {
  title: string;
  slug: string;
  descriptionMd: string;
  kind: ResourceKind;
  access: ResourceAccess;
  downloadable: boolean;
  status: ResourceStatus;
  topicId: string | null;
}

function readResource(raw: Record<string, unknown>): { input: ResourceInput; errors: Record<string, string> } {
  const input: ResourceInput = {
    title: str(raw.title, 300),
    slug: str(raw.slug, 120).toLowerCase(),
    descriptionMd: str(raw.descriptionMd, 10_000),
    kind: (RESOURCE_KIND as readonly string[]).includes(raw.kind as string) ? (raw.kind as ResourceKind) : "presentation",
    // Student-only files need student accounts (Phase 5); until then a file is public or staff-only.
    access: raw.access === "staff" ? "staff" : "public",
    downloadable: raw.downloadable === true || raw.downloadable === "on" || raw.downloadable === "true",
    status: raw.status === "published" || raw.status === "archived" ? raw.status : "draft",
    topicId: typeof raw.topicId === "string" && raw.topicId ? raw.topicId : null,
  };
  const errors: Record<string, string> = {};
  if (input.title.length < 2 || input.title.length > 160) errors.title = "Give the file a title (2 to 160 characters).";
  if (!isValidSlug(input.slug)) errors.slug = "Use lower-case words joined by hyphens, like lecture-3-slides.";
  if (input.descriptionMd.length > 4000) errors.descriptionMd = "Keep the description under 4000 characters.";
  return { input, errors };
}

function resourceSearch(course: AdminCourse, id: string, r: ResourceInput) {
  return searchStatements({
    courseId: course.id,
    entityType: "resource",
    entityId: id,
    row:
      r.status === "published" && r.access === "public"
        ? { url: `/courses/${course.slug}/resources/${r.slug}`, title: r.title, body: markdownToPlainText(r.descriptionMd) }
        : null,
  });
}

export async function saveResource(actor: Actor, course: AdminCourse, id: string | null, raw: Record<string, unknown>): Promise<AdminResult<{ id: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { input, errors } = readResource(raw);
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  const existing = id ? await getAdminResource(course, id) : null;
  if (id && !existing) return fail("This file doesn't exist in this course any more.");
  if (denied(actor, "publish", course)) input.status = existing?.status ?? "draft";
  if (input.topicId && !(await db.prepare("SELECT 1 FROM topics WHERE course_id = ? AND id = ?").bind(course.id, input.topicId).first())) {
    return fail("Check the highlighted fields.", { topicId: "Choose a topic of this course." });
  }
  if (input.status === "published" && !existing?.files.length) {
    return fail("Upload the file before publishing it.", { status: "Upload the file first." });
  }
  if (existing?.files.some((f) => f.role === "original") && existing.kind !== input.kind) {
    const original = existing.files.find((f) => f.role === "original")!;
    const format = Object.entries(FORMAT_INFO).find(([, info]) => original.contentType.startsWith(info.contentType.split(";")[0]!))?.[0];
    if (format && !(RESOURCE_RULES[input.kind]?.original as string[] | undefined)?.includes(format)) {
      return fail("Check the highlighted fields.", { kind: `The uploaded ${FORMAT_INFO[format as keyof typeof FORMAT_INFO].label} file doesn't fit this kind. Upload a new file first, or keep the kind.` });
    }
  }
  const resourceId = existing?.id ?? newId("res");
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];
  if (existing) {
    statements.push(
      db
        .prepare(
          `UPDATE resources SET title = ?, slug = ?, description_md = ?, kind = ?, access = ?, downloadable = ?, status = ?, topic_id = ?, updated_by = ?, updated_at = ?
            WHERE course_id = ? AND id = ?`,
        )
        .bind(input.title, input.slug, input.descriptionMd, input.kind, input.access, input.downloadable ? 1 : 0, input.status, input.topicId, actor.staff.id, now, course.id, resourceId),
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO resources (id, course_id, topic_id, slug, title, description_md, kind, access, downloadable, sort_order, status, created_by, updated_by, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, coalesce(max(sort_order), 0) + 1, ?, ?, ?, ?, ? FROM resources WHERE course_id = ?`,
        )
        .bind(resourceId, course.id, input.topicId, input.slug, input.title, input.descriptionMd, input.kind, input.access, input.downloadable ? 1 : 0, input.status, actor.staff.id, actor.staff.id, now, now, course.id),
    );
  }
  statements.push(
    ...resourceSearch(course, resourceId, input),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: !existing ? "resource.create" : existing.status !== input.status ? `resource.${input.status === "published" ? "publish" : input.status === "archived" ? "archive" : "unpublish"}` : "resource.update",
        entityType: "resource",
        entityId: resourceId,
        before: existing ? { title: existing.title, slug: existing.slug, status: existing.status, access: existing.access } : undefined,
        after: { title: input.title, slug: input.slug, status: input.status, access: input.access },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another file in this course already uses this slug." });
    throw error;
  }
  return done({ id: resourceId }, existing ? "File details saved." : "File added. Now upload it.");
}

/**
 * Stores an uploaded original or preview for a resource (replacing the old one).
 * The file is checked by its bytes; its row and the old object are swapped only after the upload succeeds.
 */
export async function uploadResourceFile(
  actor: Actor,
  course: AdminCourse,
  resourceId: string,
  role: FileRole,
  request: Request,
  fileName: string,
): Promise<AdminResult<AdminResourceFile>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const resource = await getAdminResource(course, resourceId);
  if (!resource) return fail("This file doesn't exist in this course any more.");
  const rule = role === "preview" ? { formats: PREVIEW_RULE.formats, maxBytes: PREVIEW_RULE.maxBytes } : { formats: RESOURCE_RULES[resource.kind]!.original, maxBytes: RESOURCE_RULES[resource.kind]!.maxBytes };
  const fileId = newId("fil");
  const key = `courses/${course.id}/resources/${resourceId}/${fileId}`;
  let received;
  try {
    received = await receiveUpload(request, { key, allowed: rule.formats, maxBytes: rule.maxBytes, fileName });
  } catch (error) {
    if (error instanceof UploadError) {
      const accepted = rule.formats.map((f) => FORMAT_INFO[f].label).join(", ");
      return fail(error.status === 415 ? `${error.message} Accepted here: ${accepted}.` : error.message);
    }
    throw error;
  }
  const info = FORMAT_INFO[received.format];
  const filename = safeFileName(fileName, received.format);
  const old = await getBindings()
    .db.prepare("SELECT id, r2_key AS r2Key, filename FROM resource_files WHERE course_id = ? AND resource_id = ? AND role = ?")
    .bind(course.id, resourceId, role)
    .first<{ id: string; r2Key: string; filename: string }>();
  const { db, files } = getBindings();
  const now = Date.now();
  try {
    await db.batch([
      db.prepare("DELETE FROM resource_files WHERE course_id = ? AND resource_id = ? AND role = ?").bind(course.id, resourceId, role),
      db
        .prepare(
          `INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256, uploaded_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(fileId, course.id, resourceId, role, key, filename, info.contentType, received.size, received.sha256, actor.staff.id, now),
      db.prepare("UPDATE resources SET updated_by = ?, updated_at = ? WHERE course_id = ? AND id = ?").bind(actor.staff.id, now, course.id, resourceId),
      auditStatement(
        {
          actorId: actor.staff.id,
          courseId: course.id,
          action: old ? "resource.replace_file" : "resource.upload",
          entityType: "resource",
          entityId: resourceId,
          before: old ? { filename: old.filename, role } : undefined,
          after: { title: resource.title, filename, role, size: received.size, sha256: received.sha256 },
          ip: actor.ip,
        },
        now,
      ),
    ]);
  } catch (error) {
    await files.delete(key);
    throw error;
  }
  // R2 has the new file; the old one is no longer referenced.
  if (old) await files.delete(old.r2Key);
  return done({ role, filename, contentType: info.contentType, sizeBytes: received.size, createdAt: now }, old ? "File replaced." : "File uploaded.");
}

export async function removeResourceFile(actor: Actor, course: AdminCourse, resourceId: string, role: FileRole): Promise<AdminResult> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const resource = await getAdminResource(course, resourceId);
  if (!resource) return fail("This file doesn't exist in this course any more.");
  if (resource.status === "published" && resource.files.length === 1 && resource.files[0]?.role === role) {
    return fail("This is the only file of a published resource. Unpublish it first, or upload a replacement.");
  }
  const { db, files } = getBindings();
  const old = await db
    .prepare("SELECT r2_key AS r2Key, filename FROM resource_files WHERE course_id = ? AND resource_id = ? AND role = ?")
    .bind(course.id, resourceId, role)
    .first<{ r2Key: string; filename: string }>();
  if (!old) return done(undefined);
  await db.batch([
    db.prepare("DELETE FROM resource_files WHERE course_id = ? AND resource_id = ? AND role = ?").bind(course.id, resourceId, role),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "resource.remove_file", entityType: "resource", entityId: resourceId, before: { filename: old.filename, role }, after: { title: resource.title }, ip: actor.ip }),
  ]);
  await files.delete(old.r2Key);
  return done(undefined, role === "preview" ? "Preview removed." : "File removed.");
}

export async function deleteResource(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const resource = await getAdminResource(course, id);
  if (!resource) return fail("This file doesn't exist in this course any more.");
  const { db, files } = getBindings();
  const now = Date.now();
  // Its stored files and lecture links go with it (ON DELETE CASCADE).
  await db.batch([
    db.prepare("DELETE FROM resources WHERE course_id = ? AND id = ?").bind(course.id, id),
    ...searchStatements({ courseId: course.id, entityType: "resource", entityId: id, row: null }),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "resource.delete", entityType: "resource", entityId: id, before: { title: resource.title, slug: resource.slug, files: resource.files.map((f) => f.filename) }, after: { title: resource.title }, ip: actor.ip }, now),
  ]);
  await deletePrefix(files, `courses/${course.id}/resources/${id}/`);
  return done(undefined, "File deleted.");
}

export async function deletePrefix(files: R2Bucket, prefix: string): Promise<number> {
  let cursor: string | undefined;
  let count = 0;
  do {
    const list = await files.list({ prefix, cursor });
    if (list.objects.length) await files.delete(list.objects.map((o) => o.key));
    count += list.objects.length;
    cursor = list.truncated ? list.cursor : undefined;
  } while (cursor);
  return count;
}

/** For staff: any file of the course, in any status (the public route serves only published public ones). */
export async function getStaffResourceFile(course: AdminCourse, resourceId: string, role: FileRole) {
  return getBindings()
    .db.prepare("SELECT r2_key AS r2Key, filename, content_type AS contentType FROM resource_files WHERE course_id = ? AND resource_id = ? AND role = ?")
    .bind(course.id, resourceId, role)
    .first<{ r2Key: string; filename: string; contentType: string }>();
}
