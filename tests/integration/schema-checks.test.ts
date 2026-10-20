// The 28 schema checks from tools/schema-checks/check_schema.py, ported to run
// against a real local D1 (workerd + Miniflare) instead of desktop SQLite.
//
// Stronger than the Python version in two ways:
//   1. A rejected insert must fail on the expected constraint (the error message
//      is matched), not on any integrity error.
//   2. Every "rejected because it crosses courses" case has a control: the same
//      insert with the link pointing inside one course must succeed. That proves
//      the rejection comes from the course boundary, not from a typo or a
//      missing row in the test.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { FK, countsByCourse, errorOf, migrate, resetAndSeed, run } from "./db-helpers";

const CHECK = (expression: string) => new RegExp(`CHECK constraint failed: .*${escape(expression)}`);
const UNIQUE = (columns: string) => new RegExp(`UNIQUE constraint failed: ${escape(columns)}`);

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

interface RejectCase {
  name: string;
  setup?: string[];
  rejected: string;
  constraint: RegExp;
  /** The nearest valid statement; must succeed. */
  control: string;
}

const crossCourse: RejectCase[] = [
  {
    name: "1. lecture under another course's topic",
    rejected: "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_x','c_py','t_c_cpp','x','x')",
    constraint: FK,
    control: "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_x','c_py','t_c_py','x','x')",
  },
  {
    name: "2. subtopic under another course's topic",
    rejected: "INSERT INTO topics (id, course_id, parent_topic_id, slug, title) VALUES ('t_x','c_py','t_c_cpp','x','x')",
    constraint: FK,
    control: "INSERT INTO topics (id, course_id, parent_topic_id, slug, title) VALUES ('t_x','c_py','t_c_py','x','x')",
  },
  {
    name: "3. C++ question added to a Python quiz",
    rejected: "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_cpp')",
    constraint: FK,
    control: "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_py')",
  },
  {
    name: "4. same, claiming the C++ course id",
    rejected: "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_cpp','q_c_py','e_c_cpp')",
    constraint: FK,
    control: "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_cpp','q_c_cpp','e_c_cpp')",
  },
  {
    name: "5. another course's PowerPoint attached to a lecture",
    rejected: "INSERT INTO lesson_resources (course_id, lesson_id, resource_id) VALUES ('c_py','l_c_py','r_c_cv')",
    constraint: FK,
    control: "INSERT INTO lesson_resources (course_id, lesson_id, resource_id) VALUES ('c_py','l_c_py','r_c_py')",
  },
  {
    name: "6. related lecture from another course",
    setup: ["INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_py2','c_py','t_c_py','while-loops','While loops')"],
    rejected: "INSERT INTO lesson_relations (course_id, lesson_id, related_lesson_id) VALUES ('c_py','l_c_py','l_c_cpp')",
    constraint: FK,
    control: "INSERT INTO lesson_relations (course_id, lesson_id, related_lesson_id) VALUES ('c_py','l_c_py','l_py2')",
  },
  {
    name: "7. question linked to another course's lecture",
    rejected:
      "INSERT INTO exercises (id, course_id, lesson_id, slug, type, title, prompt_md, difficulty, grading_mode) " +
      "VALUES ('e_x','c_cv','l_c_py','x','mcq','x','x','easy','auto')",
    constraint: FK,
    control:
      "INSERT INTO exercises (id, course_id, lesson_id, slug, type, title, prompt_md, difficulty, grading_mode) " +
      "VALUES ('e_x','c_cv','l_c_cv','x','mcq','x','x','easy','auto')",
  },
  {
    name: "8. MCQ option filed under the wrong course",
    rejected: "INSERT INTO exercise_options (id, course_id, exercise_id, label_md) VALUES ('o_x','c_py','e_c_cpp','x')",
    constraint: FK,
    control: "INSERT INTO exercise_options (id, course_id, exercise_id, label_md) VALUES ('o_x','c_cpp','e_c_cpp','x')",
  },
  {
    name: "9. hint filed under the wrong course",
    rejected: "INSERT INTO exercise_hints (id, course_id, exercise_id, hint_md) VALUES ('h_x','c_cv','e_c_py','x')",
    constraint: FK,
    control: "INSERT INTO exercise_hints (id, course_id, exercise_id, hint_md) VALUES ('h_x','c_py','e_c_py','x')",
  },
  {
    name: "10. exam rule using another course's topic",
    rejected:
      "INSERT INTO exam_template_rules (id, course_id, exam_template_id, topic_id, question_count) VALUES ('xr','c_cpp','x_c_cpp','t_c_py',5)",
    constraint: FK,
    control:
      "INSERT INTO exam_template_rules (id, course_id, exam_template_id, topic_id, question_count) VALUES ('xr','c_cpp','x_c_cpp','t_c_cpp',5)",
  },
  {
    name: "11. lecture progress recorded under the wrong course",
    rejected: "INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_cpp','l_c_py')",
    constraint: FK,
    control: "INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_py','l_c_py')",
  },
  {
    name: "12. bookmark of a lecture under the wrong course",
    rejected: "INSERT INTO bookmarks (id, user_id, course_id, lesson_id) VALUES ('b1','u1','c_cpp','l_c_py')",
    constraint: FK,
    control: "INSERT INTO bookmarks (id, user_id, course_id, lesson_id) VALUES ('b1','u1','c_py','l_c_py')",
  },
  {
    name: "14. achievement from another course awarded",
    rejected: "INSERT INTO student_achievements (user_id, course_id, achievement_id) VALUES ('u1','c_py','a_c_cpp')",
    constraint: FK,
    control: "INSERT INTO student_achievements (user_id, course_id, achievement_id) VALUES ('u1','c_cpp','a_c_cpp')",
  },
  {
    name: "15. quiz answer for another course's question",
    setup: ["INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id) VALUES ('qa','c_py','q_c_py','u1')"],
    rejected: "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_py','qa','e_c_cpp')",
    constraint: FK,
    control: "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_py','qa','e_c_py')",
  },
  {
    name: "16. same, filed under the other course",
    setup: ["INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id) VALUES ('qa','c_py','q_c_py','u1')"],
    rejected: "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_cpp','qa','e_c_cpp')",
    constraint: FK,
    control: "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_py','qa','e_c_py')",
  },
  {
    name: "17. code submission under the wrong course",
    rejected:
      "INSERT INTO code_submissions (id, course_id, exercise_id, user_id, language, source) VALUES ('s','c_cpp','e_c_py','u1','python','x')",
    constraint: FK,
    control:
      "INSERT INTO code_submissions (id, course_id, exercise_id, user_id, language, source) VALUES ('s','c_py','e_c_py','u1','python','x')",
  },
];

