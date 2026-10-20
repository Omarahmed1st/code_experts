// Streams one R2 object to the browser with safe headers.
//
// Callers decide whether the object may be served (published, public, this
// course) before calling; this module only handles the HTTP side: conditional
// requests (ETag), byte ranges (PDF viewers use them), and headers that stop
// the browser from treating a file as a page on our origin.
import { getBindings } from "@/server/platform/env";

/** Types we serve inline. Anything else is sent as a download. */
const INLINE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif", "application/pdf"]);

export interface ServeOptions {
  key: string;
  contentType: string;
  filename: string;
  /** "inline" is honoured only for INLINE_TYPES. */
  disposition: "inline" | "attachment";
  cacheControl: string;
}

function contentDisposition(kind: "inline" | "attachment", filename: string): string {
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${kind}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

export async function serveR2Object(request: Request, options: ServeOptions): Promise<Response> {
  const { files } = getBindings();
  const object = await files.get(options.key, {
    onlyIf: request.headers,
    range: request.headers.has("range") ? request.headers : undefined,
  });
  if (!object) return notFoundResponse();

  const inline = options.disposition === "inline" && INLINE_TYPES.has(options.contentType);
  const headers = new Headers({
    "Content-Type": inline ? options.contentType : "application/octet-stream",
    "Content-Disposition": contentDisposition(inline ? "inline" : "attachment", options.filename),
    "Cache-Control": options.cacheControl,
    ETag: object.httpEtag,
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Cross-Origin-Resource-Policy": "same-origin",
  });
  // Even if a file were opened directly, it can't run scripts on our origin. (Not for PDFs:
  // Chrome's PDF viewer refuses to open a document served with a CSP sandbox.)
  if (!(inline && options.contentType === "application/pdf")) {
    headers.set("Content-Security-Policy", "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; sandbox");
  }

  // onlyIf failed: the browser's copy is current (or the precondition failed).
  if (!("body" in object)) {
    return new Response(null, { status: request.headers.has("if-none-match") ? 304 : 412, headers });
  }

  const range = object.range as { offset?: number; length?: number; suffix?: number } | undefined;
  if (range && request.headers.has("range")) {
    const size = object.size;
    const offset = range.suffix !== undefined ? size - range.suffix : (range.offset ?? 0);
    const length = range.suffix !== undefined ? range.suffix : (range.length ?? size - offset);
    headers.set("Content-Range", `bytes ${offset}-${offset + length - 1}/${size}`);
    headers.set("Content-Length", String(length));
    return new Response(object.body, { status: 206, headers });
  }
  headers.set("Content-Length", String(object.size));
  return new Response(object.body, { headers });
}

export function notFoundResponse(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}
