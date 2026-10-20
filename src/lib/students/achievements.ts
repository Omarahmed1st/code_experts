// Achievements: the same set in every course, earned separately in each
// course (a C++ badge says nothing about Python). Pure rules here; the server
// counts the student's activity and stores what is earned
// (achievements / student_achievements, src/server/students/dashboard.ts).

export interface AchievementStats {
  solved: number;
  lecturesDone: number;
  lecturesTotal: number;
  quizzesPassed: number;
  fullMarks: number;
  bestStreak: number;
}

export interface AchievementRule {
  slug: string;
  title: string;
  description: string;
  /** Machine-readable rule, stored in achievements.criteria. */
  criteria: { kind: keyof AchievementStats | "allLectures"; atLeast?: number };
}

export const ACHIEVEMENTS: readonly AchievementRule[] = [
  { slug: "first-correct", title: "First step", description: "Answer a question correctly.", criteria: { kind: "solved", atLeast: 1 } },
  { slug: "solved-10", title: "Warming up", description: "Solve 10 different questions.", criteria: { kind: "solved", atLeast: 10 } },
  { slug: "solved-50", title: "Problem solver", description: "Solve 50 different questions.", criteria: { kind: "solved", atLeast: 50 } },
  { slug: "first-lecture", title: "First lecture", description: "Finish a lecture and mark it as done.", criteria: { kind: "lecturesDone", atLeast: 1 } },
  { slug: "all-lectures", title: "Read it all", description: "Mark every lecture in this course as done.", criteria: { kind: "allLectures" } },
  { slug: "quiz-passed", title: "Passed", description: "Pass a quiz or a practice exam.", criteria: { kind: "quizzesPassed", atLeast: 1 } },
  { slug: "full-marks", title: "Full marks", description: "Get every point in a quiz or practice exam.", criteria: { kind: "fullMarks", atLeast: 1 } },
  { slug: "streak-3", title: "Three days in a row", description: "Study this course three days in a row.", criteria: { kind: "bestStreak", atLeast: 3 } },
  { slug: "streak-7", title: "A full week", description: "Study this course seven days in a row.", criteria: { kind: "bestStreak", atLeast: 7 } },
];

export function isEarned(rule: AchievementRule, stats: AchievementStats): boolean {
  const { kind, atLeast = 1 } = rule.criteria;
  if (kind === "allLectures") return stats.lecturesTotal > 0 && stats.lecturesDone >= stats.lecturesTotal;
  return stats[kind] >= atLeast;
}

/** How far along a locked achievement is, as "3 / 10", or null when that doesn't apply. */
export function progressText(rule: AchievementRule, stats: AchievementStats): string | null {
  const { kind, atLeast = 1 } = rule.criteria;
  if (kind === "allLectures") return stats.lecturesTotal > 0 ? `${stats.lecturesDone} / ${stats.lecturesTotal}` : null;
  if (atLeast <= 1) return null;
  return `${Math.min(stats[kind], atLeast)} / ${atLeast}`;
}

/** The achievement row id in a course (achievements are made per course the first time someone earns one there). */
export function achievementId(courseId: string, slug: string): string {
  return `ach_${courseId}_${slug}`;
}
