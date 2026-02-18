"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconDroplet,
  IconFileText,
  IconImage,
  IconLayout,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type EbookTemplate = "modern" | "classic" | "tech" | "creative" | "minimal" | "academic";

interface Chapter {
  title: string;
  body: string;
  pullQuote: string;
}

interface EbookConfig {
  template: EbookTemplate;
  primaryColor: string;
  title: string;
  subtitle: string;
  authorName: string;
  edition: string;
  coverImageUrl: string;
  chapters: Chapter[];
  activePage: number;
  description: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const TEMPLATES: { id: EbookTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "tech", name: "Tech" },
  { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" },
  { id: "academic", name: "Academic" },
];

const COLOR_PRESETS = [
  "#1e3a5f", "#0f766e", "#7c3aed", "#b91c1c", "#1e40af",
  "#059669", "#c09c2c", "#334155", "#9f1239", "#06b6d4",
  "#8ae600", "#2d3436",
];

const PAGE_W = 595, PAGE_H = 842; // A4

const DEFAULT_CHAPTERS: Chapter[] = [
  { title: "Finding Your Niche", body: "Zambia's economy is diverse and growing. Before starting a business, identify a market gap. Research local demand, competition, and consumer preferences. Focus on sectors with high growth potential such as agriculture, technology, tourism, and renewable energy.", pullQuote: "The best businesses solve real problems for real people." },
  { title: "Registering Your Business", body: "The Patents and Companies Registration Agency (PACRA) handles business registration in Zambia. Choose a business structure — sole proprietorship, partnership, or limited company. Gather the required documents including NRC copies, proof of address, and your proposed company name.", pullQuote: "A registered business builds trust with customers and investors." },
  { title: "Securing Funding", body: "Explore funding options available in Zambia. Consider commercial bank loans, microfinance institutions, angel investors, and government programmes like the Citizens Economic Empowerment Commission (CEEC). Prepare a solid business plan to attract investment.", pullQuote: "Smart financing is the fuel that powers your business engine." },
  { title: "Building Your Team", body: "Hire talented Zambians who share your vision. Invest in training and create a positive work culture. Understand Zambian labour laws, minimum wage requirements, and employee benefits. A strong team is your greatest competitive advantage.", pullQuote: "Great companies are built by great people." },
  { title: "Marketing Your Business", body: "Leverage both digital and traditional marketing. Use social media platforms popular in Zambia, local radio advertising, and community engagement. Build a strong brand identity that resonates with your target market.", pullQuote: "Your brand is your promise to your customer." },
];

/* ── Helpers ──────────────────────────────────────────────── */

function getTemplateFontStyle(t: EbookTemplate): "modern" | "classic" | "elegant" {
  if (t === "classic" || t === "academic") return "classic";
  if (t === "creative") return "elegant";
  return "modern";
}

/* ── Cover Page Renderer ─────────────────────────────────── */

function renderCoverPage(
  ctx: CanvasRenderingContext2D,
  cfg: EbookConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  m: number, cw: number,
  img: HTMLImageElement | null,
) {
  const { template, primaryColor, title, subtitle, authorName, edition } = cfg;

  // Full background fill
  if (template === "tech") {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.strokeStyle = hexToRgba(primaryColor, 0.15);
    ctx.lineWidth = 1;
    for (let i = 0; i < 15; i++) {
      const y = 80 + i * 52;
      ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(PAGE_W - m, y); ctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const x = m + i * (cw / 7);
      ctx.beginPath(); ctx.moveTo(x, 80); ctx.lineTo(x, PAGE_H - 80); ctx.stroke();
    }
    ctx.fillStyle = hexToRgba(primaryColor, 0.4);
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 5; j++) {
        ctx.beginPath(); ctx.arc(m + i * (cw / 7), 80 + j * 104, 3, 0, Math.PI * 2); ctx.fill();
      }
    }
  } else if (template === "creative") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = hexToRgba("#ffffff", 0.06);
    ctx.beginPath(); ctx.moveTo(0, PAGE_H * 0.4); ctx.lineTo(PAGE_W, 0); ctx.lineTo(PAGE_W, PAGE_H); ctx.lineTo(0, PAGE_H); ctx.closePath(); ctx.fill();
  } else if (template === "academic") {
    ctx.fillStyle = "#fffef8";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.strokeStyle = primaryColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(30, 30, PAGE_W - 60, PAGE_H - 60);
    ctx.lineWidth = 1;
    ctx.strokeRect(35, 35, PAGE_W - 70, PAGE_H - 70);
  } else if (template === "minimal") {
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, 6);
  } else if (template === "classic") {
    ctx.fillStyle = "#faf8f5";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, 80);
    drawProDivider(ctx, m, 85, cw, primaryColor, "ornate", 2);
  } else {
    const headerH = PAGE_H * 0.45;
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, headerH);
    ctx.fillStyle = hexToRgba("#ffffff", 0.03);
    for (let i = 0; i < 12; i++) {
      roundRect(ctx, m + (i % 4) * (cw / 4), 30 + Math.floor(i / 4) * 60, cw / 4 - 10, 50, 4);
      ctx.fill();
    }
  }

  if (img) {
    const imgY = template === "modern" ? 40 : template === "tech" ? 100 : PAGE_H * 0.15;
    const imgH = template === "tech" ? 200 : 220;
    ctx.save();
    ctx.globalAlpha = template === "tech" ? 0.3 : 0.25;
    const aspect = img.width / img.height;
    const drawW = cw;
    const drawH = drawW / aspect;
    ctx.drawImage(img, m, imgY, drawW, Math.min(drawH, imgH));
    ctx.restore();
  } else if (template !== "minimal" && template !== "academic") {
    drawImagePlaceholder(ctx, m, template === "modern" ? 60 : PAGE_H * 0.15, cw, 180, template === "tech" ? "#ffffff" : pal.textOnPrimary, "Cover Image", 8);
  }

  const textColor = (template === "tech" || template === "creative") ? "#ffffff" : (template === "modern" ? pal.textOnPrimary : pal.textDark);
  const titleY = template === "modern" ? PAGE_H * 0.5 : template === "tech" ? PAGE_H * 0.45 : template === "creative" ? PAGE_H * 0.48 : PAGE_H * 0.35;

  drawProText(ctx, title, PAGE_W / 2, titleY, {
    fontSize: template === "academic" ? 28 : 32,
    fontWeight: 800, fontStyle, color: textColor, align: "center", maxWidth: cw,
  });

  const subY = titleY + (template === "academic" ? 65 : 75);
  drawProDivider(ctx, PAGE_W / 2 - 40, subY - 15, 80, primaryColor === "#ffffff" ? pal.textDark : primaryColor, "gradient", 2);

  drawProText(ctx, subtitle, PAGE_W / 2, subY, {
    fontSize: 14, fontWeight: 400, fontStyle,
    color: template === "tech" || template === "creative" ? hexToRgba("#ffffff", 0.8) : pal.textMedium,
    align: "center", maxWidth: cw,
  });

  const authorY = template === "modern" ? PAGE_H * 0.78 : PAGE_H * 0.72;
  drawProText(ctx, authorName.toUpperCase(), PAGE_W / 2, authorY, {
    fontSize: 12, fontWeight: 600, fontStyle,
    color: template === "tech" || template === "creative" ? hexToRgba("#ffffff", 0.7) : pal.textMedium,
    align: "center", uppercase: true,
  });

  drawProText(ctx, edition, PAGE_W / 2, authorY + 22, {
    fontSize: 10, fontWeight: 400, fontStyle,
    color: template === "tech" || template === "creative" ? hexToRgba("#ffffff", 0.5) : pal.textLight,
    align: "center",
  });

  if (template === "modern") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.08);
    ctx.fillRect(0, PAGE_H - 50, PAGE_W, 50);
    drawProText(ctx, "DMSuite Publications", PAGE_W / 2, PAGE_H - 32, {
      fontSize: 9, fontWeight: 500, fontStyle, color: pal.textLight, align: "center",
    });
  }
}

