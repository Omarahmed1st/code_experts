/* global document, window -- used inside page.evaluate and waitForFunction, which run in the browser */
// Scenario M (Phase 6 follow-up): the header's Sign in button on pages other
// than home, and the signed-in account's name, title and menu.
//   M1  a visitor's Sign in opens the sign-in page with the page to come back to
//   M2  signing in from a course page lands back there, signed in (no "Sign in" left anywhere)
//   M3  the account button shows the name and title; its menu has View my progress and Sign out
//   M4  a new name shows in the header as soon as it is saved
//   M5  a tab that missed the sign-in (another tab signed in) recovers when Sign in is pressed
//   M6  signing up from a course page comes back there, signed in
//   M7  Sign out in the menu signs out
//   M8  at 390 px the button stays a 44 px square and the menu fits; dark theme
//   M9  an administrator gets "Administrator" and the Admin link (only with ADMIN_EMAIL and ADMIN_PASSWORD)
import { BASE, launch, newContext, record, saveLog, shot } from "./lib.mjs";

const COURSE = "computer-vision";
const LECTURE = `/courses/${COURSE}/lectures/reading-and-showing-images`;
const stamp = Date.now();
const who = { name: "Mariam", email: `mariam${stamp}@example.com`, password: "quiet harbour lamp 52" };

