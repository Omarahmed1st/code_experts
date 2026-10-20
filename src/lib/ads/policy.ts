// Advertising rules for Code_Expert (Phase 6). Pure functions, no I/O, so every
// rule is unit-tested (tests/unit/phase6-ads.test.ts).
//
// The order of priorities, from the Phase 6 brief: Google's policies first,
// then readable lectures, then no accidental clicks, then phones, then revenue,
// then speed. In practice that means:
// - ads are off unless every switch below is on (production, the ADS_ENABLED
//   variable, the admin's switch, a real publisher id, a certified consent
//   platform, an enabled placement with a real ad unit id);
// - only a few page templates may ever show an ad, each at fixed positions that
//   sit between finished blocks of reading, never inside an answer area, a code
//   runner, a timer or next to Run / Check / Submit / Next;
// - each template has a hard cap on slots that the admin can lower, never raise;
// - assessments, accounts, the admin, search, error pages and list pages never
//   show ads, whatever the settings say.
//
// Nothing here invents a Google number: the caps are this site's own choice for
// readable pages, not a Google limit.

import type { AD_DEVICES, AD_FORMAT, AD_PAGE_TYPE, CMP_PROVIDER } from "@/db/enums";

export type AdPageType = (typeof AD_PAGE_TYPE)[number];
export type AdFormat = (typeof AD_FORMAT)[number];
export type AdDevices = (typeof AD_DEVICES)[number];
export type CmpProvider = (typeof CMP_PROVIDER)[number];

/** The page templates that may carry ads at all. Every other page type is excluded in code. */
export const AD_TEMPLATES = ["home", "course", "lesson", "exercise", "resource"] as const;
export type AdTemplate = (typeof AD_TEMPLATES)[number];

export interface AdPosition {
  /** Second half of the placement key: "<template>.<position>". */
  position: string;
  label: string;
  /** Where exactly it sits, for the admin and the placement plan. */
  where: string;
}

/**
 * Every position an ad may ever occupy. A placement in the admin picks one of
 * these; there is no free-form position and no way to put an ad anywhere else.
 */
export const AD_POSITIONS: Record<AdTemplate, AdPosition[]> = {
  home: [
    { position: "after_courses", label: "After the course list", where: "Below the Courses section, above \"How Code_Expert works\". Never in the first screen with the code box." },
    { position: "after_how_it_works", label: "Bottom of the page", where: "After \"How Code_Expert works\", above the footer." },
  ],
  course: [
    { position: "after_outline", label: "After the course outline", where: "Below the whole outline (the course's navigation), above the footer." },
  ],
  lesson: [
    {
      position: "after_first_section",
      label: "After the first full reading section",
      where:
        "Between two lecture sections, after at least ~150 words of reading, and only where the section before ends in text (not a code box, Run button, output or picture) and the next one starts with text.",
    },
    {
      position: "mid_content",
      label: "Further down the lecture",
      where: "A second break with the same rules, at least 3 sections and ~300 words after the first one, never in the last two sections.",
    },
    {
      position: "end",
      label: "End of the lecture",
      where: "After the previous/next links and related lectures, with a wide gap, so it never sits next to \"Mark as done\" or navigation.",
    },
  ],
  exercise: [
    {
      position: "below_question",
      label: "Below the question (cautious)",
      where: "Under the whole question, its explanation and the links back, with a wide gap from Check, the answer options and the code box.",
    },
  ],
  resource: [
    { position: "below_description", label: "Below the file description", where: "After the description and preview, away from the download button." },
  ],
};

/** This site's own ceiling per page, chosen for readability. The admin may lower it, never raise it. */
export const HARD_SLOT_CAP: Record<AdTemplate, number> = { home: 2, course: 1, lesson: 3, exercise: 1, resource: 1 };

/** Pages that never show ads, whatever the settings (checked against the path as a second line of defence). */
export const NEVER_AD_PATHS: { pattern: string; why: string }[] = [
  { pattern: "/admin/**", why: "admin" },
  { pattern: "/api/**", why: "API" },
  { pattern: "/login", why: "sign-in" },
  { pattern: "/register", why: "sign-up" },
  { pattern: "/forgot-password", why: "password recovery" },
  { pattern: "/dashboard/**", why: "personal dashboard" },
  { pattern: "/settings/**", why: "account settings" },
  { pattern: "/account-deleted", why: "account pages" },
  { pattern: "/courses/*/quizzes/*", why: "quiz runner" },
  { pattern: "/courses/*/exams/*", why: "exam runner" },
  { pattern: "/courses/*/build-exam/**", why: "custom exam" },
  { pattern: "/courses/*/practice/**", why: "practice set" },
  { pattern: "/courses/*/search/**", why: "search results" },
  { pattern: "/search/**", why: "search" },
  { pattern: "/contact", why: "contact form" },
  { pattern: "/privacy-policy", why: "legal page" },
  { pattern: "/terms", why: "legal page" },
  { pattern: "/cookie-policy", why: "legal page" },
  { pattern: "/privacy-choices", why: "privacy choices" },
  { pattern: "/advertising", why: "advertising disclosure" },
];

