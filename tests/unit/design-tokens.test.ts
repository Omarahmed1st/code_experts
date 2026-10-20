// Checks the colour tokens in src/styles/tokens.css against WCAG 2.2 AA.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../../src/styles/tokens.css", import.meta.url), "utf8");

function block(selector: string): Record<string, string> {
  const start = css.indexOf(`${selector} {`);
  if (start < 0) throw new Error(`missing block ${selector}`);
  const body = css.slice(start, css.indexOf("}", start));
  return Object.fromEntries([...body.matchAll(/--cl-([\w-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((m) => [m[1]!, m[2]!.toLowerCase()]));
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

const themes = {
  light: block(":root"),
  dark: block(':root[data-theme="dark"]'),
};

const TEXT = ["text", "text-muted", "primary-text", "accent"];
const SURFACES = ["bg", "surface", "surface-2"];
const BADGES: [string, string][] = [
  ["easy", "easy-soft"],
  ["medium", "medium-soft"],
  ["hard", "hard-soft"],
  ["primary-text", "primary-soft"],
];

describe("design tokens", () => {
  it("the OS-dark block is identical to the explicit dark theme", () => {
    expect(block(':root:not([data-theme="light"])')).toEqual(themes.dark);
  });

  it("light and dark define the same tokens", () => {
    expect(Object.keys(themes.dark).sort()).toEqual(Object.keys(themes.light).sort());
  });

  for (const [name, t] of Object.entries(themes)) {
    describe(`${name} theme`, () => {
      for (const fg of TEXT) {
        for (const bg of SURFACES) {
          it(`${fg} on ${bg} has at least 4.5:1 contrast`, () => {
            expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
          });
        }
      }
      for (const [fg, bg] of BADGES) {
        it(`${fg} on ${bg} (badges) has at least 4.5:1 contrast`, () => {
          expect(contrast(t[fg]!, t[bg]!)).toBeGreaterThanOrEqual(4.5);
        });
      }
      it("button text on primary has at least 4.5:1 contrast", () => {
        expect(contrast(t["on-primary"]!, t.primary!)).toBeGreaterThanOrEqual(4.5);
      });
      // Phase 5.1: white on the dark theme's coral was 2.3:1 ("Delete my account").
      it("button text on the danger colour has at least 4.5:1 contrast", () => {
        expect(contrast(t["on-hard"]!, t.hard!)).toBeGreaterThanOrEqual(4.5);
      });
      it("focus ring and difficulty colours stand out from every surface (3:1)", () => {
        for (const bg of SURFACES) {
          expect(contrast(t.focus!, t[bg]!)).toBeGreaterThanOrEqual(3);
          for (const level of ["easy", "medium", "hard"]) expect(contrast(t[level]!, t[bg]!)).toBeGreaterThanOrEqual(3);
        }
      });
      it("code blocks have at least 4.5:1 contrast", () => {
        expect(contrast(t["code-text"]!, t["code-bg"]!)).toBeGreaterThanOrEqual(4.5);
      });
    });
  }
});
