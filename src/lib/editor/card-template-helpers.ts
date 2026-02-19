// =============================================================================
// DMSuite — Business Card Template Helpers
// Infrastructure utilities for pixel-perfect template rendering.
// Provides shape builders, path generators, gradient helpers, back-side layout
// framework, logo treatment system, and fixed template color themes.
//
// This file is consumed by business-card-adapter.ts layout functions.
// =============================================================================

import type {
  LayerV2, PathCommand, Paint, GradientPaint, GradientStop,
  StrokeSpec, Matrix2D,
  TextLayerV2, ShapeLayerV2, PathLayerV2,
} from "./schema";
import {
  createPathLayerV2, createShapeLayerV2, createTextLayerV2,
  createImageLayerV2, createIconLayerV2,
  hexToRGBA, solidPaintHex,
} from "./schema";

// =============================================================================
// 1.  PATH COMMAND BUILDERS
// Fluent helpers to construct PathCommand[] arrays for complex shapes
// =============================================================================

/** Move to absolute position */
export function M(x: number, y: number): PathCommand { return { type: "M", x, y }; }

/** Line to absolute position */
export function L(x: number, y: number): PathCommand { return { type: "L", x, y }; }

/** Cubic bezier curve to (cp1 → cp2 → end) */
export function C(cp1x: number, cp1y: number, cp2x: number, cp2y: number, x: number, y: number): PathCommand {
  return { type: "C", cp1x, cp1y, cp2x, cp2y, x, y };
}

/** Quadratic bezier curve to (cp → end) */
export function Q(cpx: number, cpy: number, x: number, y: number): PathCommand {
  return { type: "Q", cpx, cpy, x, y };
}

/** Close path */
export function Z(): PathCommand { return { type: "Z" }; }

// =============================================================================
// 2.  POLYGON / SHAPE PATH GENERATORS
// Generate PathCommand[] for common geometric shapes
// =============================================================================

/**
 * Diagonal split — a polygon covering one side of a diagonal cut across the card.
 * Returns path commands for a quadrilateral from (x1,y1) to (x2,y2) covering
 * either the "top" or "bottom" portion.
 *
 * @param W - card width
 * @param H - card height
 * @param angle - diagonal angle in degrees (0 = horizontal, 90 = vertical)
 * @param offset - how far down (as 0–1 fraction of H) the diagonal starts on the left edge
 * @param side - "above" fills above the diagonal, "below" fills below
 */
export function diagonalSplitPath(
  W: number, H: number, angle: number, offset: number, side: "above" | "below"
): PathCommand[] {
  // The diagonal line goes from (0, offset*H) to (W, offset*H + W*tan(angle))
  const rad = (angle * Math.PI) / 180;
  const leftY = offset * H;
  const rightY = leftY + W * Math.tan(rad);

  if (side === "above") {
    return [M(0, 0), L(W, 0), L(W, rightY), L(0, leftY), Z()];
  }
  return [M(0, leftY), L(W, rightY), L(W, H), L(0, H), Z()];
}

/**
 * Chevron shape — a V-shaped polygon pointing left or right.
 * Creates the classic corporate chevron/arrow decorative element.
 */
export function chevronPath(
  x: number, y: number, w: number, h: number,
  depth: number, direction: "right" | "left" = "right"
): PathCommand[] {
  if (direction === "right") {
    return [
      M(x, y), L(x + w - depth, y), L(x + w, y + h / 2),
      L(x + w - depth, y + h), L(x, y + h), L(x + depth, y + h / 2), Z(),
    ];
  }
  return [
    M(x + depth, y), L(x + w, y), L(x + w - depth, y + h / 2),
    L(x + w, y + h), L(x + depth, y + h), L(x, y + h / 2), Z(),
  ];
}

/**
 * Zigzag edge — creates a zigzag/sawtooth border path along one edge.
 * Returns commands for a polygon with a zigzag on the specified side.
 */
export function zigzagEdgePath(
  x: number, y: number, w: number, h: number,
  teeth: number, toothDepth: number,
  edge: "top" | "bottom" | "left" | "right"
): PathCommand[] {
  const cmds: PathCommand[] = [];

  if (edge === "bottom") {
    cmds.push(M(x, y));
    cmds.push(L(x + w, y));
    cmds.push(L(x + w, y + h - toothDepth));
    const step = w / teeth;
    for (let i = teeth; i > 0; i--) {
      const tx = x + i * step;
      cmds.push(L(tx - step / 2, y + h));
      cmds.push(L(tx - step, y + h - toothDepth));
    }
    cmds.push(Z());
  } else if (edge === "right") {
    cmds.push(M(x, y));
    cmds.push(L(x + w - toothDepth, y));
    const step = h / teeth;
    for (let i = 0; i < teeth; i++) {
      const ty = y + i * step;
      cmds.push(L(x + w, ty + step / 2));
      cmds.push(L(x + w - toothDepth, ty + step));
    }
    cmds.push(L(x, y + h));
    cmds.push(Z());
  }
  // Add top/left variants as needed
  return cmds;
}

/**
 * Wave curve — generates a smooth sinusoidal wave path.
 * Useful for wave-gradient, flowing-lines templates.
 *
 * @param startX - start X coordinate
 * @param startY - baseline Y coordinate
 * @param endX - end X coordinate
 * @param amplitude - wave height (peak to trough)
 * @param periods - number of complete wave cycles
 * @param fillBelow - if true, closes path below to create a filled wave shape
 * @param fillY - Y coordinate for the bottom fill edge
 */
export function wavePath(
  startX: number, startY: number, endX: number,
  amplitude: number, periods: number,
  fillBelow = false, fillY = 0
): PathCommand[] {
  const cmds: PathCommand[] = [];
  const totalW = endX - startX;
  const segmentW = totalW / (periods * 2);

  cmds.push(M(startX, startY));

  for (let i = 0; i < periods * 2; i++) {
    const x1 = startX + i * segmentW;
    const x2 = x1 + segmentW;
    const dir = i % 2 === 0 ? -1 : 1;
    const peakY = startY + dir * amplitude;

    // Cubic bezier for smooth wave
    cmds.push(C(
      x1 + segmentW * 0.4, peakY,
      x2 - segmentW * 0.4, peakY,
      x2, startY,
    ));
  }

  if (fillBelow) {
    cmds.push(L(endX, fillY));
    cmds.push(L(startX, fillY));
    cmds.push(Z());
  }

  return cmds;
}

