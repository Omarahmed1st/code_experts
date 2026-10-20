// One runtime per language per page, shared by every Run button on it.
//
// Each runtime lives in module Web Workers (public/runner/), so code runs on the
// student's device and the page stays responsive.
// - Python: one worker with Pyodide runs the code.
// - C++: the compiler worker (Clang compiled to WebAssembly) turns the code into
//   a WASI program, and a fresh, small program worker runs it.
// A run that goes past its time limit, or that the student stops, terminates
// the worker running the code. For C++ that is only the program worker, so the
// compiler stays loaded; for Python the next run starts a fresh Pyodide (its
// files are cached by then).
import { COMPILE_TIMEOUT_MS, RUN_TIMEOUT_MS, RUNTIMES, type RunLanguage } from "@/lib/lesson/runtime";

export type RunnerStatus = "idle" | "loading" | "ready" | "compiling" | "running" | "failed";

export interface RunResult {
  ok: boolean;
  /** Error text to show (a Python traceback, compiler messages or a crash), when ok is false. */
  error?: string;
  /** "compile": the C++ compiler rejected the code; "runtime": the program crashed or raised. */
  errorKind?: "compile" | "runtime";
  /** C++: compiler warnings for code that compiled. */
  warnings?: string;
  /** C++: the value main() returned (or exit() was given). */
  exitCode?: number;
  /** True when the program tried to read more keyboard input than there was. */
  inputEnded?: boolean;
  /**
   * Set when the run was stopped: by the run time limit, by the (longer) limit
   * for compiling, by the Stop button, or because another code box on the page
   * started a run with the same runtime.
   */
  stopped?: "timeout" | "compile-timeout" | "user" | "replaced";
  /** Set when the runtime itself could not start. */
  fatal?: string;
  /** How long the program ran. */
  ms?: number;
  /** C++ only: how long compiling took. */
  compileMs?: number;
}

/** How long the first download of a runtime may take before giving up. */
const LOAD_TIMEOUT_MS = 180_000;

/** "stdin" is a line of keyboard input, echoed at the moment the program read it. */
type OutputListener = (stream: "stdout" | "stderr" | "stdin", text: string) => void;

interface Pending {
  id: number;
  stdin: string;
  onOutput: OutputListener;
  resolve: (result: RunResult) => void;
  timer: ReturnType<typeof setTimeout>;
  /** What the current time limit is for. */
  stage: "load" | "compile" | "run";
  compileMs?: number;
  warnings?: string;
}

type DoneMessage = {
  type: "done";
  id: number;
  ok: boolean;
  error?: string;
  errorKind?: "compile" | "runtime";
  exitCode?: number;
  inputEnded?: boolean;
  ms: number;
};

type WorkerMessage =
  | { type: "status"; status: "loading" | "ready" }
  | { type: "out"; id: number; stream: "stdout" | "stderr" | "stdin"; text: string }
  | DoneMessage
  | { type: "compiled"; id: number; ok: true; binary: ArrayBuffer; compileMs: number; warnings?: string }
  | { type: "compiled"; id: number; ok: false; diagnostics: string; compileMs: number }
  | { type: "fatal"; error: string };

class CodeRunner {
  /** Pyodide, or the C++ compiler. */
  private worker: Worker | null = null;
  /** C++ only: the worker running the compiled program. */
  private program: Worker | null = null;
  private pending: Pending | null = null;
  private nextId = 1;
  private status: RunnerStatus = "idle";
  private everLoaded = false;
  private listeners = new Set<(status: RunnerStatus) => void>();

  constructor(private readonly language: RunLanguage) {}

  private get info() {
    return RUNTIMES[this.language];
  }

  private get compiles() {
    return this.info.programWorkerUrl !== undefined;
  }

  getStatus(): RunnerStatus {
    return this.status;
  }

  /** True once the runtime has loaded on this page (later starts come from the browser cache). */
  hasLoaded(): boolean {
    return this.everLoaded;
  }

