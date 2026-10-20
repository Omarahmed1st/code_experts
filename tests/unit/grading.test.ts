// Phase 3: answer checking, scoring, attempt tokens, exam draws and the
// exercise / quiz / exam file formats. Pure functions, no database.
import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blanksOf, countBlanks, fillBlanks, joinOrder, orderParts, sameLines, scramble, splitBlanks, splitHtmlAtBlanks } from "@/lib/exercise/ask";
import { parseExamSource, parseExerciseSource, parseQuizSource } from "@/lib/exercise/source";
import { type AttemptClaims, DEADLINE_GRACE_MS, isPastDeadline, newNonce, signAttempt, verifyAttempt } from "@/lib/grading/attempt-token";
import { codeTokens, matchesAnySolution } from "@/lib/grading/code-match";
import { drawAcrossTopics, drawExam, drawExamWithRetries, pickModel } from "@/lib/grading/exam-draw";
import { lastModel, modelCookie, recentTries, triesCookie, tryStatus } from "@/lib/grading/attempt-limit";
import { firstDifference, normalizeOutput, outputsMatch } from "@/lib/grading/output";
import { gradeMcq, gradeTrace, scoreAttempt, shuffled } from "@/lib/grading/scoring";

/** A small seeded random source (mulberry32), so draws and shuffles are repeatable. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

describe("output comparison", () => {
  it("trim_trailing ignores line endings and trailing spaces, not inner spaces", () => {
    const o = { mode: "trim_trailing", caseSensitive: true } as const;
    expect(outputsMatch("1\n2\n", "1  \r\n2", o)).toBe(true);
    expect(outputsMatch("Sum = 15\n", "Sum =  15\n", o)).toBe(false);
    expect(outputsMatch("a\n", "a\n\n\n", o)).toBe(true);
  });

  it("exact only forgives line endings and trailing newlines", () => {
    const o = { mode: "exact", caseSensitive: true } as const;
    expect(outputsMatch("1 \n", "1 \r\n\n", o)).toBe(true);
    expect(outputsMatch("1 \n", "1\n", o)).toBe(false);
  });

  it("normalize_whitespace treats any run of spaces as one", () => {
    const o = { mode: "normalize_whitespace", caseSensitive: true } as const;
    expect(outputsMatch("1 2 3", "1   2\t3", o)).toBe(true);
    expect(outputsMatch("12 3", "1 23", o)).toBe(false);
  });

  it("can ignore case", () => {
    expect(outputsMatch("Hello", "hello", { mode: "trim_trailing", caseSensitive: false })).toBe(true);
    expect(outputsMatch("Hello", "hello", { mode: "trim_trailing", caseSensitive: true })).toBe(false);
    expect(normalizeOutput("A\r\nB  ", { mode: "trim_trailing", caseSensitive: false })).toBe("a\nb");
  });

  it("points at the first line that differs", () => {
    expect(firstDifference("1\n2\n3\n", "1\n2\n4\n")).toEqual(expect.objectContaining({ line: 3, expected: "3", actual: "4" }));
    expect(firstDifference("1\n2\n", "1\n")).toEqual(expect.objectContaining({ line: 2, expected: "2" }));
    expect(firstDifference("1\n", "1\n")).toBeNull();
  });
});

describe("correct-the-code matching", () => {
  const fixed = "int sum = 0;\nwhile (i <= n)\n{\n    sum += i; // add\n    i++;\n}\n";
  it("ignores layout and comments in C++", () => {
    expect(matchesAnySolution("int sum=0; while(i<=n){sum+=i;i++;}", [fixed], "cpp")).toBe(true);
    expect(matchesAnySolution("int sum = 0; /* start */ while (i <= n) { sum += i; i++; }", [fixed], "cpp")).toBe(true);
  });
  it("still sees a real difference", () => {
    expect(matchesAnySolution("int sum; while (i <= n) { sum += i; i++; }", [fixed], "cpp")).toBe(false);
    expect(matchesAnySolution("int sum = 0; while (i < n) { sum += i; i++; }", [fixed], "cpp")).toBe(false);
  });
  it("accepts any listed fix", () => {
    const other = "int sum = 0;\nwhile (i < n + 1) { sum += i; i++; }";
    expect(matchesAnySolution("int sum=0;while(i<n+1){sum+=i;i++;}", [fixed, other], "cpp")).toBe(true);
  });
  it("keeps Python indentation meaningful but ignores its width, comments and quote style", () => {
    const solution = "for m in marks:\n    total += m\nprint('done')\n";
    expect(matchesAnySolution('for m in marks:  # each\n  total += m\nprint("done")', [solution], "python")).toBe(true);
    // The print moved inside the loop: a different program.
    expect(matchesAnySolution("for m in marks:\n    total += m\n    print('done')", [solution], "python")).toBe(false);
  });
  it("treats a bracket that spans lines as one line in Python", () => {
    expect(codeTokens("x = [1,\n     2]\n", "python")).toEqual(codeTokens("x = [1, 2]\n", "python"));
  });
  it("never matches empty code", () => {
    expect(matchesAnySolution("", [""], "cpp")).toBe(false);
    expect(matchesAnySolution("   \n", ["x = 1"], "python")).toBe(false);
  });
});

