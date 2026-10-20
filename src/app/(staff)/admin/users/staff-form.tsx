"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import type { CourseRole } from "@/lib/auth/permissions";
import {
  createStaffAction,
  resetStaffPasswordAction,
  setStaffActiveAction,
  signOutStaffAction,
  updateStaffAction,
} from "../site-actions";

interface StaffFields {
  name: string;
  email: string;
  siteRole: "admin" | "editor";
  courseRoles: Record<string, CourseRole>;
}

type Courses = { id: string; title: string }[];

/** The one-time temporary password, with a copy button. */
export function TemporaryPassword({ email, password }: { email: string; password: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Notice tone="success">
      <p className="font-semibold">Temporary password for {email}</p>
      <p className="mt-2 flex flex-wrap items-center gap-3">
        <code className="rounded-lg bg-surface px-3 py-2 font-mono text-lg tracking-wide text-ink">{password}</code>
        <button
          type="button"
          className={buttonClass("secondary", "px-3")}
          onClick={() => {
            void navigator.clipboard?.writeText(password).then(() => setCopied(true));
          }}
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </p>
      <p className="mt-2 text-sm">It is shown only now. Give it to them privately; they'll be asked to choose their own password after signing in.</p>
    </Notice>
  );
}

function Fields({ f, set, courses, err, emailLocked }: { f: StaffFields; set: (f: StaffFields) => void; courses: Courses; err: (n: string) => string | null; emailLocked: boolean }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field id="name" label="Name" error={err("name")}>
          <input id="name" value={f.name} required maxLength={80} onChange={(e) => set({ ...f, name: e.target.value })} aria-describedby={describedBy("name", false, !!err("name"))} className={inputClass} />
        </Field>
        <Field id="email" label="Email" help={emailLocked ? "The email is the sign-in name and can't be changed." : undefined} error={err("email")}>
          <input
            id="email"
            type="email"
            value={f.email}
            readOnly={emailLocked}
            required
            maxLength={254}
            autoComplete="off"
            onChange={(e) => set({ ...f, email: e.target.value })}
            aria-describedby={describedBy("email", emailLocked, !!err("email"))}
            className={inputClass}
          />
        </Field>
      </div>
      <fieldset className="grid gap-1">
        <legend className="mb-1 text-sm font-semibold">Role</legend>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="siteRole" checked={f.siteRole === "editor"} onChange={() => set({ ...f, siteRole: "editor" })} className="size-4 accent-[var(--cl-primary)]" />
          Editor: only the courses chosen below
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="radio" name="siteRole" checked={f.siteRole === "admin"} onChange={() => set({ ...f, siteRole: "admin" })} className="size-4 accent-[var(--cl-primary)]" />
          Administrator: every course, staff accounts and the audit log
        </label>
      </fieldset>
      {f.siteRole === "editor" ? (
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">Courses</legend>
          {err("courseRoles") ? <p className="text-sm font-medium text-hard">{err("courseRoles")}</p> : null}
          {courses.map((c) => (
            <label key={c.id} className="grid gap-2 rounded-xl border border-line p-3 text-sm sm:grid-cols-[1fr_220px] sm:items-center">
              <span className="font-medium">{c.title}</span>
              <select
                value={f.courseRoles[c.id] ?? ""}
                onChange={(e) => {
                  const next = { ...f.courseRoles };
                  if (e.target.value) next[c.id] = e.target.value as CourseRole;
                  else delete next[c.id];
                  set({ ...f, courseRoles: next });
                }}
                aria-label={`Role in ${c.title}`}
                className={inputClass}
              >
                <option value="">No access</option>
                <option value="editor">Editor: view and edit</option>
                <option value="course_admin">Course admin: also publish and delete</option>
              </select>
            </label>
          ))}
        </fieldset>
      ) : null}
    </div>
  );
}

