// =============================================================================
// DMSuite â€” Business Card Adapter
// Converts CardConfig â†’ DesignDocumentV2 with fully semantic, AI-targetable
// layers. Every text, icon, logo, shape, and decorative element becomes a
// separate layer with tags for AI revision.
//
// This is the M2 reference implementation for workspaceâ†’vNext migration.
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

// ── Card Template Helpers (pixel-perfect infrastructure) ──
import {
  M, L, C, Q, Z,
  pathLayer, divider, filledRect, filledEllipse, strokeRect, strokeEllipse,
  styledText, linearGradient, multiStopGradient,
  TEMPLATE_FIXED_THEMES, type TemplateColorTheme,
  FONT_STACKS,
  cornerBracketPath, diagonalSplitPath, circlePath,
  registerBackLayout, getBackLayout, extractContacts, type ContactInfo,
  buildWatermarkLogo, contactWithIcons,
  makeStroke,
} from "./card-template-helpers";

// =============================================================================
// 1.  Re-exported Types (standalone â€” avoids circular deps with workspace)
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
  standard: { w: 1050, h: 600, label: "US Standard (3.5Ã—2\")", mmW: 89, mmH: 51 },
  eu:       { w: 1012, h: 638, label: "EU/ISO (85Ã—54mm)",       mmW: 85, mmH: 54 },
  jp:       { w: 1087, h: 661, label: "Japan (91Ã—55mm)",        mmW: 91, mmH: 55 },
  square:   { w: 750,  h: 750, label: "Square (2.5Ã—2.5\")",     mmW: 63, mmH: 63 },
  rounded:  { w: 1050, h: 600, label: "Rounded (3.5Ã—2\")",      mmW: 89, mmH: 51 },
};

export const FONT_FAMILIES: Record<string, string> = {
  modern:  "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
  classic: "'Georgia', 'Garamond', 'Times New Roman', serif",
  bold:    "'Montserrat', 'Arial Black', 'Impact', sans-serif",
  elegant: "'Playfair Display', 'Didot', 'Bodoni MT', serif",
  minimal: "'Helvetica Neue', 'Helvetica', Arial, sans-serif",
};

export const COLOR_PRESETS = [
  // â€” Core â€”
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
  // â€” Industry â€”
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
  // â€” Minimal â€”
  "ultra-minimal":      { primary: "#3a3a3a", secondary: "#9a9a9a", text: "#2a2a2a", bg: "#f8f8f8",  pattern: "none",  font: "minimal" },
  "monogram-luxe":      { primary: "#1a1a1a", secondary: "#666666", text: "#1a1a1a", bg: "#ededed",  pattern: "none",  font: "elegant" },
  "geometric-mark":     { primary: "#2d2d2d", secondary: "#888888", text: "#333333", bg: "#f5f5f5",  pattern: "none",  font: "modern"  },
  "frame-minimal":      { primary: "#e65100", secondary: "#888888", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "split-vertical":     { primary: "#333333", secondary: "#777777", text: "#333333", bg: "#f0f0f0",  pattern: "none",  font: "minimal" },
  "diagonal-mono":      { primary: "#1a1a1a", secondary: "#808080", text: "#1a1a1a", bg: "#f2f2f2",  pattern: "none",  font: "minimal" },
  // â€” Modern â€”
  "cyan-tech":          { primary: "#00bcd4", secondary: "#0097a7", text: "#ffffff", bg: "#37474f",  pattern: "none",  font: "modern"  },
  "corporate-chevron":  { primary: "#1e3a5f", secondary: "#3a6ea5", text: "#ffffff", bg: "#1a2e4a",  pattern: "none",  font: "bold"    },
  "zigzag-overlay":     { primary: "#1a237e", secondary: "#3f51b5", text: "#ffffff", bg: "#1a2040",  pattern: "none",  font: "bold"    },
  "hex-split":          { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#f5f7fa",  pattern: "none",  font: "modern"  },
  "dot-circle":         { primary: "#333333", secondary: "#888888", text: "#333333", bg: "#fafafa",  pattern: "dots",  font: "bold"    },
  "wave-gradient":      { primary: "#5e35b1", secondary: "#e8a735", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  // â€” Classic / Corporate â€”
  "circle-brand":       { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "full-color-back":    { primary: "#1565c0", secondary: "#42a5f5", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "classic" },
  "engineering-pro":    { primary: "#0288d1", secondary: "#29b6f6", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "bold"    },
  "clean-accent":       { primary: "#e65100", secondary: "#ff8a50", text: "#333333", bg: "#ffffff",  pattern: "lines", font: "modern"  },
  "nature-clean":       { primary: "#689f63", secondary: "#8bc34a", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "modern"  },
  "diamond-brand":      { primary: "#1565c0", secondary: "#e65100", text: "#333333", bg: "#ffffff",  pattern: "none",  font: "bold"    },
  // â€” Creative â€”
  "flowing-lines":      { primary: "#2e7d32", secondary: "#66bb6a", text: "#ffffff", bg: "#1b4332",  pattern: "none",  font: "modern"  },
  "neon-watermark":     { primary: "#c6ff00", secondary: "#76ff03", text: "#e0e0e0", bg: "#0d0d0d",  pattern: "none",  font: "modern"  },
  "blueprint-tech":     { primary: "#e65100", secondary: "#757575", text: "#333333", bg: "#eeeeee",  pattern: "lines", font: "modern"  },
  "skyline-silhouette": { primary: "#333333", secondary: "#757575", text: "#333333", bg: "#f5f5f0",  pattern: "none",  font: "bold"    },
  "world-map":          { primary: "#555555", secondary: "#999999", text: "#e0e0e0", bg: "#2a2a2a",  pattern: "none",  font: "modern"  },
  "diagonal-gold":      { primary: "#c5a54e", secondary: "#1b4b6b", text: "#ffffff", bg: "#0d3b56",  pattern: "none",  font: "modern"  },
  // â€” Luxury â€”
  "luxury-divider":     { primary: "#c5a54e", secondary: "#1a5c4f", text: "#ffffff", bg: "#0a3a30",  pattern: "none",  font: "elegant" },
  "social-band":        { primary: "#4a5240", secondary: "#9a9580", text: "#dddacf", bg: "#3d4435",  pattern: "none",  font: "elegant" },
  "organic-pattern":    { primary: "#8a9a6c", secondary: "#bcc9a0", text: "#ffffff", bg: "#3a4a2f",  pattern: "none",  font: "modern"  },
  "celtic-stripe":      { primary: "#1a1a1a", secondary: "#666666", text: "#1a1a1a", bg: "#ffffff",  pattern: "none",  font: "classic" },
  "premium-crest":      { primary: "#c5a54e", secondary: "#1a5c4f", text: "#ffffff", bg: "#0f4a3c",  pattern: "none",  font: "elegant" },
  "gold-construct":     { primary: "#c5a54e", secondary: "#8a7030", text: "#ffffff", bg: "#0a3530",  pattern: "none",  font: "modern"  },
};

export const TEMPLATE_LIST = [
  // â€” Minimal (6) â€”
  { id: "ultra-minimal",      label: "Ultra Minimal",      category: "minimal" },
  { id: "monogram-luxe",      label: "Monogram",           category: "minimal" },
  { id: "geometric-mark",     label: "Geometric Mark",     category: "minimal" },
  { id: "frame-minimal",      label: "Frame Minimal",      category: "minimal" },
  { id: "split-vertical",     label: "Split Vertical",     category: "minimal" },
  { id: "diagonal-mono",      label: "Diagonal Mono",      category: "minimal" },
  // â€” Modern (6) â€”
  { id: "cyan-tech",          label: "Cyan Tech",          category: "modern" },
  { id: "corporate-chevron",  label: "Corporate Chevron",  category: "modern" },
  { id: "zigzag-overlay",     label: "Zigzag Overlay",     category: "modern" },
  { id: "hex-split",          label: "Hex Split",          category: "modern" },
  { id: "dot-circle",         label: "Dot Circle",         category: "modern" },
  { id: "wave-gradient",      label: "Wave Gradient",      category: "modern" },
  // â€” Classic / Corporate (6) â€”
  { id: "circle-brand",       label: "Circle Brand",       category: "classic" },
  { id: "full-color-back",    label: "Full Color Back",    category: "classic" },
  { id: "engineering-pro",    label: "Engineering Pro",     category: "classic" },
  { id: "clean-accent",       label: "Clean Accent",       category: "classic" },
  { id: "nature-clean",       label: "Nature Clean",       category: "classic" },
  { id: "diamond-brand",      label: "Diamond Brand",      category: "classic" },
  // â€” Creative (6) â€”
  { id: "flowing-lines",      label: "Flowing Lines",      category: "creative" },
  { id: "neon-watermark",     label: "Neon Watermark",     category: "creative" },
  { id: "blueprint-tech",     label: "Blueprint Tech",     category: "creative" },
  { id: "skyline-silhouette", label: "Skyline",            category: "creative" },
  { id: "world-map",          label: "World Map",          category: "creative" },
  { id: "diagonal-gold",      label: "Diagonal Gold",      category: "creative" },
  // â€” Luxury (6) â€”
  { id: "luxury-divider",     label: "Luxury Divider",     category: "luxury" },
  { id: "social-band",        label: "Social Band",        category: "luxury" },
  { id: "organic-pattern",    label: "Organic Pattern",    category: "luxury" },
  { id: "celtic-stripe",      label: "Celtic Stripe",      category: "luxury" },
  { id: "premium-crest",      label: "Premium Crest",      category: "luxury" },
  { id: "gold-construct",     label: "Gold Construct",     category: "luxury" },
];

// Contact icon IDs: phoneâ†’"phone", emailâ†’"email", websiteâ†’"globe", addressâ†’"map-pin"

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
  // Average character width â‰ˆ 0.55 Ã— fontSize for sans-serif, 0.50 for serif
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
  /** Card height â€” used for overflow prevention via fitContactBlock */
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
        // center â€” icon left of center text
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
 * Template #1 — Ultra Minimal (M.U.N reference)
 * FRONT: Off-white #f8f9fa bg, centered tiny accent line + brand initials only.
 * Zero decoration — the emptiness IS the design.
 */
function layoutUltraMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["ultra-minimal"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: very light gray / off-white
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Accent line: thin horizontal, centered, 44% down, 4% card width
  const lineW = Math.round(W * 0.04);
  const lineY = Math.round(H * 0.44);
  layers.push(filledRect({
    name: "Accent Line", x: Math.round((W - lineW) / 2), y: lineY, w: lineW, h: 1,
    fill: solidPaintHex(t.frontText), tags: ["decorative", "accent"],
  }));

  // Brand initials: ≤4 chars = full name, else initials
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
    color: t.frontText,
    align: "center",
    uppercase: true,
    letterSpacing: 7, // ~0.15em
    tags: ["company", "branding", "primary-text"],
  }));

  return layers;
}

// Register ultra-minimal back layout
registerBackLayout("ultra-minimal", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: pure white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#ffffff"), tags: ["background", "back-element"],
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
    tags: ["name", "primary-text", "back-element"],
  }));
  y += nameSize + Math.round(H * 0.015);

  // Tier 5: Divider line
  layers.push(filledRect({
    name: "Back Divider",
    x: contentLeft, y, w: Math.round(W * 0.08), h: 1,
    fill: solidPaintHex("#e0e0e0"), tags: ["decorative", "divider", "back-element"],
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
    tags: ["title", "back-element"],
  }));
  y += titleSize + Math.round(H * 0.03);

  // Tier 3: Contact lines (light weight, light gray #8a8a8a)
  const contactSize = Math.round(H * 0.02); // 12px
  const contactLineH = Math.round(contactSize * 1.6);
  const contactLines = [cfg.contacts.phone, cfg.contacts.email, cfg.contacts.website, cfg.contacts.address].filter(Boolean);
  for (const line of contactLines) {
    layers.push(styledText({
      name: `Contact`,
      x: contentLeft, y, w: Math.round(W * 0.40),
      text: line!,
      fontSize: contactSize,
      fontFamily: font,
      weight: 300,
      color: "#8a8a8a",
      tags: ["contact-text", "back-element"],
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
});

/**
 * Template #2 — Monogram Luxe (Samira Hadid reference)
 * FRONT: Warm lavender-gray #eae8eb bg, massive Didone serif monogram LEFT,
 * name/title/contact RIGHT starting at 48%.
 */
function layoutMonogramLuxe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["monogram-luxe"];
  const sansFont = FONT_STACKS.geometric;
  const serifFont = FONT_STACKS.serif; // Didone/Modern serif for monogram
  const layers: LayerV2[] = [];

  // Background: warm lavender-gray
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Massive monogram letter — first letter of person's name
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

  // Name — semibold, dark
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

  // Title — light, mid-gray
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

  // Contact lines — light, light gray
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
  const sansFont = FONT_STACKS.geometric;
  const serifFont = FONT_STACKS.serif;
  const layers: LayerV2[] = [];

  // Background: dark charcoal (inverted from front)
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg), // #2c2c2c
    tags: ["background", "back-element"],
  }));

  // Centered monogram — same initial, lighter color, slightly smaller
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
      letterSpacing: 8, // ~0.25em — very wide
      tags: ["name", "back-element"],
    }));
    nameY += nameSize + Math.round(H * 0.01);
  }

  return layers;
});

