"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconFileText,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type ProposalTemplate = "corporate" | "creative" | "consulting" | "tech" | "minimal" | "executive";

interface ProposalSection {
  id: string;
  type: "cover" | "exec-summary" | "scope" | "timeline" | "pricing" | "terms";
  title: string;
  content: string;
  enabled: boolean;
}

interface PricingItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
}

interface ProposalConfig {
  template: ProposalTemplate;
  primaryColor: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  clientName: string;
  clientCompany: string;
  projectTitle: string;
  proposalDate: string;
  validUntil: string;
  currency: string;
  currencySymbol: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: ProposalTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "creative", name: "Creative" },
  { id: "consulting", name: "Consulting" },
  { id: "tech", name: "Tech" },
  { id: "minimal", name: "Minimal" },
  { id: "executive", name: "Executive" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

function fmtMoney(amount: number, sym: string): string {
  return `${sym}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function defaultSections(): ProposalSection[] {
  return [
    { id: uid(), type: "cover", title: "Cover Page", content: "", enabled: true },
    { id: uid(), type: "exec-summary", title: "Executive Summary", content: "We are pleased to present this proposal for your consideration. Our team brings extensive experience and a proven track record of delivering exceptional results.", enabled: true },
    { id: uid(), type: "scope", title: "Scope of Work", content: "This section outlines the deliverables, milestones, and project boundaries agreed upon by both parties.", enabled: true },
    { id: uid(), type: "timeline", title: "Project Timeline", content: "Phase 1: Discovery & Planning (Week 1-2)\nPhase 2: Design & Development (Week 3-6)\nPhase 3: Testing & Review (Week 7-8)\nPhase 4: Launch & Handover (Week 9-10)", enabled: true },
    { id: uid(), type: "pricing", title: "Pricing", content: "", enabled: true },
    { id: uid(), type: "terms", title: "Terms & Conditions", content: "Payment: 50% upfront, 50% on completion.\nRevisions: Up to 3 rounds included.\nTimeline may vary based on feedback turnaround.\nAll prices quoted in Zambian Kwacha (ZMW) and include 16% VAT.", enabled: true },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function ProposalWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<ProposalConfig>({
    template: "corporate",
    primaryColor: "#1e40af",
    companyName: "DMSuite Solutions",
    companyAddress: "Plot 123, Cairo Road, Lusaka",
    companyPhone: "+260 977 123 456",
    clientName: "Client Contact",
    clientCompany: "Client Company Ltd",
    projectTitle: "Project Proposal",
    proposalDate: new Date().toISOString().slice(0, 10),
    validUntil: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: "ZMW",
    currencySymbol: "K",
    activeSection: 0,
    description: "",
  });

  const [sections, setSections] = useState<ProposalSection[]>(defaultSections());
  const [pricingItems, setPricingItems] = useState<PricingItem[]>([
    { id: uid(), description: "Consulting Services", quantity: 1, rate: 5000 },
    { id: uid(), description: "Design & Development", quantity: 1, rate: 15000 },
  ]);

  const pricingTotal = pricingItems.reduce((s, it) => s + it.quantity * it.rate, 0);
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

    const section = sections[config.activeSection];
    if (!section) return;

    function wrapText(text: string, x: number, y: number, mw: number, lh: number): number {
      const lines = text.split("\n");
      let cy = y;
      for (const ln of lines) {
        const words = ln.split(" ");
        let line = "";
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
        cy += lh;
      }
      return cy;
    }

    if (section.type === "cover") {
      /* Cover page */
      if (config.template === "corporate") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, H * 0.45);
        ctx.fillStyle = "#ffffff15";
        ctx.beginPath();
        ctx.arc(W - 60, H * 0.35, 120, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.template === "creative") {
        const grad = ctx.createLinearGradient(0, 0, W, H);
        grad.addColorStop(0, pc);
        grad.addColorStop(0.5, "#7c3aed");
        grad.addColorStop(1, "#111827");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H * 0.5);
      } else if (config.template === "executive") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = pc;
        ctx.fillRect(M, H * 0.38, CW, 4);
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 8);
      }

      const isDark = ["corporate", "creative", "executive"].includes(config.template);

      /* Project title */
      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 32px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.projectTitle, M, H * 0.25);

      /* PROPOSAL label */
      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `600 14px ${font}`;
      ctx.fillText("PROPOSAL", M, H * 0.18);

      /* Company info */
      ctx.fillStyle = isDark ? "#ffffffcc" : "#475569";
      ctx.font = `13px ${font}`;
      ctx.fillText(config.companyName, M, H * 0.32);

      /* Lower section */
      const infoY = H * 0.55;
      ctx.fillStyle = config.template === "executive" ? "#ffffff" : "#475569";
      ctx.font = `600 12px ${font}`;
      ctx.fillText("PREPARED FOR", M, infoY);
      ctx.font = `14px ${font}`;
      ctx.fillStyle = config.template === "executive" ? "#ffffffcc" : "#1e293b";
      ctx.fillText(config.clientName, M, infoY + 22);
      ctx.fillText(config.clientCompany, M, infoY + 40);

      ctx.fillStyle = config.template === "executive" ? "#ffffff" : "#475569";
      ctx.font = `600 12px ${font}`;
      ctx.fillText("PREPARED BY", M, infoY + 80);
      ctx.font = `14px ${font}`;
      ctx.fillStyle = config.template === "executive" ? "#ffffffcc" : "#1e293b";
      ctx.fillText(config.companyName, M, infoY + 102);
      ctx.fillText(config.companyAddress, M, infoY + 120);
      ctx.fillText(config.companyPhone, M, infoY + 138);

      /* Date info */
      ctx.fillStyle = config.template === "executive" ? "#ffffff80" : "#94a3b8";
      ctx.font = `11px ${font}`;
      ctx.fillText(`Date: ${config.proposalDate}  •  Valid until: ${config.validUntil}`, M, H - M);

      /* Bottom accent */
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 6, W, 6);

    } else if (section.type === "pricing") {
      /* Pricing page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 22px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      ctx.strokeStyle = pc + "30";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, M + 40);
      ctx.lineTo(W - M, M + 40);
      ctx.stroke();

      /* Table header */
      let y = M + 70;
      ctx.fillStyle = pc + "10";
      ctx.fillRect(M, y - 14, CW, 22);
      ctx.fillStyle = pc;
      ctx.font = `600 10px ${font}`;
      ctx.fillText("DESCRIPTION", M + 8, y);
      ctx.textAlign = "center";
      ctx.fillText("QTY", W - M - 150, y);
      ctx.fillText("RATE", W - M - 90, y);
      ctx.textAlign = "right";
      ctx.fillText("AMOUNT", W - M - 8, y);
      y += 20;

      /* Items */
      ctx.textAlign = "left";
      ctx.font = `12px ${font}`;
      for (const item of pricingItems) {
        ctx.fillStyle = "#1e293b";
        ctx.textAlign = "left";
        ctx.fillText(item.description, M + 8, y, 240);
        ctx.textAlign = "center";
        ctx.fillText(String(item.quantity), W - M - 150, y);
        ctx.fillText(fmtMoney(item.rate, sym), W - M - 90, y);
        ctx.textAlign = "right";
        ctx.fillText(fmtMoney(item.quantity * item.rate, sym), W - M - 8, y);
        y += 22;
      }

      /* Totals */
      y += 10;
      ctx.strokeStyle = "#e2e8f0";
      ctx.beginPath();
      ctx.moveTo(W - M - 200, y);
      ctx.lineTo(W - M, y);
      ctx.stroke();
      y += 20;

      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Subtotal", W - M - 200, y);
      ctx.textAlign = "right";
      ctx.fillText(fmtMoney(pricingTotal, sym), W - M - 8, y);
      y += 20;

      const vat = pricingTotal * 0.16;
      ctx.fillText(fmtMoney(vat, sym), W - M - 8, y);
      ctx.textAlign = "left";
      ctx.fillText("VAT (16%)", W - M - 200, y);
      y += 24;

      ctx.fillStyle = pc;
      ctx.fillRect(W - M - 200, y - 4, 200, 2);
      y += 12;
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 14px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Total", W - M - 200, y);
      ctx.textAlign = "right";
      ctx.fillText(fmtMoney(pricingTotal + vat, sym), W - M - 8, y);

      /* Page number */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.filter((s) => s.enabled).length}`, W / 2, H - 20);

    } else {
      /* Generic content section */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 22px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      ctx.strokeStyle = pc + "30";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, M + 40);
      ctx.lineTo(W - M, M + 40);
      ctx.stroke();

      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      wrapText(section.content, M, M + 65, CW, 18);

      /* Footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.companyName, M, H - 20);
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.filter((s) => s.enabled).length}`, W / 2, H - 20);
      ctx.textAlign = "right";
      ctx.fillText(config.projectTitle, W - M, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, sections, pricingItems, sym, pricingTotal]);

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
            content: `Generate a business proposal for: ${config.description}. Company: ${config.companyName}. Client: ${config.clientCompany}. Based in Lusaka, Zambia. Currency: ZMW. Return JSON: { "projectTitle": "", "sections": [{ "type": "exec-summary|scope|timeline|pricing|terms", "title": "", "content": "" }], "pricingItems": [{ "description": "", "quantity": 1, "rate": 0 }] }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.projectTitle) setConfig((p) => ({ ...p, projectTitle: data.projectTitle }));
        if (data.sections) {
          setSections((prev) => {
            const updated = [...prev];
            for (const ds of data.sections) {
              const idx = updated.findIndex((s) => s.type === ds.type);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], title: ds.title || updated[idx].title, content: ds.content || updated[idx].content };
              }
            }
            return updated;
          });
        }
        if (data.pricingItems) {
          setPricingItems(data.pricingItems.map((it: { description: string; quantity: number; rate: number }) => ({
            id: uid(), description: it.description, quantity: it.quantity || 1, rate: it.rate || 0,
          })));
        }
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  const moveSection = (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= sections.length) return;
    setSections((prev) => {
      const arr = [...prev];
      [arr[idx], arr[target]] = [arr[target], arr[idx]];
      return arr;
    });
    setConfig((p) => ({ ...p, activeSection: target }));
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `proposal-${sections[config.activeSection]?.type || "page"}.png`;
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
          {/* Company & Client */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconFileText className="size-4 text-primary-500" />Proposal Settings</h3>

            <label className="block text-xs text-gray-400">Project Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.projectTitle} onChange={(e) => setConfig((p) => ({ ...p, projectTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Your Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Client Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.clientCompany} onChange={(e) => setConfig((p) => ({ ...p, clientCompany: e.target.value }))} />

            <label className="block text-xs text-gray-400">Client Contact</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.clientName} onChange={(e) => setConfig((p) => ({ ...p, clientName: e.target.value }))} />

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

          {/* Sections */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-60 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sections</h3>
            {sections.map((sec, i) => (
              <div key={sec.id} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${config.activeSection === i ? "bg-primary-500/10 border border-primary-500/30" : "hover:bg-gray-50 dark:hover:bg-gray-800"}`} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))}>
                <input type="checkbox" checked={sec.enabled} onChange={(e) => { const s = [...sections]; s[i] = { ...s[i], enabled: e.target.checked }; setSections(s); }} className="rounded" />
                <span className="text-xs text-gray-700 dark:text-gray-300 flex-1">{sec.title}</span>
                <button onClick={(e) => { e.stopPropagation(); moveSection(i, -1); }} className="text-gray-400 hover:text-gray-600 text-xs">↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveSection(i, 1); }} className="text-gray-400 hover:text-gray-600 text-xs">↓</button>
              </div>
            ))}
          </div>

          {/* Section Content Editor */}
          {sections[config.activeSection] && sections[config.activeSection].type !== "cover" && sections[config.activeSection].type !== "pricing" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400">{sections[config.activeSection].title} Content</label>
              <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={5} value={sections[config.activeSection].content} onChange={(e) => { const s = [...sections]; s[config.activeSection] = { ...s[config.activeSection], content: e.target.value }; setSections(s); }} />
            </div>
          )}

          {/* Pricing Items */}
          {sections[config.activeSection]?.type === "pricing" && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pricing Items</h3>
              {pricingItems.map((item, i) => (
                <div key={item.id} className="space-y-1">
                  <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Description" value={item.description} onChange={(e) => { const p = [...pricingItems]; p[i] = { ...p[i], description: e.target.value }; setPricingItems(p); }} />
                  <div className="flex gap-1">
                    <input type="number" className="w-16 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Qty" value={item.quantity} onChange={(e) => { const p = [...pricingItems]; p[i] = { ...p[i], quantity: Number(e.target.value) }; setPricingItems(p); }} />
                    <input type="number" className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Rate" value={item.rate} onChange={(e) => { const p = [...pricingItems]; p[i] = { ...p[i], rate: Number(e.target.value) }; setPricingItems(p); }} />
                    <button onClick={() => setPricingItems((p) => p.filter((_, j) => j !== i))} className="px-2 text-xs text-red-500">×</button>
                  </div>
                </div>
              ))}
              <button onClick={() => setPricingItems((p) => [...p, { id: uid(), description: "", quantity: 1, rate: 0 }])} className="text-xs text-primary-500 hover:underline">+ Add Item</button>
            </div>
          )}

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Proposal Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the project (e.g. 'Website redesign for a Lusaka law firm')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Proposal"}
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
            <canvas ref={canvasRef} style={{ width: Math.min(PAGE_W, 500), height: Math.min(PAGE_W, 500) * (PAGE_H / PAGE_W) }} className="rounded-lg shadow-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            {sections.filter((s) => s.enabled).map((s, i) => (
              <button key={s.id} onClick={() => setConfig((p) => ({ ...p, activeSection: sections.indexOf(s) }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${sections.indexOf(s) === config.activeSection ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Proposal — {sections[config.activeSection]?.title} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
