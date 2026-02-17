"use client";

import { useState, useCallback, useRef } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
  IconCheck,
  IconPlus,
  IconTrash,
  IconStar,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type IconStyle = "line" | "solid" | "duotone" | "flat" | "3d" | "hand-drawn" | "pixel";
type CornerRadius = "sharp" | "rounded" | "circle";
type IconBackground = "none" | "circle" | "rounded-square";
type ColorMode = "mono" | "multi";

interface IconConfig {
  prompt: string;
  style: IconStyle;
  selectedSizes: number[];
  strokeWidth: number;
  colorMode: ColorMode;
  primaryColor: string;
  secondaryColor: string;
  cornerRadius: CornerRadius;
  background: IconBackground;
}

interface GeneratedIcon {
  id: string;
  prompt: string;
  svgContent: string;
  style: IconStyle;
}

const ICON_STYLES: { id: IconStyle; label: string }[] = [
  { id: "line", label: "Line" },
  { id: "solid", label: "Solid" },
  { id: "duotone", label: "Duotone" },
  { id: "flat", label: "Flat" },
  { id: "3d", label: "3D" },
  { id: "hand-drawn", label: "Hand-drawn" },
  { id: "pixel", label: "Pixel" },
];

const SIZE_GRID = [16, 24, 32, 48, 64, 128, 256] as const;

const CORNER_OPTIONS: { id: CornerRadius; label: string }[] = [
  { id: "sharp", label: "Sharp" },
  { id: "rounded", label: "Rounded" },
  { id: "circle", label: "Circle" },
];

