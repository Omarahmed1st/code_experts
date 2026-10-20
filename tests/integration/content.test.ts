// Public content services and routes against the real seed (48 lessons).
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as mediaGET } from "@/app/(site)/courses/[course]/media/[lesson]/[file]/route";
import { GET as fileGET } from "@/app/(site)/courses/[course]/resources/[resource]/files/[role]/route";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getCourseOutline, getLesson, isPublicLessonImage, listLiveLessons } from "@/server/content/lessons";
import { getResource, listLessonResources, listResources } from "@/server/content/resources";
import { searchCourse } from "@/server/content/search";
import { type CourseScope, resolveCourse } from "@/server/courses/scope";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(loadRealSeed);

async function scope(slug: string): Promise<CourseScope> {
  const course = await resolveCourse(slug);
  if (!course) throw new Error(`no course ${slug}`);
  return course;
}

const PY = "programming-applications";
const CPP = "programming-fundamentals";
const CV = "computer-vision";
const STRINGS = "strings-indexing-and-slicing";
// The lectures in course order (lecture number, then file name), as content/*/lessons/ holds them.
const PY_LECTURES = [
  "what-is-programming-and-why-python", "variables-and-data-types", "input-processing-and-output",
  "numbers-operators-and-decisions", STRINGS, "string-operations-and-methods", "lists-storing-many-values",
  "strings-vs-lists-and-practice", "objects-and-methods", "graphics-windows-and-coordinates", "drawing-shapes",
  "colors-moving-and-text", "mouse-clicks", "graphics-practice-and-debugging",
];
const CV_LECTURES = [
  "what-is-computer-vision", "computer-vision-tasks-and-applications", "reading-and-showing-images",
  "digital-images-and-pixels", "grayscale-images", "resizing-images", "brightness-and-contrast", "smoothing-and-noise",
  "sharpening-images", "histogram-equalization", "enhancement-pipeline-and-challenge", "features-and-edges",
  "finding-corners", "orb-keypoints-and-descriptors", "feature-matching", "jetson-vision-vehicle", "live-camera-pipeline",
];

describe("lectures stay inside their course", () => {
  it("each course outline lists only its own lectures", async () => {
    const titles = async (slug: string) => (await getCourseOutline(await scope(slug))).flatMap((t) => t.lessons.map((l) => l.slug));
    expect(await titles(PY)).toEqual(PY_LECTURES);
    const cpp = await titles(CPP);
    expect(cpp).toEqual(expect.arrayContaining(["what-is-programming", "input-and-output-with-cout-and-cin", "for-loops"]));
    expect(cpp).not.toContain(STRINGS);
    expect(cpp).not.toContain("digital-images-and-pixels");
    // The outline follows the lecture order: Lecture 1 opens the course.
    expect(cpp[0]).toBe("what-is-programming");
    expect(await titles(CV)).toEqual(CV_LECTURES);
  });

  it("a lecture slug from another course is not found", async () => {
    expect(await getLesson(await scope(PY), STRINGS)).not.toBeNull();
    expect(await getLesson(await scope(CPP), STRINGS)).toBeNull();
    expect(await getLesson(await scope(CV), "for-loops")).toBeNull();
  });

  it("loads sections in order, with parsed annotations, related lectures and next/previous", async () => {
    const lesson = await getLesson(await scope(PY), STRINGS);
    expect(lesson?.topic.slug).toBe("strings");
    expect(lesson?.sections.length).toBeGreaterThanOrEqual(3);
    const runnable = lesson!.sections.find((s) => s.runnable)!;
    expect(runnable.codeLanguage).toBe("python");
    expect(Array.isArray(runnable.annotations?.notes)).toBe(true);
    expect(lesson?.previous?.slug).toBe("numbers-operators-and-decisions");
    expect(lesson?.next?.slug).toBe("string-operations-and-methods");
    expect(lesson?.related.map((r) => r.slug)).toContain("lists-storing-many-values");
    // The first lecture has no previous one, the last has no next one.
    expect((await getLesson(await scope(PY), PY_LECTURES[0]!))?.previous).toBeNull();
    expect((await getLesson(await scope(CV), CV_LECTURES.at(-1)!))?.next).toBeNull();
  });
});

