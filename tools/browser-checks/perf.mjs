/* global window, PerformanceObserver -- used inside the page, which runs in the browser */
// Local lab timings: Largest Contentful Paint, layout shift, first paint and
// bytes for each page, on a phone-sized window with the CPU slowed 4 times and
// on a desktop window. Each page loads 3 times in a fresh window (nothing
// cached) and the middle value is kept.
//
// These are numbers from one machine against `npm start`, not field data and
// not Lighthouse scores. Compare two builds measured the same way on the same
// machine; don't read them as what visitors will see.
//
// Usage: node tools/browser-checks/perf.mjs <name> '<JSON list of paths>'
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { BASE, LOGS, launch } from "./lib.mjs";

const [, , name, pagesArg] = process.argv;
const pages = JSON.parse(pagesArg);
const RUNS = Number(process.env.RUNS ?? 3);
const SETUPS = [
  { setup: "phone 390px, CPU 4x slower", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, cpu: 4 },
  { setup: "desktop 1440px", viewport: { width: 1440, height: 900 }, cpu: 1 },
];

function observe() {
  window.__perf = { lcp: 0, cls: 0 };
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) window.__perf.lcp = e.startTime;
  }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value;
  }).observe({ type: "layout-shift", buffered: true });
}

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const browser = await launch();
const results = [];
for (const s of SETUPS) {
  for (const path of pages) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const context = await browser.newContext({ viewport: s.viewport, isMobile: s.isMobile ?? false, hasTouch: s.hasTouch ?? false });
      const page = await context.newPage();
      await page.addInitScript(observe);
      const cdp = await context.newCDPSession(page);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: s.cpu });
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60000 });
      await page.waitForTimeout(1500);
      runs.push(
        await page.evaluate(() => {
          const nav = performance.getEntriesByType("navigation")[0];
          const fcp = performance.getEntriesByName("first-contentful-paint")[0];
          const res = performance.getEntriesByType("resource");
          const bytes = (list) => list.reduce((n, r) => n + (r.transferSize || r.encodedBodySize || 0), 0);
          return {
            lcp: window.__perf.lcp,
            cls: window.__perf.cls,
            fcp: fcp ? fcp.startTime : 0,
            ttfb: nav ? nav.responseStart : 0,
            requests: res.length + 1,
            kb: (bytes(res) + (nav ? nav.transferSize || nav.encodedBodySize : 0)) / 1024,
            jsKb: bytes(res.filter((r) => r.initiatorType === "script" || /\.m?js(\?|$)/.test(r.name))) / 1024,
          };
        }),
      );
      await context.close();
    }
    const row = { setup: s.setup, path };
    for (const k of ["lcp", "cls", "fcp", "ttfb", "requests", "kb", "jsKb"]) row[k] = median(runs.map((r) => r[k]));
    results.push(row);
    console.log(
      `${s.setup.padEnd(28)} ${path.padEnd(64)} LCP ${row.lcp.toFixed(0).padStart(5)} ms  shift ${row.cls.toFixed(3)}  FCP ${row.fcp.toFixed(0).padStart(5)} ms  ${row.requests} requests  ${row.kb.toFixed(0)} KB (JS ${row.jsKb.toFixed(0)} KB)`,
    );
  }
}
await browser.close();
writeFileSync(join(LOGS, `perf-${name}.json`), JSON.stringify({ base: BASE, runs: RUNS, results }, null, 2));
