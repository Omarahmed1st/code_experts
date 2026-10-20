// Turns what a visitor typed into a safe FTS5 query.
//
// FTS5 has its own query language (AND, OR, NOT, NEAR, column filters, quotes).
// Visitors shouldn't need it, and raw input could be a syntax error, so we keep
// only words, quote each one, and let the last word match as a prefix
// ("loo" finds "loop") because people search while still typing.

export const MAX_QUERY_LENGTH = 100;
const MAX_TERMS = 8;

export function normalizeQuery(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().slice(0, MAX_QUERY_LENGTH);
}

export function toFtsQuery(raw: string): string | null {
  const terms = normalizeQuery(raw)
    .toLowerCase()
    .match(/[\p{L}\p{N}_]+/gu)
    ?.slice(0, MAX_TERMS);
  if (!terms || terms.length === 0) return null;
  return terms.map((term, i) => (i === terms.length - 1 ? `"${term}"*` : `"${term}"`)).join(" ");
}

/** Markers FTS5's snippet() puts around matches; chosen so they can't appear in content. */
export const MATCH_START = "\u0002";
export const MATCH_END = "\u0003";

/** Splits a snippet into plain and highlighted parts, for rendering without raw HTML. */
export function snippetParts(snippet: string): { text: string; match: boolean }[] {
  const parts: { text: string; match: boolean }[] = [];
  for (const piece of snippet.split(MATCH_START)) {
    const end = piece.indexOf(MATCH_END);
    if (end === -1) {
      if (piece) parts.push({ text: piece, match: false });
      continue;
    }
    if (end > 0) parts.push({ text: piece.slice(0, end), match: true });
    const rest = piece.slice(end + 1);
    if (rest) parts.push({ text: rest, match: false });
  }
  return parts;
}