describe("marking and scoring", () => {
  it("MCQ is right only with exactly the correct options", () => {
    expect(gradeMcq(["b"], ["b"]).correct).toBe(true);
    expect(gradeMcq(["b"], ["a"])).toEqual({ correct: false, missed: ["b"], wrong: ["a"] });
    expect(gradeMcq(["a", "c"], ["a"]).correct).toBe(false);
    expect(gradeMcq(["a", "c"], ["c", "a"]).correct).toBe(true);
    expect(gradeMcq(["a", "c"], ["a", "b", "c"]).correct).toBe(false);
    expect(gradeMcq([], []).correct).toBe(false);
  });

  it("trace answers follow the exercise's comparison rules", () => {
    const o = { mode: "trim_trailing", caseSensitive: true } as const;
    expect(gradeTrace(["10\n8\n6\n"], "10\n8\n6", o)).toBe(true);
    expect(gradeTrace(["10\n8\n6\n"], "10 8 6", o)).toBe(false);
    expect(gradeTrace(["10 8 6\n"], "10 8 6", o)).toBe(true);
    expect(gradeTrace(["x\n"], "", o)).toBe(false);
  });

  it("adds up points, rounds the percentage down and passes on the exact threshold", () => {
    const q = (correct: boolean, points = 1, topic: string | null = "loops") => ({ exerciseId: String(Math.random()), points, correct, topic });
    const three = scoreAttempt([q(true), q(true), q(true), q(false), q(false)], 60);
    expect(three).toEqual(expect.objectContaining({ score: 3, maxScore: 5, percent: 60, passed: true, correctCount: 3 }));
    const twoThirds = scoreAttempt([q(true), q(true), q(false)], 67);
    expect(twoThirds.percent).toBe(66);
    expect(twoThirds.passed).toBe(false);
    const weighted = scoreAttempt([q(true, 2, "a"), q(false, 1, "b"), q(false, 1, "b")], 50);
    expect(weighted).toEqual(expect.objectContaining({ score: 2, maxScore: 4, passed: true }));
    expect(weighted.byTopic).toEqual([
      { topic: "a", score: 2, maxScore: 2, correct: 1, total: 1 },
      { topic: "b", score: 0, maxScore: 2, correct: 0, total: 2 },
    ]);
    expect(scoreAttempt([], 60)).toEqual(expect.objectContaining({ percent: 0, passed: false }));
  });

  it("shuffles without losing or repeating anything", () => {
    const items = Array.from({ length: 20 }, (_, i) => i);
    const out = shuffled(items, seeded(7));
    expect(out).not.toEqual(items);
    expect([...out].sort((a, b) => a - b)).toEqual(items);
    expect(items[0]).toBe(0); // the input isn't changed
  });
});

