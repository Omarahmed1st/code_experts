"use client";

// Staff-only preview of where ads would go. Each possible slot is a hidden,
// empty marker in the page (no size, no network). With ?ad-preview=1 in the
// address, a signed-in staff member (or anyone on a local or preview build)
// sees a labelled dashed box in its place instead. Nothing here ever contacts
// an ad service.
import { useEffect, useState } from "react";
import { whoIsSignedIn } from "@/components/account/me";
import { previewRequested } from "@/lib/ads/browser";

export function AdPreview({
  placementKey,
  label,
  note,
  minHeightPx,
  appEnv,
  gap,
}: {
  placementKey: string;
  label: string;
  note: string;
  minHeightPx: number;
  appEnv: "local" | "preview" | "production";
  /** Margin classes, used only when the box is shown. */
  gap: string;
}) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!previewRequested(window.location.search)) return;
    let cancelled = false;
    void (async () => {
      const allowed = appEnv !== "production" || (await whoIsSignedIn())?.isStaff === true;
      await Promise.resolve();
      if (!cancelled && allowed) setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [appEnv]);

  if (!show) return <div hidden data-ad-marker={placementKey} />;
  return (
    <div role="note" className={`ad-preview ${gap}`} data-ad-marker={placementKey} style={{ minHeight: minHeightPx }}>
      <p className="ad-preview__title">Ad placement preview (only you see this)</p>
      <p>
        <code>{placementKey}</code>: {label}
      </p>
      <p className="ad-preview__note">Status: {note}. No ad is requested in preview.</p>
    </div>
  );
}
