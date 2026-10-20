// The contact form (Phase 6). Messages are stored in contact_messages and read
// by administrators at /admin/messages; nothing is emailed (there is no email
// provider). Spam protection: a hidden field that people never fill in, a
// minimum time on the page, a limit per network address, and Turnstile when
// its keys are set. Messages are kept until an administrator deletes them; the
// privacy policy says so.
import { newId } from "@/lib/ids";
import { type LimitRule, limitedUntil, recordFailure } from "@/server/auth/rate-limit";
import { getBindings } from "@/server/platform/env";
import { passesTurnstile } from "@/server/platform/turnstile";

export const CONTACT_LIMIT: LimitRule = { max: 5, windowMs: 60 * 60 * 1000 };
/** A form sent faster than this after the page loaded is treated as a bot. */
export const MIN_FILL_MS = 3000;

/** The time the form is shown, sent back with it (a bot that posts at once is ignored). */
export function formShownAt(): number {
  return Date.now();
}

export const CONTACT_SUBJECTS = [
  "A mistake in a lecture or question",
  "A question about a course",
  "My account or my data",
  "Privacy request",
  "Accessibility",
  "Something else",
] as const;

export interface ContactInput {
  name: unknown;
  email: unknown;
  subject: unknown;
  body: unknown;
  /** The hidden "website" field: real people leave it empty. */
  trap: unknown;
  /** When the form was shown (ms since epoch), from a hidden field. */
  shownAt: unknown;
  turnstileToken: unknown;
  ip: string | null;
}

export type ContactResult = { ok: true } | { ok: false; error: string; fieldErrors?: Record<string, string> };

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim().slice(0, max) : "");

export async function submitContact(input: ContactInput, now = Date.now()): Promise<ContactResult> {
  const name = clean(input.name, 120);
  const email = clean(input.email, 254).toLowerCase();
  const subject = clean(input.subject, 200);
  const body = clean(input.body, 5000);
  const errors: Record<string, string> = {};
  if (!name) errors.name = "Tell us your name (any name you like).";
  if (!/^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(email)) errors.email = "Enter an email address we can reply to.";
  if (!(CONTACT_SUBJECTS as readonly string[]).includes(subject)) errors.subject = "Choose what your message is about.";
  if (body.length < 10) errors.body = "Write at least a sentence (10 characters or more).";
  if (Object.keys(errors).length) return { ok: false, error: "Check the highlighted fields.", fieldErrors: errors };

  // Bots: pretend it worked, store nothing.
  const shownAt = Number(input.shownAt);
  if (typeof input.trap === "string" && input.trap.trim() !== "") return { ok: true };
  if (!Number.isFinite(shownAt) || now - shownAt < MIN_FILL_MS) return { ok: true };

  const key = input.ip ? `contact:ip:${input.ip.slice(0, 64)}` : null;
  if (key) {
    const until = await limitedUntil(key, CONTACT_LIMIT, now);
    if (until) return { ok: false, error: "Too many messages from this network in the last hour. Please try again later." };
  }
  if (!(await passesTurnstile(input.turnstileToken, input.ip))) {
    return { ok: false, error: "The security check didn't pass. Reload the page and try again." };
  }
  await getBindings()
    .db.prepare("INSERT INTO contact_messages (id, name, email, subject, body, status, created_at) VALUES (?, ?, ?, ?, ?, 'new', ?)")
    .bind(newId("msg"), name, email, subject, body, now)
    .run();
  if (key) await recordFailure(key, CONTACT_LIMIT, now);
  return { ok: true };
}
