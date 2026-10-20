// /ads.txt (Authorized Digital Sellers, IAB Tech Lab). Served only when a real
// AdSense publisher id has been entered on the advertising page; until then it
// is a 404, never a placeholder. The line is the one AdSense gives every
// publisher: google.com, pub-<16 digits>, DIRECT, f08c47fec0942fa0
// (f08c47fec0942fa0 is Google's certification authority id).
import { adsTxtBody } from "@/lib/ads/policy";
import { getAdsSettings } from "@/server/ads/settings";

export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const body = await getAdsSettings()
    .then((ads) => adsTxtBody(ads.publisherId))
    .catch(() => null);
  if (!body) {
    return new Response("Not found\n", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } });
  }
  return new Response(body, { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
