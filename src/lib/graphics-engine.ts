// =============================================================================
// DMSuite — Professional Graphics Engine
// Shared functions for rendering professional-grade graphics, decorative
// elements, stock image integration, and visual effects across all workspaces.
// =============================================================================

import { hexToRgba, hexToRgb, lightenColor, darkenColor, roundRect } from "./canvas-utils";
import { drawIcon, getIconListForAI, ICON_COUNT } from "@/lib/icon-library";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface StockImageRef {
  url: string;
  width: number;
  height: number;
  alt?: string;
}

export interface GradientStop {
  offset: number;
  color: string;
}

export type PatternType =
  | "dots"
  | "lines"
  | "diagonal-lines"
  | "crosshatch"
  | "waves"
  | "triangles"
  | "hexagons"
  | "circles"
  | "chevrons"
  | "diamond";

// ---------------------------------------------------------------------------
// Image Loading & Caching
// ---------------------------------------------------------------------------

const imageCache = new Map<string, HTMLImageElement>();

/** Load image with caching — returns a promise that resolves to the loaded image */
export function loadImage(url: string): Promise<HTMLImageElement> {
  const cached = imageCache.get(url);
  if (cached && cached.complete) return Promise.resolve(cached);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

/** Draw image covering an area (like CSS object-fit: cover) */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number,
  radius?: number
): void {
  ctx.save();
  if (radius) {
    roundRect(ctx, x, y, w, h, radius);
    ctx.clip();
  }
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;
  if (imgRatio > boxRatio) {
    sw = img.naturalHeight * boxRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / boxRatio;
    sy = (img.naturalHeight - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  ctx.restore();
}

/** Draw image contained in area (like CSS object-fit: contain) */
export function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
): { dx: number; dy: number; dw: number; dh: number } {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const boxRatio = w / h;
  let dw: number, dh: number;
  if (imgRatio > boxRatio) {
    dw = w;
    dh = w / imgRatio;
  } else {
    dh = h;
    dw = h * imgRatio;
  }
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
  return { dx, dy, dw, dh };
}

// ---------------------------------------------------------------------------
// Professional Gradient Backgrounds
// ---------------------------------------------------------------------------

/** Draw a multi-stop linear gradient */
export function drawGradient(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  angle: number,
  stops: GradientStop[]
): void {
  const rad = (angle * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const len = Math.max(w, h);
  const x0 = cx - Math.cos(rad) * len / 2;
  const y0 = cy - Math.sin(rad) * len / 2;
  const x1 = cx + Math.cos(rad) * len / 2;
  const y1 = cy + Math.sin(rad) * len / 2;

  const grad = ctx.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((s) => grad.addColorStop(s.offset, s.color));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
}

/** Draw a radial gradient */
export function drawRadialGradient(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  stops: GradientStop[]
): void {
  const grad = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  stops.forEach((s) => grad.addColorStop(s.offset, s.color));
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fill();
}

// ---------------------------------------------------------------------------
// Decorative Elements — Professional Grade
// ---------------------------------------------------------------------------

/** Draw a decorative circle accent */
export function drawAccentCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  opacity = 0.15
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Draw decorative line accent */
export function drawAccentLine(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  color: string,
  width = 2,
  opacity = 0.6
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Draw a decorative divider (horizontal rule with decorative elements) */
export function drawDivider(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  style: "line" | "dots" | "diamond" | "ornate" | "gradient",
  color: string,
  opacity = 0.4
): void {
  ctx.save();
  ctx.globalAlpha = opacity;

  switch (style) {
    case "line":
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();
      break;

    case "dots": {
      const dotR = 2;
      const gap = 10;
      ctx.fillStyle = color;
      for (let dx = 0; dx <= width; dx += gap) {
        ctx.beginPath();
        ctx.arc(x + dx, y, dotR, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }

    case "diamond": {
      const half = width / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + half - 6, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x + half + 6, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();
      // Diamond shape in center
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(x + half, y - 4);
      ctx.lineTo(x + half + 5, y);
      ctx.lineTo(x + half, y + 4);
      ctx.lineTo(x + half - 5, y);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "ornate": {
      const half = width / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      // Left flourish
      ctx.beginPath();
      ctx.moveTo(x + half - 40, y);
      ctx.bezierCurveTo(x + half - 20, y - 8, x + half - 10, y + 8, x + half, y);
      ctx.stroke();
      // Right flourish (mirror)
      ctx.beginPath();
      ctx.moveTo(x + half + 40, y);
      ctx.bezierCurveTo(x + half + 20, y - 8, x + half + 10, y + 8, x + half, y);
      ctx.stroke();
      // Center dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x + half, y, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case "gradient": {
      const grad = ctx.createLinearGradient(x, y, x + width, y);
      grad.addColorStop(0, "transparent");
      grad.addColorStop(0.3, color);
      grad.addColorStop(0.7, color);
      grad.addColorStop(1, "transparent");
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y);
      ctx.stroke();
      break;
    }
  }
  ctx.restore();
}

/** Draw a decorative seal/stamp (for certificates, vouchers, etc.) */
export function drawSeal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  color: string,
  text: string,
  opts?: { innerColor?: string; points?: number; textColor?: string }
): void {
  const points = opts?.points ?? 24;
  const innerR = outerR * 0.7;
  const innerColor = opts?.innerColor ?? lightenColor(color, 0.2);
  const textColor = opts?.textColor ?? "#ffffff";

  ctx.save();

  // Outer starburst
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : outerR * 0.85;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  // Inner circle
  ctx.fillStyle = innerColor;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fill();

  // Inner border
  ctx.strokeStyle = textColor;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, innerR - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Text (curved if long, centered if short)
  ctx.fillStyle = textColor;
  ctx.font = `bold ${Math.round(outerR * 0.2)}px Inter, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = text.split("\n");
  const lineH = outerR * 0.22;
  const startY = cy - ((lines.length - 1) * lineH) / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, cx, startY + i * lineH, innerR * 1.5);
  });

  ctx.restore();
}

/** Draw a pattern background */
export function drawPattern(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  type: PatternType,
  color: string,
  opacity = 0.06,
  spacing = 20
): void {
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;

  switch (type) {
    case "dots":
      for (let py = y; py < y + h; py += spacing) {
        for (let px = x; px < x + w; px += spacing) {
          ctx.beginPath();
          ctx.arc(px, py, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;

    case "lines":
      for (let py = y; py < y + h; py += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, py);
        ctx.lineTo(x + w, py);
        ctx.stroke();
      }
      break;

    case "diagonal-lines":
      for (let d = -h; d < w + h; d += spacing) {
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x + d + h, y + h);
        ctx.stroke();
      }
      break;

    case "crosshatch":
      for (let d = -h; d < w + h; d += spacing) {
        ctx.beginPath();
        ctx.moveTo(x + d, y);
        ctx.lineTo(x + d + h, y + h);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + d, y + h);
        ctx.lineTo(x + d + h, y);
        ctx.stroke();
      }
      break;

    case "waves":
      for (let py = y; py < y + h; py += spacing) {
        ctx.beginPath();
        for (let px = x; px < x + w; px += 2) {
          ctx.lineTo(px, py + Math.sin((px - x) / spacing * Math.PI * 2) * 4);
        }
        ctx.stroke();
      }
      break;

    case "triangles":
      for (let py = y; py < y + h; py += spacing) {
        for (let px = x; px < x + w; px += spacing) {
          const s = spacing * 0.3;
          ctx.beginPath();
          ctx.moveTo(px, py - s);
          ctx.lineTo(px + s, py + s);
          ctx.lineTo(px - s, py + s);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;

    case "hexagons": {
      const s = spacing * 0.4;
      for (let py = y; py < y + h; py += spacing * 0.85) {
        const offset = (Math.floor((py - y) / (spacing * 0.85)) % 2) * (spacing / 2);
        for (let px = x + offset; px < x + w; px += spacing) {
          ctx.beginPath();
          for (let i = 0; i < 6; i++) {
            const a = (Math.PI / 3) * i - Math.PI / 6;
            const hx = px + s * Math.cos(a);
            const hy = py + s * Math.sin(a);
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
    }

    case "circles":
      for (let py = y; py < y + h; py += spacing) {
        for (let px = x; px < x + w; px += spacing) {
          ctx.beginPath();
          ctx.arc(px, py, spacing * 0.3, 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      break;

    case "chevrons":
      for (let py = y; py < y + h; py += spacing) {
        for (let px = x; px < x + w; px += spacing) {
          const s = spacing * 0.25;
          ctx.beginPath();
          ctx.moveTo(px - s, py - s * 0.5);
          ctx.lineTo(px, py + s * 0.5);
          ctx.lineTo(px + s, py - s * 0.5);
          ctx.stroke();
        }
      }
      break;

    case "diamond":
      for (let py = y; py < y + h; py += spacing) {
        for (let px = x; px < x + w; px += spacing) {
          const s = spacing * 0.25;
          ctx.beginPath();
          ctx.moveTo(px, py - s);
          ctx.lineTo(px + s, py);
          ctx.lineTo(px, py + s);
          ctx.lineTo(px - s, py);
          ctx.closePath();
          ctx.stroke();
        }
      }
      break;
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Professional Text Effects
// ---------------------------------------------------------------------------

/** Draw text with shadow effect */
export function drawTextWithShadow(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts?: { shadowColor?: string; shadowBlur?: number; shadowOffsetX?: number; shadowOffsetY?: number }
): void {
  ctx.save();
  ctx.shadowColor = opts?.shadowColor ?? "rgba(0,0,0,0.3)";
  ctx.shadowBlur = opts?.shadowBlur ?? 4;
  ctx.shadowOffsetX = opts?.shadowOffsetX ?? 1;
  ctx.shadowOffsetY = opts?.shadowOffsetY ?? 2;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** Draw text with outline (stroke + fill) */
export function drawOutlinedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fillColor: string,
  strokeColor: string,
  strokeWidth = 2
): void {
  ctx.save();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = strokeWidth;
  ctx.lineJoin = "round";
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Image Placeholder (when stock image hasn't loaded yet)
// ---------------------------------------------------------------------------

/** Draw a stylish image placeholder with an icon */
export function drawImagePlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  color: string,
  label?: string,
  radius = 8
): void {
  ctx.save();
  roundRect(ctx, x, y, w, h, radius);
  ctx.clip();

  // Gradient background
  const grad = ctx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, hexToRgba(color, 0.12));
  grad.addColorStop(1, hexToRgba(color, 0.06));
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);

  // Dashed border
  ctx.strokeStyle = hexToRgba(color, 0.3);
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  roundRect(ctx, x + 4, y + 4, w - 8, h - 8, radius - 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Image icon in center
  const iconSize = Math.min(w, h) * 0.2;
  const icx = x + w / 2;
  const icy = y + h / 2 - (label ? 8 : 0);

  ctx.fillStyle = hexToRgba(color, 0.4);
  ctx.beginPath();
  // Mountain/image icon
  ctx.moveTo(icx - iconSize, icy + iconSize * 0.6);
  ctx.lineTo(icx - iconSize * 0.3, icy - iconSize * 0.2);
  ctx.lineTo(icx + iconSize * 0.1, icy + iconSize * 0.3);
  ctx.lineTo(icx + iconSize * 0.4, icy - iconSize * 0.4);
  ctx.lineTo(icx + iconSize, icy + iconSize * 0.6);
  ctx.closePath();
  ctx.fill();
  // Sun circle
  ctx.beginPath();
  ctx.arc(icx + iconSize * 0.5, icy - iconSize * 0.3, iconSize * 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Label
  if (label) {
    ctx.fillStyle = hexToRgba(color, 0.5);
    ctx.font = `500 ${Math.max(10, Math.min(12, w * 0.06))}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(label, icx, icy + iconSize * 0.8 + 4, w - 20);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Professional Shape Drawing
// ---------------------------------------------------------------------------

/** Draw a rounded rectangle with optional gradient fill and shadow */
export function drawProfessionalCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  opts?: {
    bgColor?: string;
    borderColor?: string;
    borderWidth?: number;
    radius?: number;
    shadow?: boolean;
    gradient?: GradientStop[];
    gradientAngle?: number;
  }
): void {
  ctx.save();
  const radius = opts?.radius ?? 12;

  if (opts?.shadow) {
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
  }

  roundRect(ctx, x, y, w, h, radius);

  if (opts?.gradient) {
    const angle = opts.gradientAngle ?? 135;
    const rad = (angle * Math.PI) / 180;
    const cx2 = x + w / 2;
    const cy2 = y + h / 2;
    const len = Math.max(w, h);
    const gx0 = cx2 - Math.cos(rad) * len / 2;
    const gy0 = cy2 - Math.sin(rad) * len / 2;
    const gx1 = cx2 + Math.cos(rad) * len / 2;
    const gy1 = cy2 + Math.sin(rad) * len / 2;
    const grad = ctx.createLinearGradient(gx0, gy0, gx1, gy1);
    opts.gradient.forEach((s) => grad.addColorStop(s.offset, s.color));
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = opts?.bgColor ?? "#ffffff";
  }
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  if (opts?.borderColor) {
    ctx.strokeStyle = opts.borderColor;
    ctx.lineWidth = opts.borderWidth ?? 1;
    roundRect(ctx, x, y, w, h, radius);
    ctx.stroke();
  }

  ctx.restore();
}

/** Draw a badge/tag element */
export function drawBadge(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  text: string,
  bgColor: string,
  textColor: string,
  opts?: { fontSize?: number; radius?: number; paddingX?: number; paddingY?: number }
): void {
  const fontSize = opts?.fontSize ?? 10;
  const pX = opts?.paddingX ?? 8;
  const pY = opts?.paddingY ?? 4;

  ctx.font = `600 ${fontSize}px Inter, sans-serif`;
  const metrics = ctx.measureText(text);
  const w = metrics.width + pX * 2;
  const h = fontSize + pY * 2;

  ctx.fillStyle = bgColor;
  roundRect(ctx, x, y, w, h, opts?.radius ?? h / 2);
  ctx.fill();

  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + pX, y + h / 2);
}

// ---------------------------------------------------------------------------
// Professional Icon Shapes — LEGACY WRAPPERS
// These delegate to the comprehensive icon library at src/lib/icon-library.ts
// Kept for backward compatibility. New code should import from icon-library.
// ---------------------------------------------------------------------------

/** @deprecated Use drawIcon(ctx, "phone", x, y, size, color) from icon-library */
export function drawPhoneIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  drawIcon(ctx, "phone", x, y, size, color);
}

/** @deprecated Use drawIcon(ctx, "email", x, y, size, color) from icon-library */
export function drawEmailIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  drawIcon(ctx, "email", x, y, size, color);
}

/** @deprecated Use drawIcon(ctx, "globe", x, y, size, color) from icon-library */
export function drawGlobeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  drawIcon(ctx, "globe", x, y, size, color);
}

