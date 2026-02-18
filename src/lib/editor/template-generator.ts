// =============================================================================
// DMSuite — Parametric Business Card Template Generator
//
// Architecture: LayoutRecipe × CardTheme × AccentKit = DesignDocumentV2
//
// Instead of hundreds of hand-coded template functions, this engine:
//   1. Defines LAYOUT RECIPES — positional blueprints that specify WHERE
//      each element lives (name, title, company, contact, logo, accent).
//   2. Defines CARD THEMES — color × typography × texture packs.
//   3. Defines ACCENT KITS — decorative element sets (shapes, lines,
//      gradients) that are independently swappable.
//   4. Composes them at runtime into a DesignDocumentV2 with full AI tags.
//
// Combinatorial space:
//   40 recipes × 60 themes × 12 accent kits = 28,800 unique base designs.
//   Add AI parameter mutation on top → practically infinite.
//
// Every generated layer has semantic tags → fully AI-editable via ai-patch.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2,
  TextLayerV2, ShapeLayerV2, RGBA, Paint, GradientPaint, GradientStop,
  StrokeSpec, PatternPaint, Matrix2D,
} from "./schema";
import {
  createDocumentV2, addLayer, updateLayer,
  createTextLayerV2, createShapeLayerV2, createIconLayerV2,
  createImageLayerV2, createPathLayerV2,
  hexToRGBA, solidPaintHex,
} from "./schema";
import {
  type CardConfig, type FontSizes, type ContactEntry,
  getFontSizes, getFontFamily, getContactEntries, getContrastColor,
  CARD_SIZES, MM_PX, BLEED_MM, SAFE_MM,
  buildLogoLayerFn, buildContactLayersFn, buildPatternLayerFn, buildQrCodeLayerFn,
} from "./business-card-adapter";

// ============================================================================
// 1. Core Types
// ============================================================================

/** Semantic slot names that every recipe must map to positions */
export type SlotName =
  | "name" | "title" | "company" | "tagline"
  | "contact" | "logo" | "qrCode"
  | "primaryAccent" | "secondaryAccent" | "background";

/** Where and how a slot is placed */
export interface SlotSpec {
  /** Left edge as fraction of W (0–1) */
  xFrac: number;
  /** Top edge as fraction of H (0–1) */
  yFrac: number;
  /** Width fraction (0–1) */
  wFrac: number;
  /** Height fraction (0–1), for non-text slots */
  hFrac?: number;
  /** Text alignment */
  align?: "left" | "center" | "right";
  /** Font weight override */
  weight?: number;
  /** Letter spacing px */
  letterSpacing?: number;
  /** Uppercase */
  uppercase?: boolean;
  /** Italic */
  italic?: boolean;
  /** Opacity multiplier 0–1 */
  alpha?: number;
  /** Extra font-size multiplier (1 = default size from FontSizes) */
  sizeKey?: keyof FontSizes;
  /** For accent slots: which shape type */
  shape?: "rect" | "ellipse" | "line" | "path";
  /** Semantic tags for this slot's generated layer */
  tags?: string[];
}

/** A complete positional blueprint for a business card */
export interface LayoutRecipe {
  id: string;
  label: string;
  /** One-line description */
  description: string;
  /** Which accent kit this recipe pairs best with (default preference) */
  preferredAccentKit?: string;
  /** Slot definitions */
  slots: Partial<Record<SlotName, SlotSpec>>;
  /** Logo placement */
  logoXFrac: number;
  logoYFrac: number;
  logoSizeFrac: number;
  /** Contact block start Y, gap between lines */
  contactYFrac: number;
  contactGapFrac: number;
  contactAlign: "left" | "center" | "right";
  /** Contact indent from left/right edge */
  contactXFrac: number;
}

/** Decorative accent shapes composable per recipe */
export interface AccentLayer {
  kind: "rect" | "ellipse" | "line" | "gradient-rect" | "path";
  name: string;
  tags: string[];
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  /** "primary" | "secondary" | "text" | hex literal */
  fillColor?: "primary" | "secondary" | "text" | string;
  fillAlpha?: number;
  /** gradient: [fromColor, toColor, angleDeg] */
  gradient?: ["primary" | "secondary" | string, "primary" | "secondary" | string, number];
  strokeColor?: "primary" | "secondary" | string;
  strokeAlpha?: number;
  strokeWidth?: number;
  radii?: [number, number, number, number];
}

/** A set of decorative elements applied on top of a recipe */
export interface AccentKit {
  id: string;
  label: string;
  /** Pre-content layers (rendered behind text) */
  background: AccentLayer[];
  /** Post-content layers (rendered on top of text) */
  overlay: AccentLayer[];
}

/** Complete color + typography + texture system */
export interface CardTheme {
  id: string;
  label: string;
  category: "minimal" | "modern" | "classic" | "luxury" | "creative" | "nature" | "tech" | "bold";
  mood: "light" | "dark" | "vibrant" | "muted" | "metallic";
  primary: string;
  secondary: string;
  text: string;
  bg: string;
  font: CardConfig["fontStyle"];
  pattern: string;
  /** Optional: override contact text alpha */
  contactAlpha?: number;
  /** Optional: override name weight */
  nameWeight?: number;
}

/** Parameters for generating a card document */
export interface GenerateParams {
  cfg: CardConfig;
  recipeId?: string;
  themeId?: string;
  accentKitId?: string;
  /** Override theme colors from cfg (when user has already set colors) */
  useCfgColors?: boolean;
  logoImg?: HTMLImageElement;
}

// ============================================================================
// 2. Paint Helpers (internal)
// ============================================================================

function lg(angleDeg: number, ...stops: [string, number, number?][]): GradientPaint {
  const rad = (angleDeg * Math.PI) / 180;
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  return { kind: "gradient", gradientType: "linear", stops: gradStops, transform, spread: "pad" };
}

function sp(hex: string, alpha = 1): Paint { return solidPaintHex(hex, alpha); }

function pp(type: string, color: RGBA, opacity: number, spacing = 28): PatternPaint {
  return {
    kind: "pattern",
    patternType: type as PatternPaint["patternType"],
    color, scale: 1, rotation: 0, opacity, spacing,
  };
}

function sk(hex: string, width: number, alpha = 1): StrokeSpec {
  return { paint: solidPaintHex(hex, alpha), width, align: "center", dash: [], cap: "butt", join: "miter", miterLimit: 10 };
}

/** Resolve "primary"|"secondary"|"text" → hex from a theme/cfg */
function resolveColor(
  c: "primary" | "secondary" | "text" | string,
  theme: CardTheme, cfg: CardConfig, useCfg: boolean
): string {
  const p = useCfg ? cfg.primaryColor   : theme.primary;
  const s = useCfg ? cfg.secondaryColor : theme.secondary;
  const t = useCfg ? cfg.textColor      : theme.text;
  if (c === "primary")   return p;
  if (c === "secondary") return s;
  if (c === "text")      return t;
  return c; // literal hex
}

// ============================================================================
// 3. Layer factory helpers (recipe-aware)
// ============================================================================

function rText(opts: {
  name: string; x: number; y: number; w: number; h?: number;
  text: string; fontSize: number; ff: string; weight?: number;
  color: string; alpha?: number; align?: "left" | "center" | "right";
  tags: string[]; uppercase?: boolean; italic?: boolean;
  letterSpacing?: number; lineHeight?: number;
}): TextLayerV2 {
  const layer = createTextLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y,
    width: opts.w, height: opts.h ?? Math.round(opts.fontSize * 1.6),
    text: opts.text,
    fontSize: opts.fontSize,
    fontFamily: opts.ff,
    fontWeight: opts.weight ?? 400,
    color: hexToRGBA(opts.color, opts.alpha ?? 1),
    align: opts.align ?? "left",
    tags: opts.tags,
  });
  if (opts.uppercase)                       layer.defaultStyle.uppercase = true;
  if (opts.italic)                          layer.defaultStyle.italic    = true;
  if (opts.letterSpacing !== undefined)     layer.defaultStyle.letterSpacing = opts.letterSpacing;
  if (opts.lineHeight    !== undefined)     layer.defaultStyle.lineHeight    = opts.lineHeight;
  return layer;
}

