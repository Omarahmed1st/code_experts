"use server";

import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import {
  type ExerciseInput,
  deleteExercise,
  duplicateExercise,
  importExercises,
  restoreExerciseRevision,
  saveExercise,
  setExerciseStatus,
} from "@/server/admin/exercises";

export async function saveExerciseAction(courseSlug: string, id: string | null, input: ExerciseInput) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveExercise(ctx.actor, ctx.course, id, input);
}

export async function setExerciseStatusAction(courseSlug: string, id: string, status: "draft" | "published") {
  const ctx = await courseActor(courseSlug, "publish");
  if (!ctx) return fail(NO_PERMISSION);
  return setExerciseStatus(ctx.actor, ctx.course, id, status);
}

export async function duplicateExerciseAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return duplicateExercise(ctx.actor, ctx.course, id);
}

export async function deleteExerciseAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteExercise(ctx.actor, ctx.course, id);
}

export async function importExercisesAction(courseSlug: string, items: { name: string; input: ExerciseInput }[]) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  if (!Array.isArray(items)) return fail("Nothing to import.");
  return importExercises(ctx.actor, ctx.course, items);
}

export async function restoreExerciseAction(courseSlug: string, id: string, revisionNo: number) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return restoreExerciseRevision(ctx.actor, ctx.course, id, revisionNo);
}
