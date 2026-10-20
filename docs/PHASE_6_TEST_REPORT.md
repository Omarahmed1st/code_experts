# Phase 6 test report

Date: 2026-10-15, with follow-ups on 2026-10-15 and 2026-10-16. Everything below ran in this project's Linux environment against the local build (`npm run build && npm start`, local D1 and R2), and for journey L against the same build in production mode. Only Chromium was available. Results are copied from the runs, not estimated.

## Summary

| Check | Result |
|---|---|
| Typecheck, lint, unit and integration tests, build (`npm run verify`) | Pass. **439 tests in 30 files** (Phase 5.1 baseline: 331). |
| Content checks (`npm run content:check`) | After the Python and CV lectures and their questions: lecture programs 299 passed, 0 failed, 7 skipped (deliberate broken examples with no output to compare). Questions: 586 passed, 0 failed. (Before the lectures: 146 passed, 5 skipped; before the new questions: 452 question checks.) |
| Phase 5.1 browser journeys, re-run | All pass: A–B 19/19, D–E 15/15, E2 3/3, F 12/12 (now including the new admin pages), G 10/10, H–J 18/18, I 7/7, extra 11/11. |
| New journey K (ads off, preview, admin, contact, access, privacy choices) | 34/34 |
| New journey L, production mode with stand-in Google scripts | Google consent mode 18/18; third-party consent mode 19/19 (one more step: a silent CMP) |
| Layout sweep, 8 widths × light and dark | 224 page loads; 10 problems found on 2 pages, fixed, re-checked: 0 |
| Accessibility (axe-core, WCAG 2.0/2.1 A and AA), light and dark | 28 scans; 1 rule failed on 2 pages, fixed, re-checked: 0 violations |
| Performance, Phase 5.1 vs Phase 6 (local lab) | No measurable slowdown; +3 to 4 small requests (about 3 KB of JavaScript) per page |
| Fresh ZIP setup in a folder whose path has spaces | Pass: install, migrate, seed (including lecture images), first administrator, verify (439 tests) and build |

## Automated tests

`npm run verify` runs typecheck, lint, all tests and the build; the final run exited 0 with `Test Files 30 passed (30)`, `Tests 439 passed (439)`.

