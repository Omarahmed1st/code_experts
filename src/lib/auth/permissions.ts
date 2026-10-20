// Who may do what in the admin. Pure, so it is unit-tested on its own; the
// server checks it on every admin page and action (never only in the UI).
//
// Site roles (user_roles):  admin   everything, in every course, plus users and site settings
//                           editor  only the courses listed for them in course_staff
// Course roles (course_staff, for editors):
//                           course_admin  edit, publish, unpublish and delete in that course
//                           editor        create and edit in that course; publishing is for a course admin
// Students (Phase 5) have no admin access.

export type SiteRole = "admin" | "editor" | "student";
export type CourseRole = "course_admin" | "editor";

export interface Staff {
  id: string;
  email: string;
  name: string;
  siteRoles: readonly SiteRole[];
  /** course_id -> role, from course_staff. */
  courseRoles: Readonly<Record<string, CourseRole>>;
}

export type CourseAction =
  | "view" // open the course in the admin
  | "edit" // create and change lectures, questions, quizzes, resources, topics
  | "publish" // publish, schedule, unpublish, archive
  | "delete" // delete content
  | "settings"; // change the course's own title, description, order

export type SiteAction = "createCourse" | "deleteCourse" | "manageUsers" | "viewAuditLog" | "manageAds" | "manageSite" | "readMessages";

export const isAdmin = (staff: Staff) => staff.siteRoles.includes("admin");

/** Admins, and editors with at least one course, can open the admin. */
export function canOpenAdmin(staff: Staff): boolean {
  return isAdmin(staff) || (staff.siteRoles.includes("editor") && Object.keys(staff.courseRoles).length > 0);
}

/** "admin" for site admins, the course_staff role for editors, or null (no access). */
export function roleInCourse(staff: Staff, courseId: string): "admin" | CourseRole | null {
  if (isAdmin(staff)) return "admin";
  if (!staff.siteRoles.includes("editor")) return null;
  return staff.courseRoles[courseId] ?? null;
}

const COURSE_RULES: Record<"admin" | CourseRole, readonly CourseAction[]> = {
  admin: ["view", "edit", "publish", "delete", "settings"],
  course_admin: ["view", "edit", "publish", "delete", "settings"],
  editor: ["view", "edit"],
};

export function can(staff: Staff, action: CourseAction, courseId: string): boolean {
  const role = roleInCourse(staff, courseId);
  return role !== null && COURSE_RULES[role].includes(action);
}

export function canSite(staff: Staff, action: SiteAction): boolean {
  void action;
  return isAdmin(staff);
}

/** The course ids an account may open; null means every course (site admins). */
export function visibleCourseIds(staff: Staff): string[] | null {
  if (isAdmin(staff)) return null;
  if (!staff.siteRoles.includes("editor")) return [];
  return Object.keys(staff.courseRoles);
}

export const ROLE_LABEL: Record<"admin" | CourseRole, string> = {
  admin: "Administrator",
  course_admin: "Course admin",
  editor: "Editor",
};

/**
 * The title shown next to the account's name in the site header: the highest
 * role the account holds (course roles count only for editors, as in can()).
 */
export function accountTitle(staff: Staff): string {
  if (isAdmin(staff)) return ROLE_LABEL.admin;
  if (staff.siteRoles.includes("editor")) {
    return Object.values(staff.courseRoles).includes("course_admin") ? ROLE_LABEL.course_admin : ROLE_LABEL.editor;
  }
  return "Student";
}
