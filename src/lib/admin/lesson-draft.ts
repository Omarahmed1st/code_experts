// The lecture editor's data, and the checks a lecture must pass before it is
// saved. The rules match the content files (src/lib/lesson/source.ts and the
// database CHECKs), so a lecture saved in the admin is as valid as one built
// from content/. Pure, so it runs in tests and could run in the browser.
import { AnnotationError, type CodeAnnotations, parseAnnotations } from "../lesson/annotations.ts";
import { LessonSourceError, type ProgramLanguage, SECTION_KINDS, type SectionKind, parseNotes, parseStrips } from "../lesson/source.ts";
import { isValidSlug } from "../slug.ts";

export type LessonStatus = "draft" | "scheduled" | "published" | "archived";
export const LESSON_STATUSES: readonly LessonStatus[] = ["draft", "scheduled", "published", "archived"];
export const PROGRAM_LANGUAGES: readonly ProgramLanguage[] = ["cpp", "python", "pseudocode", "text"];

export interface ProgramDraft {
  language: ProgramLanguage;
  code: string;
  /** Edit and Run in the student's browser (Python and C++ only). */
  runnable: boolean;
  /** What the user types, one line per input()/cin. */
  input: string;
  /** The OUTPUT box as a terminal transcript; null = no OUTPUT box. */
  output: string | null;
  /** Note chips, one per line: line | code | note | shape colour */
  notes: string;
  /** Index strips, one per line: line | code | chr or item | items or auto | neg */
  strips: string;
}

export interface SectionDraft {
  id: string | null;
  kind: SectionKind;
  title: string;
  bodyMd: string;
  program: ProgramDraft | null;
  image: { key: string; width: number; height: number; alt: string } | null;
}

export interface LessonDraft {
  title: string;
  slug: string;
  topicId: string;
  lectureNumber: number | null;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  objectives: string[];
  prerequisites: string[];
  relatedIds: string[];
  resourceIds: string[];
  status: LessonStatus;
  publishAt: number | null;
  sections: SectionDraft[];
}

/** A section as stored: the program's annotations parsed, typed input and output ending in a newline. */
export interface ValidSection {
  id: string | null;
  kind: SectionKind;
  title: string;
  bodyMd: string;
  code: string | null;
  codeLanguage: ProgramLanguage | null;
  runnable: boolean;
  sampleInput: string;
  expectedOutput: string | null;
  annotations: CodeAnnotations | null;
  image: SectionDraft["image"];
}

export interface ValidLesson extends Omit<LessonDraft, "sections"> {
  sections: ValidSection[];
}

export interface DraftProblem {
  /** "title", "sections.2.code", … so the editor can point at the field. */
  path: string;
  message: string;
}

export interface LessonContext {
  courseId: string;
  lessonId: string;
  topicIds: ReadonlySet<string>;
  /** Other lectures of this course (for "related"). */
  lessonIds: ReadonlySet<string>;
  resourceIds: ReadonlySet<string>;
  now: number;
}

export const LIMITS = {
  title: 160,
  description: 300,
  listItems: 12,
  listItem: 240,
  related: 8,
  sections: 60,
  sectionTitle: 160,
  body: 20_000,
  code: 20_000,
  input: 4_000,
  output: 20_000,
  alt: 300,
} as const;

const text = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n?/g, "\n") : "");
const line = (v: unknown) => text(v).replace(/\s+/g, " ").trim();
const withNewline = (v: string) => (v === "" || v.endsWith("\n") ? v : `${v}\n`);

function stringList(v: unknown): string[] {
  return Array.isArray(v) ? v.map(line).filter(Boolean) : [];
}

