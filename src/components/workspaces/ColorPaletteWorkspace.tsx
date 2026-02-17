"use client";

import { useState, useCallback } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTrash,
  IconFilter,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type PaletteMode =
  | "ai"
  | "manual"
  | "complementary"
  | "analogous"
  | "triadic"
  | "monochromatic"
  | "from-image";

type Mood = "vibrant" | "pastel" | "earth" | "neon" | "corporate" | "luxury";
type ExportFormat = "css" | "tailwind" | "json" | "ase";

interface ColorSwatch {
  hex: string;
  rgb: string;
  hsl: string;
}

interface SavedPalette {
  id: string;
  name: string;
  colors: string[];
  createdAt: number;
}

const PALETTE_MODES: { id: PaletteMode; label: string }[] = [
  { id: "ai", label: "AI Generated" },
  { id: "from-image", label: "From Image" },
  { id: "manual", label: "Manual" },
  { id: "complementary", label: "Complementary" },
  { id: "analogous", label: "Analogous" },
  { id: "triadic", label: "Triadic" },
  { id: "monochromatic", label: "Monochromatic" },
];

const MOODS: { id: Mood; label: string }[] = [
  { id: "vibrant", label: "Vibrant" },
  { id: "pastel", label: "Pastel" },
  { id: "earth", label: "Earth" },
  { id: "neon", label: "Neon" },
  { id: "corporate", label: "Corporate" },
  { id: "luxury", label: "Luxury" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Color utilities ──────────────────────────────────────── */

function hexToRgbArr(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, Math.round(l * 100)];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToSwatch(hex: string): ColorSwatch {
  const [r, g, b] = hexToRgbArr(hex);
  const [h, s, l] = rgbToHsl(r, g, b);
  return {
    hex,
    rgb: `rgb(${r}, ${g}, ${b})`,
    hsl: `hsl(${h}, ${s}%, ${l}%)`,
  };
}

function generateHarmony(base: string, mode: PaletteMode): string[] {
  const [r, g, b] = hexToRgbArr(base);
  const [h, s, l] = rgbToHsl(r, g, b);

  switch (mode) {
    case "complementary":
      return [base, hslToHex((h + 180) % 360, s, l), hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l), hslToHex(h, s, Math.min(90, l + 20))];
    case "analogous":
      return [hslToHex((h - 30 + 360) % 360, s, l), hslToHex((h - 15 + 360) % 360, s, l), base, hslToHex((h + 15) % 360, s, l), hslToHex((h + 30) % 360, s, l)];
    case "triadic":
      return [base, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l), hslToHex(h, s, Math.min(90, l + 20)), hslToHex(h, s, Math.max(10, l - 20))];
    case "monochromatic":
      return [hslToHex(h, s, 90), hslToHex(h, s, 70), hslToHex(h, s, 50), hslToHex(h, s, 30), hslToHex(h, s, 15)];
    default:
      return [base, "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b"];
  }
}

function generateTintsShades(hex: string): string[] {
  const [r, g, b] = hexToRgbArr(hex);
  const [h, s] = rgbToHsl(r, g, b);
  return [95, 85, 70, 55, 40, 30, 20, 10].map((l) => hslToHex(h, s, l));
}

