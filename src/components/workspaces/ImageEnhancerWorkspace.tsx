"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconImage,
  IconSparkles,
  IconDownload,
  IconPlus,
  IconRepeat,
} from "@/components/icons";

/* ── Types ─────────────────────────────────────────────────── */

type AIPreset = "auto" | "portrait" | "landscape" | "product" | "night" | "hdr" | "vintage" | "film";
type Filter = "none" | "bw" | "sepia" | "vivid" | "matte" | "cool" | "warm" | "dramatic";

interface EnhancementState {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
  temperature: number;
  exposure: number;
  noiseReduction: number;
}

interface HistoryEntry {
  label: string;
  state: EnhancementState;
  filter: Filter;
  preset: AIPreset | null;
}

/* ── Constants ─────────────────────────────────────────────── */

const AI_PRESETS: { id: AIPreset; label: string }[] = [
  { id: "auto", label: "Auto" },
  { id: "portrait", label: "Portrait" },
  { id: "landscape", label: "Landscape" },
  { id: "product", label: "Product" },
  { id: "night", label: "Night" },
  { id: "hdr", label: "HDR" },
  { id: "vintage", label: "Vintage" },
  { id: "film", label: "Film" },
];

const FILTERS: { id: Filter; label: string; css: string }[] = [
  { id: "none", label: "None", css: "" },
  { id: "bw", label: "B&W", css: "grayscale(100%)" },
  { id: "sepia", label: "Sepia", css: "sepia(80%)" },
  { id: "vivid", label: "Vivid", css: "saturate(160%) contrast(110%)" },
  { id: "matte", label: "Matte", css: "contrast(90%) brightness(110%) saturate(85%)" },
  { id: "cool", label: "Cool", css: "hue-rotate(15deg) saturate(90%)" },
  { id: "warm", label: "Warm", css: "hue-rotate(-10deg) saturate(120%)" },
  { id: "dramatic", label: "Dramatic", css: "contrast(140%) brightness(90%) saturate(110%)" },
];

const UPSCALE_OPTIONS = [
  { value: 2, label: "2×" },
  { value: 4, label: "4×" },
];

const DEFAULT_STATE: EnhancementState = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  sharpness: 0,
  temperature: 0,
  exposure: 0,
  noiseReduction: 0,
};

const SLIDERS: { key: keyof EnhancementState; label: string; min: number; max: number; step: number }[] = [
  { key: "brightness", label: "Brightness", min: -100, max: 100, step: 1 },
  { key: "contrast", label: "Contrast", min: -100, max: 100, step: 1 },
  { key: "saturation", label: "Saturation", min: -100, max: 100, step: 1 },
  { key: "sharpness", label: "Sharpness", min: 0, max: 100, step: 1 },
  { key: "temperature", label: "Temperature", min: -50, max: 50, step: 1 },
  { key: "exposure", label: "Exposure", min: -200, max: 200, step: 1 },
  { key: "noiseReduction", label: "Noise Reduction", min: 0, max: 100, step: 1 },
];

/* ── Component ─────────────────────────────────────────────── */

