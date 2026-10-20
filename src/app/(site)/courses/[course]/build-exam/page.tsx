import { Layers } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { CustomExamBuilder } from "@/components/practice/custom-exam-builder";
import { EmptyState } from "@/components/ui/empty-state";
import { CUSTOM_COUNTS, CUSTOM_MINUTES } from "@/server/assessments/attempts";
import { listPracticeTopics } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ course: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  return pageMetadata({
    title: `Build your own exam | ${course.shortTitle}`,
    description: `Pick the ${course.title} topics you want to train on, how many questions and a timer, and get a marked exam.`,
    path: `/courses/${course.slug}/build-exam`,
    index: false,
  });
}

export default async function BuildExamPage({ params, searchParams }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const topic = (await searchParams).topic;
  const topics = await listPracticeTopics(course);
  const coursePath = `/courses/${course.slug}`;
  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Quizzes & exams", href: `${coursePath}/quizzes` },
          { label: "Build your own exam" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Build your *own exam*"
        description="Mix the topics you want to train on. Every exam draws new questions, spread evenly over your topics, and marks them like a real exam."
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="quizzes" />
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        {topics.length === 0 ? (
          <EmptyState icon={<Layers aria-hidden="true" className="size-6" />} title="No questions yet">
            This course doesn&apos;t have questions to build an exam from yet.
          </EmptyState>
        ) : (
          <CustomExamBuilder
            courseSlug={course.slug}
            topics={topics}
            counts={CUSTOM_COUNTS}
            minutes={CUSTOM_MINUTES}
            {...(typeof topic === "string" ? { initialTopic: topic } : {})}
          />
        )}
        <noscript>
          <p className="mt-4 rounded-xl border border-line bg-surface p-4">Exams need JavaScript turned on.</p>
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
