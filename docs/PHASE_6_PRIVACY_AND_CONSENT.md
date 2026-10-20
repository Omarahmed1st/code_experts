# Phase 6: privacy and consent

This report describes what the site stores, what changes when ads are switched on, how consent works, and what only the owner (and a lawyer) can settle. It is not legal advice. The legal pages written in this phase are **drafts** and say so on the page until the owner fills in their details and has the texts reviewed.

## Today (ads off)

No advertising or analytics code runs. Browser check K recorded no request to any ad host on 24 page loads, and the Phase 5.1 check "no third-party requests" (journey extra, re-run) still passes: fonts, the Python runtime and the C++ compiler are all served from the site itself.

## What the site stores (data inventory)

Checked against the code, not written from memory. The privacy policy (`/privacy-policy`) and cookie policy (`/cookie-policy`) show the same lists, and a unit test (`tests/unit/phase6-site.test.ts`, "legal pages match the code") fails if a new browser-storage key appears in the code without being listed.

On the server (Cloudflare D1):

| What | When | Why | How long |
|---|---|---|---|
| Name, email, password hash, recovery-code hash | Student creates an account | Sign-in and recovery | Until the account is deleted |
| Progress: lectures done, answers, quiz/exam attempts and results, code drafts, bookmarks, achievements | Signed-in use | Progress, history, dashboard, attempt limits | Until the account is deleted |
| Each signed-in device: time, IP address, browser name | Sign-in | Device list and sign-out, account safety | Until signed out or the sign-in expires (30 days at most for students) |
| IP address of sign-ups, failed sign-ins, recovery attempts and contact messages | Those forms | Rate limits against abuse | Removed once more than a day old, the next time one of those forms is used |
| Name, email, message | Contact form | Reading and answering | Until an administrator deletes it |
| Staff audit log (with the staff member's IP) | A staff change | Accountability | Kept as the site's history |

On the visitor's device:

| Name | Kind | Purpose | Lifetime |
|---|---|---|---|
| `__Host-ce_session` (`ce_session` on a local build) | Cookie, HttpOnly | Keeps a signed-in person signed in | Until sign-out or expiry |
| `ce_model_<quiz>` | Cookie | Remembers which version of a multi-version quiz was given last | 30 days |
| `codelab-theme` | Local storage | Light or dark theme | Until cleared |
| `codelab:practice:<course>` | Local storage | Practice progress on this device | Until cleared |
| `codelab:attempt:<course>:<kind>:<slug>` | Local storage | Answers of an unfinished quiz or exam | Until submitted or cleared |

Cloudflare Turnstile may run a check on the sign-up, sign-in, recovery and contact forms (named in the cookie and privacy policies).

All of these are needed for something the visitor asked for (signing in, a theme, their own progress). None is used for advertising or tracking, which is why the site doesn't ask before setting them. Whether Egyptian law (or the law of a visitor's country) still requires a notice or consent for them is a question for a lawyer (see "Open legal questions").

## What changes when ads are on

