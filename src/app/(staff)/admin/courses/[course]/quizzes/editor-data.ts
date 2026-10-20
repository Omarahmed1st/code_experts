import type { AdminCourse } from "@/server/admin/courses";
import { type QuizForEdit, getQuizForEdit, listQuizCandidates } from "@/server/admin/quizzes";
import { listTopics } from "@/server/admin/topics";
import type { QuizFamily } from "./quiz-editor";

/** Topics, the question picker's list and (for a quiz with models) how many questions every version shares. */
export async function quizEditorData(course: AdminCourse, quiz: QuizForEdit | null) {
  const [topics, candidates] = await Promise.all([listTopics(course), listQuizCandidates(course)]);
  let family: QuizFamily | null = null;
  const parent = quiz?.modelOf ? await getQuizForEdit(course, quiz.modelOf.id) : quiz;
  if (parent && parent.models.length > 0) {
    const models = (await Promise.all(parent.models.map((m) => getQuizForEdit(course, m.id)))).filter((m): m is QuizForEdit => m !== null);
    const versions = [parent, ...models];
    const sets = versions.map((v) => new Set(v.draft.questions.map((q) => q.exerciseId)));
    const shared = [...sets[0]!].filter((id) => sets.every((s) => s.has(id))).length;
    family = {
      shared,
      versions: versions.map((v, i) => ({ id: v.id, label: i === 0 ? "Model A" : `Model ${v.draft.slug.slice(-1).toUpperCase()}`, questions: v.draft.questions.length })),
    };
  }
  return { topics: topics.map((t) => ({ id: t.id, title: t.title })), candidates, family };
}