function rRect(opts: {
  name: string; x: number; y: number; w: number; h: number;
  fill?: Paint; stroke?: StrokeSpec; tags?: string[];
  radii?: [number, number, number, number]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    shapeType: "rectangle",
    fill: opts.fill ?? solidPaintHex("#000000", 0),
    stroke: opts.stroke,
    cornerRadii: opts.radii,
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

function rEllipse(opts: {
  name: string; cx: number; cy: number; rx: number; ry: number;
  fill?: Paint; tags?: string[]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: opts.fill ?? solidPaintHex("#000000", 0.1),
    tags: opts.tags ?? ["decorative"],
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

function rLine(opts: {
  name: string; x: number; y: number; w: number;
  color: string; alpha?: number; thickness?: number; tags?: string[];
}): ShapeLayerV2 {
  return createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y,
    width: opts.w, height: opts.thickness ?? 1.5,
    shapeType: "rectangle",
    fill: solidPaintHex(opts.color, opts.alpha ?? 0.2),
    tags: opts.tags ?? ["decorative", "divider"],
  });
}

/** Build a single AccentLayer into a LayerV2 */
function buildAccentLayer(al: AccentLayer, W: number, H: number, theme: CardTheme, cfg: CardConfig, useCfg: boolean): LayerV2 | null {
  const x = al.xFrac * W;
  const y = al.yFrac * H;
  const w = al.wFrac * W;
  const h = al.hFrac * H;

  let fill: Paint | undefined;
  let strokeSpec: StrokeSpec | undefined;

  if (al.gradient) {
    const [from, to, angle] = al.gradient;
    const fHex = resolveColor(from, theme, cfg, useCfg);
    const tHex = resolveColor(to,   theme, cfg, useCfg);
    fill = lg(angle, [fHex, 0], [tHex, 1]);
  } else if (al.fillColor) {
    const hex = resolveColor(al.fillColor, theme, cfg, useCfg);
    fill = sp(hex, al.fillAlpha ?? 1);
  }

  if (al.strokeColor) {
    const hex = resolveColor(al.strokeColor, theme, cfg, useCfg);
    strokeSpec = sk(hex, al.strokeWidth ?? 1.5, al.strokeAlpha ?? 0.5);
  }

  switch (al.kind) {
    case "rect":
    case "gradient-rect":
      return rRect({ name: al.name, x, y, w, h, fill, stroke: strokeSpec, tags: al.tags, radii: al.radii });
    case "ellipse":
      return rEllipse({ name: al.name, cx: x + w / 2, cy: y + h / 2, rx: w / 2, ry: h / 2, fill, tags: al.tags });
    case "line":
      return rLine({ name: al.name, x, y, w, color: al.fillColor ? resolveColor(al.fillColor, theme, cfg, useCfg) : "#ffffff", alpha: al.fillAlpha ?? 0.2, thickness: h, tags: al.tags });
    default:
      return null;
  }
}

// ============================================================================
// 4. Layout Recipes (40 positional blueprints)
// ============================================================================

export const LAYOUT_RECIPES: LayoutRecipe[] = [
  // ─── Minimal / Clean ───────────────────────────────────────────────────────
  {
    id: "left-stack",
    label: "Left Stack",
    description: "All content left-aligned, name top, contact bottom",
    logoXFrac: 0.78, logoYFrac: 0.12, logoSizeFrac: 0.16,
    contactYFrac: 0.62, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.09,
    slots: {
      name:    { xFrac: 0.09, yFrac: 0.20, wFrac: 0.60, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.09, yFrac: 0.40, wFrac: 0.60, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.09, yFrac: 0.54, wFrac: 0.60, sizeKey: "company", weight: 500, align: "left", alpha: 0.5,  tags: ["company"] },
      tagline: { xFrac: 0.09, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.35, tags: ["tagline"] },
    },
  },
  {
    id: "center-stack",
    label: "Center Stack",
    description: "Everything center-aligned, name dominant",
    logoXFrac: 0.43, logoYFrac: 0.08, logoSizeFrac: 0.14,
    contactYFrac: 0.63, contactGapFrac: 0.11, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.32, wFrac: 1, sizeKey: "name",    weight: 700, align: "center", tags: ["name", "primary-text"] },
      title:   { xFrac: 0, yFrac: 0.50, wFrac: 1, sizeKey: "title",   weight: 400, align: "center", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.62, wFrac: 1, sizeKey: "label",   weight: 600, align: "center", alpha: 0.45, uppercase: true, letterSpacing: 3, tags: ["company"] },
      tagline: { xFrac: 0, yFrac: 0.91, wFrac: 1, sizeKey: "tagline", weight: 300, align: "center", alpha: 0.35, tags: ["tagline"] },
    },
  },
  {
    id: "right-flip",
    label: "Right Flip",
    description: "Name right, contact left — creates visual tension",
    logoXFrac: 0.08, logoYFrac: 0.12, logoSizeFrac: 0.14,
    contactYFrac: 0.60, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0, yFrac: 0.22, wFrac: 0.88, sizeKey: "name",    weight: 600, align: "right", tags: ["name", "primary-text"] },
      title:   { xFrac: 0, yFrac: 0.40, wFrac: 0.88, sizeKey: "title",   weight: 400, align: "right", alpha: 0.6, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.91, wFrac: 0.92, sizeKey: "label",   weight: 500, align: "right", alpha: 0.4, uppercase: true, letterSpacing: 2, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.12, wFrac: 0.50, sizeKey: "tagline", weight: 300, align: "left", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "top-bar-left",
    label: "Top Bar Left",
    description: "Name in header band, contact below",
    logoXFrac: 0.78, logoYFrac: 0.22, logoSizeFrac: 0.14,
    contactYFrac: 0.56, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.12, wFrac: 0.65, sizeKey: "titleLg", weight: 700, align: "left", tags: ["name", "primary-text"], uppercase: true, letterSpacing: 2 },
      company: { xFrac: 0.08, yFrac: 0.33, wFrac: 0.65, sizeKey: "company", weight: 400, align: "left", alpha: 0.65, tags: ["company"] },
      title:   { xFrac: 0.08, yFrac: 0.44, wFrac: 0.65, sizeKey: "label",   weight: 300, align: "left", alpha: 0.5, italic: true, tags: ["title"] },
      tagline: { xFrac: 0.08, yFrac: 0.92, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, tags: ["tagline"] },
    },
  },
  {
    id: "bottom-anchor",
    label: "Bottom Anchor",
    description: "Logo and name anchor the bottom, contact top-right",
    logoXFrac: 0.08, logoYFrac: 0.68, logoSizeFrac: 0.18,
    contactYFrac: 0.12, contactGapFrac: 0.10, contactAlign: "right", contactXFrac: 0.90,
    slots: {
      name:    { xFrac: 0.32, yFrac: 0.68, wFrac: 0.60, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.32, yFrac: 0.82, wFrac: 0.60, sizeKey: "title",   weight: 400, align: "left", alpha: 0.6, tags: ["title"] },
      company: { xFrac: 0.32, yFrac: 0.91, wFrac: 0.60, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, tags: ["company"] },
    },
  },

  // ─── Split / Divided ───────────────────────────────────────────────────────
  {
    id: "vertical-split-40",
    label: "Vertical Split 40%",
    description: "Left 40% solid panel with name, right contact",
    preferredAccentKit: "split-panel",
    logoXFrac: 0.07, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.35, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.45,
    slots: {
      name:    { xFrac: 0.07, yFrac: 0.48, wFrac: 0.28, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.07, yFrac: 0.65, wFrac: 0.28, sizeKey: "title",   weight: 400, align: "left", alpha: 0.75, tags: ["title"] },
      company: { xFrac: 0.07, yFrac: 0.88, wFrac: 0.28, sizeKey: "label",   weight: 600, align: "left", alpha: 0.45, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.45, yFrac: 0.90, wFrac: 0.47, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "vertical-split-60",
    label: "Vertical Split 60%",
    description: "Right 60% content area, left branding panel",
    preferredAccentKit: "split-panel",
    logoXFrac: 0.06, logoYFrac: 0.35, logoSizeFrac: 0.20,
    contactYFrac: 0.45, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.42,
    slots: {
      name:    { xFrac: 0.42, yFrac: 0.18, wFrac: 0.52, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.42, yFrac: 0.36, wFrac: 0.52, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.06, yFrac: 0.78, wFrac: 0.28, sizeKey: "label",   weight: 500, align: "left", alpha: 0.5, uppercase: true, letterSpacing: 2, tags: ["company"] },
    },
  },
  {
    id: "horizontal-split-top",
    label: "H-Split Top",
    description: "Top 45% header band, lower content area",
    preferredAccentKit: "header-band",
    logoXFrac: 0.78, logoYFrac: 0.08, logoSizeFrac: 0.16,
    contactYFrac: 0.62, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.15, wFrac: 0.65, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.32, wFrac: 0.65, sizeKey: "title",   weight: 400, align: "left", alpha: 0.7, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.55, wFrac: 0.82, sizeKey: "company", weight: 500, align: "left", alpha: 0.6, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.35, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "horizontal-split-bottom",
    label: "H-Split Bottom",
    description: "Lower panel for name, upper area contact",
    preferredAccentKit: "footer-band",
    logoXFrac: 0.08, logoYFrac: 0.12, logoSizeFrac: 0.18,
    contactYFrac: 0.14, contactGapFrac: 0.10, contactAlign: "right", contactXFrac: 0.92,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.63, wFrac: 0.82, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.77, wFrac: 0.82, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.88, wFrac: 0.82, sizeKey: "label",   weight: 500, align: "left", alpha: 0.45, uppercase: true, tags: ["company"] },
    },
  },
  {
    id: "diagonal-split",
    label: "Diagonal Split",
    description: "Angled band cuts card from corner to corner",
    preferredAccentKit: "diagonal-band",
    logoXFrac: 0.07, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.55, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.20, wFrac: 0.50, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.36, wFrac: 0.50, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.50, yFrac: 0.65, wFrac: 0.42, sizeKey: "label",   weight: 600, align: "right", alpha: 0.5, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.90, wFrac: 0.50, sizeKey: "tagline", weight: 300, align: "left", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },

  // ─── Grid / Column ─────────────────────────────────────────────────────────
  {
    id: "two-column",
    label: "Two Column",
    description: "Left col: identity; right col: contact grid",
    logoXFrac: 0.56, logoYFrac: 0.10, logoSizeFrac: 0.16,
    contactYFrac: 0.35, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.55,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.22, wFrac: 0.40, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.40, wFrac: 0.40, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.55, wFrac: 0.40, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.91, wFrac: 0.38, sizeKey: "tagline", weight: 300, align: "left", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "three-row",
    label: "Three Row",
    description: "Card divided into three horizontal zones",
    logoXFrac: 0.82, logoYFrac: 0.45, logoSizeFrac: 0.12,
    contactYFrac: 0.65, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.14, wFrac: 0.72, sizeKey: "nameXl",  weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.44, wFrac: 0.72, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.52, wFrac: 0.72, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, tags: ["company"] },
    },
  },
  {
    id: "name-hero",
    label: "Name Hero",
    description: "Oversized name dominates — minimal everything else",
    logoXFrac: 0.82, logoYFrac: 0.08, logoSizeFrac: 0.12,
    contactYFrac: 0.75, contactGapFrac: 0.09, contactAlign: "right", contactXFrac: 0.92,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.22, wFrac: 0.82, sizeKey: "nameXl",  weight: 800, align: "left", tags: ["name", "primary-text"], letterSpacing: -1 },
      title:   { xFrac: 0.08, yFrac: 0.62, wFrac: 0.60, sizeKey: "title",   weight: 300, align: "left", alpha: 0.5, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.72, wFrac: 0.60, sizeKey: "label",   weight: 400, align: "left", alpha: 0.4, uppercase: true, letterSpacing: 3, tags: ["company"] },
    },
  },
  {
    id: "logo-dominant",
    label: "Logo Dominant",
    description: "Large center logo, text peripheral",
    logoXFrac: 0.38, logoYFrac: 0.08, logoSizeFrac: 0.24,
    contactYFrac: 0.62, contactGapFrac: 0.10, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.48, wFrac: 1, sizeKey: "name",    weight: 600, align: "center", tags: ["name", "primary-text"] },
      title:   { xFrac: 0, yFrac: 0.58, wFrac: 1, sizeKey: "label",   weight: 300, align: "center", alpha: 0.5, italic: true, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.91, wFrac: 1, sizeKey: "label",   weight: 500, align: "center", alpha: 0.35, uppercase: true, letterSpacing: 4, tags: ["company"] },
    },
  },
  {
    id: "boxed-center",
    label: "Boxed Center",
    description: "Content inside a centered soft-bordered box",
    preferredAccentKit: "border-box",
    logoXFrac: 0.80, logoYFrac: 0.12, logoSizeFrac: 0.13,
    contactYFrac: 0.60, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.12,
    slots: {
      name:    { xFrac: 0.12, yFrac: 0.20, wFrac: 0.64, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.12, yFrac: 0.36, wFrac: 0.64, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.12, yFrac: 0.47, wFrac: 0.64, sizeKey: "company", weight: 500, align: "left", alpha: 0.5, tags: ["company"] },
      tagline: { xFrac: 0.12, yFrac: 0.91, wFrac: 0.76, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },

  // ─── Modern / Editorial ────────────────────────────────────────────────────
  {
    id: "editorial-left",
    label: "Editorial Left",
    description: "Magazine-style left-weighted layout with category label",
    logoXFrac: 0.08, logoYFrac: 0.75, logoSizeFrac: 0.14,
    contactYFrac: 0.45, contactGapFrac: 0.10, contactAlign: "right", contactXFrac: 0.92,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.22, wFrac: 0.75, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.40, wFrac: 0.75, sizeKey: "title",   weight: 300, align: "left", alpha: 0.5, italic: true, tags: ["title"] },
      company: { xFrac: 0.29, yFrac: 0.85, wFrac: 0.63, sizeKey: "label",   weight: 400, align: "left", alpha: 0.4, uppercase: true, letterSpacing: 3, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.10, wFrac: 0.75, sizeKey: "tagline", weight: 600, align: "left", alpha: 0.4, uppercase: true, letterSpacing: 5, tags: ["tagline"] },
    },
  },
  {
    id: "editorial-right",
    label: "Editorial Right",
    description: "Reversed magazine layout, right-heavy",
    logoXFrac: 0.78, logoYFrac: 0.75, logoSizeFrac: 0.14,
    contactYFrac: 0.45, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.17, yFrac: 0.22, wFrac: 0.75, sizeKey: "name",    weight: 700, align: "right", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.17, yFrac: 0.40, wFrac: 0.75, sizeKey: "title",   weight: 300, align: "right", alpha: 0.5, italic: true, tags: ["title"] },
      company: { xFrac: 0.17, yFrac: 0.85, wFrac: 0.75, sizeKey: "label",   weight: 400, align: "right", alpha: 0.4, uppercase: true, letterSpacing: 3, tags: ["company"] },
    },
  },
  {
    id: "monospace-grid",
    label: "Monospace Grid",
    description: "Typewriter aesthetics, technical grid",
    logoXFrac: 0.82, logoYFrac: 0.65, logoSizeFrac: 0.12,
    contactYFrac: 0.58, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.20, wFrac: 0.72, sizeKey: "name",    weight: 400, align: "left", tags: ["name", "primary-text"], letterSpacing: 1 },
      title:   { xFrac: 0.08, yFrac: 0.36, wFrac: 0.72, sizeKey: "label",   weight: 400, align: "left", alpha: 0.6, tags: ["title"], uppercase: true, letterSpacing: 2 },
      company: { xFrac: 0.08, yFrac: 0.44, wFrac: 0.72, sizeKey: "label",   weight: 400, align: "left", alpha: 0.4, tags: ["company"], uppercase: true, letterSpacing: 2 },
      tagline: { xFrac: 0.08, yFrac: 0.90, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, tags: ["tagline"] },
    },
  },
  {
    id: "oversized-company",
    label: "Oversized Company",
    description: "Company name huge, personal details subordinate",
    logoXFrac: 0.08, logoYFrac: 0.08, logoSizeFrac: 0.14,
    contactYFrac: 0.72, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      company: { xFrac: 0, yFrac: 0.32, wFrac: 1, sizeKey: "nameXl",  weight: 800, align: "center", alpha: 0.9, tags: ["company"] },
      name:    { xFrac: 0.08, yFrac: 0.57, wFrac: 0.82, sizeKey: "title",   weight: 500, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.66, wFrac: 0.82, sizeKey: "label",   weight: 300, align: "left", alpha: 0.5, italic: true, tags: ["title"] },
    },
  },
  {
    id: "pill-badge",
    label: "Pill Badge",
    description: "Card feels like an identity badge / lanyard card",
    preferredAccentKit: "border-box",
    logoXFrac: 0.40, logoYFrac: 0.06, logoSizeFrac: 0.20,
    contactYFrac: 0.65, contactGapFrac: 0.10, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.40, wFrac: 1, sizeKey: "name",    weight: 700, align: "center", tags: ["name", "primary-text"] },
      title:   { xFrac: 0, yFrac: 0.52, wFrac: 1, sizeKey: "title",   weight: 400, align: "center", alpha: 0.6, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.60, wFrac: 1, sizeKey: "label",   weight: 500, align: "center", alpha: 0.4, uppercase: true, letterSpacing: 4, tags: ["company"] },
    },
  },

  // ─── Classic / Corporate ──────────────────────────────────────────────────
  {
    id: "corporate-left",
    label: "Corporate Left",
    description: "Traditional professional with side stripe",
    preferredAccentKit: "side-stripe",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.16,
    contactYFrac: 0.60, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.10,
    slots: {
      name:    { xFrac: 0.10, yFrac: 0.20, wFrac: 0.64, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.10, yFrac: 0.36, wFrac: 0.64, sizeKey: "title",   weight: 400, align: "left", alpha: 0.6, tags: ["title"] },
      company: { xFrac: 0.10, yFrac: 0.46, wFrac: 0.64, sizeKey: "company", weight: 500, align: "left", alpha: 0.5, tags: ["company"] },
      tagline: { xFrac: 0.10, yFrac: 0.92, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "double-border",
    label: "Double Border",
    description: "Classic double-line border frame",
    preferredAccentKit: "double-border",
    logoXFrac: 0.40, logoYFrac: 0.06, logoSizeFrac: 0.20,
    contactYFrac: 0.62, contactGapFrac: 0.10, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.36, wFrac: 1, sizeKey: "name",    weight: 500, align: "center", tags: ["name", "primary-text"], letterSpacing: 2 },
      title:   { xFrac: 0, yFrac: 0.50, wFrac: 1, sizeKey: "title",   weight: 300, align: "center", alpha: 0.6, italic: true, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.91, wFrac: 1, sizeKey: "label",   weight: 500, align: "center", alpha: 0.4, uppercase: true, letterSpacing: 4, tags: ["company"] },
    },
  },
  {
    id: "engraved-classic",
    label: "Engraved Classic",
    description: "Raised text feel, muted tones, letter-spaced",
    logoXFrac: 0.78, logoYFrac: 0.42, logoSizeFrac: 0.14,
    contactYFrac: 0.62, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.20, wFrac: 0.64, sizeKey: "name",    weight: 400, align: "left", tags: ["name", "primary-text"], letterSpacing: 2 },
      title:   { xFrac: 0.08, yFrac: 0.36, wFrac: 0.64, sizeKey: "title",   weight: 300, align: "left", alpha: 0.55, italic: true, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.47, wFrac: 0.64, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, letterSpacing: 4, tags: ["company"] },
      tagline: { xFrac: 0.08, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "traditional-crest",
    label: "Traditional Crest",
    description: "Formal centered with top crest position",
    preferredAccentKit: "crest-top",
    logoXFrac: 0.40, logoYFrac: 0.06, logoSizeFrac: 0.20,
    contactYFrac: 0.68, contactGapFrac: 0.10, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.40, wFrac: 1, sizeKey: "name",    weight: 500, align: "center", tags: ["name", "primary-text"], letterSpacing: 3 },
      title:   { xFrac: 0, yFrac: 0.54, wFrac: 1, sizeKey: "title",   weight: 300, align: "center", alpha: 0.55, italic: true, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.63, wFrac: 1, sizeKey: "label",   weight: 500, align: "center", alpha: 0.4, uppercase: true, letterSpacing: 5, tags: ["company"] },
    },
  },

  // ─── Luxury / Premium ──────────────────────────────────────────────────────
  {
    id: "luxury-left",
    label: "Luxury Left",
    description: "Opulent left-weighted with corner ornaments",
    preferredAccentKit: "corner-ornaments",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.60, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.10,
    slots: {
      name:    { xFrac: 0.10, yFrac: 0.22, wFrac: 0.64, sizeKey: "name",    weight: 500, align: "left", tags: ["name", "primary-text"], letterSpacing: 2 },
      title:   { xFrac: 0.10, yFrac: 0.38, wFrac: 0.64, sizeKey: "title",   weight: 300, align: "left", alpha: 0.6, italic: true, tags: ["title"] },
      company: { xFrac: 0.10, yFrac: 0.48, wFrac: 0.64, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, letterSpacing: 4, tags: ["company"] },
      tagline: { xFrac: 0.10, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "luxury-center",
    label: "Luxury Center",
    description: "Centered opulence, tall tracking, corner marks",
    preferredAccentKit: "corner-ornaments",
    logoXFrac: 0.40, logoYFrac: 0.06, logoSizeFrac: 0.20,
    contactYFrac: 0.65, contactGapFrac: 0.10, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.38, wFrac: 1, sizeKey: "name",    weight: 500, align: "center", tags: ["name", "primary-text"], letterSpacing: 3 },
      title:   { xFrac: 0, yFrac: 0.52, wFrac: 1, sizeKey: "title",   weight: 300, align: "center", alpha: 0.55, italic: true, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.62, wFrac: 1, sizeKey: "label",   weight: 500, align: "center", alpha: 0.38, uppercase: true, letterSpacing: 5, tags: ["company"] },
      tagline: { xFrac: 0, yFrac: 0.88, wFrac: 1, sizeKey: "tagline", weight: 300, align: "center", alpha: 0.28, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "art-deco-center",
    label: "Art Deco Center",
    description: "1920s geometric symmetry, central composition",
    preferredAccentKit: "art-deco-frame",
    logoXFrac: 0.40, logoYFrac: 0.06, logoSizeFrac: 0.20,
    contactYFrac: 0.62, contactGapFrac: 0.09, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.36, wFrac: 1, sizeKey: "name",    weight: 500, align: "center", tags: ["name", "primary-text"], letterSpacing: 4 },
      title:   { xFrac: 0, yFrac: 0.51, wFrac: 1, sizeKey: "title",   weight: 300, align: "center", alpha: 0.6, italic: true, tags: ["title"] },
      company: { xFrac: 0, yFrac: 0.91, wFrac: 1, sizeKey: "label",   weight: 600, align: "center", alpha: 0.4, uppercase: true, letterSpacing: 6, tags: ["company"] },
    },
  },
  {
    id: "velvet-noir",
    label: "Velvet Noir",
    description: "Deep dark luxury, wide tracking, gold tones",
    preferredAccentKit: "minimal-lines",
    logoXFrac: 0.78, logoYFrac: 0.55, logoSizeFrac: 0.14,
    contactYFrac: 0.62, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.10,
    slots: {
      name:    { xFrac: 0.10, yFrac: 0.18, wFrac: 0.65, sizeKey: "name",    weight: 400, align: "left", tags: ["name", "primary-text"], letterSpacing: 3 },
      title:   { xFrac: 0.10, yFrac: 0.34, wFrac: 0.65, sizeKey: "title",   weight: 300, align: "left", alpha: 0.6, italic: true, tags: ["title"] },
      company: { xFrac: 0.10, yFrac: 0.44, wFrac: 0.65, sizeKey: "label",   weight: 500, align: "left", alpha: 0.35, uppercase: true, letterSpacing: 5, tags: ["company"] },
      tagline: { xFrac: 0.10, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.28, italic: true, tags: ["tagline"] },
    },
  },

  // ─── Creative ──────────────────────────────────────────────────────────────
  {
    id: "neon-left",
    label: "Neon Left",
    description: "Dark bg, vivid accent glow left edge",
    preferredAccentKit: "left-glow-bar",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.58, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.10,
    slots: {
      name:    { xFrac: 0.10, yFrac: 0.18, wFrac: 0.65, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.10, yFrac: 0.35, wFrac: 0.65, sizeKey: "title",   weight: 400, align: "left", alpha: 0.7, tags: ["title"] },
      company: { xFrac: 0.10, yFrac: 0.46, wFrac: 0.65, sizeKey: "label",   weight: 500, align: "left", alpha: 0.45, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.10, yFrac: 0.91, wFrac: 0.82, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, tags: ["tagline"] },
    },
  },
  {
    id: "neon-border",
    label: "Neon Border",
    description: "Full glowing border frame on dark background",
    preferredAccentKit: "neon-border",
    logoXFrac: 0.78, logoYFrac: 0.13, logoSizeFrac: 0.14,
    contactYFrac: 0.60, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.10,
    slots: {
      name:    { xFrac: 0.10, yFrac: 0.22, wFrac: 0.65, sizeKey: "nameXl",  weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.10, yFrac: 0.42, wFrac: 0.65, sizeKey: "title",   weight: 400, alpha: 0.75, align: "left", tags: ["title"] },
      company: { xFrac: 0.10, yFrac: 0.91, wFrac: 0.82, sizeKey: "label",   weight: 500, align: "right", alpha: 0.45, uppercase: true, tags: ["company"] },
    },
  },
  {
    id: "gradient-full",
    label: "Gradient Full",
    description: "Full-bleed gradient background, white content",
    preferredAccentKit: "subtle-circles",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.15,
    contactYFrac: 0.60, contactGapFrac: 0.11, contactAlign: "left", contactXFrac: 0.09,
    slots: {
      name:    { xFrac: 0.09, yFrac: 0.20, wFrac: 0.65, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.09, yFrac: 0.36, wFrac: 0.65, sizeKey: "title",   weight: 400, align: "left", alpha: 0.75, tags: ["title"] },
      company: { xFrac: 0.09, yFrac: 0.91, wFrac: 0.82, sizeKey: "label",   weight: 500, align: "right", alpha: 0.5, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.09, yFrac: 0.47, wFrac: 0.65, sizeKey: "tagline", weight: 300, align: "left", alpha: 0.55, italic: true, tags: ["tagline"] },
    },
  },
  {
    id: "photo-overlay",
    label: "Photo Overlay",
    description: "Text overlaid on subtle background graphic",
    preferredAccentKit: "vignette",
    logoXFrac: 0.08, logoYFrac: 0.10, logoSizeFrac: 0.16,
    contactYFrac: 0.58, contactGapFrac: 0.11, contactAlign: "right", contactXFrac: 0.92,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.60, wFrac: 0.82, sizeKey: "name",    weight: 700, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.08, yFrac: 0.75, wFrac: 0.82, sizeKey: "title",   weight: 400, align: "left", alpha: 0.8, tags: ["title"] },
      company: { xFrac: 0.08, yFrac: 0.87, wFrac: 0.82, sizeKey: "label",   weight: 600, align: "left", alpha: 0.6, uppercase: true, tags: ["company"] },
    },
  },
  {
    id: "dot-matrix",
    label: "Dot Matrix",
    description: "Halftone dot pattern with bold sans type",
    preferredAccentKit: "dot-accent",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.60, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.09,
    slots: {
      name:    { xFrac: 0.09, yFrac: 0.20, wFrac: 0.65, sizeKey: "name",    weight: 800, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.09, yFrac: 0.38, wFrac: 0.65, sizeKey: "title",   weight: 400, align: "left", alpha: 0.65, tags: ["title"] },
      company: { xFrac: 0.09, yFrac: 0.48, wFrac: 0.65, sizeKey: "label",   weight: 600, align: "left", alpha: 0.4, uppercase: true, tags: ["company"] },
    },
  },

  // ─── Typographic ──────────────────────────────────────────────────────────
  {
    id: "type-only-left",
    label: "Type Only Left",
    description: "Pure typography, zero decoration",
    logoXFrac: 0.82, logoYFrac: 0.68, logoSizeFrac: 0.12,
    contactYFrac: 0.62, contactGapFrac: 0.09, contactAlign: "left", contactXFrac: 0.08,
    slots: {
      name:    { xFrac: 0.08, yFrac: 0.20, wFrac: 0.72, sizeKey: "nameXl",  weight: 200, align: "left", tags: ["name", "primary-text"], letterSpacing: 1 },
      title:   { xFrac: 0.08, yFrac: 0.40, wFrac: 0.72, sizeKey: "title",   weight: 400, align: "left", alpha: 0.5, tags: ["title"], uppercase: true, letterSpacing: 3 },
      company: { xFrac: 0.08, yFrac: 0.50, wFrac: 0.72, sizeKey: "label",   weight: 600, align: "left", alpha: 0.35, uppercase: true, letterSpacing: 4, tags: ["company"] },
    },
  },
  {
    id: "type-only-center",
    label: "Type Only Center",
    description: "Swiss typography — pure centered type",
    logoXFrac: 0.40, logoYFrac: 0.76, logoSizeFrac: 0.20,
    contactYFrac: 0.62, contactGapFrac: 0.09, contactAlign: "center", contactXFrac: 0.50,
    slots: {
      name:    { xFrac: 0, yFrac: 0.22, wFrac: 1, sizeKey: "nameXl",  weight: 200, align: "center", tags: ["name", "primary-text"], letterSpacing: 2 },
      title:   { xFrac: 0, yFrac: 0.44, wFrac: 1, sizeKey: "title",   weight: 400, align: "center", alpha: 0.5, tags: ["title"], uppercase: true, letterSpacing: 3 },
      company: { xFrac: 0, yFrac: 0.53, wFrac: 1, sizeKey: "label",   weight: 600, align: "center", alpha: 0.35, uppercase: true, letterSpacing: 4, tags: ["company"] },
    },
  },
  {
    id: "large-initial",
    label: "Large Initial",
    description: "First initial as a background watermark, text right",
    logoXFrac: 0.78, logoYFrac: 0.10, logoSizeFrac: 0.14,
    contactYFrac: 0.60, contactGapFrac: 0.10, contactAlign: "left", contactXFrac: 0.42,
    slots: {
      name:    { xFrac: 0.42, yFrac: 0.22, wFrac: 0.50, sizeKey: "name",    weight: 600, align: "left", tags: ["name", "primary-text"] },
      title:   { xFrac: 0.42, yFrac: 0.38, wFrac: 0.50, sizeKey: "title",   weight: 400, align: "left", alpha: 0.6, tags: ["title"] },
      company: { xFrac: 0.42, yFrac: 0.48, wFrac: 0.50, sizeKey: "label",   weight: 500, align: "left", alpha: 0.4, uppercase: true, tags: ["company"] },
      tagline: { xFrac: 0.42, yFrac: 0.91, wFrac: 0.50, sizeKey: "tagline", weight: 300, align: "right", alpha: 0.3, italic: true, tags: ["tagline"] },
    },
  },
];

