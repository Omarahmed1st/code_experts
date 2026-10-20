import { SENTENCES, auditSubject, describeAction } from "@/lib/admin/audit-text";
import type { AuditRow } from "@/server/admin/audit";

import { formatAdminTime } from "@/lib/admin/time";

export { formatAdminTime };

export function ActivityList({ rows, showCourse = true, showIp = false }: { rows: AuditRow[]; showCourse?: boolean; showIp?: boolean }) {
  if (rows.length === 0) return <p className="text-sm text-muted">Nothing yet.</p>;
  return (
    <ol className="grid gap-0 divide-y divide-line">
      {rows.map((row) => {
        const subject = auditSubject(row.afterState);
        return (
          <li key={row.id} className="grid gap-0.5 py-2.5 text-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
            <p className="min-w-0">
              {SENTENCES[row.action] ?? (
                <>
                  <span className="font-semibold">{row.actorName || row.actorEmail || "Someone"}</span> {describeAction(row.action, row.entityType)}
                </>
              )}
              {subject ? <span className="font-medium">{SENTENCES[row.action] ? ": " : " "}“{subject}”</span> : null}
              {showCourse && row.courseTitle ? <span className="text-muted"> in {row.courseTitle}</span> : null}
            </p>
            <p className="text-xs text-muted sm:text-right">
              <time dateTime={new Date(row.createdAt).toISOString()}>{formatAdminTime(row.createdAt)}</time>
              {showIp && row.ipAddress ? <span className="block font-mono">{row.ipAddress}</span> : null}
            </p>
          </li>
        );
      })}
    </ol>
  );
}
