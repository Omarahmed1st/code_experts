// Comparing program output: a student's typed answer to a trace question, or
// what a program printed against a test case. Pure, so the server, the browser
// and the content checker all compare the same way.
//
//   exact                 every character counts, except the line endings (\r\n = \n)
//                         and newlines at the very end, which nobody can see
//   trim_trailing         also ignores spaces at the end of each line and blank lines
//                         at the end (the default: invisible differences don't count)
//   normalize_whitespace  any run of spaces, tabs and newlines counts as one space
//
// Case matters unless the exercise says otherwise ("Hello" is not "hello").

export const COMPARE_MODES = ["exact", "trim_trailing", "normalize_whitespace"] as const;
export type CompareMode = (typeof COMPARE_MODES)[number];

export interface CompareOptions {
  mode: CompareMode;
  caseSensitive: boolean;
}

export const DEFAULT_COMPARE: CompareOptions = { mode: "trim_trailing", caseSensitive: true };

export function isCompareMode(value: unknown): value is CompareMode {
  return typeof value === "string" && (COMPARE_MODES as readonly string[]).includes(value);
}

export function normalizeOutput(text: string, { mode, caseSensitive }: CompareOptions): string {
  let out = text.replace(/\r\n?/g, "\n");
  if (mode === "normalize_whitespace") out = out.replace(/\s+/g, " ").trim();
  else if (mode === "trim_trailing") out = out.replace(/[ \t]+$/gm, "").replace(/\n+$/, "");
  else out = out.replace(/\n+$/, "");
  return caseSensitive ? out : out.toLowerCase();
}

export function outputsMatch(expected: string, actual: string, options: CompareOptions = DEFAULT_COMPARE): boolean {
  return normalizeOutput(expected, options) === normalizeOutput(actual, options);
}

export interface LineDifference {
  /** 1-based line number. */
  line: number;
  expected: string | null;
  actual: string | null;
}

/** The first line where two outputs differ after normalizing, for "expected … got …" feedback. */
export function firstDifference(expected: string, actual: string, options: CompareOptions = DEFAULT_COMPARE): LineDifference | null {
  const e = normalizeOutput(expected, options);
  const a = normalizeOutput(actual, options);
  if (e === a) return null;
  const el = e.split("\n");
  const al = a.split("\n");
  for (let i = 0; i < Math.max(el.length, al.length); i++) {
    if (el[i] !== al[i]) return { line: i + 1, expected: el[i] ?? null, actual: al[i] ?? null };
  }
  return { line: 1, expected: e, actual: a };
}
