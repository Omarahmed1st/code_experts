"use server";

import { requestMeta } from "@/server/auth/request";
import { submitContact } from "@/server/contact";

export interface ContactState {
  sent: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  values: { name: string; email: string; subject: string; body: string };
}

export async function sendContactAction(_previous: ContactState, form: FormData): Promise<ContactState> {
  const values = {
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    subject: String(form.get("subject") ?? ""),
    body: String(form.get("body") ?? ""),
  };
  const meta = await requestMeta();
  const result = await submitContact({
    ...values,
    trap: form.get("website"),
    shownAt: form.get("shown_at"),
    turnstileToken: form.get("cf-turnstile-response"),
    ip: meta.ip,
  });
  if (!result.ok) return { sent: false, error: result.error, fieldErrors: result.fieldErrors ?? {}, values };
  return { sent: true, error: null, fieldErrors: {}, values: { name: "", email: "", subject: "", body: "" } };
}
