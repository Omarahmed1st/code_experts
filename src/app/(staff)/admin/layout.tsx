import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { isAdmin, visibleCourseIds } from "@/lib/auth/permissions";
import { listCourseNav } from "@/server/admin/courses";
import { mustChangePassword } from "@/server/admin/users";
import { adminAllowed, getSignedIn } from "@/server/auth/staff";
import { signOutAction } from "./actions";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin · Code_Expert" },
  robots: { index: false, follow: false },
};

/**
 * The admin shell. It shows nothing private without a signed-in staff member;
 * every page also checks access itself (requireStaff / requireCourse), so the
 * redirect to sign-in keeps the page's own address.
 */
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const staff = await getSignedIn();
  if (!adminAllowed(staff)) {
    return (
      <main id="main" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
    );
  }
  const [courses, mustChange] = await Promise.all([listCourseNav(visibleCourseIds(staff)), mustChangePassword(staff.id)]);
  return (
    <AdminShell staff={staff} courses={courses} isAdmin={isAdmin(staff)} signOut={signOutAction}>
      {mustChange ? (
        <p role="status" className="mb-6 rounded-xl border border-medium/40 bg-medium-soft px-4 py-3 text-sm text-ink">
          You are using a temporary password.{" "}
          <Link href="/admin/account" className="font-semibold underline">
            Choose your own password
          </Link>
          .
        </p>
      ) : null}
      {children}
    </AdminShell>
  );
}
