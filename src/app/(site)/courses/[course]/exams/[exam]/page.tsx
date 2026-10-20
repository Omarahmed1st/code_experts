import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CourseNav } from "@/components/courses/course-nav";
import { PageHero } from "@/components/layout/page-hero";
import { AttemptIntro } from "@/components/practice/attempt-intro";
import { AttemptRunner } from "@/components/practice/attempt-runner";
import { getExam } from "@/server/assessments/catalog";
import { resolveCourse } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ course: string; exam: string }> };

async function load(params: Props["params"]) {
  const { course: courseSlug, exam: slug } = await params;
  const course = await resolveCourse(courseSlug);
  if (!course) return null;
  const exam = await getExam(course, slug);
  return exam ? { course, exam } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const found = await load(params);
  if (!found) return { title: "Practice exam not found", robots: { index: false } };
  const { course, exam } = found;
  return pageMetadata({
    title: `${exam.title} | ${course.shortTitle}`,
    description: `A timed practice exam for ${course.title}: ${exam.questionCount} random questions in ${Math.round(exam.timeLimitSec / 60)} minutes.`,
    path: `/courses/${course.slug}/exams/${exam.slug}`,
    index: false,
  });
}

export default async function ExamPage({ params }: Props) {
  const found = await load(params);
  if (!found) notFound();
  const { course, exam } = found;
  const coursePath = `/courses/${course.slug}`;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "Courses", href: "/courses" },
          { label: course.shortTitle, href: coursePath },
          { label: "Quizzes & exams", href: `${coursePath}/quizzes` },
          { label: exam.title },
        ]}
        chapter={{ label: "Practice exam" }}
        title={exam.title}
      >
        {exam.isDemo ? <p className="mt-4"><span className="demo-badge">Demo exam</span></p> : null}
      </PageHero>
      <CourseNav courseSlug={course.slug} courseTitle={course.title} current="quizzes" />
      <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
        <AttemptIntro
          descriptionHtml={exam.descriptionHtml}
          facts={[
            { label: "Questions", value: String(exam.questionCount) },
            { label: "Time", value: `${Math.round(exam.timeLimitSec / 60)} min` },
            { label: "Points", value: String(exam.totalPoints) },
            { label: "Pass mark", value: `${exam.passThreshold}%` },
          ]}
          rules={[
            "Every attempt draws a new random set of questions from this course.",
            "No hints, and no answers until you submit. Then you get your score, a breakdown by topic and every explanation.",
            "The timer keeps running if you leave the page. At 0:00 your answers are submitted for you.",
            "Your answers are saved in this browser as you go, so a reload doesn't lose them.",
          ]}
        />
        <AttemptRunner courseSlug={course.slug} kind="exam" slug={exam.slug} />
        <noscript>
          <p className="mt-4 rounded-xl border border-line bg-surface p-4">Practice exams need JavaScript turned on.</p>
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
