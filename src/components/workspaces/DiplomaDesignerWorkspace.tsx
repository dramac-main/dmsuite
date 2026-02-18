"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconAward, IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconType, IconFileText } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawCertificateThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type DiplomaTemplate = "classic" | "elegant" | "modern" | "university" | "ornate" | "executive";
type DiplomaOrientation = "landscape" | "portrait";

interface DiplomaConfig {
  template: DiplomaTemplate;
  orientation: DiplomaOrientation;
  primaryColor: string;
  goldAccent: string;
  institutionName: string;
  institutionSubtitle: string;
  recipientName: string;
  programName: string;
  dateConferred: string;
  registrationNumber: string;
  signerName1: string;
  signerTitle1: string;
  signerName2: string;
  signerTitle2: string;
  sealText: string;
  description: string;
}

const TEMPLATES: { id: DiplomaTemplate; name: string }[] = [
  { id: "classic", name: "Classic" }, { id: "elegant", name: "Elegant" },
  { id: "modern", name: "Modern" }, { id: "university", name: "University" },
  { id: "ornate", name: "Ornate" }, { id: "executive", name: "Executive" },
];

const GOLD_PRESETS = ["#b8860b", "#d4a843", "#c5a355", "#a0785a", "#8b7355", "#cd853f"];
const COLOR_PRESETS = ["#1e3a5f", "#2d3436", "#1a1a2e", "#3c1361", "#0d7377", "#6c5ce7", "#0f4c75", "#8ae600", "#06b6d4"];

/* ── Component ───────────────────────────────────────────── */

