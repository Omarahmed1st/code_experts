import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { listTopics } from "@/server/admin/topics";
import { requireCourse } from "@/server/auth/staff";
import { ResourceEditor } from "../resource-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New file" };

export default async function NewFilePage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "edit");
  const topics = await listTopics(course);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="New file" title="New file" description="Give it a title first; the upload comes on the next screen." />
      <ResourceEditor
        courseSlug={course.slug}
        resource={null}
        topics={topics.map((t) => ({ id: t.id, title: t.title }))}
        canEdit
        canPublish={can(staff, "publish", course.id)}
        canDelete={false}
      />
    </div>
  );
}