/**
 * Template #3 — Geometric Mark (Rob Simax / AV reference)
 * FRONT: Dark horizontal gradient bg, centered interlocking AV monogram
 * with 45° white hatching. NO text on front.
 * Note: The hatching effect is approximated with diagonal line paths since
 * we can't do true Canvas2D clipping in the layer system.
 */
function layoutGeometricMark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["geometric-mark"];
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
    tags: ["background"],
  }));

  // Interlocking monogram — build as a compound path representing the
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
    tags: ["decorative", "monogram", "branding"],
    opacity: 0.85,
  }));
  layers.push(pathLayer({
    name: "Monogram Band B",
    commands: bandB,
    fill: solidPaintHex("#ffffff", 0.85),
    tags: ["decorative", "monogram", "branding"],
    opacity: 0.85,
  }));

  // Hatching lines overlay (45° diagonal pattern across monogram area)
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
      tags: ["decorative", "hatching", "monogram"],
      opacity: 0.4,
    }));
  }

  return layers;
}

// Register geometric-mark back layout
registerBackLayout("geometric-mark", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: cool pale white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#f8f9fb"), tags: ["background", "back-element"],
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
    Z(),
  ];
  const wmBandB: import("./schema").PathCommand[] = [
    M(wmCx + wmW * 0.05, wmCy - wmH * 0.50),
    L(wmCx + wmW * 0.50, wmCy + wmH * 0.50),
    L(wmCx + wmW * 0.30, wmCy + wmH * 0.50),
    L(wmCx - wmW * 0.05, wmCy - wmH * 0.20),
    L(wmCx - wmW * 0.15, wmCy - wmH * 0.50),
    Z(),
  ];

  layers.push(pathLayer({
    name: "Watermark Band A",
    commands: wmBandA,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark", "back-element"],
    opacity: 0.25,
  }));
  layers.push(pathLayer({
    name: "Watermark Band B",
    commands: wmBandB,
    fill: solidPaintHex("#b8b8ba", 0.25),
    tags: ["decorative", "watermark", "back-element"],
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
    tags: ["name", "primary-text", "back-element"],
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
    tags: ["title", "back-element"],
  }));

  // Address (light, medium gray, bottom-left)
  const contactSize = Math.round(H * 0.020);
  layers.push(styledText({
    name: "Address",
    x: Math.round(W * 0.090), y: Math.round(H * 0.772), w: Math.round(W * 0.55),
    text: (cfg.contacts.address || "BOULEVARD 01234").toUpperCase(),
    fontSize: contactSize,
    fontFamily: font,
    weight: 300,
    color: "#8a8b8d",
    uppercase: true,
    letterSpacing: 2,
    tags: ["contact-address", "back-element"],
  }));

  // Contact line 1: phone (right-aligned)
  if (cfg.contacts.phone) {
    layers.push(styledText({
      name: "Phone",
      x: Math.round(W * 0.09), y: Math.round(H * 0.825), w: Math.round(W * 0.64),
      text: cfg.contacts.phone,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#939495",
      align: "right",
      tags: ["contact-phone", "back-element"],
    }));
  }

  // Contact line 2: email + website
  if (cfg.contacts.email) {
    layers.push(styledText({
      name: "Email",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.35),
      text: cfg.contacts.email,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      tags: ["contact-email", "back-element"],
    }));
  }
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website",
      x: Math.round(W * 0.09), y: Math.round(H * 0.878), w: Math.round(W * 0.67),
      text: cfg.contacts.website,
      fontSize: contactSize,
      fontFamily: font,
      weight: 400,
      color: "#7c7d7f",
      align: "right",
      tags: ["contact-website", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #4 — Frame Minimal (Adika Saputra reference)
 * FRONT: Pure white bg, 2 diagonal L-brackets (TL + BR only),
 * 5-level gray text hierarchy, color-coded contact dots, QR code.
 */
function layoutFrameMinimal(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["frame-minimal"];
  const font = FONT_STACKS.geometric;
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

  // Name — semibold, dark
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

  // Title — light, mid-gray, Title Case
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
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: near-black
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#1A1A1A"), tags: ["background", "back-element"],
  }));

  // Closed rectangular frame (58% W × 30% H, centered)
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

  // "MINIMAL" text — bold, extremely wide tracking
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

  // Subtitle — light, muted
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
 * Template #5 — Split Vertical (Pathetic Studio reference)
 * FRONT: Diagonal trapezoid split (58% top → 38% bottom), dark left + warm
 * off-white right. 5 geometric logo bars, company name, tagline — ALL on dark.
 * Light zone is EMPTY.
 */
