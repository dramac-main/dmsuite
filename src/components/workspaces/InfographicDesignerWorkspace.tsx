"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconChart,
  IconPlus,
  IconTrash,
  IconCopy,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getContrastColor } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type CanvasSize = "tall" | "standard" | "social" | "wide";
type SectionType = "header" | "statistics" | "timeline" | "process" | "comparison" | "chart" | "icons" | "quote" | "cta" | "footer";
type InfographicTemplate = "statistical" | "timeline" | "process" | "comparison";

interface StatItem {
  value: string;
  label: string;
}

interface InfographicSection {
  type: SectionType;
  heading: string;
  content: string;
  items: StatItem[];
}

interface InfographicConfig {
  size: CanvasSize;
  template: InfographicTemplate;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  title: string;
  subtitle: string;
  sections: InfographicSection[];
  topic: string;
  fontStyle: "modern" | "bold";
  showGridLines: boolean;
}

/* ── Constants ─────────────────────────────────────────────── */

const CANVAS_SIZES: { id: CanvasSize; label: string; w: number; h: number }[] = [
  { id: "tall", label: "Tall (800×2400)", w: 800, h: 2400 },
  { id: "standard", label: "Standard (800×1200)", w: 800, h: 1200 },
  { id: "social", label: "Social (1080×1080)", w: 1080, h: 1080 },
  { id: "wide", label: "Wide (1920×1080)", w: 1920, h: 1080 },
];

const SECTION_TYPES: { id: SectionType; label: string }[] = [
  { id: "header", label: "Header" },
  { id: "statistics", label: "Statistics" },
  { id: "timeline", label: "Timeline" },
  { id: "process", label: "Process" },
  { id: "comparison", label: "Comparison" },
  { id: "chart", label: "Chart" },
  { id: "icons", label: "Icons" },
  { id: "quote", label: "Quote" },
  { id: "cta", label: "Call to Action" },
  { id: "footer", label: "Footer" },
];

const TEMPLATES: { id: InfographicTemplate; label: string }[] = [
  { id: "statistical", label: "Statistical" },
  { id: "timeline", label: "Timeline" },
  { id: "process", label: "Process" },
  { id: "comparison", label: "Comparison" },
];

const COLOR_PRESETS = [
  { name: "Electric", primary: "#8ae600", secondary: "#06b6d4", bg: "#0f172a", text: "#ffffff" },
  { name: "Corporate", primary: "#1e40af", secondary: "#3b82f6", bg: "#ffffff", text: "#1e293b" },
  { name: "Sunset", primary: "#ea580c", secondary: "#facc15", bg: "#1c1917", text: "#ffffff" },
  { name: "Ocean", primary: "#0284c7", secondary: "#67e8f9", bg: "#082f49", text: "#ffffff" },
  { name: "Forest", primary: "#16a34a", secondary: "#86efac", bg: "#052e16", text: "#ffffff" },
  { name: "Monochrome", primary: "#18181b", secondary: "#71717a", bg: "#fafafa", text: "#18181b" },
  { name: "Berry", primary: "#9333ea", secondary: "#c084fc", bg: "#1e1b4b", text: "#ffffff" },
  { name: "Coral", primary: "#f43f5e", secondary: "#fda4af", bg: "#18181b", text: "#ffffff" },
];

function defaultSections(): InfographicSection[] {
  return [
    { type: "header", heading: "Infographic Title", content: "A compelling subtitle goes here", items: [] },
    { type: "statistics", heading: "Key Statistics", content: "", items: [
      { value: "85%", label: "Success Rate" },
      { value: "2.4M", label: "Users Reached" },
      { value: "150+", label: "Countries" },
    ]},
    { type: "process", heading: "Our Process", content: "", items: [
      { value: "1", label: "Research & Discovery" },
      { value: "2", label: "Design & Develop" },
      { value: "3", label: "Test & Deploy" },
    ]},
    { type: "footer", heading: "Learn More", content: "www.dmsuite.com — Lusaka, Zambia", items: [] },
  ];
}

/* ── Word-wrap ─────────────────────────────────────────────── */

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line + (line ? " " : "") + w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/* ── Component ─────────────────────────────────────────────── */

