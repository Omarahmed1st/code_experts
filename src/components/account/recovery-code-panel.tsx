"use client";

import { Check, Copy, KeyRound } from "lucide-react";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";

/** Shows a new recovery code once, with copy and a clear "save it now". */
export function RecoveryCodePanel({ code, continueHref, continueLabel }: { code: string; continueHref?: string; continueLabel?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="grid gap-4">
      <div className="rounded-xl border border-medium/50 bg-medium-soft p-4 text-sm text-ink">
        <p className="flex items-center gap-2 font-semibold">
          <KeyRound aria-hidden="true" className="size-4" />
          Save your recovery code now
        </p>
        <p className="mt-1">
          If you forget your password, this code is the only way back into your account. Write it down or keep it in a password manager. It is
          shown only this once.
        </p>
      </div>
      <p className="rounded-xl bg-navy px-4 py-4 text-center font-mono text-xl font-bold tracking-wider text-[#ffd43b] select-all" aria-label={`Recovery code ${code.split("").join(" ")}`}>
        {code}
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={() => {
            void navigator.clipboard?.writeText(code).then(
              () => setCopied(true),
              () => setCopied(false),
            );
          }}
        >
          {copied ? <Check aria-hidden="true" className="size-4" /> : <Copy aria-hidden="true" className="size-4" />}
          {copied ? "Copied" : "Copy the code"}
        </button>
        {continueHref ? (
          // A full page load: the account was just signed in, and the header asks again who that is.
          <a href={continueHref} className={buttonClass("primary")}>
            {continueLabel ?? "I've saved it, continue"}
          </a>
        ) : null}
      </div>
    </div>
  );
}
