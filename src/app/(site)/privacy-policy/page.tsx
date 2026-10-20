import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, EffectiveDate, Fact, LegalTable } from "@/components/legal/legal-parts";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { pageMetadata } from "@/server/seo";
import { legalContext } from "@/server/site/legal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Privacy policy",
    description: `What ${SITE_NAME} stores about you, why, for how long, who else is involved, and how to download or delete your data.`,
    path: "/privacy-policy",
  });
}

// Every statement here must match what the code does. When the code changes
// (a new cookie, a new service, email sending), this page changes with it.
// The data inventory is in docs/PHASE_6_PRIVACY_AND_CONSENT.md.
export default async function PrivacyPolicyPage() {
  const { owner, adsLive } = await legalContext();
  const contact = owner.contactEmail ? <a href={`mailto:${owner.contactEmail}`}>{owner.contactEmail}</a> : <Fact value={null} need="a contact email" />;
  return (
    <InfoPage title="Privacy *policy*" description="What we keep about you, why, for how long, and how to get it or delete it.">
      <DraftNotice owner={owner} page="privacy policy" />
      <EffectiveDate owner={owner} />

      <h2>Who is responsible</h2>
      <p>
        {SITE_NAME} is run by <Fact value={owner.operatorName} need="the name of the person or organisation that runs the site" />, based in{" "}
        <Fact value={owner.country} need="the country" />. For anything about your data, write to {contact} or use the{" "}
        <Link href="/contact">contact form</Link>.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>You can read every lecture and run every example without an account. We don&apos;t ask who you are for that.</li>
        <li>If you create an account, we keep your name, email and what you do in the courses, so your progress follows you.</li>
        <li>
          Programs you run in a lecture or question run inside your own browser. Answers you check are sent to the site to be marked, and are
          kept only if you are signed in.
        </li>
        <li>You can download everything we keep about your account, or delete the account, at any time in <Link href="/settings">Account settings</Link>.</li>
        <li>We don&apos;t sell your data and we don&apos;t send marketing email. The site sends no email at all today.</li>
        <li>
          {adsLive
            ? "The site shows ads from Google AdSense. Where the law asks for it, you are asked first whether ads may use cookies."
            : "The site shows no ads today. If ads are switched on later, this policy will say so and, where the law asks for it, you will be asked first."}
        </li>
      </ul>

      <h2>What we keep, and why</h2>
      <LegalTable
        label="What we keep, and why"
        head={["What", "When", "Why", "How long"]}
        rows={[
          [
            "Your name, email, password (stored only as a scrambled hash) and recovery code (also hashed)",
            "You create a student account",
            "To let you sign in and recover your account",
            "Until you delete your account",
          ],
          [
            "Your progress: lectures marked done, answers to questions, quiz and exam attempts and results, code drafts, bookmarks, achievements",
            "You use the courses while signed in",
            "To show your progress, history and dashboard, and to apply quiz rules such as the limit on attempts",
            "Until you delete your account",
          ],
          [
            "For each device you sign in on: when, its network (IP) address and its browser name",
            "You sign in",
            "So you can see your signed-in devices and sign them out, and to keep accounts safe",
            "Until you sign that device out, or the sign-in expires (30 days at most for students) and is cleared",
          ],
          [
            "The network address of sign-ups, failed sign-ins, recovery attempts and contact messages",
            "You use one of those forms",
            "To slow down automated abuse (rate limits)",
            "Removed automatically once more than a day old, the next time one of these forms is used",
          ],
          [
            "Your name, email and message",
            "You send the contact form",
            "To read and answer your message",
            "Until an administrator deletes it. Ask us and we will delete it.",
          ],
          [
            "Staff only: a record of each change made in the admin area, with the staff member's network address",
            "A staff member changes content or settings",
            "Accountability and fixing mistakes",
            "Kept as the site's history",
          ],
        ]}
      />
      <p>
        We don&apos;t keep a record of which pages a visitor without an account reads, and the site runs no analytics service of its own.
        Course staff see how students do in their course (for example how many finished a lecture or passed a quiz) so they can improve it.
      </p>

      <h2>Stored on your own device</h2>
      <p>
        A sign-in cookie keeps you signed in, a small cookie remembers which version of a multi-version quiz you got last, and your
        browser&apos;s local storage remembers your colour theme, your practice progress on this device and the answers of a quiz or exam
        you haven&apos;t finished yet. These are needed for the site to work as you asked, and they stay on your device. The{" "}
        <Link href="/cookie-policy">cookie policy</Link> lists each one.
      </p>

      <h2>Other companies involved</h2>
      <ul>
        <li>
          <strong>Cloudflare</strong> hosts the site and its database and files. Like any web host it processes the network address of
          every visitor to deliver pages and protect the site from attacks. On the sign-up, sign-in, account recovery and contact forms,
          Cloudflare Turnstile checks that a person, not a program, is sending the form. See{" "}
          <a href="https://www.cloudflare.com/privacypolicy/" rel="noopener">
            Cloudflare&apos;s privacy policy
          </a>
          .
        </li>
        <li>
          <strong>Google AdSense</strong>
          {adsLive ? " shows the ads on this site." : " would show ads if they are switched on later. Today no Google ad code loads."} The
          next section explains what that means.
        </li>
      </ul>

      <h2 id="advertising">Advertising and Google</h2>
      <p>
        {adsLive
          ? `${SITE_NAME} shows ads served by Google AdSense on some lecture, course and question pages, never on quizzes, exams, sign-in or account pages.`
          : `${SITE_NAME} is prepared to show ads served by Google AdSense, but ads are switched off today. When they are on, this applies:`}
      </p>
      <ul>
        <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
        <li>
          Google&apos;s use of advertising cookies enables it and its partners to serve ads to you based on your visit to this site and/or
          other sites on the Internet.
        </li>
        <li>
          You may opt out of personalised advertising by visiting Google&apos;s{" "}
          <a href="https://adssettings.google.com" rel="noopener">
            Ads Settings
          </a>
          . You can also opt out of some third-party vendors&apos; use of cookies for personalised advertising at{" "}
          <a href="https://www.aboutads.info/choices/" rel="noopener">
            aboutads.info
          </a>
          .
        </li>
        <li>
          How Google uses information from sites that use its services:{" "}
          <a href="https://policies.google.com/technologies/partner-sites" rel="noopener">
            policies.google.com/technologies/partner-sites
          </a>
          .
        </li>
        <li>
          Visitors in the European Economic Area, the UK and Switzerland are asked through a Google-certified consent tool before ads use
          cookies or personal data. You can change your answer at any time on the <Link href="/privacy-choices">Privacy choices</Link> page.
        </li>
        <li>Signed-in staff never see live ads, and we never ask anyone to click an ad.</li>
      </ul>
      <p>
        More about where ads go and how they are labelled is on the <Link href="/advertising">advertising page</Link>.
      </p>

      <h2>Why we are allowed to use your data</h2>
      <p>
        If you live where the GDPR or a similar law applies (for example the EEA or the UK), we rely on: providing the account you asked
        for (your account and progress data); our legitimate interest in keeping the site safe (sign-in records and rate limits); and your
        consent, where it is required, for advertising cookies. Egypt&apos;s Personal Data Protection Law (No. 151 of 2020) and other local
        laws may give you similar rights.
      </p>

      <h2>Your choices and rights</h2>
      <ul>
        <li>
          <strong>See and download your data:</strong> <Link href="/settings">Account settings</Link>, &quot;Download my data&quot;.
        </li>
        <li>
          <strong>Correct it:</strong> change your name in Account settings. For anything else, contact us.
        </li>
        <li>
          <strong>Delete it:</strong> &quot;Delete my account&quot; in Account settings removes your account and everything saved with it.
        </li>
        <li>
          <strong>Sign out other devices:</strong> &quot;Signed-in devices&quot; in Account settings.
        </li>
        <li>
          <strong>Advertising choices:</strong> the <Link href="/privacy-choices">Privacy choices</Link> page.
        </li>
        <li>
          <strong>Anything else</strong> (for example a question, or deleting a contact message): write to {contact}. You may also complain to
          the data protection authority where you live.
        </li>
      </ul>

      <h2>Keeping it safe</h2>
      <p>
        The site is served only over HTTPS. Passwords and recovery codes are stored as salted hashes, never as text. Sign-in cookies can&apos;t
        be read by scripts on the page, and sign-ins expire on their own. Staff can only open the parts of the admin area their role allows,
        and every change there is recorded.
      </p>

      <h2>Children</h2>
      <p>
        {SITE_NAME} is written for university students and is not directed at children. If you believe a child has created an account,
        contact us and we will delete it.
      </p>

      <h2>Changes to this policy</h2>
      <p>
        When what the site does with data changes, this page changes first, and the effective date at the top is updated.
      </p>
    </InfoPage>
  );
}
