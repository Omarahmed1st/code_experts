import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-card)] border border-dashed border-line-strong bg-surface px-6 py-12 text-center">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
        {icon}
      </div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      {children ? <div className="mx-auto mt-2 max-w-md text-muted">{children}</div> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
