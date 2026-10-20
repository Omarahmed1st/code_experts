// Quizzes and practice exam templates of one course (public data only).
import { cache } from "react";
import { and, asc, eq, inArray, lte, or, sql } from "drizzle-orm";
import { getDb } from "@/db/client";
import { examTemplateRules, examTemplates, exercises, quizQuestions, quizzes, topics } from "@/db/schema";
import { renderMarkdown } from "@/lib/markdown/render";
import { isValidSlug } from "@/lib/slug";
import type { CourseScope } from "@/server/courses/scope";
import { notReserved } from "@/server/exercises/catalog";

export interface QuizCard {
  id: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  mode: "practice" | "exam";
  feedback: "immediate" | "after_submit";
  timeLimitSec: number | null;
  passThreshold: number;
  /** Attempts allowed in any 24 hours, then the quiz locks (null: unlimited). */
  maxAttempts: number | null;
  questionCount: number;
  totalPoints: number;
  isDemo: boolean;
  topic: { slug: string; title: string } | null;
  /**
   * Versions of this quiz, when it has more than one: this quiz is model A and
   * the quizzes `<slug>-model-b`, `-c`, … are the others (never listed on
   * their own). Each attempt gets one of them at random. Empty otherwise.
   */
  models: QuizModel[];
}

export interface QuizModel {
  id: string;
  /** "A", "B", … */
  label: string;
  questionCount: number;
}

export interface QuizDetail extends QuizCard {
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Question types in this quiz, with counts (for the start screen). */
  types: Record<string, number>;
}

export interface ExamCard {
  id: string;
  slug: string;
  title: string;
  descriptionHtml: string;
  scope: "course" | "topic" | "mixed_topics";
  timeLimitSec: number;
  passThreshold: number;
  questionCount: number;
  totalPoints: number;
  shuffleQuestions: boolean;
  isDemo: boolean;
}

/** `<quiz>-model-<letter>`: another version of `<quiz>` (see QuizCard.models). */
const MODEL_SLUG = /^(.+)-model-([b-z])$/;

/** A quiz is public when published, or scheduled with a publish time that has passed. */
function quizIsLive() {
  return or(
    eq(quizzes.status, "published"),
    and(eq(quizzes.status, "scheduled"), lte(quizzes.publishAt, sql`(unixepoch() * 1000)`)),
  );
}

export const listQuizzes = cache(async (scope: CourseScope): Promise<QuizCard[]> => {
  const rows = await getDb()
    .select({
      id: quizzes.id,
      slug: quizzes.slug,
      title: quizzes.title,
      descriptionMd: quizzes.descriptionMd,
      mode: quizzes.mode,
      feedback: quizzes.feedback,
      timeLimitSec: quizzes.timeLimitSec,
      passThreshold: quizzes.passThreshold,
      maxAttempts: quizzes.maxAttempts,
      isDemo: quizzes.isDemo,
      topicSlug: topics.slug,
      topicTitle: topics.title,
      questionCount: sql<number>`count(${exercises.id})`,
      totalPoints: sql<number>`coalesce(sum(${quizQuestions.points}), 0)`,
    })
    .from(quizzes)
    .leftJoin(topics, and(eq(topics.courseId, quizzes.courseId), eq(topics.id, quizzes.topicId)))
    .leftJoin(quizQuestions, and(eq(quizQuestions.courseId, quizzes.courseId), eq(quizQuestions.quizId, quizzes.id)))
    .leftJoin(
      exercises,
      and(eq(exercises.courseId, quizQuestions.courseId), eq(exercises.id, quizQuestions.exerciseId), eq(exercises.status, "published")),
    )
    .where(and(eq(quizzes.courseId, scope.courseId), quizIsLive()))
    .groupBy(quizzes.id)
    // Mixed quizzes (no topic) first, then one per topic in course order.
    .orderBy(asc(sql`coalesce(${topics.sortOrder}, -1)`), asc(quizzes.createdAt), asc(quizzes.title));
  const live = rows.filter((r) => Number(r.questionCount) > 0);
  const slugs = new Set(live.map((r) => r.slug));
  const modelsOf = new Map<string, QuizModel[]>();
  for (const r of live) {
    const m = MODEL_SLUG.exec(r.slug);
    if (!m?.[1] || !m[2] || !slugs.has(m[1])) continue;
    modelsOf.set(m[1], [...(modelsOf.get(m[1]) ?? []), { id: r.id, label: m[2].toUpperCase(), questionCount: Number(r.questionCount) }]);
  }
  const isModel = (slug: string) => {
    const parent = MODEL_SLUG.exec(slug)?.[1];
    return parent !== undefined && slugs.has(parent);
  };
  return live
    .filter((r) => !isModel(r.slug))
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      descriptionHtml: renderMarkdown(r.descriptionMd),
      mode: r.mode,
      feedback: r.feedback,
      timeLimitSec: r.timeLimitSec,
      passThreshold: r.passThreshold,
      maxAttempts: r.maxAttempts,
      questionCount: Number(r.questionCount),
      totalPoints: Number(r.totalPoints),
      isDemo: r.isDemo,
      topic: r.topicSlug && r.topicTitle ? { slug: r.topicSlug, title: r.topicTitle } : null,
      models: modelsOf.has(r.slug)
        ? [{ id: r.id, label: "A", questionCount: Number(r.questionCount) }, ...modelsOf.get(r.slug)!.sort((a, b) => a.label.localeCompare(b.label))]
        : [],
    }));
});

