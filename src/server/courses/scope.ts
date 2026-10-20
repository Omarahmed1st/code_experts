// CourseScope: the one value every course-content query takes.
//
// It is resolved once per request from the URL's course slug. Data-access code
// for course-owned tables filters by scope.courseId, and the database's
// composite foreign keys reject any link that crosses courses.
import { cache } from "react";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db/client";
import { courses } from "@/db/schema";
import type { PRIMARY_LANGUAGE } from "@/db/enums";
import { isValidSlug } from "@/lib/slug";

export interface CourseScope {
  readonly courseId: string;
  readonly slug: string;
}

export interface CourseSummary extends CourseScope {
  readonly title: string;
  readonly shortTitle: string;
  readonly description: string;
  readonly primaryLanguage: (typeof PRIMARY_LANGUAGE)[number];
  readonly tags: readonly string[];
}

const summaryColumns = {
  courseId: courses.id,
  slug: courses.slug,
  title: courses.title,
  shortTitle: courses.shortTitle,
  description: courses.description,
  primaryLanguage: courses.primaryLanguage,
  tags: courses.tags,
};

/** Published courses in display order. Deduplicated per request (layout + page). */
export const listPublishedCourses = cache(async (): Promise<CourseSummary[]> => {
  return getDb()
    .select(summaryColumns)
    .from(courses)
    .where(eq(courses.status, "published"))
    .orderBy(asc(courses.sortOrder), asc(courses.title));
});

/** The published course behind a URL slug, or null (which the page turns into a 404). */
export const resolveCourse = cache(async (slug: string): Promise<CourseSummary | null> => {
  if (!isValidSlug(slug)) return null;
  const rows = await getDb()
    .select(summaryColumns)
    .from(courses)
    .where(and(eq(courses.slug, slug), eq(courses.status, "published")))
    .limit(1);
  return rows[0] ?? null;
});