describe("only live lectures are public", () => {
  const set = (sql: string) => env.DB.prepare(sql).run();

  it("hides drafts, and scheduled lectures until their time", async () => {
    const py = await scope(PY);
    await set(`UPDATE lessons SET status = 'draft' WHERE slug = '${STRINGS}'`);
    expect(await getLesson(py, STRINGS)).toBeNull();
    expect((await listLiveLessons(py)).map((l) => l.slug)).not.toContain(STRINGS);

    await set(`UPDATE lessons SET status = 'scheduled', publish_at = (unixepoch() + 3600) * 1000 WHERE slug = '${STRINGS}'`);
    expect(await getLesson(py, STRINGS)).toBeNull();

    await set(`UPDATE lessons SET publish_at = (unixepoch() - 60) * 1000 WHERE slug = '${STRINGS}'`);
    expect(await getLesson(py, STRINGS)).not.toBeNull();
  });

  it("a draft lecture's related link and next/previous disappear", async () => {
    const py = await scope(PY);
    await set("UPDATE lessons SET status = 'draft' WHERE slug = 'string-operations-and-methods'");
    const lesson = await getLesson(py, STRINGS);
    // next skips the draft, and the related list keeps only the live lecture.
    expect(lesson?.next?.slug).toBe("lists-storing-many-values");
    expect(lesson?.related.map((r) => r.slug)).toEqual(["lists-storing-many-values"]);
  });
});

describe("search", () => {
  it("returns only the searched course's pages", async () => {
    const py = await searchCourse(await scope(PY), "slicing");
    expect(py.length).toBeGreaterThan(0);
    for (const r of py) expect(r.url.startsWith(`/courses/${PY}/`)).toBe(true);
    expect(await searchCourse(await scope(CPP), "slicing")).toEqual([]);
  });

  it("matches word prefixes and survives odd input", async () => {
    const cpp = await scope(CPP);
    expect((await searchCourse(cpp, "semicol")).map((r) => r.url)).toContain(`/courses/${CPP}/lectures/for-loops`);
    expect(await searchCourse(cpp, '" OR * NEAR( )')).toBeInstanceOf(Array);
    expect(await searchCourse(cpp, "   ")).toEqual([]);
  });
});

// ---------- files ----------

async function imageOf(courseSlug: string, lessonSlug: string) {
  const row = await env.DB.prepare(
    `SELECT s.image_key AS key, l.id AS lessonId FROM lesson_sections s
       JOIN lessons l ON l.id = s.lesson_id JOIN courses c ON c.id = l.course_id
      WHERE c.slug = ? AND l.slug = ? AND s.image_key IS NOT NULL LIMIT 1`,
  )
    .bind(courseSlug, lessonSlug)
    .first<{ key: string; lessonId: string }>();
  if (!row) throw new Error("no image in seed");
  await env.FILES.put(row.key, new Uint8Array([137, 80, 78, 71, 1, 2, 3]), { httpMetadata: { contentType: "image/png" } });
  return { ...row, file: row.key.slice(row.key.lastIndexOf("/") + 1) };
}

const media = (course: string, lesson: string, file: string, headers?: HeadersInit) =>
  mediaGET(new Request(`http://x/courses/${course}/media/${lesson}/${file}`, { headers }), {
    params: Promise.resolve({ course, lesson, file }),
  });

describe("lecture images", () => {
  it("serves a live lecture's image with safe headers and caching", async () => {
    const img = await imageOf(CV, "digital-images-and-pixels");
    const res = await media(CV, img.lessonId, img.file);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/png");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("content-security-policy")).toContain("sandbox");
    expect(new Uint8Array(await res.arrayBuffer())).toHaveLength(7);

    const again = await media(CV, img.lessonId, img.file, { "If-None-Match": res.headers.get("etag")! });
    expect(again.status).toBe(304);
    const part = await media(CV, img.lessonId, img.file, { Range: "bytes=0-3" });
    expect(part.status).toBe(206);
    expect(part.headers.get("content-range")).toBe("bytes 0-3/7");
  });

  it("can't be reached through another course, a draft lecture or a made-up name", async () => {
    const img = await imageOf(CV, "digital-images-and-pixels");
    expect((await media(PY, img.lessonId, img.file)).status).toBe(404);
    expect((await media(CV, img.lessonId, "other.png")).status).toBe(404);
    expect((await media(CV, img.lessonId, "..%2Fx.png")).status).toBe(404);
    expect((await media(CV, img.lessonId, img.file.replace(".png", ".svg"))).status).toBe(404);
    await env.DB.prepare("UPDATE lessons SET status = 'draft' WHERE id = ?").bind(img.lessonId).run();
    expect(await isPublicLessonImage(await scope(CV), img.key)).toBe(false);
    expect((await media(CV, img.lessonId, img.file)).status).toBe(404);
  });
});

