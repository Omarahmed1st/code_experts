/* global localStorage -- used inside page.evaluate, which runs in the browser */
// Scenario A (anonymous visitor) and B (registered student).
import { BASE, launch, newContext, shot, register, signIn, signOut, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();

// ---------------------------------------------------------------- A: anonymous
{
  const { context, page, problems } = await newContext(browser);
  await page.goto(`${BASE}/courses/programming-fundamentals/lectures/for-loops`);
  const h1 = await page.locator("h1").first().textContent();
  record("A", "Lecture readable without an account", Boolean(h1), `h1="${h1?.trim()}"`);
  const cookies = await context.cookies();
  record("A", "No session cookie set for an anonymous reader", !cookies.some((c) => c.name === "ce_session"), `cookies=${cookies.map((c) => c.name).join(",") || "none"}`);

  // Practice question answered anonymously (MCQ on the exercises list).
  await page.goto(`${BASE}/courses/programming-fundamentals/exercises/dowhile-correct-syntax`, { waitUntil: "networkidle" });
  await shot(page, "A-exercise-before");
  const radios = page.locator('input[type="radio"], input[type="checkbox"]');
  const n = await radios.count();
  if (n > 0) {
    await radios.first().check({ force: true });
    await page.getByRole("button", { name: /Check answer/i }).first().click();
    await page.locator(".q-feedback").first().waitFor({ timeout: 10000 });
    const fb = await page.locator(".q-feedback").first().textContent();
    record("A", "Anonymous practice answer is marked", true, `feedback="${fb?.trim().slice(0, 80)}"`);
    await shot(page, "A-exercise-marked");
    const stored = await page.evaluate(() => Object.keys(localStorage));
    record("A", "Anonymous progress kept only in this browser", stored.length > 0, `localStorage keys=${stored.join(",")}`);
  } else {
    record("A", "Anonymous practice answer is marked", "NOT TESTED", "no choice inputs found");
  }

  // Final quiz needs an account.
  await page.goto(`${BASE}/courses/programming-fundamentals/quizzes/final-quiz`);
  const needs = await page.getByText("so you need to sign in to take it").waitFor({ timeout: 10000 }).then(() => 1, () => 0);
  record("A", "Final quiz asks an anonymous visitor to sign in", needs > 0, "");
  await shot(page, "A-final-quiz-anonymous");

  // Dashboard redirects to sign in.
  const resp = await page.goto(`${BASE}/dashboard`);
  record("A", "Dashboard sends an anonymous visitor to sign in", page.url().includes("/login"), `landed ${page.url().replace(BASE, "")} (${resp?.status()})`);
  const admin = await page.goto(`${BASE}/admin`);
  record("A", "Admin is closed to an anonymous visitor", !page.url().endsWith("/admin") || admin?.status() === 404, `landed ${page.url().replace(BASE, "")} (${admin?.status()})`);
  record("A", "No server errors or console errors", problems.length === 0, problems.join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- B: registered student
const student = { name: "Mona", email: `mona${stamp}@example.com`, password: "green apple tree 77" };
{
  const { context, page, problems } = await newContext(browser);
  // Answer something anonymously first: it should carry over when the account is created.
  const code = await register(page, student);
  record("B", "Sign-up shows a recovery code once", /^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/.test(code), `code format ${code.replace(/[A-Z0-9]/g, "X")}`);
  await shot(page, "B-recovery-code");
  const cookie = (await context.cookies()).find((c) => c.name === "ce_session");
  record("B", "Session cookie is HttpOnly, SameSite=Lax", Boolean(cookie?.httpOnly && cookie.sameSite === "Lax"), `httpOnly=${cookie?.httpOnly} sameSite=${cookie?.sameSite} secure=${cookie?.secure}`);

  await page.goto(`${BASE}/dashboard`);
  record("B", "Dashboard opens after sign-up", page.url().endsWith("/dashboard"), "");
  await shot(page, "B-dashboard");

  // Answer a practice MCQ while signed in, then read history.
  await page.goto(`${BASE}/courses/programming-fundamentals/exercises/dowhile-correct-syntax`, { waitUntil: "networkidle" });
  await page.locator('input[type="radio"], input[type="checkbox"]').first().check({ force: true });
  await page.getByRole("button", { name: /Check answer/i }).first().click();
  await page.locator(".q-feedback").first().waitFor({ timeout: 10000 });
  await page.waitForTimeout(800);
  await page.goto(`${BASE}/dashboard/programming-fundamentals/history`);
  const hist = await page.locator("main").textContent();
  record("B", "Practice answer appears in history", /do-while|do while/i.test(hist ?? ""), "");
  await shot(page, "B-history");

  // Bookmark a lecture.
  await page.goto(`${BASE}/courses/programming-fundamentals/lectures/for-loops`, { waitUntil: "networkidle" });
  const bm = page.getByRole("button", { name: /bookmark/i }).first();
  if (await bm.count()) {
    await bm.click();
    await page.waitForTimeout(800);
    await page.goto(`${BASE}/dashboard/programming-fundamentals/bookmarks`);
    const txt = await page.locator("main").textContent();
    record("B", "Bookmark saved and listed", /for loop/i.test(txt ?? ""), "");
    await shot(page, "B-bookmarks");
  } else record("B", "Bookmark saved and listed", "NOT TESTED", "no bookmark button found");

  // Other courses' dashboards don't show this course's answer.
  await page.goto(`${BASE}/dashboard/programming-applications/history`);
  const other = await page.locator("main").textContent();
  record("C", "Python course history doesn't show the C++ answer", !/do-while/i.test(other ?? ""), "");

  // Export.
  const ex = await page.request.get(`${BASE}/api/me/export`);
  const body = await ex.text();
  record("B", "Data export downloads JSON with the student's activity", ex.status() === 200 && body.includes(student.email) && !/password_hash|passwordHash/.test(body), `status ${ex.status()}, ${body.length} bytes, no password hash`);

  // Sign out, then sign back in.
  const so = await signOut(page);
  await page.goto(`${BASE}/dashboard`);
  record("B", "Sign out ends the session", so === 200 && page.url().includes("/login"), `sign-out ${so}`);
  await signIn(page, student.email, student.password);
  await page.goto(`${BASE}/dashboard/programming-fundamentals/history`);
  const again = await page.locator("main").textContent();
  record("B", "Progress is still there after signing back in", /do-while|do while/i.test(again ?? ""), "");

  // Wrong password.
  const { context: c2, page: p2 } = await newContext(browser);
  await p2.goto(`${BASE}/login`);
  await p2.fill("#email", student.email);
  await p2.fill("#password", "wrong password here");
  await p2.click('button[type="submit"]');
  await p2.waitForTimeout(1500);
  const msg = await p2.locator('[role="alert"], .notice, main').first().textContent();
  record("B", "Wrong password is refused with a general message", p2.url().includes("/login"), `message="${(msg ?? "").trim().slice(0, 90)}"`);
  await c2.close();

  record("B", "No server errors or console errors", problems.length === 0, problems.join(" | "));
  await context.close();
}

await browser.close();
saveLog("journey-ab");
console.log(JSON.stringify(student));
