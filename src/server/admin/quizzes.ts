// Quizzes in the admin: settings, chosen questions and models (other versions
// of one quiz, slugs <quiz>-model-b, -model-c…). A model takes its timer,
// marks, attempts, topic and status from its quiz; only its title and
// questions are its own, so saving a quiz updates its models' settings too.
import { isValidSlug } from "@/lib/slug";
import { newId } from "@/lib/ids";
import { markdownToPlainText } from "@/lib/lesson/source";
import { getBindings } from "@/server/platform/env";
import { auditStatement, revisionStatement } from "./audit";
import { type Actor, type AdminResult, NO_PERMISSION, denied, done, fail, isUniqueError, str } from "./context";
import type { AdminCourse } from "./courses";
import { searchStatements } from "./search-index";

export type QuizStatus = "draft" | "scheduled" | "published" | "archived";
const MODEL_SLUG = /^(.+)-model-([b-z])$/;
export const QUIZ_LIMITS = { questions: 120, titleMax: 160, descriptionMax: 4000, minutesMax: 600 } as const;

export interface AdminQuizRow {
  id: string;
  slug: string;
  title: string;
  mode: "practice" | "exam";
  status: QuizStatus;
  publishAt: number | null;
  timeLimitSec: number | null;
  maxAttempts: number | null;
  topicTitle: string | null;
  questions: number;
  updatedAt: number;
  /** Set on a model: the slug of its quiz. */
  modelOf: string | null;
  models: AdminQuizRow[];
}

