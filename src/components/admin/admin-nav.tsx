"use client";

import { BookOpen, ClipboardList, GraduationCap, Home, Inbox, Megaphone, ScrollText, Settings2, UserCog, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface NavCourse {
  slug: string;
  shortTitle: string;
  status: string;
}

function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ href, exact, icon, children }: { href: string; exact?: boolean; icon?: React.ReactNode; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = isActive(pathname, href, exact);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center gap-2.5 rounded-xl px-3 text-sm font-medium transition-colors ${
        active ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"
      }`}
    >
      {icon}
      <span className="min-w-0 truncate">{children}</span>
    </Link>
  );
}

export function AdminNav({ courses, isAdmin }: { courses: NavCourse[]; isAdmin: boolean }) {
  return (
    <nav aria-label="Admin" className="grid gap-6">
      <div className="grid gap-1">
        <NavLink href="/admin" exact icon={<Home aria-hidden="true" className="size-4 shrink-0" />}>
          Dashboard
        </NavLink>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">Courses</h2>
        <div className="mt-2 grid gap-1">
          {courses.map((course) => (
            <NavLink key={course.slug} href={`/admin/courses/${course.slug}`} icon={<BookOpen aria-hidden="true" className="size-4 shrink-0" />}>
              {course.shortTitle}
              {course.status !== "published" ? <span className="ml-1.5 text-xs font-normal opacity-80">({course.status})</span> : null}
            </NavLink>
          ))}
          {isAdmin ? (
            <NavLink href="/admin/courses" exact icon={<ClipboardList aria-hidden="true" className="size-4 shrink-0" />}>
              All courses
            </NavLink>
          ) : null}
        </div>
      </div>
      <div>
        <h2 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">Site</h2>
        <div className="mt-2 grid gap-1">
          {isAdmin ? (
            <>
              <NavLink href="/admin/users" icon={<Users aria-hidden="true" className="size-4 shrink-0" />}>
                Staff accounts
              </NavLink>
              <NavLink href="/admin/students" icon={<GraduationCap aria-hidden="true" className="size-4 shrink-0" />}>
                Students
              </NavLink>
              <NavLink href="/admin/audit-log" icon={<ScrollText aria-hidden="true" className="size-4 shrink-0" />}>
                Audit log
              </NavLink>
              <NavLink href="/admin/messages" icon={<Inbox aria-hidden="true" className="size-4 shrink-0" />}>
                Messages
              </NavLink>
              <NavLink href="/admin/ads" icon={<Megaphone aria-hidden="true" className="size-4 shrink-0" />}>
                Advertising
              </NavLink>
              <NavLink href="/admin/site" icon={<Settings2 aria-hidden="true" className="size-4 shrink-0" />}>
                Site details
              </NavLink>
            </>
          ) : null}
          <NavLink href="/admin/account" icon={<UserCog aria-hidden="true" className="size-4 shrink-0" />}>
            My account
          </NavLink>
        </div>
      </div>
    </nav>
  );
}

export interface CourseTab {
  href: string;
  label: string;
  exact?: boolean;
}

export function CourseTabs({ tabs }: { tabs: CourseTab[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Course sections" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex min-w-max gap-1 border-b border-line">
        {tabs.map((tab) => {
          const active = isActive(pathname, tab.href, tab.exact);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold transition-colors ${
                  active ? "border-primary-text text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
