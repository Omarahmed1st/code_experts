import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { can } from "@/lib/auth/permissions";
import { listTopics } from "@/server/admin/topics";
import { requireCourse } from "@/server/auth/staff";
import { TopicManager } from "./topic-manager";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Topics" };

export default async function TopicsPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const topics = await listTopics(course);
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Topics" title="Topics" description="Topics group the course's lectures, questions and files. Students see them in this order on the course page." />
      <TopicManager
        courseSlug={course.slug}
        topics={topics}
        canEdit={can(staff, "edit", course.id)}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
      />
    </div>
  );
}
