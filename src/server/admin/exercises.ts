// The question bank in the admin: list, load for editing, save, duplicate,
// publish, delete, import and export. A question is checked with the rules of
// the content files (src/lib/admin/exercise-draft.ts) and stored with the same
// rows the content build writes (src/lib/content/exercise-rows.ts).
import { createHash } from "node:crypto";
import { type ExerciseCheck, checkExercise, checkExerciseMarkdown, readExerciseInput } from "@/lib/admin/exercise-draft";
import { CHILD_TABLES, type StoredExercise, exerciseFromRows, exerciseRows, exerciseSearchBody } from "@/lib/content/exercise-rows";
import type { ExerciseSource } from "@/lib/exercise/source";
import { serializeExercise } from "@/lib/exercise/serialize";
import { newId } from "@/lib/ids";
import { getBindings } from "@/server/platform/env";
import { auditStatement, getRevisionSnapshot, revisionStatement } from "./audit";
import { type BankQuestion, examsBrokenBy, loadBankQuestions } from "./bank";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, insertStatement, isUniqueError, today } from "./context";
import type { AdminCourse } from "./courses";
import { searchStatements } from "./search-index";

/** Same ids as tools/build-content.ts (course, slug, position), so a seeded question keeps its option ids when saved here: answers a student sent mid-quiz point at them. */
const stableId = (prefix: string, ...parts: string[]) =>
  `${prefix}_${createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 16)}`;

export interface AdminExerciseRow {
  id: string;
  slug: string;
  title: string;
  type: ExerciseSource["type"];
  ask: string | null;
  difficulty: ExerciseSource["difficulty"];
  status: "draft" | "published" | "archived";
  reserved: boolean;
  topicTitle: string | null;
  lessonTitle: string | null;
  quizzes: number;
  updatedAt: number;
}

export interface ExerciseFilters {
  q?: string;
  type?: string;
  topicId?: string;
  status?: string;
  difficulty?: string;
}

export const EXERCISE_PAGE_SIZE = 50;