  subscribe(listener: (status: RunnerStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private setStatus(status: RunnerStatus) {
    this.status = status;
    for (const listener of this.listeners) listener(status);
  }

  private ensureWorker(): Worker {
    if (this.worker) return this.worker;
    const worker = new Worker(this.info.workerUrl, { type: "module", name: `codelab-${this.language}` });
    worker.onmessage = (event: MessageEvent<WorkerMessage>) => this.handle(event.data);
    worker.onerror = (event) => {
      event.preventDefault();
      this.finish({ ok: false, fatal: `The ${this.info.name} runtime could not start in this browser.` });
      this.reset("failed");
    };
    this.worker = worker;
    return worker;
  }

  /** The step that comes first once the runtime is loaded. */
  private firstStep(): "compile" | "run" {
    return this.compiles ? "compile" : "run";
  }

  private firstStatus(): RunnerStatus {
    return this.compiles ? "compiling" : "running";
  }

  private handle(message: WorkerMessage) {
    switch (message.type) {
      case "status":
        if (message.status === "ready") {
          this.everLoaded = true;
          // The download is done: from now on the run gets the normal time limit.
          if (this.pending) this.restartTimer(this.firstStep());
        }
        this.setStatus(message.status === "loading" ? "loading" : this.pending ? this.firstStatus() : "ready");
        return;
      case "out":
        if (this.pending?.id === message.id) this.pending.onOutput(message.stream, message.text);
        return;
      case "done":
        if (this.pending?.id !== message.id) return;
        this.finish({
          ok: message.ok,
          error: message.error,
          errorKind: message.errorKind,
          exitCode: message.exitCode,
          inputEnded: message.inputEnded,
          ms: message.ms,
          compileMs: this.pending.compileMs,
          warnings: this.pending.warnings,
        });
        this.stopProgram();
        this.setStatus("ready");
        return;
      case "compiled":
        if (this.pending?.id !== message.id) return;
        if (!message.ok) {
          this.finish({ ok: false, errorKind: "compile", error: message.diagnostics, compileMs: message.compileMs });
          this.setStatus("ready");
          return;
        }
        this.startProgram(message.binary, message.compileMs, message.warnings);
        return;
      case "fatal":
        this.finish({ ok: false, fatal: message.error });
        this.reset("failed");
        return;
    }
  }

  /** C++: run the compiled program in its own worker; its messages use the same protocol. */
  private startProgram(binary: ArrayBuffer, compileMs: number, warnings: string | undefined) {
    const pending = this.pending;
    if (!pending || !this.info.programWorkerUrl) return;
    pending.compileMs = compileMs;
    pending.warnings = warnings;
    this.stopProgram();
    const program = new Worker(this.info.programWorkerUrl, { type: "module", name: `codelab-${this.language}-program` });
    program.onmessage = (event: MessageEvent<WorkerMessage>) => this.handle(event.data);
    program.onerror = (event) => {
      event.preventDefault();
      this.finish({ ok: false, errorKind: "runtime", error: "The program could not start in this browser.", compileMs });
      this.stopProgram();
      this.setStatus("ready");
    };
    this.program = program;
    // The 10 seconds start now: compiling had its own allowance.
    this.restartTimer("run");
    this.setStatus("running");
    program.postMessage({ type: "run", id: pending.id, binary, stdin: pending.stdin }, [binary]);
  }

  private stopProgram() {
    this.program?.terminate();
    this.program = null;
  }

  private finish(result: RunResult) {
    const pending = this.pending;
    if (!pending) return;
    clearTimeout(pending.timer);
    this.pending = null;
    pending.resolve(result);
  }

  private reset(status: RunnerStatus) {
    this.stopProgram();
    this.worker?.terminate();
    this.worker = null;
    this.setStatus(status);
  }

  /** Runs code with `stdin` as keyboard input. Only one run at a time per runtime. */
  run(code: string, stdin: string, onOutput: OutputListener): Promise<RunResult> {
    if (this.pending) this.end("replaced");
    const worker = this.ensureWorker();
    const id = this.nextId++;
    return new Promise<RunResult>((resolve) => {
      // The first download gets a longer allowance than the run itself.
      const stage = this.everLoaded ? this.firstStep() : "load";
      this.pending = { id, stdin, onOutput, resolve, timer: this.startTimer(stage), stage };
      this.setStatus(this.everLoaded ? this.firstStatus() : "loading");
      worker.postMessage(this.compiles ? { type: "compile", id, code } : { type: "run", id, code, stdin });
    });
  }

  private restartTimer(stage: Pending["stage"]) {
    if (!this.pending) return;
    clearTimeout(this.pending.timer);
    this.pending.stage = stage;
    this.pending.timer = this.startTimer(stage);
  }

  private startTimer(stage: Pending["stage"]) {
    const ms = stage === "load" ? LOAD_TIMEOUT_MS : stage === "compile" ? COMPILE_TIMEOUT_MS : RUN_TIMEOUT_MS;
    return setTimeout(() => {
      const compileMs = this.pending?.compileMs;
      this.finish(
        stage === "load"
          ? { ok: false, fatal: `${this.info.name} took too long to download. Check your connection and try again.` }
          : { ok: false, stopped: stage === "compile" ? "compile-timeout" : "timeout", compileMs },
      );
      this.halt(stage);
    }, ms);
  }

  /** Ends whatever is running (after a time limit). A C++ program stops alone; the compiler stays loaded. */
  private halt(stage: Pending["stage"]) {
    if (stage === "run" && this.program) {
      this.stopProgram();
      this.setStatus("ready");
    } else {
      this.reset("idle");
    }
  }

  stop() {
    this.end("user");
  }

  /** Ends the current run because the student stopped it or another code box started one. */
  private end(reason: "user" | "replaced") {
    const pending = this.pending;
    if (!pending) return;
    this.finish({ ok: false, stopped: reason, compileMs: pending.compileMs });
    if (this.compiles && pending.stage !== "run") {
      // C++ before the program starts: let the compiler finish its download or
      // compile (the late answer is ignored), so the next run doesn't start over.
      this.setStatus(this.everLoaded ? "ready" : "loading");
      return;
    }
    this.halt(pending.stage);
  }
}

const shared = new Map<RunLanguage, CodeRunner>();

export function getRunner(language: RunLanguage): CodeRunner {
  let runner = shared.get(language);
  if (!runner) {
    runner = new CodeRunner(language);
    shared.set(language, runner);
  }
  return runner;
}
