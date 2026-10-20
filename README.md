# Code_Expert

A free programming-education platform for university students: lectures written in full on the site, with code you can run in the browser, presentations, and interactive practice (MCQ, trace the code, correct the code, write the code), quizzes and practice exams. It runs on Cloudflare (Workers, D1, R2).

**Every course is its own independent learning environment.** Lectures, materials, questions, quizzes, exams and student progress never mix between courses, and the database enforces this. The launch courses:

1. Programming Fundamentals (C++)
2. Programming Applications (Python)
3. Computer Vision (Python and OpenCV)

## Status: Phase 6 (AdSense and monetization readiness) done locally, waiting for review

| Item | State |
|---|---|
| Phase 1: architecture, database, scaffold, design system, base layout | done and reviewed |
| Phase 2: lessons on the site in the lec style, Python and C++ that run in the browser, public pages, SEO | done and reviewed |
| Phase 3: questions in 8 formats, quizzes (with models), practice sets, practice exams, build your own exam | done and reviewed: 264 questions, every answer key checked by running it |
| Phase 4: staff sign-in, roles, the admin for courses, topics, lectures, questions, quizzes, practice exams, files, publishing and scheduling, search-engine settings, staff accounts, history and the audit log | done and reviewed |
| Phase 5: optional student accounts, saved progress per course, bookmarks, quiz and exam history with reviews, saved code drafts, a personal dashboard per course (suggestions, streaks, achievements), account settings, data download and account deletion; the admin's Students page and per-course student analytics | done |
| Phase 5.1: functional audit of Phases 1 to 5, 11 bugs fixed (none P0 or P1), security review, browser checks at phone to wide sizes, deployment readiness | done and reviewed: see `docs/PHASE_5_1_*.md` |
| Phase 6: an ad system that is off by default (fixed positions, never on quizzes, exams, account or admin pages), consent through a Google-certified CMP, admin pages for advertising, site details and contact messages, privacy policy, terms, cookie policy, advertising disclosure, contact form, privacy choices, `/ads.txt`, verification tags, Windows folder-with-spaces fix | done locally: see `docs/PHASE_6_*.md`. **Ads are off; nothing was submitted to AdSense.** |
| Lectures | 48: C++ 17, Python 14 and Computer Vision 17, written from the owner's slides; every program run (`npm run content:check`). The Python and CV lectures were added on 2026-10-15 and wait for the owner's review. |
| Practice questions | 388: C++ 230, Python 68 and Computer Vision 90, with a practice quiz for every topic that has a lecture; every answer key checked by running it. The 124 for the new Python and CV topics were written by hand on 2026-10-16 and wait for the owner's review. |
| Legal pages | drafts: they need the owner's details on `/admin/site` and a legal review (`docs/PHASE_6_OWNER_ACTIONS.md`) |
| First deployment to Cloudflare | not started: needs the owner's Cloudflare account |

The site is called **Code_Expert**; internal names (package, Worker, D1 database, R2 bucket) stay `codelab`.

Plan and decisions: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md). Test results: [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md). How to write lessons: [`docs/CONTENT.md`](docs/CONTENT.md). Phase 6 (AdSense readiness): [summary](docs/PHASE_6_SUMMARY.md), [owner actions](docs/PHASE_6_OWNER_ACTIONS.md), [compliance audit](docs/PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md). Phase 5.1 audit: [summary](docs/PHASE_5_1_SUMMARY.md), [`docs/PHASE_5_1_FUNCTIONAL_AUDIT.md`](docs/PHASE_5_1_FUNCTIONAL_AUDIT.md), [bugs](docs/PHASE_5_1_BUG_REPORT.md), [tests](docs/PHASE_5_1_TEST_REPORT.md), [security](docs/PHASE_5_1_SECURITY_REVIEW.md), [deployment readiness](docs/PHASE_5_1_DEPLOYMENT_READINESS.md), [files changed](docs/PHASE_5_1_CHANGED_FILES.md). Browser checks that drive a real Chromium through the site: [`tools/browser-checks/`](tools/browser-checks/README.md). The original brief is in [`docs/brief/`](docs/brief/).

