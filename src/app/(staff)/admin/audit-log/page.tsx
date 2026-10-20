import type { Metadata } from "next";
import Link from "next/link";
import { ActivityList } from "@/components/admin/activity-list";
import { Card } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { buttonClass } from "@/components/ui/button-styles";
import { listAudit } from "@/server/admin/audit";
import { requireSite } from "@/server/auth/staff";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Audit log" };

const PAGE = 100;

export default async function AuditLogPage({ searchParams }: { searchParams: Promise<{ before?: string }> }) {
  await requireSite("viewAuditLog", "/admin/audit-log");
  const before = Number((await searchParams).before) || undefined;
  const rows = await listAudit({ courseIds: null, limit: PAGE, before });
  const last = rows.at(-1);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Audit log"
        title="Audit log"
        description="Every sign-in and every change in the admin, across all courses, newest first. Times are Cairo time. Entries can't be edited or deleted from the admin."
      />
      <Card>
        <ActivityList rows={rows} showIp />
      </Card>
      <div className="flex flex-wrap gap-2">
        {before ? (
          <Link href="/admin/audit-log" className={buttonClass("ghost")}>
            Newest
          </Link>
        ) : null}
        {rows.length === PAGE && last ? (
          <Link href={`/admin/audit-log?before=${last.createdAt}`} className={buttonClass("secondary")}>
            Older
          </Link>
        ) : null}
      </div>
    </div>
  );
}
