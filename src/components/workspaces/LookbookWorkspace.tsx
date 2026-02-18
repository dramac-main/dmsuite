"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconImage, IconLayout, IconType } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawHeaderArea, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type LBTemplate = "editorial" | "fashion" | "minimal" | "grid" | "luxury" | "urban";

interface LookbookPage {
  title: string;
  description: string;
  imageUrl: string;
  price: string;
  itemCode: string;
}

interface LBConfig {
  template: LBTemplate;
  primaryColor: string;
  brandName: string;
  collection: string;
  season: string;
  tagline: string;
  pages: LookbookPage[];
  currentPage: number;
  description: string;
}

const TEMPLATES: { id: LBTemplate; name: string }[] = [
  { id: "editorial", name: "Editorial" }, { id: "fashion", name: "Fashion" },
  { id: "minimal", name: "Minimal" }, { id: "grid", name: "Grid" },
  { id: "luxury", name: "Luxury" }, { id: "urban", name: "Urban" },
];

const COLOR_PRESETS = ["#1a1a2e", "#2d3436", "#1e3a5f", "#3c1361", "#0d7377", "#6c5ce7", "#c5a355", "#e74c3c", "#8ae600"];

const defaultPages: LookbookPage[] = [
  { title: "Heritage Collection", description: "Handcrafted leather goods inspired by traditional Zambian craftsmanship. Each piece tells a story of heritage and modern elegance.", imageUrl: "", price: "ZMW 1,200", itemCode: "HC-001" },
  { title: "Urban Edge Series", description: "Contemporary streetwear meets African print. Bold patterns and sustainable fabrics for the modern trendsetter.", imageUrl: "", price: "ZMW 850", itemCode: "UE-015" },
  { title: "Executive Line", description: "Tailored suits and professional attire crafted from premium African cotton. Designed for the boardroom and beyond.", imageUrl: "", price: "ZMW 3,500", itemCode: "EX-042" },
  { title: "Weekend Luxe", description: "Relaxed-fit pieces in natural fabrics. Perfect for Zambian weekends — from brunch in Lusaka to sunset at Lake Kariba.", imageUrl: "", price: "ZMW 650", itemCode: "WL-028" },
];

/* ── Component ───────────────────────────────────────────── */

