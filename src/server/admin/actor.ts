// Who is acting, for server actions. Each action resolves the signed-in staff
// member and the course from the request (never from what the browser claims),
// then calls a service, which checks the permission again.
import type { CourseAction } from "@/lib/auth/permissions";
import { requestMeta } from "@/server/auth/request";
import { adminAllowed, getSignedIn, staffForCourse } from "@/server/auth/staff";
import type { Actor } from "./context";
import type { AdminCourse } from "./courses";

export async function courseActor(slug: unknown, action: CourseAction): Promise<{ actor: Actor; course: AdminCourse; sessionId: string } | null> {
  const found = await staffForCourse(slug, action);
  if (!found) return null;
  return { actor: { staff: found.staff, ip: (await requestMeta()).ip }, course: found.course, sessionId: found.staff.sessionId };
}

export async function staffActor(): Promise<{ actor: Actor; sessionId: string } | null> {
  const staff = await getSignedIn();
  if (!adminAllowed(staff)) return null;
  return { actor: { staff, ip: (await requestMeta()).ip }, sessionId: staff.sessionId };
}
