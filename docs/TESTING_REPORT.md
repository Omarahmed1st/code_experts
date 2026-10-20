# Code_Expert testing report

Only checks that were actually run are listed here. Nothing below is a claim about code that hasn't been executed.

## 2026-10-10: Phase 5 (student accounts and the personal dashboard)

- **`npm run verify`:** passes (typecheck, lint, 309 tests, build). Migration `0005_student_accounts.sql` applies after 0001 to 0004 on a fresh local D1 (the health check and the Drizzle mirror test both expect it, 49 tables).
- **New integration tests (20, `tests/integration/students.test.ts`, Workers runtime, real seed):** sign-up (bad input refused, the same email twice refused, a recovery code shown once) and its per-address limit; sign-in and `/api/me`; password recovery with the code (the old code stops working, other devices are signed out); a staff account can't be recovered with a code; password change (other devices signed out); sign-out refuses another site's Origin; lecture progress kept per course and per student; the save API; bookmarks kept in their own course; code drafts; practice answers stored when signed in and not for guests; quiz history and the review page are private to their owner; practice and custom exams recorded; dashboard numbers and achievements; the data export holds no password hashes, recovery codes or session tokens; deleting an account removes every row of the student in every course; staff can't delete their own account from settings; the admin student list, temporary password and delete; course analytics count students only.
- **Final quiz (rewritten in `assessments.test.ts`):** a guest gets "sign in" (401); a student gets 2 starts, then 429 with the unlock time; signing out and back in doesn't reset it; another student still gets 200; no attempt cookie is set for signed-in students; practice quizzes are unchanged.
- **New unit tests (`tests/unit/students.test.ts`):** recovery code format and checking, study streaks counted in Cairo days, achievement rules and progress text, the "what to do next" suggestions, safe return paths after sign-in, device names from the browser string.
- **Browser walk-through (Chromium, `npm run dev`, 1360 px, phone 390 px dark), screenshots in `codelab-review/phase5/`:** signed up and saved the recovery code; the account menu; marked a lecture done and bookmarked it; course page progress; answered 12 practice questions; the final quiz asks a guest to sign in and shows attempts left when signed in; took a practice quiz twice (results saved, both in history); the all-courses dashboard, course dashboard, progress by topic, history, attempt review and bookmarks; settings (name, password, recovery code, devices, data download, delete); recovered the account with the code and got a new one; as the administrator: student list, temporary password, course analytics and the admin dashboard; signed-out header. No page errors in the console (only the missing `favicon.ico`, which was already there).
- **Fixed during Phase 5:** the history page showed raw question types ("mcq"); on phones the history table cut off its last columns (the date now sits under the title) and a screen-reader-only label made the page scroll sideways; course outline links pointed at a wrong address; two SQL column names were reserved words.
- **Not tested:** real phones, Safari and Firefox; Turnstile on sign-up (needs Cloudflare keys); email delivery (there is no email provider, so emails aren't verified and recovery uses the one-time code); production deployment; many students at once.

## 2026-10-10: Phase 4 (staff sign-in and the admin)

- **`npm run verify`:** passes (typecheck, lint, 278 tests, build).
- **New integration tests (Workers runtime, real seed):**
  - `admin-lessons` (9): a seeded lecture saved unchanged keeps what students see; a new lecture stays out of the public pages and search until it is published; slugs unique per course but reusable in another; another course's lecture, topic or file can't be used; editors edit but can't publish or delete, and editors of another course can't touch it; a live lecture needs at least three sections; reorder and delete with audit entries; topics added, renamed and deleted (not while they have lectures); an editor's new topic starts as a draft.
  - `admin-bank` (13): every seeded question in all three courses saves unchanged through the admin with the same option and child ids; a broken question is refused with a clear message; saving from the Markdown tab; duplicate as a draft, delete (refused while the question is in a quiz); filters and import (create, update by address); editors can't publish or delete, nor touch another course; quizzes listed with their models and saved unchanged; models follow their quiz's settings and address; a quiz refuses another course's questions, write-code questions, drafts when published, and another quiz's reserved questions; add a model, delete a quiz with its models; the seeded practice exam saves unchanged, rules the bank can't fill are refused, and a question a published exam needs can't be unpublished.
  - `admin-files` (8): uploads land under the course's folder with the type taken from the bytes; macro files, SVG, wrong types and files over the limit are refused; replacing deletes the old object; staff-only and draft files are never served publicly; editors upload but can't publish or delete; lecture pictures are measured and kept under the lecture's folder; course create, rename (search addresses and SEO follow), status rules and delete (archive first, typed slug, R2 folder removed); staff accounts with one-time temporary passwords, must-change, reset, disable, and the last administrator protected.
  - `sign-in` (4): the same answer for an unknown email and a wrong password; one account locked after 5 failures even from different addresses and even with the right password, other accounts unaffected, open again after the window; one address limited after 30 failures across accounts; rate-limit keys never hold an email; disabled accounts and accounts without admin access refused.
- **New unit tests:** `admin-lib` (12: permissions, safe redirects after sign-in, password rules, file sniffing and safe file names, the question check over every content file, Cairo time conversion) and `admin-guards` (6: every admin page calls `requireStaff`/`requireSite`/`requireCourse`, every route handler and server action resolves the signed-in person first, every upload route checks the Origin header, "new" pages need edit rights and settings need settings rights).
- **Browser checks (Chromium, `npm run dev`, 1360 px):** all 19 admin pages load for an administrator. As an administrator: created a multiple-choice question, used the Markdown tab, opened the preview with the answer key and the history, published it from the list; created a quiz with three questions and a 20-minute timer, added model B, removed a question from it and saved, published the quiz; created a practice exam (a rule asking for more questions than exist shows the shortfall) and published it; created a file, a fake PDF was refused ("This kind of file isn't accepted here"), a real PDF uploaded, published and downloaded; saved the course's search title; restored an earlier version of a question. As a new editor of one course: the temporary password worked and the banner asked for a new one; another course, staff accounts, the audit log, all courses and course settings all answered 404; the questions list showed no Publish buttons; a weak new password was refused and a good one accepted. No page errors in the console.
- **Fixed during Phase 4:** save messages disappeared when the editor reloaded with the saved version (now carried over); form fields stretched to match a taller neighbour; "50.0 MB" now reads "50 MB"; a doubled full stop under the preview upload; the question picker in the quiz editor now scrolls instead of making the page very long; a malformed file-name header no longer breaks an upload.
- **Not tested:** real phones, Safari and Firefox; Turnstile (needs a Cloudflare account and keys); uploads near the 95 MB slide limit (the Workers request size limit in production is [verify] against Cloudflare's current limits page before relying on it); production deployment.

## 2026-10-10: Phase 3 (questions, quizzes, practice exams)

- **`npm run verify`:** passes (typecheck, lint, 221 tests, build). Follow-up on 2026-10-10: 452 content checks pass on 264 questions; new tests cover custom exams, the attempt lock, quiz models (4 models, 7 shared questions, random pick that skips the last model, lock across models), reserved questions staying out of every public list, and the four new question formats (order lines never sent in order, blanks, count and value marked on the server); integration tests got longer timeouts because every file loads the bigger real seed.
- **Question checker (`npm run content:check`):** 73 checks pass on the 36 questions. It runs every trace program and compares the answer exactly (and that the step table's output adds up to it), proves each multiple-choice output claim, proves each broken correct-the-code program fails at least one test while the solution and every accepted fix pass them all, and runs every write-the-code solution against every test (g++ `-std=c++17 -Wall -Wextra`, Python 3 standard library only, 5 s limit).
- **New unit tests (32, `tests/unit/grading.test.ts`):** the three output comparison modes and case, first differing line, correct-the-code matching (layout, comments, quotes, Python indentation, multi-line brackets, empty code), MCQ with one or several answers, trace marking, scores rounded down and the pass mark compared exactly, shuffling, signed attempt tokens (round trip, changed body, wrong secret, junk, wrong shape, deadline grace), exam draws (rules respected, no repeats, narrow rules first, too-small bank, different draws), and the exercise, quiz and exam file formats including every real question file.
- **New integration tests (18, `tests/integration/assessments.test.ts`, Workers runtime, real seed):** the starter set counts; each course sees only its own questions, quizzes and exams; the public question data never includes correct options, feedback, solutions, explanations, trace answers or hidden test outputs; the check endpoint marks MCQ, trace and correct-the-code and returns the model solution for write-the-code without a mark; another course's question, junk answers, unknown actions, GET and non-JSON bodies are refused; a practice quiz runs start → check → submit (100% with the answer keys, 0 when blank); exam mode refuses checking before submit, has no hints, and refuses submissions after the 60 s grace; tampered tokens, tokens for another quiz, exam or course, and forged question lists are refused or not marked; ten exam draws each follow the rules with no repeats and vary between attempts.
- **Browser checks (Chromium, `npm run dev`, desktop 1280 px and phone 390 px dark):** question library; MCQ marked right; a wrong trace answer shows the expected output and the step table; a C++ write-the-code program ran 3 tests in the browser (4.7 s including the compiler's first load) and all passed; a Python correct-the-code program ran its tests (2.2 s including Python's first load); practice hub with "retry my mistakes" picking up the wrong trace answer; a random practice set; quizzes page; a practice quiz checked and submitted with score and by-topic table; the practice exam drew 6 questions with a 20:00 timer, offered Resume after a reload, and submitted; "Practise this lecture" on a lecture page; choose-a-course page. No console errors, no horizontal scrolling on the phone.
- **Fixed during Phase 3:** the timer could keep re-submitting every half second after a refused late submission (now it submits once, and a refused attempt returns to the start screen); the result heading scrolled under the sticky header; the lecture link under a question wrapped badly on phones; correct-the-code could match an empty answer against an empty solution; the C++ compiler now keeps the last build, so running several tests on the same code compiles once.
- **Not tested:** real phones, Safari and Firefox; the time-up auto-submit was tested on the server (deadline and grace) but not by waiting out a real timer in the browser; production with `ASSESSMENT_SECRET` set (no Cloudflare account yet).

## 2026-10-09: Edit and run C++ in the browser

The owner asked for "an option to write C++" in the home page's code box. The box now has **Python | C++** tabs, and C++ really compiles and runs in the browser, on the student's device. Every C++ program in the lectures (51) got Edit and Run too. The C++ / Python switch above the home page title (below) was removed, because it was not what the owner meant.

- **Choosing the compiler.** Four candidates from the npm registry were tested in Chromium on all 67 C++ programs and checks in the lectures (63 with a recorded output), plus 11 extra programs (strings, iomanip, vectors, classes, input until end of file, compile errors, an endless loop, division by zero). Each result was re-run by a second, independent check.
  - `browsercc` 0.1.1 (Clang 20): 63/63; about 30 MB to download (gzip files); compile about 1.3 to 1.4 s warm on a desktop; about 370 to 450 MB of browser memory while loaded. **Chosen.**
  - `@live-codes/clang-wasm` 0.3.0 (Clang 22): 63/63; about 29 MB; compile about 1.35 s; about 0.5 GB, with peaks over 1 GB after a stopped run.
  - `@yowasp/clang` 22.0.0 (Clang 22 snapshot): 63/63; about 27 MB; compile about 2 s; peaks of 0.7 to 0.97 GB.
  - `JSCPP` 2.0.9 (an interpreter in JavaScript): 54/63; no `std::string`, `vector` or classes; wrong results for some division and printing; 23 of 51 extra beginner programs matched g++.
- **On the site (local `wrangler dev`, Chromium, desktop):** every one of the 51 C++ lecture programs was run with its Run button: the 47 with an OUTPUT box printed exactly the recorded transcript (typed input echoed where `cin` reads it); the other 4 behave as the lesson says (the name starting with a digit doesn't compile; the three endless loops stop at the 10-second limit). Compile time: median 1.7 to 1.8 s, at most 3.5 s (5.3 s once while other tests were running at the same time); the first run after opening a page also downloads and prepares the compiler (about 4.6 s here from localhost). No request left the site and there were no console errors. The Python demo and Python lectures still run.
- **`npm run verify`:** passes (typecheck, lint, 145 tests, build). New tests: migration 0003 lets C++ (and still not pseudocode) be runnable, compile-error and warning summaries (including a missing `main()` and `system()`), which programs read the keyboard.
- **Mistakes students make (home code box, full Chromium):** a misspelled `main` (`mian`) says "there is no main() function" instead of linking and crashing later; a 12 MB local array, division by zero and endless recursion each stop with a plain-words runtime error, and the page keeps working; a big global array runs; a nonzero `return` is reported. Playwright's lighter "headless shell" browser closes the whole tab on any out-of-bounds memory access in WebAssembly, so these checks use the full Chromium browser, which reports the error normally.
- **Review fixes (2026-10-10).** A final code and browser review (each finding re-checked by a second reviewer) found six real problems, now fixed and re-checked in full Chromium:
  - The OUTPUT box sometimes stopped following fast output, so an endless loop's "Stopped after 10 seconds" line was out of view. Now 5 of 5 runs of a 3,000-line program and the lecture's endless loop end scrolled to the bottom, and scrolling up still stops the following.
  - Ctrl+Enter during a run started a second run and left the box showing "Run" and a stray "Stopped.". It now does nothing while a program is running.
  - With `printf` + `scanf` (or `getchar`), the typed input appeared before the prompt. The prompt now comes first, as in a terminal; `cin` programs are unchanged.
  - On phones, tapping the C++ tab could show line numbers with no code (its typing animation waited for a scroll). Checked at 375x800, 375x667 and 360x740: the code shows at once.
  - `<bits/stdc++.h>` now also includes `<random>`, `<fstream>`, `<complex>`, `<optional>`, `<chrono>` and the other headers g++'s version has that work here.
  - Pressing Stop while compiling no longer reloads the compiler (the next run made no new downloads), and when another code box on a lecture page starts running, the stopped box says so instead of "You stopped the program."
  - The compiler's files are named after their content and `files.json` is revalidated, so an updated compiler reaches browsers that cached the old one. Checked with an on-disk browser profile: the second visit got `304 Not Modified` for `files.json` and no new download of the compiler.
  - After the fixes: `npm run verify` passes (145 tests); all 51 C++ lecture programs again (47 exact matches, the other 4 behave as the lessons say); the Python lectures and the Python home demo still run.
- **Not tested:** real phones, Safari and Firefox (only Chromium is available here). The compiler needs about 400 MB of memory while loaded, which may be too much for phones with 2 GB of RAM.

## 2026-10-09: C++ / Python switch on the home page (removed the same day)

The home page now opens with an "I want to learn: C++ | Python" switch (`/?course=cpp`, `/?course=python`; C++ is the default, and an unknown value falls back to it). The switch changes the hero title and text, the demo program (C++: a for loop with recorded output; Python: the runnable String demo), the "Start with" button and a list of that course's first 6 lectures. Computer Vision stays in the course grid. The canonical URL stays `/`.

- **`npm run verify`:** passes (typecheck, lint, 142 tests, build).
- **Browser (local `wrangler dev`, Chromium):** clicking and pressing Enter both switch, and the URL updates. Focus stays on the switch, and the switch doesn't move when the demo changes height. The Python demo still runs in the browser (`P n Pyt`), and the C++ demo replays `12345` (it was compiled with g++ and printed exactly that). With JavaScript off, the switch still works as plain links. There is no horizontal overflow at 320, 375 or 768 px in light or dark mode, and no console errors.

## 2026-10-09: C++ lectures from the course slides (weeks 1 to 4)

Fifteen new Programming Fundamentals lectures, written from the teacher's ECE1101 slides for weeks 1 to 4, plus the two existing ones (input/output, kept; for loops, rewritten to follow the week 4 slides). 13 flowcharts drawn by `tools/content-images/make_flowcharts.mjs`.

- **`npm run content:check`:** 95 passed, 0 failed, 5 skipped. The skips are programs with no OUTPUT box on purpose: one that doesn't compile (a name starting with a digit), three infinite loops, and the existing Python index-error example. Pseudocode outputs are checked through their `cpp verify` twins (new in this update).
- **`npm run verify`:** typecheck, lint, 142 tests (one new unit test for `cpp verify` blocks; the course-isolation test now checks that the C++ outline starts with Lecture 1 instead of listing two exact slugs) and the production build all pass.
- **Browser (local `wrangler dev`, Chromium):** the course page, the while-loops topic and all 17 C++ lectures at 320 px and 1280 px, light and dark: no horizontal overflow, no console errors, no failed requests. Every flowchart URL returns 200 (`image/png`). The pseudocode stage shows its own status line ("Pseudocode doesn't run on a computer…") and the label "what the steps print"; C++ stages still say "Recorded output".
- **Fresh unpack:** the delivery zip was unpacked into an empty folder, then `npm ci`, `npm run content:check` and `npm run verify` were run there.

## 2026-10-08: Phase 2 (public platform and on-site lessons)

**Environment:** as Phase 1, plus g++ 13.3.0, Python 3.13.16 and OpenCV 5.0.0 (`opencv-python`, for checking the computer vision lessons; students may have 4.x), Pyodide 314.0.7 (Python 3.14) from npm, headless Chromium through Playwright.

### Summary

| Check | Command | Result |
|---|---|---|
| Everything below in one go | `npm run verify` | **exit code 0** |
| Typecheck | `npm run typecheck` | 0 errors |
| Lint | `npm run lint` | 0 problems (the copied Pyodide files are excluded; the Python worker is linted) |
| Tests | `npm test` | **141 passed, 0 failed** (12 files: 86 unit, 55 in the Workers runtime) |
| Production build | `npm run build` | succeeded |
| vinext compatibility | `npx vinext check` | 100% compatible |
| Lesson programs | `npm run content:check` | **44 passed, 0 failed, 1 skipped** (the skipped section shows an error on purpose and has no OUTPUT box) |
| Content build and seed | `npm run content:build && npm run db:seed:local` | 6 lessons, 247 SQL statements, 7 images in local R2; running it twice changes nothing |

### Lesson content checks

Every program and every "check yourself" answer in the six lessons was run, and the OUTPUT boxes match byte for byte. C++ is compiled with `-Wall -Wextra`. The only warning is in the "stray semicolon" example, where it is the point of the lesson (g++ warns that the loop body is misleadingly indented). OpenCV behaviour that differs between versions (`cv2.add` with a plain number) was avoided; the lesson uses `cv2.convertScaleAbs` instead.

Keyboard input is shown as a terminal transcript (typed lines where the program reads them). The checker strips the typed lines, compares the rest with the real output, and fails if a typed line is missing.

### New automated tests

| Area | What is checked |
|---|---|
| Migration 0002 (6 tests) | the CHECKs on runnable (Python only, needs code), sample input size, expected output and annotations need code, image key under the course's folder with alt text and size, image keys unique |
| Lesson parser and annotations | front matter, sections, programs, outputs, notes and strips; rejects bad slugs, Run on C++, fewer than 3 sections, text after a program, images outside diagrams, notes pointing at missing code, unknown shapes, over-long notes |
| Stage layout | marks and rows by column, right-most row first, typing time capped for long programs, tabs expanded |
| Transcripts | typed lines found in order; missing lines reported |
| Markdown and highlighting | raw HTML and `javascript:` links never reach the page; headings start at h3; code, input, output, check, tip and warning blocks; one line of HTML per code line; escaping for unknown languages |
| Search queries | FTS syntax can't be injected; length and word limits; snippet highlighting without raw HTML |
| Course isolation (real seed) | each outline lists only its course's lectures; another course's lecture slug is not found; search returns only the searched course's pages |
| Visibility | drafts hidden; scheduled lectures hidden until their time; a hidden lecture disappears from related and next/previous |
| Lecture images | served with `nosniff`, a sandbox CSP, ETag (304) and byte ranges (206); 404 through another course, for a draft lecture, an unknown file, `../` and non-image types |
| Resource files | preview opens inline (PDF), original downloads as a file; another course's, student-only, draft and non-downloadable originals give 404 |
| Sitemap and robots | outside production: empty sitemap, `Disallow: /`; in production: live lectures and topics with lectures only, no search or resource pages, sitemap link in robots.txt |

### Browser checks (headless Chromium against `npm start`)

| Check | Result |
|---|---|
| 18 pages (home, courses and a filtered view, a course, all 6 lectures, 2 topics including an empty one, resources, search, About, Accessibility, 404) at 320, 375, 768 and 1280 px, light and dark: horizontal overflow, console errors, failed requests | pass (after making long output lines wrap; see below) |
| Python Run, first time: downloads Pyodide from this site and runs | pass: about 3.2 s locally for load + run, then about 70 ms per run |
| Error in the code | traceback from `main.py` only, in coral, with a plain-language status line |
| `input()` with the keyboard box | typed text echoed after the prompt, in green |
| `input()` with nothing typed | EOFError explained: "asked for more input than the keyboard box has" |
| Stop button during an endless loop | stops at once; the next Run starts a fresh runtime |
| 10-second limit | endless loop stopped with a message; the next Run works |
| Edit, Reset, Copy (stage and plain code blocks), Show answer | pass |
| C++ "Show output" | replays the recorded output, labelled as recorded |
| Keyboard only: Tab reaches the Run button, Enter runs | pass |
| Typing animation | starts when a stage scrolls into view; off with reduced motion |
| `/pyodide/…/pyodide.asm.wasm` | served as `application/wasm`, `Cache-Control: public, max-age=31536000, immutable` (from `public/_headers`) |

### CPU time per request

Same method as Phase 1 (`npm run measure:cpu -- http://localhost:8787 100`), Worker process:

| Route | CPU ms | Wall ms |
|---|---|---|
| `/api/health` | 8.6 | 12.0 |
| `/` (now with the demo stage) | 29.0 | 35.6 |
| `/courses` | 32.1 | 36.5 |
| a course page (outline) | 40.4 | 47.6 |
| lecture: Strings (Python, 5 stages) | 66.9 | 71.5 |
| lecture: For loops (C++) | 58.3 | 66.2 |
| course search | 27.0 | 33.6 |
| 404 | 16.1 | 23.6 |

The same caveats as Phase 1 apply: this includes local D1, the debugging inspector and this machine's CPU, so the production figure should be lower. Lecture pages cost about twice a plain page because Markdown, highlighting and the stage are built on every request. Two things follow. Workers Paid is still the plan. Edge caching of public pages (vinext's KV or Workers Cache adapter) should be set up with the first deployment, so most visits never reach the Worker. **[verify]** in the Cloudflare dashboard after deploying.

### Problems found and fixed during Phase 2

- **A lesson relation was inserted before its target lesson existed** (foreign key failure on seeding). Relations are now written after all of a course's lessons.
- **Seed files ran in the wrong order.** Renamed to `0001_courses.sql` and `0002_content.sql`.
- **`-Werror` failed the lessons that show mistakes on purpose.** Warnings are now printed, not fatal.
- **The overflow example's picture didn't overflow** (its values were too low to wrap past 255). Regenerated from a brighter picture.
- **Highlighted multi-line strings broke the per-line layout.** Each line is now wrapped in its own span.
- **The first Run's time limit included the download.** The limit now starts when Python is ready; the download gets its own 90-second allowance.
- **The Run button lost keyboard focus after a run** (it was re-created). It now keeps its identity.
- **Long output lines (C++ input example) scrolled sideways at 320 px.** The OUTPUT box now wraps lines like a terminal.
- **The Run label touched the button** on wide screens. Spacing added.
- **The keyboard box didn't appear when a student added `input()` while editing.** It now follows the edited code.
- **The typed input wasn't visible in the output** (Python printed "Name: Hi Mona"). Each typed line is now echoed where `input()` reads it, and recorded outputs follow the same convention.
- **Lint scanned the copied Pyodide files.** They are now excluded.

### Not checked (needs the owner or later phases)

- **Phones.** Pyodide's memory and speed on low-end Android phones and iOS Safari. Only desktop Chromium was tested. **[verify]**
- **Pyodide's documentation** (pyodide.org) was approved for reading but is blocked by this session's network policy, so the runner is built from the npm package and local tests only. **[verify]** whether any recommended server headers are missing.
- **Cloudflare's `_headers` support in production.** Local Wrangler applies `public/_headers`. Cloudflare's docs couldn't be opened from this session to confirm it for deployed Workers static assets. **[verify]** after the first deploy (check the `Cache-Control` on a `/pyodide/` file).
- **Compression of the Pyodide files in transit.** Unknown until deployed; the first Run downloads 13.5 MB uncompressed, about 6.3 MB gzipped.
- **Screen readers and Lighthouse.** Planned for Phase 7.

## 2026-10-08: Phase 1 (foundation)

**Environment:** Linux build container, Node 22.22.0, npm 10.9.4. Workers runtime: workerd 1.20261006.1 through Wrangler 4.149.0 and Miniflare. Tests: Vitest 5.0.3 with `@cloudflare/vitest-plugin` 1.4.0, which runs the integration tests inside workerd against a real local D1.

**One command runs everything below:** `npm run verify` (typecheck, lint, tests, production build). Last run: **exit code 0**.

### Summary

| Check | Command | Result |
|---|---|---|
| vinext compatibility | `npx vinext check` | 100% compatible (10 supported, 0 partial, 0 issues) |
| Typecheck (app + tests, `strict`, `noUncheckedIndexedAccess`) | `npm run typecheck` | 0 errors |
| Lint (typescript-eslint, React hooks, Next core-web-vitals, module-boundary rules) | `npm run lint` | 0 problems |
| Tests | `npm test` | **93 passed, 0 failed** (7 files) |
| Production build for Workers | `npm run build` | succeeded |
| Migration on local D1 | `npm run db:migrate:local` | `0001_initial_schema.sql` applied, 91 statements |
| Seed on local D1 | `npm run db:seed:local` | 3 courses |
| Health route on the built Worker | `curl localhost:8787/api/health` | `200 {"status":"ok", … "migrations":["0001_initial_schema.sql"],"publishedCourses":3}` |
| Dev server | `npm run dev`, then `/api/health`, `/`, `/courses/computer-vision` | all 200, reads the same local D1 |

### Tests by file

| File | Runs in | Tests | What it proves |
|---|---|---|---|
| `tests/integration/schema-checks.test.ts` | workerd + local D1 | 29 | The 28 course-separation checks, plus "D1 enforces foreign keys". Details below. |
| `tests/integration/drizzle-mirror.test.ts` | workerd + local D1 | 2 | The Drizzle schema and migration 0001 have the same 46 tables, and identical columns (type, nullability, default), primary keys, foreign keys (incl. `ON DELETE`) and indexes. A deliberate drift (one column default changed in the Drizzle schema) made it fail, so it does catch differences. |
| `tests/integration/course-scope.test.ts` | workerd + local D1 | 4 | Course lookup from the URL slug: the real seed file loads three courses in order; unknown, malformed (`../etc`, upper case) and draft courses resolve to nothing; the seed can be re-run without duplicates. |
| `tests/integration/health.test.ts` | workerd + local D1 | 1 | `/api/health` reads D1, lists applied migrations, sends `no-store` and `noindex`. |
| `tests/unit/design-tokens.test.ts` | Node | 40 | WCAG 2.2 AA contrast for every text/surface pair in both themes (4.5:1), badges, button text, code blocks; focus ring and difficulty colours at least 3:1 against every surface; the OS-dark and explicit-dark token blocks are identical. |
| `tests/unit/paths-and-slugs.test.ts` | Node | 14 | Slug rules and reading the course from a URL path (including a malformed `%` escape). |
| `tests/unit/config.test.ts` | Node | 3 | Ads stay off unless the environment is production **and** `ADS_ENABLED` is exactly `true`; site URL validation. |

### The 28 schema checks, now on D1

The Python checks were ported to `tests/integration/schema-checks.test.ts` and made stricter:

1. **The constraint is asserted.** Each rejected statement must fail with the expected D1 error, e.g. `FOREIGN KEY constraint failed`, `CHECK constraint failed: enabled = 0 OR ad_unit_id IS NOT NULL`, `UNIQUE constraint failed: lessons.course_id, lessons.slug`.
2. **Every rejection has a control.** The nearest valid statement (same insert, link kept inside one course) must succeed. SQLite doesn't say *which* foreign key failed, so the control is what proves the rejection came from the course boundary and not from a typo or a missing row.

| # | Check | Expected | Result on D1 |
|---|---|---|---|
| 1 | Lecture under another course's topic | rejected (FK), control allowed | pass |
| 2 | Subtopic under another course's topic | rejected (FK), control allowed | pass |
| 3 | C++ question added to a Python quiz | rejected (FK), control allowed | pass |
| 4 | Same, claiming the C++ course id | rejected (FK), control allowed | pass |
| 5 | Another course's PowerPoint attached to a lecture | rejected (FK), control allowed | pass |
| 6 | Related lecture from another course | rejected (FK), control allowed | pass |
| 7 | Question linked to another course's lecture | rejected (FK), control allowed | pass |
| 8 | MCQ option filed under the wrong course | rejected (FK), control allowed | pass |
| 9 | Hint filed under the wrong course | rejected (FK), control allowed | pass |
| 10 | Exam rule using another course's topic | rejected (FK), control allowed | pass |
| 11 | Lecture progress recorded under the wrong course | rejected (FK), control allowed | pass |
| 12 | Bookmark of a lecture under the wrong course | rejected (FK), control allowed | pass |
| 13 | Bookmark with two targets | rejected (CHECK, exactly-one-target), control allowed | pass |
| 14 | Achievement from another course awarded | rejected (FK), control allowed | pass |
| 15 | Quiz answer for another course's question | rejected (FK), control allowed | pass |
| 16 | Same, filed under the other course | rejected (FK), control allowed | pass |
| 17 | Code submission under the wrong course | rejected (FK), control allowed | pass |
| 18 | Resource file stored outside its course's R2 folder | rejected (CHECK on `r2_key`), control allowed | pass |
| 19 | Same lecture slug in two different courses | allowed | pass (fixed, see below) |
| 20 | Duplicate lecture slug inside one course | rejected (UNIQUE `course_id, slug`), control allowed | pass |
| 21 | Question added to its own course's quiz | allowed | pass |
| 22 | Resource file inside its course folder | allowed | pass |
| 23 | Ad placement enabled without an ad unit id | rejected (CHECK), disabled placement allowed | pass |
| 24 | Write-the-code question set to auto-grading | rejected (CHECK), `reference_review` allowed | pass |
| 25 | Deleting the Python course | only Python rows removed (topics, lectures, questions, quizzes, resources, quiz links, progress) | pass |
| 26 | Deleting a topic that still has lectures | rejected (FK); allowed once the lecture moves | pass |
| 27 | Deleting a topic with tagged questions | questions unlinked, kept in their course | pass |
| 28 | Search filtered to one course | only that course's results (both match without the filter) | pass |

### CPU time per request (Workers plan decision)

**Command:** `npm run build && npm start`, then `npm run measure:cpu -- http://localhost:8787 300` (300 sequential requests per route after 5 warm-up requests). The tool reads the CPU time of the local workerd processes from `/proc`.

| Route | Worker process, CPU ms per request | Proxy process | Wall ms |
|---|---|---|---|
| `/api/health` (two D1 reads, JSON) | 10.1 | 3.2 | 14.5 |
| `/` (home: D1 read + full page render) | 29.3 | 4.4 | 35.7 |
| `/courses` | 26.7 | 4.1 | 31.9 |
| `/courses/programming-fundamentals` | 28.3 | 4.1 | 35.1 |
| 404 page | 20.6 | 4.2 | 27.5 |
| *Baseline: a "hello world" Worker under the same setup* | *2.7* | *2.6* | |

**How to read this:**
- Subtracting the hello-world baseline, a server-rendered page costs roughly **24–27 ms of CPU** on this machine, and the JSON health route about 7 ms.
- This is **not** Cloudflare's billed figure. It includes local D1 work (SQLite runs inside the local runtime; in production D1 runs outside the Worker), Wrangler runs the Worker with its debugging inspector enabled, and this container's CPU is not Cloudflare's hardware. The real number could be noticeably lower.
- Even so, rendered pages are well above the free plan's **10 ms per request**, so the earlier conclusion holds: **production will probably need Workers Paid ($5/month minimum)**. Edge caching of public pages (Phase 2) will cut how many requests reach the Worker at all.
- To confirm: after the first deploy, read CPU time per request in the Cloudflare dashboard's Workers metrics. I'm not confident about how large the gap between this machine and production is.

### Browser checks of the base layout

Run with Playwright (headless Chromium) against the built Worker:

| Check | Result |
|---|---|
| No horizontal scrolling at 320 px (home), 375 px (course page), 768 px (404) and 1280 px, light and dark | pass (after shortening the header below 420 px) |
| Self-hosted fonts load (no 404s, no third-party font requests) | pass (after moving the font imports, see below) |
| Course switcher: opens, shows the current course ("Python" on a Python page), `aria-expanded` updates, Escape closes it and returns focus to the button | pass |
| Theme toggle: System → Light → Dark → System; an explicit choice survives a reload with no flash | pass |
| First Tab on a page focuses "Skip to main content" | pass |
| Unknown course slug and unknown path return HTTP 404 with the custom page | pass |

Not yet done: a real-device check on iOS Safari and Android Chrome, Lighthouse, and screen-reader testing. These are planned for Phase 7.

### Problems found and fixed during Phase 1

- **Fonts 404'd in the production build.** Importing the font CSS through Tailwind's `@import` left their `url()` paths unrewritten. Fixed by importing the font CSS from `src/app/layout.tsx`, which lets Vite emit the `.woff2` files.
- **Header overflowed at 320 px** by 58 px. Fixed by hiding the "CodeLab" wordmark (not the logo) below 420 px.
- **npm install crashed** (`Cannot read properties of null (reading 'edgesOut')`) when adding Vitest 4 next to Vite 8. Resolved by using Vitest 5 with `@cloudflare/vitest-plugin` (the maintained successor of the deprecated `@cloudflare/vitest-pool-workers`).

### Corrections to the earlier Python report

Two statements in the earlier report were wrong, and the port exposed them:
- It said "each rejected insert was confirmed to fail on the intended constraint". The Python script didn't check that: `expect_fail` accepted any integrity error. The TypeScript version now checks the error and adds a control for each case.
- Check 19 ("same slug in two different courses") inserted the slug `while-loops`, which no other course used, so it didn't test what it said. (The seed data did contain `for-loops` in all three courses, so the behaviour was right; the check wasn't.) It now inserts the same slug in two courses.

### Known gaps found (not fixed in Phase 1)

- **`id TEXT PRIMARY KEY` accepts NULL.** SQLite only implies `NOT NULL` for `INTEGER PRIMARY KEY`. Confirmed on local D1: `INSERT INTO users (id, email) VALUES (NULL, …)` succeeds. The application always generates ids, so this matters only for bugs or manual SQL. Fixing it in the database means rebuilding ~40 tables in a new migration (0001 must not be edited). Decision for the owner; until then the data-access layer must never insert without an id.
- **`npm audit` reports 10 advisories** (4 moderate, 6 high), all in packages pulled in by `vinext` 1.0.1 (`braces`, `micromatch`, `fast-glob`, `vite-plugin-commonjs`, `fflate`, `satori`, `@vercel/og`). Most are build-time tools. npm's suggested fix downgrades vinext to 0.2.1, which isn't acceptable. To revisit when vinext updates.
- **CHECK constraints, triggers, the FTS5 table and `COLLATE NOCASE` are not in the Drizzle schema.** They live only in SQL by design and are covered by the schema checks above.

### Not done in Phase 1 (needs the owner)

- **First deployment to Cloudflare.** The brief lists "initial deployment verification" in Phase 1. It needs the owner's Cloudflare account (an API token or `wrangler login`, plus creating the D1 database and R2 bucket). The build and local Workers runtime are verified; nothing has been deployed.

---

## 2026-10-08: Phase 1 (partial, before npm access)

### Database schema on desktop SQLite

- **Environment:** SQLite 3.45.1 (Python `sqlite3`), `PRAGMA foreign_keys = ON`.
- **Command:** `python3 -I tools/schema-checks/check_schema.py migrations/0001_initial_schema.sql`
- **Result:** 28 passed, 0 failed. (See the corrections above: this script accepted any integrity error, and check 19 didn't test what its name says. The D1 suite above replaces it.)
