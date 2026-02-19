// =============================================================================
// DMSuite — Business Card Adapter
// Converts CardConfig → DesignDocumentV2 with fully semantic, AI-targetable
// layers. Every text, icon, logo, shape, and decorative element becomes a
// separate layer with tags for AI revision.
//
// This is the M2 reference implementation for workspace→vNext migration.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2,
  TextLayerV2, ShapeLayerV2,
  RGBA, Paint, GradientPaint, GradientStop, StrokeSpec, PatternPaint,
  Matrix2D,
} from "./schema";
import {
  createDocumentV2, addLayer, updateLayer,
  createTextLayerV2, createShapeLayerV2, createIconLayerV2,
  createImageLayerV2, createPathLayerV2,
  hexToRGBA, solidPaintHex,
} from "./schema";
import { getAdvancedSettings, scaledFontSize, scaledIconSize, scaledIconGap, scaledElementGap } from "@/stores/advanced-helpers";
import type { AbstractLayerConfig } from "./abstract-library";
import { ABSTRACT_REGISTRY, buildAbstractAsset } from "./abstract-library";

// =============================================================================
// 1.  Re-exported Types (standalone — avoids circular deps with workspace)
// =============================================================================

export interface CardConfig {
  name: string;
  title: string;
  company: string;
  tagline: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  /* Social Media */
  linkedin: string;
  twitter: string;
  instagram: string;
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
  backStyle: "logo-center" | "pattern-fill" | "minimal" | "info-repeat" | "gradient-brand";
  /** Abstract decorative assets placed on the card (behind or above content) */
  abstractAssets?: AbstractLayerConfig[];
}

export interface ContactEntry {
  type: "phone" | "email" | "website" | "address" | "linkedin" | "twitter" | "instagram";
  value: string;
  iconId: string;
}

// =============================================================================
// 2.  Constants
// =============================================================================

export const MM_PX = 300 / 25.4;
export const BLEED_MM = 3;
export const SAFE_MM = 5;

export const CARD_SIZES: Record<string, { w: number; h: number; label: string; mmW: number; mmH: number }> = {
  standard: { w: 1050, h: 600, label: "US Standard (3.5×2\")", mmW: 89, mmH: 51 },
  eu:       { w: 1012, h: 638, label: "EU/ISO (85×54mm)",       mmW: 85, mmH: 54 },
  jp:       { w: 1087, h: 661, label: "Japan (91×55mm)",        mmW: 91, mmH: 55 },
  square:   { w: 750,  h: 750, label: "Square (2.5×2.5\")",     mmW: 63, mmH: 63 },
  rounded:  { w: 1050, h: 600, label: "Rounded (3.5×2\")",      mmW: 89, mmH: 51 },
};

export const FONT_FAMILIES: Record<string, string> = {
  modern:  "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
  classic: "'Georgia', 'Garamond', 'Times New Roman', serif",
  bold:    "'Montserrat', 'Arial Black', 'Impact', sans-serif",
  elegant: "'Playfair Display', 'Didot', 'Bodoni MT', serif",
  minimal: "'Helvetica Neue', 'Helvetica', Arial, sans-serif",
};

export const COLOR_PRESETS = [
  { name: "Lime Pro",    primary: "#8ae600", secondary: "#6bb800", text: "#1a1a2e", bg: "#ffffff" },
  { name: "Navy",        primary: "#1e3a5f", secondary: "#4a90d9", text: "#ffffff", bg: "#0f1c2e" },
  { name: "Charcoal",    primary: "#333333", secondary: "#666666", text: "#ffffff", bg: "#1a1a1a" },
  { name: "Midnight",    primary: "#6c5ce7", secondary: "#a29bfe", text: "#e8e8e8", bg: "#0a0a1a" },
  { name: "Gold Rush",   primary: "#d4af37", secondary: "#f4e5b2", text: "#1a1410", bg: "#faf8f5" },
  { name: "Forest",      primary: "#2d6a4f", secondary: "#52b788", text: "#ffffff", bg: "#1b4332" },
  { name: "Ocean",       primary: "#0077b6", secondary: "#00b4d8", text: "#ffffff", bg: "#023e8a" },
  { name: "White Linen", primary: "#6b705c", secondary: "#a5a58d", text: "#3a3a3a", bg: "#fefae0" },
  { name: "Burgundy",    primary: "#800020", secondary: "#c41e3a", text: "#f5f0e1", bg: "#1a0a10" },
  { name: "Slate",       primary: "#64748b", secondary: "#94a3b8", text: "#e2e8f0", bg: "#1e293b" },
  { name: "Coral",       primary: "#ff6b6b", secondary: "#ffa07a", text: "#ffffff", bg: "#2d2d2d" },
  { name: "Sage",        primary: "#6b8f71", secondary: "#a3c9a8", text: "#2d2d2d", bg: "#f0f5f1" },
];

export const TEMPLATE_DEFAULT_THEMES: Record<string, {
  primary: string; secondary: string; text: string; bg: string;
  pattern: string; font: CardConfig["fontStyle"];
}> = {
  "executive-clean":   { primary: "#2c3e50", secondary: "#7f8c8d", text: "#2c3e50", bg: "#faf8f5", pattern: "none", font: "modern" },
  "swiss-grid":        { primary: "#e63946", secondary: "#457b9d", text: "#1d3557", bg: "#f1faee", pattern: "none", font: "bold" },
  "mono-type":         { primary: "#111111", secondary: "#555555", text: "#111111", bg: "#ffffff", pattern: "none", font: "minimal" },
  "nordic-frost":      { primary: "#5e81ac", secondary: "#88c0d0", text: "#2e3440", bg: "#eceff4", pattern: "none", font: "elegant" },
  "bold-split":        { primary: "#ff6347", secondary: "#ffa07a", text: "#ffffff", bg: "#1a2332", pattern: "dots", font: "bold" },
  "neon-edge":         { primary: "#00ff87", secondary: "#60efff", text: "#e8e8e8", bg: "#0a0a0a", pattern: "none", font: "modern" },
  "geometric-modern":  { primary: "#6c5ce7", secondary: "#a29bfe", text: "#ffffff", bg: "#2d3436", pattern: "none", font: "bold" },
  "gradient-wave":     { primary: "#ff6b6b", secondary: "#feca57", text: "#ffffff", bg: "#1a1a2e", pattern: "waves", font: "modern" },
  "corporate-stripe":  { primary: "#1e3a5f", secondary: "#4a90d9", text: "#ffffff", bg: "#0f1c2e", pattern: "lines", font: "classic" },
  "diplomat":          { primary: "#c9a227", secondary: "#e8d48b", text: "#1a1a1a", bg: "#f5f0e1", pattern: "none", font: "elegant" },
  "heritage-crest":    { primary: "#8b1a2b", secondary: "#c4a882", text: "#f5f0e1", bg: "#1e0f14", pattern: "none", font: "classic" },
  "engraved":          { primary: "#64748b", secondary: "#94a3b8", text: "#e2e8f0", bg: "#1e293b", pattern: "lines", font: "elegant" },
  "diagonal-cut":      { primary: "#ff006e", secondary: "#8338ec", text: "#ffffff", bg: "#14213d", pattern: "diagonal-lines", font: "bold" },
  "layered-card":      { primary: "#06d6a0", secondary: "#118ab2", text: "#ffffff", bg: "#073b4c", pattern: "none", font: "modern" },
  "photo-overlay":     { primary: "#f77f00", secondary: "#fcbf49", text: "#ffffff", bg: "#003049", pattern: "none", font: "bold" },
  "dot-matrix":        { primary: "#ef476f", secondary: "#ffd166", text: "#ffffff", bg: "#073b4c", pattern: "dots", font: "modern" },
  "gold-foil":         { primary: "#d4af37", secondary: "#f4e5b2", text: "#f5f0e1", bg: "#1a1410", pattern: "none", font: "elegant" },
  "marble-luxe":       { primary: "#2d2d2d", secondary: "#9e9e9e", text: "#2d2d2d", bg: "#f5f0eb", pattern: "none", font: "elegant" },
  "velvet-noir":       { primary: "#9b1b30", secondary: "#c41e3a", text: "#e8d5b7", bg: "#0a0a0a", pattern: "none", font: "elegant" },
  "art-deco":          { primary: "#d4af37", secondary: "#b8860b", text: "#f5f0e1", bg: "#1a1a2e", pattern: "diamond", font: "elegant" },
};

