import { expect, it } from "vitest";
import { hashPassword, passwordProblem, verifyPassword } from "@/lib/auth/password";

it("hashes with scrypt inside the Workers runtime and verifies", async () => {
  const started = performance.now();
  const hash = await hashPassword("correct horse battery");
  const ms = performance.now() - started;
  console.log(`scrypt hash in workerd: ${ms.toFixed(0)} ms`);
  expect(hash).toMatch(/^scrypt\$32768\$8\$3\$[A-Za-z0-9+/=]+\$[A-Za-z0-9+/=]+$/);
  expect(await verifyPassword("correct horse battery", hash)).toEqual({ ok: true, needsRehash: false });
  expect((await verifyPassword("correct horse batterY", hash)).ok).toBe(false);
  expect((await verifyPassword("x", "not-a-hash")).ok).toBe(false);
});

it("rejects weak new passwords", () => {
  expect(passwordProblem("short")).toMatch(/at least/);
  expect(passwordProblem("aaaaaaaaaaaa")).toMatch(/repeats/);
  expect(passwordProblem("omar.ahmed-2026!", "omar.ahmed@example.com")).toMatch(/email/);
  expect(passwordProblem("blue kettle on mars")).toBeNull();
});
