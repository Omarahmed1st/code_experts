// Student accounts: sign up, recovery with a recovery code, and the student's
// own settings (name, password, recovery code, devices, deleting the account).
//
// Accounts are optional: every lecture and question stays open without one.
// An account only keeps the student's own progress. We ask for an email (to
// sign in), a display name and a password, nothing else: no phone number, no
// university id. There is no email sending yet, so emails aren't verified and
// password recovery uses a recovery code instead of a link.
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { canOpenAdmin } from "@/lib/auth/permissions";
import { newRecoveryCode, normalizeRecoveryCode, passwordChangeKey, recoveryKey } from "@/lib/auth/recovery-code";
import { hashToken } from "@/lib/auth/session-token";
import { newId } from "@/lib/ids";
import { SIGN_IN_LIMITS, type LimitRule, clearLimit, limitedUntil, recordFailure, signInKeys } from "@/server/auth/rate-limit";
import { createSession, deleteUserSessions, loadStaff } from "@/server/auth/sessions";
import { getBindings } from "@/server/platform/env";
import { passesTurnstile } from "@/server/platform/turnstile";

export type AccountResult<T = undefined> =
  | { ok: true; value: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string>; retryAt?: number };

const ok = <T>(value: T, message?: string): AccountResult<T> => ({ ok: true, value, ...(message ? { message } : {}) });
const fail = (error: string, fieldErrors?: Record<string, string>, retryAt?: number): { ok: false; error: string; fieldErrors?: Record<string, string>; retryAt?: number } => ({
  ok: false,
  error,
  ...(fieldErrors ? { fieldErrors } : {}),
  ...(retryAt ? { retryAt } : {}),
});
const CHECK = "Check the highlighted fields.";

/** New accounts from one network address: a classroom can sign up together, a script can't make hundreds. */
export const SIGN_UP_LIMIT: LimitRule = { max: 20, windowMs: 60 * 60 * 1000 };

export const NAME_MIN = 2;
export const NAME_MAX = 60;

export function cleanName(raw: unknown): string {
  return typeof raw === "string" ? raw.replace(/\s+/g, " ").trim() : "";
}

export function nameProblem(name: string): string | null {
  if (name.length < NAME_MIN || name.length > NAME_MAX) return `Enter a name of ${NAME_MIN} to ${NAME_MAX} characters. A first name is enough.`;
  if ([...name].some((ch) => ch.charCodeAt(0) < 32)) return "Use letters, spaces and simple punctuation.";
  return null;
}

export function cleanEmail(raw: unknown): string {
  return typeof raw === "string" ? raw.trim().toLowerCase() : "";
}

export function emailProblem(email: string): string | null {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254 ? null : "Enter a valid email address.";
}

