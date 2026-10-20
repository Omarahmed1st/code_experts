# Phase 5.1 test report

Date: 2026-10-11. Every number below comes from a command that was actually run
in this audit. The logs were kept in the review working copy. Nothing here is a
claim about code that wasn't executed.

Environment:

- Linux, Node 22, Wrangler 4.149 (`wrangler dev`, local D1 and R2), Vitest 5 with the Workers pool.
- Python 3 with OpenCV, and g++, for the content checks.
- Headless Chromium (Playwright). It is the only browser available here.

## 1. Baseline (the Phase 5 zip, before any change)

| Check | Result |
| --- | --- |
| `npm ci` | OK |
| `npm run db:migrate:local`, `db:seed:local` | OK (0001 to 0005) |
| `npm run content:check` | 138 lesson checks passed, 13 skipped without OpenCV. With OpenCV installed: 146 passed, 5 skipped (programs that show an error on purpose and have no OUTPUT box). 452 exercise checks passed. |
| `npm run typecheck` | OK |
| `npm run lint` | OK |
| `npm test` | 24 files, 309 tests, all passed |
| `npm run build` | OK |
| `npm run check:vinext` | 100% compatible (13 supported) |
| `npm audit` | 15 advisories (8 moderate, 7 high), all in build and development tools. See the security review. |

The baseline was green, so every bug below was found by new tests, the browser
journeys, the layout sweep, the accessibility scan, or reading the code.

## 2. Final code (after all Phase 5.1 fixes)

| Check | Result |
| --- | --- |
| `npm run content:check` | 146 lesson checks passed, 5 skipped (as above); 452 exercise checks passed. That is 598, the same as the baseline. |
| `npm run typecheck` | OK |
| `npm run lint` | OK (the browser-check scripts included) |
| `npm test` | 26 files, **331 tests, all passed** (309 before, plus 22 new) |
| `npm run build` | OK |
| `npm run check:vinext` | 100% compatible (14 supported; the new `headers()` config is one more supported item) |
| Migrations on the local D1 | 0001 to 0006 applied; `/api/health` lists all six |

### New automated tests (22)

| File | Tests | What they prove |
| --- | --- | --- |
| `tests/integration/phase5-1.test.ts` | 13 | B01 (4): write-code and correct-code answers keep the browser result apart from the mark; analytics count only server marks; migration 0006 moves earlier marks. B04 (2): a double submission keeps the first; a later resubmission changes nothing. B06 (2): NULL ids refused; every TEXT-key table covered. Course isolation (5): questions, quizzes and exams, attempt tokens, progress, bookmarks and drafts, attempt reviews and resource files can't cross courses. |
| `tests/unit/phase5-1.test.ts` | 7 | B01: `practiceRecord` for every question type and nonsense test counts; practice marks in the page never get worse. B02: the security headers, including the home page rule. B03: the sign-up text names what is kept. |
| `tests/unit/design-tokens.test.ts` | 2 (light and dark) | B10: text on the danger colour has at least 4.5:1 contrast. |

The same new tests were run against the baseline code (a separate checkout of the Phase 5 commit with the new test files copied in): 9 failed and 46 passed in the 3 files.

- **Integration (13):** the 7 bug tests fail on the baseline:
  - B01 write-code, correct-code, analytics and the 0006 data move;
  - B04 double submission (both submissions were accepted);
  - B06 NULL refused, and the NULL coverage check.

  The other 6 pass on both versions: the 5 course-isolation tests and "a later resubmission changes nothing". They confirm behaviour that was already right and now guard it.
- **Unit `phase5-1` (7):** the file can't load on the baseline, because the new `practice-record` module doesn't exist there. Its B02 and B03 checks would also fail there, since the baseline has no `headers()` config and the sign-up text says "nothing else". That last point is inferred from the baseline source, not run separately.
- **Unit `design-tokens` (2 new):** both fail on the baseline (no danger-text token).

## 3. Browser checks (Chromium, the built site at localhost:8787)

The scripts ship in `tools/browser-checks/` (see its README). Screenshots are in `codelab-review/phase5-1/`.

### Journeys

| Scenario | Script | Steps | Result |
| --- | --- | --- | --- |
| A: visitor without an account | `journey-ab.mjs` | 8 | PASS: lecture readable, no session cookie, practice marked and kept only in the browser, final quiz asks to sign in, dashboard and admin closed |
| B: registered student | `journey-ab.mjs` | 11 | PASS: recovery code shown once, cookie HttpOnly and SameSite=Lax, answer in history, bookmark listed, export without password hash, sign-out ends the session, progress kept after signing in again, wrong password refused |
| C: three courses kept apart | `journey-ab.mjs`, `journey-extra.mjs` | 3 | PASS: Python history doesn't show the C++ answer; Computer Vision search shows no C++ result |
| D: limited final quiz | `journey-de.mjs` | 10 | PASS: 2 of 2, then 1 of 2, then locked with the time left. The lock survives sign-out and follows the account to another browser. The server refuses a third start (429). Another student still has 2. |
| E: custom exam, reload and resume | `journey-de.mjs`, `journey-e2.mjs` | 8 | PASS: after a reload the Resume card says "1 of 5 answered, 9:59 left" and the answer is still selected; it submits and appears in history |
| F: administrator, course admin, editor | `journey-f.mjs` | 11 | PASS: 55 admin pages open for the administrator; staff created with one-time passwords and a reminder to change them; the editor sees only Computer Vision and no Publish buttons; the course admin sees only C++; a student is refused every admin page |
| G: recovery and deletion | `journey-g.mjs` | 10 | PASS: wrong code refused, right code gives a new one, the old code can't be reused, new password works, progress kept, deletion needs DELETE, account deleted, cookie cleared, can't sign in again. A database query afterwards found no rows left for the account. |
| H: slow and broken networks | `journey-hj.mjs` | 8 | PASS: at 1.5 Mbit/s with 300 ms latency the text appears in about 1 s, "Starting Python…" shows at once, and the run finishes in about 42 s. A broken Python download is reported at once (it waited 3 minutes before the B05 fix). A broken C++ download is reported at once. Both run again after pressing Run. |
| I: timer runs out | `journey-i.mjs` | 7 | PASS: with a 60-second limit set in the local database (and restored to 900 afterwards), the quiz submitted itself when the time ran out and appeared in history. A late submission through the API after the 60 s grace was refused (409), and history shows it as "Not submitted". |
| J: running code | `journey-hj.mjs` | 7 | PASS: Python's first run about 3 to 5 s, later runs under 100 ms; C++ compiles in about 4 to 6 s. A correct write-the-code program shows "All tests pass… run in your browser", the list says "Tests passed in your browser", and history says "Not marked". |
| Newer question formats, theme, SEO, ads | `journey-extra.mjs` | 11 | PASS: lines in order (up/down buttons), blanks, how many times and value of a variable are all marked; the theme button cycles and is remembered; search stays in its course; robots and sitemap behave as designed outside production; no third-party requests (ads off; fonts and runtimes self-hosted) |

