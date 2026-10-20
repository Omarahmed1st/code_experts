// Prepares the in-browser C++ compiler from node_modules/browsercc (Clang and
// wasm-ld compiled to WebAssembly, plus a WASI sysroot with libc++) in
// public/cpp/browsercc-<version>/, so Code_Expert serves it itself (no CDN).
// Runs before `npm run dev` and `npm run build`. The output is git-ignored.
//
// - The big files are stored gzip-compressed (.gz) and the worker unpacks them
//   with DecompressionStream. That keeps every file far under the 25 MiB
//   per-file cap of Cloudflare's static assets and the download near 30 MB,
//   whether or not the host compresses responses itself.
// - sysroot.tar becomes two tars: headers (for clang) and libraries (for
//   wasm-ld), plus a small bits/stdc++.h that many students' code includes.
// - The package's prebuilt stdc++.h.pch is not shipped: it was built for other
//   flags (-O2 -std=c++20) and would only add 19 MB.
// - The downloaded files carry the stamp in their names, and files.json (which
//   names them) is always revalidated, so a changed file reaches browsers that
//   cached the old one for good (public/_headers marks /cpp/* immutable).
// Skips the work when the folder already matches the installed package.
import { createHash } from "node:crypto";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const source = join(root, "node_modules", "browsercc");
const { version } = JSON.parse(readFileSync(join(source, "package.json"), "utf8"));
const dist = join(source, "dist");

// The page asks for this exact folder (src/lib/lesson/runtime.ts); fail loudly if they drift apart.
const runtime = readFileSync(join(root, "src", "lib", "lesson", "runtime.ts"), "utf8");
const expected = /BROWSERCC_VERSION = "([^"]+)"/.exec(runtime)?.[1];
if (expected !== version) {
  console.error(`browsercc ${version} is installed but src/lib/lesson/runtime.ts expects ${expected}. Update one of them.`);
  process.exit(1);
}

const target = join(root, "public", "cpp", `browsercc-${version}`);
const inputs = ["clang.js", "lld.js", "clang.wasm", "lld.wasm", "sysroot.tar"].map((f) => join(dist, f));
for (const file of inputs) {
  if (!existsSync(file)) {
    console.error(`missing ${file}`);
    process.exit(1);
  }
}
// The stamp changes when the package files or this script change.
const stamp = createHash("sha256")
  .update(inputs.map((f) => `${f}:${statSync(f).size}`).join("\n"))
  .update(readFileSync(new URL(import.meta.url)))
  .digest("hex")
  .slice(0, 16);
const manifestPath = join(target, "files.json");
if (existsSync(manifestPath) && JSON.parse(readFileSync(manifestPath, "utf8")).stamp === stamp) {
  console.log(`C++ compiler (browsercc ${version}) already in public/cpp/browsercc-${version}/`);
  process.exit(0);
}

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });
const MAX_FILE = 24 * 1024 * 1024;

// "clang.wasm.gz" -> "clang.<stamp>.wasm.gz"
const stamped = (name) => name.replace(/^([^.]+)\./, `$1.${stamp}.`);

function writeGzip(name, data) {
  name = stamped(name);
  const packed = gzipSync(data, { level: 9 });
  if (packed.length > MAX_FILE) throw new Error(`${name} is ${packed.length} bytes, over the per-file cap`);
  writeFileSync(join(target, name), packed);
  return name;
}

// A tar entry: a 512-byte ustar header, then the data padded to 512 bytes.
function tarEntry(name, data) {
  const header = Buffer.alloc(512);
  header.write(name, 0, 100, "utf8");
  header.write("0000644\0", 100);
  header.write("0000000\0", 108);
  header.write("0000000\0", 116);
  header.write(`${data.length.toString(8).padStart(11, "0")}\0`, 124);
  header.write("00000000000\0", 136);
  header.write("        ", 148); // checksum is computed with these as spaces
  header.write("0", 156);
  header.write("ustar\0", 257);
  header.write("00", 263);
  let sum = 0;
  for (const byte of header) sum += byte;
  header.write(`${sum.toString(8).padStart(6, "0")}\0 `, 148);
  return Buffer.concat([header, data, Buffer.alloc((512 - (data.length % 512)) % 512)]);
}

