# Phase 6 summary: AdSense and monetization readiness

Date: 2026-10-15, updated 2026-10-16 and 2026-10-17. Built on `CodeExpert_Phase5_1_Reviewed.zip`.

## The answer first

The site now has everything AdSense needs on the code side, **switched off**: a policy-safe ad system with fixed positions, a consent design built on Google-certified platforms, draft legal pages, a contact form, `/ads.txt`, verification tags and an admin to control it all. Nothing was deployed, nothing was sent to Google, no AdSense account was used, and no ad can load until the owner turns on four separate switches. Approval is Google's decision and is **not** promised.

The biggest risk for an AdSense review was content: the Python and Computer Vision courses had 2 lectures each. The owner chose to write more lectures, and 14 Python and 17 Computer Vision lectures have now been written from the owner's slides (see the update below). 12 of 47 topics still say "Coming soon" (`PHASE_6_CONTENT_READINESS.md`).

## Update: Python and Computer Vision lectures (2026-10-15)

- **31 new lectures** from the owner's slides: Python (ECE3112) weeks 1 to 3 and Computer Vision (ECE4704) weeks 1 to 3. They replace the 2 + 2 that existed (same addresses for those four). The site now has 48 lectures.
- **Every program was run.** 41 Python programs have a Run button and were run in the browser as well (38 printed exactly the OUTPUT box; the 3 deliberate error examples stopped with the error the lecture describes). OpenCV and graphics.py programs can't run in a browser: they were run with OpenCV 5.0.0 and a stand-in for graphics.py (`tools/lesson-runtime/`), and the page shows their recorded output and a picture of each window.
- **Every picture is drawn by a script** from the lecture's own program; no photo from the slides was used.
- Practice for these topics followed on 2026-10-16 (next section).
- Checks: `npm run verify` pass (439 tests); `content:check` 299 lecture and 452 question checks pass; the 33 new pages swept at 4 widths in light and dark (1 line fixed, re-checked) and scanned with axe (0 violations); journeys H–J and extra re-run and pass.

## Update: practice questions for the new topics (2026-10-16)

- **124 hand-written questions and 17 topic quizzes** for the 17 topics that had a lecture but no practice: 48 questions and 6 quizzes in Python, 76 questions and 11 quizzes in Computer Vision. Nothing was generated automatically. Every topic with a lecture now has practice and a quiz.
- **Every answer key was checked by running it.** Questions that use OpenCV, NumPy or graphics.py are multiple choice or "trace the output"; `tools/check-exercise-code.ts` now runs them through the same lesson runtime as the lectures. Fix-the-code and write-the-code questions use plain Python so they run in the browser.
- Checks: `content:check` 299 lecture and 586 question checks pass; `npm run verify` pass (439 tests; 2 tests updated to expect the new quizzes and no topic without questions); all 141 new pages opened in Chromium at 1280 and 390 px with no errors or sideways scrolling, and 55 questions answered there with their own keys (25 traces, 8 values, 22 code questions run against their tests in the browser), all marked correct.
- Details: `PHASE_6_CONTENT_READINESS.md`.

## Update: header sign-in and account menu (2026-10-17)

- **Fixed:** after signing in from any page but the home page, the header still said "Sign in", and pressing it seemed to do nothing (the sign-in page sent the signed-in student straight back). The header kept what it had learned before the sign-in. Signing in, signing up and recovering an account now finish with a full page load, so the header and the course marks ask again who is signed in.
- **Fixed:** on phones 420 to 479 px wide (for example 430 px) the Sign in button was pushed past the right edge of the screen on every page.
- **New:** when signed in, the header shows the account's name and title (Student, Editor, Course admin or Administrator). Clicking it opens a menu with View my progress, Account settings, Admin (staff only) and Sign out. Phones keep the round initial; the menu shows the name and title.
- Checks: `npm run verify` pass (441 tests; 2 new); new browser check `journey-m.mjs` 27/27; journeys A–B and G re-run and pass; header checked at 62 widths from 320 to 1320 px as a visitor and with a long name (0 problems); sweep and axe scan pass. Details: `PHASE_6_BUG_REPORT.md` (P6-05, P6-06) and `PHASE_6_TEST_REPORT.md`.

## What was built