const BACKGROUND_OPTIONS: { id: IconBackground; label: string }[] = [
  { id: "none", label: "None" },
  { id: "circle", label: "Circle" },
  { id: "rounded-square", label: "Rounded Square" },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function IconGeneratorWorkspace() {
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [batchInput, setBatchInput] = useState("");
  const [batchMode, setBatchMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const previewRef = useRef<HTMLDivElement>(null);

  const [config, setConfig] = useState<IconConfig>({
    prompt: "",
    style: "line",
    selectedSizes: [24, 48],
    strokeWidth: 2,
    colorMode: "mono",
    primaryColor: "#8ae600",
    secondaryColor: "#06b6d4",
    cornerRadius: "rounded",
    background: "none",
  });

  const [generatedIcons, setGeneratedIcons] = useState<GeneratedIcon[]>([]);
  const [activeIcon, setActiveIcon] = useState<GeneratedIcon | null>(null);

  const toggleSize = (size: number) => {
    setConfig((p) => ({
      ...p,
      selectedSizes: p.selectedSizes.includes(size)
        ? p.selectedSizes.filter((s) => s !== size)
        : [...p.selectedSizes, size].sort((a, b) => a - b),
    }));
  };

  /* ── Build SVG wrapper ──────────────────────────────────── */
  const wrapSvg = useCallback(
    (pathContent: string, size: number): string => {
      const { primaryColor, secondaryColor, colorMode, strokeWidth, style, cornerRadius, background } = config;

      let bgMarkup = "";
      if (background === "circle") {
        bgMarkup = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="${colorMode === "multi" ? secondaryColor : primaryColor}20"/>`;
      } else if (background === "rounded-square") {
        const r = cornerRadius === "sharp" ? 0 : cornerRadius === "rounded" ? size * 0.15 : size * 0.5;
        bgMarkup = `<rect width="${size}" height="${size}" rx="${r}" fill="${colorMode === "multi" ? secondaryColor : primaryColor}20"/>`;
      }

      const strokeAttr = style === "line" || style === "duotone" ? `stroke="${primaryColor}" stroke-width="${strokeWidth}" fill="none"` : `fill="${primaryColor}"`;

      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" ${strokeAttr}>${bgMarkup}${pathContent}</svg>`;
    },
    [config]
  );

  /* ── AI: Generate Icon ──────────────────────────────────── */
  const generateIcon = async (prompt: string) => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Generate an SVG icon for: "${prompt}". Style: ${config.style}. Stroke width: ${config.strokeWidth}px. The icon should fit a 24x24 viewBox. Return ONLY the SVG path elements (no <svg> wrapper). Use simple, clean paths. For example: <path d="M12 2L2 7l10 5 10-5-10-5z"/>. Keep it minimal with 1-3 paths maximum. Return ONLY the SVG path markup, no explanations.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);

      // Extract SVG path content
      let pathContent = clean;
      // Remove any <svg> wrapper if present
      const svgMatch = clean.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
      if (svgMatch) pathContent = svgMatch[1];

      // Ensure we have valid path-like content
      if (!pathContent.includes("<path") && !pathContent.includes("<circle") && !pathContent.includes("<rect") && !pathContent.includes("<line") && !pathContent.includes("<polygon")) {
        // Fallback: simple placeholder icon
        pathContent = '<path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>';
      }

      const icon: GeneratedIcon = {
        id: uid(),
        prompt,
        svgContent: pathContent,
        style: config.style,
      };
      setGeneratedIcons((prev) => [icon, ...prev]);
      setActiveIcon(icon);
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Batch generate ─────────────────────────────────────── */
  const generateBatch = async () => {
    const prompts = batchInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const p of prompts) {
      await generateIcon(p);
    }
  };

  /* ── Copy SVG ───────────────────────────────────────────── */
  const copySvg = async () => {
    if (!activeIcon) return;
    const svg = wrapSvg(activeIcon.svgContent, 24);
    await navigator.clipboard.writeText(svg);
    setCopiedSvg(true);
    setTimeout(() => setCopiedSvg(false), 2000);
  };

  /* ── Export ─────────────────────────────────────────────── */
  const exportIcon = (format: "svg" | "png", size: number) => {
    if (!activeIcon) return;
    const svg = wrapSvg(activeIcon.svgContent, size);

    if (format === "svg") {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `icon-${activeIcon.prompt.replace(/\s+/g, "-").toLowerCase()}-${size}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // PNG export via canvas
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d")!;
    const img = new Image();
    const svgBlob = new Blob([svg], { type: "image/svg+xml" });
    const svgUrl = URL.createObjectURL(svgBlob);
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `icon-${activeIcon.prompt.replace(/\s+/g, "-").toLowerCase()}-${size}.png`;
      a.click();
      URL.revokeObjectURL(svgUrl);
    };
    img.src = svgUrl;
  };

  const removeIcon = (id: string) => {
    setGeneratedIcons((prev) => prev.filter((ic) => ic.id !== id));
    if (activeIcon?.id === id) setActiveIcon(null);
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
          {/* Prompt */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconStar className="size-4 text-primary-500" />
              Icon Description
            </h3>
            <textarea
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
              rows={3}
              placeholder="Describe your icon… e.g. 'shopping cart', 'notification bell'"
              value={config.prompt}
              onChange={(e) => setConfig((p) => ({ ...p, prompt: e.target.value }))}
            />

            {/* Batch Mode Toggle */}
            <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={batchMode}
                onChange={(e) => setBatchMode(e.target.checked)}
                className="accent-primary-500"
              />
              Batch Mode
            </label>
            {batchMode && (
              <textarea
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                rows={2}
                placeholder="Comma-separated: home, settings, user, mail"
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
              />
            )}
          </div>

          {/* Style */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Icon Style</label>
            <div className="grid grid-cols-2 gap-1.5">
              {ICON_STYLES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setConfig((p) => ({ ...p, style: s.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.style === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size Grid */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Export Sizes</label>
            <div className="flex flex-wrap gap-1.5">
              {SIZE_GRID.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.selectedSizes.includes(size) ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Stroke Width (for line style) */}
          {(config.style === "line" || config.style === "duotone") && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">
                Stroke Width:{" "}
                <span className="text-gray-900 dark:text-white font-semibold">{config.strokeWidth}px</span>
              </label>
              <input
                type="range"
                min={1}
                max={4}
                step={0.5}
                value={config.strokeWidth}
                onChange={(e) => setConfig((p) => ({ ...p, strokeWidth: Number(e.target.value) }))}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-[10px] text-gray-400">
                <span>1px</span>
                <span>4px</span>
              </div>
            </div>
          )}

          {/* Color Mode */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Color Mode</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => setConfig((p) => ({ ...p, colorMode: "mono" }))}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.colorMode === "mono" ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                Mono
              </button>
              <button
                onClick={() => setConfig((p) => ({ ...p, colorMode: "multi" }))}
                className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.colorMode === "multi" ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
              >
                Multi
              </button>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={config.primaryColor}
                  onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))}
                  className="size-8 rounded cursor-pointer bg-transparent border-0"
                />
                <input
                  className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                  value={config.primaryColor}
                  onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))}
                />
              </div>
              {config.colorMode === "multi" && (
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig((p) => ({ ...p, secondaryColor: e.target.value }))}
                    className="size-8 rounded cursor-pointer bg-transparent border-0"
                  />
                  <input
                    className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                    value={config.secondaryColor}
                    onChange={(e) => setConfig((p) => ({ ...p, secondaryColor: e.target.value }))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Corner Radius */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Corner Radius</label>
            <div className="grid grid-cols-3 gap-1.5">
              {CORNER_OPTIONS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setConfig((p) => ({ ...p, cornerRadius: c.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.cornerRadius === c.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Background */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Background</label>
            <div className="grid grid-cols-3 gap-1.5">
              {BACKGROUND_OPTIONS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setConfig((p) => ({ ...p, background: bg.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.background === bg.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {bg.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              Generate
            </h3>
            <button
              onClick={batchMode ? generateBatch : () => generateIcon(config.prompt)}
              disabled={loading || (!config.prompt.trim() && !batchMode) || (batchMode && !batchInput.trim())}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconWand className="size-4" />
              )}
              {loading ? "Generating…" : batchMode ? "Generate Batch" : "Generate Icon"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}
        >
          {/* Preview */}
          {activeIcon && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                <span className="text-xs font-semibold text-gray-400">
                  Preview — &quot;{activeIcon.prompt}&quot;
                </span>
                <div className="flex items-center gap-2">
                  <label className="text-[10px] text-gray-400">Zoom</label>
                  <input
                    type="range"
                    min={0.5}
                    max={4}
                    step={0.5}
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(Number(e.target.value))}
                    className="w-20 accent-primary-500"
                  />
                  <span className="text-[10px] text-gray-400 w-8">{zoomLevel}x</span>
                </div>
              </div>
              <div className="flex items-center justify-center bg-gray-950 p-8 min-h-48" ref={previewRef}>
                <div
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center" }}
                  dangerouslySetInnerHTML={{
                    __html: wrapSvg(activeIcon.svgContent, 64),
                  }}
                />
              </div>
              <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                <button
                  onClick={copySvg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {copiedSvg ? <IconCheck className="size-3 text-green-500" /> : <IconCopy className="size-3" />}
                  {copiedSvg ? "Copied!" : "Copy SVG"}
                </button>
                {config.selectedSizes.map((size) => (
                  <div key={size} className="flex gap-1">
                    <button
                      onClick={() => exportIcon("svg", size)}
                      className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
                    >
                      SVG {size}
                    </button>
                    <button
                      onClick={() => exportIcon("png", size)}
                      className="px-2 py-1.5 rounded-lg text-[10px] font-medium text-gray-400 border border-gray-700 hover:bg-gray-800 transition-colors"
                    >
                      PNG {size}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Size Grid Preview */}
          {activeIcon && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Size Preview</h3>
              <div className="flex items-end gap-4 flex-wrap">
                {config.selectedSizes.map((size) => (
                  <div key={size} className="flex flex-col items-center gap-2">
                    <div
                      className="flex items-center justify-center bg-gray-950 rounded-lg p-2"
                      style={{ width: Math.max(size + 16, 40), height: Math.max(size + 16, 40) }}
                    >
                      <div
                        dangerouslySetInnerHTML={{
                          __html: wrapSvg(activeIcon.svgContent, size),
                        }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 font-mono">{size}px</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated Icons Gallery */}
          {generatedIcons.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Generated Icons ({generatedIcons.length})
              </h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {generatedIcons.map((icon) => (
                  <div
                    key={icon.id}
                    onClick={() => setActiveIcon(icon)}
                    className={`relative group flex flex-col items-center gap-1 p-2 rounded-lg cursor-pointer transition-colors ${activeIcon?.id === icon.id ? "bg-primary-500/10 ring-1 ring-primary-500/30" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <div
                      className="flex items-center justify-center size-10"
                      dangerouslySetInnerHTML={{
                        __html: wrapSvg(icon.svgContent, 24),
                      }}
                    />
                    <span className="text-[9px] text-gray-400 truncate w-full text-center">
                      {icon.prompt}
                    </span>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeIcon(icon.id); }}
                      className="absolute -top-1 -right-1 size-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <IconTrash className="size-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {generatedIcons.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconStar className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Generate Custom Icons
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Describe your icon in the settings panel, choose a style, and let AI generate SVG icons for you. Use batch mode for multiple related icons.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
