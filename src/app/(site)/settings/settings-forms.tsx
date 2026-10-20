"use client";

import { Download, KeyRound, LogOut, Save, Trash2 } from "lucide-react";
import { useActionState, useEffect, useRef } from "react";
import { refreshMe } from "@/components/account/me";
import { PasswordInput } from "@/components/account/password-input";
import { RecoveryCodePanel } from "@/components/account/recovery-code-panel";
import { Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { buttonClass } from "@/components/ui/button-styles";
import { deviceName } from "@/lib/auth/device-name";
import {
  type SettingsState,
  changePasswordAction,
  deleteAccountAction,
  endOtherSessionsAction,
  endSessionAction,
  newRecoveryCodeAction,
  saveNameAction,
} from "./actions";

const START: SettingsState = { error: null, message: null, fieldErrors: {} };

function Result({ state }: { state: SettingsState }) {
  if (state.error) return <Notice tone="error">{state.error}</Notice>;
  if (state.message) return <Notice tone="success">{state.message}</Notice>;
  return null;
}

export function NameForm({ name, email }: { name: string; email: string }) {
  const [state, action, pending] = useActionState(saveNameAction, START);
  const e = state.fieldErrors;
  // The header shows the name too: ask again once a new one is saved.
  useEffect(() => {
    if (state.message) void refreshMe();
  }, [state]);
  return (
    <form action={action} className="grid gap-4">
      <Result state={state} />
      <Field id="name" label="Your name" help="Shown only to you." error={e.name}>
        <input
          id="name"
          name="name"
          required
          maxLength={60}
          defaultValue={name}
          autoComplete="given-name"
          aria-describedby={describedBy("name", true, Boolean(e.name))}
          aria-invalid={e.name ? true : undefined}
          className={inputClass}
        />
      </Field>
      <Field id="email" label="Email" help="You sign in with it. It can't be changed yet.">
        <input id="email" value={email} readOnly aria-describedby="email-help" className={`${inputClass} bg-surface-2`} />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          <Save aria-hidden="true" className="size-4" />
          {pending ? "Saving…" : "Save my name"}
        </button>
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, START);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state]);
  const e = state.fieldErrors;
  return (
    <form ref={formRef} action={action} className="grid gap-4">
      <Result state={state} />
      <Field id="currentPassword" label="Current password" error={e.currentPassword}>
        <PasswordInput id="currentPassword" name="currentPassword" autoComplete="current-password" describedBy={describedBy("currentPassword", false, Boolean(e.currentPassword))} invalid={Boolean(e.currentPassword)} />
      </Field>
      <Field id="newPassword" label="New password" help="At least 10 characters. A few words in a row is easy to remember." error={e.newPassword}>
        <PasswordInput id="newPassword" name="newPassword" autoComplete="new-password" describedBy={describedBy("newPassword", true, Boolean(e.newPassword))} invalid={Boolean(e.newPassword)} />
      </Field>
      <Field id="confirmPassword" label="New password again" error={e.confirmPassword}>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" describedBy={describedBy("confirmPassword", false, Boolean(e.confirmPassword))} invalid={Boolean(e.confirmPassword)} />
      </Field>
      <p className="text-sm text-muted">Changing your password signs out your other devices.</p>
      <div>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          {pending ? "Changing…" : "Change password"}
        </button>
      </div>
    </form>
  );
}

