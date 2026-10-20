"use client";

// Exercise cards for a course, with a "done" mark from the student's account
// (signed in) or this browser's practice memory (guests).
import Link from "next/link";
import { DifficultyBadge } from "@/components/ui/difficulty-badge";
import type { ExerciseCard } from "@/server/exercises/catalog";
import { usePracticeMemory } from "./local-progress";
import { typeLabel } from "./question-view";

export function ExerciseList({ courseSlug, exercises }: { courseSlug: string; exercises: ExerciseCard[] }) {
  const { memory, where } = usePracticeMemory(courseSlug);

  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {exercises.map((ex) => {
        const label = typeLabel(ex);
        const status = memory[ex.slug]?.status;
        return (
          <li key={ex.slug}>
            <article className="relative flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card hover:border-primary">
              <p className="q-meta">
                <span className="q-type">
                  <span aria-hidden="true" className={`lec-shape lec-shape--${label.shape}`} />
                  {label.text}
                </span>
                {ex.topic ? <span>{ex.topic.title}</span> : null}
              </p>
              <h2 className="text-lg font-semibold">
                <Link href={`/courses/${courseSlug}/exercises/${ex.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
                  {ex.title}
                </Link>
              </h2>
              <p className="mt-auto flex flex-wrap items-center gap-2">
                <DifficultyBadge level={ex.difficulty} />
                {ex.isDemo ? <span className="demo-badge">Demo question</span> : null}
                {status ? (
                  <span className="ex-done" data-status={status}>
                    {status === "correct" ? "✓ Solved" : status === "passed_tests" ? "✓ Tests passed in your browser" : "✗ Try again"}
                    <span className="sr-only">{where === "account" ? " (saved on your account)" : " (remembered in this browser)"}</span>
                  </span>
                ) : null}
              </p>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
