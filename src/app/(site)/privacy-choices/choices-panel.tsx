"use client";

// Privacy choices: re-open the consent tool (only when ads are live; it loads
// on the click, never before), and clear what this site keeps in this
// browser's local storage.
import { ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { Notice } from "@/components/admin/form-parts";
import { openConsentChoices } from "@/components/ads/ad-loader";
import { THEME_STORAGE_KEY } from "@/components/layout/theme-script";
import { siteStorageKeys } from "@/lib/ads/browser";
import type { AdClientConfig } from "@/lib/ads/policy";
import { buttonClass } from "@/components/ui/button-styles";

export function ConsentButton({ client }: { client: AdClientConfig }) {
  const [state, setState] = useState<"idle" | "opening" | "opened" | "unavailable">("idle");
  return (
    <div className="grid gap-3">
      <div>
        <button
          type="button"
          className={buttonClass("primary")}
          disabled={state === "opening"}
          onClick={() => {
            setState("opening");
            void openConsentChoices(client).then(setState);
          }}
        >
          <ShieldCheck aria-hidden="true" className="size-4" />
          {state === "opening" ? "Opening…" : "Change my ad privacy choices"}
        </button>
      </div>
      <div aria-live="polite">
        {state === "opened" ? (
          <p className="text-sm text-muted">The consent window should now be open. If you don&apos;t see it, it may not apply where you are.</p>
        ) : null}
        {state === "unavailable" ? (
          <Notice tone="warn">The consent tool didn&apos;t load. A browser extension may be blocking it; ads can&apos;t load either while it is blocked.</Notice>
        ) : null}
      </div>
    </div>
  );
}

export function ClearDeviceData() {
  const [cleared, setCleared] = useState<number | null>(null);
  return (
    <div className="grid gap-3">
      <div>
        <button
          type="button"
          className={buttonClass("secondary")}
          onClick={() => {
            try {
              const keys = siteStorageKeys(window.localStorage, THEME_STORAGE_KEY);
              for (const key of keys) window.localStorage.removeItem(key);
              document.documentElement.removeAttribute("data-theme");
              setCleared(keys.length);
            } catch {
              setCleared(0);
            }
          }}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Clear this site&apos;s data on this device
        </button>
      </div>
      <div aria-live="polite">
        {cleared !== null ? (
          <p className="text-sm text-muted">
            {cleared === 0 ? "Nothing was stored on this device." : `Cleared ${cleared} item${cleared === 1 ? "" : "s"}: theme, practice progress and unfinished attempts.`}
          </p>
        ) : null}
      </div>
    </div>
  );
}
