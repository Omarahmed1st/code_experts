# Phase 5.1 security review

Scope: the code of Phases 1 to 5 as delivered (`CodeLab-phase5.zip`), run locally
(`wrangler dev` with a local D1 and R2). This is a code review plus tests and
browser checks on the local build. It is not a penetration test of a deployed
site, because no site is deployed yet.

Verdict: no P0 or P1 problem found. Four P2 issues were fixed (B01 to B04 in the
bug report) and one P3 hardening was added (B06). The remaining items are for
Phase 7 or need the owner's accounts.

## What was checked, and the result

### Accounts and sessions

| Area | How it works | Checked by | Result |
| --- | --- | --- | --- |
| Password storage | scrypt (N=2^15, r=8, p=3) with a random salt per password; compared in constant time. | Code review (`src/lib/auth/password.ts`), `password.test.ts` | PASS |
| Session tokens | Random tokens. Only their SHA-256 is stored, so a database copy can't be used to sign in. | Code review (`session-token.ts`, `sessions.ts`), `sign-in.test.ts` | PASS |
| Session cookie | `HttpOnly`, `SameSite=Lax`, path `/`. Outside local development it is named `__Host-…` and is `Secure`. | Browser: cookie flags read after sign-up (`journey-ab.mjs`); code review of `request-session.ts` for the production flags | PASS locally; production flags PARTIALLY VERIFIED (code only, no deployed site) |
| Session lifetime | Staff: 7 days, or 12 hours unused. Students: 30 days, or 7 days unused. Sign-out deletes the session on the server. | Code review, `students.test.ts`, browser sign-out (`journey-ab.mjs`) | PASS |
| Sign-in guessing | 5 failures per account and 30 per network address in 15 minutes, then wait. The same message for "no such email" and "wrong password". | `sign-in.test.ts`, browser (`journey-ab.mjs`) | PASS |
| Password recovery | 16-character one-time recovery code (about 80 bits), stored only as a hash. Same rate limits as sign-in. Using it signs out other devices and issues a new code. Staff can't use it. | `students.test.ts`, browser (`journey-g.mjs`: wrong code refused, old code refused after use) | PASS |
| Sign-up abuse | 20 sign-ups per network address per hour. Turnstile is built in but off until the owner adds Cloudflare keys. | `students.test.ts` | PASS; Turnstile BLOCKED (needs keys) |
| Email enumeration | Sign-in doesn't reveal whether an email exists. Sign-up does say "already has an account" (accepted, observation O4). | Code review | Accepted risk |
| Account deletion | Needs the password and the word DELETE. Removes every row of the student in every course. | `students.test.ts`, browser (`journey-g.mjs`) and a database query after deletion (no rows left) | PASS |

### Permissions and course isolation

| Area | Checked by | Result |
| --- | --- | --- |
| Admin pages answer 404 to visitors, students and staff without rights. Every page and server action resolves the signed-in person first. | `admin-guards.test.ts` (scans every admin page, route and action), browser `journey-f.mjs`: 55 pages as administrator; editor and course admin refused other courses and site pages; student refused all | PASS |
| Editors can't publish or delete. Course admins only act in their own courses. The last administrator can't be removed. | `admin-lessons`, `admin-bank`, `admin-files` tests; browser `journey-f.mjs` | PASS |
| Course isolation: one course's questions, quizzes, exams, attempt tokens, progress, bookmarks, drafts, reviews and files can't be reached through another course's addresses. | New sweep in `phase5-1.test.ts` (5 tests), existing `course-scope.test.ts`, `schema-checks.test.ts` (composite foreign keys), browser `journey-ab.mjs` (step C) | PASS |
| A student's history, reviews and export are private to them. | `students.test.ts` | PASS |

### Assessments

