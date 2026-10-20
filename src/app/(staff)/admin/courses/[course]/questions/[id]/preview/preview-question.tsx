"use client";

import { useState } from "react";
import type { TestSummary } from "@/components/practice/code-answer";
import { type Answer, QuestionView, emptyAnswer } from "@/components/practice/question-view";
import type { PublicExercise } from "@/server/exercises/catalog";

/** The question as students see it. Answers can be tried here but aren't marked: the answer key is below. */
export function PreviewQuestion({ q }: { q: PublicExercise }) {
  const [answer, setAnswer] = useState<Answer>(() => emptyAnswer(q));
  const [tests, setTests] = useState<TestSummary | null>(null);
  return <QuestionView q={q} answer={answer} onAnswer={setAnswer} tests={tests} onTests={setTests} review={null} locked={false} />;
}
