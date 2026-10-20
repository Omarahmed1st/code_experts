// Parses exercises, quizzes and practice exams written as Markdown files:
//
//   content/<course>/exercises/*.md   one question per file
//   content/<course>/quizzes/*.md     a fixed list of questions
//   content/<course>/exams/*.md       rules that draw questions from the course's bank
//
// Used by tools/build-content.ts (to write the seed) and
// tools/check-exercise-code.ts (to run every program). Pure: no file system
// access and no path aliases, so Node runs it directly. The format is described
// in docs/CONTENT.md ("Exercises").
import { type Fence, type Frontmatter, LessonSourceError, findFences, parseFrontmatter } from "../lesson/source.ts";
import { COMPARE_MODES, type CompareMode } from "../grading/output.ts";
import { ASK_TYPE, type Ask, blanksOf, countBlanks, isAsk, joinOrder, orderParts, sameLines } from "./ask.ts";

export const EXERCISE_TYPES = ["mcq", "trace", "correct_code", "write_code"] as const;
export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export type Difficulty = "easy" | "medium" | "hard";
export type CodeLanguage = "cpp" | "python" | "pseudocode" | "text";

export interface OptionSource {
  labelMd: string;
  correct: boolean;
  feedbackMd: string;
}

export interface TestSource {
  name: string;
  stdin: string;
  stdout: string;
  hidden: boolean;
}

export interface TraceStepSource {
  line: number | null;
  explanation: string;
  variables: Record<string, string>;
  output: string;
}

/** Stored in exercises.settings. */
export interface ExerciseSettings {
  /** MCQ: more than one option is correct, and the student picks all of them. */
  multiple?: boolean;
  /** MCQ: show the options in a random order (default true). */
  shuffle?: boolean;
  /** Trace answers and test cases: how outputs are compared. */
  compare?: CompareMode;
  /** Trace answers: whether upper/lower case must match (default true). */
  caseSensitive?: boolean;
  /**
   * Kept for quizzes only (a final exam's questions): not listed on the
   * exercise pages, practice sets, custom exams or practice exams, and no page
   * of its own. Front matter `reserved: true`.
   */
  reserved?: boolean;
  /** A question format on top of the type (src/lib/exercise/ask.ts). Front matter `ask:`. */
  ask?: Ask;
}

export interface ExerciseSource {
  slug: string;
  type: ExerciseType;
  title: string;
  topic: string | null;
  lesson: string | null;
  difficulty: Difficulty;
  points: number;
  status: "published" | "draft";
  demo: boolean;
  updated: string;
  promptMd: string;
  code: string | null;
  codeLanguage: CodeLanguage | null;
  /**
   * A program the checker runs to prove a trace answer: the same steps in C++
   * for pseudocode, or (ask: count / value) a copy that prints the answer.
   * Never shown.
   */
  verifyCode: string | null;
  verifyLanguage: "cpp" | "python" | null;
  expectedBehaviorMd: string;
  explanationMd: string;
  settings: ExerciseSettings;
  options: OptionSource[];
  /** Trace: accepted outputs (the first is shown as the answer). MCQ: optional output the checker proves. */
  outputs: string[];
  solution: string | null;
  accepted: string[];
  tests: TestSource[];
  hints: string[];
  steps: TraceStepSource[];
}

export interface QuizSource {
  slug: string;
  title: string;
  descriptionMd: string;
  topic: string | null;
  mode: "practice" | "exam";
  timeLimitSec: number | null;
  passThreshold: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  /** Attempts allowed in any 24 hours (null: unlimited). */
  maxAttempts: number | null;
  status: "published" | "draft";
  demo: boolean;
  questions: { slug: string; points: number }[];
  /**
   * Another version ("model") of this quiz: its slug is `<modelOf>-model-<letter>`
   * and its timer, marks and attempts come from that quiz. Students start the
   * quiz and get one of its models at random.
   */
  modelOf: string | null;
}

