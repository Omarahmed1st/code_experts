// JSON helpers for the API routes: bounded body reading and private, uncached,
// unindexed responses.

const HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex",
  "X-Content-Type-Options": "nosniff",
};

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: HEADERS });
}

export function jsonError(status: number, message: string): Response {
  return json({ error: message }, status);
}

/** The request body as JSON, or null when it isn't JSON or is larger than maxBytes. */
export async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  if (!(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json")) return null;
  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > maxBytes) return null;
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
