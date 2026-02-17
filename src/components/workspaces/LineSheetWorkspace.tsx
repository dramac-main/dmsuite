"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconBriefcase, IconImage, IconLayout } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawTable, generateColorPalette, exportHighRes, EXPORT_PRESETS, drawImagePlaceholder } from "@/lib/ai-design-engine";
import { StockImagePanel } from "@/hooks/useStockImages";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type LSTemplate = "wholesale" | "minimal" | "fashion" | "catalog" | "modern" | "grid";

interface LineItem {
  name: string;
  style: string;
  wholesale: number;
  retail: number;
  moq: number;
  imageUrl: string;
}

interface LSConfig {
  template: LSTemplate;
  primaryColor: string;
  brandName: string;
  season: string;
  contactInfo: string;
  currency: string;
  items: LineItem[];
  currentPage: number;
  description: string;
}

const TEMPLATES: { id: LSTemplate; name: string }[] = [
  { id: "wholesale", name: "Wholesale" }, { id: "minimal", name: "Minimal" },
  { id: "fashion", name: "Fashion" }, { id: "catalog", name: "Catalog" },
  { id: "modern", name: "Modern" }, { id: "grid", name: "Grid" },
];

const CURRENCIES = ["ZMW", "USD", "EUR", "GBP", "ZAR"];
const COLOR_PRESETS = ["#1a1a2e", "#2d3436", "#1e3a5f", "#3c1361", "#0d7377", "#6c5ce7", "#c5a355", "#8ae600", "#06b6d4"];

const defaultItems: LineItem[] = [
  { name: "Heritage Tote Bag", style: "HT-001", wholesale: 180, retail: 350, moq: 12, imageUrl: "" },
  { name: "Safari Print Shirt", style: "SP-015", wholesale: 95, retail: 220, moq: 24, imageUrl: "" },
  { name: "Copper Cuff Bracelet", style: "CC-042", wholesale: 45, retail: 120, moq: 50, imageUrl: "" },
  { name: "Chitenge Wrap Dress", style: "CW-008", wholesale: 150, retail: 380, moq: 12, imageUrl: "" },
  { name: "Leather Belt — Classic", style: "LB-003", wholesale: 35, retail: 85, moq: 36, imageUrl: "" },
  { name: "Ankara Pocket Square", style: "AP-022", wholesale: 15, retail: 45, moq: 100, imageUrl: "" },
];

/* ── Component ───────────────────────────────────────────── */

