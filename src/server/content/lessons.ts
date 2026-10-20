// Public lesson content for one course: the course outline, topics and lecture
// pages. Every query takes a CourseScope and filters on its courseId, so a URL
// for one course can never show another course's lectures.
import { cache } from "react";
import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import type { DIFFICULTY } from "@/db/enums";
import { lessonRelations, lessonSections, lessons, topics } from "@/db/schema";
import type { CodeAnnotations } from "@/lib/lesson/annotations";
import { isValidSlug } from "@/lib/slug";
import type { CourseScope } from "@/server/courses/scope";

export type Difficulty = (typeof DIFFICULTY)[number];

export interface LessonCard {
  slug: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  readingMinutes: number;
  lectureNumber: number | null;
}

export interface TopicOutline {
  slug: string;
  title: string;
  description: string;
  lessons: LessonCard[];
}

export interface SectionView {
  id: string;
  kind: (typeof lessonSections.$inferSelect)["kind"];
  title: string;
  bodyMd: string;
  code: string | null;
  codeLanguage: (typeof lessonSections.$inferSelect)["codeLanguage"];
  runnable: boolean;
  sampleInput: string;
  expectedOutput: string | null;
  annotations: CodeAnnotations | null;
  image: { key: string; alt: string; width: number; height: number } | null;
}

