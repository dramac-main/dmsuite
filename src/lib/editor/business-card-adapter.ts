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
  TextLayerV2, ShapeLayerV2, PathCommand,
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

// -- Card Template Helpers (pixel-perfect infrastructure) --
import {
  M, L, C, Q, Z,
  pathLayer, divider, filledRect, filledEllipse, strokeRect, strokeEllipse,
  styledText, linearGradient, multiStopGradient,
  TEMPLATE_FIXED_THEMES, type TemplateColorTheme,
  cornerBracketPath, diagonalSplitPath, circlePath,
  registerBackLayout, getBackLayout, extractContacts, type ContactInfo,
  buildWatermarkLogo, buildTemplateLogoLayers, contactWithIcons,
  makeStroke,
} from "./card-template-helpers";

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
  // — Core —
  { name: "Lime Pro",       primary: "#8ae600", secondary: "#6bb800", text: "#1a1a2e", bg: "#ffffff" },
  { name: "Navy",           primary: "#1e3a5f", secondary: "#4a90d9", text: "#ffffff", bg: "#0f1c2e" },
  { name: "Charcoal",       primary: "#333333", secondary: "#666666", text: "#ffffff", bg: "#1a1a1a" },
  { name: "Midnight",       primary: "#6c5ce7", secondary: "#a29bfe", text: "#e8e8e8", bg: "#0a0a1a" },
  { name: "Gold Rush",      primary: "#d4af37", secondary: "#f4e5b2", text: "#1a1410", bg: "#faf8f5" },
  { name: "Forest",         primary: "#2d6a4f", secondary: "#52b788", text: "#ffffff", bg: "#1b4332" },
  { name: "Ocean",          primary: "#0077b6", secondary: "#00b4d8", text: "#ffffff", bg: "#023e8a" },
  { name: "White Linen",    primary: "#6b705c", secondary: "#a5a58d", text: "#3a3a3a", bg: "#fefae0" },
  { name: "Burgundy",       primary: "#800020", secondary: "#c41e3a", text: "#f5f0e1", bg: "#1a0a10" },
  { name: "Slate",          primary: "#64748b", secondary: "#94a3b8", text: "#e2e8f0", bg: "#1e293b" },
  { name: "Coral",          primary: "#ff6b6b", secondary: "#ffa07a", text: "#ffffff", bg: "#2d2d2d" },
  { name: "Sage",           primary: "#6b8f71", secondary: "#a3c9a8", text: "#2d2d2d", bg: "#f0f5f1" },
  // — Industry —
  { name: "Rose Gold",      primary: "#b76e79", secondary: "#e8c4c8", text: "#2d1f21", bg: "#fdf6f6" },
  { name: "Copper",         primary: "#b87333", secondary: "#da9f5b", text: "#1a1410", bg: "#faf5ef" },
  { name: "Platinum",       primary: "#8c9196", secondary: "#c0c5ca", text: "#1a1c1e", bg: "#f4f5f6" },
  { name: "Emerald",        primary: "#009b72", secondary: "#41d9a5", text: "#ffffff", bg: "#003b2d" },
  { name: "Royal Blue",     primary: "#2b59c3", secondary: "#5a8dee", text: "#ffffff", bg: "#0e1e45" },
  { name: "Sunset",         primary: "#e65c00", secondary: "#f9d423", text: "#ffffff", bg: "#1a1008" },
  { name: "Lavender",       primary: "#7c6bc4", secondary: "#b8a9e8", text: "#2d2640", bg: "#f5f3fb" },
  { name: "Teal Pro",       primary: "#00838f", secondary: "#4dd0e1", text: "#ffffff", bg: "#00363b" },
  { name: "Carbon",         primary: "#2a2a2a", secondary: "#4a4a4a", text: "#e0e0e0", bg: "#111111" },
  { name: "Ice Blue",       primary: "#42a5f5", secondary: "#90caf9", text: "#0d2137", bg: "#e8f4fd" },
  { name: "Mauve",          primary: "#8e4585", secondary: "#c27ab8", text: "#ffffff", bg: "#1f0e1d" },
  { name: "Olive",          primary: "#6b8e23", secondary: "#9acd32", text: "#1a1f0e", bg: "#f5f8ec" },
  { name: "Terracotta",     primary: "#c75b39", secondary: "#e8936e", text: "#ffffff", bg: "#1f110d" },
  { name: "Mint Fresh",     primary: "#2ec4b6", secondary: "#7ee8d1", text: "#0a2e2a", bg: "#edf9f7" },
  { name: "Electric",       primary: "#e040fb", secondary: "#ea80fc", text: "#ffffff", bg: "#12001a" },
  { name: "Blush",          primary: "#d4727e", secondary: "#f0b8be", text: "#3a1f23", bg: "#fdf2f3" },
  { name: "Mahogany",       primary: "#6e352c", secondary: "#a0524a", text: "#f5ebe8", bg: "#1a0e0c" },
  { name: "Steel",          primary: "#607d8b", secondary: "#90a4ae", text: "#ffffff", bg: "#1c2830" },
  { name: "Violet Ink",     primary: "#5c1f99", secondary: "#9b59b6", text: "#f0e6f6", bg: "#0e0618" },
  { name: "Warm Sand",      primary: "#c4a35a", secondary: "#e0ca8e", text: "#2d2515", bg: "#faf6eb" },
];

export const TEMPLATE_DEFAULT_THEMES: Record<string, {
  primary: string; secondary: string; text: string; bg: string;
  pattern: string; font: CardConfig["fontStyle"];
}> = {
  // — Minimal —
  "ultra-minimal":      { primary: "#3a3a3a", secondary: "#9a9a9a", text: "#2a2a2a", bg: "#f8f8f8",  pattern: "none",  font: "minimal" },
  "monogram-luxe":      { primary: "#1a1a1a", secondary: "#666666", text: "#1a1a1a", bg: "#ededed",  pattern: "none",  font: "elegant" },
  "geometric-mark":     { primary: "#2d2d2d", secondary: "#888888", text: "#333333", bg: "#f5f5f5",  pattern: "none",  font: "modern"  },
  "frame-minimal":      { primary: "#e65100", secondary: "#888888", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "split-vertical":     { primary: "#333333", secondary: "#777777", text: "#333333", bg: "#f0f0f0",  pattern: "none",  font: "minimal" },
  "diagonal-mono":      { primary: "#1a1a1a", secondary: "#808080", text: "#1a1a1a", bg: "#f2f2f2",  pattern: "none",  font: "minimal" },
  // — Modern —
  "cyan-tech":          { primary: "#00bcd4", secondary: "#0097a7", text: "#ffffff", bg: "#37474f",  pattern: "none",  font: "modern"  },
  "corporate-chevron":  { primary: "#1e3a5f", secondary: "#3a6ea5", text: "#ffffff", bg: "#1a2e4a",  pattern: "none",  font: "bold"    },
  "zigzag-overlay":     { primary: "#1a237e", secondary: "#3f51b5", text: "#ffffff", bg: "#1a2040",  pattern: "none",  font: "bold"    },
  "hex-split":          { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#f5f7fa",  pattern: "none",  font: "modern"  },
  "dot-circle":         { primary: "#333333", secondary: "#888888", text: "#333333", bg: "#fafafa",  pattern: "dots",  font: "bold"    },
  "wave-gradient":      { primary: "#5e35b1", secondary: "#e8a735", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  // — Classic / Corporate —
  "circle-brand":       { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "full-color-back":    { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "classic" },
  "engineering-pro":    { primary: "#0288d1", secondary: "#29b6f6", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "bold"    },
  "clean-accent":       { primary: "#e65100", secondary: "#ff8a50", text: "#333333", bg: "#ffffff",  pattern: "lines", font: "modern"  },
  "nature-clean":       { primary: "#689f63", secondary: "#8bc34a", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "diamond-brand":      { primary: "#1565c0", secondary: "#e65100", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "bold"    },
  // — Creative —
  "flowing-lines":      { primary: "#2e7d32", secondary: "#66bb6a", text: "#ffffff", bg: "#1b4332",  pattern: "none",  font: "modern"  },
  "neon-watermark":     { primary: "#c6ff00", secondary: "#76ff03", text: "#e0e0e0", bg: "#0d0d0d",  pattern: "none",  font: "modern"  },
  "blueprint-tech":     { primary: "#e65100", secondary: "#757575", text: "#333333", bg: "#eeeeee",  pattern: "lines", font: "modern"  },
  "skyline-silhouette": { primary: "#333333", secondary: "#757575", text: "#333333", bg: "#f5f5f0",  pattern: "none",  font: "bold"    },
  "world-map":          { primary: "#555555", secondary: "#999999", text: "#e0e0e0", bg: "#2a2a2a",  pattern: "none",  font: "modern"  },
  "diagonal-gold":      { primary: "#c5a54e", secondary: "#1b4b6b", text: "#ffffff", bg: "#0d3b56",  pattern: "none",  font: "modern"  },
  // — Luxury —
  "luxury-divider":     { primary: "#c5a54e", secondary: "#1a5c4f", text: "#ffffff", bg: "#0a3a30",  pattern: "none",  font: "elegant" },
  "social-band":        { primary: "#4a5240", secondary: "#9a9580", text: "#dddacf", bg: "#3d4435",  pattern: "none",  font: "elegant" },
  "organic-pattern":    { primary: "#8a9a6c", secondary: "#bcc9a0", text: "#ffffff", bg: "#3a4a2f",  pattern: "none",  font: "modern"  },
  "celtic-stripe":      { primary: "#1a1a1a", secondary: "#666666", text: "#1a1a1a", bg: "#ffffff",  pattern: "none",  font: "classic" },
  "premium-crest":      { primary: "#c5a54e", secondary: "#1a5c4f", text: "#ffffff", bg: "#0f4a3c",  pattern: "none",  font: "elegant" },
  "gold-construct":     { primary: "#c5a54e", secondary: "#8a7030", text: "#ffffff", bg: "#0a3530",  pattern: "none",  font: "modern"  },
};

export const TEMPLATE_LIST = [
  // — Minimal (6) —
  { id: "ultra-minimal",      label: "Ultra Minimal",      category: "minimal" },
  { id: "monogram-luxe",      label: "Monogram",           category: "minimal" },
  { id: "geometric-mark",     label: "Geometric Mark",     category: "minimal" },
  { id: "frame-minimal",      label: "Frame Minimal",      category: "minimal" },
  { id: "split-vertical",     label: "Split Vertical",     category: "minimal" },
  { id: "diagonal-mono",      label: "Diagonal Mono",      category: "minimal" },
  // — Modern (6) —
  { id: "cyan-tech",          label: "Cyan Tech",          category: "modern" },
  { id: "corporate-chevron",  label: "Corporate Chevron",  category: "modern" },
  { id: "zigzag-overlay",     label: "Zigzag Overlay",     category: "modern" },
  { id: "hex-split",          label: "Hex Split",          category: "modern" },
  { id: "dot-circle",         label: "Dot Circle",         category: "modern" },
  { id: "wave-gradient",      label: "Wave Gradient",      category: "modern" },
  // — Classic / Corporate (6) —
  { id: "circle-brand",       label: "Circle Brand",       category: "classic" },
  { id: "full-color-back",    label: "Full Color Back",    category: "classic" },
  { id: "engineering-pro",    label: "Engineering Pro",     category: "classic" },
  { id: "clean-accent",       label: "Clean Accent",       category: "classic" },
  { id: "nature-clean",       label: "Nature Clean",       category: "classic" },
  { id: "diamond-brand",      label: "Diamond Brand",      category: "classic" },
  // — Creative (6) —
  { id: "flowing-lines",      label: "Flowing Lines",      category: "creative" },
  { id: "neon-watermark",     label: "Neon Watermark",     category: "creative" },
  { id: "blueprint-tech",     label: "Blueprint Tech",     category: "creative" },
  { id: "skyline-silhouette", label: "Skyline",            category: "creative" },
  { id: "world-map",          label: "World Map",          category: "creative" },
  { id: "diagonal-gold",      label: "Diagonal Gold",      category: "creative" },
  // — Luxury (6) —
  { id: "luxury-divider",     label: "Luxury Divider",     category: "luxury" },
  { id: "social-band",        label: "Social Band",        category: "luxury" },
  { id: "organic-pattern",    label: "Organic Pattern",    category: "luxury" },
  { id: "celtic-stripe",      label: "Celtic Stripe",      category: "luxury" },
  { id: "premium-crest",      label: "Premium Crest",      category: "luxury" },
  { id: "gold-construct",     label: "Gold Construct",     category: "luxury" },
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
  fontSize: number, ff: string, W: number,
  /** Card height — used for overflow prevention via fitContactBlock */
  H?: number
): LayerV2[] {
  const entries = getContactEntries(cfg);
  if (entries.length === 0) return [];

  const layers: LayerV2[] = [];
  const adv = getAdvancedSettings();
  let lineGap = scaledElementGap(gap, adv);
  const icoSize = scaledIconSize(Math.round(fontSize * 0.85), adv);
  const icoGap = scaledIconGap(Math.round(fontSize * 0.35), adv);

  // --- Overflow prevention: auto-fit contact block to available space ---
  const availableH = H ? H - startY - (H * 0.06) : undefined; // 6% bottom margin
  let visibleCount = entries.length;
  if (availableH && availableH > 0) {
    const fitted = fitContactBlock(entries.length, availableH, lineGap, fontSize);
    visibleCount = fitted.count;
    lineGap = fitted.gap;
  }

  for (let i = 0; i < visibleCount; i++) {
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

// ===================== MINIMAL TEMPLATES =====================
// Pixel-perfect rewrites based on TEMPLATE-SPECIFICATIONS.md reference images.
// Each function uses TEMPLATE_FIXED_THEMES colors and card-template-helpers.

/**
 * Template #1 � Ultra Minimal (M.U.N reference)
 * FRONT: Off-white #f8f9fa bg, centered tiny accent line + brand initials only.
 * Zero decoration � the emptiness IS the design.
 */
function layoutUltraMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["ultra-minimal"];

  const font = ff;
  const layers: LayerV2[] = [];

  // Background: pure white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#ffffff"), tags: ["background"],
  }));

  // Content block starts at 52% W, creating asymmetric right-of-center layout
  const contentLeft = Math.round(W * 0.52);
  let y = Math.round(H * 0.20);

  // Tier 1: Name (semibold, darkest gray #2c2c2c)
  const nameSize = Math.round(H * 0.035); // 21px
  layers.push(styledText({
    name: "Name",
    x: contentLeft, y, w: Math.round(W * 0.40),
    text: (cfg.name || "PERSON NAME").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#2c2c2c",
    uppercase: true,
    letterSpacing: 4, // ~0.10em
    tags: ["name", "primary-text"],
  }));
  y += nameSize + Math.round(H * 0.015);

  // Tier 5: Divider line
  layers.push(filledRect({
    name: "Divider",
    x: contentLeft, y, w: Math.round(W * 0.08), h: 1,
    fill: solidPaintHex("#e0e0e0"), tags: ["decorative", "divider"],
  }));
  y += 1 + Math.round(H * 0.02);

  // Tier 2: Title (light weight, mid-gray #6a6a6a, wide spacing)
  const titleSize = Math.round(H * 0.025); // 15px
  layers.push(styledText({
    name: "Title",
    x: contentLeft, y, w: Math.round(W * 0.40),
    text: (cfg.company ? `${cfg.title || "Title"} / ${cfg.company}` : cfg.title || "TITLE / POSITION").toUpperCase(),
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#6a6a6a",
    uppercase: true,
    letterSpacing: 6, // ~0.20em
    tags: ["title"],
  }));
  y += titleSize + Math.round(H * 0.03);

  // Tier 3: Contact lines (light weight, light gray #8a8a8a)
  const contactSize = Math.round(H * 0.02); // 12px
  const contactLineH = Math.round(contactSize * 1.6);
  const contactLines = [cfg.phone, cfg.email, cfg.website, cfg.address].filter(Boolean);
  for (const line of contactLines) {
    layers.push(styledText({
      name: `Contact`,
      x: contentLeft, y, w: Math.round(W * 0.40),
      text: line!,
      fontSize: contactSize,
      fontFamily: font,
      weight: 300,
      color: "#8a8a8a",
      tags: ["contact-text"],
    }));
    y += contactLineH;
  }

  // Tier 4: Watermark logo/initials in lower-left
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company,
    Math.round(W * 0.14), Math.round(H * 0.70),
    Math.round(H * 0.15),
    "#b0b0b0", 1.0, font,
  ));

  return layers;

}

// Register ultra-minimal back layout
registerBackLayout("ultra-minimal", (W, H, cfg, theme) => {
  const t = theme;
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background: very light gray / off-white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.backBg), tags: ["background", "back-element"],
  }));

  // Accent line: thin horizontal, centered, 44% down, 4% card width
  const lineW = Math.round(W * 0.04);
  const lineY = Math.round(H * 0.44);
  layers.push(filledRect({
    name: "Accent Line", x: Math.round((W - lineW) / 2), y: lineY, w: lineW, h: 1,
    fill: solidPaintHex(t.backText), tags: ["decorative", "accent", "back-element"],
  }));

  // Brand initials: =4 chars = full name, else initials
  const companyRaw = cfg.company || cfg.name || "DM";
  const brandText = companyRaw.length <= 4
    ? companyRaw.toUpperCase()
    : companyRaw.split(/\s+/).map(w => w[0]).join("").toUpperCase();
  const brandSize = Math.round(H * 0.08); // 48px at 600H
  layers.push(styledText({
    name: "Brand Initials",
    x: 0, y: Math.round(H * 0.47), w: W,
    text: brandText,
    fontSize: brandSize,
    fontFamily: font,
    weight: 500,
    color: t.backText,
    align: "center",
    uppercase: true,
    letterSpacing: 7, // ~0.15em
    tags: ["company", "branding", "primary-text", "back-element"],
  }));

  return layers;

});

/**
 * Template #2 � Monogram Luxe (Samira Hadid reference)
 * FRONT: Warm lavender-gray #eae8eb bg, massive Didone serif monogram LEFT,
 * name/title/contact RIGHT starting at 48%.
 */
function layoutMonogramLuxe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["monogram-luxe"];
  const sansFont = ff;
  const serifFont = ff; // Didone/Modern serif for monogram
  const layers: LayerV2[] = [];

  // Background: warm lavender-gray
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Massive monogram letter � first letter of person's name
  const personInitial = ((cfg.name || "S")[0] || "S").toUpperCase();
  const monoSize = Math.round(H * 0.55); // 330px at 600H
  layers.push(styledText({
    name: "Monogram",
    x: Math.round(W * 0.08), y: Math.round(H * 0.50 - monoSize * 0.55),
    w: Math.round(W * 0.38), h: monoSize,
    text: personInitial,
    fontSize: monoSize,
    fontFamily: serifFont,
    weight: 400,
    color: t.frontText, // #2c2c2c
    align: "left",
    tags: ["decorative", "monogram", "branding"],
  }));

  // Right content column starts at 48% W
  const nameX = Math.round(W * 0.48);
  const rightW = Math.round(W * 0.44); // ~8% right margin
  let y = Math.round(H * 0.35);

  // Name � semibold, dark
  const nameSize = Math.round(H * 0.03); // 18px
  layers.push(styledText({
    name: "Name",
    x: nameX, y, w: rightW,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: nameSize,
    fontFamily: sansFont,
    weight: 600,
    color: t.frontText,
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    tags: ["name", "primary-text"],
  }));
  y += nameSize + Math.round(H * 0.01);

  // Title � light, mid-gray
  const titleSize = Math.round(H * 0.02); // 12px
  layers.push(styledText({
    name: "Title",
    x: nameX, y, w: rightW,
    text: cfg.title || "Job Title",
    fontSize: titleSize,
    fontFamily: sansFont,
    weight: 300,
    color: "#6a6a6a",
    letterSpacing: 2, // ~0.08em
    tags: ["title"],
  }));
  y += titleSize + Math.round(H * 0.025);

  // Divider
  layers.push(filledRect({
    name: "Divider",
    x: nameX, y, w: Math.round(W * 0.06), h: 1,
    fill: solidPaintHex("#d0d0d0"), tags: ["decorative", "divider"],
  }));
  y += 1 + Math.round(H * 0.02);

  // Contact lines � light, light gray
  const contactSize = Math.round(H * 0.018); // 11px
  const contactLineH = Math.round(contactSize * 1.7);
  const contactEntries = getContactEntries(cfg);
  for (let i = 0; i < Math.min(contactEntries.length, 4); i++) {
    layers.push(styledText({
      name: contactEntries[i].type,
      x: nameX, y, w: rightW,
      text: contactEntries[i].value,
      fontSize: contactSize,
      fontFamily: sansFont,
      weight: 300,
      color: "#8a8a8a",
      tags: [`contact-${contactEntries[i].type}`, "contact-text"],
    }));
    y += contactLineH;
  }

  return layers;
}

// Register monogram-luxe back layout
registerBackLayout("monogram-luxe", (W, H, cfg, theme) => {
  const sansFont = cfg.fontFamily;
  const serifFont = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background: dark charcoal (inverted from front)
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #2c2c2c
    tags: ["background", "back-element"],
  }));

  // Centered monogram � same initial, lighter color, slightly smaller
  const personInitial = ((cfg.name || "S")[0] || "S").toUpperCase();
  const monoSize = Math.round(H * 0.35); // 210px
  layers.push(styledText({
    name: "Back Monogram",
    x: 0, y: Math.round(H * 0.40 - monoSize * 0.5), w: W, h: monoSize,
    text: personInitial,
    fontSize: monoSize,
    fontFamily: serifFont,
    weight: 400,
    color: theme.backText, // #d8d6d9
    align: "center",
    tags: ["decorative", "monogram", "branding", "back-element"],
  }));

  // Name split into words, each on own line, wide letter-spacing, centered
  const nameWords = (cfg.name || "SAMIRA HADID").toUpperCase().split(/\s+/);
  const nameSize = Math.round(H * 0.035); // 21px
  let nameY = Math.round(H * 0.40 + monoSize * 0.35);
  for (const word of nameWords) {
    layers.push(styledText({
      name: `Name Word`,
      x: 0, y: nameY, w: W,
      text: word,
      fontSize: nameSize,
      fontFamily: sansFont,
      weight: 600,
      color: theme.backText,
      align: "center",
      uppercase: true,
      letterSpacing: 8, // ~0.25em � very wide
      tags: ["name", "back-element"],
    }));
    nameY += nameSize + Math.round(H * 0.01);
  }

  return layers;
});

