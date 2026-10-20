// The audit log (admin_audit_logs): who changed what, in which course, and when.
// Every admin action adds a row in the same D1 batch as the change itself, so a
// change is never saved without its log entry. Content snapshots for "history"
// go to content_revisions instead (see revisionStatement).
import { getBindings } from "@/server/platform/env";
import { newId } from "@/lib/ids";
import type { REVISION_ENTITY } from "@/db/enums";

export interface AuditEntry {
  actorId: string | null;
  courseId: string | null;
  /** e.g. "lesson.update", "lesson.publish", "resource.upload", "auth.sign_in" */
  action: string;
  entityType: string;
  entityId: string | null;
  before?: unknown;
  after?: unknown;
  ip: string | null;
}

/** Keeps logged states small: long text is cut, so the log stays a log and not a copy of the content. */
function compact(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const text = JSON.stringify(value, (_key, v: unknown) => (typeof v === "string" && v.length > 300 ? `${v.slice(0, 300)}…` : v));
  return text.length > 8000 ? JSON.stringify({ note: "too large to log" }) : text;
}

export function auditStatement(entry: AuditEntry, now = Date.now()): D1PreparedStatement {
  return getBindings()
    .db.prepare(
      `INSERT INTO admin_audit_logs (id, actor_user_id, course_id, action, entity_type, entity_id, before_state, after_state, ip_address, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      newId("log"),
      entry.actorId,
      entry.courseId,
      entry.action,
      entry.entityType,
      entry.entityId,
      compact(entry.before),
      compact(entry.after),
      entry.ip,
      now,
    );
}

export async function audit(entry: AuditEntry): Promise<void> {
  await auditStatement(entry).run();
}

/** A numbered snapshot of a piece of content (lecture, question, quiz, exam), for its history page. */
export function revisionStatement(entry: {
  courseId: string;
  entityType: (typeof REVISION_ENTITY)[number];
  entityId: string;
  snapshot: unknown;
  authorId: string | null;
  now?: number;
}): D1PreparedStatement {
  return getBindings()
    .db.prepare(
      `INSERT INTO content_revisions (id, course_id, entity_type, entity_id, revision_no, snapshot, author_id, created_at)
       SELECT ?1, ?2, ?3, ?4, coalesce(max(revision_no), 0) + 1, ?5, ?6, ?7
         FROM content_revisions WHERE entity_type = ?3 AND entity_id = ?4`,
    )
    .bind(newId("rev"), entry.courseId, entry.entityType, entry.entityId, JSON.stringify(entry.snapshot), entry.authorId, entry.now ?? Date.now());
}

export interface AuditRow {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  createdAt: number;
  actorName: string | null;
  actorEmail: string | null;
  courseSlug: string | null;
  courseTitle: string | null;
  ipAddress: string | null;
  afterState: string | null;
}

/** Newest first. courseIds null = every course and site-level entries; otherwise only those courses. */
export async function listAudit(options: {
  courseIds: string[] | null;
  limit?: number;
  before?: number;
  actorId?: string;
  /** Only actions starting with one of these, e.g. ["ads.", "consent."]. */
  actionPrefixes?: string[];
}): Promise<AuditRow[]> {
  const { db } = getBindings();
  const where: string[] = [];
  const binds: unknown[] = [];
  if (options.courseIds) {
    if (options.courseIds.length === 0) return [];
    where.push(`l.course_id IN (${options.courseIds.map(() => "?").join(", ")})`);
    binds.push(...options.courseIds);
  }
  if (options.before) {
    where.push("l.created_at < ?");
    binds.push(options.before);
  }
  if (options.actorId) {
    where.push("l.actor_user_id = ?");
    binds.push(options.actorId);
  }
  if (options.actionPrefixes?.length) {
    where.push(`(${options.actionPrefixes.map(() => "substr(l.action, 1, length(?)) = ?").join(" OR ")})`);
    for (const prefix of options.actionPrefixes) binds.push(prefix, prefix);
  }
  const limit = Math.min(Math.max(options.limit ?? 50, 1), 200);
  const { results } = await db
    .prepare(
      `SELECT l.id, l.action, l.entity_type AS entityType, l.entity_id AS entityId, l.created_at AS createdAt,
              u.name AS actorName, u.email AS actorEmail, c.slug AS courseSlug, c.short_title AS courseTitle,
              l.ip_address AS ipAddress, l.after_state AS afterState
         FROM admin_audit_logs l
         LEFT JOIN users u ON u.id = l.actor_user_id
         LEFT JOIN courses c ON c.id = l.course_id
        ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
        ORDER BY l.created_at DESC
        LIMIT ${limit}`,
    )
    .bind(...binds)
    .all<AuditRow>();
  return results;
}

export interface RevisionRow {
  revisionNo: number;
  createdAt: number;
  authorName: string | null;
}

/** A piece of content's saved versions, newest first. */
export async function listRevisions(courseId: string, entityType: (typeof REVISION_ENTITY)[number], entityId: string, limit = 50): Promise<RevisionRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT r.revision_no AS revisionNo, r.created_at AS createdAt, coalesce(nullif(u.name, ''), u.email) AS authorName
         FROM content_revisions r LEFT JOIN users u ON u.id = r.author_id
        WHERE r.course_id = ? AND r.entity_type = ? AND r.entity_id = ?
        ORDER BY r.revision_no DESC LIMIT ?`,
    )
    .bind(courseId, entityType, entityId, Math.min(Math.max(limit, 1), 200))
    .all<RevisionRow>();
  return results;
}

export async function getRevisionSnapshot(courseId: string, entityType: (typeof REVISION_ENTITY)[number], entityId: string, revisionNo: number): Promise<unknown> {
  const row = await getBindings()
    .db.prepare("SELECT snapshot FROM content_revisions WHERE course_id = ? AND entity_type = ? AND entity_id = ? AND revision_no = ?")
    .bind(courseId, entityType, entityId, revisionNo)
    .first<{ snapshot: string }>();
  return row ? (JSON.parse(row.snapshot) as unknown) : null;
}
