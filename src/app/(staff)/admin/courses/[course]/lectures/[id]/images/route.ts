// POST: a picture for one of this lecture's sections (raw file body, see src/server/files/upload.ts).
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { courseActor } from "@/server/admin/actor";
import { uploadLessonImage } from "@/server/admin/lessons";
import { sameOrigin, uploadName } from "@/server/files/upload";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  if (!sameOrigin(request)) return Response.json(fail("This upload didn't come from the admin."), { status: 403 });
  const ctx = await courseActor(slug, "edit");
  if (!ctx) return Response.json(fail(NO_PERMISSION), { status: 403 });
  const name = uploadName(request, "picture");
  const result = await uploadLessonImage(ctx.actor, ctx.course, id, request, name);
  return Response.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
}
