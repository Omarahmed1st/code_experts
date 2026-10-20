import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

// Module boundaries (docs/ARCHITECTURE.md, "Core rule"):
//  - Only src/server/platform/env.ts reads Cloudflare bindings.
//  - Pages and components never query the database directly; they call
//    src/server/* services, and course services take a CourseScope.
const bindingsRule = {
  name: "cloudflare:workers",
  message: "Read bindings and variables through src/server/platform/env.ts.",
};
const dataAccessPatterns = [
  {
    group: ["@/db/client", "@/db/schema", "@/db/schema/*", "drizzle-orm", "drizzle-orm/*"],
    message: "Pages and components get data from src/server/* services (which take a CourseScope), not from the database.",
  },
];

export default defineConfig(
  {
    ignores: [
      "dist/**",
      ".next/**",
      ".drizzle-mirror/**",
      ".wrangler/**",
      ".vinext/**",
      "node_modules/**",
      "worker-configuration.d.ts",
      "next-env.d.ts",
      // Third-party Pyodide files copied from node_modules by tools/copy-pyodide.mjs.
      "public/pyodide/**",
      // Third-party C++ compiler files prepared by tools/copy-cpp-runtime.mjs.
      "public/cpp/**",
    ],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  reactHooks.configs.flat["recommended-latest"],
  nextPlugin.configs["core-web-vitals"],
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/server/platform/env.ts"],
    rules: { "no-restricted-imports": ["error", { paths: [bindingsRule] }] },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { paths: [bindingsRule], patterns: dataAccessPatterns }] },
  },
  {
    // The Python and C++ runners are module Web Workers.
    files: ["public/runner/**/*.mjs"],
    languageOptions: {
      globals: {
        self: "readonly",
        performance: "readonly",
        TextDecoder: "readonly",
        TextEncoder: "readonly",
        URL: "readonly",
        console: "readonly",
        fetch: "readonly",
        Response: "readonly",
        ReadableStream: "readonly",
        DecompressionStream: "readonly",
        WebAssembly: "readonly",
        crypto: "readonly",
      },
    },
  },
  {
    files: ["tools/**/*.mjs"],
    languageOptions: {
      globals: { console: "readonly", process: "readonly", fetch: "readonly", performance: "readonly", URL: "readonly", Buffer: "readonly" },
    },
  },
);
