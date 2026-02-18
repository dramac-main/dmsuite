"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconLayout,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type SheetTemplate = "corporate" | "clean" | "educational" | "medical" | "legal" | "modern";

interface FormField {
  id: string;
  label: string;
  type: "text" | "checkbox" | "rating" | "textarea" | "select";
}

interface FormSection {
  id: string;
  title: string;
  fields: FormField[];
}

interface WorksheetConfig {
  template: SheetTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  organization: string;
  formId: string;
  activePage: number;
  description: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: SheetTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "clean", name: "Clean" },
  { id: "educational", name: "Educational" },
  { id: "medical", name: "Medical" },
  { id: "legal", name: "Legal" },
  { id: "modern", name: "Modern" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "page1", name: "Employee Info" },
  { id: "page2", name: "Performance" },
  { id: "page3", name: "Skills & Goals" },
  { id: "page4", name: "Summary" },
];

/* ── Component ───────────────────────────────────────────── */

export default function WorksheetDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<WorksheetConfig>({
    template: "corporate",
    primaryColor: "#1e3a5f",
    title: "Employee Performance Evaluation",
    subtitle: "Annual Review Form — 2026",
    organization: "Zambia Revenue Authority",
    formId: "HR-EVAL-2026",
    activePage: 0,
    description: "",
  });

  const [formSections, setFormSections] = useState<FormSection[]>([
    {
      id: uid(),
      title: "Employee Information",
      fields: [
        { id: uid(), label: "Full Name", type: "text" },
        { id: uid(), label: "Employee ID", type: "text" },
        { id: uid(), label: "Department", type: "text" },
        { id: uid(), label: "Position / Title", type: "text" },
        { id: uid(), label: "Date of Hire", type: "text" },
        { id: uid(), label: "Supervisor Name", type: "text" },
        { id: uid(), label: "Review Period", type: "text" },
      ],
    },
    {
      id: uid(),
      title: "Performance Assessment",
      fields: [
        { id: uid(), label: "Job Knowledge", type: "rating" },
        { id: uid(), label: "Quality of Work", type: "rating" },
        { id: uid(), label: "Productivity", type: "rating" },
        { id: uid(), label: "Communication", type: "rating" },
        { id: uid(), label: "Teamwork", type: "rating" },
        { id: uid(), label: "Initiative", type: "rating" },
        { id: uid(), label: "Attendance & Punctuality", type: "rating" },
      ],
    },
    {
      id: uid(),
      title: "Skills & Development Goals",
      fields: [
        { id: uid(), label: "Key Strengths", type: "textarea" },
        { id: uid(), label: "Areas for Improvement", type: "textarea" },
        { id: uid(), label: "Training Needs", type: "textarea" },
        { id: uid(), label: "Goals for Next Period", type: "textarea" },
      ],
    },
    {
      id: uid(),
      title: "Summary & Signatures",
      fields: [
        { id: uid(), label: "Overall Rating", type: "select" },
        { id: uid(), label: "Recommendation for Promotion", type: "checkbox" },
        { id: uid(), label: "Recommendation for Training", type: "checkbox" },
        { id: uid(), label: "Manager Comments", type: "textarea" },
        { id: uid(), label: "Employee Comments", type: "textarea" },
      ],
    },
  ]);

  const updateConfig = useCallback((partial: Partial<WorksheetConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  /* ── Canvas Render ───────────────────────────────────────── */

  const renderCanvas = useCallback(() => {
    /* ── Draw Helpers (inside useCallback to satisfy hooks rules) ── */
    const drawTextField = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number, pal: ReturnType<typeof generateColorPalette>, typo: ReturnType<typeof getTypographicScale>) => {
      drawProText(ctx, label, x, y, {
        fontSize: typo.caption, fontWeight: 600, color: pal.textDark,
      });
      ctx.strokeStyle = pal.mediumGray;
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(x, y + 18);
      ctx.lineTo(x + w, y + 18);
      ctx.stroke();
      return 32;
    };

    const drawRatingField = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number, primaryColor: string, pal: ReturnType<typeof generateColorPalette>, typo: ReturnType<typeof getTypographicScale>) => {
      drawProText(ctx, label, x, y, {
        fontSize: typo.caption, fontWeight: 600, color: pal.textDark,
      });
      const ratings = ["1", "2", "3", "4", "5"];
      const ratingStartX = x + w - ratings.length * 28;
      ratings.forEach((r, i) => {
        const rx = ratingStartX + i * 28;
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(rx + 10, y + 6, 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = pal.textLight;
        ctx.font = getCanvasFont(600, 8, "modern");
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(r, rx + 10, y + 6);
      });
      return 28;
    };

    const drawTextareaField = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number, pal: ReturnType<typeof generateColorPalette>, typo: ReturnType<typeof getTypographicScale>) => {
      drawProText(ctx, label, x, y, {
        fontSize: typo.caption, fontWeight: 600, color: pal.textDark,
      });
      ctx.strokeStyle = hexToRgba(pal.mediumGray, 0.5);
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 4; i++) {
        const ly = y + 18 + i * 16;
        ctx.beginPath();
        ctx.moveTo(x, ly);
        ctx.lineTo(x + w, ly);
        ctx.stroke();
      }
      return 84;
    };

    const drawCheckboxField = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, primaryColor: string, pal: ReturnType<typeof generateColorPalette>, typo: ReturnType<typeof getTypographicScale>) => {
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 1.2;
      roundRect(ctx, x, y, 12, 12, 2);
      ctx.stroke();
      drawProText(ctx, label, x + 20, y + 1, {
        fontSize: typo.caption, fontWeight: 500, color: pal.textDark,
      });
      return 24;
    };

    const drawSelectField = (ctx: CanvasRenderingContext2D, label: string, x: number, y: number, w: number, primaryColor: string, pal: ReturnType<typeof generateColorPalette>, typo: ReturnType<typeof getTypographicScale>) => {
      drawProText(ctx, label, x, y, {
        fontSize: typo.caption, fontWeight: 600, color: pal.textDark,
      });
      const options = ["Excellent", "Good", "Satisfactory", "Needs Improvement", "Unsatisfactory"];
      options.forEach((opt, i) => {
        const ox = x + i * (w / options.length);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(ox + 6, y + 22, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = pal.textMedium;
        ctx.font = getCanvasFont(400, 7, "modern");
        ctx.textAlign = "left";
        ctx.fillText(opt, ox + 14, y + 24);
      });
      return 40;
    };
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = PAGE_W * 2;
    canvas.height = PAGE_H * 2;
    ctx.scale(2, 2);
    ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { template, primaryColor, activePage } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 36;
    const cw = PAGE_W - m * 2;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const section = formSections[activePage];
    if (!section) return;

    // Header
    const headerH = template === "clean" ? 60 : 80;
    if (template === "legal") {
      // Dual line header
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m, 20);
      ctx.lineTo(PAGE_W - m, 20);
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(m, 24);
      ctx.lineTo(PAGE_W - m, 24);
      ctx.stroke();

      drawProText(ctx, config.title, PAGE_W / 2, 35, {
        fontSize: typo.h3, fontWeight: 700, color: primaryColor, align: "center",
      });
      drawProText(ctx, config.subtitle, PAGE_W / 2, 52, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "center",
      });

      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m, 66);
      ctx.lineTo(PAGE_W - m, 66);
      ctx.stroke();
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(m, 70);
      ctx.lineTo(PAGE_W - m, 70);
      ctx.stroke();
    } else if (template === "modern" || template === "educational") {
      drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, template === "modern" ? "wave" : "gradient");
      drawProText(ctx, config.organization, m, 16, {
        fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.7), uppercase: true,
      });
      drawProText(ctx, config.title, m, 35, {
        fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
      });
      drawProText(ctx, config.subtitle, m, 55, {
        fontSize: typo.caption, fontWeight: 400, color: hexToRgba("#ffffff", 0.75),
      });
    } else {
      drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, "gradient");
      drawProText(ctx, config.organization, m, 16, {
        fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.7), uppercase: true,
      });
      drawProText(ctx, config.title, m, 35, {
        fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
      });
      drawProText(ctx, config.subtitle, m, 55, {
        fontSize: typo.caption, fontWeight: 400, color: hexToRgba("#ffffff", 0.75),
      });
    }

    // Form ID
    drawProText(ctx, `Form: ${config.formId}`, PAGE_W - m, headerH + 14, {
      fontSize: typo.label, fontWeight: 600, color: pal.textLight, align: "right",
    });

    // Section title
    let yPos = headerH + 32;
    drawProText(ctx, section.title.toUpperCase(), m, yPos, {
      fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
    });
    drawProDivider(ctx, m, yPos + 16, cw, primaryColor, "solid", 1.5);
    yPos += 30;

    // Fields
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    section.fields.forEach((field) => {
      if (yPos > PAGE_H - 80) return; // safety
      let fieldH = 0;
      switch (field.type) {
        case "text":
          fieldH = drawTextField(ctx, field.label, m, yPos, cw, pal, typo);
          break;
        case "rating":
          fieldH = drawRatingField(ctx, field.label, m, yPos, cw, primaryColor, pal, typo);
          break;
        case "textarea":
          fieldH = drawTextareaField(ctx, field.label, m, yPos, cw, pal, typo);
          break;
        case "checkbox":
          fieldH = drawCheckboxField(ctx, field.label, m, yPos, primaryColor, pal, typo);
          break;
        case "select":
          fieldH = drawSelectField(ctx, field.label, m, yPos, cw, primaryColor, pal, typo);
          break;
      }
      yPos += fieldH + 8;
    });

    // Signature lines on last page
    if (activePage === formSections.length - 1) {
      const sigY = PAGE_H - 120;
      // Evaluator signature
      drawProDivider(ctx, m, sigY, cw * 0.4, pal.mediumGray, "solid", 0.8);
      drawProText(ctx, "Evaluator Signature / Date", m, sigY + 12, {
        fontSize: typo.label, fontWeight: 500, color: pal.textLight,
      });
      // Employee signature
      drawProDivider(ctx, m + cw * 0.55, sigY, cw * 0.45, pal.mediumGray, "solid", 0.8);
      drawProText(ctx, "Employee Signature / Date", m + cw * 0.55, sigY + 12, {
        fontSize: typo.label, fontWeight: 500, color: pal.textLight,
      });
    }

    // Footer
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);

    // Page number
    ctx.fillStyle = pal.textLight;
    ctx.font = getCanvasFont(500, 9, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${activePage + 1} / ${PAGES.length}`, PAGE_W / 2, PAGE_H - 14);
  }, [config, formSections, advancedSettings]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a printable evaluation/worksheet form for: "${config.description}".
Return JSON: { "title": "", "subtitle": "", "organization": "", "formId": "", "sections": [{ "title": "", "fields": [{ "label": "", "type": "text|checkbox|rating|textarea|select" }] }] }
Generate exactly 4 sections. Use varied field types.`,
          }],
        }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
      }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        updateConfig({
          title: data.title || config.title,
          subtitle: data.subtitle || config.subtitle,
          organization: data.organization || config.organization,
          formId: data.formId || config.formId,
        });
        if (data.sections?.length) {
          setFormSections(data.sections.map((s: { title: string; fields: { label: string; type: string }[] }) => ({
            id: uid(),
            title: s.title,
            fields: (s.fields || []).map((f: { label: string; type: string }) => ({
              id: uid(),
              label: f.label,
              type: (["text", "checkbox", "rating", "textarea", "select"].includes(f.type) ? f.type : "text") as FormField["type"],
            })),
          })));
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, config.title, config.subtitle, config.organization, config.formId]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `worksheet-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "modern" ? "gradient" : t.id === "clean" ? "minimal" : t.id === "legal" ? "bar" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "minimal",
        showSections: 5,
      });
    },
  }));

  const displayW = 380;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  /* ── Left Panel ──────────────────────────────────────────── */

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your worksheet/form… e.g., 'Employee evaluation form for a government agency in Zambia'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Form</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Form Details">
        <div className="space-y-2">
          {(["title", "subtitle", "organization", "formId"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{field === "formId" ? "Form ID" : field.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="sections" icon={<IconLayout className="size-3.5" />} label="Form Sections">
        <div className="space-y-3">
          {formSections.map((sec, i) => (
            <div key={sec.id} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Section {i + 1}</label>
              <input
                type="text"
                value={sec.title}
                onChange={(e) => {
                  const updated = [...formSections];
                  updated[i] = { ...sec, title: e.target.value };
                  setFormSections(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <p className="text-[10px] text-gray-400">{sec.fields.length} fields ({sec.fields.map((f) => f.type).join(", ")})</p>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style & Colors">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Primary Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c}
                onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input
            type="color"
            value={config.primaryColor}
            onChange={(e) => updateConfig({ primaryColor: e.target.value })}
            className="w-full h-8 rounded-lg cursor-pointer"
          />
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[
            { id: "web-standard", label: "Web (PNG 2×)", desc: "150 DPI" },
            { id: "print-standard", label: "Print (PDF 300 DPI)", desc: "With crop marks" },
            { id: "print-ultra", label: "Ultra Print (600 DPI)", desc: "Maximum quality" },
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => handleExport(preset.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors"
            >
              <span>{preset.label}</span>
              <span className="text-[10px] text-gray-400">{preset.desc}</span>
            </button>
          ))}
        </div>
      </AccordionSection>
          {/* Advanced Settings — Global */}
        <AdvancedSettingsPanel />

      </Accordion>
  );

  /* ── Toolbar ─────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex items-center gap-1.5">
      {PAGES.map((p, i) => (
        <button
          key={p.id}
          onClick={() => updateConfig({ activePage: i })}
          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
            config.activePage === i
              ? "bg-primary-500 text-gray-950"
              : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"
          }`}
        >
          {p.name}
        </button>
      ))}
    </div>
  );

  /* ── Right Panel ─────────────────────────────────────────── */

  const rightPanel = (
    <div className="space-y-4">
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => updateConfig({ template: id as SheetTemplate })}
        thumbWidth={120}
        thumbHeight={170}
      />
    </div>
  );

  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      toolbar={toolbar}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Worksheet — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
