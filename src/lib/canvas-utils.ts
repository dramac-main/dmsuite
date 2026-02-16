// =============================================================================
// DMSuite — Shared Canvas Utilities
// Common drawing functions used across all Canvas-based design workspaces
// =============================================================================

// ---------------------------------------------------------------------------
// Color Utilities
// ---------------------------------------------------------------------------

/** Convert hex color to rgba string */
export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Parse hex to {r,g,b} */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

/** Get black or white contrast color based on WCAG luminance */
export function getContrastColor(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/** Lighten a hex color by a percentage (0-1) */
export function lightenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

/** Darken a hex color by a percentage (0-1) */
export function darkenColor(hex: string, amount: number): string {
  const { r, g, b } = hexToRgb(hex);
  const nr = Math.max(0, Math.round(r * (1 - amount)));
  const ng = Math.max(0, Math.round(g * (1 - amount)));
  const nb = Math.max(0, Math.round(b * (1 - amount)));
  return `#${nr.toString(16).padStart(2, "0")}${ng.toString(16).padStart(2, "0")}${nb.toString(16).padStart(2, "0")}`;
}

// ---------------------------------------------------------------------------
// Font Utilities
// ---------------------------------------------------------------------------

export type FontStyle = "modern" | "classic" | "bold" | "elegant" | "compact";

/** Map font style to CSS font-family stack */
export function getFontFamily(style: FontStyle): string {
  switch (style) {
    case "modern":
      return "Inter, Helvetica Neue, Arial, sans-serif";
    case "classic":
      return "Georgia, Garamond, Times New Roman, serif";
    case "bold":
      return "Impact, Haettenschweiler, Arial Black, sans-serif";
    case "elegant":
      return "Didot, Bodoni MT, Georgia, serif";
    case "compact":
      return "Inter, Helvetica Neue, Arial, sans-serif";
    default:
      return "Inter, Helvetica Neue, Arial, sans-serif";
  }
}

/** Build a canvas font string: "weight sizepx family" */
export function getCanvasFont(
  weight: number,
  size: number,
  style: FontStyle
): string {
  return `${weight} ${size}px ${getFontFamily(style)}`;
}

// ---------------------------------------------------------------------------
// Typography System — Professional Tracking & Leading
// ---------------------------------------------------------------------------

/** Size-dependent letter-spacing: larger text gets tighter tracking (display type) */
export function getLetterSpacing(size: number): number {
  if (size >= 72) return -2.5;
  if (size >= 56) return -1.8;
  if (size >= 40) return -1.2;
  if (size >= 28) return -0.5;
  if (size >= 18) return 0;
  return 0.3; // body text slightly wider
}

/** Size-dependent line-height ratio: display text → tighter leading */
export function getLineHeight(size: number): number {
  if (size >= 72) return 1.05;
  if (size >= 48) return 1.1;
  if (size >= 32) return 1.18;
  if (size >= 24) return 1.3;
  return 1.45; // body text
}

/** Draw text with precise letter-spacing using per-character rendering */
export function drawTrackedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: CanvasTextAlign = "left"
): number {
  // measure total width for alignment
  const chars = text.split("");
  let totalWidth = 0;
  for (const c of chars) totalWidth += ctx.measureText(c).width + spacing;
  totalWidth -= spacing; // no trailing space

  let startX = x;
  if (align === "center") startX = x - totalWidth / 2;
  else if (align === "right") startX = x - totalWidth;

  ctx.textAlign = "left";
  let cx = startX;
  for (const c of chars) {
    ctx.fillText(c, cx, y);
    cx += ctx.measureText(c).width + spacing;
  }
  return totalWidth;
}

