import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { currentTime } from "@/lib/admin/time";
import Link from "next/link";
import { ActivityList, formatAdminTime } from "@/components/admin/activity-list";
import { Card, StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { can } from "@/lib/auth/permissions";
import { listAudit } from "@/server/admin/audit";
import { listAdminCourses } from "@/server/admin/courses";
import { isLive, listLessons } from "@/server/admin/lessons";
import { listAdminQuizzes } from "@/server/admin/quizzes";
import { requireCourse } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: `Course ${(await params).course}` };
}

export default async function CourseOverview({ params }: Props) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const [[withCounts], lessons, quizzes, activity] = await Promise.all([
    listAdminCourses([course.id]),
    listLessons(course),
    listAdminQuizzes(course),
    listAudit({ courseIds: [course.id], limit: 10 }),
  ]);
  const counts = withCounts!.counts;
  const now = currentTime();
  const scheduled = [
    ...lessons.filter((l) => l.status === "scheduled" && !isLive(l, now)).map((l) => ({ kind: "Lecture", title: l.title, at: l.publishAt!, href: `/admin/courses/${course.slug}/lectures/${l.id}` })),
    ...quizzes.filter((q) => q.status === "scheduled" && (q.publishAt ?? 0) > now).map((q) => ({ kind: "Quiz", title: q.title, at: q.publishAt!, href: `/admin/courses/${course.slug}/quizzes/${q.id}` })),
  ].sort((a, b) => a.at - b.at);
  const drafts = lessons.filter((l) => l.status === "draft");
  const base = `/admin/courses/${course.slug}`;
  const editable = can(staff, "edit", course.id);

  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Overview"
        title={course.title}
        description={course.description}
        actions={
          editable ? (
            <>
              <Link href={`${base}/lectures/new`} className={buttonClass("primary")}>
                <Plus aria-hidden="true" className="size-4" /> New lecture
              </Link>
              <Link href={`${base}/questions/new`} className={buttonClass("secondary")}>
                <Plus aria-hidden="true" className="size-4" /> New question
              </Link>
            </>
          ) : null
        }
      />
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {(
          [
            ["Topics", counts.topics, `${base}/topics`],
            ["Lectures live", `${counts.liveLectures} / ${counts.lectures}`, `${base}/lectures`],
            ["Questions published", `${counts.publishedQuestions} / ${counts.questions}`, `${base}/questions`],
            ["Quizzes", counts.quizzes, `${base}/quizzes`],
            ["Practice exams", counts.exams, `${base}/exams`],
            ["Files", counts.resources, `${base}/files`],
          ] as const
        ).map(([label, value, href]) => (
          <div key={label} className="relative rounded-[var(--radius-card)] border border-line bg-surface p-4 shadow-[var(--cl-shadow)]">
            <dt className="text-sm text-muted">
              <Link href={href} className="after:absolute after:inset-0 hover:underline">
                {label}
              </Link>
            </dt>
            <dd className="mt-1 font-mono text-2xl font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Coming up">
          {scheduled.length === 0 ? (
            <p className="text-sm text-muted">Nothing is scheduled. Schedule a lecture or quiz from its editor to publish it later on its own.</p>
          ) : (
            <ul className="divide-y divide-line">
              {scheduled.map((s) => (
                <li key={s.href} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5">
                  <StatusBadge status="scheduled" label={s.kind} />
                  <Link href={s.href} className="font-medium hover:underline">
                    {s.title}
                  </Link>
                  <span className="ml-auto text-sm text-muted">{formatAdminTime(s.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Draft lectures">
          {drafts.length === 0 ? (
            <p className="text-sm text-muted">No drafts. Every lecture is published, scheduled or archived.</p>
          ) : (
            <ul className="divide-y divide-line">
              {drafts.map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-x-3 py-2.5">
                  <Link href={`${base}/lectures/${l.id}`} className="font-medium hover:underline">
                    {l.title}
                  </Link>
                  <span className="ml-auto text-sm text-muted">edited {formatAdminTime(l.updatedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <Card title="Recent activity in this course" actions={<Link href={`${base}/activity`} className="text-sm font-semibold text-primary-text hover:underline">All activity</Link>}>
        <ActivityList rows={activity} />
      </Card>
    </div>
  );
}
