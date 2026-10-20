// Verification meta tags for the home page: Google Search Console's HTML tag
// and AdSense's site-ownership tag. Both only appear once the owner has
// entered the values at /admin/site (and, for AdSense, the publisher id at
// /admin/ads). Neither loads any script.
import type { Metadata } from "next";
import { verificationMetadata } from "@/lib/site/verification";
import { getAdsSettings } from "@/server/ads/settings";
import { getSiteOwner } from "./owner";

export async function siteVerificationTags(): Promise<Pick<Metadata, "verification" | "other"> | null> {
  const [owner, ads] = await Promise.all([getSiteOwner(), getAdsSettings()]);
  return verificationMetadata({ searchConsoleToken: owner.searchConsoleToken, adsenseMetaTag: owner.adsenseMetaTag, publisherId: ads.publisherId });
}
