"use client";

import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { TranscriptionEntry } from "@/stores/audio-transcription-editor";

/* ── Types ──────────────────────────────────────────────────── */

interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing: boolean;
}

/* ── Helpers ─────────────────────────────────────────────────── */

const ACCEPTED_EXTENSIONS =
  ".mp3,.mp4,.m4a,.mov,.aac,.wav,.ogg,.opus,.mpeg,.wma,.wmv,.webm,.flac,.avi,.mkv";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

/* ── Component ───────────────────────────────────────────────── */

export default function FileUploadZone({
  onFilesSelected,
  isProcessing,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [recentFiles, setRecentFiles] = useState<{ name: string; size: number }[]>([]);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      setRecentFiles(files.map((f) => ({ name: f.name, size: f.size })));
      onFilesSelected(files);
    },
    [onFilesSelected]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (isProcessing) return;
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles, isProcessing]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!isProcessing) setIsDragOver(true);
    },
    [isProcessing]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <div className="p-4 space-y-3">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 group ${
          isProcessing
            ? "border-gray-700/40 bg-gray-900/20 cursor-not-allowed opacity-60"
            : isDragOver
              ? "border-primary-500 bg-primary-500/5 scale-[1.01]"
              : "border-gray-700/50 bg-gray-900/30 hover:border-primary-500/50 hover:bg-gray-800/30"
        }`}
      >
        {/* Upload icon */}
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
            isDragOver
              ? "bg-primary-500/20 text-primary-400"
              : "bg-gray-800/60 text-gray-500 group-hover:text-primary-400 group-hover:bg-primary-500/10"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="w-6 h-6"
          >
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
        </div>

        <div className="text-center">
          <p className="text-[13px] font-medium text-gray-300">
            {isDragOver ? "Drop files here" : "Drag & drop audio or video files"}
          </p>
          <p className="text-[11px] text-gray-500 mt-1">
            MP3, MP4, M4A, WAV, OGG, WebM, MOV, FLAC, AAC — up to 25 MB
          </p>
        </div>

        <button
          type="button"
          disabled={isProcessing}
          className="px-4 py-1.5 text-[11px] font-medium rounded-lg bg-primary-500/10 text-primary-400 border border-primary-500/20 hover:bg-primary-500/20 transition-colors disabled:opacity-50"
        >
          BROWSE FILES
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Recent uploads */}
      <AnimatePresence>
        {recentFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5 px-1">
              Selected Files
            </p>
            <div className="space-y-1">
              {recentFiles.map((f, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/40 border border-gray-700/30"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-3.5 h-3.5 text-primary-400 shrink-0"
                  >
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <span className="text-[11px] text-gray-300 truncate flex-1">
                    {f.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0">
                    {formatFileSize(f.size)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Exported helper for history items ──────────────────────── */

export function TranscriptionStatusDot({
  status,
}: {
  status: TranscriptionEntry["status"];
}) {
  const colors: Record<TranscriptionEntry["status"], string> = {
    uploading: "bg-blue-400",
    transcribing: "bg-yellow-400 animate-pulse",
    ready: "bg-green-400",
    error: "bg-red-400",
  };
  return (
    <span
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[status]}`}
    />
  );
}
