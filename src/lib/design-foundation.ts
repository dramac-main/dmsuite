// =============================================================================
// DMSuite — Design Foundation Rules
// Professional design principles encoded as composable rules that guide
// all automated layout generation. Based on industry-standard graphic design
// practices: grid systems, typographic scale, visual hierarchy, spacing,
// composition, and brand consistency.
// =============================================================================

import type { FontStyle } from "./canvas-utils";
import {
  type Layer,
  type TextLayer,
  type CtaLayer,
  createTextLayer,
  createCtaLayer,
  renderLayer,
} from "./canvas-layers";

// ---------------------------------------------------------------------------
// 1. Grid System — Margins, Gutters, Columns
// ---------------------------------------------------------------------------

export interface GridSystem {
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Outer margin as fraction of smallest dimension */
  marginRatio: number;
  /** Computed margins in pixels */
  margin: { top: number; right: number; bottom: number; left: number };
  /** Safe area (content zone) */
  safeArea: { x: number; y: number; width: number; height: number };
  /** Column system */
  columns: number;
  gutter: number;
  /** Computed column widths */
  columnWidth: number;
}

export function createGrid(
  width: number,
  height: number,
  opts?: { marginRatio?: number; columns?: number }
): GridSystem {
  const minDim = Math.min(width, height);
  const marginRatio = opts?.marginRatio ?? 0.06;
  const margin = Math.round(minDim * marginRatio);
  const columns = opts?.columns ?? 12;
  const gutter = Math.round(minDim * 0.015);

  const safeW = width - margin * 2;
  const safeH = height - margin * 2;
  const columnWidth = (safeW - gutter * (columns - 1)) / columns;

  return {
    width,
    height,
    marginRatio,
    margin: { top: margin, right: margin, bottom: margin, left: margin },
    safeArea: { x: margin, y: margin, width: safeW, height: safeH },
    columns,
    gutter,
    columnWidth,
  };
}

/** Get x position for spanning N columns starting at column start (0-based) */
export function getColumnX(grid: GridSystem, start: number): number {
  return (
    grid.margin.left + start * (grid.columnWidth + grid.gutter)
  );
}

/** Get width for spanning N columns */
export function getColumnSpan(grid: GridSystem, span: number): number {
  return span * grid.columnWidth + (span - 1) * grid.gutter;
}

// ---------------------------------------------------------------------------
// 2. Typographic Scale — Modular Scale for Size Hierarchy
// ---------------------------------------------------------------------------

export interface TypographicScale {
  /** Display headline — largest, max impact */
  display: number;
  /** Primary headline */
  h1: number;
  /** Secondary headline */
  h2: number;
  /** Tertiary headline / subheading */
  h3: number;
  /** Body / description */
  body: number;
  /** Caption / small text */
  caption: number;
  /** Label / overline (small caps) */
  label: number;
}

/** Generate a modular typographic scale from base size and ratio */
export function createTypographicScale(
  baseSize: number,
  ratio: number = 1.333
): TypographicScale {
  return {
    display: Math.round(baseSize * ratio * ratio * ratio * ratio),
    h1: Math.round(baseSize * ratio * ratio * ratio),
    h2: Math.round(baseSize * ratio * ratio),
    h3: Math.round(baseSize * ratio),
    body: Math.round(baseSize),
    caption: Math.round(baseSize / ratio),
    label: Math.round(baseSize / ratio / ratio) + 1,
  };
}

/** Get typographic scale based on canvas dimensions */
export function getScaleForSize(
  width: number,
  height: number
): TypographicScale {
  const minDim = Math.min(width, height);
  // Base size proportional to canvas — ensures readability at any resolution
  const base = Math.max(14, Math.round(minDim * 0.022));
  return createTypographicScale(base, 1.333);
}

// ---------------------------------------------------------------------------
// 3. Visual Hierarchy Rules
// ---------------------------------------------------------------------------

export interface VisualHierarchy {
  /** Primary element (headline) — maximum visual weight */
  primary: {
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    color: string;
  };
  /** Secondary element (subheading) — supporting */
  secondary: {
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    color: string;
  };
  /** Tertiary (body/description) — readable but understated */
  tertiary: {
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    color: string;
  };
  /** Accent (label/overline) — small, tracked wide */
  accent: {
    fontSize: number;
    fontWeight: number;
    letterSpacing: number;
    color: string;
  };
}

export function createHierarchy(
  scale: TypographicScale,
  textColor: string,
  accentColor: string
): VisualHierarchy {
  return {
    primary: {
      fontSize: scale.h1,
      fontWeight: 800,
      letterSpacing: -1.5,
      color: textColor,
    },
    secondary: {
      fontSize: scale.h3,
      fontWeight: 400,
      letterSpacing: 0,
      color: textColor + "cc", // 80% opacity
    },
    tertiary: {
      fontSize: scale.body,
      fontWeight: 300,
      letterSpacing: 0.2,
      color: textColor + "99", // 60% opacity
    },
    accent: {
      fontSize: scale.label,
      fontWeight: 600,
      letterSpacing: 3,
      color: accentColor,
    },
  };
}

// ---------------------------------------------------------------------------
// 4. Spacing System — Consistent Spacing Tokens
// ---------------------------------------------------------------------------

export interface SpacingSystem {
  /** Extra-small spacing */
  xs: number;
  /** Small spacing */
  sm: number;
  /** Medium spacing */
  md: number;
  /** Large spacing */
  lg: number;
  /** Extra-large spacing */
  xl: number;
  /** 2X large */
  xxl: number;
}

export function createSpacing(minDimension: number): SpacingSystem {
  const unit = Math.round(minDimension * 0.01);
  return {
    xs: unit,
    sm: unit * 2,
    md: unit * 3,
    lg: unit * 5,
    xl: unit * 8,
    xxl: unit * 13,
  };
}

// ---------------------------------------------------------------------------
// 5. Composition Templates — Professional Layout Archetypes
// ---------------------------------------------------------------------------

export type CompositionType =
  | "centered-hero"         // Everything centered, strong focal point
  | "editorial-spread"      // Magazine-style with columns and gutters
  | "asymmetric-tension"    // Dynamic off-center, creates visual tension
  | "z-pattern"             // Content flows in Z (top-left → top-right → bottom-left → bottom-right)
  | "f-pattern"             // Content follows F reading pattern
  | "diagonal-dynamic"      // Elements along diagonal axis
  | "grid-modular"          // Strict grid, Swiss-style
  | "golden-ratio"          // Golden ratio proportions
  | "rule-of-thirds"        // Content at 1/3 intersection points
  | "full-bleed"            // Edge-to-edge hero image with minimal overlay text
  | "split-panel"           // Two distinct halves
  | "layered-depth"         // Stacked elements with depth/parallax feel
  | "minimal-whitespace"    // Maximum whitespace, minimal elements
  | "typographic-poster"    // Typography IS the design element
  | "data-driven"           // Infographic-style with structured data points
  | "collage"               // Multiple images in an editorial grid layout
  ;

export interface CompositionTemplate {
  type: CompositionType;
  name: string;
  description: string;
  /** Zones where elements should be placed (relative 0-1 coordinates) */
  zones: {
    name: string;
    purpose: "headline" | "subtext" | "cta" | "image" | "accent" | "decoration" | "label" | "logo";
    x: number;
    y: number;
    width: number;
    height: number;
    align: CanvasTextAlign;
    vAlign: "top" | "center" | "bottom";
  }[];
  /** Decorative elements to add */
  decorations: {
    type: "dot-grid" | "concentric-circles" | "corner-brackets" | "cross-marker" | "accent-line" | "divider";
    relX: number;
    relY: number;
    relWidth: number;
    relHeight: number;
  }[];
}

