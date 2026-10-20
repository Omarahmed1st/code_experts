// What the lecture editor needs besides the lecture: the course's topics,
// other lectures, files, picture previews and search settings.
import type { LessonDraft } from "@/lib/admin/lesson-draft";
import type { AdminCourse } from "@/server/admin/courses";
import { adminImageUrl, listLessons } from "@/server/admin/lessons";
import { listAdminResources } from "@/server/admin/resources";
import { getSeo } from "@/server/admin/seo";
import { listTopics } from "@/server/admin/topics";

export async function editorData(course: AdminCourse, lessonId: string | null, draft: LessonDraft) {
  const [topics, lessons, resources, seo] = await Promise.all([
    listTopics(course),
    listLessons(course),
    listAdminResources(course),
    lessonId ? getSeo(`/courses/${course.slug}/lectures/${draft.slug}`) : Promise.resolve({ title: null, description: null, noindex: false }),
  ]);
  const imageUrls: Record<string, string> = {};
  for (const s of draft.sections) {
    const url = s.image ? adminImageUrl(course, s.image.key) : null;
    if (s.image && url) imageUrls[s.image.key] = url;
  }
  return {
    topics: topics.map((t) => ({ id: t.id, title: t.title })),
    otherLessons: lessons.filter((l) => l.id !== lessonId).map((l) => ({ id: l.id, title: l.title })),
    resources: resources.map((r) => ({ id: r.id, title: r.title, kind: r.kind })),
    imageUrls,
    seo,
  };
}
