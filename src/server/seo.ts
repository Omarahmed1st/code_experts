// Page metadata helpers: canonical URLs, Open Graph, and indexing rules.
import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/site";
import { getBindings, getConfig } from "@/server/platform/env";

export { SITE_NAME };

/** Absolute URL for a path, or null when PUBLIC_SITE_URL isn't configured. */
export function absoluteUrl(path: string): string | null {
  const { publicSiteUrl } = getConfig();
  return publicSiteUrl ? `${publicSiteUrl}${path}` : null;
}

/** Search engines may index only production pages that ask for it. */
export function indexable(wantsIndex: boolean): boolean {
  return wantsIndex && getConfig().appEnv === "production";
}

export function pageMetadata({
  title,
  description,
  path,
  index = true,
  type = "website",
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const allowIndex = indexable(index);
  return {
    title,
    description,
    alternates: url ? { canonical: url } : undefined,
    robots: allowIndex ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description,
      type,
      siteName: SITE_NAME,
      ...(url ? { url } : {}),
    },
    twitter: { card: "summary", title, description },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): Record<string, unknown> | null {
  const elements = items.map((item, i) => {
    const url = absoluteUrl(item.path);
    return url ? { "@type": "ListItem", position: i + 1, name: item.name, item: url } : null;
  });
  if (elements.some((e) => e === null)) return null;
  return { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: elements };
}

export interface SeoOverride {
  title: string | null;
  description: string | null;
  noindex: boolean;
}

/** Title, description and "hide from search engines" set for a path in the admin (seo_metadata), or null. */
export async function getSeoOverride(path: string): Promise<SeoOverride | null> {
  const row = await getBindings()
    .db.prepare("SELECT title, description, noindex FROM seo_metadata WHERE path = ?")
    .bind(path)
    .first<{ title: string | null; description: string | null; noindex: number }>();
  return row ? { title: row.title, description: row.description, noindex: row.noindex === 1 } : null;
}

/** pageMetadata with the admin's overrides for this path applied. */
export async function pageMetadataWithSeo(input: Parameters<typeof pageMetadata>[0]): Promise<Metadata> {
  const seo = await getSeoOverride(input.path);
  if (!seo) return pageMetadata(input);
  return pageMetadata({
    ...input,
    title: seo.title || input.title,
    description: seo.description || input.description,
    index: (input.index ?? true) && !seo.noindex,
  });
}