export const TEMPLATE_LIST = [
  { id: "executive-clean", label: "Executive Clean", category: "minimal" },
  { id: "swiss-grid",      label: "Swiss Grid",      category: "minimal" },
  { id: "mono-type",       label: "Mono Type",       category: "minimal" },
  { id: "nordic-frost",    label: "Nordic Frost",    category: "minimal" },
  { id: "bold-split",      label: "Bold Split",      category: "modern" },
  { id: "neon-edge",       label: "Neon Edge",       category: "modern" },
  { id: "geometric-modern",label: "Geometric",       category: "modern" },
  { id: "gradient-wave",   label: "Gradient Wave",   category: "modern" },
  { id: "corporate-stripe",label: "Corporate Stripe",category: "classic" },
  { id: "diplomat",        label: "Diplomat",         category: "classic" },
  { id: "heritage-crest",  label: "Heritage Crest",  category: "classic" },
  { id: "engraved",        label: "Engraved",        category: "classic" },
  { id: "diagonal-cut",    label: "Diagonal Cut",    category: "creative" },
  { id: "layered-card",    label: "Layered Card",    category: "creative" },
  { id: "photo-overlay",   label: "Photo Overlay",   category: "creative" },
  { id: "dot-matrix",      label: "Dot Matrix",      category: "creative" },
  { id: "gold-foil",       label: "Gold Foil",       category: "luxury" },
  { id: "marble-luxe",     label: "Marble Luxe",     category: "luxury" },
  { id: "velvet-noir",     label: "Velvet Noir",     category: "luxury" },
  { id: "art-deco",        label: "Art Deco",        category: "luxury" },
];

// Contact icon IDs: phone→"phone", email→"email", website→"globe", address→"map-pin"

// =============================================================================
// 3.  Helpers
// =============================================================================

function fontScale(W: number): number { return W / 1050; }

function getFontFamily(style: CardConfig["fontStyle"]): string {
  return FONT_FAMILIES[style] || FONT_FAMILIES.modern;
}

interface FontSizes {
  name: number; title: number; company: number; companyLg: number;
  contact: number; contactLg: number; tagline: number; label: number;
  nameXl: number; titleLg: number;
}

function getFontSizes(W: number): FontSizes {
  const s = fontScale(W);
  const adv = getAdvancedSettings();
  return {
    name:      scaledFontSize(Math.round(36 * s), "heading", adv),
    title:     scaledFontSize(Math.round(24 * s), "body", adv),
    company:   scaledFontSize(Math.round(22 * s), "body", adv),
    companyLg: scaledFontSize(Math.round(28 * s), "body", adv),
    contact:   scaledFontSize(Math.round(21 * s), "label", adv),
    contactLg: scaledFontSize(Math.round(23 * s), "label", adv),
    tagline:   scaledFontSize(Math.round(19 * s), "label", adv),
    label:     scaledFontSize(Math.round(17 * s), "label", adv),
    nameXl:    scaledFontSize(Math.round(42 * s), "heading", adv),
    titleLg:   scaledFontSize(Math.round(26 * s), "body", adv),
  };
}

// =============================================================================
// 3a. Auto-Fit / Overflow Prevention
// =============================================================================

/**
 * Calculates the optimal font size for a text string that fits within `maxWidth`.
 * Returns the smaller of `desiredSize` and the size that fits.
 * Uses a quick binary search instead of brute-force decrement.
 * Minimum returned size = 60% of desired to avoid unreadably small text.
 */
function autoFitFontSize(
  text: string,
  desiredSize: number,
  maxWidth: number,
  fontFamily: string,
  weight: number = 400,
): number {
  if (!text || maxWidth <= 0) return desiredSize;

  // Estimate text width using character-count heuristic (no canvas needed in SSR)
  // Average character width ≈ 0.55 × fontSize for sans-serif, 0.50 for serif
  const charWidthRatio = fontFamily.includes("serif") && !fontFamily.includes("sans") ? 0.50 : 0.55;
  const boldBoost = weight >= 700 ? 1.08 : 1.0;

  const estimatedWidth = text.length * desiredSize * charWidthRatio * boldBoost;
  if (estimatedWidth <= maxWidth) return desiredSize;

  // Scale down proportionally
  const scale = maxWidth / estimatedWidth;
  const minSize = Math.max(Math.round(desiredSize * 0.6), 14); // never below 60% or 14px
  return Math.max(Math.round(desiredSize * scale), minSize);
}

/**
 * Calculates the maximum number of contact lines that fit in the available vertical space.
 * Returns a capped count and adjusted gap if necessary.
 */
function fitContactBlock(
  entryCount: number,
  availableHeight: number,
  desiredGap: number,
  fontSize: number,
): { count: number; gap: number } {
  if (entryCount === 0) return { count: 0, gap: desiredGap };

  const lineHeight = fontSize * 1.2;
  const totalNeeded = entryCount * lineHeight + (entryCount - 1) * desiredGap;

  if (totalNeeded <= availableHeight) {
    return { count: entryCount, gap: desiredGap };
  }

  // Try reducing gap first (minimum gap = fontSize * 0.3)
  const minGap = fontSize * 0.3;
  const compactTotal = entryCount * lineHeight + (entryCount - 1) * minGap;
  if (compactTotal <= availableHeight) {
    const adjustedGap = Math.max(minGap, (availableHeight - entryCount * lineHeight) / Math.max(1, entryCount - 1));
    return { count: entryCount, gap: adjustedGap };
  }

  // Last resort: reduce the number of visible contact lines
  let maxFit = entryCount;
  while (maxFit > 1) {
    const needed = maxFit * lineHeight + (maxFit - 1) * minGap;
    if (needed <= availableHeight) break;
    maxFit--;
  }
  return { count: maxFit, gap: minGap };
}

function getContactEntries(cfg: CardConfig): ContactEntry[] {
  const entries: ContactEntry[] = [];
  if (cfg.phone)     entries.push({ type: "phone",     value: cfg.phone,     iconId: "phone" });
  if (cfg.email)     entries.push({ type: "email",     value: cfg.email,     iconId: "email" });
  if (cfg.website)   entries.push({ type: "website",   value: cfg.website,   iconId: "globe" });
  if (cfg.linkedin)  entries.push({ type: "linkedin",  value: cfg.linkedin,  iconId: "linkedin" });
  if (cfg.twitter)   entries.push({ type: "twitter",   value: cfg.twitter,   iconId: "twitter-x" });
  if (cfg.instagram) entries.push({ type: "instagram", value: cfg.instagram, iconId: "instagram" });
  if (cfg.address)   entries.push({ type: "address",   value: cfg.address,   iconId: "map-pin" });
  return entries;
}

