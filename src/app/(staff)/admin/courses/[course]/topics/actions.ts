"use server";

import { NO_PERMISSION, fail } from "@/server/admin/context";
import { courseActor } from "@/server/admin/actor";
import { deleteTopic, reorderTopics, saveTopic } from "@/server/admin/topics";

export async function saveTopicAction(courseSlug: string, id: string | null, raw: Record<string, unknown>) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveTopic(ctx.actor, ctx.course, id, raw);
}

export async function reorderTopicsAction(courseSlug: string, ids: string[]) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return reorderTopics(ctx.actor, ctx.course, ids);
}

export async function deleteTopicAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteTopic(ctx.actor, ctx.course, id);
}
