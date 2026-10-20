// Lectures in the admin: list, load for editing, save (with its sections,
// related lectures and attached files), publish/schedule, reorder, delete,
// history, and export as Markdown.
import { annotationsToText, serializeLesson } from "@/lib/lesson/serialize";
import { type LessonSource, markdownToPlainText, readingMinutes } from "@/lib/lesson/source";
import { type DraftProblem, type LessonDraft, type LessonStatus, type ValidLesson, readLessonDraft, validateLesson } from "@/lib/admin/lesson-draft";
import { newId } from "@/lib/ids";
import type { CodeAnnotations } from "@/lib/lesson/annotations";
import { getBindings } from "@/server/platform/env";
import { auditStatement, getRevisionSnapshot, revisionStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, today } from "./context";
import type { AdminCourse } from "./courses";
import { searchStatements } from "./search-index";
import { deletePrefix } from "./resources";
import { moveSeoPath } from "./seo";
import { FORMAT_INFO, LESSON_IMAGE_RULE } from "@/lib/files/sniff";
import { UploadError, receiveUpload } from "@/server/files/upload";
import { lessonImageUrl } from "@/lib/lesson/media";

export interface AdminLessonRow {
  id: string;
  slug: string;
  title: string;
  topicId: string;
  topicTitle: string;
  lectureNumber: number | null;
  status: LessonStatus;
  publishAt: number | null;
  sortOrder: number;
  updatedAt: number;
  updatedBy: string | null;
  sections: number;
}

export async function listLessons(course: AdminCourse): Promise<AdminLessonRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT l.id, l.slug, l.title, l.topic_id AS topicId, t.title AS topicTitle, l.lecture_number AS lectureNumber, l.status,
              l.publish_at AS publishAt, l.sort_order AS sortOrder, l.updated_at AS updatedAt, u.name AS updatedBy,
              (SELECT count(*) FROM lesson_sections s WHERE s.course_id = l.course_id AND s.lesson_id = l.id) AS sections
         FROM lessons l
         JOIN topics t ON t.course_id = l.course_id AND t.id = l.topic_id
         LEFT JOIN users u ON u.id = l.updated_by
        WHERE l.course_id = ?
        ORDER BY l.sort_order, l.title`,
    )
    .bind(course.id)
    .all<AdminLessonRow>();
  return results;
}

/** Whether students can see it now (published, or scheduled with a time that has passed). */
export function isLive(row: { status: LessonStatus; publishAt: number | null }, now = Date.now()): boolean {
  return row.status === "published" || (row.status === "scheduled" && row.publishAt !== null && row.publishAt <= now);
}

export interface LessonForEdit {
  id: string;
  draft: LessonDraft;
  createdAt: number;
  updatedAt: number;
  publishedAt: number | null;
}

interface SectionRow {
  id: string;
  kind: LessonDraft["sections"][number]["kind"];
  title: string;
  bodyMd: string;
  code: string | null;
  codeLanguage: "cpp" | "python" | "pseudocode" | "text" | null;
  runnable: number;
  sampleInput: string;
  expectedOutput: string | null;
  annotations: string | null;
  imageKey: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

export async function getLessonForEdit(course: AdminCourse, id: string): Promise<LessonForEdit | null> {
  const { db } = getBindings();
  const [lessonRes, sectionRes, relatedRes, resourceRes] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT id, slug, title, topic_id AS topicId, lecture_number AS lectureNumber, difficulty, description, objectives, prerequisites,
                status, publish_at AS publishAt, published_at AS publishedAt, created_at AS createdAt, updated_at AS updatedAt
           FROM lessons WHERE course_id = ? AND id = ?`,
      )
      .bind(course.id, id),
    db
      .prepare(
        `SELECT id, kind, title, body_md AS bodyMd, code, code_language AS codeLanguage, runnable, sample_input AS sampleInput,
                expected_output AS expectedOutput, annotations, image_key AS imageKey, image_alt AS imageAlt,
                image_width AS imageWidth, image_height AS imageHeight
           FROM lesson_sections WHERE course_id = ? AND lesson_id = ? ORDER BY sort_order`,
      )
      .bind(course.id, id),
    db.prepare("SELECT related_lesson_id AS id FROM lesson_relations WHERE course_id = ? AND lesson_id = ? ORDER BY sort_order").bind(course.id, id),
    db.prepare("SELECT resource_id AS id FROM lesson_resources WHERE course_id = ? AND lesson_id = ? ORDER BY sort_order").bind(course.id, id),
  ]);
  const l = lessonRes?.results[0] as
    | {
        id: string;
        slug: string;
        title: string;
        topicId: string;
        lectureNumber: number | null;
        difficulty: LessonDraft["difficulty"];
        description: string;
        objectives: string;
        prerequisites: string;
        status: LessonStatus;
        publishAt: number | null;
        publishedAt: number | null;
        createdAt: number;
        updatedAt: number;
      }
    | undefined;
  if (!l) return null;
  const parseList = (json: string) => {
    try {
      const v = JSON.parse(json) as unknown;
      return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
    } catch {
      return [];
    }
  };
  const sections = (sectionRes?.results ?? []) as unknown as SectionRow[];
  return {
    id: l.id,
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
    publishedAt: l.publishedAt,
    draft: {
      title: l.title,
      slug: l.slug,
      topicId: l.topicId,
      lectureNumber: l.lectureNumber,
      difficulty: l.difficulty,
      description: l.description,
      objectives: parseList(l.objectives),
      prerequisites: parseList(l.prerequisites),
      relatedIds: (relatedRes?.results ?? []).map((r) => String(r.id)),
      resourceIds: (resourceRes?.results ?? []).map((r) => String(r.id)),
      status: l.status,
      publishAt: l.publishAt,
      sections: sections.map((s) => {
        const annotations = s.annotations ? (JSON.parse(s.annotations) as CodeAnnotations) : null;
        const { notes, strips } = annotationsToText(annotations);
        return {
          id: s.id,
          kind: s.kind,
          title: s.title,
          bodyMd: s.bodyMd,
          program:
            s.code !== null && s.codeLanguage
              ? {
                  language: s.codeLanguage,
                  code: s.code,
                  runnable: s.runnable === 1,
                  input: s.sampleInput.replace(/\n$/, ""),
                  output: s.expectedOutput === null ? null : s.expectedOutput.replace(/\n$/, ""),
                  notes,
                  strips,
                }
              : null,
          image:
            s.imageKey && s.imageWidth && s.imageHeight
              ? { key: s.imageKey, width: s.imageWidth, height: s.imageHeight, alt: s.imageAlt ?? "" }
              : null,
        };
      }),
    },
  };
}