/** Get all available composition templates */
export function getCompositionTemplates(): CompositionTemplate[] {
  return [
    {
      type: "centered-hero",
      name: "Centered Hero",
      description: "Strong centered focal point — headline dominates with balanced whitespace",
      zones: [
        { name: "label", purpose: "label", x: 0.5, y: 0.2, width: 0.6, height: 0.05, align: "center", vAlign: "center" },
        { name: "headline", purpose: "headline", x: 0.5, y: 0.38, width: 0.75, height: 0.25, align: "center", vAlign: "center" },
        { name: "subtext", purpose: "subtext", x: 0.5, y: 0.62, width: 0.6, height: 0.1, align: "center", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.5, y: 0.78, width: 0.3, height: 0.06, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "concentric-circles", relX: 0.85, relY: 0.15, relWidth: 0.1, relHeight: 0.1 },
        { type: "dot-grid", relX: 0.08, relY: 0.82, relWidth: 0.12, relHeight: 0.08 },
      ],
    },
    {
      type: "editorial-spread",
      name: "Editorial Spread",
      description: "Magazine-style layout with columns, labels, and elegant type hierarchy",
      zones: [
        { name: "label", purpose: "label", x: 0.08, y: 0.1, width: 0.3, height: 0.04, align: "left", vAlign: "top" },
        { name: "headline", purpose: "headline", x: 0.08, y: 0.2, width: 0.5, height: 0.3, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.08, y: 0.55, width: 0.4, height: 0.15, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.08, y: 0.78, width: 0.25, height: 0.06, align: "left", vAlign: "center" },
        { name: "accent", purpose: "accent", x: 0.6, y: 0.1, width: 0.35, height: 0.8, align: "left", vAlign: "top" },
      ],
      decorations: [
        { type: "corner-brackets", relX: 0.06, relY: 0.08, relWidth: 0.88, relHeight: 0.84 },
        { type: "accent-line", relX: 0.08, relY: 0.17, relWidth: 0.15, relHeight: 0.003 },
      ],
    },
    {
      type: "asymmetric-tension",
      name: "Asymmetric Tension",
      description: "Off-center dynamic layout creating visual energy and movement",
      zones: [
        { name: "headline", purpose: "headline", x: 0.06, y: 0.25, width: 0.55, height: 0.3, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.06, y: 0.6, width: 0.4, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.06, y: 0.8, width: 0.25, height: 0.06, align: "left", vAlign: "center" },
        { name: "label", purpose: "label", x: 0.06, y: 0.15, width: 0.3, height: 0.04, align: "left", vAlign: "top" },
      ],
      decorations: [
        { type: "accent-line", relX: 0.65, relY: 0.1, relWidth: 0.003, relHeight: 0.8 },
        { type: "cross-marker", relX: 0.85, relY: 0.2, relWidth: 0.02, relHeight: 0.02 },
        { type: "concentric-circles", relX: 0.78, relY: 0.7, relWidth: 0.15, relHeight: 0.15 },
      ],
    },
    {
      type: "z-pattern",
      name: "Z-Pattern Flow",
      description: "Content flows top-left → top-right → bottom-left → bottom-right",
      zones: [
        { name: "logo", purpose: "logo", x: 0.08, y: 0.08, width: 0.2, height: 0.06, align: "left", vAlign: "top" },
        { name: "label", purpose: "label", x: 0.75, y: 0.1, width: 0.2, height: 0.04, align: "right", vAlign: "top" },
        { name: "headline", purpose: "headline", x: 0.5, y: 0.35, width: 0.8, height: 0.25, align: "center", vAlign: "center" },
        { name: "subtext", purpose: "subtext", x: 0.08, y: 0.68, width: 0.45, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.75, y: 0.82, width: 0.2, height: 0.06, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "divider", relX: 0.08, relY: 0.65, relWidth: 0.84, relHeight: 0 },
        { type: "dot-grid", relX: 0.85, relY: 0.5, relWidth: 0.08, relHeight: 0.1 },
      ],
    },
    {
      type: "diagonal-dynamic",
      name: "Diagonal Dynamic",
      description: "Elements arranged along a diagonal axis for energy and movement",
      zones: [
        { name: "label", purpose: "label", x: 0.08, y: 0.08, width: 0.25, height: 0.04, align: "left", vAlign: "top" },
        { name: "headline", purpose: "headline", x: 0.12, y: 0.2, width: 0.6, height: 0.25, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.35, y: 0.52, width: 0.5, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.6, y: 0.78, width: 0.25, height: 0.06, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "accent-line", relX: 0, relY: 0, relWidth: 1, relHeight: 1 },
        { type: "cross-marker", relX: 0.08, relY: 0.88, relWidth: 0.02, relHeight: 0.02 },
      ],
    },
    {
      type: "golden-ratio",
      name: "Golden Ratio",
      description: "Content positioned at golden ratio intersections for natural harmony",
      zones: [
        { name: "headline", purpose: "headline", x: 0.08, y: 0.28, width: 0.55, height: 0.25, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.08, y: 0.58, width: 0.42, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.08, y: 0.78, width: 0.22, height: 0.06, align: "left", vAlign: "center" },
        { name: "label", purpose: "label", x: 0.08, y: 0.18, width: 0.2, height: 0.04, align: "left", vAlign: "top" },
        { name: "accent", purpose: "accent", x: 0.618, y: 0, width: 0.382, height: 1, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "accent-line", relX: 0.618, relY: 0.05, relWidth: 0.002, relHeight: 0.9 },
        { type: "concentric-circles", relX: 0.618, relY: 0.382, relWidth: 0.2, relHeight: 0.2 },
      ],
    },
    {
      type: "rule-of-thirds",
      name: "Rule of Thirds",
      description: "Key elements at 1/3 intersection points for balanced composition",
      zones: [
        { name: "headline", purpose: "headline", x: 0.08, y: 0.25, width: 0.58, height: 0.22, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.08, y: 0.52, width: 0.45, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.33, y: 0.78, width: 0.22, height: 0.06, align: "center", vAlign: "center" },
        { name: "label", purpose: "label", x: 0.08, y: 0.15, width: 0.25, height: 0.04, align: "left", vAlign: "top" },
      ],
      decorations: [
        { type: "cross-marker", relX: 0.333, relY: 0.333, relWidth: 0.01, relHeight: 0.01 },
        { type: "cross-marker", relX: 0.667, relY: 0.333, relWidth: 0.01, relHeight: 0.01 },
        { type: "cross-marker", relX: 0.333, relY: 0.667, relWidth: 0.01, relHeight: 0.01 },
        { type: "cross-marker", relX: 0.667, relY: 0.667, relWidth: 0.01, relHeight: 0.01 },
      ],
    },
    {
      type: "full-bleed",
      name: "Full Bleed",
      description: "Edge-to-edge hero image with minimal text overlay — maximum visual impact",
      zones: [
        { name: "headline", purpose: "headline", x: 0.5, y: 0.7, width: 0.8, height: 0.15, align: "center", vAlign: "bottom" },
        { name: "cta", purpose: "cta", x: 0.5, y: 0.88, width: 0.2, height: 0.05, align: "center", vAlign: "center" },
        { name: "logo", purpose: "logo", x: 0.08, y: 0.06, width: 0.15, height: 0.05, align: "left", vAlign: "top" },
      ],
      decorations: [],
    },
    {
      type: "split-panel",
      name: "Split Panel",
      description: "Two distinct halves — image on one side, content on the other",
      zones: [
        { name: "image", purpose: "image", x: 0, y: 0, width: 0.5, height: 1, align: "center", vAlign: "center" },
        { name: "label", purpose: "label", x: 0.56, y: 0.15, width: 0.35, height: 0.04, align: "left", vAlign: "top" },
        { name: "headline", purpose: "headline", x: 0.56, y: 0.25, width: 0.38, height: 0.25, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.56, y: 0.55, width: 0.36, height: 0.15, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.56, y: 0.78, width: 0.22, height: 0.06, align: "left", vAlign: "center" },
      ],
      decorations: [
        { type: "accent-line", relX: 0.5, relY: 0.1, relWidth: 0.002, relHeight: 0.8 },
      ],
    },
    {
      type: "layered-depth",
      name: "Layered Depth",
      description: "Stacked translucent panels creating depth and visual layers",
      zones: [
        { name: "headline", purpose: "headline", x: 0.12, y: 0.3, width: 0.6, height: 0.2, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.15, y: 0.55, width: 0.5, height: 0.12, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.15, y: 0.75, width: 0.22, height: 0.06, align: "left", vAlign: "center" },
        { name: "label", purpose: "label", x: 0.12, y: 0.2, width: 0.3, height: 0.04, align: "left", vAlign: "top" },
      ],
      decorations: [
        { type: "dot-grid", relX: 0.8, relY: 0.08, relWidth: 0.12, relHeight: 0.12 },
        { type: "concentric-circles", relX: 0.88, relY: 0.85, relWidth: 0.08, relHeight: 0.08 },
      ],
    },
    {
      type: "minimal-whitespace",
      name: "Minimal Whitespace",
      description: "Maximum breathing room — few elements, powerful simplicity",
      zones: [
        { name: "headline", purpose: "headline", x: 0.5, y: 0.42, width: 0.65, height: 0.15, align: "center", vAlign: "center" },
        { name: "subtext", purpose: "subtext", x: 0.5, y: 0.58, width: 0.45, height: 0.08, align: "center", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.5, y: 0.74, width: 0.18, height: 0.05, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "accent-line", relX: 0.42, relY: 0.37, relWidth: 0.16, relHeight: 0.003 },
      ],
    },
    {
      type: "typographic-poster",
      name: "Typographic Poster",
      description: "Typography IS the design — oversized letters, extreme weight contrast, no images needed",
      zones: [
        { name: "headline", purpose: "headline", x: 0.08, y: 0.15, width: 0.84, height: 0.45, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.08, y: 0.65, width: 0.5, height: 0.12, align: "left", vAlign: "top" },
        { name: "label", purpose: "label", x: 0.08, y: 0.08, width: 0.3, height: 0.04, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.08, y: 0.85, width: 0.2, height: 0.05, align: "left", vAlign: "center" },
      ],
      decorations: [
        { type: "accent-line", relX: 0.08, relY: 0.13, relWidth: 0.2, relHeight: 0.003 },
        { type: "cross-marker", relX: 0.92, relY: 0.92, relWidth: 0.02, relHeight: 0.02 },
      ],
    },
    {
      type: "collage",
      name: "Photo Collage",
      description: "Multiple images arranged in an editorial grid layout",
      zones: [
        { name: "image", purpose: "image", x: 0, y: 0, width: 0.65, height: 0.6, align: "center", vAlign: "center" },
        { name: "headline", purpose: "headline", x: 0.68, y: 0.05, width: 0.28, height: 0.25, align: "left", vAlign: "top" },
        { name: "subtext", purpose: "subtext", x: 0.68, y: 0.35, width: 0.28, height: 0.15, align: "left", vAlign: "top" },
        { name: "cta", purpose: "cta", x: 0.68, y: 0.52, width: 0.2, height: 0.05, align: "left", vAlign: "center" },
        { name: "accent", purpose: "accent", x: 0.05, y: 0.65, width: 0.9, height: 0.3, align: "center", vAlign: "center" },
      ],
      decorations: [
        { type: "corner-brackets", relX: 0.02, relY: 0.02, relWidth: 0.62, relHeight: 0.57 },
      ],
    },
  ];
}