/** Get a contrast color (white or dark) for a given hex background */
function getContrastColor(hex: string): string {
  const c = hexToRGBA(hex);
  const lum = (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255;
  return lum > 0.5 ? "#1a1a1a" : "#ffffff";
}

// --- Paint helpers ---

function lg(angleDeg: number, ...stops: [string, number, number?][]): GradientPaint {
  const rad = (angleDeg * Math.PI) / 180;
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  return { kind: "gradient", gradientType: "linear", stops: gradStops, transform, spread: "pad" };
}

function patternPaint(
  type: string, color: RGBA, opacity: number, spacing = 28
): PatternPaint {
  return {
    kind: "pattern",
    patternType: type as PatternPaint["patternType"],
    color,
    scale: 1,
    rotation: 0,
    opacity,
    spacing,
  };
}

function stroke(hex: string, width: number, alpha = 1): StrokeSpec {
  return {
    paint: solidPaintHex(hex, alpha),
    width,
    align: "center",
    dash: [],
    cap: "butt",
    join: "miter",
    miterLimit: 10,
  };
}

// --- Layer builder shortcuts ---

function textLayer(opts: {
  name: string; x: number; y: number; w: number; h?: number;
  text: string; fontSize: number; ff: string; weight?: number;
  color: string; alpha?: number; align?: "left" | "center" | "right";
  tags: string[]; uppercase?: boolean; italic?: boolean;
  letterSpacing?: number; lineHeight?: number;
  /** When true, automatically shrinks fontSize if text overflows w */
  autoFit?: boolean;
}): TextLayerV2 {
  // Auto-fit: shrink font if text would overflow the available width
  const effectiveSize = opts.autoFit
    ? autoFitFontSize(opts.text, opts.fontSize, opts.w, opts.ff, opts.weight ?? 400)
    : opts.fontSize;

  const layer = createTextLayerV2({
    name: opts.name,
    x: opts.x,
    y: opts.y,
    width: opts.w,
    height: opts.h ?? Math.round(effectiveSize * 1.6),
    text: opts.text,
    fontSize: effectiveSize,
    fontFamily: opts.ff,
    fontWeight: opts.weight ?? 400,
    color: hexToRGBA(opts.color, opts.alpha ?? 1),
    align: opts.align ?? "left",
    tags: opts.tags,
  });
  if (opts.uppercase) layer.defaultStyle.uppercase = true;
  if (opts.italic) layer.defaultStyle.italic = true;
  if (opts.letterSpacing !== undefined) layer.defaultStyle.letterSpacing = opts.letterSpacing;
  if (opts.lineHeight !== undefined) layer.defaultStyle.lineHeight = opts.lineHeight;
  return layer;
}

function rect(opts: {
  name: string; x: number; y: number; w: number; h: number;
  fill?: Paint; stroke?: StrokeSpec; tags?: string[];
  radii?: [number, number, number, number]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    shapeType: "rectangle",
    fill: opts.fill ?? solidPaintHex("#000000", 0),
    stroke: opts.stroke,
    cornerRadii: opts.radii,
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

function ellipse(opts: {
  name: string; cx: number; cy: number; rx: number; ry: number;
  fill?: Paint; tags?: string[]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: opts.fill ?? solidPaintHex("#000000", 0.1),
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

function line(opts: {
  name: string; x: number; y: number; w: number;
  color: string; alpha?: number; thickness?: number; tags?: string[];
}): ShapeLayerV2 {
  return createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y,
    width: opts.w, height: opts.thickness ?? 1.5,
    shapeType: "rectangle",
    fill: solidPaintHex(opts.color, opts.alpha ?? 0.2),
    tags: opts.tags ?? ["decorative", "divider"],
  });
}

// =============================================================================
// 4.  Contact Layers Builder
// =============================================================================

function buildContactLayers(
  cfg: CardConfig, x: number, startY: number, gap: number,
  align: "left" | "center" | "right",
  textColor: string, textAlpha: number,
  iconColor: string, iconAlpha: number,
  fontSize: number, ff: string, W: number
): LayerV2[] {
  const entries = getContactEntries(cfg);
  if (entries.length === 0) return [];

  const layers: LayerV2[] = [];
  const adv = getAdvancedSettings();
  const lineGap = scaledElementGap(gap, adv);
  const icoSize = scaledIconSize(Math.round(fontSize * 0.85), adv);
  const icoGap = scaledIconGap(Math.round(fontSize * 0.35), adv);

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const lineY = startY + i * lineGap;

    if (cfg.showContactIcons) {
      // Icon layer
      let iconX: number;
      let textX: number;
      let textW: number;

      if (align === "left") {
        iconX = x;
        textX = x + icoSize + icoGap;
        textW = W - textX - x;
      } else if (align === "right") {
        textX = 0;
        textW = x - icoSize - icoGap;
        iconX = x - icoSize;
      } else {
        // center — icon left of center text
        iconX = x - icoSize - icoGap;
        textX = x;
        textW = W;
      }

      layers.push({
        ...createIconLayerV2({
          name: `${entry.type} Icon`,
          x: iconX,
          y: lineY - icoSize / 2 + fontSize * 0.4,
          size: icoSize,
          iconId: entry.iconId,
          color: hexToRGBA(iconColor, iconAlpha),
          tags: [`icon-${entry.type}`, "contact-icon"],
        }),
      });

      layers.push(textLayer({
        name: `${entry.type}`,
        x: align === "center" ? 0 : textX,
        y: lineY,
        w: align === "center" ? W : textW,
        text: entry.value,
        fontSize,
        ff,
        weight: 400,
        color: textColor,
        alpha: textAlpha,
        align: align === "center" ? "center" : "left",
        tags: [`contact-${entry.type}`, "contact-text"],
      }));
    } else {
      layers.push(textLayer({
        name: `${entry.type}`,
        x: align === "center" ? 0 : (align === "right" ? 0 : x),
        y: lineY,
        w: align === "center" ? W : (align === "right" ? x : W - x),
        text: entry.value,
        fontSize,
        ff,
        weight: 400,
        color: textColor,
        alpha: textAlpha,
        align,
        tags: [`contact-${entry.type}`, "contact-text"],
      }));
    }
  }

  return layers;
}

// =============================================================================
// 5.  Logo Layer Builder
// =============================================================================

function buildLogoLayer(
  cfg: CardConfig, x: number, y: number, maxW: number, maxH: number,
  color: string, ff: string
): LayerV2 {
  if (cfg.logoUrl) {
    return createImageLayerV2({
      name: "Logo",
      x, y,
      width: maxW,
      height: maxH,
      imageRef: cfg.logoUrl,
      fit: "contain",
      tags: ["logo", "branding"],
    });
  }
  // Fallback: initials
  const initials = (cfg.company || cfg.name || "DM")
    .split(/\s+/)
    .map(w => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return textLayer({
    name: "Logo Initials",
    x, y,
    w: maxW,
    h: maxH,
    text: initials,
    fontSize: Math.round(Math.min(maxW, maxH) * 0.38),
    ff,
    weight: 700,
    color,
    align: "center",
    tags: ["logo", "branding", "logo-fallback"],
  });
}

// =============================================================================
// 6.  Pattern Overlay Layer
// =============================================================================

function buildPatternLayer(
  W: number, H: number, type: string, color: string, opacity: number, spacing = 28
): ShapeLayerV2 | null {
  if (!type || type === "none") return null;
  const layer = rect({
    name: "Pattern Overlay",
    x: 0, y: 0, w: W, h: H,
    fill: patternPaint(type, hexToRGBA(color), opacity, spacing),
    tags: ["pattern", "decorative"],
  });
  return layer;
}

// =============================================================================
// 6b. QR Code Layer Builder
// =============================================================================

function buildQrCodeLayer(
  W: number, H: number, cfg: CardConfig, side: "front" | "back"
): ShapeLayerV2 | null {
  if (!cfg.qrCodeUrl) return null;
  const qrSize = Math.round(Math.min(W, H) * 0.14);
  let x: number, y: number;
  if (side === "front") {
    x = W - qrSize - Math.round(W * 0.06);
    y = H - qrSize - Math.round(H * 0.1);
  } else {
    x = Math.round(W / 2 - qrSize / 2);
    y = Math.round(H * 0.65);
  }
  return rect({
    name: "QR Code",
    x, y, w: qrSize, h: qrSize,
    fill: solidPaintHex("#000000", 0.08),
    tags: ["qr-code", "branding", "contact-qr"],
    radii: [4, 4, 4, 4],
  });
}

// =============================================================================
// 7.  Template Layout Functions
// =============================================================================

type LayoutFn = (W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string) => LayerV2[];

// --- Minimal ---

function layoutExecutiveClean(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Warm gradient wash
  layers.push(rect({
    name: "Warm Gradient",
    x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.primaryColor, 0, 0.02], [cfg.bgColor, 0.5, 0], [cfg.secondaryColor, 1, 0.015]),
    tags: ["decorative", "background-gradient"],
  }));

  // Accent bar bottom-left
  layers.push(rect({
    name: "Accent Bar",
    x: mx, y: H - my, w: W * 0.15, h: 2.5,
    fill: lg(0, [cfg.primaryColor, 0], [cfg.primaryColor, 0.6, 0.1]),
    tags: ["decorative", "accent"],
  }));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.54, w: W * 0.85,
    color: cfg.primaryColor, alpha: 0.15,
  }));

  // Logo (top-right)
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, my + fs.company + 8, logoS, logoS, cfg.primaryColor, ff));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: my, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 600, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: my + fs.name + 8, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.textColor, alpha: 0.6, tags: ["title"],
  }));

  // Company (right-aligned)
  layers.push(textLayer({
    name: "Company", x: mx, y: my, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.company, ff, weight: 500, color: cfg.primaryColor, align: "right", tags: ["company"],
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.62, Math.round(fs.contact * 1.5), "left",
    cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W
  ));

  // Tagline
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx, y: H - my - 4, w: W - 2 * mx, text: cfg.tagline,
      fontSize: fs.tagline, ff, weight: 300, color: cfg.textColor, alpha: 0.35, align: "right", tags: ["tagline"],
    }));
  }

  return layers;
}

function layoutSwissGrid(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const layers: LayerV2[] = [];

  // Red accent bar top
  layers.push(rect({
    name: "Top Accent Bar", x: 0, y: 0, w: W * 0.35, h: 5,
    fill: solidPaintHex(cfg.primaryColor), tags: ["decorative", "accent"],
  }));

  // Grid line vertical
  layers.push(line({
    name: "Grid Line", x: W * 0.4, y: H * 0.1, w: 1.5,
    color: cfg.primaryColor, alpha: 0.1, thickness: H * 0.8,
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.18, w: W * 0.3, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 800, color: cfg.textColor, tags: ["name", "primary-text"], uppercase: true,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.18 + fs.name + 8, w: W * 0.3, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.08, logoS, logoS, cfg.primaryColor, ff));

  // Company
  layers.push(textLayer({
    name: "Company", x: W * 0.42, y: H * 0.18, w: W * 0.5, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.35, tags: ["company"], uppercase: true,
  }));

  // Contact (right side of grid)
  layers.push(...buildContactLayers(
    cfg, W * 0.42, H * 0.42, Math.round(fs.contact * 1.5), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  return layers;
}

function layoutMonoType(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const layers: LayerV2[] = [];

  // Minimal underline
  layers.push(line({
    name: "Underline", x: mx, y: H * 0.52, w: W * 0.3,
    color: cfg.primaryColor, alpha: 0.3,
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.28, w: W * 0.8, text: cfg.name || "Your Name",
    fontSize: fs.nameXl, ff, weight: 200, color: cfg.textColor, tags: ["name", "primary-text"],
    letterSpacing: 2,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.28 + fs.nameXl + 4, w: W * 0.8, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.textColor, alpha: 0.5, tags: ["title"],
    uppercase: true, letterSpacing: 3,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.62, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.55, cfg.primaryColor, 0.3, fs.contact, ff, W
  ));

  // Logo (bottom-right)
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H - mx - logoS, logoS, logoS, cfg.primaryColor, ff));

  return layers;
}

function layoutNordicFrost(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const layers: LayerV2[] = [];

  // Frost gradient
  layers.push(rect({
    name: "Frost Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(180, [cfg.primaryColor, 0, 0.03], [cfg.bgColor, 1, 0]),
    tags: ["decorative"],
  }));

  // Bottom accent
  layers.push(rect({
    name: "Bottom Accent", x: 0, y: H - 4, w: W, h: 4,
    fill: lg(0, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.2, w: W * 0.7, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 500, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.2 + fs.name + 8, w: W * 0.7, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 300, color: cfg.primaryColor, tags: ["title"], italic: true,
  }));

  // Logo
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.15, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.52, w: W - 2 * mx,
    color: cfg.primaryColor, alpha: 0.15,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.6, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Company (bottom-right)
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 500, color: cfg.textColor, alpha: 0.35, align: "right", tags: ["company"],
  }));

  return layers;
}

