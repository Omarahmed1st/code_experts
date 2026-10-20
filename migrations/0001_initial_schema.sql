-- CodeLab initial schema for Cloudflare D1 (SQLite).
--
-- CORE RULE: every course is an independent learning environment.
-- Every piece of course content and every piece of course-related student data
-- carries a NOT NULL course_id. Rows that point at other course-owned rows do so
-- through COMPOSITE foreign keys (course_id, <id>) that target UNIQUE(course_id, id),
-- so the database itself rejects any link between two different courses.
--
-- IDs are application-generated text ids (UUIDv7 / ULID style), timestamps are
-- integer milliseconds since the Unix epoch.

-- ======================================================================
-- Identity and access
-- (column names follow the user/session/account/verification model used by
--  common Workers-compatible auth libraries; final mapping is settled in Phase 4)
-- ======================================================================

CREATE TABLE users (
  id              TEXT PRIMARY KEY,
  email           TEXT NOT NULL COLLATE NOCASE,
  email_verified  INTEGER NOT NULL DEFAULT 0 CHECK (email_verified IN (0, 1)),
  name            TEXT NOT NULL DEFAULT '',
  image           TEXT,
  status          TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled', 'deleted')),
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX users_email_uq ON users (email);

CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  token       TEXT NOT NULL,                -- stored as a hash of the cookie value
  expires_at  INTEGER NOT NULL,
  ip_address  TEXT,
  user_agent  TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX sessions_token_uq ON sessions (token);
CREATE INDEX sessions_user_idx ON sessions (user_id);
CREATE INDEX sessions_expires_idx ON sessions (expires_at);

CREATE TABLE accounts (
  id                        TEXT PRIMARY KEY,
  user_id                   TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  provider_id               TEXT NOT NULL,   -- 'credential' for email + password
  account_id                TEXT NOT NULL,
  password                  TEXT,            -- password hash only, never plain text
  access_token              TEXT,
  refresh_token             TEXT,
  id_token                  TEXT,
  access_token_expires_at   INTEGER,
  refresh_token_expires_at  INTEGER,
  scope                     TEXT,
  created_at                INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at                INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX accounts_provider_uq ON accounts (provider_id, account_id);
CREATE INDEX accounts_user_idx ON accounts (user_id);

CREATE TABLE verifications (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,                 -- e.g. email-verification:<email>
  value       TEXT NOT NULL,                 -- hashed token
  expires_at  INTEGER NOT NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX verifications_identifier_idx ON verifications (identifier);

-- Site-wide roles: student, editor, admin. (Guests have no row.)
CREATE TABLE roles (
  id           TEXT PRIMARY KEY CHECK (id IN ('student', 'editor', 'admin')),
  name         TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT ''
);
INSERT INTO roles (id, name, description) VALUES
  ('student', 'Student', 'Can save progress, bookmarks and assessment history.'),
  ('editor', 'Editor', 'Can edit content in the courses they are assigned to.'),
  ('admin', 'Administrator', 'Full access to every course and to site settings.');

CREATE TABLE user_roles (
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role_id     TEXT NOT NULL REFERENCES roles (id) ON DELETE RESTRICT,
  granted_by  TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (user_id, role_id)
);

-- ======================================================================
-- Courses: the unit of separation
-- ======================================================================

CREATE TABLE courses (
  id               TEXT PRIMARY KEY,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  short_title      TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  primary_language TEXT NOT NULL CHECK (primary_language IN ('cpp', 'python')),
  tags             TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(tags)),
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  published_at     INTEGER,
  created_by       TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_by       TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE UNIQUE INDEX courses_slug_uq ON courses (slug);
CREATE INDEX courses_status_idx ON courses (status, sort_order);

-- Per-course staff: an editor can be limited to one course.
CREATE TABLE course_staff (
  course_id   TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  user_id     TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('editor', 'course_admin')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (course_id, user_id)
);
CREATE INDEX course_staff_user_idx ON course_staff (user_id);

-- ======================================================================
-- Course content
-- ======================================================================

-- Topics and subtopics (parent must be in the same course).
CREATE TABLE topics (
  id               TEXT PRIMARY KEY,
  course_id        TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  parent_topic_id  TEXT,
  slug             TEXT NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  sort_order       INTEGER NOT NULL DEFAULT 0,
  status           TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug),
  FOREIGN KEY (course_id, parent_topic_id) REFERENCES topics (course_id, id) ON DELETE CASCADE,
  CHECK (parent_topic_id IS NULL OR parent_topic_id <> id)
);
CREATE INDEX topics_course_order_idx ON topics (course_id, parent_topic_id, sort_order);

-- Lectures (written lessons), ordered within their course.
CREATE TABLE lessons (
  id                TEXT PRIMARY KEY,
  course_id         TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  topic_id          TEXT NOT NULL,
  slug              TEXT NOT NULL,
  title             TEXT NOT NULL,
  description       TEXT NOT NULL DEFAULT '',
  lecture_number    INTEGER,                              -- display order "Lecture 3"
  sort_order        INTEGER NOT NULL DEFAULT 0,
  difficulty        TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  objectives        TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(objectives)),
  prerequisites     TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(prerequisites)),
  reading_minutes   INTEGER NOT NULL DEFAULT 0 CHECK (reading_minutes >= 0),
  status            TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  publish_at        INTEGER,
  published_at      INTEGER,
  is_demo           INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_by        TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_by        TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug),
  FOREIGN KEY (course_id, topic_id) REFERENCES topics (course_id, id),  -- move lectures before deleting a topic
  CHECK (status <> 'scheduled' OR publish_at IS NOT NULL)
);
CREATE INDEX lessons_course_order_idx ON lessons (course_id, status, sort_order);
CREATE INDEX lessons_topic_idx ON lessons (course_id, topic_id, sort_order);

