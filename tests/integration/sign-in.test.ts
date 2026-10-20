// Staff sign-in: the same answer for a wrong email and a wrong password,
// rate limits per account and per address, sessions that end.
import { env } from "cloudflare:workers";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createStaff } from "@/server/admin/users";
import { findSession } from "@/server/auth/sessions";
import { signIn } from "@/server/auth/sign-in";
import { SIGN_IN_LIMITS } from "@/server/auth/rate-limit";
import { course, CV, makeStaff } from "./admin-helpers";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(migrate);
beforeEach(async () => {
  await env.DB.batch([env.DB.prepare("DELETE FROM users"), env.DB.prepare("DELETE FROM admin_audit_logs"), env.DB.prepare("DELETE FROM rate_limits")]);
  await loadRealSeed();
});

async function editor(email: string) {
  const admin = await makeStaff("admin1", "admin");
  const cv = await course(CV);
  const made = await createStaff(admin, { name: "Mona Editor", email, siteRole: "editor", courseRoles: { [cv.id]: "editor" } });
  if (!made.ok) throw new Error(made.error);
  return made.value;
}

const attempt = (email: string, password: string, ip: string, now?: number) => signIn({ email, password, turnstileToken: null, ip, userAgent: "test", now });

describe("staff sign-in", () => {
  it("gives the same answer for an unknown email and a wrong password, and signs in with the right one", async () => {
    const mona = await editor("mona@example.com");
    const unknown = await attempt("nobody@example.com", "whatever password", "198.51.100.7");
    const wrong = await attempt("mona@example.com", "whatever password", "198.51.100.7");
    expect(unknown).toMatchObject({ ok: false });
    expect(wrong).toEqual(unknown);
    const ok = await attempt("mona@example.com", mona.temporaryPassword, "198.51.100.7");
    expect(ok).toMatchObject({ ok: true, token: expect.any(String) });
    if (ok.ok) expect(await findSession(ok.token)).toMatchObject({ userId: mona.id });
  });

  it("locks one account after too many wrong passwords, even with the right one, then lets it in after the window", async () => {
    const mona = await editor("mona@example.com");
    const now = Date.now();
    for (let i = 0; i < SIGN_IN_LIMITS.perAccount.max; i++) {
      // A different address each time: the account limit alone must stop this.
      expect(await attempt("mona@example.com", `guess number ${i}`, `198.51.100.${i + 10}`, now)).toMatchObject({ ok: false });
    }
    const locked = await attempt("Mona@Example.com ", mona.temporaryPassword, "198.51.100.99", now + 1000);
    expect(locked).toMatchObject({ ok: false, error: expect.stringMatching(/Too many attempts/), retryAt: expect.any(Number) });
    // Other accounts are not affected.
    const other = await editor("omar@example.com");
    expect(await attempt("omar@example.com", other.temporaryPassword, "198.51.100.99", now + 1000)).toMatchObject({ ok: true });
    // After the window the right password works, and the counter starts again.
    expect(await attempt("mona@example.com", mona.temporaryPassword, "198.51.100.99", now + SIGN_IN_LIMITS.perAccount.windowMs + 1000)).toMatchObject({ ok: true });
  });

  it("limits one address that tries many accounts", async () => {
    const now = Date.now();
    for (let i = 0; i < SIGN_IN_LIMITS.perAddress.max; i++) {
      await attempt(`guess${i}@example.com`, "some password here", "203.0.113.50", now);
    }
    expect(await attempt("someone-else@example.com", "some password here", "203.0.113.50", now + 1000)).toMatchObject({ ok: false, error: expect.stringMatching(/Too many attempts/) });
    // The table never stores an email address.
    const { results } = await env.DB.prepare("SELECT key FROM rate_limits").all<{ key: string }>();
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.key.includes("@"))).toBe(false);
  });

  it("refuses a disabled account and an account without a password", async () => {
    await env.DB.batch([
      env.DB.prepare("INSERT INTO users (id, email, name, status) VALUES ('stu1', 'student@example.com', 'Student', 'active')"),
    ]);
    expect(await attempt("student@example.com", "anything at all", "198.51.100.3")).toMatchObject({ ok: false });
    const mona = await editor("mona@example.com");
    await env.DB.prepare("UPDATE users SET status = 'disabled' WHERE id = ?").bind(mona.id).run();
    expect(await attempt("mona@example.com", mona.temporaryPassword, "198.51.100.3")).toMatchObject({ ok: false });
  });
});