// ---------------------------------------------------------------------------
// 6. Platform Export Sizes
// ---------------------------------------------------------------------------

export interface ExportFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  platform: string;
  purpose: string;
  category: "social" | "print" | "web" | "presentation";
}

export function getExportFormats(): ExportFormat[] {
  return [
    // Instagram
    { id: "ig-post", name: "Instagram Post", width: 1080, height: 1080, platform: "Instagram", purpose: "Feed Post", category: "social" },
    { id: "ig-story", name: "Instagram Story", width: 1080, height: 1920, platform: "Instagram", purpose: "Story / Reel", category: "social" },
    { id: "ig-landscape", name: "Instagram Landscape", width: 1080, height: 566, platform: "Instagram", purpose: "Landscape Post", category: "social" },
    { id: "ig-portrait", name: "Instagram Portrait", width: 1080, height: 1350, platform: "Instagram", purpose: "Portrait Post", category: "social" },

    // Facebook
    { id: "fb-post", name: "Facebook Post", width: 1200, height: 630, platform: "Facebook", purpose: "Feed Post / Link Preview", category: "social" },
    { id: "fb-story", name: "Facebook Story", width: 1080, height: 1920, platform: "Facebook", purpose: "Story", category: "social" },
    { id: "fb-cover", name: "Facebook Cover", width: 820, height: 312, platform: "Facebook", purpose: "Page Cover Photo", category: "social" },
    { id: "fb-event", name: "Facebook Event", width: 1920, height: 1005, platform: "Facebook", purpose: "Event Cover", category: "social" },

    // X (Twitter)
    { id: "x-post", name: "X / Twitter Post", width: 1200, height: 675, platform: "X (Twitter)", purpose: "Tweet Image", category: "social" },
    { id: "x-header", name: "X / Twitter Header", width: 1500, height: 500, platform: "X (Twitter)", purpose: "Profile Header", category: "social" },

    // LinkedIn
    { id: "li-post", name: "LinkedIn Post", width: 1200, height: 627, platform: "LinkedIn", purpose: "Feed Post", category: "social" },
    { id: "li-story", name: "LinkedIn Story", width: 1080, height: 1920, platform: "LinkedIn", purpose: "Story", category: "social" },
    { id: "li-cover", name: "LinkedIn Cover", width: 1584, height: 396, platform: "LinkedIn", purpose: "Personal Banner", category: "social" },

    // TikTok
    { id: "tt-post", name: "TikTok Post", width: 1080, height: 1920, platform: "TikTok", purpose: "Video Cover / Post", category: "social" },

    // Pinterest
    { id: "pin", name: "Pinterest Pin", width: 1000, height: 1500, platform: "Pinterest", purpose: "Standard Pin", category: "social" },

    // YouTube
    { id: "yt-thumb", name: "YouTube Thumbnail", width: 1280, height: 720, platform: "YouTube", purpose: "Video Thumbnail", category: "social" },
    { id: "yt-banner", name: "YouTube Banner", width: 2560, height: 1440, platform: "YouTube", purpose: "Channel Art", category: "social" },

    // Print
    { id: "print-a3", name: "A3 Poster", width: 3508, height: 4961, platform: "Print", purpose: "A3 (297×420mm) at 300dpi", category: "print" },
    { id: "print-a4", name: "A4 Poster", width: 2480, height: 3508, platform: "Print", purpose: "A4 (210×297mm) at 300dpi", category: "print" },
    { id: "print-a5", name: "A5 Flyer", width: 1748, height: 2480, platform: "Print", purpose: "A5 (148×210mm) at 300dpi", category: "print" },
    { id: "print-letter", name: "US Letter", width: 2550, height: 3300, platform: "Print", purpose: "Letter (8.5×11in) at 300dpi", category: "print" },
    { id: "print-tabloid", name: "Tabloid", width: 3300, height: 5100, platform: "Print", purpose: "Tabloid (11×17in) at 300dpi", category: "print" },

    // Web
    { id: "web-hero", name: "Website Hero", width: 1920, height: 1080, platform: "Web", purpose: "Hero Banner (Full HD)", category: "web" },
    { id: "web-banner", name: "Web Banner", width: 1200, height: 400, platform: "Web", purpose: "Wide Banner", category: "web" },
    { id: "web-og", name: "OG Image", width: 1200, height: 630, platform: "Web", purpose: "Open Graph / Social Share", category: "web" },

    // Presentation
    { id: "pres-16-9", name: "Presentation 16:9", width: 1920, height: 1080, platform: "Presentation", purpose: "Widescreen Slide", category: "presentation" },
    { id: "pres-4-3", name: "Presentation 4:3", width: 1024, height: 768, platform: "Presentation", purpose: "Standard Slide", category: "presentation" },
  ];
}

/** Get export formats grouped by platform */
export function getExportFormatsByPlatform(): Record<string, ExportFormat[]> {
  const formats = getExportFormats();
  const grouped: Record<string, ExportFormat[]> = {};
  for (const f of formats) {
    if (!grouped[f.platform]) grouped[f.platform] = [];
    grouped[f.platform].push(f);
  }
  return grouped;
}

// ---------------------------------------------------------------------------
// 7. Device Mockups — For Client Presentation
// ---------------------------------------------------------------------------

