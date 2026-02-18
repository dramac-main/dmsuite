"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload, IconFileText, IconCopy,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type PageSize = "a4" | "letter" | "legal";
type LetterheadTemplate = "minimal" | "corporate" | "elegant" | "modern" | "bold" | "creative";

interface LetterheadConfig {
  template: LetterheadTemplate;
  pageSize: PageSize;
  primaryColor: string;
  companyName: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  showWatermark: boolean;
  description: string;
}

const PAGE_SIZES: { id: PageSize; name: string; w: number; h: number }[] = [
  { id: "a4", name: "A4", w: 595, h: 842 },
  { id: "letter", name: "US Letter", w: 612, h: 792 },
  { id: "legal", name: "Legal", w: 612, h: 1008 },
];

const TEMPLATES: { id: LetterheadTemplate; name: string }[] = [
  { id: "minimal", name: "Minimal" },
  { id: "corporate", name: "Corporate" },
  { id: "elegant", name: "Elegant" },
  { id: "modern", name: "Modern" },
  { id: "bold", name: "Bold" },
  { id: "creative", name: "Creative" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

/* ── Component ─────────────────────────────────────────────── */

export default function LetterheadDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<LetterheadConfig>({
    template: "corporate",
    pageSize: "a4",
    primaryColor: "#1e40af",
    companyName: "DMSuite Solutions",
    tagline: "AI-Powered Design Excellence",
    address: "Plot 1234, Cairo Road, Lusaka, Zambia",
    phone: "+260 97 1234567",
    email: "info@dmsuite.com",
    website: "www.dmsuite.com",
    showWatermark: true,
    description: "",
  });

  const ps = PAGE_SIZES.find((p) => p.id === config.pageSize)!;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = ps.w;
    canvas.height = ps.h;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ps.w, ps.h);

    const bleed = 8;
    const margin = 50;

    // Header area
    const headerH = 100;
    if (config.template === "corporate" || config.template === "bold") {
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(0, 0, ps.w, headerH);
      ctx.fillStyle = "#ffffff";
    } else if (config.template === "modern") {
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(0, 0, 6, ps.h);
      ctx.fillStyle = config.primaryColor;
    } else if (config.template === "elegant") {
      ctx.strokeStyle = config.primaryColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(margin - 10, margin - 10, ps.w - (margin - 10) * 2, ps.h - (margin - 10) * 2);
    } else if (config.template === "creative") {
      ctx.fillStyle = config.primaryColor + "15";
      ctx.beginPath();
      ctx.arc(ps.w - 80, 80, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = config.primaryColor + "10";
      ctx.beginPath();
      ctx.arc(60, ps.h - 60, 80, 0, Math.PI * 2);
      ctx.fill();
    }

    // Company name
    const nameY = config.template === "corporate" || config.template === "bold" ? 50 : 60;
    const nameColor = config.template === "corporate" || config.template === "bold" ? "#ffffff" : config.primaryColor;
    ctx.fillStyle = nameColor;
    ctx.font = `bold ${config.template === "bold" ? 28 : 22}px Inter, sans-serif`;
    ctx.textAlign = config.template === "modern" ? "left" : "center";
    const nameX = config.template === "modern" ? margin + 10 : ps.w / 2;
    ctx.fillText(config.companyName, nameX, nameY);

    // Tagline
    if (config.tagline) {
      ctx.font = "12px Inter, sans-serif";
      ctx.fillStyle = config.template === "corporate" || config.template === "bold" ? "rgba(255,255,255,0.8)" : "#64748b";
      ctx.fillText(config.tagline, nameX, nameY + 20);
    }

    // Watermark
    if (config.showWatermark) {
      ctx.save();
      ctx.globalAlpha = 0.03;
      ctx.font = "bold 120px Inter, sans-serif";
      ctx.fillStyle = config.primaryColor;
      ctx.textAlign = "center";
      ctx.translate(ps.w / 2, ps.h / 2);
      ctx.rotate(-0.3);
      ctx.fillText(config.companyName, 0, 0);
      ctx.restore();
    }

    // Body area (writing lines)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 0.5;
    const startY = headerH + 80;
    for (let y = startY; y < ps.h - 120; y += 28) {
      ctx.beginPath();
      ctx.moveTo(margin, y);
      ctx.lineTo(ps.w - margin, y);
      ctx.stroke();
    }

    // Footer
    const footerY = ps.h - 50;
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "center";
    const footerParts = [config.address, config.phone, config.email, config.website].filter(Boolean);
    ctx.fillText(footerParts.join("  |  "), ps.w / 2, footerY);

    if (config.template === "corporate" || config.template === "bold") {
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(0, ps.h - 6, ps.w, 6);
    }

    // Bleed marks
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "#ef444430";
    ctx.lineWidth = 0.5;
    ctx.strokeRect(bleed, bleed, ps.w - bleed * 2, ps.h - bleed * 2);
    ctx.setLineDash([]);
  }, [config, ps, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  const generateAI = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate letterhead content for: ${config.description}. Based in Lusaka, Zambia. Return JSON: { "companyName": "", "tagline": "", "address": "", "phone": "+260...", "email": "", "website": "" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({ ...p, ...data }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `letterhead-${config.template}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const displayW = Math.min(500, ps.w);
  const displayH = displayW * (ps.h / ps.w);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          const pc = config.primaryColor;
          const headerH = h * 0.2;
          if (t.id === "corporate" || t.id === "bold") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, headerH);
            ctx.fillStyle = pc;
            ctx.fillRect(0, h - 2, w, 2);
          } else if (t.id === "modern") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, 3, h);
          } else if (t.id === "elegant") {
            ctx.strokeStyle = pc;
            ctx.lineWidth = 1;
            ctx.strokeRect(4, 4, w - 8, h - 8);
          } else if (t.id === "creative") {
            ctx.fillStyle = pc + "20";
            ctx.beginPath();
            ctx.arc(w - 10, 10, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = pc + "15";
            ctx.beginPath();
            ctx.arc(10, h - 8, 12, 0, Math.PI * 2);
            ctx.fill();
          } else {
            /* minimal */
            ctx.fillStyle = pc;
            ctx.fillRect(w * 0.3, 6, w * 0.4, 1.5);
          }
          /* lines */
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 0.5;
          for (let y = headerH + 8; y < h - 10; y += 6) {
            ctx.beginPath();
            ctx.moveTo(8, y);
            ctx.lineTo(w - 8, y);
            ctx.stroke();
          }
          /* border */
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, w, h);
        },
      })),
    [config.primaryColor]
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }, "image/png");
    } catch {
      /* clipboard may not be available */
    }
  }, []);

  /* ── Panel Definitions for StickyCanvasLayout ───────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as LetterheadTemplate }))}
        thumbWidth={140}
        thumbHeight={100}
        label="Templates"
      />

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconFileText className="size-4 text-primary-500" />Letterhead Settings</h3>
        {[
          { label: "Company Name", key: "companyName" as const },
          { label: "Tagline", key: "tagline" as const },
          { label: "Address", key: "address" as const },
          { label: "Phone", key: "phone" as const },
          { label: "Email", key: "email" as const },
          { label: "Website", key: "website" as const },
        ].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1">{label}</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config[key]} onChange={(e) => setConfig((p) => ({ ...p, [key]: e.target.value }))} />
          </div>
        ))}
        <label className="block text-xs text-gray-400">Page Size</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.pageSize} onChange={(e) => setConfig((p) => ({ ...p, pageSize: e.target.value as PageSize }))}>
          {PAGE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <label className="block text-xs text-gray-400">Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" checked={config.showWatermark} onChange={(e) => setConfig((p) => ({ ...p, showWatermark: e.target.checked }))} className="rounded" />
          Show watermark
        </label>
      </div>

      {/* AI Generation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe your business…" value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${config.template} — ${ps.w}×${ps.h}px`}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            Download PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconCopy className="size-3" />
            Copy
          </button>
        </div>
      }
    />
  );
}
