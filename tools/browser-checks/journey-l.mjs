/* global document, window, PerformanceObserver -- used inside page.evaluate, which runs in the browser */
// L (Phase 6): the live-ad path, end to end, WITHOUT contacting Google. The
// site runs locally in production mode with ADS_ENABLED=true, and every request
// to Google's ad script is answered by a stand-in script inside the browser
// (Playwright route interception). The stand-in fills each ad box with a grey
// 250 px block, or marks it "unfilled" for ad unit 9999999999. Nothing here
// proves that real AdSense ads will serve; it proves what this site does
// around them.
//
// Start the build in production mode first (see tools/browser-checks/README.md):
//   npx wrangler dev --config dist/server/wrangler.json --persist-to .wrangler/state --port 8788 \
//     --var APP_ENV:production --var ADS_ENABLED:true --var PUBLIC_SITE_URL:http://localhost:8788 \
//     [--var CMP_SCRIPT_URL:https://cmp.stub.invalid/cmp.js]
// Usage: BASE_URL=http://localhost:8788 ADMIN_EMAIL=… ADMIN_PASSWORD=… [CMP=third-party] node tools/browser-checks/journey-l.mjs
import { BASE, launch, newContext, record, saveLog, shot, signIn } from "./lib.mjs";

const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to a local administrator account.");
const THIRD_PARTY = process.env.CMP === "third-party";
const PUB = "pub-1234567890123456"; // right shape for the validators; not a real AdSense account
const C = "programming-fundamentals";

const STUB_ADSENSE = `(function () {
  window.__stubAdsenseLoads = (window.__stubAdsenseLoads || 0) + 1;
  var queued = Array.isArray(window.adsbygoogle) ? window.adsbygoogle : [];
  function fill() {
    document.querySelectorAll("ins.adsbygoogle:not([data-stub])").forEach(function (ins) {
      ins.setAttribute("data-stub", "1");
      if (ins.getAttribute("data-ad-slot") === "9999999999") { ins.setAttribute("data-ad-status", "unfilled"); return; }
      var d = document.createElement("div"); d.style.height = "250px"; d.style.background = "#ccc"; d.textContent = "STAND-IN AD (not Google)";
      ins.appendChild(d); ins.setAttribute("data-ad-status", "filled");
    });
  }
  window.adsbygoogle = { push: function () { setTimeout(fill, 50); }, loaded: true };
  if (queued.length) setTimeout(fill, 50);
  var fc = window.googlefc || {}; var q = fc.callbackQueue || [];
  fc.showRevocationMessage = function () { window.__stubRevocationShown = true; };
  fc.callbackQueue = { push: function (f) { f(); } };
  window.googlefc = fc; q.forEach(function (f) { f(); });
})();`;

// A TCF CMP stand-in: answers "tcloaded" after 300 ms, or never with ?cmp=silent.
const STUB_CMP = (silent) => `(function () {
  window.__stubCmpLoads = (window.__stubCmpLoads || 0) + 1;
  window.__tcfapi = function (cmd, v, cb) {
    if (cmd === "addEventListener" && !${silent}) setTimeout(function () { cb({ eventStatus: "tcloaded", gdprApplies: true, listenerId: 1 }, true); }, 300);
    if (cmd === "displayConsentUi") window.__stubCmpUiShown = true;
  };
})();`;

const AD_HOSTS = /googlesyndication|doubleclick|googleadservices|adservice\.google|fundingchoicesmessages/;

async function stubbedPage(browser, opts = {}, { silentCmp = false } = {}) {
  const ctx = await newContext(browser, opts);
  const seen = { adsense: 0, cmp: 0, other: [] };
  await ctx.context.route(/https:\/\/pagead2\.googlesyndication\.com\/.*/, (route) => {
    seen.adsense += 1;
    return route.fulfill({ status: 200, contentType: "application/javascript", body: STUB_ADSENSE });
  });
  await ctx.context.route(/https:\/\/cmp\.stub\.invalid\/.*/, (route) => {
    seen.cmp += 1;
    return route.fulfill({ status: 200, contentType: "application/javascript", body: STUB_CMP(silentCmp) });
  });
  ctx.page.on("request", (r) => {
    if (AD_HOSTS.test(r.url()) && !/pagead2\.googlesyndication\.com/.test(r.url())) seen.other.push(r.url());
  });
  return { ...ctx, seen };
}

