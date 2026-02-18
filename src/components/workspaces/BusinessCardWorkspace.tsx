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
  IconUsers,
  IconPlus,
  IconTrash,
  IconCheck,
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
} from "@/lib/graphics-engine";
import { drawIcon } from "@/lib/icon-library";
import { drawCardThumbnail } from "@/lib/template-renderers";
import StickyCanvasLayout from "./StickyCanvasLayout";
import TemplateSlider, { type TemplatePreview } from "./TemplateSlider";
import AdvancedSettingsPanel from "./AdvancedSettingsPanel";
import { jsPDF } from "jspdf";
import { Accordion, AccordionSection } from "@/components/ui";
import { useAdvancedSettingsStore } from "@/stores";
import {
  getAdvancedSettings,
  scaledFontSize,
  scaledIconSize,
  scaledIconGap,
  scaledElementGap,
  getPatternOpacity,
  getExportScale,
  applyCanvasSettings,
} from "@/stores/advanced-helpers";
import {
  cardConfigToDocument, documentToCardConfig,
  syncTextToDocument, syncColorsToDocument,
  type CardConfig as CardConfigV2,
} from "@/lib/editor/business-card-adapter";
import {
  generateCardDocument,
  LAYOUT_RECIPES, CARD_THEMES, ACCENT_KITS,
  suggestCombination, applyThemeToConfig, getCombinationCount,
} from "@/lib/editor/template-generator";
import { renderDocumentV2 } from "@/lib/editor/renderer";
import { renderToCanvas } from "@/lib/editor/renderer";
import { CanvasEditor, EditorToolbar, LayersListPanel, LayerPropertiesPanel } from "@/components/editor";
import BusinessCardLayerQuickEdit from "@/components/editor/BusinessCardLayerQuickEdit";
import { useEditorStore } from "@/stores/editor";
import { buildAIPatchPrompt, parseAIRevisionResponse, processIntent } from "@/lib/editor/ai-patch";
import type { RevisionScope as EditorRevisionScope } from "@/lib/editor/ai-patch";

/* ====================================================================
   BUSINESS CARD TYPOGRAPHY STANDARDS (Industry Research)
   --------------------------------------------------------------------
   Standard card: 3.5 x 2 inches = 1050 x 600px @ 300 DPI
   
   Professional font sizes (in points, at 300 DPI):
    - Name:           10-14pt  -> 28-40px on canvas
    - Job Title:       8-10pt  -> 22-28px on canvas
    - Company Name:    8-12pt  -> 22-34px on canvas
    - Contact Info:    7-9pt   -> 20-25px on canvas
    - Address:         7-8pt   -> 20-22px on canvas
    - Tagline:         6-8pt   -> 17-22px on canvas
    - Website/Social:  7-8pt   -> 20-22px on canvas
   
   Key rules:
   - Minimum readable: 6pt (17px on 300 DPI canvas)
   - Body text sweet spot: 8-9pt (22-25px)
   - Names should stand out: 11-14pt (31-40px)
   - NEVER go below 7pt (20px) for contact info
   - Line spacing: 120-150% of font size
   - Letter spacing for uppercase: +0.5 to +2px
   ==================================================================== */

/* -- Types ---------------------------------------------------------- */

interface ContactEntry {
  id: string;
  name: string;
  title: string;
  email: string;
  phone: string;
}

interface CardConfig {
  /* Contact */
  name: string;
  title: string;
  company: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  /* Visual */
  template: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  bgColor: string;
  fontStyle: "modern" | "classic" | "bold" | "elegant" | "minimal";
  cardStyle: "standard" | "eu" | "square" | "rounded" | "jp" | "custom";
  customWidthMm: number;
  customHeightMm: number;
  side: "front" | "back";
  logoUrl: string;
  patternType: string;
  showContactIcons: boolean;
  qrCodeUrl: string;
  /* Back card */
  backStyle: "logo-center" | "pattern-fill" | "minimal" | "info-repeat" | "gradient-brand";
}

/* -- Revision Types -------------------------------------------------- */

type RevisionScope = "text-only" | "colors-only" | "layout-only" | "element-specific" | "full-redesign";

interface RevisionEntry {
  id: string;
  instruction: string;
  scope: RevisionScope;
  timestamp: number;
  changes: Partial<CardConfig>;
}

/* -- Template Data --------------------------------------------------- */

const TEMPLATES = [
  /* Minimal & Clean */
  { id: "executive-clean",      label: "Executive Clean",     category: "minimal",    desc: "Ultra-clean with generous whitespace" },
  { id: "swiss-grid",           label: "Swiss Grid",          category: "minimal",    desc: "Grid-based Swiss design" },
  { id: "mono-type",            label: "Mono Type",           category: "minimal",    desc: "Typography-focused, no decoration" },
  { id: "nordic-frost",         label: "Nordic Frost",        category: "minimal",    desc: "Clean Scandinavian style" },
  /* Modern & Bold */
  { id: "bold-split",           label: "Bold Split",          category: "modern",     desc: "Color-blocked split panel" },
  { id: "neon-edge",            label: "Neon Edge",           category: "modern",     desc: "Glowing accent edge" },
  { id: "geometric-modern",     label: "Geometric",           category: "modern",     desc: "Bold geometric shapes" },
  { id: "gradient-wave",        label: "Gradient Wave",       category: "modern",     desc: "Flowing gradient accent" },
  /* Classic & Professional */
  { id: "corporate-stripe",     label: "Corporate Stripe",    category: "classic",    desc: "Professional side stripe" },
  { id: "diplomat",             label: "Diplomat",            category: "classic",    desc: "Distinguished double border" },
  { id: "heritage-crest",       label: "Heritage Crest",      category: "classic",    desc: "Traditional centered layout" },
  { id: "engraved",             label: "Engraved",            category: "classic",    desc: "Subtle engraved style" },
  /* Creative & Trendy */
  { id: "diagonal-cut",         label: "Diagonal Cut",        category: "creative",   desc: "Angular diagonal division" },
  { id: "layered-card",         label: "Layered Card",        category: "creative",   desc: "Floating panel effect" },
  { id: "photo-overlay",        label: "Photo Overlay",       category: "creative",   desc: "Image-based with overlay" },
  { id: "dot-matrix",           label: "Dot Matrix",          category: "creative",   desc: "Halftone pattern accent" },
  /* Luxury & Premium */
  { id: "gold-foil",            label: "Gold Foil",           category: "luxury",     desc: "Metallic gold accents" },
  { id: "marble-luxe",          label: "Marble Luxe",         category: "luxury",     desc: "Marble texture effect" },
  { id: "velvet-noir",          label: "Velvet Noir",         category: "luxury",     desc: "Deep dark luxury" },
  { id: "art-deco",             label: "Art Deco",            category: "luxury",     desc: "1920s geometric luxury" },
] as const;

const TEMPLATE_CATEGORIES = [
  { id: "minimal",  label: "Minimal" },
  { id: "modern",   label: "Modern" },
  { id: "classic",  label: "Classic" },
  { id: "creative", label: "Creative" },
  { id: "luxury",   label: "Luxury" },
];

const COLOR_PRESETS = [
  { name: "Lime Pro",    primary: "#8ae600", secondary: "#06b6d4", text: "#ffffff", bg: "#0a0a0a" },
  { name: "Navy",        primary: "#1e3a5f", secondary: "#4a90d9", text: "#ffffff", bg: "#0c1929" },
  { name: "Charcoal",    primary: "#2d2d2d", secondary: "#6b6b6b", text: "#333333", bg: "#ffffff" },
  { name: "Midnight",    primary: "#1a1a2e", secondary: "#16213e", text: "#e0e0e0", bg: "#0f0f1a" },
  { name: "Gold Rush",   primary: "#c9a227", secondary: "#e8d48b", text: "#ffffff", bg: "#1a1614" },
  { name: "Forest",      primary: "#1b4332", secondary: "#40916c", text: "#ffffff", bg: "#0b1f18" },
  { name: "Ocean",       primary: "#0077b6", secondary: "#90e0ef", text: "#ffffff", bg: "#03045e" },
  { name: "White Linen", primary: "#2c2c2c", secondary: "#8a8a8a", text: "#1a1a1a", bg: "#faf8f5" },
  { name: "Burgundy",    primary: "#800020", secondary: "#c4a882", text: "#ffffff", bg: "#1a0a10" },
  { name: "Slate",       primary: "#475569", secondary: "#94a3b8", text: "#f1f5f9", bg: "#0f172a" },
  { name: "Coral",       primary: "#ff6b6b", secondary: "#ffd93d", text: "#ffffff", bg: "#1a1a2e" },
  { name: "Sage",        primary: "#6b8f71", secondary: "#aab89e", text: "#ffffff", bg: "#1c2a1e" },
];

const PATTERN_OPTIONS = [
  { id: "none",           label: "None" },
  { id: "dots",           label: "Dots" },
  { id: "lines",          label: "Lines" },
  { id: "diagonal-lines", label: "Diagonal" },
  { id: "crosshatch",     label: "Crosshatch" },
  { id: "waves",          label: "Waves" },
  { id: "hexagons",       label: "Hexagons" },
  { id: "chevrons",       label: "Chevrons" },
  { id: "diamond",        label: "Diamond" },
];

/* -- Template Default Themes (Applied on template selection) ---------- */

const TEMPLATE_DEFAULT_THEMES: Record<string, { primary: string; secondary: string; text: string; bg: string; pattern: string; font: CardConfig["fontStyle"] }> = {
  /* Minimal & Clean — light, airy, whitespace-forward */
  "executive-clean":    { primary: "#2c3e50", secondary: "#7f8c8d", text: "#2c3e50", bg: "#faf8f5",  pattern: "none",           font: "modern"  },
  "swiss-grid":         { primary: "#e63946", secondary: "#457b9d", text: "#1d3557", bg: "#f1faee",  pattern: "none",           font: "bold"    },
  "mono-type":          { primary: "#111111", secondary: "#555555", text: "#111111", bg: "#ffffff",  pattern: "none",           font: "minimal" },
  "nordic-frost":       { primary: "#5e81ac", secondary: "#88c0d0", text: "#2e3440", bg: "#eceff4",  pattern: "none",           font: "elegant" },
  /* Modern & Bold — dark canvases, vibrant accents */
  "bold-split":         { primary: "#ff6347", secondary: "#ffa07a", text: "#ffffff", bg: "#1a2332",  pattern: "dots",           font: "bold"    },
  "neon-edge":          { primary: "#00ff87", secondary: "#60efff", text: "#e8e8e8", bg: "#0a0a0a",  pattern: "none",           font: "modern"  },
  "geometric-modern":   { primary: "#6c5ce7", secondary: "#a29bfe", text: "#ffffff", bg: "#2d3436",  pattern: "none",           font: "bold"    },
  "gradient-wave":      { primary: "#ff6b6b", secondary: "#feca57", text: "#ffffff", bg: "#1a1a2e",  pattern: "waves",          font: "modern"  },
  /* Classic & Professional — rich, distinguished palettes */
  "corporate-stripe":   { primary: "#1e3a5f", secondary: "#4a90d9", text: "#ffffff", bg: "#0f1c2e",  pattern: "lines",          font: "classic" },
  "diplomat":           { primary: "#c9a227", secondary: "#e8d48b", text: "#1a1a1a", bg: "#f5f0e1",  pattern: "none",           font: "elegant" },
  "heritage-crest":     { primary: "#8b1a2b", secondary: "#c4a882", text: "#f5f0e1", bg: "#1e0f14",  pattern: "none",           font: "classic" },
  "engraved":           { primary: "#64748b", secondary: "#94a3b8", text: "#e2e8f0", bg: "#1e293b",  pattern: "lines",          font: "elegant" },
  /* Creative & Trendy — vivid, expressive, playful */
  "diagonal-cut":       { primary: "#ff006e", secondary: "#8338ec", text: "#ffffff", bg: "#14213d",  pattern: "diagonal-lines", font: "bold"    },
  "layered-card":       { primary: "#06d6a0", secondary: "#118ab2", text: "#ffffff", bg: "#073b4c",  pattern: "none",           font: "modern"  },
  "photo-overlay":      { primary: "#f77f00", secondary: "#fcbf49", text: "#ffffff", bg: "#003049",  pattern: "none",           font: "bold"    },
  "dot-matrix":         { primary: "#ef476f", secondary: "#ffd166", text: "#ffffff", bg: "#073b4c",  pattern: "dots",           font: "modern"  },
  /* Luxury & Premium — opulent darks, metallic tones */
  "gold-foil":          { primary: "#d4af37", secondary: "#f4e5b2", text: "#f5f0e1", bg: "#1a1410",  pattern: "none",           font: "elegant" },
  "marble-luxe":        { primary: "#2d2d2d", secondary: "#9e9e9e", text: "#2d2d2d", bg: "#f5f0eb",  pattern: "none",           font: "elegant" },
  "velvet-noir":        { primary: "#9b1b30", secondary: "#c41e3a", text: "#e8d5b7", bg: "#0a0a0a",  pattern: "none",           font: "elegant" },
  "art-deco":           { primary: "#d4af37", secondary: "#b8860b", text: "#f5f0e1", bg: "#1a1a2e",  pattern: "diamond",        font: "elegant" },
};

/* -- Card Sizes (International Standards) ----------------------------- */

const CARD_SIZES: Record<string, { w: number; h: number; label: string; ratio: string; mmW: number; mmH: number }> = {
  standard: { w: 1050, h: 600,  label: "US Standard (3.5x2\")", ratio: "1050 / 600", mmW: 89, mmH: 51 },
  eu:       { w: 1012, h: 638,  label: "EU/ISO (85x54mm)",       ratio: "1012 / 638", mmW: 85, mmH: 54 },
  jp:       { w: 1087, h: 661,  label: "Japan (91x55mm)",        ratio: "1087 / 661", mmW: 91, mmH: 55 },
  square:   { w: 750,  h: 750,  label: "Square (2.5x2.5\")",     ratio: "1 / 1",      mmW: 63, mmH: 63 },
  rounded:  { w: 1050, h: 600,  label: "Rounded (3.5x2\")",      ratio: "1050 / 600", mmW: 89, mmH: 51 },
};

/* -- Print Constants -------------------------------------------------- */

const MM_PX = 300 / 25.4;
const BLEED_MM = 3;
const SAFE_MM = 5;

/* ====================================================================
   FONT SYSTEM - Industry-Standard Business Card Typography
   ==================================================================== */

function getFontFamily(style: CardConfig["fontStyle"]): string {
  switch (style) {
    case "classic":  return "'Georgia', 'Garamond', 'Times New Roman', serif";
    case "bold":     return "'Montserrat', 'Arial Black', 'Impact', sans-serif";
    case "elegant":  return "'Playfair Display', 'Didot', 'Bodoni MT', serif";
    case "minimal":  return "'Helvetica Neue', 'Helvetica', Arial, sans-serif";
    default:         return "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif";
  }
}

/** Scale factor for font sizes based on canvas width */
function fontScale(W: number): number {
  return W / 1050;
}

/**
 * Active CardConfig during a render pass. Set by renderCard/renderCardBack so that
 * getFontSizes and drawContactBlock pick up advanced-settings scales without needing
 * to thread the config through every helper function signature.
 */
let _renderCfg: CardConfig | null = null;

/** Professional font sizes (calculated for 1050px wide canvas = 300DPI) */
function getFontSizes(W: number, _H: number) {
  const s = fontScale(W);
  // Advanced-settings scale factors — read from global Zustand store
  const adv = getAdvancedSettings();
  return {
    name:        scaledFontSize(Math.round(36 * s), "heading", adv),  // ~12pt base
    title:       scaledFontSize(Math.round(24 * s), "body", adv),     // ~8pt
    company:     scaledFontSize(Math.round(22 * s), "body", adv),     // ~7.5pt
    companyLg:   scaledFontSize(Math.round(28 * s), "body", adv),     // ~9.5pt
    contact:     scaledFontSize(Math.round(21 * s), "label", adv),    // ~7pt base
    contactLg:   scaledFontSize(Math.round(23 * s), "label", adv),    // ~8pt base
    tagline:     scaledFontSize(Math.round(19 * s), "label", adv),    // ~6.5pt
    label:       scaledFontSize(Math.round(17 * s), "label", adv),    // ~6pt
    nameXl:      scaledFontSize(Math.round(42 * s), "heading", adv),  // ~14pt base
    titleLg:     scaledFontSize(Math.round(26 * s), "body", adv),     // ~9pt
  };
}

function getFont(weight: number, size: number, style: CardConfig["fontStyle"]): string {
  return `${weight} ${size}px ${getFontFamily(style)}`;
}

/* ====================================================================
   CONTACT ICON HELPERS
   ==================================================================== */

function drawContactIcon(
  ctx: CanvasRenderingContext2D,
  type: "email" | "phone" | "website" | "address",
  x: number, y: number, size: number, color: string
) {
  const iconMap: Record<string, string> = {
    email: "email",
    phone: "phone",
    website: "globe",
    address: "map-pin",
  };
  drawIcon(ctx, iconMap[type] || type, x, y, size, color);
}

