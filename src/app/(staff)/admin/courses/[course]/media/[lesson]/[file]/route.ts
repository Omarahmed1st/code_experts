// GET /admin/courses/<course>/media/<lesson_id>/<file>: a lecture picture for staff,
// whatever the lecture's status (the public media route serves live lectures only).
import { can } from "@/lib/auth/permissions";
import { lessonImageKey } from "@/lib/lesson/media";
import { getAdminCourse } from "@/server/admin/courses";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { notFoundResponse, serveR2Object } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

export async function GET(request: Request, { params }: { params: Promise<{ course: string; lesson: string; file: string }> }) {
  const { course: slug, lesson, file } = await params;
  const staff = await getSignedIn();
  const course = await getAdminCourse(slug);
  if (!adminAllowed(staff) || !course || !can(staff, "view", course.id)) return notFoundResponse();
  const key = lessonImageKey(course.id, lesson, file);
  const contentType = TYPES[file.slice(file.lastIndexOf(".") + 1).toLowerCase()];
  if (!key || !contentType) return notFoundResponse();
  return serveR2Object(request, { key, contentType, filename: file, disposition: "inline", cacheControl: "private, no-store" });
}
