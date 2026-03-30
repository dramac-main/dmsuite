"use client";

import { useMemo } from "react";
import { useVoiceFlowEditor, type TranscriptEntry } from "@/stores/voice-flow-editor";
import {
  ConfirmDialog,
} from "@/components/workspaces/shared/WorkspaceUIKit";
import { useState } from "react";

/* ── Helpers ─────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function getStatusColor(status: TranscriptEntry["status"]): string {
  switch (status) {
    case "ready":
      return "bg-green-400";
    case "recording":
    case "transcribing":
    case "post-processing":
      return "bg-yellow-400";
    case "error":
      return "bg-red-400";
    default:
      return "bg-gray-500";
  }
}

function getPreview(entry: TranscriptEntry): string {
  const text =
    entry.editedTranscript || entry.cleanedTranscript || entry.rawTranscript;
  if (!text) return "Processing...";
  return text.length > 60 ? text.slice(0, 60) + "…" : text;
}

/* ── Component ───────────────────────────────────────────────── */

export default function VoiceFlowHistoryTab() {
  const transcripts = useVoiceFlowEditor((s) => s.form.transcripts);
  const activeId = useVoiceFlowEditor((s) => s.form.activeTranscriptId);
  const setActiveTranscript = useVoiceFlowEditor((s) => s.setActiveTranscript);
  const removeTranscript = useVoiceFlowEditor((s) => s.removeTranscript);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...transcripts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [transcripts]
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-10 h-10 text-gray-600 mb-3"
        >
          <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
          <path d="M19 10v2a7 7 0 01-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="23" />
        </svg>
        <p className="text-[12px] text-gray-500">No recordings yet</p>
        <p className="text-[10px] text-gray-600 mt-1">
          Record your first dictation above
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-0.5 py-1">
        {sorted.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setActiveTranscript(entry.id)}
            className={`group relative flex items-start gap-2.5 px-3 py-2.5 text-left transition-colors rounded-md mx-1
              ${
                activeId === entry.id
                  ? "bg-primary-500/12 text-primary-200"
                  : "hover:bg-white/5 text-gray-300"
              }`}
          >
            {/* Status dot */}
            <span
              className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(
                entry.status
              )}`}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] leading-snug truncate">
                {getPreview(entry)}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-gray-500">
                  {timeAgo(entry.createdAt)}
                </span>
                <span className="text-[9px] text-gray-600 font-mono">
                  {formatDuration(entry.duration)}
                </span>
                {entry.creditsUsed > 0 && (
                  <span className="text-[9px] text-gray-600">
                    {entry.creditsUsed} cr
                  </span>
                )}
              </div>
            </div>

            {/* Delete button (visible on hover) */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(entry.id);
              }}
              className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 p-0.5 text-gray-500 hover:text-red-400"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className="w-3 h-3"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </button>
        ))}
      </div>

      {/* Delete confirmation */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Transcript"
        description="This recording and its transcript will be permanently removed."
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) removeTranscript(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