export async function listAdminExercises(course: AdminCourse, filters: ExerciseFilters = {}, page = 1): Promise<{ rows: AdminExerciseRow[]; total: number }> {
  const where = ["e.course_id = ?"];
  const binds: unknown[] = [course.id];
  if (filters.q) {
    where.push("(e.title LIKE ? ESCAPE '\\' OR e.slug LIKE ? ESCAPE '\\' OR e.prompt_md LIKE ? ESCAPE '\\')");
    const like = `%${filters.q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    binds.push(like, like, like);
  }
  if (filters.type && ["mcq", "trace", "correct_code", "write_code"].includes(filters.type)) {
    where.push("e.type = ?");
    binds.push(filters.type);
  }
  if (filters.difficulty && ["easy", "medium", "hard"].includes(filters.difficulty)) {
    where.push("e.difficulty = ?");
    binds.push(filters.difficulty);
  }
  if (filters.status === "reserved") where.push("json_extract(e.settings, '$.reserved') = 1");
  else if (filters.status && ["draft", "published"].includes(filters.status)) {
    where.push("e.status = ?");
    binds.push(filters.status);
  }
  if (filters.topicId === "none") where.push("e.topic_id IS NULL");
  else if (filters.topicId) {
    where.push("e.topic_id = ?");
    binds.push(filters.topicId);
  }
  const { db } = getBindings();
  const offset = (Math.max(1, Math.floor(page)) - 1) * EXERCISE_PAGE_SIZE;
  const [rows, count] = await db.batch<Record<string, unknown>>([
    db
      .prepare(
        `SELECT e.id, e.slug, e.title, e.type, json_extract(e.settings, '$.ask') AS ask, e.difficulty, e.status,
                coalesce(json_extract(e.settings, '$.reserved'), 0) AS reserved, t.title AS topicTitle, l.title AS lessonTitle,
                (SELECT count(*) FROM quiz_questions q WHERE q.course_id = e.course_id AND q.exercise_id = e.id) AS quizzes,
                e.updated_at AS updatedAt
           FROM exercises e
           LEFT JOIN topics t ON t.course_id = e.course_id AND t.id = e.topic_id
           LEFT JOIN lessons l ON l.course_id = e.course_id AND l.id = e.lesson_id
          WHERE ${where.join(" AND ")}
          ORDER BY coalesce(t.sort_order, 1e9), e.title
          LIMIT ${EXERCISE_PAGE_SIZE} OFFSET ${offset}`,
      )
      .bind(...binds),
    db.prepare(`SELECT count(*) AS n FROM exercises e WHERE ${where.join(" AND ")}`).bind(...binds),
  ]);
  return {
    rows: (rows?.results ?? []).map((r) => ({ ...(r as unknown as AdminExerciseRow), reserved: r.reserved === 1 })),
    total: Number(count?.results[0]?.n ?? 0),
  };
}

async function loadStored(course: AdminCourse, ids: readonly string[]): Promise<Map<string, StoredExercise & { id: string }>> {
  const out = new Map<string, StoredExercise & { id: string }>();
  const { db } = getBindings();
  // D1 binds at most 100 values per query.
  for (let i = 0; i < ids.length; i += 80) {
    const chunk = ids.slice(i, i + 80);
    const marks = chunk.map(() => "?").join(", ");
    const child = (sql: string) => db.prepare(sql.replace("%IDS%", marks)).bind(course.id, ...chunk);
    const [ex, opts, answers, tests, hints, steps] = await db.batch<Record<string, unknown>>([
      child(
        `SELECT e.id, e.slug, e.type, e.title, e.prompt_md AS promptMd, e.code, e.code_language AS codeLanguage,
                e.expected_behavior_md AS expectedBehaviorMd, e.explanation_md AS explanationMd, e.difficulty, e.settings, e.points,
                e.status, e.is_demo AS isDemo, e.updated_at AS updatedAt, t.slug AS topicSlug, l.slug AS lessonSlug
           FROM exercises e
           LEFT JOIN topics t ON t.course_id = e.course_id AND t.id = e.topic_id
           LEFT JOIN lessons l ON l.course_id = e.course_id AND l.id = e.lesson_id
          WHERE e.course_id = ? AND e.id IN (%IDS%)`,
      ),
      child("SELECT exercise_id AS e, label_md AS labelMd, is_correct AS isCorrect, feedback_md AS feedbackMd FROM exercise_options WHERE course_id = ? AND exercise_id IN (%IDS%) ORDER BY sort_order"),
      child("SELECT exercise_id AS e, kind, value FROM exercise_answers WHERE course_id = ? AND exercise_id IN (%IDS%) ORDER BY sort_order"),
      child("SELECT exercise_id AS e, name, stdin, expected_stdout AS expectedStdout, is_hidden AS isHidden FROM exercise_test_cases WHERE course_id = ? AND exercise_id IN (%IDS%) ORDER BY sort_order"),
      child("SELECT exercise_id AS e, hint_md AS hint FROM exercise_hints WHERE course_id = ? AND exercise_id IN (%IDS%) ORDER BY sort_order"),
      child("SELECT exercise_id AS e, line_no AS lineNo, explanation, variables, output FROM exercise_trace_steps WHERE course_id = ? AND exercise_id IN (%IDS%) ORDER BY step_no"),
    ]);
    const of = (res: typeof opts, id: string) => (res?.results ?? []).filter((r) => r.e === id);
    for (const r of ex?.results ?? []) {
      const id = String(r.id);
      out.set(id, {
        id,
        slug: String(r.slug),
        type: r.type as StoredExercise["type"],
        title: String(r.title),
        promptMd: String(r.promptMd),
        code: (r.code as string | null) ?? null,
        codeLanguage: (r.codeLanguage as StoredExercise["codeLanguage"]) ?? null,
        expectedBehaviorMd: String(r.expectedBehaviorMd ?? ""),
        explanationMd: String(r.explanationMd ?? ""),
        difficulty: r.difficulty as StoredExercise["difficulty"],
        settings: JSON.parse(String(r.settings ?? "{}")) as unknown,
        points: Number(r.points),
        status: r.status as StoredExercise["status"],
        isDemo: r.isDemo === 1,
        updatedAt: Number(r.updatedAt),
        topicSlug: (r.topicSlug as string | null) ?? null,
        lessonSlug: (r.lessonSlug as string | null) ?? null,
        options: of(opts, id).map((o) => ({ labelMd: String(o.labelMd), isCorrect: o.isCorrect === 1, feedbackMd: String(o.feedbackMd ?? "") })),
        answers: of(answers, id).map((a) => ({ kind: String(a.kind), value: String(a.value) })),
        tests: of(tests, id).map((t) => ({ name: String(t.name), stdin: String(t.stdin), expectedStdout: String(t.expectedStdout), isHidden: t.isHidden === 1 })),
        hints: of(hints, id).map((h) => String(h.hint)),
        steps: of(steps, id).map((s) => ({
          lineNo: (s.lineNo as number | null) ?? null,
          explanation: String(s.explanation),
          variables: JSON.parse(String(s.variables ?? "{}")) as unknown,
          output: String(s.output ?? ""),
        })),
      });
    }
  }
  return out;
}

export interface ExerciseForEdit {
  id: string;
  source: ExerciseSource;
  /** The stored status ("archived" reads as draft in the source). */
  status: "draft" | "published" | "archived";
  updatedAt: number;
  quizzes: { id: string; slug: string; title: string; status: string }[];
}

export async function getExerciseForEdit(course: AdminCourse, id: string): Promise<ExerciseForEdit | null> {
  const stored = (await loadStored(course, [id])).get(id);
  if (!stored) return null;
  const { results } = await getBindings()
    .db.prepare(
      `SELECT DISTINCT z.id, z.slug, z.title, z.status FROM quiz_questions q JOIN quizzes z ON z.course_id = q.course_id AND z.id = q.quiz_id
        WHERE q.course_id = ? AND q.exercise_id = ? ORDER BY z.title`,
    )
    .bind(course.id, id)
    .all<{ id: string; slug: string; title: string; status: string }>();
  return { id, source: exerciseFromRows(stored), status: stored.status, updatedAt: stored.updatedAt, quizzes: results };
}

/** Every question of the course in the content format, for "Export". */
export async function exportExercises(course: AdminCourse): Promise<ExerciseSource[]> {
  const { results } = await getBindings().db.prepare("SELECT id FROM exercises WHERE course_id = ? ORDER BY slug").bind(course.id).all<{ id: string }>();
  const stored = await loadStored(course, results.map((r) => r.id));
  return [...stored.values()].map(exerciseFromRows);
}

export function exerciseMarkdown(source: ExerciseSource): string {
  return serializeExercise(source);
}

/** The editor sends either the form (an ExerciseSource) or Markdown from its Markdown tab. */
export type ExerciseInput = { source: unknown } | { markdown: string };

function check(input: ExerciseInput): ExerciseCheck {
  if ("markdown" in input && typeof input.markdown === "string") return checkExerciseMarkdown(input.markdown.slice(0, 200_000));
  return checkExercise({ ...readExerciseInput((input as { source: unknown }).source), updated: today() });
}

interface Prepared {
  ex: ExerciseSource;
  topicId: string | null;
  lessonId: string | null;
}

/** Topic and lecture slugs to ids in this course (a lecture's topic is used when no topic is given). */
async function resolvePlaces(course: AdminCourse, ex: ExerciseSource): Promise<Prepared | string> {
  const { db } = getBindings();
  const topic = ex.topic ? await db.prepare("SELECT id FROM topics WHERE course_id = ? AND slug = ?").bind(course.id, ex.topic).first<{ id: string }>() : null;
  if (ex.topic && !topic) return `There is no topic "${ex.topic}" in this course.`;
  const lesson = ex.lesson
    ? await db.prepare("SELECT id, topic_id AS topicId FROM lessons WHERE course_id = ? AND slug = ?").bind(course.id, ex.lesson).first<{ id: string; topicId: string }>()
    : null;
  if (ex.lesson && !lesson) return `There is no lecture "${ex.lesson}" in this course.`;
  return { ex, topicId: topic?.id ?? lesson?.topicId ?? null, lessonId: lesson?.id ?? null };
}

/** Rules that span questions and quizzes: quizzes can only score what they can score, and practice exams must still draw. */
async function crossChecks(course: AdminCourse, id: string, ex: ExerciseSource, topicId: string | null): Promise<string | null> {
  const { db } = getBindings();
  const { results: inQuizzes } = await db
    .prepare(
      `SELECT DISTINCT z.slug, z.title, z.status FROM quiz_questions q JOIN quizzes z ON z.course_id = q.course_id AND z.id = q.quiz_id
        WHERE q.course_id = ? AND q.exercise_id = ?`,
    )
    .bind(course.id, id)
    .all<{ slug: string; title: string; status: string }>();
  if (inQuizzes.length > 0 && ex.type === "write_code") {
    return `"${inQuizzes[0]!.title}" uses this question, and quizzes can't score write-code questions yet. Remove it from the quiz first.`;
  }
  const livePublished = inQuizzes.find((z) => z.status === "published" || z.status === "scheduled");
  if (livePublished && ex.status !== "published") {
    return `"${livePublished.title}" is published and uses this question, so it has to stay published. Remove it from the quiz first.`;
  }
  if (ex.settings.reserved) {
    const families = new Set(inQuizzes.map((z) => z.slug.replace(/-model-[b-z]$/, "")));
    if (families.size > 1) return "A reserved question belongs to one quiz (and its models). It is used by more than one.";
  }
  const bank = await loadBankQuestions(course.id);
  const changed: BankQuestion = { id, type: ex.type, difficulty: ex.difficulty, topicId, status: ex.status, reserved: ex.settings.reserved === true };
  const next = [...bank.filter((q) => q.id !== id), changed];
  const broken = await examsBrokenBy(course.id, next);
  const before = await examsBrokenBy(course.id, bank);
  const newlyBroken = broken.filter((t) => !before.includes(t));
  if (newlyBroken.length > 0) {
    return `The practice exam "${newlyBroken[0]}" would no longer have enough questions to draw from. Change its rules first.`;
  }
  return null;
}

