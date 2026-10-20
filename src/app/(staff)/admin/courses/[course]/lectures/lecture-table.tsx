"use client";

import { ArrowDown, ArrowUp, Eye, Pencil } from "lucide-react";
import Link from "next/link";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { StatusBadge } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import type { AdminLessonRow } from "@/server/admin/lessons";
import { deleteLessonAction, reorderLessonsAction, setLessonStatusAction } from "./actions";

interface Props {
  courseSlug: string;
  lessons: AdminLessonRow[];
  now: number;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

export function LectureTable({ courseSlug, lessons, now, canEdit, canPublish, canDelete }: Props) {
  const action = useAdminAction();
  const base = `/admin/courses/${courseSlug}/lectures`;

  const move = (index: number, by: number) => {
    const ids = lessons.map((l) => l.id);
    const [moved] = ids.splice(index, 1);
    ids.splice(index + by, 0, moved!);
    action.run(() => reorderLessonsAction(courseSlug, ids));
  };

  if (lessons.length === 0) return <p className="text-muted">No lectures yet.</p>;
  return (
    <div className="grid gap-3">
      <ResultNotice result={action.result} />
      <ol className="grid gap-3">
        {lessons.map((lesson, i) => {
          const live = lesson.status === "published" || (lesson.status === "scheduled" && (lesson.publishAt ?? Infinity) <= now);
          const statusLabel = lesson.status === "scheduled" ? (live ? "live" : `scheduled · ${formatAdminTime(lesson.publishAt!)}`) : lesson.status;
          return (
            <li key={lesson.id} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-center">
              <span className="font-mono text-sm text-muted">{lesson.lectureNumber != null ? `L${String(lesson.lectureNumber).padStart(2, "0")}` : "—"}</span>
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Link href={`${base}/${lesson.id}`} className="hover:underline">
                    {lesson.title}
                  </Link>
                  <StatusBadge status={live ? "live" : lesson.status} label={statusLabel} />
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {lesson.topicTitle} · {lesson.sections} section{lesson.sections === 1 ? "" : "s"} · edited {formatAdminTime(lesson.updatedAt)}
                  {lesson.updatedBy ? ` by ${lesson.updatedBy}` : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-1">
                {canEdit ? (
                  <>
                    <button type="button" className={buttonClass("ghost", "px-3")} disabled={i === 0 || action.pending} onClick={() => move(i, -1)} aria-label={`Move ${lesson.title} up`}>
                      <ArrowUp aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      className={buttonClass("ghost", "px-3")}
                      disabled={i === lessons.length - 1 || action.pending}
                      onClick={() => move(i, 1)}
                      aria-label={`Move ${lesson.title} down`}
                    >
                      <ArrowDown aria-hidden="true" className="size-4" />
                    </button>
                  </>
                ) : null}
                <Link href={`${base}/${lesson.id}/preview`} className={buttonClass("ghost", "px-3")} aria-label={`Preview ${lesson.title}`}>
                  <Eye aria-hidden="true" className="size-4" />
                </Link>
                <Link href={`${base}/${lesson.id}`} className={buttonClass("secondary", "px-3")}>
                  <Pencil aria-hidden="true" className="size-4" /> {canEdit ? "Edit" : "Open"}
                </Link>
                {canPublish && lesson.status !== "published" && !live ? (
                  <button type="button" className={buttonClass("primary", "px-3")} disabled={action.pending} onClick={() => action.run(() => setLessonStatusAction(courseSlug, lesson.id, "published", null))}>
                    Publish
                  </button>
                ) : null}
                {canPublish && live ? (
                  <ConfirmButton
                    label="Unpublish"
                    tone="normal"
                    className="px-3"
                    question="Hide it from students?"
                    confirmLabel="Unpublish"
                    disabled={action.pending}
                    onConfirm={() => action.run(() => setLessonStatusAction(courseSlug, lesson.id, "draft", null))}
                  />
                ) : null}
                {canDelete ? (
                  <ConfirmButton
                    label="Delete"
                    className="px-3"
                    question={`Delete “${lesson.title}” and its pictures? This can't be undone.`}
                    confirmLabel="Delete lecture"
                    disabled={action.pending}
                    onConfirm={() => action.run(() => deleteLessonAction(courseSlug, lesson.id))}
                  />
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
