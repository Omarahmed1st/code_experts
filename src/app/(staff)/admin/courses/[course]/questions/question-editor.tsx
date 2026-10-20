"use client";

import { Copy, Download, Eye, History, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, Notice, StatusBadge, inputClass, monoInputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { checkExercise, checkExerciseMarkdown } from "@/lib/admin/exercise-draft";
import { formatAdminTime } from "@/lib/admin/time";
import { ASK_LABEL, type Ask } from "@/lib/exercise/ask";
import { serializeExercise } from "@/lib/exercise/serialize";
import type { ExerciseSource, ExerciseType } from "@/lib/exercise/source";
import type { CompareMode } from "@/lib/grading/output";
import { slugify } from "@/lib/slug";
import { deleteExerciseAction, duplicateExerciseAction, saveExerciseAction } from "./actions";

const TYPE_LABEL: Record<ExerciseType, string> = {
  mcq: "Multiple choice",
  trace: "Trace the code",
  correct_code: "Fix the code",
  write_code: "Write the code",
};
const ASKS_FOR: Record<ExerciseType, Ask[]> = { mcq: [], trace: ["count", "value"], correct_code: ["blanks", "order"], write_code: [] };
const COMPARE_LABEL: Record<CompareMode, string> = {
  trim_trailing: "Ignore spaces at line ends (usual)",
  exact: "Exactly the same",
  normalize_whitespace: "Ignore all spacing differences",
};

export interface QuestionEditorProps {
  courseSlug: string;
  exerciseId: string | null;
  initial: ExerciseSource;
  topics: { slug: string; title: string }[];
  lessons: { slug: string; title: string }[];
  usedIn: { id: string; title: string; status: string }[];
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  updatedAt: number | null;
}

export function QuestionEditor(props: QuestionEditorProps) {
  const { courseSlug, exerciseId, canEdit, canPublish } = props;
  const router = useRouter();
  const [ex, setEx] = useState<ExerciseSource>(props.initial);
  const [tab, setTab] = useState<"form" | "markdown">("form");
  const [markdown, setMarkdown] = useState("");
  const [tabError, setTabError] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(exerciseId !== null);
  const [dirty, setDirty] = useState(false);
  const save = useAdminAction<{ id: string; slug: string }>(`exercise:${exerciseId}`);
  const other = useAdminAction<{ id: string; slug: string }>();
  const remove = useAdminAction();

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const update = (change: Partial<ExerciseSource>) => {
    setEx((e) => ({ ...e, ...change }));
    setDirty(true);
  };
  const setting = (change: Partial<ExerciseSource["settings"]>) => update({ settings: { ...ex.settings, ...change } });

  // The same check the server runs, as you type.
  const live = useMemo(() => (tab === "form" ? checkExercise(ex) : checkExerciseMarkdown(markdown)), [ex, markdown, tab]);

  const switchTab = (next: "form" | "markdown") => {
    if (next === tab) return;
    if (next === "markdown") {
      setMarkdown(serializeExercise(ex));
      setTabError(null);
      setTab("markdown");
      return;
    }
    const parsed = checkExerciseMarkdown(markdown);
    if (!parsed.ok) {
      setTabError(`Fix the Markdown before going back to the form: ${parsed.error}`);
      return;
    }
    setEx(parsed.exercise);
    setTabError(null);
    setTab("form");
  };

  const submit = () => {
    const input = tab === "markdown" ? { markdown } : { source: ex };
    other.setResult(null);
    remove.setResult(null);
    save.run(() => saveExerciseAction(courseSlug, exerciseId, input), {
      refresh: exerciseId !== null,
      keep: exerciseId !== null,
      onSuccess: (value) => {
        setDirty(false);
        if (!exerciseId) router.replace(`/admin/courses/${courseSlug}/questions/${value.id}?created=1`);
      },
    });
  };

  const base = `/admin/courses/${courseSlug}/questions`;
  const runnable = ex.codeLanguage === "python" || ex.codeLanguage === "cpp";

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem] xl:items-start">
      <div className="grid min-w-0 gap-6">
        <ResultNotice result={remove.result ?? other.result ?? save.result} />
        <div role="tablist" aria-label="How to edit" className="flex gap-1 border-b border-line">
          {(
            [
              ["form", "Form"],
              ["markdown", "Markdown"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={tab === value}
              onClick={() => switchTab(value)}
              className={`-mb-px min-h-11 border-b-2 px-4 text-sm font-semibold ${tab === value ? "border-primary-text" : "border-transparent text-muted hover:text-ink"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {tabError ? <Notice tone="error">{tabError}</Notice> : null}

        {tab === "markdown" ? (
          <Card>
            <Field id="markdown" label="The question in the content format" help="The same format as content/<course>/exercises/*.md (docs/CONTENT.md). Use it for trace steps, verify programs and anything the form doesn't show.">
              <textarea
                id="markdown"
                rows={30}
                value={markdown}
                spellCheck={false}
                disabled={!canEdit}
                onChange={(e) => {
                  setMarkdown(e.target.value);
                  setDirty(true);
                }}
                className={monoInputClass}
              />
            </Field>
          </Card>
        ) : (
          <fieldset disabled={!canEdit} className="grid min-w-0 gap-6">
            <Card title="Question">
              <div className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="title" label="Title">
                    <input
                      id="title"
                      value={ex.title}
                      maxLength={160}
                      onChange={(e) => update({ title: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
                      className={inputClass}
                    />
                  </Field>
                  <Field id="slug" label="Address (slug)" help={`/courses/${courseSlug}/exercises/${ex.slug || "…"}`} error={save.fieldError("slug")}>
                    <input
                      id="slug"
                      value={ex.slug}
                      maxLength={80}
                      onChange={(e) => {
                        setSlugTouched(true);
                        update({ slug: e.target.value.toLowerCase() });
                      }}
                      className={`${inputClass} font-mono`}
                    />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-4">
                  <Field id="type" label="Type">
                    <select
                      id="type"
                      value={ex.type}
                      onChange={(e) => {
                        const type = e.target.value as ExerciseType;
                        const ask = ex.settings.ask && ASKS_FOR[type].includes(ex.settings.ask) ? ex.settings.ask : undefined;
                        update({ type, settings: { ...ex.settings, ask } });
                      }}
                      className={inputClass}
                    >
                      {(Object.keys(TYPE_LABEL) as ExerciseType[]).map((t) => (
                        <option key={t} value={t}>
                          {TYPE_LABEL[t]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="ask" label="Format">
                    <select id="ask" value={ex.settings.ask ?? ""} disabled={ASKS_FOR[ex.type].length === 0} onChange={(e) => setting({ ask: (e.target.value || undefined) as Ask | undefined })} className={inputClass}>
                      <option value="">Standard</option>
                      {ASKS_FOR[ex.type].map((a) => (
                        <option key={a} value={a}>
                          {ASK_LABEL[a]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="difficulty" label="Level">
                    <select id="difficulty" value={ex.difficulty} onChange={(e) => update({ difficulty: e.target.value as ExerciseSource["difficulty"] })} className={inputClass}>
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </Field>
                  <Field id="points" label="Points">
                    <input id="points" type="number" min={1} max={100} value={ex.points} onChange={(e) => update({ points: Number(e.target.value) })} className={inputClass} />
                  </Field>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="topic" label="Topic">
                    <select id="topic" value={ex.topic ?? ""} onChange={(e) => update({ topic: e.target.value || null })} className={inputClass}>
                      <option value="">From the lecture</option>
                      {props.topics.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="lesson" label="Lecture" optional help="Listed under “Practise this lecture”.">
                    <select id="lesson" value={ex.lesson ?? ""} onChange={(e) => update({ lesson: e.target.value || null })} className={inputClass}>
                      <option value="">None</option>
                      {props.lessons.map((l) => (
                        <option key={l.slug} value={l.slug}>
                          {l.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <Field id="prompt" label="Question" help="Markdown.">
                  <textarea id="prompt" rows={4} value={ex.promptMd} onChange={(e) => update({ promptMd: e.target.value })} className={monoInputClass} />
                </Field>
                {ex.type === "correct_code" || ex.type === "write_code" ? (
                  <Field id="expected" label="What the finished program does" help="Markdown.">
                    <textarea id="expected" rows={3} value={ex.expectedBehaviorMd} onChange={(e) => update({ expectedBehaviorMd: e.target.value })} className={monoInputClass} />
                  </Field>
                ) : null}
              </div>
            </Card>

            <Card title={ex.type === "write_code" ? "Starter code" : ex.type === "correct_code" ? "The broken program" : "Code"}>
              <div className="grid gap-4">
                {ex.code === null ? (
                  <button type="button" className={buttonClass("secondary", "justify-self-start")} onClick={() => update({ code: "", codeLanguage: "python" })}>
                    <Plus aria-hidden="true" className="size-4" /> Add code
                  </button>
                ) : (
                  <>
                    <div className="flex flex-wrap items-end gap-3">
                      <Field id="codeLanguage" label="Language">
                        <select id="codeLanguage" value={ex.codeLanguage ?? "python"} onChange={(e) => update({ codeLanguage: e.target.value as ExerciseSource["codeLanguage"] })} className={inputClass}>
                          <option value="python">Python</option>
                          <option value="cpp">C++</option>
                          <option value="pseudocode">Pseudocode</option>
                          <option value="text">Plain text</option>
                        </select>
                      </Field>
                      {ex.type === "mcq" ? (
                        <button type="button" className={buttonClass("ghost", "text-hard")} onClick={() => update({ code: null, codeLanguage: null })}>
                          Remove code
                        </button>
                      ) : null}
                    </div>
                    <Field
                      id="code"
                      label="Code"
                      help={
                        ex.settings.ask === "blanks"
                          ? "Write ___ (three underscores) for each blank."
                          : ex.settings.ask === "order"
                            ? "Put the lines to order between a // [order] line and a // [/order] line (# in Python), in the right order."
                            : undefined
                      }
                    >
                      <textarea id="code" rows={Math.min(22, Math.max(6, (ex.code ?? "").split("\n").length + 1))} spellCheck={false} value={ex.code ?? ""} onChange={(e) => update({ code: e.target.value })} className={monoInputClass} />
                    </Field>
                  </>
                )}
                {ex.type === "trace" && (ex.codeLanguage === "pseudocode" || ex.settings.ask === "count" || ex.settings.ask === "value") ? (
                  <Field
                    id="verify"
                    label="Checking program (hidden)"
                    help={ex.codeLanguage === "pseudocode" ? "The same steps in C++, so the answer can be checked." : "A copy of the program that prints the answer, so it can be checked."}
                  >
                    <textarea
                      id="verify"
                      rows={6}
                      spellCheck={false}
                      value={ex.verifyCode ?? ""}
                      onChange={(e) => update({ verifyCode: e.target.value || null, verifyLanguage: e.target.value ? (ex.verifyLanguage ?? (ex.codeLanguage === "python" ? "python" : "cpp")) : null })}
                      className={monoInputClass}
                    />
                  </Field>
                ) : null}
              </div>
            </Card>

            {ex.type === "mcq" ? <OptionsCard ex={ex} update={update} setting={setting} /> : null}
            {ex.type === "trace" ? <TraceAnswerCard ex={ex} update={update} setting={setting} /> : null}
            {ex.type === "correct_code" || ex.type === "write_code" ? <SolutionCard ex={ex} update={update} setting={setting} runnable={runnable} /> : null}

            <Card title="Explanation and hints">
              <div className="grid gap-4">
                <Field id="explanation" label="Explanation" help="Shown after answering. Every question explains its answer. Markdown.">
                  <textarea id="explanation" rows={5} value={ex.explanationMd} onChange={(e) => update({ explanationMd: e.target.value })} className={monoInputClass} />
                </Field>
                <StringList id="hints" label="Hints" itemLabel="Hint" values={ex.hints} onChange={(hints) => update({ hints })} />
              </div>
            </Card>
            {ex.steps.length > 0 ? <Notice tone="info">This question has {ex.steps.length} trace steps. Edit them on the Markdown tab (## Steps).</Notice> : null}
          </fieldset>
        )}
      </div>

      <aside className="grid gap-6 xl:sticky xl:top-24">
        <Card title="Publishing">
          <div className="grid gap-3">
            {canPublish ? (
              <fieldset className="grid gap-1" disabled={tab === "markdown"}>
                <legend className="mb-1 text-sm font-semibold">Status</legend>
                {(
                  [
                    ["draft", "Draft: only staff"],
                    ["published", "Published: in practice, quizzes and exams"],
                  ] as const
                ).map(([value, label]) => (
                  <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="status" checked={ex.status === value} onChange={() => update({ status: value })} className="size-4 accent-[var(--cl-primary)]" />
                    {label}
                  </label>
                ))}
              </fieldset>
            ) : (
              <p className="text-sm text-muted">
                Status: <StatusBadge status={ex.status} />. A course admin publishes.
              </p>
            )}
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" disabled={!canEdit || tab === "markdown"} checked={ex.settings.reserved === true} onChange={(e) => setting({ reserved: e.target.checked || undefined })} className="size-4 accent-[var(--cl-primary)]" />
              Reserved for one quiz (hidden from practice)
            </label>
            <p role="status" className={`text-sm ${live.ok ? "text-easy" : "text-medium"}`}>
              {live.ok ? "Ready to save." : `Before saving: ${live.error}`}
            </p>
            {canEdit ? (
              <button type="button" onClick={submit} disabled={save.pending} className={buttonClass("primary", "w-full")}>
                {save.pending ? "Saving…" : exerciseId ? "Save question" : "Create question"}
              </button>
            ) : null}
            {dirty ? <p className="text-sm font-medium text-medium">You have unsaved changes.</p> : null}
            {props.updatedAt && !dirty ? <p className="text-sm text-muted">Last saved {formatAdminTime(props.updatedAt)}</p> : null}
          </div>
        </Card>
        {exerciseId ? (
          <Card title="More">
            <div className="grid gap-2">
              <Link href={`${base}/${exerciseId}/preview`} className={buttonClass("secondary", "justify-start")}>
                <Eye aria-hidden="true" className="size-4" /> Preview with the answer key
              </Link>
              <Link href={`${base}/${exerciseId}/history`} className={buttonClass("secondary", "justify-start")}>
                <History aria-hidden="true" className="size-4" /> History
              </Link>
              <a href={`${base}/${exerciseId}/export`} className={buttonClass("secondary", "justify-start")}>
                <Download aria-hidden="true" className="size-4" /> Download as Markdown
              </a>
              {canEdit ? (
                <button
                  type="button"
                  className={buttonClass("secondary", "justify-start")}
                  disabled={other.pending}
                  onClick={() => {
                    save.setResult(null);
                    other.run(() => duplicateExerciseAction(courseSlug, exerciseId), { refresh: false, onSuccess: (v) => router.push(`${base}/${v.id}?created=1`) });
                  }}
                >
                  <Copy aria-hidden="true" className="size-4" /> Duplicate as a draft
                </button>
              ) : null}
              {props.canDelete ? (
                <ConfirmButton
                  label={
                    <>
                      <Trash2 aria-hidden="true" className="size-4" /> Delete question
                    </>
                  }
                  className="justify-start"
                  question="Delete this question? This can't be undone."
                  confirmLabel="Delete"
                  disabled={remove.pending || props.usedIn.length > 0}
                  onConfirm={() => {
                    save.setResult(null);
                    other.setResult(null);
                    remove.run(() => deleteExerciseAction(courseSlug, exerciseId), { refresh: false, onSuccess: () => router.push(base) });
                  }}
                />
              ) : null}
            </div>
          </Card>
        ) : null}
        {props.usedIn.length > 0 ? (
          <Card title="Used in">
            <ul className="grid gap-1 text-sm">
              {props.usedIn.map((q) => (
                <li key={q.id}>
                  <Link href={`/admin/courses/${courseSlug}/quizzes/${q.id}`} className="font-medium hover:underline">
                    {q.title}
                  </Link>{" "}
                  <StatusBadge status={q.status} />
                </li>
              ))}
            </ul>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}

type Update = (change: Partial<ExerciseSource>) => void;
type Setting = (change: Partial<ExerciseSource["settings"]>) => void;

function OptionsCard({ ex, update, setting }: { ex: ExerciseSource; update: Update; setting: Setting }) {
  const setOption = (i: number, change: Partial<ExerciseSource["options"][number]>) =>
    update({
      options: ex.options.map((o, j) => {
        if (j === i) return { ...o, ...change };
        // One right answer unless "several are right" is on.
        if (change.correct && !ex.settings.multiple) return { ...o, correct: false };
        return o;
      }),
    });
  return (
    <Card title="Options">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-x-6">
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={ex.settings.multiple === true} onChange={(e) => setting({ multiple: e.target.checked || undefined })} className="size-4 accent-[var(--cl-primary)]" />
            Several options are right (students pick all of them)
          </label>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={ex.settings.shuffle !== false} onChange={(e) => setting({ shuffle: e.target.checked })} className="size-4 accent-[var(--cl-primary)]" />
            Shuffle the options
          </label>
        </div>
        <ol className="grid gap-3">
          {ex.options.map((o, i) => (
            <li key={i} className="grid gap-2 rounded-xl border border-line p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start">
              <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
                <input type={ex.settings.multiple ? "checkbox" : "radio"} name="correct" checked={o.correct} onChange={(e) => setOption(i, { correct: e.target.checked })} className="size-4 accent-[var(--cl-primary)]" />
                Right
              </label>
              <div className="grid gap-2">
                <label className="sr-only" htmlFor={`opt-${i}`}>
                  Option {i + 1}
                </label>
                <input id={`opt-${i}`} value={o.labelMd} placeholder={`Option ${i + 1}`} onChange={(e) => setOption(i, { labelMd: e.target.value })} className={inputClass} />
                <label className="sr-only" htmlFor={`fb-${i}`}>
                  Feedback for option {i + 1}
                </label>
                <input id={`fb-${i}`} value={o.feedbackMd} placeholder="Feedback when picked (optional)" onChange={(e) => setOption(i, { feedbackMd: e.target.value })} className={`${inputClass} text-sm`} />
              </div>
              <button type="button" className={buttonClass("ghost", "px-3 text-hard")} disabled={ex.options.length <= 2} onClick={() => update({ options: ex.options.filter((_, j) => j !== i) })} aria-label={`Remove option ${i + 1}`}>
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ol>
        <button type="button" className={buttonClass("secondary", "justify-self-start")} disabled={ex.options.length >= 8} onClick={() => update({ options: [...ex.options, { labelMd: "", correct: false, feedbackMd: "" }] })}>
          <Plus aria-hidden="true" className="size-4" /> Add an option
        </button>
      </div>
    </Card>
  );
}

function TraceAnswerCard({ ex, update, setting }: { ex: ExerciseSource; update: Update; setting: Setting }) {
  const fixedCompare = ex.settings.ask === "count" || ex.settings.ask === "value";
  return (
    <Card title="Answer">
      <div className="grid gap-4">
        <StringList
          id="outputs"
          label={fixedCompare ? "The answer (one line)" : "Exact output"}
          itemLabel="Accepted answer"
          help="The first is shown as the answer; add others that should also count."
          values={ex.outputs.map((o) => o.replace(/\n$/, ""))}
          onChange={(outputs) => update({ outputs })}
          mono
          multiline={!fixedCompare}
        />
        {!fixedCompare ? (
          <div className="flex flex-wrap items-end gap-4">
            <Field id="compare" label="Compare answers">
              <select id="compare" value={ex.settings.compare ?? "trim_trailing"} onChange={(e) => setting({ compare: e.target.value as CompareMode })} className={inputClass}>
                {(Object.keys(COMPARE_LABEL) as CompareMode[]).map((m) => (
                  <option key={m} value={m}>
                    {COMPARE_LABEL[m]}
                  </option>
                ))}
              </select>
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={ex.settings.caseSensitive === false} onChange={(e) => setting({ caseSensitive: e.target.checked ? false : undefined })} className="size-4 accent-[var(--cl-primary)]" />
              Upper and lower case count as the same
            </label>
          </div>
        ) : null}
      </div>
    </Card>
  );
}

function SolutionCard({ ex, update, setting, runnable }: { ex: ExerciseSource; update: Update; setting: Setting; runnable: boolean }) {
  const setTest = (i: number, change: Partial<ExerciseSource["tests"][number]>) => update({ tests: ex.tests.map((t, j) => (j === i ? { ...t, ...change } : t)) });
  return (
    <Card title="Solution and tests">
      <div className="grid gap-4">
        {!runnable ? <Notice tone="warn">Use Python or C++ code: these questions run the student&apos;s program.</Notice> : null}
        {ex.settings.ask === "order" ? (
          <p className="text-sm text-muted">The solution is the code above with its lines in order.</p>
        ) : (
          <Field id="solution" label="Solution (a working program)" help={ex.settings.ask === "blanks" ? "The code above with every ___ filled in." : undefined}>
            <textarea id="solution" rows={Math.min(22, Math.max(6, (ex.solution ?? "").split("\n").length + 1))} spellCheck={false} value={ex.solution ?? ""} onChange={(e) => update({ solution: e.target.value || null })} className={monoInputClass} />
          </Field>
        )}
        {ex.type === "correct_code" ? <StringList id="accepted" label="Other accepted fixes" itemLabel="Accepted fix" values={ex.accepted} onChange={(accepted) => update({ accepted })} mono multiline /> : null}
        <div className="grid gap-3">
          <h3 className="text-sm font-semibold">Tests</h3>
          {ex.tests.map((t, i) => (
            <div key={i} className="grid gap-3 rounded-xl border border-line p-3">
              <div className="flex flex-wrap items-end gap-3">
                <Field id={`test-${i}-name`} label={`Test ${i + 1} name`}>
                  <input id={`test-${i}-name`} value={t.name} onChange={(e) => setTest(i, { name: e.target.value })} className={inputClass} />
                </Field>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={t.hidden} onChange={(e) => setTest(i, { hidden: e.target.checked })} className="size-4 accent-[var(--cl-primary)]" />
                  Hidden from students
                </label>
                <button type="button" className={buttonClass("ghost", "ml-auto text-hard")} disabled={ex.tests.length <= 1} onClick={() => update({ tests: ex.tests.filter((_, j) => j !== i) })}>
                  Remove test
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Field id={`test-${i}-in`} label="Typed input" optional>
                  <textarea id={`test-${i}-in`} rows={3} spellCheck={false} value={t.stdin.replace(/\n$/, "")} onChange={(e) => setTest(i, { stdin: e.target.value })} className={monoInputClass} />
                </Field>
                <Field id={`test-${i}-out`} label="Expected output">
                  <textarea id={`test-${i}-out`} rows={3} spellCheck={false} value={t.stdout.replace(/\n$/, "")} onChange={(e) => setTest(i, { stdout: e.target.value })} className={monoInputClass} />
                </Field>
              </div>
            </div>
          ))}
          <button type="button" className={buttonClass("secondary", "justify-self-start")} onClick={() => update({ tests: [...ex.tests, { name: `Test ${ex.tests.length + 1}`, stdin: "", stdout: "", hidden: false }] })}>
            <Plus aria-hidden="true" className="size-4" /> Add a test
          </button>
        </div>
        <Field id="testCompare" label="Compare outputs">
          <select id="testCompare" value={ex.settings.compare ?? "trim_trailing"} onChange={(e) => setting({ compare: e.target.value as CompareMode })} className={inputClass}>
            {(Object.keys(COMPARE_LABEL) as CompareMode[]).map((m) => (
              <option key={m} value={m}>
                {COMPARE_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </Card>
  );
}

function StringList({
  id,
  label,
  itemLabel,
  help,
  values,
  onChange,
  mono = false,
  multiline = false,
}: {
  id: string;
  label: string;
  itemLabel: string;
  help?: string;
  values: string[];
  onChange: (v: string[]) => void;
  mono?: boolean;
  multiline?: boolean;
}) {
  const cls = mono ? monoInputClass : inputClass;
  return (
    <fieldset className="grid gap-2">
      <legend className="text-sm font-semibold">{label}</legend>
      {help ? <p className="text-xs text-muted">{help}</p> : null}
      {values.map((v, i) => (
        <div key={i} className="flex items-start gap-2">
          <label htmlFor={`${id}-${i}`} className="sr-only">
            {itemLabel} {i + 1}
          </label>
          {multiline ? (
            <textarea id={`${id}-${i}`} rows={Math.max(2, v.split("\n").length)} spellCheck={false} value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} className={cls} />
          ) : (
            <input id={`${id}-${i}`} value={v} onChange={(e) => onChange(values.map((x, j) => (j === i ? e.target.value : x)))} className={cls} />
          )}
          <button type="button" className={buttonClass("ghost", "px-3 text-hard")} onClick={() => onChange(values.filter((_, j) => j !== i))} aria-label={`Remove ${itemLabel.toLowerCase()} ${i + 1}`}>
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" className={buttonClass("secondary", "justify-self-start")} onClick={() => onChange([...values, ""])}>
        <Plus aria-hidden="true" className="size-4" /> Add {itemLabel.toLowerCase()}
      </button>
    </fieldset>
  );
}
