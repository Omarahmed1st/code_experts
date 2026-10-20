// GET /api/me/export: the signed-in account's data as a JSON download.
import { accountFromRequest } from "@/server/auth/request-session";
import { jsonError } from "@/server/http/json";
import { exportAccountData } from "@/server/students/export";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await accountFromRequest(request);
  if (!user) return jsonError(401, "Sign in to download your data.");
  const data = await exportAccountData(user.id);
  if (!data) return jsonError(404, "This account doesn't exist any more.");
  const day = new Date().toISOString().slice(0, 10);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="code-expert-my-data-${day}.json"`,
      "Cache-Control": "private, no-store",
      "X-Robots-Tag": "noindex",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
