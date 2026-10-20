"use server";

import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { deleteResource, removeResourceFile, saveResource } from "@/server/admin/resources";

export async function saveResourceAction(courseSlug: string, id: string | null, raw: Record<string, unknown>) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveResource(ctx.actor, ctx.course, id, raw);
}

export async function removeResourceFileAction(courseSlug: string, id: string, role: "original" | "preview") {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  if (role !== "original" && role !== "preview") return fail("Unknown file.");
  return removeResourceFile(ctx.actor, ctx.course, id, role);
}

export async function deleteResourceAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteResource(ctx.actor, ctx.course, id);
}
