// =============================================================================
// DMSuite — AI Design Rules Engine
// Professional foundational rules that govern what the AI can and cannot do.
// Encodes decades of graphic design knowledge: color harmony, typography,
// spacing, hierarchy, contrast, print safety, and composition rules.
//
// The AI MUST consult these rules before making any edit.
// The validator MUST reject edits that violate these rules.
// =============================================================================

import type { RGBA, TextStyle, LayerV2 } from "./schema";
import { rgbaToHex } from "./schema";

// ---------------------------------------------------------------------------
// 1. Color Science Rules
// ---------------------------------------------------------------------------

/** Convert RGBA to HSL */
export function rgbaToHSL(c: RGBA): { h: number; s: number; l: number } {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s, l };
}

/** WCAG 2.1 relative luminance */
export function relativeLuminance(c: RGBA): number {
  const srgb = [c.r, c.g, c.b].map(v => {
    const ch = v / 255;
    return ch <= 0.03928 ? ch / 12.92 : Math.pow((ch + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** WCAG contrast ratio (1:1 → 21:1) */
export function contrastRatio(c1: RGBA, c2: RGBA): number {
  const l1 = relativeLuminance(c1);
  const l2 = relativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** Check WCAG AA compliance for normal text (≥4.5:1) */
export function isWCAG_AA(foreground: RGBA, background: RGBA): boolean {
  return contrastRatio(foreground, background) >= 4.5;
}

/** Check WCAG AA compliance for large text (≥3:1) */
export function isWCAG_AA_Large(foreground: RGBA, background: RGBA): boolean {
  return contrastRatio(foreground, background) >= 3.0;
}

/** Check WCAG AAA compliance (≥7:1) */
export function isWCAG_AAA(foreground: RGBA, background: RGBA): boolean {
  return contrastRatio(foreground, background) >= 7.0;
}

/** Get readable text color (black or white) for any background */
export function getReadableColor(bg: RGBA): RGBA {
  return relativeLuminance(bg) > 0.179
    ? { r: 15, g: 23, b: 42, a: 1 }  // near-black
    : { r: 255, g: 255, b: 255, a: 1 }; // white
}

// -- Color Harmony --

export type HarmonyType = "complementary" | "analogous" | "triadic" | "split-complementary" | "tetradic" | "monochromatic";

/** Generate harmonious colors from a base color */
export function generateHarmony(base: RGBA, type: HarmonyType): RGBA[] {
  const { h, s, l } = rgbaToHSL(base);

  switch (type) {
    case "complementary":
      return [base, hslToRGBA((h + 180) % 360, s, l)];
    case "analogous":
      return [
        hslToRGBA((h + 330) % 360, s, l),
        base,
        hslToRGBA((h + 30) % 360, s, l),
      ];
    case "triadic":
      return [base, hslToRGBA((h + 120) % 360, s, l), hslToRGBA((h + 240) % 360, s, l)];
    case "split-complementary":
      return [base, hslToRGBA((h + 150) % 360, s, l), hslToRGBA((h + 210) % 360, s, l)];
    case "tetradic":
      return [base, hslToRGBA((h + 90) % 360, s, l), hslToRGBA((h + 180) % 360, s, l), hslToRGBA((h + 270) % 360, s, l)];
    case "monochromatic":
      return [
        hslToRGBA(h, s, Math.max(0.1, l - 0.3)),
        hslToRGBA(h, s, Math.max(0.1, l - 0.15)),
        base,
        hslToRGBA(h, s, Math.min(0.95, l + 0.15)),
        hslToRGBA(h, s, Math.min(0.95, l + 0.3)),
      ];
  }
}

function hslToRGBA(h: number, s: number, l: number): RGBA {
  h = ((h % 360) + 360) % 360;
  const a2 = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    return l - a2 * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return { r: Math.round(f(0) * 255), g: Math.round(f(8) * 255), b: Math.round(f(4) * 255), a: 1 };
}

/** Check if two colors "clash" (low saturation harmony distance) */
export function colorsClash(c1: RGBA, c2: RGBA): boolean {
  const h1 = rgbaToHSL(c1);
  const h2 = rgbaToHSL(c2);
  const hueDiff = Math.abs(h1.h - h2.h);
  const normalizedDiff = Math.min(hueDiff, 360 - hueDiff);
  // Colors in the 30-60° and 150-170° ranges often clash
  return (normalizedDiff > 30 && normalizedDiff < 60) ||
         (normalizedDiff > 150 && normalizedDiff < 170);
}

/** Professional palette: tint/shade ladder from a single color */
export function generateTintLadder(base: RGBA, steps = 10): RGBA[] {
  const { h, s } = rgbaToHSL(base);
  const result: RGBA[] = [];
  for (let i = 0; i < steps; i++) {
    const l = 0.05 + (0.9 / (steps - 1)) * i;
    result.push(hslToRGBA(h, s, l));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 2. Typography Rules
// ---------------------------------------------------------------------------

/** Modular scale ratios (named) */
export const MODULAR_SCALES = {
  "minor-second": 1.067,
  "major-second": 1.125,
  "minor-third": 1.2,
  "major-third": 1.25,
  "perfect-fourth": 1.333,
  "augmented-fourth": 1.414,
  "perfect-fifth": 1.5,
  "golden-ratio": 1.618,
} as const;

/** Generate a type scale from a base size */
export function generateTypeScale(
  baseFontSize: number,
  ratio: keyof typeof MODULAR_SCALES | number = "perfect-fourth",
  steps = 7
): number[] {
  const r = typeof ratio === "number" ? ratio : MODULAR_SCALES[ratio];
  const scale: number[] = [];
  for (let i = -2; i <= steps - 3; i++) {
    scale.push(Math.round(baseFontSize * Math.pow(r, i)));
  }
  return scale;
}

/** Minimum font sizes for readability */
export const MIN_FONT_SIZES = {
  screen: { body: 14, caption: 11, heading: 18 },
  print300dpi: { body: 8, caption: 6, heading: 12 },
  print600dpi: { body: 6, caption: 5, heading: 10 },
} as const;

/** Recommended line-height ranges */
export const LINE_HEIGHT_RANGES = {
  heading: { min: 1.1, ideal: 1.2, max: 1.4 },
  body: { min: 1.3, ideal: 1.5, max: 1.8 },
  caption: { min: 1.2, ideal: 1.4, max: 1.6 },
} as const;

/** Recommended letter-spacing by size tier */
export function recommendedLetterSpacing(fontSize: number): number {
  if (fontSize >= 48) return -0.5; // tight for large display
  if (fontSize >= 24) return 0;     // normal for headings
  if (fontSize >= 14) return 0.25;  // slight open for body
  return 0.5;                        // open for small text
}

/** Check if text style has good readability */
export function checkTextReadability(style: TextStyle, canvasDPI: number): string[] {
  const issues: string[] = [];
  const isPrint = canvasDPI >= 300;
  const limits = isPrint ? MIN_FONT_SIZES.print300dpi : MIN_FONT_SIZES.screen;

  if (style.fontSize < limits.body) {
    issues.push(`Font size ${style.fontSize}px is below minimum readable size (${limits.body}px)`);
  }
  if (style.lineHeight < LINE_HEIGHT_RANGES.body.min) {
    issues.push(`Line height ${style.lineHeight} is too tight for readability`);
  }
  if (style.lineHeight > LINE_HEIGHT_RANGES.body.max) {
    issues.push(`Line height ${style.lineHeight} is too loose — text appears disconnected`);
  }
  return issues;
}

// ---------------------------------------------------------------------------
// 3. Spacing & Layout Rules
// ---------------------------------------------------------------------------

/** 8px grid system (base spacing unit) */
export const SPACING_UNIT = 8;

/** Snap a value to the nearest spacing unit */
export function snapToGrid(value: number, gridSize = SPACING_UNIT): number {
  return Math.round(value / gridSize) * gridSize;
}

/** Golden ratio constant */
export const GOLDEN_RATIO = 1.618;

/** Calculate golden-ratio split for a dimension */
export function goldenSplit(total: number): { major: number; minor: number } {
  const major = total / GOLDEN_RATIO;
  return { major, minor: total - major };
}

/** Minimum margins for print (in mm) */
export const PRINT_MARGINS = {
  businessCard: { safe: 3, bleed: 3 },
  flyer: { safe: 5, bleed: 3 },
  poster: { safe: 10, bleed: 5 },
  letter: { safe: 12.7, bleed: 3 }, // 0.5 inch
  a4: { safe: 10, bleed: 3 },
} as const;

/** Rule of thirds: get intersection points for a canvas */
export function ruleOfThirds(w: number, h: number): Vec2[] {
  return [
    { x: w / 3, y: h / 3 },
    { x: (2 * w) / 3, y: h / 3 },
    { x: w / 3, y: (2 * h) / 3 },
    { x: (2 * w) / 3, y: (2 * h) / 3 },
  ];
}

/** Check if a layer violates safe area (for print tools) */
export function isInSafeArea(
  layerX: number, layerY: number, layerW: number, layerH: number,
  canvasW: number, canvasH: number, safeMarginPx: number
): boolean {
  return (
    layerX >= safeMarginPx &&
    layerY >= safeMarginPx &&
    layerX + layerW <= canvasW - safeMarginPx &&
    layerY + layerH <= canvasH - safeMarginPx
  );
}

// ---------------------------------------------------------------------------
// 4. Visual Hierarchy Rules
// ---------------------------------------------------------------------------

/** Hierarchy levels with recommended properties */
export const HIERARCHY_LEVELS = {
  primary: { fontWeightMin: 600, fontSizeRatioMin: 2.0, description: "Main headline / hero" },
  secondary: { fontWeightMin: 500, fontSizeRatioMin: 1.4, description: "Subheading / section title" },
  tertiary: { fontWeightMin: 400, fontSizeRatioMin: 1.0, description: "Body text / content" },
  quaternary: { fontWeightMin: 400, fontSizeRatioMin: 0.8, description: "Caption / label / fine print" },
} as const;

/** Score visual weight of a layer (0-100) for hierarchy analysis */
export function visualWeight(layer: LayerV2): number {
  let weight = 0;

  // Size contributes to weight
  const area = layer.transform.size.x * layer.transform.size.y;
  weight += Math.min(30, area / 10000);

  // Opacity
  weight *= layer.opacity;

  // Text-specific: bold text is heavier
  if (layer.type === "text") {
    const t = layer as import("./schema").TextLayerV2;
    weight += (t.defaultStyle.fontWeight / 900) * 20;
    weight += Math.min(20, t.defaultStyle.fontSize / 2);
    if (t.defaultStyle.uppercase) weight += 5;
  }

  // Images are heavy
  if (layer.type === "image") weight += 25;

  // Dark fills are heavier than light
  if (layer.type === "shape") {
    const s = layer as import("./schema").ShapeLayerV2;
    if (s.fills.length > 0 && s.fills[0].kind === "solid") {
      const lum = relativeLuminance(s.fills[0].color);
      weight += (1 - lum) * 15;
    }
  }

  return Math.min(100, weight);
}

// ---------------------------------------------------------------------------
// 5. Composition Rules
// ---------------------------------------------------------------------------

/** Check overall design balance (returns -1 to 1; 0 = balanced) */
export function calculateBalance(layers: LayerV2[], canvasW: number, canvasH: number): { horizontal: number; vertical: number } {
  const midX = canvasW / 2;
  const midY = canvasH / 2;
  let leftWeight = 0, rightWeight = 0, topWeight = 0, bottomWeight = 0;

  for (const layer of layers) {
    const w = visualWeight(layer);
    const cx = layer.transform.position.x + layer.transform.size.x / 2;
    const cy = layer.transform.position.y + layer.transform.size.y / 2;

    if (cx < midX) leftWeight += w;
    else rightWeight += w;

    if (cy < midY) topWeight += w;
    else bottomWeight += w;
  }

  const totalH = leftWeight + rightWeight || 1;
  const totalV = topWeight + bottomWeight || 1;

  return {
    horizontal: (rightWeight - leftWeight) / totalH,
    vertical: (bottomWeight - topWeight) / totalV,
  };
}

// ---------------------------------------------------------------------------
// 6. Print Production Rules
// ---------------------------------------------------------------------------

/** Standard business card sizes (in mm) */
export const STANDARD_SIZES = {
  businessCard: { w: 89, h: 51, name: "US Business Card" },
  businessCardEU: { w: 85, h: 55, name: "EU Business Card" },
  a4: { w: 210, h: 297, name: "A4" },
  a5: { w: 148, h: 210, name: "A5" },
  letter: { w: 216, h: 279, name: "US Letter" },
  flyer: { w: 216, h: 279, name: "Flyer (Letter)" },
  poster18x24: { w: 457, h: 610, name: "Poster 18×24" },
  poster24x36: { w: 610, h: 914, name: "Poster 24×36" },
} as const;

/** Convert mm to pixels at a given DPI */
export function mmToPx(mm: number, dpi: number): number {
  return Math.round((mm / 25.4) * dpi);
}

/** Convert pixels to mm at a given DPI */
export function pxToMm(px: number, dpi: number): number {
  return (px / dpi) * 25.4;
}

// ---------------------------------------------------------------------------
// 7. Validation — Master rule checker
// ---------------------------------------------------------------------------

export interface RuleViolation {
  rule: string;
  severity: "error" | "warning" | "info";
  message: string;
  layerId?: string;
  suggestion?: string;
}

/** Run all design rules against a set of layers + canvas */
export function validateDesign(
  layers: LayerV2[],
  canvasW: number, canvasH: number,
  dpi: number,
  bgColor?: RGBA
): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const bg = bgColor ?? { r: 255, g: 255, b: 255, a: 1 };
  const isPrint = dpi >= 300;

  for (const layer of layers) {
    // Text readability
    if (layer.type === "text") {
      const t = layer as import("./schema").TextLayerV2;
      const textColor = t.defaultStyle.fill.kind === "solid" ? t.defaultStyle.fill.color : null;

      if (textColor) {
        if (!isWCAG_AA(textColor, bg)) {
          violations.push({
            rule: "contrast",
            severity: "error",
            message: `Text "${t.text.substring(0, 30)}..." has insufficient contrast (${contrastRatio(textColor, bg).toFixed(1)}:1)`,
            layerId: layer.id,
            suggestion: `Change text color to ${rgbaToHex(getReadableColor(bg))} or adjust the background`,
          });
        }
      }

      const readabilityIssues = checkTextReadability(t.defaultStyle, dpi);
      for (const issue of readabilityIssues) {
        violations.push({
          rule: "typography",
          severity: "warning",
          message: issue,
          layerId: layer.id,
        });
      }
    }

    // Out-of-bounds check
    const { position, size } = layer.transform;
    if (position.x + size.x < 0 || position.y + size.y < 0 || position.x > canvasW || position.y > canvasH) {
      violations.push({
        rule: "bounds",
        severity: "warning",
        message: `Layer "${layer.name}" is completely outside the canvas`,
        layerId: layer.id,
        suggestion: "Move it back into the visible area or delete it",
      });
    }

    // Print safe area check
    if (isPrint) {
      const safePx = mmToPx(3, dpi); // 3mm standard safe area
      if (!isInSafeArea(position.x, position.y, size.x, size.y, canvasW, canvasH, safePx)) {
        if (layer.type === "text") {
          violations.push({
            rule: "print-safety",
            severity: "warning",
            message: `Text "${(layer as import("./schema").TextLayerV2).text.substring(0, 20)}..." extends into the trim zone — may be cut off during printing`,
            layerId: layer.id,
            suggestion: `Move at least ${Math.round(pxToMm(safePx, dpi))}mm from the edge`,
          });
        }
      }
    }
  }

  // Overall balance check
  const balance = calculateBalance(layers, canvasW, canvasH);
  if (Math.abs(balance.horizontal) > 0.6) {
    violations.push({
      rule: "composition",
      severity: "info",
      message: `Design is heavily ${balance.horizontal > 0 ? "right" : "left"}-weighted (${Math.round(Math.abs(balance.horizontal) * 100)}%)`,
      suggestion: "Consider rebalancing visual weight across the horizontal axis",
    });
  }
  if (Math.abs(balance.vertical) > 0.6) {
    violations.push({
      rule: "composition",
      severity: "info",
      message: `Design is heavily ${balance.vertical > 0 ? "bottom" : "top"}-weighted (${Math.round(Math.abs(balance.vertical) * 100)}%)`,
      suggestion: "Consider rebalancing visual weight across the vertical axis",
    });
  }

  return violations;
}

// ---------------------------------------------------------------------------
// 8. AI-specific: Property ranges & constraints
// ---------------------------------------------------------------------------

/** Allowed ranges for numeric properties (AI must stay within these) */
export const PROPERTY_RANGES = {
  opacity: { min: 0, max: 1 },
  fontSize: { min: 4, max: 800 },
  fontWeight: { min: 100, max: 900, step: 100 },
  letterSpacing: { min: -5, max: 20 },
  lineHeight: { min: 0.8, max: 3.0 },
  rotation: { min: -360, max: 360 },
  cornerRadius: { min: 0, max: 500 },
  strokeWidth: { min: 0, max: 50 },
  blurRadius: { min: 0, max: 100 },
  colorChannel: { min: 0, max: 255 },
  colorAlpha: { min: 0, max: 1 },
  position: { min: -10000, max: 10000 },
  size: { min: 1, max: 10000 },
} as const;

/** Validate a numeric value against allowed ranges */
export function clampToRange(
  value: number,
  property: keyof typeof PROPERTY_RANGES
): number {
  const range = PROPERTY_RANGES[property];
  let clamped = Math.max(range.min, Math.min(range.max, value));
  if ("step" in range) {
    clamped = Math.round(clamped / (range as { step: number }).step) * (range as { step: number }).step;
  }
  return clamped;
}

// Re-export Vec2 for convenience
type Vec2 = import("./schema").Vec2;
