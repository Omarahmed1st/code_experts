# Phase 5.1 bug report

Baseline: `CodeLab-phase5.zip` as delivered on 2026-10-10 (commit "Baseline" in the
review working copy). Every bug below was reproduced on the baseline before it was
fixed, and every fix has a test or browser check that fails on the baseline and
passes now.

Priorities:

- **P0:** launch blocker (data loss, an exposed secret or answer key, a broken core journey).
- **P1:** serious (wrong grades, a security hole that needs no special access).
- **P2:** wrong behaviour a student or teacher will notice, or a defence that should be there.
- **P3:** minor (layout, wording, hardening).

No P0 or P1 bug was found.

| ID | Priority | Feature | Status |
| --- | --- | --- | --- |
| B01 | P2 | Practice marks for code answers | FIXED |
| B02 | P2 | Security headers (framing) | FIXED |
| B03 | P2 | Sign-up privacy text | FIXED |
| B04 | P2 | Submitting one attempt twice at once | FIXED |
| B05 | P2 | Python download that breaks part way | FIXED |
| B06 | P3 | NULL ids in TEXT primary keys | FIXED |
| B07 | P3 | Progress page on phones | FIXED |
| B08 | P3 | Three admin pages on phones | FIXED |
| B09 | P2 | Low-contrast labels on the sign-in pages and admin headers | FIXED |
| B10 | P3 | Dark theme "Delete" buttons: white on coral | FIXED |
| B11 | P3 | Dashboard course cards: invalid description lists | FIXED |

---

## B01: browser test results were stored as marks

- **Priority:** P2
- **Feature:** practice answers of signed-in students (Phase 3 grading, Phase 5 progress).
- **Files:**
  - `src/app/api/courses/[course]/[kind]/[slug]/[action]/route.ts`
  - `src/lib/grading/practice-record.ts` (new)
  - `src/server/students/progress.ts`, `history.ts`, `export.ts`
  - `src/db/schema/activity.ts`
  - `migrations/0006_phase5_1_hardening.sql`
  - `src/app/(site)/dashboard/[course]/history/page.tsx`
  - `src/components/practice/question-view.tsx`, `practice-question.tsx`, `practice-set.tsx`, `exercise-list.tsx`, `local-progress.ts`, `attempt-runner.tsx`
  - `src/components/account/me.ts`
- **Steps to reproduce:**
  1. Sign in as a student.
  2. POST `{"response": {"code": "anything", "tests": {"passed": 3, "total": 3}}}` to `/api/courses/programming-applications/exercises/write-word-parts/check`.
- **Expected:** write-the-code programs run only in the student's browser, so the server can't know whether they work (the Phase 3 rule: practice feedback only). Nothing the browser reports should become a mark.
- **Actual:** the server stored `is_correct = 1`. It then counted as "solved" in the student's progress, towards achievements, and in the teacher's course analytics ("answers right"). The same happened for a correct-the-code fix that didn't match any expected fix but "passed" in the browser.
- **Root cause:** `practiceMark()` in the route turned the browser's `tests.passed === tests.total` into the stored mark.
- **Fix:**
  - A new column, `exercise_attempts.self_check` (`'passed'`, `'failed'` or NULL), keeps the browser's own result, apart from the mark. It is added by migration 0006, which is additive.
  - `is_correct` now holds only the server's mark:
    - multiple choice and trace: the server's mark;
    - correct-the-code: true only when the fix matches an expected fix; a different fix that passed in the browser is left unmarked (NULL);
    - write-the-code: always NULL.
  - Migration 0006 moves earlier write-the-code marks into `self_check`.
  - The student still sees "✓ Tests passed in your browser" in the exercise list and practice sets.
  - History shows these answers as "Not marked", with the browser result next to it.
  - The data export includes the self-check as `testedInBrowser`.
- **Regression tests:**
  - `tests/integration/phase5-1.test.ts`, "B01" (4 tests): write-code, correct-code, analytics, and the migration's data move.
  - `tests/unit/phase5-1.test.ts`, "B01" (5 tests).
  - Browser: `journey-hj.mjs` step "History shows it as not marked".
- **Note:** correct-the-code rows saved before this fix can't be told apart in SQL (the stored mark doesn't say whether it came from a match or from the browser). No production data exists yet, so nothing is affected.
- **Final status:** FIXED, TESTED, VERIFIED in the browser.

## B02: pages could be shown inside another site's frame

