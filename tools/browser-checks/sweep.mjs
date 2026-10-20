/* global document, getComputedStyle -- used inside page.evaluate, which runs in the browser */
// Layout sweep: each page at phone to wide widths, light and dark. Records
// sideways scrolling (and the widest element causing it), console errors,
// failed requests and the anti-framing header.
//
// Usage: node tools/browser-checks/sweep.mjs <name> [session cookie or ""] '<JSON list of paths>'
//   WIDTHS='[320,390]' and THEMES='["light"]' narrow the run.
// Exits with 1 when a page has a problem (aborted prefetches don't count).
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, LOGS, launch } from "./lib.mjs";

const [, , name, cookieArg, pagesArg] = process.argv;
const pages = JSON.parse(pagesArg);
const widths = process.env.WIDTHS ? JSON.parse(process.env.WIDTHS) : [320, 360, 375, 390, 768, 1024, 1280, 1440, 1920];
const themes = process.env.THEMES ? JSON.parse(process.env.THEMES) : ["light", "dark"];
// Session cookie name: __Host-ce_session outside local development.
const cookieName = BASE.startsWith("https:") ? "__Host-ce_session" : "ce_session";

const browser = await launch();
const results = [];
for (const theme of themes) {
  for (const width of widths) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: theme });
    if (cookieArg) await context.addCookies([{ name: cookieName, value: cookieArg, url: BASE }]);
    const page = await context.newPage();
    for (const path of pages) {
      const errors = [];
      const failed = [];
      const onConsole = (m) => {
        if (m.type() === "error") errors.push(m.text().slice(0, 200));
      };
      const onFail = (r) => failed.push(`${r.url().replace(BASE, "")} ${r.failure()?.errorText}`);
      const onResp = (r) => {
        if (r.status() >= 400 && !r.url().endsWith("/favicon.ico")) failed.push(`${r.url().replace(BASE, "")} ${r.status()}`);
      };
      page.on("console", onConsole);
      page.on("requestfailed", onFail);
      page.on("response", onResp);
      let status = 0;
      let xfo = null;
      try {
        const resp = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 30000 });
        status = resp?.status() ?? 0;
        xfo = (await resp?.allHeaders())?.["x-frame-options"] ?? null;
      } catch (e) {
        errors.push(`navigation: ${String(e).slice(0, 120)}`);
      }
      // Sideways scrolling, and the element reaching furthest right that isn't inside its own scroll box.
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        const extra = doc.scrollWidth - doc.clientWidth;
        if (extra <= 0) return null;
        const clipped = (el) => {
          for (let p = el.parentElement; p; p = p.parentElement) if (/(auto|scroll|hidden|clip)/.test(getComputedStyle(p).overflowX)) return true;
          return false;
        };
        let worst = null;
        for (const el of document.querySelectorAll("body *")) {
          const r = el.getBoundingClientRect();
          if (r.right > doc.clientWidth + 1 && r.width > 0 && getComputedStyle(el).position !== "fixed" && !clipped(el)) {
            if (!worst || r.right > worst.right) worst = { right: Math.round(r.right), tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 80) };
          }
        }
        return { extra, worst };
      });
      results.push({ theme, width, path, status, xfo, overflow, errors, failed });
      page.off("console", onConsole);
      page.off("requestfailed", onFail);
      page.off("response", onResp);
    }
    await context.close();
  }
}
await browser.close();
writeFileSync(join(LOGS, `sweep-${name}-${Date.now()}.json`), JSON.stringify(results, null, 1));
const expected404 = (r) => r.status === 404;
const real = (f) => !/ERR_ABORTED/.test(f);
const bad = results.filter(
  (r) =>
    r.overflow ||
    (!expected404(r) && (r.errors.length || r.failed.filter(real).length || r.status !== 200)) ||
    r.xfo !== "DENY",
);
console.log(`${results.length} page loads, ${bad.length} with a problem`);
for (const r of bad.slice(0, 60)) console.log(JSON.stringify(r));
if (bad.length) process.exitCode = 1;
