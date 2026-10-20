// The verification meta tags for the home page (Search Console's HTML tag and
// AdSense's site-ownership tag), built from the owner's values.
import type { Metadata } from "next";
import { normalizePublisherId } from "@/lib/ads/policy";

export function verificationMetadata(input: { searchConsoleToken: string | null; adsenseMetaTag: boolean; publisherId: string | null }): Pick<Metadata, "verification" | "other"> | null {
  const publisher = input.adsenseMetaTag ? normalizePublisherId(input.publisherId) : null;
  if (!input.searchConsoleToken && !publisher) return null;
  return {
    ...(input.searchConsoleToken ? { verification: { google: input.searchConsoleToken } } : {}),
    ...(publisher ? { other: { "google-adsense-account": `ca-${publisher}` } } : {}),
  };
}
