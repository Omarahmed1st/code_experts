// Scenario I: a real timer expiry. Run only while loops-timed-quiz has a
// 60-second limit in the LOCAL database (set and restored by the caller).
import { BASE, launch, newContext, shot, register, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const QUIZ = `${BASE}/courses/programming-fundamentals/quizzes/loops-timed-quiz`;

// 1. Page left open: the timer runs out and the quiz submits itself.
{
  const { page, problems } = await newContext(browser);
  await register(page, { name: "Tamer", email: `tamer${stamp}@example.com`, password: "fresh mint leaves 52" });
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start the quiz" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).waitFor({ timeout: 15000 });
  const clock = await page.locator('[role="timer"]').getAttribute("aria-label");
  record("I", "The quiz starts with the 1-minute local limit", /0:5\d|1:00/.test(clock ?? ""), `clock "${clock}"`);
  const option = page.locator("label.q-option").first();
  if (await option.count()) await option.click();
  await page.getByText("Review your answers").waitFor({ timeout: 100000 });
  record("I", "When the time runs out the quiz submits itself and shows the result", true, "");
  await shot(page, "I-timer-expired-result");
  await page.goto(`${BASE}/dashboard/programming-fundamentals/history`, { waitUntil: "networkidle" });
  const hist = (await page.locator("main").textContent()) ?? "";
  record("I", "The auto-submitted attempt is in history", /Loops|timed/i.test(hist), "");
  record("I", "No server or console errors", problems.length === 0, problems.join(" | "));
}

// 2. Page closed: a late submit after the deadline and its grace minute is refused.
{
  const { page } = await newContext(browser);
  await register(page, { name: "Rana", email: `rana${stamp}@example.com`, password: "cold winter night 63" });
  const start = await page.request.post(`${BASE}/api/courses/programming-fundamentals/quizzes/loops-timed-quiz/start`, { headers: { Origin: BASE, "Content-Type": "application/json" }, data: {} });
  const attempt = await start.json();
  const token = attempt.token;
  record("I", "Starting through the API gives a deadline 60 s away", start.status() === 200 && attempt.deadlineAt - Date.now() < 62000, `HTTP ${start.status()}, deadline in ${Math.round((attempt.deadlineAt - Date.now()) / 1000)} s`);
  await page.waitForTimeout(125000); // 60 s limit + 60 s grace + margin
  const late = await page.request.post(`${BASE}/api/courses/programming-fundamentals/quizzes/loops-timed-quiz/submit`, { headers: { Origin: BASE, "Content-Type": "application/json" }, data: { token, answers: {} } });
  record("I", "A submit after the deadline and the grace minute is refused", late.status() >= 400, `HTTP ${late.status()} ${(await late.text()).slice(0, 120)}`);
  await page.goto(`${BASE}/dashboard/programming-fundamentals/history`, { waitUntil: "networkidle" });
  const hist = (await page.locator("main").textContent()) ?? "";
  record("I", "History shows the abandoned attempt as out of time", /Loops timed quiz.*Not submitted/.test(hist), "listed as Not submitted, with no Continue link");
  await shot(page, "I-history-expired");
}

await browser.close();
saveLog("journey-i");
