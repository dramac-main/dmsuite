"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconAward,
  IconCopy,
  IconDroplet,
  IconType,
  IconLayout,
  IconPrinter,
} from "@/components/icons";
import { Accordion, AccordionSection } from "@/components/ui";
import { cleanAIText, hexToRgba, roundRect } from "@/lib/canvas-utils";
import {
  drawPattern,
  drawDivider,
  drawAccentCircle,
  drawGradient,
  drawTextWithShadow,
  drawSeal,
} from "@/lib/graphics-engine";
import { drawCertificateThumbnail } from "@/lib/template-renderers";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { jsPDF } from "jspdf";

/* ── Types ─────────────────────────────────────────────────── */

type CertificateType = "achievement" | "completion" | "award" | "recognition" | "participation" | "training";
type CertificateSize = "a4-landscape" | "a4-portrait" | "letter-landscape";
type BorderStyle = "gold" | "silver" | "bronze" | "ornate" | "modern" | "minimal";
type CertificateTemplate = "academic" | "corporate" | "elegant" | "modern" | "achievement" | "training" | "sports" | "creative";

interface CertificateConfig {
  type: CertificateType;
  size: CertificateSize;
  border: BorderStyle;
  template: CertificateTemplate;
  primaryColor: string;
  accentColor: string;
  title: string;
  subtitle: string;
  recipientName: string;
  description: string;
  issuerName: string;
  issuerTitle: string;
  date: string;
  serialNumber: string;
  showSeal: boolean;
  showSignatureLine: boolean;
  eventName: string;
  organizationName: string;
  patternType: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const CERT_TYPES: { id: CertificateType; label: string }[] = [
  { id: "achievement", label: "Achievement" },
  { id: "completion", label: "Completion" },
  { id: "award", label: "Award" },
  { id: "recognition", label: "Recognition" },
  { id: "participation", label: "Participation" },
  { id: "training", label: "Training" },
];

const SIZES: { id: CertificateSize; label: string; w: number; h: number }[] = [
  { id: "a4-landscape", label: "A4 Landscape", w: 842, h: 595 },
  { id: "a4-portrait", label: "A4 Portrait", w: 595, h: 842 },
  { id: "letter-landscape", label: "Letter Landscape", w: 792, h: 612 },
];

const BORDERS: { id: BorderStyle; label: string }[] = [
  { id: "gold", label: "Gold" },
  { id: "silver", label: "Silver" },
  { id: "bronze", label: "Bronze" },
  { id: "ornate", label: "Ornate" },
  { id: "modern", label: "Modern" },
  { id: "minimal", label: "Minimal" },
];

const TEMPLATES: { id: CertificateTemplate; label: string }[] = [
  { id: "academic", label: "Academic" },
  { id: "corporate", label: "Corporate" },
  { id: "elegant", label: "Elegant" },
  { id: "modern", label: "Modern" },
  { id: "achievement", label: "Achievement" },
  { id: "training", label: "Training" },
  { id: "sports", label: "Sports" },
  { id: "creative", label: "Creative" },
];

const colorPresets = [
  { name: "Navy", primary: "#1e3a5f", accent: "#c09c2c" },
  { name: "Teal", primary: "#0f766e", accent: "#14b8a6" },
  { name: "Purple", primary: "#7c3aed", accent: "#a78bfa" },
  { name: "Brown", primary: "#8b5e3c", accent: "#d2a679" },
  { name: "Red", primary: "#b91c1c", accent: "#fca5a5" },
  { name: "Blue", primary: "#1e40af", accent: "#60a5fa" },
  { name: "Green", primary: "#059669", accent: "#6ee7b7" },
  { name: "Gold", primary: "#c09c2c", accent: "#fef3c7" },
  { name: "Slate", primary: "#334155", accent: "#94a3b8" },
  { name: "Rose", primary: "#9f1239", accent: "#fda4af" },
];

const patternOptions = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "diagonal-lines", label: "Diagonal" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "waves", label: "Waves" },
  { id: "diamond", label: "Diamond" },
];

