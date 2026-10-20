/* global document, window -- used inside page.evaluate, which runs in the browser */
// K (Phase 6): advertising stays off, the staff preview, the admin's
// advertising, site details and messages pages, the contact form, the legal
// pages and /ads.txt. Against the normal local build (APP_ENV=local), where no
// live ad can ever load.
//
// Usage: ADMIN_EMAIL=… ADMIN_PASSWORD=… node tools/browser-checks/journey-k.mjs
// It changes settings through the admin and puts them back at the end.
import { BASE, launch, newContext, record, register, saveLog, shot, signIn } from "./lib.mjs";

const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to a local administrator account.");

const AD_HOSTS = /googlesyndication|doubleclick|googleadservices|adservice\.google|fundingchoicesmessages|adtrafficquality|pagead2/;
const PUB = "pub-1234567890123456"; // right shape for the validators; not a real AdSense account

const C = "programming-fundamentals";
const PUBLIC_PAGES = [
  "/",
  `/courses/${C}`,
  `/courses/${C}/lectures/loops-for`,
  `/courses/${C}/exercises`,
  `/courses/${C}/quizzes`,
  "/about",
  "/contact",
  "/privacy-policy",
  "/terms",
  "/cookie-policy",
  "/advertising",
  "/privacy-choices",
];

const browser = await launch();

