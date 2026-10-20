import type { AdminCourse } from "@/server/admin/courses";
import { listLessons } from "@/server/admin/lessons";
import { listTopics } from "@/server/admin/topics";

/** The topic and lecture choices for the question editor (by slug, as the content format names them). */
export async function questionEditorData(course: AdminCourse) {
  const [topics, lessons] = await Promise.all([listTopics(course), listLessons(course)]);
  return {
    topics: topics.map((t) => ({ slug: t.slug, title: t.title })),
    lessons: lessons.map((l) => ({ slug: l.slug, title: l.lectureNumber != null ? `${l.lectureNumber}. ${l.title}` : l.title })),
  };
}
