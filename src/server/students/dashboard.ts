// The personal dashboard: one summary card per course on /dashboard (never a
// combined score), and the full picture of one course on /dashboard/<course>.
import { ACHIEVEMENTS, type AchievementStats, achievementId, isEarned, progressText } from "@/lib/students/achievements";
import { type Recommendation, type TopicActivity, recommend } from "@/lib/students/recommend";
import { type Streak, streakOf } from "@/lib/students/streak";
import { listQuizzes } from "@/server/assessments/catalog";
import { getCourseOutline } from "@/server/content/lessons";
import { type CourseScope, type CourseSummary, listPublishedCourses } from "@/server/courses/scope";
import { listExercises } from "@/server/exercises/catalog";
import { getBindings } from "@/server/platform/env";
import { type AttemptRow, listAttempts } from "./history";
import { ANSWERS_CTE, type CourseState, getCourseState, listBookmarks } from "./progress";

export interface CourseCard {
  course: CourseSummary;
  lecturesTotal: number;
  lecturesDone: number;
  questionsTotal: number;
  questionsSolved: number;
  lastActive: number | null;
}

/** Moments of activity (ms) in a course: answers, lecture progress and attempts. ?1 user, ?2 course. */
const ACTIVITY_SQL = `WITH ${ANSWERS_CTE}
  SELECT DISTINCT (at / 3600000) * 3600000 AS hour FROM (
    SELECT at FROM answers
    UNION ALL SELECT updated_at FROM student_progress WHERE user_id = ?1 AND course_id = ?2
    UNION ALL SELECT started_at FROM quiz_attempts WHERE user_id = ?1 AND course_id = ?2
    UNION ALL SELECT started_at FROM exam_attempts WHERE user_id = ?1 AND course_id = ?2
    UNION ALL SELECT started_at FROM custom_exam_attempts WHERE user_id = ?1 AND course_id = ?2
  ) WHERE at IS NOT NULL ORDER BY hour DESC LIMIT 2000`;

async function activityHours(userId: string, scope: CourseScope): Promise<number[]> {
  const { results } = await getBindings().db.prepare(ACTIVITY_SQL).bind(userId, scope.courseId).all<{ hour: number }>();
  return results.map((r) => Number(r.hour));
}

export async function listCourseCards(userId: string): Promise<CourseCard[]> {
  const courses = await listPublishedCourses();
  return Promise.all(
    courses.map(async (course) => {
      const [outline, questions, state, hours] = await Promise.all([
        getCourseOutline(course),
        listExercises(course),
        getCourseState(userId, course),
        activityHours(userId, course),
      ]);
      const lectures = outline.flatMap((t) => t.lessons);
      const questionSlugs = new Set(questions.map((q) => q.slug));
      return {
        course,
        lecturesTotal: lectures.length,
        lecturesDone: lectures.filter((l) => state.lectures[l.slug] === "completed").length,
        questionsTotal: questions.length,
        questionsSolved: Object.entries(state.answers).filter(([slug, a]) => a.status === "correct" && questionSlugs.has(slug)).length,
        lastActive: hours[0] ?? null,
      };
    }),
  );
}

export interface TopicProgress extends TopicActivity {
  solved: number;
  lectures: { slug: string; title: string; lectureNumber: number | null; status: "completed" | "started" | null }[];
}

export interface AchievementView {
  slug: string;
  title: string;
  description: string;
  earnedAt: number | null;
  progress: string | null;
}

export interface CourseDashboard {
  state: CourseState;
  lecturesTotal: number;
  lecturesDone: number;
  questionsTotal: number;
  questionsSolved: number;
  mistakes: string[];
  answers: number;
  right: number;
  topics: TopicProgress[];
  recommendations: Recommendation[];
  recentAttempts: AttemptRow[];
  bestByQuiz: Record<string, { percent: number; passed: boolean }>;
  attemptsCount: number;
  bookmarksCount: number;
  streak: Streak;
  achievements: AchievementView[];
}