CREATE TABLE lesson_sections (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id      TEXT NOT NULL,
  kind           TEXT NOT NULL CHECK (kind IN ('explanation', 'example', 'code', 'diagram', 'common_mistakes', 'key_takeaways', 'note')),
  title          TEXT NOT NULL DEFAULT '',
  body_md        TEXT NOT NULL DEFAULT '',
  code           TEXT,
  code_language  TEXT CHECK (code_language IS NULL OR code_language IN ('cpp', 'python', 'text', 'pseudocode')),
  image_alt      TEXT,
  sort_order     INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE
);
CREATE INDEX lesson_sections_lesson_idx ON lesson_sections (course_id, lesson_id, sort_order);

-- Related lessons: both ends must be in the same course.
CREATE TABLE lesson_relations (
  course_id          TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id          TEXT NOT NULL,
  related_lesson_id  TEXT NOT NULL,
  sort_order         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_id, related_lesson_id),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, related_lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE,
  CHECK (lesson_id <> related_lesson_id)
);

-- Resources (PowerPoints, PDFs, handouts, images, sample code). Binaries live in R2.
CREATE TABLE resources (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  topic_id        TEXT,
  slug            TEXT NOT NULL,
  title           TEXT NOT NULL,
  description_md  TEXT NOT NULL DEFAULT '',             -- original context shown on the resource page
  kind            TEXT NOT NULL CHECK (kind IN ('presentation', 'pdf', 'handout', 'image', 'code', 'assignment')),
  access          TEXT NOT NULL DEFAULT 'public' CHECK (access IN ('public', 'students', 'staff')),
  downloadable    INTEGER NOT NULL DEFAULT 1 CHECK (downloadable IN (0, 1)),
  sort_order      INTEGER NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_by      TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_by      TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug),
  FOREIGN KEY (course_id, topic_id) REFERENCES topics (course_id, id)
);
CREATE INDEX resources_course_idx ON resources (course_id, status, sort_order);

-- The stored files behind a resource: the original (e.g. .pptx) and an optional preview PDF.
CREATE TABLE resource_files (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  resource_id   TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('original', 'preview')),
  r2_key        TEXT NOT NULL,               -- courses/<course_id>/resources/<resource_id>/<file id>
  filename      TEXT NOT NULL,               -- sanitized display/download name
  content_type  TEXT NOT NULL,
  size_bytes    INTEGER NOT NULL CHECK (size_bytes > 0),
  sha256        TEXT NOT NULL,
  uploaded_by   TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (resource_id, role),
  FOREIGN KEY (course_id, resource_id) REFERENCES resources (course_id, id) ON DELETE CASCADE,
  CHECK (substr(r2_key, 1, length('courses/' || course_id || '/')) = 'courses/' || course_id || '/')
);
CREATE UNIQUE INDEX resource_files_key_uq ON resource_files (r2_key);

