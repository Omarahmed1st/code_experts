"use client";

import Script from "next/script";

/** Cloudflare Turnstile's widget (checked again on the server). Nothing when its keys aren't set. */
export function TurnstileWidget({ siteKey }: { siteKey: string | null }) {
  if (!siteKey) return null;
  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={siteKey} data-theme="auto" />
    </>
  );
}
