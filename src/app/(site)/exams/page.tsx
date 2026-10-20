import type { Metadata } from "next";
import { CourseChooser } from "@/components/courses/course-chooser";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: "Practice exams", description: "Each course has its own practice exams. Pick the course you're studying.", path: "/exams", index: false });
}

/** Questions belong to one course, so this page only asks which one. */
export default async function ExamsChooserPage() {
  const courses = await listPublishedCourses();
  return <CourseChooser label="Practice exams" title="Practice exams for *one course*" description="Each course has its own practice exams. Pick the course you're studying." section="exams" courses={courses} />;
}
