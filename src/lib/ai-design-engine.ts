// =============================================================================
// DMSuite — AI Design Director Engine v2.0
// =============================================================================
// A human-designer-level engine that makes professional design decisions.
// Think of this as a **senior graphic designer's brain** encoded in code:
//
//   1. COLOR SCIENCE  — HSL manipulation, WCAG contrast, accessible palettes,
//      analogous/complementary/triadic harmony, tint/shade ladders.
//   2. TYPOGRAPHY      — Modular-scale type ramp, optical sizing, professional
//      text rendering with kerning, leading, baseline grid.
//   3. LAYOUT          — Golden-ratio grids, column systems, whitespace rhythm,
//      modular spacing, safe-area calculation, margin/bleed.
//   4. COMPOSITION     — Visual hierarchy scoring, focal-point placement (rule
//      of thirds), z-pattern / f-pattern flow, anchor elements.
//   5. DRAWING         — Headers, dividers, tables, badges, cards, pull-quotes,
//      stat callouts, image placeholders, decorative elements.
//   6. PRINT PRODUCTION— Crop marks, registration marks, bleed, safe area,
//      color bars, slug-line, PDF metadata.
//   7. STOCK IMAGERY   — Search, load, draw with cover/contain, overlays,
//      gradient masks, Ken-Burns-style crops.
//   8. EXPORT          — Multi-DPI presets (72→600), JPEG quality tiers,
//      high-res re-render, filename conventions.
//   9. DECORATIVE      — Patterns, ornaments, geometric accents, corner
//      flourishes, watermarks, noise textures.
//  10. DESIGN TOKENS   — Centralised brand-token system so every function
//      draws from the same source of truth.
// =============================================================================

import {
  hexToRgba, hexToRgb, lightenColor, darkenColor,
  roundRect, getCanvasFont, getLetterSpacing, drawTrackedText,
  getLineHeight, wrapCanvasText,
} from "./canvas-utils";
import { loadImage, drawImageCover } from "./graphics-engine";

// ═══════════════════════════════════════════════════════════════════════════════
//  I.  TYPES & INTERFACES
// ═══════════════════════════════════════════════════════════════════════════════

export interface DesignBrief {
  documentType: string;
  brandName: string;
  tagline?: string;
  primaryColor: string;
  secondaryColor?: string;
  bgColor?: string;
  industry?: string;
  mood?: DesignMood;
  width: number;
  height: number;
}

export type DesignMood =
  | "professional" | "creative" | "luxury" | "playful"
  | "minimal" | "bold" | "elegant" | "corporate"
  | "tech" | "organic" | "vintage" | "futuristic";

export interface DesignElement {
  type: "image" | "text" | "shape" | "divider" | "badge" | "icon-placeholder";
  x: number; y: number; width: number; height: number;
  imageUrl?: string; imageElement?: HTMLImageElement;
  objectFit?: "cover" | "contain"; borderRadius?: number;
  text?: string; fontSize?: number; fontWeight?: number;
  fontStyle?: "modern" | "classic" | "bold" | "elegant" | "compact";
  color?: string; align?: CanvasTextAlign; lineHeight?: number;
  maxWidth?: number; uppercase?: boolean; letterSpacing?: number;
  shape?: "rect" | "circle" | "rounded-rect" | "line";
  fillColor?: string; strokeColor?: string; strokeWidth?: number; opacity?: number;
  badgeText?: string; badgeBg?: string; badgeColor?: string;
  dividerStyle?: "solid" | "dashed" | "dotted" | "gradient";
  clipRadius?: number; shadow?: boolean; shadowColor?: string;
  shadowBlur?: number; shadowOffsetY?: number;
}

