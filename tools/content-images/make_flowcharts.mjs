// Draws the flowcharts used by the Programming Fundamentals lessons
// (content/programming-fundamentals/images/*.png).
//
//   node tools/content-images/make_flowcharts.mjs
//
// Each chart is written as an SVG (tools/content-images/flowcharts/*.svg, kept so
// a chart can be reviewed or tweaked by hand) and then turned into a PNG with
// Playwright's Chromium. If Playwright isn't installed in this project, point
// PLAYWRIGHT_MODULE at an installed copy, for example
//   PLAYWRIGHT_MODULE=/opt/node-tools/node_modules/playwright/index.mjs
//
// The pictures are drawn from code, so anyone can recreate or change them.
// Colours are the lec palette: navy stage, ink text, green Start/End, sky
// input/output, yellow decisions and the yellow "repeat" arrow.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "..", "..");
const SVG_DIR = join(HERE, "flowcharts");
const OUT = join(ROOT, "content", "programming-fundamentals", "images");

const C = {
  navy: "#14213D",
  panel: "#1C2D52",
  line: "#5A6E99",
  ink: "#F2F5FA",
  muted: "#AFC0DD",
  yellow: "#FFD43B",
  sky: "#8CC4F2",
  coral: "#FF8A7A",
  green: "#5FD39A",
};

const MONO = 16; // px, DejaVu Sans Mono Bold
const CHAR = MONO * 0.602; // advance width of one mono character
const NODE_H = 52;
const DIAMOND_H = 104;

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A chart: nodes placed by centre point, and arrows routed through given points. */
class Chart {
  constructor(name, title, width, height) {
    Object.assign(this, { name, title, width, height, nodes: {}, back: [], front: [] });
  }

  node(id, kind, text, cx, cy, opts = {}) {
    const lines = text.split("\n");
    const longest = Math.max(...lines.map((l) => l.length));
    const padX = kind === "diamond" ? 0 : kind === "io" ? 54 : kind === "oval" ? 44 : 36;
    let w = opts.w ?? Math.max(kind === "oval" ? 120 : 150, Math.ceil(longest * CHAR + padX));
    let h = opts.h ?? (kind === "diamond" ? DIAMOND_H : NODE_H + (lines.length - 1) * 22);
    if (kind === "diamond" && !opts.w) w = Math.max(190, Math.ceil(longest * CHAR * 1.55 + 70));
    const n = { id, kind, text, lines, cx, cy, w, h, color: opts.color };
    const skew = 16;
    n.skew = kind === "io" ? skew : 0;
    n.t = [cx, cy - h / 2];
    n.b = [cx, cy + h / 2];
    n.l = [cx - w / 2 + n.skew / 2, cy];
    n.r = [cx + w / 2 - n.skew / 2, cy];
    this.nodes[id] = n;
    return n;
  }

  /** An arrow (or a plain line with arrow: false) through the points, with rounded corners. */
  edge(points, { color = C.line, arrow = true, label, at, labelColor, dashed = false, width = 2.6 } = {}) {
    const r = 10;
    let d = `M ${points[0][0]} ${points[0][1]}`;
    for (let i = 1; i < points.length; i++) {
      const [x, y] = points[i];
      if (i < points.length - 1) {
        const [px, py] = points[i - 1];
        const [nx, ny] = points[i + 1];
        const inLen = Math.hypot(x - px, y - py);
        const outLen = Math.hypot(nx - x, ny - y);
        const k = Math.min(r, inLen / 2, outLen / 2);
        const ax = x - ((x - px) / inLen) * k;
        const ay = y - ((y - py) / inLen) * k;
        const bx = x + ((nx - x) / outLen) * k;
        const by = y + ((ny - y) / outLen) * k;
        d += ` L ${ax} ${ay} Q ${x} ${y} ${bx} ${by}`;
      } else {
        d += ` L ${x} ${y}`;
      }
    }
    const marker = arrow ? ` marker-end="url(#arrow-${color.slice(1)})"` : "";
    this.back.push(
      `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linejoin="round" stroke-linecap="round"${dashed ? ' stroke-dasharray="7 6"' : ""}${marker}/>`,
    );
    if (label) this.label(label, at ?? points[0], labelColor ?? color);
  }

  /** A small pill of text, such as YES / NO on a decision's exits. */
  label(text, [x, y], color) {
    const w = Math.ceil(text.length * 8.6 + 22);
    this.front.push(
      `<g><rect x="${x - w / 2}" y="${y - 13}" width="${w}" height="26" rx="13" fill="${C.navy}" stroke="${color}" stroke-width="1.6"/>` +
        `<text x="${x}" y="${y + 5}" text-anchor="middle" class="pill" fill="${color}">${esc(text)}</text></g>`,
    );
  }