export const LAYOUT_RECIPE_MAP: Record<string, LayoutRecipe> = Object.fromEntries(
  LAYOUT_RECIPES.map(r => [r.id, r])
);

// ============================================================================
// 5. Accent Kits (12 decorative element sets)
// ============================================================================

export const ACCENT_KITS: AccentKit[] = [
  {
    id: "minimal-lines",
    label: "Minimal Lines",
    background: [
      { kind: "line", name: "Top Rule",    tags: ["decorative", "accent"], xFrac: 0.08, yFrac: 0.08,  wFrac: 0.12, hFrac: 0.004, fillColor: "primary", fillAlpha: 0.35 },
      { kind: "line", name: "Bottom Rule", tags: ["decorative", "accent"], xFrac: 0.08, yFrac: 0.895, wFrac: 0.82, hFrac: 0.003, fillColor: "primary", fillAlpha: 0.15 },
    ],
    overlay: [],
  },
  {
    id: "side-stripe",
    label: "Side Stripe",
    background: [
      { kind: "gradient-rect", name: "Left Stripe", tags: ["decorative", "stripe", "accent"], xFrac: 0, yFrac: 0, wFrac: 0.012, hFrac: 1, gradient: ["primary", "secondary", 90] },
      { kind: "rect",          name: "Stripe Glow",  tags: ["decorative"],                   xFrac: 0.012, yFrac: 0, wFrac: 0.008, hFrac: 1, fillColor: "primary", fillAlpha: 0.05 },
    ],
    overlay: [],
  },
  {
    id: "header-band",
    label: "Header Band",
    background: [
      { kind: "gradient-rect", name: "Header Band", tags: ["decorative", "panel", "accent"], xFrac: 0, yFrac: 0, wFrac: 1, hFrac: 0.44, gradient: ["primary", "secondary", 135] },
    ],
    overlay: [],
  },
  {
    id: "footer-band",
    label: "Footer Band",
    background: [
      { kind: "gradient-rect", name: "Footer Band", tags: ["decorative", "panel", "accent"], xFrac: 0, yFrac: 0.56, wFrac: 1, hFrac: 0.44, gradient: ["primary", "secondary", 135] },
    ],
    overlay: [],
  },
  {
    id: "split-panel",
    label: "Split Panel",
    background: [
      { kind: "gradient-rect", name: "Left Panel",  tags: ["decorative", "panel", "accent"],   xFrac: 0,    yFrac: 0, wFrac: 0.38, hFrac: 1, gradient: ["primary", "secondary", 180] },
      { kind: "rect",          name: "Panel Shadow", tags: ["decorative"],                     xFrac: 0.38, yFrac: 0, wFrac: 0.01, hFrac: 1, fillColor: "primary", fillAlpha: 0.08 },
    ],
    overlay: [],
  },
  {
    id: "corner-ornaments",
    label: "Corner Ornaments",
    background: [],
    overlay: [
      { kind: "rect", name: "Corner TL H", tags: ["decorative", "corner"], xFrac: 0.04, yFrac: 0.055, wFrac: 0.08, hFrac: 0.006, fillColor: "primary", fillAlpha: 0.45 },
      { kind: "rect", name: "Corner TL V", tags: ["decorative", "corner"], xFrac: 0.04, yFrac: 0.055, wFrac: 0.006, hFrac: 0.12,  fillColor: "primary", fillAlpha: 0.45 },
      { kind: "rect", name: "Corner BR H", tags: ["decorative", "corner"], xFrac: 0.88, yFrac: 0.93,  wFrac: 0.08, hFrac: 0.006, fillColor: "secondary", fillAlpha: 0.4 },
      { kind: "rect", name: "Corner BR V", tags: ["decorative", "corner"], xFrac: 0.956, yFrac: 0.82, wFrac: 0.006, hFrac: 0.12,  fillColor: "secondary", fillAlpha: 0.4 },
    ],
  },
  {
    id: "double-border",
    label: "Double Border",
    background: [],
    overlay: [
      { kind: "rect", name: "Outer Border", tags: ["decorative", "border"], xFrac: 0.02,  yFrac: 0.04,  wFrac: 0.96, hFrac: 0.92, strokeColor: "primary", strokeAlpha: 0.35, strokeWidth: 1.5 },
      { kind: "rect", name: "Inner Border", tags: ["decorative", "border"], xFrac: 0.04,  yFrac: 0.08,  wFrac: 0.92, hFrac: 0.84, strokeColor: "primary", strokeAlpha: 0.15, strokeWidth: 0.8 },
    ],
  },
  {
    id: "neon-border",
    label: "Neon Border",
    background: [],
    overlay: [
      { kind: "rect", name: "Neon Border", tags: ["decorative", "border"], xFrac: 0.012, yFrac: 0.022, wFrac: 0.976, hFrac: 0.956, strokeColor: "primary", strokeAlpha: 0.55, strokeWidth: 2 },
    ],
  },
  {
    id: "subtle-circles",
    label: "Subtle Circles",
    background: [
      { kind: "ellipse", name: "Circle Large", tags: ["decorative"], xFrac: 0.66, yFrac: -0.1, wFrac: 0.50, hFrac: 0.80, fillColor: "secondary", fillAlpha: 0.06 },
      { kind: "ellipse", name: "Circle Small", tags: ["decorative"], xFrac: 0.04, yFrac: 0.65, wFrac: 0.18, hFrac: 0.35, fillColor: "primary",   fillAlpha: 0.04 },
    ],
    overlay: [],
  },
  {
    id: "dot-accent",
    label: "Dot Accent",
    background: [
      { kind: "ellipse", name: "Dot 1", tags: ["decorative", "accent"], xFrac: 0.89, yFrac: 0.06, wFrac: 0.04, hFrac: 0.06, fillColor: "primary",   fillAlpha: 0.35 },
      { kind: "ellipse", name: "Dot 2", tags: ["decorative", "accent"], xFrac: 0.93, yFrac: 0.06, wFrac: 0.03, hFrac: 0.05, fillColor: "secondary", fillAlpha: 0.2 },
      { kind: "ellipse", name: "Dot 3", tags: ["decorative"],           xFrac: 0.04, yFrac: 0.88, wFrac: 0.03, hFrac: 0.05, fillColor: "primary",   fillAlpha: 0.15 },
    ],
    overlay: [],
  },
  {
    id: "art-deco-frame",
    label: "Art Deco Frame",
    background: [],
    overlay: [
      { kind: "rect", name: "Deco Outer", tags: ["decorative", "border"], xFrac: 0.027, yFrac: 0.046, wFrac: 0.946, hFrac: 0.908, strokeColor: "primary", strokeAlpha: 0.35, strokeWidth: 1.5 },
      { kind: "rect", name: "Deco Inner", tags: ["decorative", "border"], xFrac: 0.044, yFrac: 0.076, wFrac: 0.912, hFrac: 0.848, strokeColor: "primary", strokeAlpha: 0.15, strokeWidth: 0.5 },
      { kind: "rect", name: "Corner TL H", tags: ["decorative", "corner"], xFrac: 0.05,  yFrac: 0.088, wFrac: 0.07, hFrac: 0.006, fillColor: "primary", fillAlpha: 0.5 },
      { kind: "rect", name: "Corner TR H", tags: ["decorative", "corner"], xFrac: 0.88,  yFrac: 0.088, wFrac: 0.07, hFrac: 0.006, fillColor: "primary", fillAlpha: 0.5 },
      { kind: "rect", name: "Corner BL H", tags: ["decorative", "corner"], xFrac: 0.05,  yFrac: 0.906, wFrac: 0.07, hFrac: 0.006, fillColor: "secondary", fillAlpha: 0.4 },
      { kind: "rect", name: "Corner BR H", tags: ["decorative", "corner"], xFrac: 0.88,  yFrac: 0.906, wFrac: 0.07, hFrac: 0.006, fillColor: "secondary", fillAlpha: 0.4 },
    ],
  },
  {
    id: "left-glow-bar",
    label: "Left Glow Bar",
    background: [
      { kind: "gradient-rect", name: "Glow Bar",      tags: ["decorative", "accent"], xFrac: 0, yFrac: 0, wFrac: 0.016, hFrac: 1, gradient: ["primary", "secondary", 90] },
      { kind: "rect",          name: "Glow Diffuse",  tags: ["decorative"],           xFrac: 0.016, yFrac: 0, wFrac: 0.04, hFrac: 1, fillColor: "primary", fillAlpha: 0.04 },
    ],
    overlay: [],
  },
];

