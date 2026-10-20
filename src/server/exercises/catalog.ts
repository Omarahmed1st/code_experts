// Public question data for one course: the exercise library, single exercise
// pages, and the questions a quiz or exam hands to the browser.
//
// Nothing here reads an answer key: no exercise_options.is_correct, no
// exercise_answers, no hidden test cases, no explanation. Those are read only
// by src/server/grading/keys.ts after the student has answered.
import { cache } from "react";
import { and, asc, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { exerciseHints, exerciseOptions, exerciseTestCases, exercises, lessons, topics } from "@/db/schema";
import type { DIFFICULTY, EXERCISE_TYPE } from "@/db/enums";
import { type Ask, isAsk, orderParts, scramble } from "@/lib/exercise/ask";
import type { CompareMode } from "@/lib/grading/output";
import { buildStage, displayCode } from "@/lib/lesson/stage";
import { highlight } from "@/lib/markdown/highlight";
import { renderInlineMarkdown, renderMarkdown } from "@/lib/markdown/render";
import { isValidSlug } from "@/lib/slug";
import type { CourseScope } from "@/server/courses/scope";
import { lessonIsLive } from "@/server/content/lessons";

export type ExerciseType = (typeof EXERCISE_TYPE)[number];
export type Difficulty = (typeof DIFFICULTY)[number];

export const EXERCISE_TYPE_LABEL: Record<ExerciseType, string> = {
  mcq: "Multiple choice",
  trace: "Trace the code",
  correct_code: "Correct the code",
  write_code: "Write the code",
};

export interface ExerciseCard {
  id: string;
  slug: string;
  title: string;
  type: ExerciseType;
  difficulty: Difficulty;
  points: number;
  isDemo: boolean;
  topic: { slug: string; title: string } | null;
  /** A question format on top of the type (src/lib/exercise/ask.ts), or null. */
  ask: Ask | null;
}

export interface PublicOption {
  id: string;
  html: string;
}

export interface PublicTest {
  name: string;
  stdin: string;
  stdout: string;
}

/** Everything the browser needs to show and answer a question, and nothing that gives the answer away. */
export interface PublicExercise extends ExerciseCard {
  promptHtml: string;
  code: string | null;
  codeLanguage: string | null;
  /** The code as highlighted HTML lines, for the read-only code box. */
  codeLines: string[];
  expectedBehaviorHtml: string;
  hintsHtml: string[];
  options: PublicOption[];
  multiple: boolean;
  /** MCQ: the options may be shown in a random order (the author can turn this off). */
  shuffleOptions: boolean;
  /** Visible test cases only (hidden ones stay on the server for the Phase 9 runner). */
  tests: PublicTest[];
  compare: CompareMode;
  lesson: { slug: string; title: string } | null;
  updatedAt: number;
  /**
   * Put-in-order questions: the fixed lines around the block and the block's
   * lines in a random order (`code` is null, since it holds the answer).
   */
  order: { before: CodeLine[]; after: CodeLine[]; pieces: CodeLine[] } | null;
}

/** One line of code as text (to build the answer) and highlighted HTML (to show). */
export interface CodeLine {
  text: string;
  html: string;
}

export interface ExerciseFilters {
  type?: ExerciseType;
  difficulty?: Difficulty;
  topic?: string;
}

const cardColumns = {
  id: exercises.id,
  slug: exercises.slug,
  title: exercises.title,
  type: exercises.type,
  difficulty: exercises.difficulty,
  points: exercises.points,
  isDemo: exercises.isDemo,
  topicSlug: topics.slug,
  topicTitle: topics.title,
  settings: exercises.settings,
};

interface CardRow {
  id: string;
  slug: string;
  title: string;
  type: ExerciseType;
  difficulty: Difficulty;
  points: number;
  isDemo: boolean;
  topicSlug: string | null;
  topicTitle: string | null;
  settings: unknown;
}

function toCard(row: CardRow): ExerciseCard {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    type: row.type,
    difficulty: row.difficulty,
    points: row.points,
    isDemo: row.isDemo,
    topic: row.topicSlug && row.topicTitle ? { slug: row.topicSlug, title: row.topicTitle } : null,
    ask: askOf(row.settings),
  };
}

