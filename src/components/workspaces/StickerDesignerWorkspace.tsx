"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  IconSparkles,
  IconWand,
  IconLoader,
  IconDownload,
  IconTag,
  IconCopy,
} from "@/components/icons";
import { cleanAIText, hexToRgba, getContrastColor } from "@/lib/canvas-utils";
import StickyCanvasLayout from "@/components/workspaces/StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "@/components/workspaces/TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { useAdvancedSettingsStore } from "@/stores";

/* ── Types ─────────────────────────────────────────────────── */

type StickerShape = "circle" | "rectangle" | "rounded-rect" | "oval";
type StickerTemplate = "product-label" | "address-label" | "price-tag" | "decorative" | "promotional" | "qr-code" | "barcode" | "badge";

interface StickerConfig {
  shape: StickerShape;
  template: StickerTemplate;
  width: number;
  height: number;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  textColor: string;
  title: string;
  subtitle: string;
  line1: string;
  line2: string;
  line3: string;
  price: string;
  showCutLine: boolean;
  showSafeZone: boolean;
  sheetMode: boolean;
  sheetCols: number;
  sheetRows: number;
  borderRadius: number;
  productDescription: string;
}

/* ── Constants ─────────────────────────────────────────────── */

const SHAPES: { id: StickerShape; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "rectangle", label: "Rectangle" },
  { id: "rounded-rect", label: "Rounded Rect" },
  { id: "oval", label: "Oval" },
];

const SIZES: { label: string; w: number; h: number }[] = [
  { label: "2\" Circle (200×200)", w: 200, h: 200 },
  { label: "3\" Circle (300×300)", w: 300, h: 300 },
  { label: "2×3\" Label (200×300)", w: 200, h: 300 },
  { label: "3×2\" Label (300×200)", w: 300, h: 200 },
  { label: "4×3\" Label (400×300)", w: 400, h: 300 },
  { label: "2×1\" Strip (200×100)", w: 200, h: 100 },
  { label: "4×6\" Sheet (400×600)", w: 400, h: 600 },
];

const TEMPLATES: { id: StickerTemplate; label: string }[] = [
  { id: "product-label", label: "Product Label" },
  { id: "address-label", label: "Address Label" },
  { id: "price-tag", label: "Price Tag" },
  { id: "decorative", label: "Decorative" },
  { id: "promotional", label: "Promotional" },
  { id: "qr-code", label: "QR Code" },
  { id: "barcode", label: "Barcode" },
  { id: "badge", label: "Badge" },
];

const COLOR_PRESETS = [
  { name: "Lime Pro", primary: "#8ae600", secondary: "#06b6d4", bg: "#ffffff", text: "#1e293b" },
  { name: "Classic", primary: "#1e293b", secondary: "#64748b", bg: "#ffffff", text: "#1e293b" },
  { name: "Gold", primary: "#c09c2c", secondary: "#f0e68c", bg: "#fffef5", text: "#1e293b" },
  { name: "Red", primary: "#dc2626", secondary: "#fca5a5", bg: "#ffffff", text: "#1e293b" },
  { name: "Navy", primary: "#1e40af", secondary: "#93c5fd", bg: "#ffffff", text: "#1e293b" },
  { name: "Forest", primary: "#16a34a", secondary: "#86efac", bg: "#ffffff", text: "#1e293b" },
  { name: "Dark", primary: "#8ae600", secondary: "#06b6d4", bg: "#0f172a", text: "#ffffff" },
  { name: "Kraft", primary: "#78350f", secondary: "#92400e", bg: "#fef3c7", text: "#451a03" },
];



/* ── Component ─────────────────────────────────────────────── */