export const ACCENT_KIT_MAP: Record<string, AccentKit> = Object.fromEntries(
  ACCENT_KITS.map(k => [k.id, k])
);

// ============================================================================
// 6. Card Themes (60 color × typography × texture packs)
// ============================================================================

export const CARD_THEMES: CardTheme[] = [
  // ── Light / Minimal ────────────────────────────────────────────────────────
  { id: "white-clean",       label: "White Clean",       category: "minimal",   mood: "light",    primary: "#1a1a1a", secondary: "#4a4a4a", text: "#1a1a1a", bg: "#ffffff",  font: "minimal",  pattern: "none" },
  { id: "cream-classic",     label: "Cream Classic",     category: "classic",   mood: "light",    primary: "#2c3e50", secondary: "#7f8c8d", text: "#2c3e50", bg: "#faf8f5",  font: "elegant",  pattern: "none" },
  { id: "linen-warm",        label: "Linen Warm",        category: "minimal",   mood: "light",    primary: "#6b705c", secondary: "#a5a58d", text: "#3a3a3a", bg: "#fefae0",  font: "minimal",  pattern: "none" },
  { id: "ice-blue",          label: "Ice Blue",          category: "minimal",   mood: "light",    primary: "#5e81ac", secondary: "#88c0d0", text: "#2e3440", bg: "#eceff4",  font: "elegant",  pattern: "none" },
  { id: "swiss-red",         label: "Swiss Red",         category: "modern",    mood: "light",    primary: "#e63946", secondary: "#457b9d", text: "#1d3557", bg: "#f1faee",  font: "bold",     pattern: "none" },
  { id: "light-sage",        label: "Light Sage",        category: "nature",    mood: "light",    primary: "#6b8f71", secondary: "#a3c9a8", text: "#2d2d2d", bg: "#f0f5f1",  font: "minimal",  pattern: "none" },
  { id: "light-coral",       label: "Light Coral",       category: "creative",  mood: "light",    primary: "#e07a5f", secondary: "#f2cc8f", text: "#2d2d2d", bg: "#fdf6ec",  font: "modern",   pattern: "none" },
  { id: "ivory-gold",        label: "Ivory Gold",        category: "luxury",    mood: "light",    primary: "#c9a227", secondary: "#e8d48b", text: "#1a1410", bg: "#f5f0e1",  font: "elegant",  pattern: "none" },
  { id: "marble-white",      label: "Marble White",      category: "luxury",    mood: "light",    primary: "#2d2d2d", secondary: "#9e9e9e", text: "#2d2d2d", bg: "#f5f0eb",  font: "elegant",  pattern: "none" },
  { id: "blush-rose",        label: "Blush Rose",        category: "creative",  mood: "light",    primary: "#c9737b", secondary: "#f2a7ac", text: "#3d1c22", bg: "#fdf0f1",  font: "elegant",  pattern: "none" },

  // ── Dark / Mono ────────────────────────────────────────────────────────────
  { id: "charcoal",          label: "Charcoal",          category: "minimal",   mood: "dark",     primary: "#333333", secondary: "#666666", text: "#ffffff", bg: "#1a1a1a",  font: "minimal",  pattern: "none" },
  { id: "jet-black",         label: "Jet Black",         category: "minimal",   mood: "dark",     primary: "#e0e0e0", secondary: "#a0a0a0", text: "#e8e8e8", bg: "#0a0a0a",  font: "minimal",  pattern: "none" },
  { id: "midnight-slate",    label: "Midnight Slate",    category: "modern",    mood: "dark",     primary: "#64748b", secondary: "#94a3b8", text: "#e2e8f0", bg: "#1e293b",  font: "modern",   pattern: "none" },
  { id: "navy-pro",          label: "Navy Pro",          category: "classic",   mood: "dark",     primary: "#4a90d9", secondary: "#7ec8e3", text: "#ffffff", bg: "#0f1c2e",  font: "classic",  pattern: "lines" },
  { id: "dark-forest",       label: "Dark Forest",       category: "nature",    mood: "dark",     primary: "#52b788", secondary: "#74c69d", text: "#ffffff", bg: "#1b4332",  font: "modern",   pattern: "none" },
  { id: "deep-ocean",        label: "Deep Ocean",        category: "tech",      mood: "dark",     primary: "#00b4d8", secondary: "#90e0ef", text: "#ffffff", bg: "#03045e",  font: "modern",   pattern: "none" },
  { id: "burgundy",          label: "Burgundy",          category: "classic",   mood: "dark",     primary: "#c41e3a", secondary: "#e8a0ad", text: "#f5f0e1", bg: "#1a0a10",  font: "classic",  pattern: "none" },
  { id: "dark-velvet",       label: "Dark Velvet",       category: "luxury",    mood: "dark",     primary: "#9b1b30", secondary: "#c41e3a", text: "#e8d5b7", bg: "#0a0a0a",  font: "elegant",  pattern: "none" },
  { id: "charcoal-amber",    label: "Charcoal Amber",    category: "modern",    mood: "dark",     primary: "#f59e0b", secondary: "#fbbf24", text: "#ffffff", bg: "#1c1917",  font: "bold",     pattern: "none" },
  { id: "dark-plum",         label: "Dark Plum",         category: "luxury",    mood: "dark",     primary: "#7c3aed", secondary: "#a78bfa", text: "#f5f3ff", bg: "#1e1b2e",  font: "elegant",  pattern: "none" },

  // ── Vibrant / Color ────────────────────────────────────────────────────────
  { id: "lime-pro",          label: "Lime Pro",          category: "modern",    mood: "vibrant",  primary: "#8ae600", secondary: "#06b6d4", text: "#ffffff", bg: "#0a0a0a",  font: "modern",   pattern: "none" },
  { id: "neon-green",        label: "Neon Green",        category: "tech",      mood: "vibrant",  primary: "#00ff87", secondary: "#60efff", text: "#e8e8e8", bg: "#0a0a0a",  font: "modern",   pattern: "none" },
  { id: "electric-purple",   label: "Electric Purple",   category: "creative",  mood: "vibrant",  primary: "#6c5ce7", secondary: "#a29bfe", text: "#ffffff", bg: "#2d3436",  font: "bold",     pattern: "none" },
  { id: "hot-coral",         label: "Hot Coral",         category: "creative",  mood: "vibrant",  primary: "#ff6347", secondary: "#ffa07a", text: "#ffffff", bg: "#1a2332",  font: "bold",     pattern: "dots" },
  { id: "vivid-teal",        label: "Vivid Teal",        category: "modern",    mood: "vibrant",  primary: "#06d6a0", secondary: "#118ab2", text: "#ffffff", bg: "#073b4c",  font: "modern",   pattern: "none" },
  { id: "hot-magenta",       label: "Hot Magenta",       category: "creative",  mood: "vibrant",  primary: "#ff006e", secondary: "#8338ec", text: "#ffffff", bg: "#14213d",  font: "bold",     pattern: "diagonal-lines" },
  { id: "sunset-orange",     label: "Sunset Orange",     category: "creative",  mood: "vibrant",  primary: "#f77f00", secondary: "#fcbf49", text: "#ffffff", bg: "#003049",  font: "bold",     pattern: "none" },
  { id: "flamingo-pink",     label: "Flamingo Pink",     category: "creative",  mood: "vibrant",  primary: "#ef476f", secondary: "#ffd166", text: "#ffffff", bg: "#073b4c",  font: "modern",   pattern: "dots" },
  { id: "acid-yellow",       label: "Acid Yellow",       category: "bold",      mood: "vibrant",  primary: "#ffd700", secondary: "#ff6b35", text: "#0a0a0a", bg: "#0a0a0a",  font: "bold",     pattern: "none" },
  { id: "ultramarine",       label: "Ultramarine",       category: "bold",      mood: "vibrant",  primary: "#3a86ff", secondary: "#8338ec", text: "#ffffff", bg: "#03045e",  font: "bold",     pattern: "none" },

  // ── Metallic / Luxury ──────────────────────────────────────────────────────
  { id: "gold-black",        label: "Gold Black",        category: "luxury",    mood: "metallic", primary: "#d4af37", secondary: "#f4e5b2", text: "#f5f0e1", bg: "#1a1410",  font: "elegant",  pattern: "none" },
  { id: "silver-onyx",       label: "Silver Onyx",       category: "luxury",    mood: "metallic", primary: "#c0c0c0", secondary: "#e8e8e8", text: "#e0e0e0", bg: "#111111",  font: "elegant",  pattern: "none" },
  { id: "rose-gold",         label: "Rose Gold",         category: "luxury",    mood: "metallic", primary: "#b76e79", secondary: "#f4c2c2", text: "#3d1c22", bg: "#fdf0f1",  font: "elegant",  pattern: "none" },
  { id: "champagne",         label: "Champagne",         category: "luxury",    mood: "metallic", primary: "#c5a028", secondary: "#e8d48b", text: "#3d2f00", bg: "#fffbeb",  font: "elegant",  pattern: "none" },
  { id: "platinum-dark",     label: "Platinum Dark",     category: "luxury",    mood: "metallic", primary: "#d1d5db", secondary: "#9ca3af", text: "#f9fafb", bg: "#111827",  font: "minimal",  pattern: "none" },
  { id: "copper-noir",       label: "Copper Noir",       category: "luxury",    mood: "metallic", primary: "#b87333", secondary: "#da8a67", text: "#fde8d8", bg: "#1a0f0a",  font: "elegant",  pattern: "none" },

  // ── Muted / Tonal ──────────────────────────────────────────────────────────
  { id: "dusty-rose",        label: "Dusty Rose",        category: "minimal",   mood: "muted",    primary: "#c08b8b", secondary: "#e8c4c4", text: "#3d2525", bg: "#fdf5f5",  font: "elegant",  pattern: "none" },
  { id: "warm-taupe",        label: "Warm Taupe",        category: "minimal",   mood: "muted",    primary: "#8b7355", secondary: "#c4a882", text: "#3d2f1a", bg: "#faf5ef",  font: "classic",  pattern: "none" },
  { id: "slate-blue",        label: "Slate Blue",        category: "minimal",   mood: "muted",    primary: "#607d8b", secondary: "#90a4ae", text: "#eceff1", bg: "#263238",  font: "modern",   pattern: "none" },
  { id: "sage-green",        label: "Sage Green",        category: "nature",    mood: "muted",    primary: "#7b9e87", secondary: "#a8c5af", text: "#1c3022", bg: "#f2f7f3",  font: "minimal",  pattern: "none" },
  { id: "stone-gray",        label: "Stone Gray",        category: "minimal",   mood: "muted",    primary: "#9ca3af", secondary: "#d1d5db", text: "#374151", bg: "#f9fafb",  font: "minimal",  pattern: "none" },
  { id: "smoky-lavender",    label: "Smoky Lavender",    category: "creative",  mood: "muted",    primary: "#8b84a6", secondary: "#b8b0d0", text: "#2d2840", bg: "#f0eef8",  font: "elegant",  pattern: "none" },

  // ── Nature ─────────────────────────────────────────────────────────────────
  { id: "forest-deep",       label: "Forest Deep",       category: "nature",    mood: "dark",     primary: "#2d6a4f", secondary: "#52b788", text: "#ffffff", bg: "#1b4332",  font: "modern",   pattern: "none" },
  { id: "ocean-blue",        label: "Ocean Blue",        category: "nature",    mood: "dark",     primary: "#0077b6", secondary: "#00b4d8", text: "#ffffff", bg: "#023e8a",  font: "classic",  pattern: "none" },
  { id: "desert-sand",       label: "Desert Sand",       category: "nature",    mood: "muted",    primary: "#c77d3c", secondary: "#e8a96c", text: "#3d2010", bg: "#fdf3e3",  font: "classic",  pattern: "none" },
  { id: "autumn-red",        label: "Autumn Red",        category: "nature",    mood: "vibrant",  primary: "#c0392b", secondary: "#e74c3c", text: "#fdfaf6", bg: "#2c1810",  font: "classic",  pattern: "none" },

  // ── Tech ───────────────────────────────────────────────────────────────────
  { id: "cyber-blue",        label: "Cyber Blue",        category: "tech",      mood: "vibrant",  primary: "#00d4ff", secondary: "#0099cc", text: "#e0f7fa", bg: "#001122",  font: "modern",   pattern: "dots" },
  { id: "matrix-green",      label: "Matrix Green",      category: "tech",      mood: "vibrant",  primary: "#00ff41", secondary: "#009900", text: "#ccffcc", bg: "#000000",  font: "minimal",  pattern: "dots" },
  { id: "terminal-amber",    label: "Terminal Amber",    category: "tech",      mood: "muted",    primary: "#ff8c00", secondary: "#ffa500", text: "#ffe0a0", bg: "#0a0500",  font: "minimal",  pattern: "none" },
  { id: "blueprint",         label: "Blueprint",         category: "tech",      mood: "dark",     primary: "#60a5fa", secondary: "#93c5fd", text: "#e0f2fe", bg: "#0c1a3a",  font: "modern",   pattern: "lines" },

  // ── Art / Creative ────────────────────────────────────────────────────────
  { id: "bauhaus-red",       label: "Bauhaus Red",       category: "bold",      mood: "vibrant",  primary: "#e63946", secondary: "#457b9d", text: "#f1faee", bg: "#1d3557",  font: "bold",     pattern: "none" },
  { id: "pop-art-yellow",    label: "Pop Art Yellow",    category: "bold",      mood: "vibrant",  primary: "#ffd60a", secondary: "#ffc300", text: "#0a0a0a", bg: "#001d3d",  font: "bold",     pattern: "none" },
  { id: "midnight-indigo",   label: "Midnight Indigo",   category: "creative",  mood: "dark",     primary: "#6c5ce7", secondary: "#a29bfe", text: "#ffffff", bg: "#1a1a2e",  font: "elegant",  pattern: "none" },
  { id: "tropical-teal",     label: "Tropical Teal",     category: "creative",  mood: "vibrant",  primary: "#00f5d4", secondary: "#00bbf9", text: "#0a1628", bg: "#0a2240",  font: "modern",   pattern: "none" },
  { id: "duochrome-rb",      label: "Duochrome R+B",     category: "creative",  mood: "vibrant",  primary: "#ff0844", secondary: "#4361ee", text: "#ffffff", bg: "#0d0221",  font: "bold",     pattern: "none" },
  { id: "earth-tones",       label: "Earth Tones",       category: "nature",    mood: "muted",    primary: "#8b5e3c", secondary: "#c4956a", text: "#fdf3e3", bg: "#2c1a0e",  font: "classic",  pattern: "none" },
];