/**
 * Template #3 � Geometric Mark (Rob Simax / AV reference)
 * FRONT: Dark horizontal gradient bg, centered interlocking AV monogram
 * with 45� white hatching. NO text on front.
 * Note: The hatching effect is approximated with diagonal line paths since
 * we can't do true Canvas2D clipping in the layer system.
 */
function layoutGeometricMark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["geometric-mark"];

  const font = ff;
  const layers: LayerV2[] = [];

  // Background: cool pale white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#f8f9fb"), tags: ["background"],
  }));

  // Watermark monogram (ghosted, shifted right, large)
  // Simplified as a large semi-transparent AV mark
  const wmCx = W * 0.64;
  const wmCy = H * 0.48;
  const wmW = W * 0.40;
  const wmH = H * 0.70;

  const wmBandA: import("./schema").PathCommand[] = [
    M(wmCx - wmW * 0.05, wmCy - wmH * 0.50),
    L(wmCx - wmW * 0.50, wmCy + wmH * 0.50),
    L(wmCx - wmW * 0.30, wmCy + wmH * 0.50),
    L(wmCx + wmW * 0.05, wmCy - wmH * 0.20),
    L(wmCx + wmW * 0.15, wmCy - wmH * 0.50),
    Z()];
  const wmBandB: import("./schema").PathCommand[] = [
    M(wmCx + wmW * 0.05, wmCy - wmH * 0.50),
    L(wmCx + wmW * 0.50, wmCy + wmH * 0.50),
    L(wmCx + wmW * 0.30, wmCy + wmH * 0.50),
    L(wmCx - wmW * 0.05, wmCy - wmH * 0.20),
    L(wmCx - wmW * 0.15, wmCy - wmH * 0.50),
    Z()];

  layers.push(pathLayer({
    name: "Watermark Band A",
    commands: wmBandA,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark"],
    opacity: 0.25,
  }));
  layers.push(pathLayer({
    name: "Watermark Band B",
    commands: wmBandB,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark"],
    opacity: 0.25,
  }));

  // Name (bold, near-black, top-left)
  const nameSize = Math.round(H * 0.033); // 20px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.088), y: Math.round(H * 0.126), w: Math.round(W * 0.50),
    text: (cfg.name || "ROB SIMAX").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#1c1d1e",
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    tags: ["name", "primary-text"],
  }));

  // Title (light, mid-gray, very wide spacing)
  const titleSize = Math.round(H * 0.020); // 12px
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.090), y: Math.round(H * 0.210), w: Math.round(W * 0.50),
    text: (cfg.company || cfg.title || "ARTIST").toUpperCase(),
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#838587",
    uppercase: true,
    letterSpacing: 6, // ~0.25em
    tags: ["title"],
  }));

  // Address (light, medium gray, bottom-left)
  const contactSize = Math.round(H * 0.020);
  layers.push(styledText({
    name: "Address",
    x: Math.round(W * 0.090), y: Math.round(H * 0.772), w: Math.round(W * 0.55),
    text: (cfg.address || "BOULEVARD 01234").toUpperCase(),
    fontSize: contactSize,
    fontFamily: font,
    weight: 300,
    color: "#8a8b8d",
    uppercase: true,
    letterSpacing: 2,
    tags: ["contact-address"],
  }));

  // Contact line 1: phone (right-aligned)
  if (cfg.phone) {
    layers.push(styledText({
      name: "Phone",
      x: Math.round(W * 0.09), y: Math.round(H * 0.825), w: Math.round(W * 0.64),
      text: cfg.phone,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#939495",
      align: "right",
      tags: ["contact-phone"],
    }));
  }

  // Contact line 2: email + website
  if (cfg.email) {
    layers.push(styledText({
      name: "Email",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.35),
      text: cfg.email,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      tags: ["contact-email"],
    }));
  }
  if (cfg.website) {
    layers.push(styledText({
      name: "Website",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.67),
      text: cfg.website,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      align: "right",
      tags: ["contact-website"],
    }));
  }

  return layers;

}

// Register geometric-mark back layout
registerBackLayout("geometric-mark", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // Background: dark horizontal gradient with cool-blue tint
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(0, [
      { color: "#252628", offset: 0 },
      { color: "#3b3c3e", offset: 0.50 },
      { color: "#4b4c4e", offset: 0.65 },
      { color: "#3e3f41", offset: 1.0 },
    ]),
    tags: ["background", "back-element"],
  }));

  // Interlocking monogram � build as a compound path representing the
  // AV ribbon bands. We use the simplified silhouette approach:
  // two overlapping V-shapes that create the interlocking illusion.
  const cx = W * 0.50;
  const cy = H * 0.505;
  const mW = W * 0.308; // 30.8% of W
  const mH = H * 0.33;  // 33% of H

  // Band A (left-leaning "A" shape)
  const bandA: import("./schema").PathCommand[] = [
    M(cx - mW * 0.05, cy - mH * 0.50),  // top center-left
    L(cx - mW * 0.50, cy + mH * 0.50),  // bottom left
    L(cx - mW * 0.30, cy + mH * 0.50),  // bottom inner-left
    L(cx + mW * 0.05, cy - mH * 0.20),  // mid right
    L(cx + mW * 0.15, cy - mH * 0.50),  // top right
    Z(),
  ];

  // Band B (right-leaning "V" shape)
  const bandB: import("./schema").PathCommand[] = [
    M(cx + mW * 0.05, cy - mH * 0.50),  // top center-right
    L(cx + mW * 0.50, cy + mH * 0.50),  // bottom right
    L(cx + mW * 0.30, cy + mH * 0.50),  // bottom inner-right
    L(cx - mW * 0.05, cy - mH * 0.20),  // mid left
    L(cx - mW * 0.15, cy - mH * 0.50),  // top left
    Z(),
  ];

  // Render bands as white paths to approximate the hatched monogram
  layers.push(pathLayer({
    name: "Monogram Band A",
    commands: bandA,
    fill: solidPaintHex("#ffffff", 0.85),
    tags: ["decorative", "monogram", "branding", "back-element"],
    opacity: 0.85,
  }));
  layers.push(pathLayer({
    name: "Monogram Band B",
    commands: bandB,
    fill: solidPaintHex("#ffffff", 0.85),
    tags: ["decorative", "monogram", "branding", "back-element"],
    opacity: 0.85,
  }));

  // Hatching lines overlay (45� diagonal pattern across monogram area)
  // We create several parallel diagonal lines covering the monogram bounds
  const hatchCmds: import("./schema").PathCommand[] = [];
  const hatchSpacing = Math.round(W * 0.015); // ~16px
  const hatchW = mW * 1.2;
  const hatchH = mH * 1.2;
  const startX = cx - hatchW / 2;
  const startY = cy - hatchH / 2;

  for (let offset = -hatchW; offset < hatchW + hatchH; offset += hatchSpacing) {
    hatchCmds.push(
      M(startX + offset, startY),
      L(startX + offset - hatchH, startY + hatchH),
    );
  }

  if (hatchCmds.length > 0) {
    layers.push(pathLayer({
      name: "Hatching Pattern",
      commands: hatchCmds,
      stroke: makeStroke("#ffffff", Math.round(W * 0.003), 0.4),
      fill: solidPaintHex("#000000", 0),
      closed: false,
      tags: ["decorative", "hatching", "monogram", "back-element"],
      opacity: 0.4,
    }));
  }

  return layers;

});

/**
 * Template #4 � Frame Minimal (Adika Saputra reference)
 * FRONT: Pure white bg, 2 diagonal L-brackets (TL + BR only),
 * 5-level gray text hierarchy, color-coded contact dots, QR code.
 */
function layoutFrameMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["frame-minimal"];
  const font = ff;
  const layers: LayerV2[] = [];

  // Background: pure white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#FFFFFF"), tags: ["background"],
  }));

  // L-Bracket: top-left corner
  const bracketArmH = Math.round(W * 0.076); // 7.6% W horizontal arm
  const bracketArmV = Math.round(H * 0.10);  // 10% H vertical arm
  const bracketThick = 1.5;
  const tlX = Math.round(W * 0.10);
  const tlY = Math.round(H * 0.16);

  layers.push(pathLayer({
    name: "TL Bracket",
    commands: cornerBracketPath("tl", tlX, tlY, Math.max(bracketArmH, bracketArmV), bracketThick),
    fill: solidPaintHex("#CCCCCC"),
    tags: ["decorative", "corner", "corner-bracket"],
  }));

  // L-Bracket: bottom-right corner (mirror)
  const brX = Math.round(W * 0.90);
  const brY = Math.round(H * 0.84);
  layers.push(pathLayer({
    name: "BR Bracket",
    commands: cornerBracketPath("br", brX, brY, Math.max(bracketArmH, bracketArmV), bracketThick),
    fill: solidPaintHex("#CCCCCC"),
    tags: ["decorative", "corner", "corner-bracket"],
  }));

  // Name � semibold, dark
  const textLeft = Math.round(W * 0.143);
  let y = Math.round(H * 0.24);
  const nameSize = Math.round(H * 0.045); // 27px
  layers.push(styledText({
    name: "Name",
    x: textLeft, y, w: Math.round(W * 0.55),
    text: (cfg.name || "ADIKA SAPUTRA").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#2D2D2D",
    uppercase: true,
    letterSpacing: 5, // ~0.18em
    tags: ["name", "primary-text"],
  }));
  y += nameSize + Math.round(H * 0.06);

  // Title � light, mid-gray, Title Case
  const titleSize = Math.round(H * 0.025); // 15px
  layers.push(styledText({
    name: "Title",
    x: textLeft, y, w: Math.round(W * 0.50),
    text: cfg.title || "Graphic Designer",
    fontSize: titleSize,
    fontFamily: font,
    weight: 300,
    color: "#888888",
    letterSpacing: 1,
    tags: ["title"],
  }));
  y += titleSize + Math.round(H * 0.16); // big breathing room before contacts

  // Color-coded contact dots + text
  const dotRadius = 3;
  const dotColors = ["#FF6B35", "#4CAF50", "#2196F3"]; // orange, green, blue
  const contactTypes = [
    { field: cfg.phone, type: "phone" },
    { field: cfg.email, type: "email" },
    { field: cfg.address, type: "address" },
  ];
  const contactSize = Math.round(H * 0.020); // 12px
  const contactGap = Math.round(H * 0.06);

  for (let i = 0; i < contactTypes.length; i++) {
    const entry = contactTypes[i];
    if (!entry.field) continue;
    const lineY = y + i * contactGap;

    // Colored dot
    layers.push(filledEllipse({
      name: `${entry.type} Dot`,
      cx: textLeft + dotRadius, cy: lineY + contactSize / 2,
      rx: dotRadius, ry: dotRadius,
      fill: solidPaintHex(dotColors[i]),
      tags: ["decorative", "contact-dot"],
    }));

    // Contact text
    layers.push(styledText({
      name: entry.type,
      x: textLeft + 25, y: lineY, w: Math.round(W * 0.50),
      text: entry.field,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#999999",
      tags: [`contact-${entry.type}`, "contact-text"],
    }));
  }

  // Website (lighter gray)
  if (cfg.website) {
    const webY = y + contactTypes.length * contactGap;
    layers.push(styledText({
      name: "Website",
      x: textLeft + 25, y: webY, w: Math.round(W * 0.50),
      text: cfg.website,
      fontSize: Math.round(H * 0.018), // 11px
      fontFamily: font,
      weight: 400,
      color: "#AAAAAA",
      tags: ["contact-website", "contact-text"],
    }));
  }

  // QR Code placeholder (top-right)
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.13); // 137px
    layers.push(filledRect({
      name: "QR Code Area",
      x: Math.round(W * 0.80), y: Math.round(H * 0.20), w: qrSize, h: qrSize,
      fill: solidPaintHex("#000000", 0.05),
      tags: ["qr-code", "branding"],
    }));
  }

  return layers;
}

// Register frame-minimal back layout
registerBackLayout("frame-minimal", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background: near-black
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#1A1A1A"), tags: ["background", "back-element"],
  }));

  // Closed rectangular frame (58% W � 30% H, centered)
  const frameW = Math.round(W * 0.58);
  const frameH = Math.round(H * 0.30);
  const frameX = Math.round((W - frameW) / 2);
  const frameY = Math.round(H * 0.47 - frameH / 2);
  layers.push(strokeRect({
    name: "Back Frame",
    x: frameX, y: frameY, w: frameW, h: frameH,
    color: "#FFFFFF", alpha: 0.6, width: 1,
    tags: ["decorative", "border", "back-element"],
  }));

  // "MINIMAL" text � bold, extremely wide tracking
  layers.push(styledText({
    name: "Main Title",
    x: frameX, y: frameY + Math.round(frameH * 0.33), w: frameW,
    text: (cfg.company || "MINIMAL").toUpperCase(),
    fontSize: Math.round(H * 0.085), // 51px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    align: "center",
    uppercase: true,
    letterSpacing: 12, // ~0.35em
    tags: ["company", "back-element"],
  }));

  // Subtitle � light, muted
  layers.push(styledText({
    name: "Subtitle",
    x: frameX, y: frameY + Math.round(frameH * 0.70), w: frameW,
    text: cfg.tagline || "Business Card",
    fontSize: Math.round(H * 0.030), // 18px
    fontFamily: font,
    weight: 300,
    color: "#AAAAAA",
    align: "center",
    letterSpacing: 3,
    tags: ["tagline", "back-element"],
  }));

  // White QR code (top-right corner)
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.09);
    layers.push(filledRect({
      name: "QR Code Area",
      x: Math.round(W * 0.85), y: Math.round(H * 0.08), w: qrSize, h: qrSize,
      fill: solidPaintHex("#FFFFFF", 0.08),
      tags: ["qr-code", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #5 � Split Vertical (Pathetic Studio reference)
 * FRONT: Diagonal trapezoid split (58% top ? 38% bottom), dark left + warm
 * off-white right. 5 geometric logo bars, company name, tagline � ALL on dark.
 * Light zone is EMPTY.
 */
function layoutSplitVertical(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["split-vertical"];

  const font = ff;
  const layers: LayerV2[] = [];

  // Background: warm off-white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#F5F5F0"), tags: ["background"],
  }));

  // Dark trapezoid mirrored: (42%W, 0) ? (W, 0) ? (W, H) ? (62%W, H)
  layers.push(pathLayer({
    name: "Dark Trapezoid",
    commands: [
      M(Math.round(W * 0.42), 0),
      L(W, 0),
      L(W, H),
      L(Math.round(W * 0.62), H),
      Z()],
    fill: solidPaintHex("#2C2C2C"),
    tags: ["decorative", "accent", "panel"],
  }));

  // Contact details in light zone (left side)
  const iconR = Math.round(H * 0.0175);
  const iconCX = Math.round(W * 0.08);
  const contactTextX = Math.round(W * 0.14);
  const contactSize = Math.round(H * 0.025); // 15px
  const contactFields = [
    cfg.address || "Your Address",
    cfg.phone || "+012 345 678",
    cfg.email || "email@mail.com",
    cfg.website || "www.website.com"];
  const contactYs = [0.22, 0.30, 0.38, 0.46];

  for (let i = 0; i < contactFields.length; i++) {
    if (!contactFields[i]) continue;
    const cY = Math.round(H * contactYs[i]);

    // Circle icon outline
    layers.push(strokeEllipse({
      name: `Contact Icon ${i + 1}`,
      cx: iconCX, cy: cY,
      rx: iconR, ry: iconR,
      color: "#888888", width: 1,
      tags: ["contact-icon"],
    }));

    // Contact text
    layers.push(styledText({
      name: `Contact ${i + 1}`,
      x: contactTextX, y: cY - contactSize / 2, w: Math.round(W * 0.28),
      text: contactFields[i],
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#444444",
      letterSpacing: 1,
      tags: ["contact-text"],
    }));
  }

  // Separator line
  layers.push(filledRect({
    name: "Separator",
    x: Math.round(W * 0.08), y: Math.round(H * 0.63),
    w: Math.round(W * 0.25), h: 1,
    fill: solidPaintHex("#CCCCCC", 0.6),
    tags: ["decorative", "divider"],
  }));

  // Name (bold, dark � ties visually to dark zone)
  const nameSize = Math.round(H * 0.05); // 30px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.68), w: Math.round(W * 0.35),
    text: cfg.name || "Person Name",
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#2C2C2C",
    letterSpacing: 1,
    tags: ["name", "primary-text"],
  }));

  // Title (light, medium gray, moderate tracking)
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.08), y: Math.round(H * 0.75), w: Math.round(W * 0.35),
    text: cfg.title || "Graphic Designer",
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 300,
    color: "#888888",
    letterSpacing: 3,
    tags: ["title"],
  }));

  // Social icons on dark zone (right side) � white circle outlines
  const socialX = Math.round(W * 0.85);
  const socialR = Math.round(H * 0.018);
  const socialYs = [0.25, 0.33, 0.41, 0.49, 0.57];

  for (let i = 0; i < socialYs.length; i++) {
    layers.push(strokeEllipse({
      name: `Social Icon ${i + 1}`,
      cx: socialX, cy: Math.round(H * socialYs[i]),
      rx: socialR, ry: socialR,
      color: "#FFFFFF", width: 1,
      tags: ["decorative", "social-icon"],
    }));
  }

  return layers;

}

// Register split-vertical back layout
registerBackLayout("split-vertical", (W, H, cfg, theme) => {
  const t = theme;
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background: warm off-white #F5F5F0
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.backBg), tags: ["background", "back-element"],
  }));

  // Dark diagonal trapezoid: (0,0) ? (58%W, 0) ? (38%W, H) ? (0, H)
  layers.push(pathLayer({
    name: "Dark Trapezoid",
    commands: [
      M(0, 0),
      L(Math.round(W * 0.58), 0),
      L(Math.round(W * 0.38), H),
      L(0, H),
      Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt!), // #2C2C2C
    tags: ["decorative", "accent", "panel", "back-element"],
  }));

  // 5 geometric logo bars (white, varying widths)
  const barWidths = [0.022, 0.018, 0.027, 0.015, 0.020]; // % of W
  const barH = Math.round(H * 0.015);
  const barGap = Math.round(H * 0.01);
  const barX = Math.round(W * 0.22);
  let barY = Math.round(H * 0.30);

  for (let i = 0; i < barWidths.length; i++) {
    layers.push(filledRect({
      name: `Logo Bar ${i + 1}`,
      x: barX, y: barY, w: Math.round(W * barWidths[i]), h: barH,
      fill: solidPaintHex("#FFFFFF"),
      tags: ["decorative", "logo-mark", "branding", "back-element"],
    }));
    barY += barH + barGap;
  }

  // Studio name (white, semibold, wide tracking)
  const nameSize = Math.round(H * 0.055); // 33px
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.22), y: Math.round(H * 0.42), w: Math.round(W * 0.30),
    text: (cfg.company || "PATHETIC STUDIO").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 600,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 7, // ~0.20em
    tags: ["company", "branding", "primary-text", "back-element"],
  }));

  // Tagline (white @ 65% alpha, light, very wide tracking)
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.22), y: Math.round(H * 0.52), w: Math.round(W * 0.30),
    text: (cfg.tagline || "YOUR DESIGN STUDIO").toUpperCase(),
    fontSize: Math.round(H * 0.022), // 13px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    alpha: 0.65,
    uppercase: true,
    letterSpacing: 8, // ~0.30em
    tags: ["tagline", "back-element"],
  }));

  return layers;

});

/**
 * Template #6 � Diagonal Mono (Henry Soaz reference)
 * FRONT: Multi-angle 7-segment zigzag polygon dividing charcoal and warm off-white,
 * white accent triangle on Segment 1, large rotated decorative name on light side,
 * name + title in chevron notch on dark side, contact info on light side.
 */
