import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { freePositions } from "@/server/admin/ads";
import { requireSite } from "@/server/auth/staff";
import { TEMPLATE_LABEL } from "../labels";
import { PlacementForm } from "../placement-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "New ad placement" };

export default async function NewPlacementPage() {
  await requireSite("manageAds", "/admin/ads/placements/new");
  const free = await freePositions();
  const positions = free.map((p) => ({ key: p.key, label: p.label, where: p.where, templateLabel: TEMPLATE_LABEL[p.template] }));
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Advertising"
        title="New placement"
        description={
          <>
            Pick one of the fixed positions and paste the ad unit id from AdSense.{" "}
            <Link href="/admin/ads" className="font-semibold text-primary-text hover:underline">
              Back to advertising
            </Link>
          </>
        }
      />
      <PlacementForm
        id={null}
        positions={positions}
        initial={{
          placementKey: positions[0]?.key ?? "",
          adUnitId: "",
          format: "auto",
          responsive: true,
          devices: "all",
          minHeightPx: "280",
          enabled: false,
          description: "",
        }}
      />
    </div>
  );
}
