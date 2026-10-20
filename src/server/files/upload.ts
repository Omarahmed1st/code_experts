// Receives one uploaded file from a raw request body and streams it into R2.
//
// The browser sends the file itself as the body (not a form), with
// Content-Length set, so the Worker never holds a 90 MB PowerPoint in memory:
// the first bytes are read to learn what the file really is, then the rest
// streams straight through a SHA-256 digest into R2 at a known length.
import { FORMAT_INFO, type FileFormat, centralDirectoryNames, findCentralDirectory, imageSize, officeKind, sniffFormat } from "@/lib/files/sniff";
import { getBindings } from "@/server/platform/env";

export class UploadError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
  }
}

export interface Received {
  key: string;
  format: FileFormat;
  size: number;
  sha256: string;
  /** For pictures. */
  width: number | null;
  height: number | null;
}

const HEAD_BYTES = 64 * 1024;

function concat(chunks: Uint8Array[], total: number): Uint8Array {
  const out = new Uint8Array(total);
  let at = 0;
  for (const c of chunks) {
    out.set(c, at);
    at += c.length;
  }
  return out;
}

const hex = (buffer: ArrayBuffer) => [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");

/** Same-site check for upload routes (server actions check Origin themselves; route handlers must). */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

/**
 * Streams the request body into R2 at `key` when its real format is one of
 * `allowed` and its size is within `maxBytes`. Pictures are measured.
 * Office files (pptx/docx) are checked after the upload by reading the zip's
 * table of contents; a file that fails any check is removed again.
 */
export async function receiveUpload(
  request: Request,
  options: { key: string | ((format: FileFormat) => string); allowed: readonly FileFormat[]; maxBytes: number; fileName: string },
): Promise<Received> {
  const length = Number(request.headers.get("content-length"));
  if (!request.body || !Number.isInteger(length) || length <= 0) throw new UploadError("The file is empty, or the upload didn't say how big it is.", 411);
  if (length > options.maxBytes) throw new UploadError(`The file is too big (the limit is ${Math.floor(options.maxBytes / (1024 * 1024))} MB).`, 413);

  const reader = request.body.getReader();
  const headChunks: Uint8Array[] = [];
  let headLength = 0;
  while (headLength < Math.min(HEAD_BYTES, length)) {
    const { value, done } = await reader.read();
    if (done) break;
    headChunks.push(value);
    headLength += value.length;
  }
  const head = concat(headChunks, headLength);
  const sniffed = sniffFormat(head, options.fileName);
  const wantsOffice = options.allowed.some((f) => f === "pptx" || f === "docx");
  const allowedHere = (f: FileFormat | null): f is FileFormat => f !== null && (options.allowed.includes(f) || (f === "zip" && wantsOffice));
  if (!allowedHere(sniffed)) {
    await reader.cancel();
    throw new UploadError("This kind of file isn't accepted here.", 415);
  }
  let width: number | null = null;
  let height: number | null = null;
  if (["png", "jpeg", "webp", "gif"].includes(sniffed)) {
    const size = imageSize(head);
    if (!size || size.width < 1 || size.height < 1) {
      await reader.cancel();
      throw new UploadError("This picture can't be read. Save it again as PNG or JPEG.", 415);
    }
    ({ width, height } = size);
  }

  // Head chunks first, then the rest of the body, through a digest, into R2 at a fixed length.
  // workerd has crypto.DigestStream; the DOM typings of `crypto` don't know it.
  const { DigestStream: Digest } = crypto as unknown as { DigestStream: typeof DigestStream };
  const digest = new Digest("SHA-256");
  const digestWriter = digest.getWriter();
  let pending = [...headChunks];
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      const next: Uint8Array | undefined = pending.shift() ?? (await reader.read()).value;
      if (next === undefined) {
        controller.close();
        return;
      }
      await digestWriter.write(next);
      controller.enqueue(next);
    },
    cancel(reason) {
      pending = [];
      return reader.cancel(reason);
    },
  });
  const key = typeof options.key === "string" ? options.key : options.key(sniffed);
  const fixed = new FixedLengthStream(length);
  const piping = body.pipeTo(fixed.writable);
  const { files } = getBindings();
  try {
    await files.put(key, fixed.readable, { httpMetadata: { contentType: FORMAT_INFO[sniffed].contentType } });
    await piping;
  } catch {
    throw new UploadError("The upload was cut off. Try again.", 400);
  }
  await digestWriter.close();
  const sha256 = hex(await digest.digest);

  let format: FileFormat = sniffed;
  if (sniffed === "zip") {
    const kind = await zipKind(key, length);
    if (kind === "macro" || kind === null) {
      await files.delete(key);
      throw new UploadError(kind === "macro" ? "Files with macros aren't accepted. Save it as a normal .pptx or .docx." : "This file looks damaged: its zip contents can't be read.", 415);
    }
    format = kind;
    if (!options.allowed.includes(format)) {
      await files.delete(key);
      throw new UploadError("This kind of file isn't accepted here.", 415);
    }
  }
  return { key, format, size: length, sha256, width, height };
}

/** Reads the end of the stored zip, then its central directory, to tell .pptx and .docx from other zips. */
async function zipKind(key: string, size: number): Promise<"pptx" | "docx" | "zip" | "macro" | null> {
  const { files } = getBindings();
  const tailLength = Math.min(size, 65_557);
  const tailObject = await files.get(key, { range: { offset: size - tailLength, length: tailLength } });
  if (!tailObject) return null;
  const tail = new Uint8Array(await tailObject.arrayBuffer());
  const dir = findCentralDirectory(tail, size);
  if (!dir || dir.size > 8 * 1024 * 1024) return null;
  const dirObject = await files.get(key, { range: { offset: dir.offset, length: dir.size } });
  if (!dirObject) return null;
  return officeKind(centralDirectoryNames(new Uint8Array(await dirObject.arrayBuffer())));
}

/** The original file name the browser sent in x-file-name (URI-encoded), or the fallback. */
export function uploadName(request: Request, fallback: string): string {
  const raw = request.headers.get("x-file-name");
  if (!raw) return fallback;
  try {
    return decodeURIComponent(raw).slice(0, 255) || fallback;
  } catch {
    return fallback;
  }
}
