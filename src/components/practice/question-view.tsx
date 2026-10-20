"use client";

// One question of any type: the prompt, the code, the answer controls, hints,
// and (once marked) the feedback and review. The parent owns the answer and
// decides when it is marked: a single exercise page, a practice set, a
// practice quiz (marked one by one) or an exam (marked on submit).
import { useState } from "react";
import { ASK_LABEL, countBlanks, fillBlanks, joinOrder, sameLines, splitBlanks, splitHtmlAtBlanks } from "@/lib/exercise/ask";
import type { CompareMode } from "@/lib/grading/output";
import { highlight } from "@/lib/markdown/highlight";
import type { PublicExercise } from "@/server/exercises/catalog";
import type { Review } from "@/server/grading/grade";
import { CodeAnswer, type TestSummary } from "./code-answer";
import { CodeBox } from "./code-box";

/**
 * The student's answer. Fill-in-the-blanks and put-in-order answers are code
 * answers too: `code` is the program they build (what the server marks), and
 * `blanks` / `lines` keep what they typed or arranged.
 */
export type Answer =
  | { kind: "mcq"; selected: string[] }
  | { kind: "trace"; answer: string }
  | { kind: "code"; code: string; tests?: { passed: number; total: number }; blanks?: string[]; lines?: string[] };

export const TYPE_LABEL: Record<PublicExercise["type"], { text: string; shape: string }> = {
  mcq: { text: "Multiple choice", shape: "circle" },
  trace: { text: "Trace the code", shape: "diamond" },
  correct_code: { text: "Correct the code", shape: "tri" },
  write_code: { text: "Write the code", shape: "square" },
};

/** The label for a question's type, or for its format (fill in the blanks, …) when it has one. */
export function typeLabel(q: Pick<PublicExercise, "type" | "ask">): { text: string; shape: string } {
  const base = TYPE_LABEL[q.type];
  return q.ask ? { text: ASK_LABEL[q.ask], shape: base.shape } : base;
}

export function emptyAnswer(q: PublicExercise): Answer {
  if (q.type === "mcq") return { kind: "mcq", selected: [] };
  if (q.type === "trace") return { kind: "trace", answer: "" };
  if (q.ask === "blanks") return { kind: "code", code: q.code ?? "", blanks: Array.from({ length: countBlanks(q.code ?? "") }, () => "") };
  // Put in order: nothing is answered until a line is moved.
  if (q.ask === "order") return { kind: "code", code: "", lines: q.order?.pieces.map((p) => p.text) ?? [] };
  return { kind: "code", code: q.code ?? "" };
}

export function isAnswered(q: PublicExercise, a: Answer | undefined): boolean {
  if (!a) return false;
  if (a.kind === "mcq") return a.selected.length > 0;
  if (a.kind === "trace") return a.answer.trim() !== "";
  return a.code.trim() !== "" && a.code !== (q.code ?? "");
}

/** How a practice answer went: "passed_tests" is the student's own browser test run, never a mark. */
export type PracticeOutcome = "correct" | "passed_tests" | "wrong";

/**
 * The practice outcome. MCQ and trace: the server's mark. Correct the code:
 * the server's match with a known fix ("correct"), or every test passing in the
 * browser ("passed_tests"). Write the code: only the browser's test run
 * ("passed_tests"), because the server can't run code yet.
 */
export function practiceOutcome(review: Review, tests: TestSummary | null): PracticeOutcome {
  if (review.correct === true) return "correct";
  if (review.type === "correct_code" || review.type === "write_code") {
    return tests !== null && tests.fatal === undefined && tests.total > 0 && tests.passed === tests.total ? "passed_tests" : "wrong";
  }
  return "wrong";
}

const LETTERS = "ABCDEFGHIJ";

