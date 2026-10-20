// Email + password sign-in for everyone: staff, and students (Phase 5). Staff
// get a staff session (short, good for the admin); student-only accounts get a
// student session (longer, never good for the admin).
//
// Order matters: rate limits and Turnstile come before any password work, the
// same generic message is shown for a wrong email and a wrong password, and an
// unknown email still spends the time of a real password check.
import { getBindings } from "@/server/platform/env";
import { passesTurnstile } from "@/server/platform/turnstile";
import { canOpenAdmin } from "@/lib/auth/permissions";
import { burnPasswordCheck, hashPassword, verifyPassword } from "@/lib/auth/password";
import { auditStatement } from "@/server/admin/audit";
import { SIGN_IN_LIMITS, clearLimit, limitedUntil, recordFailure, signInKeys } from "./rate-limit";
import { createSession, loadStaff } from "./sessions";

export type SignInResult =
  | { ok: true; token: string; expiresAt: number; userId: string; isStaff: boolean }
  | { ok: false; error: string; retryAt?: number };

const WRONG = "That email and password don't match an account. Check them and try again.";

export async function signIn(input: {
  email: unknown;
  password: unknown;
  turnstileToken: unknown;
  ip: string | null;
  userAgent: string | null;
  now?: number;
}): Promise<SignInResult> {
  const now = input.now ?? Date.now();
  const email = typeof input.email === "string" ? input.email.trim() : "";
  const password = typeof input.password === "string" ? input.password : "";
  if (!email || !password || email.length > 254 || password.length > 1000) return { ok: false, error: "Enter your email and password." };

  const keys = await signInKeys(email, input.ip);
  const waits = await Promise.all([
    limitedUntil(keys.account, SIGN_IN_LIMITS.perAccount, now),
    keys.address ? limitedUntil(keys.address, SIGN_IN_LIMITS.perAddress, now) : null,
  ]);
  const retryAt = Math.max(...waits.map((w) => w ?? 0));
  if (retryAt > now) {
    const minutes = Math.ceil((retryAt - now) / 60_000);
    return { ok: false, retryAt, error: `Too many attempts. Wait ${minutes} minute${minutes === 1 ? "" : "s"} and try again.` };
  }
  if (!(await passesTurnstile(input.turnstileToken, input.ip))) {
    return { ok: false, error: "The security check didn't pass. Reload the page and try again." };
  }

  const { db } = getBindings();
  const account = await db
    .prepare(
      `SELECT u.id, a.id AS accountId, a.password FROM users u
         JOIN accounts a ON a.user_id = u.id AND a.provider_id = 'credential'
        WHERE u.email = ? AND u.status = 'active'`,
    )
    .bind(email)
    .first<{ id: string; accountId: string; password: string | null }>();

  const check = account?.password ? await verifyPassword(password, account.password) : (await burnPasswordCheck(password), null);
  if (!account || !check?.ok) {
    await recordFailure(keys.account, SIGN_IN_LIMITS.perAccount, now);
    if (keys.address) await recordFailure(keys.address, SIGN_IN_LIMITS.perAddress, now);
    return { ok: false, error: WRONG };
  }

  const staff = await loadStaff(account.id);
  if (!staff) return { ok: false, error: WRONG };
  const isStaff = canOpenAdmin(staff);

  await clearLimit(keys.account);
  if (check.needsRehash) {
    await db
      .prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE id = ?")
      .bind(await hashPassword(password), now, account.accountId)
      .run();
  }
  const session = await createSession(account.id, { ip: input.ip, userAgent: input.userAgent }, now, isStaff ? "staff" : "student");
  // The audit log is the admin's record: staff sign-ins only.
  if (isStaff) {
    await auditStatement({ actorId: account.id, courseId: null, action: "auth.sign_in", entityType: "user", entityId: account.id, ip: input.ip }, now).run();
  }
  return { ok: true, token: session.token, expiresAt: session.expiresAt, userId: account.id, isStaff };
}
