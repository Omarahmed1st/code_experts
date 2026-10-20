"use client";

// "Bookmark" on lectures, questions, files and quizzes. Signed in, it saves to
// the student's account in this course; guests are offered to sign in.
import { Bookmark, BookmarkCheck } from "lucide-react";
import { useState } from "react";
import { type BookmarkKind, saveBookmark, signInHref, useCourseState } from "./me";

export function BookmarkButton({ courseSlug, kind, slug, tone = "page" }: { courseSlug: string; kind: BookmarkKind; slug: string; tone?: "page" | "stage" }) {
  const state = useCourseState(courseSlug);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const cls =
    tone === "stage"
      ? "inline-flex min-h-11 items-center gap-2 rounded-xl border border-[#2c3f68] bg-[#101b33] px-4 text-sm font-semibold text-[var(--lec-ink)] hover:border-[var(--lec-yel)]"
      : "inline-flex min-h-11 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-surface-2";

  if (state === undefined) return <span aria-hidden="true" className={`${cls} invisible`}>Bookmark</span>;
  if (state === null) {
    return (
      <a href={signInHref()} className={cls} title="Sign in to keep bookmarks">
        <Bookmark aria-hidden="true" className="size-4" />
        Bookmark
      </a>
    );
  }
  const on = state.bookmarks.includes(`${kind}:${slug}`);
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-pressed={on}
        disabled={busy}
        className={cls}
        onClick={async () => {
          setError(null);
          setBusy(true);
          try {
            await saveBookmark(courseSlug, kind, slug, !on);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Couldn't save. Please try again.");
          } finally {
            setBusy(false);
          }
        }}
      >
        {on ? <BookmarkCheck aria-hidden="true" className="size-4 text-[var(--lec-yel)]" /> : <Bookmark aria-hidden="true" className="size-4" />}
        {on ? "Bookmarked" : "Bookmark"}
      </button>
      {error ? (
        <span role="alert" className="mt-1 text-xs font-semibold text-hard">
          {error}
        </span>
      ) : null}
    </span>
  );
}
