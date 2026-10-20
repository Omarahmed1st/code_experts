-- 0006: Phase 5.1 audit fixes. 0001-0005 are never edited.

-- 1. Browser self-checks are kept apart from server marks.
--
-- Write-the-code programs (and correct-the-code fixes that don't match a known
-- fix) are tested in the student's own browser. The browser reports how many
-- tests passed, and a browser can report anything, so that result is not a
-- mark. Until Phase 9 adds a server-side runner, exercise_attempts.is_correct
-- holds only marks the server worked out itself (MCQ, trace, a fix that
-- matches a known fix); self_check holds what the browser said.
-- Dashboards, achievements, accuracy and the admin's analytics count is_correct only.
ALTER TABLE exercise_attempts ADD COLUMN self_check TEXT CHECK (self_check IS NULL OR self_check IN ('passed', 'failed'));

-- Write-the-code answers saved before this migration had the browser's result
-- in is_correct (the server never marks them). Move it to self_check.
-- (Correct-the-code rows can't be told apart in SQL, so they keep their mark.)
UPDATE exercise_attempts
   SET self_check = CASE is_correct WHEN 1 THEN 'passed' ELSE 'failed' END,
       is_correct = NULL
 WHERE is_correct IS NOT NULL
   AND exercise_id IN (SELECT id FROM exercises WHERE type = 'write_code');

-- 2. Text primary keys can't be NULL.
--
-- SQLite only implies NOT NULL for INTEGER PRIMARY KEY, so `id TEXT PRIMARY KEY`
-- accepts NULL. The application always makes its own ids (src/lib/ids.ts,
-- the content build), so no code path inserts NULL; these triggers make the
-- database refuse it too, without rebuilding any table.

CREATE TRIGGER accounts_id_not_null_insert BEFORE INSERT ON accounts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'accounts.id may not be NULL'); END;
CREATE TRIGGER accounts_id_not_null_update BEFORE UPDATE OF id ON accounts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'accounts.id may not be NULL'); END;
CREATE TRIGGER achievements_id_not_null_insert BEFORE INSERT ON achievements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'achievements.id may not be NULL'); END;
CREATE TRIGGER achievements_id_not_null_update BEFORE UPDATE OF id ON achievements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'achievements.id may not be NULL'); END;
CREATE TRIGGER ad_exclusions_id_not_null_insert BEFORE INSERT ON ad_exclusions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_exclusions.id may not be NULL'); END;
CREATE TRIGGER ad_exclusions_id_not_null_update BEFORE UPDATE OF id ON ad_exclusions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_exclusions.id may not be NULL'); END;
CREATE TRIGGER ad_placements_id_not_null_insert BEFORE INSERT ON ad_placements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_placements.id may not be NULL'); END;
CREATE TRIGGER ad_placements_id_not_null_update BEFORE UPDATE OF id ON ad_placements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_placements.id may not be NULL'); END;
CREATE TRIGGER admin_audit_logs_id_not_null_insert BEFORE INSERT ON admin_audit_logs WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'admin_audit_logs.id may not be NULL'); END;
CREATE TRIGGER admin_audit_logs_id_not_null_update BEFORE UPDATE OF id ON admin_audit_logs WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'admin_audit_logs.id may not be NULL'); END;
CREATE TRIGGER app_error_logs_id_not_null_insert BEFORE INSERT ON app_error_logs WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'app_error_logs.id may not be NULL'); END;
CREATE TRIGGER app_error_logs_id_not_null_update BEFORE UPDATE OF id ON app_error_logs WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'app_error_logs.id may not be NULL'); END;
CREATE TRIGGER bookmarks_id_not_null_insert BEFORE INSERT ON bookmarks WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'bookmarks.id may not be NULL'); END;
CREATE TRIGGER bookmarks_id_not_null_update BEFORE UPDATE OF id ON bookmarks WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'bookmarks.id may not be NULL'); END;
CREATE TRIGGER code_submissions_id_not_null_insert BEFORE INSERT ON code_submissions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'code_submissions.id may not be NULL'); END;
CREATE TRIGGER code_submissions_id_not_null_update BEFORE UPDATE OF id ON code_submissions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'code_submissions.id may not be NULL'); END;
CREATE TRIGGER consent_configuration_id_not_null_insert BEFORE INSERT ON consent_configuration WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'consent_configuration.id may not be NULL'); END;
CREATE TRIGGER consent_configuration_id_not_null_update BEFORE UPDATE OF id ON consent_configuration WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'consent_configuration.id may not be NULL'); END;
CREATE TRIGGER contact_messages_id_not_null_insert BEFORE INSERT ON contact_messages WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'contact_messages.id may not be NULL'); END;
CREATE TRIGGER contact_messages_id_not_null_update BEFORE UPDATE OF id ON contact_messages WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'contact_messages.id may not be NULL'); END;
CREATE TRIGGER content_revisions_id_not_null_insert BEFORE INSERT ON content_revisions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'content_revisions.id may not be NULL'); END;
CREATE TRIGGER content_revisions_id_not_null_update BEFORE UPDATE OF id ON content_revisions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'content_revisions.id may not be NULL'); END;
CREATE TRIGGER courses_id_not_null_insert BEFORE INSERT ON courses WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'courses.id may not be NULL'); END;
CREATE TRIGGER courses_id_not_null_update BEFORE UPDATE OF id ON courses WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'courses.id may not be NULL'); END;
CREATE TRIGGER custom_exam_attempts_id_not_null_insert BEFORE INSERT ON custom_exam_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'custom_exam_attempts.id may not be NULL'); END;
CREATE TRIGGER custom_exam_attempts_id_not_null_update BEFORE UPDATE OF id ON custom_exam_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'custom_exam_attempts.id may not be NULL'); END;
CREATE TRIGGER exam_attempts_id_not_null_insert BEFORE INSERT ON exam_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_attempts.id may not be NULL'); END;
CREATE TRIGGER exam_attempts_id_not_null_update BEFORE UPDATE OF id ON exam_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_attempts.id may not be NULL'); END;
CREATE TRIGGER exam_template_rules_id_not_null_insert BEFORE INSERT ON exam_template_rules WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_template_rules.id may not be NULL'); END;
CREATE TRIGGER exam_template_rules_id_not_null_update BEFORE UPDATE OF id ON exam_template_rules WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_template_rules.id may not be NULL'); END;
CREATE TRIGGER exam_templates_id_not_null_insert BEFORE INSERT ON exam_templates WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_templates.id may not be NULL'); END;
CREATE TRIGGER exam_templates_id_not_null_update BEFORE UPDATE OF id ON exam_templates WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exam_templates.id may not be NULL'); END;
CREATE TRIGGER exercise_answers_id_not_null_insert BEFORE INSERT ON exercise_answers WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_answers.id may not be NULL'); END;
CREATE TRIGGER exercise_answers_id_not_null_update BEFORE UPDATE OF id ON exercise_answers WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_answers.id may not be NULL'); END;
CREATE TRIGGER exercise_attempts_id_not_null_insert BEFORE INSERT ON exercise_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_attempts.id may not be NULL'); END;
CREATE TRIGGER exercise_attempts_id_not_null_update BEFORE UPDATE OF id ON exercise_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_attempts.id may not be NULL'); END;
CREATE TRIGGER exercise_hints_id_not_null_insert BEFORE INSERT ON exercise_hints WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_hints.id may not be NULL'); END;
CREATE TRIGGER exercise_hints_id_not_null_update BEFORE UPDATE OF id ON exercise_hints WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_hints.id may not be NULL'); END;
CREATE TRIGGER exercise_options_id_not_null_insert BEFORE INSERT ON exercise_options WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_options.id may not be NULL'); END;
CREATE TRIGGER exercise_options_id_not_null_update BEFORE UPDATE OF id ON exercise_options WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_options.id may not be NULL'); END;
CREATE TRIGGER exercise_test_cases_id_not_null_insert BEFORE INSERT ON exercise_test_cases WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_test_cases.id may not be NULL'); END;
CREATE TRIGGER exercise_test_cases_id_not_null_update BEFORE UPDATE OF id ON exercise_test_cases WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_test_cases.id may not be NULL'); END;
CREATE TRIGGER exercise_trace_steps_id_not_null_insert BEFORE INSERT ON exercise_trace_steps WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_trace_steps.id may not be NULL'); END;
CREATE TRIGGER exercise_trace_steps_id_not_null_update BEFORE UPDATE OF id ON exercise_trace_steps WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercise_trace_steps.id may not be NULL'); END;
CREATE TRIGGER exercises_id_not_null_insert BEFORE INSERT ON exercises WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercises.id may not be NULL'); END;
CREATE TRIGGER exercises_id_not_null_update BEFORE UPDATE OF id ON exercises WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'exercises.id may not be NULL'); END;
CREATE TRIGGER lesson_sections_id_not_null_insert BEFORE INSERT ON lesson_sections WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'lesson_sections.id may not be NULL'); END;
CREATE TRIGGER lesson_sections_id_not_null_update BEFORE UPDATE OF id ON lesson_sections WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'lesson_sections.id may not be NULL'); END;
CREATE TRIGGER lessons_id_not_null_insert BEFORE INSERT ON lessons WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'lessons.id may not be NULL'); END;
CREATE TRIGGER lessons_id_not_null_update BEFORE UPDATE OF id ON lessons WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'lessons.id may not be NULL'); END;
CREATE TRIGGER quiz_attempts_id_not_null_insert BEFORE INSERT ON quiz_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quiz_attempts.id may not be NULL'); END;
CREATE TRIGGER quiz_attempts_id_not_null_update BEFORE UPDATE OF id ON quiz_attempts WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quiz_attempts.id may not be NULL'); END;
CREATE TRIGGER quiz_responses_id_not_null_insert BEFORE INSERT ON quiz_responses WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quiz_responses.id may not be NULL'); END;
CREATE TRIGGER quiz_responses_id_not_null_update BEFORE UPDATE OF id ON quiz_responses WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quiz_responses.id may not be NULL'); END;
CREATE TRIGGER quizzes_id_not_null_insert BEFORE INSERT ON quizzes WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quizzes.id may not be NULL'); END;
CREATE TRIGGER quizzes_id_not_null_update BEFORE UPDATE OF id ON quizzes WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'quizzes.id may not be NULL'); END;
CREATE TRIGGER resource_files_id_not_null_insert BEFORE INSERT ON resource_files WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'resource_files.id may not be NULL'); END;
CREATE TRIGGER resource_files_id_not_null_update BEFORE UPDATE OF id ON resource_files WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'resource_files.id may not be NULL'); END;
CREATE TRIGGER resources_id_not_null_insert BEFORE INSERT ON resources WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'resources.id may not be NULL'); END;
CREATE TRIGGER resources_id_not_null_update BEFORE UPDATE OF id ON resources WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'resources.id may not be NULL'); END;
CREATE TRIGGER roles_id_not_null_insert BEFORE INSERT ON roles WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'roles.id may not be NULL'); END;
CREATE TRIGGER roles_id_not_null_update BEFORE UPDATE OF id ON roles WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'roles.id may not be NULL'); END;
CREATE TRIGGER search_queries_id_not_null_insert BEFORE INSERT ON search_queries WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'search_queries.id may not be NULL'); END;
CREATE TRIGGER search_queries_id_not_null_update BEFORE UPDATE OF id ON search_queries WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'search_queries.id may not be NULL'); END;
CREATE TRIGGER seo_metadata_id_not_null_insert BEFORE INSERT ON seo_metadata WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'seo_metadata.id may not be NULL'); END;
CREATE TRIGGER seo_metadata_id_not_null_update BEFORE UPDATE OF id ON seo_metadata WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'seo_metadata.id may not be NULL'); END;
CREATE TRIGGER sessions_id_not_null_insert BEFORE INSERT ON sessions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'sessions.id may not be NULL'); END;
CREATE TRIGGER sessions_id_not_null_update BEFORE UPDATE OF id ON sessions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'sessions.id may not be NULL'); END;
CREATE TRIGGER topics_id_not_null_insert BEFORE INSERT ON topics WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'topics.id may not be NULL'); END;
CREATE TRIGGER topics_id_not_null_update BEFORE UPDATE OF id ON topics WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'topics.id may not be NULL'); END;
CREATE TRIGGER users_id_not_null_insert BEFORE INSERT ON users WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'users.id may not be NULL'); END;
CREATE TRIGGER users_id_not_null_update BEFORE UPDATE OF id ON users WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'users.id may not be NULL'); END;
CREATE TRIGGER verifications_id_not_null_insert BEFORE INSERT ON verifications WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'verifications.id may not be NULL'); END;
CREATE TRIGGER verifications_id_not_null_update BEFORE UPDATE OF id ON verifications WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'verifications.id may not be NULL'); END;
CREATE TRIGGER rate_limits_key_not_null_insert BEFORE INSERT ON rate_limits WHEN NEW.key IS NULL
  BEGIN SELECT RAISE(ABORT, 'rate_limits.key may not be NULL'); END;
CREATE TRIGGER rate_limits_key_not_null_update BEFORE UPDATE OF key ON rate_limits WHEN NEW.key IS NULL
  BEGIN SELECT RAISE(ABORT, 'rate_limits.key may not be NULL'); END;
CREATE TRIGGER site_settings_key_not_null_insert BEFORE INSERT ON site_settings WHEN NEW.key IS NULL
  BEGIN SELECT RAISE(ABORT, 'site_settings.key may not be NULL'); END;
CREATE TRIGGER site_settings_key_not_null_update BEFORE UPDATE OF key ON site_settings WHEN NEW.key IS NULL
  BEGIN SELECT RAISE(ABORT, 'site_settings.key may not be NULL'); END;
