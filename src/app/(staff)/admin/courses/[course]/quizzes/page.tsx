import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { currentTime, formatAdminTime } from "@/lib/admin/time";
import { can } from "@/lib/auth/permissions";
import { type AdminQuizRow, listAdminQuizzes } from "@/server/admin/quizzes";
import { requireCourse } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Quizzes" };

function facts(q: AdminQuizRow): string {
  const parts = [`${q.questions} question${q.questions === 1 ? "" : "s"}`, q.mode === "exam" ? "marks after submitting" : "feedback as you go"];
  if (q.timeLimitSec) parts.push(`${Math.round(q.timeLimitSec / 60)} min`);
  if (q.maxAttempts) parts.push(`${q.maxAttempts} attempt${q.maxAttempts === 1 ? "" : "s"} a day`);
  return parts.join(" · ");
}

export default async function QuizzesPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const quizzes = await listAdminQuizzes(course);
  const base = `/admin/courses/${course.slug}/quizzes`;
  const now = currentTime();
  const badge = (q: AdminQuizRow) =>
    q.status === "scheduled" && q.publishAt ? (
      <StatusBadge status={q.publishAt <= now ? "live" : "scheduled"} label={q.publishAt <= now ? "live" : `scheduled · ${formatAdminTime(q.publishAt)}`} />
    ) : (
      <StatusBadge status={q.status} />
    );
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Quizzes"
        title="Quizzes"
        description="A quiz is a fixed list of questions. A quiz can have models (other versions); a student who starts it gets one model at random."
        actions={
          can(staff, "edit", course.id) ? (
            <Link href={`${base}/new`} className={buttonClass("primary")}>
              <Plus aria-hidden="true" className="size-4" /> New quiz
            </Link>
          ) : null
        }
      />
      {quizzes.length === 0 ? <p className="text-muted">No quizzes yet.</p> : null}
      <ul className="grid gap-3">
        {quizzes.map((q) => (
          <li key={q.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <Link href={`${base}/${q.id}`} className="hover:underline">
                {q.title}
              </Link>
              {badge(q)}
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {q.topicTitle ?? "Whole course"} · {facts(q)} · edited {formatAdminTime(q.updatedAt)}
            </p>
            {q.models.length > 0 ? (
              <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                <li className="inline-flex min-h-9 items-center rounded-lg bg-surface-2 px-3 font-semibold">Model A (this quiz)</li>
                {q.models.map((m) => (
                  <li key={m.id}>
                    <Link href={`${base}/${m.id}`} className="inline-flex min-h-9 items-center rounded-lg border border-line px-3 hover:bg-surface-2">
                      Model {m.slug.slice(-1).toUpperCase()} · {m.questions} question{m.questions === 1 ? "" : "s"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
