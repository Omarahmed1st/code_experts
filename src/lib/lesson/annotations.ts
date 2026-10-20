// Lec-style notes for a lesson's code (lesson_sections.annotations, JSON).
//
//   notes   small chips joined by a thin line to an exact part of a code line
//   strips  index boxes hanging under a String (characters) or a List (items)
//
// The database only checks that the column is valid JSON; this module is the
// schema. Anything that writes annotations (the content build now, the admin
// editor in Phase 4) must pass it through parseAnnotations().

export const NOTE_SHAPES = ["circle", "square", "diamond", "tri"] as const;
export const NOTE_COLORS = ["sky", "yel", "coral", "green"] as const;

export type NoteShape = (typeof NOTE_SHAPES)[number];
export type NoteColor = (typeof NOTE_COLORS)[number];

export interface CodeNote {
  /** 1-based line number in the section's code. */
  line: number;
  /** The exact text on that line the note points at (its first occurrence). */
  match: string;
  text: string;
  shape: NoteShape;
  color: NoteColor;
}

export interface CodeStrip {
  line: number;
  match: string;
  /** "chr": one box per character of a String; "item": one box per List item. */
  kind: "chr" | "item";
  items: string[];
  /** Also show negative indexes (-1 is the last box). */
  negative: boolean;
  color: NoteColor;
}

export interface CodeAnnotations {
  notes: CodeNote[];
  strips: CodeStrip[];
}

export const MAX_NOTES = 8;
export const MAX_STRIPS = 2;
export const MAX_NOTE_TEXT = 60;
export const MAX_STRIP_ITEMS = 16;

export class AnnotationError extends Error {}

function fail(message: string): never {
  throw new AnnotationError(message);
}

function asRecord(value: unknown, where: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) fail(`${where} must be an object`);
  return value as Record<string, unknown>;
}

function lineAndMatch(record: Record<string, unknown>, where: string, codeLines: readonly string[]) {
  const line = record.line;
  if (typeof line !== "number" || !Number.isInteger(line) || line < 1 || line > codeLines.length) {
    fail(`${where}.line must be a line number from 1 to ${codeLines.length}`);
  }
  const match = record.match;
  if (typeof match !== "string" || match.length === 0) fail(`${where}.match must be non-empty text`);
  if (!(codeLines[line - 1] ?? "").includes(match)) fail(`${where}.match "${match}" is not on line ${line}`);
  return { line, match };
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T, where: string): T {
  if (value === undefined) return fallback;
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) {
    fail(`${where} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

/** Validates annotations against the code they describe. Throws AnnotationError. */
export function parseAnnotations(value: unknown, code: string): CodeAnnotations {
  const record = asRecord(value, "annotations");
  const codeLines = code.replace(/\r\n?/g, "\n").split("\n");
  const rawNotes = record.notes ?? [];
  const rawStrips = record.strips ?? [];
  if (!Array.isArray(rawNotes) || rawNotes.length > MAX_NOTES) fail(`notes must be a list of at most ${MAX_NOTES}`);
  if (!Array.isArray(rawStrips) || rawStrips.length > MAX_STRIPS) fail(`strips must be a list of at most ${MAX_STRIPS}`);

  const notes = rawNotes.map((raw, i): CodeNote => {
    const where = `notes[${i}]`;
    const note = asRecord(raw, where);
    const text = note.text;
    if (typeof text !== "string" || text.trim() === "" || text.length > MAX_NOTE_TEXT) {
      fail(`${where}.text must be 1 to ${MAX_NOTE_TEXT} characters`);
    }
    return {
      ...lineAndMatch(note, where, codeLines),
      text,
      shape: oneOf(note.shape, NOTE_SHAPES, "circle", `${where}.shape`),
      color: oneOf(note.color, NOTE_COLORS, "sky", `${where}.color`),
    };
  });

  const strips = rawStrips.map((raw, i): CodeStrip => {
    const where = `strips[${i}]`;
    const strip = asRecord(raw, where);
    const items = strip.items;
    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > MAX_STRIP_ITEMS ||
      !items.every((item) => typeof item === "string" && item.length <= 12)
    ) {
      fail(`${where}.items must be 1 to ${MAX_STRIP_ITEMS} short labels`);
    }
    return {
      ...lineAndMatch(strip, where, codeLines),
      kind: oneOf(strip.kind, ["chr", "item"] as const, "item", `${where}.kind`),
      items: items as string[],
      negative: strip.negative === true,
      color: oneOf(strip.color, NOTE_COLORS, "yel", `${where}.color`),
    };
  });

  return { notes, strips };
}
