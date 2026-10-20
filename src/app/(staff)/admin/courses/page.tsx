import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { listAdminCourses } from "@/server/admin/courses";
import { requireSite } from "@/server/auth/staff";
import { CourseOrder } from "./course-order";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "All courses" };

export default async function AllCoursesPage() {
  await requireSite("createCourse", "/admin/courses");
  const courses = await listAdminCourses(null);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Courses"
        title="All courses"
        description="Each course is separate: its own lectures, questions, quizzes and files. Students see published courses in this order."
        actions={
          <Link href="/admin/courses/new" className={buttonClass("primary")}>
            <Plus aria-hidden="true" className="size-4" /> New course
          </Link>
        }
      />
      <CourseOrder courses={courses.map((c) => ({ id: c.id, slug: c.slug, title: c.title, status: c.status, lectures: c.counts.liveLectures + c.counts.draftLectures + c.counts.scheduledLectures }))} />
    </div>
  );
}
