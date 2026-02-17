"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconAward,
} from "@/components/icons";
import { cleanAIText, hexToRgba } from "@/lib/canvas-utils";

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

const COLOR_PRESETS = [
  "#1e3a5f", "#0f766e", "#7c3aed", "#8b5e3c", "#b91c1c",
  "#1e40af", "#059669", "#c09c2c",
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
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

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
  });

  const sz = SIZES.find((s) => s.id === config.size)!;
  const bc = BORDER_COLORS[config.border];

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
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
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, "#ffffff");
      grad.addColorStop(1, "#f8fafc");
      ctx.fillStyle = grad;
    } else {
      ctx.fillStyle = "#fffef5";
    }
    ctx.fillRect(0, 0, W, H);

    // ─── Decorative Background Pattern ───────────────────
    if (config.template === "elegant" || config.template === "academic") {
      ctx.fillStyle = hexToRgba(ac, 0.03);
      for (let x = 0; x < W; x += 30) {
        for (let y = 0; y < H; y += 30) {
          ctx.beginPath();
          ctx.arc(x, y, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    if (config.template === "creative") {
      ctx.fillStyle = hexToRgba(pc, 0.04);
      ctx.beginPath();
      ctx.arc(W * 0.85, H * 0.15, 120, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(W * 0.1, H * 0.85, 80, 0, Math.PI * 2);
      ctx.fill();
    }
    if (config.template === "sports") {
      // diagonal stripes
      ctx.strokeStyle = hexToRgba(ac, 0.05);
      ctx.lineWidth = 20;
      for (let i = -H; i < W + H; i += 60) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    }

    // ─── Border ──────────────────────────────────────────
    const bw = config.border === "minimal" ? 2 : config.border === "modern" ? 4 : 8;
    // Outer border
    ctx.strokeStyle = bc.outer;
    ctx.lineWidth = bw;
    ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
    // Inner border
    const inset = bw + 8;
    ctx.strokeStyle = bc.inner;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(inset, inset, W - inset * 2, H - inset * 2);

    if (config.border === "ornate") {
      // corner flourishes
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
    }

    // ─── Template-specific header elements ───────────────
    const cx = W / 2;
    let curY = 0;

    if (config.template === "corporate") {
      // top color bar
      ctx.fillStyle = pc;
      ctx.fillRect(inset + 2, inset + 2, W - (inset + 2) * 2, 50);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Inter, Helvetica, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(config.organizationName.toUpperCase(), cx, inset + 32);
      curY = inset + 70;
    } else if (config.template === "training") {
      ctx.fillStyle = pc;
      ctx.fillRect(inset + 2, inset + 2, 8, H - (inset + 2) * 2);
      ctx.fillRect(W - inset - 10, inset + 2, 8, H - (inset + 2) * 2);
      curY = inset + 50;
    } else {
      curY = inset + 50;
    }

    // ─── Decorative line above title ─────────────────────
    if (isElegant) {
      ctx.strokeStyle = hexToRgba(ac, 0.4);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 100, curY);
      ctx.lineTo(cx + 100, curY);
      ctx.stroke();
      // small diamond center
      ctx.fillStyle = ac;
      ctx.save();
      ctx.translate(cx, curY);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
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
    ctx.fillText(config.title.toUpperCase(), cx, curY + 20);
    curY += 50;

    // ─── Decorative divider ──────────────────────────────
    ctx.strokeStyle = ac;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 80, curY);
    ctx.lineTo(cx + 80, curY);
    ctx.stroke();
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
    ctx.fillText(config.recipientName || "Recipient Name", cx, curY + 18);
    curY += 42;

    // Name underline
    const nameW = Math.min(ctx.measureText(config.recipientName || "Recipient Name").width + 40, W * 0.5);
    ctx.strokeStyle = hexToRgba(ac, 0.5);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - nameW / 2, curY);
    ctx.lineTo(cx + nameW / 2, curY);
    ctx.stroke();
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
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(leftX - 60, sigY);
      ctx.lineTo(leftX + 60, sigY);
      ctx.stroke();
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText(config.issuerName, leftX, sigY + 16);
      ctx.font = "400 9px Inter, sans-serif";
      ctx.fillStyle = "#6b7280";
      ctx.fillText(config.issuerTitle, leftX, sigY + 30);

      // Right signature
      ctx.strokeStyle = "#9ca3af";
      ctx.beginPath();
      ctx.moveTo(rightX - 60, sigY);
      ctx.lineTo(rightX + 60, sigY);
      ctx.stroke();
      ctx.font = "500 10px Inter, sans-serif";
      ctx.fillStyle = "#374151";
      ctx.fillText("Authorized Signatory", rightX, sigY + 16);
    }

    // ─── Seal / Stamp ────────────────────────────────────
    if (config.showSeal) {
      const sealX = W * 0.5;
      const sealY = Math.max(curY - 5, H - inset - 130);
      const sealR = 32;

      // Serrated edge
      ctx.fillStyle = hexToRgba(ac, 0.15);
      ctx.beginPath();
      const teeth = 24;
      for (let i = 0; i < teeth; i++) {
        const angle = (i / teeth) * Math.PI * 2;
        const r = i % 2 === 0 ? sealR + 4 : sealR - 2;
        const px = sealX + Math.cos(angle) * r;
        const py = sealY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();

      // Inner circle
      ctx.beginPath();
      ctx.arc(sealX, sealY, sealR - 6, 0, Math.PI * 2);
      ctx.strokeStyle = ac;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Star in center
      ctx.fillStyle = ac;
      const starR = 8;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? starR : starR * 0.4;
        const px = sealX + Math.cos(angle) * r;
        const py = sealY + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
    }

    // ─── Serial Number ───────────────────────────────────
    ctx.font = "400 8px 'Courier New', monospace";
    ctx.fillStyle = "#9ca3af";
    ctx.textAlign = "right";
    ctx.fillText(config.serialNumber, W - inset - 10, H - inset - 8);

    // ─── Organization (footer) ───────────────────────────
    if (config.template !== "corporate") {
      ctx.textAlign = "center";
      ctx.font = "400 9px Inter, sans-serif";
      ctx.fillStyle = "#9ca3af";
      ctx.fillText(config.organizationName, cx, H - inset - 8);
    }
  }, [config, sz, bc]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.eventName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate certificate text for a "${config.type}" certificate. Event/course: "${config.eventName}". Organization based in Lusaka, Zambia. Return JSON only: { "title": "Certificate of ...", "subtitle": "This is proudly presented to", "recipientName": "Participant Name", "description": "For successfully completing... (2 sentences max)", "issuerName": "Director Name", "issuerTitle": "Position, Organization", "organizationName": "Organization — Lusaka, Zambia" }`,
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
          recipientName: data.recipientName || p.recipientName,
          description: data.description || p.description,
          issuerName: data.issuerName || p.issuerName,
          issuerTitle: data.issuerTitle || p.issuerTitle,
          organizationName: data.organizationName || p.organizationName,
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
    link.download = `certificate-${config.type}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const upd = (patch: Partial<CertificateConfig>) => setConfig((p) => ({ ...p, ...patch }));

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <div>
      {/* Mobile Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 md:hidden">
        {(["canvas", "settings"] as const).map((t) => (
          <button key={t} onClick={() => setMobileTab(t)} className={`flex-1 py-2.5 text-xs font-semibold capitalize ${mobileTab === t ? "text-primary-500 border-b-2 border-primary-500" : "text-gray-400"}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Settings Panel ───────────────────────────── */}
        <div className={`w-full lg:w-80 shrink-0 space-y-4 ${mobileTab !== "settings" ? "hidden md:block" : ""}`}>
          {/* General */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconAward className="size-4 text-primary-500" />Certificate Settings</h3>

            <label className="block text-xs text-gray-400">Type</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.type} onChange={(e) => upd({ type: e.target.value as CertificateType })}>
              {CERT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>

            <label className="block text-xs text-gray-400">Size</label>
            <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.size} onChange={(e) => upd({ size: e.target.value as CertificateSize })}>
              {SIZES.map((s) => <option key={s.id} value={s.id}>{s.label} ({s.w}×{s.h})</option>)}
            </select>

            <label className="block text-xs text-gray-400">Border Style</label>
            <div className="grid grid-cols-3 gap-1.5">
              {BORDERS.map((b) => (
                <button key={b.id} onClick={() => upd({ border: b.id })} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.border === b.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{b.label}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Template</label>
            <div className="grid grid-cols-2 gap-1.5">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => upd({ template: t.id })} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.template === t.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{t.label}</button>
              ))}
            </div>

            <label className="block text-xs text-gray-400">Colors</label>
            <div className="flex gap-1.5 flex-wrap">
              {COLOR_PRESETS.map((c) => (
                <button key={c} onClick={() => upd({ primaryColor: c })} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Primary</label>
                <input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Accent</label>
                <input type="color" value={config.accentColor} onChange={(e) => upd({ accentColor: e.target.value })} className="w-full h-8 rounded cursor-pointer" />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showSeal} onChange={(e) => upd({ showSeal: e.target.checked })} className="accent-primary-500" /> Show Seal
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                <input type="checkbox" checked={config.showSignatureLine} onChange={(e) => upd({ showSignatureLine: e.target.checked })} className="accent-primary-500" /> Signature Lines
              </label>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3 max-h-72 overflow-y-auto">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>
            <label className="block text-xs text-gray-400">Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.title} onChange={(e) => upd({ title: e.target.value })} />
            <label className="block text-xs text-gray-400">Subtitle</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subtitle} onChange={(e) => upd({ subtitle: e.target.value })} />
            <label className="block text-xs text-gray-400">Recipient Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.recipientName} onChange={(e) => upd({ recipientName: e.target.value })} />
            <label className="block text-xs text-gray-400">Description</label>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} value={config.description} onChange={(e) => upd({ description: e.target.value })} />
            <label className="block text-xs text-gray-400">Date</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.date} onChange={(e) => upd({ date: e.target.value })} />
            <label className="block text-xs text-gray-400">Issuer Name</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.issuerName} onChange={(e) => upd({ issuerName: e.target.value })} />
            <label className="block text-xs text-gray-400">Issuer Title</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.issuerTitle} onChange={(e) => upd({ issuerTitle: e.target.value })} />
            <label className="block text-xs text-gray-400">Organization</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.organizationName} onChange={(e) => upd({ organizationName: e.target.value })} />
            <label className="block text-xs text-gray-400">Serial Number</label>
            <div className="flex gap-2">
              <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono" value={config.serialNumber} onChange={(e) => upd({ serialNumber: e.target.value })} />
              <button onClick={() => upd({ serialNumber: generateSerial() })} className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">New</button>
            </div>
          </div>

          {/* AI */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Certificate Generator</h3>
            <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the event or course (e.g., 'Advanced Data Science Bootcamp, 3-month programme')..." value={config.eventName} onChange={(e) => upd({ eventName: e.target.value })} />
            <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
              {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
              {loading ? "Generating…" : "Generate Certificate Text"}
            </button>
          </div>

          {/* Export */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-2">
            <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"><IconDownload className="size-4" />Export PNG</button>
          </div>
        </div>

        {/* ── Canvas ────────────────────────────────────── */}
        <div className={`flex-1 min-w-0 ${mobileTab !== "canvas" ? "hidden md:block" : ""}`}>
          <div className="flex items-center justify-center bg-gray-100 dark:bg-gray-800/50 rounded-2xl p-4 overflow-auto">
            <canvas ref={canvasRef} style={{ width: Math.min(sz.w, 700), height: Math.min(sz.w, 700) * (sz.h / sz.w) }} className="rounded-lg shadow-lg" />
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">{config.template} — {sz.label} — {sz.w}×{sz.h}px — {config.serialNumber}</p>
        </div>
      </div>
    </div>
  );
}
