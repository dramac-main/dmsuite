"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  IconSparkles,
  IconDownload,
  IconLoader,
  IconCopy,
  IconDroplet,
  IconType,
  IconWand,
  IconLayout,
  IconRefresh,
  IconMaximize,
} from "@/components/icons";
import { hexToRgba, getContrastColor } from "@/lib/canvas-utils";
import { jsPDF } from "jspdf";

/* ── Types ─────────────────────────────────────────────────── */

interface CardConfig {
  name: string;
  title: string;
  company: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  qrCodeUrl: string;
  layout: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  bgColor: string;
  fontStyle: "modern" | "classic" | "bold" | "elegant";
  cardStyle: "standard" | "square" | "rounded" | "custom";
  customWidthMm: number;
  customHeightMm: number;
  side: "front" | "back";
}

/* ── Preset Data ──────────────────────────────────────────── */

const layouts = [
  { id: "clean-left", label: "Clean Left", desc: "Left-aligned minimal" },
  { id: "centered", label: "Centered", desc: "Balanced center" },
  { id: "bold-split", label: "Bold Split", desc: "Color block split" },
  { id: "accent-bar", label: "Accent Bar", desc: "Side accent line" },
  { id: "diagonal", label: "Diagonal", desc: "Angular cut" },
  { id: "gradient-edge", label: "Gradient Edge", desc: "Fade effect" },
] as const;

const colorPresets = [
  { name: "Lime Pro", primary: "#8ae600", secondary: "#06b6d4", text: "#ffffff", bg: "#0a0a0a" },
  { name: "Navy", primary: "#1e40af", secondary: "#3b82f6", text: "#ffffff", bg: "#0f172a" },
  { name: "Charcoal", primary: "#18181b", secondary: "#3f3f46", text: "#ffffff", bg: "#fafafa" },
  { name: "Gold", primary: "#c09c2c", secondary: "#f0e68c", text: "#ffffff", bg: "#1a1a1a" },
  { name: "Rose", primary: "#e11d48", secondary: "#fda4af", text: "#ffffff", bg: "#18181b" },
  { name: "Forest", primary: "#16a34a", secondary: "#86efac", text: "#ffffff", bg: "#052e16" },
  { name: "Ocean", primary: "#0284c7", secondary: "#67e8f9", text: "#ffffff", bg: "#082f49" },
  { name: "White", primary: "#18181b", secondary: "#d4d4d8", text: "#18181b", bg: "#ffffff" },
];

const cardSizes: Record<string, { w: number; h: number; label: string; ratio: string }> = {
  standard: { w: 1050, h: 600, label: "Standard (3.5×2\")", ratio: "1050 / 600" },
  square: { w: 750, h: 750, label: "Square (2.5×2.5\")", ratio: "750 / 750" },
  rounded: { w: 1050, h: 600, label: "Rounded (3.5×2\")", ratio: "1050 / 600" },
};

/* ── Print Constants ─────────────────────────────────────── */

/** 1mm in 300-DPI pixels */
const MM_PX = 300 / 25.4; // ~11.81 px per mm
const BLEED_MM = 3;
const SAFE_MM = 5;
const CROP_MARK_LEN = 12; // px on canvas

/* ── Font Helpers ─────────────────────────────────────────── */

function getFontFamily(style: CardConfig["fontStyle"]): string {
  switch (style) {
    case "classic": return "'Georgia', 'Times New Roman', serif";
    case "bold": return "'Impact', 'Arial Black', sans-serif";
    case "elegant": return "'Didot', 'Bodoni MT', 'Playfair Display', serif";
    default: return "'Inter', 'Helvetica Neue', Arial, sans-serif";
  }
}

function getFont(w: number, s: number, style: CardConfig["fontStyle"]): string {
  return `${w} ${s}px ${getFontFamily(style)}`;
}

/* ── Helpers ──────────────────────────────────────────────── */

/* ── Canvas Renderer ─────────────────────────────────────── */

