# Phase 6: changed files

Compared with `CodeExpert_Phase5_1_Reviewed.zip`. Generated folders (`node_modules`, `dist`, `.wrangler`, `public/pyodide`, `public/cpp`, `.drizzle-mirror`, `worker-configuration.d.ts`) are left out, as in the ZIP. No dependency was added or changed (`package.json` and `package-lock.json` are identical to Phase 5.1). No applied migration (0001 to 0006) was edited.

## Database

| File | Change |
|---|---|
| `migrations/0007_phase6_ads_consent.sql` | **New, additive.** Rebuilds the two ad tables created (but never written to) in 0001, because SQLite can't change a CHECK in place: every existing row is copied; ad unit ids must be digits; a placement can't be on without one; page types `topic` and `exercise` added; `responsive`, `devices`, `created_at` columns; exclusions gain a `kind` (path, course, page type). Recreates the NULL-id triggers from 0006. |
| `src/db/enums.ts`, `src/db/schema/site.ts` | Drizzle mirror of 0007 (new enums `AD_DEVICES`, `AD_EXCLUSION_KIND`, wider `AD_PAGE_TYPE`). |

## Advertising

| File | Change |
|---|---|
| `src/lib/ads/policy.ts` | **New.** All ad rules as pure functions: positions, caps, the never-list, id validation, glob matching, readiness checklist, per-page decision, lecture breaks, ads.txt line. |
| `src/lib/ads/browser.ts` | **New.** Browser helpers: preview flag, device match, this site's storage keys. |
| `src/server/ads/settings.ts` | **New.** Reads settings, consent, placements and exclusions; `pageAds()` for pages; falls back to "off" on any error. |
| `src/server/ads/readiness.ts` | **New.** Per-course content counts and preview links for the admin. |
| `src/server/admin/ads.ts` | **New.** Validated, audited writes for settings, consent, placements and exclusions. |
| `src/components/ads/ad-slot.tsx`, `ad-unit.tsx`, `ad-preview.tsx`, `ad-loader.ts` | **New.** The slot (nothing, hidden marker, or live unit), the labelled AdSense unit with reserved space and unfilled folding, the staff preview box, and the script loader with the TCF consent wait. |
| `src/styles/ads.css` | **New.** Label, reserved space, preview box. |
| `src/app/(site)/page.tsx` | Two home positions; verification meta tags. |
| `src/app/(site)/courses/[course]/page.tsx` | One position below the outline (courses with lectures only). |
| `src/app/(site)/courses/[course]/lectures/[lecture]/page.tsx` | In-text breaks and the end position. |
| `src/app/(site)/courses/[course]/exercises/[exercise]/page.tsx` | One position below the question (not on demo questions). |
| `src/app/(site)/courses/[course]/resources/[resource]/page.tsx` | One position below a real description. |
| `src/app/ads.txt/route.ts` | **New.** `/ads.txt`: 404 until a valid publisher id, then Google's line. |

## Administration