export interface LessonSaveResult {
  id: string;
  problems?: DraftProblem[];
}

async function contextFor(course: AdminCourse, lessonId: string) {
  const { db } = getBindings();
  const [topics, lessons, resources] = await db.batch<{ id: string }>([
    db.prepare("SELECT id FROM topics WHERE course_id = ?").bind(course.id),
    db.prepare("SELECT id FROM lessons WHERE course_id = ? AND id <> ?").bind(course.id, lessonId),
    db.prepare("SELECT id FROM resources WHERE course_id = ?").bind(course.id),
  ]);
  return {
    courseId: course.id,
    lessonId,
    topicIds: new Set((topics?.results ?? []).map((r) => r.id)),
    lessonIds: new Set((lessons?.results ?? []).map((r) => r.id)),
    resourceIds: new Set((resources?.results ?? []).map((r) => r.id)),
    now: Date.now(),
  };
}

function searchBody(lesson: ValidLesson): string {
  const parts: string[] = [lesson.description, ...lesson.objectives];
  for (const s of lesson.sections) parts.push(s.title, markdownToPlainText(s.bodyMd), s.code ?? "");
  return parts.join(" ").replace(/\s+/g, " ").trim();
}

const STATUS_ACTION: Record<LessonStatus, string> = {
  published: "lesson.publish",
  scheduled: "lesson.schedule",
  draft: "lesson.unpublish",
  archived: "lesson.archive",
};

/**
 * Saves a lecture: details, sections (replaced as a whole), related lectures and
 * attached files, its search entry, a history snapshot and an audit entry, in
 * one D1 batch (all or nothing). `id` null creates a new lecture.
 */