// --- Modern ---

function layoutBoldSplit(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const splitX = W * 0.42;
  const mx = splitX * 0.14;
  const rx = splitX + (W - splitX) * 0.1;
  const layers: LayerV2[] = [];
  const contrastC = getContrastColor(cfg.primaryColor);

  // Left panel gradient
  layers.push(rect({
    name: "Left Panel", x: 0, y: 0, w: splitX, h: H,
    fill: lg(180, [cfg.primaryColor, 0], [cfg.secondaryColor, 0.7, 0.85], [cfg.primaryColor, 1, 0.7]),
    tags: ["decorative", "panel"],
  }));

  // Decorative split lines
  layers.push(rect({
    name: "Split Line 1", x: splitX + 4, y: 0, w: 1.5, h: H,
    fill: solidPaintHex(cfg.primaryColor, 0.1), tags: ["decorative"],
  }));

  // Accent circles
  layers.push(ellipse({
    name: "Accent Circle 1", cx: W * 0.92, cy: H * 0.08, rx: W * 0.06, ry: W * 0.06,
    fill: solidPaintHex(cfg.primaryColor, 0.04), tags: ["decorative"],
  }));
  layers.push(ellipse({
    name: "Accent Circle 2", cx: W * 0.95, cy: H * 0.92, rx: W * 0.04, ry: W * 0.04,
    fill: solidPaintHex(cfg.secondaryColor, 0.03), tags: ["decorative"],
  }));

  // Logo (left panel)
  const logoS = splitX * 0.22;
  layers.push(buildLogoLayer(cfg, mx, H * 0.1, logoS, logoS, contrastC, ff));

  // Name (left panel)
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.48, w: splitX - 2 * mx, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: contrastC, tags: ["name", "primary-text"],
  }));

  // Title (left panel)
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.48 + fs.title + 8, w: splitX - 2 * mx, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: contrastC, alpha: 0.7, tags: ["title"],
  }));

  // Company (left panel bottom)
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: splitX - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: contrastC, alpha: 0.4, tags: ["company"], uppercase: true,
  }));

  // "CONTACT" label
  layers.push(textLayer({
    name: "Contact Label", x: rx, y: H * 0.18, w: W - rx - mx, text: "CONTACT",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3,
    tags: ["decorative", "label"], uppercase: true, letterSpacing: 3,
  }));

  // Divider
  layers.push(line({
    name: "Divider", x: rx, y: H * 0.23, w: W * 0.08,
    color: cfg.primaryColor, alpha: 0.5,
  }));

  // Contact (right panel)
  layers.push(...buildContactLayers(
    cfg, rx, H * 0.35, Math.round(fs.contactLg * 1.6), "left",
    cfg.textColor, 0.65, cfg.primaryColor, 0.45, fs.contactLg, ff, W
  ));

  // Tagline
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: rx, y: H * 0.92, w: W - rx - mx, text: cfg.tagline,
      fontSize: fs.tagline, ff, weight: 300, color: cfg.textColor, alpha: 0.25, tags: ["tagline"],
    }));
  }

  return layers;
}

function layoutNeonEdge(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Neon border glow
  layers.push(rect({
    name: "Neon Border", x: 8, y: 8, w: W - 16, h: H - 16,
    stroke: stroke(cfg.primaryColor, 2, 0.6), tags: ["decorative", "border"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.22, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.nameXl, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.22 + fs.nameXl + 4, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.15, logoS, logoS, cfg.primaryColor, ff));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.6, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W
  ));

  // Company (bottom-right)
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.primaryColor, alpha: 0.5, align: "right", tags: ["company"],
  }));

  return layers;
}

function layoutGeometricModern(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Large geometric circle
  layers.push(ellipse({
    name: "Geometric Circle", cx: W * 0.82, cy: H * 0.35, rx: W * 0.22, ry: W * 0.22,
    fill: solidPaintHex(cfg.primaryColor, 0.08), tags: ["decorative"],
  }));

  // Small accent circle
  layers.push(ellipse({
    name: "Small Circle", cx: W * 0.12, cy: H * 0.85, rx: W * 0.06, ry: W * 0.06,
    fill: solidPaintHex(cfg.secondaryColor, 0.06), tags: ["decorative"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.22, w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.22 + fs.name + 6, w: W * 0.55, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.15;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, mx, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.52, w: W * 0.4,
    color: cfg.primaryColor, alpha: 0.2,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.6, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3, tags: ["company"], uppercase: true,
  }));

  return layers;
}

function layoutGradientWave(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Wave gradient
  layers.push(rect({
    name: "Wave Gradient", x: 0, y: H * 0.6, w: W, h: H * 0.4,
    fill: lg(0, [cfg.primaryColor, 0, 0.15], [cfg.secondaryColor, 1, 0.08]),
    tags: ["decorative"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.2, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.2 + fs.name + 6, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.textColor, alpha: 0.7, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.15;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.12, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.52, w: W * 0.35,
    color: cfg.primaryColor, alpha: 0.3,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.6, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3, tags: ["company"], uppercase: true,
  }));

  return layers;
}

// --- Classic ---

function layoutCorporateStripe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.06;
  const layers: LayerV2[] = [];

  // Vertical stripe
  layers.push(rect({
    name: "Stripe", x: 0, y: 0, w: 10, h: H,
    fill: lg(90, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "stripe"],
  }));

  // Stripe glow
  layers.push(rect({
    name: "Stripe Glow", x: 10, y: 0, w: 4, h: H,
    fill: solidPaintHex(cfg.primaryColor, 0.06), tags: ["decorative"],
  }));

  // Logo
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.1, logoS, logoS, cfg.primaryColor, ff));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.3, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.3 + fs.title + 8, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.3 + fs.title + fs.company + 18, w: W * 0.6,
    text: cfg.company || "Company",
    fontSize: fs.company, ff, weight: 500, color: cfg.textColor, alpha: 0.4, tags: ["company"],
  }));

  // Divider
  layers.push(line({
    name: "Divider", x: mx, y: H * 0.58, w: W * 0.88,
    color: cfg.primaryColor, alpha: 0.15,
  }));

  // Contact (horizontal layout — unique to this template)
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.72, Math.round(fs.contact * 1.5), "left",
    cfg.textColor, 0.55, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  return layers;
}

function layoutDiplomat(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];

  // Top ornamental line
  layers.push(line({
    name: "Top Line", x: W * 0.2, y: H * 0.08, w: W * 0.6,
    color: cfg.primaryColor, alpha: 0.3,
  }));

  // Logo (centered top)
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.1, logoS, logoS, cfg.primaryColor, ff));

  // Name (centered)
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.38, w: W, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 500, color: cfg.textColor, align: "center", tags: ["name", "primary-text"],
  }));

  // Title (centered)
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.38 + fs.name + 6, w: W, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, align: "center", tags: ["title"],
  }));

  // Divider
  layers.push(line({
    name: "Divider", x: W * 0.3, y: H * 0.56, w: W * 0.4,
    color: cfg.primaryColor, alpha: 0.35,
  }));

  // Contact (centered)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.64, Math.round(fs.contact * 1.45), "center",
    cfg.textColor, 0.55, cfg.primaryColor, 0.35, fs.contact, ff, W
  ));

  // Company (bottom center)
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.92, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.primaryColor, alpha: 0.5, align: "center",
    tags: ["company"], uppercase: true, letterSpacing: 3,
  }));

  return layers;
}