| Area | Checked by | Result |
| --- | --- | --- |
| Answer keys (correct options, trace answers, solutions, hidden test outputs, explanations) are never sent before marking. | `assessments.test.ts` (inspects the public data of every question) | PASS |
| Attempt tokens are HMAC-signed; changed, foreign or late tokens are refused (60 s grace after the deadline). | `assessments.test.ts`, `phase5-1.test.ts` (tokens across courses), browser `journey-i.mjs` (late submit refused with 409) | PASS |
| Final quiz: 2 starts per 24 hours per student, enforced on the server. | `assessments.test.ts`, browser `journey-de.mjs` (third start sent directly to the API refused with 429) | PASS |
| Practice marks can't be forged from the browser. | Fixed in B01; `phase5-1.test.ts` | FIXED |
| One attempt is stored once, even when submitted twice at once. | Fixed in B04; `phase5-1.test.ts` | FIXED |
| Code runs only on the student's device (Pyodide and the Clang compiler as WebAssembly in Web Workers, loaded only from this site's own folders). No public code-execution service is used. | Code review of `public/runner/*.mjs` and `code-runner.ts`; browser `journey-hj.mjs` | PASS |

### Requests and responses

| Area | Checked by | Result |
| --- | --- | --- |
| Cross-site requests: server actions are checked by vinext's Origin check; the JSON APIs and uploads check `Origin` themselves; sign-out refuses another site. | `admin-guards.test.ts`, `students.test.ts` | PASS |
| Security headers (`X-Frame-Options: DENY`, `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS) on every page. | Fixed in B02; browser sweep (every load has `X-Frame-Options: DENY`) | FIXED |
| Full Content-Security-Policy (script, style and worker sources). | Not added: needs a careful review with Pyodide and the compiler workers. | FUTURE PHASE (Phase 7) |
| Uploads: type taken from the file's bytes, not its name; macro Office files, SVG and oversized files refused; safe file names; staff-only and draft files never served publicly. | `admin-files.test.ts` | PASS |
| Request size limits on the practice API (answers and submissions). | Code review of the route | PASS |
| Markdown in lectures and questions is rendered with raw HTML escaped (markdown-it `html: false`); code highlighting escapes too; structured data escapes `<`. | `markdown.test.ts` (script and onerror payloads), code review of `render.ts` and `json-ld.tsx` | PASS |

### Secrets and configuration

| Area | Checked by | Result |
| --- | --- | --- |
| No secrets in the source or the zip. `.dev.vars` is git-ignored; only `.dev.vars.example` ships. | Search of the source for keys and passwords; zip contents checked | PASS |
| `ASSESSMENT_SECRET`: a fixed development key is used only when `APP_ENV` is `local`; anywhere else the site refuses to start an attempt without a real secret. | Code review (`env.ts`) | PASS |
| Ads: off (`ADS_ENABLED=false`). No ad code is loaded. AdSense is not implemented, as instructed. | `wrangler.jsonc`; no requests to ad hosts in the browser checks | INTENTIONALLY NOT IMPLEMENTED |

## Dependency advisories (`npm audit`, 2026-10-11)

15 advisories: 8 moderate, 7 high, 0 critical. All are in build or development tools:

- `braces` → `micromatch` → `fast-glob`: used by ESLint's Next plugin and by vinext's build plugins. These run on the developer's machine, not on the site.
- `esbuild` (development-server request issue) via `@esbuild-kit/*` → `drizzle-kit`: a development tool that generates migrations.
- `fflate` → `satori` → `@vercel/og` → `vinext`: social-image generation. The site doesn't use it (no `ImageResponse` anywhere in `src`).
- `vite-plugin-commonjs`, `vite-plugin-dynamic-import` → `vinext`: build plugins.

None of these is in the code that runs on Workers or in the student's browser. The fixes need major upgrades of the build tool chain (vinext, drizzle-kit, the ESLint plugin). That is an architectural change, so it waits for the owner's approval and should be rechecked before launch.

## Not tested (and why)

- A deployed site: TLS, the `__Host-` cookie and Secure flag, HSTS over HTTPS, Cloudflare's own protections. There is no Cloudflare account yet, and deploying needs the owner's approval.
- Turnstile: needs the owner's Cloudflare keys.
- Email-based flows: no email provider exists. Recovery uses the one-time code by design.
- Load and abuse at scale: many sign-ups or sign-ins at once from many addresses.
- Browsers other than Chromium: Firefox, Safari (WebKit) and real phones. Only Chromium is installed in the review environment.
