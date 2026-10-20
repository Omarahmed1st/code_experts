// Runs the code in every exercise and proves the answer keys are right.
//
//   node --experimental-strip-types tools/check-exercise-code.ts [part-of-a-file-name]
//
// With an argument, only questions whose "course/exercises/file" contains it are checked.
//
// - trace: the program really prints the answer (pseudocode: its ```cpp verify twin does),
//          and the Output column of the Steps table adds up to the same text.
// - mcq:   when ## Answer has an ```output block, the program prints exactly that.
// - correct_code: the broken program really fails (doesn't compile, crashes, or fails a
//          test), and the solution and every accepted fix pass every test.
// - write_code: the starter code compiles (or parses), and the solution passes every test.
// - Python that students run in the browser may only import the standard library.
// - Python that only students read (mcq, trace) may use OpenCV or graphics.py: it runs
//   through tools/lesson-runtime/run_lesson.py, as the lecture programs do (no windows,
//   a stand-in graphics.py that records the drawing instead of opening a window).
//
// C++ is compiled with g++ -std=c++17 -Wall -Wextra (as for lessons), Python runs
// with python3 -I. A missing compiler is reported as "skipped", never as a pass.
// Only run it on content you trust: the programs run on your machine.
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { type ExerciseSource, parseExerciseSource } from "../src/lib/exercise/source.ts";
import { type CompareOptions, firstDifference, outputsMatch } from "../src/lib/grading/output.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = join(ROOT, "content");
const TIMEOUT_MS = 5_000;
const RUNTIME = join(ROOT, "tools", "lesson-runtime", "run_lesson.py");
const only = process.argv[2] ?? "";
/** Imports that need the lesson runtime: OpenCV opens windows, graphics.py is its stand-in. */
const RUNTIME_IMPORTS = new Set(["cv2", "graphics"]);
const EXACT: CompareOptions = { mode: "exact", caseSensitive: true };

function which(candidates: string[]): string | null {
  for (const cmd of candidates) {
    if (spawnSync(cmd, ["--version"], { encoding: "utf8" }).status === 0) return cmd;
  }
  return null;
}
const python = which(["python3", "python"]);
const gxx = which(["g++", "clang++"]);
const stdlib: Set<string> = python
  ? new Set(
      JSON.parse(
        spawnSync(python, ["-c", "import sys, json; print(json.dumps(sorted(sys.stdlib_module_names)))"], { encoding: "utf8" })
          .stdout || "[]",
      ) as string[],
    )
  : new Set();

let passed = 0;
let failed = 0;
const skipped: string[] = [];

