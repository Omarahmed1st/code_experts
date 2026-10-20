// The in-browser runtimes behind the Run button. Each one is a module Web
// Worker in public/runner/ that loads files this site hosts itself.
//
// Python: tools/copy-pyodide.mjs copies the `pyodide` npm package to
// public/pyodide/<PYODIDE_VERSION>/ and refuses to run if this constant and the
// installed package disagree.
export const PYODIDE_VERSION = "314.0.7";
export const PYODIDE_BASE = `/pyodide/${PYODIDE_VERSION}/`;
export const PYTHON_WORKER_URL = `/runner/python-worker.mjs?pyodide=${encodeURIComponent(PYODIDE_BASE)}`;

// C++: tools/copy-cpp-runtime.mjs prepares the `browsercc` npm package (Clang
// and wasm-ld compiled to WebAssembly) in public/cpp/browsercc-<version>/. The
// compiler worker turns the student's code into a WASI program; a second, small
// worker runs it, so Stop and the time limit never throw the compiler away.
export const BROWSERCC_VERSION = "0.1.1";
export const CPP_BASE = `/cpp/browsercc-${BROWSERCC_VERSION}/`;
export const CPP_WORKER_URL = `/runner/cpp-worker.mjs?cpp=${encodeURIComponent(CPP_BASE)}`;
export const CPP_PROGRAM_WORKER_URL = "/runner/cpp-program-worker.mjs";

/** A run is stopped after this long; students are told it may be an endless loop. */
export const RUN_TIMEOUT_MS = 10_000;

/** Compiling C++ gets its own, longer allowance (slow phones), before the 10 seconds start. */
export const COMPILE_TIMEOUT_MS = 60_000;

export type RunLanguage = "python" | "cpp";

export interface RuntimeInfo {
  /** The language's name in messages: "Python", "C++". */
  name: string;
  workerUrl: string;
  /**
   * Compiled languages: workerUrl is the compiler, and each compiled program
   * runs in a fresh worker from this URL.
   */
  programWorkerUrl?: string;
  /** The status line while the runtime downloads for the first time. */
  firstStart: string;
}

export const RUNTIMES: Record<RunLanguage, RuntimeInfo> = {
  python: {
    name: "Python",
    workerUrl: PYTHON_WORKER_URL,
    firstStart: "Starting Python in your browser. The first time, this downloads up to about 13 MB.",
  },
  cpp: {
    name: "C++",
    workerUrl: CPP_WORKER_URL,
    programWorkerUrl: CPP_PROGRAM_WORKER_URL,
    firstStart: "Starting the C++ compiler in your browser. The first time, this downloads about 30 MB.",
  },
};

export function isRunLanguage(language: string): language is RunLanguage {
  return language === "python" || language === "cpp";
}

/** True when the program reads keyboard input, so the stage shows the keyboard box. */
export function readsInput(language: string, code: string): boolean {
  if (language === "python") return /\binput\s*\(/.test(code);
  if (language === "cpp") return /\bcin\b|\bgetline\s*\(|\b(?:f?scanf|getchar|f?getc|fgets)\s*\(/.test(code);
  return false;
}

/**
 * Pyodide's error text includes frames from its own loader. Keep only the
 * student's part: from the first line that points into main.py, or else the
 * final "ErrorType: message" line.
 */
export function cleanTraceback(message: string): string {
  const lines = message.replace(/\s+$/, "").split("\n");
  const start = lines.findIndex((line) => line.startsWith('  File "main.py"'));
  if (start !== -1) return ["Traceback (most recent call last):", ...lines.slice(start)].join("\n");
  return lines[lines.length - 1] ?? message;
}

/** The last line of a traceback, e.g. "IndexError: list index out of range". */
export function errorSummary(message: string): string {
  const lines = message.trim().split("\n");
  return lines[lines.length - 1] ?? message;
}

/**
 * The first error in compiler output, in plain words:
 * "main.cpp:5:14: error: expected ';' at end of declaration" becomes
 * "line 5: expected ';' at end of declaration".
 */
export function compileErrorSummary(output: string): string {
  for (const line of output.split("\n")) {
    const m = /^(?:[^:\s]*main\.cpp):(\d+):(?:\d+:)?\s*(?:fatal )?error:\s*(.+)$/.exec(line.trim());
    if (m) return `line ${m[1]}: ${m[2]}`;
  }
  if (/undefined symbol: system\b/.test(output)) return "system() (for example system(\"pause\")) doesn't work here; remove that line.";
  if (/undefined reference to `main'/.test(output)) return "there is no main() function. Every program starts at main(), so check its spelling.";
  const any = output.split("\n").find((line) => /\berror\b/i.test(line));
  return (any ?? output.split("\n")[0] ?? "").trim();
}

/** The first compiler warning, in the same plain form, or null. */
export function firstWarning(output: string): string | null {
  for (const line of output.split("\n")) {
    const m = /^(?:[^:\s]*main\.cpp):(\d+):(?:\d+:)?\s*warning:\s*(.+?)(?:\s+\[-W[^\]]+\])?$/.exec(line.trim());
    if (m) return `line ${m[1]}: ${m[2]}`;
  }
  return null;
}
