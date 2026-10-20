// Comparing a student's corrected code with the known good fixes, without
// caring about layout: spaces, blank lines, comments and where the braces go
// don't change the answer. Code is split into tokens (words, numbers, strings,
// operators) and two programs match when their tokens are the same.
//
// - C++: whitespace never matters between tokens.
// - Python: indentation does matter, so each line's indent level is kept as a
//   token (the width doesn't matter, only the nesting). Lines inside brackets
//   continue the line before. 'single' and "double" quoted strings are equal.
//
// This is how correct-the-code answers are scored on the server, against
// several accepted fixes (exercise_answers). It can't recognise every possible
// correct fix; students also run their fix against the test cases in their
// browser, and Phase 9's runner will grade by tests instead.

export type CodeMatchLanguage = "cpp" | "python";

const CPP_OPERATORS = [
  ">>=", "<<=", "...", "->*", "<=>",
  "::", "->", "++", "--", "<<", ">>", "<=", ">=", "==", "!=", "&&", "||",
  "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", ".*", "##",
];

const PYTHON_OPERATORS = [
  "**=", "//=", ">>=", "<<=", "...",
  "**", "//", "==", "!=", "<=", ">=", "->", "+=", "-=", "*=", "/=", "%=", "&=", "|=", "^=", ":=", "<<", ">>",
];

function readQuoted(code: string, start: number, quote: string): number {
  let i = start + 1;
  while (i < code.length && code[i] !== quote && code[i] !== "\n") {
    i += code[i] === "\\" ? 2 : 1;
  }
  return Math.min(code.length, i + 1);
}

function operatorAt(code: string, i: number, operators: string[]): string {
  for (const op of operators) if (code.startsWith(op, i)) return op;
  return code[i] ?? "";
}

export function cppTokens(code: string): string[] {
  const src = code.replace(/\r\n?/g, "\n");
  const tokens: string[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i] ?? "";
    if (/\s/.test(c)) {
      i += 1;
    } else if (src.startsWith("//", i)) {
      while (i < src.length && src[i] !== "\n") i += 1;
    } else if (src.startsWith("/*", i)) {
      const end = src.indexOf("*/", i + 2);
      i = end === -1 ? src.length : end + 2;
    } else if (c === '"' || c === "'") {
      const end = readQuoted(src, i, c);
      tokens.push(src.slice(i, end));
      i = end;
    } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(src[i + 1] ?? ""))) {
      const m = /^[0-9.]+(?:[eE][+-]?[0-9]+)?[\w']*/.exec(src.slice(i));
      const text = m?.[0] ?? c;
      tokens.push(text.replace(/'/g, ""));
      i += text.length;
    } else if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_]\w*/.exec(src.slice(i));
      const text = m?.[0] ?? c;
      tokens.push(text);
      i += text.length;
    } else {
      const op = operatorAt(src, i, CPP_OPERATORS);
      tokens.push(op);
      i += op.length;
    }
  }
  return tokens;
}

/** Python string token with its quotes made uniform: 'hi' and "hi" are the same string. */
function pythonString(text: string): string {
  const prefix = /^[A-Za-z]*/.exec(text)?.[0] ?? "";
  const body = text.slice(prefix.length);
  const q = body.startsWith('"""') || body.startsWith("'''") ? 3 : 1;
  return `${prefix.toLowerCase()}"${body.slice(q, body.length - q)}"`;
}

export function pythonTokens(code: string): string[] {
  const lines = code.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").split("\n");
  const tokens: string[] = [];
  const indents: number[] = [0];
  let depth = 0;
  for (const line of lines) {
    const lineTokens: string[] = [];
    let i = 0;
    const startsLogicalLine = depth === 0;
    while (i < line.length) {
      const c = line[i] ?? "";
      if (c === " ") {
        i += 1;
      } else if (c === "#") {
        break;
      } else if (/^[rRbBuUfF]{0,2}['"]/.test(line.slice(i))) {
        // A string, maybe with a prefix such as f"…" (we are at the start of a token).
        const prefix = /^[rRbBuUfF]*/.exec(line.slice(i))?.[0] ?? "";
        const at = i + prefix.length;
        const quote = line[at] ?? '"';
        const triple = line.startsWith(quote.repeat(3), at);
        const close = triple ? line.indexOf(quote.repeat(3), at + 3) : -1;
        const stop = triple ? (close === -1 ? line.length : close + 3) : readQuoted(line, at, quote);
        lineTokens.push(pythonString(line.slice(i, stop)));
        i = stop;
      } else if (/[0-9]/.test(c) || (c === "." && /[0-9]/.test(line[i + 1] ?? ""))) {
        const m = /^[0-9.]+(?:[eE][+-]?[0-9]+)?\w*/.exec(line.slice(i));
        const text = m?.[0] ?? c;
        lineTokens.push(text.replace(/_/g, ""));
        i += text.length;
      } else if (/[A-Za-z_]/.test(c)) {
        const m = /^[A-Za-z_]\w*/.exec(line.slice(i));
        const text = m?.[0] ?? c;
        lineTokens.push(text);
        i += text.length;
      } else {
        const op = operatorAt(line, i, PYTHON_OPERATORS);
        if (op === "(" || op === "[" || op === "{") depth += 1;
        if (op === ")" || op === "]" || op === "}") depth = Math.max(0, depth - 1);
        lineTokens.push(op);
        i += op.length;
      }
    }
    if (lineTokens.length === 0) continue;
    if (startsLogicalLine) {
      const width = /^ */.exec(line)?.[0].length ?? 0;
      while (indents.length > 1 && width < (indents[indents.length - 1] ?? 0)) indents.pop();
      if (width > (indents[indents.length - 1] ?? 0)) indents.push(width);
      if (tokens.length > 0) tokens.push("⏎");
      tokens.push(`⇥${indents.length - 1}`);
    }
    tokens.push(...lineTokens);
  }
  return tokens;
}

export function codeTokens(code: string, language: CodeMatchLanguage): string[] {
  return language === "python" ? pythonTokens(code) : cppTokens(code);
}

/** True when the code matches any of the accepted solutions, ignoring layout and comments. */
export function matchesAnySolution(code: string, solutions: readonly string[], language: CodeMatchLanguage): boolean {
  const tokens = codeTokens(code, language).filter((t) => t !== "⏎");
  if (tokens.length === 0) return false;
  const mine = codeTokens(code, language).join("\u0001");
  return solutions.some((solution) => codeTokens(solution, language).join("\u0001") === mine);
}
