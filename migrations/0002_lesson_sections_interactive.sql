-- 0002: fields for lessons taught in full on the site (Phase 2, owner requirement 2026-10-08).
-- Columns only; 0001 is never edited. CHECKs here run on every insert and update.

-- A code section can offer a "Run" button. Code runs in the student's browser (Pyodide),
-- never in Workers, so only Python sections can be runnable.
ALTER TABLE lesson_sections ADD COLUMN runnable INTEGER NOT NULL DEFAULT 0
  CHECK (runnable IN (0, 1) AND (runnable = 0 OR (code IS NOT NULL AND code_language = 'python')));

-- Text fed to input() / cin, shown in an INPUT box and pre-filled in the runner.
ALTER TABLE lesson_sections ADD COLUMN sample_input TEXT NOT NULL DEFAULT ''
  CHECK (length(sample_input) <= 4000);

-- The exact output of `code` with `sample_input`, checked by tools/check-lesson-code.ts.
ALTER TABLE lesson_sections ADD COLUMN expected_output TEXT
  CHECK (expected_output IS NULL OR (code IS NOT NULL AND length(expected_output) <= 20000));

-- Lec-style notes for the code: chips joined to an exact part of a line, and strips of
-- index boxes under a String or List. JSON, validated by the app (src/lib/lesson/annotations.ts).
ALTER TABLE lesson_sections ADD COLUMN annotations TEXT
  CHECK (annotations IS NULL OR (json_valid(annotations) AND code IS NOT NULL));

-- Lesson images live in R2 under courses/<course_id>/lessons/. Width and height are stored
-- so the page reserves space (no layout shift), and every image needs alt text.
ALTER TABLE lesson_sections ADD COLUMN image_width INTEGER CHECK (image_width IS NULL OR image_width > 0);
ALTER TABLE lesson_sections ADD COLUMN image_height INTEGER CHECK (image_height IS NULL OR image_height > 0);
ALTER TABLE lesson_sections ADD COLUMN image_key TEXT
  CHECK (
    image_key IS NULL OR (
      substr(image_key, 1, length('courses/' || course_id || '/lessons/')) = 'courses/' || course_id || '/lessons/'
      AND image_alt IS NOT NULL AND length(trim(image_alt)) > 0
      AND image_width IS NOT NULL AND image_height IS NOT NULL
    )
  );
CREATE UNIQUE INDEX lesson_sections_image_key_uq ON lesson_sections (image_key) WHERE image_key IS NOT NULL;
