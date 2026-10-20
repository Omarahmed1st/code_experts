/** A labelled progress bar (done of total). */
export function ProgressBar({ done, total, label, tone = "green" }: { done: number; total: number; label: string; tone?: "green" | "sky" }) {
  const pct = total > 0 ? Math.round((done * 100) / total) : 0;
  return (
    <div
      className="h-2 overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      aria-valuetext={`${done} of ${total}`}
    >
      <div className={`h-full rounded-full ${tone === "green" ? "bg-easy" : "bg-primary"}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

/** "12 Oct, 14:05" in Cairo time. */
const WHEN = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
export function formatWhen(ms: number): string {
  return WHEN.format(new Date(ms));
}

/** "3 days ago", "today". */
export function daysAgo(ms: number, now: number): string {
  const days = Math.floor((now - ms) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}
