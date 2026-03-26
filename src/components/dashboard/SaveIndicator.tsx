"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Auto-save indicator with manual save button.
 *
 * Events:
 * - `workspace:dirty`   → triggers "saving" state (auto-save visual)
 * - `workspace:saved`   → confirms "saved" state
 * - `workspace:save`    → manual save request (dispatched by this component's button / Ctrl+S)
 *
 * Any workspace can listen for `workspace:save` to persist data on demand.
 */
export default function SaveIndicator() {
  const [state, setState] = useState<"idle" | "saving" | "saved">("saved");
  const [dirty, setDirty] = useState(false);
  const lastActivity = useRef(Date.now());
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track dirty state — debounced so only the LAST dirty event triggers a save
  const triggerDirty = useCallback(() => {
    setDirty(true);
    lastActivity.current = Date.now();
    setState("saving");
    // Clear any pending auto-save to avoid overlapping saves
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    // Auto-save after 1.5s of inactivity
    autoSaveTimer.current = setTimeout(() => {
      window.dispatchEvent(new CustomEvent("workspace:save"));
      autoSaveTimer.current = null;
    }, 1500);
  }, []);

  // Manual save
  const handleManualSave = useCallback(() => {
    setState("saving");
    window.dispatchEvent(new CustomEvent("workspace:save"));
    // Transition to "saved" after brief delay
    setTimeout(() => {
      setState("saved");
      setDirty(false);
    }, 600);
  }, []);

  useEffect(() => {
    const dirtyHandler = () => triggerDirty();
    const savedHandler = () => {
      setState("saved");
      setDirty(false);
    };

    window.addEventListener("workspace:dirty", dirtyHandler);
    window.addEventListener("workspace:saved", savedHandler);

    // Ctrl+S / Cmd+S keyboard shortcut
    const keyHandler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleManualSave();
      }
    };
    window.addEventListener("keydown", keyHandler);

    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      window.removeEventListener("workspace:dirty", dirtyHandler);
      window.removeEventListener("workspace:saved", savedHandler);
      window.removeEventListener("keydown", keyHandler);
    };
  }, [triggerDirty, handleManualSave]);

  return (
    <div className="hidden sm:flex items-center gap-1.5 select-none">
      {/* Status dot + label */}
      <div className="flex items-center gap-1 text-[10px] text-gray-500">
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

      {/* Manual save button */}
      {dirty && (
        <button
          onClick={handleManualSave}
          className="ml-0.5 flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-medium text-primary-500 hover:bg-primary-500/10 transition-colors"
          title="Save now (Ctrl+S)"
        >
          <svg className="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          Save
        </button>
      )}
    </div>
  );
}
