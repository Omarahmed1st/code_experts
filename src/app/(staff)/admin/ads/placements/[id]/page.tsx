import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/page-header";
import { formatAdminTime } from "@/lib/admin/time";
import { AD_POSITIONS, parsePlacementKey } from "@/lib/ads/policy";
import { listPlacements } from "@/server/ads/settings";
import { requireSite } from "@/server/auth/staff";
import { TEMPLATE_LABEL } from "../labels";
import { PlacementForm } from "../placement-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ad placement" };

export default async function PlacementPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireSite("manageAds", `/admin/ads/placements/${encodeURIComponent(id)}`);
  const placement = (await listPlacements()).find((p) => p.id === id);
  if (!placement) notFound();
  const key = parsePlacementKey(placement.placementKey);
  const info = key ? AD_POSITIONS[key.template].find((p) => p.position === key.position) : undefined;
  const positions =
    key && info ? [{ key: placement.placementKey, label: info.label, where: info.where, templateLabel: TEMPLATE_LABEL[key.template] }] : [];
  return (
    <div className="grid gap-6">
      <PageHeader
        chapter="Advertising"
        title={info ? info.label : placement.placementKey}
        description={
          <>
            Last edited {formatAdminTime(placement.updatedAt)}
            {placement.updatedByName ? ` by ${placement.updatedByName}` : ""}.{" "}
            <Link href="/admin/ads" className="font-semibold text-primary-text hover:underline">
              Back to advertising
            </Link>
          </>
        }
      />
      <PlacementForm
        key={placement.updatedAt}
        id={placement.id}
        positions={positions}
        initial={{
          placementKey: placement.placementKey,
          adUnitId: placement.adUnitId ?? "",
          format: placement.format,
          responsive: placement.responsive,
          devices: placement.devices,
          minHeightPx: String(placement.minHeightPx),
          enabled: placement.enabled,
          description: placement.description,
        }}
      />
    </div>
  );
}
