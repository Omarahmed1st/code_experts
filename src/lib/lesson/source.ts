// Parses a lesson written as a Markdown file (content/<course>/lessons/*.md)
// into the rows the database stores. Used by tools/build-content.ts and by
// tests. Pure: no file system access, no path aliases (Node runs it directly).
//
// File shape:
//
//   ---
//   slug: strings
//   title: Strings: indexing and slicing
//   topic: strings
//   lecture: 5
//   difficulty: easy
//   description: One sentence for search results and cards.
//   objectives:
//     - Read one character with an index
//   prerequisites:
//     - Variables
//   related:
//     - lists
//   updated: 2026-10-08
//   ---
//
//   ## [explanation] What is a String?
//   Markdown…
//
//   ## [code] Your first String
//   Markdown before the program…
//   ```python program run          <- the section's program ("run" = Edit and Run in the
//                                      browser; Python and C++ only)
//   word = "Python"
//   ```
//   ```input / ```output           <- its INPUT and the exact OUTPUT
//   ```cpp verify                   <- pseudocode only: the same steps in C++, run by the
//                                      checker to prove the OUTPUT box (never shown)
//   ```notes                       <- chips:  line | code | note | shape colour
//   1 | word | a variable | circle sky
//   ```
//   ```strip                       <- boxes:  line | code | chr or item | items or auto | neg
//   1 | "Python" | chr | auto | neg
//   ```
//
//   ## [diagram] Title
//   ![Alt text](images/file.png)   <- the section's image (stored in R2)
import {
  AnnotationError,
  type CodeAnnotations,
  NOTE_COLORS,
  NOTE_SHAPES,
  parseAnnotations,
} from "./annotations.ts";

export const SECTION_KINDS = [
  "explanation",
  "example",
  "code",
  "diagram",
  "common_mistakes",
  "key_takeaways",
  "note",
] as const;
export type SectionKind = (typeof SECTION_KINDS)[number];

const PROGRAM_LANGUAGES = ["python", "cpp", "pseudocode", "text"] as const;
export type ProgramLanguage = (typeof PROGRAM_LANGUAGES)[number];

export interface SectionSource {
  kind: SectionKind;
  title: string;
  bodyMd: string;
  code: string | null;
  codeLanguage: ProgramLanguage | null;
  runnable: boolean;
  sampleInput: string;
  expectedOutput: string | null;
  /** Pseudocode only: a C++ translation the checker runs to prove the OUTPUT box. Not stored. */
  verifyCode: string | null;
  annotations: CodeAnnotations | null;
  image: { file: string; alt: string } | null;
}

export interface LessonSource {
  slug: string;
  title: string;
  topic: string;
  lecture: number | null;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  objectives: string[];
  prerequisites: string[];
  related: string[];
  status: "published" | "draft";
  /** "Last updated" date shown on the page, YYYY-MM-DD. */
  updated: string;
  sections: SectionSource[];
}

export class LessonSourceError extends Error {}

function fail(file: string, message: string): never {
  throw new LessonSourceError(`${file}: ${message}`);
}

export type Frontmatter = Record<string, string | string[]>;

export function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/** A deliberately small subset of YAML: `key: value` and `key:` followed by `  - item` lines. */
export function parseFrontmatter(lines: string[], file: string): Frontmatter {
  const data: Frontmatter = {};
  let listKey: string | null = null;
  for (const line of lines) {
    if (line.trim() === "" || line.trim().startsWith("#")) continue;
    const item = /^\s+-\s+(.*)$/.exec(line);
    if (item) {
      if (!listKey) fail(file, `list item without a key: "${line}"`);
      (data[listKey] as string[]).push(unquote(item[1] ?? ""));
      continue;
    }
    const pair = /^([a-zA-Z]+):\s*(.*)$/.exec(line);
    if (!pair?.[1]) fail(file, `can't read front matter line "${line}"`);
    const key = pair[1];
    const value = pair[2] ?? "";
    if (value.trim() === "") {
      data[key] = [];
      listKey = key;
    } else {
      data[key] = unquote(value);
      listKey = null;
    }
  }
  return data;
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function text(data: Frontmatter, key: string, file: string, required = true): string {
  const value = data[key];
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.trim() === "") fail(file, `front matter "${key}" is required`);
  return value;
}

function list(data: Frontmatter, key: string, file: string): string[] {
  const value = data[key];
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail(file, `front matter "${key}" must be a list`);
  return value;
}

export interface Fence {
  info: string;
  body: string;
  start: number;
  end: number;
}

