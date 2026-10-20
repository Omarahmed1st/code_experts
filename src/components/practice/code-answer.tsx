"use client";

// Correct-the-code and write-the-code: an editor on the lec stage, the yellow
// Run button, and an OUTPUT box that shows each test case passing or failing.
//
// The tests run the student's code on their own device, with the same Python
// (Pyodide) and C++ (Clang to WebAssembly) runtimes as the lesson pages. That
// is feedback for practice only: browser results are never trusted for marks.
import { useCallback, useEffect, useRef, useState } from "react";
import { getRunner } from "@/components/lesson/code-runner";
import { type CompareMode, firstDifference, outputsMatch } from "@/lib/grading/output";
import { RUNTIMES, compileErrorSummary, isRunLanguage } from "@/lib/lesson/runtime";
import type { PublicTest } from "@/server/exercises/catalog";

export interface TestRun {
  name: string;
  state: "pass" | "fail";
  stdin: string;
  expected: string;
  actual: string;
  /** Why it failed, when it isn't just different output (compile error, crash, time limit). */
  why: string | null;
}

export interface TestSummary {
  passed: number;
  total: number;
  /** The code these results belong to. */
  code: string;
  runs: TestRun[];
  /** Set when nothing could be run (the runtime didn't load). */
  fatal?: string;
}

/** Runs every visible test, one after another. Stops early on a compile error (it would fail them all). */
export async function runTests(
  language: string,
  code: string,
  tests: PublicTest[],
  compare: CompareMode,
  onProgress?: (done: number) => void,
): Promise<TestSummary> {
  if (!isRunLanguage(language)) return { passed: 0, total: tests.length, code, runs: [], fatal: "This language can't run in the browser." };
  const runner = getRunner(language);
  const runs: TestRun[] = [];
  for (const test of tests) {
    let stdout = "";
    let stderr = "";
    const result = await runner.run(code, test.stdin, (stream, text) => {
      if (stream === "stdout") stdout += text;
      else if (stream === "stderr") stderr += text;
    });
    if (result.fatal) return { passed: 0, total: tests.length, code, runs, fatal: result.fatal };
    if (result.stopped === "user" || result.stopped === "replaced") {
      const why = result.stopped === "user" ? "Stopped." : "Stopped, because another code box on this page started running.";
      return { passed: runs.filter((r) => r.state === "pass").length, total: tests.length, code, runs, fatal: why };
    }
    let why: string | null = null;
    if (result.errorKind === "compile") why = `It didn't compile. ${compileErrorSummary(result.error ?? "")}\n\n${(result.error ?? "").trim()}`;
    else if (result.stopped === "timeout") why = "Still running after 10 seconds. Is there a loop that never ends?";
    else if (result.stopped === "compile-timeout") why = "Compiling took too long.";
    else if (!result.ok) why = (result.error ?? stderr).trim() || "The program crashed.";
    const pass = why === null && outputsMatch(test.stdout, stdout, { mode: compare, caseSensitive: true });
    runs.push({ name: test.name, state: pass ? "pass" : "fail", stdin: test.stdin, expected: test.stdout, actual: stdout, why });
    onProgress?.(runs.length);
    if (result.errorKind === "compile") {
      for (const rest of tests.slice(runs.length)) {
        runs.push({ name: rest.name, state: "fail", stdin: rest.stdin, expected: rest.stdout, actual: "", why: "Not run: the code doesn't compile." });
      }
      break;
    }
  }
  return { passed: runs.filter((r) => r.state === "pass").length, total: tests.length, code, runs };
}

function show(text: string): string {
  return text === "" ? "(nothing)" : text.replace(/\n$/, "");
}

