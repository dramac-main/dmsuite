"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload, IconFileText,
} from "@/components/icons";
import { cleanAIText, roundRect } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type FoldType = "bi-fold" | "tri-fold" | "z-fold" | "gate-fold" | "accordion";
type PageSize = "a4" | "a3" | "letter" | "legal";
type BrochureTemplate = "corporate" | "tourism" | "education" | "realestate" | "health" | "tech";
type ViewSide = "outside" | "inside";

interface PanelContent {
  heading: string;
  body: string;
  subtext: string;
}

interface BrochureConfig {
  foldType: FoldType;
  pageSize: PageSize;
  template: BrochureTemplate;
  primaryColor: string;
  viewSide: ViewSide;
  businessName: string;
  businessDescription: string;
  panels: PanelContent[];
}

const FOLD_TYPES: { id: FoldType; name: string; panels: number }[] = [
  { id: "bi-fold", name: "Bi-Fold", panels: 4 },
  { id: "tri-fold", name: "Tri-Fold", panels: 6 },
  { id: "z-fold", name: "Z-Fold", panels: 6 },
  { id: "gate-fold", name: "Gate-Fold", panels: 4 },
  { id: "accordion", name: "Accordion", panels: 8 },
];

const PAGE_SIZES: { id: PageSize; name: string; w: number; h: number }[] = [
  { id: "a4", name: "A4", w: 842, h: 595 },
  { id: "a3", name: "A3", w: 1190, h: 842 },
  { id: "letter", name: "Letter", w: 792, h: 612 },
  { id: "legal", name: "Legal", w: 1008, h: 612 },
];

