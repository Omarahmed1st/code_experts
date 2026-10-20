import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { RestoreList } from "@/components/admin/restore-list";
import { can } from "@/lib/auth/permissions";
import { listRevisions } from "@/server/admin/audit";
import { getLessonForEdit } from "@/server/admin/lessons";
import { requireCourse } from "@/server/auth/staff";
import { restoreLessonAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lecture history" };

export default async function LectureHistoryPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const lesson = await getLessonForEdit(course, id);
  if (!lesson) notFound();
  const revisions = await listRevisions(course.id, "lesson", id);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="History"
        title={lesson.draft.title}
        description="Every save keeps a copy. Restoring a version saves it again as the newest one; the lecture keeps its current status."
        actions={
          <Link href={`/admin/courses/${course.slug}/lectures/${id}`} className="text-sm font-semibold text-primary-text hover:underline">
            Back to the editor
          </Link>
        }
      />
      <Card>
        <RestoreList
          revisions={revisions}
          canRestore={can(staff, "edit", course.id)}
          restore={restoreLessonAction.bind(null, course.slug, id)}
          empty="No saved versions yet: versions are kept from the first save in the admin."
        />
      </Card>
    </div>
  );
}
