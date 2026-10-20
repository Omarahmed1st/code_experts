// Runs every lesson program and compares what it prints with the OUTPUT box.
//
//   node --experimental-strip-types tools/check-lesson-code.ts [part-of-a-file-name]
//
// With an argument, only lessons whose "course/file" contains it are checked.
//
// - C++ programs are compiled with g++ (-std=c++17 -Wall -Wextra) and run; warnings are shown
//   (mistake examples are allowed to trigger them).
// - Python programs run with python3 (or python on Windows).
// - Runnable Python (the in-browser Run button) may only import the standard
//   library, because the browser runtime ships without extra packages.
// - Python snippets inside the lesson text must at least parse.
// - Pseudocode doesn't run. A pseudocode program with an OUTPUT box needs a
//   ```cpp verify block (the same steps in C++); that C++ is run and compared instead.
// - Python that can't run in the browser (OpenCV, graphics.py) runs through
//   tools/lesson-runtime/run_lesson.py: no windows open, a stand-in graphics.py records
//   the drawing, and cv2.VideoCapture(0) plays a short clip instead of a camera. Such a
//   program with no OUTPUT box (it only draws or shows images) must still run without an
//   error.
// A missing compiler or package is reported as "skipped", never as a pass.
// Programs run on the author's machine, with the lesson's images copied into a
// temporary folder as the working directory. Only run it on content you trust.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseLessonSource } from "../src/lib/lesson/source.ts";
import { printedPart, splitTranscript } from "../src/lib/lesson/transcript.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = join(ROOT, "content");
const RUNTIME = join(ROOT, "tools", "lesson-runtime", "run_lesson.py");
/** Modules the lesson runtime provides itself (its stand-in for Zelle's graphics.py). */
const RUNTIME_MODULES = new Set(["graphics"]);
const TIMEOUT_MS = 20_000;
const only = process.argv[2] ?? "";

function which(candidates: string[]): string | null {
  for (const cmd of candidates) {
    const probe = spawnSync(cmd, ["--version"], { encoding: "utf8" });
    if (probe.status === 0) return cmd;
  }
  return null;
}

const python = which(["python3", "python"]);
const gxx = which(["g++", "clang++"]);
const pythonHas = (module: string) =>
  python !== null && spawnSync(python, ["-c", `import ${module}`], { encoding: "utf8" }).status === 0;
const modules = new Map<string, boolean>();

let passed = 0;
let failed = 0;
const skipped: string[] = [];

function report(ok: boolean, label: string, detail = "") {
  if (ok) passed += 1;
  else failed += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? `\n${detail}` : ""}`);
}

function showDiff(expected: string, actual: string): string {
  const e = expected.split("\n");
  const a = actual.split("\n");
  const lines: string[] = [];
  for (let i = 0; i < Math.max(e.length, a.length); i++) {
    if (e[i] !== a[i]) lines.push(`      line ${i + 1}: expected ${JSON.stringify(e[i] ?? "")}, got ${JSON.stringify(a[i] ?? "")}`);
  }
  return lines.slice(0, 8).join("\n");
}

function importsOf(code: string): string[] {
  const names = new Set<string>();
  for (const m of code.matchAll(/^\s*(?:import\s+([\w.]+)|from\s+([\w.]+)\s+import)/gm)) {
    names.add((m[1] ?? m[2] ?? "").split(".")[0] ?? "");
  }
  return [...names].filter(Boolean);
}

const stdlib: Set<string> = python
  ? new Set(
      JSON.parse(
        spawnSync(python, ["-c", "import sys, json; print(json.dumps(sorted(sys.stdlib_module_names)))"], {
          encoding: "utf8",
        }).stdout || "[]",
      ) as string[],
    )
  : new Set();

for (const courseSlug of readdirSync(CONTENT).sort()) {
  const lessonDir = join(CONTENT, courseSlug, "lessons");
  if (!existsSync(lessonDir)) continue;
  for (const name of readdirSync(lessonDir).sort()) {
    if (!name.endsWith(".md")) continue;
    const file = `${courseSlug}/${name}`;
    if (only && !file.includes(only)) continue;
    const lesson = parseLessonSource(readFileSync(join(lessonDir, name), "utf8"), file);

    lesson.sections.forEach((section) => {
      const label = `${file} › ${section.title}`;

      // Python snippets in the text must parse.
      for (const m of section.bodyMd.matchAll(/^```python[^\n]*\n([\s\S]*?)^```\s*$/gm)) {
        if (!python) continue;
        const parse = spawnSync(python, ["-c", "import ast, sys; ast.parse(sys.stdin.read())"], {
          input: m[1] ?? "",
          encoding: "utf8",
        });
        report(parse.status === 0, `${label} (snippet parses)`, parse.stderr.trim());
      }

      // "Check yourself" questions: a code block in the question and an ```output block in the answer.
      for (const check of section.bodyMd.matchAll(/^::: check[^\n]*\n([\s\S]*?)^:::\s*$/gm)) {
        const [question = "", answer = ""] = (check[1] ?? "").split(/^\?\?\?\s*$/m);
        const code = /^```(python|cpp)[^\n]*\n([\s\S]*?)^```\s*$/m.exec(question);
        const output = /^```output[^\n]*\n([\s\S]*?)^```\s*$/m.exec(answer);
        if (!code?.[1] || !code[2] || !output) continue;
        let program = code[2];
        if (code[1] === "cpp" && !/\bint\s+main\s*\(/.test(program)) {
          program = `#include <iostream>\n#include <string>\nusing namespace std;\nint main() {\n${program}return 0;\n}\n`;
        }
        runAndCompare(`${label} (check yourself)`, courseSlug, code[1], program, "", output[1] ?? "", true);
      }

      if (section.code && section.codeLanguage === "pseudocode") {
        if (section.expectedOutput === null) return;
        if (section.verifyCode === null) {
          report(false, `${label} (pseudocode output)`, "      add a ```cpp verify block: the same steps in C++, so the OUTPUT box can be checked");
          return;
        }
        runAndCompare(`${label} (pseudocode output, via its C++ twin)`, courseSlug, "cpp", section.verifyCode, section.sampleInput, section.expectedOutput);
        return;
      }
      if (!section.code || section.codeLanguage === "text") return;
      if (section.runnable) {
        const extra = importsOf(section.code).filter((m) => !stdlib.has(m));
        report(extra.length === 0, `${label} (Run button: standard library only)`, extra.length ? `      imports ${extra.join(", ")}` : "");
      }
      const offline = section.codeLanguage === "python" && !section.runnable;
      if (section.expectedOutput === null) {
        // A program that only draws or shows images: it must at least run without an error.
        if (offline) runAndCompare(`${label} (runs without error)`, courseSlug, "python", section.code, section.sampleInput, null, true);
        else skipped.push(`${label}: no OUTPUT box to compare`);
        return;
      }
      runAndCompare(`${label} (output matches)`, courseSlug, section.codeLanguage ?? "", section.code, section.sampleInput, section.expectedOutput, offline);
    });
  }
}

