import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { BookmarkButton } from "@/components/account/bookmark-button";
import { PageHero } from "@/components/layout/page-hero";
import { AttemptIntro } from "@/components/practice/attempt-intro";
import { AttemptRunner } from "@/components/practice/attempt-runner";
import { getQuiz } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { EXERCISE_TYPE_LABEL, type ExerciseType } from "@/server/exercises/catalog";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; quiz: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, quiz: slug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const quiz = await getQuiz(course, slug);
  return quiz ? { course, quiz } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Quiz not found", robots: { index: false } };
  const { course, quiz } = found;
  return pageMetadata({
    title: `${quiz.title} | ${course.shortTitle} quiz`,
    description: `A ${quiz.questionCount}-question quiz for ${course.title}${quiz.timeLimitSec ? `, ${Math.round(quiz.timeLimitSec / 60)} minutes` : ""}, marked with explanations.`,
    path: `/courses/${course.slug}/quizzes/${quiz.slug}`,
    // The page is a quiz app; its questions are indexed on their own exercise pages.
    index: false,
  });
}

export default async function QuizPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, quiz } = found;
  const coursePath = `/courses/${course.slug}`;
  const models = quiz.models.length;
  // With several models the mix differs a little between them, so no counts.
  const types = Object.entries(quiz.types)
    .map(([t, n]) => `${models > 1 ? "" : `${n} `}${EXERCISE_TYPE_LABEL[t as ExerciseType]?.toLowerCase() ?? t}`)
    .join(", ");
  const exam = quiz.mode === "exam";

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Quizzes & exams", href: `${coursePath}/quizzes` },
          { label: quiz.title },
        ]}
        chapter={{ label: exam ? "Quiz · exam mode" : "Practice quiz" }}
        title={quiz.title}
      >
        {quiz.isDemo ? <p className="mt-4"><span className="demo-badge">Demo quiz</span></p> : null}
        <div className="mt-5">
          <BookmarkButton courseSlug={course.slug} kind="quiz" slug={quiz.slug} tone="stage" />
        </div>
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="quizzes" />
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <AttemptIntro
          descriptionHtml={quiz.descriptionHtml}
          facts={[
            { label: "Questions", value: String(quiz.questionCount) },
            { label: "Time", value: quiz.timeLimitSec ? `${Math.round(quiz.timeLimitSec / 60)} min` : "No limit" },
            { label: "Points", value: String(quiz.totalPoints) },
            { label: "Pass mark", value: `${quiz.passThreshold}%` },
          ]}
          rules={[
            ...(models > 1
              ? [
                  `This quiz comes in ${models} models (${quiz.models[0]!.label} to ${quiz.models.at(-1)!.label}) with different questions. Each attempt gets one at random, different from the one you had last time.`,
                ]
              : []),
            `Questions: ${types}.`,
            exam
              ? "Exam mode: you see whether you were right, and why, only after you submit."
              : "Press Check after each question to see if you were right, with the explanation.",
            quiz.timeLimitSec ? "The timer keeps running if you leave the page. At 0:00 your answers are submitted for you." : "Take as long as you like.",
            ...(quiz.maxAttempts
              ? [
                  `You get ${quiz.maxAttempts} ${quiz.maxAttempts === 1 ? "attempt" : "attempts"} in any 24 hours, counted on your account, so you need to sign in (a free account is enough). After that the quiz locks until 24 hours after your first attempt.`,
                ]
              : []),
            "Your answers are saved in this browser as you go, so a reload doesn't lose them.",
          ]}
        />
        <AttemptRunner courseSlug={course.slug} kind="quiz" slug={quiz.slug} limited={quiz.maxAttempts !== null} />
        <noscript>
          <p className="mt-4 rounded-xl border border-line bg-surface p-4">Quizzes need JavaScript turned on.</p>
        </noscript>
        <p className="mt-8">
          <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/quizzes`}>
            ← All {course.shortTitle} quizzes and exams
          </Link>
        </p>
      </div>
    </>
  );
}
