import { ExternalLink, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ActivityList } from "@/components/admin/activity-list";
import { Card, Notice, StatusBadge } from "@/components/admin/form-parts";
import { buttonClass } from "@/components/ui/button-styles";
import { isAdmin, visibleCourseIds } from "@/lib/auth/permissions";
import { listAudit } from "@/server/admin/audit";
import { listAdminCourses } from "@/server/admin/courses";
import { countStudents } from "@/server/admin/students";
import { requireStaff } from "@/server/auth/staff";
import { getConfig, getTurnstileKeys, hasAssessmentSecret } from "@/server/platform/env";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboard() {
  const staff = await requireStaff("/admin");
  const ids = visibleCourseIds(staff);
  const admin = isAdmin(staff);
  const [courses, activity, students] = await Promise.all([listAdminCourses(ids), listAudit({ courseIds: ids, limit: 12 }), admin ? countStudents() : null]);
  const { appEnv } = getConfig();
  const setup: string[] = [];
  if (admin && appEnv !== "local") {
    if (!getTurnstileKeys()) setup.push("Turnstile isn't set up, so the sign-in form relies on rate limits alone. Set TURNSTILE_SITE_KEY and the TURNSTILE_SECRET_KEY secret.");
    if (!hasAssessmentSecret()) setup.push("ASSESSMENT_SECRET isn't set, so quizzes and practice exams can't start. Set it with `wrangler secret put ASSESSMENT_SECRET`.");
  }

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <p className="lec-chapter text-muted">
            <b>00</b>
            <i />
            Dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold">Hello{staff.name ? `, ${staff.name.split(" ")[0]}` : ""}</h1>
          <p className="mt-1 text-muted">
            {admin ? "You can manage every course, staff accounts and the audit log." : "These are the courses you can edit."}
          </p>
          {students ? (
            <p className="mt-1 text-sm">
              <Link href="/admin/students" className="font-semibold text-primary-text hover:underline">
                {students.total} student account{students.total === 1 ? "" : "s"}
              </Link>
              , {students.newLast30Days} new in the last 30 days.
            </p>
          ) : null}
        </div>
        {admin ? (
          <Link href="/admin/courses/new" className={buttonClass("primary", "ml-auto")}>
            <Plus aria-hidden="true" className="size-4" /> New course
          </Link>
        ) : null}
      </div>

      {setup.length > 0 ? (
        <Notice tone="warn">
          <p className="font-semibold">Finish setting up production</p>
          <ul className="mt-1 list-disc pl-5">
            {setup.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <section aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="sr-only">
          Courses
        </h2>
        <ul className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {courses.map((course) => (
            <li key={course.id} className="flex flex-col rounded-[var(--radius-card)] border border-line bg-surface p-5 shadow-[var(--cl-shadow)]">
              <div className="flex items-start gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold leading-snug">
                    <Link href={`/admin/courses/${course.slug}`} className="hover:underline">
                      {course.title}
                    </Link>
                  </h3>
                  <p className="mt-0.5 font-mono text-xs text-muted">/courses/{course.slug}</p>
                </div>
                <span className="ml-auto shrink-0">
                  <StatusBadge status={course.status} />
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                {[
                  ["Lectures live", course.counts.liveLectures],
                  ["Drafts", course.counts.draftLectures],
                  ["Scheduled", course.counts.scheduledLectures],
                  ["Questions", course.counts.publishedQuestions],
                  ["Quizzes", course.counts.quizzes],
                  ["Files", course.counts.resources],
                ].map(([label, value]) => (
                  <div key={label as string} className="rounded-xl bg-surface-2 px-2 py-2.5">
                    <dt className="text-xs text-muted">{label}</dt>
                    <dd className="font-mono text-xl font-bold">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-5 flex flex-wrap gap-2 pt-1">
                <Link href={`/admin/courses/${course.slug}/lectures`} className={buttonClass("secondary", "flex-1")}>
                  Lectures
                </Link>
                <Link href={`/admin/courses/${course.slug}/questions`} className={buttonClass("secondary", "flex-1")}>
                  Questions
                </Link>
                {course.status === "published" ? (
                  <Link href={`/courses/${course.slug}`} className={buttonClass("ghost")} aria-label={`View ${course.shortTitle} on the site`}>
                    <ExternalLink aria-hidden="true" className="size-4" />
                  </Link>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <Card title="Recent activity" actions={admin ? <Link href="/admin/audit-log" className="text-sm font-semibold text-primary-text hover:underline">Full audit log</Link> : null}>
        <ActivityList rows={activity} />
      </Card>
    </div>
  );
}
