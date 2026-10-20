import Link from "next/link";
import type { ReactNode } from "react";
import { LogoMark } from "@/components/layout/logo";

/** The dark stage with one card in the middle: sign in, sign up and recovery. */
export function AuthFrame({
  kicker,
  title,
  intro,
  children,
  footer,
}: {
  kicker: { strong: string; rest: string };
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <main id="main" tabIndex={-1} className="lec-cinema flex flex-1 items-center justify-center px-4 py-16 outline-none">
      <div className="w-full max-w-md">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2.5 rounded-lg text-[var(--lec-ink)]">
          <LogoMark className="size-10" />
          <span className="text-2xl font-bold">
            Code<span className="text-[var(--lec-yel)]">_Expert</span>
          </span>
        </Link>
        <div className="mt-8 rounded-[var(--radius-card)] border border-line bg-surface p-6 text-ink shadow-[var(--cl-shadow)] sm:p-8">
          <p className="lec-chapter text-muted">
            <b>{kicker.strong}</b>
            <i />
            {kicker.rest}
          </p>
          <h1 className="mt-2 text-2xl font-bold">{title}</h1>
          {intro ? <div className="mt-2 text-sm text-muted">{intro}</div> : null}
          <div className="mt-6">{children}</div>
        </div>
        {footer ? <div className="mt-6 grid gap-2 text-center text-sm text-[var(--lec-mute)]">{footer}</div> : null}
      </div>
    </main>
  );
}

export const stageLink = "font-semibold text-[var(--lec-yel)] underline-offset-4 hover:underline";
