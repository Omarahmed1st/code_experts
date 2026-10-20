# Phase 6: SEO report

Everything here is a **Google Search recommendation, not an AdSense rule.** AdSense approval depends on the AdSense policies in `PHASE_6_ADSENSE_COMPLIANCE_AUDIT.md`; good search setup helps people find the site but doesn't decide approval. Nothing below promises rankings or traffic.

## What already existed (Phase 2 to 5.1) and still works

- Every public page sets a title, a description, a canonical URL, Open Graph and a Twitter card through one helper (`pageMetadata` in `src/server/seo.ts`).
- Indexing is allowed **only in production** (`indexable()`): local and preview builds send `noindex` and a robots.txt that blocks everything, and the sitemap is empty there (re-checked in this phase by journey "extra": "Outside production, robots.txt blocks all crawling", "the sitemap is empty").
- Structured data (JSON-LD) describes only what is on the page: `WebSite` on the home page, `Course` on course pages, `LearningResource` on lecture pages, and `BreadcrumbList` where there are breadcrumbs. `<` is escaped so content can't break out of the script tag.
- Lectures are server-rendered HTML: the text is in the page before any JavaScript runs.
- Private pages (`/admin`, `/api/`, `/dashboard`, `/settings`, `/login`, `/register`, `/forgot-password`) are disallowed in robots.txt and carry `noindex`.

## What Phase 6 added

| Change | Where | Checked by |
|---|---|---|
| New public pages in the sitemap: `/contact`, `/privacy-policy`, `/terms`, `/cookie-policy`, `/advertising` | `src/app/sitemap.ts` | Browser check L7 (production mode): "sitemap lists the legal and contact pages, not privacy choices" |
| Each new page has its own title, description and canonical URL through `pageMetadata` | the page files | Code review; sweep loaded each page with HTTP 200 |
| `/privacy-choices` is `noindex, follow` and stays crawlable, so the tag is seen (robots.txt only controls crawling, not indexing) | `privacy-choices/page.tsx` | Browser check K5 ("privacy choices is noindex") |
| Optional Google Search Console verification tag (`<meta name="google-site-verification">`), entered by the owner at `/admin/site`; only on the home page | `src/lib/site/verification.ts`, `src/app/(site)/page.tsx` | Unit tests; browser check L7 |
| Optional AdSense site-ownership tag (`<meta name="google-adsense-account" content="ca-pub-…">`), a checkbox at `/admin/site`, needs the publisher id; loads no ad code | same | Unit tests; browser check L7 |
| `/ads.txt` (only with a real publisher id) | `src/app/ads.txt/route.ts` | Unit and integration tests; browser check K3 |
| Footer links to every legal page and Contact on every public page (internal links help crawling) | `site-footer.tsx` | Unit test "footer links point to existing pages"; browser check K5 |
| robots.txt still keeps admin, API and personal pages out in production | `src/app/robots.ts` (unchanged) | Browser check L7 |

The verification token is validated (letters, digits, `-` and `_`, 10 to 100 characters) so it can't carry markup.

## Not done, and why

- **Organization structured data** (name, logo, contact): it would need the owner's real name and logo address. Adding invented values is against the brief. Can be added once the owner's details are in `/admin/site`.
- **No new "SEO pages" or filler text.** The brief forbids meaningless filler. The way to more search visibility is more real lectures (see `PHASE_6_CONTENT_READINESS.md`).
- **Real search data** (impressions, indexing status, Core Web Vitals field data) only exists after deployment, in Search Console.

## Core Web Vitals

Google's "good" thresholds are LCP ≤ 2.5 s, INP ≤ 200 ms and CLS ≤ 0.1 at the 75th percentile of real visits. Only local lab numbers were measured here (`PHASE_6_TEST_REPORT.md`, performance section): Phase 6 adds no measurable delay on the pages measured, and layout shift stayed below 0.03 with or without ads. These are not field data and don't predict what visitors on real networks will see.

## Owner steps after deployment

1. Add the site to Google Search Console (domain or URL-prefix property). If using the HTML-tag method, paste the token at `/admin/site`.
2. Submit `https://<your domain>/sitemap.xml` in Search Console.
3. Check the Page indexing and Core Web Vitals reports after Google has crawled the site.
