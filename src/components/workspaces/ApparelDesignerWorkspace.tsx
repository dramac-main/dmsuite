"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconShirt } from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

type GarmentType = "tshirt" | "hoodie" | "cap" | "totebag" | "mug";
type PrintZone = "front" | "back" | "left-sleeve" | "right-sleeve";
type ApparelTemplate = "typography" | "graphic" | "minimal" | "vintage" | "sporty" | "artistic";

interface ApparelConfig {
  garmentType: GarmentType;
  garmentColor: string;
  printZone: PrintZone;
  template: ApparelTemplate;
  designText: string;
  subText: string;
  primaryColor: string;
  description: string;
}

const GARMENTS: { id: GarmentType; name: string; w: number; h: number; printW: number; printH: number }[] = [
  { id: "tshirt", name: "T-Shirt", w: 500, h: 600, printW: 280, printH: 350 },
  { id: "hoodie", name: "Hoodie", w: 500, h: 620, printW: 260, printH: 320 },
  { id: "cap", name: "Cap", w: 500, h: 350, printW: 200, printH: 100 },
  { id: "totebag", name: "Tote Bag", w: 450, h: 550, printW: 300, printH: 350 },
  { id: "mug", name: "Mug", w: 600, h: 400, printW: 400, printH: 250 },
];

const GARMENT_COLORS = ["#ffffff", "#000000", "#1e3a5f", "#dc2626", "#6b7280", "#fbbf24", "#16a34a", "#7c3aed", "#f97316", "#ec4899", "#0ea5e9", "#a3e635"];
const TEMPLATES: { id: ApparelTemplate; name: string }[] = [
  { id: "typography", name: "Typography" }, { id: "graphic", name: "Graphic" },
  { id: "minimal", name: "Minimal" }, { id: "vintage", name: "Vintage" },
  { id: "sporty", name: "Sporty" }, { id: "artistic", name: "Artistic" },
];

function getContrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? "#1e293b" : "#ffffff";
}