export async function saveLesson(actor: Actor, course: AdminCourse, id: string | null, raw: unknown): Promise<AdminResult<LessonSaveResult>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const existing = id
    ? await db
        .prepare("SELECT id, status, publish_at AS publishAt, title, slug FROM lessons WHERE course_id = ? AND id = ?")
        .bind(course.id, id)
        .first<{ id: string; status: LessonStatus; publishAt: number | null; title: string; slug: string }>()
    : null;
  if (id && !existing) return fail("This lecture doesn't exist in this course any more.");
  const lessonId = existing?.id ?? id ?? newId("les");

  const draft = readLessonDraft(raw);
  // Only course admins and administrators change what students see.
  const mayPublish = !denied(actor, "publish", course);
  if (!mayPublish) {
    draft.status = existing?.status ?? "draft";
    draft.publishAt = existing?.publishAt ?? null;
  }
  const ctx = await contextFor(course, lessonId);
  const checked = validateLesson(draft, ctx);
  if (!checked.ok) {
    return fail(
      checked.problems.length === 1 ? (checked.problems[0]?.message ?? "Check the lecture.") : `${checked.problems.length} things need fixing before this lecture can be saved.`,
      Object.fromEntries(checked.problems.map((p) => [p.path, p.message])),
    );
  }
  const lesson = checked.lesson;
  const now = ctx.now;
  const minutes = readingMinutes(lesson);
  const live = lesson.status === "published" || lesson.status === "scheduled";

  const statements: D1PreparedStatement[] = [];
  if (existing) {
    statements.push(
      db
        .prepare(
          `UPDATE lessons SET topic_id = ?, slug = ?, title = ?, description = ?, lecture_number = ?, difficulty = ?, objectives = ?,
                  prerequisites = ?, reading_minutes = ?, status = ?, publish_at = ?,
                  published_at = CASE WHEN ? = 'published' THEN coalesce(published_at, ?) WHEN ? = 'scheduled' THEN ? ELSE published_at END,
                  updated_by = ?, updated_at = ?
            WHERE course_id = ? AND id = ?`,
        )
        .bind(
          lesson.topicId, lesson.slug, lesson.title, lesson.description, lesson.lectureNumber, lesson.difficulty,
          JSON.stringify(lesson.objectives), JSON.stringify(lesson.prerequisites), minutes, lesson.status, lesson.publishAt,
          lesson.status, now, lesson.status, lesson.publishAt,
          actor.staff.id, now, course.id, lessonId,
        ),
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO lessons (id, course_id, topic_id, slug, title, description, lecture_number, sort_order, difficulty, objectives,
                                prerequisites, reading_minutes, status, publish_at, published_at, created_by, updated_by, created_at, updated_at)
           SELECT ?, ?, ?, ?, ?, ?, ?, coalesce(max(sort_order), 0) + 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? FROM lessons WHERE course_id = ?`,
        )
        .bind(
          lessonId, course.id, lesson.topicId, lesson.slug, lesson.title, lesson.description, lesson.lectureNumber, lesson.difficulty,
          JSON.stringify(lesson.objectives), JSON.stringify(lesson.prerequisites), minutes, lesson.status, lesson.publishAt,
          lesson.status === "published" ? now : lesson.status === "scheduled" ? lesson.publishAt : null,
          actor.staff.id, actor.staff.id, now, now, course.id,
        ),
    );
  }
  statements.push(
    db.prepare("DELETE FROM lesson_sections WHERE course_id = ? AND lesson_id = ?").bind(course.id, lessonId),
    db.prepare("DELETE FROM lesson_relations WHERE course_id = ? AND lesson_id = ?").bind(course.id, lessonId),
    db.prepare("DELETE FROM lesson_resources WHERE course_id = ? AND lesson_id = ?").bind(course.id, lessonId),
  );
  const usedIds = new Set<string>();
  lesson.sections.forEach((s, i) => {
    // Keep a section's id while it stays in this lecture; new sections get new ids.
    const sectionId = s.id && /^sec_[a-f0-9]{8,32}$/.test(s.id) && !usedIds.has(s.id) ? s.id : newId("sec");
    usedIds.add(sectionId);
    statements.push(
      db
        .prepare(
          `INSERT INTO lesson_sections (id, course_id, lesson_id, kind, title, body_md, code, code_language, runnable, sample_input,
                                        expected_output, annotations, image_key, image_alt, image_width, image_height, sort_order, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .bind(
          sectionId, course.id, lessonId, s.kind, s.title, s.bodyMd, s.code, s.codeLanguage, s.runnable ? 1 : 0, s.sampleInput,
          s.expectedOutput, s.annotations ? JSON.stringify(s.annotations) : null, s.image?.key ?? null, s.image?.alt ?? null,
          s.image?.width ?? null, s.image?.height ?? null, i + 1, now, now,
        ),
    );
  });
  lesson.relatedIds.forEach((relatedId, i) =>
    statements.push(
      db.prepare("INSERT INTO lesson_relations (course_id, lesson_id, related_lesson_id, sort_order) VALUES (?, ?, ?, ?)").bind(course.id, lessonId, relatedId, i + 1),
    ),
  );
  lesson.resourceIds.forEach((resourceId, i) =>
    statements.push(
      db.prepare("INSERT INTO lesson_resources (course_id, lesson_id, resource_id, sort_order) VALUES (?, ?, ?, ?)").bind(course.id, lessonId, resourceId, i + 1),
    ),
  );
  if (existing && existing.slug !== lesson.slug) {
    statements.push(...moveSeoPath(course.id, `/courses/${course.slug}/lectures/${existing.slug}`, `/courses/${course.slug}/lectures/${lesson.slug}`));
  }
  statements.push(
    ...searchStatements({
      courseId: course.id,
      entityType: "lesson",
      entityId: lessonId,
      // Scheduled lectures are indexed now; search only shows them once their time has come.
      row: live ? { url: `/courses/${course.slug}/lectures/${lesson.slug}`, title: lesson.title, body: searchBody(lesson) } : null,
    }),
    revisionStatement({ courseId: course.id, entityType: "lesson", entityId: lessonId, snapshot: lesson, authorId: actor.staff.id, now }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: !existing ? "lesson.create" : existing.status !== lesson.status ? STATUS_ACTION[lesson.status] : "lesson.update",
        entityType: "lesson",
        entityId: lessonId,
        before: existing ? { title: existing.title, slug: existing.slug, status: existing.status } : undefined,
        after: { title: lesson.title, slug: lesson.slug, status: lesson.status, sections: lesson.sections.length },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) {
      const message = /image_key/.test(String(error)) ? "The same picture is used twice. Upload it again for the second section." : "Another lecture in this course already uses this slug.";
      return fail(message, /image_key/.test(String(error)) ? undefined : { slug: message });
    }
    throw error;
  }
  await removeUnusedImages(course, lessonId, lesson.sections.map((s) => s.image?.key).filter((k): k is string => !!k));
  return done({ id: lessonId }, existing ? "Lecture saved." : "Lecture created.");
}

