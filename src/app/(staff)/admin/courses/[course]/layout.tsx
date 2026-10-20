import { ExternalLink } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { CourseTabs } from "@/components/admin/admin-nav";
import { StatusBadge } from "@/components/admin/form-parts";
import { can } from "@/lib/auth/permissions";
import { requireCourse } from "@/server/auth/staff";

type Props = { children: ReactNode; params: Promise<{ course: string }> };

/** Every page of one course in the admin: its name, status and sections. Access is checked here and again by each page. */
export default async function CourseAdminLayout({ children, params }: Props) {
  const { course: slug } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const base = `/admin/courses/${course.slug}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/topics`, label: "Topics" },
    { href: `${base}/lectures`, label: "Lectures" },
    { href: `${base}/questions`, label: "Questions" },
    { href: `${base}/quizzes`, label: "Quizzes" },
    { href: `${base}/exams`, label: "Practice exams" },
    { href: `${base}/files`, label: "Files" },
    ...(can(staff, "settings", course.id) ? [{ href: `${base}/settings`, label: "Settings" }] : []),
    { href: `${base}/students`, label: "Students" },
    { href: `${base}/activity`, label: "Activity" },
  ];
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-muted">Course</p>
        <p className="text-sm font-semibold">{course.title}</p>
        <StatusBadge status={course.status} />
        {course.status === "published" ? (
          <Link href={`/courses/${course.slug}`} className="ml-auto inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-text hover:underline">
            View on the site <ExternalLink aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
      <CourseTabs tabs={tabs} />
      {children}
    </div>
  );
}
