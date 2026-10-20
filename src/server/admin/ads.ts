// Advertising and consent settings in the admin (Phase 6). Administrators only:
// course admins and editors can't change anything that affects the whole site.
// Every change is validated here on the server and written in one D1 batch
// with its audit entry. No field accepts markup or script: the publisher id
// and ad unit ids are digits with a fixed prefix, positions come from a fixed
// list, path patterns allow only letters, digits, - _ . / and *. The consent
// platform's script address can't be set here at all (CMP_SCRIPT_URL is a
// deployment setting).
import {
  AD_POSITIONS,
  AD_TEMPLATES,
  type AdTemplate,
  HARD_SLOT_CAP,
  normalizePublisherId,
  parsePlacementKey,
  validAdUnitId,
  validPathGlob,
} from "@/lib/ads/policy";
import { AD_DEVICES, AD_FORMAT, AD_PAGE_TYPE, CMP_PROVIDER } from "@/db/enums";
import { isAdmin } from "@/lib/auth/permissions";
import { newId } from "@/lib/ids";
import { ADS_SETTINGS_KEY, getAdsSettings, getConsentSettings, listExclusions, listPlacements } from "@/server/ads/settings";
import { getBindings } from "@/server/platform/env";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, done, fail, str } from "./context";

const ADMIN_ONLY = "Only administrators can change advertising and privacy settings.";

const oneOf = <T extends string>(list: readonly T[], value: unknown): value is T => typeof value === "string" && (list as readonly string[]).includes(value);

// ---------------------------------------------------------------- global settings

export interface AdsSettingsInput {
  enabled?: unknown;
  publisherId?: unknown;
  hideForStaff?: unknown;
  maxSlots?: unknown;
}

export async function saveAdsSettings(actor: Actor, raw: AdsSettingsInput): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const errors: Record<string, string> = {};
  const publisherText = str(raw.publisherId, 40);
  const publisherId = publisherText ? normalizePublisherId(publisherText) : null;
  if (publisherText && !publisherId) errors.publisherId = "A publisher id is \"pub-\" and 16 digits, copied from your AdSense account. Leave it empty if you don't have one yet.";
  const enabled = raw.enabled === true;
  if (enabled && !publisherId) errors.enabled = "Ads can't be switched on without a real publisher id.";
  const maxSlots: Partial<Record<AdTemplate, number>> = {};
  const rawSlots = raw.maxSlots && typeof raw.maxSlots === "object" ? (raw.maxSlots as Record<string, unknown>) : {};
  for (const t of AD_TEMPLATES) {
    const v = rawSlots[t];
    if (v === undefined || v === null || v === "") continue;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0 || n > HARD_SLOT_CAP[t]) {
      errors[`maxSlots.${t}`] = `Between 0 and ${HARD_SLOT_CAP[t]} for this page type.`;
      continue;
    }
    maxSlots[t] = n;
  }
  if (Object.keys(errors).length) return fail(Object.values(errors)[0]!, errors);

  const before = await getAdsSettings();
  const value = { enabled, publisherId, hideForStaff: raw.hideForStaff !== false, maxSlots };
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
      )
      .bind(ADS_SETTINGS_KEY, JSON.stringify(value), actor.staff.id, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "ads.settings", entityType: "site_settings", entityId: ADS_SETTINGS_KEY, before, after: value, ip: actor.ip }, now),
  ]);
  return done(undefined, enabled ? "Saved. Ads are switched on here; they still need every other item on the checklist." : "Saved.");
}

// ---------------------------------------------------------------- consent

export async function saveConsent(actor: Actor, raw: { provider?: unknown; notes?: unknown; privacyChoicesLink?: unknown }): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  if (!oneOf(CMP_PROVIDER, raw.provider)) return fail("Choose a consent platform.", { provider: "Choose one of the options." });
  const notes = str(raw.notes, 500);
  const before = await getConsentSettings();
  const { db } = getBindings();
  const now = Date.now();
  const after = { provider: raw.provider, notes, privacyChoicesLink: raw.privacyChoicesLink !== false };
  await db.batch([
    db
      .prepare(
        `UPDATE consent_configuration SET cmp_provider = ?1, cmp_settings = ?2, privacy_choices_link = ?3, updated_by = ?4, updated_at = ?5 WHERE id = 'default'`,
      )
      .bind(raw.provider, JSON.stringify({ notes }), after.privacyChoicesLink ? 1 : 0, actor.staff.id, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "consent.update", entityType: "consent_configuration", entityId: "default", before: { provider: before.provider, notes: before.notes, privacyChoicesLink: before.privacyChoicesLink }, after, ip: actor.ip }, now),
  ]);
  return done(undefined, "Saved.");
}

