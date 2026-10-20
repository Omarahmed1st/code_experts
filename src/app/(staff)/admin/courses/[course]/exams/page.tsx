import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { can } from "@/lib/auth/permissions";
import { listAdminExams } from "@/server/admin/exams";
import { requireCourse } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Practice exams" };

export default async function ExamsPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const exams = await listAdminExams(course);
  const base = `/admin/courses/${course.slug}/exams`;
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Practice exams"
        title="Practice exams"
        description="A practice exam has rules instead of a fixed list: each attempt draws fresh published questions from the bank."
        actions={
          can(staff, "edit", course.id) ? (
            <Link href={`${base}/new`} className={buttonClass("primary")}>
              <Plus aria-hidden="true" className="size-4" /> New practice exam
            </Link>
          ) : null
        }
      />
      {exams.length === 0 ? <p className="text-muted">No practice exams yet.</p> : null}
      <ul className="grid gap-3">
        {exams.map((x) => (
          <li key={x.id} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <p className="flex flex-wrap items-center gap-2 font-semibold">
              <Link href={`${base}/${x.id}`} className="hover:underline">
                {x.title}
              </Link>
              <StatusBadge status={x.status} />
            </p>
            <p className="mt-0.5 text-sm text-muted">
              {x.questions} questions drawn · {Math.round(x.timeLimitSec / 60)} min · edited {formatAdminTime(x.updatedAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