export default function LookbookWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<LBConfig>({
    template: "editorial", primaryColor: "#1a1a2e",
    brandName: "MALAIKA", collection: "Spring/Summer 2026",
    season: "SS26", tagline: "Modern African Elegance",
    pages: defaultPages, currentPage: 0, description: "",
  });

  const updateConfig = useCallback((p: Partial<LBConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template, currentPage, pages } = config;
    const m = 30;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    if (currentPage === 0) {
      // ─── COVER ───
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, PAGE_H);

      // Large image area
      const imgH = PAGE_H * 0.6;
      drawImagePlaceholder(ctx, 0, 0, PAGE_W, imgH, "Cover Photo");

      // Gradient overlay from bottom
      const grad = ctx.createLinearGradient(0, imgH - 100, 0, imgH);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(1, primaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, imgH - 100, PAGE_W, 100);

      // Brand name
      ctx.fillStyle = "#ffffff";
      ctx.font = getCanvasFont(100, 48, "modern");
      ctx.textAlign = "center";
      ctx.letterSpacing = "12px";
      ctx.fillText(config.brandName, PAGE_W / 2, imgH + 60);
      ctx.letterSpacing = "0px";

      // Collection
      ctx.fillStyle = hexToRgba("#ffffff", 0.5);
      ctx.font = getCanvasFont(300, 14, "modern");
      ctx.fillText(config.collection, PAGE_W / 2, imgH + 90);

      // Tagline
      ctx.fillStyle = hexToRgba("#ffffff", 0.3);
      ctx.font = getCanvasFont(400, 10, "modern");
      ctx.fillText(config.tagline, PAGE_W / 2, imgH + 115);

      // Decorative line
      ctx.fillStyle = hexToRgba("#ffffff", 0.2);
      ctx.fillRect(PAGE_W / 2 - 40, imgH + 130, 80, 1);

      // Season badge
      ctx.fillStyle = hexToRgba("#ffffff", 0.1);
      ctx.font = getCanvasFont(400, 9, "modern");
      ctx.fillText(config.season, PAGE_W / 2, PAGE_H - 40);

    } else {
      // ─── PRODUCT PAGES ───
      const pageIdx = currentPage - 1;
      const page = pages[pageIdx];
      if (!page) return;

      // Top brand bar
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, PAGE_W, 25);
      ctx.fillStyle = hexToRgba("#ffffff", 0.6);
      ctx.font = getCanvasFont(600, 7, "modern");
      ctx.textAlign = "left";
      ctx.fillText(config.brandName, m, 16);
      ctx.textAlign = "right";
      ctx.fillText(`${config.collection} — ${pageIdx + 1}/${pages.length}`, PAGE_W - m, 16);

      // Product image (takes up top portion)
      const imgTop = 25;
      const imgH = template === "fashion" ? PAGE_H * 0.65 : PAGE_H * 0.55;
      drawImagePlaceholder(ctx, 0, imgTop, PAGE_W, imgH, page.title);

      // Content area
      let y = imgTop + imgH + 25;

      // Product title
      ctx.textAlign = "left";
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(700, 22, template === "luxury" ? "elegant" : "modern");
      ctx.fillText(page.title, m, y);

      // Item code
      ctx.fillStyle = hexToRgba(primaryColor, 0.4);
      ctx.font = getCanvasFont(400, 8, "modern");
      ctx.textAlign = "right";
      ctx.fillText(page.itemCode, PAGE_W - m, y);

      y += 18;
      drawProDivider(ctx, m, y, PAGE_W - 2 * m, primaryColor, "gradient", 1);
      y += 18;

      // Description
      ctx.textAlign = "left";
      ctx.fillStyle = "#555";
      ctx.font = getCanvasFont(400, 10, template === "luxury" ? "elegant" : "modern");
      const descLines = wrapCanvasText(ctx, page.description, PAGE_W - 2 * m);
      descLines.forEach((l, i) => ctx.fillText(l, m, y + i * 16));
      y += descLines.length * 16 + 20;

      // Price
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(300, 24, "modern");
      ctx.fillText(page.price, m, y);

      // Bottom bar
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, PAGE_H - 20, PAGE_W, 20);
      ctx.fillStyle = hexToRgba("#ffffff", 0.5);
      ctx.font = getCanvasFont(400, 6, "modern");
      ctx.textAlign = "center";
      ctx.fillText(`${config.brandName} — ${config.tagline}`, PAGE_W / 2, PAGE_H - 8);
    }
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate lookbook content for: "${config.description}". Return JSON: { "brandName": "", "collection": "", "tagline": "", "pages": [{ "title": "", "description": "", "price": "", "itemCode": "" }] }. Include 4-6 product pages with evocative descriptions.` }] }),
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
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "lookbook");
  }, []);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = config.primaryColor; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = hexToRgba("#ffffff", 0.1); ctx.fillRect(0, 0, w, h * 0.6);
      ctx.fillStyle = "#ffffff"; ctx.font = `bold ${w * 0.12}px sans-serif`;
      ctx.textAlign = "center"; ctx.fillText(config.brandName.substring(0, 6), w / 2, h * 0.78);
    },
  }));

  const totalPages = 1 + config.pages.length;

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the brand/collection… e.g., 'African luxury fashion brand, spring collection'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="brand" icon={<IconType className="size-3.5" />} label="Brand">
        <div className="space-y-2">
          {(["brandName", "collection", "season", "tagline"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="products" icon={<IconFileText className="size-3.5" />} label={`Products (${config.pages.length})`}>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {config.pages.map((p, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <input type="text" value={p.title} onChange={(e) => { const pages = [...config.pages]; pages[i] = { ...pages[i], title: e.target.value }; updateConfig({ pages }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] font-medium text-gray-900 dark:text-white" placeholder="Title" />
              <textarea value={p.description} onChange={(e) => { const pages = [...config.pages]; pages[i] = { ...pages[i], description: e.target.value }; updateConfig({ pages }); }}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white resize-none" rows={2} />
              <div className="flex gap-1">
                <input type="text" value={p.price} onChange={(e) => { const pages = [...config.pages]; pages[i] = { ...pages[i], price: e.target.value }; updateConfig({ pages }); }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Price" />
                <input type="text" value={p.itemCode} onChange={(e) => { const pages = [...config.pages]; pages[i] = { ...pages[i], itemCode: e.target.value }; updateConfig({ pages }); }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Code" />
              </div>
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Stock Images">
        <StockImagePanel onSelect={(img) => {
          if (config.currentPage > 0) {
            const pages = [...config.pages];
            const idx = config.currentPage - 1;
            if (pages[idx]) { pages[idx] = { ...pages[idx], imageUrl: img.urls.regular }; updateConfig({ pages }); }
          }
        }} />
      </AccordionSection>

      <AccordionSection id="pages" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => updateConfig({ currentPage: i })}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.currentPage === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{i === 0 ? "Cover" : `${i}`}</button>
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
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as LBTemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Lookbook — ${config.currentPage === 0 ? "Cover" : `Product ${config.currentPage}`} — A4 (595×842)`} />
  );
}