function layoutSplitVertical(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["split-vertical"];
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white #F5F5F0
  layers.push(filledRect({
    name: "Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(t.frontBg), tags: ["background"],
  }));

  // Dark diagonal trapezoid: (0,0) → (58%W, 0) → (38%W, H) → (0, H)
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
    tags: ["decorative", "accent", "panel"],
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
      tags: ["decorative", "logo-mark", "branding"],
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
    tags: ["company", "branding", "primary-text"],
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
    tags: ["tagline"],
  }));

  return layers;
}

// Register split-vertical back layout
registerBackLayout("split-vertical", (W, H, cfg, theme) => {
  const font = FONT_STACKS.geometric;
  const layers: LayerV2[] = [];

  // Background: warm off-white
  layers.push(filledRect({
    name: "Back Background", x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex("#F5F5F0"), tags: ["background", "back-element"],
  }));

  // Dark trapezoid mirrored: (42%W, 0) → (W, 0) → (W, H) → (62%W, H)
  layers.push(pathLayer({
    name: "Back Dark Trapezoid",
    commands: [
      M(Math.round(W * 0.42), 0),
      L(W, 0),
      L(W, H),
      L(Math.round(W * 0.62), H),
      Z(),
    ],
    fill: solidPaintHex("#2C2C2C"),
    tags: ["decorative", "accent", "panel", "back-element"],
  }));

  // Contact details in light zone (left side)
  const iconR = Math.round(H * 0.0175);
  const iconCX = Math.round(W * 0.08);
  const contactTextX = Math.round(W * 0.14);
  const contactSize = Math.round(H * 0.025); // 15px
  const contactFields = [
    cfg.contacts.address || "Your Address",
    cfg.contacts.phone || "+012 345 678",
    cfg.contacts.email || "email@mail.com",
    cfg.contacts.website || "www.website.com",
  ];
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
      tags: ["contact-icon", "back-element"],
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
      tags: ["contact-text", "back-element"],
    }));
  }

  // Separator line
  layers.push(filledRect({
    name: "Separator",
    x: Math.round(W * 0.08), y: Math.round(H * 0.63),
    w: Math.round(W * 0.25), h: 1,
    fill: solidPaintHex("#CCCCCC", 0.6),
    tags: ["decorative", "divider", "back-element"],
  }));

  // Name (bold, dark — ties visually to dark zone)
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
    tags: ["name", "primary-text", "back-element"],
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
    tags: ["title", "back-element"],
  }));

  // Social icons on dark zone (right side) — white circle outlines
  const socialX = Math.round(W * 0.85);
  const socialR = Math.round(H * 0.018);
  const socialYs = [0.25, 0.33, 0.41, 0.49, 0.57];

  for (let i = 0; i < socialYs.length; i++) {
    layers.push(strokeEllipse({
      name: `Social Icon ${i + 1}`,
      cx: socialX, cy: Math.round(H * socialYs[i]),
      rx: socialR, ry: socialR,
      color: "#FFFFFF", width: 1,
      tags: ["decorative", "social-icon", "back-element"],
    }));
  }

  return layers;
});

/**
 * Template #6 — Diagonal Mono (Henry Soaz reference)
 * FRONT: Multi-angle 7-segment zigzag polygon dividing charcoal and warm off-white,
 * white accent triangle on Segment 1, large rotated decorative name on light side,
 * name + title in chevron notch on dark side, contact info on light side.
 */
function layoutDiagonalMono(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const t = TEMPLATE_FIXED_THEMES["diagonal-mono"];
  const font = FONT_STACKS.geometric;
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

  // Large rotated decorative name on light side (~32° CW)
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
  // Apply rotation transform: ~32° clockwise
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
  const font = FONT_STACKS.geometric;
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

/** Cyan Tech â€” Inspired by Code Pro: Dark bg + colored accent right panel with circular contact icons */
function layoutCyanTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.14;
  const layers: LayerV2[] = [];
  const panelW = W * 0.38;
  const panelX = W - panelW;

  // Accent panel (right side with subtle gradient)
  layers.push(rect({
    name: "Accent Panel", x: panelX, y: 0, w: panelW, h: H,
    fill: lg(180, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent", "panel"],
  }));
  // Curved cutout overlay (simulate wave cut between panel and main)
  layers.push(ellipse({
    name: "Panel Curve", cx: panelX, cy: H * 0.45, rx: W * 0.04, ry: H * 0.35,
    fill: solidPaintHex(cfg.bgColor, 1), tags: ["decorative"],
  }));
  // Logo â€” top left
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Company + tagline under logo
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: my, w: W * 0.35,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 700,
    color: cfg.textColor, tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx + logoS + 10, y: my + fs.company + 2, w: W * 0.35,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, tags: ["tagline"], italic: true,
    }));
  }
  // Website on main side
  if (cfg.website) {
    layers.push(textLayer({
      name: "website", x: mx, y: H - my, w: W * 0.4,
      text: cfg.website, fontSize: fs.label, ff, weight: 400,
      color: cfg.textColor, alpha: 0.5, tags: ["contact-website", "contact-text"],
    }));
  }
  // Right panel content
  const panelTextColor = getContrastColor(cfg.primaryColor);
  // Name â€” on panel
  layers.push(textLayer({
    name: "Name", x: panelX + panelW * 0.12, y: my, w: panelW * 0.8,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: panelTextColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: panelX + panelW * 0.12, y: my + fs.name + 4, w: panelW * 0.8,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: panelTextColor, alpha: 0.7, tags: ["title"],
  }));
  // Contact on panel
  layers.push(...buildContactLayers(cfg, panelX + panelW * 0.12, my + fs.name + fs.label + 20, Math.round(fs.contact * 1.5), "left", panelTextColor, 0.8, panelTextColor, 0.6, fs.contact, ff, W, H));
  return layers;
}

