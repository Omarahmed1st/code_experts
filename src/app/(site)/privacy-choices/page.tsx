import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/info-page";
import { adClientForConsent } from "@/server/ads/settings";
import { pageMetadata } from "@/server/seo";
import { ClearDeviceData, ConsentButton } from "./choices-panel";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Privacy choices",
    description: "Change your advertising consent and clear what this site stored on your device.",
    path: "/privacy-choices",
    index: false,
  });
}

export default async function PrivacyChoicesPage() {
  const client = await adClientForConsent().catch(() => null);
  return (
    <InfoPage title="Privacy *choices*" description="Change your advertising consent, or clear what this site stored on your device.">
      <h2>Advertising</h2>
      {client ? (
        <>
          <p>
            Ads on this site are served by Google AdSense. Visitors in the EEA, the UK and Switzerland are asked first whether ads may use
            cookies and personal data. You can change or withdraw that answer at any time; the lectures and practice work the same either way.
          </p>
          <ConsentButton client={client} />
          <p>
            You can also turn off personalised ads from Google everywhere in{" "}
            <a href="https://adssettings.google.com" rel="noopener">
              Google&apos;s Ads Settings
            </a>
            .
          </p>
        </>
      ) : (
        <p>
          The site shows no ads today, so no ad code and no consent tool load, and there is nothing to choose. If ads are switched on later,
          this page will let you change your consent at any time.
        </p>
      )}

      <h2>Stored on this device</h2>
      <p>
        Your theme, practice progress and unfinished quiz answers are kept in this browser so the site works as you expect. Clearing them
        doesn&apos;t touch your account: what you saved while signed in stays in your account.
      </p>
      <ClearDeviceData />

      <h2>Your account</h2>
      <p>
        Download or delete your account data in <Link href="/settings">Account settings</Link>. Everything else is in the{" "}
        <Link href="/privacy-policy">privacy policy</Link> and the <Link href="/cookie-policy">cookie policy</Link>.
      </p>
    </InfoPage>
  );
}
