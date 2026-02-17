// =============================================================================
// DMSuite — AI Design Director Engine
// A human-like AI designer brain that makes professional design decisions.
// Composes layouts, selects imagery, handles typography, color harmony,
// spacing, visual hierarchy — everything a senior graphic designer knows.
// This engine is used by ALL workspace tools for professional-grade output.
// =============================================================================

import { hexToRgba, lightenColor, darkenColor, roundRect, getCanvasFont, getLetterSpacing, drawTrackedText, getLineHeight, drawTypographicText, wrapCanvasText } from "./canvas-utils";
import { loadImage, drawImageCover, drawImageContain, type PatternType, drawPattern } from "./graphics-engine";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DesignBrief {
  /** What type of document this is */
  documentType: string;
  /** Brand name / company name */
  brandName: string;
  /** Tagline or subtitle */
  tagline?: string;
  /** Primary color (hex) */
  primaryColor: string;
  /** Secondary color (hex) */
  secondaryColor?: string;
  /** Background color (hex) */
  bgColor?: string;
  /** Industry / vertical */
  industry?: string;
  /** Desired mood / feel */
  mood?: "professional" | "creative" | "luxury" | "playful" | "minimal" | "bold" | "elegant" | "corporate";
  /** Canvas dimensions */
  width: number;
  height: number;
}

export interface DesignElement {
  type: "image" | "text" | "shape" | "divider" | "badge" | "icon-placeholder";
  x: number;
  y: number;
  width: number;
  height: number;
  /** For images */
  imageUrl?: string;
  imageElement?: HTMLImageElement;
  objectFit?: "cover" | "contain";
  borderRadius?: number;
  /** For text */
  text?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: "modern" | "classic" | "bold" | "elegant" | "compact";
  color?: string;
  align?: CanvasTextAlign;
  lineHeight?: number;
  maxWidth?: number;
  uppercase?: boolean;
  letterSpacing?: number;
  /** For shapes */
  shape?: "rect" | "circle" | "rounded-rect" | "line";
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  opacity?: number;
  /** For badges */
  badgeText?: string;
  badgeBg?: string;
  badgeColor?: string;
  /** For dividers */
  dividerStyle?: "solid" | "dashed" | "dotted" | "gradient";
  /** Mask/clip */
  clipRadius?: number;
  /** Shadow */
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetY?: number;
}

export interface DesignComposition {
  elements: DesignElement[];
  backgroundColor: string;
  backgroundGradient?: { from: string; to: string; angle?: number };
}

// ---------------------------------------------------------------------------
// Professional Color Harmony
// ---------------------------------------------------------------------------

/** Generate a professional color palette from a primary color */
export function generateColorPalette(primaryColor: string) {
  return {
    primary: primaryColor,
    primaryLight: lightenColor(primaryColor, 0.3),
    primaryDark: darkenColor(primaryColor, 0.3),
    primaryMuted: hexToRgba(primaryColor, 0.15),
    primarySubtle: hexToRgba(primaryColor, 0.08),
    textDark: "#0f172a",
    textMedium: "#475569",
    textLight: "#94a3b8",
    textOnPrimary: getContrastText(primaryColor),
    white: "#ffffff",
    offWhite: "#f8fafc",
    lightGray: "#f1f5f9",
    mediumGray: "#e2e8f0",
    borderGray: "#cbd5e1",
  };
}

