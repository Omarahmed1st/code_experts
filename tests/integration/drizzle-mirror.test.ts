// The Drizzle schema (src/db/schema) must describe the same database as
// migrations/ (0001-0004). `npm run db:mirror` renders the Drizzle schema to SQL; this
// test applies both to separate local D1 databases and compares every table's
// columns, primary keys, foreign keys and indexes.
//
// Not compared, by design: CHECK constraints, triggers, the FTS5 search table,
// COLLATE NOCASE and the bookmarks expression index. Those live only in SQL
// (see src/db/schema/index.ts) and are covered by schema-checks.test.ts.
import { applyD1Migrations } from "cloudflare:test";
import { env } from "cloudflare:workers";
import { beforeAll, describe, expect, it } from "vitest";

type Shape = {
  columns: { name: string; type: string; notNull: boolean; default: string | null; pk: number }[];
  foreignKeys: { table: string; from: string[]; to: string[]; onDelete: string }[];
  indexes: { unique: boolean; primaryKey: boolean; partial: boolean; columns: string[]; name: string | null }[];
};

/** Expression indexes Drizzle can't render; they exist only in the SQL migration. */
const SQL_ONLY_INDEXES = new Set(["bookmarks_target_uq"]);

function normalizeDefault(value: string | null): string | null {
  if (value === null) return null;
  let v = value.replace(/\s+/g, "");
  if (v === "false") v = "0";
  if (v === "true") v = "1";
  while (v.startsWith("(") && v.endsWith(")")) v = v.slice(1, -1);
  return v;
}

async function describeDatabase(db: D1Database): Promise<Map<string, Shape>> {
  const tables = await db
    .prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' " +
        "AND name NOT LIKE 'search_index%' AND name <> 'd1_migrations' ORDER BY name",
    )
    .all<{ name: string }>();
  const shapes = new Map<string, Shape>();
  for (const { name } of tables.results) {
    const columns = await db.prepare("SELECT * FROM pragma_table_info(?)").bind(name).all<{
      name: string;
      type: string;
      notnull: number;
      dflt_value: string | null;
      pk: number;
    }>();
    const fkRows = await db.prepare("SELECT * FROM pragma_foreign_key_list(?) ORDER BY id, seq").bind(name).all<{
      id: number;
      table: string;
      from: string;
      to: string;
      on_delete: string;
    }>();
    const fks = new Map<number, Shape["foreignKeys"][number]>();
    for (const row of fkRows.results) {
      const fk = fks.get(row.id) ?? { table: row.table, from: [], to: [], onDelete: row.on_delete };
      fk.from.push(row.from);
      fk.to.push(row.to);
      fks.set(row.id, fk);
    }
    const indexRows = await db.prepare("SELECT * FROM pragma_index_list(?)").bind(name).all<{
      name: string;
      unique: number;
      origin: string;
      partial: number;
    }>();
    const indexes: Shape["indexes"] = [];
    for (const index of indexRows.results) {
      if (SQL_ONLY_INDEXES.has(index.name)) continue;
      const cols = await db
        .prepare("SELECT name FROM pragma_index_info(?) ORDER BY seqno")
        .bind(index.name)
        .all<{ name: string }>();
      indexes.push({
        unique: index.unique === 1,
        primaryKey: index.origin === "pk",
        partial: index.partial === 1,
        columns: cols.results.map((c) => c.name),
        // UNIQUE table constraints get automatic names in SQL and generated names in
        // Drizzle, so only explicitly created (non-unique-constraint) indexes compare by name.
        name: index.origin === "c" && !index.name.endsWith("_unique") ? index.name : null,
      });
    }
    const sortKey = (value: unknown) => JSON.stringify(value);
    shapes.set(name, {
      columns: columns.results.map((c) => ({
        name: c.name,
        type: c.type.toUpperCase(),
        // SQLite lets a non-INTEGER PRIMARY KEY hold NULL unless declared NOT NULL;
        // Drizzle declares it, the migration doesn't. Treat PK columns alike here.
        notNull: c.notnull === 1 || c.pk > 0,
        default: normalizeDefault(c.dflt_value),
        pk: c.pk,
      })),
      foreignKeys: [...fks.values()].sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
      indexes: indexes.sort((a, b) => sortKey(a).localeCompare(sortKey(b))),
    });
  }
  return shapes;
}

let sql: Map<string, Shape>;
let drizzle: Map<string, Shape>;

beforeAll(async () => {
  expect(env.MIRROR_MIGRATIONS.length, "run `npm run db:mirror` first").toBeGreaterThan(0);
  await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
  await applyD1Migrations(env.MIRROR_DB, env.MIRROR_MIGRATIONS);
  sql = await describeDatabase(env.DB);
  drizzle = await describeDatabase(env.MIRROR_DB);
});

describe("Drizzle schema mirrors migrations/0001", () => {
  it("declares the same tables", () => {
    expect([...drizzle.keys()]).toEqual([...sql.keys()]);
    expect(sql.size).toBe(49); // 46 from 0001 + rate_limits (0004) + custom_exam_attempts and custom_exam_questions (0005)
  });

  it("matches columns, keys and indexes table by table", () => {
    for (const [table, shape] of sql) {
      expect(drizzle.get(table), table).toEqual(shape);
    }
  });
});
