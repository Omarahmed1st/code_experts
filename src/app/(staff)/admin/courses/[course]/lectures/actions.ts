"use server";

import type { LessonStatus } from "@/lib/admin/lesson-draft";
import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { deleteLesson, reorderLessons, restoreLessonRevision, saveLesson, setLessonStatus } from "@/server/admin/lessons";
import { saveSeo } from "@/server/admin/seo";
import { getBindings } from "@/server/platform/env";

export async function saveLessonAction(courseSlug: string, id: string | null, draft: unknown) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveLesson(ctx.actor, ctx.course, id, draft);
}

export async function setLessonStatusAction(courseSlug: string, id: string, status: LessonStatus, publishAt: number | null) {
  const ctx = await courseActor(courseSlug, "publish");
  if (!ctx) return fail(NO_PERMISSION);
  return setLessonStatus(ctx.actor, ctx.course, id, status, publishAt);
}

export async function reorderLessonsAction(courseSlug: string, ids: string[]) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return reorderLessons(ctx.actor, ctx.course, ids);
}

export async function deleteLessonAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteLesson(ctx.actor, ctx.course, id);
}

export async function restoreLessonAction(courseSlug: string, id: string, revisionNo: number) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return restoreLessonRevision(ctx.actor, ctx.course, id, revisionNo);
}

/** Search-engine title and description for a lecture, stored by its current address. */
export async function saveLessonSeoAction(courseSlug: string, id: string, raw: Record<string, unknown>) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  const lesson = await getBindings().db.prepare("SELECT slug FROM lessons WHERE course_id = ? AND id = ?").bind(ctx.course.id, id).first<{ slug: string }>();
  if (!lesson) return fail("Save the lecture first.");
  return saveSeo(ctx.actor, ctx.course, `/courses/${ctx.course.slug}/lectures/${lesson.slug}`, raw);
}
