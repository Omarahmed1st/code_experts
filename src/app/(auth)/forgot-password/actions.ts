"use server";

import { cookies } from "next/headers";
import { safeNextPath, sessionCookieOptions } from "@/lib/auth/session-token";
import { cookieIsSecure, currentCookieName, requestMeta } from "@/server/auth/request";
import { recoverWithCode } from "@/server/students/accounts";

export interface RecoverState {
  error: string | null;
  fieldErrors: Record<string, string>;
  email: string;
  done: { recoveryCode: string; next: string } | null;
}

export async function recoverAction(_previous: RecoverState, form: FormData): Promise<RecoverState> {
  const email = String(form.get("email") ?? "");
  const meta = await requestMeta();
  const result = await recoverWithCode({
    email,
    code: form.get("code"),
    password: form.get("password"),
    turnstileToken: form.get("cf-turnstile-response"),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors ?? {}, email, done: null };
  (await cookies()).set(currentCookieName(), result.value.token, sessionCookieOptions(cookieIsSecure(), result.value.expiresAt));
  return { error: null, fieldErrors: {}, email, done: { recoveryCode: result.value.recoveryCode, next: safeNextPath(form.get("next"), "/dashboard") } };
}