export async function getCourseDashboard(userId: string, scope: CourseScope, now = Date.now()): Promise<CourseDashboard> {
  const { db } = getBindings();
  const [outline, questions, state, attempts, quizzes, hours, bookmarks, topicRows] = await Promise.all([
    getCourseOutline(scope),
    listExercises(scope),
    getCourseState(userId, scope, now),
    listAttempts(userId, scope, 200, now),
    listQuizzes(scope),
    activityHours(userId, scope),
    listBookmarks(userId, scope, now),
    db
      .prepare(
        `WITH ${ANSWERS_CTE}
         SELECT t.slug, count(*) AS answers, sum(a.ok) AS rightCount FROM answers a
           JOIN exercises e ON e.course_id = ?2 AND e.id = a.exercise_id
           JOIN topics t ON t.course_id = e.course_id AND t.id = e.topic_id
          GROUP BY t.slug`,
      )
      .bind(userId, scope.courseId)
      .all<{ slug: string; answers: number; rightCount: number }>()
      .then((r) => r.results),
  ]);

  const lectures = outline.flatMap((t) => t.lessons);
  const questionSlugs = new Set(questions.map((q) => q.slug));
  const solvedSlugs = new Set(Object.entries(state.answers).filter(([s, a]) => a.status === "correct" && questionSlugs.has(s)).map(([s]) => s));
  const mistakes = Object.entries(state.answers)
    .filter(([s, a]) => a.status === "wrong" && questionSlugs.has(s))
    .sort((a, b) => b[1].at - a[1].at)
    .map(([s]) => s);

  // Best result per quiz (models count for their quiz) and which quizzes are passed.
  const bestByQuiz: Record<string, { percent: number; passed: boolean }> = {};
  for (const a of attempts) {
    if (a.kind !== "quiz" || a.state !== "submitted" || a.percent === null) continue;
    const slug = a.retakeHref.split("/").pop()!;
    const before = bestByQuiz[slug];
    if (!before || a.percent > before.percent) bestByQuiz[slug] = { percent: a.percent, passed: a.passed === true || before?.passed === true };
    else if (a.passed) before.passed = true;
  }
  const passedAny = attempts.filter((a) => a.state === "submitted" && a.passed).length;
  const fullMarks = attempts.filter((a) => a.state === "submitted" && a.maxScore && a.score === a.maxScore).length;

  const byTopicAnswers = new Map(topicRows.map((r) => [r.slug, r]));
  const topics: TopicProgress[] = outline.map((t) => {
    const topicQuestions = questions.filter((q) => q.topic?.slug === t.slug);
    const answered = byTopicAnswers.get(t.slug);
    const quiz = quizzes.find((q) => q.topic?.slug === t.slug && !bestByQuiz[q.slug]?.passed) ?? null;
    return {
      slug: t.slug,
      title: t.title,
      lecturesTotal: t.lessons.length,
      lecturesDone: t.lessons.filter((l) => state.lectures[l.slug] === "completed").length,
      questions: topicQuestions.length,
      solved: topicQuestions.filter((q) => solvedSlugs.has(q.slug)).length,
      answers: Number(answered?.answers ?? 0),
      right: Number(answered?.rightCount ?? 0),
      openQuiz: quiz ? { slug: quiz.slug, title: quiz.title } : null,
      lectures: t.lessons.map((l) => ({ slug: l.slug, title: l.title, lectureNumber: l.lectureNumber, status: state.lectures[l.slug] ?? null })),
    };
  });

  const nextLecture = lectures.find((l) => state.lectures[l.slug] !== "completed") ?? null;
  const recommendations = recommend({
    courseSlug: scope.slug,
    nextLecture: nextLecture ? { slug: nextLecture.slug, title: nextLecture.title, started: state.lectures[nextLecture.slug] === "started" } : null,
    mistakes,
    topics,
  });

  const streak = streakOf(hours, now);
  const lecturesDone = lectures.filter((l) => state.lectures[l.slug] === "completed").length;
  const stats: AchievementStats = {
    solved: solvedSlugs.size,
    lecturesDone,
    lecturesTotal: lectures.length,
    quizzesPassed: passedAny,
    fullMarks,
    bestStreak: streak.best,
  };
  const achievements = await awardAchievements(userId, scope, stats, now);

  const totals = topicRows.reduce((n, r) => ({ answers: n.answers + Number(r.answers), right: n.right + Number(r.rightCount) }), { answers: 0, right: 0 });
  return {
    state,
    lecturesTotal: lectures.length,
    lecturesDone,
    questionsTotal: questions.length,
    questionsSolved: solvedSlugs.size,
    mistakes,
    answers: totals.answers,
    right: totals.right,
    topics,
    recommendations,
    recentAttempts: attempts.slice(0, 5),
    bestByQuiz,
    attemptsCount: attempts.filter((a) => a.state === "submitted").length,
    bookmarksCount: bookmarks.length,
    streak,
    achievements,
  };
}

/**
 * Stores newly earned achievements (the course's achievement rows are made the
 * first time anyone earns one there) and returns all of them, earned first.
 */
async function awardAchievements(userId: string, scope: CourseScope, stats: AchievementStats, now: number): Promise<AchievementView[]> {
  const { db } = getBindings();
  const earnedRows = await db
    .prepare("SELECT a.slug, s.awarded_at AS awardedAt FROM student_achievements s JOIN achievements a ON a.course_id = s.course_id AND a.id = s.achievement_id WHERE s.user_id = ? AND s.course_id = ?")
    .bind(userId, scope.courseId)
    .all<{ slug: string; awardedAt: number }>();
  const earned = new Map(earnedRows.results.map((r) => [r.slug, r.awardedAt]));
  const fresh = ACHIEVEMENTS.filter((a) => !earned.has(a.slug) && isEarned(a, stats));
  if (fresh.length > 0) {
    await db.batch(
      fresh.flatMap((a) => [
        db
          .prepare("INSERT INTO achievements (id, course_id, slug, title, description, criteria, status, created_at) VALUES (?, ?, ?, ?, ?, ?, 'published', ?) ON CONFLICT DO NOTHING")
          .bind(achievementId(scope.courseId, a.slug), scope.courseId, a.slug, a.title, a.description, JSON.stringify(a.criteria), now),
        // By slug, so a row made another way (with another id) is used as it is.
        db
          .prepare(
            `INSERT INTO student_achievements (user_id, course_id, achievement_id, awarded_at)
             SELECT ?1, ?2, id, ?4 FROM achievements WHERE course_id = ?2 AND slug = ?3 ON CONFLICT DO NOTHING`,
          )
          .bind(userId, scope.courseId, a.slug, now),
      ]),
    );
    for (const a of fresh) earned.set(a.slug, now);
  }
  return ACHIEVEMENTS.map((a) => ({
    slug: a.slug,
    title: a.title,
    description: a.description,
    earnedAt: earned.get(a.slug) ?? null,
    progress: earned.has(a.slug) ? null : progressText(a, stats),
  })).sort((a, b) => (a.earnedAt === null ? 1 : 0) - (b.earnedAt === null ? 1 : 0));
}
