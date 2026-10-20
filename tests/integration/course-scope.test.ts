import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { listPublishedCourses, resolveCourse } from "@/server/courses/scope";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(loadRealSeed);

describe("course scope", () => {
  it("lists the three seeded courses in their display order", async () => {
    const courses = await listPublishedCourses();
    expect(courses.map((c) => [c.slug, c.shortTitle])).toEqual([
      ["programming-fundamentals", "C++"],
      ["programming-applications", "Python"],
      ["computer-vision", "Computer Vision"],
    ]);
    expect(courses[0]?.tags).toEqual(["C++", "Foundations"]);
  });

  it("resolves a published course from its URL slug", async () => {
    const course = await resolveCourse("computer-vision");
    expect(course).toMatchObject({ courseId: "course_computer_vision", primaryLanguage: "python" });
  });

  it("returns null for unknown, malformed and unpublished courses", async () => {
    expect(await resolveCourse("no-such-course")).toBeNull();
    expect(await resolveCourse("Computer-Vision")).toBeNull();
    expect(await resolveCourse("../etc")).toBeNull();
    await env.DB.prepare("UPDATE courses SET status = 'draft' WHERE slug = 'computer-vision'").run();
    expect(await resolveCourse("computer-vision")).toBeNull();
    expect((await listPublishedCourses()).map((c) => c.slug)).not.toContain("computer-vision");
  });

  it("the seed can be re-run without duplicating courses", async () => {
    await loadRealSeed();
    for (const file of env.SEED) for (const query of file.queries) await env.DB.prepare(query).run();
    const row = await env.DB.prepare("SELECT count(*) AS n FROM courses").first<{ n: number }>();
    expect(row?.n).toBe(3);
  });
});
