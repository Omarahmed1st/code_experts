import type { ReactNode } from "react";

/** The title block every admin page starts with: lec-style chapter strip, heading, a line of context and actions. */
export function PageHeader({ chapter, title, description, actions }: { chapter?: string; title: ReactNode; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="min-w-0">
        {chapter ? (
          <p className="lec-chapter text-muted">
            <i />
            {chapter}
          </p>
        ) : null}
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-3xl text-muted">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2 sm:ml-auto">{actions}</div> : null}
    </div>
  );
}
