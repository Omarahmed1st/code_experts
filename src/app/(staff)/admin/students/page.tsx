import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge, inputClass } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { formatAdminTime } from "@/lib/admin/time";
import { countStudents, listStudents } from "@/server/admin/students";
import { requireSite } from "@/server/auth/staff";
import { StudentActions } from "./student-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Students" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function StudentsPage({ searchParams }: Props) {
  const staff = await requireSite("manageUsers", "/admin/students");
  const sp = await searchParams;
  const q = one(sp.q).slice(0, 100);
  const [list, counts] = await Promise.all([listStudents({ staff, ip: null }, q, Number(one(sp.page)) || 1), countStudents()]);
  const pageHref = (page: number) => `/admin/students?${new URLSearchParams({ ...(q ? { q } : {}), page: String(page) }).toString()}`;

  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Students"
        title="Student accounts"
        description={`${counts.total} student account${counts.total === 1 ? "" : "s"}, ${counts.newLast30Days} new in the last 30 days. Students make their own accounts; here you can help one who is locked out, or close an account. How students do in a course is on that course's Students tab.`}
      />
      <form role="search" action="/admin/students" className="flex flex-wrap items-end gap-3">
        <div className="grid min-w-[16rem] flex-1 gap-1.5">
          <label htmlFor="q" className="text-sm font-semibold">
            Find a student by name or email
          </label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={100} className={inputClass} />
        </div>
        <button type="submit" className={buttonClass("secondary")}>
          <Search aria-hidden="true" className="size-4" /> Search
        </button>
        {q ? (
          <Link href="/admin/students" className={buttonClass("ghost")}>
            Show all
          </Link>
        ) : null}
      </form>

      {list.rows.length === 0 ? (
        <p className="text-muted">{q ? "No student matches that search." : "No student accounts yet."}</p>
      ) : (
        <ul className="grid gap-3">
          {list.rows.map((s) => (
            <li key={s.id} className="grid gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <div>
                <p className="flex flex-wrap items-center gap-2 font-semibold">
                  {s.name || s.email}
                  {s.status === "disabled" ? <StatusBadge status="disabled" /> : null}
                  {s.mustChangePassword ? <StatusBadge status="draft" label="temporary password" /> : null}
                </p>
                <p className="text-sm text-muted">
                  {s.email} · joined {formatAdminTime(s.createdAt)} · {s.lastActive ? `last seen ${formatAdminTime(s.lastActive)}` : "not signed in anywhere"}
                </p>
                <p className="text-sm">
                  {s.answers} practice answer{s.answers === 1 ? "" : "s"} · {s.attempts} quiz or exam result{s.attempts === 1 ? "" : "s"}
                </p>
              </div>
              <StudentActions id={s.id} email={s.email} active={s.status === "active"} />
            </li>
          ))}
        </ul>
      )}

      {list.pages > 1 ? (
        <nav aria-label="Pages" className="flex flex-wrap items-center gap-3 text-sm">
          {list.page > 1 ? (
            <Link href={pageHref(list.page - 1)} className={buttonClass("secondary")}>
              Previous
            </Link>
          ) : null}
          <span>
            Page {list.page} of {list.pages}
          </span>
          {list.page < list.pages ? (
            <Link href={pageHref(list.page + 1)} className={buttonClass("secondary")}>
              Next
            </Link>
          ) : null}
        </nav>
      ) : null}
    </div>
  );
}
