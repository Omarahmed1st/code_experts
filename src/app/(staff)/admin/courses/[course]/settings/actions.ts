"use server";

import type { CourseStatus } from "@/server/admin/courses";
import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { deleteCourse, setCourseStatus, updateCourse } from "@/server/admin/course-settings";

export async function updateCourseAction(courseSlug: string, raw: Record<string, unknown>) {
  const ctx = await courseActor(courseSlug, "settings");
  if (!ctx) return fail(NO_PERMISSION);
  return updateCourse(ctx.actor, ctx.course, raw);
}

export async function setCourseStatusAction(courseSlug: string, status: CourseStatus) {
  const ctx = await courseActor(courseSlug, "settings");
  if (!ctx) return fail(NO_PERMISSION);
  if (!["draft", "published", "archived"].includes(status)) return fail("Unknown status.");
  return setCourseStatus(ctx.actor, ctx.course, status);
}

export async function deleteCourseAction(courseSlug: string, typedSlug: string) {
  const ctx = await courseActor(courseSlug, "settings");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteCourse(ctx.actor, ctx.course, String(typedSlug ?? ""));
}
