import Link from "next/link";
import type { AttemptRow } from "@/server/students/history";
import { formatWhen } from "./progress-bar";

const KIND: Record<AttemptRow["kind"], string> = { quiz: "Quiz", exam: "Practice exam", custom: "Custom exam" };

/** Quiz and exam attempts with their results. */
export function AttemptTable({ rows }: { rows: AttemptRow[] }) {
  return (
    <div className="table-wrap rounded-[var(--radius-card)] border border-line bg-surface">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-line text-xs uppercase tracking-wider text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">
              Quiz or exam
            </th>
            <th scope="col" className="hidden px-4 py-3 sm:table-cell">
              Started (Cairo)
            </th>
            <th scope="col" className="px-4 py-3">
              Result
            </th>
            <th scope="col" className="px-4 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b border-line last:border-0">
              <td className="px-4 py-3">
                <span className="block font-semibold">{r.title}</span>
                <span className="text-xs text-muted">
                  {KIND[r.kind]}
                  <span className="sm:hidden"> · {formatWhen(r.startedAt)}</span>
                </span>
              </td>
              <td className="hidden whitespace-nowrap px-4 py-3 sm:table-cell">{formatWhen(r.startedAt)}</td>
              <td className="px-4 py-3 sm:whitespace-nowrap">
                {r.state === "submitted" ? (
                  <>
                    <span className="font-mono font-bold">{r.percent}%</span>{" "}
                    <span className="text-muted">
                      ({r.score}/{r.maxScore})
                    </span>{" "}
                    <span className={`block font-semibold sm:ml-1 sm:inline ${r.passed ? "text-easy" : "text-hard"}`}>{r.passed ? "Passed" : "Not passed"}</span>
                  </>
                ) : r.state === "in_progress" ? (
                  <span className="text-muted">In progress</span>
                ) : (
                  <span className="text-muted">Not submitted</span>
                )}
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                {r.reviewHref ? (
                  <Link href={r.reviewHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:underline">
                    Review
                  </Link>
                ) : r.state === "in_progress" ? (
                  <Link href={r.retakeHref} className="inline-flex min-h-11 items-center font-semibold text-primary-text hover:underline">
                    Continue
                  </Link>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
