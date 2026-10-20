// Course resources (slides, PDFs, handouts) and their files in R2.
//
// Phase 2 serves only resources whose access level is "public". "students"
// and "staff" resources need sign-in, which arrives in Phase 4; until then
// they are hidden rather than shown with a broken download.
import { and, asc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { RESOURCE_FILE_ROLE, RESOURCE_KIND } from "@/db/enums";
import { lessonResources, lessons, resourceFiles, resources, topics } from "@/db/schema";
import { isValidSlug } from "@/lib/slug";
import type { CourseScope } from "@/server/courses/scope";
import { lessonIsLive } from "./lessons";

export type ResourceKind = (typeof RESOURCE_KIND)[number];
export type FileRole = (typeof RESOURCE_FILE_ROLE)[number];

export interface ResourceFileView {
  role: FileRole;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface ResourceCard {
  slug: string;
  title: string;
  kind: ResourceKind;
  descriptionMd: string;
  downloadable: boolean;
  topicTitle: string | null;
  files: ResourceFileView[];
}

export interface ResourcePage extends ResourceCard {
  lessons: { slug: string; title: string }[];
}

function isPublic() {
  return and(eq(resources.status, "published"), eq(resources.access, "public"));
}

async function filesFor(scope: CourseScope, resourceIds: string[]) {
  if (resourceIds.length === 0) return new Map<string, ResourceFileView[]>();
  const rows = await getDb()
    .select({
      resourceId: resourceFiles.resourceId,
      role: resourceFiles.role,
      filename: resourceFiles.filename,
      contentType: resourceFiles.contentType,
      sizeBytes: resourceFiles.sizeBytes,
    })
    .from(resourceFiles)
    .where(and(eq(resourceFiles.courseId, scope.courseId), inArray(resourceFiles.resourceId, resourceIds)))
    .orderBy(asc(resourceFiles.role));
  const map = new Map<string, ResourceFileView[]>();
  for (const { resourceId, ...file } of rows) {
    map.set(resourceId, [...(map.get(resourceId) ?? []), file]);
  }
  return map;
}

const cardColumns = {
  id: resources.id,
  slug: resources.slug,
  title: resources.title,
  kind: resources.kind,
  descriptionMd: resources.descriptionMd,
  downloadable: resources.downloadable,
  topicTitle: topics.title,
};

export async function listResources(scope: CourseScope): Promise<ResourceCard[]> {
  const rows = await getDb()
    .select(cardColumns)
    .from(resources)
    .leftJoin(topics, and(eq(topics.courseId, resources.courseId), eq(topics.id, resources.topicId)))
    .where(and(eq(resources.courseId, scope.courseId), isPublic()))
    .orderBy(asc(resources.sortOrder), asc(resources.title));
  const files = await filesFor(
    scope,
    rows.map((r) => r.id),
  );
  return rows.map(({ id, ...card }) => ({ ...card, files: files.get(id) ?? [] }));
}

export async function getResource(scope: CourseScope, slug: string): Promise<ResourcePage | null> {
  if (!isValidSlug(slug)) return null;
  const db = getDb();
  const rows = await db
    .select(cardColumns)
    .from(resources)
    .leftJoin(topics, and(eq(topics.courseId, resources.courseId), eq(topics.id, resources.topicId)))
    .where(and(eq(resources.courseId, scope.courseId), eq(resources.slug, slug), isPublic()))
    .limit(1);
  const resource = rows[0];
  if (!resource) return null;
  const [files, lessonRows] = await Promise.all([
    filesFor(scope, [resource.id]),
    db
      .select({ slug: lessons.slug, title: lessons.title })
      .from(lessonResources)
      .innerJoin(lessons, and(eq(lessons.courseId, lessonResources.courseId), eq(lessons.id, lessonResources.lessonId)))
      .where(and(eq(lessonResources.courseId, scope.courseId), eq(lessonResources.resourceId, resource.id), lessonIsLive()))
      .orderBy(asc(lessons.sortOrder)),
  ]);
  const { id, ...card } = resource;
  return { ...card, files: files.get(id) ?? [], lessons: lessonRows };
}

/** Public resources attached to one lecture, in the lecture's order. */
export async function listLessonResources(scope: CourseScope, lessonId: string): Promise<ResourceCard[]> {
  const rows = await getDb()
    .select(cardColumns)
    .from(lessonResources)
    .innerJoin(resources, and(eq(resources.courseId, lessonResources.courseId), eq(resources.id, lessonResources.resourceId)))
    .leftJoin(topics, and(eq(topics.courseId, resources.courseId), eq(topics.id, resources.topicId)))
    .where(and(eq(lessonResources.courseId, scope.courseId), eq(lessonResources.lessonId, lessonId), isPublic()))
    .orderBy(asc(lessonResources.sortOrder));
  const files = await filesFor(
    scope,
    rows.map((r) => r.id),
  );
  return rows.map(({ id, ...card }) => ({ ...card, files: files.get(id) ?? [] }));
}

/** The R2 object behind a public resource's original or preview file, or null. */
export async function getPublicResourceFile(
  scope: CourseScope,
  slug: string,
  role: FileRole,
): Promise<{ r2Key: string; filename: string; contentType: string; sizeBytes: number; downloadable: boolean } | null> {
  if (!isValidSlug(slug)) return null;
  const rows = await getDb()
    .select({
      r2Key: resourceFiles.r2Key,
      filename: resourceFiles.filename,
      contentType: resourceFiles.contentType,
      sizeBytes: resourceFiles.sizeBytes,
      downloadable: resources.downloadable,
    })
    .from(resourceFiles)
    .innerJoin(resources, and(eq(resources.courseId, resourceFiles.courseId), eq(resources.id, resourceFiles.resourceId)))
    .where(
      and(eq(resourceFiles.courseId, scope.courseId), eq(resources.slug, slug), eq(resourceFiles.role, role), isPublic()),
    )
    .limit(1);
  return rows[0] ?? null;
}
