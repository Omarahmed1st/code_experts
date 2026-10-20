"use client";

import { LogIn } from "lucide-react";
import { useActionState, useEffect } from "react";
import { Field, Notice, inputClass } from "@/components/admin/form-parts";
import { PasswordInput } from "@/components/account/password-input";
import { TurnstileWidget } from "@/components/account/turnstile-widget";
import { buttonClass } from "@/components/ui/button-styles";
import { type SignInState, signInAction } from "./actions";

export function SignInForm({ next, turnstileSiteKey }: { next: string | null; turnstileSiteKey: string | null }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, { error: null, email: "" });
  const goTo = state.goTo;
  useEffect(() => {
    if (goTo) window.location.assign(goTo);
  }, [goTo]);

  if (goTo) {
    return (
      <Notice tone="success">
        You are signed in.{" "}
        <a href={goTo} className="font-semibold underline">
          Continue
        </a>
      </Notice>
    );
  }

  return (
    <form action={action} className="grid gap-5">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <Field id="email" label="Email">
        <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} defaultValue={state.email} className={inputClass} autoFocus />
      </Field>
      <Field id="password" label="Password">
        <PasswordInput id="password" name="password" autoComplete="current-password" />
      </Field>
      <TurnstileWidget siteKey={turnstileSiteKey} />
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        <LogIn aria-hidden="true" className="size-4" />
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
