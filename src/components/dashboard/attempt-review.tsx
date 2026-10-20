"use client";

// The questions of one saved quiz or exam, shown the way the result page shows
// them: the student's answer, right or wrong, the explanation and the model
// answer. Nothing can be changed here.
import { type Answer, QuestionView, ReviewDetails, Verdict, emptyAnswer } from "@/components/practice/question-view";
import type { PublicExercise } from "@/server/exercises/catalog";
import type { ReviewedQuestion } from "@/server/students/history";

/** The stored response as an answer the question view can show (an empty one if it can't be read). */
function toAnswer(q: PublicExercise, stored: unknown): Answer {
  const empty = emptyAnswer(q);
  if (!stored || typeof stored !== "object") return empty;
  const r = stored as Record<string, unknown>;
  if (empty.kind === "mcq" && Array.isArray(r.selected)) {
    return { kind: "mcq", selected: r.selected.filter((s): s is string => typeof s === "string") };
  }
  if (empty.kind === "trace" && typeof r.answer === "string") return { kind: "trace", answer: r.answer };
  if (empty.kind === "code" && typeof r.code === "string") {
    const strings = (v: unknown) => (Array.isArray(v) && v.every((s) => typeof s === "string") ? (v as string[]) : undefined);
    const blanks = strings(r.blanks);
    const lines = strings(r.lines);
    return { kind: "code", code: r.code, ...(blanks ? { blanks } : empty.blanks ? { blanks: empty.blanks } : {}), ...(lines ? { lines } : empty.lines ? { lines: empty.lines } : {}) };
  }
  return empty;
}

export function AttemptReview({ questions }: { questions: ReviewedQuestion[] }) {
  return (
    <div className="grid gap-4">
      {questions.map((r, i) => (
        <details key={r.question.id} className="q-card" open={!r.correct}>
          <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 font-semibold">
            <span className="quiz-nav">
              <button type="button" tabIndex={-1} aria-hidden="true" data-result={r.correct ? "right" : "wrong"}>
                {i + 1}
              </button>
            </span>
            {r.question.title}
            <span className="ml-auto text-sm text-muted">
              {r.answered ? (r.correct ? "Right" : "Wrong") : "Not answered"} · {r.pointsAwarded}/{r.points}
            </span>
          </summary>
          <div className="mt-4">
            <QuestionView
              q={r.question}
              answer={r.answered ? toAnswer(r.question, r.response) : emptyAnswer(r.question)}
              onAnswer={() => undefined}
              tests={null}
              onTests={() => undefined}
              review={r.review}
              locked
              showHints={false}
            />
            <Verdict review={r.review} tests={null} inQuiz />
            <ReviewDetails review={r.review} />
          </div>
        </details>
      ))}
    </div>
  );
}