function report(ok: boolean, label: string, detail = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${!ok && detail ? `\n      ${detail.replace(/\n/g, "\n      ")}` : ""}`);
}

interface Built {
  /** Run with this stdin; null result means it couldn't run at all. */
  run(stdin: string): { status: number | null; stdout: string; stderr: string; timedOut: boolean };
  dispose(): void;
}

/** Compiles (C++) or prepares (Python) a program. Returns an error string when it doesn't compile or parse. */
function build(language: "cpp" | "python", code: string): Built | { error: string } | null {
  const work = mkdtempSync(join(tmpdir(), "codelab-ex-"));
  const dispose = () => rmSync(work, { recursive: true, force: true });
  if (language === "cpp") {
    if (!gxx) return (dispose(), null);
    writeFileSync(join(work, "main.cpp"), code);
    const exe = join(work, process.platform === "win32" ? "main.exe" : "main");
    const compiled = spawnSync(gxx, ["-std=c++17", "-Wall", "-Wextra", "-o", exe, "main.cpp"], { cwd: work, encoding: "utf8" });
    if (compiled.status !== 0) {
      dispose();
      return { error: compiled.stderr.trim() };
    }
    return {
      run(stdin) {
        const r = spawnSync(exe, [], { cwd: work, input: stdin, encoding: "utf8", timeout: TIMEOUT_MS });
        return { status: r.status, stdout: (r.stdout ?? "").replace(/\r\n/g, "\n"), stderr: r.stderr ?? "", timedOut: r.error?.message.includes("ETIMEDOUT") ?? false };
      },
      dispose,
    };
  }
  if (!python) return (dispose(), null);
  writeFileSync(join(work, "main.py"), code);
  const args = importsOf(code).some((m) => RUNTIME_IMPORTS.has(m)) ? ["-I", RUNTIME, "main.py"] : ["-I", "main.py"];
  const parsed = spawnSync(python, ["-I", "-c", "import ast, sys; ast.parse(open('main.py').read())"], { cwd: work, encoding: "utf8" });
  if (parsed.status !== 0) {
    dispose();
    return { error: parsed.stderr.trim() };
  }
  return {
    run(stdin) {
      const r = spawnSync(python, args, { cwd: work, input: stdin, encoding: "utf8", timeout: TIMEOUT_MS });
      return { status: r.status, stdout: (r.stdout ?? "").replace(/\r\n/g, "\n"), stderr: r.stderr ?? "", timedOut: r.error?.message.includes("ETIMEDOUT") ?? false };
    },
    dispose,
  };
}

function importsOf(code: string): string[] {
  const names = new Set<string>();
  for (const m of code.matchAll(/^\s*(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import)/gm)) {
    names.add((m[1] ?? m[2] ?? "").split(".")[0] ?? "");
  }
  return [...names].filter(Boolean);
}

/** Runs a program on every test. Returns the first problem, or null when all pass. */
function failsTests(ex: ExerciseSource, language: "cpp" | "python", code: string): string | null | "skip" {
  const built = build(language, code);
  if (built === null) return "skip";
  if ("error" in built) return `doesn't compile:\n${built.error.slice(0, 600)}`;
  try {
    const compare: CompareOptions = { mode: ex.settings.compare ?? "trim_trailing", caseSensitive: true };
    for (const test of ex.tests) {
      const r = built.run(test.stdin);
      if (r.timedOut) return `test "${test.name}": still running after ${TIMEOUT_MS / 1000} s`;
      if (r.status !== 0) return `test "${test.name}": exit ${r.status} ${r.stderr.trim().slice(0, 300)}`;
      if (!outputsMatch(test.stdout, r.stdout, compare)) {
        const d = firstDifference(test.stdout, r.stdout, compare);
        return `test "${test.name}": line ${d?.line}: expected ${JSON.stringify(d?.expected)}, got ${JSON.stringify(d?.actual)}`;
      }
    }
    return null;
  } finally {
    built.dispose();
  }
}

function checkPrints(label: string, language: "cpp" | "python", code: string, expected: string) {
  const built = build(language, code);
  if (built === null) return skipped.push(`${label}: no ${language === "cpp" ? "C++ compiler" : "Python"} found`);
  if ("error" in built) return report(false, label, `doesn't compile:\n${built.error.slice(0, 600)}`);
  try {
    const r = built.run("");
    const d = firstDifference(expected, r.stdout, EXACT);
    report(r.status === 0 && d === null, label, r.status !== 0 ? `exit ${r.status}: ${r.stderr.trim().slice(0, 300)}` : `line ${d?.line}: answer says ${JSON.stringify(d?.expected)}, program printed ${JSON.stringify(d?.actual)}`);
  } finally {
    built.dispose();
  }
}

