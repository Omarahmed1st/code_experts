"use client";

// Create or edit one ad placement. The position comes from a fixed list; the
// ad unit id is digits only. The server checks both again.
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ConfirmButton, ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, Notice, describedBy, inputClass } from "@/components/admin/form-parts";
import { keepResult, useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { AD_DEVICES, AD_FORMAT } from "@/db/enums";
import { createPlacementAction, deletePlacementAction, updatePlacementAction } from "../actions";

export interface PlacementFields {
  placementKey: string;
  adUnitId: string;
  format: (typeof AD_FORMAT)[number];
  responsive: boolean;
  devices: (typeof AD_DEVICES)[number];
  minHeightPx: string;
  enabled: boolean;
  description: string;
}

export interface PositionChoice {
  key: string;
  label: string;
  where: string;
  templateLabel: string;
}

const FORMAT_LABEL: Record<(typeof AD_FORMAT)[number], string> = {
  auto: "Responsive (auto): Google picks the size",
  fluid: "Fluid (in-article and in-feed units)",
  rectangle: "Rectangle",
  horizontal: "Horizontal",
  vertical: "Vertical",
};

const DEVICES_LABEL: Record<(typeof AD_DEVICES)[number], string> = {
  all: "All screen sizes",
  desktop: "Wide screens only (1024 px and up)",
  mobile: "Narrow screens only (below 1024 px)",
};

const checkboxClass = "size-4 accent-[var(--cl-primary)]";

export function PlacementForm({ id, initial, positions }: { id: string | null; initial: PlacementFields; positions: PositionChoice[] }) {
  const router = useRouter();
  const [f, setF] = useState(initial);
  const [dirty, setDirty] = useState(false);
  const save = useAdminAction<unknown>(id ? `placement:${id}` : undefined);
  const remove = useAdminAction();
  const err = save.fieldError;
  const set = (next: PlacementFields) => {
    setF(next);
    setDirty(true);
  };
  const chosen = positions.find((p) => p.key === f.placementKey);

  if (!id && positions.length === 0) {
    return <Notice tone="info">Every position already has a placement. Edit one of them on the advertising page.</Notice>;
  }

  return (
    <div className="grid gap-6">
      <Card title="Placement">
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            remove.setResult(null);
            const input = { ...f, minHeightPx: Number(f.minHeightPx) };
            if (id) {
              save.run(() => updatePlacementAction(id, input), { keep: true, onSuccess: () => setDirty(false) });
            } else {
              save.run(() => createPlacementAction(input), {
                refresh: false,
                onSuccess: (v, message) => {
                  const newId = (v as { id: string }).id;
                  keepResult(`placement:${newId}`, message);
                  router.replace(`/admin/ads/placements/${newId}`);
                },
              });
            }
          }}
        >
          <ResultNotice result={save.result} />
          {id ? (
            <div>
              <p className="text-sm font-semibold">Position</p>
              <p className="mt-1">
                {chosen ? `${chosen.templateLabel}: ${chosen.label}` : f.placementKey} <code className="ml-1 text-xs text-muted">{f.placementKey}</code>
              </p>
              {chosen ? <p className="text-sm text-muted">{chosen.where}</p> : null}
              <p className="mt-1 text-xs text-muted">To use another position, delete this placement and create a new one.</p>
            </div>
          ) : (
            <Field id="placementKey" label="Position" help={chosen?.where} error={err("placementKey")}>
              <select
                id="placementKey"
                value={f.placementKey}
                onChange={(e) => set({ ...f, placementKey: e.target.value })}
                aria-describedby={describedBy("placementKey", !!chosen, !!err("placementKey"))}
                className={inputClass}
              >
                {positions.map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.templateLabel}: {p.label}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field
            id="adUnitId"
            label="Ad unit id"
            optional
            help={'The data-ad-slot number from the ad unit’s code in AdSense (Ads > By ad unit). Digits only. Leave it empty until you have created the unit.'}
            error={err("adUnitId")}
          >
            <input
              id="adUnitId"
              value={f.adUnitId}
              inputMode="numeric"
              maxLength={20}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => set({ ...f, adUnitId: e.target.value.trim() })}
              aria-describedby={describedBy("adUnitId", true, !!err("adUnitId"))}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field id="format" label="Format" help="Use the format the unit was created with in AdSense." error={err("format")}>
              <select
                id="format"
                value={f.format}
                onChange={(e) => set({ ...f, format: e.target.value as PlacementFields["format"] })}
                aria-describedby={describedBy("format", true, !!err("format"))}
                className={inputClass}
              >
                {AD_FORMAT.map((v) => (
                  <option key={v} value={v}>
                    {FORMAT_LABEL[v]}
                  </option>
                ))}
              </select>
            </Field>
            <Field id="devices" label="Show on" error={err("devices")}>
              <select id="devices" value={f.devices} onChange={(e) => set({ ...f, devices: e.target.value as PlacementFields["devices"] })} className={inputClass}>
                {AD_DEVICES.map((v) => (
                  <option key={v} value={v}>
                    {DEVICES_LABEL[v]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              id="minHeightPx"
              label="Space kept for the ad (pixels)"
              help="Reserved before the ad loads so the text doesn't jump. 50 to 1000."
              error={err("minHeightPx")}
            >
              <input
                id="minHeightPx"
                type="number"
                inputMode="numeric"
                min={50}
                max={1000}
                value={f.minHeightPx}
                onChange={(e) => set({ ...f, minHeightPx: e.target.value })}
                aria-describedby={describedBy("minHeightPx", true, !!err("minHeightPx"))}
                className={inputClass}
              />
            </Field>
            <div className="grid content-start gap-1 pt-7">
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input type="checkbox" checked={f.responsive} onChange={(e) => set({ ...f, responsive: e.target.checked })} className={checkboxClass} />
                Full-width on phones (data-full-width-responsive)
              </label>
            </div>
          </div>
          <Field id="description" label="Note" optional help="For other admins, for example the ad unit's name in AdSense." error={err("description")}>
            <input id="description" value={f.description} maxLength={300} onChange={(e) => set({ ...f, description: e.target.value })} className={inputClass} />
          </Field>
          <div className="grid gap-1">
            <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
              <input type="checkbox" checked={f.enabled} onChange={(e) => set({ ...f, enabled: e.target.checked })} className={checkboxClass} aria-describedby="placement-enabled-help" />
              Placement on
            </label>
            <p id="placement-enabled-help" className="text-xs text-muted">
              Needs an ad unit id. Even when on, nothing loads until every item on the advertising checklist passes.
            </p>
            {err("enabled") ? <p className="text-sm font-medium text-hard">{err("enabled")}</p> : null}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
              {save.pending ? "Saving…" : id ? "Save" : "Create placement"}
            </button>
            {dirty ? <span className="text-sm text-muted">Unsaved changes</span> : null}
          </div>
        </form>
      </Card>
      {id ? (
        <Card title="Delete">
          <div className="grid gap-3">
            <ResultNotice result={remove.result} />
            <p className="text-sm text-muted">The position goes back to showing nothing. The audit log keeps a record.</p>
            <div>
              <ConfirmButton
                label="Delete placement"
                confirmLabel="Delete"
                question="Delete this placement?"
                disabled={remove.pending}
                onConfirm={() => {
                  save.setResult(null);
                  remove.run(() => deletePlacementAction(id), { refresh: false, onSuccess: () => router.replace("/admin/ads") });
                }}
              />
            </div>
          </div>
        </Card>
      ) : null}
    </div>
  );
}
