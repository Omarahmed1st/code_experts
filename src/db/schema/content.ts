import { sql } from "drizzle-orm";
import {
  type AnySQLiteColumn,
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  unique,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import {
  CODE_LANGUAGE,
  DIFFICULTY,
  LESSON_SECTION_KIND,
  PUBLISH_STATUS,
  RESOURCE_ACCESS,
  RESOURCE_FILE_ROLE,
  RESOURCE_KIND,
  SCHEDULED_STATUS,
} from "../enums";
import type { CodeAnnotations } from "@/lib/lesson/annotations";
import { createdAt, flag, id, json, updatedAt } from "./columns";
import { courseId, users } from "./identity";

// Every link between two course-owned rows is a composite (course_id, x_id)
// foreign key onto UNIQUE (course_id, id), so a link can never cross courses.

export const topics = sqliteTable(
  "topics",
  {
    id: id(),
    courseId: courseId(),
    parentTopicId: text("parent_topic_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.courseId, t.slug),
    foreignKey({
      columns: [t.courseId, t.parentTopicId],
      foreignColumns: [t.courseId, t.id] as [AnySQLiteColumn, AnySQLiteColumn],
    }).onDelete("cascade"),
    index("topics_course_order_idx").on(t.courseId, t.parentTopicId, t.sortOrder),
  ],
);

export const lessons = sqliteTable(
  "lessons",
  {
    id: id(),
    courseId: courseId(),
    topicId: text("topic_id").notNull(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    lectureNumber: integer("lecture_number"),
    sortOrder: integer("sort_order").notNull().default(0),
    difficulty: text("difficulty", { enum: DIFFICULTY }).notNull().default("easy"),
    objectives: json<string[]>("objectives").notNull().default([]),
    prerequisites: json<string[]>("prerequisites").notNull().default([]),
    readingMinutes: integer("reading_minutes").notNull().default(0),
    status: text("status", { enum: SCHEDULED_STATUS }).notNull().default("draft"),
    publishAt: integer("publish_at"),
    publishedAt: integer("published_at"),
    isDemo: flag("is_demo", false),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.courseId, t.slug),
    // No ON DELETE: lectures must be moved before their topic can be deleted.
    foreignKey({ columns: [t.courseId, t.topicId], foreignColumns: [topics.courseId, topics.id] }),
    index("lessons_course_order_idx").on(t.courseId, t.status, t.sortOrder),
    index("lessons_topic_idx").on(t.courseId, t.topicId, t.sortOrder),
  ],
);

export const lessonSections = sqliteTable(
  "lesson_sections",
  {
    id: id(),
    courseId: courseId(),
    lessonId: text("lesson_id").notNull(),
    kind: text("kind", { enum: LESSON_SECTION_KIND }).notNull(),
    title: text("title").notNull().default(""),
    bodyMd: text("body_md").notNull().default(""),
    code: text("code"),
    codeLanguage: text("code_language", { enum: CODE_LANGUAGE }),
    imageAlt: text("image_alt"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    // Added by migration 0002 (CHECKs live in SQL).
    sampleInput: text("sample_input").notNull().default(""),
    expectedOutput: text("expected_output"),
    annotations: json<CodeAnnotations>("annotations"),
    imageWidth: integer("image_width"),
    imageHeight: integer("image_height"),
    imageKey: text("image_key"), // courses/<course_id>/lessons/... (CHECK in SQL)
    // Re-added last by migration 0003, which widened its CHECK to Python and C++.
    runnable: flag("runnable", false),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }).onDelete(
      "cascade",
    ),
    index("lesson_sections_lesson_idx").on(t.courseId, t.lessonId, t.sortOrder),
    uniqueIndex("lesson_sections_image_key_uq").on(t.imageKey).where(sql`${t.imageKey} IS NOT NULL`),
  ],
);

export const lessonRelations = sqliteTable(
  "lesson_relations",
  {
    courseId: courseId(),
    lessonId: text("lesson_id").notNull(),
    relatedLessonId: text("related_lesson_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.relatedLessonId] }),
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }).onDelete(
      "cascade",
    ),
    foreignKey({
      columns: [t.courseId, t.relatedLessonId],
      foreignColumns: [lessons.courseId, lessons.id],
    }).onDelete("cascade"),
  ],
);

export const resources = sqliteTable(
  "resources",
  {
    id: id(),
    courseId: courseId(),
    topicId: text("topic_id"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    descriptionMd: text("description_md").notNull().default(""),
    kind: text("kind", { enum: RESOURCE_KIND }).notNull(),
    access: text("access", { enum: RESOURCE_ACCESS }).notNull().default("public"),
    downloadable: flag("downloadable", true),
    sortOrder: integer("sort_order").notNull().default(0),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.courseId, t.slug),
    foreignKey({ columns: [t.courseId, t.topicId], foreignColumns: [topics.courseId, topics.id] }),
    index("resources_course_idx").on(t.courseId, t.status, t.sortOrder),
  ],
);

export const resourceFiles = sqliteTable(
  "resource_files",
  {
    id: id(),
    courseId: courseId(),
    resourceId: text("resource_id").notNull(),
    role: text("role", { enum: RESOURCE_FILE_ROLE }).notNull(),
    r2Key: text("r2_key").notNull(), // courses/<course_id>/resources/<resource_id>/<file id> (CHECK in SQL)
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.courseId, t.id),
    unique().on(t.resourceId, t.role),
    foreignKey({
      columns: [t.courseId, t.resourceId],
      foreignColumns: [resources.courseId, resources.id],
    }).onDelete("cascade"),
    uniqueIndex("resource_files_key_uq").on(t.r2Key),
  ],
);

export const lessonResources = sqliteTable(
  "lesson_resources",
  {
    courseId: courseId(),
    lessonId: text("lesson_id").notNull(),
    resourceId: text("resource_id").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.lessonId, t.resourceId] }),
    foreignKey({ columns: [t.courseId, t.lessonId], foreignColumns: [lessons.courseId, lessons.id] }).onDelete(
      "cascade",
    ),
    foreignKey({
      columns: [t.courseId, t.resourceId],
      foreignColumns: [resources.courseId, resources.id],
    }).onDelete("cascade"),
  ],
);
