"use client";

import { useEffect } from "react";

/**
 * Turns on the Copy buttons that renderMarkdown() puts on code blocks. They are
 * rendered hidden, so readers without JavaScript never see a button that does
 * nothing. One delegated listener serves every block on the page.
 */
export function CodeCopyEnhancer() {
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>("button[data-copy]");
    for (const button of buttons) button.hidden = false;

    const onClick = async (event: MouseEvent) => {
      const button = (event.target as Element | null)?.closest<HTMLButtonElement>("button[data-copy]");
      const code = button?.closest(".code-block")?.querySelector("pre")?.textContent;
      if (!button || code == null) return;
      try {
        await navigator.clipboard.writeText(code);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select and copy";
      }
      setTimeout(() => {
        button.textContent = "Copy";
      }, 1600);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);
  return null;
}
