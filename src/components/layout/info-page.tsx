import type { ReactNode } from "react";
import { PageHero } from "./page-hero";

/** Plain reading page (about, accessibility): the cinema header, then prose. */
export function InfoPage({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const plain = title.replace(/\*/g, "");
  return (
    <>
      <PageHero crumbs={[{ label: "Home", href: "/" }, { label: plain }]} title={title} description={description} />
      <div className="lesson-prose mx-auto max-w-3xl px-4 pt-10 sm:px-6">{children}</div>
    </>
  );
}