export interface DesignComposition {
  elements: DesignElement[];
  backgroundColor: string;
  backgroundGradient?: { from: string; to: string; angle?: number };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  II.  COLOR SCIENCE
// ═══════════════════════════════════════════════════════════════════════════════

// -- Hex → HSL & back --------------------------------------------------------

function hexToHsl(hex: string): [number, number, number] {
  const { r: r8, g: g8, b: b8 } = hexToRgb(hex);
  const r = r8 / 255, g = g8 / 255, b = b8 / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const c = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(255 * Math.max(0, Math.min(1, c)))
      .toString(16).padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

// -- Perceived luminance (WCAG 2.1) -----------------------------------------

function relativeLuminance(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const srgb = [r, g, b].map(v => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** WCAG contrast ratio between two colours (1:1 → 21:1) */
export function contrastRatio(hex1: string, hex2: string): number {
  const l1 = relativeLuminance(hex1);
  const l2 = relativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Pick the best readable text color (black or white) for a background */
export function getContrastText(bgHex: string): string {
  return relativeLuminance(bgHex) > 0.179 ? "#0f172a" : "#ffffff";
}

/** Ensure WCAG AA contrast (4.5:1 for normal text) — darken/lighten until met */
export function ensureContrast(fg: string, bg: string, minRatio = 4.5): string {
  let [h, s, l] = hexToHsl(fg);
  const bgLum = relativeLuminance(bg);
  const direction = bgLum > 0.5 ? -0.02 : 0.02;
  let attempts = 0;
  while (contrastRatio(hslToHex(h, s, l), bg) < minRatio && attempts < 50) {
    l = Math.max(0, Math.min(1, l + direction));
    attempts++;
  }
  return hslToHex(h, s, l);
}

// -- Harmony generators ------------------------------------------------------

/** Generate a full professional colour palette from a single primary colour */
export function generateColorPalette(primaryColor: string) {
  const [h, s, l] = hexToHsl(primaryColor);
  return {
    // Brand tones
    primary: primaryColor,
    primaryLight: hslToHex(h, Math.max(0, s - 0.1), Math.min(0.92, l + 0.22)),
    primaryDark: hslToHex(h, Math.min(1, s + 0.05), Math.max(0.12, l - 0.25)),
    primaryMuted: hexToRgba(primaryColor, 0.15),
    primarySubtle: hexToRgba(primaryColor, 0.06),
    primaryVivid: hslToHex(h, Math.min(1, s + 0.2), Math.min(0.6, Math.max(0.4, l))),

    // Tint ladder (10-step scale)
    tint50: hslToHex(h, s * 0.25, 0.97),
    tint100: hslToHex(h, s * 0.35, 0.93),
    tint200: hslToHex(h, s * 0.45, 0.86),
    tint300: hslToHex(h, s * 0.6, 0.74),
    tint400: hslToHex(h, s * 0.8, 0.58),
    tint500: primaryColor,
    tint600: hslToHex(h, s, Math.max(0.1, l - 0.1)),
    tint700: hslToHex(h, s, Math.max(0.08, l - 0.22)),
    tint800: hslToHex(h, Math.min(1, s + 0.05), Math.max(0.06, l - 0.32)),
    tint900: hslToHex(h, Math.min(1, s + 0.08), Math.max(0.04, l - 0.4)),

    // Neutrals (harmonised with primary hue)
    textDark: hslToHex(h, 0.08, 0.1),
    textMedium: hslToHex(h, 0.06, 0.34),
    textLight: hslToHex(h, 0.05, 0.58),
    textOnPrimary: getContrastText(primaryColor),
    white: "#ffffff",
    offWhite: hslToHex(h, 0.08, 0.98),
    lightGray: hslToHex(h, 0.06, 0.96),
    mediumGray: hslToHex(h, 0.05, 0.89),
    borderGray: hslToHex(h, 0.04, 0.8),

    // Semantic (tinted toward brand hue)
    success: hslToHex((h + 140) % 360, 0.65, 0.42),
    warning: hslToHex((h + 40) % 360, 0.85, 0.52),
    error: hslToHex((h + 350) % 360, 0.72, 0.48),
    info: hslToHex((h + 200) % 360, 0.6, 0.52),
  };
}

/** Generate colour harmonies */
export function generateHarmony(primaryColor: string, type: "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic") {
  const [h, s, l] = hexToHsl(primaryColor);
  switch (type) {
    case "complementary":
      return [primaryColor, hslToHex((h + 180) % 360, s, l)];
    case "analogous":
      return [hslToHex((h - 30 + 360) % 360, s, l), primaryColor, hslToHex((h + 30) % 360, s, l)];
    case "triadic":
      return [primaryColor, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
    case "split-complementary":
      return [primaryColor, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
    case "tetradic":
      return [primaryColor, hslToHex((h + 90) % 360, s, l), hslToHex((h + 180) % 360, s, l), hslToHex((h + 270) % 360, s, l)];
  }
}

/** Mix two hex colours at a given ratio (0 = colour1, 1 = colour2) */
export function mixColors(hex1: string, hex2: string, ratio = 0.5): string {
  const c1 = hexToRgb(hex1), c2 = hexToRgb(hex2);
  const r = Math.round(c1.r + (c2.r - c1.r) * ratio);
  const g = Math.round(c1.g + (c2.g - c1.g) * ratio);
  const b = Math.round(c1.b + (c2.b - c1.b) * ratio);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  III.  TYPOGRAPHY SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

/** Modular-scale type ramp.  `ratio` is the musical interval (1.25 = major third). */
export function getTypographicScale(canvasHeight: number, ratio = 1.25) {
  const base = Math.max(10, Math.round(canvasHeight / 60));
  const step = (n: number) => Math.round(base * Math.pow(ratio, n));
  return {
    display: step(5),
    h1: step(4),
    h2: step(3),
    h3: step(2),
    h4: step(1),
    body: base,
    bodySmall: step(-1),
    caption: step(-2),
    label: step(-3),
    overline: step(-4),
    base,
    ratio,
  };
}

/** Get optimal line-height for a font size (looser for small, tighter for large) */
export function optimalLineHeight(fontSize: number): number {
  if (fontSize <= 10) return 1.7;
  if (fontSize <= 14) return 1.6;
  if (fontSize <= 20) return 1.5;
  if (fontSize <= 32) return 1.35;
  if (fontSize <= 48) return 1.2;
  return 1.1;
}

/** Get optimal letter-spacing for a font size */
export function optimalLetterSpacing(fontSize: number, uppercase = false): number {
  if (uppercase) return Math.max(0.5, fontSize * 0.08);
  if (fontSize >= 48) return -fontSize * 0.02;
  if (fontSize >= 24) return -fontSize * 0.01;
  return 0;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  IV.  LAYOUT & GRID SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface LayoutGrid {
  margin: number;
  gutter: number;
  columns: number;
  columnWidth: number;
  safeArea: { x: number; y: number; w: number; h: number };
  baseline: number;
}

/** Create a professional layout grid.  Adapts to page orientation automatically. */
export function createLayoutGrid(
  w: number, h: number,
  opts?: { margin?: number; columns?: number; baselineMultiplier?: number }
): LayoutGrid {
  const shorter = Math.min(w, h);
  const margin = opts?.margin ?? Math.round(shorter * 0.06);
  const columns = opts?.columns ?? (w > h ? 12 : 6);
  const gutter = Math.round(shorter * 0.015);
  const safeW = w - margin * 2;
  const safeH = h - margin * 2;
  const columnWidth = (safeW - gutter * (columns - 1)) / columns;
  const baseline = Math.round((opts?.baselineMultiplier ?? 1) * shorter / 80);

  return { margin, gutter, columns, columnWidth, safeArea: { x: margin, y: margin, w: safeW, h: safeH }, baseline };
}

/** Get the x-coordinate for column `n` (0-based). Span multiple columns with `span`. */
export function columnX(grid: LayoutGrid, col: number, span = 1): { x: number; w: number } {
  const x = grid.safeArea.x + col * (grid.columnWidth + grid.gutter);
  const w = span * grid.columnWidth + (span - 1) * grid.gutter;
  return { x, w };
}

/** Snap a y-coordinate to the nearest baseline increment */
export function snapToBaseline(y: number, grid: LayoutGrid): number {
  return Math.round(y / grid.baseline) * grid.baseline;
}

/** Golden-ratio split — returns { major, minor } pixel values */
export function goldenSplit(totalSize: number): { major: number; minor: number } {
  const phi = 1.618033988749895;
  const major = Math.round(totalSize / phi);
  return { major, minor: totalSize - major };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  V.  SPACING & RHYTHM
// ═══════════════════════════════════════════════════════════════════════════════

/** Create a spacing system proportional to canvas size */
export function createSpacingSystem(canvasHeight: number) {
  const unit = Math.max(4, Math.round(canvasHeight / 100));
  return {
    xxs: Math.round(unit * 0.25),
    xs: Math.round(unit * 0.5),
    sm: unit,
    md: Math.round(unit * 1.5),
    lg: unit * 2,
    xl: unit * 3,
    xxl: unit * 4,
    xxxl: unit * 6,
    section: unit * 8,
    unit,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VI.  PROFESSIONAL CANVAS DRAWING HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// -- Header areas -------------------------------------------------------------

export type HeaderStyle = "gradient" | "solid" | "diagonal" | "split" | "minimal" | "wave" | "angular" | "radial" | "duotone" | "stripe";

/** Draw a full-bleed header/hero area with a variety of professional styles */
export function drawHeaderArea(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primaryColor: string,
  style: HeaderStyle = "gradient"
) {
  ctx.save();
  const dark = darkenColor(primaryColor, 0.4);

  switch (style) {
    case "gradient": {
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, primaryColor); g.addColorStop(1, dark);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h); break;
    }
    case "solid":
      ctx.fillStyle = primaryColor; ctx.fillRect(x, y, w, h); break;
    case "diagonal":
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.6); ctx.lineTo(x, y + h); ctx.closePath();
      ctx.fillStyle = primaryColor; ctx.fill(); break;
    case "split": {
      ctx.fillStyle = primaryColor; ctx.fillRect(x, y, w * 0.4, h);
      const g = ctx.createLinearGradient(x + w * 0.3, y, x + w * 0.45, y);
      g.addColorStop(0, primaryColor); g.addColorStop(1, hexToRgba(primaryColor, 0));
      ctx.fillStyle = g; ctx.fillRect(x + w * 0.3, y, w * 0.15, h); break;
    }
    case "minimal":
      ctx.fillStyle = hexToRgba(primaryColor, 0.06); ctx.fillRect(x, y, w, h);
      ctx.fillStyle = primaryColor; ctx.fillRect(x, y, 4, h); break;
    case "wave": {
      const g = ctx.createLinearGradient(x, y, x + w, y);
      g.addColorStop(0, primaryColor); g.addColorStop(1, lightenColor(primaryColor, 0.2));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.8);
      ctx.quadraticCurveTo(x + w * 0.75, y + h * 1.05, x + w * 0.5, y + h * 0.85);
      ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.65, x, y + h * 0.9);
      ctx.closePath(); ctx.fill(); break;
    }
    case "angular": {
      ctx.fillStyle = primaryColor; ctx.beginPath();
      ctx.moveTo(x, y); ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.7); ctx.lineTo(x + w * 0.6, y + h);
      ctx.lineTo(x, y + h); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hexToRgba(dark, 0.3); ctx.beginPath();
      ctx.moveTo(x + w, y + h * 0.7); ctx.lineTo(x + w, y + h);
      ctx.lineTo(x + w * 0.6, y + h); ctx.closePath(); ctx.fill(); break;
    }
    case "radial": {
      const g = ctx.createRadialGradient(x + w * 0.3, y + h * 0.4, 0, x + w * 0.3, y + h * 0.4, Math.max(w, h));
      g.addColorStop(0, lightenColor(primaryColor, 0.15)); g.addColorStop(0.6, primaryColor); g.addColorStop(1, dark);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h); break;
    }
    case "duotone": {
      const secondary = hslToHex((hexToHsl(primaryColor)[0] + 30) % 360, 0.7, 0.45);
      const g = ctx.createLinearGradient(x, y, x + w, y + h);
      g.addColorStop(0, primaryColor); g.addColorStop(1, secondary);
      ctx.fillStyle = g; ctx.fillRect(x, y, w, h); break;
    }
    case "stripe": {
      ctx.fillStyle = primaryColor; ctx.fillRect(x, y, w, h);
      ctx.fillStyle = hexToRgba("#ffffff", 0.06);
      const stripeW = Math.max(8, w * 0.02);
      for (let sx = x; sx < x + w; sx += stripeW * 3) {
        ctx.save(); ctx.translate(sx, y); ctx.rotate(Math.PI / 6);
        ctx.fillRect(0, -h, stripeW, h * 3); ctx.restore();
      }
      break;
    }
  }
  ctx.restore();
}

// -- Text rendering -----------------------------------------------------------

export interface ProTextOpts {
  fontSize: number;
  fontWeight?: number;
  fontStyle?: "modern" | "classic" | "elegant" | "bold" | "compact";
  color?: string;
  align?: CanvasTextAlign;
  baseline?: CanvasTextBaseline;
  maxWidth?: number;
  uppercase?: boolean;
  opacity?: number;
  shadow?: boolean;
  shadowColor?: string;
  lineHeightOverride?: number;
  ellipsis?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
}

/** Draw professional-grade text with kerning, tracking, shadow, and word-wrap */
export function drawProText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  opts: ProTextOpts
): { width: number; height: number; lines: number } {
  const {
    fontSize, fontWeight = 400, fontStyle = "modern",
    color = "#0f172a", align = "left",
    maxWidth, uppercase = false, opacity = 1,
    shadow = false, shadowColor, baseline = "top",
    lineHeightOverride, ellipsis = false,
    underline = false, strikethrough = false,
  } = opts;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = getCanvasFont(fontWeight, fontSize, fontStyle);
  ctx.textAlign = align;
  ctx.textBaseline = baseline;

  const displayText = uppercase ? text.toUpperCase() : text;
  const spacing = getLetterSpacing(fontSize);
  const lineH = (lineHeightOverride ?? getLineHeight(fontSize)) * fontSize;

  if (shadow && fontSize >= 14) {
    ctx.shadowColor = shadowColor ?? hexToRgba("#000000", 0.12);
    ctx.shadowBlur = Math.max(2, fontSize * 0.1);
    ctx.shadowOffsetY = Math.max(1, fontSize * 0.05);
  }

  let resultW = 0;
  let lineCount = 1;

  if (maxWidth && !ellipsis) {
    const lines = wrapCanvasText(ctx, displayText, maxWidth);
    lineCount = lines.length;
    for (let i = 0; i < lines.length; i++) {
      const ly = y + i * lineH;
      if (Math.abs(spacing) > 0.1) {
        drawTrackedText(ctx, lines[i], x, ly, spacing, align);
      } else {
        ctx.fillText(lines[i], x, ly);
      }
      const lw = ctx.measureText(lines[i]).width;
      resultW = Math.max(resultW, lw);
      if (underline) drawTextDecoration(ctx, x, ly + lineH - 2, lw, 1, color, align);
      if (strikethrough) drawTextDecoration(ctx, x, ly + lineH * 0.45, lw, 1, color, align);
    }
    ctx.restore();
    return { width: maxWidth, height: lineCount * lineH, lines: lineCount };
  }

  let finalText = displayText;
  if (ellipsis && maxWidth) {
    while (ctx.measureText(finalText + "…").width > maxWidth && finalText.length > 1) {
      finalText = finalText.slice(0, -1);
    }
    if (finalText !== displayText) finalText += "…";
  }

  if (Math.abs(spacing) > 0.1) {
    resultW = drawTrackedText(ctx, finalText, x, y, spacing, align);
  } else {
    ctx.fillText(finalText, x, y);
    resultW = ctx.measureText(finalText).width;
  }
  if (underline) drawTextDecoration(ctx, x, y + lineH - 2, resultW, 1, color, align);
  if (strikethrough) drawTextDecoration(ctx, x, y + lineH * 0.45, resultW, 1, color, align);

  ctx.restore();
  return { width: resultW, height: lineH, lines: 1 };
}

function drawTextDecoration(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number, thickness: number,
  color: string, align: CanvasTextAlign
) {
  ctx.save();
  ctx.fillStyle = color;
  const startX = align === "center" ? x - width / 2 : align === "right" ? x - width : x;
  ctx.fillRect(startX, y, width, thickness);
  ctx.restore();
}

// -- Dividers -----------------------------------------------------------------

export type DividerStyle = "solid" | "gradient" | "dashed" | "dots" | "ornate" | "double" | "groove" | "wave";

/** Draw a professional divider line with multiple style options */
export function drawProDivider(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  color: string,
  style: DividerStyle = "solid",
  thickness = 1
) {
  ctx.save();
  switch (style) {
    case "solid":
      ctx.fillStyle = color; ctx.fillRect(x, y, width, thickness); break;
    case "gradient": {
      const g = ctx.createLinearGradient(x, y, x + width, y);
      g.addColorStop(0, hexToRgba(color, 0)); g.addColorStop(0.15, color);
      g.addColorStop(0.85, color); g.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = g; ctx.fillRect(x, y, width, thickness); break;
    }
    case "dashed":
      ctx.strokeStyle = color; ctx.lineWidth = thickness;
      ctx.setLineDash([6, 4]); ctx.beginPath();
      ctx.moveTo(x, y + thickness / 2); ctx.lineTo(x + width, y + thickness / 2);
      ctx.stroke(); ctx.setLineDash([]); break;
    case "dots": {
      const r = Math.max(0.5, thickness * 0.7); const gap = r * 4;
      ctx.fillStyle = color;
      for (let dx = 0; dx < width; dx += gap) {
        ctx.beginPath(); ctx.arc(x + dx + r, y + r, r, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "ornate": {
      ctx.fillStyle = color; ctx.fillRect(x, y, width, thickness);
      const cx = x + width / 2;
      ctx.save(); ctx.translate(cx, y + thickness / 2); ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6); ctx.restore();
      ctx.beginPath(); ctx.arc(x + 2, y + thickness / 2, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x + width - 2, y + thickness / 2, 2, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case "double":
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, thickness);
      ctx.fillRect(x, y + thickness * 3, width, thickness);
      break;
    case "groove":
      ctx.fillStyle = hexToRgba(color, 0.6); ctx.fillRect(x, y, width, thickness);
      ctx.fillStyle = hexToRgba(color, 0.25); ctx.fillRect(x, y + thickness, width, thickness);
      break;
    case "wave": {
      ctx.strokeStyle = color; ctx.lineWidth = thickness; ctx.beginPath();
      const amplitude = thickness * 2;
      const wavelength = 12;
      for (let wx = 0; wx <= width; wx += 1) {
        const wy = y + Math.sin((wx / wavelength) * Math.PI * 2) * amplitude;
        if (wx === 0) ctx.moveTo(x + wx, wy); else ctx.lineTo(x + wx, wy);
      }
      ctx.stroke(); break;
    }
  }
  ctx.restore();
}

// -- Tables -------------------------------------------------------------------

export interface TableColumn {
  label: string;
  width: number;
  align?: CanvasTextAlign;
  format?: (val: string) => string;
}

export interface TableOpts {
  primaryColor: string;
  fontSize?: number;
  rowHeight?: number;
  headerBg?: string;
  headerColor?: string;
  zebraStripe?: boolean;
  borderColor?: string;
  fontStyle?: "modern" | "classic" | "elegant" | "compact";
  roundedHeader?: boolean;
  rowBorders?: boolean;
  highlightLast?: boolean;
  rowBgFn?: (rowIndex: number) => string | null;
}

/** Draw a professional data table with header and rows. Returns total height drawn. */
export function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  columns: TableColumn[],
  rows: string[][],
  opts: TableOpts
): number {
  const {
    primaryColor, fontSize = 10, rowHeight = 22,
    headerBg, headerColor = "#ffffff",
    zebraStripe = true, borderColor,
    fontStyle = "modern", roundedHeader = true,
    rowBorders = true, highlightLast = false,
    rowBgFn,
  } = opts;

  const totalW = columns.reduce((sum, c) => sum + c.width, 0);
  let cy = y;
  const headerH = rowHeight + 6;

  // Header
  ctx.fillStyle = headerBg || primaryColor;
  if (roundedHeader) { roundRect(ctx, x, cy, totalW, headerH, 4); ctx.fill(); }
  else { ctx.fillRect(x, cy, totalW, headerH); }

  ctx.font = getCanvasFont(700, fontSize, fontStyle);
  ctx.fillStyle = headerColor;
  ctx.textBaseline = "middle";
  let cx = x;
  for (const col of columns) {
    ctx.textAlign = col.align || "left";
    const tx = col.align === "right" ? cx + col.width - 8 : col.align === "center" ? cx + col.width / 2 : cx + 8;
    ctx.fillText(col.label, tx, cy + headerH / 2);
    cx += col.width;
  }
  cy += headerH;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    const customBg = rowBgFn?.(r);
    if (customBg) {
      ctx.fillStyle = customBg; ctx.fillRect(x, cy, totalW, rowHeight);
    } else if (highlightLast && r === rows.length - 1) {
      ctx.fillStyle = hexToRgba(primaryColor, 0.1); ctx.fillRect(x, cy, totalW, rowHeight);
    } else if (zebraStripe && r % 2 === 0) {
      ctx.fillStyle = hexToRgba(primaryColor, 0.035); ctx.fillRect(x, cy, totalW, rowHeight);
    }

    if (rowBorders && borderColor) {
      ctx.fillStyle = borderColor; ctx.fillRect(x, cy + rowHeight - 0.5, totalW, 0.5);
    }

    const isLast = highlightLast && r === rows.length - 1;
    ctx.font = getCanvasFont(isLast ? 700 : 400, fontSize, fontStyle);
    ctx.fillStyle = isLast ? darkenColor(primaryColor, 0.1) : "#334155";
    cx = x;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      let val = rows[r]?.[c] || "";
      if (col.format) val = col.format(val);
      ctx.textAlign = col.align || "left";
      const tx = col.align === "right" ? cx + col.width - 8 : col.align === "center" ? cx + col.width / 2 : cx + 8;
      ctx.fillText(val, tx, cy + rowHeight / 2);
      cx += col.width;
    }
    cy += rowHeight;
  }

  return cy - y;
}

// -- Badges & Tags ------------------------------------------------------------

/** Draw a professional badge / tag. Returns dimensions. */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  opts: {
    bg: string; color: string; fontSize?: number;
    radius?: number; padding?: number;
    outline?: boolean;
  }
) {
  const { bg, color, fontSize = 9, radius = 8, padding = 6, outline = false } = opts;
  ctx.save();
  ctx.font = getCanvasFont(700, fontSize, "modern");
  const tw = ctx.measureText(text.toUpperCase()).width;
  const bw = tw + padding * 2;
  const bh = fontSize + padding * 1.6;

  if (outline) {
    ctx.strokeStyle = bg; ctx.lineWidth = 1;
    roundRect(ctx, x, y, bw, bh, radius); ctx.stroke();
  } else {
    ctx.fillStyle = bg;
    roundRect(ctx, x, y, bw, bh, radius); ctx.fill();
  }

  ctx.fillStyle = color;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), x + bw / 2, y + bh / 2);
  ctx.restore();
  return { width: bw, height: bh };
}

// -- Image placeholder --------------------------------------------------------

/** Draw a placeholder where an image will go (mountain/sun icon) */
export function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string, label?: string, radius = 0
) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, 0.07);
  if (radius) { roundRect(ctx, x, y, w, h, radius); ctx.fill(); }
  else ctx.fillRect(x, y, w, h);

  const iconSize = Math.min(w, h) * 0.22;
  const ix = x + w / 2, iy = y + h / 2 - (label ? 6 : 0);

  ctx.strokeStyle = hexToRgba(color, 0.2); ctx.lineWidth = 1.5;
  roundRect(ctx, ix - iconSize / 2, iy - iconSize / 2, iconSize, iconSize, 3); ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(ix - iconSize * 0.3, iy + iconSize * 0.2);
  ctx.lineTo(ix - iconSize * 0.05, iy - iconSize * 0.15);
  ctx.lineTo(ix + iconSize * 0.1, iy + iconSize * 0.05);
  ctx.lineTo(ix + iconSize * 0.3, iy - iconSize * 0.1);
  ctx.lineTo(ix + iconSize * 0.35, iy + iconSize * 0.2);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, 0.12); ctx.fill();

  ctx.fillStyle = hexToRgba(color, 0.18);
  ctx.beginPath(); ctx.arc(ix + iconSize * 0.15, iy - iconSize * 0.2, iconSize * 0.08, 0, Math.PI * 2); ctx.fill();

  if (label) {
    ctx.font = getCanvasFont(500, Math.max(8, Math.min(12, w * 0.04)), "modern");
    ctx.fillStyle = hexToRgba(color, 0.35);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.fillText(label, ix, iy + iconSize / 2 + 6);
  }
  ctx.restore();
}

