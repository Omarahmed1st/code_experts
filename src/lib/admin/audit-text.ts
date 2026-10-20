// Plain-words descriptions of audit log actions, for the admin's activity lists.

const VERBS: Record<string, string> = {
  create: "created",
  update: "edited",
  publish: "published",
  schedule: "scheduled",
  unpublish: "moved back to draft",
  archive: "archived",
  delete: "deleted",
  restore: "restored an earlier version of",
  reorder: "reordered",
  duplicate: "duplicated",
  upload: "uploaded a file to",
  remove_file: "removed a file from",
  import: "imported",
  attach: "changed the files of",
  disable: "disabled",
  enable: "enabled",
  reset_password: "set a new password for",
  sign_out_everywhere: "signed out every session of",
  roles: "changed the roles of",
  change_password: "changed the password of",
  replace_file: "replaced the file of",
  add_model: "added a model to",
  rename: "renamed the address of",
  update_roles: "changed the roles of",
  sign_in: "signed in",
  sign_out: "signed out",
  settings: "changed",
  owner_update: "changed",
  read: "marked as read",
  archived: "archived",
  new: "marked as unread",
};

const NOUNS: Record<string, string> = {
  course: "course",
  topic: "topic",
  lesson: "lecture",
  exercise: "question",
  quiz: "quiz",
  exam_template: "practice exam",
  resource: "file",
  user: "account",
  student: "student account",
  course_staff: "course staff",
  seo: "search settings of a page",
  ad_placement: "ad placement",
  ad_exclusion: "ad exclusion",
  site_settings: "site settings",
  consent_configuration: "consent settings",
  contact_message: "contact message",
};

/** Entries that read as a whole sentence, without "<who> did". */
export const SENTENCES: Record<string, string> = {
  "user.create_admin_cli": "An administrator account was set up from the command line",
};

/** "edited the lecture", "signed in", … from "lesson.update", "auth.sign_in". */
export function describeAction(action: string, entityType: string): string {
  // "lesson.update", or three parts for newer areas: "ads.placement.create" (the verb is always last).
  const parts = action.split(".");
  const area = parts[0];
  const verb = parts.length > 1 ? parts[parts.length - 1]! : "";
  const v = VERBS[verb] ?? verb.replace(/_/g, " ");
  if (area === "auth") return v;
  const noun = NOUNS[entityType] ?? entityType.replace(/_/g, " ");
  return `${v} ${verb === "import" ? "" : "the "}${noun}${verb === "import" ? "s" : ""}`.replace(/\s+/g, " ").trim();
}

/** The title or name recorded with the entry, if any. */
export function auditSubject(afterState: string | null): string | null {
  if (!afterState) return null;
  try {
    const data = JSON.parse(afterState) as Record<string, unknown>;
    const value = data.title ?? data.name ?? data.email ?? data.filename ?? data.slug;
    return typeof value === "string" ? value : null;
  } catch {
    return null;
  }
}
