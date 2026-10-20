import type { MetadataRoute } from "next";
import { getCourseOutline, listLiveLessons } from "@/server/content/lessons";
import { listExams, listQuizzes } from "@/server/assessments/catalog";
import { listPublishedCourses } from "@/server/courses/scope";
import { listExerciseSitemap, listExercises } from "@/server/exercises/catalog";
import { absoluteUrl, indexable } from "@/server/seo";

export const dynamic = "force-dynamic";

/**
 * Every indexable page: the site pages, then each course, its topics that have
 * lectures, its live lectures, its question library and quizzes page, and the
 * questions that have a full explanation. Thin pages (empty courses and topics,
 * search, resources, practice sets, quiz runners) are left out, matching their
 * noindex tags. Outside production, or
 * without PUBLIC_SITE_URL, the sitemap is empty.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!indexable(true) || !absoluteUrl("/")) return [];
  const url = (path: string) => absoluteUrl(path) as string;
  const entries: MetadataRoute.Sitemap = [
    { url: url("/") },
    { url: url("/courses") },
    { url: url("/about") },
    { url: url("/accessibility") },
    { url: url("/contact") },
    { url: url("/privacy-policy") },
    { url: url("/terms") },
    { url: url("/cookie-policy") },
    { url: url("/advertising") },
  ];
  for (const course of await listPublishedCourses()) {
    const [outline, lessons] = await Promise.all([getCourseOutline(course), listLiveLessons(course)]);
    if (lessons.length === 0) continue;
    const base = `/courses/${course.slug}`;
    entries.push({ url: url(base), lastModified: new Date(Math.max(...lessons.map((l) => l.updatedAt))) });
    for (const topic of outline) {
      if (topic.lessons.length > 0) entries.push({ url: url(`${base}/topics/${topic.slug}`) });
    }
    for (const lesson of lessons) {
      entries.push({ url: url(`${base}/lectures/${lesson.slug}`), lastModified: new Date(lesson.updatedAt) });
    }
    const [questions, indexedQuestions, quizzes, exams] = await Promise.all([
      listExercises(course),
      listExerciseSitemap(course),
      listQuizzes(course),
      listExams(course),
    ]);
    if (questions.length > 0) entries.push({ url: url(`${base}/exercises`) });
    for (const q of indexedQuestions) {
      entries.push({ url: url(`${base}/exercises/${q.slug}`), lastModified: new Date(q.updatedAt) });
    }
    if (quizzes.length + exams.length > 0) entries.push({ url: url(`${base}/quizzes`) });
  }
  return entries;
}
