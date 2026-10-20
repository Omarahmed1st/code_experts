import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { getAdminResource } from "@/server/admin/resources";
import { listTopics } from "@/server/admin/topics";
import { requireCourse } from "@/server/auth/staff";
import { ResourceEditor } from "../resource-editor";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit file" };

export default async function EditFilePage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { staff, course } = await requireCourse(slug, "view");
  const [resource, topics] = await Promise.all([getAdminResource(course, id), listTopics(course)]);
  if (!resource) notFound();
  return (
    <div className="grid gap-6">
      <PageHeader chapter="File" title={resource.title} />
      <ResourceEditor
        courseSlug={course.slug}
        resource={resource}
        topics={topics.map((t) => ({ id: t.id, title: t.title }))}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
      />
    </div>
  );
}
