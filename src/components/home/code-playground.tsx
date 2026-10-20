"use client";

import { useEffect, useRef, useState } from "react";
import { LecStage, type LecStageProps } from "@/components/lesson/lec-stage";

export interface PlaygroundVariant extends Omit<LecStageProps, "tabs"> {
  key: string;
  /** The tab's text: "Python", "C++". */
  label: string;
}

/**
 * The home page's code box with a choice of language (tabs on top of the INPUT
 * box). Every language keeps its own stage mounted, so edits and keyboard input
 * survive switching back and forth; only the chosen one is shown.
 */
export function CodePlayground({ variants }: { variants: PlaygroundVariant[] }) {
  const [active, setActive] = useState(variants[0]?.key ?? "");
  const box = useRef<HTMLDivElement>(null);
  const focusTab = useRef(false);
  const items = variants.map(({ key, label }) => ({ key, label }));

  // The tabs live inside each stage, so after a keyboard switch the focus moves
  // to the same tab in the stage that is now shown.
  useEffect(() => {
    if (!focusTab.current) return;
    focusTab.current = false;
    box.current?.querySelector<HTMLElement>(`[data-variant="${active}"] [data-tab="${active}"]`)?.focus();
  }, [active]);

  const onSelect = (key: string) => {
    const focused = document.activeElement;
    focusTab.current = Boolean(focused && box.current?.contains(focused) && focused.getAttribute("role") === "tab");
    setActive(key);
  };

  return (
    <div ref={box} className="min-w-0">
      {variants.map(({ key, label: _label, ...stage }) => (
        <div key={key} data-variant={key} hidden={key !== active}>
          <LecStage {...stage} tabs={{ items, active: key, onSelect }} />
        </div>
      ))}
    </div>
  );
}
