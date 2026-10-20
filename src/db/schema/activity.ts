import { foreignKey, index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import { ATTEMPT_STATUS, PROGRESS_STATUS, QUIZ_FEEDBACK, PUBLISH_STATUS, PRIMARY_LANGUAGE, SUBMISSION_STATUS } from "../enums";
import { createdAt, id, json, optionalFlag, timestamp, updatedAt } from "./columns";
import { lessons, resources } from "./content";
import { courseId, users } from "./identity";
import { examTemplates, exerciseFk, exercises, quizzes } from "./questions";

// Student activity: always scoped to one course.

const userId = () =>
  text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" });

export const quizAttempts = sqliteTable(
  "quiz_attempts",
  {
    id: id(),
    courseId: courseId(),
    quizId: text("quiz_id").notNull(),
    userId: userId(),
    status: text("status", { enum: ATTEMPT_STATUS }).notNull().default("in_progress"),
    questionOrder: json<string[]>("question_order").notNull().default([]),
    startedAt: timestamp("started_at"),
    deadlineAt: integer("deadline_at"),
    submittedAt: integer("submitted_at"),
    score: integer("score"),
    maxScore: integer("max_score"),
    passed: optionalFlag("passed"),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    foreignKey({ columns: [t.courseId, t.quizId], foreignColumns: [quizzes.courseId, quizzes.id] }).onDelete(
      "cascade",
    ),
    index("quiz_attempts_user_idx").on(t.userId, t.courseId, t.startedAt),
    index("quiz_attempts_quiz_idx").on(t.courseId, t.quizId),
    index("quiz_attempts_user_quiz_idx").on(t.userId, t.quizId, t.startedAt),
  ],
);

export const quizResponses = sqliteTable(
  "quiz_responses",
  {
    id: id(),
    courseId: courseId(),
    attemptId: text("attempt_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    response: json<unknown>("response").notNull().default({}),
    isCorrect: optionalFlag("is_correct"),
    pointsAwarded: integer("points_awarded"),
    timeSpentMs: integer("time_spent_ms"),
    answeredAt: timestamp("answered_at"),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.attemptId, t.exerciseId),
    foreignKey({
      columns: [t.courseId, t.attemptId],
      foreignColumns: [quizAttempts.courseId, quizAttempts.id],
    }).onDelete("cascade"),
    exerciseFk(t).onDelete("cascade"),
    index("quiz_responses_exercise_idx").on(t.courseId, t.exerciseId, t.isCorrect),
  ],
);

export const examAttempts = sqliteTable(
  "exam_attempts",
  {
    id: id(),
    courseId: courseId(),
    examTemplateId: text("exam_template_id").notNull(),
    userId: userId(),
    status: text("status", { enum: ATTEMPT_STATUS }).notNull().default("in_progress"),
    startedAt: timestamp("started_at"),
    deadlineAt: integer("deadline_at").notNull(),
    submittedAt: integer("submitted_at"),
    score: integer("score"),
    maxScore: integer("max_score"),
    passed: optionalFlag("passed"),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    foreignKey({
      columns: [t.courseId, t.examTemplateId],
      foreignColumns: [examTemplates.courseId, examTemplates.id],
    }).onDelete("cascade"),
    index("exam_attempts_user_idx").on(t.userId, t.courseId, t.startedAt),
  ],
);

export const examAttemptQuestions = sqliteTable(
  "exam_attempt_questions",
  {
    courseId: courseId(),
    examAttemptId: text("exam_attempt_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    points: integer("points").notNull().default(1),
    response: json<unknown>("response"),
    isCorrect: optionalFlag("is_correct"),
    pointsAwarded: integer("points_awarded"),
    savedAt: integer("saved_at"),
  },
  (t) => [
    primaryKey({ columns: [t.examAttemptId, t.exerciseId] }),
    unique().on(t.examAttemptId, t.position),
    foreignKey({
      columns: [t.courseId, t.examAttemptId],
      foreignColumns: [examAttempts.courseId, examAttempts.id],
    }).onDelete("cascade"),
    exerciseFk(t).onDelete("cascade"),
    index("exam_attempt_questions_exercise_idx").on(t.courseId, t.exerciseId, t.isCorrect),
  ],
);

/** 0005: "build your own exam" attempts (no exam template, so not in exam_attempts). */
export const customExamAttempts = sqliteTable(
  "custom_exam_attempts",
  {
    id: id(),
    courseId: courseId(),
    userId: userId(),
    title: text("title").notNull(),
    feedback: text("feedback", { enum: QUIZ_FEEDBACK }).notNull(),
    passThreshold: integer("pass_threshold").notNull(),
    status: text("status", { enum: ATTEMPT_STATUS }).notNull().default("in_progress"),
    startedAt: timestamp("started_at"),
    deadlineAt: integer("deadline_at"),
    submittedAt: integer("submitted_at"),
    score: integer("score"),
    maxScore: integer("max_score"),
    passed: optionalFlag("passed"),
  },
  (t) => [unique().on(t.courseId, t.id), index("custom_exam_attempts_user_idx").on(t.userId, t.courseId, t.startedAt)],
);

export const customExamQuestions = sqliteTable(
  "custom_exam_questions",
  {
    courseId: courseId(),
    attemptId: text("attempt_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    position: integer("position").notNull(),
    points: integer("points").notNull().default(1),
    response: json<unknown>("response"),
    isCorrect: optionalFlag("is_correct"),
    pointsAwarded: integer("points_awarded"),
  },
  (t) => [
    primaryKey({ columns: [t.attemptId, t.exerciseId] }),
    unique().on(t.attemptId, t.position),
    foreignKey({
      columns: [t.courseId, t.attemptId],
      foreignColumns: [customExamAttempts.courseId, customExamAttempts.id],
    }).onDelete("cascade"),
    exerciseFk(t).onDelete("cascade"),
    index("custom_exam_questions_exercise_idx").on(t.courseId, t.exerciseId, t.isCorrect),
  ],
);

export const exerciseAttempts = sqliteTable(
  "exercise_attempts",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    userId: userId(),
    response: json<unknown>("response").notNull().default({}),
    isCorrect: optionalFlag("is_correct"),
    hintsUsed: integer("hints_used").notNull().default(0),
    timeSpentMs: integer("time_spent_ms"),
    createdAt: createdAt(),
    /** What the student's browser reported for its own test run (migration 0006). Never a mark. */
    selfCheck: text("self_check", { enum: ["passed", "failed"] }),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    exerciseFk(t).onDelete("cascade"),
    index("exercise_attempts_user_idx").on(t.userId, t.courseId, t.createdAt),
    index("exercise_attempts_ex_idx").on(t.courseId, t.exerciseId, t.isCorrect),
  ],
);

export const codeSubmissions = sqliteTable(
  "code_submissions",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    userId: userId(),
    language: text("language", { enum: PRIMARY_LANGUAGE }).notNull(),
    source: text("source").notNull(), // at most 65536 characters (CHECK in SQL)
    status: text("status", { enum: SUBMISSION_STATUS }).notNull().default("draft"),
    runnerResult: json<unknown>("runner_result"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    exerciseFk(t).onDelete("cascade"),
    index("code_submissions_user_idx").on(t.userId, t.courseId, t.exerciseId, t.updatedAt),
  ],
);

export const studentProgress = sqliteTable(
  "student_progress",
  {
    userId: userId(),
    courseId: courseId(),
    lessonId: text("lesson_id").notNull(),
    status: text("status", { enum: PROGRESS_STATUS }).notNull().default("started"),
    completedAt: integer("completed_at"),
    updatedAt: updatedAt(),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.lessonId] }),
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }).onDelete(
      "cascade",
    ),
    index("student_progress_course_idx").on(t.userId, t.courseId),
  ],
);

