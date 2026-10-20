import { sql } from "drizzle-orm";
import { integer, text } from "drizzle-orm/sqlite-core";

/** Same default as the migration: integer milliseconds since the Unix epoch. */
export const nowMs = sql`(unixepoch() * 1000)`;

export const id = () => text("id").primaryKey();
export const timestamp = (name: string) => integer(name).notNull().default(nowMs);
export const createdAt = () => timestamp("created_at");
export const updatedAt = () => timestamp("updated_at");

/** INTEGER 0/1 column (the migration guards it with CHECK (x IN (0, 1))). */
export const flag = (name: string, defaultValue: boolean) =>
  integer(name, { mode: "boolean" }).notNull().default(defaultValue);
export const optionalFlag = (name: string) => integer(name, { mode: "boolean" });

/** JSON stored as TEXT (the migration guards it with CHECK (json_valid(x))). */
export const json = <T>(name: string) => text(name, { mode: "json" }).$type<T>();