function layoutHeritageCrest(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];

  // Top gradient bar
  layers.push(rect({
    name: "Top Bar", x: 0, y: 0, w: W, h: 6,
    fill: lg(0, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
  }));

  // Logo (centered)
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.1, logoS, logoS, cfg.primaryColor, ff));

  // Name (centered)
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.4, w: W, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 600, color: cfg.textColor, align: "center",
    tags: ["name", "primary-text"], uppercase: true, letterSpacing: 2,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.4 + fs.name + 8, w: W, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.secondaryColor, align: "center", tags: ["title"],
  }));

  // Divider
  layers.push(line({
    name: "Divider", x: W * 0.25, y: H * 0.58, w: W * 0.5,
    color: cfg.secondaryColor, alpha: 0.3,
  }));

  // Contact (centered)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.66, Math.round(fs.contact * 1.4), "center",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.92, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.secondaryColor, alpha: 0.5, align: "center",
    tags: ["company"], uppercase: true, letterSpacing: 3,
  }));

  return layers;
}

function layoutEngraved(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];

  // Double border
  layers.push(rect({
    name: "Outer Border", x: 12, y: 12, w: W - 24, h: H - 24,
    stroke: stroke(cfg.primaryColor, 1, 0.15), tags: ["decorative", "border"],
  }));
  layers.push(rect({
    name: "Inner Border", x: 18, y: 18, w: W - 36, h: H - 36,
    stroke: stroke(cfg.primaryColor, 0.5, 0.08), tags: ["decorative", "border"],
  }));

  // Name (centered)
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.25, w: W, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 300, color: cfg.textColor, align: "center",
    tags: ["name", "primary-text"], letterSpacing: 3,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.25 + fs.name + 6, w: W, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, align: "center", tags: ["title"],
  }));

  // Engraved divider
  layers.push(line({
    name: "Divider", x: W * 0.2, y: H * 0.5, w: W * 0.6,
    color: cfg.primaryColor, alpha: 0.2,
  }));

  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.52, logoS, logoS, cfg.primaryColor, ff));

  // Contact (centered)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.72, Math.round(fs.contact * 1.4), "center",
    cfg.textColor, 0.55, cfg.primaryColor, 0.35, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.93, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.primaryColor, alpha: 0.4, align: "center",
    tags: ["company"], uppercase: true, letterSpacing: 4,
  }));

  return layers;
}

// --- Creative ---

function layoutDiagonalCut(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const layers: LayerV2[] = [];
  const contrastC = getContrastColor(cfg.primaryColor);

  // Diagonal block (polygon as path)
  layers.push(createPathLayerV2({
    name: "Diagonal Block",
    x: 0, y: 0, width: W, height: H,
    commands: [
      { type: "M", x: W * 0.52, y: 0 },
      { type: "L", x: W, y: 0 },
      { type: "L", x: W, y: H },
      { type: "L", x: W * 0.32, y: H },
      { type: "Z" },
    ],
    fill: lg(135, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    closed: true,
    tags: ["decorative", "panel"],
  }));

  // Name (left side)
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.32, w: W * 0.4, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.32 + fs.title + 8, w: W * 0.4, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.textColor, alpha: 0.55, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, mx, H * 0.55, logoS, logoS, cfg.primaryColor, ff));

  // Company (next to logo)
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: H * 0.55 + logoS / 2 - fs.label / 2, w: W * 0.2,
    text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.35, tags: ["company"],
  }));

  // Contact (right side on diagonal, right-aligned)
  layers.push(...buildContactLayers(
    cfg, W - mx, H * 0.3, Math.round(fs.contact * 1.5), "right",
    contrastC, 0.85, contrastC, 0.5, fs.contact, ff, W
  ));

  return layers;
}

function layoutLayeredCard(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Bottom offset card layer
  layers.push(rect({
    name: "Background Layer", x: 12, y: 12, w: W - 12, h: H - 12,
    fill: solidPaintHex(cfg.secondaryColor, 0.15),
    radii: [8, 8, 8, 8], tags: ["decorative"],
  }));

  // Top gradient band
  layers.push(rect({
    name: "Top Band", x: 0, y: 0, w: W, h: H * 0.35,
    fill: lg(0, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "band"],
  }));

  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.1, logoS, logoS, getContrastColor(cfg.primaryColor), ff));

  // Name (on band)
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.12, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: getContrastColor(cfg.primaryColor), tags: ["name", "primary-text"],
  }));

  // Title (on band)
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.12 + fs.name + 4, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: getContrastColor(cfg.primaryColor), alpha: 0.8, tags: ["title"],
  }));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.42, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.35, tags: ["company"], uppercase: true,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.55, Math.round(fs.contact * 1.5), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Tagline
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx, y: H * 0.92, w: W - 2 * mx, text: cfg.tagline,
      fontSize: fs.tagline, ff, weight: 300, color: cfg.textColor, alpha: 0.3, tags: ["tagline"],
    }));
  }

  return layers;
}

function layoutPhotoOverlay(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Dark overlay gradient
  layers.push(rect({
    name: "Dark Overlay", x: 0, y: 0, w: W, h: H,
    fill: lg(180, [cfg.primaryColor, 0, 0.4], [cfg.bgColor, 1, 0.8]),
    tags: ["decorative"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.25, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.nameXl, ff, weight: 800, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.25 + fs.nameXl + 4, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.2, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.55, w: W * 0.3,
    color: cfg.primaryColor, alpha: 0.4,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.63, Math.round(fs.contact * 1.5), "left",
    cfg.textColor, 0.65, cfg.primaryColor, 0.45, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.92, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3, tags: ["company"], uppercase: true,
  }));

  return layers;
}

function layoutDotMatrix(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.09;
  const layers: LayerV2[] = [];

  // Large accent circle
  layers.push(ellipse({
    name: "Accent Circle", cx: W * 0.85, cy: H * 0.25, rx: W * 0.2, ry: W * 0.2,
    fill: solidPaintHex(cfg.primaryColor, 0.06), tags: ["decorative"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.2, w: W * 0.6, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 700, color: cfg.textColor, tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.2 + fs.name + 6, w: W * 0.6, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: cfg.primaryColor, tags: ["title"],
  }));

  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, mx, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.5, w: W * 0.3,
    color: cfg.secondaryColor, alpha: 0.3,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.58, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.9, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3, tags: ["company"], uppercase: true,
  }));

  return layers;
}

// --- Luxury ---

function layoutGoldFoil(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];
  // Use config colors so AI color changes propagate to gold accents
  const gold1 = cfg.primaryColor;
  const gold2 = cfg.secondaryColor;

  // Border
  layers.push(rect({
    name: "Gold Border", x: 16, y: 16, w: W - 32, h: H - 32,
    stroke: stroke(gold1, 1.5), tags: ["decorative", "border", "accent"],
  }));

  // Corner L-shapes (simplified as small rectangles)
  const corners = [
    { name: "Corner TL-H", x: 20, y: 20, w: 20, h: 1.5 },
    { name: "Corner TL-V", x: 20, y: 20, w: 1.5, h: 20 },
    { name: "Corner TR-H", x: W - 40, y: 20, w: 20, h: 1.5 },
    { name: "Corner TR-V", x: W - 21.5, y: 20, w: 1.5, h: 20 },
    { name: "Corner BL-H", x: 20, y: H - 21.5, w: 20, h: 1.5 },
    { name: "Corner BL-V", x: 20, y: H - 40, w: 1.5, h: 20 },
    { name: "Corner BR-H", x: W - 40, y: H - 21.5, w: 20, h: 1.5 },
    { name: "Corner BR-V", x: W - 21.5, y: H - 40, w: 1.5, h: 20 },
  ];
  for (const c of corners) {
    layers.push(rect({
      name: c.name, x: c.x, y: c.y, w: c.w, h: c.h,
      fill: solidPaintHex(gold2), tags: ["decorative", "corner", "accent"],
    }));
  }

  // Logo (centered top)
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.08, logoS, logoS, gold1, ff));

  // Name (centered)
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.42, w: W, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 600, color: cfg.textColor, align: "center",
    tags: ["name", "primary-text"],
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.42 + fs.title + 8, w: W, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: gold1, align: "center", tags: ["title"],
  }));

  // Gold divider
  layers.push(line({
    name: "Gold Divider", x: W * 0.25, y: H * 0.56, w: W * 0.5,
    color: gold1, alpha: 0.5,
  }));

  // Contact (centered)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.65, Math.round(fs.contact * 1.45), "center",
    cfg.textColor, 0.55, gold1, 0.4, fs.contact, ff, W
  ));

  // Company (bottom center)
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.93, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: gold1, alpha: 0.5, align: "center",
    tags: ["company"], uppercase: true, letterSpacing: 3,
  }));

  return layers;
}

