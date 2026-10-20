// GET /api/me: who is signed in, for the header's account menu. Public pages
// never read the session themselves (so they could be cached for everyone);
// this small private call fills in the personal parts after the page loads.
import { accountTitle, canOpenAdmin } from "@/lib/auth/permissions";
import { accountFromRequest } from "@/server/auth/request-session";
import { json, jsonError } from "@/server/http/json";

export const dynamic = "force-dynamic";

export interface MeResponse {
  user: {
    name: string;
    email: string;
    isStaff: boolean;
    canOpenAdmin: boolean;
    /** Shown next to the name in the header: Administrator, Course admin, Editor or Student. */
    title: string;
  } | null;
}

export async function GET(request: Request) {
  const signedIn = await accountFromRequest(request);
  const body: MeResponse = {
    user: signedIn
      ? {
          name: signedIn.name,
          email: signedIn.email,
          isStaff: canOpenAdmin(signedIn),
          canOpenAdmin: !signedIn.studentSession && canOpenAdmin(signedIn),
          title: accountTitle(signedIn),
        }
      : null,
  };
  return json(body);
}

export function POST() {
  return jsonError(405, "Use GET.");
}
