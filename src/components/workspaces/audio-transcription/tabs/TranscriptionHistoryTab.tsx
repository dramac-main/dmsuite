"use client";

import { useAudioTranscriptionEditor } from "@/stores/audio-transcription-editor";
import { ConfirmDialog } from "@/components/workspaces/shared/WorkspaceUIKit";
import { TranscriptionStatusDot } from "../FileUploadZone";
import { useState } from "react";

/* ── Helpers ─────────────────────────────────────────────────── */

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return new Date(iso).toLocaleDateString();
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ── Component ───────────────────────────────────────────────── */

export default function TranscriptionHistoryTab() {
  const transcriptions = useAudioTranscriptionEditor(
    (s) => s.form.transcriptions
  );
  const activeId = useAudioTranscriptionEditor(
    (s) => s.form.activeTranscriptionId
  );
  const setActive = useAudioTranscriptionEditor(
    (s) => s.setActiveTranscription
  );
  const removeTranscription = useAudioTranscriptionEditor(
    (s) => s.removeTranscription
  );

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = [...transcriptions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
        <div className="w-10 h-10 rounded-xl bg-gray-800/60 flex items-center justify-center mb-3">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-5 h-5 text-gray-600"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <p className="text-[12px] text-gray-500">No transcriptions yet</p>
        <p className="text-[10px] text-gray-600 mt-1">
          Upload an audio or video file to get started
        </p>
      </div>
    );
  }

  return (
    <div className="px-3 py-2 space-y-1">
      {sorted.map((entry) => {
        const isActive = entry.id === activeId;
        const preview =
          (entry.transcript || "").slice(0, 60) || entry.fileName;

        return (
          <div
            key={entry.id}
            onClick={() => setActive(entry.id)}
            className={`group relative flex items-start gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
              isActive
                ? "bg-primary-500/10 border border-primary-500/20"
                : "hover:bg-gray-800/40 border border-transparent"
            }`}
          >
            {/* Status dot */}
            <div className="mt-1.5">
              <TranscriptionStatusDot status={entry.status} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-gray-300 truncate">
                {entry.fileName}
              </p>
              <p className="text-[10px] text-gray-500 truncate mt-0.5">
                {preview}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[9px] text-gray-600">
                  {timeAgo(entry.createdAt)}
                </span>
                {entry.duration > 0 && (
                  <span className="text-[9px] text-gray-600 font-mono">
                    {formatDuration(entry.duration)}
                  </span>
                )}
                <span className="text-[9px] text-gray-600 font-mono">
                  {formatFileSize(entry.fileSize)}
                </span>
                {entry.creditsUsed > 0 && (
                  <span className="text-[9px] text-primary-400 font-mono">
                    {entry.creditsUsed} cr
                  </span>
                )}
              </div>
            </div>

            {/* Delete button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setDeleteTarget(entry.id);
              }}
              className="opacity-0 group-hover:opacity-100 p-1 text-gray-600 hover:text-red-400 transition-all shrink-0"
              title="Delete"
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
          </div>
        );
      })}

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Transcription"
        description="This will permanently remove this transcription from your history."
        variant="danger"
        onConfirm={() => {
          if (deleteTarget) removeTranscription(deleteTarget);
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
