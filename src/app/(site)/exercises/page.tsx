import type { Metadata } from "next";
import { CourseChooser } from "@/components/courses/course-chooser";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: "Exercises", description: "Each course has its own questions. Pick the course you're studying.", path: "/exercises", index: false });
}

/** Questions belong to one course, so this page only asks which one. */
export default async function ExercisesChooserPage() {
  const courses = await listPublishedCourses();
  return <CourseChooser label="Exercises" title="Exercises for *one course*" description="Each course has its own questions. Pick the course you're studying." section="exercises" courses={courses} />;
}
