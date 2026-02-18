import { create } from "zustand";
import { persist } from "zustand/middleware";

// =============================================================================
// DMSuite — Global Advanced Design Settings Store
// Persisted Zustand store powering the "Advanced Settings" panel across ALL
// canvas/document/print tool workspaces. Every setting defaults to a neutral
// value (1.0 / 0 / "normal") so existing rendering is unaffected unless a user
// explicitly tweaks a slider. Stored in localStorage under "dmsuite-advanced".
// =============================================================================

/* ── 1. Typography Settings ─────────────────────────────── */

export interface TypographySettings {
  /** Global heading scale (0.5 – 2.0, default 1.0) — multiplies all headings / names */
  headingScale: number;
  /** Global body text scale (0.5 – 1.8, default 1.0) — multiplies body / contact text */
  bodyScale: number;
  /** Global label/caption scale (0.5 – 1.6, default 1.0) — multiplies labels, taglines */
  labelScale: number;
  /** Letter spacing offset in px (−2 – 6, default 0) — added to computed tracking */
  letterSpacingOffset: number;
  /** Line height multiplier (0.8 – 2.5, default 1.0) — multiplies computed leading */
  lineHeightMultiplier: number;
  /** Paragraph spacing multiplier (0.5 – 3.0, default 1.0) — gap between text blocks */
  paragraphSpacing: number;
  /** Word spacing offset in px (−2 – 8, default 0) */
  wordSpacing: number;
  /** Text rendering mode */
  textRendering: "auto" | "sharp" | "smooth";
}

/* ── 2. Color & Effects Settings ────────────────────────── */

export interface ColorEffectsSettings {
  /** Global opacity for decorative elements (0.1 – 1.0, default 1.0) */
  decorativeOpacity: number;
  /** Pattern overlay opacity multiplier (0.1 – 2.0, default 1.0) — multiplies pattern opacity */
  patternOpacity: number;
  /** Divider / separator opacity (0.1 – 1.0, default 1.0) */
  dividerOpacity: number;
  /** Background overlay intensity (0.0 – 1.0, default 0.0 = off) */
  bgOverlayIntensity: number;
  /** Text shadow intensity (0.0 – 1.0, default 1.0 = normal) */
  textShadowIntensity: number;
  /** Border opacity (0.1 – 1.0, default 1.0) */
  borderOpacity: number;
  /** Gradient intensity (0.5 – 1.5, default 1.0) */
  gradientIntensity: number;
  /** Accent element brightness adjustment (−0.3 – 0.3, default 0) */
  accentBrightness: number;
}

/* ── 3. Spacing & Layout Settings ───────────────────────── */

export interface SpacingLayoutSettings {
  /** Horizontal margin multiplier (0.3 – 2.0, default 1.0) */
  marginHorizontal: number;
  /** Vertical margin multiplier (0.3 – 2.0, default 1.0) */
  marginVertical: number;
  /** Inner padding multiplier (0.3 – 2.0, default 1.0) */
  paddingMultiplier: number;
  /** Section gap multiplier (0.5 – 3.0, default 1.0) — space between major sections */
  sectionGap: number;
  /** Element gap multiplier (0.5 – 2.5, default 1.0) — space between individual items */
  elementGap: number;
  /** Content alignment bias (−50 – 50, default 0 = centered) — shifts content horizontally in px */
  contentOffsetX: number;
  /** Content vertical bias (−50 – 50, default 0) — shifts content vertically in px */
  contentOffsetY: number;
}

/* ── 4. Icon & Graphic Settings ─────────────────────────── */

export interface IconGraphicSettings {
  /** Contact icon size multiplier (0.4 – 2.0, default 1.0) */
  iconSizeScale: number;
  /** Icon stroke width multiplier (0.5 – 2.0, default 1.0) */
  iconStrokeScale: number;
  /** Icon-to-text gap multiplier (0.3 – 3.0, default 1.0) */
  iconGapScale: number;
  /** Logo size multiplier (0.3 – 2.0, default 1.0) */
  logoScale: number;
  /** QR code size multiplier (0.5 – 2.0, default 1.0) */
  qrScale: number;
  /** Seal / stamp size multiplier (0.5 – 2.0, default 1.0) */
  sealScale: number;
  /** Decorative shape size multiplier (0.3 – 2.0, default 1.0) */
  shapeScale: number;
}

/* ── 5. Border & Divider Settings ───────────────────────── */

export interface BorderDividerSettings {
  /** Border width multiplier (0.0 – 3.0, default 1.0, 0 = hidden) */
  borderWidthScale: number;
  /** Border corner radius multiplier (0.0 – 3.0, default 1.0) */
  borderRadiusScale: number;
  /** Divider thickness multiplier (0.3 – 3.0, default 1.0) */
  dividerThicknessScale: number;
  /** Divider width/length multiplier (0.3 – 2.0, default 1.0) */
  dividerLengthScale: number;
  /** Corner ornament size multiplier (0.0 – 2.0, default 1.0, 0 = hidden) */
  cornerOrnamentScale: number;
}

/* ── 6. Export & Quality Settings ───────────────────────── */

export interface ExportQualitySettings {
  /** Export DPI multiplier (1 = 300 DPI, 2 = 600 DPI, 3 = 900 DPI) */
  exportScale: 1 | 2 | 3;
  /** JPEG quality for raster exports (0.7 – 1.0, default 1.0 = max) */
  jpegQuality: number;
  /** Include bleed area in exports by default */
  includeBleed: boolean;
  /** Include crop marks in PDF by default */
  includeCropMarks: boolean;
  /** Default PDF margin in mm (0 – 20, default 3) */
  pdfMarginMm: number;
}