describe("attempt tokens", () => {
  const SECRET = "test-secret-that-is-long-enough-0123456789";
  const claims: AttemptClaims = {
    v: 1,
    kind: "quiz",
    courseId: "c_cpp",
    refId: "quiz_1",
    questions: ["e1", "e2"],
    points: [1, 2],
    startedAt: 1_000_000,
    deadlineAt: 1_000_000 + 15 * 60_000,
    nonce: newNonce(),
  };

  it("round-trips signed claims", async () => {
    const token = await signAttempt(claims, SECRET);
    expect(await verifyAttempt(token, SECRET)).toEqual(claims);
  });

  it("rejects a changed body, a wrong secret and junk", async () => {
    const token = await signAttempt(claims, SECRET);
    const [body, sig] = token.split(".") as [string, string];
    const forged = Buffer.from(JSON.stringify({ ...claims, deadlineAt: null })).toString("base64url");
    expect(await verifyAttempt(`${forged}.${sig}`, SECRET)).toBeNull();
    expect(await verifyAttempt(token, `${SECRET}x`)).toBeNull();
    expect(await verifyAttempt(`${body}.${sig}.x`, SECRET)).toBeNull();
    expect(await verifyAttempt("not a token", SECRET)).toBeNull();
    expect(await verifyAttempt("", SECRET)).toBeNull();
    expect(await verifyAttempt("a".repeat(9000), SECRET)).toBeNull();
  });

  it("rejects well-signed claims of the wrong shape", async () => {
    const bad = await signAttempt({ ...claims, points: [1] } as AttemptClaims, SECRET);
    expect(await verifyAttempt(bad, SECRET)).toBeNull();
  });

  it("allows a short grace period after the deadline", () => {
    const deadline = claims.deadlineAt as number;
    expect(isPastDeadline(claims, deadline)).toBe(false);
    expect(isPastDeadline(claims, deadline + DEADLINE_GRACE_MS)).toBe(false);
    expect(isPastDeadline(claims, deadline + DEADLINE_GRACE_MS + 1)).toBe(true);
    expect(isPastDeadline({ ...claims, deadlineAt: null }, Number.MAX_SAFE_INTEGER)).toBe(false);
  });

  it("makes a different nonce each time", () => {
    expect(newNonce()).not.toBe(newNonce());
  });
});

describe("practice exam draws", () => {
  const bank = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `m${i}`, type: "mcq", difficulty: i < 3 ? "easy" : "medium", topicId: i % 2 ? "t1" : "t2" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, type: "trace", difficulty: "medium", topicId: "t1" })),
    { id: "c0", type: "correct_code", difficulty: "hard", topicId: "t2" },
  ];

  it("follows every rule, never repeats a question, and keeps rule order", () => {
    const rules = [
      { count: 3, type: "mcq", difficulty: null, topicId: null, points: 1 },
      { count: 2, type: "trace", difficulty: null, topicId: null, points: 1 },
      { count: 1, type: "correct_code", difficulty: null, topicId: null, points: 2 },
    ];
    for (let seed = 1; seed <= 50; seed++) {
      const drawn = drawExam(rules, bank, seeded(seed));
      expect(drawn).not.toBeNull();
      const ids = drawn!.ids;
      expect(new Set(ids).size).toBe(6);
      expect(ids.slice(0, 3).every((id) => id.startsWith("m"))).toBe(true);
      expect(ids.slice(3, 5).every((id) => id.startsWith("t"))).toBe(true);
      expect(ids[5]).toBe("c0");
      expect(drawn!.points).toEqual([1, 1, 1, 1, 1, 2]);
    }
  });

  it("serves a narrow rule before a broad one", () => {
    // "any 5 mcq" first would often use up the 3 easy ones; the easy rule must still get 3.
    const rules = [
      { count: 3, type: "mcq", difficulty: null, topicId: null, points: 1 },
      { count: 3, type: "mcq", difficulty: "easy", topicId: null, points: 1 },
    ];
    for (let seed = 1; seed <= 50; seed++) expect(drawExam(rules, bank, seeded(seed))).not.toBeNull();
  });

  it("gives up when the bank is too small", () => {
    const rules = [{ count: 2, type: "correct_code", difficulty: null, topicId: null, points: 1 }];
    expect(drawExamWithRetries(rules, bank, seeded(1))).toBeNull();
  });

  it("draws different questions on different attempts", () => {
    const rules = [{ count: 3, type: "mcq", difficulty: null, topicId: null, points: 1 }];
    const sets = new Set(Array.from({ length: 20 }, (_, i) => drawExam(rules, bank, seeded(i + 1))!.ids.join()));
    expect(sets.size).toBeGreaterThan(1);
  });
});