// -- Cards / Containers -------------------------------------------------------

export interface CardOpts {
  bg?: string;
  borderColor?: string;
  radius?: number;
  shadow?: boolean;
  padding?: number;
  accentColor?: string;
  accentWidth?: number;
}

/** Draw a card/container with optional shadow & accent bar */
export function drawCard(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: CardOpts = {}
) {
  const {
    bg = "#ffffff", borderColor, radius = 6,
    shadow = false, padding = 0,
    accentColor, accentWidth = 4,
  } = opts;
  ctx.save();

  if (shadow) {
    ctx.shadowColor = hexToRgba("#000000", 0.08);
    ctx.shadowBlur = 12; ctx.shadowOffsetY = 3;
  }

  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, radius); ctx.fill();
  ctx.shadowColor = "transparent";

  if (borderColor) {
    ctx.strokeStyle = borderColor; ctx.lineWidth = 1;
    roundRect(ctx, x, y, w, h, radius); ctx.stroke();
  }

  if (accentColor) {
    ctx.save();
    ctx.beginPath();
    roundRect(ctx, x, y, w, h, radius); ctx.clip();
    ctx.fillStyle = accentColor;
    ctx.fillRect(x, y, accentWidth, h);
    ctx.restore();
  }

  ctx.restore();
  return { innerX: x + padding + (accentColor ? accentWidth : 0), innerY: y + padding, innerW: w - padding * 2 - (accentColor ? accentWidth : 0), innerH: h - padding * 2 };
}

