import { ArrowRight, LayoutDashboard, Settings } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { daysAgo, ProgressBar } from "@/components/dashboard/progress-bar";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button-styles";
import { EmptyState } from "@/components/ui/empty-state";
import { currentTime } from "@/lib/admin/time";
import { requireAccount } from "@/server/auth/account";
import { getAccount } from "@/server/students/accounts";
import { listCourseCards } from "@/server/students/dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const user = await requireAccount("/dashboard");
  const [cards, account] = await Promise.all([listCourseCards(user.id), getAccount(user.id)]);
  const now = currentTime();
  const first = (user.name || "").split(" ")[0];

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "My dashboard" }]}
        chapter={{ label: "My dashboard" }}
        title={first ? `Hi, *${first}*` : "My *dashboard*"}
        description="Your progress, course by course. Each course keeps its own progress, so scores are never mixed between courses."
      />
      <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
        {account?.mustChangePassword ? (
          <p role="status" className="mb-6 rounded-xl border border-medium/40 bg-medium-soft px-4 py-3 text-sm text-ink">
            You are using a temporary password from your teacher.{" "}
            <Link href="/settings#password" className="font-semibold underline">
              Choose your own password
            </Link>
            .
          </p>
        ) : null}
        {cards.length === 0 ? (
          <EmptyState icon={<LayoutDashboard aria-hidden="true" className="size-6" />} title="No courses yet">
            Courses will appear here once they are published.
          </EmptyState>
        ) : (
          <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cards.map((c) => (
              <li key={c.course.slug}>
                <article className="flex h-full flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">{c.course.shortTitle}</p>
                  <h2 className="mt-1 text-xl font-bold">{c.course.title}</h2>
                  <dl className="mt-5 grid gap-4 text-sm">
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1.5">
                      <dt className="text-muted">Lectures done</dt>
                      <dd className="font-mono font-bold">
                        {c.lecturesDone} / {c.lecturesTotal}
                      </dd>
                      <dd className="col-span-2">
                        <ProgressBar done={c.lecturesDone} total={c.lecturesTotal} label={`Lectures done in ${c.course.shortTitle}`} />
                      </dd>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-x-2 gap-y-1.5">
                      <dt className="text-muted">Questions solved</dt>
                      <dd className="font-mono font-bold">
                        {c.questionsSolved} / {c.questionsTotal}
                      </dd>
                      <dd className="col-span-2">
                        <ProgressBar done={c.questionsSolved} total={c.questionsTotal} label={`Questions solved in ${c.course.shortTitle}`} tone="sky" />
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted">Last studied</dt>
                      <dd>{c.lastActive ? daysAgo(c.lastActive, now) : "not started"}</dd>
                    </div>
                  </dl>
                  <div className="mt-auto flex flex-wrap gap-2 pt-6">
                    <Link href={`/dashboard/${c.course.slug}`} className={buttonClass("primary")}>
                      My progress
                      <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                    <Link href={`/courses/${c.course.slug}`} className={buttonClass("secondary")}>
                      Open the course
                    </Link>
                  </div>
                </article>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-8 text-muted">
          <Link href="/settings" className="inline-flex items-center gap-2 font-semibold text-primary-text underline-offset-4 hover:underline">
            <Settings aria-hidden="true" className="size-4" />
            Account settings
          </Link>{" "}
          has your name, password, recovery code and devices, and lets you download or delete your data.
        </p>
      </div>
    </>
  );
}
