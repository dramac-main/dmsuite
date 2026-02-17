"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconFilter,
  IconDownload,
  IconLoader,
  IconPlus,
  IconTrash,
  IconCheck,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type Operation = "resize" | "convert" | "compress" | "watermark" | "rename" | "crop" | "rotate";

interface BatchFile {
  id: string;
  file: File;
  preview?: string;
  status: "pending" | "processing" | "done" | "error";
  progress: number;
}

interface ResizeSettings {
  width: number;
  height: number;
  maintainAspect: boolean;
}

type WatermarkPosition =
  | "top-left" | "top-center" | "top-right"
  | "center-left" | "center" | "center-right"
  | "bottom-left" | "bottom-center" | "bottom-right";

interface WatermarkSettings {
  text: string;
  position: WatermarkPosition;
  opacity: number;
}

interface CropPreset {
  id: string;
  label: string;
  ratio: string;
}

interface ProcessingResult {
  processed: number;
  failed: number;
  sizeSaved: number;
}

/* ── Constants ─────────────────────────────────────────────── */

const OPERATIONS: { id: Operation; label: string }[] = [
  { id: "resize", label: "Resize" },
  { id: "convert", label: "Convert Format" },
  { id: "compress", label: "Compress" },
  { id: "watermark", label: "Watermark" },
  { id: "rename", label: "Rename" },
  { id: "crop", label: "Crop" },
  { id: "rotate", label: "Rotate" },
];

const FORMAT_OPTIONS = ["PNG", "JPG", "WebP", "BMP", "TIFF"];

const WATERMARK_POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: "top-left", label: "↖" },
  { id: "top-center", label: "↑" },
  { id: "top-right", label: "↗" },
  { id: "center-left", label: "←" },
  { id: "center", label: "•" },
  { id: "center-right", label: "→" },
  { id: "bottom-left", label: "↙" },
  { id: "bottom-center", label: "↓" },
  { id: "bottom-right", label: "↘" },
];

const CROP_PRESETS: CropPreset[] = [
  { id: "1:1", label: "1:1 Square", ratio: "1:1" },
  { id: "4:3", label: "4:3", ratio: "4:3" },
  { id: "16:9", label: "16:9 Wide", ratio: "16:9" },
  { id: "3:2", label: "3:2", ratio: "3:2" },
  { id: "2:3", label: "2:3 Portrait", ratio: "2:3" },
  { id: "9:16", label: "9:16 Story", ratio: "9:16" },
];

