import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import { COURSE_STAFF_ROLE, PRIMARY_LANGUAGE, PUBLISH_STATUS, SITE_ROLE, USER_STATUS } from "../enums";
import { createdAt, flag, id, json, timestamp, updatedAt } from "./columns";

// ---------------------------------------------------------------------------
// Identity and access
// ---------------------------------------------------------------------------

export const users = sqliteTable(
  "users",
  {
    id: id(),
    email: text("email").notNull(), // COLLATE NOCASE in SQL
    emailVerified: flag("email_verified", false),
    name: text("name").notNull().default(""),
    image: text("image"),
    status: text("status", { enum: USER_STATUS }).notNull().default("active"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const sessions = sqliteTable(
  "sessions",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    token: text("token").notNull(), // hash of the cookie value
    expiresAt: integer("expires_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    /** 0005: idle limit in ms; NULL is the staff rule (12 hours). */
    idleMs: integer("idle_ms"),
  },
  (t) => [
    uniqueIndex("sessions_token_uq").on(t.token),
    index("sessions_user_idx").on(t.userId),
    index("sessions_expires_idx").on(t.expiresAt),
  ],
);

export const accounts = sqliteTable(
  "accounts",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    providerId: text("provider_id").notNull(),
    accountId: text("account_id").notNull(),
    password: text("password"), // hash only
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at"),
    refreshTokenExpiresAt: integer("refresh_token_expires_at"),
    scope: text("scope"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("accounts_provider_uq").on(t.providerId, t.accountId),
    index("accounts_user_idx").on(t.userId),
  ],
);

export const verifications = sqliteTable(
  "verifications",
  {
    id: id(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(), // hashed token
    expiresAt: integer("expires_at").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("verifications_identifier_idx").on(t.identifier)],
);

export const roles = sqliteTable("roles", {
  id: text("id", { enum: SITE_ROLE }).primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
});

export const userRoles = sqliteTable(
  "user_roles",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: text("role_id", { enum: SITE_ROLE })
      .notNull()
      .references(() => roles.id, { onDelete: "restrict" }),
    grantedBy: text("granted_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.roleId] })],
);

// ---------------------------------------------------------------------------
// Courses: the unit of separation
// ---------------------------------------------------------------------------

export const courses = sqliteTable(
  "courses",
  {
    id: id(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    shortTitle: text("short_title").notNull(),
    description: text("description").notNull().default(""),
    primaryLanguage: text("primary_language", { enum: PRIMARY_LANGUAGE }).notNull(),
    tags: json<string[]>("tags").notNull().default([]),
    status: text("status", { enum: PUBLISH_STATUS }).notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    publishedAt: integer("published_at"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("courses_slug_uq").on(t.slug), index("courses_status_idx").on(t.status, t.sortOrder)],
);

/** `course_id NOT NULL REFERENCES courses (id) ON DELETE CASCADE`, used by every course-owned table. */
export const courseId = () =>
  text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" });

export const courseStaff = sqliteTable(
  "course_staff",
  {
    courseId: courseId(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: text("role", { enum: COURSE_STAFF_ROLE }).notNull(),
    createdAt: timestamp("created_at"),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.userId] }), index("course_staff_user_idx").on(t.userId)],
);
