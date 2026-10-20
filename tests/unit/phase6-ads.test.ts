// Phase 6: the advertising rules, as pure functions. Nothing here talks to
// Google; these prove which page may show what, and that every switch has to be
// on before a live ad can load.
import { describe, expect, it } from "vitest";
import {
  AD_POSITIONS,
  AD_TEMPLATES,
  type AdsSettings,
  type ConsentSettings,
  DEFAULT_ADS_SETTINGS,
  FIRST_BREAK_MIN_WORDS,
  HARD_SLOT_CAP,
  NEVER_AD_PATHS,
  type PlacementConfig,
  type SectionShape,
  adsTxtBody,
  decidePageAds,
  exclusionReason,
  globMatch,
  globalReadiness,
  lessonAdBreaks,
  neverAdReason,
  normalizePublisherId,
  parseAdsSettings,
  parsePlacementKey,
  proseWords,
  slotCap,
  validAdUnitId,
  validPathGlob,
  validScriptUrl,
} from "@/lib/ads/policy";
import { describeAction } from "@/lib/admin/audit-text";

const PUB = "pub-1234567890123456"; // test value in the right shape; not a real account
const ON: AdsSettings = { enabled: true, publisherId: PUB, hideForStaff: true, maxSlots: {} };
const GOOGLE: ConsentSettings = { provider: "google_privacy_messaging", cmpScriptUrl: null };
const PROD = { appEnv: "production" as const, adsEnabledVar: true };

function placement(key: string, over: Partial<PlacementConfig> = {}): PlacementConfig {
  return { placementKey: key, adUnitId: "1234567890", format: "auto", responsive: true, devices: "all", minHeightPx: 280, enabled: true, ...over };
}

describe("publisher and ad unit ids", () => {
  it("accepts only pub- and 16 digits (the ca- form too)", () => {
    expect(normalizePublisherId(PUB)).toBe(PUB);
    expect(normalizePublisherId(` ca-${PUB} `)).toBe(PUB);
    for (const bad of ["", "pub-123", "pub-12345678901234567", "pub-123456789012345a", "1234567890123456", `pub-1234567890123456"><script>`, null, 42, undefined]) {
      expect(normalizePublisherId(bad), String(bad)).toBeNull();
    }
  });

  it("ad unit ids are digits only, 6 to 20 of them", () => {
    expect(validAdUnitId("1234567890")).toBe(true);
    for (const bad of ["12345", "123456789012345678901", "12345a", "<script>", " 1234567", "", null]) expect(validAdUnitId(bad), String(bad)).toBe(false);
  });

  it("ads.txt has Google's one line for a real-shaped id and nothing otherwise", () => {
    expect(adsTxtBody(PUB)).toBe(`google.com, ${PUB}, DIRECT, f08c47fec0942fa0\n`);
    expect(adsTxtBody(`ca-${PUB}`)).toBe(`google.com, ${PUB}, DIRECT, f08c47fec0942fa0\n`);
    expect(adsTxtBody(null)).toBeNull();
    expect(adsTxtBody("pub-0000")).toBeNull();
  });
});

describe("positions", () => {
  it("only listed positions parse", () => {
    expect(parsePlacementKey("lesson.after_first_section")).toEqual({ template: "lesson", position: "after_first_section" });
    for (const bad of ["lesson", "lesson.sidebar", "quiz.end", "lesson.end.extra", "", null]) expect(parsePlacementKey(bad), String(bad)).toBeNull();
  });

  it("the hard caps never exceed the positions a page has", () => {
    for (const t of AD_TEMPLATES) expect(HARD_SLOT_CAP[t]).toBeLessThanOrEqual(AD_POSITIONS[t].length);
  });

  it("there is no position on a quiz, exam, account or admin page at all", () => {
    expect(AD_TEMPLATES).toEqual(["home", "course", "lesson", "exercise", "resource"]);
  });
});

