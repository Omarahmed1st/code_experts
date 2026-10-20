// Shared pieces for admin services: who is acting, the result shape actions
// return to forms, and small D1 statement builders.
import { type CourseAction, type Staff, can } from "@/lib/auth/permissions";
import type { Row } from "@/lib/content/exercise-rows";
import { getBindings } from "@/server/platform/env";
import type { AdminCourse } from "./courses";

export interface Actor {
  staff: Staff;
  ip: string | null;
}

export type AdminResult<T = undefined> =
  | { ok: true; value: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export const fail = (error: string, fieldErrors?: Record<string, string>): { ok: false; error: string; fieldErrors?: Record<string, string> } => ({
  ok: false,
  error,
  ...(fieldErrors ? { fieldErrors } : {}),
});

export function done<T>(value: T, message?: string): { ok: true; value: T; message?: string } {
  return { ok: true, value, ...(message ? { message } : {}) };
}

/** Services check permissions again (actions already did): a missed check in a page can't open a hole. */
export function denied(actor: Actor, action: CourseAction, course: AdminCourse): boolean {
  return !can(actor.staff, action, course.id);
}

export const NO_PERMISSION = "You don't have permission to do that in this course.";

export function insertStatement(table: string, row: Row): D1PreparedStatement {
  const columns = Object.keys(row);
  return getBindings()
    .db.prepare(`INSERT INTO ${table} (${columns.join(", ")}) VALUES (${columns.map(() => "?").join(", ")})`)
    .bind(...columns.map((c) => normalize(row[c] ?? null)));
}

export function updateStatement(table: string, row: Row, where: Row): D1PreparedStatement {
  const sets = Object.keys(row);
  const keys = Object.keys(where);
  return getBindings()
    .db.prepare(`UPDATE ${table} SET ${sets.map((c) => `${c} = ?`).join(", ")} WHERE ${keys.map((k) => `${k} = ?`).join(" AND ")}`)
    .bind(...sets.map((c) => normalize(row[c] ?? null)), ...keys.map((k) => normalize(where[k] ?? null)));
}

function normalize(value: Row[string]): string | number | null {
  return typeof value === "boolean" ? (value ? 1 : 0) : value;
}

/** A unique-constraint failure from D1 (e.g. a slug already used in this course). */
export function isUniqueError(error: unknown): boolean {
  return error instanceof Error && /UNIQUE constraint failed/i.test(error.message);
}

export function isForeignKeyError(error: unknown): boolean {
  return error instanceof Error && /FOREIGN KEY constraint failed/i.test(error.message);
}

/** Text from a form or JSON field: trimmed, at most `max` characters, or "" when missing. */
export function str(value: unknown, max = 10_000): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function today(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10);
}
