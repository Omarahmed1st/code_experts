"use server";

// Server actions for the site-wide admin pages: courses, staff accounts and
// the signed-in person's own account. Each resolves the actor from the session;
// the services check what that person may do.
import { staffActor } from "@/server/admin/actor";
import { fail } from "@/server/admin/context";
import { createCourse, reorderCourses } from "@/server/admin/course-settings";
import {
  changeOwnPassword,
  createStaff,
  endOwnSession,
  resetStaffPassword,
  setStaffActive,
  signOutOtherDevices,
  signOutStaffEverywhere,
  updateStaff,
} from "@/server/admin/users";

const SIGNED_OUT = "Your session has ended. Sign in again.";

export async function createCourseAction(raw: Record<string, unknown>) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return createCourse(ctx.actor, raw);
}

export async function reorderCoursesAction(ids: string[]) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return reorderCourses(ctx.actor, ids);
}

export async function createStaffAction(raw: Record<string, unknown>) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return createStaff(ctx.actor, raw);
}

export async function updateStaffAction(userId: string, raw: Record<string, unknown>) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return updateStaff(ctx.actor, String(userId), raw);
}

export async function setStaffActiveAction(userId: string, active: boolean) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return setStaffActive(ctx.actor, String(userId), active === true);
}

export async function resetStaffPasswordAction(userId: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return resetStaffPassword(ctx.actor, String(userId));
}

export async function signOutStaffAction(userId: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return signOutStaffEverywhere(ctx.actor, String(userId));
}

export async function changePasswordAction(raw: Record<string, unknown>) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return changeOwnPassword(ctx.actor, ctx.sessionId, raw);
}

export async function endSessionAction(sessionId: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  if (sessionId === ctx.sessionId) return fail("Use “Sign out” to end this session.");
  return endOwnSession(ctx.actor, String(sessionId));
}

export async function signOutOtherDevicesAction() {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return signOutOtherDevices(ctx.actor, ctx.sessionId);
}
