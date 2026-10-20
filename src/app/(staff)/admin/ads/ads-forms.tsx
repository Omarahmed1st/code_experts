"use client";

// Forms on the advertising page. The server validates everything again
// (src/server/admin/ads.ts); these only collect the values.
import { Plus } from "lucide-react";
import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { AD_PAGE_TYPE, CMP_PROVIDER } from "@/db/enums";
import type { AdTemplate } from "@/lib/ads/policy";
import { createExclusionAction, deleteExclusionAction, saveAdsSettingsAction, saveConsentAction } from "./actions";

const checkboxClass = "size-4 accent-[var(--cl-primary)]";

export function AdsSettingsForm({
  initial,
  caps,
  labels,
}: {
  initial: { enabled: boolean; publisherId: string; hideForStaff: boolean; maxSlots: Record<string, string> };
  caps: Record<AdTemplate, number>;
  labels: Record<AdTemplate, string>;
}) {
  const [f, setF] = useState(initial);
  const save = useAdminAction();
  const err = save.fieldError;
  const templates = Object.keys(caps) as AdTemplate[];
  return (
    <Card title="Ad settings">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => saveAdsSettingsAction({ ...f, maxSlots: Object.fromEntries(Object.entries(f.maxSlots).map(([k, v]) => [k, v === "" ? "" : Number(v)])) }));
        }}
      >
        <ResultNotice result={save.result} />
        <Field
          id="publisherId"
          label="AdSense publisher id"
          optional
          help='From your AdSense account (Account > Settings > Account information), for example "pub-" and 16 digits. Leave empty until you have one.'
          error={err("publisherId")}
        >
          <input
            id="publisherId"
            value={f.publisherId}
            maxLength={40}
            autoComplete="off"
            spellCheck={false}
            placeholder="pub-…"
            onChange={(e) => setF({ ...f, publisherId: e.target.value })}
            aria-describedby={describedBy("publisherId", true, !!err("publisherId"))}
            className={`${inputClass} font-mono`}
          />
        </Field>
        <div className="grid gap-1">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={f.enabled} onChange={(e) => setF({ ...f, enabled: e.target.checked })} className={checkboxClass} aria-describedby="enabled-help" />
            Switch ads on
          </label>
          <p id="enabled-help" className="text-xs text-muted">
            One of two switches. Live ads also need ADS_ENABLED=&quot;true&quot; in the production deployment, a consent platform and at least one placement with an ad unit id.
          </p>
          {err("enabled") ? <p className="text-sm font-medium text-hard">{err("enabled")}</p> : null}
        </div>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={f.hideForStaff} onChange={(e) => setF({ ...f, hideForStaff: e.target.checked })} className={checkboxClass} />
          Never show live ads to signed-in staff (recommended: it stops accidental clicks on your own ads)
        </label>
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-semibold">Most ads on one page</legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {templates.map((t) => (
              <Field key={t} id={`max-${t}`} label={labels[t]} help={`0 to ${caps[t]}`} error={err(`maxSlots.${t}`)}>
                <input
                  id={`max-${t}`}
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={caps[t]}
                  value={f.maxSlots[t] ?? ""}
                  onChange={(e) => setF({ ...f, maxSlots: { ...f.maxSlots, [t]: e.target.value } })}
                  aria-describedby={describedBy(`max-${t}`, true, !!err(`maxSlots.${t}`))}
                  className={inputClass}
                />
              </Field>
            ))}
          </div>
        </fieldset>
        <div>
          <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
            {save.pending ? "Saving…" : "Save ad settings"}
          </button>
        </div>
      </form>
    </Card>
  );
}

const PROVIDER_TEXT: Record<(typeof CMP_PROVIDER)[number], { label: string; help: string }> = {
  none: {
    label: "None yet",
    help: "Ads can't go live. Fine while the site is in preparation.",
  },
  google_privacy_messaging: {
    label: "Google Privacy & messaging (set up in AdSense)",
    help: "Google's own consent message, a certified CMP. Create and publish the European regulations message (and a US states message if you want one) in AdSense under Privacy & messaging. It loads with the AdSense code.",
  },
  certified_third_party: {
    label: "Another Google-certified CMP",
    help: "A consent platform from Google's list of certified CMPs (IAB TCF). Its script address is a deployment setting (CMP_SCRIPT_URL), not something this page can change.",
  },
};

