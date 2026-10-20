import { describe, expect, it } from "vitest";
import { courseSlugFromPath } from "@/lib/course-path";
import { isValidSlug } from "@/lib/slug";

describe("isValidSlug", () => {
  it.each(["for-loops", "cpp", "computer-vision", "lecture-3"])("accepts %s", (slug) => {
    expect(isValidSlug(slug)).toBe(true);
  });
  it.each(["", "For-Loops", "for--loops", "-loops", "loops-", "for loops", "../etc", "a".repeat(81)])(
    "rejects %j",
    (slug) => {
      expect(isValidSlug(slug)).toBe(false);
    },
  );
});

describe("courseSlugFromPath", () => {
  it("finds the course in course-scoped paths", () => {
    expect(courseSlugFromPath("/courses/computer-vision")).toBe("computer-vision");
    expect(courseSlugFromPath("/courses/programming-fundamentals/lectures/for-loops")).toBe("programming-fundamentals");
  });
  it("returns null outside a course or for malformed paths", () => {
    expect(courseSlugFromPath("/courses")).toBeNull();
    expect(courseSlugFromPath("/")).toBeNull();
    expect(courseSlugFromPath(null)).toBeNull();
    expect(courseSlugFromPath("/courses/%E0%A4%A")).toBeNull();
  });
});
