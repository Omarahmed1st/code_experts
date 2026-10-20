"use client";

import { ArrowDown, ArrowUp, Code2, Download, Eye, History, ImagePlus, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, Notice, describedBy, inputClass, monoInputClass } from "@/components/admin/form-parts";
import { UploadProgress, uploadFile } from "@/components/admin/upload";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { getRunner } from "@/components/lesson/code-runner";
import { type LessonDraft, type LessonStatus, type ProgramDraft, type SectionDraft, LIMITS } from "@/lib/admin/lesson-draft";
import { currentTime, formatAdminTime, fromCairoInput, toCairoInput } from "@/lib/admin/time";
import type { SectionKind } from "@/lib/lesson/source";
import { slugify } from "@/lib/slug";
import { saveLessonAction, saveLessonSeoAction } from "./actions";

const KINDS: { value: SectionKind; label: string; help: string }[] = [
  { value: "explanation", label: "Explanation", help: "Plain teaching text." },
  { value: "example", label: "Example", help: "A worked example, usually with a program." },
  { value: "code", label: "Code", help: "A program to read and run." },
  { value: "diagram", label: "Picture", help: "A picture with a description." },
  { value: "common_mistakes", label: "Watch out", help: "Common mistakes." },
  { value: "key_takeaways", label: "Remember", help: "Key takeaways." },
  { value: "note", label: "Note", help: "A side note or a quick check." },
];

interface Option {
  id: string;
  title: string;
}

export interface LessonEditorProps {
  courseSlug: string;
  courseLanguage: "cpp" | "python";
  lessonId: string | null;
  initial: LessonDraft;
  topics: Option[];
  otherLessons: Option[];
  resources: (Option & { kind: string })[];
  imageUrls: Record<string, string>;
  seo: { title: string | null; description: string | null; noindex: boolean };
  canEdit: boolean;
  canPublish: boolean;
  updatedAt: number | null;
}

let keySeed = 0;
const newKey = () => `k${++keySeed}`;

type EditorSection = SectionDraft & { key: string };

const emptyProgram = (language: ProgramDraft["language"]): ProgramDraft => ({ language, code: "", runnable: language === "python" || language === "cpp", input: "", output: "", notes: "", strips: "" });

