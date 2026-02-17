// =============================================================================
// DMSuite — Shared Template Renderers
// Pre-built visual template rendering functions that draw professional
// thumbnail previews for the TemplateSlider component.
// Each tool type provides its own set of template renderers.
// =============================================================================

import { hexToRgba, roundRect, lighten } from "./canvas-utils";
import { drawPattern, drawDivider, drawAccentLine, drawAccentCircle } from "./graphics-engine";

// ---------------------------------------------------------------------------
// Generic Template Thumbnail Helpers
// ---------------------------------------------------------------------------

/** Draw a basic card template thumbnail with header, body, accent */
export function drawCardThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    bgColor: string;
    primaryColor: string;
    accentColor: string;
    headerStyle: "left" | "centered" | "split" | "diagonal" | "gradient" | "minimal";
    showLogo?: boolean;
    showLines?: boolean;
  }
): void {
  const { bgColor, primaryColor, accentColor, headerStyle } = opts;

  // Background
  ctx.fillStyle = bgColor;
  roundRect(ctx, 0, 0, w, h, 4);
  ctx.fill();

  switch (headerStyle) {
    case "left":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w * 0.08, h);
      if (opts.showLogo) {
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(w * 0.08 + 12, 14, 6, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    case "centered":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w, h * 0.35);
      ctx.fillStyle = accentColor;
      ctx.fillRect(w * 0.35, h * 0.28, w * 0.3, 2);
      break;

    case "split":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w * 0.45, h);
      ctx.fillStyle = accentColor;
      ctx.fillRect(w * 0.45, 0, 2, h);
      break;

    case "diagonal": {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(w * 0.6, 0);
      ctx.lineTo(w * 0.4, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fillStyle = primaryColor;
      ctx.fill();
      ctx.restore();
      break;
    }

    case "gradient": {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, hexToRgba(accentColor, 0.5));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.4);
      break;
    }

    case "minimal":
      ctx.fillStyle = accentColor;
      ctx.fillRect(w * 0.1, h * 0.85, w * 0.25, 2);
      break;
  }

  // Content lines (text placeholders)
  if (opts.showLines !== false) {
    const lineColor = headerStyle === "split"
      ? (headerStyle === "split" ? "#ffffff" : primaryColor)
      : hexToRgba(primaryColor, 0.3);
    ctx.fillStyle = lineColor;
    const lineX = headerStyle === "left" ? w * 0.18 : headerStyle === "split" ? w * 0.55 : w * 0.12;
    const lineStartY = headerStyle === "centered" || headerStyle === "gradient" ? h * 0.45 : h * 0.25;

    // Title line
    ctx.globalAlpha = 0.8;
    roundRect(ctx, lineX, lineStartY, w * 0.5, 4, 2);
    ctx.fill();
    // Subtitle line
    ctx.globalAlpha = 0.4;
    roundRect(ctx, lineX, lineStartY + 10, w * 0.35, 3, 1.5);
    ctx.fill();
    // Body lines
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 3; i++) {
      roundRect(ctx, lineX, lineStartY + 24 + i * 8, w * (0.4 - i * 0.05), 2, 1);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

/** Draw a document template thumbnail (invoice, resume, letter, etc.) */
export function drawDocumentThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    primaryColor: string;
    headerStyle: "bar" | "strip" | "minimal" | "gradient" | "centered" | "sidebar";
    showPhoto?: boolean;
    showTable?: boolean;
    showSections?: number;
  }
): void {
  // White paper bg
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, 0, 0, w, h, 3);
  ctx.fill();

  // Paper shadow
  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 0.5;
  roundRect(ctx, 0, 0, w, h, 3);
  ctx.stroke();

  const { primaryColor, headerStyle } = opts;
  const m = 8; // margin

  switch (headerStyle) {
    case "bar":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w, h * 0.18);
      break;
    case "strip":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w * 0.07, h);
      break;
    case "gradient": {
      const grad = ctx.createLinearGradient(0, 0, w, 0);
      grad.addColorStop(0, primaryColor);
      grad.addColorStop(1, hexToRgba(primaryColor, 0.2));
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h * 0.15);
      break;
    }
    case "centered":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(w * 0.3, h * 0.04, w * 0.4, 2);
      break;
    case "sidebar":
      ctx.fillStyle = hexToRgba(primaryColor, 0.08);
      ctx.fillRect(0, 0, w * 0.3, h);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(0, 0, w * 0.3, h * 0.02);
      break;
    case "minimal":
      ctx.fillStyle = primaryColor;
      ctx.fillRect(m, h * 0.12, w * 0.2, 1.5);
      break;
  }

  // Photo placeholder
  if (opts.showPhoto) {
    const photoSize = Math.min(w, h) * 0.2;
    const px = headerStyle === "sidebar" ? w * 0.15 - photoSize / 2 : w - m - photoSize;
    const py = headerStyle === "bar" || headerStyle === "gradient" ? h * 0.05 : m;
    ctx.fillStyle = hexToRgba(primaryColor, 0.15);
    ctx.beginPath();
    ctx.arc(px + photoSize / 2, py + photoSize / 2, photoSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Content lines
  const contentStartY = headerStyle === "bar" || headerStyle === "gradient" ? h * 0.25 : h * 0.18;
  const contentX = headerStyle === "sidebar" || headerStyle === "strip"
    ? (headerStyle === "sidebar" ? w * 0.35 : w * 0.14)
    : m;

  ctx.fillStyle = "#94a3b8";
  const sections = opts.showSections ?? 3;
  for (let s = 0; s < sections; s++) {
    const sy = contentStartY + s * (h * 0.22);
    // Section title
    ctx.globalAlpha = 0.6;
    roundRect(ctx, contentX, sy, w * 0.3, 3, 1);
    ctx.fill();
    // Section lines
    ctx.globalAlpha = 0.2;
    for (let l = 0; l < 2; l++) {
      roundRect(ctx, contentX, sy + 8 + l * 6, w * (0.55 - l * 0.1), 2, 1);
      ctx.fill();
    }
  }

  // Table placeholder
  if (opts.showTable) {
    const ty = h * 0.55;
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = primaryColor;
    ctx.fillRect(contentX, ty, w - contentX - m, 3);
    ctx.globalAlpha = 0.05;
    for (let r = 0; r < 3; r++) {
      ctx.fillRect(contentX, ty + 6 + r * 8, w - contentX - m, 6);
    }
  }

  ctx.globalAlpha = 1;
}

/** Draw a certificate template thumbnail */
export function drawCertificateThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    primaryColor: string;
    borderStyle: "gold" | "silver" | "ornate" | "modern" | "minimal" | "bronze";
    showSeal?: boolean;
  }
): void {
  // Background
  ctx.fillStyle = "#fffef7";
  roundRect(ctx, 0, 0, w, h, 3);
  ctx.fill();

  const { primaryColor, borderStyle } = opts;

  // Border
  const bw = borderStyle === "ornate" ? 5 : borderStyle === "modern" ? 2 : 3;
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = bw;
  roundRect(ctx, bw, bw, w - bw * 2, h - bw * 2, 2);
  ctx.stroke();

  if (borderStyle === "ornate") {
    // Double border
    ctx.lineWidth = 1;
    roundRect(ctx, bw + 3, bw + 3, w - bw * 2 - 6, h - bw * 2 - 6, 1);
    ctx.stroke();
  }

  // Title area
  ctx.fillStyle = primaryColor;
  ctx.globalAlpha = 0.8;
  roundRect(ctx, w * 0.25, h * 0.15, w * 0.5, 4, 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  roundRect(ctx, w * 0.3, h * 0.25, w * 0.4, 2.5, 1);
  ctx.fill();

  // Divider
  ctx.globalAlpha = 0.3;
  drawDivider(ctx, w * 0.2, h * 0.35, w * 0.6, "ornate", primaryColor, 0.5);

  // Body lines
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#334155";
  roundRect(ctx, w * 0.2, h * 0.45, w * 0.6, 2, 1);
  ctx.fill();
  roundRect(ctx, w * 0.25, h * 0.52, w * 0.5, 2, 1);
  ctx.fill();

  // Signature lines
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = "#334155";
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  ctx.moveTo(w * 0.15, h * 0.8);
  ctx.lineTo(w * 0.4, h * 0.8);
  ctx.moveTo(w * 0.6, h * 0.8);
  ctx.lineTo(w * 0.85, h * 0.8);
  ctx.stroke();

  // Seal
  if (opts.showSeal !== false) {
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    const sealR = Math.min(w, h) * 0.08;
    ctx.arc(w * 0.5, h * 0.68, sealR, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 1;
}

/** Draw a menu template thumbnail */
export function drawMenuThumbnail(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  opts: {
    primaryColor: string;
    style: "elegant" | "rustic" | "modern" | "bistro" | "fine-dining" | "casual";
  }
): void {
  const { primaryColor, style } = opts;

  // Background
  const bgColors: Record<string, string> = {
    elegant: "#1a1a2e",
    rustic: "#2d1b0e",
    modern: "#0f172a",
    bistro: "#1c1917",
    "fine-dining": "#0a0a14",
    casual: "#fef9ef",
  };
  ctx.fillStyle = bgColors[style] || "#1a1a2e";
  roundRect(ctx, 0, 0, w, h, 3);
  ctx.fill();

  const textColor = style === "casual" ? "#1e293b" : "#ffffff";

  // Header
  ctx.fillStyle = textColor;
  ctx.globalAlpha = 0.8;
  roundRect(ctx, w * 0.25, h * 0.06, w * 0.5, 4, 2);
  ctx.fill();

  // Divider
  ctx.globalAlpha = 0.4;
  drawDivider(ctx, w * 0.2, h * 0.14, w * 0.6, style === "elegant" ? "ornate" : "gradient", primaryColor, 0.5);

  // Menu sections
  const sections = 3;
  for (let s = 0; s < sections; s++) {
    const sy = h * 0.2 + s * (h * 0.25);

    // Section header
    ctx.fillStyle = primaryColor;
    ctx.globalAlpha = 0.7;
    roundRect(ctx, w * 0.1, sy, w * 0.3, 3, 1);
    ctx.fill();

    // Items
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 2; i++) {
      const iy = sy + 8 + i * 10;
      roundRect(ctx, w * 0.1, iy, w * 0.5, 2, 1);
      ctx.fill();
      // Price
      roundRect(ctx, w * 0.75, iy, w * 0.12, 2, 1);
      ctx.fill();
    }

    // Dots separator (between name and price)
    ctx.globalAlpha = 0.1;
    for (let d = 0; d < 5; d++) {
      ctx.beginPath();
      ctx.arc(w * 0.63 + d * 5, sy + 9, 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 1;
}
