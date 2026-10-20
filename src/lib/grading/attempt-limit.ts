// "N attempts, then a 24-hour lock" for quizzes with max_attempts, and the
// guest's "last model" cookie for quizzes with several models.
//
// Since Phase 5 a limited quiz needs a student account and the attempts are
// counted per student in quiz_attempts (src/server/students/attempts.ts);
// tryStatus() turns those start times into the lock. The signed tries cookie
// below (triesCookie / recentTries) was the Phase 3 per-browser count; the
// quiz API no longer sets or reads it.

export const LOCK_WINDOW_MS = 24 * 60 * 60 * 1000;

const encoder = new TextEncoder();

async function hmac(text: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(text)));
  let bin = "";
  for (const b of sig) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function cookieName(quizId: string): string {
  return `ce_tries_${quizId.replace(/[^A-Za-z0-9_]/g, "")}`;
}

function readCookie(header: string | null, name: string): string | null {
  for (const part of (header ?? "").split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

/** Start times (ms) of this quiz's attempts in the last 24 hours, from a valid cookie only. */
export async function recentTries(cookieHeader: string | null, quizId: string, now: number, secret: string): Promise<number[]> {
  const raw = readCookie(cookieHeader, cookieName(quizId));
  if (!raw) return [];
  const [list, sig] = raw.split(".");
  if (!list || !sig || !/^[0-9-]+$/.test(list)) return [];
  if ((await hmac(`${quizId}:${list}`, secret)) !== sig) return [];
  return list
    .split("-")
    .map(Number)
    .filter((t) => Number.isSafeInteger(t) && t <= now + 60_000 && now - t < LOCK_WINDOW_MS)
    .sort((a, b) => a - b);
}

export interface TryStatus {
  maxAttempts: number;
  used: number;
  /** When the next attempt becomes possible, if the student is locked out now. */
  unlockAt: number | null;
}

export function tryStatus(tries: number[], maxAttempts: number): TryStatus {
  const used = tries.length;
  const oldest = tries[used - maxAttempts];
  return { maxAttempts, used, unlockAt: used >= maxAttempts && oldest !== undefined ? oldest + LOCK_WINDOW_MS : null };
}

/** The Set-Cookie value recording one more attempt. */
export async function triesCookie(tries: number[], quizId: string, path: string, secure: boolean, secret: string): Promise<string> {
  const list = tries.join("-");
  const sig = await hmac(`${quizId}:${list}`, secret);
  return [
    `${cookieName(quizId)}=${list}.${sig}`,
    `Path=${path}`,
    `Max-Age=${Math.ceil(LOCK_WINDOW_MS / 1000)}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}

// Quizzes with several models: the model this browser got last, so the next
// attempt gets a different one. Not signed: changing it only changes which
// model is skipped, and the pick among the rest stays random.

const MODEL_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function modelCookieName(quizId: string): string {
  return `ce_model_${quizId.replace(/[^A-Za-z0-9_]/g, "")}`;
}

export function lastModel(cookieHeader: string | null, quizId: string): string | null {
  const raw = readCookie(cookieHeader, modelCookieName(quizId));
  return raw && /^[A-Z]$/.test(raw) ? raw : null;
}

export function modelCookie(label: string, quizId: string, path: string, secure: boolean): string {
  return [
    `${modelCookieName(quizId)}=${label}`,
    `Path=${path}`,
    `Max-Age=${MODEL_COOKIE_MAX_AGE}`,
    "HttpOnly",
    "SameSite=Strict",
    ...(secure ? ["Secure"] : []),
  ].join("; ");
}
