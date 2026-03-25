"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Auto-save indicator — shows a subtle "Saved" / "Saving…" badge.
 * Listens for a custom event `workspace:dirty` to trigger the saving state.
 * Auto-returns to "All changes saved" after a brief delay.
 */
export default function SaveIndicator() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("saved");

  const triggerSave = useCallback(() => {
    setState("saving");
    const t = setTimeout(() => setState("saved"), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = () => triggerSave();
    window.addEventListener("workspace:dirty", handler);
    return () => window.removeEventListener("workspace:dirty", handler);
  }, [triggerSave]);

  return (
    <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-gray-500 select-none">
      {state === "saving" ? (
        <>
          <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Saving…</span>
        </>
      ) : (
        <>
          <span className="size-1.5 rounded-full bg-emerald-400" />
          <span>Saved</span>
        </>
      )}
    </div>
  );
}
