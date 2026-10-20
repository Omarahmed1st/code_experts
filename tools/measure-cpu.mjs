// Rough CPU-time-per-request measurement against the local Workers preview.
//
// Usage: start the built Worker (`npm run build && npm start`), then
//   npm run measure:cpu -- [baseUrl] [requestsPerRoute]
//
// How it works: reads the CPU time (user + system) of the local workerd
// processes from /proc before and after N sequential requests to each route,
// and divides by N. Linux only.
//
// What the number means: CPU spent by the Workers runtime on this machine,
// including HTTP handling and local D1 (SQLite) work. It is an estimate for the
// plan decision, not Cloudflare's billed figure: production hardware differs,
// and production D1 queries run outside the Worker. Confirm with the CPU-time
// metrics in the Cloudflare dashboard after the first deploy.
import { readFileSync, readdirSync } from "node:fs";

const base = process.argv[2] ?? "http://localhost:8787";
const perRoute = Number(process.argv[3] ?? 200);
const routes = [
  "/api/health",
  "/",
  "/courses",
  "/courses/programming-fundamentals",
  "/courses/programming-applications/lectures/strings-indexing-and-slicing",
  "/courses/programming-fundamentals/lectures/for-loops",
  "/courses/programming-applications/search?q=slicing",
  "/this-page-does-not-exist",
];
const TICKS_PER_SECOND = 100; // getconf CLK_TCK on Linux

function workerdPids() {
  return readdirSync("/proc").filter((pid) => {
    if (!/^\d+$/.test(pid)) return false;
    try {
      const argv0 = readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0")[0] ?? "";
      return argv0.endsWith("/workerd");
    } catch {
      return false;
    }
  });
}

function cpuMsOf(pid) {
  try {
    // fields after the ")" of the command name: utime is field 14, stime 15 (1-based)
    const stat = readFileSync(`/proc/${pid}/stat`, "utf8");
    const fields = stat.slice(stat.lastIndexOf(")") + 2).split(" ");
    return ((Number(fields[11]) + Number(fields[12])) * 1000) / TICKS_PER_SECOND;
  } catch {
    return 0; // process exited
  }
}

const pids = workerdPids();
if (pids.length === 0) {
  console.error("No workerd process found. Start the preview first: npm run build && npm start");
  process.exit(1);
}

console.log(`${perRoute} requests per route against ${base}`);
console.log("CPU ms per request for each workerd process (wrangler dev runs a proxy and the Worker separately)\n");
console.log("route".padEnd(74) + "status" + pids.map((pid) => `pid ${pid}`.padStart(12)).join("") + "     wall ms");

for (const route of routes) {
  // warm-up: module compilation and first-request work aren't part of the steady state
  for (let i = 0; i < 5; i += 1) await (await fetch(base + route)).arrayBuffer();
  const before = pids.map(cpuMsOf);
  const wallBefore = performance.now();
  let status = 0;
  for (let i = 0; i < perRoute; i += 1) {
    const response = await fetch(base + route);
    await response.arrayBuffer();
    status = response.status;
  }
  const cpu = pids.map((pid, i) => (cpuMsOf(pid) - before[i]) / perRoute);
  const wall = (performance.now() - wallBefore) / perRoute;
  console.log(
    route.padEnd(74) +
      String(status).padEnd(6) +
      cpu.map((ms) => ms.toFixed(2).padStart(12)).join("") +
      wall.toFixed(2).padStart(12),
  );
}