// -- Pull quote ---------------------------------------------------------------

/** Draw a stylish pull-quote block */
export function drawPullQuote(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number, maxWidth: number,
  opts: { color: string; accentColor: string; fontSize?: number; attribution?: string }
): number {
  const { color, accentColor, fontSize = 14, attribution } = opts;
  const accentW = 4;

  ctx.fillStyle = accentColor;
  ctx.fillRect(x, y, accentW, 2);

  const tx = x + accentW + 12;
  const result = drawProText(ctx, `\u201C${text}\u201D`, tx, y, {
    fontSize, fontWeight: 400, fontStyle: "elegant", color,
    maxWidth: maxWidth - accentW - 12, opacity: 0.85,
  });

  let totalH = result.height;

  ctx.fillStyle = accentColor;
  ctx.fillRect(x, y, accentW, totalH + (attribution ? 24 : 0));

  if (attribution) {
    totalH += 8;
    drawProText(ctx, `— ${attribution}`, tx, y + totalH, {
      fontSize: fontSize * 0.75, fontWeight: 600, color: accentColor, uppercase: true,
    });
    totalH += fontSize;
  }

  return totalH;
}

// -- Stat callout -------------------------------------------------------------

/** Draw a big-number stat callout (e.g. "98%" with label) */
export function drawStatCallout(
  ctx: CanvasRenderingContext2D,
  value: string, label: string,
  x: number, y: number, w: number,
  opts: { color: string; accentColor: string; fontSize?: number }
): number {
  const { color, accentColor, fontSize = 32 } = opts;

  drawProText(ctx, value, x + w / 2, y, {
    fontSize, fontWeight: 800, color: accentColor, align: "center",
  });

  const labelY = y + fontSize * 1.2;
  drawProText(ctx, label, x + w / 2, labelY, {
    fontSize: Math.round(fontSize * 0.35), fontWeight: 500,
    color, align: "center", uppercase: true,
  });

  return fontSize * 1.2 + Math.round(fontSize * 0.5);
}