/** Publish, schedule, move back to draft or archive, from the lecture list. */
export async function setLessonStatus(actor: Actor, course: AdminCourse, id: string, status: LessonStatus, publishAt: number | null): Promise<AdminResult> {
  if (denied(actor, "publish", course)) return fail(NO_PERMISSION);
  const current = await getLessonForEdit(course, id);
  if (!current) return fail("This lecture doesn't exist in this course any more.");
  const result = await saveLesson(actor, course, id, { ...current.draft, status, publishAt });
  return result.ok ? done(undefined, result.message) : result;
}

export async function reorderLessons(actor: Actor, course: AdminCourse, ids: unknown): Promise<AdminResult> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const current = await listLessons(course);
  if (!Array.isArray(ids) || ids.length !== current.length || !current.every((l) => ids.includes(l.id))) {
    return fail("The list changed while you were working. Reload the page and try again.");
  }
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    ...ids.map((lessonId, i) => db.prepare("UPDATE lessons SET sort_order = ? WHERE course_id = ? AND id = ?").bind(i + 1, course.id, String(lessonId))),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "lesson.reorder", entityType: "lesson", entityId: null, ip: actor.ip }, now),
  ]);
  return done(undefined, "New order saved.");
}

export async function deleteLesson(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const { db, files } = getBindings();
  const lesson = await db.prepare("SELECT title, slug, status FROM lessons WHERE course_id = ? AND id = ?").bind(course.id, id).first<{ title: string; slug: string; status: LessonStatus }>();
  if (!lesson) return fail("This lecture doesn't exist in this course any more.");
  const now = Date.now();
  // Sections, related links, attachments, progress and bookmarks go with it; questions linked to it are unlinked (trigger).
  await db.batch([
    db.prepare("DELETE FROM lessons WHERE course_id = ? AND id = ?").bind(course.id, id),
    db.prepare("DELETE FROM seo_metadata WHERE course_id = ? AND path = ?").bind(course.id, `/courses/${course.slug}/lectures/${lesson.slug}`),
    ...searchStatements({ courseId: course.id, entityType: "lesson", entityId: id, row: null }),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "lesson.delete", entityType: "lesson", entityId: id, before: lesson, after: { title: lesson.title }, ip: actor.ip }, now),
  ]);
  // Its pictures in R2 are no use to anyone now.
  await deletePrefix(files, `courses/${course.id}/lessons/${id}/`);
  return done(undefined, "Lecture deleted.");
}

