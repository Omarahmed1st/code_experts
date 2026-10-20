# Phase 5.1 functional audit (Phases 1 to 5)

Date: 2026-10-11. Baseline: `CodeLab-phase5.zip` (Phase 5 as delivered).
Environment: the built site (`npm run build && npm start`, Cloudflare `wrangler dev`, local D1 and R2), headless Chromium, and the Vitest suites (unit tests in Node, integration tests in the Workers runtime with the real seed).

## Statuses

| Status | Meaning |
| --- | --- |
| PASS | Run during this audit and it worked. |
| FAIL | Run and it didn't work; there is a bug in the bug report. |
| PARTIALLY VERIFIED | Some of it was run; the rest is noted. |
| NOT TESTED | Not run during this audit. |
| BLOCKED | Can't be run without something only the owner can provide. |
| INTENTIONALLY NOT IMPLEMENTED | Left out on purpose (owner's decision or this task's rules). |

"FIXED" in Notes means the feature failed on the baseline and passes after a Phase 5.1 fix (see `PHASE_5_1_BUG_REPORT.md`).

## Evidence keys

| Key | What it is |
| --- | --- |
| `verify` | `npm run content:check`, `typecheck`, `lint`, `test`, `build`, `check:vinext` on the final code. Logs are summarised in `PHASE_5_1_TEST_REPORT.md`. |
| `t:<file>` | A Vitest file under `tests/`. |
| `j:<script>` | A browser journey in `tools/browser-checks/`. Each prints PASS or FAIL per step. |
| `sweep` | `tools/browser-checks/sweep.mjs`: each page at 320 to 1920 px, light and dark. It checks sideways scrolling, console errors, failed requests and the framing header. 1,223 page loads in total. |
| `a11y` | axe-core WCAG 2.1 A/AA scan and a keyboard check of key pages (see the test report). |
| `shot:<name>` | A screenshot in `codelab-review/phase5-1/`. |

