import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthFrame, stageLink } from "@/components/account/auth-frame";
import { canOpenAdmin } from "@/lib/auth/permissions";
import { safeNextPath } from "@/lib/auth/session-token";
import { SITE_NAME } from "@/lib/site";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { getTurnstileKeys } from "@/server/platform/env";
import { SignInForm } from "./sign-in-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function SignInPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const asked = Array.isArray(raw) ? raw[0] : raw;
  // Only a real path counts as "send me back there"; otherwise each kind of account has its own start page.
  const next = (asked ? safeNextPath(asked, "") : "") || null;
  const signedIn = await getSignedIn();
  if (signedIn) {
    // Staff with a staff session go on; a student session asked for the admin signs in again below.
    const wantsAdmin = (next ?? "").startsWith("/admin");
    if (!wantsAdmin) redirect(next ?? (canOpenAdmin(signedIn) ? "/admin" : "/dashboard"));
    if (adminAllowed(signedIn)) redirect(next!);
  }
  const turnstile = getTurnstileKeys();
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";

  return (
    <AuthFrame
      kicker={{ strong: "Account", rest: "Students and staff" }}
      title="Sign in"
      intro={<p>Save your progress, bookmarks and quiz history. Lectures and practice on {SITE_NAME} stay open to everyone without an account.</p>}
      footer={
        <>
          <p>
            New here?{" "}
            <Link href={`/register${nextQuery}`} className={stageLink}>
              Create a free account
            </Link>
          </p>
          <p>
            Forgot your password?{" "}
            <Link href={`/forgot-password${nextQuery}`} className={stageLink}>
              Use your recovery code
            </Link>
            . Staff: ask an administrator.
          </p>
        </>
      }
    >
      <SignInForm next={next} turnstileSiteKey={turnstile?.siteKey ?? null} />
    </AuthFrame>
  );
}
