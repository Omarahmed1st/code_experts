"use server";

// The site's details (who runs it, contact email, verification tokens) and the
// contact inbox. Administrators only; the services check again and audit.
import { staffActor } from "@/server/admin/actor";
import { fail } from "@/server/admin/context";
import { deleteContactMessage, saveSiteOwner, setMessageStatus } from "@/server/admin/site";

const SIGNED_OUT = "Your session has ended. Sign in again.";

export async function saveSiteOwnerAction(input: Record<string, unknown>) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return saveSiteOwner(ctx.actor, input);
}

export async function setMessageStatusAction(id: string, status: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return setMessageStatus(ctx.actor, id, status);
}

export async function deleteMessageAction(id: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return deleteContactMessage(ctx.actor, id);
}
