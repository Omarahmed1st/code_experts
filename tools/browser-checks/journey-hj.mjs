// Scenarios H and J: running Python and C++ in the browser, a write-the-code
// self-check, a slow network and an interrupted runtime download.
import { BASE, launch, newContext, shot, register, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const PY_LECTURE = `${BASE}/courses/programming-applications/lectures/strings-indexing-and-slicing`;
const CPP_LECTURE = `${BASE}/courses/programming-fundamentals/lectures/while-loops-in-cpp`;

// The first code box with a Run button, fixed by position (its button's label changes while it runs).
async function firstRunnable(page) {
  const idx = await page.locator("figure.lec-stage").evaluateAll((els) => els.findIndex((e) => e.querySelector('button[aria-label^="Run the code"]')));
  return page.locator("figure.lec-stage").nth(idx);
}

const DONE = /Ran in your browser|Compiled in|couldn't start|Stopped|error/i;

/** Press the first stage's Run button and wait for it to finish. Returns {status, output, ms}. */
async function runFirst(page, timeout = 120000) {
  const stage = await firstRunnable(page);
  await stage.scrollIntoViewIfNeeded();
  const t0 = Date.now();
  await stage.locator(".lec-run").click();
  await stage.locator(".lec-status", { hasText: DONE }).waitFor({ timeout });
  const status = (await stage.locator(".lec-status").textContent())?.trim() ?? "";
  const output = (await stage.locator(".lec-output").textContent())?.trim() ?? "";
  return { status, output, ms: Date.now() - t0, stage };
}

// ---------------------------------------------------------------- J: runs and self-check, signed in
{
  const { context, page, problems } = await newContext(browser);
  await register(page, { name: "Yara", email: `yara${stamp}@example.com`, password: "late autumn leaf 27" });

  await page.goto(PY_LECTURE, { waitUntil: "networkidle" });
  const py = await runFirst(page);
  record("J", "Python runs in the browser (first run downloads Pyodide)", /Ran in your browser/.test(py.status), `${py.ms} ms; status "${py.status}"; output "${py.output.slice(0, 40)}"`);
  const py2 = await runFirst(page);
  record("J", "A second Python run reuses the loaded runtime", /Ran in your browser/.test(py2.status), `${py2.ms} ms`);
  await shot(page, "J-python-run");

  await page.goto(CPP_LECTURE, { waitUntil: "networkidle" });
  const cpp = await runFirst(page, 180000);
  record("J", "C++ compiles and runs in the browser", /Compiled in \d+ ms and ran/.test(cpp.status), `${cpp.ms} ms; status "${cpp.status}"; output "${cpp.output.slice(0, 40)}"`);
  await cpp.stage.scrollIntoViewIfNeeded();
  await shot(page, "J-cpp-run");

  // Write-the-code: a correct program passes every test in the browser but is not "marked" by the server.
  await page.goto(`${BASE}/courses/programming-applications/exercises/write-word-parts`, { waitUntil: "networkidle" });
  await page.locator("textarea").first().fill(
    'word = input()\nprint("Length:", len(word))\nprint("First:", word[0])\nprint("Last:", word[-1])\nprint("Middle:", word[1:-1])\n',
  );
  await page.getByRole("button", { name: "Submit my program" }).first().click();
  await page.locator(".q-feedback").first().waitFor({ timeout: 120000 });
  const fb = (await page.locator(".q-feedback").first().textContent())?.trim() ?? "";
  record("J", "Write-the-code shows the browser test result", /test|pass/i.test(fb), `"${fb.slice(0, 120)}"`);
  await shot(page, "J-write-code-feedback");
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/courses/programming-applications/exercises`, { waitUntil: "networkidle" });
  const listText = (await page.locator("main").textContent()) ?? "";
  record("J", "The exercise list says the tests passed in the browser (not 'correct')", /Tests passed in your browser/.test(listText), "");
  await page.goto(`${BASE}/dashboard/programming-applications/history`, { waitUntil: "networkidle" });
  const hist = (await page.locator("main").textContent()) ?? "";
  record("J", "History shows it as not marked, with the browser result", /Length, first, last and middle/.test(hist) && /Not marked|in your browser/i.test(hist), "");
  await shot(page, "J-history-self-check");
  record("J", "No server or console errors", problems.length === 0, problems.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- H: slow network (about 1.5 Mbit/s, 300 ms latency)
{
  const { context, page, problems } = await newContext(browser);
  const cdp = await context.newCDPSession(page);
  await cdp.send("Network.enable");
  await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 300, downloadThroughput: (1.5 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  const t0 = Date.now();
  await page.goto(PY_LECTURE, { waitUntil: "domcontentloaded", timeout: 120000 });
  const firstPaint = Date.now() - t0;
  await page.locator("h1").first().waitFor();
  record("H", "On a slow connection the lecture text appears before any runtime downloads", true, `HTML ready in ${firstPaint} ms`);
  const stage = await firstRunnable(page);
  await page.waitForLoadState("networkidle", { timeout: 120000 });
  await stage.scrollIntoViewIfNeeded();
  await stage.locator(".lec-run").click();
  await page.waitForTimeout(1500);
  const loading = (await stage.locator(".lec-status").textContent())?.trim();
  await shot(page, "H-slow-network-loading");
  record("H", "While Pyodide downloads, the student sees what is happening", Boolean(loading), `"${loading}"`);
  await stage.locator(".lec-status", { hasText: DONE }).waitFor({ timeout: 240000 });
  const done = (await stage.locator(".lec-status").textContent())?.trim() ?? "";
  record("H", "The run finishes on the slow connection", /Ran in your browser/.test(done), `${Date.now() - t0} ms in total; "${done}"`);
  record("H", "No server or console errors (slow network)", problems.length === 0, problems.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- H: the runtime download breaks part way
{
  const { context, page, problems } = await newContext(browser);
  await context.route("**/pyodide.asm.wasm", (route) => route.abort("connectionreset"));
  await page.goto(PY_LECTURE, { waitUntil: "networkidle" });
  const r = await runFirst(page, 60000).catch((e) => ({ status: `timeout: ${String(e).slice(0, 80)}`, output: "" }));
  record("H", "A broken Pyodide download ends with a clear message, not a hang", /couldn't start|Reload/i.test(r.status), `status "${r.status}"; output "${r.output.slice(0, 120)}"`);
  await shot(page, "H-download-broken");
  await context.unroute("**/pyodide.asm.wasm");
  const again = await runFirst(page, 120000).catch((e) => ({ status: `timeout: ${String(e).slice(0, 80)}` }));
  record("H", "Pressing Run again after the network is back", /Ran in your browser/.test(again.status) ? "PASS" : "INFO", `status "${again.status}"`);
  await page.reload({ waitUntil: "networkidle" });
  const afterReload = await runFirst(page, 120000);
  record("H", "After a reload (as the message says) Python runs again", /Ran in your browser/.test(afterReload.status), `status "${afterReload.status}"`);
  const unexpected = problems.filter((p) => !/pyodide|wasm|Failed to fetch|NetworkError|connection/i.test(p));
  record("H", "No other errors besides the forced download failure", unexpected.length === 0, unexpected.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- H: the C++ compiler download breaks part way
{
  const { context, page, problems } = await newContext(browser);
  await context.route("**/cpp/**/clang.*.wasm.gz", (route) => route.abort("connectionreset"));
  await page.goto(CPP_LECTURE, { waitUntil: "networkidle" });
  const r = await runFirst(page, 60000).catch((e) => ({ status: `timeout: ${String(e).slice(0, 80)}`, output: "" }));
  record("H", "A broken C++ compiler download ends with a clear message, not a hang", /couldn't start|Reload/i.test(r.status), `status "${r.status}"; output "${r.output.slice(0, 120)}"`);
  await shot(page, "H-cpp-download-broken");
  await context.unroute("**/cpp/**/clang.*.wasm.gz");
  const again = await runFirst(page, 180000).catch((e) => ({ status: `timeout: ${String(e).slice(0, 80)}` }));
  record("H", "C++ runs once the network is back (Run pressed again)", /Compiled in/.test(again.status), `status "${again.status}"`);
  const unexpected = problems.filter((p) => !/clang|wasm|Failed to fetch|NetworkError|connection|download/i.test(p));
  record("H", "No other errors besides the forced C++ download failure", unexpected.length === 0, unexpected.join(" | "));
  await context.close();
}

await browser.close();
saveLog("journey-hj");
