import { describe, expect, it } from "vitest";
import { formatBytes, formatDate, isoDate, plural } from "@/lib/format";
import { MATCH_END, MATCH_START, normalizeQuery, snippetParts, toFtsQuery } from "@/lib/search-query";

describe("search queries", () => {
  it("quotes every word and makes the last one a prefix", () => {
    expect(toFtsQuery("for loo")).toBe('"for" "loo"*');
  });
  it("strips FTS syntax so visitors can't write a query that errors", () => {
    expect(toFtsQuery('slice" OR title:* NEAR(')).toBe('"slice" "or" "title" "near"*');
    expect(toFtsQuery("  ** ( ) ")).toBeNull();
    expect(toFtsQuery("")).toBeNull();
  });
  it("limits length and number of words", () => {
    expect(normalizeQuery("x".repeat(500))).toHaveLength(100);
    expect(toFtsQuery("a b c d e f g h i j")!.split(" ")).toHaveLength(8);
  });
  it("splits snippets into plain and highlighted parts", () => {
    expect(snippetParts(`…uses ${MATCH_START}slicing${MATCH_END} to <b>`)).toEqual([
      { text: "…uses ", match: false },
      { text: "slicing", match: true },
      { text: " to <b>", match: false },
    ]);
  });
});

describe("formatting", () => {
  it("formats dates in UTC", () => {
    const ms = Date.UTC(2026, 9, 8, 23, 30);
    expect(formatDate(ms)).toBe("8 Oct 2026");
    expect(isoDate(ms)).toBe("2026-10-08");
  });
  it("formats sizes and plurals", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(2048)).toBe("2 KB");
    expect(formatBytes(3.5 * 1024 * 1024)).toBe("3.5 MB");
    expect(plural(1, "lecture")).toBe("1 lecture");
    expect(plural(3, "lecture")).toBe("3 lectures");
  });
});
