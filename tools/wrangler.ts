// Runs the project's own wrangler (node_modules/wrangler) without a shell.
//
// The tools used to call `npx wrangler …` with `shell: true` on Windows. A shell
// joins the arguments with spaces and doesn't quote them, so a file path with a
// space in it (C:\Users\me\My Projects\codelab\…) was split in two. Starting
// wrangler's JavaScript entry point with the same Node.js that runs this tool
// passes every argument through unchanged, on Windows, macOS and Linux alike.
import { spawnSync, type SpawnSyncReturns } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

/** Absolute path of wrangler's command-line entry point in this project. */
export function wranglerEntry(root: string): string {
  return join(root, "node_modules", "wrangler", "bin", "wrangler.js");
}

/** `wrangler <args>` in the project folder. Exits with a clear message if dependencies aren't installed. */
export function runWrangler(root: string, args: string[]): SpawnSyncReturns<string> {
  const entry = wranglerEntry(root);
  if (!existsSync(entry)) {
    console.error(`wrangler isn't installed in ${root}. Run \`npm ci\` in the project folder first.`);
    process.exit(1);
  }
  return spawnSync(process.execPath, [entry, ...args], { cwd: root, encoding: "utf8" });
}
