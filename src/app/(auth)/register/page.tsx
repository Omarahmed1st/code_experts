import type { Metadata } from "next";
import Link from "next/link";
import { AuthFrame, stageLink } from "@/components/account/auth-frame";
import { safeNextPath } from "@/lib/auth/session-token";
import { getSignedIn } from "@/server/auth/staff";
import { getTurnstileKeys } from "@/server/platform/env";
import { SignUpForm } from "./sign-up-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

type Props = { searchParams: Promise<{ next?: string | string[] }> };

export default async function SignUpPage({ searchParams }: Props) {
  const raw = (await searchParams).next;
  const next = safeNextPath(Array.isArray(raw) ? raw[0] : raw, "") || null;
  // No redirect when signed in: signing up sets the cookie and re-renders this page,
  // and the form must stay on screen to show the recovery code.
  const signedIn = await getSignedIn();
  const nextQuery = next ? `?next=${encodeURIComponent(next)}` : "";
  return (
    <AuthFrame
      kicker={{ strong: "Free", rest: "Student account" }}
      title="Create your account"
      intro={<p>Keep your progress in every course: lectures you finished, questions you solved, quiz results and bookmarks, on any device.</p>}
      footer={
        <p>
          Already have an account?{" "}
          <Link href={`/login${nextQuery}`} className={stageLink}>
            Sign in
          </Link>
        </p>
      }
    >
      <SignUpForm next={next} turnstileSiteKey={getTurnstileKeys()?.siteKey ?? null} signedInAs={signedIn ? signedIn.email : null} />
    </AuthFrame>
  );
}
