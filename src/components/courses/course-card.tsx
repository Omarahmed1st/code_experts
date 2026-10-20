import { ArrowRight, Braces, Code } from "lucide-react";
import Link from "next/link";
import type { CourseSummary } from "@/server/courses/scope";

const LANGUAGE_ICON = { cpp: Braces, python: Code } as const;

export function CourseCard({ course, lectures }: { course: CourseSummary; lectures?: number }) {
  const Icon = LANGUAGE_ICON[course.primaryLanguage];
  return (
    <article className="group relative flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-6 shadow-card transition-colors hover:border-primary">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="text-sm font-semibold text-accent">{course.shortTitle}</span>
        {lectures !== undefined ? (
          <span className="ml-auto rounded-full bg-navy px-2.5 py-0.5 font-mono text-xs font-bold text-[#ffd43b]">
            {lectures === 0 ? "Coming soon" : `${lectures} ${lectures === 1 ? "lecture" : "lectures"}`}
          </span>
        ) : null}
      </div>
      <h3 className="mt-5 text-xl font-semibold">
        <Link href={`/courses/${course.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
          {course.title}
        </Link>
      </h3>
      <p className="mt-2 flex-1 text-muted">{course.description}</p>
      {course.tags.length > 0 ? (
        <ul className="mt-5 flex flex-wrap gap-2" aria-label="Topics">
          {course.tags.map((tag) => (
            <li key={tag} className="rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold text-muted">
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary-text">
        Open course
        <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </article>
  );
}