const browser = await launch();

// ---------------------------------------------------------------- set up through the admin
const { context: adminCtx, page: admin } = await newContext(browser);
await signIn(admin, ADMIN.email, ADMIN.password, "/admin/ads");
async function saveSettings({ enabled, publisherId, hideForStaff = true }) {
  await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
  await admin.fill("#publisherId", publisherId);
  const box = admin.getByLabel("Switch ads on");
  if (enabled) await box.check();
  else await box.uncheck();
  const staff = admin.getByLabel(/Never show live ads to signed-in staff/);
  if (hideForStaff) await staff.check();
  else await staff.uncheck();
  await admin.getByRole("button", { name: "Save ad settings" }).click();
  await admin.getByText("Saved").first().waitFor({ timeout: 10000 });
}
async function setProvider(label) {
  await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
  await admin.getByLabel(label).check();
  await admin.getByRole("button", { name: "Save consent settings" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
}
const created = [];
async function addPlacement(key, unit) {
  await admin.goto(`${BASE}/admin/ads/placements/new`, { waitUntil: "networkidle" });
  await admin.selectOption("#placementKey", key);
  await admin.fill("#adUnitId", unit);
  await admin.getByLabel("Placement on").check();
  await admin.getByRole("button", { name: "Create placement" }).click();
  await admin.waitForURL(/\/admin\/ads\/placements\/adp_/, { timeout: 15000 });
  created.push(admin.url());
}

await saveSettings({ enabled: true, publisherId: PUB });
await setProvider(THIRD_PARTY ? "Another Google-certified CMP" : "Google Privacy & messaging (set up in AdSense)");
await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
const noPlacementsYet = await admin.getByRole("heading", { name: "Live ads can load" }).count();
record("L0", `checklist passes in production mode with ${THIRD_PARTY ? "a third-party CMP" : "Google's CMP"}`, noPlacementsYet === 1);
await addPlacement("lesson.after_first_section", "1234567890");
await addPlacement("lesson.mid_content", "1234567891");
await addPlacement("lesson.end", "9999999999"); // the stand-in leaves this one unfilled
await addPlacement("home.after_courses", "1234567892");
await addPlacement("exercise.below_question", "1234567893");

// A long lecture with in-text breaks.
await admin.goto(`${BASE}/courses/${C}`, { waitUntil: "networkidle" });
const lectures = await admin.locator(`a[href^="/courses/${C}/lectures/"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
const LECTURE = lectures[Math.min(4, lectures.length - 1)];

// ---------------------------------------------------------------- L1 a visitor sees labelled ads in the fixed places
{
  const { context, page, problems, seen } = await stubbedPage(browser, { viewport: { width: 390, height: 860 } });
  await page.goto(`${BASE}${LECTURE}`, { waitUntil: "networkidle" });
  if (THIRD_PARTY) await page.waitForTimeout(800);
  await page.waitForTimeout(800);
  const units = await page.locator("aside.ad-slot").evaluateAll((els) =>
    els.map((el) => ({
      key: el.getAttribute("data-placement"),
      label: el.querySelector(".ad-slot__label")?.textContent,
      client: el.querySelector("ins")?.getAttribute("data-ad-client"),
      slot: el.querySelector("ins")?.getAttribute("data-ad-slot"),
      h: Math.round(el.getBoundingClientRect().height),
    })),
  );
  record("L1", "lecture: the ad script is requested once (stand-in), only after consent handling", seen.adsense === 1 && (!THIRD_PARTY || seen.cmp === 1), `adsense ${seen.adsense}, cmp ${seen.cmp}`);
  record("L1", "each live unit is labelled \"Advertisement\" with the right client and unit", units.length >= 1 && units.every((u) => u.label === "Advertisement" && u.client === `ca-${PUB}` && /^\d+$/.test(u.slot)), JSON.stringify(units));
  record("L1", "an unfilled unit folds away (lesson.end, unit 9999999999)", !units.some((u) => u.key === "lesson.end"), units.map((u) => u.key).join(", "));
  const neighbours = await page.evaluate(() =>
    [...document.querySelectorAll(".ad-gap")]
      .filter((gap) => gap.previousElementSibling?.classList.contains("lesson-section"))
      .map((gap) => ({ prevHasCode: Boolean(gap.previousElementSibling.querySelector("button, figure, pre, .lec-stage")) })),
  );
  record("L1", "live in-text ads never follow a code box, Run button or picture", neighbours.every((n) => !n.prevHasCode), JSON.stringify(neighbours));
  await page.locator("aside.ad-slot").first().scrollIntoViewIfNeeded();
  await shot(page, `l1-lecture-live-standin-${THIRD_PARTY ? "tcf" : "google"}`);
  // The lecture's program still compiles and runs next to ads (the first stage with a Run button).
  const stages = page.locator("figure.lec-stage");
  const idx = await stages.evaluateAll((els) => els.findIndex((e) => e.querySelector('button[aria-label^="Run the code"]')));
  if (idx >= 0) {
    const stage = stages.nth(idx);
    await stage.scrollIntoViewIfNeeded();
    await stage.locator(".lec-run").click();
    const status = await stage
      .locator(".lec-status", { hasText: /Ran in your browser|Compiled in|couldn't start|Stopped|error/i })
      .textContent({ timeout: 120000 })
      .catch(() => "");
    const out = ((await stage.locator(".lec-output").textContent().catch(() => "")) ?? "").trim();
    record("L1", "a lecture program still runs with ads on the page", /Ran in your browser|Compiled in \d+ ms and ran/.test(status ?? ""), `status "${(status ?? "").trim()}"; output "${out.slice(0, 40)}"`);
  }
  record("L1", "no other Google ad host was contacted", seen.other.length === 0, seen.other.slice(0, 2).join(", "));
  record("L1", "no console or page errors", problems.length === 0, problems.slice(0, 3).join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- L2 never on these pages
{
  const { context, page, seen } = await stubbedPage(browser);
  for (const path of ["/login", "/register", `/courses/${C}/quizzes`, `/courses/${C}/build-exam`, "/privacy-policy", "/contact", "/search"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
  }
  record("L2", "sign-in, quizzes, build-your-own exam, legal, contact and search pages load no ad script", seen.adsense === 0 && seen.cmp === 0, `adsense ${seen.adsense}, cmp ${seen.cmp}`);
  await context.close();
}

// ---------------------------------------------------------------- L3 staff never get live ads
{
  const { context, page, seen } = await stubbedPage(browser);
  await signIn(page, ADMIN.email, ADMIN.password, "/admin");
  // "load", not "networkidle": a signed-in administrator's header prefetches admin pages, which can keep the network busy.
  await page.goto(`${BASE}${LECTURE}`, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  record("L3", "a signed-in administrator gets no ad script and no ad box", seen.adsense === 0 && (await page.locator("aside.ad-slot").count()) === 0, `adsense ${seen.adsense}`);
  await context.close();
}

// ---------------------------------------------------------------- L4 layout shift with ads loading
{
  const { context, page } = await stubbedPage(browser, { viewport: { width: 390, height: 860 } });
  await page.addInitScript(() => {
    window.__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
  });
  await page.goto(`${BASE}${LECTURE}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const cls = await page.evaluate(() => window.__cls);
  record("L4", "layout shift while stand-in ads load (local lab, one run, not field data)", cls <= 0.1 ? true : "WARN", `CLS ${cls.toFixed(4)}`);
  await context.close();
}

// ---------------------------------------------------------------- L5 privacy choices re-opens the consent tool
{
  const { context, page, seen } = await stubbedPage(browser);
  await page.goto(`${BASE}/privacy-choices`, { waitUntil: "networkidle" });
  record("L5", "nothing loads on the privacy choices page before the click", seen.adsense === 0 && seen.cmp === 0);
  await page.getByRole("button", { name: "Change my ad privacy choices" }).click();
  await page.getByText("The consent window should now be open.").waitFor({ timeout: 15000 });
  const opened = await page.evaluate(() => (window.__stubRevocationShown ? "google" : window.__stubCmpUiShown ? "tcf" : null));
  record("L5", "the button asks the consent tool to show its choices again", opened === (THIRD_PARTY ? "tcf" : "google"), String(opened));
  await context.close();
}

// ---------------------------------------------------------------- L6 a third-party CMP that never answers
if (THIRD_PARTY) {
  const { context, page, seen } = await stubbedPage(browser, {}, { silentCmp: true });
  await page.goto(`${BASE}${LECTURE}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(11000);
  record("L6", "a CMP that never reports a decision: no ad script after 10 s, boxes removed", seen.cmp === 1 && seen.adsense === 0 && (await page.locator("aside.ad-slot").count()) === 0, `cmp ${seen.cmp}, adsense ${seen.adsense}`);
  await context.close();
}

// ---------------------------------------------------------------- L7 search engines, verification tags
{
  const { context, page } = await newContext(browser);
  const sitemap = await (await page.request.get(`${BASE}/sitemap.xml`)).text();
  record("L7", "sitemap lists the legal and contact pages, not privacy choices", ["/privacy-policy", "/terms", "/cookie-policy", "/advertising", "/contact"].every((p) => sitemap.includes(`${BASE}${p}<`)) && !sitemap.includes("/privacy-choices"));
  const robots = await (await page.request.get(`${BASE}/robots.txt`)).text();
  record("L7", "robots.txt keeps admin, API and personal pages out", /Disallow: \/admin/.test(robots) && /Disallow: \/dashboard/.test(robots));
  await admin.goto(`${BASE}/admin/site`, { waitUntil: "networkidle" });
  await admin.fill("#searchConsoleToken", "browserCheckToken_123");
  await admin.getByLabel("Add the AdSense site-ownership meta tag to the home page").check();
  await admin.getByRole("button", { name: "Save site details" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  await page.goto(`${BASE}/`);
  const gsv = await page.locator('meta[name="google-site-verification"]').getAttribute("content");
  const gaa = await page.locator('meta[name="google-adsense-account"]').getAttribute("content");
  record("L7", "home page carries the owner's verification tags", gsv === "browserCheckToken_123" && gaa === `ca-${PUB}`, `${gsv} / ${gaa}`);
  await admin.fill("#searchConsoleToken", "");
  await admin.getByLabel("Add the AdSense site-ownership meta tag to the home page").uncheck();
  await admin.getByRole("button", { name: "Save site details" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  await context.close();
}

// ---------------------------------------------------------------- L8 preview is staff-only in production
{
  // The course page's position has no placement, so it is a marker that ?ad-preview=1 can turn into a box.
  const { context, page } = await stubbedPage(browser);
  await page.goto(`${BASE}/courses/${C}?ad-preview=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const visitorBoxes = await page.locator(".ad-preview").count();
  await context.close();
  await admin.goto(`${BASE}/courses/${C}?ad-preview=1`, { waitUntil: "load" });
  await admin.locator(".ad-preview").first().waitFor({ timeout: 10000 }).catch(() => undefined);
  const staffBoxes = await admin.locator(".ad-preview").count();
  record("L8", "production: ?ad-preview=1 shows boxes to signed-in staff only", visitorBoxes === 0 && staffBoxes >= 1, `visitor ${visitorBoxes}, staff ${staffBoxes}`);
}

// ---------------------------------------------------------------- put everything back
for (const url of created) {
  await admin.goto(url, { waitUntil: "networkidle" });
  await admin.getByRole("button", { name: "Delete placement" }).click();
  await admin.getByRole("button", { name: "Delete", exact: true }).click();
  await admin.waitForURL(`${BASE}/admin/ads`, { timeout: 15000 });
}
await saveSettings({ enabled: false, publisherId: "" });
await setProvider("None yet");
await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
record("L9", "settings put back: ads off, no placements", (await admin.getByRole("heading", { name: "Ads are off" }).count()) === 1 && (await admin.getByText("not set up").count()) >= 8);
await adminCtx.close();
await browser.close();
saveLog(`journey-l-${THIRD_PARTY ? "tcf" : "google"}`);