/** Get readable text color on a given background */
function getContrastText(bgHex: string): string {
  const r = parseInt(bgHex.slice(1, 3), 16);
  const g = parseInt(bgHex.slice(3, 5), 16);
  const b = parseInt(bgHex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.5 ? "#0f172a" : "#ffffff";
}

// ---------------------------------------------------------------------------
// Professional Layout Computation
// ---------------------------------------------------------------------------

export interface LayoutGrid {
  margin: number;
  gutter: number;
  columns: number;
  columnWidth: number;
  safeArea: { x: number; y: number; w: number; h: number };
}

/** Create a professional layout grid for any canvas size */
export function createLayoutGrid(w: number, h: number, opts?: { margin?: number; columns?: number }): LayoutGrid {
  const margin = opts?.margin ?? Math.round(Math.min(w, h) * 0.06);
  const columns = opts?.columns ?? 12;
  const gutter = Math.round(Math.min(w, h) * 0.015);
  const safeW = w - margin * 2;
  const safeH = h - margin * 2;
  const columnWidth = (safeW - gutter * (columns - 1)) / columns;

  return {
    margin,
    gutter,
    columns,
    columnWidth,
    safeArea: { x: margin, y: margin, w: safeW, h: safeH },
  };
}

/** Get a typographic scale appropriate for the canvas size */
export function getTypographicScale(canvasHeight: number) {
  const base = Math.max(10, Math.round(canvasHeight / 60));
  return {
    display: Math.round(base * 3.2),
    h1: Math.round(base * 2.4),
    h2: Math.round(base * 1.8),
    h3: Math.round(base * 1.4),
    body: base,
    caption: Math.round(base * 0.85),
    label: Math.round(base * 0.7),
    overline: Math.round(base * 0.6),
  };
}

// ---------------------------------------------------------------------------
// Professional Canvas Drawing Helpers
// ---------------------------------------------------------------------------

/** Draw a full-bleed header area with gradient and optional pattern overlay */
export function drawHeaderArea(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  primaryColor: string,
  style: "gradient" | "solid" | "diagonal" | "split" | "minimal" | "wave" = "gradient"
) {
  ctx.save();
  switch (style) {
    case "gradient": {
      const grad = ctx.createLinearGradient(x, y, x + w, y + h);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, darkenColor(primaryColor, 0.4));
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, w, h);
      break;
    }
    case "solid":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, y, w, h);
      break;
    case "diagonal": {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.6);
      ctx.lineTo(x, y + h);
      ctx.closePath();
      ctx.fillStyle = primaryColor;
      ctx.fill();
      break;
    }
    case "split": {
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, y, w * 0.4, h);
      const grad = ctx.createLinearGradient(x, y, x + w * 0.4, y);
      grad.addColorStop(0.8, primaryColor);
      grad.addColorStop(1, hexToRgba(primaryColor, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(x + w * 0.35, y, w * 0.1, h);
      break;
    }
    case "minimal": {
      ctx.fillStyle = hexToRgba(primaryColor, 0.06);
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(x, y, 4, h);
      break;
    }
    case "wave": {
      const grad = ctx.createLinearGradient(x, y, x + w, y);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, lightenColor(primaryColor, 0.2));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w, y);
      ctx.lineTo(x + w, y + h * 0.8);
      ctx.quadraticCurveTo(x + w * 0.75, y + h * 1.05, x + w * 0.5, y + h * 0.85);
      ctx.quadraticCurveTo(x + w * 0.25, y + h * 0.65, x, y + h * 0.9);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
  ctx.restore();
}

/** Draw professional-grade text with automatic sizing and tracking */
export function drawProText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  opts: {
    fontSize: number;
    fontWeight?: number;
    fontStyle?: "modern" | "classic" | "elegant" | "bold" | "compact";
    color?: string;
    align?: CanvasTextAlign;
    maxWidth?: number;
    uppercase?: boolean;
    opacity?: number;
    shadow?: boolean;
  }
): { width: number; height: number; lines: number } {
  const {
    fontSize, fontWeight = 400, fontStyle = "modern",
    color = "#0f172a", align = "left", maxWidth,
    uppercase = false, opacity = 1, shadow = false,
  } = opts;

  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = getCanvasFont(fontWeight, fontSize, fontStyle);
  ctx.textAlign = align;
  ctx.textBaseline = "top";

  const displayText = uppercase ? text.toUpperCase() : text;
  const spacing = getLetterSpacing(fontSize);
  const lineH = getLineHeight(fontSize) * fontSize;

  // Shadow for display text
  if (shadow && fontSize >= 20) {
    ctx.shadowColor = hexToRgba("#000000", 0.12);
    ctx.shadowBlur = fontSize * 0.1;
    ctx.shadowOffsetY = fontSize * 0.05;
  }

  if (maxWidth) {
    const lines = wrapCanvasText(ctx, displayText, maxWidth);
    lines.forEach((line, i) => {
      if (Math.abs(spacing) > 0.1) {
        drawTrackedText(ctx, line, x, y + i * lineH, spacing, align);
      } else {
        ctx.fillText(line, x, y + i * lineH);
      }
    });
    ctx.restore();
    return { width: maxWidth, height: lines.length * lineH, lines: lines.length };
  }

  if (Math.abs(spacing) > 0.1) {
    const w = drawTrackedText(ctx, displayText, x, y, spacing, align);
    ctx.restore();
    return { width: w, height: lineH, lines: 1 };
  }

  ctx.fillText(displayText, x, y);
  const w = ctx.measureText(displayText).width;
  ctx.restore();
  return { width: w, height: lineH, lines: 1 };
}