export interface DeviceMockup {
  id: string;
  name: string;
  /** Device frame dimensions */
  frameWidth: number;
  frameHeight: number;
  /** Screen area within the frame (where design goes) */
  screenX: number;
  screenY: number;
  screenWidth: number;
  screenHeight: number;
  /** Design aspect ratio this mockup accepts */
  designAspect: number;
  /** Platform context */
  platform: string;
  /** Device type for visual context */
  device: "phone" | "tablet" | "desktop" | "laptop";
}

/** Get available device mockups for client presentation */
export function getDeviceMockups(): DeviceMockup[] {
  return [
    {
      id: "iphone-feed",
      name: "iPhone — Feed Post",
      frameWidth: 440,
      frameHeight: 880,
      screenX: 20,
      screenY: 60,
      screenWidth: 400,
      screenHeight: 760,
      designAspect: 1,
      platform: "Instagram",
      device: "phone",
    },
    {
      id: "iphone-story",
      name: "iPhone — Story",
      frameWidth: 440,
      frameHeight: 880,
      screenX: 20,
      screenY: 60,
      screenWidth: 400,
      screenHeight: 760,
      designAspect: 9 / 16,
      platform: "Instagram",
      device: "phone",
    },
    {
      id: "android-feed",
      name: "Android — Feed Post",
      frameWidth: 420,
      frameHeight: 860,
      screenX: 10,
      screenY: 50,
      screenWidth: 400,
      screenHeight: 760,
      designAspect: 1,
      platform: "Facebook",
      device: "phone",
    },
    {
      id: "laptop-web",
      name: "Laptop — Web",
      frameWidth: 900,
      frameHeight: 580,
      screenX: 50,
      screenY: 30,
      screenWidth: 800,
      screenHeight: 500,
      designAspect: 16 / 10,
      platform: "Web",
      device: "laptop",
    },
    {
      id: "desktop-monitor",
      name: "Desktop Monitor",
      frameWidth: 960,
      frameHeight: 600,
      screenX: 30,
      screenY: 25,
      screenWidth: 900,
      screenHeight: 510,
      designAspect: 16 / 9,
      platform: "Web",
      device: "desktop",
    },
    {
      id: "ipad-feed",
      name: "iPad — Feed",
      frameWidth: 640,
      frameHeight: 860,
      screenX: 20,
      screenY: 40,
      screenWidth: 600,
      screenHeight: 780,
      designAspect: 3 / 4,
      platform: "Instagram",
      device: "tablet",
    },
  ];
}

/** Render a design inside a device mockup frame */
export function renderDeviceMockup(
  designCanvas: HTMLCanvasElement,
  mockup: DeviceMockup,
  opts?: {
    backgroundColor?: string;
    showAppChrome?: boolean;
    appName?: string;
  }
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = mockup.frameWidth;
  canvas.height = mockup.frameHeight;
  const ctx = canvas.getContext("2d")!;

  const bg = opts?.backgroundColor ?? "#f5f5f5";

  // Background
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Device frame
  const isPhone = mockup.device === "phone";
  const isTablet = mockup.device === "tablet";
  const borderRadius = isPhone ? 40 : isTablet ? 24 : 8;

  // Frame shadow
  ctx.shadowColor = "rgba(0,0,0,0.2)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetY = 10;

  // Frame body (dark bezel)
  ctx.fillStyle = "#1a1a1a";
  roundRectPath(ctx, mockup.screenX - 15, mockup.screenY - 40, mockup.screenWidth + 30, mockup.screenHeight + 65, borderRadius);
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Screen area (clip and draw design)
  ctx.save();
  const screenR = isPhone ? 20 : isTablet ? 12 : 4;
  roundRectPath(ctx, mockup.screenX, mockup.screenY, mockup.screenWidth, mockup.screenHeight, screenR);
  ctx.clip();

  // Draw design scaled to screen
  ctx.drawImage(
    designCanvas,
    mockup.screenX,
    mockup.screenY,
    mockup.screenWidth,
    mockup.screenHeight
  );

  // App chrome overlay (status bar, etc.)
  if (opts?.showAppChrome !== false && isPhone) {
    // Status bar
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(mockup.screenX, mockup.screenY, mockup.screenWidth, 28);
    // Time
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("9:41", mockup.screenX + 16, mockup.screenY + 19);
    // Battery etc (right side)
    ctx.textAlign = "right";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("100% ■", mockup.screenX + mockup.screenWidth - 12, mockup.screenY + 19);

    // Notch/Dynamic Island
    ctx.fillStyle = "#000000";
    const notchW = 100;
    const notchH = 24;
    const notchX = mockup.screenX + (mockup.screenWidth - notchW) / 2;
    roundRectPath(ctx, notchX, mockup.screenY, notchW, notchH, 12);
    ctx.fill();

    // Bottom indicator bar
    ctx.fillStyle = "#ffffff";
    const barW = 120;
    roundRectPath(
      ctx,
      mockup.screenX + (mockup.screenWidth - barW) / 2,
      mockup.screenY + mockup.screenHeight - 12,
      barW,
      4,
      2
    );
    ctx.fill();

    // App name
    if (opts?.appName) {
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 14px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        opts.appName,
        mockup.screenX + mockup.screenWidth / 2,
        mockup.screenY + 50
      );
    }
  }

  ctx.restore();

  // Frame highlight (subtle edge light)
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  roundRectPath(ctx, mockup.screenX - 15, mockup.screenY - 40, mockup.screenWidth + 30, mockup.screenHeight + 65, borderRadius);
  ctx.stroke();

  return canvas;
}

