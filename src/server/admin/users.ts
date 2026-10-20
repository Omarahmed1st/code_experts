// Staff accounts (administrators and editors), managed by administrators, and
// each person's own account page (password, signed-in devices).
//
// There is no email sending yet, so a new account or a reset gets a temporary
// password that is shown once to the administrator, who passes it on. The
// account is then asked to choose its own password (verifications row
// "password-change:<user id>").
import { getRandomValues } from "node:crypto";
import { type CourseRole, isAdmin } from "@/lib/auth/permissions";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";
import { newId } from "@/lib/ids";
import { getBindings } from "@/server/platform/env";
import { deleteUserSessions } from "@/server/auth/sessions";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, done, fail, str } from "./context";

export interface StaffRow {
  id: string;
  email: string;
  name: string;
  status: "active" | "disabled" | "deleted";
  siteRole: "admin" | "editor";
  courseRoles: { courseId: string; courseTitle: string; role: CourseRole }[];
  lastSignIn: number | null;
  mustChangePassword: boolean;
}

const MANAGE_ONLY = "Only administrators can manage staff accounts.";
const changeKey = (userId: string) => `password-change:${userId}`;

export async function listStaff(): Promise<StaffRow[]> {
  const { db } = getBindings();
  const [users, courseRoles] = await db.batch<Record<string, unknown>>([
    db.prepare(
      `SELECT u.id, u.email, u.name, u.status,
              CASE WHEN EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_id = 'admin') THEN 'admin' ELSE 'editor' END AS siteRole,
              (SELECT max(created_at) FROM admin_audit_logs l WHERE l.actor_user_id = u.id AND l.action = 'auth.sign_in') AS lastSignIn,
              EXISTS (SELECT 1 FROM verifications v WHERE v.identifier = 'password-change:' || u.id) AS mustChangePassword
         FROM users u
        WHERE u.status <> 'deleted' AND EXISTS (SELECT 1 FROM user_roles r WHERE r.user_id = u.id AND r.role_id IN ('admin', 'editor'))
        ORDER BY siteRole, u.name, u.email`,
    ),
    db.prepare(
      `SELECT s.user_id AS userId, s.course_id AS courseId, c.short_title AS courseTitle, s.role FROM course_staff s JOIN courses c ON c.id = s.course_id
        ORDER BY c.sort_order`,
    ),
  ]);
  return (users?.results ?? []).map((u) => ({
    ...(u as unknown as StaffRow),
    mustChangePassword: u.mustChangePassword === 1,
    courseRoles: ((courseRoles?.results ?? []) as { userId: string; courseId: string; courseTitle: string; role: CourseRole }[])
      .filter((r) => r.userId === u.id)
      .map(({ courseId, courseTitle, role }) => ({ courseId, courseTitle, role })),
  }));
}

/** 16 letters and digits in groups of four, without look-alikes (0/O, 1/l/I): about 80 bits. */
export function temporaryPassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = getRandomValues(new Uint8Array(32));
  const chars: string[] = [];
  for (const b of bytes) {
    // Rejection sampling keeps every character equally likely.
    if (b < 256 - (256 % alphabet.length)) chars.push(alphabet[b % alphabet.length]!);
    if (chars.length === 16) break;
  }
  while (chars.length < 16) chars.push(alphabet[getRandomValues(new Uint8Array(1))[0]! % alphabet.length]!);
  return chars.join("").replace(/(.{4})(?=.)/g, "$1-");
}

interface StaffInput {
  name: string;
  email: string;
  siteRole: "admin" | "editor";
  courseRoles: Record<string, CourseRole>;
}

async function readStaff(raw: Record<string, unknown>): Promise<{ input: StaffInput; errors: Record<string, string> }> {
  const roles = (raw.courseRoles && typeof raw.courseRoles === "object" ? raw.courseRoles : {}) as Record<string, unknown>;
  const input: StaffInput = {
    name: str(raw.name, 200),
    email: str(raw.email, 300).toLowerCase(),
    siteRole: raw.siteRole === "admin" ? "admin" : "editor",
    courseRoles: Object.fromEntries(
      Object.entries(roles)
        .filter(([, r]) => r === "editor" || r === "course_admin")
        .map(([courseId, r]) => [courseId, r as CourseRole]),
    ),
  };
  const errors: Record<string, string> = {};
  if (input.name.length < 2 || input.name.length > 80) errors.name = "Enter their name (2 to 80 characters).";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email) || input.email.length > 254) errors.email = "Enter a valid email address.";
  if (input.siteRole === "editor" && Object.keys(input.courseRoles).length === 0) errors.courseRoles = "Choose at least one course for an editor.";
  const ids = Object.keys(input.courseRoles);
  if (ids.length) {
    const { results } = await getBindings()
      .db.prepare(`SELECT id FROM courses WHERE id IN (${ids.map(() => "?").join(", ")})`)
      .bind(...ids)
      .all<{ id: string }>();
    if (results.length !== ids.length) errors.courseRoles = "One of the courses doesn't exist any more. Reload the page.";
  }
  // Administrators can do everything everywhere; course roles only matter for editors.
  if (input.siteRole === "admin") input.courseRoles = {};
  return { input, errors };
}

