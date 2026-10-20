import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";

/**
 * "Pick a course" pages for site-wide links such as /exercises: everything
 * happens inside one course, so these only ask which one.
 */
export function CourseChooser({
  label,
  title,
  description,
  section,
  courses,
}: {
  label: string;
  title: string;
  description: string;
  section: string;
  courses: { slug: string; title: string; shortTitle: string }[];
}) {
  return (
    <>
      <PageHero crumbs={[{ label: "Home", href: "/" }, { label }]} title={title} description={description} />
      <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
        <ul className="grid gap-3">
          {courses.map((course) => (
            <li key={course.slug}>
              <Link
                href={`/courses/${course.slug}/${section}`}
                className="flex min-h-14 items-center justify-between gap-3 rounded-[var(--radius-card)] border border-line bg-surface px-5 py-4 font-semibold hover:border-primary"
              >
                <span>
                  {course.title}
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
