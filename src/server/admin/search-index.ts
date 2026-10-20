// Keeps the per-course search index (FTS5 table search_index) in step with
// admin edits. Rows are replaced whole: delete, then insert when searchable.
import { getBindings } from "@/server/platform/env";

export type SearchEntity = "lesson" | "topic" | "resource" | "exercise" | "quiz";

export function searchStatements(entry: {
  courseId: string;
  entityType: SearchEntity;
  entityId: string;
  /** null = not searchable (draft, archived, reserved…): only remove the old row. */
  row: { url: string; title: string; body: string } | null;
}): D1PreparedStatement[] {
  const { db } = getBindings();
  const statements = [
    db
      .prepare("DELETE FROM search_index WHERE course_id = ? AND entity_type = ? AND entity_id = ?")
      .bind(entry.courseId, entry.entityType, entry.entityId),
  ];
  if (entry.row) {
    statements.push(
      db
        .prepare("INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(entry.courseId, entry.entityType, entry.entityId, entry.row.url, entry.row.title, entry.row.body.slice(0, 50_000)),
    );
  }
  return statements;
}

/** After a course's slug changes, its search rows point at the new addresses. */
export function renameCourseUrls(courseId: string, oldSlug: string, newSlug: string): D1PreparedStatement {
  const oldPrefix = `/courses/${oldSlug}/`;
  return getBindings()
    .db.prepare("UPDATE search_index SET url = ? || substr(url, ?) WHERE course_id = ? AND substr(url, 1, ?) = ?")
    .bind(`/courses/${newSlug}/`, oldPrefix.length + 1, courseId, oldPrefix.length, oldPrefix);
}