- **Priority:** P2
- **Feature:** every page, including sign-in, account settings and the admin.
- **Files:** `next.config.ts`.
- **Steps to reproduce:** `curl -I http://localhost:8787/admin` (or any page).
- **Expected:** the site refuses to be framed by other sites (clickjacking: a hidden admin or "delete my account" page under a fake button). Basic safe headers are sent.
- **Actual:** none of `X-Frame-Options`, `Content-Security-Policy: frame-ancestors`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` or `Strict-Transport-Security` were sent.
- **Root cause:** no security headers were configured.
- **Fix:**
  - `headers()` in `next.config.ts` adds them to every page and API response.
  - vinext's `/:path*` rule doesn't match `/` itself, so the home page has its own rule.
  - A route that sets one of these headers itself keeps its own value.
  - A full Content-Security-Policy (scripts, styles, the runtimes' workers) is left for Phase 7. It needs a careful review with Pyodide and the C++ compiler, and a wrong policy would break running code.
- **Regression tests:**
  - `tests/unit/phase5-1.test.ts`, "B02".
  - Browser sweep: `X-Frame-Options: DENY` on all 1,000+ page loads, including the home page, a 404, and signed-in student and admin pages.
- **Final status:** FIXED, TESTED, VERIFIED.

## B03: the sign-up page said "nothing else" is kept

- **Priority:** P2 (honesty towards students; legal texts are Phase 7)
- **Feature:** sign-up form.
- **Files:** `src/app/(auth)/register/sign-up-form.tsx`.
- **Steps to reproduce:** open `/register` and read the text under the button.
- **Expected:** a true summary of what an account keeps.
- **Actual:** the text listed email, name and course activity and said nothing else was kept. The site also keeps, for each signed-in device:
  - when it signed in;
  - its IP address;
  - its browser;
  - code drafts;
  - a sign-in cookie;
  - for a short time, the addresses of new sign-ups and failed sign-ins (rate limits).
- **Root cause:** the text was written before devices, drafts and rate limits were added.
- **Fix:** the text now names all of these, and says the student can download or delete their data in Account settings. Only the wording changed.
- **Regression test:** `tests/unit/phase5-1.test.ts`, "B03".
- **Final status:** FIXED, TESTED. The real privacy policy is still a Phase 7 task and needs the owner's details.

## B04: one attempt submitted twice at the same moment could be overwritten

- **Priority:** P2
- **Feature:** quiz, practice exam and custom exam submission for signed-in students (Phase 5).
- **Files:** `src/server/students/attempts.ts` (`recordSubmit`).
- **Steps to reproduce:** submit the same attempt token twice at the same time (two tabs, or a double click on a slow phone), the second with different answers. The integration test does this with `Promise.all`.
- **Expected:** the first submission is kept and the second changes nothing.
- **Actual:**
  - Both requests passed the "not submitted yet" check before either had written anything.
  - The second then overwrote the stored answers and score, so the score shown to the student could differ from the one in history.
- **Root cause:** the check and the writes were separate steps.
- **Fix:**
  - Each write in the submit batch now checks, inside its own transaction, that the attempt isn't submitted yet. D1 runs one batch at a time.
  - The status update runs last and only when the attempt is still open.
  - `recordSubmit` reports whether it was the one that submitted.
- **Regression tests:** `tests/integration/phase5-1.test.ts`, "B04" (2 tests).
- **Final status:** FIXED, TESTED.

## B05: a Python download that broke part way left Run spinning for 3 minutes

- **Priority:** P2 (students on mobile data in Egypt will hit dropped connections)
- **Feature:** running Python in the browser (lectures, home page, write-the-code).
- **Files:** `public/runner/python-worker.mjs`.
- **Steps to reproduce:**
  1. Open a Python lecture.
  2. Make the download of `pyodide.asm.wasm` fail (the browser check aborts it with "connection reset").
  3. Press Run.
- **Expected:** a clear message straight away, and Run works again once the connection is back.
- **Actual:** "Starting Python in your browser…" stayed for 3 minutes, until the page's download limit. Then it said "Python took too long to download", which is not what happened.
- **Root cause:** when one of Pyodide's own downloads fails, `loadPyodide()` never settles. The error escapes as an unhandled rejection inside the worker, so the worker never reported the failure.
- **Fix:**
  - While Pyodide loads, the worker treats any unhandled error as a failed load and reports it at once: "The Python download was interrupted (Failed to fetch). Check your connection and try again."
  - The page already starts a fresh worker on the next Run.
  - The C++ compiler was checked the same way. It already reported a broken download at once, so it was not changed.
- **Regression test:** `tools/browser-checks/journey-hj.mjs`, step "A broken Pyodide download ends with a clear message, not a hang". It failed on the baseline (still waiting after 60 s) and passes now (message within a second; pressing Run again works).
- **Final status:** FIXED, VERIFIED in the browser.

## B06: TEXT primary keys accepted NULL

- **Priority:** P3 (hardening; no code path inserts NULL ids)
- **Feature:** database schema (Phase 1).
- **Files:** `migrations/0006_phase5_1_hardening.sql`.
- **Steps to reproduce:** `INSERT INTO courses (id, …) VALUES (NULL, …)` succeeds.
- **Expected:** every row has an id.
- **Actual:** SQLite allows NULL in a TEXT PRIMARY KEY unless the column is also NOT NULL (a long-standing SQLite quirk). The schema relied on the PRIMARY KEY alone.
- **Root cause:** SQLite's legacy behaviour.
- **Fix:**
  - Applied migrations can't be edited, so migration 0006 adds `BEFORE INSERT` and `BEFORE UPDATE` triggers that refuse NULL.
  - It covers the 37 tables with a TEXT `id`, plus `rate_limits.key` and `site_settings.key`.
  - Existing data had no NULL ids.
- **Regression tests:** `tests/integration/phase5-1.test.ts`, "B06" (2 tests, one of which checks that every TEXT-key table is covered).
- **Final status:** FIXED, TESTED.

## B07: "Progress by topic" scrolled sideways on phones

- **Priority:** P3
- **Feature:** student dashboard, progress page (Phase 5).
- **Files:** `src/app/(site)/dashboard/[course]/progress/page.tsx`.
- **Steps to reproduce:**
  1. Sign in.
  2. Open `/dashboard/programming-fundamentals/progress` at 320 to 390 px wide.
- **Expected:** long lecture titles are cut with "…", and the page fits the screen.
- **Actual:** the page was 62 to 132 px wider than the screen.
- **Root cause:** the lecture list is a CSS grid with no column size on phones, so its one column grew to fit the longest title instead of letting it be cut.
- **Fix:** `grid-cols-1` (one column that can shrink).
- **Regression test:** `tools/browser-checks/sweep.mjs` on the page at 320, 360, 375 and 390 px. It failed on the baseline (8 of 8 loads too wide) and passes now (0 of 8).
- **Final status:** FIXED, VERIFIED in the browser.

## B08: three admin pages scrolled sideways on phones

- **Priority:** P3 (staff pages)
- **Feature:** admin course analytics and the lecture and question previews (Phase 4 and 5).
- **Files:**
  - `src/app/(staff)/admin/courses/[course]/students/page.tsx`
  - `src/app/(staff)/admin/courses/[course]/lectures/[id]/preview/page.tsx`
  - `src/app/(staff)/admin/courses/[course]/questions/[id]/preview/page.tsx`
- **Steps to reproduce:** open these pages as an administrator at 320 to 768 px.
- **Expected:** wide tables and tab rows scroll inside their own box, and the page fits the screen.
- **Actual:** the pages were up to 608 px wider than the screen.
- **Root cause:** the same as B07. The page's grid had no column size, so a wide table widened the whole page.
- **Fix:** `grid-cols-1` on those grids.
- **Regression test:** `tools/browser-checks/sweep.mjs` on all 55 admin list pages and 9 admin detail pages at phone widths. 0 problems now.
- **Final status:** FIXED, VERIFIED in the browser.

## B09: low-contrast labels on the sign-in pages and admin page headers (light theme)

- **Priority:** P2 (WCAG AA failure on pages every student sees: sign-in, sign-up, recovery)
- **Feature:** the small "chapter" label above page titles (lec style).
- **Files:** `src/styles/lec.css`.
- **Steps to reproduce:** open `/login` or any admin page in the light theme and measure the colour of the small label above the title.
- **Expected:** at least 4.5:1 contrast (WCAG 2.1 AA).
- **Actual:**
  - The label was the stage colour `#a3b4d4` on white or `#f2f5fa`: 1.9:1.
  - Its bold part was yellow `#ffd43b`: 1.3:1.
  - axe-core flagged it on all 7 admin pages scanned. On the sign-in pages axe couldn't work out the background, but the measured colours were the same.