function McqAnswer({
  q,
  answer,
  onChange,
  review,
  locked,
}: {
  q: PublicExercise;
  answer: Extract<Answer, { kind: "mcq" }>;
  onChange: (a: Answer) => void;
  review: Review | null;
  locked: boolean;
}) {
  const name = `q-${q.id}`;
  const toggle = (id: string) => {
    if (locked) return;
    if (!q.multiple) return onChange({ kind: "mcq", selected: [id] });
    const set = new Set(answer.selected);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ kind: "mcq", selected: q.options.map((o) => o.id).filter((oid) => set.has(oid)) });
  };
  return (
    <fieldset className="q-options">
      <legend className="sr-only">{q.multiple ? "Choose every correct answer" : "Choose one answer"}</legend>
      {q.multiple ? <p className="text-sm text-muted">Choose every correct answer.</p> : null}
      {q.options.map((option, i) => {
        const picked = answer.selected.includes(option.id);
        const isRight = review?.correctOptionIds.includes(option.id) ?? false;
        const result = review ? (picked && isRight ? "right" : picked ? "wrong" : isRight ? "missed" : undefined) : undefined;
        const note = review ? review.optionFeedback[option.id] : undefined;
        return (
          <label key={option.id} className="q-option" data-result={result} data-locked={locked} data-multiple={q.multiple}>
            <input
              type={q.multiple ? "checkbox" : "radio"}
              name={name}
              value={option.id}
              checked={picked}
              disabled={locked && !picked}
              onChange={() => toggle(option.id)}
            />
            <span className="q-option__letter" aria-hidden="true">
              {LETTERS[i] ?? i + 1}
            </span>
            <span className="q-option__text" dangerouslySetInnerHTML={{ __html: option.html }} />
            {result ? (
              <span className="q-option__note">
                <span className="q-option__tag">
                  {result === "right" ? "Correct" : result === "wrong" ? "Not this one" : "Correct answer"}
                </span>
                {note ? <span dangerouslySetInnerHTML={{ __html: note }} /> : null}
              </span>
            ) : null}
          </label>
        );
      })}
    </fieldset>
  );
}

/** "How many times?" and "Find the value": a one-line answer. */
function ShortAnswer({
  q,
  answer,
  onChange,
  locked,
}: {
  q: PublicExercise;
  answer: Extract<Answer, { kind: "trace" }>;
  onChange: (a: Answer) => void;
  locked: boolean;
}) {
  const id = `short-${q.id}`;
  const count = q.ask === "count";
  return (
    <div className="q-short">
      <label htmlFor={id} className="q-short__label">
        {count ? "Number of times" : "Your answer"}
      </label>
      <input
        id={id}
        className="q-short__input"
        value={answer.answer}
        onChange={(e) => onChange({ kind: "trace", answer: e.target.value })}
        disabled={locked}
        inputMode={count ? "numeric" : "text"}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        maxLength={200}
        placeholder={count ? "e.g. 4" : "Type the value"}
      />
    </div>
  );
}

const LANGUAGE_NAME: Record<string, string> = { cpp: "C++", python: "Python", pseudocode: "Pseudocode", text: "Text" };

/** The lec INPUT box shell around an answer made inside the code. */
function CodeShell({ language, label, children }: { language: string | null; label: string; children: React.ReactNode }) {
  return (
    <div className="lec-stage lec-cinema">
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
        {children}
      </div>
    </div>
  );
}

/** Fill in the blanks: the program with a text box in place of each ___. */
function BlanksAnswer({
  q,
  answer,
  onChange,
  locked,
}: {
  q: PublicExercise;
  answer: Extract<Answer, { kind: "code" }>;
  onChange: (a: Answer) => void;
  locked: boolean;
}) {
  const template = q.code ?? "";
  const total = countBlanks(template);
  const values = Array.from({ length: total }, (_, i) => answer.blanks?.[i] ?? "");
  const rawLines = template.replace(/\n+$/, "").split("\n");
  let blank = 0;
  return (
    <CodeShell language={q.codeLanguage} label="fill in every blank">
      <div className="lec-code q-blanks" role="group" aria-label={`The program, with ${total} ${total === 1 ? "blank" : "blanks"} to fill in`}>
        {rawLines.map((raw, lineIndex) => {
          const texts = splitBlanks(raw);
          const htmls = splitHtmlAtBlanks(q.codeLines[lineIndex] ?? "");
          return (
            <div key={lineIndex} className="lec-line">
              <span className="lec-line__no" aria-hidden="true">
                {lineIndex + 1}
              </span>
              <span className="lec-line__code">
                {texts.map((_, part) => {
                  const html = <span key={`t${part}`} dangerouslySetInnerHTML={{ __html: htmls[part] ?? "" }} />;
                  if (part === texts.length - 1) return html;
                  const n = blank++;
                  const value = values[n] ?? "";
                  return [
                    html,
                    <input
                      key={`b${n}`}
                      className="q-blank"
                      aria-label={`Blank ${n + 1} of ${total} (line ${lineIndex + 1})`}
                      value={value}
                      size={Math.max(4, value.length + 1)}
                      disabled={locked}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoComplete="off"
                      maxLength={120}
                      onChange={(e) => {
                        const next = values.map((v, i) => (i === n ? e.target.value : v));
                        onChange({ kind: "code", code: fillBlanks(template, next), blanks: next });
                      }}
                    />,
                  ];
                })}
              </span>
            </div>
          );
        })}
      </div>
    </CodeShell>
  );
}