export async function listAdminQuizzes(course: AdminCourse): Promise<AdminQuizRow[]> {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT z.id, z.slug, z.title, z.mode, z.status, z.publish_at AS publishAt, z.time_limit_sec AS timeLimitSec, z.max_attempts AS maxAttempts,
              t.title AS topicTitle, z.updated_at AS updatedAt,
              (SELECT count(*) FROM quiz_questions q WHERE q.course_id = z.course_id AND q.quiz_id = z.id) AS questions
         FROM quizzes z LEFT JOIN topics t ON t.course_id = z.course_id AND t.id = z.topic_id
        WHERE z.course_id = ?
        ORDER BY coalesce(t.sort_order, -1), z.created_at, z.slug`,
    )
    .bind(course.id)
    .all<Omit<AdminQuizRow, "modelOf" | "models">>();
  const slugs = new Set(results.map((r) => r.slug));
  const rows = results.map((r) => {
    const parent = MODEL_SLUG.exec(r.slug)?.[1];
    return { ...r, modelOf: parent && slugs.has(parent) ? parent : null, models: [] as AdminQuizRow[] };
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  for (const r of rows) if (r.modelOf) bySlug.get(r.modelOf)?.models.push(r);
  return rows.filter((r) => !r.modelOf);
}

export interface QuizDraft {
  title: string;
  slug: string;
  descriptionMd: string;
  topicId: string | null;
  mode: "practice" | "exam";
  /** Minutes, or null for no timer. */
  minutes: number | null;
  passThreshold: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Attempts in any 24 hours, or null for unlimited. */
  maxAttempts: number | null;
  status: QuizStatus;
  publishAt: number | null;
  questions: { exerciseId: string; points: number }[];
}

export interface QuizForEdit {
  id: string;
  draft: QuizDraft;
  modelOf: { id: string; slug: string; title: string } | null;
  models: { id: string; slug: string; title: string; letter: string }[];
}

export async function getQuizForEdit(course: AdminCourse, id: string): Promise<QuizForEdit | null> {
  const { db } = getBindings();
  const quiz = await db
    .prepare(
      `SELECT id, slug, title, description_md AS descriptionMd, topic_id AS topicId, mode, time_limit_sec AS timeLimitSec, pass_threshold AS passThreshold,
              shuffle_questions AS shuffleQuestions, shuffle_options AS shuffleOptions, max_attempts AS maxAttempts, status, publish_at AS publishAt
         FROM quizzes WHERE course_id = ? AND id = ?`,
    )
    .bind(course.id, id)
    .first<{
      id: string;
      slug: string;
      title: string;
      descriptionMd: string;
      topicId: string | null;
      mode: "practice" | "exam";
      timeLimitSec: number | null;
      passThreshold: number;
      shuffleQuestions: number;
      shuffleOptions: number;
      maxAttempts: number | null;
      status: QuizStatus;
      publishAt: number | null;
    }>();
  if (!quiz) return null;
  const parentSlug = MODEL_SLUG.exec(quiz.slug)?.[1];
  const [questions, parent, models] = await db.batch<Record<string, unknown>>([
    db.prepare("SELECT exercise_id AS exerciseId, points FROM quiz_questions WHERE course_id = ? AND quiz_id = ? ORDER BY sort_order").bind(course.id, id),
    db.prepare("SELECT id, slug, title FROM quizzes WHERE course_id = ? AND slug = ?").bind(course.id, parentSlug ?? "\u0000"),
    db.prepare("SELECT id, slug, title FROM quizzes WHERE course_id = ? AND slug LIKE ? ORDER BY slug").bind(course.id, `${quiz.slug}-model-_`),
  ]);
  const parentRow = parent?.results[0] as { id: string; slug: string; title: string } | undefined;
  return {
    id,
    modelOf: parentRow ?? null,
    models: parentRow
      ? []
      : ((models?.results ?? []) as { id: string; slug: string; title: string }[])
          .filter((m) => MODEL_SLUG.exec(m.slug)?.[1] === quiz.slug)
          .map((m) => ({ ...m, letter: m.slug.slice(-1).toUpperCase() })),
    draft: {
      title: quiz.title,
      slug: quiz.slug,
      descriptionMd: quiz.descriptionMd,
      topicId: quiz.topicId,
      mode: quiz.mode,
      minutes: quiz.timeLimitSec === null ? null : Math.round(quiz.timeLimitSec / 60),
      passThreshold: quiz.passThreshold,
      shuffleQuestions: quiz.shuffleQuestions === 1,
      shuffleOptions: quiz.shuffleOptions === 1,
      maxAttempts: quiz.maxAttempts,
      status: quiz.status,
      publishAt: quiz.publishAt,
      questions: ((questions?.results ?? []) as { exerciseId: string; points: number }[]).map((q) => ({ exerciseId: q.exerciseId, points: q.points })),
    },
  };
}

function wholeOrNull(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : Number.NaN;
}

export function readQuizDraft(raw: unknown): QuizDraft {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const pass = Number(r.passThreshold);
  return {
    title: str(r.title, 400),
    slug: str(r.slug, 120).toLowerCase(),
    descriptionMd: str(r.descriptionMd, 10_000),
    topicId: typeof r.topicId === "string" && r.topicId ? r.topicId : null,
    mode: r.mode === "exam" ? "exam" : "practice",
    minutes: wholeOrNull(r.minutes),
    passThreshold: Number.isInteger(pass) ? pass : Number.NaN,
    shuffleQuestions: r.shuffleQuestions === true,
    shuffleOptions: r.shuffleOptions === true,
    maxAttempts: wholeOrNull(r.maxAttempts),
    status: (["draft", "scheduled", "published", "archived"] as const).includes(r.status as QuizStatus) ? (r.status as QuizStatus) : "draft",
    publishAt: typeof r.publishAt === "number" && Number.isFinite(r.publishAt) ? Math.floor(r.publishAt) : null,
    questions: (Array.isArray(r.questions) ? r.questions : []).slice(0, 500).map((q) => {
      const x = (q && typeof q === "object" ? q : {}) as Record<string, unknown>;
      const points = Number(x.points);
      return { exerciseId: typeof x.exerciseId === "string" ? x.exerciseId : "", points: Number.isInteger(points) ? points : Number.NaN };
    }),
  };
}

interface QuestionInfo {
  id: string;
  slug: string;
  title: string;
  type: string;
  status: string;
  reserved: number;
}

/** Field problems and rules that need the database: questions in this course, scorable, published when the quiz is, reserved for one quiz. */
async function validate(course: AdminCourse, quizId: string, family: string, d: QuizDraft, isModel: boolean): Promise<Record<string, string>> {
  const errors: Record<string, string> = {};
  if (d.title.length < 2 || d.title.length > QUIZ_LIMITS.titleMax) errors.title = `Give the quiz a title (2 to ${QUIZ_LIMITS.titleMax} characters).`;
  if (!isValidSlug(d.slug)) errors.slug = "Use lower-case words joined by hyphens, like loops-quiz.";
  else if (!isModel && MODEL_SLUG.test(d.slug)) errors.slug = "Slugs ending in -model-<letter> are kept for a quiz's models.";
  if (d.descriptionMd.length > QUIZ_LIMITS.descriptionMax) errors.descriptionMd = `Keep the description under ${QUIZ_LIMITS.descriptionMax} characters.`;
  if (!isModel) {
    if (d.minutes !== null && (!Number.isInteger(d.minutes) || d.minutes < 1 || d.minutes > QUIZ_LIMITS.minutesMax)) errors.minutes = `Use 1 to ${QUIZ_LIMITS.minutesMax} minutes, or leave it empty for no timer.`;
    if (!Number.isInteger(d.passThreshold) || d.passThreshold < 0 || d.passThreshold > 100) errors.passThreshold = "Use a pass mark from 0 to 100 percent.";
    if (d.maxAttempts !== null && (!Number.isInteger(d.maxAttempts) || d.maxAttempts < 1 || d.maxAttempts > 50)) errors.maxAttempts = "Use 1 to 50 attempts, or leave it empty for unlimited.";
    if (d.status === "scheduled" && (d.publishAt === null || d.publishAt <= Date.now())) errors.publishAt = "Pick a date and time in the future.";
  }
  if (d.questions.length > QUIZ_LIMITS.questions) errors.questions = `A quiz holds at most ${QUIZ_LIMITS.questions} questions.`;
  if (d.questions.some((q) => !Number.isInteger(q.points) || q.points < 1 || q.points > 100)) errors.questions = "Each question is worth 1 to 100 points.";
  const ids = d.questions.map((q) => q.exerciseId);
  if (new Set(ids).size !== ids.length) errors.questions = "A question is in the list twice.";
  if (errors.questions) return errors;
  const live = d.status === "published" || d.status === "scheduled";
  if (live && ids.length === 0) errors.questions = "Add at least one question before publishing.";

  const { db } = getBindings();
  const found = new Map<string, QuestionInfo>();
  for (let i = 0; i < ids.length; i += 80) {
    const chunk = ids.slice(i, i + 80);
    const { results } = await db
      .prepare(
        `SELECT id, slug, title, type, status, coalesce(json_extract(settings, '$.reserved'), 0) AS reserved
           FROM exercises WHERE course_id = ? AND id IN (${chunk.map(() => "?").join(", ")})`,
      )
      .bind(course.id, ...chunk)
      .all<QuestionInfo>();
    for (const r of results) found.set(r.id, r);
  }
  for (const id of ids) {
    const q = found.get(id);
    if (!q) {
      errors.questions = "One of the questions isn't in this course any more. Reload the page.";
      break;
    }
    if (q.type === "write_code") {
      errors.questions = `"${q.title}" is a write-code question, which quizzes can't score yet.`;
      break;
    }
    if (live && q.status !== "published") {
      errors.questions = `"${q.title}" is a draft. Publish it, or remove it, before publishing the quiz.`;
      break;
    }
  }
  if (!errors.questions) {
    const reserved = ids.filter((id) => found.get(id)?.reserved === 1);
    if (reserved.length) {
      // A reserved question belongs to one quiz and its models.
      const { results } = await db
        .prepare(
          `SELECT DISTINCT z.slug, z.title, q.exercise_id AS exerciseId FROM quiz_questions q JOIN quizzes z ON z.course_id = q.course_id AND z.id = q.quiz_id
            WHERE q.course_id = ? AND z.id <> ? AND q.exercise_id IN (${reserved.map(() => "?").join(", ")})`,
        )
        .bind(course.id, quizId, ...reserved)
        .all<{ slug: string; title: string; exerciseId: string }>();
      const other = results.find((r) => r.slug.replace(/-model-[b-z]$/, "") !== family);
      if (other) errors.questions = `"${found.get(other.exerciseId)?.title}" is reserved for the quiz "${other.title}".`;
    }
  }
  return errors;
}

