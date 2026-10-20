import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { SiteChrome } from "@/components/layout/site-chrome";
import { buttonClass } from "@/components/ui/button-styles";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

// Unknown addresses render here, outside the (site) layout, so it brings the site's header and footer itself.
export default function NotFound() {
  return (
    <SiteChrome>
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:px-6">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-soft text-primary-text">
        <SearchX aria-hidden="true" className="size-7" />
      </div>
      <p className="mt-6 font-mono text-sm text-muted">404</p>
      <h1 className="mt-2 text-4xl font-bold">We couldn&apos;t find that page</h1>
      <p className="mt-4 text-muted">
        The link may be old, or the page may have moved to a different course. Pick a course to find what you were
        looking for.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/courses" className={buttonClass("primary")}>
          Browse courses
        </Link>
        <Link href="/" className={buttonClass("secondary")}>
          Go to the home page
        </Link>
      </div>
    </div>
    </SiteChrome>
  );
}