function roleStatements(userId: string, input: StaffInput, grantedBy: string, now: number): D1PreparedStatement[] {
  const { db } = getBindings();
  return [
    db.prepare("DELETE FROM user_roles WHERE user_id = ? AND role_id IN ('admin', 'editor')").bind(userId),
    db.prepare("INSERT INTO user_roles (user_id, role_id, granted_by, created_at) VALUES (?, ?, ?, ?)").bind(userId, input.siteRole, grantedBy, now),
    db.prepare("DELETE FROM course_staff WHERE user_id = ?").bind(userId),
    ...Object.entries(input.courseRoles).map(([courseId, role]) =>
      db.prepare("INSERT INTO course_staff (course_id, user_id, role, created_at) VALUES (?, ?, ?, ?)").bind(courseId, userId, role, now),
    ),
  ];
}

function mustChangeStatements(userId: string, now: number): D1PreparedStatement[] {
  const { db } = getBindings();
  return [
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(changeKey(userId)),
    db
      .prepare("INSERT INTO verifications (id, identifier, value, expires_at, created_at, updated_at) VALUES (?, ?, 'temporary-password', ?, ?, ?)")
      .bind(newId("ver"), changeKey(userId), now + 365 * 24 * 60 * 60 * 1000, now, now),
  ];
}

export async function createStaff(actor: Actor, raw: Record<string, unknown>): Promise<AdminResult<{ id: string; email: string; temporaryPassword: string }>> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  const { input, errors } = await readStaff(raw);
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  const { db } = getBindings();
  const taken = await db.prepare("SELECT id, status FROM users WHERE email = ?").bind(input.email).first<{ id: string; status: string }>();
  if (taken) return fail("Check the highlighted fields.", { email: "There is already an account with this email." });
  const password = temporaryPassword();
  const userId = newId("usr");
  const now = Date.now();
  await db.batch([
    db.prepare("INSERT INTO users (id, email, name, email_verified, status, created_at, updated_at) VALUES (?, ?, ?, 0, 'active', ?, ?)").bind(userId, input.email, input.name, now, now),
    db
      .prepare("INSERT INTO accounts (id, user_id, provider_id, account_id, password, created_at, updated_at) VALUES (?, ?, 'credential', ?, ?, ?, ?)")
      .bind(newId("acc"), userId, userId, await hashPassword(password), now, now),
    ...roleStatements(userId, input, actor.staff.id, now),
    ...mustChangeStatements(userId, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.create", entityType: "user", entityId: userId, after: { email: input.email, name: input.name, role: input.siteRole, courses: Object.keys(input.courseRoles).length }, ip: actor.ip }, now),
  ]);
  return done({ id: userId, email: input.email, temporaryPassword: password }, "Account created.");
}

async function activeAdmins(): Promise<string[]> {
  const { results } = await getBindings()
    .db.prepare("SELECT u.id FROM users u JOIN user_roles r ON r.user_id = u.id AND r.role_id = 'admin' WHERE u.status = 'active'")
    .all<{ id: string }>();
  return results.map((r) => r.id);
}

async function findStaff(userId: string): Promise<StaffRow | null> {
  return (await listStaff()).find((s) => s.id === userId) ?? null;
}

export async function updateStaff(actor: Actor, userId: string, raw: Record<string, unknown>): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  const current = await findStaff(userId);
  if (!current) return fail("This account doesn't exist any more.");
  const { input, errors } = await readStaff({ ...raw, email: current.email });
  if (Object.keys(errors).length) return fail("Check the highlighted fields.", errors);
  if (current.siteRole === "admin" && input.siteRole !== "admin") {
    if (userId === actor.staff.id) return fail("You can't remove your own administrator role. Ask another administrator.");
    if ((await activeAdmins()).filter((id) => id !== userId).length === 0) return fail("This is the last administrator. Make someone else an administrator first.");
  }
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?").bind(input.name, now, userId),
    ...roleStatements(userId, input, actor.staff.id, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.update_roles", entityType: "user", entityId: userId, before: { role: current.siteRole, courses: current.courseRoles.map((c) => `${c.courseTitle}: ${c.role}`) }, after: { email: current.email, role: input.siteRole, courses: Object.keys(input.courseRoles).length }, ip: actor.ip }, now),
  ]);
  return done(undefined, "Account saved.");
}

