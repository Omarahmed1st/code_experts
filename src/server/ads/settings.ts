// Reading the advertising and consent settings (Phase 6). Writing them is in
// src/server/admin/ads.ts (administrators only, audited). The rules that turn
// these settings into "may this slot show an ad" are pure functions in
// src/lib/ads/policy.ts.
import { cache } from "react";
import {
  type AdClientConfig,
  type AdDevices,
  type AdFormat,
  type AdPageType,
  type AdsSettings,
  type CmpProvider,
  type ConsentSettings,
  type ExclusionRule,
  type PageAdContext,
  type PageAds,
  type PlacementConfig,
  decidePageAds,
  globalReadiness,
  parseAdsSettings,
} from "@/lib/ads/policy";
import { getBindings, getConfig } from "@/server/platform/env";

export type { AdClientConfig };

export const ADS_SETTINGS_KEY = "ads";

export interface PlacementRow extends PlacementConfig {
  id: string;
  pageType: AdPageType;
  description: string;
  updatedAt: number;
  updatedByName: string | null;
}

export interface ExclusionRow extends ExclusionRule {
  id: string;
  courseTitle: string | null;
  createdAt: number;
}

export interface ConsentRow extends ConsentSettings {
  notes: string;
  privacyChoicesLink: boolean;
  updatedAt: number;
}

export async function readSetting(key: string): Promise<unknown> {
  const row = await getBindings().db.prepare("SELECT value FROM site_settings WHERE key = ?").bind(key).first<{ value: string }>();
  if (!row) return null;
  try {
    return JSON.parse(row.value) as unknown;
  } catch {
    return null;
  }
}

/** The admin's ad settings; anything missing or broken reads as "off". Deduplicated per request. */
export const getAdsSettings = cache(async (): Promise<AdsSettings> => parseAdsSettings(await readSetting(ADS_SETTINGS_KEY)));

/** The consent platform: the choice from consent_configuration, the script from CMP_SCRIPT_URL. */
export const getConsentSettings = cache(async (): Promise<ConsentRow> => {
  const row = await getBindings()
    .db.prepare("SELECT cmp_provider, cmp_settings, privacy_choices_link, updated_at FROM consent_configuration WHERE id = 'default'")
    .first<{ cmp_provider: CmpProvider; cmp_settings: string; privacy_choices_link: number; updated_at: number }>();
  let notes = "";
  try {
    const parsed = JSON.parse(row?.cmp_settings ?? "{}") as Record<string, unknown>;
    if (typeof parsed.notes === "string") notes = parsed.notes;
  } catch {
    notes = "";
  }
  return {
    provider: row?.cmp_provider ?? "none",
    cmpScriptUrl: getConfig().cmpScriptUrl,
    notes,
    privacyChoicesLink: row ? row.privacy_choices_link === 1 : true,
    updatedAt: row?.updated_at ?? 0,
  };
});

export const listPlacements = cache(async (): Promise<PlacementRow[]> => {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT p.id, p.placement_key AS placementKey, p.page_type AS pageType, p.description, p.ad_unit_id AS adUnitId,
              p.format, p.responsive, p.devices, p.min_height_px AS minHeightPx, p.enabled, p.updated_at AS updatedAt,
              coalesce(nullif(u.name, ''), u.email) AS updatedByName
         FROM ad_placements p LEFT JOIN users u ON u.id = p.updated_by
        ORDER BY p.placement_key`,
    )
    .all<{
      id: string;
      placementKey: string;
      pageType: AdPageType;
      description: string;
      adUnitId: string | null;
      format: AdFormat;
      responsive: number;
      devices: AdDevices;
      minHeightPx: number;
      enabled: number;
      updatedAt: number;
      updatedByName: string | null;
    }>();
  return results.map((r) => ({ ...r, responsive: r.responsive === 1, enabled: r.enabled === 1 }));
});

export const listExclusions = cache(async (): Promise<ExclusionRow[]> => {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT e.id, e.kind, e.path_glob AS pathGlob, e.course_id AS courseId, e.page_type AS pageType, e.reason,
              e.created_at AS createdAt, c.title AS courseTitle
         FROM ad_exclusions e LEFT JOIN courses c ON c.id = e.course_id
        ORDER BY e.created_at`,
    )
    .all<ExclusionRow>();
  return results;
});

/** Every switch that has to be on before live ads can load anywhere. */
export async function getAdsReadiness(): Promise<ReturnType<typeof globalReadiness>> {
  const config = getConfig();
  const [ads, consent] = await Promise.all([getAdsSettings(), getConsentSettings()]);
  return globalReadiness({ appEnv: config.appEnv, adsEnabledVar: config.adsEnabled }, ads, consent);
}

export interface PageAdsResult extends PageAds {
  template: PageAdContext["template"];
  client: AdClientConfig | null;
  appEnv: "local" | "preview" | "production";
}

/**
 * The ads for one page. `available` is the positions this page can really
 * offer (a short lecture may have no safe in-text break). Never throws: if the
 * settings can't be read, the page simply shows no ads.
 */
export async function pageAds(ctx: PageAdContext, available: string[]): Promise<PageAdsResult> {
  const appEnv = getConfig().appEnv;
  try {
    const [ads, consent, placements, exclusions, readiness] = await Promise.all([
      getAdsSettings(),
      getConsentSettings(),
      listPlacements(),
      listExclusions(),
      getAdsReadiness(),
    ]);
    const decided = decidePageAds({ ctx, globalLive: readiness.live, ads, placements, exclusions, available });
    return {
      ...decided,
      template: ctx.template,
      appEnv,
      client:
        decided.live && ads.publisherId
          ? { publisherId: ads.publisherId, provider: consent.provider, cmpScriptUrl: consent.cmpScriptUrl, hideForStaff: ads.hideForStaff }
          : null,
    };
  } catch {
    return { live: false, excludedBecause: "settings unavailable", slots: {}, template: ctx.template, client: null, appEnv };
  }
}

/** The client settings for pages that only need the consent tool (the privacy choices page), or null when ads are off. */
export async function adClientForConsent(): Promise<AdClientConfig | null> {
  const [ads, consent, readiness] = await Promise.all([getAdsSettings(), getConsentSettings(), getAdsReadiness()]);
  if (!readiness.live || !ads.publisherId) return null;
  return { publisherId: ads.publisherId, provider: consent.provider, cmpScriptUrl: consent.cmpScriptUrl, hideForStaff: ads.hideForStaff };
}