// ---------------------------------------------------------------- placements

export interface PlacementInput {
  placementKey?: unknown;
  adUnitId?: unknown;
  format?: unknown;
  responsive?: unknown;
  devices?: unknown;
  minHeightPx?: unknown;
  enabled?: unknown;
  description?: unknown;
}

interface CleanPlacement {
  placementKey: string;
  pageType: AdTemplate;
  adUnitId: string | null;
  format: (typeof AD_FORMAT)[number];
  responsive: boolean;
  devices: (typeof AD_DEVICES)[number];
  minHeightPx: number;
  enabled: boolean;
  description: string;
}

/** Server-side check of a placement form. Returns field errors keyed by input name. */
export function readPlacement(raw: PlacementInput): { value: CleanPlacement | null; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const key = parsePlacementKey(raw.placementKey);
  if (!key) errors.placementKey = "Choose one of the listed positions.";
  const unitText = str(raw.adUnitId, 40);
  const adUnitId = unitText === "" ? null : unitText;
  if (adUnitId !== null && !validAdUnitId(adUnitId)) errors.adUnitId = "An ad unit id is only digits (the data-ad-slot number in the ad code from AdSense).";
  if (!oneOf(AD_FORMAT, raw.format)) errors.format = "Choose a format.";
  if (!oneOf(AD_DEVICES, raw.devices)) errors.devices = "Choose where it shows.";
  const minHeightPx = Number(raw.minHeightPx);
  if (!Number.isInteger(minHeightPx) || minHeightPx < 50 || minHeightPx > 1000) errors.minHeightPx = "Between 50 and 1000 pixels.";
  const enabled = raw.enabled === true;
  if (enabled && adUnitId === null) errors.enabled = "A placement can only be switched on with a real ad unit id.";
  const description = str(raw.description, 300);
  if (Object.keys(errors).length || !key) return { value: null, errors };
  return {
    value: {
      placementKey: `${key.template}.${key.position}`,
      pageType: key.template,
      adUnitId,
      format: raw.format as CleanPlacement["format"],
      responsive: raw.responsive !== false,
      devices: raw.devices as CleanPlacement["devices"],
      minHeightPx,
      enabled,
      description,
    },
    errors,
  };
}

export async function createPlacement(actor: Actor, raw: PlacementInput): Promise<AdminResult<{ id: string }>> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const { value, errors } = readPlacement(raw);
  if (!value) return fail(Object.values(errors)[0] ?? "Check the form.", errors);
  if ((await listPlacements()).some((p) => p.placementKey === value.placementKey)) {
    return fail("That position already has a placement. Edit it instead.", { placementKey: "Already set up." });
  }
  const id = newId("adp");
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO ad_placements (id, placement_key, page_type, description, ad_unit_id, format, responsive, devices, min_height_px, enabled, updated_by, updated_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(id, value.placementKey, value.pageType, value.description, value.adUnitId, value.format, value.responsive ? 1 : 0, value.devices, value.minHeightPx, value.enabled ? 1 : 0, actor.staff.id, now, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "ads.placement.create", entityType: "ad_placement", entityId: id, after: value, ip: actor.ip }, now),
  ]);
  return done({ id }, "Placement created.");
}

export async function updatePlacement(actor: Actor, id: unknown, raw: PlacementInput): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const existing = (await listPlacements()).find((p) => p.id === id);
  if (!existing) return fail("That placement doesn't exist any more.");
  // The position of an existing placement doesn't change: delete it and make a new one instead.
  const { value, errors } = readPlacement({ ...raw, placementKey: existing.placementKey });
  if (!value) return fail(Object.values(errors)[0] ?? "Check the form.", errors);
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `UPDATE ad_placements SET description = ?, ad_unit_id = ?, format = ?, responsive = ?, devices = ?, min_height_px = ?, enabled = ?, updated_by = ?, updated_at = ?
          WHERE id = ?`,
      )
      .bind(value.description, value.adUnitId, value.format, value.responsive ? 1 : 0, value.devices, value.minHeightPx, value.enabled ? 1 : 0, actor.staff.id, now, existing.id),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: null,
        action: existing.enabled && !value.enabled ? "ads.placement.disable" : !existing.enabled && value.enabled ? "ads.placement.enable" : "ads.placement.update",
        entityType: "ad_placement",
        entityId: existing.id,
        before: existing,
        after: value,
        ip: actor.ip,
      },
      now,
    ),
  ]);
  return done(undefined, "Saved.");
}

