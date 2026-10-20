"use client";

// The header's account button. Guests get "Sign in"; a signed-in account gets
// its initial, name and title (Student, Administrator, ...) and a menu (progress,
// settings, sign out); staff also get the admin. The page itself is the same
// for everyone: who is signed in is asked for after it loads (GET /api/me).
import { ChevronDown, LayoutDashboard, LogIn, LogOut, Settings, Shield } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { courseSlugFromPath } from "@/lib/course-path";
import { signOut, useMe } from "./me";

const square =
  "inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:border-line-strong hover:bg-surface-2";

export function AccountMenu() {
  const me = useMe();
  const pathname = usePathname();
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

  if (me === undefined) {
    // Same size as the real button, so nothing moves when it arrives.
    return <span aria-hidden="true" className={`${square} opacity-40`} />;
  }
  if (me === null) {
    const next = pathname && pathname !== "/" ? `?next=${encodeURIComponent(pathname)}` : "";
    // A full page load, not <Link>: if this tab missed a sign-in (another tab, say), the
    // sign-in page sends the browser straight back and the header asks again.
    return (
      <a href={`/login${next}`} className={`${square} shrink-0 sm:w-auto sm:gap-2 sm:px-3 sm:text-sm sm:font-semibold`} title="Sign in">
        <LogIn aria-hidden="true" className="size-5 sm:size-4" />
        <span className="sr-only sm:not-sr-only">Sign in</span>
      </a>
    );
  }

  const course = courseSlugFromPath(pathname);
  const shownName = me.name.trim() || me.email;
  const initial = (shownName[0] ?? "?").toUpperCase();
  const item = "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold text-ink hover:bg-surface-2";
  return (
    <div ref={rootRef} className="relative min-w-0 shrink-0 sm:shrink">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className={`${square} sm:w-auto sm:max-w-full sm:justify-start sm:gap-2 sm:pl-1.5 sm:pr-2.5`}
        aria-label={`${shownName}, ${me.title}, account menu`}
        title={`Signed in as ${shownName} (${me.title})`}
      >
        <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-navy font-bold text-[#ffd43b]">
          {initial}
        </span>
        {/* Name and title, shown from 640 px up (phones keep the round initial); the label reads them everywhere.
            Long names are cut with "…", sooner when the header is short of room. */}
        <span className="hidden min-w-0 max-w-[9rem] text-left leading-tight sm:block lg:max-w-[12rem]">
          <span className="block truncate text-sm font-semibold">{shownName}</span>
          <span className="block truncate text-xs text-muted">{me.title}</span>
        </span>
        <ChevronDown aria-hidden="true" className={`hidden size-4 shrink-0 text-muted transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>
      <div id={menuId} hidden={!open} className="absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-line bg-surface p-2 shadow-card">
        <p className="px-3 pb-2 pt-2">
          <span className="block truncate font-semibold">{me.name || "Your account"}</span>
          <span className="block truncate text-xs text-muted">{me.email}</span>
          <span className="mt-1.5 inline-block rounded-full bg-navy px-2 py-0.5 text-xs font-semibold text-[#ffd43b]">{me.title}</span>
        </p>
        <ul className="grid gap-1 border-t border-line pt-1">
          <li>
            <Link href={course ? `/dashboard/${course}` : "/dashboard"} onClick={() => setOpen(false)} className={item}>
              <LayoutDashboard aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
              {course ? "View my progress in this course" : "View my progress"}
            </Link>
          </li>
          {course ? (
            <li>
              <Link href="/dashboard" onClick={() => setOpen(false)} className={item}>
                <LayoutDashboard aria-hidden="true" className="size-4 shrink-0 text-primary-text" />
                All my courses
              </Link>
            </li>
          ) : null}
          <li>
            <Link href="/settings" onClick={() => setOpen(false)} className={item}>
              <Settings aria-hidden="true" className="size-4 text-primary-text" />
              Account settings
            </Link>
          </li>
          {me.isStaff ? (
            <li>
              <Link href="/admin" onClick={() => setOpen(false)} className={item}>
                <Shield aria-hidden="true" className="size-4 text-primary-text" />
                Admin
              </Link>
            </li>
          ) : null}
          <li className="border-t border-line pt-1">
            <button type="button" onClick={() => void signOut()} className={`${item} w-full`}>
              <LogOut aria-hidden="true" className="size-4 text-primary-text" />
              Sign out
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}
