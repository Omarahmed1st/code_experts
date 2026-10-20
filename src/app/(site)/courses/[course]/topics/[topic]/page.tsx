import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { LectureList } from "@/components/courses/lecture-list";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonClass } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { getCourseOutline } from "@/server/content/lessons";
import { resolveCourse } from "@/server/courses/scope";
import { breadcrumbJsonLd, pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; topic: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, topic: topicSlug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const outline = await getCourseOutline(course);
  const index = outline.findIndex((t) => t.slug === topicSlug);
  const topic = outline[index];
  return topic ? { course, topic, number: index + 1 } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Topic not found", robots: { index: false } };
  const { course, topic } = found;
  return pageMetadata({
    title: `${topic.title} | ${course.shortTitle}`,
    description: topic.description || `Lectures on ${topic.title} in ${course.title}.`,
    path: `/courses/${course.slug}/topics/${topic.slug}`,
    // A topic without lectures is a thin page.
    index: topic.lessons.length > 0,
  });
}

export default async function TopicPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, topic, number } = found;
  const coursePath = `/courses/${course.slug}`;
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: coursePath },
    { name: topic.title, path: `${coursePath}/topics/${topic.slug}` },
  ]);

  return (
    <>
      {crumbLd ? <JsonLd data={crumbLd} /> : null}
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: topic.title },
        ]}
        chapter={{ index: String(number).padStart(2, "0"), label: course.shortTitle }}
        title={topic.title}
        description={topic.description}
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="overview" />
      <div className="mx-auto max-w-4xl px-4 pt-10 sm:px-6">
        {topic.lessons.length > 0 ? (
          <section aria-labelledby="lectures-heading">
            <h2 id="lectures-heading" className="text-2xl font-bold">
              Lectures in this topic
            </h2>
            <div className="mt-6">
              <LectureList courseSlug={course.slug} lessons={topic.lessons} />
            </div>
          </section>
        ) : (
          <EmptyState
            icon={<BookOpen aria-hidden="true" className="size-6" />}
            title="Coming soon"
            action={
              <Link href={coursePath} className={buttonClass("secondary")}>
                See the course outline
              </Link>
            }
          >
            The lectures for this topic haven&apos;t been published yet.
          </EmptyState>
        )}
      </div>
    </>
  );
}
