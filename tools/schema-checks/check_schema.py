"""Interim schema checks for CodeLab (run with python3 -I). Applies the D1 migration to SQLite
with foreign keys ON (as D1 does) and proves the course-separation rules hold.
Will be ported to the project's TypeScript test suite once npm is reachable."""
import sqlite3, sys, pathlib

MIG = pathlib.Path(sys.argv[1]).read_text()
results = []


def db():
    c = sqlite3.connect(":memory:")
    c.execute("PRAGMA foreign_keys = ON")
    c.executescript(MIG)
    seed(c)
    return c


def seed(c):
    for cid, slug, lang in [("c_cpp", "cpp", "cpp"), ("c_py", "python", "python"), ("c_cv", "computer-vision", "python")]:
        c.execute("INSERT INTO courses (id, slug, title, short_title, primary_language, status) VALUES (?,?,?,?,?, 'published')",
                  (cid, slug, slug.title(), slug, lang))
        c.execute("INSERT INTO topics (id, course_id, slug, title) VALUES (?,?,?,?)", (f"t_{cid}", cid, "loops", "Loops"))
        c.execute("INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES (?,?,?,?,?)", (f"l_{cid}", cid, f"t_{cid}", "for-loops", "For loops"))
        c.execute("INSERT INTO exercises (id, course_id, topic_id, lesson_id, slug, type, title, prompt_md, difficulty, grading_mode) "
                  "VALUES (?,?,?,?,?,'mcq','Q','What prints?','easy','auto')", (f"e_{cid}", cid, f"t_{cid}", f"l_{cid}", "q1"))
        c.execute("INSERT INTO quizzes (id, course_id, slug, title) VALUES (?,?,?,?)", (f"q_{cid}", cid, "quiz-1", "Quiz 1"))
        c.execute("INSERT INTO resources (id, course_id, slug, title, kind) VALUES (?,?,?,?, 'presentation')", (f"r_{cid}", cid, "lecture-1", "Lecture 1"))
        c.execute("INSERT INTO exam_templates (id, course_id, slug, title, time_limit_sec) VALUES (?,?,?,?,3600)", (f"x_{cid}", cid, "midterm", "Midterm"))
        c.execute("INSERT INTO achievements (id, course_id, slug, title) VALUES (?,?,?,?)", (f"a_{cid}", cid, "first-step", "First step"))
    c.execute("INSERT INTO users (id, email) VALUES ('u1', 'student@example.com')")
    c.commit()


def expect_ok(name, sql, args=()):
    c = db()
    try:
        c.execute(sql, args); c.commit(); results.append((True, name))
    except sqlite3.DatabaseError as e:
        results.append((False, f"{name}: unexpected error {e}"))


def expect_fail(name, sql, args=(), setup=()):
    c = db()
    for st in setup:
        c.execute(st)
    try:
        c.execute(sql, args); c.commit(); results.append((False, f"{name}: was ALLOWED"))
    except sqlite3.IntegrityError:
        results.append((True, name))


# --- course separation: links across courses are rejected -------------------------------------
expect_fail("lecture under another course's topic",
            "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_x','c_py','t_c_cpp','x','x')")
expect_fail("subtopic under another course's topic",
            "INSERT INTO topics (id, course_id, parent_topic_id, slug, title) VALUES ('t_x','c_py','t_c_cpp','x','x')")
expect_fail("C++ question in a Python quiz",
            "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_cpp')")
expect_fail("same, claiming the C++ course id",
            "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_cpp','q_c_py','e_c_cpp')")
expect_fail("PowerPoint from another course attached to a lecture",
            "INSERT INTO lesson_resources (course_id, lesson_id, resource_id) VALUES ('c_py','l_c_py','r_c_cv')")
expect_fail("related lecture from another course",
            "INSERT INTO lesson_relations (course_id, lesson_id, related_lesson_id) VALUES ('c_py','l_c_py','l_c_cpp')")
expect_fail("question linked to another course's lecture",
            "INSERT INTO exercises (id, course_id, lesson_id, slug, type, title, prompt_md, difficulty, grading_mode) "
            "VALUES ('e_x','c_cv','l_c_py','x','mcq','x','x','easy','auto')")
expect_fail("MCQ option attached under the wrong course",
            "INSERT INTO exercise_options (id, course_id, exercise_id, label_md) VALUES ('o_x','c_py','e_c_cpp','x')")
expect_fail("hint attached under the wrong course",
            "INSERT INTO exercise_hints (id, course_id, exercise_id, hint_md) VALUES ('h_x','c_cv','e_c_py','x')")
expect_fail("exam rule using another course's topic",
            "INSERT INTO exam_template_rules (id, course_id, exam_template_id, topic_id, question_count) VALUES ('xr','c_cpp','x_c_cpp','t_c_py',5)")
expect_fail("progress on a lecture recorded under the wrong course",
            "INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_cpp','l_c_py')")
expect_fail("bookmark of a lecture under the wrong course",
            "INSERT INTO bookmarks (id, user_id, course_id, lesson_id) VALUES ('b1','u1','c_cpp','l_c_py')")
expect_fail("bookmark with two targets",
            "INSERT INTO bookmarks (id, user_id, course_id, lesson_id, quiz_id) VALUES ('b1','u1','c_cpp','l_c_cpp','q_c_cpp')")
