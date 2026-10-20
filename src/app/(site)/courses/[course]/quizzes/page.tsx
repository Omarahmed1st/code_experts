import { ArrowRight, ClipboardList, Layers } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { ExamCards, QuizCards } from "@/components/practice/assessment-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { listExams, listPracticeTopics, listQuizzes } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  const [quizzes, exams] = await Promise.all([listQuizzes(course), listExams(course)]);
  return pageMetadata({
    title: `Quizzes and practice exams | ${course.shortTitle}`,
    description: `Scored quizzes and timed practice exams for ${course.title}, marked straight away with explanations.`,
    path: `/courses/${course.slug}/quizzes`,
    index: quizzes.length + exams.length > 0,
  });
}

export default async function QuizzesPage({ params }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const [quizzes, exams, practiceTopics] = await Promise.all([listQuizzes(course), listExams(course), listPracticeTopics(course)]);
  const coursePath = `/courses/${course.slug}`;
  const mixed = quizzes.filter((q) => q.topic === null);
  const byTopic = quizzes.filter((q) => q.topic !== null);

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Quizzes & exams" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Quizzes and *exams*"
        description="Test yourself with a score at the end. Answers are marked on the server, and every question comes with its explanation."
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="quizzes" />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {quizzes.length + exams.length === 0 ? (
          <EmptyState icon={<ClipboardList aria-hidden="true" className="size-6" />} title="No quizzes yet">
            Quizzes for this course are on the way. Meanwhile, every exercise is marked as you go.
          </EmptyState>
        ) : null}
        {practiceTopics.length > 1 ? (
          <Link
            href={`${coursePath}/build-exam`}
            className="lec-cinema mb-10 flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] p-6 hover:outline hover:outline-2 hover:outline-[var(--lec-yel)]"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-[var(--lec-yel)] text-[#14213d]">
              <Layers aria-hidden="true" className="size-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xl font-bold">Build your own exam</span>
              <span className="block text-[var(--lec-mute)]">
                Mix any of the {practiceTopics.length} topics, choose how many questions and a timer, and train on exactly what you need.
              </span>
            </span>
            <ArrowRight aria-hidden="true" className="size-6 text-[var(--lec-yel)]" />
          </Link>
        ) : null}
        {mixed.length > 0 ? (
          <section aria-labelledby="quizzes-heading">
            <h2 id="quizzes-heading" className="text-2xl font-bold">
              Quizzes
            </h2>
            <p className="mt-1 text-muted">The same questions every time. Practice quizzes mark each answer as you go; exam mode waits until you submit.</p>
            <div className="mt-4">
              <QuizCards courseSlug={course.slug} quizzes={mixed} />
            </div>
          </section>
        ) : null}
        {byTopic.length > 0 ? (
          <section aria-labelledby="topic-quizzes-heading" className={mixed.length > 0 ? "mt-10" : undefined}>
            <h2 id="topic-quizzes-heading" className="text-2xl font-bold">
              A quiz for each topic
            </h2>
            <p className="mt-1 text-muted">Short practice quizzes, in course order. Each answer is marked as you go.</p>
            <div className="mt-4">
              <QuizCards courseSlug={course.slug} quizzes={byTopic} />
            </div>
          </section>
        ) : null}
        {exams.length > 0 ? (
          <section aria-labelledby="exams-heading" id="exams" className="mt-10 scroll-mt-24">
            <h2 id="exams-heading" className="text-2xl font-bold">
              Practice exams
            </h2>
            <p className="mt-1 text-muted">Timed, with a new random set of questions from this course on every attempt.</p>
            <div className="mt-4">
              <ExamCards courseSlug={course.slug} exams={exams} />
            </div>
          </section>
        ) : null}
        <p className="mt-10 text-sm text-muted">
          Write-the-code questions aren&apos;t in quizzes or exams yet: they run in your own browser, so they&apos;re for practice only.
        </p>
      </div>
    </>
  );
}
