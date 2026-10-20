import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { CONTACT_SUBJECTS, formShownAt } from "@/server/contact";
import { getTurnstileKeys } from "@/server/platform/env";
import { pageMetadata } from "@/server/seo";
import { getSiteOwner } from "@/server/site/owner";
import { ContactForm } from "./contact-form";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Contact",
    description: `Write to ${SITE_NAME}: report a mistake in a lecture, ask about a course, or make a privacy request.`,
    path: "/contact",
  });
}

export default async function ContactPage() {
  const owner = await getSiteOwner();
  return (
    <InfoPage title="*Contact* us" description="Found a mistake, have a question, or want your data removed? Write to us here.">
      <p>
        Messages go to the people who run {SITE_NAME} and are read in the admin area. The site sends no email, so the answer comes from a
        person&apos;s own email address.
        {owner.contactEmail ? (
          <>
            {" "}
            You can also write directly to <a href={`mailto:${owner.contactEmail}`}>{owner.contactEmail}</a>.
          </>
        ) : null}
      </p>
      <div className="not-prose rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--cl-shadow)] sm:p-6">
        <ContactForm subjects={CONTACT_SUBJECTS} shownAt={formShownAt()} turnstileSiteKey={getTurnstileKeys()?.siteKey ?? null} />
      </div>
      <p className="text-sm text-muted">
        We keep your name, email and message until we delete them, and use them only to answer you. See the{" "}
        <Link href="/privacy-policy">privacy policy</Link>. To delete your student account yourself, use{" "}
        <Link href="/settings">Account settings</Link>.
      </p>
    </InfoPage>
  );
}
