"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconMail } from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

type EnvelopeSize = "dl" | "c5" | "c4" | "10" | "custom";
type EnvelopeTemplate = "minimal" | "corporate" | "elegant" | "modern" | "bold" | "creative";
type ViewSide = "front" | "back";

interface EnvelopeConfig {
  size: EnvelopeSize;
  template: EnvelopeTemplate;
  primaryColor: string;
  viewSide: ViewSide;
  companyName: string;
  returnAddress: string;
  recipientName: string;
  recipientAddress: string;
  showWindow: boolean;
  description: string;
}

const SIZES: { id: EnvelopeSize; name: string; w: number; h: number }[] = [
  { id: "dl", name: "DL (220×110mm)", w: 624, h: 312 },
  { id: "c5", name: "C5 (229×162mm)", w: 649, h: 459 },
  { id: "c4", name: "C4 (324×229mm)", w: 919, h: 649 },
  { id: "10", name: "#10 (241×105mm)", w: 683, h: 298 },
  { id: "custom", name: "Custom", w: 700, h: 350 },
];

const TEMPLATES: { id: EnvelopeTemplate; name: string }[] = [
  { id: "minimal", name: "Minimal" }, { id: "corporate", name: "Corporate" },
  { id: "elegant", name: "Elegant" }, { id: "modern", name: "Modern" },
  { id: "bold", name: "Bold" }, { id: "creative", name: "Creative" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

export default function EnvelopeDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");
  const [config, setConfig] = useState<EnvelopeConfig>({
    size: "dl", template: "corporate", primaryColor: "#1e40af", viewSide: "front",
    companyName: "DMSuite Solutions", returnAddress: "Plot 1234, Cairo Road\nLusaka, Zambia",
    recipientName: "John Doe", recipientAddress: "123 Main Street\nKitwe, Zambia",
    showWindow: false, description: "",
  });

  const sz = SIZES.find((s) => s.id === config.size)!;

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = sz.w; canvas.height = sz.h;
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, sz.w, sz.h);

    if (config.viewSide === "front") {
      // Return address (top-left)
      if (config.template === "corporate" || config.template === "bold") {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, sz.w, 4);
        ctx.fillRect(0, sz.h - 4, sz.w, 4);
      }
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(config.companyName, 30, 35);
      ctx.fillStyle = "#64748b";
      ctx.font = "9px Inter, sans-serif";
      config.returnAddress.split("\n").forEach((line, i) => ctx.fillText(line, 30, 50 + i * 14));

      // Stamp zone
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(sz.w - 70, 20, 50, 40);
      ctx.setLineDash([]);
      ctx.font = "7px Inter, sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.textAlign = "center";
      ctx.fillText("STAMP", sz.w - 45, 45);

      // Recipient (center-right)
      if (config.showWindow) {
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 0.5;
        ctx.strokeRect(sz.w * 0.45, sz.h * 0.4, sz.w * 0.4, sz.h * 0.35);
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(sz.w * 0.45 + 1, sz.h * 0.4 + 1, sz.w * 0.4 - 2, sz.h * 0.35 - 2);
      }
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "left";
      ctx.fillText(config.recipientName, sz.w * 0.48, sz.h * 0.55);
      ctx.font = "10px Inter, sans-serif";
      ctx.fillStyle = "#475569";
      config.recipientAddress.split("\n").forEach((line, i) => ctx.fillText(line, sz.w * 0.48, sz.h * 0.55 + 18 + i * 14));

      if (config.template === "elegant") {
        ctx.strokeStyle = config.primaryColor + "40";
        ctx.lineWidth = 1;
        ctx.strokeRect(15, 15, sz.w - 30, sz.h - 30);
      }
    } else {
      // Back
      ctx.fillStyle = config.primaryColor + "08";
      ctx.fillRect(0, 0, sz.w, sz.h);
      ctx.fillStyle = config.primaryColor;
      ctx.beginPath();
      ctx.moveTo(sz.w / 2, 0);
      ctx.lineTo(sz.w, sz.h * 0.4);
      ctx.lineTo(0, sz.h * 0.4);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 0.08;
      ctx.font = "bold 60px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.companyName, sz.w / 2, sz.h * 0.75);
      ctx.globalAlpha = 1;
    }
  }, [config, sz]);

  useEffect(() => { render(); }, [render]);

  const generateAI = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate envelope design content for: ${config.description}. Zambian business. Return JSON: { "companyName": "", "returnAddress": "line1\\nline2", "recipientName": "", "recipientAddress": "line1\\nline2" }` }] }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) { const d = JSON.parse(match[0]); setConfig((p) => ({ ...p, ...d })); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const exportPNG = () => { const c = canvasRef.current; if (!c) return; const a = document.createElement("a"); a.download = `envelope-${config.template}.png`; a.href = c.toDataURL("image/png"); a.click(); };

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (<button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconMail className="size-4 text-primary-500" />Envelope Settings</h3>
            <label className="block text-xs text-gray-400">Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.size} onChange={(e) => setConfig((p) => ({ ...p, size: e.target.value as EnvelopeSize }))}>{SIZES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">{TEMPLATES.map((t) => (<button key={t.id} onClick={() => setConfig((p) => ({ ...p, template: t.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{t.name}</button>))}</div>
            <label className="block text-xs text-gray-400">View</label>
            <div className="flex gap-2">{(["front", "back"] as const).map((s) => (<button key={s} onClick={() => setConfig((p) => ({ ...p, viewSide: s }))} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize ${config.viewSide === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s}</button>))}</div>
            <label className="block text-xs text-gray-400">Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />
            <label className="block text-xs text-gray-400">Return Address</label>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.returnAddress} onChange={(e) => setConfig((p) => ({ ...p, returnAddress: e.target.value }))} />
            <label className="block text-xs text-gray-400">Recipient Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.recipientName} onChange={(e) => setConfig((p) => ({ ...p, recipientName: e.target.value }))} />
            <label className="block text-xs text-gray-400">Recipient Address</label>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.recipientAddress} onChange={(e) => setConfig((p) => ({ ...p, recipientAddress: e.target.value }))} />
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer"><input type="checkbox" checked={config.showWindow} onChange={(e) => setConfig((p) => ({ ...p, showWindow: e.target.checked }))} className="rounded" />Window envelope</label>
            <label className="block text-xs text-gray-400">Color</label>
            <div className="flex gap-1.5 flex-wrap">{COLOR_PRESETS.map((c) => (<button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Describe your business…" value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50">{loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}{loading ? "Generating…" : "Generate"}</button>
          </div>
          <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"><IconDownload className="size-4" />Export PNG</button>
        </div>
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(sz.w, 650), height: Math.min(sz.w, 650) * (sz.h / sz.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{config.viewSide} — {sz.w}×{sz.h}px</p>
        </div>
      </div>
    </div>
  );
}