/* ── Composite Type ──────────────────────────────────────── */

export interface AdvancedDesignSettings {
  typography: TypographySettings;
  colorEffects: ColorEffectsSettings;
  spacing: SpacingLayoutSettings;
  iconGraphic: IconGraphicSettings;
  borderDivider: BorderDividerSettings;
  exportQuality: ExportQualitySettings;
}

/* ── Default Values ──────────────────────────────────────── */

export const DEFAULT_TYPOGRAPHY: TypographySettings = {
  headingScale: 1.0,
  bodyScale: 1.0,
  labelScale: 1.0,
  letterSpacingOffset: 0,
  lineHeightMultiplier: 1.0,
  paragraphSpacing: 1.0,
  wordSpacing: 0,
  textRendering: "auto",
};

export const DEFAULT_COLOR_EFFECTS: ColorEffectsSettings = {
  decorativeOpacity: 1.0,
  patternOpacity: 1.0,
  dividerOpacity: 1.0,
  bgOverlayIntensity: 0.0,
  textShadowIntensity: 1.0,
  borderOpacity: 1.0,
  gradientIntensity: 1.0,
  accentBrightness: 0,
};

export const DEFAULT_SPACING_LAYOUT: SpacingLayoutSettings = {
  marginHorizontal: 1.0,
  marginVertical: 1.0,
  paddingMultiplier: 1.0,
  sectionGap: 1.0,
  elementGap: 1.0,
  contentOffsetX: 0,
  contentOffsetY: 0,
};

export const DEFAULT_ICON_GRAPHIC: IconGraphicSettings = {
  iconSizeScale: 1.0,
  iconStrokeScale: 1.0,
  iconGapScale: 1.0,
  logoScale: 1.0,
  qrScale: 1.0,
  sealScale: 1.0,
  shapeScale: 1.0,
};

export const DEFAULT_BORDER_DIVIDER: BorderDividerSettings = {
  borderWidthScale: 1.0,
  borderRadiusScale: 1.0,
  dividerThicknessScale: 1.0,
  dividerLengthScale: 1.0,
  cornerOrnamentScale: 1.0,
};

export const DEFAULT_EXPORT_QUALITY: ExportQualitySettings = {
  exportScale: 1,   // 300 DPI — print-ready standard for business cards; user can raise to 2× or 3× if needed
  jpegQuality: 1.0,
  includeBleed: false,
  includeCropMarks: false,
  pdfMarginMm: 3,
};

export const DEFAULT_ADVANCED_SETTINGS: AdvancedDesignSettings = {
  typography: { ...DEFAULT_TYPOGRAPHY },
  colorEffects: { ...DEFAULT_COLOR_EFFECTS },
  spacing: { ...DEFAULT_SPACING_LAYOUT },
  iconGraphic: { ...DEFAULT_ICON_GRAPHIC },
  borderDivider: { ...DEFAULT_BORDER_DIVIDER },
  exportQuality: { ...DEFAULT_EXPORT_QUALITY },
};

/* ── Store Interface ─────────────────────────────────────── */

interface AdvancedSettingsState {
  settings: AdvancedDesignSettings;
  /** Deep-merge partial update into any section */
  update: (section: keyof AdvancedDesignSettings, partial: Record<string, unknown>) => void;
  /** Reset a single section to defaults */
  resetSection: (section: keyof AdvancedDesignSettings) => void;
  /** Reset everything to defaults */
  resetAll: () => void;
  /** Check if any setting differs from default */
  hasCustomSettings: () => boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_DEFAULTS: Record<keyof AdvancedDesignSettings, any> = {
  typography: DEFAULT_TYPOGRAPHY,
  colorEffects: DEFAULT_COLOR_EFFECTS,
  spacing: DEFAULT_SPACING_LAYOUT,
  iconGraphic: DEFAULT_ICON_GRAPHIC,
  borderDivider: DEFAULT_BORDER_DIVIDER,
  exportQuality: DEFAULT_EXPORT_QUALITY,
};

export const useAdvancedSettingsStore = create<AdvancedSettingsState>()(
  persist(
    (set, get) => ({
      settings: { ...DEFAULT_ADVANCED_SETTINGS },

      update: (section, partial) =>
        set((s) => ({
          settings: {
            ...s.settings,
            [section]: { ...s.settings[section], ...partial },
          },
        })),

      resetSection: (section) =>
        set((s) => ({
          settings: {
            ...s.settings,
            [section]: { ...SECTION_DEFAULTS[section] },
          },
        })),

      resetAll: () =>
        set({
          settings: {
            typography: { ...DEFAULT_TYPOGRAPHY },
            colorEffects: { ...DEFAULT_COLOR_EFFECTS },
            spacing: { ...DEFAULT_SPACING_LAYOUT },
            iconGraphic: { ...DEFAULT_ICON_GRAPHIC },
            borderDivider: { ...DEFAULT_BORDER_DIVIDER },
            exportQuality: { ...DEFAULT_EXPORT_QUALITY },
          },
        }),

      hasCustomSettings: () => {
        const s = get().settings;
        return JSON.stringify(s) !== JSON.stringify(DEFAULT_ADVANCED_SETTINGS);
      },
    }),
    { name: "dmsuite-advanced" }
  )
);
