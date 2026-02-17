"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconRepeat,
  IconDownload,
  IconLoader,
  IconPlus,
  IconTrash,
  IconCheck,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type ConversionCategory = "image" | "document" | "audio" | "video";

interface ConversionOption {
  from: string;
  to: string;
  label: string;
}

interface FileEntry {
  id: string;
  file: File;
  category: ConversionCategory;
  conversion: string;
  progress: number;
  status: "pending" | "converting" | "done" | "error";
  resultUrl?: string;
}

type QualityLevel = "low" | "medium" | "high" | "lossless";

/* ── Conversion Maps ───────────────────────────────────────── */

const CONVERSIONS: Record<ConversionCategory, ConversionOption[]> = {
  image: [
    { from: "PNG", to: "JPG", label: "PNG → JPG" },
    { from: "JPG", to: "PNG", label: "JPG → PNG" },
    { from: "PNG", to: "WebP", label: "PNG → WebP" },
    { from: "SVG", to: "PNG", label: "SVG → PNG" },
    { from: "BMP", to: "PNG", label: "BMP → PNG" },
  ],
  document: [
    { from: "PDF", to: "DOCX", label: "PDF → DOCX" },
    { from: "DOCX", to: "PDF", label: "DOCX → PDF" },
    { from: "MD", to: "HTML", label: "MD → HTML" },
    { from: "HTML", to: "PDF", label: "HTML → PDF" },
    { from: "CSV", to: "JSON", label: "CSV → JSON" },
  ],
  audio: [
    { from: "MP3", to: "WAV", label: "MP3 → WAV" },
    { from: "WAV", to: "MP3", label: "WAV → MP3" },
    { from: "FLAC", to: "MP3", label: "FLAC → MP3" },
    { from: "OGG", to: "MP3", label: "OGG → MP3" },
  ],
  video: [
    { from: "MP4", to: "WebM", label: "MP4 → WebM" },
    { from: "WebM", to: "MP4", label: "WebM → MP4" },
    { from: "AVI", to: "MP4", label: "AVI → MP4" },
    { from: "MOV", to: "MP4", label: "MOV → MP4" },
  ],
};

const CATEGORY_LABELS: { id: ConversionCategory; label: string }[] = [
  { id: "image", label: "Image" },
  { id: "document", label: "Document" },
  { id: "audio", label: "Audio" },
  { id: "video", label: "Video" },
];

const QUALITY_LEVELS: { id: QualityLevel; label: string }[] = [
  { id: "low", label: "Low (Small Size)" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High (Best Quality)" },
  { id: "lossless", label: "Lossless" },
];

const ACCEPTED_TYPES: Record<ConversionCategory, string> = {
  image: ".png,.jpg,.jpeg,.svg,.bmp,.webp",
  document: ".pdf,.docx,.doc,.md,.html,.csv",
  audio: ".mp3,.wav,.flac,.ogg",
  video: ".mp4,.webm,.avi,.mov",
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function FileConverterWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [category, setCategory] = useState<ConversionCategory>("image");
  const [selectedConversion, setSelectedConversion] = useState(CONVERSIONS.image[0].label);
  const [quality, setQuality] = useState<QualityLevel>("high");
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── File handling ───────────────────────────────────────── */
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const entries: FileEntry[] = Array.from(newFiles).map((f) => ({
        id: uid(),
        file: f,
        category,
        conversion: selectedConversion,
        progress: 0,
        status: "pending" as const,
      }));
      setFiles((prev) => [...prev, ...entries]);
    },
    [category, selectedConversion]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === files.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(files.map((f) => f.id)));
  };

  /* ── Simulate conversion ────────────────────────────────── */
  const convertFiles = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, status: "converting" as const, progress: 0 } : f))
        );
        for (let p = 0; p <= 100; p += 10) {
          await new Promise((r) => setTimeout(r, 120));
          setFiles((prev) =>
            prev.map((f) => (f.id === id ? { ...f, progress: p } : f))
          );
        }
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id ? { ...f, status: "done" as const, progress: 100, resultUrl: "#" } : f
          )
        );
      }
    },
    []
  );

  const convertAll = () => convertFiles(files.map((f) => f.id));
  const convertSelected = () => convertFiles(Array.from(selectedIds));

  const downloadAll = () => {
    /* placeholder – would ZIP and download */
  };

  const doneCount = files.filter((f) => f.status === "done").length;
  const converting = files.some((f) => f.status === "converting");

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div
          className={`w-full lg:w-80 shrink-0 space-y-4 overflow-y-auto ${mobileTab !== "settings" ? "hidden lg:block" : ""}`}
        >
          {/* Category Tabs */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconRepeat className="size-4 text-primary-500" />
              Conversion Type
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {CATEGORY_LABELS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCategory(c.id);
                    setSelectedConversion(CONVERSIONS[c.id][0].label);
                  }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${category === c.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Format Options */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Conversion Format</label>
            <div className="space-y-1.5">
              {CONVERSIONS[category].map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => setSelectedConversion(opt.label)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${selectedConversion === opt.label ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quality */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Quality / Compression</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as QualityLevel)}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
            >
              {QUALITY_LEVELS.map((q) => (
                <option key={q.id} value={q.id}>
                  {q.label}
                </option>
              ))}
            </select>
          </div>

          {/* Accepted Types */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <label className="block text-xs text-gray-400">Accepted File Types</label>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
              {ACCEPTED_TYPES[category]}
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={convertAll}
              disabled={files.length === 0 || converting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {converting ? <IconLoader className="size-4 animate-spin" /> : <IconRepeat className="size-4" />}
              Convert All ({files.length})
            </button>
            <button
              onClick={convertSelected}
              disabled={selectedIds.size === 0 || converting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Convert Selected ({selectedIds.size})
            </button>
            {doneCount > 0 && (
              <button
                onClick={downloadAll}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-4" />
                Download All as ZIP
              </button>
            )}
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Upload Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/5" : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-900"}`}
          >
            <IconPlus className="size-8 mx-auto mb-3 text-gray-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
              Drag & drop files here or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Accepted: {ACCEPTED_TYPES[category]}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES[category]}
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === files.length && files.length > 0}
                    onChange={selectAll}
                    className="rounded accent-primary-500"
                  />
                  Select All ({files.length})
                </label>
                <span className="text-xs text-gray-400">
                  {doneCount} / {files.length} done
                </span>
              </div>

              {/* File Rows */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      className="rounded accent-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.file.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {fmtSize(f.file.size)} · {f.conversion}
                      </p>
                    </div>
                    {/* Progress */}
                    {f.status === "converting" && (
                      <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full transition-all"
                          style={{ width: `${f.progress}%` }}
                        />
                      </div>
                    )}
                    {f.status === "done" && <IconCheck className="size-4 text-green-500" />}
                    {f.status === "pending" && (
                      <span className="text-[10px] text-gray-400">Pending</span>
                    )}
                    {f.status === "done" && f.resultUrl && (
                      <button className="p-1 hover:text-primary-500 text-gray-400 transition-colors">
                        <IconDownload className="size-4" />
                      </button>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="p-1 hover:text-red-500 text-gray-400 transition-colors"
                    >
                      <IconTrash className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {files.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconRepeat className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Files Yet
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Upload files to convert them between formats. Select a category and conversion type in the settings panel, then drag & drop your files above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
