// The admin checks edited content by writing it as Markdown and parsing it with
// the content files' own parser, and exports content the same way. These tests
// prove that every file in content/ survives parse -> serialize -> parse unchanged.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseLessonSource } from "@/lib/lesson/source";
import { serializeLesson } from "@/lib/lesson/serialize";
import { parseExamSource, parseExerciseSource, parseQuizSource } from "@/lib/exercise/source";
import { serializeExam, serializeExercise, serializeQuiz } from "@/lib/exercise/serialize";

const CONTENT = join(process.cwd(), "content");
const files = (kind: string) =>
  readdirSync(CONTENT).flatMap((course) => {
    try {
      return readdirSync(join(CONTENT, course, kind))
        .filter((f) => f.endsWith(".md"))
        .map((f) => ({ name: `${course}/${kind}/${f}`, text: readFileSync(join(CONTENT, course, kind, f), "utf8") }));
    } catch {
      return [];
    }
  });

describe("Markdown round trip", () => {
  it("lessons", () => {
    const all = files("lessons");
    expect(all.length).toBeGreaterThan(20);
    for (const { name, text } of all) {
      const parsed = parseLessonSource(text, name);
      expect(parseLessonSource(serializeLesson(parsed), name), name).toEqual(parsed);
    }
  });

  it("exercises", () => {
    const all = files("exercises");
    expect(all.length).toBeGreaterThan(250);
    for (const { name, text } of all) {
      const parsed = parseExerciseSource(text, name);
      expect(parseExerciseSource(serializeExercise(parsed), name), name).toEqual(parsed);
    }
  });

  it("quizzes and exams", () => {
    for (const { name, text } of files("quizzes")) {
      const parsed = parseQuizSource(text, name);
      expect(parseQuizSource(serializeQuiz(parsed), name), name).toEqual(parsed);
    }
    for (const { name, text } of files("exams")) {
      const parsed = parseExamSource(text, name);
      expect(parseExamSource(serializeExam(parsed), name), name).toEqual(parsed);
    }
  });
});