function writeStatements(course: AdminCourse, id: string, prepared: Prepared, now: number, existing: boolean): D1PreparedStatement[] {
  const { db } = getBindings();
  const { ex } = prepared;
  const rows = exerciseRows(ex, {
    id,
    courseId: course.id,
    topicId: prepared.topicId,
    lessonId: prepared.lessonId,
    updatedAt: now,
    childId: (table, i) => stableId(table, course.id, ex.slug, String(i)),
  });
  const statements: D1PreparedStatement[] = [];
  if (existing) {
    const { id: _id, course_id: _course, ...rest } = rows.exercise;
    void _id;
    void _course;
    const cols = Object.keys(rest);
    statements.push(
      db
        .prepare(`UPDATE exercises SET ${cols.map((c) => `${c} = ?`).join(", ")} WHERE course_id = ? AND id = ?`)
        .bind(...cols.map((c) => normalize(rest[c])), course.id, id),
    );
  } else {
    statements.push(insertStatement("exercises", { ...rows.exercise, created_at: now }));
  }
  for (const table of CHILD_TABLES) statements.push(db.prepare(`DELETE FROM ${table} WHERE course_id = ? AND exercise_id = ?`).bind(course.id, id));
  for (const { table, row } of rows.children) statements.push(insertStatement(table, row));
  const body = exerciseSearchBody(ex);
  statements.push(
    ...searchStatements({
      courseId: course.id,
      entityType: "exercise",
      entityId: id,
      row: body === null ? null : { url: `/courses/${course.slug}/exercises/${ex.slug}`, title: ex.title, body },
    }),
  );
  return statements;
}

