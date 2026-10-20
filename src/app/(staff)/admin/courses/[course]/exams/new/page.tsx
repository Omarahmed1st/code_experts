import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import type { ExamDraft } from "@/server/admin/exams";
import { requireCourse } from "@/server/auth/staff";
import { examEditorData } from "../editor-data";
import { ExamEditor } from "../exam-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New practice exam" };

export default async function NewExamPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  const draft: ExamDraft = {
    title: "",
    slug: "",
    descriptionMd: "",
    scope: "course",
    minutes: 30,
    passThreshold: 60,
    shuffleQuestions: true,
    status: "draft",
    rules: [{ count: 10, type: null, difficulty: null, topicId: null, points: 1 }],
  };
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New practice exam" title="New practice exam" description="It starts as a draft: students won't see it until it is published." />
      <ExamEditor
        courseSlug={course.slug}
        examId={null}
        initial={draft}
        {...await examEditorData(course)}
        canEdit
        canPublish={can(staff, "publish", course.id)}
        canDelete={false}
        updatedAt={null}
      />
    </div>
  );
}
