"use server";

import { cookies } from "next/headers";
import { safeNextPath, sessionCookieOptions } from "@/lib/auth/session-token";
import { cookieIsSecure, currentCookieName, requestMeta } from "@/server/auth/request";
import { registerStudent } from "@/server/students/accounts";

export interface SignUpState {
  error: string | null;
  fieldErrors: Record<string, string>;
  values: { email: string; name: string };
  /** Set once the account exists: shown once, then the student continues. */
  done: { recoveryCode: string; next: string } | null;
}

export async function signUpAction(_previous: SignUpState, form: FormData): Promise<SignUpState> {
  const values = { email: String(form.get("email") ?? ""), name: String(form.get("name") ?? "") };
  const meta = await requestMeta();
  const result = await registerStudent({
    email: values.email,
    name: values.name,
    password: form.get("password"),
    turnstileToken: form.get("cf-turnstile-response"),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  if (!result.ok) return { error: result.error, fieldErrors: result.fieldErrors ?? {}, values, done: null };
  (await cookies()).set(currentCookieName(), result.value.token, sessionCookieOptions(cookieIsSecure(), result.value.expiresAt));
  return { error: null, fieldErrors: {}, values, done: { recoveryCode: result.value.recoveryCode, next: safeNextPath(form.get("next"), "/dashboard") } };
}
