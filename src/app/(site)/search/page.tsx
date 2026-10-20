import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: "Search", description: "Search inside one course at a time.", path: "/search", index: false });
}

/** Search always happens inside one course, so this page only asks which one. */
export default async function SearchChooserPage() {
  const courses = await listPublishedCourses();
  return (
    <>
      <PageHero crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]} title="Search *one course*" description="Results never mix courses. Pick the course you want to search." />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <ul className="grid gap-3">
          {courses.map((course) => (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}/search`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4 font-semibold hover:border-primary"
              >
                <span>
                  Search {course.title}
                  <span className="block text-sm font-normal text-muted">{course.shortTitle}</span>
                </span>
                <ArrowRight aria-hidden="true" className="size-5 text-primary-text" />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
