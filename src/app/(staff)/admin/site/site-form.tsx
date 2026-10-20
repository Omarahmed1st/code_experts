"use client";

// The facts only the site's owner can give: who runs it, a contact email, the
// country, the policies' date, and the verification tokens for Google. The
// legal pages show as drafts until these are filled in and reviewed.
import { useState } from "react";
import { ResultNotice } from "@/components/admin/action-parts";
import { Card, Field, describedBy, inputClass } from "@/components/admin/form-parts";
import { useAdminAction } from "@/components/admin/use-admin-action";
import { buttonClass } from "@/components/ui/button-styles";
import { saveSiteOwnerAction } from "./actions";

export interface SiteOwnerFields {
  operatorName: string;
  contactEmail: string;
  country: string;
  effectiveDate: string;
  legalReviewed: boolean;
  searchConsoleToken: string;
  adsenseMetaTag: boolean;
}

const checkboxClass = "size-4 accent-[var(--cl-primary)]";

export function SiteOwnerForm({ initial, hasPublisherId }: { initial: SiteOwnerFields; hasPublisherId: boolean }) {
  const [f, setF] = useState(initial);
  const save = useAdminAction();
  const err = save.fieldError;
  return (
    <form
      className="grid gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        save.run(() => saveSiteOwnerAction({ ...f }));
      }}
    >
      <ResultNotice result={save.result} />
      <Card title="Who runs Code_Expert">
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="operatorName" label="Name shown in the policies" help="Your name, or your organisation's registered name." error={err("operatorName")}>
            <input
              id="operatorName"
              value={f.operatorName}
              maxLength={120}
              onChange={(e) => setF({ ...f, operatorName: e.target.value })}
              aria-describedby={describedBy("operatorName", true, !!err("operatorName"))}
              className={inputClass}
            />
          </Field>
          <Field id="contactEmail" label="Contact email" help="Shown on the privacy policy and contact page for privacy requests." error={err("contactEmail")}>
            <input
              id="contactEmail"
              type="email"
              value={f.contactEmail}
              maxLength={254}
              autoComplete="off"
              onChange={(e) => setF({ ...f, contactEmail: e.target.value })}
              aria-describedby={describedBy("contactEmail", true, !!err("contactEmail"))}
              className={inputClass}
            />
          </Field>
          <Field id="country" label="Country it is run from" error={err("country")}>
            <input id="country" value={f.country} maxLength={80} onChange={(e) => setF({ ...f, country: e.target.value })} className={inputClass} />
          </Field>
          <Field id="effectiveDate" label="Policies take effect on" error={err("effectiveDate")}>
            <input
              id="effectiveDate"
              type="date"
              value={f.effectiveDate}
              onChange={(e) => setF({ ...f, effectiveDate: e.target.value })}
              aria-describedby={describedBy("effectiveDate", false, !!err("effectiveDate"))}
              className={inputClass}
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-1">
          <label className="flex min-h-11 items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={f.legalReviewed} onChange={(e) => setF({ ...f, legalReviewed: e.target.checked })} className={checkboxClass} aria-describedby="legalReviewed-help" />
            The privacy policy, terms and cookie policy have been reviewed
          </label>
          <p id="legalReviewed-help" className="text-xs text-muted">
            Tick this only after someone qualified has checked the texts against the laws that apply to you. Until then the pages say they are drafts.
          </p>
          {err("legalReviewed") ? <p className="text-sm font-medium text-hard">{err("legalReviewed")}</p> : null}
        </div>
      </Card>
      <Card title="Google verification">
        <div className="grid gap-4">
          <Field
            id="searchConsoleToken"
            label="Search Console verification"
            optional
            help={'In Search Console choose "HTML tag" and paste only the content="…" value. It goes on the home page as <meta name="google-site-verification">.'}
            error={err("searchConsoleToken")}
          >
            <input
              id="searchConsoleToken"
              value={f.searchConsoleToken}
              maxLength={100}
              autoComplete="off"
              spellCheck={false}
              onChange={(e) => setF({ ...f, searchConsoleToken: e.target.value.trim() })}
              aria-describedby={describedBy("searchConsoleToken", true, !!err("searchConsoleToken"))}
              className={`${inputClass} font-mono`}
            />
          </Field>
          <div className="grid gap-1">
            <label className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.adsenseMetaTag}
                onChange={(e) => setF({ ...f, adsenseMetaTag: e.target.checked })}
                className={checkboxClass}
                aria-describedby="adsenseMetaTag-help"
              />
              Add the AdSense site-ownership meta tag to the home page
            </label>
            <p id="adsenseMetaTag-help" className="text-xs text-muted">
              One of the ways AdSense lets you prove you own the site when you add it. It uses the publisher id from the advertising page
              {hasPublisherId ? "." : ", which isn't set yet, so nothing is added."} It loads no ad code.
            </p>
          </div>
        </div>
      </Card>
      <div>
        <button type="submit" className={buttonClass("primary")} disabled={save.pending}>
          {save.pending ? "Saving…" : "Save site details"}
        </button>
      </div>
    </form>
  );
}
