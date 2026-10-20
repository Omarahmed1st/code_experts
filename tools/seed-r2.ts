// Uploads the lesson images listed in seed/r2-objects.json to the LOCAL R2
// bucket (the same storage `npm run dev` and `npm start` read).
//
//   node --experimental-strip-types tools/seed-r2.ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runWrangler } from "./wrangler.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const BUCKET = "codelab-files";
const objects = JSON.parse(readFileSync(join(ROOT, "seed", "r2-objects.json"), "utf8")) as {
  key: string;
  file: string;
  contentType: string;
}[];

let failures = 0;
for (const object of objects) {
  const result = runWrangler(ROOT, [
    "r2",
    "object",
    "put",
    `${BUCKET}/${object.key}`,
    "--file",
    join(ROOT, object.file),
    "--content-type",
    object.contentType,
    "--local",
  ]);
  if (result.status === 0) console.log(`uploaded ${object.key}`);
  else {
    failures += 1;
    console.error(`FAILED ${object.key}\n${result.stderr}`);
  }
}
console.log(`${objects.length - failures} of ${objects.length} images uploaded to local R2.`);
process.exit(failures > 0 ? 1 : 0);