  /** Free text, for side notes such as "runs once". */
  note(text, [x, y], { color = C.muted, anchor = "start" } = {}) {
    this.front.push(`<text x="${x}" y="${y}" text-anchor="${anchor}" class="note" fill="${color}">${esc(text)}</text>`);
  }

  dot([x, y], color = C.line) {
    this.front.push(`<circle cx="${x}" cy="${y}" r="4.5" fill="${color}"/>`);
  }

  shape(n) {
    const { cx, cy, w, h } = n;
    const x = cx - w / 2;
    const y = cy - h / 2;
    const stroke = n.color ?? { oval: C.green, io: C.sky, rect: C.ink, diamond: C.yellow }[n.kind];
    const common = `fill="${C.panel}" stroke="${stroke}" stroke-width="2.6"`;
    let body;
    if (n.kind === "oval") body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" ${common}/>`;
    else if (n.kind === "rect") body = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6" ${common}/>`;
    else if (n.kind === "io")
      body = `<polygon points="${x + n.skew},${y} ${x + w},${y} ${x + w - n.skew},${y + h} ${x},${y + h}" ${common}/>`;
    else body = `<polygon points="${cx},${y} ${x + w},${cy} ${cx},${y + h} ${x},${cy}" ${common}/>`;
    const first = cy - ((n.lines.length - 1) * 22) / 2 + 6;
    const text = n.lines
      .map((line, i) => `<text x="${cx}" y="${first + i * 22}" text-anchor="middle" class="code">${esc(line).replace(/←/g, '<tspan class="arrow">←</tspan>')}</text>`)
      .join("");
    return `<g>${body}${text}</g>`;
  }

  svg() {
    const colors = [C.line, C.yellow, C.green, C.coral, C.sky, C.ink];
    const markers = colors
      .map(
        (c) =>
          `<marker id="arrow-${c.slice(1)}" viewBox="0 0 10 10" refX="8.6" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">` +
          `<path d="M 0 0 L 10 5 L 0 10 z" fill="${c}"/></marker>`,
      )
      .join("");
    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">`,
      `<defs>${markers}<style>`,
      `.code{font-family:"CodeMono","DejaVu Sans Mono",monospace;font-weight:700;font-size:${MONO}px;fill:${C.ink}}`,
      `.arrow{font-family:"DejaVu Sans","Noto Sans Symbols 2",sans-serif;font-size:${MONO + 5}px;font-weight:700}`,
      `.pill{font-family:"Poppins",sans-serif;font-weight:600;font-size:13px;letter-spacing:.06em}`,
      `.note{font-family:"Poppins",sans-serif;font-weight:500;font-size:14px}`,
      `.head{font-family:"Poppins",sans-serif;font-weight:600;font-size:15px;letter-spacing:.12em}`,
      `</style></defs>`,
      `<rect width="100%" height="100%" rx="18" fill="${C.navy}"/>`,
      `<text x="28" y="34" class="head" fill="${C.sky}">FLOWCHART <tspan fill="${C.muted}">──</tspan> <tspan fill="${C.ink}">${esc(this.title.toUpperCase())}</tspan></text>`,
      ...this.back,
      ...Object.values(this.nodes).map((n) => this.shape(n)),
      ...this.front,
      `</svg>`,
    ].join("\n");
  }
}

const charts = [];
const chart = (...args) => {
  const c = new Chart(...args);
  charts.push(c);
  return c;
};

/** Nodes one under the other in a column, joined by arrows. Returns the nodes. */
function column(c, x, y0, specs, gap = 34) {
  const out = [];
  let y = y0;
  for (const [id, kind, text, opts] of specs) {
    const h = opts?.h ?? (kind === "diamond" ? DIAMOND_H : NODE_H + (text.split("\n").length - 1) * 22);
    const n = c.node(id, kind, text, x, y + h / 2, opts);
    if (out.length) c.edge([out[out.length - 1].b, n.t]);
    out.push(n);
    y += h + gap;
  }
  return out;
}