/** The lecture in the content Markdown format (docs/CONTENT.md), with pictures as images/<file>. */
export async function exportLessonMarkdown(course: AdminCourse, id: string): Promise<{ filename: string; markdown: string } | null> {
  const lesson = await getLessonForEdit(course, id);
  if (!lesson) return null;
  const { db } = getBindings();
  const [topic, related] = await db.batch<{ slug: string }>([
    db.prepare("SELECT slug FROM topics WHERE course_id = ? AND id = ?").bind(course.id, lesson.draft.topicId),
    db
      .prepare(
        `SELECT l.slug FROM lesson_relations r JOIN lessons l ON l.course_id = r.course_id AND l.id = r.related_lesson_id
          WHERE r.course_id = ? AND r.lesson_id = ? ORDER BY r.sort_order`,
      )
      .bind(course.id, id),
  ]);
  const d = lesson.draft;
  const source: LessonSource = {
    slug: d.slug,
    title: d.title,
    topic: topic?.results[0]?.slug ?? "",
    lecture: d.lectureNumber,
    difficulty: d.difficulty,
    description: d.description,
    objectives: d.objectives,
    prerequisites: d.prerequisites,
    related: (related?.results ?? []).map((r) => r.slug),
    status: d.status === "published" || d.status === "scheduled" ? "published" : "draft",
    updated: today(lesson.updatedAt),
    sections: d.sections.map((s) => ({
      kind: s.kind,
      title: s.title,
      bodyMd: s.bodyMd,
      code: s.program?.code ?? null,
      codeLanguage: s.program?.language ?? null,
      runnable: s.program?.runnable ?? false,
      sampleInput: s.program && s.program.input !== "" ? `${s.program.input}\n` : "",
      expectedOutput: s.program && s.program.output !== null ? `${s.program.output}\n` : null,
      verifyCode: null,
      annotations: null,
      image: s.image ? { file: `images/${s.image.key.slice(s.image.key.lastIndexOf("/") + 1)}`, alt: s.image.alt } : null,
    })),
  };
  // Annotations go back in as the text rows the editor shows.
  const markdown = serializeLesson(source).replace(/\n$/, "");
  const withNotes = addAnnotationBlocks(markdown, d);
  return { filename: `${d.slug}.md`, markdown: `${withNotes}\n` };
}

