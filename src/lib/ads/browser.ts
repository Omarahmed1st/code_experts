// Small pure rules used by the ad and privacy components in the browser,
// kept here so they can be tested without a browser.
import type { AdDevices } from "./policy";

/** The staff preview of ad positions is asked for with ?ad-preview=1. */
export function previewRequested(search: string): boolean {
  return new URLSearchParams(search).get("ad-preview") === "1";
}

/** Matches the lg breakpoint (1024 px) used by the layouts. */
export function deviceMatches(devices: AdDevices, width: number): boolean {
  if (devices === "all") return true;
  return devices === "desktop" ? width >= 1024 : width < 1024;
}

/** Every local-storage key this site writes (see the cookie policy): the theme and anything starting with "codelab:". */
export function siteStorageKeys(storage: Pick<Storage, "length" | "key">, themeKey: string): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && (key === themeKey || key.startsWith("codelab:"))) keys.push(key);
  }
  return keys;
}
