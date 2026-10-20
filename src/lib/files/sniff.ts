// What an uploaded file really is, from its bytes (never from its name or the
// browser's type), plus picture sizes and the Office zip check. Pure.

export type FileFormat = "pdf" | "pptx" | "docx" | "zip" | "png" | "jpeg" | "webp" | "gif" | "text";

export const FORMAT_INFO: Record<FileFormat, { contentType: string; extension: string; label: string }> = {
  pdf: { contentType: "application/pdf", extension: "pdf", label: "PDF" },
  pptx: { contentType: "application/vnd.openxmlformats-officedocument.presentationml.presentation", extension: "pptx", label: "PowerPoint (.pptx)" },
  docx: { contentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", extension: "docx", label: "Word (.docx)" },
  zip: { contentType: "application/zip", extension: "zip", label: "ZIP" },
  png: { contentType: "image/png", extension: "png", label: "PNG" },
  jpeg: { contentType: "image/jpeg", extension: "jpg", label: "JPEG" },
  webp: { contentType: "image/webp", extension: "webp", label: "WebP" },
  gif: { contentType: "image/gif", extension: "gif", label: "GIF" },
  text: { contentType: "text/plain; charset=utf-8", extension: "txt", label: "text" },
};

const MB = 1024 * 1024;

/**
 * What each kind of resource accepts, and how big. Workers accept request
 * bodies up to 100 MB on the Free and Pro plans [verify on Cloudflare's limits
 * page], so the largest file stays under that.
 */
export const RESOURCE_RULES: Record<string, { original: FileFormat[]; maxBytes: number }> = {
  presentation: { original: ["pptx", "pdf"], maxBytes: 95 * MB },
  pdf: { original: ["pdf"], maxBytes: 50 * MB },
  handout: { original: ["pdf", "docx"], maxBytes: 50 * MB },
  image: { original: ["png", "jpeg", "webp", "gif"], maxBytes: 10 * MB },
  code: { original: ["text", "zip"], maxBytes: 5 * MB },
  assignment: { original: ["pdf", "docx", "zip"], maxBytes: 50 * MB },
};
export const PREVIEW_RULE = { formats: ["pdf"] as FileFormat[], maxBytes: 50 * MB };
export const LESSON_IMAGE_RULE = { formats: ["png", "jpeg", "webp", "gif"] as FileFormat[], maxBytes: 5 * MB, maxSide: 6000 };

const starts = (b: Uint8Array, sig: number[], at = 0) => sig.every((v, i) => b[at + i] === v);

/**
 * The format from the first bytes (at least 16 are needed). A zip is "zip"
 * here; whether it is a .pptx or .docx is decided by its contents
 * (officeKindFromCentralDirectory). `nameHint` only picks text vs. unknown.
 */
export function sniffFormat(head: Uint8Array, nameHint = ""): FileFormat | null {
  if (starts(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) return "pdf"; // %PDF-
  if (starts(head, [0x50, 0x4b, 0x03, 0x04])) return "zip";
  if (starts(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "png";
  if (starts(head, [0xff, 0xd8, 0xff])) return "jpeg";
  if (starts(head, [0x52, 0x49, 0x46, 0x46]) && starts(head, [0x57, 0x45, 0x42, 0x50], 8)) return "webp";
  if (starts(head, [0x47, 0x49, 0x46, 0x38])) return "gif";
  if (/\.(cpp|cc|h|hpp|py|txt|md|csv|json)$/i.test(nameHint) && looksLikeText(head)) return "text";
  return null;
}

/** No NUL bytes and valid UTF-8 (allowing a character cut at the end of the sample). */
export function looksLikeText(bytes: Uint8Array): boolean {
  if (bytes.includes(0)) return false;
  try {
    new TextDecoder("utf-8", { fatal: true }).decode(bytes.subarray(0, Math.max(0, bytes.length - 3)));
    return true;
  } catch {
    return false;
  }
}

/** Width and height of a PNG, JPEG, WebP or GIF from its first bytes (64 KB is plenty), or null. */
export function imageSize(b: Uint8Array): { width: number; height: number } | null {
  const view = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const format = sniffFormat(b);
  try {
    if (format === "png") return { width: view.getUint32(16), height: view.getUint32(20) };
    if (format === "gif") return { width: view.getUint16(6, true), height: view.getUint16(8, true) };
    if (format === "webp") {
      const chunk = String.fromCharCode(b[12]!, b[13]!, b[14]!, b[15]!);
      if (chunk === "VP8 ") return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff };
      if (chunk === "VP8L") {
        const bits = view.getUint32(21, true);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
      if (chunk === "VP8X") {
        const w = b[24]! | (b[25]! << 8) | (b[26]! << 16);
        const h = b[27]! | (b[28]! << 8) | (b[29]! << 16);
        return { width: w + 1, height: h + 1 };
      }
      return null;
    }
    if (format === "jpeg") {
      let at = 2;
      while (at + 9 < b.length) {
        if (b[at] !== 0xff) return null;
        const marker = b[at + 1]!;
        if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) {
          at += 2;
          continue;
        }
        const length = view.getUint16(at + 2);
        // Start-of-frame markers (not DHT C4, JPG C8, DAC CC) hold the size.
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { width: view.getUint16(at + 7), height: view.getUint16(at + 5) };
        }
        at += 2 + length;
      }
      return null;
    }
  } catch {
    return null;
  }
  return null;
}

/** Where the central directory is, from the end of a zip (the last 64 KB + 22 bytes holds the end record). */
export function findCentralDirectory(tail: Uint8Array, fileSize: number): { offset: number; size: number } | null {
  const view = new DataView(tail.buffer, tail.byteOffset, tail.byteLength);
  for (let i = tail.length - 22; i >= 0; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      const size = view.getUint32(i + 12, true);
      const offset = view.getUint32(i + 16, true);
      if (offset === 0xffffffff || size === 0xffffffff) return null; // zip64: not something we expect from Office for a classroom file
      if (offset + size > fileSize) return null;
      return { offset, size };
    }
  }
  return null;
}

/** File names in a zip's central directory. */
export function centralDirectoryNames(dir: Uint8Array, limit = 20_000): string[] {
  const view = new DataView(dir.buffer, dir.byteOffset, dir.byteLength);
  const names: string[] = [];
  const decoder = new TextDecoder();
  let at = 0;
  while (at + 46 <= dir.length && names.length < limit) {
    if (view.getUint32(at, true) !== 0x02014b50) break;
    const nameLength = view.getUint16(at + 28, true);
    const extraLength = view.getUint16(at + 30, true);
    const commentLength = view.getUint16(at + 32, true);
    names.push(decoder.decode(dir.subarray(at + 46, at + 46 + nameLength)));
    at += 46 + nameLength + extraLength + commentLength;
  }
  return names;
}

/** pptx / docx when the zip has the parts Office needs, otherwise zip. Also refuses macro-enabled files. */
export function officeKind(names: readonly string[]): "pptx" | "docx" | "zip" | "macro" {
  const set = new Set(names);
  if (names.some((n) => /vbaProject\.bin$/i.test(n))) return "macro";
  if (!set.has("[Content_Types].xml")) return "zip";
  if (set.has("ppt/presentation.xml")) return "pptx";
  if (set.has("word/document.xml")) return "docx";
  return "zip";
}

/** A safe download name: letters, digits, spaces, dots, dashes; the right extension for its real format. */
export function safeFileName(name: string, format: FileFormat): string {
  const ext = format === "text" ? (/\.([A-Za-z0-9]{1,5})$/.exec(name)?.[1]?.toLowerCase() ?? "txt") : FORMAT_INFO[format].extension;
  const base = name
    .replace(/\.[^.]*$/, "")
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N} ._()-]+/gu, "-")
    .replace(/^[.\s-]+|[.\s-]+$/g, "")
    .slice(0, 80);
  return `${base || "file"}.${ext}`;
}