export const CARD_THEME_MAP: Record<string, CardTheme> = Object.fromEntries(
  CARD_THEMES.map(t => [t.id, t])
);

// ============================================================================
// 7. The Generator
// ============================================================================

/**
 * Generate a DesignDocumentV2 from a recipe + theme + accent kit combination.
 * All generated layers are tagged → fully AI-editable via ai-patch.
 *
 * When useCfgColors = true (user has edited colors), the theme colors are
 * overridden by cfg.primaryColor/secondaryColor/textColor/bgColor.
 */
export function generateCardDocument(params: GenerateParams): DesignDocumentV2 {
  const { cfg, logoImg } = params;
  const useCfg = params.useCfgColors ?? true;

  // Resolve recipe, theme, accent kit
  const recipe  = LAYOUT_RECIPE_MAP[params.recipeId  ?? "left-stack"]    ?? LAYOUT_RECIPES[0];
  const theme   = CARD_THEME_MAP[params.themeId      ?? "cream-classic"]  ?? CARD_THEMES[0];
  const kitId   = params.accentKitId ?? recipe.preferredAccentKit ?? "minimal-lines";
  const kit     = ACCENT_KIT_MAP[kitId] ?? ACCENT_KITS[0];

  // Resolve colors (prefer cfg values when useCfg is true)
  const p = useCfg ? cfg.primaryColor   : theme.primary;
  const s = useCfg ? cfg.secondaryColor : theme.secondary;
  const t = useCfg ? cfg.textColor      : theme.text;
  const b = useCfg ? cfg.bgColor        : theme.bg;
  const ff = getFontFamily(useCfg ? cfg.fontStyle : theme.font);

  // Card dimensions
  let W: number, H: number;
  if (cfg.cardStyle === "custom") {
    W = Math.round(cfg.customWidthMm * MM_PX);
    H = Math.round(cfg.customHeightMm * MM_PX);
  } else {
    const size = CARD_SIZES[cfg.cardStyle] || CARD_SIZES.standard;
    W = size.w;
    H = size.h;
  }

  const fs = getFontSizes(W);
  const isRounded = cfg.cardStyle === "rounded";

  // Build document
  let doc = createDocumentV2({
    toolId: "business-card",
    name: `Business Card — ${cfg.name || "Untitled"}`,
    width: W, height: H,
    backgroundColor: hexToRGBA(b),
    dpi: 300, bleedMm: BLEED_MM, safeAreaMm: SAFE_MM,
  });

  if (isRounded) {
    doc = updateLayer(doc, doc.rootFrameId, {
      cornerRadii: [24, 24, 24, 24],
    } as Partial<LayerV2>);
  }

  // Store generator params in meta.toolConfig
  doc = {
    ...doc,
    meta: {
      ...doc.meta,
      toolConfig: {
        ...(cfg as unknown as Record<string, unknown>),
        generatorRecipeId:    recipe.id,
        generatorThemeId:     theme.id,
        generatorAccentKitId: kit.id,
      },
    },
  };

  // ── Layer build order: pattern → accent bg → content → accent overlay → QR ──

  // 1. Pattern overlay (if any)
  const patternType = useCfg ? cfg.patternType : theme.pattern;
  if (patternType && patternType !== "none") {
    const patLayer = buildPatternLayerFn(W, H, patternType, p, 0.06);
    if (patLayer) doc = addLayer(doc, patLayer);
  }

  // 2. Accent kit background layers
  for (const al of kit.background) {
    const layer = buildAccentLayer(al, W, H, theme, cfg, useCfg);
    if (layer) doc = addLayer(doc, layer);
  }

  // 3. Content layers from recipe
  const contentLayers = buildRecipeLayers(recipe, W, H, cfg, fs, ff, p, s, t, useCfg);
  for (const layer of contentLayers) {
    doc = addLayer(doc, layer);
  }

  // 4. Accent kit overlay layers
  for (const al of kit.overlay) {
    const layer = buildAccentLayer(al, W, H, theme, cfg, useCfg);
    if (layer) doc = addLayer(doc, layer);
  }

  // 5. QR code layer (if set)
  const qrLayer = buildQrCodeLayerFn(W, H, cfg, cfg.side === "back" ? "back" : "front");
  if (qrLayer) doc = addLayer(doc, qrLayer);

  // 6. Set logo image element if available
  if (logoImg && cfg.logoUrl) {
    const layers = Object.values(doc.layersById);
    const logoLayer = layers.find(l => l.tags.includes("logo") && l.type === "image");
    if (logoLayer) {
      doc = updateLayer(doc, logoLayer.id, { _imageElement: logoImg } as Partial<LayerV2>);
    }
  }

  return doc;
}

