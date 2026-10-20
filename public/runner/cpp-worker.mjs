// Code_Expert's in-browser C++ compiler (a module Web Worker).
//
// Compiles the student's C++ with Clang 20 and wasm-ld (the `browsercc` npm
// package: LLVM compiled to WebAssembly) into a WASI program, entirely on the
// student's own device. Nothing runs on Code_Expert's servers, and nothing is
// fetched from anywhere except this site's own /cpp/browsercc-<version>/
// folder (prepared by tools/copy-cpp-runtime.mjs). The program itself runs in
// another worker (cpp-program-worker.mjs), so stopping it keeps this one loaded.
//
// Messages in:   { type: "compile", id, code }
// Messages out:  { type: "status", status: "loading" | "ready" }
//                { type: "compiled", id, ok: true, binary, compileMs, warnings? }   (binary: the program's .wasm, transferred)
//                { type: "compiled", id, ok: false, diagnostics, compileMs }
//                { type: "fatal", error }        (the compiler failed to load)

const params = new URL(self.location.href).searchParams;
const base = params.get("cpp") ?? "";
// Only load the compiler from this site's own /cpp/browsercc-<version>/ folder.
if (!/^\/cpp\/browsercc-[0-9][0-9.]*\/$/.test(base)) {
  self.postMessage({ type: "fatal", error: "Invalid C++ compiler location." });
  self.close();
}

// -O0, like a plain `g++ main.cpp`.
// -fno-exceptions: the WASI sysroot's libc++abi has no exception support, so
// code that throws could not link anyway.
const COMPILE_FLAGS = ["-std=c++17", "-O0", "-fno-exceptions"];
// 8 MiB of stack for the student's program (wasm-ld's default is 64 KiB).
const STACK_SIZE = 8 * 1024 * 1024;

// ---------------------------------------------------------------- loading

/** The response body, gunzipped unless the host already did that (gzip starts with 1f 8b). */
async function unpacked(name) {
  const res = await fetch(`${base}${name}`);
  if (!res.ok || !res.body) throw new Error(`Could not download ${name} (HTTP ${res.status})`);
  const reader = res.body.getReader();
  const first = await reader.read();
  const head = first.value ?? new Uint8Array(0);
  const replay = new ReadableStream({
    start(controller) {
      if (head.length) controller.enqueue(head);
      if (first.done) controller.close();
    },
    async pull(controller) {
      const { done, value } = await reader.read();
      if (done) controller.close();
      else controller.enqueue(value);
    },
    cancel(reason) {
      return reader.cancel(reason);
    },
  });
  const gzipped = head.length >= 2 && head[0] === 0x1f && head[1] === 0x8b;
  return gzipped ? replay.pipeThrough(new DecompressionStream("gzip")) : replay;
}

async function compileWasm(name) {
  const response = new Response(await unpacked(name), { headers: { "Content-Type": "application/wasm" } });
  return WebAssembly.compileStreaming(response);
}

async function fetchTar(name) {
  return untar(new Uint8Array(await new Response(await unpacked(name)).arrayBuffer()));
}

function untar(bytes) {
  const decoder = new TextDecoder();
  const files = [];
  const dirs = new Set();
  let offset = 0;
  while (offset + 512 <= bytes.length) {
    const name = decoder.decode(bytes.subarray(offset, offset + 100)).replace(/\0[\s\S]*$/, "");
    if (!name) break;
    const size = parseInt(decoder.decode(bytes.subarray(offset + 124, offset + 136)).replace(/\0[\s\S]*$/, "").trim(), 8) || 0;
    const start = offset + 512;
    if (!name.endsWith("/")) {
      files.push({ path: `/${name}`, data: bytes.subarray(start, start + size) });
      dirs.add(`/${name.slice(0, name.lastIndexOf("/"))}`);
    }
    offset = start + Math.ceil(size / 512) * 512;
  }
  return { files, dirs: [...dirs].sort() };
}

let runtimePromise = null;

function loadRuntime() {
  if (!runtimePromise) {
    self.postMessage({ type: "status", status: "loading" });
    runtimePromise = (async () => {
      // The big files are cached for good (their names change with their content);
      // the list is always checked again, so an update reaches cached browsers.
      const res = await fetch(`${base}files.json`, { cache: "no-cache" });
      if (!res.ok) throw new Error(`Could not download the compiler's file list (HTTP ${res.status})`);
      const manifest = await res.json();
      const [clangFactory, lldFactory, clangModule, lldModule, headers, libs] = await Promise.all([
        import(`${base}${manifest.clangJs}`).then((m) => m.default),
        import(`${base}${manifest.lldJs}`).then((m) => m.default),
        compileWasm(manifest.clangWasm),
        compileWasm(manifest.lldWasm),
        fetchTar(manifest.headers),
        fetchTar(manifest.libs),
      ]);
      const runtime = { clangFactory, lldFactory, clangModule, lldModule, headers, libs };
      runtime.invocation = await driverInvocation(runtime);
      self.postMessage({ type: "status", status: "ready", version: `browsercc ${manifest.version}` });
      return runtime;
    })();
  }
  return runtimePromise;
}

// One Emscripten instance per tool invocation (clang and lld are not built to
// run main() twice), all sharing the one compiled WebAssembly.Module.
function instance(factory, wasmModule, thisProgram, log) {
  return factory({
    thisProgram,
    print: (line) => log(line),
    printErr: (line) => log(line),
    instantiateWasm(imports, receive) {
      WebAssembly.instantiate(wasmModule, imports).then((inst) => receive(inst, wasmModule));
      return {};
    },
  });
}

