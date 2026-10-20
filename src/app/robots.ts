import type { MetadataRoute } from "next";
import { absoluteUrl, indexable } from "@/server/seo";

export const dynamic = "force-dynamic";

/** Production allows crawling (except admin, API and personal pages); every other environment blocks it. */
export default function robots(): MetadataRoute.Robots {
  if (!indexable(true)) return { rules: { userAgent: "*", disallow: "/" } };
  const sitemap = absoluteUrl("/sitemap.xml");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/", "/dashboard", "/settings", "/login", "/register", "/forgot-password"] },
    ...(sitemap ? { sitemap } : {}),
  };
}
