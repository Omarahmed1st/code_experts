"use client";

import { Check, ChevronDown, Layers } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { courseSlugFromPath } from "@/lib/course-path";

export interface SwitcherCourse {
  slug: string;
  title: string;
  shortTitle: string;
}

/**
 * Shows which course you're in and lets you jump to another one. It never
 * lists content from several courses together: each entry opens one course.
 */
export function CourseSwitcher({ courses }: { courses: SwitcherCourse[] }) {
  const pathname = usePathname();
  const currentSlug = courseSlugFromPath(pathname);
  const current = courses.find((c) => c.slug === currentSlug) ?? null;
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex h-11 max-w-[min(11rem,calc(100vw-12rem))] items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:border-line-strong hover:bg-surface-2 sm:max-w-none"
      >
        <Layers aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
        <span className="truncate">
          <span className="sr-only">Current course: </span>
          {current ? current.shortTitle : "Choose a course"}
        </span>
        <ChevronDown aria-hidden="true" className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <div
        id={menuId}
        hidden={!open}
        className="absolute left-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 shadow-card"
      >
        <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-muted">Courses</p>
        {courses.length === 0 ? (
          <p className="px-3 py-2 text-sm text-muted">No courses are published yet.</p>
        ) : (
          <ul className="grid gap-1">
            {courses.map((course) => {
              const isCurrent = course.slug === currentSlug;
              return (
                <li key={course.slug}>
                  <Link
                    href={`/courses/${course.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    onClick={() => setOpen(false)}
                    className={`flex min-h-11 items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-surface-2 ${
                      isCurrent ? "bg-primary-soft font-semibold text-primary-text" : "text-ink"
                    }`}
                  >
                    <span>
                      <span className="block font-semibold">{course.title}</span>
                      <span className="block text-xs text-muted">{course.shortTitle}</span>
                    </span>
                    {isCurrent ? <Check aria-hidden="true" className="size-4 shrink-0" /> : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
        <div className="mt-1 border-t border-line pt-1">
          <Link
            href="/courses"
            onClick={() => setOpen(false)}
            className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-primary-text hover:bg-surface-2"
          >
            All courses
          </Link>
        </div>
      </div>
    </div>
  );
}