/** Corporate Chevron â€” Inspired by Company Navy: Dark bg + chevron geometric overlay */
function layoutCorporateChevron(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Chevron decorative shapes (top-right corner)
  layers.push(rect({
    name: "Chevron 1", x: W * 0.6, y: -H * 0.1, w: W * 0.35, h: W * 0.35,
    fill: solidPaintHex(cfg.primaryColor, 0.08), tags: ["decorative", "accent"],
  }));
  layers.push(rect({
    name: "Chevron 2", x: W * 0.68, y: -H * 0.02, w: W * 0.28, h: W * 0.28,
    fill: solidPaintHex(cfg.primaryColor, 0.06), tags: ["decorative", "accent"],
  }));
  // Logo â€” centered
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, (W - logoS) / 2, my, logoS, logoS, cfg.primaryColor, ff));
  // Company name + tagline centered below logo
  layers.push(textLayer({
    name: "Company", x: 0, y: my + logoS + 10, w: W,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.textColor, align: "center", tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: 0, y: my + logoS + 10 + fs.companyLg + 4, w: W,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.45, align: "center", tags: ["tagline"],
    }));
  }
  // Website centered
  if (cfg.website) {
    layers.push(textLayer({
      name: "website", x: 0, y: H - my, w: W,
      text: cfg.website, fontSize: fs.label, ff, weight: 400,
      color: cfg.primaryColor, align: "center", tags: ["contact-website", "contact-text"],
    }));
  }
  return layers;
}

/** Zigzag Overlay â€” Inspired by Dwayne John: Dark bg + zigzag pattern + white content strip */
function layoutZigzagOverlay(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const layers: LayerV2[] = [];
  const stripH = H * 0.38;
  const stripY = H - stripH;

  // Logo â€” centered in dark area
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, (W - logoS) / 2, H * 0.12, logoS, logoS, cfg.primaryColor, ff));
  // Company below logo
  layers.push(textLayer({
    name: "Company", x: 0, y: H * 0.12 + logoS + 8, w: W,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.4, align: "center", tags: ["company"], uppercase: true, letterSpacing: 3,
  }));
  // White strip at bottom
  layers.push(rect({
    name: "Content Strip", x: 0, y: stripY, w: W, h: stripH,
    fill: solidPaintHex("#ffffff", 1), tags: ["decorative", "panel"],
  }));
  // Name on strip â€” dark text
  layers.push(textLayer({
    name: "Name", x: mx, y: stripY + stripH * 0.12, w: W * 0.5,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: "#1a1a1a", tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: stripY + stripH * 0.12 + fs.name + 2, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"], uppercase: true, letterSpacing: 1,
  }));
  // Contact on right of strip (2-column)
  layers.push(...buildContactLayers(cfg, W * 0.5, stripY + stripH * 0.15, Math.round(fs.contact * 1.45), "left", "#333333", 0.7, cfg.primaryColor, 0.6, fs.contact, ff, W, stripY + stripH));
  return layers;
}

/** Hex Split â€” Inspired by John Smith Blue: Two-tone split with hexagonal logo area + QR */
function layoutHexSplit(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.12;
  const layers: LayerV2[] = [];

  // Top accent wave/bar
  layers.push(rect({
    name: "Top Accent", x: 0, y: 0, w: W, h: H * 0.08,
    fill: lg(90, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
  }));
  // QR area â€” top left
  if (cfg.qrCodeUrl) {
    layers.push(rect({
      name: "QR Background", x: mx, y: H * 0.12, w: H * 0.22, h: H * 0.22,
      fill: solidPaintHex(cfg.primaryColor, 0.06), tags: ["qr-code", "branding"],
      radii: [4, 4, 4, 4],
    }));
  }
  // Name â€” top right
  layers.push(textLayer({
    name: "Name", x: W * 0.4, y: my + 8, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.primaryColor, align: "right", tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: W * 0.4, y: my + 8 + fs.name + 2, w: W * 0.55,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.secondaryColor, align: "right", tags: ["title"],
  }));
  // Divider
  layers.push(line({ name: "Divider", x: mx, y: H * 0.52, w: W - 2 * mx, color: cfg.primaryColor, alpha: 0.15 }));
  // Contact â€” bottom left
  layers.push(...buildContactLayers(cfg, mx, H * 0.58, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Logo + Company â€” bottom right
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H - my - logoS, logoS, logoS, cfg.primaryColor, ff));
  layers.push(textLayer({
    name: "Company", x: W * 0.45, y: H - my - 4, w: W * 0.45,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.5, align: "right", tags: ["company"],
  }));
  return layers;
}

/** Dot Circle â€” Inspired by El Creatives: Dot grid + large dark circle accent */
function layoutDotCircle(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Large circle accent (bottom-right, partially off-card)
  const circleR = H * 0.42;
  layers.push(ellipse({
    name: "Circle Accent", cx: W * 0.85, cy: H * 0.7, rx: circleR, ry: circleR,
    fill: solidPaintHex(cfg.primaryColor, 0.9), tags: ["decorative", "accent"],
  }));
  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: my, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: my + fs.name + 4, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Logo inside circle
  const logoS = H * 0.18;
  const panelText = getContrastColor(cfg.primaryColor);
  layers.push(buildLogoLayer(cfg, W * 0.85 - logoS / 2, H * 0.55, logoS, logoS, panelText, ff));
  // Company inside circle
  layers.push(textLayer({
    name: "Company", x: W * 0.65, y: H * 0.78, w: W * 0.3,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: panelText, alpha: 0.8, align: "center", tags: ["company"], uppercase: true, letterSpacing: 2,
  }));
  // Contact â€” left side, below name
  layers.push(...buildContactLayers(cfg, mx, my + fs.name + fs.title + 22, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Wave Gradient â€” Inspired by MTAC: Organic wave shape divider with gradient accent */
function layoutWaveGradient(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Bottom wave/gradient band
  layers.push(rect({
    name: "Gradient Band", x: 0, y: H * 0.6, w: W, h: H * 0.4,
    fill: lg(135, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
    radii: [W * 0.04, 0, 0, 0],
  }));
  // Logo â€” top left
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Company next to logo
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: my + 2, w: W * 0.4,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 700,
    color: cfg.textColor, tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx + logoS + 10, y: my + fs.company + 4, w: W * 0.4,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, tags: ["tagline"],
    }));
  }
  // Name â€” on gradient band
  const bandText = getContrastColor(cfg.primaryColor);
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.65, w: W * 0.6,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: bandText, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.65 + fs.name + 2, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: bandText, alpha: 0.7, tags: ["title"],
  }));
  // Contact â€” right side on band
  layers.push(...buildContactLayers(cfg, W * 0.55, H * 0.66, Math.round(fs.contact * 1.5), "left", bandText, 0.8, bandText, 0.6, fs.contact, ff, W, H));
  return layers;
}

// ===================== CLASSIC / CORPORATE TEMPLATES =====================