describe("path patterns", () => {
  it("* is one segment, ** any number", () => {
    expect(globMatch("/courses/*/quizzes/*", "/courses/cpp/quizzes/final")).toBe(true);
    expect(globMatch("/courses/*/quizzes/*", "/courses/cpp/quizzes")).toBe(false);
    expect(globMatch("/admin/**", "/admin")).toBe(true);
    expect(globMatch("/admin/**", "/admin/ads/placements/x")).toBe(true);
    expect(globMatch("/courses/*/lectures/intro*", "/courses/cpp/lectures/introduction")).toBe(true);
    expect(globMatch("/courses/*/lectures/intro*", "/courses/cpp/lectures/loops")).toBe(false);
  });

  it("ignores the query string, the fragment and a trailing slash", () => {
    expect(globMatch("/login", "/login?next=/dashboard")).toBe(true);
    expect(globMatch("/terms", "/terms/#law")).toBe(true);
  });

  it("stays fast on a hostile pattern", () => {
    const pattern = `/${"**/".repeat(40)}x`;
    const path = `/${"a/".repeat(60)}b`;
    const start = performance.now();
    expect(globMatch(pattern, path)).toBe(false);
    expect(performance.now() - start).toBeLessThan(500);
  });

  it("admin patterns accept only safe characters", () => {
    expect(validPathGlob("/courses/*/exercises/**")).toBe(true);
    for (const bad of ["courses/*", "/a//b", "/a b", "/<script>", "/a?b=1", "/***", "", `/${"a".repeat(200)}`, 7]) expect(validPathGlob(bad), String(bad)).toBe(false);
  });
});

describe("pages that never show ads", () => {
  const never = [
    "/admin",
    "/admin/ads",
    "/api/health",
    "/login",
    "/register",
    "/forgot-password",
    "/dashboard",
    "/dashboard/programming-fundamentals",
    "/settings",
    "/account-deleted",
    "/courses/programming-fundamentals/quizzes/final-quiz",
    "/courses/programming-fundamentals/exams/midterm",
    "/courses/programming-fundamentals/build-exam",
    "/courses/programming-fundamentals/practice/loops",
    "/courses/programming-fundamentals/search",
    "/search",
    "/contact",
    "/privacy-policy",
    "/terms",
    "/cookie-policy",
    "/privacy-choices",
    "/advertising",
  ];
  it.each(never)("%s", (path) => {
    expect(neverAdReason(path)).not.toBeNull();
    expect(decidePageAds({ ctx: { template: "lesson", path, courseId: "c" }, globalLive: true, ads: ON, placements: [placement("lesson.end")], exclusions: [], available: ["end"] }).live).toBe(false);
  });

  it("lectures, questions, course and home pages are not on the list", () => {
    for (const path of ["/", "/courses/programming-fundamentals", "/courses/programming-fundamentals/lectures/loops", "/courses/programming-fundamentals/exercises/q1"]) {
      expect(neverAdReason(path), path).toBeNull();
    }
  });

  it("every fixed rule has a reason", () => {
    for (const rule of NEVER_AD_PATHS) expect(rule.why.length).toBeGreaterThan(0);
  });
});

describe("settings", () => {
  it("anything broken reads as off", () => {
    expect(parseAdsSettings(null)).toEqual(DEFAULT_ADS_SETTINGS);
    expect(parseAdsSettings("on")).toEqual(DEFAULT_ADS_SETTINGS);
    expect(parseAdsSettings({ enabled: "true", publisherId: "pub-1" })).toEqual({ ...DEFAULT_ADS_SETTINGS });
    expect(parseAdsSettings({ hideForStaff: false }).hideForStaff).toBe(false);
  });

  it("a page's limit can be lowered, never raised past the hard cap", () => {
    const s = parseAdsSettings({ maxSlots: { lesson: 9, home: -2, course: 1.5, exercise: 0 } });
    expect(s.maxSlots).toEqual({ lesson: 3, home: 0, exercise: 0 });
    expect(slotCap(s, "lesson")).toBe(3);
    expect(slotCap(s, "course")).toBe(HARD_SLOT_CAP.course);
    expect(slotCap({ ...DEFAULT_ADS_SETTINGS, maxSlots: { lesson: 1 } }, "lesson")).toBe(1);
  });

  it("the CMP script address must be plain https", () => {
    expect(validScriptUrl("https://cmp.example.com/v2/cmp.js?id=1")).toBe("https://cmp.example.com/v2/cmp.js?id=1");
    for (const bad of ["http://cmp.example.com/a.js", "javascript:alert(1)", "https://user:pw@cmp.example.com/a.js", 'https://cmp.example.com/a.js"onload=x', "https://cmp.example.com", "", null]) {
      expect(validScriptUrl(bad), String(bad)).toBeNull();
    }
  });
});

