import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Notice } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { getLessonForEdit } from "@/server/admin/lessons";
import { requireCourse } from "@/server/auth/staff";
import { editorData } from "../editor-data";
import { LessonEditor } from "../lesson-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit lecture" };

type Props = { params: Promise<{ course: string; id: string }>; searchParams: Promise<{ created?: string }> };

export default async function EditLecturePage({ params, searchParams }: Props) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const lesson = await getLessonForEdit(course, id);
  if (!lesson) notFound();
  const data = await editorData(course, id, lesson.draft);
  const created = (await searchParams).created === "1";
  return (
    <div className="grid gap-6">
      <PageHeader chapter={lesson.draft.lectureNumber ? `Lecture ${lesson.draft.lectureNumber}` : "Lecture"} title={lesson.draft.title} />
      {created ? <Notice tone="success">Lecture created as a draft. You can add pictures now.</Notice> : null}
      <LessonEditor
        key={lesson.updatedAt}
        courseSlug={course.slug}
        courseLanguage={course.primaryLanguage}
        lessonId={id}
        initial={lesson.draft}
        {...data}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        updatedAt={lesson.updatedAt}
      />
    </div>
  );
}
