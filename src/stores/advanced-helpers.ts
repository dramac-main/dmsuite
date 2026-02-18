// =============================================================================
// DMSuite — Advanced Settings Helpers
// Pure-function utilities that canvas renderers call to read the current global
// advanced-settings values. These do NOT import React or Zustand directly —
// they receive the settings object and return computed values.
//
// Usage in any workspace render function:
//   import { getAdvancedSettings } from "@/stores/advanced-settings";
//   const adv = getAdvancedSettings();    // reads current store snapshot
//   const fs = adv.scaledFontSize(24, "body");
//   const mx = adv.scaledMarginX(baseMargin);
// =============================================================================

import {
  useAdvancedSettingsStore,
  type AdvancedDesignSettings,
  DEFAULT_ADVANCED_SETTINGS,
} from "./advanced-settings";

/**
 * Snapshot reader — returns the current store value synchronously.
 * Safe to call from outside React (canvas render functions, pure helpers).
 * Falls back to defaults if store hasn't hydrated yet.
 */
export function getAdvancedSettings(): AdvancedDesignSettings {
  try {
    return useAdvancedSettingsStore.getState().settings;
  } catch {
    return DEFAULT_ADVANCED_SETTINGS;
  }
}

/* ── Typed convenience helpers ───────────────────────────── */

export type FontTier = "heading" | "body" | "label";

/**
 * Scale a base font size by the appropriate typography tier multiplier.
 */
export function scaledFontSize(base: number, tier: FontTier, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  const mult =
    tier === "heading" ? adv.typography.headingScale :
    tier === "body"    ? adv.typography.bodyScale :
                         adv.typography.labelScale;
  return Math.round(base * mult);
}

/**
 * Return final letter spacing for a given font size (adds user offset).
 */
export function scaledLetterSpacing(basePx: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return basePx + adv.typography.letterSpacingOffset;
}

/**
 * Return final line height multiplier.
 */
export function scaledLineHeight(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.typography.lineHeightMultiplier;
}

/**
 * Scale horizontal margin (e.g. W * 0.09 → multiplied by marginHorizontal).
 */
export function scaledMarginX(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.spacing.marginHorizontal;
}

/**
 * Scale vertical margin.
 */
export function scaledMarginY(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.spacing.marginVertical;
}

/**
 * Scale a gap between sections.
 */
export function scaledSectionGap(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.spacing.sectionGap;
}

/**
 * Scale element gap (between individual items in a list / row).
 */
export function scaledElementGap(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.spacing.elementGap;
}

/**
 * Scale content offset (additive, in px).
 */
export function contentOffset(s?: AdvancedDesignSettings): { x: number; y: number } {
  const adv = s ?? getAdvancedSettings();
  return { x: adv.spacing.contentOffsetX, y: adv.spacing.contentOffsetY };
}

/**
 * Scale icon size.
 */
export function scaledIconSize(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.iconSizeScale);
}

/**
 * Scale icon stroke width.
 */
export function scaledIconStroke(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.iconGraphic.iconStrokeScale;
}

/**
 * Scale icon-to-text gap.
 */
export function scaledIconGap(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.iconGapScale);
}

/**
 * Scale logo dimensions.
 */
export function scaledLogoSize(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.logoScale);
}

/**
 * Scale QR code dimensions.
 */
export function scaledQrSize(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.qrScale);
}

/**
 * Scale seal/stamp dimensions.
 */
export function scaledSealSize(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.sealScale);
}

/**
 * Scale decorative shapes (accent circles, geometric elements).
 */
export function scaledShapeSize(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.iconGraphic.shapeScale);
}

/**
 * Apply pattern opacity multiplier to a base opacity value.
 * Returns `base * globalMultiplier` (default multiplier = 1.0 = no change).
 */
export function getPatternOpacity(base: number = 0.06, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.colorEffects.patternOpacity;
}

/**
 * Scale decorative element opacity.
 */
export function getDecorativeOpacity(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.min(1, base * adv.colorEffects.decorativeOpacity);
}

/**
 * Scale divider opacity.
 */
export function getDividerOpacity(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.min(1, base * adv.colorEffects.dividerOpacity);
}

/**
 * Scale text shadow blur/offset.
 */
export function getTextShadowScale(s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return adv.colorEffects.textShadowIntensity;
}

/**
 * Scale border opacity.
 */
export function getBorderOpacity(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.min(1, base * adv.colorEffects.borderOpacity);
}

/**
 * Scale gradient intensity.
 */
export function getGradientIntensity(s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return adv.colorEffects.gradientIntensity;
}

/**
 * Scale border line width.
 */
export function scaledBorderWidth(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.borderDivider.borderWidthScale;
}

/**
 * Scale border radius.
 */
export function scaledBorderRadius(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.borderDivider.borderRadiusScale);
}

/**
 * Scale divider thickness.
 */
export function scaledDividerThickness(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return base * adv.borderDivider.dividerThicknessScale;
}

/**
 * Scale divider length.
 */
export function scaledDividerLength(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.borderDivider.dividerLengthScale);
}

/**
 * Scale corner ornament size.
 */
export function scaledCornerOrnament(base: number, s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return Math.round(base * adv.borderDivider.cornerOrnamentScale);
}

/**
 * Return export scale factor (1 = 300 DPI, 2 = 600 DPI, 3 = 900 DPI).
 */
export function getExportScale(s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return adv.exportQuality.exportScale;
}

/**
 * Return JPEG quality (0.7 – 1.0).
 */
export function getJpegQuality(s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return adv.exportQuality.jpegQuality;
}

/**
 * Return PDF margin in mm.
 */
export function getPdfMarginMm(s?: AdvancedDesignSettings): number {
  const adv = s ?? getAdvancedSettings();
  return adv.exportQuality.pdfMarginMm;
}

/**
 * Apply text rendering hints to a canvas context.
 */
export function applyTextRendering(ctx: CanvasRenderingContext2D, s?: AdvancedDesignSettings): void {
  const adv = s ?? getAdvancedSettings();
  switch (adv.typography.textRendering) {
    case "sharp":
      ctx.imageSmoothingEnabled = false;
      break;
    case "smooth":
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      break;
    default:
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      break;
  }
}

/**
 * Apply a full context setup for canvas rendering — call at the start of
 * any renderCard / useEffect before drawing.
 */
export function applyCanvasSettings(ctx: CanvasRenderingContext2D, s?: AdvancedDesignSettings): void {
  applyTextRendering(ctx, s);
}
