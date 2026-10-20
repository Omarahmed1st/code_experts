import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice } from "@/components/legal/legal-parts";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { pageMetadata } from "@/server/seo";
import { legalContext } from "@/server/site/legal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Advertising",
    description: `How ${SITE_NAME} uses advertising: where ads may appear, where they never do, how they are labelled and your choices.`,
    path: "/advertising",
  });
}

export default async function AdvertisingPage() {
  const { owner, adsLive } = await legalContext();
  return (
    <InfoPage title="Advertising" description="How ads work on this site, and where they never go.">
      <DraftNotice owner={owner} page="advertising disclosure" />

      <h2>Right now</h2>
      <p>
        {adsLive
          ? `${SITE_NAME} shows a small number of ads served by Google AdSense. They help pay for hosting so the lectures can stay free.`
          : `${SITE_NAME} shows no ads today. The site is prepared for ads served by Google AdSense; if they are switched on, this page will say so first.`}
      </p>

      <h2>Where ads may appear</h2>
      <ul>
        <li>On the home page, below the course list and near the bottom.</li>
        <li>On a course page, after the whole course outline.</li>
        <li>In a lecture: between two reading sections (never next to a code box, a Run button, an output or a picture) and at the very end.</li>
        <li>On a practice question page, well below the question, its answer and its buttons.</li>
        <li>On a file page, below the description.</li>
      </ul>
      <p>Each ad is labelled &quot;Advertisement&quot; and set apart from the lesson around it.</p>

      <h2>Where ads never appear</h2>
      <ul>
        <li>Quizzes, exams, your own exams and practice sets, while you answer or review them.</li>
        <li>Sign-in, sign-up, account recovery, your dashboard and account settings.</li>
        <li>Search results, error pages and empty pages.</li>
        <li>The contact form and the legal pages (privacy, terms, cookies, privacy choices and this page).</li>
        <li>The admin area. Staff never see live ads.</li>
      </ul>

      <h2>What we don&apos;t do</h2>
      <ul>
        <li>Advertisers don&apos;t choose, pay for or review lecture content.</li>
        <li>Ads don&apos;t refresh by themselves, don&apos;t cover the lesson and don&apos;t pop up.</li>
        <li>We never ask you to click an ad or reward you for it.</li>
      </ul>

      <h2>Your choices</h2>
      <p>
        How Google may use cookies for ads, and how to opt out of personalised ads, is explained in the{" "}
        <Link href="/privacy-policy#advertising">privacy policy</Link>. You can change your consent at any time on the{" "}
        <Link href="/privacy-choices">Privacy choices</Link> page.
      </p>
      <p>
        If an ad looks wrong or offensive, please tell us through the <Link href="/contact">contact form</Link>, with the page it was on.
      </p>
    </InfoPage>
  );
}
