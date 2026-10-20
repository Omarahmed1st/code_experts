import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { RestoreList } from "@/components/admin/restore-list";
import { can } from "@/lib/auth/permissions";
import { listRevisions } from "@/server/admin/audit";
import { getExerciseForEdit } from "@/server/admin/exercises";
import { requireCourse } from "@/server/auth/staff";
import { restoreExerciseAction } from "../../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Question history" };

export default async function QuestionHistoryPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const exercise = await getExerciseForEdit(course, id);
  if (!exercise) notFound();
  const revisions = await listRevisions(course.id, "exercise", id);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="History"
        title={exercise.source.title}
        description="Every save keeps a copy. Restoring a version saves it again as the newest one; the question keeps its current status."
        actions={
          <Link href={`/admin/courses/${course.slug}/questions/${id}`} className="text-sm font-semibold text-primary-text hover:underline">
            Back to the editor
          </Link>
        }
      />
      <Card>
        <RestoreList
          revisions={revisions}
          canRestore={can(staff, "edit", course.id)}
          restore={restoreExerciseAction.bind(null, course.slug, id)}
          empty="No saved versions yet: versions are kept from the first save in the admin."
        />
      </Card>
    </div>
  );
}
