"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import Link from "next/link";
import { ResultNotice } from "@/components/admin/action-parts";
import { StatusBadge } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { reorderCoursesAction } from "../site-actions";

interface Row {
  id: string;
  slug: string;
  title: string;
  status: string;
  lectures: number;
}

export function CourseOrder({ courses }: { courses: Row[] }) {
  const action = useAdminAction();
  const move = (i: number, by: number) => {
    const ids = courses.map((c) => c.id);
    const [m] = ids.splice(i, 1);
    ids.splice(i + by, 0, m!);
    action.run(() => reorderCoursesAction(ids));
  };
  return (
    <div className="grid gap-3">
      <ResultNotice result={action.result} />
      <ol className="grid gap-3">
        {courses.map((c, i) => (
          <li key={c.id} className="flex flex-wrap items-center gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <span className="font-mono text-sm text-muted">{String(i + 1).padStart(2, "0")}</span>
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <Link href={`/admin/courses/${c.slug}`} className="hover:underline">
                  {c.title}
                </Link>
                <StatusBadge status={c.status} />
              </p>
              <p className="text-sm text-muted">
                <span className="font-mono">/courses/{c.slug}</span> · {c.lectures} lecture{c.lectures === 1 ? "" : "s"}
              </p>
            </div>
            <button type="button" className={buttonClass("ghost", "px-3")} disabled={i === 0 || action.pending} onClick={() => move(i, -1)} aria-label={`Move ${c.title} up`}>
              <ArrowUp aria-hidden="true" className="size-4" />
            </button>
            <button type="button" className={buttonClass("ghost", "px-3")} disabled={i === courses.length - 1 || action.pending} onClick={() => move(i, 1)} aria-label={`Move ${c.title} down`}>
              <ArrowDown aria-hidden="true" className="size-4" />
            </button>
            <Link href={`/admin/courses/${c.slug}/settings`} className={buttonClass("secondary", "px-3")}>
              Settings
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
