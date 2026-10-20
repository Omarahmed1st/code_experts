"use client";

// Loads the consent platform and the AdSense script, once per page, and only
// when the server has decided this page may show a live ad (see AdSlot).
//
// Order:
// - Google's Privacy & messaging (a Google-certified CMP): its consent message
//   is delivered by the AdSense script itself, which reads the consent before
//   choosing personalised, non-personalised or limited ads. So the AdSense
//   script is loaded and Google's own consent handling takes over.
// - A certified third-party CMP: its script (CMP_SCRIPT_URL) loads first; the
//   AdSense script waits until the CMP reports a decision through the IAB TCF
//   API (__tcfapi), or says the visitor isn't covered by GDPR. If the CMP
//   doesn't load or never answers, no ad script is loaded at all.
// - No CMP: nothing loads (the server never gets this far either).
//
// The page's lecture, code runner and quizzes never wait for any of this.

import type { AdClientConfig } from "@/lib/ads/policy";

export type { AdClientConfig };

export const ADSENSE_SCRIPT_ORIGIN = "https://pagead2.googlesyndication.com";

type TcData = { gdprApplies?: boolean; eventStatus?: string; listenerId?: number };
type TcfApi = (command: string, version: number, callback: (data: TcData, success: boolean) => void, parameter?: unknown) => void;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
    __tcfapi?: TcfApi;
    googlefc?: { callbackQueue?: unknown[]; showRevocationMessage?: () => void };
  }
}

let loading: Promise<boolean> | null = null;

/** Adds a script tag once (by its marker); resolves when it has loaded. */
function addScriptOnce(src: string, marker: string, crossOrigin = false): Promise<void> {
  const existing = document.querySelector<HTMLScriptElement>(`script[data-codelab="${marker}"]`);
  if (existing) {
    return existing.dataset.loaded === "1"
      ? Promise.resolve()
      : new Promise((resolve, reject) => {
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => reject(new Error(`${marker} failed to load`)), { once: true });
        });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.dataset.codelab = marker;
    if (crossOrigin) script.crossOrigin = "anonymous";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "1";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`${marker} failed to load`)), { once: true });
    document.head.appendChild(script);
  });
}

/** Resolves true once a TCF CMP reports a decision (or GDPR doesn't apply), false on timeout or no CMP. */
export function waitForTcfDecision(timeoutMs = 10_000, win: Window = window): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value: boolean) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    const timer = setTimeout(() => finish(false), timeoutMs);
    const start = Date.now();
    const attach = () => {
      const api = win.__tcfapi;
      if (typeof api !== "function") {
        if (Date.now() - start > timeoutMs) return;
        setTimeout(attach, 100);
        return;
      }
      try {
        api("addEventListener", 2, (data, success) => {
          if (!success) return;
          if (data.gdprApplies === false || data.eventStatus === "tcloaded" || data.eventStatus === "useractioncomplete") {
            clearTimeout(timer);
            if (typeof data.listenerId === "number") {
              try {
                api("removeEventListener", 2, () => undefined, data.listenerId);
              } catch {
                // Not every CMP supports removing; the listener is harmless.
              }
            }
            finish(true);
          }
        });
      } catch {
        clearTimeout(timer);
        finish(false);
      }
    };
    attach();
  });
}

/** True when the ad script is ready (after consent handling); false when ads must not load. Runs once per page. */
export function ensureAdsScript(config: AdClientConfig): Promise<boolean> {
  loading ??= (async () => {
    try {
      if (config.provider === "none" || !/^pub-\d{16}$/.test(config.publisherId)) return false;
      if (config.provider === "certified_third_party") {
        if (!config.cmpScriptUrl) return false;
        await addScriptOnce(config.cmpScriptUrl, "cmp");
        if (!(await waitForTcfDecision())) return false;
      }
      window.adsbygoogle = window.adsbygoogle || [];
      await addScriptOnce(`${ADSENSE_SCRIPT_ORIGIN}/pagead/js/adsbygoogle.js?client=ca-${config.publisherId}`, "adsense", true);
      return true;
    } catch {
      return false;
    }
  })();
  return loading;
}

/** Re-opens the consent message so a visitor can change or withdraw consent (Privacy choices page). */
export async function openConsentChoices(config: AdClientConfig): Promise<"opened" | "unavailable"> {
  if (config.provider === "google_privacy_messaging") {
    const ready = await ensureAdsScript(config);
    if (!ready) return "unavailable";
    window.googlefc = window.googlefc || {};
    window.googlefc.callbackQueue = window.googlefc.callbackQueue || [];
    window.googlefc.callbackQueue.push(() => window.googlefc?.showRevocationMessage?.());
    return "opened";
  }
  if (config.provider === "certified_third_party" && config.cmpScriptUrl) {
    // Many TCF CMPs answer "displayConsentUi"; it isn't part of the TCF standard,
    // so the owner checks it with their CMP (docs/PHASE_6_PRIVACY_AND_CONSENT.md).
    try {
      await addScriptOnce(config.cmpScriptUrl, "cmp");
      const api = window.__tcfapi;
      if (typeof api !== "function") return "unavailable";
      api("displayConsentUi", 2, () => undefined);
      return "opened";
    } catch {
      return "unavailable";
    }
  }
  return "unavailable";
}
