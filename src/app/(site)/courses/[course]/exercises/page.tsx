import { ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { ExerciseList } from "@/components/practice/exercise-list";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClass } from "@/components/ui/button-styles";
import { resolveCourse } from "@/server/courses/scope";
import {
  type Difficulty,
  EXERCISE_TYPE_LABEL,
  type ExerciseType,
  countExercisesByType,
  listExerciseTopics,
  listExercises,
} from "@/server/exercises/catalog";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ course: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

const TYPES = Object.keys(EXERCISE_TYPE_LABEL) as ExerciseType[];
const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

function readFilters(sp: Record<string, string | string[] | undefined>) {
  const type = one(sp.type);
  const difficulty = one(sp.difficulty);
  const topic = one(sp.topic);
  return {
    type: TYPES.includes(type as ExerciseType) ? (type as ExerciseType) : undefined,
    difficulty: DIFFICULTIES.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : undefined,
    topic: topic && /^[a-z0-9-]{1,80}$/.test(topic) ? topic : undefined,
  };
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  const filters = readFilters(await searchParams);
  const filtered = Boolean(filters.type || filters.difficulty || filters.topic);
  const count = (await listExercises(course)).length;
  return pageMetadata({
    title: `Exercises | ${course.shortTitle}`,
    description: `Practice questions for ${course.title}: multiple choice, trace the code, correct the code and write the code, with explanations.`,
    path: `/courses/${course.slug}/exercises`,
    index: count > 0 && !filtered,
  });
}

export default async function ExercisesPage({ params, searchParams }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const filters = readFilters(await searchParams);
  const [exercises, topics, counts] = await Promise.all([listExercises(course, filters), listExerciseTopics(course), countExercisesByType(course)]);
  const coursePath = `/courses/${course.slug}`;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const select = "min-h-11 rounded-xl border border-line-strong bg-surface px-3 text-sm";

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Exercises" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Practice *questions*"
        description={`${total} questions for ${course.title}. Every answer is marked straight away and explained.`}
      >
        <p className="mt-6 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--lec-mute)]">
          {TYPES.map((t) => (
            <span key={t}>
              {EXERCISE_TYPE_LABEL[t]}: <b className="text-[var(--lec-ink)]">{counts[t]}</b>
            </span>
          ))}
        </p>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="exercises" />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        <form method="get" className="flex flex-wrap items-end gap-3" aria-label="Filter the questions">
          <label className="grid gap-1 text-sm font-semibold">
            Type
            <select name="type" defaultValue={filters.type ?? ""} className={select}>
              <option value="">All types</option>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {EXERCISE_TYPE_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Difficulty
            <select name="difficulty" defaultValue={filters.difficulty ?? ""} className={select}>
              <option value="">Any</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d[0]!.toUpperCase() + d.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Topic
            <select name="topic" defaultValue={filters.topic ?? ""} className={select}>
              <option value="">All topics</option>
              {topics.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.title}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={buttonClass("primary")}>
            Show
          </button>
          {filters.type || filters.difficulty || filters.topic ? (
            <Link href={`${coursePath}/exercises`} className={buttonClass("ghost")}>
              Clear filters
            </Link>
          ) : null}
          <Link href={`${coursePath}/practice`} className={buttonClass("secondary", "ml-auto")}>
            Random practice set
          </Link>
        </form>

        <p className="mt-6 text-sm text-muted" aria-live="polite">
          {exercises.length} {exercises.length === 1 ? "question" : "questions"}
        </p>
        <div className="mt-3">
          {exercises.length === 0 ? (
            <EmptyState icon={<ListChecks aria-hidden="true" className="size-6" />} title="No questions match">
              {total === 0 ? "Questions for this course are on the way." : "Try another type, difficulty or topic."}
            </EmptyState>
          ) : (
            <ExerciseList courseSlug={course.slug} exercises={exercises} />
          )}
        </div>
      </div>
    </>
  );
}
