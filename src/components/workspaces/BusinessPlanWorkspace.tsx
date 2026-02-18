"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconTarget, IconSparkles, IconWand, IconLoader, IconDownload,
  IconLayout, IconDroplet, IconImage, IconFileText, IconChart,
} from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import { drawProText, drawProDivider, drawHeaderArea, drawTable, drawImagePlaceholder, generateColorPalette, getTypographicScale, searchStockImages, exportHighRes, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import { StockImagePanel, type StockImage } from "@/hooks/useStockImages";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type BPTemplate = "professional" | "modern" | "investor" | "startup" | "corporate" | "minimal";
type BPPage = "cover" | "executive-summary" | "market-analysis" | "products" | "financials" | "team" | "roadmap";

interface BusinessPlanConfig {
  template: BPTemplate;
  primaryColor: string;
  companyName: string;
  tagline: string;
  preparedFor: string;
  preparedBy: string;
  date: string;
  executiveSummary: string;
  marketAnalysis: string;
  productsServices: string;
  revenueModel: string;
  activePage: number;
  description: string;
  heroImageUrl: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);

const TEMPLATES: { id: BPTemplate; name: string }[] = [
  { id: "professional", name: "Professional" },
  { id: "modern", name: "Modern" },
  { id: "investor", name: "Investor" },
  { id: "startup", name: "Startup" },
  { id: "corporate", name: "Corporate" },
  { id: "minimal", name: "Minimal" },
];

const PAGES: { id: BPPage; name: string }[] = [
  { id: "cover", name: "Cover" },
  { id: "executive-summary", name: "Executive Summary" },
  { id: "market-analysis", name: "Market Analysis" },
  { id: "products", name: "Products & Services" },
  { id: "financials", name: "Financial Projections" },
  { id: "team", name: "Team" },
  { id: "roadmap", name: "Roadmap" },
];

const PAGE_W = 595, PAGE_H = 842;

const COLOR_PRESETS = [
  "#1e3a5f", "#0f4c75", "#2d3436", "#1a1a2e", "#0d7377",
  "#6c5ce7", "#00b894", "#2d1b69", "#e17055", "#8ae600", "#06b6d4", "#3c1361",
];

/* ── Component ───────────────────────────────────────────── */

export default function BusinessPlanWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [heroImg, setHeroImg] = useState<HTMLImageElement | null>(null);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<BusinessPlanConfig>({
    template: "professional",
    primaryColor: "#1e3a5f",
    companyName: "VentureFlow Inc.",
    tagline: "Revolutionizing Digital Payments in Africa",
    preparedFor: "Seed Investors",
    preparedBy: "John Mwansa, CEO",
    date: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    executiveSummary: "VentureFlow is a fintech startup building the next generation of mobile payment infrastructure for Sub-Saharan Africa. Our platform enables seamless cross-border transactions, micro-lending, and merchant solutions. With $2.5M in pilot revenue and 150,000 active users, we are seeking $10M Series A to scale operations across 8 African markets.",
    marketAnalysis: "The African mobile payments market is projected to reach $40B by 2027, growing at 25% CAGR. Despite rapid mobile adoption (67% penetration), only 28% of adults have formal banking access, creating a massive underserved market. Key competitors include established players, but none offer our integrated cross-border + micro-lending solution.",
    productsServices: "1. CrossPay — instant cross-border transfers across 15 currencies\n2. MicroLend — AI-powered micro-lending for SMEs\n3. MerchantHub — POS integration and payment acceptance\n4. PayAPI — developer-first API for fintech integrations",
    revenueModel: "Transaction fees (1.2% avg), Subscription plans for merchants ($29-$199/mo), Interest on micro-loans (12-24% APR), API licensing fees",
    activePage: 0,
    description: "",
    heroImageUrl: "",
  });

  const [financials] = useState([
    { year: "Year 1", revenue: "$2.5M", costs: "$4.2M", profit: "-$1.7M" },
    { year: "Year 2", revenue: "$8.1M", costs: "$6.5M", profit: "$1.6M" },
    { year: "Year 3", revenue: "$22.4M", costs: "$14.8M", profit: "$7.6M" },
    { year: "Year 4", revenue: "$48.0M", costs: "$28.2M", profit: "$19.8M" },
    { year: "Year 5", revenue: "$95.0M", costs: "$52.0M", profit: "$43.0M" },
  ]);

  const [roadmap] = useState([
    { q: "Q1 2025", milestone: "Series A close, expand to Tanzania & Kenya" },
    { q: "Q2 2025", milestone: "Launch MicroLend product, 500K users" },
    { q: "Q3 2025", milestone: "PayAPI beta, 50 developer partners" },
    { q: "Q4 2025", milestone: "1M active users, break-even achieved" },
    { q: "Q1 2026", milestone: "Expand to 5 additional markets" },
    { q: "Q2 2026", milestone: "Launch MerchantHub 2.0, Series B prep" },
  ]);

  const updateConfig = useCallback((partial: Partial<BusinessPlanConfig>) => {
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

    const { primaryColor, activePage } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 40;
    const cw = PAGE_W - m * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    const page = PAGES[activePage]?.id || "cover";

    switch (page) {
      case "cover": {
        // Full cover page
        const headerH = PAGE_H * 0.6;
        drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, "gradient");

        if (heroImg) {
          ctx.save();
          ctx.globalAlpha = 0.2;
          drawImageCover(ctx, heroImg, 0, 0, PAGE_W, headerH);
          ctx.restore();
          const grad = ctx.createLinearGradient(0, 0, 0, headerH);
          grad.addColorStop(0, hexToRgba(primaryColor, 0.8));
          grad.addColorStop(1, primaryColor);
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, PAGE_W, headerH);
        }

        // Confidential badge
        ctx.fillStyle = hexToRgba("#ffffff", 0.1);
        roundRect(ctx, m, m, 100, 22, 11);
        ctx.fill();
        ctx.fillStyle = hexToRgba("#ffffff", 0.6);
        ctx.font = getCanvasFont(600, 8, "modern");
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText("CONFIDENTIAL", m + 14, m + 11);

        // Title
        drawProText(ctx, "BUSINESS PLAN", m, headerH * 0.3, {
          fontSize: typo.label + 2, fontWeight: 700, color: hexToRgba("#ffffff", 0.5), uppercase: true,
        });
        drawProText(ctx, config.companyName, m, headerH * 0.38, {
          fontSize: typo.display + 4, fontWeight: 900, color: "#ffffff", maxWidth: cw, shadow: true,
        });
        drawProDivider(ctx, m, headerH * 0.56, 60, "#ffffff", "solid", 3);
        drawProText(ctx, config.tagline, m, headerH * 0.62, {
          fontSize: typo.h3, fontWeight: 400, color: hexToRgba("#ffffff", 0.8), maxWidth: cw,
        });

        // Below the header
        const infoY = headerH + 50;
        const items = [
          { label: "Prepared For", value: config.preparedFor },
          { label: "Prepared By", value: config.preparedBy },
          { label: "Date", value: config.date },
        ];
        items.forEach((item, i) => {
          drawProText(ctx, item.label.toUpperCase(), m, infoY + i * 45, {
            fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
          });
          drawProText(ctx, item.value, m, infoY + i * 45 + 16, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          });
        });

        // Footer
        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 8, PAGE_W, 8);
        break;
      }

      case "executive-summary": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Executive Summary", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        drawProText(ctx, config.executiveSummary, m, 110, {
          fontSize: typo.body + 1, fontWeight: 400, color: pal.textDark, maxWidth: cw, fontStyle: "modern",
        });

        // Key highlights box
        const boxY = 320;
        ctx.fillStyle = hexToRgba(primaryColor, 0.05);
        roundRect(ctx, m, boxY, cw, 200, 12);
        ctx.fill();
        ctx.fillStyle = primaryColor;
        ctx.fillRect(m, boxY, 4, 200);

        drawProText(ctx, "KEY HIGHLIGHTS", m + 20, boxY + 20, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });

        const highlights = [
          "$2.5M pilot revenue achieved",
          "150,000+ active users",
          "25% MoM growth rate",
          "15 currency support",
          "$10M Series A target",
        ];
        highlights.forEach((h, i) => {
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 30, boxY + 52 + i * 28, 4, 0, Math.PI * 2);
          ctx.fill();
          drawProText(ctx, h, m + 44, boxY + 45 + i * 28, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }

      case "market-analysis": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Market Analysis", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        drawProText(ctx, config.marketAnalysis, m, 110, {
          fontSize: typo.body, fontWeight: 400, color: pal.textDark, maxWidth: cw,
        });

        // Market size chart (visual bar chart)
        const chartY = 300;
        drawProText(ctx, "MARKET SIZE PROJECTION", m, chartY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, chartY + 18, cw, pal.lightGray, "solid");

        const bars = [
          { year: "2024", value: 18, label: "$18B" },
          { year: "2025", value: 24, label: "$24B" },
          { year: "2026", value: 30, label: "$30B" },
          { year: "2027", value: 40, label: "$40B" },
        ];
        const barW = (cw - 60) / bars.length;
        const maxH = 180;
        bars.forEach((bar, i) => {
          const bx = m + 10 + i * (barW + 15);
          const bh = (bar.value / 40) * maxH;
          const by = chartY + 40 + (maxH - bh);

          const grad = ctx.createLinearGradient(bx, by, bx, by + bh);
          grad.addColorStop(0, primaryColor);
          grad.addColorStop(1, hexToRgba(primaryColor, 0.5));
          ctx.fillStyle = grad;
          roundRect(ctx, bx, by, barW, bh, 4);
          ctx.fill();

          drawProText(ctx, bar.label, bx + barW / 2, by - 14, {
            fontSize: typo.caption, fontWeight: 700, color: primaryColor, align: "center",
          });
          drawProText(ctx, bar.year, bx + barW / 2, chartY + 40 + maxH + 8, {
            fontSize: typo.caption, fontWeight: 500, color: pal.textMedium, align: "center",
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }

      case "products": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Products & Services", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        const products = config.productsServices.split("\n").filter(Boolean);
        products.forEach((prod, i) => {
          const py = 110 + i * 140;
          const cleanProd = prod.replace(/^\d+\.\s*/, "");
          const [name, ...descParts] = cleanProd.split("—").map((s) => s.trim());
          const desc = descParts.join("—") || "";

          // Product card
          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, m, py, cw, 120, 12);
          ctx.fill();

          // Number badge
          ctx.fillStyle = primaryColor;
          roundRect(ctx, m + 16, py + 16, 36, 36, 8);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.font = getCanvasFont(800, 16, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(String(i + 1), m + 34, py + 34);

          drawProText(ctx, name, m + 68, py + 20, {
            fontSize: typo.h3, fontWeight: 700, color: pal.textDark, maxWidth: cw - 100,
          });
          if (desc) {
            drawProText(ctx, desc, m + 68, py + 48, {
              fontSize: typo.body, fontWeight: 400, color: pal.textMedium, maxWidth: cw - 100,
            });
          }
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }

      case "financials": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Financial Projections", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        drawTable(ctx, m, 110,
          [
            { label: "Period", width: cw * 0.2, align: "left" },
            { label: "Revenue", width: cw * 0.25, align: "right" },
            { label: "Costs", width: cw * 0.25, align: "right" },
            { label: "Net Profit", width: cw * 0.3, align: "right" },
          ],
          financials.map((f) => [f.year, f.revenue, f.costs, f.profit]),
          { primaryColor, fontSize: 11, rowHeight: 28, zebraStripe: true, borderColor: pal.lightGray }
        );

        // Revenue model
        const rmY = 340;
        drawProText(ctx, "REVENUE MODEL", m, rmY, {
          fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true,
        });
        drawProDivider(ctx, m, rmY + 18, 40, primaryColor, "solid", 2);

        const streams = config.revenueModel.split(",").map((s) => s.trim());
        streams.forEach((stream, i) => {
          const sy = rmY + 35 + i * 38;
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 8, sy + 7, 4, 0, Math.PI * 2);
          ctx.fill();
          drawProText(ctx, stream, m + 22, sy, {
            fontSize: typo.body, fontWeight: 500, color: pal.textDark, maxWidth: cw - 30,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }

      case "roadmap": {
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Roadmap & Milestones", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        // Timeline
        const tlX = m + 50;
        const tlStartY = 120;
        ctx.fillStyle = hexToRgba(primaryColor, 0.15);
        ctx.fillRect(m + 48, tlStartY, 3, roadmap.length * 90);

        roadmap.forEach((item, i) => {
          const iy = tlStartY + i * 90;

          // Dot
          ctx.fillStyle = primaryColor;
          ctx.beginPath();
          ctx.arc(m + 49.5, iy + 8, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(m + 49.5, iy + 8, 4, 0, Math.PI * 2);
          ctx.fill();

          // Quarter label
          drawProText(ctx, item.q, tlX + 24, iy, {
            fontSize: typo.body + 1, fontWeight: 700, color: primaryColor,
          });

          // Milestone
          drawProText(ctx, item.milestone, tlX + 24, iy + 22, {
            fontSize: typo.body, fontWeight: 400, color: pal.textMedium, maxWidth: cw - 100,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }

      default: {
        // Team page
        drawHeaderArea(ctx, 0, 0, PAGE_W, 80, primaryColor, "gradient");
        drawProText(ctx, "Leadership Team", m, 30, { fontSize: typo.h1, fontWeight: 800, color: "#ffffff" });

        const teamMembers = [
          { name: "John Mwansa", title: "CEO & Founder", bio: "15+ years in fintech" },
          { name: "Grace Banda", title: "CTO", bio: "Ex-Google engineer" },
          { name: "David Tembo", title: "CFO", bio: "Former investment banker" },
          { name: "Sarah Phiri", title: "COO", bio: "Operations specialist" },
        ];

        const cardW = (cw - 20) / 2;
        const cardH = 160;
        teamMembers.forEach((member, i) => {
          const col = i % 2;
          const row = Math.floor(i / 2);
          const cx = m + col * (cardW + 20);
          const cy = 110 + row * (cardH + 20);

          ctx.fillStyle = pal.offWhite;
          roundRect(ctx, cx, cy, cardW, cardH, 12);
          ctx.fill();

          // Avatar
          ctx.fillStyle = pal.primaryMuted;
          ctx.beginPath();
          ctx.arc(cx + 40, cy + 45, 28, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = primaryColor;
          ctx.font = getCanvasFont(700, 16, "modern");
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(member.name.split(" ").map((n) => n[0]).join(""), cx + 40, cy + 45);

          drawProText(ctx, member.name, cx + 80, cy + 25, {
            fontSize: typo.body + 1, fontWeight: 700, color: pal.textDark,
          });
          drawProText(ctx, member.title, cx + 80, cy + 46, {
            fontSize: typo.caption, fontWeight: 600, color: primaryColor,
          });
          drawProText(ctx, member.bio, cx + 80, cy + 66, {
            fontSize: typo.caption, fontWeight: 400, color: pal.textMedium,
          });
        });

        ctx.fillStyle = primaryColor;
        ctx.fillRect(0, PAGE_H - 4, PAGE_W, 4);
        break;
      }
    }

    // Page number
    ctx.fillStyle = pal.textLight;
    ctx.font = getCanvasFont(500, 9, "modern");
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText(`${activePage + 1} / ${PAGES.length}`, PAGE_W / 2, PAGE_H - 14);
  }, [config, heroImg, financials, roadmap, advancedSettings]);

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
            content: `Generate a professional business plan for: "${config.description}".
Return JSON: { "companyName": "", "tagline": "", "executiveSummary": "3-4 sentences", "marketAnalysis": "3-4 sentences about market size and opportunity", "productsServices": "numbered list with name — description format", "revenueModel": "comma-separated revenue streams", "heroImageQuery": "search term for cover image" }`,
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
          companyName: data.companyName || config.companyName,
          tagline: data.tagline || config.tagline,
          executiveSummary: data.executiveSummary || config.executiveSummary,
          marketAnalysis: data.marketAnalysis || config.marketAnalysis,
          productsServices: data.productsServices || config.productsServices,
          revenueModel: data.revenueModel || config.revenueModel,
        });
        if (data.heroImageQuery) {
          const imgs = await searchStockImages(data.heroImageQuery, { perPage: 1 });
          if (imgs.length > 0) {
            try {
              const img = await loadImage(imgs[0].urls.regular);
              setHeroImg(img);
            } catch { /* skip */ }
          }
        }
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config, isGenerating, updateConfig]);

  const handleStockImageSelect = useCallback(async (img: StockImage) => {
    try {
      const loaded = await loadImage(img.urls.regular);
      setHeroImg(loaded);
    } catch { /* skip */ }
  }, []);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], `business-plan-${PAGES[config.activePage]?.id || "page"}`);
  }, [config.activePage]);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawDocumentThumbnail(ctx, w, h, { primaryColor: config.primaryColor, headerStyle: "bar", showSections: 3 });
    },
  }));

  const displayW = 380;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea
          value={config.description}
          onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe your business idea… e.g., 'A mobile payments platform for African markets'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
          rows={4}
        />
        <button
          onClick={handleAIGenerate}
          disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors"
        >
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Plan</>}
        </button>
      </AccordionSection>

      <AccordionSection id="details" icon={<IconTarget className="size-3.5" />} label="Plan Details">
        <div className="space-y-2">
          {(["companyName", "tagline", "preparedFor", "preparedBy", "date"] as const).map((field) => (
            <div key={field}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{field.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[field]}
                onChange={(e) => updateConfig({ [field]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="content" icon={<IconFileText className="size-3.5" />} label="Content">
        <div className="space-y-2">
          {([
            { key: "executiveSummary" as const, label: "Executive Summary", rows: 4 },
            { key: "marketAnalysis" as const, label: "Market Analysis", rows: 3 },
            { key: "productsServices" as const, label: "Products & Services", rows: 4 },
            { key: "revenueModel" as const, label: "Revenue Model", rows: 2 },
          ]).map(({ key, label, rows }) => (
            <div key={key}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{label}</label>
              <textarea value={config[key]}
                onChange={(e) => updateConfig({ [key]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500"
                rows={rows} />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Images">
        <StockImagePanel onSelect={handleStockImageSelect} />
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (
              <button key={c} onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                style={{ backgroundColor: c }} />
            ))}
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

  const toolbar = (
    <div className="flex items-center gap-1 flex-wrap">
      {PAGES.map((p, i) => (
        <button key={p.id} onClick={() => updateConfig({ activePage: i })}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${config.activePage === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-700"}`}>
          {p.name}
        </button>
      ))}
    </div>
  );

  const rightPanel = (
    <TemplateSlider templates={templatePreviews} activeId={config.template}
      onSelect={(id) => updateConfig({ template: id as BPTemplate })} thumbWidth={120} thumbHeight={170} />
  );

  return (
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={displayW} displayHeight={displayH}
      leftPanel={leftPanel} rightPanel={rightPanel} toolbar={toolbar}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Business Plan — A4 — Page ${config.activePage + 1}/${PAGES.length}`} />
  );
}