function normalize(value: unknown): string | number | null {
  if (typeof value === "boolean") return value ? 1 : 0;
  return (value as string | number | null) ?? null;
}

/**
 * Creates or saves a question. Child rows keep ids derived from the question id
 * and position, so an answer a student sent mid-quiz still points at the same option.
 */
export async function saveExercise(actor: Actor, course: AdminCourse, id: string | null, input: ExerciseInput): Promise<AdminResult<{ id: string; slug: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const existing = id
    ? await db
        .prepare("SELECT id, slug, title, status, type FROM exercises WHERE course_id = ? AND id = ?")
        .bind(course.id, id)
        .first<{ id: string; slug: string; title: string; status: "draft" | "published" | "archived"; type: string }>()
    : null;
  if (id && !existing) return fail("This question doesn't exist in this course any more.");
  const checked = check(input);
  if (!checked.ok) return fail(checked.error);
  const ex = { ...checked.exercise, updated: today() };
  // Only course admins and administrators change what students see.
  if (denied(actor, "publish", course)) ex.status = existing?.status === "published" ? "published" : "draft";
  const placed = await resolvePlaces(course, ex);
  if (typeof placed === "string") return fail(placed);
  const exerciseId = existing?.id ?? newId("exe");
  const problem = await crossChecks(course, exerciseId, ex, placed.topicId);
  if (problem) return fail(problem);

  const now = Date.now();
  const statements = writeStatements(course, exerciseId, placed, now, existing !== null);
  if (!existing) statements.push(db.prepare("UPDATE exercises SET created_by = ?, updated_by = ? WHERE course_id = ? AND id = ?").bind(actor.staff.id, actor.staff.id, course.id, exerciseId));
  else statements.push(db.prepare("UPDATE exercises SET updated_by = ? WHERE course_id = ? AND id = ?").bind(actor.staff.id, course.id, exerciseId));
  statements.push(
    revisionStatement({ courseId: course.id, entityType: "exercise", entityId: exerciseId, snapshot: ex, authorId: actor.staff.id, now }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: !existing ? "exercise.create" : existing.status !== ex.status ? (ex.status === "published" ? "exercise.publish" : "exercise.unpublish") : "exercise.update",
        entityType: "exercise",
        entityId: exerciseId,
        before: existing ? { title: existing.title, slug: existing.slug, status: existing.status } : undefined,
        after: { title: ex.title, slug: ex.slug, status: ex.status, type: ex.type },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) return fail("Another question in this course already uses this slug.", { slug: "Another question in this course already uses this slug." });
    throw error;
  }
  return done({ id: exerciseId, slug: ex.slug }, existing ? "Question saved." : "Question created.");
}

