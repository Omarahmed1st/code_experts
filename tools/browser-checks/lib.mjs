// Shared helpers for the browser checks (Phase 5.1). They drive a real
// Chromium against a running local site (`npm run build && npm start`).
// Playwright is NOT a project dependency: install it once outside the project
// (`npm install -g playwright`, then `npx playwright install chromium`).
//
// Settings (environment variables, all optional):
//   BASE_URL         the site, default http://localhost:8787
//   PLAYWRIGHT_DIR   folder that contains node_modules/playwright (default: normal lookup, then the global npm folder)
//   CHROMIUM_PATH    a Chromium binary to use instead of Playwright's own
//   SHOTS_DIR        where screenshots go, default ./browser-check-shots
//   LOG_DIR          where JSON results go, default ./browser-check-logs
import { createRequire } from "node:module";
import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

function loadPlaywright() {
  const tries = [process.env.PLAYWRIGHT_DIR, process.cwd()];
  try {
    tries.push(join(execSync("npm root -g", { encoding: "utf8" }).trim(), ".."));
  } catch {
    // no npm on the path: only the other places
  }
  for (const dir of tries.filter(Boolean)) {
    try {
      return createRequire(join(resolve(dir), "noop.js"))("playwright");
    } catch {
      // try the next place
    }
  }
  throw new Error("Playwright not found. Install it with `npm install -g playwright` or set PLAYWRIGHT_DIR.");
}

export const { chromium } = loadPlaywright();
export const BASE = (process.env.BASE_URL ?? "http://localhost:8787").replace(/\/$/, "");
export const SHOTS = resolve(process.env.SHOTS_DIR ?? "browser-check-shots");
export const LOGS = resolve(process.env.LOG_DIR ?? "browser-check-logs");
mkdirSync(SHOTS, { recursive: true });
mkdirSync(LOGS, { recursive: true });

export async function launch() {
  return chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
}

/** A context that records console errors, page errors and server errors. */
export async function newContext(browser, opts = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, ...opts });
  const page = await context.newPage();
  const problems = [];
  page.on("console", (m) => {
    if (m.type() === "error") problems.push(`console: ${m.text().slice(0, 200)}`);
  });
  page.on("pageerror", (e) => problems.push(`pageerror: ${String(e).slice(0, 200)}`));
  page.on("response", (r) => {
    if (r.status() >= 500) problems.push(`HTTP ${r.status()} ${r.url().replace(BASE, "")}`);
  });
  return { context, page, problems };
}

export async function shot(page, name) {
  await page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
}

/** Signs up through the real form; returns the recovery code shown once. */
export async function register(page, { name, email, password }) {
  await page.goto(`${BASE}/register`);
  await page.fill("#name", name);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.getByText("Save your recovery code now").waitFor({ timeout: 15000 });
  const label = await page.locator('[aria-label^="Recovery code"]').textContent();
  return label.trim();
}

export async function signIn(page, email, password, next = "") {
  await page.goto(`${BASE}/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: 15000 });
}

export async function signOut(page) {
  const r = await page.request.post(`${BASE}/api/me/sign-out`, { headers: { Origin: BASE } });
  return r.status();
}

const log = [];
export function record(scenario, step, ok, evidence) {
  const line = { scenario, step, result: ok === true ? "PASS" : ok === false ? "FAIL" : ok, evidence };
  log.push(line);
  console.log(`[${line.result}] ${scenario} · ${step}${evidence ? ` · ${evidence}` : ""}`);
}

/** Writes the results; exits with 1 when any step failed. */
export function saveLog(name) {
  writeFileSync(join(LOGS, `${name}-${Date.now()}.json`), JSON.stringify(log, null, 1));
  if (log.some((l) => l.result === "FAIL")) process.exitCode = 1;
}
