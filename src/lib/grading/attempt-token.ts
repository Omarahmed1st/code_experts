// A signed record of one quiz or exam attempt, held by the student's browser.
//
// Students don't have accounts yet (Phase 5), so an attempt isn't stored in
// D1. Instead the server signs which questions were given, in which order,
// with what points, and when time runs out. Submitting sends the token back:
// the server checks the signature and the deadline before grading, so the
// browser can't swap questions or extend the timer. Once accounts exist, the
// same claims are written to quiz_attempts / exam_attempts.
//
// Format: base64url(JSON claims) "." base64url(HMAC-SHA-256 of that text).

export interface AttemptClaims {
  v: 1;
  /** custom: an exam the student put together from topics they chose. */
  kind: "quiz" | "exam" | "custom";
  courseId: string;
  /** The quiz id or exam template id ("custom" for a custom exam). */
  refId: string;
  /** Exercise ids in the order the student sees them. */
  questions: string[];
  /** Points for each question, same order. */
  points: number[];
  startedAt: number;
  /** null: no time limit. */
  deadlineAt: number | null;
  nonce: string;
  /** Custom exams only (quizzes and exams read these from the database). */
  custom?: { title: string; feedback: "immediate" | "after_submit"; passThreshold: number };
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (text.length % 4)) % 4));
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}

async function key(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export function newNonce(): string {
  return toBase64Url(crypto.getRandomValues(new Uint8Array(12)));
}

export async function signAttempt(claims: AttemptClaims, secret: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(claims)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

function isCustom(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.title === "string" &&
    (c.feedback === "immediate" || c.feedback === "after_submit") &&
    typeof c.passThreshold === "number" &&
    c.passThreshold >= 0 &&
    c.passThreshold <= 100
  );
}

function isClaims(value: unknown): value is AttemptClaims {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  return (
    c.v === 1 &&
    (c.kind === "quiz" || c.kind === "exam" || c.kind === "custom") &&
    typeof c.courseId === "string" &&
    typeof c.refId === "string" &&
    Array.isArray(c.questions) &&
    c.questions.every((q) => typeof q === "string") &&
    Array.isArray(c.points) &&
    c.points.length === c.questions.length &&
    c.points.every((p) => Number.isInteger(p) && (p as number) > 0) &&
    typeof c.startedAt === "number" &&
    (c.deadlineAt === null || typeof c.deadlineAt === "number") &&
    typeof c.nonce === "string" &&
    (c.kind === "custom") === (c.custom !== undefined) &&
    (c.custom === undefined || isCustom(c.custom))
  );
}

/** The claims, or null when the token is malformed or its signature is wrong. */
export async function verifyAttempt(token: string, secret: string): Promise<AttemptClaims | null> {
  if (typeof token !== "string" || token.length > 8192) return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  const signature = fromBase64Url(sig);
  const bodyBytes = fromBase64Url(body);
  if (!signature || !bodyBytes) return null;
  const ok = await crypto.subtle.verify("HMAC", await key(secret), signature, encoder.encode(body));
  if (!ok) return null;
  try {
    const claims: unknown = JSON.parse(new TextDecoder().decode(bodyBytes));
    return isClaims(claims) ? claims : null;
  } catch {
    return null;
  }
}

/** Submissions are accepted this long after the deadline (slow networks, the auto-submit at 0:00). */
export const DEADLINE_GRACE_MS = 60_000;

export function isPastDeadline(claims: AttemptClaims, now: number): boolean {
  return claims.deadlineAt !== null && now > claims.deadlineAt + DEADLINE_GRACE_MS;
}