CREATE TABLE lesson_resources (
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id    TEXT NOT NULL,
  resource_id  TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (lesson_id, resource_id),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, resource_id) REFERENCES resources (course_id, id) ON DELETE CASCADE
);

-- ======================================================================
-- Question bank (exercises)
-- ======================================================================

CREATE TABLE exercises (
  id                    TEXT PRIMARY KEY,
  course_id             TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  topic_id              TEXT,
  lesson_id             TEXT,
  slug                  TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('mcq', 'write_code', 'trace', 'correct_code')),
  title                 TEXT NOT NULL,
  prompt_md             TEXT NOT NULL,
  code                  TEXT,                 -- snippet / code to trace / broken code / starter code
  code_language         TEXT CHECK (code_language IS NULL OR code_language IN ('cpp', 'python', 'text', 'pseudocode')),
  expected_behavior_md  TEXT NOT NULL DEFAULT '',
  explanation_md        TEXT NOT NULL DEFAULT '',   -- answer explanation: never sent before an answer
  difficulty            TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  grading_mode          TEXT NOT NULL CHECK (grading_mode IN ('auto', 'reference_review', 'runner')),
  settings              TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(settings)),
  points                INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_demo               INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_by            TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_by            TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at            INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at            INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug),
  FOREIGN KEY (course_id, topic_id) REFERENCES topics (course_id, id),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id),
  -- auto grading is only valid for types with a closed answer
  CHECK (grading_mode <> 'auto' OR type IN ('mcq', 'trace')),
  CHECK (type = 'mcq' OR code IS NOT NULL)
);
CREATE INDEX exercises_course_filter_idx ON exercises (course_id, status, type, difficulty);
CREATE INDEX exercises_topic_idx ON exercises (course_id, topic_id);

-- MCQ options. is_correct is part of the answer key: never exposed before an answer.
CREATE TABLE exercise_options (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL,
  label_md     TEXT NOT NULL,
  is_correct   INTEGER NOT NULL DEFAULT 0 CHECK (is_correct IN (0, 1)),
  feedback_md  TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);
CREATE INDEX exercise_options_ex_idx ON exercise_options (course_id, exercise_id, sort_order);

-- Answer keys: trace outputs, reference solutions, accepted alternative solutions.
CREATE TABLE exercise_answers (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL,
  kind         TEXT NOT NULL CHECK (kind IN ('trace_output', 'reference_solution', 'accepted_solution')),
  value        TEXT NOT NULL,
  notes_md     TEXT NOT NULL DEFAULT '',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);
CREATE INDEX exercise_answers_ex_idx ON exercise_answers (course_id, exercise_id);

CREATE TABLE exercise_test_cases (
  id               TEXT PRIMARY KEY,
  course_id        TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id      TEXT NOT NULL,
  name             TEXT NOT NULL DEFAULT '',
  stdin            TEXT NOT NULL DEFAULT '',
  expected_stdout  TEXT NOT NULL,
  compare_mode     TEXT NOT NULL DEFAULT 'exact' CHECK (compare_mode IN ('exact', 'trim_trailing', 'normalize_whitespace')),
  is_hidden        INTEGER NOT NULL DEFAULT 1 CHECK (is_hidden IN (0, 1)),
  timeout_ms       INTEGER NOT NULL DEFAULT 2000 CHECK (timeout_ms BETWEEN 100 AND 10000),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);
CREATE INDEX exercise_test_cases_ex_idx ON exercise_test_cases (course_id, exercise_id, sort_order);

CREATE TABLE exercise_hints (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id  TEXT NOT NULL,
  hint_md      TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);

-- Step-by-step trace table for trace questions (shown after answering).
CREATE TABLE exercise_trace_steps (
  id            TEXT PRIMARY KEY,
  course_id     TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id   TEXT NOT NULL,
  step_no       INTEGER NOT NULL CHECK (step_no > 0),
  line_no       INTEGER,
  explanation   TEXT NOT NULL,
  variables     TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(variables)),
  output        TEXT NOT NULL DEFAULT '',
  UNIQUE (course_id, id),
  UNIQUE (exercise_id, step_no),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);

-- ======================================================================
-- Quizzes and practice exams
-- ======================================================================