export function TestResults({ summary, compare }: { summary: TestSummary; compare: CompareMode }) {
  return (
    <div className="q-tests">
      {summary.fatal ? <p className="q-test__why">{summary.fatal}</p> : null}
      {summary.runs.map((run, i) => {
        const diff = run.state === "fail" && !run.why ? firstDifference(run.expected, run.actual, { mode: compare, caseSensitive: true }) : null;
        return (
          <div key={i} className="q-test" data-state={run.state}>
            <div className="q-test__head">
              <span className="q-test__mark" aria-hidden="true">
                {run.state === "pass" ? "✓" : "✗"}
              </span>
              <span>
                <span className="sr-only">{run.state === "pass" ? "Passed: " : "Failed: "}</span>
                Test {i + 1}
                {run.name ? `: ${run.name}` : ""}
              </span>
            </div>
            {run.state === "fail" ? (
              <>
                <div className="q-test__body">
                  <div className="q-test__io q-test__io--typed">
                    <span>Typed</span>
                    <pre>{show(run.stdin)}</pre>
                  </div>
                  <div className="q-test__io">
                    <span>Expected</span>
                    <pre>{show(run.expected)}</pre>
                  </div>
                  <div className="q-test__io q-test__io--got">
                    <span>Your program printed</span>
                    <pre>{run.why && run.actual === "" ? "—" : show(run.actual)}</pre>
                  </div>
                </div>
                {run.why ? <p className="q-test__why">{run.why}</p> : null}
                {diff ? (
                  <p className="q-test__why">
                    Line {diff.line}: expected {JSON.stringify(diff.expected ?? "(no line)")}, got {JSON.stringify(diff.actual ?? "(no line)")}
                  </p>
                ) : null}
              </>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

export function CodeAnswer({
  title,
  language,
  starter,
  tests,
  compare,
  code,
  onCodeChange,
  summary,
  onSummary,
  locked,
}: {
  title: string;
  language: string;
  starter: string;
  tests: PublicTest[];
  compare: CompareMode;
  code: string;
  onCodeChange: (code: string) => void;
  summary: TestSummary | null;
  onSummary: (summary: TestSummary | null) => void;
  locked: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [pulsing, setPulsing] = useState(false);
  const mounted = useRef(true);
  useEffect(() => () => void (mounted.current = false), []);
  const info = isRunLanguage(language) ? RUNTIMES[language] : null;
  const stale = summary !== null && summary.code !== code;

  const run = useCallback(async () => {
    if (!info) return;
    setPulsing(true);
    setRunning(true);
    const runner = getRunner(language as "python" | "cpp");
    setStatus(runner.hasLoaded() ? `Running ${tests.length} test${tests.length === 1 ? "" : "s"}…` : info.firstStart);
    const result = await runTests(language, code, tests, compare, (done) => {
      if (mounted.current) setStatus(`Ran ${done} of ${tests.length} tests…`);
    });
    if (!mounted.current) return;
    setRunning(false);
    onSummary(result);
    setStatus(
      result.fatal
        ? result.fatal
        : result.passed === result.total
          ? `All ${result.total} tests pass. Ran in your browser.`
          : `${result.passed} of ${result.total} tests pass. Ran in your browser.`,
    );
  }, [code, compare, info, language, onSummary, tests]);

  const lineCount = code.split("\n").length;
  return (
    <figure className="lec-stage lec-cinema" aria-label={`Your code: ${title}`}>
      <div className="lec-stage__grid">
        <div className="lec-box">
          <div className="lec-box__head">
            <span className="lec-dot" style={{ background: "var(--lec-coral)" }} />
            <span className="lec-dot" style={{ background: "var(--lec-yel)" }} />
            <span className="lec-dot" style={{ background: "var(--lec-green)" }} />
            <span className="lec-box__label">
              <b>Input</b> · your code
            </span>
            <span className="lec-box__tools">
              {!locked ? (
                <button
                  type="button"
                  className="lec-tool"
                  onClick={() => {
                    onCodeChange(starter);
                    onSummary(null);
                    setStatus(null);
                  }}
                >
                  Reset
                </button>
              ) : null}
            </span>
          </div>
          <div className="lec-editor-wrap">
            <pre className="lec-editor__nos" aria-hidden="true">
              {Array.from({ length: lineCount }, (_, i) => i + 1).join("\n")}
            </pre>
            <textarea
              className="lec-editor"
              value={code}
              readOnly={locked}
              onChange={(e) => onCodeChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault();
                  if (!running) void run();
                } else if (e.key === "Tab" && !e.shiftKey && !locked) {
                  // Indent with Tab inside the editor; Escape then Tab leaves it (keyboard users).
                  if (e.currentTarget.dataset.escaped === "1") return;
                  e.preventDefault();
                  const el = e.currentTarget;
                  const { selectionStart: s, selectionEnd: end } = el;
                  const next = `${code.slice(0, s)}    ${code.slice(end)}`;
                  onCodeChange(next);
                  requestAnimationFrame(() => el.setSelectionRange(s + 4, s + 4));
                } else if (e.key === "Escape") {
                  e.currentTarget.dataset.escaped = "1";
                } else {
                  e.currentTarget.dataset.escaped = "";
                }
              }}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              aria-label={`Your code for "${title}". Tab indents; press Escape then Tab to leave. Control and Enter runs the tests.`}
              rows={Math.max(8, lineCount + 1)}
            />
          </div>
        </div>

        {info ? (
          <div className="lec-run-wrap">
            <button
              type="button"
              className={`lec-run${pulsing ? " is-pulsing" : ""}`}
              onClick={() => (running ? getRunner(language as "python" | "cpp").stop() : void run())}
              aria-label={running ? "Stop the tests" : `Run the ${tests.length} tests on your code`}
            >
              <span className="lec-run__ring" aria-hidden="true" onAnimationEnd={() => setPulsing(false)} />
              {running ? (
                <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              ) : (
                <PlayIcon />
              )}
            </button>
            <span className="lec-run__label" aria-hidden="true">
              {running ? "Stop" : "Run tests"}
            </span>
          </div>
        ) : null}

        <div className="lec-box">
          <div className="lec-box__head">
            <span className="lec-dot" style={{ background: "#3a4d78" }} />
            <span className="lec-dot" style={{ background: "#3a4d78" }} />
            <span className="lec-dot" style={{ background: "#3a4d78" }} />
            <span className="lec-box__label">
              <b>Output</b> · test results
            </span>
          </div>
          <div role="log" aria-live="polite" aria-label="Test results">
            {summary ? (
              <TestResults summary={summary} compare={compare} />
            ) : (
              <div className="q-tests">
                {tests.map((t, i) => (
                  <div key={i} className="q-test" data-state="todo">
                    <div className="q-test__head">
                      <span className="q-test__mark" aria-hidden="true">
                        {i + 1}
                      </span>
                      <span>Test {i + 1}{t.name ? `: ${t.name}` : ""}</span>
                    </div>
                    <div className="q-test__body">
                      <div className="q-test__io q-test__io--typed">
                        <span>Typed</span>
                        <pre>{show(t.stdin)}</pre>
                      </div>
                      <div className="q-test__io">
                        <span>Expected</span>
                        <pre>{show(t.stdout)}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <p className="lec-status">
            {status ??
              (stale
                ? "You changed the code since the last run. Press ▶ to run the tests again."
                : "Press ▶ to run the tests on your code, in your browser.")}
          </p>
        </div>
      </div>
    </figure>
  );
}
