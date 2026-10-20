import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { currentTime } from "@/lib/admin/time";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { can } from "@/lib/auth/permissions";
import { listLessons } from "@/server/admin/lessons";
import { requireCourse } from "@/server/auth/staff";
import { LectureTable } from "./lecture-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Lectures" };

export default async function LecturesPage({ params }: { params: Promise<{ course: string }> }) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const lessons = await listLessons(course);
  const canEdit = can(staff, "edit", course.id);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Lectures"
        title="Lectures"
        description="Students see live lectures in this order. Drafts and scheduled lectures stay hidden until they go live."
        actions={
          canEdit ? (
            <Link href={`/admin/courses/${course.slug}/lectures/new`} className={buttonClass("primary")}>
              <Plus aria-hidden="true" className="size-4" /> New lecture
            </Link>
          ) : null
        }
      />
      <LectureTable
        courseSlug={course.slug}
        lessons={lessons}
        now={currentTime()}
        canEdit={canEdit}
        canPublish={can(staff, "publish", course.id)}
        canDelete={can(staff, "delete", course.id)}
      />
    </div>
  );
}
