"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { IconSparkles, IconWand, IconLoader, IconDownload, IconDroplet, IconFileText, IconBriefcase } from "@/components/icons";
import { cleanAIText, roundRect, hexToRgba, getCanvasFont, wrapCanvasText } from "@/lib/canvas-utils";
import { drawProText, drawProDivider, drawTable, generateColorPalette, exportHighRes, EXPORT_PRESETS } from "@/lib/ai-design-engine";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { Accordion, AccordionSection } from "@/components/ui";

/* ── Types ─────────────────────────────────────────────────── */

type SOATemplate = "corporate" | "minimal" | "bold" | "striped" | "elegant" | "modern";

interface Transaction {
  date: string; description: string; debit: number; credit: number;
}

interface SOAConfig {
  template: SOATemplate;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  clientName: string;
  clientAddress: string;
  accountNumber: string;
  statementPeriod: string;
  openingBalance: number;
  currency: string;
  transactions: Transaction[];
  description: string;
}

const TEMPLATES: { id: SOATemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" }, { id: "minimal", name: "Minimal" },
  { id: "bold", name: "Bold" }, { id: "striped", name: "Striped" },
  { id: "elegant", name: "Elegant" }, { id: "modern", name: "Modern" },
];

const CURRENCIES = ["ZMW", "USD", "EUR", "GBP", "ZAR", "BWP", "KES"];
const COLOR_PRESETS = ["#1e3a5f", "#2d3436", "#0f4c75", "#3c1361", "#0d7377", "#6c5ce7", "#8ae600", "#06b6d4", "#e74c3c"];

const defaultTransactions: Transaction[] = [
  { date: "01 Dec 2025", description: "Opening Balance", debit: 0, credit: 0 },
  { date: "03 Dec 2025", description: "Invoice #INV-4501", debit: 15000, credit: 0 },
  { date: "08 Dec 2025", description: "Payment Received — Thank You", debit: 0, credit: 10000 },
  { date: "12 Dec 2025", description: "Invoice #INV-4520", debit: 8500, credit: 0 },
  { date: "20 Dec 2025", description: "Bank Transfer", debit: 0, credit: 5000 },
  { date: "28 Dec 2025", description: "Invoice #INV-4535 — Consulting", debit: 12000, credit: 0 },
];

/* ── Component ───────────────────────────────────────────── */

