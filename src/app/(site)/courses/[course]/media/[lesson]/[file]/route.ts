// GET /courses/<course>/media/<lesson_id>/<file>: a lecture's image.
// Served only when it belongs to a live lecture of this course, so draft
// lectures' pictures stay private and one course can't reach another's files.
import { lessonImageKey } from "@/lib/lesson/media";
import { isPublicLessonImage } from "@/server/content/lessons";
import { resolveCourse } from "@/server/courses/scope";
import { notFoundResponse, serveR2Object } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };

type Context = { params: Promise<{ course: string; lesson: string; file: string }> };

export async function GET(request: Request, { params }: Context) {
  const { course: courseSlug, lesson, file } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return notFoundResponse();
  const key = lessonImageKey(course.courseId, lesson, file);
  const contentType = TYPES[file.slice(file.lastIndexOf(".") + 1).toLowerCase()];
  if (!key || !contentType) return notFoundResponse();
  if (!(await isPublicLessonImage(course, key))) return notFoundResponse();
  return serveR2Object(request, {
    key,
    contentType,
    filename: file,
    disposition: "inline",
    // Images change only with a new upload under the same name, which is rare: cache for a day.
    cacheControl: "public, max-age=86400",
  });
}