export default function ImageEnhancerWorkspace() {
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageName, setImageName] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [showBefore, setShowBefore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* Enhancement state */
  const [state, setState] = useState<EnhancementState>({ ...DEFAULT_STATE });
  const [filter, setFilter] = useState<Filter>("none");
  const [activePreset, setActivePreset] = useState<AIPreset | null>(null);
  const [upscale, setUpscale] = useState<number | null>(null);
  const [exportFormat, setExportFormat] = useState<"png" | "jpeg">("png");
  const [exportQuality, setExportQuality] = useState(90);

  /* History */
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const pushHistory = useCallback(
    (label: string, newState: EnhancementState, newFilter: Filter, preset: AIPreset | null) => {
      setHistory((prev) => {
        const trimmed = prev.slice(0, historyIdx + 1);
        const entry: HistoryEntry = { label, state: { ...newState }, filter: newFilter, preset };
        const next = [...trimmed, entry].slice(-10);
        return next;
      });
      setHistoryIdx((prev) => Math.min(prev + 1, 9));
    },
    [historyIdx]
  );

  const undo = () => {
    if (historyIdx <= 0) return;
    const prev = history[historyIdx - 1];
    setState({ ...prev.state });
    setFilter(prev.filter);
    setActivePreset(prev.preset);
    setHistoryIdx((i) => i - 1);
  };

  /* ── File handling ───────────────────────────────────────── */
  const loadImage = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) return;
      setImageUrl(URL.createObjectURL(file));
      setImageName(file.name);
      setState({ ...DEFAULT_STATE });
      setFilter("none");
      setActivePreset(null);
      setUpscale(null);
      setHistory([]);
      setHistoryIdx(-1);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  /* ── Update helpers ─────────────────────────────────────── */
  const updateSlider = (key: keyof EnhancementState, value: number) => {
    const newState = { ...state, [key]: value };
    setState(newState);
    pushHistory(`${key}: ${value}`, newState, filter, activePreset);
  };

  const applyPreset = (preset: AIPreset) => {
    setActivePreset(preset);
    let newState = { ...DEFAULT_STATE };
    switch (preset) {
      case "auto":
        newState = { brightness: 5, contrast: 10, saturation: 10, sharpness: 20, temperature: 0, exposure: 5, noiseReduction: 10 };
        break;
      case "portrait":
        newState = { brightness: 5, contrast: 5, saturation: -5, sharpness: 15, temperature: 5, exposure: 5, noiseReduction: 15 };
        break;
      case "landscape":
        newState = { brightness: 0, contrast: 15, saturation: 20, sharpness: 30, temperature: -5, exposure: 0, noiseReduction: 5 };
        break;
      case "product":
        newState = { brightness: 10, contrast: 15, saturation: 5, sharpness: 40, temperature: 0, exposure: 10, noiseReduction: 0 };
        break;
      case "night":
        newState = { brightness: 15, contrast: 10, saturation: 5, sharpness: 10, temperature: -10, exposure: 30, noiseReduction: 30 };
        break;
      case "hdr":
        newState = { brightness: 0, contrast: 30, saturation: 25, sharpness: 35, temperature: 0, exposure: 10, noiseReduction: 5 };
        break;
      case "vintage":
        newState = { brightness: -5, contrast: -10, saturation: -20, sharpness: 0, temperature: 15, exposure: -5, noiseReduction: 0 };
        break;
      case "film":
        newState = { brightness: -3, contrast: 15, saturation: -10, sharpness: 5, temperature: 5, exposure: 0, noiseReduction: 0 };
        break;
    }
    setState(newState);
    pushHistory(`Preset: ${preset}`, newState, filter, preset);
  };

  const applyFilter = (f: Filter) => {
    setFilter(f);
    pushHistory(`Filter: ${f}`, state, f, activePreset);
  };

  const resetAll = () => {
    setState({ ...DEFAULT_STATE });
    setFilter("none");
    setActivePreset(null);
    setUpscale(null);
    pushHistory("Reset", { ...DEFAULT_STATE }, "none", null);
  };

  /* ── CSS filter string ──────────────────────────────────── */
  const cssFilter = (): string => {
    const parts: string[] = [];
    parts.push(`brightness(${100 + state.brightness}%)`);
    parts.push(`contrast(${100 + state.contrast}%)`);
    parts.push(`saturate(${100 + state.saturation}%)`);
    if (state.temperature > 0) parts.push(`hue-rotate(-${state.temperature * 0.5}deg)`);
    if (state.temperature < 0) parts.push(`hue-rotate(${Math.abs(state.temperature) * 0.5}deg)`);
    const filterObj = FILTERS.find((f) => f.id === filter);
    if (filterObj?.css) parts.push(filterObj.css);
    return parts.join(" ");
  };

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = () => {
    /* placeholder – would render canvas and download */
  };

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
          {/* AI Presets */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Enhance
            </h3>
            <div className="grid grid-cols-4 gap-1.5">
              {AI_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  disabled={!imageUrl}
                  className={`px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50 ${activePreset === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhancement Sliders */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconImage className="size-4 text-primary-500" />
              Adjustments
            </h3>
            {SLIDERS.map((s) => (
              <div key={s.key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">{s.label}</span>
                  <span className="text-gray-900 dark:text-white font-semibold">
                    {s.key === "exposure" ? (state[s.key] / 100).toFixed(1) : state[s.key]}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={state[s.key]}
                  onChange={(e) => updateSlider(s.key, Number(e.target.value))}
                  disabled={!imageUrl}
                  className="w-full accent-primary-500"
                />
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">Filters</label>
            <div className="grid grid-cols-4 gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => applyFilter(f.id)}
                  disabled={!imageUrl}
                  className={`px-1 py-1.5 rounded-lg text-[10px] font-medium transition-colors disabled:opacity-50 ${filter === f.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Upscale */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">Upscale</label>
            <div className="grid grid-cols-2 gap-1.5">
              {UPSCALE_OPTIONS.map((u) => (
                <button
                  key={u.value}
                  onClick={() => setUpscale(upscale === u.value ? null : u.value)}
                  disabled={!imageUrl}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${upscale === u.value ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {u.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={() => setShowBefore((p) => !p)}
              disabled={!imageUrl}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-colors disabled:opacity-50 ${showBefore ? "bg-primary-500 text-gray-950" : "border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"}`}
            >
              {showBefore ? "Show After" : "Show Before"}
            </button>
            <button
              onClick={resetAll}
              disabled={!imageUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              <IconRepeat className="size-3.5" />
              Reset All
            </button>
            <button
              onClick={undo}
              disabled={historyIdx <= 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              Undo ({Math.max(0, historyIdx)} steps)
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Export</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {(["png", "jpeg"] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${exportFormat === fmt ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {fmt}
                </button>
              ))}
            </div>
            {exportFormat === "jpeg" && (
              <div className="space-y-1">
                <label className="block text-xs text-gray-400">
                  Quality: <span className="text-gray-900 dark:text-white font-semibold">{exportQuality}%</span>
                </label>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={exportQuality}
                  onChange={(e) => setExportQuality(Number(e.target.value))}
                  className="w-full accent-primary-500"
                />
              </div>
            )}
            <button
              onClick={handleExport}
              disabled={!imageUrl}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              <IconDownload className="size-4" />
              Export {exportFormat.toUpperCase()}
            </button>
          </div>

          {/* History */}
          {history.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400 font-semibold uppercase tracking-wider">
                History ({history.length})
              </label>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className={`px-2 py-1 rounded text-[10px] truncate ${i === historyIdx ? "bg-primary-500/10 text-primary-500 font-semibold" : "text-gray-400"}`}
                  >
                    {i + 1}. {h.label}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}>
          {/* Upload Zone */}
          {!imageUrl && (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed p-16 text-center cursor-pointer transition-colors ${dragOver ? "border-primary-500 bg-primary-500/5" : "border-gray-300 dark:border-gray-700 hover:border-primary-500/50 bg-white dark:bg-gray-900"}`}
            >
              <IconPlus className="size-10 mx-auto mb-3 text-gray-400" />
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Drag & drop an image or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WebP supported</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) loadImage(file);
                }}
              />
            </div>
          )}

          {/* Image Preview */}
          {imageUrl && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="relative flex items-center justify-center bg-gray-100 dark:bg-gray-800 min-h-96">
                <img
                  src={imageUrl}
                  alt={imageName}
                  className="max-w-full max-h-[70vh] object-contain transition-all"
                  style={{ filter: showBefore ? "none" : cssFilter() }}
                />
                {showBefore && (
                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[10px] font-semibold">
                      Original
                    </span>
                  </div>
                )}
                {upscale && (
                  <div className="absolute bottom-3 right-3">
                    <span className="px-2 py-0.5 rounded-full bg-primary-500/90 text-gray-950 text-[10px] font-semibold">
                      {upscale}× Upscale
                    </span>
                  </div>
                )}
              </div>
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-xs text-gray-400 truncate">{imageName}</span>
                <button
                  onClick={() => {
                    setImageUrl(null);
                    setImageName("");
                    resetAll();
                  }}
                  className="text-xs text-red-500 hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!imageUrl && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconImage className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Enhance Your Images
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Upload an image to enhance it with AI presets, manual adjustments, filters, and upscaling. Use the controls in the settings panel to fine-tune your image.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
