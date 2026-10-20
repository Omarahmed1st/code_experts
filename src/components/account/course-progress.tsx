"use client";

// On a course's home page: the signed-in student's progress in this course,
// or for guests a short invitation to keep it.
import Link from "next/link";
import { signInHref, useCourseState } from "./me";

export function CourseProgressStrip({ courseSlug, lectureSlugs }: { courseSlug: string; lectureSlugs: string[] }) {
  const state = useCourseState(courseSlug);
  if (state === undefined) return <p aria-hidden="true" className="mt-6 min-h-6" />;
  if (state === null) {
    return (
      <p className="mt-6 text-sm text-[var(--lec-mute)]">
        <a href={signInHref()} className="font-semibold text-[var(--lec-yel)] underline-offset-4 hover:underline">
          Sign in
        </a>{" "}
        to tick off lectures and keep your answers and quiz results.
      </p>
    );
  }
  const done = lectureSlugs.filter((s) => state.lectures[s] === "completed").length;
  const solved = Object.values(state.answers).filter((a) => a.status === "correct").length;
  const pct = lectureSlugs.length ? Math.round((done * 100) / lectureSlugs.length) : 0;
  return (
    <div className="mt-6 max-w-xl">
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[var(--lec-ink)]">
        <span>
          <b className="font-mono text-[var(--lec-green)]">{done}</b> of {lectureSlugs.length} lectures done
        </span>
        <span>
          <b className="font-mono text-[var(--lec-sky)]">{solved}</b> {solved === 1 ? "question" : "questions"} solved
        </span>
        <Link href={`/dashboard/${courseSlug}`} className="font-semibold text-[var(--lec-yel)] underline-offset-4 hover:underline">
          My progress
        </Link>
      </p>
      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-[#1d2b4a]"
        role="progressbar"
        aria-label="Lectures done"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
      >
        <div className="h-full rounded-full bg-[var(--lec-green)]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