/* ── Chapter Page Renderer ───────────────────────────────── */

function renderChapterPage(
  ctx: CanvasRenderingContext2D,
  cfg: EbookConfig,
  pal: ReturnType<typeof generateColorPalette>,
  fontStyle: "modern" | "classic" | "elegant",
  m: number, cw: number,
  chapter: Chapter,
  chapterIdx: number,
  pageNum: number,
  totalPgs: number,
) {
  const { template, primaryColor } = cfg;

  ctx.fillStyle = template === "classic" ? "#faf8f5" : template === "academic" ? "#fffef8" : "#ffffff";
  ctx.fillRect(0, 0, PAGE_W, PAGE_H);

  const headerH = 35;
  if (template === "modern" || template === "tech") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    ctx.fillRect(0, 0, PAGE_W, headerH);
    drawProText(ctx, cfg.title, m, 12, { fontSize: 8, fontWeight: 500, fontStyle, color: pal.textLight });
    drawProText(ctx, `Chapter ${chapterIdx + 1}`, PAGE_W - m, 12, { fontSize: 8, fontWeight: 500, fontStyle, color: pal.textLight, align: "right" });
    drawProDivider(ctx, 0, headerH, PAGE_W, hexToRgba(primaryColor, 0.15), "solid", 1);
  } else {
    drawProText(ctx, cfg.title, m, 18, { fontSize: 8, fontWeight: 400, fontStyle, color: pal.textLight });
    drawProDivider(ctx, m, 32, cw, pal.mediumGray, "solid", 0.5);
  }

  const contentTop = headerH + 25;
  const chapterNumY = contentTop;
  if (template === "creative") {
    ctx.fillStyle = hexToRgba(primaryColor, 0.08);
    ctx.font = getCanvasFont(900, 120, fontStyle);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText(String(chapterIdx + 1), m - 10, chapterNumY - 20);
  }

  drawProText(ctx, `CHAPTER ${chapterIdx + 1}`, m, chapterNumY, {
    fontSize: 10, fontWeight: 600, fontStyle, color: primaryColor, uppercase: true,
  });

  const titleY = chapterNumY + 25;
  drawProText(ctx, chapter.title, m, titleY, {
    fontSize: template === "academic" ? 22 : 26,
    fontWeight: 800, fontStyle, color: pal.textDark, maxWidth: cw,
  });

  const divY = titleY + 45;
  drawProDivider(ctx, m, divY, template === "minimal" ? 40 : 80, primaryColor, template === "classic" ? "ornate" : "solid", 2);

  const bodyY = divY + 20;
  ctx.font = getCanvasFont(400, 11, fontStyle);
  const bodyLines = wrapCanvasText(ctx, chapter.body, cw);
  const lineH = 18;
  let curY = bodyY;

  for (let i = 0; i < bodyLines.length; i++) {
    drawProText(ctx, bodyLines[i], m, curY, {
      fontSize: 11, fontWeight: 400, fontStyle, color: pal.textMedium, maxWidth: cw,
    });
    curY += lineH;
  }

  if (chapter.pullQuote) {
    const quoteY = curY + 30;
    const quoteBoxH = 80;

    ctx.fillStyle = hexToRgba(primaryColor, 0.04);
    roundRect(ctx, m, quoteY, cw, quoteBoxH, 6);
    ctx.fill();

    ctx.fillStyle = primaryColor;
    roundRect(ctx, m, quoteY, 4, quoteBoxH, 2);
    ctx.fill();

    ctx.fillStyle = hexToRgba(primaryColor, 0.15);
    ctx.font = getCanvasFont(800, 48, fontStyle);
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillText("\u201C", m + 16, quoteY + 4);

    drawProText(ctx, chapter.pullQuote, m + 20, quoteY + 22, {
      fontSize: 13, fontWeight: 500, fontStyle: "elegant", color: pal.textDark, maxWidth: cw - 40,
    });

    curY = quoteY + quoteBoxH;
  }

  if (chapter.body.length > 100) {
    const extY = curY + 25;
    drawProText(ctx, "Key Takeaways", m, extY, {
      fontSize: 14, fontWeight: 700, fontStyle, color: pal.textDark,
    });
    drawProDivider(ctx, m, extY + 20, 30, primaryColor, "solid", 1);

    const tips = [
      "Research your market thoroughly before committing resources",
      "Build relationships with local communities and stakeholders",
      "Stay informed about regulatory changes that affect your sector",
    ];
    tips.forEach((tip, i) => {
      ctx.fillStyle = primaryColor;
      ctx.beginPath(); ctx.arc(m + 6, extY + 38 + i * 24, 3, 0, Math.PI * 2); ctx.fill();

      drawProText(ctx, tip, m + 18, extY + 32 + i * 24, {
        fontSize: 10, fontWeight: 400, fontStyle, color: pal.textMedium, maxWidth: cw - 18,
      });
    });
  }

  const footerY = PAGE_H - 40;
  drawProDivider(ctx, m, footerY, cw, pal.mediumGray, "solid", 0.5);
  drawProText(ctx, String(pageNum), PAGE_W / 2, footerY + 10, {
    fontSize: 9, fontWeight: 500, fontStyle, color: pal.textLight, align: "center",
  });
  drawProText(ctx, `${pageNum} / ${totalPgs}`, PAGE_W - m, footerY + 10, {
    fontSize: 8, fontWeight: 400, fontStyle, color: pal.textLight, align: "right",
  });
}

