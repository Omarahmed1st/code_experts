import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { HARD_MIN_ANSWERS, TREND_WEEKS, getCourseAnalytics } from "@/server/admin/student-analytics";
import { requireCourse } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Students" };
type Props = { params: Promise<{ course: string }> };

const pct = (right: number, total: number) => (total > 0 ? `${Math.round((right * 100) / total)}%` : "–");
const WEEK = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Cairo" });
const TYPE: Record<string, string> = { mcq: "Multiple choice", trace: "Trace", correct_code: "Correct the code", write_code: "Write the code" };

function Table({ caption, head, children }: { caption: string; head: string[]; children: React.ReactNode }) {
  return (
    <div className="table-wrap">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
          <tr>
            {head.map((h, i) => (
              <th key={h} scope="col" className={`px-3 py-2 ${i > 0 ? "text-right" : ""}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

const td = "border-b border-line px-3 py-2 last:border-0";
const num = `${td} text-right font-mono`;

export default async function CourseStudentsPage({ params }: Props) {
  const { staff, course } = await requireCourse((await params).course, "view");
  const a = await getCourseAnalytics({ staff, ip: null }, course);
  if ("error" in a) return <p>{a.error}</p>;
  const maxTrend = Math.max(1, ...a.trend.map((w) => w.students));

  const stats: [string, string, string?][] = [
    ["Students who used the course", String(a.students.ever)],
    ["Active in the last 7 days", String(a.students.active7)],
    ["Active in the last 30 days", String(a.students.active30)],
    ["Came back on another day", String(a.students.returning), a.students.ever ? `${Math.round((a.students.returning * 100) / a.students.ever)}% of them` : undefined],
    ["Answers checked", String(a.answers), a.answers ? `${pct(a.right, a.answers)} right` : undefined],
    ["Quizzes and exams submitted", String(a.attemptsSubmitted)],
    ["Lectures marked done", String(a.lecturesCompleted)],
  ];

  return (
    <div className="grid grid-cols-1 gap-6">
      <PageHeader
        chapter="Students"
        title={`How students are doing in ${course.shortTitle}`}
        description="Signed-in students only (guests leave nothing on the server), staff accounts left out. Only totals: no names, no single student's answers."
      />

      <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, note]) => (
          <div key={label} className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <dt className="text-sm text-muted">{label}</dt>
            <dd className="mt-1 font-mono text-2xl font-bold">{value}</dd>
            {note ? <dd className="text-xs text-muted">{note}</dd> : null}
          </div>
        ))}
      </dl>

      <Card title={`The last ${TREND_WEEKS} weeks`}>
        <Table caption="Weekly activity" head={["Week from", "Active students", "Answers", "Lectures done"]}>
          {a.trend.map((w) => (
            <tr key={w.weekStart}>
              <td className={td}>
                <span className="flex items-center gap-3">
                  <span className="w-16 shrink-0">{WEEK.format(w.weekStart)}</span>
                  <span aria-hidden="true" className="h-2 rounded-full bg-primary" style={{ width: `${Math.round((w.students / maxTrend) * 8)}rem`, minWidth: w.students ? "0.25rem" : 0 }} />
                </span>
              </td>
              <td className={num}>{w.students}</td>
              <td className={num}>{w.answers}</td>
              <td className={num}>{w.lecturesCompleted}</td>
            </tr>
          ))}
        </Table>
      </Card>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2 xl:items-start">
        <Card title="By topic">
          <Table caption="Answers by topic" head={["Topic", "Students", "Answers", "Right"]}>
            {a.topics.map((t) => (
              <tr key={t.title}>
                <td className={td}>{t.title}</td>
                <td className={num}>{t.students}</td>
                <td className={num}>{t.answers}</td>
                <td className={num}>{pct(t.right, t.answers)}</td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card title="Hardest questions">
          {a.hardest.length === 0 ? (
            <p className="text-sm text-muted">No question has {HARD_MIN_ANSWERS} answers yet.</p>
          ) : (
            <Table caption={`Questions with the fewest right answers (at least ${HARD_MIN_ANSWERS} answers)`} head={["Question", "Answers", "Right"]}>
              {a.hardest.map((q) => (
                <tr key={q.slug}>
                  <td className={td}>
                    <Link href={`/courses/${course.slug}/exercises/${q.slug}`} className="font-semibold text-primary-text hover:underline">
                      {q.title}
                    </Link>
                    <span className="block text-xs text-muted">
                      {TYPE[q.type] ?? q.type}
                      {q.topic ? ` · ${q.topic}` : ""}
                    </span>
                  </td>
                  <td className={num}>{q.answers}</td>
                  <td className={num}>{pct(q.right, q.answers)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Quizzes">
          {a.quizzes.length === 0 ? (
            <p className="text-sm text-muted">This course has no quizzes.</p>
          ) : (
            <Table caption="Quiz results (models counted with their quiz)" head={["Quiz", "Submitted", "Average", "Passed"]}>
              {a.quizzes.map((q) => (
                <tr key={q.slug}>
                  <td className={td}>{q.title}</td>
                  <td className={num}>{q.attempts}</td>
                  <td className={num}>{q.averagePercent === null ? "–" : `${q.averagePercent}%`}</td>
                  <td className={num}>{pct(q.passed, q.attempts)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        <Card title="Lectures">
          <Table caption="Students who opened and finished each published lecture" head={["Lecture", "Opened", "Done"]}>
            {a.lectures.map((l) => (
              <tr key={l.slug}>
                <td className={td}>
                  {l.lectureNumber !== null ? <span className="font-mono text-muted">L{l.lectureNumber} </span> : null}
                  {l.title}
                  <span className="block text-xs text-muted">{l.topic}</span>
                </td>
                <td className={num}>{l.started}</td>
                <td className={num}>{l.completed}</td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
}
