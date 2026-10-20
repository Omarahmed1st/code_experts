"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { slugify } from "@/lib/slug";
import { createCourseAction } from "../../site-actions";

export function NewCourseForm() {
  const router = useRouter();
  const [f, setF] = useState({ title: "", shortTitle: "", slug: "", description: "", primaryLanguage: "python" as "cpp" | "python", tags: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const save = useAdminAction<{ slug: string }>();
  const err = save.fieldError;
  const set = <K extends keyof typeof f>(key: K, value: (typeof f)[K]) => setF((x) => ({ ...x, [key]: value }));
  return (
    <form
      className="grid max-w-3xl gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => createCourseAction(f), { refresh: false, onSuccess: (v) => router.push(`/admin/courses/${v.slug}`) });
      }}
    >
      <ResultNotice result={save.result && !save.result.ok ? save.result : null} />
      <Card>
        <div className="grid gap-4">
          <Field id="title" label="Title" error={err("title")}>
            <input
              id="title"
              value={f.title}
              required
              maxLength={120}
              onChange={(e) => {
                set("title", e.target.value);
                if (!slugTouched) set("slug", slugify(e.target.value));
              }}
              aria-describedby={describedBy("title", false, !!err("title"))}
              className={inputClass}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="shortTitle" label="Short name" help="For menus, like “Python”." error={err("shortTitle")}>
              <input id="shortTitle" value={f.shortTitle} required maxLength={40} onChange={(e) => set("shortTitle", e.target.value)} aria-describedby={describedBy("shortTitle", true, !!err("shortTitle"))} className={inputClass} />
            </Field>
            <Field id="slug" label="Address (slug)" help={`/courses/${f.slug || "…"}`} error={err("slug")}>
              <input
                id="slug"
                value={f.slug}
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
          <Field id="description" label="Description" help="20 to 600 characters, shown on the course page." error={err("description")}>
            <textarea id="description" rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} aria-describedby={describedBy("description", true, !!err("description"))} className={inputClass} />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="primaryLanguage" label="Main programming language">
              <select id="primaryLanguage" value={f.primaryLanguage} onChange={(e) => set("primaryLanguage", e.target.value === "cpp" ? "cpp" : "python")} className={inputClass}>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
              </select>
            </Field>
            <Field id="tags" label="Tags" optional help="Separated by commas.">
              <input id="tags" value={f.tags} onChange={(e) => set("tags", e.target.value)} className={inputClass} />
            </Field>
          </div>
          <div>
            <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
              {save.pending ? "Creating…" : "Create course"}
            </button>
          </div>
        </div>
      </Card>
    </form>
  );
}
