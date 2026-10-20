"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { StatusPicker } from "@/components/admin/status-picker";
import { keepResult, useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { slugify } from "@/lib/slug";
import type { ExamDraft, ExamRuleDraft } from "@/server/admin/exams";
import { deleteExamAction, saveExamAction } from "./actions";

export interface ExamEditorProps {
  courseSlug: string;
  examId: string | null;
  initial: ExamDraft;
  topics: { id: string; title: string }[];
  /** Questions a practice exam can draw now: published, scorable and not kept for a final quiz. */
  pool: { type: string; difficulty: string; topicId: string | null }[];
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  updatedAt: number | null;
}

const matches = (r: ExamRuleDraft, q: ExamEditorProps["pool"][number]) =>
  (r.type === null || q.type === r.type) && (r.difficulty === null || q.difficulty === r.difficulty) && (r.topicId === null || q.topicId === r.topicId);

export function ExamEditor(props: ExamEditorProps) {
  const { courseSlug, examId, canEdit, canPublish } = props;
  const router = useRouter();
  const [d, setD] = useState<ExamDraft>(props.initial);
  const [slugTouched, setSlugTouched] = useState(examId !== null);
  const [dirty, setDirty] = useState(false);
  const save = useAdminAction<{ id: string }>(`exam:${examId}`);
  const remove = useAdminAction();
  const err = save.fieldError;
  const base = `/admin/courses/${courseSlug}/exams`;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof ExamDraft>(key: K, value: ExamDraft[K]) => {
    setD((x) => ({ ...x, [key]: value }));
    setDirty(true);
  };
  const setRule = (i: number, change: Partial<ExamRuleDraft>) => set("rules", d.rules.map((r, j) => (j === i ? { ...r, ...change } : r)));
  const totalQuestions = d.rules.reduce((n, r) => n + (Number.isFinite(r.count) ? r.count : 0), 0);
  const totalPoints = d.rules.reduce((n, r) => n + (Number.isFinite(r.count) && Number.isFinite(r.points) ? r.count * r.points : 0), 0);

  return (
    <form
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        remove.setResult(null);
        save.run(() => saveExamAction(courseSlug, examId, d), {
          refresh: examId !== null,
          keep: examId !== null,
          onSuccess: (v, message) => {
            setDirty(false);
            if (!examId) {
              keepResult(`exam:${v.id}`, message);
              router.replace(`${base}/${v.id}`);
            }
          },
        });
      }}
    >
      <div className="grid gap-6">
        <ResultNotice result={remove.result ?? save.result} />
        <fieldset disabled={!canEdit} className="grid gap-6">
          <Card title="Details">
            <div className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Field id="title" label="Title" error={err("title")}>
                  <input
                    id="title"
                    value={d.title}
                    required
                    maxLength={160}
                    onChange={(e) => {
                      set("title", e.target.value);
                      if (!slugTouched) set("slug", slugify(e.target.value));
                    }}
                    aria-describedby={describedBy("title", false, !!err("title"))}
                    className={inputClass}
                  />
                </Field>
                <Field id="slug" label="Address (slug)" help={`/courses/${courseSlug}/exams/${d.slug || "…"}`} error={err("slug")}>
                  <input
                    id="slug"
                    value={d.slug}
                    required
                    maxLength={80}
                    onChange={(e) => {
                      set("slug", e.target.value.toLowerCase());
                      setSlugTouched(true);
                    }}
                    aria-describedby={describedBy("slug", true, !!err("slug"))}
                    className={`${inputClass} font-mono`}
                  />
                </Field>
              </div>
              <Field id="descriptionMd" label="Description" optional help="Shown before the student starts. Markdown works." error={err("descriptionMd")}>
                <textarea id="descriptionMd" rows={3} value={d.descriptionMd} onChange={(e) => set("descriptionMd", e.target.value)} className={inputClass} />
              </Field>
              <Field id="scope" label="Covers">
                <select id="scope" value={d.scope} onChange={(e) => set("scope", e.target.value as ExamDraft["scope"])} className={inputClass}>
                  <option value="course">The whole course</option>
                  <option value="topic">One topic</option>
                  <option value="mixed_topics">Several topics</option>
                </select>
              </Field>
            </div>
          </Card>

          <Card title={`Rules (${totalQuestions} questions, ${totalPoints} points)`}>
            <div className="grid gap-3">
              <p className="text-sm text-muted">Each rule draws that many questions at random. A question is drawn once per attempt, so overlapping rules share the same questions.</p>
              {err("rules") ? (
                <p className="text-sm font-medium text-hard" role="alert">
                  {err("rules")}
                </p>
              ) : null}
              <ol className="grid gap-3">
                {d.rules.map((r, i) => {
                  const available = props.pool.filter((q) => matches(r, q)).length;
                  const short = Number.isFinite(r.count) && r.count > available;
                  return (
                    <li key={i} className="grid gap-3 rounded-xl border border-line p-3 md:grid-cols-[90px_1fr_1fr_1fr_90px_auto] md:items-end">
                      <Field id={`rule-${i}-count`} label="Draw">
                        <input
                          id={`rule-${i}-count`}
                          type="number"
                          min={1}
                          max={100}
                          value={Number.isFinite(r.count) ? r.count : ""}
                          onChange={(e) => setRule(i, { count: Number.parseInt(e.target.value, 10) })}
                          className={inputClass}
                        />
                      </Field>
                      <Field id={`rule-${i}-type`} label="Kind">
                        <select id={`rule-${i}-type`} value={r.type ?? ""} onChange={(e) => setRule(i, { type: (e.target.value || null) as ExamRuleDraft["type"] })} className={inputClass}>
                          <option value="">Any kind</option>
                          <option value="mcq">Multiple choice</option>
                          <option value="trace">Trace the code</option>
                          <option value="correct_code">Fix the code</option>
                        </select>
                      </Field>
                      <Field id={`rule-${i}-difficulty`} label="Level">
                        <select
                          id={`rule-${i}-difficulty`}
                          value={r.difficulty ?? ""}
                          onChange={(e) => setRule(i, { difficulty: (e.target.value || null) as ExamRuleDraft["difficulty"] })}
                          className={inputClass}
                        >
                          <option value="">Any level</option>
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </Field>
                      <Field id={`rule-${i}-topic`} label="Topic">
                        <select id={`rule-${i}-topic`} value={r.topicId ?? ""} onChange={(e) => setRule(i, { topicId: e.target.value || null })} className={inputClass}>
                          <option value="">Any topic</option>
                          {props.topics.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field id={`rule-${i}-points`} label="Points each">
                        <input
                          id={`rule-${i}-points`}
                          type="number"
                          min={1}
                          max={100}
                          value={Number.isFinite(r.points) ? r.points : ""}
                          onChange={(e) => setRule(i, { points: Number.parseInt(e.target.value, 10) })}
                          className={inputClass}
                        />
                      </Field>
                      <button type="button" className={buttonClass("ghost", "px-3")} onClick={() => set("rules", d.rules.filter((_, j) => j !== i))} aria-label={`Remove rule ${i + 1}`}>
                        <X aria-hidden="true" className="size-4" />
                      </button>
                      <p className={`text-sm md:col-span-6 ${short ? "font-medium text-hard" : "text-muted"}`}>
                        {available} published question{available === 1 ? "" : "s"} match this rule{short ? ": not enough to draw from." : "."}
                      </p>
                    </li>
                  );
                })}
              </ol>
              <div>
                <button type="button" className={buttonClass("secondary")} onClick={() => set("rules", [...d.rules, { count: 5, type: null, difficulty: null, topicId: null, points: 1 }])}>
                  <Plus aria-hidden="true" className="size-4" /> Add a rule
                </button>
              </div>
            </div>
          </Card>
        </fieldset>
      </div>

      <aside className="grid gap-6 xl:sticky xl:top-24">
        <Card title="Rules for students">
          <fieldset disabled={!canEdit} className="grid gap-4">
            <Field id="minutes" label="Time limit (minutes)" error={err("minutes")}>
              <input
                id="minutes"
                type="number"
                min={1}
                max={600}
                value={Number.isFinite(d.minutes) ? d.minutes : ""}
                onChange={(e) => set("minutes", Number.parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </Field>
            <Field id="passThreshold" label="Pass mark (%)" error={err("passThreshold")}>
              <input
                id="passThreshold"
                type="number"
                min={0}
                max={100}
                value={Number.isFinite(d.passThreshold) ? d.passThreshold : ""}
                onChange={(e) => set("passThreshold", Number.parseInt(e.target.value, 10))}
                className={inputClass}
              />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={d.shuffleQuestions} onChange={(e) => set("shuffleQuestions", e.target.checked)} className="size-4 accent-[var(--cl-primary)]" />
              Shuffle the question order
            </label>
          </fieldset>
        </Card>
        <Card title="Publishing">
          <div className="grid gap-4">
            {canPublish ? (
              <StatusPicker name="status" options={["draft", "published", "archived"] as const} status={d.status} onChange={(status) => set("status", status)} />
            ) : (
              <p className="text-sm text-muted">
                Status: <strong className="capitalize">{d.status}</strong>. Editors save changes; a course admin publishes.
              </p>
            )}
            {canEdit ? (
              <button type="submit" disabled={save.pending} className={buttonClass("primary", "w-full")}>
                {save.pending ? "Saving…" : examId ? "Save practice exam" : "Create practice exam"}
              </button>
            ) : null}
            {dirty ? <p className="text-sm font-medium text-medium">You have unsaved changes.</p> : null}
            {props.updatedAt && !dirty ? <p className="text-sm text-muted">Last saved {formatAdminTime(props.updatedAt)}</p> : null}
          </div>
        </Card>
        {examId && props.canDelete ? (
          <Card title="Delete">
            <ConfirmButton
              label="Delete practice exam"
              className="w-full"
              question={`Delete “${d.title}”? Students' attempts on it are deleted too. This can't be undone.`}
              confirmLabel="Delete"
              disabled={remove.pending}
              onConfirm={() => {
                save.setResult(null);
                remove.run(() => deleteExamAction(courseSlug, examId), { refresh: false, onSuccess: () => router.push(base) });
              }}
            />
          </Card>
        ) : null}
      </aside>
    </form>
  );
}