// -- Icon circle --------------------------------------------------------------

/** Draw a coloured circle with a single letter or icon placeholder */
export function drawIconCircle(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  letter: string,
  opts: { bg: string; color: string; fontSize?: number }
) {
  ctx.save();
  ctx.fillStyle = opts.bg;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = opts.color;
  ctx.font = getCanvasFont(700, opts.fontSize ?? radius, "modern");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(letter.charAt(0).toUpperCase(), cx, cy + 1);
  ctx.restore();
}

// -- Bullet list --------------------------------------------------------------

/** Draw a bulleted or numbered list. Returns total height. */
export function drawBulletList(
  ctx: CanvasRenderingContext2D,
  items: string[],
  x: number, y: number,
  opts: {
    maxWidth: number;
    fontSize?: number;
    color?: string;
    bulletColor?: string;
    bulletStyle?: "disc" | "number" | "check" | "dash" | "arrow";
    spacing?: number;
    fontStyle?: "modern" | "classic" | "elegant" | "compact";
  }
): number {
  const {
    maxWidth, fontSize = 11, color = "#334155",
    bulletColor = "#64748b", bulletStyle = "disc",
    spacing = 4, fontStyle = "modern",
  } = opts;

  let cy = y;
  const bulletW = bulletStyle === "number" ? fontSize * 1.6 : fontSize * 1.2;

  for (let i = 0; i < items.length; i++) {
    ctx.save();
    ctx.fillStyle = bulletColor;
    const bulletY = cy + fontSize * 0.45;

    switch (bulletStyle) {
      case "disc":
        ctx.beginPath(); ctx.arc(x + fontSize * 0.35, bulletY, fontSize * 0.18, 0, Math.PI * 2); ctx.fill(); break;
      case "number":
        ctx.font = getCanvasFont(700, fontSize * 0.85, fontStyle);
        ctx.textAlign = "right"; ctx.textBaseline = "top";
        ctx.fillText(`${i + 1}.`, x + fontSize * 1.2, cy); break;
      case "check":
        ctx.strokeStyle = bulletColor; ctx.lineWidth = 1.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(x + 2, bulletY); ctx.lineTo(x + fontSize * 0.3, bulletY + fontSize * 0.2);
        ctx.lineTo(x + fontSize * 0.55, bulletY - fontSize * 0.2); ctx.stroke(); break;
      case "dash":
        ctx.fillRect(x + 2, bulletY - 0.5, fontSize * 0.5, 1.5); break;
      case "arrow":
        ctx.font = getCanvasFont(400, fontSize * 0.8, fontStyle);
        ctx.textBaseline = "top"; ctx.fillText("\u2192", x, cy); break;
    }
    ctx.restore();

    const result = drawProText(ctx, items[i], x + bulletW, cy, {
      fontSize, color, maxWidth: maxWidth - bulletW, fontStyle,
    });
    cy += result.height + spacing;
  }

  return cy - y;
}

// -- Progress / Meter bar -----------------------------------------------------