describe("live ads need every switch", () => {
  it("all on: live", () => {
    expect(globalReadiness(PROD, ON, GOOGLE).live).toBe(true);
    expect(globalReadiness(PROD, ON, { provider: "certified_third_party", cmpScriptUrl: "https://cmp.example.com/cmp.js" }).live).toBe(true);
  });

  it.each([
    ["local build", { appEnv: "local" as const, adsEnabledVar: true }, ON, GOOGLE],
    ["preview build", { appEnv: "preview" as const, adsEnabledVar: true }, ON, GOOGLE],
    ["ADS_ENABLED not true", { appEnv: "production" as const, adsEnabledVar: false }, ON, GOOGLE],
    ["admin switch off", PROD, { ...ON, enabled: false }, GOOGLE],
    ["no publisher id", PROD, { ...ON, publisherId: null }, GOOGLE],
    ["no consent platform", PROD, ON, { provider: "none" as const, cmpScriptUrl: null }],
    ["third-party CMP without a script", PROD, ON, { provider: "certified_third_party" as const, cmpScriptUrl: null }],
  ])("%s: not live", (_name, env, ads, consent) => {
    const r = globalReadiness(env, ads, consent);
    expect(r.live).toBe(false);
    expect(r.items.some((i) => !i.ok)).toBe(true);
  });

  it("the default state of a fresh install is off", () => {
    expect(globalReadiness({ appEnv: "local", adsEnabledVar: false }, DEFAULT_ADS_SETTINGS, { provider: "none", cmpScriptUrl: null }).live).toBe(false);
  });
});

describe("one page", () => {
  const lesson = { template: "lesson" as const, path: "/courses/cpp/lectures/loops", courseId: "c_cpp" };
  const all = ["after_first_section", "mid_content", "end"];
  const placements = all.map((p) => placement(`lesson.${p}`));

  it("live: every available position with an enabled placement and a unit id", () => {
    const r = decidePageAds({ ctx: lesson, globalLive: true, ads: ON, placements, exclusions: [], available: all });
    expect(r.live).toBe(true);
    expect(Object.keys(r.slots)).toEqual(all);
    expect(Object.values(r.slots).every((s) => s.state === "live")).toBe(true);
  });

  it("not live site-wide: hidden markers only (what the preview shows)", () => {
    const r = decidePageAds({ ctx: lesson, globalLive: false, ads: ON, placements, exclusions: [], available: all });
    expect(r.live).toBe(false);
    expect(Object.values(r.slots).every((s) => s.state === "marker")).toBe(true);
  });

  it("a switched-off placement, a missing one or a missing unit id stays a marker", () => {
    const r = decidePageAds({
      ctx: lesson,
      globalLive: true,
      ads: ON,
      placements: [placement("lesson.after_first_section", { enabled: false }), placement("lesson.end", { adUnitId: null, enabled: false })],
      exclusions: [],
      available: all,
    });
    expect(r.live).toBe(false);
    expect(r.slots.after_first_section).toEqual({ state: "marker", note: "placement switched off" });
    expect(r.slots.mid_content).toEqual({ state: "marker", note: "no placement set up" });
  });

  it("positions the page can't offer are skipped, and the cap counts from the top", () => {
    const r = decidePageAds({ ctx: lesson, globalLive: true, ads: { ...ON, maxSlots: { lesson: 1 } }, placements, exclusions: [], available: ["mid_content", "end"] });
    expect(Object.keys(r.slots)).toEqual(["mid_content"]);
  });

  it("a cap of 0 removes every slot", () => {
    const r = decidePageAds({ ctx: lesson, globalLive: true, ads: { ...ON, maxSlots: { lesson: 0 } }, placements, exclusions: [], available: all });
    expect(r.slots).toEqual({});
  });

  it("exclusions by path, course and page type", () => {
    const base = { kind: "path" as const, pathGlob: null, courseId: null, pageType: null, reason: "" };
    expect(exclusionReason(lesson, [{ ...base, pathGlob: "/courses/*/lectures/loops" }])).toBe("matches /courses/*/lectures/loops");
    expect(exclusionReason(lesson, [{ ...base, kind: "course", courseId: "c_cpp", reason: "exam week" }])).toBe("exam week");
    expect(exclusionReason(lesson, [{ ...base, kind: "course", courseId: "c_py" }])).toBeNull();
    expect(exclusionReason(lesson, [{ ...base, kind: "page_type", pageType: "lesson" }])).toBe("all lesson pages are excluded");
    const r = decidePageAds({ ctx: lesson, globalLive: true, ads: ON, placements, exclusions: [{ ...base, kind: "course", courseId: "c_cpp" }], available: all });
    expect(r).toEqual({ live: false, excludedBecause: "this course is excluded", slots: {} });
  });
});

