"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconTag,
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

type CouponType = "discount" | "gift-voucher" | "event-ticket";
type CouponTemplate = "modern" | "classic" | "bold" | "elegant" | "festive" | "minimal";

interface CouponConfig {
  type: CouponType;
  template: CouponTemplate;
  primaryColor: string;
  businessName: string;
  headline: string;
  discountValue: string;
  discountLabel: string;
  description: string;
  termsText: string;
  couponCode: string;
  expiryDate: string;
  currency: string;
  aiPrompt: string;
}

const TYPES: { id: CouponType; name: string }[] = [
  { id: "discount", name: "Discount Coupon" },
  { id: "gift-voucher", name: "Gift Voucher" },
  { id: "event-ticket", name: "Event Ticket" },
];

const TEMPLATES: { id: CouponTemplate; name: string }[] = [
  { id: "modern", name: "Modern" },
  { id: "classic", name: "Classic" },
  { id: "bold", name: "Bold" },
  { id: "elegant", name: "Elegant" },
  { id: "festive", name: "Festive" },
  { id: "minimal", name: "Minimal" },
];

const COLOR_PRESETS = ["#1e40af", "#0f766e", "#7c3aed", "#dc2626", "#ea580c", "#0284c7", "#4f46e5", "#059669"];

const COUPON_W = 900;
const COUPON_H = 400;