Production mode was checked once on a second local instance (`APP_ENV=production`, port 8788):

- the cookie becomes `__Host-ce_session` with `Secure`;
- quizzes refuse to start without `ASSESSMENT_SECRET` (503);
- robots.txt allows crawling except private areas;
- the sitemap lists 197 URLs, none private.

### Layout sweep (sideways scrolling, console errors, failed requests, framing header)

Widths: 320, 360, 375, 390, 768, 1024, 1280, 1440 and 1920 px, in light and dark.

| Pages | Loads | Problems |
| --- | --- | --- |
| 29 public pages (home, courses, lectures, topics, exercises, quizzes, practice, exam builder, search, about, accessibility, sign-in pages, 404) | 522 | 0 |
| All 21 lectures at 320 and 768 px | 42 | 0 |
| 9 signed-in student pages | 162 | 8 before the fix (B07), 0 after |
| 14 admin pages | 252 | 8 before the fix (B08), 0 after |
| All 55 admin list and form pages at 320, 390 and 768 px | 165 | 0 |
| 9 admin detail pages (editors, previews, history, a staff account) at 320 to 1280 px | 72 | 10 before the fix (B08), 0 after |

Every load sent `X-Frame-Options: DENY`, the 404 page included. The only failed requests were route prefetches that the browser cancelled when it navigated away (`ERR_ABORTED`); they aren't errors.

### Accessibility (axe-core 4.10, WCAG 2.0 and 2.1 A and AA, light and dark)

| Pages | Before the fixes | After |
| --- | --- | --- |
| 14 public pages (home, courses, lectures, exercises, the order question, final quiz, exam builder, sign-in, sign-up, recovery, about, accessibility) | No violations | No violations |
| 6 student pages (dashboards, progress, history, bookmarks, settings) | `/dashboard`: `definition-list` and `dlitem` (B11). Dark `/settings`: `color-contrast` on "Delete my account" (B10). | No violations |
| 7 admin pages | `color-contrast` on the page-header label in light (B09) | No violations |

Keyboard: on every scanned page the first Tab lands on "Skip to main content" with a visible focus outline. The exception is the sign-in pages, where the email field already has focus when the page opens and Tab moves to the next field.

Not covered: a real screen reader (NVDA, VoiceOver) and zoom to 200% and 400%.

### Final round on the final build

After the last fix, the site was rebuilt and every browser check was run again from the scripts in `tools/browser-checks/`:

| Check | Result |
| --- | --- |
| Journeys A to J and the extras | All steps PASS. Two script problems were found and fixed along the way, and neither was in the site: the timer journey looked for the clock by its text instead of its `role="timer"`, and the resume journey assumed the first question had a single answer. `journey-e2.mjs` then passed 3 runs in a row. |
| Accessibility, 27 pages (14 public, 6 student, 7 admin), light and dark | 0 violations |
| Layout sweep: 29 public pages, 9 student pages, 14 admin pages, 9 widths, light and dark | 936 loads, 0 problems |
| Layout sweep: the pages fixed in B07 and B08 | 68 loads, 0 problems |

### The delivered zip

`CodeExpert_Phase5_1_Reviewed.zip` was extracted into an empty folder, and the setup from the README was run there from scratch:

| Step | Result |
| --- | --- |
| `npm ci` | exit 0 |
| `npm run db:migrate:local` | exit 0 (0001 to 0006) |
| `npm run db:seed:local` | exit 0 |
| `npm run verify` (typecheck, lint, tests, build) | exit 0: 26 test files, 331 tests passed, build complete |

## 4. Not tested (and why)

| What | Why |
| --- | --- |
| Firefox, Safari (WebKit), real Android and iPhone devices | Only Chromium is installed here, and downloading other browsers is not allowed in this environment |
| The deployed site (TLS, HTTPS cookies, Cloudflare limits and caching) | No Cloudflare account yet; deploying needs the owner's approval |
| Turnstile | Needs the owner's Cloudflare keys |
| Email flows | No email provider (recovery codes instead, by design) |
| Load (many students at once) | Needs a deployed site; planned for Phase 7 |
| CPU time per request | Measured in Phase 1; not re-measured |
