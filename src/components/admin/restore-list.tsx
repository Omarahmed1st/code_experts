"use client";

import { ConfirmButton, ResultNotice } from "./action-parts";
import { useAdminAction, type ActionResult } from "./use-admin-action";
import { formatAdminTime } from "@/lib/admin/time";

export function RestoreList({
  revisions,
  canRestore,
  restore,
  empty,
}: {
  revisions: { revisionNo: number; createdAt: number; authorName: string | null }[];
  canRestore: boolean;
  restore: (revisionNo: number) => Promise<ActionResult>;
  empty: string;
}) {
  const action = useAdminAction();
  if (revisions.length === 0) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <div className="grid gap-3">
      <ResultNotice result={action.result} />
      <ol className="divide-y divide-line">
        {revisions.map((r, i) => (
          <li key={r.revisionNo} className="flex flex-wrap items-center gap-3 py-3">
            <span className="font-mono text-sm font-semibold">v{r.revisionNo}</span>
            <span className="text-sm">
              {formatAdminTime(r.createdAt)}
              {r.authorName ? ` · ${r.authorName}` : ""}
              {i === 0 ? <span className="ml-2 text-muted">(current)</span> : null}
            </span>
            {canRestore && i > 0 ? (
              <span className="ml-auto">
                <ConfirmButton
                  label="Restore"
                  tone="normal"
                  question={`Restore version ${r.revisionNo}?`}
                  confirmLabel="Restore"
                  disabled={action.pending}
                  onConfirm={() => action.run(() => restore(r.revisionNo))}
                />
              </span>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}
