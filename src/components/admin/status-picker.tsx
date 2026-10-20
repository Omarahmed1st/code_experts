"use client";

import { fromCairoInput, toCairoInput } from "@/lib/admin/time";
import { Field, inputClass } from "./form-parts";

export type PickableStatus = "draft" | "published" | "scheduled" | "archived";

const LABEL: Record<PickableStatus, string> = {
  draft: "Draft: only staff",
  published: "Published: everyone",
  scheduled: "Scheduled: goes live at a set time",
  archived: "Archived: hidden, kept for staff",
};

/** "Who can see it" radios, with a Cairo-time picker for scheduled items. */
export function StatusPicker<S extends PickableStatus>({
  name,
  options,
  status,
  publishAt = null,
  onChange,
  error,
}: {
  name: string;
  options: readonly S[];
  status: S;
  publishAt?: number | null;
  onChange: (status: S, publishAt: number | null) => void;
  error?: string | null;
}) {
  return (
    <fieldset className="grid gap-1">
      <legend className="mb-1 text-sm font-semibold">Who can see it</legend>
      {options.map((value) => (
        <label key={value} className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name={name}
            value={value}
            checked={status === value}
            onChange={() => onChange(value, value === "scheduled" ? (publishAt ?? Date.now() + 24 * 60 * 60 * 1000) : null)}
            className="size-4 accent-[var(--cl-primary)]"
          />
          {LABEL[value]}
        </label>
      ))}
      {status === "scheduled" ? (
        <Field id={`${name}-at`} label="Goes live at (Cairo time)" error={error}>
          <input
            id={`${name}-at`}
            type="datetime-local"
            value={publishAt ? toCairoInput(publishAt) : ""}
            onChange={(e) => onChange(status, fromCairoInput(e.target.value))}
            className={inputClass}
          />
        </Field>
      ) : null}
    </fieldset>
  );
}