/**
 * Runs one program in a temporary folder holding the course's images. `expected` null
 * means there is no OUTPUT box: the program only has to finish without an error.
 * `offline` runs Python through the lesson runtime (no windows, no camera).
 */
function runAndCompare(
  label: string,
  courseSlug: string,
  language: string,
  code: string,
  input: string,
  expected: string | null,
  offline = false,
) {
  const work = mkdtempSync(join(tmpdir(), "codelab-check-"));
  try {
    const images = join(CONTENT, courseSlug, "images");
    if (existsSync(images)) cpSync(images, work, { recursive: true });
    let result;
    if (language === "cpp") {
      if (!gxx) {
        skipped.push(`${label}: no C++ compiler found`);
        return;
      }
      writeFileSync(join(work, "main.cpp"), code);
      const exe = join(work, process.platform === "win32" ? "main.exe" : "main");
      const build = spawnSync(gxx, ["-std=c++17", "-Wall", "-Wextra", "-o", exe, "main.cpp"], {
        cwd: work,
        encoding: "utf8",
      });
      if (build.status !== 0) {
        report(false, `${label} (compiles)`, build.stderr.trim());
        return;
      }
      if (build.stderr.trim()) console.log(`WARN  ${label}\n${build.stderr.trim()}`);
      result = spawnSync(exe, [], { cwd: work, input, encoding: "utf8", timeout: TIMEOUT_MS });
    } else {
      if (!python) {
        skipped.push(`${label}: no Python found`);
        return;
      }
      const missing = importsOf(code).filter(
        (m) => !stdlib.has(m) && !(offline && RUNTIME_MODULES.has(m)) && !(modules.get(m) ?? modules.set(m, pythonHas(m)).get(m)),
      );
      if (missing.length > 0) {
        skipped.push(`${label}: Python package(s) not installed: ${missing.join(", ")}`);
        return;
      }
      writeFileSync(join(work, "main.py"), code);
      const args = offline ? ["-I", RUNTIME, "main.py"] : ["-I", "main.py"];
      result = spawnSync(python, args, { cwd: work, input, encoding: "utf8", timeout: TIMEOUT_MS });
    }
    const stdout = (result.stdout ?? "").replace(/\r\n/g, "\n");
    if (expected === null) {
      const ok = result.status === 0;
      report(ok, label, ok ? "" : `      exit ${result.status}: ${(result.stderr ?? "").trim().slice(-400)}`);
      return;
    }
    // The OUTPUT box is a terminal transcript: every typed line must appear in it
    // (echoed where it was read), and the rest must be exactly what was printed.
    const inputLines = input === "" ? 0 : input.replace(/\n$/, "").split("\n").length;
    const echoed = splitTranscript(expected, input).filter((p) => p.typed).length;
    const printed = printedPart(expected, input);
    const ok = result.status === 0 && echoed === inputLines && stdout === printed;
    report(
      ok,
      label,
      ok
        ? ""
        : result.status !== 0
          ? `      exit ${result.status}: ${(result.stderr ?? "").trim().slice(0, 400)}`
          : echoed !== inputLines
            ? `      the OUTPUT box shows ${echoed} of the ${inputLines} typed line(s); show each where the program reads it`
            : showDiff(printed, stdout),
    );
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

console.log(`\n${passed} passed, ${failed} failed, ${skipped.length} skipped`);
for (const s of skipped) console.log(`SKIP  ${s}`);
process.exit(failed > 0 ? 1 : 0);
