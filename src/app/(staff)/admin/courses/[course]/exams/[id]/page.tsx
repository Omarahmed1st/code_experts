import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { getExamForEdit } from "@/server/admin/exams";
import { requireCourse } from "@/server/auth/staff";
import { getBindings } from "@/server/platform/env";
import { examEditorData } from "../editor-data";
import { ExamEditor } from "../exam-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit practice exam" };

export default async function EditExamPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const exam = await getExamForEdit(course, id);
  if (!exam) notFound();
  const [data, saved] = await Promise.all([
    examEditorData(course),
    getBindings().db.prepare("SELECT updated_at AS t FROM exam_templates WHERE course_id = ? AND id = ?").bind(course.id, id).first<{ t: number }>(),
  ]);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Practice exam" title={exam.draft.title} />
      <ExamEditor
        key={saved?.t ?? 0}
        courseSlug={course.slug}
        examId={id}
        initial={exam.draft}
        {...data}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
        updatedAt={saved?.t ?? null}
      />
    </div>
  );
}
