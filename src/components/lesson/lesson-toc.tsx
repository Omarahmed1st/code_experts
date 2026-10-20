import { ChevronDown } from "lucide-react";
import { sectionAnchor } from "./lesson-section";

/** "On this page" links. Sticky beside the lecture on wide screens, folded above it on small ones. */
export function LessonToc({ sections, variant }: { sections: { title: string }[]; variant: "mobile" | "sidebar" }) {
  const items = sections.map((s, i) => ({ href: `#${sectionAnchor(i, s.title)}`, title: s.title, no: i + 1 }));
  const list = (
    <ol className="mt-3 grid gap-0.5 text-sm">
      {items.map((item) => (
        <li key={item.href}>
          <a
            href={item.href}
            className="flex min-h-10 items-baseline gap-2.5 rounded-lg px-2 py-1.5 text-muted transition-colors hover:bg-surface-2 hover:text-ink"
          >
            <span aria-hidden="true" className="font-mono text-xs font-bold text-primary-text">
              {String(item.no).padStart(2, "0")}
            </span>
            {item.title}
          </a>
        </li>
      ))}
    </ol>
  );
  if (variant === "mobile") {
    return (
      <details className="group rounded-[var(--radius-card)] border border-line bg-surface p-4 lg:hidden">
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between font-semibold [&::-webkit-details-marker]:hidden">
          On this page
          <ChevronDown aria-hidden="true" className="size-5 text-muted transition-transform group-open:rotate-180" />
        </summary>
        <nav aria-label="On this page">{list}</nav>
      </details>
    );
  }
  return (
    <nav aria-labelledby="toc-heading" className="sticky top-24 hidden max-h-[calc(100dvh-8rem)] overflow-y-auto lg:block">
      <h2 id="toc-heading" className="font-display text-sm font-semibold uppercase tracking-wider text-muted">
        On this page
      </h2>
      {list}
    </nav>
  );
}
