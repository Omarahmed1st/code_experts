"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

type ThemeChoice = "system" | "light" | "dark";

const NEXT: Record<ThemeChoice, ThemeChoice> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<ThemeChoice, string> = { system: "System", light: "Light", dark: "Dark" };
const CHANGE_EVENT = "codelab-theme-change";

function readChoice(): ThemeChoice {
  const value = document.documentElement.getAttribute("data-theme");
  return value === "light" || value === "dark" ? value : "system";
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function applyChoice(choice: ThemeChoice) {
  const root = document.documentElement;
  try {
    if (choice === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, choice);
  } catch {
    // Storage can be blocked (private mode); the choice still applies to this page.
  }
  if (choice === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", choice);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Cycles System → Light → Dark. "System" follows the operating system setting. */
export function ThemeToggle({ tone = "page" }: { tone?: "page" | "stage" }) {
  const choice = useSyncExternalStore(subscribe, readChoice, () => "system" as const);
  const next = NEXT[choice];
  const Icon = choice === "light" ? Sun : choice === "dark" ? Moon : Monitor;

  return (
    <button
      type="button"
      onClick={() => applyChoice(next)}
      className={
        tone === "stage"
          ? "inline-flex size-11 items-center justify-center rounded-xl border border-[#2b4373] text-[var(--lec-ink)] transition-colors hover:bg-white/10"
          : "inline-flex size-11 items-center justify-center rounded-xl border border-line bg-surface text-ink transition-colors hover:border-line-strong hover:bg-surface-2"
      }
      aria-label={`Theme: ${LABEL[choice]}. Switch to ${LABEL[next]}.`}
      title={`Theme: ${LABEL[choice]}`}
    >
      <Icon aria-hidden="true" className="size-5" />
    </button>
  );
}