function checkExercise(ex: ExerciseSource, file: string) {
  const label = `${file} (${ex.type})`;
  const lang = ex.codeLanguage === "cpp" || ex.codeLanguage === "python" ? ex.codeLanguage : null;

  for (const program of [ex.code, ex.solution, ...ex.accepted]) {
    if (program && lang === "python" && ex.type !== "mcq" && ex.type !== "trace") {
      const extra = importsOf(program).filter((m) => !stdlib.has(m));
      if (extra.length) report(false, `${label} browser Python: standard library only`, `imports ${extra.join(", ")}`);
    }
  }

  switch (ex.type) {
    case "mcq":
      if (ex.outputs[0] !== undefined && lang && ex.code) checkPrints(`${label} prints its ## Answer`, lang, ex.code, ex.outputs[0]);
      return;
    case "trace": {
      const answer = ex.outputs[0] ?? "";
      if (ex.settings.ask === "count" || ex.settings.ask === "value") {
        // The answer is a number or value, not the program's output: the verify copy prints it.
        if (ex.verifyCode && ex.verifyLanguage) checkPrints(`${label} answer (printed by the verify program)`, ex.verifyLanguage, ex.verifyCode, answer);
        if (lang && ex.code) {
          const built = build(lang, ex.code);
          if (built === null) skipped.push(`${label}: no ${lang} toolchain`);
          else {
            report(!("error" in built), `${label} the shown code ${lang === "cpp" ? "compiles" : "parses"}`, "error" in built ? built.error.slice(0, 600) : "");
            if (!("error" in built)) built.dispose();
          }
        }
      } else if (ex.codeLanguage === "pseudocode") {
        if (ex.verifyCode) checkPrints(`${label} answer (via the C++ verify twin)`, "cpp", ex.verifyCode, answer);
      } else if (lang && ex.code) {
        checkPrints(`${label} answer is what the program prints`, lang, ex.code, answer);
      }
      if (!ex.settings.ask && ex.steps.some((s) => s.output !== "")) {
        const total = ex.steps.map((s) => s.output).join("");
        const d = firstDifference(answer, total, EXACT);
        report(d === null, `${label} Steps output adds up to the answer`, `line ${d?.line}: answer ${JSON.stringify(d?.expected)}, steps ${JSON.stringify(d?.actual)}`);
      }
      return;
    }
    case "correct_code": {
      if (!lang || !ex.code || !ex.solution) return;
      // Blanks and put-in-order have no runnable "broken" program: only the solutions are run.
      if (!ex.settings.ask) {
        const broken = failsTests(ex, lang, ex.code);
        if (broken === "skip") return skipped.push(`${label}: no ${lang} toolchain`);
        report(broken !== null, `${label} the broken code really fails`, "the code to correct passes every test: it isn't broken, or the tests miss the bug");
      }
      ([ex.solution, ...ex.accepted] as string[]).forEach((program, i) => {
        const problem = failsTests(ex, lang, program);
        if (problem === "skip") return;
        report(problem === null, `${label} ${i === 0 ? "solution" : `accepted fix ${i}`} passes every test`, problem ?? "");
      });
      return;
    }
    case "write_code": {
      if (!lang || !ex.code || !ex.solution) return;
      const starter = build(lang, ex.code);
      if (starter === null) return skipped.push(`${label}: no ${lang} toolchain`);
      report(!("error" in starter), `${label} starter code ${lang === "cpp" ? "compiles" : "parses"}`, "error" in starter ? starter.error.slice(0, 600) : "");
      if (!("error" in starter)) starter.dispose();
      const problem = failsTests(ex, lang, ex.solution);
      if (problem !== "skip") report(problem === null, `${label} solution passes every test`, problem ?? "");
      return;
    }
  }
}

for (const courseSlug of readdirSync(CONTENT).sort()) {
  const dir = join(CONTENT, courseSlug, "exercises");
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md")) continue;
    const file = `${courseSlug}/exercises/${name}`;
    if (only && !file.includes(only)) continue;
    try {
      checkExercise(parseExerciseSource(readFileSync(join(dir, name), "utf8"), file), file);
    } catch (error) {
      report(false, file, error instanceof Error ? error.message : String(error));
    }
  }
}

console.log(`\nExercises: ${passed} passed, ${failed} failed, ${skipped.length} skipped`);
for (const s of skipped) console.log(`SKIP  ${s}`);
process.exit(failed > 0 ? 1 : 0);
