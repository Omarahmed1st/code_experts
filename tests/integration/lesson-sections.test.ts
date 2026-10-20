// Migrations 0002 and 0003: the rules on runnable code and lesson images. Each rejection
// asserts the CHECK that fired and has a passing control, like schema-checks.
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { errorOf, migrate, resetAndSeed } from "./db-helpers";

const CHECK = /CHECK constraint failed/;
const UNIQUE = /UNIQUE constraint failed: lesson_sections.image_key/;

function section(id: string, columns: Record<string, string | number | null>, course = "c_py"): string {
  const all = { id, course_id: course, lesson_id: `l_${course}`, kind: "code", ...columns };
  const values = Object.values(all).map((v) => (v === null ? "NULL" : typeof v === "number" ? String(v) : `'${v}'`));
  return `INSERT INTO lesson_sections (${Object.keys(all).join(", ")}) VALUES (${values.join(", ")})`;
}

beforeAll(migrate);
beforeEach(resetAndSeed);

describe("runnable code sections", () => {
  it("only Python and C++ code can be runnable (migration 0003)", async () => {
    expect(await errorOf(section("s1", { runnable: 1, code: "BEGIN\nEND", code_language: "pseudocode" }))).toMatch(
      /CHECK constraint failed: runnable IN/,
    );
    expect(await errorOf(section("s2", { runnable: 1, code: "print(1)", code_language: "python" }))).toBeNull();
    expect(await errorOf(section("s3", { runnable: 1, code: "int main() {}", code_language: "cpp" }))).toBeNull();
  });

  it("a runnable section needs code", async () => {
    expect(await errorOf(section("s1", { runnable: 1, code_language: "python" }))).toMatch(CHECK);
    expect(await errorOf(section("s2", { runnable: 0, code_language: "python" }))).toBeNull();
  });

  it("expected output needs code", async () => {
    expect(await errorOf(section("s1", { kind: "note", expected_output: "42" }))).toMatch(
      /CHECK constraint failed: expected_output/,
    );
    expect(await errorOf(section("s2", { code: "print(42)", code_language: "python", expected_output: "42\n" }))).toBeNull();
  });
});

describe("lesson images", () => {
  const image = (key: string, alt: string | null = "A 3x3 grid of pixels") => ({
    kind: "diagram",
    image_key: key,
    image_alt: alt,
    image_width: 640,
    image_height: 360,
  });

  it("an image must be stored in its own course's lessons folder", async () => {
    expect(await errorOf(section("s1", image("courses/c_cv/lessons/l/a.png")))).toMatch(
      /CHECK constraint failed: image_key/,
    );
    expect(await errorOf(section("s2", image("courses/c_py/resources/a.png")))).toMatch(CHECK);
    expect(await errorOf(section("s3", image("courses/c_py/lessons/l/a.png")))).toBeNull();
  });

  it("an image needs alt text and its size", async () => {
    expect(await errorOf(section("s1", image("courses/c_py/lessons/l/a.png", "  ")))).toMatch(CHECK);
    expect(
      await errorOf(section("s2", { ...image("courses/c_py/lessons/l/b.png"), image_width: null })),
    ).toMatch(CHECK);
    expect(await errorOf(section("s3", image("courses/c_py/lessons/l/c.png")))).toBeNull();
  });

  it("two sections can't point at the same image", async () => {
    expect(await errorOf(section("s1", image("courses/c_py/lessons/l/a.png")))).toBeNull();
    expect(await errorOf(section("s2", image("courses/c_py/lessons/l/a.png")))).toMatch(UNIQUE);
    expect(await errorOf(section("s3", { kind: "note" }))).toBeNull(); // many sections without images are fine
    expect(await errorOf(section("s4", { kind: "note" }))).toBeNull();
  });
});