const BORDER_COLORS: Record<BorderStyle, { outer: string; inner: string; accent: string }> = {
  gold: { outer: "#c09c2c", inner: "#f0e68c", accent: "#daa520" },
  silver: { outer: "#a0a0a0", inner: "#d4d4d4", accent: "#c0c0c0" },
  bronze: { outer: "#8b5e3c", inner: "#d2a679", accent: "#cd7f32" },
  ornate: { outer: "#4a2f1a", inner: "#c09c2c", accent: "#8b6914" },
  modern: { outer: "#1e293b", inner: "#475569", accent: "#64748b" },
  minimal: { outer: "#d1d5db", inner: "#e5e7eb", accent: "#9ca3af" },
};

function generateSerial(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "CERT-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

/* ── Word-wrap helper ──────────────────────────────────────── */

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

export default function CertificateDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const [config, setConfig] = useState<CertificateConfig>({
    type: "achievement",
    size: "a4-landscape",
    border: "gold",
    template: "elegant",
    primaryColor: "#1e3a5f",
    accentColor: "#c09c2c",
    title: "Certificate of Achievement",
    subtitle: "This certificate is proudly presented to",
    recipientName: "John Mwanza",
    description: "For outstanding performance and dedication in the completion of the Advanced Leadership Programme.",
    issuerName: "Dr. Chanda Mulenga",
    issuerTitle: "Director, DMSuite Academy",
    date: new Date().toLocaleDateString("en-ZM", { year: "numeric", month: "long", day: "numeric" }),
    serialNumber: generateSerial(),
    showSeal: true,
    showSignatureLine: true,
    eventName: "",
    organizationName: "DMSuite Academy — Lusaka, Zambia",
    patternType: "none",
  });

  const sz = SIZES.find((s) => s.id === config.size)!;
  const bc = BORDER_COLORS[config.border];
  const upd = useCallback((patch: Partial<CertificateConfig>) => setConfig((p) => ({ ...p, ...patch })), []);

  // ── Visual Template Previews ──────────────────────────
  const templatePreviews = useMemo<TemplatePreview[]>(
    () => TEMPLATES.map((t) => ({
      id: t.id,
      label: t.label,
      render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
        const borders: Record<string, "gold" | "silver" | "ornate" | "modern" | "minimal" | "bronze"> = {
          "academic": "gold",
          "corporate": "modern",
          "elegant": "ornate",
          "modern": "minimal",
          "achievement": "gold",
          "training": "modern",
          "sports": "bronze",
          "creative": "silver",
        };
        drawCertificateThumbnail(ctx, w, h, {
          primaryColor: config.primaryColor,
          borderStyle: borders[t.id] || "gold",
          showSeal: true,
        });
      },
    })),
    [config.primaryColor, config.accentColor]
  );

  /* ── Render ─────────────────────────────────────────────── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = sz.w;
    const H = sz.h;
    canvas.width = W;
    canvas.height = H;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const pc = config.primaryColor;
    const ac = config.accentColor;
    const isModern = config.template === "modern" || config.template === "creative";
    const isElegant = config.template === "elegant" || config.template === "academic";

    // ─── Background ──────────────────────────────────────
    if (isModern) {
      drawGradient(ctx, 0, 0, W, H, 135, [
        { offset: 0, color: "#ffffff" },
        { offset: 1, color: "#f8fafc" },
      ]);
    } else {
      ctx.fillStyle = "#fffef5";
      ctx.fillRect(0, 0, W, H);
    }

    // ─── Pattern Overlay ─────────────────────────────────
    if (config.patternType && config.patternType !== "none") {
      drawPattern(
        ctx, 0, 0, W, H,
        config.patternType as Parameters<typeof drawPattern>[5],
        ac, 0.02, 30
      );
    } else {
      // Default template patterns
      if (isElegant) {
        drawPattern(ctx, 0, 0, W, H, "dots", ac, 0.025, 30);
      }
      if (config.template === "creative") {
        drawAccentCircle(ctx, W * 0.85, H * 0.15, 120, pc, 0.04);
        drawAccentCircle(ctx, W * 0.1, H * 0.85, 80, pc, 0.04);
      }
      if (config.template === "sports") {
        drawPattern(ctx, 0, 0, W, H, "diagonal-lines", ac, 0.04, 60);
      }
    }

    // ─── Decorative accents ──────────────────────────────
    if (config.template === "achievement") {
      drawAccentCircle(ctx, W * 0.08, H * 0.08, W * 0.06, ac, 0.06);
      drawAccentCircle(ctx, W * 0.92, H * 0.08, W * 0.04, ac, 0.04);
      drawAccentCircle(ctx, W * 0.08, H * 0.92, W * 0.04, ac, 0.04);
      drawAccentCircle(ctx, W * 0.92, H * 0.92, W * 0.06, ac, 0.06);
    }

    // ─── Border ──────────────────────────────────────────
    const bw = config.border === "minimal" ? 2 : config.border === "modern" ? 4 : 8;
    ctx.strokeStyle = bc.outer;
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);

    const inset = bw + 8;
    ctx.strokeStyle = bc.inner;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    if (config.border === "ornate") {
      const fl = 40;
      const corners = [
        { x: inset + 4, y: inset + 4, sx: 1, sy: 1 },
        { x: W - inset - 4, y: inset + 4, sx: -1, sy: 1 },
        { x: inset + 4, y: H - inset - 4, sx: 1, sy: -1 },
        { x: W - inset - 4, y: H - inset - 4, sx: -1, sy: -1 },
      ];
      ctx.strokeStyle = bc.accent;
      ctx.lineWidth = 2;
      for (const c of corners) {
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + fl * c.sy);
        ctx.quadraticCurveTo(c.x, c.y, c.x + fl * c.sx, c.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(c.x, c.y + (fl * 0.5) * c.sy);
        ctx.quadraticCurveTo(c.x, c.y, c.x + (fl * 0.5) * c.sx, c.y);
        ctx.stroke();
      }
      // Corner dots
      for (const c of corners) {
        ctx.fillStyle = bc.accent;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // ─── Template-specific header ────────────────────────
    const cx = W / 2;
    let curY = 0;

    if (config.template === "corporate") {
      drawGradient(ctx, inset + 2, inset + 2, W - (inset + 2) * 2, 50, 90, [
        { offset: 0, color: pc },
        { offset: 1, color: hexToRgba(ac, 0.7) },
      ]);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Inter, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.organizationName.toUpperCase(), cx, inset + 32);
      curY = inset + 70;
    } else if (config.template === "training") {
      // Side bars with gradient
      const barGrad = ctx.createLinearGradient(0, 0, 0, H);
      barGrad.addColorStop(0, pc);
      barGrad.addColorStop(1, ac);
      ctx.fillStyle = barGrad;
      ctx.fillRect(inset + 2, inset + 2, 8, H - (inset + 2) * 2);
      ctx.fillRect(W - inset - 10, inset + 2, 8, H - (inset + 2) * 2);
      curY = inset + 50;
    } else {
      curY = inset + 50;
    }

    // ─── Decorative line above title ─────────────────────
    if (isElegant) {
      drawDivider(ctx, cx - 100, curY, 200, "diamond", ac, 0.4);
      curY += 20;
    }

    // ─── Title ───────────────────────────────────────────
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (isModern) {
      ctx.font = "800 32px Inter, Helvetica, sans-serif";
      ctx.fillStyle = pc;
    } else {
      ctx.font = "700 30px Georgia, 'Times New Roman', serif";
      ctx.fillStyle = pc;
    }
    drawTextWithShadow(ctx, config.title.toUpperCase(), cx, curY + 20, { shadowBlur: 3, shadowColor: hexToRgba(ac, 0.15) });
    curY += 50;

    // ─── Ornate divider ──────────────────────────────────
    drawDivider(ctx, cx - 80, curY, 160, "ornate", ac, 0.5);
    curY += 20;

    // ─── Subtitle ────────────────────────────────────────
    ctx.font = isModern ? "400 13px Inter, sans-serif" : "italic 14px Georgia, serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText(config.subtitle, cx, curY + 8);
    curY += 35;

    // ─── Recipient Name ──────────────────────────────────
    if (isModern) {
      ctx.font = "700 36px Inter, Helvetica, sans-serif";
    } else {
      ctx.font = "italic 38px Georgia, 'Palatino Linotype', serif";
    }
    ctx.fillStyle = pc;
    drawTextWithShadow(ctx, config.recipientName || "Recipient Name", cx, curY + 18, { shadowBlur: 4, shadowColor: hexToRgba(ac, 0.1) });
    curY += 42;

    // Name underline
    const nameW = Math.min(ctx.measureText(config.recipientName || "Recipient Name").width + 40, W * 0.5);
    drawDivider(ctx, cx - nameW / 2, curY, nameW, "gradient", ac, 0.5);
    curY += 25;

    // ─── Description ─────────────────────────────────────
    ctx.font = isModern ? "400 13px Inter, sans-serif" : "400 13px Georgia, serif";
    ctx.fillStyle = "#374151";
    const descLines = wrapText(ctx, config.description, W * 0.6);
    for (const line of descLines) {
      ctx.fillText(line, cx, curY);
      curY += 19;
    }
    curY += 15;

    // ─── Date ────────────────────────────────────────────
    ctx.font = isModern ? "500 11px Inter, sans-serif" : "400 12px Georgia, serif";
    ctx.fillStyle = "#6b7280";
    ctx.fillText(`Date: ${config.date}`, cx, curY);
    curY += 30;

    // ─── Signature Lines ─────────────────────────────────
    if (config.showSignatureLine) {
      const sigY = Math.max(curY, H - inset - 100);
      const leftX = W * 0.28;
      const rightX = W * 0.72;

      // Left signature
      drawDivider(ctx, leftX - 60, sigY, 120, "line", "#9ca3af", 0.6);
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(config.issuerName, leftX, sigY + 16);
      ctx.font = "400 9px Inter, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(config.issuerTitle, leftX, sigY + 30);

      // Right signature
      drawDivider(ctx, rightX - 60, sigY, 120, "line", "#9ca3af", 0.6);
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText("Authorized Signatory", rightX, sigY + 16);
    }

    // ─── Seal / Stamp ────────────────────────────────────
    if (config.showSeal) {
      const sealX = W * 0.5;
      const sealY = Math.max(curY - 5, H - inset - 130);
      drawSeal(ctx, sealX, sealY, 32, ac, "★");
    }

    // ─── Serial Number ───────────────────────────────────
    ctx.font = "400 8px 'Courier New', monospace";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(config.serialNumber, W - inset - 10, H - inset - 8);

    // ─── Organization (footer) ───────────────────────────
    if (config.template !== "corporate") {
      ctx.textAlign = "center";
      ctx.font = "400 9px Inter, sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(config.organizationName, cx, H - inset - 8);
    }

    // ─── Bottom decorative divider ───────────────────────
    drawDivider(ctx, W * 0.3, H - inset - 20, W * 0.4, "diamond", ac, 0.15);
  }, [config, sz, bc]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = useCallback(async () => {
    if (!config.eventName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `You are a professional certificate designer. Generate certificate text for a "${config.type}" certificate.

Event/Course: "${config.eventName}"
Organization based in Lusaka, Zambia.

Also recommend design settings.

Return ONLY valid JSON:
{
  "title": "Certificate of ...",
  "subtitle": "This is proudly presented to",
  "recipientName": "Participant Name",
  "description": "For successfully completing... (2 sentences max)",
  "issuerName": "Director Name",
  "issuerTitle": "Position, Organization",
  "organizationName": "Organization — Lusaka, Zambia",
  "template": "academic|corporate|elegant|modern|achievement|training|sports|creative",
  "border": "gold|silver|bronze|ornate|modern|minimal",
  "primaryColor": "#hex",
  "accentColor": "#hex",
  "pattern": "none|dots|lines|diagonal-lines|crosshatch|waves|diamond"
}`,
          }],
        }),
      });
      const text = await res.text();
      const clean = cleanAIText(text);
      const match = clean.match(/\{[\s\S]*\}/);
      if (match) {
        const data = JSON.parse(match[0]);
        const updates: Partial<CertificateConfig> = {};
        if (data.title) updates.title = data.title;
        if (data.subtitle) updates.subtitle = data.subtitle;
        if (data.recipientName) updates.recipientName = data.recipientName;
        if (data.description) updates.description = data.description;
        if (data.issuerName) updates.issuerName = data.issuerName;
        if (data.issuerTitle) updates.issuerTitle = data.issuerTitle;
        if (data.organizationName) updates.organizationName = data.organizationName;
        if (data.template && TEMPLATES.some((t) => t.id === data.template)) updates.template = data.template;
        if (data.border && BORDERS.some((b) => b.id === data.border)) updates.border = data.border;
        if (data.primaryColor?.match(/^#[0-9a-fA-F]{6}$/)) updates.primaryColor = data.primaryColor;
        if (data.accentColor?.match(/^#[0-9a-fA-F]{6}$/)) updates.accentColor = data.accentColor;
        if (data.pattern && patternOptions.some((p) => p.id === data.pattern)) updates.patternType = data.pattern;
        upd(updates);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }, [config, upd]);

  /* ── Export ──────────────────────────────────────────────── */
  const exportPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `certificate-${config.type}-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.type]);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* ignore */ }
  }, []);

  const handleExportPdf = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const isLandscape = sz.w > sz.h;
    const wMm = isLandscape ? 297 : 210;
    const hMm = isLandscape ? 210 : 297;
    const pdf = new jsPDF({
      orientation: isLandscape ? "l" : "p",
      unit: "mm",
      format: "a4",
    });
    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", 0, 0, wMm, hMm);
    pdf.save(`certificate-${config.type}-${Date.now()}.pdf`);
  }, [config.type, sz]);

  const displayW = Math.min(500, sz.w);
  const displayH = displayW * (sz.h / sz.w);

  /* ── Left Panel ─────────────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-3">
      <Accordion defaultOpen="templates">
      {/* Template Slider */}
      <AccordionSection icon={<IconLayout className="size-3.5" />} label="Templates" id="templates">
        <TemplateSlider
          templates={templatePreviews}
          activeId={config.template}
          onSelect={(id) => upd({ template: id as CertificateTemplate })}
          thumbWidth={140}
          thumbHeight={100}
          label=""
        />
      </AccordionSection>

      {/* Content */}
      <AccordionSection icon={<IconType className="size-3.5" />} label="Content" id="content">
        <div className="space-y-2">
          <input placeholder="Certificate Title" value={config.title} onChange={(e) => upd({ title: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          <input placeholder="Subtitle" value={config.subtitle} onChange={(e) => upd({ subtitle: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          <input placeholder="Recipient Name" value={config.recipientName} onChange={(e) => upd({ recipientName: e.target.value })}
            className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold" />
          <textarea placeholder="Description" value={config.description} onChange={(e) => upd({ description: e.target.value })} rows={3}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none" />
          <input placeholder="Date" value={config.date} onChange={(e) => upd({ date: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          <div className="grid grid-cols-2 gap-2">
            <input placeholder="Issuer Name" value={config.issuerName} onChange={(e) => upd({ issuerName: e.target.value })}
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input placeholder="Issuer Title" value={config.issuerTitle} onChange={(e) => upd({ issuerTitle: e.target.value })}
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          </div>
          <input placeholder="Organization" value={config.organizationName} onChange={(e) => upd({ organizationName: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
          <div className="flex gap-2 items-center">
            <input className="flex-1 h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs font-mono" placeholder="Serial" value={config.serialNumber} onChange={(e) => upd({ serialNumber: e.target.value })} />
            <button onClick={() => upd({ serialNumber: generateSerial() })} className="px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-[0.625rem] font-medium text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">New</button>
          </div>
        </div>
      </AccordionSection>

      {/* Style */}
      <AccordionSection icon={<IconDroplet className="size-3.5" />} label="Style" id="style">
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Type</label>
              <select value={config.type} onChange={(e) => upd({ type: e.target.value as CertificateType })}
                className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                {CERT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">Size</label>
              <select value={config.size} onChange={(e) => upd({ size: e.target.value as CertificateSize })}
                className="w-full h-9 px-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs">
                {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Border Style</p>
          <div className="grid grid-cols-3 gap-1.5">
            {BORDERS.map((b) => (
              <button key={b.id} onClick={() => upd({ border: b.id })}
                className={`px-2 py-1.5 rounded-xl border text-xs font-medium transition-all ${config.border === b.id ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"}`}>
                {b.label}
              </button>
            ))}
          </div>

          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Color Theme</p>
          <div className="grid grid-cols-5 gap-1.5">
            {colorPresets.map((theme) => (
              <button key={theme.name} onClick={() => upd({ primaryColor: theme.primary, accentColor: theme.accent })}
                className={`p-1.5 rounded-lg border text-center transition-all ${config.primaryColor === theme.primary ? "border-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <div className="flex gap-0.5 justify-center mb-0.5">
                  <div className="size-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                  <div className="size-3 rounded-full" style={{ backgroundColor: theme.accent }} />
                </div>
                <span className="text-[0.5rem] text-gray-400">{theme.name}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" />
              <span className="text-[0.5625rem] text-gray-400">Primary</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input type="color" value={config.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" />
              <span className="text-[0.5625rem] text-gray-400">Accent</span>
            </label>
          </div>

          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Pattern</p>
          <div className="flex flex-wrap gap-1">
            {patternOptions.map((p) => (
              <button key={p.id} onClick={() => upd({ patternType: p.id })}
                className={`px-2 py-1 rounded-lg border text-[0.625rem] font-medium transition-all ${config.patternType === p.id ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={config.showSeal} onChange={(e) => upd({ showSeal: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
              Show Seal
            </label>
            <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={config.showSignatureLine} onChange={(e) => upd({ showSignatureLine: e.target.checked })} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
              Signature Lines
            </label>
          </div>
        </div>
      </AccordionSection>
      </Accordion>

      {/* AI */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />AI Certificate Director
        </label>
        <textarea
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 px-3 py-2 text-xs text-gray-900 dark:text-white resize-none placeholder:text-gray-400 focus:outline-none focus:border-secondary-500 focus:ring-2 focus:ring-secondary-500/20"
          rows={3} placeholder="Describe the event or course (e.g., 'Advanced Data Science Bootcamp, 3-month programme')..."
          value={config.eventName} onChange={(e) => upd({ eventName: e.target.value })}
        />
        <button onClick={generateAI} disabled={loading || !config.eventName.trim()}
          className="w-full mt-2 flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          {loading ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Generate Certificate</>}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI suggests text, template, border & colors</p>
      </div>
    </div>
  );

  /* ── Right Panel ────────────────────────────────────────── */
  const rightPanel = (
    <div className="space-y-4">
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={exportPNG} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
            <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
          </button>
          <button onClick={handleCopy} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
            <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
          </button>
          <button onClick={handleExportPdf} className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-info-500/30 bg-info-500/5 text-info-500 transition-colors hover:bg-info-500/10">
            <IconPrinter className="size-4" /><span className="text-xs font-semibold">.pdf</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Certificate Info</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>Type: <span className="text-gray-300 capitalize">{config.type}</span></p>
          <p>Template: <span className="text-gray-300 capitalize">{config.template}</span></p>
          <p>Size: <span className="text-gray-300">{sz.label}</span></p>
          <p>Border: <span className="text-gray-300 capitalize">{config.border}</span></p>
          <p>Pattern: <span className="text-gray-300 capitalize">{config.patternType}</span></p>
          <p>Seal: <span className="text-gray-300">{config.showSeal ? "Yes" : "No"}</span></p>
          <p>Resolution: <span className="text-gray-300">{sz.w}×{sz.h}px</span></p>
          <p>Serial: <span className="text-gray-300 font-mono">{config.serialNumber}</span></p>
        </div>
      </div>
    </div>
  );

  const toolbar = (
    <div className="flex items-center gap-1.5">
      <IconAward className="size-3.5 text-primary-500" />
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.template}</span>
      <span className="text-gray-600">·</span>
      <span className="text-xs text-gray-500">{sz.label}</span>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${config.template} — ${sz.label} — ${sz.w}×${sz.h}px — ${config.serialNumber}`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button onClick={exportPNG} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
            <IconDownload className="size-3" />Download PNG
          </button>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconPrinter className="size-3" />PDF
          </button>
          <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
      }
    />
  );
}
