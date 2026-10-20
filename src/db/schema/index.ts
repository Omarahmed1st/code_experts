// Drizzle mirror of migrations/ (0001 to 0005).
//
// The SQL migrations are the source of truth and are applied with Wrangler.
// This schema exists for typed queries. tests/integration/drizzle-mirror.test.ts
// checks that its tables, columns, keys and indexes match the migrations.
// CHECK constraints, triggers, the FTS5 search table and COLLATE NOCASE live
// only in SQL; enum CHECKs are mirrored as TypeScript types (src/db/enums.ts).

export * from "./identity";
export * from "./content";
export * from "./questions";
export * from "./activity";
export * from "./site";
