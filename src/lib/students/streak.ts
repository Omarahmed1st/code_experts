// Practice streaks: days in a row (Cairo time) with any activity in a course.
// Pure, so it is unit-tested on its own.

const DAY = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Africa/Cairo" });

/** "2026-10-10": the Cairo calendar day of a moment. */
export function cairoDay(ms: number): string {
  return DAY.format(new Date(ms));
}

/** Days since 1970-01-01 for a "YYYY-MM-DD" day (calendar arithmetic, no time zone). */
function dayNumber(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Math.round(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

export interface Streak {
  /** Days in a row ending today or yesterday (a streak isn't lost until a whole day passes). */
  current: number;
  best: number;
  /** Different days with activity. */
  activeDays: number;
}

export function streakOf(moments: readonly number[], now: number): Streak {
  const days = [...new Set(moments.map(cairoDay))].map(dayNumber).sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < days.length; i++) {
    run = i > 0 && days[i] === days[i - 1]! + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const today = dayNumber(cairoDay(now));
  const last = days.at(-1);
  const current = last !== undefined && today - last <= 1 ? run : 0;
  return { current, best, activeDays: days.length };
}
