// The signed-in staff member for this request, and the guards every admin page
// and action calls. Checks happen here, on the server, every time; hiding a
// button is never the protection.
import { cache } from "react";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { type CourseAction, type SiteAction, type Staff, can, canOpenAdmin, canSite } from "@/lib/auth/permissions";
import { looksLikeToken } from "@/lib/auth/session-token";
import { type AdminCourse, getAdminCourse } from "@/server/admin/courses";
import { currentCookieName } from "./request";
import { findSession, loadStaff } from "./sessions";

export interface SignedIn extends Staff {
  sessionId: string;
  /** Made with the longer student rules (sessions.idle_ms set): never good for the admin. */
  studentSession: boolean;
}

/** The signed-in account (any role, students included), or null. Deduplicated per request. */
export const getSignedIn = cache(async (): Promise<SignedIn | null> => {
  const token = (await cookies()).get(currentCookieName())?.value;
  if (!looksLikeToken(token)) return null;
  const session = await findSession(token);
  if (!session) return null;
  const staff = await loadStaff(session.userId);
  return staff ? { ...staff, sessionId: session.id, studentSession: session.idleMs !== null } : null;
});

/** Staff signed in with a staff session (a student session never opens the admin). */
export function adminAllowed(signedIn: SignedIn | null): signedIn is SignedIn {
  return signedIn !== null && !signedIn.studentSession && canOpenAdmin(signedIn);
}

/** For admin pages: the staff member, or a redirect to sign-in (or a 404 for accounts without admin access). */
export async function requireStaff(returnTo = "/admin"): Promise<SignedIn> {
  const staff = await getSignedIn();
  if (!staff || (staff.studentSession && canOpenAdmin(staff))) redirect(`/login?next=${encodeURIComponent(returnTo)}`);
  if (!adminAllowed(staff)) notFound();
  return staff;
}

export async function requireSite(action: SiteAction, returnTo = "/admin"): Promise<SignedIn> {
  const staff = await requireStaff(returnTo);
  if (!canSite(staff, action)) notFound();
  return staff;
}

/**
 * A course the staff member may work on, in any status. A course they can't
 * open is a 404, so the admin doesn't reveal which other courses exist.
 */
export async function requireCourse(slug: string, action: CourseAction = "view"): Promise<{ staff: SignedIn; course: AdminCourse }> {
  const staff = await requireStaff(`/admin/courses/${encodeURIComponent(slug)}`);
  const course = await getAdminCourse(slug);
  if (!course || !can(staff, action, course.id)) notFound();
  return { staff, course };
}

/** For server actions: like requireCourse, but returns null instead of redirecting. */
export async function staffForCourse(slug: unknown, action: CourseAction): Promise<{ staff: SignedIn; course: AdminCourse } | null> {
  if (typeof slug !== "string") return null;
  const staff = await getSignedIn();
  if (!adminAllowed(staff)) return null;
  const course = await getAdminCourse(slug);
  if (!course || !can(staff, action, course.id)) return null;
  return { staff, course };
}
