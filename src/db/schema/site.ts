import { index, integer, primaryKey, sqliteTable, text, unique, uniqueIndex } from "drizzle-orm/sqlite-core";
import {
  AD_DEVICES,
  AD_EXCLUSION_KIND,
  AD_FORMAT,
  AD_PAGE_TYPE,
  CMP_PROVIDER,
  CONSENT_DEFAULT,
  LOG_LEVEL,
  MESSAGE_STATUS,
  REVISION_ENTITY,
  STATS_ENTITY,
} from "../enums";
import { createdAt, flag, id, json, timestamp, updatedAt } from "./columns";
import { courseId, courses, users } from "./identity";

// ---------------------------------------------------------------------------
// Content operations
// ---------------------------------------------------------------------------

export const contentRevisions = sqliteTable(
  "content_revisions",
  {
    id: id(),
    courseId: courseId(),
    entityType: text("entity_type", { enum: REVISION_ENTITY }).notNull(),
    entityId: text("entity_id").notNull(),
    revisionNo: integer("revision_no").notNull(),
    snapshot: json<unknown>("snapshot").notNull(),
    authorId: text("author_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    unique().on(t.entityType, t.entityId, t.revisionNo),
    index("content_revisions_course_idx").on(t.courseId, t.entityType, t.entityId),
  ],
);

/** SEO overrides per path. Course pages carry their course_id; site pages have NULL. */
export const seoMetadata = sqliteTable(
  "seo_metadata",
  {
    id: id(),
    courseId: text("course_id").references(() => courses.id, { onDelete: "cascade" }),
    path: text("path").notNull(),
    title: text("title"),
    description: text("description"),
    canonicalUrl: text("canonical_url"),
    ogImageKey: text("og_image_key"),
    noindex: flag("noindex", false),
    structuredData: json<unknown>("structured_data"),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("seo_metadata_path_uq").on(t.path)],
);

// search_index is an FTS5 virtual table. Drizzle can't declare virtual tables,
// so it is queried with raw SQL in src/server/search (always filtered by course_id).

export const searchQueries = sqliteTable(
  "search_queries",
  {
    id: id(),
    courseId: courseId(),
    query: text("query").notNull(),
    resultsCount: integer("results_count").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("search_queries_course_idx").on(t.courseId, t.createdAt)],
);

export const contentDailyStats = sqliteTable(
  "content_daily_stats",
  {
    courseId: courseId(),
    entityType: text("entity_type", { enum: STATS_ENTITY }).notNull(),
    entityId: text("entity_id").notNull(),
    day: text("day").notNull(), // YYYY-MM-DD
    views: integer("views").notNull().default(0),
    completions: integer("completions").notNull().default(0),
    downloads: integer("downloads").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.courseId, t.entityType, t.entityId, t.day] })],
);

// ---------------------------------------------------------------------------
// Site settings, advertising, consent, audit
// ---------------------------------------------------------------------------

export const siteSettings = sqliteTable("site_settings", {
  key: text("key").primaryKey(),
  value: json<unknown>("value").notNull(),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

/** Disabled by default; enabled = 1 requires a real ad unit id (CHECK in SQL). Rebuilt by migration 0007. */
export const adPlacements = sqliteTable(
  "ad_placements",
  {
    id: id(),
    placementKey: text("placement_key").notNull(),
    pageType: text("page_type", { enum: AD_PAGE_TYPE }).notNull(),
    description: text("description").notNull().default(""),
    adUnitId: text("ad_unit_id"),
    format: text("format", { enum: AD_FORMAT }).notNull().default("auto"),
    responsive: flag("responsive", true),
    devices: text("devices", { enum: AD_DEVICES }).notNull().default("all"),
    minHeightPx: integer("min_height_px").notNull().default(250),
    enabled: flag("enabled", false),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: updatedAt(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("ad_placements_key_uq").on(t.placementKey)],
);

/** Where no ad may render: a path pattern, a whole course or a page type (migration 0007). */
export const adExclusions = sqliteTable(
  "ad_exclusions",
  {
    id: id(),
    kind: text("kind", { enum: AD_EXCLUSION_KIND }).notNull(),
    pathGlob: text("path_glob"),
    courseId: text("course_id").references(() => courses.id, { onDelete: "cascade" }),
    pageType: text("page_type", { enum: AD_PAGE_TYPE }),
    reason: text("reason").notNull().default(""),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [index("ad_exclusions_course_idx").on(t.courseId)],
);

export const consentConfiguration = sqliteTable("consent_configuration", {
  id: text("id", { enum: ["default"] }).primaryKey(),
  cmpProvider: text("cmp_provider", { enum: CMP_PROVIDER }).notNull().default("none"),
  cmpSettings: json<Record<string, unknown>>("cmp_settings").notNull().default({}),
  regulatedRegions: json<string[]>("regulated_regions").notNull().default(["EEA", "UK", "CH"]),
  analyticsDefault: text("analytics_default", { enum: CONSENT_DEFAULT }).notNull().default("denied"),
  adsDefault: text("ads_default", { enum: CONSENT_DEFAULT }).notNull().default("denied"),
  privacyChoicesLink: flag("privacy_choices_link", true),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
  updatedAt: updatedAt(),
});

export const adminAuditLogs = sqliteTable(
  "admin_audit_logs",
  {
    id: id(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    beforeState: json<unknown>("before_state"),
    afterState: json<unknown>("after_state"),
    ipAddress: text("ip_address"),
    createdAt: createdAt(),
  },
  (t) => [
    index("admin_audit_logs_time_idx").on(t.createdAt),
    index("admin_audit_logs_course_idx").on(t.courseId, t.createdAt),
    index("admin_audit_logs_actor_idx").on(t.actorUserId, t.createdAt),
  ],
);

/** Sign-in throttling counters (migration 0004). Keys never hold a plain email address. */
export const rateLimits = sqliteTable(
  "rate_limits",
  {
    key: text("key").primaryKey(),
    windowStart: integer("window_start").notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [index("rate_limits_window_idx").on(t.windowStart)],
);

export const contactMessages = sqliteTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  status: text("status", { enum: MESSAGE_STATUS }).notNull().default("new"),
  createdAt: timestamp("created_at"),
});

export const appErrorLogs = sqliteTable(
  "app_error_logs",
  {
    id: id(),
    level: text("level", { enum: LOG_LEVEL }).notNull(),
    message: text("message").notNull(),
    path: text("path"),
    requestId: text("request_id"),
    createdAt: createdAt(),
  },
  (t) => [index("app_error_logs_time_idx").on(t.createdAt)],
);
