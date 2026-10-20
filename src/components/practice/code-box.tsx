// The read-only INPUT box of the lec stage: the question's code with line
// numbers, already highlighted on the server.

const LANGUAGE_NAME: Record<string, string> = { cpp: "C++", python: "Python", pseudocode: "Pseudocode", text: "Text" };

export function CodeBox({ lines, language, label = "the code" }: { lines: string[]; language: string | null; label?: string }) {
  return (
    <figure className="lec-stage lec-cinema" aria-label={`${LANGUAGE_NAME[language ?? "text"] ?? "Code"}: ${label}`}>
      <div className="lec-box">
        <div className="lec-box__head">
          <span className="lec-dot" style={{ background: "var(--lec-coral)" }} />
          <span className="lec-dot" style={{ background: "var(--lec-yel)" }} />
          <span className="lec-dot" style={{ background: "var(--lec-green)" }} />
          <span className="lec-box__label">
            <b>Input</b> · {label}
          </span>
          <span className="lec-box__tools">
            <span className="lec-box__label">{LANGUAGE_NAME[language ?? "text"] ?? ""}</span>
          </span>
        </div>
        <div className="lec-code" role="region" aria-label={label} tabIndex={0}>
          {lines.map((html, i) => (
            <div key={i} className="lec-line">
              <span className="lec-line__no" aria-hidden="true">
                {i + 1}
              </span>
              <span className="lec-line__code" dangerouslySetInnerHTML={{ __html: html || " " }} />
            </div>
          ))}
        </div>
      </div>
    </figure>
  );
}