const ruleChecks: RejectCase[] = [
  {
    name: "13. bookmark with two targets",
    rejected: "INSERT INTO bookmarks (id, user_id, course_id, lesson_id, quiz_id) VALUES ('b1','u1','c_cpp','l_c_cpp','q_c_cpp')",
    constraint: CHECK("(lesson_id IS NOT NULL) + (exercise_id IS NOT NULL)"),
    control: "INSERT INTO bookmarks (id, user_id, course_id, quiz_id) VALUES ('b1','u1','c_cpp','q_c_cpp')",
  },
  {
    name: "18. resource file stored outside its course's R2 folder",
    rejected:
      "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) " +
      "VALUES ('f','c_cpp','r_c_cpp','original','courses/c_py/resources/r/f.pptx','a.pptx','application/vnd.ms-powerpoint',10,'h')",
    constraint: CHECK("substr(r2_key, 1, length('courses/' || course_id || '/'))"),
    control:
      "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) " +
      "VALUES ('f','c_cpp','r_c_cpp','original','courses/c_cpp/resources/r_c_cpp/f.pptx','a.pptx','application/vnd.ms-powerpoint',10,'h')",
  },
  {
    name: "20. duplicate lecture slug inside one course",
    rejected: "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_y','c_cpp','t_c_cpp','for-loops','dup')",
    constraint: UNIQUE("lessons.course_id, lessons.slug"),
    control: "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_y','c_cpp','t_c_cpp','for-loops-2','ok')",
  },
  {
    name: "23. ad placement enabled without an ad unit id",
    rejected: "INSERT INTO ad_placements (id, placement_key, page_type, enabled) VALUES ('ad','lesson.after_first_section','lesson',1)",
    constraint: CHECK("enabled = 0 OR ad_unit_id IS NOT NULL"),
    control: "INSERT INTO ad_placements (id, placement_key, page_type, enabled) VALUES ('ad','lesson.after_first_section','lesson',0)",
  },
  {
    name: "24. write-the-code question set to auto-grading",
    rejected:
      "INSERT INTO exercises (id, course_id, slug, type, title, prompt_md, code, difficulty, grading_mode) " +
      "VALUES ('e_w','c_cpp','w','write_code','x','x','int main(){}','easy','auto')",
    constraint: CHECK("grading_mode <> 'auto' OR type IN ('mcq', 'trace')"),
    control:
      "INSERT INTO exercises (id, course_id, slug, type, title, prompt_md, code, difficulty, grading_mode) " +
      "VALUES ('e_w','c_cpp','w','write_code','x','x','int main(){}','easy','reference_review')",
  },
];

beforeAll(migrate);
beforeEach(resetAndSeed);

it("D1 enforces foreign keys", async () => {
  const row = await env.DB.prepare("PRAGMA foreign_keys").first<{ foreign_keys: number }>();
  expect(row?.foreign_keys).toBe(1);
});

