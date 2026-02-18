"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconTag,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type PriceListTemplate = "modern" | "classic" | "menu" | "catalog";

interface PriceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  unit: string;
  isSpecial: boolean;
}

interface PriceCategory {
  id: string;
  name: string;
  items: PriceItem[];
}

interface PriceListConfig {
  template: PriceListTemplate;
  primaryColor: string;
  businessName: string;
  listTitle: string;
  effectiveDate: string;
  currency: string;
  currencySymbol: string;
  columns: 1 | 2;
  showDescriptions: boolean;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: PriceListTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "menu", name: "Menu" },
  { id: "catalog", name: "Catalog" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultCategories(): PriceCategory[] {
  return [
    { id: uid(), name: "Design Services", items: [
      { id: uid(), name: "Logo Design", description: "Professional logo with 3 concepts", price: 2500, unit: "per project", isSpecial: false },
      { id: uid(), name: "Business Card", description: "Double-sided design", price: 500, unit: "per design", isSpecial: false },
      { id: uid(), name: "Brand Identity Package", description: "Complete branding suite", price: 8000, unit: "per package", isSpecial: true },
    ]},
    { id: uid(), name: "Print Services", items: [
      { id: uid(), name: "Flyer Printing", description: "A5, full color, 170gsm", price: 3, unit: "per unit", isSpecial: false },
      { id: uid(), name: "Banner Printing", description: "Large format PVC banner", price: 150, unit: "per sqm", isSpecial: false },
      { id: uid(), name: "Business Cards", description: "350gsm, matte laminate", price: 250, unit: "per 100", isSpecial: false },
    ]},
    { id: uid(), name: "Digital Services", items: [
      { id: uid(), name: "Social Media Management", description: "Monthly content & posting", price: 3500, unit: "per month", isSpecial: false },
      { id: uid(), name: "Website Design", description: "Responsive 5-page website", price: 12000, unit: "per project", isSpecial: true },
    ]},
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function PriceListWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  /* ── Zoom ──────────────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.72);
  const displayWidth = PAGE_W * zoom;
  const displayHeight = PAGE_H * zoom;

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<PriceListConfig>({
    template: "modern",
    primaryColor: "#1e40af",
    businessName: "DMSuite Creative",
    listTitle: "Price List 2025",
    effectiveDate: new Date().toISOString().slice(0, 10),
    currency: "ZMW",
    currencySymbol: "K",
    columns: 1,
    showDescriptions: true,
    activeSection: 0,
    description: "",
  });

  const [categories, setCategories] = useState<PriceCategory[]>(defaultCategories());

  const allItems = categories.flatMap((c) => c.items);
  const itemsPerPage = config.columns === 2 ? 16 : 10;
  const totalPages = 1 + Math.ceil(allItems.length / itemsPerPage);
  const sym = config.currencySymbol;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = PAGE_W;
    canvas.height = PAGE_H;

    const W = PAGE_W;
    const H = PAGE_H;
    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const M = 40;
    const CW = W - M * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    if (config.activeSection === 0) {
      /* Cover / Header page */
      if (config.template === "modern") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 180);
        ctx.fillStyle = "#ffffff10";
        ctx.beginPath();
        ctx.arc(W - 50, 90, 100, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.template === "menu") {
        ctx.strokeStyle = pc;
        ctx.lineWidth = 2;
        ctx.strokeRect(M - 10, M - 10, CW + 20, H - M * 2 + 20);
        ctx.fillStyle = pc + "06";
        ctx.fillRect(M - 10, M - 10, CW + 20, H - M * 2 + 20);
      } else if (config.template === "catalog") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, 8, H);
        ctx.fillRect(W - 8, 0, 8, H);
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 6);
        ctx.fillRect(0, H - 6, W, 6);
      }

      const isDark = config.template === "modern";
      let y = isDark ? 40 : M + 10;

      /* Business name */
      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 20px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.businessName, M, y + 20);

      /* Title */
      ctx.fillStyle = isDark ? "#ffffffcc" : pc;
      ctx.font = `bold 28px ${font}`;
      ctx.fillText(config.listTitle, M, y + 58);

      /* Effective date */
      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `11px ${font}`;
      ctx.fillText(`Effective: ${config.effectiveDate}  •  All prices in ${config.currency}`, M, y + 80);

      /* Special offers indicator */
      const specials = allItems.filter((i) => i.isSpecial);
      if (specials.length > 0) {
        ctx.fillStyle = isDark ? "#ffffffaa" : "#dc2626";
        ctx.font = `italic 10px ${font}`;
        ctx.fillText(`★ ${specials.length} Special Offer${specials.length > 1 ? "s" : ""} Available`, M, y + 98);
      }

      /* Category summary */
      y = isDark ? 200 : M + 130;
      for (const cat of categories) {
        /* Category header */
        ctx.fillStyle = pc;
        ctx.font = `bold 13px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(cat.name.toUpperCase(), M, y);

        ctx.strokeStyle = pc + "30";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(M, y + 6);
        ctx.lineTo(W - M, y + 6);
        ctx.stroke();
        y += 20;

        /* Items */
        for (const item of cat.items) {
          if (y > H - M - 20) break;

          /* Special marker */
          if (item.isSpecial) {
            ctx.fillStyle = "#dc2626";
            ctx.font = `bold 10px ${font}`;
            ctx.textAlign = "left";
            ctx.fillText("★ SPECIAL", M, y);
            y += 12;
          }

          /* Name + dot leader + price */
          ctx.fillStyle = "#1e293b";
          ctx.font = `12px ${font}`;
          ctx.textAlign = "left";
          ctx.fillText(item.name, M, y);

          /* Price */
          const priceStr = fmtMoney(item.price, sym);
          const unitStr = item.unit ? ` / ${item.unit}` : "";
          ctx.fillStyle = pc;
          ctx.font = `bold 12px ${font}`;
          ctx.textAlign = "right";
          ctx.fillText(priceStr + unitStr, W - M, y);

          /* Dot leader */
          const nameW = ctx.measureText(item.name).width;
          ctx.fillStyle = "#d1d5db";
          ctx.font = `12px ${font}`;
          ctx.textAlign = "left";
          for (let dx = M + nameW + 8; dx < W - M - ctx.measureText(priceStr + unitStr).width - 8; dx += 6) {
            ctx.fillText(".", dx, y);
          }

          /* Description */
          if (config.showDescriptions && item.description) {
            y += 14;
            ctx.fillStyle = "#94a3b8";
            ctx.font = `italic 9px ${font}`;
            ctx.textAlign = "left";
            ctx.fillText(item.description, M + 8, y, CW - 16);
          }

          y += 20;
        }

        y += 10;
      }

      /* Footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`All prices exclusive of VAT (16%) unless stated otherwise. Prices subject to change.`, W / 2, H - M + 10);
      ctx.fillText(`${config.businessName} — ${config.effectiveDate}`, W / 2, H - M + 24);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else {
      /* Additional pages if needed */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 16px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(`${config.listTitle} (continued)`, M, M + 30);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${totalPages}`, W / 2, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, categories, allItems, totalPages, sym, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate a price list for: ${config.description}. Business: ${config.businessName}. Currency: ZMW. Return JSON: { "listTitle": "", "categories": [{ "name": "", "items": [{ "name": "", "description": "", "price": 0, "unit": "", "isSpecial": false }] }] }. Include 2-3 categories, 3-5 items each, realistic ZMW prices. Mark 1-2 items as specials.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.listTitle) setConfig((p) => ({ ...p, listTitle: data.listTitle }));
        if (data.categories) {
          setCategories(data.categories.map((cat: { name: string; items: { name: string; description: string; price: number; unit: string; isSpecial: boolean }[] }) => ({
            id: uid(),
            name: cat.name,
            items: (cat.items || []).map((it) => ({
              id: uid(), name: it.name, description: it.description || "", price: it.price || 0, unit: it.unit || "", isSpecial: it.isSpecial || false,
            })),
          })));
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `pricelist-${config.businessName.replace(/\s+/g, "-")}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Visual Template Previews ──────────────────────────── */
  const HEADER_MAP: Record<PriceListTemplate, "bar" | "strip" | "minimal" | "gradient" | "centered" | "sidebar"> = {
    modern: "gradient",
    classic: "centered",
    menu: "sidebar",
    catalog: "bar",
  };
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) =>
          drawDocumentThumbnail(ctx, w, h, {
            primaryColor: config.primaryColor,
            headerStyle: HEADER_MAP[t.id],
            showTable: true,
            showSections: 2,
          }),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.primaryColor],
  );

  /* ── Clipboard Copy ────────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    try {
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
      if (blob) await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    } catch { /* silent */ }
  }, []);

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <StickyCanvasLayout
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`Price List — ${config.currency} — ${PAGE_W}×${PAGE_H}`}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.3))}
      onZoomFit={() => setZoom(0.72)}
      mobileTabs={["Canvas", "Settings"]}
      toolbar={
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <IconTag className="size-4 text-primary-500" />
          <span className="font-semibold text-gray-300">{config.listTitle}</span>
          <span className="text-gray-600">|</span>
          <span>{config.currency} — {categories.length} categories, {allItems.length} items</span>
        </div>
      }
      actionsBar={
        <>
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-linear-to-r from-primary-500 to-secondary-500 text-white text-xs font-bold hover:from-primary-400 hover:to-secondary-400 transition-colors"
          >
            <IconDownload className="size-3.5" /> Export PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-600 text-gray-300 text-xs font-semibold hover:bg-gray-700/50 transition-colors"
          >
            <IconCopy className="size-3.5" /> Copy
          </button>
        </>
      }
      leftPanel={
        <div className="space-y-3">
          {/* AI Generation */}
          <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
            <label className="flex items-center gap-1.5 text-[0.625rem] font-semibold uppercase tracking-wider text-secondary-500 mb-2">
              <IconSparkles className="size-3" />
              AI Price List Generator
            </label>
            <textarea
              rows={3}
              placeholder="Describe the business/services (e.g. 'Printing shop in Lusaka')..."
              value={config.description}
              onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl border border-secondary-500/20 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-secondary-500/50 focus:ring-2 focus:ring-secondary-500/20 transition-all resize-none mb-2"
            />
            <button
              onClick={generateAI}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-linear-to-r from-secondary-500 to-primary-500 text-white text-[0.625rem] font-bold hover:from-secondary-400 hover:to-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Price List"}
            </button>
          </div>

          {/* Template Slider */}
          <TemplateSlider
            templates={templatePreviews}
            activeId={config.template}
            onSelect={(id) => setConfig((p) => ({ ...p, template: id as PriceListTemplate }))}
            label="Template"
          />

          {/* Price List Settings */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconTag className="size-4 text-primary-500" />Price List Settings</h3>

            <label className="block text-xs text-gray-400">Business Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessName} onChange={(e) => setConfig((p) => ({ ...p, businessName: e.target.value }))} />

            <label className="block text-xs text-gray-400">List Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.listTitle} onChange={(e) => setConfig((p) => ({ ...p, listTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Effective Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.effectiveDate} onChange={(e) => setConfig((p) => ({ ...p, effectiveDate: e.target.value }))} />

            <div className="flex items-center gap-2">
              <input type="checkbox" checked={config.showDescriptions} onChange={(e) => setConfig((p) => ({ ...p, showDescriptions: e.target.checked }))} className="rounded" />
              <label className="text-xs text-gray-400">Show descriptions</label>
            </div>

            <label className="block text-xs text-gray-400">Primary Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Categories & Items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 max-h-72 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Categories & Items</h3>
            {categories.map((cat, ci) => (
              <div key={cat.id} className="space-y-1.5">
                <div className="flex items-center gap-1">
                  <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs font-semibold text-gray-900 dark:text-white" value={cat.name} onChange={(e) => { const c = [...categories]; c[ci] = { ...c[ci], name: e.target.value }; setCategories(c); }} />
                  <button onClick={() => setCategories((c) => c.filter((_, j) => j !== ci))} className="text-xs text-red-500">×</button>
                </div>
                {cat.items.map((item, ii) => (
                  <div key={item.id} className="flex gap-1 pl-3">
                    <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-[10px] text-gray-900 dark:text-white" placeholder="Name" value={item.name} onChange={(e) => { const c = [...categories]; c[ci].items[ii] = { ...c[ci].items[ii], name: e.target.value }; setCategories(c); }} />
                    <input type="number" className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-[10px] text-gray-900 dark:text-white text-right" value={item.price} onChange={(e) => { const c = [...categories]; c[ci].items[ii] = { ...c[ci].items[ii], price: Number(e.target.value) }; setCategories(c); }} />
                    <button onClick={() => { const c = [...categories]; c[ci] = { ...c[ci], items: c[ci].items.filter((_, j) => j !== ii) }; setCategories(c); }} className="text-[10px] text-red-500">×</button>
                  </div>
                ))}
                <button onClick={() => { const c = [...categories]; c[ci] = { ...c[ci], items: [...c[ci].items, { id: uid(), name: "", description: "", price: 0, unit: "", isSpecial: false }] }; setCategories(c); }} className="text-[10px] text-primary-500 pl-3 hover:underline">+ item</button>
              </div>
            ))}
            <button onClick={() => setCategories((c) => [...c, { id: uid(), name: "New Category", items: [] }])} className="text-xs text-primary-500 hover:underline">+ Add Category</button>
          </div>

          {/* Advanced Settings — Global */}
          <AdvancedSettingsPanel />
        </div>
      }
    />
  );
}
