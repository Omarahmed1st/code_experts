"use client";

// "Retry my mistakes": the questions last answered wrong, as a practice set.
// Signed in, the list comes from the student's account; for guests it lives
// only in this browser.
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";
import { clearProgress, usePracticeMemory } from "./local-progress";

export function MistakesCard({ courseSlug }: { courseSlug: string }) {
  const { memory, where } = usePracticeMemory(courseSlug);
  const entries = Object.entries(memory);
  const counts =
    where === null
      ? null
      : {
          // Most recent mistakes first; a practice set takes up to 50.
          wrong: entries
            .filter(([, m]) => m.status === "wrong")
            .sort((a, b) => b[1].at - a[1].at)
            .map(([slug]) => slug)
            .slice(0, 50),
          solved: entries.filter(([, m]) => m.status === "correct").length,
        };
  const place = where === "account" ? "on your account" : "in this browser";

  return (
    <section aria-labelledby="mistakes-heading" className="q-card flex h-full flex-col">
      <h2 id="mistakes-heading" className="text-xl font-bold">
        Retry my mistakes
      </h2>
      {counts === null ? (
        <p className="mt-2 text-muted">Checking your progress…</p>
      ) : counts.wrong.length === 0 ? (
        <p className="mt-2 text-muted">
          {counts.solved > 0
            ? `No mistakes waiting. You've solved ${counts.solved} ${counts.solved === 1 ? "question" : "questions"} ${place}.`
            : "Questions you get wrong will wait here so you can try them again."}
        </p>
      ) : (
        <p className="mt-2 text-muted">
          {counts.wrong.length} {counts.wrong.length === 1 ? "question" : "questions"} you last answered wrong. Get one right and it leaves this list.
        </p>
      )}
      <div className="q-actions mt-auto">
        {counts && counts.wrong.length > 0 ? (
          <Link className={buttonClass("primary")} href={`/courses/${courseSlug}/practice?retry=${counts.wrong.join(",")}`}>
            Retry {counts.wrong.length} {counts.wrong.length === 1 ? "question" : "questions"}
          </Link>
        ) : null}
        {where === "browser" && counts && (counts.wrong.length > 0 || counts.solved > 0) ? (
          <button
            type="button"
            className={buttonClass("ghost")}
            onClick={() => {
              if (window.confirm("Forget which questions you solved or missed in this course? This only affects this browser.")) clearProgress(courseSlug);
            }}
          >
            Forget my progress
          </button>
        ) : null}
      </div>
      {where === "account" ? (
        <p className="mt-3 text-xs text-muted">
          Saved on your account.{" "}
          <Link className="font-semibold underline-offset-4 hover:underline" href={`/dashboard/${courseSlug}`}>
            See your progress
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted">
          Remembered only in this browser.{" "}
          <Link className="font-semibold underline-offset-4 hover:underline" href={`/register?next=${encodeURIComponent(`/courses/${courseSlug}/practice`)}`}>
            Create a free account
          </Link>{" "}
          to keep it everywhere.
        </p>
      )}
    </section>
  );
}
