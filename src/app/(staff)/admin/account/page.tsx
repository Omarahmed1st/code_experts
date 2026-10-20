import type { Metadata } from "next";
import { Card, Notice } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { ROLE_LABEL, isAdmin } from "@/lib/auth/permissions";
import { listAdminCourses } from "@/server/admin/courses";
import { mustChangePassword } from "@/server/admin/users";
import { requireStaff } from "@/server/auth/staff";
import { listUserSessions } from "@/server/auth/sessions";
import { PasswordForm, SessionList } from "./account-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const staff = await requireStaff("/admin/account");
  const [sessions, mustChange, courses] = await Promise.all([listUserSessions(staff.id), mustChangePassword(staff.id), listAdminCourses(null)]);
  const roles = isAdmin(staff)
    ? "Administrator: every course, staff accounts and the audit log."
    : Object.entries(staff.courseRoles)
        .map(([id, role]) => `${courses.find((c) => c.id === id)?.title ?? id} (${ROLE_LABEL[role].toLowerCase()})`)
        .join(", ") || "No courses yet.";
  return (
    <div className="grid gap-6">
      <PageHeader chapter="Account" title="My account" description={`${staff.name} · ${staff.email}`} />
      {mustChange ? <Notice tone="warn">You are signed in with a temporary password. Choose your own password now.</Notice> : null}
      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Card title="Change password">
          <PasswordForm />
        </Card>
        <div className="grid gap-6">
          <Card title="What you can do">
            <p className="text-sm">{roles}</p>
          </Card>
          <Card title="Signed-in devices">
            <SessionList
              currentId={staff.sessionId}
              sessions={sessions.map((s) => ({ id: s.id, lastUsed: s.lastUsed, createdAt: s.createdAt, ipAddress: s.ipAddress, userAgent: s.userAgent }))}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
