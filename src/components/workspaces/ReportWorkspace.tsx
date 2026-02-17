"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconChart,
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
} from "@/components/icons";
import { cleanAIText } from "@/lib/canvas-utils";

/* ── Types ─────────────────────────────────────────────────── */

type ReportTemplate = "corporate" | "research" | "financial" | "marketing" | "technical" | "executive";
type SectionType = "cover" | "toc" | "exec-summary" | "body" | "chart" | "table" | "appendix";
type ChartType = "bar" | "pie";

interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  content: string;
  chartType?: ChartType;
  chartData?: { label: string; value: number }[];
  tableData?: string[][];
}

interface ReportConfig {
  template: ReportTemplate;
  primaryColor: string;
  companyName: string;
  reportTitle: string;
  subtitle: string;
  author: string;
  date: string;
  activeSection: number;
  description: string;
}

const TEMPLATES: { id: ReportTemplate; name: string }[] = [
  { id: "corporate", name: "Corporate" },
  { id: "research", name: "Research" },
  { id: "financial", name: "Financial" },
  { id: "marketing", name: "Marketing" },
  { id: "technical", name: "Technical" },
  { id: "executive", name: "Executive" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const PAGE_W = 595;
const PAGE_H = 842;

function uid() { return Math.random().toString(36).slice(2, 10); }

const CHART_COLORS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

function defaultSections(): ReportSection[] {
  return [
    { id: uid(), type: "cover", title: "Cover Page", content: "" },
    { id: uid(), type: "toc", title: "Table of Contents", content: "" },
    { id: uid(), type: "exec-summary", title: "Executive Summary", content: "This report provides a comprehensive overview of the project outcomes, key findings, and recommendations for future action." },
    { id: uid(), type: "body", title: "Key Findings", content: "Our analysis reveals several important trends that will shape strategic direction in the coming period. The data collected from multiple sources confirms our initial hypotheses." },
    { id: uid(), type: "chart", title: "Performance Metrics", content: "Quarterly performance breakdown", chartType: "bar", chartData: [
      { label: "Q1", value: 45 }, { label: "Q2", value: 62 }, { label: "Q3", value: 78 }, { label: "Q4", value: 91 },
    ]},
    { id: uid(), type: "chart", title: "Market Distribution", content: "Market share analysis", chartType: "pie", chartData: [
      { label: "Segment A", value: 35 }, { label: "Segment B", value: 25 }, { label: "Segment C", value: 20 }, { label: "Segment D", value: 20 },
    ]},
    { id: uid(), type: "table", title: "Data Summary", content: "Key metrics summary", tableData: [
      ["Metric", "Value", "Change"],
      ["Revenue (ZMW)", "1,250,000", "+15%"],
      ["Customers", "3,420", "+22%"],
      ["Satisfaction", "94%", "+3%"],
      ["ROI", "2.4x", "+0.3x"],
    ]},
    { id: uid(), type: "appendix", title: "Appendix", content: "Additional supporting documentation, raw data tables, and methodology notes are available upon request. Contact: info@dmsuite.com" },
  ];
}

/* ── Component ─────────────────────────────────────────────── */

export default function ReportWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  const [config, setConfig] = useState<ReportConfig>({
    template: "corporate",
    primaryColor: "#1e40af",
    companyName: "DMSuite Solutions",
    reportTitle: "Annual Performance Report",
    subtitle: "Fiscal Year 2025-2026",
    author: "Research & Analytics Team",
    date: new Date().toISOString().slice(0, 10),
    activeSection: 0,
    description: "",
  });

  const [sections, setSections] = useState<ReportSection[]>(defaultSections());

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
      /* Cover */
      if (config.template === "corporate" || config.template === "executive") {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, H * 0.5);
        ctx.fillStyle = "#ffffff10";
        ctx.beginPath();
        ctx.arc(W - 80, H * 0.3, 120, 0, Math.PI * 2);
        ctx.fill();
      } else if (config.template === "research") {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = pc + "20";
        for (let i = 0; i < 6; i++) {
          ctx.fillRect(M + i * 90, H * 0.55, 60, 4);
        }
      } else {
        ctx.fillStyle = pc;
        ctx.fillRect(0, 0, W, 10);
      }

      const isDark = ["corporate", "executive", "research"].includes(config.template);

      ctx.fillStyle = isDark ? "#ffffff" : "#1e293b";
      ctx.font = `bold 30px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(config.reportTitle, M, H * 0.25, CW);

      ctx.fillStyle = isDark ? "#ffffffaa" : "#64748b";
      ctx.font = `16px ${font}`;
      ctx.fillText(config.subtitle, M, H * 0.32);

      const infoY = isDark ? H * 0.6 : H * 0.5;
      ctx.fillStyle = isDark && config.template === "research" ? "#ffffffcc" : isDark ? "#475569" : "#475569";
      ctx.font = `12px ${font}`;
      ctx.fillText(`Prepared by: ${config.author}`, M, infoY);
      ctx.fillText(`${config.companyName}`, M, infoY + 20);
      ctx.fillText(`Date: ${config.date}`, M, infoY + 40);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 6, W, 6);

    } else if (section.type === "toc") {
      /* Table of Contents */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 22px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText("Table of Contents", M, M + 30);

      ctx.strokeStyle = pc;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(M, M + 40);
      ctx.lineTo(M + 100, M + 40);
      ctx.stroke();

      let y = M + 70;
      sections.forEach((s, i) => {
        if (s.type === "cover" || s.type === "toc") return;
        ctx.fillStyle = "#1e293b";
        ctx.font = `12px ${font}`;
        ctx.textAlign = "left";
        ctx.fillText(`${i}. ${s.title}`, M + 10, y);

        /* Dot leader */
        ctx.fillStyle = "#d1d5db";
        const textW = ctx.measureText(`${i}. ${s.title}`).width;
        for (let dx = M + 14 + textW + 8; dx < W - M - 30; dx += 6) {
          ctx.fillText(".", dx, y);
        }

        ctx.fillStyle = "#64748b";
        ctx.textAlign = "right";
        ctx.fillText(String(i + 1), W - M, y);
        y += 24;
      });

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (section.type === "chart" && section.chartType === "bar") {
      /* Bar chart page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      ctx.fillStyle = "#64748b";
      ctx.font = `12px ${font}`;
      ctx.fillText(section.content, M, M + 52);

      const data = section.chartData || [];
      const chartX = M + 40;
      const chartY = M + 90;
      const chartW = CW - 80;
      const chartH = 300;
      const maxVal = Math.max(...data.map((d) => d.value), 1);
      const barW = Math.min(60, chartW / data.length - 20);

      /* Y axis */
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = chartY + chartH - (chartH * i) / 4;
        ctx.beginPath();
        ctx.moveTo(chartX, y);
        ctx.lineTo(chartX + chartW, y);
        ctx.stroke();
        ctx.fillStyle = "#94a3b8";
        ctx.font = `10px ${font}`;
        ctx.textAlign = "right";
        ctx.fillText(String(Math.round((maxVal * i) / 4)), chartX - 8, y + 4);
      }

      /* Bars */
      data.forEach((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x = chartX + (chartW / data.length) * i + (chartW / data.length - barW) / 2;
        const y = chartY + chartH - barH;

        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
        ctx.fillRect(x, y, barW, barH);

        ctx.fillStyle = "#1e293b";
        ctx.font = `bold 12px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(String(d.value), x + barW / 2, y - 8);

        ctx.fillStyle = "#64748b";
        ctx.font = `11px ${font}`;
        ctx.fillText(d.label, x + barW / 2, chartY + chartH + 18);
      });

      /* Page footer */
      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.length}`, W / 2, H - 20);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (section.type === "chart" && section.chartType === "pie") {
      /* Pie chart page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      ctx.fillStyle = "#64748b";
      ctx.font = `12px ${font}`;
      ctx.fillText(section.content, M, M + 52);

      const data = section.chartData || [];
      const total = data.reduce((s, d) => s + d.value, 0);
      const cx = W / 2;
      const cy = M + 240;
      const r = 120;
      let angle = -Math.PI / 2;

      data.forEach((d, i) => {
        const sliceAngle = (d.value / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, angle, angle + sliceAngle);
        ctx.closePath();
        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        /* Label */
        const midAngle = angle + sliceAngle / 2;
        const lx = cx + Math.cos(midAngle) * (r + 30);
        const ly = cy + Math.sin(midAngle) * (r + 30);
        ctx.fillStyle = "#1e293b";
        ctx.font = `11px ${font}`;
        ctx.textAlign = "center";
        ctx.fillText(`${d.label} (${Math.round((d.value / total) * 100)}%)`, lx, ly);

        angle += sliceAngle;
      });

      /* Legend */
      let legendY = cy + r + 60;
      ctx.textAlign = "left";
      data.forEach((d, i) => {
        ctx.fillStyle = CHART_COLORS[i % CHART_COLORS.length];
        ctx.fillRect(M, legendY - 8, 12, 12);
        ctx.fillStyle = "#475569";
        ctx.font = `11px ${font}`;
        ctx.fillText(`${d.label}: ${d.value}`, M + 18, legendY);
        legendY += 20;
      });

      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.length}`, W / 2, H - 20);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else if (section.type === "table") {
      /* Table page */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      const data = section.tableData || [];
      if (data.length > 0) {
        const colCount = data[0].length;
        const colW = CW / colCount;
        let y = M + 60;

        data.forEach((row, ri) => {
          const isHeader = ri === 0;
          if (isHeader) {
            ctx.fillStyle = pc + "10";
            ctx.fillRect(M, y - 12, CW, 22);
          } else if (ri % 2 === 0) {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(M, y - 12, CW, 22);
          }

          row.forEach((cell, ci) => {
            ctx.fillStyle = isHeader ? pc : "#1e293b";
            ctx.font = isHeader ? `600 11px ${font}` : `11px ${font}`;
            ctx.textAlign = "left";
            ctx.fillText(cell, M + ci * colW + 8, y, colW - 16);
          });

          y += 24;
        });
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.length}`, W / 2, H - 20);
      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);

    } else {
      /* Generic text section */
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);

      /* Header */
      ctx.fillStyle = "#1e293b";
      ctx.font = `bold 18px ${font}`;
      ctx.textAlign = "left";
      ctx.fillText(section.title, M, M + 30);

      ctx.strokeStyle = pc + "30";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(M, M + 40);
      ctx.lineTo(W - M, M + 40);
      ctx.stroke();

      /* Content */
      ctx.fillStyle = "#475569";
      ctx.font = `12px ${font}`;
      wrapText(section.content, M, M + 65, CW, 18);

      /* Page header / footer */
      ctx.fillStyle = "#d1d5db";
      ctx.font = `9px ${font}`;
      ctx.textAlign = "right";
      ctx.fillText(config.reportTitle, W - M, 24);

      ctx.fillStyle = "#94a3b8";
      ctx.font = `10px ${font}`;
      ctx.textAlign = "center";
      ctx.fillText(`Page ${config.activeSection + 1} of ${sections.length}`, W / 2, H - 20);
      ctx.textAlign = "left";
      ctx.fillText(config.companyName, M, H - 20);

      ctx.fillStyle = pc;
      ctx.fillRect(0, H - 4, W, 4);
    }
  }, [config, sections]);

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
            content: `Generate a report for: ${config.description}. Company: ${config.companyName}. Based in Lusaka, Zambia. Return JSON: { "reportTitle": "", "subtitle": "", "sections": [{ "type": "exec-summary|body|appendix", "title": "", "content": "" }], "chartData": { "bar": [{ "label": "", "value": 0 }], "pie": [{ "label": "", "value": 0 }] }, "tableData": [["Header1","Header2"],["val","val"]] }`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        if (data.reportTitle) setConfig((p) => ({ ...p, reportTitle: data.reportTitle, subtitle: data.subtitle || p.subtitle }));
        if (data.sections) {
          setSections((prev) => {
            const updated = [...prev];
            for (const ds of data.sections) {
              const idx = updated.findIndex((s) => s.type === ds.type);
              if (idx >= 0) {
                updated[idx] = { ...updated[idx], title: ds.title || updated[idx].title, content: ds.content || updated[idx].content };
              }
            }
            if (data.chartData?.bar) {
              const barIdx = updated.findIndex((s) => s.chartType === "bar");
              if (barIdx >= 0) updated[barIdx] = { ...updated[barIdx], chartData: data.chartData.bar };
            }
            if (data.chartData?.pie) {
              const pieIdx = updated.findIndex((s) => s.chartType === "pie");
              if (pieIdx >= 0) updated[pieIdx] = { ...updated[pieIdx], chartData: data.chartData.pie };
            }
            if (data.tableData) {
              const tblIdx = updated.findIndex((s) => s.type === "table");
              if (tblIdx >= 0) updated[tblIdx] = { ...updated[tblIdx], tableData: data.tableData };
            }
            return updated;
          });
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
    link.download = `report-page-${config.activeSection + 1}.png`;
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
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconChart className="size-4 text-primary-500" />Report Settings</h3>

            <label className="block text-xs text-gray-400">Report Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.reportTitle} onChange={(e) => setConfig((p) => ({ ...p, reportTitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Subtitle</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subtitle} onChange={(e) => setConfig((p) => ({ ...p, subtitle: e.target.value }))} />

            <label className="block text-xs text-gray-400">Company</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.companyName} onChange={(e) => setConfig((p) => ({ ...p, companyName: e.target.value }))} />

            <label className="block text-xs text-gray-400">Author</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.author} onChange={(e) => setConfig((p) => ({ ...p, author: e.target.value }))} />

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
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2 max-h-48 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Pages</h3>
            {sections.map((sec, i) => (
              <button key={sec.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`w-full text-left px-3 py-1.5 rounded-lg text-xs ${config.activeSection === i ? "bg-primary-500/10 text-primary-500 font-semibold" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>
                {i + 1}. {sec.title} <span className="text-gray-400 text-[10px]">({sec.type})</span>
              </button>
            ))}
          </div>

          {/* Section Content Editor */}
          {sections[config.activeSection] && !["cover", "toc"].includes(sections[config.activeSection].type) && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
              <label className="block text-xs text-gray-400">{sections[config.activeSection].title}</label>
              <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={4} value={sections[config.activeSection].content} onChange={(e) => { const s = [...sections]; s[config.activeSection] = { ...s[config.activeSection], content: e.target.value }; setSections(s); }} />
            </div>
          )}

          {/* AI Generation */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Report Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the report topic and data points (e.g. 'Q4 sales analysis for our Lusaka branches')..." value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Report"}
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
            {sections.map((s, i) => (
              <button key={s.id} onClick={() => setConfig((p) => ({ ...p, activeSection: i }))} className={`px-3 py-1 rounded-lg text-xs font-medium ${config.activeSection === i ? "bg-primary-500 text-gray-950" : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">Report — {sections[config.activeSection]?.title} — {PAGE_W}×{PAGE_H}px</p>
        </div>
      </div>
    </div>
  );
}