function contrastRatio(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const [r, g, b] = hexToRgbArr(hex).map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  const lighter = Math.max(l1, l2), darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/* ── Component ─────────────────────────────────────────────── */

export default function ColorPaletteWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  const [mode, setMode] = useState<PaletteMode>("ai");
  const [mood, setMood] = useState<Mood>("vibrant");
  const [baseColor, setBaseColor] = useState("#8ae600");
  const [palette, setPalette] = useState<string[]>([]);
  const [savedPalettes, setSavedPalettes] = useState<SavedPalette[]>([]);
  const [contrastPair, setContrastPair] = useState<[number, number]>([0, 1]);
  const [showColorBlind, setShowColorBlind] = useState(false);
  const [paletteName, setPaletteName] = useState("");

  const swatches = palette.map(hexToSwatch);
  const selectedTints = palette[0] ? generateTintsShades(palette[0]) : [];

  /* ── Copy color ─────────────────────────────────────────── */
  const copyColor = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  /* ── Generate from mode ─────────────────────────────────── */
  const generateFromMode = useCallback(() => {
    if (mode === "manual") {
      setPalette([baseColor]);
      return;
    }
    if (mode === "ai" || mode === "from-image") return; // handled by AI call
    setPalette(generateHarmony(baseColor, mode));
  }, [baseColor, mode]);

  /* ── AI: Generate Palette ───────────────────────────────── */
  const generateAIPalette = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate a color palette with mood "${mood}". Base color hint: ${baseColor}. Return exactly 5 hex color codes as JSON: { "colors": ["#hex1", "#hex2", "#hex3", "#hex4", "#hex5"] }. Make the colors harmonious and suitable for a ${mood} design aesthetic. Return ONLY the JSON.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (Array.isArray(data.colors) && data.colors.length > 0) {
          setPalette(data.colors.slice(0, 5));
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Add manual color ───────────────────────────────────── */
  const addManualColor = () => {
    if (palette.length < 10) {
      setPalette((p) => [...p, baseColor]);
    }
  };

  const removeColor = (idx: number) => {
    setPalette((p) => p.filter((_, i) => i !== idx));
  };

  /* ── Save palette ───────────────────────────────────────── */
  const savePalette = () => {
    if (palette.length === 0) return;
    setSavedPalettes((prev) => [
      ...prev,
      { id: uid(), name: paletteName || `Palette ${prev.length + 1}`, colors: [...palette], createdAt: Date.now() },
    ]);
    setPaletteName("");
  };

  const deleteSaved = (id: string) => {
    setSavedPalettes((p) => p.filter((sp) => sp.id !== id));
  };

  const loadSaved = (sp: SavedPalette) => {
    setPalette([...sp.colors]);
  };

  /* ── Accessibility ──────────────────────────────────────── */
  const contrastResult = palette.length >= 2
    ? contrastRatio(palette[contrastPair[0]] ?? "#000000", palette[contrastPair[1]] ?? "#ffffff")
    : null;

  /* ── Export ─────────────────────────────────────────────── */
  const exportPalette = (format: ExportFormat) => {
    let content = "";
    let ext = "txt";
    let mime = "text/plain";

    switch (format) {
      case "css":
        content = `:root {\n${palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n")}\n}`;
        ext = "css";
        mime = "text/css";
        break;
      case "tailwind":
        content = `// tailwind.config.js colors\nconst colors = {\n  palette: {\n${palette.map((c, i) => `    '${(i + 1) * 100}': '${c}',`).join("\n")}\n  }\n};`;
        ext = "js";
        mime = "text/javascript";
        break;
      case "json":
        content = JSON.stringify({ palette: palette.map((hex, i) => ({ id: i + 1, ...hexToSwatch(hex) })) }, null, 2);
        ext = "json";
        mime = "application/json";
        break;
      case "ase":
        content = palette.map((c) => `${c} ${hexToSwatch(c).rgb}`).join("\n");
        ext = "txt";
        break;
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `palette.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
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
          {/* Mode */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconFilter className="size-4 text-primary-500" />
              Palette Mode
            </h3>
            <div className="grid grid-cols-2 gap-1.5">
              {PALETTE_MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${mode === m.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Base Color */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Base Color</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
                className="size-10 rounded-lg cursor-pointer bg-transparent border-0"
              />
              <input
                className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                value={baseColor}
                onChange={(e) => setBaseColor(e.target.value)}
              />
              <div className="size-10 rounded-lg border border-gray-700" style={{ backgroundColor: baseColor }} />
            </div>
          </div>

          {/* Mood (AI mode) */}
          {(mode === "ai" || mode === "from-image") && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">Mood</label>
              <div className="grid grid-cols-3 gap-1.5">
                {MOODS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${mood === m.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color blindness toggle */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={showColorBlind}
                onChange={(e) => setShowColorBlind(e.target.checked)}
                className="accent-primary-500"
              />
              Simulate Color Blindness (Deuteranopia)
            </label>
          </div>

          {/* Generate / Add */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              Generate
            </h3>
            {mode === "ai" || mode === "from-image" ? (
              <button
                onClick={generateAIPalette}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
              >
                {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
                {loading ? "Generating…" : "AI Generate Palette"}
              </button>
            ) : (
              <button
                onClick={generateFromMode}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 transition-colors"
              >
                <IconWand className="size-4" />
                Generate {PALETTE_MODES.find((m) => m.id === mode)?.label}
              </button>
            )}
            {mode === "manual" && (
              <button
                onClick={addManualColor}
                disabled={palette.length >= 10}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <IconPlus className="size-4" />
                Add Color
              </button>
            )}
          </div>

          {/* Save Palette */}
          {palette.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">Save Palette</label>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  placeholder="Palette name…"
                  value={paletteName}
                  onChange={(e) => setPaletteName(e.target.value)}
                />
                <button
                  onClick={savePalette}
                  className="px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-semibold hover:bg-primary-400 transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Export */}
          {palette.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400 mb-2">Export As</label>
              <div className="grid grid-cols-2 gap-2">
                {(["css", "tailwind", "json", "ase"] as ExportFormat[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => exportPalette(f)}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors uppercase"
                  >
                    <IconDownload className="size-3.5" />
                    {f}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}
        >
          {/* Palette Swatches */}
          {palette.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Palette ({palette.length} colors)
              </h3>
              <div className={`flex gap-2 ${showColorBlind ? "grayscale" : ""}`}>
                {swatches.map((sw, i) => (
                  <div key={i} className="flex-1 space-y-2">
                    <div
                      className="aspect-square rounded-xl border border-gray-700 cursor-pointer hover:scale-105 transition-transform relative group"
                      style={{ backgroundColor: sw.hex }}
                      onClick={() => copyColor(sw.hex)}
                    >
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30 rounded-xl">
                        {copiedValue === sw.hex ? (
                          <IconCheck className="size-5 text-white" />
                        ) : (
                          <IconCopy className="size-5 text-white" />
                        )}
                      </div>
                      {mode === "manual" && (
                        <button
                          onClick={(e) => { e.stopPropagation(); removeColor(i); }}
                          className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <IconTrash className="size-3" />
                        </button>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <button onClick={() => copyColor(sw.hex)} className="block w-full text-left text-[11px] font-mono text-gray-900 dark:text-white hover:text-primary-500 transition-colors truncate">
                        {sw.hex}
                      </button>
                      <button onClick={() => copyColor(sw.rgb)} className="block w-full text-left text-[10px] font-mono text-gray-500 hover:text-primary-500 transition-colors truncate">
                        {sw.rgb}
                      </button>
                      <button onClick={() => copyColor(sw.hsl)} className="block w-full text-left text-[10px] font-mono text-gray-500 hover:text-primary-500 transition-colors truncate">
                        {sw.hsl}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {showColorBlind && (
                <p className="text-[10px] text-gray-400 text-center">Simulated Deuteranopia (green-blind) view</p>
              )}
            </div>
          )}

          {/* Accessibility Checker */}
          {palette.length >= 2 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Accessibility Checker</h3>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Foreground</label>
                  <select
                    value={contrastPair[0]}
                    onChange={(e) => setContrastPair([Number(e.target.value), contrastPair[1]])}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    {palette.map((c, i) => (
                      <option key={i} value={i}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">Background</label>
                  <select
                    value={contrastPair[1]}
                    onChange={(e) => setContrastPair([contrastPair[0], Number(e.target.value)])}
                    className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none"
                  >
                    {palette.map((c, i) => (
                      <option key={i} value={i}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              {contrastResult !== null && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="size-16 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: palette[contrastPair[1]], color: palette[contrastPair[0]] }}>
                      Aa
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        Ratio: {contrastResult.toFixed(2)}:1
                      </p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${contrastResult >= 4.5 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          AA {contrastResult >= 4.5 ? "PASS" : "FAIL"}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${contrastResult >= 7 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          AAA {contrastResult >= 7 ? "PASS" : "FAIL"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tints & Shades */}
          {palette.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Tints & Shades</h3>
              <div className="flex gap-1">
                {selectedTints.map((hex, i) => (
                  <div
                    key={i}
                    onClick={() => copyColor(hex)}
                    className="flex-1 aspect-square rounded-lg cursor-pointer hover:scale-105 transition-transform relative group"
                    style={{ backgroundColor: hex }}
                  >
                    <span className="absolute bottom-0.5 left-0 right-0 text-[8px] font-mono text-center opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ color: i < 4 ? "#000" : "#fff" }}
                    >
                      {hex}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Palettes */}
          {savedPalettes.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Saved Palettes</h3>
              <div className="space-y-2">
                {savedPalettes.map((sp) => (
                  <div
                    key={sp.id}
                    className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                    onClick={() => loadSaved(sp)}
                  >
                    <div className="flex gap-0.5">
                      {sp.colors.map((c, i) => (
                        <div key={i} className="size-5 rounded" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                    <span className="flex-1 text-xs font-medium text-gray-900 dark:text-white truncate">{sp.name}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteSaved(sp.id); }}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <IconTrash className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {palette.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconFilter className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate a Color Palette
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Choose a palette mode, set your base color, and generate harmonious color palettes with AI or color theory rules.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
