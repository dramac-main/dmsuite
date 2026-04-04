// =============================================================================
// DMSuite — Resume Import Dialog
// Full-featured import dialog with drag-drop, format auto-detection, and
// preview before importing. Supports DMSuite JSON, JSON Resume standard,
// Reactive Resume, LinkedIn, and plain text.
// =============================================================================

"use client";

import React, { useCallback, useRef, useState } from "react";
import { autoImport, type ImportFormat, type ImportResult } from "@/lib/resume/import";
import type { ResumeData } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Format metadata
// ---------------------------------------------------------------------------

const FORMAT_LABELS: Record<ImportFormat, string> = {
  dmsuite: "DMSuite JSON",
  jsonresume: "JSON Resume Standard",
  "reactive-resume": "Reactive Resume",
  linkedin: "LinkedIn Export",
  unknown: "Unknown Format",
};

const FORMAT_DESCRIPTIONS: Record<ImportFormat, string> = {
  dmsuite: "Exported from DMSuite Resume & CV Builder",
  jsonresume: "Standard JSON Resume format (jsonresume.org)",
  "reactive-resume": "Exported from Reactive Resume app",
  linkedin: "LinkedIn profile data export",
  unknown: "Format not recognized — imported with best-effort parsing",
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (data: ResumeData) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ImportDialog({ open, onClose, onImport }: ImportDialogProps) {
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Reset state ──
  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setDragOver(false);
  }, []);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  // ── Process file content ──
  const processContent = useCallback((content: string, fileName: string) => {
    try {
      const importResult = autoImport(content);
      setResult(importResult);
      setError(null);
    } catch (err) {
      setError(`Failed to parse "${fileName}": ${err instanceof Error ? err.message : "Unknown error"}`);
      setResult(null);
    }
  }, []);

  // ── File input handler ──
  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => processContent(reader.result as string, file.name);
      reader.onerror = () => setError(`Failed to read file "${file.name}"`);
      reader.readAsText(file);
      // Reset input so the same file can be re-selected
      e.target.value = "";
    },
    [processContent],
  );

  // ── Drag & drop handlers ──
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = () => processContent(reader.result as string, file.name);
      reader.onerror = () => setError(`Failed to read file "${file.name}"`);
      reader.readAsText(file);
    },
    [processContent],
  );

  // ── Confirm import ──
  const handleConfirm = useCallback(() => {
    if (!result) return;
    onImport(result.data);
    handleClose();
  }, [result, onImport, handleClose]);

  // ── Summary preview ──
  const previewSummary = result
    ? buildPreviewSummary(result.data)
    : null;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-lg rounded-2xl bg-gray-900 border border-gray-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
          <div>
            <h2 className="text-base font-semibold text-white">Import Resume</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Upload a file to import your resume data
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {!result && !error && (
            <>
              {/* Drop zone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                className={`
                  flex flex-col items-center justify-center gap-3 p-8
                  rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${
                    dragOver
                      ? "border-primary-400 bg-primary-500/10 text-primary-400"
                      : "border-gray-700 hover:border-gray-600 text-gray-500 hover:text-gray-400"
                  }
                `}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Drop a file here or <span className="text-primary-400">browse</span>
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    .json or .txt — JSON Resume, Reactive Resume, LinkedIn, or plain text
                  </p>
                </div>
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".json,.txt"
                className="hidden"
                onChange={handleFileSelect}
              />

              {/* Supported formats */}
              <div className="space-y-1.5">
                <p className="text-[10px] font-medium text-gray-600 uppercase tracking-wider">Supported Formats</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(["dmsuite", "jsonresume", "reactive-resume", "linkedin"] as ImportFormat[]).map((fmt) => (
                    <div key={fmt} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-gray-800/40">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500/60" />
                      <span className="text-[11px] text-gray-400">{FORMAT_LABELS[fmt]}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Error state */}
          {error && (
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400 mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-400">Import Failed</p>
                  <p className="text-xs text-red-400/70 mt-1">{error}</p>
                </div>
              </div>
              <button
                onClick={reset}
                className="w-full py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                Try Another File
              </button>
            </div>
          )}

          {/* Preview / confirm state */}
          {result && (
            <div className="space-y-4">
              {/* Detected format badge */}
              <div className="flex items-center gap-2">
                <div className="px-2.5 py-1 rounded-full bg-primary-500/15 text-primary-400 text-xs font-medium">
                  {FORMAT_LABELS[result.format]}
                </div>
                <span className="text-xs text-gray-500">
                  {FORMAT_DESCRIPTIONS[result.format]}
                </span>
              </div>

              {/* Warnings */}
              {result.warnings.length > 0 && (
                <div className="p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 space-y-1">
                  {result.warnings.map((w, i) => (
                    <p key={i} className="text-xs text-yellow-400">{w}</p>
                  ))}
                </div>
              )}

              {/* Data preview */}
              {previewSummary && (
                <div className="rounded-xl bg-gray-800/50 border border-gray-700/50 overflow-hidden">
                  <div className="px-4 py-2 border-b border-gray-700/50 bg-gray-800/40">
                    <span className="text-xs font-medium text-gray-400">Preview</span>
                  </div>
                  <div className="px-4 py-3 space-y-2">
                    {previewSummary.name && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0">Name</span>
                        <span className="text-sm text-white font-medium truncate">{previewSummary.name}</span>
                      </div>
                    )}
                    {previewSummary.headline && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0">Title</span>
                        <span className="text-sm text-gray-300 truncate">{previewSummary.headline}</span>
                      </div>
                    )}
                    {previewSummary.email && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 w-16 shrink-0">Email</span>
                        <span className="text-sm text-gray-300 truncate">{previewSummary.email}</span>
                      </div>
                    )}

                    {/* Section counts */}
                    <div className="pt-2 mt-2 border-t border-gray-700/40">
                      <p className="text-[10px] text-gray-600 uppercase tracking-wider mb-1.5">Sections Found</p>
                      <div className="flex flex-wrap gap-1.5">
                        {previewSummary.sections.map(({ key, count }) => (
                          <span
                            key={key}
                            className="px-2 py-0.5 rounded-md bg-gray-700/50 text-[11px] text-gray-400"
                          >
                            {key} <span className="text-primary-400">{count}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={reset}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition-colors"
                >
                  Different File
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 rounded-xl text-sm font-medium text-gray-950 bg-primary-500 hover:bg-primary-400 transition-colors"
                >
                  Import Resume
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helper — build preview summary from imported data
// ---------------------------------------------------------------------------

interface PreviewSummary {
  name: string;
  headline: string;
  email: string;
  sections: Array<{ key: string; count: number }>;
}

function buildPreviewSummary(data: ResumeData): PreviewSummary {
  const sections: Array<{ key: string; count: number }> = [];
  if (data.sections) {
    for (const [key, section] of Object.entries(data.sections)) {
      const count = (section as { items?: unknown[] })?.items?.length ?? 0;
      if (count > 0) {
        sections.push({ key, count });
      }
    }
  }
  if (data.summary?.content?.trim()) {
    sections.unshift({ key: "summary", count: 1 });
  }

  return {
    name: data.basics?.name ?? "",
    headline: data.basics?.headline ?? "",
    email: data.basics?.email ?? "",
    sections,
  };
}
