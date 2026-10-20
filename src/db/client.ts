import { drizzle } from "drizzle-orm/d1";
import { getBindings } from "@/server/platform/env";
import * as schema from "./schema";

export type Database = ReturnType<typeof getDb>;

/** A Drizzle client over the request's D1 binding. Cheap to create; no pooling needed. */
export function getDb() {
  return drizzle(getBindings().db, { schema });
}
