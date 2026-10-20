// POST /api/me/sign-out: ends this browser's session (students and staff).
import { clearSessionCookie, sessionTokenOf } from "@/server/auth/request-session";
import { deleteSessionByToken } from "@/server/auth/sessions";
import { sameOrigin } from "@/server/files/upload";
import { json, jsonError } from "@/server/http/json";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  // Only this site's own pages may sign someone out.
  if (!sameOrigin(request)) return jsonError(403, "Not allowed.");
  const token = sessionTokenOf(request);
  if (token) await deleteSessionByToken(token);
  const response = json({ ok: true });
  response.headers.append("Set-Cookie", clearSessionCookie());
  return response;
}

export function GET() {
  return jsonError(405, "Use POST.");
}
