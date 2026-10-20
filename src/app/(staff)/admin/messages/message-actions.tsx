"use client";

import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { deleteMessageAction, setMessageStatusAction } from "../site/actions";

export function MessageActions({ id, status }: { id: string; status: "new" | "read" | "archived" }) {
  const act = useAdminAction();
  return (
    <div className="grid gap-2">
      <ResultNotice result={act.result && !act.result.ok ? act.result : null} />
      <div className="flex flex-wrap gap-2">
        {status === "new" ? (
          <button type="button" className={buttonClass("secondary")} disabled={act.pending} onClick={() => act.run(() => setMessageStatusAction(id, "read"))}>
            Mark as read
          </button>
        ) : null}
        {status !== "archived" ? (
          <button type="button" className={buttonClass("secondary")} disabled={act.pending} onClick={() => act.run(() => setMessageStatusAction(id, "archived"))}>
            Archive
          </button>
        ) : (
          <button type="button" className={buttonClass("secondary")} disabled={act.pending} onClick={() => act.run(() => setMessageStatusAction(id, "read"))}>
            Move back to inbox
          </button>
        )}
        <ConfirmButton label="Delete" confirmLabel="Delete for good" question="Delete this message?" disabled={act.pending} onConfirm={() => act.run(() => deleteMessageAction(id))} />
      </div>
    </div>
  );
}
