# Phase 6 security review

Scope: what Phase 6 added (advertising, consent, site details, legal pages, the contact form and its inbox, `/ads.txt`, the privacy choices page) on top of the Phase 5.1 code, run locally (`wrangler dev` with a local D1 and R2, also in production mode with stand-in Google scripts). It is a code review plus automated tests and browser checks, not a penetration test of a deployed site; nothing is deployed.

Verdict: no P0 or P1 problem found. No new npm dependency was added (`package.json` and `package-lock.json` are unchanged from Phase 5.1), so the dependency picture is the same as in `PHASE_5_1_SECURITY_REVIEW.md`. The strict Content-Security-Policy remains a Phase 7 item, now with an extra requirement for AdSense (below).

## New attack surface, and how each part is protected

### Who can change what

| Area | How it works | Checked by | Result |
|---|---|---|---|
| Advertising, consent, site details and the contact inbox are administrator-only | Each page calls `requireSite("manageAds" / "manageSite" / "readMessages")`; each server action calls `staffActor` with the same action; `canSite` allows only site administrators. Everyone else gets a 404. | `admin-guards.test.ts` (scans every admin page and action), integration test "editors and course admins are refused and nothing is written", browser journey F (an editor and a course admin are refused `/admin/ads`, `/admin/ads/placements/new`, `/admin/site`, `/admin/messages`), journey K4 (a student is refused; a visitor is sent to sign in) | PASS |
| Every change is audited | Settings, consent, placements (create, enable, disable, delete), exclusions and site details are written to the audit log with before and after values, in the same database batch as the change. Inbox actions are audited **without** the message text. | `tests/integration/phase6.test.ts` | PASS |

### No way to inject a script

| Area | How it works | Checked by | Result |
|---|---|---|---|
| No raw HTML or JavaScript field | The admin has no "ad code" or "custom script" box. The only ad values an administrator types are the publisher id and ad unit ids. | Code review of every Phase 6 form | PASS |
| Publisher id | Must be `pub-` plus 16 digits (the `ca-pub-` form is normalised). Anything else is refused and never stored. | Unit tests; integration test; browser K3 | PASS |
| Ad unit ids | Digits only, 6 to 20, checked in the form, the server action **and** a database CHECK (`migrations/0007`). A placement can't be switched on without one (also a CHECK). | Unit, integration and migration tests; browser K3 | PASS |
| Placement positions | Picked from a fixed list in code (`AD_POSITIONS`); unknown keys are refused. | Unit and integration tests | PASS |
| Consent platform script | Chosen from a fixed list. A third-party CMP's script address can only come from the deployment variable `CMP_SCRIPT_URL` (https only, no credentials, no quotes or spaces), never from a form. | Unit tests (`validScriptUrl`), integration test "the script address can't be set from the admin" | PASS |
| AdSense script | Built from a constant Google origin plus the validated publisher id. | Code review (`ad-loader.ts`) | PASS |
| Search Console token | Letters, digits, `-` and `_`, 10 to 100 characters; rendered by the framework's metadata API (escaped). | Unit tests | PASS |
| Exclusion path patterns | Letters, digits, `- _ . / *` only, must start with `/`, no `//`, at most 200 characters. Matching builds no regular expression from the pattern, and uses a memoised matcher, so a pattern can't slow the site down. | Unit tests, including a hostile `*a*a*a…` pattern that must finish in under 500 ms | PASS |
| Legal pages | The owner's details are rendered as text by React (escaped). | Code review | PASS |

### The public contact form

| Area | How it works | Checked by | Result |
|---|---|---|---|
| Spam | Hidden honeypot field, at least 3 seconds on the page, Turnstile when keys are set, 5 messages per network per hour. Bots get the same "sent" reply and nothing is stored, so they learn nothing. | Integration tests ("bots get a quiet ok", "5 per network per hour"); browser K3 (honeypot message not stored) | PASS; Turnstile BLOCKED until the owner adds Cloudflare keys (as in Phase 5.1) |
| Field sizes | Each field is trimmed and cut to a fixed maximum before validation. | Integration test "checks the fields" | PASS |
| Stored IP addresses | Only in the rate-limit table, removed after a day (same mechanism as sign-in). | Code review | PASS |
| Email sending | None. Messages are only stored for the inbox, so the form can't be used to send email to others. | Code review | PASS |

### What the browser loads

| Area | How it works | Checked by | Result |
|---|---|---|---|
| Ads off means no third-party request | With ads off nothing is requested from any ad or consent host. | Browser K1 (24 page loads), journey "extra" (no third-party requests at all) | PASS |
| Staff don't get live ads | "Never show live ads to signed-in staff" is on by default; staff can't click their own ads by accident. | Browser L3 | PASS |
| Consent fails closed | With a third-party CMP the ad script waits for a TCF decision and gives up after 10 s. | Unit tests; browser L6 | PASS |
| `?ad-preview=1` | In production only signed-in staff see preview boxes; no ad is requested in preview. | Unit tests; browser K2 | PASS |
| Ad errors can't break a page | Each live unit sits in an error boundary; a failed `push` hides the unit. | Code review; browser L1 (no console errors) | PASS |
| `/privacy-choices` | Loads nothing until the button is pressed; "Clear this site's data" removes only this site's keys. | Browser K5 and L5 | PASS |

## Content-Security-Policy and AdSense (Phase 7)

Today the site sends `Content-Security-Policy: frame-ancestors 'none'` (anti-framing only, from Phase 5.1) and no `script-src`, so it doesn't block AdSense, and no existing header was weakened in this phase.

Google's AdSense help page on CSP (read via search summary, see the compliance audit, row 6.1) says AdSense supports only a **strict, nonce-based** policy (`script-src 'nonce-…' 'strict-dynamic'; object-src 'none'; base-uri 'none'`), because its domains change. An allow-list of Google hosts would break ads. So the Phase 7 CSP work must:

1. generate a nonce per response and put it on the site's own scripts (the theme script, the framework's scripts, JSON-LD) and on the AdSense and CMP script tags;
2. keep the Pyodide and C++ compiler workers working (`worker-src`, `wasm-unsafe-eval`);
3. be tested in production mode with the stand-in checks (journey L) and then on the live site.

`Permissions-Policy` today disables camera, microphone, geolocation, payment and USB. Ads don't need those, but if Google's ads ever rely on a feature disabled there, it should be revisited when real ads run (watch the browser console on the live site).

## Secrets and configuration

| Area | Checked by | Result |
|---|---|---|
| No secrets or real ids in the source or the ZIP. No AdSense publisher id or ad unit id is included. The browser checks use `pub-1234567890123456`, a value of the right shape written into the local test database only, and removed again at the end of each run (L9). | Search of the source; ZIP contents checked | PASS |
| `ADS_ENABLED` is `"false"` in `wrangler.jsonc`. Live ads also need `APP_ENV=production`, the admin switch, a publisher id and a consent platform. | `wrangler.jsonc`; integration test "a local build never shows live ads even with every admin setting on" | PASS |
| `ASSESSMENT_SECRET` must be set as a secret before production (unchanged from Phase 5.1). | Code review | BLOCKED — OWNER ACTION REQUIRED |

## Not tested (and why)

- A deployed site with real Google scripts: TLS, the `__Host-` cookie over HTTPS, real AdSense and consent behaviour. Nothing is deployed and the owner has not authorised real ad requests.
- Real Turnstile on the contact form: no Cloudflare keys yet.
- Firefox, Safari and real phones: only Chromium was available here.