/** Reads untrusted JSON into a LessonDraft shape (types only; validateLesson checks the rules). */
export function readLessonDraft(raw: unknown): LessonDraft {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sections = Array.isArray(r.sections) ? r.sections.slice(0, LIMITS.sections + 1) : [];
  const lecture = r.lectureNumber === null || r.lectureNumber === "" || r.lectureNumber === undefined ? null : Number(r.lectureNumber);
  return {
    title: line(r.title),
    slug: line(r.slug).toLowerCase(),
    topicId: line(r.topicId),
    lectureNumber: lecture,
    difficulty: r.difficulty === "medium" || r.difficulty === "hard" ? r.difficulty : "easy",
    description: line(r.description),
    objectives: stringList(r.objectives),
    prerequisites: stringList(r.prerequisites),
    relatedIds: stringList(r.relatedIds),
    resourceIds: stringList(r.resourceIds),
    status: (LESSON_STATUSES as readonly unknown[]).includes(r.status) ? (r.status as LessonStatus) : "draft",
    publishAt: typeof r.publishAt === "number" && Number.isFinite(r.publishAt) ? Math.round(r.publishAt) : null,
    sections: sections.map((raw): SectionDraft => {
      const s = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
      const p = s.program && typeof s.program === "object" ? (s.program as Record<string, unknown>) : null;
      const img = s.image && typeof s.image === "object" ? (s.image as Record<string, unknown>) : null;
      return {
        id: typeof s.id === "string" && s.id ? s.id : null,
        kind: (SECTION_KINDS as readonly unknown[]).includes(s.kind) ? (s.kind as SectionKind) : "explanation",
        title: line(s.title),
        bodyMd: text(s.bodyMd).trim(),
        program: p
          ? {
              language: (PROGRAM_LANGUAGES as readonly unknown[]).includes(p.language) ? (p.language as ProgramLanguage) : "python",
              code: text(p.code).replace(/\n+$/, ""),
              runnable: p.runnable === true,
              input: text(p.input),
              output: p.output === null || p.output === undefined ? null : text(p.output),
              notes: text(p.notes).trim(),
              strips: text(p.strips).trim(),
            }
          : null,
        image: img
          ? { key: line(img.key), width: Number(img.width), height: Number(img.height), alt: line(img.alt) }
          : null,
      };
    }),
  };
}

