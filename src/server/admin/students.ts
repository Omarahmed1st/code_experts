// Student accounts in the admin (site administrators only): find a student,
// give them a temporary password when they lost both password and recovery
// code, disable or enable the account, or delete it with everything saved
// for it. Course staff never see individual students; they get the course's
// numbers on the Students tab instead (see student-analytics.ts).
import { isAdmin } from "@/lib/auth/permissions";
import { hashPassword } from "@/lib/auth/password";
import { passwordChangeKey, recoveryKey } from "@/lib/auth/recovery-code";
import { newId } from "@/lib/ids";
import { getBindings } from "@/server/platform/env";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, done, fail } from "./context";
import { temporaryPassword } from "./users";

export interface StudentRow {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled";
  createdAt: number;
  lastActive: number | null;
  answers: number;
  attempts: number;
  mustChangePassword: boolean;
}

export const STUDENT_PAGE_SIZE = 50;
const MANAGE_ONLY = "Only administrators can manage student accounts.";

/** A student: has the student role and no staff role. Staff are managed on the Staff accounts page. */
const IS_STUDENT = `EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_id = 'student')
  AND NOT EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_id IN ('admin', 'editor'))`;

export interface StudentList {
  rows: StudentRow[];
  total: number;
  page: number;
  pages: number;
}

/** Students matching a search (name or email, case-insensitive), newest first. */
export async function listStudents(actor: Actor, query: string, page = 1): Promise<StudentList> {
  if (!isAdmin(actor.staff)) return { rows: [], total: 0, page: 1, pages: 1 };
  const q = query.trim().toLowerCase().slice(0, 100);
  const like = `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const where = `u.status IN ('active', 'disabled') AND ${IS_STUDENT}${q ? " AND (lower(u.email) LIKE ?1 ESCAPE '\\' OR lower(u.name) LIKE ?1 ESCAPE '\\')" : ""}`;
  const { db } = getBindings();
  const count = await db
    .prepare(`SELECT count(*) AS n FROM users u WHERE ${where}`)
    .bind(...(q ? [like] : []))
    .first<{ n: number }>();
  const total = Number(count?.n ?? 0);
  const pages = Math.max(1, Math.ceil(total / STUDENT_PAGE_SIZE));
  const current = Math.min(Math.max(1, Math.floor(page) || 1), pages);
  const { results } = await db
    .prepare(
      `SELECT u.id, u.email, u.name, u.status, u.created_at AS createdAt,
              (SELECT max(updated_at) FROM sessions s WHERE s.user_id = u.id) AS lastActive,
              (SELECT count(*) FROM exercise_attempts a WHERE a.user_id = u.id) AS answers,
              (SELECT count(*) FROM quiz_attempts a WHERE a.user_id = u.id AND a.status = 'submitted')
                + (SELECT count(*) FROM exam_attempts a WHERE a.user_id = u.id AND a.status = 'submitted')
                + (SELECT count(*) FROM custom_exam_attempts a WHERE a.user_id = u.id AND a.status = 'submitted') AS attempts,
              EXISTS (SELECT 1 FROM verifications v WHERE v.identifier = 'password-change:' || u.id) AS mustChangePassword
         FROM users u WHERE ${where}
        ORDER BY u.created_at DESC LIMIT ${STUDENT_PAGE_SIZE} OFFSET ${(current - 1) * STUDENT_PAGE_SIZE}`,
    )
    .bind(...(q ? [like] : []))
    .all<Omit<StudentRow, "mustChangePassword"> & { mustChangePassword: number }>();
  return {
    rows: results.map((r) => ({ ...r, answers: Number(r.answers), attempts: Number(r.attempts), mustChangePassword: r.mustChangePassword === 1 })),
    total,
    page: current,
    pages,
  };
}

export async function countStudents(): Promise<{ total: number; newLast30Days: number }> {
  const since = Date.now() - 30 * 86_400_000;
  const row = await getBindings()
    .db.prepare(`SELECT count(*) AS total, coalesce(sum(u.created_at >= ?), 0) AS fresh FROM users u WHERE u.status IN ('active', 'disabled') AND ${IS_STUDENT}`)
    .bind(since)
    .first<{ total: number; fresh: number }>();
  return { total: Number(row?.total ?? 0), newLast30Days: Number(row?.fresh ?? 0) };
}

async function findStudent(userId: string): Promise<{ id: string; email: string; status: string } | null> {
  if (typeof userId !== "string" || userId.length > 100) return null;
  return getBindings()
    .db.prepare(`SELECT u.id, u.email, u.status FROM users u WHERE u.id = ? AND u.status IN ('active', 'disabled') AND ${IS_STUDENT}`)
    .bind(userId)
    .first<{ id: string; email: string; status: string }>();
}

/** Disabling signs the student out everywhere and stops them signing in; nothing is deleted. */
export async function setStudentActive(actor: Actor, userId: string, active: boolean): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  const student = await findStudent(userId);
  if (!student) return fail("This student account doesn't exist any more.");
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").bind(active ? "active" : "disabled", now, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: active ? "student.enable" : "student.disable", entityType: "student", entityId: userId, after: { email: student.email }, ip: actor.ip }, now),
  ]);
  return done(undefined, active ? "Account enabled." : "Account disabled and signed out everywhere.");
}

/**
 * For a student who lost both their password and their recovery code: a
 * temporary password, shown once, that the student is asked to change after
 * signing in. Check who is asking before you hand it over.
 */
export async function resetStudentPassword(actor: Actor, userId: string): Promise<AdminResult<{ temporaryPassword: string; email: string }>> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  const student = await findStudent(userId);
  if (!student) return fail("This student account doesn't exist any more.");
  if (student.status !== "active") return fail("Enable the account first.");
  const password = temporaryPassword();
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'").bind(await hashPassword(password), now, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(passwordChangeKey(userId)),
    db
      .prepare("INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (?, ?, 'temporary-password', ?, ?, ?)")
      .bind(newId("ver"), passwordChangeKey(userId), now + 365 * 86_400_000, now, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "student.reset_password", entityType: "student", entityId: userId, after: { email: student.email }, ip: actor.ip }, now),
  ]);
  return done({ temporaryPassword: password, email: student.email }, "Temporary password made. The student was signed out everywhere.");
}

/** Deletes the account and everything saved for it (every student table cascades from users). */
export async function deleteStudent(actor: Actor, userId: string, confirmEmail: string): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  const student = await findStudent(userId);
  if (!student) return fail("This student account doesn't exist any more.");
  if (confirmEmail.trim().toLowerCase() !== student.email.toLowerCase()) return fail("Type the student's email to confirm.", { confirm: "This doesn't match the student's email." });
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM verifications WHERE identifier IN (?, ?)").bind(recoveryKey(userId), passwordChangeKey(userId)),
    db.prepare("DELETE FROM users WHERE id = ?").bind(userId),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "student.delete", entityType: "student", entityId: userId, after: { email: student.email }, ip: actor.ip }, now),
  ]);
  return done(undefined, "The student's account and everything saved with it were deleted.");
}
