import { type AnySQLiteColumn, foreignKey, index, integer, primaryKey, sqliteTable, text, unique } from "drizzle-orm/sqlite-core";
import {
  ANSWER_KIND,
  CODE_LANGUAGE,
  COMPARE_MODE,
  DIFFICULTY,
  EXAM_SCOPE,
  EXERCISE_TYPE,
  GRADING_MODE,
  PUBLISH_STATUS,
  QUIZ_FEEDBACK,
  QUIZ_MODE,
  SCHEDULED_STATUS,
} from "../enums";
import { createdAt, flag, id, json, updatedAt } from "./columns";
import { lessons, topics } from "./content";
import { courseId, users } from "./identity";

// ---------------------------------------------------------------------------
// Question bank. Answer keys (exercise_options.is_correct, exercise_answers,
// hidden test cases, explanation_md) are read only by grading and admin code.
// ---------------------------------------------------------------------------

export const exercises = sqliteTable(
  "exercises",
  {
    id: id(),
    courseId: courseId(),
    topicId: text("topic_id"),
    lessonId: text("lesson_id"),
    slug: text("slug").notNull(),
    type: text("type", { enum: EXERCISE_TYPE }).notNull(),
    title: text("title").notNull(),
    promptMd: text("prompt_md").notNull(),
    code: text("code"),
    codeLanguage: text("code_language", { enum: CODE_LANGUAGE }),
    expectedBehaviorMd: text("expected_behavior_md").notNull().default(""),
    explanationMd: text("explanation_md").notNull().default(""),
    difficulty: text("difficulty", { enum: DIFFICULTY }).notNull(),
    gradingMode: text("grading_mode", { enum: GRADING_MODE }).notNull(),
    settings: json<Record<string, unknown>>("settings").notNull().default({}),
    points: integer("points").notNull().default(1),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    isDemo: flag("is_demo", false),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.courseId, t.slug),
    foreignKey({ columns: [t.courseId, t.topicId], foreignColumns: [topics.courseId, topics.id] }),
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }),
    index("exercises_course_filter_idx").on(t.courseId, t.status, t.type, t.difficulty),
    index("exercises_topic_idx").on(t.courseId, t.topicId),
  ],
);

/** (course_id, exercise_id) -> exercises (course_id, id) */
export const exerciseFk = (t: { courseId: AnySQLiteColumn; exerciseId: AnySQLiteColumn }) =>
  foreignKey({ columns: [t.courseId, t.exerciseId], foreignColumns: [exercises.courseId, exercises.id] });

export const exerciseOptions = sqliteTable(
  "exercise_options",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    labelMd: text("label_md").notNull(),
    isCorrect: flag("is_correct", false),
    feedbackMd: text("feedback_md").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    exerciseFk(t).onDelete("cascade"),
    index("exercise_options_ex_idx").on(t.courseId, t.exerciseId, t.sortOrder),
  ],
);

export const exerciseAnswers = sqliteTable(
  "exercise_answers",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    kind: text("kind", { enum: ANSWER_KIND }).notNull(),
    value: text("value").notNull(),
    notesMd: text("notes_md").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    exerciseFk(t).onDelete("cascade"),
    index("exercise_answers_ex_idx").on(t.courseId, t.exerciseId),
  ],
);

export const exerciseTestCases = sqliteTable(
  "exercise_test_cases",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    name: text("name").notNull().default(""),
    stdin: text("stdin").notNull().default(""),
    expectedStdout: text("expected_stdout").notNull(),
    compareMode: text("compare_mode", { enum: COMPARE_MODE }).notNull().default("exact"),
    isHidden: flag("is_hidden", true),
    timeoutMs: integer("timeout_ms").notNull().default(2000),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    exerciseFk(t).onDelete("cascade"),
    index("exercise_test_cases_ex_idx").on(t.courseId, t.exerciseId, t.sortOrder),
  ],
);