export function LessonEditor(props: LessonEditorProps) {
  const { courseSlug, lessonId, canEdit, canPublish } = props;
  const router = useRouter();
  const [draft, setDraft] = useState<Omit<LessonDraft, "sections">>(() => {
    const { sections: _s, ...rest } = props.initial;
    void _s;
    return rest;
  });
  const [sections, setSections] = useState<EditorSection[]>(() => props.initial.sections.map((s) => ({ ...s, key: newKey() })));
  const [slugTouched, setSlugTouched] = useState(lessonId !== null);
  const [imageUrls, setImageUrls] = useState(props.imageUrls);
  const [dirty, setDirty] = useState(false);
  const save = useAdminAction<{ id: string }>(`lesson:${lessonId}`);
  const errorsRef = useRef<HTMLDivElement>(null);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof typeof draft>(key: K, value: (typeof draft)[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setDirty(true);
  };
  const setSection = (key: string, change: Partial<SectionDraft>) => {
    setSections((list) => list.map((s) => (s.key === key ? { ...s, ...change } : s)));
    setDirty(true);
  };
  const moveSection = (index: number, by: number) => {
    setSections((list) => {
      const next = [...list];
      const [moved] = next.splice(index, 1);
      next.splice(index + by, 0, moved!);
      return next;
    });
    setDirty(true);
  };
  const addSection = (at: number) => {
    setSections((list) => {
      const next = [...list];
      next.splice(at, 0, { key: newKey(), id: null, kind: "explanation", title: "", bodyMd: "", program: null, image: null });
      return next;
    });
    setDirty(true);
  };

  const err = save.fieldError;
  const fieldErrors = save.result && !save.result.ok ? (save.result.fieldErrors ?? {}) : {};

  const submit = (statusOverride?: { status: LessonStatus; publishAt: number | null }) => {
    const payload: LessonDraft = {
      ...draft,
      ...(statusOverride ?? {}),
      sections: sections.map(({ key: _k, ...s }) => {
        void _k;
        return s;
      }),
    };
    save.run(() => saveLessonAction(courseSlug, lessonId, payload), {
      refresh: lessonId !== null,
      keep: lessonId !== null,
      onSuccess: (value) => {
        setDirty(false);
        if (statusOverride) setDraft((d) => ({ ...d, ...statusOverride }));
        if (!lessonId) router.replace(`/admin/courses/${courseSlug}/lectures/${value.id}?created=1`);
      },
    });
  };

  useEffect(() => {
    if (save.result && !save.result.ok) errorsRef.current?.focus();
  }, [save.result]);

  const live = draft.status === "published" || (draft.status === "scheduled" && (draft.publishAt ?? Infinity) <= currentTime());
  const base = `/admin/courses/${courseSlug}/lectures`;

  return (
    <form
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <fieldset disabled={!canEdit} className="grid min-w-0 gap-6">
        <div ref={errorsRef} tabIndex={-1} className="outline-none">
          <ResultNotice result={save.result} />
        </div>

        <Card title="Details">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="title" label="Title" error={err("title")}>
                <input
                  id="title"
                  value={draft.title}
                  maxLength={LIMITS.title}
                  required
                  onChange={(e) => {
                    set("title", e.target.value);
                    if (!slugTouched) set("slug", slugify(e.target.value));
                  }}
                  aria-describedby={describedBy("title", false, !!err("title"))}
                  className={inputClass}
                />
              </Field>
              <Field id="slug" label="Address (slug)" help={`/courses/${courseSlug}/lectures/${draft.slug || "…"}`} error={err("slug")}>
                <input
                  id="slug"
                  value={draft.slug}
                  maxLength={80}
                  required
                  onChange={(e) => {
                    set("slug", e.target.value.toLowerCase());
                    setSlugTouched(true);
                  }}
                  aria-describedby={describedBy("slug", true, !!err("slug"))}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <Field id="topicId" label="Topic" error={err("topicId")}>
                <select id="topicId" value={draft.topicId} onChange={(e) => set("topicId", e.target.value)} className={inputClass} aria-describedby={describedBy("topicId", false, !!err("topicId"))}>
                  <option value="">Choose a topic…</option>
                  {props.topics.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </select>
              </Field>
              <Field id="lectureNumber" label="Lecture number" optional error={err("lectureNumber")}>
                <input
                  id="lectureNumber"
                  type="number"
                  min={1}
                  max={999}
                  value={draft.lectureNumber ?? ""}
                  onChange={(e) => set("lectureNumber", e.target.value === "" ? null : Number(e.target.value))}
                  className={inputClass}
                />
              </Field>
              <Field id="difficulty" label="Level">
                <select id="difficulty" value={draft.difficulty} onChange={(e) => set("difficulty", e.target.value as LessonDraft["difficulty"])} className={inputClass}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </Field>
            </div>
            <Field id="description" label="Description" help="One sentence for lecture cards and search results." error={err("description")}>
              <textarea
                id="description"
                rows={2}
                maxLength={LIMITS.description}
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                aria-describedby={describedBy("description", true, !!err("description"))}
                className={inputClass}
              />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <ListField id="objectives" label="By the end, students can…" help="One per line." value={draft.objectives} onChange={(v) => set("objectives", v)} error={err("objectives")} />
              <ListField id="prerequisites" label="Before you start" help="One per line. Optional." value={draft.prerequisites} onChange={(v) => set("prerequisites", v)} error={err("prerequisites")} />
            </div>
          </div>
        </Card>

        <section aria-labelledby="sections-heading" className="grid gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="sections-heading" className="text-xl font-bold">
              Sections <span className="font-mono text-base font-normal text-muted">({sections.length})</span>
            </h2>
            <p className="text-sm text-muted">Text is Markdown: **bold**, `code`, lists, tables.</p>
          </div>
          {fieldErrors.sections ? <Notice tone="error">{fieldErrors.sections}</Notice> : null}
          {sections.map((section, index) => (
            <SectionEditor
              key={section.key}
              index={index}
              count={sections.length}
              section={section}
              errors={fieldErrors}
              courseSlug={courseSlug}
              courseLanguage={props.courseLanguage}
              lessonId={lessonId}
              imageUrl={section.image ? (imageUrls[section.image.key] ?? null) : null}
              onImageUploaded={(key, url) => setImageUrls((m) => ({ ...m, [key]: url }))}
              onChange={(change) => setSection(section.key, change)}
              onMove={(by) => moveSection(index, by)}
              onRemove={() => {
                setSections((list) => list.filter((s) => s.key !== section.key));
                setDirty(true);
              }}
              onAddAfter={() => addSection(index + 1)}
            />
          ))}
          <div>
            <button type="button" className={buttonClass("secondary")} onClick={() => addSection(sections.length)}>
              <Plus aria-hidden="true" className="size-4" /> Add a section
            </button>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <Card title="Related lectures">
            <CheckList
              name="relatedIds"
              options={props.otherLessons}
              value={draft.relatedIds}
              onChange={(v) => set("relatedIds", v)}
              empty="There are no other lectures in this course yet."
              error={err("relatedIds")}
            />
          </Card>
          <Card title="Slides and files">
            <CheckList
              name="resourceIds"
              options={props.resources}
              value={draft.resourceIds}
              onChange={(v) => set("resourceIds", v)}
              empty="Upload slides or files on the Files tab, then attach them here."
              error={err("resourceIds")}
            />
          </Card>
        </div>
      </fieldset>

      <aside className="grid gap-6 xl:sticky xl:top-24">
        <Card title="Publishing">
          <div className="grid gap-4">
            {canPublish ? (
              <fieldset className="grid gap-1">
                <legend className="mb-1 text-sm font-semibold">Who can see it</legend>
                {(
                  [
                    ["draft", "Draft: only staff"],
                    ["published", "Published: everyone"],
                    ["scheduled", "Scheduled: goes live at a set time"],
                    ["archived", "Archived: hidden, kept for staff"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="status"
                      value={value}
                      checked={draft.status === value}
                      onChange={() => {
                        set("status", value);
                        if (value === "scheduled" && !draft.publishAt) set("publishAt", Date.now() + 24 * 60 * 60 * 1000);
                      }}
                      className="size-4 accent-[var(--cl-primary)]"
                    />
                    {label}
                  </label>
                ))}
                {draft.status === "scheduled" ? (
                  <Field id="publishAt" label="Goes live at (Cairo time)" error={err("publishAt")}>
                    <input
                      id="publishAt"
                      type="datetime-local"
                      value={draft.publishAt ? toCairoInput(draft.publishAt) : ""}
                      onChange={(e) => set("publishAt", fromCairoInput(e.target.value))}
                      className={inputClass}
                    />
                  </Field>
                ) : null}
              </fieldset>
            ) : (
              <p className="text-sm text-muted">
                Status: <strong className="capitalize">{draft.status}</strong>. Editors save changes; a course admin publishes.
              </p>
            )}
            {canEdit ? (
              <button type="submit" disabled={save.pending} className={buttonClass("primary", "w-full")}>
                {save.pending ? "Saving…" : lessonId ? "Save lecture" : "Create lecture"}
              </button>
            ) : null}
            {dirty ? <p className="text-sm font-medium text-medium">You have unsaved changes.</p> : null}
            {props.updatedAt && !dirty ? <p className="text-sm text-muted">Last saved {formatAdminTime(props.updatedAt)}</p> : null}
            {live && lessonId ? (
              <a href={`/courses/${courseSlug}/lectures/${draft.slug}`} className="text-sm font-semibold text-primary-text hover:underline">
                Open the live page
              </a>
            ) : null}
          </div>
        </Card>
        {lessonId ? (
          <Card title="More">
            <div className="grid gap-2">
              <Link href={`${base}/${lessonId}/preview`} className={buttonClass("secondary", "justify-start")}>
                <Eye aria-hidden="true" className="size-4" /> Preview as students see it
              </Link>
              <Link href={`${base}/${lessonId}/history`} className={buttonClass("secondary", "justify-start")}>
                <History aria-hidden="true" className="size-4" /> History
              </Link>
              <a href={`${base}/${lessonId}/export`} className={buttonClass("secondary", "justify-start")}>
                <Download aria-hidden="true" className="size-4" /> Download as Markdown
              </a>
            </div>
            <p className="mt-3 text-xs text-muted">Preview and download show the last saved version.</p>
          </Card>
        ) : null}
        {lessonId && canEdit ? <SeoCard courseSlug={courseSlug} lessonId={lessonId} initial={props.seo} defaultTitle={draft.title} defaultDescription={draft.description} /> : null}
      </aside>
    </form>
  );
}

function ListField({ id, label, help, value, onChange, error }: { id: string; label: string; help: string; value: string[]; onChange: (v: string[]) => void; error: string | null }) {
  const [text, setText] = useState(value.join("\n"));
  return (
    <Field id={id} label={label} help={help} error={error}>
      <textarea
        id={id}
        rows={4}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("\n").map((l) => l.trim()).filter(Boolean));
        }}
        aria-describedby={describedBy(id, true, !!error)}
        className={inputClass}
      />
    </Field>
  );
}

