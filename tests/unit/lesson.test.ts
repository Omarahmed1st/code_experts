import { describe, expect, it } from "vitest";
import { AnnotationError, parseAnnotations } from "@/lib/lesson/annotations";
import { fileNameOf, lessonImageKey, lessonImageUrl } from "@/lib/lesson/media";
import { cleanTraceback, compileErrorSummary, errorSummary, readsInput } from "@/lib/lesson/runtime";
import { markdownToPlainText, parseLessonSource, readingMinutes } from "@/lib/lesson/source";
import { buildStage, displayCode } from "@/lib/lesson/stage";
import { printedPart, splitTranscript } from "@/lib/lesson/transcript";

const LESSON = `---
slug: strings
title: Strings
topic: strings
difficulty: easy
description: How Python stores text.
objectives:
  - Read one character
prerequisites:
  - Variables
related:
  - lists
updated: 2026-10-08
---

## [explanation] What is a String?
A **String** is text.

## [code] Indexes
Run it.

\`\`\`python program run
word = "Python"
print(word[0])
\`\`\`

\`\`\`output
P
\`\`\`

\`\`\`notes
2 | [0] | first character | circle sky
\`\`\`

\`\`\`strip
1 | "Python" | chr | auto | neg
\`\`\`

## [key_takeaways] Remember
- Indexes start at 0.
`;

describe("parseLessonSource", () => {
  it("reads front matter, sections, program, output and annotations", () => {
    const lesson = parseLessonSource(LESSON, "strings.md");
    expect(lesson).toMatchObject({ slug: "strings", difficulty: "easy", objectives: ["Read one character"], related: ["lists"] });
    expect(lesson.sections.map((s) => s.kind)).toEqual(["explanation", "code", "key_takeaways"]);
    const code = lesson.sections[1]!;
    expect(code).toMatchObject({ codeLanguage: "python", runnable: true, expectedOutput: "P\n", sampleInput: "" });
    expect(code.code).toBe('word = "Python"\nprint(word[0])');
    expect(code.annotations?.notes[0]).toMatchObject({ line: 2, match: "[0]", shape: "circle", color: "sky" });
    expect(code.annotations?.strips[0]).toMatchObject({ kind: "chr", items: ["P", "y", "t", "h", "o", "n"], negative: true });
    expect(readingMinutes(lesson)).toBeGreaterThanOrEqual(1);
  });

  it("rejects lessons that break the authoring rules", () => {
    const bad = (from: string, to: string) => () => parseLessonSource(LESSON.replace(from, to), "x.md");
    expect(bad("slug: strings", "slug: Strings!")).toThrow(/slug/);
    expect(bad("```python program run", "```pseudocode program run")).toThrow(/only Python and C\+\+ programs can have a Run button/);
    expect(bad("## [key_takeaways] Remember\n- Indexes start at 0.\n", "")).toThrow(/at least three sections/);
    expect(bad("```output\nP\n```\n", "```output\nP\n```\nMore words.\n")).toThrow(/text after the program/);
    expect(bad("A **String** is text.", "![Alt](images/a.png)")).toThrow(/\[diagram\] sections/);
    expect(bad("2 | [0] |", "2 | [9] |")).toThrow();
  });

  it("keeps a pseudocode program's C++ verify block out of the page", () => {
    const pseudo = LESSON.replace("```python program run\nword = \"Python\"\nprint(word[0])\n```", "```pseudocode program\nBEGIN\nPRINT \"P\"\nEND\n```")
      .replace("```notes\n2 | [0] | first character | circle sky\n```\n\n```strip\n1 | \"Python\" | chr | auto | neg\n```\n", "```cpp verify\ncout << \"P\" << endl;\n```\n");
    const code = parseLessonSource(pseudo, "p.md").sections[1]!;
    expect(code).toMatchObject({ codeLanguage: "pseudocode", expectedOutput: "P\n", verifyCode: 'cout << "P" << endl;' });
    expect(code.bodyMd).toBe("Run it.");
    expect(() => parseLessonSource(LESSON.replace("```strip", "```cpp verify\nx\n```\n\n```strip"), "x.md")).toThrow(/only pseudocode/);
  });

  it("plain text for search and descriptions drops markup", () => {
    expect(markdownToPlainText("A **bold** [link](https://x.y) and `code`")).toBe("A bold link and code");
  });
});

describe("parseAnnotations", () => {
  const code = 'word = "Python"\nprint(word[0])';
  it("accepts notes and strips that point at real code", () => {
    const value = { notes: [{ line: 2, match: "word", text: "x", shape: "circle", color: "sky" }], strips: [] };
    expect(parseAnnotations(value, code).notes).toHaveLength(1);
  });
  it("rejects notes that point at missing code, bad shapes and long text", () => {
    const note = (patch: object) => ({ notes: [{ line: 2, match: "word", text: "x", shape: "circle", color: "sky", ...patch }], strips: [] });
    expect(() => parseAnnotations(note({ match: "nope" }), code)).toThrow(AnnotationError);
    expect(() => parseAnnotations(note({ line: 3 }), code)).toThrow(AnnotationError);
    expect(() => parseAnnotations(note({ shape: "star" }), code)).toThrow(AnnotationError);
    expect(() => parseAnnotations(note({ text: "x".repeat(61) }), code)).toThrow(AnnotationError);
  });
});

