"use client";

import { Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { StatusBadge } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { ASK_LABEL } from "@/lib/exercise/ask";
import type { AdminExerciseRow } from "@/server/admin/exercises";
import { setExerciseStatusAction } from "./actions";

const TYPE_LABEL: Record<AdminExerciseRow["type"], string> = {
  mcq: "Multiple choice",
  trace: "Trace the code",
  correct_code: "Fix the code",
  write_code: "Write the code",
};

interface Props {
  courseSlug: string;
  rows: AdminExerciseRow[];
  canEdit: boolean;
  canPublish: boolean;
}

export function QuestionTable({ courseSlug, rows, canEdit, canPublish }: Props) {
  const action = useAdminAction();
  const base = `/admin/courses/${courseSlug}/questions`;
  if (rows.length === 0) return null;
  return (
    <div className="grid gap-3">
      <ResultNotice result={action.result} />
      <ul className="grid gap-2">
        {rows.map((q) => (
          <li key={q.id} className="grid gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <Link href={`${base}/${q.id}`} className="hover:underline">
                  {q.title}
                </Link>
                <StatusBadge status={q.status} />
                {q.reserved ? <StatusBadge status="scheduled" label="final quiz only" /> : null}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {q.ask ? ASK_LABEL[q.ask as keyof typeof ASK_LABEL] : TYPE_LABEL[q.type]} · <span className="capitalize">{q.difficulty}</span> · {q.topicTitle ?? "no topic"}
                {q.lessonTitle ? ` · ${q.lessonTitle}` : ""}
                {q.quizzes > 0 ? ` · in ${q.quizzes} quiz${q.quizzes === 1 ? "" : "zes"}` : ""} · edited {formatAdminTime(q.updatedAt)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-1">
              <Link href={`${base}/${q.id}/preview`} className={buttonClass("ghost", "px-3")} aria-label={`Preview ${q.title}`}>
                <Eye aria-hidden="true" className="size-4" />
              </Link>
              <Link href={`${base}/${q.id}`} className={buttonClass("secondary", "px-3")}>
                <Pencil aria-hidden="true" className="size-4" /> {canEdit ? "Edit" : "Open"}
              </Link>
              {canPublish && q.status !== "published" ? (
                <button
                  type="button"
                  className={buttonClass("primary", "px-3")}
                  disabled={action.pending}
                  onClick={() => action.run(() => setExerciseStatusAction(courseSlug, q.id, "published"))}
                >
                  Publish
                </button>
              ) : null}
              {canPublish && q.status === "published" ? (
                <ConfirmButton
                  label="Unpublish"
                  tone="normal"
                  className="px-3"
                  question="Hide it from students?"
                  confirmLabel="Unpublish"
                  disabled={action.pending}
                  onConfirm={() => action.run(() => setExerciseStatusAction(courseSlug, q.id, "draft"))}
                />
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
