/** The course slug in a /courses/<slug>/… path, or null outside a course. */
export function courseSlugFromPath(pathname: string | null | undefined): string | null {
  const match = /^\/courses\/([^/?#]+)/.exec(pathname ?? "");
  if (!match?.[1]) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null; // malformed %-escape: not a real course URL
  }
}
