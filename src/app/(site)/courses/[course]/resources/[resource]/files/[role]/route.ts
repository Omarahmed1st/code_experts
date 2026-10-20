// GET /courses/<course>/resources/<resource>/files/<original|preview>
// Public, published resources only (students/staff files need sign-in, Phase 4).
// The original is sent as a download only when the resource allows downloads;
// the preview (a PDF of the slides) opens in the browser.
import { RESOURCE_FILE_ROLE } from "@/db/enums";
import { getPublicResourceFile } from "@/server/content/resources";
import { resolveCourse } from "@/server/courses/scope";
import { notFoundResponse, serveR2Object } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ course: string; resource: string; role: string }> };

export async function GET(request: Request, { params }: Context) {
  const { course: courseSlug, resource, role } = await params;
  if (!(RESOURCE_FILE_ROLE as readonly string[]).includes(role)) return notFoundResponse();
  const course = await resolveCourse(courseSlug);
  if (!course) return notFoundResponse();
  const file = await getPublicResourceFile(course, resource, role as (typeof RESOURCE_FILE_ROLE)[number]);
  if (!file) return notFoundResponse();
  if (role === "original" && !file.downloadable) return notFoundResponse();
  // The database already keeps keys under the course's folder; check again before touching R2.
  if (!file.r2Key.startsWith(`courses/${course.courseId}/`)) return notFoundResponse();
  return serveR2Object(request, {
    key: file.r2Key,
    contentType: file.contentType,
    filename: file.filename,
    disposition: role === "preview" ? "inline" : "attachment",
    cacheControl: "public, max-age=3600",
  });
}