// ---------------------------------------------------------------- validation

/** "pub-" and 16 digits, as AdSense shows it. Accepts the "ca-pub-…" form from the ad code too. Anything else is null. */
export function normalizePublisherId(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim().replace(/^ca-/, "");
  return /^pub-\d{16}$/.test(value) ? value : null;
}

/** An AdSense ad unit id (the data-ad-slot value): digits only, so it can never carry markup. */
export function validAdUnitId(input: unknown): input is string {
  return typeof input === "string" && /^\d{6,20}$/.test(input);
}

/** Google's certification authority id for ads.txt, the same for every AdSense publisher. */
export const GOOGLE_ADS_TXT_CERT_ID = "f08c47fec0942fa0";

/** The ads.txt file for a publisher id, or null when there is no valid id (then /ads.txt is a 404). */
export function adsTxtBody(publisherId: unknown): string | null {
  const id = normalizePublisherId(publisherId);
  return id ? `google.com, ${id}, DIRECT, ${GOOGLE_ADS_TXT_CERT_ID}\n` : null;
}

export function isAdTemplate(value: unknown): value is AdTemplate {
  return typeof value === "string" && (AD_TEMPLATES as readonly string[]).includes(value);
}

/** "lesson.end" -> { template: "lesson", position: "end" } when it is one of AD_POSITIONS. */
export function parsePlacementKey(key: unknown): { template: AdTemplate; position: string } | null {
  if (typeof key !== "string") return null;
  const [template, position, extra] = key.split(".");
  if (extra !== undefined || !isAdTemplate(template) || !position) return null;
  return AD_POSITIONS[template].some((p) => p.position === position) ? { template, position } : null;
}

// Path patterns for exclusions, such as "/courses/*/exercises/**".
// Letters, digits, - _ . / and * only.
export function validPathGlob(input: unknown): input is string {
  return (
    typeof input === "string" &&
    input.length >= 1 &&
    input.length <= 200 &&
    input.startsWith("/") &&
    !input.includes("//") &&
    /^[A-Za-z0-9/_.*-]+$/.test(input) &&
    !/\*{3,}/.test(input)
  );
}

/**
 * Does a path match a pattern? "*" is one path segment (or the rest of one),
 * "**" is any number of segments (also none). No regular expression is built
 * from the pattern, so a pattern can't be used to slow the site down.
 */
export function globMatch(pattern: string, path: string): boolean {
  const clean = (p: string) => p.split("?")[0]!.split("#")[0]!.replace(/\/+$/, "") || "/";
  const pat = clean(pattern).split("/").filter(Boolean);
  const segs = clean(path).split("/").filter(Boolean);
  const segMatch = (p: string, s: string): boolean => {
    // "*" wildcards inside one segment, matched left to right without backtracking blow-up.
    const parts = p.split("*");
    if (parts.length === 1) return p === s;
    if (!s.startsWith(parts[0]!) || !s.endsWith(parts[parts.length - 1]!)) return false;
    let at = parts[0]!.length;
    const end = s.length - parts[parts.length - 1]!.length;
    if (end < at) return false;
    for (const mid of parts.slice(1, -1)) {
      const found = s.indexOf(mid, at);
      if (found < 0 || found + mid.length > end) return false;
      at = found + mid.length;
    }
    return true;
  };
  // Iterative matcher with a memo: O(pattern × path) at worst.
  const memo = new Map<string, boolean>();
  const go = (i: number, j: number): boolean => {
    const key = `${i},${j}`;
    const known = memo.get(key);
    if (known !== undefined) return known;
    let result: boolean;
    if (i === pat.length) result = j === segs.length;
    else if (pat[i] === "**") result = go(i + 1, j) || (j < segs.length && go(i, j + 1));
    else result = j < segs.length && segMatch(pat[i]!, segs[j]!) && go(i + 1, j + 1);
    memo.set(key, result);
    return result;
  };
  return go(0, 0);
}

/** Why a path may never show ads, or null. */
export function neverAdReason(path: string): string | null {
  return NEVER_AD_PATHS.find((rule) => globMatch(rule.pattern, path))?.why ?? null;
}

// ---------------------------------------------------------------- settings

export interface AdsSettings {
  /** The admin's switch. */
  enabled: boolean;
  /** "pub-" + 16 digits, entered from the real AdSense account; never generated. */
  publisherId: string | null;
  /** Signed-in staff never get live ads (stops them clicking their own ads). */
  hideForStaff: boolean;
  /** Per-template slot limits; each is clamped to HARD_SLOT_CAP. */
  maxSlots: Partial<Record<AdTemplate, number>>;
}