/** Circle Brand â€” Inspired by Close Financial: Clean white front + accent circle pattern */
function layoutCircleBrand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Logo + Company top-left
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: my + 4, w: W * 0.4,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.primaryColor, tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx + logoS + 10, y: my + fs.companyLg + 8, w: W * 0.4,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, tags: ["tagline"],
    }));
  }
  // Divider
  layers.push(line({ name: "Divider", x: mx, y: H * 0.48, w: W - 2 * mx, color: cfg.primaryColor, alpha: 0.12 }));
  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.53, w: W * 0.5,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.53 + fs.name + 2, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Contact â€” right side
  layers.push(...buildContactLayers(cfg, W * 0.55, H * 0.55, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Full Color Back â€” Inspired by Gordon Law: White front + accents, full-color back */
function layoutFullColorBack(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Accent bar left
  layers.push(rect({
    name: "Side Accent", x: 0, y: 0, w: 5, h: H,
    fill: solidPaintHex(cfg.primaryColor, 1), tags: ["decorative", "accent"],
  }));
  // Name â€” top left
  layers.push(textLayer({
    name: "Name", x: mx + 8, y: my, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx + 8, y: my + fs.name + 4, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.textColor, alpha: 0.55, tags: ["title"],
  }));
  // Company
  layers.push(textLayer({
    name: "Company", x: mx + 8, y: my + fs.name + fs.title + 12, w: W * 0.5,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 500,
    color: cfg.textColor, alpha: 0.4, tags: ["company"],
  }));
  // Contact â€” left, stacked
  layers.push(...buildContactLayers(cfg, mx + 8, H * 0.56, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Logo â€” right
  const logoS = H * 0.22;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, my, logoS, logoS, cfg.primaryColor, ff));
  return layers;
}

/** Engineering Pro â€” Inspired by Holdfast Engineering: Professional with color accents + full back */
function layoutEngineeringPro(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Logo + Company horizontal â€” top
  const logoS = H * 0.16;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 8, y: my + 2, w: W * 0.5,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.primaryColor, tags: ["company"], autoFit: true,
  }));
  // Separator
  layers.push(line({ name: "Separator", x: mx, y: my + logoS + 14, w: W - 2 * mx, color: cfg.primaryColor, alpha: 0.15 }));
  // Name â€” below sep
  layers.push(textLayer({
    name: "Name", x: mx, y: my + logoS + 22, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: my + logoS + 22 + fs.name + 2, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Contact â€” 2-column style
  const contactY = my + logoS + 22 + fs.name + fs.label + 14;
  layers.push(...buildContactLayers(cfg, mx, contactY, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.55, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Clean Accent â€” Inspired by Real Estate Corp: White + accent color elements + line pattern */
function layoutCleanAccent(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.14;
  const layers: LayerV2[] = [];

  // Bottom accent bar with gradient
  layers.push(rect({
    name: "Bottom Bar", x: 0, y: H - H * 0.06, w: W, h: H * 0.06,
    fill: lg(90, [cfg.primaryColor, 0], [cfg.secondaryColor, 1]),
    tags: ["decorative", "accent"],
  }));
  // Logo â€” top left
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Name â€” right of logo
  layers.push(textLayer({
    name: "Name", x: mx + logoS + 14, y: my + 2, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx + logoS + 14, y: my + fs.name + 6, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Separator
  layers.push(line({ name: "Sep", x: mx, y: H * 0.48, w: W - 2 * mx, color: cfg.textColor, alpha: 0.1 }));
  // Contact â€” left
  layers.push(...buildContactLayers(cfg, mx, H * 0.54, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Company â€” bottom right (above accent bar)
  layers.push(textLayer({
    name: "Company", x: mx, y: H - H * 0.06 - fs.label - 10, w: W - 2 * mx,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.35, align: "right", tags: ["company"], uppercase: true, letterSpacing: 2,
  }));
  return layers;
}

/** Nature Clean â€” Inspired by Bluebat: White front + QR accent, solid color back */
function layoutNatureClean(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Name band â€” primary colored bar behind name
  const bandH = fs.name + 14;
  layers.push(rect({
    name: "Name Band", x: 0, y: H * 0.55, w: W * 0.52, h: bandH,
    fill: solidPaintHex(cfg.primaryColor, 1), tags: ["decorative", "accent"],
  }));
  const bandText = getContrastColor(cfg.primaryColor);
  // Name â€” on band
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.55 + 6, w: W * 0.45,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: bandText, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title below band
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.55 + bandH + 6, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Contact â€” top right
  layers.push(...buildContactLayers(cfg, W * 0.55, my, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Logo + Company â€” top right
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, H * 0.55 + 4, logoS, logoS, cfg.primaryColor, ff));
  layers.push(textLayer({
    name: "Company", x: W - mx - logoS - W * 0.2, y: H * 0.55 + logoS / 2 - fs.label / 2 + 4, w: W * 0.2,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 700,
    color: cfg.primaryColor, align: "right", tags: ["company"], autoFit: true,
  }));
  return layers;
}

/** Diamond Brand â€” Inspired by Web Gurus: White front + diamond pattern accents */
function layoutDiamondBrand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Logo left
  const logoS = H * 0.22;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Company right of logo
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: my + 4, w: W * 0.4,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.primaryColor, tags: ["company"], autoFit: true,
  }));
  // Name â€” middle
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.45, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.45 + fs.name + 4, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.secondaryColor, tags: ["title"],
  }));
  // Contact â€” multi column
  layers.push(...buildContactLayers(cfg, mx, H * 0.45 + fs.name + fs.title + 16, Math.round(fs.contact * 1.45), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Social media highlight
  const socialY = H - my;
  if (cfg.website) {
    layers.push(textLayer({
      name: "website", x: mx, y: socialY, w: W - 2 * mx,
      text: cfg.website, fontSize: fs.label, ff, weight: 400,
      color: cfg.secondaryColor, alpha: 0.7, tags: ["contact-website", "contact-text"],
    }));
  }
  return layers;
}

// ===================== CREATIVE TEMPLATES =====================

/** Flowing Lines â€” Inspired by Curve Studio: Concentric flowing line patterns on dark bg */
function layoutFlowingLines(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Decorative curve lines (simplified as concentric ellipses)
  for (let i = 0; i < 5; i++) {
    layers.push(ellipse({
      name: `Curve ${i + 1}`, cx: W * 0.15, cy: H * 0.3, rx: W * (0.12 + i * 0.05), ry: H * (0.18 + i * 0.06),
      fill: solidPaintHex(cfg.primaryColor, 0), tags: ["decorative", "accent"],
      opacity: 0.15 - i * 0.02,
    }));
  }
  // Company + Tagline â€” right side
  layers.push(textLayer({
    name: "Company", x: W * 0.48, y: my, w: W * 0.45,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.textColor, align: "right", tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: W * 0.48, y: my + fs.companyLg + 4, w: W * 0.45,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, align: "right", tags: ["tagline"],
    }));
  }
  if (cfg.website) {
    layers.push(textLayer({
      name: "website", x: W * 0.48, y: my + fs.companyLg + (cfg.tagline ? fs.tagline + 8 : 0) + 8, w: W * 0.45,
      text: cfg.website, fontSize: fs.label, ff, weight: 400,
      color: cfg.primaryColor, align: "right", tags: ["contact-website", "contact-text"],
    }));
  }
  // Name â€” bottom left
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.58, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.58 + fs.name + 4, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Contact
  layers.push(...buildContactLayers(cfg, mx, H * 0.58 + fs.name + fs.title + 16, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Neon Watermark â€” Inspired by Global Insurance: Dark bg + large watermark logo */
function layoutNeonWatermark(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Large watermark circle
  layers.push(ellipse({
    name: "Watermark Circle", cx: W * 0.7, cy: H * 0.45, rx: H * 0.5, ry: H * 0.5,
    fill: solidPaintHex(cfg.primaryColor, 0.06), tags: ["decorative", "monogram"],
  }));
  // Logo â€” top left
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Company next to logo
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 10, y: my + 4, w: W * 0.4,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 700,
    color: cfg.primaryColor, tags: ["company"], autoFit: true,
  }));
  // Name
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.48, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true, italic: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.48 + fs.name + 2, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.5, tags: ["title"], uppercase: true, letterSpacing: 2,
  }));
  // Contact
  layers.push(...buildContactLayers(cfg, mx, H * 0.48 + fs.name + fs.label + 14, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Blueprint Tech â€” Inspired by Ahmad Atef: Technical blueprint bg pattern + accent QR */
function layoutBlueprintTech(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Top bar with logo + company
  layers.push(rect({
    name: "Top Bar", x: 0, y: 0, w: W, h: H * 0.28,
    fill: solidPaintHex(cfg.secondaryColor, 0.08), tags: ["decorative", "accent"],
  }));
  // Small accent square (QR bg)
  layers.push(rect({
    name: "QR Accent", x: W - mx - H * 0.2, y: my * 0.5, w: H * 0.2, h: H * 0.2,
    fill: solidPaintHex(cfg.primaryColor, 1), tags: ["decorative", "accent"],
    radii: [3, 3, 3, 3],
  }));
  // Company â€” top left
  layers.push(textLayer({
    name: "Company", x: mx, y: my * 0.6, w: W * 0.5,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.4, tags: ["company"], italic: true,
  }));
  // Name â€” below bar
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.35, w: W * 0.55,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.35 + fs.name + 2, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.55, tags: ["title"],
  }));
  // Contact
  layers.push(...buildContactLayers(cfg, mx, H * 0.35 + fs.name + fs.label + 14, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, mx, my * 0.5, logoS, logoS, cfg.primaryColor, ff));
  return layers;
}

/** Skyline Silhouette â€” Inspired by Real Estate: City skyline silhouette + clean layout */
function layoutSkylineSilhouette(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.14;
  const layers: LayerV2[] = [];

  // Skyline silhouette bar (simplified as stepped rectangles at bottom)
  const skyH = H * 0.25;
  const skyY = H - skyH;
  // Building shapes
  layers.push(rect({ name: "Building 1", x: 0, y: skyY + skyH * 0.4, w: W * 0.08, h: skyH * 0.6, fill: solidPaintHex(cfg.primaryColor, 0.15), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 2", x: W * 0.09, y: skyY + skyH * 0.2, w: W * 0.05, h: skyH * 0.8, fill: solidPaintHex(cfg.primaryColor, 0.12), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 3", x: W * 0.15, y: skyY, w: W * 0.06, h: skyH, fill: solidPaintHex(cfg.primaryColor, 0.18), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 4", x: W * 0.22, y: skyY + skyH * 0.3, w: W * 0.07, h: skyH * 0.7, fill: solidPaintHex(cfg.primaryColor, 0.13), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 5", x: W * 0.30, y: skyY + skyH * 0.1, w: W * 0.04, h: skyH * 0.9, fill: solidPaintHex(cfg.primaryColor, 0.16), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 6", x: W * 0.35, y: skyY + skyH * 0.35, w: W * 0.08, h: skyH * 0.65, fill: solidPaintHex(cfg.primaryColor, 0.11), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 7", x: W * 0.44, y: skyY + skyH * 0.15, w: W * 0.05, h: skyH * 0.85, fill: solidPaintHex(cfg.primaryColor, 0.14), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 8", x: W * 0.50, y: skyY + skyH * 0.45, w: W * 0.06, h: skyH * 0.55, fill: solidPaintHex(cfg.primaryColor, 0.10), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 9", x: W * 0.57, y: skyY + skyH * 0.2, w: W * 0.07, h: skyH * 0.8, fill: solidPaintHex(cfg.primaryColor, 0.15), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 10", x: W * 0.65, y: skyY + skyH * 0.05, w: W * 0.04, h: skyH * 0.95, fill: solidPaintHex(cfg.primaryColor, 0.17), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 11", x: W * 0.70, y: skyY + skyH * 0.3, w: W * 0.06, h: skyH * 0.7, fill: solidPaintHex(cfg.primaryColor, 0.12), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 12", x: W * 0.77, y: skyY + skyH * 0.15, w: W * 0.05, h: skyH * 0.85, fill: solidPaintHex(cfg.primaryColor, 0.14), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 13", x: W * 0.83, y: skyY + skyH * 0.4, w: W * 0.08, h: skyH * 0.6, fill: solidPaintHex(cfg.primaryColor, 0.11), tags: ["decorative", "skyline"] }));
  layers.push(rect({ name: "Building 14", x: W * 0.92, y: skyY + skyH * 0.25, w: W * 0.08, h: skyH * 0.75, fill: solidPaintHex(cfg.primaryColor, 0.13), tags: ["decorative", "skyline"] }));
  // Logo + Company â€” top
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  layers.push(textLayer({
    name: "Company", x: mx + logoS + 8, y: my + 2, w: W * 0.5,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.textColor, tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: mx + logoS + 8, y: my + fs.companyLg + 4, w: W * 0.5,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, tags: ["tagline"],
    }));
  }
  // Name + Contact â€” middle
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.42, w: W * 0.5,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.42 + fs.name + 2, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.5, tags: ["title"],
  }));
  layers.push(...buildContactLayers(cfg, W * 0.55, H * 0.42, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, skyY));
  return layers;
}

