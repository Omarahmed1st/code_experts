import type { Metadata } from "next";
import Link from "next/link";
import { CourseGrid } from "@/components/courses/course-grid";
import { PageHero } from "@/components/layout/page-hero";
import { getCatalog } from "@/server/courses/catalog";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ tag?: string | string[] }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { tag } = await searchParams;
  return pageMetadata({
    title: "Courses",
    description: "Choose a course: Programming Fundamentals (C++), Programming Applications (Python) or Computer Vision.",
    path: "/courses",
    // Filtered views repeat the main list, so only the unfiltered page is indexed.
    index: tag === undefined,
  });
}

export default async function CoursesPage({ searchParams }: Props) {
  const { courses, lectureCounts } = await getCatalog();
  const raw = (await searchParams).tag;
  const allTags = [...new Set(courses.flatMap((c) => c.tags))].sort((a, b) => a.localeCompare(b));
  const tag = typeof raw === "string" && allTags.includes(raw) ? raw : null;
  const shown = tag ? courses.filter((c) => c.tags.includes(tag)) : courses;

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "Courses" }]}
        title="Pick a *course*"
        description="Each course is its own learning space. Lectures, files and search never mix between courses."
      />
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        {allTags.length > 1 ? (
          <nav aria-label="Filter courses by topic">
            <ul className="flex flex-wrap gap-2">
              {[null, ...allTags].map((t) => {
                const active = t === tag;
                return (
                  <li key={t ?? "all"}>
                    <Link
                      href={t ? `/courses?tag=${encodeURIComponent(t)}` : "/courses"}
                      aria-current={active ? "page" : undefined}
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors ${
                        active ? "border-navy bg-navy text-[#ffd43b]" : "border-line-strong bg-surface text-muted hover:text-ink"
                      }`}
                    >
                      {t ?? "All courses"}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
        <div className="mt-8">
          <CourseGrid courses={shown} lectureCounts={lectureCounts} />
        </div>
      </div>
    </>
  );
}
