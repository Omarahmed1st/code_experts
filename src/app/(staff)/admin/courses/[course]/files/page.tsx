import { FileText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { can } from "@/lib/auth/permissions";
import { formatBytes } from "@/lib/format";
import { listAdminResources } from "@/server/admin/resources";
import { requireCourse } from "@/server/auth/staff";
import { KIND_LABEL } from "./kinds";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Files" };

export default async function FilesPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const resources = await listAdminResources(course);
  const base = `/admin/courses/${course.slug}/files`;
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Files"
        title="Files"
        description="Slides, PDFs, handouts and other files for this course. Each can have a preview PDF that opens in the browser, and can be attached to lectures."
        actions={
          can(staff, "edit", course.id) ? (
            <Link href={`${base}/new`} className={buttonClass("primary")}>
              <Plus aria-hidden="true" className="size-4" /> New file
            </Link>
          ) : null
        }
      />
      {resources.length === 0 ? <p className="text-muted">No files yet.</p> : null}
      <ul className="grid gap-3">
        {resources.map((r) => {
          const original = r.files.find((f) => f.role === "original");
          const preview = r.files.find((f) => f.role === "preview");
          return (
            <li key={r.id} className="flex flex-wrap items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <FileText aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary-text" />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  <Link href={`${base}/${r.id}`} className="hover:underline">
                    {r.title}
                  </Link>
                  <StatusBadge status={r.status} />
                  {r.access === "staff" ? <StatusBadge status="archived" label="staff only" /> : null}
                </p>
                <p className="mt-0.5 text-sm text-muted">
                  {KIND_LABEL[r.kind]} · {original ? `${original.filename} (${formatBytes(original.sizeBytes)})` : "no file uploaded"}
                  {preview ? " · has a preview" : ""}
                  {r.lectures.length ? ` · in ${r.lectures.length} lecture${r.lectures.length === 1 ? "" : "s"}` : ""} · edited {formatAdminTime(r.updatedAt)}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