function askOf(settings: unknown): Ask | null {
  const ask = (settings as { ask?: unknown } | null)?.ask;
  return isAsk(ask) ? ask : null;
}

/** Reserved questions belong to one quiz (a final exam): never listed, practised or given a page of their own. */
export function notReserved() {
  return sql`coalesce(json_extract(${exercises.settings}, '$.reserved'), 0) = 0`;
}

const TYPE_ORDER = sql`CASE ${exercises.type} WHEN 'mcq' THEN 1 WHEN 'trace' THEN 2 WHEN 'correct_code' THEN 3 ELSE 4 END`;
const DIFFICULTY_ORDER = sql`CASE ${exercises.difficulty} WHEN 'easy' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`;

/** Published questions of one course, filtered, in course order (topic, then type, then difficulty). */
export async function listExercises(scope: CourseScope, filters: ExerciseFilters = {}): Promise<ExerciseCard[]> {
  const rows = await getDb()
    .select(cardColumns)
    .from(exercises)
    .leftJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
    .where(
      and(
        eq(exercises.courseId, scope.courseId),
        eq(exercises.status, "published"), notReserved(),
        filters.type ? eq(exercises.type, filters.type) : undefined,
        filters.difficulty ? eq(exercises.difficulty, filters.difficulty) : undefined,
        filters.topic ? eq(topics.slug, filters.topic) : undefined,
      ),
    )
    .orderBy(asc(sql`coalesce(${topics.sortOrder}, 9999)`), asc(TYPE_ORDER), asc(DIFFICULTY_ORDER), asc(exercises.title));
  return rows.map(toCard);
}

/** Published questions that practise one lecture. */
export async function listLessonExercises(scope: CourseScope, lessonId: string): Promise<ExerciseCard[]> {
  const rows = await getDb()
    .select(cardColumns)
    .from(exercises)
    .leftJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved(), eq(exercises.lessonId, lessonId)))
    .orderBy(asc(TYPE_ORDER), asc(DIFFICULTY_ORDER), asc(exercises.title));
  return rows.map(toCard);
}

/** Question counts per type, for the course's practice pages. */
export async function countExercisesByType(scope: CourseScope): Promise<Record<ExerciseType, number>> {
  const rows = await getDb()
    .select({ type: exercises.type, n: sql<number>`count(*)` })
    .from(exercises)
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved()))
    .groupBy(exercises.type);
  const counts: Record<ExerciseType, number> = { mcq: 0, trace: 0, correct_code: 0, write_code: 0 };
  for (const row of rows) counts[row.type] = Number(row.n);
  return counts;
}

/** Topics that have published questions, in course order (for the library's topic filter). */
export async function listExerciseTopics(scope: CourseScope): Promise<{ slug: string; title: string }[]> {
  return getDb()
    .selectDistinct({ slug: topics.slug, title: topics.title, sortOrder: topics.sortOrder })
    .from(exercises)
    .innerJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved()))
    .orderBy(asc(topics.sortOrder))
    .then((rows) => rows.map(({ slug, title }) => ({ slug, title })));
}

function codeLinesOf(code: string | null, language: string | null): string[] {
  if (!code) return [];
  return buildStage(displayCode(code), language ?? "text", null).map((line) => line.html);
}

function secureRandom(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]! / 2 ** 32;
}

function linesOf(lines: readonly string[], language: string | null): CodeLine[] {
  if (lines.length === 0) return [];
  const html = highlight(lines.join("\n"), language ?? "text").split("\n");
  return lines.map((text, i) => ({ text, html: html[i] ?? "" }));
}