function layoutDiagonalMono(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diagonal-mono"];
  const font = ff;
  const layers: LayerV2[] = [];

  // Background: warm off-white #E2E2E2
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Dark polygon: 7-segment zigzag with chevron notch
  layers.push(pathLayer({
    name: "Dark Zigzag Polygon",
    commands: [
      M(0, 0),
      L(Math.round(W * 0.43), 0),                   // top edge to boundary start
      L(Math.round(W * 0.46), Math.round(H * 0.20)), // Seg 1: gentle lean right
      L(Math.round(W * 0.29), Math.round(H * 0.30)), // Seg 2: sharp chevron cut
      L(Math.round(W * 0.30), Math.round(H * 0.38)), // Seg 3: narrow hold
      L(Math.round(W * 0.49), Math.round(H * 0.39)), // Seg 4: step right
      L(Math.round(W * 0.15), Math.round(H * 0.63)), // Seg 5: steep diagonal sweep
      L(Math.round(W * 0.47), Math.round(H * 0.64)), // Seg 6: step right
      L(Math.round(W * 0.57), H),                    // Seg 7: gentle lean to bottom
      L(0, H),                                        // bottom-left corner
      Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt!), // #232323
    tags: ["decorative", "accent", "panel"],
  }));

  // White accent triangle along Segment 1
  layers.push(pathLayer({
    name: "Accent Triangle",
    commands: [
      M(Math.round(W * 0.43), 0),
      L(Math.round(W * 0.475), 0),
      L(Math.round(W * 0.46), Math.round(H * 0.20)),
      Z(),
    ],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "accent"],
  }));

  // Name in chevron notch (white on dark)
  const nameSize = Math.round(H * 0.10); // 60px
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.22), w: Math.round(W * 0.34),
    text: (cfg.name || "HENRY SOAZ").toUpperCase(),
    fontSize: nameSize,
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 4, // ~0.12em
    lineHeight: 1.1,
    tags: ["name", "primary-text"],
  }));

  // Title below name (white on dark, lowercase)
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.10), y: Math.round(H * 0.36), w: Math.round(W * 0.28),
    text: cfg.title || "title / position",
    fontSize: Math.round(H * 0.04), // 24px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    tags: ["title"],
  }));

  // Large rotated decorative name on light side (~32� CW)
  // Note: rotation is applied via the layer's transform property
  const rotatedSize = Math.round(H * 0.16); // 96px
  const rotatedLayer = styledText({
    name: "Decorative Name",
    x: Math.round(W * 0.50), y: Math.round(H * 0.10), w: Math.round(W * 0.50),
    text: (cfg.name || "HENRY SOAZ").toUpperCase(),
    fontSize: rotatedSize,
    fontFamily: font,
    weight: 700,
    color: "#232323",
    uppercase: true,
    tags: ["decorative", "name-decorative"],
  });
  // Apply rotation transform: ~32� clockwise
  rotatedLayer.transform.rotation = 32;
  layers.push(rotatedLayer);

  // Contact information on light side (right of boundary)
  const contactX = Math.round(W * 0.50);
  const contactSize = Math.round(H * 0.025); // 15px
  const contactLines = [
    { text: cfg.address || "Main Street, Your Location", y: 0.40 },
    { text: cfg.address ? "" : "Number 123A, 56478", y: 0.44 },
    { text: cfg.email || "hr@email.com", y: 0.54 },
    { text: cfg.phone || "+92 94 56 789", y: 0.59 },
    { text: cfg.website || "www.company.com", y: 0.64 },
  ];

  for (const cl of contactLines) {
    if (!cl.text) continue;
    layers.push(styledText({
      name: "Contact",
      x: contactX, y: Math.round(H * cl.y), w: Math.round(W * 0.40),
      text: cl.text,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#232323",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register diagonal-mono back layout
registerBackLayout("diagonal-mono", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background: warm off-white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#E2E2E2"), tags: ["background", "back-element"],
  }));

  // Complex 5-zone dark polygon
  layers.push(pathLayer({
    name: "Back Dark Polygon",
    commands: [
      M(Math.round(W * 0.35), 0),
      L(W, 0),
      L(W, Math.round(H * 0.65)),
      L(Math.round(W * 0.62), Math.round(H * 0.72)),
      L(Math.round(W * 0.65), H),
      L(0, H),
      L(0, Math.round(H * 0.46)),
      L(Math.round(W * 0.38), Math.round(H * 0.28)),
      Z(),
    ],
    fill: solidPaintHex("#232323"),
    tags: ["decorative", "accent", "panel", "back-element"],
  }));

  // Geometric logo: 2 crossing white lines forming X
  const logoStroke = makeStroke("#FFFFFF", Math.round(W * 0.01));

  // Line A
  layers.push(pathLayer({
    name: "Logo Line A",
    commands: [
      M(Math.round(W * 0.50), Math.round(H * 0.48)),
      L(Math.round(W * 0.35), Math.round(H * 0.61)),
    ],
    fill: solidPaintHex("#000000", 0),
    stroke: logoStroke,
    closed: false,
    tags: ["logo-mark", "branding", "back-element"],
  }));

  // Line B
  layers.push(pathLayer({
    name: "Logo Line B",
    commands: [
      M(Math.round(W * 0.67), Math.round(H * 0.50)),
      L(Math.round(W * 0.46), Math.round(H * 0.65)),
    ],
    fill: solidPaintHex("#000000", 0),
    stroke: logoStroke,
    closed: false,
    tags: ["logo-mark", "branding", "back-element"],
  }));

  // Satellite dots
  const dotR = Math.round(W * 0.004);
  layers.push(filledEllipse({
    name: "Satellite Dot 1",
    cx: Math.round(W * 0.505), cy: Math.round(H * 0.53), rx: dotR, ry: dotR,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "back-element"],
  }));
  layers.push(filledEllipse({
    name: "Satellite Dot 2",
    cx: Math.round(W * 0.595), cy: Math.round(H * 0.535), rx: dotR, ry: dotR,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative", "back-element"],
  }));

  // "COMPANY" text (white, bold, wide tracking)
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.55), y: Math.round(H * 0.55), w: Math.round(W * 0.35),
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.04), // 24px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["company", "branding", "back-element"],
  }));

  return layers;
});

// ===================== MODERN TEMPLATES =====================

// -------------------------------------------------------------
// Template #7 � cyan-tech
// Reference: Code Pro Development � Michal Johns
// Dark charcoal bg + organic double-lobe S-curve cyan wave
// -------------------------------------------------------------

function layoutCyanTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["cyan-tech"];

  const layers: LayerV2[] = [];

  // Background — dark charcoal
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg),
    tags: ["background"],
  }));

  // Organic S-curve cyan wave from RIGHT edge (double-lobed)
  const wavePath = [
    M(W, H * 0.15),
    C(W * 0.78, H * 0.18, W * 0.65, H * 0.28, W * 0.60, H * 0.38),
    C(W * 0.56, H * 0.46, W * 0.62, H * 0.50, W * 0.65, H * 0.54),
    C(W * 0.68, H * 0.58, W * 0.58, H * 0.68, W * 0.55, H * 0.76),
    C(W * 0.52, H * 0.84, W * 0.70, H * 0.92, W, H * 0.95),
    L(W, H * 0.15),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Cyan Wave",
    commands: wavePath,
    fill: solidPaintHex(t.accent || "#2DB5E5"),
    tags: ["decorative", "wave"],
  }));

  // Gear icon (cog with teeth) — upper-left area
  const gearCx = Math.round(W * 0.12);
  const gearCy = Math.round(H * 0.20);
  const gearR = Math.round(W * 0.045);
  const toothCount = 8;
  const innerR = gearR * 0.7;
  const gearCommands: PathCommand[] = [];
  for (let i = 0; i < toothCount; i++) {
    const a1 = (i / toothCount) * Math.PI * 2;
    const a2 = ((i + 0.3) / toothCount) * Math.PI * 2;
    const a3 = ((i + 0.5) / toothCount) * Math.PI * 2;
    const a4 = ((i + 0.8) / toothCount) * Math.PI * 2;
    if (i === 0) gearCommands.push(M(gearCx + gearR * Math.cos(a1), gearCy + gearR * Math.sin(a1)));
    gearCommands.push(L(gearCx + gearR * Math.cos(a2), gearCy + gearR * Math.sin(a2)));
    gearCommands.push(L(gearCx + innerR * Math.cos(a3), gearCy + innerR * Math.sin(a3)));
    gearCommands.push(L(gearCx + innerR * Math.cos(a4), gearCy + innerR * Math.sin(a4)));
  }
  gearCommands.push(Z());
  layers.push(pathLayer({
    name: "Gear Icon",
    commands: gearCommands,
    fill: solidPaintHex(t.frontText),
    tags: ["logo", "icon", "gear"],
  }));
  // Gear center hole
  layers.push(filledEllipse({
    name: "Gear Hub",
    cx: gearCx, cy: gearCy, rx: Math.round(innerR * 0.4), ry: Math.round(innerR * 0.4),
    fill: solidPaintHex(t.frontBg),
    tags: ["logo", "icon"],
  }));

  // Company name — below gear
  layers.push(styledText({
    name: "Company",
    x: W * 0.05, y: H * 0.32,
    w: W * 0.38,
    text: (cfg.company || "CODE PRO").toUpperCase(),
    fontSize: Math.round(H * 0.055),
    fontFamily: ff,
    weight: 600,
    color: t.frontText,
    letterSpacing: 3,
    tags: ["company"],
  }));

  // Tagline — below company
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline",
      x: W * 0.05, y: H * 0.40,
      w: W * 0.38,
      text: cfg.tagline.toUpperCase(),
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 300,
      color: t.frontText,
      alpha: 0.7,
      letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  // Email text placed ON the wave curve
  if (cfg.email) {
    layers.push(styledText({
      name: "Email",
      x: W * 0.55, y: H * 0.82,
      w: W * 0.40,
      text: cfg.email,
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 400,
      color: "#FFFFFF",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register cyan-tech back layout
registerBackLayout("cyan-tech", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background — dark charcoal
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg),
    tags: ["background", "back-element"],
  }));

  // Mirrored cyan wave from LEFT edge
  const wavePath = [
    M(0, H * 0.15),
    C(W * 0.22, H * 0.18, W * 0.35, H * 0.28, W * 0.40, H * 0.38),
    C(W * 0.44, H * 0.46, W * 0.38, H * 0.50, W * 0.35, H * 0.54),
    C(W * 0.32, H * 0.58, W * 0.42, H * 0.68, W * 0.45, H * 0.76),
    C(W * 0.48, H * 0.84, W * 0.30, H * 0.92, 0, H * 0.95),
    L(0, H * 0.15),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Cyan Wave",
    commands: wavePath,
    fill: solidPaintHex(theme.accent!),
    tags: ["decorative", "wave", "back-element"],
  }));

  // Name — right zone
  layers.push(styledText({
    name: "Name",
    x: W * 0.55, y: H * 0.18,
    w: W * 0.40,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.06),
    fontFamily: font,
    weight: 700,
    color: theme.backText,
    tags: ["name", "back-element"],
  }));

  // Title
  layers.push(styledText({
    name: "Title",
    x: W * 0.55, y: H * 0.28,
    w: W * 0.40,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 400,
    color: theme.backText,
    alpha: 0.7,
    tags: ["title", "back-element"],
  }));

  // Contact block — right zone
  layers.push(...contactWithIcons({
    contacts: cfg.contacts,
    x: W * 0.55, startY: H * 0.42,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.022),
    fontFamily: font,
    textColor: theme.backText,
    iconColor: theme.backAccent || theme.accent || "#2DB5E5",
    maxY: H * 0.80,
    tags: ["back-element"],
  }));

  // White downward triangle mark
  const triPath = [
    M(W * 0.55, H * 0.85),
    L(W * 0.65, H * 0.85),
    L(W * 0.60, H * 0.93),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Triangle Mark",
    commands: triPath,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "brand-mark", "back-element"],
  }));

  return layers;
});


// -------------------------------------------------------------

function layoutCorporateChevron(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["corporate-chevron"];

  const layers: LayerV2[] = [];

  // Background — light warm near-white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg),
    tags: ["background"],
  }));

  // Subtle whisper-level chevrons on right side, pointing LEFT
  const backBandW = -W * 0.12;
  const makeChevron = (tipX: number, tipY: number, vtxX: number, vtxY: number, bw: number) => {
    const topArm = [M(tipX, tipY), L(tipX + bw, tipY), L(vtxX + bw, vtxY), L(vtxX, vtxY), Z()];
    const botArm = [M(vtxX, vtxY), L(vtxX + bw, vtxY), L(tipX + bw, tipY + 2 * (vtxY - tipY)), L(tipX, tipY + 2 * (vtxY - tipY)), Z()];
    return [topArm, botArm];
  };

  const [bV1top, bV1bot] = makeChevron(W * 0.95, H * 0.10, W * 0.77, H * 0.46, backBandW);
  layers.push(pathLayer({ name: "Chevron V1 Top", commands: bV1top, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));
  layers.push(pathLayer({ name: "Chevron V1 Bot", commands: bV1bot, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));

  const [bV2top, bV2bot] = makeChevron(W * 0.93, H * 0.51, W * 0.77, H * 0.87, backBandW);
  layers.push(pathLayer({ name: "Chevron V2 Top", commands: bV2top, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));
  layers.push(pathLayer({ name: "Chevron V2 Bot", commands: bV2bot, fill: solidPaintHex(t.divider || "#DDDDDD"), tags: ["decorative", "chevron"] }));

  // Name — upper left, prominent
  layers.push(styledText({
    name: "Name",
    x: W * 0.07, y: H * 0.20,
    w: W * 0.42,
    text: (cfg.name || "Jonathan Doe").toUpperCase(),
    fontSize: Math.round(H * 0.06),
    fontFamily: ff,
    weight: 700,
    color: t.frontText,
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // Title — below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.07, y: H * 0.30,
    w: W * 0.38,
    text: cfg.title || "Graphic Designer",
    fontSize: Math.round(H * 0.035),
    fontFamily: ff,
    weight: 400,
    color: "#8C8C8C",
    tags: ["title"],
  }));

  // Logo mark — small triangle
  const logoSize = Math.round(W * 0.04);
  const logoX = Math.round(W * 0.07);
  const logoY = Math.round(H * 0.44);
  layers.push(pathLayer({
    name: "Logo Mark",
    commands: [
      M(logoX, logoY + logoSize),
      L(logoX + logoSize / 2, logoY),
      L(logoX + logoSize, logoY + logoSize),
      Z(),
    ],
    fill: solidPaintHex(t.frontText),
    tags: ["logo", "brand-mark"],
  }));

  // Contact block with proper icons
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.07, startY: H * 0.55,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: t.contactText || "#727780",
    iconColor: t.contactIcon || "#4D5562",
    maxY: H * 0.85,
    tags: ["contact-text"],
  }));

  // Company branding — right zone, moderate size
  layers.push(styledText({
    name: "Company Branding",
    x: W * 0.56, y: H * 0.70,
    w: W * 0.38,
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.055),
    fontFamily: ff,
    weight: 700,
    color: t.accent || "#1C1C1E",
    letterSpacing: 4,
    tags: ["company", "branding"],
  }));

  return layers;
}

// Register corporate-chevron back layout
registerBackLayout("corporate-chevron", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background � dark desaturated navy
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #1E2633
    tags: ["background", "back-element"],
  }));

  // Helper: draw a V-shaped chevron as two parallelogram arms
  // tipX/tipY = starting edge, vtxX/vtxY = vertex point, bandW = arm width
  function chevronVPaths(tipX: number, tipY: number, vtxX: number, vtxY: number, bandW: number): PathCommand[][] {
    const topArm = [
      M(tipX, tipY),
      L(tipX + bandW, tipY),
      L(vtxX + bandW, vtxY),
      L(vtxX, vtxY),
      Z(),
    ];
    const bottomArm = [
      M(vtxX, vtxY),
      L(vtxX + bandW, vtxY),
      L(tipX + bandW, tipY + 2 * (vtxY - tipY)),
      L(tipX, tipY + 2 * (vtxY - tipY)),
      Z(),
    ];
    return [topArm, bottomArm];
  }

  // Dark chevron bands (#1A202A) � behind light chevrons
  const darkBandW = -W * 0.10; // negative = extending left from tip
  const [dV1top, dV1bot] = chevronVPaths(W * 0.46, H * 0.10, W * 0.23, H * 0.54, darkBandW);
  layers.push(pathLayer({
    name: "Dark Chevron V1 Top",
    commands: dV1top,
    fill: solidPaintHex(theme.frontBgAlt || "#1A202A"),
    tags: ["decorative", "chevron", "back-element"],
  }));
  layers.push(pathLayer({
    name: "Dark Chevron V1 Bot",
    commands: dV1bot,
    fill: solidPaintHex(theme.frontBgAlt || "#1A202A"),
    tags: ["decorative", "chevron", "back-element"],
  }));

  // Light chevron bands (#324154) � on top
  const lightBandW = W * 0.12;
  const [lV1top, lV1bot] = chevronVPaths(0, H * 0.05, W * 0.22, H * 0.40, lightBandW);
  layers.push(pathLayer({
    name: "Light Chevron V1 Top",
    commands: lV1top,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron", "back-element"],
  }));
  layers.push(pathLayer({
    name: "Light Chevron V1 Bot",
    commands: lV1bot,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron", "back-element"],
  }));

  const [lV2top, lV2bot] = chevronVPaths(0, H * 0.43, W * 0.22, H * 0.78, lightBandW);
  layers.push(pathLayer({
    name: "Light Chevron V2 Top",
    commands: lV2top,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron", "back-element"],
  }));
  layers.push(pathLayer({
    name: "Light Chevron V2 Bot",
    commands: lV2bot,
    fill: solidPaintHex(theme.accent || "#324154"),
    tags: ["decorative", "chevron", "back-element"],
  }));

  // Company "COMPANY" � right zone at (56%, 46%)
  layers.push(styledText({
    name: "Company",
    x: Math.round(W * 0.56), y: Math.round(H * 0.46),
    w: Math.round(W * 0.33),
    text: (cfg.company || "COMPANY").toUpperCase(),
    fontSize: Math.round(H * 0.114), // 11.4% H ~68px
    fontFamily: font,
    weight: 700,
    color: theme.backText, // #C8CBD0
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["company", "primary-text", "back-element"],
  }));

  // Tagline � below company
  layers.push(styledText({
    name: "Tagline",
    x: Math.round(W * 0.56), y: Math.round(H * 0.53),
    w: Math.round(W * 0.33),
    text: cfg.tagline || "Your tagline here",
    fontSize: Math.round(H * 0.043), // 4.3% H ~26px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#8090A0",
    letterSpacing: 1, // ~0.02em
    tags: ["tagline", "back-element"],
  }));

  // Website � bottom right
  layers.push(styledText({
    name: "Website",
    x: Math.round(W * 0.60), y: Math.round(H * 0.88),
    w: Math.round(W * 0.29),
    text: cfg.contacts.website || "yourwebsite.com",
    fontSize: Math.round(H * 0.027), // 2.7% H ~16px
    fontFamily: font,
    weight: 400,
    color: "#888E99",
    letterSpacing: 2, // ~0.05em
    tags: ["contact-website", "contact-text", "back-element"],
  }));

  return layers;

});


// -------------------------------------------------------------
// Template #9 � zigzag-overlay
// Reference: Angular lime/charcoal converging shapes
// White bg + gradient bar + dark triangle (front)
// Converging shapes with zigzag edge (back)
// -------------------------------------------------------------

function layoutZigzagOverlay(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["zigzag-overlay"];
  const layers: LayerV2[] = [];

  // Background — pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg),
    tags: ["background"],
  }));

  // Orange-to-Magenta gradient bar (top-left, larger)
  layers.push(filledRect({
    name: "Gradient Bar",
    x: 0, y: 0, w: Math.round(W * 0.40), h: Math.round(H * 0.18),
    fill: multiStopGradient(135, [
      { offset: 0, color: "#FB6C2B" },
      { offset: 0.5, color: "#FA3048" },
      { offset: 1.0, color: "#FC1154" },
    ]),
    tags: ["decorative", "accent", "gradient-bar"],
  }));

  // Dark charcoal angular shape (bottom-right ~45% of card)
  const triPath = [
    M(W * 0.65, H * 0.50),
    L(W, H * 0.40),
    L(W, H),
    L(W * 0.12, H),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Dark Shape",
    commands: triPath,
    fill: solidPaintHex(theme.accent || "#303030"),
    tags: ["decorative", "accent"],
  }));

  // Name — prominent on white content area
  layers.push(styledText({
    name: "Name",
    x: W * 0.05, y: H * 0.28,
    w: W * 0.50,
    text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.065),
    fontFamily: ff,
    weight: 700,
    color: theme.frontText,
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // Title — below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.05, y: H * 0.37,
    w: W * 0.50,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.030),
    fontFamily: ff,
    weight: 400,
    color: theme.frontText,
    alpha: 0.6,
    tags: ["title"],
  }));

  // Company — on the gradient bar (white text)
  layers.push(styledText({
    name: "Company",
    x: W * 0.03, y: H * 0.05,
    w: W * 0.35,
    text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.030),
    fontFamily: ff,
    weight: 600,
    color: "#FFFFFF",
    letterSpacing: 3,
    tags: ["company"],
  }));

  // Contact block on the dark triangle area (light text)
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.15, startY: H * 0.72,
    lineGap: Math.round(H * 0.05),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: theme.frontTextAlt || "#E0E0E0",
    iconColor: "#D0E85C",
    maxY: H * 0.95,
    tags: ["contact-text"],
  }));

  return layers;
}

// Register zigzag-overlay back layout
registerBackLayout("zigzag-overlay", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background � white
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #FFFFFF
    tags: ["background", "back-element"],
  }));

  // Dark charcoal shape with zigzag right edge
  const darkPath = [
    M(W * 0.10, 0),
    L(W * 0.85, 0),
    // Zigzag right boundary (7 vertices):
    L(W * 0.71, H * 0.10),
    L(W * 0.61, H * 0.17),
    L(W * 0.64, H * 0.22),
    L(W * 0.62, H * 0.25),
    L(W * 0.72, H * 0.29),
    L(W * 0.76, H * 0.33),
    L(W * 0.71, H * 0.35),
    L(W * 0.66, H * 0.40),
    L(W * 0.53, H * 0.45),
    L(W * 0.45, H * 0.47), // Convergence point
    // Left boundary (smooth diagonal):
    L(W * 0.28, H * 0.30),
    L(W * 0.22, H * 0.20),
    L(W * 0.15, H * 0.10),
    L(W * 0.10, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Dark Shape",
    commands: darkPath,
    fill: solidPaintHex("#303030"),
    tags: ["decorative", "shape", "back-element"],
  }));

  // Lime green shape � wraps from right side
  const limePath = [
    M(W * 0.85, 0),
    L(W * 0.90, 0),
    L(W * 0.92, H * 0.10),
    L(W * 0.95, H * 0.20),
    L(W * 0.99, H * 0.30),
    L(W * 0.99, H * 0.35),
    L(W * 0.98, H * 0.37),
    L(W * 0.91, H * 0.40),
    L(W * 0.76, H * 0.45),
    L(W * 0.61, H * 0.50),
    L(W * 0.45, H * 0.55),
    L(W * 0.32, H * 0.59), // Convergence point
    // Left boundary:
    L(W * 0.21, H * 0.37),
    L(W * 0.19, H * 0.25),
    L(W * 0.16, H * 0.15),
    L(W * 0.16, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Lime Shape",
    commands: limePath,
    fill: solidPaintHex(theme.accentAlt || "#D0E85C"),
    tags: ["decorative", "shape", "back-element"],
  }));

  // Olive overlap strip (optional depth enhancement)
  const olivePath = [
    M(W * 0.16, 0),
    L(W * 0.22, 0),
    L(W * 0.28, H * 0.30),
    L(W * 0.32, H * 0.59),
    L(W * 0.21, H * 0.37),
    L(W * 0.16, H * 0.15),
    L(W * 0.16, 0),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Olive Overlap",
    commands: olivePath,
    fill: solidPaintHex(theme.backAccent || "#7E8D37"),
    tags: ["decorative", "overlap", "back-element"],
  }));

  // Faint text at bottom
  layers.push(styledText({
    name: "Bottom Text",
    x: Math.round(W * 0.10), y: Math.round(H * 0.92),
    w: Math.round(W * 0.80),
    text: cfg.contacts.website || cfg.company || "www.company.com",
    fontSize: Math.round(H * 0.020),
    fontFamily: font,
    weight: 400,
    color: theme.backText || "#3A3A3A",
    align: "center",
    tags: ["contact-website", "back-element"],
  }));

  return layers;
});