export async function deletePlacement(actor: Actor, id: unknown): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const existing = (await listPlacements()).find((p) => p.id === id);
  if (!existing) return fail("That placement doesn't exist any more.");
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM ad_placements WHERE id = ?").bind(existing.id),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "ads.placement.delete", entityType: "ad_placement", entityId: existing.id, before: existing, ip: actor.ip }, now),
  ]);
  return done(undefined, "Placement deleted.");
}

// ---------------------------------------------------------------- exclusions

export async function createExclusion(
  actor: Actor,
  raw: { kind?: unknown; pathGlob?: unknown; courseId?: unknown; pageType?: unknown; reason?: unknown },
): Promise<AdminResult<{ id: string }>> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const reason = str(raw.reason, 300);
  let pathGlob: string | null = null;
  let courseId: string | null = null;
  let pageType: (typeof AD_PAGE_TYPE)[number] | null = null;
  if (raw.kind === "path") {
    const glob = str(raw.pathGlob, 200);
    if (!validPathGlob(glob)) return fail("Check the path pattern.", { pathGlob: "Start with /, use letters, digits, - _ . / and * only (for example /courses/*/exercises/**)." });
    pathGlob = glob;
  } else if (raw.kind === "course") {
    const course = await getBindings().db.prepare("SELECT id FROM courses WHERE id = ?").bind(str(raw.courseId, 100)).first<{ id: string }>();
    if (!course) return fail("Choose a course.", { courseId: "Choose a course." });
    courseId = course.id;
  } else if (raw.kind === "page_type") {
    if (!oneOf(AD_PAGE_TYPE, raw.pageType)) return fail("Choose a page type.", { pageType: "Choose a page type." });
    pageType = raw.pageType;
  } else {
    return fail("Choose what to exclude.", { kind: "Choose a kind." });
  }
  const duplicate = (await listExclusions()).some(
    (e) => e.kind === raw.kind && e.pathGlob === pathGlob && e.courseId === courseId && e.pageType === pageType,
  );
  if (duplicate) return fail("That exclusion already exists.");
  const id = newId("adx");
  const { db } = getBindings();
  const now = Date.now();
  const after = { kind: raw.kind, pathGlob, courseId, pageType, reason };
  await db.batch([
    db
      .prepare("INSERT INTO ad_exclusions (id, kind, path_glob, course_id, page_type, reason, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, raw.kind, pathGlob, courseId, pageType, reason, actor.staff.id, now),
    auditStatement({ actorId: actor.staff.id, courseId, action: "ads.exclusion.create", entityType: "ad_exclusion", entityId: id, after, ip: actor.ip }, now),
  ]);
  return done({ id }, "Exclusion added.");
}

export async function deleteExclusion(actor: Actor, id: unknown): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const existing = (await listExclusions()).find((e) => e.id === id);
  if (!existing) return fail("That exclusion doesn't exist any more.");
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM ad_exclusions WHERE id = ?").bind(existing.id),
    auditStatement({ actorId: actor.staff.id, courseId: existing.courseId, action: "ads.exclusion.delete", entityType: "ad_exclusion", entityId: existing.id, before: existing, ip: actor.ip }, now),
  ]);
  return done(undefined, "Exclusion removed.");
}

/** The positions not yet set up, for the "new placement" form. */
export async function freePositions(): Promise<{ key: string; label: string; where: string; template: AdTemplate }[]> {
  const used = new Set((await listPlacements()).map((p) => p.placementKey));
  return AD_TEMPLATES.flatMap((template) =>
    AD_POSITIONS[template]
      .map((p) => ({ key: `${template}.${p.position}`, label: p.label, where: p.where, template }))
      .filter((p) => !used.has(p.key)),
  );
}
