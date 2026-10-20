# Phase 5.1 summary

Date: 2026-10-11. This summarises the five Phase 5.1 reports in this folder. The
evidence for every point is in those reports.

Labels used below:

- **IMPLEMENTED:** the code exists.
- **TESTED:** an automated test covers it.
- **VERIFIED:** it was also shown to work in a real browser (Chromium) in this audit.
- **FIXED:** it was broken, it was fixed here, and a test or browser check now proves the fix.
- **BLOCKED:** it needs something only the owner can provide.
- **NOT TESTED:** it was not run in this audit.
- **FUTURE PHASE:** it belongs to Phase 6 or later.

## 1. What already worked

The Phase 5 zip was green on its own checks: 309 tests, 598 content checks, typecheck, lint, build and the vinext check. In a browser, these were confirmed working before any fix and still work after them (VERIFIED):

- Public lectures without an account.
- Python and C++ running in the browser.
- All eight question formats.
- Quizzes, the timed final quiz with 2 attempts and a 24-hour lock enforced on the server, practice exams and the exam builder.
- Reload and resume.
- Automatic submission when the timer runs out.
- Student sign-up, sign-in, recovery codes, bookmarks, history, export and account deletion.
- The admin with its three roles.
- Course isolation.

## 2. What was broken

There were 11 bugs and none was P0 or P1. Details, steps to reproduce and root causes are in `PHASE_5_1_BUG_REPORT.md`.

The most important was B01. A signed-in student could send "3 of 3 tests passed" for a write-the-code question. The server stored that as a correct answer, and it counted towards progress, achievements and the teacher's analytics.

The other bugs:

- B02: pages could be framed by another site.
- B03: the sign-up text said "nothing else" is kept, but sessions also store the IP address and browser.
- B04: two submissions of the same attempt at the same moment could overwrite each other.
- B05: a Python download that broke part way left Run spinning for 3 minutes.
- B06: TEXT primary keys accepted NULL.
- B07 and B08: four pages scrolled sideways on phones.
- B09 to B11: three accessibility failures (contrast, the dark Delete button, and dashboard list markup).

## 3. What was fixed

All 11 bugs are FIXED. The new tests were also run against the old code, where 9 of the 55 tests in those files failed; all of them pass now.

The fix for B01 changes how answers are stored:

- Code that runs only in the browser is now stored as a self-check ("Tests passed in your browser"), never as a mark.
- History shows such answers as "Not marked".
- Migration 0006 (additive) moves earlier marks of this kind.

No feature, lecture or question was removed, and no applied migration was edited.

## 4. Files changed

The full list is in `PHASE_5_1_CHANGED_FILES.md`:

- 56 files: 23 added, 33 changed, none deleted.
- The new files are migration 0006, the browser-check scripts in `tools/browser-checks/`, the tests and the reports.

## 5. Tests that passed (on the final code)

- 598 content checks.
- Typecheck, lint, build and the vinext check.
- 331 automated tests in 26 files: 309 old and 22 new, all passing.
- Browser journeys A to J and the extra checks (Chromium): all steps pass.
- Accessibility scan, axe-core WCAG 2.0 and 2.1 A and AA: 0 violations on 27 pages in light and dark.
- Layout sweep at 9 widths from 320 to 1920 px, light and dark: 1,004 page loads with no sideways scrolling, console errors or failed requests.
- The zip was extracted into an empty folder, and the documented setup was run there from scratch: `npm ci`, `db:migrate:local`, `db:seed:local` and `npm run verify`. All four passed, with 331 tests in 26 files and a complete build.

## 6. What couldn't be tested

| Item | Status | Reason |
| --- | --- | --- |
| Firefox, Safari, and real Android and iPhone devices | NOT TESTED | Only Chromium is available here. |
| Screen readers | NOT TESTED | A real NVDA or VoiceOver session is needed. |
| Load with many students | NOT TESTED | Needs a deployed site. |
| The deployed site | BLOCKED | Needs the owner's Cloudflare account and approval. |
| Turnstile | BLOCKED | Needs the owner's Turnstile keys. |
| Email | Not built on purpose | Recovery codes replace it by design. |

## 7. What remains incomplete

- Content (not a software bug):
  - Python and Computer Vision have only 2 published lectures each.
  - Many topics have no lecture yet, and they say so.
  - No PDF or PowerPoint resources have been uploaded. The upload system itself was tested.
- Not fixed, by decision or because they belong to a later phase (observations O1 to O8 in the bug report):
  - nothing writes to the error log table yet;
  - public pages are not cached at the edge;
  - there is no full Content-Security-Policy;
  - 15 npm advisories, all in build tools.
- FUTURE PHASE: ads, consent, legal pages, ads.txt and Search Console (Phase 6); production review, caching and monitoring (Phase 7).

## 8. Public beta?

A small **closed** beta with one class is reasonable, once the owner has done the Cloudflare steps in `PHASE_5_1_DEPLOYMENT_READINESS.md` and raised the sign-up limit.

A **public** launch is not recommended yet, because these are still missing:

- legal pages and a privacy policy (Phase 6);
- testing on real phones and other browsers;
- a production deployment that has been tested.

## 9. Can Phase 6 begin?

Yes. There is no open P0 or P1 bug, every Phase 1 to 5 journey passes, and the architecture is stable. Phase 6 was not started.

## 10. Decisions that need the owner

1. **Sign-up limit (20 per network address per hour).** A class signing up together on one school network would be refused after the 20th student. Recommendation: raise it, for example to 200, before a class signs up, and rely on Turnstile against bots.
2. **npm advisories (build tools only).** Recommendation: leave them until Phase 7 and recheck then.
3. **Deployment.** Nothing was deployed. It needs the owner's Cloudflare account, the real database ID, the secrets (`ASSESSMENT_SECRET`, Turnstile) and explicit approval. Uploading lesson images to remote R2 also needs permission.