function getContactEntries(c: CardConfig): Array<{ type: "email" | "phone" | "website" | "address"; value: string }> {
  const entries: Array<{ type: "email" | "phone" | "website" | "address"; value: string }> = [];
  if (c.phone)   entries.push({ type: "phone",   value: c.phone });
  if (c.email)   entries.push({ type: "email",   value: c.email });
  if (c.website) entries.push({ type: "website", value: c.website });
  if (c.address) entries.push({ type: "address", value: c.address });
  return entries;
}

/* ====================================================================
   LOGO DRAWING HELPER
   ==================================================================== */

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
    ctx.fillStyle = hexToRgba(color, 0.12);
    ctx.beginPath();
    ctx.arc(x + maxW / 2, y + maxH / 2, Math.min(maxW, maxH) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = color;
    const initSize = Math.round(Math.min(maxW, maxH) * 0.38);
    ctx.font = `700 ${initSize}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = fallbackText.split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
    ctx.fillText(initials, x + maxW / 2, y + maxH / 2);
    ctx.restore();
  }
}

/* ====================================================================
   CONTACT BLOCK RENDERER (with icons)
   ==================================================================== */

function drawContactBlock(
  ctx: CanvasRenderingContext2D, c: CardConfig,
  x: number, startY: number, gap: number, align: "left" | "right" | "center",
  textColor: string, iconColor: string, fontSize: number
) {
  const entries = getContactEntries(c);
  // Advanced-settings multipliers — read from global store
  const adv = getAdvancedSettings();
  const lineGap = scaledElementGap(gap, adv);

  ctx.font          = getFont(400, fontSize, c.fontStyle);
  ctx.textBaseline  = "middle"; // Align text visual center to the icon center (y)

  entries.forEach((entry, i) => {
    const y    = startY + i * lineGap;
    const textW = ctx.measureText(entry.value).width;

    if (c.showContactIcons) {
      // Icon slightly smaller than full font size (0.85×) for optical balance;
      // gap between icon-right-edge and text-left is ~0.35× fontSize
      const icoSize = scaledIconSize(Math.round(fontSize * 0.85), adv);
      const icoGap  = scaledIconGap(Math.round(fontSize * 0.35), adv);

      if (align === "center") {
        const totalW = icoSize + icoGap + textW;
        const startX = x - totalW / 2;
        drawContactIcon(ctx, entry.type, startX + icoSize / 2, y, icoSize, iconColor);
        ctx.fillStyle  = textColor;
        ctx.textAlign  = "left";
        ctx.fillText(entry.value, startX + icoSize + icoGap, y);
      } else if (align === "right") {
        // Text right-aligns to x; icon sits left of text with icoGap spacing
        ctx.fillStyle  = textColor;
        ctx.textAlign  = "right";
        ctx.fillText(entry.value, x, y);
        drawContactIcon(ctx, entry.type, x - textW - icoGap - icoSize / 2, y, icoSize, iconColor);
      } else {
        // Left-align
        drawContactIcon(ctx, entry.type, x + icoSize / 2, y, icoSize, iconColor);
        ctx.fillStyle  = textColor;
        ctx.textAlign  = "left";
        ctx.fillText(entry.value, x + icoSize + icoGap, y);
      }
    } else {
      ctx.fillStyle  = textColor;
      ctx.textAlign  = align;
      ctx.fillText(entry.value, x, y);
    }
  });
}

/* ====================================================================
   vNEXT RENDERER BRIDGE — Uses DesignDocumentV2 + layer-based rendering
   ==================================================================== */

/**
 * Renders a business card using the vNext layer-based engine.
 * Converts CardConfig → DesignDocumentV2 → Canvas render.
 * This is the M2 migration path; keeps identical visual output
 * while enabling AI to target individual layers.
 */
function renderCardV2(
  canvas: HTMLCanvasElement,
  config: CardConfig,
  logoImg?: HTMLImageElement | null,
  scale: number = 1,
  opts?: { showBleedSafe?: boolean }
) {
  const doc = cardConfigToDocument(
    config as unknown as CardConfigV2,
    { logoImg: logoImg ?? undefined }
  );

  const rootFrame = doc.layersById[doc.rootFrameId];
  if (!rootFrame) return;
  const W = rootFrame.transform.size.x;
  const H = rootFrame.transform.size.y;

  canvas.width = Math.round(W * scale);
  canvas.height = Math.round(H * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  applyCanvasSettings(ctx);

  renderDocumentV2(ctx, doc, {
    scaleFactor: scale,
    showBleedSafe: opts?.showBleedSafe ?? false,
  });
}

/* ====================================================================
   20 PROFESSIONAL TEMPLATE RENDERERS (Legacy — kept for reference)
   ==================================================================== */

function renderCard(canvas: HTMLCanvasElement, config: CardConfig, logoImg?: HTMLImageElement | null, scale: number = 1) {
  // Make config accessible to getFontSizes, drawContactBlock, and other helpers
  _renderCfg = config;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const size = config.cardStyle === "custom"
    ? { w: Math.round(config.customWidthMm * MM_PX), h: Math.round(config.customHeightMm * MM_PX) }
    : (CARD_SIZES[config.cardStyle] || CARD_SIZES.standard);
  const W = size.w;
  const H = size.h;
  canvas.width = W * scale;
  canvas.height = H * scale;
  if (scale !== 1) ctx.scale(scale, scale);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  applyCanvasSettings(ctx); // global text rendering / smoothing prefs

  // Clip for rounded card style
  if (config.cardStyle === "rounded") {
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 24);
    ctx.clip();
  }

  // Background
  ctx.fillStyle = config.bgColor;
  ctx.fillRect(0, 0, W, H);

  // Optional pattern overlay — opacity driven by global advanced settings
  if (config.patternType && config.patternType !== "none") {
    drawPattern(ctx, 0, 0, W, H, config.patternType as Parameters<typeof drawPattern>[5], config.primaryColor, getPatternOpacity(0.06), 28);
  }

  if (config.side === "back") {
    renderCardBack(ctx, W, H, config, logoImg);
    return;
  }

  // Dispatch to template renderer
  const renderer = TEMPLATE_RENDERERS[config.template];
  if (renderer) {
    renderer(ctx, W, H, config, logoImg);
  } else {
    TEMPLATE_RENDERERS["executive-clean"](ctx, W, H, config, logoImg);
  }
}

/* -- Template renderer map -------------------------------------------- */

const TEMPLATE_RENDERERS: Record<string, (ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logo?: HTMLImageElement | null) => void> = {

  /* ==== 1. EXECUTIVE CLEAN - Ultra-minimal, generous whitespace ==== */
  "executive-clean": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.1;
    const my = H * 0.15;

    // Subtle warm gradient wash across card
    const warmGrad = ctx.createLinearGradient(0, 0, W, H);
    warmGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.02));
    warmGrad.addColorStop(0.5, "transparent");
    warmGrad.addColorStop(1, hexToRgba(c.secondaryColor, 0.015));
    ctx.fillStyle = warmGrad;
    ctx.fillRect(0, 0, W, H);

    // Elegant corner accent (top-right)
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.1);
    ctx.lineWidth = 0.75;
    ctx.beginPath();
    ctx.moveTo(W - mx, my * 0.5);
    ctx.lineTo(W - mx, my * 0.5);
    ctx.lineTo(W - mx + 1, my * 0.5);
    ctx.stroke();

    // Refined accent bar at bottom
    const barGrad = ctx.createLinearGradient(mx, 0, mx + W * 0.15, 0);
    barGrad.addColorStop(0, c.primaryColor);
    barGrad.addColorStop(1, hexToRgba(c.primaryColor, 0.1));
    ctx.fillStyle = barGrad;
    ctx.fillRect(mx, H - my, W * 0.15, 2.5);

    // Secondary accent dot
    ctx.fillStyle = hexToRgba(c.secondaryColor, 0.3);
    ctx.beginPath();
    ctx.arc(mx + W * 0.17, H - my + 1.25, 2, 0, Math.PI * 2);
    ctx.fill();

    // Name
    ctx.font = getFont(600, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    ctx.fillText(c.name || "Your Name", mx, my + f.name);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.6);
    ctx.fillText(c.title || "Job Title", mx, my + f.name + f.title + 8);

    // Company (right-aligned top)
    if (c.company) {
      ctx.font = getFont(500, f.company, c.fontStyle);
      ctx.fillStyle = c.primaryColor;
      ctx.textAlign = "right";
      ctx.fillText(c.company, W - mx, my + f.company);
    }

    // Logo (right top)
    const logoS = H * 0.18;
    drawLogo(ctx, logo, W - mx - logoS, my + f.company + 8, logoS, logoS, c.company || "", c.primaryColor);

    // Elegant gradient separator
    const sepGrad = ctx.createLinearGradient(mx, 0, W - mx, 0);
    sepGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.25));
    sepGrad.addColorStop(0.3, hexToRgba(c.primaryColor, 0.08));
    sepGrad.addColorStop(1, "transparent");
    ctx.fillStyle = sepGrad;
    ctx.fillRect(mx, H * 0.54, W - mx * 2, 1);

    // Contact block
    drawContactBlock(ctx, c, mx, H * 0.62, Math.round(f.contact * 1.5), "left",
      hexToRgba(c.textColor, 0.65), hexToRgba(c.primaryColor, 0.5), f.contact);

    // Tagline
    if (c.tagline) {
      ctx.font = getFont(300, f.tagline, c.fontStyle);
      ctx.fillStyle = hexToRgba(c.textColor, 0.35);
      ctx.textAlign = "right";
      ctx.fillText(c.tagline, W - mx, H - my - 4);
    }
  },

  /* ==== 2. SWISS GRID - Strict grid-based Swiss design ==== */
  "swiss-grid": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.08;

    // Grid lines (very subtle)
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.06);
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 6; i++) {
      const x = mx + (W - mx * 2) * (i / 6);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let i = 1; i < 4; i++) {
      const y = H * (i / 4);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Primary accent rectangle
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(0, 0, W * 0.04, H);

    // Name - bold, uppercase
    ctx.font = getFont(800, f.nameXl, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    const nameText = (c.name || "YOUR NAME").toUpperCase();
    ctx.fillText(nameText, mx + W * 0.04, H * 0.35);

    // Title - light weight
    ctx.font = getFont(300, f.titleLg, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.55);
    ctx.fillText(c.title || "Job Title", mx + W * 0.04, H * 0.35 + f.titleLg + 10);

    // Company at bottom-left
    ctx.font = getFont(600, f.company, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText((c.company || "").toUpperCase(), mx + W * 0.04, H * 0.88);

    // Logo (bottom right)
    const logoS = H * 0.16;
    drawLogo(ctx, logo, W - mx - logoS, H - H * 0.12 - logoS, logoS, logoS, c.company || "", c.primaryColor);

    // Contact - right column
    const contactX = W * 0.58;
    drawContactBlock(ctx, c, contactX, H * 0.55, Math.round(f.contact * 1.55), "left",
      hexToRgba(c.textColor, 0.6), hexToRgba(c.primaryColor, 0.45), f.contact);
  },

  /* ==== 3. MONO TYPE - Pure typography, zero decoration ==== */
  "mono-type": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.1;

    // Name - very large, light weight
    ctx.font = getFont(200, Math.round(f.nameXl * 1.1), c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    ctx.fillText(c.name || "Your Name", mx, H * 0.38);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.38 + f.title + 12);

    // Small separator dot
    ctx.fillStyle = c.primaryColor;
    ctx.beginPath();
    ctx.arc(mx + 4, H * 0.56, 3, 0, Math.PI * 2);
    ctx.fill();

    // Contact - compact
    const entries = getContactEntries(c);
    ctx.font = getFont(400, f.contact, c.fontStyle);
    ctx.textAlign = "left";
    entries.forEach((entry, i) => {
      const y = H * 0.64 + i * Math.round(f.contact * 1.5);
      ctx.fillStyle = hexToRgba(c.textColor, 0.5);
      ctx.fillText(entry.value, mx, y);
    });

    // Company - bottom right
    ctx.font = getFont(600, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.3);
    ctx.textAlign = "right";
    ctx.fillText((c.company || "").toUpperCase(), W - mx, H * 0.9);

    // Logo
    const logoS = H * 0.14;
    drawLogo(ctx, logo, W - mx - logoS, H * 0.12, logoS, logoS, c.company || "", c.primaryColor);
  },

  /* ==== 4. NORDIC FROST - Clean Scandinavian ==== */
  "nordic-frost": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.1;

    // Subtle frost gradient top
    const frostGrad = ctx.createLinearGradient(0, 0, 0, H * 0.3);
    frostGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.04));
    frostGrad.addColorStop(1, "transparent");
    ctx.fillStyle = frostGrad;
    ctx.fillRect(0, 0, W, H * 0.3);

    // Logo top-left
    const logoS = H * 0.18;
    drawLogo(ctx, logo, mx, H * 0.12, logoS, logoS, c.company || "", c.primaryColor, "circle");

    // Company next to logo
    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.textAlign = "left";
    ctx.fillText((c.company || "").toUpperCase(), mx + logoS + 12, H * 0.12 + logoS / 2 + f.company * 0.3);

    // Name
    ctx.font = getFont(600, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.fillText(c.name || "Your Name", mx, H * 0.52);

    // Title
    ctx.font = getFont(300, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.5);
    ctx.fillText(c.title || "Job Title", mx, H * 0.52 + f.title + 8);

    // Accent line
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(mx, H * 0.68, W * 0.06, 2);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.76, Math.round(f.contact * 1.45), "left",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.4), f.contact);
  },

  /* ==== 5. BOLD SPLIT - Color-blocked split panel ==== */
  "bold-split": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const splitX = W * 0.42;

    // Left gradient panel with rich depth
    const panelGrad = ctx.createLinearGradient(0, 0, splitX, H);
    panelGrad.addColorStop(0, c.primaryColor);
    panelGrad.addColorStop(0.6, hexToRgba(c.secondaryColor, 0.85));
    panelGrad.addColorStop(1, hexToRgba(c.primaryColor, 0.7));
    ctx.fillStyle = panelGrad;
    ctx.fillRect(0, 0, splitX, H);

    // Subtle pattern on left panel
    drawPattern(ctx, 0, 0, splitX, H, "dots", getContrastColor(c.primaryColor), 0.04, 24);

    // Decorative diagonal line on split boundary
    ctx.save();
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.1);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(splitX + 4, 0);
    ctx.lineTo(splitX + 4, H);
    ctx.stroke();
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.05);
    ctx.beginPath();
    ctx.moveTo(splitX + 10, 0);
    ctx.lineTo(splitX + 10, H);
    ctx.stroke();
    ctx.restore();

    // Subtle accent circles on right side
    drawAccentCircle(ctx, W * 0.92, H * 0.08, W * 0.06, c.primaryColor, 0.04);
    drawAccentCircle(ctx, W * 0.95, H * 0.92, W * 0.04, c.secondaryColor, 0.03);

    const contrastC = getContrastColor(c.primaryColor);
    const mx = splitX * 0.14;

    // Logo on left panel
    const logoS = splitX * 0.22;
    drawLogo(ctx, logo, mx, H * 0.1, logoS, logoS, c.company || "", contrastC, "circle");

    // Name on left panel
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = contrastC;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.48, { shadowBlur: 4, shadowColor: "rgba(0,0,0,0.2)" });

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(contrastC, 0.7);
    ctx.fillText(c.title || "Job Title", mx, H * 0.48 + f.title + 8);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(contrastC, 0.4);
    ctx.fillText((c.company || "").toUpperCase(), mx, H * 0.9);

    // Right panel - contact details
    const rx = splitX + (W - splitX) * 0.1;
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.3);
    ctx.textAlign = "left";
    ctx.fillText("CONTACT", rx, H * 0.18);

    drawDivider(ctx, rx, H * 0.23, W * 0.08, "gradient", c.primaryColor, 0.5);

    drawContactBlock(ctx, c, rx, H * 0.35, Math.round(f.contactLg * 1.6), "left",
      hexToRgba(c.textColor, 0.65), hexToRgba(c.primaryColor, 0.45), f.contactLg);

    // Subtle tagline on right bottom
    if (c.tagline) {
      ctx.font = getFont(300, f.tagline, c.fontStyle);
      ctx.fillStyle = hexToRgba(c.textColor, 0.25);
      ctx.textAlign = "left";
      ctx.fillText(c.tagline, rx, H * 0.92);
    }
  },

  /* ==== 6. NEON EDGE - Glowing accent edge ==== */
  "neon-edge": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.09;

    // Neon left edge with multi-layered glow
    const neonW = 6;
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(0, 0, neonW, H);

    // Triple glow layers
    for (let i = 0; i < 3; i++) {
      const glowW = 15 + i * 25;
      const glowGrad = ctx.createLinearGradient(neonW, 0, neonW + glowW, 0);
      glowGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.12 - i * 0.035));
      glowGrad.addColorStop(1, "transparent");
      ctx.fillStyle = glowGrad;
      ctx.fillRect(neonW, 0, glowW, H);
    }

    // Neon bottom accent with glow
    ctx.fillStyle = c.secondaryColor;
    ctx.fillRect(W * 0.6, H - 3, W * 0.4, 3);
    const glowBottom = ctx.createLinearGradient(0, H - 40, 0, H - 3);
    glowBottom.addColorStop(0, "transparent");
    glowBottom.addColorStop(1, hexToRgba(c.secondaryColor, 0.1));
    ctx.fillStyle = glowBottom;
    ctx.fillRect(W * 0.55, H - 40, W * 0.45, 37);

    // Subtle corner glow (top-right)
    const cornerGlow = ctx.createRadialGradient(W, 0, 0, W, 0, W * 0.25);
    cornerGlow.addColorStop(0, hexToRgba(c.secondaryColor, 0.04));
    cornerGlow.addColorStop(1, "transparent");
    ctx.fillStyle = cornerGlow;
    ctx.fillRect(W * 0.7, 0, W * 0.3, H * 0.35);

    // Decorative scan lines
    ctx.save();
    ctx.globalAlpha = 0.015;
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = c.textColor;
      ctx.fillRect(0, y, W, 1);
    }
    ctx.restore();

    // Name with neon glow
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.28, { shadowBlur: 8, shadowColor: hexToRgba(c.primaryColor, 0.35) });

    // Title + Company inline
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.28 + f.title + 8);

    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.fillText(c.company || "", mx, H * 0.28 + f.title + f.company + 18);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.62, Math.round(f.contact * 1.5), "left",
      hexToRgba(c.textColor, 0.6), hexToRgba(c.primaryColor, 0.5), f.contact);

    // Logo right with glow
    const logoS = H * 0.2;
    drawLogo(ctx, logo, W - mx - logoS, H * 0.12, logoS, logoS, c.company || "", c.primaryColor, "square");

    // Logo glow effect
    const logoGlow = ctx.createRadialGradient(W - mx - logoS / 2, H * 0.12 + logoS / 2, logoS * 0.3, W - mx - logoS / 2, H * 0.12 + logoS / 2, logoS);
    logoGlow.addColorStop(0, hexToRgba(c.primaryColor, 0.06));
    logoGlow.addColorStop(1, "transparent");
    ctx.fillStyle = logoGlow;
    ctx.fillRect(W - mx - logoS * 1.5, H * 0.12 - logoS * 0.3, logoS * 2, logoS * 1.6);
  },

  /* ==== 7. GEOMETRIC MODERN - Bold geometric shapes ==== */
  "geometric-modern": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Large geometric circle (top-right bleed)
    drawAccentCircle(ctx, W * 0.88, H * -0.15, W * 0.28, c.primaryColor, 0.08);
    drawAccentCircle(ctx, W * 0.94, H * 0.12, W * 0.14, c.secondaryColor, 0.06);

    // Bottom-left small circle
    drawAccentCircle(ctx, W * -0.04, H * 1.08, W * 0.16, c.primaryColor, 0.05);

    // Corner frame accent
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.12);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W * 0.06, H * 0.22);
    ctx.lineTo(W * 0.06, H * 0.06);
    ctx.lineTo(W * 0.22, H * 0.06);
    ctx.stroke();

    const mx = W * 0.09;

    // Logo
    const logoS = H * 0.18;
    drawLogo(ctx, logo, mx, H * 0.1, logoS, logoS, c.company || "", c.primaryColor);

    // Name - large bold
    ctx.font = getFont(800, f.nameXl, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.48);

    // Title badge
    ctx.font = getFont(500, f.title, c.fontStyle);
    const titleText = c.title || "Job Title";
    const tw = ctx.measureText(titleText).width + 18;
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.1);
    roundRect(ctx, mx, H * 0.54, tw, Math.round(f.title * 1.6), Math.round(f.title * 0.8));
    ctx.fill();
    ctx.fillStyle = c.primaryColor;
    ctx.textAlign = "left";
    ctx.fillText(titleText, mx + 9, H * 0.54 + f.title + 2);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.35);
    ctx.fillText((c.company || "").toUpperCase(), mx, H * 0.75);

    // Contact (right column)
    drawContactBlock(ctx, c, W * 0.56, H * 0.35, Math.round(f.contact * 1.5), "left",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.4), f.contact);

    // Bottom-right corner frame
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.12);
    ctx.beginPath();
    ctx.moveTo(W * 0.78, H * 0.94);
    ctx.lineTo(W * 0.94, H * 0.94);
    ctx.lineTo(W * 0.94, H * 0.78);
    ctx.stroke();
  },

  /* ==== 8. GRADIENT WAVE - Flowing gradient accent ==== */
  "gradient-wave": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.09;

    // Gradient wave at bottom
    ctx.save();
    const waveGrad = ctx.createLinearGradient(0, H * 0.7, W, H);
    waveGrad.addColorStop(0, c.primaryColor);
    waveGrad.addColorStop(1, c.secondaryColor);
    ctx.fillStyle = waveGrad;
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(W, H);
    ctx.lineTo(W, H * 0.78);
    ctx.quadraticCurveTo(W * 0.75, H * 0.7, W * 0.5, H * 0.8);
    ctx.quadraticCurveTo(W * 0.25, H * 0.9, 0, H * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Logo
    const logoS = H * 0.18;
    drawLogo(ctx, logo, mx, H * 0.1, logoS, logoS, c.company || "", c.primaryColor, "circle");

    // Company next to logo
    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.textAlign = "left";
    ctx.fillText(c.company || "Company", mx + logoS + 10, H * 0.1 + logoS / 2 + 4);

    // Name
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.fillText(c.name || "Your Name", mx, H * 0.44);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.44 + f.title + 8);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.58, Math.round(f.contact * 1.4), "left",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.4), f.contact);

    // Company on wave (contrast text)
    const waveContrast = getContrastColor(c.primaryColor);
    ctx.font = getFont(700, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(waveContrast, 0.6);
    ctx.textAlign = "right";
    ctx.fillText((c.company || "").toUpperCase(), W - mx, H * 0.92);
  },

  /* ==== 9. CORPORATE STRIPE - Professional side stripe ==== */
  "corporate-stripe": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Left accent stripe with gradient
    const stripeW = 10;
    const stripeGrad = ctx.createLinearGradient(0, 0, 0, H);
    stripeGrad.addColorStop(0, c.primaryColor);
    stripeGrad.addColorStop(1, c.secondaryColor);
    ctx.fillStyle = stripeGrad;
    ctx.fillRect(0, 0, stripeW, H);

    // Glow
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.06);
    ctx.fillRect(stripeW, 0, 4, H);

    const mx = W * 0.06;

    // Logo top-right
    const logoS = H * 0.2;
    drawLogo(ctx, logo, W - mx - logoS, H * 0.1, logoS, logoS, c.company || "", c.primaryColor);

    // Name
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.3);

    // Title + Company
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.3 + f.title + 8);

    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.fillText(c.company || "Company", mx, H * 0.3 + f.title + f.company + 18);

    // Divider
    drawDivider(ctx, mx, H * 0.58, W * 0.88, "gradient", c.primaryColor, 0.15);

    // Contact - horizontal layout
    const entries = getContactEntries(c);
    ctx.font = getFont(400, f.contact, c.fontStyle);
    ctx.textBaseline = "middle"; // keep icon center and text center on the same y
    let detailX = mx;
    entries.forEach((entry, idx) => {
      const contactY = H * 0.72;
      if (c.showContactIcons) {
        const iconSz = scaledIconSize(Math.round(f.contact + 2));
        drawContactIcon(ctx, entry.type, detailX + iconSz / 2, contactY, iconSz, hexToRgba(c.primaryColor, 0.4));
        detailX += iconSz + Math.round(f.contact * 0.3);
      }
      ctx.fillStyle = hexToRgba(c.textColor, 0.55);
      ctx.textAlign = "left";
      const textW = ctx.measureText(entry.value).width;
      ctx.fillText(entry.value, detailX, contactY);
      detailX += textW + 16;
      // Separator dot — vertically centred with text
      if (idx < entries.length - 1 && detailX < W * 0.9) {
        ctx.fillStyle = hexToRgba(c.primaryColor, 0.25);
        ctx.beginPath();
        ctx.arc(detailX - 7, contactY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  },

  /* ==== 10. DIPLOMAT - Distinguished double border ==== */
  "diplomat": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Outer border
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.4);
    ctx.lineWidth = 2;
    roundRect(ctx, 14, 14, W - 28, H - 28, 3);
    ctx.stroke();

    // Inner border
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.15);
    ctx.lineWidth = 0.5;
    roundRect(ctx, 20, 20, W - 40, H - 40, 2);
    ctx.stroke();

    // Corner ornaments
    const corners: number[][] = [[24, 24], [W - 24, 24], [24, H - 24], [W - 24, H - 24]];
    corners.forEach(([cx, cy]) => {
      ctx.fillStyle = c.primaryColor;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Centered logo
    const logoS = H * 0.17;
    drawLogo(ctx, logo, W / 2 - logoS / 2, H * 0.08, logoS, logoS, c.company || "", c.primaryColor, "circle");

    // Name - centered
    ctx.font = getFont(600, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "center";
    drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.42);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.55);
    ctx.fillText(c.title || "Job Title", W / 2, H * 0.42 + f.title + 8);

    // Ornate divider
    drawDivider(ctx, W * 0.3, H * 0.56, W * 0.4, "ornate", c.primaryColor, 0.35);

    // Contact - centered
    drawContactBlock(ctx, c, W / 2, H * 0.66, Math.round(f.contact * 1.45), "center",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.35), f.contact);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.45);
    ctx.textAlign = "center";
    ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.92);
  },

  /* ==== 11. HERITAGE CREST - Traditional centered ==== */
  "heritage-crest": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Top gradient line
    const topGrad = ctx.createLinearGradient(W * 0.2, 0, W * 0.8, 0);
    topGrad.addColorStop(0, "transparent");
    topGrad.addColorStop(0.3, c.primaryColor);
    topGrad.addColorStop(0.7, c.primaryColor);
    topGrad.addColorStop(1, "transparent");
    ctx.fillStyle = topGrad;
    ctx.fillRect(W * 0.2, H * 0.06, W * 0.6, 2.5);

    // Logo - centered, larger
    const logoS = H * 0.2;
    drawLogo(ctx, logo, W / 2 - logoS / 2, H * 0.1, logoS, logoS, c.company || "", c.primaryColor, "circle");

    // Name
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "center";
    drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.44);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", W / 2, H * 0.44 + f.title + 8);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.35);
    ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.44 + f.title + f.label + 22);

    // Ornate divider
    drawDivider(ctx, W * 0.28, H * 0.62, W * 0.44, "ornate", c.primaryColor, 0.3);

    // Contact - centered
    drawContactBlock(ctx, c, W / 2, H * 0.72, Math.round(f.contact * 1.45), "center",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.35), f.contact);

    // Bottom gradient line
    ctx.fillStyle = topGrad;
    ctx.fillRect(W * 0.2, H * 0.94, W * 0.6, 2.5);
  },

  /* ==== 12. ENGRAVED - Subtle engraved style ==== */
  "engraved": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Subtle emboss background
    const embossGrad = ctx.createLinearGradient(0, 0, W, H);
    embossGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.02));
    embossGrad.addColorStop(0.5, "transparent");
    embossGrad.addColorStop(1, hexToRgba(c.primaryColor, 0.02));
    ctx.fillStyle = embossGrad;
    ctx.fillRect(0, 0, W, H);

    // Fine horizontal lines as texture
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.03);
    ctx.lineWidth = 0.5;
    for (let y = 0; y < H; y += 8) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    // Logo - top center
    const logoS = H * 0.16;
    drawLogo(ctx, logo, W / 2 - logoS / 2, H * 0.08, logoS, logoS, c.company || "", c.primaryColor);

    // Company below logo
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.45);
    ctx.textAlign = "center";
    ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.08 + logoS + f.label + 4);

    // Thin line
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.12);
    ctx.fillRect(W * 0.35, H * 0.38, W * 0.3, 1);

    // Name
    ctx.font = getFont(500, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "center";
    ctx.fillText(c.name || "Your Name", W / 2, H * 0.52);

    // Title
    ctx.font = getFont(300, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.5);
    ctx.fillText(c.title || "Job Title", W / 2, H * 0.52 + f.title + 8);

    // Contact at bottom
    drawContactBlock(ctx, c, W / 2, H * 0.72, Math.round(f.contact * 1.4), "center",
      hexToRgba(c.textColor, 0.5), hexToRgba(c.primaryColor, 0.3), f.contact);
  },

  /* ==== 13. DIAGONAL CUT - Angular diagonal division ==== */
  "diagonal-cut": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Diagonal gradient block (right portion)
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(W * 0.52, 0);
    ctx.lineTo(W, 0);
    ctx.lineTo(W, H);
    ctx.lineTo(W * 0.32, H);
    ctx.closePath();
    const diagGrad = ctx.createLinearGradient(W * 0.4, 0, W, H);
    diagGrad.addColorStop(0, c.primaryColor);
    diagGrad.addColorStop(1, c.secondaryColor);
    ctx.fillStyle = diagGrad;
    ctx.fill();
    ctx.clip();
    drawPattern(ctx, 0, 0, W, H, "diagonal-lines", getContrastColor(c.primaryColor), 0.04, 20);
    ctx.restore();

    const mx = W * 0.08;
    const contrastC = getContrastColor(c.primaryColor);

    // Name (left side)
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.32);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.55);
    ctx.fillText(c.title || "Job Title", mx, H * 0.32 + f.title + 8);

    // Logo
    const logoS = H * 0.16;
    drawLogo(ctx, logo, mx, H * 0.55, logoS, logoS, c.company || "", c.primaryColor, "circle");

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.35);
    ctx.fillText((c.company || "").toUpperCase(), mx + logoS + 10, H * 0.55 + logoS / 2 + 4);

    // Contact on diagonal (right side)
    drawContactBlock(ctx, c, W - mx, H * 0.3, Math.round(f.contact * 1.5), "right",
      hexToRgba(contrastC, 0.85), hexToRgba(contrastC, 0.5), f.contact);
  },

  /* ==== 14. LAYERED CARD - Floating panel effect ==== */
  "layered-card": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Background gradient
    drawGradient(ctx, 0, 0, W, H, 135, [
      { offset: 0, color: c.bgColor },
      { offset: 1, color: hexToRgba(c.primaryColor, 0.05) },
    ]);

    // Floating card panel with shadow
    ctx.save();
    ctx.shadowColor = hexToRgba(c.primaryColor, 0.12);
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.fillStyle = hexToRgba(c.bgColor, 0.96);
    roundRect(ctx, W * 0.06, H * 0.1, W * 0.88, H * 0.8, 14);
    ctx.fill();
    ctx.restore();

    // Border
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.1);
    ctx.lineWidth = 1;
    roundRect(ctx, W * 0.06, H * 0.1, W * 0.88, H * 0.8, 14);
    ctx.stroke();

    // Top accent bar
    ctx.fillStyle = c.primaryColor;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(W * 0.06, H * 0.1, W * 0.88, 4, [14, 14, 0, 0]);
    ctx.fill();
    ctx.restore();

    const mx = W * 0.12;

    // Logo
    const logoS = H * 0.16;
    drawLogo(ctx, logo, mx, H * 0.19, logoS, logoS, c.company || "", c.primaryColor, "square");

    // Name
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx + logoS + 14, H * 0.28);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx + logoS + 14, H * 0.28 + f.title + 6);

    // Company
    ctx.font = getFont(500, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.35);
    ctx.fillText((c.company || "").toUpperCase(), mx + logoS + 14, H * 0.28 + f.title + f.label + 16);

    // Divider
    drawDivider(ctx, mx, H * 0.54, W * 0.76, "gradient", c.primaryColor, 0.15);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.63, Math.round(f.contact * 1.45), "left",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.35), f.contact);
  },

  /* ==== 15. PHOTO OVERLAY - Image-based with overlay ==== */
  "photo-overlay": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Right 40% photo/brand area
    const photoX = W * 0.6;
    if (logo && logo.complete && logo.naturalWidth > 0) {
      drawImageCover(ctx, logo, photoX, 0, W - photoX, H);
      ctx.fillStyle = hexToRgba("#000000", 0.25);
      ctx.fillRect(photoX, 0, W - photoX, H);
    } else {
      const phGrad = ctx.createLinearGradient(photoX, 0, W, H);
      phGrad.addColorStop(0, c.primaryColor);
      phGrad.addColorStop(1, c.secondaryColor);
      ctx.fillStyle = phGrad;
      ctx.fillRect(photoX, 0, W - photoX, H);
      drawPattern(ctx, photoX, 0, W - photoX, H, "hexagons", getContrastColor(c.primaryColor), 0.05, 30);
      drawImagePlaceholder(ctx, photoX + 24, H * 0.25, W - photoX - 48, H * 0.5, getContrastColor(c.primaryColor), "Add Logo / Photo", 0);
    }

    // Left content
    const mx = W * 0.07;

    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.28);

    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.28 + f.title + 8);

    ctx.font = getFont(500, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.35);
    ctx.fillText((c.company || "").toUpperCase(), mx, H * 0.28 + f.title + f.label + 20);

    drawDivider(ctx, mx, H * 0.52, W * 0.38, "gradient", c.primaryColor, 0.2);

    drawContactBlock(ctx, c, mx, H * 0.6, Math.round(f.contact * 1.45), "left",
      hexToRgba(c.textColor, 0.6), hexToRgba(c.primaryColor, 0.4), f.contact);
  },

  /* ==== 16. DOT MATRIX - Halftone pattern accent ==== */
  "dot-matrix": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);
    const mx = W * 0.09;

    // Halftone dot field (top right corner)
    ctx.save();
    const dotField = W * 0.35;
    for (let dx = 0; dx < dotField; dx += 12) {
      for (let dy = 0; dy < H * 0.4; dy += 12) {
        const distX = dx / dotField;
        const distY = dy / (H * 0.4);
        const opacity = Math.max(0, 0.15 - (distX + distY) * 0.08);
        const radius = Math.max(0.5, 3 - (distX + distY) * 2);
        ctx.fillStyle = hexToRgba(c.primaryColor, opacity);
        ctx.beginPath();
        ctx.arc(W - dotField + dx, dy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    // Logo
    const logoS = H * 0.18;
    drawLogo(ctx, logo, mx, H * 0.1, logoS, logoS, c.company || "", c.primaryColor, "square");

    // Name
    ctx.font = getFont(700, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.45);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.45 + f.title + 8);

    // Company
    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.fillText(c.company || "Company", mx, H * 0.45 + f.title + f.company + 18);

    // Accent line
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(mx, H * 0.68, W * 0.08, 2);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.76, Math.round(f.contact * 1.4), "left",
      hexToRgba(c.textColor, 0.55), hexToRgba(c.primaryColor, 0.4), f.contact);
  },

  /* ==== 17. GOLD FOIL - Metallic gold accents ==== */
  "gold-foil": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Gold accent colors
    const gold1 = "#c9a227";
    const gold2 = "#e8d48b";
    const goldDark = "#8a6d1b";

    // Fine gold border
    ctx.strokeStyle = gold1;
    ctx.lineWidth = 1.5;
    roundRect(ctx, 16, 16, W - 32, H - 32, 2);
    ctx.stroke();

    // Gold corner elements
    const cLen = 20;
    ([[20, 20, 1, 1], [W - 20, 20, -1, 1], [20, H - 20, 1, -1], [W - 20, H - 20, -1, -1]] as const).forEach(([cx, cy, dx, dy]) => {
      ctx.strokeStyle = gold2;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, cy + dy * cLen);
      ctx.lineTo(cx, cy);
      ctx.lineTo(cx + dx * cLen, cy);
      ctx.stroke();
    });

    // Logo centered
    const logoS = H * 0.18;
    drawLogo(ctx, logo, W / 2 - logoS / 2, H * 0.08, logoS, logoS, c.company || "", gold1, "circle");

    // Name with gold shadow
    ctx.font = getFont(600, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "center";
    drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.42, { shadowBlur: 4, shadowColor: hexToRgba(gold1, 0.2) });

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = gold1;
    ctx.fillText(c.title || "Job Title", W / 2, H * 0.42 + f.title + 8);

    // Gold divider
    const divGrad = ctx.createLinearGradient(W * 0.25, 0, W * 0.75, 0);
    divGrad.addColorStop(0, "transparent");
    divGrad.addColorStop(0.2, goldDark);
    divGrad.addColorStop(0.5, gold2);
    divGrad.addColorStop(0.8, goldDark);
    divGrad.addColorStop(1, "transparent");
    ctx.fillStyle = divGrad;
    ctx.fillRect(W * 0.25, H * 0.56, W * 0.5, 1.5);

    // Contact
    drawContactBlock(ctx, c, W / 2, H * 0.65, Math.round(f.contact * 1.45), "center",
      hexToRgba(c.textColor, 0.55), hexToRgba(gold1, 0.4), f.contact);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(gold1, 0.5);
    ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.93);
  },

  /* ==== 18. MARBLE LUXE - Marble texture effect ==== */
  "marble-luxe": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Simulate marble veins with subtle lines
    ctx.save();
    ctx.globalAlpha = 0.03;
    for (let i = 0; i < 30; i++) {
      const y = (H * i / 30) + Math.sin(i * 0.5) * 20;
      ctx.strokeStyle = hexToRgba(c.primaryColor, 0.5);
      ctx.lineWidth = 0.5 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < W; x += 20) {
        ctx.lineTo(x, y + Math.sin(x * 0.01 + i) * 8);
      }
      ctx.stroke();
    }
    ctx.restore();

    const mx = W * 0.1;

    // Logo with subtle shadow
    const logoS = H * 0.18;
    drawLogo(ctx, logo, mx, H * 0.1, logoS, logoS, c.company || "", c.primaryColor);

    // Company
    ctx.font = getFont(600, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.4);
    ctx.textAlign = "left";
    ctx.fillText((c.company || "").toUpperCase(), mx + logoS + 12, H * 0.1 + logoS / 2 + 4);

    // Thin gold line
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.3);
    ctx.fillRect(mx, H * 0.38, W - mx * 2, 1);

    // Name
    ctx.font = getFont(500, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    ctx.fillText(c.name || "Your Name", mx, H * 0.52);

    // Title
    ctx.font = getFont(300, f.title, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.5);
    ctx.fillText(c.title || "Job Title", mx, H * 0.52 + f.title + 8);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.7, Math.round(f.contact * 1.4), "left",
      hexToRgba(c.textColor, 0.5), hexToRgba(c.primaryColor, 0.3), f.contact);
  },

  /* ==== 19. VELVET NOIR - Deep dark luxury ==== */
  "velvet-noir": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Deep gradient overlay
    const deepGrad = ctx.createLinearGradient(0, 0, W, H);
    deepGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.04));
    deepGrad.addColorStop(0.5, "transparent");
    deepGrad.addColorStop(1, hexToRgba(c.secondaryColor, 0.03));
    ctx.fillStyle = deepGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle radial glow behind name
    const glowGrad = ctx.createRadialGradient(W * 0.3, H * 0.4, 0, W * 0.3, H * 0.4, W * 0.4);
    glowGrad.addColorStop(0, hexToRgba(c.primaryColor, 0.04));
    glowGrad.addColorStop(1, "transparent");
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, W, H);

    const mx = W * 0.1;

    // Name - large, bold
    ctx.font = getFont(700, f.nameXl, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "left";
    drawTextWithShadow(ctx, c.name || "Your Name", mx, H * 0.36, { shadowBlur: 10, shadowColor: hexToRgba(c.primaryColor, 0.15) });

    // Title with accent
    ctx.font = getFont(400, f.titleLg, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", mx, H * 0.36 + f.titleLg + 10);

    // Company
    ctx.font = getFont(500, f.company, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.textColor, 0.3);
    ctx.fillText(c.company || "Company", mx, H * 0.36 + f.titleLg + f.company + 22);

    // Fine accent line
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(mx, H * 0.66, W * 0.04, 2);

    // Contact
    drawContactBlock(ctx, c, mx, H * 0.74, Math.round(f.contact * 1.45), "left",
      hexToRgba(c.textColor, 0.45), hexToRgba(c.primaryColor, 0.3), f.contact);

    // Logo - right side
    const logoS = H * 0.2;
    drawLogo(ctx, logo, W - mx - logoS, H * 0.12, logoS, logoS, c.company || "", c.primaryColor, "circle");
  },

  /* ==== 20. ART DECO - 1920s geometric luxury ==== */
  "art-deco": (ctx, W, H, c, logo) => {
    const f = getFontSizes(W, H);

    // Art deco frame
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.4);
    ctx.lineWidth = 2;
    ctx.strokeRect(16, 16, W - 32, H - 32);

    // Inner frame with stepped corners
    ctx.strokeStyle = hexToRgba(c.primaryColor, 0.2);
    ctx.lineWidth = 1;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // Deco fan patterns in corners
    const fanR = 30;
    ([[28, 28], [W - 28, 28], [28, H - 28], [W - 28, H - 28]] as const).forEach(([cx, cy], idx) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((idx * Math.PI) / 2);
      for (let i = 0; i < 5; i++) {
        ctx.strokeStyle = hexToRgba(c.primaryColor, 0.15 - i * 0.025);
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.arc(0, 0, fanR - i * 5, 0, Math.PI / 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // Deco line elements (vertical lines at center top)
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.15);
    ctx.fillRect(W / 2 - 1, 16, 2, 20);
    ctx.fillRect(W / 2 - 8, 16, 2, 14);
    ctx.fillRect(W / 2 + 6, 16, 2, 14);

    // Logo centered
    const logoS = H * 0.16;
    drawLogo(ctx, logo, W / 2 - logoS / 2, H * 0.1, logoS, logoS, c.company || "", c.primaryColor);

    // Name
    ctx.font = getFont(600, f.name, c.fontStyle);
    ctx.fillStyle = c.textColor;
    ctx.textAlign = "center";
    drawTextWithShadow(ctx, c.name || "Your Name", W / 2, H * 0.42);

    // Title
    ctx.font = getFont(400, f.title, c.fontStyle);
    ctx.fillStyle = c.primaryColor;
    ctx.fillText(c.title || "Job Title", W / 2, H * 0.42 + f.title + 8);

    // Deco divider (stepped)
    const divY = H * 0.57;
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.3);
    ctx.fillRect(W * 0.25, divY, W * 0.5, 1);
    ctx.fillRect(W * 0.35, divY - 3, W * 0.3, 1);
    ctx.fillRect(W * 0.45, divY + 3, W * 0.1, 1);
    // Center diamond
    ctx.save();
    ctx.translate(W / 2, divY);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = c.primaryColor;
    ctx.fillRect(-3, -3, 6, 6);
    ctx.restore();

    // Contact
    drawContactBlock(ctx, c, W / 2, H * 0.67, Math.round(f.contact * 1.4), "center",
      hexToRgba(c.textColor, 0.5), hexToRgba(c.primaryColor, 0.35), f.contact);

    // Company
    ctx.font = getFont(600, f.label, c.fontStyle);
    ctx.fillStyle = hexToRgba(c.primaryColor, 0.4);
    ctx.fillText((c.company || "").toUpperCase(), W / 2, H * 0.93);
  },
};

/* ====================================================================
   CARD BACK RENDERER (5 styles)
   ==================================================================== */

function renderCardBack(ctx: CanvasRenderingContext2D, W: number, H: number, c: CardConfig, logoImg?: HTMLImageElement | null) {
  const f = getFontSizes(W, H);
  const contrastC = getContrastColor(c.primaryColor);

  switch (c.backStyle) {
    case "pattern-fill": {
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, c.primaryColor);
      grad.addColorStop(1, c.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(ctx, 0, 0, W, H, (c.patternType !== "none" ? c.patternType : "dots") as Parameters<typeof drawPattern>[5], contrastC, 0.06, 24);
      const logoS = Math.min(W, H) * 0.22;
      drawLogo(ctx, logoImg, W / 2 - logoS / 2, H / 2 - logoS / 2, logoS, logoS, c.company || "", contrastC, "circle");
      break;
    }
    case "minimal": {
      ctx.fillStyle = c.primaryColor;
      ctx.fillRect(0, H - 4, W, 4);
      const logoS = H * 0.16;
      drawLogo(ctx, logoImg, W / 2 - logoS / 2, H / 2 - logoS / 2 - 10, logoS, logoS, c.company || "", c.primaryColor, "circle");
      ctx.font = getFont(500, f.company, c.fontStyle);
      ctx.fillStyle = hexToRgba(c.textColor, 0.4);
      ctx.textAlign = "center";
      ctx.fillText((c.company || "").toUpperCase(), W / 2, H / 2 + logoS / 2 + 8);
      if (c.website) {
        ctx.font = getFont(400, f.contact, c.fontStyle);
        ctx.fillStyle = hexToRgba(c.textColor, 0.3);
        ctx.fillText(c.website, W / 2, H / 2 + logoS / 2 + f.company + 14);
      }
      break;
    }
    case "info-repeat": {
      ctx.fillStyle = hexToRgba(c.primaryColor, 0.03);
      ctx.fillRect(0, 0, W, H);
      // Repeat company name as watermark
      ctx.save();
      ctx.globalAlpha = 0.04;
      ctx.font = getFont(700, f.nameXl * 2, c.fontStyle);
      ctx.fillStyle = c.primaryColor;
      ctx.textAlign = "center";
      ctx.translate(W / 2, H / 2);
      ctx.rotate(-0.15);
      ctx.fillText((c.company || "BRAND").toUpperCase(), 0, 0);
      ctx.restore();
      // Logo
      const logoS2 = H * 0.2;
      drawLogo(ctx, logoImg, W / 2 - logoS2 / 2, H * 0.25, logoS2, logoS2, c.company || "", c.primaryColor, "circle");
      // Contact centered
      drawContactBlock(ctx, c, W / 2, H * 0.6, Math.round(f.contact * 1.5), "center",
        hexToRgba(c.textColor, 0.5), hexToRgba(c.primaryColor, 0.3), f.contact);
      break;
    }
    case "gradient-brand": {
      const grad = ctx.createLinearGradient(0, 0, W * 0.5, H);
      grad.addColorStop(0, c.primaryColor);
      grad.addColorStop(1, c.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawAccentCircle(ctx, W * 0.15, H * 0.15, W * 0.12, contrastC, 0.05);
      drawAccentCircle(ctx, W * 0.85, H * 0.85, W * 0.1, contrastC, 0.04);
      const logoS3 = Math.min(W, H) * 0.25;
      drawLogo(ctx, logoImg, W / 2 - logoS3 / 2, H / 2 - logoS3 / 2 - 14, logoS3, logoS3, c.company || "", contrastC, "circle");
      if (c.website) {
        ctx.font = getFont(400, f.contact, c.fontStyle);
        ctx.fillStyle = hexToRgba(contrastC, 0.5);
        ctx.textAlign = "center";
        ctx.fillText(c.website, W / 2, H / 2 + logoS3 / 2 + 8);
      }
      if (c.tagline) {
        ctx.font = getFont(300, f.tagline, c.fontStyle);
        ctx.fillStyle = hexToRgba(contrastC, 0.4);
        ctx.fillText(c.tagline, W / 2, H / 2 + logoS3 / 2 + f.contact + 18);
      }
      break;
    }
    default: { // logo-center
      const grad = ctx.createLinearGradient(0, 0, W, H);
      grad.addColorStop(0, c.primaryColor);
      grad.addColorStop(1, c.secondaryColor);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      drawPattern(ctx, 0, 0, W, H, "dots", contrastC, 0.04, 28);
      drawAccentCircle(ctx, W * 0.15, H * 0.15, W * 0.12, contrastC, 0.04);
      drawAccentCircle(ctx, W * 0.85, H * 0.85, W * 0.1, contrastC, 0.03);
      const logoS4 = Math.min(W, H) * 0.25;
      if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
        drawLogo(ctx, logoImg, W / 2 - logoS4 / 2, H / 2 - logoS4 / 2 - 14, logoS4, logoS4, "", contrastC, "circle");
      } else {
        ctx.font = getFont(800, Math.round(f.nameXl * 1.2), c.fontStyle);
        ctx.fillStyle = contrastC;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        drawTextWithShadow(ctx, c.company || c.name || "Brand", W / 2, H / 2 - 10, { shadowBlur: 6, shadowColor: "rgba(0,0,0,0.2)" });
      }
      if (c.website) {
        ctx.font = getFont(400, f.contact, c.fontStyle);
        ctx.fillStyle = hexToRgba(contrastC, 0.45);
        ctx.textAlign = "center";
        ctx.textBaseline = "alphabetic";
        ctx.fillText(c.website, W / 2, H / 2 + logoS4 / 2 + 8);
      }
      drawDivider(ctx, W * 0.35, H / 2 + logoS4 / 2 + 22, W * 0.3, "ornate", contrastC, 0.2);
      break;
    }
  }
}

/* ====================================================================
   BLEED / SAFE ZONE OVERLAY
   ==================================================================== */

function drawBleedOverlay(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const b = Math.min(BLEED_MM * (W / (CARD_SIZES.standard.w)) * MM_PX, W * 0.04);
  ctx.save();
  ctx.fillStyle = "rgba(255, 60, 60, 0.12)";
  ctx.fillRect(0, 0, W, b);
  ctx.fillRect(0, H - b, W, b);
  ctx.fillRect(0, b, b, H - b * 2);
  ctx.fillRect(W - b, b, b, H - b * 2);
  ctx.restore();
}

function drawSafeZone(ctx: CanvasRenderingContext2D, W: number, H: number) {
  const s = Math.min(SAFE_MM * (W / (CARD_SIZES.standard.w)) * MM_PX, W * 0.07);
  ctx.save();
  ctx.strokeStyle = "rgba(34, 197, 94, 0.6)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(s, s, W - s * 2, H - s * 2);
  ctx.setLineDash([]);
  ctx.restore();
}

/* ====================================================================
   BATCH GENERATION HELPER
   ==================================================================== */

function renderBatchCard(
  config: CardConfig,
  entry: ContactEntry,
  logoImg: HTMLImageElement | null | undefined,
  side: "front" | "back",
  scale: number = 1
): HTMLCanvasElement {
  const offscreen = document.createElement("canvas");
  const batchConfig: CardConfig = {
    ...config,
    name: entry.name,
    title: entry.title,
    email: entry.email,
    phone: entry.phone,
    side,
  };
  renderCardV2(offscreen, batchConfig, logoImg, scale);
  // QR overlay (use logical dimensions since ctx may have scale transform)
  if (batchConfig.qrCodeUrl) {
    const ctx2 = offscreen.getContext("2d");
    if (ctx2) {
      const logW = offscreen.width / scale;
      const logH = offscreen.height / scale;
      const qrSize = Math.min(logW, logH) * 0.14;
      if (side === "front") {
        drawQRPlaceholder(ctx2, logW - qrSize - logW * 0.06, logH - qrSize - logH * 0.1, qrSize, "#000000");
      } else {
        drawQRPlaceholder(ctx2, logW / 2 - qrSize / 2, logH * 0.65, qrSize, "#000000");
      }
    }
  }
  return offscreen;
}

/* ====================================================================
   MAIN COMPONENT
   ==================================================================== */

export default function BusinessCardWorkspace() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRevising, setIsRevising] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [logoImg, setLogoImg] = useState<HTMLImageElement | null>(null);

  // Card Config State
  const [config, setConfig] = useState<CardConfig>({
    name: "", title: "", company: "", tagline: "",
    email: "", phone: "", website: "", address: "",
    template: "executive-clean",
    primaryColor: "#2c3e50", secondaryColor: "#7f8c8d",
    textColor: "#2c3e50", bgColor: "#faf8f5",
    fontStyle: "modern", cardStyle: "standard",
    customWidthMm: 89, customHeightMm: 51,
    side: "front",
    logoUrl: "",
    patternType: "none",
    showContactIcons: true,
    qrCodeUrl: "",
    backStyle: "logo-center",
  });

  // View State
  const [showBleed, setShowBleed] = useState(false);
  const [showSafeZone, setShowSafeZone] = useState(false);
  const [bleedInExport, setBleedInExport] = useState(false);
  const [sideBySide, setSideBySide] = useState(false);
  const [templateFilter, setTemplateFilter] = useState<string>("all");

  // ── Parametric Generator State ──
  const [genRecipeId,    setGenRecipeId]    = useState<string>(LAYOUT_RECIPES[0].id);
  const [genThemeId,     setGenThemeId]     = useState<string>(CARD_THEMES[0].id);
  const [genAccentKitId, setGenAccentKitId] = useState<string>(ACCENT_KITS[0].id);

  // ── Front-only mode (no back card needed) ──
  const [frontOnly, setFrontOnly] = useState(false);

  // Revision State
  const [revisionPrompt, setRevisionPrompt] = useState("");
  const [revisionScope, setRevisionScope] = useState<RevisionScope>("full-redesign");
  const [revisionHistory, setRevisionHistory] = useState<RevisionEntry[]>([]);

  // Batch Processing State
  const [batchMode, setBatchMode] = useState(false);
  const [batchEntries, setBatchEntries] = useState<ContactEntry[]>([
    { id: "1", name: "", title: "", email: "", phone: "" },
  ]);
  const [batchExporting, setBatchExporting] = useState(false);
  const [batchProgress, setBatchProgress] = useState(0);

  // ── vNext Editor Mode ──
  const [editorMode, setEditorMode] = useState(false);
  const editorStore = useEditorStore();

  const updateConfig = useCallback((partial: Partial<CardConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }));
  }, []);

  /** Apply a parametric generator design: builds a full DesignDocumentV2
   *  and loads it into the editor store, then syncs theme colours back
   *  to the CardConfig so the rest of the workspace stays coherent. */
  const applyGeneratorDesign = useCallback((
    recipeId: string,
    themeId: string,
    accentKitId: string,
  ) => {
    const doc = generateCardDocument({
      cfg: config as unknown as CardConfigV2,
      recipeId,
      themeId,
      accentKitId,
      logoImg: logoImg ?? undefined,
    });
    editorStore.setDoc(doc);
    if (!editorMode) setEditorMode(true);

    // Sync theme colours back so manual controls reflect the new palette.
    const themePartial = applyThemeToConfig(config as unknown as CardConfigV2, themeId);
    setConfig((prev) => ({
      ...prev,
      ...(themePartial as Partial<CardConfig>),
    }));
  }, [config, logoImg, editorMode, editorStore]);

  /** Suggest a random recipe/theme/kit combination and immediately apply it. */
  const handleSuggestDesign = useCallback(() => {
    const styles = ["minimal", "modern", "classic", "creative", "luxury"] as const;
    const style  = styles[Math.floor(Math.random() * styles.length)];
    const moods  = ["vibrant", "dark", "light", "muted", "metallic"] as const;
    const mood   = moods[Math.floor(Math.random() * moods.length)];
    const combo = suggestCombination(style, mood, Date.now());
    setGenRecipeId(combo.recipeId);
    setGenThemeId(combo.themeId);
    setGenAccentKitId(combo.accentKitId);
    applyGeneratorDesign(combo.recipeId, combo.themeId, combo.accentKitId);
  }, [applyGeneratorDesign]);

  // Load logo image
  useEffect(() => {
    if (config.logoUrl) {
      loadImage(config.logoUrl).then(setLogoImg).catch(() => setLogoImg(null));
    } else {
      setLogoImg(null);
    }
  }, [config.logoUrl]);

  // Logo file upload
  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        updateConfig({ logoUrl: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }, [updateConfig]);

  /** Parse a CSV file into batch entries.
   *  Expected columns (in order): Name, Title, Email, Phone
   *  A header row is auto-detected and skipped if the first cell is
   *  non-numeric text that matches common header words.
   */
  const handleCsvImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Reset the input so the same file can be re-imported
    e.target.value = "";
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      const lines = text.split(/\r?\n/).filter(l => l.trim());
      if (!lines.length) return;

      // Detect header row (first cell looks like a label, not a name)
      const headerWords = /^(name|full.?name|person|member|employee|staff|title|role|job|email|phone|contact)/i;
      const firstCell = lines[0].split(",")[0].trim().replace(/^"|"$/g, "");
      const startIdx = headerWords.test(firstCell) ? 1 : 0;

      const parsed: ContactEntry[] = lines.slice(startIdx).map((line, idx) => {
        // Handle quoted CSV fields
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
          .map(c => c.trim().replace(/^"|"$/g, ""));
        return {
          id:    String(Date.now() + idx),
          name:  cols[0] ?? "",
          title: cols[1] ?? "",
          email: cols[2] ?? "",
          phone: cols[3] ?? "",
        };
      }).filter(e => e.name.trim());

      if (parsed.length > 0) {
        setBatchEntries(parsed.slice(0, 200)); // cap at 200 for performance
        setBatchMode(true);
      }
    };
    reader.readAsText(file);
  }, []);

  const getCardSize = useCallback(() => {
    if (config.cardStyle === "custom") {
      const w = Math.round(config.customWidthMm * MM_PX);
      const h = Math.round(config.customHeightMm * MM_PX);
      return { w, h, label: `Custom (${config.customWidthMm}x${config.customHeightMm}mm)`, ratio: `${w} / ${h}`, mmW: config.customWidthMm, mmH: config.customHeightMm };
    }
    return CARD_SIZES[config.cardStyle] || CARD_SIZES.standard;
  }, [config.cardStyle, config.customWidthMm, config.customHeightMm]);

  // Filtered templates
  const filteredTemplates = useMemo(() => {
    if (templateFilter === "all") return TEMPLATES;
    return TEMPLATES.filter(t => t.category === templateFilter);
  }, [templateFilter]);

  // Visual Template Previews
  const templatePreviews = useMemo<TemplatePreview[]>(
    () =>
      filteredTemplates.map((t) => ({
        id: t.id,
        label: t.label,
        render: (ctx: CanvasRenderingContext2D, w: number, h: number) => {
          const styleMap: Record<string, "left" | "centered" | "split" | "diagonal" | "gradient" | "minimal"> = {
            "executive-clean": "left", "swiss-grid": "left", "mono-type": "minimal",
            "nordic-frost": "left", "bold-split": "split", "neon-edge": "left",
            "geometric-modern": "minimal", "gradient-wave": "gradient",
            "corporate-stripe": "left", "diplomat": "centered", "heritage-crest": "centered",
            "engraved": "centered", "diagonal-cut": "diagonal", "layered-card": "centered",
            "photo-overlay": "split", "dot-matrix": "left", "gold-foil": "centered",
            "marble-luxe": "left", "velvet-noir": "left", "art-deco": "centered",
          };
          const theme = TEMPLATE_DEFAULT_THEMES[t.id];
          drawCardThumbnail(ctx, w, h, {
            bgColor: theme?.bg || config.bgColor,
            primaryColor: theme?.primary || config.primaryColor,
            accentColor: theme?.secondary || config.secondaryColor,
            headerStyle: styleMap[t.id] || "left",
            showLogo: true,
            showLines: true,
          });
        },
      })),
    [config.primaryColor, config.secondaryColor, config.bgColor, filteredTemplates]
  );

  // Subscribe to global advanced settings to trigger canvas re-render
  const advancedSettings = useAdvancedSettingsStore((s) => s.settings);

  // ── vNext Editor: Smart sync — tracks what changed to decide full rebuild vs. incremental ──
  // Structural fields (template, fontStyle, cardStyle, side, logo) → full rebuild.
  // Text/color-only changes → incremental sync that PRESERVES per-layer color overrides.
  const _prevSyncRef = useRef<{
    templateKey: string;
    textColor: string;
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
  } | null>(null);
  // ── vNext Editor: sync effect ──────────────────────────────────────────────
  // Runs whenever editorMode, config, or logoImg changes.
  //
  // IMPORTANT: We no longer force a full rebuild just because the user toggled
  // editor mode. That was the bug: it destroyed every manual layer edit the
  // moment the user clicked "Edit Layers" a second time.
  //
  // Rules:
  //   • Template / fontStyle / cardStyle / side / logo changed → full rebuild
  //     (structure of the card has changed — safe to lose per-layer tweaks)
  //   • Text or color only changed → incremental sync (preserves layer overrides)
  //   • editorMode = false AND doc exists → still sync so re-entering editor mode
  //     sees the latest config without needing a destructive rebuild
  useEffect(() => {
    const templateKey = `${config.template}|${config.fontStyle}|${config.cardStyle}|${config.side}`;
    const logoUrl = logoImg?.src ?? "";
    const prev = _prevSyncRef.current;

    if (!editorMode) {
      // In normal mode: keep the doc in sync with config changes so that the NEXT
      // entry into editor mode can do an incremental sync rather than a full rebuild
      // (which would destroy any manual layer edits from the previous session).
      const hasDoc = Object.keys(editorStore.doc?.layersById ?? {}).length > 1;
      if (!hasDoc) return; // no doc yet — nothing to preserve

      if (!prev || prev.templateKey !== templateKey || prev.logoUrl !== logoUrl) {
        const doc = cardConfigToDocument(config as unknown as CardConfigV2, { logoImg: logoImg ?? undefined });
        editorStore.setDoc(doc);
      } else {
        let updatedDoc = syncTextToDocument(editorStore.doc, config as unknown as CardConfigV2);
        updatedDoc = syncColorsToDocument(updatedDoc, config as unknown as CardConfigV2, {
          prevTextColor:      prev.textColor,
          prevPrimaryColor:   prev.primaryColor,
          prevSecondaryColor: prev.secondaryColor,
        });
        editorStore.setDoc(updatedDoc);
      }
      _prevSyncRef.current = { templateKey, textColor: config.textColor, primaryColor: config.primaryColor, secondaryColor: config.secondaryColor, logoUrl };
      return;
    }

    // ── Editor mode ──────────────────────────────────────────────────────────
    // Only rebuild when something structural actually changed.
    const needsFullRebuild =
      !prev ||
      prev.templateKey !== templateKey ||
      prev.logoUrl !== logoUrl;

    if (needsFullRebuild) {
      const doc = cardConfigToDocument(
        config as unknown as CardConfigV2,
        { logoImg: logoImg ?? undefined }
      );
      editorStore.setDoc(doc);
    } else {
      // Incremental sync — preserves any per-layer color/position overrides the
      // user set manually; only updates layers tagged with global semantic tags.
      let updatedDoc = syncTextToDocument(editorStore.doc, config as unknown as CardConfigV2);
      updatedDoc = syncColorsToDocument(updatedDoc, config as unknown as CardConfigV2, {
        prevTextColor:      prev.textColor,
        prevPrimaryColor:   prev.primaryColor,
        prevSecondaryColor: prev.secondaryColor,
      });
      editorStore.setDoc(updatedDoc);
    }

    _prevSyncRef.current = {
      templateKey,
      textColor:      config.textColor,
      primaryColor:   config.primaryColor,
      secondaryColor: config.secondaryColor,
      logoUrl,
    };
    // advancedSettings intentionally omitted: font scales are baked in at full-rebuild time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorMode, config, logoImg]);

  // ── Normal-mode canvas render ───────────────────────────────────────────────
  // CanvasEditor runs its own RAF loop in editor mode — this effect only fires
  // when editorMode is false.
  //
  // KEY FIX: When a doc exists (the user has used Edit Layers at least once),
  // render from the doc — NOT from config — so that any layer-level edits remain
  // visible after clicking "Exit Editor".  Fall back to config-based rendering
  // only when there is no doc yet (first load before entering editor mode).
  useEffect(() => {
    if (editorMode) return; // CanvasEditor owns rendering while in editor mode

    const canvas = canvasRef.current;
    if (!canvas) return;

    const hasDoc = Object.keys(editorStore.doc?.layersById ?? {}).length > 1;

    if (hasDoc) {
      // Doc exists → render from layer document so editor-mode changes stay visible
      const offscreen = renderToCanvas(editorStore.doc, 1);
      canvas.width  = offscreen.width;
      canvas.height = offscreen.height;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.drawImage(offscreen, 0, 0);
    } else {
      // No doc yet (user has never entered editor mode) → config-based render
      renderCardV2(canvas, config, logoImg, 1, { showBleedSafe: showBleed || showSafeZone });
    }

    // Side-by-side back canvas always uses config (back layout lives outside the doc)
    if (sideBySide && backCanvasRef.current) {
      renderCardV2(
        backCanvasRef.current,
        { ...config, side: config.side === "front" ? "back" : "front" },
        logoImg, 1, { showBleedSafe: showBleed || showSafeZone }
      );
    }
  }, [editorMode, editorStore.doc, config, showBleed, showSafeZone, sideBySide, logoImg, advancedSettings]);

  /* ==================================================================
     AI DESIGN ENGINE - Full generation
     ================================================================== */
  const generateWithAI = useCallback(async () => {
    if (!config.name.trim() && !config.company.trim()) return;
    setIsGenerating(true);
    try {
      const templateList = TEMPLATES.map(t => `${t.id}: ${t.desc}`).join("\n");
      const templateIds = TEMPLATES.map(t => t.id).join(" | ");
      const patternIds = PATTERN_OPTIONS.map(p => p.id).join(" | ");

      const prompt = `You are an elite professional business card designer with 20 years of experience. Design a stunning, market-ready business card.

PERSON & COMPANY:
Name: ${config.name || "Not provided"}
Title: ${config.title || "Not provided"}
Company: ${config.company || "Not provided"}
Tagline: ${config.tagline || "Not provided"}
Industry: Infer from company/title

DESIGN REQUIREMENTS:
- Must be PROFESSIONAL and PREMIUM looking
- Consider industry-appropriate aesthetics
- Use color psychology for the specific industry
- Ensure WCAG-compliant contrast for readability
- Follow golden-ratio spacing principles
- Choose template that best fits the brand personality
- Consider modern 2025-2026 design trends

AVAILABLE TEMPLATES:
${templateList}

RESPOND WITH EACH VALUE ON ITS OWN LINE (use EXACTLY these keys):
TEMPLATE: ${templateIds}
PRIMARY: #hex (brand/accent color - must be bold and identifiable)
SECONDARY: #hex (complementary accent)
TEXT: #hex (main text color - must contrast well with BG)
BG: #hex (background color)
FONT: modern | classic | bold | elegant | minimal
PATTERN: ${patternIds}
BACK_STYLE: logo-center | pattern-fill | minimal | info-repeat | gradient-brand
TAGLINE: A short tagline for the company (if none provided)
STYLE: minimal | modern | classic | creative | luxury`;

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

      const updates: Partial<CardConfig> = {};
      const templateMatch = fullText.match(/TEMPLATE:\s*(\S+)/i);
      const primaryMatch = fullText.match(/PRIMARY:\s*(#[0-9a-fA-F]{6})/i);
      const secondaryMatch = fullText.match(/SECONDARY:\s*(#[0-9a-fA-F]{6})/i);
      const textMatch = fullText.match(/TEXT:\s*(#[0-9a-fA-F]{6})/i);
      const bgMatch = fullText.match(/BG:\s*(#[0-9a-fA-F]{6})/i);
      const fontMatch = fullText.match(/FONT:\s*(\S+)/i);
      const patternMatch = fullText.match(/PATTERN:\s*(\S+)/i);
      const backMatch = fullText.match(/BACK_STYLE:\s*(\S+)/i);
      const taglineMatch = fullText.match(/TAGLINE:\s*(.+)/i);
      const styleMatch = fullText.match(/STYLE:\s*(\S+)/i);

      if (templateMatch) {
        const t = templateMatch[1].toLowerCase();
        if (TEMPLATES.some(tpl => tpl.id === t)) updates.template = t;
      }
      if (primaryMatch) updates.primaryColor = primaryMatch[1];
      if (secondaryMatch) updates.secondaryColor = secondaryMatch[1];
      if (textMatch) updates.textColor = textMatch[1];
      if (bgMatch) updates.bgColor = bgMatch[1];
      if (fontMatch) {
        const fv = fontMatch[1].toLowerCase() as CardConfig["fontStyle"];
        if (["modern", "classic", "bold", "elegant", "minimal"].includes(fv)) updates.fontStyle = fv;
      }
      if (patternMatch) {
        const p = patternMatch[1].toLowerCase();
        if (PATTERN_OPTIONS.some(po => po.id === p)) updates.patternType = p;
      }
      if (backMatch) {
        const b = backMatch[1].toLowerCase();
        if (["logo-center", "pattern-fill", "minimal", "info-repeat", "gradient-brand"].includes(b)) updates.backStyle = b as CardConfig["backStyle"];
      }
      if (taglineMatch && !config.tagline) {
        updates.tagline = taglineMatch[1].trim().replace(/^["']|["']$/g, "");
      }
      updateConfig(updates);

      // ── Generate a full parametric design using the AI's style choice ──────
      const aiStyle = styleMatch?.[1]?.toLowerCase() as Parameters<typeof suggestCombination>[0] | undefined;
      const validStyles = ["minimal", "modern", "classic", "creative", "luxury"] as const;
      const resolvedStyle: typeof validStyles[number] =
        validStyles.includes(aiStyle as typeof validStyles[number])
          ? (aiStyle as typeof validStyles[number])
          : "modern";
      const validMoods = ["light", "dark", "vibrant", "muted", "metallic"] as const;
      // Pick mood from bg brightness
      const bgHex = bgMatch?.[1] ?? "#1a1a1a";
      const bgLum = parseInt(bgHex.slice(1, 3), 16) * 0.299
                  + parseInt(bgHex.slice(3, 5), 16) * 0.587
                  + parseInt(bgHex.slice(5, 7), 16) * 0.114;
      const aiMood: typeof validMoods[number] = bgLum < 80 ? "dark" : bgLum > 200 ? "light" : "vibrant";
      const combo = suggestCombination(resolvedStyle, aiMood, Date.now());
      setGenRecipeId(combo.recipeId);
      setGenThemeId(combo.themeId);
      setGenAccentKitId(combo.accentKitId);

      // Merge AI color picks into the parametric generation (useCfgColors=true)
      const cfgWithUpdates = { ...config, ...updates } as unknown as CardConfigV2;
      const doc = generateCardDocument({
        cfg: cfgWithUpdates,
        recipeId:    combo.recipeId,
        themeId:     combo.themeId,
        accentKitId: combo.accentKitId,
        useCfgColors: true,
        logoImg:     logoImg ?? undefined,
      });
      editorStore.setDoc(doc);
      setEditorMode(true);

    } catch (err) {
      console.error("AI generation error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [config, updateConfig, logoImg, editorStore]);

  /* ==================================================================
     AI REVISION ENGINE - Deep Reasoning + Hard Scope Enforcement
     ================================================================== */
  /**
   * Returns true when the prompt names a specific card element by name.
   * These requests can only be fulfilled at the layer level — not via global CardConfig fields.
   */
  const isElementSpecificRequest = useCallback((prompt: string): boolean => {
    const lower = prompt.toLowerCase();
    const ELEMENT_KEYWORDS = [
      "name", "full name", "person",
      "title", "job title", "position", "role",
      "company", "company name", "business name", "organisation", "organization",
      "tagline", "slogan", "subtitle",
      "contact", "email", "phone", "website", "address",
      "accent", "line", "divider", "bar", "stripe",
      "background", "card background",
    ];
    return ELEMENT_KEYWORDS.some(kw => lower.includes(kw));
  }, []);

  const handleRevision = useCallback(async () => {
    if (!revisionPrompt.trim()) return;
    setIsRevising(true);
    try {
      const currentDesign = {
        name: config.name,
        title: config.title,
        company: config.company,
        tagline: config.tagline,
        email: config.email,
        phone: config.phone,
        website: config.website,
        address: config.address,
        template: config.template,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        textColor: config.textColor,
        bgColor: config.bgColor,
        fontStyle: config.fontStyle,
        cardStyle: config.cardStyle,
        side: config.side,
        patternType: config.patternType,
        backStyle: config.backStyle,
        showContactIcons: config.showContactIcons,
        qrCodeUrl: config.qrCodeUrl,
      };

      // ── HARD SCOPE ENFORCEMENT: define exactly which fields each scope may touch ──
      const SCOPE_ALLOWED_FIELDS: Record<RevisionScope, string[]> = {
        "text-only":        ["name", "title", "company", "tagline", "email", "phone", "website", "address", "fontStyle", "showContactIcons"],
        "colors-only":      ["primaryColor", "secondaryColor", "textColor", "bgColor"],
        "layout-only":      ["template", "patternType", "backStyle", "cardStyle", "side"],
        "element-specific": ["name", "title", "company", "tagline", "email", "phone", "website", "address", "fontStyle", "showContactIcons", "primaryColor", "secondaryColor", "textColor", "bgColor", "template", "patternType", "backStyle", "cardStyle", "side", "qrCodeUrl"],
        "full-redesign":    ["name", "title", "company", "tagline", "email", "phone", "website", "address", "fontStyle", "showContactIcons", "primaryColor", "secondaryColor", "textColor", "bgColor", "template", "patternType", "backStyle", "cardStyle", "side", "qrCodeUrl"],
      };

      const allowedFields = SCOPE_ALLOWED_FIELDS[revisionScope];
      const templateIds = TEMPLATES.map(t => t.id).join(", ");
      const patternIds = PATTERN_OPTIONS.map(p => p.id).join(", ");

      const prompt = `You are a PRECISION design revision AI. Your ONLY job is to make the SMALLEST, most SURGICAL change that satisfies the user's request. You are NOT redesigning the card.

## ABSOLUTE RULES — VIOLATION MEANS FAILURE
1. You MUST ONLY change what the user SPECIFICALLY asks for
2. You MUST NOT redesign or reimagine the card
3. You MUST NOT change properties the user did not mention
4. If the user says "align icons" → that is showContactIcons or layout, NOT colors or fonts
5. If the user says "warmer colors" → that is colors ONLY, NOT template or fonts
6. ONLY return properties whose values are DIFFERENT from the current values
7. If ZERO properties need changing, return an empty object {}

## CURRENT DESIGN (do NOT change values that are already correct)
${JSON.stringify(currentDesign, null, 2)}

## SCOPE: "${revisionScope}"
ALLOWED fields you may modify: [${allowedFields.join(", ")}]
Any field NOT in this list will be REJECTED by the system regardless of what you return.

## USER REQUEST
"${revisionPrompt}"

## REQUIRED REASONING (think step-by-step before answering)
<thinking>
1. What EXACTLY is the user asking? (restate in one sentence)
2. Which SPECIFIC field(s) from the ALLOWED list address this? (name each one)
3. What should each field change to? (state the new value)
4. Verify: am I changing anything the user did NOT ask for? (must be NO)
5. Verify: is each new value DIFFERENT from the current value? (must be YES)
</thinking>

## RESPONSE FORMAT
After your <thinking>, output ONLY a JSON object with the changed properties.
Do NOT include any property that stays the same.
Available templates: ${templateIds}
Available fonts: modern, classic, bold, elegant, minimal
Available patterns: ${patternIds}
Available back styles: logo-center, pattern-fill, minimal, info-repeat, gradient-brand
Available card styles: standard, eu, jp, square, rounded, custom
Available sides: front, back
qrCodeUrl: set to any URL string to add a QR code, or "" to remove it

JSON:`;

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

      // Parse JSON from response
      const jsonMatch = fullText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const rawChanges = JSON.parse(jsonMatch[0]) as Partial<CardConfig>;

        // ── Step 1: Validate each field's value format ──
        const validatedChanges: Partial<CardConfig> = {};
        if (rawChanges.template && TEMPLATES.some(t => t.id === rawChanges.template)) validatedChanges.template = rawChanges.template;
        if (rawChanges.primaryColor?.match(/^#[0-9a-fA-F]{6}$/)) validatedChanges.primaryColor = rawChanges.primaryColor;
        if (rawChanges.secondaryColor?.match(/^#[0-9a-fA-F]{6}$/)) validatedChanges.secondaryColor = rawChanges.secondaryColor;
        if (rawChanges.textColor?.match(/^#[0-9a-fA-F]{6}$/)) validatedChanges.textColor = rawChanges.textColor;
        if (rawChanges.bgColor?.match(/^#[0-9a-fA-F]{6}$/)) validatedChanges.bgColor = rawChanges.bgColor;
        if (rawChanges.fontStyle && ["modern", "classic", "bold", "elegant", "minimal"].includes(rawChanges.fontStyle)) validatedChanges.fontStyle = rawChanges.fontStyle;
        if (rawChanges.patternType !== undefined && PATTERN_OPTIONS.some(p => p.id === rawChanges.patternType)) validatedChanges.patternType = rawChanges.patternType;
        if (rawChanges.backStyle !== undefined) validatedChanges.backStyle = rawChanges.backStyle;
        if (rawChanges.tagline !== undefined) validatedChanges.tagline = rawChanges.tagline;
        if (rawChanges.showContactIcons !== undefined) validatedChanges.showContactIcons = rawChanges.showContactIcons;
        // Text content fields (string passthrough)
        if (typeof rawChanges.name === "string") validatedChanges.name = rawChanges.name;
        if (typeof rawChanges.title === "string") validatedChanges.title = rawChanges.title;
        if (typeof rawChanges.company === "string") validatedChanges.company = rawChanges.company;
        if (typeof rawChanges.email === "string") validatedChanges.email = rawChanges.email;
        if (typeof rawChanges.phone === "string") validatedChanges.phone = rawChanges.phone;
        if (typeof rawChanges.website === "string") validatedChanges.website = rawChanges.website;
        if (typeof rawChanges.address === "string") validatedChanges.address = rawChanges.address;
        // Layout fields
        if (rawChanges.cardStyle && ["standard", "eu", "jp", "square", "rounded", "custom"].includes(rawChanges.cardStyle)) validatedChanges.cardStyle = rawChanges.cardStyle;
        if (rawChanges.side && ["front", "back"].includes(rawChanges.side)) validatedChanges.side = rawChanges.side;
        if (typeof rawChanges.qrCodeUrl === "string") validatedChanges.qrCodeUrl = rawChanges.qrCodeUrl;

        // ── Step 2: HARD SCOPE ENFORCEMENT — strip any field not in allowedFields ──
        const scopedChanges: Partial<CardConfig> = {};
        for (const [key, value] of Object.entries(validatedChanges)) {
          if (allowedFields.includes(key)) {
            (scopedChanges as Record<string, unknown>)[key] = value;
          }
        }

        // ── Step 3: DIFF CHECK — only keep values that actually differ from current ──
        const finalChanges: Partial<CardConfig> = {};
        for (const [key, value] of Object.entries(scopedChanges)) {
          const currentVal = currentDesign[key as keyof typeof currentDesign];
          if (currentVal !== value) {
            (finalChanges as Record<string, unknown>)[key] = value;
          }
        }

        // Only apply if there are actual changes
        if (Object.keys(finalChanges).length > 0) {
          const entry: RevisionEntry = {
            id: Date.now().toString(),
            instruction: revisionPrompt,
            scope: revisionScope,
            timestamp: Date.now(),
            changes: finalChanges,
          };
          setRevisionHistory(prev => [entry, ...prev].slice(0, 20));
          updateConfig(finalChanges);
        }
        setRevisionPrompt("");
      }
    } catch (err) {
      console.error("AI revision error:", err);
    } finally {
      setIsRevising(false);
    }
  }, [revisionPrompt, revisionScope, config, updateConfig]);

  /* ==================================================================
     AI REVISION ENGINE (vNext) - Layer-level targeting via ai-patch.ts
     Used when editor mode is active — targets individual layers
     ================================================================== */
  const handleEditorRevision = useCallback(async (scopeOverride?: EditorRevisionScope) => {
    if (!revisionPrompt.trim()) return;
    setIsRevising(true);
    editorStore.setAIProcessing(true);

    try {
      // Map workspace revision scope → editor scope (scopeOverride takes priority)
      const scopeMap: Record<RevisionScope, EditorRevisionScope> = {
        "text-only": "text-only",
        "colors-only": "colors-only",
        "layout-only": "layout-only",
        "element-specific": "element-specific",
        "full-redesign": "full-redesign",
      };
      const editorScope = scopeOverride ?? scopeMap[revisionScope] ?? "full-redesign";

      // Build the AI prompt with full layer context
      const systemPrompt = buildAIPatchPrompt(
        editorStore.doc,
        revisionPrompt,
        editorScope,
        editorStore.lockedPaths
      );

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: systemPrompt }] }),
      });
      if (!response.ok) throw new Error("AI revision failed");
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No stream");
      let fullText = "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse AI response into intents/patches
      const parsed = parseAIRevisionResponse(fullText);
      if (!parsed) throw new Error("Could not parse AI response");

      let appliedCount = 0;
      // Process high-level intents first (deterministic compiler)
      if (parsed.intents) {
        for (const intent of parsed.intents) {
          const result = editorStore.applyAIIntent(intent, editorScope);
          appliedCount += result.applied.length;
        }
      }
      // Then apply raw patch ops
      if (parsed.patchOps && parsed.patchOps.length > 0) {
        const result = editorStore.applyAIPatch(parsed.patchOps, editorScope);
        appliedCount += result.applied.length;
      }

      if (appliedCount > 0) {
        const entry: RevisionEntry = {
          id: Date.now().toString(),
          instruction: revisionPrompt,
          scope: revisionScope,
          timestamp: Date.now(),
          changes: { _layerPatches: appliedCount } as unknown as Partial<CardConfig>,
        };
        setRevisionHistory(prev => [entry, ...prev].slice(0, 20));
      }
      setRevisionPrompt("");
    } catch (err) {
      console.error("AI editor revision error:", err);
    } finally {
      setIsRevising(false);
      editorStore.setAIProcessing(false);
    }
  }, [revisionPrompt, revisionScope, editorStore]);

  /**
   * Smart router: element-specific requests always go through the editor (layer-level)
   * path regardless of whether editor mode is currently active.
   * Global requests use the appropriate path based on current mode.
   */
  const handleSmartRevision = useCallback(async () => {
    if (!revisionPrompt.trim()) return;
    const needsLayerLevel = isElementSpecificRequest(revisionPrompt);
    if (needsLayerLevel) {
      // Ensure the editor document is populated before running the AI revision.
      // If editor mode wasn't active the doc may be empty — build it now.
      const hasDoc = Object.keys(editorStore.doc?.layersById ?? {}).length > 1;
      if (!hasDoc) {
        const freshDoc = cardConfigToDocument(config, { logoImg: logoImg ?? undefined });
        editorStore.setDoc(freshDoc);
      }
      // Activate editor mode so the canvas reflects the result
      setEditorMode(true);
      // Force element-specific scope so the AI targets only the named element's layers,
      // regardless of whatever scope the user currently has selected in the UI.
      await handleEditorRevision("element-specific");
    } else {
      if (editorMode) {
        await handleEditorRevision();
      } else {
        await handleRevision();
      }
    }
  }, [revisionPrompt, isElementSpecificRequest, editorMode, config, logoImg, editorStore, handleEditorRevision, handleRevision]);

  /* ==================================================================
     BATCH PROCESSING - Same design, many employees
     ================================================================== */
  const addBatchEntry = useCallback(() => {
    setBatchEntries(prev => [
      ...prev,
      { id: Date.now().toString(), name: "", title: "", email: "", phone: "" },
    ]);
  }, []);

  const updateBatchEntry = useCallback((id: string, field: keyof ContactEntry, value: string) => {
    setBatchEntries(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
  }, []);

  const removeBatchEntry = useCallback((id: string) => {
    setBatchEntries(prev => prev.length > 1 ? prev.filter(e => e.id !== id) : prev);
  }, []);

  const exportBatchPdf = useCallback(async () => {
    const validEntries = batchEntries.filter(e => e.name.trim());
    if (validEntries.length === 0) return;
    setBatchExporting(true);
    setBatchProgress(0);

    try {
      const size = getCardSize();
      const cardWmm = config.cardStyle === "custom" ? config.customWidthMm : size.mmW;
      const cardHmm = config.cardStyle === "custom" ? config.customHeightMm : size.mmH;
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

      for (let i = 0; i < validEntries.length; i++) {
        const entry = validEntries[i];
        setBatchProgress(Math.round(((i + 1) / validEntries.length) * 100));

        // Front
        if (i > 0) pdf.addPage([pageW, pageH], pageW > pageH ? "l" : "p");
        const frontCanvas = renderBatchCard(config, entry, logoImg, "front", 2);
        const frontData = frontCanvas.toDataURL("image/png");
        pdf.addImage(frontData, "PNG", margin, margin, cardWmm, cardHmm);

        if (bleedInExport) {
          pdf.setDrawColor(0);
          pdf.setLineWidth(0.2);
          const x1 = margin, y1 = margin, x2 = margin + cardWmm, y2 = margin + cardHmm;
          pdf.line(x1, y1 - cropLen, x1, y1 - 1);
          pdf.line(x1 - cropLen, y1, x1 - 1, y1);
          pdf.line(x2, y1 - cropLen, x2, y1 - 1);
          pdf.line(x2 + 1, y1, x2 + cropLen, y1);
          pdf.line(x1, y2 + 1, x1, y2 + cropLen);
          pdf.line(x1 - cropLen, y2, x1 - 1, y2);
          pdf.line(x2, y2 + 1, x2, y2 + cropLen);
          pdf.line(x2 + 1, y2, x2 + cropLen, y2);
        }

        // Add name label for print shop
        pdf.setFontSize(7);
        pdf.setTextColor(150);
        pdf.text(`${entry.name} - Front`, margin, margin - 2);

        // Back
        pdf.addPage([pageW, pageH], pageW > pageH ? "l" : "p");
        const backCanvas = renderBatchCard(config, entry, logoImg, "back", 2);
        const backData = backCanvas.toDataURL("image/png");
        pdf.addImage(backData, "PNG", margin, margin, cardWmm, cardHmm);
        pdf.setFontSize(7);
        pdf.setTextColor(150);
        pdf.text(`${entry.name} - Back`, margin, margin - 2);

        if (bleedInExport) {
          pdf.setDrawColor(0);
          pdf.setLineWidth(0.2);
          const x1 = margin, y1 = margin, x2 = margin + cardWmm, y2 = margin + cardHmm;
          pdf.line(x1, y1 - cropLen, x1, y1 - 1);
          pdf.line(x1 - cropLen, y1, x1 - 1, y1);
          pdf.line(x2, y1 - cropLen, x2, y1 - 1);
          pdf.line(x2 + 1, y1, x2 + cropLen, y1);
          pdf.line(x1, y2 + 1, x1, y2 + cropLen);
          pdf.line(x1 - cropLen, y2, x1 - 1, y2);
          pdf.line(x2, y2 + 1, x2, y2 + cropLen);
          pdf.line(x2 + 1, y2, x2 + cropLen, y2);
        }

        // Small delay to prevent UI freeze
        await new Promise(r => setTimeout(r, 10));
      }

      pdf.save(`business-cards-batch-${config.company || "team"}-${validEntries.length}pcs.pdf`);
    } catch (err) {
      console.error("Batch export error:", err);
    } finally {
      setBatchExporting(false);
      setBatchProgress(0);
    }
  }, [batchEntries, config, bleedInExport, getCardSize, logoImg]);

  // Single Export handlers
  const handleDownloadPng = useCallback(() => {
    // In editor mode, export directly from the editor store's document
    const offscreen = editorMode
      ? renderToCanvas(editorStore.doc, getExportScale())
      : (() => {
        const c = document.createElement("canvas");
        renderCardV2(c, config, logoImg, getExportScale());
        return c;
      })();
    if (config.qrCodeUrl) {
      const ctx2 = offscreen.getContext("2d");
      if (ctx2) {
        const logW = offscreen.width / 2;
        const logH = offscreen.height / 2;
        const qrSize = Math.min(logW, logH) * 0.14;
        if (config.side === "front") {
          drawQRPlaceholder(ctx2, logW - qrSize - logW * 0.06, logH - qrSize - logH * 0.1, qrSize, "#000000");
        } else {
          drawQRPlaceholder(ctx2, logW / 2 - qrSize / 2, logH * 0.65, qrSize, "#000000");
        }
      }
    }
    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-card-${config.name || "design"}-${config.side}-hires.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, "image/png");
  }, [config, logoImg, editorMode, editorStore.doc]);

  const handleCopyCanvas = useCallback(async () => {
    // Copy at Nx resolution for high-quality clipboard image
    const offscreen = editorMode
      ? renderToCanvas(editorStore.doc, getExportScale())
      : (() => {
        const c = document.createElement("canvas");
        renderCardV2(c, config, logoImg, getExportScale());
        return c;
      })();
    if (config.qrCodeUrl) {
      const ctx2 = offscreen.getContext("2d");
      if (ctx2) {
        const logW = offscreen.width / 2;
        const logH = offscreen.height / 2;
        const qrSize = Math.min(logW, logH) * 0.14;
        if (config.side === "front") {
          drawQRPlaceholder(ctx2, logW - qrSize - logW * 0.06, logH - qrSize - logH * 0.1, qrSize, "#000000");
        } else {
          drawQRPlaceholder(ctx2, logW / 2 - qrSize / 2, logH * 0.65, qrSize, "#000000");
        }
      }
    }
    try {
      offscreen.toBlob(async (blob) => {
        if (!blob) return;
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      }, "image/png");
    } catch { /* clipboard may not be available */ }
  }, [config, logoImg, editorMode, editorStore.doc]);

  const handleExportPdf = useCallback(() => {
    const size = getCardSize();
    const cardWmm = config.cardStyle === "custom" ? config.customWidthMm : size.mmW;
    const cardHmm = config.cardStyle === "custom" ? config.customHeightMm : size.mmH;
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
      if (!isFirst) pdf.addPage([pageW, pageH], pageW > pageH ? "l" : "p");
      // In editor mode for the current side, use the editor's live document
      const offscreen = (editorMode && side === config.side)
        ? renderToCanvas(editorStore.doc, getExportScale())
        : (() => {
          const c = document.createElement("canvas");
          renderCardV2(c, { ...config, side }, logoImg, getExportScale());
          return c;
        })();
      if (config.qrCodeUrl) {
        const ctx2 = offscreen.getContext("2d");
        if (ctx2) {
          const logW = offscreen.width / 2;
          const logH = offscreen.height / 2;
          const qrSize = Math.min(logW, logH) * 0.14;
          if (side === "front") {
            drawQRPlaceholder(ctx2, logW - qrSize - logW * 0.06, logH - qrSize - logH * 0.1, qrSize, "#000000");
          } else {
            drawQRPlaceholder(ctx2, logW / 2 - qrSize / 2, logH * 0.65, qrSize, "#000000");
          }
        }
      }
      pdf.addImage(offscreen.toDataURL("image/png"), "PNG", margin, margin, cardWmm, cardHmm);

      if (bleedInExport) {
        pdf.setDrawColor(0);
        pdf.setLineWidth(0.2);
        const x1 = margin, y1 = margin, x2 = margin + cardWmm, y2 = margin + cardHmm;
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
  }, [config, bleedInExport, getCardSize, logoImg, editorMode, editorStore.doc]);

  const currentSize = getCardSize();
  const displayW = Math.min(480, currentSize.w);
  const displayH = displayW * (currentSize.h / currentSize.w);

  /* ==================================================================
     LEFT PANEL - Settings & Controls
     ================================================================== */
  const leftPanel = (
    <div className="space-y-3">
      <Accordion defaultOpen="details">

        {/* ── Parametric Generator — Infinite Designs ─────────────────── */}
        <AccordionSection
          icon={<IconSparkles className="size-3.5" />}
          label="Infinite Designs"
          id="generator"
          badge={`${getCombinationCount().toLocaleString()} combos`}
        >
          <div className="space-y-3">
            {/* Combo count pill */}
            <p className="text-[0.5625rem] text-gray-400 leading-relaxed">
              Mix <span className="text-primary-400 font-semibold">{LAYOUT_RECIPES.length} layouts</span>
              {" × "}
              <span className="text-secondary-400 font-semibold">{CARD_THEMES.length} themes</span>
              {" × "}
              <span className="text-primary-300 font-semibold">{ACCENT_KITS.length} accent kits</span>
              {" = "}
              <span className="text-white font-bold">{getCombinationCount().toLocaleString()}</span> base designs.
            </p>

            {/* Layout Recipe */}
            <div>
              <label className="block text-[0.625rem] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Layout Recipe</label>
              <select
                value={genRecipeId}
                onChange={(e) => setGenRecipeId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {LAYOUT_RECIPES.map(r => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
              <p className="mt-0.5 text-[0.5rem] text-gray-500 truncate">
                {LAYOUT_RECIPES.find(r => r.id === genRecipeId)?.description ?? ""}
              </p>
            </div>

            {/* Card Theme */}
            <div>
              <label className="block text-[0.625rem] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Theme</label>
              <select
                value={genThemeId}
                onChange={(e) => setGenThemeId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {CARD_THEMES.map(t => (
                  <option key={t.id} value={t.id}>{t.label} — {t.mood}</option>
                ))}
              </select>
            </div>

            {/* Accent Kit */}
            <div>
              <label className="block text-[0.625rem] font-semibold text-gray-400 mb-1 uppercase tracking-wide">Accent Kit</label>
              <select
                value={genAccentKitId}
                onChange={(e) => setGenAccentKitId(e.target.value)}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              >
                {ACCENT_KITS.map(k => (
                  <option key={k.id} value={k.id}>{k.label}</option>
                ))}
              </select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleSuggestDesign}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-400 hover:text-white hover:border-primary-500/50 hover:bg-primary-500/10 text-xs font-medium transition-all"
              >
                <IconRefresh className="size-3" />
                Suggest
              </button>
              <button
                onClick={() => applyGeneratorDesign(genRecipeId, genThemeId, genAccentKitId)}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary-500 hover:bg-primary-400 text-gray-950 text-xs font-semibold transition-all"
              >
                <IconSparkles className="size-3" />
                Apply Design
              </button>
            </div>
          </div>
        </AccordionSection>

        {/* Templates Section */}
        <AccordionSection icon={<IconLayout className="size-3.5" />} label="Templates" id="templates" badge={filteredTemplates.length}>
          <div className="space-y-2">
            {/* Category filter */}
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setTemplateFilter("all")}
                className={`px-2 py-1 rounded-lg text-[0.625rem] font-semibold transition-all ${templateFilter === "all" ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-gray-300"}`}
              >
                All ({TEMPLATES.length})
              </button>
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setTemplateFilter(cat.id)}
                  className={`px-2 py-1 rounded-lg text-[0.625rem] font-semibold transition-all ${templateFilter === cat.id ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-400 border border-gray-200 dark:border-gray-700 hover:text-gray-300"}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Template slider */}
            <TemplateSlider
              templates={templatePreviews}
              activeId={config.template}
              onSelect={(id) => {
                const theme = TEMPLATE_DEFAULT_THEMES[id];
                if (theme) {
                  updateConfig({
                    template: id,
                    primaryColor: theme.primary,
                    secondaryColor: theme.secondary,
                    textColor: theme.text,
                    bgColor: theme.bg,
                    patternType: theme.pattern,
                    fontStyle: theme.font,
                  });
                } else {
                  updateConfig({ template: id });
                }
              }}
              thumbWidth={120}
              thumbHeight={72}
              label=""
            />

            {/* Active template name */}
            <p className="text-[0.5625rem] text-gray-400 text-center">
              Active: <span className="text-primary-500 font-semibold">{TEMPLATES.find(t => t.id === config.template)?.label}</span>
              {" \u2014 "}
              <span className="text-gray-500">{TEMPLATES.find(t => t.id === config.template)?.desc}</span>
            </p>
          </div>
        </AccordionSection>

        {/* Contact Details */}
        <AccordionSection icon={<IconType className="size-3.5" />} label="Contact Details" id="details">
          <div className="space-y-2">
            {([
              { key: "name" as const, placeholder: "Full Name", type: "text" },
              { key: "title" as const, placeholder: "Job Title / Position", type: "text" },
              { key: "company" as const, placeholder: "Company / Organization", type: "text" },
              { key: "tagline" as const, placeholder: "Tagline (optional)", type: "text" },
            ]).map(({ key, placeholder, type }) => (
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
              <input type="email" placeholder="Email" value={config.email}
                onChange={(e) => updateConfig({ email: e.target.value })}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              <input type="tel" placeholder="Phone" value={config.phone}
                onChange={(e) => updateConfig({ phone: e.target.value })}
                className="h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
            </div>
            <input type="text" placeholder="Website" value={config.website}
              onChange={(e) => updateConfig({ website: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <input type="text" placeholder="Address (optional)" value={config.address}
              onChange={(e) => updateConfig({ address: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
            <div className="pt-1">
              <label className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1 block">QR Code URL</label>
              <input type="url" placeholder="https://yoursite.com" value={config.qrCodeUrl}
                onChange={(e) => updateConfig({ qrCodeUrl: e.target.value })}
                className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
              />
              {config.qrCodeUrl && <p className="text-[0.5rem] text-primary-500 mt-0.5">{"\u2713"} QR code will appear on card</p>}
            </div>
          </div>
        </AccordionSection>

        {/* Logo & Branding */}
        <AccordionSection icon={<IconCamera className="size-3.5" />} label="Logo & Branding" id="logo">
          <div className="space-y-2">
            <label className="flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800/30 cursor-pointer hover:border-primary-500 dark:hover:border-primary-500 transition-colors">
              <IconCamera className="size-4 text-gray-400" />
              <span className="text-xs text-gray-400">{config.logoUrl ? "Change logo..." : "Upload logo..."}</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
            {config.logoUrl && (
              <div className="flex items-center gap-2">
                <div className="size-10 rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.logoUrl} alt="Logo" className="size-full object-contain" />
                </div>
                <button onClick={() => updateConfig({ logoUrl: "" })} className="text-xs text-error-500 hover:text-error-400 transition-colors">Remove</button>
              </div>
            )}
            <input type="url" placeholder="Or paste logo URL..."
              value={config.logoUrl.startsWith("data:") ? "" : config.logoUrl}
              onChange={(e) => updateConfig({ logoUrl: e.target.value })}
              className="w-full h-9 px-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all"
            />
          </div>
        </AccordionSection>

        {/* Style & Colors */}
        <AccordionSection icon={<IconDroplet className="size-3.5" />} label="Style & Colors" id="style">
          <div className="space-y-3">
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400">Color Theme</p>
            <div className="grid grid-cols-4 gap-1.5">
              {COLOR_PRESETS.map((theme) => (
                <button key={theme.name}
                  onClick={() => updateConfig({ primaryColor: theme.primary, secondaryColor: theme.secondary, textColor: theme.text, bgColor: theme.bg })}
                  className={`p-1.5 rounded-lg border text-center transition-all ${
                    config.primaryColor === theme.primary && config.bgColor === theme.bg
                      ? "border-primary-500 ring-1 ring-primary-500/30"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="flex gap-0.5 justify-center mb-0.5">
                    <div className="size-3 rounded-full" style={{ backgroundColor: theme.primary }} />
                    <div className="size-3 rounded-full" style={{ backgroundColor: theme.bg }} />
                  </div>
                  <span className="text-[0.5rem] text-gray-400">{theme.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {([
                { key: "primaryColor" as const, label: "Primary" },
                { key: "secondaryColor" as const, label: "2nd" },
                { key: "bgColor" as const, label: "BG" },
                { key: "textColor" as const, label: "Text" },
              ]).map(({ key, label }) => (
                <label key={key} className="flex items-center gap-1 cursor-pointer">
                  <input type="color" value={config[key]}
                    onChange={(e) => updateConfig({ [key]: e.target.value })}
                    className="size-6 rounded border border-gray-200 dark:border-gray-700 cursor-pointer bg-transparent"
                  />
                  <span className="text-[0.5625rem] text-gray-400">{label}</span>
                </label>
              ))}
            </div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Typography</p>
            <div className="flex flex-wrap gap-1.5">
              {(["modern", "classic", "bold", "elegant", "minimal"] as const).map((style) => (
                <button key={style}
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
              ))}
            </div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 pt-1">Pattern</p>
            <div className="flex flex-wrap gap-1">
              {PATTERN_OPTIONS.map((p) => (
                <button key={p.id}
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
              <input type="checkbox" checked={config.showContactIcons}
                onChange={(e) => updateConfig({ showContactIcons: e.target.checked })}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">Show contact icons</span>
            </label>
          </div>
        </AccordionSection>

        {/* Card Size & Print */}
        <AccordionSection icon={<IconMaximize className="size-3.5" />} label="Card Size & Print" id="size">
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-1">
              {(["standard", "eu", "jp", "square", "rounded", "custom"] as const).map((s) => (
                <button key={s}
                  onClick={() => updateConfig({ cardStyle: s })}
                  className={`px-2 py-1.5 rounded-xl border text-[0.625rem] font-semibold uppercase transition-all ${
                    config.cardStyle === s
                      ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30"
                      : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {s === "standard" ? "US" : s === "eu" ? "EU" : s === "jp" ? "JP" : s}
                </button>
              ))}
            </div>
            {config.cardStyle === "custom" && (
              <div className="flex gap-2 items-center">
                <div className="flex-1">
                  <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">Width (mm)</label>
                  <input type="number" min={30} max={200} value={config.customWidthMm}
                    onChange={(e) => updateConfig({ customWidthMm: Math.max(30, Math.min(200, Number(e.target.value) || 89)) })}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center"
                  />
                </div>
                <span className="text-gray-400 text-xs pt-4">{"\u00d7"}</span>
                <div className="flex-1">
                  <label className="text-[0.5625rem] text-gray-400 mb-0.5 block">Height (mm)</label>
                  <input type="number" min={30} max={200} value={config.customHeightMm}
                    onChange={(e) => updateConfig({ customHeightMm: Math.max(30, Math.min(200, Number(e.target.value) || 51)) })}
                    className="w-full h-8 px-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs text-center"
                  />
                </div>
              </div>
            )}
            {/* Front / Back / Both */}
            <div className="flex gap-1.5">
              <button onClick={() => updateConfig({ side: "front" })}
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${config.side === "front" ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Front</button>
              <button onClick={() => updateConfig({ side: "back" })} disabled={frontOnly}
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${config.side === "back" ? "border-primary-500 bg-primary-500/5 text-primary-500 ring-1 ring-primary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Back</button>
              <button onClick={() => setSideBySide(!sideBySide)} disabled={frontOnly}
                className={`flex-1 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${sideBySide && !frontOnly ? "border-secondary-500 bg-secondary-500/5 text-secondary-500 ring-1 ring-secondary-500/30" : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400"}`}>Both</button>
            </div>
            {/* Front-only mode */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={frontOnly}
                onChange={(e) => {
                  setFrontOnly(e.target.checked);
                  if (e.target.checked) {
                    updateConfig({ side: "front" });
                    setSideBySide(false);
                  }
                }}
                className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500 focus:ring-primary-500/30"
              />
              <span className="text-xs text-gray-600 dark:text-gray-300">Front card only — no back needed</span>
            </label>
            {/* Back Style — hidden in front-only mode */}
            {!frontOnly && (
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider text-gray-400 mb-1">Back Design</p>
              <div className="flex flex-wrap gap-1">
                {(["logo-center", "pattern-fill", "minimal", "info-repeat", "gradient-brand"] as const).map((bs) => (
                  <button key={bs} onClick={() => updateConfig({ backStyle: bs })}
                    className={`px-2 py-1 rounded-lg border text-[0.5625rem] font-medium capitalize transition-all ${config.backStyle === bs ? "border-primary-500 bg-primary-500/5 text-primary-500" : "border-gray-200 dark:border-gray-700 text-gray-400"}`}
                  >
                    {bs.replace(/-/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            )}
            {/* Print options */}
            <div className="space-y-1.5 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showBleed} onChange={(e) => setShowBleed(e.target.checked)} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Show bleed area (3mm)</span>
                <span className="ml-auto size-2 rounded-full bg-error-500/40" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={showSafeZone} onChange={(e) => setShowSafeZone(e.target.checked)} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Show safe zone (5mm)</span>
                <span className="ml-auto size-2 rounded-full border border-dashed border-success-500/60" />
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={bleedInExport} onChange={(e) => setBleedInExport(e.target.checked)} className="size-3.5 rounded border-gray-300 dark:border-gray-600 text-primary-500" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Include crop marks in PDF</span>
              </label>
            </div>
          </div>
        </AccordionSection>

      </Accordion>

      {/* Advanced Settings — Global (shared across all document/print tools) */}
      <AdvancedSettingsPanel />

      {/* AI Design Director */}
      <div className="rounded-xl border border-secondary-500/20 bg-secondary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary-500 mb-2.5">
          <IconSparkles className="size-3.5" />
          AI Design Director
        </label>
        <button onClick={generateWithAI}
          disabled={(!config.name.trim() && !config.company.trim()) || isGenerating}
          className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-secondary-500 text-white text-xs font-bold hover:bg-secondary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isGenerating ? (<><IconLoader className="size-3.5 animate-spin" />Designing...</>) : (<><IconWand className="size-3.5" />Generate Premium Design</>)}
        </button>
        <p className="text-[0.5625rem] text-gray-400 text-center mt-1.5">AI suggests template, colors, typography, pattern & back design</p>
      </div>

      {/* AI Revision Engine */}
      <div className="rounded-xl border border-primary-500/20 bg-primary-500/5 p-3">
        <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary-500 mb-2">
          <IconWand className="size-3.5" />
          AI Revision Engine
        </label>
        <div className="space-y-2">
          {/* Scope selector */}
          <div className="flex flex-wrap gap-1">
            {([
              { value: "text-only" as RevisionScope, label: "Text" },
              { value: "colors-only" as RevisionScope, label: "Colors" },
              { value: "layout-only" as RevisionScope, label: "Layout" },
              { value: "element-specific" as RevisionScope, label: "Element" },
              { value: "full-redesign" as RevisionScope, label: "Full" },
            ]).map(({ value, label }) => (
              <button key={value} onClick={() => setRevisionScope(value)}
                className={`px-2 py-1 rounded-lg text-[0.5625rem] font-semibold transition-all ${revisionScope === value ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-400 border border-gray-200 dark:border-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Revision prompt */}
          <textarea
            placeholder="e.g. Make the text color warmer, change the pattern to dots, use a more elegant template..."
            value={revisionPrompt}
            onChange={(e) => setRevisionPrompt(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 text-gray-900 dark:text-white text-xs placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 transition-all resize-none"
          />
          <button onClick={handleSmartRevision}
            disabled={!revisionPrompt.trim() || isRevising}
            className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isRevising ? (<><IconLoader className="size-3.5 animate-spin" />Revising...</>) : (<><IconSparkles className="size-3.5" />Apply Revision</>)}
          </button>
          {/* Revision history */}
          {revisionHistory.length > 0 && (
            <div className="max-h-28 overflow-y-auto space-y-1 pt-1">
              <p className="text-[0.5625rem] font-semibold uppercase text-gray-400">Recent Revisions</p>
              {revisionHistory.slice(0, 5).map((rev) => (
                <div key={rev.id} className="flex items-start gap-1.5 text-[0.5rem] text-gray-500 bg-gray-800/30 rounded-lg px-2 py-1">
                  <IconCheck className="size-2.5 text-primary-500 shrink-0 mt-0.5" />
                  <span className="truncate">{rev.instruction}</span>
                  <span className="text-gray-600 shrink-0 ml-auto">{rev.scope.replace("-", " ")}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  /* ==================================================================
     RIGHT PANEL - Export, Batch, Info
     ================================================================== */
  const rightPanel = (
    <div className="space-y-3">
      {/* Export */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2.5">Export</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleDownloadPng}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-primary-500/30 bg-primary-500/5 text-primary-500 transition-colors hover:bg-primary-500/10">
            <IconDownload className="size-4" /><span className="text-xs font-semibold">.png</span>
          </button>
          <button onClick={handleCopyCanvas}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-secondary-500/30 bg-secondary-500/5 text-secondary-500 transition-colors hover:bg-secondary-500/10">
            <IconCopy className="size-4" /><span className="text-xs font-semibold">Clipboard</span>
          </button>
          <button onClick={handleExportPdf}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-info-500/30 bg-info-500/5 text-info-500 transition-colors hover:bg-info-500/10">
            <IconPrinter className="size-4" /><span className="text-xs font-semibold">.pdf</span>
          </button>
          <button onClick={() => updateConfig({ side: config.side === "front" ? "back" : "front" })}
            className="flex flex-col items-center gap-1 p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
            <IconRefresh className="size-4" /><span className="text-xs font-semibold">Flip</span>
          </button>
        </div>
      </div>

      {/* Batch Processing */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <IconUsers className="size-3.5" />
            Team Batch
          </h3>
          <button onClick={() => setBatchMode(!batchMode)}
            className={`px-2 py-1 rounded-lg text-[0.625rem] font-semibold transition-all ${batchMode ? "bg-primary-500/10 text-primary-500 border border-primary-500/30" : "text-gray-400 border border-gray-200 dark:border-gray-700"}`}
          >
            {batchMode ? "Close" : "Open"}
          </button>
        </div>
        {batchMode && (
          <div className="space-y-2">
            <p className="text-[0.5625rem] text-gray-400">
              Same card design for multiple team members. Fill in each person&apos;s details, then batch export all cards as a single print-ready PDF.
            </p>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
              {batchEntries.map((entry, idx) => (
                <div key={entry.id} className="rounded-lg border border-gray-700/50 bg-gray-800/30 p-2 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[0.5625rem] font-bold text-primary-500">Person {idx + 1}</span>
                    {batchEntries.length > 1 && (
                      <button onClick={() => removeBatchEntry(entry.id)} className="p-0.5 text-gray-500 hover:text-error-500 transition-colors">
                        <IconTrash className="size-3" />
                      </button>
                    )}
                  </div>
                  <input type="text" placeholder="Full Name *" value={entry.name}
                    onChange={(e) => updateBatchEntry(entry.id, "name", e.target.value)}
                    className="w-full h-7 px-2 rounded-lg border border-gray-700 bg-gray-800/50 text-white text-[0.625rem] placeholder:text-gray-500 focus:outline-none focus:border-primary-500 transition-all"
                  />
                  <input type="text" placeholder="Job Title" value={entry.title}
                    onChange={(e) => updateBatchEntry(entry.id, "title", e.target.value)}
                    className="w-full h-7 px-2 rounded-lg border border-gray-700 bg-gray-800/50 text-white text-[0.625rem] placeholder:text-gray-500 focus:outline-none focus:border-primary-500 transition-all"
                  />
                  <div className="grid grid-cols-2 gap-1">
                    <input type="email" placeholder="Email" value={entry.email}
                      onChange={(e) => updateBatchEntry(entry.id, "email", e.target.value)}
                      className="h-7 px-2 rounded-lg border border-gray-700 bg-gray-800/50 text-white text-[0.625rem] placeholder:text-gray-500 focus:outline-none focus:border-primary-500 transition-all"
                    />
                    <input type="tel" placeholder="Phone" value={entry.phone}
                      onChange={(e) => updateBatchEntry(entry.id, "phone", e.target.value)}
                      className="h-7 px-2 rounded-lg border border-gray-700 bg-gray-800/50 text-white text-[0.625rem] placeholder:text-gray-500 focus:outline-none focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={addBatchEntry}
              className="w-full flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-gray-600 text-gray-400 text-xs hover:border-primary-500 hover:text-primary-500 transition-colors">
              <IconPlus className="size-3" /> Add Person
            </button>
            {/* CSV / Excel import — auto-populates all entries from a spreadsheet */}
            <div className="flex items-center gap-1.5">
              <label className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border border-dashed border-secondary-500/40 text-secondary-500 text-xs hover:bg-secondary-500/5 cursor-pointer transition-colors">
                <IconDownload className="size-3 rotate-180" />
                Import CSV / Excel
                <input type="file" accept=".csv,.txt" onChange={handleCsvImport} className="sr-only" />
              </label>
              <a
                href={`data:text/csv;charset=utf-8,${encodeURIComponent("Name,Title,Email,Phone\nJohn Doe,CEO,john@company.com,+260 977 000 001\nJane Smith,CTO,jane@company.com,+260 977 000 002")}`}
                download="batch-template.csv"
                className="px-2.5 py-1.5 rounded-lg border border-gray-700 text-gray-400 text-[0.5625rem] hover:text-gray-200 hover:border-gray-500 transition-colors whitespace-nowrap"
                title="Download a CSV template you can fill in and re-import"
              >
                Template ↓
              </a>
            </div>
            <button onClick={exportBatchPdf}
              disabled={batchExporting || batchEntries.filter(e => e.name.trim()).length === 0}
              className="w-full flex items-center justify-center gap-2 h-9 rounded-xl bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {batchExporting ? (
                <><IconLoader className="size-3.5 animate-spin" />{batchProgress}% Generating...</>
              ) : (
                <><IconDownload className="size-3.5" />Export All ({batchEntries.filter(e => e.name.trim()).length} cards) as PDF</>
              )}
            </button>
            {batchExporting && (
              <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                <div className="bg-primary-500 h-full rounded-full transition-all duration-300" style={{ width: `${batchProgress}%` }} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Card Info */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Card Info</h3>
        <div className="space-y-1 text-xs text-gray-400">
          <p>Size: <span className="text-gray-300">{currentSize.label}</span></p>
          <p>Template: <span className="text-gray-300">{TEMPLATES.find(t => t.id === config.template)?.label}</span></p>
          <p>Font: <span className="text-gray-300 capitalize">{config.fontStyle}</span></p>
          <p>Pattern: <span className="text-gray-300 capitalize">{config.patternType}</span></p>
          <p>Back: <span className="text-gray-300 capitalize">{config.backStyle.replace(/-/g, " ")}</span></p>
          <p>Side: <span className="text-gray-300 capitalize">{config.side}</span></p>
          <p>Canvas: <span className="text-gray-300">{currentSize.w}{"\u00d7"}{currentSize.h}px</span></p>
          <p>Export: <span className="text-primary-500 font-semibold">{currentSize.w * getExportScale()}{"\u00d7"}{currentSize.h * getExportScale()}px ({getExportScale() * 300} DPI)</span></p>
          <p>Quality: <span className="text-primary-500 font-semibold">Print-Ready</span></p>
        </div>
      </div>

      {/* Side-by-side preview */}
      {sideBySide && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {config.side === "front" ? "Back Side" : "Front Side"}
          </h3>
          <div className="bg-gray-100 dark:bg-gray-800/50 rounded-lg p-2">
            <canvas ref={backCanvasRef} className="w-full h-auto rounded" style={{ aspectRatio: currentSize.ratio }} />
          </div>
        </div>
      )}
    </div>
  );

  // Toolbar
  const toolbar = editorMode ? (
    <div className="flex items-center gap-2">
      <EditorToolbar />
      <div className="h-5 w-px bg-gray-700" />
      <button
        onClick={() => setEditorMode(false)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-gray-700 text-gray-400 text-xs font-medium hover:bg-gray-800 hover:text-gray-200 transition-colors"
      >
        Exit Editor
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400 capitalize">{config.side}</span>
      <span className="text-gray-600 dark:text-gray-600">{"\u00b7"}</span>
      <span className="text-xs text-gray-500">{TEMPLATES.find(t => t.id === config.template)?.label}</span>
      <span className="text-gray-600 dark:text-gray-600">{"\u00b7"}</span>
      <span className="text-xs text-gray-500">{currentSize.label}</span>
      <span className="text-gray-600 dark:text-gray-600">{"\u00b7"}</span>
      <button
        onClick={() => setEditorMode(true)}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary-500/10 text-primary-400 text-xs font-medium hover:bg-primary-500/20 transition-colors border border-primary-500/20"
      >
        <IconLayout className="size-3" />
        Edit Layers
      </button>
    </div>
  );

  // Right panel — add layers + properties panels when in editor mode
  const editorRightPanel = editorMode ? (
    <div className="space-y-3">
      {/* Element Colors — quick per-element color overrides */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
          Element Colors
        </h3>
        <BusinessCardLayerQuickEdit />
      </div>
      {/* Layers Panel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Layers</h3>
        <LayersListPanel />
      </div>
      {/* Properties Panel */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Properties</h3>
        <LayerPropertiesPanel />
      </div>
      {/* Original right panel content (export, batch, info) */}
      {rightPanel}
    </div>
  ) : rightPanel;

  return (
    <StickyCanvasLayout
      leftPanel={leftPanel}
      rightPanel={editorRightPanel}
      {...(editorMode
        ? {
          canvasSlot: (
            <CanvasEditor
              className="w-full h-full"
              showBleedSafe={showBleed || showSafeZone}
              workspaceBg="#1e1e2e"
            />
          ),
        }
        : {
          canvasRef: canvasRef,
          displayWidth: displayW,
          displayHeight: displayH,
          zoom: zoom,
          onZoomIn: () => setZoom((z) => Math.min(z + 0.25, 3)),
          onZoomOut: () => setZoom((z) => Math.max(z - 0.25, 0.25)),
          onZoomFit: () => setZoom(1),
        }
      )}
      label={`${currentSize.label} \u00b7 Export: ${currentSize.w * getExportScale()}\u00d7${currentSize.h * getExportScale()}px \u00b7 ${getExportScale() * 300} DPI`}
      toolbar={toolbar}
      mobileTabs={["Canvas", "Settings"]}
      actionsBar={
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadPng}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-gray-950 text-xs font-bold hover:bg-primary-400 transition-colors">
            <IconDownload className="size-3" />Download PNG
          </button>
          <button onClick={handleExportPdf}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconPrinter className="size-3" />PDF
          </button>
          <button onClick={handleCopyCanvas}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 text-xs font-medium hover:bg-gray-800 transition-colors">
            <IconCopy className="size-3" />Copy
          </button>
        </div>
      }
    />
  );
}
