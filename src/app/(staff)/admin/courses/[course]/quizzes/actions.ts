"use server";

import { courseActor } from "@/server/admin/actor";
import { NO_PERMISSION, fail } from "@/server/admin/context";
import { addQuizModel, deleteQuiz, saveQuiz } from "@/server/admin/quizzes";

export async function saveQuizAction(courseSlug: string, id: string | null, draft: unknown) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return saveQuiz(ctx.actor, ctx.course, id, draft);
}

export async function addQuizModelAction(courseSlug: string, quizId: string) {
  const ctx = await courseActor(courseSlug, "edit");
  if (!ctx) return fail(NO_PERMISSION);
  return addQuizModel(ctx.actor, ctx.course, quizId);
}

export async function deleteQuizAction(courseSlug: string, id: string) {
  const ctx = await courseActor(courseSlug, "delete");
  if (!ctx) return fail(NO_PERMISSION);
  return deleteQuiz(ctx.actor, ctx.course, id);
}