function renderCard(canvas: HTMLCanvasElement, config: CardConfig) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = config.cardStyle === "custom"
    ? { w: Math.round(config.customWidthMm * MM_PX), h: Math.round(config.customHeightMm * MM_PX) }
    : (cardSizes[config.cardStyle] || cardSizes.standard);
  const W = size.w;
  const H = size.h;
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const pc = config.primaryColor;
  const sc = config.secondaryColor;
  const tc = config.textColor;
  const bg = config.bgColor;
  const isBack = config.side === "back";

  // Round corners for rounded style
  if (config.cardStyle === "rounded") {
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.clip();
  }

  // ─── Background ────────────────────────────────────────
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  if (isBack) {
    renderCardBack(ctx, W, H, config);
    return;
  }

  // ─── Layout-specific rendering ─────────────────────────
  switch (config.layout) {
    case "centered":
      renderCenteredLayout(ctx, W, H, config);
      break;
    case "bold-split":
      renderBoldSplitLayout(ctx, W, H, config);
      break;
    case "accent-bar":
      renderAccentBarLayout(ctx, W, H, config);
      break;
    case "diagonal":
      renderDiagonalLayout(ctx, W, H, config);
      break;
    case "gradient-edge":
      renderGradientEdgeLayout(ctx, W, H, config);
      break;
    default:
      renderCleanLeftLayout(ctx, W, H, config);
      break;
  }

  // ─── Subtle trim marks ─────────────────────────────────
  ctx.strokeStyle = hexToRgba(tc, 0.05);
  ctx.lineWidth = 0.5;
  // Top left
  ctx.beginPath(); ctx.moveTo(20, 0); ctx.lineTo(20, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.lineTo(8, 20); ctx.stroke();
  // Top right
  ctx.beginPath(); ctx.moveTo(W - 20, 0); ctx.lineTo(W - 20, 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W, 20); ctx.lineTo(W - 8, 20); ctx.stroke();
  // Bottom left
  ctx.beginPath(); ctx.moveTo(20, H); ctx.lineTo(20, H - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, H - 20); ctx.lineTo(8, H - 20); ctx.stroke();
  // Bottom right
  ctx.beginPath(); ctx.moveTo(W - 20, H); ctx.lineTo(W - 20, H - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(W, H - 20); ctx.lineTo(W - 8, H - 20); ctx.stroke();
}

/* ── Layout Renderers ────────────────────────────────────── */

function renderCleanLeftLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;
  const mx = W * 0.08;
  const my = H * 0.15;

  // Accent dot
  ctx.fillStyle = pc;
  ctx.beginPath();
  ctx.arc(mx + 4, my + 4, 4, 0, Math.PI * 2);
  ctx.fill();

  // Name
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  ctx.fillText(c.name || "Your Name", mx, my + 36);

  // Title
  ctx.font = getFont(400, 14, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", mx, my + 58);

  // Divider
  ctx.fillStyle = hexToRgba(pc, 0.3);
  ctx.fillRect(mx, my + 72, W * 0.12, 1.5);

  // Contact info
  const details = getContactLines(c);
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(tc, 0.7);
  details.forEach((line, i) => {
    ctx.fillText(line, mx, my + 98 + i * 22);
  });

  // Company name (bottom right)
  ctx.font = getFont(700, 16, fs);
  ctx.fillStyle = hexToRgba(pc, 0.8);
  ctx.textAlign = "right";
  ctx.fillText(c.company || "Company", W - mx, H - my);
}

function renderCenteredLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Top accent line
  ctx.fillStyle = pc;
  ctx.fillRect(W * 0.35, H * 0.08, W * 0.3, 2);

  // Name centered
  ctx.font = getFont(700, 30, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "center";
  ctx.fillText(c.name || "Your Name", W / 2, H * 0.35);

  // Title
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", W / 2, H * 0.35 + 24);

  // Company
  ctx.font = getFont(600, 11, fs);
  ctx.fillStyle = hexToRgba(tc, 0.5);
  ctx.fillText((c.company || "Company").toUpperCase(), W / 2, H * 0.35 + 50);

  // Divider
  ctx.fillStyle = hexToRgba(pc, 0.3);
  ctx.fillRect(W * 0.4, H * 0.55, W * 0.2, 1);

  // Contact info centered
  const details = getContactLines(c);
  ctx.font = getFont(400, 11, fs);
  ctx.fillStyle = hexToRgba(tc, 0.65);
  details.forEach((line, i) => {
    ctx.fillText(line, W / 2, H * 0.65 + i * 20);
  });

  // Bottom accent line
  ctx.fillStyle = pc;
  ctx.fillRect(W * 0.35, H * 0.92, W * 0.3, 2);
}

function renderBoldSplitLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs, bgColor: bg } = c;

  // Left panel
  const splitX = W * 0.38;
  ctx.fillStyle = pc;
  ctx.fillRect(0, 0, splitX, H);

  // Name on color panel
  ctx.font = getFont(800, 26, fs);
  ctx.fillStyle = getContrastColor(pc);
  ctx.textAlign = "left";
  const mx = splitX * 0.15;
  ctx.fillText(c.name || "Your Name", mx, H * 0.35);

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.7);
  ctx.fillText(c.title || "Job Title", mx, H * 0.35 + 24);

  // Company (bottom of color panel)
  ctx.font = getFont(700, 10, fs);
  ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.4);
  ctx.fillText((c.company || "Company").toUpperCase(), mx, H * 0.88);

  // Right panel contact
  const rx = splitX + (W - splitX) * 0.12;
  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.textAlign = "left";
  ctx.fillText("CONTACT", rx, H * 0.2);

  ctx.fillStyle = hexToRgba(pc, 0.3);
  ctx.fillRect(rx, H * 0.24, W * 0.06, 1);

  const details = getContactLines(c);
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(tc, 0.7);
  details.forEach((line, i) => {
    ctx.fillText(line, rx, H * 0.35 + i * 24);
  });

  // Decorative dots
  ctx.fillStyle = hexToRgba(sc, 0.1);
  for (let x = 0; x < 4; x++) {
    for (let y = 0; y < 3; y++) {
      ctx.beginPath();
      ctx.arc(rx + x * 12, H * 0.8 + y * 12, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function renderAccentBarLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Left accent bar
  ctx.fillStyle = pc;
  ctx.fillRect(0, 0, 6, H);

  // Secondary thin bar
  ctx.fillStyle = hexToRgba(pc, 0.15);
  ctx.fillRect(6, 0, 2, H);

  const mx = W * 0.06;

  // Name
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  ctx.fillText(c.name || "Your Name", mx, H * 0.28);

  // Title + Company
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(`${c.title || "Job Title"} — ${c.company || "Company"}`, mx, H * 0.28 + 24);

  // Divider
  ctx.fillStyle = hexToRgba(tc, 0.08);
  ctx.fillRect(mx, H * 0.52, W * 0.88, 0.5);

  // Contact details (horizontal)
  const details = getContactLines(c);
  ctx.font = getFont(400, 11, fs);
  ctx.fillStyle = hexToRgba(tc, 0.6);
  let detailX = mx;
  details.forEach((line) => {
    const textW = ctx.measureText(line).width;
    ctx.fillText(line, detailX, H * 0.68);
    // Separator dot
    detailX += textW + 12;
    if (detailX < W * 0.85) {
      ctx.fillStyle = hexToRgba(pc, 0.3);
      ctx.beginPath();
      ctx.arc(detailX - 6, H * 0.68 - 4, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = hexToRgba(tc, 0.6);
    }
  });
}

function renderDiagonalLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Diagonal color block (bottom-right)
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.55, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H);
  ctx.lineTo(W * 0.35, H);
  ctx.closePath();
  ctx.fillStyle = pc;
  ctx.fill();
  ctx.restore();

  // Name (left area)
  const mx = W * 0.08;
  ctx.font = getFont(700, 26, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  ctx.fillText(c.name || "Your Name", mx, H * 0.35);

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(tc, 0.6);
  ctx.fillText(c.title || "Job Title", mx, H * 0.35 + 22);

  // Company
  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.fillText((c.company || "").toUpperCase(), mx, H * 0.85);

  // Contact on diagonal
  const details = getContactLines(c);
  ctx.font = getFont(400, 11, fs);
  ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.85);
  ctx.textAlign = "right";
  details.forEach((line, i) => {
    ctx.fillText(line, W - mx, H * 0.35 + i * 22);
  });
}

function renderGradientEdgeLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Bottom gradient strip
  const grad = ctx.createLinearGradient(0, H * 0.82, W, H * 0.82);
  grad.addColorStop(0, pc);
  grad.addColorStop(1, sc);
  ctx.fillStyle = grad;
  ctx.fillRect(0, H * 0.82, W, H * 0.18);

  // Name
  const mx = W * 0.08;
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  ctx.fillText(c.name || "Your Name", mx, H * 0.3);

  // Title
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", mx, H * 0.3 + 24);

  // Divider
  ctx.fillStyle = hexToRgba(tc, 0.08);
  ctx.fillRect(mx, H * 0.48, W * 0.84, 0.5);

  // Contact
  const details = getContactLines(c);
  ctx.font = getFont(400, 11, fs);
  ctx.fillStyle = hexToRgba(tc, 0.6);
  details.forEach((line, i) => {
    ctx.fillText(line, mx, H * 0.58 + i * 20);
  });

  // Company on gradient strip
  ctx.font = getFont(700, 14, fs);
  ctx.fillStyle = getContrastColor(pc);
  ctx.textAlign = "right";
  ctx.fillText(c.company || "Company", W - mx, H * 0.93);
}

