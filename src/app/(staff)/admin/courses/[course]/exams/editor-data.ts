import { drawable, loadBankQuestions } from "@/server/admin/bank";
import type { AdminCourse } from "@/server/admin/courses";
import { listTopics } from "@/server/admin/topics";

/** Topics and the drawable pool (kind, level and topic only) for the live "N questions match" counts. */
export async function examEditorData(course: AdminCourse) {
  const [topics, bank] = await Promise.all([listTopics(course), loadBankQuestions(course.id)]);
  return {
    topics: topics.map((t) => ({ id: t.id, title: t.title })),
    pool: bank.filter(drawable).map((q) => ({ type: q.type, difficulty: q.difficulty, topicId: q.topicId })),
  };
}