// -------------------------------------------------------------
// Template #10 � hex-split
// Reference: Company Name � Dwayne John, hexagonal blue
// Dark navy + wave pattern + hex logo (front)
// Light/dark horizontal split + 2�2 contact grid (back)
// -------------------------------------------------------------

function layoutHexSplit(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["hex-split"];

  const font = ff;
  const layers: LayerV2[] = [];
  const splitY = Math.round(H * 0.40);

  // Top section � light gray
  layers.push(filledRect({
    name: "Top Section",
    x: 0, y: 0, w: W, h: splitY,
    fill: solidPaintHex(t.frontBg || "#F8F9FA"),
    tags: ["background"],
  }));

  // Bottom section � dark navy
  layers.push(filledRect({
    name: "Bottom Section",
    x: 0, y: splitY, w: W, h: H - splitY,
    fill: solidPaintHex(t.accent || "#2C4F6B"),
    tags: ["background"],
  }));

  // Name � centered on light section
  layers.push(styledText({
    name: "Name",
    x: 0, y: Math.round(H * 0.25),
    w: W,
    text: (cfg.name || "DWAYNE JOHN").toUpperCase(),
    fontSize: Math.round(H * 0.07), // 7% H ~42px
    fontFamily: font,
    weight: 700,
    color: t.frontText || "#2C4F6B",
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    align: "center",
    tags: ["name", "primary-text"],
  }));

  // Title � below name
  layers.push(styledText({
    name: "Title",
    x: 0, y: Math.round(H * 0.32),
    w: W,
    text: (cfg.title || "GENERAL MANAGER").toUpperCase(),
    fontSize: Math.round(H * 0.03), // 3% H ~18px
    fontFamily: font,
    weight: 300,
    color: "#8BB4D1",
    uppercase: true,
    letterSpacing: 6, // ~0.20em
    align: "center",
    tags: ["title"],
  }));

  // Vertical divider in contact section
  layers.push(divider({
    name: "Contact Divider",
    x: Math.round(W * 0.50), y: Math.round(H * 0.45),
    length: Math.round(H * 0.20),
    direction: "vertical",
    color: "#FFFFFF",
    alpha: 0.30,
    tags: ["divider"],
  }));

  // 2�2 Contact grid
  const contactGrid = [
    { text: cfg.email || "email@company.com", col: 0, row: 0 },
    { text: cfg.address || "123 Main Street", col: 1, row: 0 },
    { text: cfg.phone || "+123 456 789", col: 0, row: 1 },
    { text: cfg.website || "www.company.com", col: 1, row: 1 }];

  const gridStartY = H * 0.50;
  const rowGap = H * 0.15;
  const colOffset = [W * 0.15, W * 0.55];

  for (const item of contactGrid) {
    if (!item.text) continue;
    const x = Math.round(colOffset[item.col]);
    const y = Math.round(gridStartY + item.row * rowGap);

    // Contact icon (small outline circle)
    layers.push(strokeEllipse({
      name: "Grid Icon",
      cx: x, cy: y + Math.round(H * 0.01),
      rx: Math.round(W * 0.012), ry: Math.round(W * 0.012),
      color: "#FFFFFF", width: 1.5,
      tags: ["contact-icon"],
    }));

    // Contact text
    layers.push(styledText({
      name: "Grid Contact",
      x: x + Math.round(W * 0.03), y: y,
      w: Math.round(W * 0.30),
      text: item.text,
      fontSize: Math.round(H * 0.028), // 2.8% H ~17px
      fontFamily: font,
      weight: 400,
      color: t.contactText || "#FFFFFF",
      tags: ["contact-text"],
    }));
  }

  return layers;

}

// Register hex-split back layout
registerBackLayout("hex-split", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background � dark navy blue
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #2C4F6B
    tags: ["background", "back-element"],
  }));

  // Wave pattern overlay � subtle repeating chevrons at 20% opacity
  // Create chevron rows across the entire card
  const patternColor = theme.frontBgAlt || "#1E3A4F";
  const chevronH = Math.round(H * 0.04); // 4% H per chevron row
  const chevronW = Math.round(W * 0.08); // 8% W per chevron unit
  for (let rowY = 0; rowY < H; rowY += chevronH) {
    const rowCommands: PathCommand[] = [M(0, rowY + chevronH)];
    for (let colX = 0; colX < W; colX += chevronW) {
      rowCommands.push(
        L(colX + chevronW / 2, rowY),
        L(colX + chevronW, rowY + chevronH / 2),
      );
    }
    rowCommands.push(L(W, rowY + chevronH), L(0, rowY + chevronH), Z());
    layers.push(pathLayer({
      name: "Wave Pattern Row",
      commands: rowCommands,
      fill: solidPaintHex(patternColor, 0.20),
      tags: ["decorative", "pattern", "back-element"],
    }));
  }

  // Hexagonal logo � line-art at center (50%, 30%)
  const hexCx = Math.round(W * 0.50);
  const hexCy = Math.round(H * 0.30);
  const hexW = Math.round(W * 0.08);
  const hexH = Math.round(H * 0.12);
  // Flat-top hexagon
  const hexPath = [
    M(hexCx - hexW / 2, hexCy - hexH / 4),
    L(hexCx, hexCy - hexH / 2),
    L(hexCx + hexW / 2, hexCy - hexH / 4),
    L(hexCx + hexW / 2, hexCy + hexH / 4),
    L(hexCx, hexCy + hexH / 2),
    L(hexCx - hexW / 2, hexCy + hexH / 4),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Hex Logo",
    commands: hexPath,
    stroke: makeStroke("#FFFFFF", 2.5),
    tags: ["logo", "hexagon", "back-element"],
  }));

  // Internal cube shape inside hex (3D cube illusion)
  const cubeSize = Math.round(hexW * 0.3);
  const cubePath = [
    // Top face
    M(hexCx, hexCy - cubeSize),
    L(hexCx + cubeSize, hexCy - cubeSize / 2),
    L(hexCx, hexCy),
    L(hexCx - cubeSize, hexCy - cubeSize / 2),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Hex Cube",
    commands: cubePath,
    stroke: makeStroke("#FFFFFF", 1.5),
    tags: ["logo", "hexagon", "back-element"],
  }));

  // Company Name � centered below logo
  layers.push(styledText({
    name: "Company",
    x: 0, y: Math.round(H * 0.52),
    w: W,
    text: (cfg.company || "COMPANY NAME").toUpperCase(),
    fontSize: Math.round(H * 0.06), // 6% H ~36px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    align: "center",
    tags: ["company", "primary-text", "back-element"],
  }));

  // Tagline � below company
  layers.push(styledText({
    name: "Tagline",
    x: 0, y: Math.round(H * 0.58),
    w: W,
    text: (cfg.tagline || "TAGLINE GOES HERE").toUpperCase(),
    fontSize: Math.round(H * 0.025), // 2.5% H ~15px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#8BB4D1",
    uppercase: true,
    letterSpacing: 7, // ~0.25em
    align: "center",
    tags: ["tagline", "back-element"],
  }));

  return layers;

});


// -------------------------------------------------------------
// Template #11 � dot-circle
// Reference: ELD Creatives � Jason Martin, minimalist circle
// Off-white bg + left-aligned content + dark logo block (front)
// Large dark circle with logo + website (back)
// -------------------------------------------------------------

function layoutDotCircle(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["dot-circle"];
  const font = ff;
  const layers: LayerV2[] = [];

  // Background � off-white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg), // #F8F8F8
    tags: ["background"],
  }));

  // Rectangular logo element (top-right)
  const lx = Math.round(W * 0.65);
  const ly = Math.round(H * 0.13);
  const lw = Math.round(W * 0.20);
  const lh = Math.round(H * 0.15);
  layers.push(filledRect({
    name: "Logo Block",
    x: lx, y: ly, w: lw, h: lh,
    fill: solidPaintHex(theme.accent || "#333333"),
    radii: [2, 2, 2, 2],
    tags: ["logo", "panel"],
  }));

  // Logo text inside block
  layers.push(styledText({
    name: "Logo Text",
    x: lx, y: ly + Math.round(lh * 0.30),
    w: lw,
    text: (cfg.company || "ELD CREATIVES").toUpperCase(),
    fontSize: Math.round(H * 0.025),
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    align: "center",
    tags: ["company", "logo"],
  }));

  // Name � left-aligned
  layers.push(styledText({
    name: "Name",
    x: Math.round(W * 0.08), y: Math.round(H * 0.25),
    w: Math.round(W * 0.50),
    text: (cfg.name || "JASON MARTIN").toUpperCase(),
    fontSize: Math.round(H * 0.06), // 6% H ~36px
    fontFamily: font,
    weight: 700,
    color: theme.frontText, // #2C2C2C
    uppercase: true,
    letterSpacing: 5, // ~0.15em
    tags: ["name", "primary-text"],
  }));

  // Title � below name
  layers.push(styledText({
    name: "Title",
    x: Math.round(W * 0.08), y: Math.round(H * 0.35),
    w: Math.round(W * 0.45),
    text: cfg.title || "Creative Director",
    fontSize: Math.round(H * 0.03), // 3% H ~18px
    fontFamily: font,
    weight: 300,
    color: theme.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // Divider line 1 (between title and contacts)
  layers.push(divider({
    name: "Divider 1",
    x: Math.round(W * 0.08), y: Math.round(H * 0.44),
    length: Math.round(W * 0.60),
    direction: "horizontal",
    color: theme.divider || "#E0E0E0",
    alpha: 0.50,
    tags: ["divider"],
  }));

  // Phone contacts with icons
  const contactStartY = H * 0.50;
  const iconX = Math.round(W * 0.06);
  const textX = Math.round(W * 0.06 + W * 0.04);
  const contactFontSize = Math.round(H * 0.025); // 2.5% H ~15px
  const iconR = Math.round(H * 0.0075); // tiny filled circle

  const phoneLines = [
    { text: cfg.phone || "514-xxx-xxxx", label: " (Office)", yPct: 0.50 },
    { text: cfg.phone ? "" : "xxx-xxx-xxxx", label: " (Mobile)", yPct: 0.56 },
  ];

  for (const pl of phoneLines) {
    if (!pl.text) continue;
    layers.push(filledEllipse({
      name: "Phone Icon",
      cx: iconX, cy: Math.round(H * pl.yPct + H * 0.01),
      rx: iconR, ry: iconR,
      fill: solidPaintHex(theme.contactIcon || "#666666"),
      tags: ["contact-icon"],
    }));
    layers.push(styledText({
      name: "Phone",
      x: textX, y: Math.round(H * pl.yPct),
      w: Math.round(W * 0.40),
      text: pl.text + pl.label,
      fontSize: contactFontSize,
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#444444",
      tags: ["contact-text"],
    }));
  }

  // Divider line 2 (between phone and email/web)
  layers.push(divider({
    name: "Divider 2",
    x: Math.round(W * 0.08), y: Math.round(H * 0.62),
    length: Math.round(W * 0.60),
    direction: "horizontal",
    color: theme.divider || "#E0E0E0",
    alpha: 0.50,
    tags: ["divider"],
  }));

  // Email + website
  const emailWebLines = [
    { text: cfg.email || "jason@eldcreatives.com", yPct: 0.66 },
    { text: cfg.website || "www.eldcreatives.com", yPct: 0.72 },
  ];

  for (const ew of emailWebLines) {
    if (!ew.text) continue;
    layers.push(filledEllipse({
      name: "Contact Icon",
      cx: iconX, cy: Math.round(H * ew.yPct + H * 0.01),
      rx: iconR, ry: iconR,
      fill: solidPaintHex(theme.contactIcon || "#666666"),
      tags: ["contact-icon"],
    }));
    layers.push(styledText({
      name: "Contact",
      x: textX, y: Math.round(H * ew.yPct),
      w: Math.round(W * 0.50),
      text: ew.text,
      fontSize: contactFontSize,
      fontFamily: font,
      weight: 400,
      color: theme.contactText || "#444444",
      tags: ["contact-text"],
    }));
  }

  return layers;
}

// Register dot-circle back layout
registerBackLayout("dot-circle", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Background � same off-white
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg || "#F8F8F8"),
    tags: ["background", "back-element"],
  }));

  // Large dark circle � left-of-center
  const cx = Math.round(W * 0.15);
  const cy = Math.round(H * 0.50);
  const r = Math.round(W * 0.175); // ~35% diameter
  layers.push(filledEllipse({
    name: "Logo Circle",
    cx: cx, cy: cy, rx: r, ry: r,
    fill: solidPaintHex(theme.accent || "#333333"),
    tags: ["logo", "circle", "back-element"],
  }));

  // Logo/company text inside circle
  layers.push(styledText({
    name: "Circle Logo",
    x: cx - r, y: cy - Math.round(H * 0.02),
    w: r * 2,
    text: (cfg.company || "LOGO").toUpperCase(),
    fontSize: Math.round(H * 0.05),
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    align: "center",
    tags: ["company", "logo", "back-element"],
  }));

  // Website URL � lower-right quadrant
  layers.push(styledText({
    name: "Website",
    x: Math.round(W * 0.50), y: Math.round(H * 0.75),
    w: Math.round(W * 0.40),
    text: cfg.contacts.website || "www.eldcreatives.com",
    fontSize: Math.round(H * 0.035), // 3.5% H ~21px
    fontFamily: font,
    weight: 300,
    color: theme.backText || "#666666",
    tags: ["contact-website", "back-element"],
  }));

  return layers;
});


// -------------------------------------------------------------
// Template #12 � wave-gradient
// Reference: MTAC � Mastering Tasks and Coaching
// White bg + purple-orange wave + logo/contact (front)
// Full-bleed diagonal gradient + centered white logo (back)
// -------------------------------------------------------------

function layoutWaveGradient(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const theme = TEMPLATE_FIXED_THEMES["wave-gradient"];
  const layers: LayerV2[] = [];

  // Background — pure white
  layers.push(filledRect({
    name: "Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.frontBg),
    tags: ["background"],
  }));

  // Organic wave with purple→orange gradient (bottom 20-25%)
  const wavePath = [
    M(0, H * 0.78),
    C(W * 0.15, H * 0.72, W * 0.30, H * 0.82, W * 0.50, H * 0.76),
    C(W * 0.70, H * 0.70, W * 0.85, H * 0.80, W, H * 0.75),
    L(W, H),
    L(0, H),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Gradient Wave",
    commands: wavePath,
    fill: multiStopGradient(135, [
      { offset: 0, color: theme.accent || "#2D1B69" },
      { offset: 1, color: theme.accentAlt || "#FF8C42" },
    ]),
    tags: ["decorative", "wave", "gradient"],
  }));

  // Logo + brand — upper-left
  const logoS = Math.round(W * 0.08);
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.05), Math.round(H * 0.08),
    logoS, theme.accent || "#2D1B69", 1.0, ff));

  // Company name — right of logo
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company",
      x: W * 0.05 + logoS + W * 0.02, y: H * 0.10,
      w: W * 0.35,
      text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.05),
      fontFamily: ff,
      weight: 700,
      color: theme.frontText,
      tags: ["company"],
    }));
  }

  // Tagline below logo/company
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline",
      x: W * 0.05, y: H * 0.22,
      w: W * 0.50,
      text: cfg.tagline,
      fontSize: Math.round(H * 0.022),
      fontFamily: ff,
      weight: 400,
      color: theme.frontTextAlt || "#666666",
      tags: ["tagline"],
    }));
  }

  // Name — prominent, left-aligned
  layers.push(styledText({
    name: "Name",
    x: W * 0.05, y: H * 0.36,
    w: W * 0.55,
    text: cfg.name || "Name and Surname",
    fontSize: Math.round(H * 0.06),
    fontFamily: ff,
    weight: 600,
    color: theme.frontText,
    tags: ["name", "primary-text"],
  }));

  // Title below name
  layers.push(styledText({
    name: "Title",
    x: W * 0.05, y: H * 0.44,
    w: W * 0.50,
    text: cfg.title || "Position",
    fontSize: Math.round(H * 0.028),
    fontFamily: ff,
    weight: 400,
    color: theme.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // Contact block — left side below title
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.05, startY: H * 0.54,
    lineGap: Math.round(H * 0.05),
    fontSize: Math.round(H * 0.022),
    fontFamily: ff,
    textColor: theme.contactText || "#333333",
    iconColor: theme.accent || "#2D1B69",
    maxY: H * 0.74,
    tags: ["contact-text"],
  }));

  return layers;
}

// Register wave-gradient back layout
registerBackLayout("wave-gradient", (W, H, cfg, theme) => {
  const font = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // Full-bleed diagonal gradient background
  layers.push(filledRect({
    name: "Gradient Background",
    x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      { offset: 0, color: theme.backBg || "#2D1B69" },
      { offset: 1, color: theme.backAccent || "#FF8C42" },
    ]),
    tags: ["background", "back-element"],
  }));

  // Logo icon (white, centered)
  const logoSize = Math.round(W * 0.04);
  const logoCx = Math.round(W * 0.47);
  const logoCy = Math.round(H * 0.40);
  const arrowPath = [
    M(logoCx, logoCy + logoSize),
    L(logoCx + logoSize / 2, logoCy),
    L(logoCx + logoSize, logoCy + logoSize),
    Z(),
  ];
  layers.push(pathLayer({
    name: "Back Logo Arrow",
    commands: arrowPath,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "icon", "back-element"],
  }));

  // Company "MTAC" � large centered white
  layers.push(styledText({
    name: "Company",
    x: 0, y: Math.round(H * 0.45),
    w: W,
    text: (cfg.company || "MTAC").toUpperCase(),
    fontSize: Math.round(H * 0.12), // 12% H ~72px
    fontFamily: font,
    weight: 700,
    color: "#FFFFFF",
    uppercase: true,
    letterSpacing: 3, // ~0.10em
    align: "center",
    tags: ["company", "primary-text", "back-element"],
  }));

  // Tagline below
  layers.push(styledText({
    name: "Tagline",
    x: 0, y: Math.round(H * 0.58),
    w: W,
    text: cfg.tagline || "Mastering Tasks and Coaching",
    fontSize: Math.round(H * 0.025), // 2.5% H ~15px
    fontFamily: font,
    weight: 300,
    color: "#FFFFFF",
    alpha: 0.90,
    align: "center",
    tags: ["tagline", "back-element"],
  }));

  return layers;
});

// ===================== CLASSIC / CORPORATE TEMPLATES =====================

// -----------------------------------------------------------------------------
// #13  circle-brand   �  Close Financial reference
// -----------------------------------------------------------------------------

function layoutCircleBrand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["circle-brand"];

  const layers: LayerV2[] = [];

  // -- background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

  // -- circular logo placeholder (upper-left) --
  const logoDia = W * 0.12;  // ~126 px
  const logoCx = W * 0.15;
  const logoCy = H * 0.25;
  layers.push(filledEllipse({
    name: "Logo Circle", cx: logoCx, cy: logoCy,
    rx: logoDia / 2, ry: logoDia / 2, fill: solidPaintHex(t.accent),
    tags: ["logo", "decorative"],
  }));
  // white icon placeholder inside circle
  const iconS = logoDia * 0.45;
  layers.push(filledRect({
    name: "Logo Icon",
    x: logoCx - iconS / 2, y: logoCy - iconS / 2,
    w: iconS, h: iconS, fill: solidPaintHex("#FFFFFF"),
    tags: ["logo"],
  }));
  // user logo overlay
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoCx - logoDia * 0.3), Math.round(logoCy - logoDia * 0.3),
    Math.round(logoDia * 0.6), "#FFFFFF", 1.0, ff));

  // -- company name � hero text, centered --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.42,
      w: W * 0.80, text: cfg.company || "Company",
      fontSize: Math.round(H * 0.08), fontFamily: ff,
      weight: 500, color: t.accent, align: "center",
      tags: ["company"],
    }));
  }

  // -- name (left) --
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.62,
    w: W * 0.40, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 600, color: t.accent,
    tags: ["name", "primary-text"],
  }));

  // -- title (left, below name) --
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.68,
    w: W * 0.40, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // -- contact info � left column --
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.15, startY: H * 0.78,
    lineGap: Math.round(H * 0.04),
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText || "#333333",
    iconColor: t.contactIcon || t.accent,
    maxY: H * 0.95,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // -- address � right-aligned --
  if (cfg.address) {
    const addrParts = cfg.address.split(",").map((s: string) => s.trim());
    addrParts.forEach((addrLine: string, i: number) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.50, y: H * 0.74 + i * Math.round(H * 0.04),
        w: W * 0.38, text: addrLine,
        fontSize: Math.round(H * 0.022), fontFamily: ff,
        weight: 400, color: t.contactText || "#333333", align: "right",
        tags: ["contact-text"],
      }));
    });
  }

  return layers;
}