expect_fail("achievement from another course awarded",
            "INSERT INTO student_achievements (user_id, course_id, achievement_id) VALUES ('u1','c_py','a_c_cpp')")
expect_fail("quiz answer for another course's question",
            "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_py','qa','e_c_cpp')",
            setup=["INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id) VALUES ('qa','c_py','q_c_py','u1')"])
expect_fail("quiz answer filed under the other course to sneak past",
            "INSERT INTO quiz_responses (id, course_id, attempt_id, exercise_id) VALUES ('qr','c_cpp','qa','e_c_cpp')",
            setup=["INSERT INTO quiz_attempts (id, course_id, quiz_id, user_id) VALUES ('qa','c_py','q_c_py','u1')"])
expect_fail("code submission under the wrong course",
            "INSERT INTO code_submissions (id, course_id, exercise_id, user_id, language, source) VALUES ('s','c_cpp','e_c_py','u1','python','x')")
expect_fail("resource file stored outside its course's R2 folder",
            "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) "
            "VALUES ('f','c_cpp','r_c_cpp','original','courses/c_py/resources/r/f.pptx','a.pptx','application/vnd.ms-powerpoint',10,'h')")

# --- things that must be allowed -------------------------------------------------------------
expect_ok("same slug in two different courses",
          "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_y','c_cv','t_c_cv','while-loops','While')")
expect_fail("duplicate slug inside one course",
            "INSERT INTO lessons (id, course_id, topic_id, slug, title) VALUES ('l_y','c_cpp','t_c_cpp','for-loops','dup')")
expect_ok("question in its own course's quiz",
          "INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_py')")
expect_ok("resource file in its course folder",
          "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) "
          "VALUES ('f','c_cpp','r_c_cpp','original','courses/c_cpp/resources/r_c_cpp/f.pptx','a.pptx','application/vnd.openxmlformats-officedocument.presentationml.presentation',10,'h')")
expect_fail("ad placement enabled without a real unit id",
            "INSERT INTO ad_placements (id, placement_key, page_type, enabled) VALUES ('ad','lesson.after_first_section','lesson',1)")
expect_fail("auto-grading a write-the-code question",
            "INSERT INTO exercises (id, course_id, slug, type, title, prompt_md, code, difficulty, grading_mode) "
            "VALUES ('e_w','c_cpp','w','write_code','x','x','int main(){}','easy','auto')")

# --- deleting content in one course leaves the others untouched -------------------------------
c = db()
c.execute("INSERT INTO quiz_questions (course_id, quiz_id, exercise_id) VALUES ('c_py','q_c_py','e_c_py')")
c.execute("INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_py','l_c_py')")
c.execute("INSERT INTO student_progress (user_id, course_id, lesson_id) VALUES ('u1','c_cpp','l_c_cpp')")
c.commit()
try:
    c.execute("DELETE FROM courses WHERE id = 'c_py'"); c.commit()
    counts = {t: dict(c.execute(f"SELECT course_id, count(*) FROM {t} GROUP BY course_id").fetchall())
              for t in ["topics", "lessons", "exercises", "quizzes", "resources", "student_progress"]}
    ok = all("c_py" not in v and v.get("c_cpp") and v.get("c_cv", 1) for v in counts.values())
    results.append((ok, "deleting the Python course removes only Python content and progress"))
except sqlite3.DatabaseError as e:
    results.append((False, f"course delete failed: {e}"))

c = db()
try:
    c.execute("DELETE FROM topics WHERE id = 't_c_cpp'"); c.commit()
    results.append((False, "deleting a topic that still has lectures was ALLOWED"))
except sqlite3.IntegrityError:
    results.append((True, "a topic with lectures cannot be deleted until they are moved"))

c = db()
c.execute("INSERT INTO topics (id, course_id, slug, title) VALUES ('t2','c_cpp','arrays','Arrays')")
c.execute("UPDATE exercises SET topic_id = 't2' WHERE id = 'e_c_cpp'"); c.commit()
c.execute("DELETE FROM topics WHERE id = 't2'"); c.commit()
row = c.execute("SELECT course_id, topic_id FROM exercises WHERE id = 'e_c_cpp'").fetchone()
results.append((row == ("c_cpp", None), "deleting a topic unlinks its questions but keeps them in their course"))

# --- per-course search -------------------------------------------------------------------------
c = db()
c.executemany("INSERT INTO search_index (course_id, entity_type, entity_id, url, title, body) VALUES (?,?,?,?,?,?)", [
    ("c_cpp", "lesson", "l_c_cpp", "/courses/cpp/lectures/for-loops", "For loops in C++", "A for loop repeats a block"),
    ("c_py", "lesson", "l_c_py", "/courses/python/lectures/for-loops", "For loops in Python", "A for loop goes over each item"),
])
hits = c.execute("SELECT course_id FROM search_index WHERE search_index MATCH 'loop' AND course_id = 'c_py'").fetchall()
results.append((hits == [("c_py",)], "search filtered to one course returns only that course"))

bad = [r for r in results if not r[0]]
for ok, name in results:
    print(("PASS " if ok else "FAIL ") + name)
print(f"\n{len(results) - len(bad)} passed, {len(bad)} failed")
sys.exit(1 if bad else 0)
