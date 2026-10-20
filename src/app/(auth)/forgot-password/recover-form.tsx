"use client";

import { KeyRound } from "lucide-react";
import { useActionState } from "react";
import { Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { PasswordInput } from "@/components/account/password-input";
import { RecoveryCodePanel } from "@/components/account/recovery-code-panel";
import { TurnstileWidget } from "@/components/account/turnstile-widget";
import { buttonClass } from "@/components/ui/button-styles";
import { type RecoverState, recoverAction } from "./actions";

const START: RecoverState = { error: null, fieldErrors: {}, email: "", done: null };

export function RecoverForm({ next, turnstileSiteKey }: { next: string | null; turnstileSiteKey: string | null }) {
  const [state, action, pending] = useActionState<RecoverState, FormData>(recoverAction, START);
  const e = state.fieldErrors;

  if (state.done) {
    return (
      <div className="grid gap-4">
        <Notice tone="success">Your password is changed and you are signed in. Every other device was signed out.</Notice>
        <p className="text-sm text-muted">The code you just used no longer works. Here is your new one:</p>
        <RecoveryCodePanel code={state.done.recoveryCode} continueHref={state.done.next} />
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="email" label="Email" error={e.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          maxLength={254}
          defaultValue={state.email}
          aria-describedby={describedBy("email", false, Boolean(e.email))}
          aria-invalid={e.email ? true : undefined}
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field id="code" label="Recovery code" help="The 16-character code you saved when you made your account, like ABCD-EFGH-JKMN-PQRS." error={e.code}>
        <input
          id="code"
          name="code"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          required
          maxLength={40}
          aria-describedby={describedBy("code", true, Boolean(e.code))}
          aria-invalid={e.code ? true : undefined}
          className={`${inputClass} font-mono uppercase tracking-wider`}
        />
      </Field>
      <Field id="password" label="New password" help="At least 10 characters." error={e.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" describedBy={describedBy("password", true, Boolean(e.password))} invalid={Boolean(e.password)} />
      </Field>
      <TurnstileWidget siteKey={turnstileSiteKey} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        <KeyRound aria-hidden="true" className="size-4" />
        {pending ? "Checking…" : "Set my new password"}
      </button>
    </form>
  );
}