New in Phase 6 (108 tests, the difference from the baseline's 331):

- `tests/unit/phase6-ads.test.ts`: ids and ads.txt; positions and caps; the never-list (22 paths); path patterns, including a hostile one that must finish in under 500 ms; settings parsing; readiness in every combination of switches; the per-page decision; lecture break rules; word counts; audit wording.
- `tests/unit/phase6-site.test.ts`: the TCF consent wait with fake windows (decision, `gdprApplies: false`, timeout, missing CMP); browser helpers; `CMP_SCRIPT_URL` validation; the owner's details and what's missing; verification tags; the legal pages list every storage key the code uses; every footer link points to an existing page; the Windows path guard.
- `tests/integration/phase6.test.ts`: only administrators change advertising, consent and site details (editors and course admins are refused and nothing is written); validation and audit of settings, consent, placements and exclusions; database CHECKs; a local build never shows live ads even with every admin setting on; quiz, exam and account pages get nothing; a broken settings row reads as "off"; `/ads.txt`; site details; the contact form (fields, honeypot, too fast, 5 per network per hour) and the inbox; the audit filter.
- `tests/integration/phase6-migration.test.ts`: applies 0001–0006, inserts old-shape rows (including an invalid ad unit id), applies 0007, and checks every row survived, the invalid id became NULL with the placement off, the new CHECKs hold and the NULL-id triggers are back.

## Browser checks

Playwright with Chromium, from `tools/browser-checks/`. Logs (JSON, one entry per step) and screenshots are in the evidence folder delivered with this phase.

### Re-run of the Phase 5.1 journeys

All pass on the Phase 6 build. `journey-f.mjs` was extended: the administrator opens 59 admin pages (55 before, plus the 4 new ones), and an editor, a course admin and a student are each refused the new administrator-only pages. `journey-i.mjs` ran with the timed quiz shortened to 60 s in the local database and put back to 900 s afterwards.

### Journey K (local build, ads off)

- K1: no request to any ad host on 24 page loads (12 pages, with and without `?ad-preview=1`); lecture markers are hidden with no height; no console or server errors.
- K2: the lecture preview shows 2 labelled boxes (cap 3); in-text boxes never follow a code box, Run button or picture; no box on the quizzes page; the home preview has at most 2 boxes, none in the first screen.
- K3: the Advertising page opens with the checklist; a malformed publisher id and "switch on" without an id are refused; `/ads.txt` serves Google's line once an id is saved (`text/plain; charset=utf-8`); a placement can't be switched on without a unit id; non-digit unit ids are refused; placement create and edit; the checklist still says "off" on a local build; exclusion add and remove; the audit log lists the changes; "reviewed" is refused while details are missing; the privacy policy shows saved details and still says "draft"; the contact form sends; the honeypot message is not stored; read, archive and delete in the inbox; everything put back (`/ads.txt` is 404 again).
- K4: a student can't open `/admin/ads`, `/admin/site`, `/admin/messages`, `/admin/ads/placements/new`; a visitor is sent to sign in.
- K5: privacy choices says no ads load today and offers no consent button; "clear" removes only this site's keys; the page is `noindex`; the footer lists the legal pages.

### Journey L (production mode, stand-in Google scripts)

The build ran with `APP_ENV=production`, `ADS_ENABLED=true`. Every request to Google's ad script and to the stand-in CMP address was answered inside the browser by a stand-in script, so **no request reached Google**. A publisher id of the right shape (`pub-1234567890123456`, not a real account) and test placements were saved in the local database and removed at the end (L9).

- L0: the checklist passes only with all switches set.
- L1: the ad script is requested once, only after consent handling (third-party mode: CMP first); each live unit is labelled "Advertisement" with the right client and unit; an unfilled unit folds away; in-text ads never follow a code box; the lecture's C++ program still compiles and runs ("Compiled in 3305 ms and ran in 43 ms"); no other Google host contacted; no console errors.
- L2: sign-in, quizzes, build-your-own exam, legal, contact and search pages load no ad script.
- L3: a signed-in administrator gets no ad script and no ad box.
- L4: layout shift while stand-in ads load: 0.0023 (one run, phone width).
- L5: nothing loads on privacy choices before the click; the button asks the consent tool to show its choices again (Google mode: `showRevocationMessage`; third-party: `displayConsentUi`).
- L6 (third-party only): a CMP that never answers: no ad script after 10 s, boxes removed.
- L7: the sitemap lists the legal and contact pages, not privacy choices; robots.txt keeps admin, API and personal pages out; the home page carries the verification tags when set.
- L8: `?ad-preview=1` shows boxes to signed-in staff only (visitor 0, staff 1).
- L9: everything put back.

What L can't show: real Google ads, real fill rates, the real consent message, or how Google's script behaves on a real domain.

### Layout sweep (`sweep.mjs`)

Widths 320, 360, 375, 390, 768, 1024, 1440 and 1920 px, each in light and dark.

- Public: `/privacy-policy`, `/terms`, `/cookie-policy`, `/advertising`, `/contact`, `/privacy-choices`, `/about`, a lecture with `?ad-preview=1`, and `/`: 144 loads. Problem: `/privacy-policy` scrolled sideways at 320–390 px (8 loads; bug P6-02). After the fix: 32 loads of the privacy and cookie pages, 0 problems.
- Admin (signed in as administrator): `/admin/ads`, `/admin/ads/placements/new`, `/admin/site`, `/admin/messages`, `/admin/messages?view=archived`: 80 loads. Problem: `/admin/ads` scrolled sideways at 320 px (2 loads; bug P6-03). After the fix: 16 loads, 0 problems.
- Every load had `X-Frame-Options: DENY`, no console errors and no failed requests.

### Accessibility (`a11y.mjs`)

The same 9 public and 5 admin pages, light and dark (28 scans), plus the first Tab key press. The first Tab reaches "Skip to main content" with a visible outline on every page. `scrollable-region-focusable` (serious) failed on `/privacy-policy` and `/cookie-policy` (bug P6-04); after the fix, 0 violations on every page.

Automated scans don't replace a screen-reader session; none was done (no screen reader here).

### Screenshots

Evidence screenshots of the new pages (legal pages at 390 and 1440 px, light and dark; the footer; the lecture and home previews; the admin pages; the stand-in live ad from journey L) are in the evidence folder. They are real captures of the local build; the "STAND-IN AD (not Google)" box is the test stand-in, not a Google ad.

## Performance (local lab, not field data)

Measured with `tools/browser-checks/perf.mjs`: each page loaded 3 times in a fresh browser window (nothing cached), middle value kept. "Phone" is a 390 px window with the CPU slowed 4 times; "desktop" is 1440 px. Both builds ran on the same machine, one at a time, from their own local databases with the same seed. Ads were off in both (as they are today). These are not Lighthouse scores and don't predict what visitors on real networks and phones will see.

| Setup | Page | LCP 5.1 → 6 (ms) | Layout shift 5.1 → 6 | Requests 5.1 → 6 | Transferred KB 5.1 → 6 | JS KB 5.1 → 6 |
|---|---|---|---|---|---|---|
| phone 390px, CPU 4x slower | Home | 340 → 324 | 0.000 → 0.000 | 38 → 42 | 532 → 537 | 183 → 186 |
| phone 390px, CPU 4x slower | C++ course page | 312 → 364 | 0.003 → 0.003 | 51 → 54 | 460 → 466 | 195 → 198 |
| phone 390px, CPU 4x slower | Lecture (do-while) | 392 → 592 | 0.000 → 0.000 | 53 → 56 | 688 → 694 | 195 → 198 |
| phone 390px, CPU 4x slower | Python question | 332 → 328 | 0.000 → 0.000 | 53 → 56 | 585 → 591 | 197 → 200 |
| desktop 1440px | Home | 292 → 260 | 0.001 → 0.001 | 39 → 43 | 537 → 542 | 183 → 186 |
| desktop 1440px | C++ course page | 248 → 256 | 0.002 → 0.002 | 54 → 57 | 476 → 482 | 195 → 198 |
| desktop 1440px | Lecture (do-while) | 284 → 300 | 0.021 → 0.021 | 55 → 58 | 698 → 705 | 195 → 198 |
| desktop 1440px | Python question | 252 → 232 | 0.001 → 0.001 | 55 → 58 | 595 → 602 | 197 → 200 |

The phone lecture (392 → 592 ms) and phone course page differed more than the rest, so both were measured again with 7 loads each:

| Setup | Page | LCP 5.1 → 6 (ms), 7 loads | Layout shift 5.1 → 6 |
|---|---|---|---|
| phone 390px, CPU 4x slower | Lecture (do-while) | 424 → 420 | 0.000 → 0.000 |
| phone 390px, CPU 4x slower | C++ course page | 328 → 340 | 0.003 → 0.003 |
| desktop 1440px | Lecture (do-while) | 284 → 272 | 0.021 → 0.021 |
| desktop 1440px | C++ course page | 228 → 252 | 0.002 → 0.012 |

Reading: with 7 loads the lecture is the same in both builds, so the 3-load gap was noise. Differences of a few tens of milliseconds go both ways and are within run-to-run variation on this machine. Phase 6 adds 3 to 4 requests per page: small client chunks for the hidden ad markers and the signed-in check (`ad-preview`, `browser`; about 3 KB of JavaScript in total). Layout shift is unchanged; the one 0.002 → 0.012 reading on the desktop course page comes from the header and course tabs moving 4 px when the web font loads, which happens in both builds (the ad markers were never among the shifting elements; see the bug report). Everything stays far below Google's "good" thresholds (LCP 2.5 s, CLS 0.1), but these are lab numbers on a fast local connection.

With ads on, Google's script and the ads themselves add network requests and work that can only be measured on the live site.

## Fresh setup from the ZIP

`CodeExpert_Phase6_AdSense_Ready.zip` was extracted into a new folder whose path has spaces (`/home/user/p6/space test/Code Expert P6/CodeLab`, the Linux equivalent of `C:\Users\me\Desktop\Code Expert`), and these ran in order, each exiting 0:

1. `npm ci`
2. `npm run db:migrate:local` (0001 to 0007)
3. `npm run db:seed:local` (the three courses, and the lecture images uploaded to local R2 through `tools/wrangler.ts`)
4. `npm run admin:create` (non-interactive, with the `CODELAB_ADMIN_*` variables)
5. `npm run verify`: typecheck, lint, 439 tests in 30 files, build

Then the fresh build was started and checked: `/api/health` reports migrations 0001 to 0007 and 3 published courses; `/`, the legal pages, `/contact`, `/privacy-choices` and a lecture answer 200; `/ads.txt` is 404 (no publisher id); `/admin/ads` sends a visitor to sign in.

In the Phase 5.1 code, step 3 (and `npm run dev` / `npm run build`) failed in such a folder (bug P6-01). This was a Linux run; it was not repeated on a Windows PC.

## Follow-up: Python and Computer Vision lectures (2026-10-15)

After the owner chose "more lectures", 14 Python and 17 Computer Vision lectures were written from the uploaded slides. Everything below was re-run on the final content.

| Check | Result |
|---|---|
| `npm run verify` | Pass, 439 tests in 30 files. 6 tests had expected the old lecture lists (course outline, previous/next, drafts, sitemap, admin reorder, a quiz for every topic) and were updated to the new lists. The quiz-per-topic test now names the 17 topics that have a lecture but no questions yet, so a new gap still fails it. |
| `npm run content:check` | Lecture programs: 299 passed, 0 failed, 7 skipped (114 C++, 134 Python, 51 Computer Vision; the 7 skipped are deliberate error examples with no output). Questions: 452 passed. |
| OpenCV and graphics.py programs | Run by the checker through `tools/lesson-runtime/run_lesson.py` with OpenCV 5.0.0 and NumPy 2.5.3: 22 programs that only show windows "run without error", the rest match their OUTPUT box. The camera lecture uses a 10-frame clip made from `street.png`, and says so. |
| Every Run button on the 31 new lectures, in Chromium | 41 programs: 38 printed exactly their OUTPUT box; the 3 deliberate error examples stopped with the error their lecture names (`NameError`, `IndexError`, `TypeError`). |
| Layout sweep, 33 pages (2 course pages, 31 lectures) × 320, 390, 768, 1280 px × light and dark | 264 loads. 1 problem: at 320 px a long inline code in the feature-matching takeaways scrolled the page 14 px sideways. Reworded; re-checked at 320, 360, 375 and 390 px: 0. |
| Accessibility (axe-core), the same 33 pages, light and dark | 66 scans, 0 violations; the first Tab reaches "Skip to main content" with a visible outline. |
| Journeys H–J and extra (they use the Python strings lecture) | H–J 18/18, extra 11/11. |

Not re-run for this follow-up: journeys A–G, K and L (they don't use lecture content beyond the C++ lectures and the Python exercises, which didn't change).

## Follow-up: practice questions for the new topics (2026-10-16)

124 hand-written questions and 17 topic quizzes were added for the 17 topics that had a lecture but no practice. Everything below was run on the final content.

| Check | Result |
|---|---|
| `npm run content:check` | Lecture programs: 299 passed, 0 failed, 7 skipped (unchanged). Questions: **586 passed**, 0 failed, 0 skipped (452 before). Every trace answer, "what is the value" answer and multiple-choice question with a printed answer was produced by running its program; every fix-the-code question's broken program fails a test, and its solution and accepted fixes pass all tests; every write-the-code solution passes its tests. |
| OpenCV, NumPy and graphics.py in questions | `tools/check-exercise-code.ts` now runs a question that imports `cv2` or `graphics` through `tools/lesson-runtime/run_lesson.py`, like the lecture programs (OpenCV 5.0.0, NumPy 2.5.3). 22 of the new questions show programs that import them (15 traces, 7 multiple choice); none is a question that runs in the browser. |
| `npm run verify` | Pass, 439 tests in 30 files. 2 expectations changed: the list of each course's quizzes now includes the 17 new quizzes, and the quiz-per-topic test now expects **no** topic without questions. |
| All new pages in Chromium (`newq-check.mjs`, a one-off script, not in the project) | 124 question pages and 17 quiz pages, at 1280 and 390 px: 282 loads, all HTTP 200 with a heading, no console or page errors, no sideways scrolling. |
| New questions answered in Chromium with their own answer keys | 25 "trace the output" and 8 "what is the value" answers typed in and marked **Correct** by the server; 22 fix-the-code and write-the-code solutions run against their tests in the browser (Pyodide: "All N tests pass") and then submitted, marked as right. 0 failures. The multiple-choice, fill-in-the-blanks and put-in-order questions were not clicked through one by one; their keys are covered by `content:check` and the format by journey extra. |
| Journeys A–C, H–J and extra (they use Python questions and history) | A–B 19/19, H–J 18/18, extra 11/11. |

Not re-run for this follow-up: journeys D–G, I, K and L (the final quiz, custom exams, staff, recovery, timer and ads don't depend on these topics).

## Follow-up: header sign-in and account menu (2026-10-17)

| Check | Result |
|---|---|
| `npm run verify` | Pass, **441 tests** in 30 files. New: a unit test for the account title (Administrator, Course admin, Editor, Student) and an integration test that `/api/me` gives each staff account its title; the student `/api/me` test now expects `title: "Student"`. |
| New browser check `journey-m.mjs` (Chromium, local build) | **27/27 pass**, with a local administrator. M1 Sign in from a course, a lecture, `/courses` and `/about` opens `/login?next=…`; M2 a wrong password keeps the form, the right one comes back to the course page with no sign-in link left on it; M3 the button shows the name and "Student" on screen and is read as "Mariam, Student, account menu", the menu has View my progress (in this course / all), Account settings and Sign out, and each opens the right page; M4 a new name shows in the header as soon as it is saved; M5 a tab loaded before a sign-in made in another tab comes back to its page signed in when Sign in is pressed; M6 signing up from a lecture comes back to it signed in; M7 Sign out in the menu; M8 at 390 px, light and dark, the button is a 44 px square, the menu fits and nothing scrolls sideways; M9 an administrator signing in from `/courses` comes back to it titled "Administrator" with an Admin link. No console, page or server errors. |
| Header widths (one-off script, not in the project) | 62 widths from 320 to 1320 px, on `/`, two course pages and a lecture, as a visitor and signed in with a 45-character name: 496 checks, 0 sideways scrolling, the account button always on screen and never under 44 px. Before the fix, a visitor at 420–479 px had the Sign in button off screen. |
| `sweep.mjs` | Signed in with the long name: 6 pages × 9 widths × 2 themes, 108 loads, 0 problems. Visitor: 4 pages, 72 loads, 0 problems. |
| `a11y.mjs` (axe, signed in) | `/`, a course page and `/dashboard`, light and dark: no violations. |
| Journeys A–B and G (sign up, sign in and out, recovery) | A–B 19/19, G 10/10. |

Not re-run for this follow-up: journeys D–F, H–L and extra (they don't depend on the header's account button). Not tested: other browsers and real phones, and screen readers (the button's spoken name was read from Chromium's accessibility tree).

## Not tested (and why)

| What | Why |
|---|---|
| Firefox, Safari (WebKit), real Android and iPhone devices | Only Chromium is available here. Status: NOT TESTED. |
| Real Google AdSense ads and the real consent message | Needs the owner's account and a live domain; real ad requests need the owner's explicit authorisation. Stand-ins were used instead (journey L). |
| A deployed site (HTTPS, `__Host-` cookie over TLS, Cloudflare caching) | Nothing is deployed. |
| Turnstile on the contact form | No Cloudflare keys yet. |
| Screen readers | None available here. |
| A real Windows PC | The Windows path fix is covered by a unit test and a Linux setup in a folder with spaces; not run on Windows itself. |
| Many students at once (load) | Not possible locally. |
