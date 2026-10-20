"use client";

import Link from "next/link";
import { useState } from "react";
import { ResultNotice } from "@/components/admin/action-parts";
import { Card, Notice } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatBytes } from "@/lib/format";
import type { ExerciseInput, ImportReport } from "@/server/admin/exercises";
import { importExercisesAction } from "../actions";

const MAX_FILE = 5 * 1024 * 1024;
const MAX_ITEMS = 300;

type Item = { name: string; input: ExerciseInput };

/** Reads the chosen files in the browser into one item per question. */
async function readFiles(files: File[]): Promise<{ items: Item[]; problems: string[] }> {
  const items: Item[] = [];
  const problems: string[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE) {
      problems.push(`${file.name}: larger than ${formatBytes(MAX_FILE)}.`);
      continue;
    }
    const text = await file.text();
    if (/\.json$/i.test(file.name)) {
      try {
        const data: unknown = JSON.parse(text);
        const list = Array.isArray(data) ? data : data && typeof data === "object" && Array.isArray((data as { questions?: unknown }).questions) ? (data as { questions: unknown[] }).questions : null;
        if (!list) {
          problems.push(`${file.name}: no "questions" list in this JSON file.`);
          continue;
        }
        list.forEach((q, i) => {
          const slug = q && typeof q === "object" && typeof (q as { slug?: unknown }).slug === "string" ? (q as { slug: string }).slug : `#${i + 1}`;
          items.push({ name: `${file.name} · ${slug}`, input: { source: q } });
        });
      } catch {
        problems.push(`${file.name}: not valid JSON.`);
      }
    } else if (/\.(md|markdown)$/i.test(file.name)) {
      items.push({ name: file.name, input: { markdown: text } });
    } else {
      problems.push(`${file.name}: choose .json or .md files.`);
    }
  }
  return { items, problems };
}

export function ImportForm({ courseSlug, canPublish }: { courseSlug: string; canPublish: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [problems, setProblems] = useState<string[]>([]);
  const action = useAdminAction<ImportReport>();
  const report = action.result?.ok ? action.result.value : null;

  const submit = async () => {
    const { items, problems: found } = await readFiles(files);
    setProblems(found);
    if (items.length === 0) return;
    if (items.length > MAX_ITEMS) {
      setProblems([...found, `That is ${items.length} questions; import at most ${MAX_ITEMS} at a time.`]);
      return;
    }
    action.run(() => importExercisesAction(courseSlug, items), { refresh: false });
  };

  return (
    <div className="grid gap-6">
      <Card title="Choose files">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            Question files (.json or .md)
            <input
              type="file"
              multiple
              accept=".json,.md,.markdown,application/json,text/markdown"
              onChange={(e) => setFiles([...(e.target.files ?? [])])}
              className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-xl file:border-0 file:bg-surface-2 file:px-4 file:font-semibold"
            />
          </label>
          {!canPublish ? <p className="text-sm text-muted">Imported questions are saved as drafts; a course admin publishes them.</p> : null}
          <div>
            <button type="submit" className={buttonClass("primary")} disabled={files.length === 0 || action.pending}>
              {action.pending ? "Checking and importing…" : `Import ${files.length || ""} file${files.length === 1 ? "" : "s"}`}
            </button>
          </div>
        </form>
      </Card>
      {problems.length > 0 ? (
        <Notice tone="error">
          <ul className="grid gap-1">
            {problems.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </Notice>
      ) : null}
      <ResultNotice result={action.result} />
      {report ? (
        <Card title="Import report">
          <div className="grid gap-4 text-sm">
            {report.created.length > 0 ? (
              <div>
                <p className="font-semibold">Added ({report.created.length})</p>
                <p className="mt-1 font-mono text-muted">{report.created.join(", ")}</p>
              </div>
            ) : null}
            {report.updated.length > 0 ? (
              <div>
                <p className="font-semibold">Updated ({report.updated.length})</p>
                <p className="mt-1 font-mono text-muted">{report.updated.join(", ")}</p>
              </div>
            ) : null}
            {report.failed.length > 0 ? (
              <div>
                <p className="font-semibold text-hard">Not imported ({report.failed.length})</p>
                <ul className="mt-1 grid gap-1">
                  {report.failed.map((f) => (
                    <li key={f.name}>
                      <span className="font-mono">{f.name}</span>: {f.error}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <Link href={`/admin/courses/${courseSlug}/questions`} className="font-semibold text-primary-text hover:underline">
              Back to the questions
            </Link>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
