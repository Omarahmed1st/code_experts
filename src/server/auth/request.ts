// Facts about the current request that sign-in and the audit log need.
import { headers } from "next/headers";
import { getConfig } from "@/server/platform/env";
import { sessionCookieName } from "@/lib/auth/session-token";

export interface RequestMeta {
  ip: string | null;
  userAgent: string | null;
}

export async function requestMeta(): Promise<RequestMeta> {
  const h = await headers();
  // Cloudflare sets CF-Connecting-IP; local development has none.
  return { ip: h.get("cf-connecting-ip"), userAgent: h.get("user-agent") };
}

/** Cookies are Secure (and use the __Host- prefix) everywhere except local development over http. */
export function cookieIsSecure(): boolean {
  return getConfig().appEnv !== "local";
}

export function currentCookieName(): string {
  return sessionCookieName(cookieIsSecure());
}
