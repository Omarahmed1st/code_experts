"use client";

import { Download, Eye, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { StatusPicker } from "@/components/admin/status-picker";
import { UploadProgress, uploadFile } from "@/components/admin/upload";
import { type ActionResult, keepResult, useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { formatBytes } from "@/lib/format";
import { slugify } from "@/lib/slug";
import type { AdminResource, AdminResourceFile, FileRole, ResourceKind, ResourceStatus } from "@/server/admin/resources";
import { deleteResourceAction, removeResourceFileAction, saveResourceAction } from "./actions";
import { KIND_LABEL, acceptAttr, acceptedText } from "./kinds";

interface Details {
  title: string;
  slug: string;
  descriptionMd: string;
  kind: ResourceKind;
  access: "public" | "staff";
  downloadable: boolean;
  status: ResourceStatus;
  topicId: string | null;
}

export interface ResourceEditorProps {
  courseSlug: string;
  resource: AdminResource | null;
  topics: { id: string; title: string }[];
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
}

export function ResourceEditor({ courseSlug, resource, topics, canEdit, canPublish, canDelete }: ResourceEditorProps) {
  const router = useRouter();
  const [d, setD] = useState<Details>(() => ({
    title: resource?.title ?? "",
    slug: resource?.slug ?? "",
    descriptionMd: resource?.descriptionMd ?? "",
    kind: resource?.kind ?? "presentation",
    access: resource?.access === "staff" ? "staff" : "public",
    downloadable: resource?.downloadable ?? true,
    status: resource?.status ?? "draft",
    topicId: resource?.topicId ?? null,
  }));
  const [slugTouched, setSlugTouched] = useState(resource !== null);
  const [dirty, setDirty] = useState(false);
  const save = useAdminAction<{ id: string }>(`resource:${resource?.id ?? null}`);
  const remove = useAdminAction();
  const err = save.fieldError;
  const base = `/admin/courses/${courseSlug}/files`;
  const set = <K extends keyof Details>(key: K, value: Details[K]) => {
    setD((x) => ({ ...x, [key]: value }));
    setDirty(true);
  };

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const hasOriginal = resource?.files.some((f) => f.role === "original") ?? false;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <div className="grid gap-6">
        <ResultNotice result={remove.result ?? save.result} />
        {resource ? (
          <Card title="The file">
            <div className="grid gap-6 md:grid-cols-2">
              <FileSlot
                courseSlug={courseSlug}
                resourceId={resource.id}
                role="original"
                title={KIND_LABEL[resource.kind]}
                accepted={acceptedText(resource.kind)}
                accept={acceptAttr(resource.kind)}
                file={resource.files.find((f) => f.role === "original") ?? null}
                canEdit={canEdit}
              />
              <FileSlot
                courseSlug={courseSlug}
                resourceId={resource.id}
                role="preview"
                title="Preview PDF"
                accepted={`${acceptedText("preview")}. Opens in the browser, so students can read slides without PowerPoint.`}
                accept={acceptAttr("preview")}
                file={resource.files.find((f) => f.role === "preview") ?? null}
                canEdit={canEdit}
              />
            </div>
          </Card>
        ) : null}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            remove.setResult(null);
            save.run(() => saveResourceAction(courseSlug, resource?.id ?? null, { ...d }), {
              refresh: resource !== null,
              onSuccess: (v, message) => {
                setDirty(false);
                if (!resource) {
                  keepResult(`resource:${v.id}`, message);
                  router.replace(`${base}/${v.id}`);
                }
              },
            });
          }}
        >
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
                  <Field id="slug" label="Address (slug)" help={`/courses/${courseSlug}/resources/${d.slug || "…"}`} error={err("slug")}>
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
                <Field id="descriptionMd" label="Description" optional help="Markdown works." error={err("descriptionMd")}>
                  <textarea id="descriptionMd" rows={3} value={d.descriptionMd} onChange={(e) => set("descriptionMd", e.target.value)} className={inputClass} />
                </Field>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field id="kind" label="Kind" help={`Accepts ${acceptedText(d.kind)}.`} error={err("kind")}>
                    <select id="kind" value={d.kind} onChange={(e) => set("kind", e.target.value as ResourceKind)} className={inputClass}>
                      {(Object.keys(KIND_LABEL) as ResourceKind[]).map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABEL[k]}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="topicId" label="Topic" optional error={err("topicId")}>
                    <select id="topicId" value={d.topicId ?? ""} onChange={(e) => set("topicId", e.target.value || null)} className={inputClass}>
                      <option value="">No topic</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <fieldset className="grid gap-1">
                  <legend className="mb-1 text-sm font-semibold">Who can open it</legend>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="access" checked={d.access === "public"} onChange={() => set("access", "public")} className="size-4 accent-[var(--cl-primary)]" />
                    Everyone (once published)
                  </label>
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="radio" name="access" checked={d.access === "staff"} onChange={() => set("access", "staff")} className="size-4 accent-[var(--cl-primary)]" />
                    Staff only
                  </label>
                  <p className="text-xs text-muted">Files for signed-in students only come with student accounts.</p>
                </fieldset>
                <label className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" checked={d.downloadable} onChange={(e) => set("downloadable", e.target.checked)} className="size-4 accent-[var(--cl-primary)]" />
                  Students can download the original file (otherwise only the preview is shown)
                </label>
              </div>
            </Card>
            <Card title="Publishing">
              <div className="grid gap-4">
                {canPublish ? (
                  <StatusPicker name="status" options={["draft", "published", "archived"] as const} status={d.status} error={err("status")} onChange={(status) => set("status", status)} />
                ) : (
                  <p className="text-sm text-muted">
                    Status: <strong className="capitalize">{d.status}</strong>. Editors save changes; a course admin publishes.
                  </p>
                )}
                {canPublish && !hasOriginal && d.status === "published" ? <p className="text-sm text-medium">Upload the file before publishing.</p> : null}
                {canEdit ? (
                  <div>
                    <button type="submit" disabled={save.pending} className={buttonClass("primary")}>
                      {save.pending ? "Saving…" : resource ? "Save details" : "Create, then upload"}
                    </button>
                  </div>
                ) : null}
                {dirty ? <p className="text-sm font-medium text-medium">You have unsaved changes.</p> : null}
              </div>
            </Card>
          </fieldset>
        </form>
      </div>

      {resource ? (
        <aside className="grid gap-6 xl:sticky xl:top-24">
          <Card title="Used in lectures">
            {resource.lectures.length ? (
              <ul className="grid gap-1 text-sm">
                {resource.lectures.map((l) => (
                  <li key={l.id}>
                    <Link href={`/admin/courses/${courseSlug}/lectures/${l.id}`} className="text-primary-text hover:underline">
                      {l.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">Not attached to a lecture yet. Attach it from the lecture editor.</p>
            )}
          </Card>
          {resource.status === "published" && resource.access === "public" ? (
            <Card title="Live page">
              <a href={`/courses/${courseSlug}/resources/${resource.slug}`} className="text-sm font-semibold text-primary-text hover:underline">
                Open the public page
              </a>
            </Card>
          ) : null}
          {canDelete ? (
            <Card title="Delete">
              <ConfirmButton
                label="Delete file"
                className="w-full"
                question={`Delete “${resource.title}” and its uploaded files${resource.lectures.length ? `? It is removed from ${resource.lectures.length} lecture${resource.lectures.length === 1 ? "" : "s"}` : ""}. This can't be undone.`}
                confirmLabel="Delete"
                disabled={remove.pending}
                onConfirm={() => {
                  save.setResult(null);
                  remove.run(() => deleteResourceAction(courseSlug, resource.id), { refresh: false, onSuccess: () => router.push(base) });
                }}
              />
            </Card>
          ) : null}
        </aside>
      ) : null}
    </div>
  );
}

function FileSlot({
  courseSlug,
  resourceId,
  role,
  title,
  accepted,
  accept,
  file,
  canEdit,
}: {
  courseSlug: string;
  resourceId: string;
  role: FileRole;
  title: string;
  accepted: string;
  accept: string;
  file: AdminResourceFile | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [result, setResult] = useState<ActionResult<AdminResourceFile> | null>(null);
  const removal = useAdminAction();
  const base = `/admin/courses/${courseSlug}/files/${resourceId}`;
  const id = `file-${role}`;

  const send = async (chosen: File) => {
    setResult(null);
    removal.setResult(null);
    setProgress(0);
    const res = await uploadFile<AdminResourceFile>(`${base}/upload/${role}`, chosen, setProgress);
    setProgress(null);
    setResult(res);
    if (input.current) input.current.value = "";
    if (res.ok) router.refresh();
  };

  return (
    <div className="grid content-start gap-3">
      <p className="font-semibold">{title}</p>
      {file ? (
        <div className="rounded-xl border border-line bg-surface-2 p-3 text-sm">
          <p className="font-semibold break-all">{file.filename}</p>
          <p className="text-muted">
            {formatBytes(file.sizeBytes)} · uploaded {formatAdminTime(file.createdAt)}
          </p>
          <a href={`${base}/download/${role}`} className="mt-2 inline-flex min-h-11 items-center gap-1.5 font-semibold text-primary-text hover:underline" target={role === "preview" ? "_blank" : undefined} rel="noreferrer">
            {role === "preview" ? <Eye aria-hidden="true" className="size-4" /> : <Download aria-hidden="true" className="size-4" />}
            {role === "preview" ? "Open the preview" : "Download"}
          </a>
        </div>
      ) : (
        <p className="text-sm text-muted">Nothing uploaded yet.</p>
      )}
      {canEdit ? (
        <>
          <label htmlFor={id} className="text-sm font-semibold">
            {file ? "Replace with another file" : "Upload a file"}
          </label>
          <input
            ref={input}
            id={id}
            type="file"
            accept={accept}
            disabled={progress !== null}
            aria-describedby={`${id}-help`}
            onChange={(e) => {
              const chosen = e.target.files?.[0];
              if (chosen) void send(chosen);
            }}
            className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:font-semibold"
          />
          <p id={`${id}-help`} className="text-xs text-muted">
            <Upload aria-hidden="true" className="mr-1 inline size-3.5" />
            {accepted.replace(/\.$/, "")}. The type is checked from the file itself.
          </p>
          {progress !== null ? <UploadProgress fraction={progress} label={progress < 1 ? "Uploading" : "Checking the file"} /> : null}
          <ResultNotice result={result ?? removal.result} />
          {file ? (
            <ConfirmButton
              label={role === "preview" ? "Remove the preview" : "Remove the file"}
              question="Remove this uploaded file?"
              confirmLabel="Remove"
              disabled={removal.pending || progress !== null}
              onConfirm={() => {
                setResult(null);
                removal.run(() => removeResourceFileAction(courseSlug, resourceId, role));
              }}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
