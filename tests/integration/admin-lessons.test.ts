// Topic and lecture admin services against the real seed: saving round-trips,
// roles, course isolation, history and the audit log.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { deleteLesson, getLessonForEdit, listLessons, reorderLessons, saveLesson, setLessonStatus } from "@/server/admin/lessons";
import { deleteTopic, listTopics, saveTopic } from "@/server/admin/topics";
import { getLesson } from "@/server/content/lessons";
import { searchCourse } from "@/server/content/search";
import { resolveCourse } from "@/server/courses/scope";
import { CPP, CV, PY, auditActions, course, lessonIdBySlug, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(async () => {
  await env.DB.prepare("DELETE FROM users").run();
  await env.DB.prepare("DELETE FROM admin_audit_logs").run();
  await loadRealSeed();
});

const STRINGS = "strings-indexing-and-slicing";

describe("lectures", () => {
  it("saving a seeded lecture unchanged keeps what students see", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const id = await lessonIdBySlug(py.id, STRINGS);
    const scope = (await resolveCourse(PY))!;
    const before = await getLesson(scope, STRINGS);
    const loaded = await getLessonForEdit(py, id);
    expect(loaded?.draft.sections.length).toBe(before?.sections.length);

    const result = await saveLesson(admin, py, id, loaded!.draft);
    expect(result).toMatchObject({ ok: true });
    const after = await getLesson(scope, STRINGS);
    expect(after?.sections.map((s) => [s.kind, s.title, s.code, s.expectedOutput, s.sampleInput])).toEqual(
      before?.sections.map((s) => [s.kind, s.title, s.code, s.expectedOutput, s.sampleInput]),
    );
    expect(after?.sections.map((s) => s.annotations)).toEqual(before?.sections.map((s) => s.annotations));
    expect(after?.sections.map((s) => s.id)).toEqual(before?.sections.map((s) => s.id));
    expect(after?.related.map((r) => r.slug)).toEqual(before?.related.map((r) => r.slug));

    const revisions = await env.DB.prepare("SELECT revision_no FROM content_revisions WHERE entity_id = ?").bind(id).all();
    expect(revisions.results).toHaveLength(1);
    expect(await auditActions(py.id)).toEqual(["lesson.update"]);
  });

  it("creates a draft lecture that students and search can't see until it is published", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const [topic] = await listTopics(py);
    const draft = {
      title: "Dictionaries",
      slug: "dictionaries",
      topicId: topic!.id,
      lectureNumber: 9,
      difficulty: "easy",
      description: "Store values under names you choose.",
      objectives: ["Make a dictionary"],
      prerequisites: [],
      relatedIds: [],
      resourceIds: [],
      status: "draft",
      publishAt: null,
      sections: [
        { id: null, kind: "explanation", title: "Keys and values", bodyMd: "A dictionary maps **keys** to values.", program: null, image: null },
        {
          id: null,
          kind: "example",
          title: "A tiny phone book",
          bodyMd: "Look a name up.",
          program: { language: "python", code: 'book = {"Ali": 5}\nprint(book["Ali"])', runnable: true, input: "", output: "5", notes: "", strips: "" },
          image: null,
        },
        { id: null, kind: "summary", title: "Summary", bodyMd: "Dictionaries find values by key.", program: null, image: null },
      ],
    };
    const created = await saveLesson(admin, py, null, draft);
    expect(created).toMatchObject({ ok: true });
    const scope = (await resolveCourse(PY))!;
    expect(await getLesson(scope, "dictionaries")).toBeNull();
    expect((await searchCourse(scope, "phone book")).some((r) => r.url.endsWith("/dictionaries"))).toBe(false);

    const id = created.ok ? created.value.id : "";
    expect(await setLessonStatus(admin, py, id, "published", null)).toMatchObject({ ok: true });
    const live = await getLesson(scope, "dictionaries");
    expect(live?.sections[1]?.expectedOutput).toBe("5\n");
    expect((await searchCourse(scope, "dictionary")).some((r) => r.url.endsWith("/dictionaries"))).toBe(true);
    expect(await auditActions(py.id)).toEqual(["lesson.create", "lesson.publish"]);
  });

  it("refuses a slug another lecture in the course uses, but allows it in another course", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const cv = await course(CV);
    const id = await lessonIdBySlug(py.id, "lists-storing-many-values");
    const loaded = (await getLessonForEdit(py, id))!;
    const clash = await saveLesson(admin, py, id, { ...loaded.draft, slug: STRINGS });
    expect(clash).toMatchObject({ ok: false, fieldErrors: { slug: expect.stringMatching(/already uses/) } });

    const cvId = await lessonIdBySlug(cv.id, "brightness-and-contrast");
    const cvLoaded = (await getLessonForEdit(cv, cvId))!;
    expect(await saveLesson(admin, cv, cvId, { ...cvLoaded.draft, slug: STRINGS })).toMatchObject({ ok: true });
  });

  it("keeps courses apart: another course's lecture, topic or file can't be used", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const cpp = await course(CPP);
    const pyId = await lessonIdBySlug(py.id, STRINGS);
    expect(await getLessonForEdit(cpp, pyId)).toBeNull();
    expect(await saveLesson(admin, cpp, pyId, (await getLessonForEdit(py, pyId))!.draft)).toMatchObject({ ok: false });
    expect(await deleteLesson(admin, cpp, pyId)).toMatchObject({ ok: false });

    const [cppTopic] = await listTopics(cpp);
    const loaded = (await getLessonForEdit(py, pyId))!;
    const crossTopic = await saveLesson(admin, py, pyId, { ...loaded.draft, topicId: cppTopic!.id });
    expect(crossTopic).toMatchObject({ ok: false, fieldErrors: { topicId: expect.any(String) } });

    const cppLesson = (await listLessons(cpp))[0]!;
    const crossRelated = await saveLesson(admin, py, pyId, { ...loaded.draft, relatedIds: [cppLesson.id] });
    expect(crossRelated).toMatchObject({ ok: false });
  });

  it("editors edit but can't publish or delete; editors of another course can't touch it", async () => {
    const py = await course(PY);
    const cpp = await course(CPP);
    const editor = await makeStaff("ed1", "editor", { [py.id]: "editor" });
    const id = await lessonIdBySlug(py.id, STRINGS);
    const loaded = (await getLessonForEdit(py, id))!;
    expect(loaded.draft.status).toBe("published");

    const saved = await saveLesson(editor, py, id, { ...loaded.draft, title: "Strings, edited", status: "draft" });
    expect(saved).toMatchObject({ ok: true });
    const row = await env.DB.prepare("SELECT title, status FROM lessons WHERE id = ?").bind(id).first();
    expect(row).toEqual({ title: "Strings, edited", status: "published" });

    expect(await setLessonStatus(editor, py, id, "draft", null)).toMatchObject({ ok: false });
    expect(await deleteLesson(editor, py, id)).toMatchObject({ ok: false });

    const cppId = (await listLessons(cpp))[0]!.id;
    expect(await saveLesson(editor, cpp, cppId, (await getLessonForEdit(cpp, cppId))!.draft)).toMatchObject({ ok: false });
  });

  it("a live lecture needs at least three sections; a draft may have fewer", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const id = await lessonIdBySlug(py.id, STRINGS);
    const loaded = (await getLessonForEdit(py, id))!;
    const short = { ...loaded.draft, sections: loaded.draft.sections.slice(0, 2) };
    expect(await saveLesson(admin, py, id, short)).toMatchObject({ ok: false });
    expect(await saveLesson(admin, py, id, { ...short, status: "draft" })).toMatchObject({ ok: true });
  });

  it("reorders and deletes, with each step in the audit log", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const ids = (await listLessons(cv)).map((l) => l.id);
    expect(await reorderLessons(admin, cv, [...ids].reverse())).toMatchObject({ ok: true });
    expect((await listLessons(cv)).map((l) => l.id)).toEqual([...ids].reverse());
    expect(await reorderLessons(admin, cv, ids.slice(1))).toMatchObject({ ok: false });

    expect(await deleteLesson(admin, cv, ids[0]!)).toMatchObject({ ok: true });
    expect((await listLessons(cv)).map((l) => l.id)).toEqual([...ids].reverse().slice(0, -1));
    expect(await auditActions(cv.id)).toEqual(["lesson.reorder", "lesson.delete"]);
  });
});