function mount(M, tree) {
  for (const dir of tree.dirs) M.FS.mkdirTree(dir);
  // canOwn: the in-memory file system keeps a view of the downloaded bytes instead of copying them.
  for (const file of tree.files) M.FS.writeFile(file.path, file.data, { canOwn: true });
}

// Ask the clang driver once (-###) for the exact cc1 and wasm-ld command lines.
async function driverInvocation(rt) {
  let log = "";
  const clang = await instance(rt.clangFactory, rt.clangModule, "clang++", (l) => (log += `${l}\n`));
  clang.FS.writeFile("/main.cpp", "int main(){}\n");
  clang.FS.mkdirTree("/lib/wasm32-wasi");
  clang.FS.mkdirTree("/include/c++/v1");
  clang.FS.writeFile("/lib/wasm32-wasi/crt1-command.o", new Uint8Array(0));
  const code = clang.callMain(["main.cpp", ...COMPILE_FLAGS, "-o", "/tmp/main.wasm", "-###"]);
  if (code !== 0) throw new Error(`The C++ compiler did not start:\n${log}`);
  const argsOf = (key) => {
    const line = log.split("\n").find((l) => l.includes(key));
    if (!line) throw new Error(`The C++ compiler gave no ${key} step:\n${log}`);
    return [...line.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).slice(1);
  };
  const cc1 = argsOf('"-cc1"');
  const link = argsOf('"wasm-ld"');
  // A fixed object name instead of the driver's random /tmp/main-NNNN.o.
  const obj = cc1[cc1.indexOf("-o") + 1];
  const fix = (args) => args.map((a) => (a === obj ? "/tmp/main.o" : a));
  const linkArgs = fix(link);
  // wasi-libc leaves long double printf/scanf out unless asked.
  const lc = linkArgs.indexOf("-lc");
  if (lc !== -1) linkArgs.splice(lc, 0, "-lc-printscan-long-double");
  // fflush is exported so the program worker can show a printf() prompt before
  // the program reads the keyboard (see cpp-program-worker.mjs).
  return { cc1: fix(cc1), link: [...linkArgs, "-z", `stack-size=${STACK_SIZE}`, "--export=fflush"] };
}

// ---------------------------------------------------------------- compile

async function compile(rt, code) {
  let diagnostics = "";
  const log = (line) => (diagnostics += `${line}\n`);
  const clang = await instance(rt.clangFactory, rt.clangModule, "clang++", log);
  mount(clang, rt.headers);
  clang.FS.mkdirTree("/tmp");
  clang.FS.writeFile("/main.cpp", code);
  let status;
  try {
    status = clang.callMain([...rt.invocation.cc1]);
  } catch (error) {
    return { ok: false, diagnostics: `${diagnostics}\nThe compiler crashed: ${error && error.message ? error.message : error}` };
  }
  if (status !== 0) return { ok: false, diagnostics };
  const object = clang.FS.readFile("/tmp/main.o");
  // On WebAssembly, Clang names main() __main_void or __main_argc_argv. The C
  // library only refers to those weakly, so without a main() the program would
  // still link and then crash when it starts; report it the way g++ does.
  const symbols = new TextDecoder("latin1").decode(object);
  if (!symbols.includes("__main_void") && !symbols.includes("__main_argc_argv")) {
    return { ok: false, diagnostics: `${diagnostics}error: undefined reference to \`main'\n` };
  }
  const lld = await instance(rt.lldFactory, rt.lldModule, "wasm-ld", log);
  mount(lld, rt.libs);
  lld.FS.mkdirTree("/tmp");
  lld.FS.writeFile("/tmp/main.o", object, { canOwn: true });
  try {
    status = lld.callMain([...rt.invocation.link]);
  } catch (error) {
    return { ok: false, diagnostics: `${diagnostics}\nThe linker crashed: ${error && error.message ? error.message : error}` };
  }
  if (status !== 0) return { ok: false, diagnostics };
  // A copy in its own buffer, so it can be transferred to the page.
  const binary = lld.FS.readFile("/tmp/main.wasm").slice();
  return { ok: true, diagnostics, binary };
}

// ---------------------------------------------------------------- protocol

// The last program built, so running the same code again (one run per test
// case on the exercise pages) doesn't compile it again.
let last = null; // { code, built }

self.onmessage = async (event) => {
  const message = event.data;
  if (!message || message.type !== "compile") return;
  const { id, code } = message;

  let rt;
  try {
    rt = await loadRuntime();
  } catch (error) {
    self.postMessage({ type: "fatal", error: String(error && error.message ? error.message : error) });
    return;
  }

  const started = performance.now();
  let built;
  if (last && last.code === String(code)) {
    built = last.built;
  } else {
    try {
      built = await compile(rt, String(code));
    } catch (error) {
      built = { ok: false, diagnostics: `The compiler failed: ${error && error.message ? error.message : error}` };
    }
    last = { code: String(code), built };
  }
  const compileMs = performance.now() - started;
  if (!built.ok) {
    self.postMessage({ type: "compiled", id, ok: false, diagnostics: built.diagnostics.trimEnd(), compileMs });
    return;
  }
  const warnings = built.diagnostics.trim() || undefined;
  // Transfer a copy: the cached binary stays here for the next run.
  const binary = built.binary.slice();
  self.postMessage({ type: "compiled", id, ok: true, binary: binary.buffer, compileMs, warnings }, [binary.buffer]);
};
