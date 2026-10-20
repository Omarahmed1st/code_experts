import { ArrowLeft, ArrowRight, Clock, Download, FileText, Target } from "lucide-react";
import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarkButton } from "@/components/account/bookmark-button";
import { LectureDone } from "@/components/account/lecture-progress";
import { AdSlot } from "@/components/ads/ad-slot";
import { CourseNav } from "@/components/courses/course-nav";
import { LectureList } from "@/components/courses/lecture-list";
import { PageHero } from "@/components/layout/page-hero";
import { CodeCopyEnhancer } from "@/components/lesson/code-copy";
import { LessonSection } from "@/components/lesson/lesson-section";
import { LessonToc } from "@/components/lesson/lesson-toc";
import { ExerciseList } from "@/components/practice/exercise-list";
import { JsonLd } from "@/components/seo/json-ld";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { lessonAdBreaks, proseWords } from "@/lib/ads/policy";
import { formatBytes, formatDate, isoDate } from "@/lib/format";
import { renderInlineMarkdown } from "@/lib/markdown/render";
import { pageAds } from "@/server/ads/settings";
import { getLesson } from "@/server/content/lessons";
import { listLessonResources } from "@/server/content/resources";
import { resolveCourse } from "@/server/courses/scope";
import { listLessonExercises } from "@/server/exercises/catalog";
import { SITE_NAME, absoluteUrl, breadcrumbJsonLd, pageMetadataWithSeo } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; lecture: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, lecture: lectureSlug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const lesson = await getLesson(course, lectureSlug);
  return lesson ? { course, lesson } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Lecture not found", robots: { index: false } };
  const { course, lesson } = found;
  return pageMetadataWithSeo({
    title: `${lesson.title} | ${course.shortTitle}`,
    description: lesson.description,
    path: `/courses/${course.slug}/lectures/${lesson.slug}`,
    type: "article",
  });
}