/** A decision whose YES path goes left and NO path goes right; both join and continue down. */
function branch(c, d, yes, no, { spread = 210, yesText = "YES", noText = "NO", joinTo } = {}) {
  const y = d.b[1] + 44 + NODE_H / 2;
  const left = c.node(yes[0], yes[1], yes[2], d.cx - spread, y, yes[3]);
  const right = c.node(no[0], no[1], no[2], d.cx + spread, y, no[3]);
  c.edge([[d.cx - d.w / 2, d.cy], [left.cx, d.cy], left.t], { color: C.green });
  c.edge([[d.cx + d.w / 2, d.cy], [right.cx, d.cy], right.t], { color: C.coral });
  c.label(yesText, [d.cx - d.w / 2 - 34, d.cy - 18], C.green);
  c.label(noText, [d.cx + d.w / 2 + 30, d.cy - 18], C.coral);
  return { left, right, joinY: y + NODE_H / 2 + 30, joinTo };
}

/** Joins the two ends of a branch under it and draws the arrow to the next node. */
function joinPaths(c, d, bottomLeft, bottomRight, joinY, next) {
  c.edge([bottomLeft, [bottomLeft[0], joinY], [d.cx, joinY]], { arrow: false });
  c.edge([bottomRight, [bottomRight[0], joinY], [d.cx, joinY]], { arrow: false });
  c.dot([d.cx, joinY]);
  c.edge([[d.cx, joinY], next.t]);
}

// ── 1. The symbols ────────────────────────────────────────────────────────────
{
  const c = chart("flowchart-symbols", "The symbols", 760, 540);
  const rows = [
    ["oval", "Start", "Oval: where the algorithm starts and ends"],
    ["io", "Input T", "Parallelogram: input (read) or output (print)"],
    ["rect", "area ← l * w", "Rectangle: a process, such as a calculation"],
    ["diamond", "T > 30?", "Diamond: a decision with two exits, YES and NO"],
  ];
  rows.forEach(([kind, text, note], i) => {
    const y = 104 + i * 96 + (kind === "diamond" ? 18 : 0);
    c.node(`s${i}`, kind, text, 150, y, kind === "diamond" ? { w: 190, h: 92 } : { w: 190 });
    c.note(note, [290, y + 5], { color: C.ink });
  });
  c.edge([[64, 500], [236, 500]]);
  c.note("Arrow: the order the steps run in", [290, 505], { color: C.ink });
}

// ── 2. Average of three numbers ───────────────────────────────────────────────
{
  const c = chart("average-of-three", "Average of three numbers", 520, 640);
  column(c, 260, 80, [
    ["start", "oval", "Start"],
    ["in", "io", "Input N1, N2, N3"],
    ["sum", "rect", "SUM ← N1 + N2 + N3"],
    ["avg", "rect", "AVERAGE ← SUM / 3"],
    ["out", "io", "Print AVERAGE"],
    ["end", "oval", "End"],
  ]);
}

/** Start → Input → decision → two outputs → End. */
function decisionChart(name, title, input, question, yes, no, labels = {}) {
  const c = chart(name, title, 700, 600);
  const [, , d] = column(c, 350, 80, [
    ["start", "oval", "Start"],
    ["in", "io", input],
    ["d", "diamond", question],
  ]);
  const b = branch(c, d, ["yes", "io", yes], ["no", "io", no], labels);
  const end = c.node("end", "oval", "End", 350, b.joinY + 34 + NODE_H / 2);
  joinPaths(c, d, b.left.b, b.right.b, b.joinY, end);
  return c;
}

decisionChart("temperature-fan", "Temperature monitoring", "Input T", "T > 30?", 'Print "Fan ON"', 'Print "Fan OFF"');

// ── Rectangle area (week 3) ───────────────────────────────────────────────────
{
  const c = chart("rectangle-area", "Area of a rectangle", 540, 560);
  column(c, 270, 80, [
    ["start", "oval", "Start"],
    ["in", "io", "Input Length, Width"],
    ["calc", "rect", "Area = Length × Width"],
    ["out", "io", "Print Area"],
    ["end", "oval", "End"],
  ]);
}

decisionChart("pass-or-fail", "Pass or fail", "Input Mark", "Mark >= 50?", 'Print "PASS"', 'Print "FAIL"');
decisionChart("larger-number", "Find the larger number", "Input A, B", "A > B?", "Print A", "Print B");
decisionChart("even-or-odd", "Even or odd", "Input N", "N % 2 == 0?", 'Print "EVEN"', 'Print "ODD"');

/**
 * A counting loop: initialization, the condition, the body, the update, and the
 * yellow arrow back to the condition. NO leaves to the right.
 */
