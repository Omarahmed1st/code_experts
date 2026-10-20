// The question editor's data and its check. The editor works on an
// ExerciseSource (the shape the content files parse to); before saving, the
// question is written out as Markdown and parsed again, so a question saved in
// the admin passes exactly the rules of content/<course>/exercises/*.md
// (docs/CONTENT.md). Pure: the editor runs the same check in the browser.
import { type ExerciseSource, EXERCISE_TYPES, parseExerciseSource } from "../exercise/source.ts";
import { serializeExercise } from "../exercise/serialize.ts";
import { isAsk } from "../exercise/ask.ts";
import { COMPARE_MODES, type CompareMode } from "../grading/output.ts";

const LANGS = ["cpp", "python", "pseudocode", "text"] as const;

const text = (v: unknown, max = 20_000): string => (typeof v === "string" ? v.replace(/\r\n?/g, "\n").slice(0, max) : "");
const oneOf = <T extends string>(v: unknown, list: readonly T[], fallback: T): T => (list.includes(v as T) ? (v as T) : fallback);
const list = (v: unknown): unknown[] => (Array.isArray(v) ? v.slice(0, 60) : []);
const obj = (v: unknown): Record<string, unknown> => (v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {});

/** A blank question of a type, for "New question". */
export function blankExercise(type: ExerciseSource["type"], language: "cpp" | "python", topic: string | null): ExerciseSource {
  const code = language === "cpp" ? "#include <iostream>\nusing namespace std;\n\nint main() {\n    \n    return 0;\n}\n" : "";
  return {
    slug: "",
    type,
    title: "",
    topic,
    lesson: null,
    difficulty: "easy",
    points: 1,
    status: "draft",
    demo: false,
    updated: "2026-01-01",
    promptMd: "",
    code: type === "mcq" ? null : code,
    codeLanguage: type === "mcq" ? null : language,
    verifyCode: null,
    verifyLanguage: null,
    expectedBehaviorMd: "",
    explanationMd: "",
    settings: type === "mcq" ? { shuffle: true } : {},
    options:
      type === "mcq"
        ? [
            { labelMd: "", correct: true, feedbackMd: "" },
            { labelMd: "", correct: false, feedbackMd: "" },
          ]
        : [],
    outputs: type === "trace" ? [""] : [],
    solution: type === "correct_code" || type === "write_code" ? code : null,
    accepted: [],
    tests: type === "correct_code" || type === "write_code" ? [{ name: "Example", stdin: "", stdout: "", hidden: false }] : [],
    hints: [],
    steps: [],
  };
}

