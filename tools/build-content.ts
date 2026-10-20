// Builds the course content seed from the reviewable files in content/.
//
//   node --experimental-strip-types tools/build-content.ts
//
// Reads   content/<course-slug>/course.json        (course id + ordered topics)
//         content/<course-slug>/lessons/*.md       (one lesson per file)
//         content/<course-slug>/images/*.png       (lesson images)
//         content/<course-slug>/exercises/*.md     (questions, Phase 3)
//         content/<course-slug>/quizzes/*.md       (quizzes)
//         content/<course-slug>/exams/*.md         (practice exam templates)
// Writes  seed/0002_content.sql                    (topics, lessons, sections, related, search index)
//         seed/0003_exercises.sql                  (questions, answer keys, quizzes, exams, search index)
//         seed/r2-objects.json                     (lesson images to upload to R2)
//
// Ids are derived from the course and slug, so re-running the seed updates rows
// in place instead of duplicating them. Every course stays separate: ids,
// related lessons and image keys are all scoped by course.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type LessonSource,
  LessonSourceError,
  markdownToPlainText,
  parseLessonSource,
  readingMinutes,
} from "../src/lib/lesson/source.ts";
import {
  type ExamSource,
  type ExerciseSource,
  type QuizSource,
  parseExamSource,
  parseExerciseSource,
  parseQuizSource,
} from "../src/lib/exercise/source.ts";
import { drawExam } from "../src/lib/grading/exam-draw.ts";
import { CHILD_TABLES, EXERCISE_COLUMNS, exerciseRows, exerciseSearchBody } from "../src/lib/content/exercise-rows.ts";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = join(ROOT, "content");

interface Topic {
  slug: string;
  title: string;
  description: string;
}
interface CourseFile {
  courseId: string;
  topics: Topic[];
}

const stableId = (prefix: string, ...parts: string[]) =>
  `${prefix}_${createHash("sha256").update(parts.join("\u0000")).digest("hex").slice(0, 16)}`;