export function validateLesson(draft: LessonDraft, ctx: LessonContext): { ok: true; lesson: ValidLesson } | { ok: false; problems: DraftProblem[] } {
  const problems: DraftProblem[] = [];
  const add = (path: string, message: string) => problems.push({ path, message });

  if (draft.title.length < 3 || draft.title.length > LIMITS.title) add("title", `Give the lecture a title (3 to ${LIMITS.title} characters).`);
  if (!isValidSlug(draft.slug)) add("slug", "Use lower-case words joined by hyphens, like while-loops.");
  if (!ctx.topicIds.has(draft.topicId)) add("topicId", "Choose the topic this lecture belongs to.");
  if (draft.lectureNumber !== null && (!Number.isInteger(draft.lectureNumber) || draft.lectureNumber < 1 || draft.lectureNumber > 999)) {
    add("lectureNumber", "The lecture number is a whole number from 1 to 999, or empty.");
  }
  if (draft.description.length > LIMITS.description) add("description", `Keep the description under ${LIMITS.description} characters.`);
  for (const key of ["objectives", "prerequisites"] as const) {
    if (draft[key].length > LIMITS.listItems) add(key, `At most ${LIMITS.listItems} lines.`);
    if (draft[key].some((item) => item.length > LIMITS.listItem)) add(key, `Each line can be at most ${LIMITS.listItem} characters.`);
  }
  if (draft.relatedIds.length > LIMITS.related) add("relatedIds", `Pick at most ${LIMITS.related} related lectures.`);
  if (draft.relatedIds.some((id) => id === ctx.lessonId || !ctx.lessonIds.has(id))) add("relatedIds", "Related lectures must be other lectures of this course.");
  if (draft.resourceIds.some((id) => !ctx.resourceIds.has(id))) add("resourceIds", "Attached files must belong to this course.");

  const live = draft.status === "published" || draft.status === "scheduled";
  if (draft.status === "scheduled") {
    if (draft.publishAt === null) add("publishAt", "Choose when the lecture goes live.");
    else if (draft.publishAt <= ctx.now) add("publishAt", "Choose a time in the future, or publish it now.");
  }
  if (live && draft.description.length < 10) add("description", "A live lecture needs a one-sentence description (cards and search results show it).");
  if (live && draft.sections.length < 3) add("sections", "A live lecture needs at least three sections (no near-empty lectures). Save it as a draft until then.");
  if (draft.sections.length > LIMITS.sections) add("sections", `A lecture can have at most ${LIMITS.sections} sections.`);

  const imagePrefix = `courses/${ctx.courseId}/lessons/${ctx.lessonId}/`;
  const sections = draft.sections.slice(0, LIMITS.sections).map((s, i): ValidSection => {
    const at = (field: string) => `sections.${i}.${field}`;
    if (s.title.length < 1 || s.title.length > LIMITS.sectionTitle) add(at("title"), `Give section ${i + 1} a title.`);
    if (s.bodyMd.length > LIMITS.body) add(at("bodyMd"), `Section ${i + 1}'s text is too long (${LIMITS.body} characters at most); split it.`);
    if (!s.bodyMd && !s.program && !s.image) add(at("bodyMd"), `Section ${i + 1} is empty: write some text, add a program or a picture.`);

    let annotations: CodeAnnotations | null = null;
    const p = s.program;
    if (p) {
      if (!p.code.trim()) add(at("code"), `Section ${i + 1} has a program box with no code. Remove the program or write it.`);
      if (p.code.length > LIMITS.code) add(at("code"), "The program is too long.");
      if (p.runnable && p.language !== "python" && p.language !== "cpp") add(at("runnable"), "Only Python and C++ programs can have a Run button.");
      if (p.input.length > LIMITS.input) add(at("input"), "The typed input is too long.");
      if (p.output !== null && p.output.length > LIMITS.output) add(at("output"), "The output is too long.");
      if (p.notes || p.strips) {
        try {
          annotations = parseAnnotations(
            { notes: p.notes ? parseNotes(p.notes, "Notes") : [], strips: p.strips ? parseStrips(p.strips, "Strips") : [] },
            p.code,
          );
        } catch (error) {
          if (error instanceof LessonSourceError || error instanceof AnnotationError) add(at(p.notes ? "notes" : "strips"), `Section ${i + 1}: ${error.message}`);
          else throw error;
        }
      }
    }
    if (s.image) {
      if (s.kind !== "diagram") add(at("image"), `Pictures belong in "Picture" (diagram) sections; change section ${i + 1}'s kind or remove the picture.`);
      if (!s.image.key.startsWith(imagePrefix) || s.image.key.slice(imagePrefix.length).includes("/")) add(at("image"), "Upload the picture again (it isn't stored with this lecture).");
      if (!(Number.isInteger(s.image.width) && s.image.width > 0 && Number.isInteger(s.image.height) && s.image.height > 0)) add(at("image"), "Upload the picture again (its size is missing).");
      if (s.image.alt.length < 5 || s.image.alt.length > LIMITS.alt) add(at("alt"), `Describe what section ${i + 1}'s picture shows (5 to ${LIMITS.alt} characters), for students who can't see it.`);
    }
    return {
      id: s.id,
      kind: s.kind,
      title: s.title,
      bodyMd: s.bodyMd,
      code: p ? p.code : null,
      codeLanguage: p ? p.language : null,
      runnable: p ? p.runnable : false,
      sampleInput: p ? withNewline(p.input.replace(/\n+$/, "")) : "",
      expectedOutput: p && p.output !== null ? withNewline(p.output.replace(/\n+$/, "")) : null,
      annotations,
      image: s.image,
    };
  });

  if (problems.length > 0) return { ok: false, problems };
  return { ok: true, lesson: { ...draft, publishAt: draft.status === "scheduled" ? draft.publishAt : null, sections } };
}

