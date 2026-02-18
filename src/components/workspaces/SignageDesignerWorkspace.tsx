"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconMaximize,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type SignageTemplate = "retail" | "event" | "directional" | "promotional" | "real-estate" | "construction";

interface SignageConfig {
  template: SignageTemplate;
  primaryColor: string;
  sizePreset: string;
  headline: string;
  subheadline: string;
  bodyText: string;
  ctaText: string;
  businessName: string;
  phone: string;
  website: string;
  address: string;
  viewingDistance: string;
  description: string;
}

const SIZE_PRESETS: { id: string; name: string; w: number; h: number; desc: string }[] = [
  { id: "pull-up", name: "Pull-up Banner", w: 425, h: 1000, desc: "850×2000mm" },
  { id: "billboard-h", name: "Billboard (H)", w: 960, h: 320, desc: "14:5 ratio" },
  { id: "billboard-v", name: "Billboard (V)", w: 400, h: 600, desc: "2:3 ratio" },
  { id: "a1-poster", name: "A1 Poster", w: 594, h: 841, desc: "594×841mm" },
  { id: "banner-wide", name: "Wide Banner", w: 1000, h: 300, desc: "10:3 ratio" },
  { id: "yard-sign", name: "Yard Sign", w: 600, h: 400, desc: "18×24 in" },
];

const TEMPLATES: { id: SignageTemplate; name: string }[] = [
  { id: "retail", name: "Retail" },
  { id: "event", name: "Event" },
  { id: "directional", name: "Directional" },
  { id: "promotional", name: "Promotional" },
  { id: "real-estate", name: "Real Estate" },
  { id: "construction", name: "Construction" },
];

