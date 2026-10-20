// Every admin page, route and server action checks who is signed in before it
// does anything. This reads the source so a new file without a guard fails the
// build instead of quietly shipping an open page.
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src/app/(staff)/admin");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : [path];
  });
}

const all = files(ROOT);
const rel = (p: string) => relative(ROOT, p);

/** The body of each exported async function (up to the next top-level export). */
function exportedFunctions(source: string): { name: string; body: string }[] {
  const parts = source.split(/\n(?=export )/);
  return parts
    .map((part) => ({ match: /^export async function (\w+)/.exec(part), part }))
    .filter((x): x is { match: RegExpExecArray; part: string } => x.match !== null)
    .map(({ match, part }) => ({ name: match[1]!, body: part }));
}

describe("admin guards", () => {
  it("finds the admin pages", () => {
    expect(all.filter((p) => p.endsWith("page.tsx")).length).toBeGreaterThan(25);
  });

  it("every page checks the signed-in staff member", () => {
    for (const page of all.filter((p) => p.endsWith("page.tsx"))) {
      const source = readFileSync(page, "utf8");
      // The dashboard and every page below it: requireStaff, requireSite or requireCourse.
      expect(source, rel(page)).toMatch(/\b(requireStaff|requireSite|requireCourse)\(/);
    }
  });

  it("every route handler checks the signed-in staff member", () => {
    for (const route of all.filter((p) => p.endsWith("route.ts"))) {
      const source = readFileSync(route, "utf8");
      for (const { name, body } of exportedFunctions(source)) {
        expect(body, `${rel(route)} ${name}`).toMatch(/\b(getSignedIn|courseActor|staffActor)\(/);
      }
    }
  });

  it("uploads check where the request came from", () => {
    for (const route of all.filter((p) => p.endsWith("route.ts"))) {
      const source = readFileSync(route, "utf8");
      if (/export async function POST/.test(source)) expect(source, rel(route)).toMatch(/sameOrigin\(request\)/);
    }
  });

  it("every server action resolves the actor first", () => {
    const actionFiles = all.filter((p) => /(^|\/)(actions|site-actions)\.ts$/.test(p));
    expect(actionFiles.length).toBeGreaterThan(6);
    for (const file of actionFiles) {
      const source = readFileSync(file, "utf8");
      expect(source.startsWith('"use server"'), rel(file)).toBe(true);
      for (const { name, body } of exportedFunctions(source)) {
        if (name === "signOutAction") continue; // ends the session it reads; it has nothing to guard
        expect(body, `${rel(file)} ${name}`).toMatch(/\b(courseActor|staffActor)\(/);
      }
    }
  });

  it("course pages ask for the right permission for writing pages", () => {
    for (const page of all.filter((p) => /\/new\/page\.tsx$/.test(p) && p.includes("[course]"))) {
      expect(readFileSync(page, "utf8"), rel(page)).toMatch(/requireCourse\(.*, "edit"\)/);
    }
    const settings = all.find((p) => p.endsWith("[course]/settings/page.tsx"))!;
    expect(readFileSync(settings, "utf8")).toMatch(/requireCourse\(.*, "settings"\)/);
  });
});
