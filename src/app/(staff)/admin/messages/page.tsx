import type { Metadata } from "next";
import Link from "next/link";
import { Card, StatusBadge } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { formatAdminTime } from "@/lib/admin/time";
import { listContactMessages } from "@/server/admin/site";
import { requireSite } from "@/server/auth/staff";
import { MessageActions } from "./message-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function MessagesPage({ searchParams }: Props) {
  const staff = await requireSite("readMessages", "/admin/messages");
  const sp = await searchParams;
  const view = sp.view === "archived" ? "archived" : "open";
  const messages = await listContactMessages({ staff, ip: null }, view);
  const tab = (active: boolean) =>
    `inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-medium ${active ? "bg-primary text-on-primary" : "text-ink hover:bg-surface-2"}`;
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Site"
        title="Messages"
        description="What visitors sent through the contact form. Replies go from your own email; the site sends no email. Delete a message when someone asks for their data to be removed."
      />
      <nav aria-label="Message folders" className="flex gap-2">
        <Link href="/admin/messages" aria-current={view === "open" ? "page" : undefined} className={tab(view === "open")}>
          Inbox
        </Link>
        <Link href="/admin/messages?view=archived" aria-current={view === "archived" ? "page" : undefined} className={tab(view === "archived")}>
          Archived
        </Link>
      </nav>
      {messages.length === 0 ? (
        <Card>
          <p className="text-muted">{view === "archived" ? "No archived messages." : "No messages."}</p>
        </Card>
      ) : (
        <ul className="grid gap-4">
          {messages.map((m) => (
            <li key={m.id}>
              <Card
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {m.subject}
                    {m.status === "new" ? <StatusBadge status="scheduled" label="new" /> : null}
                  </span>
                }
              >
                <p className="text-sm text-muted">
                  From <span className="font-medium text-ink">{m.name}</span> &lt;
                  <a href={`mailto:${m.email}`} className="text-primary-text hover:underline">
                    {m.email}
                  </a>
                  &gt; · {formatAdminTime(m.createdAt)}
                </p>
                <p className="mt-3 whitespace-pre-wrap break-words">{m.body}</p>
                <div className="mt-4">
                  <MessageActions id={m.id} status={m.status} />
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
