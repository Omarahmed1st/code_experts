import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** `tone="stage"` is for the always-dark lec hero, in both themes. */
export function Breadcrumbs({ items, tone = "page" }: { items: Crumb[]; tone?: "page" | "stage" }) {
  const stage = tone === "stage";
  return (
    <nav aria-label="Breadcrumb" className="text-sm">
      <ol className={`flex flex-wrap items-center gap-x-2 gap-y-1 ${stage ? "text-[var(--lec-mute)]" : "text-muted"}`}>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !last ? (
                <Link
                  href={item.href}
                  className={`rounded hover:underline ${stage ? "hover:text-[var(--lec-yel)]" : "hover:text-primary-text"}`}
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={last ? "page" : undefined} className={last ? `font-semibold ${stage ? "text-[var(--lec-ink)]" : "text-ink"}` : undefined}>
                  {item.label}
                </span>
              )}
              {last ? null : <span aria-hidden="true">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
