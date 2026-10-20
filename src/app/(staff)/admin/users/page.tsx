import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { formatAdminTime } from "@/lib/admin/time";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { listAdminCourses } from "@/server/admin/courses";
import { listStaff } from "@/server/admin/users";
import { requireSite } from "@/server/auth/staff";
import { NewStaff } from "./staff-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff accounts" };

export default async function StaffPage() {
  await requireSite("manageUsers", "/admin/users");
  const [staff, courses] = await Promise.all([listStaff(), listAdminCourses(null)]);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Staff"
        title="Staff accounts"
        description="Administrators can do everything. Editors work only in the courses you give them: an editor edits, a course admin also publishes and deletes."
      />
      <NewStaff courses={courses.map((c) => ({ id: c.id, title: c.title }))} />
      <ul className="grid gap-3">
        {staff.map((s) => (
          <li key={s.id} className="flex flex-wrap items-start gap-3 rounded-[var(--radius-card)] border border-line bg-surface p-4">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                <Link href={`/admin/users/${s.id}`} className="hover:underline">
                  {s.name || s.email}
                </Link>
                <StatusBadge status={s.siteRole === "admin" ? "published" : "scheduled"} label={s.siteRole === "admin" ? "Administrator" : "Editor"} />
                {s.status === "disabled" ? <StatusBadge status="disabled" /> : null}
                {s.mustChangePassword ? <StatusBadge status="draft" label="temporary password" /> : null}
              </p>
              <p className="text-sm text-muted">
                {s.email} · {s.lastSignIn ? `last signed in ${formatAdminTime(s.lastSignIn)}` : "never signed in"}
              </p>
              {s.siteRole === "editor" ? (
                <p className="mt-1 text-sm">{s.courseRoles.length ? s.courseRoles.map((r) => `${r.courseTitle} (${ROLE_LABEL[r.role].toLowerCase()})`).join(", ") : "No courses"}</p>
              ) : null}
            </div>
            <Link href={`/admin/users/${s.id}`} className="text-sm font-semibold text-primary-text hover:underline">
              Manage
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