/** Draw typographic text with per-character spacing and multi-layer shadow */
export function drawTypographicText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    fontSize: number;
    fontWeight: number;
    fontStyle: FontStyle;
    color: string;
    align?: CanvasTextAlign;
    shadow?: boolean;
    maxWidth?: number;
  }
): { width: number; height: number } {
  const {
    fontSize,
    fontWeight,
    fontStyle,
    color,
    align = "left",
    shadow = true,
    maxWidth,
  } = opts;
  const spacing = getLetterSpacing(fontSize);
  const leading = getLineHeight(fontSize) * fontSize;

  ctx.font = getCanvasFont(fontWeight, fontSize, fontStyle);

  // Word-wrap if maxWidth
  let lines: string[];
  if (maxWidth) {
    lines = wrapCanvasText(ctx, text, maxWidth);
  } else {
    lines = [text];
  }

  let totalH = 0;
  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * leading;

    // Multi-layer shadow
    if (shadow) {
      ctx.fillStyle = hexToRgba("#000000", 0.15);
      drawTrackedText(ctx, lines[i], x + 1, ly + 3, spacing, align);
      ctx.fillStyle = hexToRgba("#000000", 0.08);
      drawTrackedText(ctx, lines[i], x, ly + 6, spacing, align);
    }

    ctx.fillStyle = color;
    drawTrackedText(ctx, lines[i], x, ly, spacing, align);
    totalH = (i + 1) * leading;
  }

  return { width: maxWidth || ctx.measureText(text).width, height: totalH };
}

// ---------------------------------------------------------------------------
// Text Wrapping
// ---------------------------------------------------------------------------

/** Word-wrap text for canvas with maxWidth → string[] */
export function wrapCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const test = currentLine + " " + words[i];
    if (ctx.measureText(test).width <= maxWidth) {
      currentLine = test;
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);
  return lines;
}

// ---------------------------------------------------------------------------
// Canvas Drawing Primitives
// ---------------------------------------------------------------------------

/** Draw a professional CTA button with glass morphism */
export function drawCtaButton(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    color: string;
    fontStyle: FontStyle;
    fontSize?: number;
    align?: "left" | "center" | "right";
    paddingX?: number;
    paddingY?: number;
  }
): { width: number; height: number } {
  const {
    color,
    fontStyle,
    fontSize = 16,
    align = "left",
    paddingX = 32,
    paddingY = 14,
  } = opts;

  const contrastColor = getContrastColor(color);
  ctx.font = getCanvasFont(700, fontSize, fontStyle);
  const label = text.toUpperCase();
  const tw = ctx.measureText(label).width;
  const bw = tw + paddingX * 2;
  const bh = fontSize + paddingY * 2;

  let bx = x;
  if (align === "center") bx = x - bw / 2;
  else if (align === "right") bx = x - bw;

  // Drop shadow
  ctx.fillStyle = hexToRgba("#000000", 0.2);
  roundRect(ctx, bx + 2, y + 3, bw, bh, 6);
  ctx.fill();

  // Main fill
  ctx.fillStyle = color;
  roundRect(ctx, bx, y, bw, bh, 6);
  ctx.fill();

  // Glass morphism inner gradient
  const glassGrad = ctx.createLinearGradient(bx, y, bx, y + bh);
  glassGrad.addColorStop(0, hexToRgba("#ffffff", 0.25));
  glassGrad.addColorStop(0.4, hexToRgba("#ffffff", 0.08));
  glassGrad.addColorStop(0.6, "transparent");
  glassGrad.addColorStop(1, hexToRgba("#000000", 0.1));
  ctx.fillStyle = glassGrad;
  roundRect(ctx, bx, y, bw, bh, 6);
  ctx.fill();

  // Subtle border
  ctx.strokeStyle = hexToRgba("#ffffff", 0.15);
  ctx.lineWidth = 1;
  roundRect(ctx, bx + 0.5, y + 0.5, bw - 1, bh - 1, 6);
  ctx.stroke();

  // Text
  ctx.fillStyle = contrastColor;
  const spacing = getLetterSpacing(fontSize) + 1.5;
  ctx.textBaseline = "middle";
  drawTrackedText(ctx, label, bx + bw / 2, y + bh / 2, spacing, "center");
  ctx.textBaseline = "alphabetic";

  return { width: bw, height: bh };
}

