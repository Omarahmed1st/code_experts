import { BookOpen, FileText, HelpCircle, ListChecks } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { formatWhen } from "@/components/dashboard/progress-bar";
import { RemoveBookmark } from "@/components/dashboard/remove-bookmark";
import { PageHero } from "@/components/layout/page-hero";
import { requireAccount } from "@/server/auth/account";
import { resolveCourse } from "@/server/courses/scope";
import { BOOKMARK_KINDS, type BookmarkKind, listBookmarks } from "@/server/students/progress";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ course: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const course = await resolveCourse((await params).course);
  return { title: course ? `My bookmarks | ${course.shortTitle}` : "My bookmarks", robots: { index: false, follow: false } };
}

const GROUP: Record<BookmarkKind, { title: string; Icon: typeof BookOpen }> = {
  lecture: { title: "Lectures", Icon: BookOpen },
  question: { title: "Questions", Icon: HelpCircle },
  quiz: { title: "Quizzes", Icon: ListChecks },
  file: { title: "Files", Icon: FileText },
};

export default async function BookmarksPage({ params }: Props) {
  const slug = (await params).course;
  const user = await requireAccount(`/dashboard/${slug}/bookmarks`);
  const course = await resolveCourse(slug);
  if (!course) notFound();
  const bookmarks = await listBookmarks(user.id, course);

  return (
    <>
      <PageHero
        crumbs={[
          { label: "Home", href: "/" },
          { label: "My dashboard", href: "/dashboard" },
          { label: course.shortTitle, href: `/dashboard/${course.slug}` },
          { label: "Bookmarks" },
        ]}
        chapter={{ label: course.shortTitle }}
        title="My *bookmarks*"
        description="Lectures, questions, quizzes and files you saved in this course. Use the Bookmark button on any of them to add it here."
      />
      <DashboardNav courseSlug={course.slug} courseTitle={course.title} current="bookmarks" />

      <div className="mx-auto grid grid-cols-[minmax(0,1fr)] max-w-4xl gap-8 px-4 pt-8 sm:px-6">
        {bookmarks.length === 0 ? (
          <p className="text-muted">
            No bookmarks yet. Open a{" "}
            <Link href={`/courses/${course.slug}/lectures`} className="font-semibold text-primary-text hover:underline">
              lecture
            </Link>{" "}
            or a{" "}
            <Link href={`/courses/${course.slug}/practice`} className="font-semibold text-primary-text hover:underline">
              question
            </Link>{" "}
            and press Bookmark.
          </p>
        ) : null}
        {BOOKMARK_KINDS.map((kind) => {
          const items = bookmarks.filter((b) => b.kind === kind).sort((a, b) => b.createdAt - a.createdAt);
          if (items.length === 0) return null;
          const { title, Icon } = GROUP[kind];
          return (
            <section key={kind} aria-labelledby={`bm-${kind}`}>
              <h2 id={`bm-${kind}`} className="flex items-center gap-2 text-xl font-bold">
                <Icon aria-hidden="true" className="size-5 text-primary-text" />
                {title} <span className="font-mono text-base text-muted">({items.length})</span>
              </h2>
              <ul className="mt-3 divide-y divide-line rounded-[var(--radius-card)] border border-line bg-surface">
                {items.map((b) => (
                  <li key={b.slug} className="flex items-center gap-2 pr-2">
                    <Link href={b.href} className="flex min-h-12 min-w-0 flex-1 flex-wrap items-center gap-x-3 px-4 py-2 hover:bg-surface-2">
                      <span className="min-w-0 flex-1 font-semibold">{b.title}</span>
                      <span className="whitespace-nowrap text-xs text-muted">Saved {formatWhen(b.createdAt)}</span>
                    </Link>
                    <RemoveBookmark courseSlug={course.slug} kind={b.kind} slug={b.slug} title={b.title} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>
    </>
  );
}
