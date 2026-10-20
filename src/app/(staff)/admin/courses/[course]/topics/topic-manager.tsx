"use client";

import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, StatusBadge, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { slugify } from "@/lib/slug";
import type { AdminTopic, TopicStatus } from "@/server/admin/topics";
import { deleteTopicAction, reorderTopicsAction, saveTopicAction } from "./actions";

interface Props {
  courseSlug: string;
  topics: AdminTopic[];
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

export function TopicManager({ courseSlug, topics, canEdit, canPublish, canDelete }: Props) {
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const list = useAdminAction();

  const move = (index: number, by: number) => {
    const ids = topics.map((t) => t.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    list.run(() => reorderTopicsAction(courseSlug, ids));
  };

  return (
    <div className="grid gap-4">
      <ResultNotice result={list.result} />
      {canEdit && editing !== "new" ? (
        <div>
          <button type="button" className={buttonClass("primary")} onClick={() => setEditing("new")}>
            <Plus aria-hidden="true" className="size-4" /> Add a topic
          </button>
        </div>
      ) : null}
      {editing === "new" ? <TopicForm courseSlug={courseSlug} topic={null} canPublish={canPublish} onDone={() => setEditing(null)} /> : null}
      {topics.length === 0 ? <p className="text-muted">No topics yet. Add the first one: lectures and questions are filed under topics.</p> : null}
      <ol className="grid gap-3">
        {topics.map((topic, i) =>
          editing === topic.id ? (
            <li key={topic.id}>
              <TopicForm courseSlug={courseSlug} topic={topic} canPublish={canPublish} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={topic.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {topic.title} <StatusBadge status={topic.status} />
                </p>
                <p className="text-sm text-muted">
                  <span className="font-mono">{topic.slug}</span> · {topic.lectures} lecture{topic.lectures === 1 ? "" : "s"} · {topic.questions} question
                  {topic.questions === 1 ? "" : "s"}
                </p>
              </div>
              {canEdit ? (
                <div className="flex flex-wrap items-center gap-1">
                  <button type="button" className={buttonClass("ghost", "px-3")} disabled={i === 0 || list.pending} onClick={() => move(i, -1)} aria-label={`Move ${topic.title} up`}>
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </button>
                  <button
                    type="button"
                    className={buttonClass("ghost", "px-3")}
                    disabled={i === topics.length - 1 || list.pending}
                    onClick={() => move(i, 1)}
                    aria-label={`Move ${topic.title} down`}
                  >
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </button>
                  <button type="button" className={buttonClass("secondary", "px-3")} onClick={() => setEditing(topic.id)}>
                    <Pencil aria-hidden="true" className="size-4" /> Edit
                  </button>
                  {canDelete ? (
                    <ConfirmButton
                      label={
                        <>
                          <Trash2 aria-hidden="true" className="size-4" />
                          <span className="sr-only">Delete {topic.title}</span>
                        </>
                      }
                      className="px-3"
                      question={`Delete “${topic.title}”?`}
                      confirmLabel="Delete topic"
                      disabled={list.pending}
                      onConfirm={() => list.run(() => deleteTopicAction(courseSlug, topic.id))}
                    />
                  ) : null}
                </div>
              ) : null}
            </li>
          ),
        )}
      </ol>
    </div>
  );
}

function TopicForm({ courseSlug, topic, canPublish, onDone }: { courseSlug: string; topic: AdminTopic | null; canPublish: boolean; onDone: () => void }) {
  const [title, setTitle] = useState(topic?.title ?? "");
  const [slug, setSlug] = useState(topic?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(topic !== null);
  const [description, setDescription] = useState(topic?.description ?? "");
  const [status, setStatus] = useState<TopicStatus>(topic?.status ?? "draft");
  const save = useAdminAction<{ id: string }>();
  const prefix = topic ? `topic-${topic.id}` : "topic-new";
  const err = save.fieldError;

  return (
    <Card title={topic ? `Edit “${topic.title}”` : "New topic"}>
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => saveTopicAction(courseSlug, topic?.id ?? null, { title, slug, description, status }), { onSuccess: onDone });
        }}
      >
        <ResultNotice result={save.result && !save.result.ok ? save.result : null} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field id={`${prefix}-title`} label="Title" error={err("title")}>
            <input
              id={`${prefix}-title`}
              value={title}
              required
              maxLength={120}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              aria-describedby={describedBy(`${prefix}-title`, false, !!err("title"))}
              className={inputClass}
            />
          </Field>
          <Field id={`${prefix}-slug`} label="Address (slug)" help={`/topics/${slug || "…"}`} error={err("slug")}>
            <input
              id={`${prefix}-slug`}
              value={slug}
              required
              maxLength={80}
              onChange={(e) => {
                setSlug(e.target.value.toLowerCase());
                setSlugTouched(true);
              }}
              aria-describedby={describedBy(`${prefix}-slug`, true, !!err("slug"))}
              className={`${inputClass} font-mono`}
            />
          </Field>
        </div>
        <Field id={`${prefix}-description`} label="Description" optional help="One or two sentences shown on the topic page." error={err("description")}>
          <textarea
            id={`${prefix}-description`}
            value={description}
            maxLength={400}
            rows={2}
            onChange={(e) => setDescription(e.target.value)}
            aria-describedby={describedBy(`${prefix}-description`, true, !!err("description"))}
            className={inputClass}
          />
        </Field>
        {canPublish ? (
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">Status</legend>
            <div className="flex flex-wrap gap-4">
              {(["draft", "published", "archived"] as const).map((s) => (
                <label key={s} className="inline-flex min-h-11 items-center gap-2 text-sm capitalize">
                  <input type="radio" name={`${prefix}-status`} value={s} checked={status === s} onChange={() => setStatus(s)} className="size-4 accent-[var(--cl-primary)]" />
                  {s}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="text-sm text-muted">New topics start as drafts. A course admin publishes them.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={save.pending} className={buttonClass("primary")}>
            {save.pending ? "Saving…" : topic ? "Save topic" : "Add topic"}
          </button>
          <button type="button" onClick={onDone} className={buttonClass("ghost")}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}
