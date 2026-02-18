"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconShield,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconCopy,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type ContractTemplate = "standard" | "nda" | "employment" | "service" | "partnership" | "freelance";

interface ContractClause {
  id: string;
  title: string;
  content: string;
  enabled: boolean;
  category: "nda" | "non-compete" | "payment" | "liability" | "ip" | "general" | "termination";
}

interface PartyDetails {
  name: string;
  address: string;
  representative: string;
  title: string;
}

interface ContractConfig {
  template: ContractTemplate;
  primaryColor: string;
  contractTitle: string;
  effectiveDate: string;
  partyA: PartyDetails;
  partyB: PartyDetails;
  jurisdiction: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: ContractTemplate; name: string }[] = [
  { id: "standard", name: "Standard" },
  { id: "nda", name: "NDA" },
  { id: "employment", name: "Employment" },
  { id: "service", name: "Service" },
  { id: "partnership", name: "Partnership" },
  { id: "freelance", name: "Freelance" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultClauses(): ContractClause[] {
  return [
    { id: uid(), title: "Definitions", content: "In this Agreement, unless the context otherwise requires, the following terms shall have the meanings ascribed to them.", category: "general", enabled: true },
    { id: uid(), title: "Confidentiality (NDA)", content: "Each party agrees to hold in strict confidence all Confidential Information received from the other party. Confidential Information shall not be disclosed to any third party without prior written consent.", category: "nda", enabled: true },
    { id: uid(), title: "Non-Compete", content: "During the term of this Agreement and for a period of 12 months thereafter, neither party shall engage in any business that directly competes with the other party within the Republic of Zambia.", category: "non-compete", enabled: true },
    { id: uid(), title: "Payment Terms", content: "Payment shall be made in Zambian Kwacha (ZMW) within 30 days of invoice date. Late payments shall incur interest at 2% per month. All amounts are exclusive of VAT at 16%.", category: "payment", enabled: true },
    { id: uid(), title: "Limitation of Liability", content: "Neither party shall be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with this Agreement, except in cases of gross negligence or willful misconduct.", category: "liability", enabled: true },
    { id: uid(), title: "Intellectual Property", content: "All intellectual property created during the course of this Agreement shall remain the property of the creating party unless expressly transferred in writing. Pre-existing IP remains with the original owner.", category: "ip", enabled: true },
    { id: uid(), title: "Termination", content: "Either party may terminate this Agreement with 30 days written notice. Upon termination, all obligations cease except those which by their nature survive termination.", category: "termination", enabled: true },
    { id: uid(), title: "Governing Law", content: "This Agreement shall be governed by and construed in accordance with the Laws of the Republic of Zambia. Any disputes arising shall be submitted to the jurisdiction of the courts of Lusaka.", category: "general", enabled: true },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function ContractWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<ContractConfig>({
    template: "standard",
    primaryColor: "#1e40af",
    contractTitle: "Service Agreement",
    effectiveDate: new Date().toISOString().slice(0, 10),
    partyA: { name: "DMSuite Solutions Ltd", address: "Plot 123, Cairo Road, Lusaka", representative: "Managing Director", title: "Director" },
    partyB: { name: "Client Company Ltd", address: "Plot 456, Great East Road, Lusaka", representative: "CEO", title: "Chief Executive" },
    jurisdiction: "Republic of Zambia",
    activeSection: 0,
    description: "",
  });

  const [clauses, setClauses] = useState<ContractClause[]>(defaultClauses());

  /* Sections: cover, clauses pages, signature page */
  const pageCount = 2 + Math.ceil(clauses.filter((c) => c.enabled).length / 4);

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
    const M = 50;
    const CW = W - M * 2;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    function wrapText(text: string, x: number, y: number, mw: number, lh: number): number {
      const words = text.split(" ");
      let line = "";
      let cy = y;
      for (const word of words) {
        const test = line + word + " ";
        if (ctx.measureText(test).width > mw && line) {
          if (cy > H - M) return cy;
          ctx.fillText(line.trim(), x, cy, mw);
          line = word + " ";
          cy += lh;
        } else { line = test; }
      }
      if (cy <= H - M) ctx.fillText(line.trim(), x, cy, mw);
      return cy + lh;
    }

    if (config.activeSection === 0) {
      /* Cover page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 8);
      ctx.fillRect(0, H - 8, W, 8);

      /* Decorative border */
      ctx.strokeStyle = pc + "30";
      ctx.lineWidth = 1;
      ctx.strokeRect(M - 10, M - 10, CW + 20, H - M * 2 + 20);

      /* Title */
      ctx.fillStyle = pc;
      ctx.font = `bold 12px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("CONFIDENTIAL", W / 2, M + 30);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 28px ${font}`;
      ctx.fillText(config.contractTitle.toUpperCase(), W / 2, M + 80);

      ctx.strokeStyle = pc;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, M + 95);
      ctx.lineTo(W / 2 + 60, M + 95);
      ctx.stroke();

      /* Parties */
      let y = M + 150;
      ctx.fillStyle = "#475569";
      ctx.font = `600 11px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("BETWEEN", M, y);
      y += 25;
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 14px ${font}`;
      ctx.fillText(config.partyA.name, M, y);
      ctx.font = `12px ${font}`;
      ctx.fillStyle = "#64748b";
      y += 18;
      ctx.fillText(config.partyA.address, M, y);
      y += 18;
      ctx.fillText(`Represented by: ${config.partyA.representative}`, M, y);

      y += 40;
      ctx.fillStyle = "#475569";
      ctx.font = `600 11px ${font}`;
      ctx.fillText("AND", M, y);
      y += 25;
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 14px ${font}`;
      ctx.fillText(config.partyB.name, M, y);
      ctx.font = `12px ${font}`;
      ctx.fillStyle = "#64748b";
      y += 18;
      ctx.fillText(config.partyB.address, M, y);
      y += 18;
      ctx.fillText(`Represented by: ${config.partyB.representative}`, M, y);

      /* Effective date */
      y += 50;
      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      ctx.fillText(`Effective Date: ${config.effectiveDate}`, M, y);
      y += 18;
      ctx.fillText(`Jurisdiction: ${config.jurisdiction}`, M, y);

      /* Disclaimer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `italic 9px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("This document is for reference purposes. Seek independent legal advice before signing.", W / 2, H - M - 10);
      ctx.fillText("Generated by DMSuite — Not a substitute for professional legal counsel.", W / 2, H - M + 4);

    } else if (config.activeSection >= pageCount - 1) {
      /* Signature page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("SIGNATURES", W / 2, M + 30);

      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("IN WITNESS WHEREOF, the parties have executed this Agreement as of the date first written above.", W / 2, M + 60);

      /* Party A signature block */
      let y = M + 120;
      ctx.textAlign = "left";
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 13px ${font}`;
      ctx.fillText(`For and on behalf of ${config.partyA.name}:`, M, y);
      y += 50;
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(M + 200, y);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = `10px ${font}`;
      ctx.fillText("Signature", M, y + 14);
      ctx.fillText("Date: _______________", M + 250, y + 14);

      y += 30;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(M + 200, y);
      ctx.stroke();
      ctx.fillText("Name & Title", M, y + 14);

      /* Party B signature block */
      y += 80;
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 13px ${font}`;
      ctx.fillText(`For and on behalf of ${config.partyB.name}:`, M, y);
      y += 50;
      ctx.strokeStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(M + 200, y);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = `10px ${font}`;
      ctx.fillText("Signature", M, y + 14);
      ctx.fillText("Date: _______________", M + 250, y + 14);

      y += 30;
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(M + 200, y);
      ctx.stroke();
      ctx.fillText("Name & Title", M, y + 14);

      /* Witness */
      y += 80;
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 12px ${font}`;
      ctx.fillText("WITNESS:", M, y);
      y += 40;
      ctx.strokeStyle = "#1e293b";
      ctx.beginPath();
      ctx.moveTo(M, y);
      ctx.lineTo(M + 200, y);
      ctx.stroke();
      ctx.fillStyle = "#64748b";
      ctx.font = `10px ${font}`;
      ctx.fillText("Signature", M, y + 14);

      /* Footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText("⚠ LEGAL DISCLAIMER: This is a template. Consult a qualified attorney for legally binding agreements.", W / 2, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 6, W, 6);
    } else {
      /* Clauses page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      const enabledClauses = clauses.filter((c) => c.enabled);
      const startIdx = (config.activeSection - 1) * 4;
      const pageClauses = enabledClauses.slice(startIdx, startIdx + 4);

      let y = M + 20;
      for (let i = 0; i < pageClauses.length; i++) {
        const clause = pageClauses[i];
        const num = startIdx + i + 1;

        if (y > H - M - 30) break;

        /* Section number + title */
        ctx.fillStyle = pc;
        ctx.font = `bold 13px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(`${num}. ${clause.title}`, M, y);
        y += 20;

        /* Content */
        ctx.fillStyle = "#475569";
        ctx.font = `11px ${font}`;
        y = wrapText(clause.content, M, y, CW, 16);
        y += 16;
      }

      /* Footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${pageCount}`, W / 2, H - 20);
      ctx.textAlign = "left";
      ctx.fillText(config.contractTitle, M, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, clauses, pageCount, advancedSettings]);

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
            content: `Generate contract clauses for: ${config.description}. Parties: ${config.partyA.name} and ${config.partyB.name}. Jurisdiction: ${config.jurisdiction}. Template: ${config.template}. Based in Lusaka, Zambia. Return JSON: { "contractTitle": "", "clauses": [{ "title": "", "content": "", "category": "nda|non-compete|payment|liability|ip|general|termination" }] }. Include legal disclaimer that this is a template only.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.contractTitle) setConfig((p) => ({ ...p, contractTitle: data.contractTitle }));
        if (data.clauses) {
          setClauses(data.clauses.map((c: { title: string; content: string; category: string }) => ({
            id: uid(), title: c.title, content: c.content, category: c.category || "general", enabled: true,
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
    link.download = `contract-page-${config.activeSection + 1}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(0.75);
  const displayWidth = PAGE_W * zoom;
  const displayHeight = PAGE_H * zoom;

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => TEMPLATES.map((t) => ({
      id: t.id,
      label: t.name,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);

        /* Top accent bar */
        ctx.fillStyle = config.primaryColor;
        ctx.fillRect(0, 0, w, 3);
        ctx.fillRect(0, h - 3, w, 3);

        /* Title */
        ctx.fillStyle = config.primaryColor;
        ctx.font = "bold 8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(t.name.toUpperCase(), w / 2, h * 0.35);

        /* Lines to simulate text */
        ctx.fillStyle = "#e2e8f0";
        for (let i = 0; i < 3; i++) {
          const lw = w * (0.5 + Math.random() * 0.3);
          ctx.fillRect((w - lw) / 2, h * 0.48 + i * 8, lw, 3);
        }

        /* Signature line */
        ctx.strokeStyle = "#94a3b8";
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(w * 0.25, h * 0.82);
        ctx.lineTo(w * 0.75, h * 0.82);
        ctx.stroke();
      },
    })),
    [config.primaryColor]
  );

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-3">
      {/* AI Contract Generator */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />AI Contract Generator
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe the deal (e.g. 'NDA between two Lusaka tech companies')..."
          value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))}
        />
        <button onClick={generateAI} disabled={loading || !config.description.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Clauses</>}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">⚠ AI-generated clauses are templates only. Consult a qualified legal professional.</p>
      </div>

      {/* Template Slider */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Templates</h3>
        <TemplateSlider
          templates={templatePreviews}
          activeId={config.template}
          onSelect={(id) => setConfig((p) => ({ ...p, template: id as ContractTemplate }))}
          thumbWidth={140}
          thumbHeight={100}
          label=""
        />
      </div>

      {/* Contract Settings */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1.5"><IconShield className="size-3.5 text-primary-500" />Contract Settings</h3>

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Contract Title</label>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.contractTitle} onChange={(e) => setConfig((p) => ({ ...p, contractTitle: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block">Effective Date</label>
        <input type="date" className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" value={config.effectiveDate} onChange={(e) => setConfig((p) => ({ ...p, effectiveDate: e.target.value }))} />

        <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 block mt-1">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 transition-all ${config.primaryColor === c ? "border-white scale-110 ring-1 ring-primary-500/30" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* Clause Library */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2 max-h-64 overflow-y-auto">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Clause Library</h3>
        {clauses.map((clause, i) => (
          <div key={clause.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
            <input type="checkbox" checked={clause.enabled} onChange={(e) => { const c = [...clauses]; c[i] = { ...c[i], enabled: e.target.checked }; setClauses(c); }} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
            <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{clause.title}</span>
            <span className="text-[0.5625rem] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{clause.category}</span>
          </div>
        ))}
      </div>
    </div>
  );

  /* ── Right Panel ────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      {/* Party Details */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2">
        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Party A</h3>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" placeholder="Company name" value={config.partyA.name} onChange={(e) => setConfig((p) => ({ ...p, partyA: { ...p.partyA, name: e.target.value } }))} />
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" placeholder="Address" value={config.partyA.address} onChange={(e) => setConfig((p) => ({ ...p, partyA: { ...p.partyA, address: e.target.value } }))} />

        <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mt-2">Party B</h3>
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" placeholder="Company name" value={config.partyB.name} onChange={(e) => setConfig((p) => ({ ...p, partyB: { ...p.partyB, name: e.target.value } }))} />
        <input className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" placeholder="Address" value={config.partyB.address} onChange={(e) => setConfig((p) => ({ ...p, partyB: { ...p.partyB, address: e.target.value } }))} />
      </div>

      {/* Clause Editor */}
      {clauses[0] && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3 space-y-2 max-h-64 overflow-y-auto">
          <h3 className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Edit Clauses</h3>
          {clauses.filter((c) => c.enabled).map((clause) => {
            const idx = clauses.indexOf(clause);
            return (
              <div key={clause.id} className="space-y-1">
                <label className="text-[0.5625rem] font-semibold uppercase tracking-wider text-gray-400">{clause.title}</label>
                <textarea className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" rows={2} value={clause.content} onChange={(e) => { const c = [...clauses]; c[idx] = { ...c[idx], content: e.target.value }; setClauses(c); }} />
              </div>
            );
          })}
        </div>
      )}

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />

      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportPNG} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
            <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
          </button>
          <button onClick={handleCopy} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
            <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Contract Info</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>Template: <span className="text-gray-300 capitalize">{config.template}</span></p>
          <p>Pages: <span className="text-gray-300">{pageCount}</span></p>
          <p>Jurisdiction: <span className="text-gray-300">{config.jurisdiction}</span></p>
          <p>Resolution: <span className="text-gray-300">{PAGE_W}×{PAGE_H}px</span></p>
        </div>
      </div>
    </div>
  );

  /* ── Toolbar ────────────────────────────────────────────── */
  const toolbar = (
    <div className="flex items-center gap-2">
      <IconShield className="size-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.template}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">Page {config.activeSection + 1}/{pageCount}</span>
      <span className="text-gray-600">·</span>
      <div className="flex items-center gap-1">
        {Array.from({ length: pageCount }, (_, i) => (
          <button key={i} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-2 py-0.5 rounded text-[0.625rem] font-medium transition-colors ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"}`}>{i + 1}</button>
        ))}
      </div>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`Contract — ${config.template} — Page ${config.activeSection + 1}/${pageCount} — ${PAGE_W}×${PAGE_H}px`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(0.75)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
            <IconDownload className="size-3" />Download PNG
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
      }
    />
  );
}
