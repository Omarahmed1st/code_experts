"use client";

// The lec-style stage for one lesson program: the INPUT box (the code, with
// note chips and index strips), the yellow Run button, and the OUTPUT box.
//
// - Python and C++ marked "runnable" really run, in the student's browser
//   (Pyodide for Python; C++ is compiled to WebAssembly and run). The student
//   can edit the code and type keyboard input.
// - Other programs (OpenCV, graphics.py) can't run in a browser. Their OUTPUT box shows
//   the output we recorded by running them (tools/check-lesson-code.ts), and the
//   button replays it. The status line says so; nothing pretends to execute.
// - Pseudocode never runs. Its OUTPUT box is what the same steps printed when
//   written in C++ and run by the checker, and the status line says that.
// - Without JavaScript everything is still there: the code, the notes and the
//   recorded output are server-rendered.
import {
  type CSSProperties,
  Fragment,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { StageLine, StageRow } from "@/lib/lesson/stage";
import {
  COMPILE_TIMEOUT_MS,
  RUN_TIMEOUT_MS,
  RUNTIMES,
  cleanTraceback,
  compileErrorSummary,
  errorSummary,
  firstWarning,
  isRunLanguage,
  readsInput,
} from "@/lib/lesson/runtime";
import { splitTranscript } from "@/lib/lesson/transcript";
import { getRunner } from "./code-runner";

export interface LecStageProps {
  title: string;
  language: string;
  code: string;
  lines: StageLine[];
  runnable: boolean;
  sampleInput: string;
  expectedOutput: string | null;
  /** Side-by-side boxes on wide screens (short lines only). */
  wide: boolean;
  /** Language tabs at the top of the INPUT box (the home page's Python / C++ choice). */
  tabs?: StageTabs;
}

export interface StageTabs {
  items: { key: string; label: string }[];
  active: string;
  onSelect: (key: string) => void;
}

type PieceKind = "out" | "err" | "typed";

interface Piece {
  text: string;
  /** "typed": a line of keyboard input, echoed where the program read it, as a terminal shows it. */
  kind: PieceKind;
}

type Phase = "idle" | "starting" | "running" | "replaying";

/** The OUTPUT box's label, after "Output ·". */
const OUTPUT_LABEL: Record<string, string> = {
  python: "what Python prints",
  cpp: "what the program prints",
  pseudocode: "what the steps print",
  text: "what the program prints",
};

const PSEUDOCODE_STATUS =
  "Pseudocode doesn't run on a computer. This is what the same steps printed when we wrote them in C++ and ran them.";

const css = (vars: Record<string, string | number>) => vars as CSSProperties;

/** The recorded transcript as pieces, with the typed lines marked. */
function transcriptPieces(transcript: string, input: string): Piece[] {
  return splitTranscript(transcript, input).map((part) => ({ text: part.text, kind: part.typed ? "typed" : "out" }));
}

/** The first `count` characters of a list of pieces. */
function firstChars(pieces: Piece[], count: number): Piece[] {
  const shown: Piece[] = [];
  let left = count;
  for (const piece of pieces) {
    if (left <= 0) break;
    shown.push({ text: piece.text.slice(0, left), kind: piece.kind });
    left -= piece.text.length;
  }
  return shown;
}

function appendPiece(pieces: Piece[], text: string, kind: PieceKind): Piece[] {
  const last = pieces[pieces.length - 1];
  if (last && last.kind === kind) return [...pieces.slice(0, -1), { text: last.text + text, kind }];
  return [...pieces, { text, kind }];
}

function Shape({ shape }: { shape: string }) {
  return <i aria-hidden="true" className={`lec-shape lec-shape--${shape}`} />;
}

function Strip({ strip }: { strip: NonNullable<StageRow["strip"]> }) {
  const count = strip.items.length;
  return (
    <ol
      className={`lec-strip lec-strip--${strip.kind}`}
      aria-label={strip.kind === "chr" ? "Characters and their indexes" : "Items and their indexes"}
    >
      {strip.items.map((item, i) => (
        <li key={`${i}-${item}`} className="lec-cell">
          <span className="lec-cell__box">{item}</span>
          <span className="lec-cell__index">
            <span className="sr-only">index </span>
            {i}
          </span>
          {strip.negative ? (
            <span className="lec-cell__neg">
              <span className="sr-only">or </span>
              {i - count}
            </span>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M7 4.5v15l13-7.5z" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <rect x="6" y="6" width="12" height="12" rx="2" />
    </svg>
  );
}

/** Editor-style tabs; arrow keys move between them (the WAI-ARIA tabs pattern). */
function Tabs({ tabs }: { tabs: StageTabs }) {
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = tabs.items.findIndex((t) => t.key === tabs.active);
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const to =
      event.key === "Home" ? 0 : event.key === "End" ? tabs.items.length - 1 : step ? (i + step + tabs.items.length) % tabs.items.length : -1;
    if (to < 0) return;
    event.preventDefault();
    tabs.onSelect(tabs.items[to]!.key);
  };
  return (
    <div className="lec-tabs" role="tablist" aria-label="Language">
      {tabs.items.map((tab) => {
        const on = tab.key === tabs.active;
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            data-tab={tab.key}
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            className="lec-tab"
            onClick={() => tabs.onSelect(tab.key)}
            onKeyDown={onKeyDown}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}

export function LecStage({ title, language, code, lines, runnable, sampleInput, expectedOutput, wide, tabs }: LecStageProps) {
  const stageRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(code);
  const [stdin, setStdin] = useState(sampleInput);
  const [pieces, setPieces] = useState<Piece[] | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const stdinId = useId();
  const [fly, setFly] = useState<{ d: string; len: number; key: number } | null>(null);
  const replayTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // The language this stage really runs, or null when it only shows recorded output.
  const runLanguage = runnable && isRunLanguage(language) ? language : null;
  const canRun = runLanguage !== null || expectedOutput !== null;
  const showsStdin = sampleInput !== "" || (runLanguage !== null && readsInput(language, editing ? draft : code));
  const busy = phase !== "idle";
  const outputLabel = OUTPUT_LABEL[language] ?? "what the program prints";

  // The code types itself the first time the stage scrolls into view (not if it's
  // already on screen when the page loads, not behind a tab that isn't selected,
  // and never with reduced motion).
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (stage.getClientRects().length === 0) return;
    const rect = stage.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) return;
    stage.dataset.typing = "waiting";
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          stage.dataset.typing = "on";
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => {
    if (replayTimer.current) clearInterval(replayTimer.current);
  }, []);

  // Like a terminal: while output arrives, keep the newest line in view, unless
  // the student has scrolled up to read something. A layout effect, so each
  // update is scrolled before the browser reports the scroll (see onScroll).
  const followOutput = useRef(true);
  const lastOutputTop = useRef(0);
  useLayoutEffect(() => {
    const box = outputRef.current?.querySelector<HTMLElement>(".lec-output");
    if (box && followOutput.current) {
      box.scrollTop = box.scrollHeight;
      lastOutputTop.current = box.scrollTop;
    }
  }, [pieces]);

  // Each run gets a number, so a run that was replaced never updates the stage.
  const runSeq = useRef(0);

  const launch = useCallback(() => {
    setPulsing(true);
    const stage = stageRef.current;
    const from = inputRef.current;
    const to = outputRef.current;
    if (!stage || !from || !to) return;
    const s = stage.getBoundingClientRect();
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    let d: string;
    if (b.left >= a.right - 4) {
      const x1 = a.right - s.left - 8;
      const y1 = a.top - s.top + Math.min(a.height / 2, 120);
      const x2 = b.left - s.left + 18;
      const y2 = b.top - s.top + 60;
      const mx = (x1 + x2) / 2;
      d = `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`;
    } else {
      const x1 = a.left - s.left + a.width * 0.7;
      const y1 = a.bottom - s.top - 6;
      const x2 = b.left - s.left + 40;
      const y2 = b.top - s.top + 30;
      const my = (y1 + y2) / 2;
      d = `M${x1} ${y1} C${x1} ${my} ${x2} ${my} ${x2} ${y2}`;
    }
    setFly({ d, len: Math.ceil(Math.hypot(b.left - a.right, b.top - a.top) + 400), key: Date.now() });
  }, []);

  const replay = useCallback(() => {
    if (expectedOutput === null) return;
    launch();
    if (replayTimer.current) clearInterval(replayTimer.current);
    setPhase("replaying");
    setStatus("Showing the recorded output…");
    followOutput.current = true;
    const all = transcriptPieces(expectedOutput, sampleInput);
    const total = expectedOutput.length;
    let shown = 0;
    const step = Math.max(1, Math.ceil(total / 60));
    setPieces([]);
    replayTimer.current = setInterval(() => {
      shown = Math.min(total, shown + step);
      setPieces(firstChars(all, shown));
      if (shown >= total) {
        if (replayTimer.current) clearInterval(replayTimer.current);
        replayTimer.current = null;
        setPhase("idle");
        setStatus(
          language === "pseudocode"
            ? PSEUDOCODE_STATUS
            : "Recorded output: this is exactly what the program printed when we ran it.",
        );
      }
    }, 25);
  }, [expectedOutput, language, launch, sampleInput]);

  const run = useCallback(async () => {
    if (!runLanguage) return;
    const mine = ++runSeq.current;
    const runner = getRunner(runLanguage);
    const info = RUNTIMES[runLanguage];
    launch();
    followOutput.current = true;
    setPieces([]);
    setPhase(runner.hasLoaded() ? "running" : "starting");
    setStatus(runner.hasLoaded() ? (info.programWorkerUrl ? "Compiling…" : "Running…") : info.firstStart);
    const unsubscribe = runner.subscribe((s) => {
      if (s === "compiling" || s === "running") {
        setPhase("running");
        setStatus(s === "compiling" ? "Compiling…" : "Running…");
      }
    });
    const result = await runner.run(editing ? draft : code, stdin, (stream, text) => {
      setPieces((prev) => appendPiece(prev ?? [], text, stream === "stderr" ? "err" : stream === "stdin" ? "typed" : "out"));
    });
    unsubscribe();
    if (mine !== runSeq.current) return;
    setPhase("idle");
    const ranOutOfInput =
      runLanguage === "cpp" ? " It read past the end of the keyboard input, so its last read got nothing." : "";
    if (result.ok) {
      setPieces((prev) => (prev && prev.length > 0 ? prev : [{ text: "(the program printed nothing)\n", kind: "out" }]));
      const ms = (n?: number) => Math.max(1, Math.round(n ?? 0));
      const ran =
        result.compileMs !== undefined
          ? `Compiled in ${ms(result.compileMs)} ms and ran in ${ms(result.ms)} ms, in your browser.`
          : `Ran in your browser in ${ms(result.ms)} ms.`;
      const exit = result.exitCode ? ` main() returned ${result.exitCode}.` : "";
      const warning = result.warnings ? firstWarning(result.warnings) : null;
      setStatus(`${ran}${exit}${result.inputEnded ? ranOutOfInput : ""}${warning ? ` Compiler warning: ${warning}` : ""}`);
      return;
    }
    setShaking(true);
    if (result.fatal) {
      setPieces((prev) => appendPiece(prev ?? [], `${result.fatal}\n`, "err"));
      setStatus(`${info.name} couldn't start. Reload the page to try again.`);
    } else if (result.stopped === "compile-timeout") {
      setPieces((prev) => appendPiece(prev ?? [], `Compiling took more than ${COMPILE_TIMEOUT_MS / 1000} seconds, so it was stopped.\n`, "err"));
      setStatus("Stopped while compiling. Press ▶ to try again.");
    } else if (result.stopped === "timeout") {
      setPieces((prev) =>
        appendPiece(prev ?? [], `\nStopped after ${RUN_TIMEOUT_MS / 1000} seconds. Is there a loop that never ends?\n`, "err"),
      );
      setStatus("Stopped by the time limit.");
    } else if (result.stopped === "user") {
      setPieces((prev) => appendPiece(prev ?? [], "\nStopped.\n", "err"));
      setStatus("You stopped the program.");
    } else if (result.stopped === "replaced") {
      setPieces((prev) => appendPiece(prev ?? [], "\nStopped.\n", "err"));
      setStatus("Stopped, because another code box on this page started running.");
    } else if (result.error && result.errorKind === "compile") {
      // Nothing ran: the OUTPUT box shows the compiler's messages instead.
      setPieces([{ text: `${result.error.replace(/\s+$/, "")}\n`, kind: "err" }]);
      setStatus(`The code didn't compile. ${compileErrorSummary(result.error)}`);
    } else if (result.error && runLanguage === "cpp") {
      setPieces((prev) => {
        const before = prev ?? [];
        const midLine = before.length > 0 && !before[before.length - 1]!.text.endsWith("\n");
        return appendPiece(before, `${midLine ? "\n" : ""}${result.error!.replace(/\s+$/, "")}\n`, "err");
      });
      setStatus(`The program crashed. ${errorSummary(result.error)}${result.inputEnded ? ranOutOfInput : ""}`);
    } else if (result.error) {
      const summary = errorSummary(result.error);
      // Start the error on its own line, even if the program was mid-line (after a prompt).
      setPieces((prev) => {
        const before = prev ?? [];
        const midLine = before.length > 0 && !before[before.length - 1]!.text.endsWith("\n");
        return appendPiece(before, `${midLine ? "\n" : ""}${cleanTraceback(result.error ?? "")}\n`, "err");
      });
      setStatus(
        summary.startsWith("EOFError")
          ? "The program asked for more input than the keyboard box has. Add a line there and run again."
          : `The program stopped with an error: ${summary}`,
      );
    }
  }, [code, draft, editing, launch, runLanguage, stdin]);

  const onButton = () => {
    if (phase === "running" || phase === "starting") {
      if (runLanguage) getRunner(runLanguage).stop();
      return;
    }
    if (runLanguage) void run();
    else replay();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(editing ? draft : code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  const reset = () => {
    setEditing(false);
    setDraft(code);
    setStdin(sampleInput);
    setPieces(null);
    setStatus(null);
  };

  // What the OUTPUT box shows before anyone presses Run.
  const initial: Piece[] | null = expectedOutput !== null ? transcriptPieces(expectedOutput, sampleInput) : null;
  const shown = pieces ?? initial;
  const idleStatus = runLanguage
    ? expectedOutput !== null
      ? "Expected output. Press ▶ to run the code in your browser."
      : "Press ▶ to run the code in your browser."
    : language === "pseudocode"
      ? PSEUDOCODE_STATUS
      : language === "python"
        ? "Recorded output: we ran this program and this is exactly what it printed. Programs that use OpenCV or open a window need a real computer, so they don't run in the browser."
        : "Recorded output: we ran this program and this is exactly what it printed.";
  const runLabel =
    phase === "running" || phase === "starting" ? "Stop" : runLanguage ? "Run" : "Show output";

  return (
    <figure
      ref={stageRef}
      className={`lec-stage lec-cinema${wide ? " lec-stage--wide" : ""}`}
      aria-label={title}
      style={{ position: "relative" }}
    >
      <div className="lec-stage__grid">
        <div ref={inputRef} className="lec-box">
          {tabs ? <Tabs tabs={tabs} /> : null}
          <div className="lec-box__head">
            <span className="lec-dot" style={{ background: "var(--lec-coral)" }} />
            <span className="lec-dot" style={{ background: "var(--lec-yel)" }} />
            <span className="lec-dot" style={{ background: "var(--lec-green)" }} />
            <span className="lec-box__label">
              <b>Input</b> · your code
            </span>
            <span className="lec-box__tools">
              <button type="button" className="lec-tool" onClick={copy}>
                {copied ? "Copied" : "Copy"}
              </button>
              {runLanguage ? (
                editing ? (
                  <button type="button" className="lec-tool" onClick={reset}>
                    Reset
                  </button>
                ) : (
                  <button type="button" className="lec-tool" onClick={() => setEditing(true)}>
                    Edit
                  </button>
                )
              ) : null}
            </span>
          </div>
          {editing ? (
            <div className="lec-editor-wrap">
              {/* Line numbers, so "line 5" in an error message is easy to find. */}
              <pre className="lec-editor__nos" aria-hidden="true">
                {draft.split("\n").map((_, i) => i + 1).join("\n")}
              </pre>
              <textarea
                className="lec-editor"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    // Like the button: no second run while one is going.
                    if (!busy) void run();
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoComplete="off"
                aria-label={`Edit the code for "${title}". Press Control and Enter to run.`}
                rows={Math.max(6, draft.split("\n").length + 1)}
              />
            </div>
          ) : (
            <div className="lec-code" role="region" aria-label={`Code: ${title}`} tabIndex={0}>
              {lines.map((line) => (
                <Fragment key={line.no}>
                  <div className="lec-line" style={css({ "--chars": line.chars, "--at": `${line.at}ms` })}>
                    <span className="lec-line__no" aria-hidden="true">
                      {line.no}
                    </span>
                    <span className="lec-line__code">
                      {line.marks.map((mark) => (
                        <span
                          key={`${mark.col}-${mark.len}`}
                          aria-hidden="true"
                          className="lec-mark"
                          data-color={mark.color}
                          style={css({ "--col": mark.col, "--len": mark.len, "--at": `${line.at + line.chars * 35}ms` })}
                        />
                      ))}
                      <span dangerouslySetInnerHTML={{ __html: line.html || " " }} />
                    </span>
                  </div>
                  {line.rows.length > 0 ? (
                    <div className="lec-under-group">
                      {line.rows.map((row) => (
                        <div
                          key={`${row.col}-${row.note?.text ?? "strip"}`}
                          className="lec-under"
                          data-color={row.color}
                          style={css({ "--col": row.col, "--center": row.center, "--at": `${row.at}ms` })}
                        >
                          <span aria-hidden="true" />
                          <div className="lec-under__body">
                            <span className="lec-link" aria-hidden="true" />
                            {row.note ? (
                              <span className="lec-chip">
                                <Shape shape={row.note.shape} />
                                {row.note.text}
                              </span>
                            ) : row.strip ? (
                              <Strip strip={row.strip} />
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </Fragment>
              ))}
            </div>
          )}
        </div>

        {canRun ? (
          <div className="lec-run-wrap">
            <button
              type="button"
              className={`lec-run${pulsing ? " is-pulsing" : ""}`}
              onClick={onButton}
              disabled={phase === "replaying"}
              aria-label={
                phase === "running" || phase === "starting"
                  ? "Stop the program"
                  : runLanguage
                    ? `Run the code: ${title}`
                    : `Show the recorded output: ${title}`
              }
            >
              <span className="lec-run__ring" aria-hidden="true" onAnimationEnd={() => setPulsing(false)} />
              {phase === "running" || phase === "starting" ? <StopIcon /> : <PlayIcon />}
            </button>
            <span className="lec-run__label" aria-hidden="true">
              {runLabel}
            </span>
          </div>
        ) : null}

        {canRun ? (
          <div ref={outputRef} className="lec-box">
            <div className="lec-box__head">
              <span className="lec-dot" style={{ background: "#3a4d78" }} />
              <span className="lec-dot" style={{ background: "#3a4d78" }} />
              <span className="lec-dot" style={{ background: "#3a4d78" }} />
              <span className="lec-box__label">
                <b>Output</b> · {outputLabel}
              </span>
            </div>
            <div
              className={`lec-output${shaking ? " is-shaking" : ""}`}
              onAnimationEnd={() => setShaking(false)}
              onScroll={(e) => {
                // Back at the bottom: follow again. Moved up: the student is reading,
                // so stop following. (Our own scrolling never moves the box up, even
                // when its scroll event arrives after more output.)
                const box = e.currentTarget;
                if (box.scrollHeight - box.scrollTop - box.clientHeight < 40) followOutput.current = true;
                else if (box.scrollTop < lastOutputTop.current - 1) followOutput.current = false;
                lastOutputTop.current = box.scrollTop;
              }}
              role="log"
              aria-live="polite"
              aria-label="Output"
              tabIndex={0}
            >
              {shown && shown.length > 0 ? (
                shown.map((piece, i) => (
                  <span key={i} className={piece.kind === "err" ? "lec-output__err" : piece.kind === "typed" ? "lec-output__typed" : undefined}>
                    {piece.text}
                  </span>
                ))
              ) : (
                <span className="lec-output__placeholder">
                  {busy ? null : "Nothing printed yet."}
                </span>
              )}
              {busy ? <span className="lec-caret" aria-hidden="true" /> : null}
            </div>
            <p className="lec-status" role="status">
              {status ?? (pieces === null ? idleStatus : null)}
            </p>
          </div>
        ) : null}
      </div>

      {showsStdin ? (
        <div className="lec-stdin">
          {runLanguage ? (
            <>
              <label htmlFor={stdinId}>⌨ Typed by the user (one answer per line)</label>
              <textarea
                id={stdinId}
                value={stdin}
                onChange={(e) => setStdin(e.target.value)}
                rows={Math.max(2, stdin.split("\n").length)}
                spellCheck={false}
              />
            </>
          ) : (
            <>
              <span className="lec-stdin__title">⌨ Typed by the user</span>
              <pre>{sampleInput.replace(/\n$/, "")}</pre>
            </>
          )}
        </div>
      ) : null}

      {fly ? (
        <svg key={fly.key} className="lec-fly" aria-hidden="true">
          <path d={fly.d} style={css({ "--len": fly.len, strokeDasharray: fly.len })} />
        </svg>
      ) : null}
    </figure>
  );
}
