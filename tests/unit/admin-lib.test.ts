// Pure admin helpers: who may do what, file sniffing, the question check, sign-in redirects.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { blankExercise, checkExercise, checkExerciseMarkdown, readExerciseInput } from "@/lib/admin/exercise-draft";
import { type Staff, accountTitle, can, canOpenAdmin, canSite, roleInCourse, visibleCourseIds } from "@/lib/auth/permissions";
import { passwordProblem } from "@/lib/auth/password";
import { looksLikeToken, safeNextPath } from "@/lib/auth/session-token";
import { centralDirectoryNames, findCentralDirectory, imageSize, officeKind, safeFileName, sniffFormat } from "@/lib/files/sniff";

const staff = (siteRoles: Staff["siteRoles"], courseRoles: Staff["courseRoles"] = {}): Staff => ({ id: "u", email: "u@example.com", name: "U", siteRoles, courseRoles });

describe("permissions", () => {
  it("administrators can do everything in every course", () => {
    const admin = staff(["admin"]);
    for (const action of ["view", "edit", "publish", "delete", "settings"] as const) expect(can(admin, action, "c_any")).toBe(true);
    expect(canSite(admin, "manageUsers")).toBe(true);
    expect(visibleCourseIds(admin)).toBeNull();
  });

  it("editors work only in their courses; only course admins publish and delete", () => {
    const ed = staff(["editor"], { c1: "editor", c2: "course_admin" });
    expect([can(ed, "view", "c1"), can(ed, "edit", "c1"), can(ed, "publish", "c1"), can(ed, "delete", "c1")]).toEqual([true, true, false, false]);
    expect([can(ed, "publish", "c2"), can(ed, "delete", "c2"), can(ed, "settings", "c2")]).toEqual([true, true, true]);
    expect(can(ed, "view", "c3")).toBe(false);
    expect(roleInCourse(ed, "c3")).toBeNull();
    expect(canSite(ed, "manageUsers")).toBe(false);
    expect(visibleCourseIds(ed)?.sort()).toEqual(["c1", "c2"]);
  });

  it("students and editors without a course can't open the admin", () => {
    expect(canOpenAdmin(staff(["student"]))).toBe(false);
    expect(canOpenAdmin(staff(["editor"]))).toBe(false);
    expect(can(staff(["student"], { c1: "course_admin" }), "view", "c1")).toBe(false);
  });

  it("gives every account the title the header shows next to its name", () => {
    expect(accountTitle(staff(["admin"]))).toBe("Administrator");
    expect(accountTitle(staff(["admin", "editor"], { c1: "editor" }))).toBe("Administrator");
    expect(accountTitle(staff(["editor"], { c1: "editor", c2: "course_admin" }))).toBe("Course admin");
    expect(accountTitle(staff(["editor"], { c1: "editor" }))).toBe("Editor");
    expect(accountTitle(staff(["student"]))).toBe("Student");
    expect(accountTitle(staff([]))).toBe("Student");
    // Course roles count only for editors, as in can().
    expect(accountTitle(staff(["student"], { c1: "course_admin" }))).toBe("Student");
  });
});

describe("sign-in helpers", () => {
  it("only sends people back to paths on this site", () => {
    expect(safeNextPath("/admin/courses/cpp")).toBe("/admin/courses/cpp");
    for (const bad of ["https://evil.example", "//evil.example", "/\\evil.example", "/login", "/admin\u0000", 5, undefined]) expect(safeNextPath(bad)).toBe("/admin");
  });

  it("checks token shape and password rules", () => {
    expect(looksLikeToken("a".repeat(43))).toBe(true);
    expect(looksLikeToken("a".repeat(42))).toBe(false);
    expect(passwordProblem("short")).toMatch(/at least/);
    expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/repeats/);
    expect(passwordProblem("omar.ahmed-2026!", "omar.ahmed@example.com")).toMatch(/email/);
    expect(passwordProblem("three words here")).toBeNull();
  });
});