// Back layout: diagonal blue gradient + large logo + services
registerBackLayout("circle-brand", (W, H, cfg, theme) => {
  const t = theme;

  const layers: LayerV2[] = [];

  // -- gradient background --
  layers.push(filledRect({
    name: "Back BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      { color: t.accent, offset: 0 },
      { color: t.accentAlt || t.backBg, offset: 1 },
    ]),
    tags: ["decorative"],
  }));

  // -- large centered logo --
  const logoS = W * 0.18;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.12),
    Math.round(logoS), "#FFFFFF", 1.0, cfg.fontFamily));

  // -- company name --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.38,
      w: W * 0.80, text: cfg.company || "Company",
      fontSize: Math.round(H * 0.07), fontFamily: cfg.fontFamily,
      weight: 500, color: "#FFFFFF", align: "center",
      tags: ["company"],
    }));
  }

  // -- tagline / license text --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "License", x: W * 0.10, y: H * 0.50,
      w: W * 0.80, text: cfg.tagline,
      fontSize: Math.round(H * 0.02), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backAccent || "#B8D4F0", align: "center",
      tags: ["tagline"],
    }));
  }

  // -- services list with checkmarks --
  const services = ["Consulting", "Strategy", "Advisory"];
  const serviceY = H * 0.68;
  services.forEach((svc, i) => {
    const yy = serviceY + i * Math.round(H * 0.06);
    layers.push(styledText({
      name: `Check ${i + 1}`, x: W * 0.12, y: yy,
      w: Math.round(W * 0.04), text: "?",
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF",
      tags: ["decorative"],
    }));
    layers.push(styledText({
      name: `Service ${i + 1}`, x: W * 0.16, y: yy,
      w: W * 0.60, text: svc,
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF",
      tags: ["contact-text"],
    }));
  });

  return layers;
});


// -----------------------------------------------------------------------------
// #14  full-color-back   �  Gordon Law Group reference
// -----------------------------------------------------------------------------

function layoutFullColorBack(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["full-color-back"];

  const layers: LayerV2[] = [];

  // -- white background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex("#FFFFFF") }));

  // -- name � top left, hero text --
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.19,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.accent,
    tags: ["name", "primary-text"],
  }));

  // -- title --
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.28,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.035), fontFamily: ff,
    weight: 400, color: t.frontTextAlt || "#666666",
    tags: ["title"],
  }));

  // -- company --
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.42,
    w: W * 0.50, text: cfg.company || "Company",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.accent,
    tags: ["company"],
  }));

  // -- address --
  if (cfg.address) {
    const addrParts = cfg.address.split(",").map((s: string) => s.trim());
    addrParts.forEach((addrLine: string, i: number) => {
      layers.push(styledText({
        name: `Address ${i + 1}`,
        x: W * 0.08, y: H * 0.53 + i * Math.round(H * 0.04),
        w: W * 0.50, text: addrLine,
        fontSize: Math.round(H * 0.028), fontFamily: ff,
        weight: 400, color: t.frontTextAlt || "#666666",
        tags: ["contact-text"],
      }));
    });
  }

  // -- contact details --
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.08, startY: H * 0.72,
    lineGap: Math.round(H * 0.045),
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    textColor: t.contactText || "#666666",
    iconColor: t.contactIcon || t.accent,
    maxY: H * 0.95,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // -- geometric diamond logo (upper-right, large) --
  const logoW = W * 0.25;
  const logoH = H * 0.35;
  const logoX = W * 0.75 - logoW / 2;
  const logoY = H * 0.15;
  // diamond shape placeholder
  layers.push(pathLayer({
    name: "Logo Diamond",
    commands: [
      M(logoX + logoW / 2, logoY),
      L(logoX + logoW, logoY + logoH / 2),
      L(logoX + logoW / 2, logoY + logoH),
      L(logoX, logoY + logoH / 2),
      Z(),
    ],
    fill: solidPaintHex(t.accent),
    tags: ["logo", "decorative"],
  }));
  // user logo overlay
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX + logoW * 0.2), Math.round(logoY + logoH * 0.15),
    Math.round(Math.min(logoW, logoH) * 0.6), t.accent, 1.0, ff));

  return layers;
}

// Back layout: full-bleed diagonal blue gradient + diamond watermark + centered logo
registerBackLayout("full-color-back", (W, H, cfg, theme) => {
  const t = theme;

  const layers: LayerV2[] = [];

  // -- gradient background --
  layers.push(filledRect({
    name: "Back BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(135, [
      { color: t.accentAlt || t.backBg, offset: 0 },
      { color: t.accent, offset: 1 },
    ]),
    tags: ["decorative"],
  }));

  // -- diamond watermark shapes at 5% opacity --
  const wmPositions = [
    { x: W * 0.10, y: H * 0.08, s: W * 0.12 },
    { x: W * 0.78, y: H * 0.15, s: W * 0.08 },
    { x: W * 0.85, y: H * 0.70, s: W * 0.15 },
    { x: W * 0.05, y: H * 0.75, s: W * 0.06 },
  ];
  wmPositions.forEach((wm, i) => {
    const wmLayer = pathLayer({
      name: `Watermark ${i + 1}`,
      commands: [
        M(wm.x + wm.s / 2, wm.y),
        L(wm.x + wm.s, wm.y + wm.s / 2),
        L(wm.x + wm.s / 2, wm.y + wm.s),
        L(wm.x, wm.y + wm.s / 2),
        Z(),
      ],
      fill: solidPaintHex("#FFFFFF"),
      opacity: 0.05,
      tags: ["decorative", "watermark"],
    });
    layers.push(wmLayer);
  });

  // -- centered logo --
  const logoS = W * 0.18;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.15),
    Math.round(logoS), "#FFFFFF", 1.0, cfg.fontFamily));

  // -- company name with letter spacing --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.48,
      w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.06), fontFamily: cfg.fontFamily,
      weight: 300, color: "#FFFFFF", align: "center",
      letterSpacing: 8,
      tags: ["company"],
    }));
  }

  // -- website --
  const web = cfg.contacts.website;
  if (web) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: web,
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-text"],
    }));
  }

  return layers;
});


// -----------------------------------------------------------------------------
// #15  engineering-pro   �  Holdfast Engineering reference
// -----------------------------------------------------------------------------

function layoutEngineeringPro(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["engineering-pro"];

  const layers: LayerV2[] = [];

  // -- off-white background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

  // -- logo icon placeholder (upper-left) --
  const logoS = W * 0.08;
  const logoX = W * 0.12;
  const logoY = H * 0.12;
  // angular geometric placeholder
  layers.push(pathLayer({
    name: "Logo Icon",
    commands: [
      M(logoX, logoY + logoS * 1.5),
      L(logoX + logoS * 0.5, logoY),
      L(logoX + logoS, logoY + logoS * 1.5),
      Z(),
    ],
    fill: solidPaintHex(t.accent),    // #5DADE2
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX), Math.round(logoY), Math.round(logoS), t.accent, 1.0, ff));

  // -- "HOLDFAST" company name --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: logoX + logoS + W * 0.02, y: H * 0.13,
      w: W * 0.50, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.06), fontFamily: ff,
      weight: 700, color: t.frontText,     // #2C3E50
      letterSpacing: 4,
      tags: ["company"],
    }));
  }

  // -- "ENGINEERING" tagline --
  layers.push(styledText({
    name: "Tagline", x: logoX + logoS + W * 0.02, y: H * 0.22,
    w: W * 0.50, text: (cfg.tagline || "Engineering").toUpperCase(),
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: t.accent,        // #5DADE2
    letterSpacing: 8,
    tags: ["tagline"],
  }));

  // -- name --
  layers.push(styledText({
    name: "Name", x: W * 0.12, y: H * 0.45,
    w: W * 0.55, text: cfg.name || "Your Name",
    fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 500, color: t.frontText,
    tags: ["name", "primary-text"],
  }));

  // -- title (accent blue) --
  layers.push(styledText({
    name: "Title", x: W * 0.12, y: H * 0.55,
    w: W * 0.50, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.accent,
    tags: ["title"],
  }));

  // -- horizontal divider --
  layers.push(divider({
    name: "Divider",
    x: W * 0.12, y: H * 0.66,
    length: W * 0.76, thickness: 1,
    color: t.divider || "#BDC3C7",
    direction: "horizontal",
    tags: ["decorative"],
  }));

  // -- contact info --
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.12, startY: H * 0.73,
    lineGap: Math.round(H * 0.04),
    fontSize: Math.round(H * 0.022), fontFamily: ff,
    textColor: t.contactText || "#34495E",
    iconColor: t.contactIcon || t.accent,
    maxY: H * 0.95,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  return layers;
}

// Back layout: solid bright blue with tonal embossed logo
registerBackLayout("engineering-pro", (W, H, cfg, theme) => {
  const t = theme;

  const layers: LayerV2[] = [];

  // -- solid blue background --
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

  // -- tonal logo icon (centered, larger) --
  const logoS = W * 0.15;
  const logoCx = W * 0.50;
  const logoCy = H * 0.30;
  // angular shape in tonal blue
  layers.push(pathLayer({
    name: "Back Logo",
    commands: [
      M(logoCx, logoCy - logoS * 0.6),
      L(logoCx + logoS * 0.5, logoCy + logoS * 0.4),
      L(logoCx - logoS * 0.5, logoCy + logoS * 0.4),
      Z(),
    ],
    fill: solidPaintHex(t.backAccent || "#2980B9"),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoCx - logoS * 0.3), Math.round(logoCy - logoS * 0.3),
    Math.round(logoS * 0.6), t.backAccent || "#2980B9", 1.0, cfg.fontFamily));

  // -- "HOLDFAST" tonal text --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.50,
      w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.12), fontFamily: cfg.fontFamily,
      weight: 700, color: t.backText,    // #1B4F72
      align: "center", letterSpacing: 4,
      tags: ["company"],
    }));
  }

  // -- "ENGINEERING" tonal text --
  layers.push(styledText({
    name: "Tagline", x: W * 0.10, y: H * 0.62,
    w: W * 0.80, text: (cfg.tagline || "Engineering").toUpperCase(),
    fontSize: Math.round(H * 0.04), fontFamily: cfg.fontFamily,
    weight: 400, color: t.backAccent || "#2980B9",
    align: "center", letterSpacing: 8,
    tags: ["tagline"],
  }));

  return layers;
});


// -----------------------------------------------------------------------------
// #16  clean-accent   �  Real Estate Corporation reference
// -----------------------------------------------------------------------------

function layoutCleanAccent(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["clean-accent"];

  const layers: LayerV2[] = [];

  // -- white background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex("#FFFFFF") }));

  // -- logo (upper-left) --
  const logoS = Math.round(W * 0.09);
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.05), Math.round(H * 0.10),
    logoS, t.accent, 1.0, ff));

  // -- company name (left, below logo) --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.05, y: H * 0.30,
      w: W * 0.40, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.04), fontFamily: ff,
      weight: 700, color: t.accent, letterSpacing: 3,
      tags: ["company"],
    }));
  }

  // -- name (right side, prominent) --
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.10,
    w: W * 0.55, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.055), fontFamily: ff,
    weight: 700, color: t.accent, align: "right",
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // -- title (right-aligned, below name) --
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.20,
    w: W * 0.55, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: t.contactText || "#666666", align: "right",
    tags: ["title"],
  }));

  // -- contact details (right-aligned) --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.92, startY: H * 0.32,
    lineGap: Math.round(H * 0.055),
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    textColor: t.contactText || "#666666",
    iconColor: t.accent,
    align: "right",
    maxY: H * 0.62,
    tags: ["contact-text"],
  }));

  // -- QR code (lower-left, only if URL provided) --
  if (cfg.qrCodeUrl) {
    const qrSize = Math.round(W * 0.12);
    layers.push(strokeRect({
      name: "QR Frame",
      x: Math.round(W * 0.05), y: Math.round(H * 0.52),
      w: qrSize, h: qrSize,
      color: t.accent, width: 1,
      tags: ["qr-code"],
    }));
  }

  // -- city skyline silhouette (bottom 30%) --
  // Build proper building shapes with varying heights and widths
  const buildings = [
    { x: 0, w: 0.035, h: 0.15 },
    { x: 0.04, w: 0.025, h: 0.25 },
    { x: 0.07, w: 0.04, h: 0.20 },
    { x: 0.12, w: 0.03, h: 0.30 },
    { x: 0.16, w: 0.05, h: 0.18 },
    { x: 0.22, w: 0.03, h: 0.28 },
    { x: 0.26, w: 0.04, h: 0.22 },
    { x: 0.31, w: 0.025, h: 0.35 },
    { x: 0.34, w: 0.045, h: 0.16 },
    { x: 0.39, w: 0.03, h: 0.26 },
    { x: 0.43, w: 0.035, h: 0.32 },
    { x: 0.47, w: 0.04, h: 0.14 },
    { x: 0.52, w: 0.03, h: 0.24 },
    { x: 0.56, w: 0.05, h: 0.19 },
    { x: 0.62, w: 0.025, h: 0.30 },
    { x: 0.65, w: 0.04, h: 0.22 },
    { x: 0.70, w: 0.035, h: 0.28 },
    { x: 0.74, w: 0.03, h: 0.17 },
    { x: 0.78, w: 0.045, h: 0.25 },
    { x: 0.83, w: 0.03, h: 0.33 },
    { x: 0.87, w: 0.04, h: 0.20 },
    { x: 0.92, w: 0.035, h: 0.27 },
    { x: 0.96, w: 0.04, h: 0.15 },
  ];
  buildings.forEach((b, i) => {
    const bx = Math.round(W * b.x);
    const bw = Math.round(W * b.w);
    const bh = Math.round(H * b.h);
    layers.push(filledRect({
      name: `Building ${i + 1}`,
      x: bx, y: H - bh, w: bw, h: bh,
      fill: solidPaintHex(t.accent),
      opacity: 0.12 + (i % 3) * 0.04,
      tags: ["decorative", "skyline"],
    }));
  });

  return layers;
}

// Back layout: solid orange-red with centered white logo
registerBackLayout("clean-accent", (W, H, cfg, theme) => {
  const t = theme;

  const layers: LayerV2[] = [];

  // -- solid background --
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

  // -- centered logo --
  const logoS = W * 0.15;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.25),
    Math.round(logoS), "#FFFFFF", 1.0, cfg.fontFamily));

  // -- company name --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.52,
      w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.05), fontFamily: cfg.fontFamily,
      weight: 700, color: "#FFFFFF", align: "center",
      letterSpacing: 3,
      tags: ["company"],
    }));
  }

  // -- website --
  const web = cfg.contacts.website;
  if (web) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.68,
      w: W * 0.80, text: web,
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF", align: "center",
      alpha: 0.8,
      tags: ["contact-text"],
    }));
  }

  return layers;
});


// -----------------------------------------------------------------------------
// #17  nature-clean   �  Bluebat reference
// -----------------------------------------------------------------------------

function layoutNatureClean(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["nature-clean"];

  const layers: LayerV2[] = [];

  // -- light gray background --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg) }));

  // -- QR code placeholder (upper-left) --
  const qrW = W * 0.18;
  const qrH = H * 0.30;
  layers.push(filledRect({
    name: "QR Placeholder",
    x: W * 0.08, y: H * 0.12,
    w: qrW, h: qrH,
    fill: solidPaintHex("#E0E0E0"),
    tags: ["qr-code", "decorative"],
  }));

  // -- contact info (center-right, with icons) --
  const contacts = extractContacts(cfg);
  const cLines = contactWithIcons({
    contacts,
    x: W * 0.50, startY: H * 0.13,
    lineGap: Math.round(H * 0.06),
    fontSize: Math.round(H * 0.025), fontFamily: ff,
    textColor: t.accent,     // #6B8E7A sage green
    iconColor: t.accent,
    maxY: H * 0.95,
    tags: ["contact-text"],
  });
  layers.push(...cLines);

  // -- diagonal name banner (bottom-left, angled right edge) --
  layers.push(pathLayer({
    name: "Name Banner",
    commands: [
      M(0, H * 0.70),
      L(W * 0.60, H * 0.70),
      L(W * 0.52, H),
      L(0, H),
      Z(),
    ],
    fill: solidPaintHex(t.accent),    // #6B8E7A sage green
    tags: ["decorative", "accent"],
  }));

  // -- name on banner --
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.73,
    w: W * 0.42, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: "#FFFFFF",
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // -- title on banner --
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.81,
    w: W * 0.38, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 400, color: "#FFFFFF",
    tags: ["title"],
  }));

  // -- logo icon in white space (right of banner) --
  const logoS = W * 0.08;
  const logoX = W * 0.62;
  const logoY = H * 0.73;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(logoX), Math.round(logoY), Math.round(logoS), t.accent, 1.0, ff));

  // -- company text in white area --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: logoX + logoS + W * 0.02, y: H * 0.76,
      w: W * 0.25, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.04), fontFamily: ff,
      weight: 700, color: t.frontText,    // #2C2C2C
      letterSpacing: 3,
      tags: ["company"],
    }));
  }

  return layers;
}

// Back layout: solid sage green with centered white logo
registerBackLayout("nature-clean", (W, H, cfg, theme) => {
  const t = theme;

  const layers: LayerV2[] = [];

  // -- solid sage green background --
  layers.push(filledRect({ name: "Back BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg) }));

  // -- large centered logo icon --
  const logoS = W * 0.12;
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.50 - logoS / 2), Math.round(H * 0.25),
    Math.round(logoS), "#FFFFFF", 1.0, cfg.fontFamily));

  // -- company name --
  layers.push(styledText({
    name: "Company", x: W * 0.10, y: H * 0.52,
    w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
    fontSize: Math.round(H * 0.08), fontFamily: cfg.fontFamily,
    weight: 700, color: "#FFFFFF", align: "center",
    letterSpacing: 8,
    tags: ["company"],
  }));

  // -- tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.10, y: H * 0.62,
      w: W * 0.80, text: cfg.tagline.toUpperCase(),
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 300, color: "#FFFFFF", align: "center",
      alpha: 0.8, letterSpacing: 10,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// -----------------------------------------------------------------------------
// #18  diamond-brand   �  Forest green corporate reference
// -----------------------------------------------------------------------------

function layoutDiamondBrand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diamond-brand"];

  const layers: LayerV2[] = [];

  // -- green left section (60%) --
  layers.push(filledRect({
    name: "Left Panel", x: 0, y: 0, w: W * 0.60, h: H,
    fill: solidPaintHex(t.frontBg),     // #2E7D32
    tags: ["decorative"],
  }));

  // -- white right section (40%) --
  layers.push(filledRect({
    name: "Right Panel", x: W * 0.60, y: 0, w: W * 0.40, h: H,
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative"],
  }));

  // -- small triangle logo on green (lower-left) --
  const triS = W * 0.04;
  const triCx = W * 0.20;
  const triCy = H * 0.72;
  layers.push(pathLayer({
    name: "Logo",
    commands: [
      M(triCx, triCy - triS * 0.6),
      L(triCx + triS / 2, triCy + triS * 0.4),
      L(triCx - triS / 2, triCy + triS * 0.4),
      Z()],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "decorative"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(triCx - triS / 2), Math.round(triCy - triS * 0.4),
    Math.round(triS), "#FFFFFF", 1.0, ff));

  // -- company name on green section --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.05, y: H * 0.80,
      w: W * 0.50, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.03), fontFamily: ff,
      weight: 700, color: "#FFFFFF",
      tags: ["company"],
    }));
  }

  // -- name on white section --
  layers.push(styledText({
    name: "Name", x: W * 0.63, y: H * 0.40,
    w: W * 0.34, text: (cfg.name || "Your Name").toUpperCase(),
    fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: t.contactText || "#2E2E2E",
    letterSpacing: 2,
    tags: ["name", "primary-text"],
  }));

  // -- title on white section --
  layers.push(styledText({
    name: "Title", x: W * 0.63, y: H * 0.49,
    w: W * 0.34, text: cfg.title || "Job Title",
    fontSize: Math.round(H * 0.028), fontFamily: ff,
    weight: 300, color: "#757575",
    tags: ["title"],
  }));

  // -- contact with colored circle icons --
  const iconColors = [t.accent, "#757575", t.frontBg];  // phone: green, location: gray, email: dark green
  const contactEntries: Array<{ label: string; val: string }> = [];
  if (cfg.phone) contactEntries.push({ label: "phone", val: cfg.phone });
  if (cfg.address) contactEntries.push({ label: "address", val: cfg.address });
  if (cfg.email) contactEntries.push({ label: "email", val: cfg.email });

  let cY = H * 0.60;
  const cGap = Math.round(H * 0.10);
  contactEntries.slice(0, 3).forEach((c, i) => {
    const circR = W * 0.012;
    // colored circle
    layers.push(filledEllipse({
      name: `Contact Icon ${i + 1}`,
      cx: W * 0.66, cy: cY + circR,
      rx: circR, ry: circR,
      fill: solidPaintHex(iconColors[i % iconColors.length]),
      tags: ["contact-icon"],
    }));
    // contact text
    layers.push(styledText({
      name: `Contact ${c.label}`,
      x: W * 0.70, y: cY,
      w: W * 0.27, text: c.val,
      fontSize: Math.round(H * 0.022), fontFamily: ff,
      weight: 400, color: t.contactText || "#2E2E2E",
      tags: ["contact-text"],
    }));
    cY += cGap;
  });

  return layers;

}

