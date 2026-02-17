"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconReceipt,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type ReceiptTemplate = "pos" | "professional" | "minimal" | "detailed";
type ReceiptFormat = "narrow" | "wide";

interface ReceiptItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

interface ReceiptConfig {
  template: ReceiptTemplate;
  format: ReceiptFormat;
  primaryColor: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  tpin: string;
  receiptNumber: string;
  receiptDate: string;
  customerName: string;
  paymentMethod: string;
  currency: string;
  currencySymbol: string;
  taxRate: number;
  footerMessage: string;
  description: string;
}

const TEMPLATES: { id: ReceiptTemplate; name: string }[] = [
  { id: "pos", name: "POS" },
  { id: "professional", name: "Professional" },
  { id: "minimal", name: "Minimal" },
  { id: "detailed", name: "Detailed" },
];

const FORMATS: { id: ReceiptFormat; name: string; w: number; h: number }[] = [
  { id: "narrow", name: "Narrow (POS)", w: 300, h: 700 },
  { id: "wide", name: "Wide (A5)", w: 500, h: 700 },
];

const PAYMENT_METHODS = ["Cash", "Mobile Money", "Bank Transfer", "Card", "Cheque"];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ── Component ─────────────────────────────────────────────── */

export default function ReceiptWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<ReceiptConfig>({
    template: "pos",
    format: "narrow",
    primaryColor: "#1e40af",
    businessName: "DMSuite Store",
    businessAddress: "Plot 123, Cairo Road, Lusaka",
    businessPhone: "+260 977 123 456",
    tpin: "1234567890",
    receiptNumber: "RCT-00001",
    receiptDate: new Date().toISOString().slice(0, 10),
    customerName: "Walk-in Customer",
    paymentMethod: "Cash",
    currency: "ZMW",
    currencySymbol: "K",
    taxRate: 16,
    footerMessage: "Thank you for your purchase!",
    description: "",
  });

  const [items, setItems] = useState<ReceiptItem[]>([
    { id: uid(), description: "Product A", quantity: 2, price: 150 },
    { id: uid(), description: "Product B", quantity: 1, price: 350 },
    { id: uid(), description: "Service Fee", quantity: 1, price: 50 },
  ]);

  const fmt = FORMATS.find((f) => f.id === config.format) || FORMATS[0];
  const subtotal = items.reduce((s, it) => s + it.quantity * it.price, 0);
  const taxAmount = subtotal * (config.taxRate / 100);
  const total = subtotal + taxAmount;
  const sym = config.currencySymbol;

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = fmt.w;
    canvas.height = fmt.h;

    const W = fmt.w;
    const H = fmt.h;
    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";
    const M = config.format === "narrow" ? 16 : 30;
    const CW = W - M * 2;
    const isNarrow = config.format === "narrow";

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    /* Template-specific header */
    if (config.template === "pos") {
      /* Thermal-style dotted border */
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = "#d1d5db";
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 4, W - 8, H - 8);
      ctx.setLineDash([]);
    } else if (config.template === "professional") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H - 6, W, 6);
    } else if (config.template === "detailed") {
      ctx.fillStyle = pc + "08";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, 6, H);
    }

    let y = M + 10;

    /* Business name */
    ctx.fillStyle = "#1e293b";
    ctx.textAlign = "center";
    ctx.font = `bold ${isNarrow ? 16 : 20}px ${font}`;
    ctx.fillText(config.businessName, W / 2, y);
    y += isNarrow ? 16 : 22;

    ctx.fillStyle = "#64748b";
    ctx.font = `${isNarrow ? 9 : 11}px ${font}`;
    ctx.fillText(config.businessAddress, W / 2, y);
    y += isNarrow ? 12 : 16;
    ctx.fillText(`Tel: ${config.businessPhone}`, W / 2, y);
    y += isNarrow ? 12 : 16;
    if (config.tpin) {
      ctx.fillText(`TPIN: ${config.tpin}`, W / 2, y);
      y += isNarrow ? 12 : 16;
    }

    /* Separator */
    y += 6;
    ctx.strokeStyle = config.template === "pos" ? "#000000" : "#e2e8f0";
    ctx.setLineDash(config.template === "pos" ? [2, 2] : []);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 12;

    /* Receipt info */
    ctx.textAlign = "left";
    ctx.fillStyle = "#475569";
    ctx.font = `${isNarrow ? 9 : 11}px ${font}`;
    ctx.fillText(`Receipt: ${config.receiptNumber}`, M, y);
    ctx.textAlign = "right";
    ctx.fillText(`Date: ${config.receiptDate}`, W - M, y);
    y += isNarrow ? 14 : 18;

    ctx.textAlign = "left";
    ctx.fillText(`Customer: ${config.customerName}`, M, y);
    y += isNarrow ? 14 : 18;

    /* Separator */
    y += 4;
    ctx.strokeStyle = config.template === "pos" ? "#000000" : "#e2e8f0";
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    y += 12;

    /* Items header */
    ctx.fillStyle = config.template === "pos" ? "#000000" : pc;
    ctx.font = `600 ${isNarrow ? 9 : 10}px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("ITEM", M, y);
    ctx.textAlign = "center";
    ctx.fillText("QTY", W - M - (isNarrow ? 100 : 140), y);
    ctx.fillText("PRICE", W - M - (isNarrow ? 55 : 75), y);
    ctx.textAlign = "right";
    ctx.fillText("TOTAL", W - M, y);
    y += isNarrow ? 14 : 18;

    /* Items */
    ctx.fillStyle = "#1e293b";
    ctx.font = `${isNarrow ? 10 : 11}px ${font}`;
    for (const item of items) {
      const lineTotal = item.quantity * item.price;
      ctx.textAlign = "left";
      ctx.fillText(item.description, M, y, isNarrow ? 100 : 180);
      ctx.textAlign = "center";
      ctx.fillText(String(item.quantity), W - M - (isNarrow ? 100 : 140), y);
      ctx.fillText(fmtMoney(item.price, sym), W - M - (isNarrow ? 55 : 75), y);
      ctx.textAlign = "right";
      ctx.fillText(fmtMoney(lineTotal, sym), W - M, y);
      y += isNarrow ? 16 : 20;
    }

    /* Separator */
    y += 6;
    ctx.strokeStyle = config.template === "pos" ? "#000000" : "#e2e8f0";
    ctx.setLineDash(config.template === "pos" ? [2, 2] : []);
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 14;

    /* Totals */
    ctx.font = `${isNarrow ? 10 : 11}px ${font}`;
    ctx.fillStyle = "#475569";
    ctx.textAlign = "left";
    ctx.fillText("Subtotal", M, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(subtotal, sym), W - M, y);
    y += isNarrow ? 16 : 18;

    ctx.textAlign = "left";
    ctx.fillText(`VAT (${config.taxRate}%)`, M, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(taxAmount, sym), W - M, y);
    y += isNarrow ? 18 : 22;

    /* Grand total */
    ctx.fillStyle = config.template === "pos" ? "#000000" : pc;
    ctx.font = `bold ${isNarrow ? 14 : 16}px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText("TOTAL", M, y);
    ctx.textAlign = "right";
    ctx.fillText(fmtMoney(total, sym), W - M, y);
    y += isNarrow ? 20 : 24;

    /* Payment method */
    ctx.fillStyle = "#475569";
    ctx.font = `${isNarrow ? 10 : 11}px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText(`Payment: ${config.paymentMethod}`, M, y);
    y += isNarrow ? 14 : 18;

    /* Separator */
    y += 6;
    ctx.strokeStyle = config.template === "pos" ? "#000000" : "#e2e8f0";
    ctx.setLineDash(config.template === "pos" ? [2, 2] : []);
    ctx.beginPath();
    ctx.moveTo(M, y);
    ctx.lineTo(W - M, y);
    ctx.stroke();
    ctx.setLineDash([]);
    y += 16;

    /* Footer */
    ctx.fillStyle = "#64748b";
    ctx.font = `${isNarrow ? 10 : 11}px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText(config.footerMessage, W / 2, y);
    y += isNarrow ? 14 : 18;

    /* Barcode placeholder */
    y += 6;
    ctx.fillStyle = "#1e293b";
    const bcW = isNarrow ? 140 : 180;
    const bcX = (W - bcW) / 2;
    for (let bx = 0; bx < bcW; bx += 3) {
      const barH = 28 + Math.random() * 8;
      ctx.fillRect(bcX + bx, y, 2, barH);
    }
    y += 42;
    ctx.fillStyle = "#94a3b8";
    ctx.font = `9px ${font}`;
    ctx.fillText(config.receiptNumber, W / 2, y);
  }, [config, items, fmt, subtotal, taxAmount, total, sym]);

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
            content: `Generate receipt line items for: ${config.description}. Business: ${config.businessName}. Currency: ZMW. Return JSON: { "items": [{ "description": "", "quantity": 1, "price": 0 }], "footerMessage": "" }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.items) {
          setItems(data.items.map((it: { description: string; quantity: number; price: number }) => ({
            id: uid(), description: it.description, quantity: it.quantity || 1, price: it.price || 0,
          })));
        }
        if (data.footerMessage) setConfig((p) => ({ ...p, footerMessage: data.footerMessage }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `receipt-${config.receiptNumber}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Settings */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconReceipt className="size-4 text-primary-500" />Receipt Settings</h3>

            <label className="block text-xs text-gray-400">Business Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessName} onChange={(e) => setConfig((p) => ({ ...p, businessName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Phone</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessPhone} onChange={(e) => setConfig((p) => ({ ...p, businessPhone: e.target.value }))} />

            <label className="block text-xs text-gray-400">TPIN</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.tpin} onChange={(e) => setConfig((p) => ({ ...p, tpin: e.target.value }))} />

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-gray-400">Receipt #</label>
                <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.receiptNumber} onChange={(e) => setConfig((p) => ({ ...p, receiptNumber: e.target.value }))} />
              </div>
              <div>
                <label className="block text-xs text-gray-400">Date</label>
                <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.receiptDate} onChange={(e) => setConfig((p) => ({ ...p, receiptDate: e.target.value }))} />
              </div>
            </div>

            <label className="block text-xs text-gray-400">Customer</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.customerName} onChange={(e) => setConfig((p) => ({ ...p, customerName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Payment Method</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.paymentMethod} onChange={(e) => setConfig((p) => ({ ...p, paymentMethod: e.target.value }))}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Format</label>
            <div className="grid grid-cols-2 gap-1.5">
              {FORMATS.map((f) => (
                <button key={f.id} onClick={() => setConfig((p) => ({ ...p, format: f.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.format === f.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{f.name}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setConfig((p) => ({ ...p, template: t.id }))} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.name}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Primary Color</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
          </div>

          {/* Line Items */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-52 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Items</h3>
            {items.map((item, i) => (
              <div key={item.id} className="flex gap-1 items-center">
                <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Item" value={item.description} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], description: e.target.value }; setItems(it); }} />
                <input type="number" className="w-12 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-xs text-gray-900 dark:text-white text-center" value={item.quantity} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], quantity: Number(e.target.value) }; setItems(it); }} />
                <input type="number" className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-1 py-1 text-xs text-gray-900 dark:text-white text-right" value={item.price} onChange={(e) => { const it = [...items]; it[i] = { ...it[i], price: Number(e.target.value) }; setItems(it); }} />
                <button onClick={() => setItems((p) => p.filter((_, j) => j !== i))} className="text-xs text-red-500">×</button>
              </div>
            ))}
            <button onClick={() => setItems((p) => [...p, { id: uid(), description: "", quantity: 1, price: 0 }])} className="text-xs text-primary-500 hover:underline">+ Add Item</button>
            <div className="border-t border-gray-200 dark:border-gray-700 pt-2 text-xs space-y-1">
              <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmtMoney(subtotal, sym)}</span></div>
              <div className="flex justify-between text-gray-500"><span>VAT ({config.taxRate}%)</span><span>{fmtMoney(taxAmount, sym)}</span></div>
              <div className="flex justify-between font-bold text-gray-900 dark:text-white"><span>Total</span><span>{fmtMoney(total, sym)}</span></div>
            </div>
          </div>

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Receipt Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the sale (e.g. 'Grocery purchase at a Lusaka minimart')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Receipt"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(fmt.w, 400), height: Math.min(fmt.w, 400) * (fmt.h / fmt.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Receipt #{config.receiptNumber} — {fmt.w}×{fmt.h}px</p>
        </div>
      </div>
    </div>
  );
}
