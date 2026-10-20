// Facts about who runs the site, for the legal and trust pages (Phase 6), and
// the rules for reading them. Only the owner can supply them, so every field
// starts empty and the pages say plainly what is missing instead of inventing a
// name, an address or an email. Loaded by src/server/site/owner.ts.
export interface SiteOwner {
  /** The person or organisation responsible for the site, as it should appear in the policies. */
  operatorName: string | null;
  /** A public contact email for privacy and other questions. */
  contactEmail: string | null;
  /** Where the operator is based (country), for the policies. */
  country: string | null;
  /** The date the policies take effect (YYYY-MM-DD). */
  effectiveDate: string | null;
  /** The owner confirms a qualified person has reviewed the legal texts. Until then they show as drafts. */
  legalReviewed: boolean;
  /** Google Search Console HTML-tag verification token (the content="…" value). */
  searchConsoleToken: string | null;
  /** Put AdSense's <meta name="google-adsense-account"> on the home page (needs the publisher id). */
  adsenseMetaTag: boolean;
}

export const EMPTY_OWNER: SiteOwner = {
  operatorName: null,
  contactEmail: null,
  country: null,
  effectiveDate: null,
  legalReviewed: false,
  searchConsoleToken: null,
  adsenseMetaTag: false,
};

const text = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export function validEmail(v: unknown): v is string {
  return typeof v === "string" && v.length <= 254 && /^[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+$/.test(v);
}

export function validDate(v: unknown): v is string {
  return typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(`${v}T00:00:00Z`));
}

/** Search Console tokens are letters, digits, - and _ (the content of its meta tag). */
export function validVerificationToken(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{10,100}$/.test(v);
}

export function parseSiteOwner(raw: unknown): SiteOwner {
  if (!raw || typeof raw !== "object") return { ...EMPTY_OWNER };
  const r = raw as Record<string, unknown>;
  return {
    operatorName: text(r.operatorName, 120),
    contactEmail: validEmail(r.contactEmail) ? r.contactEmail : null,
    country: text(r.country, 80),
    effectiveDate: validDate(r.effectiveDate) ? r.effectiveDate : null,
    legalReviewed: r.legalReviewed === true,
    searchConsoleToken: validVerificationToken(r.searchConsoleToken) ? r.searchConsoleToken : null,
    adsenseMetaTag: r.adsenseMetaTag === true,
  };
}


/** What the owner still has to supply before the legal pages can stop being drafts. */
export function missingOwnerFacts(owner: SiteOwner): string[] {
  return [
    owner.operatorName ? null : "who runs the site (a person's or organisation's name)",
    owner.contactEmail ? null : "a contact email for privacy questions",
    owner.country ? null : "the country the site is run from",
    owner.effectiveDate ? null : "the date the policies take effect",
  ].filter((x): x is string => x !== null);
}
