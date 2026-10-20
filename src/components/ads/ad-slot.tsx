// One ad position on a page. The page asks the server for its ads once
// (pageAds in src/server/ads/settings.ts) and puts an <AdSlot> at each fixed
// position. What renders:
// - the position isn't allowed or is over the page's cap: nothing;
// - allowed but not live (the normal state today): an empty hidden marker that
//   only the staff preview (?ad-preview=1) turns into a labelled box. The
//   marker has no size and no margin, so the page looks exactly as without ads;
// - live: the AdUnit, inside an error boundary, with its gap from the content
//   around it (`gap`, Tailwind margin classes).
import { AD_POSITIONS } from "@/lib/ads/policy";
import type { PageAdsResult } from "@/server/ads/settings";
import { AdPreview } from "./ad-preview";
import { AdErrorBoundary, AdUnit } from "./ad-unit";

export function AdSlot({ ads, position, gap = "my-12" }: { ads: PageAdsResult; position: string; gap?: string }) {
  const slot = ads.slots[position];
  if (!slot) return null;
  const key = `${ads.template}.${position}`;
  if (slot.state === "live") {
    const p = slot.placement;
    if (!ads.client || !p.adUnitId) return null;
    return (
      <div className={`ad-gap ${gap}`}>
        <AdErrorBoundary>
          <AdUnit
            client={ads.client}
            adUnitId={p.adUnitId}
            format={p.format}
            responsive={p.responsive}
            devices={p.devices}
            minHeightPx={p.minHeightPx}
            placementKey={key}
          />
        </AdErrorBoundary>
      </div>
    );
  }
  const info = AD_POSITIONS[ads.template].find((p) => p.position === position);
  return <AdPreview placementKey={key} label={info?.label ?? position} note={slot.note} minHeightPx={200} appEnv={ads.appEnv} gap={gap} />;
}
