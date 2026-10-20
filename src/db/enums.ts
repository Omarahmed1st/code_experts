// Allowed values for every enum column in migrations/0001_initial_schema.sql.
// The SQL CHECK constraints are the real guard; these lists give the same
// values a TypeScript type so application code can't drift from them.

export const PUBLISH_STATUS = ["draft", "published", "archived"] as const;
export const SCHEDULED_STATUS = ["draft", "scheduled", "published", "archived"] as const;
export const DIFFICULTY = ["easy", "medium", "hard"] as const;
export const PRIMARY_LANGUAGE = ["cpp", "python"] as const;
export const CODE_LANGUAGE = ["cpp", "python", "text", "pseudocode"] as const;

export const USER_STATUS = ["active", "disabled", "deleted"] as const;
export const SITE_ROLE = ["student", "editor", "admin"] as const;
export const COURSE_STAFF_ROLE = ["editor", "course_admin"] as const;

export const LESSON_SECTION_KIND = [
  "explanation",
  "example",
  "code",
  "diagram",
  "common_mistakes",
  "key_takeaways",
  "note",
] as const;
export const RESOURCE_KIND = ["presentation", "pdf", "handout", "image", "code", "assignment"] as const;
export const RESOURCE_ACCESS = ["public", "students", "staff"] as const;
export const RESOURCE_FILE_ROLE = ["original", "preview"] as const;

export const EXERCISE_TYPE = ["mcq", "write_code", "trace", "correct_code"] as const;
export const GRADING_MODE = ["auto", "reference_review", "runner"] as const;
export const ANSWER_KIND = ["trace_output", "reference_solution", "accepted_solution"] as const;
export const COMPARE_MODE = ["exact", "trim_trailing", "normalize_whitespace"] as const;

export const QUIZ_MODE = ["practice", "exam"] as const;
export const QUIZ_FEEDBACK = ["immediate", "after_submit"] as const;
export const EXAM_SCOPE = ["course", "topic", "mixed_topics"] as const;
export const ATTEMPT_STATUS = ["in_progress", "submitted", "expired"] as const;
export const SUBMISSION_STATUS = [
  "draft",
  "submitted",
  "queued",
  "running",
  "passed",
  "failed",
  "error",
  "needs_review",
  "self_reviewed",
] as const;
export const PROGRESS_STATUS = ["started", "completed"] as const;

export const REVISION_ENTITY = ["course", "topic", "lesson", "resource", "exercise", "quiz", "exam_template"] as const;
export const STATS_ENTITY = ["course", "lesson", "exercise", "quiz", "resource", "exam_template"] as const;

// Widened by migration 0007 (topic, exercise). Which of these may really show ads is decided in src/lib/ads/policy.ts.
export const AD_PAGE_TYPE = ["home", "course_list", "course", "topic", "lesson", "exercise_list", "exercise", "resource", "review"] as const;
export const AD_DEVICES = ["all", "desktop", "mobile"] as const;
export const AD_EXCLUSION_KIND = ["path", "course", "page_type"] as const;
export const AD_FORMAT = ["auto", "fluid", "rectangle", "horizontal", "vertical"] as const;
export const CMP_PROVIDER = ["none", "google_privacy_messaging", "certified_third_party"] as const;
export const CONSENT_DEFAULT = ["denied", "granted"] as const;
export const MESSAGE_STATUS = ["new", "read", "archived"] as const;
export const LOG_LEVEL = ["error", "warn"] as const;