## Running it locally

You need Node.js 22.6 or newer (the content tools run TypeScript directly). Everything runs locally; no Cloudflare account is needed.

```
npm ci                     # install exact dependency versions from package-lock.json
npm run db:migrate:local   # create the local D1 database from migrations/
npm run db:seed:local      # add the courses, lessons, questions and quizzes, and the lesson pictures (local D1 + R2)
npm run dev                # http://localhost:5173
```

To run the production build in the local Workers runtime instead:

```
npm run build
npm start                  # http://localhost:8787
```

Then open `/api/health`: it should report migrations 0001 to 0007 and 3 published courses. Lecture pages are under `/courses/<course>/lectures/<lecture>`, for example `/courses/programming-applications/lectures/strings-indexing-and-slicing`.

`npm run dev` and `npm run build` first copy Pyodide from `node_modules/pyodide` into `public/pyodide/` and prepare the C++ compiler from `node_modules/browsercc` in `public/cpp/` (neither is committed), so Python and C++ run without any CDN.

### Running it on Windows

Use PowerShell or Command Prompt in the project folder (the one with `package.json`). Install Node.js 22 LTS from nodejs.org first, then:

```
npm ci
npm run db:migrate:local
npm run db:seed:local
npm run admin:create
npm run dev
```

Open http://localhost:5173 for the site, http://localhost:5173/register to make a student account, and http://localhost:5173/admin for the admin. To stop the server, press Ctrl+C in that window. To start again later, only `npm run dev` is needed. If you pulled a newer version with a new migration, run `npm run db:migrate:local` once before `npm run dev`. Phase 6 adds migration 0007, so run it once after unzipping this version over the old one.

The project folder may have spaces in its path (for example `C:\Users\you\Desktop\Code Expert`): since Phase 6 every setup tool handles that.

### The admin (staff sign-in)

Staff sign in at `/login` (the same page students use); staff accounts are never made by signing up. Create the first administrator on your own computer:

```
npm run admin:create                 # local database
npm run admin:create -- --remote     # the real D1 database, after `npx wrangler login`
```

It asks for an email, a name and a password (typed twice, not shown); only the password's scrypt hash is stored. Running it again for the same email resets that password. After that, administrators add staff on the **Staff accounts** page: an account gets a temporary password that is shown once, and the person is asked to choose their own after signing in. There is no email sending yet, so pass the temporary password on privately.

Roles:

| Role | Can do |
|---|---|
| Administrator | everything in every course, create and delete courses, staff accounts, the audit log |
| Course admin (per course) | edit, publish, schedule and delete everything in that course, and its settings |
| Editor (per course) | view and edit in that course; their changes keep the current status, a course admin publishes |

A course someone can't open answers 404 in the admin, so it doesn't reveal which courses exist.

Sign-in is limited to a few failed tries per account and per address. For production, also turn on Cloudflare Turnstile on the sign-in form: create a Turnstile widget in the Cloudflare dashboard, put its site key in `wrangler.jsonc` under `vars` as `TURNSTILE_SITE_KEY`, and set the secret with `npx wrangler secret put TURNSTILE_SECRET_KEY`. Without both, sign-in still works with the rate limits alone, and the admin dashboard shows a reminder in production.

### Student accounts

Accounts are optional: every lecture, question, quiz and exam stays open without one. A student signs up at `/register` with a name, an email and a password, nothing else. An account keeps, per course: lectures opened and marked as done, every checked answer, quiz and exam results with a review of every answer, code drafts for write-the-code and correct-the-code questions, and bookmarks. `/dashboard` shows one card per course; `/dashboard/<course>` shows that course only (suggestions for what to do next, days in a row, achievements, topic progress, history, bookmarks). `/settings` has the name, password, recovery code, signed-in devices, "Download my data" (JSON) and "Delete my account".