function orderOf(code: string | null, language: string | null): PublicExercise["order"] {
  const parts = code ? orderParts(displayCode(code)) : null;
  if (!parts) return null;
  return {
    before: linesOf(parts.before, language),
    after: linesOf(parts.after, language),
    // Each piece is highlighted alone, since it can end up anywhere.
    pieces: scramble(parts.block, secureRandom).map((line) => linesOf([line], language)[0]!),
  };
}

/**
 * Full public data for published questions, by id, in the order given.
 * Ids from another course (or drafts) are simply not returned.
 */
export async function getPublicExercises(
  scope: CourseScope,
  ids: readonly string[],
  options: { withHints?: boolean; anyStatus?: boolean } = {},
): Promise<PublicExercise[]> {
  // D1 allows 100 bound values per query, so long lists are read in batches.
  const unique = [...new Set(ids)];
  const batches = await Promise.all(
    Array.from({ length: Math.ceil(unique.length / MAX_IDS_PER_QUERY) }, (_, i) =>
      publicExerciseBatch(scope, unique.slice(i * MAX_IDS_PER_QUERY, (i + 1) * MAX_IDS_PER_QUERY), options),
    ),
  );
  const byId = new Map(batches.flat().map((e) => [e.id, e]));
  return ids.map((id) => byId.get(id)).filter((e): e is PublicExercise => e !== undefined);
}

/** Ids per query: D1 binds at most 100 values, and a few go to the course and status. */
export const MAX_IDS_PER_QUERY = 80;

async function publicExerciseBatch(
  scope: CourseScope,
  ids: readonly string[],
  { withHints = true, anyStatus = false }: { withHints?: boolean; anyStatus?: boolean },
): Promise<PublicExercise[]> {
  if (ids.length === 0) return [];
  const db = getDb();
  const unique = [...new Set(ids)];
  const [rows, optionRows, hintRows, testRows] = await Promise.all([
    db
      .select({
        ...cardColumns,
        promptMd: exercises.promptMd,
        code: exercises.code,
        codeLanguage: exercises.codeLanguage,
        expectedBehaviorMd: exercises.expectedBehaviorMd,
        settings: exercises.settings,
        updatedAt: exercises.updatedAt,
        lessonSlug: lessons.slug,
        lessonTitle: lessons.title,
      })
      .from(exercises)
      .leftJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
      .leftJoin(lessons, and(eq(lessons.courseId, exercises.courseId), eq(lessons.id, exercises.lessonId), lessonIsLive()))
      .where(and(eq(exercises.courseId, scope.courseId), anyStatus ? undefined : eq(exercises.status, "published"), inArray(exercises.id, unique))),
    db
      .select({ id: exerciseOptions.id, exerciseId: exerciseOptions.exerciseId, labelMd: exerciseOptions.labelMd })
      .from(exerciseOptions)
      .where(and(eq(exerciseOptions.courseId, scope.courseId), inArray(exerciseOptions.exerciseId, unique)))
      .orderBy(asc(exerciseOptions.sortOrder)),
    withHints
      ? db
          .select({ exerciseId: exerciseHints.exerciseId, hintMd: exerciseHints.hintMd })
          .from(exerciseHints)
          .where(and(eq(exerciseHints.courseId, scope.courseId), inArray(exerciseHints.exerciseId, unique)))
          .orderBy(asc(exerciseHints.sortOrder))
      : Promise.resolve([]),
    db
      .select({
        exerciseId: exerciseTestCases.exerciseId,
        name: exerciseTestCases.name,
        stdin: exerciseTestCases.stdin,
        stdout: exerciseTestCases.expectedStdout,
      })
      .from(exerciseTestCases)
      .where(
        and(
          eq(exerciseTestCases.courseId, scope.courseId),
          inArray(exerciseTestCases.exerciseId, unique),
          eq(exerciseTestCases.isHidden, false),
        ),
      )
      .orderBy(asc(exerciseTestCases.sortOrder)),
  ]);

  const byId = new Map(
    rows.map((row) => {
      const settings = (row.settings ?? {}) as { multiple?: boolean; shuffle?: boolean; compare?: CompareMode };
      const card = toCard(row);
      const order = card.ask === "order" ? orderOf(row.code, row.codeLanguage) : null;
      const exercise: PublicExercise = {
        ...card,
        promptHtml: renderMarkdown(row.promptMd),
        // A put-in-order program is its own answer: only the scrambled pieces are sent.
        code: card.ask === "order" ? null : row.code,
        codeLanguage: row.codeLanguage,
        codeLines: card.ask === "order" ? [] : codeLinesOf(row.code, row.codeLanguage),
        expectedBehaviorHtml: row.expectedBehaviorMd ? renderMarkdown(row.expectedBehaviorMd) : "",
        hintsHtml: hintRows.filter((h) => h.exerciseId === row.id).map((h) => renderInlineMarkdown(h.hintMd)),
        options: optionRows.filter((o) => o.exerciseId === row.id).map((o) => ({ id: o.id, html: renderInlineMarkdown(o.labelMd) })),
        multiple: settings.multiple === true,
        shuffleOptions: settings.shuffle !== false,
        tests: testRows.filter((t) => t.exerciseId === row.id).map(({ name, stdin, stdout }) => ({ name, stdin, stdout })),
        compare: settings.compare ?? "trim_trailing",
        lesson: row.lessonSlug && row.lessonTitle ? { slug: row.lessonSlug, title: row.lessonTitle } : null,
        updatedAt: row.updatedAt,
        order,
      };
      return [row.id, exercise] as const;
    }),
  );
  return ids.map((id) => byId.get(id)).filter((e): e is PublicExercise => e !== undefined);
}

