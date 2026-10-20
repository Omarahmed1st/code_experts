import { Download } from "lucide-react";
import { renderMarkdown } from "@/lib/markdown/render";
import { lessonImageUrl, fileNameOf } from "@/lib/lesson/media";
import { buildStage, displayCode } from "@/lib/lesson/stage";
import type { SectionView } from "@/server/content/lessons";
import { LecStage } from "./lec-stage";

const KIND_LABEL: Record<SectionView["kind"], { text: string; shape: string; color: string } | null> = {
  explanation: null,
  example: { text: "Example", shape: "diamond", color: "green" },
  code: { text: "Code", shape: "square", color: "yel" },
  diagram: { text: "Picture", shape: "circle", color: "sky" },
  common_mistakes: { text: "Watch out", shape: "tri", color: "coral" },
  key_takeaways: { text: "Remember", shape: "square", color: "yel" },
  note: { text: "Note", shape: "circle", color: "sky" },
};

/** Stable, readable anchor for a section: s-3-indexes-start-at-0 */
export function sectionAnchor(index: number, title: string): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `s-${index + 1}${words ? `-${words}` : ""}`;
}

export function LessonSection({
  section,
  index,
  course,
  mediaBase = "",
}: {
  section: SectionView;
  index: number;
  course: { slug: string; courseId: string };
  /** "/admin" in the admin's preview, where draft lectures' pictures are served to staff. */
  mediaBase?: string;
}) {
  const anchor = sectionAnchor(index, section.title);
  const label =
    section.kind === "code" && section.runnable
      ? { text: "Try it", shape: "square", color: "yel" }
      : section.kind === "note" && /check yourself/i.test(section.title)
        ? { text: "Quick check", shape: "circle", color: "sky" }
        : KIND_LABEL[section.kind];
  const panel = section.kind === "common_mistakes" || section.kind === "key_takeaways";
  const publicImageUrl = section.image ? lessonImageUrl(course.slug, course.courseId, section.image.key) : null;
  const imageUrl = publicImageUrl ? `${mediaBase}${publicImageUrl}` : null;

  let stage = null;
  if (section.code) {
    const code = displayCode(section.code);
    const lines = buildStage(code, section.codeLanguage ?? "text", section.annotations);
    const longest = Math.max(...code.split("\n").map((l) => l.length));
    stage = (
      <LecStage
        title={section.title}
        language={section.codeLanguage ?? "text"}
        code={code}
        lines={lines}
        runnable={section.runnable}
        sampleInput={section.sampleInput}
        expectedOutput={section.expectedOutput}
        wide={longest <= 38}
      />
    );
  }

  return (
    <section
      id={anchor}
      aria-labelledby={`${anchor}-h`}
      className={`lesson-section scroll-mt-24${panel ? ` lesson-panel lesson-panel--${section.kind}` : ""}`}
    >
      <p className="lec-chapter lesson-chapter">
        <b>{String(index + 1).padStart(2, "0")}</b>
        <i />
        {label ? (
          <span className="inline-flex items-center gap-2" data-color={label.color}>
            <span aria-hidden="true" className={`lec-shape lec-shape--${label.shape}`} />
            {label.text}
          </span>
        ) : (
          "Read"
        )}
      </p>
      <h2 id={`${anchor}-h`} className="mt-2 text-2xl sm:text-[1.65rem]">
        {section.title}
      </h2>
      {section.bodyMd ? (
        <div className="lesson-prose mt-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(section.bodyMd) }} />
      ) : null}
      {section.image && imageUrl ? (
        <figure className="lesson-figure">
          <div className="lesson-figure__frame">
            {/* Plain <img>: the file is already the right size, and width/height reserve its space. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={section.image.alt}
              width={section.image.width}
              height={section.image.height}
              loading="lazy"
              decoding="async"
            />
          </div>
          <figcaption>
            <a href={imageUrl} download={fileNameOf(section.image.key)} className="lesson-figure__download">
              <Download aria-hidden="true" className="size-4" />
              Download {fileNameOf(section.image.key)}
              <span className="text-muted">
                ({section.image.width} × {section.image.height} px)
              </span>
            </a>
          </figcaption>
        </figure>
      ) : null}
      {stage}
    </section>
  );
}
