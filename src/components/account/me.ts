"use client";

// The signed-in student, as the browser sees it. Public pages are the same for
// everyone; after they load, these small stores ask the server who is signed
// in (GET /api/me) and, on course pages, what this student has done in the
// course (GET /api/me/courses/<course>/state). Every component on the page
// shares one request of each.
import { useEffect, useState } from "react";
import type { MeResponse } from "@/app/api/me/route";
import type { BookmarkKind, CourseState, LectureStatus } from "@/server/students/progress";

export type Me = MeResponse["user"];
export type { BookmarkKind, CourseState, LectureStatus };

// ------------------------------------------------------------------ who

let me: Me | undefined;
let mePromise: Promise<Me> | null = null;
const meListeners = new Set<() => void>();

function loadMe(): Promise<Me> {
  mePromise ??= fetch("/api/me", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<MeResponse>) : { user: null }))
    .then((body) => body.user)
    .catch(() => null)
    .then((user) => {
      me = user;
      for (const l of meListeners) l();
      return user;
    });
  return mePromise;
}

/** Who is signed in: undefined while loading, null for guests. */
export function useMe(): Me | undefined {
  const [value, setValue] = useState<Me | undefined>(me);
  useEffect(() => {
    const update = () => setValue(me);
    meListeners.add(update);
    void loadMe().then(update);
    return () => {
      meListeners.delete(update);
    };
  }, []);
  return value;
}

/** Who is signed in, as a promise (shares the page's one GET /api/me). */
export function whoIsSignedIn(): Promise<Me> {
  return loadMe();
}

/** The answer so far without waiting (undefined: not known yet). */
export function currentMe(): Me | undefined {
  return me;
}

/** Asks the server again, e.g. after the student renames themselves, and updates the header. */
export function refreshMe(): Promise<Me> {
  mePromise = null;
  return loadMe();
}

export async function signOut(): Promise<void> {
  await fetch("/api/me/sign-out", { method: "POST", credentials: "same-origin" }).catch(() => undefined);
  window.location.assign("/");
}

// ------------------------------------------------------------------ course state

interface Store {
  /** undefined: loading; null: guest (nothing is kept on the server). */
  state: CourseState | null | undefined;
  promise: Promise<void> | null;
  listeners: Set<() => void>;
}
const stores = new Map<string, Store>();

function store(courseSlug: string): Store {
  let s = stores.get(courseSlug);
  if (!s) {
    s = { state: undefined, promise: null, listeners: new Set() };
    stores.set(courseSlug, s);
  }
  return s;
}

function emit(s: Store) {
  for (const l of s.listeners) l();
}

function loadState(courseSlug: string): Promise<void> {
  const s = store(courseSlug);
  s.promise ??= fetch(`/api/me/courses/${encodeURIComponent(courseSlug)}/state`, { credentials: "same-origin", cache: "no-store" })
    .then((r): Promise<{ signedIn: boolean } & Partial<CourseState>> => (r.ok ? r.json() : Promise.resolve({ signedIn: false })))
    .then((body) => {
      s.state = body.signedIn ? { lectures: body.lectures ?? {}, answers: body.answers ?? {}, bookmarks: body.bookmarks ?? [] } : null;
    })
    .catch(() => {
      s.state = null;
    })
    .then(() => emit(s));
  return s.promise;
}

/** This student's marks in a course: undefined while loading, null for guests. */
export function useCourseState(courseSlug: string): CourseState | null | undefined {
  const [value, setValue] = useState<CourseState | null | undefined>(() => stores.get(courseSlug)?.state);
  useEffect(() => {
    const s = store(courseSlug);
    const update = () => setValue(s.state);
    s.listeners.add(update);
    void loadState(courseSlug).then(update);
    return () => {
      s.listeners.delete(update);
    };
  }, [courseSlug]);
  return value;
}

/** The loaded state, if any (for code that runs outside React). */
export function currentCourseState(courseSlug: string): CourseState | null | undefined {
  return stores.get(courseSlug)?.state;
}

/** Changes the loaded state right away (the server is told separately). */
export function patchCourseState(courseSlug: string, change: (state: CourseState) => CourseState) {
  const s = store(courseSlug);
  if (!s.state) return;
  s.state = change(s.state);
  emit(s);
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) throw new Error(data?.error ?? "Couldn't save. Please try again.");
  return data;
}

export async function saveLectureStatus(courseSlug: string, lecture: string, status: LectureStatus | "not_completed"): Promise<void> {
  const before = currentCourseState(courseSlug)?.lectures[lecture];
  if (status !== "started") {
    patchCourseState(courseSlug, (s) => ({ ...s, lectures: { ...s.lectures, [lecture]: status === "completed" ? "completed" : "started" } }));
  }
  try {
    const { status: now } = await post<{ status: LectureStatus }>(`/api/me/courses/${encodeURIComponent(courseSlug)}/progress`, { lecture, status });
    patchCourseState(courseSlug, (s) => ({ ...s, lectures: { ...s.lectures, [lecture]: now } }));
  } catch (error) {
    patchCourseState(courseSlug, (s) => {
      const lectures = { ...s.lectures };
      if (before) lectures[lecture] = before;
      else delete lectures[lecture];
      return { ...s, lectures };
    });
    throw error;
  }
}

export async function saveBookmark(courseSlug: string, kind: BookmarkKind, slug: string, on: boolean): Promise<void> {
  const key = `${kind}:${slug}`;
  const flip = (want: boolean) =>
    patchCourseState(courseSlug, (s) => ({ ...s, bookmarks: want ? [...new Set([...s.bookmarks, key])] : s.bookmarks.filter((b) => b !== key) }));
  flip(on);
  try {
    await post(`/api/me/courses/${encodeURIComponent(courseSlug)}/bookmark`, { kind, slug, on });
  } catch (error) {
    flip(!on);
    throw error;
  }
}

/** A question was just marked: update the solved / missed marks without asking the server again. */
export function noteAnswer(courseSlug: string, questionSlug: string, outcome: "correct" | "passed_tests" | "wrong") {
  const rank = { wrong: 0, passed_tests: 1, correct: 2 } as const;
  patchCourseState(courseSlug, (s) => {
    const before = s.answers[questionSlug]?.status;
    const status = before !== undefined && rank[before] > rank[outcome] ? before : outcome;
    return { ...s, answers: { ...s.answers, [questionSlug]: { status, at: Date.now() } } };
  });
}

export async function loadDraft(courseSlug: string, question: string): Promise<{ code: string; savedAt: number } | null> {
  const res = await fetch(`/api/me/courses/${encodeURIComponent(courseSlug)}/draft?question=${encodeURIComponent(question)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!res.ok) return null;
  const body = (await res.json()) as { signedIn: boolean; draft?: { code: string; savedAt: number } | null };
  return body.draft ?? null;
}

export async function storeDraft(courseSlug: string, question: string, code: string): Promise<number> {
  const { savedAt } = await post<{ savedAt: number }>(`/api/me/courses/${encodeURIComponent(courseSlug)}/draft`, { question, code });
  return savedAt;
}

/** The sign-in link that brings the student back to this page. Use it on a plain <a> (a full page load), like the header's. */
export function signInHref(): string {
  if (typeof window === "undefined") return "/login";
  return `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
}
