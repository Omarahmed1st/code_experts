import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { getQuizForEdit } from "@/server/admin/quizzes";
import { requireCourse } from "@/server/auth/staff";
import { getBindings } from "@/server/platform/env";
import { quizEditorData } from "../editor-data";
import { QuizEditor } from "../quiz-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit quiz" };

export default async function EditQuizPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const quiz = await getQuizForEdit(course, id);
  if (!quiz) notFound();
  const [data, saved] = await Promise.all([
    quizEditorData(course, quiz),
    getBindings().db.prepare("SELECT updated_at AS t FROM quizzes WHERE course_id = ? AND id = ?").bind(course.id, id).first<{ t: number }>(),
  ]);
  const letter = quiz.modelOf ? quiz.draft.slug.slice(-1).toUpperCase() : null;
  return (
    <div className="grid gap-6">
      <PageHeader chapter={letter ? `Quiz · model ${letter}` : "Quiz"} title={quiz.draft.title} />
      <QuizEditor
        key={saved?.t ?? 0}
        courseSlug={course.slug}
        quizId={id}
        initial={quiz.draft}
        modelOf={quiz.modelOf ? { id: quiz.modelOf.id, title: quiz.modelOf.title } : null}
        models={quiz.models}
        {...data}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
        updatedAt={saved?.t ?? null}
      />
    </div>
  );
}
