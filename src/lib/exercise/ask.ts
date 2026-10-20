// Question formats built on the four stored types (front matter `ask:`,
// stored in exercises.settings.ask), so no new database type is needed:
//
//   trace + ask: count     "How many times does … run?"  one-number answer
//   trace + ask: value     "What is x when …?"            one-line answer
//   correct_code + ask: blanks   fill in the ___ blanks in the program
//   correct_code + ask: order    put the shuffled lines in the right order
//
// count and value are marked like any trace answer (against ## Answer); a
// hidden ```cpp verify (or ```python verify) program prints the answer so the
// checker can prove it. blanks and order are marked like correct_code: the
// program the student builds must match the solution or an accepted fix.
// Pure: used by the content tools (Node), the server and the browser.

export const ASKS = ["count", "value", "blanks", "order"] as const;
export type Ask = (typeof ASKS)[number];

export function isAsk(value: unknown): value is Ask {
  return typeof value === "string" && (ASKS as readonly string[]).includes(value);
}

/** Which base type each format belongs to. */
export const ASK_TYPE: Record<Ask, "trace" | "correct_code"> = {
  count: "trace",
  value: "trace",
  blanks: "correct_code",
  order: "correct_code",
};

/** A blank in a fill-in-the-blanks program: three or more underscores. */
export const BLANK = /_{3,}/g;

export function countBlanks(template: string): number {
  return template.match(BLANK)?.length ?? 0;
}

/** The template with each blank replaced by the student's text, in order. */
export function fillBlanks(template: string, values: readonly string[]): string {
  let i = 0;
  return template.replace(BLANK, () => values[i++] ?? "");
}

/** Splits one template line around its blanks: text, blank, text, … (always one more text than blanks). */
export function splitBlanks(line: string): string[] {
  return line.split(BLANK);
}

/**
 * The text that fills each blank so the template becomes `program`, or null
 * when the program doesn't fit the template (outside the blanks, every
 * character must be the same). Line endings are ignored at the end.
 */
export function blanksOf(template: string, program: string): string[] | null {
  const parts = template.replace(/\n+$/, "").split(BLANK).map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const match = new RegExp(`^${parts.join("([^\\n]*?)")}$`).exec(program.replace(/\n+$/, ""));
  return match ? match.slice(1) : null;
}

/** `// [order]` … `// [/order]` (or `#` in Python) around the lines students put in order. */
const ORDER_START = /^\s*(?:\/\/|#)\s*\[order\]\s*$/;
const ORDER_END = /^\s*(?:\/\/|#)\s*\[\/order\]\s*$/;

export interface OrderParts {
  /** Lines shown above the lines to order. */
  before: string[];
  /** The lines to order, in the correct order. */
  block: string[];
  /** Lines shown below. */
  after: string[];
}

/** Splits a put-in-order program at its markers, or null when the markers are missing or repeated. */
export function orderParts(code: string): OrderParts | null {
  const lines = code.replace(/\n+$/, "").split("\n");
  const start = lines.findIndex((l) => ORDER_START.test(l));
  const end = lines.findIndex((l) => ORDER_END.test(l));
  if (start < 0 || end <= start) return null;
  if (lines.filter((l) => ORDER_START.test(l) || ORDER_END.test(l)).length !== 2) return null;
  return { before: lines.slice(0, start), block: lines.slice(start + 1, end), after: lines.slice(end + 1) };
}

/** The complete program for an arrangement of the lines. */
export function joinOrder(parts: Pick<OrderParts, "before" | "after">, block: readonly string[]): string {
  return [...parts.before, ...block, ...parts.after].join("\n") + "\n";
}

/** Whether two lists hold the same lines (in any order). */
export function sameLines(a: readonly string[], b: readonly string[]): boolean {
  const sorted = (x: readonly string[]) => [...x].sort().join("\n");
  return a.length === b.length && sorted(a) === sorted(b);
}

/** A random order of the lines that differs from the correct one when it can (Fisher-Yates). */
export function scramble(lines: readonly string[], random: () => number): string[] {
  const canDiffer = new Set(lines).size > 1;
  for (let attempt = 0; attempt < 20; attempt++) {
    const out = [...lines];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.min(i, Math.floor(random() * (i + 1)));
      [out[i], out[j]] = [out[j]!, out[i]!];
    }
    if (!canDiffer || out.some((line, i) => line !== lines[i])) return out;
  }
  // Very unlikely: fall back to rotating by one, which always differs when two lines differ.
  return [...lines.slice(1), lines[0]!];
}

/** Labels shown to students. */
export const ASK_LABEL: Record<Ask, string> = {
  count: "How many times?",
  value: "Find the value",
  blanks: "Fill in the blanks",
  order: "Put the lines in order",
};

/**
 * Splits one highlighted HTML line at its blanks, keeping every piece valid
 * HTML: a <span> that a blank cuts through is closed before the blank and
 * opened again after it (the highlighter only writes flat <span>s).
 */
export function splitHtmlAtBlanks(html: string): string[] {
  const out: string[] = [];
  let open: string[] = [];
  for (const raw of html.split(BLANK)) {
    const reopened = open.join("");
    for (const tag of raw.match(/<span[^>]*>|<\/span>/g) ?? []) {
      if (tag === "</span>") open = open.slice(0, -1);
      else open = [...open, tag];
    }
    out.push(reopened + raw + "</span>".repeat(open.length));
  }
  return out;
}