export default function StickerDesignerWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(false);
  const [mobileTab, setMobileTab] = useState<"canvas" | "settings">("canvas");

  // Subscribe to global advanced settings for canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  const [config, setConfig] = useState<StickerConfig>({
    shape: "rounded-rect",
    template: "product-label",
    width: 300,
    height: 300,
    primaryColor: "#1e293b",
    secondaryColor: "#64748b",
    bgColor: "#ffffff",
    textColor: "#1e293b",
    title: "DMSuite",
    subtitle: "Premium Quality",
    line1: "Handmade in Lusaka",
    line2: "Zambia",
    line3: "www.dmsuite.com",
    price: "K49.99",
    showCutLine: true,
    showSafeZone: true,
    sheetMode: false,
    sheetCols: 3,
    sheetRows: 4,
    borderRadius: 20,
    productDescription: "",
  });

  /* ── Single Sticker Renderer ────────────────────────────── */
  function renderSingleSticker(
    ctx: CanvasRenderingContext2D,
    x: number, y: number,
    w: number, h: number,
    scale: number
  ) {
    const pc = config.primaryColor;
    const sc = config.secondaryColor;
    const bg = config.bgColor;
    const tc = config.textColor;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const s = scale;

    // ─── Clip to shape ───────────────────────────────────
    ctx.save();
    ctx.beginPath();
    switch (config.shape) {
      case "circle":
        ctx.arc(cx, cy, Math.min(w, h) / 2, 0, Math.PI * 2);
        break;
      case "oval":
        ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
        break;
      case "rounded-rect":
        ctx.roundRect(x, y, w, h, config.borderRadius * s);
        break;
      case "rectangle":
      default:
        ctx.rect(x, y, w, h);
        break;
    }
    ctx.clip();

    // ─── Background ──────────────────────────────────────
    ctx.fillStyle = bg;
    ctx.fillRect(x, y, w, h);

    // ─── Template-specific content ───────────────────────
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    switch (config.template) {
      case "product-label": {
        // Top color strip
        ctx.fillStyle = pc;
        ctx.fillRect(x, y, w, h * 0.2);

        // Brand
        ctx.font = `700 ${14 * s}px Inter, sans-serif`;
        ctx.fillStyle = getContrastColor(pc);
        ctx.fillText(config.title, cx, y + h * 0.1, w - 20 * s);

        // Divider
        ctx.fillStyle = hexToRgba(sc, 0.3);
        ctx.fillRect(cx - 25 * s, y + h * 0.25, 50 * s, 1.5 * s);

        // Subtitle
        ctx.font = `italic ${10 * s}px Georgia, serif`;
        ctx.fillStyle = hexToRgba(tc, 0.6);
        ctx.fillText(config.subtitle, cx, y + h * 0.33, w - 20 * s);

        // Content lines
        ctx.font = `400 ${9 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.7);
        if (config.line1) ctx.fillText(config.line1, cx, y + h * 0.50, w - 20 * s);
        if (config.line2) ctx.fillText(config.line2, cx, y + h * 0.58, w - 20 * s);

        // Bottom line
        ctx.font = `500 ${8 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.4);
        if (config.line3) ctx.fillText(config.line3, cx, y + h * 0.85, w - 20 * s);
        break;
      }

      case "address-label": {
        // Border
        ctx.strokeStyle = hexToRgba(pc, 0.3);
        ctx.lineWidth = 1.5 * s;
        ctx.strokeRect(x + 6 * s, y + 6 * s, w - 12 * s, h - 12 * s);

        // From label
        ctx.font = `600 ${8 * s}px Inter, sans-serif`;
        ctx.fillStyle = pc;
        ctx.textAlign = "left";
        ctx.fillText("FROM:", x + 15 * s, y + 20 * s);

        ctx.font = `400 ${10 * s}px Inter, sans-serif`;
        ctx.fillStyle = tc;
        ctx.fillText(config.title, x + 15 * s, y + 36 * s);
        ctx.font = `400 ${9 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.7);
        ctx.fillText(config.line1, x + 15 * s, y + 50 * s);
        ctx.fillText(config.line2, x + 15 * s, y + 63 * s);
        ctx.fillText(config.line3 || "+260 97X XXX XXX", x + 15 * s, y + 76 * s);
        break;
      }

      case "price-tag": {
        // Price circle bg
        ctx.fillStyle = pc;
        const priceR = Math.min(w, h) * 0.3;
        ctx.beginPath();
        ctx.arc(cx, cy - 5 * s, priceR, 0, Math.PI * 2);
        ctx.fill();

        // Price
        ctx.font = `800 ${20 * s}px Inter, sans-serif`;
        ctx.fillStyle = getContrastColor(pc);
        ctx.fillText(config.price, cx, cy - 3 * s);

        // Product name below
        ctx.font = `600 ${10 * s}px Inter, sans-serif`;
        ctx.fillStyle = tc;
        ctx.fillText(config.title, cx, cy + priceR + 12 * s, w - 15 * s);

        // Subtitle
        ctx.font = `400 ${8 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.5);
        ctx.fillText(config.subtitle, cx, cy + priceR + 26 * s, w - 15 * s);
        break;
      }

      case "decorative": {
        // Full-color bg
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 2);
        grad.addColorStop(0, sc);
        grad.addColorStop(1, pc);
        ctx.fillStyle = grad;
        ctx.fillRect(x, y, w, h);

        // Decorative dots
        ctx.fillStyle = hexToRgba("#ffffff", 0.1);
        for (let dx = 0; dx < w; dx += 15 * s) {
          for (let dy = 0; dy < h; dy += 15 * s) {
            ctx.beginPath();
            ctx.arc(x + dx, y + dy, 1.5 * s, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Text
        ctx.font = `800 ${16 * s}px Inter, sans-serif`;
        ctx.fillStyle = "#ffffff";
        ctx.fillText(config.title, cx, cy - 8 * s, w - 20 * s);
        ctx.font = `400 ${10 * s}px Inter, sans-serif`;
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(config.subtitle, cx, cy + 10 * s, w - 20 * s);
        break;
      }

      case "promotional": {
        // Bold diagonal
        ctx.save();
        ctx.fillStyle = pc;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y);
        ctx.lineTo(x + w, y + h * 0.55);
        ctx.lineTo(x, y + h * 0.45);
        ctx.closePath();
        ctx.fill();
        ctx.restore();

        // Title
        ctx.font = `800 ${18 * s}px Inter, sans-serif`;
        ctx.fillStyle = getContrastColor(pc);
        ctx.fillText(config.title.toUpperCase(), cx, y + h * 0.22, w - 15 * s);

        // Price / offer
        ctx.font = `700 ${22 * s}px Inter, sans-serif`;
        ctx.fillStyle = pc;
        ctx.fillText(config.price || "SALE!", cx, y + h * 0.65, w - 15 * s);

        // Subtitle
        ctx.font = `500 ${9 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.6);
        ctx.fillText(config.subtitle, cx, y + h * 0.82, w - 15 * s);
        break;
      }

      case "qr-code": {
        // Simulated QR code pattern
        const qrSize = Math.min(w, h) * 0.45;
        const qrX = cx - qrSize / 2;
        const qrY = cy - qrSize / 2 - 10 * s;
        const cellSize = qrSize / 12;

        // QR border
        ctx.fillStyle = "#000000";
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(qrX + cellSize, qrY + cellSize, qrSize - cellSize * 2, qrSize - cellSize * 2);

        // Random QR-like pattern
        ctx.fillStyle = "#000000";
        for (let qx = 0; qx < 10; qx++) {
          for (let qy = 0; qy < 10; qy++) {
            // Corner markers
            const isCorner = (qx < 3 && qy < 3) || (qx >= 7 && qy < 3) || (qx < 3 && qy >= 7);
            if (isCorner || Math.random() > 0.5) {
              ctx.fillRect(qrX + (qx + 1) * cellSize, qrY + (qy + 1) * cellSize, cellSize * 0.8, cellSize * 0.8);
            }
          }
        }

        // Label below
        ctx.font = `600 ${10 * s}px Inter, sans-serif`;
        ctx.fillStyle = tc;
        ctx.fillText(config.title, cx, qrY + qrSize + 18 * s, w - 15 * s);
        ctx.font = `400 ${8 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(tc, 0.5);
        ctx.fillText("Scan to learn more", cx, qrY + qrSize + 32 * s, w - 15 * s);
        break;
      }

      case "barcode": {
        // Barcode bars
        const bcW = w * 0.7;
        const bcH = h * 0.35;
        const bcX = cx - bcW / 2;
        const bcY = cy - bcH / 2 - 5 * s;

        ctx.fillStyle = "#000000";
        const barCount = Math.floor(bcW / (3 * s));
        for (let i = 0; i < barCount; i++) {
          const bw = (i % 3 === 0) ? 2.5 * s : (i % 2 === 0) ? 1.5 * s : 1 * s;
          ctx.fillRect(bcX + i * 3 * s, bcY, bw, bcH);
        }

        // Number below
        ctx.font = `400 ${9 * s}px 'Courier New', monospace`;
        ctx.fillStyle = tc;
        ctx.fillText("6 009876 543210", cx, bcY + bcH + 12 * s);

        // Product name
        ctx.font = `600 ${10 * s}px Inter, sans-serif`;
        ctx.fillText(config.title, cx, bcY - 14 * s, w - 15 * s);

        // Price below barcode
        if (config.price) {
          ctx.font = `700 ${12 * s}px Inter, sans-serif`;
          ctx.fillStyle = pc;
          ctx.fillText(config.price, cx, bcY + bcH + 28 * s);
        }
        break;
      }

      case "badge": {
        // Serrated edge badge
        ctx.fillStyle = pc;
        const badgeR = Math.min(w, h) * 0.38;
        ctx.beginPath();
        const teeth = 20;
        for (let i = 0; i < teeth; i++) {
          const angle = (i / teeth) * Math.PI * 2;
          const r = i % 2 === 0 ? badgeR : badgeR * 0.88;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();

        // Inner circle
        ctx.beginPath();
        ctx.arc(cx, cy, badgeR * 0.75, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(getContrastColor(pc), 0.3);
        ctx.lineWidth = 1.5 * s;
        ctx.stroke();

        // Text
        ctx.font = `800 ${14 * s}px Inter, sans-serif`;
        ctx.fillStyle = getContrastColor(pc);
        ctx.fillText(config.title.toUpperCase(), cx, cy - 5 * s, badgeR * 1.3);
        ctx.font = `400 ${8 * s}px Inter, sans-serif`;
        ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.7);
        ctx.fillText(config.subtitle, cx, cy + 12 * s, badgeR * 1.3);
        break;
      }
    }

    ctx.restore();

    // ─── Cut line (outside clip) ─────────────────────────
    if (config.showCutLine) {
      ctx.save();
      ctx.setLineDash([4, 3]);
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      switch (config.shape) {
        case "circle":
          ctx.arc(cx, cy, Math.min(w, h) / 2 + 4 * s, 0, Math.PI * 2);
          break;
        case "oval":
          ctx.ellipse(cx, cy, w / 2 + 4 * s, h / 2 + 4 * s, 0, 0, Math.PI * 2);
          break;
        case "rounded-rect":
          ctx.roundRect(x - 4 * s, y - 4 * s, w + 8 * s, h + 8 * s, (config.borderRadius + 4) * s);
          break;
        default:
          ctx.rect(x - 4 * s, y - 4 * s, w + 8 * s, h + 8 * s);
          break;
      }
      ctx.stroke();
      ctx.restore();
    }

    // ─── Safe zone (inside) ──────────────────────────────
    if (config.showSafeZone) {
      ctx.save();
      ctx.setLineDash([2, 2]);
      ctx.strokeStyle = "#3b82f680";
      ctx.lineWidth = 0.5;
      const margin = 8 * s;
      ctx.beginPath();
      switch (config.shape) {
        case "circle":
          ctx.arc(cx, cy, Math.min(w, h) / 2 - margin, 0, Math.PI * 2);
          break;
        case "oval":
          ctx.ellipse(cx, cy, w / 2 - margin, h / 2 - margin, 0, 0, Math.PI * 2);
          break;
        case "rounded-rect":
          ctx.roundRect(x + margin, y + margin, w - margin * 2, h - margin * 2, Math.max(0, config.borderRadius * s - margin));
          break;
        default:
          ctx.rect(x + margin, y + margin, w - margin * 2, h - margin * 2);
          break;
      }
      ctx.stroke();
      ctx.restore();
    }
  }

  /* ── Main Render ────────────────────────────────────────── */
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    if (config.sheetMode) {
      // Sheet layout
      const gap = 20;
      const sheetW = config.sheetCols * (config.width + gap) + gap;
      const sheetH = config.sheetRows * (config.height + gap) + gap;
      canvas.width = sheetW;
      canvas.height = sheetH;

      // Sheet background
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, sheetW, sheetH);

      // Grid lines
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 0.5;
      for (let c = 0; c <= config.sheetCols; c++) {
        const gx = gap / 2 + c * (config.width + gap);
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, sheetH);
        ctx.stroke();
      }
      for (let r = 0; r <= config.sheetRows; r++) {
        const gy = gap / 2 + r * (config.height + gap);
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(sheetW, gy);
        ctx.stroke();
      }

      // Render stickers
      for (let r = 0; r < config.sheetRows; r++) {
        for (let c = 0; c < config.sheetCols; c++) {
          const sx = gap + c * (config.width + gap);
          const sy = gap + r * (config.height + gap);
          renderSingleSticker(ctx, sx, sy, config.width, config.height, 1);
        }
      }
    } else {
      // Single sticker with padding
      const pad = 40;
      canvas.width = config.width + pad * 2;
      canvas.height = config.height + pad * 2;

      // Canvas bg
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      renderSingleSticker(ctx, pad, pad, config.width, config.height, 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, advancedSettings]);

  useEffect(() => { render(); }, [render]);

  /* ── AI Generate ────────────────────────────────────────── */
  const generateAI = async () => {
    if (!config.productDescription.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate sticker/label design text for: "${config.productDescription}". Zambian business context. Return JSON only: { "title": "Brand/Product Name", "subtitle": "Tagline or quality mark", "line1": "First info line", "line2": "Second info line (e.g. Lusaka, Zambia)", "line3": "Website or contact", "price": "K49.99", "template": "product-label|address-label|price-tag|decorative|promotional|badge" }. Keep it concise for a sticker.`,
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
          line1: data.line1 || p.line1,
          line2: data.line2 || p.line2,
          line3: data.line3 || p.line3,
          price: data.price || p.price,
          template: (TEMPLATES.find((t) => t.id === data.template) ? data.template : p.template) as StickerTemplate,
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
    link.download = `sticker-${config.template}-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const upd = (patch: Partial<StickerConfig>) => setConfig((p) => ({ ...p, ...patch }));

  const displayW = config.sheetMode
    ? config.sheetCols * (config.width + 20) + 20
    : config.width + 80;
  const displayH = config.sheetMode
    ? config.sheetRows * (config.height + 20) + 20
    : config.height + 80;

  const [zoom, setZoom] = useState(0.85);
  const scaledW = displayW * zoom;
  const scaledH = displayH * zoom;

  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      TEMPLATES.map((t) => ({
        id: t.id,
        label: t.label,
        render(ctx: CanvasRenderingContext2D, w: number, h: number) {
          ctx.fillStyle = "#f8fafc";
          ctx.fillRect(0, 0, w, h);
          ctx.fillStyle = config.primaryColor;
          ctx.fillRect(0, 0, w, h * 0.22);
          ctx.fillStyle = "#1e293b";
          ctx.font = "bold 8px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.fillText(t.label, w / 2, h * 0.6, w - 8);
          ctx.fillStyle = config.primaryColor + "33";
          ctx.fillRect(w * 0.2, h * 0.7, w * 0.6, 3);
        },
      })),
    [config.primaryColor],
  );

  const handleCopy = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
    });
  }, []);

  /* ── Panel Definitions ─────────────────────────────────── */
  const leftPanel = (
    <div className="space-y-4">
      {/* AI Sticker Generator */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconSparkles className="size-4 text-primary-500" />AI Sticker Generator</h3>
        <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white resize-none" rows={3} placeholder="Describe the product or event (e.g., 'Organic honey jar label for a Zambian honey brand')..." value={config.productDescription} onChange={(e) => upd({ productDescription: e.target.value })} />
        <button onClick={generateAI} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary-500 text-gray-950 text-sm font-semibold hover:bg-primary-400 disabled:opacity-50 transition-colors">
          {loading ? <IconLoader className="size-4 animate-spin" /> : <IconWand className="size-4" />}
          {loading ? "Generating…" : "Generate Sticker Design"}
        </button>
      </div>

      {/* Template Slider */}
      <TemplateSlider
        templates={templatePreviews}
        activeId={config.template}
        onSelect={(id) => upd({ template: id as StickerTemplate })}
        thumbWidth={120}
        thumbHeight={120}
        label="Templates"
      />

      {/* Shape & Size */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><IconTag className="size-4 text-primary-500" />Sticker Settings</h3>

        <label className="block text-xs text-gray-400">Shape</label>
        <div className="grid grid-cols-4 gap-1.5">
          {SHAPES.map((s) => (
            <button key={s.id} onClick={() => upd({ shape: s.id })} className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${config.shape === s.id ? "bg-primary-500 text-gray-950" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"}`}>{s.label}</button>
          ))}
        </div>

        <label className="block text-xs text-gray-400">Preset Size</label>
        <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" onChange={(e) => { const idx = parseInt(e.target.value); if (SIZES[idx]) upd({ width: SIZES[idx].w, height: SIZES[idx].h }); }}>
          {SIZES.map((s, i) => <option key={i} value={i}>{s.label}</option>)}
        </select>

        <div className="flex gap-2">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Width (px)</label>
            <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.width} onChange={(e) => upd({ width: Math.max(50, parseInt(e.target.value) || 200) })} />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Height (px)</label>
            <input type="number" className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.height} onChange={(e) => upd({ height: Math.max(50, parseInt(e.target.value) || 200) })} />
          </div>
        </div>

        {(config.shape === "rounded-rect") && (
          <>
            <label className="block text-xs text-gray-400">Border Radius: {config.borderRadius}px</label>
            <input type="range" min={0} max={80} value={config.borderRadius} onChange={(e) => upd({ borderRadius: parseInt(e.target.value) })} className="w-full accent-primary-500" />
          </>
        )}

        <label className="block text-xs text-gray-400">Color Preset</label>
        <div className="grid grid-cols-4 gap-1.5">
          {COLOR_PRESETS.map((cp) => (
            <button key={cp.name} onClick={() => upd({ primaryColor: cp.primary, secondaryColor: cp.secondary, bgColor: cp.bg, textColor: cp.text })} className="flex flex-col items-center gap-1">
              <div className="flex gap-0.5">
                <span className="size-3 rounded-full" style={{ backgroundColor: cp.primary }} />
                <span className="size-3 rounded-full" style={{ backgroundColor: cp.bg }} />
              </div>
              <span className="text-[9px] text-gray-400">{cp.name}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Primary</label><input type="color" value={config.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
          <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">BG</label><input type="color" value={config.bgColor} onChange={(e) => upd({ bgColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
          <div className="flex-1"><label className="block text-xs text-gray-400 mb-1">Text</label><input type="color" value={config.textColor} onChange={(e) => upd({ textColor: e.target.value })} className="w-full h-7 rounded cursor-pointer" /></div>
        </div>

        <div className="flex flex-wrap gap-3">
          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showCutLine} onChange={(e) => upd({ showCutLine: e.target.checked })} className="accent-primary-500" />Cut Line</label>
          <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer"><input type="checkbox" checked={config.showSafeZone} onChange={(e) => upd({ showSafeZone: e.target.checked })} className="accent-primary-500" />Safe Zone</label>
        </div>
      </div>

      {/* Sheet Layout */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
          <input type="checkbox" checked={config.sheetMode} onChange={(e) => upd({ sheetMode: e.target.checked })} className="accent-primary-500" />Sheet Layout
        </label>
        {config.sheetMode && (
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Columns</label>
              <input type="number" min={1} max={8} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.sheetCols} onChange={(e) => upd({ sheetCols: Math.max(1, parseInt(e.target.value) || 1) })} />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-gray-400 mb-1">Rows</label>
              <input type="number" min={1} max={10} className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.sheetRows} onChange={(e) => upd({ sheetRows: Math.max(1, parseInt(e.target.value) || 1) })} />
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const rightPanel = (
    <div className="space-y-4">
      {/* Content */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Content</h3>
        <label className="block text-xs text-gray-400">Title / Brand</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.title} onChange={(e) => upd({ title: e.target.value })} />
        <label className="block text-xs text-gray-400">Subtitle</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.subtitle} onChange={(e) => upd({ subtitle: e.target.value })} />
        <label className="block text-xs text-gray-400">Line 1</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.line1} onChange={(e) => upd({ line1: e.target.value })} />
        <label className="block text-xs text-gray-400">Line 2</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.line2} onChange={(e) => upd({ line2: e.target.value })} />
        <label className="block text-xs text-gray-400">Line 3 / Contact</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.line3} onChange={(e) => upd({ line3: e.target.value })} />
        <label className="block text-xs text-gray-400">Price (for price-tag / promo)</label>
        <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white" value={config.price} onChange={(e) => upd({ price: e.target.value })} />
      </div>

      {/* Advanced Settings — Global */}
      <AdvancedSettingsPanel />
    </div>
  );

  /* ── UI ──────────────────────────────────────────────────── */
  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={scaledW}
      displayHeight={scaledH}
      label={
        `${TEMPLATES.find((t) => t.id === config.template)?.label} — ${config.shape} — ${config.width}×${config.height}px` +
        (config.sheetMode ? ` — ${config.sheetCols}×${config.sheetRows} sheet (${config.sheetCols * config.sheetRows} stickers)` : "")
      }
      mobileTabs={["Canvas", "Design", "Content"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(0.85)}
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
