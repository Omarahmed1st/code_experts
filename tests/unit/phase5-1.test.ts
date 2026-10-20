// Phase 5.1 audit: unit tests for the fixes that don't need the Workers runtime.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";
import { betterOutcome } from "@/components/practice/local-progress";
import { practiceRecord } from "@/lib/grading/practice-record";

describe("B01: practiceRecord keeps browser self-checks apart from server marks", () => {
  const passed = { code: "x", tests: { passed: 3, total: 3 } };
  const failed = { code: "x", tests: { passed: 2, total: 3 } };
  const notRun = { code: "x" };

  it("MCQ and trace keep the server's mark and have no self-check", () => {
    expect(practiceRecord({ type: "mcq", correct: true }, { selected: [] })).toEqual({ correct: true, selfCheck: null });
    expect(practiceRecord({ type: "trace", correct: false }, { answer: "" })).toEqual({ correct: false, selfCheck: null });
    // A tests field sent with a trace answer is ignored.
    expect(practiceRecord({ type: "trace", correct: false }, { answer: "", tests: { passed: 1, total: 1 } })).toEqual({ correct: false, selfCheck: null });
  });

  it("write the code is never marked, whatever the browser reports", () => {
    expect(practiceRecord({ type: "write_code", correct: null }, passed)).toEqual({ correct: null, selfCheck: "passed" });
    expect(practiceRecord({ type: "write_code", correct: null }, failed)).toEqual({ correct: null, selfCheck: "failed" });
    expect(practiceRecord({ type: "write_code", correct: null }, notRun)).toEqual({ correct: null, selfCheck: null });
  });

  it("correct the code: a known fix is right; a different fix that passed in the browser is unmarked; anything else is wrong", () => {
    expect(practiceRecord({ type: "correct_code", correct: true }, failed)).toEqual({ correct: true, selfCheck: "failed" });
    expect(practiceRecord({ type: "correct_code", correct: false }, passed)).toEqual({ correct: null, selfCheck: "passed" });
    expect(practiceRecord({ type: "correct_code", correct: false }, failed)).toEqual({ correct: false, selfCheck: "failed" });
    expect(practiceRecord({ type: "correct_code", correct: false }, notRun)).toEqual({ correct: false, selfCheck: null });
  });

  it("ignores nonsense test counts", () => {
    for (const tests of [{ passed: 1, total: 0 }, { passed: "3", total: 3 }, { passed: 1.5, total: 3 }, null, "all"]) {
      expect(practiceRecord({ type: "write_code", correct: null }, { code: "x", tests })).toEqual({ correct: null, selfCheck: null });
    }
    expect(practiceRecord({ type: "write_code", correct: null }, null)).toEqual({ correct: null, selfCheck: null });
  });
});

describe("B01: the practice marks in the page never get worse", () => {
  it("correct > passed in the browser > wrong", () => {
    expect(betterOutcome(undefined, "wrong")).toBe("wrong");
    expect(betterOutcome("wrong", "passed_tests")).toBe("passed_tests");
    expect(betterOutcome("passed_tests", "wrong")).toBe("passed_tests");
    expect(betterOutcome("passed_tests", "correct")).toBe("correct");
    expect(betterOutcome("correct", "passed_tests")).toBe("correct");
    expect(betterOutcome("correct", "wrong")).toBe("correct");
  });
});

describe("B02: security headers on every response", () => {
  it("forbids framing and sets the other safe defaults for every path", async () => {
    const rules = await nextConfig.headers!();
    const all = rules.find((r) => r.source === "/:path*");
    expect(all).toBeDefined();
    // The home page has its own rule (the catch-all doesn't match "/" in vinext); same headers.
    expect(rules.find((r) => r.source === "/")?.headers).toEqual(all!.headers);
    const headers = Object.fromEntries(all!.headers.map((h) => [h.key.toLowerCase(), h.value]));
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["content-security-policy"]).toBe("frame-ancestors 'none'");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    expect(headers["strict-transport-security"]).toMatch(/^max-age=\d+$/);
    // No script, style or connect rules yet: those need a full review with the runtimes (Phase 7).
    expect(headers["content-security-policy"]).not.toMatch(/script-src|default-src/);
  });
});

describe("B03: the sign-up page says truthfully what is kept", () => {
  const form = readFileSync(new URL("../../src/app/(auth)/register/sign-up-form.tsx", import.meta.url), "utf8");

  it("no longer claims 'nothing else', and names devices, IP addresses, drafts and the cookie", () => {
    expect(form).not.toMatch(/nothing else/);
    for (const words of [/IP\) address/, /browser/, /code drafts/, /cookie keeps you/, /failed sign-ins/]) expect(form).toMatch(words);
  });
});