| File | Change |
|---|---|
| `src/app/(staff)/admin/ads/page.tsx`, `ads-forms.tsx`, `actions.ts` | **New.** Advertising page: checklist, settings, consent, placements list, exclusions, never-list, preview links, content per course, change history. |
| `src/app/(staff)/admin/ads/placements/new/page.tsx`, `[id]/page.tsx`, `placement-form.tsx`, `labels.ts` | **New.** Create, edit and delete a placement. |
| `src/app/(staff)/admin/site/page.tsx`, `site-form.tsx`, `actions.ts` | **New.** Site details: operator name, contact email, country, effective date, "reviewed" tick, Search Console token, AdSense meta tag. |
| `src/app/(staff)/admin/messages/page.tsx`, `message-actions.tsx` | **New.** Contact inbox: read, archive, delete. |
| `src/server/admin/site.ts` | **New.** Validated, audited writes for site details and the inbox. |
| `src/components/admin/admin-nav.tsx` | Messages, Advertising and Site details links (administrators only). |
| `src/lib/auth/permissions.ts` | New site actions `manageAds`, `manageSite`, `readMessages` (administrators only). |
| `src/server/admin/audit.ts` | `listAudit` can filter by action prefixes (for the Advertising page's history). |
| `src/lib/admin/audit-text.ts` | Wording for the new audit actions. |

## Legal pages, consent and contact

| File | Change |
|---|---|
| `src/app/(site)/privacy-policy/page.tsx`, `terms/page.tsx`, `cookie-policy/page.tsx`, `advertising/page.tsx` | **New.** Draft legal pages built from the real data inventory, with marked gaps for the owner's details. |
| `src/app/(site)/contact/page.tsx`, `contact-form.tsx`, `actions.ts` | **New.** Contact form with honeypot, time check, Turnstile and rate limit. |
| `src/server/contact.ts` | **New.** Contact validation, spam checks, storage. |
| `src/app/(site)/privacy-choices/page.tsx`, `choices-panel.tsx` | **New.** Change ad consent; clear this site's data on this device. `noindex`. |
| `src/components/legal/legal-parts.tsx`, `src/styles/legal.css` | **New.** Draft notice, owner-detail gaps, effective date, keyboard-reachable tables. |
| `src/lib/site/owner.ts`, `src/server/site/owner.ts` | **New.** The owner's details: parsing, validation, what's missing. |
| `src/lib/site/verification.ts`, `src/server/site/verification.ts` | **New.** Search Console and AdSense verification meta tags. |
| `src/server/site/legal.ts` | **New.** What the legal pages need (owner, ads live, consent platform). |
| `src/app/(site)/about/page.tsx` | "Who runs it" section (owner's details or a marked gap), mention of ads, link to the advertising page. |
| `src/components/layout/site-footer.tsx` | Contact link; new "Legal" column (privacy, terms, cookies, advertising, privacy choices). |
| `src/components/layout/site-chrome.tsx` | Shows the "Privacy choices" link whenever ads can load. |
| `src/components/account/me.ts` | `whoIsSignedIn()` for the staff-only preview. |
| `src/app/sitemap.ts` | Contact and legal pages added. |
| `src/app/globals.css` | Imports `ads.css` and `legal.css`. |

## Configuration

| File | Change |
|---|---|
| `wrangler.jsonc` | Comments on the two ad switches and `CMP_SCRIPT_URL`. `ADS_ENABLED` stays `"false"`. |
| `src/server/platform/config.ts`, `env.ts` | Reads `CMP_SCRIPT_URL` (validated, https only). |
| `.dev.vars.example` | Note: ads need no secret. |

## Tools (Windows folders with spaces)

| File | Change |
|---|---|
| `tools/wrangler.ts` | **New.** Runs the project's own wrangler without a shell. |
| `tools/build-content.ts`, `check-exercise-code.ts`, `check-lesson-code.ts`, `copy-cpp-runtime.mjs`, `copy-pyodide.mjs`, `create-admin.ts`, `seed-r2.ts` | `fileURLToPath` instead of `.pathname`; wrangler calls through `tools/wrangler.ts`. |

## Tests and browser checks

| File | Change |
|---|---|
| `tests/unit/phase6-ads.test.ts` | **New.** 32 test blocks (some run a table of cases) for the ad rules. |
| `tests/unit/phase6-site.test.ts` | **New.** Consent handshake, browser helpers, owner rules, verification tags, legal pages match the code, footer links, Windows path guard. |
| `tests/integration/phase6.test.ts` | **New.** Admin-only access, settings, consent, placements, exclusions, local build never live, `/ads.txt`, site details, contact form, inbox, audit filter. |
| `tests/integration/phase6-migration.test.ts` | **New.** Applies 0001 to 0006 with old rows, then 0007, and checks the rows survive and the new rules hold. |
| `tests/integration/health.test.ts`, `db-helpers.ts` | 0007 listed; new tables cleared between tests. |
| `tools/browser-checks/journey-k.mjs` | **New.** Ads off, staff preview, admin flows, contact, access, privacy choices. |
| `tools/browser-checks/journey-l.mjs` | **New.** Live-ad path in production mode with stand-in Google scripts (no request reaches Google). |
| `tools/browser-checks/perf.mjs` | **New.** Local lab timings (LCP, layout shift, first paint, bytes). |
| `tools/browser-checks/journey-f.mjs` | Covers the new administrator-only pages. |
| `tools/browser-checks/README.md` | Journeys K and L, the performance script. |

## Documentation

`README.md` (Phase 6 status, migration 0007, folders with spaces), `docs/ARCHITECTURE.md` (Phase 6 modules), and the Phase 6 reports: `PHASE_6_SUMMARY.md`, `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`, `PHASE_6_AD_PLACEMENT_PLAN.md`, `PHASE_6_PRIVACY_AND_CONSENT.md`, `PHASE_6_CONTENT_READINESS.md`, `PHASE_6_SEO_REPORT.md`, `PHASE_6_SECURITY_REVIEW.md`, `PHASE_6_TEST_REPORT.md`, `PHASE_6_BUG_REPORT.md`, `PHASE_6_CHANGED_FILES.md`, `PHASE_6_OWNER_ACTIONS.md`, `PHASE_6_DEPLOYMENT_READINESS.md`.

## Follow-up: Python and Computer Vision lectures (2026-10-15)

Compared with `CodeExpert_Phase6_AdSense_Ready.zip`. No dependency, migration or database change.

| File | Change |
|---|---|
| `content/programming-applications/lessons/01-…` to `14-…` | **14 lectures** from the ECE3112 slides, weeks 1 to 3. `05-strings-indexing-and-slicing.md` and `07-lists-storing-many-values.md` replace the old `01-` and `02-` files (same slugs, rewritten). |
| `content/programming-applications/images/py-*.png` | **New.** 18 pictures of graphics.py windows. |
| `content/programming-applications/course.json` | Topics reordered to follow the slides (Objects and Python graphics now come before object-oriented programming, tuples and dictionaries); descriptions for Operators and Python graphics match the lectures. Same topic slugs. |
| `content/computer-vision/lessons/01-…` to `17-…` | **17 lectures** from the ECE4704 slides, weeks 1 to 3. `04-digital-images-and-pixels.md` and `07-brightness-and-contrast.md` replace the old `01-` and `02-` files (same slugs, extended). |
| `content/computer-vision/images/` | **New:** the drawn test images `street.png`, `poor-street.png`, `noisy-street.png`, `view-a.png`, `view-b.png`, and 33 `cv-*.png` result pictures. |
| `content/computer-vision/course.json` | Topics reordered to follow the slides (reading and display first; image enhancement after filtering); descriptions match the lectures. Same topic slugs. |
| `tools/lesson-runtime/run_lesson.py`, `graphics.py` | **New.** Runs a lecture program with no screen or camera: OpenCV windows are kept instead of opened, a camera plays a short clip, and a stand-in for Zelle's graphics.py records the drawing. |
| `tools/check-lesson-code.ts` | Runs Python that can't run in the browser through the lesson runtime; a program with no OUTPUT box must run without an error; an optional argument checks only matching files. |
| `tools/content-images/make_py_graphics.py`, `make_cv_lab_images.py` | **New.** Draw the pictures above from the lectures' own programs. |
| `src/components/lesson/lec-stage.tsx` | The recorded-output note now also covers programs that open a window, not only OpenCV. |
| `tests/integration/content.test.ts`, `admin-lessons.test.ts`, `assessments.test.ts` | Expect the new lecture lists; the quiz-per-topic test names the topics with no questions yet. |
| `docs/CONTENT.md` | The lesson runtime, the "runs without error" rule, the picture scripts, the checker's filter argument. |
| `docs/PHASE_6_SUMMARY.md`, `PHASE_6_CONTENT_READINESS.md`, `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`, `PHASE_6_OWNER_ACTIONS.md`, `PHASE_6_DEPLOYMENT_READINESS.md`, `PHASE_6_TEST_REPORT.md`, this file | New numbers and the follow-up results. |

## Follow-up: practice questions for the new topics (2026-10-16)

Compared with `CodeExpert_Phase6_Python_CV_Lectures.zip`. No dependency, migration or database change.

| File | Change |
|---|---|
| `content/programming-applications/exercises/intro-*`, `vars-*`, `io-*`, `ops-*`, `obj-*`, `gfx-*` | **New.** 48 questions for the 6 Python topics that had none (Python introduction, variables and data types, input and output, operators, objects, Python graphics). |
| `content/programming-applications/quizzes/python-introduction-quiz.md`, `variables-and-data-types-quiz.md`, `input-and-output-quiz.md`, `operators-quiz.md`, `objects-quiz.md`, `python-graphics-quiz.md` | **New.** A practice quiz for each of those topics. |
| `content/computer-vision/exercises/cvi-*`, `cvr-*`, `cvp-*`, `cvz-*`, `cvn-*`, `cvf-*`, `cve-*`, `cvd-*`, `cvc-*`, `cvm-*`, `cvj-*` | **New.** 76 questions for the 11 Computer Vision topics that had none. |
| `content/computer-vision/quizzes/*-quiz.md` (11 files, one per topic slug) | **New.** A practice quiz for each of those topics. |
| `content/computer-vision/lessons/13-finding-corners.md` | Says that `np.int32` drops the decimal part (710.4 and 710.9 both become 710); it said "rounds", which is wrong. Found while writing a question on it. |
| `seed/0002_content.sql`, `seed/0003_exercises.sql` | Rebuilt with `npm run content:build`. |
| `tools/check-exercise-code.ts` | Runs a question that imports `cv2` or `graphics` through `tools/lesson-runtime/run_lesson.py`; an optional argument checks only matching files. |
| `tests/integration/assessments.test.ts` | Each course's quiz list includes the new quizzes; the quiz-per-topic test now expects no topic without questions. |
| `docs/CONTENT.md` | Which question types may use OpenCV or graphics.py; the checkers' filter argument (the old `npm run content:check -- strings` line was wrong: npm passes the argument to the last command only). |
| `README.md`, `docs/PHASE_6_SUMMARY.md`, `PHASE_6_CONTENT_READINESS.md`, `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`, `PHASE_6_OWNER_ACTIONS.md`, `PHASE_6_DEPLOYMENT_READINESS.md`, `PHASE_6_TEST_REPORT.md`, this file | New numbers and the follow-up results. |

## Follow-up: header sign-in and account menu (2026-10-17)

Compared with `CodeExpert_Phase6_Practice_Questions.zip`. No dependency, migration, database or content change.

| File | Change |
|---|---|
| `src/app/(auth)/login/actions.ts`, `sign-in-form.tsx` | Sign-in returns where to go, and the form loads that page in full instead of an in-app redirect, so the header learns who signed in (bug P6-05). |
| `src/components/account/recovery-code-panel.tsx`, `src/app/(auth)/register/sign-up-form.tsx` | The "continue" buttons after signing up or recovering an account are plain links (a full page load). The sign-up name help says the name shows in the header too. |
| `src/components/account/account-menu.tsx` | Signed in: the initial, the name and the title, and a menu with View my progress (this course and all courses), Account settings, Admin (staff) and Sign out; the title is also in the menu. Sign in is a plain link and never shrinks; long names are cut with "…" (bug P6-06). |
| `src/components/account/course-progress.tsx`, `lecture-progress.tsx`, `bookmark-button.tsx`, `src/components/practice/attempt-runner.tsx` | Their "Sign in" links are plain links. |
| `src/components/account/me.ts` | `refreshMe()` asks `/api/me` again. |
| `src/app/(site)/settings/settings-forms.tsx` | After a new name is saved, the header is updated. |
| `src/app/api/me/route.ts`, `src/lib/auth/permissions.ts` | `/api/me` also returns `title`; `accountTitle()` names the highest role (Administrator, Course admin, Editor or Student). |
| `src/components/layout/logo.tsx`, `site-header.tsx` | The site name next to the logo shows from 480 px (was 420 px); the account area may shrink so the header never runs off the screen (bug P6-06). |
| `tests/unit/admin-lib.test.ts`, `tests/integration/students.test.ts` | Tests for the title. |
| `tools/browser-checks/journey-m.mjs`, `README.md` | **New** browser check M (sign in from other pages, name and title, the menu, phones). |
| `docs/PHASE_6_SUMMARY.md`, `PHASE_6_BUG_REPORT.md`, `PHASE_6_TEST_REPORT.md`, this file | The follow-up results. |

