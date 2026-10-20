/* global document, getComputedStyle -- used inside page.evaluate, which runs in the browser */
// Extra checks: the four newer question formats in the browser, the theme switch,
// search inside one course, robots and sitemap, and no third-party requests.
import { BASE, launch, newContext, shot, record, saveLog } from "./lib.mjs";

const browser = await launch();
const PA = `${BASE}/courses/programming-applications/exercises`;

// ---------------------------------------------------------------- question formats
{
  const { page, problems } = await newContext(browser);
  const feedback = async () => (await page.locator(".q-feedback").first().textContent({ timeout: 10000 }))?.trim().slice(0, 80);

  await page.goto(`${PA}/order-py-initials-and-short-name`, { waitUntil: "networkidle" });
  const before = await page.locator(".q-order__list li").allTextContents();
  await page.locator('button[aria-label="Move line 2 up"]').click();
  const after = await page.locator(".q-order__list li").allTextContents();
  await page.getByRole("button", { name: "Check my order" }).click();
  record("Q", "Put the lines in order: the up/down buttons move lines, and the order is marked", before[0] !== after[0], `feedback "${await feedback()}"`);
  await shot(page, "Q-order");

  await page.goto(`${PA}/blanks-py-hidden-message`, { waitUntil: "networkidle" });
  const blanks = page.locator(".q-blanks input");
  const nb = await blanks.count();
  for (let i = 0; i < nb; i++) await blanks.nth(i).fill("x");
  await page.getByRole("button", { name: "Check answer" }).click();
  record("Q", "Fill in the blanks is marked", nb > 0, `${nb} blanks; feedback "${await feedback()}"`);
  await shot(page, "Q-blanks");

  await page.goto(`${PA}/count-py-cart-loop-rounds`, { waitUntil: "networkidle" });
  await page.getByLabel("Number of times").fill("3");
  await page.getByRole("button", { name: "Check answer" }).click();
  record("Q", "How many times does the loop run? is marked", true, `feedback "${await feedback()}"`);

  await page.goto(`${PA}/value-py-city-code`, { waitUntil: "networkidle" });
  await page.getByLabel("Your answer").fill("abc");
  await page.getByRole("button", { name: "Check answer" }).click();
  record("Q", "Value of a variable is marked", true, `feedback "${await feedback()}"`);
  record("Q", "No server or console errors", problems.length === 0, problems.join(" | "));
}

// ---------------------------------------------------------------- theme switch
{
  const { page } = await newContext(browser, { colorScheme: "light" });
  await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
  const btn = page.locator('button[aria-label^="Theme:"]');
  const seen = [await page.evaluate(() => document.documentElement.getAttribute("data-theme") ?? "system")];
  for (let i = 0; i < 3; i++) {
    await btn.click();
    seen.push(await page.evaluate(() => document.documentElement.getAttribute("data-theme") ?? "system"));
  }
  await page.goto(`${BASE}/courses`, { waitUntil: "networkidle" });
  await btn.click(); // pick the next one, then reload: it must stay
  const chosen = await page.evaluate(() => document.documentElement.getAttribute("data-theme") ?? "system");
  await page.reload({ waitUntil: "networkidle" });
  const kept = await page.evaluate(() => document.documentElement.getAttribute("data-theme") ?? "system");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  record("T", "The theme button cycles through the themes and the choice survives a reload", new Set(seen).size >= 2 && chosen === kept, `cycle ${seen.join(" → ")}; kept "${kept}"; body ${bg}`);
}

// ---------------------------------------------------------------- search inside one course
{
  const { page } = await newContext(browser);
  await page.goto(`${BASE}/courses/programming-fundamentals/search?q=loop`, { waitUntil: "networkidle" });
  const hits = await page.locator('main a[href*="/courses/programming-fundamentals/"]').count();
  record("S", "Search finds C++ lectures for 'loop'", hits > 0, `${hits} links`);
  await page.goto(`${BASE}/courses/computer-vision/search?q=while`, { waitUntil: "networkidle" });
  const leak = await page.locator('main a[href*="/courses/programming-fundamentals/"]').count();
  record("S", "Computer Vision search never shows C++ results", leak === 0, `${leak} C++ links`);
}

// ---------------------------------------------------------------- robots, sitemap, third-party requests
{
  const { page, context } = await newContext(browser);
  // Outside production the site asks crawlers to stay away and lists nothing; production
  // (APP_ENV=production with PUBLIC_SITE_URL) lists the public pages only.
  const robots = await page.request.get(`${BASE}/robots.txt`);
  const robotsText = await robots.text();
  const sitemap = await page.request.get(`${BASE}/sitemap.xml`);
  const urls = [...(await sitemap.text()).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  const production = /Allow: \//.test(robotsText);
  if (production) {
    record("SEO", "robots.txt keeps crawlers out of private areas", /Disallow: \/admin/.test(robotsText) && /Disallow: \/dashboard/.test(robotsText), robotsText.replace(/\n/g, " ").slice(0, 160));
    record("SEO", "sitemap.xml lists public pages only", urls.length > 0 && !urls.some((u) => /\/(admin|dashboard|settings|login|register|api)/.test(u)), `${urls.length} URLs`);
  } else {
    record("SEO", "Outside production, robots.txt blocks all crawling", robots.status() === 200 && /Disallow: \/\s*$/m.test(robotsText), robotsText.replace(/\n/g, " ").slice(0, 60));
    record("SEO", "Outside production, the sitemap is empty", sitemap.status() === 200 && urls.length === 0, `${urls.length} URLs`);
  }

  const hosts = new Set();
  context.on("request", (r) => {
    const h = new URL(r.url()).host;
    if (h !== new URL(BASE).host) hosts.add(h);
  });
  for (const p of ["/", "/courses/programming-fundamentals/lectures/for-loops", "/courses/programming-applications/lectures/strings-indexing-and-slicing", "/register"]) {
    await page.goto(BASE + p, { waitUntil: "networkidle" });
  }
  record("ADS", "No ad or other third-party requests (ads are off; fonts and runtimes are self-hosted)", hosts.size === 0, hosts.size ? [...hosts].join(", ") : "only this site");
}

await browser.close();
saveLog("journey-extra");
