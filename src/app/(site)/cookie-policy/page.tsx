import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, EffectiveDate, LegalTable } from "@/components/legal/legal-parts";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { pageMetadata } from "@/server/seo";
import { legalContext } from "@/server/site/legal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Cookie policy",
    description: `Every cookie and every item of browser storage ${SITE_NAME} uses, what it is for and how long it lasts.`,
    path: "/cookie-policy",
  });
}

// One row per cookie or storage key the code really sets. Names are checked
// by tests/unit/legal-pages.test.ts against the code.
export default async function CookiePolicyPage() {
  const { owner, adsLive, provider } = await legalContext();
  return (
    <InfoPage title="Cookie *policy*" description="Every cookie and every bit of browser storage this site uses, and why.">
      <DraftNotice owner={owner} page="cookie policy" />
      <EffectiveDate owner={owner} />

      <h2>Needed for the site to work</h2>
      <p>
        These are set only when you use the feature they belong to. They aren&apos;t used for advertising or to follow you to other sites,
        so the site doesn&apos;t ask before setting them.
      </p>
      <LegalTable
        label="Cookies and stored items"
        head={["Name", "Kind", "What it does", "How long"]}
        rows={[
          [
            <code key="n">__Host-ce_session</code>,
            "Cookie (only this site, not readable by page scripts)",
            "Keeps you signed in. Set when you sign in or create an account.",
            "Students: up to 30 days, or 7 days unused. Staff: up to 7 days, or 12 hours unused. Removed when you sign out.",
          ],
          [
            <code key="n">ce_model_…</code>,
            "Cookie (only the quiz's own pages)",
            "Remembers which version of a multi-version quiz you got last, so the next attempt can give you a different one.",
            "30 days",
          ],
          [
            <code key="n">codelab-theme</code>,
            "Local storage on your device",
            "Your light or dark theme choice. Not set if you keep the system setting.",
            "Until you change it back or clear your browser data",
          ],
          [
            <code key="n">codelab:practice:…</code>,
            "Local storage on your device",
            "Which practice questions you answered in a course, on this device.",
            "Until you clear it on the Privacy choices page or in your browser",
          ],
          [
            <code key="n">codelab:attempt:…</code>,
            "Local storage on your device",
            "The answers of a quiz or exam you haven't finished yet, so a reload doesn't lose them.",
            "Removed when you finish the attempt",
          ],
        ]}
      />
      <p>
        On the sign-up, sign-in, account recovery and contact forms, Cloudflare Turnstile may run a check in your browser to tell people from
        programs. It is provided by Cloudflare under{" "}
        <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">
          its own privacy policy
        </a>
        .
      </p>

      <h2>Advertising cookies</h2>
      {adsLive ? (
        <p>
          The site shows ads from Google AdSense. Google and its partners may set or read cookies and similar identifiers to show and measure
          ads and, where allowed, to personalise them.{" "}
          {provider === "google_privacy_messaging"
            ? "In the EEA, the UK and Switzerland, Google's consent message asks you first; it stores your answer in a cookie of its own."
            : "In the EEA, the UK and Switzerland, a Google-certified consent tool asks you first and stores your answer."}{" "}
          Google lists its cookies in{" "}
          <a href="https://policies.google.com/technologies/cookies" rel="noopener">
            How Google uses cookies
          </a>
          .
        </p>
      ) : (
        <p>
          None today. Ads are switched off, so no Google ad code and no consent tool load, and no advertising cookie is set. If ads are switched
          on later, this section will list them and you will be asked first where the law requires it.
        </p>
      )}

      <h2>Your choices</h2>
      <ul>
        <li>
          The <Link href="/privacy-choices">Privacy choices</Link> page lets you {adsLive ? "change your advertising choices and " : ""}clear
          what this site stored on your device.
        </li>
        <li>
          Your browser can block or delete cookies and site data. If you block the sign-in cookie you can still read and practise, but you
          can&apos;t stay signed in.
        </li>
      </ul>
      <p>
        More about what we keep on our side is in the <Link href="/privacy-policy">privacy policy</Link>.
      </p>
    </InfoPage>
  );
}
