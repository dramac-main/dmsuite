"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles, IconWand, IconLoader, IconDownload,
  IconDroplet, IconFileText, IconImage, IconLayout,
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

type PaperTemplate = "corporate" | "research" | "tech" | "executive" | "minimal" | "academic";

interface PaperSection {
  id: string;
  title: string;
  content: string;
}

interface DataCallout {
  id: string;
  value: string;
  label: string;
}

interface WhitePaperConfig {
  template: PaperTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  author: string;
  organization: string;
  date: string;
  executiveSummary: string;
  conclusion: string;
  activePage: number;
  description: string;
  coverImageUrl: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: PaperTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "research", name: "Research" },
  { id: "tech", name: "Tech" },
  { id: "executive", name: "Executive" },
  { id: "minimal", name: "Minimal" },
  { id: "academic", name: "Academic" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#3c1361", "#0d7377", "#1a1a2e",
  "#2d3436", "#6c5ce7", "#00b894", "#e17055", "#2d1b69",
  "#8ae600", "#06b6d4",
];

const PAGES = [
  { id: "cover", name: "Cover" },
  { id: "summary", name: "Executive Summary" },
  { id: "section1", name: "Section 1" },
  { id: "section2", name: "Section 2" },
  { id: "data", name: "Key Findings" },
  { id: "conclusion", name: "Conclusion" },
];

/* ── Component ───────────────────────────────────────────── */