CREATE TABLE quizzes (
  id                 TEXT PRIMARY KEY,
  course_id          TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  topic_id           TEXT,
  slug               TEXT NOT NULL,
  title              TEXT NOT NULL,
  description_md     TEXT NOT NULL DEFAULT '',
  mode               TEXT NOT NULL DEFAULT 'practice' CHECK (mode IN ('practice', 'exam')),
  feedback           TEXT NOT NULL DEFAULT 'immediate' CHECK (feedback IN ('immediate', 'after_submit')),
  time_limit_sec     INTEGER CHECK (time_limit_sec IS NULL OR time_limit_sec > 0),
  pass_threshold     INTEGER NOT NULL DEFAULT 60 CHECK (pass_threshold BETWEEN 0 AND 100),
  shuffle_questions  INTEGER NOT NULL DEFAULT 0 CHECK (shuffle_questions IN (0, 1)),
  shuffle_options    INTEGER NOT NULL DEFAULT 0 CHECK (shuffle_options IN (0, 1)),
  max_attempts       INTEGER CHECK (max_attempts IS NULL OR max_attempts > 0),
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
  publish_at         INTEGER,
  is_demo            INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_by         TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_by         TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at         INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug),
  FOREIGN KEY (course_id, topic_id) REFERENCES topics (course_id, id),
  CHECK (mode = 'practice' OR feedback = 'after_submit')
);
CREATE INDEX quizzes_course_idx ON quizzes (course_id, status);

-- A quiz can only contain questions from its own course.
CREATE TABLE quiz_questions (
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  quiz_id      TEXT NOT NULL,
  exercise_id  TEXT NOT NULL,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  points       INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  PRIMARY KEY (quiz_id, exercise_id),
  FOREIGN KEY (course_id, quiz_id) REFERENCES quizzes (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id)  -- remove from quizzes before deleting a question
);
CREATE INDEX quiz_questions_order_idx ON quiz_questions (course_id, quiz_id, sort_order);

-- Practice exams are generated from rules over the course's own question bank.
CREATE TABLE exam_templates (
  id                 TEXT PRIMARY KEY,
  course_id          TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  slug               TEXT NOT NULL,
  title              TEXT NOT NULL,
  description_md     TEXT NOT NULL DEFAULT '',
  scope              TEXT NOT NULL DEFAULT 'course' CHECK (scope IN ('course', 'topic', 'mixed_topics')),
  time_limit_sec     INTEGER NOT NULL CHECK (time_limit_sec > 0),
  pass_threshold     INTEGER NOT NULL DEFAULT 60 CHECK (pass_threshold BETWEEN 0 AND 100),
  shuffle_questions  INTEGER NOT NULL DEFAULT 1 CHECK (shuffle_questions IN (0, 1)),
  status             TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  is_demo            INTEGER NOT NULL DEFAULT 0 CHECK (is_demo IN (0, 1)),
  created_at         INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at         INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug)
);

CREATE TABLE exam_template_rules (
  id                TEXT PRIMARY KEY,
  course_id         TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exam_template_id  TEXT NOT NULL,
  topic_id          TEXT,                 -- NULL = any topic in this course
  type              TEXT CHECK (type IS NULL OR type IN ('mcq', 'write_code', 'trace', 'correct_code')),
  difficulty        TEXT CHECK (difficulty IS NULL OR difficulty IN ('easy', 'medium', 'hard')),
  question_count    INTEGER NOT NULL CHECK (question_count > 0),
  points_each       INTEGER NOT NULL DEFAULT 1 CHECK (points_each > 0),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exam_template_id) REFERENCES exam_templates (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, topic_id) REFERENCES topics (course_id, id) ON DELETE CASCADE
);

-- ======================================================================
-- Student activity (always scoped to one course)
-- ======================================================================

CREATE TABLE quiz_attempts (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  quiz_id         TEXT NOT NULL,
  user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  question_order  TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(question_order)),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deadline_at     INTEGER,
  submitted_at    INTEGER,
  score           INTEGER,
  max_score       INTEGER,
  passed          INTEGER CHECK (passed IS NULL OR passed IN (0, 1)),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, quiz_id) REFERENCES quizzes (course_id, id) ON DELETE CASCADE
);
CREATE INDEX quiz_attempts_user_idx ON quiz_attempts (user_id, course_id, started_at);
CREATE INDEX quiz_attempts_quiz_idx ON quiz_attempts (course_id, quiz_id);

