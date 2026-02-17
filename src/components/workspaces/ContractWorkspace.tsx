"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconShield,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

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
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

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
  }, [config, clauses, pageCount]);

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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconShield className="size-4 text-primary-500" />Contract Settings</h3>

            <label className="block text-xs text-gray-400">Contract Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.contractTitle} onChange={(e) => setConfig((p) => ({ ...p, contractTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Effective Date</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.effectiveDate} onChange={(e) => setConfig((p) => ({ ...p, effectiveDate: e.target.value }))} />

            <label className="block text-xs text-gray-400 mt-2">Party A</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Company name" value={config.partyA.name} onChange={(e) => setConfig((p) => ({ ...p, partyA: { ...p.partyA, name: e.target.value } }))} />
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Address" value={config.partyA.address} onChange={(e) => setConfig((p) => ({ ...p, partyA: { ...p.partyA, address: e.target.value } }))} />

            <label className="block text-xs text-gray-400 mt-2">Party B</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Company name" value={config.partyB.name} onChange={(e) => setConfig((p) => ({ ...p, partyB: { ...p.partyB, name: e.target.value } }))} />
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 text-xs text-gray-900 dark:text-white" placeholder="Address" value={config.partyB.address} onChange={(e) => setConfig((p) => ({ ...p, partyB: { ...p.partyB, address: e.target.value } }))} />

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-3 gap-1.5">
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

          {/* Clause Library */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Clause Library</h3>
            {clauses.map((clause, i) => (
              <div key={clause.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                <input type="checkbox" checked={clause.enabled} onChange={(e) => { const c = [...clauses]; c[i] = { ...c[i], enabled: e.target.checked }; setClauses(c); }} className="rounded" />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{clause.title}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{clause.category}</span>
              </div>
            ))}
          </div>

          {/* Clause Editor */}
          {clauses[0] && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-48 overflow-y-auto">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit Clauses</h3>
              {clauses.filter((c) => c.enabled).map((clause) => {
                const idx = clauses.indexOf(clause);
                return (
                  <div key={clause.id} className="space-y-1">
                    <label className="text-xs text-gray-400 font-medium">{clause.title}</label>
                    <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white resize-none" rows={2} value={clause.content} onChange={(e) => { const c = [...clauses]; c[idx] = { ...c[idx], content: e.target.value }; setClauses(c); }} />
                  </div>
                );
              })}
            </div>
          )}

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Contract Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the deal (e.g. 'NDA between two Lusaka tech companies')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Clauses"}
            </button>
            <p className="text-[10px] text-gray-400">⚠ AI-generated clauses are templates only. Always consult a qualified legal professional.</p>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* Canvas */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(PAGE_W, 500), height: Math.min(PAGE_W, 500) * (PAGE_H / PAGE_W) }} className="rounded-lg shadow-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {Array.from({ length: pageCount }, (_, i) => (
              <button key={i} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Contract — Page {config.activeSection + 1} of {pageCount} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
