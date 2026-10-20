"use client";

// On a lecture page: notes that a signed-in student opened it, and offers
// "Mark as done". Guests see an invitation to keep their progress instead.
import { CheckCircle2, Circle } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { buttonClass } from "@/components/ui/button-styles";
import { saveLectureStatus, signInHref, useCourseState } from "./me";

export function LectureDone({ courseSlug, lectureSlug, place }: { courseSlug: string; lectureSlug: string; place: "top" | "end" }) {
  const state = useCourseState(courseSlug);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const noted = useRef(false);

  // Opening the lecture marks it "started" (once per page view; never undoes "done").
  useEffect(() => {
    if (place !== "top" || !state || noted.current) return;
    noted.current = true;
    if (!state.lectures[lectureSlug]) void saveLectureStatus(courseSlug, lectureSlug, "started").catch(() => undefined);
  }, [courseSlug, lectureSlug, place, state]);

  if (state === undefined) return place === "top" ? <span aria-hidden="true" className="invisible inline-flex min-h-11 px-4">Mark as done</span> : null;
  if (state === null) {
    if (place === "top") return null;
    return (
      <p className="mt-12 rounded-[var(--radius-card)] border border-line bg-surface p-5 text-muted">
        <a href={signInHref()} className="font-semibold text-primary-text underline-offset-4 hover:underline">
          Sign in
        </a>{" "}
        or{" "}
        <Link href="/register" className="font-semibold text-primary-text underline-offset-4 hover:underline">
          create a free account
        </Link>{" "}
        to tick off the lectures you finish and keep your answers on every device.
      </p>
    );
  }
  const done = state.lectures[lectureSlug] === "completed";
  const toggle = async () => {
    setError(null);
    setBusy(true);
    try {
      await saveLectureStatus(courseSlug, lectureSlug, done ? "not_completed" : "completed");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (place === "top") {
    return (
      <span className="inline-flex flex-col">
        <button
          type="button"
          aria-pressed={done}
          disabled={busy}
          onClick={() => void toggle()}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2c3f68] bg-[#101b33] px-4 text-sm font-semibold text-[var(--lec-ink)] hover:border-[var(--lec-green)]"
        >
          {done ? <CheckCircle2 aria-hidden="true" className="size-4 text-[var(--lec-green)]" /> : <Circle aria-hidden="true" className="size-4" />}
          {done ? "Done" : "Mark as done"}
        </button>
        {error ? (
          <span role="alert" className="mt-1 text-xs font-semibold text-[var(--lec-coral)]">
            {error}
          </span>
        ) : null}
      </span>
    );
  }
  return (
    <div className="mt-12 flex flex-wrap items-center gap-4 rounded-[var(--radius-card)] border border-line bg-surface p-5">
      <p className="flex-1 font-semibold">{done ? "You finished this lecture." : "Finished reading?"}</p>
      <button type="button" aria-pressed={done} disabled={busy} onClick={() => void toggle()} className={buttonClass(done ? "secondary" : "primary")}>
        {done ? <CheckCircle2 aria-hidden="true" className="size-4 text-easy" /> : <CheckCircle2 aria-hidden="true" className="size-4" />}
        {done ? "Done (undo)" : "Mark as done"}
      </button>
      {error ? (
        <p role="alert" className="w-full text-sm font-semibold text-hard">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/** A small "Done" / "Reading" tag on a lecture row (course and topic pages). */
export function LectureMark({ courseSlug, lectureSlug }: { courseSlug: string; lectureSlug: string }) {
  const state = useCourseState(courseSlug);
  const status = state?.lectures[lectureSlug];
  if (!status) return null;
  return (
    <span className="ex-done" data-status={status === "completed" ? "correct" : "started"}>
      {status === "completed" ? "✓ Done" : "Reading"}
    </span>
  );
}