There is no email sending yet, so emails aren't verified and there is no reset link. Instead a student gets a **recovery code** when they sign up (shown once) and uses it at `/forgot-password`. If they lost both, an administrator gives them a temporary password on the **Students** page. Guests' practice marks stay in their own browser only, as before.

The final C++ quiz (and any quiz with an attempt limit) now needs a student account: its 2 attempts and 24-hour lock are counted per student, so another browser or a private window doesn't give more tries.

Student sessions last 30 days (7 days without using the site). A student account never opens the admin; staff who sign in keep the 7-day / 12-hour staff session.

### Quizzes and practice exams need a secret in production

Quiz and exam attempts are signed so a browser can't change its questions or its timer. Locally this works with no setup. Before deploying, set a secret of 32 or more random characters once:

```
npx wrangler secret put ASSESSMENT_SECRET
```

Without it, quizzes and exams answer "not available right now" in production; single exercises still work.

### Advertising, legal pages and contact messages (Phase 6)

Ads are **off**, and stay off until every item on **Advertising** (`/admin/ads`, administrators only) is ticked: production, `ADS_ENABLED="true"` in `wrangler.jsonc`, the switch on that page, a real AdSense publisher id, a Google-certified consent platform, and at least one placement with a real ad unit id. Nothing on the site contacts Google until then. Ads only ever go in fixed positions on the home page, course pages, lectures, single questions and file pages, never on quizzes, exams, sign-in, account, search, legal or admin pages. `?ad-preview=1` on a page shows staff where they would go, without loading anything.

**Site details** (`/admin/site`) holds what only the owner can give: who runs the site, a contact email, the country, the policies' date, and the Google verification values. Until it is filled in and a legal review is confirmed, the privacy policy, terms, cookie policy and advertising pages say they are drafts and show the missing facts in yellow. **Messages** (`/admin/messages`) is the inbox of the contact form at `/contact`; the site sends no email.

Everything the owner has to do, in order: [`docs/PHASE_6_OWNER_ACTIONS.md`](docs/PHASE_6_OWNER_ACTIONS.md).

## Checks

| Command | What it does |
|---|---|
| `npm run verify` | everything below, in order |
| `npm run typecheck` | regenerates binding types, then TypeScript strict on the app and tests |
| `npm run lint` | ESLint, including the module-boundary rules |
| `npm test` | unit tests in Node, integration tests inside the Workers runtime on a fresh local D1 (counts in `docs/TESTING_REPORT.md`) |
| `npm run build` | production build for Cloudflare Workers |
| `npm run check:vinext` | vinext compatibility scan |
| `npm run measure:cpu` | CPU time per request against `npm start` (Linux only) |
| `npm run content:check` | compiles/runs every lesson program and every question's code, answers and tests (needs g++ and python3; the Computer Vision lectures also need `opencv-python`, or they are reported as skipped) |
| `npm run content:build` | turns `content/` into `seed/0002_content.sql` (lessons), `seed/0003_exercises.sql` (questions, quizzes, exams) and the image list for R2 |

## Project rules

- Course isolation: every course-owned row has `course_id NOT NULL`, links use composite keys, slugs are unique per course, and R2 keys start with `courses/<course_id>/`.
- Never edit an applied migration; add a new numbered file in `migrations/`.
- Cloudflare bindings are read only in `src/server/platform/env.ts`; pages and components never query the database directly (both enforced by lint).
- Every admin page, route and server action checks the signed-in staff member and the course permission on the server (a test fails the build if a new admin file skips it), and every change writes an audit entry.
- Ads stay off unless the environment is production, `ADS_ENABLED=true`, the admin switch is on, real AdSense ids exist and a certified consent platform is set; never on quizzes, exams, account, legal or admin pages (`src/lib/ads/policy.ts`).
- Student data is personal: pages under `/dashboard` and `/settings` and everything under `/api/me/` read the session on the server and only ever return the signed-in student's own rows, in the course asked for; public pages stay the same for everyone and fill in the personal parts after loading.