/** Draw a professional divider line */
export function drawProDivider(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, width: number,
  color: string,
  style: "solid" | "gradient" | "dashed" | "dots" | "ornate" = "solid",
  thickness = 1
) {
  ctx.save();
  switch (style) {
    case "solid":
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, thickness);
      break;
    case "gradient": {
      const grad = ctx.createLinearGradient(x, y, x + width, y);
      grad.addColorStop(0, hexToRgba(color, 0));
      grad.addColorStop(0.2, color);
      grad.addColorStop(0.8, color);
      grad.addColorStop(1, hexToRgba(color, 0));
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, width, thickness);
      break;
    }
    case "dashed":
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(x, y + thickness / 2);
      ctx.lineTo(x + width, y + thickness / 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    case "dots": {
      const dotR = thickness;
      const gap = dotR * 4;
      ctx.fillStyle = color;
      for (let dx = 0; dx < width; dx += gap) {
        ctx.beginPath();
        ctx.arc(x + dx, y + dotR, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case "ornate": {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, width, thickness);
      // diamond center
      const cx = x + width / 2;
      ctx.save();
      ctx.translate(cx, y);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
      break;
    }
  }
  ctx.restore();
}

/** Draw a table with header and rows */
export function drawTable(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  columns: { label: string; width: number; align?: CanvasTextAlign }[],
  rows: string[][],
  opts: {
    primaryColor: string;
    fontSize?: number;
    rowHeight?: number;
    headerBg?: string;
    headerColor?: string;
    zebraStripe?: boolean;
    borderColor?: string;
    fontStyle?: "modern" | "classic" | "elegant" | "compact";
  }
): number {
  const {
    primaryColor, fontSize = 10, rowHeight = 22,
    headerBg, headerColor = "#ffffff",
    zebraStripe = true, borderColor,
    fontStyle = "modern",
  } = opts;

  const totalW = columns.reduce((sum, c) => sum + c.width, 0);
  let cy = y;

  // Header row
  ctx.fillStyle = headerBg || primaryColor;
  roundRect(ctx, x, cy, totalW, rowHeight + 4, 3);
  ctx.fill();

  ctx.font = getCanvasFont(700, fontSize, fontStyle);
  ctx.fillStyle = headerColor;
  ctx.textBaseline = "middle";
  let cx = x;
  for (const col of columns) {
    ctx.textAlign = col.align || "left";
    const tx = col.align === "right" ? cx + col.width - 6 : col.align === "center" ? cx + col.width / 2 : cx + 6;
    ctx.fillText(col.label, tx, cy + (rowHeight + 4) / 2);
    cx += col.width;
  }
  cy += rowHeight + 4;

  // Data rows
  for (let r = 0; r < rows.length; r++) {
    if (zebraStripe && r % 2 === 0) {
      ctx.fillStyle = hexToRgba(primaryColor, 0.04);
      ctx.fillRect(x, cy, totalW, rowHeight);
    }
    if (borderColor) {
      ctx.fillStyle = borderColor;
      ctx.fillRect(x, cy + rowHeight - 0.5, totalW, 0.5);
    }

    ctx.font = getCanvasFont(400, fontSize, fontStyle);
    ctx.fillStyle = "#334155";
    cx = x;
    for (let c = 0; c < columns.length; c++) {
      const col = columns[c];
      const val = rows[r]?.[c] || "";
      ctx.textAlign = col.align || "left";
      const tx = col.align === "right" ? cx + col.width - 6 : col.align === "center" ? cx + col.width / 2 : cx + 6;
      ctx.fillText(val, tx, cy + rowHeight / 2);
      cx += col.width;
    }
    cy += rowHeight;
  }

  return cy - y;
}

/** Draw a professional badge / tag */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number, y: number,
  opts: { bg: string; color: string; fontSize?: number; radius?: number; padding?: number }
) {
  const { bg, color, fontSize = 9, radius = 8, padding = 6 } = opts;
  ctx.font = getCanvasFont(700, fontSize, "modern");
  const tw = ctx.measureText(text.toUpperCase()).width;
  const bw = tw + padding * 2;
  const bh = fontSize + padding * 1.5;

  ctx.fillStyle = bg;
  roundRect(ctx, x, y, bw, bh, radius);
  ctx.fill();

  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), x + bw / 2, y + bh / 2);

  return { width: bw, height: bh };
}

