// GET: one question as a Markdown file in the content format (docs/CONTENT.md).
import { can } from "@/lib/auth/permissions";
import { getAdminCourse } from "@/server/admin/courses";
import { exerciseMarkdown, getExerciseForEdit } from "@/server/admin/exercises";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { notFoundResponse } from "@/server/files/serve-r2";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const staff = await getSignedIn();
  const course = await getAdminCourse(slug);
  if (!adminAllowed(staff) || !course || !can(staff, "view", course.id)) return notFoundResponse();
  const exercise = await getExerciseForEdit(course, id);
  if (!exercise) return notFoundResponse();
  return new Response(exerciseMarkdown(exercise.source), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${exercise.source.slug}.md"`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