/** World Map â€” Inspired by Jonathan Doe: World map watermark + boxed contact layout */
function layoutWorldMap(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Map watermark (large subtle rectangle)
  layers.push(rect({
    name: "Map Watermark", x: W * 0.3, y: H * 0.05, w: W * 0.65, h: H * 0.6,
    fill: solidPaintHex(cfg.primaryColor, 0.04), tags: ["decorative", "monogram"],
    radii: [4, 4, 4, 4],
  }));
  // Name â€” top left, bold
  layers.push(textLayer({
    name: "Name", x: mx, y: my, w: W * 0.6,
    text: cfg.name || "Your Name", fontSize: fs.nameXl, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true, uppercase: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: my + fs.nameXl + 4, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.5, tags: ["title"], uppercase: true, letterSpacing: 2,
  }));
  // Boxed contact section at bottom
  layers.push(rect({
    name: "Contact Box", x: mx, y: H * 0.55, w: W - 2 * mx, h: H * 0.35,
    fill: solidPaintHex(cfg.primaryColor, 0.04), tags: ["decorative"],
    radii: [3, 3, 3, 3],
  }));
  layers.push(...buildContactLayers(cfg, mx + 12, H * 0.59, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.7, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Company â€” bottom right
  layers.push(textLayer({
    name: "Company", x: mx, y: H - my + 4, w: W - 2 * mx,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.3, align: "right", tags: ["company"], uppercase: true, letterSpacing: 3,
  }));
  // Logo
  const logoS = H * 0.14;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, my, logoS, logoS, cfg.primaryColor, ff));
  return layers;
}

