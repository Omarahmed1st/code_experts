// The signed-in account for API route handlers, read from the request's own
// Cookie header. Route handlers get the Request, so they don't need
// next/headers, and the tests can call them directly with a cookie.
import type { Staff } from "@/lib/auth/permissions";
import { looksLikeToken, sessionCookieName } from "@/lib/auth/session-token";
import { getConfig } from "@/server/platform/env";
import { findSession, loadStaff } from "./sessions";

export interface RequestAccount extends Staff {
  sessionId: string;
  /** Made with the longer student rules (sessions.idle_ms set). */
  studentSession: boolean;
}

/** The session cookie's name here (__Host- prefixed everywhere except local development over http). */
export function sessionCookieForEnv(): string {
  return sessionCookieName(getConfig().appEnv !== "local");
}

export function sessionTokenOf(request: Request): string | null {
  const name = sessionCookieForEnv();
  for (const part of (request.headers.get("Cookie") ?? "").split(";")) {
    const at = part.indexOf("=");
    if (at > 0 && part.slice(0, at).trim() === name) {
      const value = part.slice(at + 1).trim();
      return looksLikeToken(value) ? value : null;
    }
  }
  return null;
}

/** The account signed in on this request (any role, students included), or null. */
export async function accountFromRequest(request: Request): Promise<RequestAccount | null> {
  const token = sessionTokenOf(request);
  if (!token) return null;
  const session = await findSession(token);
  if (!session) return null;
  const staff = await loadStaff(session.userId);
  return staff ? { ...staff, sessionId: session.id, studentSession: session.idleMs !== null } : null;
}

/** A Set-Cookie value that removes the session cookie. */
export function clearSessionCookie(): string {
  const secure = getConfig().appEnv !== "local";
  return `${sessionCookieForEnv()}=; Path=/; Max-Age=0; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}`;
}