// Back layout: 60/40 vertical split green/white
registerBackLayout("diamond-brand", (W, H, cfg, theme) => {
  const t = theme;
  const ff = cfg.fontFamily;
  const layers: LayerV2[] = [];

  // -- two-tone green background --
  // top section (0-78%)
  layers.push(filledRect({
    name: "BG Top", x: 0, y: 0, w: W, h: H * 0.78,
    fill: solidPaintHex(t.backBg),     // #2E7D32 forest green
    tags: ["decorative", "back-element"],
  }));
  // bottom band (78-100%)
  layers.push(filledRect({
    name: "BG Bottom", x: 0, y: H * 0.78, w: W, h: H * 0.22,
    fill: solidPaintHex(t.frontBgAlt || "#1B5E20"),
    tags: ["decorative", "back-element"],
  }));

  // -- triangle logo (centered, upper) --
  const triW = W * 0.08;
  const triH = H * 0.05;
  const triCx = W * 0.50;
  const triCy = H * 0.32;
  layers.push(pathLayer({
    name: "Triangle Logo",
    commands: [
      M(triCx, triCy - triH),
      L(triCx + triW / 2, triCy),
      L(triCx - triW / 2, triCy),
      Z(),
    ],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["logo", "decorative", "back-element"],
  }));
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co",
    Math.round(triCx - triW / 2), Math.round(triCy - triH),
    Math.round(triW), "#FFFFFF", 1.0, cfg.fontFamily));

  // -- company name � hero centered --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.10, y: H * 0.45,
      w: W * 0.80, text: (cfg.company || "Company").toUpperCase(),
      fontSize: Math.round(H * 0.08), fontFamily: cfg.fontFamily,
      weight: 700, color: "#FFFFFF", align: "center",
      letterSpacing: 4,
      tags: ["company", "back-element"],
    }));
  }

  // -- tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.15, y: H * 0.56,
      w: W * 0.70, text: cfg.tagline,
      fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 300, color: "#FFFFFF", align: "center",
      tags: ["tagline", "back-element"],
    }));
  }

  // -- small circle icon (bottom band, centered) --
  const circR = W * 0.015;
  layers.push(filledEllipse({
    name: "Circle Icon",
    cx: W * 0.50, cy: H * 0.82,
    rx: circR, ry: circR,
    fill: solidPaintHex(t.accent),   // #4CAF50
    tags: ["decorative", "back-element"],
  }));

  // -- website (bottom band) --
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.10, y: H * 0.87,
      w: W * 0.80, text: cfg.contacts.website,
      fontSize: Math.round(H * 0.028), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-text", "back-element"],
    }));
  }

  return layers;

});

// ===================== CREATIVE TEMPLATES =====================

// ---------------------------------------------------------------------------
// #19  Flowing Lines � Deep forest green bg, 8-10 flowing S-curve bezier lines
// ---------------------------------------------------------------------------

function layoutFlowingLines(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["flowing-lines"];

  const layers: LayerV2[] = [];

  // -- Background: off-white --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Mirrored flowing lines � right 40% --
  const lineW = W * 0.015;
  const lineSpacing = W * 0.035;
  for (let i = 0; i < 7; i++) {
    const ox = i * lineSpacing;
    const baseX = W * 0.60;
    const cmds: PathCommand[] = [
      M(baseX + ox, H * 0.15),
      C(baseX + W * 0.10 + ox, H * 0.30, baseX + ox, H * 0.55, baseX + W * 0.15 + ox, H * 0.70),
      C(baseX + W * 0.20 + ox, H * 0.80, baseX + W * 0.15 + ox, H * 0.85, baseX + W * 0.10 + ox, H * 0.90)];
    layers.push(pathLayer({
      name: `Back Flow ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: cmds, closed: false,
      stroke: makeStroke(t.accent ?? t.accent, lineW),
      tags: ["decorative", "accent"],
    }));
  }

  // -- Name --
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.22, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 700, color: t.frontText ?? t.frontBg, uppercase: true,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.33, w: W * 0.45,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03), fontFamily: ff,
    weight: 400, color: "#666666",
    tags: ["title"],
  }));

  // -- Contact with icons --
  layers.push(...contactWithIcons({
    contacts: extractContacts(cfg),
    x: W * 0.08, startY: H * 0.48,
    lineGap: Math.round(H * 0.08),
    textColor: t.contactText ?? "#333333",
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;

}

registerBackLayout("flowing-lines", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: deep forest green --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background", "back-element"] }));

  // -- Flowing curved lines � 9 parallel bezier S-curves, left 60% --
  const lineW = W * 0.015;          // ~16px stroke width
  const lineSpacing = W * 0.035;    // gap between parallel lines
  for (let i = 0; i < 9; i++) {
    const ox = i * lineSpacing;
    const cmds: PathCommand[] = [
      M(W * 0.05 + ox, H * 0.10),
      C(W * 0.15 + ox, H * 0.25, W * 0.05 + ox, H * 0.50, W * 0.20 + ox, H * 0.65),
      C(W * 0.30 + ox, H * 0.75, W * 0.25 + ox, H * 0.85, W * 0.15 + ox, H * 0.90),
    ];
    layers.push(pathLayer({
      name: `Flow Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: cmds, closed: false,
      stroke: makeStroke(t.accent, lineW),
      tags: ["decorative", "accent", "back-element"],
    }));
  }

  // -- Company: "Curve STUDIO" � right 40%, mixed weight --
  layers.push(styledText({
    name: "Company", x: W * 0.62, y: H * 0.22, w: W * 0.34,
    text: cfg.company || "Curve STUDIO", fontSize: Math.round(H * 0.08), fontFamily: cfg.fontFamily,
    weight: 700, color: t.backText, align: "left",
    tags: ["company", "back-element"],
  }));

  // -- Tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.62, y: H * 0.33, w: W * 0.34,
      text: cfg.tagline, fontSize: Math.round(H * 0.03), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText, align: "left",
      tags: ["tagline", "back-element"],
    }));
  }

  // -- Website � bottom right --
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.62, y: H * 0.83, w: W * 0.34,
      text: cfg.contacts.website, fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: t.backText, align: "left",
      tags: ["contact-website", "contact-text", "back-element"],
    }));
  }

  // -- Logo watermark --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.62, H * 0.12, H * 0.08, t.backText, 0.7, cfg.fontFamily));

  return layers;

});


// ---------------------------------------------------------------------------
// #20  Neon Watermark � Dark teal diagonal + geometric overlays
// ---------------------------------------------------------------------------

function layoutNeonWatermark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["neon-watermark"];
  const layers: LayerV2[] = [];

  // -- Background: warm off-white --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Diagonal teal section � upper-right trapezoid --
  layers.push(pathLayer({
    name: "Diagonal Teal", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.45, 0), L(W, 0), L(W, H * 0.45), L(W * 0.15, H * 0.45), Z(),
    ],
    fill: solidPaintHex(t.frontBgAlt ?? t.accent),
    tags: ["decorative", "accent"],
  }));

  // -- Geometric overlay A � large angular polygon at 70% opacity --
  layers.push(pathLayer({
    name: "Overlay A", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.60, H * 0.40), L(W, H * 0.40), L(W, H), L(W * 0.40, H), Z(),
    ],
    fill: solidPaintHex(t.accentAlt ?? "#B8C5D1"),
    opacity: 0.7,
    tags: ["decorative"],
  }));

  // -- Geometric overlay B � smaller accent polygon at 50% opacity --
  layers.push(pathLayer({
    name: "Overlay B", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.70, H * 0.58), L(W, H * 0.58), L(W, H), L(W * 0.55, H), Z(),
    ],
    fill: solidPaintHex("#A0B0C0"),
    opacity: 0.5,
    tags: ["decorative"],
  }));

  // -- QR code placeholder --
  const qrSize = W * 0.10;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.08, y: H * 0.25, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code"],
  }));

  // -- Name � inside diagonal section, right-aligned, white --
  layers.push(styledText({
    name: "Name", x: W * 0.40, y: H * 0.15, w: W * 0.52,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#FFFFFF", align: "right",
    tags: ["name", "primary-text"],
  }));

  // -- Designation � below name in diagonal --
  layers.push(styledText({
    name: "Title", x: W * 0.40, y: H * 0.24, w: W * 0.52,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 300, color: t.frontTextAlt ?? "#FFFFFF", align: "right",
    letterSpacing: 1, uppercase: true,
    tags: ["title"],
  }));

  // -- Separator line --
  layers.push(divider({
    name: "Separator", x: W * 0.08, y: H * 0.58,
    length: W * 0.30, thickness: 1, color: t.accentAlt ?? "#B8C5D1", alpha: 1.0,
    direction: "horizontal",
    tags: ["decorative", "divider"],
  }));

  // -- Contact with icons � left side below separator --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.08, startY: H * 0.65,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? t.accent,
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.03),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;
}

registerBackLayout("neon-watermark", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark teal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Geometric background polygon A --
  layers.push(pathLayer({
    name: "Back Geo A", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.20, H * 0.60), L(W * 0.80, H * 0.60), L(W * 0.70, H), L(W * 0.10, H), Z(),
    ],
    fill: solidPaintHex("#1A4A63"),
    opacity: 0.6,
    tags: ["decorative"],
  }));

  // -- Geometric background polygon B --
  layers.push(pathLayer({
    name: "Back Geo B", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.30, H * 0.70), L(W * 0.90, H * 0.70), L(W * 0.80, H), L(W * 0.20, H), Z(),
    ],
    fill: solidPaintHex("#15405A"),
    opacity: 0.4,
    tags: ["decorative"],
  }));

  // -- Hexagonal logo outline --
  const hR = 36;
  const hCx = W * 0.50;
  const hCy = H * 0.35;
  const hexCmds: PathCommand[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = i * Math.PI / 3 - Math.PI / 6;
    const px = hCx + hR * Math.cos(angle);
    const py = hCy + hR * Math.sin(angle);
    hexCmds.push(i === 0 ? M(px, py) : L(px, py));
  }
  hexCmds.push(Z());
  layers.push(pathLayer({
    name: "Hexagon Logo", x: 0, y: 0, w: W, h: H,
    commands: hexCmds,
    stroke: makeStroke("#FFFFFF", 2),
    tags: ["logo", "branding"],
  }));

  // -- Logo watermark --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", hCx - 18, hCy - 18, 36, "#FFFFFF", 0.9, cfg.fontFamily));

  // -- Company name --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.15, y: H * 0.53, w: W * 0.70,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.08), fontFamily: cfg.fontFamily,
      weight: 700, color: t.backText, align: "center", uppercase: true, letterSpacing: 3,
      tags: ["company"],
    }));
  }

  // -- Slogan --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Slogan", x: W * 0.15, y: H * 0.64, w: W * 0.70,
      text: cfg.tagline, fontSize: Math.round(H * 0.028), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText, align: "center", uppercase: true, letterSpacing: 4,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #21  Blueprint Tech � Gray front, architect floor plan on back
// ---------------------------------------------------------------------------

function layoutBlueprintTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["blueprint-tech"];

  const layers: LayerV2[] = [];

  // -- Background: white --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Architectural floor plan � right 50% --
  const planColor = t.accent ?? "#BDC3C7";
  // Outer walls
  layers.push(strokeRect({
    name: "Floor Plan Outer", x: W * 0.50, y: H * 0.05, w: W * 0.47, h: H * 0.90,
    color: planColor, width: 1, tags: ["decorative", "blueprint"],
  }));
  // Room divider lines
  const roomLines: Array<[number, number, number, number]> = [
    [W * 0.50, H * 0.33, W * 0.97, H * 0.33],   // horizontal
    [W * 0.50, H * 0.63, W * 0.81, H * 0.63],   // horizontal
    [W * 0.667, H * 0.05, W * 0.667, H * 0.33],  // vertical
    [W * 0.81, H * 0.33, W * 0.81, H * 0.95],    // vertical
  ];
  for (let i = 0; i < roomLines.length; i++) {
    const [x1, y1, x2, y2] = roomLines[i];
    layers.push(pathLayer({
      name: `Room Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [M(x1, y1), L(x2, y2)],
      stroke: makeStroke(planColor, 1), closed: false,
      tags: ["decorative", "blueprint"],
    }));
  }
  // Inner subdivisions
  const innerLines: Array<[number, number, number, number]> = [
    [W * 0.667, H * 0.33, W * 0.667, H * 0.63],
    [W * 0.571, H * 0.63, W * 0.571, H * 0.95]];
  for (let i = 0; i < innerLines.length; i++) {
    const [x1, y1, x2, y2] = innerLines[i];
    layers.push(pathLayer({
      name: `Inner Line ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [M(x1, y1), L(x2, y2)],
      stroke: makeStroke(planColor, 0.5), closed: false,
      tags: ["decorative", "blueprint"],
    }));
  }

  // -- Name --
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.22, w: W * 0.32,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05), fontFamily: ff,
    weight: 500, color: t.frontText,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.33, w: W * 0.32,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 300, color: "#7F8C8D", uppercase: true, letterSpacing: 2,
    tags: ["title"],
  }));

  // -- Contact with icons — generous spacing --
  layers.push(...contactWithIcons({
    contacts: extractContacts(cfg),
    x: W * 0.13, startY: H * 0.53,
    lineGap: Math.round(H * 0.10),
    textColor: t.frontText,
    iconColor: t.contactIcon ?? t.frontText,
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;

}

registerBackLayout("blueprint-tech", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: medium gray --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background", "back-element"] }));

  // -- Logo symbol � small geometric mark --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.18, H * 0.21, H * 0.04, t.backText, 1.0, cfg.fontFamily));

  // -- Logo text: company name in light weight, lowercase style --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.21, y: H * 0.21, w: W * 0.40,
      text: cfg.company || "crearquitectura", fontSize: Math.round(H * 0.06), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText,
      tags: ["company", "back-element"],
    }));
  }

  // -- QR code placeholder � right side --
  const qrSize = W * 0.12;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.75, y: H * 0.60, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code", "back-element"],
  }));

  // -- Orange-red corner accent on QR --
  layers.push(pathLayer({
    name: "QR Accent", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.75 + qrSize, H * 0.60),
      L(W * 0.75 + qrSize, H * 0.60 + 15),
      L(W * 0.75 + qrSize - 15, H * 0.60),
      Z(),
    ],
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent", "back-element"],
  }));

  // -- Website URL � below QR --
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.75, y: H * 0.60 + qrSize + 10, w: qrSize,
      text: cfg.contacts.website, fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: t.backText,
      tags: ["contact-website", "contact-text", "back-element"],
    }));
  }

  return layers;

});


// ---------------------------------------------------------------------------
// #22  Skyline Silhouette � Layered cityscape + gradient background
// ---------------------------------------------------------------------------

function layoutSkylineSilhouette(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["skyline-silhouette"];

  const layers: LayerV2[] = [];

  // -- LEFT PANEL � gradient with skyline (clipped to left 50%) --
  layers.push(filledRect({
    name: "Left Panel BG", x: 0, y: 0, w: W * 0.50, h: H,
    fill: multiStopGradient(180, [
      { color: "#F5F5F5", offset: 0 },
      { color: "#E0E0E0", offset: 0.50 },
      { color: "#1A1A1A", offset: 0.70 },
      { color: "#1A1A1A", offset: 1.0 }]),
    tags: ["background"],
  }));

  // Simplified skyline for left panel
  layers.push(pathLayer({
    name: "Left Skyline", x: 0, y: 0, w: W * 0.50, h: H,
    commands: [
      M(0, H * 0.78),
      L(W * 0.05, H * 0.73), L(W * 0.10, H * 0.70), L(W * 0.15, H * 0.74),
      L(W * 0.20, H * 0.68), L(W * 0.25, H * 0.72), L(W * 0.30, H * 0.69),
      L(W * 0.35, H * 0.74), L(W * 0.40, H * 0.66), L(W * 0.45, H * 0.70),
      L(W * 0.50, H * 0.73),
      L(W * 0.50, H), L(0, H), Z()],
    fill: solidPaintHex("#1A1A1A"),
    tags: ["decorative", "skyline"],
  }));

  // Left panel branding
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.10, H * 0.28, 32, t.frontText ?? "#2C2C2C", 0.9, ff));
  layers.push(styledText({
    name: "Left Company", x: W * 0.10 + 40, y: H * 0.28, w: W * 0.30,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.04), fontFamily: ff,
    weight: 700, color: t.frontText ?? "#2C2C2C",
    tags: ["company"],
  }));

  // -- RIGHT PANEL � solid dark --
  layers.push(filledRect({
    name: "Right Panel", x: W * 0.50, y: 0, w: W * 0.50, h: H,
    fill: solidPaintHex(t.frontBg),
    tags: ["background"],
  }));

  // -- Name --
  layers.push(styledText({
    name: "Name", x: W * 0.55, y: H * 0.22, w: W * 0.40,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05), fontFamily: ff,
    weight: 700, color: t.frontText, uppercase: true,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.55, y: H * 0.30, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: "#CCCCCC", uppercase: true, letterSpacing: 1,
    tags: ["title"],
  }));

  // -- Contact with icons --
  layers.push(...contactWithIcons({
    contacts: extractContacts(cfg),
    x: W * 0.55, startY: H * 0.43,
    lineGap: Math.round(H * 0.08),
    textColor: t.frontText,
    iconColor: t.frontText,
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    maxWidth: Math.round(W * 0.38),
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;

}

registerBackLayout("skyline-silhouette", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: gradient #F5F5F5 ? #E0E0E0 ? #1A1A1A --
  layers.push(filledRect({
    name: "BG", x: 0, y: 0, w: W, h: H,
    fill: multiStopGradient(180, [
      { color: "#F5F5F5", offset: 0 },
      { color: "#E0E0E0", offset: 0.50 },
      { color: "#1A1A1A", offset: 0.70 },
      { color: "#1A1A1A", offset: 1.0 },
    ]),
    tags: ["background", "back-element"],
  }));

  // -- Building icon (3 rectangles) --
  layers.push(filledRect({ name: "Bldg Left", x: W * 0.42, y: H * 0.227, w: 12, h: 32, fill: solidPaintHex(t.backText), tags: ["decorative", "branding", "back-element"] }));
  layers.push(filledRect({ name: "Bldg Center", x: W * 0.42 + 14, y: H * 0.20, w: 14, h: 48, fill: solidPaintHex(t.backText), tags: ["decorative", "branding", "back-element"] }));
  layers.push(filledRect({ name: "Bldg Right", x: W * 0.42 + 30, y: H * 0.217, w: 12, h: 38, fill: solidPaintHex(t.backText), tags: ["decorative", "branding", "back-element"] }));

  // -- Company text beside icon --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.47, y: H * 0.19, w: W * 0.40,
      text: cfg.company || "REAL ESTATE", fontSize: Math.round(H * 0.06), fontFamily: cfg.fontFamily,
      weight: 700, color: t.backText, uppercase: true,
      tags: ["company", "back-element"],
    }));
  }

  // -- Tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.47, y: H * 0.26, w: W * 0.40,
      text: cfg.tagline, fontSize: Math.round(H * 0.02), fontFamily: cfg.fontFamily,
      weight: 400, color: t.frontTextAlt ?? "#666666", uppercase: true, letterSpacing: 2,
      tags: ["tagline", "back-element"],
    }));
  }

  // -- Logo --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.42, H * 0.20, 42, t.backText, 0.9, cfg.fontFamily));

  // -- 4-layer city skyline silhouette � bottom 35% --
  // Layer 1 (lightest, farthest)
  layers.push(pathLayer({
    name: "Skyline Layer 1", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.72),
      L(W * 0.05, H * 0.70), L(W * 0.10, H * 0.68), L(W * 0.18, H * 0.71),
      L(W * 0.25, H * 0.67), L(W * 0.30, H * 0.69), L(W * 0.38, H * 0.72),
      L(W * 0.45, H * 0.66), L(W * 0.52, H * 0.70), L(W * 0.60, H * 0.68),
      L(W * 0.68, H * 0.71), L(W * 0.75, H * 0.67), L(W * 0.82, H * 0.70),
      L(W * 0.90, H * 0.69), L(W, H * 0.73),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#E0E0E0"),
    tags: ["decorative", "skyline", "back-element"],
  }));

  // Layer 2
  layers.push(pathLayer({
    name: "Skyline Layer 2", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.78),
      L(W * 0.04, H * 0.73), L(W * 0.08, H * 0.75), L(W * 0.12, H * 0.71),
      L(W * 0.16, H * 0.74), L(W * 0.22, H * 0.68), L(W * 0.26, H * 0.72),
      L(W * 0.32, H * 0.70), L(W * 0.38, H * 0.75), L(W * 0.44, H * 0.66),
      L(W * 0.48, H * 0.69), L(W * 0.54, H * 0.73), L(W * 0.60, H * 0.67),
      L(W * 0.66, H * 0.72), L(W * 0.72, H * 0.69), L(W * 0.78, H * 0.74),
      L(W * 0.84, H * 0.70), L(W * 0.90, H * 0.73), L(W * 0.96, H * 0.71),
      L(W, H * 0.76),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#AAAAAA"),
    tags: ["decorative", "skyline", "back-element"],
  }));

  // Layer 3
  layers.push(pathLayer({
    name: "Skyline Layer 3", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.82),
      L(W * 0.06, H * 0.78), L(W * 0.10, H * 0.74), L(W * 0.14, H * 0.78),
      L(W * 0.20, H * 0.72), L(W * 0.24, H * 0.76), L(W * 0.30, H * 0.73),
      L(W * 0.36, H * 0.78), L(W * 0.42, H * 0.70), L(W * 0.46, H * 0.74),
      L(W * 0.52, H * 0.76), L(W * 0.58, H * 0.72), L(W * 0.64, H * 0.77),
      L(W * 0.70, H * 0.73), L(W * 0.76, H * 0.78), L(W * 0.82, H * 0.74),
      L(W * 0.88, H * 0.77), L(W * 0.94, H * 0.75),
      L(W, H * 0.80),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#666666"),
    tags: ["decorative", "skyline", "back-element"],
  }));

  // Layer 4 (darkest, nearest)
  layers.push(pathLayer({
    name: "Skyline Layer 4", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.88),
      L(W * 0.05, H * 0.83), L(W * 0.10, H * 0.80), L(W * 0.15, H * 0.84),
      L(W * 0.20, H * 0.78), L(W * 0.25, H * 0.82), L(W * 0.32, H * 0.79),
      L(W * 0.38, H * 0.84), L(W * 0.44, H * 0.76), L(W * 0.50, H * 0.80),
      L(W * 0.56, H * 0.78), L(W * 0.62, H * 0.83), L(W * 0.68, H * 0.79),
      L(W * 0.74, H * 0.84), L(W * 0.80, H * 0.80), L(W * 0.86, H * 0.83),
      L(W * 0.92, H * 0.81),
      L(W, H * 0.85),
      L(W, H), L(0, H), Z(),
    ],
    fill: solidPaintHex("#1A1A1A"),
    tags: ["decorative", "skyline", "back-element"],
  }));

  // -- Website at bottom --
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.25, y: H * 0.91, w: W * 0.50,
      text: cfg.contacts.website, fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: "#FFFFFF", align: "center",
      tags: ["contact-website", "contact-text", "back-element"],
    }));
  }

  return layers;

});


