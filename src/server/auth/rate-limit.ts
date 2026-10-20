// Fixed-window counters in D1 (table rate_limits, migration 0004) that slow down
// password guessing: a few failures per account and more per network address
// within 15 minutes, then sign-in waits until the window ends.
import { getBindings } from "@/server/platform/env";
import { hashToken } from "@/lib/auth/session-token";

export interface LimitRule {
  max: number;
  windowMs: number;
}

export const SIGN_IN_LIMITS = {
  perAccount: { max: 5, windowMs: 15 * 60 * 1000 },
  perAddress: { max: 30, windowMs: 15 * 60 * 1000 },
} satisfies Record<string, LimitRule>;

/** Keys for one sign-in: the email is hashed so the table never holds addresses. */
export async function signInKeys(email: string, ip: string | null): Promise<{ account: string; address: string | null }> {
  return {
    account: `login:email:${await hashToken(email.trim().toLowerCase())}`,
    address: ip ? `login:ip:${ip.slice(0, 64)}` : null,
  };
}

/** When the key may try again (ms), or null if it isn't limited now. */
export async function limitedUntil(key: string, rule: LimitRule, now = Date.now()): Promise<number | null> {
  const row = await getBindings()
    .db.prepare("SELECT window_start AS windowStart, count FROM rate_limits WHERE key = ?")
    .bind(key)
    .first<{ windowStart: number; count: number }>();
  if (!row || row.windowStart + rule.windowMs <= now || row.count < rule.max) return null;
  return row.windowStart + rule.windowMs;
}

export async function recordFailure(key: string, rule: LimitRule, now = Date.now()): Promise<void> {
  const { db } = getBindings();
  const expired = now - rule.windowMs;
  await db.batch([
    db
      .prepare(
        `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
         ON CONFLICT (key) DO UPDATE SET
           count = CASE WHEN window_start <= ?3 THEN 1 ELSE count + 1 END,
           window_start = CASE WHEN window_start <= ?3 THEN ?2 ELSE window_start END`,
      )
      .bind(key, now, expired),
    // Housekeeping: forget windows that ended more than a day ago.
    db.prepare("DELETE FROM rate_limits WHERE window_start < ?").bind(now - 24 * 60 * 60 * 1000),
  ]);
}

export async function clearLimit(key: string): Promise<void> {
  await getBindings().db.prepare("DELETE FROM rate_limits WHERE key = ?").bind(key).run();
}
