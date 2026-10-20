# Browser checks (Phase 5.1 and 6)

Scripts that drive a real Chromium through the site, the way a student, a
teacher and an administrator use it. They are not part of `npm test`: they need
a running site and Playwright, which is not a project dependency.

## Setup (once)

```bash
npm install -g playwright
npx playwright install chromium
```

## Run

Start the built site with the local database:

```bash
npm run db:migrate:local && npm run db:seed:local   # first time only
npm run build && npm start                           # http://localhost:8787
```

Then, in another terminal, from the project folder:

| Script | What it checks |
| --- | --- |
| `node tools/browser-checks/journey-ab.mjs` | A: a visitor without an account (lectures, practice, final quiz asks to sign in, dashboard and admin closed). B: a student signs up, answers, bookmarks, exports, signs out and in. C: one course's history doesn't show another's. |
| `node tools/browser-checks/journey-de.mjs` | D: final quiz, 2 tries then a 24-hour lock that survives sign-out and another browser; the server refuses a third start; another student is unaffected. E: custom exam with a reload and Resume. |
| `node tools/browser-checks/journey-e2.mjs` | E: the Resume card keeps the answer and the remaining time. |
| `ADMIN_EMAIL=… ADMIN_PASSWORD=… node tools/browser-checks/journey-f.mjs` | F: administrator opens all 59 admin pages, creates an editor and a course admin; each sees only their own course and none of the administrator-only pages (advertising, site details, messages); a student sees no admin page. Needs a local administrator (`npm run admin:create`). |
| `node tools/browser-checks/journey-g.mjs` | G: password recovery with the recovery code, then account deletion. |
| `node tools/browser-checks/journey-hj.mjs` | J: Python and C++ run in the browser; write-the-code shows "tests passed in your browser", not a mark. H: a slow connection, and a Python or C++ download that breaks part way. |
| `node tools/browser-checks/journey-i.mjs` | I: a real timer runs out. Only with a 60-second limit on the timed quiz in the **local** database (below). |
| `node tools/browser-checks/journey-extra.mjs` | The four newer question formats answered in the browser; the theme button; search inside one course; robots and sitemap; no third-party requests. |
| `ADMIN_EMAIL=… ADMIN_PASSWORD=… node tools/browser-checks/journey-k.mjs` | K (Phase 6): ads stay off (no request to an ad host, markers have no size), the `?ad-preview=1` boxes and where they sit, the Advertising admin (validation, placements, exclusions, `/ads.txt`, audit), site details, the contact form and inbox, a student and a visitor kept out, privacy choices and the footer. Puts every setting back at the end. |
| `ADMIN_EMAIL=… ADMIN_PASSWORD=… [CMP=third-party] node tools/browser-checks/journey-l.mjs` | L (Phase 6): the live-ad path in **production mode** with Google's scripts replaced by stand-ins inside the browser, so nothing reaches Google (below). |
| `[ADMIN_EMAIL=… ADMIN_PASSWORD=…] node tools/browser-checks/journey-m.mjs` | M (Phase 6 follow-up): the header's Sign in on pages other than home; signing in, signing up and a tab that missed a sign-in all come back signed in; the name and title on the account button; the menu (View my progress, settings, Sign out); a name change; 390 px light and dark. The administrator steps run only with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. |
| `node tools/browser-checks/perf.mjs <name> '["/", "/courses/…"]'` | Local lab timings (LCP, layout shift, first paint, requests, bytes) at 390 px with the CPU slowed 4 times and at 1440 px; 3 loads per page (`RUNS=…`), middle value kept. Not field data. |
| `node tools/browser-checks/a11y.mjs <name> "<cookie or empty>" '["/", "/login"]'` | axe-core WCAG 2.1 A/AA scan, light and dark, and what the first Tab reaches. Needs axe-core (`npm install -g axe-core`). |
| `node tools/browser-checks/sweep.mjs <name> "<cookie or empty>" '["/", "/courses"]'` | Each page at 9 widths (320 to 1920 px), light and dark: sideways scrolling, console errors, failed requests, the anti-framing header. |

For `journey-i.mjs`, shorten the timed quiz in the local database first and put it back afterwards:

```bash
npx wrangler d1 execute codelab --local --command "UPDATE quizzes SET time_limit_sec = 60 WHERE slug = 'loops-timed-quiz'"
node tools/browser-checks/journey-i.mjs
npx wrangler d1 execute codelab --local --command "UPDATE quizzes SET time_limit_sec = 900 WHERE slug = 'loops-timed-quiz'"
```

For `journey-l.mjs`, stop `npm start` (both use the same local database) and start the build in production mode on port 8788. Add the last `--var` and `CMP=third-party` to test a third-party consent platform:

```bash
npx wrangler dev --config dist/server/wrangler.json --persist-to .wrangler/state --port 8788 \
  --var APP_ENV:production --var ADS_ENABLED:true --var PUBLIC_SITE_URL:http://localhost:8788 \
  [--var CMP_SCRIPT_URL:https://cmp.stub.invalid/cmp.js]
BASE_URL=http://localhost:8788 ADMIN_EMAIL=… ADMIN_PASSWORD=… node tools/browser-checks/journey-l.mjs
```

It saves a fake-shaped publisher id (`pub-1234567890123456`) and test placements in the **local** database and removes them at the end (step L9). If a run stops half way, put the settings back on `/admin/ads` (delete the placements, clear the publisher id, switch ads off, consent "None yet").

Sign-ups are limited to 20 per network address per hour, and every journey signs
up new students, so clear the local counter between runs:

```bash
npx wrangler d1 execute codelab --local --command "DELETE FROM rate_limits WHERE key = 'signup:ip:127.0.0.1'"
```

Never point these scripts at the production site: they create accounts and attempts.

Each script prints one line per step (`[PASS]`, `[FAIL]`, …), saves the results
in `browser-check-logs/` and screenshots in `browser-check-shots/`, and exits
with 1 when a step fails.

Settings: `BASE_URL` (default `http://localhost:8787`), `PLAYWRIGHT_DIR`,
`CHROMIUM_PATH`, `SHOTS_DIR`, `LOG_DIR`. See `lib.mjs`.
