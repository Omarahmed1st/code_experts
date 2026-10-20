import Link from "next/link";

export type CourseTab = "overview" | "exercises" | "practice" | "quizzes" | "resources" | "search";

const TABS: { id: CourseTab; label: string; path: string }[] = [
  { id: "overview", label: "Lectures", path: "" },
  { id: "exercises", label: "Exercises", path: "/exercises" },
  { id: "practice", label: "Practice", path: "/practice" },
  { id: "quizzes", label: "Quizzes & exams", path: "/quizzes" },
  { id: "resources", label: "Resources", path: "/resources" },
  { id: "search", label: "Search", path: "/search" },
];

/** The course's own sections. Everything linked here belongs to this course only. */
export function CourseNav({ courseSlug, courseTitle, current }: { courseSlug: string; courseTitle: string; current?: CourseTab }) {
  return (
    <nav aria-label={`${courseTitle} sections`} className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
        {TABS.map((tab) => {
          const active = tab.id === current;
          return (
            <li key={tab.id}>
              <Link
                href={`/courses/${courseSlug}${tab.path}`}
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
      </ul>
    </nav>
  );
}
