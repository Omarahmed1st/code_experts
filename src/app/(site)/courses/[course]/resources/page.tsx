import { FolderOpen } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { RESOURCE_KIND_LABEL } from "@/components/courses/resource-kind";
import { listResources } from "@/server/content/resources";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  const resources = await listResources(course);
  return pageMetadata({
    title: `Slides and files | ${course.shortTitle}`,
    description: `Lecture slides, PDFs and handouts for ${course.title}.`,
    path: `/courses/${course.slug}/resources`,
    index: resources.length > 0,
  });
}

export default async function ResourcesPage({ params }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const resources = await listResources(course);
  const coursePath = `/courses/${course.slug}`;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Resources" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Slides and *files*"
        description={`Presentations, PDFs and handouts for ${course.title}. Each lecture also links the files it uses.`}
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="resources" />
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        {resources.length === 0 ? (
          <EmptyState icon={<FolderOpen aria-hidden="true" className="size-6" />} title="No files yet">
            Slides and handouts for this course will appear here once they are uploaded. The lectures themselves are
            already written in full on each lecture page.
          </EmptyState>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {resources.map((resource) => (
              <li key={resource.slug}>
                <article className="relative h-full rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card hover:border-primary">
                  <p className="text-sm font-semibold text-accent">
                    {RESOURCE_KIND_LABEL[resource.kind]}
                    {resource.topicTitle ? <span className="text-muted"> · {resource.topicTitle}</span> : null}
                  </p>
                  <h2 className="mt-2 text-lg font-semibold">
                    <Link
                      href={`${coursePath}/resources/${resource.slug}`}
                      className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
                    >
                      {resource.title}
                    </Link>
                  </h2>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
