import { listPublishedCourses } from "./scope";
import type { SwitcherCourse } from "@/components/layout/course-switcher";

/**
 * Courses for the header and footer. A database failure must not take the
 * whole page down, so it degrades to an empty list and is logged.
 */
export async function getNavigationCourses(): Promise<SwitcherCourse[]> {
  try {
    const courses = await listPublishedCourses();
    return courses.map(({ slug, title, shortTitle }) => ({ slug, title, shortTitle }));
  } catch (error) {
    console.error("layout: could not load courses", error);
    return [];
  }
}
