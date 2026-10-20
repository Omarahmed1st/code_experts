// Scenario E detail: answer one multiple-choice question, reload, check the resume card.
import { BASE, launch, newContext, shot, register, record, saveLog } from "./lib.mjs";
const browser = await launch();
const { page, problems } = await newContext(browser);
await register(page, { name: "Huda", email: `huda${Date.now()}@example.com`, password: "quiet river bank 58" });
await page.goto(`${BASE}/courses/programming-fundamentals/build-exam`, { waitUntil: "networkidle" });
for (const name of ["Trace the code", "Correct the code"]) await page.getByLabel(name).uncheck();
await page.getByLabel("5", { exact: true }).check();
await page.selectOption('select[aria-label="Timer"]', { index: 1 });
await page.getByRole("button", { name: "Start my exam" }).click();
await page.getByRole("button", { name: "Submit", exact: true }).waitFor({ timeout: 15000 });
const total = await page.locator("text=/Question 1 of \\d+/").first().textContent().catch(() => "");
await page.locator('label.q-option').first().click();
await page.waitForTimeout(500);
await page.reload({ waitUntil: "networkidle" });
const card = (await page.locator(".q-feedback").first().textContent({ timeout: 10000 }))?.trim();
record("E", "Resume card keeps the answer and the remaining time after a reload", /1 of 5 answered, \d+:\d\d left/.test(card ?? ""), `"${card?.slice(-60)}" (${total})`);
await page.locator(".q-feedback").first().scrollIntoViewIfNeeded();
await shot(page, "E-custom-exam-resume-card");
await page.getByRole("button", { name: "Resume" }).click();
// The first option's input: a radio, or a checkbox when the question takes several answers.
const still = await page.locator("label.q-option input").first().isChecked();
record("E", "After Resume the chosen answer is still selected", still, "");
record("E", "No server or console errors", problems.length === 0, problems.join(" | "));
await browser.close();
saveLog("journey-e2");