export interface ExamRuleSource {
  count: number;
  type: ExerciseType | null;
  difficulty: Difficulty | null;
  topic: string | null;
  points: number;
}

export interface ExamSource {
  slug: string;
  title: string;
  descriptionMd: string;
  scope: "course" | "topic" | "mixed_topics";
  timeLimitSec: number;
  passThreshold: number;
  shuffleQuestions: boolean;
  status: "published" | "draft";
  demo: boolean;
  rules: ExamRuleSource[];
}

function fail(file: string, message: string): never {
  throw new LessonSourceError(`${file}: ${message}`);
}

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function str(data: Frontmatter, key: string, file: string, required = true): string {
  const value = data[key];
  if (value === undefined && !required) return "";
  if (typeof value !== "string" || value.trim() === "") fail(file, `front matter "${key}" is required`);
  return value.trim();
}

function flag(data: Frontmatter, key: string, file: string, fallback: boolean): boolean {
  const value = str(data, key, file, false);
  if (value === "") return fallback;
  if (value !== "true" && value !== "false") fail(file, `"${key}" must be true or false`);
  return value === "true";
}

function whole(data: Frontmatter, key: string, file: string, fallback: number | null, min = 1, max = 100_000): number | null {
  const value = str(data, key, file, false);
  if (value === "") return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) fail(file, `"${key}" must be a whole number from ${min} to ${max}`);
  return n;
}

function slugOrNull(data: Frontmatter, key: string, file: string): string | null {
  const value = str(data, key, file, false);
  if (value === "") return null;
  if (!SLUG.test(value)) fail(file, `"${key}" must be a slug (lower-case words joined by hyphens)`);
  return value;
}

function difficultyOf(value: string, file: string): Difficulty {
  if (value !== "easy" && value !== "medium" && value !== "hard") fail(file, "difficulty must be easy, medium or hard");
  return value;
}

function statusOf(data: Frontmatter, file: string): "published" | "draft" {
  const status = str(data, "status", file, false) || "published";
  if (status !== "published" && status !== "draft") fail(file, "status must be published or draft");
  return status;
}

function split(source: string, file: string): { data: Frontmatter; body: string[] } {
  const lines = source.replace(/\r\n?/g, "\n").split("\n");
  if (lines[0] !== "---") fail(file, "must start with --- front matter");
  const close = lines.indexOf("---", 1);
  if (close === -1) fail(file, "front matter is not closed with ---");
  return { data: parseFrontmatter(lines.slice(1, close), file), body: lines.slice(close + 1) };
}

interface Part {
  heading: string;
  lines: string[];
}

/** Splits the body at `## Heading` lines (outside code fences). Text before the first heading is the "" part. */
function parts(body: string[], level: "##" | "###"): Part[] {
  const fences = findFences(body);
  const inFence = (i: number) => fences.some((f) => i >= f.start && i <= f.end);
  const out: Part[] = [{ heading: "", lines: [] }];
  const pattern = level === "##" ? /^##\s+(.+?)\s*$/ : /^###\s+(.+?)\s*$/;
  body.forEach((line, i) => {
    const m = inFence(i) ? null : pattern.exec(line);
    if (m?.[1]) out.push({ heading: m[1], lines: [] });
    else (out[out.length - 1] as Part).lines.push(line);
  });
  return out;
}

const trimBlank = (lines: string[]) => lines.join("\n").replace(/^\s*\n/, "").replace(/\s+$/, "");

/** Fences as language + body. A non-empty output/input body ends with a newline, as a program prints it. */
function fencesOf(lines: string[]): (Fence & { language: string; flags: string[] })[] {
  return findFences(lines).map((f) => {
    const [language = "", ...flags] = f.info.split(/\s+/);
    return { ...f, language, flags };
  });
}

const withNewline = (body: string) => (body === "" ? "" : `${body}\n`);