CREATE TABLE quiz_responses (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  attempt_id      TEXT NOT NULL,
  exercise_id     TEXT NOT NULL,
  response        TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(response)),
  is_correct      INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
  points_awarded  INTEGER,
  time_spent_ms   INTEGER CHECK (time_spent_ms IS NULL OR time_spent_ms >= 0),
  answered_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (attempt_id, exercise_id),
  FOREIGN KEY (course_id, attempt_id) REFERENCES quiz_attempts (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);

CREATE TABLE exam_attempts (
  id                TEXT PRIMARY KEY,
  course_id         TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exam_template_id  TEXT NOT NULL,
  user_id           TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  started_at        INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deadline_at       INTEGER NOT NULL,
  submitted_at      INTEGER,
  score             INTEGER,
  max_score         INTEGER,
  passed            INTEGER CHECK (passed IS NULL OR passed IN (0, 1)),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exam_template_id) REFERENCES exam_templates (course_id, id) ON DELETE CASCADE
);
CREATE INDEX exam_attempts_user_idx ON exam_attempts (user_id, course_id, started_at);

-- The questions drawn for one exam attempt, and the student's answers (autosaved).
CREATE TABLE exam_attempt_questions (
  course_id        TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exam_attempt_id  TEXT NOT NULL,
  exercise_id      TEXT NOT NULL,
  position         INTEGER NOT NULL CHECK (position > 0),
  points           INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  response         TEXT CHECK (response IS NULL OR json_valid(response)),
  is_correct       INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
  points_awarded   INTEGER,
  saved_at         INTEGER,
  PRIMARY KEY (exam_attempt_id, exercise_id),
  UNIQUE (exam_attempt_id, position),
  FOREIGN KEY (course_id, exam_attempt_id) REFERENCES exam_attempts (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);

-- Practice answers outside quizzes and exams (history, completion marks, recommendations).
CREATE TABLE exercise_attempts (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id    TEXT NOT NULL,
  user_id        TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  response       TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(response)),
  is_correct     INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
  hints_used     INTEGER NOT NULL DEFAULT 0 CHECK (hints_used >= 0),
  time_spent_ms  INTEGER CHECK (time_spent_ms IS NULL OR time_spent_ms >= 0),
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);
CREATE INDEX exercise_attempts_user_idx ON exercise_attempts (user_id, course_id, created_at);
CREATE INDEX exercise_attempts_ex_idx ON exercise_attempts (course_id, exercise_id, is_correct);

-- Saved code drafts and submissions for write/correct-the-code questions.
CREATE TABLE code_submissions (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  exercise_id    TEXT NOT NULL,
  user_id        TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  language       TEXT NOT NULL CHECK (language IN ('cpp', 'python')),
  source         TEXT NOT NULL CHECK (length(source) <= 65536),
  status         TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'queued', 'running', 'passed', 'failed', 'error', 'needs_review', 'self_reviewed')),
  runner_result  TEXT CHECK (runner_result IS NULL OR json_valid(runner_result)),
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  updated_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);
CREATE INDEX code_submissions_user_idx ON code_submissions (user_id, course_id, exercise_id, updated_at);

-- Lecture progress per student, per course.
CREATE TABLE student_progress (
  user_id       TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id     TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id     TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'started' CHECK (status IN ('started', 'completed')),
  completed_at  INTEGER,
  updated_at    INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (user_id, lesson_id),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE,
  CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);
CREATE INDEX student_progress_course_idx ON student_progress (user_id, course_id);

-- Bookmarks: exactly one target, always in the bookmark's course.
CREATE TABLE bookmarks (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  lesson_id    TEXT,
  exercise_id  TEXT,
  resource_id  TEXT,
  quiz_id      TEXT,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  FOREIGN KEY (course_id, lesson_id) REFERENCES lessons (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, resource_id) REFERENCES resources (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, quiz_id) REFERENCES quizzes (course_id, id) ON DELETE CASCADE,
  CHECK ((lesson_id IS NOT NULL) + (exercise_id IS NOT NULL) + (resource_id IS NOT NULL) + (quiz_id IS NOT NULL) = 1)
);
CREATE UNIQUE INDEX bookmarks_target_uq ON bookmarks (user_id, coalesce(lesson_id, ''), coalesce(exercise_id, ''), coalesce(resource_id, ''), coalesce(quiz_id, ''));
CREATE INDEX bookmarks_user_course_idx ON bookmarks (user_id, course_id, created_at);