describe("links across courses are rejected", () => {
  for (const c of crossCourse) {
    it(c.name, async () => {
      for (const sql of c.setup ?? []) await run(sql);
      expect(await errorOf(c.rejected)).toMatch(c.constraint);
      expect(await errorOf(c.control)).toBeNull();
    });
  }
});

describe("other database rules", () => {
  for (const c of ruleChecks) {
    it(c.name, async () => {
      for (const sql of c.setup ?? []) await run(sql);
      expect(await errorOf(c.rejected)).toMatch(c.constraint);
      expect(await errorOf(c.control)).toBeNull();
    });
  }
});

describe("things that must be allowed", () => {
  it("19. the same lecture slug in two different courses", async () => {
    // The Python version inserted a slug no other course used, so it didn't test this.
    await run("INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_a1','c_cpp','t_c_cpp','arrays','Arrays')");
    expect(
      await errorOf("INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_a2','c_py','t_c_py','arrays','Arrays')"),
    ).toBeNull();
    const { results } = await env.DB.prepare("SELECT course_id FROM lessons WHERE slug = 'arrays' ORDER BY course_id").all();
    expect(results.map((r) => r.course_id)).toEqual(["c_cpp", "c_py"]);
  });

  it("21. a question added to its own course's quiz", async () => {
    expect(await errorOf("INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_py')")).toBeNull();
  });

  it("22. a resource file inside its course folder", async () => {
    expect(
      await errorOf(
        "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) " +
          "VALUES ('f','c_cpp','r_c_cpp','original','courses/c_cpp/resources/r_c_cpp/f.pptx','a.pptx'," +
          "'application/vnd.openxmlformats-officedocument.presentationml.presentation',10,'h')",
      ),
    ).toBeNull();
  });
});

describe("deleting in one course leaves the others untouched", () => {
  it("25. deleting the Python course removes only Python content and progress", async () => {
    await run("INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_py')");
    await run("INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_py','l_c_py')");
    await run("INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_cpp','l_c_cpp')");
    await run("DELETE FROM courses WHERE id = 'c_py'");
    for (const table of ["topics", "lessons", "exercises", "quizzes", "resources", "quiz_questions", "student_progress"]) {
      const counts = await countsByCourse(table);
      expect(counts, table).not.toHaveProperty("c_py");
    }
    for (const table of ["topics", "lessons", "exercises", "quizzes", "resources"]) {
      expect(await countsByCourse(table), table).toEqual({ c_cpp: 1, c_cv: 1 });
    }
    expect(await countsByCourse("student_progress")).toEqual({ c_cpp: 1 });
  });

  it("26. a topic that still has lectures can't be deleted until they are moved", async () => {
    expect(await errorOf("DELETE FROM topics WHERE id = 't_c_cpp'")).toMatch(FK);
    // control: once its lecture and question move to another topic, the delete goes through
    await run("INSERT INTO topics (id, course_id, slug, title) VALUES ('t2','c_cpp','basics','Basics')");
    await run("UPDATE lessons SET topic_id = 't2' WHERE id = 'l_c_cpp'");
    expect(await errorOf("DELETE FROM topics WHERE id = 't_c_cpp'")).toBeNull();
  });

  it("27. deleting a topic unlinks its questions but keeps them in their course", async () => {
    await run("INSERT INTO topics (id, course_id, slug, title) VALUES ('t2','c_cpp','arrays','Arrays')");
    await run("UPDATE exercises SET topic_id = 't2' WHERE id = 'e_c_cpp'");
    await run("DELETE FROM topics WHERE id = 't2'");
    const row = await env.DB.prepare("SELECT course_id, topic_id FROM exercises WHERE id = 'e_c_cpp'").first();
    expect(row).toEqual({ course_id: "c_cpp", topic_id: null });
  });
});

describe("search", () => {
  it("28. search filtered to one course returns only that course", async () => {
    const insert = env.DB.prepare(
      "INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (?, 'lesson', ?, ?, ?, ?)",
    );
    await env.DB.batch([
      insert.bind("c_cpp", "l_c_cpp", "/courses/cpp/lectures/for-loops", "For loops in C++", "A for loop repeats a block"),
      insert.bind("c_py", "l_c_py", "/courses/python/lectures/for-loops", "For loops in Python", "A for loop goes over each item"),
    ]);
    const all = await env.DB.prepare("SELECT course_id FROM search_index WHERE search_index MATCH 'loop'").all();
    expect(all.results).toHaveLength(2); // control: both courses match without the filter
    const filtered = await env.DB.prepare(
      "SELECT course_id FROM search_index WHERE search_index MATCH 'loop' AND course_id = 'c_py'",
    ).all();
    expect(filtered.results).toEqual([{ course_id: "c_py" }]);
  });
});
