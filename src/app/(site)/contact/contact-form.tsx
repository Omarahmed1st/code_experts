"use client";

import { Send } from "lucide-react";
import { useActionState } from "react";
import { Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { TurnstileWidget } from "@/components/account/turnstile-widget";
import { buttonClass } from "@/components/ui/button-styles";
import { type ContactState, sendContactAction } from "./actions";

const START: ContactState = { sent: false, error: null, fieldErrors: {}, values: { name: "", email: "", subject: "", body: "" } };

export function ContactForm({ subjects, shownAt, turnstileSiteKey }: { subjects: readonly string[]; shownAt: number; turnstileSiteKey: string | null }) {
  const [state, action, pending] = useActionState<ContactState, FormData>(sendContactAction, START);
  const e = state.fieldErrors;
  if (state.sent) {
    return (
      <Notice tone="success">
        Thank you, your message was sent. We read every message; if it needs an answer, we&apos;ll reply to the email you gave.
      </Notice>
    );
  }
  return (
    <form action={action} className="grid gap-5" noValidate={false}>
      {state.error ? <Notice tone="error">{state.error}</Notice> : null}
      <input type="hidden" name="shown_at" value={shownAt} />
      {/* People never see or fill this field; programs that fill every field do. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="website">Leave this empty</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Your name" error={e.name}>
          <input
            id="name"
            name="name"
            required
            maxLength={120}
            autoComplete="name"
            defaultValue={state.values.name}
            aria-invalid={e.name ? true : undefined}
            aria-describedby={describedBy("name", false, Boolean(e.name))}
            className={inputClass}
          />
        </Field>
        <Field id="email" label="Your email" help="Only used to reply to you." error={e.email}>
          <input
            id="email"
            name="email"
            type="email"
            required
            maxLength={254}
            autoComplete="email"
            defaultValue={state.values.email}
            aria-invalid={e.email ? true : undefined}
            aria-describedby={describedBy("email", true, Boolean(e.email))}
            className={inputClass}
          />
        </Field>
      </div>
      <Field id="subject" label="What is it about?" error={e.subject}>
        <select
          id="subject"
          name="subject"
          required
          defaultValue={state.values.subject}
          aria-invalid={e.subject ? true : undefined}
          aria-describedby={describedBy("subject", false, Boolean(e.subject))}
          className={inputClass}
        >
          <option value="" disabled>
            Choose one
          </option>
          {subjects.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>
      <Field id="body" label="Your message" help="For a mistake in a lecture, include the lecture's name or address." error={e.body}>
        <textarea
          id="body"
          name="body"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          defaultValue={state.values.body}
          aria-invalid={e.body ? true : undefined}
          aria-describedby={describedBy("body", true, Boolean(e.body))}
          className={inputClass}
        />
      </Field>
      <TurnstileWidget siteKey={turnstileSiteKey} />
      <div>
        <button type="submit" disabled={pending} className={buttonClass("primary")}>
          <Send aria-hidden="true" className="size-4" />
          {pending ? "Sending…" : "Send message"}
        </button>
      </div>
    </form>
  );
}
