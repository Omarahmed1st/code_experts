import { CheckCircle2, CircleDashed, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptTable } from "@/components/dashboard/attempt-table";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { formatWhen } from "@/components/dashboard/progress-bar";
import { PageHero } from "@/components/layout/page-hero";
import { requireAccount } from "@/server/auth/account";
import { resolveCourse } from "@/server/courses/scope";
import { EXERCISE_TYPE_LABEL, type ExerciseType } from "@/server/exercises/catalog";
import { listAttempts, listPracticeAnswers } from "@/server/students/history";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  return { title: course ? `My history | ${course.shortTitle}` : "My history", robots: { index: false, follow: false } };
}

/** Code answers the server can't mark: what the student's own browser said about its test run. */
function selfCheckText(selfCheck: "passed" | "failed" | null): string {
  if (selfCheck === "passed") return "tests passed in your browser (not marked)";
  if (selfCheck === "failed") return "some tests failed in your browser";
  return "not marked";
}

export default async function HistoryPage({ params }: Props) {
  const slug = (await params).course;
  const user = await requireAccount(`/dashboard/${slug}/history`);
  const course = await resolveCourse(slug);
  if (!course) notFound();
  const [attempts, practice] = await Promise.all([listAttempts(user.id, course, 100), listPracticeAnswers(user.id, course, 30)]);
  const base = `/courses/${course.slug}`;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "My dashboard", href: "/dashboard" },
          { label: course.shortTitle, href: `/dashboard/${course.slug}` },
          { label: "History" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="My *history*"
        description="Every quiz and exam you took in this course while signed in, and your latest practice answers. Open a submitted one to see your answers again."
      />
      <DashboardNav courseSlug={course.slug} courseTitle={course.title} current="history" />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-10 px-4 pt-8 sm:px-6">
        <section aria-labelledby="attempts-heading">
          <h2 id="attempts-heading" className="text-2xl font-bold">
            Quizzes and exams
          </h2>
          {attempts.length === 0 ? (
            <p className="mt-3 text-muted">
              Nothing yet.{" "}
              <Link href={`${base}/quizzes`} className="font-semibold text-primary-text hover:underline">
                Quizzes
              </Link>
              ,{" "}
              <Link href={`${base}/exams`} className="font-semibold text-primary-text hover:underline">
                practice exams
              </Link>{" "}
              and{" "}
              <Link href={`${base}/build-exam`} className="font-semibold text-primary-text hover:underline">
                exams you build
              </Link>{" "}
              are kept here.
            </p>
          ) : (
            <div className="mt-4">
              <AttemptTable rows={attempts} />
            </div>
          )}
        </section>

        <section aria-labelledby="practice-heading">
          <h2 id="practice-heading" className="text-2xl font-bold">
            Latest practice answers
          </h2>
          {practice.length === 0 ? (
            <p className="mt-3 text-muted">
              None yet.{" "}
              <Link href={`${base}/practice`} className="font-semibold text-primary-text hover:underline">
                Start practising
              </Link>
              .
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
              {practice.map((p, i) => (
                <li key={`${p.slug}-${p.at}-${i}`}>
                  <Link href={`${base}/exercises/${p.slug}`} className="flex min-h-12 flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 hover:bg-surface-2">
                    {p.correct ? (
                      <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-easy" />
                    ) : p.correct === false ? (
                      <XCircle aria-hidden="true" className="size-4 shrink-0 text-hard" />
                    ) : (
                      <CircleDashed aria-hidden="true" className="size-4 shrink-0 text-muted" />
                    )}
                    <span className="sr-only">{p.correct ? "Right:" : p.correct === false ? "Wrong:" : "Not marked:"}</span>
                    <span className="min-w-0 flex-1 basis-48 font-semibold">{p.title}</span>
                    <span className="ml-7 whitespace-nowrap text-xs text-muted sm:ml-0">
                      {EXERCISE_TYPE_LABEL[p.type as ExerciseType] ?? p.type}
                      {p.correct === null ? ` · ${selfCheckText(p.selfCheck)}` : ""} · {formatWhen(p.at)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
