import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { blankExercise } from "@/lib/admin/exercise-draft";
import { can } from "@/lib/auth/permissions";
import { ASK_TYPE, isAsk } from "@/lib/exercise/ask";
import { EXERCISE_TYPES, type ExerciseType } from "@/lib/exercise/source";
import { requireCourse } from "@/server/auth/staff";
import { questionEditorData } from "../editor-data";
import { QuestionEditor } from "../question-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New question" };

type Props = { params: Promise<{ course: string }>; searchParams: Promise<{ type?: string; ask?: string; topic?: string }> };

export default async function NewQuestionPage({ params, searchParams }: Props) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  const search = await searchParams;
  const ask = isAsk(search.ask) ? search.ask : undefined;
  const type: ExerciseType = ask ? ASK_TYPE[ask] : (EXERCISE_TYPES as readonly string[]).includes(search.type ?? "") ? (search.type as ExerciseType) : "mcq";
  const data = await questionEditorData(course);
  const topic = data.topics.find((t) => t.slug === search.topic)?.slug ?? null;
  const initial = blankExercise(type, course.primaryLanguage, topic);
  if (ask) initial.settings = { ...initial.settings, ask };
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New question" title="New question" description="It starts as a draft: students won't see it until it is published." />
      <QuestionEditor
        courseSlug={course.slug}
        exerciseId={null}
        initial={initial}
        {...data}
        usedIn={[]}
        canEdit
        canPublish={can(staff, "publish", course.id)}
        canDelete={false}
        updatedAt={null}
      />
    </div>
  );
}
