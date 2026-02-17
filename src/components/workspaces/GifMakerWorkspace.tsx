"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconRepeat,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type LoopOption = "infinite" | "1" | "3";

interface GifConfig {
  startTime: number;
  endTime: number;
  speed: number;
  quality: number;
  width: number;
  height: number;
  crop: boolean;
  loop: LoopOption;
  textOverlay: string;
  textPosition: "top" | "center" | "bottom";
  textColor: string;
  fontSize: number;
  aiPrompt: string;
}

const LOOP_OPTIONS: { id: LoopOption; label: string }[] = [
  { id: "infinite", label: "∞ Infinite" },
  { id: "1", label: "1× Play" },
  { id: "3", label: "3× Loop" },
];

const SIZE_PRESETS = [
  { label: "Original", w: 0, h: 0 },
  { label: "480p", w: 854, h: 480 },
  { label: "360p", w: 640, h: 360 },
  { label: "240p", w: 426, h: 240 },
  { label: "Square", w: 480, h: 480 },
  { label: "Story", w: 360, h: 640 },
];

/* ── Component ─────────────────────────────────────────────── */

export default function GifMakerWorkspace() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"preview" | "settings">("preview");
  const [dragOver, setDragOver] = useState(false);
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceType, setSourceType] = useState<"video" | "images">("video");
  const [imageFiles, setImageFiles] = useState<{ file: File; url: string }[]>([]);
  const [estimatedSize, setEstimatedSize] = useState<string | null>(null);

  const [config, setConfig] = useState<GifConfig>({
    startTime: 0,
    endTime: 5,
    speed: 1,
    quality: 70,
    width: 480,
    height: 270,
    crop: false,
    loop: "infinite",
    textOverlay: "",
    textPosition: "bottom",
    textColor: "#ffffff",
    fontSize: 24,
    aiPrompt: "",
  });

  /* ── File Handling ──────────────────────────────────────── */
  const handleFiles = useCallback((files: FileList) => {
    const first = files[0];
    if (!first) return;

    if (first.type.startsWith("video/")) {
      setSourceType("video");
      setSourceFile(first);
      setSourceUrl(URL.createObjectURL(first));
      setImageFiles([]);
    } else if (first.type.startsWith("image/")) {
      setSourceType("images");
      setSourceFile(null);
      setSourceUrl(null);
      const imgs = Array.from(files)
        .filter((f) => f.type.startsWith("image/"))
        .map((f) => ({ file: f, url: URL.createObjectURL(f) }));
      setImageFiles(imgs);
    }
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  /* ── Estimated file size ────────────────────────────────── */
  const updateEstimate = useCallback(() => {
    const duration = config.endTime - config.startTime;
    const pixels = config.width * config.height;
    const qualityFactor = config.quality / 100;
    const estimated = (pixels * duration * 10 * qualityFactor) / (1024 * 1024);
    setEstimatedSize(estimated < 1 ? `~${Math.round(estimated * 1024)} KB` : `~${estimated.toFixed(1)} MB`);
  }, [config.endTime, config.startTime, config.width, config.height, config.quality]);

  /* ── AI Generate text overlay ───────────────────────────── */
  const generateAI = async () => {
    if (!config.aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Suggest a short, punchy text overlay for a GIF about: ${config.aiPrompt}. Max 6 words. Return JSON: { "text": "" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.text) setConfig((p) => ({ ...p, textOverlay: data.text }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export (placeholder) ───────────────────────────────── */
  const exportFile = (format: "gif" | "webp") => {
    updateEstimate();
    alert(`Export as ${format.toUpperCase()} is not yet implemented. Estimated size: ${estimatedSize ?? "calculating…"}`);
  };

  const removeSource = () => {
    setSourceFile(null);
    setSourceUrl(null);
    setImageFiles([]);
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile tab toggle */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["preview", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ──────────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* Range & Speed */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconRepeat className="size-4 text-primary-500" />GIF Settings
            </h3>

            {sourceType === "video" && (
              <>
                <label className="block text-xs text-gray-400">Start Time — {config.startTime.toFixed(1)}s</label>
                <input type="range" min={0} max={60} step={0.1} value={config.startTime} onChange={(e) => setConfig((p) => ({ ...p, startTime: +e.target.value }))} className="w-full accent-primary-500" />

                <label className="block text-xs text-gray-400">End Time — {config.endTime.toFixed(1)}s</label>
                <input type="range" min={0} max={60} step={0.1} value={config.endTime} onChange={(e) => setConfig((p) => ({ ...p, endTime: +e.target.value }))} className="w-full accent-primary-500" />
              </>
            )}

            <label className="block text-xs text-gray-400">Speed — {config.speed}x</label>
            <input type="range" min={0.5} max={3} step={0.1} value={config.speed} onChange={(e) => setConfig((p) => ({ ...p, speed: +e.target.value }))} className="w-full accent-primary-500" />

            <label className="block text-xs text-gray-400">Quality vs File Size — {config.quality}%</label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-400">Small</span>
              <input type="range" min={10} max={100} value={config.quality} onChange={(e) => { setConfig((p) => ({ ...p, quality: +e.target.value })); updateEstimate(); }} className="flex-1 accent-primary-500" />
              <span className="text-[10px] text-gray-400">HD</span>
            </div>
          </div>

          {/* Dimensions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Dimensions</h3>

            <div className="grid grid-cols-3 gap-1.5">
              {SIZE_PRESETS.map((s) => (
                <button key={s.label} onClick={() => setConfig((p) => ({ ...p, width: s.w || p.width, height: s.h || p.height }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.width === s.w && config.height === s.h ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{s.label}</button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400">Width</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.width} onChange={(e) => setConfig((p) => ({ ...p, width: +e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Height</label>
                <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.height} onChange={(e) => setConfig((p) => ({ ...p, height: +e.target.value }))} />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">Crop to fit</span>
              <button onClick={() => setConfig((p) => ({ ...p, crop: !p.crop }))} className={`relative w-10 h-5 rounded-full transition-colors ${config.crop ? "bg-primary-500" : "bg-gray-300 dark:bg-gray-700"}`}>
                <span className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform ${config.crop ? "translate-x-5" : ""}`} />
              </button>
            </div>
          </div>

          {/* Loop */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Loop Options</h3>
            <div className="grid grid-cols-3 gap-1.5">
              {LOOP_OPTIONS.map((l) => (
                <button key={l.id} onClick={() => setConfig((p) => ({ ...p, loop: l.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.loop === l.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{l.label}</button>
              ))}
            </div>
          </div>

          {/* Text Overlay */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Text Overlay</h3>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" placeholder="Enter text overlay…" value={config.textOverlay} onChange={(e) => setConfig((p) => ({ ...p, textOverlay: e.target.value }))} />

            <div className="grid grid-cols-3 gap-1.5">
              {(["top", "center", "bottom"] as const).map((pos) => (
                <button key={pos} onClick={() => setConfig((p) => ({ ...p, textPosition: pos }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${config.textPosition === pos ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{pos}</button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input type="color" value={config.textColor} onChange={(e) => setConfig((p) => ({ ...p, textColor: e.target.value }))} className="size-8 rounded-lg cursor-pointer" />
              <input type="number" min={12} max={72} className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-sm text-gray-900 dark:text-white" value={config.fontSize} onChange={(e) => setConfig((p) => ({ ...p, fontSize: +e.target.value }))} />
              <span className="text-xs text-gray-400">px</span>
            </div>
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />AI Text Suggest
            </h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Describe the GIF mood (e.g. 'funny reaction to good news')…" value={config.aiPrompt} onChange={(e) => setConfig((p) => ({ ...p, aiPrompt: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Suggest Text"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Export</h3>
            {estimatedSize && (
              <p className="text-xs text-gray-400 text-center mb-1">Est. size: {estimatedSize}</p>
            )}
            <button onClick={() => exportFile("gif")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export GIF
            </button>
            <button onClick={() => exportFile("webp")} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <IconDownload className="size-4" />Export WebP
            </button>
          </div>
        </div>

        {/* ── Preview Area ────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "preview" ? "hidden md:block" : ""}`}>
          {/* Upload Zone */}
          <input ref={fileInputRef} type="file" accept="video/*,image/*" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }} />

          {!sourceUrl && imageFiles.length === 0 ? (
            <div
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/10" : "border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-primary-500/50"}`}
            >
              <IconRepeat className="size-10 text-gray-400" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Drop video or images here</p>
              <p className="text-xs text-gray-400">Video for clip-to-GIF • Multiple images for slideshow GIF</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Video preview */}
              {sourceUrl && sourceType === "video" && (
                <div className="rounded-2xl overflow-hidden bg-black">
                  <video src={sourceUrl} controls className="w-full max-h-72 object-contain" />
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-900">
                    <span className="text-xs text-gray-400 truncate">{sourceFile?.name}</span>
                    <button onClick={removeSource} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                  </div>
                </div>
              )}

              {/* Image grid */}
              {imageFiles.length > 0 && (
                <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">{imageFiles.length} images</span>
                    <button onClick={removeSource} className="text-xs text-red-400 hover:text-red-300">Clear all</button>
                  </div>
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                    {imageFiles.map((img, i) => (
                      <div key={i} className="aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                        <img src={img.url} alt={`Frame ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                    <button onClick={() => fileInputRef.current?.click()} className="aspect-square rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-primary-500/50 transition-colors">
                      <IconPlus className="size-5 text-gray-400" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GIF Preview Placeholder */}
          <div className="rounded-2xl bg-gray-100 dark:bg-gray-800/50 p-6">
            <div className="relative rounded-xl bg-gray-900 overflow-hidden mx-auto" style={{ width: Math.min(config.width, 600), aspectRatio: `${config.width}/${config.height}` }}>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <IconRepeat className="size-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">GIF Preview</p>
                </div>
              </div>

              {config.textOverlay && (
                <div className={`absolute left-0 right-0 px-4 py-2 text-center ${config.textPosition === "top" ? "top-2" : config.textPosition === "center" ? "top-1/2 -translate-y-1/2" : "bottom-2"}`} style={{ color: config.textColor, fontSize: config.fontSize * 0.5 }}>
                  <span className="px-2 py-1 rounded bg-black/50">{config.textOverlay}</span>
                </div>
              )}
            </div>
          </div>

          <p className="text-xs text-gray-400 text-center">
            {config.width}×{config.height}px • {config.speed}x speed • Loop: {config.loop === "infinite" ? "∞" : config.loop + "×"}
          </p>
        </div>
      </div>
    </div>
  );
}