export async function setExerciseStatus(actor: Actor, course: AdminCourse, id: string, status: "draft" | "published"): Promise<AdminResult> {
  if (denied(actor, "publish", course)) return fail(NO_PERMISSION);
  const current = await getExerciseForEdit(course, id);
  if (!current) return fail("This question doesn't exist in this course any more.");
  const result = await saveExercise(actor, course, id, { source: { ...current.source, status } });
  return result.ok ? done(undefined, status === "published" ? "Question published." : "Question moved to drafts.") : result;
}

/** A copy as a new draft, with a free slug like loop-sum-copy or loop-sum-copy-2. */
export async function duplicateExercise(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult<{ id: string; slug: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const current = await getExerciseForEdit(course, id);
  if (!current) return fail("This question doesn't exist in this course any more.");
  const { results } = await getBindings()
    .db.prepare("SELECT slug FROM exercises WHERE course_id = ? AND slug LIKE ?")
    .bind(course.id, `${current.source.slug}-copy%`)
    .all<{ slug: string }>();
  const taken = new Set(results.map((r) => r.slug));
  let slug = `${current.source.slug}-copy`.slice(0, 90);
  for (let n = 2; taken.has(slug); n++) slug = `${current.source.slug}-copy-${n}`.slice(0, 90);
  const copy = { ...current.source, slug, title: `${current.source.title} (copy)`.slice(0, 200), status: "draft" as const };
  return saveExercise(actor, course, null, { source: copy });
}

export async function deleteExercise(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const current = await getExerciseForEdit(course, id);
  if (!current) return fail("This question doesn't exist in this course any more.");
  if (current.quizzes.length > 0) {
    return fail(`"${current.quizzes[0]!.title}" uses this question. Remove it from ${current.quizzes.length === 1 ? "that quiz" : `those ${current.quizzes.length} quizzes`} first.`);
  }
  const bank = await loadBankQuestions(course.id);
  const broken = await examsBrokenBy(course.id, bank.filter((q) => q.id !== id));
  const brokenBefore = await examsBrokenBy(course.id, bank);
  const newly = broken.filter((t) => !brokenBefore.includes(t));
  if (newly.length > 0) return fail(`The practice exam "${newly[0]}" would no longer have enough questions to draw from.`);
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM exercises WHERE course_id = ? AND id = ?").bind(course.id, id),
    ...searchStatements({ courseId: course.id, entityType: "exercise", entityId: id, row: null }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action: "exercise.delete",
        entityType: "exercise",
        entityId: id,
        before: { title: current.source.title, slug: current.source.slug },
        after: { title: current.source.title },
        ip: actor.ip,
      },
      now,
    ),
  ]);
  return done(undefined, "Question deleted.");
}