function loopChart(name, title, { start = true, init, cond, body, update, exit = "End", yes = "YES", no = "NO", notes = false }) {
  const specs = [];
  if (start) specs.push(["start", "oval", "Start"]);
  if (init) specs.push(["init", "rect", init]);
  specs.push(["cond", "diamond", cond]);
  body.forEach(([kind, text], i) => specs.push([`body${i}`, kind, text]));
  if (update) specs.push(["upd", "rect", update]);
  const heights = specs.reduce((sum, [, kind, text]) => sum + (kind === "diamond" ? DIAMOND_H : NODE_H + (text.split("\n").length - 1) * 22) + 34, 0);
  const c = chart(name, title, 780, 80 + heights + 60);
  const nodes = column(c, 300, 80, specs);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const cond2 = byId.cond;
  // The arrow from the condition into the body is the YES exit.
  c.label(yes, [cond2.cx + 34, cond2.b[1] + 17], C.green);
  const last = nodes[nodes.length - 1];
  const loopX = 300 - Math.max(...nodes.slice(nodes.indexOf(cond2)).map((n) => n.w / 2)) - 46;
  const below = last.b[1] + 26;
  c.edge([last.b, [last.cx, below], [loopX, below], [loopX, cond2.cy], cond2.l], { color: C.yellow, width: 3 });
  c.note("repeat", [loopX - 10, (below + cond2.cy) / 2], { color: C.yellow, anchor: "end" });
  const exitNode = c.node("exit", "oval", exit, 650, last.b[1] + 4 - NODE_H / 2);
  c.edge([cond2.r, [exitNode.cx, cond2.cy], exitNode.t], { color: C.coral });
  c.label(no, [cond2.r[0] + 34, cond2.cy - 18], C.coral);
  if (notes) {
    if (byId.init) c.note("runs once", [byId.init.r[0] + 14, byId.init.cy + 5]);
    c.note("checked before every pass", [cond2.cx + 26, cond2.t[1] - 8]);
    if (byId.upd) c.note("after the body, every time", [byId.upd.r[0] + 14, byId.upd.cy + 5]);
  }
  return c;
}

loopChart("count-1-to-5", "Count from 1 to 5", {
  init: "counter ← 1",
  cond: "counter <= 5?",
  body: [["io", "Print counter"]],
  update: "counter ← counter + 1",
});

loopChart("loop-three-parts", "How a loop works", {
  start: false,
  init: "1  Initialize",
  cond: "2  Condition?",
  body: [["rect", "Execute the body"]],
  update: "3  Update",
  exit: "Exit loop",
  yes: "TRUE",
  no: "FALSE",
  notes: true,
});

loopChart("for-loop-order", "Order of a for loop", {
  start: false,
  init: "int i = 1",
  cond: "i <= 5 ?",
  body: [["io", "cout << i;"]],
  update: "i++",
  exit: "Exit loop",
  yes: "TRUE",
  no: "FALSE",
  notes: true,
});

// ── do-while: the body first, then the check ─────────────────────────────────
{
  const c = chart("do-while-flow", "do-while", 720, 470);
  const [s, body, cond] = column(c, 300, 80, [
    ["start", "oval", "Loop starts"],
    ["body", "rect", "Run the body"],
    ["cond", "diamond", "Condition?"],
  ]);
  c.note("no check first", [s.r[0] + 16, s.cy + 5]);
  const loopX = 300 - cond.w / 2 - 46;
  c.edge([cond.l, [loopX, cond.cy], [loopX, body.cy], body.l], { color: C.yellow, width: 3 });
  c.label("TRUE", [cond.l[0] - 2, cond.cy + 26], C.green);
  c.note("repeat", [loopX - 10, (cond.cy + body.cy) / 2 + 5], { color: C.yellow, anchor: "end" });
  const exit = c.node("exit", "oval", "Exit loop", 300, cond.b[1] + 44 + NODE_H / 2);
  c.edge([cond.b, exit.t], { color: C.coral });
  c.label("FALSE", [cond.cx + 40, cond.b[1] + 18], C.coral);
  c.note("the body always runs at least once", [body.r[0] + 16, body.cy + 5]);
}

