// A small syntax highlighter for the languages Code_Expert teaches. It runs on the
// server for every lesson render, so it is a single regex pass per block with
// no dependencies (a full grammar engine would cost far more CPU per request).
//
// Output is escaped HTML with <span class="tok-*"> wrappers. Unknown languages
// are escaped and returned without highlighting.

export type HighlightLanguage = "cpp" | "python" | "pseudocode" | "text";

type TokenKind = "com" | "str" | "num" | "kw" | "type" | "fn" | "pre" | "lit" | "builtin";

interface Grammar {
  /** Alternation of named groups; the first group that matches wins. */
  pattern: RegExp;
  keywords: ReadonlySet<string>;
  types: ReadonlySet<string>;
  literals: ReadonlySet<string>;
  builtins: ReadonlySet<string>;
}

const words = (list: string) => new Set(list.split(/\s+/).filter(Boolean));

const PYTHON: Grammar = {
  pattern: new RegExp(
    [
      String.raw`(?<com>#[^\n]*)`,
      String.raw`(?<str>(?:[rRbBuUfF]{1,2})?(?:"""[\s\S]*?(?:"""|$)|'''[\s\S]*?(?:'''|$)|"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?))`,
      String.raw`(?<num>\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d+)?j?|\.\d[\d_]*(?:[eE][+-]?\d+)?)\b)`,
      String.raw`(?<deco>@[A-Za-z_][\w.]*)`,
      String.raw`(?<word>[A-Za-z_]\w*)(?<call>\s*\()?`,
    ].join("|"),
    "g",
  ),
  keywords: words(
    "and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case",
  ),
  types: words("int float str bool list dict tuple set frozenset bytes object complex"),
  literals: words("True False None"),
  builtins: words(
    "print input len range enumerate zip sorted reversed sum min max abs round open type isinstance map filter any all iter next chr ord super self",
  ),
};

const CPP: Grammar = {
  pattern: new RegExp(
    [
      String.raw`(?<com>\/\/[^\n]*|\/\*[\s\S]*?(?:\*\/|$))`,
      String.raw`(?<pre>^[ \t]*#[ \t]*\w+(?:[ \t]*<[^>\n]*>)?)`,
      String.raw`(?<str>"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?)`,
      String.raw`(?<num>\b(?:0[xX][0-9a-fA-F']+|\d[\d']*\.?[\d']*(?:[eE][+-]?\d+)?[fFlLuU]*|\.\d+(?:[eE][+-]?\d+)?[fF]?)\b)`,
      String.raw`(?<word>[A-Za-z_]\w*)(?<call>\s*\()?`,
    ].join("|"),
    "gm",
  ),
  keywords: words(
    "if else for while do switch case default break continue return using namespace const constexpr static struct class public private protected new delete template typename sizeof auto void inline virtual override operator try catch throw enum",
  ),
  types: words("int double float char bool long short unsigned signed string size_t vector"),
  literals: words("true false nullptr NULL"),
  builtins: words("std cout cin endl cerr getline main"),
};

const PSEUDOCODE: Grammar = {
  pattern: new RegExp(
    [
      String.raw`(?<com>\/\/[^\n]*)`,
      String.raw`(?<str>"(?:\\.|[^"\\\n])*"?)`,
      String.raw`(?<num>\b\d+(?:\.\d+)?\b)`,
      String.raw`(?<word>[A-Za-z_]\w*)(?<call>\s*\()?`,
    ].join("|"),
    "g",
  ),
  keywords: words(
    "BEGIN END START STOP IF THEN ELSE ELSEIF ENDIF END_IF WHILE ENDWHILE END_WHILE DO FOR TO STEP NEXT ENDFOR END_FOR REPEAT UNTIL INPUT OUTPUT PRINT READ DISPLAY SET DECLARE AND OR NOT MOD DIV RETURN FUNCTION ENDFUNCTION CALL",
  ),
  types: words("INTEGER REAL STRING BOOLEAN CHAR ARRAY"),
  literals: words("TRUE FALSE"),
  builtins: new Set(),
};

const GRAMMARS: Partial<Record<HighlightLanguage, Grammar>> = { python: PYTHON, cpp: CPP, pseudocode: PSEUDOCODE };

const ESCAPES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (ch) => ESCAPES[ch] ?? ch);
}

/** Wraps each line of a token separately, so the HTML can be split on "\n" safely. */
function span(kind: TokenKind, text: string): string {
  return text
    .split("\n")
    .map((part) => (part ? `<span class="tok-${kind}">${escapeHtml(part)}</span>` : ""))
    .join("\n");
}

function classifyWord(grammar: Grammar, word: string, isCall: boolean, previous: string): TokenKind | null {
  if (grammar.keywords.has(word)) return "kw";
  if (grammar.literals.has(word)) return "lit";
  if (grammar.types.has(word)) return "type";
  if (grammar.builtins.has(word)) return "builtin";
  // The name right after `def` / `class` is a definition, and `name(` is a call.
  if (isCall || /\b(?:def|class)\s+$/.test(previous)) return "fn";
  return null;
}

/** Escaped, highlighted HTML for `code`. Never returns raw user text. */
export function highlight(code: string, language: string): string {
  const grammar = GRAMMARS[language as HighlightLanguage];
  if (!grammar) return escapeHtml(code);

  let html = "";
  let last = 0;
  const pattern = new RegExp(grammar.pattern.source, grammar.pattern.flags);
  for (let match = pattern.exec(code); match; match = pattern.exec(code)) {
    if (match[0] === "") {
      pattern.lastIndex += 1;
      continue;
    }
    html += escapeHtml(code.slice(last, match.index));
    const groups = match.groups ?? {};
    if (groups.com !== undefined) html += span("com", groups.com);
    else if (groups.pre !== undefined) html += span("pre", groups.pre);
    else if (groups.str !== undefined) html += span("str", groups.str);
    else if (groups.num !== undefined) html += span("num", groups.num);
    else if (groups.deco !== undefined) html += span("fn", groups.deco);
    else if (groups.word !== undefined) {
      const kind = classifyWord(grammar, groups.word, groups.call !== undefined, code.slice(Math.max(0, match.index - 12), match.index));
      html += kind ? span(kind, groups.word) : escapeHtml(groups.word);
      if (groups.call !== undefined) html += escapeHtml(groups.call);
    } else {
      html += escapeHtml(match[0]);
    }
    last = match.index + match[0].length;
  }
  return html + escapeHtml(code.slice(last));
}

/** Human label for a code block's language. */
export const LANGUAGE_LABEL: Record<string, string> = {
  cpp: "C++",
  python: "Python",
  pseudocode: "Pseudocode",
  text: "Text",
  input: "Input",
  output: "Output",
};
