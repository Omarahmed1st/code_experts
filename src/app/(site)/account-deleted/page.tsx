import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/layout/page-hero";
import { buttonClass } from "@/components/ui/button-styles";

export const metadata: Metadata = { title: "Account deleted", robots: { index: false, follow: false } };

export default function AccountDeletedPage() {
  return (
    <>
      <PageHero crumbs={[{ label: "Home", href: "/" }, { label: "Account deleted" }]} title="Account *deleted*" description="Your account and everything saved with it are gone. You are signed out." />
      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-3xl gap-4 px-4 pt-8 sm:px-6">
        <p>Every lecture and question is still open to you without an account. You can make a new account at any time.</p>
        <p>
          <Link href="/" className={buttonClass("primary")}>
            Back to the home page
          </Link>
        </p>
      </div>
    </>
  );
}
