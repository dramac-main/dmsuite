"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconImage, IconLayout, IconType } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, getTypographicScale, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type NLTemplate = "corporate" | "creative" | "minimal" | "community" | "elegant" | "bold";

interface Article {
  title: string;
  body: string;
  hasImage: boolean;
}

interface NLConfig {
  template: NLTemplate;
  primaryColor: string;
  accentColor: string;
  companyName: string;
  tagline: string;
  issueNumber: string;
  issueDate: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl: string;
  articles: Article[];
  footerText: string;
  description: string;
}

const TEMPLATES: { id: NLTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" }, { id: "creative", name: "Creative" },
  { id: "minimal", name: "Minimal" }, { id: "community", name: "Community" },
  { id: "elegant", name: "Elegant" }, { id: "bold", name: "Bold" },
];
const COLOR_PRESETS = ["#1e3a5f", "#2d3436", "#0f4c75", "#3c1361", "#0d7377", "#6c5ce7", "#e74c3c", "#8ae600", "#06b6d4"];

/* ── Component ───────────────────────────────────────────── */

export default function NewsletterPrintWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [currentPage, setCurrentPage] = useState(0);

  const [config, setConfig] = useState<NLConfig>({
    template: "corporate", primaryColor: "#1e3a5f", accentColor: "#06b6d4",
    companyName: "Lusaka Business Weekly", tagline: "Your Weekly Business Pulse",
    issueNumber: "Vol. 12 / Issue 48", issueDate: "December 2025",
    heroTitle: "New Tech Hub Opens in Lusaka",
    heroSubtitle: "A state-of-the-art innovation center set to transform Zambia's digital landscape",
    heroImageUrl: "",
    articles: [
      { title: "Agriculture Sector Sees Record Growth", body: "The agriculture sector in Zambia has recorded unprecedented growth in Q4 2025, driven by increased investment in sustainable farming practices and modern irrigation systems.", hasImage: false },
      { title: "SME Funding Programme Launched", body: "The Ministry of Commerce has launched a new ZMW 500 million fund to support small and medium enterprises across all provinces, focusing on youth-led businesses and women entrepreneurs.", hasImage: true },
      { title: "Infrastructure Update: Link Zambia 8000", body: "Progress on the Link Zambia 8000 road project continues with over 2,500 km completed. The project is expected to significantly reduce transport costs for businesses.", hasImage: false },
    ],
    footerText: "Subscribe at www.lusakabiz.co.zm | Call +260 211 555 123", description: "",
  });

  const updateConfig = useCallback((p: Partial<NLConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;
  const PAGES = 2;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, accentColor, template } = config;
    const m = 35;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    if (currentPage === 0) {
      // ─── PAGE 1: Cover ───
      // Masthead
      const mastheadH = template === "bold" ? 55 : 45;
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, mastheadH);

      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(800, template === "bold" ? 22 : 18, "modern");
      ctx.textAlign = "center";
      ctx.fillText(config.companyName.toUpperCase(), PAGE_W / 2, mastheadH * 0.5 + 3);

      // Info bar
      ctx.fillStyle = hexToRgba(primaryColor, 0.08);
      ctx.fillRect(0, mastheadH, PAGE_W, 22);
      ctx.fillStyle = hexToRgba(primaryColor, 0.6);
      ctx.font = getCanvasFont(400, 8, "modern");
      ctx.textAlign = "left";
      ctx.fillText(config.issueNumber, m, mastheadH + 14);
      ctx.textAlign = "right";
      ctx.fillText(config.issueDate, PAGE_W - m, mastheadH + 14);
      ctx.textAlign = "center";
      ctx.fillText(config.tagline, PAGE_W / 2, mastheadH + 14);

      // Hero area
      let heroY = mastheadH + 30;
      const heroH = 180;

      if (config.heroImageUrl) {
        drawImagePlaceholder(ctx, m, heroY, PAGE_W - 2 * m, heroH, "Hero Image");
      } else {
        ctx.fillStyle = hexToRgba(primaryColor, 0.06);
        roundRect(ctx, m, heroY, PAGE_W - 2 * m, heroH, 6);
        ctx.fill();

        // Decorative pattern
        ctx.fillStyle = hexToRgba(accentColor, 0.08);
        for (let i = 0; i < 20; i++) {
          ctx.beginPath();
          ctx.arc(m + Math.random() * (PAGE_W - 2 * m), heroY + Math.random() * heroH, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Hero title overlay
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(800, 22, "modern");
      ctx.textAlign = "left";
      const titleLines = wrapCanvasText(ctx, config.heroTitle, PAGE_W - 2 * m - 20);
      titleLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, m + 10, heroY + 50 + i * 28));

      ctx.fillStyle = hexToRgba(primaryColor, 0.6);
      ctx.font = getCanvasFont(400, 10, "modern");
      const subLines = wrapCanvasText(ctx, config.heroSubtitle, PAGE_W - 2 * m - 20);
      subLines.slice(0, 2).forEach((l, i) => ctx.fillText(l, m + 10, heroY + 50 + titleLines.length * 28 + 8 + i * 14));

      // First article
      let artY = heroY + heroH + 20;
      drawProDivider(ctx, m, artY, PAGE_W - 2 * m, accentColor, "gradient", 1.5);
      artY += 12;

      if (config.articles[0]) {
        const art = config.articles[0];
        ctx.fillStyle = primaryColor;
        ctx.font = getCanvasFont(700, 14, "modern");
        ctx.textAlign = "left";
        ctx.fillText(art.title, m, artY + 16);

        ctx.fillStyle = "#444";
        ctx.font = getCanvasFont(400, 9, "modern");
        const bodyLines = wrapCanvasText(ctx, art.body, PAGE_W - 2 * m);
        bodyLines.slice(0, 8).forEach((l, i) => ctx.fillText(l, m, artY + 34 + i * 14));
        artY += 34 + Math.min(bodyLines.length, 8) * 14 + 15;
      }

      // Second article (two column if there's space)
      if (config.articles[1]) {
        drawProDivider(ctx, m, artY, PAGE_W - 2 * m, hexToRgba(primaryColor, 0.2), "solid", 0.5);
        artY += 12;
        const art = config.articles[1];
        const colW = art.hasImage ? (PAGE_W - 2 * m - 15) * 0.6 : PAGE_W - 2 * m;

        ctx.fillStyle = primaryColor;
        ctx.font = getCanvasFont(700, 12, "modern");
        ctx.fillText(art.title, m, artY + 14);

        ctx.fillStyle = "#444";
        ctx.font = getCanvasFont(400, 9, "modern");
        const bodyLines2 = wrapCanvasText(ctx, art.body, colW);
        bodyLines2.slice(0, 6).forEach((l, i) => ctx.fillText(l, m, artY + 30 + i * 14));

        if (art.hasImage) {
          const imgX = m + colW + 15;
          const imgW = (PAGE_W - 2 * m - 15) * 0.4;
          drawImagePlaceholder(ctx, imgX, artY, imgW, 80, "");
        }
      }

      // Footer bar
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 28, PAGE_W, 28);
      ctx.fillStyle = hexToRgba("#ffffff", 0.7);
      ctx.font = getCanvasFont(400, 7, "modern");
      ctx.textAlign = "center";
      ctx.fillText(config.footerText, PAGE_W / 2, PAGE_H - 12);

    } else {
      // ─── PAGE 2: Continuation ───
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, 28);
      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(600, 10, "modern");
      ctx.textAlign = "center";
      ctx.fillText(`${config.companyName} — ${config.issueDate} — Page 2`, PAGE_W / 2, 18);

      let y = 50;
      config.articles.slice(2).forEach((art) => {
        ctx.fillStyle = primaryColor;
        ctx.font = getCanvasFont(700, 14, "modern");
        ctx.textAlign = "left";
        ctx.fillText(art.title, m, y);

        drawProDivider(ctx, m, y + 6, 60, accentColor, "gradient", 2);
        y += 22;

        ctx.fillStyle = "#444";
        ctx.font = getCanvasFont(400, 9, "modern");
        const bodyLines = wrapCanvasText(ctx, art.body, PAGE_W - 2 * m);
        bodyLines.slice(0, 10).forEach((l, i) => ctx.fillText(l, m, y + i * 14));
        y += Math.min(bodyLines.length, 10) * 14 + 25;
      });

      // Footer
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 28, PAGE_W, 28);
      ctx.fillStyle = hexToRgba("#ffffff", 0.7);
      ctx.font = getCanvasFont(400, 7, "modern");
      ctx.textAlign = "center";
      ctx.fillText(config.footerText, PAGE_W / 2, PAGE_H - 12);
    }
  }, [config, currentPage, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate newsletter content for: "${config.description}". Return JSON: { "companyName": "", "tagline": "", "heroTitle": "", "heroSubtitle": "", "articles": [{ "title": "", "body": "", "hasImage": false }] }. Include 3-4 articles with substantial body text (3-4 sentences each).` }] }),
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
    // Try to fetch hero image
    try {
      const imgRes = await fetch(`/api/images?q=${encodeURIComponent(config.heroTitle || "newsletter")}&per_page=1`);
      const imgData = await imgRes.json();
      if (imgData.results?.[0]?.urls?.regular) updateConfig({ heroImageUrl: imgData.results[0].urls.regular });
    } catch { /* skip */ }
  }, [config.description, config.heroTitle, isGenerating, updateConfig]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "newsletter");
  }, []);

  const addArticle = useCallback(() => {
    updateConfig({ articles: [...config.articles, { title: "New Article", body: "Article content goes here...", hasImage: false }] });
  }, [config.articles, updateConfig]);

  const updateArticle = useCallback((i: number, field: keyof Article, value: string | boolean) => {
    const updated = [...config.articles];
    updated[i] = { ...updated[i], [field]: value };
    updateConfig({ articles: updated });
  }, [config.articles, updateConfig]);

  const removeArticle = useCallback((i: number) => {
    updateConfig({ articles: config.articles.filter((_, idx) => idx !== i) });
  }, [config.articles, updateConfig]);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(0, 0, w, h * 0.1);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.08);
      ctx.fillRect(w * 0.06, h * 0.16, w * 0.88, h * 0.3);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.15);
      for (let i = 0; i < 4; i++) { ctx.fillRect(w * 0.06, h * 0.52 + i * h * 0.08, w * 0.88, h * 0.04); }
    },
  }));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the newsletter… e.g., 'Monthly tech industry newsletter for Zambian entrepreneurs'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="header" icon={<IconLayout className="size-3.5" />} label="Masthead">
        <div className="space-y-2">
          {(["companyName", "tagline", "issueNumber", "issueDate"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="hero" icon={<IconImage className="size-3.5" />} label="Hero Story">
        <div className="space-y-2">
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Title</label>
            <input type="text" value={config.heroTitle} onChange={(e) => updateConfig({ heroTitle: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Subtitle</label>
            <textarea value={config.heroSubtitle} onChange={(e) => updateConfig({ heroSubtitle: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={2} /></div>
          <StockImagePanel onSelect={(img) => updateConfig({ heroImageUrl: img.urls.regular })} />
        </div>
      </AccordionSection>

      <AccordionSection id="articles" icon={<IconFileText className="size-3.5" />} label={`Articles (${config.articles.length})`}>
        <div className="space-y-2 max-h-56 overflow-y-auto">
          {config.articles.map((a, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-semibold text-gray-500">Article {i + 1}</span>
                <button onClick={() => removeArticle(i)} className="text-red-400 hover:text-red-300 text-xs">×</button>
              </div>
              <input type="text" value={a.title} onChange={(e) => updateArticle(i, "title", e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" />
              <textarea value={a.body} onChange={(e) => updateArticle(i, "body", e.target.value)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white resize-none" rows={2} />
            </div>
          ))}
          <button onClick={addArticle} className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors">+ Add Article</button>
        </div>
      </AccordionSection>

      <AccordionSection id="page" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex gap-1.5">
          {Array.from({ length: PAGES }).map((_, i) => (
            <button key={i} onClick={() => setCurrentPage(i)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${currentPage === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>Page {i + 1}</button>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="space-y-2">
          <label className="text-[10px] font-semibold text-gray-500 uppercase">Color</label>
          <div className="flex flex-wrap gap-1.5">
            {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ primaryColor: c })}
              className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
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
    </Accordion>
  );

  return (
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={340} displayHeight={480}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as NLTemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Newsletter — Page ${currentPage + 1}/${PAGES} — A4 (595×842)`} />
  );
}
