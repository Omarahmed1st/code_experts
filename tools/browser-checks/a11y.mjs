/* global document, getComputedStyle, axe -- used inside page.evaluate, which runs in the browser */
// Accessibility scan with axe-core (WCAG 2.0 and 2.1, levels A and AA), light
// and dark, plus a keyboard check: what the first Tab reaches, and whether it
// shows a focus outline.
//
// Usage: node tools/browser-checks/a11y.mjs <name> [session cookie or ""] '<JSON list of paths>'
// axe-core is not a project dependency: `npm install -g axe-core`, or set AXE_DIR
// to a folder whose node_modules contains it. Exits with 1 when a page has a violation.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { BASE, LOGS, launch } from "./lib.mjs";

function axeSource() {
  const tries = [process.env.AXE_DIR, process.cwd()];
  try {
    tries.push(join(execSync("npm root -g", { encoding: "utf8" }).trim(), ".."));
  } catch {
    // no npm on the path
  }
  for (const dir of tries.filter(Boolean)) {
    try {
      return readFileSync(createRequire(join(resolve(dir), "noop.js")).resolve("axe-core/axe.min.js"), "utf8");
    } catch {
      // try the next place
    }
  }
  throw new Error("axe-core not found. Install it with `npm install -g axe-core` or set AXE_DIR.");
}

const AXE = axeSource();
const [, , name, cookie, pagesArg] = process.argv;
const pages = JSON.parse(pagesArg);
const cookieName = BASE.startsWith("https:") ? "__Host-ce_session" : "ce_session";
const browser = await launch();
const results = [];
for (const scheme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: scheme });
  if (cookie) await ctx.addCookies([{ name: cookieName, value: cookie, url: BASE }]);
  const page = await ctx.newPage();
  for (const path of pages) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.addScriptTag({ content: AXE });
    const violations = await page.evaluate(async () => {
      const res = await axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } });
      return res.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        count: v.nodes.length,
        sample: v.nodes.slice(0, 2).map((n) => `${n.target.join(" ")} :: ${(n.failureSummary || "").slice(0, 160)}`),
      }));
    });
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    await page.keyboard.press("Tab");
    const firstTab = await page.evaluate(() => {
      const el = document.activeElement;
      const s = getComputedStyle(el);
      return {
        text: (el.textContent || el.getAttribute("aria-label") || el.getAttribute("name") || el.tagName).trim().slice(0, 40),
        outline: s.outlineStyle !== "none" || s.boxShadow !== "none",
      };
    });
    results.push({ scheme, path, violations, firstTab });
  }
  await ctx.close();
}
await browser.close();
writeFileSync(join(LOGS, `a11y-${name}-${Date.now()}.json`), JSON.stringify(results, null, 1));
for (const r of results) {
  const found = r.violations.length ? r.violations.map((v) => `${v.id} (${v.impact}) ×${v.count}`).join(", ") : "no violations";
  console.log(`${r.scheme} ${r.path} · first Tab: "${r.firstTab.text}" outline=${r.firstTab.outline} · ${found}`);
}
if (results.some((r) => r.violations.length)) process.exitCode = 1;
