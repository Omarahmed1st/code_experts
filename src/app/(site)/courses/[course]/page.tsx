import { ArrowRight, BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseProgressStrip } from "@/components/account/course-progress";
import { CourseNav } from "@/components/courses/course-nav";
import { LectureList } from "@/components/courses/lecture-list";
import { PageHero } from "@/components/layout/page-hero";
import { AdSlot } from "@/components/ads/ad-slot";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClass } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/format";
import { getCourseOutline } from "@/server/content/lessons";
import { resolveCourse } from "@/server/courses/scope";
import { pageAds } from "@/server/ads/settings";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadataWithSeo } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  const outline = await getCourseOutline(course);
  const lectures = outline.reduce((n, t) => n + t.lessons.length, 0);
  // A course with no lectures yet is a thin page: keep it out of search results until it has some.
  return pageMetadataWithSeo({ title: course.title, description: course.description, path: `/courses/${course.slug}`, index: lectures > 0 });
}

export default async function CourseHomePage({ params }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const outline = await getCourseOutline(course);
  const lectures = outline.flatMap((t) => t.lessons);
  const ready = outline.filter((t) => t.lessons.length > 0).length;
  const first = lectures[0];
  const coursePath = `/courses/${course.slug}`;
  // An ad only below a course that really has lectures (never on an empty outline).
  const ads = await pageAds({ template: "course", path: coursePath, courseId: course.courseId }, lectures.length > 0 ? ["after_outline"] : []);
  const url = absoluteUrl(coursePath);
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: coursePath },
  ]);

  return (
    <>
      {url && lectures.length > 0 ? (
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Course",
            name: course.title,
            description: course.description,
            url,
            inLanguage: "en",
            isAccessibleForFree: true,
            provider: { "@type": "Organization", name: SITE_NAME },
          }}
        />
      ) : null}
      {crumbLd ? <JsonLd data={crumbLd} /> : null}
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Courses", href: "/courses" }, { label: course.title }]}
        chapter={{ label: course.shortTitle }}
        title={course.title}
        description={course.description}
      >
        <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <div>
            <dt className="text-[var(--lec-mute)]">Lectures</dt>
            <dd className="font-mono text-2xl font-bold text-[var(--lec-yel)]">{lectures.length}</dd>
          </div>
          <div>
            <dt className="text-[var(--lec-mute)]">Topics with lectures</dt>
            <dd className="font-mono text-2xl font-bold text-[var(--lec-sky)]">
              {ready}
              <span className="text-base text-[var(--lec-mute)]"> / {outline.length}</span>
            </dd>
          </div>
        </dl>
        {first ? (
          <div className="mt-7">
            <Link href={`${coursePath}/lectures/${first.slug}`} className={buttonClass("primary")}>
              Start with: {first.title}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
        ) : null}
        <CourseProgressStrip courseSlug={course.slug} lectureSlugs={lectures.map((l) => l.slug)} />
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="overview" />

      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        {outline.length === 0 ? (
          <EmptyState icon={<BookOpen aria-hidden="true" className="size-6" />} title="Lectures are on the way">
            This course&apos;s lectures haven&apos;t been published yet.
          </EmptyState>
        ) : (
          <section aria-labelledby="outline-heading">
            <h2 id="outline-heading" className="text-3xl font-bold">
              Course outline
            </h2>
            <p className="mt-2 max-w-2xl text-muted">
              Topics in teaching order. Each lecture is written here in full, with code you can read, run or copy.
            </p>
            <ol className="mt-8 grid gap-10">
              {outline.map((topic, i) => (
                <li key={topic.slug} aria-labelledby={`topic-${topic.slug}`}>
                  <div className="flex items-baseline gap-3">
                    <span aria-hidden="true" className="font-mono text-sm font-bold text-primary-text">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 id={`topic-${topic.slug}`} className="text-xl font-semibold">
                      <Link href={`${coursePath}/topics/${topic.slug}`} className="hover:underline">
                        {topic.title}
                      </Link>
                    </h3>
                    <span className="ml-auto shrink-0 text-sm text-muted">
                      {topic.lessons.length ? plural(topic.lessons.length, "lecture") : "Coming soon"}
                    </span>
                  </div>
                  {topic.description ? <p className="mt-1 pl-9 text-muted">{topic.description}</p> : null}
                  {topic.lessons.length > 0 ? (
                    <div className="mt-4 sm:pl-9">
                      <LectureList courseSlug={course.slug} lessons={topic.lessons} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </section>
        )}
        <AdSlot ads={ads} position="after_outline" gap="mt-16" />
      </div>
    </>
  );
}
