import { beforeAll, expect, it } from "vitest";
import { GET } from "@/app/api/health/route";
import { loadRealSeed, migrate } from "./db-helpers";

beforeAll(async () => {
  await migrate();
  await loadRealSeed();
});

it("GET /api/health reads D1 and reports applied migrations", async () => {
  const response = await GET();
  expect(response.status).toBe(200);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
  expect(await response.json()).toEqual({
    status: "ok",
    environment: "local",
    database: {
      reachable: true,
      migrations: ["0001_initial_schema.sql", "0002_lesson_sections_interactive.sql", "0003_cpp_runnable.sql", "0004_staff_sign_in.sql", "0005_student_accounts.sql", "0006_phase5_1_hardening.sql", "0007_phase6_ads_consent.sql"],
      publishedCourses: 3,
    },
  });
});