export default function WhitePaperWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [coverImg, setCoverImg] = useState<HTMLImageElement | null>(null);

  const [config, setConfig] = useState<WhitePaperConfig>({
    template: "corporate",
    primaryColor: "#1e3a5f",
    title: "The Future of Digital Innovation in Zambia",
    subtitle: "Opportunities, Challenges, and Strategic Pathways for the Tech Ecosystem",
    author: "Dr. Mwila Chanda",
    organization: "Zambia Technology Board",
    date: "February 2026",
    executiveSummary: "Zambia's technology sector is undergoing rapid transformation, driven by mobile penetration, fintech innovation, and government digitization initiatives. This white paper examines the current state of digital infrastructure, identifies key growth opportunities in e-commerce, agritech, and healthtech, and proposes a strategic framework for sustainable development. Our research shows that with targeted investment and policy support, Zambia's tech ecosystem could contribute 8% of GDP by 2030.",
    conclusion: "The evidence presented in this paper demonstrates that Zambia stands at a pivotal moment in its digital transformation journey. By investing in infrastructure, talent development, and enabling policy frameworks, the nation can position itself as a regional technology leader. Key recommendations include establishing a national digital skills fund, creating regulatory sandboxes for fintech innovation, and expanding broadband connectivity to rural areas.",
    activePage: 0,
    description: "",
    coverImageUrl: "",
  });

  const [sections, setSections] = useState<PaperSection[]>([
    {
      id: uid(),
      title: "Digital Infrastructure & Connectivity",
      content: "Zambia's digital infrastructure has expanded significantly over the past decade. Mobile network coverage now reaches 85% of the population, with 4G LTE available in all provincial capitals. The government's Smart Zambia initiative has connected 120 government offices to a unified network. However, rural connectivity remains a challenge, with only 23% of rural households having internet access compared to 67% in urban areas. Investment in last-mile connectivity through satellite and mesh networks presents significant opportunities for growth.",
    },
    {
      id: uid(),
      title: "Fintech & Mobile Money Revolution",
      content: "The fintech sector has emerged as Zambia's most dynamic technology vertical. Mobile money transactions grew 340% between 2022 and 2025, driven by services like MTN MoMo and Airtel Money. Local startups have raised over $45 million in venture funding, with solutions spanning payments, lending, insurance, and cross-border remittances. The Bank of Zambia's progressive regulatory framework, including the National Financial Switch, has created an enabling environment for innovation while maintaining consumer protection standards.",
    },
  ]);

  const [dataCallouts, setDataCallouts] = useState<DataCallout[]>([
    { id: uid(), value: "85%", label: "Mobile Network Coverage" },
    { id: uid(), value: "340%", label: "Mobile Money Growth (2022-2025)" },
    { id: uid(), value: "$45M", label: "Startup Venture Funding" },
    { id: uid(), value: "8%", label: "Projected GDP Contribution by 2030" },
  ]);

  const updateConfig = useCallback((partial: Partial<WhitePaperConfig>) => {
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
        const style = template === "tech" ? "diagonal" : template === "minimal" ? "minimal" : template === "academic" ? "solid" : "gradient";
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, style as "gradient" | "diagonal" | "solid" | "minimal");

        // Cover image overlay
        if (coverImg) {
          ctx.save();
          ctx.globalAlpha = 0.25;
          drawImageCover(ctx, coverImg, 0, 0, PAGE_W, headerH);
          ctx.restore();
          const grad = ctx.createLinearGradient(0, 0, 0, headerH);
          grad.addColorStop(0, hexToRgba(primaryColor, 0.6));
          grad.addColorStop(1, primaryColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, PAGE_W, headerH);
        }

        // Pattern
        if (template !== "minimal") {
          ctx.fillStyle = hexToRgba("#ffffff", 0.03);
          for (let i = 0; i < 15; i++) {
            ctx.beginPath();
            ctx.arc(Math.random() * PAGE_W, Math.random() * headerH, Math.random() * 40 + 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // WHITE PAPER label
        ctx.fillStyle = hexToRgba("#ffffff", 0.15);
        ctx.font = getCanvasFont(600, 9, "modern");
        const labelText = "WHITE PAPER";
        const badgeW = ctx.measureText(labelText).width + 24;
        roundRect(ctx, m, m + 10, badgeW, 22, 11);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(labelText, m + 12, m + 21);

        // Title
        drawProText(ctx, config.title, m, headerH * 0.4, {
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

        // Author info
        const infoY = headerH + 50;
        drawProText(ctx, "AUTHOR", m, infoY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, config.author, m, infoY + 18, {
          fontSize: typo.body + 1, fontWeight: 500, color: pal.textDark,
        });

        drawProText(ctx, "PUBLISHED BY", m, infoY + 55, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProText(ctx, config.organization, m, infoY + 73, {
          fontSize: typo.body, fontWeight: 500, color: pal.textMedium,
        });

        drawProText(ctx, config.date, m, infoY + 100, {
          fontSize: typo.caption, fontWeight: 400, color: pal.textLight,
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "summary": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, config.organization, m, 18, {
          fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.6), uppercase: true,
        });
        drawProText(ctx, "Executive Summary", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        // Summary text
        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body + 1, "classic");
        const sumLines = wrapCanvasText(ctx, config.executiveSummary, cw);
        ctx.fillStyle = pal.textDark;
        sumLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 8;
        });

        // Highlight callout
        yPos += 24;
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        roundRect(ctx, m, yPos, cw, 80, 10);
        ctx.fill();
        ctx.fillStyle = primaryColor;
        roundRect(ctx, m, yPos, 4, 80, 4);
        ctx.fill();

        ctx.fillStyle = hexToRgba(primaryColor, 0.15);
        ctx.font = getCanvasFont(900, 50, "classic");
        ctx.textAlign = "left";
        ctx.fillText("\u201C", m + 14, yPos + 38);

        drawProText(ctx, "Zambia's tech ecosystem could contribute 8% of GDP by 2030 with the right investment and policy support.", m + 45, yPos + 20, {
          fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          maxWidth: cw - 70, fontStyle: "classic",
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "section1":
      case "section2": {
        const secIdx = page === "section1" ? 0 : 1;
        const section = sections[secIdx];
        if (!section) break;

        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, `Section ${secIdx + 1}`, m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, section.title, m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
          maxWidth: cw,
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body, "modern");
        const contentLines = wrapCanvasText(ctx, section.content, cw);
        ctx.fillStyle = pal.textMedium;
        contentLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 6;
        });

        // Sidebar stat for visual interest
        yPos += 30;
        if (secIdx < dataCallouts.length) {
          const callout = dataCallouts[secIdx];
          ctx.fillStyle = hexToRgba(primaryColor, 0.06);
          roundRect(ctx, m, yPos, cw, 90, 10);
          ctx.fill();

          drawProText(ctx, callout.value, m + cw / 2, yPos + 25, {
            fontSize: typo.display + 8, fontWeight: 900, color: primaryColor, align: "center",
          });
          drawProText(ctx, callout.label, m + cw / 2, yPos + 62, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium, align: "center",
          });
        }

        // Illustration placeholder
        yPos += 115;
        if (template === "research" || template === "tech") {
          drawImagePlaceholder(ctx, m, yPos, cw, 140, primaryColor, "Chart / Figure", 8);
        }

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "data": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, "KEY FINDINGS", m, 18, {
          fontSize: typo.label, fontWeight: 700, color: hexToRgba("#ffffff", 0.7), uppercase: true,
        });
        drawProText(ctx, "Data & Insights", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        const gridY = 130;
        const cardW = (cw - 20) / 2;
        const cardH = 130;
        dataCallouts.forEach((dc, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = gridY + row * (cardH + 16);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 12);
          ctx.fill();

          ctx.fillStyle = primaryColor;
          roundRect(ctx, cx, cy, 5, cardH, 5);
          ctx.fill();

          drawProText(ctx, dc.value, cx + 24, cy + 25, {
            fontSize: typo.display + 4, fontWeight: 900, color: primaryColor,
          });

          drawProDivider(ctx, cx + 24, cy + 65, cardW - 48, pal.lightGray, "gradient");

          drawProText(ctx, dc.label, cx + 24, cy + 82, {
            fontSize: typo.body, fontWeight: 500, color: pal.textMedium,
            maxWidth: cardW - 48,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 6, PAGE_W, 6);
        break;
      }

      case "conclusion": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 95, primaryColor, "gradient");
        drawProText(ctx, config.organization, m, 18, {
          fontSize: 9, fontWeight: 600, color: hexToRgba("#ffffff", 0.6), uppercase: true,
        });
        drawProText(ctx, "Conclusion", m, 45, {
          fontSize: typo.h1, fontWeight: 800, color: "#ffffff",
        });

        let yPos = 120;
        drawProDivider(ctx, m, yPos, 40, primaryColor, "solid", 2);
        yPos += 16;

        ctx.font = getCanvasFont(400, typo.body + 1, "classic");
        const concLines = wrapCanvasText(ctx, config.conclusion, cw);
        ctx.fillStyle = pal.textDark;
        concLines.forEach((line) => {
          ctx.fillText(line, m, yPos);
          yPos += typo.body + 8;
        });

        // Recommendations
        yPos += 20;
        drawProText(ctx, "KEY RECOMMENDATIONS", m, yPos, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, yPos + 16, 40, primaryColor, "solid", 2);
        yPos += 30;

        const recs = [
          "Establish a national digital skills fund",
          "Create regulatory sandboxes for fintech innovation",
          "Expand broadband connectivity to rural areas",
          "Develop public-private partnerships for tech hubs",
        ];
        recs.forEach((rec, i) => {
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, m, yPos, cw, 36, 6);
          ctx.fill();

          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 18, yPos + 18, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(700, 10, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 18, yPos + 18);

          drawProText(ctx, rec, m + 38, yPos + 11, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
            maxWidth: cw - 55,
          });

          yPos += 44;
        });

        // Contact / footer
        yPos += 20;
        drawProDivider(ctx, m, yPos, cw, pal.mediumGray, "gradient");
        yPos += 14;
        drawProText(ctx, `${config.author} — ${config.organization} — ${config.date}`, PAGE_W / 2, yPos, {
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
  }, [config, coverImg, sections, dataCallouts]);

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
            content: `Generate a professional white paper for: "${config.description}".
Return JSON: { "title": "", "subtitle": "", "author": "", "organization": "", "executiveSummary": "4-5 sentences", "sections": [{ "title": "", "content": "3-4 sentences" }], "dataCallouts": [{ "value": "", "label": "" }], "conclusion": "3-4 sentences", "coverImageQuery": "search query for cover image" }
Generate exactly 2 sections and 4 data callouts.`,
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
          author: data.author || config.author,
          organization: data.organization || config.organization,
          executiveSummary: data.executiveSummary || config.executiveSummary,
          conclusion: data.conclusion || config.conclusion,
        });
        if (data.sections?.length) {
          setSections(data.sections.map((s: { title: string; content: string }) => ({
            id: uid(), title: s.title, content: s.content,
          })));
        }
        if (data.dataCallouts?.length) {
          setDataCallouts(data.dataCallouts.map((d: { value: string; label: string }) => ({
            id: uid(), value: d.value, label: d.label,
          })));
        }
        if (data.coverImageQuery) {
          const imgs = await searchStockImages(data.coverImageQuery, { perPage: 1 });
          if (imgs.length > 0) {
            try {
              const img = await loadImage(imgs[0].urls.regular);
              setCoverImg(img);
              updateConfig({ coverImageUrl: imgs[0].urls.regular });
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
      setCoverImg(loaded);
      updateConfig({ coverImageUrl: img.urls.regular });
    } catch { /* skip */ }
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const settings = EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"];
    exportHighRes(canvas, settings, `white-paper-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      const hStyle = t.id === "tech" ? "gradient" : t.id === "minimal" ? "minimal" : t.id === "academic" ? "centered" : "bar";
      drawDocumentThumbnail(ctx, w, h, {
        primaryColor: config.primaryColor,
        headerStyle: hStyle as "bar" | "gradient" | "centered" | "minimal",
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
          placeholder="Describe your white paper topic… e.g., 'The future of renewable energy in Sub-Saharan Africa'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Paper</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Paper Details">
        <div className="space-y-2">
          {(["title", "subtitle", "author", "organization", "date"] as const).map((field) => (
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

      <AccordionSection id="content" icon={<IconLayout className="size-3.5" />} label="Content">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Executive Summary</label>
            <textarea
              value={config.executiveSummary}
              onChange={(e) => updateConfig({ executiveSummary: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={4}
            />
          </div>
          {sections.map((sec, i) => (
            <div key={sec.id}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">Section {i + 1}</label>
              <input
                type="text"
                value={sec.title}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[i] = { ...sec, title: e.target.value };
                  setSections(updated);
                }}
                className="w-full mb-1 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
              <textarea
                value={sec.content}
                onChange={(e) => {
                  const updated = [...sections];
                  updated[i] = { ...sec, content: e.target.value };
                  setSections(updated);
                }}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={3}
              />
            </div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Conclusion</label>
            <textarea
              value={config.conclusion}
              onChange={(e) => updateConfig({ conclusion: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
              rows={3}
            />
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Cover Image">
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
        onSelect={(id) => updateConfig({ template: id as PaperTemplate })}
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
      label={`White Paper — A4 (${PAGE_W}×${PAGE_H}) — Page ${config.activePage + 1}/${PAGES.length}`}
    />
  );
}
