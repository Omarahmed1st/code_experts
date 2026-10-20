"use client";

// Runs a server action from a client form or button: tracks pending state,
// keeps the result (message or field errors) and refreshes the page's server
// data after a success.
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";

export type ActionResult<T = unknown> = { ok: true; value: T; message?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

// Results kept across a remount: an editor keyed by its saved version is
// replaced after router.refresh(), and the new one still shows "Saved"
// (run with keep: true, and the same keepAs key on both).
const kept = new Map<string, ActionResult<unknown>>();

/** Shows a success message on the next page that uses the same keepAs key (after creating something, on its new page). */
export function keepResult(keepAs: string, message: string | undefined): void {
  if (message) kept.set(keepAs, { ok: true, value: undefined, message });
}

export function useAdminAction<T = unknown>(keepAs?: string) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<T> | null>(() => {
    if (!keepAs) return null;
    const found = kept.get(keepAs) as ActionResult<T> | undefined;
    kept.delete(keepAs);
    return found ?? null;
  });

  const run = useCallback(
    (call: () => Promise<ActionResult<T>>, options: { refresh?: boolean; keep?: boolean; onSuccess?: (value: T, message?: string) => void } = {}) => {
      startTransition(async () => {
        let next: ActionResult<T>;
        try {
          next = await call();
        } catch {
          next = { ok: false, error: "Something went wrong on the server. Your changes weren't saved; try again." };
        }
        setResult(next);
        if (keepAs && next.ok && options.keep) kept.set(keepAs, next);
        if (next.ok) {
          options.onSuccess?.(next.value, next.message);
          if (options.refresh !== false) router.refresh();
        }
      });
    },
    [router, keepAs],
  );

  const fieldError = (name: string) => (result && !result.ok ? (result.fieldErrors?.[name] ?? null) : null);
  return { run, pending, result, setResult, fieldError };
}