const MCQ = `---
slug: semicolon
type: mcq
title: A semicolon
lesson: while-loops
difficulty: easy
updated: 2026-10-09
---

## Question

What happens?

## Code

\`\`\`cpp
while (x <= 3);
\`\`\`

## Options

- [ ] It prints 1, 2, 3.
  No.
- [x] It never finishes.
  Right.

## Explanation

The semicolon is the loop's body.
`;

describe("exercise files", () => {
  it("reads a multiple choice question", () => {
    const ex = parseExerciseSource(MCQ, "semicolon.md");
    expect(ex).toEqual(
      expect.objectContaining({ slug: "semicolon", type: "mcq", difficulty: "easy", points: 1, status: "published", demo: false, lesson: "while-loops" }),
    );
    expect(ex.options.map((o) => o.correct)).toEqual([false, true]);
    expect(ex.options[1]?.feedbackMd).toBe("Right.");
    expect(ex.codeLanguage).toBe("cpp");
  });

  it("refuses a question without an explanation or a correct option", () => {
    expect(() => parseExerciseSource(MCQ.replace(/## Explanation[\s\S]*$/, ""), "a.md")).toThrow(/Explanation/);
    expect(() => parseExerciseSource(MCQ.replace("- [x]", "- [ ]"), "a.md")).toThrow();
  });

  it("refuses two correct options unless the question says multiple", () => {
    const two = MCQ.replace("- [ ] It prints", "- [x] It prints");
    expect(() => parseExerciseSource(two, "a.md")).toThrow(/multiple/);
    expect(parseExerciseSource(two.replace("difficulty: easy", "difficulty: easy\nmultiple: true"), "a.md").settings.multiple).toBe(true);
  });

  it("parses every exercise in content/ (the same check as the build)", () => {
    let count = 0;
    for (const course of readdirSync("content")) {
      let files: string[];
      try {
        files = readdirSync(`content/${course}/exercises`).filter((f) => f.endsWith(".md"));
      } catch {
        continue;
      }
      for (const f of files) {
        const ex = parseExerciseSource(readFileSync(`content/${course}/exercises/${f}`, "utf8"), f);
        expect(ex.explanationMd.length).toBeGreaterThan(0);
        if (ex.type === "correct_code" || ex.type === "write_code") {
          expect(ex.solution).not.toBeNull();
          expect(ex.tests.filter((t) => !t.hidden).length).toBeGreaterThan(0);
        }
        count++;
      }
    }
    expect(count).toBeGreaterThanOrEqual(36);
  });
});

describe("quiz and exam files", () => {
  const QUIZ = `---
slug: loops-check
title: Loops check
mode: exam
time: 15
pass: 70
questions:
  - semicolon
  - trace-countdown | 2
---

Fifteen minutes.
`;
  it("reads a quiz with points and a time limit", () => {
    const quiz = parseQuizSource(QUIZ, "q.md");
    expect(quiz).toEqual(expect.objectContaining({ mode: "exam", timeLimitSec: 900, passThreshold: 70 }));
    expect(quiz.questions).toEqual([
      { slug: "semicolon", points: 1 },
      { slug: "trace-countdown", points: 2 },
    ]);
  });
  it("refuses a question listed twice", () => {
    expect(() => parseQuizSource(QUIZ.replace("trace-countdown | 2", "semicolon"), "q.md")).toThrow(/twice/);
  });

  const EXAM = `---
slug: final
title: Final
time: 30
scope: mixed_topics
draw:
  - count: 4, type: mcq
  - count: 1, type: correct_code, difficulty: hard, points: 3
---
`;
  it("reads exam draw rules", () => {
    const exam = parseExamSource(EXAM, "e.md");
    expect(exam.timeLimitSec).toBe(1800);
    expect(exam.rules).toEqual([
      { count: 4, type: "mcq", difficulty: null, topic: null, points: 1 },
      { count: 1, type: "correct_code", difficulty: "hard", topic: null, points: 3 },
    ]);
  });
  it("refuses write_code in an exam (it can't be scored on the server yet)", () => {
    expect(() => parseExamSource(EXAM.replace("type: mcq", "type: write_code"), "e.md")).toThrow(/write_code/);
  });
});

describe("custom exams", () => {
  const bank = [
    ...Array.from({ length: 10 }, (_, i) => ({ id: `a${i}`, topicId: "loops" })),
    ...Array.from({ length: 3 }, (_, i) => ({ id: `b${i}`, topicId: "ifs" })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `c${i}`, topicId: "types" })),
  ];

  it("spreads questions evenly over the chosen topics, with no repeats", () => {
    for (let seed = 1; seed <= 30; seed++) {
      const drawn = drawAcrossTopics(bank, 9, seeded(seed));
      expect(drawn).toHaveLength(9);
      expect(new Set(drawn.map((q) => q.id)).size).toBe(9);
      for (const t of ["loops", "ifs", "types"]) expect(drawn.filter((q) => q.topicId === t)).toHaveLength(3);
    }
  });

  it("fills up from bigger topics when a small one runs out, and gives everything when asked for more", () => {
    const twelve = drawAcrossTopics(bank, 12, seeded(3));
    expect(twelve.filter((q) => q.topicId === "ifs")).toHaveLength(3);
    expect(twelve).toHaveLength(12);
    expect(drawAcrossTopics(bank, 50, seeded(3))).toHaveLength(19);
    expect(drawAcrossTopics([], 5, seeded(3))).toEqual([]);
  });

  it("signs custom-exam settings into the token, and rejects a custom token without them", async () => {
    const SECRET = "test-secret-that-is-long-enough-0123456789";
    const base = { v: 1 as const, courseId: "c", refId: "custom", questions: ["e1"], points: [1], startedAt: 0, deadlineAt: null, nonce: "n" };
    const ok = await signAttempt({ ...base, kind: "custom", custom: { title: "Custom exam: Loops", feedback: "immediate", passThreshold: 60 } }, SECRET);
    expect((await verifyAttempt(ok, SECRET))?.custom?.feedback).toBe("immediate");
    const bare = await signAttempt({ ...base, kind: "custom" } as AttemptClaims, SECRET);
    expect(await verifyAttempt(bare, SECRET)).toBeNull();
    const quizWithCustom = await signAttempt({ ...base, kind: "quiz", custom: { title: "x", feedback: "immediate", passThreshold: 60 } }, SECRET);
    expect(await verifyAttempt(quizWithCustom, SECRET)).toBeNull();
  });
});

describe("attempt limit (2 tries, then 24 hours)", () => {
  const SECRET = "test-secret-that-is-long-enough-0123456789";
  const H = 60 * 60 * 1000;
  const cookieOf = (setCookie: string) => setCookie.split(";")[0]!;

  it("counts tries from the signed cookie and locks until 24 hours after the first", async () => {
    const now = 1_000 * H;
    expect(tryStatus([], 2)).toEqual({ maxAttempts: 2, used: 0, unlockAt: null });
    const one = cookieOf(await triesCookie([now - 3 * H], "quiz_final", "/api/x", true, SECRET));
    const tries1 = await recentTries(one, "quiz_final", now, SECRET);
    expect(tryStatus(tries1, 2)).toEqual({ maxAttempts: 2, used: 1, unlockAt: null });
    const two = cookieOf(await triesCookie([now - 3 * H, now - H], "quiz_final", "/api/x", true, SECRET));
    const tries2 = await recentTries(two, "quiz_final", now, SECRET);
    expect(tryStatus(tries2, 2).unlockAt).toBe(now - 3 * H + 24 * H);
    // A day after the first try, that try no longer counts.
    expect(await recentTries(two, "quiz_final", now + 21 * H + 1, SECRET)).toEqual([now - H]);
  });

  it("ignores a changed, foreign or unsigned cookie", async () => {
    const now = 1_000 * H;
    const good = cookieOf(await triesCookie([now - H, now - 2 * H], "quiz_final", "/api/x", false, SECRET));
    const [name, value] = good.split("=") as [string, string];
    const [, sig] = value.split(".");
    expect(await recentTries(`${name}=${now - H}.${sig}`, "quiz_final", now, SECRET)).toEqual([]);
    expect(await recentTries(good, "quiz_final", now, `${SECRET}x`)).toEqual([]);
    expect(await recentTries(`${name}=${now - H}`, "quiz_final", now, SECRET)).toEqual([]);
    expect(await recentTries(null, "quiz_final", now, SECRET)).toEqual([]);
  });

  it("makes an HttpOnly, SameSite=Strict cookie for the quiz's API path only", async () => {
    const c = await triesCookie([1], "quiz_final", "/api/courses/c/quizzes/final", true, SECRET);
    expect(c).toContain("Path=/api/courses/c/quizzes/final");
    expect(c).toContain("HttpOnly");
    expect(c).toContain("SameSite=Strict");
    expect(c).toContain("Secure");
    expect(c).toContain("Max-Age=86400");
  });
});

describe("quiz models", () => {
  const models = ["A", "B", "C", "D"].map((label) => ({ id: `quiz_${label}`, label }));

  it("picks every model over many starts, never the one to avoid", () => {
    let seed = 7;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    const seen = new Set<string>();
    for (let i = 0; i < 400; i++) {
      const picked = pickModel(models, "C", random)!;
      expect(picked.label).not.toBe("C");
      seen.add(picked.label);
    }
    expect([...seen].sort()).toEqual(["A", "B", "D"]);
    expect(pickModel(models, null, () => 0.999999)!.label).toBe("D");
    // One model: it is the only choice, even if it was the last one.
    expect(pickModel([models[0]!], "A", Math.random)!.label).toBe("A");
    expect(pickModel([], null, Math.random)).toBeUndefined();
  });

  it("remembers the last model in an HttpOnly cookie and ignores anything that isn't a letter", () => {
    const c = modelCookie("B", "quiz_final", "/api/courses/c/quizzes/final", true);
    expect(c).toMatch(/^ce_model_quiz_final=B; Path=\/api\/courses\/c\/quizzes\/final; /);
    expect(c).toContain("HttpOnly");
    expect(c).toContain("SameSite=Strict");
    expect(lastModel(`x=1; ${c.split(";")[0]}`, "quiz_final")).toBe("B");
    expect(lastModel("ce_model_quiz_final=bad", "quiz_final")).toBeNull();
    expect(lastModel(null, "quiz_final")).toBeNull();
  });

  it("parses a model file and refuses a model slug that doesn't match its quiz", () => {
    const file = (slug: string) => `---\nslug: ${slug}\ntitle: Final quiz, model B\nmodelOf: final-quiz\nquestions:\n  - a\n---\n`;
    expect(parseQuizSource(file("final-quiz-model-b"), "f.md").modelOf).toBe("final-quiz");
    expect(() => parseQuizSource(file("final-quiz-b"), "f.md")).toThrow(/final-quiz-model-b/);
  });
});

describe("question formats (ask:)", () => {
  it("fills blanks and reads them back, keeping highlighted spans whole", () => {
    const template = "int sum = ___;\nfor (int i = 1; i ____ n; i++)\n";
    expect(countBlanks(template)).toBe(2);
    const filled = fillBlanks(template, ["0", "<="]);
    expect(filled).toBe("int sum = 0;\nfor (int i = 1; i <= n; i++)\n");
    expect(blanksOf(template, filled)).toEqual(["0", "<="]);
    expect(blanksOf(template, "int total = 0;\nfor (int i = 1; i <= n; i++)\n")).toBeNull();
    expect(splitBlanks('cout << "___" << x;')).toEqual(['cout << "', '" << x;']);
    expect(splitHtmlAtBlanks('a <span class="t-str">"___"</span> b')).toEqual(['a <span class="t-str">"</span>', '<span class="t-str">"</span> b']);
  });

  it("splits a put-in-order program and scrambles its lines into a different order", () => {
    const code = "int main()\n{\n    // [order]\n    int a;\n    cin >> a;\n    cout << a;\n    // [/order]\n}\n";
    const parts = orderParts(code)!;
    expect(parts.before).toEqual(["int main()", "{"]);
    expect(parts.block).toEqual(["    int a;", "    cin >> a;", "    cout << a;"]);
    expect(joinOrder(parts, parts.block)).toBe("int main()\n{\n    int a;\n    cin >> a;\n    cout << a;\n}\n");
    expect(orderParts("int main() {}\n")).toBeNull();
    let seed = 3;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 50; i++) {
      const out = scramble(parts.block, random);
      expect(sameLines(out, parts.block)).toBe(true);
      expect(out).not.toEqual(parts.block);
    }
    // Even a generator that never shuffles gives a different order.
    expect(scramble(parts.block, () => 0.999999)).not.toEqual(parts.block);
  });

  const exercise = (front: string, body: string) => `---\nslug: x\ntitle: X\nlesson: l\ndifficulty: easy\nupdated: 2026-10-10\n${front}---\n\n## Question\n\nQ\n\n${body}\n## Explanation\n\nE\n`;
  const cppBlock = (code: string, flags = "") => "```cpp" + (flags ? ` ${flags}` : "") + "\n" + code + "\n```\n";

  it("parses count and value questions and refuses ones the checker can't prove", () => {
    const code = cppBlock("int main() { return 0; }");
    const verify = cppBlock('#include <iostream>\nint main() { std::cout << 3 << std::endl; }', "verify");
    const ok = parseExerciseSource(exercise("type: trace\nask: count\n", `## Code\n\n${code}\n${verify}\n## Answer\n\n\`\`\`output\n3\n\`\`\`\n`), "f.md");
    expect(ok.settings.ask).toBe("count");
    expect(ok.settings.compare).toBe("normalize_whitespace");
    expect(ok.verifyLanguage).toBe("cpp");
    expect(() => parseExerciseSource(exercise("type: trace\nask: count\n", `## Code\n\n${code}\n## Answer\n\n\`\`\`output\n3\n\`\`\`\n`), "f.md")).toThrow(/verify/);
    expect(() => parseExerciseSource(exercise("type: trace\nask: count\n", `## Code\n\n${code}\n${verify}\n## Answer\n\n\`\`\`output\nthree\n\`\`\`\n`), "f.md")).toThrow(/whole number/);
    expect(() => parseExerciseSource(exercise("type: mcq\nask: count\n", "## Options\n\n- [x] a\n- [ ] b\n"), "f.md")).toThrow(/for trace questions/);
  });

  const tests = "## Expected behavior\n\nPrints 1.\n\n## Tests\n\n### one\n\n```output\n1\n```\n";

  it("blanks: the solution and accepted fixes must be the template filled in", () => {
    const template = cppBlock("int x = ___;");
    const good = exercise("type: correct_code\nask: blanks\n", `## Code\n\n${template}\n${tests}\n## Solution\n\n${cppBlock("int x = 1;")}\n## Also accepted\n\n${cppBlock("int x = 2 - 1;")}\n`);
    expect(parseExerciseSource(good, "f.md").settings.ask).toBe("blanks");
    const bad = exercise("type: correct_code\nask: blanks\n", `## Code\n\n${template}\n${tests}\n## Solution\n\n${cppBlock("int y = 1;")}\n`);
    expect(() => parseExerciseSource(bad, "f.md")).toThrow(/filled in/);
  });

  it("order: the solution comes from the marked program; accepted orders may only move the marked lines", () => {
    const program = "int main()\n{\n    // [order]\n    int a = 1;\n    int b = 2;\n    cout << a + b;\n    // [/order]\n}";
    const parsed = parseExerciseSource(exercise("type: correct_code\nask: order\n", `## Code\n\n${cppBlock(program)}\n${tests}\n## Also accepted\n\n${cppBlock("int main()\n{\n    int b = 2;\n    int a = 1;\n    cout << a + b;\n}")}\n`), "f.md");
    expect(parsed.solution).toBe("int main()\n{\n    int a = 1;\n    int b = 2;\n    cout << a + b;\n}\n");
    const moved = exercise("type: correct_code\nask: order\n", `## Code\n\n${cppBlock(program)}\n${tests}\n## Also accepted\n\n${cppBlock("int main()\n{\n    int a = 1;\n    int b = 3;\n    cout << a + b;\n}")}\n`);
    expect(() => parseExerciseSource(moved, "f.md")).toThrow(/same lines/);
    const noMarkers = exercise("type: correct_code\nask: order\n", `## Code\n\n${cppBlock("int main() {}")}\n${tests}`);
    expect(() => parseExerciseSource(noMarkers, "f.md")).toThrow(/\[order\]/);
  });
});
