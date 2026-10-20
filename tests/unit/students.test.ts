// Phase 5's pure pieces: recovery codes, streaks, achievements, suggestions,
// device names and where to go after signing in.
import { describe, expect, it } from "vitest";
import { deviceName } from "@/lib/auth/device-name";
import { RECOVERY_CODE_LENGTH, newRecoveryCode, normalizeRecoveryCode } from "@/lib/auth/recovery-code";
import { safeNextPath } from "@/lib/auth/session-token";
import { ACHIEVEMENTS, type AchievementStats, isEarned, progressText } from "@/lib/students/achievements";
import { type TopicActivity, recommend } from "@/lib/students/recommend";
import { cairoDay, streakOf } from "@/lib/students/streak";

describe("recovery codes", () => {
  it("are 16 readable characters in groups of four, different every time", () => {
    const codes = new Set(Array.from({ length: 200 }, () => newRecoveryCode()));
    expect(codes.size).toBe(200);
    for (const code of codes) {
      expect(code).toMatch(/^[A-HJKMNP-Z2-9]{4}(-[A-HJKMNP-Z2-9]{4}){3}$/);
      expect(normalizeRecoveryCode(code)).toHaveLength(RECOVERY_CODE_LENGTH);
    }
  });

  it("forgive case, spaces and dashes, and refuse anything else", () => {
    expect(normalizeRecoveryCode("abcd-efgh-jkmn-pqrs")).toBe("ABCDEFGHJKMNPQRS");
    expect(normalizeRecoveryCode(" ABCD EFGH JKMN PQRS ")).toBe("ABCDEFGHJKMNPQRS");
    for (const bad of ["ABCD-EFGH-JKMN-PQR", "ABCD-EFGH-JKMN-PQRS-T", "ABCD-EFGH-JKMN-PQR0", "OOOO-OOOO-OOOO-OOOO", 42, null, "x".repeat(100)]) {
      expect(normalizeRecoveryCode(bad)).toBeNull();
    }
  });
});

describe("streaks", () => {
  // 2026-10-10 12:00 Cairo is 09:00 UTC (Egypt is UTC+3 in October).
  const noon = (day: number) => Date.UTC(2026, 9, day, 9, 0);

  it("use Cairo days", () => {
    expect(cairoDay(Date.UTC(2026, 9, 9, 22, 30))).toBe("2026-10-10"); // 01:30 the next day in Cairo
    expect(cairoDay(Date.UTC(2026, 9, 9, 20, 30))).toBe("2026-10-09");
  });

  it("count days in a row, ending today or yesterday", () => {
    expect(streakOf([], noon(10))).toEqual({ current: 0, best: 0, activeDays: 0 });
    expect(streakOf([noon(8), noon(9), noon(9) + 3600_000, noon(10)], noon(10))).toEqual({ current: 3, best: 3, activeDays: 3 });
    // Not lost until a whole day passes.
    expect(streakOf([noon(8), noon(9)], noon(10)).current).toBe(2);
    expect(streakOf([noon(8), noon(9)], noon(11)).current).toBe(0);
    // The best streak is remembered after a break.
    expect(streakOf([noon(1), noon(2), noon(3), noon(4), noon(9), noon(10)], noon(10))).toEqual({ current: 2, best: 4, activeDays: 6 });
  });
});

describe("achievements", () => {
  const none: AchievementStats = { solved: 0, lecturesDone: 0, lecturesTotal: 10, quizzesPassed: 0, fullMarks: 0, bestStreak: 0 };
  const rule = (slug: string) => ACHIEVEMENTS.find((a) => a.slug === slug)!;

  it("have unique slugs", () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.slug)).size).toBe(ACHIEVEMENTS.length);
  });

  it("are earned from the course's numbers", () => {
    expect(ACHIEVEMENTS.filter((a) => isEarned(a, none))).toEqual([]);
    expect(isEarned(rule("solved-10"), { ...none, solved: 10 })).toBe(true);
    expect(isEarned(rule("solved-10"), { ...none, solved: 9 })).toBe(false);
    expect(isEarned(rule("all-lectures"), { ...none, lecturesDone: 10 })).toBe(true);
    // A course without lectures doesn't hand out "read it all".
    expect(isEarned(rule("all-lectures"), { ...none, lecturesTotal: 0 })).toBe(false);
    expect(isEarned(rule("streak-7"), { ...none, bestStreak: 7 })).toBe(true);
  });

  it("show how far along a locked one is", () => {
    expect(progressText(rule("solved-50"), { ...none, solved: 12 })).toBe("12 / 50");
    expect(progressText(rule("solved-50"), { ...none, solved: 80 })).toBe("50 / 50");
    expect(progressText(rule("all-lectures"), { ...none, lecturesDone: 3 })).toBe("3 / 10");
    expect(progressText(rule("first-correct"), none)).toBeNull();
  });
});

describe("what to do next", () => {
  const topic = (over: Partial<TopicActivity>): TopicActivity => ({
    slug: "loops",
    title: "Loops",
    lecturesTotal: 2,
    lecturesDone: 0,
    questions: 10,
    answers: 0,
    right: 0,
    openQuiz: null,
    ...over,
  });

  it("starts with the next lecture and the missed questions", () => {
    const out = recommend({ courseSlug: "cpp", nextLecture: { slug: "while", title: "While loops", started: true }, mistakes: ["a", "b"], topics: [] });
    expect(out.map((r) => r.kind)).toEqual(["lecture", "mistakes"]);
    expect(out[0]).toMatchObject({ title: "Continue: While loops", href: "/courses/cpp/lectures/while" });
    expect(out[1]).toMatchObject({ title: "Retry the 2 questions you missed", href: "/courses/cpp/practice?retry=a,b" });
  });

  it("suggests the weakest topic only after enough answers, a new topic after reading, and the quiz after every lecture", () => {
    const out = recommend({
      courseSlug: "cpp",
      nextLecture: null,
      mistakes: [],
      topics: [
        topic({ slug: "few", title: "Few", answers: 2, right: 0 }),
        topic({ slug: "weak", title: "Weak", answers: 10, right: 4 }),
        topic({ slug: "weaker", title: "Weaker", answers: 10, right: 2 }),
        topic({ slug: "read", title: "Read", lecturesDone: 1 }),
        topic({ slug: "done", title: "Done", lecturesDone: 2, answers: 10, right: 9, openQuiz: { slug: "done-quiz", title: "Done quiz" } }),
      ],
    });
    expect(out.map((r) => `${r.kind}:${r.href}`)).toEqual([
      "weak-topic:/courses/cpp/practice?set=1&topic=weaker",
      "new-topic:/courses/cpp/practice?set=1&topic=read",
      "quiz:/courses/cpp/quizzes/done-quiz",
    ]);
  });
});

describe("after signing in", () => {
  it("never goes back to the sign-in, sign-up or recovery pages", () => {
    expect(safeNextPath("/courses/cpp/lectures/x", "/dashboard")).toBe("/courses/cpp/lectures/x");
    for (const p of ["/login", "/login?next=/admin", "/register", "/forgot-password"]) expect(safeNextPath(p, "/dashboard")).toBe("/dashboard");
    expect(safeNextPath("/registered-users", "/dashboard")).toBe("/registered-users");
  });

  it("names devices in plain words", () => {
    expect(deviceName("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36")).toBe("Chrome on Windows");
    expect(deviceName("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile Safari/604.1")).toBe("Safari on iPhone or iPad");
    expect(deviceName(null)).toBe("Unknown browser");
  });
});