function roundRectPath(
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
// 8. Layout Generator — Build Layers from Composition + Content
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// AI Design Directive — structured output from the AI Design Director
// ---------------------------------------------------------------------------

export interface AIDesignDirective {
  /** Composition layout type */
  composition: CompositionType;
  /** Color palette */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  /** Font style */
  fontStyle: FontStyle;
  /** Copy */
  copy: {
    headline: string;
    subtext: string;
    ctaText: string;
    label: string;
  };
  /** Visual intensity: 0 = minimal, 1 = moderate, 2 = rich, 3 = maximal */
  visualIntensity: number;
  /** Additional design shapes to include */
  shapes: AIShapeDirective[];
}

export interface AIShapeDirective {
  /** Descriptive role */
  role: "hero-block" | "accent-bar" | "sidebar-panel" | "glass-overlay" | "gradient-orb"
    | "border-frame" | "divider-line" | "highlight-strip" | "backdrop-card" | "floating-badge";
  /** Relative position and size (0–1) */
  relX: number;
  relY: number;
  relWidth: number;
  relHeight: number;
  /** Shape type */
  shape: "rectangle" | "circle" | "ellipse";
  /** Use gradient? */
  useGradient: boolean;
  /** Opacity 0–1 */
  opacity: number;
  /** Corner radius in px */
  cornerRadius: number;
}

/** Parse an AI Design Directive from structured AI response */
export function parseAIDesignDirective(raw: string): Partial<AIDesignDirective> | null {
  try {
    // Try JSON first
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const obj = JSON.parse(jsonMatch[0]);
      return obj as Partial<AIDesignDirective>;
    }
  } catch { /* fallback to regex */ }

  // Regex fallback
  const directive: Partial<AIDesignDirective> = {};

  const comp = raw.match(/COMPOSITION:\s*(.+)/i);
  if (comp) {
    const c = comp[1].trim().toLowerCase().replace(/\s+/g, "-");
    const validTypes: CompositionType[] = [
      "centered-hero", "editorial-spread", "asymmetric-tension", "z-pattern",
      "diagonal-dynamic", "golden-ratio", "rule-of-thirds", "full-bleed",
      "split-panel", "layered-depth", "minimal-whitespace", "typographic-poster",
    ];
    if (validTypes.includes(c as CompositionType)) {
      directive.composition = c as CompositionType;
    }
  }

  const headline = raw.match(/HEADLINE:\s*(.+)/i);
  const subtext = raw.match(/SUBTEXT:\s*(.+)/i);
  const cta = raw.match(/CTA:\s*(.+)/i);
  const label = raw.match(/LABEL:\s*(.+)/i);
  if (headline || subtext || cta) {
    directive.copy = {
      headline: headline?.[1]?.replace(/\*+/g, "").trim() ?? "",
      subtext: subtext?.[1]?.replace(/\*+/g, "").trim() ?? "",
      ctaText: cta?.[1]?.replace(/\*+/g, "").trim() ?? "",
      label: label?.[1]?.replace(/\*+/g, "").trim() ?? "",
    };
  }

  const primary = raw.match(/PRIMARY_COLOR:\s*(#[0-9a-fA-F]{6})/i);
  const secondary = raw.match(/SECONDARY_COLOR:\s*(#[0-9a-fA-F]{6})/i);
  const accent = raw.match(/ACCENT_COLOR:\s*(#[0-9a-fA-F]{6})/i);
  const textC = raw.match(/TEXT_COLOR:\s*(#[0-9a-fA-F]{6})/i);
  if (primary || secondary) {
    directive.colors = {
      primary: primary?.[1] ?? "#8ae600",
      secondary: secondary?.[1] ?? "#030712",
      accent: accent?.[1] ?? primary?.[1] ?? "#8ae600",
      text: textC?.[1] ?? "#ffffff",
    };
  }

  const font = raw.match(/FONT_STYLE:\s*(\w+)/i);
  if (font) {
    const validFonts: FontStyle[] = ["modern", "classic", "bold", "elegant", "compact"];
    const f = font[1].toLowerCase() as FontStyle;
    if (validFonts.includes(f)) directive.fontStyle = f;
  }

  const intensity = raw.match(/VISUAL_INTENSITY:\s*(\d)/i);
  if (intensity) directive.visualIntensity = parseInt(intensity[1]);

  return Object.keys(directive).length > 0 ? directive : null;
}

/** Build the AI prompt for the Design Director */
export function buildDesignDirectorPrompt(
  context: string,
  canvasType: "social" | "poster" | "banner",
  canvasSize: { width: number; height: number },
  currentConfig?: { platform?: string; format?: string },
  revision?: {
    currentDesign: {
      headline?: string;
      subtext?: string;
      ctaText?: string;
      label?: string;
      composition?: string;
      primaryColor?: string;
      secondaryColor?: string;
      textColor?: string;
      fontStyle?: string;
      visualIntensity?: number;
    };
    revisionRequest: string;
  }
): string {
  const compositionList = [
    "centered-hero", "editorial-spread", "asymmetric-tension", "z-pattern",
    "diagonal-dynamic", "golden-ratio", "rule-of-thirds", "full-bleed",
    "split-panel", "layered-depth", "minimal-whitespace", "typographic-poster",
  ].join(", ");

  const typeContext = {
    social: `social media post (${currentConfig?.platform ?? "Instagram"}, ${canvasSize.width}×${canvasSize.height})`,
    poster: `poster/flyer (${currentConfig?.format ?? "A4"}, ${canvasSize.width}×${canvasSize.height})`,
    banner: `digital banner ad (${canvasSize.width}×${canvasSize.height})`,
  }[canvasType];

  // ── Revision mode: modify existing design ──────────────────────────
  if (revision) {
    const cd = revision.currentDesign;
    return `You are an elite, award-winning graphic designer and art director.

The client has an existing ${typeContext} design and wants REVISIONS.

CURRENT DESIGN:
- Headline: "${cd.headline || ""}"
- Subtext: "${cd.subtext || ""}"
- CTA: "${cd.ctaText || ""}"
- Label: "${cd.label || ""}"
- Composition: ${cd.composition || "centered-hero"}
- Primary Color: ${cd.primaryColor || "#8ae600"}
- Secondary Color: ${cd.secondaryColor || "#030712"}
- Text Color: ${cd.textColor || "#ffffff"}
- Font Style: ${cd.fontStyle || "modern"}
- Visual Intensity: ${cd.visualIntensity ?? 2}

ORIGINAL BRIEF: ${context}

REVISION REQUEST: ${revision.revisionRequest}

IMPORTANT RULES:
1. ONLY change what the client asked to change
2. Keep everything else EXACTLY the same
3. If they ask to change the headline, keep all colors/composition/subtext the same
4. If they ask for a color change, keep all copy the same
5. Always output ALL fields even if unchanged

Respond with EXACTLY this format (plain text, no markdown):

COMPOSITION: [one of: ${compositionList}]
HEADLINE: [max 6 words]
SUBTEXT: [max 15 words]
CTA: [max 3 words]
LABEL: [max 3 words]
PRIMARY_COLOR: [hex]
SECONDARY_COLOR: [hex]
ACCENT_COLOR: [hex]
TEXT_COLOR: [hex]
FONT_STYLE: [modern|classic|bold|elegant|compact]
VISUAL_INTENSITY: [0-3]

Output ONLY the fields above. No explanations, no markdown, no asterisks.`;
  }

  // ── Fresh generation mode ──────────────────────────────────────────
  return `You are an elite, award-winning graphic designer and art director. You create breathtaking, mind-blowing designs that look like they came from a top agency like Pentagram, Sagmeister, or Collins.

You must design a complete ${typeContext}.

CONTEXT: ${context}

You are NOT just writing copy — you are DESIGNING. Think about:
- Visual composition & layout balance
- Color psychology & harmony  
- Typography hierarchy & contrast
- Professional brand-level quality
- Stunning contrast between background and text
- Colors that evoke the right emotion for the content

Respond with EXACTLY this format (plain text, no markdown):

COMPOSITION: [choose one: ${compositionList}]
HEADLINE: [max 6 words, powerful, scroll-stopping]
SUBTEXT: [max 15 words, compelling supporting copy]
CTA: [max 3 words, action verb]
LABEL: [max 3 words, category/brand tag]
PRIMARY_COLOR: [hex, e.g. #8ae600 — the vibrant accent color]
SECONDARY_COLOR: [hex, e.g. #0a0a0a — the background/dominant color]
ACCENT_COLOR: [hex — a complementary highlight color]
TEXT_COLOR: [hex — main text color, ensure contrast with secondary]
FONT_STYLE: [one of: modern, classic, bold, elegant, compact]
VISUAL_INTENSITY: [0-3, where 0=minimal clean, 1=moderate, 2=rich, 3=maximal dramatic]

IMPORTANT: Output ONLY the fields above. No explanations, no markdown, no asterisks. Choose colors that create stunning contrast and visual impact. The design should look like a $50,000 agency project.`;
}

// ---------------------------------------------------------------------------
// 8. Layout Generator — Build FULL Design Layers from Composition + Content
// ---------------------------------------------------------------------------

/** Generate a full set of rich visual layers from a composition template, content, and style */
export function generateLayoutLayers(
  template: CompositionTemplate,
  content: {
    headline?: string;
    subtext?: string;
    ctaText?: string;
    label?: string;
    brandName?: string;
  },
  canvas: { width: number; height: number },
  style: {
    fontStyle: FontStyle;
    accentColor: string;
    textColor: string;
    bgColor: string;
  },
  visualIntensity: number = 2
): Layer[] {
  const w = canvas.width;
  const h = canvas.height;
  const minDim = Math.min(w, h);
  const scale = getScaleForSize(w, h);
  const hierarchy = createHierarchy(scale, style.textColor, style.accentColor);
  const layers: Layer[] = [];

  // ── 1. Content text & CTA layers (proper alignment) ───────────────────

  for (const zone of template.zones) {
    // Compute LEFT EDGE x: for center-aligned zones, zone.x is the CENTER
    const layerX =
      zone.align === "center"
        ? (zone.x - zone.width / 2) * w
        : zone.x * w;
    const absY = zone.y * h;
    const absW = zone.width * w;
    const absH = zone.height * h;

    switch (zone.purpose) {
      case "headline":
        if (content.headline) {
          layers.push(
            createTextLayer({
              name: "Headline",
              text: content.headline,
              x: layerX,
              y: absY,
              width: absW,
              maxWidth: absW,
              height: absH,
              fontSize: hierarchy.primary.fontSize,
              fontWeight: hierarchy.primary.fontWeight,
              fontStyle: style.fontStyle,
              color: hierarchy.primary.color,
              align: zone.align,
              letterSpacing: hierarchy.primary.letterSpacing,
              shadow: true,
              anchorX: zone.x,
              anchorY: zone.y,
            })
          );
        }
        break;

      case "subtext":
        if (content.subtext) {
          layers.push(
            createTextLayer({
              name: "Subtext",
              text: content.subtext,
              x: layerX,
              y: absY,
              width: absW,
              maxWidth: absW,
              height: absH,
              fontSize: hierarchy.secondary.fontSize,
              fontWeight: hierarchy.secondary.fontWeight,
              fontStyle: style.fontStyle,
              color: hierarchy.secondary.color,
              align: zone.align,
              letterSpacing: hierarchy.secondary.letterSpacing,
              shadow: true,
              anchorX: zone.x,
              anchorY: zone.y,
            })
          );
        }
        break;

      case "cta":
        if (content.ctaText) {
          layers.push(
            createCtaLayer({
              name: "CTA Button",
              text: content.ctaText,
              x: layerX,
              y: absY,
              fontSize: scale.body,
              fontStyle: style.fontStyle,
              bgColor: style.accentColor,
              textColor: getContrastColor(style.accentColor),
              anchorX: zone.x,
              anchorY: zone.y,
            })
          );
        }
        break;

      case "label":
        if (content.label || content.brandName) {
          layers.push(
            createTextLayer({
              name: "Label",
              text: (content.label || content.brandName || "").toUpperCase(),
              x: layerX,
              y: absY,
              width: absW,
              maxWidth: absW,
              height: absH,
              fontSize: hierarchy.accent.fontSize,
              fontWeight: hierarchy.accent.fontWeight,
              fontStyle: style.fontStyle,
              color: hierarchy.accent.color,
              align: zone.align,
              letterSpacing: hierarchy.accent.letterSpacing,
              shadow: false,
              uppercase: true,
              anchorX: zone.x,
              anchorY: zone.y,
            })
          );
        }
        break;

      case "logo":
        if (content.brandName) {
          layers.push(
            createTextLayer({
              name: "Logo / Brand",
              text: content.brandName,
              x: layerX,
              y: absY,
              width: absW,
              maxWidth: absW,
              height: absH,
              fontSize: scale.h3,
              fontWeight: 700,
              fontStyle: style.fontStyle,
              color: style.textColor,
              align: zone.align,
              shadow: false,
              anchorX: zone.x,
              anchorY: zone.y,
            })
          );
        }
        break;

      // accent, image, decoration zones are rendered as background art
      // by renderCompositionFoundation() — not as selectable layers
      default:
        break;
    }
  }

  return layers;
}

// ---------------------------------------------------------------------------
// 8a. Composition Foundation Renderer — Background visual art (NOT layers)
// Draws hero shapes, accent bars, glass cards, geometric patterns directly
// on the canvas context. These are background design elements, not
// interactive objects — users should never see or select them.
// ---------------------------------------------------------------------------

interface FoundationStyle {
  accentColor: string;
  bgColor: string;
  textColor: string;
}

/** Render composition-specific background design art directly onto a canvas.
 *  Call this AFTER the background fill and BEFORE rendering document layers. */
export function renderCompositionFoundation(
  ctx: CanvasRenderingContext2D,
  composition: CompositionType,
  w: number, h: number,
  style: FoundationStyle,
  visualIntensity: number = 2
): void {
  const minDim = Math.min(w, h);

  // ── Hero shapes ───────────────────────────────────────────────────────
  drawHeroShapes(ctx, composition, w, h, style);

  // ── Accent shapes ─────────────────────────────────────────────────────
  if (visualIntensity >= 1) {
    drawAccentShapes(ctx, composition, w, h, style, visualIntensity);
  }

  // ── Glass cards ───────────────────────────────────────────────────────
  if (visualIntensity >= 1) {
    drawGlassCard(ctx, composition, w, h, style);
  }

  // ── Template decorations (drawn as background art) ────────────────────
  const template = getCompositionTemplates().find(t => t.type === composition);
  if (template && visualIntensity >= 1) {
    drawTemplateDecorations(ctx, template.decorations, w, h, style);
  }

  // ── Extra geometric accents ───────────────────────────────────────────
  if (visualIntensity >= 2) {
    drawExtraAccents(ctx, w, h, style, visualIntensity);
  }

  // ── Border frame at max intensity ─────────────────────────────────────
  if (visualIntensity >= 3) {
    const inset = Math.round(minDim * 0.025);
    ctx.save();
    ctx.strokeStyle = hexToRgba(style.accentColor, 0.12);
    ctx.lineWidth = 1;
    roundRectPath(ctx, inset, inset, w - inset * 2, h - inset * 2, Math.round(minDim * 0.008));
    ctx.stroke();
    ctx.restore();
  }
}

// ── Helper: fill a radial gradient ellipse ──────────────────────────────
function fillRadialEllipse(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  stops: { offset: number; color: string }[]
): void {
  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const r = Math.max(w, h) / 2;
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  for (const s of stops) grad.addColorStop(s.offset, s.color);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ── Helper: fill a linear gradient rect ─────────────────────────────────
function fillLinearRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  angleDeg: number,
  stops: { offset: number; color: string }[],
  cornerRadius: number = 0
): void {
  ctx.save();
  const angle = (angleDeg * Math.PI) / 180;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const len = Math.max(w, h) / 2;
  const grad = ctx.createLinearGradient(
    cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
    cx + Math.cos(angle) * len, cy + Math.sin(angle) * len
  );
  for (const s of stops) grad.addColorStop(s.offset, s.color);
  ctx.fillStyle = grad;
  if (cornerRadius > 0) {
    roundRectPath(ctx, x, y, w, h, cornerRadius);
    ctx.fill();
  } else {
    ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Hero shapes — one-per-composition primary visual elements
// ---------------------------------------------------------------------------

function drawHeroShapes(
  ctx: CanvasRenderingContext2D,
  composition: CompositionType,
  w: number, h: number,
  style: FoundationStyle
): void {
  const minDim = Math.min(w, h);

  switch (composition) {
    case "centered-hero":
      fillRadialEllipse(ctx, w * 0.15, h * 0.2, w * 0.7, h * 0.6, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.10) },
        { offset: 0.6, color: hexToRgba(style.accentColor, 0.03) },
        { offset: 1, color: "transparent" },
      ]);
      fillLinearRect(ctx, 0, h * 0.92, w, h * 0.08, 0, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.12) },
        { offset: 1, color: "transparent" },
      ]);
      break;

    case "editorial-spread":
      fillLinearRect(ctx, w * 0.58, 0, w * 0.42, h, 90, [
        { offset: 0, color: "transparent" },
        { offset: 0.3, color: hexToRgba(style.accentColor, 0.05) },
        { offset: 1, color: hexToRgba(style.accentColor, 0.08) },
      ]);
      ctx.save();
      ctx.fillStyle = hexToRgba(style.accentColor, 0.5);
      ctx.fillRect(0, 0, w, Math.round(minDim * 0.004));
      ctx.restore();
      break;

    case "asymmetric-tension":
      fillLinearRect(ctx, w * 0.55, h * 0.05, w * 0.42, h * 0.5, 135, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.08) },
        { offset: 1, color: "transparent" },
      ], Math.round(minDim * 0.02));
      fillRadialEllipse(ctx, w * 0.6, h * 0.55, w * 0.4, h * 0.4, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.06) },
        { offset: 1, color: "transparent" },
      ]);
      break;

    case "z-pattern":
      fillLinearRect(ctx, w * 0.6, 0, w * 0.4, h * 0.18, 0, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.10) },
        { offset: 1, color: "transparent" },
      ]);
      fillLinearRect(ctx, 0, h * 0.82, w * 0.4, h * 0.18, 180, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.10) },
        { offset: 1, color: "transparent" },
      ]);
      break;

    case "diagonal-dynamic":
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate((-15 * Math.PI) / 180);
      ctx.fillStyle = hexToRgba(style.accentColor, 0.05);
      ctx.fillRect(-w * 0.65, -h * 0.04, w * 1.3, h * 0.08);
      ctx.fillStyle = hexToRgba(style.accentColor, 0.025);
      ctx.fillRect(-w * 0.65, h * 0.06, w * 1.3, h * 0.03);
      ctx.restore();
      break;

    case "golden-ratio":
      fillLinearRect(ctx, w * 0.618, 0, w * 0.382, h, 90, [
        { offset: 0, color: "transparent" },
        { offset: 0.5, color: hexToRgba(style.accentColor, 0.05) },
        { offset: 1, color: hexToRgba(style.accentColor, 0.07) },
      ]);
      fillRadialEllipse(ctx, w * 0.48, h * 0.22, w * 0.3, h * 0.3, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.06) },
        { offset: 1, color: "transparent" },
      ]);
      break;

    case "rule-of-thirds":
      ctx.save();
      ctx.fillStyle = hexToRgba(style.accentColor, 0.025);
      ctx.fillRect(0, 0, w * 0.333, h * 0.333);
      ctx.fillRect(w * 0.667, h * 0.667, w * 0.333, h * 0.333);
      ctx.restore();
      break;

    case "full-bleed":
      fillLinearRect(ctx, 0, h * 0.5, w, h * 0.5, 180, [
        { offset: 0, color: "transparent" },
        { offset: 0.4, color: hexToRgba(style.bgColor, 0.35) },
        { offset: 1, color: hexToRgba(style.bgColor, 0.80) },
      ]);
      break;

    case "split-panel":
      fillRadialEllipse(ctx, -w * 0.1, h * 0.1, w * 0.65, h * 0.8, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.08) },
        { offset: 1, color: hexToRgba(style.bgColor, 0.03) },
      ]);
      // Divider glow line
      fillLinearRect(ctx, w * 0.49, h * 0.05, w * 0.02, h * 0.9, 90, [
        { offset: 0, color: "transparent" },
        { offset: 0.5, color: hexToRgba(style.accentColor, 0.15) },
        { offset: 1, color: "transparent" },
      ]);
      break;

    case "layered-depth": {
      const r = Math.round(minDim * 0.02);
      ctx.save();
      ctx.fillStyle = hexToRgba(style.textColor, 0.025);
      roundRectPath(ctx, w * 0.06, h * 0.12, w * 0.75, h * 0.72, r);
      ctx.fill();
      ctx.fillStyle = hexToRgba(style.textColor, 0.035);
      roundRectPath(ctx, w * 0.09, h * 0.16, w * 0.72, h * 0.68, r);
      ctx.fill();
      fillLinearRect(ctx, w * 0.12, h * 0.2, w * 0.68, h * 0.6, 160, [
        { offset: 0, color: hexToRgba(style.textColor, 0.06) },
        { offset: 0.5, color: hexToRgba(style.accentColor, 0.03) },
        { offset: 1, color: hexToRgba(style.textColor, 0.015) },
      ], Math.round(minDim * 0.015));
      ctx.restore();
      break;
    }

    case "minimal-whitespace":
      ctx.save();
      ctx.fillStyle = hexToRgba(style.accentColor, 0.2);
      ctx.fillRect(w * 0.35, h * 0.36, w * 0.3, 2);
      ctx.restore();
      break;

    case "typographic-poster":
      fillLinearRect(ctx, w * 0.04, h * 0.1, w * 0.92, h * 0.55, 180, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.05) },
        { offset: 1, color: "transparent" },
      ], Math.round(minDim * 0.008));
      ctx.save();
      ctx.fillStyle = hexToRgba(style.accentColor, 0.08);
      ctx.fillRect(w * 0.04, h * 0.92, w * 0.92, h * 0.04);
      ctx.restore();
      break;

    default:
      fillRadialEllipse(ctx, w * 0.2, h * 0.2, w * 0.6, h * 0.6, [
        { offset: 0, color: hexToRgba(style.accentColor, 0.06) },
        { offset: 1, color: "transparent" },
      ]);
  }
}

