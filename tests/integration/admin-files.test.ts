// File uploads to R2 (course files and lecture pictures), course settings and
// staff accounts, against the real seed.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { GET as fileGET } from "@/app/(site)/courses/[course]/resources/[resource]/files/[role]/route";
import { createCourse, deleteCourse, setCourseStatus, updateCourse } from "@/server/admin/course-settings";
import { getAdminCourse } from "@/server/admin/courses";
import { getLessonForEdit, saveLesson, uploadLessonImage } from "@/server/admin/lessons";
import { deleteResource, getAdminResource, removeResourceFile, saveResource, uploadResourceFile } from "@/server/admin/resources";
import { changeOwnPassword, createStaff, listStaff, mustChangePassword, resetStaffPassword, setStaffActive, updateStaff } from "@/server/admin/users";
import { signIn } from "@/server/auth/sign-in";
import { searchCourse } from "@/server/content/search";
import { resolveCourse } from "@/server/courses/scope";
import { getSeoOverride } from "@/server/seo";
import { CPP, CV, PY, auditActions, course, lessonIdBySlug, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(async () => {
  await env.DB.batch([env.DB.prepare("DELETE FROM users"), env.DB.prepare("DELETE FROM admin_audit_logs"), env.DB.prepare("DELETE FROM rate_limits")]);
  await loadRealSeed();
});

/** A stored (uncompressed) zip with these file names; CRCs are left 0, which our reader doesn't check. */
function zip(names: string[]): Uint8Array {
  const enc = new TextEncoder();
  const local: number[] = [];
  const central: number[] = [];
  const u16 = (n: number) => [n & 0xff, (n >> 8) & 0xff];
  const u32 = (n: number) => [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff];
  for (const name of names) {
    const bytes = [...enc.encode(name)];
    const data = [...enc.encode("<x/>")];
    const offset = local.length;
    local.push(...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(data.length), ...u32(data.length), ...u16(bytes.length), ...u16(0), ...bytes, ...data);
    central.push(...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(data.length), ...u32(data.length), ...u16(bytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0), ...u32(0), ...u32(offset), ...bytes);
  }
  const end = [...u32(0x06054b50), ...u16(0), ...u16(0), ...u16(names.length), ...u16(names.length), ...u32(central.length), ...u32(local.length), ...u16(0)];
  return new Uint8Array([...local, ...central, ...end]);
}

const PPTX = () => zip(["[Content_Types].xml", "ppt/presentation.xml", "ppt/slides/slide1.xml"]);
const PDF = () => new TextEncoder().encode("%PDF-1.7\n1 0 obj << >> endobj\ntrailer << >>\n%%EOF\n");
const PNG = (w: number, h: number) => {
  const b = new Uint8Array(64);
  b.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52]);
  new DataView(b.buffer).setUint32(16, w);
  new DataView(b.buffer).setUint32(20, h);
  return b;
};

function upload(bytes: Uint8Array): Request {
  return new Request("http://localhost/upload", { method: "POST", body: bytes, headers: { "content-length": String(bytes.length), origin: "http://localhost" } });
}

