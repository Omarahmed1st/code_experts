"use client";

// "Build your own exam": the student picks topics, question types, how many
// questions, a timer and when to see answers. The server draws the questions
// (spread evenly over the chosen topics) and marks them, like any exam.
import { useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";
import type { PracticeTopic, ScorableType } from "@/server/assessments/catalog";
import { AttemptRunner } from "./attempt-runner";

const TYPE_TEXT: Record<ScorableType, string> = { mcq: "Multiple choice", trace: "Trace the code", correct_code: "Correct the code" };

export function CustomExamBuilder({
  courseSlug,
  topics,
  counts,
  minutes,
  initialTopic,
}: {
  courseSlug: string;
  topics: PracticeTopic[];
  counts: readonly number[];
  minutes: readonly number[];
  initialTopic?: string;
}) {
  const [chosen, setChosen] = useState<string[]>(() =>
    initialTopic && topics.some((t) => t.slug === initialTopic) ? [initialTopic] : topics.map((t) => t.slug),
  );
  const [types, setTypes] = useState<ScorableType[]>(["mcq", "trace", "correct_code"]);
  const [count, setCount] = useState(counts.includes(10) ? 10 : (counts[0] ?? 10));
  const [timer, setTimer] = useState(minutes.includes(20) ? 20 : 0);
  const [feedback, setFeedback] = useState<"immediate" | "after_submit">("after_submit");

  const available = topics.filter((t) => chosen.includes(t.slug)).reduce((n, t) => n + types.reduce((m, ty) => m + t.counts[ty], 0), 0);
  const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);
  const canStart = chosen.length > 0 && types.length > 0 && available > 0;

  return (
    <AttemptRunner
      courseSlug={courseSlug}
      kind="custom"
      slug="exam"
      canStart={canStart}
      startOptions={() => ({ topics: chosen, types, count, minutes: timer, feedback })}
    >
      <div className="grid gap-7">
        <fieldset>
          <legend className="pick-legend">
            <b>1</b> Topics to include
          </legend>
          <div className="mt-1 flex gap-2">
            <button type="button" className={buttonClass("ghost", "min-h-9 px-3")} onClick={() => setChosen(topics.map((t) => t.slug))}>
              Select all
            </button>
            <button type="button" className={buttonClass("ghost", "min-h-9 px-3")} onClick={() => setChosen([])}>
              Clear
            </button>
          </div>
          <div className="pick-grid mt-2">
            {topics.map((t) => {
              const n = types.reduce((m, ty) => m + t.counts[ty], 0);
              return (
                <label key={t.slug} className="pick">
                  <input type="checkbox" checked={chosen.includes(t.slug)} onChange={() => setChosen(toggle(chosen, t.slug))} />
                  <span>
                    {t.title}
                    <small>
                      {n} {n === 1 ? "question" : "questions"}
                    </small>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset>
          <legend className="pick-legend">
            <b>2</b> Question types
          </legend>
          <div className="pick-grid pick-grid--row mt-2">
            {(Object.keys(TYPE_TEXT) as ScorableType[]).map((ty) => (
              <label key={ty} className="pick">
                <input type="checkbox" checked={types.includes(ty)} onChange={() => setTypes(toggle(types, ty))} />
                <span>{TYPE_TEXT[ty]}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-sm text-muted">Write-the-code questions aren&apos;t in exams: they run in your browser, so they&apos;re practice only.</p>
        </fieldset>

        <div className="grid gap-7 sm:grid-cols-2">
          <fieldset>
            <legend className="pick-legend">
              <b>3</b> How many questions
            </legend>
            <div className="pick-grid pick-grid--row mt-2">
              {counts.map((n) => (
                <label key={n} className="pick pick--small">
                  <input type="radio" name="count" checked={count === n} onChange={() => setCount(n)} />
                  <span>{n}</span>
                </label>
              ))}
            </div>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {available === 0
                ? "No questions match these choices yet."
                : available < count
                  ? `Your topics have ${available} ${available === 1 ? "question" : "questions"}, so you'll get all of them.`
                  : `${available} questions to draw from.`}
            </p>
          </fieldset>

          <fieldset>
            <legend className="pick-legend">
              <b>4</b> Timer
            </legend>
            <select
              aria-label="Timer"
              className="mt-2 min-h-11 w-full rounded-xl border border-line-strong bg-surface px-3 text-sm"
              value={timer}
              onChange={(e) => setTimer(Number(e.target.value))}
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {m === 0 ? "No timer" : `${m} minutes`}
                </option>
              ))}
            </select>
          </fieldset>
        </div>

        <fieldset>
          <legend className="pick-legend">
            <b>5</b> When to see the answers
          </legend>
          <div className="pick-grid pick-grid--row mt-2">
            <label className="pick">
              <input type="radio" name="feedback" checked={feedback === "after_submit"} onChange={() => setFeedback("after_submit")} />
              <span>
                At the end
                <small>Exam conditions: no hints, score when you submit</small>
              </span>
            </label>
            <label className="pick">
              <input type="radio" name="feedback" checked={feedback === "immediate"} onChange={() => setFeedback("immediate")} />
              <span>
                After each question
                <small>Check each answer as you go, with hints</small>
              </span>
            </label>
          </div>
        </fieldset>
      </div>
    </AttemptRunner>
  );
}
