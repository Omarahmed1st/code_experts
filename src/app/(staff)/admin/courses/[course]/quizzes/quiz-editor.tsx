"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import {
  Card,
  Field,
  Notice,
  StatusBadge,
  describedBy,
  inputClass,
} from "@/components/admin/form-parts";
import { StatusPicker } from "@/components/admin/status-picker";
import {
  keepResult,
  useAdminAction,
} from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { ASK_LABEL } from "@/lib/exercise/ask";
import { slugify } from "@/lib/slug";
import type { QuizDraft } from "@/server/admin/quizzes";
import {
  addQuizModelAction,
  deleteQuizAction,
  saveQuizAction,
} from "./actions";

const TYPE_LABEL: Record<string, string> = {
  mcq: "Multiple choice",
  trace: "Trace the code",
  correct_code: "Fix the code",
};

export interface QuizCandidate {
  id: string;
  slug: string;
  title: string;
  type: string;
  ask: string | null;
  difficulty: string;
  status: string;
  topicId: string | null;
  topicTitle: string | null;
  reserved: boolean;
}

export interface QuizFamily {
  /** Model A is the quiz itself. */
  versions: { id: string; label: string; questions: number }[];
  /** Questions in every version. */
  shared: number;
}

export interface QuizEditorProps {
  courseSlug: string;
  quizId: string | null;
  initial: QuizDraft;
  modelOf: { id: string; title: string } | null;
  models: { id: string; slug: string; title: string; letter: string }[];
  family: QuizFamily | null;
  topics: { id: string; title: string }[];
  candidates: QuizCandidate[];
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  updatedAt: number | null;
}

const kindOf = (q: QuizCandidate) =>
  q.ask
    ? ASK_LABEL[q.ask as keyof typeof ASK_LABEL]
    : (TYPE_LABEL[q.type] ?? q.type);

