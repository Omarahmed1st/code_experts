"use client";

// Which questions were answered right or wrong, per course.
//
// - Signed-in students: kept on their account. The server records every
//   marked answer itself (practice, quizzes, exams); this module only reads
//   the marks (src/components/account/me.ts) and updates them on the page.
// - Guests: remembered in this browser only. It never leaves the device, it
//   isn't used for marks, and it can be cleared at any time. Every read and
//   write tolerates storage being unavailable (private windows, blocked site
//   data).
import { useEffect, useState } from "react";
import { currentMe, noteAnswer, useCourseState } from "@/components/account/me";
import type { PracticeOutcome } from "./question-view";

export interface QuestionMemory {
  /**
   * "correct" once answered right; "passed_tests" when the program passed every
   * test in the browser but wasn't marked right; "wrong" otherwise.
   */
  status: PracticeOutcome;
  at: number;
}

const RANK: Record<PracticeOutcome, number> = { wrong: 0, passed_tests: 1, correct: 2 };

/** A new outcome never hides a better earlier one (a right answer stays right). */
export function betterOutcome(before: PracticeOutcome | undefined, now: PracticeOutcome): PracticeOutcome {
  return before !== undefined && RANK[before] > RANK[now] ? before : now;
}

const KEY = (courseSlug: string) => `codelab:practice:${courseSlug}`;
const EVENT = "codelab:practice-progress";

export function readProgress(courseSlug: string): Record<string, QuestionMemory> {
  try {
    const raw = window.localStorage.getItem(KEY(courseSlug));
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Record<string, QuestionMemory>) : {};
  } catch {
    return {};
  }
}

/** Records an answer. A right answer replaces an earlier wrong one; a wrong one never hides an earlier success. */
export function recordAnswer(courseSlug: string, exerciseSlug: string, outcome: PracticeOutcome) {
  // Signed in: the server already kept it; show it on the page straight away.
  if (currentMe()) {
    noteAnswer(courseSlug, exerciseSlug, outcome);
    return;
  }
  try {
    const all = readProgress(courseSlug);
    all[exerciseSlug] = { status: betterOutcome(all[exerciseSlug]?.status, outcome), at: Date.now() };
    window.localStorage.setItem(KEY(courseSlug), JSON.stringify(all));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Storage unavailable: practice still works, it just isn't remembered.
  }
}

export function clearProgress(courseSlug: string) {
  try {
    window.localStorage.removeItem(KEY(courseSlug));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // ignore
  }
}

export function onProgressChange(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}

export interface PracticeMemory {
  memory: Record<string, QuestionMemory>;
  /** Where the marks come from; null while that isn't known yet. */
  where: "account" | "browser" | null;
}

/** The marks for a course: the student's account when signed in, this browser otherwise. */
export function usePracticeMemory(courseSlug: string): PracticeMemory {
  const account = useCourseState(courseSlug);
  const [local, setLocal] = useState<Record<string, QuestionMemory>>({});
  useEffect(() => {
    if (account !== null) return;
    const refresh = () => setLocal(readProgress(courseSlug));
    refresh();
    return onProgressChange(refresh);
  }, [account, courseSlug]);
  if (account === undefined) return { memory: {}, where: null };
  if (account) return { memory: account.answers, where: "account" };
  return { memory: local, where: "browser" };
}
