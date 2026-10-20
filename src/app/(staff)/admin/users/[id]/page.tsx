import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ActivityList } from "@/components/admin/activity-list";
import { Card, StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { formatAdminTime } from "@/lib/admin/time";
import { listAudit } from "@/server/admin/audit";
import { listAdminCourses } from "@/server/admin/courses";
import { listStaff } from "@/server/admin/users";
import { requireSite } from "@/server/auth/staff";
import { EditStaff } from "../staff-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Staff account" };

export default async function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const me = await requireSite("manageUsers", `/admin/users/${encodeURIComponent(id)}`);
  const [staff, courses, activity] = await Promise.all([listStaff(), listAdminCourses(null), listAudit({ courseIds: null, actorId: id, limit: 20 })]);
  const person = staff.find((s) => s.id === id);
  if (!person) notFound();
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Staff"
        title={person.name || person.email}
        description={
          <>
            {person.status === "disabled" ? <StatusBadge status="disabled" /> : null} {person.lastSignIn ? `Last signed in ${formatAdminTime(person.lastSignIn)}.` : "Has never signed in."}
            {person.mustChangePassword ? " Still on a temporary password." : ""}
          </>
        }
      />
      <EditStaff
        userId={person.id}
        initial={{ name: person.name, email: person.email, siteRole: person.siteRole, courseRoles: Object.fromEntries(person.courseRoles.map((r) => [r.courseId, r.role])) }}
        courses={courses.map((c) => ({ id: c.id, title: c.title }))}
        status={person.status}
        isSelf={person.id === me.id}
      />
      <Card title="Their recent changes">
        <ActivityList rows={activity} />
      </Card>
    </div>
  );
}
