// Scenario D (limited final quiz) and E (custom exam with reload and resume).
import { BASE, launch, newContext, shot, register, signIn, signOut, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const QUIZ = `${BASE}/courses/programming-fundamentals/quizzes/final-quiz`;
const tries = (page) => page.locator(".quiz-tries").first().textContent({ timeout: 10000 }).then((t) => t?.trim() ?? "");

async function takeFinalQuiz(page) {
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Start the quiz" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).waitFor({ timeout: 15000 });
  const firstChoice = page.locator('main input[type="radio"]').first();
  if (await firstChoice.count()) await firstChoice.check({ force: true });
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("button", { name: "Submit now" }).click();
  await page.getByText("Review your answers").waitFor({ timeout: 20000 });
}

const s1 = { name: "Ali", email: `ali${stamp}@example.com`, password: "red brick house 19" };
const s2 = { name: "Sara", email: `sara${stamp}@example.com`, password: "tall pine forest 64" };

// ---------------------------------------------------------------- D: final quiz, 2 tries then a 24-hour lock
{
  const { context, page, problems } = await newContext(browser);
  await register(page, s1);
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  const t0 = await tries(page);
  record("D", "A new student starts with 2 of 2 tries", /2 of 2 attempts left/.test(t0), `"${t0}"`);

  await takeFinalQuiz(page);
  await shot(page, "D-final-quiz-result-1");
  const reviewRows = await page.locator("text=/Right|Wrong|Not answered/").count();
  record("D", "Answers and explanations appear only after submitting", reviewRows > 0, `${reviewRows} review marks after submit`);
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  const t1 = await tries(page);
  record("D", "One try is used after the first attempt", /1 of 2 attempts left/.test(t1), `"${t1}"`);

  await takeFinalQuiz(page);
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  const t2 = await tries(page);
  const startDisabled = await page.getByRole("button", { name: "Start the quiz" }).isDisabled();
  record("D", "Locked after 2 tries, with the time until it opens", /^Locked: you've used all 2 attempts\. It opens again in/.test(t2) && startDisabled, `"${t2}", start disabled=${startDisabled}`);
  await shot(page, "D-final-quiz-locked");

  // The server refuses a third start even if the page is bypassed.
  const direct = await page.request.post(`${BASE}/api/courses/programming-fundamentals/quizzes/final-quiz/start`, { headers: { Origin: BASE, "Content-Type": "application/json" }, data: {} });
  record("D", "The server refuses a third start sent directly", direct.status() >= 400, `HTTP ${direct.status()} ${(await direct.text()).slice(0, 100)}`);

  await signOut(page);
  await signIn(page, s1.email, s1.password);
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  const t3 = await tries(page);
  record("D", "The lock survives signing out and back in", /^Locked/.test(t3), `"${t3}"`);

  // A fresh browser (no local storage) for the same account is also locked.
  const { context: c3, page: p3 } = await newContext(browser);
  await signIn(p3, s1.email, s1.password);
  await p3.goto(QUIZ, { waitUntil: "networkidle" });
  const t4 = await tries(p3);
  record("D", "The lock follows the account to another browser", /^Locked/.test(t4), `"${t4}"`);
  await c3.close();
  record("D", "No server or console errors (student 1)", problems.length === 0, problems.join(" | "));
  await context.close();
}
{
  const { context, page, problems } = await newContext(browser);
  await register(page, s2);
  await page.goto(QUIZ, { waitUntil: "networkidle" });
  const t = await tries(page);
  record("D", "Another student's tries are independent", /2 of 2 attempts left/.test(t), `"${t}"`);
  record("D", "No server or console errors (student 2)", problems.length === 0, problems.join(" | "));

  // ---------------------------------------------------------------- E: custom exam, reload mid-way, resume
  await page.goto(`${BASE}/courses/programming-fundamentals/build-exam`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /select all|all topics/i }).first().click().catch(() => {});
  await page.locator('input[name="count"]').first().check({ force: true });
  await page.selectOption('select[aria-label="Timer"]', { index: 1 });
  await page.getByRole("button", { name: "Start my exam" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).waitFor({ timeout: 15000 });
  await shot(page, "E-custom-exam-running");
  const choice = page.locator('main input[type="radio"]').first();
  const hadChoice = (await choice.count()) > 0;
  if (hadChoice) await choice.check({ force: true });
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: "networkidle" });
  const resume = await page.getByText(/You have an unfinished exam/).textContent({ timeout: 10000 }).catch(() => "");
  record("E", "Reloading mid-exam offers to resume it", Boolean(resume), `"${resume?.trim()}"`);
  await shot(page, "E-custom-exam-resume");
  const progressText = await page.locator(".q-feedback").first().textContent();
  record("E", "The resume card keeps the answers and the remaining time", hadChoice ? /1 of \d+ answered, \d+:\d\d left/.test(progressText ?? "") : "PARTIALLY VERIFIED", `"${progressText?.trim().slice(0, 120)}"`);
  await page.getByRole("button", { name: "Resume" }).click();
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await page.getByRole("button", { name: "Submit now" }).click();
  await page.getByText("Review your answers").waitFor({ timeout: 20000 });
  record("E", "The resumed exam submits and shows its review", true, "");
  await shot(page, "E-custom-exam-review");
  await page.goto(`${BASE}/dashboard/programming-fundamentals/history`, { waitUntil: "networkidle" });
  const hist = await page.locator("main").textContent();
  record("E", "The custom exam appears in history", /exam/i.test(hist ?? ""), "");
  record("E", "No server or console errors", problems.length === 0, problems.join(" | "));
  await context.close();
}

await browser.close();
saveLog("journey-de");
console.log(JSON.stringify({ s1, s2 }));