/** Build all text/logo/contact layers for a given recipe */
function buildRecipeLayers(
  recipe: LayoutRecipe,
  W: number, H: number,
  cfg: CardConfig,
  fs: FontSizes,
  ff: string,
  p: string, s: string, t: string,
  useCfg: boolean,
): LayerV2[] {
  const layers: LayerV2[] = [];

  // Helper: resolve text for a slot name
  function slotText(slot: SlotName): string {
    switch (slot) {
      case "name":    return cfg.name    || "Your Name";
      case "title":   return cfg.title   || "Job Title";
      case "company": return cfg.company || "Company";
      case "tagline": return cfg.tagline || "";
      default:        return "";
    }
  }

  // Text slots
  const textSlots: SlotName[] = ["name", "title", "company", "tagline"];
  for (const slotName of textSlots) {
    const spec = recipe.slots[slotName];
    if (!spec) continue;
    const text = slotText(slotName);
    if (!text) continue;

    const sizeVal: number = spec.sizeKey ? fs[spec.sizeKey] : fs.name;

    // Choose color: name→text, title→primary, company→text (alpha 0.5), tagline→text (alpha 0.3)
    let color: string;
    let alpha: number = spec.alpha ?? 1;
    if (slotName === "title")   color = p;
    else if (slotName === "company") { color = t; alpha = spec.alpha ?? 0.5; }
    else if (slotName === "tagline") { color = t; alpha = spec.alpha ?? 0.32; }
    else                             color = t;

    const baseTags: string[] = slotName === "name"
      ? ["name", "primary-text"]
      : slotName === "title"
        ? ["title"]
        : slotName === "company"
          ? ["company"]
          : ["tagline"];

    layers.push(rText({
      name:          slotName.charAt(0).toUpperCase() + slotName.slice(1),
      x:             spec.xFrac * W,
      y:             spec.yFrac * H,
      w:             spec.wFrac * W,
      h:             Math.round(sizeVal * 1.6),
      text,
      fontSize:      sizeVal,
      ff,
      weight:        spec.weight ?? 400,
      color,
      alpha,
      align:         spec.align ?? "left",
      tags:          spec.tags ?? baseTags,
      uppercase:     spec.uppercase,
      italic:        spec.italic,
      letterSpacing: spec.letterSpacing,
    }));
  }

  // Divider line (below name/title area)
  const nameSpec = recipe.slots.name;
  if (nameSpec) {
    const divY = nameSpec.yFrac * H + (fs[nameSpec.sizeKey ?? "name"] ?? fs.name) + fs.title + 14;
    if (divY < H * 0.55) {
      layers.push(rLine({
        name: "Separator",
        x: recipe.contactXFrac * W,
        y: divY,
        w: W * 0.35,
        color: p, alpha: 0.2,
        tags: ["decorative", "divider"],
      }));
    }
  }

  // Logo
  const logoSize = Math.round(Math.min(W, H) * recipe.logoSizeFrac);
  const logoX    = Math.round(recipe.logoXFrac * W);
  const logoY    = Math.round(recipe.logoYFrac * H);
  const logoLayer = buildLogoLayerFn(cfg, logoX, logoY, logoSize, logoSize, p, ff);
  layers.push(logoLayer);

  // Contact block
  const contactEntries = getContactEntries(cfg);
  if (contactEntries.length > 0) {
    const contactLayers = buildContactLayersFn(
      cfg,
      recipe.contactXFrac * W,
      recipe.contactYFrac * H,
      Math.round(fs.contact * (recipe.contactGapFrac / 0.10)),
      recipe.contactAlign,
      t, 0.65,
      p, 0.5,
      fs.contact, ff, W
    );
    layers.push(...contactLayers);
  }

  return layers;
}

