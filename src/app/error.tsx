"use client";

import { CircleAlert } from "lucide-react";
import Link from "next/link";
import { buttonClass } from "@/components/ui/button-styles";

/** Shown when a page fails to render. Never reveals error details to the visitor. */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-hard-soft text-hard">
        <CircleAlert aria-hidden="true" className="size-7" />
      </div>
      <h1 className="mt-6 text-4xl font-bold">Something went wrong</h1>
      <p className="mt-4 text-muted">This page couldn&apos;t be loaded. Please try again in a moment.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className={buttonClass("primary")}>
          Try again
        </button>
        <Link href="/courses" className={buttonClass("secondary")}>
          Browse courses
        </Link>
      </div>
    </div>
  );
}