function quizSearch(course: AdminCourse, id: string, d: QuizDraft, isModel: boolean) {
  const live = d.status === "published" || d.status === "scheduled";
  return searchStatements({
    courseId: course.id,
    entityType: "quiz",
    entityId: id,
    row: live && !isModel ? { url: `/courses/${course.slug}/quizzes/${d.slug}`, title: d.title, body: markdownToPlainText(d.descriptionMd) } : null,
  });
}

/** Creates or saves a quiz (or a model: then only its title and questions count). */
export async function saveQuiz(actor: Actor, course: AdminCourse, id: string | null, raw: unknown): Promise<AdminResult<{ id: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const { db } = getBindings();
  const current = id ? await getQuizForEdit(course, id) : null;
  if (id && !current) return fail("This quiz doesn't exist in this course any more.");
  const d = readQuizDraft(raw);
  const parent = current?.modelOf ? await getQuizForEdit(course, current.modelOf.id) : null;
  const isModel = parent !== null;
  if (parent && current) {
    // A model's settings and slug follow its quiz.
    Object.assign(d, { ...parent.draft, title: d.title, questions: d.questions, slug: current.draft.slug, descriptionMd: "" });
  }
  if (denied(actor, "publish", course)) {
    d.status = current?.draft.status ?? "draft";
    d.publishAt = current?.draft.publishAt ?? null;
  }
  if (d.status !== "scheduled") d.publishAt = null;
  if (d.topicId) {
    const topic = await db.prepare("SELECT id FROM topics WHERE course_id = ? AND id = ?").bind(course.id, d.topicId).first();
    if (!topic) return fail("Check the highlighted fields.", { topicId: "Choose a topic of this course." });
  }
  const quizId = current?.id ?? newId("quiz");
  // The family as stored now (a rename moves the models in the same batch).
  const family = parent?.draft.slug ?? current?.draft.slug ?? d.slug;
  const errors = await validate(course, quizId, family, d, isModel);
  if (Object.keys(errors).length) return fail(Object.keys(errors).length === 1 ? Object.values(errors)[0]! : "Check the highlighted fields.", errors);
  if ((d.status === "published" || d.status === "scheduled") && current?.models.length) {
    // Models go live with their quiz, so their questions must be ready too.
    const draftInModel = await db
      .prepare(
        `SELECT z.title FROM quiz_questions q JOIN quizzes z ON z.course_id = q.course_id AND z.id = q.quiz_id
           JOIN exercises e ON e.course_id = q.course_id AND e.id = q.exercise_id
          WHERE q.course_id = ? AND q.quiz_id IN (${current.models.map(() => "?").join(", ")}) AND e.status <> 'published' LIMIT 1`,
      )
      .bind(course.id, ...current.models.map((m) => m.id))
      .first<{ title: string }>();
    if (draftInModel) return fail(`"${draftInModel.title}" has a draft question. Publish it or remove it before publishing the quiz.`);
  }

  const now = Date.now();
  const settings = {
    topic_id: d.topicId,
    mode: d.mode,
    feedback: d.mode === "exam" ? "after_submit" : "immediate",
    time_limit_sec: d.minutes === null ? null : d.minutes * 60,
    pass_threshold: d.passThreshold,
    shuffle_questions: d.shuffleQuestions ? 1 : 0,
    shuffle_options: d.shuffleOptions ? 1 : 0,
    max_attempts: d.maxAttempts,
    status: d.status,
    publish_at: d.publishAt,
  };
  const cols = Object.keys(settings) as (keyof typeof settings)[];
  const statements: D1PreparedStatement[] = [];
  if (current) {
    statements.push(
      db
        .prepare(`UPDATE quizzes SET slug = ?, title = ?, description_md = ?, ${cols.map((c) => `${c} = ?`).join(", ")}, updated_by = ?, updated_at = ? WHERE course_id = ? AND id = ?`)
        .bind(d.slug, d.title, d.descriptionMd, ...cols.map((c) => settings[c]), actor.staff.id, now, course.id, quizId),
    );
  } else {
    statements.push(
      db
        .prepare(
          `INSERT INTO quizzes (id, course_id, slug, title, description_md, ${cols.join(", ")}, created_by, updated_by, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ${cols.map(() => "?").join(", ")}, ?, ?, ?, ?)`,
        )
        .bind(quizId, course.id, d.slug, d.title, d.descriptionMd, ...cols.map((c) => settings[c]), actor.staff.id, actor.staff.id, now, now),
    );
  }
  statements.push(db.prepare("DELETE FROM quiz_questions WHERE course_id = ? AND quiz_id = ?").bind(course.id, quizId));
  d.questions.forEach((q, i) =>
    statements.push(
      db.prepare("INSERT INTO quiz_questions (course_id, quiz_id, exercise_id, sort_order, points) VALUES (?, ?, ?, ?, ?)").bind(course.id, quizId, q.exerciseId, i + 1, q.points),
    ),
  );
  statements.push(...quizSearch(course, quizId, d, isModel));
  // The quiz's models follow its settings, and its slug when it is renamed.
  for (const m of current?.models ?? []) {
    statements.push(
      db
        .prepare(`UPDATE quizzes SET slug = ?, ${cols.map((c) => `${c} = ?`).join(", ")}, updated_at = ? WHERE course_id = ? AND id = ?`)
        .bind(`${d.slug}-model-${m.letter.toLowerCase()}`, ...cols.map((c) => settings[c]), now, course.id, m.id),
    );
  }
  const action = !current ? "quiz.create" : current.draft.status !== d.status ? `quiz.${d.status === "published" ? "publish" : d.status === "scheduled" ? "schedule" : d.status === "archived" ? "archive" : "unpublish"}` : "quiz.update";
  statements.push(
    revisionStatement({ courseId: course.id, entityType: "quiz", entityId: quizId, snapshot: d, authorId: actor.staff.id, now }),
    auditStatement(
      {
        actorId: actor.staff.id,
        courseId: course.id,
        action,
        entityType: "quiz",
        entityId: quizId,
        before: current ? { title: current.draft.title, slug: current.draft.slug, status: current.draft.status } : undefined,
        after: { title: d.title, slug: d.slug, status: d.status, questions: d.questions.length },
        ip: actor.ip,
      },
      now,
    ),
  );
  try {
    await db.batch(statements);
  } catch (error) {
    if (isUniqueError(error)) return fail("Check the highlighted fields.", { slug: "Another quiz in this course already uses this slug." });
    throw error;
  }
  return done({ id: quizId }, current ? "Quiz saved." : "Quiz created.");
}

