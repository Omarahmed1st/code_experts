"use client";

// One live AdSense unit. Only rendered when the server decided this slot may
// show a live ad (production, every switch on, certified CMP, enabled
// placement with a real ad unit id, page not excluded). Then, in the browser:
// - wrong device for the placement (desktop-only on a phone): nothing;
// - a signed-in staff member and "hide ads from staff" is on: nothing (staff
//   must never click their own ads);
// - consent handling (ad-loader.ts) says no: nothing;
// - otherwise the <ins> is added and pushed once. If Google has no ad for it
//   (data-ad-status="unfilled"), the box folds away instead of staying blank.
// It never refreshes itself and never asks anyone to click.
import { Component, type ReactNode, useEffect, useRef, useState } from "react";
import { whoIsSignedIn } from "@/components/account/me";
import { deviceMatches } from "@/lib/ads/browser";
import type { AdClientConfig, AdDevices, AdFormat } from "@/lib/ads/policy";
import { ensureAdsScript } from "./ad-loader";

/** Any error inside an ad stays inside the ad: the lecture around it keeps working. */
export class AdErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function AdUnit({
  client,
  adUnitId,
  format,
  responsive,
  devices,
  minHeightPx,
  placementKey,
}: {
  client: AdClientConfig;
  adUnitId: string;
  format: AdFormat;
  responsive: boolean;
  devices: AdDevices;
  minHeightPx: number;
  placementKey: string;
}) {
  const [state, setState] = useState<"waiting" | "show" | "hidden">("waiting");
  const pushed = useRef(false);
  const insRef = useRef<HTMLModElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!deviceMatches(devices, window.innerWidth)) return setState("hidden");
      if (client.hideForStaff) {
        const me = await whoIsSignedIn();
        if (me?.isStaff) return !cancelled && setState("hidden");
      }
      const ready = await ensureAdsScript(client);
      if (!cancelled) setState(ready ? "show" : "hidden");
    })().catch(() => !cancelled && setState("hidden"));
    return () => {
      cancelled = true;
    };
  }, [client, devices]);

  useEffect(() => {
    const ins = insRef.current;
    if (state !== "show" || !ins || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // The ad script refused the push (for example a blocked script): fold the box away.
      queueMicrotask(() => setState("hidden"));
      return;
    }
    // Fold the box away if Google has no ad to show here.
    const observer = new MutationObserver(() => {
      if (ins.getAttribute("data-ad-status") === "unfilled") setState("hidden");
    });
    observer.observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    return () => observer.disconnect();
  }, [state]);

  if (state === "hidden") return null;
  return (
    <aside aria-label="Advertisement" className="ad-slot" data-placement={placementKey} style={{ minHeight: minHeightPx }}>
      <p className="ad-slot__label">Advertisement</p>
      {state === "show" ? (
        <ins
          ref={insRef}
          className="adsbygoogle ad-slot__ins"
          style={{ display: "block", minHeight: minHeightPx - 24 }}
          data-ad-client={`ca-${client.publisherId}`}
          data-ad-slot={adUnitId}
          data-ad-format={format}
          {...(responsive ? { "data-full-width-responsive": "true" } : {})}
        />
      ) : null}
    </aside>
  );
}