export const getQuiz = cache(async (scope: CourseScope, slug: string): Promise<QuizDetail | null> => {
  if (!isValidSlug(slug)) return null;
  const card = (await listQuizzes(scope)).find((q) => q.slug === slug);
  if (!card) return null;
  const db = getDb();
  const [settings, typeRows] = await Promise.all([
    db
      .select({ shuffleQuestions: quizzes.shuffleQuestions, shuffleOptions: quizzes.shuffleOptions })
      .from(quizzes)
      .where(and(eq(quizzes.courseId, scope.courseId), eq(quizzes.id, card.id)))
      .limit(1),
    db
      .select({ type: exercises.type, n: sql<number>`count(*)` })
      .from(quizQuestions)
      .innerJoin(exercises, and(eq(exercises.courseId, quizQuestions.courseId), eq(exercises.id, quizQuestions.exerciseId)))
      .where(
        and(
          eq(quizQuestions.courseId, scope.courseId),
          // A quiz with models: the types used in any of them.
          card.models.length > 0 ? inArray(quizQuestions.quizId, card.models.map((m) => m.id)) : eq(quizQuestions.quizId, card.id),
          eq(exercises.status, "published"),
        ),
      )
      .groupBy(exercises.type),
  ]);
  return {
    ...card,
    shuffleQuestions: settings[0]?.shuffleQuestions ?? false,
    shuffleOptions: settings[0]?.shuffleOptions ?? false,
    types: Object.fromEntries(typeRows.map((r) => [r.type, Number(r.n)])),
  };
});

/** The quiz's published questions in quiz order, with their points. */
export async function getQuizQuestions(scope: CourseScope, quizId: string): Promise<{ id: string; points: number }[]> {
  return getDb()
    .select({ id: exercises.id, points: quizQuestions.points })
    .from(quizQuestions)
    .innerJoin(exercises, and(eq(exercises.courseId, quizQuestions.courseId), eq(exercises.id, quizQuestions.exerciseId)))
    .where(and(eq(quizQuestions.courseId, scope.courseId), eq(quizQuestions.quizId, quizId), eq(exercises.status, "published")))
    .orderBy(asc(quizQuestions.sortOrder));
}