export default function ApparelDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");
  const [config, setConfig] = useState<ApparelConfig>({
    garmentType: "tshirt", garmentColor: "#ffffff", printZone: "front",
    template: "typography", designText: "DMSuite", subText: "Design Excellence",
    primaryColor: "#1e40af", description: "",
  });

  const garment = GARMENTS.find((g) => g.id === config.garmentType)!;
  const textColor = getContrastColor(config.garmentColor);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = garment.w; canvas.height = garment.h;

    // Garment body
    ctx.fillStyle = config.garmentColor;
    if (config.garmentType === "tshirt") {
      ctx.beginPath();
      ctx.moveTo(150, 0); ctx.lineTo(100, 60); ctx.lineTo(40, 80); ctx.lineTo(40, 160);
      ctx.lineTo(100, 140); ctx.lineTo(100, garment.h); ctx.lineTo(400, garment.h);
      ctx.lineTo(400, 140); ctx.lineTo(460, 160); ctx.lineTo(460, 80);
      ctx.lineTo(400, 60); ctx.lineTo(350, 0);
      ctx.quadraticCurveTo(250, 40, 150, 0);
      ctx.fill();
      ctx.strokeStyle = textColor + "20"; ctx.lineWidth = 2; ctx.stroke();
    } else if (config.garmentType === "mug") {
      ctx.beginPath();
      ctx.ellipse(250, garment.h / 2, 180, garment.h * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = textColor + "30"; ctx.lineWidth = 2; ctx.stroke();
      // Handle
      ctx.beginPath();
      ctx.ellipse(440, garment.h / 2, 40, 60, 0, -0.8, 0.8);
      ctx.strokeStyle = config.garmentColor; ctx.lineWidth = 12; ctx.stroke();
      ctx.strokeStyle = textColor + "30"; ctx.lineWidth = 2; ctx.stroke();
    } else {
      // Generic rounded rectangle for other garments
      const rx = (garment.w - garment.printW) / 2 - 30;
      const ry = 20;
      ctx.beginPath();
      ctx.roundRect(rx, ry, garment.printW + 60, garment.h - 40, 20);
      ctx.fill();
      ctx.strokeStyle = textColor + "20"; ctx.lineWidth = 2; ctx.stroke();
    }

    // Print zone (dashed outline)
    const px = (garment.w - garment.printW) / 2;
    const py = (garment.h - garment.printH) / 2;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = textColor + "30";
    ctx.lineWidth = 1;
    ctx.strokeRect(px, py, garment.printW, garment.printH);
    ctx.setLineDash([]);

    // Design content
    const cx = garment.w / 2;
    const cy = garment.h / 2;

    if (config.template === "typography") {
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold 42px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, cx, cy - 10, garment.printW - 20);
      if (config.subText) {
        ctx.font = "16px Inter, sans-serif";
        ctx.fillStyle = textColor + "90";
        ctx.fillText(config.subText, cx, cy + 25, garment.printW - 20);
      }
    } else if (config.template === "graphic") {
      ctx.fillStyle = config.primaryColor + "20";
      ctx.beginPath(); ctx.arc(cx, cy - 20, 60, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold 28px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, cx, cy + 60, garment.printW - 20);
    } else if (config.template === "minimal") {
      ctx.fillStyle = textColor;
      ctx.font = "300 24px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, cx, cy, garment.printW - 20);
    } else if (config.template === "vintage") {
      ctx.strokeStyle = config.primaryColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 20, py + 20, garment.printW - 40, garment.printH - 40);
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold 30px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, cx, cy - 10, garment.printW - 60);
      ctx.font = "italic 14px Georgia, serif";
      ctx.fillText(config.subText, cx, cy + 20, garment.printW - 60);
    } else if (config.template === "sporty") {
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold italic 48px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, cx, cy, garment.printW - 20);
      ctx.fillStyle = config.primaryColor + "30";
      ctx.fillRect(px, cy + 15, garment.printW, 4);
    } else {
      // artistic
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-0.1);
      ctx.fillStyle = config.primaryColor;
      ctx.font = "bold 36px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.designText, 0, 0, garment.printW - 20);
      ctx.restore();
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = config.primaryColor + "15";
        ctx.beginPath();
        ctx.arc(px + Math.random() * garment.printW, py + Math.random() * garment.printH, 10 + Math.random() * 20, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, [config, garment, textColor]);

  useEffect(() => { render(); }, [render]);

  const generateAI = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate t-shirt/apparel design text for: ${config.description}. Return JSON: { "designText": "", "subText": "" }. Keep text SHORT and impactful for printing on ${config.garmentType}.` }] }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) { const d = JSON.parse(match[0]); setConfig((p) => ({ ...p, ...d })); }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const exportPNG = () => { const c = canvasRef.current; if (!c) return; const a = document.createElement("a"); a.download = `apparel-${config.garmentType}.png`; a.href = c.toDataURL("image/png"); a.click(); };

  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (<button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>))}
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconShirt className="size-4 text-primary-500" />Apparel Settings</h3>
            <label className="block text-xs text-gray-400">Garment</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.garmentType} onChange={(e) => setConfig((p) => ({ ...p, garmentType: e.target.value as GarmentType }))}>{GARMENTS.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
            <label className="block text-xs text-gray-400">Garment Color</label>
            <div className="flex gap-1.5 flex-wrap">{GARMENT_COLORS.map((c) => (<button key={c} onClick={() => setConfig((p) => ({ ...p, garmentColor: c }))} className={`size-7 rounded-full border-2 ${config.garmentColor === c ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} />))}</div>
            <label className="block text-xs text-gray-400">Print Zone</label>
            <div className="grid grid-cols-2 gap-1.5">{(["front", "back", "left-sleeve", "right-sleeve"] as const).map((z) => (<button key={z} onClick={() => setConfig((p) => ({ ...p, printZone: z }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium capitalize ${config.printZone === z ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{z.replace("-", " ")}</button>))}</div>
            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">{TEMPLATES.map((t) => (<button key={t.id} onClick={() => setConfig((p) => ({ ...p, template: t.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300"}`}>{t.name}</button>))}</div>
            <label className="block text-xs text-gray-400">Design Text</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.designText} onChange={(e) => setConfig((p) => ({ ...p, designText: e.target.value }))} />
            <label className="block text-xs text-gray-400">Sub Text</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subText} onChange={(e) => setConfig((p) => ({ ...p, subText: e.target.value }))} />
            <label className="block text-xs text-gray-400">Design Color</label>
            <div className="flex gap-1.5 flex-wrap">{["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#000000", "#ffffff", "#f59e0b"].map((c) => (<button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-primary-500 scale-110" : "border-gray-300 dark:border-gray-600"}`} style={{ backgroundColor: c }} />))}</div>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} placeholder="Describe the design concept…" value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50">{loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}{loading ? "Generating…" : "Generate Design"}</button>
          </div>
          <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"><IconDownload className="size-4" />Export PNG</button>
        </div>
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(garment.w, 500), height: Math.min(garment.w, 500) * (garment.h / garment.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{garment.name} — {config.printZone} — {garment.printW}×{garment.printH}px print area</p>
        </div>
      </div>
    </div>
  );
}
