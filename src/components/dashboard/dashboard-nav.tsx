import Link from "next/link";

export type DashboardTab = "overview" | "progress" | "history" | "bookmarks";

const TABS: { id: DashboardTab; label: string; path: string }[] = [
  { id: "overview", label: "Overview", path: "" },
  { id: "progress", label: "Progress by topic", path: "/progress" },
  { id: "history", label: "History", path: "/history" },
  { id: "bookmarks", label: "Bookmarks", path: "/bookmarks" },
];

/** The sections of one course's dashboard. Everything here belongs to this course only. */
export function DashboardNav({ courseSlug, courseTitle, current }: { courseSlug: string; courseTitle: string; current: DashboardTab }) {
  return (
    <nav aria-label={`My progress in ${courseTitle}`} className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link
                href={`/dashboard/${courseSlug}${tab.path}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-12 items-center whitespace-nowrap border-b-[3px] px-3 text-sm font-semibold transition-colors ${
                  active ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
        <li className="ml-auto">
          <Link href={`/courses/${courseSlug}`} className="inline-flex min-h-12 items-center whitespace-nowrap px-3 text-sm font-semibold text-primary-text hover:underline">
            Go to the course
          </Link>
        </li>
      </ul>
    </nav>
  );
}