/** Diagonal Gold â€” Inspired by Yes Assistant: Teal bg + diagonal gold accent bar */
function layoutDiagonalGold(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Diagonal gold stripe
  layers.push(rect({
    name: "Diagonal Stripe", x: W * 0.25, y: H * 0.35, w: W * 0.55, h: H * 0.08,
    fill: lg(15, [cfg.secondaryColor, 0], [cfg.primaryColor, 1]),
    tags: ["decorative", "accent"],
  }));
  // Logo â€” top left
  const logoS = H * 0.18;
  layers.push(buildLogoLayer(cfg, mx, my, logoS, logoS, cfg.primaryColor, ff));
  // Company top right
  layers.push(textLayer({
    name: "Company", x: W * 0.35, y: my, w: W * 0.55,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.5, align: "right", tags: ["company"], uppercase: true, letterSpacing: 2,
  }));
  if (cfg.website) {
    layers.push(textLayer({
      name: "website", x: W * 0.35, y: my + fs.label + 4, w: W * 0.55,
      text: cfg.website, fontSize: fs.label, ff, weight: 400,
      color: cfg.primaryColor, alpha: 0.6, align: "right", tags: ["contact-website", "contact-text"],
    }));
  }
  // Name â€” below stripe
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.52, w: W * 0.6,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.52 + fs.name + 2, w: W * 0.5,
    text: cfg.title || "Job Title", fontSize: fs.title, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"],
  }));
  // Contact
  layers.push(...buildContactLayers(cfg, mx, H * 0.52 + fs.name + fs.title + 14, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.7, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

// ===================== LUXURY TEMPLATES =====================

/** Luxury Divider â€” Inspired by Charles Jones: Dark teal + gold accents + vertical dividers */
function layoutLuxuryDivider(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.12;
  const layers: LayerV2[] = [];

  // Vertical gold dividers
  layers.push(rect({ name: "V-Divider 1", x: W * 0.5, y: my, w: 1.5, h: H - 2 * my, fill: solidPaintHex(cfg.primaryColor, 0.3), tags: ["decorative", "divider"] }));
  layers.push(rect({ name: "V-Divider 2", x: W * 0.75, y: my, w: 1.5, h: H - 2 * my, fill: solidPaintHex(cfg.primaryColor, 0.15), tags: ["decorative", "divider"] }));
  // Logo â€” top right
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, my, logoS, logoS, cfg.primaryColor, ff));
  // Company vertical text area (right of second divider)
  layers.push(textLayer({
    name: "Company", x: W * 0.76, y: my + logoS + 14, w: W * 0.16,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.5, tags: ["company"], uppercase: true, letterSpacing: 3,
  }));
  // Name â€” left side, large
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.4, w: W * 0.42,
    text: cfg.name || "Your Name", fontSize: fs.nameXl, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title â€” in primary/gold color
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.4 + fs.nameXl + 4, w: W * 0.4,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"], uppercase: true, letterSpacing: 2,
  }));
  // Contact â€” between dividers
  layers.push(...buildContactLayers(cfg, W * 0.52, H * 0.42, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  return layers;
}

/** Social Band â€” Inspired by Visionary Vogue: Dark bg + cream social media band */
function layoutSocialBand(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];
  const bandH = H * 0.2;
  const bandY = H - bandH;

  // Bottom band (lighter color)
  layers.push(rect({
    name: "Social Band", x: 0, y: bandY, w: W, h: bandH,
    fill: solidPaintHex(cfg.secondaryColor, 0.5), tags: ["decorative", "accent", "panel"],
  }));
  // Company â€” centered top
  layers.push(textLayer({
    name: "Company", x: 0, y: my, w: W,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 400,
    color: cfg.textColor, align: "center", tags: ["company"], uppercase: true, letterSpacing: 5,
  }));
  // Title centered
  layers.push(textLayer({
    name: "Title", x: 0, y: my + fs.companyLg + 6, w: W,
    text: cfg.title || "Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.5, align: "center", tags: ["title"], uppercase: true, letterSpacing: 3,
  }));
  // Divider
  layers.push(line({ name: "Divider", x: W * 0.35, y: my + fs.companyLg + fs.label + 18, w: W * 0.3, color: cfg.primaryColor, alpha: 0.3 }));
  // Name â€” centered middle
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.48, w: W,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, align: "center", tags: ["name", "primary-text"], autoFit: true,
  }));
  // Social / Contact on band
  const bandTextColor = getContrastColor(cfg.secondaryColor);
  layers.push(...buildContactLayers(cfg, W / 2, bandY + bandH * 0.2, Math.round(fs.contact * 1.4), "center", bandTextColor, 0.7, bandTextColor, 0.5, fs.contact, ff, W, H));
  // Logo
  const logoS = H * 0.12;
  layers.push(buildLogoLayer(cfg, (W - logoS) / 2, H * 0.48 + fs.name + 10, logoS, logoS, cfg.primaryColor, ff));
  return layers;
}

/** Organic Pattern â€” Inspired by Company Logo Green: Topographic/organic pattern bg */
function layoutOrganicPattern(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Subtle topographic lines (simplified as concentric rounded rects)
  for (let i = 0; i < 6; i++) {
    layers.push(rect({
      name: `Topo Line ${i + 1}`,
      x: W * (0.02 + i * 0.06), y: H * (0.05 + i * 0.04),
      w: W * (0.96 - i * 0.12), h: H * (0.9 - i * 0.08),
      fill: solidPaintHex(cfg.primaryColor, 0),
      stroke: stroke(cfg.primaryColor, 0.8, 0.06 + i * 0.01),
      tags: ["decorative", "pattern"],
      radii: [20 + i * 8, 20 + i * 8, 20 + i * 8, 20 + i * 8],
    }));
  }
  // Left panel for contact/name
  layers.push(rect({
    name: "Content Panel", x: 0, y: 0, w: W * 0.42, h: H,
    fill: solidPaintHex(cfg.bgColor, 0.85), tags: ["decorative", "panel"],
  }));
  // Name on panel
  layers.push(textLayer({
    name: "Name", x: mx, y: my, w: W * 0.32,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: mx, y: my + fs.name + 4, w: W * 0.3,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.textColor, alpha: 0.5, tags: ["title"],
  }));
  // Contact
  layers.push(...buildContactLayers(cfg, mx, my + fs.name + fs.label + 20, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Logo â€” right side
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, W * 0.6, (H - logoS) / 2, logoS, logoS, cfg.primaryColor, ff));
  // Company
  layers.push(textLayer({
    name: "Company", x: W * 0.5, y: H - my, w: W * 0.42,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.6, align: "right", tags: ["company"], uppercase: true, letterSpacing: 2,
  }));
  return layers;
}