export function ConsentForm({
  initial,
  scriptUrl,
}: {
  initial: { provider: (typeof CMP_PROVIDER)[number]; notes: string; privacyChoicesLink: boolean };
  scriptUrl: string | null;
}) {
  const [f, setF] = useState(initial);
  const save = useAdminAction();
  const err = save.fieldError;
  return (
    <Card title="Consent (privacy messages)">
      <form
        className="grid gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          save.run(() => saveConsentAction({ ...f }));
        }}
      >
        <ResultNotice result={save.result} />
        <p className="text-sm text-muted">
          Visitors in the EEA, the UK and Switzerland must be asked through a Google-certified consent platform before personalised ads load. A banner
          written for this site would not meet that requirement.
        </p>
        <fieldset className="grid gap-1">
          <legend className="mb-1 text-sm font-semibold">Consent platform</legend>
          {CMP_PROVIDER.map((p) => (
            <label key={p} className="flex min-h-11 items-start gap-2 py-1 text-sm">
              <input type="radio" name="provider" checked={f.provider === p} onChange={() => setF({ ...f, provider: p })} className={`${checkboxClass} mt-0.5`} />
              <span>
                <span className="font-medium">{PROVIDER_TEXT[p].label}</span>
                <span className="block text-xs text-muted">{PROVIDER_TEXT[p].help}</span>
              </span>
            </label>
          ))}
          {err("provider") ? <p className="text-sm font-medium text-hard">{err("provider")}</p> : null}
        </fieldset>
        {f.provider === "certified_third_party" ? (
          <p className="rounded-xl border border-line p-3 text-sm">
            Script address from the deployment:{" "}
            {scriptUrl ? <code className="break-all">{scriptUrl}</code> : <span className="font-semibold text-hard">not set (CMP_SCRIPT_URL), so ads stay off</span>}
          </p>
        ) : null}
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={f.privacyChoicesLink} onChange={(e) => setF({ ...f, privacyChoicesLink: e.target.checked })} className={checkboxClass} />
          Show the &quot;Privacy choices&quot; link in the footer (always shown while ads can load)
        </label>
        <Field id="consentNotes" label="Notes for other admins" optional help="For example which messages you published in AdSense and when." error={err("notes")}>
          <textarea
            id="consentNotes"
            rows={3}
            maxLength={500}
            value={f.notes}
            onChange={(e) => setF({ ...f, notes: e.target.value })}
            aria-describedby={describedBy("consentNotes", true, !!err("notes"))}
            className={inputClass}
          />
        </Field>
        <div>
          <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
            {save.pending ? "Saving…" : "Save consent settings"}
          </button>
        </div>
      </form>
    </Card>
  );
}

const PAGE_TYPE_LABEL: Record<(typeof AD_PAGE_TYPE)[number], string> = {
  home: "Home page",
  course_list: "Course list",
  course: "Course pages",
  topic: "Topic pages",
  lesson: "Lectures",
  exercise_list: "Question library",
  exercise: "Single questions",
  resource: "File pages",
  review: "Review pages",
};

interface ExclusionRow {
  id: string;
  kind: "path" | "course" | "page_type";
  pathGlob: string | null;
  courseTitle: string | null;
  pageType: (typeof AD_PAGE_TYPE)[number] | null;
  reason: string;
}

function describeExclusion(e: ExclusionRow): string {
  if (e.kind === "path") return `Pages matching ${e.pathGlob ?? "?"}`;
  if (e.kind === "course") return `Every page of ${e.courseTitle ?? "a deleted course"}`;
  return `All ${e.pageType ? PAGE_TYPE_LABEL[e.pageType].toLowerCase() : "pages of a removed type"}`;
}

