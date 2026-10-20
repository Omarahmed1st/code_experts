// Scenario F: administrator, course admin and editor, and a student kept out of the admin.
import { BASE, launch, newContext, shot, register, signIn, record, saveLog } from "./lib.mjs";

const browser = await launch();
const stamp = Date.now();
// An administrator of the LOCAL database (make one with `npm run admin:create`).
const ADMIN = { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD };
if (!ADMIN.email || !ADMIN.password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to a local administrator account.");
const coursePages = (c) =>
  ["", "/lectures", "/lectures/new", "/questions", "/questions/new", "/questions/import", "/quizzes", "/quizzes/new", "/exams", "/exams/new", "/files", "/files/new", "/topics", "/settings", "/students", "/activity"].map(
    (p) => `/admin/courses/${c}${p}`,
  );
const sitePages = ["/admin", "/admin/account", "/admin/audit-log", "/admin/courses", "/admin/courses/new", "/admin/students", "/admin/users"];
// Phase 6: administrator-only pages (advertising, consent, site details, contact messages).
const phase6Pages = ["/admin/ads", "/admin/ads/placements/new", "/admin/site", "/admin/messages"];

/** Visit each page; returns [path, status, landedOn]. */
async function visit(page, paths) {
  const out = [];
  for (const p of paths) {
    const r = await page.goto(BASE + p, { waitUntil: "networkidle" });
    out.push([p, r?.status() ?? 0, page.url().replace(BASE, "")]);
  }
  return out;
}
const allowed = (rows) => rows.filter(([p, s, landed]) => s === 200 && landed === p);
const refused = (rows) => rows.filter(([p, s, landed]) => s === 404 || s === 403 || landed !== p);

// ---------------------------------------------------------------- administrator
const { context: ac, page: ap, problems: aprob } = await newContext(browser);
await signIn(ap, ADMIN.email, ADMIN.password, "/admin");
const adminRows = await visit(ap, [...sitePages, ...phase6Pages, ...["programming-fundamentals", "programming-applications", "computer-vision"].flatMap(coursePages)]);
const adminBad = adminRows.filter(([p, s, landed]) => s !== 200 || landed !== p);
record("F", `Administrator opens all ${adminRows.length} admin pages`, adminBad.length === 0, adminBad.map((r) => r.join(" ")).join("; "));
await ap.goto(`${BASE}/admin`, { waitUntil: "networkidle" });
await shot(ap, "F-admin-home");
await ap.goto(`${BASE}/admin/courses/programming-fundamentals/students`, { waitUntil: "networkidle" });
await shot(ap, "F-admin-course-students");

// Create an editor (Computer Vision only) and a course admin (C++ only).
async function createStaff(name, email, cvRole, cppRole) {
  await ap.goto(`${BASE}/admin/users`, { waitUntil: "networkidle" });
  await ap.getByRole("button", { name: "Add a staff member" }).click();
  await ap.fill("#name", name);
  await ap.fill("#email", email);
  if (cvRole) await ap.selectOption('select[aria-label^="Role in"][aria-label*="Vision"]', cvRole);
  if (cppRole) await ap.selectOption('select[aria-label^="Role in"][aria-label*="Fundamentals"]', cppRole);
  await ap.getByRole("button", { name: "Create account" }).click();
  await ap.getByText(`Temporary password for ${email}`).waitFor({ timeout: 15000 });
  return (await ap.locator("code").first().textContent()).trim();
}
const selects = await (async () => {
  await ap.goto(`${BASE}/admin/users`, { waitUntil: "networkidle" });
  await ap.getByRole("button", { name: "Add a staff member" }).click();
  return ap.locator('select[aria-label^="Role in"]').evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
})();
console.log("course selects:", selects);
const editor = { email: `editor${stamp}@example.com`, password: "" };
const cadmin = { email: `cadmin${stamp}@example.com`, password: "" };
editor.password = await createStaff("Eve Editor", editor.email, "editor", null);
cadmin.password = await createStaff("Cal Admin", cadmin.email, null, "course_admin");
record("F", "Administrator creates staff with a one-time temporary password", editor.password.length >= 10 && cadmin.password.length >= 10, "shown once on screen");
record("F", "No server or console errors (administrator)", aprob.length === 0, aprob.join(" | "));

async function staffSession(who, newPassword) {
  const { context, page, problems } = await newContext(browser);
  await signIn(page, who.email, who.password, "/admin");
  const forced = (await page.getByText("You are using a temporary password").count()) > 0;
  await page.goto(`${BASE}/admin/account`, { waitUntil: "networkidle" });
  await page.fill("#currentPassword", who.password);
  await page.fill("#newPassword", newPassword);
  await page.fill("#confirmPassword", newPassword);
  await page.getByRole("button", { name: /change|save/i }).first().click();
  await page.waitForTimeout(1500);
  return { context, page, problems, forced };
}

// ---------------------------------------------------------------- editor (Computer Vision only)
{
  const { context, page, problems, forced } = await staffSession(editor, "silver moon lake 88");
  record("F", "A new staff member is told to replace the temporary password", forced, "banner on the admin pages until they do");
  const mine = await visit(page, ["/admin/courses/computer-vision/lectures", "/admin/courses/computer-vision/questions"]);
  record("F", "Editor opens their own course", allowed(mine).length === mine.length, mine.map((r) => r.join(" ")).join("; "));
  const notMine = await visit(page, [...coursePages("programming-fundamentals").slice(0, 4), "/admin/courses/programming-applications/lectures", "/admin/users", "/admin/audit-log", "/admin/students", "/admin/courses/new", ...phase6Pages]);
  record("F", "Editor is refused other courses and site-wide pages", refused(notMine).length === notMine.length, notMine.filter((r) => !refused([r]).length).map((r) => r.join(" ")).join("; ") || `${notMine.length} refused`);
  await page.goto(`${BASE}/admin/courses/computer-vision/lectures`, { waitUntil: "networkidle" });
  await shot(page, "F-editor-cv-lectures");
  const publish = await page.getByRole("button", { name: /publish/i }).count();
  record("F", "Editor sees no publish button on the lecture list", publish === 0, `${publish} publish buttons`);
  record("F", "No server errors (editor; 404s are the refused pages)", problems.filter((p) => !/404/.test(p)).length === 0, problems.filter((p) => !/404/.test(p)).join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- course admin (C++ only)
{
  const { context, page, problems } = await staffSession(cadmin, "golden sand dune 23");
  const mine = await visit(page, coursePages("programming-fundamentals"));
  record("F", "Course admin opens every page of their course", allowed(mine).length === mine.length, mine.filter((r) => !allowed([r]).length).map((r) => r.join(" ")).join("; "));
  const notMine = await visit(page, ["/admin/courses/computer-vision/lectures", "/admin/users", "/admin/audit-log", ...phase6Pages]);
  record("F", "Course admin is refused other courses, staff accounts and the advertising/site pages", refused(notMine).length === notMine.length, notMine.map((r) => r.join(" ")).join("; "));
  record("F", "No server errors (course admin; 404s are the refused pages)", problems.filter((p) => !/404/.test(p)).length === 0, problems.filter((p) => !/404/.test(p)).join(" | "));
  await context.close();
}

// ---------------------------------------------------------------- a student can't reach the admin
{
  const { context, page } = await newContext(browser);
  await register(page, { name: "Omar", email: `omar${stamp}@example.com`, password: "warm summer rain 45" });
  const rows = await visit(page, ["/admin", "/admin/courses/programming-fundamentals/lectures", "/admin/users", ...phase6Pages]);
  record("F", "A student is refused every admin page", refused(rows).length === rows.length, rows.map((r) => r.join(" ")).join("; "));
  await context.close();
}
await ac.close();
await browser.close();
saveLog("journey-f");