## Phase 1: foundation

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 1 | Next.js App Router on Cloudflare Workers (vinext), TypeScript strict | PASS | `verify` (typecheck, build, check:vinext) | |
| 1 | D1 schema: every course-owned row has `course_id NOT NULL`, composite foreign keys, slugs unique per course | PASS | t:schema-checks (28 checks), t:drizzle-mirror | |
| 1 | Migrations apply in order on an empty database (0001 to 0006) | PASS | t:health (expects 0006), local D1 migrated, `/api/health` lists all six | 0006 is new and additive. No applied migration was edited. |
| 1 | NULL refused in TEXT primary keys | PASS | t:phase5-1 "B06" | FIXED (B06, triggers in 0006) |
| 1 | Bindings only through `src/server/platform/env.ts` | PASS | Code search: no `cloudflare:workers` import elsewhere in `src` | |
| 1 | R2 keys under `courses/<course_id>/` | PASS | t:admin-files | |
| 1 | Health endpoint | PASS | `/api/health` on the built site | |
| 1 | Three independent courses seeded | PASS | `/api/health` (3 published), t:content, sweep | |
| 1 | Ads off unless a real ad unit ID exists | PASS | `ADS_ENABLED=false`; j:extra (no third-party requests on 4 pages) | AdSense INTENTIONALLY NOT IMPLEMENTED (this task's rule) |
| 1 | CPU time per request within the Workers plan | NOT TESTED | | Measured in Phase 1 (`measure:cpu`); not re-measured here |

## Phase 2: public platform and lessons

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 2 | Home, all courses, course pages | PASS | sweep (9 widths, light and dark), shot:sweep-home-* | |
| 2 | All 21 lectures render (17 C++, 2 Python, 2 Computer Vision) | PASS | sweep of every lecture at 320 and 768 px; `content:check` | |
| 2 | Lec stage: code, notes, INPUT/OUTPUT boxes, run button | PASS | j:hj, shot:J-python-run, shot:J-cpp-run | |
| 2 | Python runs in the browser (self-hosted Pyodide) | PASS | j:hj (first run about 3 to 5 s locally, then under 100 ms) | |
| 2 | C++ compiles and runs in the browser (self-hosted browsercc) | PASS | j:hj (compile about 4 to 6 s) | |
| 2 | Slow connection (1.5 Mbit/s, 300 ms) | PASS | j:hj: text appears in about 1 s; "Starting Python…" shown at once; run finishes in about 42 s | |
| 2 | Runtime download that breaks part way | PASS | j:hj | FIXED (B05: Python waited 3 minutes). C++ was already fine. |
| 2 | OpenCV lectures show recorded output | PASS | `content:check` with OpenCV installed (lesson programs run and outputs compared) | |
| 2 | Topic pages, including empty topics | PASS | sweep | |
| 2 | Search inside one course | PASS | j:extra (C++ search finds lectures; Computer Vision search shows no C++ result), t:search-and-format | |
| 2 | Resources and file downloads | PASS | t:admin-files, t:phase5-1 isolation sweep (a file can't be fetched through another course) | |
| 2 | About, accessibility, 404 pages | PASS | sweep (the 404 page answers 404 with the framing header) | |
| 2 | robots.txt and sitemap.xml | PASS | j:extra (sitemap lists public pages only; robots keeps crawlers out of the admin) | |
| 2 | Light and dark themes, theme button remembered | PASS | sweep in both schemes; j:extra (button cycles, choice kept after reload) | |
| 2 | Layout from 320 px to 1920 px | PASS | sweep: 0 problems on 522 public page loads and 42 lecture loads | |
| 2 | Accessibility (labels, contrast, keyboard) | PARTIALLY VERIFIED | a11y (axe-core on key pages, light and dark; first Tab reaches the skip link) | No screen-reader session with NVDA or VoiceOver. Results are in the test report. |
| 2 | Other browsers and real phones | NOT TESTED | | Only Chromium is available here. Firefox, Safari and real Android and iPhone devices are still needed. |

## Phase 3: questions, quizzes and exams

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 3 | Multiple choice and trace, marked on the server | PASS | t:assessments, t:grading, j:ab | |
| 3 | Correct the code, marked by matching an expected fix | PASS | t:assessments, t:phase5-1 | FIXED (B01: a different fix that "passed" in the browser used to be stored as right) |
| 3 | Write the code: tests run in the student's browser, practice feedback only | PASS | j:hj ("All tests pass… run in your browser"; list says "Tests passed in your browser"; history says "Not marked") | FIXED (B01: browser results used to be stored as marks) |
| 3 | The four newer formats: lines in order, fill in the blanks, how many times, value of a variable | PASS | t:assessments (server marking), j:extra (each answered in the browser; the order uses up/down buttons) | |
| 3 | Answer keys never sent before marking | PASS | t:assessments | |
| 3 | 264 questions checked by running their programs | PASS | `content:check` (452 exercise checks) | |
| 3 | Topic quizzes and practice quizzes | PASS | t:assessments; j:i (timed quiz) | |
| 3 | Final C++ quiz: 35 questions, 1 hour, 4 models, random model per attempt | PASS | t:assessments (models, shared questions, random pick that skips the last model) | |
| 3 | Final quiz: 2 attempts, then a 24-hour lock, per student | PASS | j:de (lock after 2; survives sign-out; follows the account to another browser; another student unaffected; third start refused by the server with 429) | |
| 3 | Build-your-own exam, reload and Resume | PASS | j:de, j:e2 (the Resume card keeps the answer and the time left; the answer is still selected) | |
| 3 | Timer runs out: the attempt submits itself | PASS | j:i (real 60-second limit set in the local database, then restored) | Not checked in a browser before this audit |
| 3 | Late submission refused after the 60 s grace | PASS | j:i (409), t:assessments | |
| 3 | Practice exam | PASS | t:assessments | Browser walk-through only in Phase 3 |
| 3 | Practice hub, "retry my mistakes", practice sets | PARTIALLY VERIFIED | sweep (pages load); unit tests of local progress | Not walked through in a browser in this audit |
| 3 | Auto-generated questions | INTENTIONALLY NOT IMPLEMENTED | | Owner's decision (2026-10-10) |

## Phase 4: staff sign-in and the admin

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 4 | Staff sign-in, lockout after failures, same message for unknown email and wrong password | PASS | t:sign-in | |
| 4 | All 55 admin list and form pages open for an administrator | PASS | j:f | |
| 4 | Editor sees only their course and can't publish | PASS | j:f, t:admin-lessons, t:admin-bank | |
| 4 | Course admin acts only in their course | PASS | j:f, t:admin-* | |
| 4 | Students and visitors can't reach the admin | PASS | j:f, j:ab, t:admin-guards | |
| 4 | Staff accounts with a one-time temporary password and a reminder to change it | PASS | j:f, t:admin-files | |
| 4 | Lecture, question, quiz and exam editors, versions and restore | PASS | t:admin-lessons, t:admin-bank | In the browser this audit only opened the pages |
| 4 | File uploads (type from the bytes, size limits) | PASS | t:admin-files | Local R2 only |
| 4 | Audit log | PASS | t:admin-*, j:f (page opens) | |
| 4 | Course create, archive, delete | PASS | t:admin-files | |
| 4 | Admin pages on phones | PASS | sweep (55 pages and 9 detail pages at 320, 390 and 768 px) | FIXED (B08: three pages were too wide) |
| 4 | Turnstile on sign-in and sign-up | BLOCKED | | Needs the owner's Cloudflare Turnstile keys. The code skips the check when no key is set. |

## Phase 5: student accounts and the dashboard

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| 5 | Materials public without an account; registration optional | PASS | j:ab (lecture and practice without an account; no session cookie) | |
| 5 | Guest progress kept only in the browser | PASS | j:ab (local storage only) | |
| 5 | Sign-up with a recovery code shown once | PASS | j:ab, t:students | |
| 5 | Truthful text about what an account keeps | PASS | t:phase5-1 "B03" | FIXED (B03) |
| 5 | Sign-in, sign-out, session cookie flags | PASS | j:ab, t:students | Production cookie flags: code only |
| 5 | Password recovery with the code (old code stops working) | PASS | j:g, t:students | |
| 5 | Email verification and email password reset | INTENTIONALLY NOT IMPLEMENTED | | No email provider. The recovery code replaces it by design. |
| 5 | Lecture progress, bookmarks, code drafts | PASS | j:ab, t:students | |
| 5 | History of quizzes and exams, and the review page | PASS | j:de, j:i, t:students | |
| 5 | One attempt stored once when submitted twice at once | PASS | t:phase5-1 "B04" | FIXED (B04) |
| 5 | Dashboard, progress by topic, achievements, streaks | PASS | sweep (signed in), t:students | FIXED (B07: progress page too wide on phones) |
| 5 | Settings: name, password, devices, data download, delete account | PASS | j:ab (export without password hash), j:g (delete; the database has no rows left), t:students | |
| 5 | One course's history and progress never show in another course | PASS | j:ab (step C), t:phase5-1 isolation sweep | |
| 5 | Admin student list, temporary password, delete; course analytics count only server marks | PASS | t:students, t:phase5-1 "B01", j:f (pages open) | |

## Across the site

| Phase | Feature | Status | Evidence | Notes |
| --- | --- | --- | --- | --- |
| all | Course isolation | PASS | t:phase5-1 (5 tests), t:course-scope, t:schema-checks, j:ab | |
| all | Security headers on every response | PASS | t:phase5-1 "B02", sweep | FIXED (B02) |
| all | Cross-site request checks (Origin) | PASS | t:admin-guards, t:students | |
| all | No server errors or console errors during the journeys | PASS | j:* (each records page errors and HTTP 5xx) | The only console errors are the expected 404s of refused admin pages and the forced download failures. |
| all | Production deployment, real Cloudflare resources | BLOCKED | | Needs the owner's Cloudflare account and approval. Not done, as instructed. |
| all | Load with many students at once | NOT TESTED | | Belongs to the pre-launch work |
| 6+ | Phase 6 features | NOT TESTED | | Not started, as instructed |
