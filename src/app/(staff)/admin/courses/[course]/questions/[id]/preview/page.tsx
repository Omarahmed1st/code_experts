import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, Notice } from "@/components/admin/form-parts";
import { buttonClass } from "@/components/ui/button-styles";
import { renderMarkdown } from "@/lib/markdown/render";
import { getExerciseForEdit } from "@/server/admin/exercises";
import { requireCourse } from "@/server/auth/staff";
import { getPublicExercises } from "@/server/exercises/catalog";
import { PreviewQuestion } from "./preview-question";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Preview question" };

function Pre({ children }: { children: string }) {
  return <pre className="mt-1 overflow-x-auto rounded-lg bg-surface-2 p-3 font-mono text-[13px] whitespace-pre-wrap">{children || "(nothing)"}</pre>;
}

/** The saved question as students see it, whatever its status, with the answer key under it. */
export default async function PreviewQuestionPage({ params }: { params: Promise<{ course: string; id: string }> }) {
  const { course: slug, id } = await params;
  const { course } = await requireCourse(slug, "view");
  const [publicView, edit] = await Promise.all([getPublicExercises(course, [id], { withHints: true, anyStatus: true }), getExerciseForEdit(course, id)]);
  const q = publicView[0];
  if (!q || !edit) notFound();
  const src = edit.source;
  const back = `/admin/courses/${course.slug}/questions/${id}`;
  return (
    <div className="grid grid-cols-1 gap-6">
      <Notice tone={src.status === "published" ? "info" : "warn"}>
        Preview of the last saved version. {src.status === "published" ? "Students can see this question." : "Students can't see it yet (draft)."}
        {src.settings.reserved ? " It is kept for the final quiz only, so it has no page of its own." : ""}{" "}
        <Link href={back} className="font-semibold underline">
          Back to the editor
        </Link>
      </Notice>
      <div className="mx-auto w-full max-w-4xl">
        <PreviewQuestion q={q} />
      </div>
      <Card title="Answer key (staff only)" className="mx-auto w-full max-w-4xl">
        <div className="grid gap-4 text-sm">
          {src.options.length > 0 ? (
            <div>
              <p className="font-semibold">Options</p>
              <ol className="mt-1 grid gap-2">
                {src.options.map((o, i) => (
                  <li key={i} className={`rounded-lg border p-3 ${o.correct ? "border-easy bg-easy-soft" : "border-line"}`}>
                    <span className="font-semibold">{o.correct ? "Correct: " : "Wrong: "}</span>
                    <span dangerouslySetInnerHTML={{ __html: renderMarkdown(o.labelMd) }} />
                    {o.feedbackMd ? <div className="mt-1 text-muted" dangerouslySetInnerHTML={{ __html: renderMarkdown(o.feedbackMd) }} /> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null}
          {src.outputs.length > 0 && src.type === "trace" ? (
            <div>
              <p className="font-semibold">Answer{src.outputs.length > 1 ? "s accepted" : ""}</p>
              {src.outputs.map((o, i) => (
                <Pre key={i}>{o}</Pre>
              ))}
            </div>
          ) : null}
          {src.solution ? (
            <div>
              <p className="font-semibold">Solution</p>
              <Pre>{src.solution}</Pre>
            </div>
          ) : null}
          {src.accepted.length > 0 ? (
            <div>
              <p className="font-semibold">Other accepted fixes</p>
              {src.accepted.map((a, i) => (
                <Pre key={i}>{a}</Pre>
              ))}
            </div>
          ) : null}
          {src.tests.length > 0 ? (
            <div>
              <p className="font-semibold">Test cases</p>
              <ul className="mt-1 grid gap-2">
                {src.tests.map((t, i) => (
                  <li key={i} className="rounded-lg border border-line p-3">
                    <p className="font-semibold">
                      {t.name || `Test ${i + 1}`} {t.hidden ? <span className="font-normal text-muted">(hidden from students)</span> : null}
                    </p>
                    <div className="mt-1 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-muted">Input</p>
                        <Pre>{t.stdin}</Pre>
                      </div>
                      <div>
                        <p className="text-xs text-muted">Expected output</p>
                        <Pre>{t.stdout}</Pre>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {src.explanationMd ? (
            <div>
              <p className="font-semibold">Explanation (shown after answering)</p>
              <div className="lesson-prose mt-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(src.explanationMd) }} />
            </div>
          ) : (
            <p className="text-muted">No explanation yet. Questions without one aren't indexed by search engines.</p>
          )}
        </div>
      </Card>
      <p className="mx-auto w-full max-w-4xl">
        <Link href={back} className={buttonClass("secondary")}>
          Back to the editor
        </Link>
      </p>
    </div>
  );
}