function waitMessage(retryAt: number, now: number): string {
  const minutes = Math.ceil((retryAt - now) / 60_000);
  return `Too many attempts. Wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}

export interface SignedUp {
  userId: string;
  token: string;
  expiresAt: number;
  /** Shown once, never stored in plain text. */
  recoveryCode: string;
}

/** Creates a student account and signs it in. */
export async function registerStudent(input: {
  email: unknown;
  name: unknown;
  password: unknown;
  turnstileToken: unknown;
  ip: string | null;
  userAgent: string | null;
  now?: number;
}): Promise<AccountResult<SignedUp>> {
  const now = input.now ?? Date.now();
  const email = cleanEmail(input.email);
  const name = cleanName(input.name);
  const password = typeof input.password === "string" ? input.password : "";
  const errors: Record<string, string> = {};
  const e = emailProblem(email);
  if (e) errors.email = e;
  const n = nameProblem(name);
  if (n) errors.name = n;
  const p = passwordProblem(password, email);
  if (p) errors.password = p;
  if (Object.keys(errors).length) return fail(CHECK, errors);

  const addressKey = input.ip ? `signup:ip:${input.ip.slice(0, 64)}` : null;
  if (addressKey) {
    const until = await limitedUntil(addressKey, SIGN_UP_LIMIT, now);
    if (until) return fail(waitMessage(until, now), undefined, until);
  }
  if (!(await passesTurnstile(input.turnstileToken, input.ip))) {
    return fail("The security check didn't pass. Reload the page and try again.");
  }

  const { db } = getBindings();
  const taken = await db.prepare("SELECT 1 AS yes FROM users WHERE email = ?").bind(email).first();
  if (taken) {
    return fail(CHECK, { email: "There is already an account with this email. Sign in instead, or recover it with your recovery code." });
  }
  // Counted only when an account is really made, so typing mistakes don't use up the limit.
  if (addressKey) await recordFailure(addressKey, SIGN_UP_LIMIT, now);

  const userId = newId("usr");
  const recoveryCode = newRecoveryCode();
  try {
    await db.batch([
      db
        .prepare("INSERT INTO users (id, email, name, email_verified, status, created_at, updated_at) VALUES (?, ?, ?, 0, 'active', ?, ?)")
        .bind(userId, email, name, now, now),
      db
        .prepare("INSERT INTO accounts (id, user_id, provider_id, account_id, password, created_at, updated_at) VALUES (?, ?, 'credential', ?, ?, ?, ?)")
        .bind(newId("acc"), userId, userId, await hashPassword(password), now, now),
      db.prepare("INSERT INTO user_roles (user_id, role_id, created_at) VALUES (?, 'student', ?)").bind(userId, now),
      ...(await recoveryStatements(userId, recoveryCode, now)),
    ]);
  } catch (error) {
    // Two sign-ups for the same email at the same moment: the unique index decides.
    if (String(error).includes("UNIQUE")) return fail(CHECK, { email: "There is already an account with this email. Sign in instead." });
    throw error;
  }
  const session = await createSession(userId, { ip: input.ip, userAgent: input.userAgent }, now, "student");
  return ok({ userId, token: session.token, expiresAt: session.expiresAt, recoveryCode });
}

async function recoveryStatements(userId: string, code: string, now: number): Promise<D1PreparedStatement[]> {
  const { db } = getBindings();
  return [
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(recoveryKey(userId)),
    db
      .prepare("INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)")
      // Recovery codes don't expire; a new one replaces the old.
      .bind(newId("ver"), recoveryKey(userId), await hashToken(normalizeRecoveryCode(code)!), now + 100 * 365 * 24 * 60 * 60 * 1000, now, now),
  ];
}

function sameHash(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const NO_MATCH = "That email and recovery code don't match. Check both and try again.";

/**
 * "Forgot my password": email + recovery code + a new password. On success the
 * password changes, every device is signed out, this browser is signed in,
 * and a new recovery code replaces the used one.
 */
export async function recoverWithCode(input: {
  email: unknown;
  code: unknown;
  password: unknown;
  turnstileToken: unknown;
  ip: string | null;
  userAgent: string | null;
  now?: number;
}): Promise<AccountResult<SignedUp>> {
  const now = input.now ?? Date.now();
  const email = cleanEmail(input.email);
  const password = typeof input.password === "string" ? input.password : "";
  if (emailProblem(email)) return fail(CHECK, { email: "Enter the email you signed up with." });
  const code = normalizeRecoveryCode(input.code);
  if (!code) return fail(CHECK, { code: "A recovery code has 16 letters and digits, like ABCD-EFGH-JKMN-PQRS." });
  const problem = passwordProblem(password, email);
  if (problem) return fail(CHECK, { password: problem });

  // The same limits as signing in, with their own counters.
  const keys = await signInKeys(email, input.ip);
  const accountKey = keys.account.replace(/^login:/, "recover:");
  const addressKey = keys.address?.replace(/^login:/, "recover:") ?? null;
  const waits = await Promise.all([
    limitedUntil(accountKey, SIGN_IN_LIMITS.perAccount, now),
    addressKey ? limitedUntil(addressKey, SIGN_IN_LIMITS.perAddress, now) : null,
  ]);
  const retryAt = Math.max(...waits.map((w) => w ?? 0));
  if (retryAt > now) return fail(waitMessage(retryAt, now), undefined, retryAt);
  if (!(await passesTurnstile(input.turnstileToken, input.ip))) {
    return fail("The security check didn't pass. Reload the page and try again.");
  }

  const { db } = getBindings();
  const row = await db
    .prepare(
      `SELECT u.id, v.value AS codeHash FROM users u
         JOIN verifications v ON v.identifier = 'recovery:' || u.id
        WHERE u.email = ? AND u.status = 'active'`,
    )
    .bind(email)
    .first<{ id: string; codeHash: string }>();
  const given = await hashToken(code);
  const staff = row ? await loadStaff(row.id) : null;
  // Staff accounts are reset by an administrator, never with a code.
  if (!row || !staff || canOpenAdmin(staff) || !sameHash(given, row.codeHash)) {
    await recordFailure(accountKey, SIGN_IN_LIMITS.perAccount, now);
    if (addressKey) await recordFailure(addressKey, SIGN_IN_LIMITS.perAddress, now);
    return fail(NO_MATCH);
  }
  await clearLimit(accountKey);
  const recoveryCode = newRecoveryCode();
  await db.batch([
    db.prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'").bind(await hashPassword(password), now, row.id),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(row.id),
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(passwordChangeKey(row.id)),
    ...(await recoveryStatements(row.id, recoveryCode, now)),
  ]);
  const session = await createSession(row.id, { ip: input.ip, userAgent: input.userAgent }, now, "student");
  return ok({ userId: row.id, token: session.token, expiresAt: session.expiresAt, recoveryCode });
}

// ---------------------------------------------------------------------------
// The signed-in student's own account
// ---------------------------------------------------------------------------

export interface AccountView {
  id: string;
  email: string;
  name: string;
  createdAt: number;
  isStaff: boolean;
  hasRecoveryCode: boolean;
  mustChangePassword: boolean;
}

export async function getAccount(userId: string): Promise<AccountView | null> {
  const { db } = getBindings();
  const [user, flags] = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT id, email, name, created_at AS createdAt FROM users WHERE id = ? AND status = 'active'").bind(userId),
    db.prepare("SELECT identifier FROM verifications WHERE identifier IN (?, ?)").bind(recoveryKey(userId), passwordChangeKey(userId)),
  ]);
  const u = user?.results[0] as { id: string; email: string; name: string; createdAt: number } | undefined;
  if (!u) return null;
  const ids = new Set((flags?.results ?? []).map((r) => r.identifier as string));
  const staff = await loadStaff(userId);
  return {
    ...u,
    isStaff: staff !== null && canOpenAdmin(staff),
    hasRecoveryCode: ids.has(recoveryKey(userId)),
    mustChangePassword: ids.has(passwordChangeKey(userId)),
  };
}

async function checkPassword(userId: string, password: unknown): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0 || password.length > 1000) return false;
  const account = await getBindings()
    .db.prepare("SELECT password FROM accounts WHERE user_id = ? AND provider_id = 'credential'")
    .bind(userId)
    .first<{ password: string | null }>();
  return account?.password ? (await verifyPassword(password, account.password)).ok : false;
}

export async function updateName(userId: string, raw: unknown): Promise<AccountResult> {
  const name = cleanName(raw);
  const problem = nameProblem(name);
  if (problem) return fail(CHECK, { name: problem });
  await getBindings().db.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?").bind(name, Date.now(), userId).run();
  return ok(undefined, "Name saved.");
}

/** Changes the password and signs out every other device. */
export async function changePassword(userId: string, email: string, sessionId: string, raw: Record<string, unknown>): Promise<AccountResult> {
  const current = typeof raw.currentPassword === "string" ? raw.currentPassword : "";
  const next = typeof raw.newPassword === "string" ? raw.newPassword : "";
  const again = typeof raw.confirmPassword === "string" ? raw.confirmPassword : "";
  if (!(await checkPassword(userId, current))) return fail(CHECK, { currentPassword: "That isn't your current password." });
  const problem = passwordProblem(next, email);
  if (problem) return fail(CHECK, { newPassword: problem });
  if (next !== again) return fail(CHECK, { confirmPassword: "The two new passwords are different." });
  if (next === current) return fail(CHECK, { newPassword: "Choose a password different from the current one." });
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'").bind(await hashPassword(next), now, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(userId, sessionId),
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(passwordChangeKey(userId)),
  ]);
  return ok(undefined, "Password changed. Your other devices were signed out.");
}

/** A new recovery code (the old one stops working). Needs the password. */
export async function replaceRecoveryCode(userId: string, password: unknown): Promise<AccountResult<{ recoveryCode: string }>> {
  const staff = await loadStaff(userId);
  if (!staff || canOpenAdmin(staff)) return fail("Staff accounts don't use recovery codes. An administrator can reset your password.");
  if (!(await checkPassword(userId, password))) return fail(CHECK, { password: "That isn't your password." });
  const code = newRecoveryCode();
  await getBindings().db.batch(await recoveryStatements(userId, code, Date.now()));
  return ok({ recoveryCode: code }, "New recovery code made. The old one no longer works.");
}

export async function endSession(userId: string, sessionId: string): Promise<AccountResult> {
  await getBindings().db.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?").bind(sessionId, userId).run();
  return ok(undefined, "That device was signed out.");
}

export async function endOtherSessions(userId: string, keepSessionId: string): Promise<AccountResult> {
  const n = await deleteUserSessions(userId, keepSessionId);
  return ok(undefined, n === 0 ? "You weren't signed in anywhere else." : n === 1 ? "Signed out of 1 other device." : `Signed out of ${n} other devices.`);
}

/**
 * Deletes the account and everything kept for it (progress, answers,
 * attempts, drafts, bookmarks, achievements, sessions): every student table
 * references users with ON DELETE CASCADE. Staff accounts are closed by an
 * administrator instead, so the audit log keeps its meaning.
 */
export async function deleteOwnAccount(userId: string, raw: Record<string, unknown>): Promise<AccountResult> {
  const staff = await loadStaff(userId);
  if (!staff) return fail("This account doesn't exist any more.");
  if (canOpenAdmin(staff)) return fail("Staff accounts can't be deleted here. Ask another administrator.");
  if (raw.confirm !== "DELETE") return fail(CHECK, { confirm: "Type DELETE in capitals to confirm." });
  if (!(await checkPassword(userId, raw.password))) return fail(CHECK, { password: "That isn't your password." });
  const { db } = getBindings();
  await db.batch([
    // verifications are keyed by text, not a foreign key, so they go by hand.
    db.prepare("DELETE FROM verifications WHERE identifier IN (?, ?)").bind(recoveryKey(userId), passwordChangeKey(userId)),
    db.prepare("DELETE FROM users WHERE id = ?").bind(userId),
  ]);
  return ok(undefined, "Your account and everything saved with it were deleted.");
}
