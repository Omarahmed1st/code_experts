import { ExternalLink, LogOut, Menu } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { AdminNav, type NavCourse } from "./admin-nav";

export function AdminShell({
  staff,
  courses,
  isAdmin,
  signOut,
  children,
}: {
  staff: { name: string; email: string };
  courses: NavCourse[];
  isAdmin: boolean;
  signOut: (formData: FormData) => Promise<void>;
  children: ReactNode;
}) {
  return (
    <>
      <header className="lec-cinema sticky top-0 z-40 border-b border-[#24365e]">
        <div className="mx-auto flex h-16 max-w-[90rem] items-center gap-3 px-4 sm:px-6">
          <Link href="/admin" className="inline-flex min-h-11 items-center gap-2.5 rounded-lg text-[var(--lec-ink)]">
            <LogoMark />
            <span className="text-lg font-bold max-[419px]:sr-only">
              Code<span className="text-[var(--lec-yel)]">_Expert</span>
            </span>
            <span className="rounded-full border border-[#2b4373] px-2 py-0.5 font-mono text-xs text-[var(--lec-sky)]">admin</span>
          </Link>
          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/"
              className="hidden min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[var(--lec-ink)] hover:bg-white/10 sm:inline-flex"
            >
              View site <ExternalLink aria-hidden="true" className="size-4" />
            </Link>
            <ThemeToggle tone="stage" />
            <form action={signOut}>
              <button
                type="submit"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-[var(--lec-ink)] hover:bg-white/10"
              >
                <LogOut aria-hidden="true" className="size-4" />
                <span className="max-sm:sr-only">Sign out</span>
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-[90rem] flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <p className="hidden px-3 pb-4 text-sm lg:block">
            <span className="block font-semibold">{staff.name || staff.email}</span>
            <span className="block truncate text-muted">{staff.email}</span>
          </p>
          <details className="group rounded-xl border border-line bg-surface lg:hidden">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-3 text-sm font-semibold">
              <Menu aria-hidden="true" className="size-4" /> Admin menu
              <span className="ml-auto truncate font-normal text-muted">{staff.name || staff.email}</span>
            </summary>
            <div className="border-t border-line p-2">
              <AdminNav courses={courses} isAdmin={isAdmin} />
            </div>
          </details>
          <div className="hidden lg:block">
            <AdminNav courses={courses} isAdmin={isAdmin} />
          </div>
        </aside>
        <main id="main" tabIndex={-1} className="min-w-0 outline-none">
          {children}
        </main>
      </div>
    </>
  );
}
