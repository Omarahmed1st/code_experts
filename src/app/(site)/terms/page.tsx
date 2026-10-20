import type { Metadata } from "next";
import Link from "next/link";
import { DraftNotice, EffectiveDate, Fact } from "@/components/legal/legal-parts";
import { InfoPage } from "@/components/layout/info-page";
import { SITE_NAME } from "@/lib/site";
import { pageMetadata } from "@/server/seo";
import { legalContext } from "@/server/site/legal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: "Terms of use",
    description: `The rules for using ${SITE_NAME}: accounts, fair use, practice results, the lecture content and advertising.`,
    path: "/terms",
  });
}

export default async function TermsPage() {
  const { owner } = await legalContext();
  return (
    <InfoPage title="Terms of *use*" description="The rules for using the site, in plain words.">
      <DraftNotice owner={owner} page="terms" />
      <EffectiveDate owner={owner} />

      <h2>Who we are</h2>
      <p>
        {SITE_NAME} is run by <Fact value={owner.operatorName} need="the name of the person or organisation that runs the site" />. By using
        the site you agree to these terms. If you don&apos;t agree, please don&apos;t use it.
      </p>

      <h2>What the site offers</h2>
      <p>
        Free written programming lectures, examples you can run in your browser, practice questions, quizzes and exams. Everything is free
        to read without an account. We may add, change or remove courses and features, and the site may sometimes be unavailable.
      </p>

      <h2>Your account</h2>
      <ul>
        <li>An account is for one person. Use your real email so you can recognise it later; a first name is enough as a name.</li>
        <li>
          Keep your password and recovery code to yourself. The recovery code is the only way back in if you forget your password, because
          the site sends no email.
        </li>
        <li>
          You can delete your account at any time in <Link href="/settings">Account settings</Link>. We may switch off or delete an account
          that breaks these terms.
        </li>
      </ul>

      <h2>Fair use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>try to get into other people&apos;s accounts or into the admin area, or test the site&apos;s security without permission;</li>
        <li>overload the site, for example with automated requests, or copy it in bulk with a program;</li>
        <li>use the contact form for spam or anything unlawful;</li>
        <li>click ads you aren&apos;t interested in, or ask or pay others to, or use any program to view or click ads.</li>
      </ul>

      <h2>Practice results</h2>
      <p>
        Marks, quiz and exam results on this site are for practice and self-assessment. They are not official grades, unless your instructor
        tells you otherwise. When you run code, the result your browser shows helps you check your work; it is never used as a mark.
      </p>

      <h2>The lectures and questions</h2>
      <p>
        The lectures, examples and questions are written for {SITE_NAME}.{" "}
        <Fact value={null} need="whether and how others may copy, share or reuse the lectures (for example all rights reserved, or a Creative Commons licence)" />
        . Short quotes with a link back are always welcome.
      </p>
      <p>
        We check every example by running it, but mistakes can happen. If you find one, please tell us through the{" "}
        <Link href="/contact">contact form</Link>.
      </p>

      <h2>Advertising</h2>
      <p>
        The site may show ads served by Google to cover its costs. Ads are labelled &quot;Advertisement&quot;, never appear on quizzes, exams,
        sign-in or account pages, and are not an endorsement of the advertiser. Details are on the <Link href="/advertising">advertising page</Link>.
      </p>

      <h2>No guarantee</h2>
      <p>
        The site is provided free and as it is. To the extent the law allows, we aren&apos;t responsible for losses caused by using it, by a
        mistake in the content, or by the site being unavailable. Nothing in these terms limits rights that the law where you live doesn&apos;t
        allow to be limited.
      </p>

      <h2>Law and changes</h2>
      <p>
        These terms are governed by the laws of <Fact value={owner.country} need="the country whose law applies" />. When they change, this
        page changes and its effective date is updated. Questions: <Link href="/contact">contact us</Link>.
      </p>
    </InfoPage>
  );
}
