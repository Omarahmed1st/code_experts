import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { EmptyState } from "@/components/ui/empty-state";
import { plural } from "@/lib/format";
import { normalizeQuery, snippetParts, MAX_QUERY_LENGTH } from "@/lib/search-query";
import { searchCourse } from "@/server/content/search";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string }>; searchParams: Promise<{ q?: string | string[] }> };

const TYPE_LABEL: Record<string, string> = { lesson: "Lecture", topic: "Topic", resource: "File", exercise: "Exercise", quiz: "Quiz" };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  // Search result pages are never indexed.
  return pageMetadata({
    title: `Search ${course.shortTitle}`,
    description: `Search the lectures and topics of ${course.title}.`,
    path: `/courses/${course.slug}/search`,
    index: false,
  });
}

export default async function CourseSearchPage({ params, searchParams }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const raw = (await searchParams).q;
  const query = normalizeQuery(Array.isArray(raw) ? raw[0] : raw);
  const results = query ? await searchCourse(course, query) : [];
  const coursePath = `/courses/${course.slug}`;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Search" },
        ]}
        chapter={{ label: course.shortTitle }}
        title={`Search *${course.shortTitle}*`}
        description={`Results come from ${course.title} only.`}
      >
        <form role="search" action={`${coursePath}/search`} method="get" className="mt-7 flex max-w-2xl flex-wrap gap-3">
          <label htmlFor="q" className="sr-only">
            Search {course.title}
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            maxLength={MAX_QUERY_LENGTH}
            placeholder="for example: slicing, for loop, pixels"
            autoComplete="off"
            className="min-h-12 min-w-0 flex-1 rounded-xl border border-[#2b4373] bg-[#0e1931] px-4 text-[#f2f5fa] placeholder:text-[#8597bb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ffd43b]"
          />
          <button type="submit" className="min-h-12 rounded-xl bg-[#ffd43b] px-6 font-semibold text-[#14213d] hover:bg-[#ffe173]">
            Search
          </button>
        </form>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="search" />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        {!query ? (
          <p className="text-muted">Type a word or two from a lecture: a function name, a keyword or an idea.</p>
        ) : results.length === 0 ? (
          <EmptyState icon={<SearchX aria-hidden="true" className="size-6" />} title={`Nothing found for “${query}”`}>
            Try a shorter word, or browse the{" "}
            <Link href={coursePath} className="font-semibold text-primary-text hover:underline">
              course outline
            </Link>
            .
          </EmptyState>
        ) : (
          <section aria-labelledby="results-heading">
            <h2 id="results-heading" className="text-lg font-semibold" aria-live="polite">
              {plural(results.length, "result")} for “{query}”
            </h2>
            <ol className="mt-5 grid gap-3">
              {results.map((result) => (
                <li key={result.url}>
                  <article className="relative rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-primary">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{TYPE_LABEL[result.entityType] ?? "Page"}</p>
                    <h3 className="mt-1 text-lg font-semibold">
                      <Link href={result.url} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
                        {result.title}
                      </Link>
                    </h3>
                    {result.snippet ? (
                      <p className="mt-1 text-muted">
                        {snippetParts(result.snippet).map((part, i) =>
                          part.match ? (
                            <mark key={i} className="rounded bg-primary-soft px-0.5 font-semibold text-ink">
                              {part.text}
                            </mark>
                          ) : (
                            <span key={i}>{part.text}</span>
                          ),
                        )}
                      </p>
                    ) : null}
                  </article>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>
    </>
  );
}