export default function InfographicDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<InfographicConfig>({
    size: "standard",
    template: "statistical",
    primaryColor: "#8ae600",
    secondaryColor: "#06b6d4",
    bgColor: "#0f172a",
    textColor: "#ffffff",
    title: "Data-Driven Insights",
    subtitle: "Key findings from our 2025 research report",
    sections: defaultSections(),
    topic: "",
    fontStyle: "modern",
    showGridLines: false,
  });

  const sz = CANVAS_SIZES.find((s) => s.id === config.size)!;

  /* ── Section Renderers ──────────────────────────────────── */

  function renderHeader(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, sc: string, _tc: string): number {
    void _tc;
    const h = 180;
    // Background accent
    const grad = ctx.createLinearGradient(x, y, x + w, y + h);
    grad.addColorStop(0, pc);
    grad.addColorStop(1, sc);
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, w, h);

    // Title
    ctx.font = "800 36px Inter, Helvetica, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.textAlign = "center";
    ctx.fillText(sec.heading || config.title, x + w / 2, y + 80, w - 60);

    // Subtitle
    ctx.font = "400 16px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.8);
    ctx.fillText(sec.content || config.subtitle, x + w / 2, y + 115, w - 60);

    // Decorative line
    ctx.strokeStyle = hexToRgba(getContrastColor(pc), 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + w * 0.3, y + h - 20);
    ctx.lineTo(x + w * 0.7, y + h - 20);
    ctx.stroke();

    return h;
  }

  function renderStatistics(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, _sc: string, tc: string): number {
    const items = sec.items.length || 3;
    const h = 60 + Math.ceil(items / 3) * 120;

    // Section heading
    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    // Stat cards
    const cols = Math.min(items, 3);
    const cardW = (w - 80) / cols;
    sec.items.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const cx = x + 40 + col * cardW + cardW / 2;
      const cy = y + 60 + row * 120;

      // Card bg
      ctx.fillStyle = hexToRgba(pc, 0.1);
      ctx.beginPath();
      ctx.roundRect(cx - cardW / 2 + 8, cy, cardW - 16, 95, 12);
      ctx.fill();

      // Value
      ctx.font = "800 32px Inter, sans-serif";
      ctx.fillStyle = pc;
      ctx.textAlign = "center";
      ctx.fillText(item.value, cx, cy + 42);

      // Label
      ctx.font = "500 12px Inter, sans-serif";
      ctx.fillStyle = hexToRgba(tc, 0.7);
      ctx.fillText(item.label, cx, cy + 68, cardW - 30);
    });

    return h;
  }

  function renderTimeline(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, sc: string, tc: string): number {
    const items = sec.items.length || 3;
    const h = 60 + items * 80;

    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    const lineX = x + 60;
    // vertical line
    ctx.strokeStyle = hexToRgba(pc, 0.3);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX, y + 55);
    ctx.lineTo(lineX, y + 55 + (items - 1) * 80);
    ctx.stroke();

    sec.items.forEach((item, i) => {
      const iy = y + 60 + i * 80;

      // Dot
      ctx.fillStyle = pc;
      ctx.beginPath();
      ctx.arc(lineX, iy + 10, 8, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = config.bgColor;
      ctx.beginPath();
      ctx.arc(lineX, iy + 10, 4, 0, Math.PI * 2);
      ctx.fill();

      // Value (year/step)
      ctx.font = "700 14px Inter, sans-serif";
      ctx.fillStyle = pc;
      ctx.textAlign = "left";
      ctx.fillText(item.value, lineX + 25, iy + 8);

      // Label
      ctx.font = "400 13px Inter, sans-serif";
      ctx.fillStyle = hexToRgba(tc, 0.7);
      ctx.fillText(item.label, lineX + 25, iy + 28, w - 120);
    });

    return h;
  }

  function renderProcess(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, sc: string, tc: string): number {
    const items = sec.items.length || 3;
    const h = 60 + items * 70;

    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    sec.items.forEach((item, i) => {
      const iy = y + 60 + i * 70;

      // Step circle
      const circleX = x + 50;
      ctx.fillStyle = pc;
      ctx.beginPath();
      ctx.arc(circleX, iy + 20, 18, 0, Math.PI * 2);
      ctx.fill();

      // Step number
      ctx.font = "700 16px Inter, sans-serif";
      ctx.fillStyle = getContrastColor(pc);
      ctx.textAlign = "center";
      ctx.fillText(item.value, circleX, iy + 26);

      // Arrow to next
      if (i < items - 1) {
        ctx.strokeStyle = hexToRgba(pc, 0.3);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(circleX, iy + 40);
        ctx.lineTo(circleX, iy + 50);
        ctx.stroke();
      }

      // Label
      ctx.font = "500 14px Inter, sans-serif";
      ctx.fillStyle = tc;
      ctx.textAlign = "left";
      ctx.fillText(item.label, x + 85, iy + 26, w - 130);
    });

    return h;
  }

  function renderComparison(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, sc: string, tc: string): number {
    const items = sec.items.length || 2;
    const h = 60 + items * 50;

    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    // Bar chart comparison
    const maxVal = Math.max(...sec.items.map((it) => parseFloat(it.value.replace(/[^0-9.]/g, "")) || 50));

    sec.items.forEach((item, i) => {
      const iy = y + 65 + i * 50;
      const val = parseFloat(item.value.replace(/[^0-9.]/g, "")) || 50;
      const barW = ((w - 200) * val) / (maxVal || 1);

      // Label
      ctx.font = "500 12px Inter, sans-serif";
      ctx.fillStyle = hexToRgba(tc, 0.7);
      ctx.textAlign = "right";
      ctx.fillText(item.label, x + 140, iy + 20, 120);

      // Bar bg
      ctx.fillStyle = hexToRgba(pc, 0.1);
      ctx.beginPath();
      ctx.roundRect(x + 150, iy + 6, w - 200, 22, 4);
      ctx.fill();

      // Bar fill
      const barGrad = ctx.createLinearGradient(x + 150, 0, x + 150 + barW, 0);
      barGrad.addColorStop(0, pc);
      barGrad.addColorStop(1, sc);
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(x + 150, iy + 6, Math.max(barW, 4), 22, 4);
      ctx.fill();

      // Value
      ctx.font = "700 11px Inter, sans-serif";
      ctx.fillStyle = tc;
      ctx.textAlign = "left";
      ctx.fillText(item.value, x + 155 + barW + 8, iy + 22);
    });

    return h;
  }

  function renderChart(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, sc: string, tc: string): number {
    const h = 220;

    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    // Simple bar chart
    const items = sec.items.length ? sec.items : [
      { value: "75", label: "Q1" },
      { value: "90", label: "Q2" },
      { value: "60", label: "Q3" },
      { value: "95", label: "Q4" },
    ];
    const maxVal = Math.max(...items.map((it) => parseFloat(it.value.replace(/[^0-9.]/g, "")) || 1));
    const barArea = w - 120;
    const barW = Math.min(barArea / items.length - 12, 50);
    const chartH = 120;
    const chartY = y + 60;

    items.forEach((item, i) => {
      const val = parseFloat(item.value.replace(/[^0-9.]/g, "")) || 0;
      const barH = (val / (maxVal || 1)) * chartH;
      const bx = x + 60 + i * (barArea / items.length) + (barArea / items.length - barW) / 2;

      // Bar
      const barGrad = ctx.createLinearGradient(0, chartY + chartH - barH, 0, chartY + chartH);
      barGrad.addColorStop(0, pc);
      barGrad.addColorStop(1, sc);
      ctx.fillStyle = barGrad;
      ctx.beginPath();
      ctx.roundRect(bx, chartY + chartH - barH, barW, barH, [4, 4, 0, 0]);
      ctx.fill();

      // Label
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = hexToRgba(tc, 0.6);
      ctx.textAlign = "center";
      ctx.fillText(item.label, bx + barW / 2, chartY + chartH + 16, barW + 10);

      // Value on top
      ctx.font = "700 10px Inter, sans-serif";
      ctx.fillStyle = tc;
      ctx.fillText(item.value, bx + barW / 2, chartY + chartH - barH - 6);
    });

    return h;
  }

  function renderQuote(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, _sc: string, tc: string): number {
    const h = 140;

    // Quote mark
    ctx.font = "700 60px Georgia, serif";
    ctx.fillStyle = hexToRgba(pc, 0.2);
    ctx.textAlign = "center";
    ctx.fillText("\u201C", x + w / 2, y + 50);

    // Quote text
    ctx.font = "italic 16px Georgia, serif";
    ctx.fillStyle = tc;
    const lines = wrapText(ctx, sec.content || sec.heading, w - 100);
    lines.forEach((line, i) => {
      ctx.fillText(line, x + w / 2, y + 70 + i * 22);
    });

    // Attribution
    if (sec.items[0]) {
      ctx.font = "600 12px Inter, sans-serif";
      ctx.fillStyle = pc;
      ctx.fillText(`— ${sec.items[0].label}`, x + w / 2, y + h - 15);
    }

    return h;
  }

  function renderCTA(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, _sc: string, _tc: string): number {
    void _sc; void _tc;
    const h = 120;

    // BG bar
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.roundRect(x + 30, y + 15, w - 60, h - 30, 16);
    ctx.fill();

    ctx.font = "700 22px Inter, sans-serif";
    ctx.fillStyle = getContrastColor(pc);
    ctx.textAlign = "center";
    ctx.fillText(sec.heading || "Get Started Today", x + w / 2, y + 55);

    ctx.font = "400 13px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.8);
    ctx.fillText(sec.content || "Visit our website to learn more", x + w / 2, y + 78);

    return h;
  }

  function renderFooter(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, _sc: string, tc: string): number {
    const h = 80;

    ctx.fillStyle = hexToRgba(pc, 0.08);
    ctx.fillRect(x, y, w, h);

    ctx.font = "600 14px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading || "Learn More", x + w / 2, y + 30);

    ctx.font = "400 11px Inter, sans-serif";
    ctx.fillStyle = hexToRgba(tc, 0.6);
    ctx.fillText(sec.content || "www.dmsuite.com — Lusaka, Zambia", x + w / 2, y + 52);

    return h;
  }

  function renderIconsSection(ctx: CanvasRenderingContext2D, sec: InfographicSection, x: number, y: number, w: number, pc: string, _sc: string, tc: string): number {
    const items = sec.items.length || 4;
    const h = 140;

    ctx.font = "700 20px Inter, sans-serif";
    ctx.fillStyle = tc;
    ctx.textAlign = "center";
    ctx.fillText(sec.heading, x + w / 2, y + 35);

    const cols = Math.min(items, 4);
    const spacing = w / (cols + 1);

    sec.items.forEach((item, i) => {
      if (i >= cols) return;
      const ix = x + spacing * (i + 1);

      // Icon circle
      ctx.fillStyle = hexToRgba(pc, 0.15);
      ctx.beginPath();
      ctx.arc(ix, y + 75, 24, 0, Math.PI * 2);
      ctx.fill();

      // Icon placeholder (star shape)
      ctx.fillStyle = pc;
      const sr = 10;
      ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? sr : sr * 0.4;
        const px = ix + Math.cos(angle) * r;
        const py = y + 75 + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Label
      ctx.font = "500 11px Inter, sans-serif";
      ctx.fillStyle = hexToRgba(tc, 0.7);
      ctx.fillText(item.label, ix, y + 115, spacing - 10);
    });

    return h;
  }

  /* ── Main Render ────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = sz.w;
    // Calculate height from sections
    canvas.width = W;
    // Temp set height to measure
    canvas.height = sz.h;

    // Background
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, W, sz.h);

    // Grid lines
    if (config.showGridLines) {
      ctx.strokeStyle = hexToRgba(config.textColor, 0.05);
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < W; gx += 40) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, sz.h); ctx.stroke();
      }
      for (let gy = 0; gy < sz.h; gy += 40) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();
      }
    }

    // Render sections stacked
    let curY = 0;
    const pc = config.primaryColor;
    const sc = config.secondaryColor;
    const tc = config.textColor;

    for (const sec of config.sections) {
      if (curY >= sz.h) break;
      let sectionH = 0;
      switch (sec.type) {
        case "header": sectionH = renderHeader(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "statistics": sectionH = renderStatistics(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "timeline": sectionH = renderTimeline(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "process": sectionH = renderProcess(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "comparison": sectionH = renderComparison(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "chart": sectionH = renderChart(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "icons": sectionH = renderIconsSection(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "quote": sectionH = renderQuote(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "cta": sectionH = renderCTA(ctx, sec, 0, curY, W, pc, sc, tc); break;
        case "footer": sectionH = renderFooter(ctx, sec, 0, curY, W, pc, sc, tc); break;
      }
      curY += sectionH;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, sz, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate infographic data about: "${config.topic}". Style: ${config.template}. Return JSON only: { "title": "...", "subtitle": "...", "sections": [{ "type": "header|statistics|timeline|process|comparison|chart|quote|cta|footer", "heading": "...", "content": "...", "items": [{ "value": "...", "label": "..." }] }] }. Include 4-6 sections with realistic data. Use Zambian context where relevant (ZMW currency, Lusaka references). Start with header, end with footer.`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        setConfig((p) => ({
          ...p,
          title: data.title || p.title,
          subtitle: data.subtitle || p.subtitle,
          sections: (data.sections || []).map((s: Partial<InfographicSection>) => ({
            type: s.type || "statistics",
            heading: s.heading || "",
            content: s.content || "",
            items: (s.items || []).map((it: Partial<StatItem>) => ({
              value: String(it?.value ?? ""),
              label: String(it?.label ?? ""),
            })),
          })),
        }));
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `infographic-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Helpers ─────────────────────────────────────────────── */
  const upd = (patch: Partial<InfographicConfig>) => setConfig((p) => ({ ...p, ...patch }));

  const addSection = (type: SectionType) => {
    setConfig((p) => ({
      ...p,
      sections: [...p.sections, {
        type,
        heading: type.charAt(0).toUpperCase() + type.slice(1),
        content: "",
        items: type === "statistics" || type === "chart" || type === "comparison"
          ? [{ value: "100", label: "Item 1" }, { value: "200", label: "Item 2" }]
          : type === "process" || type === "timeline"
          ? [{ value: "1", label: "Step One" }, { value: "2", label: "Step Two" }]
          : [],
      }],
    }));
  };

  const removeSection = (idx: number) => {
    setConfig((p) => ({ ...p, sections: p.sections.filter((_, i) => i !== idx) }));
    setEditIdx(null);
  };

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const displayWidth = Math.min(700, sz.w);
  const displayHeight = displayWidth * (sz.h / sz.w);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.label,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          const pc = config.primaryColor;
          const sc = config.secondaryColor;
          // Background
          ctx.fillStyle = config.bgColor;
          ctx.fillRect(0, 0, w, h);
          // Template-specific accent
          if (t.id === "statistical") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.25);
            for (let i = 0; i < 3; i++) {
              ctx.fillStyle = hexToRgba(pc, 0.15);
              ctx.fillRect(4 + i * (w / 3 - 2), h * 0.35, w / 3 - 6, h * 0.2);
            }
          } else if (t.id === "timeline") {
            const grad = ctx.createLinearGradient(0, 0, w, 0);
            grad.addColorStop(0, pc);
            grad.addColorStop(1, sc);
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, w, h * 0.2);
            ctx.fillStyle = hexToRgba(pc, 0.3);
            ctx.fillRect(w * 0.15, h * 0.3, 2, h * 0.6);
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(w * 0.15, h * 0.4 + i * h * 0.18, 3, 0, Math.PI * 2);
              ctx.fillStyle = pc;
              ctx.fill();
            }
          } else if (t.id === "process") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.2);
            for (let i = 0; i < 3; i++) {
              ctx.beginPath();
              ctx.arc(w * 0.18, h * 0.38 + i * h * 0.18, 5, 0, Math.PI * 2);
              ctx.fillStyle = pc;
              ctx.fill();
            }
          } else {
            // comparison
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, h * 0.2);
            for (let i = 0; i < 3; i++) {
              ctx.fillStyle = hexToRgba(pc, 0.2);
              ctx.fillRect(w * 0.3, h * 0.35 + i * h * 0.15, w * 0.6, h * 0.08);
              ctx.fillStyle = pc;
              ctx.fillRect(w * 0.3, h * 0.35 + i * h * 0.15, w * (0.2 + i * 0.12), h * 0.08);
            }
          }
          // Border
          ctx.strokeStyle = "#d1d5db";
          ctx.lineWidth = 1;
          ctx.strokeRect(0, 0, w, h);
        },
      })),
    [config.primaryColor, config.secondaryColor, config.bgColor]
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

  /* ── UI ──────────────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => upd({ template: id as InfographicTemplate })}
        thumbWidth={140}
        thumbHeight={100}
        label="Templates"
      />
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={
        <>
          {leftPanel.props.children}

          {/* General */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconChart className="size-4 text-primary-500" />Infographic Settings</h3>

            <label className="block text-xs text-gray-400">Canvas Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.size} onChange={(e) => upd({ size: e.target.value as CanvasSize })}>
              {CANVAS_SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Color Preset</label>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PRESETS.map((cp) => (
                <button key={cp.name} onClick={() => upd({ primaryColor: cp.primary, secondaryColor: cp.secondary, bgColor: cp.bg, textColor: cp.text })} className="flex flex-col items-center gap-1">
                  <div className="flex gap-0.5">
                    <span className="size-3 rounded-full" style={{ backgroundColor: cp.primary }} />
                    <span className="size-3 rounded-full" style={{ backgroundColor: cp.secondary }} />
                  </div>
                  <span className="text-[9px] text-gray-400">{cp.name}</span>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Primary</label><input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Secondary</label><input type="color" value={config.secondaryColor} onChange={(e) => upd({ secondaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
              <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">BG</label><input type="color" value={config.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
            </div>

            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={config.showGridLines} onChange={(e) => upd({ showGridLines: e.target.checked })} className="accent-primary-500" /> Show Grid Lines
            </label>
          </div>

          {/* Sections */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 max-h-64 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Sections ({config.sections.length})</h3>
            {config.sections.map((sec, i) => (
              <div key={i} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${editIdx === i ? "bg-primary-500/10 border border-primary-500/30" : "bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"}`} onClick={() => setEditIdx(editIdx === i ? null : i)}>
                <span className="text-xs font-semibold text-primary-500 w-5">{i + 1}</span>
                <span className="text-xs text-gray-300 flex-1 truncate">{sec.heading || sec.type}</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-gray-700 text-gray-400">{sec.type}</span>
                <button onClick={(e) => { e.stopPropagation(); removeSection(i); }} className="text-gray-500 hover:text-red-400"><IconTrash className="size-3" /></button>
              </div>
            ))}
            {/* Add section */}
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value="" onChange={(e) => { if (e.target.value) addSection(e.target.value as SectionType); e.target.value = ""; }}>
              <option value="">+ Add Section…</option>
              {SECTION_TYPES.map((st) => <option key={st.id} value={st.id}>{st.label}</option>)}
            </select>
          </div>

          {/* Section Editor */}
          {editIdx !== null && config.sections[editIdx] && (
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Edit: {config.sections[editIdx].type}</h3>
              <label className="block text-xs text-gray-400">Heading</label>
              <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.sections[editIdx].heading} onChange={(e) => { const s = [...config.sections]; s[editIdx] = { ...s[editIdx], heading: e.target.value }; upd({ sections: s }); }} />
              <label className="block text-xs text-gray-400">Content</label>
              <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.sections[editIdx].content} onChange={(e) => { const s = [...config.sections]; s[editIdx] = { ...s[editIdx], content: e.target.value }; upd({ sections: s }); }} />
              {/* Items */}
              <label className="block text-xs text-gray-400">Items</label>
              {config.sections[editIdx].items.map((item, ii) => (
                <div key={ii} className="flex gap-1.5">
                  <input className="w-20 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Value" value={item.value} onChange={(e) => { const s = [...config.sections]; const items = [...s[editIdx].items]; items[ii] = { ...items[ii], value: e.target.value }; s[editIdx] = { ...s[editIdx], items }; upd({ sections: s }); }} />
                  <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-2 py-1 text-xs text-gray-900 dark:text-white" placeholder="Label" value={item.label} onChange={(e) => { const s = [...config.sections]; const items = [...s[editIdx].items]; items[ii] = { ...items[ii], label: e.target.value }; s[editIdx] = { ...s[editIdx], items }; upd({ sections: s }); }} />
                  <button onClick={() => { const s = [...config.sections]; s[editIdx] = { ...s[editIdx], items: s[editIdx].items.filter((_, j) => j !== ii) }; upd({ sections: s }); }} className="text-gray-500 hover:text-red-400"><IconTrash className="size-3" /></button>
                </div>
              ))}
              <button onClick={() => { const s = [...config.sections]; s[editIdx] = { ...s[editIdx], items: [...s[editIdx].items, { value: "", label: "" }] }; upd({ sections: s }); }} className="flex items-center gap-1 text-xs text-primary-500 hover:text-primary-400"><IconPlus className="size-3" />Add Item</button>
            </div>
          )}

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Infographic Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the topic (e.g., 'Zambian tech startup ecosystem growth 2024')..." value={config.topic} onChange={(e) => upd({ topic: e.target.value })} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Infographic Data"}
            </button>
          </div>

          {/* Advanced Settings — Global */}
          <AdvancedSettingsPanel />
        </>
      }
      canvasRef={canvasRef}
      displayWidth={displayWidth}
      displayHeight={displayHeight}
      label={`${config.template} — ${sz.label} — ${config.sections.length} sections`}
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