export const listExams = cache(async (scope: CourseScope): Promise<ExamCard[]> => {
  const db = getDb();
  const [rows, ruleRows] = await Promise.all([
    db
      .select()
      .from(examTemplates)
      .where(and(eq(examTemplates.courseId, scope.courseId), eq(examTemplates.status, "published")))
      .orderBy(asc(examTemplates.createdAt), asc(examTemplates.title)),
    db
      .select({ examTemplateId: examTemplateRules.examTemplateId, count: examTemplateRules.questionCount, points: examTemplateRules.pointsEach })
      .from(examTemplateRules)
      .where(eq(examTemplateRules.courseId, scope.courseId)),
  ]);
  return rows.map((r) => {
    const rules = ruleRows.filter((x) => x.examTemplateId === r.id);
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      descriptionHtml: renderMarkdown(r.descriptionMd),
      scope: r.scope,
      timeLimitSec: r.timeLimitSec,
      passThreshold: r.passThreshold,
      questionCount: rules.reduce((n, x) => n + x.count, 0),
      totalPoints: rules.reduce((n, x) => n + x.count * x.points, 0),
      shuffleQuestions: r.shuffleQuestions,
      isDemo: r.isDemo,
    };
  });
});

export const getExam = cache(async (scope: CourseScope, slug: string): Promise<ExamCard | null> => {
  if (!isValidSlug(slug)) return null;
  return (await listExams(scope)).find((e) => e.slug === slug) ?? null;
});

/** The template's draw rules and the course's bank of questions that can be scored (not write_code). */
export async function getExamDrawData(scope: CourseScope, examId: string) {
  const db = getDb();
  const [rules, bank] = await Promise.all([
    db
      .select({
        count: examTemplateRules.questionCount,
        type: examTemplateRules.type,
        difficulty: examTemplateRules.difficulty,
        topicId: examTemplateRules.topicId,
        points: examTemplateRules.pointsEach,
      })
      .from(examTemplateRules)
      .where(and(eq(examTemplateRules.courseId, scope.courseId), eq(examTemplateRules.examTemplateId, examId)))
      // Rule ids end in their position (_01, _02, …), so this is the template's order.
      .orderBy(asc(examTemplateRules.id)),
    db
      .select({ id: exercises.id, type: exercises.type, difficulty: exercises.difficulty, topicId: exercises.topicId })
      .from(exercises)
      .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved(), sql`${exercises.type} <> 'write_code'`)),
  ]);
  return { rules, bank };
}

/** Question types a quiz, exam or custom exam can score (write_code runs in the browser only). */
export const SCORABLE_TYPES = ["mcq", "trace", "correct_code"] as const;
export type ScorableType = (typeof SCORABLE_TYPES)[number];

export interface PracticeTopic {
  id: string;
  slug: string;
  title: string;
  /** Published, scorable questions in this topic, by type. */
  counts: Record<ScorableType, number>;
}

/** Topics a student can build a custom exam from: those with scorable questions, in course order. */
export const listPracticeTopics = cache(async (scope: CourseScope): Promise<PracticeTopic[]> => {
  const rows = await getDb()
    .select({ id: topics.id, slug: topics.slug, title: topics.title, type: exercises.type, n: sql<number>`count(*)` })
    .from(exercises)
    .innerJoin(topics, and(eq(topics.courseId, exercises.courseId), eq(topics.id, exercises.topicId)))
    .where(and(eq(exercises.courseId, scope.courseId), eq(exercises.status, "published"), notReserved(), sql`${exercises.type} <> 'write_code'`))
    .groupBy(topics.id, exercises.type)
    .orderBy(asc(topics.sortOrder), asc(topics.title));
  const byId = new Map<string, PracticeTopic>();
  for (const r of rows) {
    const t = byId.get(r.id) ?? { id: r.id, slug: r.slug, title: r.title, counts: { mcq: 0, trace: 0, correct_code: 0 } };
    if ((SCORABLE_TYPES as readonly string[]).includes(r.type)) t.counts[r.type as ScorableType] = Number(r.n);
    byId.set(r.id, t);
  }
  return [...byId.values()];
});

/** The scorable published questions in the given topics (ids from this course only), with the type filter applied. */
export async function getCustomBank(scope: CourseScope, topicIds: readonly string[], types: readonly ScorableType[]) {
  if (topicIds.length === 0 || types.length === 0) return [];
  return getDb()
    .select({ id: exercises.id, topicId: exercises.topicId, type: exercises.type })
    .from(exercises)
    .where(
      and(
        eq(exercises.courseId, scope.courseId),
        eq(exercises.status, "published"), notReserved(),
        inArray(exercises.topicId, [...topicIds]),
        inArray(exercises.type, [...types]),
      ),
    );
}