/* ── Card Back Renderer ──────────────────────────────────── */

function renderCardBack(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig) {
  const { primaryColor: pc, secondaryColor: sc, bgColor: bg, fontStyle: fs } = c;

  // Full color background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, pc);
  grad.addColorStop(1, sc);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Subtle pattern
  ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.04);
  for (let x = 0; x < W; x += 30) {
    for (let y = 0; y < H; y += 30) {
      ctx.beginPath();
      ctx.arc(x + 15, y + 15, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Center logo/brand
  ctx.font = getFont(800, 42, fs);
  ctx.fillStyle = getContrastColor(pc);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(c.company || c.name || "Brand", W / 2, H / 2 - 10);

  // Tagline area
  if (c.website) {
    ctx.font = getFont(400, 13, fs);
    ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.5);
    ctx.fillText(c.website, W / 2, H / 2 + 24);
  }

  // Decorative lines
  const lineW = W * 0.15;
  ctx.fillStyle = hexToRgba(getContrastColor(pc), 0.2);
  ctx.fillRect(W / 2 - lineW / 2, H / 2 + 44, lineW, 1);
}

/* ── Contact helper ──────────────────────────────────────── */

function getContactLines(c: CardConfig): string[] {
  const lines: string[] = [];
  if (c.email) lines.push(c.email);
  if (c.phone) lines.push(c.phone);
  if (c.website) lines.push(c.website);
  if (c.address) lines.push(c.address);
  return lines;
}

/* ── QR Code Placeholder Renderer ────────────────────────── */

function drawQrPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, size: number, fg: string,
) {
  const modules = 9;
  const cellSize = size / modules;
  // Deterministic pattern that looks like a QR code
  const pattern = [
    [1,1,1,1,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1],
    [1,0,1,1,1,0,1,0,0],
    [1,0,1,1,1,0,1,0,1],
    [1,0,0,0,0,0,1,0,1],
    [1,1,1,1,1,1,1,0,1],
    [0,0,0,0,0,0,0,0,0],
    [1,0,1,0,1,0,1,0,1],
  ];
  // White background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x - 2, y - 2, size + 4, size + 4);
  // Draw modules
  ctx.fillStyle = fg;
  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      if (pattern[row][col]) {
        ctx.fillRect(x + col * cellSize, y + row * cellSize, cellSize, cellSize);
      }
    }
  }
  // Label
  ctx.font = "bold 8px sans-serif";
  ctx.fillStyle = hexToRgba(fg, 0.5);
  ctx.textAlign = "center";
  ctx.fillText("QR", x + size / 2, y + size + 10);
}