- **Ad system, off by default.** Ads only at fixed positions on the home page, course pages, lectures, single questions and file pages, with a hard cap per page (lectures: 3). In lectures an ad may only sit between two sections of plain reading, never next to a code box, Run button, output, picture or navigation. Never on quizzes, exams, practice sets, sign-in, accounts, dashboards, admin, search, contact, legal or error pages. Each live ad is labelled "Advertisement", has reserved space so text doesn't jump, and folds away if Google has no ad. Staff never get live ads (so they can't click their own). Details: `PHASE_6_AD_PLACEMENT_PLAN.md`.
- **Admin.** `/admin/ads` (checklist, settings, consent, placements, exclusions, preview links, content per course, change history), `/admin/site` (the owner's details for the legal pages, verification tags) and `/admin/messages` (contact inbox). Administrators only. Every change is audited. No revenue figures and no field that accepts scripts or HTML; ids are validated to digits.
- **Consent.** No live ad without Google's Privacy & messaging or another Google-certified CMP; with a third-party CMP, the ad script waits for its decision and gives up after 10 s. `/privacy-choices` re-opens the consent message and clears this site's data on the device. Details: `PHASE_6_PRIVACY_AND_CONSENT.md`.
- **Legal pages** (privacy, terms, cookies, advertising), an updated About page and a **contact form** with spam protection. They describe what the code really does, invent no owner details (yellow gaps instead), and say "Draft" until the owner fills in the details and ticks "reviewed".
- **`/ads.txt`** only once a real publisher id is saved; **Search Console and AdSense verification tags** from `/admin/site`; the new pages in the **sitemap**.
- **Windows fix:** the setup tools now work in a folder whose path has spaces.
- **Migration 0007** (additive; 0001–0006 untouched; tested with existing rows).

## Evidence

| Check | Result |
|---|---|
| `npm run verify` (typecheck, lint, tests, build) | Pass, 439 tests (baseline 331) |
| `npm run content:check` | 299 lecture and 586 question checks pass, 0 fail (146 lecture checks before the Python and CV lectures; 452 question checks before the new questions) |
| Phase 5.1 browser journeys A–J and extra, re-run | All pass |
| New journey K (ads off, preview, admin, contact, access) | 34/34 |
| New journey L (production mode, stand-in Google scripts, no request to Google) | 18/18 (Google consent), 19/19 (third-party consent) |
| 8 widths × light and dark, new pages | 224 loads; 2 pages scrolled sideways on phones, fixed, re-checked |
| axe accessibility, light and dark | 1 issue on 2 pages, fixed, re-checked |
| Performance vs Phase 5.1 (local lab) | No measurable slowdown; about 3 KB more JavaScript per page |
| Fresh setup from the ZIP in a folder whose path has spaces | Install, migrate, seed, first administrator, verify and build all pass |

Full numbers: `PHASE_6_TEST_REPORT.md`. Bugs: `PHASE_6_BUG_REPORT.md` (4 found, none P0/P1, all fixed). Google's rules, each with its source, date and status: `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`.

## Important limits of this work

- Google's policy pages could **not be opened** from this environment (`support.google.com` and `developers.google.com` are blocked); each rule was taken from search summaries of Google's own pages, and the audit says so row by row. The owner should open each linked page once.
- Real ads, the real consent message, Firefox, Safari, real phones, a real Windows PC and screen readers were **not tested**.
- The legal texts are drafts, not legal advice. Egypt's data protection rules were found only in secondary sources.

## What the owner needs to do

In order (details in `PHASE_6_OWNER_ACTIONS.md`):

1. Read the new Python and Computer Vision lectures and say what to change (decided: more lectures; done from the slides uploaded so far).
2. Fill in `/admin/site`; have the legal pages reviewed by a lawyer; tick "reviewed". Choose the content licence.
3. Give the go-ahead to deploy (with ads off), and create the Cloudflare resources.
4. AdSense: account (18+), add the site, publisher id in `/admin/ads`, verification tag, request review, keep Auto ads off.
5. Publish the European regulations consent message in AdSense.
6. After approval: ad units, placements, `ADS_ENABLED="true"`, admin switch on, one signed-out check, never click your own ads.

Also still open from Phase 5.1: raise the sign-up limit to about 200 per hour (recommended), and leave the build-tool npm advisories until Phase 7 (recommended).

## Reports

`PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`, `PHASE_6_AD_PLACEMENT_PLAN.md`, `PHASE_6_PRIVACY_AND_CONSENT.md`, `PHASE_6_CONTENT_READINESS.md`, `PHASE_6_SEO_REPORT.md`, `PHASE_6_SECURITY_REVIEW.md`, `PHASE_6_TEST_REPORT.md`, `PHASE_6_BUG_REPORT.md`, `PHASE_6_CHANGED_FILES.md`, `PHASE_6_OWNER_ACTIONS.md`, `PHASE_6_DEPLOYMENT_READINESS.md`.
