import { Shuffle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { ExamCards } from "@/components/practice/assessment-cards";
import { EmptyState } from "@/components/ui/empty-state";
import { listExams } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  if (!course) return { title: "Course not found", robots: { index: false } };
  return pageMetadata({
    title: `Practice exams | ${course.shortTitle}`,
    description: `Timed practice exams for ${course.title} with a new random set of questions on every attempt.`,
    path: `/courses/${course.slug}/exams`,
    // The quizzes page lists the same exams; that one is indexed.
    index: false,
  });
}

export default async function ExamsPage({ params }: Props) {
  const course = await resolveCourse((await params).course);
  if (!course) notFound();
  const exams = await listExams(course);
  const coursePath = `/courses/${course.slug}`;
  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Quizzes & exams", href: `${coursePath}/quizzes` },
          { label: "Practice exams" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Practice *exams*"
        description="Timed, with a new random set of questions from this course on every attempt."
      />
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="quizzes" />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {exams.length === 0 ? (
          <EmptyState icon={<Shuffle aria-hidden="true" className="size-6" />} title="No practice exams yet">
            Practice exams for this course are on the way.{" "}
            <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`${coursePath}/quizzes`}>
              Try a quiz
            </Link>{" "}
            instead.
          </EmptyState>
        ) : (
          <ExamCards courseSlug={course.slug} exams={exams} />
        )}
      </div>
    </>
  );
}
