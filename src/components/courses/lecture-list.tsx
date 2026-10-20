import { ArrowRight, Clock } from "lucide-react";
import Link from "next/link";
import { LectureMark } from "@/components/account/lecture-progress";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import type { LessonCard } from "@/server/content/lessons";

/** Numbered lecture rows for a topic, in course order. */
export function LectureList({ courseSlug, lessons }: { courseSlug: string; lessons: LessonCard[] }) {
  return (
    <ol className="grid gap-3">
      {lessons.map((lesson) => (
        <li key={lesson.slug}>
          <article className="group relative flex gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-card transition-colors hover:border-primary sm:p-5">
            <span
              aria-hidden="true"
              className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-mono text-sm font-bold text-[#ffd43b]"
            >
              {lesson.lectureNumber != null ? String(lesson.lectureNumber).padStart(2, "0") : "▶"}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold leading-snug">
                <Link
                  href={`/courses/${courseSlug}/lectures/${lesson.slug}`}
                  className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]"
                >
                  {lesson.lectureNumber != null ? <span className="sr-only">Lecture {lesson.lectureNumber}: </span> : null}
                  {lesson.title}
                </Link>
              </h3>
              <p className="mt-1 text-muted">{lesson.description}</p>
              <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                <DifficultyBadge level={lesson.difficulty} />
                <span className="inline-flex items-center gap-1.5">
                  <Clock aria-hidden="true" className="size-4" />
                  {lesson.readingMinutes} min read
                </span>
                <LectureMark courseSlug={courseSlug} lectureSlug={lesson.slug} />
              </p>
            </div>
            <ArrowRight
              aria-hidden="true"
              className="mt-2 hidden size-5 shrink-0 text-primary-text transition-transform group-hover:translate-x-0.5 sm:block"
            />
          </article>
        </li>
      ))}
    </ol>
  );
}