describe("in-lecture breaks", () => {
  const text = (words: number): SectionShape => ({ words, hasCode: false, hasImage: false });
  const code = (words: number): SectionShape => ({ words, hasCode: true, hasImage: false });
  const image = (words: number): SectionShape => ({ words, hasCode: false, hasImage: true });

  it("a short lecture gets no in-text break", () => {
    expect(lessonAdBreaks([text(40), text(40), text(40)])).toEqual({ after_first_section: null, mid_content: null });
  });

  it("the first break comes after enough reading, after a text section", () => {
    const r = lessonAdBreaks([text(100), text(60), text(80), text(50)]);
    expect(r.after_first_section).toBe(1);
    expect(100 + 60).toBeGreaterThanOrEqual(FIRST_BREAK_MIN_WORDS);
  });

  it("never right after a code box (its Run button and output) or a picture", () => {
    expect(lessonAdBreaks([code(200), text(50)]).after_first_section).toBeNull();
    expect(lessonAdBreaks([image(200), text(50)]).after_first_section).toBeNull();
    expect(lessonAdBreaks([text(100), code(80), text(60), text(40)]).after_first_section).toBe(2);
  });

  it("never as the last thing, and not before a section with no text", () => {
    expect(lessonAdBreaks([text(300)]).after_first_section).toBeNull();
    expect(lessonAdBreaks([text(300), { words: 0, hasCode: true, hasImage: false }]).after_first_section).toBeNull();
  });

  it("the second break is 3+ sections and 300+ words later, and not in the last two sections", () => {
    const many = [text(160), text(120), text(120), text(120), text(120), text(120), text(120)];
    const r = lessonAdBreaks(many);
    expect(r.after_first_section).toBe(0);
    expect(r.mid_content).toBe(3);
    expect(r.mid_content! - r.after_first_section!).toBeGreaterThanOrEqual(3);
    expect(r.mid_content!).toBeLessThanOrEqual(many.length - 3);
    // Same reading spread over too few sections: no second break.
    expect(lessonAdBreaks([text(160), text(400), text(400), text(10), text(10)]).mid_content).toBeNull();
  });

  it("counts prose, not code or markup", () => {
    expect(proseWords("Loops **repeat** work.\n\n```cpp\nfor (int i = 0; i < 3; i++) {}\n```\n\n- one\n- two")).toBe(5);
    expect(proseWords("![diagram](a.png) See [the docs](https://x.y) here.")).toBe(4);
    expect(proseWords(null)).toBe(0);
  });
});

describe("audit log wording for the new areas", () => {
  it.each([
    ["ads.settings", "site_settings", "changed the site settings"],
    ["consent.update", "consent_configuration", "edited the consent settings"],
    ["ads.placement.create", "ad_placement", "created the ad placement"],
    ["ads.placement.enable", "ad_placement", "enabled the ad placement"],
    ["ads.placement.disable", "ad_placement", "disabled the ad placement"],
    ["ads.exclusion.delete", "ad_exclusion", "deleted the ad exclusion"],
    ["site.owner_update", "site_settings", "changed the site settings"],
    ["contact.archived", "contact_message", "archived the contact message"],
    ["contact.delete", "contact_message", "deleted the contact message"],
  ])("%s", (action, entity, text) => {
    expect(describeAction(action, entity)).toBe(text);
  });
});
