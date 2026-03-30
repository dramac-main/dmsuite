"use client";

import { useCallback, useMemo } from "react";
import { useVoiceFlowEditor } from "@/stores/voice-flow-editor";
import { IconButton } from "@/components/workspaces/shared/WorkspaceUIKit";
import { AnimatePresence, motion } from "framer-motion";

/* ── Component ───────────────────────────────────────────────── */

export default function VoiceFlowTranscriptEditor() {
  const transcripts = useVoiceFlowEditor((s) => s.form.transcripts);
  const activeId = useVoiceFlowEditor((s) => s.form.activeTranscriptId);
  const showRaw = useVoiceFlowEditor((s) => s.form.settings.showRawTranscript);
  const updateTranscript = useVoiceFlowEditor((s) => s.updateTranscript);

  const activeEntry = useMemo(
    () => transcripts.find((t) => t.id === activeId) ?? null,
    [transcripts, activeId]
  );

  const displayText =
    activeEntry?.editedTranscript ||
    activeEntry?.cleanedTranscript ||
    activeEntry?.rawTranscript ||
    "";

  const wordCount = useMemo(() => {
    if (!displayText.trim()) return 0;
    return displayText.trim().split(/\s+/).length;
  }, [displayText]);

  const hasRaw =
    activeEntry &&
    activeEntry.rawTranscript &&
    activeEntry.rawTranscript !== activeEntry.cleanedTranscript;

  /* ── Handlers ──────────────────────────────────────────────── */

  const handleCopy = useCallback(async () => {
    if (!displayText) return;
    await navigator.clipboard.writeText(displayText).catch(() => {});
  }, [displayText]);

  const handleClear = useCallback(() => {
    if (!activeEntry) return;
    updateTranscript(activeEntry.id, {
      editedTranscript: "",
      cleanedTranscript: "",
      rawTranscript: "",
    });
  }, [activeEntry, updateTranscript]);

  const handleTextChange = useCallback(
    (newText: string) => {
      if (!activeEntry) return;
      updateTranscript(activeEntry.id, { editedTranscript: newText });
    },
    [activeEntry, updateTranscript]
  );

  /* ── Status indicator ──────────────────────────────────────── */

  const statusEl = useMemo(() => {
    if (!activeEntry) return null;
    const { status } = activeEntry;
    switch (status) {
      case "recording":
        return (
          <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Recording…
          </div>
        );
      case "transcribing":
        return (
          <div className="flex items-center gap-1.5 text-yellow-400 text-[11px]">
            <svg
              className="w-3 h-3 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="12" cy="12" r="10" opacity="0.3" />
              <path d="M12 2a10 10 0 019.95 9" />
            </svg>
            Transcribing…
          </div>
        );
      case "post-processing":
        return (
          <div className="flex items-center gap-1.5 text-primary-400 text-[11px]">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
            </svg>
            Cleaning up…
          </div>
        );
      case "error":
        return (
          <div className="flex items-center gap-1.5 text-red-400 text-[11px]">
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4m0 4h.01" />
            </svg>
            {activeEntry.errorMessage || "Error"}
          </div>
        );
      case "ready":
        return null;
      default:
        return null;
    }
  }, [activeEntry]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-3 h-10 border-b border-gray-800/40 bg-gray-900/30 shrink-0">
        {statusEl}
        <div className="flex-1" />
        <span className="text-[10px] font-mono text-gray-500">
          {wordCount} word{wordCount !== 1 ? "s" : ""}
        </span>
        <IconButton
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" /></svg>}
          tooltip="Copy to clipboard"
          onClick={handleCopy}
          disabled={!displayText}
        />
        <IconButton
          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" /></svg>}
          tooltip="Clear transcript"
          onClick={handleClear}
          disabled={!activeEntry}
        />
      </div>

      {/* ── Main editor ──────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {!activeEntry ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="w-14 h-14 text-gray-700 mb-4"
            >
              <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
              <path d="M19 10v2a7 7 0 01-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="23" />
            </svg>
            <p className="text-[13px] text-gray-500 font-medium">
              Hold the record button and speak
            </p>
            <p className="text-[11px] text-gray-600 mt-1">
              Your words will appear here
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <textarea
              value={displayText}
              onChange={(e) => handleTextChange(e.target.value)}
              className="flex-1 min-h-50 w-full resize-none bg-transparent text-[13px] text-gray-200 leading-relaxed p-4 outline-none placeholder:text-gray-600"
              placeholder="Transcript will appear here..."
              readOnly={activeEntry.status !== "ready"}
            />

            {/* Raw transcript (collapsible) */}
            {showRaw && hasRaw && (
              <AnimatePresence>
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-gray-800/30 overflow-hidden"
                >
                  <div className="px-4 py-3">
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      Raw Transcript
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed whitespace-pre-wrap">
                      {activeEntry.rawTranscript}
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