- **Root cause:**
  - These labels use `lec-chapter text-muted`, so they should take the theme's muted colour.
  - Tailwind 4 puts utility classes in a CSS layer, and the unlayered `lec.css` rule wins over any layered rule. So `text-muted` never applied, and the colours meant for the navy stage were used on a light card.
- **Fix:** `.lec-chapter.text-muted` (and its bold part) now uses the theme's muted and primary-text colours. These tokens already pass the 4.5:1 token tests in both themes. The labels on the navy stage are unchanged.
- **Regression check:** `a11y` scan (`tools/browser-checks/a11y.mjs`). Before the fix it reported `color-contrast` on all 7 admin pages scanned (light theme); after the fix there are none (see the test report).
- **Final status:** FIXED, VERIFIED with axe-core.

## B10: dark theme "Delete" buttons were white on coral (2.3:1)

- **Priority:** P3
- **Feature:** danger buttons ("Delete my account", admin delete buttons) in the dark theme.
- **Files:**
  - `src/styles/tokens.css` (new `--cl-on-hard`)
  - `src/app/globals.css`
  - `src/components/ui/button-styles.ts`
  - `src/components/admin/action-parts.tsx`
  - `tests/unit/design-tokens.test.ts`
- **Steps to reproduce:** open `/settings` in the dark theme and look at "Delete my account".
- **Expected:** at least 4.5:1.
- **Actual:** white `#ffffff` on `#ff8a7a`: 2.29:1. axe-core flagged it.
- **Root cause:** the button text was hard-coded white. The dark theme's danger colour is light coral.
- **Fix:** a new token, "text on the danger colour": white in light (5.9:1 on `#b23a2e`), navy `#14213d` in dark.
- **Regression test:** `tests/unit/design-tokens.test.ts`, "button text on the danger colour has at least 4.5:1 contrast" (fails on the baseline, where the token doesn't exist and white is used). Also the `a11y` scan.
- **Final status:** FIXED, TESTED.

## B11: the all-courses dashboard cards had invalid description lists

- **Priority:** P3 (screen readers may not pair each label with its number)
- **Feature:** `/dashboard` course cards (Phase 5).
- **Files:** `src/app/(site)/dashboard/page.tsx`.
- **Steps to reproduce:** run axe-core on `/dashboard` while signed in.
- **Expected:** each `dt` and its `dd` are direct children of a `div` in the `dl`.
- **Actual:** "Lectures done" and "Questions solved" were wrapped in an extra `div`, with the progress bar loose inside the `dl` (axe: `definition-list` and `dlitem`, serious, 15 nodes).
- **Root cause:** layout wrappers inside the `dl`.
- **Fix:** each group is now `div > dt + dd + dd` (the bar is in its own `dd`), laid out with a grid. It looks the same.
- **Regression check:** `a11y` scan of `/dashboard`, light and dark. It reported 15 nodes before the fix and none after.
- **Final status:** FIXED, VERIFIED with axe-core.

---

## Observations not fixed (by decision or for a later phase)

| ID | Priority | What | Why not fixed now |
| --- | --- | --- | --- |
| O1 | P3 | `app_error_logs` table exists but nothing writes to it. | Workers Logs (already on in `wrangler.jsonc`) cover this in production. Wiring it up is Phase 7 monitoring work. |
| O2 | P3 | Resource access level "students" can be chosen in the code but is not offered in the admin form or used. A code comment about it is out of date. | Not reachable, so no effect. It belongs with resources in a later phase. |
| O3 | P3 | An R2 file request with only `If-Modified-Since` (no `If-None-Match`) can get 412 instead of 304. | Browsers send both. Only odd clients are affected. Can be fixed in the Phase 7 caching work. |
| O4 | P3 | Sign-up says when an email already has an account, so someone can learn whether an address is registered. | Accepted: it saves real students confusion. Sign-ups are rate-limited per address, and Turnstile will be added when the owner provides keys. Sign-in gives the same answer for unknown email and wrong password. |
| O5 | P3 | Public pages are sent with `Cache-Control: private, no-store`. | Correct but slow at scale. Edge caching is the Phase 7 performance task. |
| O6 | P3 | A broken C++ compiler download shows only "Failed to fetch" as the error text (the status line says "C++ couldn't start. Reload the page to try again."). | It doesn't hang (see B05). Friendlier wording is optional. |
| O8 | P2 | Sign-up is limited to 20 accounts per network address per hour. A class signing up together from one school network, or many students on one mobile network address, will hit it. | Changing an abuse limit is the owner's call (see the deployment readiness decisions). The browser checks reset this local counter between runs. |
| O7 | info | `npm audit`: 15 advisories (8 moderate, 7 high), all in build or development tools. | None of them is in the code that runs on Workers or in the browser (details in the security review). Upgrading would change the build tool chain, so it needs the owner's approval. |