/** A new model of a quiz: the next free letter, starting with the quiz's own questions to edit. */
export async function addQuizModel(actor: Actor, course: AdminCourse, quizId: string): Promise<AdminResult<{ id: string }>> {
  if (denied(actor, "edit", course)) return fail(NO_PERMISSION);
  const quiz = await getQuizForEdit(course, quizId);
  if (!quiz) return fail("This quiz doesn't exist in this course any more.");
  if (quiz.modelOf) return fail("Add models to the quiz itself, not to one of its models.");
  const used = new Set(quiz.models.map((m) => m.letter.toLowerCase()));
  const letter = "bcdefghijklmnopqrstuvwxyz".split("").find((l) => !used.has(l));
  if (!letter) return fail("This quiz already has every model it can have.");
  const { db } = getBindings();
  const id = newId("quiz");
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO quizzes (id, course_id, topic_id, slug, title, description_md, mode, feedback, time_limit_sec, pass_threshold, shuffle_questions,
                              shuffle_options, max_attempts, status, publish_at, is_demo, created_by, updated_by, created_at, updated_at)
         SELECT ?, course_id, topic_id, ?, ?, '', mode, feedback, time_limit_sec, pass_threshold, shuffle_questions, shuffle_options, max_attempts,
                status, publish_at, is_demo, ?, ?, ?, ? FROM quizzes WHERE course_id = ? AND id = ?`,
      )
      .bind(id, `${quiz.draft.slug}-model-${letter}`, `${quiz.draft.title} (model ${letter.toUpperCase()})`.slice(0, 160), actor.staff.id, actor.staff.id, now, now, course.id, quizId),
    db
      .prepare("INSERT INTO quiz_questions (course_id, quiz_id, exercise_id, sort_order, points) SELECT course_id, ?, exercise_id, sort_order, points FROM quiz_questions WHERE course_id = ? AND quiz_id = ?")
      .bind(id, course.id, quizId),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "quiz.add_model", entityType: "quiz", entityId: id, after: { title: quiz.draft.title, model: letter.toUpperCase() }, ip: actor.ip }, now),
  ]);
  return done({ id }, `Model ${letter.toUpperCase()} added with the quiz's questions. Change them to make it a different version.`);
}

