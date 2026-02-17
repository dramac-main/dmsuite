"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconVideo,
  IconDownload,
  IconTrash,
  IconPlus,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type QualityPreset = "low" | "medium" | "high" | "custom";
type OutputFormat = "mp4" | "webm" | "mov" | "avi";
type Resolution = "original" | "1080p" | "720p" | "480p";

interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  estimatedOutput: number | null;
  status: "pending" | "compressing" | "done" | "error";
  progress: number;
}

interface CompressorConfig {
  quality: QualityPreset;
  format: OutputFormat;
  resolution: Resolution;
  bitrate: number;
  customCrf: number;
}

/* ── Data ──────────────────────────────────────────────────── */

const QUALITY_PRESETS: { id: QualityPreset; label: string; desc: string; ratio: number }[] = [
  { id: "low", label: "Low", desc: "Smallest file, lower quality", ratio: 0.15 },
  { id: "medium", label: "Medium", desc: "Balanced quality & size", ratio: 0.35 },
  { id: "high", label: "High", desc: "Near-original quality", ratio: 0.65 },
  { id: "custom", label: "Custom", desc: "Set your own bitrate", ratio: 0.5 },
];

const FORMATS: { id: OutputFormat; label: string; ext: string }[] = [
  { id: "mp4", label: "MP4 (H.264)", ext: ".mp4" },
  { id: "webm", label: "WebM (VP9)", ext: ".webm" },
  { id: "mov", label: "MOV (QuickTime)", ext: ".mov" },
  { id: "avi", label: "AVI", ext: ".avi" },
];

const RESOLUTIONS: { id: Resolution; label: string; pixels: string }[] = [
  { id: "original", label: "Original", pixels: "Keep source" },
  { id: "1080p", label: "1080p", pixels: "1920×1080" },
  { id: "720p", label: "720p", pixels: "1280×720" },
  { id: "480p", label: "480p", pixels: "854×480" },
];

function uid(): string {
  return "vid_" + Math.random().toString(36).slice(2, 9);
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (bytes / Math.pow(k, i)).toFixed(1) + " " + sizes[i];
}

/* ── Component ─────────────────────────────────────────────── */