/** Celtic Stripe â€” Inspired by Celtic Pattern: Ornamental pattern stripe on one side */
function layoutCelticStripe(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];
  const stripeW = W * 0.06;

  // Left ornamental stripe
  layers.push(rect({
    name: "Ornament Stripe", x: mx * 0.5, y: my * 0.5, w: stripeW, h: H - my,
    fill: lg(0, [cfg.primaryColor, 0], [cfg.secondaryColor, 0.5], [cfg.primaryColor, 1]),
    tags: ["decorative", "accent", "border"],
  }));
  // Stripe inner pattern (dots)
  for (let i = 0; i < 8; i++) {
    layers.push(ellipse({
      name: `Stripe Dot ${i + 1}`, cx: mx * 0.5 + stripeW / 2, cy: my + i * ((H - 2 * my) / 8),
      rx: stripeW * 0.2, ry: stripeW * 0.2,
      fill: solidPaintHex(cfg.bgColor, 0.3), tags: ["decorative"],
    }));
  }
  // Name â€” right of stripe
  const contentX = mx * 0.5 + stripeW + mx;
  layers.push(textLayer({
    name: "Name", x: contentX, y: my, w: W - contentX - mx,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true, uppercase: true, letterSpacing: 2,
  }));
  // Divider
  layers.push(line({ name: "Divider", x: contentX, y: my + fs.name + 10, w: W * 0.3, color: cfg.primaryColor, alpha: 0.25, thickness: 1 }));
  // Contact
  layers.push(...buildContactLayers(cfg, contentX, my + fs.name + 20, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.6, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
  // Company â€” bottom right
  layers.push(textLayer({
    name: "Company", x: contentX, y: H - my, w: W - contentX - mx,
    text: cfg.company || "Company", fontSize: fs.label, ff, weight: 500,
    color: cfg.textColor, alpha: 0.4, align: "right", tags: ["company"], uppercase: true, letterSpacing: 3,
  }));
  return layers;
}

/** Premium Crest â€” Inspired by Company Green Dark: Dark front + triangle accent area */
function layoutPremiumCrest(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.1;
  const my = H * 0.15;
  const layers: LayerV2[] = [];

  // Right accent bar
  layers.push(rect({
    name: "Right Accent", x: W - mx * 0.6, y: H * 0.2, w: 3, h: H * 0.6,
    fill: solidPaintHex(cfg.primaryColor, 0.5), tags: ["decorative", "accent"],
  }));
  // Logo â€” centered top
  const logoS = H * 0.22;
  layers.push(buildLogoLayer(cfg, (W - logoS) / 2, my * 0.8, logoS, logoS, cfg.primaryColor, ff));
  // Company â€” centered below logo
  layers.push(textLayer({
    name: "Company", x: 0, y: my * 0.8 + logoS + 8, w: W,
    text: cfg.company || "Company", fontSize: fs.companyLg, ff, weight: 700,
    color: cfg.textColor, align: "center", tags: ["company"], autoFit: true,
  }));
  if (cfg.tagline) {
    layers.push(textLayer({
      name: "Tagline", x: 0, y: my * 0.8 + logoS + 8 + fs.companyLg + 4, w: W,
      text: cfg.tagline, fontSize: fs.tagline, ff, weight: 300,
      color: cfg.textColor, alpha: 0.4, align: "center", tags: ["tagline"],
    }));
  }
  // Divider
  layers.push(line({ name: "Divider", x: W * 0.3, y: H * 0.58, w: W * 0.4, color: cfg.primaryColor, alpha: 0.25 }));
  // Name â€” centered
  layers.push(textLayer({
    name: "Name", x: 0, y: H * 0.62, w: W,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 600,
    color: cfg.textColor, align: "center", tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title
  layers.push(textLayer({
    name: "Title", x: 0, y: H * 0.62 + fs.name + 4, w: W,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, align: "center", tags: ["title"], uppercase: true, letterSpacing: 2,
  }));
  // Contact â€” centered
  layers.push(...buildContactLayers(cfg, W / 2, H * 0.62 + fs.name + fs.label + 16, Math.round(fs.contact * 1.4), "center", cfg.textColor, 0.6, cfg.primaryColor, 0.45, fs.contact, ff, W, H));
  return layers;
}

/** Gold Construct â€” Inspired by News Business: Teal/gold, vertical text, construction/premium feel */
function layoutGoldConstruct(W: number, H: number, cfg: CardConfig, fs: FontSizes, ff: string): LayerV2[] {
  const mx = W * 0.08;
  const my = H * 0.12;
  const layers: LayerV2[] = [];

  // Top gold accent bar
  layers.push(rect({
    name: "Gold Top Bar", x: mx, y: my * 0.5, w: W - 2 * mx, h: 3,
    fill: solidPaintHex(cfg.primaryColor, 0.6), tags: ["decorative", "accent", "border"],
  }));
  // Bottom gold accent bar
  layers.push(rect({
    name: "Gold Bottom Bar", x: mx, y: H - my * 0.5 - 3, w: W - 2 * mx, h: 3,
    fill: solidPaintHex(cfg.primaryColor, 0.6), tags: ["decorative", "accent", "border"],
  }));
  // Left thin gold divider
  layers.push(rect({
    name: "V-Divider", x: W * 0.35, y: my, w: 1.5, h: H - 2 * my,
    fill: solidPaintHex(cfg.primaryColor, 0.3), tags: ["decorative", "divider"],
  }));
  // Logo â€” top right
  const logoS = H * 0.2;
  layers.push(buildLogoLayer(cfg, W - mx - logoS, my, logoS, logoS, cfg.primaryColor, ff));
  // Company next to logo
  layers.push(textLayer({
    name: "Company", x: W * 0.37, y: my + 4, w: W * 0.35,
    text: cfg.company || "Company", fontSize: fs.company, ff, weight: 700,
    color: cfg.textColor, tags: ["company"], autoFit: true,
  }));
  // Name â€” left of divider, bold
  layers.push(textLayer({
    name: "Name", x: mx, y: H * 0.42, w: W * 0.25,
    text: cfg.name || "Your Name", fontSize: fs.name, ff, weight: 700,
    color: cfg.textColor, tags: ["name", "primary-text"], autoFit: true,
  }));
  // Title â€” in gold
  layers.push(textLayer({
    name: "Title", x: mx, y: H * 0.42 + fs.name + 4, w: W * 0.25,
    text: cfg.title || "Job Title", fontSize: fs.label, ff, weight: 400,
    color: cfg.primaryColor, tags: ["title"], uppercase: true, letterSpacing: 1,
  }));
  // Contact â€” right of divider
  layers.push(...buildContactLayers(cfg, W * 0.37, H * 0.45, Math.round(fs.contact * 1.5), "left", cfg.textColor, 0.65, cfg.primaryColor, 0.5, fs.contact, ff, W, H));
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
// 9.  Main Conversion: CardConfig â†’ DesignDocumentV2
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
    name: `Business Card â€” ${cfg.name || "Untitled"}`,
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

  // â”€â”€ Post-process: Auto-fit name & company text layers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // Text content mapping: tag â†’ config field
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

    // â”€â”€ Text layers: sync fill color based on semantic tags â”€â”€
    if (layer.type === "text") {
      const tl = layer as TextLayerV2;

      // Name / primary-text â†’ textColor
      if (tl.tags.includes("name") || tl.tags.includes("primary-text")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }

      // Title â†’ primaryColor (many templates use primaryColor for titles)
      if (tl.tags.includes("title")) {
        const shouldUpdate = !prevPrimaryRGBA || _textLayerColorMatches(tl, prevPrimaryRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.primaryColor) },
          } as Partial<LayerV2>);
        }
      }

      // Company â†’ textColor (with lower alpha, preserve existing alpha)
      if (tl.tags.includes("company")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        // Also check primaryColor â€” some templates use primaryColor for company text
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

      // Contact text â†’ textColor
      if (tl.tags.includes("contact-text")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }

      // Tagline â†’ textColor
      if (tl.tags.includes("tagline")) {
        const shouldUpdate = !prevTextRGBA || _textLayerColorMatches(tl, prevTextRGBA);
        if (shouldUpdate) {
          updated = updateLayer(updated, layer.id, {
            defaultStyle: { ...(updated.layersById[layer.id] as TextLayerV2).defaultStyle, fill: solidPaintHex(cfg.textColor) },
          } as Partial<LayerV2>);
        }
      }
    }

    // â”€â”€ Icon layers: contact-icon â†’ primaryColor â”€â”€
    if (layer.type === "icon" && layer.tags.includes("contact-icon")) {
      const shouldUpdate = !prevPrimaryRGBA || _rgbaApprox((layer as import("./schema").IconLayerV2).color, prevPrimaryRGBA);
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          color: hexToRGBA(cfg.primaryColor),
        } as Partial<LayerV2>);
      }
    }

    // â”€â”€ Shape layers: accent â†’ primaryColor â”€â”€
    if (layer.tags.includes("accent") && layer.type === "shape") {
      const firstFill = (layer as ShapeLayerV2).fills?.[0];
      const shouldUpdate = !prevPrimaryRGBA || (firstFill?.kind === "solid" && _rgbaApprox(firstFill.color, prevPrimaryRGBA));
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          fills: [solidPaintHex(cfg.primaryColor)],
        } as Partial<LayerV2>);
      }
    }

    // â”€â”€ Shape layers: corner decoratives â†’ secondaryColor â”€â”€
    if (layer.tags.includes("corner") && layer.type === "shape") {
      const firstFill = (layer as ShapeLayerV2).fills?.[0];
      const shouldUpdate = !prevSecondaryRGBA || (firstFill?.kind === "solid" && _rgbaApprox(firstFill.color, prevSecondaryRGBA));
      if (shouldUpdate) {
        updated = updateLayer(updated, layer.id, {
          fills: [solidPaintHex(cfg.secondaryColor)],
        } as Partial<LayerV2>);
      }
    }

    // â”€â”€ Shape layers: border strokes â†’ primaryColor â”€â”€
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

    // â”€â”€ QR code layer: darken on light backgrounds, lighten on dark backgrounds â”€â”€
    if (layer.tags.includes("qr-code") && layer.type === "shape") {
      const bgLum = (() => { const c = hexToRGBA(cfg.bgColor); return (0.299 * c.r + 0.587 * c.g + 0.114 * c.b) / 255; })();
      const qrColor = bgLum > 0.5 ? "#1a1a1a" : "#e0e0e0";
      updated = updateLayer(updated, layer.id, {
        fills: [solidPaintHex(qrColor, 0.12)],
      } as Partial<LayerV2>);
    }

    // â”€â”€ Abstract asset layers: color-primary â†’ primaryColor, color-secondary â†’ secondaryColor â”€â”€
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