/** Disabling signs the account out everywhere and stops it signing in; nothing is deleted. */
export async function setStaffActive(actor: Actor, userId: string, active: boolean): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  if (userId === actor.staff.id) return fail("You can't disable your own account.");
  const current = await findStaff(userId);
  if (!current) return fail("This account doesn't exist any more.");
  if (!active && current.siteRole === "admin" && (await activeAdmins()).filter((id) => id !== userId).length === 0) {
    return fail("This is the last administrator, so it can't be disabled.");
  }
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE users SET status = ?, updated_at = ? WHERE id = ?").bind(active ? "active" : "disabled", now, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: active ? "user.enable" : "user.disable", entityType: "user", entityId: userId, after: { email: current.email }, ip: actor.ip }, now),
  ]);
  return done(undefined, active ? "Account enabled." : "Account disabled and signed out everywhere.");
}

export async function resetStaffPassword(actor: Actor, userId: string): Promise<AdminResult<{ temporaryPassword: string }>> {
  if (!isAdmin(actor.staff)) return fail(MANAGE_ONLY);
  if (userId === actor.staff.id) return fail("Change your own password on the My account page.");
  const current = await findStaff(userId);
  if (!current) return fail("This account doesn't exist any more.");
  const password = temporaryPassword();
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE user_id = ? AND provider_id = 'credential'").bind(await hashPassword(password), now, userId),
    db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId),
    ...mustChangeStatements(userId, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.reset_password", entityType: "user", entityId: userId, after: { email: current.email }, ip: actor.ip }, now),
  ]);
  return done({ temporaryPassword: password }, "Password reset. They have been signed out everywhere.");
}

export async function signOutStaffEverywhere(actor: Actor, userId: string): Promise<AdminResult> {
  if (!isAdmin(actor.staff) && userId !== actor.staff.id) return fail(MANAGE_ONLY);
  const n = await deleteUserSessions(userId);
  await auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.sign_out_everywhere", entityType: "user", entityId: userId, after: { sessions: n }, ip: actor.ip }).run();
  return done(undefined, n === 1 ? "Signed out of 1 device." : `Signed out of ${n} devices.`);
}

// ---------------------------------------------------------------------------
// My account
// ---------------------------------------------------------------------------

export async function mustChangePassword(userId: string): Promise<boolean> {
  const row = await getBindings().db.prepare("SELECT 1 AS yes FROM verifications WHERE identifier = ?").bind(changeKey(userId)).first();
  return row !== null;
}

/** Changes the signed-in person's password and signs out their other devices. */
export async function changeOwnPassword(actor: Actor, sessionId: string, raw: Record<string, unknown>): Promise<AdminResult> {
  const currentPassword = typeof raw.currentPassword === "string" ? raw.currentPassword : "";
  const next = typeof raw.newPassword === "string" ? raw.newPassword : "";
  const again = typeof raw.confirmPassword === "string" ? raw.confirmPassword : "";
  const { db } = getBindings();
  const account = await db
    .prepare("SELECT id, password FROM accounts WHERE user_id = ? AND provider_id = 'credential'")
    .bind(actor.staff.id)
    .first<{ id: string; password: string | null }>();
  if (!account?.password || !(await verifyPassword(currentPassword, account.password)).ok) {
    return fail("Check the highlighted fields.", { currentPassword: "That isn't your current password." });
  }
  const problem = passwordProblem(next, actor.staff.email);
  if (problem) return fail("Check the highlighted fields.", { newPassword: problem });
  if (next !== again) return fail("Check the highlighted fields.", { confirmPassword: "The two new passwords are different." });
  if (next === currentPassword) return fail("Check the highlighted fields.", { newPassword: "Choose a password different from the current one." });
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE accounts SET password = ?, updated_at = ? WHERE id = ?").bind(await hashPassword(next), now, account.id),
    db.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?").bind(actor.staff.id, sessionId),
    db.prepare("DELETE FROM verifications WHERE identifier = ?").bind(changeKey(actor.staff.id)),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.change_password", entityType: "user", entityId: actor.staff.id, ip: actor.ip }, now),
  ]);
  return done(undefined, "Password changed. Your other devices were signed out.");
}

export async function endOwnSession(actor: Actor, sessionId: string): Promise<AdminResult> {
  await getBindings().db.prepare("DELETE FROM sessions WHERE id = ? AND user_id = ?").bind(sessionId, actor.staff.id).run();
  return done(undefined, "That device was signed out.");
}

/** Signs the person out on every device but this one. */
export async function signOutOtherDevices(actor: Actor, sessionId: string): Promise<AdminResult> {
  const n = await deleteUserSessions(actor.staff.id, sessionId);
  await auditStatement({ actorId: actor.staff.id, courseId: null, action: "user.sign_out_everywhere", entityType: "user", entityId: actor.staff.id, after: { sessions: n }, ip: actor.ip }).run();
  return done(undefined, n === 0 ? "You weren't signed in anywhere else." : n === 1 ? "Signed out of 1 other device." : `Signed out of ${n} other devices.`);
}
