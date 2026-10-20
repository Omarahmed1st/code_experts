// Runs one compiled C++ program (a WASI .wasm made by cpp-worker.mjs) in the
// student's browser. A fresh worker runs each program; the page stops it by
// terminating this worker (the only reliable way to end an infinite loop), and
// the compiler worker stays loaded.
//
// Messages in:   { type: "run", id, binary, stdin }
// Messages out:  { type: "out", id, stream: "stdout" | "stderr" | "stdin", text }
//                  ("stdin" echoes each line of keyboard input at the moment the
//                  program reads it, so the output reads like a terminal session)
//                { type: "done", id, ok, error?, errorKind?: "runtime", exitCode?, inputEnded, ms }
//
// The WASI functions below are the few a C++ program for the console needs.
// stdout reports itself as a terminal, so the C library line-buffers it and
// output reaches the page while the program runs.

// Cap what one run can print, so a runaway loop can't flood the page.
const MAX_OUTPUT_CHARS = 100_000;
const ERRNO = { SUCCESS: 0, BADF: 8, INVAL: 28, NOSYS: 52, SPIPE: 70 };

class ExitStatus {
  constructor(code) {
    this.code = code;
  }
}

function runProgram(program, id, stdin) {
  let memory = null;
  let wasmExports = null;
  const view = () => new DataView(memory.buffer);
  const bytes = () => new Uint8Array(memory.buffer);

  let printed = 0;
  let truncated = false;
  const decoders = { 1: new TextDecoder(), 2: new TextDecoder() };
  const emit = (fd, chunk) => {
    if (truncated) return;
    let text = decoders[fd].decode(chunk, { stream: true });
    printed += text.length;
    if (printed > MAX_OUTPUT_CHARS) {
      truncated = true;
      text = text.slice(0, Math.max(0, text.length - (printed - MAX_OUTPUT_CHARS)));
      text += "\n[Output stopped: more than 100,000 characters]\n";
    }
    if (text) self.postMessage({ type: "out", id, stream: fd === 1 ? "stdout" : "stderr", text });
  };
  const flushDecoders = () => {
    for (const fd of [1, 2]) {
      const rest = decoders[fd].decode();
      if (rest && !truncated) self.postMessage({ type: "out", id, stream: fd === 1 ? "stdout" : "stderr", text: rest });
    }
  };

  // Keyboard input: one line per read() call, echoed at the moment the program asks.
  const encoder = new TextEncoder();
  const text = typeof stdin === "string" ? stdin.replace(/\r\n?/g, "\n") : "";
  const lines = text === "" ? [] : text.replace(/\n$/, "").split("\n");
  let nextLine = 0;
  let pending = null; // bytes of the current line not yet handed out
  let inputEnded = false;

  const wasi = {
    args_sizes_get(argcPtr, sizePtr) {
      view().setUint32(argcPtr, 1, true);
      view().setUint32(sizePtr, 5, true);
      return ERRNO.SUCCESS;
    },
    args_get(argvPtr, bufPtr) {
      view().setUint32(argvPtr, bufPtr, true);
      bytes().set(encoder.encode("main\0"), bufPtr);
      return ERRNO.SUCCESS;
    },
    environ_sizes_get(countPtr, sizePtr) {
      view().setUint32(countPtr, 0, true);
      view().setUint32(sizePtr, 0, true);
      return ERRNO.SUCCESS;
    },
    environ_get() {
      return ERRNO.SUCCESS;
    },
    fd_write(fd, iovs, iovsLen, nwrittenPtr) {
      if (fd !== 1 && fd !== 2) return ERRNO.BADF;
      const dv = view();
      const chunks = [];
      let total = 0;
      for (let i = 0; i < iovsLen; i++) {
        const ptr = dv.getUint32(iovs + i * 8, true);
        const len = dv.getUint32(iovs + i * 8 + 4, true);
        if (len) chunks.push(bytes().subarray(ptr, ptr + len));
        total += len;
      }
      // One message per write() call (stdio often passes two buffers at once).
      if (chunks.length === 1) emit(fd, chunks[0].slice());
      else if (chunks.length > 1) {
        const all = new Uint8Array(total);
        let at = 0;
        for (const c of chunks) {
          all.set(c, at);
          at += c.length;
        }
        emit(fd, all);
      }
      dv.setUint32(nwrittenPtr, total, true);
      return ERRNO.SUCCESS;
    },
    fd_read(fd, iovs, iovsLen, nreadPtr) {
      if (fd !== 0) return ERRNO.BADF;
      if (!pending) {
        if (nextLine >= lines.length) {
          inputEnded = true;
          view().setUint32(nreadPtr, 0, true); // end of input
          return ERRNO.SUCCESS;
        }
        // Like glibc, show a prompt still waiting in stdout's buffer (printf("n: ")
        // before scanf) ahead of the typed line. cin already flushes cout itself.
        wasmExports?.fflush?.(0);
        const line = `${lines[nextLine++]}\n`;
        self.postMessage({ type: "out", id, stream: "stdin", text: line });
        pending = encoder.encode(line);
      }
      const dv = view();
      let total = 0;
      for (let i = 0; i < iovsLen && pending; i++) {
        const ptr = dv.getUint32(iovs + i * 8, true);
        const len = dv.getUint32(iovs + i * 8 + 4, true);
        const n = Math.min(len, pending.length);
        bytes().set(pending.subarray(0, n), ptr);
        total += n;
        pending = n < pending.length ? pending.subarray(n) : null;
      }
      dv.setUint32(nreadPtr, total, true);
      return ERRNO.SUCCESS;
    },
    fd_fdstat_get(fd, statPtr) {
      if (fd > 2) return ERRNO.BADF;
      const dv = view();
      dv.setUint8(statPtr, 2); // CHARACTER_DEVICE: a terminal, so stdout is line-buffered
      dv.setUint16(statPtr + 2, 0, true);
      // rights: everything except FD_SEEK (1<<2) and FD_TELL (1<<5); isatty() checks this
      dv.setBigUint64(statPtr + 8, 0x1fffffffn & ~((1n << 2n) | (1n << 5n)), true);
      dv.setBigUint64(statPtr + 16, 0n, true);
      return ERRNO.SUCCESS;
    },
    fd_fdstat_set_flags: () => ERRNO.SUCCESS,
    fd_close: () => ERRNO.SUCCESS,
    fd_seek: (fd) => (fd <= 2 ? ERRNO.SPIPE : ERRNO.BADF),
    fd_prestat_get: () => ERRNO.BADF, // no folders: the program can't open files
    fd_prestat_dir_name: () => ERRNO.BADF,
    proc_exit(code) {
      throw new ExitStatus(code);
    },
    clock_time_get(clockId, precision, timePtr) {
      const ns = clockId === 0 ? BigInt(Date.now()) * 1000000n : BigInt(Math.round(performance.now() * 1e6));
      view().setBigUint64(timePtr, ns, true);
      return ERRNO.SUCCESS;
    },
    clock_res_get(clockId, resPtr) {
      view().setBigUint64(resPtr, 1000n, true);
      return ERRNO.SUCCESS;
    },
    random_get(ptr, len) {
      for (let off = 0; off < len; off += 65536) {
        crypto.getRandomValues(new Uint8Array(memory.buffer, ptr + off, Math.min(65536, len - off)));
      }
      return ERRNO.SUCCESS;
    },
    sched_yield: () => ERRNO.SUCCESS,
    poll_oneoff(inPtr, outPtr, nsubs, neventsPtr) {
      // Only clock subscriptions (sleep). A worker can't block without
      // SharedArrayBuffer, so this busy-waits.
      const dv = view();
      let wait = 0;
      for (let i = 0; i < nsubs; i++) {
        const sub = inPtr + i * 48;
        if (dv.getUint8(sub + 8) !== 0) return ERRNO.NOSYS;
        const timeout = Number(dv.getBigUint64(sub + 24, true)) / 1e6;
        const absolute = dv.getUint16(sub + 40, true) & 1;
        wait = Math.max(wait, absolute ? timeout - performance.now() : timeout);
      }
      const end = performance.now() + wait;
      while (performance.now() < end) {
        /* sleep */
      }
      for (let i = 0; i < nsubs; i++) {
        const ev = outPtr + i * 32;
        dv.setBigUint64(ev, dv.getBigUint64(inPtr + i * 48, true), true);
        dv.setUint16(ev + 8, 0, true);
        dv.setUint8(ev + 10, 0);
      }
      dv.setUint32(neventsPtr, nsubs, true);
      return ERRNO.SUCCESS;
    },
  };

  const imports = {};
  for (const imp of WebAssembly.Module.imports(program)) {
    if (imp.kind !== "function") continue;
    imports[imp.module] ??= {};
    const fn = imp.module === "wasi_snapshot_preview1" ? wasi[imp.name] : undefined;
    imports[imp.module][imp.name] = fn ?? (() => ERRNO.NOSYS);
  }
  const inst = new WebAssembly.Instance(program, imports);
  memory = inst.exports.memory;
  wasmExports = inst.exports;
  try {
    inst.exports._start();
  } catch (error) {
    flushDecoders();
    if (error instanceof ExitStatus) return { ok: true, exitCode: error.code, inputEnded };
    return { ok: false, error, inputEnded };
  }
  flushDecoders();
  return { ok: true, exitCode: 0, inputEnded };
}