function sql(value: string | number | null | boolean): string {
  if (value === null) return "NULL";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

function pngSize(file: string): { width: number; height: number } {
  const data = readFileSync(file);
  const signature = "89504e470d0a1a0a";
  if (data.subarray(0, 8).toString("hex") !== signature || data.subarray(12, 16).toString("ascii") !== "IHDR") {
    throw new Error(`${file} is not a PNG`);
  }
  return { width: data.readUInt32BE(16), height: data.readUInt32BE(20) };
}

const statements: string[] = [];
const exerciseStatements: string[] = [];
const counts = { exercises: 0, quizzes: 0, models: 0, exams: 0 };
const r2Objects: { key: string; file: string; contentType: string }[] = [];
const problems: string[] = [];
let lessonCount = 0;

for (const courseSlug of readdirSync(CONTENT).sort()) {
  const courseFile = join(CONTENT, courseSlug, "course.json");
  if (!existsSync(courseFile)) continue;
  const course = JSON.parse(readFileSync(courseFile, "utf8")) as CourseFile;
  const cid = course.courseId;
  const topicIds = new Map<string, string>();

  course.topics.forEach((topic, index) => {
    const id = stableId("top", cid, topic.slug);
    topicIds.set(topic.slug, id);
    statements.push(
      `INSERT INTO topics (id, course_id, slug, title, description, sort_order, status) VALUES (` +
        [id, cid, topic.slug, topic.title, topic.description, index + 1, "published"].map(sql).join(", ") +
        `) ON CONFLICT (id) DO UPDATE SET slug = excluded.slug, title = excluded.title, description = excluded.description, ` +
        `sort_order = excluded.sort_order, status = excluded.status, updated_at = unixepoch() * 1000;`,
    );
    statements.push(
      `DELETE FROM search_index WHERE course_id = ${sql(cid)} AND entity_type = 'topic' AND entity_id = ${sql(id)};`,
      `INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (` +
        [cid, "topic", id, `/courses/${courseSlug}/topics/${topic.slug}`, topic.title, topic.description].map(sql).join(", ") +
        `);`,
    );
  });

  const lessonDir = join(CONTENT, courseSlug, "lessons");
  const lessons: { source: LessonSource; file: string }[] = [];
  for (const name of existsSync(lessonDir) ? readdirSync(lessonDir).sort() : []) {
    if (!name.endsWith(".md")) continue;
    const file = `content/${courseSlug}/lessons/${name}`;
    try {
      lessons.push({ source: parseLessonSource(readFileSync(join(lessonDir, name), "utf8"), file), file });
    } catch (error) {
      if (error instanceof LessonSourceError) problems.push(error.message);
      else throw error;
    }
  }
  lessons.sort((a, b) => (a.source.lecture ?? 9999) - (b.source.lecture ?? 9999) || a.file.localeCompare(b.file));

  const lessonIds = new Map(lessons.map(({ source }) => [source.slug, stableId("les", cid, source.slug)]));
  // Related-lesson links go in after every lesson of the course exists (both ends are foreign keys).
  const relationStatements: string[] = [];
  if (lessonIds.size !== lessons.length) problems.push(`${courseSlug}: two lessons share a slug`);

  lessons.forEach(({ source, file }, index) => {
    const id = lessonIds.get(source.slug) as string;
    const topicId = topicIds.get(source.topic);
    if (!topicId) {
      problems.push(`${file}: topic "${source.topic}" is not in ${courseSlug}/course.json`);
      return;
    }
    const updatedMs = Date.parse(`${source.updated}T00:00:00Z`);
    statements.push(
      `INSERT INTO lessons (id, course_id, topic_id, slug, title, description, lecture_number, sort_order, difficulty, ` +
        `objectives, prerequisites, reading_minutes, status, published_at, updated_at) VALUES (` +
        [
          id,
          cid,
          topicId,
          source.slug,
          source.title,
          source.description,
          source.lecture,
          index + 1,
          source.difficulty,
          JSON.stringify(source.objectives),
          JSON.stringify(source.prerequisites),
          readingMinutes(source),
          source.status,
          source.status === "published" ? updatedMs : null,
          updatedMs,
        ]
          .map(sql)
          .join(", ") +
        `) ON CONFLICT (id) DO UPDATE SET topic_id = excluded.topic_id, slug = excluded.slug, title = excluded.title, ` +
        `description = excluded.description, lecture_number = excluded.lecture_number, sort_order = excluded.sort_order, ` +
        `difficulty = excluded.difficulty, objectives = excluded.objectives, prerequisites = excluded.prerequisites, ` +
        `reading_minutes = excluded.reading_minutes, status = excluded.status, ` +
        `published_at = coalesce(lessons.published_at, excluded.published_at), updated_at = excluded.updated_at;`,
      `DELETE FROM lesson_sections WHERE course_id = ${sql(cid)} AND lesson_id = ${sql(id)};`,
      `DELETE FROM lesson_relations WHERE course_id = ${sql(cid)} AND lesson_id = ${sql(id)};`,
    );

    const searchText: string[] = [source.description, ...source.objectives];
    source.sections.forEach((section, sIndex) => {
      let image: { key: string; width: number; height: number } | null = null;
      if (section.image) {
        const path = join(CONTENT, courseSlug, section.image.file);
        if (!existsSync(path)) {
          problems.push(`${file}: image ${section.image.file} not found`);
        } else {
          const key = `courses/${cid}/lessons/${id}/${section.image.file.replace(/^images\//, "")}`;
          image = { key, ...pngSize(path) };
          r2Objects.push({ key, file: `content/${courseSlug}/${section.image.file}`, contentType: "image/png" });
        }
      }
      statements.push(
        `INSERT INTO lesson_sections (id, course_id, lesson_id, kind, title, body_md, code, code_language, runnable, ` +
          `sample_input, expected_output, annotations, image_key, image_alt, image_width, image_height, sort_order, updated_at) VALUES (` +
          [
            stableId("sec", cid, source.slug, String(sIndex)),
            cid,
            id,
            section.kind,
            section.title,
            section.bodyMd,
            section.code,
            section.codeLanguage,
            section.runnable,
            section.sampleInput,
            section.expectedOutput,
            section.annotations ? JSON.stringify(section.annotations) : null,
            image?.key ?? null,
            section.image?.alt ?? null,
            image?.width ?? null,
            image?.height ?? null,
            sIndex + 1,
            updatedMs,
          ]
            .map(sql)
            .join(", ") +
          `);`,
      );
      searchText.push(section.title, markdownToPlainText(section.bodyMd), section.code ?? "");
    });

    source.related.forEach((slug, rIndex) => {
      const relatedId = lessonIds.get(slug);
      if (!relatedId) problems.push(`${file}: related lesson "${slug}" is not in ${courseSlug}`);
      else if (relatedId === id) problems.push(`${file}: a lesson can't be related to itself`);
      else {
        relationStatements.push(
          `INSERT INTO lesson_relations (course_id, lesson_id, related_lesson_id, sort_order) VALUES (` +
            [cid, id, relatedId, rIndex + 1].map(sql).join(", ") +
            `);`,
        );
      }
    });

    statements.push(
      `DELETE FROM search_index WHERE course_id = ${sql(cid)} AND entity_type = 'lesson' AND entity_id = ${sql(id)};`,
    );
    if (source.status === "published") {
      statements.push(
        `INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (` +
          [cid, "lesson", id, `/courses/${courseSlug}/lectures/${source.slug}`, source.title, searchText.join(" ").replace(/\s+/g, " ").trim()]
            .map(sql)
            .join(", ") +
          `);`,
      );
    }
    lessonCount += 1;
  });
  statements.push(...relationStatements);

  const lessonTopics = new Map(lessons.map(({ source }) => [source.slug, topicIds.get(source.topic) ?? null]));
  buildExercises(courseSlug, cid, topicIds, lessonIds, lessonTopics);
}

if (problems.length > 0) {
  console.error(`Content has ${problems.length} problem(s); nothing was written:\n- ${problems.join("\n- ")}`);
  process.exit(1);
}

const header =
  "-- GENERATED by tools/build-content.ts from content/. Do not edit by hand: change the\n" +
  "-- Markdown in content/ and run `npm run content:build`. Safe to re-run.\n\n";
writeFileSync(join(ROOT, "seed", "0002_content.sql"), header + statements.join("\n") + "\n");
writeFileSync(
  join(ROOT, "seed", "0003_exercises.sql"),
  header.replace("Safe to re-run.", "Safe to re-run. Needs 0002_content.sql first.") + exerciseStatements.join("\n") + "\n",
);
writeFileSync(join(ROOT, "seed", "r2-objects.json"), JSON.stringify(r2Objects, null, 2) + "\n");
console.log(`Built ${lessonCount} lessons, ${statements.length} statements, ${r2Objects.length} images.`);
console.log(`Built ${counts.exercises} exercises, ${counts.quizzes} quizzes${counts.models ? ` (+${counts.models} extra models)` : ""}, ${counts.exams} practice exam${counts.exams === 1 ? "" : "s"}.`);

// ---------------------------------------------------------------------------
// Exercises, quizzes and exams (Phase 3)
// ---------------------------------------------------------------------------

function readAll<T>(dir: string, file: (name: string) => string, parse: (text: string, file: string) => T): { source: T; file: string }[] {
  if (!existsSync(dir)) return [];
  const out: { source: T; file: string }[] = [];
  for (const name of readdirSync(dir).sort()) {
    if (!name.endsWith(".md")) continue;
    try {
      out.push({ source: parse(readFileSync(join(dir, name), "utf8"), file(name)), file: file(name) });
    } catch (error) {
      if (error instanceof LessonSourceError) problems.push(error.message);
      else throw error;
    }
  }
  return out;
}

function upsert(table: string, columns: string[], values: (string | number | boolean | null)[], updateColumns: string[]): string {
  return (
    `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${values.map(sql).join(", ")}) ` +
    `ON CONFLICT (id) DO UPDATE SET ${updateColumns.map((c) => `${c} = excluded.${c}`).join(", ")};`
  );
}

function buildExercises(
  courseSlug: string,
  cid: string,
  topicIds: Map<string, string>,
  lessonIds: Map<string, string>,
  lessonTopics: Map<string, string | null>,
) {
  const base = join(CONTENT, courseSlug);
  const exercises = readAll(join(base, "exercises"), (n) => `content/${courseSlug}/exercises/${n}`, parseExerciseSource);
  const quizzes = readAll(join(base, "quizzes"), (n) => `content/${courseSlug}/quizzes/${n}`, parseQuizSource);
  const exams = readAll(join(base, "exams"), (n) => `content/${courseSlug}/exams/${n}`, parseExamSource);

  const bySlug = new Map<string, { ex: ExerciseSource; id: string; topicId: string | null }>();
  for (const { source: ex, file } of exercises) {
    if (bySlug.has(ex.slug)) problems.push(`${file}: slug "${ex.slug}" is used twice in ${courseSlug}`);
    const lessonId = ex.lesson ? lessonIds.get(ex.lesson) : null;
    if (ex.lesson && !lessonId) problems.push(`${file}: lesson "${ex.lesson}" is not in ${courseSlug}`);
    const topicId = ex.topic ? topicIds.get(ex.topic) : ex.lesson ? lessonTopics.get(ex.lesson) : null;
    if (ex.topic && !topicId) problems.push(`${file}: topic "${ex.topic}" is not in ${courseSlug}/course.json`);
    const id = stableId("exe", cid, ex.slug);
    bySlug.set(ex.slug, { ex, id, topicId: topicId ?? null });
    const updatedMs = Date.parse(`${ex.updated}T00:00:00Z`);

    const rows = exerciseRows(ex, {
      id,
      courseId: cid,
      topicId: topicId ?? null,
      lessonId: lessonId ?? null,
      updatedAt: updatedMs,
      childId: (table, i) => stableId(table, cid, ex.slug, String(i)),
    });
    exerciseStatements.push(
      upsert(
        "exercises",
        [...EXERCISE_COLUMNS],
        EXERCISE_COLUMNS.map((c) => rows.exercise[c] ?? null),
        EXERCISE_COLUMNS.filter((c) => c !== "id" && c !== "course_id"),
      ),
    );
    for (const table of CHILD_TABLES) {
      exerciseStatements.push(`DELETE FROM ${table} WHERE course_id = ${sql(cid)} AND exercise_id = ${sql(id)};`);
    }
    for (const { table, row } of rows.children) {
      const columns = Object.keys(row);
      exerciseStatements.push(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map((c) => sql(row[c] ?? null)).join(", ")});`);
    }
    exerciseStatements.push(`DELETE FROM search_index WHERE course_id = ${sql(cid)} AND entity_type = 'exercise' AND entity_id = ${sql(id)};`);
    // Reserved questions (a final quiz's) are never searchable or listed.
    const body = exerciseSearchBody(ex);
    if (body !== null) {
      exerciseStatements.push(
        `INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (` +
          [cid, "exercise", id, `/courses/${courseSlug}/exercises/${ex.slug}`, ex.title, body].map(sql).join(", ") + `);`,
      );
    }
    counts.exercises += 1;
  }

  const scorable = (slug: string, file: string, published: boolean) => {
    const found = bySlug.get(slug);
    if (!found) {
      problems.push(`${file}: question "${slug}" is not in ${courseSlug}/exercises`);
      return null;
    }
    if (found.ex.type === "write_code") problems.push(`${file}: "${slug}" is write_code, which can't be scored until the Phase 9 runner`);
    if (published && found.ex.status !== "published") problems.push(`${file}: "${slug}" is a draft, so a published quiz can't use it`);
    return found;
  };

  const reservedOwner = new Map<string, string>();
  const quizBySlug = new Map((quizzes as { source: QuizSource }[]).map(({ source }) => [source.slug, source]));
  for (const { source: own, file } of quizzes as { source: QuizSource; file: string }[]) {
    // A model takes its timer, marks, attempts and status from its quiz; only its questions are its own.
    const parent = own.modelOf ? quizBySlug.get(own.modelOf) : undefined;
    if (own.modelOf && (!parent || parent.modelOf)) problems.push(`${file}: modelOf "${own.modelOf}" must be a quiz of ${courseSlug} that is not a model itself`);
    const lookalike = /^(.+)-model-[b-z]$/.exec(own.slug)?.[1];
    if (!own.modelOf && lookalike && quizBySlug.has(lookalike)) problems.push(`${file}: "${own.slug}" looks like a model of "${lookalike}"; add modelOf: ${lookalike}`);
    const quiz: QuizSource = parent
      ? { ...parent, slug: own.slug, title: own.title, descriptionMd: "", topic: parent.topic, questions: own.questions, modelOf: parent.slug }
      : own;
    const family = quiz.modelOf ?? quiz.slug;
    const id = stableId("quiz", cid, quiz.slug);
    const topicId = quiz.topic ? topicIds.get(quiz.topic) : null;
    if (quiz.topic && !topicId) problems.push(`${file}: topic "${quiz.topic}" is not in ${courseSlug}/course.json`);
    exerciseStatements.push(
      upsert(
        "quizzes",
        ["id", "course_id", "topic_id", "slug", "title", "description_md", "mode", "feedback", "time_limit_sec", "pass_threshold",
          "shuffle_questions", "shuffle_options", "max_attempts", "status", "is_demo"],
        [id, cid, topicId ?? null, quiz.slug, quiz.title, quiz.descriptionMd, quiz.mode, quiz.mode === "exam" ? "after_submit" : "immediate",
          quiz.timeLimitSec, quiz.passThreshold, quiz.shuffleQuestions, quiz.shuffleOptions, quiz.maxAttempts, quiz.status, quiz.demo],
        ["topic_id", "slug", "title", "description_md", "mode", "feedback", "time_limit_sec", "pass_threshold", "shuffle_questions",
          "shuffle_options", "max_attempts", "status", "is_demo"],
      ),
      `DELETE FROM quiz_questions WHERE course_id = ${sql(cid)} AND quiz_id = ${sql(id)};`,
    );
    quiz.questions.forEach((q, i) => {
      const found = scorable(q.slug, file, quiz.status === "published");
      if (!found) return;
      if (found.ex.settings.reserved) {
        // A reserved question belongs to one quiz only (no repeats from other quizzes).
        // Models of one quiz may share questions with each other.
        const owner = reservedOwner.get(q.slug);
        if (owner && owner !== family) problems.push(`${file}: "${q.slug}" is reserved for the quiz "${owner}"`);
        reservedOwner.set(q.slug, family);
      }
      exerciseStatements.push(
        `INSERT INTO quiz_questions (course_id, quiz_id, exercise_id, sort_order, points) VALUES (` +
          [cid, id, found.id, i + 1, q.points].map(sql).join(", ") + `);`,
      );
    });
    exerciseStatements.push(`DELETE FROM search_index WHERE course_id = ${sql(cid)} AND entity_type = 'quiz' AND entity_id = ${sql(id)};`);
    if (quiz.status === "published" && !quiz.modelOf) {
      exerciseStatements.push(
        `INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (` +
          [cid, "quiz", id, `/courses/${courseSlug}/quizzes/${quiz.slug}`, quiz.title, markdownToPlainText(quiz.descriptionMd)].map(sql).join(", ") + `);`,
      );
    }
    if (quiz.modelOf) counts.models += 1;
    else counts.quizzes += 1;
  }

  const bank = [...bySlug.values()]
    .filter(({ ex }) => ex.status === "published" && ex.type !== "write_code" && !ex.settings.reserved)
    .map(({ ex, id, topicId }) => ({ id, type: ex.type, difficulty: ex.difficulty, topicId }));
  for (const { source: exam, file } of exams as { source: ExamSource; file: string }[]) {
    const id = stableId("exam", cid, exam.slug);
    const rules = exam.rules.map((r) => {
      const topicId = r.topic ? topicIds.get(r.topic) : null;
      if (r.topic && !topicId) problems.push(`${file}: topic "${r.topic}" is not in ${courseSlug}/course.json`);
      return { ...r, topicId: topicId ?? null };
    });
    // The same draw the server makes, many times over: every attempt must be possible.
    let seed = 1;
    const random = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
    for (let i = 0; i < 200; i++) {
      if (!drawExam(rules, bank, random)) {
        problems.push(`${file}: the course doesn't have enough published questions for these draw rules`);
        break;
      }
    }
    exerciseStatements.push(
      upsert(
        "exam_templates",
        ["id", "course_id", "slug", "title", "description_md", "scope", "time_limit_sec", "pass_threshold", "shuffle_questions", "status", "is_demo"],
        [id, cid, exam.slug, exam.title, exam.descriptionMd, exam.scope, exam.timeLimitSec, exam.passThreshold, exam.shuffleQuestions, exam.status, exam.demo],
        ["slug", "title", "description_md", "scope", "time_limit_sec", "pass_threshold", "shuffle_questions", "status", "is_demo"],
      ),
      `DELETE FROM exam_template_rules WHERE course_id = ${sql(cid)} AND exam_template_id = ${sql(id)};`,
    );
    rules.forEach((r, i) =>
      exerciseStatements.push(
        `INSERT INTO exam_template_rules (id, course_id, exam_template_id, topic_id, type, difficulty, question_count, points_each) VALUES (` +
          [`${stableId("rule", cid, exam.slug)}_${String(i + 1).padStart(2, "0")}`, cid, id, r.topicId, r.type, r.difficulty, r.count, r.points].map(sql).join(", ") + `);`,
      ),
    );
    counts.exams += 1;
  }
}