async function addResource(course: CourseScope, opts: { slug: string; access?: string; downloadable?: number; status?: string }) {
  const id = `res_${opts.slug.replace(/-/g, "")}`;
  const original = `courses/${course.courseId}/resources/${id}/original`;
  const preview = `courses/${course.courseId}/resources/${id}/preview`;
  const lesson = (await listLiveLessons(course))[0]!;
  await env.DB.batch([
    env.DB.prepare(
      "INSERT INTO resources (id, course_id, slug, title, kind, access, downloadable, status, description_md) VALUES (?, ?, ?, ?, 'presentation', ?, ?, ?, 'Slides for the first lecture.')",
    ).bind(id, course.courseId, opts.slug, `Slides ${opts.slug}`, opts.access ?? "public", opts.downloadable ?? 1, opts.status ?? "published"),
    env.DB.prepare(
      "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) VALUES (?, ?, ?, 'original', ?, 'Lecture 1.pptx', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 5, 'x')",
    ).bind(`${id}_o`, course.courseId, id, original),
    env.DB.prepare(
      "INSERT INTO resource_files (id, course_id, resource_id, role, r2_key, filename, content_type, size_bytes, sha256) VALUES (?, ?, ?, 'preview', ?, 'Lecture 1.pdf', 'application/pdf', 5, 'x')",
    ).bind(`${id}_p`, course.courseId, id, preview),
    env.DB.prepare("INSERT INTO lesson_resources (course_id, lesson_id, resource_id) VALUES (?, ?, ?)").bind(course.courseId, lesson.id, id),
  ]);
  await env.FILES.put(original, "pptx!");
  await env.FILES.put(preview, "%PDF!");
  return { id, lessonId: lesson.id };
}

const file = (course: string, resource: string, role: string) =>
  fileGET(new Request(`http://x/courses/${course}/resources/${resource}/files/${role}`), {
    params: Promise.resolve({ course, resource, role }),
  });

describe("resource files", () => {
  it("lists public resources, serves the preview inline and the original as a download", async () => {
    const py = await scope(PY);
    const { lessonId } = await addResource(py, { slug: "lecture-1-slides" });
    expect((await listResources(py)).map((r) => r.slug)).toEqual(["lecture-1-slides"]);
    expect((await listLessonResources(py, lessonId)).map((r) => r.slug)).toEqual(["lecture-1-slides"]);
    expect((await getResource(py, "lecture-1-slides"))?.lessons.length).toBe(1);

    const preview = await file(PY, "lecture-1-slides", "preview");
    expect(preview.status).toBe(200);
    expect(preview.headers.get("content-type")).toBe("application/pdf");
    expect(preview.headers.get("content-disposition")).toMatch(/^inline;/);
    const original = await file(PY, "lecture-1-slides", "original");
    expect(original.headers.get("content-type")).toBe("application/octet-stream");
    expect(original.headers.get("content-disposition")).toContain('attachment; filename="Lecture 1.pptx"');
    expect(await original.text()).toBe("pptx!");
  });

  it("hides other courses', private, draft and non-downloadable files", async () => {
    const py = await scope(PY);
    await addResource(py, { slug: "shared" });
    await addResource(py, { slug: "students-only", access: "students" });
    await addResource(py, { slug: "draft-one", status: "draft" });
    await addResource(py, { slug: "view-only", downloadable: 0 });
    expect((await file(CPP, "shared", "original")).status).toBe(404);
    expect((await file(PY, "students-only", "preview")).status).toBe(404);
    expect((await file(PY, "draft-one", "preview")).status).toBe(404);
    expect((await file(PY, "view-only", "original")).status).toBe(404);
    expect((await file(PY, "view-only", "preview")).status).toBe(200);
    expect((await file(PY, "shared", "secret")).status).toBe(404);
    expect((await listResources(py)).map((r) => r.slug).sort()).toEqual(["shared", "view-only"]);
    expect(await listResources(await scope(CPP))).toEqual([]);
  });
});

describe("sitemap and robots", () => {
  it("block everything outside production", async () => {
    expect(await sitemap()).toEqual([]);
    expect(robots().rules).toEqual({ userAgent: "*", disallow: "/" });
  });

  it("in production list courses, topics with lectures and live lectures only", async () => {
    const vars = env as unknown as Record<string, string>;
    const before = vars.APP_ENV;
    vars.APP_ENV = "production";
    try {
      await env.DB.prepare(`UPDATE lessons SET status = 'draft' WHERE slug = 'for-loops'`).run();
      const urls = (await sitemap()).map((e) => e.url.replace("http://localhost:5173", ""));
      expect(urls).toContain(`/courses/${PY}/lectures/${STRINGS}`);
      expect(urls).toContain(`/courses/${PY}/topics/strings`);
      expect(urls).not.toContain(`/courses/${CPP}/lectures/for-loops`);
      expect(urls).toContain(`/courses/${CV}/topics/jetson-projects`);
      expect(urls).not.toContain(`/courses/${CV}/topics/image-transformations`);
      expect(urls.filter((u) => u.includes("/search") || u.includes("/resources"))).toEqual([]);
      expect(robots().sitemap).toBe("http://localhost:5173/sitemap.xml");
    } finally {
      vars.APP_ENV = before!;
    }
  });
});