/** Draw a placeholder for an image area (when image hasn't loaded yet) */
export function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  color: string,
  label?: string,
  radius = 0
) {
  ctx.save();
  ctx.fillStyle = hexToRgba(color, 0.08);
  if (radius) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }

  // Image icon
  const iconSize = Math.min(w, h) * 0.25;
  const ix = x + w / 2;
  const iy = y + h / 2 - (label ? 6 : 0);

  ctx.strokeStyle = hexToRgba(color, 0.25);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(ix - iconSize / 2, iy - iconSize / 2, iconSize, iconSize, 3);
  ctx.stroke();

  // Mountain
  ctx.beginPath();
  ctx.moveTo(ix - iconSize * 0.3, iy + iconSize * 0.2);
  ctx.lineTo(ix - iconSize * 0.05, iy - iconSize * 0.15);
  ctx.lineTo(ix + iconSize * 0.1, iy + iconSize * 0.05);
  ctx.lineTo(ix + iconSize * 0.3, iy - iconSize * 0.1);
  ctx.lineTo(ix + iconSize * 0.35, iy + iconSize * 0.2);
  ctx.closePath();
  ctx.fillStyle = hexToRgba(color, 0.15);
  ctx.fill();

  // Sun
  ctx.fillStyle = hexToRgba(color, 0.2);
  ctx.beginPath();
  ctx.arc(ix + iconSize * 0.15, iy - iconSize * 0.2, iconSize * 0.08, 0, Math.PI * 2);
  ctx.fill();

  if (label) {
    ctx.font = getCanvasFont(500, Math.max(8, Math.min(12, w * 0.05)), "modern");
    ctx.fillStyle = hexToRgba(color, 0.4);
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, ix, iy + iconSize / 2 + 4);
  }

  ctx.restore();
}

/** Draw print crop marks for high-quality output */
export function drawCropMarks(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  opts?: { bleed?: number; markLength?: number; color?: string }
) {
  const { bleed = 9, markLength = 18, color = "#000000" } = opts || {};
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;

  const corners = [
    [x, y],
    [x + w, y],
    [x, y + h],
    [x + w, y + h],
  ];

  for (const [cx, cy] of corners) {
    // Horizontal mark
    ctx.beginPath();
    ctx.moveTo(cx === x ? cx - bleed - markLength : cx + bleed, cy);
    ctx.lineTo(cx === x ? cx - bleed : cx + bleed + markLength, cy);
    ctx.stroke();
    // Vertical mark
    ctx.beginPath();
    ctx.moveTo(cx, cy === y ? cy - bleed - markLength : cy + bleed);
    ctx.lineTo(cx, cy === y ? cy - bleed : cy + bleed + markLength);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw a color registration mark */
export function drawRegistrationMark(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  size = 10
) {
  ctx.save();
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 0.5;

  // Circle
  ctx.beginPath();
  ctx.arc(x, y, size / 2, 0, Math.PI * 2);
  ctx.stroke();

  // Cross
  ctx.beginPath();
  ctx.moveTo(x - size / 2, y);
  ctx.lineTo(x + size / 2, y);
  ctx.moveTo(x, y - size / 2);
  ctx.lineTo(x, y + size / 2);
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Stock Image Integration
// ---------------------------------------------------------------------------

export interface StockImageResult {
  id: string;
  provider: string;
  description: string;
  photographer: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
    full: string;
  };
  width: number;
  height: number;
}

/** Search stock images from the API */
export async function searchStockImages(
  query: string,
  opts?: { perPage?: number; page?: number }
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
  } catch {
    return [];
  }
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
    drawImagePlaceholder(ctx, x, y, w, h, "#64748b", "Image loading...", radius);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Professional Document Watermark
// ---------------------------------------------------------------------------

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  text = "DRAFT",
  color = "#e2e8f0",
  opacity = 0.08
) {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.font = getCanvasFont(900, Math.min(w, h) * 0.15, "bold");
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.translate(w / 2, h / 2);
  ctx.rotate(-Math.PI / 6);
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Export Quality Settings
// ---------------------------------------------------------------------------

export interface ExportSettings {
  format: "png" | "pdf" | "jpg" | "svg";
  quality: "draft" | "standard" | "print" | "ultra";
  /** DPI for print output */
  dpi: number;
  /** Scale factor for canvas resolution */
  scale: number;
  /** Whether to include bleed area */
  includeBleed: boolean;
  /** Whether to include crop marks */
  includeCropMarks: boolean;
}

export const EXPORT_PRESETS: Record<string, ExportSettings> = {
  "web-draft": { format: "png", quality: "draft", dpi: 72, scale: 1, includeBleed: false, includeCropMarks: false },
  "web-standard": { format: "png", quality: "standard", dpi: 150, scale: 2, includeBleed: false, includeCropMarks: false },
  "print-standard": { format: "pdf", quality: "print", dpi: 300, scale: 3, includeBleed: true, includeCropMarks: true },
  "print-ultra": { format: "pdf", quality: "ultra", dpi: 600, scale: 4, includeBleed: true, includeCropMarks: true },
};

/** Export canvas at high resolution */
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

  const quality = settings.format === "jpg" ? (settings.quality === "ultra" ? 1.0 : settings.quality === "print" ? 0.95 : 0.85) : undefined;
  const mimeType = settings.format === "jpg" ? "image/jpeg" : "image/png";

  const dataUrl = exportCanvas.toDataURL(mimeType, quality);
  const link = document.createElement("a");
  link.download = `${filename}.${settings.format}`;
  link.href = dataUrl;
  link.click();
}