const SECTIONS = [
  "Question",
  "Code",
  "Options",
  "Answer",
  "Expected behavior",
  "Tests",
  "Solution",
  "Also accepted",
  "Hints",
  "Explanation",
  "Steps",
] as const;
type SectionName = (typeof SECTIONS)[number];

function parseOptions(lines: string[], file: string): OptionSource[] {
  const options: OptionSource[] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    const item = /^[-*]\s+\[( |x|X)\]\s+(.+)$/.exec(line);
    if (item) {
      options.push({ labelMd: (item[2] ?? "").trim(), correct: item[1] !== " ", feedbackMd: "" });
      continue;
    }
    const last = options[options.length - 1];
    if (!last || !/^\s{2,}\S/.test(line)) fail(file, `Options: can't read "${line}" (use "- [x] right answer" or "- [ ] wrong answer", feedback indented under it)`);
    last.feedbackMd = `${last.feedbackMd ? `${last.feedbackMd} ` : ""}${line.trim()}`;
  }
  return options;
}

function parseList(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    if (line.trim() === "") continue;
    const item = /^(?:[-*]|\d+\.)\s+(.+)$/.exec(line);
    if (item) items.push((item[1] ?? "").trim());
    else if (items.length > 0) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items;
}

/** `| Line | What happens | Variables | Output |` with `x = 2; y = 5` variables and `\n` for a newline in Output. */
function parseSteps(lines: string[], file: string): TraceStepSource[] {
  const rows = lines.filter((l) => l.trim().startsWith("|"));
  if (rows.length < 3) fail(file, "Steps: write a table with a header row, a --- row and at least one step");
  const cells = (row: string) =>
    row
      .trim()
      .replace(/^\||\|$/g, "")
      .split(/(?<!\\)\|/)
      .map((c) => c.trim().replace(/\\\|/g, "|"));
  const header = cells(rows[0] ?? "").map((h) => h.toLowerCase());
  const col = (name: string) => header.findIndex((h) => h.startsWith(name));
  const [lineCol, whatCol, varCol, outCol] = [col("line"), col("what"), col("variables"), col("output")];
  if (whatCol === -1) fail(file, 'Steps: the table needs a "What happens" column');
  return rows.slice(2).map((row) => {
    const c = cells(row);
    const lineText = lineCol === -1 ? "" : (c[lineCol] ?? "");
    const line = lineText === "" || lineText === "—" || lineText === "-" ? null : Number(lineText);
    if (line !== null && (!Number.isInteger(line) || line < 1)) fail(file, `Steps: line "${lineText}" must be a line number`);
    const variables: Record<string, string> = {};
    const varText = varCol === -1 ? "" : (c[varCol] ?? "");
    if (varText !== "" && varText !== "—" && varText !== "-") {
      for (const pair of varText.split(";")) {
        const m = /^\s*`?([^=`]+?)`?\s*=\s*(.+?)\s*$/.exec(pair);
        if (!m?.[1] || m[2] === undefined) fail(file, `Steps: variables "${varText}" must look like x = 2; y = 5`);
        variables[m[1].trim()] = m[2].replace(/^`|`$/g, "");
      }
    }
    const outText = outCol === -1 ? "" : (c[outCol] ?? "");
    const output =
      outText === "" || outText === "—" || outText === "-" ? "" : outText.replace(/^`|`$/g, "").replace(/\\n/g, "\n");
    return { line, explanation: c[whatCol] ?? "", variables, output };
  });
}

function parseTests(lines: string[], file: string, compare: CompareMode): TestSource[] {
  void compare;
  return parts(lines, "###")
    .slice(1)
    .map((part) => {
      const hidden = /\(hidden\)\s*$/i.test(part.heading);
      const name = part.heading.replace(/^Test:?\s*/i, "").replace(/\(hidden\)\s*$/i, "").trim();
      const fences = fencesOf(part.lines);
      const input = fences.find((f) => f.language === "input");
      const output = fences.find((f) => f.language === "output");
      if (!output) fail(file, `Tests: "${part.heading}" needs an \`\`\`output block (what the program prints)`);
      return { name, stdin: withNewline(input?.body ?? ""), stdout: withNewline(output.body), hidden };
    });
}