export function RecoveryForm({ hasCode }: { hasCode: boolean }) {
  const [state, action, pending] = useActionState(newRecoveryCodeAction, START);
  if (state.recoveryCode) {
    return (
      <div className="grid gap-4">
        <Notice tone="success">{state.message}</Notice>
        <RecoveryCodePanel code={state.recoveryCode} />
      </div>
    );
  }
  const e = state.fieldErrors;
  return (
    <form action={action} className="grid gap-4">
      <p className="text-sm">
        {hasCode
          ? "You have a recovery code. If you lost it, make a new one: the old one stops working."
          : "You don't have a recovery code. Make one now, so you can get back in if you forget your password."}
      </p>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="recoveryPassword" label="Your password" error={e.password}>
        <PasswordInput id="recoveryPassword" name="password" autoComplete="current-password" describedBy={describedBy("recoveryPassword", false, Boolean(e.password))} invalid={Boolean(e.password)} />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={buttonClass("secondary")}>
          <KeyRound aria-hidden="true" className="size-4" />
          {pending ? "Making a code…" : "Make a new recovery code"}
        </button>
      </div>
    </form>
  );
}

interface Device {
  id: string;
  createdAt: number;
  lastUsed: number;
  userAgent: string | null;
}

const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });

function EndOne({ id }: { id: string }) {
  const [state, action, pending] = useActionState(endSessionAction, START);
  return (
    <form action={action}>
      <input type="hidden" name="sessionId" value={id} />
      <button type="submit" disabled={pending} className={buttonClass("ghost", "px-3")}>
        Sign out
      </button>
      {state.error ? (
        <span role="alert" className="block text-xs font-semibold text-hard">
          {state.error}
        </span>
      ) : null}
    </form>
  );
}

export function DeviceList({ devices, currentId }: { devices: Device[]; currentId: string }) {
  const [state, action, pending] = useActionState(endOtherSessionsAction, START);
  const others = devices.filter((d) => d.id !== currentId).length;
  return (
    <div className="grid gap-3">
      <Result state={state} />
      <ul className="grid divide-y divide-line">
        {devices.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 py-2.5 text-sm">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">
                {deviceName(d.userAgent)} {d.id === currentId ? <span className="font-normal text-easy">(this device)</span> : null}
              </p>
              <p className="text-muted">
                Signed in {WHEN.format(d.createdAt)} · last used {WHEN.format(d.lastUsed)} (Cairo time)
              </p>
            </div>
            {d.id !== currentId ? <EndOne id={d.id} /> : null}
          </li>
        ))}
      </ul>
      {others > 0 ? (
        <form action={action}>
          <button type="submit" disabled={pending} className={buttonClass("secondary")}>
            <LogOut aria-hidden="true" className="size-4" />
            Sign out all other devices
          </button>
        </form>
      ) : null}
    </div>
  );
}

export function DownloadData() {
  return (
    <div className="grid gap-3">
      <p className="text-sm">
        One file (JSON) with your account details, lecture progress, answers, quiz and exam results, code drafts, bookmarks and achievements in
        every course. Passwords and recovery codes are never included.
      </p>
      <div>
        <a href="/api/me/export" download className={buttonClass("secondary")}>
          <Download aria-hidden="true" className="size-4" />
          Download my data
        </a>
      </div>
    </div>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteAccountAction, START);
  const e = state.fieldErrors;
  return (
    <form action={action} className="grid gap-4">
      <p className="text-sm">
        This deletes your account and everything saved with it, in every course: progress, answers, quiz and exam results, drafts, bookmarks
        and achievements. It can't be undone. Download your data first if you want a copy.
      </p>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="deletePassword" label="Your password" error={e.password}>
        <PasswordInput id="deletePassword" name="password" autoComplete="current-password" describedBy={describedBy("deletePassword", false, Boolean(e.password))} invalid={Boolean(e.password)} />
      </Field>
      <Field id="confirm" label="Type DELETE to confirm" error={e.confirm}>
        <input
          id="confirm"
          name="confirm"
          required
          autoComplete="off"
          spellCheck={false}
          maxLength={10}
          aria-describedby={describedBy("confirm", false, Boolean(e.confirm))}
          aria-invalid={e.confirm ? true : undefined}
          className={`${inputClass} font-mono`}
        />
      </Field>
      <div>
        <button type="submit" disabled={pending} className={buttonClass("danger")}>
          <Trash2 aria-hidden="true" className="size-4" />
          {pending ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </form>
  );
}
