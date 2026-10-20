"use client";

// Runs a quiz or a practice exam in the browser.
//
// - Start asks the server for the questions and a signed attempt token (the
//   server decides the questions, their order and the deadline).
// - Practice quizzes mark each answer when the student presses Check.
//   Exam-mode quizzes and practice exams mark everything on Submit, and only
//   then send answers and explanations.
// - Answers are autosaved in this browser, so a reload or a lost connection
//   doesn't lose them; the attempt resumes until its deadline.
// - The timer counts down to the server's deadline and submits at 0:00. The
//   server refuses answers that arrive long after the deadline.
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { signInHref, useMe } from "@/components/account/me";
import { buttonClass } from "@/components/ui/button-styles";
import type { PublicExercise } from "@/server/exercises/catalog";
import {
  ApiError,
  type AttemptKind,
  type AttemptResult,
  type Review,
  type StartedAttempt,
  type TryStatus,
  checkInAttempt,
  quizTryStatus,
  startAttempt,
  submitAttempt,
} from "./api";
import type { TestSummary } from "./code-answer";
import { recordAnswer } from "./local-progress";
import { type Answer, QuestionView, ReviewDetails, Verdict, emptyAnswer, isAnswered } from "./question-view";

interface Saved {
  attempt: StartedAttempt;
  /** Server time minus this browser's time, when the attempt started. */
  offset: number;
  answers: Record<string, Answer>;
  reviews: Record<string, Review>;
  current: number;
}

const storageKey = (course: string, kind: string, slug: string) => `codelab:attempt:${course}:${kind}:${slug}`;

function load(key: string): Saved | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}
function save(key: string, value: Saved | null) {
  try {
    if (value) window.localStorage.setItem(key, JSON.stringify(value));
    else window.localStorage.removeItem(key);
  } catch {
    // Storage unavailable: the attempt still works, it just isn't autosaved.
  }
}

function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h > 0 ? `${h}:${String(m).padStart(2, "0")}` : m}:${String(s).padStart(2, "0")}`;
}

function minutes(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${s % 60} s`;
}