export function parseExerciseSource(source: string, file: string): ExerciseSource {
  const { data, body } = split(source, file);
  const slug = str(data, "slug", file);
  if (!SLUG.test(slug)) fail(file, `slug "${slug}" must be lower-case words joined by hyphens`);
  const type = str(data, "type", file) as ExerciseType;
  if (!EXERCISE_TYPES.includes(type)) fail(file, `type must be one of ${EXERCISE_TYPES.join(", ")}`);
  const updated = str(data, "updated", file);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(updated) || Number.isNaN(Date.parse(`${updated}T00:00:00Z`))) {
    fail(file, "updated must be a date like 2026-10-09");
  }
  const compareText = str(data, "compare", file, false) || "trim_trailing";
  if (!(COMPARE_MODES as readonly string[]).includes(compareText)) fail(file, `compare must be one of ${COMPARE_MODES.join(", ")}`);
  const compare = compareText as CompareMode;
  const caseText = str(data, "case", file, false) || "sensitive";
  if (caseText !== "sensitive" && caseText !== "insensitive") fail(file, "case must be sensitive or insensitive");

  const sections = new Map<SectionName, string[]>();
  for (const part of parts(body, "##")) {
    if (part.heading === "") {
      if (part.lines.some((l) => l.trim() !== "")) fail(file, "text before the first ## section");
      continue;
    }
    if (!(SECTIONS as readonly string[]).includes(part.heading)) {
      fail(file, `unknown section "## ${part.heading}" (use ${SECTIONS.join(", ")})`);
    }
    if (sections.has(part.heading as SectionName)) fail(file, `"## ${part.heading}" appears twice`);
    sections.set(part.heading as SectionName, part.lines);
  }
  const section = (name: SectionName) => sections.get(name) ?? null;
  const markdown = (name: SectionName) => trimBlank(section(name) ?? []);

  const promptMd = markdown("Question");
  if (promptMd === "") fail(file, "## Question is required");
  const explanationMd = markdown("Explanation");
  if (explanationMd === "") fail(file, "## Explanation is required: every question explains its answer");

  let code: string | null = null;
  let codeLanguage: CodeLanguage | null = null;
  let verifyCode: string | null = null;
  let verifyLanguage: "cpp" | "python" | null = null;
  const codeLines = section("Code");
  if (codeLines) {
    const fences = fencesOf(codeLines);
    const main = fences.filter((f) => !f.flags.includes("verify"));
    if (main.length !== 1) fail(file, "## Code holds exactly one code block");
    const [only] = main;
    if (!only || !["cpp", "python", "pseudocode", "text"].includes(only.language)) {
      fail(file, "## Code: the block's language must be cpp, python, pseudocode or text");
    }
    code = only.body;
    codeLanguage = only.language as CodeLanguage;
    const verify = fences.find((f) => f.flags.includes("verify") && (f.language === "cpp" || f.language === "python"));
    verifyCode = verify?.body ?? null;
    verifyLanguage = (verify?.language as "cpp" | "python" | undefined) ?? null;
    if (trimBlank(codeLines.filter((_, i) => !fences.some((f) => i >= f.start && i <= f.end))) !== "") {
      fail(file, "## Code holds only the code block; put text in ## Question");
    }
  }

  const options = section("Options") ? parseOptions(section("Options") ?? [], file) : [];
  const outputs = fencesOf(section("Answer") ?? [])
    .filter((f) => f.language === "output")
    .map((f) => withNewline(f.body));
  const solutionFences = fencesOf(section("Solution") ?? []);
  if (solutionFences.length > 1) fail(file, "## Solution holds one code block");
  let solution = solutionFences[0]?.body ?? null;
  const accepted = fencesOf(section("Also accepted") ?? []).map((f) => f.body);
  const tests = section("Tests") ? parseTests(section("Tests") ?? [], file, compare) : [];
  const hints = parseList(section("Hints") ?? []);
  const steps = section("Steps") ? parseSteps(section("Steps") ?? [], file) : [];
  const multiple = flag(data, "multiple", file, false);

  const settings: ExerciseSettings = {};
  if (flag(data, "reserved", file, false)) settings.reserved = true;
  const askText = str(data, "ask", file, false);
  if (askText) {
    if (!isAsk(askText)) fail(file, "ask must be count, value, blanks or order");
    if (ASK_TYPE[askText] !== type) fail(file, `ask: ${askText} is for ${ASK_TYPE[askText]} questions`);
    settings.ask = askText;
  }
  // Put-in-order: the solution is the program in ## Code without its [order] markers.
  if (settings.ask === "order" && code !== null) {
    const parts = orderParts(code);
    if (!parts) fail(file, "ask: order needs the lines to order between a // [order] line and a // [/order] line (# in Python) in ## Code");
    if (parts.block.length < 3 || parts.block.length > 15) fail(file, "ask: order needs 3 to 15 lines between the markers");
    if (solution !== null) fail(file, "ask: order takes its solution from ## Code: leave out ## Solution");
    solution = joinOrder(parts, parts.block);
  }
  const exercise: ExerciseSource = {
    slug,
    type,
    title: str(data, "title", file),
    topic: slugOrNull(data, "topic", file),
    lesson: slugOrNull(data, "lesson", file),
    difficulty: difficultyOf(str(data, "difficulty", file), file),
    points: whole(data, "points", file, 1, 1, 100) ?? 1,
    status: statusOf(data, file),
    demo: flag(data, "demo", file, false),
    updated,
    promptMd,
    code,
    codeLanguage,
    verifyCode,
    verifyLanguage,
    expectedBehaviorMd: markdown("Expected behavior"),
    explanationMd,
    settings,
    options,
    outputs,
    solution,
    accepted,
    tests,
    hints,
    steps,
  };
  if (!exercise.topic && !exercise.lesson) fail(file, "give a topic or a lesson (the topic then comes from the lesson)");

  const only = (allowed: SectionName[]) => {
    for (const name of sections.keys()) {
      if (!allowed.includes(name)) fail(file, `a ${type} question has no "## ${name}" section`);
    }
  };
  const isRunnable = codeLanguage === "cpp" || codeLanguage === "python";

  switch (type) {
    case "mcq": {
      only(["Question", "Code", "Options", "Answer", "Hints", "Explanation"]);
      if (options.length < 2) fail(file, "an MCQ needs at least two options");
      const right = options.filter((o) => o.correct).length;
      if (right === 0) fail(file, "mark the correct option with [x]");
      if (right > 1 && !multiple) fail(file, 'several options are marked [x]: add "multiple: true" if students must pick all of them');
      if (multiple) settings.multiple = true;
      settings.shuffle = flag(data, "shuffle", file, true);
      if (outputs.length > 1) fail(file, "an MCQ's ## Answer holds at most one ```output block");
      if (outputs.length === 1 && !isRunnable) fail(file, "an MCQ ## Answer output needs runnable ## Code (cpp or python)");
      break;
    }
    case "trace": {
      only(["Question", "Code", "Answer", "Hints", "Explanation", "Steps"]);
      if (!code) fail(file, "a trace question needs ## Code");
      if (outputs.length === 0) fail(file, "a trace question needs the exact output in ## Answer (an ```output block)");
      if (codeLanguage === "pseudocode" && verifyCode === null) {
        fail(file, "pseudocode can't run: add a ```cpp verify block in ## Code (the same steps in C++) so the answer can be checked");
      }
      if (codeLanguage === "text") fail(file, "a trace question's code must be cpp, python or pseudocode");
      settings.compare = compare;
      settings.caseSensitive = caseText === "sensitive";
      if (settings.ask === "count" || settings.ask === "value") {
        // A one-line answer, proved by a program that prints it.
        if (outputs.some((o) => o.trim() === "" || o.trim().includes("\n"))) fail(file, `ask: ${settings.ask} needs a one-line ## Answer`);
        if (settings.ask === "count" && outputs.some((o) => !/^\d+$/.test(o.trim()))) fail(file, "ask: count needs a whole number as the ## Answer");
        if (verifyCode === null) fail(file, `ask: ${settings.ask} needs a \`\`\`cpp verify (or python verify) block in ## Code that prints the answer`);
        settings.compare = "normalize_whitespace";
      }
      break;
    }
    case "correct_code":
    case "write_code": {
      only(["Question", "Code", "Expected behavior", "Tests", "Solution", "Also accepted", "Hints", "Explanation"]);
      if (!code || !isRunnable) fail(file, `a ${type} question needs ## Code in cpp or python (${type === "write_code" ? "starter code" : "the broken program"})`);
      if (!solution) fail(file, "## Solution is required (a working program)");
      if (tests.length === 0) fail(file, "## Tests needs at least one ### test with an ```output block");
      if (exercise.expectedBehaviorMd === "") fail(file, "## Expected behavior is required: say what the finished program does");
      if (type === "write_code" && accepted.length > 0) fail(file, "write_code is checked by its tests: ## Also accepted is for correct_code");
      if (tests.every((t) => t.hidden)) fail(file, "at least one test must be visible (only visible tests run in the browser)");
      settings.compare = compare;
      if (settings.ask === "blanks") {
        const blanks = countBlanks(code);
        if (blanks === 0 || blanks > 12) fail(file, "ask: blanks needs 1 to 12 blanks (___) in ## Code");
        for (const [i, program] of [solution, ...accepted].entries()) {
          const filled = blanksOf(code, program);
          if (!filled || filled.some((b) => b.trim() === "")) {
            fail(file, `ask: blanks: ${i === 0 ? "## Solution" : `accepted fix ${i}`} must be ## Code with every ___ filled in and nothing else changed`);
          }
        }
      }
      if (settings.ask === "order") {
        const parts = orderParts(code)!;
        for (const [i, program] of accepted.entries()) {
          const lines = program.replace(/\n+$/, "").split("\n");
          const block = lines.slice(parts.before.length, lines.length - parts.after.length);
          if (joinOrder(parts, block) !== program.replace(/\n+$/, "") + "\n" || !sameLines(block, parts.block)) {
            fail(file, `ask: order: accepted fix ${i + 1} must be the same lines in another order`);
          }
        }
      }
      break;
    }
  }
  return exercise;
}

