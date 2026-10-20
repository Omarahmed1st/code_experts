import Link from "next/link";
import { SITE_NAME } from "@/lib/site";

/** Lec-style mark: the navy stage with the yellow run button and a code chevron. */
export function LogoMark({ className = "size-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={`${className} shrink-0`}>
      <rect width="32" height="32" rx="9" fill="#14213d" />
      <path d="M7.5 11 4.5 16l3 5" fill="none" stroke="#8cc4f2" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="18" cy="16" r="9" fill="#ffd43b" />
      <path d="M15.6 11.6v8.8L22.6 16z" fill="#14213d" />
    </svg>
  );
}

export function Logo() {
  const [first, second] = SITE_NAME.split("_");
  return (
    <Link href="/" className="inline-flex min-h-11 items-center gap-2.5 rounded-lg" aria-label={`${SITE_NAME} home`}>
      <LogoMark />
      <span className="font-display text-xl font-bold tracking-tight text-ink max-[479px]:sr-only">
        {second ? (
          <>
            {first}
            <span className="text-primary-text">_{second}</span>
          </>
        ) : (
          SITE_NAME
        )}
      </span>
    </Link>
  );
}