const browser = await launch();
const path = (page) => {
  const u = new URL(page.url());
  return u.pathname + u.search;
};
// Every link to the sign-in page (header, course strip, lecture footer, bookmark buttons).
const signInLinks = (page) => page.locator('a[href^="/login"]');
const accountButton = (page) => page.locator("header button[aria-controls]").filter({ has: page.locator("span.rounded-full") });
const menuOf = async (page) => page.locator(`[id="${await accountButton(page).getAttribute("aria-controls")}"]`);
const menuItems = async (page) => (await (await menuOf(page)).locator("ul a, ul button").allInnerTexts()).map((t) => t.trim());
async function settle(page) {
  await page.waitForLoadState("networkidle");
  await accountButton(page).or(page.locator('header a[title="Sign in"]')).first().waitFor({ timeout: 10000 });
}
async function fillSignIn(page, email, password) {
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

// Make the student first, then sign out (signing up is checked in M6).
{
  const { context, page } = await newContext(browser);
  await page.goto(`${BASE}/register`);
  await page.fill("#name", who.name);
  await page.fill("#email", who.email);
  await page.fill("#password", who.password);
  await page.click('button[type="submit"]');
  await page.getByText("Save your recovery code now").waitFor({ timeout: 15000 });
  await context.close();
}

const { context, page, problems } = await newContext(browser);

// M1
for (const from of [`/courses/${COURSE}`, LECTURE, "/courses", "/about"]) {
  await page.goto(BASE + from);
  await settle(page);
  await page.locator('header a[title="Sign in"]').click();
  await page.waitForURL(/\/login/, { timeout: 10000 });
  record("M1", `Sign in from ${from} opens the sign-in page`, path(page) === `/login?next=${encodeURIComponent(from)}`, path(page));
}

// M2
await page.goto(`${BASE}/courses/${COURSE}`);
await settle(page);
await page.locator('header a[title="Sign in"]').click();
await page.waitForURL(/\/login/);
await fillSignIn(page, who.email, "not the password at all");
await page.locator('[role="alert"]').waitFor({ timeout: 10000 });
record("M2", "A wrong password keeps the form and says so", path(page).startsWith("/login"), (await page.locator('[role="alert"]').textContent())?.trim().slice(0, 80));
await page.fill("#password", who.password);
await page.click('button[type="submit"]');
await page.waitForURL((u) => u.pathname === `/courses/${COURSE}`, { timeout: 15000 });
await settle(page);
record("M2", "Signing in from a course page comes back to it", path(page) === `/courses/${COURSE}`, path(page));
record("M2", "No Sign in link is left on the page (header and course strip)", (await signInLinks(page).count()) === 0, `${await signInLinks(page).count()} left`);
record("M2", "The course strip shows progress instead of the invitation", await page.getByText(/lectures done/).isVisible(), "");
await shot(page, "M2-signed-in-course-page");

// M3
const button = accountButton(page);
const [nameBox, titleBox] = [await button.locator("span.truncate").nth(0).boundingBox(), await button.locator("span.truncate").nth(1).boundingBox()];
const shown = (await button.locator("span.truncate").allInnerTexts()).map((t) => t.trim());
record("M3", "The account button shows the name and title (on screen, not only for screen readers)", shown[0].startsWith(who.name) && shown[1].startsWith("Student") && nameBox?.width > 20 && titleBox?.width > 20, `${shown.join(" / ")}, ${Math.round(nameBox?.width)} and ${Math.round(titleBox?.width)} px wide`);
const named = page.getByRole("button", { name: `${who.name}, Student, account menu`, exact: true });
record("M3", "Screen readers hear the name, title and that it is the account menu", (await named.count()) === 1, `${await named.count()} button(s) named "${who.name}, Student, account menu"`);
await button.click();
const menu = await menuOf(page);
await menu.waitFor({ state: "visible" });
const items = await menuItems(page);
record("M3", "On a course page the menu offers this course's progress, all courses, settings and Sign out", JSON.stringify(items) === JSON.stringify(["View my progress in this course", "All my courses", "Account settings", "Sign out"]), items.join(" | "));
record("M3", "The menu shows the title", (await menu.innerText()).includes("Student"), "");
await shot(page, "M3-menu-course-page");
await menu.getByRole("link", { name: "View my progress in this course" }).click();
await page.waitForURL((u) => u.pathname === `/dashboard/${COURSE}`, { timeout: 10000 });
await page.waitForLoadState("networkidle");
record("M3", "View my progress in this course opens that course's dashboard", path(page) === `/dashboard/${COURSE}`, `${path(page)}, h1 "${(await page.locator("h1").first().textContent())?.trim()}"`);
await page.goto(`${BASE}/courses`);
await settle(page);
await accountButton(page).click();
const items2 = await menuItems(page);
record("M3", "Elsewhere the menu offers View my progress, settings and Sign out", JSON.stringify(items2) === JSON.stringify(["View my progress", "Account settings", "Sign out"]), items2.join(" | "));
await page.getByRole("link", { name: "View my progress", exact: true }).click();
await page.waitForURL((u) => u.pathname === "/dashboard", { timeout: 10000 });
record("M3", "View my progress opens the dashboard", path(page) === "/dashboard", path(page));

// M4
await page.goto(`${BASE}/settings`);
await settle(page);
await page.fill("#name", "Mariam Adel");
await page.getByRole("button", { name: "Save my name" }).click();
await page.locator('[role="status"]').filter({ hasText: /saved/i }).first().waitFor({ timeout: 10000 }).catch(() => {});
await page.waitForFunction(() => document.querySelector("header")?.textContent?.includes("Mariam Adel"), null, { timeout: 10000 }).catch(() => {});
record("M4", "A new name shows in the header right after saving", (await accountButton(page).innerText()).includes("Mariam Adel"), (await accountButton(page).innerText()).replace(/\s+/g, " "));
who.name = "Mariam Adel";

// M5: tab A loaded as a visitor; tab B (same browser) signs in; tab A presses Sign in.
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const a = await ctx.newPage();
  await a.goto(BASE + LECTURE);
  await settle(a);
  const b = await ctx.newPage();
  await b.goto(`${BASE}/login`);
  await fillSignIn(b, who.email, who.password);
  await b.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
  await a.bringToFront();
  await a.locator('header a[title="Sign in"]').click();
  await a.waitForURL((u) => u.pathname === LECTURE, { timeout: 15000 }).catch(() => {});
  await settle(a);
  record("M5", "A tab that missed the sign-in comes back to its page, signed in", path(a) === LECTURE && (await accountButton(a).count()) === 1 && (await signInLinks(a).count()) === 0, `${path(a)}, account button ${await accountButton(a).count()}, sign-in links ${await signInLinks(a).count()}`);
  await ctx.close();
}