const VIEWING_DISTANCES: { id: string; label: string; minFont: number }[] = [
  { id: "close", label: "Close (1-3m)", minFont: 24 },
  { id: "medium", label: "Medium (3-10m)", minFont: 36 },
  { id: "far", label: "Far (10-30m)", minFont: 64 },
  { id: "distant", label: "Distant (30m+)", minFont: 96 },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

/* ── Component ─────────────────────────────────────────────── */

export default function SignageDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<SignageConfig>({
    template: "retail",
    primaryColor: "#1e40af",
    sizePreset: "pull-up",
    headline: "GRAND OPENING",
    subheadline: "Now Open in Lusaka",
    bodyText: "Visit our new store for amazing deals on all products",
    ctaText: "VISIT TODAY",
    businessName: "DMSuite Store",
    phone: "+260 977 123 456",
    website: "www.dmsuite.com",
    address: "Plot 123, Cairo Road, Lusaka",
    viewingDistance: "medium",
    description: "",
  });

  const sizePreset = SIZE_PRESETS.find((s) => s.id === config.sizePreset) || SIZE_PRESETS[0];
  const SW = sizePreset.w;
  const SH = sizePreset.h;
  const viewDist = VIEWING_DISTANCES.find((v) => v.id === config.viewingDistance) || VIEWING_DISTANCES[1];

  const [zoom, setZoom] = useState(0.55);
  const displayWidth = SW * zoom;
  const displayHeight = SH * zoom;

  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render(ctx: CanvasRenderingContext2D, w: number, h: number) {
          const pc = config.primaryColor;
          ctx.fillStyle = t.id === "retail" || t.id === "construction" ? pc : "#ffffff";
          ctx.fillRect(0, 0, w, h);
          if (t.id !== "retail" && t.id !== "construction") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.35);
          }
          ctx.fillStyle = t.id === "retail" || t.id === "construction" ? "#ffffff" : "#1e293b";
          ctx.font = "bold 7px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(t.name, w / 2, h * 0.55, w - 6);
          ctx.fillStyle = pc + "44";
          ctx.fillRect(w * 0.15, h * 0.68, w * 0.7, 2);
        },
      })),
    [config.primaryColor],
  );

  const handleCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    });
  }, []);

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = SW;
    canvas.height = SH;

    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const M = 30;

    /* Background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, SW, SH);

    const scaleFactor = Math.min(SW, SH) / 500;
    const headlineSize = Math.max(28, Math.round(viewDist.minFont * scaleFactor * 0.6));
    const subSize = Math.max(16, Math.round(headlineSize * 0.5));
    const bodySize = Math.max(12, Math.round(headlineSize * 0.35));

    if (config.template === "retail") {
      /* Full primary background */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, SW, SH);
      /* Diagonal accent */
      ctx.fillStyle = "#ffffff15";
      ctx.beginPath();
      ctx.moveTo(0, SH * 0.6);
      ctx.lineTo(SW, SH * 0.3);
      ctx.lineTo(SW, SH);
      ctx.lineTo(0, SH);
      ctx.closePath();
      ctx.fill();
    } else if (config.template === "event") {
      const grad = ctx.createLinearGradient(0, 0, 0, SH);
      grad.addColorStop(0, pc);
      grad.addColorStop(0.6, "#111827");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, SW, SH);
      /* Spotlight circles */
      ctx.fillStyle = "#ffffff08";
      ctx.beginPath();
      ctx.arc(SW / 2, SH * 0.2, SW * 0.3, 0, Math.PI * 2);
      ctx.fill();
    } else if (config.template === "directional") {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(0, 0, SW, SH);
      /* Arrow accent */
      ctx.fillStyle = pc;
      const arrowH = SH * 0.15;
      ctx.fillRect(0, SH - arrowH - 40, SW, arrowH);
      /* Arrow head */
      ctx.beginPath();
      ctx.moveTo(SW - 60, SH - arrowH - 40 - 20);
      ctx.lineTo(SW, SH - arrowH / 2 - 40);
      ctx.lineTo(SW - 60, SH - 40 + 20);
      ctx.closePath();
      ctx.fill();
    } else if (config.template === "promotional") {
      ctx.fillStyle = "#fef3c7";
      ctx.fillRect(0, 0, SW, SH);
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, SW, SH * 0.08);
      ctx.fillRect(0, SH * 0.92, SW, SH * 0.08);
      /* Starburst */
      ctx.fillStyle = pc + "15";
      for (let i = 0; i < 12; i++) {
        ctx.save();
        ctx.translate(SW * 0.8, SH * 0.3);
        ctx.rotate((i * Math.PI * 2) / 12);
        ctx.fillRect(-5, -80, 10, 160);
        ctx.restore();
      }
    } else if (config.template === "real-estate") {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, SW, SH);
      /* Gold accent bar */
      ctx.fillStyle = "#b8860b";
      ctx.fillRect(M, SH * 0.12, SW - M * 2, 4);
      ctx.fillRect(M, SH * 0.88, SW - M * 2, 4);
    } else if (config.template === "construction") {
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(0, 0, SW, SH);
      /* Hazard stripes */
      ctx.fillStyle = "#000000";
      const stripeH = 30;
      for (let i = 0; i < SW + SH; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + stripeH, 0);
        ctx.lineTo(0, i + stripeH);
        ctx.lineTo(0, i);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(M, M + 10, SW - M * 2, SH - M * 2 - 20);
    }

    /* Safe zone indicator */
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "#ef444440";
    ctx.lineWidth = 1;
    ctx.strokeRect(M, M, SW - M * 2, SH - M * 2);
    ctx.restore();

    /* Text rendering */
    const isDark = ["retail", "event", "directional", "real-estate"].includes(config.template);
    const isConstruction = config.template === "construction";
    const textColor = isConstruction ? "#1e293b" : isDark ? "#ffffff" : "#1e293b";
    const subColor = isConstruction ? "#475569" : isDark ? "#ffffffcc" : "#64748b";

    const cx = SW / 2;
    let y = SH * 0.25;

    /* Business name */
    ctx.fillStyle = subColor;
    ctx.font = `600 ${bodySize + 2}px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(config.businessName, cx, y);
    y += headlineSize + 10;

    /* Headline */
    ctx.fillStyle = textColor;
    ctx.font = `900 ${headlineSize}px ${font}`;
    ctx.fillText(config.headline, cx, y, SW - M * 2);
    y += subSize + 10;

    /* Subheadline */
    ctx.fillStyle = subColor;
    ctx.font = `600 ${subSize}px ${font}`;
    ctx.fillText(config.subheadline, cx, y, SW - M * 2);
    y += bodySize + 20;

    /* Body text */
    ctx.fillStyle = subColor;
    ctx.font = `${bodySize}px ${font}`;
    const words = config.bodyText.split(" ");
    let line = "";
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > SW - M * 4 && line) {
        ctx.fillText(line.trim(), cx, y);
        line = word + " ";
        y += bodySize + 6;
      } else {
        line = test;
      }
    }
    if (line) { ctx.fillText(line.trim(), cx, y); y += bodySize + 20; }

    /* CTA button */
    if (config.ctaText) {
      const ctaW = ctx.measureText(config.ctaText).width + 60;
      const ctaH = subSize + 20;
      const ctaX = cx - ctaW / 2;
      const ctaY = y;
      ctx.fillStyle = isConstruction ? pc : isDark ? "#ffffff" : pc;
      ctx.beginPath();
      ctx.roundRect(ctaX, ctaY, ctaW, ctaH, 8);
      ctx.fill();
      ctx.fillStyle = isConstruction ? "#ffffff" : isDark ? pc : "#ffffff";
      ctx.font = `bold ${subSize - 2}px ${font}`;
      ctx.fillText(config.ctaText, cx, ctaY + ctaH / 2 + (subSize - 2) / 3);
      y += ctaH + 20;
    }

    /* Contact info at bottom */
    const bottomY = SH - M - 10;
    ctx.fillStyle = subColor;
    ctx.font = `${Math.max(10, bodySize - 2)}px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(`${config.phone}  •  ${config.website}`, cx, bottomY);
    ctx.fillText(config.address, cx, bottomY + bodySize);

    /* Mounting safe zone label */
    ctx.fillStyle = "#ef444480";
    ctx.font = `9px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("SAFE ZONE", M + 4, M + 12);

    /* Viewing distance label */
    ctx.fillStyle = "#94a3b8";
    ctx.font = `9px ${font}`;
    ctx.textAlign = "right";
    ctx.fillText(`👁 ${viewDist.label}`, SW - M - 4, M + 12);
  }, [config, SW, SH, viewDist, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
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
            content: `Generate signage/banner content for: ${config.description}. Business: ${config.businessName}. Template: ${config.template}. Based in Lusaka, Zambia. Return JSON: { "headline": "", "subheadline": "", "bodyText": "", "ctaText": "", "phone": "+260...", "address": "..., Lusaka" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({
          ...p,
          headline: data.headline || p.headline,
          subheadline: data.subheadline || p.subheadline,
          bodyText: data.bodyText || p.bodyText,
          ctaText: data.ctaText || p.ctaText,
          phone: data.phone || p.phone,
          address: data.address || p.address,
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `signage-${config.template}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Panels ─────────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* AI Content Generator */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the signage purpose (e.g. 'Grand opening banner for a Lusaka restaurant')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Content"}
        </button>
      </div>

      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as SignageTemplate }))}
        label="Template"
      />

      {/* Size Preset */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconMaximize className="size-4 text-primary-500" />Size Preset</h3>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.sizePreset} onChange={(e) => setConfig((p) => ({ ...p, sizePreset: e.target.value }))}>
          {SIZE_PRESETS.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.desc})</option>)}
        </select>
      </div>

      {/* Viewing Distance */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <label className="block text-xs font-semibold text-gray-900 dark:text-white">Viewing Distance</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.viewingDistance} onChange={(e) => setConfig((p) => ({ ...p, viewingDistance: e.target.value }))}>
          {VIEWING_DISTANCES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
        </select>
      </div>

      {/* Primary Color */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <label className="block text-xs font-semibold text-gray-900 dark:text-white">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 transition-transform ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
        <input type="color" value={config.primaryColor} onChange={(e) => setConfig((p) => ({ ...p, primaryColor: e.target.value }))} className="w-full h-8 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer" />
      </div>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>

        <label className="block text-xs text-gray-400">Business Name</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessName} onChange={(e) => setConfig((p) => ({ ...p, businessName: e.target.value }))} />

        <label className="block text-xs text-gray-400">Headline</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.headline} onChange={(e) => setConfig((p) => ({ ...p, headline: e.target.value }))} />

        <label className="block text-xs text-gray-400">Subheadline</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subheadline} onChange={(e) => setConfig((p) => ({ ...p, subheadline: e.target.value }))} />

        <label className="block text-xs text-gray-400">Body Text</label>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.bodyText} onChange={(e) => setConfig((p) => ({ ...p, bodyText: e.target.value }))} />

        <label className="block text-xs text-gray-400">CTA Button Text</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.ctaText} onChange={(e) => setConfig((p) => ({ ...p, ctaText: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Phone</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.phone} onChange={(e) => setConfig((p) => ({ ...p, phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Website</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.website} onChange={(e) => setConfig((p) => ({ ...p, website: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Address</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.address} onChange={(e) => setConfig((p) => ({ ...p, address: e.target.value }))} />
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />
    </div>
  );

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`${sizePreset.name} — ${sizePreset.desc} — ${SW}×${SH}px`}
      toolbar={
        <span className="text-xs text-gray-400">
          {sizePreset.name} · {SW}×{SH}
        </span>
      }
      mobileTabs={["Canvas", "Design", "Content"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.15, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.15, 0.15))}
      onZoomFit={() => setZoom(0.55)}
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