export default function VideoCompressorWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mobileTab, setMobileTab] = useState<"files" | "settings">("files");
  const [dragOver, setDragOver] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const [files, setFiles] = useState<VideoFile[]>([]);

  const [config, setConfig] = useState<CompressorConfig>({
    quality: "medium",
    format: "mp4",
    resolution: "original",
    bitrate: 5000,
    customCrf: 23,
  });

  /* ── File Handling ──────────────────────────────────────── */
  const addFiles = useCallback((fileList: FileList) => {
    const newFiles: VideoFile[] = Array.from(fileList)
      .filter((f) => f.type.startsWith("video/"))
      .map((f) => {
        const preset = QUALITY_PRESETS.find((q) => q.id === config.quality);
        const ratio = preset?.ratio ?? 0.35;
        return {
          id: uid(),
          file: f,
          name: f.name,
          size: f.size,
          estimatedOutput: Math.round(f.size * ratio),
          status: "pending" as const,
          progress: 0,
        };
      });
    setFiles((p) => [...p, ...newFiles]);
  }, [config.quality]);

  const removeFile = (id: string) => setFiles((p) => p.filter((f) => f.id !== id));
  const clearAll = () => setFiles([]);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  /* ── Estimate sizes when quality changes ────────────────── */
  const updateEstimates = useCallback((quality: QualityPreset) => {
    const preset = QUALITY_PRESETS.find((q) => q.id === quality);
    const ratio = preset?.ratio ?? 0.35;
    setFiles((p) => p.map((f) => ({ ...f, estimatedOutput: Math.round(f.size * ratio) })));
  }, []);

  /* ── Compress (simulated) ───────────────────────────────── */
  const startCompression = async () => {
    if (files.length === 0) return;
    setIsCompressing(true);

    for (let i = 0; i < files.length; i++) {
      const fileId = files[i].id;
      setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, status: "compressing", progress: 0 } : f)));

      /* Simulate progress */
      for (let pct = 0; pct <= 100; pct += 10) {
        await new Promise((r) => setTimeout(r, 200));
        setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, progress: pct } : f)));
      }

      setFiles((p) => p.map((f) => (f.id === fileId ? { ...f, status: "done", progress: 100 } : f)));
    }

    setIsCompressing(false);
  };

  /* ── Totals ─────────────────────────────────────────────── */
  const totalOriginal = files.reduce((s, f) => s + f.size, 0);
  const totalEstimated = files.reduce((s, f) => s + (f.estimatedOutput ?? f.size), 0);
  const savings = totalOriginal > 0 ? Math.round(((totalOriginal - totalEstimated) / totalOriginal) * 100) : 0;

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["files", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* Quality */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconVideo className="size-4 text-primary-500" />Quality
            </h3>
            <div className="space-y-1">
              {QUALITY_PRESETS.map((q) => (
                <button key={q.id} onClick={() => { setConfig((p) => ({ ...p, quality: q.id })); updateEstimates(q.id); }} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors ${config.quality === q.id ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                  <span className="text-xs font-medium">{q.label}</span>
                  <span className="text-[10px] opacity-60">{q.desc}</span>
                </button>
              ))}
            </div>

            {config.quality === "custom" && (
              <>
                <label className="block text-xs text-gray-400">Bitrate — {config.bitrate} kbps</label>
                <input type="range" min={500} max={20000} step={100} value={config.bitrate} onChange={(e) => setConfig((p) => ({ ...p, bitrate: +e.target.value }))} className="w-full accent-primary-500" />

                <label className="block text-xs text-gray-400">CRF — {config.customCrf} (lower = better)</label>
                <input type="range" min={0} max={51} value={config.customCrf} onChange={(e) => setConfig((p) => ({ ...p, customCrf: +e.target.value }))} className="w-full accent-primary-500" />
              </>
            )}
          </div>

          {/* Format */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Output Format</h3>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.format} onChange={(e) => setConfig((p) => ({ ...p, format: e.target.value as OutputFormat }))}>
              {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
          </div>

          {/* Resolution */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Resolution</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {RESOLUTIONS.map((r) => (
                <button key={r.id} onClick={() => setConfig((p) => ({ ...p, resolution: r.id }))} className={`px-3 py-2 rounded-lg text-left transition-colors ${config.resolution === r.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>
                  <span className="block text-xs font-medium">{r.label}</span>
                  <span className="text-[10px] opacity-70">{r.pixels}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size Comparison */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Size Comparison</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-gray-100 dark:bg-gray-800 p-3 text-center">
                  <p className="text-[10px] text-gray-400 uppercase mb-1">Original</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">{formatBytes(totalOriginal)}</p>
                </div>
                <div className="rounded-lg bg-primary-500/10 p-3 text-center">
                  <p className="text-[10px] text-primary-500 uppercase mb-1">Estimated</p>
                  <p className="text-sm font-bold text-primary-500">{formatBytes(totalEstimated)}</p>
                </div>
              </div>
              <div className="text-center">
                <span className="text-xs font-semibold text-green-500">↓ {savings}% smaller</span>
              </div>
            </div>
          )}

          {/* Compress Button */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={startCompression} disabled={files.length === 0 || isCompressing} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              <IconDownload className="size-4" />
              {isCompressing ? "Compressing…" : `Compress ${files.length} File${files.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>

        {/* ── Files Area ──────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "files" ? "hidden md:block" : ""}`}>
          {/* Upload Zone */}
          <input ref={fileInputRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) addFiles(e.target.files); }} />

          <div
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/10" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500/50"}`}
          >
            <IconVideo className="size-10 text-gray-400" />
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drop video files here or click to browse</p>
            <p className="text-xs text-gray-400">MP4, WebM, MOV, AVI — Multiple files supported</p>
          </div>

          {/* Batch File List */}
          {files.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <IconVideo className="size-4 text-primary-500" />Files ({files.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                    <IconPlus className="size-3" />Add
                  </button>
                  <button onClick={clearAll} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {files.map((vf) => (
                  <div key={vf.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{vf.name}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400">{formatBytes(vf.size)}</span>
                          {vf.estimatedOutput !== null && (
                            <>
                              <span className="text-xs text-gray-500">→</span>
                              <span className="text-xs text-primary-500 font-medium">{formatBytes(vf.estimatedOutput)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {vf.status === "done" && (
                          <span className="text-xs text-green-500 font-medium">✓ Done</span>
                        )}
                        {vf.status === "error" && (
                          <span className="text-xs text-red-500 font-medium">Error</span>
                        )}
                        <button onClick={() => removeFile(vf.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                          <IconTrash className="size-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {vf.status === "compressing" && (
                      <div className="space-y-1">
                        <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div className="h-full rounded-full bg-primary-500 transition-all duration-300" style={{ width: `${vf.progress}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 text-right">{vf.progress}%</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          {files.length > 0 && (
            <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Files</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{files.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Total Size</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{formatBytes(totalOriginal)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Savings</p>
                  <p className="text-lg font-bold text-green-500">{savings}%</p>
                </div>
              </div>
            </div>
          )}

          {files.length === 0 && (
            <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-12 text-center">
              <IconVideo className="size-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Upload video files to get started</p>
              <p className="text-xs text-gray-400 mt-1">Compress, convert, and resize your videos</p>
            </div>
          )}

          <p className="text-xs text-gray-400 text-center">
            Output: {FORMATS.find((f) => f.id === config.format)?.label} • {RESOLUTIONS.find((r) => r.id === config.resolution)?.label} • {QUALITY_PRESETS.find((q) => q.id === config.quality)?.label} quality
          </p>
        </div>
      </div>
    </div>
  );
}
