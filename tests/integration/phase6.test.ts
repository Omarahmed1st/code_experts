// Phase 6 against a real (local) D1: the advertising and site admin services,
// who may use them, what they refuse, what they audit; pageAds in a non-
// production build; /ads.txt; the contact form's spam protection; and the
// migration that rebuilt ad_placements and ad_exclusions.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as adsTxtGET } from "@/app/ads.txt/route";
import { createExclusion, createPlacement, deleteExclusion, deletePlacement, freePositions, saveAdsSettings, saveConsent, updatePlacement } from "@/server/admin/ads";
import { listAudit } from "@/server/admin/audit";
import type { Actor } from "@/server/admin/context";
import { countNewMessages, deleteContactMessage, listContactMessages, saveSiteOwner, setMessageStatus } from "@/server/admin/site";
import { adClientForConsent, getAdsReadiness, getAdsSettings, getConsentSettings, listExclusions, listPlacements, pageAds } from "@/server/ads/settings";
import { CONTACT_LIMIT, submitContact } from "@/server/contact";
import { getSiteOwner } from "@/server/site/owner";
import { makeStaff } from "./admin-helpers";
import { errorOf, migrate, resetAndSeed } from "./db-helpers";

const PUB = "pub-1234567890123456"; // right shape for the validators; not a real AdSense account

let admin: Actor;
let editor: Actor;
let courseAdmin: Actor;

beforeAll(async () => {
  await migrate();
});

beforeEach(async () => {
  await resetAndSeed();
  await env.DB.prepare("DELETE FROM admin_audit_logs").run();
  await env.DB.prepare("UPDATE consent_configuration SET cmp_provider = 'none', cmp_settings = '{}', privacy_choices_link = 1").run();
  admin = await makeStaff("adm", "admin");
  editor = await makeStaff("ed", "editor", { c_cpp: "editor" });
  courseAdmin = await makeStaff("ca", "editor", { c_cpp: "course_admin" });
});

async function audit(): Promise<{ action: string; actor: string | null; before: string | null; after: string | null; ip: string | null }[]> {
  const { results } = await env.DB.prepare(
    "SELECT action, actor_user_id AS actor, before_state AS before, after_state AS after, ip_address AS ip FROM admin_audit_logs ORDER BY created_at, rowid",
  ).all<{ action: string; actor: string | null; before: string | null; after: string | null; ip: string | null }>();
  return results;
}

const placementInput = (over: Record<string, unknown> = {}) => ({
  placementKey: "lesson.end",
  adUnitId: "1234567890",
  format: "auto",
  responsive: true,
  devices: "all",
  minHeightPx: 280,
  enabled: false,
  description: "",
  ...over,
});

describe("only administrators change advertising, consent and site details", () => {
  it("editors and course admins are refused and nothing is written", async () => {
    for (const actor of [editor, courseAdmin]) {
      expect((await saveAdsSettings(actor, { enabled: false, publisherId: PUB })).ok).toBe(false);
      expect((await saveConsent(actor, { provider: "google_privacy_messaging" })).ok).toBe(false);
      expect((await createPlacement(actor, placementInput())).ok).toBe(false);
      expect((await createExclusion(actor, { kind: "page_type", pageType: "lesson" })).ok).toBe(false);
      expect((await saveSiteOwner(actor, { operatorName: "X" })).ok).toBe(false);
      expect(await listContactMessages(actor, "open")).toEqual([]);
    }
    expect((await getAdsSettings()).publisherId).toBeNull();
    expect((await getConsentSettings()).provider).toBe("none");
    expect(await listPlacements()).toEqual([]);
    expect(await listExclusions()).toEqual([]);
    expect(await audit()).toEqual([]);
  });
});