// ---------------------------------------------------------------------------
// Accent shapes — secondary visual elements
// ---------------------------------------------------------------------------

function drawAccentShapes(
  ctx: CanvasRenderingContext2D,
  composition: CompositionType,
  w: number, h: number,
  style: FoundationStyle,
  intensity: number
): void {
  const minDim = Math.min(w, h);

  // Accent bar per composition
  const barVariants: Record<string, { x: number; y: number; bw: number; bh: number }> = {
    "centered-hero": { x: w * 0.25, y: h * 0.68, bw: w * 0.5, bh: 2 },
    "editorial-spread": { x: w * 0.08, y: h * 0.5, bw: w * 0.12, bh: 2 },
    "asymmetric-tension": { x: w * 0.06, y: h * 0.72, bw: w * 0.2, bh: 2 },
    "z-pattern": { x: w * 0.08, y: h * 0.62, bw: w * 0.84, bh: 1 },
    "diagonal-dynamic": { x: w * 0.08, y: h * 0.68, bw: w * 0.15, bh: 2 },
    "golden-ratio": { x: w * 0.08, y: h * 0.52, bw: w * 0.1, bh: 2 },
    "split-panel": { x: w * 0.56, y: h * 0.72, bw: w * 0.12, bh: 2 },
    "layered-depth": { x: w * 0.15, y: h * 0.48, bw: w * 0.12, bh: 2 },
    "typographic-poster": { x: w * 0.08, y: h * 0.62, bw: w * 0.06, bh: 2 },
  };

  const bar = barVariants[composition];
  if (bar) {
    ctx.save();
    ctx.fillStyle = hexToRgba(style.accentColor, 0.5);
    ctx.fillRect(bar.x, bar.y, bar.bw, bar.bh);
    ctx.restore();
  }

  // At higher intensity: small circle + highlight chip
  if (intensity >= 2) {
    const circleSize = Math.round(minDim * 0.05);
    ctx.save();
    ctx.fillStyle = hexToRgba(style.accentColor, 0.06);
    ctx.beginPath();
    ctx.arc(w * 0.82 + circleSize / 2, h * 0.12 + circleSize / 2, circleSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = hexToRgba(style.accentColor, 0.25);
    const chipW = Math.round(minDim * 0.04);
    const chipH = Math.round(minDim * 0.012);
    roundRectPath(ctx, w * 0.04, h * 0.88, chipW, chipH, 2);
    ctx.fill();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Glass cards — frosted panels behind text
// ---------------------------------------------------------------------------

function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  composition: CompositionType,
  w: number, h: number,
  style: FoundationStyle
): void {
  const minDim = Math.min(w, h);
  const radius = Math.round(minDim * 0.012);

  const cardVariants: Record<string, { x: number; y: number; cw: number; ch: number } | null> = {
    "centered-hero": { x: w * 0.1, y: h * 0.25, cw: w * 0.8, ch: h * 0.5 },
    "editorial-spread": null,
    "asymmetric-tension": { x: w * 0.02, y: h * 0.18, cw: w * 0.58, ch: h * 0.7 },
    "z-pattern": null,
    "diagonal-dynamic": { x: w * 0.06, y: h * 0.14, cw: w * 0.65, ch: h * 0.38 },
    "golden-ratio": { x: w * 0.04, y: h * 0.22, cw: w * 0.55, ch: h * 0.62 },
    "rule-of-thirds": null,
    "full-bleed": null,
    "split-panel": { x: w * 0.52, y: h * 0.08, cw: w * 0.44, ch: h * 0.84 },
    "layered-depth": null,
    "minimal-whitespace": null,
    "typographic-poster": null,
  };

  const card = cardVariants[composition];
  if (!card) return;

  ctx.save();
  // Fill with subtle gradient
  const grad = ctx.createLinearGradient(card.x, card.y, card.x + card.cw, card.y + card.ch);
  grad.addColorStop(0, hexToRgba(style.textColor, 0.04));
  grad.addColorStop(0.5, hexToRgba(style.bgColor, 0.06));
  grad.addColorStop(1, hexToRgba(style.textColor, 0.02));
  ctx.fillStyle = grad;
  roundRectPath(ctx, card.x, card.y, card.cw, card.ch, radius);
  ctx.fill();
  // Subtle border
  ctx.strokeStyle = hexToRgba(style.textColor, 0.04);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

// ---------------------------------------------------------------------------
// Extra geometric accents — dot grids, cross markers
// ---------------------------------------------------------------------------

function drawExtraAccents(
  ctx: CanvasRenderingContext2D,
  w: number, h: number,
  style: FoundationStyle,
  intensity: number
): void {
  const minDim = Math.min(w, h);

  // Small dot grid in bottom-right corner
  ctx.save();
  ctx.fillStyle = hexToRgba(style.accentColor, 0.10);
  const dotSpacing = Math.round(minDim * 0.01);
  const dotR = Math.max(1, Math.round(minDim * 0.002));
  const dotStartX = w * 0.86;
  const dotStartY = h * 0.86;
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      ctx.beginPath();
      ctx.arc(dotStartX + c * dotSpacing, dotStartY + r * dotSpacing, dotR, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();

  // Cross marker accent
  ctx.save();
  const crossSize = Math.round(minDim * 0.006);
  const crossX = w * 0.92;
  const crossY = h * 0.08;
  ctx.strokeStyle = hexToRgba(style.accentColor, 0.15);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(crossX - crossSize, crossY);
  ctx.lineTo(crossX + crossSize, crossY);
  ctx.moveTo(crossX, crossY - crossSize);
  ctx.lineTo(crossX, crossY + crossSize);
  ctx.stroke();
  ctx.restore();

  if (intensity >= 3) {
    // Thin horizontal divider line near bottom
    ctx.save();
    ctx.strokeStyle = hexToRgba(style.accentColor, 0.06);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(w * 0.04, h * 0.94);
    ctx.lineTo(w * 0.96, h * 0.94);
    ctx.stroke();
    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// Template decorations — drawn as subtle background art, NOT selectable layers
// ---------------------------------------------------------------------------

function drawTemplateDecorations(
  ctx: CanvasRenderingContext2D,
  decorations: { type: string; relX: number; relY: number; relWidth: number; relHeight: number }[],
  w: number, h: number,
  style: FoundationStyle
): void {
  const minDim = Math.min(w, h);
  const color = hexToRgba(style.accentColor, 0.08);

  for (const deco of decorations) {
    const x = deco.relX * w;
    const y = deco.relY * h;
    const dw = deco.relWidth * w;
    const dh = deco.relHeight * h;

    ctx.save();
    ctx.globalAlpha = 0.35;

    switch (deco.type) {
      case "dot-grid": {
        const spacing = Math.round(minDim * 0.012);
        const cols = Math.max(2, Math.round(dw / spacing));
        const rows = Math.max(2, Math.round(dh / spacing));
        ctx.fillStyle = color;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            ctx.beginPath();
            ctx.arc(x + c * spacing, y + r * spacing, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        break;
      }
      case "concentric-circles": {
        const startR = Math.round(minDim * 0.015);
        const gap = Math.round(minDim * 0.01);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        for (let i = 0; i < 3; i++) {
          ctx.beginPath();
          ctx.arc(x, y, startR + i * gap, 0, Math.PI * 2);
          ctx.stroke();
        }
        break;
      }
      case "corner-brackets": {
        const bs = Math.round(minDim * 0.025);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        // TL
        ctx.beginPath(); ctx.moveTo(x, y + bs); ctx.lineTo(x, y); ctx.lineTo(x + bs, y); ctx.stroke();
        // TR
        ctx.beginPath(); ctx.moveTo(x + dw - bs, y); ctx.lineTo(x + dw, y); ctx.lineTo(x + dw, y + bs); ctx.stroke();
        // BL
        ctx.beginPath(); ctx.moveTo(x, y + dh - bs); ctx.lineTo(x, y + dh); ctx.lineTo(x + bs, y + dh); ctx.stroke();
        // BR
        ctx.beginPath(); ctx.moveTo(x + dw - bs, y + dh); ctx.lineTo(x + dw, y + dh); ctx.lineTo(x + dw, y + dh - bs); ctx.stroke();
        break;
      }
      case "cross-marker": {
        const sz = Math.round(minDim * 0.005);
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(x - sz, y); ctx.lineTo(x + sz, y);
        ctx.moveTo(x, y - sz); ctx.lineTo(x, y + sz);
        ctx.stroke();
        break;
      }
      case "accent-line": {
        ctx.fillStyle = color;
        ctx.fillRect(x, y, dw, Math.max(dh, 1.5));
        break;
      }
      case "divider": {
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.8;
        ctx.setLineDash([4, 3]);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dw, y); ctx.stroke();
        ctx.setLineDash([]);
        break;
      }
      default:
        break;
    }

    ctx.restore();
  }
}

// ---------------------------------------------------------------------------
// 9. Full design renderer — renders everything to an offscreen canvas
//    Used by mockups and multi-size exports
// ---------------------------------------------------------------------------

import {
  drawDesignBackground, applyOverlay, drawCoverImage, getCanvasFont,
} from "./canvas-utils";

/** Render a complete design to an offscreen canvas (background + foundation + layers).
 *  This creates a standalone canvas with the full design for use in mockups / exports. */
export function renderFullDesignToCanvas(
  doc: { layers: Layer[]; layerOrder: string[]; width: number; height: number; backgroundColor: string },
  designConfig: {
    composition: CompositionType;
    primaryColor: string;
    secondaryColor: string;
    textColor: string;
    fontStyle: FontStyle;
    visualIntensity: number;
    backgroundImage?: HTMLImageElement | null;
    overlayIntensity?: number;
    overlayType?: string;
    focalPointX?: number;
    focalPointY?: number;
    brandLogo?: string;
  },
  targetWidth?: number,
  targetHeight?: number
): HTMLCanvasElement {
  const w = targetWidth ?? doc.width;
  const h = targetHeight ?? doc.height;
  const scaleX = w / doc.width;
  const scaleY = h / doc.height;

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // 1. Background
  if (designConfig.backgroundImage) {
    drawCoverImage(ctx, designConfig.backgroundImage, w, h,
      designConfig.focalPointX ?? 0.5, designConfig.focalPointY ?? 0.5);
    applyOverlay(ctx, w, h,
      designConfig.overlayType || "gradient-bottom",
      designConfig.secondaryColor,
      (designConfig.overlayIntensity ?? 50) / 100);
  } else {
    drawDesignBackground(ctx, w, h, designConfig.secondaryColor, designConfig.primaryColor);
  }

  // 2. Foundation art
  renderCompositionFoundation(ctx, designConfig.composition, w, h, {
    accentColor: designConfig.primaryColor,
    bgColor: designConfig.secondaryColor,
    textColor: designConfig.textColor,
  }, designConfig.visualIntensity);

  // 3. Layers (scaled if needed)
  for (let i = doc.layerOrder.length - 1; i >= 0; i--) {
    const id = doc.layerOrder[i];
    const layer = doc.layers.find((l) => l.id === id);
    if (!layer || !layer.visible) continue;

    if (scaleX === 1 && scaleY === 1) {
      renderLayer(ctx, layer);
    } else {
      const scaled = { ...layer };
      scaled.x = layer.x * scaleX;
      scaled.y = layer.y * scaleY;
      scaled.width = layer.width * scaleX;
      scaled.height = layer.height * scaleY;
      if (scaled.type === "text") {
        const t = scaled as TextLayer;
        t.fontSize = Math.round(t.fontSize * Math.min(scaleX, scaleY));
        t.maxWidth = t.maxWidth * scaleX;
      } else if (scaled.type === "cta") {
        const c = scaled as CtaLayer;
        c.fontSize = Math.round(c.fontSize * Math.min(scaleX, scaleY));
        c.paddingX = c.paddingX * scaleX;
        c.paddingY = c.paddingY * scaleY;
      }
      renderLayer(ctx, scaled);
    }
  }

  // 4. Brand watermark
  if (designConfig.brandLogo && !doc.layers.some((l) => l.name === "Logo / Brand")) {
    ctx.save();
    ctx.font = getCanvasFont(700, w * 0.02, designConfig.fontStyle);
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = hexToRgba(designConfig.textColor, 0.4);
    ctx.fillText(designConfig.brandLogo, w * 0.95, h * 0.97);
    ctx.restore();
  }

  return canvas;
}

// ---------------------------------------------------------------------------
// 9b. Helper to import from canvas-utils (avoid circular)
// ---------------------------------------------------------------------------

import { getContrastColor as _gc } from "./canvas-utils";
const getContrastColor = _gc;

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
