// Search inside one course. The FTS5 table holds every course's rows, so every
// query filters on course_id: results from another course can't appear.
import { MATCH_END, MATCH_START, toFtsQuery } from "@/lib/search-query";
import type { CourseScope } from "@/server/courses/scope";
import { getBindings } from "@/server/platform/env";

export interface SearchResult {
  entityType: "lesson" | "topic" | "resource" | "exercise" | "quiz";
  url: string;
  title: string;
  snippet: string;
}

export async function searchCourse(scope: CourseScope, query: string, limit = 20): Promise<SearchResult[]> {
  const fts = toFtsQuery(query);
  if (!fts) return [];
  const { db } = getBindings();
  const { results } = await db
    .prepare(
      `SELECT entity_type AS entityType, url, title,
              snippet(search_index, 5, ?1, ?2, '…', 18) AS snippet
         FROM search_index
        WHERE search_index MATCH ?3 AND course_id = ?4
          -- Lectures and quizzes scheduled for later are indexed when saved but only found once live.
          AND NOT EXISTS (SELECT 1 FROM lessons l WHERE search_index.entity_type = 'lesson' AND l.id = search_index.entity_id
                AND NOT (l.status = 'published' OR (l.status = 'scheduled' AND l.publish_at <= unixepoch() * 1000)))
          AND NOT EXISTS (SELECT 1 FROM quizzes q WHERE search_index.entity_type = 'quiz' AND q.id = search_index.entity_id
                AND NOT (q.status = 'published' OR (q.status = 'scheduled' AND q.publish_at <= unixepoch() * 1000)))
        ORDER BY bm25(search_index, 0.0, 0.0, 0.0, 0.0, 6.0, 1.0)
        LIMIT ?5`,
    )
    .bind(MATCH_START, MATCH_END, fts, scope.courseId, limit)
    .all<SearchResult>();
  // Only link to course pages: rows are written by our own content tools, but check anyway.
  const prefix = `/courses/${scope.slug}/`;
  return results.filter((r) => r.url.startsWith(prefix));
}