export function ExclusionManager({ exclusions, courses }: { exclusions: ExclusionRow[]; courses: { id: string; title: string }[] }) {
  const empty = { kind: "path" as ExclusionRow["kind"], pathGlob: "", courseId: courses[0]?.id ?? "", pageType: "lesson" as (typeof AD_PAGE_TYPE)[number], reason: "" };
  const [open, setOpen] = useState(false);
  const [f, setF] = useState(empty);
  const add = useAdminAction<{ id: string }>();
  const remove = useAdminAction();
  const err = add.fieldError;
  return (
    <Card
      title="Exclusions"
      actions={
        open ? null : (
          <button
            type="button"
            className={buttonClass("secondary")}
            onClick={() => {
              add.setResult(null);
              setF(empty);
              setOpen(true);
            }}
          >
            <Plus aria-hidden="true" className="size-4" /> Add an exclusion
          </button>
        )
      }
    >
      <p className="mb-3 text-sm text-muted">Pages listed here never show ads, on top of the fixed list below.</p>
      <div className="grid gap-3">
        <ResultNotice result={remove.result} />
        {!open ? <ResultNotice result={add.result} /> : null}
        {exclusions.length === 0 ? (
          <p className="text-sm text-muted">No exclusions.</p>
        ) : (
          <ul className="grid gap-2">
            {exclusions.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line p-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{describeExclusion(e)}</p>
                  {e.reason ? <p className="text-sm text-muted">{e.reason}</p> : null}
                </div>
                <ConfirmButton
                  label="Remove"
                  confirmLabel="Remove exclusion"
                  question="Remove it?"
                  disabled={remove.pending}
                  onConfirm={() => {
                    add.setResult(null);
                    remove.run(() => deleteExclusionAction(e.id));
                  }}
                />
              </li>
            ))}
          </ul>
        )}
        {open ? (
          <form
            className="grid gap-4 rounded-xl border border-line p-4"
            onSubmit={(e) => {
              e.preventDefault();
              remove.setResult(null);
              add.run(() => createExclusionAction({ ...f }), { onSuccess: () => setOpen(false) });
            }}
          >
            <ResultNotice result={add.result && !add.result.ok ? add.result : null} />
            <fieldset className="grid gap-1">
              <legend className="mb-1 text-sm font-semibold">Exclude</legend>
              {(
                [
                  ["path", "Pages matching a path pattern"],
                  ["course", "A whole course"],
                  ["page_type", "A kind of page"],
                ] as const
              ).map(([kind, label]) => (
                <label key={kind} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="radio" name="kind" checked={f.kind === kind} onChange={() => setF({ ...f, kind })} className={checkboxClass} />
                  {label}
                </label>
              ))}
            </fieldset>
            {f.kind === "path" ? (
              <Field id="pathGlob" label="Path pattern" help="* is one part of the address, ** any number of parts. Example: /courses/*/lectures/introduction" error={err("pathGlob")}>
                <input
                  id="pathGlob"
                  value={f.pathGlob}
                  maxLength={200}
                  spellCheck={false}
                  placeholder="/courses/*/lectures/…"
                  onChange={(e) => setF({ ...f, pathGlob: e.target.value })}
                  aria-describedby={describedBy("pathGlob", true, !!err("pathGlob"))}
                  className={`${inputClass} font-mono`}
                />
              </Field>
            ) : null}
            {f.kind === "course" ? (
              <Field id="courseId" label="Course" error={err("courseId")}>
                <select id="courseId" value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })} className={inputClass}>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            {f.kind === "page_type" ? (
              <Field id="pageType" label="Kind of page" error={err("pageType")}>
                <select id="pageType" value={f.pageType} onChange={(e) => setF({ ...f, pageType: e.target.value as typeof f.pageType })} className={inputClass}>
                  {AD_PAGE_TYPE.map((t) => (
                    <option key={t} value={t}>
                      {PAGE_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <Field id="reason" label="Why" optional error={err("reason")}>
              <input id="reason" value={f.reason} maxLength={300} onChange={(e) => setF({ ...f, reason: e.target.value })} className={inputClass} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={buttonClass("primary")} disabled={add.pending}>
                {add.pending ? "Adding…" : "Add exclusion"}
              </button>
              <button type="button" className={buttonClass("ghost")} onClick={() => setOpen(false)}>
                Cancel
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </Card>
  );
}