/** @deprecated Use drawIcon(ctx, "map-pin", x, y, size, color) from icon-library */
export function drawLocationIcon(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string): void {
  drawIcon(ctx, "map-pin", x, y, size, color);
}

// ---------------------------------------------------------------------------
// Photo Grid Layouts (for designs that need image grids)
// ---------------------------------------------------------------------------

/** Calculate grid positions for N items in a given area */
export function calculateGridLayout(
  count: number,
  x: number,
  y: number,
  w: number,
  h: number,
  gap: number
): Array<{ x: number; y: number; w: number; h: number }> {
  if (count === 0) return [];
  if (count === 1) return [{ x, y, w, h }];

  const cols = count <= 2 ? 2 : count <= 4 ? 2 : 3;
  const rows = Math.ceil(count / cols);

  const cellW = (w - gap * (cols - 1)) / cols;
  const cellH = (h - gap * (rows - 1)) / rows;

  const cells: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let i = 0; i < count; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    cells.push({
      x: x + col * (cellW + gap),
      y: y + row * (cellH + gap),
      w: cellW,
      h: cellH,
    });
  }
  return cells;
}

// ---------------------------------------------------------------------------
// QR Code Drawing (simple version)
// ---------------------------------------------------------------------------

/** Draw a simple QR-code-like pattern placeholder */
export function drawQRPlaceholder(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, size, size);

  ctx.fillStyle = color;
  const cellSize = size / 7;

  // Corner markers
  const drawCorner = (cx: number, cy: number) => {
    ctx.fillRect(cx, cy, cellSize * 3, cellSize);
    ctx.fillRect(cx, cy + cellSize, cellSize, cellSize);
    ctx.fillRect(cx + cellSize * 2, cy + cellSize, cellSize, cellSize);
    ctx.fillRect(cx, cy + cellSize * 2, cellSize * 3, cellSize);
  };

  drawCorner(x + cellSize * 0.5, y + cellSize * 0.5);
  drawCorner(x + cellSize * 3.5, y + cellSize * 0.5);
  drawCorner(x + cellSize * 0.5, y + cellSize * 3.5);

  // Some data dots
  for (let r = 3; r < 6; r++) {
    for (let c = 3; c < 6; c++) {
      if ((r + c) % 2 === 0) {
        ctx.fillRect(x + c * cellSize, y + r * cellSize, cellSize * 0.8, cellSize * 0.8);
      }
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// AI Prompt Helpers for Graphic-Heavy Designs
// ---------------------------------------------------------------------------

/** Build an AI prompt that requests visual/graphic-rich designs, not just text */
export function buildGraphicDesignPrompt(
  toolType: string,
  userPrompt: string,
  config: {
    width: number;
    height: number;
    primaryColor: string;
    template?: string;
    style?: string;
    additionalContext?: string;
  }
): string {
  return `You are an elite professional graphic designer. Create a ${toolType} design.

USER REQUEST: ${userPrompt}

CANVAS SIZE: ${config.width}x${config.height}px
PRIMARY COLOR: ${config.primaryColor}
${config.template ? `TEMPLATE STYLE: ${config.template}` : ""}
${config.style ? `DESIGN STYLE: ${config.style}` : ""}
${config.additionalContext || ""}

CRITICAL REQUIREMENTS:
1. Think like a professional designer — every element should have purpose
2. Include VISUAL ELEMENTS: decorative shapes, accent graphics, icons, dividers, patterns
3. Use IMAGERY: recommend stock photo keywords for key visual areas (food photos for menus, headshots for business cards, product shots for catalogs)
4. Use PROFESSIONAL TYPOGRAPHY: hierarchy with heading/subheading/body, proper tracking and leading
5. Include DECORATIVE ELEMENTS: borders, ornaments, gradients, shadows, texture overlays
6. Consider COLOR HARMONY: complementary colors, proper contrast, accent colors
7. Ensure VISUAL BALANCE: proper whitespace, alignment, grid-based layout
8. Add DEPTH: layered elements, overlapping shapes, shadow effects

ICON LIBRARY (${ICON_COUNT} professional vector icons available):
${getIconListForAI()}
Reference any icon by its ID when suggesting decorative or functional icons.

RESPOND WITH JSON (no markdown):
{
  "headline": "main text",
  "subtext": "supporting text",
  "cta": "call to action (if applicable)",
  "stockImageKeywords": ["keyword1", "keyword2"],
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "bg": "#hex" },
  "layoutSuggestions": ["suggestion1", "suggestion2"],
  "decorativeElements": ["element description 1", "element description 2"],
  "additionalContent": {}
}`;
}

// ---------------------------------------------------------------------------
// Shared Color Palettes (Industry-Standard)
// ---------------------------------------------------------------------------

export const PROFESSIONAL_PALETTES = {
  "corporate-blue": { primary: "#1e40af", secondary: "#3b82f6", accent: "#60a5fa", bg: "#0f172a", text: "#ffffff" },
  "forest-green": { primary: "#15803d", secondary: "#22c55e", accent: "#86efac", bg: "#052e16", text: "#ffffff" },
  "elegant-gold": { primary: "#b45309", secondary: "#f59e0b", accent: "#fde68a", bg: "#1c1917", text: "#ffffff" },
  "modern-slate": { primary: "#334155", secondary: "#64748b", accent: "#94a3b8", bg: "#0f172a", text: "#ffffff" },
  "vibrant-red": { primary: "#b91c1c", secondary: "#ef4444", accent: "#fca5a5", bg: "#1c1917", text: "#ffffff" },
  "ocean-teal": { primary: "#0f766e", secondary: "#14b8a6", accent: "#5eead4", bg: "#042f2e", text: "#ffffff" },
  "luxury-purple": { primary: "#6d28d9", secondary: "#8b5cf6", accent: "#c4b5fd", bg: "#1e1b4b", text: "#ffffff" },
  "sunset-warm": { primary: "#c2410c", secondary: "#f97316", accent: "#fdba74", bg: "#1c1917", text: "#ffffff" },
  "lime-tech": { primary: "#65a30d", secondary: "#8ae600", accent: "#d9f99d", bg: "#0a0a0a", text: "#ffffff" },
  "rose-elegant": { primary: "#be123c", secondary: "#f43f5e", accent: "#fda4af", bg: "#1c1917", text: "#ffffff" },
} as const;

export type PaletteName = keyof typeof PROFESSIONAL_PALETTES;
