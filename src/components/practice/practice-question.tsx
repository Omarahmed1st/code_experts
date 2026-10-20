"use client";

// A question answered for practice: check it, read the feedback, try again.
// Used on single exercise pages and in practice sets. Marking happens on the
// server (POST /api/courses/<course>/exercises/<slug>/check).
import { useCallback, useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";
import type { CompareMode } from "@/lib/grading/output";
import type { PublicExercise } from "@/server/exercises/catalog";
import { ApiError, type Review, checkExercise } from "./api";
import { type TestSummary, runTests } from "./code-answer";
import { recordAnswer } from "./local-progress";
import { type Answer, type PracticeOutcome, QuestionView, ReviewDetails, Verdict, emptyAnswer, isAnswered, practiceOutcome } from "./question-view";
import { DRAFT_TEXT, useCodeDraft } from "./use-code-draft";

export function PracticeQuestion({
  q,
  courseSlug,
  heading = "h2",
  onMarked,
}: {
  q: PublicExercise;
  courseSlug: string;
  heading?: "h1" | "h2";
  onMarked?: (outcome: PracticeOutcome) => void;
}) {
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(q));
  const [tests, setTests] = useState<TestSummary | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const draft = useCodeDraft(courseSlug, q, answer, setAnswer);

  const check = useCallback(async () => {
    setError(null);
    let summary = tests;
    let sent = answer;
    // Code answers: run the tests on the current code first, so the mark and the tests agree.
    if (answer.kind === "code" && q.tests.length > 0 && (!summary || summary.code !== answer.code)) {
      setBusy("Running the tests in your browser…");
      summary = await runTests(q.codeLanguage ?? "text", answer.code, q.tests, q.compare as CompareMode);
      setTests(summary);
      sent = { kind: "code", code: answer.code, tests: { passed: summary.passed, total: summary.total } };
    }
    setBusy("Checking…");
    try {
      const result = await checkExercise(courseSlug, q.slug, sent);
      setReview(result);
      const outcome = practiceOutcome(result, summary);
      recordAnswer(courseSlug, q.slug, outcome);
      onMarked?.(outcome);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }, [answer, courseSlug, onMarked, q, tests]);

  const canCheck =
    (q.type === "write_code" || q.type === "correct_code") && !q.ask ? answer.kind === "code" && answer.code.trim() !== "" : isAnswered(q, answer);

  return (
    <div className="q-card">
      <QuestionView
        q={q}
        answer={answer}
        onAnswer={(a) => {
          setAnswer(a);
          if (review && (q.type === "mcq" || q.type === "trace" || q.ask)) setReview(null);
        }}
        tests={tests}
        onTests={setTests}
        review={review}
        locked={review !== null && (q.type === "mcq" || q.type === "trace" || q.ask !== null)}
        heading={heading}
      />
      {draft !== "off" ? (
        <p className="mt-2 text-xs text-muted" role="status">
          {DRAFT_TEXT[draft]}
        </p>
      ) : null}
      {review ? <Verdict review={review} tests={tests} inQuiz={false} /> : null}
      {error ? (
        <p role="alert" className="mt-4 text-sm font-semibold text-hard">
          {error}
        </p>
      ) : null}
      <div className="q-actions">
        {!review ? (
          <button type="button" className={buttonClass("primary")} onClick={() => void check()} disabled={!canCheck || busy !== null}>
            {busy ??
              (q.ask === "order" ? "Check my order" : q.ask ? "Check answer" : q.type === "write_code" ? "Submit my program" : q.type === "correct_code" ? "Submit my fix" : "Check answer")}
          </button>
        ) : (
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => {
              setReview(null);
              if (q.type === "mcq") setAnswer(emptyAnswer(q));
            }}
          >
            Try again
          </button>
        )}
        {!review && !canCheck ? (
          <span className="text-sm text-muted">
            {q.ask === "order"
              ? "Move the lines into the right order first."
              : q.ask === "blanks"
                ? "Fill in the blanks first."
                : q.ask
                  ? "Type your answer first."
                  : q.type === "mcq"
                    ? "Pick an answer first."
                    : q.type === "trace"
                      ? "Type the output first."
                      : ""}
          </span>
        ) : null}
      </div>
      {review ? <ReviewDetails review={review} /> : null}
    </div>
  );
}