/* ── Bleed / Safe Zone Overlay ───────────────────────────── */

function drawBleedOverlay(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const bPx = BLEED_MM * (W / (cardSizes.standard?.w || W)) * MM_PX;
  const b = Math.min(bPx, W * 0.04); // clamp to 4% max
  ctx.save();
  ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
  // Top
  ctx.fillRect(0, 0, W, b);
  // Bottom
  ctx.fillRect(0, H - b, W, b);
  // Left
  ctx.fillRect(0, b, b, H - b * 2);
  // Right
  ctx.fillRect(W - b, b, b, H - b * 2);
  ctx.restore();
}

function drawSafeZone(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const sPx = SAFE_MM * (W / (cardSizes.standard?.w || W)) * MM_PX;
  const s = Math.min(sPx, W * 0.07);
  ctx.save();
  ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(s, s, W - s * 2, H - s * 2);
  ctx.setLineDash([]);
  ctx.restore();
}

/* ── Collapsible Section ─────────────────────────────────── */

function Section({ icon, label, id, open, toggle, children }: {
  icon: React.ReactNode; label: string; id: string;
  open: boolean; toggle: (id: string) => void; children: React.ReactNode;
}) {
  return (
    <div>
      <button onClick={() => toggle(id)}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors w-full">
        {icon}{label}
        <svg className={`size-3 ml-auto transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
      </button>
      {open && children}
    </div>
  );
}

/* ── Component ───────────────────────────────────────────── */

export default function BusinessCardWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const [config, setConfig] = useState<CardConfig>({
    name: "", title: "", company: "",
    email: "", phone: "", website: "", address: "",
    qrCodeUrl: "",
    layout: "clean-left",
    primaryColor: "#8ae600", secondaryColor: "#06b6d4",
    textColor: "#ffffff", bgColor: "#0a0a0a",
    fontStyle: "modern", cardStyle: "standard",
    customWidthMm: 89, customHeightMm: 51,
    side: "front",
  });

  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [bleedInExport, setBleedInExport] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);

  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["details", "layout", "style"]));
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const updateConfig = useCallback((partial: Partial<CardConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  // Compute card size (support custom)
  const getCardSize = useCallback(() => {
    if (config.cardStyle === "custom") {
      const w = Math.round(config.customWidthMm * MM_PX);
      const h = Math.round(config.customHeightMm * MM_PX);
      return { w, h, label: `Custom (${config.customWidthMm}×${config.customHeightMm}mm)`, ratio: `${w} / ${h}` };
    }
    return cardSizes[config.cardStyle] || cardSizes.standard;
  }, [config.cardStyle, config.customWidthMm, config.customHeightMm]);

  // Render canvas
  useEffect(() => {
    const renderToCanvas = (canvas: HTMLCanvasElement, cfg: CardConfig) => {
      renderCard(canvas, cfg);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const size = cfg.cardStyle === "custom"
        ? { w: Math.round(cfg.customWidthMm * MM_PX), h: Math.round(cfg.customHeightMm * MM_PX) }
        : (cardSizes[cfg.cardStyle] || cardSizes.standard);
      // Draw QR code if URL is set (bottom-right of front, or center-bottom of back)
      if (cfg.qrCodeUrl) {
        const qrSize = Math.min(size.w, size.h) * 0.16;
        if (cfg.side === "front") {
          drawQrPlaceholder(ctx, size.w - qrSize - size.w * 0.06, size.h - qrSize - size.h * 0.12, qrSize, "#000000");
        } else {
          drawQrPlaceholder(ctx, size.w / 2 - qrSize / 2, size.h * 0.65, qrSize, "#000000");
        }
      }
      // Bleed overlay
      if (showBleed) drawBleedOverlay(ctx, size.w, size.h);
      // Safe zone
      if (showSafeZone) drawSafeZone(ctx, size.w, size.h);
    };

    if (canvasRef.current) renderToCanvas(canvasRef.current, config);
    // Render back canvas for side-by-side
    if (sideBySide && backCanvasRef.current) {
      const backCfg = { ...config, side: config.side === "front" ? "back" as const : "front" as const };
      renderToCanvas(backCanvasRef.current, backCfg);
    }
  }, [config, showBleed, showSafeZone, sideBySide]);

  // AI generation
  const generateWithAI = useCallback(async () => {
    if (!config.name.trim() && !config.company.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are a premium business card designer. Suggest a professional business card design.

Name: ${config.name || "Not provided"}
Title: ${config.title || "Not provided"}
Company: ${config.company || "Not provided"}

Think luxury, premium design. Suggest ONLY:
LAYOUT: clean-left | centered | bold-split | accent-bar | diagonal | gradient-edge
PRIMARY: #hex (brand color)
SECONDARY: #hex (accent)
TEXT: #hex (text color)
BG: #hex (background)
FONT: modern | classic | bold | elegant

Return each on its own line with the label and value.`;

      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }) });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) { const { done, value } = await reader.read(); if (done) break; fullText += decoder.decode(value, { stream: true }); }

      const layoutMatch = fullText.match(/LAYOUT:\s*(\S+)/i);
      const primaryMatch = fullText.match(/PRIMARY:\s*(#[0-9a-fA-F]{6})/i);
      const secondaryMatch = fullText.match(/SECONDARY:\s*(#[0-9a-fA-F]{6})/i);
      const textMatch = fullText.match(/TEXT:\s*(#[0-9a-fA-F]{6})/i);
      const bgMatch = fullText.match(/BG:\s*(#[0-9a-fA-F]{6})/i);
      const fontMatch = fullText.match(/FONT:\s*(\S+)/i);

      const updates: Partial<CardConfig> = {};
      if (layoutMatch) {
        const l = layoutMatch[1].toLowerCase();
        if (layouts.some(lo => lo.id === l)) updates.layout = l;
      }
      if (primaryMatch) updates.primaryColor = primaryMatch[1];
      if (secondaryMatch) updates.secondaryColor = secondaryMatch[1];
      if (textMatch) updates.textColor = textMatch[1];
      if (bgMatch) updates.bgColor = bgMatch[1];
      if (fontMatch) {
        const f = fontMatch[1].toLowerCase() as CardConfig["fontStyle"];
        if (["modern", "classic", "bold", "elegant"].includes(f)) updates.fontStyle = f;
      }
      updateConfig(updates);
    } catch (err) { console.error("AI generation error:", err); }
    finally { setIsGenerating(false); }
  }, [config, updateConfig]);

  // Export
  const handleDownloadPng = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `business-card-${config.side}.png`;
      a.click(); URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.side]);

  const handleCopyCanvas = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* clipboard may not be available */ }
  }, []);

  // PDF export with crop marks
  const handleExportPdf = useCallback(() => {
    const size = getCardSize();
    // Standard business card: 3.5" × 2" (88.9mm × 50.8mm)
    const cardWmm = config.cardStyle === "custom" ? config.customWidthMm : (size.w / MM_PX);
    const cardHmm = config.cardStyle === "custom" ? config.customHeightMm : (size.h / MM_PX);
    const bleedMm = bleedInExport ? BLEED_MM : 0;
    const cropLen = bleedInExport ? 5 : 0; // mm
    const margin = bleedMm + cropLen + 3; // extra spacing
    const pageW = cardWmm + margin * 2;
    const pageH = cardHmm + margin * 2;

    const pdf = new jsPDF({ orientation: pageW > pageH ? "l" : "p", unit: "mm", format: [pageW, pageH] });

    const addPage = (side: "front" | "back", isFirst: boolean) => {
      if (!isFirst) pdf.addPage([pageW, pageH], pageW > pageH ? "l" : "p");
      // Render side to offscreen canvas
      const offscreen = document.createElement("canvas");
      const cfg = { ...config, side };
      // Set canvas to custom size if custom
      if (config.cardStyle === "custom") {
        offscreen.width = Math.round(config.customWidthMm * MM_PX);
        offscreen.height = Math.round(config.customHeightMm * MM_PX);
      }
      renderCard(offscreen, cfg);
      if (cfg.qrCodeUrl) {
        const ctx = offscreen.getContext("2d");
        if (ctx) {
          const qrSize = Math.min(offscreen.width, offscreen.height) * 0.16;
          if (side === "front") {
            drawQrPlaceholder(ctx, offscreen.width - qrSize - offscreen.width * 0.06, offscreen.height - qrSize - offscreen.height * 0.12, qrSize, "#000000");
          } else {
            drawQrPlaceholder(ctx, offscreen.width / 2 - qrSize / 2, offscreen.height * 0.65, qrSize, "#000000");
          }
        }
      }
      const imgData = offscreen.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", margin, margin, cardWmm, cardHmm);

      // Crop marks
      if (bleedInExport) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.2);
        const x1 = margin;
        const y1 = margin;
        const x2 = margin + cardWmm;
        const y2 = margin + cardHmm;
        // Top-left
        pdf.line(x1, y1 - cropLen, x1, y1 - 1);
        pdf.line(x1 - cropLen, y1, x1 - 1, y1);
        // Top-right
        pdf.line(x2, y1 - cropLen, x2, y1 - 1);
        pdf.line(x2 + 1, y1, x2 + cropLen, y1);
        // Bottom-left
        pdf.line(x1, y2 + 1, x1, y2 + cropLen);
        pdf.line(x1 - cropLen, y2, x1 - 1, y2);
        // Bottom-right
        pdf.line(x2, y2 + 1, x2, y2 + cropLen);
        pdf.line(x2 + 1, y2, x2 + cropLen, y2);
      }
    };

    addPage("front", true);
    addPage("back", false);
    pdf.save(`business-card-${config.name || "design"}.pdf`);
  }, [config, bleedInExport, getCardSize]);

  const currentSize = getCardSize();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* ── Left Panel ──────────────────────────────────────── */}
      <div className="lg:col-span-2 space-y-4">

        {/* Contact Details */}
        <Section icon={<IconType className="size-3.5" />} label="Contact Details" id="details" open={openSections.has("details")} toggle={toggleSection}>
          <div className="space-y-2">
            <input type="text" placeholder="Full Name" value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input type="text" placeholder="Job Title" value={config.title}
              onChange={(e) => updateConfig({ title: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input type="text" placeholder="Company Name" value={config.company}
              onChange={(e) => updateConfig({ company: e.target.value })}
              className="w-full h-11 px-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <div className="grid grid-cols-2 gap-2">
              <input type="email" placeholder="Email" value={config.email}
                onChange={(e) => updateConfig({ email: e.target.value })}
                className="h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
              <input type="tel" placeholder="Phone" value={config.phone}
                onChange={(e) => updateConfig({ phone: e.target.value })}
                className="h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            </div>
            <input type="text" placeholder="Website" value={config.website}
              onChange={(e) => updateConfig({ website: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <input type="text" placeholder="Address (optional)" value={config.address}
              onChange={(e) => updateConfig({ address: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
            <div className="pt-1">
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">QR Code URL</label>
              <input type="url" placeholder="https://yoursite.com" value={config.qrCodeUrl}
                onChange={(e) => updateConfig({ qrCodeUrl: e.target.value })}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
              {config.qrCodeUrl && <p className="text-[0.5rem] text-primary-500 mt-0.5">✓ QR code will appear on card</p>}
            </div>
          </div>
        </Section>

        {/* Layout */}
        <Section icon={<IconLayout className="size-3.5" />} label="Layout" id="layout" open={openSections.has("layout")} toggle={toggleSection}>
          <div className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {layouts.map((l) => (
                <button key={l.id} onClick={() => updateConfig({ layout: l.id })}
                  className={`p-2 rounded-xl border text-center transition-all ${config.layout === l.id ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <p className={`text-[0.6875rem] font-semibold leading-tight ${config.layout === l.id ? "text-primary-500" : "text-gray-900 dark:text-white"}`}>{l.label}</p>
                  <p className="text-[0.5625rem] text-gray-400 mt-0.5">{l.desc}</p>
                </button>
              ))}
            </div>
            <div className="flex gap-1.5">
              {(["standard", "square", "rounded", "custom"] as const).map((s) => (
                <button key={s} onClick={() => updateConfig({ cardStyle: s })}
                  className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold capitalize transition-all ${config.cardStyle === s ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}>{s}</button>
              ))}
            </div>
            {config.cardStyle === "custom" && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">Width (mm)</label>
                  <input type="number" min={30} max={200} value={config.customWidthMm}
                    onChange={(e) => updateConfig({ customWidthMm: Math.max(30, Math.min(200, Number(e.target.value) || 89)) })}
                    className="w-full h-9 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
                </div>
                <span className="text-gray-400 text-xs pt-4">×</span>
                <div className="flex-1">
                  <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">Height (mm)</label>
                  <input type="number" min={30} max={200} value={config.customHeightMm}
                    onChange={(e) => updateConfig({ customHeightMm: Math.max(30, Math.min(200, Number(e.target.value) || 51)) })}
                    className="w-full h-9 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all" />
                </div>
              </div>
            )}
            <div className="flex gap-1.5">
              <button onClick={() => updateConfig({ side: "front" })}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${config.side === "front" ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Front</button>
              <button onClick={() => updateConfig({ side: "back" })}
                className={`flex-1 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${config.side === "back" ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Back</button>
            </div>
          </div>
        </Section>

        {/* Style */}
        <Section icon={<IconDroplet className="size-3.5" />} label="Style" id="style" open={openSections.has("style")} toggle={toggleSection}>
          <div className="space-y-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Color Theme</p>
            <div className="grid grid-cols-4 gap-1.5">
              {colorPresets.map((theme) => (
                <button key={theme.name} onClick={() => updateConfig({ primaryColor: theme.primary, secondaryColor: theme.secondary, textColor: theme.text, bgColor: theme.bg })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${config.primaryColor === theme.primary && config.bgColor === theme.bg ? "border-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                  <div className="flex gap-0.5 justify-center mb-0.5">
                    <div className="size-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="size-3 rounded-full" style={{ backgroundColor: theme.bg }} />
                  </div>
                  <span className="text-[0.5rem] text-gray-400">{theme.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={config.primaryColor} onChange={(e) => updateConfig({ primaryColor: e.target.value })} className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" /><span className="text-[0.6875rem] text-gray-400">Primary</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={config.bgColor} onChange={(e) => updateConfig({ bgColor: e.target.value })} className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" /><span className="text-[0.6875rem] text-gray-400">BG</span></label>
              <label className="flex items-center gap-2 cursor-pointer"><input type="color" value={config.textColor} onChange={(e) => updateConfig({ textColor: e.target.value })} className="size-7 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent" /><span className="text-[0.6875rem] text-gray-400">Text</span></label>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {(["modern", "classic", "bold", "elegant"] as const).map((style) => (
                <button key={style} onClick={() => updateConfig({ fontStyle: style })}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all ${config.fontStyle === style ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600"}`}
                  style={{ fontFamily: getFontFamily(style) }}>{style}</button>
              ))}
            </div>
          </div>
        </Section>

        {/* Print Settings */}
        <Section icon={<IconMaximize className="size-3.5" />} label="Print Settings" id="print" open={openSections.has("print")} toggle={toggleSection}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showBleed} onChange={(e) => setShowBleed(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Show bleed area (3mm)</span>
              <span className="ml-auto size-2.5 rounded-full bg-error-500/40" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={showSafeZone} onChange={(e) => setShowSafeZone(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Show safe zone (5mm inset)</span>
              <span className="ml-auto size-2.5 rounded-full border-2 border-dashed border-success-500/60" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={bleedInExport} onChange={(e) => setBleedInExport(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30" />
              <span className="text-xs text-gray-600 dark:text-gray-300">Include crop marks in PDF export</span>
            </label>
          </div>
        </Section>

        {/* AI Generate */}
        <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-4">
          <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-3">
            <IconSparkles className="size-3.5" />AI Design Suggestion
          </label>
          <button onClick={generateWithAI} disabled={(!config.name.trim() && !config.company.trim()) || isGenerating}
            className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            {isGenerating ? <><IconLoader className="size-3.5 animate-spin" />Generating…</> : <><IconWand className="size-3.5" />Suggest Design with AI</>}
          </button>
          <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI will suggest layout, colors, and typography</p>
        </div>
      </div>

      {/* ── Right Panel: Preview ─────────────────────────── */}
      <div className="lg:col-span-3 space-y-5">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{sideBySide ? "Preview — Front & Back" : `Preview — ${config.side === "front" ? "Front" : "Back"}`}</span>
              <span className="text-xs text-gray-400">{currentSize.label}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setSideBySide(!sideBySide)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${sideBySide ? "bg-primary-500/10 text-primary-500" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"}`}>
                <IconLayout className="size-3" />{sideBySide ? "Single" : "Both"}
              </button>
              <button onClick={handleCopyCanvas} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <IconCopy className="size-3" />Copy
              </button>
              <button onClick={handleDownloadPng} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-primary-500 text-gray-950 hover:bg-primary-400 transition-colors">
                <IconDownload className="size-3" />PNG
              </button>
            </div>
          </div>
          <div className="flex items-center justify-center p-8 bg-[repeating-conic-gradient(#e5e7eb_0%_25%,transparent_0%_50%)] dark:bg-[repeating-conic-gradient(#1f2937_0%_25%,transparent_0%_50%)] bg-size-[24px_24px] min-h-72">
            {sideBySide ? (
              <div className="flex gap-6 items-center w-full justify-center">
                <div className="flex-1 max-w-xs">
                  <p className="text-[0.625rem] font-semibold text-center text-gray-400 mb-1.5 uppercase tracking-wider">{config.side === "front" ? "Front" : "Back"}</p>
                  <div className="shadow-2xl rounded-lg overflow-hidden">
                    <canvas ref={canvasRef} className="w-full h-auto"
                      style={{ aspectRatio: currentSize.ratio }} />
                  </div>
                </div>
                <div className="flex-1 max-w-xs">
                  <p className="text-[0.625rem] font-semibold text-center text-gray-400 mb-1.5 uppercase tracking-wider">{config.side === "front" ? "Back" : "Front"}</p>
                  <div className="shadow-2xl rounded-lg overflow-hidden">
                    <canvas ref={backCanvasRef} className="w-full h-auto"
                      style={{ aspectRatio: currentSize.ratio }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="shadow-2xl rounded-lg overflow-hidden max-w-md w-full">
                <canvas ref={canvasRef} className="w-full h-auto"
                  style={{ aspectRatio: currentSize.ratio }} />
              </div>
            )}
          </div>
        </div>

        {/* Both sides preview */}
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
            Quick Side Switch
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {(["front", "back"] as const).map((s) => (
              <button key={s} onClick={() => updateConfig({ side: s })}
                className={`group rounded-xl border p-3 text-center transition-all ${config.side === s ? "border-primary-500 bg-primary-500/5 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"}`}>
                <span className={`text-sm font-semibold capitalize ${config.side === s ? "text-primary-500" : "text-gray-700 dark:text-gray-300"}`}>{s} Side</span>
              </button>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Export</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button onClick={handleDownloadPng} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
              <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
              <span className="text-[0.5625rem] opacity-60">{currentSize.label}</span>
            </button>
            <button onClick={handleCopyCanvas} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
              <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
              <span className="text-[0.5625rem] opacity-60">Paste anywhere</span>
            </button>
            <button onClick={handleExportPdf} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-info-500/30 bg-info-500/5 text-info-500 transition-colors hover:bg-info-500/10">
              <IconDownload className="size-4" /><span className="text-xs font-semibold">.pdf</span>
              <span className="text-[0.5625rem] opacity-60">{bleedInExport ? "With crops" : "Print ready"}</span>
            </button>
            <button onClick={() => updateConfig({ side: config.side === "front" ? "back" : "front" })} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
              <IconRefresh className="size-4" /><span className="text-xs font-semibold">Flip Card</span>
              <span className="text-[0.5625rem] opacity-60">{config.side === "front" ? "Show back" : "Show front"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
