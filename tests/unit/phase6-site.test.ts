// Phase 6: consent helpers, verification tags, the owner's facts, the legal
// pages agreeing with the code, and the Windows folder-path fix in tools/.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { waitForTcfDecision } from "@/components/ads/ad-loader";
import { deviceMatches, previewRequested, siteStorageKeys } from "@/lib/ads/browser";
import { THEME_STORAGE_KEY } from "@/components/layout/theme-script";
import { sessionCookieName } from "@/lib/auth/session-token";
import { parseConfig } from "@/server/platform/config";
import { EMPTY_OWNER, missingOwnerFacts, parseSiteOwner, validDate, validEmail, validVerificationToken } from "@/lib/site/owner";
import { verificationMetadata } from "@/lib/site/verification";

const PUB = "pub-1234567890123456"; // right shape, not a real account
const read = (path: string) => readFileSync(join(process.cwd(), path), "utf8");

type Listener = (data: { gdprApplies?: boolean; eventStatus?: string; listenerId?: number }, success: boolean) => void;
function fakeWindow(script: (listener: Listener) => void): Window {
  return { __tcfapi: (command: string, _v: number, cb: Listener) => (command === "addEventListener" ? script(cb) : undefined) } as unknown as Window;
}

describe("consent platform handshake (IAB TCF)", () => {
  it("waits for the visitor's answer, then lets ads load", async () => {
    const win = fakeWindow((cb) => {
      cb({ eventStatus: "cmpuishown", gdprApplies: true }, true);
      setTimeout(() => cb({ eventStatus: "useractioncomplete", gdprApplies: true, listenerId: 1 }, true), 20);
    });
    await expect(waitForTcfDecision(2000, win)).resolves.toBe(true);
  });

  it("an earlier answer (tcloaded) or GDPR not applying is enough", async () => {
    await expect(waitForTcfDecision(2000, fakeWindow((cb) => cb({ eventStatus: "tcloaded" }, true)))).resolves.toBe(true);
    await expect(waitForTcfDecision(2000, fakeWindow((cb) => cb({ gdprApplies: false }, true)))).resolves.toBe(true);
  });

  it("no CMP, a failing CMP or no answer: ads stay off", async () => {
    await expect(waitForTcfDecision(150, {} as Window)).resolves.toBe(false);
    await expect(waitForTcfDecision(150, fakeWindow((cb) => cb({ eventStatus: "tcloaded" }, false)))).resolves.toBe(false);
    await expect(waitForTcfDecision(150, fakeWindow(() => undefined))).resolves.toBe(false);
    const throwing = { __tcfapi: () => { throw new Error("broken"); } } as unknown as Window;
    await expect(waitForTcfDecision(150, throwing)).resolves.toBe(false);
  });
});

describe("browser helpers", () => {
  it("preview only with ?ad-preview=1", () => {
    expect(previewRequested("?ad-preview=1")).toBe(true);
    expect(previewRequested("?x=1&ad-preview=1")).toBe(true);
    expect(previewRequested("?ad-preview=true")).toBe(false);
    expect(previewRequested("")).toBe(false);
  });

  it("device rules split at 1024 px", () => {
    expect(deviceMatches("all", 320)).toBe(true);
    expect(deviceMatches("desktop", 1024)).toBe(true);
    expect(deviceMatches("desktop", 1023)).toBe(false);
    expect(deviceMatches("mobile", 390)).toBe(true);
    expect(deviceMatches("mobile", 1440)).toBe(false);
  });

  it("'clear this site's data' removes only this site's keys", () => {
    const data = new Map<string, string>([
      [THEME_STORAGE_KEY, "dark"],
      ["codelab:practice:programming-fundamentals", "{}"],
      ["codelab:attempt:cpp:quizzes:final:", "{}"],
      ["someone-else", "keep"],
    ]);
    const storage = { get length() { return data.size; }, key: (i: number) => [...data.keys()][i] ?? null } as unknown as Storage;
    expect(siteStorageKeys(storage, THEME_STORAGE_KEY).sort()).toEqual([THEME_STORAGE_KEY, "codelab:attempt:cpp:quizzes:final:", "codelab:practice:programming-fundamentals"].sort());
  });
});

describe("deployment config", () => {
  it("CMP_SCRIPT_URL is used only when it is a plain https address", () => {
    expect(parseConfig({ CMP_SCRIPT_URL: "https://cmp.example.com/cmp.js" }).cmpScriptUrl).toBe("https://cmp.example.com/cmp.js");
    expect(parseConfig({ CMP_SCRIPT_URL: "http://cmp.example.com/cmp.js" }).cmpScriptUrl).toBeNull();
    expect(parseConfig({}).cmpScriptUrl).toBeNull();
  });
});

