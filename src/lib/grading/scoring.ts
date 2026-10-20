// Grading answers and adding up quiz scores. Pure functions: the server calls
// them with the answer keys it loaded, and the tests call them directly.
import { type CompareOptions, outputsMatch } from "./output.ts";

export interface McqResult {
  correct: boolean;
  /** Correct options the student didn't pick. */
  missed: string[];
  /** Options the student picked that are wrong. */
  wrong: string[];
}

/** Right only when exactly the correct options are picked (one, or several for multiple-answer questions). */
export function gradeMcq(correctIds: readonly string[], selectedIds: readonly string[]): McqResult {
  const correct = new Set(correctIds);
  const selected = new Set(selectedIds);
  const missed = [...correct].filter((id) => !selected.has(id));
  const wrong = [...selected].filter((id) => !correct.has(id));
  return { correct: correct.size > 0 && missed.length === 0 && wrong.length === 0, missed, wrong };
}

/** A trace answer is right when it matches any accepted output under the exercise's comparison rules. */
export function gradeTrace(acceptedOutputs: readonly string[], answer: string, options: CompareOptions): boolean {
  if (answer.trim() === "" && acceptedOutputs.every((o) => o.trim() !== "")) return false;
  return acceptedOutputs.some((expected) => outputsMatch(expected, answer, options));
}

export interface ScoredQuestion {
  exerciseId: string;
  points: number;
  correct: boolean;
  topic: string | null;
}

export interface TopicScore {
  topic: string | null;
  score: number;
  maxScore: number;
  correct: number;
  total: number;
}

export interface ScoreSummary {
  score: number;
  maxScore: number;
  /** Whole percent, rounded down so 59.9% never shows as 60%. */
  percent: number;
  passed: boolean;
  correctCount: number;
  byTopic: TopicScore[];
}

export function scoreAttempt(questions: readonly ScoredQuestion[], passThreshold: number): ScoreSummary {
  const maxScore = questions.reduce((n, q) => n + q.points, 0);
  const score = questions.reduce((n, q) => n + (q.correct ? q.points : 0), 0);
  const topics = new Map<string | null, TopicScore>();
  for (const q of questions) {
    const t = topics.get(q.topic) ?? { topic: q.topic, score: 0, maxScore: 0, correct: 0, total: 0 };
    t.maxScore += q.points;
    t.total += 1;
    if (q.correct) {
      t.score += q.points;
      t.correct += 1;
    }
    topics.set(q.topic, t);
  }
  return {
    score,
    maxScore,
    percent: maxScore === 0 ? 0 : Math.floor((score * 100) / maxScore),
    // Compared without rounding: 3 of 5 is exactly 60%.
    passed: maxScore > 0 && score * 100 >= passThreshold * maxScore,
    correctCount: questions.filter((q) => q.correct).length,
    byTopic: [...topics.values()],
  };
}

/** Fisher–Yates shuffle with a supplied random source (crypto in production, seeded in tests). */
export function shuffled<T>(items: readonly T[], random: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j] as T, out[i] as T];
  }
  return out;
}