describe("file sniffing", () => {
  const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(64).fill(0)]);
  it("goes by the bytes, not the name", () => {
    expect(sniffFormat(new TextEncoder().encode("%PDF-1.7 ..."), "x.pptx")).toBe("pdf");
    expect(sniffFormat(bytes(0x50, 0x4b, 0x03, 0x04))).toBe("zip");
    expect(sniffFormat(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe("jpeg");
    expect(sniffFormat(new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'/>"), "x.svg")).toBeNull();
    expect(sniffFormat(new TextEncoder().encode("print('hi')\n"), "hello.py")).toBe("text");
    expect(sniffFormat(new TextEncoder().encode("print('hi')\n"), "hello.exe")).toBeNull();
    expect(sniffFormat(bytes(0x4d, 0x5a), "tool.py")).toBeNull();
  });

  it("measures pictures", () => {
    const png = new Uint8Array(32);
    png.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    new DataView(png.buffer).setUint32(16, 800);
    new DataView(png.buffer).setUint32(20, 600);
    expect(imageSize(png)).toEqual({ width: 800, height: 600 });
    const gif = new Uint8Array([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x20, 0x03, 0x58, 0x02, ...new Array(20).fill(0)]);
    expect(imageSize(gif)).toEqual({ width: 800, height: 600 });
    // A baseline JPEG: SOI, an APP0 segment, then SOF0 with height 600 and width 800.
    const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, 0x02, 0x58, 0x03, 0x20, 0x03, ...new Array(20).fill(0)]);
    expect(imageSize(jpeg)).toEqual({ width: 800, height: 600 });
  });

  it("tells PowerPoint and Word from other zips, and refuses macros", () => {
    expect(officeKind(["[Content_Types].xml", "ppt/presentation.xml"])).toBe("pptx");
    expect(officeKind(["[Content_Types].xml", "word/document.xml"])).toBe("docx");
    expect(officeKind(["readme.txt"])).toBe("zip");
    expect(officeKind(["[Content_Types].xml", "ppt/presentation.xml", "ppt/vbaProject.bin"])).toBe("macro");
    expect(findCentralDirectory(new Uint8Array(30), 30)).toBeNull();
    expect(centralDirectoryNames(new Uint8Array(10))).toEqual([]);
  });

  it("makes safe download names with the real extension", () => {
    expect(safeFileName("../../etc/passwd.pptx", "pdf")).toBe("etc-passwd.pdf");
    expect(safeFileName("Lecture 3 – Loops.PPTX", "pptx")).toBe("Lecture 3 - Loops.pptx");
    expect(safeFileName("main.cpp", "text")).toBe("main.cpp");
    expect(safeFileName("", "png")).toBe("file.png");
  });
});

describe("question check", () => {
  it("accepts every question in content/ as the editor would send it", () => {
    const root = join(process.cwd(), "content");
    let n = 0;
    for (const course of readdirSync(root)) {
      const dir = join(root, course, "exercises");
      for (const file of readdirSync(dir)) {
        const parsed = checkExerciseMarkdown(readFileSync(join(dir, file), "utf8"));
        expect(parsed.ok, file).toBe(true);
        if (!parsed.ok) continue;
        // Through JSON, as the browser sends it.
        const again = checkExercise(readExerciseInput(JSON.parse(JSON.stringify(parsed.exercise))));
        expect(again.ok && again.exercise, file).toEqual(parsed.exercise);
        n++;
      }
    }
    expect(n).toBeGreaterThan(200);
  });

  it("explains what is missing in the editor's words", () => {
    const blank = blankExercise("mcq", "python", "loops");
    expect(checkExercise(blank)).toEqual({ ok: false, error: "Option 1 is empty: write it or remove it." });
    const filled = { ...blank, slug: "q", title: "Q", promptMd: "Pick", options: [{ labelMd: "A", correct: true, feedbackMd: "" }, { labelMd: "B", correct: false, feedbackMd: "" }] };
    expect(checkExercise(filled)).toMatchObject({ ok: false, error: expect.stringMatching(/explanation/i) });
    expect(checkExercise({ ...filled, explanationMd: "Because." })).toMatchObject({ ok: true });
    expect(checkExercise({ ...filled, explanationMd: "Because.", topic: null })).toMatchObject({ ok: false, error: "Choose a topic or a lecture" });
  });
});

describe("Cairo times", () => {
  it("turns a Cairo wall-clock time into the right moment and back, in and out of summer time", async () => {
    const { fromCairoInput, toCairoInput } = await import("@/lib/admin/time");
    for (const value of ["2026-01-15T09:30", "2026-07-15T09:30", "2026-10-12T23:59"]) {
      const ms = fromCairoInput(value)!;
      expect(toCairoInput(ms)).toBe(value);
    }
    // Winter: Cairo is UTC+2.
    expect(new Date(fromCairoInput("2026-01-15T09:30")!).toISOString()).toBe("2026-01-15T07:30:00.000Z");
    expect(fromCairoInput("not a time")).toBeNull();
  });
});