Google AdSense, and the consent platform, load in the browser and set their own cookies or use device identifiers, and Google receives the visitor's IP address and the page address. The privacy policy's "Advertising and Google" section (`#advertising`) contains Google's required disclosures: third-party vendors including Google use cookies to serve ads based on prior visits; Google's advertising cookies let it and its partners serve ads based on visits to this and other sites; how to opt out (Google's Ads Settings and aboutads.info); and a link to "How Google uses information from sites that use its services". The cookie policy's advertising section changes wording when ads are live.

## Consent design

**No live ad without a consent platform.** The readiness checklist requires one of:

- **Google Privacy & messaging** (set up inside the AdSense account; Google-certified). The site loads Google's ad script; Google's own message asks for consent where required and the ad script waits for it.
- **Another Google-certified CMP** (IAB TCF v2). Its script address can only be set as the `CMP_SCRIPT_URL` deployment variable, never from the admin, so an admin form can't inject a script. The site loads the CMP first and loads the AdSense script only after the CMP reports a decision (`tcloaded` or `useractioncomplete`, or `gdprApplies: false`). If the CMP never answers within 10 seconds, no ad script loads and the ad boxes are removed (fails closed).

Tested: unit tests of the TCF handshake with fake windows (`phase6-site.test.ts`); browser check L in both modes with stand-in scripts (the ad script loads once, only after consent handling; a silent CMP leads to no ad script after 10 s, boxes removed).

**Changing or withdrawing consent.** `/privacy-choices` (linked in every footer as "Privacy choices") has "Change my ad privacy choices". Nothing loads on that page until the button is pressed. Then:

- Google mode: the site calls `googlefc.showRevocationMessage()` through `googlefc.callbackQueue`, Google's documented way to re-open the message. AdSense can also add its own revocation link.
- Third-party mode: the site calls `__tcfapi("displayConsentUi", 2, …)`. This command is **not part of the TCF standard**; many CMPs support it, but the owner must confirm it with their CMP and replace the call if theirs differs (`openConsentChoices` in `src/components/ads/ad-loader.ts`).

Browser check L5 confirmed both calls reach the stand-in consent tool. Whether the real message appears is only visible on the live site with the real account.

The same page has "Clear this site's data on this device", which removes only this site's keys from local storage (browser check K5: a key from another site was left alone).

**The footer link.** The admin can switch the "Privacy choices" footer link off only while ads can't load; whenever ads can load it is always shown (`showPrivacyChoices` in `site-chrome.tsx`).

**Essential features don't depend on consent.** Lectures, code runners, questions, quizzes, exams and accounts never wait for the ad loader. Browser check L1 compiled and ran a C++ lecture program on a page with live (stand-in) ads.

## Regions

| Region | What Google requires / what applies | Status |
|---|---|---|
| EEA, UK | Google-certified CMP with TCF for personalised ads (since 16 Jan 2024). | Site side done (consent design above). Owner must publish the European regulations message in AdSense → Privacy & messaging, or set up a certified CMP. |
| Switzerland | Same requirement since 31 Jul 2024. | Same as above. |
| United States | AdSense offers a "US state regulations" message and restricted data processing; Google receives Global Privacy Control signals directly for some states. | Configured in the AdSense account, not in this code. Whether it's needed depends on the audience and legal advice. Owner action. |
| Egypt | Personal Data Protection Law No. 151 of 2020; executive regulations reportedly issued by Ministerial Decree No. 816 of 2025. | The privacy policy names the law without claiming compliance. The decree's text was **not** read here (only secondary sources). A lawyer must confirm what applies (licensing, registration, cookie notices). |

Sources and dates: `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md` section 3. Those pages were read through search summaries only, because this environment blocks `support.google.com`.

## Legal pages written in this phase

`/privacy-policy`, `/terms`, `/cookie-policy`, `/advertising`, `/contact`, `/privacy-choices`, and an updated `/about`.

- No owner detail is invented. Where the operator's name, contact email, country or effective date is needed, the page shows a highlighted gap: "[to be added by the site owner: …]".
- The owner fills these in at `/admin/site`. Each page shows a "Draft …, not yet reviewed" notice until every detail is filled in **and** the owner ticks "The privacy policy, terms and cookie policy have been reviewed" (the form refuses that tick while details are missing; integration test "site details").
- The terms leave the **content licence** as a gap: who may copy the lectures and under what terms is the owner's decision.
- The terms say practice results are not official grades "unless your instructor tells you otherwise", which matches how the site works.
- `/privacy-choices` is `noindex`.

## Contact form

Fields: name, email, subject, message. Spam protection: a hidden honeypot field, a minimum of 3 seconds on the page, Turnstile (when keys are configured), and 5 messages per network per hour. A bot that fills the honeypot or sends too fast gets the same "sent" message, and nothing is stored. Messages reach `/admin/messages` (administrators only), where they can be read, archived and deleted; the audit log records those actions without the message text. Tested in `tests/integration/phase6.test.ts` and browser check K3.

## Open legal questions (owner and lawyer)

1. Does Egypt's PDPL and its executive regulations require registration, a licence, a data-protection officer, or a cookie notice for this site?
2. Is a consent banner needed for the essential cookies and storage listed above in the countries the students are in?
3. Is a US state privacy message needed in AdSense?
4. Minimum age: the privacy policy says the site is not directed at children. If any students are minors, the consent and ad settings must be reviewed (and AdSense has child-directed settings).
5. The content licence in the terms.
6. How long to keep contact messages and the staff audit log (today: until deleted, and indefinitely).
