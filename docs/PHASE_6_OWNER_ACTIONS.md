# Phase 6: what only the owner can do

Ads are off and stay off until you do the steps below. Nothing here has been done for you: no AdSense account was created or used, nothing was submitted to Google, and nothing was deployed. No step promises approval or income; Google decides approval on its own review.

Steps are in the order they're usually done. "Where" says where you do it.

## A. Decisions to make first

| # | Decision | Recommendation | Where |
|---|---|---|---|
| A1 | ~~What to do about the thin Python and Computer Vision courses.~~ **Decided 2026-10-15: more lectures.** 14 Python and 17 CV lectures were written from the slides you uploaded. Now: read them and say what to change. | Read a few on the local site first, especially the OpenCV and graphics ones (their output is recorded, not run in the browser). | Tell Claude in the project |
| A1b | ~~Practice for the new lectures.~~ **Decided 2026-10-15: write them now.** 124 questions and 17 topic quizzes were written by hand from the lectures (48 Python, 76 CV). Now: try some and say what to change. If you change a lecture, its questions may need changing too. | Try one quiz per topic on the local site. | Tell Claude |
| A2 | Whether to hide the 12 topics that have no lecture yet ("Coming soon") from course pages, or upload slides for them. Not built; it changes what students see. | Upload the slides if you have them; otherwise hide them before applying. | Tell Claude |
| A3 | The content licence for the lectures (can others copy them? with credit? not at all?). The terms page has a marked gap for it. | Your choice; a common one for free teaching material is CC BY-NC 4.0. | Tell Claude, then it goes in the terms |
| A4 | Still open from Phase 5.1: raise the sign-up limit from 20 to about 200 per network per hour (a whole class may share one network). | Yes. | Tell Claude |
| A5 | Still open from Phase 5.1: leave the 15 build-tool-only npm advisories until Phase 7. | Yes. | Tell Claude |

## B. Legal and site details

| # | Step | Where |
|---|---|---|
| B1 | Fill in the operator's name (you or your organisation), a contact email you read, the country, and the effective date. Until then the legal pages show yellow "[to be added by the site owner: …]" gaps and a "Draft" notice. | `/admin/site` |
| B2 | Have a lawyer review the privacy policy, terms and cookie policy, especially Egypt's Personal Data Protection Law (No. 151 of 2020) and its executive regulations, and the questions in `PHASE_6_PRIVACY_AND_CONSENT.md` ("Open legal questions"). Then tick "The privacy policy, terms and cookie policy have been reviewed". | Lawyer, then `/admin/site` |
| B3 | Confirm that the lecture material is yours to publish: C++ weeks 1 to 4, Python (ECE3112) weeks 1 to 3, Computer Vision (ECE4704) weeks 1 to 3. The slides' photos were not used; drawn pictures replace them. | Yourself |

## C. Deploy (needs your explicit go-ahead)

| # | Step | Where |
|---|---|---|
| C1 | Create the Cloudflare account and resources (D1 database, R2 bucket), set `ASSESSMENT_SECRET` as a secret, add Turnstile keys, deploy, and point a domain at it. Claude can do this with you once you say go; see `PHASE_6_DEPLOYMENT_READINESS.md`. | Cloudflare, with Claude |
| C2 | Create your administrator account on the live site (`npm run admin:create -- --remote`). | Your computer |

AdSense reviews a live site on your own domain, so C must come before D.

## D. AdSense account

| # | Step | Where |
|---|---|---|
| D1 | You must be at least 18 to have an AdSense account (under 18: a parent or guardian applies). | Yourself |
| D2 | Create (or use) your AdSense account and add the site's domain under Sites. Google's own help pages: [Eligibility](https://support.google.com/adsense/answer/9724), [Connect your site](https://support.google.com/adsense/answer/7584263). | adsense.google.com |
| D3 | Copy your publisher id (Account → Settings → Account information; it looks like `pub-` and 16 digits) and paste it into "AdSense publisher id". Leave "Switch ads on" **off** for now. | `/admin/ads` |
| D4 | Verify the site with AdSense: tick "Add the AdSense site-ownership meta tag to the home page" (this adds only a meta tag, no ad code). `/ads.txt` starts working at the same moment, with your id. | `/admin/site` |
| D5 | Request review in AdSense. | AdSense → Sites |
| D6 | Keep **Auto ads switched off**. This site places ads only in its own fixed positions; Auto ads could put an ad next to a Run button, an answer or a timer. | AdSense → Ads → By site |
| D7 | Never click your own ads, even to test them (Google counts that as invalid traffic). Staff are hidden from live ads by default, but you can still see ads while signed out. | Always |

## E. Consent (before any ad can show)

| # | Step | Where |
|---|---|---|
| E1 | Choose a consent platform. Simplest: Google's own **Privacy & messaging**. Create and publish the **European regulations** message (covers the EEA, the UK and Switzerland). Consider the **US state regulations** message if you have US visitors (ask your lawyer). | AdSense → Privacy & messaging |
| E2 | Choose the same platform on the site: "Google Privacy & messaging (set up in AdSense)". If you use another Google-certified CMP instead, its script address goes in `CMP_SCRIPT_URL` in `wrangler.jsonc` (not in the admin), and check with that CMP that it supports re-opening its window with `__tcfapi("displayConsentUi")`. | `/admin/ads` |

## F. Turn ads on (only after approval and consent are in place)

| # | Step | Where |
|---|---|---|
| F1 | In AdSense, create a **display ad unit** for each position you want, and copy its **ad unit id** (the `data-ad-slot` number, digits only). | AdSense → Ads → By ad unit |
| F2 | Create a placement for each position, paste its ad unit id, and switch it on. Use the preview links to look at the positions first. Start small (for example one lecture position). | `/admin/ads` |
| F3 | Set `ADS_ENABLED` to `"true"` in `wrangler.jsonc` and deploy. | `wrangler.jsonc`, deploy |
| F4 | Switch "Switch ads on" on. The checklist at the top of `/admin/ads` must show every item done. | `/admin/ads` |
| F5 | Signed out, in a private window, open a lecture and check the ad is labelled "Advertisement" and sits where the plan says. Don't click it. Check `https://<your domain>/ads.txt` shows your line. | Browser |

To switch everything off again at any time: turn "Switch ads on" off in `/admin/ads` (instant), or set `ADS_ENABLED` back to `"false"` and deploy.

## G. Search (optional, not an AdSense requirement)

| # | Step | Where |
|---|---|---|
| G1 | Add the site to Google Search Console. If you choose the HTML-tag method, paste the token. | search.google.com/search-console, then `/admin/site` |
| G2 | Submit `https://<your domain>/sitemap.xml`. | Search Console |

## Before you open any of these Google pages

The Google help pages linked in the reports were read through search summaries only, because this environment can't open `support.google.com`. Open each page once and check the wording is still the same; Google changes them without notice. The AdSense menu names above (for example Account → Settings) are how the menus were named when this was written; they may be worded slightly differently in your account.
