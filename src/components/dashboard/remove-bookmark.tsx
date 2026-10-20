"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type BookmarkKind, saveBookmark } from "@/components/account/me";

/** Removes one bookmark from the bookmarks page, then shows the list again. */
export function RemoveBookmark({ courseSlug, kind, slug, title }: { courseSlug: string; kind: BookmarkKind; slug: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex flex-col items-end">
      <button
        type="button"
        disabled={busy}
        className="inline-flex size-11 items-center justify-center rounded-xl text-muted hover:bg-surface-2 hover:text-ink disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await saveBookmark(courseSlug, kind, slug, false);
            router.refresh();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't remove it.");
            setBusy(false);
          }
        }}
      >
        <X aria-hidden="true" className="size-5" />
        <span className="sr-only">Remove the bookmark for {title}</span>
      </button>
      {error ? (
        <span role="alert" className="text-xs font-semibold text-hard">
          {error}
        </span>
      ) : null}
    </span>
  );
}
