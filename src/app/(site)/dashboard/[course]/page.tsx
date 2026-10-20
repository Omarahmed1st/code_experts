import { ArrowRight, Award, Flame, Lightbulb, Lock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { AttemptTable } from "@/components/dashboard/attempt-table";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button-styles";
import { requireAccount } from "@/server/auth/account";
import { resolveCourse } from "@/server/courses/scope";
import { getCourseDashboard } from "@/server/students/dashboard";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  return { title: course ? `My progress | ${course.shortTitle}` : "My progress", robots: { index: false, follow: false } };
}

export default async function CourseDashboardPage({ params }: Props) {
  const slug = (await params).course;
  const user = await requireAccount(`/dashboard/${slug}`);
  const course = await resolveCourse(slug);
  if (!course) notFound();
  const d = await getCourseDashboard(user.id, course);
  const accuracy = d.answers > 0 ? Math.round((d.right * 100) / d.answers) : null;

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "My dashboard", href: "/dashboard" }, { label: course.shortTitle }]}
        chapter={{ label: course.shortTitle }}
        title="My *progress*"
        description={`Everything you have done in ${course.title}. Only this course is counted here.`}
      >
        <dl className="mt-7 grid grid-cols-2 gap-x-8 gap-y-4 text-sm sm:flex sm:flex-wrap">
          <div>
            <dt className="text-[var(--lec-mute)]">Lectures done</dt>
            <dd className="font-mono text-2xl font-bold text-[var(--lec-green)]">
              {d.lecturesDone}
              <span className="text-base text-[var(--lec-mute)]"> / {d.lecturesTotal}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--lec-mute)]">Questions solved</dt>
            <dd className="font-mono text-2xl font-bold text-[var(--lec-sky)]">
              {d.questionsSolved}
              <span className="text-base text-[var(--lec-mute)]"> / {d.questionsTotal}</span>
            </dd>
          </div>
          <div>
            <dt className="text-[var(--lec-mute)]">Answers right</dt>
            <dd className="font-mono text-2xl font-bold text-[var(--lec-yel)]">{accuracy === null ? "–" : `${accuracy}%`}</dd>
          </div>
          <div>
            <dt className="text-[var(--lec-mute)]">Days in a row</dt>
            <dd className="inline-flex items-center gap-1.5 font-mono text-2xl font-bold text-[var(--lec-coral)]">
              <Flame aria-hidden="true" className="size-5" />
              {d.streak.current}
            </dd>
          </div>
        </dl>
      </PageHero>
      <DashboardNav courseSlug={course.slug} courseTitle={course.title} current="overview" />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-10 px-4 pt-8 sm:px-6">
        <section aria-labelledby="next-heading">
          <h2 id="next-heading" className="flex items-center gap-2 text-2xl font-bold">
            <Lightbulb aria-hidden="true" className="size-6 text-primary-text" />
            What to do next
          </h2>
          {d.recommendations.length === 0 ? (
            <p className="mt-3 text-muted">You have read every lecture and solved every question you tried. Try a quiz or build your own exam.</p>
          ) : (
            <ul className="mt-4 grid gap-3 md:grid-cols-2">
              {d.recommendations.map((r) => (
                <li key={r.kind}>
                  <Link href={r.href} className="group flex h-full items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card hover:border-primary">
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{r.title}</span>
                      <span className="mt-1 block text-sm text-muted">{r.reason}</span>
                    </span>
                    <ArrowRight aria-hidden="true" className="mt-1 size-5 shrink-0 text-primary-text transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent-heading">
          <div className="flex flex-wrap items-baseline gap-3">
            <h2 id="recent-heading" className="text-2xl font-bold">
              Recent quizzes and exams
            </h2>
            {d.attemptsCount > 0 ? (
              <Link href={`/dashboard/${course.slug}/history`} className="text-sm font-semibold text-primary-text hover:underline">
                All {d.attemptsCount} in your history
              </Link>
            ) : null}
          </div>
          {d.recentAttempts.length === 0 ? (
            <p className="mt-3 text-muted">
              None yet.{" "}
              <Link href={`/courses/${course.slug}/quizzes`} className="font-semibold text-primary-text hover:underline">
                Take a quiz
              </Link>{" "}
              and your results will be kept here.
            </p>
          ) : (
            <div className="mt-4">
              <AttemptTable rows={d.recentAttempts} />
            </div>
          )}
        </section>

        <section aria-labelledby="badges-heading">
          <h2 id="badges-heading" className="flex items-center gap-2 text-2xl font-bold">
            <Award aria-hidden="true" className="size-6 text-primary-text" />
            Achievements in this course
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {d.achievements.map((a) => (
              <li
                key={a.slug}
                className={`flex items-start gap-3 rounded-[var(--radius-card)] border p-4 ${a.earnedAt ? "border-easy/50 bg-easy-soft" : "border-dashed border-line-strong bg-surface"}`}
              >
                <span
                  aria-hidden="true"
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${a.earnedAt ? "bg-navy text-[#ffd43b]" : "bg-surface-2 text-muted"}`}
                >
                  {a.earnedAt ? <Award className="size-5" /> : <Lock className="size-4" />}
                </span>
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {a.title}
                    <span className="sr-only">{a.earnedAt ? " (earned)" : " (not earned yet)"}</span>
                  </span>
                  <span className="block text-sm text-muted">{a.description}</span>
                  {a.progress ? <span className="mt-1 block font-mono text-xs text-muted">{a.progress}</span> : null}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <p className="flex flex-wrap gap-3">
          <Link href={`/dashboard/${course.slug}/progress`} className={buttonClass("secondary")}>
            Progress by topic
          </Link>
          <Link href={`/dashboard/${course.slug}/bookmarks`} className={buttonClass("secondary")}>
            Bookmarks ({d.bookmarksCount})
          </Link>
        </p>
      </div>
    </>
  );
}
