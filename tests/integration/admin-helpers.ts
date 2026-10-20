// Staff accounts and course lookups for the admin service tests.
import { env } from "cloudflare:workers";
import type { CourseRole, SiteRole, Staff } from "@/lib/auth/permissions";
import type { Actor } from "@/server/admin/context";
import { type AdminCourse, getAdminCourse } from "@/server/admin/courses";

export const CPP = "programming-fundamentals";
export const PY = "programming-applications";
export const CV = "computer-vision";

/** Adds a staff account (users + user_roles + course_staff) and returns it as an Actor. */
export async function makeStaff(
  id: string,
  siteRole: SiteRole,
  courseRoles: Record<string, CourseRole> = {},
): Promise<Actor> {
  const db = env.DB;
  await db.batch([
    db.prepare("INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)").bind(id, `${id}@example.com`, id),
    db.prepare("INSERT OR IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)").bind(id, siteRole),
    ...Object.entries(courseRoles).map(([courseId, role]) =>
      db.prepare("INSERT OR IGNORE INTO course_staff (course_id, user_id, role) VALUES (?, ?, ?)").bind(courseId, id, role),
    ),
  ]);
  const staff: Staff = { id, email: `${id}@example.com`, name: id, siteRoles: [siteRole], courseRoles };
  return { staff, ip: "203.0.113.9" };
}

export async function course(slug: string): Promise<AdminCourse> {
  const found = await getAdminCourse(slug);
  if (!found) throw new Error(`no course ${slug}`);
  return found;
}

export async function lessonIdBySlug(courseId: string, slug: string): Promise<string> {
  const row = await env.DB.prepare("SELECT id FROM lessons WHERE course_id = ? AND slug = ?").bind(courseId, slug).first<{ id: string }>();
  if (!row) throw new Error(`no lesson ${slug}`);
  return row.id;
}

export async function auditActions(courseId: string): Promise<string[]> {
  const { results } = await env.DB.prepare("SELECT action FROM admin_audit_logs WHERE course_id = ? ORDER BY created_at, rowid").bind(courseId).all<{ action: string }>();
  return results.map((r) => r.action);
}