export default function LineSheetWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<LSConfig>({
    template: "wholesale", primaryColor: "#1a1a2e",
    brandName: "MALAIKA", season: "Spring/Summer 2026",
    contactInfo: "orders@malaika.co.zm | +260 211 888 999",
    currency: "ZMW", items: defaultItems, currentPage: 0, description: "",
  });

  const updateConfig = useCallback((p: Partial<LSConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;
  const ITEMS_PER_PAGE = 4;
  const totalPages = Math.ceil(config.items.length / ITEMS_PER_PAGE);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template, currency, items, currentPage } = config;
    const m = 35;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Header
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, 0, PAGE_W, 50);

    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(800, 18, "modern");
    ctx.textAlign = "left";
    ctx.fillText(config.brandName, m, 24);

    ctx.fillStyle = hexToRgba("#ffffff", 0.6);
    ctx.font = getCanvasFont(400, 8, "modern");
    ctx.fillText("WHOLESALE LINE SHEET", m, 38);

    ctx.textAlign = "right";
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(600, 10, "modern");
    ctx.fillText(config.season, PAGE_W - m, 24);
    ctx.fillStyle = hexToRgba("#ffffff", 0.6);
    ctx.font = getCanvasFont(400, 8, "modern");
    ctx.fillText(`Page ${currentPage + 1} of ${totalPages}`, PAGE_W - m, 38);

    // Terms bar
    ctx.fillStyle = hexToRgba(primaryColor, 0.06);
    ctx.fillRect(0, 50, PAGE_W, 20);
    ctx.fillStyle = hexToRgba(primaryColor, 0.5);
    ctx.font = getCanvasFont(400, 7, "modern");
    ctx.textAlign = "center";
    ctx.fillText(`All prices in ${currency} | Terms: Net 30 | FOB: Lusaka, Zambia | ${config.contactInfo}`, PAGE_W / 2, 63);

    // Items grid (2×2)
    const startIdx = currentPage * ITEMS_PER_PAGE;
    const pageItems = items.slice(startIdx, startIdx + ITEMS_PER_PAGE);
    const colW = (PAGE_W - 2 * m - 15) / 2;
    const rowH = (PAGE_H - 110) / 2;

    pageItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = m + col * (colW + 15);
      const y = 80 + row * rowH;

      // Item card
      ctx.strokeStyle = hexToRgba(primaryColor, 0.1);
      ctx.lineWidth = 1;
      roundRect(ctx, x, y, colW, rowH - 10, 4);
      ctx.stroke();

      // Image area
      const imgH = rowH * 0.55;
      ctx.fillStyle = hexToRgba(primaryColor, 0.04);
      roundRect(ctx, x + 1, y + 1, colW - 2, imgH, 4);
      ctx.fill();
      drawImagePlaceholder(ctx, x + 8, y + 8, colW - 16, imgH - 16, "");

      // Product info
      let infoY = y + imgH + 12;
      ctx.textAlign = "left";
      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(700, 11, "modern");
      ctx.fillText(item.name, x + 10, infoY);

      infoY += 16;
      ctx.fillStyle = hexToRgba(primaryColor, 0.5);
      ctx.font = getCanvasFont(400, 8, "modern");
      ctx.fillText(`Style: ${item.style}`, x + 10, infoY);

      infoY += 18;
      // Price row
      ctx.fillStyle = hexToRgba(primaryColor, 0.06);
      roundRect(ctx, x + 8, infoY - 6, colW - 16, 32, 3);
      ctx.fill();

      ctx.fillStyle = hexToRgba(primaryColor, 0.5);
      ctx.font = getCanvasFont(600, 7, "modern");
      ctx.fillText("WHOLESALE", x + 14, infoY + 4);
      ctx.fillText("RETAIL", x + colW / 2, infoY + 4);
      ctx.fillText("MOQ", x + colW - 45, infoY + 4);

      ctx.fillStyle = primaryColor;
      ctx.font = getCanvasFont(700, 11, "modern");
      ctx.fillText(`${currency} ${item.wholesale}`, x + 14, infoY + 19);
      ctx.fillStyle = "#666";
      ctx.font = getCanvasFont(400, 10, "modern");
      ctx.fillText(`${currency} ${item.retail}`, x + colW / 2, infoY + 19);
      ctx.fillText(`${item.moq} pcs`, x + colW - 45, infoY + 19);
    });

    // Footer
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, PAGE_H - 24, PAGE_W, 24);
    ctx.fillStyle = hexToRgba("#ffffff", 0.6);
    ctx.font = getCanvasFont(400, 7, "modern");
    ctx.textAlign = "center";
    ctx.fillText(`${config.brandName} — ${config.contactInfo}`, PAGE_W / 2, PAGE_H - 10);
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate wholesale line sheet data for: "${config.description}". Return JSON: { "brandName": "", "season": "", "items": [{ "name": "", "style": "", "wholesale": 0, "retail": 0, "moq": 0 }] }. Include 6-8 products with realistic pricing.` }] }),
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
  }, [config.description, isGenerating, updateConfig]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "line-sheet");
  }, []);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = config.primaryColor; ctx.fillRect(0, 0, w, h * 0.1);
      ctx.strokeStyle = hexToRgba(config.primaryColor, 0.15);
      ctx.lineWidth = 0.5;
      const gW = (w - 10) / 2;
      const gH = (h - h * 0.12 - 8) / 2;
      for (let r = 0; r < 2; r++) for (let c = 0; c < 2; c++) {
        ctx.strokeRect(3 + c * (gW + 4), h * 0.12 + 2 + r * (gH + 4), gW, gH);
      }
    },
  }));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the brand… e.g., 'Zambian fashion brand selling handmade accessories'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="brand" icon={<IconFileText className="size-3.5" />} label="Brand">
        <div className="space-y-2">
          {(["brandName", "season", "contactInfo"] as const).map((f) => (
            <div key={f}><label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace(/([A-Z])/g, " $1")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          ))}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Currency</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {CURRENCIES.map((c) => (<button key={c} onClick={() => updateConfig({ currency: c })}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${config.currency === c ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{c}</button>))}
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="items" icon={<IconBriefcase className="size-3.5" />} label={`Items (${config.items.length})`}>
        <div className="space-y-2 max-h-52 overflow-y-auto">
          {config.items.map((item, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex justify-between">
                <input type="text" value={item.name} onChange={(e) => { const items = [...config.items]; items[i] = { ...items[i], name: e.target.value }; updateConfig({ items }); }}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] font-medium text-gray-900 dark:text-white" />
                <button onClick={() => updateConfig({ items: config.items.filter((_, idx) => idx !== i) })} className="text-red-400 hover:text-red-300 text-xs px-1 ml-1">×</button>
              </div>
              <div className="grid grid-cols-3 gap-1">
                <input type="number" value={item.wholesale} onChange={(e) => { const items = [...config.items]; items[i] = { ...items[i], wholesale: +e.target.value }; updateConfig({ items }); }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Wholesale" />
                <input type="number" value={item.retail} onChange={(e) => { const items = [...config.items]; items[i] = { ...items[i], retail: +e.target.value }; updateConfig({ items }); }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Retail" />
                <input type="number" value={item.moq} onChange={(e) => { const items = [...config.items]; items[i] = { ...items[i], moq: +e.target.value }; updateConfig({ items }); }}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="MOQ" />
              </div>
            </div>
          ))}
          <button onClick={() => updateConfig({ items: [...config.items, { name: "", style: "", wholesale: 0, retail: 0, moq: 12, imageUrl: "" }] })}
            className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 transition-colors">+ Add Item</button>
        </div>
      </AccordionSection>

      <AccordionSection id="images" icon={<IconImage className="size-3.5" />} label="Stock Images">
        <StockImagePanel onSelect={() => {}} />
      </AccordionSection>

      <AccordionSection id="pages" icon={<IconLayout className="size-3.5" />} label="Pages">
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button key={i} onClick={() => updateConfig({ currentPage: i })}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.currentPage === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>Page {i + 1}</button>
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
          {[{ id: "web-standard", label: "Web PNG (2×)" }, { id: "print-standard", label: "Print 300 DPI" }].map((p) => (
            <button key={p.id} onClick={() => handleExport(p.id)}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white transition-colors">{p.label}</button>
          ))}
        </div>
      </AccordionSection>
    </Accordion>
  );

  return (
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={340} displayHeight={480}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as LSTemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Line Sheet — Page ${config.currentPage + 1}/${totalPages} — A4 (595×842)`} />
  );
}