/** serializeLesson takes parsed annotations; the editor keeps them as text rows, so add those blocks after each program. */
function addAnnotationBlocks(markdown: string, draft: LessonDraft): string {
  const chunks = markdown.split(/\n(?=## \[)/);
  return chunks
    .map((chunk, i) => {
      if (i === 0) return chunk; // front matter
      const p = draft.sections[i - 1]?.program;
      if (!p) return chunk;
      const extra = [p.notes ? `\`\`\`notes\n${p.notes}\n\`\`\`` : "", p.strips ? `\`\`\`strip\n${p.strips}\n\`\`\`` : ""].filter(Boolean);
      return extra.length ? `${chunk.replace(/\n+$/, "")}\n\n${extra.join("\n\n")}\n` : chunk;
    })
    .join("\n");
}

/**
 * A picture for a section of a saved lecture: PNG, JPEG, WebP or GIF up to 5 MB.
 * It is stored now and used when the lecture is saved; pictures no section uses
 * are removed a day later (removeUnusedImages), so an upload that was never saved doesn't linger.
 */
export async function uploadLessonImage(
  actor: Actor,
  course: AdminCourse,
  lessonId: string,
  request: Request,
  fileName: string,
): Promise<AdminResult<{ key: string; width: number; height: number; previewUrl: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const lesson = await getBindings().db.prepare("SELECT id FROM lessons WHERE course_id = ? AND id = ?").bind(course.id, lessonId).first();
  if (!lesson) return fail("Save the lecture once before adding pictures.");
  const name = `img-${newId("x").slice(2, 14)}`;
  let received;
  try {
    received = await receiveUpload(request, {
      // The name carries the real extension: the public media route serves by extension.
      key: (format) => `courses/${course.id}/lessons/${lessonId}/${name}.${FORMAT_INFO[format].extension}`,
      allowed: LESSON_IMAGE_RULE.formats,
      maxBytes: LESSON_IMAGE_RULE.maxBytes,
      fileName,
    });
  } catch (error) {
    if (error instanceof UploadError) return fail(error.status === 415 ? `${error.message} Use PNG, JPEG, WebP or GIF.` : error.message);
    throw error;
  }
  const width = received.width ?? 0;
  const height = received.height ?? 0;
  if (width > LESSON_IMAGE_RULE.maxSide || height > LESSON_IMAGE_RULE.maxSide) {
    await getBindings().files.delete(received.key);
    return fail(`The picture is ${width} × ${height} pixels. Make it at most ${LESSON_IMAGE_RULE.maxSide} pixels on each side.`);
  }
  const key = received.key;
  return done({ key, width, height, previewUrl: adminImageUrl(course, key) ?? "" }, "Picture uploaded.");
}

/** Staff can see a draft lecture's pictures through the admin media route. */
export function adminImageUrl(course: AdminCourse, key: string): string | null {
  const publicUrl = lessonImageUrl(course.slug, course.id, key);
  return publicUrl ? publicUrl.replace(`/courses/${course.slug}/media/`, `/admin/courses/${course.slug}/media/`) : null;
}

const DAY = 24 * 60 * 60 * 1000;

async function removeUnusedImages(course: AdminCourse, lessonId: string, used: string[]): Promise<void> {
  const { files } = getBindings();
  const keep = new Set(used);
  const list = await files.list({ prefix: `courses/${course.id}/lessons/${lessonId}/` });
  const stale = list.objects.filter((o) => !keep.has(o.key) && Date.now() - o.uploaded.getTime() > DAY).map((o) => o.key);
  if (stale.length) await files.delete(stale);
}

/** Puts an earlier version's content back (as a new save); the lecture keeps its current status. */
export async function restoreLessonRevision(actor: Actor, course: AdminCourse, id: string, revisionNo: number): Promise<AdminResult<LessonSaveResult>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const current = await getLessonForEdit(course, id);
  if (!current) return fail("This lecture doesn't exist in this course any more.");
  const snapshot = (await getRevisionSnapshot(course.id, "lesson", id, revisionNo)) as ValidLesson | null;
  if (!snapshot || !Array.isArray(snapshot.sections)) return fail("That version isn't available.");
  const draft: LessonDraft = {
    ...snapshot,
    status: current.draft.status,
    publishAt: current.draft.publishAt,
    sections: snapshot.sections.map((s) => {
      const { notes, strips } = annotationsToText(s.annotations);
      return {
        id: s.id,
        kind: s.kind,
        title: s.title,
        bodyMd: s.bodyMd,
        program:
          s.code !== null && s.codeLanguage
            ? { language: s.codeLanguage, code: s.code, runnable: s.runnable, input: s.sampleInput.replace(/\n$/, ""), output: s.expectedOutput === null ? null : s.expectedOutput.replace(/\n$/, ""), notes, strips }
            : null,
        image: s.image,
      };
    }),
  };
  const result = await saveLesson(actor, course, id, draft);
  return result.ok ? done(result.value, `Version ${revisionNo} restored. It is saved as the newest version.`) : result;
}
