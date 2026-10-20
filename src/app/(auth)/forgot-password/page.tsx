import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, stageLink } from "@/components/account/auth-frame";
import { safeNextPath } from "@/lib/auth/session-token";
import { getTurnstileKeys } from "@/server/platform/env";
import { RecoverForm } from "./recover-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Forgot your password", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function ForgotPasswordPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const next = safeNextPath(Array.isArray(raw) ? raw[0] : raw, "") || null;
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthFrame
      kicker={{ strong: "Account", rest: "Recovery" }}
      title="Forgot your password?"
      intro={<p>Use the recovery code you saved when you made your account, and choose a new password.</p>}
      footer={
        <>
          <p>
            Remembered it?{" "}
            <Link href={`/login${nextQuery}`} className={stageLink}>
              Sign in
            </Link>
          </p>
          <p>Lost the recovery code too? Ask your teacher: an administrator can give your account a temporary password.</p>
        </>
      }
    >
      <RecoverForm next={next} turnstileSiteKey={getTurnstileKeys()?.siteKey ?? null} />
    </AuthFrame>
  );
}
