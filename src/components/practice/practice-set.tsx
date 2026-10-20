"use client";

// A practice set: several questions one after another, each marked as soon as
// it is checked, with a summary at the end. Nothing is timed or scored here;
// right and wrong answers are remembered in this browser for "retry my mistakes".
import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";
import type { PublicExercise } from "@/server/exercises/catalog";
import { PracticeQuestion } from "./practice-question";
import type { PracticeOutcome } from "./question-view";

export function PracticeSet({ questions, courseSlug, againHref }: { questions: PublicExercise[]; courseSlug: string; againHref: string }) {
  const [index, setIndex] = useState(0);
  const [marks, setMarks] = useState<Record<string, PracticeOutcome>>({});
  const [done, setDone] = useState(false);
  const q = questions[index];
  const right = Object.values(marks).filter((m) => m === "correct").length;
  // Programs that passed their tests in the student's browser: not marked by the server.
  const passedTests = Object.values(marks).filter((m) => m === "passed_tests").length;

  if (done || !q) {
    const wrong = questions.filter((x) => marks[x.id] === "wrong");
    return (
      <div className="q-card text-center">
        <h2 className="text-2xl font-bold">Set finished</h2>
        <p className="mt-2 text-lg">
          {right} of {questions.length} right
          {Object.keys(marks).length < questions.length ? ` (${questions.length - Object.keys(marks).length} skipped)` : ""}.
        </p>
        {passedTests > 0 ? (
          <p className="mt-1 text-muted">
            {passedTests === 1 ? "1 program" : `${passedTests} programs`} also passed every test in your browser. Browser test runs aren&apos;t marked, so
            they aren&apos;t counted as right.
          </p>
        ) : null}
        {wrong.length > 0 ? (
          <div className="mt-6 text-left">
            <h3 className="font-semibold">Worth another look</h3>
            <ul className="mt-2 grid gap-1">
              {wrong.map((x) => (
                <li key={x.id}>
                  <Link className="font-semibold text-primary-text underline-offset-4 hover:underline" href={`/courses/${courseSlug}/exercises/${x.slug}`}>
                    {x.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="q-actions justify-center">
          <a className={buttonClass("primary")} href={againHref}>
            New set
          </a>
          <Link className={buttonClass("secondary")} href={`/courses/${courseSlug}/practice`}>
            Back to practice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="quiz-bar mb-5">
        <span className="font-semibold">
          Question {index + 1} of {questions.length}
        </span>
        <span className="text-sm text-muted">{right} right so far</span>
        <span className="ml-auto flex gap-2">
          <button type="button" className={buttonClass("secondary")} disabled={index === 0} onClick={() => setIndex(index - 1)}>
            Previous
          </button>
          <button
            type="button"
            className={buttonClass(marks[q.id] !== undefined ? "primary" : "secondary")}
            onClick={() => (index + 1 < questions.length ? setIndex(index + 1) : setDone(true))}
          >
            {index + 1 < questions.length ? (marks[q.id] !== undefined ? "Next question" : "Skip") : "Finish"}
          </button>
        </span>
      </div>
      {/* key: a fresh question state for each question */}
      <PracticeQuestion key={q.id} q={q} courseSlug={courseSlug} onMarked={(outcome) => setMarks((m) => ({ ...m, [q.id]: outcome }))} />
    </div>
  );
}
