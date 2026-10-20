// Class names for links and buttons that look like buttons. Every variant
// keeps a 44 px minimum touch target.
const base =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50";

const variants = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover",
  secondary: "border border-line-strong bg-surface text-ink hover:bg-surface-2",
  ghost: "text-primary-text hover:bg-primary-soft",
  danger: "bg-hard text-on-hard hover:opacity-90",
} as const;

export type ButtonVariant = keyof typeof variants;

export function buttonClass(variant: ButtonVariant = "primary", extra = ""): string {
  return `${base} ${variants[variant]} ${extra}`.trim();
}
