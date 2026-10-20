# Phase 5.1 deployment readiness

Short answer: the code is ready for a small closed beta (one class) once the
owner has done the Cloudflare steps below. It is not ready for a public launch
yet. That needs Phase 6 (privacy, consent, legal pages) and Phase 7 (production
review, caching, monitoring). Nothing was deployed and no Cloudflare resource
was created or changed in this phase.

## State of the code

| Item | State |
| --- | --- |
| Open P0 or P1 bugs | None |
| Bugs found in this audit | 11, all fixed with a test or browser check (see `PHASE_5_1_BUG_REPORT.md`) |
| Automated checks on the final code | Content checks, typecheck, lint, all tests, build and vinext check pass (numbers in `PHASE_5_1_TEST_REPORT.md`) |
| Browser journeys A to J | Pass on the local build (Chromium only) |
| Migrations | 0001 to 0006. 0006 is new and additive (a `self_check` column, NULL-id triggers, and moving earlier write-the-code marks). No applied migration was edited. |
| Secrets in the source | None (`.dev.vars` is git-ignored; production values are set with `wrangler secret put`) |
| Ads | Off. AdSense not implemented (Phase 6 and 8). |

## What the owner must do before any deployment

Each step needs the owner's Cloudflare account or a decision. None was done here.

1. **Cloudflare account and Workers plan.** CPU time per request was measured in Phase 1 (see `TESTING_REPORT.md`). Check the plan's limits on Cloudflare's current pricing page before choosing.
2. **Create the D1 database and the R2 bucket** (`wrangler d1 create codelab`, `wrangler r2 bucket create codelab-files`). Put the real `database_id` that Cloudflare returns into `wrangler.jsonc`. It must not be invented.
3. **Secrets:**
   - `wrangler secret put ASSESSMENT_SECRET` (32+ random characters). Without it, quizzes and exams refuse to start outside local development. This was checked in production mode: "Quizzes are not available right now", HTTP 503.
   - Turnstile: put the site key in `TURNSTILE_SITE_KEY` (a var) and run `wrangler secret put TURNSTILE_SECRET_KEY`.
4. **Variables:** `APP_ENV=production` and `PUBLIC_SITE_URL=https://<the real domain>`. In production mode (checked locally on port 8788):
   - the session cookie becomes `__Host-ce_session` and `Secure`;
   - robots.txt allows crawling except the admin, API and personal pages;
   - the sitemap lists 197 public pages and no private ones.
5. **Apply migrations to the remote database:** `wrangler d1 migrations apply DB --remote`. This is the first time, so the database is empty and no data is at risk.
6. **Load the content:** the seed SQL files with `--remote`, and the lesson images to R2. `tools/seed-r2.ts` writes only to local R2 today, so the remote upload needs a small change or a manual upload. Uploading to remote R2 needs the owner's permission.
7. **First administrator:** `npm run admin:create -- --remote`, run on the owner's own computer.
8. **Domain and HTTPS:** attach the domain to the Worker. HSTS (`max-age=31536000`) is already sent, so only turn HTTPS on once the domain is final.
9. **Deploy:** `npm run deploy`, only with the owner's explicit approval.

## Decisions that need the owner

| Decision | Options | Recommendation |
| --- | --- | --- |
| Sign-up limit per network address: 20 per hour today | Keep 20. Raise it (for example to 200). Raise it only after Turnstile is on. | Raise it before a class signs up together. A school lab or a mobile network can put many students behind one address, and the 21st student in that hour would be refused. Turnstile is the better guard against bots. |
| Dependency advisories (15, build and development tools only) | Leave them until Phase 7. Upgrade vinext, drizzle-kit and the ESLint plugin now. | Leave them until Phase 7 and recheck then. Nothing on the live site is affected, and upgrading the build tool chain is a bigger change. |
| Full Content-Security-Policy | Phase 7, or now | Phase 7. It must be tested with Pyodide and the compiler workers. |

## Not tested here (needs devices or accounts)

- Firefox, Safari (WebKit), and real Android and iPhone devices. Only Chromium was available.
- The deployed site: TLS, real cookies over HTTPS, Cloudflare caching and limits.
- Turnstile, which needs keys.
- Many students at once (load).
- Screen readers (NVDA, VoiceOver). The axe-core scan and keyboard checks pass, but they don't replace a real screen-reader session.

## Phase 6 readiness checklist

Phase 6 in the brief is "Monetization preparation". The code side of Phase 6 can start now: there is no open P0 or P1 bug, and every Phase 1 to 5 journey passes. Before or during Phase 6:

| Item | State now | Needs |
| --- | --- | --- |
| Ad placement system | Tables `ad_placements` and `ad_exclusions` exist (0001); no components or admin screens | Build it in Phase 6, switched off |
| Consent architecture | Table `consent_configuration` exists (0001); no banner or consent logic | Build it in Phase 6. The owner chooses the consent approach for their visitors' regions. |
| Privacy configuration and legal pages | Only the truthful sign-up text (B03). No privacy policy, terms or contact page. | The owner's legal name, contact details and policies. Claude can't invent these. |
| `ads.txt` | Not present | The real AdSense publisher ID, only after approval (Phase 8). Never a made-up one. |
| Google Search Console | Not set up | The owner's Google account and domain verification |
| Content quality audit | 598 content checks pass (code in lectures and questions runs and matches). Python and Computer Vision have 2 lectures each. | More lectures before an AdSense review. Thin courses are a known reason for refusal (check Google's current policies). |
| AdSense readiness validation | Not started | Phase 6, after the items above |
| Production deployment | Not done | Phase 7, with the owner's approval |
