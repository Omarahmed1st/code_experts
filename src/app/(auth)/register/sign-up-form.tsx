"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";
import { Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { PasswordInput } from "@/components/account/password-input";
import { RecoveryCodePanel } from "@/components/account/recovery-code-panel";
import { TurnstileWidget } from "@/components/account/turnstile-widget";
import { buttonClass } from "@/components/ui/button-styles";
import { type SignUpState, signUpAction } from "./actions";

const START: SignUpState = { error: null, fieldErrors: {}, values: { email: "", name: "" }, done: null };

export function SignUpForm({ next, turnstileSiteKey, signedInAs }: { next: string | null; turnstileSiteKey: string | null; signedInAs: string | null }) {
  const [state, action, pending] = useActionState<SignUpState, FormData>(signUpAction, START);
  const e = state.fieldErrors;

  if (state.done) {
    return (
      <div className="grid gap-4">
        <Notice tone="success">Your account is ready and you are signed in.</Notice>
        <RecoveryCodePanel code={state.done.recoveryCode} continueHref={state.done.next} />
      </div>
    );
  }

  if (signedInAs) {
    return (
      <div className="grid gap-4">
        <Notice tone="info">You are already signed in as {signedInAs}.</Notice>
        <a href={next ?? "/dashboard"} className={buttonClass("primary")}>
          Continue
        </a>
      </div>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="name" label="Your name" help="Shown only to you, in the header and on your dashboard. A first name is enough." error={e.name}>
        <input
          id="name"
          name="name"
          autoComplete="given-name"
          required
          maxLength={60}
          defaultValue={state.values.name}
          aria-describedby={describedBy("name", true, Boolean(e.name))}
          aria-invalid={e.name ? true : undefined}
          className={inputClass}
          autoFocus
        />
      </Field>
      <Field id="email" label="Email" help="You sign in with it. We don't send emails yet." error={e.email}>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          defaultValue={state.values.email}
          aria-describedby={describedBy("email", true, Boolean(e.email))}
          aria-invalid={e.email ? true : undefined}
          className={inputClass}
        />
      </Field>
      <Field id="password" label="Password" help="At least 10 characters. A few words in a row is easy to remember." error={e.password}>
        <PasswordInput id="password" name="password" autoComplete="new-password" describedBy={describedBy("password", true, Boolean(e.password))} invalid={Boolean(e.password)} />
      </Field>
      <TurnstileWidget siteKey={turnstileSiteKey} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        <UserPlus aria-hidden="true" className="size-4" />
        {pending ? "Creating your account…" : "Create my account"}
      </button>
      <p className="text-xs text-muted">
        We keep your email and name, what you do in the courses (lectures read, answers, quiz and exam results, code drafts, bookmarks), and for
        each device you sign in on: when, its network (IP) address and its browser, so you can see and sign out your devices. A cookie keeps you
        signed in. Network addresses of new sign-ups and failed sign-ins are also kept for a short time to stop abuse. You can download your
        data or delete your account at any time in Account settings.
      </p>
    </form>
  );
}