/** Whatever the browser sent, as a well-typed ExerciseSource (not yet checked). */
export function readExerciseInput(raw: unknown): ExerciseSource {
  const r = obj(raw);
  const s = obj(r.settings);
  const codeLanguage = r.codeLanguage === null ? null : oneOf(r.codeLanguage, LANGS, "python");
  const code = r.code === null || codeLanguage === null ? null : text(r.code, 30_000);
  const verifyLanguage = r.verifyLanguage === "cpp" || r.verifyLanguage === "python" ? r.verifyLanguage : null;
  const settings: ExerciseSource["settings"] = {};
  if (s.multiple === true) settings.multiple = true;
  if (s.shuffle === false) settings.shuffle = false;
  if ((COMPARE_MODES as readonly string[]).includes(s.compare as string)) settings.compare = s.compare as CompareMode;
  if (s.caseSensitive === false) settings.caseSensitive = false;
  if (s.reserved === true) settings.reserved = true;
  if (isAsk(s.ask)) settings.ask = s.ask;
  const points = Number(r.points);
  return {
    slug: text(r.slug, 100).trim().toLowerCase(),
    type: oneOf(r.type, EXERCISE_TYPES, "mcq"),
    title: text(r.title, 200).trim(),
    topic: typeof r.topic === "string" && r.topic ? r.topic : null,
    lesson: typeof r.lesson === "string" && r.lesson ? r.lesson : null,
    difficulty: oneOf(r.difficulty, ["easy", "medium", "hard"] as const, "easy"),
    points: Number.isInteger(points) ? points : 1,
    status: r.status === "published" ? "published" : "draft",
    demo: r.demo === true,
    updated: typeof r.updated === "string" && /^\d{4}-\d{2}-\d{2}$/.test(r.updated) ? r.updated : "2026-01-01",
    promptMd: text(r.promptMd).trim(),
    code,
    codeLanguage: code === null ? null : codeLanguage,
    verifyCode: verifyLanguage ? text(r.verifyCode, 30_000) || null : null,
    verifyLanguage: verifyLanguage && text(r.verifyCode) ? verifyLanguage : null,
    expectedBehaviorMd: text(r.expectedBehaviorMd).trim(),
    explanationMd: text(r.explanationMd).trim(),
    settings,
    options: list(r.options).map((o) => {
      const x = obj(o);
      return { labelMd: text(x.labelMd, 2000).trim(), correct: x.correct === true, feedbackMd: text(x.feedbackMd, 2000).trim() };
    }),
    outputs: list(r.outputs).map((o) => text(o, 10_000)),
    solution: r.solution === null ? null : text(r.solution, 30_000) || null,
    accepted: list(r.accepted).map((a) => text(a, 30_000)).filter((a) => a.trim() !== ""),
    tests: list(r.tests).map((t) => {
      const x = obj(t);
      return { name: text(x.name, 120).trim(), stdin: text(x.stdin, 10_000), stdout: text(x.stdout, 10_000), hidden: x.hidden === true };
    }),
    hints: list(r.hints).map((h) => text(h, 1000).trim()).filter(Boolean),
    steps: list(r.steps).map((st) => {
      const x = obj(st);
      const line = Number(x.line);
      const vars = obj(x.variables);
      return {
        line: x.line === null || x.line === "" || !Number.isInteger(line) ? null : line,
        explanation: text(x.explanation, 1000),
        variables: Object.fromEntries(Object.entries(vars).map(([k, v]) => [k.slice(0, 60), text(v, 200)])),
        output: text(x.output, 1000),
      };
    }),
  };
}

/** Program outputs and inputs end with a newline when they aren't empty, as the parser stores them. */
const withNewline = (s: string) => (s === "" || s.endsWith("\n") ? s : `${s}\n`);

export function normalizeOutputs(ex: ExerciseSource): ExerciseSource {
  return {
    ...ex,
    outputs: ex.outputs.map(withNewline),
    tests: ex.tests.map((t) => ({ ...t, stdin: withNewline(t.stdin), stdout: withNewline(t.stdout) })),
  };
}

export type ExerciseCheck = { ok: true; exercise: ExerciseSource; markdown: string } | { ok: false; error: string };

/** The content-file rules (docs/CONTENT.md): write the question out as Markdown and parse it back. */
export function checkExercise(ex: ExerciseSource): ExerciseCheck {
  const emptyOption = ex.options.findIndex((o) => o.labelMd === "");
  if (emptyOption !== -1) return { ok: false, error: `Option ${emptyOption + 1} is empty: write it or remove it.` };
  if (ex.type === "trace" && ex.outputs.some((o) => o.trim() === "")) return { ok: false, error: "Write the exact output the program prints in Answer." };
  let markdown: string;
  try {
    markdown = serializeExercise(normalizeOutputs(ex));
  } catch {
    return { ok: false, error: "This question can't be written out. Check its fields." };
  }
  return checkExerciseMarkdown(markdown);
}

/** Parses a question written in the content format (the editor's Markdown tab, or an imported .md file). */
export function checkExerciseMarkdown(markdown: string): ExerciseCheck {
  try {
    const exercise = parseExerciseSource(markdown.replace(/\r\n?/g, "\n"), "question");
    return { ok: true, exercise, markdown };
  } catch (error) {
    const message = error instanceof Error ? error.message.replace(/^question:\s*/, "") : "This question isn't valid.";
    return { ok: false, error: friendly(message) };
  }
}

/** The parser speaks in file terms; the editor has fields. */
function friendly(message: string): string {
  const text = message
    .replace('front matter "slug" is required', "Give the question a slug")
    .replace('front matter "title" is required', "Give the question a title")
    .replace("## Question is required", "Write the question")
    .replace("## Explanation is required: every question explains its answer", "Write the explanation: every question explains its answer")
    .replace("give a topic or a lesson (the topic then comes from the lesson)", "Choose a topic or a lecture")
    .replace("mark the correct option with [x]", "Mark the correct option");
  return text.charAt(0).toUpperCase() + text.slice(1);
}