/** Put the lines in order: the fixed lines stay put, the middle lines move up and down. */
function OrderAnswer({
  q,
  answer,
  onChange,
  locked,
}: {
  q: PublicExercise;
  answer: Extract<Answer, { kind: "code" }>;
  onChange: (a: Answer) => void;
  locked: boolean;
}) {
  const order = q.order;
  if (!order) return null;
  const pieceTexts = order.pieces.map((p) => p.text);
  const lines = answer.lines && sameLines(answer.lines, pieceTexts) ? answer.lines : pieceTexts;
  const htmlOf = (text: string) => order.pieces.find((p) => p.text === text)?.html ?? "";
  const move = (from: number, to: number) => {
    if (locked || to < 0 || to >= lines.length) return;
    const next = [...lines];
    [next[from], next[to]] = [next[to]!, next[from]!];
    const parts = { before: order.before.map((l) => l.text), after: order.after.map((l) => l.text) };
    onChange({ kind: "code", code: joinOrder(parts, next), lines: next });
  };
  const fixed = (l: { html: string }, no: number) => (
    <div key={`f${no}`} className="lec-line">
      <span className="lec-line__no" aria-hidden="true">
        {no}
      </span>
      <span className="lec-line__code" dangerouslySetInnerHTML={{ __html: l.html || " " }} />
    </div>
  );
  const start = order.before.length;
  return (
    <CodeShell language={q.codeLanguage} label="put the middle lines in order">
      <div className="lec-code q-order">
        {order.before.map((l, i) => fixed(l, i + 1))}
        <ol className="q-order__list" aria-label="Lines to put in order">
          {lines.map((text, i) => (
            // Keyed by the line (and which copy of it), so a moved line keeps its focus.
            <li key={`${text}#${lines.slice(0, i).filter((t) => t === text).length}`} className="q-order__item">
              <span className="lec-line__no" aria-hidden="true">
                {start + i + 1}
              </span>
              <span className="lec-line__code" dangerouslySetInnerHTML={{ __html: htmlOf(text) || " " }} />
              <span className="q-order__moves">
                <button type="button" className="q-order__btn" onClick={() => move(i, i - 1)} disabled={locked || i === 0} aria-label={`Move line ${start + i + 1} up`}>
                  ↑
                </button>
                <button
                  type="button"
                  className="q-order__btn"
                  onClick={() => move(i, i + 1)}
                  disabled={locked || i === lines.length - 1}
                  aria-label={`Move line ${start + i + 1} down`}
                >
                  ↓
                </button>
              </span>
            </li>
          ))}
        </ol>
        {order.after.map((l, i) => fixed(l, start + lines.length + i + 1))}
      </div>
    </CodeShell>
  );
}

function TraceAnswer({
  q,
  answer,
  onChange,
  locked,
}: {
  q: PublicExercise;
  answer: Extract<Answer, { kind: "trace" }>;
  onChange: (a: Answer) => void;
  locked: boolean;
}) {
  const id = `trace-${q.id}`;
  return (
    <div className="lec-stage lec-cinema">
      <div className="lec-box">
        <div className="lec-box__head">
          <span className="lec-dot" style={{ background: "#3a4d78" }} />
          <span className="lec-dot" style={{ background: "#3a4d78" }} />
          <span className="lec-dot" style={{ background: "#3a4d78" }} />
          <label htmlFor={id} className="lec-box__label">
            <b>Output</b> · type what it prints
          </label>
        </div>
        <textarea
          id={id}
          className="q-trace-input"
          value={answer.answer}
          onChange={(e) => onChange({ kind: "trace", answer: e.target.value })}
          disabled={locked}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          rows={Math.max(4, answer.answer.split("\n").length + 1)}
          placeholder={"One line of output per line.\nPress Enter for a new line."}
        />
      </div>
    </div>
  );
}

function Feedback({ tone, title, children }: { tone: "right" | "wrong" | "info"; title: string; children?: React.ReactNode }) {
  return (
    <div className="q-feedback" data-tone={tone} role="status">
      <span className="q-feedback__icon" aria-hidden="true">
        {tone === "right" ? "✓" : tone === "wrong" ? "✗" : "i"}
      </span>
      <div>
        <p className="q-feedback__title">{title}</p>
        {children ? <div className="mt-1 text-sm">{children}</div> : null}
      </div>
    </div>
  );
}