export interface ImportReport {
  created: string[];
  updated: string[];
  failed: { name: string; error: string }[];
}

/** One JSON item or Markdown file per question. A question whose slug already exists in the course is updated, others are created. */
export async function importExercises(actor: Actor, course: AdminCourse, items: { name: string; input: ExerciseInput }[]): Promise<AdminResult<ImportReport>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  if (items.length === 0) return fail("Nothing to import: the file has no questions.");
  if (items.length > 300) return fail("Import at most 300 questions at a time.");
  const report: ImportReport = { created: [], updated: [], failed: [] };
  for (const item of items) {
    const checked = check(item.input);
    if (!checked.ok) {
      report.failed.push({ name: item.name, error: checked.error });
      continue;
    }
    const found = await getBindings()
      .db.prepare("SELECT id FROM exercises WHERE course_id = ? AND slug = ?")
      .bind(course.id, checked.exercise.slug)
      .first<{ id: string }>();
    const result = await saveExercise(actor, course, found?.id ?? null, { markdown: checked.markdown });
    if (!result.ok) report.failed.push({ name: item.name, error: result.error });
    else (found ? report.updated : report.created).push(checked.exercise.slug);
  }
  const message = `${report.created.length} created, ${report.updated.length} updated${report.failed.length ? `, ${report.failed.length} not imported` : ""}.`;
  return done(report, message);
}

/** Puts an earlier version back (as a new save); the question keeps its current status. */
export async function restoreExerciseRevision(actor: Actor, course: AdminCourse, id: string, revisionNo: number): Promise<AdminResult<{ id: string; slug: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const current = await getExerciseForEdit(course, id);
  if (!current) return fail("This question doesn't exist in this course any more.");
  const snapshot = (await getRevisionSnapshot(course.id, "exercise", id, revisionNo)) as ExerciseSource | null;
  if (!snapshot || typeof snapshot !== "object") return fail("That version isn't available.");
  const result = await saveExercise(actor, course, id, { source: { ...snapshot, status: current.source.status } });
  return result.ok ? done(result.value, `Version ${revisionNo} restored. It is saved as the newest version.`) : result;
}
