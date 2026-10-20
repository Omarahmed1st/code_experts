// The signed-in student's own data in one course. Private, never cached.
//
//   GET  /api/me/courses/<course>/state                   lectures read, questions answered, bookmarks
//   GET  /api/me/courses/<course>/draft?question=<slug>   the saved code for a question
//   POST /api/me/courses/<course>/progress   { lecture, status: "started" | "completed" | "not_completed" }
//   POST /api/me/courses/<course>/bookmark   { kind: "lecture" | "question" | "file" | "quiz", slug, on }
//   POST /api/me/courses/<course>/draft      { question, code }   (empty code removes the draft)
//
// Guests get { signedIn: false } from the GETs and 401 from the POSTs.
import { accountFromRequest } from "@/server/auth/request-session";
import { resolveCourse } from "@/server/courses/scope";
import { sameOrigin } from "@/server/files/upload";
import { MAX_CODE_LENGTH } from "@/server/grading/grade";
import { json, jsonError, readJson } from "@/server/http/json";
import { BOOKMARK_KINDS, type BookmarkKind, getCourseState, getDraft, saveDraft, setBookmark, setLectureStatus } from "@/server/students/progress";

export const dynamic = "force-dynamic";

type Context = { params: Promise<{ course: string; action: string }> };

export async function GET(request: Request, { params }: Context) {
  const { course: courseSlug, action } = await params;
  if (action !== "state" && action !== "draft") return jsonError(404, "Not found.");
  const course = await resolveCourse(courseSlug);
  if (!course) return jsonError(404, "This course doesn't exist.");
  const user = await accountFromRequest(request);
  if (!user) return json({ signedIn: false });
  if (action === "state") return json({ signedIn: true, ...(await getCourseState(user.id, course)) });
  const question = new URL(request.url).searchParams.get("question") ?? "";
  return json({ signedIn: true, draft: await getDraft(user.id, course, question) });
}

export async function POST(request: Request, { params }: Context) {
  const { course: courseSlug, action } = await params;
  if (action !== "progress" && action !== "bookmark" && action !== "draft") return jsonError(404, "Not found.");
  if (!sameOrigin(request)) return jsonError(403, "Not allowed.");
  const course = await resolveCourse(courseSlug);
  if (!course) return jsonError(404, "This course doesn't exist.");
  const user = await accountFromRequest(request);
  if (!user) return jsonError(401, "Sign in to save this.");
  const body = await readJson(request, action === "draft" ? MAX_CODE_LENGTH * 4 + 1024 : 2048);
  if (!body || typeof body !== "object") return jsonError(400, "The request couldn't be read.");
  const b = body as Record<string, unknown>;

  if (action === "progress") {
    const status = b.status;
    if (typeof b.lecture !== "string" || (status !== "started" && status !== "completed" && status !== "not_completed")) {
      return jsonError(400, "The request couldn't be read.");
    }
    const now = await setLectureStatus(user.id, course, b.lecture, status);
    return now ? json({ status: now }) : jsonError(404, "This lecture doesn't exist in this course.");
  }
  if (action === "bookmark") {
    if (!BOOKMARK_KINDS.includes(b.kind as BookmarkKind) || typeof b.slug !== "string" || typeof b.on !== "boolean") {
      return jsonError(400, "The request couldn't be read.");
    }
    const on = await setBookmark(user.id, course, b.kind as BookmarkKind, b.slug, b.on);
    return on === null ? jsonError(404, "That isn't available in this course.") : json({ on });
  }
  if (typeof b.question !== "string") return jsonError(400, "The request couldn't be read.");
  const saved = await saveDraft(user.id, course, b.question, b.code);
  return saved ? json({ saved: true, savedAt: Date.now() }) : jsonError(400, "This question can't keep a draft.");
}
