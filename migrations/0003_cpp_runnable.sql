-- 0003: C++ programs can have a Run button too (owner request 2026-10-09). They are
-- compiled and run in the student's browser (WebAssembly), never in Workers, like Python.
-- 0001 and 0002 are never edited. SQLite can't change a CHECK in place, so the column is
-- dropped and added again with the wider rule, keeping every section's current value.
CREATE TABLE _runnable_keep AS SELECT id FROM lesson_sections WHERE runnable = 1;
ALTER TABLE lesson_sections DROP COLUMN runnable;
ALTER TABLE lesson_sections ADD COLUMN runnable INTEGER NOT NULL DEFAULT 0
  CHECK (runnable IN (0, 1) AND (runnable = 0 OR (code IS NOT NULL AND code_language IN ('python', 'cpp'))));
UPDATE lesson_sections SET runnable = 1 WHERE id IN (SELECT id FROM _runnable_keep);
DROP TABLE _runnable_keep;