/**
 * City skyline silhouette — generates a jagged roofline path
 * for templates like skyline-silhouette, premium-crest.
 *
 * @param W - total width to span
 * @param baseY - the baseline Y (bottom of skyline)
 * @param minH - minimum building height (from baseY upward)
 * @param maxH - maximum building height
 * @param buildings - number of building segments
 * @param fillAbove - if true, fills from skyline up to y=0 (dark silhouette on top)
 */
export function skylinePath(
  W: number, baseY: number, minH: number, maxH: number,
  buildings: number, fillAbove = false
): PathCommand[] {
  const cmds: PathCommand[] = [];
  const bw = W / buildings;

  // Deterministic pseudo-random heights based on building index
  const heights = Array.from({ length: buildings }, (_, i) => {
    // Use a mix of sine waves for varied but reproducible heights
    const h = minH + (maxH - minH) * (
      0.5 + 0.3 * Math.sin(i * 2.7 + 0.5) + 0.2 * Math.sin(i * 1.3 + 2.1)
    );
    return Math.max(minH, Math.min(maxH, h));
  });

  if (fillAbove) {
    // Fill from top of canvas down through skyline to baseline
    cmds.push(M(0, 0));
    cmds.push(L(0, baseY - heights[0]));
    for (let i = 0; i < buildings; i++) {
      const x = i * bw;
      const topY = baseY - heights[i];
      cmds.push(L(x, topY));
      cmds.push(L(x + bw, topY));
    }
    cmds.push(L(W, 0));
    cmds.push(Z());
  } else {
    // Fill from skyline down to baseline
    cmds.push(M(0, baseY));
    cmds.push(L(0, baseY - heights[0]));
    for (let i = 0; i < buildings; i++) {
      const x = i * bw;
      const topY = baseY - heights[i];
      cmds.push(L(x, topY));
      cmds.push(L(x + bw, topY));
    }
    cmds.push(L(W, baseY));
    cmds.push(Z());
  }

  return cmds;
}

/**
 * Hexagon path at given center and radius.
 */
export function hexagonPath(cx: number, cy: number, radius: number): PathCommand[] {
  const cmds: PathCommand[] = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const px = cx + radius * Math.cos(angle);
    const py = cy + radius * Math.sin(angle);
    cmds.push(i === 0 ? M(px, py) : L(px, py));
  }
  cmds.push(Z());
  return cmds;
}

/**
 * Diamond path (rotated square) at given center and size.
 */
export function diamondPath(cx: number, cy: number, w: number, h: number): PathCommand[] {
  return [
    M(cx, cy - h / 2),
    L(cx + w / 2, cy),
    L(cx, cy + h / 2),
    L(cx - w / 2, cy),
    Z(),
  ];
}

/**
 * Circle approximation using 4 cubic bezier curves.
 * Useful when we need a circle as part of a compound path.
 */
export function circlePath(cx: number, cy: number, r: number): PathCommand[] {
  const k = r * 0.5522847498; // magic number for circle approximation
  return [
    M(cx, cy - r),
    C(cx + k, cy - r, cx + r, cy - k, cx + r, cy),
    C(cx + r, cy + k, cx + k, cy + r, cx, cy + r),
    C(cx - k, cy + r, cx - r, cy + k, cx - r, cy),
    C(cx - r, cy - k, cx - k, cy - r, cx, cy - r),
    Z(),
  ];
}

/**
 * Rounded rectangle using bezier curves (for use in compound paths).
 */
export function roundedRectPath(
  x: number, y: number, w: number, h: number, r: number
): PathCommand[] {
  const r2 = Math.min(r, w / 2, h / 2);
  return [
    M(x + r2, y),
    L(x + w - r2, y),
    Q(x + w, y, x + w, y + r2),
    L(x + w, y + h - r2),
    Q(x + w, y + h, x + w - r2, y + h),
    L(x + r2, y + h),
    Q(x, y + h, x, y + h - r2),
    L(x, y + r2),
    Q(x, y, x + r2, y),
    Z(),
  ];
}

/**
 * Corner bracket / L-shaped decorative mark.
 * Used in frame-minimal, gold-construct corner accents.
 *
 * @param corner - which corner: "tl" | "tr" | "br" | "bl"
 * @param x - corner position X
 * @param y - corner position Y
 * @param armLength - length of each arm
 * @param thickness - width of the bracket line
 */
export function cornerBracketPath(
  corner: "tl" | "tr" | "br" | "bl",
  x: number, y: number, armLength: number, thickness: number
): PathCommand[] {
  const a = armLength;
  const t = thickness;

  switch (corner) {
    case "tl": return [
      M(x, y + a), L(x, y), L(x + a, y),
      L(x + a, y + t), L(x + t, y + t), L(x + t, y + a), Z(),
    ];
    case "tr": return [
      M(x - a, y), L(x, y), L(x, y + a),
      L(x - t, y + a), L(x - t, y + t), L(x - a, y + t), Z(),
    ];
    case "br": return [
      M(x, y - a), L(x, y), L(x - a, y),
      L(x - a, y - t), L(x - t, y - t), L(x - t, y - a), Z(),
    ];
    case "bl": return [
      M(x + a, y), L(x, y), L(x, y - a),
      L(x + t, y - a), L(x + t, y - t), L(x + a, y - t), Z(),
    ];
  }
}

/**
 * Triangle path at given position.
 */
export function trianglePath(
  x: number, y: number, w: number, h: number,
  direction: "up" | "down" | "left" | "right" = "up"
): PathCommand[] {
  switch (direction) {
    case "up": return [M(x + w / 2, y), L(x + w, y + h), L(x, y + h), Z()];
    case "down": return [M(x, y), L(x + w, y), L(x + w / 2, y + h), Z()];
    case "left": return [M(x, y + h / 2), L(x + w, y), L(x + w, y + h), Z()];
    case "right": return [M(x, y), L(x + w, y + h / 2), L(x, y + h), Z()];
  }
}

// =============================================================================
// 3.  GRADIENT HELPERS
// =============================================================================

/**
 * Create a linear gradient paint with angle and color stops.
 * Enhanced version of the existing `lg()` helper with more flexibility.
 *
 * @param angleDeg - gradient angle in degrees (0 = right, 90 = down, 180 = left)
 * @param stops - array of [hexColor, offset (0-1), alpha?] tuples
 */
export function linearGradient(
  angleDeg: number,
  ...stops: [string, number, number?][]
): GradientPaint {
  const rad = (angleDeg * Math.PI) / 180;
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  return { kind: "gradient", gradientType: "linear", stops: gradStops, transform, spread: "pad" };
}