const TEMPLATES: { id: BrochureTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "tourism", name: "Tourism" },
  { id: "education", name: "Education" },
  { id: "realestate", name: "Real Estate" },
  { id: "health", name: "Health" },
  { id: "tech", name: "Tech" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

function defaultPanels(count: number): PanelContent[] {
  const labels = ["Cover", "About Us", "Services", "Features", "Testimonials", "Contact", "Call to Action", "Back Cover"];
  return Array.from({ length: count }, (_, i) => ({
    heading: labels[i] || `Panel ${i + 1}`,
    body: "",
    subtext: "",
  }));
}

/* ── Component ─────────────────────────────────────────────── */

export default function BrochureDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<BrochureConfig>({
    foldType: "tri-fold",
    pageSize: "a4",
    template: "corporate",
    primaryColor: "#1e40af",
    viewSide: "outside",
    businessName: "DMSuite Solutions",
    businessDescription: "",
    panels: defaultPanels(6),
  });

  const fold = FOLD_TYPES.find((f) => f.id === config.foldType)!;
  const ps = PAGE_SIZES.find((p) => p.id === config.pageSize)!;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = ps.w;
    canvas.height = ps.h;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, ps.w, ps.h);

    const panelCount = config.viewSide === "outside"
      ? Math.ceil(fold.panels / 2)
      : Math.floor(fold.panels / 2);
    const panelW = ps.w / panelCount;
    const bleed = 8;

    // Draw panels
    for (let i = 0; i < panelCount; i++) {
      const panelIdx = config.viewSide === "outside" ? i : i + Math.ceil(fold.panels / 2);
      const panel = config.panels[panelIdx] || { heading: "", body: "", subtext: "" };
      const x = i * panelW;

      // Panel bg
      if (i === 0 && config.viewSide === "outside") {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(x, 0, panelW, ps.h);
        ctx.fillStyle = "#ffffff";
      } else {
        const shade = i % 2 === 0 ? "#f8fafc" : "#ffffff";
        ctx.fillStyle = shade;
        ctx.fillRect(x, 0, panelW, ps.h);
        ctx.fillStyle = "#1e293b";
      }

      // Fold line
      if (i > 0) {
        ctx.save();
        ctx.setLineDash([6, 4]);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, ps.h);
        ctx.stroke();
        ctx.restore();
      }

      // Content
      const cx = x + panelW / 2;
      const textColor = (i === 0 && config.viewSide === "outside") ? "#ffffff" : "#1e293b";

      ctx.fillStyle = textColor;
      ctx.font = "bold 18px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(panel.heading, cx, 80, panelW - 40);

      if (panel.body) {
        ctx.font = "13px Inter, sans-serif";
        ctx.fillStyle = (i === 0 && config.viewSide === "outside") ? "rgba(255,255,255,0.85)" : "#64748b";
        const words = panel.body.split(" ");
        let line = "";
        let ly = 120;
        for (const word of words) {
          const test = line + word + " ";
          if (ctx.measureText(test).width > panelW - 50 && line) {
            ctx.fillText(line.trim(), cx, ly, panelW - 50);
            line = word + " ";
            ly += 18;
            if (ly > ps.h - 80) break;
          } else {
            line = test;
          }
        }
        if (line) ctx.fillText(line.trim(), cx, ly, panelW - 50);
      }

      // Decorative elements based on template
      if (config.template === "corporate") {
        ctx.fillStyle = config.primaryColor + "15";
        ctx.fillRect(x + 10, ps.h - 60, panelW - 20, 4);
      }
      if (config.template === "tech") {
        ctx.fillStyle = config.primaryColor + "20";
        ctx.beginPath();
        ctx.arc(x + panelW - 30, 30, 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Crop marks
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 0.5;
    const marks = [[0, 0], [ps.w, 0], [0, ps.h], [ps.w, ps.h]];
    for (const [mx, my] of marks) {
      ctx.beginPath();
      ctx.moveTo(mx - bleed, my < ps.h / 2 ? -bleed : ps.h + bleed);
      ctx.lineTo(mx - bleed, my < ps.h / 2 ? bleed * 2 : ps.h - bleed * 2);
      ctx.stroke();
    }

    // Bleed indicator
    ctx.setLineDash([2, 2]);
    ctx.strokeStyle = "#ef444440";
    ctx.strokeRect(bleed, bleed, ps.w - bleed * 2, ps.h - bleed * 2);
    ctx.setLineDash([]);
  }, [config, fold, ps]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.businessDescription.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate brochure content for a ${config.foldType} brochure (${fold.panels} panels). Business: ${config.businessDescription}. Company: ${config.businessName}. Based in Lusaka, Zambia. Return JSON: { "panels": [{ "heading": "", "body": "", "subtext": "" }] } — exactly ${fold.panels} panels. Panel 1 = cover. Last panel = back cover with contact info (use +260 phone format).`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.panels) {
          setConfig((p) => ({ ...p, panels: data.panels.slice(0, fold.panels) }));
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `brochure-${config.foldType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconFileText className="size-4 text-primary-500" />Brochure Settings</h3>

            <label className="block text-xs text-gray-400">Company Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessName} onChange={(e) => setConfig((p) => ({ ...p, businessName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Fold Type</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.foldType} onChange={(e) => { const ft = e.target.value as FoldType; const f = FOLD_TYPES.find((x) => x.id === ft)!; setConfig((p) => ({ ...p, foldType: ft, panels: defaultPanels(f.panels) })); }}>
              {FOLD_TYPES.map((f) => <option key={f.id} value={f.id}>{f.name} ({f.panels} panels)</option>)}
            </select>

            <label className="block text-xs text-gray-400">Page Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.pageSize} onChange={(e) => setConfig((p) => ({ ...p, pageSize: e.target.value as PageSize }))}>
              {PAGE_SIZES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setConfig((p) => ({ ...p, template: t.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.name}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">View Side</label>
            <div className="flex gap-2">
              {(["outside", "inside"] as const).map((s) => (
                <button key={s} onClick={() => setConfig((p) => ({ ...p, viewSide: s }))} className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold capitalize ${config.viewSide === s ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-500"}`}>{s}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Primary Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Panel Content Editor */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Panel Content</h3>
            {config.panels.map((panel, i) => (
              <div key={i} className="space-y-1">
                <label className="text-xs text-gray-400">Panel {i + 1}</label>
                <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Heading" value={panel.heading} onChange={(e) => { const p = [...config.panels]; p[i] = { ...p[i], heading: e.target.value }; setConfig((pr) => ({ ...pr, panels: p })); }} />
                <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white resize-none" rows={2} placeholder="Body text" value={panel.body} onChange={(e) => { const p = [...config.panels]; p[i] = { ...p[i], body: e.target.value }; setConfig((pr) => ({ ...pr, panels: p })); }} />
              </div>
            ))}
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe your business for AI brochure content..." value={config.businessDescription} onChange={(e) => setConfig((p) => ({ ...p, businessDescription: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Content"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(ps.w, 700), height: Math.min(ps.w, 700) * (ps.h / ps.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{FOLD_TYPES.find((f) => f.id === config.foldType)?.name} — {config.viewSide} view — {ps.w}×{ps.h}px</p>
        </div>
      </div>
    </div>
  );
}