/** Draw text with multi-layer drop shadow */
export function drawProText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  opts: {
    color: string;
    shadowAlpha?: number;
    align?: CanvasTextAlign;
  }
): void {
  const { color, shadowAlpha = 0.3, align = "left" } = opts;
  ctx.textAlign = align;
  // Shadow layers
  ctx.fillStyle = hexToRgba("#000000", shadowAlpha);
  ctx.fillText(text, x + 1, y + 2);
  ctx.fillStyle = hexToRgba("#000000", shadowAlpha * 0.4);
  ctx.fillText(text, x, y + 4);
  // Main text
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
}

/** Draw a rounded rectangle path */
export function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---------------------------------------------------------------------------
// Geometric / Decorative Elements
// ---------------------------------------------------------------------------

/** Draw a dot grid pattern */
export function drawDotGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cols: number,
  rows: number,
  spacing: number,
  color: string,
  dotRadius: number = 1.5
): void {
  ctx.fillStyle = color;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      ctx.beginPath();
      ctx.arc(x + col * spacing, y + row * spacing, dotRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

/** Draw concentric circles */
export function drawConcentricCircles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  startRadius: number,
  count: number,
  gap: number,
  color: string,
  lineWidth: number = 1
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(cx, cy, startRadius + i * gap, 0, Math.PI * 2);
    ctx.stroke();
  }
}

/** Draw corner brackets (editorial style) */
export function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  bracketSize: number,
  color: string,
  lineWidth: number = 1.5
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  // Top-left
  ctx.beginPath();
  ctx.moveTo(x, y + bracketSize);
  ctx.lineTo(x, y);
  ctx.lineTo(x + bracketSize, y);
  ctx.stroke();
  // Top-right
  ctx.beginPath();
  ctx.moveTo(x + w - bracketSize, y);
  ctx.lineTo(x + w, y);
  ctx.lineTo(x + w, y + bracketSize);
  ctx.stroke();
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(x, y + h - bracketSize);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x + bracketSize, y + h);
  ctx.stroke();
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(x + w - bracketSize, y + h);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x + w, y + h - bracketSize);
  ctx.stroke();
}

/** Draw a cross marker */
export function drawCrossMarker(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string,
  lineWidth: number = 1
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(cx - size, cy);
  ctx.lineTo(cx + size, cy);
  ctx.moveTo(cx, cy - size);
  ctx.lineTo(cx, cy + size);
  ctx.stroke();
}

/** Draw noise texture (random dots) */
export function drawNoiseTexture(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  color: string,
  maxRadius: number = 1
): void {
  ctx.fillStyle = color;
  for (let i = 0; i < count; i++) {
    const nx = Math.random() * w;
    const ny = Math.random() * h;
    const nr = Math.random() * maxRadius + 0.5;
    ctx.beginPath();
    ctx.arc(nx, ny, nr, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Draw a gradient mesh background (2 overlapping radial gradients) */
export function drawGradientMesh(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  baseColor: string,
  accentColor: string,
  opacity: number = 0.15
): void {
  // Orb 1 — top-right
  const grad1 = ctx.createRadialGradient(
    w * 0.75,
    h * 0.25,
    0,
    w * 0.75,
    h * 0.25,
    w * 0.5
  );
  grad1.addColorStop(0, hexToRgba(accentColor, opacity));
  grad1.addColorStop(1, "transparent");
  ctx.fillStyle = grad1;
  ctx.fillRect(0, 0, w, h);

  // Orb 2 — bottom-left
  const grad2 = ctx.createRadialGradient(
    w * 0.25,
    h * 0.75,
    0,
    w * 0.25,
    h * 0.75,
    w * 0.4
  );
  grad2.addColorStop(0, hexToRgba(baseColor, opacity * 0.7));
  grad2.addColorStop(1, "transparent");
  ctx.fillStyle = grad2;
  ctx.fillRect(0, 0, w, h);
}

/** Draw a faint compositional grid */
export function drawCompositionalGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string = "rgba(255,255,255,0.03)"
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 0.5;
  // Rule of thirds
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo((w / 3) * i, 0);
    ctx.lineTo((w / 3) * i, h);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, (h / 3) * i);
    ctx.lineTo(w, (h / 3) * i);
    ctx.stroke();
  }
}

