// Pure parsing of environment variables (no Workers imports, so it is unit-testable).
import { validScriptUrl } from "@/lib/ads/policy";

export type AppEnv = "local" | "preview" | "production";

export interface AppConfig {
  appEnv: AppEnv;
  /** Absolute site origin without a trailing slash, or null when not configured. */
  publicSiteUrl: string | null;
  /**
   * True only in production with ADS_ENABLED="true". Local and preview builds
   * never load ad scripts, whatever the variable says.
   */
  adsEnabled: boolean;
  /**
   * The script of a Google-certified third-party consent platform (CMP_SCRIPT_URL),
   * https only. Set in the deployment config, never from an admin form, so the
   * admin can't be used to load arbitrary scripts. Null when unset or invalid.
   */
  cmpScriptUrl: string | null;
}

export function parseConfig(vars: Record<string, string | undefined>): AppConfig {
  const appEnv: AppEnv = vars.APP_ENV === "production" || vars.APP_ENV === "preview" ? vars.APP_ENV : "local";
  const url = vars.PUBLIC_SITE_URL?.trim();
  return {
    appEnv,
    publicSiteUrl: url && /^https?:\/\/[^\s/]+(\/[^\s]*)?$/.test(url) ? url.replace(/\/+$/, "") : null,
    adsEnabled: appEnv === "production" && vars.ADS_ENABLED === "true",
    cmpScriptUrl: validScriptUrl(vars.CMP_SCRIPT_URL),
  };
}