-- Achievements are defined per course and earned per course.
CREATE TABLE achievements (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT NOT NULL DEFAULT '',
  criteria     TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(criteria)),
  status       TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (course_id, id),
  UNIQUE (course_id, slug)
);

CREATE TABLE student_achievements (
  user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  achievement_id  TEXT NOT NULL,
  awarded_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (course_id, achievement_id) REFERENCES achievements (course_id, id) ON DELETE CASCADE
);

-- ======================================================================
-- Content operations
-- ======================================================================

CREATE TABLE content_revisions (
  id           TEXT PRIMARY KEY,
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('course', 'topic', 'lesson', 'resource', 'exercise', 'quiz', 'exam_template')),
  entity_id    TEXT NOT NULL,
  revision_no  INTEGER NOT NULL CHECK (revision_no > 0),
  snapshot     TEXT NOT NULL CHECK (json_valid(snapshot)),
  author_id    TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  UNIQUE (entity_type, entity_id, revision_no)
);
CREATE INDEX content_revisions_course_idx ON content_revisions (course_id, entity_type, entity_id);

-- SEO overrides per path. Course pages carry their course_id; site pages have NULL.
CREATE TABLE seo_metadata (
  id               TEXT PRIMARY KEY,
  course_id        TEXT REFERENCES courses (id) ON DELETE CASCADE,
  path             TEXT NOT NULL,
  title            TEXT,
  description      TEXT,
  canonical_url    TEXT,
  og_image_key     TEXT,
  noindex          INTEGER NOT NULL DEFAULT 0 CHECK (noindex IN (0, 1)),
  structured_data  TEXT CHECK (structured_data IS NULL OR json_valid(structured_data)),
  updated_by       TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at       INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK (substr(path, 1, 1) = '/')
);
CREATE UNIQUE INDEX seo_metadata_path_uq ON seo_metadata (path);

-- Per-course search index (FTS5). Every query must filter on course_id.
CREATE VIRTUAL TABLE search_index USING fts5 (
  course_id UNINDEXED,
  entity_type UNINDEXED,
  entity_id UNINDEXED,
  url UNINDEXED,
  title,
  body,
  tokenize = 'porter unicode61'
);

