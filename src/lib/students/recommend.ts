// "What to do next" on a student's course dashboard. Simple, explainable
// rules over the student's own activity in that course only. Pure.

export interface TopicActivity {
  slug: string;
  title: string;
  lecturesTotal: number;
  lecturesDone: number;
  /** Published practice questions in the topic. */
  questions: number;
  answers: number;
  right: number;
  /** A quiz for this topic the student hasn't passed yet. */
  openQuiz: { slug: string; title: string } | null;
}

export interface Recommendation {
  kind: "lecture" | "mistakes" | "weak-topic" | "new-topic" | "quiz";
  title: string;
  reason: string;
  href: string;
}

export const WEAK_BELOW = 0.7;
export const MIN_ANSWERS = 3;

export function recommend(input: {
  courseSlug: string;
  nextLecture: { slug: string; title: string; started: boolean } | null;
  mistakes: string[];
  topics: TopicActivity[];
  limit?: number;
}): Recommendation[] {
  const base = `/courses/${input.courseSlug}`;
  const out: Recommendation[] = [];
  if (input.nextLecture) {
    out.push({
      kind: "lecture",
      title: `${input.nextLecture.started ? "Continue" : "Read next"}: ${input.nextLecture.title}`,
      reason: input.nextLecture.started ? "You opened it but haven't marked it as done." : "The next lecture in course order.",
      href: `${base}/lectures/${input.nextLecture.slug}`,
    });
  }
  if (input.mistakes.length > 0) {
    const n = input.mistakes.length;
    out.push({
      kind: "mistakes",
      title: `Retry the ${n === 1 ? "question" : `${n} questions`} you missed`,
      reason: "Get one right and it leaves the list.",
      href: `${base}/practice?retry=${input.mistakes.slice(0, 50).join(",")}`,
    });
  }
  const weak = input.topics
    .filter((t) => t.answers >= MIN_ANSWERS && t.right / t.answers < WEAK_BELOW && t.questions > 0)
    .sort((a, b) => a.right / a.answers - b.right / b.answers)[0];
  if (weak) {
    out.push({
      kind: "weak-topic",
      title: `Practise ${weak.title}`,
      reason: `You got ${Math.round((weak.right * 100) / weak.answers)}% of your answers right in this topic.`,
      href: `${base}/practice?set=1&topic=${weak.slug}`,
    });
  }
  const fresh = input.topics.find((t) => t.lecturesDone > 0 && t.answers === 0 && t.questions > 0);
  if (fresh) {
    out.push({
      kind: "new-topic",
      title: `Try questions on ${fresh.title}`,
      reason: "You read lectures in this topic but haven't practised it yet.",
      href: `${base}/practice?set=1&topic=${fresh.slug}`,
    });
  }
  const quiz = input.topics.find((t) => t.openQuiz && t.lecturesTotal > 0 && t.lecturesDone >= t.lecturesTotal);
  if (quiz?.openQuiz) {
    out.push({
      kind: "quiz",
      title: `Take the quiz: ${quiz.openQuiz.title}`,
      reason: `You finished every lecture in ${quiz.title}.`,
      href: `${base}/quizzes/${quiz.openQuiz.slug}`,
    });
  }
  return out.slice(0, input.limit ?? 4);
}