export interface LessonPage extends LessonCard {
  id: string;
  objectives: string[];
  prerequisites: string[];
  publishedAt: number | null;
  updatedAt: number;
  topic: { slug: string; title: string };
  sections: SectionView[];
  related: LessonCard[];
  previous: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

/** A lecture is public when published, or scheduled with a publish time that has passed. */
export function lessonIsLive() {
  return or(
    eq(lessons.status, "published"),
    and(eq(lessons.status, "scheduled"), lte(lessons.publishAt, sql`(unixepoch() * 1000)`)),
  );
}

const cardColumns = {
  slug: lessons.slug,
  title: lessons.title,
  description: lessons.description,
  difficulty: lessons.difficulty,
  readingMinutes: lessons.readingMinutes,
  lectureNumber: lessons.lectureNumber,
};

/** Top-level published topics in order, each with its live lectures in course order. */
export const getCourseOutline = cache(async (scope: CourseScope): Promise<TopicOutline[]> => {
  const db = getDb();
  const [topicRows, lessonRows] = await Promise.all([
    db
      .select({ id: topics.id, slug: topics.slug, title: topics.title, description: topics.description })
      .from(topics)
      .where(and(eq(topics.courseId, scope.courseId), eq(topics.status, "published"), isNull(topics.parentTopicId)))
      .orderBy(asc(topics.sortOrder), asc(topics.title)),
    db
      .select({ ...cardColumns, topicId: lessons.topicId })
      .from(lessons)
      .where(and(eq(lessons.courseId, scope.courseId), lessonIsLive()))
      .orderBy(asc(lessons.sortOrder), asc(lessons.title)),
  ]);
  return topicRows.map((topic) => ({
    slug: topic.slug,
    title: topic.title,
    description: topic.description,
    lessons: lessonRows.filter((l) => l.topicId === topic.id).map(({ topicId: _topicId, ...card }) => card),
  }));
});

export async function getTopic(scope: CourseScope, slug: string): Promise<TopicOutline | null> {
  if (!isValidSlug(slug)) return null;
  const outline = await getCourseOutline(scope);
  return outline.find((topic) => topic.slug === slug) ?? null;
}

/** Every live lecture in course order (for previous/next and the sitemap). */
export const listLiveLessons = cache(async (scope: CourseScope) => {
  return getDb()
    .select({ id: lessons.id, slug: lessons.slug, title: lessons.title, updatedAt: lessons.updatedAt })
    .from(lessons)
    .where(and(eq(lessons.courseId, scope.courseId), lessonIsLive()))
    .orderBy(asc(lessons.sortOrder), asc(lessons.title));
});

export const getLesson = cache(async (scope: CourseScope, slug: string): Promise<LessonPage | null> => {
  if (!isValidSlug(slug)) return null;
  return loadLessonPage(scope, eq(lessons.slug, slug), true);
});

/** Any lecture of the course by id, whatever its status: the admin's preview. */
export async function getLessonPreview(scope: CourseScope, id: string): Promise<LessonPage | null> {
  return loadLessonPage(scope, eq(lessons.id, id), false);
}

async function loadLessonPage(scope: CourseScope, match: ReturnType<typeof eq>, liveOnly: boolean): Promise<LessonPage | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: lessons.id,
      ...cardColumns,
      objectives: lessons.objectives,
      prerequisites: lessons.prerequisites,
      publishedAt: lessons.publishedAt,
      updatedAt: lessons.updatedAt,
      topicSlug: topics.slug,
      topicTitle: topics.title,
    })
    .from(lessons)
    .innerJoin(topics, and(eq(topics.courseId, lessons.courseId), eq(topics.id, lessons.topicId)))
    .where(and(eq(lessons.courseId, scope.courseId), match, liveOnly ? lessonIsLive() : undefined))
    .limit(1);
  const lesson = rows[0];
  if (!lesson) return null;

  const [sectionRows, relatedRows, ordered] = await Promise.all([
    db
      .select()
      .from(lessonSections)
      .where(and(eq(lessonSections.courseId, scope.courseId), eq(lessonSections.lessonId, lesson.id)))
      .orderBy(asc(lessonSections.sortOrder)),
    db
      .select({ ...cardColumns, sortOrder: lessonRelations.sortOrder })
      .from(lessonRelations)
      .innerJoin(
        lessons,
        and(eq(lessons.courseId, lessonRelations.courseId), eq(lessons.id, lessonRelations.relatedLessonId)),
      )
      .where(
        and(eq(lessonRelations.courseId, scope.courseId), eq(lessonRelations.lessonId, lesson.id), lessonIsLive()),
      )
      .orderBy(asc(lessonRelations.sortOrder)),
    listLiveLessons(scope),
  ]);

  const index = ordered.findIndex((l) => l.id === lesson.id);
  const neighbour = (i: number) => {
    const l = ordered[i];
    return l ? { slug: l.slug, title: l.title } : null;
  };

  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    description: lesson.description,
    difficulty: lesson.difficulty,
    readingMinutes: lesson.readingMinutes,
    lectureNumber: lesson.lectureNumber,
    objectives: lesson.objectives,
    prerequisites: lesson.prerequisites,
    publishedAt: lesson.publishedAt,
    updatedAt: lesson.updatedAt,
    topic: { slug: lesson.topicSlug, title: lesson.topicTitle },
    sections: sectionRows.map((s) => ({
      id: s.id,
      kind: s.kind,
      title: s.title,
      bodyMd: s.bodyMd,
      code: s.code,
      codeLanguage: s.codeLanguage,
      runnable: s.runnable,
      sampleInput: s.sampleInput,
      expectedOutput: s.expectedOutput,
      annotations: s.annotations ?? null,
      image:
        s.imageKey && s.imageWidth && s.imageHeight
          ? { key: s.imageKey, alt: s.imageAlt ?? "", width: s.imageWidth, height: s.imageHeight }
          : null,
    })),
    related: relatedRows.map(({ sortOrder: _sortOrder, ...card }) => card),
    previous: index > 0 ? neighbour(index - 1) : null,
    next: index >= 0 ? neighbour(index + 1) : null,
  };
}

/**
 * True when an R2 key is the image of a section in a live lecture of this course.
 * The media route serves nothing else, so draft lectures' images stay private.
 */
export async function isPublicLessonImage(scope: CourseScope, key: string): Promise<boolean> {
  const rows = await getDb()
    .select({ id: lessonSections.id })
    .from(lessonSections)
    .innerJoin(lessons, and(eq(lessons.courseId, lessonSections.courseId), eq(lessons.id, lessonSections.lessonId)))
    .where(and(eq(lessonSections.courseId, scope.courseId), eq(lessonSections.imageKey, key), lessonIsLive()))
    .limit(1);
  return rows.length > 0;
}

/** Lecture counts per course, for course cards. */
export async function countLiveLessons(courseIds: string[]): Promise<Map<string, number>> {
  if (courseIds.length === 0) return new Map();
  const rows = await getDb()
    .select({ courseId: lessons.courseId, n: sql<number>`count(*)` })
    .from(lessons)
    .where(and(inArray(lessons.courseId, courseIds), lessonIsLive()))
    .groupBy(lessons.courseId);
  return new Map(rows.map((r) => [r.courseId, Number(r.n)]));
}
