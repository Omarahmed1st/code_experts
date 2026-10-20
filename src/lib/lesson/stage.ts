// Lays out a lesson program for the lec-style stage, on the server.
//
// Each code line becomes escaped, highlighted HTML plus the "rows" that hang
// under it: one per note chip or strip. Positions are character columns, which
// the stage turns into `ch` offsets (the code font is monospaced).
import { highlight } from "../markdown/highlight.ts";
import type { CodeAnnotations, NoteColor, NoteShape } from "./annotations.ts";

export interface StageMark {
  col: number;
  len: number;
  color: NoteColor;
}

export interface StageRow {
  col: number;
  len: number;
  /** Column of the middle of the marked code, where the connecting line starts. */
  center: number;
  color: NoteColor;
  /** When this row pops in during the typing animation, in ms. */
  at: number;
  note?: { text: string; shape: NoteShape };
  strip?: { kind: "chr" | "item"; items: string[]; negative: boolean };
}

export interface StageLine {
  no: number;
  html: string;
  chars: number;
  /** When this line starts typing, in ms. */
  at: number;
  marks: StageMark[];
  rows: StageRow[];
}

const TYPE_MS_PER_CHAR = 35;
const LINE_GAP_MS = 220;
const MAX_TYPING_MS = 4500;

/** Tabs are shown as 4 spaces so columns stay exact. */
export function displayCode(code: string): string {
  return code.replace(/\r\n?/g, "\n").replace(/\t/g, "    ").replace(/\n+$/, "");
}

export function buildStage(code: string, language: string, annotations: CodeAnnotations | null): StageLine[] {
  const source = displayCode(code);
  const rawLines = source.split("\n");
  const htmlLines = highlight(source, language).split("\n");

  // Typing schedule, compressed if the program is long so it never drags on.
  const naive = rawLines.reduce((ms, line) => ms + Math.max(1, line.length) * TYPE_MS_PER_CHAR + LINE_GAP_MS, 0);
  const scale = naive > MAX_TYPING_MS ? MAX_TYPING_MS / naive : 1;

  let clock = 150;
  return rawLines.map((text, i) => {
    const no = i + 1;
    const chars = Math.max(1, text.length);
    const at = Math.round(clock);
    clock += (chars * TYPE_MS_PER_CHAR + LINE_GAP_MS) * scale;
    const rowsAt = Math.round(at + chars * TYPE_MS_PER_CHAR * scale + 120);

    const marks: StageMark[] = [];
    const rows: StageRow[] = [];
    const place = (match: string) => {
      const col = text.indexOf(match);
      return col === -1 ? null : { col, len: match.length, center: col + match.length / 2 };
    };
    for (const note of annotations?.notes ?? []) {
      if (note.line !== no) continue;
      const pos = place(note.match);
      if (!pos) continue;
      marks.push({ col: pos.col, len: pos.len, color: note.color });
      rows.push({ ...pos, color: note.color, at: rowsAt, note: { text: note.text, shape: note.shape } });
    }
    for (const strip of annotations?.strips ?? []) {
      if (strip.line !== no) continue;
      const pos = place(strip.match);
      if (!pos) continue;
      marks.push({ col: pos.col, len: pos.len, color: strip.color });
      rows.push({
        ...pos,
        color: strip.color,
        at: rowsAt,
        strip: { kind: strip.kind, items: strip.items, negative: strip.negative },
      });
    }
    // Right-most first: each connecting line then runs left of every chip above it.
    rows.sort((a, b) => b.col - a.col);
    rows.forEach((row, k) => {
      row.at += k * 140;
    });
    return { no, html: htmlLines[i] ?? "", chars, at, marks, rows };
  });
}