/* ── Component ───────────────────────────────────────────── */

export default function EbookCreatorWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [coverImg, setCoverImg] = useState<HTMLImageElement | null>(null);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<EbookConfig>({
    template: "modern",
    primaryColor: "#1e3a5f",
    title: "10 Steps to Starting a Business in Zambia",
    subtitle: "A Practical Guide for Entrepreneurs",
    authorName: "Mwila Chanda",
    edition: "2nd Edition — 2026",
    coverImageUrl: "",
    chapters: DEFAULT_CHAPTERS,
    activePage: 0,
    description: "",
  });

  const updateConfig = useCallback((p: Partial<EbookConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const totalPages = 1 + config.chapters.length; // cover + chapters

  /* ── Load cover image ─────────────────────────────────────── */
  useEffect(() => {
    if (!config.coverImageUrl) { setCoverImg(null); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setCoverImg(img);
    img.onerror = () => setCoverImg(null);
    img.src = config.coverImageUrl;
  }, [config.coverImageUrl, advancedSettings]);

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
    const fontStyle = getTemplateFontStyle(template);
    const m = 50; // margin
    const cw = PAGE_W - m * 2;

    // White page base
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    if (activePage === 0) {
      renderCoverPage(ctx, config, pal, fontStyle, m, cw, coverImg);
    } else {
      const chapterIdx = activePage - 1;
      const chapter = config.chapters[chapterIdx];
      if (chapter) {
        renderChapterPage(ctx, config, pal, fontStyle, m, cw, chapter, chapterIdx, activePage, totalPages);
      }
    }
  }, [config, coverImg, totalPages]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  /* ── AI Generate ─────────────────────────────────────────── */

  const handleAIGenerate = useCallback(async () => {
    if (isGenerating || !config.description.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "system", content: "You are an eBook content writer. Return valid JSON only." },
            { role: "user", content: `Generate eBook content for: ${config.description}. Return JSON: {"title":"…","subtitle":"…","authorName":"…","edition":"…","chapters":[{"title":"…","body":"paragraph text…","pullQuote":"inspiring quote…"}]} with 5 chapters. Focus on Zambian context.` },
          ],
        }),
      });
      const data = await res.json();
      const text = cleanAIText(data.choices?.[0]?.message?.content || data.content || "");
      const parsed = JSON.parse(text);
      if (parsed.title) {
        updateConfig({
          title: parsed.title,
          subtitle: parsed.subtitle || config.subtitle,
          authorName: parsed.authorName || config.authorName,
          edition: parsed.edition || config.edition,
          chapters: (parsed.chapters || []).map((c: { title?: string; body?: string; pullQuote?: string }) => ({
            title: c.title || "Untitled Chapter",
            body: c.body || "",
            pullQuote: c.pullQuote || "",
          })),
        });
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, config.subtitle, config.authorName, config.edition, isGenerating, updateConfig]);

  /* ── Stock Image Handler ─────────────────────────────────── */

  const handleStockImageSelect = useCallback((img: StockImage) => {
    updateConfig({ coverImageUrl: img.urls.regular });
  }, [updateConfig]);

  /* ── Export ──────────────────────────────────────────────── */

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], `ebook-page-${config.activePage}`);
  }, [config.activePage]);

  /* ── Template Previews ──────────────────────────────────── */

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id,
    label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = t.id === "tech" ? "#0f172a" : t.id === "classic" ? "#faf8f5" : "#ffffff";
      ctx.fillRect(0, 0, w, h);
      const c = config.primaryColor;
      if (t.id === "modern") {
        ctx.fillStyle = c; ctx.fillRect(0, 0, w, h * 0.4);
      } else if (t.id === "creative") {
        ctx.fillStyle = c; ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = hexToRgba("#ffffff", 0.06);
        ctx.beginPath(); ctx.moveTo(0, h * 0.4); ctx.lineTo(w, 0); ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
      } else if (t.id === "tech") {
        ctx.strokeStyle = hexToRgba(c, 0.2); ctx.lineWidth = 0.5;
        for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(0, i * h / 5); ctx.lineTo(w, i * h / 5); ctx.stroke(); }
      } else if (t.id === "academic") {
        ctx.strokeStyle = c; ctx.lineWidth = 1; ctx.strokeRect(4, 4, w - 8, h - 8);
      }
      // Title placeholder
      ctx.fillStyle = hexToRgba(t.id === "tech" || t.id === "creative" ? "#ffffff" : c, 0.5);
      ctx.fillRect(w * 0.15, h * 0.5, w * 0.7, h * 0.04);
      ctx.fillRect(w * 0.25, h * 0.58, w * 0.5, h * 0.025);
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
          placeholder="Describe your eBook… e.g., 'A beginner's guide to farming in Zambia'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={3}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate eBook</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconFileText className="size-3.5" />} label="Book Details">
        <div className="space-y-2">
          {(["title", "subtitle", "authorName", "edition"] as const).map((f) => (
            <div key={f}>
              <label className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input
                type="text"
                value={config[f]}
                onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
              />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="chapters" icon={<IconLayout className="size-3.5" />} label={`Chapters (${config.chapters.length})`}>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {config.chapters.map((ch, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-gray-500">Ch. {i + 1}</span>
                <button onClick={() => updateConfig({ chapters: config.chapters.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-300 text-xs">×</button>
              </div>
              <input
                type="text" value={ch.title}
                onChange={(e) => { const u = [...config.chapters]; u[i] = { ...u[i], title: e.target.value }; updateConfig({ chapters: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white"
                placeholder="Chapter title"
              />
              <textarea
                value={ch.body}
                onChange={(e) => { const u = [...config.chapters]; u[i] = { ...u[i], body: e.target.value }; updateConfig({ chapters: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white resize-none"
                rows={2} placeholder="Body text"
              />
              <input
                type="text" value={ch.pullQuote}
                onChange={(e) => { const u = [...config.chapters]; u[i] = { ...u[i], pullQuote: e.target.value }; updateConfig({ chapters: u }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white"
                placeholder="Pull quote"
              />
            </div>
          ))}
          <button
            onClick={() => updateConfig({ chapters: [...config.chapters, { title: "New Chapter", body: "", pullQuote: "" }] })}
            className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors"
          >+ Add Chapter</button>
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
              <button key={c} onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <input type="color" value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })}
            className="w-full h-8 rounded-lg cursor-pointer" />
        </div>
      </AccordionSection>

      <AccordionSection id="pages" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => updateConfig({ activePage: 0 })}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${config.activePage === 0 ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
          >Cover</button>
          {config.chapters.map((_, i) => (
            <button key={i}
              onClick={() => updateConfig({ activePage: i + 1 })}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${config.activePage === i + 1 ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}
            >Ch. {i + 1}</button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[
            { id: "web-standard", label: "Web (PNG 2×)", desc: "150 DPI" },
            { id: "print-standard", label: "Print (300 DPI)", desc: "With crop marks" },
            { id: "print-ultra", label: "Ultra Print (600 DPI)", desc: "Maximum quality" },
          ].map((preset) => (
            <button key={preset.id} onClick={() => handleExport(preset.id)}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">
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
    <TemplateSlider
      templates={templatePreviews}
      activeId={config.template}
      onSelect={(id) => updateConfig({ template: id as EbookTemplate })}
      thumbWidth={120}
      thumbHeight={170}
    />
  );

  /* ── Toolbar ─────────────────────────────────────────────── */

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <button
        onClick={() => updateConfig({ activePage: Math.max(0, config.activePage - 1) })}
        disabled={config.activePage === 0}
        className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30"
      >‹ Prev</button>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        Page {config.activePage + 1} / {totalPages}
      </span>
      <button
        onClick={() => updateConfig({ activePage: Math.min(totalPages - 1, config.activePage + 1) })}
        disabled={config.activePage >= totalPages - 1}
        className="px-2 py-1 rounded text-xs bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 disabled:opacity-30"
      >Next ›</button>
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
      label={`eBook — ${config.activePage === 0 ? "Cover" : `Chapter ${config.activePage}`} — A4 (${PAGE_W}×${PAGE_H})`}
    />
  );
}
