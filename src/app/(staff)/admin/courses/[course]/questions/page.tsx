import { Download, Upload } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { inputClass } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { can } from "@/lib/auth/permissions";
import { EXERCISE_PAGE_SIZE, listAdminExercises } from "@/server/admin/exercises";
import { listTopics } from "@/server/admin/topics";
import { requireCourse } from "@/server/auth/staff";
import { NewQuestionMenu } from "./new-question-menu";
import { QuestionTable } from "./question-table";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Questions" };

type Search = { q?: string; type?: string; topic?: string; status?: string; difficulty?: string; page?: string };
type Props = { params: Promise<{ course: string }>; searchParams: Promise<Search> };

const TYPES = [
  ["mcq", "Multiple choice"],
  ["trace", "Trace the code"],
  ["correct_code", "Fix the code"],
  ["write_code", "Write the code"],
] as const;

export default async function QuestionsPage({ params, searchParams }: Props) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const search = await searchParams;
  const page = Math.max(1, Number.parseInt(search.page ?? "1", 10) || 1);
  const filters = { q: search.q?.trim().slice(0, 100), type: search.type, topicId: search.topic, status: search.status, difficulty: search.difficulty };
  const [{ rows, total }, topics] = await Promise.all([listAdminExercises(course, filters, page), listTopics(course)]);
  const base = `/admin/courses/${course.slug}/questions`;
  const canEdit = can(staff, "edit", course.id);
  const pages = Math.max(1, Math.ceil(total / EXERCISE_PAGE_SIZE));
  const pageHref = (n: number) => {
    const p = new URLSearchParams(Object.entries({ ...search, page: String(n) }).filter((e): e is [string, string] => !!e[1]));
    return `${base}?${p.toString()}`;
  };
  const filtered = Object.entries(filters).some(([, v]) => v);

  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Question bank"
        title="Questions"
        description="Every question of this course. Quizzes pick from here, and practice exams draw published questions at random."
        actions={
          <>
            <a href={`${base}/export`} className={buttonClass("ghost")}>
              <Download aria-hidden="true" className="size-4" /> Export all
            </a>
            {canEdit ? (
              <>
                <Link href={`${base}/import`} className={buttonClass("secondary")}>
                  <Upload aria-hidden="true" className="size-4" /> Import
                </Link>
                <NewQuestionMenu base={base} />
              </>
            ) : null}
          </>
        }
      />
      <form method="get" className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4 sm:grid-cols-2 lg:grid-cols-[2fr_repeat(4,1fr)_auto] lg:items-end">
        <label className="grid gap-1 text-sm font-semibold">
          Search
          <input name="q" defaultValue={search.q ?? ""} placeholder="Title, address or text" className={inputClass} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Type
          <select name="type" defaultValue={search.type ?? ""} className={inputClass}>
            <option value="">Any</option>
            {TYPES.map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Topic
          <select name="topic" defaultValue={search.topic ?? ""} className={inputClass}>
            <option value="">Any</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
            <option value="none">No topic</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Status
          <select name="status" defaultValue={search.status ?? ""} className={inputClass}>
            <option value="">Any</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="reserved">Final quiz only</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Level
          <select name="difficulty" defaultValue={search.difficulty ?? ""} className={inputClass}>
            <option value="">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <div className="flex gap-2">
          <button type="submit" className={buttonClass("primary")}>
            Filter
          </button>
          {filtered ? (
            <Link href={base} className={buttonClass("ghost")}>
              Clear
            </Link>
          ) : null}
        </div>
      </form>
      <p className="text-sm text-muted" aria-live="polite">
        {total === 0 ? "No questions match." : `${total} question${total === 1 ? "" : "s"}${pages > 1 ? `, page ${page} of ${pages}` : ""}.`}
      </p>
      <QuestionTable
        courseSlug={course.slug}
        rows={rows}
        canPublish={can(staff, "publish", course.id)}
        canEdit={canEdit}
      />
      {pages > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-2">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className={buttonClass("secondary")}>
              Previous
            </Link>
          ) : null}
          <span className="text-sm text-muted">
            Page {page} of {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(page + 1)} className={buttonClass("secondary")}>
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
