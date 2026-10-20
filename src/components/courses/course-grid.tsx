import { Layers } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { CourseSummary } from "@/server/courses/scope";
import { CourseCard } from "./course-card";

export function CourseGrid({ courses, lectureCounts }: { courses: CourseSummary[]; lectureCounts?: Record<string, number> }) {
  if (courses.length === 0) {
    return (
      <EmptyState icon={<Layers aria-hidden="true" className="size-6" />} title="No courses yet">
        Courses appear here as soon as they are published.
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-5 md:grid-cols-3">
      {courses.map((course) => (
        <CourseCard key={course.slug} course={course} lectures={lectureCounts ? (lectureCounts[course.courseId] ?? 0) : undefined} />
      ))}
    </div>
  );
}
