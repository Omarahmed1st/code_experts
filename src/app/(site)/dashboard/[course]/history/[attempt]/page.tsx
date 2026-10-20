import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttemptReview } from "@/components/dashboard/attempt-review";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { formatWhen } from "@/components/dashboard/progress-bar";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button-styles";
import { requireAccount } from "@/server/auth/account";
import { resolveCourse } from "@/server/courses/scope";
import { getAttemptReview } from "@/server/students/history";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string; attempt: string }> };

export const metadata: Metadata = { title: "Review an attempt", robots: { index: false, follow: false } };

const KIND = { quiz: "Quiz", exam: "Practice exam", custom: "Custom exam" } as const;

export default async function AttemptReviewPage({ params }: Props) {
  const { course: slug, attempt } = await params;
  const user = await requireAccount(`/dashboard/${slug}/history/${attempt}`);
  const course = await resolveCourse(slug);
  if (!course) notFound();
  const review = await getAttemptReview(user.id, course, attempt);
  if (!review) notFound();
  const { row } = review;
  const right = review.questions.filter((q) => q.correct).length;
  const minutes = row.submittedAt ? Math.max(1, Math.round((row.submittedAt - row.startedAt) / 60_000)) : null;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "My dashboard", href: "/dashboard" },
          { label: course.shortTitle, href: `/dashboard/${course.slug}` },
          { label: "History", href: `/dashboard/${course.slug}/history` },
          { label: row.title },
        ]}
        chapter={{ label: KIND[row.kind] }}
        title={row.title.replace(/\*/g, "")}
        description={`Taken ${formatWhen(row.startedAt)} (Cairo time)${minutes ? `, ${minutes} min` : ""}.`}
      >
        <div className="mt-7 flex flex-wrap items-center gap-6">
          <div
            className="quiz-score"
            style={{ ["--pct" as string]: row.percent ?? 0, ["--ring" as string]: row.passed ? "var(--lec-green)" : "var(--lec-coral)" }}
          >
            <div>
              <span className="text-3xl font-bold">{row.percent}%</span>
              <span className="text-xs text-[var(--lec-mute)]">
                {row.score} / {row.maxScore} points
              </span>
            </div>
          </div>
          <p className="text-lg">
            {row.passed ? <span className="lec-hot font-bold">Passed</span> : <span className="font-bold">Not passed</span>}: {right} of {review.questions.length} right.
            <span className="block text-sm text-[var(--lec-mute)]">Pass mark {review.passThreshold}%.</span>
          </p>
        </div>
      </PageHero>
      <DashboardNav courseSlug={course.slug} courseTitle={course.title} current="history" />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-4xl gap-6 px-4 pt-8 sm:px-6">
        {review.byTopic.length > 1 ? (
          <section aria-labelledby="topics-heading">
            <h2 id="topics-heading" className="text-xl font-bold">
              By topic
            </h2>
            <div className="table-wrap mt-3 rounded-[var(--radius-card)] border border-line bg-surface">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th scope="col" className="px-4 py-3">
                      Topic
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Right
                    </th>
                    <th scope="col" className="px-4 py-3">
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {review.byTopic.map((t) => (
                    <tr key={t.title} className="border-b border-line last:border-0">
                      <td className="px-4 py-3">{t.title}</td>
                      <td className="px-4 py-3">
                        {t.correct} of {t.total}
                      </td>
                      <td className="px-4 py-3">
                        {t.score} / {t.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}

        <h2 className="text-2xl font-bold">Your answers</h2>
        {review.questions.length === 0 ? (
          <p className="text-muted">The questions of this attempt are no longer on the site.</p>
        ) : (
          <AttemptReview questions={review.questions} />
        )}
        <p className="flex flex-wrap gap-3">
          <Link href={row.retakeHref} className={buttonClass("primary")}>
            {row.kind === "custom" ? "Build another exam" : "Take it again"}
          </Link>
          <Link href={`/dashboard/${course.slug}/history`} className={buttonClass("secondary")}>
            Back to my history
          </Link>
        </p>
      </div>
    </>
  );
}
