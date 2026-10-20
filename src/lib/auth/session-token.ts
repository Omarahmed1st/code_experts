// Session tokens and the session cookie. Pure Web Crypto, so it runs in
// Workers and in Node tests alike.
//
// The cookie holds 32 random bytes (base64url). The database stores only the
// SHA-256 of it, so a copy of the database can't be used to sign in.

export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // signed out after 7 days, whatever happens
export const SESSION_IDLE_MS = 12 * 60 * 60 * 1000; // ...or after 12 hours without using the site
export const SESSION_TOUCH_MS = 10 * 60 * 1000; // "last used" is written at most every 10 minutes

// Student-only accounts (Phase 5) hold nothing but their own progress, so their
// sessions last longer: signed out after 30 days, or after 7 days unused. Staff
// keep the rules above, and the admin refuses a session made with these.
export const STUDENT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const STUDENT_SESSION_IDLE_MS = 7 * 24 * 60 * 60 * 1000;

/** On HTTPS the __Host- prefix makes the browser refuse the cookie unless it is Secure, host-only and Path=/. */
export function sessionCookieName(secure: boolean): string {
  return secure ? "__Host-ce_session" : "ce_session";
}

export function newSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return base64url(bytes);
}

export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Session tokens are 43 base64url characters; anything else is not ours. */
export function looksLikeToken(value: string | undefined | null): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);
}

function base64url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export interface CookieOptions {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: "/";
  maxAge: number;
}

export function sessionCookieOptions(secure: boolean, expiresAt: number, now = Date.now()): CookieOptions {
  return { httpOnly: true, secure, sameSite: "lax", path: "/", maxAge: Math.max(0, Math.floor((expiresAt - now) / 1000)) };
}

/** Pages that make no sense right after signing in (they would loop or sign out again). */
const NOT_AFTER_SIGN_IN = ["/login", "/register", "/forgot-password"];

/** Where to go after signing in: only paths on this site, never another origin. */
export function safeNextPath(next: unknown, fallback = "/admin"): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  if (next.length > 300 || [...next].some((ch) => ch.charCodeAt(0) < 32)) return fallback;
  if (NOT_AFTER_SIGN_IN.some((p) => next === p || next.startsWith(`${p}?`))) return fallback;
  return next;
}

