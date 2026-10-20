// Site-wide facts and the contact inbox in the admin (Phase 6). Administrators
// only; every change is audited.
import { isAdmin } from "@/lib/auth/permissions";
import { getBindings } from "@/server/platform/env";
import { SITE_OWNER_KEY, type SiteOwner, getSiteOwner, validDate, validEmail, validVerificationToken } from "@/server/site/owner";
import { auditStatement } from "./audit";
import { type Actor, type AdminResult, done, fail, str } from "./context";

const ADMIN_ONLY = "Only administrators can change the site's details.";

export async function saveSiteOwner(actor: Actor, raw: Record<string, unknown>): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const errors: Record<string, string> = {};
  const operatorName = str(raw.operatorName, 120) || null;
  const emailText = str(raw.contactEmail, 254);
  if (emailText && !validEmail(emailText)) errors.contactEmail = "Enter a real email address, or leave it empty.";
  const country = str(raw.country, 80) || null;
  const dateText = str(raw.effectiveDate, 10);
  if (dateText && !validDate(dateText)) errors.effectiveDate = "Use the date picker (YYYY-MM-DD).";
  const tokenText = str(raw.searchConsoleToken, 100);
  if (tokenText && !validVerificationToken(tokenText)) {
    errors.searchConsoleToken = "Paste only the content=\"…\" value from Search Console's HTML tag (letters, digits, - and _).";
  }
  if (Object.keys(errors).length) return fail(Object.values(errors)[0]!, errors);
  const value: SiteOwner = {
    operatorName,
    contactEmail: emailText || null,
    country,
    effectiveDate: dateText || null,
    legalReviewed: raw.legalReviewed === true,
    searchConsoleToken: tokenText || null,
    adsenseMetaTag: raw.adsenseMetaTag === true,
  };
  if (value.legalReviewed && (!value.operatorName || !value.contactEmail || !value.effectiveDate)) {
    return fail("The legal pages can only be marked as reviewed once the name, contact email and date are filled in.", {
      legalReviewed: "Fill in the details above first.",
    });
  }
  const before = await getSiteOwner();
  const { db } = getBindings();
  const now = Date.now();
  await db.batch([
    db
      .prepare(
        `INSERT INTO site_settings (key, value, updated_by, updated_at) VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT (key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
      )
      .bind(SITE_OWNER_KEY, JSON.stringify(value), actor.staff.id, now),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "site.owner_update", entityType: "site_settings", entityId: SITE_OWNER_KEY, before, after: value, ip: actor.ip }, now),
  ]);
  return done(undefined, "Saved.");
}

// ---------------------------------------------------------------- contact inbox

export interface ContactMessageRow {
  id: string;
  name: string;
  email: string;
  subject: string;
  body: string;
  status: "new" | "read" | "archived";
  createdAt: number;
}

export async function listContactMessages(actor: Actor, status: "open" | "archived"): Promise<ContactMessageRow[]> {
  if (!isAdmin(actor.staff)) return [];
  const { results } = await getBindings()
    .db.prepare(
      `SELECT id, name, email, subject, body, status, created_at AS createdAt FROM contact_messages
        WHERE ${status === "archived" ? "status = 'archived'" : "status IN ('new', 'read')"}
        ORDER BY created_at DESC LIMIT 200`,
    )
    .all<ContactMessageRow>();
  return results;
}

export async function countNewMessages(): Promise<number> {
  const row = await getBindings().db.prepare("SELECT count(*) AS n FROM contact_messages WHERE status = 'new'").first<{ n: number }>();
  return Number(row?.n ?? 0);
}

export async function setMessageStatus(actor: Actor, id: unknown, status: unknown): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  if (status !== "new" && status !== "read" && status !== "archived") return fail("Unknown status.");
  const { db } = getBindings();
  const found = await db.prepare("SELECT id FROM contact_messages WHERE id = ?").bind(str(id, 64)).first<{ id: string }>();
  if (!found) return fail("That message doesn't exist any more.");
  const now = Date.now();
  await db.batch([
    db.prepare("UPDATE contact_messages SET status = ? WHERE id = ?").bind(status, found.id),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: `contact.${status}`, entityType: "contact_message", entityId: found.id, ip: actor.ip }, now),
  ]);
  return done(undefined);
}

/** Deletes a message for good (for example on a privacy request). The audit entry keeps no message text. */
export async function deleteContactMessage(actor: Actor, id: unknown): Promise<AdminResult> {
  if (!isAdmin(actor.staff)) return fail(ADMIN_ONLY);
  const { db } = getBindings();
  const found = await db.prepare("SELECT id FROM contact_messages WHERE id = ?").bind(str(id, 64)).first<{ id: string }>();
  if (!found) return fail("That message doesn't exist any more.");
  const now = Date.now();
  await db.batch([
    db.prepare("DELETE FROM contact_messages WHERE id = ?").bind(found.id),
    auditStatement({ actorId: actor.staff.id, courseId: null, action: "contact.delete", entityType: "contact_message", entityId: found.id, ip: actor.ip }, now),
  ]);
  return done(undefined, "Message deleted.");
}