export function QuizEditor(props: QuizEditorProps) {
  const { courseSlug, quizId, modelOf, canEdit, canPublish } = props;
  const router = useRouter();
  const [d, setD] = useState<QuizDraft>(props.initial);
  const [slugTouched, setSlugTouched] = useState(quizId !== null);
  const [dirty, setDirty] = useState(false);
  const [search, setSearch] = useState("");
  const [topicFilter, setTopicFilter] = useState(props.initial.topicId ?? "");
  const [typeFilter, setTypeFilter] = useState("");
  const save = useAdminAction<{ id: string }>(`quiz:${quizId}`);
  const other = useAdminAction<unknown>();
  const err = save.fieldError;
  const base = `/admin/courses/${courseSlug}/quizzes`;
  const isModel = modelOf !== null;

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const set = <K extends keyof QuizDraft>(key: K, value: QuizDraft[K]) => {
    setD((x) => ({ ...x, [key]: value }));
    setDirty(true);
  };
  const byId = useMemo(
    () => new Map(props.candidates.map((c) => [c.id, c])),
    [props.candidates],
  );
  const chosen = new Set(d.questions.map((q) => q.exerciseId));
  const totalPoints = d.questions.reduce(
    (s, q) => s + (Number.isFinite(q.points) ? q.points : 0),
    0,
  );
  const drafts = d.questions.filter(
    (q) => byId.get(q.exerciseId)?.status !== "published",
  ).length;

  const term = search.trim().toLowerCase();
  const available = props.candidates.filter(
    (c) =>
      !chosen.has(c.id) &&
      (!topicFilter ||
        (topicFilter === "none"
          ? c.topicId === null
          : c.topicId === topicFilter)) &&
      (!typeFilter ||
        (typeFilter.startsWith("ask:")
          ? c.ask === typeFilter.slice(4)
          : c.type === typeFilter && !c.ask)) &&
      (!term || c.title.toLowerCase().includes(term) || c.slug.includes(term)),
  );
  const shown = available.slice(0, 60);

  const moveQuestion = (i: number, by: number) => {
    const list = [...d.questions];
    const [m] = list.splice(i, 1);
    list.splice(i + by, 0, m!);
    set("questions", list);
  };

  const submit = () => {
    other.setResult(null);
    save.run(() => saveQuizAction(courseSlug, quizId, d), {
      refresh: quizId !== null,
      keep: quizId !== null,
      onSuccess: (value, message) => {
        setDirty(false);
        if (!quizId) {
          keepResult(`quiz:${value.id}`, message);
          router.replace(`${base}/${value.id}`);
        }
      },
    });
  };

  return (
    <form
      className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div className="grid gap-6">
        <ResultNotice result={other.result ?? save.result} />
        {isModel ? (
          <Notice tone="info">
            This is another version of{" "}
            <Link
              href={`${base}/${modelOf.id}`}
              className="font-semibold underline"
            >
              {modelOf.title}
            </Link>
            . Its timer, pass mark, attempts and status come from that quiz;
            here you choose its title and questions.
          </Notice>
        ) : null}
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
                      if (!slugTouched && !isModel)
                        set("slug", slugify(e.target.value));
                    }}
                    aria-describedby={describedBy(
                      "title",
                      false,
                      !!err("title"),
                    )}
                    className={inputClass}
                  />
                </Field>
                <Field
                  id="slug"
                  label="Address (slug)"
                  help={
                    isModel
                      ? "Set by the quiz it belongs to."
                      : `/courses/${courseSlug}/quizzes/${d.slug || "…"}`
                  }
                  error={err("slug")}
                >
                  <input
                    id="slug"
                    value={d.slug}
                    required
                    readOnly={isModel}
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
              {!isModel ? (
                <>
                  <Field
                    id="descriptionMd"
                    label="Description"
                    optional
                    help="Shown before the student starts. Markdown works."
                    error={err("descriptionMd")}
                  >
                    <textarea
                      id="descriptionMd"
                      rows={3}
                      value={d.descriptionMd}
                      onChange={(e) => set("descriptionMd", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      id="topicId"
                      label="Topic"
                      help="Empty: a whole-course quiz."
                      error={err("topicId")}
                    >
                      <select
                        id="topicId"
                        value={d.topicId ?? ""}
                        onChange={(e) => {
                          set("topicId", e.target.value || null);
                          setTopicFilter(e.target.value);
                        }}
                        className={inputClass}
                      >
                        <option value="">Whole course</option>
                        {props.topics.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field id="mode" label="Feedback">
                      <select
                        id="mode"
                        value={d.mode}
                        onChange={(e) =>
                          set(
                            "mode",
                            e.target.value === "exam" ? "exam" : "practice",
                          )
                        }
                        className={inputClass}
                      >
                        <option value="practice">
                          Practice: feedback after each question
                        </option>
                        <option value="exam">
                          Exam: marks only after submitting
                        </option>
                      </select>
                    </Field>
                  </div>
                </>
              ) : null}
            </div>
          </Card>

          <Card
            title={`Questions (${d.questions.length}, ${totalPoints} point${totalPoints === 1 ? "" : "s"})`}
          >
            <div className="grid gap-3">
              {err("questions") ? (
                <p className="text-sm font-medium text-hard" role="alert">
                  {err("questions")}
                </p>
              ) : null}
              {drafts > 0 ? (
                <p className="text-sm text-medium">
                  {drafts} of these questions are drafts. Publish them before
                  publishing the quiz.
                </p>
              ) : null}
              {d.questions.length === 0 ? (
                <p className="text-sm text-muted">
                  No questions yet. Add some from the list below.
                </p>
              ) : null}
              <ol className="grid gap-2">
                {d.questions.map((q, i) => {
                  const c = byId.get(q.exerciseId);
                  return (
                    <li
                      key={q.exerciseId}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3"
                    >
                      <span className="w-7 font-mono text-sm text-muted">
                        {i + 1}.
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          <Link
                            href={`/admin/courses/${courseSlug}/questions/${q.exerciseId}`}
                            className="hover:underline"
                          >
                            {c?.title ?? "(missing question)"}
                          </Link>
                          {c && c.status !== "published" ? (
                            <StatusBadge status="draft" />
                          ) : null}
                          {c?.reserved ? (
                            <StatusBadge
                              status="scheduled"
                              label="final quiz only"
                            />
                          ) : null}
                        </p>
                        {c ? (
                          <p className="text-xs text-muted">
                            {kindOf(c)} ·{" "}
                            <span className="capitalize">{c.difficulty}</span> ·{" "}
                            {c.topicTitle ?? "no topic"}
                          </p>
                        ) : null}
                      </div>
                      <label className="flex items-center gap-1.5 text-sm">
                        Points
                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={Number.isFinite(q.points) ? q.points : ""}
                          onChange={(e) =>
                            set(
                              "questions",
                              d.questions.map((x, j) =>
                                j === i
                                  ? {
                                      ...x,
                                      points: Number.parseInt(
                                        e.target.value,
                                        10,
                                      ),
                                    }
                                  : x,
                              ),
                            )
                          }
                          className={`${inputClass} w-20`}
                        />
                      </label>
                      <button
                        type="button"
                        className={buttonClass("ghost", "px-3")}
                        disabled={i === 0}
                        onClick={() => moveQuestion(i, -1)}
                        aria-label={`Move question ${i + 1} up`}
                      >
                        <ArrowUp aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={buttonClass("ghost", "px-3")}
                        disabled={i === d.questions.length - 1}
                        onClick={() => moveQuestion(i, 1)}
                        aria-label={`Move question ${i + 1} down`}
                      >
                        <ArrowDown aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        className={buttonClass("ghost", "px-3")}
                        onClick={() =>
                          set(
                            "questions",
                            d.questions.filter((_, j) => j !== i),
                          )
                        }
                        aria-label={`Remove ${c?.title ?? "question"}`}
                      >
                        <X aria-hidden="true" className="size-4" />
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </Card>

          {canEdit ? (
            <Card title="Add questions">
              <div className="grid gap-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="grid gap-1 text-sm font-semibold">
                    Search
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Title or address"
                      className={inputClass}
                    />
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Topic
                    <select
                      value={topicFilter}
                      onChange={(e) => setTopicFilter(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Any</option>
                      {props.topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                      <option value="none">No topic</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-sm font-semibold">
                    Kind
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Any</option>
                      <option value="mcq">Multiple choice</option>
                      <option value="trace">Trace the code</option>
                      <option value="ask:count">How many times?</option>
                      <option value="ask:value">Find the value</option>
                      <option value="correct_code">Fix the code</option>
                      <option value="ask:blanks">Fill in the blanks</option>
                      <option value="ask:order">Put the lines in order</option>
                    </select>
                  </label>
                </div>
                <p className="text-sm text-muted" aria-live="polite">
                  {available.length === 0
                    ? "No more questions match."
                    : `${available.length} match${available.length > shown.length ? `; showing the first ${shown.length}` : ""}.`}{" "}
                  Write-the-code questions are practice only and can't go in a
                  quiz.
                </p>
                <ul className="grid max-h-[36rem] gap-2 overflow-y-auto pr-1">
                  {shown.map((c) => (
                    <li
                      key={c.id}
                      className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                          {c.title}
                          {c.status !== "published" ? (
                            <StatusBadge status="draft" />
                          ) : null}
                          {c.reserved ? (
                            <StatusBadge
                              status="scheduled"
                              label="final quiz only"
                            />
                          ) : null}
                        </p>
                        <p className="text-xs text-muted">
                          {kindOf(c)} ·{" "}
                          <span className="capitalize">{c.difficulty}</span> ·{" "}
                          {c.topicTitle ?? "no topic"}
                        </p>
                      </div>
                      <button
                        type="button"
                        className={buttonClass("secondary", "px-3")}
                        onClick={() =>
                          set("questions", [
                            ...d.questions,
                            { exerciseId: c.id, points: 1 },
                          ])
                        }
                      >
                        <Plus aria-hidden="true" className="size-4" /> Add
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ) : null}
        </fieldset>
      </div>

      <aside className="grid gap-6 xl:sticky xl:top-24">
        {!isModel ? (
          <Card title="Rules">
            <fieldset disabled={!canEdit} className="grid gap-4">
              <Field
                id="minutes"
                label="Time limit (minutes)"
                optional
                help="Empty: no timer."
                error={err("minutes")}
              >
                <input
                  id="minutes"
                  type="number"
                  min={1}
                  max={600}
                  value={d.minutes ?? ""}
                  onChange={(e) =>
                    set(
                      "minutes",
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value, 10),
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <Field
                id="passThreshold"
                label="Pass mark (%)"
                error={err("passThreshold")}
              >
                <input
                  id="passThreshold"
                  type="number"
                  min={0}
                  max={100}
                  value={
                    Number.isFinite(d.passThreshold) ? d.passThreshold : ""
                  }
                  onChange={(e) =>
                    set("passThreshold", Number.parseInt(e.target.value, 10))
                  }
                  className={inputClass}
                />
              </Field>
              <Field
                id="maxAttempts"
                label="Attempts allowed in 24 hours"
                optional
                help="Empty: unlimited. Until students have accounts, this is counted per browser."
                error={err("maxAttempts")}
              >
                <input
                  id="maxAttempts"
                  type="number"
                  min={1}
                  max={50}
                  value={d.maxAttempts ?? ""}
                  onChange={(e) =>
                    set(
                      "maxAttempts",
                      e.target.value === ""
                        ? null
                        : Number.parseInt(e.target.value, 10),
                    )
                  }
                  className={inputClass}
                />
              </Field>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={d.shuffleQuestions}
                  onChange={(e) => set("shuffleQuestions", e.target.checked)}
                  className="size-4 accent-[var(--cl-primary)]"
                />
                Shuffle the question order
              </label>
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={d.shuffleOptions}
                  onChange={(e) => set("shuffleOptions", e.target.checked)}
                  className="size-4 accent-[var(--cl-primary)]"
                />
                Shuffle the answer options
              </label>
            </fieldset>
          </Card>
        ) : null}
        <Card title="Publishing">
          <div className="grid gap-4">
            {isModel ? (
              <p className="text-sm text-muted">Goes live with its quiz.</p>
            ) : canPublish ? (
              <StatusPicker
                name="status"
                options={
                  ["draft", "published", "scheduled", "archived"] as const
                }
                status={d.status}
                publishAt={d.publishAt}
                error={err("publishAt")}
                onChange={(status, publishAt) => {
                  set("status", status);
                  set("publishAt", publishAt);
                }}
              />
            ) : (
              <p className="text-sm text-muted">
                Status: <strong className="capitalize">{d.status}</strong>.
                Editors save changes; a course admin publishes.
              </p>
            )}
            {canEdit ? (
              <button
                type="submit"
                disabled={save.pending}
                className={buttonClass("primary", "w-full")}
              >
                {save.pending
                  ? "Saving…"
                  : quizId
                    ? "Save quiz"
                    : "Create quiz"}
              </button>
            ) : null}
            {dirty ? (
              <p className="text-sm font-medium text-medium">
                You have unsaved changes.
              </p>
            ) : null}
            {props.updatedAt && !dirty ? (
              <p className="text-sm text-muted">
                Last saved {formatAdminTime(props.updatedAt)}
              </p>
            ) : null}
          </div>
        </Card>
        {quizId ? (
          <ModelsCard {...props} quizId={quizId} other={other} />
        ) : null}
        {quizId && props.canDelete ? (
          <Card title="Delete">
            <ConfirmButton
              label={
                isModel
                  ? "Delete this model"
                  : props.models.length
                    ? "Delete the quiz and its models"
                    : "Delete quiz"
              }
              className="w-full"
              question={`Delete “${d.title}”${!isModel && props.models.length ? ` and its ${props.models.length} model${props.models.length === 1 ? "" : "s"}` : ""}? Students' attempts on it are deleted too. This can't be undone.`}
              confirmLabel="Delete"
              disabled={other.pending}
              onConfirm={() => {
                save.setResult(null);
                other.run(() => deleteQuizAction(courseSlug, quizId), {
                  refresh: false,
                  onSuccess: () =>
                    router.push(isModel ? `${base}/${modelOf.id}` : base),
                });
              }}
            />
          </Card>
        ) : null}
      </aside>
    </form>
  );
}

function ModelsCard({
  courseSlug,
  quizId,
  modelOf,
  family,
  canEdit,
  other,
}: QuizEditorProps & {
  quizId: string;
  other: ReturnType<typeof useAdminAction<unknown>>;
}) {
  const router = useRouter();
  const base = `/admin/courses/${courseSlug}/quizzes`;
  const smallest = family
    ? Math.min(...family.versions.map((v) => v.questions))
    : 0;
  const percent =
    family && smallest > 0 ? Math.round((family.shared / smallest) * 100) : 0;
  return (
    <Card title="Models (versions)">
      <div className="grid gap-3 text-sm">
        {family ? (
          <>
            <ul className="grid gap-1">
              {family.versions.map((v) => (
                <li key={v.id}>
                  {v.id === quizId ? (
                    <span className="font-semibold">
                      {v.label} (this page) · {v.questions} questions
                    </span>
                  ) : (
                    <Link
                      href={`${base}/${v.id}`}
                      className="text-primary-text hover:underline"
                    >
                      {v.label} · {v.questions} questions
                    </Link>
                  )}
                </li>
              ))}
            </ul>
            <p
              className={
                percent < 20 ? "font-medium text-medium" : "text-muted"
              }
            >
              {family.shared} question{family.shared === 1 ? " is" : "s are"} in
              every model ({percent}% of the smallest model, as saved).
              {percent < 20
                ? " The final quiz rule asks for at least 20%."
                : ""}
            </p>
          </>
        ) : (
          <p className="text-muted">
            Only one version. Add a model to give students different versions of
            this quiz at random.
          </p>
        )}
        {!modelOf && canEdit ? (
          <button
            type="button"
            className={buttonClass("secondary", "w-full")}
            disabled={other.pending}
            onClick={() =>
              other.run(() => addQuizModelAction(courseSlug, quizId), {
                refresh: false,
                onSuccess: (v, message) => {
                  const id = (v as { id: string }).id;
                  keepResult(`quiz:${id}`, message);
                  router.push(`${base}/${id}`);
                },
              })
            }
          >
            <Plus aria-hidden="true" className="size-4" /> Add a model
          </button>
        ) : null}
      </div>
    </Card>
  );
}
