"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconImage, IconLayout, IconBriefcase,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, getTypographicScale, searchStockImages, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";

/* ── Types ─────────────────────────────────────────────────── */

type CaseTemplate = "corporate" | "bold" | "minimal" | "magazine" | "tech" | "consulting";

interface StatMetric {
  id: string;
  value: string;
  label: string;
}

interface CaseStudyConfig {
  template: CaseTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  clientName: string;
  clientIndustry: string;
  clientLocation: string;
  duration: string;
  challenge: string;
  solution: string;
  results: string;
  testimonialQuote: string;
  testimonialAuthor: string;
  testimonialRole: string;
  activePage: number;
  description: string;
  heroImageUrl: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: CaseTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "bold", name: "Bold" },
  { id: "minimal", name: "Minimal" },
  { id: "magazine", name: "Magazine" },
  { id: "tech", name: "Tech" },
  { id: "consulting", name: "Consulting" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "challenge", name: "Challenge" },
  { id: "solution", name: "Solution" },
  { id: "results", name: "Results" },
  { id: "metrics", name: "Metrics" },
  { id: "testimonial", name: "Testimonial" },
];

/* ── Component ───────────────────────────────────────────── */

export default function CaseStudyWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [heroImg, setHeroImg] = useState<HTMLImageElement | null>(null);

  const [config, setConfig] = useState<CaseStudyConfig>({
    template: "corporate",
    primaryColor: "#1e3a5f",
    title: "Digital Transformation Success Story",
    subtitle: "How Zesco Limited Modernized Operations with Technology",
    clientName: "Zesco Limited",
    clientIndustry: "Energy & Utilities",
    clientLocation: "Lusaka, Zambia",
    duration: "18 Months",
    challenge: "Zesco Limited, Zambia's largest electricity utility, was facing significant operational inefficiencies. Manual meter reading processes resulted in billing errors affecting 15% of customers. Aging legacy systems could not support real-time monitoring, leading to extended outage response times averaging 6 hours. Customer satisfaction scores had dropped to 52%, and revenue leakage due to non-technical losses exceeded K180 million annually.",
    solution: "We implemented a comprehensive digital transformation program across three phases. Phase 1 deployed smart metering infrastructure covering 200,000 households in Lusaka. Phase 2 introduced an AI-powered grid management system with real-time monitoring and predictive maintenance capabilities. Phase 3 launched a customer self-service portal and mobile app, enabling online payments, outage reporting, and consumption tracking. The entire solution was built on a cloud-native architecture designed for scale.",
    results: "Within 18 months, the transformation delivered measurable impact across all key performance indicators. Billing accuracy improved from 85% to 99.2%, recovering K120 million in previously lost revenue. Average outage response time dropped from 6 hours to 45 minutes. Customer satisfaction scores rose from 52% to 87%, and the mobile app achieved 150,000 active users within the first quarter of launch.",
    testimonialQuote: "This partnership fundamentally changed how we serve our customers. The technology has not only improved our operations but has positioned Zesco as a leader in utility modernization across Southern Africa.",
    testimonialAuthor: "Victor Mubanga",
    testimonialRole: "Chief Information Officer, Zesco Limited",
    activePage: 0,
    description: "",
    heroImageUrl: "",
  });

  const [metrics, setMetrics] = useState<StatMetric[]>([
    { id: uid(), value: "99.2%", label: "Billing Accuracy" },
    { id: uid(), value: "85%", label: "Reduction in Outage Response Time" },
    { id: uid(), value: "K120M", label: "Revenue Recovered" },
    { id: uid(), value: "87%", label: "Customer Satisfaction Score" },
    { id: uid(), value: "150K", label: "Mobile App Users (Q1)" },
    { id: uid(), value: "200K", label: "Smart Meters Deployed" },
  ]);

  const updateConfig = useCallback((partial: Partial<CaseStudyConfig>) => {
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

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      case "cover": {
        const headerH = PAGE_H * 0.55;
        const style = template === "bold" ? "diagonal" : template === "minimal" ? "minimal" : template === "tech" ? "wave" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, style as "gradient" | "diagonal" | "minimal" | "wave");

        // Hero image overlay
        if (heroImg) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          drawImageCover(ctx, heroImg, 0, 0, PAGE_W, headerH);
          ctx.restore();
          const grad = ctx.createLinearGradient(0, 0, 0, headerH);
          grad.addColorStop(0, hexToRgba(primaryColor, 0.6));
          grad.addColorStop(1, primaryColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, PAGE_W, headerH);
        }

        // Decorative circles
        if (template !== "minimal") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.03);
          for (let i = 0; i < 12; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 35 + 10, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // CASE STUDY badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        ctx.font = getCanvasFont(600, 9, "modern");
        const badgeText = "CASE STUDY";
        const badgeW = ctx.measureText(badgeText).width + 24;
        roundRect(ctx, m, m + 10, badgeW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(badgeText, m + 12, m + 21);

        // Title
        drawProText(ctx, config.title, m, headerH * 0.42, {
          fontSize: typo.display + 2, fontWeight: 800, color: "#ffffff",
          maxWidth: cw, shadow: true,
        });

        // Subtitle
        drawProText(ctx, config.subtitle, m, headerH * 0.62, {
          fontSize: typo.body + 1, fontWeight: 400, color: hexToRgba("#ffffff", 0.8),
          maxWidth: cw,
        });

        // Decorative line
        ctx.fillStyle = hexToRgba("#ffffff", 0.35);
        ctx.fillRect(m, headerH * 0.78, 60, 3);

        // Client info cards
        const infoY = headerH + 40;
        const infoItems = [
          { label: "CLIENT", value: config.clientName },
          { label: "INDUSTRY", value: config.clientIndustry },
          { label: "LOCATION", value: config.clientLocation },
          { label: "DURATION", value: config.duration },
        ];
        const infoW = (cw - 30) / 2;
        infoItems.forEach((item, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const ix = m + col * (infoW + 30);
          const iy = infoY + row * 50;

          drawProText(ctx, item.label, ix, iy, {
            fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
          });
          drawProText(ctx, item.value, ix, iy + 18, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "challenge": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "THE CHALLENGE", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Problem Statement", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body, "modern");
        const chalLines = wrapCanvasText(ctx, config.challenge, cw);
        ctx.fillStyle = pal.textMedium;
        chalLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 7;
        });

        // Challenge highlights
        yPos += 24;
        const highlights = ["15% billing error rate", "6-hour average outage response", "52% customer satisfaction", "K180M annual revenue leakage"];
        highlights.forEach((h, i) => {
          ctx.fillStyle = hexToRgba("#e17055", 0.06);
          roundRect(ctx, m, yPos, cw, 32, 6);
          ctx.fill();
          ctx.fillStyle = "#e17055";
          roundRect(ctx, m, yPos, 4, 32, 4);
          ctx.fill();

          ctx.fillStyle = "#e17055";
          ctx.font = getCanvasFont(700, 10, "modern");
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.fillText("!", m + 16, yPos + 16);

          drawProText(ctx, h, m + 30, yPos + 10, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          });

          yPos += 40;
          if (i >= 3) return;
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "solution": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "THE SOLUTION", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Our Approach", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body, "modern");
        const solLines = wrapCanvasText(ctx, config.solution, cw);
        ctx.fillStyle = pal.textMedium;
        solLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 7;
        });

        // Phase breakdown
        yPos += 24;
        const phases = [
          { phase: "Phase 1", desc: "Smart Metering Infrastructure — 200K households" },
          { phase: "Phase 2", desc: "AI Grid Management & Predictive Maintenance" },
          { phase: "Phase 3", desc: "Customer Self-Service Portal & Mobile App" },
        ];
        phases.forEach((p, i) => {
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, m, yPos, cw, 50, 8);
          ctx.fill();

          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 22, yPos + 25, 14, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(700, 11, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 22, yPos + 25);

          drawProText(ctx, p.phase, m + 48, yPos + 12, {
            fontSize: typo.caption, fontWeight: 700, color: primaryColor, uppercase: true,
          });
          drawProText(ctx, p.desc, m + 48, yPos + 30, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
            maxWidth: cw - 70,
          });

          yPos += 60;
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "results": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "THE RESULTS", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Measurable Impact", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body, "modern");
        const resLines = wrapCanvasText(ctx, config.results, cw);
        ctx.fillStyle = pal.textMedium;
        resLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 7;
        });

        // Quick stats preview (top 3)
        yPos += 24;
        const previewMetrics = metrics.slice(0, 3);
        const mW = (cw - 20) / 3;
        previewMetrics.forEach((met, i) => {
          const mx = m + i * (mW + 10);
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, mx, yPos, mW, 80, 10);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          roundRect(ctx, mx, yPos, mW, 4, 4);
          ctx.fill();

          drawProText(ctx, met.value, mx + mW / 2, yPos + 30, {
            fontSize: typo.h1, fontWeight: 900, color: primaryColor, align: "center",
          });
          drawProText(ctx, met.label, mx + mW / 2, yPos + 55, {
            fontSize: typo.caption - 1, fontWeight: 500, color: pal.textMedium, align: "center",
            maxWidth: mW - 16,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "metrics": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "KEY METRICS", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Performance Dashboard", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        const gridY = 130;
        const cardW = (cw - 20) / 2;
        const cardH = 110;
        metrics.forEach((met, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 14);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 12);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          roundRect(ctx, cx, cy, 5, cardH, 5);
          ctx.fill();

          drawProText(ctx, met.value, cx + 24, cy + 22, {
            fontSize: typo.display, fontWeight: 900, color: primaryColor,
          });
          drawProDivider(ctx, cx + 24, cy + 58, cardW - 48, pal.lightGray, "gradient");
          drawProText(ctx, met.label, cx + 24, cy + 72, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium,
            maxWidth: cardW - 48,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "testimonial": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, PAGE_H * 0.35, primaryColor, "gradient");
        drawProText(ctx, "CLIENT TESTIMONIAL", PAGE_W / 2, 60, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), align: "center", uppercase: true,
        });

        // Quote card
        const cardY = PAGE_H * 0.2;
        const cardH = 280;
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = hexToRgba("#000000", 0.1);
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 10;
        roundRect(ctx, m + 20, cardY, cw - 40, cardH, 16);
        ctx.fill();
        ctx.shadowColor = "transparent";

        // Big quote mark
        ctx.fillStyle = hexToRgba(primaryColor, 0.1);
        ctx.font = getCanvasFont(900, 80, "classic");
        ctx.textAlign = "left";
        ctx.fillText("\u201C", m + 40, cardY + 60);

        // Quote text
        ctx.font = getCanvasFont(500, typo.body + 2, "classic");
        const quoteLines = wrapCanvasText(ctx, config.testimonialQuote, cw - 100);
        ctx.fillStyle = pal.textDark;
        quoteLines.forEach((line, i) => {
          ctx.fillText(line, m + 50, cardY + 80 + i * (typo.body + 9));
        });

        // Author
        const authorY = cardY + cardH - 70;
        drawProDivider(ctx, m + 50, authorY, 40, primaryColor, "solid", 2);
        drawProText(ctx, config.testimonialAuthor, m + 50, authorY + 18, {
          fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark,
        });
        drawProText(ctx, config.testimonialRole, m + 50, authorY + 38, {
          fontSize: typo.caption, fontWeight: 400, color: primaryColor,
        });

        // Client logo placeholder
        drawImagePlaceholder(ctx, PAGE_W / 2 - 40, cardY + cardH + 30, 80, 50, primaryColor, "Logo", 8);

        // Thank you note
        drawProText(ctx, "Thank you for the opportunity to partner with your team.", PAGE_W / 2, cardY + cardH + 110, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textLight, align: "center",
        });

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
  }, [config, heroImg, metrics]);

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
            content: `Generate a business case study for: "${config.description}".
Return JSON: { "title": "", "subtitle": "", "clientName": "", "clientIndustry": "", "clientLocation": "", "duration": "", "challenge": "4-5 sentences", "solution": "4-5 sentences", "results": "3-4 sentences", "metrics": [{ "value": "", "label": "" }], "testimonialQuote": "2-3 sentences", "testimonialAuthor": "", "testimonialRole": "", "heroImageQuery": "" }
Generate exactly 6 metrics. Make it compelling with specific numbers.`,
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
          clientName: data.clientName || config.clientName,
          clientIndustry: data.clientIndustry || config.clientIndustry,
          clientLocation: data.clientLocation || config.clientLocation,
          duration: data.duration || config.duration,
          challenge: data.challenge || config.challenge,
          solution: data.solution || config.solution,
          results: data.results || config.results,
          testimonialQuote: data.testimonialQuote || config.testimonialQuote,
          testimonialAuthor: data.testimonialAuthor || config.testimonialAuthor,
          testimonialRole: data.testimonialRole || config.testimonialRole,
        });
        if (data.metrics?.length) {
          setMetrics(data.metrics.map((d: { value: string; label: string }) => ({
            id: uid(), value: d.value, label: d.label,
          })));
        }
        if (data.heroImageQuery) {
          const imgs = await searchStockImages(data.heroImageQuery, { perPage: 1 });
          if (imgs.length > 0) {
            try {
              const img = await loadImage(imgs[0].urls.regular);
              setHeroImg(img);
              updateConfig({ heroImageUrl: imgs[0].urls.regular });
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */

  const handleStockImageSelect = useCallback(async (img: StockImage) => {
    try {
      const loaded = await loadImage(img.urls.regular);
      setHeroImg(loaded);
      updateConfig({ heroImageUrl: img.urls.regular });
    } catch { /* skip */ }
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `case-study-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "bold" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "tech" ? "gradient" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "minimal",
        showSections: 3,
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
          placeholder="Describe your case study… e.g., 'Digital transformation project for a Zambian utility company'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Case Study</>}
        </button>
      </AccordionSection>

      <AccordionSection id="client" icon={<IconBriefcase className="size-3.5" />} label="Client Info">
        <div className="space-y-2">
          {(["clientName", "clientIndustry", "clientLocation", "duration"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{field.replace("client", "").replace(/([A-Z])/g, " $1") || "Name"}</label>
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

      <AccordionSection id="content" icon={<IconFileText className="size-3.5" />} label="Content">
        <div className="space-y-2">
          {(["title", "subtitle"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{field}</label>
              <input
                type="text"
                value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
          {(["challenge", "solution", "results"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{field}</label>
              <textarea
                value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="testimonial" icon={<IconLayout className="size-3.5" />} label="Testimonial">
        <div className="space-y-2">
          <textarea
            value={config.testimonialQuote}
            onChange={(e) => updateConfig({ testimonialQuote: e.target.value })}
            placeholder="Client quote…"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
            rows={3}
          />
          <input
            type="text"
            value={config.testimonialAuthor}
            onChange={(e) => updateConfig({ testimonialAuthor: e.target.value })}
            placeholder="Author name"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <input
            type="text"
            value={config.testimonialRole}
            onChange={(e) => updateConfig({ testimonialRole: e.target.value })}
            placeholder="Author role"
            className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Hero Image">
        <StockImagePanel onSelect={handleStockImageSelect} />
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
        onSelect={(id) => updateConfig({ template: id as CaseTemplate })}
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
      label={`Case Study — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
