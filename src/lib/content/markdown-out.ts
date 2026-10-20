// Helpers for writing the content Markdown format (docs/CONTENT.md): front
// matter values and code fences that the parsers in src/lib/lesson/source.ts
// and src/lib/exercise/source.ts read back exactly. Pure.

/** A front matter value the parser's unquote() gives back unchanged. */
export function fmValue(value: string): string {
  const v = value.replace(/\s+/g, " ").trim();
  const quoted = v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")));
  return quoted || v.includes(": ") || v.startsWith("#") ? `"${v}"` : v;
}

export function fmList(key: string, items: readonly string[]): string[] {
  if (items.length === 0) return [];
  return [`${key}:`, ...items.map((item) => `  - ${fmValue(item)}`)];
}

/** A fence long enough that no line of the body can close it early. */
export function fence(info: string, body: string): string {
  const longest = Math.max(0, ...body.split("\n").map((line) => /^(`+)/.exec(line)?.[1]?.length ?? 0));
  const marker = "`".repeat(Math.max(3, longest + 1));
  return `${marker}${info}\n${body}\n${marker}`;
}

/** Program output and typed input end with a newline when stored; the fence body leaves it out. */
export function withoutFinalNewline(text: string): string {
  return text.endsWith("\n") ? text.slice(0, -1) : text;
}