function layoutMarbleLuxe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const layers: LayerV2[] = [];

  // Subtle marble gradient
  layers.push(rect({
    name: "Marble Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.bgColor, 0], [cfg.secondaryColor, 0.5, 0.04], [cfg.bgColor, 1]),
    tags: ["decorative"],
  }));

  // Top accent line
  layers.push(rect({
    name: "Top Accent", x: mx, y: H * 0.08, w: W * 0.15, h: 2,
    fill: solidPaintHex(cfg.primaryColor, 0.5), tags: ["decorative", "accent"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.2, w: W * 0.7, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 400, color: cfg.textColor, tags: ["name", "primary-text"],
    letterSpacing: 1,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.2 + fs.name + 6, w: W * 0.7, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 300, color: cfg.secondaryColor, tags: ["title"], italic: true,
  }));

  // Logo
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.15, logoS, logoS, cfg.primaryColor, ff));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.5, w: W * 0.8,
    color: cfg.secondaryColor, alpha: 0.15,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.58, Math.round(fs.contact * 1.45), "left",
    cfg.textColor, 0.55, cfg.primaryColor, 0.3, fs.contact, ff, W
  ));

  // Company
  layers.push(textLayer({
    name: "Company", x: mx, y: H * 0.92, w: W - 2 * mx, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 500, color: cfg.secondaryColor, alpha: 0.4, align: "right",
    tags: ["company"], uppercase: true,
  }));

  return layers;
}

function layoutVelvetNoir(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const layers: LayerV2[] = [];

  // Subtle dark gradient
  layers.push(rect({
    name: "Dark Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.primaryColor, 0, 0.08], [cfg.bgColor, 1, 0]),
    tags: ["decorative"],
  }));

  // Side accent bar
  layers.push(rect({
    name: "Side Bar", x: W - 6, y: H * 0.2, w: 6, h: H * 0.6,
    fill: lg(90, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
  }));

  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.22, w: W * 0.7, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 400, color: cfg.textColor, tags: ["name", "primary-text"],
    letterSpacing: 2,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.22 + fs.name + 6, w: W * 0.7, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 300, color: cfg.primaryColor, tags: ["title"], italic: true,
  }));

  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, mx, H * 0.5, logoS, logoS, cfg.primaryColor, ff));

  // Company (next to logo)
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: H * 0.5 + logoS / 2 - fs.label / 2, w: W * 0.3,
    text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: cfg.textColor, alpha: 0.3, tags: ["company"], uppercase: true,
  }));

  // Separator
  layers.push(line({
    name: "Separator", x: mx, y: H * 0.7, w: W * 0.5,
    color: cfg.primaryColor, alpha: 0.15,
  }));

  // Contact
  layers.push(...buildContactLayers(
    cfg, mx, H * 0.76, Math.round(fs.contact * 1.4), "left",
    cfg.textColor, 0.5, cfg.primaryColor, 0.35, fs.contact, ff, W
  ));

  return layers;
}

function layoutArtDeco(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];
  const gold = cfg.primaryColor;

  // Art deco border
  layers.push(rect({
    name: "Deco Border", x: 14, y: 14, w: W - 28, h: H - 28,
    stroke: stroke(gold, 2, 0.4), tags: ["decorative", "border"],
  }));

  // Inner deco border
  layers.push(rect({
    name: "Inner Border", x: 22, y: 22, w: W - 44, h: H - 44,
    stroke: stroke(gold, 0.5, 0.2), tags: ["decorative", "border"],
  }));

  // Fan/sunrise shape (path)
  layers.push(createPathLayerV2({
    name: "Deco Fan",
    x: 0, y: 0, width: W, height: H * 0.1,
    commands: [
      { type: "M", x: W * 0.35, y: 0 },
      { type: "L", x: W * 0.5, y: H * 0.08 },
      { type: "L", x: W * 0.65, y: 0 },
      { type: "Z" },
    ],
    fill: solidPaintHex(gold, 0.06),
    closed: true,
    tags: ["decorative"],
  }));

  // Logo (centered top)
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.1, logoS, logoS, gold, ff));

  // Name (centered)
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.38, w: W, text: cfg.name || "Your Name",
    fontSize: fs.name, ff, weight: 500, color: cfg.textColor, align: "center",
    tags: ["name", "primary-text"], letterSpacing: 3,
  }));

  // Title
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.38 + fs.name + 6, w: W, text: cfg.title || "Job Title",
    fontSize: fs.title, ff, weight: 400, color: gold, align: "center", tags: ["title"],
  }));

  // Deco divider
  layers.push(line({
    name: "Deco Divider", x: W * 0.2, y: H * 0.55, w: W * 0.6,
    color: gold, alpha: 0.35,
  }));

  // Contact (centered)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.63, Math.round(fs.contact * 1.4), "center",
    cfg.textColor, 0.55, gold, 0.35, fs.contact, ff, W
  ));

  // Company (bottom center)
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.92, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 600, color: gold, alpha: 0.5, align: "center",
    tags: ["company"], uppercase: true, letterSpacing: 4,
  }));

  return layers;
}

// --- Template dispatcher ---

const LAYOUT_MAP: Record<string, LayoutFn> = {
  "executive-clean":  layoutExecutiveClean,
  "swiss-grid":       layoutSwissGrid,
  "mono-type":        layoutMonoType,
  "nordic-frost":     layoutNordicFrost,
  "bold-split":       layoutBoldSplit,
  "neon-edge":        layoutNeonEdge,
  "geometric-modern": layoutGeometricModern,
  "gradient-wave":    layoutGradientWave,
  "corporate-stripe": layoutCorporateStripe,
  "diplomat":         layoutDiplomat,
  "heritage-crest":   layoutHeritageCrest,
  "engraved":         layoutEngraved,
  "diagonal-cut":     layoutDiagonalCut,
  "layered-card":     layoutLayeredCard,
  "photo-overlay":    layoutPhotoOverlay,
  "dot-matrix":       layoutDotMatrix,
  "gold-foil":        layoutGoldFoil,
  "marble-luxe":      layoutMarbleLuxe,
  "velvet-noir":      layoutVelvetNoir,
  "art-deco":         layoutArtDeco,
};

// =============================================================================
// 8.  Back Side Layouts
// =============================================================================

function layoutBackLogoCenter(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const contrastC = getContrastColor(cfg.primaryColor);
  const layers: LayerV2[] = [];

  // Gradient background
  layers.push(rect({
    name: "Back Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "back-element"],
  }));

  // Accent circles
  layers.push(ellipse({
    name: "Accent Circle 1", cx: W * 0.15, cy: H * 0.15, rx: W * 0.12, ry: W * 0.12,
    fill: solidPaintHex(contrastC, 0.04), tags: ["decorative", "back-element"],
  }));
  layers.push(ellipse({
    name: "Accent Circle 2", cx: W * 0.85, cy: H * 0.85, rx: W * 0.1, ry: W * 0.1,
    fill: solidPaintHex(contrastC, 0.03), tags: ["decorative", "back-element"],
  }));

  // Logo (centered)
  const logoS = Math.min(W, H) * 0.25;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H / 2 - logoS / 2 - 14, logoS, logoS, contrastC, ff));

  // Website
  if (cfg.website) {
    layers.push(textLayer({
      name: "Website", x: 0, y: H / 2 + logoS / 2 + 10, w: W, text: cfg.website,
      fontSize: fs.contact, ff, weight: 400, color: contrastC, alpha: 0.6, align: "center",
      tags: ["contact-website", "back-element"],
    }));
  }

  // Divider
  layers.push(line({
    name: "Back Divider", x: W * 0.3, y: H / 2 + logoS / 2 + 35, w: W * 0.4,
    color: contrastC, alpha: 0.2,
  }));

  return layers;
}

function layoutBackPatternFill(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const contrastC = getContrastColor(cfg.primaryColor);
  const layers: LayerV2[] = [];

  // Gradient background
  layers.push(rect({
    name: "Back Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "back-element"],
  }));

  // Pattern fill overlay
  const patType = cfg.patternType && cfg.patternType !== "none" ? cfg.patternType : "dots";
  const backPattern = buildPatternLayer(W, H, patType, contrastC, 0.08);
  if (backPattern) {
    backPattern.tags = [...backPattern.tags, "back-element"];
    layers.push(backPattern);
  }

  // Logo (centered)
  const logoS = Math.min(W, H) * 0.22;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H / 2 - logoS / 2, logoS, logoS, contrastC, ff));

  return layers;
}

function layoutBackMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];

  // Primary bar at bottom
  layers.push(rect({
    name: "Bottom Bar", x: 0, y: H - 4, w: W, h: 4,
    fill: solidPaintHex(cfg.primaryColor), tags: ["decorative", "back-element"],
  }));

  // Logo (centered)
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H / 2 - logoS / 2 - 10, logoS, logoS, cfg.primaryColor, ff));

  // Company
  layers.push(textLayer({
    name: "Company", x: 0, y: H / 2 + logoS / 2 + 4, w: W, text: cfg.company || "Company",
    fontSize: fs.label, ff, weight: 500, color: cfg.textColor, alpha: 0.5, align: "center",
    tags: ["company", "back-element"],
  }));

  // Website
  if (cfg.website) {
    layers.push(textLayer({
      name: "Website", x: 0, y: H / 2 + logoS / 2 + 30, w: W, text: cfg.website,
      fontSize: fs.tagline, ff, weight: 400, color: cfg.textColor, alpha: 0.4, align: "center",
      tags: ["contact-website", "back-element"],
    }));
  }

  return layers;
}

