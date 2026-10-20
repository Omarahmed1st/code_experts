// Migration 0007 rebuilds ad_placements and ad_exclusions. Rows written under
// the 0001 rules must survive it, in a form the new rules accept.
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { describe, expect, it } from "vitest";
import { errorOf } from "./db-helpers";

describe("0007_phase6_ads_consent", () => {
  it("keeps every old row, makes unsafe values safe, and applies the new rules", async () => {
    const before = env.TEST_MIGRATIONS.filter((m) => !m.name.startsWith("0007"));
    expect(before).toHaveLength(env.TEST_MIGRATIONS.length - 1);
    await applyD1Migrations(env.DB, before);

    const db = env.DB;
    await db.batch([
      db.prepare("INSERT INTO courses (id, slug, title, short_title, primary_language, status) VALUES ('c1', 'c1', 'C1', 'C1', 'cpp', 'published')"),
      db.prepare("INSERT INTO ad_placements (id, placement_key, page_type, ad_unit_id, enabled) VALUES ('p_ok', 'lesson.end', 'lesson', '1234567890', 1)"),
      db.prepare("INSERT INTO ad_placements (id, placement_key, page_type, ad_unit_id, enabled) VALUES ('p_bad', 'home.after_courses', 'home', 'abc<script>', 1)"),
      db.prepare("INSERT INTO ad_placements (id, placement_key, page_type, description) VALUES ('p_none', 'course.after_outline', 'course', 'old note')"),
      db.prepare("INSERT INTO ad_exclusions (id, path_glob, reason) VALUES ('x_path', 'courses/*/exams/*', 'no slash')"),
      db.prepare("INSERT INTO ad_exclusions (id, course_id) VALUES ('x_course', 'c1')"),
    ]);

    await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);

    const placements = (
      await db.prepare("SELECT id, ad_unit_id AS unit, enabled, description, responsive, devices FROM ad_placements ORDER BY id").all()
    ).results;
    expect(placements).toEqual([
      { id: "p_bad", unit: null, enabled: 0, description: "", responsive: 1, devices: "all" },
      { id: "p_none", unit: null, enabled: 0, description: "old note", responsive: 1, devices: "all" },
      { id: "p_ok", unit: "1234567890", enabled: 1, description: "", responsive: 1, devices: "all" },
    ]);
    const exclusions = (await db.prepare("SELECT id, kind, path_glob AS glob, course_id AS course, page_type AS type FROM ad_exclusions ORDER BY id").all()).results;
    expect(exclusions).toEqual([
      { id: "x_course", kind: "course", glob: null, course: "c1", type: null },
      { id: "x_path", kind: "path", glob: "/courses/*/exams/*", course: null, type: null },
    ]);

    // New rules hold, and the NULL-id guards from 0006 were recreated.
    expect(await errorOf("INSERT INTO ad_placements (id, placement_key, page_type) VALUES ('t', 'exercise.below_question', 'quiz')")).toMatch(/CHECK/);
    expect(await errorOf("INSERT INTO ad_placements (id, placement_key, page_type) VALUES ('t', 'exercise.below_question', 'exercise')")).toBeNull();
    expect(await errorOf("INSERT INTO ad_placements (id, placement_key, page_type) VALUES (NULL, 'topic.x', 'topic')")).toMatch(/may not be NULL/);
    expect(await errorOf("INSERT INTO ad_exclusions (id, kind, page_type) VALUES ('t1', 'page_type', 'lesson')")).toBeNull();
    expect(await errorOf("INSERT INTO ad_exclusions (id, kind, path_glob) VALUES ('t2', 'course', '/x')")).toMatch(/CHECK/);
    expect(await errorOf("INSERT INTO ad_exclusions (id, kind, path_glob) VALUES ('t3', 'path', 'no-slash')")).toMatch(/CHECK/);
    expect(await errorOf("INSERT INTO ad_exclusions (id, kind, path_glob) VALUES (NULL, 'path', '/x')")).toMatch(/may not be NULL/);
    // Exclusions still go with their course.
    await db.prepare("DELETE FROM courses WHERE id = 'c1'").run();
    expect((await db.prepare("SELECT count(*) AS n FROM ad_exclusions WHERE course_id IS NOT NULL").first<{ n: number }>())?.n).toBe(0);
  });
});
