# Phase 6 deployment readiness

Short answer: the code is ready to deploy with ads **off**, after the Cloudflare steps from Phase 5.1 and the owner's go-ahead. It is ready to **apply** to AdSense only after it is live on the owner's domain, the legal pages are filled in and reviewed, and the content decision in `PHASE_6_CONTENT_READINESS.md` is made. Nothing was deployed, no Cloudflare resource was created, nothing was sent to Google, and no ad was enabled.

## State of the code

| Item | State |
|---|---|
| Open P0 or P1 bugs | None |
| Bugs found in Phase 6 | 4 (none P0/P1), all fixed and re-checked (`PHASE_6_BUG_REPORT.md`) |
| Automated checks on the final code | Typecheck, lint, 439 tests in 30 files, build: pass. Content checks: 299 lecture and 586 question checks pass, 0 fail (after the Python and CV lectures and their questions were added). |
| Browser checks | Phase 5.1 journeys A to J and "extra" re-run and pass; new journeys K and L pass; 8 widths in light and dark; axe accessibility (Chromium only). Numbers in `PHASE_6_TEST_REPORT.md`. |
| Migrations | 0001 to 0007. 0007 is new and additive in effect: it rebuilds the two ad tables that no code had written to, copying every row (tested with old rows in `phase6-migration.test.ts`). No applied migration was edited. D1 runs it like the earlier ones (`wrangler d1 migrations apply`). |
| Dependencies | None added or changed. |
| Secrets in the source | None. No AdSense publisher id or ad unit id is in the code or the ZIP. |
| Ads | Off. `ADS_ENABLED` is `"false"`, the admin switch is off, there is no publisher id and no consent platform. Four separate things would have to change before an ad could load. |

## Deployment steps (unchanged from Phase 5.1, plus Phase 6 notes)

The full list is in `PHASE_5_1_DEPLOYMENT_READINESS.md` ("What the owner must do before any deployment"). In short: Cloudflare account and plan; create D1 and R2 and put the real `database_id` in `wrangler.jsonc`; secrets (`ASSESSMENT_SECRET`, Turnstile); variables (`APP_ENV=production`, `PUBLIC_SITE_URL`); `wrangler d1 migrations apply DB --remote`; load content; first administrator; domain and HTTPS; deploy, only with the owner's approval.

Phase 6 adds:

- Migration 0007 is applied by the same command; no separate step.
- Leave `ADS_ENABLED` at `"false"` for the first deployment. Turning ads on is a separate, later step (`PHASE_6_OWNER_ACTIONS.md`, section F).
- `CMP_SCRIPT_URL` only if the owner chooses a third-party consent platform instead of Google's.
- After deploying: fill in `/admin/site`, so the legal pages lose their "draft" notices once reviewed.
- Turnstile keys now also protect the contact form.

## What changes in production mode (checked locally on port 8788)

With `APP_ENV=production` and `ADS_ENABLED=true`, run locally with stand-in Google scripts inside the browser (journey L, both consent modes):

- The checklist at `/admin/ads` passes only when the admin switch, a publisher id and a consent platform are also set.
- Ads appear only in the fixed positions, labelled "Advertisement"; an unfilled unit folds away; quiz, sign-in, exam, legal, contact and search pages load no ad script; staff get no ads; the preview is staff-only.
- The sitemap lists the new legal and contact pages (not `/privacy-choices`); robots.txt keeps admin, API and personal pages out; the verification meta tags appear on the home page when set.

What can't be checked before deployment: real Google ads and fill, the real consent message, TLS and the `__Host-` cookie over HTTPS, Cloudflare caching and limits, many students at once.

## Recommended order

1. Deploy with ads off (owner's go-ahead needed).
2. Owner fills in site details; lawyer review; tick "reviewed".
3. Owner reviews the new Python and CV lectures; decides about the 12 remaining "Coming soon" topics (more slides, or hiding them).
4. AdSense account, publisher id, site verification, review request (Auto ads off).
5. Consent message published in AdSense.
6. After approval: ad units, placements, `ADS_ENABLED=true`, admin switch on, one careful signed-out check.

## Phase 7 items carried forward

| Item | Why |
|---|---|
| Strict, nonce-based Content-Security-Policy | AdSense supports only a nonce-based CSP; it must also keep Pyodide and the C++ compiler workers working (`PHASE_6_SECURITY_REVIEW.md`). |
| Hide "Coming soon" topics (if the owner chooses option C) | Content readiness. |
| npm advisories in build tools (if the owner agrees) | From Phase 5.1. |
| Firefox, Safari and real phones; a screen reader session | Only Chromium was available here. |
| Load test with a class-sized number of students | Not possible locally. |
