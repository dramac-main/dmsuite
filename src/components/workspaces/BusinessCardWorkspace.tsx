"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
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
  IconCamera,
  IconPrinter,
} from "@/components/icons";
import { hexToRgba, getContrastColor, roundRect } from "@/lib/canvas-utils";
import {
  drawPattern,
  drawDivider,
  drawAccentCircle,
  drawGradient,
  drawTextWithShadow,
  drawImageCover,
  loadImage,
  drawImagePlaceholder,
  drawQRPlaceholder,
  drawPhoneIcon,
  drawEmailIcon,
  drawGlobeIcon,
  drawLocationIcon,
} from "@/lib/graphics-engine";
import { drawCardThumbnail } from "@/lib/template-renderers";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import { jsPDF } from "jspdf";
import { Accordion, AccordionSection } from "@/components/ui";

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
  logoUrl: string;
  patternType: string;
  showContactIcons: boolean;
}

/* ── Preset Data ──────────────────────────────────────────── */

const layouts = [
  { id: "clean-left", label: "Clean Left", desc: "Left-aligned minimal" },
  { id: "centered", label: "Centered", desc: "Balanced center" },
  { id: "bold-split", label: "Bold Split", desc: "Color block split" },
  { id: "accent-bar", label: "Accent Bar", desc: "Side accent line" },
  { id: "diagonal", label: "Diagonal", desc: "Angular cut" },
  { id: "gradient-edge", label: "Gradient Edge", desc: "Gradient strip" },
  { id: "luxury-frame", label: "Luxury Frame", desc: "Double border elegance" },
  { id: "geometric", label: "Geometric", desc: "Modern shapes" },
  { id: "photo-card", label: "Photo Card", desc: "Image background" },
  { id: "layered", label: "Layered", desc: "Overlapping panels" },
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
  { name: "Purple", primary: "#7c3aed", secondary: "#c4b5fd", text: "#ffffff", bg: "#1e1b4b" },
  { name: "Sunset", primary: "#ea580c", secondary: "#fdba74", text: "#ffffff", bg: "#1c1917" },
];

const patternOptions = [
  { id: "none", label: "None" },
  { id: "dots", label: "Dots" },
  { id: "lines", label: "Lines" },
  { id: "diagonal-lines", label: "Diagonal" },
  { id: "crosshatch", label: "Crosshatch" },
  { id: "waves", label: "Waves" },
  { id: "hexagons", label: "Hexagons" },
  { id: "chevrons", label: "Chevrons" },
  { id: "diamond", label: "Diamond" },
];

const cardSizes: Record<string, { w: number; h: number; label: string; ratio: string }> = {
  standard: { w: 1050, h: 600, label: "Standard (3.5×2\")", ratio: "1050 / 600" },
  square: { w: 750, h: 750, label: "Square (2.5×2.5\")", ratio: "750 / 750" },
  rounded: { w: 1050, h: 600, label: "Rounded (3.5×2\")", ratio: "1050 / 600" },
};

/* ── Print Constants ─────────────────────────────────────── */

const MM_PX = 300 / 25.4;
const BLEED_MM = 3;
const SAFE_MM = 5;

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

/* ── Contact icon helper ─────────────────────────────────── */

function drawContactIcon(
  ctx: CanvasRenderingContext2D,
  type: "email" | "phone" | "website" | "address",
  x: number, y: number, size: number, color: string
) {
  switch (type) {
    case "email": drawEmailIcon(ctx, x, y, size, color); break;
    case "phone": drawPhoneIcon(ctx, x, y, size, color); break;
    case "website": drawGlobeIcon(ctx, x, y, size, color); break;
    case "address": drawLocationIcon(ctx, x, y, size, color); break;
  }
}

function getContactEntries(c: CardConfig): Array<{ type: "email" | "phone" | "website" | "address"; value: string }> {
  const entries: Array<{ type: "email" | "phone" | "website" | "address"; value: string }> = [];
  if (c.email) entries.push({ type: "email", value: c.email });
  if (c.phone) entries.push({ type: "phone", value: c.phone });
  if (c.website) entries.push({ type: "website", value: c.website });
  if (c.address) entries.push({ type: "address", value: c.address });
  return entries;
}

/* ── Canvas Renderer ─────────────────────────────────────── */

function renderCard(canvas: HTMLCanvasElement, config: CardConfig, logoImg?: HTMLImageElement | null) {
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

  const isBack = config.side === "back";

  // Round corners for rounded style
  if (config.cardStyle === "rounded") {
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.clip();
  }

  // ─── Background ────────────────────────────────────────
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, W, H);

  // ─── Pattern Overlay ───────────────────────────────────
  if (config.patternType && config.patternType !== "none") {
    drawPattern(
      ctx, 0, 0, W, H,
      config.patternType as Parameters<typeof drawPattern>[5],
      config.primaryColor, 0.04, 28
    );
  }

  if (isBack) {
    renderCardBack(ctx, W, H, config, logoImg);
    return;
  }

  // ─── Layout-specific rendering ─────────────────────────
  switch (config.layout) {
    case "centered": renderCenteredLayout(ctx, W, H, config, logoImg); break;
    case "bold-split": renderBoldSplitLayout(ctx, W, H, config, logoImg); break;
    case "accent-bar": renderAccentBarLayout(ctx, W, H, config, logoImg); break;
    case "diagonal": renderDiagonalLayout(ctx, W, H, config, logoImg); break;
    case "gradient-edge": renderGradientEdgeLayout(ctx, W, H, config, logoImg); break;
    case "luxury-frame": renderLuxuryFrameLayout(ctx, W, H, config, logoImg); break;
    case "geometric": renderGeometricLayout(ctx, W, H, config, logoImg); break;
    case "photo-card": renderPhotoCardLayout(ctx, W, H, config, logoImg); break;
    case "layered": renderLayeredLayout(ctx, W, H, config, logoImg); break;
    default: renderCleanLeftLayout(ctx, W, H, config, logoImg); break;
  }

  // ─── Subtle corner marks ───────────────────────────────
  ctx.strokeStyle = hexToRgba(config.textColor, 0.04);
  ctx.lineWidth = 0.5;
  const m = 16;
  [
    [m, 0, m, 6], [0, m, 6, m],
    [W - m, 0, W - m, 6], [W, m, W - 6, m],
    [m, H, m, H - 6], [0, H - m, 6, H - m],
    [W - m, H, W - m, H - 6], [W, H - m, W - 6, H - m],
  ].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });
}