/** What the mark means, in words, for the student's last answer. */
export function Verdict({ review, tests, inQuiz }: { review: Review; tests: TestSummary | null; inQuiz: boolean }) {
  const browserNote = tests && tests.total > 0 ? `${tests.passed} of ${tests.total} tests passed in your browser.` : null;
  if (review.type === "write_code") {
    if (tests && tests.total > 0 && tests.passed === tests.total && !tests.fatal) {
      return <Feedback tone="right" title="All tests pass">Your program passed every test, run in your browser. Compare it with the model solution below.</Feedback>;
    }
    return (
      <Feedback tone={tests ? "wrong" : "info"} title={tests ? "Not every test passes yet" : "Compare with the model solution"}>
        {browserNote ?? "Your code wasn't run."} Read the model solution and explanation, then try again.
      </Feedback>
    );
  }
  if (review.ask === "blanks" || review.ask === "order") {
    if (review.matchedSolution) return <Feedback tone="right" title="Correct" />;
    if (!inQuiz && tests && tests.passed === tests.total && tests.total > 0 && !tests.fatal) {
      return (
        <Feedback tone="right" title="Every test passes">
          Your program is different from the expected one, but it passed every test in your browser. Compare it with the complete program below.
        </Feedback>
      );
    }
    return (
      <Feedback tone="wrong" title="Not quite">
        {review.ask === "order" ? "Some lines are in the wrong place." : "At least one blank isn't right."}
        {browserNote ? ` ${browserNote}` : ""}
      </Feedback>
    );
  }
  if (review.type === "correct_code") {
    if (review.matchedSolution) return <Feedback tone="right" title="Fixed">Your fix matches the expected fix.{browserNote ? ` ${browserNote}` : ""}</Feedback>;
    if (!inQuiz && tests && tests.passed === tests.total && tests.total > 0 && !tests.fatal) {
      return (
        <Feedback tone="right" title="Every test passes">
          Your fix is written differently from the ones we know, but it passed every test in your browser. Compare it with the model fix below.
        </Feedback>
      );
    }
    return (
      <Feedback tone="wrong" title={inQuiz ? "Not marked as fixed" : "Not fixed yet"}>
        {inQuiz
          ? "Quizzes mark a fix by comparing it with the known correct fixes (spaces and comments don't matter)."
          : "It doesn't match a known fix, and not every test passes."}
        {browserNote ? ` ${browserNote}` : ""}
      </Feedback>
    );
  }
  return review.correct ? <Feedback tone="right" title="Correct" /> : <Feedback tone="wrong" title="Not quite" />;
}

function solutionTitle(review: Review): string {
  if (review.ask === "blanks" || review.ask === "order") return "The complete program";
  return review.type === "write_code" ? "Model solution" : "Model fix";
}

