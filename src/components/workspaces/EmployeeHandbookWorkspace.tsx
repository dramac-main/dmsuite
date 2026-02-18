"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconType, IconUsers, IconLayout, IconImage } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type HBTemplate = "professional" | "modern" | "corporate" | "creative" | "minimal" | "warm";

interface Chapter {
  title: string;
  content: string;
}

interface HBConfig {
  template: HBTemplate;
  primaryColor: string;
  companyName: string;
  subtitle: string;
  version: string;
  effectiveDate: string;
  coverImageUrl: string;
  chapters: Chapter[];
  currentPage: number;
  description: string;
}

const TEMPLATES: { id: HBTemplate; name: string }[] = [
  { id: "professional", name: "Professional" }, { id: "modern", name: "Modern" },
  { id: "corporate", name: "Corporate" }, { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" }, { id: "warm", name: "Warm" },
];

const COLOR_PRESETS = ["#1e3a5f", "#2d3436", "#0f4c75", "#3c1361", "#0d7377", "#6c5ce7", "#e74c3c", "#8ae600", "#06b6d4"];

const defaultChapters: Chapter[] = [
  { title: "Welcome & Company Overview", content: "Welcome to the team! This handbook is designed to help you understand our company culture, policies, and procedures. We are committed to providing a safe, inclusive, and productive work environment for all employees." },
  { title: "Employment Policies", content: "All employees are expected to adhere to professional standards of conduct. Our employment policies cover working hours, attendance, dress code, and workplace behaviour. Full-time employees work 8 hours per day, Monday through Friday." },
  { title: "Compensation & Benefits", content: "We offer competitive salaries benchmarked against industry standards. Benefits include medical aid, pension contributions, annual leave (24 days), sick leave, and maternity/paternity leave as per Zambian labour law." },
  { title: "Code of Conduct", content: "Employees must maintain the highest ethical standards. This includes treating colleagues with respect, protecting company assets, maintaining confidentiality of business information, and avoiding conflicts of interest." },
  { title: "Health & Safety", content: "We prioritize workplace safety. All employees must familiarize themselves with emergency procedures, fire exits, first aid stations, and report any safety concerns to the Health & Safety Committee immediately." },
  { title: "Leave & Time Off", content: "Annual leave must be applied for at least 2 weeks in advance. Public holidays as gazetted by the Government of Zambia are observed. Compassionate leave of up to 5 days is available for bereavement." },
];

/* ── Component ───────────────────────────────────────────── */

export default function EmployeeHandbookWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<HBConfig>({
    template: "professional", primaryColor: "#1e3a5f",
    companyName: "Zambia Copper Mining Corp", subtitle: "Employee Handbook & Policy Guide",
    version: "Version 3.0", effectiveDate: "January 2026",
    coverImageUrl: "", chapters: defaultChapters, currentPage: 0, description: "",
  });

  const updateConfig = useCallback((p: Partial<HBConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;
  const totalPages = 1 + Math.ceil(config.chapters.length / 2); // cover + content pages

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template } = config;
    const pal = generateColorPalette(primaryColor);
    const m = 45;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    if (config.currentPage === 0) {
      // ─── COVER PAGE ───
      // Background accent
      if (template === "creative") {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, PAGE_W * 0.4, PAGE_H);
        ctx.fillStyle = hexToRgba(primaryColor, 0.05);
        ctx.fillRect(PAGE_W * 0.4, 0, PAGE_W * 0.6, PAGE_H);
      } else {
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, 0, PAGE_W, PAGE_H * 0.45);
      }

      // Cover image area
      if (template !== "creative") {
        const imgY = 40;
        const imgH = PAGE_H * 0.35;
        if (config.coverImageUrl) {
          drawImagePlaceholder(ctx, 0, imgY, PAGE_W, imgH, "Cover Image");
        }
        // Overlay gradient
        const grad = ctx.createLinearGradient(0, imgY + imgH - 60, 0, imgY + imgH);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, primaryColor);
        ctx.fillStyle = grad;
        ctx.fillRect(0, imgY + imgH - 60, PAGE_W, 60);
      }

      // Company name
      const titleY = template === "creative" ? PAGE_H * 0.35 : PAGE_H * 0.48;
      ctx.fillStyle = template === "creative" ? "#ffffff" : primaryColor;
      ctx.font = getCanvasFont(800, 28, "modern");
      ctx.textAlign = template === "creative" ? "left" : "center";
      const tX = template === "creative" ? 30 : PAGE_W / 2;
      const nameLines = wrapCanvasText(ctx, config.companyName, template === "creative" ? PAGE_W * 0.35 : PAGE_W - 80);
      nameLines.forEach((l, i) => ctx.fillText(l, tX, titleY + i * 34));

      // Subtitle
      ctx.fillStyle = template === "creative" ? hexToRgba("#ffffff", 0.7) : hexToRgba(primaryColor, 0.6);
      ctx.font = getCanvasFont(400, 14, "modern");
      ctx.fillText(config.subtitle, tX, titleY + nameLines.length * 34 + 20);

      // Divider
      const divY = titleY + nameLines.length * 34 + 40;
      if (template === "creative") {
        ctx.fillStyle = hexToRgba("#ffffff", 0.3);
        ctx.fillRect(30, divY, 60, 3);
      } else {
        drawProDivider(ctx, PAGE_W * 0.35, divY, PAGE_W * 0.3, pal.primaryLight || primaryColor, "gradient", 2);
      }

      // Version & date
      ctx.fillStyle = template === "creative" ? hexToRgba("#ffffff", 0.5) : hexToRgba(primaryColor, 0.4);
      ctx.font = getCanvasFont(400, 10, "modern");
      ctx.fillText(config.version, tX, divY + 25);
      ctx.fillText(`Effective: ${config.effectiveDate}`, tX, divY + 40);

      // Decorative
      if (template === "professional" || template === "corporate") {
        ctx.fillStyle = hexToRgba(primaryColor, 0.08);
        roundRect(ctx, m, PAGE_H - 120, PAGE_W - 2 * m, 80, 6);
        ctx.fill();
        ctx.fillStyle = hexToRgba(primaryColor, 0.4);
        ctx.font = getCanvasFont(400, 8, "modern");
        ctx.textAlign = "center";
        ctx.fillText("CONFIDENTIAL — FOR INTERNAL USE ONLY", PAGE_W / 2, PAGE_H - 80);
        ctx.fillText("This handbook is the property of " + config.companyName, PAGE_W / 2, PAGE_H - 65);
      }

    } else {
      // ─── CONTENT PAGES ───
      // Header bar
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, 32);
      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(600, 9, "modern");
      ctx.textAlign = "left";
      ctx.fillText(config.companyName + " — " + config.subtitle, m, 20);
      ctx.textAlign = "right";
      ctx.fillText(`Page ${config.currentPage + 1}`, PAGE_W - m, 20);

      // Chapters on this page (2 per page)
      const startIdx = (config.currentPage - 1) * 2;
      let y = 55;

      for (let c = startIdx; c < startIdx + 2 && c < config.chapters.length; c++) {
        const ch = config.chapters[c];

        // Chapter number badge
        ctx.fillStyle = hexToRgba(primaryColor, 0.1);
        roundRect(ctx, m, y, 28, 28, 4);
        ctx.fill();
        ctx.fillStyle = primaryColor;
        ctx.font = getCanvasFont(700, 14, "modern");
        ctx.textAlign = "center";
        ctx.fillText(`${c + 1}`, m + 14, y + 19);

        // Chapter title
        ctx.textAlign = "left";
        ctx.fillStyle = primaryColor;
        ctx.font = getCanvasFont(700, 16, "modern");
        ctx.fillText(ch.title, m + 38, y + 19);

        drawProDivider(ctx, m, y + 32, PAGE_W - 2 * m, primaryColor, "gradient", 1);

        // Content
        y += 48;
        ctx.fillStyle = "#333";
        ctx.font = getCanvasFont(400, 10, "modern");
        const lines = wrapCanvasText(ctx, ch.content, PAGE_W - 2 * m);
        lines.forEach((l, i) => {
          ctx.fillText(l, m, y + i * 16);
        });
        y += lines.length * 16 + 40;
      }

      // Footer
      ctx.fillStyle = hexToRgba(primaryColor, 0.1);
      ctx.fillRect(0, PAGE_H - 28, PAGE_W, 28);
      ctx.fillStyle = hexToRgba(primaryColor, 0.5);
      ctx.font = getCanvasFont(400, 7, "modern");
      ctx.textAlign = "center";
      ctx.fillText(`${config.version} — ${config.effectiveDate} — Confidential`, PAGE_W / 2, PAGE_H - 12);
    }
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate employee handbook content for: "${config.description}". Return JSON: { "companyName": "", "subtitle": "", "chapters": [{ "title": "", "content": "" }] }. Include 6-8 chapters covering: welcome, employment policies, compensation, code of conduct, health & safety, leave policies. Make content professional and compliant with Zambian labour law where relevant.` }] }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) { const data = JSON.parse(jsonMatch[0]); updateConfig(data); }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, advancedSettings]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "employee-handbook");
  }, []);

  const addChapter = useCallback(() => {
    updateConfig({ chapters: [...config.chapters, { title: "New Chapter", content: "Chapter content..." }] });
  }, [config.chapters, updateConfig]);

  const updateChapter = useCallback((i: number, field: keyof Chapter, value: string) => {
    const updated = [...config.chapters];
    updated[i] = { ...updated[i], [field]: value };
    updateConfig({ chapters: updated });
  }, [config.chapters, updateConfig]);

  const removeChapter = useCallback((i: number) => {
    updateConfig({ chapters: config.chapters.filter((_, idx) => idx !== i) });
  }, [config.chapters, updateConfig]);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      if (t.id === "creative") {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, w * 0.4, h);
      } else {
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, w, h * 0.45);
      }
    },
  }));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the company… e.g., 'Mining company with 500+ employees in Kitwe'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="cover" icon={<IconImage className="size-3.5" />} label="Cover">
        <div className="space-y-2">
          {(["companyName", "subtitle", "version", "effectiveDate"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
          <StockImagePanel onSelect={(img) => updateConfig({ coverImageUrl: img.urls.regular })} />
        </div>
      </AccordionSection>

      <AccordionSection id="chapters" icon={<IconFileText className="size-3.5" />} label={`Chapters (${config.chapters.length})`}>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {config.chapters.map((ch, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-gray-500">Ch. {i + 1}</span>
                <button onClick={() => removeChapter(i)} className="text-red-400 hover:text-red-300 text-xs">×</button>
              </div>
              <input type="text" value={ch.title} onChange={(e) => updateChapter(i, "title", e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] font-medium text-gray-900 dark:text-white" />
              <textarea value={ch.content} onChange={(e) => updateChapter(i, "content", e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white resize-none" rows={2} />
            </div>
          ))}
          <button onClick={addChapter} className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors">+ Add Chapter</button>
        </div>
      </AccordionSection>

      <AccordionSection id="pages" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => updateConfig({ currentPage: i })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.currentPage === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{i === 0 ? "Cover" : `P${i + 1}`}</button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="flex flex-wrap gap-1.5">
          {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ primaryColor: c })}
            className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
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
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={340} displayHeight={480}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as HBTemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Employee Handbook — ${config.currentPage === 0 ? "Cover" : `Page ${config.currentPage + 1}`} — A4 (595×842)`} />
  );
}
