-- 0005: student accounts (Phase 5). 0001-0004 are never edited.
--
-- Most of what students need already exists since 0001: users, sessions,
-- accounts, verifications, quiz_attempts / quiz_responses, exam_attempts /
-- exam_attempt_questions, exercise_attempts, code_submissions,
-- student_progress, bookmarks, achievements and student_achievements.
-- This file adds the two pieces that were missing.

-- 1. How long a session may sit unused before it ends. NULL is the staff rule
--    (12 hours, src/lib/auth/session-token.ts). Student sessions set a longer
--    one, so a student isn't signed out every day; the admin refuses them.
ALTER TABLE sessions ADD COLUMN idle_ms INTEGER CHECK (idle_ms IS NULL OR idle_ms > 0);

-- 2. "Build your own exam" attempts. A custom exam has no exam template (the
--    student chose the topics), so it can't go in exam_attempts, whose
--    exam_template_id is required. Same shape otherwise, same course rules.
CREATE TABLE custom_exam_attempts (
  id              TEXT PRIMARY KEY,
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  user_id         TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  title           TEXT NOT NULL CHECK (length(title) BETWEEN 1 AND 300),
  feedback        TEXT NOT NULL CHECK (feedback IN ('immediate', 'after_submit')),
  pass_threshold  INTEGER NOT NULL CHECK (pass_threshold BETWEEN 0 AND 100),
  status          TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'expired')),
  started_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  deadline_at     INTEGER,
  submitted_at    INTEGER,
  score           INTEGER,
  max_score       INTEGER,
  passed          INTEGER CHECK (passed IS NULL OR passed IN (0, 1)),
  UNIQUE (course_id, id)
);
CREATE INDEX custom_exam_attempts_user_idx ON custom_exam_attempts (user_id, course_id, started_at);

CREATE TABLE custom_exam_questions (
  course_id       TEXT NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
  attempt_id      TEXT NOT NULL,
  exercise_id     TEXT NOT NULL,
  position        INTEGER NOT NULL CHECK (position > 0),
  points          INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  response        TEXT CHECK (response IS NULL OR json_valid(response)),
  is_correct      INTEGER CHECK (is_correct IS NULL OR is_correct IN (0, 1)),
  points_awarded  INTEGER,
  PRIMARY KEY (attempt_id, exercise_id),
  UNIQUE (attempt_id, position),
  FOREIGN KEY (course_id, attempt_id) REFERENCES custom_exam_attempts (course_id, id) ON DELETE CASCADE,
  FOREIGN KEY (course_id, exercise_id) REFERENCES exercises (course_id, id) ON DELETE CASCADE
);

-- Per-question lookups for a student's answers (solved marks, mistakes, topic
-- performance) and for the admin's "hardest questions".
CREATE INDEX quiz_responses_exercise_idx ON quiz_responses (course_id, exercise_id, is_correct);
CREATE INDEX exam_attempt_questions_exercise_idx ON exam_attempt_questions (course_id, exercise_id, is_correct);
CREATE INDEX custom_exam_questions_exercise_idx ON custom_exam_questions (course_id, exercise_id, is_correct);
CREATE INDEX quiz_attempts_user_quiz_idx ON quiz_attempts (user_id, quiz_id, started_at);
