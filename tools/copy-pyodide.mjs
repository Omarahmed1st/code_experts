// Copies the Pyodide runtime from node_modules into public/pyodide/<version>/,
// so the in-browser Python runner is served by Code_Expert itself (no CDN).
// Runs before `npm run dev` and `npm run build`. The output is git-ignored.
import { copyFileSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = join(root, "node_modules", "pyodide");
const { version } = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));

// The page asks for this exact folder (src/lib/lesson/runtime.ts); fail loudly if they drift apart.
const runtime = readFileSync(join(root, "src", "lib", "lesson", "runtime.ts"), "utf8");
const expected = /PYODIDE_VERSION = "([^"]+)"/.exec(runtime)?.[1];
if (expected !== version) {
  console.error(`pyodide ${version} is installed but src/lib/lesson/runtime.ts expects ${expected}. Update one of them.`);
  process.exit(1);
}

const target = join(root, "public", "pyodide", version);
mkdirSync(target, { recursive: true });
const files = ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"];
for (const file of files) {
  if (!existsSync(join(source, file))) {
    console.error(`missing ${file} in the pyodide package`);
    process.exit(1);
  }
  copyFileSync(join(source, file), join(target, file));
}
console.log(`Copied Pyodide ${version} to public/pyodide/${version}/`);
