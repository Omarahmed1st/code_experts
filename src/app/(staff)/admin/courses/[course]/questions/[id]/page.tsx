import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { getExerciseForEdit } from "@/server/admin/exercises";
import { requireCourse } from "@/server/auth/staff";
import { questionEditorData } from "../editor-data";
import { QuestionEditor } from "../question-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit question" };

type Props = { params: Promise<{ course: string; id: string }>; searchParams: Promise<{ created?: string }> };

export default async function EditQuestionPage({ params, searchParams }: Props) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const exercise = await getExerciseForEdit(course, id);
  if (!exercise) notFound();
  const data = await questionEditorData(course);
  const created = (await searchParams).created === "1";
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Question" title={exercise.source.title} />
      {created ? <Notice tone="success">Saved as a draft.</Notice> : null}
      <QuestionEditor
        key={exercise.updatedAt}
        courseSlug={course.slug}
        exerciseId={id}
        initial={exercise.source}
        {...data}
        usedIn={exercise.quizzes.map((q) => ({ id: q.id, title: q.title, status: q.status }))}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
        updatedAt={exercise.updatedAt}
      />
    </div>
  );
}
