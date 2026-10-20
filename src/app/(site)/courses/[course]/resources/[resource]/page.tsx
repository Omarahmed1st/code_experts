import { Download, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { RESOURCE_KIND_LABEL } from "@/components/courses/resource-kind";
import { BookmarkButton } from "@/components/account/bookmark-button";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button-styles";
import { AdSlot } from "@/components/ads/ad-slot";
import { formatBytes } from "@/lib/format";
import { markdownToPlainText } from "@/lib/lesson/source";
import { renderMarkdown } from "@/lib/markdown/render";
import { getResource } from "@/server/content/resources";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";
import { pageAds } from "@/server/ads/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; resource: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, resource: slug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const resource = await getResource(course, slug);
  return resource ? { course, resource } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "File not found", robots: { index: false } };
  const { course, resource } = found;
  const text = markdownToPlainText(resource.descriptionMd).slice(0, 160);
  return pageMetadata({
    title: `${resource.title} | ${course.shortTitle}`,
    description: text || `${RESOURCE_KIND_LABEL[resource.kind]} for ${course.title}.`,
    path: `/courses/${course.slug}/resources/${resource.slug}`,
    // A file page with no description is thin; the lectures are the real content.
    index: text.length >= 80,
  });
}

export default async function ResourcePage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, resource } = found;
  const coursePath = `/courses/${course.slug}`;
  const base = `${coursePath}/resources/${resource.slug}/files`;
  const original = resource.files.find((f) => f.role === "original");
  const preview = resource.files.find((f) => f.role === "preview");
  // Only a file page with a real description (the same rule as indexing) may carry an ad.
  const substantial = markdownToPlainText(resource.descriptionMd).length >= 80;
  const ads = await pageAds(
    { template: "resource", path: `${coursePath}/resources/${resource.slug}`, courseId: course.courseId },
    substantial ? ["below_description"] : [],
  );

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Resources", href: `${coursePath}/resources` },
          { label: resource.title },
        ]}
        chapter={{ label: RESOURCE_KIND_LABEL[resource.kind] + (resource.topicTitle ? ` · ${resource.topicTitle}` : "") }}
        title={resource.title}
      >
        <div className="mt-7 flex flex-wrap gap-3">
          {preview ? (
            <a href={`${base}/preview`} className={buttonClass("primary")} target="_blank" rel="noopener">
              <Eye aria-hidden="true" className="size-4" />
              Open in the browser<span className="sr-only"> (new tab)</span>
            </a>
          ) : null}
          {resource.downloadable && original ? (
            <a href={`${base}/original`} className={buttonClass(preview ? "secondary" : "primary")}>
              <Download aria-hidden="true" className="size-4" />
              Download {original.filename} ({formatBytes(original.sizeBytes)})
            </a>
          ) : null}
          <BookmarkButton courseSlug={course.slug} kind="file" slug={resource.slug} tone="stage" />
        </div>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="resources" />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        {resource.descriptionMd ? (
          <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: renderMarkdown(resource.descriptionMd) }} />
        ) : null}
        {resource.lessons.length > 0 ? (
          <section aria-labelledby="used-heading" className="mt-10">
            <h2 id="used-heading" className="text-xl font-semibold">
              Used in these lectures
            </h2>
            <ul className="mt-3 grid gap-1">
              {resource.lessons.map((lesson) => (
                <li key={lesson.slug}>
                  <Link href={`${coursePath}/lectures/${lesson.slug}`} className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:underline">
                    {lesson.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        <AdSlot ads={ads} position="below_description" gap="mt-16" />
      </div>
    </>
  );
}