/** Exactly one target per bookmark (CHECK in SQL), always in the bookmark's course. */
export const bookmarks = sqliteTable(
  "bookmarks",
  {
    id: id(),
    userId: userId(),
    courseId: courseId(),
    lessonId: text("lesson_id"),
    exerciseId: text("exercise_id"),
    resourceId: text("resource_id"),
    quizId: text("quiz_id"),
    createdAt: createdAt(),
  },
  (t) => [
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }).onDelete(
      "cascade",
    ),
    foreignKey({
      columns: [t.courseId, t.exerciseId],
      foreignColumns: [exercises.courseId, exercises.id],
    }).onDelete("cascade"),
    foreignKey({
      columns: [t.courseId, t.resourceId],
      foreignColumns: [resources.courseId, resources.id],
    }).onDelete("cascade"),
    foreignKey({ columns: [t.courseId, t.quizId], foreignColumns: [quizzes.courseId, quizzes.id] }).onDelete(
      "cascade",
    ),
    // bookmarks_target_uq is an expression index (coalesce per target) and lives only in
    // SQL: drizzle-kit renders expression indexes incorrectly.
    index("bookmarks_user_course_idx").on(t.userId, t.courseId, t.createdAt),
  ],
);

export const achievements = sqliteTable(
  "achievements",
  {
    id: id(),
    courseId: courseId(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    criteria: json<Record<string, unknown>>("criteria").notNull().default({}),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    createdAt: createdAt(),
  },
  (t) => [unique().on(t.courseId, t.id), unique().on(t.courseId, t.slug)],
);

export const studentAchievements = sqliteTable(
  "student_achievements",
  {
    userId: userId(),
    courseId: courseId(),
    achievementId: text("achievement_id").notNull(),
    awardedAt: timestamp("awarded_at"),
  },
  (t) => [
    primaryKey({ columns: [t.userId, t.achievementId] }),
    foreignKey({
      columns: [t.courseId, t.achievementId],
      foreignColumns: [achievements.courseId, achievements.id],
    }).onDelete("cascade"),
  ],
);
