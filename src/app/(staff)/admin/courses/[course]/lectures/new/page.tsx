import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import type { LessonDraft } from "@/lib/admin/lesson-draft";
import { can } from "@/lib/auth/permissions";
import { requireCourse } from "@/server/auth/staff";
import { editorData } from "../editor-data";
import { LessonEditor } from "../lesson-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New lecture" };

export default async function NewLecturePage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  const draft: LessonDraft = {
    title: "",
    slug: "",
    topicId: "",
    lectureNumber: null,
    difficulty: "easy",
    description: "",
    objectives: [],
    prerequisites: [],
    relatedIds: [],
    resourceIds: [],
    status: "draft",
    publishAt: null,
    sections: [
      { id: null, kind: "explanation", title: "", bodyMd: "", program: null, image: null },
      { id: null, kind: "example", title: "", bodyMd: "", program: null, image: null },
      { id: null, kind: "key_takeaways", title: "Remember", bodyMd: "", program: null, image: null },
    ],
  };
  const data = await editorData(course, null, draft);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New lecture" title="New lecture" description="It starts as a draft: students won't see it until it is published." />
      <LessonEditor
        courseSlug={course.slug}
        courseLanguage={course.primaryLanguage}
        lessonId={null}
        initial={draft}
        {...data}
        canEdit
        canPublish={can(staff, "publish", course.id)}
        updatedAt={null}
      />
    </div>
  );
}