describe("course files", () => {
  it("uploads slides and a preview to the course's own folder, publishes, serves and deletes them", async () => {
    const admin = await makeStaff("admin1", "admin");
    const py = await course(PY);
    const created = await saveResource(admin, py, null, { title: "Lecture 1 slides", slug: "lecture-1-slides", kind: "presentation", access: "public", downloadable: true, status: "published" });
    expect(created).toMatchObject({ ok: false, error: expect.stringMatching(/Upload the file/) });
    const draft = await saveResource(admin, py, null, { title: "Lecture 1 slides", slug: "lecture-1-slides", kind: "presentation", access: "public", downloadable: true, status: "draft" });
    const id = draft.ok ? draft.value.id : "";

    // Not a presentation: refused by its bytes, whatever its name says.
    expect(await uploadResourceFile(admin, py, id, "original", upload(PNG(10, 10)), "slides.pptx")).toMatchObject({ ok: false, error: expect.stringMatching(/isn't accepted/) });
    // A zip without PowerPoint's parts isn't a .pptx.
    expect(await uploadResourceFile(admin, py, id, "original", upload(zip(["a.txt"])), "slides.pptx")).toMatchObject({ ok: false });
    // Macro files are refused.
    expect(await uploadResourceFile(admin, py, id, "original", upload(zip(["[Content_Types].xml", "ppt/presentation.xml", "ppt/vbaProject.bin"])), "s.pptm")).toMatchObject({ ok: false, error: expect.stringMatching(/macros/) });

    const up = await uploadResourceFile(admin, py, id, "original", upload(PPTX()), "Lecture 1 <slides>.pptx");
    expect(up).toMatchObject({ ok: true, value: { filename: "Lecture 1 -slides.pptx", contentType: expect.stringContaining("presentationml") } });
    expect(await uploadResourceFile(admin, py, id, "preview", upload(PDF()), "preview.pdf")).toMatchObject({ ok: true });
    const listed = await env.FILES.list({ prefix: `courses/${py.id}/resources/${id}/` });
    expect(listed.objects).toHaveLength(2);
    const row = await env.DB.prepare("SELECT sha256 FROM resource_files WHERE resource_id = ? AND role = 'original'").bind(id).first<{ sha256: string }>();
    const expected = [...new Uint8Array(await crypto.subtle.digest("SHA-256", PPTX()))].map((b) => b.toString(16).padStart(2, "0")).join("");
    expect(row?.sha256).toBe(expected);

    // Replacing removes the old object.
    expect(await uploadResourceFile(admin, py, id, "original", upload(PPTX()), "v2.pptx")).toMatchObject({ ok: true, message: "File replaced." });
    expect((await env.FILES.list({ prefix: `courses/${py.id}/resources/${id}/` })).objects).toHaveLength(2);

    expect(await saveResource(admin, py, id, { title: "Lecture 1 slides", slug: "lecture-1-slides", kind: "presentation", access: "public", downloadable: true, status: "published" })).toMatchObject({ ok: true });
    const response = await fileGET(new Request("http://localhost/x"), { params: Promise.resolve({ course: PY, resource: "lecture-1-slides", role: "original" }) });
    expect(response.status).toBe(200);
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(PPTX());
    expect((await searchCourse((await resolveCourse(PY))!, "slides")).some((r) => r.url.endsWith("/lecture-1-slides"))).toBe(true);

    expect(await removeResourceFile(admin, py, id, "preview")).toMatchObject({ ok: true });
    expect(await deleteResource(admin, py, id)).toMatchObject({ ok: true });
    expect((await env.FILES.list({ prefix: `courses/${py.id}/resources/${id}/` })).objects).toHaveLength(0);
    expect(await auditActions(py.id)).toEqual(["resource.create", "resource.upload", "resource.upload", "resource.replace_file", "resource.publish", "resource.remove_file", "resource.delete"]);
  });

  it("refuses files that are too big before reading them, and staff-only files are never public", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const made = await saveResource(admin, cv, null, { title: "Pixel chart", slug: "pixel-chart", kind: "image", access: "staff", status: "draft" });
    const id = made.ok ? made.value.id : "";
    const huge = new Request("http://localhost/upload", { method: "POST", body: PNG(5, 5), headers: { "content-length": String(11 * 1024 * 1024) } });
    expect(await uploadResourceFile(admin, cv, id, "original", huge, "big.png")).toMatchObject({ ok: false, error: expect.stringMatching(/too big/) });
    expect(await uploadResourceFile(admin, cv, id, "original", upload(PNG(5, 5)), "chart.png")).toMatchObject({ ok: true });
    expect(await saveResource(admin, cv, id, { title: "Pixel chart", slug: "pixel-chart", kind: "image", access: "staff", status: "published" })).toMatchObject({ ok: true });
    const response = await fileGET(new Request("http://localhost/x"), { params: Promise.resolve({ course: CV, resource: "pixel-chart", role: "original" }) });
    expect(response.status).toBe(404);
    expect((await getAdminResource(cv, id))?.access).toBe("staff");
  });

  it("editors upload but can't publish or delete; another course's file can't be reached", async () => {
    const cv = await course(CV);
    const py = await course(PY);
    const admin = await makeStaff("admin1", "admin");
    const editor = await makeStaff("ed1", "editor", { [cv.id]: "editor" });
    const made = await saveResource(editor, cv, null, { title: "Handout", slug: "handout", kind: "pdf", status: "published" });
    expect(made).toMatchObject({ ok: true });
    const id = made.ok ? made.value.id : "";
    expect((await getAdminResource(cv, id))?.status).toBe("draft");
    expect(await uploadResourceFile(editor, cv, id, "original", upload(PDF()), "h.pdf")).toMatchObject({ ok: true });
    expect(await deleteResource(editor, cv, id)).toMatchObject({ ok: false });
    expect(await uploadResourceFile(admin, py, id, "original", upload(PDF()), "h.pdf")).toMatchObject({ ok: false });
    expect(await getAdminResource(py, id)).toBeNull();
  });
});

describe("lecture pictures", () => {
  it("uploads a measured picture under the lecture's folder and uses it in a section", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const id = await lessonIdBySlug(cv.id, "digital-images-and-pixels");
    const up = await uploadLessonImage(admin, cv, id, upload(PNG(640, 480)), "grid.png");
    expect(up).toMatchObject({ ok: true, value: { width: 640, height: 480, key: expect.stringMatching(new RegExp(`^courses/${cv.id}/lessons/${id}/img-[a-f0-9]+\\.png$`)) } });
    const key = up.ok ? up.value.key : "";
    const loaded = (await getLessonForEdit(cv, id))!;
    loaded.draft.sections[0] = { ...loaded.draft.sections[0]!, kind: "diagram", image: { key, width: 640, height: 480, alt: "A grid of pixels" } };
    expect(await saveLesson(admin, cv, id, loaded.draft)).toMatchObject({ ok: true });
    // Another lecture's folder is refused.
    const other = await lessonIdBySlug(cv.id, "brightness-and-contrast");
    const otherLoaded = (await getLessonForEdit(cv, other))!;
    otherLoaded.draft.sections[0] = { ...otherLoaded.draft.sections[0]!, kind: "diagram", image: { key, width: 640, height: 480, alt: "Stolen picture" } };
    expect(await saveLesson(admin, cv, other, otherLoaded.draft)).toMatchObject({ ok: false });
    expect(await uploadLessonImage(admin, cv, id, upload(PNG(7000, 10)), "wide.png")).toMatchObject({ ok: false, error: expect.stringMatching(/6000/) });
    expect(await uploadLessonImage(admin, cv, id, upload(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>")), "x.svg")).toMatchObject({ ok: false });
  });
});

describe("course settings", () => {
  it("administrators create a draft course, rename it (search addresses follow) and set its search title", async () => {
    const admin = await makeStaff("admin1", "admin");
    const created = await createCourse(admin, { title: "Data Structures", shortTitle: "Data Structures", slug: "data-structures", description: "Lists, stacks, queues and trees, built and used step by step.", primaryLanguage: "cpp" });
    expect(created).toMatchObject({ ok: true });
    expect(await resolveCourse("data-structures")).toBeNull();
    const ds = (await getAdminCourse("data-structures"))!;
    expect(await setCourseStatus(admin, ds, "published")).toMatchObject({ ok: false, error: expect.stringMatching(/lecture/) });

    const py = await course(PY);
    const renamed = await updateCourse(admin, py, { ...py, slug: "python-applications", tags: py.tags.join(","), seoTitle: "Learn Python by building", seoDescription: "" });
    expect(renamed).toMatchObject({ ok: true });
    const scope = (await resolveCourse("python-applications"))!;
    const hits = await searchCourse(scope, "strings");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.every((h) => h.url.startsWith("/courses/python-applications/"))).toBe(true);
    expect(await getSeoOverride("/courses/python-applications")).toMatchObject({ title: "Learn Python by building" });
  });

  it("course admins edit details but can't rename, publish or delete; deleting needs archive and the typed slug", async () => {
    const cv = await course(CV);
    const admin = await makeStaff("admin1", "admin");
    const courseAdmin = await makeStaff("ca1", "editor", { [cv.id]: "course_admin" });
    expect(await updateCourse(courseAdmin, cv, { ...cv, tags: "", slug: "renamed", title: "Computer Vision basics" })).toMatchObject({ ok: true });
    expect((await getAdminCourse(CV))?.title).toBe("Computer Vision basics");
    expect(await setCourseStatus(courseAdmin, cv, "archived")).toMatchObject({ ok: false });
    expect(await deleteCourse(courseAdmin, cv, CV)).toMatchObject({ ok: false });

    expect(await deleteCourse(admin, cv, CV)).toMatchObject({ ok: false, error: expect.stringMatching(/Archive/) });
    expect(await setCourseStatus(admin, cv, "archived")).toMatchObject({ ok: true });
    const archived = (await getAdminCourse(CV))!;
    expect(await resolveCourse(CV)).toBeNull();
    expect(await deleteCourse(admin, archived, "computer")).toMatchObject({ ok: false });
    expect(await deleteCourse(admin, archived, CV)).toMatchObject({ ok: true });
    expect(await getAdminCourse(CV)).toBeNull();
    const left = await env.DB.prepare("SELECT (SELECT count(*) FROM exercises WHERE course_id = ?1) + (SELECT count(*) FROM lessons WHERE course_id = ?1) AS n").bind(cv.id).first<{ n: number }>();
    expect(left?.n).toBe(0);
    // Other courses are untouched.
    expect(await resolveCourse(CPP)).not.toBeNull();
  });
});

describe("staff accounts", () => {
  it("creates an editor with a temporary password that works once and must be changed", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const made = await createStaff(admin, { name: "Sara Editor", email: "Sara@Example.com", siteRole: "editor", courseRoles: { [cv.id]: "editor" } });
    expect(made).toMatchObject({ ok: true, value: { email: "sara@example.com", temporaryPassword: expect.stringMatching(/^[A-Za-z2-9]{4}(-[A-Za-z2-9]{4}){3}$/) } });
    if (!made.ok) return;
    expect(await createStaff(admin, { name: "Again", email: "sara@example.com", siteRole: "admin" })).toMatchObject({ ok: false });
    const session = await signIn({ email: "sara@example.com", password: made.value.temporaryPassword, turnstileToken: null, ip: "198.51.100.1", userAgent: "test" });
    expect(session).toMatchObject({ ok: true });
    expect(await mustChangePassword(made.value.id)).toBe(true);

    const sara = { staff: { id: made.value.id, email: "sara@example.com", name: "Sara Editor", siteRoles: ["editor" as const], courseRoles: { [cv.id]: "editor" as const } }, ip: null };
    expect(await changeOwnPassword(sara, "none", { currentPassword: "wrong", newPassword: "a long new passphrase", confirmPassword: "a long new passphrase" })).toMatchObject({ ok: false, fieldErrors: { currentPassword: expect.any(String) } });
    expect(await changeOwnPassword(sara, "none", { currentPassword: made.value.temporaryPassword, newPassword: "a long new passphrase", confirmPassword: "a long new passphrase" })).toMatchObject({ ok: true });
    expect(await mustChangePassword(made.value.id)).toBe(false);
    expect(await signIn({ email: "sara@example.com", password: made.value.temporaryPassword, turnstileToken: null, ip: "198.51.100.1", userAgent: "test" })).toMatchObject({ ok: false });

    const reset = await resetStaffPassword(admin, made.value.id);
    expect(reset).toMatchObject({ ok: true });
    expect(await setStaffActive(admin, made.value.id, false)).toMatchObject({ ok: true });
    if (reset.ok) expect(await signIn({ email: "sara@example.com", password: reset.value.temporaryPassword, turnstileToken: null, ip: "198.51.100.1", userAgent: "test" })).toMatchObject({ ok: false });
  });

  it("never leaves the site without an administrator, and editors can't manage accounts", async () => {
    const admin = await makeStaff("admin1", "admin");
    const cv = await course(CV);
    const editor = await makeStaff("ed1", "editor", { [cv.id]: "editor" });
    expect(await updateStaff(admin, "admin1", { name: "Admin", siteRole: "editor", courseRoles: { [cv.id]: "editor" } })).toMatchObject({ ok: false });
    expect(await setStaffActive(admin, "admin1", false)).toMatchObject({ ok: false });
    expect(await createStaff(editor, { name: "Sneaky", email: "s@example.com", siteRole: "admin" })).toMatchObject({ ok: false });
    expect(await updateStaff(editor, "ed1", { name: "ed1", siteRole: "admin" })).toMatchObject({ ok: false });
    expect(await updateStaff(admin, "ed1", { name: "Editor One", siteRole: "editor", courseRoles: { [cv.id]: "course_admin" } })).toMatchObject({ ok: true });
    expect((await listStaff()).find((s) => s.id === "ed1")?.courseRoles).toEqual([{ courseId: cv.id, courseTitle: expect.any(String), role: "course_admin" }]);
  });
});
