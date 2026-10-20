# Phase 6: ad placement plan

Status today: **no ad can load anywhere.** Every position below exists in the code, but stays an empty hidden marker until the owner turns on all the switches listed at the end. This plan describes where ads would go once they do.

The order of priorities (from the Phase 6 brief) decides every choice here: Google's policies first, then readable lectures, then no accidental clicks, then phones, then revenue, then speed.

## How a position becomes an ad

Each page that may carry ads asks the server once for its ads (`pageAds` in `src/server/ads/settings.ts`) and renders an `<AdSlot>` at each fixed position. The decision is made by pure, unit-tested code (`decidePageAds` in `src/lib/ads/policy.ts`):

1. If the path is on the never-list (below) or matches one of the admin's exclusions, the page gets **nothing at all**, not even a marker.
2. The page says which positions it can really offer (for example, a short lecture may have no safe in-text break).
3. Positions are taken in order until the page's cap is reached.
4. A position is **live** only when ads are live site-wide **and** its placement is switched on **and** it has a digits-only AdSense ad unit id. Otherwise it is a **marker**: a hidden element with no height and no margin, so the page looks exactly as it did before Phase 6.

A live unit is an `<aside aria-label="Advertisement">` with the visible label "Advertisement", reserved space (`min-height` from the placement, 50 to 1000 px), and Google's `<ins class="adsbygoogle">` inside. If Google returns no ad (`data-ad-status="unfilled"`), the whole unit, label and space included, is removed.

## Every position that exists

| Page template | Position key | Where exactly | Cap per page |
|---|---|---|---|
| Home | `home.after_courses` | Below the Courses section, above "How Code_Expert works". Never in the first screen, which holds the code box. | 2 |
| Home | `home.after_how_it_works` | After "How Code_Expert works", above the footer. | (same cap) |
| Course page | `course.after_outline` | Below the whole course outline, above the footer. Only on a course that has at least one lecture. | 1 |
| Lecture | `lesson.after_first_section` | Between two lecture sections, after at least ~150 words of reading. Only where the section before ends in text (no code box, Run button, output or picture) and the next section starts with text. | 3 |
| Lecture | `lesson.mid_content` | A second break with the same rules, at least 3 sections and ~300 words after the first, never in the last two sections. | (same cap) |
| Lecture | `lesson.end` | After the previous/next links and related lectures, with a wide gap (`mt-20`), so it never sits next to "Mark as done" or navigation. | (same cap) |
| Single question | `exercise.below_question` | Below the whole question, its explanation and the links back, with a wide gap (`mt-20`) from Check, the options and the code box. Never on demo questions. Marked "cautious" in the admin. | 1 |
| File page | `resource.below_description` | After the description and preview, away from the download button. Only when the description is at least 80 characters. | 1 |

The caps are this site's own ceiling for readable pages, not a Google number. The admin can lower a cap (down to 0) but never raise it (`HARD_SLOT_CAP`, clamped in `parseAdsSettings`).

The lecture breaks are computed per lecture by `lessonAdBreaks` from the real sections. On the seeded lecture used in browser check L (`variables-named-boxes-in-memory`), the page offered 2 positions: one in-text break and the end slot.

## Pages that never show ads

Fixed in code (`NEVER_AD_PATHS`), checked against the path as a second line of defence even if a page template were changed by mistake:

`/admin/**`, `/api/**`, `/login`, `/register`, `/forgot-password`, `/dashboard/**`, `/settings/**`, `/account-deleted`, `/courses/*/quizzes/*` (quiz runner), `/courses/*/exams/*` (exam runner), `/courses/*/build-exam/**`, `/courses/*/practice/**`, `/courses/*/search/**`, `/search/**`, `/contact`, `/privacy-policy`, `/terms`, `/cookie-policy`, `/privacy-choices`, `/advertising`.

Also no ads (these pages render no `<AdSlot>` at all): course lists, topic pages, the question library, quiz and exam lists, error and not-found pages, empty pages, demo questions, and file pages without a real description.

Why: an ad next to a timer, an answer, a Run/Check/Next button or a form invites accidental clicks (Google's ad placement policy), and screens without real content, or "dead-end" screens such as errors, are not allowed to carry ads (Google Publisher Policies, inventory value). Sources and status: `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md` rows 2.5 and 2.6.

## What the owner can change in the admin (`/admin/ads`)

- The two site-wide switches the admin owns: "Switch ads on" and the publisher id (validated: `pub-` plus 16 digits; the `ca-pub-…` form is accepted and normalised).
- "Never show live ads to signed-in staff" (on by default, so staff can't click their own ads by accident).
- "Most ads on one page" for each template (0 up to the cap above).
- Placements: create one for any free position, set the ad unit id (digits only), format, devices (all / desktop / phone), reserved height, a note, and switch it on or off; delete it. A placement can't be switched on without an ad unit id (checked in the form, the server action and a database CHECK).
- Exclusions: a path pattern (letters, digits, `- _ . /` and `*` only; `*` is one path segment, `**` any number), a whole course, or a whole page type. Each has a reason.
- A preview link per template: opens a real page with `?ad-preview=1`, which turns the markers into labelled grey boxes. No ad is requested. In production only signed-in staff see the boxes; on local and preview builds anyone can.

There is **no field for raw HTML or JavaScript** anywhere. The only things an administrator types that reach the page are the publisher id and ad unit ids, and both are validated to digits.

Every change (settings, consent, placements, exclusions) is written to the audit log with before and after values, and the last 20 appear at the bottom of the Advertising page.

## Before any live ad can load (all must be true)

1. `APP_ENV` is `production` (local and preview builds never load live ads).
2. `ADS_ENABLED` is `"true"` in the deployment settings (`wrangler.jsonc`). Only the owner changes it.
3. "Switch ads on" is on in `/admin/ads`.
4. A valid publisher id is saved.
5. A consent platform is chosen: Google's Privacy & messaging, or another Google-certified CMP whose script address is set as `CMP_SCRIPT_URL` in the deployment settings.
6. For each position: a placement exists, is switched on, has an ad unit id, the page isn't excluded, and the position is within the page's cap.

The Advertising page shows items 1 to 5 as a checklist. The owner should also keep **Auto ads switched off** in the AdSense account: Auto ads choose their own positions and could put an ad next to a Run button, an answer or a timer.

## How it was tested

- Unit tests (`tests/unit/phase6-ads.test.ts`): positions, caps, the never-list (22 paths), glob matching (including a hostile pattern that must finish in under 500 ms), readiness combinations, `decidePageAds`, `lessonAdBreaks`, word counting.
- Integration tests (`tests/integration/phase6.test.ts`): a local build never shows live ads even with every admin setting on; quiz, exam and account pages get nothing; each exclusion kind applies.
- Browser check K (local build): no request to any ad host on 24 page loads; markers have zero height; the preview shows labelled boxes that never follow a code box, Run button or picture; no box on the quizzes page; home preview has at most 2 boxes and none in the first screen.
- Browser check L (production mode, Google's ad script replaced by a stand-in inside the browser, so Google is never contacted): live units are labelled "Advertisement" with the right client and unit; an unfilled unit folds away; in-text ads never follow a code box; a C++ lecture program still compiles and runs on the page; quiz, sign-in, exam, legal, contact and search pages load no ad script; a signed-in administrator gets no ad script; layout shift while stand-in ads load was 0.0023.

What these checks can't show: how real Google ads look, how often they fill, or what they earn. That is only visible on the live site in the AdSense account.
