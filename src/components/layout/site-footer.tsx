import Link from "next/link";
import type { SwitcherCourse } from "./course-switcher";
import { SITE_NAME } from "@/lib/site";
import { Logo } from "./logo";

/** Site-wide links. */
const PLATFORM_LINKS: { href: string; label: string }[] = [
  { href: "/courses", label: "All courses" },
  { href: "/search", label: "Search" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/accessibility", label: "Accessibility" },
];

/** Legal and trust pages (Phase 6). "Privacy choices" can be hidden by an admin while ads are off. */
const LEGAL_LINKS: { href: string; label: string }[] = [
  { href: "/privacy-policy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/cookie-policy", label: "Cookie policy" },
  { href: "/advertising", label: "Advertising" },
  { href: "/privacy-choices", label: "Privacy choices" },
];

const linkClass = "inline-flex min-h-11 items-center text-ink hover:text-primary-text";

export function SiteFooter({ courses, privacyChoices = true }: { courses: SwitcherCourse[]; privacyChoices?: boolean }) {
  const legal = privacyChoices ? LEGAL_LINKS : LEGAL_LINKS.filter((l) => l.href !== "/privacy-choices");
  const year = new Date().getUTCFullYear();
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-muted">
            Free programming lectures and practice for university students. Every course is its own learning space.
          </p>
        </div>
        <nav aria-label="Courses">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">Courses</h2>
          <ul className="mt-3 grid gap-1">
            {courses.map((course) => (
              <li key={course.slug}>
                <Link className={linkClass} href={`/courses/${course.slug}`}>
                  {course.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Platform">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">Platform</h2>
          <ul className="mt-3 grid gap-1">
            {PLATFORM_LINKS.map((link) => (
              <li key={link.href}>
                <Link className={linkClass} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Legal">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted">Legal</h2>
          <ul className="mt-3 grid gap-1">
            {legal.map((link) => (
              <li key={link.href}>
                <Link className={linkClass} href={link.href}>
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-muted sm:px-6">© {year} {SITE_NAME}</p>
      </div>
    </footer>
  );
}
