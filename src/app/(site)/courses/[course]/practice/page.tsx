import { Dices } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { MistakesCard } from "@/components/practice/mistakes-card";
import { PracticeSet } from "@/components/practice/practice-set";
import { buttonClass } from "@/components/ui/button-styles";
import type { Crumb } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { shuffled } from "@/lib/grading/scoring";
import { resolveCourse } from "@/server/courses/scope";
import {
  type Difficulty,
  EXERCISE_TYPE_LABEL,
  type ExerciseType,
  type PublicExercise,
  getPublicExercises,
  idsForSlugs,
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
const COUNTS = [5, 10, 15, 20];
const one = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

function readRequest(sp: Record<string, string | string[] | undefined>) {
  const type = one(sp.type);
  const difficulty = one(sp.difficulty);
  const topic = one(sp.topic);
  const count = Number(one(sp.count));
  const retry = (one(sp.retry) ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 50);
  return {
    start: one(sp.set) === "1",
    retry,
    count: COUNTS.includes(count) ? count : 10,
    filters: {
      type: TYPES.includes(type as ExerciseType) ? (type as ExerciseType) : undefined,
      difficulty: DIFFICULTIES.includes(difficulty as Difficulty) ? (difficulty as Difficulty) : undefined,
      topic: topic && /^[a-z0-9-]{1,80}$/.test(topic) ? topic : undefined,
    },
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  return pageMetadata({
    title: `Practice | ${course.shortTitle}`,
    description: `Random practice sets for ${course.title}, and a quick way to retry the questions you got wrong.`,
    path: `/courses/${course.slug}/practice`,
    // Practice sets are random and personal: nothing here for search engines.
    index: false,
  });
}

/** A fresh option order for each multiple choice question (unless the author turned it off). */
function withShuffledOptions(questions: PublicExercise[]): PublicExercise[] {
  return questions.map((q) => (q.type === "mcq" && q.shuffleOptions ? { ...q, options: shuffled(q.options, Math.random) } : q));
}

export default async function PracticePage({ params, searchParams }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const request = readRequest(await searchParams);
  const coursePath = `/courses/${course.slug}`;
  const crumbs: Crumb[] = [
    { label: "Home", href: "/" },
    { label: "Courses", href: "/courses" },
    { label: course.shortTitle, href: coursePath },
  ];
  const inSet = request.start || request.retry.length > 0;
  crumbs.push(inSet ? { label: "Practice", href: `${coursePath}/practice` } : { label: "Practice" });

  // A set of questions: either "retry these" or a random draw with the chosen filters.
  if (inSet) {
    let questions: PublicExercise[];
    let againHref: string;
    let title: string;
    if (request.retry.length > 0) {
      questions = await getPublicExercises(course, await idsForSlugs(course, request.retry));
      // Keep the order the student asked for.
      questions.sort((a, b) => request.retry.indexOf(a.slug) - request.retry.indexOf(b.slug));
      againHref = `${coursePath}/practice?retry=${request.retry.join(",")}`;
      title = "Retry *mistakes*";
    } else {
      const pool = await listExercises(course, request.filters);
      const picked = shuffled(pool, Math.random).slice(0, request.count);
      questions = await getPublicExercises(
        course,
        picked.map((p) => p.id),
      );
      const qs = new URLSearchParams({ set: "1", count: String(request.count) });
      for (const [k, v] of Object.entries(request.filters)) if (v) qs.set(k, v);
      againHref = `${coursePath}/practice?${qs.toString()}`;
      title = "Practice *set*";
    }
    return (
      <>
        <PageHero
          crumbs={[...crumbs, { label: request.retry.length ? "Retry" : "Set" }]}
          chapter={{ label: course.shortTitle }}
          title={title}
          description={
            questions.length > 0
              ? `${questions.length} ${questions.length === 1 ? "question" : "questions"}, marked one at a time. Not timed and not scored.`
              : undefined
          }
        />
        <CourseNav courseSlug={course.slug} courseTitle={course.title} current="practice" />
        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          {questions.length === 0 ? (
            <EmptyState
              icon={<Dices aria-hidden="true" className="size-6" />}
              title="No questions match"
              action={
                <Link className={buttonClass("primary")} href={`${coursePath}/practice`}>
                  Choose again
                </Link>
              }
            >
              {request.retry.length ? "Those questions aren't available any more." : "Try another type, difficulty or topic."}
            </EmptyState>
          ) : (
            <PracticeSet questions={withShuffledOptions(questions)} courseSlug={course.slug} againHref={againHref} />
          )}
        </div>
      </>
    );
  }

  // The hub: build a random set, or retry mistakes.
  const [topics, all] = await Promise.all([listExerciseTopics(course), listExercises(course)]);
  const select = "min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm";
  return (
    <>
      <PageHero
        crumbs={crumbs}
        chapter={{ label: course.shortTitle }}
        title="Practise at *your pace*"
        description="Pick a mix of questions, answer them one at a time, and see the explanation after each one. Nothing is timed or scored."
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="practice" />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {all.length === 0 ? (
          <EmptyState icon={<Dices aria-hidden="true" className="size-6" />} title="No questions yet">
            Questions for this course are on the way.
          </EmptyState>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <section aria-labelledby="set-heading" className="q-card">
              <h2 id="set-heading" className="text-xl font-bold">
                A random practice set
              </h2>
              <p className="mt-1 text-muted">Questions are drawn from all {all.length} in this course that match your choices.</p>
              <form method="get" className="mt-5 grid gap-4 sm:grid-cols-2">
                <input type="hidden" name="set" value="1" />
                <label className="grid gap-1 text-sm font-semibold">
                  How many
                  <select name="count" defaultValue="10" className={select}>
                    {COUNTS.map((n) => (
                      <option key={n} value={n}>
                        {n} questions
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Type
                  <select name="type" defaultValue="" className={select}>
                    <option value="">Mixed types</option>
                    {TYPES.map((t) => (
                      <option key={t} value={t}>
                        {EXERCISE_TYPE_LABEL[t]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-1 text-sm font-semibold">
                  Difficulty
                  <select name="difficulty" defaultValue="" className={select}>
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
                  <select name="topic" defaultValue="" className={select}>
                    <option value="">All topics</option>
                    {topics.map((t) => (
                      <option key={t.slug} value={t.slug}>
                        {t.title}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="sm:col-span-2">
                  <button type="submit" className={buttonClass("primary")}>
                    <Dices aria-hidden="true" className="size-4" />
                    Start a practice set
                  </button>
                </div>
              </form>
            </section>
            <MistakesCard courseSlug={course.slug} />
          </div>
        )}
        <p className="mt-8 text-muted">
          Want a score?{" "}
          <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/quizzes`}>
            Take a quiz or a practice exam
          </Link>
          . Or browse{" "}
          <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/exercises`}>
            every question
          </Link>
          .
        </p>
      </div>
    </>
  );
}