describe("topics", () => {
  it("adds, renames and deletes topics, refusing to delete one that has lectures", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const withLectures = (await listTopics(cv)).find((t) => t.lectures > 0);
    expect(await deleteTopic(admin, cv, withLectures!.id)).toMatchObject({ ok: false, error: expect.stringMatching(/lecture/) });

    const added = await saveTopic(admin, cv, null, { title: "Edges", slug: "edges", description: "Finding edges.", status: "published" });
    expect(added).toMatchObject({ ok: true });
    const clash = await saveTopic(admin, cv, null, { title: "Edges again", slug: "edges", status: "draft" });
    expect(clash).toMatchObject({ ok: false, fieldErrors: { slug: expect.any(String) } });
    const id = added.ok ? added.value.id : "";
    expect(await deleteTopic(admin, cv, id)).toMatchObject({ ok: true });
  });

  it("new topics from an editor start as drafts", async () => {
    const cv = await course(CV);
    const editor = await makeStaff("ed1", "editor", { [cv.id]: "editor" });
    const added = await saveTopic(editor, cv, null, { title: "Edges", slug: "edges", status: "published" });
    expect(added).toMatchObject({ ok: true });
    const row = await env.DB.prepare("SELECT status FROM topics WHERE course_id = ? AND slug = 'edges'").bind(cv.id).first();
    expect(row).toEqual({ status: "draft" });
  });
});
