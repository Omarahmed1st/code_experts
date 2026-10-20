-- 0007: Phase 6 (advertising and consent readiness). 0001-0006 are never edited.
--
-- ad_placements and ad_exclusions were created in 0001 for this phase and no
-- code has written to them until now. Their CHECK constraints are too narrow for
-- the Phase 6 design, and SQLite can't change a CHECK in place, so both tables
-- are rebuilt here: create the new shape, copy every existing row, drop the old
-- table, rename. No row is lost: values that would break a new rule are kept
-- in a safe form (an invalid ad unit id becomes NULL and the placement is
-- switched off, which the old rules also allowed).
--
-- What changes:
--   ad_placements: two more page types ('topic' and 'exercise', a single
--     question page); ad unit ids may only be digits (AdSense data-ad-slot
--     values), so an id can never carry markup or script; per-placement
--     "responsive" and "devices" settings; created_at.
--   ad_exclusions: an exclusion can also be a whole page type, and says which
--     kind it is; a path pattern must start with "/".
--
-- Global switches (ads on or off, publisher id, hide ads from staff) live in
-- site_settings under the key 'ads', and the consent platform in
-- consent_configuration (unchanged). Ads are still off until the owner turns
-- them on: see docs/PHASE_6_OWNER_ACTIONS.md.

PRAGMA defer_foreign_keys = on;

CREATE TABLE ad_placements_new (
  id              TEXT PRIMARY KEY,
  placement_key   TEXT NOT NULL,             -- '<page_type>.<position>', e.g. 'lesson.after_first_section'
  page_type       TEXT NOT NULL CHECK (page_type IN ('home', 'course_list', 'course', 'topic', 'lesson', 'exercise_list', 'exercise', 'resource', 'review')),
  description     TEXT NOT NULL DEFAULT '' CHECK (length(description) <= 300),
  ad_unit_id      TEXT CHECK (ad_unit_id IS NULL OR (length(ad_unit_id) BETWEEN 6 AND 20 AND ad_unit_id NOT GLOB '*[^0-9]*')),
  format          TEXT NOT NULL DEFAULT 'auto' CHECK (format IN ('auto', 'fluid', 'rectangle', 'horizontal', 'vertical')),
  responsive      INTEGER NOT NULL DEFAULT 1 CHECK (responsive IN (0, 1)),
  devices         TEXT NOT NULL DEFAULT 'all' CHECK (devices IN ('all', 'desktop', 'mobile')),
  min_height_px   INTEGER NOT NULL DEFAULT 250 CHECK (min_height_px BETWEEN 50 AND 1000),
  enabled         INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  updated_by      TEXT REFERENCES users (id) ON DELETE SET NULL,
  updated_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  created_at      INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK (enabled = 0 OR ad_unit_id IS NOT NULL)
);

INSERT INTO ad_placements_new (id, placement_key, page_type, description, ad_unit_id, format, min_height_px, enabled, updated_by, updated_at, created_at)
SELECT id, placement_key, page_type, substr(description, 1, 300),
       CASE WHEN ad_unit_id IS NOT NULL AND length(ad_unit_id) BETWEEN 6 AND 20 AND ad_unit_id NOT GLOB '*[^0-9]*' THEN ad_unit_id END,
       format, min_height_px,
       CASE WHEN ad_unit_id IS NOT NULL AND length(ad_unit_id) BETWEEN 6 AND 20 AND ad_unit_id NOT GLOB '*[^0-9]*' THEN enabled ELSE 0 END,
       updated_by, updated_at, updated_at
  FROM ad_placements;

DROP TABLE ad_placements;
ALTER TABLE ad_placements_new RENAME TO ad_placements;
CREATE UNIQUE INDEX ad_placements_key_uq ON ad_placements (placement_key);
CREATE TRIGGER ad_placements_id_not_null_insert BEFORE INSERT ON ad_placements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_placements.id may not be NULL'); END;
CREATE TRIGGER ad_placements_id_not_null_update BEFORE UPDATE OF id ON ad_placements WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_placements.id may not be NULL'); END;

CREATE TABLE ad_exclusions_new (
  id          TEXT PRIMARY KEY,
  kind        TEXT NOT NULL CHECK (kind IN ('path', 'course', 'page_type')),
  path_glob   TEXT CHECK (path_glob IS NULL OR (substr(path_glob, 1, 1) = '/' AND length(path_glob) <= 200)),
  course_id   TEXT REFERENCES courses (id) ON DELETE CASCADE,
  page_type   TEXT CHECK (page_type IS NULL OR page_type IN ('home', 'course_list', 'course', 'topic', 'lesson', 'exercise_list', 'exercise', 'resource', 'review')),
  reason      TEXT NOT NULL DEFAULT '' CHECK (length(reason) <= 300),
  created_by  TEXT REFERENCES users (id) ON DELETE SET NULL,
  created_at  INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
  CHECK ((kind = 'path') = (path_glob IS NOT NULL)
     AND (kind = 'course') = (course_id IS NOT NULL)
     AND (kind = 'page_type') = (page_type IS NOT NULL))
);

-- Old rows were either a path pattern or a course (0001's CHECK). A path that
-- doesn't start with "/" gets one, so the row survives the new rule.
INSERT INTO ad_exclusions_new (id, kind, path_glob, course_id, reason, created_by, created_at)
SELECT id,
       CASE WHEN course_id IS NOT NULL THEN 'course' ELSE 'path' END,
       CASE WHEN path_glob IS NULL THEN NULL WHEN substr(path_glob, 1, 1) = '/' THEN substr(path_glob, 1, 200) ELSE substr('/' || path_glob, 1, 200) END,
       course_id, substr(reason, 1, 300), created_by, created_at
  FROM ad_exclusions;

DROP TABLE ad_exclusions;
ALTER TABLE ad_exclusions_new RENAME TO ad_exclusions;
CREATE INDEX ad_exclusions_course_idx ON ad_exclusions (course_id);
CREATE TRIGGER ad_exclusions_id_not_null_insert BEFORE INSERT ON ad_exclusions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_exclusions.id may not be NULL'); END;
CREATE TRIGGER ad_exclusions_id_not_null_update BEFORE UPDATE OF id ON ad_exclusions WHEN NEW.id IS NULL
  BEGIN SELECT RAISE(ABORT, 'ad_exclusions.id may not be NULL'); END;