describe("buildStage", () => {
  it("places marks and rows by column, right-most row first", () => {
    const lines = buildStage("print(a, b)", "python", {
      notes: [
        { line: 1, match: "a", text: "first", shape: "circle", color: "sky" },
        { line: 1, match: "b", text: "second", shape: "square", color: "yel" },
      ],
      strips: [],
    });
    expect(lines[0]!.marks.map((m) => m.col)).toEqual([6, 9]);
    expect(lines[0]!.rows.map((r) => r.note?.text)).toEqual(["second", "first"]);
    expect(lines[0]!.rows[0]!.at).toBeLessThan(lines[0]!.rows[1]!.at);
  });
  it("keeps typing short for long programs and expands tabs", () => {
    const long = Array.from({ length: 60 }, (_, i) => `x${i} = ${i} * 2 + 1`).join("\n");
    const lines = buildStage(long, "python", null);
    expect(lines.at(-1)!.at).toBeLessThan(4700);
    expect(displayCode("if x:\n\tpass\n\n")).toBe("if x:\n    pass");
  });
});

describe("transcripts (OUTPUT boxes with typed input)", () => {
  it("finds each typed line where the program read it", () => {
    expect(splitTranscript("Enter your age: 19\nNext year you will be 20\n", "19\n")).toEqual([
      { text: "Enter your age: ", typed: false },
      { text: "19\n", typed: true },
      { text: "Next year you will be 20\n", typed: false },
    ]);
    expect(printedPart("5\nSum = 15\n", "5")).toBe("Sum = 15\n");
  });
  it("looks for lines in order and leaves out lines that are not there", () => {
    expect(printedPart("a: 1\nb: 2\n", "1\n2\n")).toBe("a: b: ");
    expect(splitTranscript("no input here\n", "7").every((p) => !p.typed)).toBe(true);
    expect(splitTranscript("out\n", "")).toEqual([{ text: "out\n", typed: false }]);
  });
});

describe("Python runner text", () => {
  const raw = [
    "Traceback (most recent call last):",
    '  File "/lib/python314.zip/_pyodide/_base.py", line 597, in eval_code_async',
    "    await CodeRunner(",
    '  File "main.py", line 2, in <module>',
    "    print(word[10])",
    "IndexError: string index out of range",
  ].join("\n");
  it("keeps only the student's part of a traceback", () => {
    expect(cleanTraceback(raw)).toBe(
      'Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print(word[10])\nIndexError: string index out of range',
    );
    expect(errorSummary(raw)).toBe("IndexError: string index out of range");
    expect(cleanTraceback("SyntaxError: bad\n")).toBe("SyntaxError: bad");
  });
});

describe("C++ runner text", () => {
  it("names the first compile error by its line", () => {
    const out = [
      "main.cpp:5:14: error: expected ';' at end of declaration",
      "    5 |     int x = 5",
      "      |              ^",
      "      |              ;",
      "main.cpp:6:5: error: use of undeclared identifier 'y'",
      "2 errors generated.",
    ].join("\n");
    expect(compileErrorSummary(out)).toBe("line 5: expected ';' at end of declaration");
    expect(compileErrorSummary("/work/main.cpp:2:10: fatal error: 'conio.h' file not found")).toBe(
      "line 2: 'conio.h' file not found",
    );
  });
  it("explains a missing main() and system()", () => {
    expect(compileErrorSummary("error: undefined reference to `main'")).toBe(
      "there is no main() function. Every program starts at main(), so check its spelling.",
    );
    expect(compileErrorSummary("wasm-ld: error: /tmp/main.o: undefined symbol: system")).toMatch(/^system\(\)/);
  });
  it("knows when a program reads the keyboard", () => {
    expect(readsInput("cpp", "int x;\ncin >> x;")).toBe(true);
    expect(readsInput("cpp", "getline(cin, name);")).toBe(true);
    expect(readsInput("cpp", 'scanf("%d", &n);')).toBe(true);
    expect(readsInput("cpp", "fgets(line, sizeof line, stdin);")).toBe(true);
    expect(readsInput("cpp", "c = getc(stdin);")).toBe(true);
    expect(readsInput("cpp", 'cout << "cinema";')).toBe(false);
    expect(readsInput("python", "name = input()")).toBe(true);
    expect(readsInput("pseudocode", "INPUT x")).toBe(false);
  });
});

describe("lesson image URLs", () => {
  it("round-trips a key through its public URL", () => {
    const key = "courses/course_py/lessons/les_0123456789abcdef/grid.png";
    expect(lessonImageUrl("python", "course_py", key)).toBe("/courses/python/media/les_0123456789abcdef/grid.png");
    expect(lessonImageKey("course_py", "les_0123456789abcdef", "grid.png")).toBe(key);
    expect(fileNameOf(key)).toBe("grid.png");
  });
  it("refuses keys from another course and path tricks", () => {
    expect(lessonImageUrl("python", "course_py", "courses/course_cv/lessons/les_0123456789abcdef/a.png")).toBeNull();
    expect(lessonImageKey("course_py", "les_0123456789abcdef", "../x.png")).toBeNull();
    expect(lessonImageKey("course_py", "les_0123456789abcdef", "a..png")).toBeNull();
    expect(lessonImageKey("course_py", "../../etc", "a.png")).toBeNull();
  });
});
