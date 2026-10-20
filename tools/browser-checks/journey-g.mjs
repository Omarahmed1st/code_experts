// Scenario G: password recovery with the recovery code, then account deletion.
import { BASE, launch, newContext, shot, register, signIn, signOut, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
const who = { name: "Nour", email: `nour${stamp}@example.com`, password: "soft cotton cloud 36" };

const { context, page, problems } = await newContext(browser);
const code = await register(page, who);
await page.goto(`${BASE}/courses/programming-fundamentals/exercises/dowhile-correct-syntax`, { waitUntil: "networkidle" });
await page.locator("label.q-option").first().click();
await page.getByRole("button", { name: /Check answer/i }).first().click();
await page.locator(".q-feedback").first().waitFor();
await signOut(page);

async function recover(p, recoveryCode, newPassword) {
  await p.goto(`${BASE}/forgot-password`, { waitUntil: "networkidle" });
  await p.fill("#email", who.email);
  await p.fill("#code", recoveryCode);
  await p.fill("#password", newPassword);
  await p.click('button[type="submit"]');
  return p
    .getByText("Save your recovery code now")
    .waitFor({ timeout: 8000 })
    .then(async () => (await p.locator('[aria-label^="Recovery code"]').textContent()).trim())
    .catch(async () => null);
}

const wrong = await recover(page, "AAAA-BBBB-CCCC-DDDD", "new forest path 99");
const wrongMsg = (await page.locator('[role="alert"], [data-tone="error"]').first().textContent().catch(() => ""))?.trim();
record("G", "A wrong recovery code is refused", wrong === null, `"${wrongMsg?.slice(0, 100)}"`);

const newCode = await recover(page, code, "new forest path 99");
record("G", "The right code resets the password and shows a new code", Boolean(newCode) && newCode !== code, "new code differs from the old one");
await shot(page, "G-recovered-new-code");
await signOut(page);

const reused = await recover(page, code, "another path here 11");
record("G", "The old recovery code can't be used twice", reused === null, "");

await signIn(page, who.email, "new forest path 99");
record("G", "Sign in works with the new password", !page.url().includes("/login"), page.url().replace(BASE, ""));
await page.goto(`${BASE}/dashboard/programming-fundamentals/history`, { waitUntil: "networkidle" });
record("G", "Progress survives the password reset", /do-while|do while/i.test((await page.locator("main").textContent()) ?? ""), "");

// Delete the account.
await page.goto(`${BASE}/settings`, { waitUntil: "networkidle" });
await page.fill("#deletePassword", "new forest path 99");
await page.fill("#confirm", "delete please");
await page.getByRole("button", { name: "Delete my account" }).click();
await page.waitForTimeout(1500);
record("G", "Deletion needs the exact word DELETE", page.url().endsWith("/settings"), "");
await page.fill("#deletePassword", "new forest path 99");
await page.fill("#confirm", "DELETE");
await page.getByRole("button", { name: "Delete my account" }).click();
await page.waitForURL(/account-deleted/, { timeout: 15000 }).catch(() => {});
record("G", "The account is deleted and the visitor is told so", page.url().includes("/account-deleted"), page.url().replace(BASE, ""));
await shot(page, "G-account-deleted");
const c = (await context.cookies()).find((x) => x.name === "ce_session");
record("G", "The session cookie is cleared", !c?.value, "");

const { context: c2, page: p2 } = await newContext(browser);
await p2.goto(`${BASE}/login`, { waitUntil: "networkidle" });
await p2.fill("#email", who.email);
await p2.fill("#password", "new forest path 99");
await p2.click('button[type="submit"]');
await p2.waitForTimeout(1500);
record("G", "The deleted account can't sign in", p2.url().includes("/login"), "");
await c2.close();
record("G", "No server or console errors", problems.length === 0, problems.join(" | "));
await browser.close();
saveLog("journey-g");
console.log(who.email);
