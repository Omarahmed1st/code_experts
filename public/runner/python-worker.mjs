// Code_Expert's in-browser Python runner (a module Web Worker).
//
// Runs lesson code with Pyodide (CPython compiled to WebAssembly) on the
// student's own device. Nothing here runs on Code_Expert's servers. The page
// stops a run by terminating this worker, which is the only reliable way to
// end an infinite loop.
//
// Messages in:   { type: "run", id, code, stdin }
// Messages out:  { type: "status", status: "loading" | "ready" }
//                { type: "out", id, stream: "stdout" | "stderr" | "stdin", text }
//                  ("stdin" echoes each line of keyboard input when the program
//                  reads it, so the output reads like a terminal session)
//                { type: "done", id, ok, error?, ms }
//                { type: "fatal", error }        (Pyodide failed to load)

const params = new URL(self.location.href).searchParams;
const base = params.get("pyodide") ?? "";
// Only load Pyodide from this site's own /pyodide/<version>/ folder.
if (!/^\/pyodide\/[0-9][0-9.]*\/$/.test(base)) {
  self.postMessage({ type: "fatal", error: "Invalid Pyodide location." });
  self.close();
}

let pyodidePromise = null;

function loadRuntime() {
  if (!pyodidePromise) {
    self.postMessage({ type: "status", status: "loading" });
    // When one of Pyodide's own downloads fails (a dropped connection),
    // loadPyodide() never settles: the error escapes as an unhandled rejection.
    // Without this the student would wait for the page's 3-minute download
    // limit, so any unhandled error while loading fails the load at once.
    let failLoad;
    const interrupted = new Promise((_, reject) => (failLoad = reject));
    const onRejection = (event) => {
      event.preventDefault();
      const why = event.reason && event.reason.message ? event.reason.message : String(event.reason);
      failLoad(new Error(`The Python download was interrupted (${why}). Check your connection and try again.`));
    };
    self.addEventListener("unhandledrejection", onRejection);
    pyodidePromise = Promise.race([
      import(`${base}pyodide.mjs`).then(({ loadPyodide }) => loadPyodide({ indexURL: base })),
      interrupted,
    ])
      .then((pyodide) => {
        self.postMessage({ type: "status", status: "ready", version: pyodide.version });
        return pyodide;
      })
      .finally(() => self.removeEventListener("unhandledrejection", onRejection));
  }
  return pyodidePromise;
}

// Cap what one run can print, so a runaway loop can't flood the page.
const MAX_OUTPUT_CHARS = 100_000;

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || message.type !== "run") return;
  const { id, code, stdin } = message;

  let pyodide;
  try {
    pyodide = await loadRuntime();
  } catch (error) {
    self.postMessage({ type: "fatal", error: String(error && error.message ? error.message : error) });
    return;
  }

  let printed = 0;
  let truncated = false;
  const writer = (stream) => {
    const decoder = new TextDecoder();
    return {
      write(buffer) {
        if (truncated) return buffer.length;
        let text = decoder.decode(buffer, { stream: true });
        printed += text.length;
        if (printed > MAX_OUTPUT_CHARS) {
          truncated = true;
          text = text.slice(0, Math.max(0, text.length - (printed - MAX_OUTPUT_CHARS)));
          text += "\n[Output stopped: more than 100,000 characters]\n";
        }
        if (text) self.postMessage({ type: "out", id, stream, text });
        return buffer.length;
      },
    };
  };
  pyodide.setStdout(writer("stdout"));
  pyodide.setStderr(writer("stderr"));
  // One line per read, so each line can be echoed where input() consumed it.
  const text = typeof stdin === "string" ? stdin.replace(/\r\n?/g, "\n") : "";
  const lines = text === "" ? [] : text.replace(/\n$/, "").split("\n");
  let next = 0;
  pyodide.setStdin({
    stdin: () => {
      if (next >= lines.length) return null; // end of input: input() raises EOFError
      const line = lines[next++];
      self.postMessage({ type: "out", id, stream: "stdin", text: `${line}\n` });
      return `${line}\n`;
    },
  });

  // A fresh namespace per run, so one example's variables never leak into the next.
  const globals = pyodide.globals.get("dict")();
  const started = performance.now();
  try {
    await pyodide.runPythonAsync(String(code), { globals, filename: "main.py" });
    self.postMessage({ type: "done", id, ok: true, ms: performance.now() - started });
  } catch (error) {
    self.postMessage({
      type: "done",
      id,
      ok: false,
      error: String(error && error.message ? error.message : error),
      ms: performance.now() - started,
    });
  } finally {
    globals.destroy();
  }
};
