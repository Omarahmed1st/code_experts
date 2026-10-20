// The only module that touches Cloudflare bindings and environment variables.
// Everything else asks this module, so switching adapters (vinext <-> OpenNext)
// changes this file and the build scripts only.
import { env } from "cloudflare:workers";
import { type AppConfig, parseConfig } from "./config";

export type { AppConfig, AppEnv } from "./config";

export function getBindings(): { db: D1Database; files: R2Bucket } {
  return { db: env.DB, files: env.FILES };
}

export function getConfig(): AppConfig {
  return parseConfig({
    APP_ENV: env.APP_ENV,
    PUBLIC_SITE_URL: env.PUBLIC_SITE_URL,
    ADS_ENABLED: env.ADS_ENABLED,
    CMP_SCRIPT_URL: (env as unknown as Record<string, string | undefined>).CMP_SCRIPT_URL,
  });
}

/** Development-only key, used only when APP_ENV is "local" and no secret is set. */
const LOCAL_ASSESSMENT_SECRET = "codelab-local-development-only-not-a-secret";

/**
 * The key that signs quiz and exam attempts (src/lib/grading/attempt-token.ts).
 * A Worker secret (`wrangler secret put ASSESSMENT_SECRET`); local development
 * falls back to a fixed key so `npm run dev` needs no setup. Preview and
 * production refuse to start an attempt without a real one.
 */
export function getAssessmentSecret(): string {
  // A secret, not a var, so it isn't in the generated Env type.
  const secret = (env as unknown as Record<string, unknown>).ASSESSMENT_SECRET;
  if (typeof secret === "string" && secret.length >= 32) return secret;
  if (getConfig().appEnv === "local") return LOCAL_ASSESSMENT_SECRET;
  throw new Error("ASSESSMENT_SECRET is not set (32+ characters). Set it with `wrangler secret put ASSESSMENT_SECRET`.");
}

export interface TurnstileKeys {
  siteKey: string;
  secretKey: string;
}

/**
 * Cloudflare Turnstile on the sign-in form: on only when both keys are set
 * (TURNSTILE_SITE_KEY as a var, TURNSTILE_SECRET_KEY as a secret). Without
 * them sign-in still has rate limits; the admin dashboard warns about it outside
 * local development.
 */
export function getTurnstileKeys(): TurnstileKeys | null {
  const vars = env as unknown as Record<string, unknown>;
  const siteKey = vars.TURNSTILE_SITE_KEY;
  const secretKey = vars.TURNSTILE_SECRET_KEY;
  if (typeof siteKey === "string" && siteKey.trim() && typeof secretKey === "string" && secretKey.trim()) {
    return { siteKey: siteKey.trim(), secretKey: secretKey.trim() };
  }
  return null;
}

/** True when ASSESSMENT_SECRET is a real secret (for the admin's setup checklist). */
export function hasAssessmentSecret(): boolean {
  const secret = (env as unknown as Record<string, unknown>).ASSESSMENT_SECRET;
  return typeof secret === "string" && secret.length >= 32;
}