export const DEFAULT_ADS_SETTINGS: AdsSettings = { enabled: false, publisherId: null, hideForStaff: true, maxSlots: {} };

/** Reads the stored JSON safely: anything unexpected falls back to "off". */
export function parseAdsSettings(raw: unknown): AdsSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ADS_SETTINGS };
  const r = raw as Record<string, unknown>;
  const maxSlots: Partial<Record<AdTemplate, number>> = {};
  if (r.maxSlots && typeof r.maxSlots === "object") {
    for (const t of AD_TEMPLATES) {
      const n = (r.maxSlots as Record<string, unknown>)[t];
      if (typeof n === "number" && Number.isInteger(n)) maxSlots[t] = Math.min(Math.max(n, 0), HARD_SLOT_CAP[t]);
    }
  }
  return {
    enabled: r.enabled === true,
    publisherId: normalizePublisherId(r.publisherId),
    hideForStaff: r.hideForStaff !== false,
    maxSlots,
  };
}

export function slotCap(settings: AdsSettings, template: AdTemplate): number {
  return Math.min(settings.maxSlots[template] ?? HARD_SLOT_CAP[template], HARD_SLOT_CAP[template]);
}

export interface ConsentSettings {
  provider: CmpProvider;
  /** Only for certified_third_party: the CMP's script, from the CMP_SCRIPT_URL variable (never from a form). */
  cmpScriptUrl: string | null;
}