// M6
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/register?next=${encodeURIComponent(LECTURE)}`);
  await p.fill("#name", "Yassin");
  await p.fill("#email", `yassin${stamp}@example.com`);
  await p.fill("#password", "warm desert road 18");
  await p.click('button[type="submit"]');
  await p.getByText("Save your recovery code now").waitFor({ timeout: 15000 });
  await p.getByRole("link", { name: "I've saved it, continue" }).click();
  await p.waitForURL((u) => u.pathname === LECTURE, { timeout: 15000 });
  await settle(p);
  const text = (await accountButton(p).innerText().catch(() => "")).replace(/\s+/g, " ").trim();
  record("M6", "Signing up from a lecture comes back to it, signed in", text.includes("Yassin") && text.includes("Student") && (await signInLinks(p).count()) === 0, `${path(p)}, "${text}"`);
  await ctx.close();
}

// M7
await page.goto(BASE + LECTURE);
await settle(page);
await accountButton(page).click();
await page.getByRole("button", { name: "Sign out" }).click();
await page.waitForURL((u) => u.pathname === "/", { timeout: 15000 });
await settle(page);
record("M7", "Sign out in the menu signs out and shows Sign in again", (await page.locator('header a[title="Sign in"]').count()) === 1 && (await accountButton(page).count()) === 0, path(page));

// M8
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, colorScheme: theme });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/login?next=${encodeURIComponent(LECTURE)}`);
  await fillSignIn(p, who.email, who.password);
  await p.waitForURL((u) => u.pathname === LECTURE, { timeout: 15000 });
  await settle(p);
  const box = await accountButton(p).boundingBox();
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  record("M8", `390 px ${theme}: the account button is a 44 px square and nothing scrolls sideways`, box && Math.round(box.width) === 44 && Math.round(box.height) === 44 && overflow <= 0, `${box && `${box.width}x${box.height}`}, overflow ${overflow}`);
  await accountButton(p).click();
  const m = await menuOf(p);
  await m.waitFor({ state: "visible" });
  const mb = await m.boundingBox();
  record("M8", `390 px ${theme}: the menu fits on the screen`, mb && mb.x >= 0 && mb.x + mb.width <= 390, mb && `${Math.round(mb.x)}..${Math.round(mb.x + mb.width)}`);
  await shot(p, `M8-390-${theme}-menu`);
  await ctx.close();
  const wide = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: theme });
  const w = await wide.newPage();
  await w.goto(`${BASE}/login?next=%2Fcourses`);
  await fillSignIn(w, who.email, who.password);
  await w.waitForURL((u) => u.pathname === "/courses", { timeout: 15000 });
  await settle(w);
  await shot(w, `M8-1280-${theme}-header`);
  await wide.close();
}

// M9
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/courses`);
  await settle(p);
  await p.locator('header a[title="Sign in"]').click();
  await p.waitForURL(/\/login/);
  await fillSignIn(p, process.env.ADMIN_EMAIL, process.env.ADMIN_PASSWORD);
  await p.waitForURL((u) => u.pathname === "/courses", { timeout: 15000 });
  await settle(p);
  const text = (await accountButton(p).innerText()).replace(/\s+/g, " ").trim();
  record("M9", "An administrator signing in from /courses comes back to it, titled Administrator", (await p.getByRole("button", { name: /, Administrator, account menu$/ }).count()) === 1 && (await signInLinks(p).count()) === 0, `"${text}"`);
  await accountButton(p).click();
  const its = await menuItems(p);
  record("M9", "The administrator's menu also has Admin", JSON.stringify(its) === JSON.stringify(["View my progress", "Account settings", "Admin", "Sign out"]), its.join(" | "));
  await shot(p, "M9-admin-menu");
  await p.goto(`${BASE}/admin`);
  await p.waitForLoadState("load");
  record("M9", "The Admin link's page opens", path(p) === "/admin", path(p));
  await ctx.close();
} else {
  record("M9", "Administrator header", "SKIPPED", "set ADMIN_EMAIL and ADMIN_PASSWORD to run it");
}

record("M", "No console errors, page errors or server errors", problems.length === 0, problems.join(" | "));
await context.close();
await browser.close();
saveLog("journey-m");
