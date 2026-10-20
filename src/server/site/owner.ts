// The owner's facts, stored in site_settings under 'site_owner' and edited at
// /admin/site. The shape and the rules are in src/lib/site/owner.ts.
import { cache } from "react";
import { EMPTY_OWNER, type SiteOwner, parseSiteOwner } from "@/lib/site/owner";
import { readSetting } from "@/server/ads/settings";

export * from "@/lib/site/owner";

export const SITE_OWNER_KEY = "site_owner";

export const getSiteOwner = cache(async (): Promise<SiteOwner> => {
  try {
    return parseSiteOwner(await readSetting(SITE_OWNER_KEY));
  } catch {
    return { ...EMPTY_OWNER };
  }
});
