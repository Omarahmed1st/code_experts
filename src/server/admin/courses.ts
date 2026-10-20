// Courses in the admin: every status, not only published ones. Course content
// services elsewhere take a CourseScope; AdminCourse is one, so they can be reused.
import { cache } from "react";
import { getBindings } from "@/server/platform/env";
import type { CourseScope } from "@/server/courses/scope";
import { isValidSlug } from "@/lib/slug";

export type CourseStatus = "draft" | "published" | "archived";

export interface AdminCourse extends CourseScope {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  primaryLanguage: "cpp" | "python";
  tags: string[];
  status: CourseStatus;
  sortOrder: number;
  publishedAt: number | null;
  updatedAt: number;
}

interface CourseRow {
  id: string;
  slug: string;
  title: string;
  shortTitle: string;
  description: string;
  primaryLanguage: "cpp" | "python";
  tags: string;
  status: CourseStatus;
  sortOrder: number;
  publishedAt: number | null;
  updatedAt: number;
}

const COLUMNS = `id, slug, title, short_title AS shortTitle, description, primary_language AS primaryLanguage, tags, status,
  sort_order AS sortOrder, published_at AS publishedAt, updated_at AS updatedAt`;

function toCourse(row: CourseRow): AdminCourse {
  let tags: string[] = [];
  try {
    const parsed = JSON.parse(row.tags) as unknown;
    if (Array.isArray(parsed)) tags = parsed.filter((t): t is string => typeof t === "string");
  } catch {
    tags = [];
  }
  return { ...row, courseId: row.id, tags };
}

export const getAdminCourse = cache(async (slug: string): Promise<AdminCourse | null> => {
  if (!isValidSlug(slug)) return null;
  const row = await getBindings().db.prepare(`SELECT ${COLUMNS} FROM courses WHERE slug = ?`).bind(slug).first<CourseRow>();
  return row ? toCourse(row) : null;
});

export async function getAdminCourseById(id: string): Promise<AdminCourse | null> {
  const row = await getBindings().db.prepare(`SELECT ${COLUMNS} FROM courses WHERE id = ?`).bind(id).first<CourseRow>();
  return row ? toCourse(row) : null;
}

export interface CourseCounts {
  lectures: number;
  liveLectures: number;
  draftLectures: number;
  scheduledLectures: number;
  topics: number;
  questions: number;
  publishedQuestions: number;
  quizzes: number;
  exams: number;
  resources: number;
}

/** Courses the account may open (null = all), in display order, with content counts. */
export async function listAdminCourses(courseIds: string[] | null): Promise<(AdminCourse & { counts: CourseCounts })[]> {
  if (courseIds && courseIds.length === 0) return [];
  const { db } = getBindings();
  const filter = courseIds ? `WHERE c.id IN (${courseIds.map(() => "?").join(", ")})` : "";
  const now = Date.now();
  const { results } = await db
    .prepare(
      `SELECT c.id, c.slug, c.title, c.short_title AS shortTitle, c.description, c.primary_language AS primaryLanguage, c.tags,
        c.status, c.sort_order AS sortOrder, c.published_at AS publishedAt, c.updated_at AS updatedAt,
        (SELECT count(*) FROM lessons l WHERE l.course_id = c.id) AS lectures,
        (SELECT count(*) FROM lessons l WHERE l.course_id = c.id AND (l.status = 'published' OR (l.status = 'scheduled' AND l.publish_at <= ${now}))) AS liveLectures,
        (SELECT count(*) FROM lessons l WHERE l.course_id = c.id AND l.status = 'draft') AS draftLectures,
        (SELECT count(*) FROM lessons l WHERE l.course_id = c.id AND l.status = 'scheduled' AND l.publish_at > ${now}) AS scheduledLectures,
        (SELECT count(*) FROM topics t WHERE t.course_id = c.id) AS topics,
        (SELECT count(*) FROM exercises e WHERE e.course_id = c.id) AS questions,
        (SELECT count(*) FROM exercises e WHERE e.course_id = c.id AND e.status = 'published') AS publishedQuestions,
        (SELECT count(*) FROM quizzes q WHERE q.course_id = c.id AND q.slug NOT GLOB '*-model-[b-z]') AS quizzes,
        (SELECT count(*) FROM exam_templates x WHERE x.course_id = c.id) AS exams,
        (SELECT count(*) FROM resources r WHERE r.course_id = c.id) AS resources
       FROM courses c ${filter}
       ORDER BY c.sort_order, c.title`,
    )
    .bind(...(courseIds ?? []))
    .all<CourseRow & CourseCounts>();
  return results.map((row) => ({
    ...toCourse(row),
    counts: {
      lectures: row.lectures,
      liveLectures: row.liveLectures,
      draftLectures: row.draftLectures,
      scheduledLectures: row.scheduledLectures,
      topics: row.topics,
      questions: row.questions,
      publishedQuestions: row.publishedQuestions,
      quizzes: row.quizzes,
      exams: row.exams,
      resources: row.resources,
    },
  }));
}

/** Course names for the admin menu (null = all courses). */
export const listCourseNav = cache(async (courseIds: string[] | null): Promise<{ id: string; slug: string; shortTitle: string; status: CourseStatus }[]> => {
  if (courseIds && courseIds.length === 0) return [];
  const filter = courseIds ? `WHERE id IN (${courseIds.map(() => "?").join(", ")})` : "";
  const { results } = await getBindings()
    .db.prepare(`SELECT id, slug, short_title AS shortTitle, status FROM courses ${filter} ORDER BY sort_order, title`)
    .bind(...(courseIds ?? []))
    .all<{ id: string; slug: string; shortTitle: string; status: CourseStatus }>();
  return results;
});