function CheckList({ name, options, value, onChange, empty, error }: { name: string; options: Option[]; value: string[]; onChange: (v: string[]) => void; empty: string; error: string | null }) {
  if (options.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <fieldset className="grid max-h-72 gap-0.5 overflow-y-auto">
      <legend className="sr-only">{name === "relatedIds" ? "Related lectures" : "Attached files"}</legend>
      {error ? <p className="text-sm font-medium text-hard">{error}</p> : null}
      {options.map((o) => (
        <label key={o.id} className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={value.includes(o.id)}
            onChange={(e) => onChange(e.target.checked ? [...value, o.id] : value.filter((v) => v !== o.id))}
            className="size-4 accent-[var(--cl-primary)]"
          />
          {o.title}
        </label>
      ))}
    </fieldset>
  );
}

interface SectionEditorProps {
  index: number;
  count: number;
  section: EditorSection;
  errors: Record<string, string>;
  courseSlug: string;
  courseLanguage: "cpp" | "python";
  lessonId: string | null;
  imageUrl: string | null;
  onImageUploaded: (key: string, url: string) => void;
  onChange: (change: Partial<SectionDraft>) => void;
  onMove: (by: number) => void;
  onRemove: () => void;
  onAddAfter: () => void;
}

function SectionEditor({ index, count, section, errors, courseSlug, courseLanguage, lessonId, imageUrl, onImageUploaded, onChange, onMove, onRemove, onAddAfter }: SectionEditorProps) {
  const id = `s${index}`;
  const e = (field: string) => errors[`sections.${index}.${field}`] ?? null;
  const p = section.program;
  const setProgram = (change: Partial<ProgramDraft>) => onChange({ program: { ...(p ?? emptyProgram(courseLanguage)), ...change } });
  const hasError = Object.keys(errors).some((k) => k.startsWith(`sections.${index}.`));

  return (
    <section aria-labelledby={`${id}-heading`} className={`rounded-[var(--radius-card)] border bg-surface p-5 shadow-[var(--cl-shadow)] ${hasError ? "border-hard" : "border-line"}`}>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h3 id={`${id}-heading`} className="font-semibold">
          <span className="font-mono text-muted">{String(index + 1).padStart(2, "0")}</span> {section.title || "Untitled section"}
        </h3>
        <div className="ml-auto flex flex-wrap gap-1">
          <button type="button" className={buttonClass("ghost", "px-3")} disabled={index === 0} onClick={() => onMove(-1)} aria-label={`Move section ${index + 1} up`}>
            <ArrowUp aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={buttonClass("ghost", "px-3")} disabled={index === count - 1} onClick={() => onMove(1)} aria-label={`Move section ${index + 1} down`}>
            <ArrowDown aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={buttonClass("ghost", "px-3")} onClick={onAddAfter} aria-label={`Add a section after section ${index + 1}`}>
            <Plus aria-hidden="true" className="size-4" />
          </button>
          <button type="button" className={buttonClass("ghost", "px-3 text-hard")} onClick={onRemove} aria-label={`Remove section ${index + 1}`}>
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
          <Field id={`${id}-kind`} label="Kind">
            <select id={`${id}-kind`} value={section.kind} onChange={(ev) => onChange({ kind: ev.target.value as SectionKind })} className={inputClass}>
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </Field>
          <Field id={`${id}-title`} label="Section title" error={e("title")}>
            <input id={`${id}-title`} value={section.title} maxLength={LIMITS.sectionTitle} onChange={(ev) => onChange({ title: ev.target.value })} className={inputClass} />
          </Field>
        </div>
        <Field id={`${id}-body`} label="Text" optional={!!p || !!section.image} error={e("bodyMd")}>
          <textarea id={`${id}-body`} rows={6} value={section.bodyMd} onChange={(ev) => onChange({ bodyMd: ev.target.value })} className={monoInputClass} />
        </Field>

        {section.kind === "diagram" || section.image ? (
          <PictureField
            id={id}
            courseSlug={courseSlug}
            lessonId={lessonId}
            image={section.image}
            imageUrl={imageUrl}
            error={e("image") ?? e("alt")}
            onUploaded={(img, url) => {
              onImageUploaded(img.key, url);
              onChange({ image: { ...img, alt: section.image?.alt ?? "" } });
            }}
            onAlt={(alt) => section.image && onChange({ image: { ...section.image, alt } })}
            onRemove={() => onChange({ image: null })}
          />
        ) : null}

        {p ? (
          <ProgramFields id={id} program={p} setProgram={setProgram} error={e} onRemove={() => onChange({ program: null })} />
        ) : (
          <div>
            <button type="button" className={buttonClass("secondary")} onClick={() => onChange({ program: emptyProgram(courseLanguage) })}>
              <Code2 aria-hidden="true" className="size-4" /> Add a program
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function ProgramFields({ id, program: p, setProgram, error, onRemove }: { id: string; program: ProgramDraft; setProgram: (c: Partial<ProgramDraft>) => void; error: (f: string) => string | null; onRemove: () => void }) {
  const [running, setRunning] = useState(false);
  const [runNote, setRunNote] = useState<string | null>(null);
  const canRun = p.language === "python" || p.language === "cpp";

  const fillOutput = async () => {
    if (!canRun) return;
    setRunning(true);
    setRunNote(null);
    let transcript = "";
    const input = p.input === "" || p.input.endsWith("\n") ? p.input : `${p.input}\n`;
    const result = await getRunner(p.language as "python" | "cpp").run(p.code, input, (stream, text) => {
      if (stream !== "stderr") transcript += text;
    });
    setRunning(false);
    if (result.ok) {
      setProgram({ output: transcript.replace(/\n$/, "") });
      setRunNote(result.inputEnded ? "Done, but the program wanted more typed input than there is." : "Output filled in from a real run.");
    } else {
      setRunNote(result.fatal ?? result.error ?? (result.stopped ? "The run was stopped (time limit)." : "The program failed."));
    }
  };

  return (
    <div className="grid gap-4 rounded-xl border border-line bg-surface-2 p-4">
      <div className="flex flex-wrap items-end gap-4">
        <Field id={`${id}-lang`} label="Language">
          <select id={`${id}-lang`} value={p.language} onChange={(ev) => setProgram({ language: ev.target.value as ProgramDraft["language"], runnable: ev.target.value === "python" || ev.target.value === "cpp" ? p.runnable : false })} className={inputClass}>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
            <option value="pseudocode">Pseudocode</option>
            <option value="text">Plain text</option>
          </select>
        </Field>
        {canRun ? (
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={p.runnable} onChange={(ev) => setProgram({ runnable: ev.target.checked })} className="size-4 accent-[var(--cl-primary)]" />
            Students can edit and run it
          </label>
        ) : null}
        <button type="button" className={buttonClass("ghost", "ml-auto text-hard")} onClick={onRemove}>
          Remove program
        </button>
      </div>
      <Field id={`${id}-code`} label="Code" error={error("code")}>
        <textarea id={`${id}-code`} rows={Math.min(24, Math.max(6, p.code.split("\n").length + 1))} value={p.code} spellCheck={false} onChange={(ev) => setProgram({ code: ev.target.value })} className={monoInputClass} />
      </Field>
      <div className="grid gap-4 md:grid-cols-2">
        <Field id={`${id}-input`} label="Typed input" optional help="What the user types, one line per input() or cin." error={error("input")}>
          <textarea id={`${id}-input`} rows={3} value={p.input} spellCheck={false} onChange={(ev) => setProgram({ input: ev.target.value })} className={monoInputClass} />
        </Field>
        <Field
          id={`${id}-output`}
          label="Output box"
          help={p.output === null ? "No OUTPUT box is shown." : "The terminal as students would see it, typed lines included."}
          error={error("output")}
        >
          {p.output === null ? (
            <button type="button" className={buttonClass("secondary")} onClick={() => setProgram({ output: "" })}>
              Show an OUTPUT box
            </button>
          ) : (
            <textarea id={`${id}-output`} rows={3} value={p.output} spellCheck={false} onChange={(ev) => setProgram({ output: ev.target.value })} className={monoInputClass} />
          )}
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {canRun && p.output !== null ? (
          <button type="button" className={buttonClass("secondary")} disabled={running || !p.code.trim()} onClick={fillOutput}>
            <Play aria-hidden="true" className="size-4" /> {running ? "Running…" : "Run to fill the output"}
          </button>
        ) : null}
        {p.output !== null ? (
          <button type="button" className={buttonClass("ghost")} onClick={() => setProgram({ output: null })}>
            No OUTPUT box
          </button>
        ) : null}
        {runNote ? (
          <p role="status" className="text-sm text-muted">
            {runNote}
          </p>
        ) : null}
      </div>
      <details className="rounded-xl border border-line bg-surface p-3">
        <summary className="cursor-pointer text-sm font-semibold">Note chips and index strips (lec style)</summary>
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          <Field id={`${id}-notes`} label="Note chips" help="One per line: line | code to point at | note | shape colour (e.g. 2 | len(word) | counts letters | circle sky)" error={error("notes")}>
            <textarea id={`${id}-notes`} rows={4} value={p.notes} spellCheck={false} onChange={(ev) => setProgram({ notes: ev.target.value })} className={monoInputClass} />
          </Field>
          <Field id={`${id}-strips`} label="Index strips" help="One per line: line | code | chr or item | items or auto | neg (see docs/CONTENT.md)" error={error("strips")}>
            <textarea id={`${id}-strips`} rows={4} value={p.strips} spellCheck={false} onChange={(ev) => setProgram({ strips: ev.target.value })} className={monoInputClass} />
          </Field>
        </div>
      </details>
    </div>
  );
}

function PictureField({
  id,
  courseSlug,
  lessonId,
  image,
  imageUrl,
  error,
  onUploaded,
  onAlt,
  onRemove,
}: {
  id: string;
  courseSlug: string;
  lessonId: string | null;
  image: SectionDraft["image"];
  imageUrl: string | null;
  error: string | null;
  onUploaded: (img: { key: string; width: number; height: number }, url: string) => void;
  onAlt: (alt: string) => void;
  onRemove: () => void;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => imageUrl, [imageUrl]);

  if (!lessonId) return <Notice tone="info">Create the lecture first, then add pictures to it.</Notice>;
  return (
    <div className="grid gap-3 rounded-xl border border-line bg-surface-2 p-4">
      {image && preview ? (
        // eslint-disable-next-line @next/next/no-img-element -- a staff-only preview of an uploaded file
        <img src={preview} alt="" width={image.width} height={image.height} className="max-h-72 w-auto rounded-lg border border-line bg-white object-contain" />
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`${id}-file`} className={buttonClass("secondary", "cursor-pointer")}>
          <ImagePlus aria-hidden="true" className="size-4" /> {image ? "Replace picture" : "Upload a picture"}
        </label>
        <input
          ref={inputRef}
          id={`${id}-file`}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="sr-only"
          onChange={async (ev) => {
            const file = ev.target.files?.[0];
            if (!file) return;
            setMessage(null);
            setProgress(0);
            const result = await uploadFile<{ key: string; width: number; height: number; previewUrl: string }>(
              `/admin/courses/${courseSlug}/lectures/${lessonId}/images`,
              file,
              setProgress,
            );
            setProgress(null);
            if (inputRef.current) inputRef.current.value = "";
            if (result.ok) onUploaded(result.value, result.value.previewUrl);
            setMessage(result.ok ? "Uploaded. Save the lecture to keep it." : result.error);
          }}
        />
        {image ? (
          <button type="button" className={buttonClass("ghost", "text-hard")} onClick={onRemove}>
            Remove picture
          </button>
        ) : null}
        <span className="text-xs text-muted">PNG, JPEG, WebP or GIF, up to 5 MB.</span>
      </div>
      {progress !== null ? <UploadProgress fraction={progress} label="Uploading picture" /> : null}
      {message ? (
        <p role="status" className="text-sm">
          {message}
        </p>
      ) : null}
      {image ? (
        <Field id={`${id}-alt`} label="What the picture shows" help="Read aloud to students who can't see it." error={error}>
          <input id={`${id}-alt`} value={image.alt} maxLength={LIMITS.alt} onChange={(ev) => onAlt(ev.target.value)} className={inputClass} />
        </Field>
      ) : error ? (
        <p className="text-sm font-medium text-hard">{error}</p>
      ) : null}
    </div>
  );
}

function SeoCard({ courseSlug, lessonId, initial, defaultTitle, defaultDescription }: { courseSlug: string; lessonId: string; initial: LessonEditorProps["seo"]; defaultTitle: string; defaultDescription: string }) {
  const [title, setTitle] = useState(initial.title ?? "");
  const [description, setDescription] = useState(initial.description ?? "");
  const [noindex, setNoindex] = useState(initial.noindex);
  const save = useAdminAction();
  return (
    <Card title="Search engines">
      <div className="grid gap-3">
        <ResultNotice result={save.result} />
        <Field id="seoTitle" label="Search title" optional help={`Empty: “${defaultTitle || "the lecture title"}”. Under 70 characters.`} error={save.fieldError("seoTitle")}>
          <input id="seoTitle" value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </Field>
        <Field id="seoDescription" label="Search description" optional help={`Empty: the lecture description${defaultDescription ? "" : " (not written yet)"}. Under 170 characters.`} error={save.fieldError("seoDescription")}>
          <textarea id="seoDescription" rows={3} value={description} maxLength={400} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
        </Field>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={noindex} onChange={(e) => setNoindex(e.target.checked)} className="size-4 accent-[var(--cl-primary)]" />
          Hide this lecture from search engines
        </label>
        <button
          type="button"
          className={buttonClass("secondary")}
          disabled={save.pending}
          onClick={() => save.run(() => saveLessonSeoAction(courseSlug, lessonId, { seoTitle: title, seoDescription: description, noindex }))}
        >
          {save.pending ? "Saving…" : "Save search settings"}
        </button>
      </div>
    </Card>
  );
}
