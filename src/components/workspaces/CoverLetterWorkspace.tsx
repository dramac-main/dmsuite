"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText,
  IconUsers, IconBriefcase,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import {
  drawProText, drawProDivider,
  generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS,
} from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type LetterTemplate = "professional" | "modern" | "creative" | "minimal" | "executive" | "academic";

interface SenderInfo {
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  linkedIn: string;
}

interface RecipientInfo {
  name: string;
  title: string;
  company: string;
  address: string;
  city: string;
}

interface CoverLetterConfig {
  template: LetterTemplate;
  primaryColor: string;
  sender: SenderInfo;
  recipient: RecipientInfo;
  date: string;
  salutation: string;
  paragraphs: string[];
  closing: string;
  signatureName: string;
  jobTitle: string;
  aiPrompt: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: LetterTemplate; name: string }[] = [
  { id: "professional", name: "Professional" },
  { id: "modern", name: "Modern" },
  { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" },
  { id: "executive", name: "Executive" },
  { id: "academic", name: "Academic" },
];

const PAGE_W = 595, PAGE_H = 842; // A4

const COLOR_PRESETS = [
  "#1e3a5f", "#0d7377", "#2d1b69", "#b91c1c", "#0f4c75",
  "#1a1a2e", "#6c5ce7", "#065f46", "#713f12", "#831843",
  "#334155", "#06b6d4",
];

/* ── Component ───────────────────────────────────────────── */

export default function CoverLetterWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<CoverLetterConfig>({
    template: "professional",
    primaryColor: "#1e3a5f",
    sender: {
      name: "Chanda Mulenga",
      address: "45 Independence Avenue",
      city: "Lusaka, Zambia",
      phone: "+260 97 8765432",
      email: "chanda.mulenga@email.com",
      linkedIn: "linkedin.com/in/chandamulenga",
    },
    recipient: {
      name: "Mrs. Grace Tembo",
      title: "Human Resources Director",
      company: "Meridian Technologies Ltd",
      address: "Plot 12, Great East Road",
      city: "Lusaka, Zambia",
    },
    date: "18 February 2026",
    salutation: "Dear Mrs. Tembo,",
    paragraphs: [
      "I am writing to express my strong interest in the Senior Software Developer position at Meridian Technologies Ltd, as advertised on your company website. With over six years of experience in full-stack web development and a proven track record of delivering scalable enterprise solutions, I am confident in my ability to contribute meaningfully to your team.",
      "In my current role at Zambia Digital Solutions, I have led the development of several high-impact projects, including a mobile banking platform serving over 200,000 users and an e-commerce system that increased client revenue by 35%. My expertise in React, Node.js, TypeScript, and cloud infrastructure (AWS/Azure) aligns perfectly with the technical requirements outlined in your job description.",
      "What particularly excites me about Meridian Technologies is your commitment to driving digital transformation across Southern Africa. I share this vision and have actively contributed to Zambia's growing tech ecosystem through mentoring junior developers and speaking at local technology conferences. I am eager to bring this passion, along with my technical skills, to your innovative team.",
      "I would welcome the opportunity to discuss how my experience and enthusiasm can contribute to Meridian Technologies' continued success. Thank you for considering my application. I look forward to hearing from you at your earliest convenience.",
    ],
    closing: "Yours sincerely,",
    signatureName: "Chanda Mulenga",
    jobTitle: "Senior Software Developer",
    aiPrompt: "",
  });

  const updateConfig = useCallback((partial: Partial<CoverLetterConfig>) => {
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

    const { template, primaryColor, sender, recipient } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 50; // generous letter margins
    const cw = PAGE_W - m * 2;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    let curY = m;

    /* ── Header / Sender Info ──────────────────────────────── */
    if (template === "professional") {
      // Clean top header with name and line
      drawProText(ctx, sender.name.toUpperCase(), m, curY, {
        fontSize: typo.h2, fontWeight: 800, color: primaryColor,
        fontStyle: "modern",
      });
      curY += typo.h2 + 6;

      drawProDivider(ctx, m, curY, cw, primaryColor, "solid", 2);
      curY += 10;

      // Contact info in a single line
      const contactLine = [sender.address, sender.city, sender.phone, sender.email].filter(Boolean).join("  •  ");
      drawProText(ctx, contactLine, m, curY, {
        fontSize: typo.caption - 1, fontWeight: 400, color: pal.textMedium, maxWidth: cw,
      });
      curY += typo.caption + 10;

    } else if (template === "modern") {
      // Left accent bar with sender info
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, 6, PAGE_H);

      drawProText(ctx, sender.name, m, curY, {
        fontSize: typo.h2, fontWeight: 800, color: primaryColor,
      });
      curY += typo.h2 + 4;

      const contactItems = [sender.phone, sender.email, sender.address + ", " + sender.city];
      contactItems.forEach((item) => {
        drawProText(ctx, item, m, curY, {
          fontSize: typo.caption - 1, fontWeight: 400, color: pal.textMedium,
        });
        curY += typo.caption + 3;
      });
      curY += 8;
      drawProDivider(ctx, m, curY, cw, pal.lightGray, "gradient");
      curY += 14;

    } else if (template === "creative") {
      // Bold color header block
      const headerH = 70;
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, headerH);

      drawProText(ctx, sender.name, m, 18, {
        fontSize: typo.h2, fontWeight: 900, color: "#ffffff",
      });
      const contactLine = `${sender.phone}  •  ${sender.email}`;
      drawProText(ctx, contactLine, m, 44, {
        fontSize: typo.caption - 1, fontWeight: 400, color: hexToRgba("#ffffff", 0.7),
      });
      drawProText(ctx, `${sender.address}, ${sender.city}`, m, 56, {
        fontSize: typo.caption - 1, fontWeight: 400, color: hexToRgba("#ffffff", 0.7),
      });
      curY = headerH + 24;

    } else if (template === "minimal") {
      // Simple right-aligned sender
      drawProText(ctx, sender.name, PAGE_W - m, curY, {
        fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark, align: "right",
      });
      curY += typo.body + 4;
      drawProText(ctx, sender.address, PAGE_W - m, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "right",
      });
      curY += typo.caption + 2;
      drawProText(ctx, sender.city, PAGE_W - m, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "right",
      });
      curY += typo.caption + 2;
      drawProText(ctx, sender.phone, PAGE_W - m, curY, {
        fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, align: "right",
      });
      curY += typo.caption + 2;
      drawProText(ctx, sender.email, PAGE_W - m, curY, {
        fontSize: typo.caption, fontWeight: 400, color: primaryColor, align: "right",
      });
      curY += typo.caption + 16;

    } else if (template === "executive") {
      // Centered name with decorative elements
      drawProText(ctx, sender.name, PAGE_W / 2, curY + 4, {
        fontSize: typo.h1, fontWeight: 800, color: primaryColor, align: "center",
        fontStyle: "classic",
      });
      curY += typo.h1 + 8;

      // Decorative line with diamond
      const lineW = 100;
      drawProDivider(ctx, PAGE_W / 2 - lineW / 2, curY, lineW, primaryColor, "solid", 1);
      ctx.fillStyle = primaryColor;
      ctx.save();
      ctx.translate(PAGE_W / 2, curY);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      curY += 12;

      const contactLine = `${sender.phone}  |  ${sender.email}  |  ${sender.city}`;
      drawProText(ctx, contactLine, PAGE_W / 2, curY, {
        fontSize: typo.caption - 1, fontWeight: 400, color: pal.textMedium, align: "center",
      });
      curY += typo.caption + 16;

    } else if (template === "academic") {
      // Traditional academic style
      drawProText(ctx, sender.name, m, curY, {
        fontSize: typo.h2, fontWeight: 700, color: pal.textDark,
        fontStyle: "classic",
      });
      curY += typo.h2 + 4;
      const contactLines = [sender.address, sender.city, sender.phone, sender.email];
      contactLines.forEach((line) => {
        drawProText(ctx, line, m, curY, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
          fontStyle: "classic",
        });
        curY += typo.caption + 2;
      });
      curY += 8;
      drawProDivider(ctx, m, curY, cw, pal.lightGray, "solid");
      curY += 14;
    }

    /* ── Date ──────────────────────────────────────────────── */
    drawProText(ctx, config.date, m, curY, {
      fontSize: typo.body, fontWeight: 400, color: pal.textMedium,
      fontStyle: template === "academic" || template === "executive" ? "classic" : "modern",
    });
    curY += typo.body + 16;

    /* ── Recipient Info ────────────────────────────────────── */
    const recipientLines = [
      recipient.name,
      recipient.title,
      recipient.company,
      recipient.address,
      recipient.city,
    ];
    recipientLines.forEach((line) => {
      drawProText(ctx, line, m, curY, {
        fontSize: typo.body, fontWeight: line === recipient.name ? 600 : 400,
        color: line === recipient.name ? pal.textDark : pal.textMedium,
        fontStyle: template === "academic" ? "classic" : "modern",
      });
      curY += typo.body + 3;
    });
    curY += 12;

    /* ── Salutation ────────────────────────────────────────── */
    drawProText(ctx, config.salutation, m, curY, {
      fontSize: typo.body, fontWeight: 500, color: pal.textDark,
      fontStyle: template === "academic" || template === "executive" ? "classic" : "modern",
    });
    curY += typo.body + 12;

    /* ── Body Paragraphs ───────────────────────────────────── */
    const bodyFont = template === "academic" || template === "executive" ? "classic" : "modern";
    const bodySize = typo.caption + 1;
    const lineH = bodySize + 5;

    config.paragraphs.forEach((para) => {
      ctx.font = getCanvasFont(400, bodySize, bodyFont);
      const lines = wrapCanvasText(ctx, para, cw);
      lines.forEach((line) => {
        if (curY > PAGE_H - 80) return; // prevent overflow
        ctx.fillStyle = pal.textMedium;
        ctx.font = getCanvasFont(400, bodySize, bodyFont);
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(line, m, curY);
        curY += lineH;
      });
      curY += 8; // paragraph spacing
    });

    /* ── Closing ───────────────────────────────────────────── */
    curY += 4;
    drawProText(ctx, config.closing, m, curY, {
      fontSize: typo.body, fontWeight: 500, color: pal.textDark,
      fontStyle: bodyFont,
    });
    curY += typo.body + 28; // space for signature

    // Signature line
    if (template === "executive" || template === "professional") {
      drawProDivider(ctx, m, curY - 4, 120, pal.lightGray, "solid");
    }

    drawProText(ctx, config.signatureName, m, curY, {
      fontSize: typo.body, fontWeight: 700, color: pal.textDark,
      fontStyle: bodyFont,
    });

    /* ── Template-specific footer decorations ─────────────── */
    if (template === "professional") {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
    } else if (template === "modern") {
      // Left bar already drawn at top
    } else if (template === "creative") {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
    } else if (template === "executive") {
      ctx.fillStyle = primaryColor;
      const fw = 100;
      drawProDivider(ctx, PAGE_W / 2 - fw / 2, PAGE_H - 20, fw, primaryColor, "solid", 1);
    } else if (template === "academic") {
      drawProDivider(ctx, m, PAGE_H - 30, cw, pal.lightGray, "solid");
      drawProText(ctx, `${sender.name}  •  ${sender.email}  •  ${sender.phone}`, PAGE_W / 2, PAGE_H - 16, {
        fontSize: 7, fontWeight: 400, color: pal.textLight, align: "center",
      });
    } else if (template === "minimal") {
      // Tiny accent dot
      ctx.fillStyle = primaryColor;
      ctx.beginPath();
      ctx.arc(PAGE_W / 2, PAGE_H - 20, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [config, advancedSettings]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (!config.aiPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Write a professional cover letter for: "${config.aiPrompt}".
The applicant is: ${config.sender.name} from ${config.sender.city}.
Return JSON: { "salutation": "Dear ...,", "paragraphs": ["opening paragraph about interest", "paragraph about experience and skills", "paragraph about company fit and enthusiasm", "closing paragraph with call to action"], "closing": "Yours sincerely,", "recipientName": "", "recipientTitle": "", "recipientCompany": "", "jobTitle": "" }
Write compelling, specific, professional paragraphs. Use Zambian professional context.`,
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
        if (Array.isArray(data.paragraphs)) {
          updateConfig({ paragraphs: data.paragraphs });
        }
        if (data.salutation) updateConfig({ salutation: data.salutation });
        if (data.closing) updateConfig({ closing: data.closing });
        if (data.jobTitle) updateConfig({ jobTitle: data.jobTitle });
        if (data.recipientName || data.recipientTitle || data.recipientCompany) {
          updateConfig({
            recipient: {
              ...config.recipient,
              name: data.recipientName || config.recipient.name,
              title: data.recipientTitle || config.recipient.title,
              company: data.recipientCompany || config.recipient.company,
            },
          });
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */
  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `cover-letter-${config.template}`);
  }, [config.template]);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "professional" ? "bar" : t.id === "modern" ? "sidebar" : t.id === "creative" ? "bar" : t.id === "executive" ? "centered" : t.id === "academic" ? "strip" : "minimal";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "sidebar" | "centered" | "strip" | "minimal",
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
          value={config.aiPrompt}
          onChange={(e) => updateConfig({ aiPrompt: e.target.value })}
          placeholder="Describe the job you're applying for… e.g., 'Marketing Manager at Zambia Breweries, I have 5 years marketing experience'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.aiPrompt.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Cover Letter</>}
        </button>
      </AccordionSection>

      <AccordionSection id="sender" icon={<IconUsers className="size-3.5" />} label="Sender Info">
        <div className="space-y-2">
          {([
            { key: "name", label: "Full Name" },
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
            { key: "phone", label: "Phone" },
            { key: "email", label: "Email" },
            { key: "linkedIn", label: "LinkedIn" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config.sender[key]}
                onChange={(e) => updateConfig({ sender: { ...config.sender, [key]: e.target.value } })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="recipient" icon={<IconBriefcase className="size-3.5" />} label="Recipient Info">
        <div className="space-y-2">
          {([
            { key: "name", label: "Recipient Name" },
            { key: "title", label: "Title" },
            { key: "company", label: "Company" },
            { key: "address", label: "Address" },
            { key: "city", label: "City" },
          ] as const).map(({ key, label }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{label}</label>
              <input
                type="text"
                value={config.recipient[key]}
                onChange={(e) => updateConfig({ recipient: { ...config.recipient, [key]: e.target.value } })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</label>
            <input
              type="text"
              value={config.date}
              onChange={(e) => updateConfig({ date: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="content" icon={<IconFileText className="size-3.5" />} label="Letter Content">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Salutation</label>
            <input
              type="text"
              value={config.salutation}
              onChange={(e) => updateConfig({ salutation: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          {config.paragraphs.map((para, i) => (
            <div key={i}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Paragraph {i + 1}</label>
              <textarea
                value={para}
                onChange={(e) => {
                  const newParas = [...config.paragraphs];
                  newParas[i] = e.target.value;
                  updateConfig({ paragraphs: newParas });
                }}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
              />
            </div>
          ))}
          <div className="flex gap-1.5">
            <button
              onClick={() => updateConfig({ paragraphs: [...config.paragraphs, ""] })}
              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              + Add Paragraph
            </button>
            {config.paragraphs.length > 1 && (
              <button
                onClick={() => updateConfig({ paragraphs: config.paragraphs.slice(0, -1) })}
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-200 dark:bg-gray-700 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Remove Last
              </button>
            )}
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Closing</label>
            <input
              type="text"
              value={config.closing}
              onChange={(e) => updateConfig({ closing: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Signature Name</label>
            <input
              type="text"
              value={config.signatureName}
              onChange={(e) => updateConfig({ signatureName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
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
            { id: "print-standard", label: "Print (PNG 300 DPI)", desc: "High quality" },
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

  /* ── Right Panel ─────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => updateConfig({ template: id as LetterTemplate })}
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
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))}
      onZoomFit={() => setZoom(1)}
      label={`Cover Letter — A4 (${PAGE_W}×${PAGE_H})`}
    />
  );
}
