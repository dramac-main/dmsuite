"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconPlus,
  IconTrash,
  IconCheck,
  IconMonitor,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type PageType = "landing" | "dashboard" | "blog" | "ecommerce" | "mobile-app" | "portfolio";
type DeviceFrame = "desktop" | "tablet" | "mobile";

interface WireframeElement {
  id: string;
  type: string;
  label: string;
  annotation: string;
}

interface WireframeConfig {
  pageType: PageType;
  device: DeviceFrame;
  showGrid: boolean;
  showGuides: boolean;
}

const PAGE_TYPES: { id: PageType; label: string }[] = [
  { id: "landing", label: "Landing Page" },
  { id: "dashboard", label: "Dashboard" },
  { id: "blog", label: "Blog" },
  { id: "ecommerce", label: "E-commerce" },
  { id: "mobile-app", label: "Mobile App" },
  { id: "portfolio", label: "Portfolio" },
];

const DEVICE_FRAMES: { id: DeviceFrame; label: string; width: number }[] = [
  { id: "desktop", label: "Desktop", width: 1440 },
  { id: "tablet", label: "Tablet", width: 768 },
  { id: "mobile", label: "Mobile", width: 375 },
];

const ELEMENT_PALETTE = [
  "Header",
  "Navigation",
  "Hero",
  "Text Block",
  "Image Placeholder",
  "Button",
  "Form",
  "Card Grid",
  "Footer",
  "Sidebar",
] as const;

const ELEMENT_HEIGHTS: Record<string, number> = {
  Header: 60,
  Navigation: 48,
  Hero: 320,
  "Text Block": 120,
  "Image Placeholder": 200,
  Button: 48,
  Form: 260,
  "Card Grid": 240,
  Footer: 100,
  Sidebar: 400,
};

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

/* ── Component ─────────────────────────────────────────────── */

