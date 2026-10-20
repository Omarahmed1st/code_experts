import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { PageHero } from "@/components/layout/page-hero";
import { requireAccount } from "@/server/auth/account";
import { resolveCourse } from "@/server/courses/scope";
import { getCourseDashboard } from "@/server/students/dashboard";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  return { title: course ? `Progress by topic | ${course.shortTitle}` : "Progress by topic", robots: { index: false, follow: false } };
}

export default async function TopicProgressPage({ params }: Props) {
  const slug = (await params).course;
  const user = await requireAccount(`/dashboard/${slug}/progress`);
  const course = await resolveCourse(slug);
  if (!course) notFound();
  const d = await getCourseDashboard(user.id, course);
  const base = `/courses/${course.slug}`;

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "My dashboard", href: "/dashboard" },
          { label: course.shortTitle, href: `/dashboard/${course.slug}` },
          { label: "Progress by topic" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="Progress by *topic*"
        description="Lectures you finished, questions you solved and how often your answers were right, topic by topic."
      />
      <DashboardNav courseSlug={course.slug} courseTitle={course.title} current="progress" />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-6 px-4 pt-8 sm:px-6">
        {d.topics.length === 0 ? <p className="text-muted">This course has no topics yet.</p> : null}
        {d.topics.map((t) => {
          const accuracy = t.answers > 0 ? Math.round((t.right * 100) / t.answers) : null;
          return (
            <section key={t.slug} aria-labelledby={`topic-${t.slug}`} className="rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card sm:p-6">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id={`topic-${t.slug}`} className="text-xl font-bold">
                  {t.title}
                </h2>
                <Link href={`${base}/practice?topic=${encodeURIComponent(t.slug)}`} className="text-sm font-semibold text-primary-text hover:underline">
                  Practise this topic
                </Link>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="flex justify-between text-sm">
                    <span className="text-muted">Lectures done</span>
                    <span className="font-mono font-semibold">
                      {t.lecturesDone} / {t.lecturesTotal}
                    </span>
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar done={t.lecturesDone} total={t.lecturesTotal} label={`Lectures done in ${t.title}`} />
                  </div>
                </div>
                <div>
                  <p className="flex justify-between text-sm">
                    <span className="text-muted">Questions solved</span>
                    <span className="font-mono font-semibold">
                      {t.solved} / {t.questions}
                    </span>
                  </p>
                  <div className="mt-1.5">
                    <ProgressBar done={t.solved} total={t.questions} label={`Questions solved in ${t.title}`} tone="sky" />
                  </div>
                </div>
                <p className="text-sm">
                  <span className="block text-muted">Answers right</span>
                  <span className="font-mono text-lg font-bold">{accuracy === null ? "–" : `${accuracy}%`}</span>
                  {t.answers > 0 ? (
                    <span className="text-muted">
                      {" "}
                      ({t.right} of {t.answers})
                    </span>
                  ) : (
                    <span className="text-muted"> no answers yet</span>
                  )}
                </p>
              </div>

              {t.lectures.length > 0 ? (
                <ul className="mt-5 grid grid-cols-1 gap-1 border-t border-line pt-4 sm:grid-cols-2">
                  {t.lectures.map((l) => (
                    <li key={l.slug}>
                      <Link href={`${base}/lectures/${l.slug}`} className="flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm hover:bg-surface-2">
                        {l.status === "completed" ? (
                          <CheckCircle2 aria-hidden="true" className="size-4 shrink-0 text-easy" />
                        ) : l.status === "started" ? (
                          <CircleDot aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
                        ) : (
                          <Circle aria-hidden="true" className="size-4 shrink-0 text-muted" />
                        )}
                        <span className="min-w-0 flex-1 truncate">
                          {l.lectureNumber !== null ? <span className="font-mono text-muted">L{l.lectureNumber} </span> : null}
                          {l.title}
                        </span>
                        <span className="sr-only">
                          {l.status === "completed" ? "(done)" : l.status === "started" ? "(started)" : "(not started)"}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}

              {t.openQuiz ? (
                <p className="mt-4 text-sm">
                  Not passed yet:{" "}
                  <Link href={`${base}/quizzes/${t.openQuiz.slug}`} className="font-semibold text-primary-text hover:underline">
                    {t.openQuiz.title}
                  </Link>
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </>
  );
}
