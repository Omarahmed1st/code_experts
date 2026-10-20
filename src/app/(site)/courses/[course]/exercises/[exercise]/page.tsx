import { BookOpen } from "lucide-react";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/ad-slot";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { BookmarkButton } from "@/components/account/bookmark-button";
import { PageHero } from "@/components/layout/page-hero";
import { PracticeQuestion } from "@/components/practice/practice-question";
import { JsonLd } from "@/components/seo/json-ld";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import { shuffled } from "@/lib/grading/scoring";
import { resolveCourse } from "@/server/courses/scope";
import { ASK_LABEL } from "@/lib/exercise/ask";
import { EXERCISE_TYPE_LABEL, exerciseHasExplanation, getPublicExercise } from "@/server/exercises/catalog";
import { breadcrumbJsonLd, pageMetadata } from "@/server/seo";
import { pageAds } from "@/server/ads/settings";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; exercise: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, exercise: slug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const exercise = await getPublicExercise(course, slug);
  return exercise ? { course, exercise } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Exercise not found", robots: { index: false } };
  const { course, exercise } = found;
  return pageMetadata({
    title: `${exercise.title}: ${(exercise.ask ? ASK_LABEL[exercise.ask] : EXERCISE_TYPE_LABEL[exercise.type]).toLowerCase()} | ${course.shortTitle}`,
    description: `${(exercise.ask ? ASK_LABEL[exercise.ask] : EXERCISE_TYPE_LABEL[exercise.type])} practice question on ${exercise.topic?.title ?? course.title}, with hints and a full explanation.`,
    path: `/courses/${course.slug}/exercises/${exercise.slug}`,
    // Indexed only when it has a real explanation (and isn't a demonstration).
    index: !exercise.isDemo && (await exerciseHasExplanation(course, exercise.id)),
  });
}

export default async function ExercisePage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, exercise } = found;
  const coursePath = `/courses/${course.slug}`;
  const exercisePath = `${coursePath}/exercises/${exercise.slug}`;
  // Demo questions are placeholders, so never carry an ad (thin content).
  const ads = await pageAds({ template: "exercise", path: exercisePath, courseId: course.courseId }, exercise.isDemo ? [] : ["below_question"]);
  // A fresh option order on each visit (the author can turn shuffling off).
  const q = exercise.type === "mcq" && exercise.shuffleOptions ? { ...exercise, options: shuffled(exercise.options, Math.random) } : exercise;
  const crumbLd = breadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Courses", path: "/courses" },
    { name: course.title, path: coursePath },
    { name: "Exercises", path: `${coursePath}/exercises` },
    { name: exercise.title, path: `${coursePath}/exercises/${exercise.slug}` },
  ]);

  return (
    <>
      {crumbLd ? <JsonLd data={crumbLd} /> : null}
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Exercises", href: `${coursePath}/exercises` },
          { label: exercise.title },
        ]}
        chapter={{ label: (exercise.ask ? ASK_LABEL[exercise.ask] : EXERCISE_TYPE_LABEL[exercise.type]) }}
        title={exercise.title}
      >
        <p className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--lec-mute)]">
          <DifficultyBadge level={exercise.difficulty} />
          {exercise.topic ? (
            <Link className="underline-offset-4 hover:underline" href={`${coursePath}/topics/${exercise.topic.slug}`}>
              {exercise.topic.title}
            </Link>
          ) : null}
          {exercise.isDemo ? <span className="demo-badge">Demo question</span> : null}
        </p>
        <div className="mt-5">
          <BookmarkButton courseSlug={course.slug} kind="question" slug={exercise.slug} tone="stage" />
        </div>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="exercises" />
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <PracticeQuestion q={q} courseSlug={course.slug} />
        <noscript>
          <p className="mt-4 rounded-xl border border-line bg-surface p-4">Checking answers needs JavaScript. You can still read the question and the code.</p>
        </noscript>
        {exercise.lesson ? (
          <p className="mt-8 flex items-start gap-2 text-muted">
            <BookOpen aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-text" />
            <span>
              Practises the lecture{" "}
              <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/lectures/${exercise.lesson.slug}`}>
                {exercise.lesson.title}
              </Link>
            </span>
          </p>
        ) : null}
        <p className="mt-3">
          <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/exercises`}>
            ← All {course.shortTitle} exercises
          </Link>
        </p>
        <AdSlot ads={ads} position="below_question" gap="mt-20" />
      </div>
    </>
  );
}
