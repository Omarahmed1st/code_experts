// Server-side sessions in D1 (table sessions). The browser holds a random token
// in an HttpOnly cookie; the database holds only its SHA-256, an absolute expiry
// and when it was last used. Staff: 7 days, signed out after 12 idle hours.
// Student-only accounts: 30 days, 7 idle days (sessions.idle_ms, migration 0005).
import { getBindings } from "@/server/platform/env";
import type { CourseRole, SiteRole, Staff } from "@/lib/auth/permissions";
import {
  SESSION_IDLE_MS,
  SESSION_TOUCH_MS,
  SESSION_TTL_MS,
  STUDENT_SESSION_IDLE_MS,
  STUDENT_SESSION_TTL_MS,
  hashToken,
  newSessionToken,
} from "@/lib/auth/session-token";
import { newId } from "@/lib/ids";

export interface SessionInfo {
  id: string;
  userId: string;
  expiresAt: number;
  /** null: the staff rule (SESSION_IDLE_MS). */
  idleMs: number | null;
}

/** "staff" for any account with a staff role, "student" for student-only accounts. */
export type SessionKind = "staff" | "student";

export async function createSession(
  userId: string,
  meta: { ip: string | null; userAgent: string | null },
  now = Date.now(),
  kind: SessionKind = "staff",
): Promise<{ token: string; expiresAt: number; sessionId: string }> {
  const { db } = getBindings();
  const token = newSessionToken();
  const sessionId = newId("ses");
  const expiresAt = now + (kind === "student" ? STUDENT_SESSION_TTL_MS : SESSION_TTL_MS);
  const idleMs = kind === "student" ? STUDENT_SESSION_IDLE_MS : null;
  await db.batch([
    // A fresh session every time someone signs in (never a session the browser brought).
    db
      .prepare(
        "INSERT INTO sessions (id, user_id, token, expires_at, ip_address, user_agent, created_at, updated_at, idle_ms) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      )
      .bind(sessionId, userId, await hashToken(token), expiresAt, meta.ip, meta.userAgent?.slice(0, 300) ?? null, now, now, idleMs),
    // Tidy up this account's old sessions.
    db
      .prepare("DELETE FROM sessions WHERE user_id = ? AND (expires_at <= ? OR updated_at + coalesce(idle_ms, ?) <= ?)")
      .bind(userId, now, SESSION_IDLE_MS, now),
  ]);
  return { token, expiresAt, sessionId };
}

/** The live session for a cookie token, or null. Expired or idle sessions are deleted. */
export async function findSession(token: string, now = Date.now()): Promise<SessionInfo | null> {
  const { db } = getBindings();
  const hash = await hashToken(token);
  const row = await db
    .prepare("SELECT id, user_id AS userId, expires_at AS expiresAt, updated_at AS lastUsed, idle_ms AS idleMs FROM sessions WHERE token = ?")
    .bind(hash)
    .first<{ id: string; userId: string; expiresAt: number; lastUsed: number; idleMs: number | null }>();
  if (!row) return null;
  if (row.expiresAt <= now || row.lastUsed + (row.idleMs ?? SESSION_IDLE_MS) <= now) {
    await db.prepare("DELETE FROM sessions WHERE id = ?").bind(row.id).run();
    return null;
  }
  if (now - row.lastUsed >= SESSION_TOUCH_MS) {
    await db.prepare("UPDATE sessions SET updated_at = ? WHERE id = ?").bind(now, row.id).run();
  }
  return { id: row.id, userId: row.userId, expiresAt: row.expiresAt, idleMs: row.idleMs };
}

/** An active account with its roles, or null (disabled, deleted or missing). */
export async function loadStaff(userId: string): Promise<Staff | null> {
  const { db } = getBindings();
  const [user, roles, courseRoles] = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT id, email, name FROM users WHERE id = ? AND status = 'active'").bind(userId),
    db.prepare("SELECT role_id AS role FROM user_roles WHERE user_id = ?").bind(userId),
    db.prepare("SELECT course_id AS courseId, role FROM course_staff WHERE user_id = ?").bind(userId),
  ]);
  const u = user?.results[0] as { id: string; email: string; name: string } | undefined;
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    siteRoles: (roles?.results ?? []).map((r) => r.role as SiteRole),
    courseRoles: Object.fromEntries((courseRoles?.results ?? []).map((r) => [r.courseId as string, r.role as CourseRole])),
  };
}

export async function deleteSessionByToken(token: string): Promise<void> {
  await getBindings().db.prepare("DELETE FROM sessions WHERE token = ?").bind(await hashToken(token)).run();
}

/** Signs an account out everywhere, optionally keeping one session (the one making the change). */
export async function deleteUserSessions(userId: string, keepSessionId: string | null = null): Promise<number> {
  const result = await getBindings()
    .db.prepare("DELETE FROM sessions WHERE user_id = ? AND id IS NOT ?")
    .bind(userId, keepSessionId)
    .run();
  return result.meta.changes ?? 0;
}

export interface SessionRow {
  id: string;
  createdAt: number;
  lastUsed: number;
  expiresAt: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export async function listUserSessions(userId: string, now = Date.now()): Promise<SessionRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT id, created_at AS createdAt, updated_at AS lastUsed, expires_at AS expiresAt, ip_address AS ipAddress, user_agent AS userAgent
         FROM sessions WHERE user_id = ? AND expires_at > ? AND updated_at + coalesce(idle_ms, ?) > ? ORDER BY updated_at DESC`,
    )
    .bind(userId, now, SESSION_IDLE_MS, now)
    .all<SessionRow>();
  return results;
}