export default function WireframeWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"content" | "settings">("content");
  const [copied, setCopied] = useState(false);

  const [config, setConfig] = useState<WireframeConfig>({
    pageType: "landing",
    device: "desktop",
    showGrid: true,
    showGuides: true,
  });

  const [elements, setElements] = useState<WireframeElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const deviceInfo = DEVICE_FRAMES.find((d) => d.id === config.device) ?? DEVICE_FRAMES[0];

  /* ── Element management ─────────────────────────────────── */
  const addElement = (type: string) => {
    setElements((prev) => [
      ...prev,
      { id: uid(), type, label: type, annotation: "" },
    ]);
  };

  const removeElement = (id: string) => {
    setElements((prev) => prev.filter((e) => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const moveElement = (id: string, dir: -1 | 1) => {
    setElements((prev) => {
      const idx = prev.findIndex((e) => e.id === id);
      if (idx < 0) return prev;
      const target = idx + dir;
      if (target < 0 || target >= prev.length) return prev;
      const arr = [...prev];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
  };

  const updateAnnotation = (id: string, annotation: string) => {
    setElements((prev) =>
      prev.map((e) => (e.id === id ? { ...e, annotation } : e))
    );
  };

  /* ── Canvas rendering ───────────────────────────────────── */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const sourceW = deviceInfo.width;
    const gap = 8;
    const padding = 24;
    let totalH = padding * 2;
    for (const el of elements) {
      totalH += (ELEMENT_HEIGHTS[el.type] ?? 80) + gap;
    }
    totalH = Math.max(totalH, 600);

    // Scale to fit canvas container
    const containerW = canvas.parentElement?.clientWidth ?? 800;
    const scale = Math.min(1, (containerW - 32) / sourceW);
    canvas.width = sourceW * scale;
    canvas.height = totalH * scale;
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = "#1f2937";
    ctx.fillRect(0, 0, sourceW, totalH);

    // Grid
    if (config.showGrid) {
      ctx.strokeStyle = "rgba(255,255,255,0.04)";
      ctx.lineWidth = 1;
      for (let x = 0; x <= sourceW; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, totalH);
        ctx.stroke();
      }
      for (let y = 0; y <= totalH; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(sourceW, y);
        ctx.stroke();
      }
    }

    // Guides (center + margins)
    if (config.showGuides) {
      ctx.setLineDash([6, 4]);
      ctx.strokeStyle = "rgba(138,230,0,0.25)";
      ctx.lineWidth = 1;
      const cx = sourceW / 2;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, totalH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(padding, 0);
      ctx.lineTo(padding, totalH);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(sourceW - padding, 0);
      ctx.lineTo(sourceW - padding, totalH);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Elements
    let y = padding;
    for (const el of elements) {
      const h = ELEMENT_HEIGHTS[el.type] ?? 80;
      const x = padding;
      const w = sourceW - padding * 2;
      const isSelected = el.id === selectedId;

      // Block
      ctx.fillStyle = isSelected ? "rgba(138,230,0,0.12)" : "rgba(255,255,255,0.06)";
      ctx.strokeStyle = isSelected ? "#8ae600" : "rgba(255,255,255,0.15)";
      ctx.lineWidth = isSelected ? 2 : 1;
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Dashed cross pattern
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y + h);
      ctx.moveTo(x + w, y);
      ctx.lineTo(x, y + h);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label
      ctx.fillStyle = isSelected ? "#8ae600" : "rgba(255,255,255,0.5)";
      ctx.font = "600 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(el.label.toUpperCase(), x + w / 2, y + h / 2);

      // Annotation
      if (el.annotation) {
        ctx.font = "11px Inter, system-ui, sans-serif";
        ctx.fillStyle = "rgba(138,230,0,0.7)";
        ctx.textAlign = "left";
        ctx.fillText(el.annotation, x + 8, y + h - 10);
      }

      y += h + gap;
    }

    // Device label
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "11px Inter, system-ui, sans-serif";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillText(`${deviceInfo.label} · ${deviceInfo.width}px`, sourceW - padding, 8);
  }, [elements, config, selectedId, deviceInfo]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  /* ── AI: Suggest Layout ─────────────────────────────────── */
  const suggestLayout = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `Suggest a wireframe layout for a "${PAGE_TYPES.find((p) => p.id === config.pageType)?.label}" page on ${deviceInfo.label} (${deviceInfo.width}px wide). Return a JSON array of wireframe element types in order from top to bottom. Valid types: ${ELEMENT_PALETTE.join(", ")}. Return ONLY a JSON object: { "elements": ["Header", "Navigation", ...] }. Include 6-10 elements that make sense for this page type.`,
            },
          ],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (Array.isArray(data.elements)) {
          setElements(
            data.elements
              .filter((t: string) => ELEMENT_PALETTE.includes(t as (typeof ELEMENT_PALETTE)[number]))
              .map((t: string) => ({ id: uid(), type: t, label: t, annotation: "" }))
          );
        }
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  };

  /* ── Export PNG ──────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `wireframe-${config.pageType}-${config.device}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
          {/* Page Type */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconMonitor className="size-4 text-primary-500" />
              Page Settings
            </h3>

            <label className="block text-xs text-gray-400">Page Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {PAGE_TYPES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setConfig((prev) => ({ ...prev, pageType: p.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.pageType === p.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Device Frame */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Device Frame</label>
            <div className="grid grid-cols-3 gap-1.5">
              {DEVICE_FRAMES.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setConfig((prev) => ({ ...prev, device: d.id }))}
                  className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${config.device === d.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}
                >
                  <div>{d.label}</div>
                  <div className="text-[10px] opacity-70">{d.width}px</div>
                </button>
              ))}
            </div>
          </div>

          {/* Grid & Guides */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <label className="block text-xs text-gray-400">Canvas Options</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGrid}
                  onChange={(e) => setConfig((p) => ({ ...p, showGrid: e.target.checked }))}
                  className="accent-primary-500"
                />
                Grid
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.showGuides}
                  onChange={(e) => setConfig((p) => ({ ...p, showGuides: e.target.checked }))}
                  className="accent-primary-500"
                />
                Guides
              </label>
            </div>
          </div>

          {/* Element Palette */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Element Palette</h3>
            <div className="grid grid-cols-2 gap-1.5">
              {ELEMENT_PALETTE.map((el) => (
                <button
                  key={el}
                  onClick={() => addElement(el)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  <IconPlus className="size-3 text-primary-500" />
                  {el}
                </button>
              ))}
            </div>
          </div>

          {/* Selected Elements */}
          {elements.length > 0 && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Layout Order ({elements.length})
              </h3>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {elements.map((el, i) => (
                  <div
                    key={el.id}
                    onClick={() => setSelectedId(el.id === selectedId ? null : el.id)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${el.id === selectedId ? "bg-primary-500/10 text-primary-500 ring-1 ring-primary-500/30" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                  >
                    <span className="text-[10px] text-gray-400 w-4">{i + 1}</span>
                    <span className="flex-1 font-medium truncate">{el.label}</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveElement(el.id, -1); }}
                      className="hover:text-primary-500 text-gray-400"
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); moveElement(el.id, 1); }}
                      className="hover:text-primary-500 text-gray-400"
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="hover:text-red-400 text-gray-400"
                    >
                      <IconTrash className="size-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Annotation */}
          {selectedId && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <label className="block text-xs text-gray-400">
                Annotation for &quot;{elements.find((e) => e.id === selectedId)?.label}&quot;
              </label>
              <input
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="Add annotation…"
                value={elements.find((e) => e.id === selectedId)?.annotation ?? ""}
                onChange={(e) => updateAnnotation(selectedId, e.target.value)}
              />
            </div>
          )}

          {/* AI & Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <IconSparkles className="size-4 text-primary-500" />
              AI Layout
            </h3>
            <button
              onClick={suggestLayout}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <IconLoader className="size-4 animate-spin" />
              ) : (
                <IconWand className="size-4" />
              )}
              {loading ? "Generating…" : "Suggest Layout"}
            </button>
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button
              onClick={exportPNG}
              disabled={elements.length === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {copied ? (
                <IconCheck className="size-4 text-green-500" />
              ) : (
                <IconDownload className="size-4" />
              )}
              {copied ? "Exported!" : "Export PNG"}
            </button>
          </div>
        </div>

        {/* ── Content Area ─────────────────────────────────── */}
        <div
          className={`flex-1 min-w-0 space-y-4 ${mobileTab !== "content" ? "hidden lg:block" : ""}`}
        >
          {/* Canvas */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 overflow-auto">
            <canvas ref={canvasRef} className="mx-auto block rounded-lg" />
          </div>

          {/* Empty State */}
          {elements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <IconMonitor className="size-12 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Start Your Wireframe
              </h3>
              <p className="text-sm text-gray-400 max-w-md">
                Add elements from the palette in the settings panel, or use AI to suggest a layout for your page type.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