export function ReviewDetails({ review }: { review: Review }) {
  return (
    <div className="q-review">
      {review.type === "trace" && review.expectedOutput !== null ? (
        <section aria-label={review.ask ? "The correct answer" : "The correct output"}>
          <h3 className="font-semibold">{review.ask ? "The answer" : "The program prints"}</h3>
          <div className="lec-stage lec-cinema" style={{ marginBlock: "0.5rem" }}>
            <div className="lec-box">
              <div className="lec-output">{review.expectedOutput.replace(/\n$/, "") || "(nothing)"}</div>
            </div>
          </div>
        </section>
      ) : null}
      {review.steps.length > 0 ? (
        <section aria-label="Trace table">
          <h3 className="font-semibold">Step by step</h3>
          <div className="table-wrap mt-2">
            <table className="q-steps">
              <thead>
                <tr>
                  <th scope="col">Step</th>
                  <th scope="col">Line</th>
                  <th scope="col">What happens</th>
                  <th scope="col">Variables</th>
                  <th scope="col">Prints</th>
                </tr>
              </thead>
              <tbody>
                {review.steps.map((s) => (
                  <tr key={s.stepNo}>
                    <td>{s.stepNo}</td>
                    <td>{s.line ?? "—"}</td>
                    <td dangerouslySetInnerHTML={{ __html: s.html }} />
                    <td className="q-steps__mono">
                      {Object.entries(s.variables)
                        .map(([k, v]) => `${k} = ${v}`)
                        .join("\n") || "—"}
                    </td>
                    <td className="q-steps__out">{s.output.replace(/\n/g, "↵\n").replace(/\n$/, "")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
      {review.explanationHtml ? (
        <section aria-label="Explanation">
          <h3 className="font-semibold">Explanation</h3>
          <div className="lesson-prose mt-2" dangerouslySetInnerHTML={{ __html: review.explanationHtml }} />
        </section>
      ) : null}
      {review.solution ? (
        <section aria-label={solutionTitle(review)}>
          <h3 className="font-semibold">{solutionTitle(review)}</h3>
          <CodeBox
            lines={highlight(review.solution.replace(/\n+$/, ""), review.solutionLanguage ?? "text").split("\n")}
            language={review.solutionLanguage}
            label="model answer"
          />
        </section>
      ) : null}
    </div>
  );
}

function Hints({ hints }: { hints: string[] }) {
  const [shown, setShown] = useState(0);
  if (hints.length === 0) return null;
  return (
    <div className="q-hints">
      {hints.slice(0, shown).map((hint, i) => (
        <p key={i} className="q-hint">
          <b>Hint {i + 1}</b>
          <span dangerouslySetInnerHTML={{ __html: hint }} />
        </p>
      ))}
      {shown < hints.length ? (
        <button type="button" className="justify-self-start text-sm font-semibold text-primary-text underline-offset-4 hover:underline min-h-11" onClick={() => setShown(shown + 1)}>
          {shown === 0 ? "Show a hint" : "Show another hint"} ({shown + 1} of {hints.length})
        </button>
      ) : null}
    </div>
  );
}

export function QuestionView({
  q,
  answer,
  onAnswer,
  tests,
  onTests,
  review,
  locked,
  showHints = true,
  heading = "h2",
}: {
  q: PublicExercise;
  answer: Answer;
  onAnswer: (a: Answer) => void;
  tests: TestSummary | null;
  onTests: (t: TestSummary | null) => void;
  review: Review | null;
  locked: boolean;
  showHints?: boolean;
  heading?: "h1" | "h2";
}) {
  const label = typeLabel(q);
  const H = heading;
  const codeLabel = q.type === "trace" ? "the code to trace" : "the code";
  return (
    <div>
      <p className="q-meta">
        <span className="q-type">
          <span aria-hidden="true" className={`lec-shape lec-shape--${label.shape}`} />
          {label.text}
        </span>
        <span>
          {q.points} {q.points === 1 ? "point" : "points"}
        </span>
        {q.topic ? <span>{q.topic.title}</span> : null}
      </p>
      <H className="mt-2 text-xl font-bold sm:text-2xl">{q.title}</H>
      <div className="lesson-prose mt-3" dangerouslySetInnerHTML={{ __html: q.promptHtml }} />
      {q.expectedBehaviorHtml ? (
        <div className="mt-4 rounded-xl border border-line bg-surface-2 p-4">
          <p className="text-sm font-semibold">What the finished program does</p>
          <div className="lesson-prose mt-1" dangerouslySetInnerHTML={{ __html: q.expectedBehaviorHtml }} />
        </div>
      ) : null}

      {(q.type === "mcq" || q.type === "trace") && q.codeLines.length > 0 ? (
        <CodeBox lines={q.codeLines} language={q.codeLanguage} label={codeLabel} />
      ) : null}

      {answer.kind === "mcq" ? <McqAnswer q={q} answer={answer} onChange={onAnswer} review={review} locked={locked} /> : null}
      {answer.kind === "trace" && (q.ask === "count" || q.ask === "value") ? <ShortAnswer q={q} answer={answer} onChange={onAnswer} locked={locked} /> : null}
      {answer.kind === "trace" && !q.ask ? <TraceAnswer q={q} answer={answer} onChange={onAnswer} locked={locked} /> : null}
      {answer.kind === "code" && q.ask === "blanks" ? <BlanksAnswer q={q} answer={answer} onChange={onAnswer} locked={locked} /> : null}
      {answer.kind === "code" && q.ask === "order" ? <OrderAnswer q={q} answer={answer} onChange={onAnswer} locked={locked} /> : null}
      {answer.kind === "code" && !q.ask ? (
        <CodeAnswer
          title={q.title}
          language={q.codeLanguage ?? "text"}
          starter={q.code ?? ""}
          tests={q.tests}
          compare={q.compare as CompareMode}
          code={answer.code}
          onCodeChange={(code) => onAnswer({ kind: "code", code })}
          summary={tests}
          onSummary={(s) => {
            onTests(s);
            onAnswer({ kind: "code", code: answer.code, ...(s && s.code === answer.code ? { tests: { passed: s.passed, total: s.total } } : {}) });
          }}
          locked={locked}
        />
      ) : null}

      {showHints && !review ? <Hints hints={q.hintsHtml} /> : null}
    </div>
  );
}
