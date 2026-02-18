"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconUsers,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawHeaderArea, generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type ManualTemplate = "professional" | "corporate" | "modern" | "academic" | "minimal" | "illustrated";

interface Chapter {
  id: string;
  title: string;
  content: string;
  objectives: string[];
}

interface ManualConfig {
  template: ManualTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  organization: string;
  author: string;
  version: string;
  activePage: number;
  description: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: ManualTemplate; name: string }[] = [
  { id: "professional", name: "Professional" },
  { id: "corporate", name: "Corporate" },
  { id: "modern", name: "Modern" },
  { id: "academic", name: "Academic" },
  { id: "minimal", name: "Minimal" },
  { id: "illustrated", name: "Illustrated" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "toc", name: "Table of Contents" },
  { id: "ch1", name: "Chapter 1" },
  { id: "ch2", name: "Chapter 2" },
  { id: "ch3", name: "Chapter 3" },
  { id: "ch4", name: "Chapter 4" },
];

/* ── Component ───────────────────────────────────────────── */

export default function TrainingManualWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<ManualConfig>({
    template: "professional",
    primaryColor: "#1e3a5f",
    title: "Customer Service Excellence",
    subtitle: "A Comprehensive Training Manual",
    organization: "Zambia National Commercial Bank",
    author: "Human Resources Division",
    version: "v2.0 — 2026 Edition",
    activePage: 0,
    description: "",
  });

  const [chapters, setChapters] = useState<Chapter[]>([
    {
      id: uid(),
      title: "Introduction to Customer Service",
      content: "Customer service is the cornerstone of every successful business. In Zambia's growing economy, providing exceptional service sets your organization apart. This chapter establishes the foundation for professional customer interaction, covering greetings, tone, body language, and first impressions.",
      objectives: ["Understand the importance of first impressions", "Master professional greetings and tone", "Recognize body language cues", "Identify the five pillars of service excellence"],
    },
    {
      id: uid(),
      title: "Communication Skills",
      content: "Effective communication is essential for delivering outstanding service. This chapter explores verbal and non-verbal communication techniques, active listening, and how to adapt your communication style to diverse customers across Zambia's multicultural landscape.",
      objectives: ["Practice active listening techniques", "Adapt communication to different customer types", "Use positive language and framing", "Handle language barriers professionally"],
    },
    {
      id: uid(),
      title: "Handling Complaints & Difficult Situations",
      content: "Every complaint is an opportunity to build loyalty. This chapter teaches proven de-escalation strategies, the LEARN framework (Listen, Empathize, Apologize, Resolve, Notify), and how to turn negative experiences into positive outcomes for both the customer and the organization.",
      objectives: ["Apply the LEARN complaint resolution framework", "De-escalate tense customer interactions", "Document complaints for continuous improvement", "Follow up effectively after resolution"],
    },
    {
      id: uid(),
      title: "Digital Customer Service",
      content: "As Zambia's digital economy expands, customers increasingly expect support through mobile, email, chat, and social media channels. This chapter covers best practices for digital communication, response time standards, and maintaining brand consistency across all digital touchpoints.",
      objectives: ["Manage multi-channel customer communications", "Write professional emails and chat responses", "Meet response time service level agreements", "Maintain brand voice across digital platforms"],
    },
  ]);

  const updateConfig = useCallback((partial: Partial<ManualConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  /* ── Canvas Render ───────────────────────────────────────── */

  const renderCanvas = useCallback(() => {
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
    const m = 40;
    const cw = PAGE_W - m * 2;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      case "cover": {
        // Full cover background
        const headerH = PAGE_H * 0.55;
        const style = template === "modern" ? "wave" : template === "academic" ? "solid" : template === "minimal" ? "minimal" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, style as "gradient" | "wave" | "solid" | "minimal");

        // Decorative circles
        if (template !== "minimal") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.04);
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 40 + 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Organization badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        const badgeText = config.organization.toUpperCase();
        ctx.font = getCanvasFont(600, 9, "modern");
        const badgeW = ctx.measureText(badgeText).width + 24;
        roundRect(ctx, m, m + 10, badgeW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, m + 12, m + 21);

        // Title
        drawProText(ctx, config.title, m, headerH * 0.45, {
          fontSize: typo.display + 4, fontWeight: 800, color: "#ffffff",
          maxWidth: cw, shadow: true,
        });

        // Subtitle
        drawProText(ctx, config.subtitle, m, headerH * 0.65, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.85),
          maxWidth: cw,
        });

        // Decorative line
        ctx.fillStyle = hexToRgba("#ffffff", 0.4);
        ctx.fillRect(m, headerH * 0.76, 60, 3);

        // Bottom section — author & version
        const infoY = headerH + 60;
        drawProText(ctx, "PREPARED BY", m, infoY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, config.author, m, infoY + 20, {
          fontSize: typo.body + 1, fontWeight: 500, color: pal.textDark,
        });

        drawProText(ctx, "VERSION", m, infoY + 60, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, config.version, m, infoY + 80, {
          fontSize: typo.body, fontWeight: 400, color: pal.textMedium,
        });

        // Illustration placeholder
        if (template === "illustrated") {
          drawImagePlaceholder(ctx, PAGE_W - m - 160, headerH + 40, 150, 150, primaryColor, "Cover Art", 12);
        }

        // Footer bar
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "toc": {
        // TOC Header
        drawHeaderArea(ctx, 0, 0, PAGE_W, 90, primaryColor, "gradient");
        drawProText(ctx, "TABLE OF CONTENTS", m, 25, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Training Manual", m, 45, {
          fontSize: typo.h2, fontWeight: 800, color: "#ffffff",
        });

        let tocY = 120;

        chapters.forEach((ch, i) => {
          // Chapter entry
          ctx.fillStyle = i % 2 === 0 ? pal.offWhite : "#ffffff";
          roundRect(ctx, m, tocY, cw, 60, 8);
          ctx.fill();

          // Chapter number circle
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 22, tocY + 30, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(700, 11, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 22, tocY + 30);

          // Title
          drawProText(ctx, ch.title, m + 48, tocY + 14, {
            fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark,
            maxWidth: cw - 100,
          });

          // Objectives count
          drawProText(ctx, `${ch.objectives.length} learning objectives`, m + 48, tocY + 34, {
            fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
          });

          // Page indicator
          drawProText(ctx, `p. ${i * 2 + 3}`, m + cw - 30, tocY + 22, {
            fontSize: typo.caption, fontWeight: 600, color: primaryColor, align: "right",
          });

          tocY += 72;
        });

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      default: {
        // Chapter pages
        const chIdx = ["ch1", "ch2", "ch3", "ch4"].indexOf(page);
        const chapter = chapters[chIdx];
        if (!chapter) break;

        // Chapter header stripe
        drawHeaderArea(ctx, 0, 0, PAGE_W, 100, primaryColor, "gradient");

        drawProText(ctx, config.organization, m, 18, {
          fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.6), uppercase: true,
        });

        drawProText(ctx, `Chapter ${chIdx + 1}`, m, 38, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.8), uppercase: true,
        });
        drawProText(ctx, chapter.title, m, 58, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
          maxWidth: cw,
        });

        // Content body
        let contentY = 125;

        // Content paragraph
        ctx.font = getCanvasFont(400, typo.body, "modern");
        const lines = wrapCanvasText(ctx, chapter.content, cw);
        ctx.fillStyle = pal.textMedium;
        lines.forEach((line) => {
          ctx.fillText(line, m, contentY);
          contentY += typo.body + 6;
        });

        contentY += 20;

        // Learning Objectives box
        ctx.fillStyle = hexToRgba(primaryColor, 0.05);
        const objBoxH = 30 + chapter.objectives.length * 28;
        roundRect(ctx, m, contentY, cw, objBoxH, 10);
        ctx.fill();

        // Left accent
        ctx.fillStyle = primaryColor;
        roundRect(ctx, m, contentY, 4, objBoxH, 4);
        ctx.fill();

        drawProText(ctx, "LEARNING OBJECTIVES", m + 18, contentY + 14, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });

        chapter.objectives.forEach((obj, i) => {
          const oy = contentY + 38 + i * 28;
          // Checkmark circle
          ctx.fillStyle = pal.primaryMuted;
          ctx.beginPath();
          ctx.arc(m + 28, oy + 4, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 9, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("✓", m + 28, oy + 4);

          ctx.textAlign = "left";
          drawProText(ctx, obj, m + 45, oy - 2, {
            fontSize: typo.caption + 1, fontWeight: 500, color: pal.textDark,
            maxWidth: cw - 65,
          });
        });

        contentY += objBoxH + 25;

        // Key takeaway box (for visual depth)
        if (template === "illustrated" || template === "modern") {
          ctx.fillStyle = hexToRgba(primaryColor, 0.08);
          roundRect(ctx, m, contentY, cw, 70, 10);
          ctx.fill();

          ctx.fillStyle = hexToRgba(primaryColor, 0.2);
          ctx.font = getCanvasFont(900, 40, "classic");
          ctx.textAlign = "left";
          ctx.fillText("\u201C", m + 12, contentY + 35);

          drawProText(ctx, "Key Takeaway: Apply these concepts consistently to build trust and deliver exceptional customer experiences.", m + 40, contentY + 22, {
            fontSize: typo.caption + 1, fontWeight: 500, color: pal.textDark,
            maxWidth: cw - 60, fontStyle: "classic",
          });
        }

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }
    }

    // Page number
    ctx.fillStyle = pal.textLight;
    ctx.font = getCanvasFont(500, 9, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${activePage + 1} / ${PAGES.length}`, PAGE_W / 2, PAGE_H - 14);
  }, [config, chapters]);

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
            content: `Generate a professional training manual outline for: "${config.description}".
Return JSON: { "title": "", "subtitle": "", "organization": "", "chapters": [{ "title": "", "content": "3-4 sentences", "objectives": ["objective1", "objective2", "objective3", "objective4"] }] }
Generate exactly 4 chapters. Each chapter should have 4 learning objectives.`,
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
        });
        if (data.chapters?.length) {
          setChapters(data.chapters.map((ch: { title: string; content: string; objectives: string[] }) => ({
            id: uid(),
            title: ch.title,
            content: ch.content,
            objectives: ch.objectives || [],
          })));
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, config.title, config.subtitle, config.organization, advancedSettings]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `training-manual-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "modern" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "academic" ? "centered" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "centered" | "minimal",
        showSections: 4,
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
          placeholder="Describe your training manual… e.g., 'Customer service training for bank tellers in Zambia'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Manual</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Manual Details">
        <div className="space-y-2">
          {(["title", "subtitle", "organization", "author", "version"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{field.replace(/([A-Z])/g, " $1")}</label>
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

      <AccordionSection id="chapters" icon={<IconUsers className="size-3.5" />} label="Chapters">
        <div className="space-y-3">
          {chapters.map((ch, i) => (
            <div key={ch.id} className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 space-y-1.5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Chapter {i + 1}</label>
              <input
                type="text"
                value={ch.title}
                onChange={(e) => {
                  const updated = [...chapters];
                  updated[i] = { ...ch, title: e.target.value };
                  setChapters(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <textarea
                value={ch.content}
                onChange={(e) => {
                  const updated = [...chapters];
                  updated[i] = { ...ch, content: e.target.value };
                  setChapters(updated);
                }}
                className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
              />
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
        onSelect={(id) => updateConfig({ template: id as ManualTemplate })}
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
      label={`Training Manual — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
