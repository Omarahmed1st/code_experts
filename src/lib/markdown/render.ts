// Lesson Markdown -> HTML, on the server.
//
// Safety: raw HTML in Markdown is escaped (html: false), markdown-it refuses
// javascript:/vbscript:/data: links, and every code block goes through
// escapeHtml in highlight(). The result is safe to pass to
// dangerouslySetInnerHTML even if an editor pastes something hostile.
//
// Extensions on top of CommonMark + tables:
//   ```python / ```cpp / ```pseudocode   highlighted code with a Copy button
//   ```input / ```output                 the INPUT and OUTPUT boxes
//   ::: check Predict the output         a "check yourself" question;
//   question…                            the part after ??? is hidden
//   ???                                  behind "Show answer"
//   answer…
//   :::
//   ::: tip Title / ::: warning Title    callouts
import markdownit from "markdown-it";
import { LANGUAGE_LABEL, escapeHtml, highlight } from "./highlight";

const md = markdownit({ html: false, linkify: false, typographer: false });

// Section titles are <h2> on the lesson page, so headings inside a section start at <h3>.
md.core.ruler.push("demote_headings", (state) => {
  for (const token of state.tokens) {
    if (token.type === "heading_open" || token.type === "heading_close") {
      const level = Math.min(6, Math.max(3, Number(token.tag.slice(1)) + 2));
      token.tag = `h${level}`;
    }
  }
});

// Images come from a section's image fields (stored in R2 with their size), not from Markdown.
md.renderer.rules.image = (tokens, idx) => escapeHtml(tokens[idx]?.content ?? "");

md.renderer.rules.table_open = () => '<div class="table-wrap" tabindex="0"><table>\n';
md.renderer.rules.table_close = () => "</table></div>\n";

const defaultLinkOpen = md.renderer.rules.link_open ?? ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = String(token?.attrGet("href") ?? "");
  if (token && /^https?:\/\//i.test(href)) token.attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

md.renderer.rules.fence = (tokens, idx) => {
  const token = tokens[idx];
  if (!token) return "";
  const language = token.info.trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  if (language === "input" || language === "output") return ioBoxHtml(language, token.content);
  return codeBlockHtml(token.content, language);
};
md.renderer.rules.code_block = (tokens, idx) => codeBlockHtml(tokens[idx]?.content ?? "", "text");

/** A highlighted code block. The Copy button stays hidden until the page's script enables it. */
export function codeBlockHtml(code: string, language: string): string {
  const body = code.endsWith("\n") ? code.slice(0, -1) : code;
  const label = LANGUAGE_LABEL[language] ?? (language ? language : "Code");
  return (
    `<div class="code-block" data-lang="${escapeHtml(language || "text")}">` +
    `<div class="code-block__bar"><span class="code-block__lang">${escapeHtml(label)}</span>` +
    `<button type="button" class="code-copy" data-copy hidden>Copy</button></div>` +
    `<pre tabindex="0"><code>${highlight(body, language)}</code></pre></div>\n`
  );
}

/** The INPUT / OUTPUT boxes used under example programs. */
export function ioBoxHtml(kind: "input" | "output", text: string): string {
  const body = text.endsWith("\n") ? text.slice(0, -1) : text;
  return (
    `<figure class="io-box io-box--${kind}"><figcaption>${kind === "input" ? "Input" : "Output"}</figcaption>` +
    `<pre tabindex="0"><code>${escapeHtml(body)}</code></pre></figure>\n`
  );
}

const CONTAINER_KINDS = new Set(["check", "tip", "warning"]);
const CONTAINER_LABEL: Record<string, string> = { check: "Check yourself", tip: "Tip", warning: "Watch out" };

interface Block {
  kind: "markdown" | "container";
  container?: string;
  title?: string;
  lines: string[];
}

/** Splits out ::: containers, ignoring ::: lines inside code fences. */
function splitContainers(source: string): Block[] {
  const blocks: Block[] = [{ kind: "markdown", lines: [] }];
  let fence: string | null = null;
  for (const line of source.replace(/\r\n?/g, "\n").split("\n")) {
    const current = blocks[blocks.length - 1] as Block;
    const fenceMatch = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fenceMatch?.[1]) {
      const marker = fenceMatch[1];
      if (fence === null) fence = marker;
      else if (marker[0] === fence[0] && marker.length >= fence.length) fence = null;
      current.lines.push(line);
      continue;
    }
    if (fence === null) {
      const open = /^:::\s*([a-z]+)\s*(.*)$/.exec(line);
      if (open?.[1] && CONTAINER_KINDS.has(open[1]) && current.kind === "markdown") {
        blocks.push({ kind: "container", container: open[1], title: open[2]?.trim() ?? "", lines: [] });
        continue;
      }
      if (/^:::\s*$/.test(line) && current.kind === "container") {
        blocks.push({ kind: "markdown", lines: [] });
        continue;
      }
    }
    current.lines.push(line);
  }
  return blocks;
}

function renderContainer(block: Block): string {
  const kind = block.container ?? "tip";
  const label = CONTAINER_LABEL[kind] ?? "Note";
  const title = block.title ? md.renderInline(block.title) : "";
  const heading =
    `<p class="callout__label">${escapeHtml(label)}</p>` + (title ? `<p class="callout__title">${title}</p>` : "");
  if (kind !== "check") {
    return `<aside class="callout callout--${kind}">${heading}${md.render(block.lines.join("\n"))}</aside>\n`;
  }
  const split = block.lines.findIndex((line) => line.trim() === "???");
  const question = split === -1 ? block.lines : block.lines.slice(0, split);
  const answer = split === -1 ? [] : block.lines.slice(split + 1);
  return (
    `<aside class="callout callout--check">${heading}${md.render(question.join("\n"))}` +
    (answer.length > 0
      ? `<details class="check-answer"><summary>Show answer</summary>${md.render(answer.join("\n"))}</details>`
      : "") +
    `</aside>\n`
  );
}

export function renderMarkdown(source: string): string {
  return splitContainers(source)
    .map((block) => (block.kind === "container" ? renderContainer(block) : md.render(block.lines.join("\n"))))
    .join("");
}

/** Inline Markdown (titles, list items) without a wrapping <p>. */
export function renderInlineMarkdown(source: string): string {
  return md.renderInline(source);
}
