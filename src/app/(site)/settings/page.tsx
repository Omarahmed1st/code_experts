import type { Metadata } from "next";
import Link from "next/link";
import { Card, Notice } from "@/components/admin/form-parts";
import { PageHero } from "@/components/layout/page-hero";
import { requireAccount } from "@/server/auth/account";
import { listUserSessions } from "@/server/auth/sessions";
import { getAccount } from "@/server/students/accounts";
import { DeleteAccountForm, DeviceList, DownloadData, NameForm, PasswordForm, RecoveryForm } from "./settings-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account settings", robots: { index: false, follow: false } };

export default async function SettingsPage() {
  const me = await requireAccount("/settings");
  const [account, sessions] = await Promise.all([getAccount(me.id), listUserSessions(me.id)]);
  if (!account) return null;

  return (
    <>
      <PageHero
        crumbs={[{ label: "Home", href: "/" }, { label: "My dashboard", href: "/dashboard" }, { label: "Account settings" }]}
        chapter={{ label: "Your account" }}
        title="Account *settings*"
        description={`Signed in as ${account.email}.`}
      />
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-6xl gap-6 px-4 pt-8 sm:px-6">
        {account.mustChangePassword ? (
          <Notice tone="warn">
            You are signed in with a temporary password from an administrator. <a href="#password" className="font-semibold underline">Choose your own password</a> now.
          </Notice>
        ) : null}
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <div className="grid gap-6">
            <Card title="Your details">
              <NameForm name={account.name} email={account.email} />
            </Card>
            <section id="password" className="scroll-mt-24">
              <Card title="Password">
                <PasswordForm />
              </Card>
            </section>
            {account.isStaff ? (
              <Card title="Recovery">
                <p className="text-sm">
                  Staff accounts don't use recovery codes. If you forget your password, another administrator can give you a temporary one. Your
                  staff tools are in the <Link href="/admin" className="font-semibold text-primary-text hover:underline">admin</Link>.
                </p>
              </Card>
            ) : (
              <Card title="Recovery code">
                <RecoveryForm hasCode={account.hasRecoveryCode} />
              </Card>
            )}
          </div>
          <div className="grid gap-6">
            <Card title="Signed-in devices">
              <DeviceList
                currentId={me.sessionId}
                devices={sessions.map((s) => ({ id: s.id, createdAt: s.createdAt, lastUsed: s.lastUsed, userAgent: s.userAgent }))}
              />
            </Card>
            <Card title="Your data">
              <DownloadData />
            </Card>
            {account.isStaff ? null : (
              <Card title="Delete my account">
                <DeleteAccountForm />
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
