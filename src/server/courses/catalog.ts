import { countLiveLessons } from "@/server/content/lessons";
import { type CourseSummary, listPublishedCourses } from "./scope";

/** Published courses with their live lecture counts (keyed by course id), for course cards. */
export async function getCatalog(): Promise<{ courses: CourseSummary[]; lectureCounts: Record<string, number> }> {
  const courses = await listPublishedCourses();
  const counts = await countLiveLessons(courses.map((c) => c.courseId));
  return { courses, lectureCounts: Object.fromEntries(counts) };
}