export async function deleteQuiz(actor: Actor, course: AdminCourse, id: string): Promise<AdminResult> {
  if (denied(actor, "delete", course)) return fail(NO_PERMISSION);
  const quiz = await getQuizForEdit(course, id);
  if (!quiz) return fail("This quiz doesn't exist in this course any more.");
  const { db } = getBindings();
  const now = Date.now();
  // Deleting a quiz deletes its models too; attempts go with them (ON DELETE CASCADE).
  const ids = [id, ...quiz.models.map((m) => m.id)];
  await db.batch([
    ...ids.map((qid) => db.prepare("DELETE FROM quizzes WHERE course_id = ? AND id = ?").bind(course.id, qid)),
    ...ids.flatMap((qid) => searchStatements({ courseId: course.id, entityType: "quiz", entityId: qid, row: null })),
    auditStatement({ actorId: actor.staff.id, courseId: course.id, action: "quiz.delete", entityType: "quiz", entityId: id, before: { title: quiz.draft.title, slug: quiz.draft.slug, models: quiz.models.length }, after: { title: quiz.draft.title }, ip: actor.ip }, now),
  ]);
  return done(undefined, quiz.models.length ? `Quiz and its ${quiz.models.length} model${quiz.models.length === 1 ? "" : "s"} deleted.` : "Quiz deleted.");
}

/** For the question picker: every question of the course that a quiz can score. */
export async function listQuizCandidates(course: AdminCourse) {
  const { results } = await getBindings()
    .db.prepare(
      `SELECT e.id, e.slug, e.title, e.type, json_extract(e.settings, '$.ask') AS ask, e.difficulty, e.status, e.topic_id AS topicId, t.title AS topicTitle,
              coalesce(json_extract(e.settings, '$.reserved'), 0) AS reserved
         FROM exercises e LEFT JOIN topics t ON t.course_id = e.course_id AND t.id = e.topic_id
        WHERE e.course_id = ? AND e.type <> 'write_code'
        ORDER BY coalesce(t.sort_order, 1e9), e.title`,
    )
    .bind(course.id)
    .all<{ id: string; slug: string; title: string; type: string; ask: string | null; difficulty: string; status: string; topicId: string | null; topicTitle: string | null; reserved: number }>();
  return results.map((r) => ({ ...r, reserved: r.reserved === 1 }));
}