// ---------------------------------------------------------------------------
// #23  World Map � Blue/orange corporate, web.gurus style
// ---------------------------------------------------------------------------

function layoutWorldMap(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["world-map"];
  const layers: LayerV2[] = [];

  // -- Background: white --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Company logo text � left zone, split weight "web.gurus" --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.15, y: H * 0.33, w: W * 0.30,
      text: cfg.company || "web.gurus", fontSize: Math.round(H * 0.08), fontFamily: ff,
      weight: 700, color: t.frontText,
      tags: ["company"],
    }));
  }

  // -- Tagline badge � orange rounded rect with white text --
  if (cfg.tagline) {
    layers.push(filledRect({
      name: "Tagline Badge BG", x: W * 0.15, y: H * 0.44, w: W * 0.18, h: H * 0.038,
      fill: solidPaintHex(t.accent), radii: [3, 3, 3, 3],
      tags: ["decorative", "accent"],
    }));
    layers.push(styledText({
      name: "Tagline", x: W * 0.155, y: H * 0.445, w: W * 0.17,
      text: cfg.tagline, fontSize: Math.round(H * 0.025), fontFamily: ff,
      weight: 400, color: "#FFFFFF",
      tags: ["tagline"],
    }));
  }

  // -- Logo watermark --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.15, H * 0.26, H * 0.06, t.frontText, 0.9, ff));

  // -- Name � right zone --
  layers.push(styledText({
    name: "Name", x: W * 0.55, y: H * 0.18, w: W * 0.40,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.045), fontFamily: ff,
    weight: 700, color: t.frontText,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.55, y: H * 0.24, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#7B8A8B",
    tags: ["title"],
  }));

  // -- Address lines --
  if (cfg.address) {
    layers.push(styledText({
      name: "Address", x: W * 0.55, y: H * 0.33, w: W * 0.40,
      text: cfg.address, fontSize: Math.round(H * 0.028), fontFamily: ff,
      weight: 400, color: t.contactText ?? "#34495E",
      tags: ["contact-address", "contact-text"],
    }));
  }

  // -- Contact with orange icons � right zone --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.55, startY: H * 0.63,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? "#34495E",
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.028),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;
}

registerBackLayout("world-map", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: deep blue --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Tagline badge (centered above logo) --
  if (cfg.tagline) {
    layers.push(filledRect({
      name: "Back Badge BG", x: W * 0.38, y: H * 0.32, w: W * 0.24, h: H * 0.04,
      fill: solidPaintHex(t.backAccent ?? t.accent), radii: [3, 3, 3, 3],
      tags: ["decorative", "accent"],
    }));
    layers.push(styledText({
      name: "Back Badge", x: W * 0.385, y: H * 0.325, w: W * 0.23,
      text: cfg.tagline, fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 400, color: t.backText, align: "center",
      tags: ["tagline"],
    }));
  }

  // -- Company logo (centered, large) --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.15, y: H * 0.42, w: W * 0.70,
      text: cfg.company || "web.gurus", fontSize: Math.round(H * 0.12), fontFamily: cfg.fontFamily,
      weight: 700, color: t.backText, align: "center",
      tags: ["company"],
    }));
  }

  // -- Logo watermark --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.46, H * 0.22, H * 0.08, t.backText, 0.8, cfg.fontFamily));

  // -- Social handles at bottom --
  layers.push(styledText({
    name: "Social Info", x: W * 0.15, y: H * 0.83, w: W * 0.70,
    text: cfg.contacts.website || "www.company.com", fontSize: Math.round(H * 0.03), fontFamily: cfg.fontFamily,
    weight: 400, color: t.backText, align: "center",
    tags: ["contact-website", "contact-text"],
  }));

  // -- Orange social icon accents --
  const iconS = 12;
  layers.push(filledEllipse({
    name: "Social Icon 1", cx: W * 0.42, cy: H * 0.84, rx: iconS / 2, ry: iconS / 2,
    fill: solidPaintHex(t.backAccent ?? t.accent),
    tags: ["decorative", "contact-icon"],
  }));
  layers.push(filledEllipse({
    name: "Social Icon 2", cx: W * 0.58, cy: H * 0.84, rx: iconS / 2, ry: iconS / 2,
    fill: solidPaintHex(t.backAccent ?? t.accent),
    tags: ["decorative", "contact-icon"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #24  Diagonal Gold � Dark teal + white diagonal band + gold accents
// ---------------------------------------------------------------------------

function layoutDiagonalGold(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diagonal-gold"];
  const layers: LayerV2[] = [];

  // -- Background: dark teal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- White diagonal band � parallelogram ~15� slant --
  layers.push(pathLayer({
    name: "White Band", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.35), L(W, H * 0.15), L(W, H * 0.70), L(0, H * 0.90), Z(),
    ],
    fill: solidPaintHex("#FFFFFF"),
    tags: ["decorative"],
  }));

  // -- Gold accent strip � thin parallelogram along bottom of white band --
  layers.push(pathLayer({
    name: "Gold Strip", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, H * 0.87), L(W, H * 0.67), L(W, H * 0.70), L(0, H * 0.90), Z(),
    ],
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent"],
  }));

  // -- Name � on white band, dark teal --
  layers.push(styledText({
    name: "Name", x: W * 0.20, y: H * 0.42, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.08), fontFamily: ff,
    weight: 700, color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // -- Title � on white band, gray --
  layers.push(styledText({
    name: "Title", x: W * 0.20, y: H * 0.53, w: W * 0.55,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025), fontFamily: ff,
    weight: 400, color: t.frontTextAlt ?? "#8B8B8B", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  // -- Contact with gold icons � below band on dark teal --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts,
    x: W * 0.05, startY: H * 0.65,
    lineGap: Math.round(H * 0.025),
    textColor: t.contactText ?? "#FFFFFF",
    iconColor: t.contactIcon ?? t.accent,
    fontSize: Math.round(H * 0.022),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  // -- QR code placeholder � right side --
  const qrSize = W * 0.12;
  layers.push(filledRect({
    name: "QR Background", x: W * 0.75, y: H * 0.75, w: qrSize, h: qrSize,
    fill: solidPaintHex("#FFFFFF"), radii: [2, 2, 2, 2],
    tags: ["qr-code"],
  }));

  return layers;
}

registerBackLayout("diagonal-gold", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark teal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Logo � geometric mark, gold --
  layers.push(...buildWatermarkLogo(cfg.logoUrl, cfg.company || "Co", W * 0.71, H * 0.18, H * 0.14, t.backText ?? t.accent, 1.0, cfg.fontFamily));

  // -- Company name --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.60, y: H * 0.35, w: W * 0.35,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.04), fontFamily: cfg.fontFamily,
      weight: 700, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 2,
      tags: ["company"],
    }));
  }

  // -- Tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: W * 0.60, y: H * 0.42, w: W * 0.35,
      text: cfg.tagline, fontSize: Math.round(H * 0.02), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  // -- Service categories --
  const services = ["CONSTRUCTION", "HOME DESIGN", "INVESTMENT", "CONSULTING"];
  for (let i = 0; i < services.length; i++) {
    layers.push(styledText({
      name: `Service ${i + 1}`, x: W * 0.68, y: H * 0.50 + i * Math.round(H * 0.04), w: W * 0.28,
      text: services[i], fontSize: Math.round(H * 0.025), fontFamily: cfg.fontFamily,
      weight: 300, color: t.backText ?? t.accent, uppercase: true, letterSpacing: 3,
      tags: ["tagline"],
    }));
  }

  // -- Gold bottom bar --
  layers.push(filledRect({
    name: "Gold Bar", x: 0, y: H * 0.92, w: W, h: H * 0.08,
    fill: solidPaintHex(t.accent),
    tags: ["decorative", "accent"],
  }));

  return layers;
});

// ---------------------------------------------------------------------------
// #25  Luxury Divider � BACK: teal bg, gold company + accent line + website
// ---------------------------------------------------------------------------

registerBackLayout("luxury-divider", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark teal (color-inverted from front) --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Geometric logo element � angular triangle --
  layers.push(pathLayer({
    name: "Geometric Logo", x: 0, y: 0, w: W, h: H,
    commands: [
      M(W * 0.15, H * 0.49),
      L(W * 0.19, H * 0.35),
      L(W * 0.23, H * 0.49),
      Z(),
    ],
    fill: solidPaintHex(t.backText ?? "#F4D58D"),
    tags: ["decorative", "logo"],
  }));

  // -- Watermark logo --
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.15, H * 0.35, Math.round(H * 0.14),
    t.backText ?? "#F4D58D", 1.0, cfg.fontFamily
  ));

  // -- Company --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: 0, y: H * 0.45, w: W,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
      fontFamily: cfg.fontFamily, weight: 700,
      color: t.backText ?? "#F4D58D", align: "center",
      uppercase: true, letterSpacing: 4,
      tags: ["company", "primary-text"],
    }));
  }

  // -- Horizontal accent line --
  layers.push(divider({
    name: "Accent Line", x: W * 0.20, y: H * 0.65,
    length: W * 0.60, thickness: 3,
    color: t.backText ?? "#F4D58D",
    tags: ["decorative", "accent"],
  }));

  // -- Website --
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website", x: 0, y: H * 0.75, w: W,
      text: cfg.contacts.website, fontSize: Math.round(H * 0.025),
      fontFamily: cfg.fontFamily, weight: 400,
      color: t.backText ?? "#F4D58D", align: "center",
      tags: ["contact-website", "back"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #26  Social Band � BACK: full green, script watermark, centered brand
// ---------------------------------------------------------------------------

registerBackLayout("social-band", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: full forest green --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Script monogram watermark --
  const initial = (cfg.company || "V").charAt(0).toUpperCase();
  layers.push(styledText({
    name: "Watermark", x: 0, y: H * 0.20, w: W,
    text: initial, fontSize: Math.round(H * 0.35),
    fontFamily: "Georgia, serif", weight: 400,
    color: t.accent ?? "#4A6B5A", alpha: 0.3,
    align: "center", italic: true,
    tags: ["decorative", "watermark"],
  }));

  // -- Company / Brand --
  layers.push(styledText({
    name: "Company", x: 0, y: H * 0.50, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
    fontFamily: cfg.fontFamily, weight: 300,
    color: t.backText ?? "#FFFFFF", align: "center",
    uppercase: true, letterSpacing: 6,
    tags: ["company", "primary-text"],
  }));

  // -- Subtitle / Title --
  layers.push(styledText({
    name: "Subtitle", x: 0, y: H * 0.58, w: W,
    text: cfg.title || "Title", fontSize: Math.round(H * 0.025),
    fontFamily: cfg.fontFamily, weight: 300,
    color: t.backText ?? "#FFFFFF", alpha: 0.7,
    align: "center", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #27  Organic Pattern � BACK: full green, topographic contours, gold logo
// ---------------------------------------------------------------------------

registerBackLayout("organic-pattern", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: forest green --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Topographic contour lines � 6 organic bezier paths --
  const topoColor = t.accentAlt ?? "#3A4A42";
  const contours: Array<{ cx: number; cy: number; rx: number; ry: number }> = [
    { cx: W * 0.50, cy: H * 0.50, rx: W * 0.42, ry: H * 0.38 },
    { cx: W * 0.48, cy: H * 0.48, rx: W * 0.36, ry: H * 0.32 },
    { cx: W * 0.52, cy: H * 0.52, rx: W * 0.30, ry: H * 0.26 },
    { cx: W * 0.50, cy: H * 0.46, rx: W * 0.24, ry: H * 0.20 },
    { cx: W * 0.48, cy: H * 0.50, rx: W * 0.18, ry: H * 0.14 },
    { cx: W * 0.52, cy: H * 0.54, rx: W * 0.12, ry: H * 0.10 },
  ];
  contours.forEach((c, i) => {
    // Approximate each contour as an ellipse using bezier curves
    const kx = c.rx * 0.5523;
    const ky = c.ry * 0.5523;
    layers.push(pathLayer({
      name: `Contour ${i + 1}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(c.cx, c.cy - c.ry),
        C(c.cx + kx, c.cy - c.ry,  c.cx + c.rx, c.cy - ky,  c.cx + c.rx, c.cy),
        C(c.cx + c.rx, c.cy + ky,  c.cx + kx, c.cy + c.ry,  c.cx, c.cy + c.ry),
        C(c.cx - kx, c.cy + c.ry,  c.cx - c.rx, c.cy + ky,  c.cx - c.rx, c.cy),
        C(c.cx - c.rx, c.cy - ky,  c.cx - kx, c.cy - c.ry,  c.cx, c.cy - c.ry),
        Z(),
      ],
      closed: true,
      stroke: makeStroke(topoColor, 1.5),
      opacity: 0.20,
      tags: ["decorative", "pattern"],
    }));
  });

  // -- Logo � centered large --
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.50 - Math.round(W * 0.075), H * 0.40 - Math.round(W * 0.075),
    Math.round(W * 0.15), t.backText ?? "#B8A882", 1.0, cfg.fontFamily
  ));

  // -- Company --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: 0, y: H * 0.55, w: W,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.04),
      fontFamily: cfg.fontFamily, weight: 500,
      color: t.backText ?? "#B8A882", align: "center",
      uppercase: true, letterSpacing: 3,
      tags: ["company", "primary-text"],
    }));
  }

  // -- Tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: 0, y: H * 0.62, w: W,
      text: cfg.tagline, fontSize: Math.round(H * 0.02),
      fontFamily: cfg.fontFamily, weight: 300,
      color: t.backText ?? "#B8A882", alpha: 0.7,
      align: "center", uppercase: true, letterSpacing: 5,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ---------------------------------------------------------------------------
// #28  Celtic Stripe � BACK: dark bg, pattern strip on RIGHT, white company
// ---------------------------------------------------------------------------

registerBackLayout("celtic-stripe", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark charcoal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- Pattern strip background � RIGHT 25% --
  const stripX = W * 0.75;
  const stripW = W * 0.25;
  const stripCx = stripX + stripW / 2;
  layers.push(filledRect({ name: "Strip BG", x: stripX, y: 0, w: stripW, h: H, fill: solidPaintHex("#FFFFFF"), tags: ["decorative", "panel"] }));

  // -- Interlaced pattern on right strip --
  const unitH = 75;
  for (let y = 0; y < H; y += unitH) {
    // Horizontal ovals
    layers.push(strokeEllipse({
      name: `Oval A y${y}`, cx: stripCx, cy: y + 18, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    layers.push(strokeEllipse({
      name: `Oval B y${y}`, cx: stripCx, cy: y + 56, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    // Diamond connector
    layers.push(pathLayer({
      name: `Diamond y${y}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(stripCx - 50, y + 37),
        L(stripCx, y + 22),
        L(stripCx + 50, y + 37),
        L(stripCx, y + 52),
        Z(),
      ],
      stroke: makeStroke(t.accent ?? "#2C2C2C", 2),
      tags: ["decorative", "pattern"],
    }));
  }

  // -- Company name � left side --
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.65, w: W * 0.55,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.05),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.backText ?? "#FFFFFF",
    uppercase: true, letterSpacing: 3,
    tags: ["company", "primary-text"],
  }));

  return layers;
});


// ---------------------------------------------------------------------------
// #29  Premium Crest � BACK: cream bg, full-width skyline, name + contact
// ---------------------------------------------------------------------------

registerBackLayout("premium-crest", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark charcoal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background", "back-element"] }));

  // -- Key-skyline composite logo � right 40% zone --
  const keyColor = t.accent ?? "#F5F1E8";

  // Key shaft
  layers.push(filledRect({
    name: "Key Shaft", x: W * 0.77, y: H * 0.53,
    w: W * 0.048, h: H * 0.37,
    fill: solidPaintHex(keyColor),
    tags: ["decorative", "logo", "back-element"],
  }));

  // Key head circle
  layers.push(filledEllipse({
    name: "Key Head", cx: W * 0.794, cy: H * 0.42,
    rx: W * 0.086, ry: W * 0.086,
    fill: solidPaintHex(keyColor),
    tags: ["decorative", "logo", "back-element"],
  }));

  // Skyline buildings cut into key head (dark circles/rects to simulate cutouts)
  const bldgColor = t.backBg ?? "#1A1A1A";
  const bldgs: Array<{ x: number; y: number; w: number; h: number }> = [
    { x: W * 0.735, y: H * 0.36, w: W * 0.018, h: H * 0.12 },
    { x: W * 0.755, y: H * 0.32, w: W * 0.015, h: H * 0.16 },
    { x: W * 0.775, y: H * 0.28, w: W * 0.012, h: H * 0.20 },
    { x: W * 0.790, y: H * 0.34, w: W * 0.018, h: H * 0.14 },
    { x: W * 0.812, y: H * 0.30, w: W * 0.015, h: H * 0.18 },
    { x: W * 0.830, y: H * 0.38, w: W * 0.018, h: H * 0.10 },
  ];
  bldgs.forEach((b, i) => {
    layers.push(filledRect({
      name: `Bldg ${i + 1}`, x: b.x, y: b.y, w: b.w, h: b.h,
      fill: solidPaintHex(bldgColor),
      tags: ["decorative", "logo", "back-element"],
    }));
  });

  // Key hole
  layers.push(filledEllipse({
    name: "Key Hole", cx: W * 0.794, cy: H * 0.47,
    rx: W * 0.007, ry: W * 0.007,
    fill: solidPaintHex(bldgColor),
    tags: ["decorative", "logo", "back-element"],
  }));

  // -- Company text � left zone --
  layers.push(styledText({
    name: "Company", x: W * 0.08, y: H * 0.40, w: W * 0.50,
    text: cfg.company || "Real Estate", fontSize: Math.round(H * 0.06),
    fontFamily: cfg.fontFamily, weight: 700,
    color: t.frontTextAlt ?? "#F5F1E8",
    uppercase: true, letterSpacing: 3,
    tags: ["company", "primary-text", "back-element"],
  }));

  // -- Subtitle --
  layers.push(styledText({
    name: "Subtitle", x: W * 0.08, y: H * 0.50, w: W * 0.50,
    text: cfg.tagline || cfg.title || "Lorem Ipsum", fontSize: Math.round(H * 0.03),
    fontFamily: cfg.fontFamily, weight: 400,
    color: t.frontTextAlt ?? "#F5F1E8", alpha: 0.6,
    uppercase: true, letterSpacing: 5,
    tags: ["tagline", "back-element"],
  }));

  return layers;

});


// ---------------------------------------------------------------------------
// #30  Gold Construct � BACK: dark bg, world map dots, corner accents, company
// ---------------------------------------------------------------------------

