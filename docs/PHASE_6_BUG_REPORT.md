# Phase 6 bug report

Severity: **P0** site down or data lost; **P1** a main feature broken or a security hole; **P2** a feature broken for some people or a real accessibility barrier; **P3** cosmetic or minor.

No P0 or P1 bug was found. Four bugs were found and fixed. Each fix was re-checked by the test or browser check named in the row.

| # | Severity | Where | What happened | Cause | Fix | Re-checked by |
|---|---|---|---|---|---|---|
| P6-01 | P2 | Setup tools (Windows) | With the project in a folder whose path contains a space (for example `C:\Users\me\My Projects\codelab`), `npm run dev` and `npm run build` failed while copying the Python and C++ runtimes, and `npm run db:seed:local` and `npm run admin:create` failed when calling wrangler. Found during the Phase 6 audit. | The tools found the project folder with `new URL("..", import.meta.url).pathname`, which keeps a space as `%20`. Two tools also ran `npx wrangler …` with `shell: true` on Windows, and the shell split file paths at spaces. | All tools now use `fileURLToPath(…)`. A small helper, `tools/wrangler.ts`, starts the project's own wrangler with the same Node.js and no shell, so arguments pass through unchanged. | Unit test "Windows path guard" in `tests/unit/phase6-site.test.ts` (no tool may use `.pathname` on `import.meta.url` or `shell: true`); a full fresh setup (install, migrate, seed, verify, build) in a folder whose path has spaces (`PHASE_6_TEST_REPORT.md`). Not run on a real Windows PC here. |
| P6-02 | P3 | `/privacy-policy` on phones | At 320 to 390 px the page scrolled sideways by up to 72 px. | A web address written out as link text (`policies.google.com/technologies/partner-sites`) can't wrap. | Long external link text in page prose may now wrap anywhere (`src/styles/legal.css`). | Sweep at 8 widths, light and dark: 32 loads, 0 problems. |
| P6-03 | P3 | `/admin/ads` on a 320 px phone | The page scrolled sideways by 27 px. | A file name in a sentence (`docs/PHASE_6_CONTENT_READINESS.md`) can't wrap. | The file name is in a `<code>` that may break anywhere. | Sweep at 8 widths, light and dark: 16 loads, 0 problems. |
| P6-04 | P2 (accessibility) | `/privacy-policy`, `/cookie-policy` | axe reported `scrollable-region-focusable` (serious): on narrow screens the data tables scroll sideways, but keyboard users couldn't reach the scroll box. | The scroll box wasn't focusable. | The table's scroll box is now a labelled region that can take keyboard focus (`role="region"`, `aria-label`, `tabIndex=0`), and it shows the site's focus outline. | axe re-scan, light and dark: no violations. |

Defects in the new Phase 6 code that its own tests caught during development were fixed before the final test run. They never existed in a delivered version and aren't listed one by one.

## Follow-up: header sign-in (2026-10-17)

Reported by the owner: "pressing the sign in [on] any other page except the home page doesn't work". Two bugs were found and fixed.

| # | Severity | Where | What happened | Cause | Fix | Re-checked by |
|---|---|---|---|---|---|---|
| P6-05 | P2 | Header on every page but home, after signing in | A student who signed in from a course page came back to it still seeing "Sign in" in the header and "Sign in to tick off lectures" on the page. Pressing Sign in again opened `/login?next=<that page>`, which sends a signed-in account straight back, so the button seemed dead. On the home page there is no `next`, so it went to the dashboard or admin and looked fine. A reload fixed it. | The header and the course marks ask `/api/me` once and keep the answer in the browser for the whole visit. Sign-in, sign-up and recovery ended with an in-app navigation, which keeps that answer, so the "visitor" answer from before the sign-in stayed. | Sign-in returns where to go and the form loads it in full (`window.location.assign`); the "continue" buttons after sign-up and recovery are plain links. Sign-in links in the header and on pages are plain links too, so a tab that missed a sign-in made in another tab recovers when Sign in is pressed. Saving a new name in settings asks `/api/me` again. | Browser check `journey-m.mjs` M1–M7 (sign in from 4 pages, sign up from a lecture, the other-tab case, name change, sign out). |
| P6-06 | P2 | Header on phones 420 to 479 px wide | The Sign in button was pushed past the right edge of the screen on every page (at 430 px it was fully off screen), and the page scrolled sideways. | The site name next to the logo appears from 420 px, and the header row then needed about 480 px. | The site name appears from 480 px; the Sign in button never shrinks; the signed-in account button may shorten the name (with "…") when the row is short of room. | Header at 62 widths from 320 to 1320 px on 4 pages, as a visitor and signed in with a 45-character name: 496 checks, 0 problems; sweep at 9 widths, light and dark, 180 loads, 0 problems. |

Also found and **not fixed** (not part of this report): a "page not found" page shows the site header twice (for example `/nope` or `/courses/computer-vision/lectures`). The root `not-found.tsx` adds the header and footer itself, and vinext also wraps it in the public site's layout. Cosmetic (P3); the page works.

## Test-script fixes (not site bugs)

Two failures in the new browser check `journey-l.mjs` were mistakes in the check, not in the site:

- The "lecture program still runs" step looked for an output box class that doesn't exist (`.lec-out`). It now waits for the runner's status line, as journey H does. Result after the fix: "Compiled in 3305 ms and ran in 43 ms, in your browser."
- The "staff get no ad script" step waited for the network to go quiet, which a signed-in administrator's page doesn't always do (the admin header prefetches admin pages). It now waits for the page to load plus 2.5 s.

Also, `journey-f.mjs` (Phase 5.1) now includes the four new administrator-only pages: the administrator opens them, and an editor, a course admin and a student are refused.

## Observed, not a bug

- Layout shift on the course page at 1440 px measured 0.012 in some runs and 0.002 in others, in both Phase 5.1 and Phase 6. The shifting elements are the header and the course tab bar moving 4 px when the web font finishes loading; the ad markers are never among them. Well under Google's 0.1 "good" threshold. Left as is.

## Still open from Phase 5.1 (owner decisions, unchanged)

- Sign-up limit of 20 per network per hour (raising it to about 200 was recommended, because a whole class may share one network).
- 15 npm advisories in build-only tools, planned for Phase 7.
- Deployment and the Cloudflare setup.
