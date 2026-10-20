import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { isAdmin } from "@/lib/auth/permissions";
import { getSeo } from "@/server/admin/seo";
import { requireCourse } from "@/server/auth/staff";
import { CourseSettings } from "./course-settings";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Course settings" };

export default async function CourseSettingsPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "settings");
  const seo = await getSeo(`/courses/${course.slug}`);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Settings" title="Course settings" description="The course's name and description, how it shows in search engines, and whether students can see it." />
      <CourseSettings
        key={course.updatedAt}
        course={{
          slug: course.slug,
          title: course.title,
          shortTitle: course.shortTitle,
          description: course.description,
          primaryLanguage: course.primaryLanguage,
          tags: course.tags,
          status: course.status,
        }}
        seo={seo}
        isAdmin={isAdmin(staff)}
      />
    </div>
  );
}
