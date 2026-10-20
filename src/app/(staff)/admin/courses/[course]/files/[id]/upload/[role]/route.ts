// POST: the original file or the preview PDF of a course file (raw file body, see src/server/files/upload.ts).
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { courseActor } from "@/server/admin/actor";
import { uploadResourceFile } from "@/server/admin/resources";
import { sameOrigin, uploadName } from "@/server/files/upload";

export const dynamic = "force-dynamic";

export async function POST(request: Request, { params }: { params: Promise<{ course: string; id: string; role: string }> }) {
  const { course: slug, id, role } = await params;
  if (role !== "original" && role !== "preview") return Response.json(fail("Unknown file."), { status: 404 });
  if (!sameOrigin(request)) return Response.json(fail("This upload didn't come from the admin."), { status: 403 });
  const ctx = await courseActor(slug, "edit");
  if (!ctx) return Response.json(fail(NO_PERMISSION), { status: 403 });
  const result = await uploadResourceFile(ctx.actor, ctx.course, id, role, request, uploadName(request, "file"));
  return Response.json(result, { status: result.ok ? 200 : 400, headers: { "Cache-Control": "no-store" } });
}
