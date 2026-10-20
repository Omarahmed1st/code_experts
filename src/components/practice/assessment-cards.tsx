// Cards for a course's quizzes and practice exams (server component: data in, links out).
import { Clock, Shuffle, Target } from "lucide-react";
import Link from "next/link";
import type { ExamCard, QuizCard } from "@/server/assessments/catalog";

function minutes(sec: number) {
  return `${Math.round(sec / 60)} min`;
}

function Facts({ items }: { items: (string | null)[] }) {
  return (
    <p className="q-meta mt-auto pt-2">
      {items.filter(Boolean).map((t) => (
        <span key={t}>{t}</span>
      ))}
    </p>
  );
}

export function QuizCards({ courseSlug, quizzes }: { courseSlug: string; quizzes: QuizCard[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {quizzes.map((q) => (
        <li key={q.slug}>
          <article className="relative flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card hover:border-primary">
            <p className="q-meta">
              <span className="q-type">
                {q.mode === "exam" ? <Clock aria-hidden="true" className="size-4" /> : <Target aria-hidden="true" className="size-4" />}
                {q.mode === "exam" ? "Exam mode" : "Practice quiz"}
              </span>
              {q.topic ? <span>{q.topic.title}</span> : null}
              {q.isDemo ? <span className="demo-badge">Demo</span> : null}
            </p>
            <h3 className="text-lg font-semibold">
              <Link href={`/courses/${courseSlug}/quizzes/${q.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
                {q.title}
              </Link>
            </h3>
            <Facts
              items={[
                `${q.questionCount} questions`,
                q.timeLimitSec ? minutes(q.timeLimitSec) : "No time limit",
                `Pass ${q.passThreshold}%`,
                q.feedback === "immediate" ? "Answers after each question" : "Answers after you submit",
                q.models.length > 1 ? `${q.models.length} models, picked at random` : null,
                q.maxAttempts ? `${q.maxAttempts} attempts per 24 hours` : null,
              ]}
            />
          </article>
        </li>
      ))}
    </ul>
  );
}

export function ExamCards({ courseSlug, exams }: { courseSlug: string; exams: ExamCard[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {exams.map((e) => (
        <li key={e.slug}>
          <article className="relative flex h-full flex-col gap-2 rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-card hover:border-primary">
            <p className="q-meta">
              <span className="q-type">
                <Shuffle aria-hidden="true" className="size-4" />
                Practice exam
              </span>
              {e.isDemo ? <span className="demo-badge">Demo</span> : null}
            </p>
            <h3 className="text-lg font-semibold">
              <Link href={`/courses/${courseSlug}/exams/${e.slug}`} className="after:absolute after:inset-0 after:rounded-[var(--radius-card)]">
                {e.title}
              </Link>
            </h3>
            <Facts items={[`${e.questionCount} random questions`, minutes(e.timeLimitSec), `Pass ${e.passThreshold}%`, "New questions every attempt"]} />
          </article>
        </li>
      ))}
    </ul>
  );
}
