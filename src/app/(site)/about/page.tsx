import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/layout/info-page";
import { Fact } from "@/components/legal/legal-parts";
import { SITE_NAME } from "@/lib/site";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";
import { legalContext } from "@/server/site/legal";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({
    title: `About ${SITE_NAME}`,
    description: `${SITE_NAME} is a free site of written programming lectures for university students: C++, Python and computer vision with OpenCV.`,
    path: "/about",
  });
}

// Who runs the site comes from /admin/site (Phase 6); until the owner enters
// it, the page shows a marked gap instead of a made-up name.
export default async function AboutPage() {
  const [courses, { owner, adsLive }] = await Promise.all([listPublishedCourses(), legalContext()]);
  return (
    <InfoPage title={`About *${SITE_NAME}*`} description="Free programming lectures, written in full and checked by running every program.">
      <h2>What this site is</h2>
      <p>
        {SITE_NAME} teaches programming through written lectures. Each lecture explains one idea in plain words, shows
        a short program for it, and points out the mistakes students most often make. Python and C++ examples run right
        in your browser, and you can change them and run them again; OpenCV examples show the output they really produce.
      </p>
      <h2>The courses</h2>
      <p>Each course is its own learning space. Its lectures, files and search never mix with another course&apos;s.</p>
      <ul>
        {courses.map((course) => (
          <li key={course.slug}>
            <Link href={`/courses/${course.slug}`}>{course.title}</Link>: {course.description}
          </li>
        ))}
      </ul>
      <h2>How the examples are checked</h2>
      <p>
        Every program in a lecture is compiled or run before it is published, and the output you see is the output it
        printed. When a lecture shows a mistake on purpose, it says so and shows the real error message.
      </p>
      <h2>Free to use</h2>
      <p>
        Every lecture is free and public. You don&apos;t need an account to read or run the examples.{" "}
        {adsLive
          ? "A few clearly labelled ads help pay for hosting; they never appear in quizzes, exams or account pages."
          : "The site shows no ads today."}{" "}
        <Link href="/advertising">How advertising works here</Link>.
      </p>
      <h2>Who runs it</h2>
      <p>
        {SITE_NAME} is run by <Fact value={owner.operatorName} need="the name of the person or organisation that runs the site" />
        {owner.country ? `, ${owner.country}` : ""}. Found a mistake, or have a question? Use the <Link href="/contact">contact page</Link>.
      </p>
    </InfoPage>
  );
}
