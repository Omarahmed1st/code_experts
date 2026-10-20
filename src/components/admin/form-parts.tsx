// Small building blocks for admin forms. Every input has a visible label,
// help text is tied to its input (aria-describedby), and errors are announced.
import type { ReactNode } from "react";

export const inputClass =
  "block w-full min-h-11 rounded-xl border border-line-strong bg-surface px-3 py-2 text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-60";
export const monoInputClass = `${inputClass} font-mono text-[13px] leading-relaxed`;

export function Field({
  id,
  label,
  help,
  error,
  children,
  optional = false,
}: {
  id: string;
  label: ReactNode;
  help?: ReactNode;
  error?: string | null;
  children: ReactNode;
  optional?: boolean;
}) {
  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-ink">
        {label}
        {optional ? <span className="ml-1.5 font-normal text-muted">(optional)</span> : null}
      </label>
      {children}
      {help ? (
        <p id={`${id}-help`} className="text-xs text-muted">
          {help}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-sm font-medium text-hard">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** aria-describedby for an input inside <Field>. */
export function describedBy(id: string, help: boolean, error: boolean): string | undefined {
  const ids = [help ? `${id}-help` : null, error ? `${id}-error` : null].filter(Boolean);
  return ids.length ? ids.join(" ") : undefined;
}

export function Card({ title, actions, children, className = "" }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--cl-shadow)] sm:p-6 ${className}`}>
      {title || actions ? (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          {title ? <h2 className="text-lg font-semibold">{title}</h2> : null}
          {actions ? <div className="ml-auto flex flex-wrap gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warn"; children: ReactNode }) {
  const styles = {
    info: "border-accent/40 bg-accent-soft text-ink",
    success: "border-easy/40 bg-easy-soft text-ink",
    error: "border-hard/50 bg-hard-soft text-ink",
    warn: "border-medium/50 bg-medium-soft text-ink",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>
      {children}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  published: "bg-easy-soft text-easy",
  live: "bg-easy-soft text-easy",
  scheduled: "bg-accent-soft text-accent",
  draft: "bg-medium-soft text-medium",
  archived: "bg-surface-2 text-muted",
  disabled: "bg-hard-soft text-hard",
  active: "bg-easy-soft text-easy",
};

export function StatusBadge({ status, label }: { status: string; label?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLES[status] ?? "bg-surface-2 text-muted"}`}>
      {label ?? status}
    </span>
  );
}