/** One published question by its slug, or null (the page turns that into a 404). */
export const getPublicExercise = cache(async (scope: CourseScope, slug: string): Promise<PublicExercise | null> => {
  if (!isValidSlug(slug)) return null;
  const rows = await getDb()
    .select({ id: exercises.id })
    .from(exercises)
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.slug, slug), eq(exercises.status, "published"), notReserved()))
    .limit(1);
  const id = rows[0]?.id;
  if (!id) return null;
  const [exercise] = await getPublicExercises(scope, [id]);
  return exercise ?? null;
});

/** Whether a published question has a written explanation (the page is indexable only then). */
export async function exerciseHasExplanation(scope: CourseScope, id: string): Promise<boolean> {
  const rows = await getDb()
    .select({ n: sql<number>`length(${exercises.explanationMd})` })
    .from(exercises)
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.id, id)))
    .limit(1);
  return Number(rows[0]?.n ?? 0) > 80;
}

/** Slugs and dates of the questions whose pages are indexed (published, not demos, with a real explanation). */
export async function listExerciseSitemap(scope: CourseScope) {
  return getDb()
    .select({ slug: exercises.slug, updatedAt: exercises.updatedAt })
    .from(exercises)
    .where(
      and(
        eq(exercises.courseId, scope.courseId),
        eq(exercises.status, "published"), notReserved(),
        eq(exercises.isDemo, false),
        sql`length(${exercises.explanationMd}) > 80`,
      ),
    )
    .orderBy(asc(exercises.slug));
}

/** Ids of published questions by slug (practice sets built from a list of slugs). */
export async function idsForSlugs(scope: CourseScope, slugs: readonly string[]): Promise<string[]> {
  const valid = [...new Set(slugs.filter(isValidSlug))].slice(0, 50);
  if (valid.length === 0) return [];
  const rows = await getDb()
    .select({ id: exercises.id, slug: exercises.slug })
    .from(exercises)
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved(), inArray(exercises.slug, valid)));
  const bySlug = new Map(rows.map((r) => [r.slug, r.id]));
  return valid.map((s) => bySlug.get(s)).filter((id): id is string => id !== undefined);
}
