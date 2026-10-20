// What the legal pages need to know to describe the site truthfully: the
// owner's details, and whether ads (and with them Google's cookies) can load
// right now.
import { getAdsReadiness, getConsentSettings } from "@/server/ads/settings";
import { getSiteOwner, type SiteOwner } from "./owner";
import type { CmpProvider } from "@/lib/ads/policy";

export interface LegalContext {
  owner: SiteOwner;
  /** Every switch for live ads is on (production, both switches, publisher id, consent platform). */
  adsLive: boolean;
  provider: CmpProvider;
}

export async function legalContext(): Promise<LegalContext> {
  const [owner, readiness, consent] = await Promise.all([getSiteOwner(), getAdsReadiness().catch(() => ({ live: false })), getConsentSettings().catch(() => null)]);
  return { owner, adsLive: readiness.live, provider: consent?.provider ?? "none" };
}
