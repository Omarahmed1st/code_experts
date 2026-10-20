"use client";

import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { deviceName } from "@/lib/auth/device-name";
import { changePasswordAction, endSessionAction, signOutOtherDevicesAction } from "../site-actions";

export function PasswordForm() {
  const [f, setF] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const save = useAdminAction();
  const err = save.fieldError;
  return (
    <form
      className="grid gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => changePasswordAction(f), { onSuccess: () => setF({ currentPassword: "", newPassword: "", confirmPassword: "" }) });
      }}
    >
      <ResultNotice result={save.result} />
      <Field id="currentPassword" label="Current password" error={err("currentPassword")}>
        <input
          id="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          value={f.currentPassword}
          onChange={(e) => setF({ ...f, currentPassword: e.target.value })}
          aria-describedby={describedBy("currentPassword", false, !!err("currentPassword"))}
          className={inputClass}
        />
      </Field>
      <Field id="newPassword" label="New password" help="At least 10 characters. A few words in a row is easy to remember." error={err("newPassword")}>
        <input
          id="newPassword"
          type="password"
          autoComplete="new-password"
          required
          value={f.newPassword}
          onChange={(e) => setF({ ...f, newPassword: e.target.value })}
          aria-describedby={describedBy("newPassword", true, !!err("newPassword"))}
          className={inputClass}
        />
      </Field>
      <Field id="confirmPassword" label="New password again" error={err("confirmPassword")}>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={f.confirmPassword}
          onChange={(e) => setF({ ...f, confirmPassword: e.target.value })}
          aria-describedby={describedBy("confirmPassword", false, !!err("confirmPassword"))}
          className={inputClass}
        />
      </Field>
      <p className="text-sm text-muted">Changing your password signs out your other devices.</p>
      <div>
        <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
          {save.pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

interface SessionItem {
  id: string;
  lastUsed: number;
  createdAt: number;
  ipAddress: string | null;
  userAgent: string | null;
}

export function SessionList({ sessions, currentId }: { sessions: SessionItem[]; currentId: string }) {
  const action = useAdminAction();
  const others = sessions.filter((s) => s.id !== currentId).length;
  return (
    <div className="grid gap-3">
      <ResultNotice result={action.result} />
      <ul className="grid divide-y divide-line">
        {sessions.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {deviceName(s.userAgent)} {s.id === currentId ? <span className="font-normal text-easy">(this device)</span> : null}
              </p>
              <p className="text-muted">
                Signed in {formatAdminTime(s.createdAt)} · last used {formatAdminTime(s.lastUsed)}
                {s.ipAddress ? ` · ${s.ipAddress}` : ""}
              </p>
            </div>
            {s.id !== currentId ? (
              <button type="button" className={buttonClass("ghost", "px-3")} disabled={action.pending} onClick={() => action.run(() => endSessionAction(s.id))}>
                Sign out
              </button>
            ) : null}
          </li>
        ))}
      </ul>
      {others > 0 ? (
        <ConfirmButton
          label="Sign out all other devices"
          tone="normal"
          question={`End ${others} other session${others === 1 ? "" : "s"}?`}
          confirmLabel="Sign them out"
          disabled={action.pending}
          onConfirm={() => action.run(() => signOutOtherDevicesAction())}
        />
      ) : null}
    </div>
  );
}
