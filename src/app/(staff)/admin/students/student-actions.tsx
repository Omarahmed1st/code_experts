"use client";

import { useState } from "react";
import { ConfirmButton, ResultNotice, dangerClass } from "@/components/admin/action-parts";
import { Field, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { TemporaryPassword } from "../users/staff-form";
import { deleteStudentAction, resetStudentPasswordAction, setStudentActiveAction } from "./actions";

/** Reset password, disable or enable, delete: one student's row in the list. */
export function StudentActions({ id, email, active }: { id: string; email: string; active: boolean }) {
  const act = useAdminAction<{ temporaryPassword: string; email: string } | undefined>();
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState("");
  const temp = act.result?.ok && act.result.value ? act.result.value : null;
  return (
    <div className="grid w-full gap-2">
      {temp ? (
        <>
          <TemporaryPassword email={temp.email} password={temp.temporaryPassword} />
          <p className="text-sm text-muted">Check it is really them before you give it (for example, in class or from their university email).</p>
        </>
      ) : (
        <ResultNotice result={act.result} />
      )}
      {deleting ? (
        <form
          className="grid gap-3 rounded-xl border border-hard/40 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            act.run(() => deleteStudentAction(id, confirm));
          }}
        >
          <Field id={`confirm-${id}`} label={`Type ${email} to delete this account and everything saved with it`} error={act.fieldError("confirm")}>
            <input id={`confirm-${id}`} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="off" spellCheck={false} className={inputClass} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={act.pending} className={dangerClass("", true)}>
              Delete the account
            </button>
            <button type="button" className={buttonClass("ghost")} onClick={() => setDeleting(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap gap-2">
          {active ? (
            <ConfirmButton
              label="Give a temporary password"
              tone="normal"
              question="Replace their password and sign them out?"
              confirmLabel="Make one"
              disabled={act.pending}
              onConfirm={() => act.run(() => resetStudentPasswordAction(id))}
            />
          ) : null}
          {active ? (
            <ConfirmButton
              label="Disable"
              question="Disable this account and sign it out?"
              confirmLabel="Disable"
              disabled={act.pending}
              onConfirm={() => act.run(() => setStudentActiveAction(id, false))}
            />
          ) : (
            <button type="button" className={buttonClass("secondary")} disabled={act.pending} onClick={() => act.run(() => setStudentActiveAction(id, true))}>
              Enable
            </button>
          )}
          <button
            type="button"
            className={dangerClass()}
            onClick={() => {
              act.setResult(null);
              setConfirm("");
              setDeleting(true);
            }}
          >
            Delete…
          </button>
        </div>
      )}
    </div>
  );
}
