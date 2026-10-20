import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/admin/form-parts";
import { PageHeader } from "@/components/admin/page-header";
import { getAdsSettings } from "@/server/ads/settings";
import { requireSite } from "@/server/auth/staff";
import { getSiteOwner, missingOwnerFacts } from "@/server/site/owner";
import { SiteOwnerForm } from "./site-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Site details" };

export default async function SiteDetailsPage() {
  await requireSite("manageSite", "/admin/site");
  const [owner, ads] = await Promise.all([getSiteOwner(), getAdsSettings()]);
  const missing = missingOwnerFacts(owner);
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Site"
        title="Site details"
        description={
          <>
            Facts only you can give. They appear on the{" "}
            <Link href="/privacy-policy" className="font-semibold text-primary-text hover:underline">
              privacy policy
            </Link>
            ,{" "}
            <Link href="/terms" className="font-semibold text-primary-text hover:underline">
              terms
            </Link>
            ,{" "}
            <Link href="/contact" className="font-semibold text-primary-text hover:underline">
              contact
            </Link>{" "}
            and{" "}
            <Link href="/about" className="font-semibold text-primary-text hover:underline">
              about
            </Link>{" "}
            pages. Nothing here is filled in for you.
          </>
        }
      />
      {missing.length > 0 ? (
        <Notice tone="warn">Still missing: {missing.join("; ")}. Until then the legal pages show these as gaps and say they are drafts.</Notice>
      ) : !owner.legalReviewed ? (
        <Notice tone="info">All details are in. The legal pages still say &quot;draft&quot; until you confirm they have been reviewed.</Notice>
      ) : null}
      <SiteOwnerForm
        hasPublisherId={!!ads.publisherId}
        initial={{
          operatorName: owner.operatorName ?? "",
          contactEmail: owner.contactEmail ?? "",
          country: owner.country ?? "",
          effectiveDate: owner.effectiveDate ?? "",
          legalReviewed: owner.legalReviewed,
          searchConsoleToken: owner.searchConsoleToken ?? "",
          adsenseMetaTag: owner.adsenseMetaTag,
        }}
      />
    </div>
  );
}
