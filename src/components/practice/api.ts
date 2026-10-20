// Calls to the practice API (src/app/api/courses/[course]/[kind]/[slug]/[action]).
import type { Review } from "@/server/grading/grade";
import type { AttemptResult, StartedAttempt } from "@/server/assessments/attempts";

export type { Review, AttemptResult, StartedAttempt };

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}) });
  } catch {
    throw new ApiError(0, "Couldn't reach Code_Expert. Check your connection and try again.");
  }
  const data = (await res.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!res.ok || !data) throw new ApiError(res.status, data?.error ?? "Something went wrong. Please try again.");
  return data;
}

const base = (course: string, kind: string, slug: string) =>
  `/api/courses/${encodeURIComponent(course)}/${kind}/${encodeURIComponent(slug)}`;

export const checkExercise = (course: string, slug: string, response: unknown) =>
  post<Review>(`${base(course, "exercises", slug)}/check`, { response });

export type AttemptKind = "quiz" | "exam" | "custom";
const segment = (kind: AttemptKind) => (kind === "quiz" ? "quizzes" : kind === "exam" ? "exams" : "custom");

/** `options`: a custom exam's choices (topics, count, timer, feedback, types). */
export const startAttempt = (course: string, kind: AttemptKind, slug: string, options?: unknown) =>
  post<StartedAttempt>(`${base(course, segment(kind), slug)}/start`, options === undefined ? {} : { options });

export interface TryStatus {
  maxAttempts: number | null;
  used: number;
  unlockAt: number | null;
  /** Quizzes with an attempt limit need an account (the attempts count per student). */
  signInRequired?: boolean;
}

/** Quizzes with an attempt limit: how many attempts were used in the last 24 hours. */
export const quizTryStatus = (course: string, slug: string) => post<TryStatus>(`${base(course, "quizzes", slug)}/status`, {});

export const checkInAttempt = (course: string, kind: AttemptKind, slug: string, token: string, exerciseId: string, response: unknown) =>
  post<Review>(`${base(course, segment(kind), slug)}/check`, { token, exerciseId, response });

export const submitAttempt = (course: string, kind: AttemptKind, slug: string, token: string, responses: Record<string, unknown>) =>
  post<AttemptResult>(`${base(course, segment(kind), slug)}/submit`, { token, responses });
