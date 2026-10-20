"use server";

// The student's own account settings. Every action finds the signed-in
// account again from the session cookie; nothing is trusted from the form
// except what the student typed.
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { currentCookieName } from "@/server/auth/request";
import { getSignedIn } from "@/server/auth/staff";
import {
  type AccountResult,
  changePassword,
  deleteOwnAccount,
  endOtherSessions,
  endSession,
  replaceRecoveryCode,
  updateName,
} from "@/server/students/accounts";

export interface SettingsState {
  error: string | null;
  message: string | null;
  fieldErrors: Record<string, string>;
  recoveryCode?: string;
}

const SIGNED_OUT: SettingsState = { error: "You were signed out. Sign in again to change your settings.", message: null, fieldErrors: {} };

function toState<T>(result: AccountResult<T>): SettingsState {
  return result.ok
    ? { error: null, message: result.message ?? "Saved.", fieldErrors: {} }
    : { error: result.error, message: null, fieldErrors: result.fieldErrors ?? {} };
}

const text = (form: FormData, name: string) => {
  const v = form.get(name);
  return typeof v === "string" ? v : "";
};

export async function saveNameAction(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const state = toState(await updateName(me.id, text(form, "name")));
  if (!state.error) revalidatePath("/settings");
  return state;
}

export async function changePasswordAction(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const state = toState(
    await changePassword(me.id, me.email, me.sessionId, {
      currentPassword: text(form, "currentPassword"),
      newPassword: text(form, "newPassword"),
      confirmPassword: text(form, "confirmPassword"),
    }),
  );
  if (!state.error) revalidatePath("/settings");
  return state;
}

export async function newRecoveryCodeAction(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const result = await replaceRecoveryCode(me.id, text(form, "password"));
  return result.ok ? { ...toState(result), recoveryCode: result.value.recoveryCode } : toState(result);
}

export async function endSessionAction(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const sessionId = text(form, "sessionId");
  if (sessionId === me.sessionId) return { error: "Use Sign out in the menu to sign out of this device.", message: null, fieldErrors: {} };
  const state = toState(await endSession(me.id, sessionId));
  revalidatePath("/settings");
  return state;
}

export async function endOtherSessionsAction(_previous: SettingsState, _form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const state = toState(await endOtherSessions(me.id, me.sessionId));
  revalidatePath("/settings");
  return state;
}

export async function deleteAccountAction(_previous: SettingsState, form: FormData): Promise<SettingsState> {
  const me = await getSignedIn();
  if (!me) return SIGNED_OUT;
  const result = await deleteOwnAccount(me.id, { confirm: text(form, "confirm"), password: text(form, "password") });
  if (!result.ok) return toState(result);
  (await cookies()).delete(currentCookieName());
  redirect("/account-deleted");
}
