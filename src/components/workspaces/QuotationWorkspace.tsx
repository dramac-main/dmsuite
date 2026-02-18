"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconReceipt,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type QuoteTemplate = "modern" | "classic" | "minimal" | "bold" | "elegant" | "corporate";

interface QuoteItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface QuotationConfig {
  template: QuoteTemplate;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  clientName: string;
  clientCompany: string;
  clientAddress: string;
  clientEmail: string;
  quoteNumber: string;
  quoteDate: string;
  validityDays: number;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  discountPercent: number;
  notes: string;
  terms: string;
  description: string;
}

const TEMPLATES: { id: QuoteTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "minimal", name: "Minimal" },
  { id: "bold", name: "Bold" },
  { id: "elegant", name: "Elegant" },
  { id: "corporate", name: "Corporate" },
];

const CURRENCIES: { code: string; symbol: string; name: string }[] = [
  { code: "ZMW", symbol: "K", name: "Zambian Kwacha" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "ZAR", symbol: "R", name: "SA Rand" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function QuotationWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<QuotationConfig>({
    template: "modern",
    primaryColor: "#1e40af",
    companyName: "DMSuite Solutions",
    companyAddress: "Plot 123, Cairo Road, Lusaka",
    companyPhone: "+260 977 123 456",
    companyEmail: "info@dmsuite.com",
    clientName: "John Banda",
    clientCompany: "Client Corp Ltd",
    clientAddress: "Plot 456, Great East Road, Lusaka",
    clientEmail: "john@clientcorp.co.zm",
    quoteNumber: "QT-001",
    quoteDate: new Date().toISOString().slice(0, 10),
    validityDays: 30,
    currency: "ZMW",
    currencySymbol: "K",
    taxRate: 16,
    discountPercent: 0,
    notes: "Thank you for your business. We look forward to working with you.",
    terms: "50% deposit required to commence work. Balance due on completion. Prices quoted in ZMW.",
    description: "",
  });

  const [items, setItems] = useState<QuoteItem[]>([
    { id: uid(), description: "Consulting Services", quantity: 10, rate: 500 },
    { id: uid(), description: "Design & Development", quantity: 1, rate: 15000 },
    { id: uid(), description: "Project Management", quantity: 1, rate: 3000 },
  ]);

  const subtotal = items.reduce((s, it) => s + it.quantity * it.rate, 0);
  const discountAmount = subtotal * (config.discountPercent / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (config.taxRate / 100);
  const total = afterDiscount + taxAmount;
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

    /* Template header */
    if (config.template === "modern") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 110);
      ctx.fillStyle = pc + "30";
      ctx.beginPath();
      ctx.arc(W - 40, 50, 80, 0, Math.PI * 2);
      ctx.fill();
    } else if (config.template === "bold") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, 12, H);
      ctx.fillStyle = pc + "08";
      ctx.fillRect(0, 0, W, H);
    } else if (config.template === "elegant") {
      ctx.strokeStyle = pc;
      ctx.lineWidth = 1;
      ctx.strokeRect(M - 10, M - 10, CW + 20, H - M * 2 + 20);
    } else if (config.template === "corporate") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H - 6, W, 6);
      /* Dot pattern */
      ctx.fillStyle = pc + "08";
      for (let dx = 0; dx < W; dx += 20) {
        for (let dy = 0; dy < 100; dy += 20) {
          ctx.beginPath();
          ctx.arc(dx, dy + 20, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else if (config.template === "classic") {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, W, 100);
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, 100);
      ctx.lineTo(W, 100);
      ctx.stroke();
    }

    /* Header text */
    const headerDark = config.template === "modern";
    const headerY = config.template === "modern" ? 35 : 35;

    ctx.fillStyle = headerDark ? "#ffffff" : "#1e293b";
    ctx.font = `bold 18px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText(config.companyName, M, headerY);

    ctx.fillStyle = headerDark ? "#ffffffcc" : "#64748b";
    ctx.font = `10px ${font}`;
    ctx.fillText(config.companyAddress, M, headerY + 16);
    ctx.fillText(`${config.companyPhone} • ${config.companyEmail}`, M, headerY + 28);

    /* QUOTATION label */
    ctx.fillStyle = headerDark ? "#ffffff" : pc;
    ctx.font = `bold 28px ${font}`;
    ctx.textAlign = "right";
    ctx.fillText("QUOTATION", W - M, headerY + 10);

    ctx.fillStyle = headerDark ? "#ffffffaa" : "#64748b";
    ctx.font = `10px ${font}`;
    ctx.fillText(`#${config.quoteNumber}`, W - M, headerY + 26);

    /* Quote details & client */
    let y = config.template === "modern" ? 140 : 120;
    ctx.textAlign = "left";

    /* Client info */
    ctx.fillStyle = "#475569";
    ctx.font = `600 9px ${font}`;
    ctx.fillText("QUOTE TO", M, y);
    y += 16;
    ctx.fillStyle = "#1e293b";
    ctx.font = `12px ${font}`;
    ctx.fillText(config.clientName, M, y);
    y += 14;
    ctx.fillText(config.clientCompany, M, y);
    y += 14;
    ctx.fillStyle = "#64748b";
    ctx.font = `10px ${font}`;
    ctx.fillText(config.clientAddress, M, y);

    /* Quote meta (right side) */
    ctx.textAlign = "right";
    ctx.fillStyle = "#475569";
    ctx.font = `600 9px ${font}`;
    const metaY = config.template === "modern" ? 140 : 120;
    ctx.fillText("QUOTE DETAILS", W - M, metaY);
    ctx.fillStyle = "#64748b";
    ctx.font = `10px ${font}`;
    ctx.fillText(`Date: ${config.quoteDate}`, W - M, metaY + 16);
    ctx.fillText(`Valid for: ${config.validityDays} days`, W - M, metaY + 30);
    ctx.fillText(`Currency: ${config.currency}`, W - M, metaY + 44);

    /* Items table */
    y += 40;
    const tableTop = y;

    /* Table header */
    ctx.fillStyle = pc + "10";
    ctx.fillRect(M, tableTop - 12, CW, 22);
    ctx.fillStyle = pc;
    ctx.font = `600 9px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("DESCRIPTION", M + 8, tableTop);
    ctx.textAlign = "center";
    ctx.fillText("QTY", W - M - 170, tableTop);
    ctx.fillText("RATE", W - M - 110, tableTop);
    ctx.textAlign = "right";
    ctx.fillText("AMOUNT", W - M - 8, tableTop);

    y = tableTop + 16;
    ctx.strokeStyle = pc + "20";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    y += 8;

    /* Rows */
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const lineTotal = item.quantity * item.rate;

      if (i % 2 === 0) {
        ctx.fillStyle = "#f8fafc";
        ctx.fillRect(M, y - 10, CW, 20);
      }

      ctx.fillStyle = "#1e293b";
      ctx.font = `11px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(item.description, M + 8, y, 250);
      ctx.textAlign = "center";
      ctx.fillText(String(item.quantity), W - M - 170, y);
      ctx.fillText(fmtMoney(item.rate, sym), W - M - 110, y);
      ctx.textAlign = "right";
      ctx.fillText(fmtMoney(lineTotal, sym), W - M - 8, y);
      y += 22;
    }

    /* Totals */
    y += 10;
    const totalsX = W - M - 200;
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(totalsX, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    y += 18;

    ctx.fillStyle = "#475569";
    ctx.font = `11px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("Subtotal", totalsX, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(subtotal, sym), W - M - 8, y);
    y += 18;

    if (config.discountPercent > 0) {
      ctx.fillStyle = "#059669";
      ctx.fillText(`-${fmtMoney(discountAmount, sym)}`, W - M - 8, y);
      ctx.textAlign = "left";
      ctx.fillText(`Discount (${config.discountPercent}%)`, totalsX, y);
      y += 18;
    }

    ctx.fillStyle = "#475569";
    ctx.textAlign = "left";
    ctx.fillText(`VAT (${config.taxRate}%)`, totalsX, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(taxAmount, sym), W - M - 8, y);
    y += 22;

    /* Total line */
    ctx.fillStyle = pc;
    ctx.fillRect(totalsX, y - 6, 200, 2);
    y += 8;
    ctx.fillStyle = "#1e293b";
    ctx.font = `bold 14px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("TOTAL", totalsX, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(total, sym), W - M - 8, y);

    /* Notes */
    y += 40;
    if (config.notes && y < H - 80) {
      ctx.fillStyle = "#475569";
      ctx.font = `600 9px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("NOTES", M, y);
      y += 14;
      ctx.fillStyle = "#64748b";
      ctx.font = `10px ${font}`;
      ctx.fillText(config.notes, M, y, CW);
    }

    /* Terms */
    y += 24;
    if (config.terms && y < H - 40) {
      ctx.fillStyle = "#475569";
      ctx.font = `600 9px ${font}`;
      ctx.fillText("TERMS & CONDITIONS", M, y);
      y += 14;
      ctx.fillStyle = "#94a3b8";
      ctx.font = `9px ${font}`;
      ctx.fillText(config.terms, M, y, CW);
    }

    /* Footer */
    ctx.fillStyle = "#94a3b8";
    ctx.font = `9px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(`${config.companyName} — ${config.companyPhone}`, W / 2, H - 20);

    ctx.fillStyle = pc;
    ctx.fillRect(0, H - 4, W, 4);
  }, [config, items, subtotal, discountAmount, taxAmount, total, sym, advancedSettings]);

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
            content: `Generate quotation line items for: ${config.description}. Company: ${config.companyName}. Client: ${config.clientCompany}. Based in Lusaka, Zambia. Currency: ZMW. Return JSON: { "items": [{ "description": "", "quantity": 1, "rate": 0 }], "notes": "", "terms": "" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.items) {
          setItems(data.items.map((it: { description: string; quantity: number; rate: number }) => ({
            id: uid(), description: it.description, quantity: it.quantity || 1, rate: it.rate || 0,
          })));
        }
        if (data.notes) setConfig((p) => ({ ...p, notes: data.notes }));
        if (data.terms) setConfig((p) => ({ ...p, terms: data.terms }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `quotation-${config.quoteNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const displayWidth = Math.min(500, PAGE_W);
  const displayHeight = displayWidth * (PAGE_H / PAGE_W);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          const pc = config.primaryColor;
          const hH = h * 0.15;
          if (t.id === "modern") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, hH);
            ctx.fillStyle = pc + "30";
            ctx.beginPath();
            ctx.arc(w - 8, hH * 0.5, 12, 0, Math.PI * 2);
            ctx.fill();
          } else if (t.id === "bold") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, 3, h);
            ctx.fillStyle = pc + "08";
            ctx.fillRect(0, 0, w, h);
          } else if (t.id === "elegant") {
            ctx.strokeStyle = pc;
            ctx.lineWidth = 1;
            ctx.strokeRect(4, 4, w - 8, h - 8);
          } else if (t.id === "corporate") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, 2);
            ctx.fillRect(0, h - 2, w, 2);
          } else if (t.id === "classic") {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, w, hH);
            ctx.strokeStyle = "#e2e8f0";
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(0, hH);
            ctx.lineTo(w, hH);
            ctx.stroke();
          } else {
            /* minimal */
            ctx.fillStyle = pc;
            ctx.fillRect(w * 0.3, 4, w * 0.4, 1.5);
          }
          /* table lines */
          ctx.strokeStyle = "#e2e8f0";
          ctx.lineWidth = 0.5;
          for (let y = hH + 12; y < h - 10; y += 6) {
            ctx.beginPath();
            ctx.moveTo(8, y);
            ctx.lineTo(w - 8, y);
            ctx.stroke();
          }
          ctx.fillStyle = pc;
          ctx.fillRect(0, h - 1, w, 1);
          /* border */
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, w, h);
        },
      })),
    [config.primaryColor]
  );

  /* ── Copy to Clipboard ──────────────────────────────────── */
  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
      }, "image/png");
    } catch {
      /* clipboard may not be available */
    }
  }, []);

  /* ── Panel Definitions for StickyCanvasLayout ───────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as QuoteTemplate }))}
        thumbWidth={140}
        thumbHeight={100}
        label="Templates"
      />

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconReceipt className="size-4 text-primary-500" />Quote Settings</h3>

        <label className="block text-xs text-gray-400">Company Name</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Quote #</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.quoteNumber} onChange={(e) => setConfig((p) => ({ ...p, quoteNumber: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.quoteDate} onChange={(e) => setConfig((p) => ({ ...p, quoteDate: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Client</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Client name" value={config.clientName} onChange={(e) => setConfig((p) => ({ ...p, clientName: e.target.value }))} />
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Client company" value={config.clientCompany} onChange={(e) => setConfig((p) => ({ ...p, clientCompany: e.target.value }))} />

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Currency</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white" value={config.currency} onChange={(e) => { const cur = CURRENCIES.find((c) => c.code === e.target.value); setConfig((p) => ({ ...p, currency: e.target.value, currencySymbol: cur?.symbol || "K" })); }}>
              {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400">VAT %</label>
            <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white" value={config.taxRate} onChange={(e) => setConfig((p) => ({ ...p, taxRate: Number(e.target.value) }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Disc %</label>
            <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-2 text-sm text-gray-900 dark:text-white" value={config.discountPercent} onChange={(e) => setConfig((p) => ({ ...p, discountPercent: Number(e.target.value) }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Valid (days)</label>
        <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.validityDays} onChange={(e) => setConfig((p) => ({ ...p, validityDays: Number(e.target.value) }))} />

        <label className="block text-xs text-gray-400">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Line Items */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-56 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Line Items</h3>
        {items.map((item, i) => (
          <div key={item.id} className="space-y-1">
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Description" value={item.description} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], description: e.target.value }; setItems(it); }} />
            <div className="flex gap-1">
              <input type="number" className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Qty" value={item.quantity} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], quantity: Number(e.target.value) }; setItems(it); }} />
              <input type="number" className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Rate" value={item.rate} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], rate: Number(e.target.value) }; setItems(it); }} />
              <span className="text-xs text-gray-400 self-center w-20 text-right">{fmtMoney(item.quantity * item.rate, sym)}</span>
              <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="px-1 text-xs text-red-500">×</button>
            </div>
          </div>
        ))}
        <button onClick={() => setItems((p) => [...p, { id: uid(), description: "", quantity: 1, rate: 0 }])} className="text-xs text-primary-500 hover:underline">+ Add Item</button>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-2 space-y-1 text-xs">
          <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmtMoney(subtotal, sym)}</span></div>
          {config.discountPercent > 0 && <div className="flex justify-between text-green-600"><span>Discount ({config.discountPercent}%)</span><span>-{fmtMoney(discountAmount, sym)}</span></div>}
          <div className="flex justify-between text-gray-500"><span>VAT ({config.taxRate}%)</span><span>{fmtMoney(taxAmount, sym)}</span></div>
          <div className="flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span>{fmtMoney(total, sym)}</span></div>
        </div>
      </div>

      {/* AI Generation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Quote Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the project for quotation (e.g. 'Branding package for a Lusaka restaurant')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Quote"}
        </button>
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`Quotation #${config.quoteNumber} — ${config.currency} — ${PAGE_W}×${PAGE_H}px`}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={exportPNG}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            Download PNG
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconCopy className="size-3" />
            Copy
          </button>
        </div>
      }
    />
  );
}