export function AttemptRunner({
  courseSlug,
  kind,
  slug,
  startOptions,
  canStart = true,
  limited = false,
  children,
}: {
  courseSlug: string;
  kind: AttemptKind;
  slug: string;
  /** Custom exams: the student's choices, read when they press Start. */
  startOptions?: () => unknown;
  canStart?: boolean;
  /** The quiz allows a few attempts per 24 hours: show how many are left, and the lock. */
  limited?: boolean;
  /** Shown on the start screen above the Start button (the custom exam's choices). */
  children?: ReactNode;
}) {
  const key = storageKey(courseSlug, kind, slug);
  const me = useMe();
  const [state, setState] = useState<Saved | null>(null);
  const [resumable, setResumable] = useState<Saved | null>(null);
  const [phase, setPhase] = useState<"intro" | "starting" | "running" | "submitting" | "result">("intro");
  const [result, setResult] = useState<AttemptResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tests, setTests] = useState<Record<string, TestSummary | null>>({});
  const [checking, setChecking] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const dialogRef = useRef<HTMLDialogElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  // One submit at a time; the timer submits on its own only once.
  const inFlightRef = useRef(false);
  const autoTriedRef = useRef(false);
  const [tries, setTries] = useState<TryStatus | null>(null);
  const refreshTries = useCallback(() => {
    if (!limited) return;
    quizTryStatus(courseSlug, slug)
      .then(setTries)
      .catch(() => setTries(null));
  }, [courseSlug, limited, slug]);
  useEffect(refreshTries, [refreshTries]);
  const locked = tries?.unlockAt != null && tries.unlockAt > now;
  const needsAccount = limited && (tries?.signInRequired === true || me === null);

  // An unfinished attempt from before a reload can be resumed (until its deadline).
  useEffect(() => {
    const saved = load(key);
    if (!saved) return;
    const deadline = saved.attempt.deadlineAt;
    if (deadline !== null && deadline - (Date.now() + saved.offset) < -60_000) {
      save(key, null);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads browser storage once after hydration
    setResumable(saved);
  }, [key]);

  useEffect(() => {
    if (state) save(key, state);
  }, [key, state]);

  const deadline = state?.attempt.deadlineAt ?? null;
  const remaining = deadline === null || !state ? null : deadline - (now + state.offset);
  const offset = state?.offset ?? 0;
  // The latest submit, for the timer below (which shouldn't restart on every answer).
  const submitRef = useRef<(auto: boolean) => Promise<void>>(async () => undefined);
  useEffect(() => {
    if (phase !== "running" || deadline === null) return;
    const timer = setInterval(() => {
      const t = Date.now();
      setNow(t);
      // Time's up: submit what there is.
      if (deadline - (t + offset) <= 0) void submitRef.current(true);
    }, 500);
    return () => clearInterval(timer);
  }, [deadline, offset, phase]);

  const start = async () => {
    setError(null);
    setPhase("starting");
    try {
      const before = Date.now();
      const attempt = await startAttempt(courseSlug, kind, slug, startOptions?.());
      const offset = attempt.startedAt - Math.round((before + Date.now()) / 2);
      const answers = Object.fromEntries(attempt.questions.map((q) => [q.id, emptyAnswer(q)]));
      autoTriedRef.current = false;
      setTests({});
      setResult(null);
      setResumable(null);
      setState({ attempt, offset, answers, reviews: {}, current: 0 });
      refreshTries();
      setNow(Date.now());
      setPhase("running");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't start. Please try again.");
      setPhase("intro");
      refreshTries();
    }
  };

  const submit = useCallback(async (auto = false) => {
    if (!state || inFlightRef.current || (auto && autoTriedRef.current)) return;
    if (auto) autoTriedRef.current = true;
    inFlightRef.current = true;
    dialogRef.current?.close();
    setPhase("submitting");
    setError(null);
    try {
      const res = await submitAttempt(courseSlug, kind, slug, state.attempt.token, state.answers);
      for (const qr of res.questions) {
        const q = state.attempt.questions.find((x) => x.id === qr.exerciseId);
        if (q && qr.answered) recordAnswer(courseSlug, q.slug, qr.review.correct === true ? "correct" : "wrong");
      }
      setResult(res);
      setPhase("result");
      save(key, null);
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't submit. Your answers are saved in this browser; try again.");
      if (e instanceof ApiError && (e.status === 409 || e.status === 400)) {
        // The attempt can't be submitted any more (too late, or no longer valid): start again.
        save(key, null);
        setState(null);
        setPhase("intro");
      } else {
        // A network problem: wait for the student to press Submit again (the timer won't retry on its own).
        setPhase("running");
      }
    } finally {
      inFlightRef.current = false;
    }
  }, [courseSlug, key, kind, slug, state]);

  useEffect(() => {
    submitRef.current = submit;
  }, [submit]);

  const immediate = state?.attempt.feedback === "immediate";
  const questions = useMemo(() => state?.attempt.questions ?? [], [state]);
  const q: PublicExercise | undefined = questions[state?.current ?? 0];

  const setAnswer = (id: string, a: Answer) =>
    setState((s) => (s ? { ...s, answers: { ...s.answers, [id]: a } } : s));
  const go = (i: number) => {
    setState((s) => (s ? { ...s, current: i } : s));
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const checkOne = async () => {
    if (!state || !q) return;
    setChecking(true);
    setError(null);
    try {
      const review = await checkInAttempt(courseSlug, kind, slug, state.attempt.token, q.id, state.answers[q.id]);
      setState((s) => (s ? { ...s, reviews: { ...s.reviews, [q.id]: review } } : s));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't check that answer. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // ------------------------------------------------------------- intro
  if (phase === "intro" || phase === "starting") {
    return (
      <div ref={topRef} className="q-card scroll-mt-24">
        {resumable ? (
          <div className="q-feedback" data-tone="info">
            <span className="q-feedback__icon" aria-hidden="true">
              i
            </span>
            <div>
              <p className="q-feedback__title">
                {kind === "custom" ? `You have an unfinished exam: ${resumable.attempt.title}` : "You have an unfinished attempt"}
              </p>
              <p className="text-sm">
                {resumable.attempt.questions.filter((x) => isAnswered(x, resumable.answers[x.id])).length} of{" "}
                {resumable.attempt.questions.length} answered
                {resumable.attempt.deadlineAt !== null
                  ? `, ${clock(resumable.attempt.deadlineAt - (now + resumable.offset))} left`
                  : ""}
                .
              </p>
              <div className="q-actions">
                <button
                  type="button"
                  className={buttonClass("primary")}
                  onClick={() => {
                    setState(resumable);
                    setResumable(null);
                    setNow(Date.now());
                    setPhase("running");
                  }}
                >
                  Resume
                </button>
                <button
                  type="button"
                  className={buttonClass("secondary")}
                  onClick={() => {
                    save(key, null);
                    setResumable(null);
                  }}
                >
                  Discard it
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {children}
        {needsAccount ? (
          <p className="quiz-tries">
            This quiz allows {tries?.maxAttempts ?? "a few"} attempts in any 24 hours, counted on your account, so you need to sign in to take it.
          </p>
        ) : limited && tries?.maxAttempts ? (
          <p className="quiz-tries" data-locked={locked}>
            {locked
              ? `Locked: you've used all ${tries.maxAttempts} attempts. It opens again in ${clock(tries.unlockAt! - now)}.`
              : `${tries.maxAttempts - tries.used} of ${tries.maxAttempts} attempts left in the next 24 hours. Starting counts as an attempt.`}
          </p>
        ) : null}
        <div className="q-actions">
          {needsAccount ? (
            <>
              <a className={buttonClass("primary")} href={signInHref()}>
                Sign in to take the quiz
              </a>
              <Link className={buttonClass("secondary")} href={`/register?next=${encodeURIComponent(`/courses/${courseSlug}/quizzes/${slug}`)}`}>
                Create a free account
              </Link>
            </>
          ) : (
            <button type="button" className={buttonClass("primary")} onClick={() => void start()} disabled={phase === "starting" || !canStart || locked}>
              {phase === "starting" ? "Starting…" : kind === "custom" ? "Start my exam" : `Start the ${kind === "quiz" ? "quiz" : "exam"}`}
            </button>
          )}
          <span className="text-sm text-muted">
            {me
              ? "Your answers are marked on the server, and the result is saved in your history."
              : "Your answers are marked on the server; nothing is stored about you. Sign in to keep your results."}
          </span>
        </div>
        {error ? (
          <p role="alert" className="mt-3 text-sm font-semibold text-hard">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  // ------------------------------------------------------------- result
  if (phase === "result" && result) {
    const wrongSlugs = result.questions
      .filter((r) => r.review.correct !== true)
      .map((r) => questions.find((x) => x.id === r.exerciseId)?.slug)
      .filter((s): s is string => Boolean(s));
    return (
      <div ref={topRef} className="grid scroll-mt-24 gap-6">
        <section aria-labelledby="result-heading" className="lec-cinema rounded-[var(--radius-card)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-6">
            <div
              className="quiz-score"
              style={{ ["--pct" as string]: result.percent, ["--ring" as string]: result.passed ? "var(--lec-green)" : "var(--lec-coral)" }}
            >
              <div>
                <span className="text-3xl font-bold">{result.percent}%</span>
                <span className="text-xs text-[var(--lec-mute)]">
                  {result.score} / {result.maxScore} points
                </span>
              </div>
            </div>
            <div>
              <p className="lec-chapter">Result</p>
              <h2 id="result-heading" className="mt-1 text-2xl font-bold sm:text-3xl">
                {result.passed ? (
                  <>
                    <span className="lec-hot">Passed</span>: {result.correctCount} of {result.questions.length} right
                  </>
                ) : (
                  <>Not passed yet: {result.correctCount} of {result.questions.length} right</>
                )}
              </h2>
              <p className="mt-2 text-[var(--lec-mute)]">
                Pass mark {result.passThreshold}%. Time taken {minutes(result.submittedAt - result.startedAt)}
                {result.timeLimitSec ? ` of ${Math.round(result.timeLimitSec / 60)} min` : ""}.
              </p>
            </div>
          </div>
          {result.byTopic.length > 1 ? (
            <div className="table-wrap mt-6">
              <table className="q-steps" style={{ color: "var(--lec-ink)" }}>
                <thead>
                  <tr>
                    <th scope="col" style={{ color: "var(--lec-mute)" }}>
                      Topic
                    </th>
                    <th scope="col" style={{ color: "var(--lec-mute)" }}>
                      Right
                    </th>
                    <th scope="col" style={{ color: "var(--lec-mute)" }}>
                      Points
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {result.byTopic.map((t) => (
                    <tr key={t.topic ?? "none"}>
                      <td>{t.topic ? (result.topicTitles[t.topic] ?? "Other") : "Other"}</td>
                      <td>
                        {t.correct} of {t.total}
                      </td>
                      <td>
                        {t.score} / {t.maxScore}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          <div className="q-actions">
            <button type="button" className={buttonClass("primary")} onClick={() => void start()}>
              {kind === "custom" ? "Same topics, new questions" : limited ? "Back to the start" : "Take it again"}
            </button>
            {kind === "custom" ? (
              <button
                type="button"
                className={buttonClass("secondary")}
                onClick={() => {
                  setResult(null);
                  setState(null);
                  setPhase("intro");
                }}
              >
                Change my choices
              </button>
            ) : null}
            {wrongSlugs.length > 0 ? (
              <Link className={buttonClass("secondary")} href={`/courses/${courseSlug}/practice?retry=${wrongSlugs.join(",")}`}>
                Practise the {wrongSlugs.length} I missed
              </Link>
            ) : null}
            {me ? (
              <Link className={buttonClass("secondary")} href={`/dashboard/${courseSlug}/history`}>
                Saved in my history
              </Link>
            ) : null}
          </div>
        </section>

        <h2 className="text-2xl font-bold">Review your answers</h2>
        {result.questions.map((r, i) => {
          const question = questions.find((x) => x.id === r.exerciseId);
          if (!question) return null;
          return (
            <details key={r.exerciseId} className="q-card" open={r.review.correct !== true}>
              <summary className="flex min-h-11 cursor-pointer flex-wrap items-center gap-3 font-semibold">
                <span className="quiz-nav">
                  <button type="button" tabIndex={-1} aria-hidden="true" data-result={r.review.correct ? "right" : "wrong"}>
                    {i + 1}
                  </button>
                </span>
                {question.title}
                <span className="ml-auto text-sm text-muted">
                  {r.answered ? (r.review.correct ? "Right" : "Wrong") : "Not answered"} · {r.pointsAwarded}/{r.points}
                </span>
              </summary>
              <div className="mt-4">
                <QuestionView
                  q={question}
                  answer={state?.answers[question.id] ?? emptyAnswer(question)}
                  onAnswer={() => undefined}
                  tests={tests[question.id] ?? null}
                  onTests={() => undefined}
                  review={r.review}
                  locked
                  showHints={false}
                />
                <Verdict review={r.review} tests={tests[question.id] ?? null} inQuiz />
                <ReviewDetails review={r.review} />
              </div>
            </details>
          );
        })}
      </div>
    );
  }

  // ------------------------------------------------------------- running
  if (!state || !q) return null;
  const answered = questions.filter((x) => isAnswered(x, state.answers[x.id])).length;
  const review = state.reviews[q.id] ?? null;
  const index = state.current;
  return (
    <div ref={topRef} className="scroll-mt-24">
      <div className="quiz-bar">
        {state.attempt.model ? <span className="quiz-model">Model {state.attempt.model}</span> : null}
        {remaining !== null ? (
          <span className="quiz-timer" data-low={remaining < 60_000} role="timer" aria-label={`Time left: ${clock(remaining)}`}>
            ⏱ {clock(remaining)}
          </span>
        ) : null}
        <nav aria-label="Questions" className="quiz-nav">
          {questions.map((x, i) => {
            const rv = state.reviews[x.id];
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? "step" : undefined}
                data-answered={isAnswered(x, state.answers[x.id])}
                data-result={rv ? (rv.correct ? "right" : "wrong") : undefined}
                aria-label={`Question ${i + 1}${isAnswered(x, state.answers[x.id]) ? ", answered" : ""}`}
              >
                {i + 1}
              </button>
            );
          })}
        </nav>
        <span className="ml-auto text-sm text-muted">
          {answered} of {questions.length} answered
        </span>
      </div>

      <div className="q-card mt-5">
        <p className="mb-2 text-sm font-semibold text-muted">
          Question {index + 1} of {questions.length}
        </p>
        <QuestionView
          key={q.id}
          q={q}
          answer={state.answers[q.id] ?? emptyAnswer(q)}
          onAnswer={(a) => setAnswer(q.id, a)}
          tests={tests[q.id] ?? null}
          onTests={(t) => setTests((all) => ({ ...all, [q.id]: t }))}
          review={review}
          locked={review !== null || phase === "submitting"}
          showHints={immediate}
        />
        {review ? <Verdict review={review} tests={tests[q.id] ?? null} inQuiz /> : null}
        {error ? (
          <p role="alert" className="mt-4 text-sm font-semibold text-hard">
            {error}
          </p>
        ) : null}
        <div className="q-actions">
          <button type="button" className={buttonClass("secondary")} disabled={index === 0} onClick={() => go(index - 1)}>
            Previous
          </button>
          {immediate && !review ? (
            <button
              type="button"
              className={buttonClass("primary")}
              disabled={checking || !isAnswered(q, state.answers[q.id])}
              onClick={() => void checkOne()}
            >
              {checking ? "Checking…" : "Check answer"}
            </button>
          ) : null}
          {index + 1 < questions.length ? (
            <button type="button" className={buttonClass(immediate && !review ? "secondary" : "primary")} onClick={() => go(index + 1)}>
              Next question
            </button>
          ) : null}
          <button
            type="button"
            className={buttonClass(index + 1 === questions.length ? "primary" : "ghost")}
            disabled={phase === "submitting"}
            onClick={() => dialogRef.current?.showModal()}
          >
            {phase === "submitting" ? "Submitting…" : "Submit"}
          </button>
        </div>
        {review ? <ReviewDetails review={review} /> : null}
      </div>

      <dialog ref={dialogRef} className="quiz-dialog" aria-labelledby="submit-title">
        <h2 id="submit-title" className="text-xl font-bold">
          Submit {state.attempt.title}?
        </h2>
        <p className="mt-2">
          You answered {answered} of {questions.length} questions.
          {answered < questions.length ? ` ${questions.length - answered} unanswered will count as wrong.` : ""} You can't change answers after
          submitting.
        </p>
        <div className="q-actions">
          <button type="button" className={buttonClass("primary")} onClick={() => void submit()}>
            Submit now
          </button>
          <button type="button" className={buttonClass("secondary")} onClick={() => dialogRef.current?.close()}>
            Keep working
          </button>
        </div>
      </dialog>
    </div>
  );
}
