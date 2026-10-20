// GET: every question of the course as one JSON file: a list in the content
// format, which "Import" reads back (docs/CONTENT.md).
import { can } from "@/lib/auth/permissions";
import { getAdminCourse } from "@/server/admin/courses";
import { exportExercises } from "@/server/admin/exercises";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { notFoundResponse } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ course: string }> }) {
  const { course: slug } = await params;
  const staff = await getSignedIn();
  const course = await getAdminCourse(slug);
  if (!adminAllowed(staff) || !course || !can(staff, "view", course.id)) return notFoundResponse();
  const questions = await exportExercises(course);
  const body = JSON.stringify({ format: "code-expert-questions", version: 1, course: course.slug, questions }, null, 2);
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${course.slug}-questions.json"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