// ---------------------------------------------------------------- K1 ads off
{
  const { context, page, problems } = await newContext(browser);
  const adRequests = [];
  page.on("request", (r) => {
    if (AD_HOSTS.test(r.url())) adRequests.push(r.url());
  });
  // Find a lecture long enough for in-text breaks and a non-demo question from the course page.
  await page.goto(`${BASE}/courses/${C}`);
  const lectureHrefs = await page.locator(`a[href^="/courses/${C}/lectures/"]`).evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")))]);
  PUBLIC_PAGES[2] = lectureHrefs[Math.min(4, lectureHrefs.length - 1)] ?? PUBLIC_PAGES[2];
  for (const path of [...PUBLIC_PAGES, ...PUBLIC_PAGES.map((p) => `${p}${p.includes("?") ? "&" : "?"}ad-preview=1`)]) {
    const resp = await page.goto(BASE + path, { waitUntil: "networkidle" });
    const status = resp?.status() ?? 0;
    const visibleAdLabel = await page.getByText("Advertisement", { exact: true }).count();
    if (status !== 200 || visibleAdLabel > 0) record("K1", `ads off: ${path}`, false, `status ${status}, Advertisement labels ${visibleAdLabel}`);
  }
  record("K1", `no request to an ad host on ${PUBLIC_PAGES.length * 2} page loads (with and without ?ad-preview=1)`, adRequests.length === 0, adRequests.slice(0, 3).join(", "));
  // Markers when nothing is previewed: hidden, no height.
  await page.goto(`${BASE}${PUBLIC_PAGES[2]}`, { waitUntil: "networkidle" });
  const markers = await page.locator("[data-ad-marker]").evaluateAll((els) => els.map((el) => ({ key: el.getAttribute("data-ad-marker"), hidden: el.hidden, h: el.getBoundingClientRect().height })));
  record("K1", "lecture: ad positions are hidden empty markers (no height) when not previewed", markers.length > 0 && markers.every((m) => m.hidden && m.h === 0), JSON.stringify(markers));
  record("K1", "no console errors or server errors", problems.length === 0, problems.slice(0, 3).join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- K2 preview boxes
{
  const { context, page } = await newContext(browser, { viewport: { width: 390, height: 860 } });
  const lecture = PUBLIC_PAGES[2];
  await page.goto(`${BASE}${lecture}?ad-preview=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  const boxes = await page.locator(".ad-preview").count();
  record("K2", `lecture preview shows labelled boxes (local build: anyone may preview), at most 3`, boxes >= 1 && boxes <= 3, `${boxes} boxes`);
  // In-text boxes sit between a text-only section and a section that starts with text.
  const neighbours = await page.evaluate(() =>
    [...document.querySelectorAll(".ad-preview")]
      .filter((box) => box.previousElementSibling?.classList.contains("lesson-section"))
      .map((box) => {
        const prev = box.previousElementSibling;
        const next = box.nextElementSibling;
        const afterHeading = next?.querySelector("h2")?.nextElementSibling;
        return {
          key: box.getAttribute("data-ad-marker"),
          prevHasCodeOrImage: Boolean(prev.querySelector("button, figure, pre, .lec-stage")),
          nextStartsWithText: Boolean(afterHeading?.classList.contains("lesson-prose")),
        };
      }),
  );
  record(
    "K2",
    "in-text positions never touch a code box, Run button or picture",
    neighbours.every((n) => !n.prevHasCodeOrImage && n.nextStartsWithText),
    JSON.stringify(neighbours),
  );
  await shot(page, "k2-lecture-preview-390");
  await page.goto(`${BASE}/courses/${C}/quizzes?ad-preview=1`, { waitUntil: "networkidle" });
  record("K2", "quizzes page: no preview box (never shows ads)", (await page.locator(".ad-preview").count()) === 0);
  await page.goto(`${BASE}/?ad-preview=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(300);
  const homeBoxes = await page.locator(".ad-preview").count();
  record("K2", "home preview: at most 2 boxes, none in the first screen", homeBoxes <= 2 && (await page.locator(".ad-preview").evaluateAll((els) => els.every((e) => e.getBoundingClientRect().top > window.innerHeight))), `${homeBoxes} boxes`);
  await context.close();
}

// ---------------------------------------------------------------- K3 admin
const { context: adminCtx, page: admin, problems: adminProblems } = await newContext(browser);
await signIn(admin, ADMIN.email, ADMIN.password, "/admin/ads");
{
  await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
  record("K3", "advertising page opens with the checklist, ads off", (await admin.getByRole("heading", { name: "Ads are off" }).count()) === 1);
  await shot(admin, "k3-admin-ads");
  // Invalid publisher id.
  await admin.fill("#publisherId", "pub-123<script>");
  await admin.getByRole("button", { name: "Save ad settings" }).click();
  await admin.getByText('A publisher id is "pub-" and 16 digits').first().waitFor({ timeout: 10000 });
  record("K3", "a malformed publisher id is refused with a message", true);
  // Switch on without an id.
  await admin.fill("#publisherId", "");
  await admin.getByLabel("Switch ads on").check();
  await admin.getByRole("button", { name: "Save ad settings" }).click();
  await admin.getByText("Ads can't be switched on without a real publisher id.").first().waitFor({ timeout: 10000 });
  record("K3", "switching ads on without a publisher id is refused", true);
  await admin.getByLabel("Switch ads on").uncheck();
  await admin.fill("#publisherId", PUB);
  await admin.getByRole("button", { name: "Save ad settings" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  const adsTxt = await admin.request.get(`${BASE}/ads.txt`);
  record("K3", "/ads.txt serves Google's line once a publisher id is saved", adsTxt.status() === 200 && (await adsTxt.text()) === `google.com, ${PUB}, DIRECT, f08c47fec0942fa0\n` && /^text\/plain/.test(adsTxt.headers()["content-type"]), `${adsTxt.status()} ${adsTxt.headers()["content-type"]}`);

  // A placement: refuse "on" without a unit id, then create it properly.
  await admin.goto(`${BASE}/admin/ads/placements/new`, { waitUntil: "networkidle" });
  await admin.selectOption("#placementKey", "lesson.end");
  await admin.getByLabel("Placement on").check();
  await admin.getByRole("button", { name: "Create placement" }).click();
  await admin.getByText("A placement can only be switched on with a real ad unit id.").first().waitFor({ timeout: 10000 });
  record("K3", "a placement can't be switched on without an ad unit id", true);
  await admin.fill("#adUnitId", "12345<b>");
  await admin.getByRole("button", { name: "Create placement" }).click();
  await admin.getByText("An ad unit id is only digits").first().waitFor({ timeout: 10000 });
  record("K3", "an ad unit id with anything but digits is refused", true);
  await admin.fill("#adUnitId", "1234567890");
  await admin.getByRole("button", { name: "Create placement" }).click();
  await admin.waitForURL(/\/admin\/ads\/placements\/adp_/, { timeout: 15000 });
  record("K3", "placement created and opened for editing", (await admin.getByText("Placement created.").count()) === 1, admin.url().replace(BASE, ""));
  const placementUrl = admin.url();
  // The site is still off: a local build can't go live whatever the settings say.
  await admin.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
  record("K3", "with a placement on, the checklist still says ads are off (local build)", (await admin.getByRole("heading", { name: "Ads are off" }).count()) === 1);

  // Exclusions.
  await admin.getByRole("button", { name: "Add an exclusion" }).click();
  await admin.fill("#pathGlob", "/courses/*/lectures/intro*");
  await admin.fill("#reason", "browser check");
  await admin.getByRole("button", { name: "Add exclusion" }).click();
  await admin.getByText("Pages matching /courses/*/lectures/intro*").waitFor({ timeout: 10000 });
  record("K3", "exclusion added", true);
  await admin.getByRole("button", { name: "Remove", exact: true }).first().click();
  await admin.getByRole("button", { name: "Remove exclusion" }).click();
  await admin.getByText("Exclusion removed.").first().waitFor({ timeout: 10000 });
  record("K3", "exclusion removed", true);

  // Audit log.
  await admin.goto(`${BASE}/admin/audit-log`, { waitUntil: "networkidle" });
  const auditText = await admin.locator("main").innerText();
  record("K3", "the audit log lists the advertising changes", /ad placement/.test(auditText) && /ad exclusion/.test(auditText), "");

  // Site details make the legal pages show the owner's name.
  await admin.goto(`${BASE}/admin/site`, { waitUntil: "networkidle" });
  await admin.getByLabel("The privacy policy, terms and cookie policy have been reviewed").check();
  await admin.getByRole("button", { name: "Save site details" }).click();
  await admin.getByText("The legal pages can only be marked as reviewed once").first().waitFor({ timeout: 10000 });
  record("K3", "'reviewed' is refused while the owner's details are missing", true);
  await admin.fill("#operatorName", "Browser Check Owner");
  await admin.fill("#contactEmail", "owner@example.org");
  await admin.fill("#country", "Egypt");
  await admin.fill("#effectiveDate", "2026-11-01");
  await admin.getByLabel("The privacy policy, terms and cookie policy have been reviewed").uncheck();
  await admin.getByRole("button", { name: "Save site details" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  const { context: visitorCtx, page: visitor } = await newContext(browser);
  await visitor.goto(`${BASE}/privacy-policy`);
  const pp = await visitor.locator("main").innerText();
  record("K3", "privacy policy shows the owner's details and still says draft", pp.includes("Browser Check Owner") && pp.includes("owner@example.org") && /Draft privacy policy/.test(pp));

  // Contact form, from a visitor to the admin inbox.
  await visitor.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await visitor.fill("#name", "Visitor K");
  await visitor.fill("#email", "visitor-k@example.org");
  await visitor.selectOption("#subject", "A mistake in a lecture or question");
  await visitor.fill("#body", "Browser check K: the output in a lecture looks wrong.");
  await visitor.waitForTimeout(3200); // a person takes more than 3 seconds; faster is treated as a bot
  await visitor.getByRole("button", { name: "Send message" }).click();
  await visitor.getByText("Thank you, your message was sent.").waitFor({ timeout: 10000 });
  record("K3", "contact form sends", true);
  await shot(visitor, "k3-contact-sent");
  // A bot that fills the hidden field: told "sent", nothing stored.
  await visitor.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await visitor.fill("#name", "Bot");
  await visitor.fill("#email", "bot@example.org");
  await visitor.selectOption("#subject", "Something else");
  await visitor.fill("#body", "Buy things at spam.example now please.");
  await visitor.evaluate(() => {
    document.getElementById("website").value = "http://spam.example";
  });
  await visitor.waitForTimeout(3200);
  await visitor.getByRole("button", { name: "Send message" }).click();
  await visitor.getByText("Thank you, your message was sent.").waitFor({ timeout: 10000 });
  await visitorCtx.close();

  await admin.goto(`${BASE}/admin/messages`, { waitUntil: "networkidle" });
  const inbox = await admin.locator("main").innerText();
  record("K3", "the message reaches the inbox; the honeypot one doesn't", inbox.includes("Browser check K") && !inbox.includes("spam.example"));
  const card = admin.locator("li", { hasText: "Browser check K" });
  await card.getByRole("button", { name: "Mark as read" }).click();
  await card.getByRole("button", { name: "Mark as read" }).waitFor({ state: "detached", timeout: 10000 });
  await card.getByRole("button", { name: "Archive" }).click();
  await admin.getByText("Browser check K").waitFor({ state: "detached", timeout: 10000 });
  await admin.goto(`${BASE}/admin/messages?view=archived`, { waitUntil: "networkidle" });
  const archived = admin.locator("li", { hasText: "Browser check K" });
  await archived.getByRole("button", { name: "Delete" }).click();
  await archived.getByRole("button", { name: "Delete for good" }).click();
  await admin.getByText("Browser check K").waitFor({ state: "detached", timeout: 10000 });
  record("K3", "read, archive and delete in the inbox", true);

  // Put everything back.
  await admin.goto(placementUrl, { waitUntil: "networkidle" });
  await admin.getByRole("button", { name: "Delete placement" }).click();
  await admin.getByRole("button", { name: "Delete", exact: true }).click();
  await admin.waitForURL(`${BASE}/admin/ads`, { timeout: 15000 });
  await admin.fill("#publisherId", "");
  await admin.getByRole("button", { name: "Save ad settings" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  await admin.goto(`${BASE}/admin/site`, { waitUntil: "networkidle" });
  for (const id of ["#operatorName", "#contactEmail", "#country"]) await admin.fill(id, "");
  await admin.fill("#effectiveDate", "");
  await admin.getByRole("button", { name: "Save site details" }).click();
  await admin.getByText("Saved.").first().waitFor({ timeout: 10000 });
  const after = await admin.request.get(`${BASE}/ads.txt`);
  record("K3", "settings put back: no placement, no publisher id, /ads.txt is 404 again", after.status() === 404);
  record("K3", "no console or server errors in the admin", adminProblems.length === 0, adminProblems.slice(0, 3).join(" | "));
}
await adminCtx.close();

// ---------------------------------------------------------------- K4 who may open the admin pages
{
  const { context, page } = await newContext(browser);
  const stamp = Date.now();
  await register(page, { name: "K student", email: `k-student-${stamp}@example.org`, password: "correct horse battery staple" });
  for (const path of ["/admin/ads", "/admin/site", "/admin/messages", "/admin/ads/placements/new"]) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    const text = await page.locator("main").innerText();
    record("K4", `a student can't open ${path}`, !/Advertising|Site details|Messages|New placement/.test(text.split("\n")[0] ?? "") && !text.includes("Save ad settings") && !text.includes("Save site details"), page.url().replace(BASE, ""));
  }
  await context.close();
  const { context: anon, page: guest } = await newContext(browser);
  await guest.goto(`${BASE}/admin/ads`, { waitUntil: "networkidle" });
  record("K4", "a visitor is sent to sign in", guest.url().includes("/login"), guest.url().replace(BASE, ""));
  await anon.close();
}

// ---------------------------------------------------------------- K5 privacy choices
{
  const { context, page } = await newContext(browser);
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.localStorage.setItem("codelab-theme", "dark");
    window.localStorage.setItem("codelab:practice:programming-fundamentals", "{}");
    window.localStorage.setItem("other-site-key", "keep");
  });
  await page.goto(`${BASE}/privacy-choices`, { waitUntil: "networkidle" });
  const text = await page.locator("main").innerText();
  record("K5", "privacy choices says no ads load today and offers no consent button", /shows no ads today/.test(text) && (await page.getByRole("button", { name: "Change my ad privacy choices" }).count()) === 0);
  await page.getByRole("button", { name: "Clear this site's data on this device" }).click();
  await page.getByText(/Cleared 2 items/).waitFor({ timeout: 5000 });
  const left = await page.evaluate(() => Object.keys(window.localStorage));
  record("K5", "clearing removes only this site's keys", left.includes("other-site-key") && !left.some((k) => k.startsWith("codelab")), JSON.stringify(left));
  const meta = await page.locator('meta[name="robots"]').getAttribute("content");
  record("K5", "privacy choices is noindex", /noindex/.test(meta ?? ""), meta ?? "");
  // Footer links on a phone.
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  const legal = await page.getByRole("navigation", { name: "Legal" }).getByRole("link").allInnerTexts();
  record("K5", "footer lists the legal pages", ["Privacy policy", "Terms of use", "Cookie policy", "Advertising", "Privacy choices"].every((l) => legal.includes(l)), legal.join(", "));
  await context.close();
}

await browser.close();
saveLog("journey-k");
