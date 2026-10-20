"use server";

// Student accounts (administrators only). Each action resolves the actor from
// the session; the service checks that it is an administrator.
import { staffActor } from "@/server/admin/actor";
import { fail } from "@/server/admin/context";
import { deleteStudent, resetStudentPassword, setStudentActive } from "@/server/admin/students";

const SIGNED_OUT = "Your session has ended. Sign in again.";

export async function setStudentActiveAction(userId: string, active: boolean) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return setStudentActive(ctx.actor, userId, active);
}

export async function resetStudentPasswordAction(userId: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return resetStudentPassword(ctx.actor, userId);
}

export async function deleteStudentAction(userId: string, confirmEmail: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return deleteStudent(ctx.actor, userId, String(confirmEmail ?? ""));
}