function generateCode(): string {
  return "DMS-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}

/* ── Component ─────────────────────────────────────────────── */

export default function CouponDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<CouponConfig>({
    type: "discount",
    template: "modern",
    primaryColor: "#1e40af",
    businessName: "DMSuite Store",
    headline: "SPECIAL OFFER",
    discountValue: "25%",
    discountLabel: "OFF",
    description: "On all products in-store and online",
    termsText: "Cannot be combined with other offers. One per customer. Valid at Lusaka branches only.",
    couponCode: generateCode(),
    expiryDate: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
    currency: "ZMW",
    aiPrompt: "",
  });

  /* ── Render ─────────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    canvas.width = COUPON_W;
    canvas.height = COUPON_H;

    const W = COUPON_W;
    const H = COUPON_H;
    const pc = config.primaryColor;
    const font = "'Inter', 'Segoe UI', sans-serif";

    /* Background */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);

    const tearX = W * 0.68;

    /* Template-specific background */
    if (config.template === "modern") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, tearX, H);
    } else if (config.template === "classic") {
      ctx.fillStyle = "#fefce8";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, W, 6);
      ctx.fillRect(0, H - 6, W, 6);
    } else if (config.template === "bold") {
      const grad = ctx.createLinearGradient(0, 0, tearX, H);
      grad.addColorStop(0, pc);
      grad.addColorStop(1, "#111827");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, tearX, H);
    } else if (config.template === "elegant") {
      ctx.fillStyle = "#1e1b4b";
      ctx.fillRect(0, 0, tearX, H);
      ctx.strokeStyle = "#fbbf2480";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, tearX - 20, H - 20);
    } else if (config.template === "festive") {
      ctx.fillStyle = pc;
      ctx.fillRect(0, 0, tearX, H);
      /* Confetti dots */
      const colors = ["#fbbf24", "#f472b6", "#34d399", "#ffffff"];
      for (let i = 0; i < 30; i++) {
        ctx.beginPath();
        ctx.arc(Math.random() * tearX, Math.random() * H, 3 + Math.random() * 6, 0, Math.PI * 2);
        ctx.fillStyle = colors[i % colors.length] + "40";
        ctx.fill();
      }
    } else {
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, tearX, H);
    }

    /* Tear-off perforation line */
    ctx.save();
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = "#94a3b880";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(tearX, 0);
    ctx.lineTo(tearX, H);
    ctx.stroke();
    ctx.restore();

    /* Semicircle cutouts at tear line */
    const cutR = 14;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(tearX, 0, cutR, 0, Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(tearX, H, cutR, Math.PI, Math.PI * 2);
    ctx.fill();

    /* Left side: main content */
    const isDarkBg = config.template !== "classic" && config.template !== "minimal";
    const textW = isDarkBg ? "#ffffff" : "#1e293b";
    const textSub = isDarkBg ? "#ffffffcc" : "#64748b";

    /* Business name */
    ctx.fillStyle = textW;
    ctx.font = `bold 16px ${font}`;
    ctx.textAlign = "left";
    ctx.fillText(config.businessName, 30, 40);

    /* Headline */
    ctx.font = `bold 18px ${font}`;
    ctx.fillStyle = textSub;
    ctx.fillText(config.headline, 30, 80);

    /* Discount value — large */
    ctx.font = `bold 72px ${font}`;
    ctx.fillStyle = textW;
    ctx.fillText(config.discountValue, 30, 180);

    /* Discount label */
    const valW = ctx.measureText(config.discountValue).width;
    ctx.font = `bold 32px ${font}`;
    ctx.fillStyle = isDarkBg ? "#fbbf24" : pc;
    ctx.fillText(config.discountLabel, 36 + valW, 180);

    /* Description */
    ctx.font = `14px ${font}`;
    ctx.fillStyle = textSub;
    const words = config.description.split(" ");
    let line = "";
    let ly = 220;
    for (const word of words) {
      const test = line + word + " ";
      if (ctx.measureText(test).width > tearX - 70 && line) {
        ctx.fillText(line.trim(), 30, ly);
        line = word + " ";
        ly += 20;
      } else {
        line = test;
      }
    }
    if (line) ctx.fillText(line.trim(), 30, ly);

    /* Expiry */
    ctx.font = `12px ${font}`;
    ctx.fillStyle = textSub;
    ctx.fillText(`Valid until: ${config.expiryDate}`, 30, H - 50);

    /* Terms */
    ctx.font = `9px ${font}`;
    ctx.fillStyle = isDarkBg ? "#ffffff80" : "#94a3b8";
    const tWords = config.termsText.split(" ");
    let tLine = "";
    let ty = H - 30;
    for (const tw of tWords) {
      const test = tLine + tw + " ";
      if (ctx.measureText(test).width > tearX - 70 && tLine) {
        ctx.fillText(tLine.trim(), 30, ty);
        tLine = tw + " ";
        ty += 12;
        if (ty > H - 6) break;
      } else {
        tLine = test;
      }
    }
    if (tLine && ty <= H - 6) ctx.fillText(tLine.trim(), 30, ty);

    /* Right side: code & QR */
    const rightCx = tearX + (W - tearX) / 2;

    ctx.fillStyle = "#f1f5f9";
    ctx.fillRect(tearX + 1, 0, W - tearX - 1, H);

    ctx.fillStyle = "#1e293b";
    ctx.font = `bold 13px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText("YOUR CODE", rightCx, 60);

    /* Code box */
    const codeW = 180;
    const codeH = 44;
    const codeX = rightCx - codeW / 2;
    ctx.strokeStyle = pc;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(codeX, 75, codeW, codeH);
    ctx.setLineDash([]);

    ctx.fillStyle = pc;
    ctx.font = `bold 20px ${font}`;
    ctx.fillText(config.couponCode, rightCx, 104);

    /* QR Zone placeholder */
    const qrSize = 100;
    const qrX = rightCx - qrSize / 2;
    const qrY = 145;
    ctx.fillStyle = "#e5e7eb";
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.strokeRect(qrX, qrY, qrSize, qrSize);
    ctx.fillStyle = "#9ca3af";
    ctx.font = `11px ${font}`;
    ctx.fillText("QR CODE", rightCx, qrY + qrSize / 2 + 4);

    /* Scan instruction */
    ctx.fillStyle = "#64748b";
    ctx.font = `10px ${font}`;
    ctx.fillText("Scan to redeem", rightCx, qrY + qrSize + 20);

    /* Scissors icon text */
    ctx.fillStyle = "#94a3b8";
    ctx.font = `18px ${font}`;
    ctx.textAlign = "center";
    ctx.fillText("✂", tearX, H / 2 + 4);

    /* Border */
    ctx.strokeStyle = "#d1d5db";
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, W, H);
  }, [config, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.aiPrompt.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate coupon/voucher content for: ${config.aiPrompt}. Business: ${config.businessName}. Type: ${config.type}. Based in Lusaka, Zambia. Currency: ZMW. Return JSON: { "headline": "", "discountValue": "", "discountLabel": "", "description": "", "termsText": "" }`,
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
          headline: data.headline || p.headline,
          discountValue: data.discountValue || p.discountValue,
          discountLabel: data.discountLabel || p.discountLabel,
          description: data.description || p.description,
          termsText: data.termsText || p.termsText,
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
    link.download = `coupon-${config.type}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  /* ── Zoom & Display ─────────────────────────────────────── */
  const [zoom, setZoom] = useState(1);
  const displayW = Math.min(700, COUPON_W);
  const displayH = displayW * (COUPON_H / COUPON_W);

  /* ── Template Previews ──────────────────────────────────── */
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.name,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, w, h);
          const tearX = w * 0.68;
          const pc = config.primaryColor;
          if (t.id === "modern") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, tearX, h);
          } else if (t.id === "classic") {
            ctx.fillStyle = "#fefce8";
            ctx.fillRect(0, 0, w, h);
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, w, 3);
            ctx.fillRect(0, h - 3, w, 3);
          } else if (t.id === "bold") {
            const grad = ctx.createLinearGradient(0, 0, tearX, h);
            grad.addColorStop(0, pc);
            grad.addColorStop(1, "#111827");
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, tearX, h);
          } else if (t.id === "elegant") {
            ctx.fillStyle = "#1e1b4b";
            ctx.fillRect(0, 0, tearX, h);
          } else if (t.id === "festive") {
            ctx.fillStyle = pc;
            ctx.fillRect(0, 0, tearX, h);
          } else {
            ctx.fillStyle = "#f8fafc";
            ctx.fillRect(0, 0, tearX, h);
          }
          /* tear line */
          ctx.save();
          ctx.setLineDash([3, 3]);
          ctx.strokeStyle = "#94a3b860";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(tearX, 0);
          ctx.lineTo(tearX, h);
          ctx.stroke();
          ctx.restore();
          /* right side */
          ctx.fillStyle = "#f1f5f9";
          ctx.fillRect(tearX + 1, 0, w - tearX - 1, h);
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

  /* ── UI ──────────────────────────────────────────────────── */
  /* ── Panel Definitions for StickyCanvasLayout ───────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => setConfig((p) => ({ ...p, template: id as CouponTemplate }))}
        thumbWidth={140}
        thumbHeight={62}
        label="Templates"
      />

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconTag className="size-4 text-primary-500" />Coupon Settings</h3>

        <label className="block text-xs text-gray-400">Business Name</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.businessName} onChange={(e) => setConfig((p) => ({ ...p, businessName: e.target.value }))} />

        <label className="block text-xs text-gray-400">Coupon Type</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.type} onChange={(e) => setConfig((p) => ({ ...p, type: e.target.value as CouponType }))}>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>

        <label className="block text-xs text-gray-400">Headline</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.headline} onChange={(e) => setConfig((p) => ({ ...p, headline: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Value</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.discountValue} onChange={(e) => setConfig((p) => ({ ...p, discountValue: e.target.value }))} />
          </div>
          <div>
            <label className="block text-xs text-gray-400">Label</label>
            <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.discountLabel} onChange={(e) => setConfig((p) => ({ ...p, discountLabel: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Description</label>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.description} onChange={(e) => setConfig((p) => ({ ...p, description: e.target.value }))} />

        <label className="block text-xs text-gray-400">Terms & Conditions</label>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={2} value={config.termsText} onChange={(e) => setConfig((p) => ({ ...p, termsText: e.target.value }))} />

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-gray-400">Coupon Code</label>
            <div className="flex gap-1">
              <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white font-mono" value={config.couponCode} onChange={(e) => setConfig((p) => ({ ...p, couponCode: e.target.value }))} />
              <button onClick={() => setConfig((p) => ({ ...p, couponCode: generateCode() }))} className="px-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700">↻</button>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400">Expiry</label>
            <input type="date" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.expiryDate} onChange={(e) => setConfig((p) => ({ ...p, expiryDate: e.target.value }))} />
          </div>
        </div>

        <label className="block text-xs text-gray-400">Primary Color</label>
        <div className="flex gap-1.5 flex-wrap">
          {COLOR_PRESETS.map((c) => (
            <button key={c} onClick={() => setConfig((p) => ({ ...p, primaryColor: c }))} className={`size-7 rounded-full border-2 ${config.primaryColor === c ? "border-white scale-110" : "border-transparent"}`} style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>

      {/* AI Generation */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Content Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the promotion (e.g. 'Holiday sale for a Lusaka electronics shop')..." value={config.aiPrompt} onChange={(e) => setConfig((p) => ({ ...p, aiPrompt: e.target.value }))} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Content"}
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
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${TYPES.find((t) => t.id === config.type)?.name} — ${COUPON_W}×${COUPON_H}px`}
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
