import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

const alias = { "@": fileURLToPath(new URL("./src", import.meta.url)) };

export default defineConfig(async () => {
  // The real migrations, applied to a fresh local D1 in each test file.
  const migrations = await readD1Migrations("migrations");
  // The Drizzle schema rendered as SQL (`npm run db:mirror`), for the mirror test.
  const mirror = existsSync(".drizzle-mirror") ? await readD1Migrations(".drizzle-mirror") : [];
  // seed/*.sql split into statements, so tests use the real seed data.
  const seed = await readD1Migrations("seed");

  return {
    test: {
      projects: [
        {
          resolve: { alias },
          test: { name: "unit", include: ["tests/unit/**/*.test.ts"], environment: "node" },
        },
        {
          resolve: { alias },
          plugins: [
            cloudflareTest({
              miniflare: {
                compatibilityDate: "2026-10-08",
                compatibilityFlags: ["nodejs_compat"],
                d1Databases: ["DB", "MIRROR_DB"],
                r2Buckets: ["FILES"],
                bindings: {
                  APP_ENV: "local",
                  PUBLIC_SITE_URL: "http://localhost:5173",
                  ADS_ENABLED: "false",
                  TEST_MIGRATIONS: migrations,
                  MIRROR_MIGRATIONS: mirror,
                  SEED: seed,
                },
              },
            }),
          ],
          // Every file loads the real seed (thousands of rows), which can take more than the 10 s default when files run side by side.
          test: { name: "workers", include: ["tests/integration/**/*.test.ts"], testTimeout: 60_000, hookTimeout: 120_000 },
        },
      ],
    },
  };
});