function layoutBackInfoRepeat(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const layers: LayerV2[] = [];

  // Giant watermark company name
  layers.push(textLayer({
    name: "Watermark", x: -W * 0.1, y: H * 0.1, w: W * 1.5,
    text: cfg.company || "Company",
    fontSize: fs.nameXl * 2, ff, weight: 800, color: cfg.textColor, alpha: 0.04,
    tags: ["decorative", "watermark", "back-element"],
  }));

  // Logo (centered upper)
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H * 0.15, logoS, logoS, cfg.primaryColor, ff));

  // Contact (centered below)
  layers.push(...buildContactLayers(
    cfg, W / 2, H * 0.55, Math.round(fs.contact * 1.5), "center",
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W
  ));

  return layers;
}

function layoutBackGradientBrand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const contrastC = getContrastColor(cfg.primaryColor);
  const layers: LayerV2[] = [];

  // Full gradient
  layers.push(rect({
    name: "Brand Gradient", x: 0, y: 0, w: W, h: H,
    fill: lg(135, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "back-element"],
  }));

  // Accent circles
  layers.push(ellipse({
    name: "Accent 1", cx: W * 0.2, cy: H * 0.2, rx: W * 0.15, ry: W * 0.15,
    fill: solidPaintHex(contrastC, 0.03), tags: ["decorative", "back-element"],
  }));

  // Logo (centered)
  const logoS = Math.min(W, H) * 0.25;
  layers.push(buildLogoLayer(cfg, W / 2 - logoS / 2, H / 2 - logoS / 2 - 20, logoS, logoS, contrastC, ff));

  // Website
  if (cfg.website) {
    layers.push(textLayer({
      name: "Website", x: 0, y: H / 2 + logoS / 2, w: W, text: cfg.website,
      fontSize: fs.contact, ff, weight: 400, color: contrastC, alpha: 0.6, align: "center",
      tags: ["contact-website", "back-element"],
    }));
  }

  // Tagline
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: 0, y: H / 2 + logoS / 2 + 30, w: W, text: cfg.tagline,
      fontSize: fs.tagline, ff, weight: 300, color: contrastC, alpha: 0.4, align: "center",
      tags: ["tagline", "back-element"],
    }));
  }

  return layers;
}

const BACK_LAYOUT_MAP: Record<string, LayoutFn> = {
  "logo-center":    layoutBackLogoCenter,
  "pattern-fill":   layoutBackPatternFill,
  "minimal":        layoutBackMinimal,
  "info-repeat":    layoutBackInfoRepeat,
  "gradient-brand": layoutBackGradientBrand,
};

// =============================================================================
// 9.  Main Conversion: CardConfig → DesignDocumentV2
// =============================================================================

export function cardConfigToDocument(
  cfg: CardConfig,
  options?: { logoImg?: HTMLImageElement }
): DesignDocumentV2 {
  // Resolve card dimensions
  let W: number, H: number;
  if (cfg.cardStyle === "custom") {
    W = Math.round(cfg.customWidthMm * MM_PX);
    H = Math.round(cfg.customHeightMm * MM_PX);
  } else {
    const size = CARD_SIZES[cfg.cardStyle] || CARD_SIZES.standard;
    W = size.w;
    H = size.h;
  }

  const ff = getFontFamily(cfg.fontStyle);
  const fs = getFontSizes(W);
  const isRounded = cfg.cardStyle === "rounded";

  // Create document with root frame
  let doc = createDocumentV2({
    toolId: "business-card",
    name: `Business Card — ${cfg.name || "Untitled"}`,
    width: W,
    height: H,
    backgroundColor: hexToRGBA(cfg.bgColor),
    dpi: 300,
    bleedMm: BLEED_MM,
    safeAreaMm: SAFE_MM,
  });

  // Apply rounded corners to root frame if needed
  if (isRounded) {
    doc = updateLayer(doc, doc.rootFrameId, {
      cornerRadii: [24, 24, 24, 24],
    } as Partial<LayerV2>);
  }

  // Store original config in meta for AI context
  doc = {
    ...doc,
    meta: {
      ...doc.meta,
      toolConfig: cfg as unknown as Record<string, unknown>,
    },
  };

  // Get template layers
  const isFront = cfg.side !== "back";
  let templateLayers: LayerV2[];

  if (isFront) {
    const layoutFn = LAYOUT_MAP[cfg.template] || LAYOUT_MAP["executive-clean"];
    templateLayers = layoutFn(W, H, cfg, fs, ff);
  } else {
    const backFn = BACK_LAYOUT_MAP[cfg.backStyle] || BACK_LAYOUT_MAP["logo-center"];
    templateLayers = backFn(W, H, cfg, fs, ff);
  }

  // Build pattern overlay
  const patternOpacity = 0.06; // Base opacity; will be scaled by renderer via advanced settings
  const patternLayer = buildPatternLayer(
    W, H, cfg.patternType, cfg.primaryColor, patternOpacity
  );

  // Build QR code layer if URL is set
  const qrLayer = buildQrCodeLayer(W, H, cfg, isFront ? "front" : "back");

  // Add layers to document (in render order: first added = bottom)
  // Pattern goes first (bottommost decoration)
  if (patternLayer) {
    doc = addLayer(doc, patternLayer);
  }

  // Abstract assets: behind-content layers go after pattern, before template
  const abstractBehind: LayerV2[] = [];
  const abstractAbove: LayerV2[] = [];
  if (cfg.abstractAssets?.length) {
    for (const ac of cfg.abstractAssets) {
      const asset = ABSTRACT_REGISTRY[ac.assetId];
      if (!asset) continue;
      const layers = buildAbstractAsset(ac.assetId, {
        W, H,
        primary: cfg.primaryColor,
        secondary: cfg.secondaryColor,
        text: cfg.textColor,
        bg: cfg.bgColor,
        opacity: ac.opacity,
        scale: ac.scale,
        rotation: ac.rotation,
        xOffset: ac.xOffset,
        yOffset: ac.yOffset,
        colorOverride: ac.colorOverride,
        blendMode: ac.blendMode,
      });
      if (ac.zPosition === "above-content") {
        abstractAbove.push(...layers);
      } else {
        abstractBehind.push(...layers);
      }
    }
  }

  for (const layer of abstractBehind) {
    doc = addLayer(doc, layer);
  }

  // Then template layers (in order: first element = rendered first / bottom)
  for (const layer of templateLayers) {
    doc = addLayer(doc, layer);
  }

  // Abstract assets: above-content layers go after template, before QR code
  for (const layer of abstractAbove) {
    doc = addLayer(doc, layer);
  }

  // QR code on top of everything
  if (qrLayer) {
    doc = addLayer(doc, qrLayer);
  }

  // Set logo image ref if available
  if (options?.logoImg && cfg.logoUrl) {
    // Find logo layer and set the image element
    const layers = Object.values(doc.layersById);
    const logoLayer = layers.find(l => l.tags.includes("logo") && l.type === "image");
    if (logoLayer && logoLayer.type === "image") {
      doc = updateLayer(doc, logoLayer.id, {
        _imageElement: options.logoImg,
      } as Partial<LayerV2>);
    }
  }

  // ── Post-process: Auto-fit name & company text layers ──────────────────
  // Prevents long names from overflowing the card edge.
  {
    const allLayers = Object.values(doc.layersById);
    for (const layer of allLayers) {
      if (layer.type !== "text") continue;
      const isNameOrCompany = layer.tags.includes("name") || layer.tags.includes("company");
      if (!isNameOrCompany) continue;

      const tl = layer as TextLayerV2;
      const availW = tl.transform.size.x;
      const fittedSize = autoFitFontSize(
        tl.text,
        tl.defaultStyle.fontSize,
        availW,
        tl.defaultStyle.fontFamily,
        tl.defaultStyle.fontWeight ?? 400,
      );
      if (fittedSize < tl.defaultStyle.fontSize) {
        doc = updateLayer(doc, layer.id, {
          defaultStyle: { ...tl.defaultStyle, fontSize: fittedSize },
          transform: {
            ...tl.transform,
            size: { ...tl.transform.size, y: Math.round(fittedSize * 1.6) },
          },
        } as Partial<LayerV2>);
      }
    }
  }

  return doc;
}

// =============================================================================
// 10.  Smart Sync: Update text/colors without full regeneration
// =============================================================================

/**
 * Update text content in an existing document from CardConfig.
 * Preserves layer positions (doesn't regenerate layout).
 * Uses semantic tags to find the right layers.
 */
