// What is kept for a signed-in student's practice answer (exercise_attempts).
// Pure, so it is unit-tested on its own; the practice API calls it.
import type { EXERCISE_TYPE } from "@/db/enums";

/**
 * `correct` is a mark the server worked out itself, or null when it can't
 * (write-the-code; a correct-the-code fix that doesn't match a known fix but
 * passed every test in the browser). `selfCheck` is what the student's browser
 * reported about its own test run: shown back to the student, never counted
 * as a mark, because a browser can report anything. Phase 9's server-side
 * runner will turn those into real marks.
 */
export interface PracticeRecord {
  correct: boolean | null;
  selfCheck: "passed" | "failed" | null;
}

export function practiceRecord(review: { type: (typeof EXERCISE_TYPE)[number]; correct: boolean | null }, response: unknown): PracticeRecord {
  if (review.type !== "correct_code" && review.type !== "write_code") return { correct: review.correct, selfCheck: null };
  const raw = response && typeof response === "object" ? (response as { tests?: unknown }).tests : undefined;
  const tests = raw && typeof raw === "object" ? (raw as { passed?: unknown; total?: unknown }) : null;
  const ran = tests !== null && Number.isInteger(tests.total) && Number.isInteger(tests.passed) && (tests.total as number) > 0 && (tests.passed as number) >= 0;
  const selfCheck = ran ? (tests.passed === tests.total ? "passed" : "failed") : null;
  if (review.type === "write_code") return { correct: null, selfCheck };
  // correct_code: a match with a known fix is a server mark. A different fix that passed
  // in the browser stays unmarked (not wrong, not right); anything else is wrong.
  if (review.correct === true) return { correct: true, selfCheck };
  return { correct: selfCheck === "passed" ? null : false, selfCheck };
}