// ============================================================================
// 8. Combination Explorer
// ============================================================================

/** Returns the total number of distinct design combinations */
export function getCombinationCount(): number {
  return LAYOUT_RECIPES.length * CARD_THEMES.length * ACCENT_KITS.length;
}

/** Get recipes filtered by category/mood preference */
export function getRecipesForStyle(style: "minimal" | "modern" | "classic" | "creative" | "luxury"): LayoutRecipe[] {
  const styleMap: Record<string, string[]> = {
    minimal:  ["left-stack", "center-stack", "type-only-left", "type-only-center", "monospace-grid", "right-flip"],
    modern:   ["vertical-split-40", "vertical-split-60", "name-hero", "neon-left", "neon-border", "gradient-full", "editorial-left"],
    classic:  ["corporate-left", "double-border", "engraved-classic", "traditional-crest", "top-bar-left", "logo-dominant"],
    creative: ["diagonal-split", "photo-overlay", "dot-matrix", "large-initial", "oversized-company", "editorial-right"],
    luxury:   ["luxury-left", "luxury-center", "art-deco-center", "velvet-noir", "boxed-center", "pill-badge"],
  };
  const ids = styleMap[style] ?? [];
  return ids.map(id => LAYOUT_RECIPE_MAP[id]).filter(Boolean);
}