/** Fenced blocks (``` or ~~~) with their line ranges, in order. */
export function findFences(lines: string[]): Fence[] {
  const fences: Fence[] = [];
  let open: { marker: string; info: string; start: number } | null = null;
  lines.forEach((line, i) => {
    const m = /^(`{3,}|~{3,})(.*)$/.exec(line);
    if (!m?.[1]) return;
    if (!open) {
      open = { marker: m[1], info: (m[2] ?? "").trim(), start: i };
    } else if (m[1][0] === open.marker[0] && m[1].length >= open.marker.length && (m[2] ?? "").trim() === "") {
      fences.push({ info: open.info, start: open.start, end: i, body: lines.slice(open.start + 1, i).join("\n") });
      open = null;
    }
  });
  if (open) fences.push({ info: (open as { info: string }).info, start: (open as { start: number }).start, end: lines.length - 1, body: "" });
  return fences;
}

function splitRow(line: string): string[] {
  return line.split("|").map((part) => part.trim());
}

export function parseNotes(body: string, file: string): unknown[] {
  return body
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [lineNo, match, noteText, style] = splitRow(line);
      const [shape, color] = (style ?? "").split(/\s+/);
      if (!lineNo || !match || !noteText) fail(file, `note "${line}" needs: line | code | note | shape colour`);
      if (shape && !(NOTE_SHAPES as readonly string[]).includes(shape)) fail(file, `unknown note shape "${shape}"`);
      if (color && !(NOTE_COLORS as readonly string[]).includes(color)) fail(file, `unknown note colour "${color}"`);
      return { line: Number(lineNo), match: unquoteCode(match), text: noteText, shape: shape || undefined, color: color || undefined };
    });
}

/** `"Python"` in a notes row means the code text "Python" with its quotes; wrap in backticks to keep spaces. */
function unquoteCode(value: string): string {
  return value.startsWith("`") && value.endsWith("`") && value.length >= 2 ? value.slice(1, -1) : value;
}

function autoItems(match: string, kind: "chr" | "item"): string[] {
  if (kind === "chr") return [...unquote(match)];
  const inner = match.trim().replace(/^\[/, "").replace(/\]$/, "");
  return inner.split(",").map((item) => unquote(item)).filter(Boolean);
}

export function parseStrips(body: string, file: string): unknown[] {
  return body
    .split("\n")
    .filter((line) => line.trim() !== "")
    .map((line) => {
      const [lineNo, rawMatch, kind, items, flag] = splitRow(line);
      if (!lineNo || !rawMatch || (kind !== "chr" && kind !== "item")) {
        fail(file, `strip "${line}" needs: line | code | chr or item | items or auto | neg`);
      }
      const match = unquoteCode(rawMatch);
      return {
        line: Number(lineNo),
        match,
        kind,
        items: !items || items === "auto" ? autoItems(match, kind) : items.split(",").map((s) => s.trim()),
        negative: flag === "neg",
      };
    });
}

function parseSection(kind: SectionKind, title: string, lines: string[], file: string): SectionSource {
  const where = `${file} section "${title}"`;
  const fences = findFences(lines);
  const removed = new Set<number>();
  const remove = (fence: Fence) => {
    for (let i = fence.start; i <= fence.end; i++) removed.add(i);
  };

  let code: string | null = null;
  let codeLanguage: ProgramLanguage | null = null;
  let runnable = false;
  let sampleInput = "";
  let expectedOutput: string | null = null;
  let verifyCode: string | null = null;
  let programEnd = -1;
  const rawAnnotations: { notes: unknown[]; strips: unknown[] } = { notes: [], strips: [] };

  for (const fence of fences) {
    const words = fence.info.split(/\s+/);
    const language = words[0] ?? "";
    if (words.includes("program")) {
      if (code !== null) fail(where, "has more than one program; split it into two sections");
      if (!(PROGRAM_LANGUAGES as readonly string[]).includes(language)) fail(where, `unknown program language "${language}"`);
      code = fence.body;
      codeLanguage = language as ProgramLanguage;
      runnable = words.includes("run");
      programEnd = fence.end;
      remove(fence);
    } else if ((language === "input" || language === "output") && code !== null && fence.start > programEnd) {
      if (language === "input") sampleInput = fence.body + "\n";
      else expectedOutput = fence.body + "\n";
      remove(fence);
    } else if (language === "cpp" && words.includes("verify")) {
      if (code === null || fence.start < programEnd) fail(where, "a cpp verify block must come after the program");
      if (verifyCode !== null) fail(where, "has more than one cpp verify block");
      verifyCode = fence.body;
      remove(fence);
    } else if (language === "notes" || language === "strip") {
      if (code === null) fail(where, `a ${language} block must come after the program`);
      if (language === "notes") rawAnnotations.notes.push(...parseNotes(fence.body, where));
      else rawAnnotations.strips.push(...parseStrips(fence.body, where));
      remove(fence);
    }
  }
  if (runnable && codeLanguage !== "python" && codeLanguage !== "cpp") {
    fail(where, "only Python and C++ programs can have a Run button");
  }
  if (verifyCode !== null && codeLanguage !== "pseudocode") fail(where, "only pseudocode programs take a cpp verify block");

  let image: SectionSource["image"] = null;
  const kept: string[] = [];
  lines.forEach((line, i) => {
    if (removed.has(i)) return;
    const img = /^!\[([^\]]+)\]\((images\/[A-Za-z0-9._-]+)\)\s*$/.exec(line);
    if (img?.[1] && img[2] && !fences.some((f) => i > f.start && i < f.end)) {
      if (image) fail(where, "has more than one image");
      image = { alt: img[1].trim(), file: img[2] };
      return;
    }
    kept.push(line);
  });
  if (image && kind !== "diagram") fail(where, "images belong in [diagram] sections");

  // Text after a program would render above it (body comes first), so it isn't allowed.
  if (code !== null) {
    const after = lines.slice(programEnd + 1).filter((line, j) => !removed.has(programEnd + 1 + j));
    if (after.some((line) => line.trim() !== "")) fail(where, "put text after the program in a new section");
  }

  let annotations: CodeAnnotations | null = null;
  if (code !== null && (rawAnnotations.notes.length > 0 || rawAnnotations.strips.length > 0)) {
    try {
      annotations = parseAnnotations(rawAnnotations, code);
    } catch (error) {
      if (error instanceof AnnotationError) fail(where, error.message);
      throw error;
    }
  }

  return {
    kind,
    title,
    bodyMd: kept.join("\n").trim(),
    code,
    codeLanguage,
    runnable,
    sampleInput,
    expectedOutput,
    verifyCode,
    annotations,
    image,
  };
}

export function parseLessonSource(source: string, file: string): LessonSource {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "---") fail(file, "must start with --- front matter");
  const close = lines.indexOf("---", 1);
  if (close === -1) fail(file, "front matter is not closed with ---");
  const data = parseFrontmatter(lines.slice(1, close), file);

  const slug = text(data, "slug", file);
  if (!SLUG.test(slug)) fail(file, `slug "${slug}" must be lower-case words joined by hyphens`);
  const topic = text(data, "topic", file);
  const difficulty = text(data, "difficulty", file);
  if (difficulty !== "easy" && difficulty !== "medium" && difficulty !== "hard") fail(file, "difficulty must be easy, medium or hard");
  const lectureText = text(data, "lecture", file, false);
  const lecture = lectureText === "" ? null : Number(lectureText);
  if (lecture !== null && (!Number.isInteger(lecture) || lecture < 1)) fail(file, "lecture must be a whole number");
  const status = text(data, "status", file, false) || "published";
  if (status !== "published" && status !== "draft") fail(file, "status must be published or draft");

  const updated = text(data, "updated", file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(`${updated}T00:00:00Z`))) {
    fail(file, "updated must be a date like 2026-10-08");
  }

  const body = lines.slice(close + 1);
  const fences = findFences(body);
  const inFence = (i: number) => fences.some((f) => i >= f.start && i <= f.end);
  const sections: SectionSource[] = [];
  let current: { kind: SectionKind; title: string; lines: string[] } | null = null;
  body.forEach((line, i) => {
    const heading = inFence(i) ? null : /^## \[([a-z_]+)\]\s+(.+)$/.exec(line);
    if (heading?.[1] && heading[2]) {
      if (!(SECTION_KINDS as readonly string[]).includes(heading[1])) fail(file, `unknown section kind [${heading[1]}]`);
      if (current) sections.push(parseSection(current.kind, current.title, current.lines, file));
      current = { kind: heading[1] as SectionKind, title: heading[2].trim(), lines: [] };
      return;
    }
    if (!current) {
      if (line.trim() !== "") fail(file, `text before the first "## [kind] Title" section: "${line}"`);
      return;
    }
    current.lines.push(line);
  });
  if (current) {
    const last = current as { kind: SectionKind; title: string; lines: string[] };
    sections.push(parseSection(last.kind, last.title, last.lines, file));
  }
  if (sections.length < 3) fail(file, "a lesson needs at least three sections (no near-empty lessons)");

  return {
    slug,
    title: text(data, "title", file),
    topic,
    lecture,
    difficulty,
    description: text(data, "description", file),
    objectives: list(data, "objectives", file),
    prerequisites: list(data, "prerequisites", file),
    related: list(data, "related", file),
    status,
    updated,
    sections,
  };
}

/** Rough plain text of Markdown, for search and reading time. */
export function markdownToPlainText(markdown: string): string {
  return markdown
    .replace(/^(`{3,}|~{3,}).*$/gm, "")
    .replace(/^:::.*$/gm, "")
    .replace(/^\?\?\?$/gm, "")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[`*_>#|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Minutes to read: prose at 200 words a minute plus code at 10 lines a minute, at least 1. */
export function readingMinutes(lesson: { sections: readonly { bodyMd: string; code: string | null }[] }): number {
  let words = 0;
  let codeLines = 0;
  for (const section of lesson.sections) {
    const fenced = section.bodyMd.match(/^(`{3,}|~{3,})[\s\S]*?^\1\s*$/gm) ?? [];
    codeLines += fenced.reduce((n, block) => n + block.split("\n").length - 2, 0);
    words += markdownToPlainText(section.bodyMd).split(" ").filter(Boolean).length;
    if (section.code) codeLines += section.code.split("\n").length;
  }
  return Math.max(1, Math.round(words / 200 + codeLines / 10));
}
