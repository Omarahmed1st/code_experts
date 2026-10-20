import type { Metadata } from "next";
import { CourseChooser } from "@/components/courses/course-chooser";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: "Practice", description: "Practice sets come from one course at a time. Pick the course you're studying.", path: "/practice", index: false });
}

/** Questions belong to one course, so this page only asks which one. */
export default async function PracticeChooserPage() {
  const courses = await listPublishedCourses();
  return <CourseChooser label="Practice" title="Practise *one course*" description="Practice sets come from one course at a time. Pick the course you're studying." section="practice" courses={courses} />;
}