/** Get themes filtered by mood */
export function getThemesByMood(mood: CardTheme["mood"]): CardTheme[] {
  return CARD_THEMES.filter(t => t.mood === mood);
}

/** Get themes filtered by category */
export function getThemesByCategory(category: CardTheme["category"]): CardTheme[] {
  return CARD_THEMES.filter(t => t.category === category);
}

/**
 * Suggest a random combination based on a mood + style.
 * Deterministic when `seed` is provided.
 */
export function suggestCombination(
  style: "minimal" | "modern" | "classic" | "creative" | "luxury",
  mood: CardTheme["mood"],
  seed?: number,
): { recipeId: string; themeId: string; accentKitId: string } {
  const recipes = getRecipesForStyle(style);
  const themes  = getThemesByMood(mood).filter(t =>
    // Rough style↔category matching
    (style === "luxury"   && ["luxury", "metallic"].includes(t.category)) ||
    (style === "minimal"  && ["minimal", "muted"].includes(t.category))   ||
    (style === "creative" && ["creative", "bold", "vibrant"].includes(t.category)) ||
    (style === "modern"   && ["modern", "tech"].includes(t.category))     ||
    (style === "classic"  && ["classic", "nature"].includes(t.category))  ||
    true // fallback — all themes valid
  );

  const rng = seed !== undefined
    ? (n: number) => Math.abs(Math.sin(seed * n + n)) % 1
    : Math.random.bind(Math);

  const recipe   = recipes[Math.floor(rng(1) * recipes.length)]  ?? LAYOUT_RECIPES[0];
  const theme    = themes[Math.floor(rng(2) * themes.length)]    ?? CARD_THEMES[0];
  const kitId    = recipe.preferredAccentKit ?? ACCENT_KITS[Math.floor(rng(3) * ACCENT_KITS.length)].id;

  return { recipeId: recipe.id, themeId: theme.id, accentKitId: kitId };
}

/**
 * Apply a generated theme's colors to a CardConfig (for sidebar sync after generation).
 */
export function applyThemeToConfig(cfg: CardConfig, themeId: string): Partial<CardConfig> {
  const theme = CARD_THEME_MAP[themeId];
  if (!theme) return {};
  return {
    primaryColor:   theme.primary,
    secondaryColor: theme.secondary,
    textColor:      theme.text,
    bgColor:        theme.bg,
    fontStyle:      theme.font,
    patternType:    theme.pattern,
  };
}