CREATE TABLE search_queries (
  id             TEXT PRIMARY KEY,
  course_id      TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  query          TEXT NOT NULL CHECK (length(query) <= 200),
  results_count  INTEGER NOT NULL DEFAULT 0,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX search_queries_course_idx ON search_queries (course_id, created_at);

-- Aggregated first-party content statistics (no personal data).
CREATE TABLE content_daily_stats (
  course_id    TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  entity_type  TEXT NOT NULL CHECK (entity_type IN ('course', 'lesson', 'exercise', 'quiz', 'resource', 'exam_template')),
  entity_id    TEXT NOT NULL,
  day          TEXT NOT NULL CHECK (day GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]'),
  views        INTEGER NOT NULL DEFAULT 0,
  completions  INTEGER NOT NULL DEFAULT 0,
  downloads    INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (course_id, entity_type, entity_id, day)
);

-- ======================================================================
-- Site settings, advertising, consent, audit
-- ======================================================================

CREATE TABLE site_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL CHECK (json_valid(value)),
  updated_by  TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

-- Named ad placements. Disabled by default; an ad unit id is entered by the
-- administrator from the real AdSense account and is never generated.
CREATE TABLE ad_placements (
  id              TEXT PRIMARY KEY,
  placement_key   TEXT NOT NULL,             -- e.g. 'lesson.after_first_section'
  page_type       TEXT NOT NULL CHECK (page_type IN ('home', 'course_list', 'course', 'lesson', 'exercise_list', 'resource', 'review')),
  description     TEXT NOT NULL DEFAULT '',
  ad_unit_id      TEXT,
  format          TEXT NOT NULL DEFAULT 'auto' CHECK (format IN ('auto', 'fluid', 'rectangle', 'horizontal', 'vertical')),
  min_height_px   INTEGER NOT NULL DEFAULT 250 CHECK (min_height_px BETWEEN 50 AND 1000),
  enabled         INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_by      TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK (enabled = 0 OR ad_unit_id IS NOT NULL)
);
CREATE UNIQUE INDEX ad_placements_key_uq ON ad_placements (placement_key);

-- Paths or whole courses where no ads may render (assessments, accounts, admin are always excluded in code).
CREATE TABLE ad_exclusions (
  id          TEXT PRIMARY KEY,
  path_glob   TEXT,
  course_id   TEXT REFERENCES courses (id) ON DELETE CASCADE,
  reason      TEXT NOT NULL DEFAULT '',
  created_by  TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK ((path_glob IS NOT NULL) + (course_id IS NOT NULL) = 1)
);

CREATE TABLE consent_configuration (
  id                     TEXT PRIMARY KEY CHECK (id = 'default'),
  cmp_provider           TEXT NOT NULL DEFAULT 'none' CHECK (cmp_provider IN ('none', 'google_privacy_messaging', 'certified_third_party')),
  cmp_settings           TEXT NOT NULL DEFAULT '{}' CHECK (json_valid(cmp_settings)),
  regulated_regions      TEXT NOT NULL DEFAULT '["EEA","UK","CH"]' CHECK (json_valid(regulated_regions)),
  analytics_default      TEXT NOT NULL DEFAULT 'denied' CHECK (analytics_default IN ('denied', 'granted')),
  ads_default            TEXT NOT NULL DEFAULT 'denied' CHECK (ads_default IN ('denied', 'granted')),
  privacy_choices_link   INTEGER NOT NULL DEFAULT 1 CHECK (privacy_choices_link IN (0, 1)),
  updated_by             TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at             INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
INSERT INTO consent_configuration (id) VALUES ('default');

CREATE TABLE admin_audit_logs (
  id             TEXT PRIMARY KEY,
  actor_user_id  TEXT REFERENCES users (id) ON DELETE SET NULL,
  course_id      TEXT REFERENCES courses (id) ON DELETE SET NULL,
  action         TEXT NOT NULL,              -- e.g. 'lesson.publish', 'resource.upload'
  entity_type    TEXT NOT NULL,
  entity_id      TEXT,
  before_state   TEXT CHECK (before_state IS NULL OR json_valid(before_state)),
  after_state    TEXT CHECK (after_state IS NULL OR json_valid(after_state)),
  ip_address     TEXT,
  created_at     INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX admin_audit_logs_time_idx ON admin_audit_logs (created_at);
CREATE INDEX admin_audit_logs_course_idx ON admin_audit_logs (course_id, created_at);

CREATE TABLE contact_messages (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 120),
  email       TEXT NOT NULL CHECK (length(email) BETWEEN 3 AND 254),
  subject     TEXT NOT NULL CHECK (length(subject) BETWEEN 1 AND 200),
  body        TEXT NOT NULL CHECK (length(body) BETWEEN 1 AND 5000),
  status      TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'archived')),
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);

CREATE TABLE app_error_logs (
  id          TEXT PRIMARY KEY,
  level       TEXT NOT NULL CHECK (level IN ('error', 'warn')),
  message     TEXT NOT NULL CHECK (length(message) <= 2000),
  path        TEXT,
  request_id  TEXT,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
);
CREATE INDEX app_error_logs_time_idx ON app_error_logs (created_at);

-- ======================================================================
-- Unlink optional references when a topic or lecture is deleted
-- (composite keys cannot use ON DELETE SET NULL without nulling course_id)
-- ======================================================================

CREATE TRIGGER topics_unlink_before_delete BEFORE DELETE ON topics
BEGIN
  UPDATE exercises SET topic_id = NULL WHERE course_id = OLD.course_id AND topic_id = OLD.id;
  UPDATE resources SET topic_id = NULL WHERE course_id = OLD.course_id AND topic_id = OLD.id;
  UPDATE quizzes   SET topic_id = NULL WHERE course_id = OLD.course_id AND topic_id = OLD.id;
END;

CREATE TRIGGER lessons_unlink_before_delete BEFORE DELETE ON lessons
BEGIN
  UPDATE exercises SET lesson_id = NULL WHERE course_id = OLD.course_id AND lesson_id = OLD.id;
END;
