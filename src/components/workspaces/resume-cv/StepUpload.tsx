// =============================================================================
// DMSuite — Resume Upload Step
// Pre-step choice: "Start fresh" or "Upload existing CV"
// Accepts PDF, DOCX, images. Sends to /api/chat/resume/parse for
// AI-powered extraction, then pre-fills the entire wizard.
// =============================================================================

"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useResumeCVWizard, type UploadedResumeData } from "@/stores/resume-cv-wizard";

// ── Inline SVG Icons ──

function IconUploadCloud({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
  );
}

function IconFile({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function IconPlus({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function IconSparkles({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z" />
    </svg>
  );
}

function IconCheck({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconX({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Upload stages for the progress UI
// ---------------------------------------------------------------------------

const UPLOAD_STAGES = [
  "Reading file contents",
  "Extracting text and data",
  "AI is parsing your resume",
  "Mapping to wizard fields",
];

// ---------------------------------------------------------------------------
// Accepted file extensions
// ---------------------------------------------------------------------------

const ACCEPTED_TYPES = ".pdf,.docx,.doc,.png,.jpg,.jpeg,.webp,.txt";
const FILE_TYPE_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "Word (DOCX)",
  "application/msword": "Word (DOC)",
  "image/png": "Image (PNG)",
  "image/jpeg": "Image (JPEG)",
  "image/webp": "Image (WebP)",
  "text/plain": "Text file",
};

function getFileTypeLabel(file: File): string {
  return FILE_TYPE_LABELS[file.type] || file.name.split(".").pop()?.toUpperCase() || "File";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function StepUpload() {
  const { nextStep, prefillFromUpload } = useResumeCVWizard();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [extractionStats, setExtractionStats] = useState<{
    experiences: number;
    skills: number;
    education: number;
  } | null>(null);

  // ---- File selection ----
  const handleFileSelect = useCallback((file: File) => {
    setError(null);
    setExtractionStats(null);

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError("File is too large (max 10 MB). Please use a smaller file.");
      return;
    }

    setSelectedFile(file);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  // ---- Upload and parse ----
  const handleUploadAndParse = useCallback(async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setStageIndex(0);

    // Simulate stage progression with timers
    const stageTimers = [800, 1500, 2500];
    const timers: ReturnType<typeof setTimeout>[] = [];
    stageTimers.forEach((delay, i) => {
      timers.push(setTimeout(() => setStageIndex(i + 1), delay));
    });

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/chat/resume/parse", {
        method: "POST",
        body: formData,
      });

      if (res.status === 402) {
        const { handleCreditError } = await import("@/lib/credit-error");
        throw new Error(handleCreditError());
      }
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Upload failed (${res.status})`);
      }

      const data = await res.json();

      if (!data.parsed) {
        throw new Error(data.message || "Could not parse the resume. Try a different file format.");
      }

      // Show extraction stats briefly before navigating
      const parsed = data.parsed as UploadedResumeData;
      setExtractionStats({
        experiences: Array.isArray(parsed.experiences) ? parsed.experiences.length : 0,
        skills: Array.isArray(parsed.skills) ? parsed.skills.length : 0,
        education: Array.isArray(parsed.education) ? parsed.education.length : 0,
      });
      setStageIndex(4); // all stages done

      // Pre-fill wizard and jump to Brief step after a short delay
      await new Promise((r) => setTimeout(r, 1200));
      prefillFromUpload(parsed, selectedFile.name);
    } catch (err) {
      timers.forEach(clearTimeout);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      setIsProcessing(false);
    }
  }, [selectedFile, prefillFromUpload]);

  // ---- Remove selected file ----
  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setExtractionStats(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  return (
    <div className="mx-auto max-w-xl px-4 py-4">
      <div className="text-center mb-8">
        <h2 className="text-xl font-semibold text-gray-100 mb-2">
          How would you like to start?
        </h2>
        <p className="text-sm text-gray-400">
          Upload an existing CV for instant pre-fill, or start fresh
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 mb-6">
        {/* Option 1: Upload existing */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className={`group relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 transition-all duration-300 text-left ${
            dragOver
              ? "border-primary-400 bg-primary-500/10"
              : selectedFile
                ? "border-primary-500/40 bg-primary-500/5"
                : "border-gray-700 bg-gray-900/50 hover:border-gray-500 hover:bg-gray-800/50"
          } ${isProcessing ? "pointer-events-none opacity-70" : "cursor-pointer"}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <div className="w-12 h-12 rounded-full bg-primary-500/10 flex items-center justify-center group-hover:bg-primary-500/20 transition-colors">
            <IconUploadCloud className="text-primary-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-200">
              Upload existing CV
            </p>
            <p className="text-xs text-gray-500 mt-1">
              PDF, Word, image, or text file
            </p>
          </div>
          <span className="text-xs text-primary-400/80 bg-primary-500/10 rounded-full px-2.5 py-0.5">
            Fastest
          </span>
        </button>

        {/* Option 2: Start fresh */}
        <button
          onClick={nextStep}
          disabled={isProcessing}
          className="group relative flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-700 bg-gray-900/50 p-6 transition-all duration-300 hover:border-gray-500 hover:bg-gray-800/50"
        >
          <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-colors">
            <IconPlus className="text-gray-400" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-gray-200">
              Start from scratch
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Fill in each step manually
            </p>
          </div>
        </button>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleInputChange}
        className="hidden"
      />

      {/* Selected file preview */}
      <AnimatePresence mode="wait">
        {selectedFile && !isProcessing && (
          <motion.div
            key="file-preview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-gray-700 bg-gray-900/60 p-4 mb-4"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center shrink-0">
                <IconFile className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {getFileTypeLabel(selectedFile)} · {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                onClick={handleRemoveFile}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
              >
                <IconX />
              </button>
            </div>

            {error && (
              <div className="mt-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400">{error}</p>
              </div>
            )}

            <button
              onClick={handleUploadAndParse}
              className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary-500 px-5 py-2.5 text-sm font-medium text-gray-950 transition-all hover:bg-primary-400"
            >
              <IconSparkles className="w-4 h-4" />
              Extract and pre-fill my resume
            </button>
          </motion.div>
        )}

        {/* Processing state */}
        {isProcessing && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="rounded-xl border border-gray-700 bg-gray-900/60 p-5"
          >
            {/* File info */}
            <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-800/50">
              <div className="w-9 h-9 rounded-lg bg-primary-500/10 flex items-center justify-center shrink-0">
                <IconFile className="text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 truncate">{selectedFile?.name}</p>
                <p className="text-xs text-gray-500">{selectedFile ? getFileTypeLabel(selectedFile) : ""}</p>
              </div>
            </div>

            {/* Stage checklist */}
            <div className="space-y-2.5">
              {UPLOAD_STAGES.map((label, i) => {
                const isDone = i < stageIndex;
                const isActive = i === stageIndex;

                return (
                  <div key={i} className="flex items-center gap-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isDone
                          ? "bg-primary-500/20"
                          : isActive
                            ? "bg-primary-500/10 ring-1 ring-primary-500/50"
                            : "bg-gray-800"
                      }`}
                    >
                      {isDone ? (
                        <IconCheck className="text-primary-400" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-2.5 h-2.5 rounded-full border-2 border-primary-500/30 border-t-primary-400"
                        />
                      ) : (
                        <div className="w-1.5 h-1.5 rounded-full bg-gray-600" />
                      )}
                    </div>
                    <span
                      className={`text-sm transition-colors duration-300 ${
                        isDone
                          ? "text-gray-500"
                          : isActive
                            ? "text-gray-200 font-medium"
                            : "text-gray-600"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Extraction stats (shown briefly before redirect) */}
            {extractionStats && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-gray-800/50"
              >
                <p className="text-xs font-medium text-primary-400 mb-2">
                  Extraction complete
                </p>
                <div className="flex gap-4 text-xs text-gray-400">
                  <span>{extractionStats.experiences} positions</span>
                  <span>{extractionStats.skills} skills</span>
                  <span>{extractionStats.education} education</span>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Pre-filling wizard fields...
                </p>
              </motion.div>
            )}

            {/* Error during processing */}
            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-xs text-red-400 mb-3">{error}</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleUploadAndParse}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-400 hover:text-primary-300 bg-primary-500/10 hover:bg-primary-500/15 rounded-lg px-3 py-1.5 transition-colors"
                  >
                    <IconSparkles className="w-3 h-3" />
                    Retry
                  </button>
                  <button
                    onClick={() => {
                      setIsProcessing(false);
                      setError(null);
                      setStageIndex(0);
                    }}
                    className="text-xs text-gray-400 hover:text-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    Choose different file
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drag & drop hint */}
      {!selectedFile && !isProcessing && (
        <p className="text-center text-xs text-gray-600 mt-2">
          You can also drag and drop a file onto the upload area
        </p>
      )}
    </div>
  );
}