export const exerciseHints = sqliteTable(
  "exercise_hints",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    hintMd: text("hint_md").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [unique().on(t.courseId, t.id), exerciseFk(t).onDelete("cascade")],
);

export const exerciseTraceSteps = sqliteTable(
  "exercise_trace_steps",
  {
    id: id(),
    courseId: courseId(),
    exerciseId: text("exercise_id").notNull(),
    stepNo: integer("step_no").notNull(),
    lineNo: integer("line_no"),
    explanation: text("explanation").notNull(),
    variables: json<Record<string, unknown>>("variables").notNull().default({}),
    output: text("output").notNull().default(""),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.exerciseId, t.stepNo),
    exerciseFk(t).onDelete("cascade"),
  ],
);

// ---------------------------------------------------------------------------
// Quizzes and practice exams
// ---------------------------------------------------------------------------

export const quizzes = sqliteTable(
  "quizzes",
  {
    id: id(),
    courseId: courseId(),
    topicId: text("topic_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    descriptionMd: text("description_md").notNull().default(""),
    mode: text("mode", { enum: QUIZ_MODE }).notNull().default("practice"),
    feedback: text("feedback", { enum: QUIZ_FEEDBACK }).notNull().default("immediate"),
    timeLimitSec: integer("time_limit_sec"),
    passThreshold: integer("pass_threshold").notNull().default(60),
    shuffleQuestions: flag("shuffle_questions", false),
    shuffleOptions: flag("shuffle_options", false),
    maxAttempts: integer("max_attempts"),
    status: text("status", { enum: SCHEDULED_STATUS }).notNull().default("draft"),
    publishAt: integer("publish_at"),
    isDemo: flag("is_demo", false),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.courseId, t.slug),
    foreignKey({ columns: [t.courseId, t.topicId], foreignColumns: [topics.courseId, topics.id] }),
    index("quizzes_course_idx").on(t.courseId, t.status),
  ],
);

export const quizQuestions = sqliteTable(
  "quiz_questions",
  {
    courseId: courseId(),
    quizId: text("quiz_id").notNull(),
    exerciseId: text("exercise_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    points: integer("points").notNull().default(1),
  },
  (t) => [
    primaryKey({ columns: [t.quizId, t.exerciseId] }),
    foreignKey({ columns: [t.courseId, t.quizId], foreignColumns: [quizzes.courseId, quizzes.id] }).onDelete(
      "cascade",
    ),
    // No ON DELETE: remove a question from its quizzes before deleting it.
    exerciseFk(t),
    index("quiz_questions_order_idx").on(t.courseId, t.quizId, t.sortOrder),
  ],
);

export const examTemplates = sqliteTable(
  "exam_templates",
  {
    id: id(),
    courseId: courseId(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    descriptionMd: text("description_md").notNull().default(""),
    scope: text("scope", { enum: EXAM_SCOPE }).notNull().default("course"),
    timeLimitSec: integer("time_limit_sec").notNull(),
    passThreshold: integer("pass_threshold").notNull().default(60),
    shuffleQuestions: flag("shuffle_questions", true),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    isDemo: flag("is_demo", false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [unique().on(t.courseId, t.id), unique().on(t.courseId, t.slug)],
);

export const examTemplateRules = sqliteTable(
  "exam_template_rules",
  {
    id: id(),
    courseId: courseId(),
    examTemplateId: text("exam_template_id").notNull(),
    topicId: text("topic_id"), // NULL = any topic in this course
    type: text("type", { enum: EXERCISE_TYPE }),
    difficulty: text("difficulty", { enum: DIFFICULTY }),
    questionCount: integer("question_count").notNull(),
    pointsEach: integer("points_each").notNull().default(1),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    foreignKey({
      columns: [t.courseId, t.examTemplateId],
      foreignColumns: [examTemplates.courseId, examTemplates.id],
    }).onDelete("cascade"),
    foreignKey({ columns: [t.courseId, t.topicId], foreignColumns: [topics.courseId, topics.id] }).onDelete(
      "cascade",
    ),
  ],
);
