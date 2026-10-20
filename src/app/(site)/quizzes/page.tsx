import type { Metadata } from "next";
import { CourseChooser } from "@/components/courses/course-chooser";
import { listPublishedCourses } from "@/server/courses/scope";
import { pageMetadata } from "@/server/seo";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return pageMetadata({ title: "Quizzes", description: "Each course has its own quizzes and practice exams. Pick the course you're studying.", path: "/quizzes", index: false });
}

/** Questions belong to one course, so this page only asks which one. */
export default async function QuizzesChooserPage() {
  const courses = await listPublishedCourses();
  return <CourseChooser label="Quizzes" title="Quizzes for *one course*" description="Each course has its own quizzes and practice exams. Pick the course you're studying." section="quizzes" courses={courses} />;
}
