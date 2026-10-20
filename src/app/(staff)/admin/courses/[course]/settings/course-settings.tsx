"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, Notice, StatusBadge, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import type { CourseStatus } from "@/server/admin/courses";
import { deleteCourseAction, setCourseStatusAction, updateCourseAction } from "./actions";

interface Props {
  course: { slug: string; title: string; shortTitle: string; description: string; primaryLanguage: "cpp" | "python"; tags: string[]; status: CourseStatus };
  seo: { title: string | null; description: string | null; noindex: boolean };
  isAdmin: boolean;
}

export function CourseSettings({ course, seo, isAdmin }: Props) {
  const router = useRouter();
  const [f, setF] = useState({
    title: course.title,
    shortTitle: course.shortTitle,
    slug: course.slug,
    description: course.description,
    primaryLanguage: course.primaryLanguage,
    tags: course.tags.join(", "),
    seoTitle: seo.title ?? "",
    seoDescription: seo.description ?? "",
    noindex: seo.noindex,
  });
  const save = useAdminAction<{ slug: string }>("course-settings");
  const status = useAdminAction("course-status");
  const removal = useAdminAction();
  const [confirmSlug, setConfirmSlug] = useState("");
  const err = save.fieldError;
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((x) => ({ ...x, [key]: value }));
  const renaming = f.slug !== course.slug;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
      <form
        className="grid gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          status.setResult(null);
          save.run(() => updateCourseAction(course.slug, f), {
            refresh: !renaming,
            keep: true,
            onSuccess: (v) => {
              if (v.slug !== course.slug) router.replace(`/admin/courses/${v.slug}/settings`);
            },
          });
        }}
      >
        <ResultNotice result={save.result} />
        <Card title="Course">
          <div className="grid gap-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="title" label="Title" error={err("title")}>
                <input id="title" value={f.title} required maxLength={120} onChange={(e) => set("title", e.target.value)} aria-describedby={describedBy("title", false, !!err("title"))} className={inputClass} />
              </Field>
              <Field id="shortTitle" label="Short name" help="Used in menus and page titles." error={err("shortTitle")}>
                <input id="shortTitle" value={f.shortTitle} required maxLength={40} onChange={(e) => set("shortTitle", e.target.value)} aria-describedby={describedBy("shortTitle", true, !!err("shortTitle"))} className={inputClass} />
              </Field>
            </div>
            <Field
              id="slug"
              label="Address (slug)"
              help={isAdmin ? `/courses/${f.slug || "…"}${renaming ? ". Changing it breaks old links and bookmarks to this course." : ""}` : "Only an administrator can change the address."}
              error={err("slug")}
            >
              <input
                id="slug"
                value={f.slug}
                readOnly={!isAdmin}
                required
                maxLength={80}
                onChange={(e) => set("slug", e.target.value.toLowerCase())}
                aria-describedby={describedBy("slug", true, !!err("slug"))}
                className={`${inputClass} font-mono`}
              />
            </Field>
            <Field id="description" label="Description" help="20 to 600 characters. Shown on the course page and in search results." error={err("description")}>
              <textarea id="description" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} aria-describedby={describedBy("description", true, !!err("description"))} className={inputClass} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field id="primaryLanguage" label="Main programming language" help="New questions and examples start in this language.">
                <select id="primaryLanguage" value={f.primaryLanguage} onChange={(e) => set("primaryLanguage", e.target.value === "cpp" ? "cpp" : "python")} className={inputClass}>
                  <option value="cpp">C++</option>
                  <option value="python">Python</option>
                </select>
              </Field>
              <Field id="tags" label="Tags" optional help="Separated by commas." error={err("tags")}>
                <input id="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
              </Field>
            </div>
          </div>
        </Card>
        <Card title="Search engines">
          <div className="grid gap-4">
            <Field id="seoTitle" label="Search title" optional help={`Empty: “${f.title}”. Under 70 characters.`} error={err("seoTitle")}>
              <input id="seoTitle" value={f.seoTitle} maxLength={120} onChange={(e) => set("seoTitle", e.target.value)} className={inputClass} />
            </Field>
            <Field id="seoDescription" label="Search description" optional help="Empty: the course description. Under 170 characters." error={err("seoDescription")}>
              <textarea id="seoDescription" rows={2} value={f.seoDescription} maxLength={300} onChange={(e) => set("seoDescription", e.target.value)} className={inputClass} />
            </Field>
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input type="checkbox" checked={f.noindex} onChange={(e) => set("noindex", e.target.checked)} className="size-4 accent-[var(--cl-primary)]" />
              Ask search engines not to list the course page
            </label>
          </div>
        </Card>
        <div>
          <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
            {save.pending ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      <aside className="grid gap-6">
        <Card title="Who can see the course">
          <div className="grid gap-3 text-sm">
            <p>
              Now: <StatusBadge status={course.status} />
            </p>
            <ResultNotice result={status.result} />
            {isAdmin ? (
              <div className="grid gap-2">
                {course.status !== "published" ? (
                  <button type="button" className={buttonClass("primary")} disabled={status.pending} onClick={() => status.run(() => setCourseStatusAction(course.slug, "published"), { keep: true })}>
                    Publish the course
                  </button>
                ) : null}
                {course.status !== "draft" ? (
                  <ConfirmButton
                    label="Move back to draft"
                    tone="normal"
                    question="Students won't see the course while it is a draft."
                    confirmLabel="Move to draft"
                    disabled={status.pending}
                    onConfirm={() => status.run(() => setCourseStatusAction(course.slug, "draft"), { keep: true })}
                  />
                ) : null}
                {course.status !== "archived" ? (
                  <ConfirmButton
                    label="Archive"
                    tone="normal"
                    question="Archive it? Students lose access; staff keep everything, and it can be published again."
                    confirmLabel="Archive"
                    disabled={status.pending}
                    onConfirm={() => status.run(() => setCourseStatusAction(course.slug, "archived"), { keep: true })}
                  />
                ) : null}
              </div>
            ) : (
              <p className="text-muted">Only an administrator publishes or archives a course.</p>
            )}
          </div>
        </Card>
        {isAdmin ? (
          <Card title="Delete the course">
            <div className="grid gap-3 text-sm">
              {course.status !== "archived" ? (
                <p className="text-muted">Archive the course first. Archiving can be undone; deleting can't.</p>
              ) : (
                <>
                  <Notice tone="error">Deleting removes every lecture, question, quiz, practice exam, file and student attempt in this course. It can't be undone.</Notice>
                  <Field id="confirm" label={`Type ${course.slug} to confirm`} error={removal.fieldError("confirm")}>
                    <input id="confirm" value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} autoComplete="off" className={`${inputClass} font-mono`} />
                  </Field>
                  <ResultNotice result={removal.result && !removal.result.ok ? removal.result : null} />
                  <ConfirmButton
                    label="Delete the course forever"
                    question="Last check: delete everything in this course?"
                    confirmLabel="Delete forever"
                    disabled={removal.pending || confirmSlug.trim() !== course.slug}
                    onConfirm={() => removal.run(() => deleteCourseAction(course.slug, confirmSlug), { refresh: false, onSuccess: () => router.push("/admin/courses") })}
                  />
                </>
              )}
            </div>
          </Card>
        ) : null}
      </aside>
    </div>
  );
}
