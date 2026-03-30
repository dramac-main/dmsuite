"use client";

import { useCallback, useMemo } from "react";
import { useAudioTranscriptionEditor } from "@/stores/audio-transcription-editor";
import type {
  TranscriptionEntry,
  ExportFormat,
} from "@/stores/audio-transcription-editor";

/* ── Format helpers ──────────────────────────────────────────── */

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")},${ms.toString().padStart(3, "0")}`;
}

function formatVttTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function generateExport(
  entry: TranscriptionEntry,
  format: ExportFormat
): { content: string; filename: string; mimeType: string } {
  const baseName = entry.fileName.replace(/\.[^.]+$/, "") || "transcript";
  const segments = entry.segments;

  switch (format) {
    case "srt": {
      const content = segments
        .map(
          (seg, i) =>
            `${i + 1}\n${formatSrtTimestamp(seg.start)} --> ${formatSrtTimestamp(seg.end)}\n${seg.text}\n`
        )
        .join("\n");
      return { content, filename: `${baseName}.srt`, mimeType: "text/plain" };
    }
    case "vtt": {
      const lines = segments.map(
        (seg) =>
          `${formatVttTimestamp(seg.start)} --> ${formatVttTimestamp(seg.end)}\n${seg.text}`
      );
      const content = `WEBVTT\n\n${lines.join("\n\n")}`;
      return { content, filename: `${baseName}.vtt`, mimeType: "text/vtt" };
    }
    case "json": {
      const data = {
        fileName: entry.fileName,
        duration: entry.duration,
        language: entry.detectedLanguage || entry.language,
        transcript: entry.transcript,
        segments: segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.text,
          ...(seg.speaker ? { speaker: seg.speaker } : {}),
        })),
      };
      return {
        content: JSON.stringify(data, null, 2),
        filename: `${baseName}.json`,
        mimeType: "application/json",
      };
    }
    default: {
      // txt
      const content = segments.length > 0
        ? segments.map((seg) => seg.text).join("\n")
        : entry.transcript;
      return { content, filename: `${baseName}.txt`, mimeType: "text/plain" };
    }
  }
}

function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Component ───────────────────────────────────────────────── */

interface TranscriptViewerProps {
  onRetry?: () => void;
}

export default function TranscriptViewer({ onRetry }: TranscriptViewerProps) {
  const transcriptions = useAudioTranscriptionEditor(
    (s) => s.form.transcriptions
  );
  const activeId = useAudioTranscriptionEditor(
    (s) => s.form.activeTranscriptionId
  );
  const showTimestamps = useAudioTranscriptionEditor(
    (s) => s.form.settings.showTimestamps
  );
  const exportFormat = useAudioTranscriptionEditor(
    (s) => s.form.settings.exportFormat
  );

  const activeEntry = useMemo(
    () => transcriptions.find((t) => t.id === activeId) ?? null,
    [transcriptions, activeId]
  );

  const wordCount = useMemo(() => {
    if (!activeEntry?.transcript) return 0;
    return activeEntry.transcript.split(/\s+/).filter(Boolean).length;
  }, [activeEntry]);

  const handleCopy = useCallback(async () => {
    if (!activeEntry) return;
    const text =
      activeEntry.segments.length > 0
        ? activeEntry.segments.map((s) => s.text).join("\n")
        : activeEntry.transcript;
    await navigator.clipboard.writeText(text).catch(() => {});
  }, [activeEntry]);

  const handleExport = useCallback(() => {
    if (!activeEntry) return;
    const { content, filename, mimeType } = generateExport(
      activeEntry,
      exportFormat
    );
    downloadBlob(content, filename, mimeType);
  }, [activeEntry, exportFormat]);

  /* ── Empty state ─────────────────────────────────────────── */

  if (!activeEntry) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-800/40 flex items-center justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-8 h-8 text-gray-600"
          >
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
        </div>
        <p className="text-[13px] text-gray-400 font-medium">
          Upload a file to transcribe
        </p>
        <p className="text-[11px] text-gray-600 mt-1 max-w-xs">
          Drag and drop an audio or video file, or click Browse Files. Your
          transcript will appear here with timestamps.
        </p>
      </div>
    );
  }

  /* ── Status states ───────────────────────────────────────── */

  if (
    activeEntry.status === "uploading" ||
    activeEntry.status === "transcribing"
  ) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-12 h-12 rounded-xl bg-primary-500/10 border border-primary-500/20 flex items-center justify-center mb-4">
          <svg
            className="w-6 h-6 text-primary-400 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="60"
              strokeDashoffset="20"
            />
          </svg>
        </div>
        <p className="text-[13px] text-gray-300 font-medium">
          {activeEntry.status === "uploading"
            ? "Uploading..."
            : "Transcribing..."}
        </p>
        <p className="text-[11px] text-gray-500 mt-1">
          {activeEntry.status === "uploading"
            ? `Uploading ${activeEntry.fileName}`
            : "Processing with Whisper AI — this may take a moment"}
        </p>
      </div>
    );
  }

  if (activeEntry.status === "error") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
        <div className="w-14 h-14 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-7 h-7 text-red-400"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <p className="text-sm text-red-400 font-semibold">
          Transcription Failed
        </p>
        <p className="text-[12px] text-gray-400 mt-2 max-w-sm leading-relaxed">
          {activeEntry.errorMessage || "An unknown error occurred. Please try uploading the file again."}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 px-4 py-2 rounded-lg text-[12px] font-medium bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  /* ── Ready state — show transcript ──────────────────────── */

  const segments = activeEntry.segments;
  const hasSegments = segments.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div className="h-10 shrink-0 flex items-center gap-2 px-4 border-b border-gray-800/40 bg-gray-900/30">
        {/* File info */}
        <span className="text-[10px] text-gray-500 truncate">
          {activeEntry.fileName}
        </span>
        {activeEntry.detectedLanguage && (
          <span className="text-[9px] text-gray-600 bg-gray-800/60 rounded px-1.5 py-0.5 uppercase font-mono">
            {activeEntry.detectedLanguage}
          </span>
        )}
        {activeEntry.duration > 0 && (
          <span className="text-[9px] text-gray-600 font-mono">
            {formatDuration(activeEntry.duration)}
          </span>
        )}

        <div className="flex-1" />

        {/* Word count */}
        <span className="text-[9px] font-mono text-gray-600">
          {wordCount} words
        </span>

        {/* Copy */}
        <button
          type="button"
          onClick={handleCopy}
          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          title="Copy to clipboard"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
        </button>

        {/* Export */}
        <button
          type="button"
          onClick={handleExport}
          className="p-1 text-gray-500 hover:text-gray-300 transition-colors"
          title={`Export as ${exportFormat.toUpperCase()}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="w-3.5 h-3.5"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>
      </div>

      {/* ── Transcript body ──────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {hasSegments ? (
          <div className="space-y-1">
            {segments.map((seg) => (
              <div key={seg.id} className="flex gap-3 group">
                {showTimestamps && (
                  <span className="text-[10px] font-mono text-gray-600 min-w-14 shrink-0 pt-0.5 select-none">
                    {formatTimestamp(seg.start)}
                  </span>
                )}
                <p className="text-[13px] text-gray-300 leading-relaxed">
                  {seg.speaker && (
                    <span className="text-primary-400 font-medium text-[11px] mr-1.5">
                      {seg.speaker}:
                    </span>
                  )}
                  {seg.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-gray-300 leading-relaxed whitespace-pre-wrap">
            {activeEntry.transcript}
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Export helper for Chiko and workspace ───────────────────── */

export { generateExport, downloadBlob };
