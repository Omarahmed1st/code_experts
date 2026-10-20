"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { looksLikeToken } from "@/lib/auth/session-token";
import { audit } from "@/server/admin/audit";
import { currentCookieName, requestMeta } from "@/server/auth/request";
import { deleteSessionByToken } from "@/server/auth/sessions";
import { getSignedIn } from "@/server/auth/staff";

export async function signOutAction(): Promise<void> {
  const jar = await cookies();
  const name = currentCookieName();
  const token = jar.get(name)?.value;
  const staff = await getSignedIn();
  if (looksLikeToken(token)) await deleteSessionByToken(token);
  if (staff) {
    await audit({ actorId: staff.id, courseId: null, action: "auth.sign_out", entityType: "user", entityId: staff.id, ip: (await requestMeta()).ip });
  }
  jar.delete(name);
  redirect("/login");
}