// ---------------------------------------------------------------------------
// Background & Overlay
// ---------------------------------------------------------------------------

/** Draw background image with cover-fit */
export function drawCoverImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  canvasW: number,
  canvasH: number,
  focalX: number = 0.5,
  focalY: number = 0.5
): void {
  const imgAspect = img.width / img.height;
  const canvasAspect = canvasW / canvasH;
  let sw: number, sh: number, sx: number, sy: number;

  if (imgAspect > canvasAspect) {
    sh = img.height;
    sw = sh * canvasAspect;
    sx = (img.width - sw) * focalX;
    sy = 0;
  } else {
    sw = img.width;
    sh = sw / canvasAspect;
    sx = 0;
    sy = (img.height - sh) * focalY;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvasW, canvasH);
}

/** Apply overlay types on canvas */
export function applyOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: string,
  color: string,
  intensity: number = 0.6
): void {
  const alpha = intensity;

  switch (type) {
    case "gradient-bottom": {
      const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, hexToRgba("#000000", alpha * 0.4));
      g.addColorStop(1, hexToRgba("#000000", alpha));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "gradient-top": {
      const g = ctx.createLinearGradient(0, 0, 0, h * 0.7);
      g.addColorStop(0, hexToRgba("#000000", alpha));
      g.addColorStop(0.5, hexToRgba("#000000", alpha * 0.4));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "gradient-left": {
      const g = ctx.createLinearGradient(0, 0, w * 0.7, 0);
      g.addColorStop(0, hexToRgba("#000000", alpha));
      g.addColorStop(0.5, hexToRgba("#000000", alpha * 0.3));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "gradient-right": {
      const g = ctx.createLinearGradient(w * 0.3, 0, w, 0);
      g.addColorStop(0, "transparent");
      g.addColorStop(0.5, hexToRgba("#000000", alpha * 0.3));
      g.addColorStop(1, hexToRgba("#000000", alpha));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "dark-vignette": {
      const g = ctx.createRadialGradient(
        w / 2,
        h / 2,
        w * 0.2,
        w / 2,
        h / 2,
        w * 0.7
      );
      g.addColorStop(0, "transparent");
      g.addColorStop(1, hexToRgba("#000000", alpha));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "light-frosted": {
      ctx.fillStyle = hexToRgba("#ffffff", alpha * 0.3);
      ctx.fillRect(0, 0, w, h);
      break;
    }
    case "color-wash": {
      ctx.fillStyle = hexToRgba(color, alpha * 0.4);
      ctx.fillRect(0, 0, w, h);
      break;
    }
    default: {
      const g = ctx.createLinearGradient(0, h * 0.4, 0, h);
      g.addColorStop(0, "transparent");
      g.addColorStop(1, hexToRgba("#000000", alpha * 0.7));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
  }
}

/** Draw design background for no-image mode */
export function drawDesignBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bgColor: string,
  accentColor: string
): void {
  // Solid base
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, w, h);

  // Gradient mesh
  drawGradientMesh(ctx, w, h, bgColor, accentColor, 0.15);

  // Noise texture
  drawNoiseTexture(ctx, w, h, 200, hexToRgba("#ffffff", 0.02));

  // Faint grid
  drawCompositionalGrid(ctx, w, h);
}

// ---------------------------------------------------------------------------
// AI Text Cleaning
// ---------------------------------------------------------------------------

/** Clean AI-generated text: strip markdown artifacts */
export function cleanAIText(s: string): string {
  return s
    .replace(/\*+/g, "")
    .replace(/^[\s_\-]+|[\s_\-]+$/g, "")
    .trim();
}
