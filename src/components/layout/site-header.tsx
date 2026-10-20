import Link from "next/link";
import { AccountMenu } from "@/components/account/account-menu";
import { CourseSwitcher, type SwitcherCourse } from "./course-switcher";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";

export function SiteHeader({ courses }: { courses: SwitcherCourse[] }) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-4 sm:px-6">
        <Logo />
        <nav aria-label="Main" className="ml-auto flex items-center gap-2 sm:ml-6 sm:gap-3">
          <CourseSwitcher courses={courses} />
          <Link
            href="/courses"
            className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-muted transition-colors hover:bg-surface-2 hover:text-ink md:inline-flex"
          >
            All courses
          </Link>
        </nav>
        <div className="flex min-w-0 items-center gap-2 sm:ml-auto">
          <ThemeToggle />
          {/* Sign in, or the signed-in student's menu (filled in after the page loads). */}
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
