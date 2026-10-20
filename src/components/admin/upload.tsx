"use client";

// Sends one file as the raw request body (with progress), the way the upload
// routes expect it (src/server/files/upload.ts). XHR rather than fetch, because
// fetch can't report upload progress.
import type { ActionResult } from "./use-admin-action";

export function uploadFile<T>(url: string, file: File, onProgress: (fraction: number) => void): Promise<ActionResult<T>> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("x-file-name", encodeURIComponent(file.name));
    xhr.setRequestHeader("content-type", "application/octet-stream");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      try {
        resolve(JSON.parse(xhr.responseText) as ActionResult<T>);
      } catch {
        resolve({ ok: false, error: xhr.status === 413 ? "The file is too big." : `The upload failed (${xhr.status}). Try again.` });
      }
    };
    xhr.onerror = () => resolve({ ok: false, error: "The connection dropped during the upload. Try again." });
    xhr.send(file);
  });
}

export function UploadProgress({ fraction, label }: { fraction: number; label: string }) {
  const percent = Math.round(fraction * 100);
  return (
    <div className="grid gap-1">
      <div className="flex justify-between text-xs text-muted">
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <progress max={100} value={percent} aria-label={label} className="h-2 w-full overflow-hidden rounded-full accent-[var(--cl-primary)]" />
    </div>
  );
}
