import { describe, expect, it } from "vitest";
import { escapeHtml, highlight } from "@/lib/markdown/highlight";
import { renderInlineMarkdown, renderMarkdown } from "@/lib/markdown/render";

describe("highlight", () => {
  it("colours Python tokens and keeps the text exact", () => {
    const html = highlight('def area(r):\n    return 3.14 * r  # pi\nprint("hi", True)', "python");
    expect(html).toContain('<span class="tok-kw">def</span> <span class="tok-fn">area</span>');
    expect(html).toContain('<span class="tok-num">3.14</span>');
    expect(html).toContain('<span class="tok-com"># pi</span>');
    expect(html).toContain('<span class="tok-str">&quot;hi&quot;</span>');
    expect(html).toContain('<span class="tok-lit">True</span>');
    expect(html.replace(/<[^>]+>/g, "")).toBe(escapeHtml('def area(r):\n    return 3.14 * r  # pi\nprint("hi", True)'));
  });

  it("colours C++ preprocessor lines, types and std names", () => {
    const html = highlight("#include <iostream>\nint main() { std::cout << 1; }", "cpp");
    expect(html).toContain('<span class="tok-pre">#include &lt;iostream&gt;</span>');
    expect(html).toContain('<span class="tok-type">int</span>');
    expect(html).toContain('<span class="tok-builtin">cout</span>');
  });

  it("keeps one line of HTML per line of code, even inside multi-line strings and comments", () => {
    for (const [code, lang] of [
      ['s = """a\nb\nc"""\nx = 1', "python"],
      ["/* one\ntwo */\nint x;", "cpp"],
    ] as const) {
      const lines = highlight(code, lang).split("\n");
      expect(lines).toHaveLength(code.split("\n").length);
      for (const line of lines) expect((line.match(/<span/g) ?? []).length).toBe((line.match(/<\/span>/g) ?? []).length);
    }
  });

  it("escapes everything, including unknown languages", () => {
    expect(highlight("<script>alert(1)</script>", "python")).not.toContain("<script>");
    expect(highlight("<b>&</b>", "klingon")).toBe("&lt;b&gt;&amp;&lt;/b&gt;");
  });
});

describe("renderMarkdown", () => {
  it("never passes raw HTML through", () => {
    const html = renderMarkdown('Hi <script>alert(1)</script> <img src=x onerror="alert(1)">');
    expect(html).not.toMatch(/<script|<img/);
    expect(html).toContain("&lt;script&gt;");
  });

  it("drops javascript: links and marks external links", () => {
    expect(renderMarkdown("[x](javascript:alert(1))")).not.toMatch(/href="javascript/i);
    expect(renderMarkdown("[docs](https://docs.python.org/3/)")).toMatch(/rel="noopener[^"]*"/);
  });

  it("starts headings at h3 under the section's h2", () => {
    const html = renderMarkdown("# Big\n\n## Smaller");
    expect(html).toContain("<h3");
    expect(html).not.toMatch(/<h[12][ >]/);
  });

  it("renders code, input and output blocks", () => {
    const html = renderMarkdown('```python\nprint("<hi>")\n```\n\n```output\n<hi>\n```');
    expect(html).toContain('class="code-block"');
    expect(html).toContain("button");
    expect(html).toContain("io-box--output");
    expect(html).not.toContain("<hi>");
  });

  it("turns ::: check into a question with a hidden answer, and tip/warning into callouts", () => {
    const html = renderMarkdown("::: check What prints?\nSome code\n???\nThe answer\n:::\n\n::: tip\nA tip\n:::");
    expect(html).toMatch(/<details class="check-answer"/);
    expect(html).toContain("What prints?");
    expect(html).toContain("The answer");
    expect(html).toContain("callout--tip");
  });

  it("renders a table inside a scrolling wrapper", () => {
    expect(renderMarkdown("| a | b |\n|---|---|\n| 1 | 2 |")).toContain('class="table-wrap"');
  });

  it("inline markdown has no block wrapper", () => {
    expect(renderInlineMarkdown("Use `print()` **twice**")).toBe("Use <code>print()</code> <strong>twice</strong>");
  });
});