export function NewStaff({ courses }: { courses: Courses }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<StaffFields>({ name: "", email: "", siteRole: "editor", courseRoles: {} });
  const save = useAdminAction<{ id: string; email: string; temporaryPassword: string }>();
  const created = save.result?.ok ? save.result.value : null;
  if (!open) {
    return (
      <div className="grid gap-4">
        {created ? <TemporaryPassword email={created.email} password={created.temporaryPassword} /> : null}
        <div>
          <button
            type="button"
            className={buttonClass("primary")}
            onClick={() => {
              save.setResult(null);
              setF({ name: "", email: "", siteRole: "editor", courseRoles: {} });
              setOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" /> Add a staff member
          </button>
        </div>
      </div>
    );
  }
  return (
    <Card title="New staff member">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => createStaffAction({ ...f }), { onSuccess: () => setOpen(false) });
        }}
      >
        <ResultNotice result={save.result && !save.result.ok ? save.result : null} />
        <Fields f={f} set={setF} courses={courses} err={save.fieldError} emailLocked={false} />
        <div className="flex flex-wrap gap-2">
          <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
            {save.pending ? "Creating…" : "Create account"}
          </button>
          <button type="button" className={buttonClass("ghost")} onClick={() => setOpen(false)}>
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

export function EditStaff({
  userId,
  initial,
  courses,
  status,
  isSelf,
}: {
  userId: string;
  initial: StaffFields;
  courses: Courses;
  status: "active" | "disabled" | "deleted";
  isSelf: boolean;
}) {
  const router = useRouter();
  const [f, setF] = useState<StaffFields>(initial);
  const save = useAdminAction();
  const act = useAdminAction<unknown>();
  const reset = act.result?.ok && act.result.value && typeof act.result.value === "object" && "temporaryPassword" in act.result.value ? (act.result.value as { temporaryPassword: string }).temporaryPassword : null;
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
      <Card title="Account">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            act.setResult(null);
            save.run(() => updateStaffAction(userId, { ...f }));
          }}
        >
          <ResultNotice result={save.result} />
          <Fields f={f} set={setF} courses={courses} err={save.fieldError} emailLocked />
          <div>
            <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
              {save.pending ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </Card>
      <aside className="grid gap-6">
        <Card title="Access">
          <div className="grid gap-2">
            {reset ? <TemporaryPassword email={initial.email} password={reset} /> : <ResultNotice result={act.result} />}
            {isSelf ? (
              <p className="text-sm text-muted">This is your account. Change your password on the My account page.</p>
            ) : (
              <>
                <ConfirmButton
                  label="Reset the password"
                  tone="normal"
                  question="Make a new temporary password? They are signed out everywhere and their current password stops working."
                  confirmLabel="Reset"
                  disabled={act.pending}
                  onConfirm={() => {
                    save.setResult(null);
                    act.run(() => resetStaffPasswordAction(userId));
                  }}
                />
                <ConfirmButton
                  label="Sign out everywhere"
                  tone="normal"
                  question="End all their sessions now?"
                  confirmLabel="Sign out"
                  disabled={act.pending}
                  onConfirm={() => {
                    save.setResult(null);
                    act.run(() => signOutStaffAction(userId));
                  }}
                />
                {status === "active" ? (
                  <ConfirmButton
                    label="Disable the account"
                    question="Disable it? They are signed out and can't sign in until it is enabled again. Nothing they made is deleted."
                    confirmLabel="Disable"
                    disabled={act.pending}
                    onConfirm={() => {
                      save.setResult(null);
                      act.run(() => setStaffActiveAction(userId, false));
                    }}
                  />
                ) : (
                  <button
                    type="button"
                    className={buttonClass("primary")}
                    disabled={act.pending}
                    onClick={() => {
                      save.setResult(null);
                      act.run(() => setStaffActiveAction(userId, true));
                    }}
                  >
                    Enable the account
                  </button>
                )}
              </>
            )}
            <button type="button" className={buttonClass("ghost")} onClick={() => router.push("/admin/users")}>
              Back to staff accounts
            </button>
          </div>
        </Card>
      </aside>
    </div>
  );
}
