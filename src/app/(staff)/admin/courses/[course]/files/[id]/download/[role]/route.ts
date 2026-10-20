// GET: a course file for staff, in any status (the public route serves published public files only).
import { can } from "@/lib/auth/permissions";
import { getAdminCourse } from "@/server/admin/courses";
import { getStaffResourceFile } from "@/server/admin/resources";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { notFoundResponse, serveR2Object } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ course: string; id: string; role: string }> }) {
  const { course: slug, id, role } = await params;
  if (role !== "original" && role !== "preview") return notFoundResponse();
  const staff = await getSignedIn();
  const course = await getAdminCourse(slug);
  if (!adminAllowed(staff) || !course || !can(staff, "view", course.id)) return notFoundResponse();
  const file = await getStaffResourceFile(course, id, role);
  if (!file || !file.r2Key.startsWith(`courses/${course.id}/`)) return notFoundResponse();
  return serveR2Object(request, {
    key: file.r2Key,
    contentType: file.contentType,
    filename: file.filename,
    disposition: role === "preview" ? "inline" : "attachment",
    cacheControl: "private, no-store",
  });
}
