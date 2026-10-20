import { Clock, Target } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Notice } from "@/components/admin/form-parts";
import { CodeCopyEnhancer } from "@/components/lesson/code-copy";
import { LessonSection } from "@/components/lesson/lesson-section";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { buttonClass } from "@/components/ui/button-styles";
import { renderInlineMarkdown } from "@/lib/markdown/render";
import { getLessonForEdit, isLive } from "@/server/admin/lessons";
import { requireCourse } from "@/server/auth/staff";
import { getLessonPreview } from "@/server/content/lessons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview lecture" };

/** The saved lecture as students will see it, whatever its status. Pictures come through the staff-only media route. */
export default async function PreviewLecturePage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { course } = await requireCourse(slug, "view");
  const [lesson, meta] = await Promise.all([getLessonPreview(course, id), getLessonForEdit(course, id)]);
  if (!lesson || !meta) notFound();
  const live = isLive(meta.draft);
  return (
    <div className="grid grid-cols-1 gap-6">
      <Notice tone={live ? "info" : "warn"}>
        Preview of the last saved version. {live ? "This lecture is live." : `Students can't see it yet (status: ${meta.draft.status}).`}{" "}
        <Link href={`/admin/courses/${course.slug}/lectures/${id}`} className="font-semibold underline">
          Back to the editor
        </Link>
      </Notice>
      <article className="mx-auto w-full max-w-4xl">
        <header className="lec-cinema rounded-[var(--radius-card)] px-6 py-8 text-[var(--lec-ink)]">
          <p className="lec-chapter text-[var(--lec-mute)]">
            {lesson.lectureNumber != null ? <b>{String(lesson.lectureNumber).padStart(2, "0")}</b> : null}
            <i />
            {lesson.topic.title}
          </p>
          <h1 className="mt-3 text-3xl font-bold">{lesson.title}</h1>
          <p className="mt-2 text-[var(--lec-mute)]">{lesson.description}</p>
          <p className="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--lec-mute)]">
            <DifficultyBadge level={lesson.difficulty} />
            <span className="inline-flex items-center gap-1.5">
              <Clock aria-hidden="true" className="size-4" /> {lesson.readingMinutes} min read
            </span>
          </p>
        </header>
        {lesson.objectives.length > 0 ? (
          <section className="mt-6 rounded-[var(--radius-card)] border border-line bg-surface p-5">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Target aria-hidden="true" className="size-5 text-primary-text" /> By the end you can
            </h2>
            <ul className="mt-3 grid gap-2">
              {lesson.objectives.map((o) => (
                <li key={o} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(o) }} />
              ))}
            </ul>
          </section>
        ) : null}
        <div className="mt-10">
          {lesson.sections.map((section, index) => (
            <LessonSection key={section.id} section={section} index={index} course={course} mediaBase="/admin" />
          ))}
        </div>
        <p className="mt-10">
          <Link href={`/admin/courses/${course.slug}/lectures/${id}`} className={buttonClass("secondary")}>
            Back to the editor
          </Link>
        </p>
      </article>
      <CodeCopyEnhancer />
    </div>
  );
}
