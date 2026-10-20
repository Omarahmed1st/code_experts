// Writes exercises, quizzes and practice exams back to the Markdown format the
// parsers in ./source.ts read (docs/CONTENT.md). The admin uses this two ways:
//   - to check an edited question with exactly the rules of the content files
//     (serialize, then parseExerciseSource), and
//   - for "Export as Markdown" and the import/export of question collections.
// Pure.
import type { ExamSource, ExerciseSource, QuizSource, TraceStepSource } from "./source.ts";
import { fence, fmList, fmValue, withoutFinalNewline } from "../content/markdown-out.ts";

function stepCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function stepsTable(steps: readonly TraceStepSource[]): string {
  const rows = steps.map((s) => {
    const vars = Object.entries(s.variables)
      .map(([name, value]) => `${name} = ${value}`)
      .join("; ");
    const output = s.output.replace(/\n/g, "\\n");
    // Backticks keep spaces at the edges of an output ("Add tea ").
    const outCell = output !== output.trim() || /^`|`$/.test(output) ? `\`${output}\`` : output;
    return `| ${s.line ?? ""} | ${stepCell(s.explanation)} | ${stepCell(vars)} | ${stepCell(outCell)} |`;
  });
  return ["| Line | What happens | Variables | Output |", "|---|---|---|---|", ...rows].join("\n");
}

export function serializeExercise(ex: ExerciseSource): string {
  const s = ex.settings;
  const forcedCompare = s.ask === "count" || s.ask === "value";
  const front = [
    "---",
    `slug: ${ex.slug}`,
    `type: ${ex.type}`,
    ...(s.ask ? [`ask: ${s.ask}`] : []),
    `title: ${fmValue(ex.title)}`,
    ...(ex.lesson ? [`lesson: ${ex.lesson}`] : []),
    ...(ex.topic ? [`topic: ${ex.topic}`] : []),
    `difficulty: ${ex.difficulty}`,
    ...(ex.points !== 1 ? [`points: ${ex.points}`] : []),
    ...(s.multiple ? ["multiple: true"] : []),
    ...(ex.type === "mcq" && s.shuffle === false ? ["shuffle: false"] : []),
    ...(s.compare && s.compare !== "trim_trailing" && !forcedCompare ? [`compare: ${s.compare}`] : []),
    ...(ex.type === "trace" && s.caseSensitive === false ? ["case: insensitive"] : []),
    ...(s.reserved ? ["reserved: true"] : []),
    `updated: ${ex.updated}`,
    ...(ex.status === "draft" ? ["status: draft"] : []),
    ...(ex.demo ? ["demo: true"] : []),
    "---",
    "",
  ];
  const parts: string[] = ["## Question", "", ex.promptMd, ""];
  if (ex.code !== null && ex.codeLanguage) {
    parts.push("## Code", "", fence(ex.codeLanguage, ex.code), "");
    if (ex.verifyCode !== null && ex.verifyLanguage) parts.push(fence(`${ex.verifyLanguage} verify`, ex.verifyCode), "");
  }
  if (ex.options.length > 0) {
    parts.push("## Options", "");
    for (const option of ex.options) {
      parts.push(`- [${option.correct ? "x" : " "}] ${option.labelMd.replace(/\s*\n\s*/g, " ")}`);
      if (option.feedbackMd) parts.push(`  ${option.feedbackMd.replace(/\s*\n\s*/g, " ")}`);
    }
    parts.push("");
  }
  if (ex.outputs.length > 0) {
    parts.push("## Answer", "");
    for (const output of ex.outputs) parts.push(fence("output", withoutFinalNewline(output)), "");
  }
  if (ex.expectedBehaviorMd) parts.push("## Expected behavior", "", ex.expectedBehaviorMd, "");
  if (ex.tests.length > 0) {
    parts.push("## Tests", "");
    for (const test of ex.tests) {
      parts.push(`### ${test.name || "Test"}${test.hidden ? " (hidden)" : ""}`, "");
      if (test.stdin !== "") parts.push(fence("input", withoutFinalNewline(test.stdin)), "");
      parts.push(fence("output", withoutFinalNewline(test.stdout)), "");
    }
  }
  // Put-in-order questions take their solution from ## Code.
  if (ex.solution !== null && s.ask !== "order") parts.push("## Solution", "", fence(ex.codeLanguage ?? "", ex.solution), "");
  if (ex.accepted.length > 0) {
    parts.push("## Also accepted", "");
    for (const program of ex.accepted) parts.push(fence(ex.codeLanguage ?? "", program), "");
  }
  if (ex.hints.length > 0) parts.push("## Hints", "", ...ex.hints.map((h) => `- ${h.replace(/\s*\n\s*/g, " ")}`), "");
  parts.push("## Explanation", "", ex.explanationMd, "");
  if (ex.steps.length > 0) parts.push("## Steps", "", stepsTable(ex.steps), "");
  return `${front.join("\n")}${parts.join("\n")}`.replace(/\n+$/, "\n");
}

export function serializeQuiz(quiz: QuizSource): string {
  const front = [
    "---",
    `slug: ${quiz.slug}`,
    `title: ${fmValue(quiz.title)}`,
    ...(quiz.modelOf ? [`modelOf: ${quiz.modelOf}`] : []),
    ...(quiz.modelOf
      ? []
      : [
          `mode: ${quiz.mode}`,
          ...(quiz.timeLimitSec !== null ? [`time: ${Math.round(quiz.timeLimitSec / 60)}`] : []),
          `pass: ${quiz.passThreshold}`,
          `shuffle: ${quiz.shuffleQuestions}`,
          `shuffleOptions: ${quiz.shuffleOptions}`,
          ...(quiz.maxAttempts !== null ? [`attempts: ${quiz.maxAttempts}`] : []),
          ...(quiz.topic ? [`topic: ${quiz.topic}`] : []),
          ...(quiz.status === "draft" ? ["status: draft"] : []),
          ...(quiz.demo ? ["demo: true"] : []),
        ]),
    ...fmList(
      "questions",
      quiz.questions.map((q) => (q.points === 1 ? q.slug : `${q.slug} | ${q.points}`)),
    ),
    "---",
    "",
  ];
  return `${front.join("\n")}${quiz.descriptionMd ? `${quiz.descriptionMd}\n` : ""}`;
}

export function serializeExam(exam: ExamSource): string {
  const rules = exam.rules.map((r) =>
    [
      `count: ${r.count}`,
      ...(r.type ? [`type: ${r.type}`] : []),
      ...(r.topic ? [`topic: ${r.topic}`] : []),
      ...(r.difficulty ? [`difficulty: ${r.difficulty}`] : []),
      ...(r.points !== 1 ? [`points: ${r.points}`] : []),
    ].join(", "),
  );
  const front = [
    "---",
    `slug: ${exam.slug}`,
    `title: ${fmValue(exam.title)}`,
    `time: ${Math.round(exam.timeLimitSec / 60)}`,
    `pass: ${exam.passThreshold}`,
    `shuffle: ${exam.shuffleQuestions}`,
    `scope: ${exam.scope}`,
    ...(exam.status === "draft" ? ["status: draft"] : []),
    ...(exam.demo ? ["demo: true"] : []),
    ...fmList("draw", rules),
    "---",
    "",
  ];
  return `${front.join("\n")}${exam.descriptionMd ? `${exam.descriptionMd}\n` : ""}`;
}