/**
 * Create a radial gradient paint.
 */
export function radialGradient(
  ...stops: [string, number, number?][]
): GradientPaint {
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [1, 0, 0, 1, 0, 0];
  return { kind: "gradient", gradientType: "radial", stops: gradStops, transform, spread: "pad" };
}

/**
 * Create a multi-stop linear gradient for complex color transitions.
 */
export function multiStopGradient(
  angleDeg: number,
  stops: Array<{ color: string; offset: number; alpha?: number }>
): GradientPaint {
  const rad = (angleDeg * Math.PI) / 180;
  const gradStops: GradientStop[] = stops.map(s => ({
    color: hexToRGBA(s.color, s.alpha ?? 1),
    offset: s.offset,
  }));
  const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  return { kind: "gradient", gradientType: "linear", stops: gradStops, transform, spread: "pad" };
}

// =============================================================================
// 4.  LAYER BUILDER SHORTCUTS
// Enhanced versions of the adapter's rect/textLayer with more options
// =============================================================================

/**
 * Create a path layer from PathCommand array.
 * This is the key building block for complex template shapes.
 */
export function pathLayer(opts: {
  name: string;
  x?: number; y?: number; w?: number; h?: number;
  commands: PathCommand[];
  fill?: Paint;
  stroke?: StrokeSpec;
  closed?: boolean;
  tags?: string[];
  opacity?: number;
  fillRule?: "nonzero" | "evenodd";
}): PathLayerV2 {
  const layer = createPathLayerV2({
    name: opts.name,
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    width: opts.w ?? 100,
    height: opts.h ?? 100,
    commands: opts.commands,
    fill: opts.fill,
    stroke: opts.stroke,
    closed: opts.closed ?? true,
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  if (opts.fillRule) layer.geometry.fillRule = opts.fillRule;
  return layer;
}

/**
 * Create a horizontal or vertical divider line using a thin rect.
 */
export function divider(opts: {
  name?: string;
  x: number; y: number;
  length: number;
  thickness?: number;
  color: string;
  alpha?: number;
  direction?: "horizontal" | "vertical";
  tags?: string[];
}): ShapeLayerV2 {
  const t = opts.thickness ?? 1.5;
  const isH = (opts.direction ?? "horizontal") === "horizontal";
  return createShapeLayerV2({
    name: opts.name ?? "Divider",
    x: opts.x,
    y: opts.y,
    width: isH ? opts.length : t,
    height: isH ? t : opts.length,
    shapeType: "rectangle",
    fill: solidPaintHex(opts.color, opts.alpha ?? 0.3),
    tags: opts.tags ?? ["decorative", "divider"],
  });
}

/**
 * Create a filled rectangle with optional stroke and corner radii.
 */
export function filledRect(opts: {
  name: string;
  x: number; y: number; w: number; h: number;
  fill: Paint;
  stroke?: StrokeSpec;
  radii?: [number, number, number, number];
  tags?: string[];
  opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    shapeType: "rectangle",
    fill: opts.fill,
    stroke: opts.stroke,
    cornerRadii: opts.radii,
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

/**
 * Create a filled ellipse.
 */
export function filledEllipse(opts: {
  name: string;
  cx: number; cy: number; rx: number; ry: number;
  fill: Paint;
  stroke?: StrokeSpec;
  tags?: string[];
  opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: opts.fill,
    stroke: opts.stroke,
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

/**
 * Create a stroke-only shape (no fill) — for frames, borders, outlines.
 */
export function strokeRect(opts: {
  name: string;
  x: number; y: number; w: number; h: number;
  color: string;
  width?: number;
  alpha?: number;
  radii?: [number, number, number, number];
  tags?: string[];
  opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    shapeType: "rectangle",
    fill: solidPaintHex("#000000", 0), // transparent fill
    stroke: {
      paint: solidPaintHex(opts.color, opts.alpha ?? 1),
      width: opts.width ?? 1,
      align: "center",
      dash: [],
      cap: "butt",
      join: "miter",
      miterLimit: 10,
    },
    cornerRadii: opts.radii,
    tags: opts.tags ?? ["decorative", "border"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

/**
 * Create a stroke-only ellipse (no fill).
 */
export function strokeEllipse(opts: {
  name: string;
  cx: number; cy: number; rx: number; ry: number;
  color: string;
  width?: number;
  alpha?: number;
  tags?: string[];
  opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: solidPaintHex("#000000", 0),
    stroke: {
      paint: solidPaintHex(opts.color, opts.alpha ?? 1),
      width: opts.width ?? 1,
      align: "center",
      dash: [],
      cap: "butt",
      join: "miter",
      miterLimit: 10,
    },
    tags: opts.tags ?? ["decorative", "border"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

// =============================================================================
// 5.  TYPOGRAPHY HELPERS
// =============================================================================

/**
 * Create a text layer with rich typography control.
 * Enhanced version that supports all the tracking/weight/case variations
 * needed by the 30 template specs.
 */
export function styledText(opts: {
  name: string;
  x: number; y: number; w: number; h?: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  weight?: number;
  color: string;
  alpha?: number;
  align?: "left" | "center" | "right";
  uppercase?: boolean;
  italic?: boolean;
  letterSpacing?: number;
  lineHeight?: number;
  tags: string[];
  autoFit?: boolean;
}): TextLayerV2 {
  const layer = createTextLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y,
    width: opts.w,
    height: opts.h ?? Math.round(opts.fontSize * 1.6),
    text: opts.text,
    fontSize: opts.fontSize,
    fontFamily: opts.fontFamily,
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

// =============================================================================
// 6.  FIXED TEMPLATE COLOR THEMES
// The actual colors from the reference images — NOT user-customizable defaults.
// Each template knows its exact design palette. User primaryColor/secondaryColor
// override only the accent elements, not the structural colors.
// =============================================================================

export interface TemplateColorTheme {
  /** Structural background colors (front side) */
  frontBg: string;
  /** Secondary/accent background (for split layouts) */
  frontBgAlt?: string;
  /** Primary text color on front */
  frontText: string;
  /** Secondary text color on front */
  frontTextAlt?: string;
  /** Accent/highlight color */
  accent: string;
  /** Secondary accent */
  accentAlt?: string;
  /** Back side background */
  backBg: string;
  /** Back side text color */
  backText: string;
  /** Back side accent */
  backAccent?: string;
  /** Divider/border color */
  divider?: string;
  /** Contact text color */
  contactText?: string;
  /** Contact icon color */
  contactIcon?: string;
}

/**
 * Fixed color themes for each template, derived from reference images.
 * These are the EXACT colors used in the pixel-perfect reference designs.
 *
 * Templates should use these as structural defaults. User cfg.primaryColor
 * only overrides elements tagged "accent" or "user-color-primary".
 */
export const TEMPLATE_FIXED_THEMES: Record<string, TemplateColorTheme> = {
  // ── Minimal ──
  "ultra-minimal": {
    frontBg: "#FFFFFF", frontText: "#1A1A1A", frontTextAlt: "#666666",
    accent: "#1A1A1A", backBg: "#1A1A1A", backText: "#FFFFFF",
    divider: "#C8C8C8", contactText: "#555555", contactIcon: "#888888",
  },
  "monogram-luxe": {
    frontBg: "#F5F5F0", frontText: "#1A1A1A", frontTextAlt: "#8A8A8A",
    accent: "#1A1A1A", backBg: "#1A1A1A", backText: "#F5F5F0",
    divider: "#D4D0C8", contactText: "#666666", contactIcon: "#999999",
  },
  "geometric-mark": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#E74C3C", backBg: "#1F2937", backText: "#FFFFFF",
    divider: "#E5E7EB", contactText: "#4B5563", contactIcon: "#6B7280",
  },
  "frame-minimal": {
    frontBg: "#FFFFFF", frontText: "#1F1F1F", frontTextAlt: "#717171",
    accent: "#E65100", accentAlt: "#FF8A50", backBg: "#1F1F1F", backText: "#FFFFFF",
    backAccent: "#E65100", divider: "#E0E0E0", contactText: "#555555",
  },
  "split-vertical": {
    frontBg: "#FFFFFF", frontBgAlt: "#1A1A2E", frontText: "#1A1A2E",
    frontTextAlt: "#FFFFFF", accent: "#C5A55A",
    backBg: "#1A1A2E", backText: "#FFFFFF", backAccent: "#C5A55A",
    divider: "#C5A55A", contactText: "#333333",
  },
  "diagonal-mono": {
    frontBg: "#FFFFFF", frontBgAlt: "#1A1A1A", frontText: "#1A1A1A",
    frontTextAlt: "#FFFFFF", accent: "#C5A55A",
    backBg: "#1A1A1A", backText: "#FFFFFF",
    divider: "#333333", contactText: "#555555",
  },

  // ── Modern ──
  "cyan-tech": {
    frontBg: "#0D1B2A", frontBgAlt: "#1B2838", frontText: "#FFFFFF",
    frontTextAlt: "#8ECAE6", accent: "#00BCD4",
    backBg: "#0D1B2A", backText: "#FFFFFF", backAccent: "#00BCD4",
    contactText: "#8ECAE6", contactIcon: "#00BCD4",
  },
  "corporate-chevron": {
    frontBg: "#1A2E4A", frontBgAlt: "#0F1E33", frontText: "#FFFFFF",
    frontTextAlt: "#8BB4E0", accent: "#3A7BD5",
    backBg: "#1A2E4A", backText: "#FFFFFF", backAccent: "#3A7BD5",
    contactText: "#B0C4DE", contactIcon: "#3A7BD5",
  },
  "zigzag-overlay": {
    frontBg: "#1A1A2E", frontBgAlt: "#2D2D5E", frontText: "#FFFFFF",
    frontTextAlt: "#A0A0CC", accent: "#5C6BC0",
    backBg: "#1A1A2E", backText: "#FFFFFF", backAccent: "#5C6BC0",
    contactText: "#B0B0DD",
  },
  "hex-split": {
    frontBg: "#FFFFFF", frontBgAlt: "#1565C0", frontText: "#1F2937",
    frontTextAlt: "#FFFFFF", accent: "#1565C0",
    backBg: "#1565C0", backText: "#FFFFFF",
    contactText: "#4B5563", contactIcon: "#1565C0",
  },
  "dot-circle": {
    frontBg: "#FFFFFF", frontText: "#1A1A1A", frontTextAlt: "#666666",
    accent: "#333333", backBg: "#333333", backText: "#FFFFFF",
    divider: "#CCCCCC", contactText: "#555555",
  },
  "wave-gradient": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#5E35B1", accentAlt: "#E8A735",
    backBg: "#5E35B1", backText: "#FFFFFF", backAccent: "#E8A735",
    contactText: "#4B5563",
  },

  // ── Classic / Corporate ──
  "circle-brand": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#1565C0", backBg: "#1565C0", backText: "#FFFFFF",
    contactText: "#4B5563", contactIcon: "#1565C0",
  },
  "full-color-back": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#1565C0", backBg: "#1565C0", backText: "#FFFFFF",
    contactText: "#4B5563",
  },
  "engineering-pro": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#0288D1", backBg: "#0288D1", backText: "#FFFFFF",
    contactText: "#4B5563", contactIcon: "#0288D1",
  },
  "clean-accent": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#E65100", accentAlt: "#FF8A50",
    backBg: "#FFFFFF", backText: "#1F2937", backAccent: "#E65100",
    divider: "#E0E0E0", contactText: "#555555",
  },
  "nature-clean": {
    frontBg: "#FFFFFF", frontText: "#2D3B2D", frontTextAlt: "#5A7A5A",
    accent: "#689F63", accentAlt: "#8BC34A",
    backBg: "#689F63", backText: "#FFFFFF",
    contactText: "#3A5A3A", contactIcon: "#689F63",
  },
  "diamond-brand": {
    frontBg: "#FFFFFF", frontText: "#1F2937", frontTextAlt: "#6B7280",
    accent: "#1565C0", accentAlt: "#E65100",
    backBg: "#1565C0", backText: "#FFFFFF",
    contactText: "#4B5563",
  },

  // ── Creative ──
  "flowing-lines": {
    frontBg: "#1B4332", frontBgAlt: "#2D6A4F", frontText: "#FFFFFF",
    frontTextAlt: "#A8D5BA", accent: "#2E7D32",
    backBg: "#1B4332", backText: "#FFFFFF", backAccent: "#52B788",
    contactText: "#A8D5BA", contactIcon: "#52B788",
  },
  "neon-watermark": {
    frontBg: "#F5F3F0", frontBgAlt: "#2B5F7F", frontText: "#2A2A2A",
    frontTextAlt: "#FFFFFF", accent: "#2B5F7F", accentAlt: "#C9A961",
    backBg: "#2B5F7F", backText: "#FFFFFF",
    contactText: "#333333", contactIcon: "#C9A961",
  },
  "blueprint-tech": {
    frontBg: "#6B6B6B", frontText: "#FFFFFF", frontTextAlt: "#D4D4D4",
    accent: "#E74C3C", backBg: "#FFFFFF", backText: "#333333",
    backAccent: "#6B6B6B", contactText: "#555555",
  },
  "skyline-silhouette": {
    frontBg: "#F5F5F5", frontBgAlt: "#1A1A1A", frontText: "#1A1A1A",
    frontTextAlt: "#666666", accent: "#333333",
    backBg: "#2C2C2C", backText: "#FFFFFF",
    divider: "#444444", contactText: "#CCCCCC",
  },
  "world-map": {
    frontBg: "#FFFFFF", frontText: "#2B5A9E", frontTextAlt: "#333333",
    accent: "#E67E22", accentAlt: "#2B5A9E",
    backBg: "#2B5A9E", backText: "#FFFFFF", backAccent: "#E67E22",
    contactText: "#555555", contactIcon: "#2B5A9E",
  },
  "diagonal-gold": {
    frontBg: "#1A4A47", frontText: "#FFFFFF", frontTextAlt: "#C9A961",
    accent: "#C9A961", backBg: "#1A4A47", backText: "#C9A961",
    backAccent: "#C9A961", divider: "#C9A961", contactText: "#C9A961",
    contactIcon: "#C9A961",
  },

  // ── Luxury ──
  "luxury-divider": {
    frontBg: "#F4D58D", frontText: "#1A4A5C", frontTextAlt: "#2B6A7C",
    accent: "#1A4A5C", backBg: "#1A4A5C", backText: "#F4D58D",
    backAccent: "#F4D58D", divider: "#1A4A5C", contactText: "#1A4A5C",
  },
  "social-band": {
    frontBg: "#3A5A4A", frontBgAlt: "#E8E6E1", frontText: "#FFFFFF",
    frontTextAlt: "#333333", accent: "#3A5A4A",
    backBg: "#3A5A4A", backText: "#FFFFFF",
    divider: "#333333", contactText: "#555555", contactIcon: "#3A5A4A",
  },
  "organic-pattern": {
    frontBg: "#4A5D52", frontBgAlt: "#FFFFFF", frontText: "#B8A882",
    frontTextAlt: "#6B7B73", accent: "#B8A882",
    backBg: "#4A5D52", backText: "#B8A882",
    divider: "#B8A882", contactText: "#6B7B73", contactIcon: "#B8A882",
  },
  "celtic-stripe": {
    frontBg: "#FFFFFF", frontText: "#1A1A1A", frontTextAlt: "#4A4A4A",
    accent: "#1A1A1A", backBg: "#2C2C2C", backText: "#FFFFFF",
    divider: "#999999", contactText: "#4A4A4A",
  },
  "premium-crest": {
    frontBg: "#1A1A1A", frontText: "#2A2A2A", frontTextAlt: "#F5F1E8",
    accent: "#F5F1E8", backBg: "#F5F1E8", backText: "#2A2A2A",
    backAccent: "#1A1A1A", contactText: "#4A4A4A", contactIcon: "#4A4A4A",
  },
  "gold-construct": {
    frontBg: "#404040", frontBgAlt: "#F5F5F5", frontText: "#FFFFFF",
    frontTextAlt: "#CCCCCC", accent: "#333333",
    backBg: "#2B2B2B", backText: "#FFFFFF", backAccent: "#CCCCCC",
    divider: "#DDDDDD", contactText: "#333333", contactIcon: "#333333",
  },
};

// =============================================================================
// 7.  LOGO TREATMENT SYSTEM
// Implements the 12 techniques from LOGO-TREATMENT-SYSTEM.md
// =============================================================================

export type LogoTechnique =
  | "T1"  // Direct placement
  | "T2"  // Monogram extraction
  | "T3"  // Container shape
  | "T4"  // Watermark
  | "T5"  // Split/partial reveal
  | "T6"  // Border integration
  | "T7"  // Icon substitution
  | "T8"  // Knockout/negative
  | "T9"  // Repeated pattern
  | "T10" // Custom complex
  | "T11" // Duo-position
  | "T12"; // Scale contrast

export type LogoComposition =
  | "separable"
  | "wordmark-only"
  | "lockup-inseparable"
  | "icon-only"
  | "emblem";

export interface LogoPlacementConfig {
  technique: LogoTechnique;
  /** Where the logo appears on the front side */
  front: {
    x: number;
    y: number;
    maxW: number;
    maxH: number;
    color: string;
    opacity?: number;
    /** Additional technique-specific rendering function */
    containerShape?: "circle" | "square" | "diamond" | "hexagon" | "rounded-rect";
    containerColor?: string;
    containerStroke?: string;
  } | null;
  /** Where the logo appears on the back side */
  back: {
    x: number;
    y: number;
    maxW: number;
    maxH: number;
    color: string;
    opacity?: number;
    containerShape?: "circle" | "square" | "diamond" | "hexagon" | "rounded-rect";
    containerColor?: string;
  } | null;
}

/**
 * Build logo layer(s) for a template using the specified technique.
 * Returns an array of layers (logo + optional container shape).
 */
export function buildTemplateLogoLayers(
  logoUrl: string | undefined,
  companyName: string,
  personName: string,
  config: LogoPlacementConfig,
  fontFamily: string,
): LayerV2[] {
  const layers: LayerV2[] = [];
  const placement = config.front; // or config.back depending on side
  if (!placement) return layers;

  const { x, y, maxW, maxH, color, opacity, containerShape, containerColor, containerStroke } = placement;

  // Container shape (if technique calls for it, e.g., T3)
  if (containerShape) {
    const containerFill = containerColor
      ? solidPaintHex(containerColor)
      : solidPaintHex("#000000", 0);
    const containerStrokePaint = containerStroke
      ? {
          paint: solidPaintHex(containerStroke),
          width: 2,
          align: "center" as const,
          dash: [] as number[],
          cap: "butt" as const,
          join: "miter" as const,
          miterLimit: 10,
        }
      : undefined;

    if (containerShape === "circle") {
      const r = Math.min(maxW, maxH) / 2;
      layers.push(filledEllipse({
        name: "Logo Container",
        cx: x + maxW / 2, cy: y + maxH / 2, rx: r, ry: r,
        fill: containerFill,
        stroke: containerStrokePaint,
        tags: ["logo-container", "branding"],
        opacity: opacity,
      }));
    } else if (containerShape === "square" || containerShape === "rounded-rect") {
      layers.push(filledRect({
        name: "Logo Container",
        x, y, w: maxW, h: maxH,
        fill: containerFill,
        stroke: containerStrokePaint,
        radii: containerShape === "rounded-rect" ? [8, 8, 8, 8] : undefined,
        tags: ["logo-container", "branding"],
        opacity: opacity,
      }));
    } else if (containerShape === "hexagon") {
      layers.push(pathLayer({
        name: "Logo Container",
        commands: hexagonPath(x + maxW / 2, y + maxH / 2, Math.min(maxW, maxH) / 2),
        fill: containerFill,
        tags: ["logo-container", "branding"],
        opacity: opacity,
      }));
    } else if (containerShape === "diamond") {
      layers.push(pathLayer({
        name: "Logo Container",
        commands: diamondPath(x + maxW / 2, y + maxH / 2, maxW, maxH),
        fill: containerFill,
        tags: ["logo-container", "branding"],
        opacity: opacity,
      }));
    }
  }

  // Logo image or fallback initials
  if (logoUrl) {
    layers.push(createImageLayerV2({
      name: "Logo",
      x: x + (containerShape ? maxW * 0.15 : 0),
      y: y + (containerShape ? maxH * 0.15 : 0),
      width: containerShape ? maxW * 0.7 : maxW,
      height: containerShape ? maxH * 0.7 : maxH,
      imageRef: logoUrl,
      fit: "contain",
      tags: ["logo", "branding"],
    }));
  } else {
    // Fallback: initials from company or person name
    const initials = (companyName || personName || "DM")
      .split(/\s+/)
      .map(w => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

    layers.push(styledText({
      name: "Logo Initials",
      x, y,
      w: maxW,
      h: maxH,
      text: initials,
      fontSize: Math.round(Math.min(maxW, maxH) * 0.38),
      fontFamily,
      weight: 700,
      color,
      align: "center",
      tags: ["logo", "branding", "logo-fallback"],
    }));
  }

  return layers;
}

/**
 * Build a watermark logo layer (T4 technique).
 * Large, low-opacity logo placed as background element.
 */
export function buildWatermarkLogo(
  logoUrl: string | undefined,
  companyName: string,
  x: number, y: number, size: number,
  color: string,
  opacity: number,
  fontFamily: string,
): LayerV2[] {
  const layers: LayerV2[] = [];

  if (logoUrl) {
    const imgLayer = createImageLayerV2({
      name: "Logo Watermark",
      x, y, width: size, height: size,
      imageRef: logoUrl,
      fit: "contain",
      tags: ["logo", "branding", "watermark", "decorative"],
    });
    imgLayer.opacity = opacity;
    layers.push(imgLayer);
  } else {
    const initials = (companyName || "DM")
      .split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
    const textLyr = styledText({
      name: "Logo Watermark",
      x, y, w: size, h: size,
      text: initials,
      fontSize: Math.round(size * 0.45),
      fontFamily,
      weight: 800,
      color,
      alpha: opacity,
      align: "center",
      tags: ["logo", "branding", "watermark", "decorative"],
    });
    layers.push(textLyr);
  }

  return layers;
}

// =============================================================================
// 8.  CONTACT LAYOUT VARIANTS
// Different contact information layouts beyond the standard vertical list
// =============================================================================

export interface ContactInfo {
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  linkedin?: string;
  twitter?: string;
  instagram?: string;
}

/**
 * Build contact info as a 3-column layout (like gold-construct front).
 * Each column has an icon + text, separated by vertical dividers.
 */
export function contactColumns(opts: {
  contacts: ContactInfo;
  x: number; y: number; w: number; h: number;
  columns: number;
  textColor: string;
  iconColor: string;
  dividerColor?: string;
  fontSize: number;
  fontFamily: string;
  showIcons?: boolean;
  tags?: string[];
}): LayerV2[] {
  const layers: LayerV2[] = [];
  const entries: Array<{ type: string; value: string; iconId: string }> = [];

  if (opts.contacts.phone) entries.push({ type: "phone", value: opts.contacts.phone, iconId: "phone" });
  if (opts.contacts.email) entries.push({ type: "email", value: opts.contacts.email, iconId: "email" });
  if (opts.contacts.website) entries.push({ type: "website", value: opts.contacts.website, iconId: "globe" });
  if (opts.contacts.address) entries.push({ type: "address", value: opts.contacts.address, iconId: "map-pin" });
  if (opts.contacts.linkedin) entries.push({ type: "linkedin", value: opts.contacts.linkedin, iconId: "linkedin" });
  if (opts.contacts.twitter) entries.push({ type: "twitter", value: opts.contacts.twitter, iconId: "twitter-x" });
  if (opts.contacts.instagram) entries.push({ type: "instagram", value: opts.contacts.instagram, iconId: "instagram" });

  const visible = entries.slice(0, opts.columns);
  if (visible.length === 0) return layers;

  const colW = opts.w / visible.length;
  const showIcons = opts.showIcons !== false;

  for (let i = 0; i < visible.length; i++) {
    const entry = visible[i];
    const colX = opts.x + i * colW;

    if (showIcons) {
      const iconSize = Math.round(opts.fontSize * 1.2);
      layers.push(createIconLayerV2({
        name: `${entry.type} Icon`,
        x: colX + colW / 2 - iconSize / 2,
        y: opts.y,
        size: iconSize,
        iconId: entry.iconId,
        color: hexToRGBA(opts.iconColor),
        tags: [`icon-${entry.type}`, "contact-icon", ...(opts.tags ?? [])],
      }));
    }

    layers.push(styledText({
      name: entry.type,
      x: colX,
      y: opts.y + (showIcons ? Math.round(opts.fontSize * 1.8) : 0),
      w: colW,
      text: entry.value,
      fontSize: opts.fontSize,
      fontFamily: opts.fontFamily,
      weight: 400,
      color: opts.textColor,
      align: "center",
      tags: [`contact-${entry.type}`, "contact-text", ...(opts.tags ?? [])],
    }));

    // Divider between columns (not after last)
    if (i < visible.length - 1 && opts.dividerColor) {
      layers.push(divider({
        name: `Column Divider ${i + 1}`,
        x: colX + colW - 0.5,
        y: opts.y,
        length: opts.h,
        thickness: 1,
        color: opts.dividerColor,
        alpha: 0.5,
        direction: "vertical",
        tags: ["decorative", "divider", ...(opts.tags ?? [])],
      }));
    }
  }

  return layers;
}

/**
 * Build contact info with icons on the left side and text aligned right.
 * Common in premium/luxury templates.
 */
export function contactWithIcons(opts: {
  contacts: ContactInfo;
  x: number; startY: number;
  lineGap: number;
  textColor: string;
  iconColor: string;
  fontSize: number;
  fontFamily: string;
  align?: "left" | "right";
  maxWidth?: number;
  tags?: string[];
}): LayerV2[] {
  const layers: LayerV2[] = [];
  const entries: Array<{ type: string; value: string; iconId: string }> = [];

  if (opts.contacts.phone) entries.push({ type: "phone", value: opts.contacts.phone, iconId: "phone" });
  if (opts.contacts.email) entries.push({ type: "email", value: opts.contacts.email, iconId: "email" });
  if (opts.contacts.website) entries.push({ type: "website", value: opts.contacts.website, iconId: "globe" });
  if (opts.contacts.address) entries.push({ type: "address", value: opts.contacts.address, iconId: "map-pin" });
  if (opts.contacts.linkedin) entries.push({ type: "linkedin", value: opts.contacts.linkedin, iconId: "linkedin" });
  if (opts.contacts.twitter) entries.push({ type: "twitter", value: opts.contacts.twitter, iconId: "twitter-x" });
  if (opts.contacts.instagram) entries.push({ type: "instagram", value: opts.contacts.instagram, iconId: "instagram" });

  const iconSize = Math.round(opts.fontSize * 0.9);
  const iconGap = Math.round(opts.fontSize * 0.5);
  const isRight = opts.align === "right";
  const maxW = opts.maxWidth ?? 400;

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const lineY = opts.startY + i * opts.lineGap;

    if (isRight) {
      // Icon on right of text
      layers.push(styledText({
        name: entry.type,
        x: opts.x - maxW,
        y: lineY,
        w: maxW - iconGap - iconSize,
        text: entry.value,
        fontSize: opts.fontSize,
        fontFamily: opts.fontFamily,
        weight: 400,
        color: opts.textColor,
        align: "right",
        tags: [`contact-${entry.type}`, "contact-text", ...(opts.tags ?? [])],
      }));

      layers.push(createIconLayerV2({
        name: `${entry.type} Icon`,
        x: opts.x - iconSize,
        y: lineY + (opts.fontSize - iconSize) / 2,
        size: iconSize,
        iconId: entry.iconId,
        color: hexToRGBA(opts.iconColor),
        tags: [`icon-${entry.type}`, "contact-icon", ...(opts.tags ?? [])],
      }));
    } else {
      // Icon on left of text
      layers.push(createIconLayerV2({
        name: `${entry.type} Icon`,
        x: opts.x,
        y: lineY + (opts.fontSize - iconSize) / 2,
        size: iconSize,
        iconId: entry.iconId,
        color: hexToRGBA(opts.iconColor),
        tags: [`icon-${entry.type}`, "contact-icon", ...(opts.tags ?? [])],
      }));

      layers.push(styledText({
        name: entry.type,
        x: opts.x + iconSize + iconGap,
        y: lineY,
        w: maxW,
        text: entry.value,
        fontSize: opts.fontSize,
        fontFamily: opts.fontFamily,
        weight: 400,
        color: opts.textColor,
        align: "left",
        tags: [`contact-${entry.type}`, "contact-text", ...(opts.tags ?? [])],
      }));
    }
  }

  return layers;
}

// =============================================================================
// 9.  TEMPLATE BACK-SIDE FRAMEWORK
// Each template needs its own back-side layout (not generic).
// This provides the structure for template-specific back layouts.
// =============================================================================

export type TemplateBackLayoutFn = (
  W: number, H: number,
  cfg: {
    name: string;
    company: string;
    tagline: string;
    contacts: ContactInfo;
    logoUrl?: string;
    fontFamily: string;
    showContactIcons: boolean;
    qrCodeUrl?: string;
  },
  theme: TemplateColorTheme,
) => LayerV2[];

/**
 * Registry of template-specific back-side layouts.
 * Each template ID maps to its own back layout function.
 * Falls back to a simple centered-logo layout if not defined.
 */
export const TEMPLATE_BACK_LAYOUTS: Record<string, TemplateBackLayoutFn> = {};

/**
 * Register a back-side layout for a template.
 * Called during template module initialization.
 */
export function registerBackLayout(templateId: string, fn: TemplateBackLayoutFn): void {
  TEMPLATE_BACK_LAYOUTS[templateId] = fn;
}

/**
 * Get the back-side layout function for a template.
 * Returns the template-specific layout or a generic fallback.
 */
export function getBackLayout(templateId: string): TemplateBackLayoutFn {
  return TEMPLATE_BACK_LAYOUTS[templateId] ?? defaultBackLayout;
}

/**
 * Default back-side layout — centered logo + company name + website.
 * Used as fallback until template-specific backs are implemented.
 */
const defaultBackLayout: TemplateBackLayoutFn = (W, H, cfg, theme) => {
  const layers: LayerV2[] = [];

  // Background
  layers.push(filledRect({
    name: "Back Background",
    x: 0, y: 0, w: W, h: H,
    fill: solidPaintHex(theme.backBg),
    tags: ["background", "back-element"],
  }));

  // Logo centered
  const logoSize = Math.min(W, H) * 0.22;
  layers.push(...buildTemplateLogoLayers(
    cfg.logoUrl,
    cfg.company,
    cfg.name,
    {
      technique: "T1",
      front: null,
      back: {
        x: W / 2 - logoSize / 2,
        y: H / 2 - logoSize / 2 - 20,
        maxW: logoSize,
        maxH: logoSize,
        color: theme.backText,
      },
    },
    cfg.fontFamily,
  ));

  // Company name
  layers.push(styledText({
    name: "Company",
    x: 0, y: H / 2 + logoSize / 2,
    w: W,
    text: cfg.company || "Company",
    fontSize: 18,
    fontFamily: cfg.fontFamily,
    weight: 500,
    color: theme.backText,
    alpha: 0.7,
    align: "center",
    tags: ["company", "back-element"],
  }));

  // Website
  if (cfg.contacts.website) {
    layers.push(styledText({
      name: "Website",
      x: 0, y: H / 2 + logoSize / 2 + 30,
      w: W,
      text: cfg.contacts.website,
      fontSize: 14,
      fontFamily: cfg.fontFamily,
      weight: 400,
      color: theme.backText,
      alpha: 0.5,
      align: "center",
      tags: ["contact-website", "back-element"],
    }));
  }

  return layers;
};

// =============================================================================
// 10. DECORATIVE ELEMENT BUILDERS
// Reusable decorative shapes used across multiple templates
// =============================================================================

/**
 * Create corner bracket decorations for all four corners.
 * Used by frame-minimal, gold-construct, and similar templates.
 */
export function fourCornerBrackets(
  W: number, H: number,
  inset: number, armLength: number, thickness: number,
  color: string, alpha?: number,
): LayerV2[] {
  const corners: Array<{ corner: "tl" | "tr" | "br" | "bl"; x: number; y: number }> = [
    { corner: "tl", x: inset, y: inset },
    { corner: "tr", x: W - inset, y: inset },
    { corner: "br", x: W - inset, y: H - inset },
    { corner: "bl", x: inset, y: H - inset },
  ];

  return corners.map(({ corner, x, y }) =>
    pathLayer({
      name: `Corner ${corner.toUpperCase()}`,
      commands: cornerBracketPath(corner, x, y, armLength, thickness),
      fill: solidPaintHex(color, alpha ?? 1),
      tags: ["decorative", "corner", "corner-bracket"],
    })
  );
}

/**
 * Create a horizontal accent bar (top or bottom of card).
 * Used by many templates for colored edge accents.
 */
export function accentBar(opts: {
  name?: string;
  position: "top" | "bottom";
  W: number; H: number;
  height: number;
  color: string;
  alpha?: number;
  insetX?: number;
}): ShapeLayerV2 {
  const inset = opts.insetX ?? 0;
  const y = opts.position === "top" ? 0 : opts.H - opts.height;
  return filledRect({
    name: opts.name ?? `${opts.position === "top" ? "Top" : "Bottom"} Accent Bar`,
    x: inset, y, w: opts.W - 2 * inset, h: opts.height,
    fill: solidPaintHex(opts.color, opts.alpha ?? 1),
    tags: ["decorative", "accent", "accent-bar"],
  });
}

/**
 * Create a vertical accent bar (left or right edge).
 */
export function verticalAccentBar(opts: {
  name?: string;
  position: "left" | "right";
  W: number; H: number;
  width: number;
  color: string;
  alpha?: number;
  insetY?: number;
}): ShapeLayerV2 {
  const inset = opts.insetY ?? 0;
  const x = opts.position === "left" ? 0 : opts.W - opts.width;
  return filledRect({
    name: opts.name ?? `${opts.position === "left" ? "Left" : "Right"} Accent Bar`,
    x, y: inset, w: opts.width, h: opts.H - 2 * inset,
    fill: solidPaintHex(opts.color, opts.alpha ?? 1),
    tags: ["decorative", "accent", "accent-bar"],
  });
}

/**
 * Build a dot grid pattern as path layers.
 * Used by dot-circle, blueprint-tech, and similar templates.
 */
export function dotGrid(opts: {
  x: number; y: number; w: number; h: number;
  spacingX: number; spacingY: number;
  radius: number;
  color: string;
  alpha?: number;
  tags?: string[];
}): PathLayerV2 {
  const cmds: PathCommand[] = [];
  const cols = Math.floor(opts.w / opts.spacingX);
  const rows = Math.floor(opts.h / opts.spacingY);

  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      const cx = opts.x + c * opts.spacingX;
      const cy = opts.y + r * opts.spacingY;
      // Small circle approximated as 4 points
      cmds.push(...circlePath(cx, cy, opts.radius));
    }
  }

  return pathLayer({
    name: "Dot Grid",
    commands: cmds,
    fill: solidPaintHex(opts.color, opts.alpha ?? 0.15),
    tags: opts.tags ?? ["decorative", "pattern", "dot-grid"],
    opacity: opts.alpha ?? 0.15,
  });
}

// =============================================================================
// 11. FONT FAMILY CONSTANTS
// Expanded font stacks for different template styles
// =============================================================================

export const FONT_STACKS = {
  /** Clean geometric sans — used by modern/minimal templates */
  geometric: "'Inter', 'SF Pro Display', 'Segoe UI', sans-serif",
  /** Condensed sans — used for wide-tracking headings */
  condensed: "'Inter', 'Roboto Condensed', 'Arial Narrow', sans-serif",
  /** Elegant serif — used by luxury/classic templates */
  serif: "'Playfair Display', 'Didot', 'Bodoni MT', serif",
  /** Traditional serif — used by corporate templates */
  classicSerif: "'Georgia', 'Garamond', 'Times New Roman', serif",
  /** Bold display — used by creative/bold templates */
  display: "'Montserrat', 'Arial Black', 'Impact', sans-serif",
  /** Minimal sans — used by Swiss-style templates */
  minimal: "'Helvetica Neue', 'Helvetica', Arial, sans-serif",
  /** Monospace — used for technical/blueprint templates */
  mono: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
} as const;

// =============================================================================
// 12. UTILITY FUNCTIONS
// =============================================================================

/**
 * Clamp a number between min and max.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Linearly interpolate between two values.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Convert a hex color string to an RGBA object with specified alpha.
 * Re-export for convenience in template files.
 */
export { hexToRGBA, solidPaintHex } from "./schema";

/**
 * Create a stroke spec helper.
 */
export function makeStroke(
  hex: string, width: number, alpha = 1,
  dash: number[] = []
): StrokeSpec {
  return {
    paint: solidPaintHex(hex, alpha),
    width,
    align: "center",
    dash,
    cap: "butt",
    join: "miter",
    miterLimit: 10,
  };
}

/**
 * Scale a value proportionally to card width (1050 = 1x).
 * Used for responsive element sizing.
 */
export function scaleW(value: number, W: number): number {
  return Math.round(value * (W / 1050));
}

/**
 * Scale a value proportionally to card height (600 = 1x).
 */
export function scaleH(value: number, H: number): number {
  return Math.round(value * (H / 600));
}

/**
 * Get the contact info from a CardConfig-like object.
 */
export function extractContacts(cfg: {
  phone?: string; email?: string; website?: string; address?: string;
  linkedin?: string; twitter?: string; instagram?: string;
}): ContactInfo {
  return {
    phone: cfg.phone || undefined,
    email: cfg.email || undefined,
    website: cfg.website || undefined,
    address: cfg.address || undefined,
    linkedin: cfg.linkedin || undefined,
    twitter: cfg.twitter || undefined,
    instagram: cfg.instagram || undefined,
  };
}