/** A loop whose body reads a value and makes a decision (week 3 final challenge, week 4 fan control). */
function decisionInLoop(name, title, { init, cond, input, question, yes, no, yesExtra, update, after }) {
  const c = chart(name, title, 900, 10);
  const cx = 430;
  const nodes = column(c, cx, 80, [["start", "oval", "Start"], ["init", "rect", init], ["cond", "diamond", cond], ["in", "io", input], ["d", "diamond", question]]);
  const cnd = nodes[2];
  const d = nodes[4];
  c.label("YES", [cnd.cx + 34, cnd.b[1] + 17], C.green);
  const b = branch(c, d, ["yes", "io", yes], ["no", "io", no], { spread: 200 });
  let leftBottom = b.left.b;
  let joinY = b.joinY;
  if (yesExtra) {
    const extra = c.node("yes2", "rect", yesExtra, b.left.cx, b.left.b[1] + 34 + NODE_H / 2);
    c.edge([b.left.b, extra.t]);
    leftBottom = extra.b;
    joinY = extra.b[1] + 30;
  }
  const upd = c.node("upd", "rect", update, cx, joinY + 34 + NODE_H / 2);
  joinPaths(c, d, leftBottom, b.right.b, joinY, upd);
  const loopX = 70;
  const below = upd.b[1] + 26;
  c.edge([upd.b, [cx, below], [loopX, below], [loopX, cnd.cy], cnd.l], { color: C.yellow, width: 3 });
  c.note("repeat", [loopX + 10, cnd.cy - 12], { color: C.yellow });
  // NO: leave the loop on the right, then the last steps.
  const rx = 800;
  const tail = [];
  let y = below + 50 + NODE_H / 2;
  for (const [kind, text] of after) {
    tail.push(c.node(`after${tail.length}`, kind, text, rx - 110, y));
    y += NODE_H + 34;
  }
  c.edge([cnd.r, [rx, cnd.cy], [rx, tail[0].cy - NODE_H / 2 - 22], [tail[0].cx, tail[0].cy - NODE_H / 2 - 22], tail[0].t], { color: C.coral });
  c.label("NO", [cnd.r[0] + 30, cnd.cy - 18], C.coral);
  for (let i = 1; i < tail.length; i++) c.edge([tail[i - 1].b, tail[i].t]);
  c.height = Math.ceil(y - NODE_H / 2 - 34 + 40);
  return c;
}

decisionInLoop("exam-results", "Exam results processor", {
  init: "counter ← 1\npassCount ← 0",
  cond: "counter <= 5?",
  input: "Input mark",
  question: "mark >= 50?",
  yes: 'Print "PASS"',
  no: 'Print "FAIL"',
  yesExtra: "passCount ←\npassCount + 1",
  update: "counter ← counter + 1",
  after: [["io", "Print passCount"], ["oval", "End"]],
});

decisionInLoop("fan-control-loop", "Temperature sensor loop", {
  init: "int i = 1",
  cond: "i <= 5?",
  input: "Input temperature",
  question: "temperature > 30?",
  yes: 'Print "Fan ON"',
  no: 'Print "Fan OFF"',
  update: "i++",
  after: [["oval", "End"]],
});

// ── Write the SVGs, then the PNGs ─────────────────────────────────────────────
mkdirSync(SVG_DIR, { recursive: true });
mkdirSync(OUT, { recursive: true });
for (const c of charts) writeFileSync(join(SVG_DIR, `${c.name}.svg`), c.svg() + "\n");
console.log(`wrote ${charts.length} SVGs to ${SVG_DIR}`);

const fontUrl = (p) => pathToFileURL(join(ROOT, "node_modules", "@fontsource", p)).href;
const FONTS = `
@font-face{font-family:"Poppins";font-weight:500;src:url(${fontUrl("poppins/files/poppins-latin-500-normal.woff2")})}
@font-face{font-family:"Poppins";font-weight:600;src:url(${fontUrl("poppins/files/poppins-latin-600-normal.woff2")})}
@font-face{font-family:"CodeMono";font-weight:700;src:url(${fontUrl("dejavu-mono/files/dejavu-mono-latin-700-normal.woff2")})}
html,body{margin:0;background:transparent}`;

let playwright;
try {
  playwright = await import(process.env.PLAYWRIGHT_MODULE ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
} catch {
  console.log("Playwright not found: the PNGs were not updated. Set PLAYWRIGHT_MODULE (see the top of this file).");
  process.exit(1);
}
const { chromium } = playwright.default ?? playwright;
const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 2 });
for (const c of charts) {
  await page.setViewportSize({ width: c.width, height: c.height });
  // file:// base so the page may load the font files from node_modules.
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>${FONTS}</style></head><body>${c.svg()}</body></html>`;
  const tmp = join(SVG_DIR, `.${c.name}.html`);
  writeFileSync(tmp, html);
  await page.goto(pathToFileURL(tmp).href);
  await page.evaluate("document.fonts.ready");
  await page.locator("svg").screenshot({ path: join(OUT, `${c.name}.png`), omitBackground: true });
  (await import("node:fs")).rmSync(tmp);
  console.log("wrote", `${c.name}.png`, `${c.width}x${c.height}`);
}
await browser.close();