export function parseQuizSource(source: string, file: string): QuizSource {
  const { data, body } = split(source, file);
  const slug = str(data, "slug", file);
  if (!SLUG.test(slug)) fail(file, `slug "${slug}" must be lower-case words joined by hyphens`);
  const mode = str(data, "mode", file, false) || "practice";
  if (mode !== "practice" && mode !== "exam") fail(file, "mode must be practice or exam");
  const minutes = whole(data, "time", file, null, 1, 600);
  const raw = data.questions;
  if (!Array.isArray(raw) || raw.length === 0) fail(file, "questions: list the exercise slugs, one per line");
  const questions = raw.map((item) => {
    const [qSlug = "", pointsText] = item.split("|").map((s) => s.trim());
    if (!SLUG.test(qSlug)) fail(file, `questions: "${item}" must be an exercise slug, optionally "| points"`);
    const points = pointsText === undefined ? 1 : Number(pointsText);
    if (!Number.isInteger(points) || points < 1 || points > 100) fail(file, `questions: points in "${item}" must be 1 to 100`);
    return { slug: qSlug, points };
  });
  if (new Set(questions.map((q) => q.slug)).size !== questions.length) fail(file, "questions: a question is listed twice");
  const modelOf = slugOrNull(data, "modelOf", file);
  if (modelOf !== null && !new RegExp(`^${modelOf}-model-[b-z]$`).test(slug)) {
    fail(file, `a model of "${modelOf}" needs the slug "${modelOf}-model-b" (or -c, -d, …)`);
  }
  return {
    slug,
    title: str(data, "title", file),
    descriptionMd: trimBlank(body),
    topic: slugOrNull(data, "topic", file),
    mode,
    timeLimitSec: minutes === null ? null : minutes * 60,
    passThreshold: whole(data, "pass", file, 60, 0, 100) ?? 60,
    shuffleQuestions: flag(data, "shuffle", file, false),
    shuffleOptions: flag(data, "shuffleOptions", file, true),
    maxAttempts: whole(data, "attempts", file, null, 1, 20),
    status: statusOf(data, file),
    demo: flag(data, "demo", file, false),
    questions,
    modelOf,
  };
}

