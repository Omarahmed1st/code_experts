"use client";

// Saved code drafts for write-the-code and correct-the-code questions
// (signed-in students only). The draft loads when the question opens and is
// saved a moment after the student stops typing, so their code is still there
// on another day or another device. Guests' code isn't kept.
import { useEffect, useRef, useState } from "react";
import { loadDraft, storeDraft, useMe } from "@/components/account/me";
import type { PublicExercise } from "@/server/exercises/catalog";
import type { Answer } from "./question-view";

const SAVE_AFTER_MS = 1500;

export type DraftStatus = "off" | "loading" | "restored" | "saving" | "saved" | "error" | "idle";

export function useCodeDraft(courseSlug: string, q: PublicExercise, answer: Answer, setAnswer: (a: Answer) => void): DraftStatus {
  const me = useMe();
  const eligible = (q.type === "write_code" || q.type === "correct_code") && q.ask === null && (q.codeLanguage === "python" || q.codeLanguage === "cpp");
  const [status, setStatus] = useState<DraftStatus>("off");
  const loaded = useRef(false);
  const lastSaved = useRef<string | null>(null);

  // Load once, when we know the student is signed in.
  useEffect(() => {
    if (!eligible || !me || loaded.current) return;
    loaded.current = true;
    let cancelled = false;
    setStatus("loading");
    loadDraft(courseSlug, q.slug)
      .then((draft) => {
        if (cancelled) return;
        if (draft && draft.code !== (q.code ?? "")) {
          lastSaved.current = draft.code;
          setAnswer({ kind: "code", code: draft.code });
          setStatus("restored");
        } else {
          lastSaved.current = q.code ?? "";
          setStatus("idle");
        }
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [courseSlug, eligible, me, q.code, q.slug, setAnswer]);

  // Save shortly after the code changes.
  const code = answer.kind === "code" ? answer.code : null;
  useEffect(() => {
    if (!eligible || !me || code === null || lastSaved.current === null || code === lastSaved.current) return;
    const timer = setTimeout(() => {
      setStatus("saving");
      // The starting code itself isn't worth keeping: an empty draft removes it.
      const toSave = code === (q.code ?? "") ? "" : code;
      storeDraft(courseSlug, q.slug, toSave)
        .then(() => {
          lastSaved.current = code;
          setStatus("saved");
        })
        .catch(() => setStatus("error"));
    }, SAVE_AFTER_MS);
    return () => clearTimeout(timer);
  }, [code, courseSlug, eligible, me, q.code, q.slug]);

  return eligible && me ? status : "off";
}

export const DRAFT_TEXT: Record<Exclude<DraftStatus, "off">, string> = {
  loading: "Looking for your saved code…",
  restored: "Your saved code is back. Changes are saved to your account as you type.",
  idle: "Your code is saved to your account as you type.",
  saving: "Saving…",
  saved: "Saved to your account.",
  error: "Couldn't save your code just now. It will try again when you type.",
};