const ROTATE_OPTIONS = [
  { value: 90, label: "90°" },
  { value: 180, label: "180°" },
  { value: 270, label: "270°" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function BatchProcessorWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [operation, setOperation] = useState<Operation>("resize");
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Operation Settings */
  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    width: 1920,
    height: 1080,
    maintainAspect: true,
  });
  const [targetFormat, setTargetFormat] = useState("PNG");
  const [compressQuality, setCompressQuality] = useState(80);
  const [watermark, setWatermark] = useState<WatermarkSettings>({
    text: "",
    position: "bottom-right",
    opacity: 50,
  });
  const [renamePattern, setRenamePattern] = useState("{name}_{date}_{index}");
  const [cropPreset, setCropPreset] = useState("1:1");
  const [rotateAngle, setRotateAngle] = useState(90);
  const [customAngle, setCustomAngle] = useState(0);
  const [useCustomAngle, setUseCustomAngle] = useState(false);

  /* ── File handling ───────────────────────────────────────── */
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const entries: BatchFile[] = Array.from(newFiles).map((f) => ({
      id: uid(),
      file: f,
      status: "pending" as const,
      progress: 0,
      preview: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined,
    }));
    setFiles((prev) => [...prev, ...entries]);
    setResult(null);
  }, []);

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
  };

  const clearAll = () => {
    setFiles([]);
    setResult(null);
  };

  /* ── Simulate processing ────────────────────────────────── */
  const processAll = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setOverallProgress(0);
    setResult(null);

    let processed = 0;
    let failed = 0;

    for (let i = 0; i < files.length; i++) {
      const fileId = files[i].id;
      setFiles((prev) =>
        prev.map((f) => (f.id === fileId ? { ...f, status: "processing" as const, progress: 0 } : f))
      );

      for (let p = 0; p <= 100; p += 20) {
        await new Promise((r) => setTimeout(r, 80));
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress: p } : f))
        );
      }

      const success = Math.random() > 0.05;
      if (success) {
        processed++;
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "done" as const, progress: 100 } : f))
        );
      } else {
        failed++;
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, status: "error" as const, progress: 0 } : f))
        );
      }
      setOverallProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setResult({
      processed,
      failed,
      sizeSaved: Math.round(files.reduce((sum, f) => sum + f.file.size * 0.3, 0)),
    });
    setProcessing(false);
  };

  const totalSize = files.reduce((sum, f) => sum + f.file.size, 0);

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
          {/* Operation Selector */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFilter className="size-4 text-primary-500" />
              Operation
            </h3>
            <div className="space-y-1.5">
              {OPERATIONS.map((op) => (
                <button
                  key={op.id}
                  onClick={() => setOperation(op.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${operation === op.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {op.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operation-specific Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">
              {OPERATIONS.find((o) => o.id === operation)?.label} Settings
            </label>

            {/* Resize */}
            {operation === "resize" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
                  <input
                    type="number"
                    value={resizeSettings.width}
                    onChange={(e) => setResizeSettings((p) => ({ ...p, width: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
                  <input
                    type="number"
                    value={resizeSettings.height}
                    onChange={(e) => setResizeSettings((p) => ({ ...p, height: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={resizeSettings.maintainAspect}
                    onChange={(e) => setResizeSettings((p) => ({ ...p, maintainAspect: e.target.checked }))}
                    className="rounded accent-primary-500"
                  />
                  Maintain aspect ratio
                </label>
              </div>
            )}

            {/* Convert Format */}
            {operation === "convert" && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Format</label>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                >
                  {FORMAT_OPTIONS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Compress */}
            {operation === "compress" && (
              <div className="space-y-2">
                <label className="block text-xs text-gray-400">
                  Quality: <span className="text-gray-900 dark:text-white font-semibold">{compressQuality}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={compressQuality}
                  onChange={(e) => setCompressQuality(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>10 (Smallest)</span>
                  <span>100 (Best)</span>
                </div>
              </div>
            )}

            {/* Watermark */}
            {operation === "watermark" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Text</label>
                  <input
                    value={watermark.text}
                    onChange={(e) => setWatermark((p) => ({ ...p, text: e.target.value }))}
                    placeholder="Watermark text…"
                    className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Position</label>
                  <div className="grid grid-cols-3 gap-1">
                    {WATERMARK_POSITIONS.map((pos) => (
                      <button
                        key={pos.id}
                        onClick={() => setWatermark((p) => ({ ...p, position: pos.id }))}
                        className={`p-2 rounded-lg text-xs font-medium transition-colors ${watermark.position === pos.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-400">
                    Opacity: <span className="text-gray-900 dark:text-white font-semibold">{watermark.opacity}%</span>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={watermark.opacity}
                    onChange={(e) => setWatermark((p) => ({ ...p, opacity: Number(e.target.value) }))}
                    className="w-full accent-primary-500"
                  />
                </div>
              </div>
            )}

            {/* Rename */}
            {operation === "rename" && (
              <div className="space-y-2">
                <label className="block text-xs text-gray-400 mb-1">Pattern</label>
                <input
                  value={renamePattern}
                  onChange={(e) => setRenamePattern(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                />
                <p className="text-[10px] text-gray-400">
                  Tokens: {"{name}"}, {"{date}"}, {"{index}"}, {"{ext}"}
                </p>
              </div>
            )}

            {/* Crop */}
            {operation === "crop" && (
              <div className="space-y-2">
                <label className="block text-xs text-gray-400 mb-1">Aspect Ratio</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {CROP_PRESETS.map((cp) => (
                    <button
                      key={cp.id}
                      onClick={() => setCropPreset(cp.id)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${cropPreset === cp.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    >
                      {cp.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Rotate */}
            {operation === "rotate" && (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-1.5">
                  {ROTATE_OPTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => {
                        setRotateAngle(r.value);
                        setUseCustomAngle(false);
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${!useCustomAngle && rotateAngle === r.value ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomAngle}
                    onChange={(e) => setUseCustomAngle(e.target.checked)}
                    className="rounded accent-primary-500"
                  />
                  Custom angle
                </label>
                {useCustomAngle && (
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Angle (°)</label>
                    <input
                      type="number"
                      min={0}
                      max={360}
                      value={customAngle}
                      onChange={(e) => setCustomAngle(Number(e.target.value))}
                      className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Process Button */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <button
              onClick={processAll}
              disabled={files.length === 0 || processing}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {processing ? <IconLoader className="size-4 animate-spin" /> : <IconFilter className="size-4" />}
              {processing ? "Processing…" : `Process All (${files.length})`}
            </button>

            {processing && (
              <div className="space-y-1">
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${overallProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 text-center">{overallProgress}% complete</p>
              </div>
            )}

            {result && (
              <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Processed</span>
                  <span className="text-green-500 font-semibold">{result.processed}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Failed</span>
                  <span className={`font-semibold ${result.failed > 0 ? "text-red-500" : "text-gray-500"}`}>
                    {result.failed}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Size Saved</span>
                  <span className="text-primary-500 font-semibold">{fmtSize(result.sizeSaved)}</span>
                </div>
              </div>
            )}

            {result && result.processed > 0 && (
              <button
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <IconDownload className="size-4" />
                Download All
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
              {files.length} file{files.length !== 1 ? "s" : ""} · {fmtSize(totalSize)}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <span className="text-xs font-semibold text-gray-900 dark:text-white">
                  {files.length} file{files.length !== 1 ? "s" : ""}
                </span>
                <button
                  onClick={clearAll}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Clear All
                </button>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-[60vh] overflow-y-auto">
                {files.map((f) => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Thumbnail / Icon */}
                    {f.preview ? (
                      <img src={f.preview} alt="" className="size-10 rounded-lg object-cover bg-gray-100 dark:bg-gray-800" />
                    ) : (
                      <div className="size-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <IconFilter className="size-4 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white truncate">{f.file.name}</p>
                      <p className="text-[10px] text-gray-400">{fmtSize(f.file.size)}</p>
                    </div>
                    {/* Status */}
                    {f.status === "processing" && (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${f.progress}%` }}
                          />
                        </div>
                        <IconLoader className="size-3.5 text-primary-500 animate-spin" />
                      </div>
                    )}
                    {f.status === "done" && (
                      <IconCheck className="size-4 text-green-500" />
                    )}
                    {f.status === "error" && (
                      <span className="text-[10px] text-red-500 font-semibold">Failed</span>
                    )}
                    {f.status === "pending" && (
                      <span className="text-[10px] text-gray-400">Pending</span>
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
              <IconFilter className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Files Yet
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Upload images to batch-process them. Choose an operation in the settings panel, configure options, then drag & drop your files above.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
