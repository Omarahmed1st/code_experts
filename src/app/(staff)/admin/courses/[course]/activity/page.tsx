import type { Metadata } from "next";
import Link from "next/link";
import { ActivityList } from "@/components/admin/activity-list";
import { Card } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { listAudit } from "@/server/admin/audit";
import { requireCourse } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course activity" };

const PAGE = 50;

export default async function CourseActivityPage({ params, searchParams }: { params: Promise<{ course: string }>; searchParams: Promise<{ before?: string }> }) {
  const { course } = await requireCourse((await params).course, "view");
  const before = Number((await searchParams).before) || undefined;
  const rows = await listAudit({ courseIds: [course.id], limit: PAGE, before });
  const last = rows.at(-1);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Activity" title="Course activity" description="Who changed what in this course, newest first. Times are Cairo time." />
      <Card>
        <ActivityList rows={rows} showCourse={false} />
      </Card>
      <div className="flex flex-wrap gap-2">
        {before ? (
          <Link href={`/admin/courses/${course.slug}/activity`} className={buttonClass("ghost")}>
            Newest
          </Link>
        ) : null}
        {rows.length === PAGE && last ? (
          <Link href={`/admin/courses/${course.slug}/activity?before=${last.createdAt}`} className={buttonClass("secondary")}>
            Older
          </Link>
        ) : null}
      </div>
    </div>
  );
}
