"use client";

// Result messages and buttons that need a second click to confirm.
import { useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";
import { Notice } from "./form-parts";
import type { ActionResult } from "./use-admin-action";

export function ResultNotice({ result }: { result: ActionResult | null }) {
  if (!result) return null;
  if (result.ok) return result.message ? <Notice tone="success">{result.message}</Notice> : null;
  const extra = result.fieldErrors ? Object.values(result.fieldErrors).filter((m) => m !== result.error) : [];
  return (
    <Notice tone="error">
      {result.error}
      {extra.length > 1 ? (
        <ul className="mt-1 list-disc pl-5">
          {extra.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : null}
    </Notice>
  );
}

/** First click asks, second click does it. Escape-free and keyboard friendly (two real buttons). */
export function ConfirmButton({
  label,
  confirmLabel,
  question,
  onConfirm,
  disabled,
  tone = "danger",
  className = "",
}: {
  label: React.ReactNode;
  confirmLabel: string;
  question: string;
  onConfirm: () => void;
  disabled?: boolean;
  tone?: "danger" | "normal";
  className?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking) {
    return (
      <button type="button" disabled={disabled} onClick={() => setAsking(true)} className={tone === "danger" ? dangerClass(className) : buttonClass("secondary", className)}>
        {label}
      </button>
    );
  }
  return (
    <span role="group" aria-label={question} className="inline-flex flex-wrap items-center gap-2">
      <span className="text-sm font-medium">{question}</span>
      <button
        type="button"
        autoFocus
        disabled={disabled}
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className={tone === "danger" ? dangerClass("", true) : buttonClass("primary")}
      >
        {confirmLabel}
      </button>
      <button type="button" onClick={() => setAsking(false)} className={buttonClass("ghost")}>
        Cancel
      </button>
    </span>
  );
}

export function dangerClass(extra = "", solid = false): string {
  return `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${
    solid ? "bg-hard text-on-hard hover:opacity-90" : "border border-hard/50 text-hard hover:bg-hard-soft"
  } ${extra}`.trim();
}
