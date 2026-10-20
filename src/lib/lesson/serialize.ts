// Writes a lesson back to the Markdown format that parseLessonSource() reads
// (docs/CONTENT.md), for "Export as Markdown" in the admin and for tests that
// prove the two agree. Pure.
import { type CodeAnnotations, type CodeNote, type CodeStrip } from "./annotations.ts";
import { type LessonSource, type SectionSource, unquote } from "./source.ts";
import { fence, fmList, fmValue, withoutFinalNewline } from "../content/markdown-out.ts";

function codeCell(match: string): string {
  return match !== match.trim() || (match.startsWith("`") && match.endsWith("`")) ? `\`${match}\`` : match;
}

export function noteRow(note: CodeNote): string {
  return `${note.line} | ${codeCell(note.match)} | ${note.text} | ${note.shape} ${note.color}`;
}

function autoItems(match: string, kind: "chr" | "item"): string[] {
  if (kind === "chr") return [...unquote(match)];
  const inner = match.trim().replace(/^\[/, "").replace(/\]$/, "");
  return inner.split(",").map((item) => unquote(item)).filter(Boolean);
}

export function stripRow(strip: CodeStrip): string {
  const auto = autoItems(strip.match, strip.kind);
  const items = auto.length === strip.items.length && auto.every((item, i) => item === strip.items[i]) ? "auto" : strip.items.join(", ");
  return `${strip.line} | ${codeCell(strip.match)} | ${strip.kind} | ${items}${strip.negative ? " | neg" : ""}`;
}

/** The "notes" and "strip" block bodies for a section's annotations (empty strings when none). */
export function annotationsToText(annotations: CodeAnnotations | null): { notes: string; strips: string } {
  return {
    notes: (annotations?.notes ?? []).map(noteRow).join("\n"),
    strips: (annotations?.strips ?? []).map(stripRow).join("\n"),
  };
}

export function serializeSection(section: SectionSource): string {
  const parts: string[] = [`## [${section.kind}] ${section.title}`, ""];
  if (section.bodyMd) parts.push(section.bodyMd, "");
  if (section.image) parts.push(`![${section.image.alt}](${section.image.file})`, "");
  if (section.code !== null && section.codeLanguage) {
    parts.push(fence(`${section.codeLanguage} program${section.runnable ? " run" : ""}`, section.code), "");
    if (section.sampleInput !== "") parts.push(fence("input", withoutFinalNewline(section.sampleInput)), "");
    if (section.expectedOutput !== null) parts.push(fence("output", withoutFinalNewline(section.expectedOutput)), "");
    if (section.verifyCode !== null) parts.push(fence("cpp verify", section.verifyCode), "");
    const { notes, strips } = annotationsToText(section.annotations);
    if (notes) parts.push(fence("notes", notes), "");
    if (strips) parts.push(fence("strip", strips), "");
  }
  return parts.join("\n");
}

export function serializeLesson(lesson: LessonSource): string {
  const front = [
    "---",
    `slug: ${lesson.slug}`,
    `title: ${fmValue(lesson.title)}`,
    `topic: ${lesson.topic}`,
    ...(lesson.lecture !== null ? [`lecture: ${lesson.lecture}`] : []),
    `difficulty: ${lesson.difficulty}`,
    `description: ${fmValue(lesson.description)}`,
    ...fmList("objectives", lesson.objectives),
    ...fmList("prerequisites", lesson.prerequisites),
    ...fmList("related", lesson.related),
    `updated: ${lesson.updated}`,
    ...(lesson.status === "draft" ? ["status: draft"] : []),
    "---",
    "",
  ];
  return `${front.join("\n")}${lesson.sections.map(serializeSection).join("\n")}`.replace(/\n+$/, "\n");
}
