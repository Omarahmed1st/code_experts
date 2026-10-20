// Numbers and sample pages for the admin's advertising page: how much each
// course has published (thin courses are an AdSense-readiness risk, though
// Google publishes no minimum), and a few real pages to preview placements on.
import { getCourseOutline } from "@/server/content/lessons";
import { listPublishedCourses } from "@/server/courses/scope";
import { listExercises } from "@/server/exercises/catalog";

export interface CourseReadiness {
  courseId: string;
  slug: string;
  title: string;
  lectures: number;
  topics: number;
  /** Topics listed on the course page as "Coming soon" (no lecture yet). */
  emptyTopics: number;
}

export async function courseReadiness(): Promise<CourseReadiness[]> {
  const courses = await listPublishedCourses();
  return Promise.all(
    courses.map(async (course) => {
      const outline = await getCourseOutline(course);
      return {
        courseId: course.courseId,
        slug: course.slug,
        title: course.title,
        lectures: outline.reduce((n, t) => n + t.lessons.length, 0),
        topics: outline.length,
        emptyTopics: outline.filter((t) => t.lessons.length === 0).length,
      };
    }),
  );
}

export interface PreviewLink {
  label: string;
  href: string;
}

/** One real page per template that can carry ads, opened with ?ad-preview=1. */
export async function previewLinks(): Promise<PreviewLink[]> {
  const links: PreviewLink[] = [{ label: "Home page", href: "/?ad-preview=1" }];
  const courses = await listPublishedCourses();
  const first = courses[0];
  if (!first) return links;
  const outline = await getCourseOutline(first);
  links.push({ label: `Course page: ${first.shortTitle}`, href: `/courses/${first.slug}?ad-preview=1` });
  // A longer lecture shows the in-text breaks best: take the one with the most sections' worth of reading.
  const lectures = outline.flatMap((t) => t.lessons);
  const long = lectures[Math.min(2, lectures.length - 1)];
  if (long) links.push({ label: `Lecture: ${long.title}`, href: `/courses/${first.slug}/lectures/${long.slug}?ad-preview=1` });
  const question = (await listExercises(first)).find((q) => !q.isDemo);
  if (question) links.push({ label: `Question: ${question.title}`, href: `/courses/${first.slug}/exercises/${question.slug}?ad-preview=1` });
  links.push({ label: "Quizzes page (never shows ads)", href: `/courses/${first.slug}/quizzes?ad-preview=1` });
  return links;
}
