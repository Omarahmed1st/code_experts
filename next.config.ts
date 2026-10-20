import type { NextConfig } from "next";

/**
 * Security headers on every response (Phase 5.1). They don't change how any
 * page looks or works:
 * - no other site may show our pages in a frame (clickjacking: a hidden
 *   admin or account page under a fake button),
 * - browsers don't guess file types,
 * - links to other sites send only our origin, never the full address,
 * - pages can't ask for the camera, microphone, location or payments.
 * HSTS is ignored by browsers over plain http, so local development is unaffected.
 * A full Content-Security-Policy (scripts, styles, the runtimes' workers) is a
 * Phase 7 task; this one only forbids framing.
 * A route that sets one of these headers itself (lecture images, R2 files) keeps its own value.
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  async headers() {
    // "/:path*" doesn't match the home page itself here, so "/" has its own rule.
    return [
      { source: "/", headers: SECURITY_HEADERS },
      { source: "/:path*", headers: SECURITY_HEADERS },
    ];
  },
};

export default nextConfig;