registerBackLayout("gold-construct", (W, H, cfg, theme) => {
  const t = theme;
  const layers: LayerV2[] = [];

  // -- Background: dark charcoal --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.backBg), tags: ["background"] }));

  // -- World map dot pattern (simplified continental outlines) --
  const mapColor = t.accentAlt ?? "#1A1A1A";
  // Simplified dot grid representing major landmasses
  const dotR = 2;
  const continents: Array<[number, number]> = [
    // North America
    [0.18, 0.22], [0.20, 0.20], [0.22, 0.18], [0.24, 0.20], [0.16, 0.28],
    [0.18, 0.30], [0.20, 0.28], [0.22, 0.26], [0.24, 0.28], [0.26, 0.30],
    [0.14, 0.34], [0.16, 0.36], [0.18, 0.34], [0.20, 0.36], [0.22, 0.34],
    // South America
    [0.26, 0.50], [0.28, 0.48], [0.30, 0.52], [0.28, 0.56], [0.26, 0.60],
    [0.28, 0.62], [0.30, 0.58], [0.28, 0.66], [0.26, 0.70],
    // Europe
    [0.46, 0.18], [0.48, 0.16], [0.50, 0.18], [0.48, 0.22], [0.50, 0.24],
    [0.46, 0.26], [0.48, 0.28], [0.44, 0.24],
    // Africa
    [0.48, 0.36], [0.50, 0.34], [0.52, 0.38], [0.50, 0.42], [0.48, 0.46],
    [0.50, 0.50], [0.52, 0.48], [0.50, 0.54], [0.48, 0.58], [0.50, 0.62],
    // Asia
    [0.56, 0.18], [0.58, 0.16], [0.60, 0.18], [0.62, 0.20], [0.64, 0.18],
    [0.66, 0.22], [0.68, 0.24], [0.70, 0.22], [0.72, 0.26], [0.74, 0.28],
    [0.56, 0.26], [0.58, 0.28], [0.60, 0.30], [0.62, 0.32], [0.64, 0.30],
    [0.66, 0.34], [0.68, 0.32], [0.70, 0.36], [0.72, 0.34],
    [0.60, 0.38], [0.62, 0.40], [0.64, 0.42], [0.66, 0.38],
    // Australia
    [0.76, 0.54], [0.78, 0.52], [0.80, 0.54], [0.82, 0.56],
    [0.78, 0.58], [0.80, 0.60], [0.82, 0.58],
  ];
  continents.forEach(([px, py], i) => {
    layers.push(filledEllipse({
      name: `Map Dot ${i}`, cx: W * px, cy: H * py,
      rx: dotR, ry: dotR,
      fill: solidPaintHex(mapColor, 0.3),
      tags: ["decorative", "pattern"],
    }));
  });

  // -- Corner accent triangles --
  const cs = 21; // corner triangle size
  const ci = 32; // corner inset
  // Top-left
  layers.push(pathLayer({
    name: "Corner TL", x: 0, y: 0, w: W, h: H,
    commands: [M(ci, ci), L(ci + cs, ci), L(ci, ci + cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Top-right
  layers.push(pathLayer({
    name: "Corner TR", x: 0, y: 0, w: W, h: H,
    commands: [M(W - ci, ci), L(W - ci - cs, ci), L(W - ci, ci + cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Bottom-left
  layers.push(pathLayer({
    name: "Corner BL", x: 0, y: 0, w: W, h: H,
    commands: [M(ci, H - ci), L(ci + cs, H - ci), L(ci, H - ci - cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));
  // Bottom-right
  layers.push(pathLayer({
    name: "Corner BR", x: 0, y: 0, w: W, h: H,
    commands: [M(W - ci, H - ci), L(W - ci - cs, H - ci), L(W - ci, H - ci - cs), Z()],
    fill: solidPaintHex(t.backText ?? "#FFFFFF"),
    tags: ["decorative", "corner"],
  }));

  // -- Logo placeholder --
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.35, H * 0.25, Math.round(W * 0.08),
    t.backText ?? "#FFFFFF", 1.0, cfg.fontFamily
  ));

  // -- Company --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: 0, y: H * 0.55, w: W,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.06),
      fontFamily: cfg.fontFamily, weight: 700,
      color: t.backText ?? "#FFFFFF", align: "center",
      uppercase: true, letterSpacing: 2,
      tags: ["company", "primary-text"],
    }));
  }

  // -- Tagline --
  if (cfg.tagline) {
    layers.push(styledText({
      name: "Tagline", x: 0, y: H * 0.625, w: W,
      text: cfg.tagline, fontSize: Math.round(H * 0.022),
      fontFamily: cfg.fontFamily, weight: 300,
      color: t.backAccent ?? "#CCCCCC", align: "center",
      uppercase: true, letterSpacing: 3,
      tags: ["tagline"],
    }));
  }

  return layers;
});


// ===================== LUXURY TEMPLATES =====================

// ---------------------------------------------------------------------------
// #25  Luxury Divider � Gold front / teal text, two-color inversion design
// ---------------------------------------------------------------------------

function layoutLuxuryDivider(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["luxury-divider"];
  const layers: LayerV2[] = [];

  // -- Background: warm cream/gold --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- QR Code placeholder � upper right (teal on gold) --
  // QR is rendered externally; we create a placeholder area
  if (cfg.qrCodeUrl) {
    layers.push(filledRect({
      name: "QR Area", x: W * 0.75, y: H * 0.15,
      w: W * 0.18, h: H * 0.30,
      fill: solidPaintHex(t.frontBg), // same as bg
      tags: ["qr-placeholder"],
    }));
  }

  // -- Name --
  layers.push(styledText({
    name: "Name", x: W * 0.20, y: H * 0.38, w: W * 0.50,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.20, y: H * 0.48, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.03),
    fontFamily: ff, weight: 500,
    color: t.frontText, uppercase: true,
    tags: ["title"],
  }));

  // -- Contact with icons --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.20, startY: H * 0.60,
    lineGap: Math.round(H * 0.05),
    textColor: t.contactText ?? t.frontText,
    iconColor: t.contactIcon ?? t.frontText,
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #26  Social Band � 70/30 green/cream split, brand-focused
// ---------------------------------------------------------------------------

function layoutSocialBand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["social-band"];
  const layers: LayerV2[] = [];

  // -- Green top section (70%) --
  layers.push(filledRect({ name: "Green Zone", x: 0, y: 0, w: W, h: H * 0.70, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Cream bottom section (30%) --
  layers.push(filledRect({ name: "Cream Zone", x: 0, y: H * 0.70, w: W, h: H * 0.30, fill: solidPaintHex(t.frontBgAlt ?? "#E8E6E1"), tags: ["background", "panel"] }));

  // -- Brand name � centered on green, Light weight, very wide tracking --
  layers.push(styledText({
    name: "Brand", x: 0, y: H * 0.32, w: W,
    text: cfg.company || "Company", fontSize: Math.round(H * 0.08),
    fontFamily: ff, weight: 300,
    color: t.frontText, align: "center",
    uppercase: true, letterSpacing: 6,
    tags: ["company", "primary-text"],
  }));

  // -- Subtitle / Title � centered, light --
  layers.push(styledText({
    name: "Subtitle", x: 0, y: H * 0.45, w: W,
    text: cfg.title || "Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontText, alpha: 0.7,
    align: "center", uppercase: true, letterSpacing: 4,
    tags: ["title"],
  }));

  // -- Vertical divider in cream section --
  layers.push(divider({
    name: "V-Divider", x: W * 0.55, y: H * 0.75,
    length: H * 0.22, thickness: 1,
    color: t.divider ?? "#2C2C2C",
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // -- Social handle text � left of divider in cream --
  layers.push(styledText({
    name: "Social Handle", x: W * 0.08, y: H * 0.82, w: W * 0.40,
    text: "@" + (cfg.company || "social").toLowerCase().replace(/\s+/g, ""),
    fontSize: Math.round(H * 0.02), fontFamily: ff, weight: 400,
    color: t.frontTextAlt ?? "#2C2C2C",
    uppercase: true, tags: ["contact-social"],
  }));

  // -- Contact text � right of divider in cream --
  const contacts = extractContacts(cfg);
  if (contacts.website) {
    layers.push(styledText({
      name: "Website", x: W * 0.62, y: H * 0.78, w: W * 0.32,
      text: contacts.website, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-website"],
    }));
  }
  if (contacts.email) {
    layers.push(styledText({
      name: "Email", x: W * 0.62, y: H * 0.86, w: W * 0.32,
      text: contacts.email, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-email"],
    }));
  }
  if (contacts.phone) {
    layers.push(styledText({
      name: "Phone", x: W * 0.62, y: H * 0.94, w: W * 0.32,
      text: contacts.phone, fontSize: Math.round(H * 0.02),
      fontFamily: ff, weight: 400,
      color: t.frontTextAlt ?? "#2C2C2C", uppercase: true,
      tags: ["contact-phone"],
    }));
  }

  return layers;
}


// ---------------------------------------------------------------------------
// #27  Organic Pattern � 60/40 vertical split, green/white, gold icon strip
// ---------------------------------------------------------------------------

function layoutOrganicPattern(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["organic-pattern"];
  const layers: LayerV2[] = [];

  // -- Green left section (60%) --
  layers.push(filledRect({ name: "Green Zone", x: 0, y: 0, w: W * 0.60, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- White right section (40%) --
  layers.push(filledRect({ name: "White Zone", x: W * 0.60, y: 0, w: W * 0.40, h: H, fill: solidPaintHex(t.frontBgAlt ?? "#FFFFFF"), tags: ["background", "panel"] }));

  // -- Vertical gold icon strip at divider --
  layers.push(filledRect({
    name: "Icon Strip", x: W * 0.58, y: H * 0.325,
    w: W * 0.04, h: H * 0.35,
    fill: solidPaintHex(t.accent ?? "#B8A882"),
    tags: ["decorative", "accent"],
  }));

  // -- Name � on green --
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.30, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.05),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // -- Position/Title � on green --
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.38, w: W * 0.45,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontText, alpha: 0.8,
    tags: ["title"],
  }));

  // -- Contact � on green, gold text --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.08, startY: H * 0.52,
    lineGap: Math.round(H * 0.06),
    textColor: t.contactText ?? t.frontText,
    iconColor: t.contactIcon ?? t.accent ?? "#B8A882",
    fontSize: Math.round(H * 0.02),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  // -- Company logo � on white section --
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company, W * 0.72, H * 0.15, Math.round(W * 0.08),
    t.frontTextAlt ?? "#6B7B73", 1.0, ff
  ));

  // -- Company text � on white section --
  if (!cfg.logoUrl) {
    layers.push(styledText({
      name: "Company", x: W * 0.65, y: H * 0.32, w: W * 0.30,
      text: cfg.company || "Company", fontSize: Math.round(H * 0.028),
      fontFamily: ff, weight: 500,
      color: t.frontTextAlt ?? "#6B7B73",
      uppercase: true, letterSpacing: 2,
      tags: ["company"],
    }));
  }

  return layers;
}


// ---------------------------------------------------------------------------
// #28  Celtic Stripe � White front, 25% interlaced pattern strip on left
// ---------------------------------------------------------------------------

function layoutCelticStripe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["celtic-stripe"];
  const layers: LayerV2[] = [];

  // -- Background: white --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Pattern strip background � LEFT 25% --
  const stripW = W * 0.25;
  const stripCx = stripW / 2;
  layers.push(filledRect({ name: "Strip BG", x: 0, y: 0, w: stripW, h: H, fill: solidPaintHex(t.frontBgAlt ?? "#F8F8F8"), tags: ["decorative", "panel"] }));

  // -- Interlaced oval-diamond pattern --
  const unitH = 75;
  for (let y = 0; y < H; y += unitH) {
    // Horizontal ovals
    layers.push(strokeEllipse({
      name: `Oval A y${y}`, cx: stripCx, cy: y + 18, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    layers.push(strokeEllipse({
      name: `Oval B y${y}`, cx: stripCx, cy: y + 56, rx: 50, ry: 18,
      color: t.accent ?? "#2C2C2C", width: 2,
    }));
    // Diamond connector
    layers.push(pathLayer({
      name: `Diamond y${y}`, x: 0, y: 0, w: W, h: H,
      commands: [
        M(stripCx - 50, y + 37),
        L(stripCx, y + 22),
        L(stripCx + 50, y + 37),
        L(stripCx, y + 52),
        Z(),
      ],
      stroke: makeStroke(t.accent ?? "#2C2C2C", 2),
      tags: ["decorative", "pattern"],
    }));
  }

  // -- Name � right of stripe --
  layers.push(styledText({
    name: "Name", x: W * 0.35, y: H * 0.48, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // -- Contact with icons --
  const contacts = extractContacts(cfg);
  layers.push(...contactWithIcons({
    contacts, x: W * 0.38, startY: H * 0.68,
    lineGap: Math.round(H * 0.03),
    textColor: t.contactText ?? "#666666",
    iconColor: t.contactIcon ?? "#666666",
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;
}


// ---------------------------------------------------------------------------
// #29  Premium Crest � Dark front with key-skyline logo, cream text
// ---------------------------------------------------------------------------

function layoutPremiumCrest(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["premium-crest"];

  const layers: LayerV2[] = [];

  // -- Background: cream --
  layers.push(filledRect({ name: "BG", x: 0, y: 0, w: W, h: H, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- City skyline silhouette � full width, top 50% --
  layers.push(pathLayer({
    name: "Skyline", x: 0, y: 0, w: W, h: H,
    commands: [
      M(0, 0), L(W, 0), L(W, H * 0.33),
      // Roofline right to left � 12+ buildings
      L(W * 0.96, H * 0.33), L(W * 0.96, H * 0.22), L(W * 0.92, H * 0.22),
      L(W * 0.92, H * 0.38), L(W * 0.87, H * 0.38),
      L(W * 0.87, H * 0.15), L(W * 0.84, H * 0.12), L(W * 0.81, H * 0.15),
      L(W * 0.81, H * 0.42), L(W * 0.76, H * 0.42),
      L(W * 0.76, H * 0.28), L(W * 0.72, H * 0.28),
      L(W * 0.72, H * 0.45), L(W * 0.66, H * 0.45),
      L(W * 0.66, H * 0.18), L(W * 0.63, H * 0.14), L(W * 0.60, H * 0.18),
      L(W * 0.60, H * 0.40), L(W * 0.55, H * 0.40),
      L(W * 0.55, H * 0.30), L(W * 0.50, H * 0.30),
      L(W * 0.50, H * 0.48), L(W * 0.45, H * 0.48),
      L(W * 0.45, H * 0.20), L(W * 0.42, H * 0.16), L(W * 0.39, H * 0.20),
      L(W * 0.39, H * 0.35), L(W * 0.34, H * 0.35),
      L(W * 0.34, H * 0.42), L(W * 0.28, H * 0.42),
      L(W * 0.28, H * 0.25), L(W * 0.24, H * 0.25),
      L(W * 0.24, H * 0.38), L(W * 0.18, H * 0.38),
      L(W * 0.18, H * 0.30), L(W * 0.14, H * 0.30),
      L(W * 0.14, H * 0.45), L(W * 0.08, H * 0.45),
      L(W * 0.08, H * 0.35), L(W * 0.04, H * 0.35),
      L(W * 0.04, H * 0.42), L(0, H * 0.42),
      Z()],
    fill: solidPaintHex(t.accent ?? "#1A1A1A"),
    tags: ["decorative", "skyline"],
  }));

  // -- Logo (upper-left, below skyline) --
  layers.push(...buildWatermarkLogo(
    cfg.logoUrl, cfg.company || "Co",
    Math.round(W * 0.08), Math.round(H * 0.55),
    Math.round(H * 0.10), t.frontText ?? "#2A2A2A", 1.0, ff
  ));

  // -- Name --
  layers.push(styledText({
    name: "Name", x: W * 0.08, y: H * 0.68, w: W * 0.50,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.06),
    fontFamily: ff, weight: 700,
    color: t.frontText ?? "#2A2A2A",
    uppercase: true, letterSpacing: 4,
    tags: ["name", "primary-text"],
  }));

  // -- Title --
  layers.push(styledText({
    name: "Title", x: W * 0.08, y: H * 0.76, w: W * 0.40,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 400,
    color: t.contactText ?? "#4A4A4A",
    uppercase: true, letterSpacing: 2,
    tags: ["title"],
  }));

  // -- Contact with icons --
  layers.push(...contactWithIcons({
    contacts: extractContacts(cfg),
    x: W * 0.50, startY: H * 0.60,
    lineGap: Math.round(H * 0.06),
    textColor: t.contactText ?? "#4A4A4A",
    iconColor: t.contactIcon ?? "#4A4A4A",
    fontSize: Math.round(H * 0.025),
    fontFamily: ff,
    tags: ["front"],
    maxY: H * 0.95,
  }));

  return layers;

}


// ---------------------------------------------------------------------------
// #30  Gold Construct � 60/40 horizontal split, 3-column contact strip
// ---------------------------------------------------------------------------

function layoutGoldConstruct(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["gold-construct"];
  const layers: LayerV2[] = [];

  // -- Top section: dark gray (60%) --
  layers.push(filledRect({ name: "Dark Zone", x: 0, y: 0, w: W, h: H * 0.60, fill: solidPaintHex(t.frontBg), tags: ["background"] }));

  // -- Bottom section: light gray (40%) --
  layers.push(filledRect({ name: "Light Zone", x: 0, y: H * 0.60, w: W, h: H * 0.40, fill: solidPaintHex(t.frontBgAlt ?? "#F5F5F5"), tags: ["background", "panel"] }));

  // -- Name � white on dark, left-aligned --
  layers.push(styledText({
    name: "Name", x: W * 0.15, y: H * 0.20, w: W * 0.65,
    text: cfg.name || "Your Name", fontSize: Math.round(H * 0.08),
    fontFamily: ff, weight: 700,
    color: t.frontText, uppercase: true, letterSpacing: 3,
    tags: ["name", "primary-text"],
  }));

  // -- Title � light gray, very wide tracking --
  layers.push(styledText({
    name: "Title", x: W * 0.15, y: H * 0.30, w: W * 0.65,
    text: cfg.title || "Job Title", fontSize: Math.round(H * 0.025),
    fontFamily: ff, weight: 300,
    color: t.frontTextAlt ?? "#CCCCCC",
    uppercase: true, letterSpacing: 5,
    tags: ["title"],
  }));

  // -- 3-column contact strip in bottom section --
  const contacts = extractContacts(cfg);
  const colW = W / 3;
  const contactY = H * 0.78;
  const iconR = 16;
  const iconY = H * 0.76;
  const textY = H * 0.84;
  const contactFontSize = Math.round(H * 0.02);

  // Column 1: Phone
  if (contacts.phone) {
    layers.push(strokeEllipse({
      name: "Phone Icon Circle", cx: W * 0.08, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Phone", x: W * 0.04, y: textY, w: colW * 0.85,
      text: contacts.phone, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-phone"],
    }));
  }

  // Column divider 1
  layers.push(divider({
    name: "Col Div 1", x: colW, y: H * 0.64,
    length: H * 0.28, thickness: 1,
    color: t.divider ?? "#DDDDDD", alpha: 0.8,
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // Column 2: Email
  if (contacts.email) {
    layers.push(strokeEllipse({
      name: "Email Icon Circle", cx: colW + W * 0.04, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Email", x: colW + W * 0.02, y: textY, w: colW * 0.85,
      text: contacts.email, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-email"],
    }));
  }

  // Column divider 2
  layers.push(divider({
    name: "Col Div 2", x: colW * 2, y: H * 0.64,
    length: H * 0.28, thickness: 1,
    color: t.divider ?? "#DDDDDD", alpha: 0.8,
    direction: "vertical",
    tags: ["decorative", "divider"],
  }));

  // Column 3: Address
  if (contacts.address) {
    layers.push(strokeEllipse({
      name: "Address Icon Circle", cx: colW * 2 + W * 0.04, cy: iconY,
      rx: iconR, ry: iconR,
      color: t.accent ?? "#333333", width: 1,
    }));
    layers.push(styledText({
      name: "Address", x: colW * 2 + W * 0.02, y: textY, w: colW * 0.85,
      text: contacts.address, fontSize: contactFontSize,
      fontFamily: ff, weight: 400,
      color: t.contactText ?? "#333333",
      tags: ["contact-address"],
    }));
  }

  return layers;
}


// --- Template dispatcher ---

const LAYOUT_MAP: Record<string, LayoutFn> = {
  // Minimal
  "ultra-minimal":      layoutUltraMinimal,
  "monogram-luxe":      layoutMonogramLuxe,
  "geometric-mark":     layoutGeometricMark,
  "frame-minimal":      layoutFrameMinimal,
  "split-vertical":     layoutSplitVertical,
  "diagonal-mono":      layoutDiagonalMono,
  // Modern
  "cyan-tech":          layoutCyanTech,
  "corporate-chevron":  layoutCorporateChevron,
  "zigzag-overlay":     layoutZigzagOverlay,
  "hex-split":          layoutHexSplit,
  "dot-circle":         layoutDotCircle,
  "wave-gradient":      layoutWaveGradient,
  // Classic / Corporate
  "circle-brand":       layoutCircleBrand,
  "full-color-back":    layoutFullColorBack,
  "engineering-pro":    layoutEngineeringPro,
  "clean-accent":       layoutCleanAccent,
  "nature-clean":       layoutNatureClean,
  "diamond-brand":      layoutDiamondBrand,
  // Creative
  "flowing-lines":      layoutFlowingLines,
  "neon-watermark":     layoutNeonWatermark,
  "blueprint-tech":     layoutBlueprintTech,
  "skyline-silhouette": layoutSkylineSilhouette,
  "world-map":          layoutWorldMap,
  "diagonal-gold":      layoutDiagonalGold,
  // Luxury
  "luxury-divider":     layoutLuxuryDivider,
  "social-band":        layoutSocialBand,
  "organic-pattern":    layoutOrganicPattern,
  "celtic-stripe":      layoutCelticStripe,
  "premium-crest":      layoutPremiumCrest,
  "gold-construct":     layoutGoldConstruct,
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
    cfg.textColor, 0.6, cfg.primaryColor, 0.4, fs.contact, ff, W, H
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
    const layoutFn = LAYOUT_MAP[cfg.template] || LAYOUT_MAP["ultra-minimal"];
    templateLayers = layoutFn(W, H, cfg, fs, ff);
  } else {
    // Check for template-specific back layout first (pixel-perfect versions)
    const templateBackFn = getBackLayout(cfg.template);
    const theme = TEMPLATE_FIXED_THEMES[cfg.template];
    if (templateBackFn && theme) {
      const contacts = extractContacts(cfg);
      templateLayers = templateBackFn(W, H, {
        name: cfg.name,
        company: cfg.company,
        title: cfg.title,
        tagline: cfg.tagline,
        contacts,
        logoUrl: cfg.logoUrl || undefined,
        fontFamily: ff,
        showContactIcons: cfg.showContactIcons,
        qrCodeUrl: cfg.qrCodeUrl || undefined,
      }, theme);
    } else {
      // Fall back to generic back layout
      const backFn = BACK_LAYOUT_MAP[cfg.backStyle] || BACK_LAYOUT_MAP["logo-center"];
      templateLayers = backFn(W, H, cfg, fs, ff);
    }
  }

  // ── Post-layout: Text collision check (safety net) ─────────────────────
  // Sort text layers by Y, push down any that overlap the previous text layer.
  {
    const textIdxs: number[] = [];
    for (let i = 0; i < templateLayers.length; i++) {
      if (templateLayers[i].type === "text") textIdxs.push(i);
    }
    // Sort indices by layer Y position
    textIdxs.sort((a, b) =>
      templateLayers[a].transform.position.y - templateLayers[b].transform.position.y
    );
    const GAP = 8;
    for (let k = 1; k < textIdxs.length; k++) {
      const prev = templateLayers[textIdxs[k - 1]];
      const curr = templateLayers[textIdxs[k]];
      const prevBottom = prev.transform.position.y + prev.transform.size.y;
      const currTop = curr.transform.position.y;
      if (prevBottom > currTop) {
        const shift = prevBottom - currTop + GAP;
        curr.transform = {
          ...curr.transform,
          position: { ...curr.transform.position, y: curr.transform.position.y + shift },
        };
      }
    }
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
    "contact-linkedin": cfg.linkedin || "",
    "contact-twitter": cfg.twitter || "",
    "contact-instagram": cfg.instagram || "",
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

    // ── QR code layer: darken on light backgrounds, lighten on dark backgrounds ──
    if (layer.tags.includes("qr-code") && layer.type === "shape") {
      const bgLum = (() => { const c = hexToRGBA(cfg.bgColor); return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; })();
      const qrColor = bgLum > 0.5 ? "#1a1a1a" : "#e0e0e0";
      updated = updateLayer(updated, layer.id, {
        fills: [solidPaintHex(qrColor, 0.12)],
      } as Partial<LayerV2>);
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
    if (layer.tags.includes("contact-linkedin")) result.linkedin = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-twitter")) result.twitter = (layer as TextLayerV2).text;
    if (layer.tags.includes("contact-instagram")) result.instagram = (layer as TextLayerV2).text;
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
