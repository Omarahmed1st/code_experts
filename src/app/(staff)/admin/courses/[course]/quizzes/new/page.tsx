import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import type { QuizDraft } from "@/server/admin/quizzes";
import { requireCourse } from "@/server/auth/staff";
import { quizEditorData } from "../editor-data";
import { QuizEditor } from "../quiz-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New quiz" };

export default async function NewQuizPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  const draft: QuizDraft = {
    title: "",
    slug: "",
    descriptionMd: "",
    topicId: null,
    mode: "practice",
    minutes: null,
    passThreshold: 60,
    shuffleQuestions: true,
    shuffleOptions: true,
    maxAttempts: null,
    status: "draft",
    publishAt: null,
    questions: [],
  };
  const data = await quizEditorData(course, null);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New quiz" title="New quiz" description="It starts as a draft: students won't see it until it is published." />
      <QuizEditor
        courseSlug={course.slug}
        quizId={null}
        initial={draft}
        modelOf={null}
        models={[]}
        {...data}
        canEdit
        canPublish={can(staff, "publish", course.id)}
        canDelete={false}
        updatedAt={null}
      />
    </div>
  );
}
