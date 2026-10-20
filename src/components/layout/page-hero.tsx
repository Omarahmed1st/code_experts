import type { ReactNode } from "react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";

/**
 * The dark "cinema" header used at the top of course, topic and lecture pages.
 * It stays dark in the light theme too, like the lecture videos.
 * `title` may mark one word with *asterisks* to colour it yellow.
 */
export function PageHero({
  crumbs,
  chapter,
  title,
  description,
  children,
  wide = false,
}: {
  crumbs: Crumb[];
  chapter?: { index?: string; label: string };
  title: string;
  description?: string;
  children?: ReactNode;
  wide?: boolean;
}) {
  return (
    <header className="lec-cinema border-b border-[#24365e]">
      <div className={`relative mx-auto px-4 pb-12 pt-8 sm:px-6 sm:pb-14 ${wide ? "max-w-7xl" : "max-w-6xl"}`}>
        <Breadcrumbs items={crumbs} tone="stage" />
        {chapter ? (
          <p className="lec-chapter mt-8">
            {chapter.index ? <b>{chapter.index}</b> : null}
            {chapter.index ? <i /> : null}
            {chapter.label}
          </p>
        ) : null}
        <h1 className={`max-w-4xl text-3xl font-bold sm:text-5xl ${chapter ? "mt-3" : "mt-8"}`}>
          <HotTitle text={title} />
        </h1>
        {description ? <p className="mt-4 max-w-3xl text-lg text-[var(--lec-mute)]">{description}</p> : null}
        {children}
      </div>
    </header>
  );
}

/** "A *String* is a sequence" -> the starred word in yellow, as in the lecture videos. */
export function HotTitle({ text }: { text: string }) {
  const parts = text.split("*");
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className="lec-hot">
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