describe("ad settings", () => {
  it("refuse a malformed publisher id, and switching on without one", async () => {
    const bad = await saveAdsSettings(admin, { publisherId: "pub-123<script>" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.fieldErrors?.publisherId).toBeTruthy();
    const noId = await saveAdsSettings(admin, { enabled: true, publisherId: "" });
    expect(noId.ok).toBe(false);
    if (!noId.ok) expect(noId.fieldErrors?.enabled).toBeTruthy();
    const over = await saveAdsSettings(admin, { publisherId: PUB, maxSlots: { lesson: 4 } });
    expect(over.ok).toBe(false);
    expect(await audit()).toEqual([]);
  });

  it("save, read back and audit with before and after", async () => {
    const r = await saveAdsSettings(admin, { enabled: true, publisherId: `ca-${PUB}`, hideForStaff: true, maxSlots: { lesson: 2, home: "" } });
    expect(r.ok).toBe(true);
    expect(await getAdsSettings()).toEqual({ enabled: true, publisherId: PUB, hideForStaff: true, maxSlots: { lesson: 2 } });
    const log = await audit();
    expect(log.map((l) => l.action)).toEqual(["ads.settings"]);
    expect(log[0]!.actor).toBe("adm");
    expect(log[0]!.ip).toBe("203.0.113.9");
    expect(JSON.parse(log[0]!.before!)).toMatchObject({ enabled: false, publisherId: null });
    expect(JSON.parse(log[0]!.after!)).toMatchObject({ enabled: true, publisherId: PUB });
  });

  it("consent: only listed platforms; the script address can't be set from the admin", async () => {
    expect((await saveConsent(admin, { provider: "my-own-banner" })).ok).toBe(false);
    expect((await saveConsent(admin, { provider: "certified_third_party", notes: "x", cmpScriptUrl: "https://evil.example/x.js" } as never)).ok).toBe(true);
    const consent = await getConsentSettings();
    expect(consent.provider).toBe("certified_third_party");
    expect(consent.cmpScriptUrl).toBeNull(); // only CMP_SCRIPT_URL in the deployment sets it
    expect((await audit()).map((l) => l.action)).toEqual(["consent.update"]);
  });
});

describe("placements", () => {
  it("refuse unknown positions, non-digit unit ids and 'on' without a unit id", async () => {
    for (const input of [
      placementInput({ placementKey: "quiz.end" }),
      placementInput({ placementKey: "lesson.sidebar" }),
      placementInput({ adUnitId: '123456"><script>alert(1)</script>' }),
      placementInput({ adUnitId: "", enabled: true }),
      placementInput({ minHeightPx: 5000 }),
      placementInput({ devices: "tv" }),
    ]) {
      expect((await createPlacement(admin, input)).ok, JSON.stringify(input)).toBe(false);
    }
    expect(await listPlacements()).toEqual([]);
    // The database refuses it too.
    expect(await errorOf("INSERT INTO ad_placements (id, placement_key, page_type, ad_unit_id) VALUES ('p', 'lesson.end', 'lesson', '12345x7')")).toMatch(/CHECK/);
    expect(await errorOf("INSERT INTO ad_placements (id, placement_key, page_type, enabled) VALUES ('p', 'lesson.end', 'lesson', 1)")).toMatch(/CHECK/);
  });

  it("create, switch on, switch off and delete, each audited", async () => {
    const created = await createPlacement(admin, placementInput());
    expect(created.ok).toBe(true);
    const id = created.ok ? created.value.id : "";
    expect((await createPlacement(admin, placementInput())).ok).toBe(false); // one placement per position
    expect((await freePositions()).some((p) => p.key === "lesson.end")).toBe(false);
    expect((await updatePlacement(admin, id, placementInput({ enabled: true }))).ok).toBe(true);
    expect((await listPlacements())[0]).toMatchObject({ placementKey: "lesson.end", enabled: true, adUnitId: "1234567890" });
    // The position of an existing placement can't be moved by editing it.
    expect((await updatePlacement(admin, id, placementInput({ placementKey: "home.after_courses", enabled: false }))).ok).toBe(true);
    expect((await listPlacements())[0]!.placementKey).toBe("lesson.end");
    expect((await deletePlacement(admin, id)).ok).toBe(true);
    expect((await deletePlacement(admin, id)).ok).toBe(false);
    expect((await audit()).map((l) => l.action)).toEqual(["ads.placement.create", "ads.placement.enable", "ads.placement.disable", "ads.placement.delete"]);
  });
});

describe("exclusions", () => {
  it("refuse unsafe patterns, unknown courses and duplicates", async () => {
    expect((await createExclusion(admin, { kind: "path", pathGlob: "/courses/<script>" })).ok).toBe(false);
    expect((await createExclusion(admin, { kind: "path", pathGlob: "courses/*" })).ok).toBe(false);
    expect((await createExclusion(admin, { kind: "course", courseId: "c_nope" })).ok).toBe(false);
    expect((await createExclusion(admin, { kind: "page_type", pageType: "quiz" })).ok).toBe(false);
    expect((await createExclusion(admin, { kind: "everything" })).ok).toBe(false);
    expect((await createExclusion(admin, { kind: "path", pathGlob: "/courses/*/lectures/intro", reason: "short" })).ok).toBe(true);
    expect((await createExclusion(admin, { kind: "path", pathGlob: "/courses/*/lectures/intro" })).ok).toBe(false);
  });

  it("each kind applies to pageAds, and removing one is audited", async () => {
    const path = await createExclusion(admin, { kind: "path", pathGlob: "/courses/python/lectures/**" });
    const course = await createExclusion(admin, { kind: "course", courseId: "c_cpp", reason: "exam week" });
    await createExclusion(admin, { kind: "page_type", pageType: "resource" });
    expect((await pageAds({ template: "lesson", path: "/courses/python/lectures/for-loops", courseId: "c_py" }, ["end"])).excludedBecause).toBe("matches /courses/python/lectures/**");
    expect((await pageAds({ template: "exercise", path: "/courses/cpp/exercises/q1", courseId: "c_cpp" }, ["below_question"])).excludedBecause).toBe("exam week");
    expect((await pageAds({ template: "resource", path: "/courses/computer-vision/resources/lecture-1", courseId: "c_cv" }, ["below_description"])).excludedBecause).toBe("all resource pages are excluded");
    expect((await pageAds({ template: "lesson", path: "/courses/computer-vision/lectures/for-loops", courseId: "c_cv" }, ["end"])).excludedBecause).toBeNull();
    if (path.ok) expect((await deleteExclusion(admin, path.value.id)).ok).toBe(true);
    if (course.ok) expect((await deleteExclusion(editor, course.value.id)).ok).toBe(false);
    expect((await audit()).map((l) => l.action)).toEqual(["ads.exclusion.create", "ads.exclusion.create", "ads.exclusion.create", "ads.exclusion.delete"]);
    // Deleting a course removes its exclusions (ON DELETE CASCADE).
    await env.DB.prepare("DELETE FROM courses WHERE id = 'c_cpp'").run();
    expect((await listExclusions()).some((e) => e.kind === "course")).toBe(false);
  });
});

describe("a local build never shows live ads", () => {
  it("even with every admin setting on", async () => {
    await saveAdsSettings(admin, { enabled: true, publisherId: PUB });
    await saveConsent(admin, { provider: "google_privacy_messaging" });
    const created = await createPlacement(admin, placementInput({ enabled: true }));
    expect(created.ok).toBe(true);
    const readiness = await getAdsReadiness();
    expect(readiness.live).toBe(false);
    expect(readiness.items.filter((i) => !i.ok).map((i) => i.key)).toEqual(["production", "env_switch"]);
    const ads = await pageAds({ template: "lesson", path: "/courses/cpp/lectures/for-loops", courseId: "c_cpp" }, ["after_first_section", "end"]);
    expect(ads.live).toBe(false);
    expect(ads.client).toBeNull();
    expect(ads.slots.end).toEqual({ state: "marker", note: "ads are off site-wide" });
    expect(ads.slots.after_first_section).toEqual({ state: "marker", note: "no placement set up" });
    expect(await adClientForConsent()).toBeNull();
  });

  it("quiz, exam and account pages get nothing at all", async () => {
    for (const path of ["/courses/cpp/quizzes/quiz-1", "/courses/cpp/exams/midterm", "/dashboard", "/login", "/admin/ads"]) {
      const ads = await pageAds({ template: "lesson", path, courseId: "c_cpp" }, ["after_first_section", "mid_content", "end"]);
      expect(ads.slots, path).toEqual({});
      expect(ads.excludedBecause, path).toMatch(/^never on /);
    }
  });

  it("a broken settings row reads as off instead of breaking the page", async () => {
    await env.DB.prepare("INSERT INTO site_settings (key, value) VALUES ('ads', '{\"enabled\":\"yes\",\"publisherId\":\"pub-1\"}')").run();
    expect(await getAdsSettings()).toEqual({ enabled: false, publisherId: null, hideForStaff: true, maxSlots: {} });
  });
});

describe("/ads.txt", () => {
  it("is a 404 until a publisher id exists, then Google's line as text/plain", async () => {
    const before = await adsTxtGET();
    expect(before.status).toBe(404);
    expect(before.headers.get("Content-Type")).toMatch(/^text\/plain/);
    await saveAdsSettings(admin, { enabled: false, publisherId: PUB });
    const after = await adsTxtGET();
    expect(after.status).toBe(200);
    expect(after.headers.get("Content-Type")).toBe("text/plain; charset=utf-8");
    expect(await after.text()).toBe(`google.com, ${PUB}, DIRECT, f08c47fec0942fa0\n`);
  });
});

describe("site details", () => {
  it("validate, refuse 'reviewed' without the facts, save and audit", async () => {
    expect((await saveSiteOwner(admin, { contactEmail: "nope" })).ok).toBe(false);
    expect((await saveSiteOwner(admin, { effectiveDate: "1/2/2026" })).ok).toBe(false);
    expect((await saveSiteOwner(admin, { searchConsoleToken: '"><script>' })).ok).toBe(false);
    expect((await saveSiteOwner(admin, { legalReviewed: true })).ok).toBe(false);
    expect((await getSiteOwner()).legalReviewed).toBe(false);
    const ok = await saveSiteOwner(admin, { operatorName: "Test Owner", contactEmail: "owner@example.org", country: "Egypt", effectiveDate: "2026-11-01", legalReviewed: true });
    expect(ok.ok).toBe(true);
    expect(await getSiteOwner()).toMatchObject({ operatorName: "Test Owner", contactEmail: "owner@example.org", legalReviewed: true });
    expect((await audit()).map((l) => l.action)).toEqual(["site.owner_update"]);
  });
});

describe("contact form", () => {
  const good = { name: "Sara", email: "sara@example.org", subject: "A mistake in a lecture or question", body: "The output in the loops lecture is wrong.", trap: "", turnstileToken: null };
  const now = Date.UTC(2026, 9, 15, 12);

  it("checks the fields", async () => {
    const r = await submitContact({ ...good, email: "x", subject: "Hi", body: "short", shownAt: now - 10_000, ip: "198.51.100.1" }, now);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.fieldErrors ?? {}).sort()).toEqual(["body", "email", "subject"]);
  });

  it("bots (hidden field filled, or sent too fast) get a quiet 'ok' and nothing is stored", async () => {
    expect(await submitContact({ ...good, trap: "http://spam.example", shownAt: now - 10_000, ip: "198.51.100.1" }, now)).toEqual({ ok: true });
    expect(await submitContact({ ...good, shownAt: now - 500, ip: "198.51.100.1" }, now)).toEqual({ ok: true });
    expect(await submitContact({ ...good, shownAt: "not a time", ip: "198.51.100.1" }, now)).toEqual({ ok: true });
    expect(await countNewMessages()).toBe(0);
  });

  it(`stores a real message and allows ${CONTACT_LIMIT.max} per network per hour`, async () => {
    for (let i = 0; i < CONTACT_LIMIT.max; i++) {
      expect((await submitContact({ ...good, shownAt: now - 10_000, ip: "198.51.100.7" }, now + i)).ok).toBe(true);
    }
    const blocked = await submitContact({ ...good, shownAt: now - 10_000, ip: "198.51.100.7" }, now + 10);
    expect(blocked.ok).toBe(false);
    expect((await submitContact({ ...good, shownAt: now - 10_000, ip: "198.51.100.8" }, now + 11)).ok).toBe(true);
    expect((await submitContact({ ...good, shownAt: now + CONTACT_LIMIT.windowMs, ip: "198.51.100.7" }, now + CONTACT_LIMIT.windowMs + 5_000)).ok).toBe(true);
    expect(await countNewMessages()).toBe(CONTACT_LIMIT.max + 2);
  });

  it("the inbox: read, archive, delete; audited without the message text", async () => {
    await submitContact({ ...good, shownAt: now - 10_000, ip: "198.51.100.9" }, now);
    const [message] = await listContactMessages(admin, "open");
    expect(message).toMatchObject({ name: "Sara", email: "sara@example.org", status: "new" });
    expect((await setMessageStatus(editor, message!.id, "read")).ok).toBe(false);
    expect((await setMessageStatus(admin, message!.id, "bogus")).ok).toBe(false);
    expect((await setMessageStatus(admin, message!.id, "read")).ok).toBe(true);
    expect((await setMessageStatus(admin, message!.id, "archived")).ok).toBe(true);
    expect(await listContactMessages(admin, "open")).toEqual([]);
    expect(await listContactMessages(admin, "archived")).toHaveLength(1);
    expect((await deleteContactMessage(admin, message!.id)).ok).toBe(true);
    expect((await deleteContactMessage(admin, message!.id)).ok).toBe(false);
    const log = await audit();
    expect(log.map((l) => l.action)).toEqual(["contact.read", "contact.archived", "contact.delete"]);
    expect(JSON.stringify(log)).not.toContain("loops lecture");
  });
});

describe("audit log filter", () => {
  it("actionPrefixes keeps only the matching areas", async () => {
    await saveAdsSettings(admin, { publisherId: PUB });
    await saveConsent(admin, { provider: "google_privacy_messaging" });
    await saveSiteOwner(admin, { operatorName: "Test Owner" });
    const rows = await listAudit({ courseIds: null, actionPrefixes: ["ads.", "consent."] });
    expect(rows.map((r) => r.action).sort()).toEqual(["ads.settings", "consent.update"]);
  });
});
