import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { requireCourse } from "@/server/auth/staff";
import { ImportForm } from "./import-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Import questions" };

export default async function ImportQuestionsPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Question bank"
        title="Import questions"
        description="Upload the JSON file from “Export all”, or one or more question Markdown files (the content format). Each question is checked first; a question whose address already exists in this course is updated, the rest are added."
      />
      <ImportForm courseSlug={course.slug} canPublish={can(staff, "publish", course.id)} />
    </div>
  );
}