export default function StatementOfAccountWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<SOAConfig>({
    template: "corporate", primaryColor: "#1e3a5f",
    companyName: "Katanga Financial Services", companyAddress: "Plot 15 Cairo Road, Lusaka, Zambia\nTel: +260 211 234 567\naccounts@katangafs.co.zm",
    clientName: "Mwila Enterprises Ltd", clientAddress: "Stand 204, Industrial Area\nNdola, Zambia",
    accountNumber: "ACC-2025-00473", statementPeriod: "1 December – 31 December 2025",
    openingBalance: 5200, currency: "ZMW",
    transactions: defaultTransactions, description: "",
  });

  const updateConfig = useCallback((p: Partial<SOAConfig>) => setConfig((prev) => ({ ...prev, ...p })), []);

  const PAGE_W = 595, PAGE_H = 842;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = PAGE_W * 2; canvas.height = PAGE_H * 2;
    ctx.scale(2, 2); ctx.clearRect(0, 0, PAGE_W, PAGE_H);

    const { primaryColor, template, currency, transactions, openingBalance } = config;
    const pal = generateColorPalette(primaryColor);
    const m = 40;

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, PAGE_W, PAGE_H);

    // Header
    ctx.fillStyle = primaryColor;
    const hdrH = template === "bold" ? 90 : 70;
    ctx.fillRect(0, 0, PAGE_W, hdrH);

    // Company name on header
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(700, 18, "modern");
    ctx.textAlign = "left";
    ctx.fillText(config.companyName, m, template === "bold" ? 38 : 30);

    ctx.fillStyle = hexToRgba("#ffffff", 0.7);
    ctx.font = getCanvasFont(400, 8, "modern");
    const addrLines = config.companyAddress.split("\n");
    addrLines.forEach((l, i) => ctx.fillText(l, m, (template === "bold" ? 55 : 45) + i * 12));

    // STATEMENT title
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(800, 14, "modern");
    ctx.textAlign = "right";
    ctx.fillText("STATEMENT OF ACCOUNT", PAGE_W - m, template === "bold" ? 38 : 30);

    ctx.fillStyle = hexToRgba("#ffffff", 0.7);
    ctx.font = getCanvasFont(400, 9, "modern");
    ctx.fillText(`Account: ${config.accountNumber}`, PAGE_W - m, (template === "bold" ? 55 : 45));
    ctx.fillText(`Period: ${config.statementPeriod}`, PAGE_W - m, (template === "bold" ? 67 : 57));

    // Client box
    let y = hdrH + 20;
    ctx.fillStyle = hexToRgba(primaryColor, 0.05);
    roundRect(ctx, m, y, PAGE_W - 2 * m, 55, 4);
    ctx.fill();

    ctx.textAlign = "left";
    ctx.fillStyle = hexToRgba(primaryColor, 0.5);
    ctx.font = getCanvasFont(600, 8, "modern");
    ctx.fillText("BILL TO", m + 12, y + 16);

    ctx.fillStyle = "#1a1a2e";
    ctx.font = getCanvasFont(600, 11, "modern");
    ctx.fillText(config.clientName, m + 12, y + 30);

    ctx.fillStyle = "#666";
    ctx.font = getCanvasFont(400, 8, "modern");
    const cLines = config.clientAddress.split("\n");
    cLines.forEach((l, i) => ctx.fillText(l, m + 12, y + 42 + i * 11));

    // Transaction table
    y += 70;
    const colWidths = [70, 210, 70, 70, 80];
    const headers = ["Date", "Description", "Debit", "Credit", "Balance"];

    // Table header
    ctx.fillStyle = primaryColor;
    ctx.fillRect(m, y, PAGE_W - 2 * m, 22);
    ctx.fillStyle = "#ffffff";
    ctx.font = getCanvasFont(600, 8, "modern");
    ctx.textAlign = "left";
    let xOff = m + 8;
    headers.forEach((h, i) => {
      ctx.textAlign = i >= 2 ? "right" : "left";
      const cx = i >= 2 ? xOff + colWidths[i] - 8 : xOff + 4;
      ctx.fillText(h, cx, y + 14);
      xOff += colWidths[i];
    });

    y += 22;

    // Calculate running balance
    let balance = openingBalance;
    const rows: string[][] = [];

    // Opening balance row
    rows.push(["", "Opening Balance", "", "", `${currency} ${balance.toLocaleString("en", { minimumFractionDigits: 2 })}`]);

    transactions.forEach((t) => {
      balance += t.debit - t.credit;
      rows.push([
        t.date, t.description,
        t.debit > 0 ? `${currency} ${t.debit.toLocaleString("en", { minimumFractionDigits: 2 })}` : "",
        t.credit > 0 ? `${currency} ${t.credit.toLocaleString("en", { minimumFractionDigits: 2 })}` : "",
        `${currency} ${balance.toLocaleString("en", { minimumFractionDigits: 2 })}`,
      ]);
    });

    // Draw rows
    rows.forEach((row, ri) => {
      if (template === "striped" && ri % 2 === 0) {
        ctx.fillStyle = hexToRgba(primaryColor, 0.04);
        ctx.fillRect(m, y, PAGE_W - 2 * m, 20);
      }
      ctx.fillStyle = "#333";
      ctx.font = getCanvasFont(400, 8, "modern");
      let rxOff = m + 8;
      row.forEach((cell, ci) => {
        ctx.textAlign = ci >= 2 ? "right" : "left";
        const cx = ci >= 2 ? rxOff + colWidths[ci] - 8 : rxOff + 4;
        ctx.fillText(cell, cx, y + 13);
        rxOff += colWidths[ci];
      });

      // Row border
      ctx.strokeStyle = hexToRgba(primaryColor, 0.1);
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(m, y + 20);
      ctx.lineTo(PAGE_W - m, y + 20);
      ctx.stroke();
      y += 20;
    });

    // Totals row
    y += 4;
    ctx.fillStyle = hexToRgba(primaryColor, 0.1);
    ctx.fillRect(m, y, PAGE_W - 2 * m, 26);

    ctx.fillStyle = primaryColor;
    ctx.font = getCanvasFont(700, 10, "modern");
    ctx.textAlign = "left";
    ctx.fillText("Closing Balance", m + 12, y + 17);

    ctx.textAlign = "right";
    ctx.fillText(`${currency} ${balance.toLocaleString("en", { minimumFractionDigits: 2 })}`, PAGE_W - m - 12, y + 17);

    // Payment status
    y += 45;
    const amountDue = balance;
    const statusColor = amountDue > 0 ? "#e74c3c" : "#27ae60";
    const statusText = amountDue > 0 ? "AMOUNT DUE" : "ACCOUNT SETTLED";

    ctx.textAlign = "center";
    ctx.fillStyle = hexToRgba(statusColor, 0.1);
    roundRect(ctx, PAGE_W / 2 - 100, y, 200, 40, 6);
    ctx.fill();

    ctx.fillStyle = statusColor;
    ctx.font = getCanvasFont(700, 8, "modern");
    ctx.fillText(statusText, PAGE_W / 2, y + 16);
    ctx.font = getCanvasFont(700, 14, "modern");
    ctx.fillText(`${currency} ${Math.abs(amountDue).toLocaleString("en", { minimumFractionDigits: 2 })}`, PAGE_W / 2, y + 33);

    // Footer
    ctx.fillStyle = primaryColor;
    ctx.fillRect(0, PAGE_H - 30, PAGE_W, 30);
    ctx.fillStyle = hexToRgba("#ffffff", 0.7);
    ctx.font = getCanvasFont(400, 7, "modern");
    ctx.textAlign = "center";
    ctx.fillText("This is a computer-generated statement. Please contact us for any discrepancies.", PAGE_W / 2, PAGE_H - 14);
  }, [config, PAGE_W, PAGE_H]);

  useEffect(() => { renderCanvas(); }, [renderCanvas]);

  const handleAIGenerate = useCallback(async () => {
    if (!config.description.trim() || isGenerating) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: `Generate statement of account data for: "${config.description}". Return JSON: { "companyName": "", "clientName": "", "accountNumber": "", "statementPeriod": "", "openingBalance": 0, "transactions": [{ "date": "", "description": "", "debit": 0, "credit": 0 }] }. Use realistic business transactions with ZMW amounts.` }] }),
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
    exportHighRes(canvas, EXPORT_PRESETS[preset] || EXPORT_PRESETS["web-standard"], "statement-of-account");
  }, []);

  const addTransaction = useCallback(() => {
    updateConfig({ transactions: [...config.transactions, { date: "", description: "", debit: 0, credit: 0 }] });
  }, [config.transactions, updateConfig]);

  const updateTransaction = useCallback((i: number, field: keyof Transaction, value: string | number) => {
    const updated = [...config.transactions];
    updated[i] = { ...updated[i], [field]: value };
    updateConfig({ transactions: updated });
  }, [config.transactions, updateConfig]);

  const removeTransaction = useCallback((i: number) => {
    updateConfig({ transactions: config.transactions.filter((_, idx) => idx !== i) });
  }, [config.transactions, updateConfig]);

  const templatePreviews: TemplatePreview[] = TEMPLATES.map((t) => ({
    id: t.id, label: t.name,
    render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
      ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = config.primaryColor;
      ctx.fillRect(0, 0, w, h * 0.15);
      ctx.fillStyle = hexToRgba(config.primaryColor, 0.1);
      for (let i = 0; i < 5; i++) { ctx.fillRect(w * 0.1, h * 0.25 + i * h * 0.1, w * 0.8, h * 0.06); }
    },
  }));

  const leftPanel = (
    <Accordion defaultOpen="ai">
      <AccordionSection id="ai" icon={<IconSparkles className="size-3.5" />} label="AI Generate">
        <textarea value={config.description} onChange={(e) => updateConfig({ description: e.target.value })}
          placeholder="Describe the statement… e.g., 'Monthly account statement for a retail client showing purchases and payments'"
          className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-900 dark:text-white placeholder-gray-400 resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={3} />
        <button onClick={handleAIGenerate} disabled={isGenerating || !config.description.trim()}
          className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate</>}
        </button>
      </AccordionSection>

      <AccordionSection id="company" icon={<IconFileText className="size-3.5" />} label="Company Details">
        <div className="space-y-2">
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Company Name</label>
            <input type="text" value={config.companyName} onChange={(e) => updateConfig({ companyName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Address</label>
            <textarea value={config.companyAddress} onChange={(e) => updateConfig({ companyAddress: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white resize-none focus:outline-none focus:ring-1 focus:ring-primary-500" rows={2} /></div>
        </div>
      </AccordionSection>

      <AccordionSection id="client" icon={<IconFileText className="size-3.5" />} label="Client Details">
        <div className="space-y-2">
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Client</label>
            <input type="text" value={config.clientName} onChange={(e) => updateConfig({ clientName: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Account #</label>
            <input type="text" value={config.accountNumber} onChange={(e) => updateConfig({ accountNumber: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
          <div><label className="text-[10px] font-semibold text-gray-500 uppercase">Period</label>
            <input type="text" value={config.statementPeriod} onChange={(e) => updateConfig({ statementPeriod: e.target.value })}
              className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500" /></div>
        </div>
      </AccordionSection>

      <AccordionSection id="transactions" icon={<IconBriefcase className="size-3.5" />} label={`Transactions (${config.transactions.length})`}>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {config.transactions.map((t, i) => (
            <div key={i} className="p-2 bg-gray-50 dark:bg-gray-800/50 rounded-lg space-y-1">
              <div className="flex gap-1.5">
                <input type="text" value={t.date} onChange={(e) => updateTransaction(i, "date", e.target.value)} placeholder="Date"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" />
                <button onClick={() => removeTransaction(i)} className="text-red-400 hover:text-red-300 text-xs px-1">×</button>
              </div>
              <input type="text" value={t.description} onChange={(e) => updateTransaction(i, "description", e.target.value)} placeholder="Description"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" />
              <div className="flex gap-1.5">
                <input type="number" value={t.debit || ""} onChange={(e) => updateTransaction(i, "debit", parseFloat(e.target.value) || 0)} placeholder="Debit"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" />
                <input type="number" value={t.credit || ""} onChange={(e) => updateTransaction(i, "credit", parseFloat(e.target.value) || 0)} placeholder="Credit"
                  className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded px-1.5 py-1 text-[10px] text-gray-900 dark:text-white" />
              </div>
            </div>
          ))}
          <button onClick={addTransaction} className="w-full py-1.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 text-xs text-gray-500 hover:text-primary-500 hover:border-primary-500 transition-colors">+ Add Transaction</button>
        </div>
      </AccordionSection>

      <AccordionSection id="style" icon={<IconDroplet className="size-3.5" />} label="Style">
        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Currency</label>
            <div className="flex flex-wrap gap-1 mt-1">
              {CURRENCIES.map((c) => (<button key={c} onClick={() => updateConfig({ currency: c })}
                className={`px-2 py-1 rounded text-[10px] font-medium transition-colors ${config.currency === c ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>{c}</button>))}
            </div>
          </div>
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase">Color</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {COLOR_PRESETS.map((c) => (<button key={c} onClick={() => updateConfig({ primaryColor: c })}
                className={`size-6 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
            </div>
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
      leftPanel={leftPanel} rightPanel={<TemplateSlider templates={templatePreviews} activeId={config.template} onSelect={(id) => updateConfig({ template: id as SOATemplate })} />}
      zoom={zoom} onZoomIn={() => setZoom((z) => Math.min(z + 0.1, 2))} onZoomOut={() => setZoom((z) => Math.max(z - 0.1, 0.5))} onZoomFit={() => setZoom(1)}
      label="Statement of Account — A4 Portrait (595×842)" />
  );
}
