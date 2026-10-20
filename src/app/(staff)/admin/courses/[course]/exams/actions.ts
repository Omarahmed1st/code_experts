"use server";

import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { deleteExam, saveExam } from "@/server/admin/exams";

export async function saveExamAction(courseSlug: string, id: string | null, draft: unknown) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveExam(ctx.actor, ctx.course, id, draft);
}

export async function deleteExamAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteExam(ctx.actor, ctx.course, id);
}