/** Draw a horizontal progress/meter bar */
export function drawProgressBar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  progress: number,
  opts: { bg?: string; fillColor: string; radius?: number; label?: string; showPercent?: boolean }
) {
  const { bg = "#e2e8f0", fillColor, radius = 4, label, showPercent = false } = opts;
  const clamp = Math.max(0, Math.min(1, progress));

  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, radius); ctx.fill();

  if (clamp > 0) {
    ctx.fillStyle = fillColor;
    roundRect(ctx, x, y, w * clamp, h, radius); ctx.fill();
  }

  if (label) {
    ctx.font = getCanvasFont(500, Math.max(7, h * 0.6), "modern");
    ctx.fillStyle = "#334155"; ctx.textBaseline = "middle"; ctx.textAlign = "left";
    ctx.fillText(label, x, y - h * 0.3);
  }
  if (showPercent) {
    ctx.font = getCanvasFont(700, Math.max(7, h * 0.6), "modern");
    ctx.fillStyle = "#334155"; ctx.textBaseline = "middle"; ctx.textAlign = "right";
    ctx.fillText(`${Math.round(clamp * 100)}%`, x + w, y - h * 0.3);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VII.  DECORATIVE ELEMENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Draw corner flourishes / brackets for certificates, diplomas, etc. */
export function drawCornerFlourishes(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { color: string; size?: number; style?: "bracket" | "ornate" | "art-deco" | "minimal" }
) {
  const { color, size = 30, style = "bracket" } = opts;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = 1.5; ctx.lineCap = "round";

  const corners = [
    { cx: x, cy: y, sx: 1, sy: 1 },
    { cx: x + w, cy: y, sx: -1, sy: 1 },
    { cx: x, cy: y + h, sx: 1, sy: -1 },
    { cx: x + w, cy: y + h, sx: -1, sy: -1 },
  ];

  for (const corner of corners) {
    ctx.save();
    ctx.translate(corner.cx, corner.cy); ctx.scale(corner.sx, corner.sy);

    switch (style) {
      case "bracket":
        ctx.beginPath(); ctx.moveTo(0, size); ctx.lineTo(0, 0); ctx.lineTo(size, 0); ctx.stroke(); break;
      case "ornate":
        ctx.beginPath(); ctx.moveTo(0, size); ctx.lineTo(0, 0); ctx.lineTo(size, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(4, size * 0.7); ctx.lineTo(4, 4); ctx.lineTo(size * 0.7, 4); ctx.stroke();
        ctx.fillStyle = color; ctx.beginPath(); ctx.arc(0, 0, 2.5, 0, Math.PI * 2); ctx.fill();
        break;
      case "art-deco":
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, size); ctx.lineTo(0, 0); ctx.lineTo(size, 0); ctx.stroke();
        ctx.fillStyle = color;
        ctx.fillRect(3, 3, size * 0.3, 2);
        ctx.fillRect(3, 3, 2, size * 0.3);
        break;
      case "minimal":
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(0, size * 0.5); ctx.lineTo(0, 0); ctx.lineTo(size * 0.5, 0); ctx.stroke();
        break;
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Draw a decorative seal / rosette */
export function drawSeal(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, radius: number,
  opts: { color: string; innerColor?: string; text?: string; points?: number }
) {
  const { color, innerColor = "#ffffff", text, points = 24 } = opts;
  ctx.save();

  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? radius : radius * 0.82;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = innerColor;
  ctx.beginPath(); ctx.arc(cx, cy, radius * 0.62, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = color; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(cx, cy, radius * 0.52, 0, Math.PI * 2); ctx.stroke();

  if (text) {
    ctx.fillStyle = color;
    ctx.font = getCanvasFont(800, Math.max(6, radius * 0.22), "modern");
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const lines = text.split("\n");
    const lineH = radius * 0.28;
    const startY = cy - ((lines.length - 1) * lineH) / 2;
    lines.forEach((line, i) => ctx.fillText(line.toUpperCase(), cx, startY + i * lineH));
  }
  ctx.restore();
}

/** Draw a geometric dot-grid pattern */
export function drawDotPattern(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { color: string; spacing?: number; radius?: number; opacity?: number }
) {
  const { color, spacing = 16, radius = 1, opacity = 0.08 } = opts;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  for (let dy = 0; dy < h; dy += spacing) {
    for (let dx = 0; dx < w; dx += spacing) {
      ctx.beginPath(); ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/** Draw diagonal stripe pattern */
export function drawStripePattern(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { color: string; stripeWidth?: number; gap?: number; opacity?: number; angle?: number }
) {
  const { color, stripeWidth = 2, gap = 12, opacity = 0.05, angle = 45 } = opts;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();

  const rad = (angle * Math.PI) / 180;
  const step = stripeWidth + gap;
  const diag = Math.sqrt(w * w + h * h);

  ctx.translate(x + w / 2, y + h / 2);
  ctx.rotate(rad);
  for (let s = -diag; s < diag; s += step) {
    ctx.fillRect(s, -diag, stripeWidth, diag * 2);
  }
  ctx.restore();
}

/** Draw a subtle noise texture overlay for premium feel */
export function drawNoiseOverlay(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts: { intensity?: number; monochrome?: boolean } = {}
) {
  const { intensity = 0.03, monochrome = true } = opts;
  ctx.save();
  const imageData = ctx.createImageData(w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = monochrome ? Math.random() * 255 : 0;
    data[i] = monochrome ? v : Math.random() * 255;
    data[i + 1] = monochrome ? v : Math.random() * 255;
    data[i + 2] = monochrome ? v : Math.random() * 255;
    data[i + 3] = Math.round(intensity * 255);
  }
  ctx.putImageData(imageData, x, y);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  VIII.  PRINT PRODUCTION
// ═══════════════════════════════════════════════════════════════════════════════

/** Draw print crop marks at all four corners */
export function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts?: { bleed?: number; markLength?: number; color?: string; lineWidth?: number }
) {
  const { bleed = 9, markLength = 18, color = "#000000", lineWidth = 0.5 } = opts || {};
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth;

  const corners: [number, number][] = [
    [x, y], [x + w, y], [x, y + h], [x + w, y + h],
  ];
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx === x ? cx - bleed - markLength : cx + bleed, cy);
    ctx.lineTo(cx === x ? cx - bleed : cx + bleed + markLength, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, cy === y ? cy - bleed - markLength : cy + bleed);
    ctx.lineTo(cx, cy === y ? cy - bleed : cy + bleed + markLength);
    ctx.stroke();
  }
  ctx.restore();
}

/** Draw a colour registration mark (cross-hair + circle) */
export function drawRegistrationMark(
  ctx: CanvasRenderingContext2D, x: number, y: number, size = 10
) {
  ctx.save();
  ctx.strokeStyle = "#000"; ctx.lineWidth = 0.5;
  ctx.beginPath(); ctx.arc(x, y, size / 2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y); ctx.lineTo(x + size / 2, y);
  ctx.moveTo(x, y - size / 2); ctx.lineTo(x, y + size / 2);
  ctx.stroke();
  ctx.restore();
}

/** Draw CMYK colour bars (for print proofing) */
export function drawColorBars(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, totalWidth: number, barHeight = 6
) {
  const colors = ["#00ffff", "#ff00ff", "#ffff00", "#000000", "#ff0000", "#00ff00", "#0000ff", "#ffffff"];
  const bw = totalWidth / colors.length;
  ctx.save();
  colors.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(x + i * bw, y, bw, barHeight);
  });
  ctx.restore();
}

/** Draw a slug line (job info printed outside the trim area) */
export function drawSlugLine(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number,
  color = "#999999"
) {
  ctx.save();
  ctx.font = getCanvasFont(400, 6, "modern");
  ctx.fillStyle = color; ctx.textBaseline = "top";
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  IX.  STOCK IMAGE INTEGRATION
// ═══════════════════════════════════════════════════════════════════════════════

export interface StockImageResult {
  id: string;
  provider: string;
  description: string;
  photographer: string;
  urls: { thumb: string; small: string; regular: string; full: string };
  width: number;
  height: number;
}

/** Search stock images via the DMSuite API */
export async function searchStockImages(
  query: string, opts?: { perPage?: number; page?: number }
): Promise<StockImageResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      per_page: String(opts?.perPage ?? 12),
      page: String(opts?.page ?? 1),
    });
    const res = await fetch(`/api/images?${params}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.images || [];
  } catch { return []; }
}

/** Load and draw a stock image onto canvas with cover-fit */
export async function drawStockImage(
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  x: number, y: number, w: number, h: number,
  radius = 0
): Promise<HTMLImageElement | null> {
  try {
    const img = await loadImage(imageUrl);
    drawImageCover(ctx, img, x, y, w, h, radius);
    return img;
  } catch {
    drawImagePlaceholder(ctx, x, y, w, h, "#64748b", "Image loading\u2026", radius);
    return null;
  }
}

/** Draw an image with a gradient-fade overlay (great for hero sections) */
export async function drawImageWithGradientOverlay(
  ctx: CanvasRenderingContext2D,
  imageUrl: string,
  x: number, y: number, w: number, h: number,
  opts: {
    overlayColor?: string;
    direction?: "bottom" | "top" | "left" | "right";
    opacity?: number;
    radius?: number;
  } = {}
): Promise<HTMLImageElement | null> {
  const { overlayColor = "#000000", direction = "bottom", opacity = 0.6, radius = 0 } = opts;

  const img = await drawStockImage(ctx, imageUrl, x, y, w, h, radius);

  ctx.save();
  if (radius) { roundRect(ctx, x, y, w, h, radius); ctx.clip(); }

  const coords = {
    bottom: [x, y, x, y + h],
    top: [x, y + h, x, y],
    left: [x + w, y, x, y],
    right: [x, y, x + w, y],
  }[direction] as [number, number, number, number];

  const grad = ctx.createLinearGradient(...coords);
  grad.addColorStop(0, hexToRgba(overlayColor, 0));
  grad.addColorStop(0.5, hexToRgba(overlayColor, opacity * 0.4));
  grad.addColorStop(1, hexToRgba(overlayColor, opacity));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  return img;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  X.  WATERMARK
// ═══════════════════════════════════════════════════════════════════════════════

/** Draw a diagonal watermark across the entire canvas */
export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text = "DRAFT", color = "#e2e8f0", opacity = 0.08
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = getCanvasFont(900, Math.min(w, h) * 0.15, "bold");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

/** Draw tiled watermark (repeating pattern) */
export function drawTiledWatermark(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text = "DRAFT", color = "#cbd5e1", opacity = 0.04,
  spacing = 200
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  const fontSize = Math.max(12, spacing * 0.2);
  ctx.font = getCanvasFont(700, fontSize, "modern");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";

  for (let y = -spacing; y < h + spacing; y += spacing) {
    for (let x = -spacing; x < w + spacing; x += spacing) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-Math.PI / 6);
      ctx.fillText(text, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  XI.  EXPORT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export interface ExportSettings {
  format: "png" | "pdf" | "jpg" | "svg";
  quality: "draft" | "standard" | "print" | "ultra";
  dpi: number;
  scale: number;
  includeBleed: boolean;
  includeCropMarks: boolean;
}

export const EXPORT_PRESETS: Record<string, ExportSettings> = {
  "web-draft":      { format: "png", quality: "draft",    dpi:  72, scale: 1, includeBleed: false, includeCropMarks: false },
  "web-standard":   { format: "png", quality: "standard", dpi: 150, scale: 2, includeBleed: false, includeCropMarks: false },
  "print-standard": { format: "pdf", quality: "print",    dpi: 300, scale: 3, includeBleed: true,  includeCropMarks: true  },
  "print-ultra":    { format: "pdf", quality: "ultra",    dpi: 600, scale: 4, includeBleed: true,  includeCropMarks: true  },
};

/** Export canvas at high resolution with optional crop marks & bleed */
export function exportHighRes(
  sourceCanvas: HTMLCanvasElement,
  settings: ExportSettings,
  filename: string
) {
  const scale = settings.scale;
  const exportCanvas = document.createElement("canvas");
  exportCanvas.width = sourceCanvas.width * scale;
  exportCanvas.height = sourceCanvas.height * scale;
  const ctx = exportCanvas.getContext("2d")!;
  ctx.scale(scale, scale);
  ctx.drawImage(sourceCanvas, 0, 0);

  if (settings.includeCropMarks) {
    const bleed = 9 * scale;
    drawCropMarks(ctx, bleed, bleed, sourceCanvas.width - bleed * 2, sourceCanvas.height - bleed * 2);
  }

  const quality =
    settings.format === "jpg"
      ? settings.quality === "ultra" ? 1.0 : settings.quality === "print" ? 0.95 : 0.85
      : undefined;
  const mimeType = settings.format === "jpg" ? "image/jpeg" : "image/png";

  const dataUrl = exportCanvas.toDataURL(mimeType, quality);
  const link = document.createElement("a");
  link.download = `${filename}.${settings.format === "pdf" ? "png" : settings.format}`;
  link.href = dataUrl;
  link.click();
}

// ═══════════════════════════════════════════════════════════════════════════════
//  XII.  DESIGN-DECISION HELPERS (the "human designer brain")
// ═══════════════════════════════════════════════════════════════════════════════

/** Pick the best header style for a given design mood */
export function suggestHeaderStyle(mood: DesignMood): HeaderStyle {
  const map: Record<DesignMood, HeaderStyle> = {
    professional: "gradient", corporate: "solid", minimal: "minimal",
    creative: "wave", luxury: "radial", playful: "stripe",
    bold: "angular", elegant: "duotone", tech: "angular",
    organic: "wave", vintage: "solid", futuristic: "stripe",
  };
  return map[mood] || "gradient";
}

/** Pick the best divider style for a mood */
export function suggestDividerStyle(mood: DesignMood): DividerStyle {
  const map: Record<DesignMood, DividerStyle> = {
    professional: "gradient", corporate: "solid", minimal: "solid",
    creative: "wave", luxury: "ornate", playful: "dots",
    bold: "double", elegant: "ornate", tech: "dashed",
    organic: "wave", vintage: "ornate", futuristic: "groove",
  };
  return map[mood] || "solid";
}

/** Pick the best font style for a mood */
export function suggestFontStyle(mood: DesignMood): "modern" | "classic" | "elegant" | "bold" | "compact" {
  const map: Record<DesignMood, "modern" | "classic" | "elegant" | "bold" | "compact"> = {
    professional: "modern", corporate: "modern", minimal: "compact",
    creative: "bold", luxury: "elegant", playful: "bold",
    bold: "bold", elegant: "elegant", tech: "compact",
    organic: "classic", vintage: "classic", futuristic: "compact",
  };
  return map[mood] || "modern";
}

/** Pick the best bullet style for a mood */
export function suggestBulletStyle(mood: DesignMood): "disc" | "number" | "check" | "dash" | "arrow" {
  const map: Record<DesignMood, "disc" | "number" | "check" | "dash" | "arrow"> = {
    professional: "disc", corporate: "number", minimal: "dash",
    creative: "arrow", luxury: "disc", playful: "arrow",
    bold: "check", elegant: "disc", tech: "arrow",
    organic: "disc", vintage: "dash", futuristic: "arrow",
  };
  return map[mood] || "disc";
}

/** Pick appropriate corner flourish style for a mood */
export function suggestCornerStyle(mood: DesignMood): "bracket" | "ornate" | "art-deco" | "minimal" {
  const map: Record<DesignMood, "bracket" | "ornate" | "art-deco" | "minimal"> = {
    professional: "bracket", corporate: "bracket", minimal: "minimal",
    creative: "art-deco", luxury: "ornate", playful: "minimal",
    bold: "bracket", elegant: "ornate", tech: "minimal",
    organic: "bracket", vintage: "ornate", futuristic: "art-deco",
  };
  return map[mood] || "bracket";
}

/** Auto-compute visual hierarchy weights for content elements */
export function computeHierarchy(
  elements: Array<{ role: "title" | "subtitle" | "heading" | "subheading" | "body" | "caption" | "label" | "stat"; text: string }>,
  scale: ReturnType<typeof getTypographicScale>
): Array<{ text: string; fontSize: number; fontWeight: number; opacity: number }> {
  const map: Record<string, { size: keyof ReturnType<typeof getTypographicScale>; weight: number; opacity: number }> = {
    title: { size: "h1", weight: 800, opacity: 1 },
    subtitle: { size: "h3", weight: 400, opacity: 0.7 },
    heading: { size: "h2", weight: 700, opacity: 1 },
    subheading: { size: "h4", weight: 600, opacity: 0.85 },
    body: { size: "body", weight: 400, opacity: 0.8 },
    caption: { size: "caption", weight: 400, opacity: 0.6 },
    label: { size: "label", weight: 600, opacity: 0.5 },
    stat: { size: "display", weight: 900, opacity: 1 },
  };
  return elements.map(({ role, text }) => {
    const m = map[role] || map.body;
    return { text, fontSize: scale[m.size] as number, fontWeight: m.weight, opacity: m.opacity };
  });
}

/** Suggest optimal content area margin as percentage of shorter dimension */
export function suggestMargin(mood: DesignMood): number {
  const map: Record<DesignMood, number> = {
    professional: 0.06, corporate: 0.07, minimal: 0.1,
    creative: 0.05, luxury: 0.08, playful: 0.04,
    bold: 0.04, elegant: 0.08, tech: 0.05,
    organic: 0.06, vintage: 0.07, futuristic: 0.05,
  };
  return map[mood] || 0.06;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  XIII.  COMPLETE PAGE RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Draw a professional document page background */
export function drawPageBackground(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  opts: {
    bg?: string;
    texture?: "none" | "dots" | "stripes" | "noise";
    textureColor?: string;
    gradientOverlay?: boolean;
    overlayColor?: string;
  } = {}
) {
  const { bg = "#ffffff", texture = "none", textureColor = "#000000", gradientOverlay = false, overlayColor } = opts;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  if (texture === "dots") drawDotPattern(ctx, 0, 0, w, h, { color: textureColor, opacity: 0.03 });
  else if (texture === "stripes") drawStripePattern(ctx, 0, 0, w, h, { color: textureColor, opacity: 0.02 });
  else if (texture === "noise") drawNoiseOverlay(ctx, 0, 0, w, h, { intensity: 0.015 });

  if (gradientOverlay && overlayColor) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, hexToRgba(overlayColor, 0.03));
    g.addColorStop(1, hexToRgba(overlayColor, 0));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

/** Draw a professional footer bar */
export function drawPageFooter(
  ctx: CanvasRenderingContext2D,
  y: number, w: number,
  opts: {
    pageNum?: number; totalPages?: number;
    leftText?: string; centerText?: string; rightText?: string;
    color?: string; accentColor?: string; fontSize?: number;
    style?: "minimal" | "bar" | "line";
  }
) {
  const {
    pageNum, totalPages, leftText, centerText, rightText,
    color = "#94a3b8", accentColor, fontSize = 8,
    style = "minimal",
  } = opts;
  const margin = Math.round(w * 0.06);

  if (style === "bar" && accentColor) {
    ctx.fillStyle = hexToRgba(accentColor, 0.05);
    ctx.fillRect(0, y, w, 30);
  } else if (style === "line" && accentColor) {
    drawProDivider(ctx, margin, y, w - margin * 2, accentColor, "gradient", 0.5);
  }

  ctx.font = getCanvasFont(400, fontSize, "modern");
  ctx.fillStyle = color; ctx.textBaseline = "top";
  const ty = y + (style === "bar" ? 10 : 6);

  if (leftText) { ctx.textAlign = "left"; ctx.fillText(leftText, margin, ty); }
  if (centerText) { ctx.textAlign = "center"; ctx.fillText(centerText, w / 2, ty); }
  if (rightText) { ctx.textAlign = "right"; ctx.fillText(rightText, w - margin, ty); }
  if (pageNum !== undefined) {
    ctx.textAlign = "right";
    const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
    ctx.fillText(pageText, w - margin, ty);
  }
}

/** Draw a section heading with optional numbering and divider */
export function drawSectionHeading(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number, maxWidth: number,
  opts: {
    fontSize?: number;
    color?: string;
    accentColor?: string;
    number?: number | string;
    dividerStyle?: DividerStyle;
    fontStyle?: "modern" | "classic" | "elegant" | "bold" | "compact";
  }
): number {
  const {
    fontSize = 16, color = "#0f172a", accentColor,
    number, dividerStyle = "gradient", fontStyle = "modern",
  } = opts;

  let cx = x;
  const spacing = fontSize * 0.5;

  if (number !== undefined && accentColor) {
    const circleR = fontSize * 0.7;
    drawIconCircle(ctx, cx + circleR, y + circleR, circleR, String(number), {
      bg: accentColor, color: getContrastText(accentColor), fontSize: fontSize * 0.6,
    });
    cx += circleR * 2 + spacing;
  }

  const result = drawProText(ctx, text, cx, y + (number !== undefined ? fontSize * 0.15 : 0), {
    fontSize, fontWeight: 700, color, fontStyle, maxWidth: maxWidth - (cx - x),
  });

  const divY = y + result.height + (number !== undefined ? fontSize * 0.15 : 0) + 6;
  if (accentColor) {
    drawProDivider(ctx, x, divY, maxWidth, accentColor, dividerStyle, 1.5);
  }

  return result.height + 14;
}