describe("the owner's facts", () => {
  it("start empty and say what is missing", () => {
    expect(parseSiteOwner(null)).toEqual(EMPTY_OWNER);
    expect(missingOwnerFacts(EMPTY_OWNER)).toHaveLength(4);
    const full = parseSiteOwner({ operatorName: "A Person", contactEmail: "a@b.co", country: "Egypt", effectiveDate: "2026-11-01", legalReviewed: true });
    expect(missingOwnerFacts(full)).toEqual([]);
    expect(full.legalReviewed).toBe(true);
  });

  it("broken stored values are dropped, not shown", () => {
    const owner = parseSiteOwner({ contactEmail: "not an email", effectiveDate: "2026-13-45", searchConsoleToken: "<meta name=x>", legalReviewed: "yes" });
    expect(owner).toEqual(EMPTY_OWNER);
  });

  it("field rules", () => {
    expect(validEmail("owner@example.org")).toBe(true);
    expect(validEmail("owner@example")).toBe(false);
    expect(validEmail('a"@b.co')).toBe(false);
    expect(validDate("2026-02-28")).toBe(true);
    expect(validDate("28/02/2026")).toBe(false);
    expect(validVerificationToken("abcDEF_123-xyz")).toBe(true);
    expect(validVerificationToken('abc" onload="x')).toBe(false);
    expect(validVerificationToken("short")).toBe(false);
  });
});

describe("verification tags", () => {
  it("nothing until the owner enters something", () => {
    expect(verificationMetadata({ searchConsoleToken: null, adsenseMetaTag: false, publisherId: PUB })).toBeNull();
    expect(verificationMetadata({ searchConsoleToken: null, adsenseMetaTag: true, publisherId: null })).toBeNull();
  });

  it("Search Console and AdSense tags from the owner's values", () => {
    expect(verificationMetadata({ searchConsoleToken: "abcDEF_123-xyz", adsenseMetaTag: true, publisherId: PUB })).toEqual({
      verification: { google: "abcDEF_123-xyz" },
      other: { "google-adsense-account": `ca-${PUB}` },
    });
  });
});

describe("legal pages agree with the code", () => {
  const cookiePolicy = read("src/app/(site)/cookie-policy/page.tsx");

  it("the cookie policy names every cookie and storage key the code sets", () => {
    expect(cookiePolicy).toContain(sessionCookieName(true));
    expect(cookiePolicy).toContain(THEME_STORAGE_KEY);
    expect(read("src/components/practice/local-progress.ts")).toContain("`codelab:practice:${courseSlug}`");
    expect(cookiePolicy).toContain("codelab:practice:");
    expect(read("src/components/practice/attempt-runner.tsx")).toContain("`codelab:attempt:${course}:${kind}:${slug}`");
    expect(cookiePolicy).toContain("codelab:attempt:");
    expect(read("src/lib/grading/attempt-limit.ts")).toContain("`ce_model_${");
    expect(cookiePolicy).toContain("ce_model_");
  });

  it("only the three known files write to local storage (each listed in the cookie policy)", () => {
    const files = readdirSync(join(process.cwd(), "src"), { recursive: true })
      .map(String)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => /(local|session)Storage\.setItem|document\.cookie\s*=/.test(read(join("src", f))));
    expect(files.map((f) => f.replace(/\\/g, "/")).sort()).toEqual([
      "components/layout/theme-toggle.tsx",
      "components/practice/attempt-runner.tsx",
      "components/practice/local-progress.ts",
    ]);
  });

  it.each(["privacy-policy", "terms", "cookie-policy", "advertising"])("%s shows the draft notice and invents no owner details", (slug) => {
    const source = read(`src/app/(site)/${slug}/page.tsx`);
    expect(source).toContain("<DraftNotice");
    // No email address, phone number or street address typed into the page itself.
    expect(source).not.toMatch(/[A-Za-z0-9._%+-]+@(?!example\.)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/);
    expect(source).not.toMatch(/\+?\d[\d\s-]{8,}\d/);
    expect(source).not.toMatch(/approved by google|adsense approved|guaranteed/i);
  });

  it("every footer link points at a page that exists", () => {
    const footer = read("src/components/layout/site-footer.tsx");
    const hrefs = [...footer.matchAll(/href: "(\/[a-z-]*)"/g)].map((m) => m[1]!);
    expect(hrefs).toEqual(expect.arrayContaining(["/contact", "/privacy-policy", "/terms", "/cookie-policy", "/advertising", "/privacy-choices"]));
    for (const href of hrefs) expect(existsSync(join(process.cwd(), `src/app/(site)${href}`, "page.tsx")), href).toBe(true);
  });
});

describe("tools work from a folder whose path has spaces (Windows)", () => {
  const tools = readdirSync(join(process.cwd(), "tools")).filter((f) => /\.(ts|mjs)$/.test(f));

  it("no tool turns its own URL into a path with .pathname (that keeps %20)", () => {
    for (const file of tools) {
      const source = read(`tools/${file}`);
      expect(source, file).not.toMatch(/import\.meta\.url\)\.pathname/);
      if (/new URL\("\.\.", import\.meta\.url\)/.test(source)) expect(source, file).toMatch(/fileURLToPath\(new URL\("\.\.", import\.meta\.url\)\)/);
    }
  });

  it("no tool runs a command through a shell (shell: true doesn't quote paths with spaces)", () => {
    for (const file of tools) {
      const code = read(`tools/${file}`)
        .split("\n")
        .filter((line) => !line.trim().startsWith("//"));
      expect(code.join("\n"), file).not.toMatch(/shell:\s*true/);
    }
  });

  it("fileURLToPath gives the real Windows folder name", () => {
    expect(fileURLToPath("file:///C:/Users/me/Desktop/Code%20Expert/", { windows: true })).toBe("C:\\Users\\me\\Desktop\\Code Expert\\");
    expect(new URL("file:///C:/Users/me/Desktop/Code%20Expert/").pathname).toContain("%20");
  });
});
