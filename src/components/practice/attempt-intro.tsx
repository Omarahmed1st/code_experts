// What a student reads before starting a quiz or practice exam.
import type { ReactNode } from "react";

export function AttemptIntro({ descriptionHtml, facts, rules }: { descriptionHtml: string; facts: { label: string; value: string }[]; rules: ReactNode[] }) {
  return (
    <section aria-label="Before you start" className="mb-6 grid gap-5 md:grid-cols-[1.3fr_1fr]">
      <div>
        {descriptionHtml ? <div className="lesson-prose" dangerouslySetInnerHTML={{ __html: descriptionHtml }} /> : null}
        <ul className="mt-4 grid gap-2 text-muted">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-2">
              <span aria-hidden="true" className="text-primary-text">
                •
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>
      <dl className="grid grid-cols-2 gap-3 self-start">
        {facts.map((f) => (
          <div key={f.label} className="rounded-xl border border-line bg-surface px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted">{f.label}</dt>
            <dd className="mt-1 text-lg font-bold">{f.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