// `#include <bits/stdc++.h>` is a g++ habit; libc++ has no such file. This one
// pulls in the standard headers that work here (no threads, no exceptions).
const BITS_STDCXX = `// Code_Expert: g++'s <bits/stdc++.h> for libc++ (the headers that work in the browser).
#include <algorithm>
#include <any>
#include <array>
#include <bitset>
#include <cassert>
#include <cctype>
#include <cfloat>
#include <chrono>
#include <climits>
#include <cmath>
#include <complex>
#include <cstddef>
#include <cstdint>
#include <cstdio>
#include <cstdlib>
#include <cstring>
#include <ctime>
#include <deque>
#include <fstream>
#include <functional>
#include <iomanip>
#include <iostream>
#include <iterator>
#include <limits>
#include <list>
#include <map>
#include <memory>
#include <numeric>
#include <optional>
#include <queue>
#include <random>
#include <ratio>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <string_view>
#include <tuple>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <valarray>
#include <variant>
#include <vector>
`;

// Split sysroot.tar into headers (clang) and libraries (wasm-ld), entry by entry.
function splitSysroot() {
  const tar = readFileSync(join(dist, "sysroot.tar"));
  const headers = [];
  const libs = [];
  let offset = 0;
  while (offset + 512 <= tar.length) {
    const header = tar.subarray(offset, offset + 512);
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/s, "");
    if (!name) break;
    const size = parseInt(header.subarray(124, 136).toString("utf8").replace(/\0.*$/s, "").trim(), 8) || 0;
    const total = 512 + Math.ceil(size / 512) * 512;
    const entry = tar.subarray(offset, offset + total);
    const isHeader = name.startsWith("include/") || /^lib\/clang\/[0-9]+\/include\//.test(name);
    if (isHeader) headers.push(entry);
    else if (name.startsWith("lib/")) libs.push(entry);
    else if (!name.endsWith("/")) throw new Error(`Unexpected sysroot entry ${name}`);
    offset += total;
  }
  headers.push(tarEntry("include/c++/v1/bits/stdc++.h", Buffer.from(BITS_STDCXX)));
  const end = Buffer.alloc(1024);
  return { headers: Buffer.concat([...headers, end]), libs: Buffer.concat([...libs, end]) };
}

for (const file of ["clang.js", "lld.js"]) copyFileSync(join(dist, file), join(target, stamped(file)));
const sysroot = splitSysroot();
const manifest = {
  package: "browsercc",
  version,
  stamp,
  clangJs: stamped("clang.js"),
  lldJs: stamped("lld.js"),
  clangWasm: writeGzip("clang.wasm.gz", readFileSync(join(dist, "clang.wasm"))),
  lldWasm: writeGzip("lld.wasm.gz", readFileSync(join(dist, "lld.wasm"))),
  headers: writeGzip("sysroot-include.tar.gz", sysroot.headers),
  libs: writeGzip("sysroot-lib.tar.gz", sysroot.libs),
};

// Licences: browsercc is MIT; Clang, LLD and libc++ are Apache-2.0 WITH
// LLVM-exception; the sysroot's wasi-libc keeps its own permissive licences.
writeFileSync(
  join(target, "THIRD-PARTY-NOTICES.txt"),
  [
    `Code_Expert's in-browser C++ compiler is the npm package browsercc ${version}`,
    "(Clang, LLD and libc++ from LLVM 20.1.2 compiled to WebAssembly, with a WASI sysroot).",
    "The files in this folder are copied from that package; the large ones are gzip-compressed,",
    "the sysroot is split into headers and libraries, and include/c++/v1/bits/stdc++.h was added.",
    "",
    "Clang, LLD, libc++, libc++abi and compiler-rt: Apache License 2.0 with LLVM Exceptions (below).",
    "wasi-libc (in the sysroot): Apache-2.0 WITH LLVM-exception, Apache-2.0 or MIT; its parts derived",
    "from other projects keep their licences (musl: MIT; dlmalloc: CC0; cloudlibc: BSD-2-Clause).",
    "",
    "==============================================================================",
    "browsercc: MIT License (author: Daniel Bertalan)",
    "==============================================================================",
    readFileSync(join(source, "LICENSE"), "utf8").trim(),
    "",
    readFileSync(join(root, "tools", "licenses", "LLVM-LICENSE.txt"), "utf8").trim(),
    "",
  ].join("\n"),
);
writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
let total = 0;
for (const name of [manifest.clangJs, manifest.lldJs, manifest.clangWasm, manifest.lldWasm, manifest.headers, manifest.libs]) {
  total += statSync(join(target, name)).size;
}
console.log(`Prepared the C++ compiler (browsercc ${version}) in public/cpp/browsercc-${version}/: ${(total / 1e6).toFixed(1)} MB to download`);