export function syncTextToDocument(
  doc: DesignDocumentV2,
  cfg: CardConfig
): DesignDocumentV2 {
  let updated = doc;
  const layers = Object.values(updated.layersById);

  // Text content mapping: tag → config field
  const textMap: Record<string, string> = {
    "name": cfg.name || "Your Name",
    "title": cfg.title || "Job Title",
    "company": cfg.company || "Company",
    "tagline": cfg.tagline || "",
    "contact-phone": cfg.phone || "",
    "contact-email": cfg.email || "",
    "contact-website": cfg.website || "",
    "contact-address": cfg.address || "",
  };

  for (const layer of layers) {
    if (layer.type !== "text") continue;

    for (const [tag, value] of Object.entries(textMap)) {
      if (layer.tags.includes(tag)) {
        if (value) {
          updated = updateLayer(updated, layer.id, { text: value } as Partial<LayerV2>);
        }
        break;
      }
    }
  }

  return updated;
}

/**
 * Update colors in an existing document from CardConfig.
 * Preserves layout, updates text colors and decorative element fills.
 *
 * Pass `prevTextColor` / `prevPrimaryColor` to enable per-layer override preservation:
 * only layers whose current color still matches the *previous* global color will be
 * updated. Layers that have been manually recolored are left untouched.
 */
export function syncColorsToDocument(
  doc: DesignDocumentV2,
  cfg: CardConfig,
  options?: {
    /** Only update name/primary-text layers that still match this OLD text color */
    prevTextColor?: string;
    /** Only update accent shape layers that still match this OLD primary color */
    prevPrimaryColor?: string;
    /** Only update secondary-colored layers that still match this OLD secondary color */
    prevSecondaryColor?: string;
    /** Explicit set of layer IDs to always skip */
    skipLayerIds?: ReadonlySet<string>;
  }
): DesignDocumentV2 {
  let updated = doc;
  const layers = Object.values(updated.layersById);
  const prevTextRGBA      = options?.prevTextColor      ? hexToRGBA(options.prevTextColor)      : null;
  const prevPrimaryRGBA   = options?.prevPrimaryColor    ? hexToRGBA(options.prevPrimaryColor)   : null;
  const prevSecondaryRGBA = options?.prevSecondaryColor  ? hexToRGBA(options.prevSecondaryColor) : null;

  for (const layer of layers) {
    if (options?.skipLayerIds?.has(layer.id)) continue;

    // ── Text layers: sync fill color based on semantic tags ──
    if (layer.type === "text") {
      const tl = layer as TextLayerV2;

      // Name / primary-text → textColor
      if (tl.tags.includes("name") || tl.tags.includes("primary-text")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }

      // Title → primaryColor (many templates use primaryColor for titles)
      if (tl.tags.includes("title")) {
        const shouldUpdate = !prevPrimaryRGBA || _textLayerColorMatches(tl, prevPrimaryRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.primaryColor) },
          } as Partial<LayerV2>);
        }
      }

      // Company → textColor (with lower alpha, preserve existing alpha)
      if (tl.tags.includes("company")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        // Also check primaryColor — some templates use primaryColor for company text
        const shouldUpdateP = !shouldUpdate && (!prevPrimaryRGBA || _textLayerColorMatches(tl, prevPrimaryRGBA));
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        } else if (shouldUpdateP) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.primaryColor) },
          } as Partial<LayerV2>);
        }
      }

      // Contact text → textColor
      if (tl.tags.includes("contact-text")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }

      // Tagline → textColor
      if (tl.tags.includes("tagline")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }
    }

    // ── Icon layers: contact-icon → primaryColor ──
    if (layer.type === "icon" && layer.tags.includes("contact-icon")) {
      const shouldUpdate = !prevPrimaryRGBA || _rgbaApprox((layer as import("./schema").IconLayerV2).color, prevPrimaryRGBA);
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          color: hexToRGBA(cfg.primaryColor),
        } as Partial<LayerV2>);
      }
    }

    // ── Shape layers: accent → primaryColor ──
    if (layer.tags.includes("accent") && layer.type === "shape") {
      const firstFill = (layer as ShapeLayerV2).fills?.[0];
      const shouldUpdate = !prevPrimaryRGBA || (firstFill?.kind === "solid" && _rgbaApprox(firstFill.color, prevPrimaryRGBA));
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          fills: [solidPaintHex(cfg.primaryColor)],
        } as Partial<LayerV2>);
      }
    }

    // ── Shape layers: corner decoratives → secondaryColor ──
    if (layer.tags.includes("corner") && layer.type === "shape") {
      const firstFill = (layer as ShapeLayerV2).fills?.[0];
      const shouldUpdate = !prevSecondaryRGBA || (firstFill?.kind === "solid" && _rgbaApprox(firstFill.color, prevSecondaryRGBA));
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          fills: [solidPaintHex(cfg.secondaryColor)],
        } as Partial<LayerV2>);
      }
    }

    // ── Shape layers: border strokes → primaryColor ──
    if (layer.tags.includes("border") && layer.type === "shape") {
      const sl = layer as ShapeLayerV2;
      if (sl.strokes.length > 0) {
        const firstStroke = sl.strokes[0];
        const strokeColor = firstStroke.paint.kind === "solid" ? firstStroke.paint.color : null;
        const shouldUpdate = !prevPrimaryRGBA || (strokeColor && _rgbaApprox(strokeColor, prevPrimaryRGBA));
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            strokes: sl.strokes.map((s, i) => i === 0 ? { ...s, paint: solidPaintHex(cfg.primaryColor) } : s),
          } as Partial<LayerV2>);
        }
      }
    }

    // ── Abstract asset layers: color-primary → primaryColor, color-secondary → secondaryColor ──
    if (layer.tags.includes("abstract-asset")) {
      if (layer.tags.includes("color-primary") && (layer.type === "shape" || layer.type === "path")) {
        const sl = layer as ShapeLayerV2;
        const firstFill = sl.fills?.[0];
        if (firstFill?.kind === "solid") {
          const shouldUpdate = !prevPrimaryRGBA || _rgbaApprox(firstFill.color, prevPrimaryRGBA);
          if (shouldUpdate) {
            updated = updateLayer(updated, layer.id, {
              fills: [solidPaintHex(cfg.primaryColor, firstFill.color.a)],
            } as Partial<LayerV2>);
          }
        }
      }
      if (layer.tags.includes("color-secondary") && (layer.type === "shape" || layer.type === "path")) {
        const sl = layer as ShapeLayerV2;
        const firstFill = sl.fills?.[0];
        if (firstFill?.kind === "solid") {
          const shouldUpdate = !prevSecondaryRGBA || _rgbaApprox(firstFill.color, prevSecondaryRGBA);
          if (shouldUpdate) {
            updated = updateLayer(updated, layer.id, {
              fills: [solidPaintHex(cfg.secondaryColor, firstFill.color.a)],
            } as Partial<LayerV2>);
          }
        }
      }
    }
  }

  // Always update root frame background
  updated = updateLayer(updated, doc.rootFrameId, {
    fills: [solidPaintHex(cfg.bgColor)],
  } as Partial<LayerV2>);

  return updated;
}

/** True if a text layer's fill solid-color approximately equals `target` (within `tol` per channel) */
function _textLayerColorMatches(layer: TextLayerV2, target: RGBA, tol = 4): boolean {
  const fill = layer.defaultStyle.fill;
  return fill.kind === "solid" && _rgbaApprox(fill.color, target, tol);
}

function _rgbaApprox(a: RGBA, b: RGBA, tol = 4): boolean {
  return Math.abs(a.r - b.r) <= tol && Math.abs(a.g - b.g) <= tol && Math.abs(a.b - b.b) <= tol;
}

/**
 * Extract config-level data from a document (reverse sync).
 * Used when AI modifies text content so the sidebar stays in sync.
 */
export function documentToCardConfig(doc: DesignDocumentV2): Partial<CardConfig> {
  const result: Partial<CardConfig> = {};
  const layers = Object.values(doc.layersById);

  for (const layer of layers) {
    if (layer.type !== "text") continue;

    if (layer.tags.includes("name")) result.name = (layer as TextLayerV2).text;
    if (layer.tags.includes("title")) result.title = (layer as TextLayerV2).text;
    if (layer.tags.includes("company")) result.company = (layer as TextLayerV2).text;
    if (layer.tags.includes("tagline")) result.tagline = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-phone")) result.phone = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-email")) result.email = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-website")) result.website = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-address")) result.address = (layer as TextLayerV2).text;
  }

  return result;
}

// =============================================================================
// 11.  Exports
// =============================================================================

export {
  getFontFamily,
  getFontSizes,
  getContactEntries,
  getContrastColor,
  type FontSizes,
};

// =============================================================================
// 12.  Builder exports for TemplateGenerator (avoids circular dependency)
// =============================================================================

/**
 * These are the low-level builder functions, exported so the parametric
 * template generator can compose them without importing the full template
 * layout functions (which would cause a circular dependency).
 */
export const buildLogoLayerFn    = buildLogoLayer;
export const buildContactLayersFn = buildContactLayers;
export const buildPatternLayerFn  = buildPatternLayer;
export const buildQrCodeLayerFn   = buildQrCodeLayer;

/** Re-export so template-generator can apply the user's logo scale setting */
export { scaledLogoSize } from "@/stores/advanced-helpers";