/** https only, no credentials, no spaces or quotes: the CMP script URL from the deployment config. */
export function validScriptUrl(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const value = input.trim();
  if (!/^https:\/\/[A-Za-z0-9.-]+(?::\d+)?\/[^\s"'<>`]*$/.test(value) || value.length > 500) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
  } catch {
    return null;
  }
}

/** What the browser needs to load a live ad. All of it is public: it is in every AdSense ad code. */
export interface AdClientConfig {
  publisherId: string;
  provider: CmpProvider;
  cmpScriptUrl: string | null;
  hideForStaff: boolean;
}

export interface AdsEnvironment {
  appEnv: "local" | "preview" | "production";
  /** ADS_ENABLED="true" in production (AppConfig.adsEnabled). */
  adsEnabledVar: boolean;
}

export interface ReadinessItem {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
}

/**
 * Every switch that must be on before any live ad can load, in the order the
 * owner turns them on. `live` is true only when all of them pass.
 */
export function globalReadiness(env: AdsEnvironment, ads: AdsSettings, consent: ConsentSettings): { live: boolean; items: ReadinessItem[] } {
  const consentOk =
    consent.provider === "google_privacy_messaging" || (consent.provider === "certified_third_party" && consent.cmpScriptUrl !== null);
  const items: ReadinessItem[] = [
    {
      key: "production",
      label: "Running in production",
      ok: env.appEnv === "production",
      detail: env.appEnv === "production" ? "APP_ENV is production." : `APP_ENV is "${env.appEnv}": local and preview never load live ads.`,
    },
    {
      key: "env_switch",
      label: "ADS_ENABLED variable",
      ok: env.adsEnabledVar,
      detail: env.adsEnabledVar ? "ADS_ENABLED is \"true\"." : "ADS_ENABLED isn't \"true\" in the deployment settings (wrangler.jsonc). Only the owner changes it.",
    },
    {
      key: "admin_switch",
      label: "Ads switched on here",
      ok: ads.enabled,
      detail: ads.enabled ? "The switch on this page is on." : "The switch on this page is off.",
    },
    {
      key: "publisher",
      label: "AdSense publisher id",
      ok: ads.publisherId !== null,
      detail: ads.publisherId ? `${ads.publisherId}` : "No publisher id. Copy it from the AdSense account (Account > Settings); it looks like pub- and 16 digits.",
    },
    {
      key: "consent",
      label: "Certified consent platform",
      ok: consentOk,
      detail:
        consent.provider === "none"
          ? "No consent platform chosen, so no ads load anywhere."
          : consent.provider === "google_privacy_messaging"
            ? "Google's Privacy & messaging (set up its messages in the AdSense account)."
            : consent.cmpScriptUrl
              ? `Certified third-party platform, script ${consent.cmpScriptUrl}.`
              : "A third-party platform is chosen but CMP_SCRIPT_URL isn't set in the deployment settings.",
    },
  ];
  return { live: items.every((i) => i.ok), items };
}

// ---------------------------------------------------------------- one page

export interface PlacementConfig {
  placementKey: string;
  adUnitId: string | null;
  format: AdFormat;
  responsive: boolean;
  devices: AdDevices;
  minHeightPx: number;
  enabled: boolean;
}

export interface ExclusionRule {
  kind: "path" | "course" | "page_type";
  pathGlob: string | null;
  courseId: string | null;
  pageType: AdPageType | null;
  reason: string;
}

export interface PageAdContext {
  template: AdTemplate;
  path: string;
  courseId: string | null;
}

export type SlotState =
  | { state: "live"; placement: PlacementConfig }
  /** Not live; a hidden marker the staff-only preview can turn into a labelled box. */
  | { state: "marker"; note: string };

export interface PageAds {
  /** Live ads may load on this page. */
  live: boolean;
  /** Why the page shows no ads (empty when it may). */
  excludedBecause: string | null;
  /** Slot per position, in AD_POSITIONS order, already cut to the cap. Missing = render nothing. */
  slots: Record<string, SlotState>;
}

/** Is a page excluded by the code rules or by one of the admin's exclusions? */
export function exclusionReason(ctx: PageAdContext, exclusions: ExclusionRule[]): string | null {
  const fixed = neverAdReason(ctx.path);
  if (fixed) return `never on ${fixed} pages`;
  for (const rule of exclusions) {
    if (rule.kind === "page_type" && rule.pageType === ctx.template) return rule.reason || `all ${ctx.template} pages are excluded`;
    if (rule.kind === "course" && rule.courseId !== null && rule.courseId === ctx.courseId) return rule.reason || "this course is excluded";
    if (rule.kind === "path" && rule.pathGlob && globMatch(rule.pathGlob, ctx.path)) return rule.reason || `matches ${rule.pathGlob}`;
  }
  return null;
}

/**
 * What one page may show. `available` lists the positions the page can really
 * offer (a short lecture may have no safe in-text break), in template order.
 */
export function decidePageAds(input: {
  ctx: PageAdContext;
  globalLive: boolean;
  ads: AdsSettings;
  placements: PlacementConfig[];
  exclusions: ExclusionRule[];
  available: string[];
}): PageAds {
  const { ctx, globalLive, ads, placements, exclusions, available } = input;
  const excludedBecause = exclusionReason(ctx, exclusions);
  if (excludedBecause) return { live: false, excludedBecause, slots: {} };
  const cap = slotCap(ads, ctx.template);
  const byKey = new Map(placements.map((p) => [p.placementKey, p]));
  const slots: Record<string, SlotState> = {};
  let used = 0;
  for (const { position } of AD_POSITIONS[ctx.template]) {
    if (used >= cap) break;
    if (!available.includes(position)) continue;
    const placement = byKey.get(`${ctx.template}.${position}`);
    if (globalLive && placement && placement.enabled && validAdUnitId(placement.adUnitId)) {
      slots[position] = { state: "live", placement };
    } else {
      slots[position] = {
        state: "marker",
        note: !placement ? "no placement set up" : !placement.enabled ? "placement switched off" : !globalLive ? "ads are off site-wide" : "no ad unit id",
      };
    }
    used += 1;
  }
  return { live: Object.values(slots).some((s) => s.state === "live"), excludedBecause: null, slots };
}

// ---------------------------------------------------------------- lectures

export interface SectionShape {
  /** Words of prose in the section's text (code not counted). */
  words: number;
  /** The section ends with a code box (with Run, output or input), not text. */
  hasCode: boolean;
  /** The section ends with a picture and its download link. */
  hasImage: boolean;
}

/** Rough word count of Markdown prose: code blocks and markup removed. */
export function proseWords(markdown: string | null | undefined): number {
  if (!markdown) return 0;
  const text = markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " x ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_|~-]+/g, " ");
  return text.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
}

export const FIRST_BREAK_MIN_WORDS = 150;
export const SECOND_BREAK_MIN_WORDS = 300;

/**
 * Where a lecture may take an in-text ad: after section index i (0-based).
 * A break is allowed only where the section before ends in text and the
 * section after starts with text, so an ad never touches a code box, its Run
 * button, its output, a picture's download link, or the end of the lecture.
 */
export function lessonAdBreaks(sections: SectionShape[]): { after_first_section: number | null; mid_content: number | null } {
  const safeAfter = (i: number) =>
    i >= 0 && i <= sections.length - 2 && !sections[i]!.hasCode && !sections[i]!.hasImage && sections[i]!.words >= 20 && sections[i + 1]!.words >= 1;
  let words = 0;
  let first: number | null = null;
  let second: number | null = null;
  let since = 0;
  for (let i = 0; i < sections.length; i++) {
    words += sections[i]!.words;
    if (first === null) {
      if (words >= FIRST_BREAK_MIN_WORDS && safeAfter(i)) {
        first = i;
        since = 0;
      }
      continue;
    }
    since += sections[i]!.words;
    if (second === null && i - first >= 3 && i <= sections.length - 3 && since >= SECOND_BREAK_MIN_WORDS && safeAfter(i)) second = i;
  }
  return { after_first_section: first, mid_content: second };
}
