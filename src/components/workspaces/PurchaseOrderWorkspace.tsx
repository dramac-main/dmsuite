"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconClipboard, IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconImage, IconFileText, IconPlus, IconTrash } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont } from "@/lib/canvas-utils";
import { loadImage, drawImageCover } from "@/lib/graphics-engine";
import { drawProText, drawProDivider, drawHeaderArea, drawTable, generateColorPalette, getTypographicScale, searchStockImages, exportHighRes, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { drawDocumentThumbnail } from "@/lib/template-renderers";
import { Accordion, AccordionSection } from "@/components/ui";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type POTemplate = "standard" | "modern" | "detailed" | "compact" | "corporate" | "minimal";

interface POItem { id: string; description: string; quantity: number; unitPrice: number; unit: string; }

interface POConfig {
  template: POTemplate;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  vendorName: string;
  vendorAddress: string;
  vendorEmail: string;
  poNumber: string;
  poDate: string;
  deliveryDate: string;
  shippingMethod: string;
  paymentTerms: string;
  notes: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  description: string;
}

const uid = () => Math.random().toString(36).slice(2, 9);
const PAGE_W = 595, PAGE_H = 842;

const TEMPLATES: { id: POTemplate; name: string }[] = [
  { id: "standard", name: "Standard" }, { id: "modern", name: "Modern" },
  { id: "detailed", name: "Detailed" }, { id: "compact", name: "Compact" },
  { id: "corporate", name: "Corporate" }, { id: "minimal", name: "Minimal" },
];

const CURRENCIES = [
  { code: "ZMW", symbol: "K", name: "Zambian Kwacha" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "KES", symbol: "KSh", name: "Kenyan Shilling" },
  { code: "NGN", symbol: "₦", name: "Nigerian Naira" },
];

const COLOR_PRESETS = ["#1e3a5f", "#0f4c75", "#2d3436", "#0d7377", "#6c5ce7", "#00b894", "#e17055", "#8ae600", "#06b6d4", "#1a1a2e", "#2d1b69", "#3c1361"];

/* ── Component ───────────────────────────────────────────── */

export default function PurchaseOrderWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<POConfig>({
    template: "standard", primaryColor: "#1e3a5f",
    companyName: "Meridian Corp Ltd", companyAddress: "Plot 123, Cairo Road\nLusaka, Zambia",
    companyPhone: "+260 97 1234567", companyEmail: "procurement@meridiancorp.com",
    vendorName: "TechSupply Africa", vendorAddress: "Unit 45, Industrial Area\nKitwe, Zambia",
    vendorEmail: "sales@techsupply.co.zm",
    poNumber: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`,
    poDate: new Date().toISOString().slice(0, 10),
    deliveryDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
    shippingMethod: "Standard Delivery", paymentTerms: "Net 30",
    notes: "Please include packing list with delivery. All items must meet specified quality standards.",
    currency: "ZMW", currencySymbol: "K", taxRate: 16, description: "",
  });

  const [items, setItems] = useState<POItem[]>([
    { id: uid(), description: "Office Laptop (Core i7, 16GB RAM)", quantity: 5, unitPrice: 12500, unit: "pcs" },
    { id: uid(), description: "Wireless Mouse & Keyboard Set", quantity: 10, unitPrice: 350, unit: "sets" },
    { id: uid(), description: "24\" LED Monitor", quantity: 5, unitPrice: 4200, unit: "pcs" },
    { id: uid(), description: "USB-C Docking Station", quantity: 5, unitPrice: 1800, unit: "pcs" },
    { id: uid(), description: "Cat6 Ethernet Cable (50m)", quantity: 20, unitPrice: 150, unit: "rolls" },
  ]);

  const updateConfig = useCallback((p: Partial<POConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);
  const addItem = () => setItems((prev) => [...prev, { id: uid(), description: "", quantity: 1, unitPrice: 0, unit: "pcs" }]);
  const removeItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: string, field: string, val: string | number) => setItems((prev) => prev.map((i) => i.id === id ? { ...i, [field]: val } : i));

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const tax = subtotal * (config.taxRate / 100);
  const total = subtotal + tax;
  const fmt = (n: number) => `${config.currencySymbol}${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template } = config;
    const pal = generateColorPalette(primaryColor);
    const typo = getTypographicScale(PAGE_H);
    const m = 36, cw = PAGE_W - m * 2;

    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Header
    const headerH = template === "minimal" ? 60 : 85;
    drawHeaderArea(ctx, 0, 0, PAGE_W, headerH, primaryColor, template === "minimal" ? "minimal" : "gradient");

    drawProText(ctx, "PURCHASE ORDER", m, template === "minimal" ? 20 : 18, {
      fontSize: typo.h2, fontWeight: 800, color: template === "minimal" ? primaryColor : "#ffffff",
    });
    drawProText(ctx, config.poNumber, PAGE_W - m, template === "minimal" ? 20 : 22, {
      fontSize: typo.h3, fontWeight: 700, color: template === "minimal" ? primaryColor : hexToRgba("#ffffff", 0.8), align: "right",
    });
    if (template !== "minimal") {
      drawProText(ctx, config.companyName, m, 50, { fontSize: typo.body, fontWeight: 600, color: hexToRgba("#ffffff", 0.7) });
    }

    // From / To boxes
    let y = headerH + 20;
    const boxW = (cw - 20) / 2;

    // FROM
    ctx.fillStyle = pal.offWhite; roundRect(ctx, m, y, boxW, 100, 8); ctx.fill();
    drawProText(ctx, "FROM", m + 12, y + 10, { fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true });
    drawProText(ctx, config.companyName, m + 12, y + 28, { fontSize: typo.body, fontWeight: 700, color: pal.textDark });
    drawProText(ctx, config.companyAddress.replace(/\n/g, ", "), m + 12, y + 44, { fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, maxWidth: boxW - 24 });
    drawProText(ctx, config.companyEmail, m + 12, y + 70, { fontSize: typo.caption, fontWeight: 400, color: pal.textMedium });

    // TO
    ctx.fillStyle = pal.offWhite; roundRect(ctx, m + boxW + 20, y, boxW, 100, 8); ctx.fill();
    drawProText(ctx, "VENDOR", m + boxW + 32, y + 10, { fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true });
    drawProText(ctx, config.vendorName, m + boxW + 32, y + 28, { fontSize: typo.body, fontWeight: 700, color: pal.textDark });
    drawProText(ctx, config.vendorAddress.replace(/\n/g, ", "), m + boxW + 32, y + 44, { fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, maxWidth: boxW - 24 });
    drawProText(ctx, config.vendorEmail, m + boxW + 32, y + 70, { fontSize: typo.caption, fontWeight: 400, color: pal.textMedium });

    // Order details
    y += 120;
    const detailItems = [
      { label: "PO Date", value: config.poDate },
      { label: "Delivery Date", value: config.deliveryDate },
      { label: "Payment Terms", value: config.paymentTerms },
      { label: "Shipping", value: config.shippingMethod },
    ];
    const detailW = cw / 4;
    detailItems.forEach((d, i) => {
      const dx = m + i * detailW;
      drawProText(ctx, d.label.toUpperCase(), dx, y, { fontSize: typo.overline, fontWeight: 700, color: pal.textLight, uppercase: true });
      drawProText(ctx, d.value, dx, y + 14, { fontSize: typo.caption, fontWeight: 600, color: pal.textDark });
    });

    // Items table
    y += 40;
    const tableH = drawTable(ctx, m, y,
      [
        { label: "#", width: 30, align: "center" },
        { label: "Description", width: cw * 0.42 },
        { label: "Qty", width: 45, align: "center" },
        { label: "Unit", width: 40, align: "center" },
        { label: "Unit Price", width: cw * 0.17, align: "right" },
        { label: "Total", width: cw * 0.17, align: "right" },
      ],
      items.map((it, i) => [String(i + 1), it.description, String(it.quantity), it.unit, fmt(it.unitPrice), fmt(it.quantity * it.unitPrice)]),
      { primaryColor, fontSize: 9, rowHeight: 22, zebraStripe: true, borderColor: pal.lightGray }
    );

    // Totals
    y += tableH + 15;
    const totalsX = PAGE_W - m - 180;
    const totalsW = 180;

    [[`Subtotal`, fmt(subtotal)], [`Tax (${config.taxRate}%)`, fmt(tax)]].forEach(([label, val], i) => {
      drawProText(ctx, label, totalsX, y + i * 22, { fontSize: typo.caption, fontWeight: 500, color: pal.textMedium });
      drawProText(ctx, val, totalsX + totalsW, y + i * 22, { fontSize: typo.caption, fontWeight: 600, color: pal.textDark, align: "right" });
    });

    y += 50;
    drawProDivider(ctx, totalsX, y, totalsW, primaryColor, "solid", 1.5);
    drawProText(ctx, "TOTAL", totalsX, y + 8, { fontSize: typo.body, fontWeight: 800, color: primaryColor });
    drawProText(ctx, fmt(total), totalsX + totalsW, y + 8, { fontSize: typo.body + 2, fontWeight: 800, color: primaryColor, align: "right" });

    // Notes
    if (config.notes) {
      const notesY = Math.max(y + 50, PAGE_H - 140);
      drawProText(ctx, "NOTES", m, notesY, { fontSize: typo.label, fontWeight: 700, color: primaryColor, uppercase: true });
      drawProText(ctx, config.notes, m, notesY + 16, { fontSize: typo.caption, fontWeight: 400, color: pal.textMedium, maxWidth: cw });
    }

    // Signature lines
    const sigY = PAGE_H - 70;
    ctx.strokeStyle = pal.borderGray; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(m, sigY); ctx.lineTo(m + 160, sigY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PAGE_W - m - 160, sigY); ctx.lineTo(PAGE_W - m, sigY); ctx.stroke();
    drawProText(ctx, "Authorized Signature", m, sigY + 6, { fontSize: typo.overline, fontWeight: 500, color: pal.textLight });
    drawProText(ctx, "Date", PAGE_W - m - 160, sigY + 6, { fontSize: typo.overline, fontWeight: 500, color: pal.textLight });

    // Footer
    ctx.fillStyle = primaryColor; ctx.fillRect(0, PAGE_H - 5, PAGE_W, 5);
  }, [config, items, subtotal, tax, total, fmt]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate purchase order items for: "${config.description}". Return JSON: { "vendorName": "", "items": [{"description":"","quantity":0,"unitPrice":0,"unit":"pcs"}], "notes": "", "shippingMethod": "", "paymentTerms": "" }` }] }),
      });
      const reader = res.body?.getReader();
      if (!reader) return;
      let text = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); }
      const cleaned = cleanAIText(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.vendorName) updateConfig({ vendorName: data.vendorName });
        if (data.notes) updateConfig({ notes: data.notes });
        if (data.shippingMethod) updateConfig({ shippingMethod: data.shippingMethod });
        if (data.paymentTerms) updateConfig({ paymentTerms: data.paymentTerms });
        if (data.items?.length) setItems(data.items.map((it: POItem) => ({ ...it, id: uid() })));
      }
    } catch { /* skip */ }
    setIsGenerating(false);
  }, [config.description, isGenerating, updateConfig, advancedSettings]);

  const handleExport = useCallback((preset: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "purchase-order");
  }, []);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      drawDocumentThumbnail(ctx, w, h, { primaryColor: config.primaryColor, headerStyle: "bar", showTable: true, showSections: 2 });
    },
  }));

  const displayW = 380;
  const displayH = Math.round(displayW * (PAGE_H / PAGE_W));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe what you're ordering… e.g., 'Office IT equipment for 5 new workstations'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate PO</>}
        </button>
      </AccordionSection>

      <AccordionSection id="company" icon={<IconFileText className="size-3.5" />} label="Your Company">
        <div className="space-y-2">
          {(["companyName", "companyAddress", "companyPhone", "companyEmail"] as const).map((f) => (
            <div key={f}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace("company", "")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="vendor" icon={<IconClipboard className="size-3.5" />} label="Vendor Details">
        <div className="space-y-2">
          {(["vendorName", "vendorAddress", "vendorEmail"] as const).map((f) => (
            <div key={f}>
              <label className="text-[10px] font-semibold text-gray-500 uppercase">{f.replace("vendor", "")}</label>
              <input type="text" value={config[f]} onChange={(e) => updateConfig({ [f]: e.target.value })}
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
            </div>
          ))}
        </div>
      </AccordionSection>

      <AccordionSection id="items" icon={<IconClipboard className="size-3.5" />} label="Line Items" badge={items.length}>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400">#{i + 1}</span>
                <button onClick={() => removeItem(item.id)} className="text-error hover:text-red-400"><IconTrash className="size-3" /></button>
              </div>
              <input type="text" value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Description"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
              <div className="flex gap-1.5">
                <input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, "quantity", +e.target.value)} placeholder="Qty" min={1}
                  className="w-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
                <input type="number" value={item.unitPrice} onChange={(e) => updateItem(item.id, "unitPrice", +e.target.value)} placeholder="Price" step={0.01}
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
              </div>
            </div>
          ))}
          <button onClick={addItem} className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium border border-dashed border-gray-300 dark:border-gray-700 text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors">
            <IconPlus className="size-3" />Add Item
          </button>
        </div>
      </AccordionSection>

      <AccordionSection id="settings" icon={<IconDroplet className="size-3.5" />} label="Settings">
        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Currency</label>
            <select value={config.currency} onChange={(e) => { const c = CURRENCIES.find((x) => x.code === e.target.value); if (c) updateConfig({ currency: c.code, currencySymbol: c.symbol }); }}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500">
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.symbol} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Tax Rate (%)</label>
            <input type="number" value={config.taxRate} onChange={(e) => updateConfig({ taxRate: +e.target.value })} min={0} max={100} step={0.5}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" />
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Color</label>
            <div className="flex flex-wrap gap-1.5">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => updateConfig({ primaryColor: c })}
                  className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`}
                  style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>
        </div>
      </AccordionSection>

      <AccordionSection id="export" icon={<IconDownload className="size-3.5" />} label="Export">
        <div className="space-y-1.5">
          {[{ id: "web-standard", label: "Web PNG" }, { id: "print-standard", label: "Print 300 DPI" }, { id: "print-ultra", label: "Ultra 600 DPI" }].map((p) => (
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
    <StickyCanvasLayout canvasRef={canvasRef} displayWidth={displayW} displayHeight={displayH}
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as POTemplate })} thumbWidth={120} thumbHeight={170} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label={`Purchase Order — A4 (${PAGE_W}×${PAGE_H})`} />
  );
}