export default async function LecturePage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, lesson } = found;
  const coursePath = `/courses/${course.slug}`;
  const topicPath = `${coursePath}/topics/${lesson.topic.slug}`;
  const lecturePath = `${coursePath}/lectures/${lesson.slug}`;
  // Ad breaks only between two blocks of reading, never next to a code box,
  // its Run button or output, or a picture (src/lib/ads/policy.ts).
  const breaks = lessonAdBreaks(
    lesson.sections.map((s) => ({ words: proseWords(s.bodyMd), hasCode: Boolean(s.code), hasImage: Boolean(s.image) })),
  );
  const availableAds = [
    ...(breaks.after_first_section !== null ? ["after_first_section"] : []),
    ...(breaks.mid_content !== null ? ["mid_content"] : []),
    "end",
  ];
  const [resources, practice, ads] = await Promise.all([
    listLessonResources(course, lesson.id),
    listLessonExercises(course, lesson.id),
    pageAds({ template: "lesson", path: lecturePath, courseId: course.courseId }, availableAds),
  ]);
  const crumbs = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: course.shortTitle, href: coursePath },
    { label: lesson.topic.title, href: topicPath },
    { label: lesson.title },
  ];
  const url = absoluteUrl(lecturePath);
  const lessonLd = url
    ? {
        "@context": "https://schema.org",
        "@type": "LearningResource",
        name: lesson.title,
        description: lesson.description,
        url,
        inLanguage: "en",
        isAccessibleForFree: true,
        learningResourceType: "Lecture",
        educationalLevel: lesson.difficulty === "easy" ? "Beginner" : lesson.difficulty === "medium" ? "Intermediate" : "Advanced",
        timeRequired: `PT${lesson.readingMinutes}M`,
        dateModified: new Date(lesson.updatedAt).toISOString(),
        ...(lesson.objectives.length ? { teaches: lesson.objectives } : {}),
        isPartOf: { "@type": "Course", name: course.title, url: absoluteUrl(coursePath) },
        publisher: { "@type": "Organization", name: SITE_NAME },
      }
    : null;
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: coursePath },
    { name: lesson.topic.title, path: topicPath },
    { name: lesson.title, path: lecturePath },
  ]);
  // "Runs Python in your browser", "Runs C++ in your browser" (or both).
  const runsIn = [
    ...new Set(lesson.sections.filter((s) => s.runnable).map((s) => (s.codeLanguage === "cpp" ? "C++" : "Python"))),
  ];

  return (
    <>
      {lessonLd ? <JsonLd data={lessonLd} /> : null}
      {crumbLd ? <JsonLd data={crumbLd} /> : null}
      <PageHero
        crumbs={crumbs}
        chapter={{ index: lesson.lectureNumber != null ? String(lesson.lectureNumber).padStart(2, "0") : undefined, label: lesson.topic.title }}
        title={lesson.title}
        description={lesson.description}
      >
        <p className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--lec-mute)]">
          <DifficultyBadge level={lesson.difficulty} />
          <span className="inline-flex items-center gap-1.5">
            <Clock aria-hidden="true" className="size-4" />
            {lesson.readingMinutes} min read
          </span>
          <span>
            Updated <time dateTime={isoDate(lesson.updatedAt)}>{formatDate(lesson.updatedAt)}</time>
          </span>
          {runsIn.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 text-[var(--lec-yel)]">
              <span aria-hidden="true" className="lec-shape lec-shape--circle" data-color="yel" />
              Runs {runsIn.join(" and ")} in your browser
            </span>
          ) : null}
        </p>
        <div className="mt-6 flex flex-wrap items-start gap-3">
          <LectureDone courseSlug={course.slug} lectureSlug={lesson.slug} place="top" />
          <BookmarkButton courseSlug={course.slug} kind="lecture" slug={lesson.slug} tone="stage" />
        </div>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <article aria-labelledby="lecture-title" className="min-w-0">
          <h2 id="lecture-title" className="sr-only">
            {lesson.title}
          </h2>
          <LessonToc sections={lesson.sections} variant="mobile" />

          {lesson.objectives.length > 0 || lesson.prerequisites.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:mt-0 md:grid-cols-2">
              {lesson.objectives.length > 0 ? (
                <section aria-labelledby="objectives-heading" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 md:col-span-2">
                  <h2 id="objectives-heading" className="flex items-center gap-2 text-lg font-semibold">
                    <Target aria-hidden="true" className="size-5 text-primary-text" />
                    By the end you can
                  </h2>
                  <ul className="mt-3 grid gap-2">
                    {lesson.objectives.map((objective) => (
                      <li key={objective} className="flex gap-2.5">
                        <span aria-hidden="true" className="lec-shape lec-shape--square mt-2 shrink-0" data-color="yel" />
                        <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(objective) }} />
                      </li>
                    ))}
                  </ul>
                </section>
              ) : null}
              {lesson.prerequisites.length > 0 ? (
                <section aria-labelledby="before-heading" className="rounded-[var(--radius-card)] border border-line bg-surface p-5 md:col-span-2">
                  <h2 id="before-heading" className="text-base font-semibold">
                    Before you start
                  </h2>
                  <ul className="mt-2 grid gap-1 text-muted">
                    {lesson.prerequisites.map((item) => (
                      <li key={item} dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
                    ))}
                  </ul>
                </section>
              ) : null}
            </div>
          ) : null}

          <div className="mt-12">
            {lesson.sections.map((section, index) => (
              <Fragment key={section.id}>
                <LessonSection section={section} index={index} course={course} />
                {index === breaks.after_first_section ? <AdSlot ads={ads} position="after_first_section" gap="my-14" /> : null}
                {index === breaks.mid_content ? <AdSlot ads={ads} position="mid_content" gap="my-14" /> : null}
              </Fragment>
            ))}
          </div>

          {practice.length > 0 ? (
            <section aria-labelledby="practice-heading" className="mt-14">
              <h2 id="practice-heading" className="text-2xl font-bold">
                Practise this lecture
              </h2>
              <p className="mt-1 text-muted">Each question is marked as soon as you answer, with an explanation.</p>
              <div className="mt-5">
                <ExerciseList courseSlug={course.slug} exercises={practice} />
              </div>
            </section>
          ) : null}

          {resources.length > 0 ? (
            <section aria-labelledby="resources-heading" className="mt-14">
              <h2 id="resources-heading" className="text-2xl font-bold">
                Slides and files for this lecture
              </h2>
              <ul className="mt-5 grid gap-3">
                {resources.map((resource) => {
                  const original = resource.files.find((f) => f.role === "original");
                  return (
                    <li key={resource.slug} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
                      <FileText aria-hidden="true" className="size-5 text-primary-text" />
                      <Link href={`${coursePath}/resources/${resource.slug}`} className="font-semibold hover:underline">
                        {resource.title}
                      </Link>
                      {resource.downloadable && original ? (
                        <a
                          href={`${coursePath}/resources/${resource.slug}/files/original`}
                          className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline"
                        >
                          <Download aria-hidden="true" className="size-4" />
                          Download ({formatBytes(original.sizeBytes)})
                        </a>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          <LectureDone courseSlug={course.slug} lectureSlug={lesson.slug} place="end" />

          <nav aria-label="Previous and next lecture" className="mt-16 grid gap-3 sm:grid-cols-2">
            {lesson.previous ? (
              <Link
                href={`${coursePath}/lectures/${lesson.previous.slug}`}
                rel="prev"
                className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 hover:border-primary"
              >
                <span className="inline-flex items-center gap-1.5 text-sm text-muted">
                  <ArrowLeft aria-hidden="true" className="size-4" /> Previous
                </span>
                <span className="mt-1 font-semibold">{lesson.previous.title}</span>
              </Link>
            ) : (
              <span className="hidden sm:block" />
            )}
            {lesson.next ? (
              <Link
                href={`${coursePath}/lectures/${lesson.next.slug}`}
                rel="next"
                className="group flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 text-right hover:border-primary"
              >
                <span className="inline-flex items-center justify-end gap-1.5 text-sm text-muted">
                  Next <ArrowRight aria-hidden="true" className="size-4" />
                </span>
                <span className="mt-1 font-semibold">{lesson.next.title}</span>
              </Link>
            ) : (
              <Link
                href={coursePath}
                className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-4 text-right hover:border-primary"
              >
                <span className="text-sm text-muted">That&apos;s the last lecture so far</span>
                <span className="mt-1 font-semibold">Back to {course.shortTitle}</span>
              </Link>
            )}
          </nav>

          {lesson.related.length > 0 ? (
            <section aria-labelledby="related-heading" className="mt-14">
              <h2 id="related-heading" className="text-2xl font-bold">
                Related lectures
              </h2>
              <div className="mt-5">
                <LectureList courseSlug={course.slug} lessons={lesson.related} />
              </div>
            </section>
          ) : null}

          <AdSlot ads={ads} position="end" gap="mt-20" />
        </article>

        <aside className="hidden lg:block">
          <LessonToc sections={lesson.sections} variant="sidebar" />
        </aside>
      </div>
      <CodeCopyEnhancer />
    </>
  );
}