export default function DiplomaDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<DiplomaConfig>({
    template: "classic", orientation: "landscape",
    primaryColor: "#1e3a5f", goldAccent: "#b8860b",
    institutionName: "University of Zambia", institutionSubtitle: "School of Business & Management",
    recipientName: "John Mwansa Banda", programName: "Master of Business Administration",
    dateConferred: "15th December 2025", registrationNumber: "UNZA/MBA/2025/0847",
    signerName1: "Prof. Luke Mumba", signerTitle1: "Vice-Chancellor",
    signerName2: "Dr. Grace Phiri", signerTitle2: "Dean, School of Business",
    sealText: "OFFICIAL SEAL", description: "",
  });

  const updateConfig = useCallback((p: Partial<DiplomaConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = config.orientation === "landscape" ? 842 : 595;
  const PAGE_H = config.orientation === "landscape" ? 595 : 842;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, goldAccent, template } = config;
    const pal = generateColorPalette(primaryColor);
    const m = config.orientation === "landscape" ? 50 : 40;

    // Parchment background
    const bgColors: Record<string, string> = {
      classic: "#faf6ef", elegant: "#fdfcf8", modern: "#ffffff",
      university: "#f9f5eb", ornate: "#faf3e3", executive: "#f8f8f8",
    };
    ctx.fillStyle = bgColors[template] || "#faf6ef";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Decorative border
    const borderW = template === "ornate" ? 8 : template === "modern" ? 2 : 4;
    ctx.strokeStyle = goldAccent;
    ctx.lineWidth = borderW;
    roundRect(ctx, m - 15, m - 15, PAGE_W - 2 * (m - 15), PAGE_H - 2 * (m - 15), template === "modern" ? 0 : 4);
    ctx.stroke();

    if (template === "ornate" || template === "classic") {
      // Inner border
      ctx.lineWidth = 1;
      ctx.strokeStyle = hexToRgba(goldAccent, 0.5);
      roundRect(ctx, m - 8, m - 8, PAGE_W - 2 * (m - 8), PAGE_H - 2 * (m - 8), 2);
      ctx.stroke();
    }

    // Corner decorations (ornate)
    if (template === "ornate" || template === "university") {
      const corners = [[m - 10, m - 10], [PAGE_W - m + 10, m - 10], [m - 10, PAGE_H - m + 10], [PAGE_W - m + 10, PAGE_H - m + 10]];
      ctx.fillStyle = goldAccent;
      corners.forEach(([cx, cy]) => {
        ctx.save();
        ctx.translate(cx, cy);
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(12, -4);
          ctx.lineTo(8, -12);
          ctx.lineTo(0, -8);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
      });
    }

    // Top accent line
    if (template !== "modern") {
      drawProDivider(ctx, PAGE_W * 0.2, m + 15, PAGE_W * 0.6, goldAccent, "ornate", 1);
    }

    // Institution name
    const titleY = m + (config.orientation === "landscape" ? 40 : 55);
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(800, config.orientation === "landscape" ? 20 : 22, template === "modern" ? "modern" : "classic");
    ctx.textAlign = "center";
    ctx.fillText(config.institutionName.toUpperCase(), PAGE_W / 2, titleY);

    // Subtitle
    ctx.fillStyle = hexToRgba(primaryColor, 0.6);
    ctx.font = getCanvasFont(500, 10, template === "modern" ? "modern" : "classic");
    ctx.fillText(config.institutionSubtitle, PAGE_W / 2, titleY + 22);

    // Divider
    drawProDivider(ctx, PAGE_W * 0.3, titleY + 38, PAGE_W * 0.4, goldAccent, "ornate", 1);

    // "This is to certify that"
    const certifyY = titleY + 65;
    ctx.fillStyle = hexToRgba(primaryColor, 0.5);
    ctx.font = getCanvasFont(400, 11, "classic");
    ctx.textAlign = "center";
    ctx.fillText("This is to certify that", PAGE_W / 2, certifyY);

    // Recipient name (large, prominent)
    const nameY = certifyY + 35;
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(400, config.orientation === "landscape" ? 30 : 28, "elegant");
    ctx.fillText(config.recipientName, PAGE_W / 2, nameY);

    // Underline for name
    const nameW = ctx.measureText(config.recipientName).width;
    drawProDivider(ctx, PAGE_W / 2 - nameW / 2, nameY + 8, nameW, goldAccent, "gradient", 1);

    // "has successfully completed"
    ctx.fillStyle = hexToRgba(primaryColor, 0.5);
    ctx.font = getCanvasFont(400, 11, "classic");
    ctx.fillText("has successfully completed the requirements for the degree of", PAGE_W / 2, nameY + 35);

    // Program name
    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, config.orientation === "landscape" ? 18 : 16, "classic");
    ctx.fillText(config.programName, PAGE_W / 2, nameY + 60);

    // Date
    ctx.fillStyle = hexToRgba(primaryColor, 0.5);
    ctx.font = getCanvasFont(400, 10, "classic");
    ctx.fillText(`Conferred on ${config.dateConferred}`, PAGE_W / 2, nameY + 85);

    if (config.registrationNumber) {
      ctx.fillText(`Registration: ${config.registrationNumber}`, PAGE_W / 2, nameY + 100);
    }

    // Seal
    const sealY = config.orientation === "landscape" ? PAGE_H - m - 90 : PAGE_H - m - 120;
    const sealX = PAGE_W / 2;
    const sealR = 30;

    // Outer ring
    ctx.strokeStyle = goldAccent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
    ctx.stroke();

    // Seal text
    ctx.fillStyle = goldAccent;
    ctx.font = getCanvasFont(700, 7, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(config.sealText, sealX, sealY);

    // Signature lines
    const sigY = config.orientation === "landscape" ? PAGE_H - m - 30 : PAGE_H - m - 50;
    const sig1X = PAGE_W * 0.25;
    const sig2X = PAGE_W * 0.75;

    ctx.strokeStyle = hexToRgba(primaryColor, 0.3);
    ctx.lineWidth = 0.5;
    [-1, 1].forEach((side) => {
      const sx = side === -1 ? sig1X : sig2X;
      const name = side === -1 ? config.signerName1 : config.signerName2;
      const title = side === -1 ? config.signerTitle1 : config.signerTitle2;

      ctx.beginPath();
      ctx.moveTo(sx - 70, sigY);
      ctx.lineTo(sx + 70, sigY);
      ctx.stroke();

      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(600, 10, "modern");
      ctx.textAlign = "center";
      ctx.fillText(name, sx, sigY + 14);

      ctx.fillStyle = hexToRgba(primaryColor, 0.5);
      ctx.font = getCanvasFont(400, 8, "modern");
      ctx.fillText(title, sx, sigY + 26);
    });

    // Bottom accent
    if (template !== "modern") {
      drawProDivider(ctx, PAGE_W * 0.2, PAGE_H - m + 5, PAGE_W * 0.6, goldAccent, "ornate", 1);
    }
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate diploma/certificate content for: "${config.description}". Return JSON: { "institutionName": "", "institutionSubtitle": "", "recipientName": "", "programName": "", "dateConferred": "", "signerName1": "", "signerTitle1": "", "signerName2": "", "signerTitle2": "" }` }] }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        updateConfig({ ...data });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, advancedSettings]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "diploma");
  }, []);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawCertificateThumbnail(ctx, w, h, { primaryColor: config.primaryColor, borderStyle: t.id === "ornate" ? "ornate" : t.id === "modern" ? "modern" : "gold", showSeal: true });
    },
  }));

  const displayW = config.orientation === "landscape" ? 420 : 340;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the diploma… e.g., 'MBA degree from University of Zambia for John Banda'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="institution" icon={<IconAward className="size-3.5" />} label="Institution">
        <div className="space-y-2">
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Name</label>
            <input type="text" value={config.institutionName} onChange={(e) => updateConfig({ institutionName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Subtitle / School</label>
            <input type="text" value={config.institutionSubtitle} onChange={(e) => updateConfig({ institutionSubtitle: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
        </div>
      </AccordionSection>

      <AccordionSection id="recipient" icon={<IconType className="size-3.5" />} label="Recipient & Program">
        <div className="space-y-2">
          {(["recipientName", "programName", "dateConferred", "registrationNumber"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="signers" icon={<IconFileText className="size-3.5" />} label="Signatories">
        <div className="space-y-2">
          {(["signerName1", "signerTitle1", "signerName2", "signerTitle2"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1").replace(/\d/g, "")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Orientation</label>
            <div className="flex gap-1.5 mt-1">
              {(["landscape", "portrait"] as const).map((o) => (
                <button key={o} onClick={() => updateConfig({ orientation: o })}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.orientation === o ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{o.charAt(0).toUpperCase() + o.slice(1)}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Gold Accent</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {GOLD_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ goldAccent: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.goldAccent === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[{ id: "web-standard", label: "Web PNG (2×)" }, { id: "print-standard", label: "Print 300 DPI" }, { id: "print-ultra", label: "Ultra 600 DPI" }].map((p) => (
            <button key={p.id} onClick={() => handleExport(p.id)}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">{p.label}</button>
          ))}
        </div>
      </AccordionSection>
          {/* Advanced Settings — Global */}
        <AdvancedSettingsPanel />

      </Accordion>
  );

  return (
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={displayW} displayHeight={displayH}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as DiplomaTemplate })} thumbWidth={config.orientation === "landscape" ? 160 : 120} thumbHeight={config.orientation === "landscape" ? 110 : 170} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Diploma — ${config.orientation === "landscape" ? "Landscape" : "Portrait"} (${PAGE_W}×${PAGE_H})`} />
  );
}