export function parseExamSource(source: string, file: string): ExamSource {
  const { data, body } = split(source, file);
  const slug = str(data, "slug", file);
  if (!SLUG.test(slug)) fail(file, `slug "${slug}" must be lower-case words joined by hyphens`);
  const scope = str(data, "scope", file, false) || "mixed_topics";
  if (scope !== "course" && scope !== "topic" && scope !== "mixed_topics") fail(file, "scope must be course, topic or mixed_topics");
  const minutes = whole(data, "time", file, null, 1, 600);
  if (minutes === null) fail(file, '"time" (minutes) is required for an exam');
  const raw = data.draw;
  if (!Array.isArray(raw) || raw.length === 0) fail(file, 'draw: list the rules, e.g. "- count: 3, type: mcq, topic: for-loops"');
  const rules = raw.map((item): ExamRuleSource => {
    const fields: Record<string, string> = {};
    for (const pair of item.split(",")) {
      const m = /^\s*([a-z]+)\s*:\s*(.+?)\s*$/.exec(pair);
      if (!m?.[1] || !m[2]) fail(file, `draw: can't read "${item}"`);
      fields[m[1]] = m[2];
    }
    const count = Number(fields.count);
    if (!Number.isInteger(count) || count < 1 || count > 100) fail(file, `draw: "${item}" needs count: 1 to 100`);
    const type = !fields.type || fields.type === "any" ? null : (fields.type as ExerciseType);
    if (type !== null && !EXERCISE_TYPES.includes(type)) fail(file, `draw: unknown type in "${item}"`);
    if (type === "write_code") fail(file, "draw: write_code can't be scored until the Phase 9 runner exists");
    const difficulty = !fields.difficulty || fields.difficulty === "any" ? null : difficultyOf(fields.difficulty, file);
    const topic = !fields.topic || fields.topic === "any" ? null : fields.topic;
    if (topic !== null && !SLUG.test(topic)) fail(file, `draw: topic in "${item}" must be a slug`);
    const points = fields.points === undefined ? 1 : Number(fields.points);
    if (!Number.isInteger(points) || points < 1 || points > 100) fail(file, `draw: points in "${item}" must be 1 to 100`);
    const unknown = Object.keys(fields).filter((k) => !["count", "type", "difficulty", "topic", "points"].includes(k));
    if (unknown.length) fail(file, `draw: unknown field(s) ${unknown.join(", ")} in "${item}"`);
    return { count, type, difficulty, topic, points };
  });
  return {
    slug,
    title: str(data, "title", file),
    descriptionMd: trimBlank(body),
    scope,
    timeLimitSec: minutes * 60,
    passThreshold: whole(data, "pass", file, 60, 0, 100) ?? 60,
    shuffleQuestions: flag(data, "shuffle", file, true),
    status: statusOf(data, file),
    demo: flag(data, "demo", file, false),
    rules,
  };
}
