"use server";

// Advertising and consent settings (administrators only). Each action resolves
// the actor from the session; the services check again that it is an
// administrator, validate every field and write an audit entry.
import { staffActor } from "@/server/admin/actor";
import {
  type AdsSettingsInput,
  type PlacementInput,
  createExclusion,
  createPlacement,
  deleteExclusion,
  deletePlacement,
  saveAdsSettings,
  saveConsent,
  updatePlacement,
} from "@/server/admin/ads";
import { fail } from "@/server/admin/context";

const SIGNED_OUT = "Your session has ended. Sign in again.";

export async function saveAdsSettingsAction(input: AdsSettingsInput) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return saveAdsSettings(ctx.actor, input);
}

export async function saveConsentAction(input: { provider?: unknown; notes?: unknown; privacyChoicesLink?: unknown }) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return saveConsent(ctx.actor, input);
}

export async function createPlacementAction(input: PlacementInput) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return createPlacement(ctx.actor, input);
}

export async function updatePlacementAction(id: string, input: PlacementInput) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return updatePlacement(ctx.actor, id, input);
}

export async function deletePlacementAction(id: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return deletePlacement(ctx.actor, id);
}

export async function createExclusionAction(input: { kind?: unknown; pathGlob?: unknown; courseId?: unknown; pageType?: unknown; reason?: unknown }) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return createExclusion(ctx.actor, input);
}

export async function deleteExclusionAction(id: string) {
  const ctx = await staffActor();
  if (!ctx) return fail(SIGNED_OUT);
  return deleteExclusion(ctx.actor, id);
}
