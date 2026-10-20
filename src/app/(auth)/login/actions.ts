"use server";

import { cookies } from "next/headers";
import { safeNextPath, sessionCookieOptions } from "@/lib/auth/session-token";
import { cookieIsSecure, currentCookieName, requestMeta } from "@/server/auth/request";
import { signIn } from "@/server/auth/sign-in";

export interface SignInState {
  error: string | null;
  email: string;
  /** Set once signed in: where the form sends the browser next, with a full page load. */
  goTo?: string;
}

export async function signInAction(_previous: SignInState, form: FormData): Promise<SignInState> {
  const email = String(form.get("email") ?? "");
  const meta = await requestMeta();
  const result = await signIn({
    email,
    password: form.get("password"),
    turnstileToken: form.get("cf-turnstile-response"),
    ip: meta.ip,
    userAgent: meta.userAgent,
  });
  if (!result.ok) return { error: result.error, email };
  (await cookies()).set(currentCookieName(), result.token, sessionCookieOptions(cookieIsSecure(), result.expiresAt));
  // Staff land in the admin, students on their dashboard, unless the page sent them here with a place to return to.
  // The form loads that page in full (not redirect()), so the header and the course
  // marks ask again who is signed in instead of keeping what they knew before.
  return { error: null, email, goTo: safeNextPath(form.get("next"), result.isStaff ? "/admin" : "/dashboard") };
}