// Plain words for a WebAssembly trap.
function describeCrash(error) {
  const message = String(error && error.message ? error.message : error);
  if (/divide by zero/i.test(message)) return "Runtime error: division by zero.";
  if (/remainder by zero/i.test(message)) return "Runtime error: division by zero (the % operator).";
  if (/out of bounds/i.test(message)) return "Runtime error: the program used memory outside its own (for example an array index out of range).";
  if (/unreachable/i.test(message)) return "Runtime error: the program stopped (abort, a failed assert, or a function that didn't return a value).";
  if (/call stack|too much recursion/i.test(message)) return "Runtime error: too much recursion (stack overflow).";
  return `Runtime error: ${message}`;
}

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || message.type !== "run") return;
  const { id, binary, stdin } = message;
  const started = performance.now();
  let result;
  try {
    const program = await WebAssembly.compile(binary);
    result = runProgram(program, id, stdin);
  } catch (error) {
    result = { ok: false, error };
  }
  const ms = performance.now() - started;
  if (result.ok) {
    self.postMessage({ type: "done", id, ok: true, exitCode: result.exitCode, inputEnded: result.inputEnded, ms });
  } else {
    self.postMessage({ type: "done", id, ok: false, errorKind: "runtime", error: describeCrash(result.error), inputEnded: result.inputEnded, ms });
  }
};
