import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { requireSite } from "@/server/auth/staff";
import { NewCourseForm } from "./new-course-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  await requireSite("createCourse", "/admin/courses/new");
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New course" title="New course" description="A new course starts as a draft with nothing in it. It is completely separate from the other courses." />
      <NewCourseForm />
    </div>
  );
}
