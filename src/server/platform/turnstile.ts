// Server-side Turnstile check (Cloudflare's siteverify endpoint). The token
// from the widget is single-use and is checked here before any password work.
import { getTurnstileKeys } from "./env";

const SITEVERIFY = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/** True when Turnstile is off (no keys) or the token is valid. */
export async function passesTurnstile(token: unknown, ip: string | null): Promise<boolean> {
  const keys = getTurnstileKeys();
  if (!keys) return true;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;
  const body = new FormData();
  body.append("secret", keys.secretKey);
  body.append("response", token);
  if (ip) body.append("remoteip", ip);
  try {
    const response = await fetch(SITEVERIFY, { method: "POST", body });
    const result = (await response.json()) as { success?: boolean };
    return result.success === true;
  } catch (error) {
    console.error("turnstile: siteverify failed", error);
    return false;
  }
}