/* ── Logo drawing helper ─────────────────────────────────── */

function drawLogo(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null | undefined,
  x: number, y: number, maxW: number, maxH: number,
  fallbackText: string, color: string,
  shape: "circle" | "square" | "none" = "none"
) {
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.save();
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(x + maxW / 2, y + maxH / 2, Math.min(maxW, maxH) / 2, 0, Math.PI * 2);
      ctx.clip();
    } else if (shape === "square") {
      roundRect(ctx, x, y, maxW, maxH, 6);
      ctx.clip();
    }
    const ratio = img.naturalWidth / img.naturalHeight;
    let dw = maxW, dh = maxH;
    if (ratio > maxW / maxH) { dw = maxW; dh = maxW / ratio; }
    else { dh = maxH; dw = maxH * ratio; }
    ctx.drawImage(img, x + (maxW - dw) / 2, y + (maxH - dh) / 2, dw, dh);
    ctx.restore();
  } else if (fallbackText) {
    ctx.save();
    ctx.fillStyle = hexToRgba(color, 0.15);
    ctx.beginPath();
    ctx.arc(x + maxW / 2, y + maxH / 2, Math.min(maxW, maxH) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    ctx.font = `700 ${Math.round(Math.min(maxW, maxH) * 0.4)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = fallbackText.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
    ctx.fillText(initials, x + maxW / 2, y + maxH / 2);
    ctx.restore();
  }
}

/* ── Contact renderer with icons ─────────────────────────── */

function drawContactWithIcons(
  ctx: CanvasRenderingContext2D, c: CardConfig,
  x: number, startY: number, gap: number, align: "left" | "right",
  textColor: string, iconColor: string, fontSize: number
) {
  const entries = getContactEntries(c);
  ctx.font = getFont(400, fontSize, c.fontStyle);
  ctx.textAlign = align;
  entries.forEach((entry, i) => {
    const y = startY + i * gap;
    if (c.showContactIcons) {
      const iconX = align === "left" ? x + 8 : x - 8;
      drawContactIcon(ctx, entry.type, iconX, y, fontSize + 2, iconColor);
      const textX = align === "left" ? x + 22 : x - 22;
      ctx.fillStyle = textColor;
      ctx.fillText(entry.value, textX, y + 1);
    } else {
      ctx.fillStyle = textColor;
      ctx.fillText(entry.value, x, y);
    }
  });
}

/* ── Layout Renderers ────────────────────────────────────── */

function renderCleanLeftLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;
  const mx = W * 0.08;
  const my = H * 0.12;

  // Decorative circles
  drawAccentCircle(ctx, W * 0.85, H * 0.2, W * 0.15, pc, 0.04);
  drawAccentCircle(ctx, W * 0.9, H * 0.85, W * 0.08, c.secondaryColor, 0.03);

  // Accent bar
  ctx.fillStyle = pc;
  roundRect(ctx, mx, my, 4, 40, 2);
  ctx.fill();

  // Name
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", mx + 16, my + 18, { shadowBlur: 3, shadowColor: hexToRgba(pc, 0.2) });

  // Title
  ctx.font = getFont(400, 14, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", mx + 16, my + 42);

  // Divider
  drawDivider(ctx, mx, my + 60, W * 0.2, "gradient", pc, 0.5);

  // Contact
  drawContactWithIcons(ctx, c, mx, my + 84, 24, "left", hexToRgba(tc, 0.7), hexToRgba(pc, 0.6), 12);

  // Logo & Company
  const logoSize = Math.min(W * 0.1, H * 0.2);
  drawLogo(ctx, logoImg, W - mx - logoSize, H - my - logoSize - 10, logoSize, logoSize, c.company || "", pc, "circle");
  ctx.font = getFont(600, 13, fs);
  ctx.fillStyle = hexToRgba(pc, 0.8);
  ctx.textAlign = "right";
  ctx.fillText(c.company || "Company", W - mx, H - my);
}

function renderCenteredLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Top gradient line
  const grad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
  grad.addColorStop(0, "transparent");
  grad.addColorStop(0.3, pc);
  grad.addColorStop(0.7, pc);
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(W * 0.2, H * 0.06, W * 0.6, 2.5);

  // Logo centered
  const logoSize = H * 0.18;
  drawLogo(ctx, logoImg, W / 2 - logoSize / 2, H * 0.1, logoSize, logoSize, c.company || c.name || "", pc, "circle");

  // Name
  ctx.font = getFont(700, 30, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "center";
  drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.42);

  // Title
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", W / 2, H * 0.42 + 24);

  // Company
  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.45);
  ctx.fillText((c.company || "Company").toUpperCase(), W / 2, H * 0.42 + 48);

  // Ornate divider
  drawDivider(ctx, W * 0.3, H * 0.58, W * 0.4, "ornate", pc, 0.4);

  // Contact centered
  const entries = getContactEntries(c);
  ctx.font = getFont(400, 11, fs);
  ctx.textAlign = "center";
  entries.forEach((entry, i) => {
    const y = H * 0.68 + i * 22;
    ctx.fillStyle = hexToRgba(tc, 0.6);
    if (c.showContactIcons) {
      drawContactIcon(ctx, entry.type, W / 2 - ctx.measureText(entry.value).width / 2 - 14, y, 13, hexToRgba(pc, 0.5));
    }
    ctx.fillText(entry.value, W / 2, y);
  });

  // Bottom gradient line
  ctx.fillStyle = grad;
  ctx.fillRect(W * 0.2, H * 0.94, W * 0.6, 2.5);
}

function renderBoldSplitLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Left gradient panel
  const splitX = W * 0.4;
  const panelGrad = ctx.createLinearGradient(0, 0, splitX, H);
  panelGrad.addColorStop(0, pc);
  panelGrad.addColorStop(1, hexToRgba(sc, 0.8));
  ctx.fillStyle = panelGrad;
  ctx.fillRect(0, 0, splitX, H);

  // Pattern on panel
  drawPattern(ctx, 0, 0, splitX, H, "dots", getContrastColor(pc), 0.05, 24);

  const contrastC = getContrastColor(pc);

  // Logo
  const logoSize = splitX * 0.2;
  drawLogo(ctx, logoImg, splitX * 0.12, H * 0.1, logoSize, logoSize, c.company || "", contrastC, "circle");

  // Name
  ctx.font = getFont(800, 26, fs);
  ctx.fillStyle = contrastC;
  ctx.textAlign = "left";
  const mx = splitX * 0.12;
  drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.48, { shadowBlur: 4, shadowColor: "rgba(0,0,0,0.3)" });

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(contrastC, 0.7);
  ctx.fillText(c.title || "Job Title", mx, H * 0.48 + 24);

  // Company
  ctx.font = getFont(600, 9, fs);
  ctx.fillStyle = hexToRgba(contrastC, 0.4);
  ctx.fillText((c.company || "Company").toUpperCase(), mx, H * 0.9);

  // Right panel contact
  const rx = splitX + (W - splitX) * 0.12;
  ctx.font = getFont(600, 9, fs);
  ctx.fillStyle = hexToRgba(tc, 0.35);
  ctx.textAlign = "left";
  ctx.fillText("CONTACT", rx, H * 0.2);

  drawDivider(ctx, rx, H * 0.24, W * 0.08, "gradient", pc, 0.5);

  drawContactWithIcons(ctx, c, rx, H * 0.35, 26, "left", hexToRgba(tc, 0.7), hexToRgba(pc, 0.5), 12);

  // Decorative dots
  drawPattern(ctx, rx, H * 0.75, W * 0.1, H * 0.15, "dots", sc, 0.08, 14);
}

function renderAccentBarLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Left gradient bar
  const barW = 8;
  const barGrad = ctx.createLinearGradient(0, 0, 0, H);
  barGrad.addColorStop(0, pc);
  barGrad.addColorStop(1, sc);
  ctx.fillStyle = barGrad;
  ctx.fillRect(0, 0, barW, H);

  // Glow
  ctx.fillStyle = hexToRgba(pc, 0.08);
  ctx.fillRect(barW, 0, 3, H);

  const mx = W * 0.06;

  // Logo top-right
  const logoSize = H * 0.18;
  drawLogo(ctx, logoImg, W - mx - logoSize, H * 0.12, logoSize, logoSize, c.company || "", pc);

  // Name
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.3);

  // Title + Company
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(`${c.title || "Job Title"} — ${c.company || "Company"}`, mx, H * 0.3 + 24);

  // Divider
  drawDivider(ctx, mx, H * 0.52, W * 0.88, "gradient", pc, 0.2);

  // Contact horizontal
  const entries = getContactEntries(c);
  ctx.font = getFont(400, 11, fs);
  let detailX = mx;
  entries.forEach((entry) => {
    if (c.showContactIcons) {
      drawContactIcon(ctx, entry.type, detailX + 6, H * 0.68, 13, hexToRgba(pc, 0.5));
      detailX += 18;
    }
    ctx.fillStyle = hexToRgba(tc, 0.6);
    ctx.textAlign = "left";
    const textW = ctx.measureText(entry.value).width;
    ctx.fillText(entry.value, detailX, H * 0.69);
    detailX += textW + 18;
    if (detailX < W * 0.85) {
      ctx.fillStyle = hexToRgba(pc, 0.3);
      ctx.beginPath();
      ctx.arc(detailX - 8, H * 0.68 - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  });
}

function renderDiagonalLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Diagonal gradient block
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(W * 0.52, 0);
  ctx.lineTo(W, 0);
  ctx.lineTo(W, H);
  ctx.lineTo(W * 0.32, H);
  ctx.closePath();
  const diagGrad = ctx.createLinearGradient(W * 0.4, 0, W, H);
  diagGrad.addColorStop(0, pc);
  diagGrad.addColorStop(1, sc);
  ctx.fillStyle = diagGrad;
  ctx.fill();
  ctx.clip();
  drawPattern(ctx, 0, 0, W, H, "diagonal-lines", getContrastColor(pc), 0.04, 20);
  ctx.restore();

  // Name
  const mx = W * 0.07;
  ctx.font = getFont(700, 26, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.32);

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(tc, 0.6);
  ctx.fillText(c.title || "Job Title", mx, H * 0.32 + 22);

  // Logo
  const logoSize = H * 0.14;
  drawLogo(ctx, logoImg, mx, H * 0.55, logoSize, logoSize, c.company || "", pc, "circle");

  // Company
  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.fillText((c.company || "").toUpperCase(), mx + logoSize + 8, H * 0.63);

  // Contact on diagonal
  const contrastC = getContrastColor(pc);
  drawContactWithIcons(ctx, c, W - mx, H * 0.32, 24, "right", hexToRgba(contrastC, 0.85), hexToRgba(contrastC, 0.5), 11);
}

function renderGradientEdgeLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Bottom gradient strip
  const stripH = H * 0.2;
  const grad = ctx.createLinearGradient(0, H - stripH, W, H - stripH);
  grad.addColorStop(0, pc);
  grad.addColorStop(1, sc);
  ctx.fillStyle = grad;
  ctx.fillRect(0, H - stripH, W, stripH);

  // Glow above strip
  const glowGrad = ctx.createLinearGradient(0, H - stripH - 20, 0, H - stripH);
  glowGrad.addColorStop(0, "transparent");
  glowGrad.addColorStop(1, hexToRgba(pc, 0.08));
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, H - stripH - 20, W, 20);

  // Logo + Name
  const mx = W * 0.08;
  const logoSize = H * 0.16;
  drawLogo(ctx, logoImg, mx, H * 0.12, logoSize, logoSize, c.company || "", pc, "square");

  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", mx + logoSize + 14, H * 0.22);

  // Title
  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", mx + logoSize + 14, H * 0.22 + 24);

  // Divider
  drawDivider(ctx, mx, H * 0.48, W * 0.84, "gradient", pc, 0.15);

  // Contact
  drawContactWithIcons(ctx, c, mx, H * 0.56, 22, "left", hexToRgba(tc, 0.6), hexToRgba(pc, 0.4), 11);

  // Company on strip
  ctx.font = getFont(700, 14, fs);
  ctx.fillStyle = getContrastColor(pc);
  ctx.textAlign = "right";
  ctx.fillText(c.company || "Company", W - mx, H * 0.93);
}

/* ── NEW Premium Layouts ─────────────────────────────────── */

function renderLuxuryFrameLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Outer frame
  ctx.strokeStyle = hexToRgba(pc, 0.5);
  ctx.lineWidth = 2;
  roundRect(ctx, 12, 12, W - 24, H - 24, 4);
  ctx.stroke();

  // Inner frame
  ctx.strokeStyle = hexToRgba(pc, 0.2);
  ctx.lineWidth = 0.5;
  roundRect(ctx, 18, 18, W - 36, H - 36, 2);
  ctx.stroke();

  // Corner ornaments
  const cornerSize = 14;
  const corners = [[22, 22], [W - 22, 22], [22, H - 22], [W - 22, H - 22]];
  corners.forEach(([cx, cy]) => {
    ctx.fillStyle = pc;
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = hexToRgba(pc, 0.3);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx - cornerSize, cy); ctx.lineTo(cx + cornerSize, cy);
    ctx.moveTo(cx, cy - cornerSize); ctx.lineTo(cx, cy + cornerSize);
    ctx.stroke();
  });

  // Centered logo
  const logoSize = H * 0.16;
  drawLogo(ctx, logoImg, W / 2 - logoSize / 2, H * 0.1, logoSize, logoSize, c.company || "", pc, "circle");

  // Name
  ctx.font = getFont(700, 26, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "center";
  drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.42);

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = hexToRgba(tc, 0.6);
  ctx.fillText(c.title || "Job Title", W / 2, H * 0.42 + 22);

  drawDivider(ctx, W * 0.3, H * 0.55, W * 0.4, "diamond", pc, 0.4);

  // Contact
  const entries = getContactEntries(c);
  ctx.font = getFont(400, 10, fs);
  entries.forEach((entry, i) => {
    const y = H * 0.65 + i * 20;
    if (c.showContactIcons) {
      drawContactIcon(ctx, entry.type, W / 2 - ctx.measureText(entry.value).width / 2 - 14, y, 12, hexToRgba(pc, 0.4));
    }
    ctx.fillStyle = hexToRgba(tc, 0.6);
    ctx.textAlign = "center";
    ctx.fillText(entry.value, W / 2, y);
  });

  // Company
  ctx.font = getFont(600, 9, fs);
  ctx.fillStyle = hexToRgba(pc, 0.5);
  ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.92);
}

function renderGeometricLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Geometric circles
  drawAccentCircle(ctx, W * 0.85, H * -0.1, W * 0.25, pc, 0.08);
  drawAccentCircle(ctx, W * 0.92, H * 0.15, W * 0.12, sc, 0.06);
  drawAccentCircle(ctx, W * -0.05, H * 1.05, W * 0.18, pc, 0.05);

  // Corner frame
  ctx.strokeStyle = hexToRgba(pc, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(W * 0.06, H * 0.25);
  ctx.lineTo(W * 0.06, H * 0.06);
  ctx.lineTo(W * 0.25, H * 0.06);
  ctx.stroke();

  // Logo
  const logoSize = H * 0.18;
  drawLogo(ctx, logoImg, W * 0.08, H * 0.12, logoSize, logoSize, c.company || "", pc);

  // Name
  ctx.font = getFont(800, 30, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", W * 0.08, H * 0.48);

  // Title badge
  ctx.font = getFont(500, 11, fs);
  const titleText = c.title || "Job Title";
  const tw = ctx.measureText(titleText).width + 16;
  ctx.fillStyle = hexToRgba(pc, 0.12);
  roundRect(ctx, W * 0.08, H * 0.53, tw, 22, 11);
  ctx.fill();
  ctx.fillStyle = pc;
  ctx.textAlign = "left";
  ctx.fillText(titleText, W * 0.08 + 8, H * 0.53 + 14);

  // Company
  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.fillText((c.company || "").toUpperCase(), W * 0.08, H * 0.73);

  // Contact (right side)
  drawContactWithIcons(ctx, c, W * 0.58, H * 0.35, 24, "left", hexToRgba(tc, 0.6), hexToRgba(pc, 0.4), 11);

  // Bottom corner frame
  ctx.strokeStyle = hexToRgba(pc, 0.15);
  ctx.beginPath();
  ctx.moveTo(W * 0.75, H * 0.94);
  ctx.lineTo(W * 0.94, H * 0.94);
  ctx.lineTo(W * 0.94, H * 0.75);
  ctx.stroke();
}

function renderPhotoCardLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, textColor: tc, fontStyle: fs } = c;

  // Photo panel on right 40%
  const photoX = W * 0.6;
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    drawImageCover(ctx, logoImg, photoX, 0, W - photoX, H);
    ctx.fillStyle = hexToRgba("#000000", 0.3);
    ctx.fillRect(photoX, 0, W - photoX, H);
  } else {
    const phGrad = ctx.createLinearGradient(photoX, 0, W, H);
    phGrad.addColorStop(0, pc);
    phGrad.addColorStop(1, sc);
    ctx.fillStyle = phGrad;
    ctx.fillRect(photoX, 0, W - photoX, H);
    drawPattern(ctx, photoX, 0, W - photoX, H, "hexagons", getContrastColor(pc), 0.06, 30);
    drawImagePlaceholder(ctx, photoX + 20, H * 0.25, W - photoX - 40, H * 0.5, getContrastColor(pc), "Add Logo / Photo", 0);
  }

  // Left content
  const mx = W * 0.06;
  ctx.font = getFont(700, 28, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.28);

  ctx.font = getFont(400, 13, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", mx, H * 0.28 + 24);

  ctx.font = getFont(600, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.fillText((c.company || "").toUpperCase(), mx, H * 0.28 + 46);

  drawDivider(ctx, mx, H * 0.52, W * 0.38, "line", pc, 0.2);

  drawContactWithIcons(ctx, c, mx, H * 0.62, 22, "left", hexToRgba(tc, 0.65), hexToRgba(pc, 0.5), 11);
}

function renderLayeredLayout(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, textColor: tc, fontStyle: fs } = c;

  // Background gradient
  drawGradient(ctx, 0, 0, W, H, 135, [
    { offset: 0, color: c.bgColor },
    { offset: 1, color: hexToRgba(pc, 0.06) },
  ]);

  // Floating card panel
  ctx.save();
  ctx.shadowColor = hexToRgba(pc, 0.15);
  ctx.shadowBlur = 20;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = hexToRgba(c.bgColor, 0.95);
  roundRect(ctx, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 16);
  ctx.fill();
  ctx.restore();

  // Border
  ctx.strokeStyle = hexToRgba(pc, 0.1);
  ctx.lineWidth = 1;
  roundRect(ctx, W * 0.05, H * 0.1, W * 0.9, H * 0.8, 16);
  ctx.stroke();

  // Top accent
  ctx.fillStyle = pc;
  roundRect(ctx, W * 0.05, H * 0.1, W * 0.9, 4, 16);
  ctx.fill();

  // Logo
  const logoSize = H * 0.16;
  drawLogo(ctx, logoImg, W * 0.1, H * 0.2, logoSize, logoSize, c.company || "", pc, "square");

  // Name
  ctx.font = getFont(700, 26, fs);
  ctx.fillStyle = tc;
  ctx.textAlign = "left";
  drawTextWithShadow(ctx, c.name || "Your Name", W * 0.1 + logoSize + 14, H * 0.28);

  // Title
  ctx.font = getFont(400, 12, fs);
  ctx.fillStyle = pc;
  ctx.fillText(c.title || "Job Title", W * 0.1 + logoSize + 14, H * 0.28 + 22);

  // Company
  ctx.font = getFont(500, 10, fs);
  ctx.fillStyle = hexToRgba(tc, 0.4);
  ctx.fillText((c.company || "").toUpperCase(), W * 0.1 + logoSize + 14, H * 0.28 + 40);

  drawDivider(ctx, W * 0.1, H * 0.55, W * 0.8, "gradient", pc, 0.2);

  drawContactWithIcons(ctx, c, W * 0.1, H * 0.65, 22, "left", hexToRgba(tc, 0.6), hexToRgba(pc, 0.4), 11);
}

/* ── Card Back Renderer ──────────────────────────────────── */

function renderCardBack(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const { primaryColor: pc, secondaryColor: sc, fontStyle: fs } = c;

  // Full gradient
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, pc);
  grad.addColorStop(1, sc);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Pattern
  drawPattern(ctx, 0, 0, W, H, "dots", getContrastColor(pc), 0.05, 28);

  // Decorative circles
  drawAccentCircle(ctx, W * 0.15, H * 0.15, W * 0.12, getContrastColor(pc), 0.05);
  drawAccentCircle(ctx, W * 0.85, H * 0.85, W * 0.1, getContrastColor(pc), 0.04);

  // Center logo or brand
  const contrastC = getContrastColor(pc);
  const logoSize = Math.min(W, H) * 0.25;
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    drawLogo(ctx, logoImg, W / 2 - logoSize / 2, H / 2 - logoSize / 2 - 16, logoSize, logoSize, "", contrastC, "circle");
  } else {
    ctx.font = getFont(800, 42, fs);
    ctx.fillStyle = contrastC;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    drawTextWithShadow(ctx, c.company || c.name || "Brand", W / 2, H / 2 - 10, { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.3)" });
  }

  // Tagline
  if (c.website) {
    ctx.font = getFont(400, 13, fs);
    ctx.fillStyle = hexToRgba(contrastC, 0.5);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(c.website, W / 2, H / 2 + logoSize / 2 + 8);
  }

  drawDivider(ctx, W * 0.35, H / 2 + logoSize / 2 + 24, W * 0.3, "ornate", contrastC, 0.2);
}

/* ── Bleed / Safe Zone Overlay ───────────────────────────── */

function drawBleedOverlay(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const bPx = BLEED_MM * (W / (cardSizes.standard?.w || W)) * MM_PX;
  const b = Math.min(bPx, W * 0.04);
  ctx.save();
  ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
  ctx.fillRect(0, 0, W, b);
  ctx.fillRect(0, H - b, W, b);
  ctx.fillRect(0, b, b, H - b * 2);
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

/* ── Component ───────────────────────────────────────────── */

export default function BusinessCardWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

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
    logoUrl: "",
    patternType: "none",
    showContactIcons: true,
  });

  const [showBleed, setShowBleed] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [bleedInExport, setBleedInExport] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);

  const updateConfig = useCallback((partial: Partial<CardConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  // Load logo image
  useEffect(() => {
    if (config.logoUrl) {
      loadImage(config.logoUrl)
        .then(setLogoImg)
        .catch(() => setLogoImg(null));
    } else {
      setLogoImg(null);
    }
  }, [config.logoUrl]);

  // Logo file upload
  const handleLogoUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          updateConfig({ logoUrl: reader.result });
        }
      };
      reader.readAsDataURL(file);
    },
    [updateConfig]
  );

  const getCardSize = useCallback(() => {
    if (config.cardStyle === "custom") {
      const w = Math.round(config.customWidthMm * MM_PX);
      const h = Math.round(config.customHeightMm * MM_PX);
      return {
        w, h,
        label: `Custom (${config.customWidthMm}×${config.customHeightMm}mm)`,
        ratio: `${w} / ${h}`,
      };
    }
    return cardSizes[config.cardStyle] || cardSizes.standard;
  }, [config.cardStyle, config.customWidthMm, config.customHeightMm]);

  // ── Visual Template Previews ──────────────────────────
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      layouts.map((l) => ({
        id: l.id,
        label: l.label,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          const styles: Record<string, "left" | "centered" | "split" | "diagonal" | "gradient" | "minimal"> = {
            "clean-left": "left",
            "centered": "centered",
            "bold-split": "split",
            "accent-bar": "left",
            "diagonal": "diagonal",
            "gradient-edge": "gradient",
            "luxury-frame": "centered",
            "geometric": "minimal",
            "photo-card": "split",
            "layered": "centered",
          };
          drawCardThumbnail(ctx, w, h, {
            bgColor: config.bgColor,
            primaryColor: config.primaryColor,
            accentColor: config.secondaryColor,
            headerStyle: styles[l.id] || "left",
            showLogo: true,
            showLines: true,
          });
        },
      })),
    [config.primaryColor, config.secondaryColor, config.bgColor]
  );

  // ── Render canvas ─────────────────────────────────────
  useEffect(() => {
    const renderToCanvas = (canvas: HTMLCanvasElement, cfg: CardConfig) => {
      renderCard(canvas, cfg, logoImg);
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const size =
        cfg.cardStyle === "custom"
          ? {
              w: Math.round(cfg.customWidthMm * MM_PX),
              h: Math.round(cfg.customHeightMm * MM_PX),
            }
          : cardSizes[cfg.cardStyle] || cardSizes.standard;
      if (cfg.qrCodeUrl) {
        const qrSize = Math.min(size.w, size.h) * 0.16;
        if (cfg.side === "front") {
          drawQRPlaceholder(
            ctx,
            size.w - qrSize - size.w * 0.06,
            size.h - qrSize - size.h * 0.12,
            qrSize,
            "#000000"
          );
        } else {
          drawQRPlaceholder(ctx, size.w / 2 - qrSize / 2, size.h * 0.65, qrSize, "#000000");
        }
      }
      if (showBleed) drawBleedOverlay(ctx, size.w, size.h);
      if (showSafeZone) drawSafeZone(ctx, size.w, size.h);
    };

    if (canvasRef.current) renderToCanvas(canvasRef.current, config);
    if (sideBySide && backCanvasRef.current) {
      const backCfg = {
        ...config,
        side: config.side === "front" ? ("back" as const) : ("front" as const),
      };
      renderToCanvas(backCanvasRef.current, backCfg);
    }
  }, [config, showBleed, showSafeZone, sideBySide, logoImg]);

  // ── AI generation ─────────────────────────────────────
  const generateWithAI = useCallback(async () => {
    if (!config.name.trim() && !config.company.trim()) return;
    setIsGenerating(true);
    try {
      const prompt = `You are an elite professional business card designer. Design a stunning premium business card.

Name: ${config.name || "Not provided"}
Title: ${config.title || "Not provided"}
Company: ${config.company || "Not provided"}
Industry: Infer from company/title

Think LUXURY, PREMIUM design. Consider:
- Visual balance, golden ratio, professional typography
- Color psychology for the industry
- Modern design trends (2024)
- Unique decorative elements

RESPOND WITH EACH VALUE ON ITS OWN LINE:
LAYOUT: ${layouts.map((l) => l.id).join(" | ")}
PRIMARY: #hex (brand color)
SECONDARY: #hex (accent)
TEXT: #hex (text color)
BG: #hex (background)
FONT: modern | classic | bold | elegant
PATTERN: ${patternOptions.map((p) => p.id).join(" | ")}
STOCK_IMAGE: keyword for logo/brand image (e.g., "abstract technology logo")`;

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: prompt }] }),
      });
      if (!response.ok) throw new Error("Failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      const layoutMatch = fullText.match(/LAYOUT:\s*(\S+)/i);
      const primaryMatch = fullText.match(/PRIMARY:\s*(#[0-9a-fA-F]{6})/i);
      const secondaryMatch = fullText.match(/SECONDARY:\s*(#[0-9a-fA-F]{6})/i);
      const textMatch = fullText.match(/TEXT:\s*(#[0-9a-fA-F]{6})/i);
      const bgMatch = fullText.match(/BG:\s*(#[0-9a-fA-F]{6})/i);
      const fontMatch = fullText.match(/FONT:\s*(\S+)/i);
      const patternMatch = fullText.match(/PATTERN:\s*(\S+)/i);
      const stockMatch = fullText.match(/STOCK_IMAGE:\s*(.+)/i);

      const updates: Partial<CardConfig> = {};
      if (layoutMatch) {
        const l = layoutMatch[1].toLowerCase();
        if (layouts.some((lo) => lo.id === l)) updates.layout = l;
      }
      if (primaryMatch) updates.primaryColor = primaryMatch[1];
      if (secondaryMatch) updates.secondaryColor = secondaryMatch[1];
      if (textMatch) updates.textColor = textMatch[1];
      if (bgMatch) updates.bgColor = bgMatch[1];
      if (fontMatch) {
        const f = fontMatch[1].toLowerCase() as CardConfig["fontStyle"];
        if (["modern", "classic", "bold", "elegant"].includes(f)) updates.fontStyle = f;
      }
      if (patternMatch) {
        const p = patternMatch[1].toLowerCase();
        if (patternOptions.some((po) => po.id === p)) updates.patternType = p;
      }
      if (stockMatch) {
        try {
          const imgRes = await fetch(
            `/api/images?query=${encodeURIComponent(stockMatch[1].trim())}&count=1`
          );
          if (imgRes.ok) {
            const imgs = await imgRes.json();
            if (imgs?.[0]?.url) updates.logoUrl = imgs[0].url;
          }
        } catch {
          /* skip if stock fetch fails */
        }
      }
      updateConfig(updates);
    } catch (err) {
      console.error("AI generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [config, updateConfig]);

  // ── Export handlers ───────────────────────────────────
  const handleDownloadPng = useCallback(() => {
    if (!canvasRef.current) return;
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-card-${config.side}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config.side]);

  const handleCopyCanvas = useCallback(async () => {
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

  const handleExportPdf = useCallback(() => {
    const size = getCardSize();
    const cardWmm =
      config.cardStyle === "custom" ? config.customWidthMm : size.w / MM_PX;
    const cardHmm =
      config.cardStyle === "custom" ? config.customHeightMm : size.h / MM_PX;
    const bleedMm = bleedInExport ? BLEED_MM : 0;
    const cropLen = bleedInExport ? 5 : 0;
    const margin = bleedMm + cropLen + 3;
    const pageW = cardWmm + margin * 2;
    const pageH = cardHmm + margin * 2;

    const pdf = new jsPDF({
      orientation: pageW > pageH ? "l" : "p",
      unit: "mm",
      format: [pageW, pageH],
    });

    const addPage = (side: "front" | "back", isFirst: boolean) => {
      if (!isFirst)
        pdf.addPage([pageW, pageH], pageW > pageH ? "l" : "p");
      const offscreen = document.createElement("canvas");
      const cfg = { ...config, side };
      if (config.cardStyle === "custom") {
        offscreen.width = Math.round(config.customWidthMm * MM_PX);
        offscreen.height = Math.round(config.customHeightMm * MM_PX);
      }
      renderCard(offscreen, cfg, logoImg);
      if (cfg.qrCodeUrl) {
        const ctx2 = offscreen.getContext("2d");
        if (ctx2) {
          const qrSize = Math.min(offscreen.width, offscreen.height) * 0.16;
          if (side === "front") {
            drawQRPlaceholder(
              ctx2,
              offscreen.width - qrSize - offscreen.width * 0.06,
              offscreen.height - qrSize - offscreen.height * 0.12,
              qrSize,
              "#000000"
            );
          } else {
            drawQRPlaceholder(
              ctx2,
              offscreen.width / 2 - qrSize / 2,
              offscreen.height * 0.65,
              qrSize,
              "#000000"
            );
          }
        }
      }
      const imgData = offscreen.toDataURL("image/png");
      pdf.addImage(imgData, "PNG", margin, margin, cardWmm, cardHmm);

      if (bleedInExport) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.2);
        const x1 = margin,
          y1 = margin;
        const x2 = margin + cardWmm,
          y2 = margin + cardHmm;
        pdf.line(x1, y1 - cropLen, x1, y1 - 1);
        pdf.line(x1 - cropLen, y1, x1 - 1, y1);
        pdf.line(x2, y1 - cropLen, x2, y1 - 1);
        pdf.line(x2 + 1, y1, x2 + cropLen, y1);
        pdf.line(x1, y2 + 1, x1, y2 + cropLen);
        pdf.line(x1 - cropLen, y2, x1 - 1, y2);
        pdf.line(x2, y2 + 1, x2, y2 + cropLen);
        pdf.line(x2 + 1, y2, x2 + cropLen, y2);
      }
    };

    addPage("front", true);
    addPage("back", false);
    pdf.save(`business-card-${config.name || "design"}.pdf`);
  }, [config, bleedInExport, getCardSize, logoImg]);

  const currentSize = getCardSize();
  const displayW = Math.min(480, currentSize.w);
  const displayH = displayW * (currentSize.h / currentSize.w);

  // ── Left Panel (Settings) ─────────────────────────────
  const leftPanel = (
    <div className="space-y-3">
      <Accordion defaultOpen="details">
      {/* Visual Template Slider */}
      <AccordionSection
        icon={<IconLayout className="size-3.5" />}
        label="Templates"
        id="templates"
      >
        <TemplateSlider
          templates={templatePreviews}
          activeId={config.layout}
          onSelect={(id) => updateConfig({ layout: id })}
          thumbWidth={120}
          thumbHeight={72}
          label=""
        />
      </AccordionSection>

      {/* Contact Details */}
      <AccordionSection
        icon={<IconType className="size-3.5" />}
        label="Contact Details"
        id="details"
      >
        <div className="space-y-2">
          {(
            [
              { key: "name", placeholder: "Full Name", type: "text" },
              { key: "title", placeholder: "Job Title", type: "text" },
              { key: "company", placeholder: "Company Name", type: "text" },
            ] as const
          ).map(({ key, placeholder, type }) => (
            <input
              key={key}
              type={type}
              placeholder={placeholder}
              value={config[key]}
              onChange={(e) => updateConfig({ [key]: e.target.value })}
              className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          ))}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="email"
              placeholder="Email"
              value={config.email}
              onChange={(e) => updateConfig({ email: e.target.value })}
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <input
              type="tel"
              placeholder="Phone"
              value={config.phone}
              onChange={(e) => updateConfig({ phone: e.target.value })}
              className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
          <input
            type="text"
            placeholder="Website"
            value={config.website}
            onChange={(e) => updateConfig({ website: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <input
            type="text"
            placeholder="Address (optional)"
            value={config.address}
            onChange={(e) => updateConfig({ address: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
          <div className="pt-1">
            <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">
              QR Code URL
            </label>
            <input
              type="url"
              placeholder="https://yoursite.com"
              value={config.qrCodeUrl}
              onChange={(e) => updateConfig({ qrCodeUrl: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            {config.qrCodeUrl && (
              <p className="text-[0.5rem] text-primary-500 mt-0.5">
                ✓ QR code will appear on card
              </p>
            )}
          </div>
        </div>
      </AccordionSection>

      {/* Logo & Branding */}
      <AccordionSection
        icon={<IconCamera className="size-3.5" />}
        label="Logo & Branding"
        id="logo"
      >
        <div className="space-y-2">
          <label className="flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/30 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
            <IconCamera className="size-4 text-gray-400" />
            <span className="text-xs text-gray-400">
              {config.logoUrl ? "Change logo..." : "Upload logo..."}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
          {config.logoUrl && (
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={config.logoUrl}
                  alt="Logo"
                  className="size-full object-contain"
                />
              </div>
              <button
                onClick={() => updateConfig({ logoUrl: "" })}
                className="text-xs text-error-500 hover:text-error-400 transition-colors"
              >
                Remove
              </button>
            </div>
          )}
          <input
            type="url"
            placeholder="Or paste logo URL..."
            value={config.logoUrl.startsWith("data:") ? "" : config.logoUrl}
            onChange={(e) => updateConfig({ logoUrl: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
          />
        </div>
      </AccordionSection>

      {/* Style */}
      <AccordionSection
        icon={<IconDroplet className="size-3.5" />}
        label="Style"
        id="style"
      >
        <div className="space-y-3">
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">
            Color Theme
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {colorPresets.map((theme) => (
              <button
                key={theme.name}
                onClick={() =>
                  updateConfig({
                    primaryColor: theme.primary,
                    secondaryColor: theme.secondary,
                    textColor: theme.text,
                    bgColor: theme.bg,
                  })
                }
                className={`p-1.5 rounded-lg border text-center transition-all ${
                  config.primaryColor === theme.primary &&
                  config.bgColor === theme.bg
                    ? "border-primary-500 ring-1 ring-primary-500/30"
                    : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                }`}
              >
                <div className="flex gap-0.5 justify-center mb-0.5">
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="size-3 rounded-full"
                    style={{ backgroundColor: theme.bg }}
                  />
                </div>
                <span className="text-[0.5rem] text-gray-400">
                  {theme.name}
                </span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { key: "primaryColor", label: "Primary" },
                { key: "secondaryColor", label: "2nd" },
                { key: "bgColor", label: "BG" },
                { key: "textColor", label: "Text" },
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex items-center gap-1 cursor-pointer">
                <input
                  type="color"
                  value={config[key]}
                  onChange={(e) => updateConfig({ [key]: e.target.value })}
                  className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                />
                <span className="text-[0.5625rem] text-gray-400">{label}</span>
              </label>
            ))}
          </div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">
            Typography
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(["modern", "classic", "bold", "elegant"] as const).map(
              (style) => (
                <button
                  key={style}
                  onClick={() => updateConfig({ fontStyle: style })}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    config.fontStyle === style
                      ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                  }`}
                  style={{ fontFamily: getFontFamily(style) }}
                >
                  {style}
                </button>
              )
            )}
          </div>
          <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">
            Pattern
          </p>
          <div className="flex flex-wrap gap-1">
            {patternOptions.map((p) => (
              <button
                key={p.id}
                onClick={() => updateConfig({ patternType: p.id })}
                className={`px-2 py-1 rounded-lg border text-[0.625rem] font-medium transition-all ${
                  config.patternType === p.id
                    ? "border-primary-500 bg-primary-500/5 text-primary-500"
                    : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={config.showContactIcons}
              onChange={(e) =>
                updateConfig({ showContactIcons: e.target.checked })
              }
              className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30"
            />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Show contact icons
            </span>
          </label>
        </div>
      </AccordionSection>

      {/* Card Size & Print */}
      <AccordionSection
        icon={<IconMaximize className="size-3.5" />}
        label="Card Size & Print"
        id="size"
      >
        <div className="space-y-2">
          <div className="flex gap-1.5">
            {(["standard", "square", "rounded", "custom"] as const).map(
              (s) => (
                <button
                  key={s}
                  onClick={() => updateConfig({ cardStyle: s })}
                  className={`flex-1 px-2 py-1.5 rounded-xl border text-xs font-semibold capitalize transition-all ${
                    config.cardStyle === s
                      ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s}
                </button>
              )
            )}
          </div>
          {config.cardStyle === "custom" && (
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">
                  Width (mm)
                </label>
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={config.customWidthMm}
                  onChange={(e) =>
                    updateConfig({
                      customWidthMm: Math.max(
                        30,
                        Math.min(200, Number(e.target.value) || 89)
                      ),
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center"
                />
              </div>
              <span className="text-gray-400 text-xs pt-4">×</span>
              <div className="flex-1">
                <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">
                  Height (mm)
                </label>
                <input
                  type="number"
                  min={30}
                  max={200}
                  value={config.customHeightMm}
                  onChange={(e) =>
                    updateConfig({
                      customHeightMm: Math.max(
                        30,
                        Math.min(200, Number(e.target.value) || 51)
                      ),
                    })
                  }
                  className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center"
                />
              </div>
            </div>
          )}
          <div className="flex gap-1.5">
            <button
              onClick={() => updateConfig({ side: "front" })}
              className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                config.side === "front"
                  ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              Front
            </button>
            <button
              onClick={() => updateConfig({ side: "back" })}
              className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                config.side === "back"
                  ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              Back
            </button>
            <button
              onClick={() => setSideBySide(!sideBySide)}
              className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                sideBySide
                  ? "border-secondary-500 bg-secondary-500/5 text-secondary-500 ring-1 ring-secondary-500/30"
                  : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
              }`}
            >
              Both
            </button>
          </div>
          <div className="space-y-1.5 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showBleed}
                onChange={(e) => setShowBleed(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Show bleed area (3mm)
              </span>
              <span className="ml-auto size-2 rounded-full bg-error-500/40" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showSafeZone}
                onChange={(e) => setShowSafeZone(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Show safe zone (5mm)
              </span>
              <span className="ml-auto size-2 rounded-full border border-dashed border-success-500/60" />
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bleedInExport}
                onChange={(e) => setBleedInExport(e.target.checked)}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">
                Include crop marks in PDF
              </span>
            </label>
          </div>
        </div>
      </AccordionSection>
      </Accordion>

      {/* AI Generate */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />
          AI Design Director
        </label>
        <button
          onClick={generateWithAI}
          disabled={
            (!config.name.trim() && !config.company.trim()) || isGenerating
          }
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (
            <>
              <IconLoader className="size-3.5 animate-spin" />
              Designing…
            </>
          ) : (
            <>
              <IconWand className="size-3.5" />
              Generate Premium Design
            </>
          )}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">
          AI suggests layout, colors, typography, pattern & logo
        </p>
      </div>
    </div>
  );

  // ── Right Panel (Export & Details) ────────────────────
  const rightPanel = (
    <div className="space-y-4">
      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">
          Export
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10"
          >
            <IconDownload className="size-4" />
            <span className="text-xs font-semibold">.png</span>
          </button>
          <button
            onClick={handleCopyCanvas}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10"
          >
            <IconCopy className="size-4" />
            <span className="text-xs font-semibold">Clipboard</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-info-500/30 bg-info-500/5 text-info-500 transition-colors hover:bg-info-500/10"
          >
            <IconPrinter className="size-4" />
            <span className="text-xs font-semibold">.pdf</span>
          </button>
          <button
            onClick={() =>
              updateConfig({
                side: config.side === "front" ? "back" : "front",
              })
            }
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <IconRefresh className="size-4" />
            <span className="text-xs font-semibold">Flip</span>
          </button>
        </div>
      </div>

      {/* Card Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Card Info
        </h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>
            Size:{" "}
            <span className="text-gray-300">{currentSize.label}</span>
          </p>
          <p>
            Layout:{" "}
            <span className="text-gray-300">
              {layouts.find((l) => l.id === config.layout)?.label}
            </span>
          </p>
          <p>
            Font:{" "}
            <span className="text-gray-300 capitalize">
              {config.fontStyle}
            </span>
          </p>
          <p>
            Pattern:{" "}
            <span className="text-gray-300 capitalize">
              {config.patternType}
            </span>
          </p>
          <p>
            Side:{" "}
            <span className="text-gray-300 capitalize">{config.side}</span>
          </p>
          <p>
            Resolution:{" "}
            <span className="text-gray-300">
              {currentSize.w}×{currentSize.h}px
            </span>
          </p>
        </div>
      </div>

      {/* Side-by-side preview */}
      {sideBySide && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {config.side === "front" ? "Back Side" : "Front Side"}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2">
            <canvas
              ref={backCanvasRef}
              className="w-full h-auto rounded"
              style={{ aspectRatio: currentSize.ratio }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // ── Toolbar ───────────────────────────────────────────
  const toolbar = (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400 capitalize">
        {config.side}
      </span>
      <span className="text-gray-600 dark:text-gray-600">·</span>
      <span className="text-xs text-gray-500">{currentSize.label}</span>
    </div>
  );

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={rightPanel}
      canvasRef={canvasRef}
      displayWidth={displayW}
      displayHeight={displayH}
      label={`${currentSize.label} · ${currentSize.w}×${currentSize.h}px`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(z + 0.25, 3))}
      onZoomOut={() => setZoom((z) => Math.max(z - 0.25, 0.25))}
      onZoomFit={() => setZoom(1)}
      actionsBar={
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors"
          >
            <IconDownload className="size-3" />
            Download PNG
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors"
          >
            <IconPrinter className="size-3" />
            PDF
          </button>
          <button
            onClick={handleCopyCanvas}
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
