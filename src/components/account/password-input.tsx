"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { inputClass } from "@/components/admin/form-parts";

/** A password box with a show/hide button. */
export function PasswordInput({
  id,
  name,
  autoComplete,
  describedBy,
  invalid = false,
  autoFocus = false,
}: {
  id: string;
  name: string;
  autoComplete: "current-password" | "new-password";
  describedBy?: string;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        autoComplete={autoComplete}
        required
        maxLength={200}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        autoFocus={autoFocus}
        className={`${inputClass} pr-12`}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center rounded-r-xl text-muted hover:text-ink"
      >
        {show ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
      </button>
    </div>
  );
}

/** Cloudflare Turnstile, only when its keys are configured. */
export { TurnstileWidget } from "./turnstile-widget";
