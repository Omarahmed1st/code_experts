// Pieces shared by the legal pages (privacy, terms, cookies, advertising).
// Facts only the site's owner can give come from /admin/site. When one is
// missing the page shows a marked gap instead of a made-up name, address or
// email, and the whole page says it is a draft until the owner confirms a
// review.
import type { ReactNode } from "react";
import { type SiteOwner, missingOwnerFacts } from "@/lib/site/owner";

/** The owner's value, or a visible gap saying what is still needed. */
export function Fact({ value, need }: { value: string | null; need: string }) {
  if (value) return <>{value}</>;
  return <mark className="legal-gap">[to be added by the site owner: {need}]</mark>;
}

export function DraftNotice({ owner, page }: { owner: SiteOwner; page: string }) {
  const missing = missingOwnerFacts(owner);
  if (owner.legalReviewed && missing.length === 0) return null;
  return (
    <div role="note" className="legal-draft">
      <p className="font-semibold">Draft {page}, not yet reviewed</p>
      <p>
        This text describes what the site actually does today, but it has not been reviewed by a lawyer
        {missing.length ? " and some details about who runs the site are still missing (marked in yellow)" : ""}. It may change before
        it is final.
      </p>
    </div>
  );
}

export function EffectiveDate({ owner }: { owner: SiteOwner }) {
  return (
    <p className="text-sm text-muted">
      Effective date: <Fact value={owner.effectiveDate} need="the date this takes effect" />
    </p>
  );
}

/** A plain table inside the prose that scrolls sideways on narrow screens; the scroll box can take keyboard focus so it can be scrolled without a mouse. */
export function LegalTable({ label, head, rows }: { label: string; head: string[]; rows: ReactNode[][] }) {
  return (
    // tabIndex: a scrolling region must be reachable by keyboard (WCAG 2.1.1).
    <div className="legal-table-wrap" role="region" aria-label={label} tabIndex={0}>
      <table className="legal-table">
        <thead>
          <tr>
            {head.map((h) => (
              <th key={h} scope="col">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
