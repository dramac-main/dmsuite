// =============================================================================
// DMSuite — Certificate & Diploma Asset Library
//
// Professional ornamental vector assets for certificates, diplomas,
// awards, accreditations, and formal document design.
//
// Architecture follows Asset Bank Pattern (systemPatterns §2b):
//   - ZERO dependencies on other modules (imports only from ./schema)
//   - Exports: items array (with metadata), registry (O(1) lookup),
//     category list, AI helper functions
//   - Every asset has a `build()` function returning LayerV2[]
//   - Every layer is tagged `["cert-asset", "cert-{id}", ...]`
//     so it's immediately AI-targetable via ai-patch
//
// 80 assets across 8 categories:
//   frames (10), borders (10), ribbons (10), seals (10),
//   corners (10), dividers (10), backgrounds (10), ornaments (10)
// =============================================================================

import type {
  LayerV2, ShapeLayerV2,
  Paint, GradientPaint, GradientStop, StrokeSpec, PathCommand,
  Matrix2D,
} from "./schema";
import {
  createShapeLayerV2, createPathLayerV2,
  hexToRGBA, solidPaintHex,
} from "./schema";

// =============================================================================
// 1.  Core Types
// =============================================================================

/** Asset categories for certificate/diploma/formal document design */
export type CertCategory =
  | "frames"       // Full-page decorative frames (rectangular, ornate)
  | "borders"      // Edge treatments (lines, patterns, geometric)
  | "ribbons"      // Banner ribbons, sashes, folded ribbons
  | "seals"        // Medallions, stamps, wax seal shapes
  | "corners"      // Corner decorations (flourishes, L-brackets)
  | "dividers"     // Horizontal separators (scrollwork, lines, ornaments)
  | "backgrounds"  // Full-page patterns, textures, gradients
  | "ornaments";   // Standalone decorative elements (laurels, stars, shields)

export type CertAssetType =
  | "path-shape"        // SVG-like vector composition
  | "frame-decoration"  // Full-frame element set
  | "shape-cluster"     // Group of related shapes
  | "gradient-wash"     // Background gradient element
  | "pattern-fill"      // Repeating pattern
  | "divider"           // Horizontal separator
  | "accent-mark";      // Small focal element

export type CertMood = "classic" | "modern" | "elegant" | "bold" | "vintage";

/** What can be customized on this asset */
export interface CertCustomizable {
  color: boolean;
  secondaryColor: boolean;
  scale: boolean;
  rotation: boolean;
  opacity: boolean;
  position: boolean;
}

/** Parameters passed to the builder function */
export interface CertBuildParams {
  W: number;                 // Page width in px
  H: number;                 // Page height in px
  primary: string;           // Primary color hex
  secondary: string;         // Secondary color hex
  accent: string;            // Accent/gold color hex
  bg: string;                // Background color hex
  opacity?: number;          // 0–1, default 1
  scale?: number;            // 0.5–2, default 1
  xOffset?: number;          // px offset
  yOffset?: number;          // px offset
  colorOverride?: string;    // Override primary with custom hex
}

/** A complete certificate asset definition */
export interface CertAsset {
  id: string;
  label: string;
  description: string;
  aiDescription: string;
  tags: string[];
  category: CertCategory;
  type: CertAssetType;
  mood: CertMood[];
  customizable: CertCustomizable;
  /** Pure function: returns LayerV2[] with semantic tags */
  build: (params: CertBuildParams) => LayerV2[];
}

// =============================================================================
// 2.  Internal Helpers
// =============================================================================

function lg(angleDeg: number, ...stops: [string, number, number?][]): GradientPaint {
  const rad = (angleDeg * Math.PI) / 180;
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [Math.cos(rad), Math.sin(rad), -Math.sin(rad), Math.cos(rad), 0, 0];
  return { kind: "gradient", gradientType: "linear", stops: gradStops, transform, spread: "pad" };
}

function rg(cx: number, cy: number, ...stops: [string, number, number?][]): GradientPaint {
  const gradStops: GradientStop[] = stops.map(([hex, offset, alpha]) => ({
    color: hexToRGBA(hex, alpha ?? 1),
    offset,
  }));
  const transform: Matrix2D = [1, 0, 0, 1, cx, cy];
  return { kind: "gradient", gradientType: "radial", stops: gradStops, transform, spread: "pad" };
}

function sp(hex: string, alpha = 1): Paint { return solidPaintHex(hex, alpha); }

function sk(hex: string, width: number, alpha = 1): StrokeSpec {
  return { paint: solidPaintHex(hex, alpha), width, align: "center", dash: [], cap: "butt", join: "miter", miterLimit: 10 };
}

function mkRect(opts: {
  name: string; x: number; y: number; w: number; h: number;
  fill?: Paint; stroke?: StrokeSpec; tags: string[];
  radii?: [number, number, number, number]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    shapeType: "rectangle",
    fill: opts.fill ?? solidPaintHex("#000000", 0),
    stroke: opts.stroke,
    cornerRadii: opts.radii,
    tags: opts.tags,
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

function mkEllipse(opts: {
  name: string; cx: number; cy: number; rx: number; ry: number;
  fill?: Paint; stroke?: StrokeSpec; tags: string[]; opacity?: number;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: opts.fill ?? solidPaintHex("#000000", 0.1),
    stroke: opts.stroke,
    tags: opts.tags,
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _mkPath(opts: {
  name: string; x: number; y: number; w: number; h: number;
  commands: PathCommand[]; fill?: Paint; stroke?: StrokeSpec;
  tags: string[]; opacity?: number; closed?: boolean;
}): LayerV2 {
  const layer = createPathLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y, width: opts.w, height: opts.h,
    commands: opts.commands,
    fill: opts.fill,
    stroke: opts.stroke,
    closed: opts.closed ?? true,
    tags: opts.tags,
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  return layer;
}

/** Resolve primary color — apply override if set */
function pc(p: CertBuildParams): string {
  return p.colorOverride ?? p.primary;
}

/** Apply scale to raw dimension */
function sc(base: number, p: CertBuildParams): number {
  return Math.round(base * (p.scale ?? 1));
}

/** Apply scale + offset to position */
function sx(base: number, p: CertBuildParams): number {
  return Math.round(base * (p.scale ?? 1) + (p.xOffset ?? 0));
}

function sy(base: number, p: CertBuildParams): number {
  return Math.round(base * (p.scale ?? 1) + (p.yOffset ?? 0));
}

/** Standard base tags for every cert asset layer */
function tags(assetId: string, extra: string[]): string[] {
  return ["cert-asset", `cert-${assetId}`, ...extra];
}

/** Default customization — all features enabled */
const FULL_CUSTOM: CertCustomizable = {
  color: true, secondaryColor: true, scale: true,
  rotation: true, opacity: true, position: true,
};

const NO_ROTATE: CertCustomizable = {
  ...FULL_CUSTOM, rotation: false,
};

// =============================================================================
// 3a. FRAMES — Full-page decorative frames
// =============================================================================

const frameAssets: CertAsset[] = [
  {
    id: "frame-classic-double",
    label: "Classic Double Line",
    description: "Double-line rectangular frame with rounded corners, timeless formal look",
    aiDescription: "A refined double-line rectangular frame: outer line is thicker (3px), inner line thinner (1.5px) with 12px gap. Both use primary color. Suitable for formal certificates and diplomas.",
    tags: ["frame", "double-line", "classic", "formal", "rectangular"],
    category: "frames", type: "frame-decoration",
    mood: ["classic", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(40, p); // margin from edge
      const gap = sc(12, p);
      return [
        mkRect({ name: "Frame Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 3, o), tags: tags("frame-classic-double", ["frame", "outer-line"]) }),
        mkRect({ name: "Frame Inner", x: m + gap, y: m + gap, w: W - (m + gap) * 2, h: H - (m + gap) * 2, stroke: sk(pc(p), 1.5, o), tags: tags("frame-classic-double", ["frame", "inner-line"]) }),
      ];
    },
  },
  {
    id: "frame-ornate-gold",
    label: "Ornate Gold Frame",
    description: "Triple-line frame with gradient fills suggesting gilded edges",
    aiDescription: "A luxurious triple-border frame: outer thick band with gold gradient, middle thin accent line, inner decorative border. Uses primary-to-accent gradient for a foil-stamped look.",
    tags: ["frame", "gold", "ornate", "luxury", "gradient", "triple"],
    category: "frames", type: "frame-decoration",
    mood: ["elegant", "classic"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(30, p);
      return [
        // Outer thick band
        mkRect({ name: "Gold Outer Band", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(p.accent, 5, o), tags: tags("frame-ornate-gold", ["frame", "outer-band"]) }),
        // Middle accent line
        mkRect({ name: "Gold Mid Line", x: m + 10, y: m + 10, w: W - (m + 10) * 2, h: H - (m + 10) * 2, stroke: sk(pc(p), 1, o * 0.6), tags: tags("frame-ornate-gold", ["frame", "mid-line"]) }),
        // Inner decorative border
        mkRect({ name: "Gold Inner Border", x: m + 16, y: m + 16, w: W - (m + 16) * 2, h: H - (m + 16) * 2, stroke: sk(p.accent, 2, o), tags: tags("frame-ornate-gold", ["frame", "inner-border"]) }),
        // Corner accent dots (4 corners)
        mkEllipse({ name: "Corner Dot TL", cx: m + 16, cy: m + 16, rx: 4, ry: 4, fill: sp(p.accent, o), tags: tags("frame-ornate-gold", ["frame", "corner-dot"]) }),
        mkEllipse({ name: "Corner Dot TR", cx: W - m - 16, cy: m + 16, rx: 4, ry: 4, fill: sp(p.accent, o), tags: tags("frame-ornate-gold", ["frame", "corner-dot"]) }),
        mkEllipse({ name: "Corner Dot BL", cx: m + 16, cy: H - m - 16, rx: 4, ry: 4, fill: sp(p.accent, o), tags: tags("frame-ornate-gold", ["frame", "corner-dot"]) }),
        mkEllipse({ name: "Corner Dot BR", cx: W - m - 16, cy: H - m - 16, rx: 4, ry: 4, fill: sp(p.accent, o), tags: tags("frame-ornate-gold", ["frame", "corner-dot"]) }),
      ];
    },
  },
  {
    id: "frame-art-deco",
    label: "Art Deco Frame",
    description: "Geometric stepped frame with angular corner details, 1920s inspired",
    aiDescription: "A geometric Art Deco frame with stepped rectangular borders. Outer solid line, inner line with corner step-ins creating an angular, period-authentic 1920s look. Uses primary and accent colors.",
    tags: ["frame", "art-deco", "geometric", "angular", "stepped", "1920s"],
    category: "frames", type: "frame-decoration",
    mood: ["vintage", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(35, p);
      const step = sc(20, p);
      return [
        // Outer border
        mkRect({ name: "Deco Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 2.5, o), tags: tags("frame-art-deco", ["frame", "outer"]) }),
        // Inner border with step offset
        mkRect({ name: "Deco Inner", x: m + step, y: m + step, w: W - (m + step) * 2, h: H - (m + step) * 2, stroke: sk(p.accent, 1.5, o), tags: tags("frame-art-deco", ["frame", "inner"]) }),
        // Top-left stepped corner block
        mkRect({ name: "Step TL H", x: m, y: m, w: step + 8, h: 3, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        mkRect({ name: "Step TL V", x: m, y: m, w: 3, h: step + 8, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        // Top-right stepped corner
        mkRect({ name: "Step TR H", x: W - m - step - 8, y: m, w: step + 8, h: 3, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        mkRect({ name: "Step TR V", x: W - m - 3, y: m, w: 3, h: step + 8, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        // Bottom-left stepped corner
        mkRect({ name: "Step BL H", x: m, y: H - m - 3, w: step + 8, h: 3, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        mkRect({ name: "Step BL V", x: m, y: H - m - step - 8, w: 3, h: step + 8, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        // Bottom-right stepped corner
        mkRect({ name: "Step BR H", x: W - m - step - 8, y: H - m - 3, w: step + 8, h: 3, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
        mkRect({ name: "Step BR V", x: W - m - 3, y: H - m - step - 8, w: 3, h: step + 8, fill: sp(pc(p), o), tags: tags("frame-art-deco", ["frame", "step-corner"]) }),
      ];
    },
  },
  {
    id: "frame-thick-band",
    label: "Thick Band Frame",
    description: "Bold wide band frame with a thin inner accent line, authoritative feel",
    aiDescription: "A bold rectangular frame using a 6px thick primary-color band as the outer border plus a 1px accent line 8px inside. Projects authority and solidity, ideal for government and institutional certificates.",
    tags: ["frame", "thick", "band", "bold", "institutional"],
    category: "frames", type: "frame-decoration",
    mood: ["bold", "classic"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(32, p);
      return [
        mkRect({ name: "Thick Band", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 6, o), tags: tags("frame-thick-band", ["frame", "band"]) }),
        mkRect({ name: "Inner Accent", x: m + 12, y: m + 12, w: W - (m + 12) * 2, h: H - (m + 12) * 2, stroke: sk(p.accent, 1, o * 0.5), tags: tags("frame-thick-band", ["frame", "accent-line"]) }),
      ];
    },
  },
  {
    id: "frame-beveled-edge",
    label: "Beveled Edge Frame",
    description: "Multi-layer frame creating an embossed/beveled depth effect",
    aiDescription: "A frame that simulates embossed beveling with four nested rectangles: dark outer shadow, light highlight, primary fill band, and a thin inner line. Creates a raised 3D look.",
    tags: ["frame", "bevel", "embossed", "3d", "depth"],
    category: "frames", type: "frame-decoration",
    mood: ["classic", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(28, p);
      return [
        // Shadow edge (dark)
        mkRect({ name: "Bevel Shadow", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk("#000000", 4, o * 0.15), tags: tags("frame-beveled-edge", ["frame", "shadow"]) }),
        // Highlight edge (light)
        mkRect({ name: "Bevel Highlight", x: m + 3, y: m + 3, w: W - (m + 3) * 2, h: H - (m + 3) * 2, stroke: sk("#ffffff", 2, o * 0.3), tags: tags("frame-beveled-edge", ["frame", "highlight"]) }),
        // Primary band
        mkRect({ name: "Bevel Band", x: m + 6, y: m + 6, w: W - (m + 6) * 2, h: H - (m + 6) * 2, stroke: sk(pc(p), 3, o * 0.8), tags: tags("frame-beveled-edge", ["frame", "primary-band"]) }),
        // Inner thin line
        mkRect({ name: "Bevel Inner", x: m + 14, y: m + 14, w: W - (m + 14) * 2, h: H - (m + 14) * 2, stroke: sk(pc(p), 0.75, o * 0.4), tags: tags("frame-beveled-edge", ["frame", "inner-line"]) }),
      ];
    },
  },
  {
    id: "frame-filigree-border",
    label: "Filigree Border",
    description: "Delicate interwoven line frame with ornamental pattern effect",
    aiDescription: "An elegant frame with two parallel borders connected by diagonal cross-hatching along all four sides. Creates a lace-like filigree effect. Uses primary and accent colors.",
    tags: ["frame", "filigree", "lace", "delicate", "pattern"],
    category: "frames", type: "frame-decoration",
    mood: ["elegant", "vintage"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(34, p);
      const bw = sc(16, p); // border width zone
      const layers: LayerV2[] = [
        mkRect({ name: "Filigree Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 1.5, o), tags: tags("frame-filigree-border", ["frame", "outer"]) }),
        mkRect({ name: "Filigree Inner", x: m + bw, y: m + bw, w: W - (m + bw) * 2, h: H - (m + bw) * 2, stroke: sk(pc(p), 1.5, o), tags: tags("frame-filigree-border", ["frame", "inner"]) }),
      ];
      // Add cross-hatch marks along top edge
      const topCount = Math.floor((W - m * 2 - bw * 2) / 20);
      for (let i = 0; i < topCount; i++) {
        const x1 = m + bw + i * 20;
        layers.push(mkRect({ name: `Filigree Top ${i}`, x: x1 + 4, y: m + 2, w: 1, h: bw - 4, fill: sp(p.accent, o * 0.4), tags: tags("frame-filigree-border", ["frame", "hatch"]) }));
        layers.push(mkRect({ name: `Filigree Top2 ${i}`, x: x1 + 12, y: m + 2, w: 1, h: bw - 4, fill: sp(p.accent, o * 0.4), tags: tags("frame-filigree-border", ["frame", "hatch"]) }));
      }
      return layers;
    },
  },
  {
    id: "frame-ribbon-edge",
    label: "Ribbon Edge Frame",
    description: "Frame with a wide decorative band and thin inset, like a ribbon border",
    aiDescription: "A frame with a wide (8px) semi-transparent primary-color band as the outer boundary and a thin 1px accent line offset 4px inward. Resembles a ribbon wrapped around the page edge.",
    tags: ["frame", "ribbon", "wide-band", "soft"],
    category: "frames", type: "frame-decoration",
    mood: ["modern", "bold"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(36, p);
      return [
        mkRect({ name: "Ribbon Band", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 8, o * 0.35), tags: tags("frame-ribbon-edge", ["frame", "ribbon-band"]) }),
        mkRect({ name: "Ribbon Inset", x: m + 4, y: m + 4, w: W - (m + 4) * 2, h: H - (m + 4) * 2, stroke: sk(p.accent, 1, o * 0.7), tags: tags("frame-ribbon-edge", ["frame", "inset"]) }),
      ];
    },
  },
  {
    id: "frame-greek-key",
    label: "Greek Key Frame",
    description: "Frame with geometric Greek key / meander motif along all edges",
    aiDescription: "A rectangular frame bordered by a geometric Greek key (meander) pattern. Regular stepped rectangles create the classical motif along all four sides. Uses primary color with accent corner squares.",
    tags: ["frame", "greek-key", "meander", "classical", "geometric"],
    category: "frames", type: "frame-decoration",
    mood: ["classic", "vintage"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(38, p);
      const sz = sc(10, p); // meander step size
      const layers: LayerV2[] = [
        // Outer frame line
        mkRect({ name: "Greek Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 1.5, o), tags: tags("frame-greek-key", ["frame", "outer"]) }),
        mkRect({ name: "Greek Inner", x: m + sz * 2 + 4, y: m + sz * 2 + 4, w: W - (m + sz * 2 + 4) * 2, h: H - (m + sz * 2 + 4) * 2, stroke: sk(pc(p), 1.5, o), tags: tags("frame-greek-key", ["frame", "inner"]) }),
      ];
      // Top meander keys
      const keyCount = Math.floor((W - m * 2) / (sz * 3));
      for (let i = 0; i < keyCount; i++) {
        const kx = m + 4 + i * sz * 3;
        const ky = m + 2;
        layers.push(mkRect({ name: `Key T ${i}`, x: kx, y: ky, w: sz, h: sz * 2, fill: sp(pc(p), o * 0.3), tags: tags("frame-greek-key", ["frame", "key-block"]) }));
        layers.push(mkRect({ name: `Key T2 ${i}`, x: kx + sz, y: ky + sz, w: sz, h: sz, fill: sp(pc(p), o * 0.2), tags: tags("frame-greek-key", ["frame", "key-block"]) }));
      }
      // Corner accent squares
      layers.push(mkRect({ name: "Key Corner TL", x: m + 2, y: m + 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("frame-greek-key", ["frame", "corner-accent"]) }));
      layers.push(mkRect({ name: "Key Corner TR", x: W - m - sz - 2, y: m + 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("frame-greek-key", ["frame", "corner-accent"]) }));
      layers.push(mkRect({ name: "Key Corner BL", x: m + 2, y: H - m - sz - 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("frame-greek-key", ["frame", "corner-accent"]) }));
      layers.push(mkRect({ name: "Key Corner BR", x: W - m - sz - 2, y: H - m - sz - 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("frame-greek-key", ["frame", "corner-accent"]) }));
      return layers;
    },
  },
  {
    id: "frame-modern-thin",
    label: "Modern Thin Frame",
    description: "Clean single-line frame with generous margin, contemporary minimal look",
    aiDescription: "A single thin (1px) rectangular frame line set with generous 50px margin from the page edge. Clean and contemporary, ideal for modern minimalist certificates.",
    tags: ["frame", "minimal", "thin", "modern", "clean"],
    category: "frames", type: "frame-decoration",
    mood: ["modern"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(50, p);
      return [
        mkRect({ name: "Thin Frame", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 1, o), tags: tags("frame-modern-thin", ["frame", "thin-line"]) }),
      ];
    },
  },
  {
    id: "frame-certificate-formal",
    label: "Formal Certificate Frame",
    description: "Multi-layered formal frame with outer band, dotted mid-line, and inner rule",
    aiDescription: "A comprehensive formal certificate frame with four layers: outer solid band (3px), dotted accent mid-line, thin inner rule, and corner rosette circles. Designed specifically for professional certificates.",
    tags: ["frame", "formal", "certificate", "professional", "multi-layer", "rosette"],
    category: "frames", type: "frame-decoration",
    mood: ["classic", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(26, p);
      return [
        // Outer solid band
        mkRect({ name: "Formal Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 3, o), tags: tags("frame-certificate-formal", ["frame", "outer-band"]) }),
        // Dotted mid line
        mkRect({ name: "Formal Dotted", x: m + 8, y: m + 8, w: W - (m + 8) * 2, h: H - (m + 8) * 2, stroke: { paint: solidPaintHex(p.accent, o * 0.6), width: 1, align: "center", dash: [3, 3], cap: "round", join: "miter", miterLimit: 10 }, tags: tags("frame-certificate-formal", ["frame", "dotted-line"]) }),
        // Inner thin rule
        mkRect({ name: "Formal Inner", x: m + 14, y: m + 14, w: W - (m + 14) * 2, h: H - (m + 14) * 2, stroke: sk(pc(p), 1, o * 0.5), tags: tags("frame-certificate-formal", ["frame", "inner-rule"]) }),
        // Corner rosettes
        mkEllipse({ name: "Rosette TL", cx: m + 14, cy: m + 14, rx: 5, ry: 5, fill: sp(p.accent, o * 0.7), stroke: sk(pc(p), 0.75, o * 0.5), tags: tags("frame-certificate-formal", ["frame", "rosette"]) }),
        mkEllipse({ name: "Rosette TR", cx: W - m - 14, cy: m + 14, rx: 5, ry: 5, fill: sp(p.accent, o * 0.7), stroke: sk(pc(p), 0.75, o * 0.5), tags: tags("frame-certificate-formal", ["frame", "rosette"]) }),
        mkEllipse({ name: "Rosette BL", cx: m + 14, cy: H - m - 14, rx: 5, ry: 5, fill: sp(p.accent, o * 0.7), stroke: sk(pc(p), 0.75, o * 0.5), tags: tags("frame-certificate-formal", ["frame", "rosette"]) }),
        mkEllipse({ name: "Rosette BR", cx: W - m - 14, cy: H - m - 14, rx: 5, ry: 5, fill: sp(p.accent, o * 0.7), stroke: sk(pc(p), 0.75, o * 0.5), tags: tags("frame-certificate-formal", ["frame", "rosette"]) }),
      ];
    },
  },
];

// =============================================================================
// 3b. BORDERS — Edge treatments (lines, patterns, geometric)
// =============================================================================

const borderAssets: CertAsset[] = [
  {
    id: "border-guilloche-lines",
    label: "Guilloche Lines",
    description: "Fine parallel wavy lines along all edges, security-print inspired",
    aiDescription: "Multiple parallel thin horizontal lines stacked along the top and bottom edges of the page (8 lines per side). Creates a guilloche/security-print texture. Uses primary color at very low opacity.",
    tags: ["border", "guilloche", "security", "lines", "wavy", "print"],
    category: "borders", type: "shape-cluster",
    mood: ["classic", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const lineCount = 8;
      const spacing = sc(3, p);
      const margin = sc(20, p);
      for (let i = 0; i < lineCount; i++) {
        const alpha = (0.15 - i * 0.012) * o;
        // Top lines
        layers.push(mkRect({ name: `Guilloche Top ${i}`, x: margin, y: margin + i * spacing, w: W - margin * 2, h: 0.75, fill: sp(pc(p), alpha), tags: tags("border-guilloche-lines", ["border", "line"]) }));
        // Bottom lines
        layers.push(mkRect({ name: `Guilloche Bot ${i}`, x: margin, y: H - margin - i * spacing, w: W - margin * 2, h: 0.75, fill: sp(pc(p), alpha), tags: tags("border-guilloche-lines", ["border", "line"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-dotted-perimeter",
    label: "Dotted Perimeter",
    description: "Evenly spaced dots forming a complete rectangular border",
    aiDescription: "Small circles (3px radius) evenly spaced around all four sides of the page, creating a dotted-border effect. Uses accent color. Approximately 20px spacing between dots.",
    tags: ["border", "dots", "dotted", "perimeter", "circles"],
    category: "borders", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(30, p);
      const gap = sc(20, p);
      const r = sc(2.5, p);
      // Top row
      for (let x = m; x < W - m; x += gap) {
        layers.push(mkEllipse({ name: `Dot T`, cx: sx(x, p), cy: sy(m, p), rx: r, ry: r, fill: sp(p.accent, o * 0.5), tags: tags("border-dotted-perimeter", ["border", "dot"]) }));
      }
      // Bottom row
      for (let x = m; x < W - m; x += gap) {
        layers.push(mkEllipse({ name: `Dot B`, cx: sx(x, p), cy: sy(H - m, p), rx: r, ry: r, fill: sp(p.accent, o * 0.5), tags: tags("border-dotted-perimeter", ["border", "dot"]) }));
      }
      // Left column (skip corners)
      for (let y = m + gap; y < H - m; y += gap) {
        layers.push(mkEllipse({ name: `Dot L`, cx: sx(m, p), cy: sy(y, p), rx: r, ry: r, fill: sp(p.accent, o * 0.5), tags: tags("border-dotted-perimeter", ["border", "dot"]) }));
      }
      // Right column (skip corners)
      for (let y = m + gap; y < H - m; y += gap) {
        layers.push(mkEllipse({ name: `Dot R`, cx: sx(W - m, p), cy: sy(y, p), rx: r, ry: r, fill: sp(p.accent, o * 0.5), tags: tags("border-dotted-perimeter", ["border", "dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-chain-link",
    label: "Chain Link Border",
    description: "Interlocked rectangular links forming a chain pattern around edges",
    aiDescription: "Alternating filled and empty small rectangles along all four edges, creating a chain-link or brick-like pattern. Uses primary and accent colors. Each link is approximately 12×6px.",
    tags: ["border", "chain", "link", "interlocking", "pattern"],
    category: "borders", type: "shape-cluster",
    mood: ["classic", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(28, p);
      const linkW = sc(12, p);
      const linkH = sc(6, p);
      const gap = sc(4, p);
      // Top chain
      for (let x = m; x < W - m - linkW; x += linkW + gap) {
        const isFilled = Math.floor((x - m) / (linkW + gap)) % 2 === 0;
        layers.push(mkRect({ name: `Chain T`, x: x, y: m, w: linkW, h: linkH, fill: isFilled ? sp(pc(p), o * 0.4) : sp(p.accent, o * 0.2), tags: tags("border-chain-link", ["border", "link"]) }));
      }
      // Bottom chain
      for (let x = m; x < W - m - linkW; x += linkW + gap) {
        const isFilled = Math.floor((x - m) / (linkW + gap)) % 2 === 0;
        layers.push(mkRect({ name: `Chain B`, x: x, y: H - m - linkH, w: linkW, h: linkH, fill: isFilled ? sp(pc(p), o * 0.4) : sp(p.accent, o * 0.2), tags: tags("border-chain-link", ["border", "link"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-dash-accent",
    label: "Dash Accent Border",
    description: "Dashed border lines with accent-colored dashes",
    aiDescription: "A single dashed rectangular border with 6px dashes and 4px gaps. Uses primary color for dashes. Clean and professional, suitable for modern certificates.",
    tags: ["border", "dash", "dashed", "modern", "clean"],
    category: "borders", type: "frame-decoration",
    mood: ["modern", "bold"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(38, p);
      return [
        mkRect({ name: "Dash Border", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: { paint: solidPaintHex(pc(p), o * 0.6), width: 2, align: "center", dash: [6, 4], cap: "round", join: "miter", miterLimit: 10 }, tags: tags("border-dash-accent", ["border", "dashed"]) }),
      ];
    },
  },
  {
    id: "border-gradient-band",
    label: "Gradient Band Border",
    description: "Wide gradient band along top and bottom edges",
    aiDescription: "Semi-transparent horizontal gradient bands along the top and bottom edges of the page. Top band fades from primary→transparent downward. Bottom band fades from transparent→primary upward.",
    tags: ["border", "gradient", "band", "fade", "edge"],
    category: "borders", type: "gradient-wash",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const bandH = sc(40, p);
      return [
        mkRect({ name: "Gradient Top Band", x: 0, y: 0, w: W, h: bandH, fill: lg(180, [pc(p), 0, 0.15 * o], [pc(p), 1, 0]), tags: tags("border-gradient-band", ["border", "gradient-top"]) }),
        mkRect({ name: "Gradient Bottom Band", x: 0, y: H - bandH, w: W, h: bandH, fill: lg(0, [pc(p), 0, 0.15 * o], [pc(p), 1, 0]), tags: tags("border-gradient-band", ["border", "gradient-bottom"]) }),
      ];
    },
  },
  {
    id: "border-rope-twist",
    label: "Rope Twist Border",
    description: "Alternating angled marks creating a twisted rope effect around edges",
    aiDescription: "Small diagonal marks alternating left/right along the border zone, simulating a rope twist. Uses primary and accent colors at low opacity. Creates a textured edge.",
    tags: ["border", "rope", "twist", "texture", "nautical"],
    category: "borders", type: "shape-cluster",
    mood: ["vintage", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(32, p);
      const step = sc(8, p);
      // Top edge rope marks
      for (let x = m; x < W - m; x += step) {
        const isOdd = Math.floor((x - m) / step) % 2 === 0;
        layers.push(mkRect({ name: `Rope T`, x: x, y: m, w: 2, h: 6, fill: sp(isOdd ? pc(p) : p.accent, o * 0.3), tags: tags("border-rope-twist", ["border", "rope-mark"]) }));
      }
      // Bottom edge
      for (let x = m; x < W - m; x += step) {
        const isOdd = Math.floor((x - m) / step) % 2 === 0;
        layers.push(mkRect({ name: `Rope B`, x: x, y: H - m - 6, w: 2, h: 6, fill: sp(isOdd ? pc(p) : p.accent, o * 0.3), tags: tags("border-rope-twist", ["border", "rope-mark"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-diamond-row",
    label: "Diamond Row Border",
    description: "Row of small diamond shapes along top and bottom creating a regal edge",
    aiDescription: "Small rotated square (diamond) shapes spaced evenly along the top and bottom edges. Each diamond is 6px, filled with accent color at medium opacity. Regal and formal.",
    tags: ["border", "diamond", "regal", "row", "geometric"],
    category: "borders", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(34, p);
      const sz = sc(6, p);
      const gap = sc(18, p);
      for (let x = m + gap; x < W - m; x += gap) {
        // Top diamonds (rotated squares rendered as small filled rects)
        layers.push(mkRect({ name: `Diamond T`, x: x - sz / 2, y: m - sz / 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("border-diamond-row", ["border", "diamond"]) }));
        // Bottom diamonds
        layers.push(mkRect({ name: `Diamond B`, x: x - sz / 2, y: H - m - sz / 2, w: sz, h: sz, fill: sp(p.accent, o * 0.5), tags: tags("border-diamond-row", ["border", "diamond"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-double-pinstripe",
    label: "Double Pinstripe",
    description: "Two thin parallel lines forming a subtle pinstripe border",
    aiDescription: "Two very thin parallel lines (0.75px each, 4px apart) forming a complete rectangular border. Extremely subtle and professional. Uses primary color.",
    tags: ["border", "pinstripe", "thin", "subtle", "formal"],
    category: "borders", type: "frame-decoration",
    mood: ["modern", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(42, p);
      return [
        mkRect({ name: "Pinstripe Outer", x: m, y: m, w: W - m * 2, h: H - m * 2, stroke: sk(pc(p), 0.75, o * 0.6), tags: tags("border-double-pinstripe", ["border", "outer-stripe"]) }),
        mkRect({ name: "Pinstripe Inner", x: m + 4, y: m + 4, w: W - (m + 4) * 2, h: H - (m + 4) * 2, stroke: sk(pc(p), 0.75, o * 0.6), tags: tags("border-double-pinstripe", ["border", "inner-stripe"]) }),
      ];
    },
  },
  {
    id: "border-wave-pattern",
    label: "Wave Pattern Border",
    description: "Gentle sine-wave pattern along top and bottom creating flowing edges",
    aiDescription: "Small circles arranged in a wave/sine pattern along the top and bottom edges, creating a flowing organic border. Uses primary color at low opacity.",
    tags: ["border", "wave", "flowing", "organic", "sine"],
    category: "borders", type: "shape-cluster",
    mood: ["elegant", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(30, p);
      const step = sc(12, p);
      const amp = sc(4, p);
      for (let x = m; x < W - m; x += step) {
        const wave = Math.sin((x - m) / 30) * amp;
        layers.push(mkEllipse({ name: `Wave T`, cx: x, cy: m + wave, rx: 2, ry: 2, fill: sp(pc(p), o * 0.3), tags: tags("border-wave-pattern", ["border", "wave-dot"]) }));
        layers.push(mkEllipse({ name: `Wave B`, cx: x, cy: H - m + wave, rx: 2, ry: 2, fill: sp(pc(p), o * 0.3), tags: tags("border-wave-pattern", ["border", "wave-dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "border-inset-shadow",
    label: "Inset Shadow Border",
    description: "Subtle gradient shadow creating a recessed/inset effect around edges",
    aiDescription: "Four semi-transparent gradient bands along each edge that darken toward the page boundary, creating an inset shadow effect. Adds depth without any line borders.",
    tags: ["border", "shadow", "inset", "depth", "gradient"],
    category: "borders", type: "gradient-wash",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const shadowW = sc(20, p);
      return [
        // Top shadow
        mkRect({ name: "Shadow Top", x: 0, y: 0, w: W, h: shadowW, fill: lg(180, ["#000000", 0, 0.08 * o], ["#000000", 1, 0]), tags: tags("border-inset-shadow", ["border", "shadow"]) }),
        // Bottom shadow
        mkRect({ name: "Shadow Bottom", x: 0, y: H - shadowW, w: W, h: shadowW, fill: lg(0, ["#000000", 0, 0.08 * o], ["#000000", 1, 0]), tags: tags("border-inset-shadow", ["border", "shadow"]) }),
        // Left shadow
        mkRect({ name: "Shadow Left", x: 0, y: 0, w: shadowW, h: H, fill: lg(90, ["#000000", 0, 0.06 * o], ["#000000", 1, 0]), tags: tags("border-inset-shadow", ["border", "shadow"]) }),
        // Right shadow
        mkRect({ name: "Shadow Right", x: W - shadowW, y: 0, w: shadowW, h: H, fill: lg(270, ["#000000", 0, 0.06 * o], ["#000000", 1, 0]), tags: tags("border-inset-shadow", ["border", "shadow"]) }),
      ];
    },
  },
];
// =============================================================================
// 3c. RIBBONS — Banner ribbons, sashes, folded ribbons
// =============================================================================

const ribbonAssets: CertAsset[] = [
  {
    id: "ribbon-center-banner",
    label: "Center Banner Ribbon",
    description: "Classic horizontal banner ribbon with folded ends, centered on page",
    aiDescription: "A wide horizontal banner ribbon across the center of the page with V-cut ends. Main body is primary color, fold shadows are darker. Width is ~60% of page.",
    tags: ["ribbon", "banner", "center", "classic", "horizontal"],
    category: "ribbons", type: "shape-cluster",
    mood: ["classic", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const rW = sc(W * 0.6, p);
      const rH = sc(44, p);
      const rX = (W - rW) / 2;
      const rY = H * 0.68;
      const foldW = sc(20, p);
      const foldH = sc(14, p);
      return [
        // Main ribbon body
        mkRect({ name: "Banner Body", x: rX, y: rY, w: rW, h: rH, fill: sp(pc(p), o * 0.85), tags: tags("ribbon-center-banner", ["ribbon", "body"]) }),
        // Left fold tail
        mkRect({ name: "Banner Tail L", x: rX - foldW, y: rY + 4, w: foldW + 2, h: rH - 8, fill: sp(pc(p), o * 0.65), tags: tags("ribbon-center-banner", ["ribbon", "tail"]) }),
        // Right fold tail
        mkRect({ name: "Banner Tail R", x: rX + rW - 2, y: rY + 4, w: foldW + 2, h: rH - 8, fill: sp(pc(p), o * 0.65), tags: tags("ribbon-center-banner", ["ribbon", "tail"]) }),
        // Left fold shadow
        mkRect({ name: "Banner Fold L", x: rX, y: rY + rH, w: foldW, h: foldH, fill: sp(pc(p), o * 0.4), tags: tags("ribbon-center-banner", ["ribbon", "fold"]) }),
        // Right fold shadow
        mkRect({ name: "Banner Fold R", x: rX + rW - foldW, y: rY + rH, w: foldW, h: foldH, fill: sp(pc(p), o * 0.4), tags: tags("ribbon-center-banner", ["ribbon", "fold"]) }),
      ];
    },
  },
  {
    id: "ribbon-top-sash",
    label: "Top Sash Ribbon",
    description: "Angled sash crossing the top-right corner of the certificate",
    aiDescription: "A diagonal ribbon/sash crossing the upper-right corner area. Two overlapping angled rectangles (primary and accent) create a two-tone sash effect. Approximately 120px long.",
    tags: ["ribbon", "sash", "corner", "diagonal", "decorative"],
    category: "ribbons", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const sashW = sc(160, p);
      const sashH = sc(28, p);
      return [
        mkRect({ name: "Sash Back", x: W - sashW - 40, y: 50, w: sashW, h: sashH, fill: sp(pc(p), o * 0.8), tags: tags("ribbon-top-sash", ["ribbon", "sash-back"]) }),
        mkRect({ name: "Sash Stripe", x: W - sashW - 40 + 4, y: 50 + 4, w: sashW - 8, h: sashH - 8, fill: sp(p.accent, o * 0.5), tags: tags("ribbon-top-sash", ["ribbon", "sash-stripe"]) }),
      ];
    },
  },
  {
    id: "ribbon-bottom-scroll",
    label: "Bottom Scroll Ribbon",
    description: "Elegant scroll-style ribbon curving at the bottom of the page",
    aiDescription: "A horizontal ribbon across the lower third with rounded end caps (ellipses) to simulate scrolled edges. Primary color body with rounded accent caps.",
    tags: ["ribbon", "scroll", "bottom", "elegant", "curved"],
    category: "ribbons", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const rW = sc(W * 0.55, p);
      const rH = sc(36, p);
      const rX = (W - rW) / 2;
      const rY = H * 0.78;
      return [
        mkRect({ name: "Scroll Body", x: rX, y: rY, w: rW, h: rH, fill: sp(pc(p), o * 0.75), tags: tags("ribbon-bottom-scroll", ["ribbon", "body"]) }),
        // Left scroll cap
        mkEllipse({ name: "Scroll Cap L", cx: rX, cy: rY + rH / 2, rx: sc(12, p), ry: rH / 2 + 4, fill: sp(p.accent, o * 0.5), tags: tags("ribbon-bottom-scroll", ["ribbon", "cap"]) }),
        // Right scroll cap
        mkEllipse({ name: "Scroll Cap R", cx: rX + rW, cy: rY + rH / 2, rx: sc(12, p), ry: rH / 2 + 4, fill: sp(p.accent, o * 0.5), tags: tags("ribbon-bottom-scroll", ["ribbon", "cap"]) }),
      ];
    },
  },
  {
    id: "ribbon-notched-tab",
    label: "Notched Tab Ribbon",
    description: "Small notched tab ribbon below center, great for date or award text",
    aiDescription: "A compact horizontal ribbon tab with a V-notch cut into the bottom edge (simulated with two small rects). Positioned below center. Accent color, ~200px wide.",
    tags: ["ribbon", "tab", "notch", "compact", "label"],
    category: "ribbons", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const tW = sc(200, p);
      const tH = sc(32, p);
      const tX = (W - tW) / 2;
      const tY = H * 0.62;
      return [
        mkRect({ name: "Tab Body", x: tX, y: tY, w: tW, h: tH, fill: sp(p.accent, o * 0.85), tags: tags("ribbon-notched-tab", ["ribbon", "tab"]) }),
        // Notch (two small rects at bottom center to simulate V)
        mkRect({ name: "Notch L", x: tX + tW / 2 - 6, y: tY + tH - 1, w: 6, h: 8, fill: sp(p.bg, o), tags: tags("ribbon-notched-tab", ["ribbon", "notch"]) }),
        mkRect({ name: "Notch R", x: tX + tW / 2, y: tY + tH - 1, w: 6, h: 8, fill: sp(p.bg, o), tags: tags("ribbon-notched-tab", ["ribbon", "notch"]) }),
      ];
    },
  },
  {
    id: "ribbon-draped-swag",
    label: "Draped Swag Ribbon",
    description: "Elegant draped swag ribbon across the top of the certificate",
    aiDescription: "Simulated draped fabric swag across the top. A wide arc (ellipse) clipped by the top edge with gradient from primary→transparent creates a draped look. Two short vertical tails at the ends.",
    tags: ["ribbon", "drape", "swag", "fabric", "top"],
    category: "ribbons", type: "shape-cluster",
    mood: ["elegant", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const dW = sc(W * 0.5, p);
      const dH = sc(50, p);
      const dX = (W - dW) / 2;
      return [
        // Arc body
        mkEllipse({ name: "Swag Arc", cx: W / 2, cy: 10, rx: dW / 2, ry: dH, fill: lg(180, [pc(p), 0, o * 0.5], [pc(p), 1, o * 0.1]), tags: tags("ribbon-draped-swag", ["ribbon", "swag"]) }),
        // Left tail
        mkRect({ name: "Swag Tail L", x: dX, y: 0, w: sc(10, p), h: sc(30, p), fill: sp(pc(p), o * 0.5), tags: tags("ribbon-draped-swag", ["ribbon", "tail"]) }),
        // Right tail
        mkRect({ name: "Swag Tail R", x: dX + dW - sc(10, p), y: 0, w: sc(10, p), h: sc(30, p), fill: sp(pc(p), o * 0.5), tags: tags("ribbon-draped-swag", ["ribbon", "tail"]) }),
      ];
    },
  },
  {
    id: "ribbon-double-stripe",
    label: "Double Stripe Ribbon",
    description: "Horizontal ribbon with a contrasting center stripe",
    aiDescription: "A wide horizontal band centered at ~70% page height with a thinner contrasting stripe running through its center. Primary for the band, accent for the stripe.",
    tags: ["ribbon", "stripe", "double", "horizontal", "formal"],
    category: "ribbons", type: "shape-cluster",
    mood: ["classic", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const rW = sc(W * 0.65, p);
      const rH = sc(38, p);
      const rX = (W - rW) / 2;
      const rY = H * 0.70;
      return [
        mkRect({ name: "Stripe Band", x: rX, y: rY, w: rW, h: rH, fill: sp(pc(p), o * 0.7), tags: tags("ribbon-double-stripe", ["ribbon", "band"]) }),
        mkRect({ name: "Stripe Center", x: rX + 4, y: rY + rH / 2 - 3, w: rW - 8, h: 6, fill: sp(p.accent, o * 0.8), tags: tags("ribbon-double-stripe", ["ribbon", "stripe"]) }),
      ];
    },
  },
  {
    id: "ribbon-award-medal",
    label: "Award Medal Ribbon",
    description: "V-shaped ribbon fanning from behind a medal/seal placement",
    aiDescription: "Two angled rectangular strips fanning outward from a center point near the bottom of the page, simulating the ribbon tails behind a medal. Primary and secondary colors.",
    tags: ["ribbon", "medal", "award", "v-shape", "fan"],
    category: "ribbons", type: "shape-cluster",
    mood: ["bold", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2;
      const cy = H * 0.82;
      const tailW = sc(16, p);
      const tailH = sc(60, p);
      return [
        // Left tail (angled)
        mkRect({ name: "Medal Tail L", x: cx - sc(40, p), y: cy, w: tailW, h: tailH, fill: sp(pc(p), o * 0.7), tags: tags("ribbon-award-medal", ["ribbon", "medal-tail"]) }),
        // Right tail (angled)
        mkRect({ name: "Medal Tail R", x: cx + sc(24, p), y: cy, w: tailW, h: tailH, fill: sp(p.secondary, o * 0.7), tags: tags("ribbon-award-medal", ["ribbon", "medal-tail"]) }),
        // Center connector
        mkEllipse({ name: "Medal Knot", cx: cx, cy: cy + 4, rx: sc(10, p), ry: sc(8, p), fill: sp(p.accent, o * 0.8), tags: tags("ribbon-award-medal", ["ribbon", "knot"]) }),
      ];
    },
  },
  {
    id: "ribbon-folded-ends",
    label: "Folded Ends Ribbon",
    description: "Wide ribbon with realistic folded-under ends creating depth",
    aiDescription: "A full-width ribbon with darker triangular fold-under regions at each end. The main bar spans ~70% of page width, with fold shadows adding a 3D effect.",
    tags: ["ribbon", "fold", "3d", "depth", "wide"],
    category: "ribbons", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const rW = sc(W * 0.7, p);
      const rH = sc(40, p);
      const rX = (W - rW) / 2;
      const rY = H * 0.66;
      const fS = sc(18, p);
      return [
        // Under-fold left (darker, behind)
        mkRect({ name: "Fold Under L", x: rX - fS / 2, y: rY + 6, w: fS, h: rH - 4, fill: sp(pc(p), o * 0.35), tags: tags("ribbon-folded-ends", ["ribbon", "fold-shadow"]) }),
        // Under-fold right
        mkRect({ name: "Fold Under R", x: rX + rW - fS / 2, y: rY + 6, w: fS, h: rH - 4, fill: sp(pc(p), o * 0.35), tags: tags("ribbon-folded-ends", ["ribbon", "fold-shadow"]) }),
        // Main body (on top)
        mkRect({ name: "Ribbon Main", x: rX, y: rY, w: rW, h: rH, fill: sp(pc(p), o * 0.85), tags: tags("ribbon-folded-ends", ["ribbon", "body"]) }),
      ];
    },
  },
  {
    id: "ribbon-angled-badge",
    label: "Angled Badge Ribbon",
    description: "Small angled ribbon badge in the top-left corner",
    aiDescription: "A small rectangular badge/ribbon placed in the upper-left area of the page, slightly rotated. Great for 'Certified' or date text. Accent color with a thin border.",
    tags: ["ribbon", "badge", "corner", "small", "angled"],
    category: "ribbons", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const o = p.opacity ?? 1;
      const bW = sc(110, p);
      const bH = sc(28, p);
      return [
        mkRect({ name: "Badge Back", x: sc(40, p), y: sc(50, p), w: bW, h: bH, fill: sp(p.accent, o * 0.85), stroke: sk(pc(p), 1, o * 0.5), tags: tags("ribbon-angled-badge", ["ribbon", "badge"]) }),
      ];
    },
  },
  {
    id: "ribbon-waterfall",
    label: "Waterfall Ribbon",
    description: "Three cascading ribbon strips creating a waterfall effect",
    aiDescription: "Three horizontal ribbon strips stacked vertically with slight offsets and decreasing opacity, creating a cascading waterfall effect. Positioned below center.",
    tags: ["ribbon", "waterfall", "cascade", "layered", "modern"],
    category: "ribbons", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const baseW = sc(W * 0.5, p);
      const h = sc(14, p);
      const gap = sc(6, p);
      const baseX = (W - baseW) / 2;
      const baseY = H * 0.72;
      return [
        mkRect({ name: "Fall 1", x: baseX, y: baseY, w: baseW, h: h, fill: sp(pc(p), o * 0.7), tags: tags("ribbon-waterfall", ["ribbon", "fall"]) }),
        mkRect({ name: "Fall 2", x: baseX + sc(15, p), y: baseY + h + gap, w: baseW - sc(30, p), h: h, fill: sp(pc(p), o * 0.5), tags: tags("ribbon-waterfall", ["ribbon", "fall"]) }),
        mkRect({ name: "Fall 3", x: baseX + sc(30, p), y: baseY + (h + gap) * 2, w: baseW - sc(60, p), h: h, fill: sp(pc(p), o * 0.3), tags: tags("ribbon-waterfall", ["ribbon", "fall"]) }),
      ];
    },
  },
];
// =============================================================================
// 3d. SEALS — Medallions, rosettes, wax seals, stamps
// =============================================================================

const sealAssets: CertAsset[] = [
  {
    id: "seal-wax-classic",
    label: "Classic Wax Seal",
    description: "Round wax seal with concentric rings and center dot",
    aiDescription: "Three concentric circles (outer ring, middle ring, center dot) forming a traditional wax seal. Uses primary color with decreasing opacity from center out. Positioned at bottom-center.",
    tags: ["seal", "wax", "classic", "round", "concentric"],
    category: "seals", type: "shape-cluster",
    mood: ["classic", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.85;
      const r1 = sc(36, p), r2 = sc(26, p), r3 = sc(10, p);
      return [
        mkEllipse({ name: "Seal Outer Ring", cx, cy, rx: r1, ry: r1, fill: sp(pc(p), o * 0.3), stroke: sk(pc(p), 2, o * 0.6), tags: tags("seal-wax-classic", ["seal", "ring-outer"]) }),
        mkEllipse({ name: "Seal Middle Ring", cx, cy, rx: r2, ry: r2, fill: sp(pc(p), o * 0.5), tags: tags("seal-wax-classic", ["seal", "ring-middle"]) }),
        mkEllipse({ name: "Seal Center", cx, cy, rx: r3, ry: r3, fill: sp(pc(p), o * 0.8), tags: tags("seal-wax-classic", ["seal", "center"]) }),
      ];
    },
  },
  {
    id: "seal-starburst",
    label: "Starburst Seal",
    description: "Star-shaped seal with radiating points around a center circle",
    aiDescription: "Multiple small rects radiating outward from a center circle like a starburst. 12 rays at 30-degree increments. Accent color rays, primary center.",
    tags: ["seal", "starburst", "star", "radiating", "award"],
    category: "seals", type: "shape-cluster",
    mood: ["bold", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = H * 0.84;
      const rayCount = 12;
      const rayLen = sc(28, p);
      const rayW = sc(4, p);
      const innerR = sc(18, p);
      // Rays
      for (let i = 0; i < rayCount; i++) {
        const angle = (i * 360) / rayCount;
        const rad = (angle * Math.PI) / 180;
        const rx = cx + Math.cos(rad) * innerR;
        const ry = cy + Math.sin(rad) * innerR;
        layers.push(mkRect({ name: `Ray ${i}`, x: rx - rayW / 2, y: ry - rayLen / 2, w: rayW, h: rayLen, fill: sp(p.accent, o * 0.4), tags: tags("seal-starburst", ["seal", "ray"]) }));
      }
      // Center disc
      layers.push(mkEllipse({ name: "Star Center", cx, cy, rx: innerR, ry: innerR, fill: sp(pc(p), o * 0.8), tags: tags("seal-starburst", ["seal", "center"]) }));
      return layers;
    },
  },
  {
    id: "seal-double-ring",
    label: "Double Ring Seal",
    description: "Two concentric ring outlines with space for text between them",
    aiDescription: "Two concentric circle outlines (no fill) with a gap between them suitable for circular text. Outer ring is thicker (2px), inner ring thinner (1px). Primary color.",
    tags: ["seal", "ring", "double", "outline", "text-space"],
    category: "seals", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.85;
      const r1 = sc(38, p), r2 = sc(28, p);
      return [
        mkEllipse({ name: "Outer Ring", cx, cy, rx: r1, ry: r1, stroke: sk(pc(p), 2, o * 0.7), tags: tags("seal-double-ring", ["seal", "ring-outer"]) }),
        mkEllipse({ name: "Inner Ring", cx, cy, rx: r2, ry: r2, stroke: sk(pc(p), 1, o * 0.5), tags: tags("seal-double-ring", ["seal", "ring-inner"]) }),
      ];
    },
  },
  {
    id: "seal-rosette",
    label: "Rosette Seal",
    description: "Layered petal rosette forming a flower-like seal",
    aiDescription: "Multiple overlapping ellipses arranged in a radial flower pattern to form a rosette seal. 8 petals, each a small ellipse rotated around center. Primary color at low opacity.",
    tags: ["seal", "rosette", "flower", "petals", "ornate"],
    category: "seals", type: "shape-cluster",
    mood: ["elegant", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = H * 0.84;
      const petalCount = 8;
      const petalR = sc(14, p);
      const dist = sc(18, p);
      for (let i = 0; i < petalCount; i++) {
        const rad = ((i * 360) / petalCount * Math.PI) / 180;
        const px = cx + Math.cos(rad) * dist;
        const py = cy + Math.sin(rad) * dist;
        layers.push(mkEllipse({ name: `Petal ${i}`, cx: px, cy: py, rx: petalR, ry: petalR * 0.6, fill: sp(pc(p), o * 0.25), tags: tags("seal-rosette", ["seal", "petal"]) }));
      }
      // Center
      layers.push(mkEllipse({ name: "Rosette Center", cx, cy, rx: sc(10, p), ry: sc(10, p), fill: sp(pc(p), o * 0.7), tags: tags("seal-rosette", ["seal", "center"]) }));
      return layers;
    },
  },
  {
    id: "seal-shield-emblem",
    label: "Shield Emblem",
    description: "Shield-shaped emblem seal using overlapping shapes",
    aiDescription: "A shield shape created by a tall rectangle topped with a half-ellipse and a small pointed triangle at the bottom. Uses primary and accent colors. Classic heraldry feel.",
    tags: ["seal", "shield", "emblem", "heraldry", "formal"],
    category: "seals", type: "shape-cluster",
    mood: ["classic", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2;
      const sY = H * 0.80;
      const sW = sc(50, p), sH = sc(60, p);
      return [
        // Shield body
        mkRect({ name: "Shield Body", x: cx - sW / 2, y: sY, w: sW, h: sH * 0.7, fill: sp(pc(p), o * 0.6), tags: tags("seal-shield-emblem", ["seal", "shield"]) }),
        // Shield top arc
        mkEllipse({ name: "Shield Top", cx: cx, cy: sY, rx: sW / 2, ry: sc(12, p), fill: sp(pc(p), o * 0.6), tags: tags("seal-shield-emblem", ["seal", "shield-top"]) }),
        // Shield bottom point (triangle via small rect)
        mkRect({ name: "Shield Point", x: cx - 6, y: sY + sH * 0.7 - 2, w: 12, h: sc(16, p), fill: sp(pc(p), o * 0.6), tags: tags("seal-shield-emblem", ["seal", "shield-point"]) }),
        // Inner accent
        mkEllipse({ name: "Shield Inner", cx: cx, cy: sY + sH * 0.3, rx: sc(12, p), ry: sc(12, p), fill: sp(p.accent, o * 0.5), tags: tags("seal-shield-emblem", ["seal", "inner"]) }),
      ];
    },
  },
  {
    id: "seal-gear-cog",
    label: "Gear Cog Seal",
    description: "Mechanical gear/cog shape for technical or engineering certificates",
    aiDescription: "Small rectangles arranged radially around a circle to simulate gear teeth. 16 teeth, each a small rect. Creates an industrial/engineering seal. Accent color.",
    tags: ["seal", "gear", "cog", "technical", "engineering"],
    category: "seals", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = H * 0.84;
      const teeth = 16;
      const outerR = sc(32, p);
      const toothW = sc(6, p), toothH = sc(10, p);
      for (let i = 0; i < teeth; i++) {
        const rad = ((i * 360) / teeth * Math.PI) / 180;
        const tx = cx + Math.cos(rad) * outerR;
        const ty = cy + Math.sin(rad) * outerR;
        layers.push(mkRect({ name: `Tooth ${i}`, x: tx - toothW / 2, y: ty - toothH / 2, w: toothW, h: toothH, fill: sp(p.accent, o * 0.4), tags: tags("seal-gear-cog", ["seal", "tooth"]) }));
      }
      layers.push(mkEllipse({ name: "Gear Center", cx, cy, rx: outerR - toothH / 2, ry: outerR - toothH / 2, fill: sp(p.accent, o * 0.6), tags: tags("seal-gear-cog", ["seal", "center"]) }));
      layers.push(mkEllipse({ name: "Gear Hole", cx, cy, rx: sc(8, p), ry: sc(8, p), fill: sp(p.bg, o * 0.8), tags: tags("seal-gear-cog", ["seal", "hole"]) }));
      return layers;
    },
  },
  {
    id: "seal-laurel-wreath",
    label: "Laurel Wreath Seal",
    description: "Semi-circular laurel wreath with leaves formed from ellipses",
    aiDescription: "Two arcs of small ellipses curving around a center point, forming a laurel wreath. Left arc angles left, right arc angles right. 8 leaves per side. Primary color.",
    tags: ["seal", "laurel", "wreath", "leaves", "honor"],
    category: "seals", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = H * 0.85;
      const arcR = sc(34, p);
      const leafRx = sc(5, p), leafRy = sc(10, p);
      const leafCount = 8;
      // Left arc (180° to 360°)
      for (let i = 0; i < leafCount; i++) {
        const angle = 180 + (i * 160) / leafCount;
        const rad = (angle * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * arcR;
        const ly = cy + Math.sin(rad) * arcR;
        layers.push(mkEllipse({ name: `Leaf L${i}`, cx: lx, cy: ly, rx: leafRx, ry: leafRy, fill: sp(pc(p), o * 0.35), tags: tags("seal-laurel-wreath", ["seal", "leaf"]) }));
      }
      // Right arc (0° to 180°)
      for (let i = 0; i < leafCount; i++) {
        const angle = 20 + (i * 160) / leafCount;
        const rad = (angle * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * arcR;
        const ly = cy + Math.sin(rad) * arcR;
        layers.push(mkEllipse({ name: `Leaf R${i}`, cx: lx, cy: ly, rx: leafRx, ry: leafRy, fill: sp(pc(p), o * 0.35), tags: tags("seal-laurel-wreath", ["seal", "leaf"]) }));
      }
      return layers;
    },
  },
  {
    id: "seal-notary-stamp",
    label: "Notary Stamp Seal",
    description: "Official-looking notary stamp with circle and cross-hatch center",
    aiDescription: "An outer circle border, inner circle, and cross-hatch pattern (two crossed rects) in the center. Resembles an official notary/government stamp. Primary with accent cross.",
    tags: ["seal", "notary", "stamp", "official", "government"],
    category: "seals", type: "shape-cluster",
    mood: ["classic", "bold"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.85;
      const r = sc(32, p);
      return [
        mkEllipse({ name: "Stamp Outer", cx, cy, rx: r, ry: r, stroke: sk(pc(p), 2.5, o * 0.7), tags: tags("seal-notary-stamp", ["seal", "outer"]) }),
        mkEllipse({ name: "Stamp Inner", cx, cy, rx: r - 6, ry: r - 6, stroke: sk(pc(p), 1, o * 0.4), tags: tags("seal-notary-stamp", ["seal", "inner"]) }),
        // Cross bars
        mkRect({ name: "Cross H", x: cx - r + 10, y: cy - 1, w: (r - 10) * 2, h: 2, fill: sp(p.accent, o * 0.5), tags: tags("seal-notary-stamp", ["seal", "cross"]) }),
        mkRect({ name: "Cross V", x: cx - 1, y: cy - r + 10, w: 2, h: (r - 10) * 2, fill: sp(p.accent, o * 0.5), tags: tags("seal-notary-stamp", ["seal", "cross"]) }),
      ];
    },
  },
  {
    id: "seal-ribbon-medal",
    label: "Ribbon Medal Seal",
    description: "Circular medal with ribbon tails — complete seal unit",
    aiDescription: "A filled circle (medal) above two rectangular ribbon tails fanning below it. Medal uses primary color, ribbon tails use accent. Complete composited seal+ribbon unit.",
    tags: ["seal", "medal", "ribbon", "award", "complete"],
    category: "seals", type: "shape-cluster",
    mood: ["bold", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.82;
      const r = sc(28, p);
      const tailW = sc(14, p), tailH = sc(40, p);
      return [
        // Left ribbon tail
        mkRect({ name: "Medal Tail L", x: cx - sc(18, p), y: cy + r - 6, w: tailW, h: tailH, fill: sp(p.accent, o * 0.6), tags: tags("seal-ribbon-medal", ["seal", "tail"]) }),
        // Right ribbon tail
        mkRect({ name: "Medal Tail R", x: cx + sc(4, p), y: cy + r - 6, w: tailW, h: tailH, fill: sp(p.accent, o * 0.6), tags: tags("seal-ribbon-medal", ["seal", "tail"]) }),
        // Medal disc
        mkEllipse({ name: "Medal Disc", cx, cy, rx: r, ry: r, fill: sp(pc(p), o * 0.8), stroke: sk(pc(p), 2, o * 0.5), tags: tags("seal-ribbon-medal", ["seal", "medal"]) }),
        // Inner accent
        mkEllipse({ name: "Medal Inner", cx, cy, rx: r - 8, ry: r - 8, stroke: sk(p.accent, 1, o * 0.5), tags: tags("seal-ribbon-medal", ["seal", "inner-ring"]) }),
      ];
    },
  },
  {
    id: "seal-hexagonal",
    label: "Hexagonal Seal",
    description: "Modern hexagon-shaped seal/badge",
    aiDescription: "A hexagon approximated by 6 small rects arranged in a hexagonal outline pattern around a center point, plus a filled center circle. Modern tech/corporate feel.",
    tags: ["seal", "hexagon", "modern", "tech", "badge"],
    category: "seals", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = H * 0.84;
      const r = sc(30, p);
      const sides = 6;
      const edgeW = sc(4, p);
      // Hex edges
      for (let i = 0; i < sides; i++) {
        const a1 = ((i * 360) / sides * Math.PI) / 180;
        const x1 = cx + Math.cos(a1) * r;
        const y1 = cy + Math.sin(a1) * r;
        layers.push(mkRect({ name: `Hex Edge ${i}`, x: x1 - edgeW / 2, y: y1 - edgeW / 2, w: edgeW, h: edgeW, fill: sp(pc(p), o * 0.5), tags: tags("seal-hexagonal", ["seal", "hex-edge"]) }));
      }
      // Hex outline (approx with ring)
      layers.push(mkEllipse({ name: "Hex Ring", cx, cy, rx: r, ry: r, stroke: sk(pc(p), 1.5, o * 0.4), tags: tags("seal-hexagonal", ["seal", "hex-outline"]) }));
      // Center fill
      layers.push(mkEllipse({ name: "Hex Center", cx, cy, rx: sc(14, p), ry: sc(14, p), fill: sp(p.accent, o * 0.6), tags: tags("seal-hexagonal", ["seal", "center"]) }));
      return layers;
    },
  },
];
// =============================================================================
// 3e. CORNERS — Ornamental corner pieces placed at one or all four corners
// =============================================================================

const cornerAssets: CertAsset[] = [
  {
    id: "corner-flourish-classic",
    label: "Classic Flourish Corners",
    description: "Ornate flourish scrollwork in all four corners",
    aiDescription: "Curved L-shaped flourishes in each corner made of layered arcs (quarter-ellipses). Primary color at medium opacity. Each flourish is ~60×60px.",
    tags: ["corner", "flourish", "scroll", "ornate", "classic"],
    category: "corners", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(24, p);
      const cSize = sc(55, p);
      const positions = [
        { x: m, y: m, sx: 1, sy: 1 },           // TL
        { x: W - m - cSize, y: m, sx: -1, sy: 1 }, // TR
        { x: m, y: H - m - cSize, sx: 1, sy: -1 }, // BL
        { x: W - m - cSize, y: H - m - cSize, sx: -1, sy: -1 }, // BR
      ];
      for (const pos of positions) {
        // Outer arc
        layers.push(mkEllipse({ name: `Flourish Outer`, cx: pos.x + (pos.sx > 0 ? 0 : cSize), cy: pos.y + (pos.sy > 0 ? 0 : cSize), rx: cSize * 0.8, ry: cSize * 0.8, stroke: sk(pc(p), 1.5, o * 0.4), tags: tags("corner-flourish-classic", ["corner", "flourish-arc"]) }));
        // Inner accent
        layers.push(mkEllipse({ name: `Flourish Inner`, cx: pos.x + (pos.sx > 0 ? 8 : cSize - 8), cy: pos.y + (pos.sy > 0 ? 8 : cSize - 8), rx: cSize * 0.4, ry: cSize * 0.4, stroke: sk(p.accent, 1, o * 0.3), tags: tags("corner-flourish-classic", ["corner", "flourish-inner"]) }));
        // Corner dot
        layers.push(mkEllipse({ name: `Flourish Dot`, cx: pos.x + (pos.sx > 0 ? 4 : cSize - 4), cy: pos.y + (pos.sy > 0 ? 4 : cSize - 4), rx: 3, ry: 3, fill: sp(pc(p), o * 0.5), tags: tags("corner-flourish-classic", ["corner", "dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-l-bracket",
    label: "L-Bracket Corners",
    description: "Simple L-shaped brackets in all four corners",
    aiDescription: "Clean right-angle L-bracket marks in each corner. Each bracket is two thin rectangles forming an L shape. Minimalist, goes with any style.",
    tags: ["corner", "bracket", "L-shape", "minimal", "clean"],
    category: "corners", type: "frame-decoration",
    mood: ["modern", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(28, p);
      const armL = sc(40, p);
      const armW = sc(2, p);
      const corners = [
        { x: m, y: m, hDir: 1, vDir: 1 },
        { x: W - m, y: m, hDir: -1, vDir: 1 },
        { x: m, y: H - m, hDir: 1, vDir: -1 },
        { x: W - m, y: H - m, hDir: -1, vDir: -1 },
      ];
      const layers: LayerV2[] = [];
      for (const c of corners) {
        const hx = c.hDir > 0 ? c.x : c.x - armL;
        const vy = c.vDir > 0 ? c.y : c.y - armL;
        // Horizontal arm
        layers.push(mkRect({ name: `Bracket H`, x: hx, y: c.y - armW / 2, w: armL, h: armW, fill: sp(pc(p), o * 0.6), tags: tags("corner-l-bracket", ["corner", "bracket-h"]) }));
        // Vertical arm
        layers.push(mkRect({ name: `Bracket V`, x: c.x - armW / 2, y: vy, w: armW, h: armL, fill: sp(pc(p), o * 0.6), tags: tags("corner-l-bracket", ["corner", "bracket-v"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-art-deco-fan",
    label: "Art Deco Fan Corners",
    description: "Fan-shaped radiating lines in corners, art deco style",
    aiDescription: "Multiple small rects radiating from each corner point, forming a quarter-fan pattern. 5 rays per corner, primary and accent alternating colors.",
    tags: ["corner", "art-deco", "fan", "radiating", "geometric"],
    category: "corners", type: "shape-cluster",
    mood: ["vintage", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(20, p);
      const rayLen = sc(45, p);
      const rayW = sc(2, p);
      const rays = 5;
      // TL corner
      for (let i = 0; i < rays; i++) {
        const angle = (i * 90) / (rays - 1);
        const rad = (angle * Math.PI) / 180;
        const ex = m + Math.cos(rad) * rayLen;
        const ey = m + Math.sin(rad) * rayLen;
        layers.push(mkRect({ name: `Fan TL ${i}`, x: Math.min(m, ex), y: Math.min(m, ey), w: Math.abs(ex - m) || rayW, h: Math.abs(ey - m) || rayW, fill: sp(i % 2 === 0 ? pc(p) : p.accent, o * 0.3), tags: tags("corner-art-deco-fan", ["corner", "fan-ray"]) }));
      }
      // TR corner
      for (let i = 0; i < rays; i++) {
        const angle = 90 + (i * 90) / (rays - 1);
        const rad = (angle * Math.PI) / 180;
        const ex = W - m + Math.cos(rad) * rayLen;
        const ey = m + Math.sin(rad) * rayLen;
        layers.push(mkRect({ name: `Fan TR ${i}`, x: Math.min(W - m, ex), y: Math.min(m, ey), w: Math.abs(ex - (W - m)) || rayW, h: Math.abs(ey - m) || rayW, fill: sp(i % 2 === 0 ? pc(p) : p.accent, o * 0.3), tags: tags("corner-art-deco-fan", ["corner", "fan-ray"]) }));
      }
      // BL corner
      for (let i = 0; i < rays; i++) {
        const angle = 270 + (i * 90) / (rays - 1);
        const rad = (angle * Math.PI) / 180;
        const ex = m + Math.cos(rad) * rayLen;
        const ey = H - m + Math.sin(rad) * rayLen;
        layers.push(mkRect({ name: `Fan BL ${i}`, x: Math.min(m, ex), y: Math.min(H - m, ey), w: Math.abs(ex - m) || rayW, h: Math.abs(ey - (H - m)) || rayW, fill: sp(i % 2 === 0 ? pc(p) : p.accent, o * 0.3), tags: tags("corner-art-deco-fan", ["corner", "fan-ray"]) }));
      }
      // BR corner
      for (let i = 0; i < rays; i++) {
        const angle = 180 + (i * 90) / (rays - 1);
        const rad = (angle * Math.PI) / 180;
        const ex = W - m + Math.cos(rad) * rayLen;
        const ey = H - m + Math.sin(rad) * rayLen;
        layers.push(mkRect({ name: `Fan BR ${i}`, x: Math.min(W - m, ex), y: Math.min(H - m, ey), w: Math.abs(ex - (W - m)) || rayW, h: Math.abs(ey - (H - m)) || rayW, fill: sp(i % 2 === 0 ? pc(p) : p.accent, o * 0.3), tags: tags("corner-art-deco-fan", ["corner", "fan-ray"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-double-arc",
    label: "Double Arc Corners",
    description: "Two nested quarter-circle arcs in each corner",
    aiDescription: "Two concentric quarter-circle arcs (stroke only, no fill) in each corner. Outer arc is primary, inner arc is accent. Creates elegant curved corner marks.",
    tags: ["corner", "arc", "double", "curved", "elegant"],
    category: "corners", type: "shape-cluster",
    mood: ["elegant", "modern"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const m = sc(22, p);
      const r1 = sc(40, p), r2 = sc(28, p);
      const positions = [
        { cx: m, cy: m },
        { cx: W - m, cy: m },
        { cx: m, cy: H - m },
        { cx: W - m, cy: H - m },
      ];
      const layers: LayerV2[] = [];
      for (const pos of positions) {
        layers.push(mkEllipse({ name: `Arc Outer`, cx: pos.cx, cy: pos.cy, rx: r1, ry: r1, stroke: sk(pc(p), 1.5, o * 0.4), tags: tags("corner-double-arc", ["corner", "arc-outer"]) }));
        layers.push(mkEllipse({ name: `Arc Inner`, cx: pos.cx, cy: pos.cy, rx: r2, ry: r2, stroke: sk(p.accent, 1, o * 0.3), tags: tags("corner-double-arc", ["corner", "arc-inner"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-diamond-cluster",
    label: "Diamond Cluster Corners",
    description: "Small cluster of diamond shapes in each corner",
    aiDescription: "3 small rotated squares (diamonds) clustered near each corner, forming a decorative grouping. Uses accent color at varying opacities.",
    tags: ["corner", "diamond", "cluster", "decorative", "geometric"],
    category: "corners", type: "shape-cluster",
    mood: ["elegant", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(30, p);
      const sz = sc(6, p);
      const offsets = [
        { dx: 0, dy: 0, alpha: 0.5 },
        { dx: 10, dy: 4, alpha: 0.35 },
        { dx: 4, dy: 10, alpha: 0.35 },
      ];
      const anchors = [
        { x: m, y: m },
        { x: W - m, y: m },
        { x: m, y: H - m },
        { x: W - m, y: H - m },
      ];
      for (const a of anchors) {
        for (const off of offsets) {
          layers.push(mkRect({ name: `CDiamond`, x: a.x + off.dx - sz / 2, y: a.y + off.dy - sz / 2, w: sz, h: sz, fill: sp(p.accent, o * off.alpha), tags: tags("corner-diamond-cluster", ["corner", "diamond"]) }));
        }
      }
      return layers;
    },
  },
  {
    id: "corner-filigree-swirl",
    label: "Filigree Swirl Corners",
    description: "Intricate filigree-style swirl patterns in each corner",
    aiDescription: "Multiple small concentric quarter-arcs and dots creating an intricate filigree/swirl impression in each corner. Primary color with varying opacities.",
    tags: ["corner", "filigree", "swirl", "intricate", "ornate"],
    category: "corners", type: "shape-cluster",
    mood: ["vintage", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(18, p);
      const positions = [
        { x: m, y: m },
        { x: W - m, y: m },
        { x: m, y: H - m },
        { x: W - m, y: H - m },
      ];
      for (const pos of positions) {
        // Nested arcs (3 levels)
        for (let i = 0; i < 3; i++) {
          const r = sc(15 + i * 12, p);
          layers.push(mkEllipse({ name: `Swirl ${i}`, cx: pos.x, cy: pos.y, rx: r, ry: r, stroke: sk(pc(p), 0.8, o * (0.35 - i * 0.08)), tags: tags("corner-filigree-swirl", ["corner", "swirl"]) }));
        }
        // Accent dot at corner point
        layers.push(mkEllipse({ name: `Swirl Dot`, cx: pos.x, cy: pos.y, rx: sc(3, p), ry: sc(3, p), fill: sp(p.accent, o * 0.5), tags: tags("corner-filigree-swirl", ["corner", "dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-greek-meander",
    label: "Greek Meander Corners",
    description: "Greek key/meander pattern forming L-shapes in corners",
    aiDescription: "Stepped rectangular pattern (Greek key/meander) in each corner, formed by small adjoining rectangles creating a maze-like L-bend. Primary color.",
    tags: ["corner", "greek", "meander", "key", "stepped"],
    category: "corners", type: "shape-cluster",
    mood: ["classic", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(22, p);
      const step = sc(8, p);
      const thick = sc(3, p);
      // Build top-left meander pattern
      const tlSteps = [
        { x: 0, y: 0, w: step * 4, h: thick },
        { x: step * 4 - thick, y: 0, w: thick, h: step * 2 },
        { x: step * 2, y: step * 2 - thick, w: step * 2, h: thick },
        { x: step * 2, y: step * 2, w: thick, h: step },
        { x: 0, y: 0, w: thick, h: step * 3 },
      ];
      const anchors = [
        { ox: m, oy: m },
        { ox: W - m - step * 4, oy: m },
        { ox: m, oy: H - m - step * 3 },
        { ox: W - m - step * 4, oy: H - m - step * 3 },
      ];
      for (const a of anchors) {
        for (const s of tlSteps) {
          layers.push(mkRect({ name: `Meander`, x: a.ox + s.x, y: a.oy + s.y, w: s.w, h: s.h, fill: sp(pc(p), o * 0.35), tags: tags("corner-greek-meander", ["corner", "meander-step"]) }));
        }
      }
      return layers;
    },
  },
  {
    id: "corner-dot-trio",
    label: "Dot Trio Corners",
    description: "Three dots arranged in a triangle at each corner",
    aiDescription: "Three small filled circles arranged in a triangular formation at each of the four page corners. Simple and clean. Accent color.",
    tags: ["corner", "dots", "trio", "minimal", "simple"],
    category: "corners", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(26, p);
      const r = sc(3.5, p);
      const spread = sc(14, p);
      const anchors = [
        { x: m, y: m, dx: 1, dy: 1 },
        { x: W - m, y: m, dx: -1, dy: 1 },
        { x: m, y: H - m, dx: 1, dy: -1 },
        { x: W - m, y: H - m, dx: -1, dy: -1 },
      ];
      for (const a of anchors) {
        layers.push(mkEllipse({ name: `Dot 1`, cx: a.x, cy: a.y, rx: r, ry: r, fill: sp(p.accent, o * 0.6), tags: tags("corner-dot-trio", ["corner", "dot"]) }));
        layers.push(mkEllipse({ name: `Dot 2`, cx: a.x + a.dx * spread, cy: a.y, rx: r, ry: r, fill: sp(p.accent, o * 0.4), tags: tags("corner-dot-trio", ["corner", "dot"]) }));
        layers.push(mkEllipse({ name: `Dot 3`, cx: a.x, cy: a.y + a.dy * spread, rx: r, ry: r, fill: sp(p.accent, o * 0.4), tags: tags("corner-dot-trio", ["corner", "dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-ornate-leaf",
    label: "Ornate Leaf Corners",
    description: "Stylized leaf/floral motif in each corner using layered ellipses",
    aiDescription: "Two overlapping ellipses per corner forming a stylized leaf/petal shape, plus a small stem rect. Organic and ornamental. Primary with accent highlights.",
    tags: ["corner", "leaf", "floral", "ornate", "organic"],
    category: "corners", type: "shape-cluster",
    mood: ["vintage", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(24, p);
      const anchors = [
        { cx: m + 15, cy: m + 15 },
        { cx: W - m - 15, cy: m + 15 },
        { cx: m + 15, cy: H - m - 15 },
        { cx: W - m - 15, cy: H - m - 15 },
      ];
      for (const a of anchors) {
        layers.push(mkEllipse({ name: `Leaf A`, cx: a.cx, cy: a.cy, rx: sc(14, p), ry: sc(8, p), fill: sp(pc(p), o * 0.25), tags: tags("corner-ornate-leaf", ["corner", "leaf"]) }));
        layers.push(mkEllipse({ name: `Leaf B`, cx: a.cx, cy: a.cy, rx: sc(8, p), ry: sc(14, p), fill: sp(pc(p), o * 0.25), tags: tags("corner-ornate-leaf", ["corner", "leaf"]) }));
        layers.push(mkEllipse({ name: `Leaf Center`, cx: a.cx, cy: a.cy, rx: sc(4, p), ry: sc(4, p), fill: sp(p.accent, o * 0.5), tags: tags("corner-ornate-leaf", ["corner", "center"]) }));
      }
      return layers;
    },
  },
  {
    id: "corner-geometric-block",
    label: "Geometric Block Corners",
    description: "Bold geometric block marks in each corner, modern corporate feel",
    aiDescription: "A solid square block with a smaller inset square cutout in each corner. Creates a bold modern corner mark. Primary color body, background color cutout.",
    tags: ["corner", "geometric", "block", "bold", "corporate"],
    category: "corners", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const m = sc(20, p);
      const blockSz = sc(24, p);
      const cutSz = sc(12, p);
      const anchors = [
        { x: m, y: m },
        { x: W - m - blockSz, y: m },
        { x: m, y: H - m - blockSz },
        { x: W - m - blockSz, y: H - m - blockSz },
      ];
      for (const a of anchors) {
        layers.push(mkRect({ name: `Block`, x: a.x, y: a.y, w: blockSz, h: blockSz, fill: sp(pc(p), o * 0.6), tags: tags("corner-geometric-block", ["corner", "block"]) }));
        layers.push(mkRect({ name: `Block Cut`, x: a.x + (blockSz - cutSz) / 2, y: a.y + (blockSz - cutSz) / 2, w: cutSz, h: cutSz, fill: sp(p.bg, o * 0.9), tags: tags("corner-geometric-block", ["corner", "cutout"]) }));
      }
      return layers;
    },
  },
];
// =============================================================================
// 3f. DIVIDERS — Horizontal separators, scrollwork dividers, line breaks
// =============================================================================

const dividerAssets: CertAsset[] = [
  {
    id: "divider-scrollwork",
    label: "Scrollwork Divider",
    description: "Ornate scrollwork divider with center flourish and extending lines",
    aiDescription: "A horizontal divider: two thin lines extending left and right from a central elliptical flourish. Primary color lines, accent center. Positioned at page center height.",
    tags: ["divider", "scrollwork", "ornate", "flourish", "classical"],
    category: "dividers", type: "shape-cluster",
    mood: ["elegant", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cy = H * 0.55;
      const cx = W / 2;
      const lineW = sc(W * 0.3, p);
      return [
        // Left line
        mkRect({ name: "Scroll Line L", x: cx - lineW - 10, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-scrollwork", ["divider", "line"]) }),
        // Right line
        mkRect({ name: "Scroll Line R", x: cx + 10, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-scrollwork", ["divider", "line"]) }),
        // Center flourish
        mkEllipse({ name: "Scroll Center", cx, cy, rx: sc(10, p), ry: sc(6, p), fill: sp(p.accent, o * 0.5), tags: tags("divider-scrollwork", ["divider", "center"]) }),
        // Center dot
        mkEllipse({ name: "Scroll Dot", cx, cy, rx: sc(3, p), ry: sc(3, p), fill: sp(pc(p), o * 0.6), tags: tags("divider-scrollwork", ["divider", "dot"]) }),
      ];
    },
  },
  {
    id: "divider-simple-line",
    label: "Simple Line Divider",
    description: "Clean single horizontal line, centered",
    aiDescription: "A single thin horizontal line spanning ~40% of the page width, centered. 1px height, primary color. The most minimal divider possible.",
    tags: ["divider", "line", "simple", "minimal", "clean"],
    category: "dividers", type: "frame-decoration",
    mood: ["modern", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const lineW = sc(W * 0.4, p);
      return [
        mkRect({ name: "Divider Line", x: (W - lineW) / 2, y: H * 0.55, w: lineW, h: 1, fill: sp(pc(p), o * 0.45), tags: tags("divider-simple-line", ["divider", "line"]) }),
      ];
    },
  },
  {
    id: "divider-double-line",
    label: "Double Line Divider",
    description: "Two parallel thin lines with slight spacing",
    aiDescription: "Two thin parallel horizontal lines (1px each, 4px apart) centered on the page. Primary color at medium opacity. Slightly more formal than single line.",
    tags: ["divider", "double", "lines", "parallel", "formal"],
    category: "dividers", type: "frame-decoration",
    mood: ["elegant", "classic"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const lineW = sc(W * 0.4, p);
      const cx = (W - lineW) / 2;
      const cy = H * 0.55;
      return [
        mkRect({ name: "Double Line Top", x: cx, y: cy - 2, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-double-line", ["divider", "line"]) }),
        mkRect({ name: "Double Line Bot", x: cx, y: cy + 2, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-double-line", ["divider", "line"]) }),
      ];
    },
  },
  {
    id: "divider-diamond-center",
    label: "Diamond Center Divider",
    description: "Line divider with a small diamond shape at center",
    aiDescription: "Two thin horizontal lines meeting at a small diamond (rotated square) in the center. Lines extend left and right. Primary lines, accent diamond.",
    tags: ["divider", "diamond", "center", "elegant", "geometric"],
    category: "dividers", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.55;
      const lineW = sc(W * 0.28, p);
      const dSz = sc(7, p);
      return [
        mkRect({ name: "Diam Line L", x: cx - lineW - dSz, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-diamond-center", ["divider", "line"]) }),
        mkRect({ name: "Diam Line R", x: cx + dSz, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.4), tags: tags("divider-diamond-center", ["divider", "line"]) }),
        mkRect({ name: "Diamond", x: cx - dSz / 2, y: cy - dSz / 2, w: dSz, h: dSz, fill: sp(p.accent, o * 0.6), tags: tags("divider-diamond-center", ["divider", "diamond"]) }),
      ];
    },
  },
  {
    id: "divider-dot-chain",
    label: "Dot Chain Divider",
    description: "Row of small dots forming a subtle divider line",
    aiDescription: "A horizontal row of small filled circles (~2px radius) evenly spaced across the center. Creates a dotted-line divider. Accent color at low opacity.",
    tags: ["divider", "dots", "chain", "subtle", "dotted"],
    category: "dividers", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const lineW = sc(W * 0.4, p);
      const startX = (W - lineW) / 2;
      const cy = H * 0.55;
      const gap = sc(10, p);
      const r = sc(2, p);
      for (let x = startX; x < startX + lineW; x += gap) {
        layers.push(mkEllipse({ name: `Dot`, cx: x, cy, rx: r, ry: r, fill: sp(p.accent, o * 0.4), tags: tags("divider-dot-chain", ["divider", "dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "divider-gradient-fade",
    label: "Gradient Fade Divider",
    description: "Horizontal gradient that fades from edges toward center, creating a soft divider",
    aiDescription: "A very thin (2px) horizontal gradient bar that is transparent at edges and primary-colored at center. Creates an ultra-subtle fade divider.",
    tags: ["divider", "gradient", "fade", "soft", "subtle"],
    category: "dividers", type: "gradient-wash",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const lineW = sc(W * 0.5, p);
      return [
        mkRect({ name: "Fade Divider", x: (W - lineW) / 2, y: H * 0.55, w: lineW, h: 2, fill: lg(90, [pc(p), 0, 0], [pc(p), 0.5, o * 0.5], [pc(p), 1, 0]), tags: tags("divider-gradient-fade", ["divider", "gradient"]) }),
      ];
    },
  },
  {
    id: "divider-ornate-rule",
    label: "Ornate Rule Divider",
    description: "Decorative horizontal rule with end caps and center ornament",
    aiDescription: "A horizontal line with small circle end-caps and a larger circle ornament at the centerpoint. Line is thin, ornaments are accent color. Formal and decorative.",
    tags: ["divider", "ornate", "rule", "endcaps", "decorative"],
    category: "dividers", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.55;
      const lineW = sc(W * 0.35, p);
      const capR = sc(3, p), centerR = sc(5, p);
      return [
        // Line
        mkRect({ name: "Rule Line", x: cx - lineW / 2, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.35), tags: tags("divider-ornate-rule", ["divider", "line"]) }),
        // Left cap
        mkEllipse({ name: "Cap L", cx: cx - lineW / 2, cy, rx: capR, ry: capR, fill: sp(p.accent, o * 0.5), tags: tags("divider-ornate-rule", ["divider", "cap"]) }),
        // Right cap
        mkEllipse({ name: "Cap R", cx: cx + lineW / 2, cy, rx: capR, ry: capR, fill: sp(p.accent, o * 0.5), tags: tags("divider-ornate-rule", ["divider", "cap"]) }),
        // Center ornament
        mkEllipse({ name: "Center Ornament", cx, cy, rx: centerR, ry: centerR, fill: sp(p.accent, o * 0.6), stroke: sk(pc(p), 1, o * 0.3), tags: tags("divider-ornate-rule", ["divider", "center"]) }),
      ];
    },
  },
  {
    id: "divider-wave-line",
    label: "Wave Line Divider",
    description: "Gentle wave/sine line used as a section divider",
    aiDescription: "Small dots arranged in a sine-wave pattern forming a gentle wavy divider line across the page center. Primary color, low opacity.",
    tags: ["divider", "wave", "sine", "gentle", "organic"],
    category: "dividers", type: "shape-cluster",
    mood: ["elegant", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const lineW = sc(W * 0.4, p);
      const startX = (W - lineW) / 2;
      const cy = H * 0.55;
      const step = sc(8, p);
      const amp = sc(4, p);
      for (let x = startX; x < startX + lineW; x += step) {
        const wave = Math.sin((x - startX) / 20) * amp;
        layers.push(mkEllipse({ name: `WDot`, cx: x, cy: cy + wave, rx: 1.2, ry: 1.2, fill: sp(pc(p), o * 0.35), tags: tags("divider-wave-line", ["divider", "wave-dot"]) }));
      }
      return layers;
    },
  },
  {
    id: "divider-triple-dash",
    label: "Triple Dash Divider",
    description: "Three short dashes centered horizontally, minimal and modern",
    aiDescription: "Three short horizontal dashes (each ~30px wide, 1.5px tall) evenly spaced at the center. Very minimal and modern. Accent color.",
    tags: ["divider", "dash", "triple", "minimal", "modern"],
    category: "dividers", type: "frame-decoration",
    mood: ["modern", "bold"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.55;
      const dashW = sc(30, p);
      const gap = sc(12, p);
      return [
        mkRect({ name: "Dash 1", x: cx - dashW * 1.5 - gap, y: cy, w: dashW, h: 1.5, fill: sp(p.accent, o * 0.5), tags: tags("divider-triple-dash", ["divider", "dash"]) }),
        mkRect({ name: "Dash 2", x: cx - dashW / 2, y: cy, w: dashW, h: 1.5, fill: sp(p.accent, o * 0.5), tags: tags("divider-triple-dash", ["divider", "dash"]) }),
        mkRect({ name: "Dash 3", x: cx + dashW / 2 + gap, y: cy, w: dashW, h: 1.5, fill: sp(p.accent, o * 0.5), tags: tags("divider-triple-dash", ["divider", "dash"]) }),
      ];
    },
  },
  {
    id: "divider-fleur-de-lis",
    label: "Fleur-de-Lis Divider",
    description: "Horizontal line with a fleur-de-lis style center composed of ellipses",
    aiDescription: "A centered horizontal line with a fleur-de-lis motif at the center made from 3 overlapping ellipses (center tall, two side petals angled). Primary lines, accent fleur.",
    tags: ["divider", "fleur", "fleur-de-lis", "ornate", "royal"],
    category: "dividers", type: "shape-cluster",
    mood: ["elegant", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.55;
      const lineW = sc(W * 0.3, p);
      return [
        // Lines
        mkRect({ name: "Fleur Line L", x: cx - lineW - 15, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.35), tags: tags("divider-fleur-de-lis", ["divider", "line"]) }),
        mkRect({ name: "Fleur Line R", x: cx + 15, y: cy, w: lineW, h: 1, fill: sp(pc(p), o * 0.35), tags: tags("divider-fleur-de-lis", ["divider", "line"]) }),
        // Center petal (tall)
        mkEllipse({ name: "Fleur Center", cx, cy: cy - 4, rx: sc(4, p), ry: sc(10, p), fill: sp(p.accent, o * 0.5), tags: tags("divider-fleur-de-lis", ["divider", "petal"]) }),
        // Left petal
        mkEllipse({ name: "Fleur Petal L", cx: cx - 8, cy, rx: sc(5, p), ry: sc(7, p), fill: sp(p.accent, o * 0.35), tags: tags("divider-fleur-de-lis", ["divider", "petal"]) }),
        // Right petal
        mkEllipse({ name: "Fleur Petal R", cx: cx + 8, cy, rx: sc(5, p), ry: sc(7, p), fill: sp(p.accent, o * 0.35), tags: tags("divider-fleur-de-lis", ["divider", "petal"]) }),
      ];
    },
  },
];
// =============================================================================
// 3g. BACKGROUNDS — Gradient washes, patterns, textures
// =============================================================================

const backgroundAssets: CertAsset[] = [
  {
    id: "bg-radial-vignette",
    label: "Radial Vignette",
    description: "Soft radial gradient vignette darkening edges, keeping center bright",
    aiDescription: "A full-page radial gradient from transparent center to dark edges, creating a classic vignette effect. Uses background color (darkened) at edges.",
    tags: ["background", "vignette", "radial", "soft", "depth"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Vignette", x: 0, y: 0, w: W, h: H, fill: rg(W / 2, H / 2, ["#000000", 0, 0], ["#000000", 0.7, 0.04 * o], ["#000000", 1, 0.15 * o]), tags: tags("bg-radial-vignette", ["background", "vignette"]) }),
      ];
    },
  },
  {
    id: "bg-gradient-warm",
    label: "Warm Gradient Wash",
    description: "Vertical gradient from light warm tone at top to slightly warmer at bottom",
    aiDescription: "A full-page vertical gradient from the primary color (very low opacity) at top to accent color (very low opacity) at bottom. Creates a warm tonal wash.",
    tags: ["background", "gradient", "warm", "vertical", "tonal"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["elegant", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Warm Wash", x: 0, y: 0, w: W, h: H, fill: lg(180, [pc(p), 0, 0.05 * o], [p.accent, 1, 0.04 * o]), tags: tags("bg-gradient-warm", ["background", "gradient"]) }),
      ];
    },
  },
  {
    id: "bg-gradient-cool",
    label: "Cool Gradient Wash",
    description: "Diagonal gradient from cool secondary to transparent",
    aiDescription: "A full-page diagonal gradient from secondary color (low opacity, top-left) fading to transparent (bottom-right). Creates a cool, professional tone.",
    tags: ["background", "gradient", "cool", "diagonal", "professional"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Cool Wash", x: 0, y: 0, w: W, h: H, fill: lg(135, [p.secondary, 0, 0.06 * o], [p.secondary, 1, 0]), tags: tags("bg-gradient-cool", ["background", "gradient"]) }),
      ];
    },
  },
  {
    id: "bg-paper-texture",
    label: "Paper Texture",
    description: "Subtle paper-like texture using scattered micro-dots",
    aiDescription: "Hundreds of tiny (1px) semi-transparent dots scattered across the page in a grid with slight random offset, simulating paper grain texture. Very subtle, primary color.",
    tags: ["background", "texture", "paper", "grain", "subtle"],
    category: "backgrounds", type: "shape-cluster",
    mood: ["vintage", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const grid = sc(20, p);
      // Seeded pseudo-random for deterministic texture
      let seed = 42;
      const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; };
      for (let gx = 0; gx < W; gx += grid) {
        for (let gy = 0; gy < H; gy += grid) {
          if (rand() > 0.4) continue; // skip ~60% for sparse texture
          const dx = (rand() - 0.5) * grid * 0.6;
          const dy = (rand() - 0.5) * grid * 0.6;
          const alpha = 0.03 + rand() * 0.04;
          layers.push(mkRect({ name: `Grain`, x: gx + dx, y: gy + dy, w: 1, h: 1, fill: sp(pc(p), alpha * o), tags: tags("bg-paper-texture", ["background", "grain"]) }));
        }
      }
      return layers;
    },
  },
  {
    id: "bg-linen-lines",
    label: "Linen Lines",
    description: "Very faint horizontal lines simulating linen paper texture",
    aiDescription: "Thin horizontal lines at ~6px intervals across the entire page at extremely low opacity, simulating the appearance of linen or safety-paper texture.",
    tags: ["background", "linen", "lines", "texture", "subtle"],
    category: "backgrounds", type: "shape-cluster",
    mood: ["classic", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const gap = sc(6, p);
      for (let y = 0; y < H; y += gap) {
        layers.push(mkRect({ name: `Linen`, x: 0, y, w: W, h: 0.5, fill: sp(pc(p), o * 0.025), tags: tags("bg-linen-lines", ["background", "linen"]) }));
      }
      return layers;
    },
  },
  {
    id: "bg-center-spotlight",
    label: "Center Spotlight",
    description: "Bright spotlight effect in the center of the page",
    aiDescription: "A large semi-transparent radial gradient centered on the page, bright white at center fading to transparent. Creates a spotlight/highlight effect for center content.",
    tags: ["background", "spotlight", "center", "bright", "highlight"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Spotlight", x: 0, y: 0, w: W, h: H, fill: rg(W / 2, H / 2, ["#FFFFFF", 0, 0.06 * o], ["#FFFFFF", 1, 0]), tags: tags("bg-center-spotlight", ["background", "spotlight"]) }),
      ];
    },
  },
  {
    id: "bg-diagonal-stripes",
    label: "Diagonal Stripes",
    description: "Very faint diagonal stripes across the entire background",
    aiDescription: "Thin diagonal stripe pattern across the page created by evenly spaced narrow rectangles. Each stripe is 1px wide. Ultra-subtle, uses primary at very low opacity.",
    tags: ["background", "stripes", "diagonal", "pattern", "subtle"],
    category: "backgrounds", type: "shape-cluster",
    mood: ["modern", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const gap = sc(30, p);
      for (let i = -H; i < W + H; i += gap) {
        layers.push(mkRect({ name: `Stripe`, x: i, y: 0, w: 1, h: H, fill: sp(pc(p), o * 0.02), tags: tags("bg-diagonal-stripes", ["background", "stripe"]) }));
      }
      return layers;
    },
  },
  {
    id: "bg-two-tone-split",
    label: "Two-Tone Split",
    description: "Page split into two subtle tonal zones top/bottom",
    aiDescription: "Top half of the page has a very subtle primary-tinted overlay, bottom half has a secondary-tinted overlay. Creates a two-tone split background.",
    tags: ["background", "split", "two-tone", "zones", "subtle"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Tone Top", x: 0, y: 0, w: W, h: H / 2, fill: sp(pc(p), o * 0.03), tags: tags("bg-two-tone-split", ["background", "tone-top"]) }),
        mkRect({ name: "Tone Bottom", x: 0, y: H / 2, w: W, h: H / 2, fill: sp(p.secondary, o * 0.03), tags: tags("bg-two-tone-split", ["background", "tone-bottom"]) }),
      ];
    },
  },
  {
    id: "bg-border-wash",
    label: "Border Wash",
    description: "Gradient wash that darkens toward all four edges",
    aiDescription: "Four overlapping gradient rectangles along each edge that fade from primary (low opacity) to transparent inward. Creates a framed/washed border effect.",
    tags: ["background", "border", "wash", "fade", "framed"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const band = sc(80, p);
      return [
        mkRect({ name: "Wash Top", x: 0, y: 0, w: W, h: band, fill: lg(180, [pc(p), 0, 0.06 * o], [pc(p), 1, 0]), tags: tags("bg-border-wash", ["background", "wash"]) }),
        mkRect({ name: "Wash Bot", x: 0, y: H - band, w: W, h: band, fill: lg(0, [pc(p), 0, 0.06 * o], [pc(p), 1, 0]), tags: tags("bg-border-wash", ["background", "wash"]) }),
        mkRect({ name: "Wash Left", x: 0, y: 0, w: band, h: H, fill: lg(90, [pc(p), 0, 0.04 * o], [pc(p), 1, 0]), tags: tags("bg-border-wash", ["background", "wash"]) }),
        mkRect({ name: "Wash Right", x: W - band, y: 0, w: band, h: H, fill: lg(270, [pc(p), 0, 0.04 * o], [pc(p), 1, 0]), tags: tags("bg-border-wash", ["background", "wash"]) }),
      ];
    },
  },
  {
    id: "bg-gold-shimmer",
    label: "Gold Shimmer",
    description: "Subtle golden shimmer gradient overlay for premium certificates",
    aiDescription: "A full-page diagonal gradient from warm gold (#C9A84C at very low opacity) to transparent. Creates a premium golden shimmer. Does not use primary color — uses its own palette.",
    tags: ["background", "gold", "shimmer", "premium", "luxury"],
    category: "backgrounds", type: "gradient-wash",
    mood: ["elegant", "vintage"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Gold Shimmer", x: 0, y: 0, w: W, h: H, fill: lg(135, ["#C9A84C", 0, 0.06 * o], ["#C9A84C", 0.5, 0.02 * o], ["#C9A84C", 1, 0]), tags: tags("bg-gold-shimmer", ["background", "gold"]) }),
      ];
    },
  },
];
// =============================================================================
// 3h. ORNAMENTS — Laurels, stars, shields, crests, standalone decorative pieces
// =============================================================================

const ornamentAssets: CertAsset[] = [
  {
    id: "ornament-laurel-branch",
    label: "Laurel Branch Pair",
    description: "Two mirrored laurel branches framing a center point",
    aiDescription: "Two arcs of small ellipses forming mirrored laurel branches opening upward. Left branch curves left, right curves right. Positioned below center — great for framing recipient name.",
    tags: ["ornament", "laurel", "branch", "honor", "framing"],
    category: "ornaments", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, baseY = H * 0.50;
      const arcR = sc(50, p);
      const leafRx = sc(4, p), leafRy = sc(9, p);
      const leafCount = 7;
      // Left branch
      for (let i = 0; i < leafCount; i++) {
        const angle = 200 + (i * 140) / leafCount;
        const rad = (angle * Math.PI) / 180;
        const lx = cx - sc(10, p) + Math.cos(rad) * arcR;
        const ly = baseY + Math.sin(rad) * arcR * 0.6;
        layers.push(mkEllipse({ name: `Laurel L${i}`, cx: lx, cy: ly, rx: leafRx, ry: leafRy, fill: sp(pc(p), o * 0.3), tags: tags("ornament-laurel-branch", ["ornament", "leaf"]) }));
      }
      // Right branch
      for (let i = 0; i < leafCount; i++) {
        const angle = 20 + (i * 140) / leafCount;
        const rad = (angle * Math.PI) / 180;
        const lx = cx + sc(10, p) + Math.cos(rad) * arcR;
        const ly = baseY + Math.sin(rad) * arcR * 0.6;
        layers.push(mkEllipse({ name: `Laurel R${i}`, cx: lx, cy: ly, rx: leafRx, ry: leafRy, fill: sp(pc(p), o * 0.3), tags: tags("ornament-laurel-branch", ["ornament", "leaf"]) }));
      }
      // Stem bases
      layers.push(mkRect({ name: "Stem L", x: cx - 12, y: baseY + arcR * 0.5, w: 2, h: sc(16, p), fill: sp(pc(p), o * 0.25), tags: tags("ornament-laurel-branch", ["ornament", "stem"]) }));
      layers.push(mkRect({ name: "Stem R", x: cx + 10, y: baseY + arcR * 0.5, w: 2, h: sc(16, p), fill: sp(pc(p), o * 0.25), tags: tags("ornament-laurel-branch", ["ornament", "stem"]) }));
      return layers;
    },
  },
  {
    id: "ornament-five-star",
    label: "Five Star Rating",
    description: "Five stars in a horizontal row, like a quality/honor rating",
    aiDescription: "Five small filled circles (representing stars as dots) evenly spaced in a horizontal row centered on the page. Accent color. Great for 'honors' or 'distinction' markers.",
    tags: ["ornament", "star", "rating", "five", "honor"],
    category: "ornaments", type: "shape-cluster",
    mood: ["bold", "modern"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cy = H * 0.42;
      const gap = sc(20, p);
      const r = sc(5, p);
      const startX = W / 2 - 2 * gap;
      for (let i = 0; i < 5; i++) {
        layers.push(mkEllipse({ name: `Star ${i + 1}`, cx: startX + i * gap, cy, rx: r, ry: r, fill: sp(p.accent, o * 0.7), tags: tags("ornament-five-star", ["ornament", "star"]) }));
      }
      return layers;
    },
  },
  {
    id: "ornament-crest-shield",
    label: "Crest Shield",
    description: "Small heraldic crest shield positioned at top-center",
    aiDescription: "A heraldic shield shape (rect body + pointed bottom + curved top) at top center of page. Uses primary and accent colors. Commonly placed above 'Certificate of' text.",
    tags: ["ornament", "crest", "shield", "heraldic", "top"],
    category: "ornaments", type: "shape-cluster",
    mood: ["classic", "bold"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const cx = W / 2;
      const sY = sc(60, p);
      const sW = sc(40, p), sH = sc(48, p);
      return [
        // Shield body
        mkRect({ name: "Crest Body", x: cx - sW / 2, y: sY, w: sW, h: sH * 0.65, fill: sp(pc(p), o * 0.5), tags: tags("ornament-crest-shield", ["ornament", "shield"]) }),
        // Shield top curved
        mkEllipse({ name: "Crest Top", cx, cy: sY, rx: sW / 2, ry: sc(10, p), fill: sp(pc(p), o * 0.5), tags: tags("ornament-crest-shield", ["ornament", "shield-top"]) }),
        // Shield point
        mkRect({ name: "Crest Point", x: cx - 5, y: sY + sH * 0.65 - 2, w: 10, h: sc(14, p), fill: sp(pc(p), o * 0.5), tags: tags("ornament-crest-shield", ["ornament", "point"]) }),
        // Inner accent
        mkRect({ name: "Crest Inner", x: cx - sW / 4, y: sY + 8, w: sW / 2, h: sH * 0.4, fill: sp(p.accent, o * 0.3), tags: tags("ornament-crest-shield", ["ornament", "inner"]) }),
      ];
    },
  },
  {
    id: "ornament-olive-wreath",
    label: "Olive Wreath",
    description: "Circular olive/peace wreath using ellipses for leaves",
    aiDescription: "A circular arrangement of small leaf-shaped ellipses forming an olive wreath. 12 leaves arranged in a circle. Positioned at top-center, typically above the title.",
    tags: ["ornament", "olive", "wreath", "peace", "circular"],
    category: "ornaments", type: "shape-cluster",
    mood: ["elegant", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cx = W / 2, cy = sc(80, p);
      const r = sc(30, p);
      const leafCount = 12;
      for (let i = 0; i < leafCount; i++) {
        const angle = (i * 360) / leafCount;
        const rad = (angle * Math.PI) / 180;
        const lx = cx + Math.cos(rad) * r;
        const ly = cy + Math.sin(rad) * r;
        layers.push(mkEllipse({ name: `Olive ${i}`, cx: lx, cy: ly, rx: sc(4, p), ry: sc(8, p), fill: sp(pc(p), o * 0.3), tags: tags("ornament-olive-wreath", ["ornament", "leaf"]) }));
      }
      return layers;
    },
  },
  {
    id: "ornament-decorative-line-pair",
    label: "Decorative Line Pair",
    description: "Two decorative horizontal lines with endpoints, flanking content area",
    aiDescription: "Two horizontal accent lines — one above and one below the main content zone. Each line has small circle endpoints. Creates a framed content area.",
    tags: ["ornament", "lines", "pair", "framing", "accent"],
    category: "ornaments", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const lineW = sc(W * 0.5, p);
      const cx = (W - lineW) / 2;
      const y1 = H * 0.30, y2 = H * 0.70;
      const dotR = sc(3, p);
      return [
        // Top line
        mkRect({ name: "Accent Line Top", x: cx, y: y1, w: lineW, h: 1, fill: sp(p.accent, o * 0.35), tags: tags("ornament-decorative-line-pair", ["ornament", "line"]) }),
        mkEllipse({ name: "Dot TL", cx, cy: y1, rx: dotR, ry: dotR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-decorative-line-pair", ["ornament", "endpoint"]) }),
        mkEllipse({ name: "Dot TR", cx: cx + lineW, cy: y1, rx: dotR, ry: dotR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-decorative-line-pair", ["ornament", "endpoint"]) }),
        // Bottom line
        mkRect({ name: "Accent Line Bot", x: cx, y: y2, w: lineW, h: 1, fill: sp(p.accent, o * 0.35), tags: tags("ornament-decorative-line-pair", ["ornament", "line"]) }),
        mkEllipse({ name: "Dot BL", cx, cy: y2, rx: dotR, ry: dotR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-decorative-line-pair", ["ornament", "endpoint"]) }),
        mkEllipse({ name: "Dot BR", cx: cx + lineW, cy: y2, rx: dotR, ry: dotR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-decorative-line-pair", ["ornament", "endpoint"]) }),
      ];
    },
  },
  {
    id: "ornament-crown",
    label: "Crown Ornament",
    description: "Simple crown shape at top center using rectangles and circles",
    aiDescription: "A crown motif at top-center: a horizontal base bar with three vertical prongs topped by small circles. Primary color. Placed above certificate title area.",
    tags: ["ornament", "crown", "royal", "authority", "header"],
    category: "ornaments", type: "shape-cluster",
    mood: ["bold", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const cx = W / 2;
      const baseY = sc(55, p);
      const baseW = sc(50, p), baseH = sc(8, p);
      const prongH = sc(20, p), prongW = sc(5, p);
      const tipR = sc(4, p);
      return [
        // Base
        mkRect({ name: "Crown Base", x: cx - baseW / 2, y: baseY, w: baseW, h: baseH, fill: sp(pc(p), o * 0.6), tags: tags("ornament-crown", ["ornament", "base"]) }),
        // Left prong
        mkRect({ name: "Prong L", x: cx - baseW / 2 + 4, y: baseY - prongH, w: prongW, h: prongH, fill: sp(pc(p), o * 0.5), tags: tags("ornament-crown", ["ornament", "prong"]) }),
        // Center prong
        mkRect({ name: "Prong C", x: cx - prongW / 2, y: baseY - prongH - 4, w: prongW, h: prongH + 4, fill: sp(pc(p), o * 0.5), tags: tags("ornament-crown", ["ornament", "prong"]) }),
        // Right prong
        mkRect({ name: "Prong R", x: cx + baseW / 2 - 4 - prongW, y: baseY - prongH, w: prongW, h: prongH, fill: sp(pc(p), o * 0.5), tags: tags("ornament-crown", ["ornament", "prong"]) }),
        // Tips
        mkEllipse({ name: "Tip L", cx: cx - baseW / 2 + 4 + prongW / 2, cy: baseY - prongH - tipR, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.6), tags: tags("ornament-crown", ["ornament", "tip"]) }),
        mkEllipse({ name: "Tip C", cx, cy: baseY - prongH - 4 - tipR, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.6), tags: tags("ornament-crown", ["ornament", "tip"]) }),
        mkEllipse({ name: "Tip R", cx: cx + baseW / 2 - 4 - prongW / 2, cy: baseY - prongH - tipR, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.6), tags: tags("ornament-crown", ["ornament", "tip"]) }),
      ];
    },
  },
  {
    id: "ornament-compass-rose",
    label: "Compass Rose",
    description: "Simple four-point compass rose using diamond shapes",
    aiDescription: "A four-pointed star/compass rose: four narrow diamond shapes at N/S/E/W positions radiating from a center circle. Accent diamonds, primary center.",
    tags: ["ornament", "compass", "rose", "navigation", "directional"],
    category: "ornaments", type: "shape-cluster",
    mood: ["vintage", "classic"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.15;
      const armLen = sc(20, p);
      const armW = sc(6, p);
      const centerR = sc(6, p);
      return [
        // N
        mkRect({ name: "Arm N", x: cx - armW / 2, y: cy - armLen, w: armW, h: armLen, fill: sp(p.accent, o * 0.4), tags: tags("ornament-compass-rose", ["ornament", "arm"]) }),
        // S
        mkRect({ name: "Arm S", x: cx - armW / 2, y: cy, w: armW, h: armLen, fill: sp(p.accent, o * 0.4), tags: tags("ornament-compass-rose", ["ornament", "arm"]) }),
        // E
        mkRect({ name: "Arm E", x: cx, y: cy - armW / 2, w: armLen, h: armW, fill: sp(p.accent, o * 0.4), tags: tags("ornament-compass-rose", ["ornament", "arm"]) }),
        // W
        mkRect({ name: "Arm W", x: cx - armLen, y: cy - armW / 2, w: armLen, h: armW, fill: sp(p.accent, o * 0.4), tags: tags("ornament-compass-rose", ["ornament", "arm"]) }),
        // Center
        mkEllipse({ name: "Rose Center", cx, cy, rx: centerR, ry: centerR, fill: sp(pc(p), o * 0.6), tags: tags("ornament-compass-rose", ["ornament", "center"]) }),
      ];
    },
  },
  {
    id: "ornament-scroll-banner",
    label: "Scroll Banner Header",
    description: "Decorative unrolled scroll shape at top of page for title text",
    aiDescription: "A scroll/parchment shape at top-center: a wide rectangle with rolled-edge ellipses on each side. Creates the look of an unrolled scroll banner for the certificate title.",
    tags: ["ornament", "scroll", "banner", "header", "parchment"],
    category: "ornaments", type: "shape-cluster",
    mood: ["vintage", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const bW = sc(W * 0.6, p);
      const bH = sc(50, p);
      const bX = (W - bW) / 2;
      const bY = sc(40, p);
      const rollR = sc(14, p);
      return [
        // Main scroll body
        mkRect({ name: "Scroll Body", x: bX, y: bY, w: bW, h: bH, fill: sp(pc(p), o * 0.15), stroke: sk(pc(p), 1, o * 0.3), tags: tags("ornament-scroll-banner", ["ornament", "body"]) }),
        // Left roll
        mkEllipse({ name: "Roll L", cx: bX, cy: bY + bH / 2, rx: rollR, ry: bH / 2 + 4, fill: sp(pc(p), o * 0.1), stroke: sk(pc(p), 0.75, o * 0.25), tags: tags("ornament-scroll-banner", ["ornament", "roll"]) }),
        // Right roll
        mkEllipse({ name: "Roll R", cx: bX + bW, cy: bY + bH / 2, rx: rollR, ry: bH / 2 + 4, fill: sp(pc(p), o * 0.1), stroke: sk(pc(p), 0.75, o * 0.25), tags: tags("ornament-scroll-banner", ["ornament", "roll"]) }),
      ];
    },
  },
  {
    id: "ornament-infinity-knot",
    label: "Infinity Knot",
    description: "Two overlapping ellipses forming an infinity/figure-8 knot",
    aiDescription: "Two overlapping ellipses side by side forming a figure-8 or infinity symbol. Stroke only, no fill. Positioned at bottom center as a finishing ornament.",
    tags: ["ornament", "infinity", "knot", "figure-eight", "eternal"],
    category: "ornaments", type: "shape-cluster",
    mood: ["modern", "elegant"],
    customizable: NO_ROTATE,
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2, cy = H * 0.90;
      const rx = sc(18, p), ry = sc(10, p);
      const gap = sc(14, p);
      return [
        mkEllipse({ name: "Infinity L", cx: cx - gap, cy, rx, ry, stroke: sk(pc(p), 1.5, o * 0.4), tags: tags("ornament-infinity-knot", ["ornament", "loop"]) }),
        mkEllipse({ name: "Infinity R", cx: cx + gap, cy, rx, ry, stroke: sk(pc(p), 1.5, o * 0.4), tags: tags("ornament-infinity-knot", ["ornament", "loop"]) }),
      ];
    },
  },
  {
    id: "ornament-cross-fleury",
    label: "Cross Fleury",
    description: "Decorative cross with fleur tips, suitable for religious or honor certificates",
    aiDescription: "A cross shape with small circle tips (fleury style). Vertical and horizontal bars with ellipse endpoints. Primary color. Positioned at top center.",
    tags: ["ornament", "cross", "fleury", "religious", "honor"],
    category: "ornaments", type: "shape-cluster",
    mood: ["classic", "elegant"],
    customizable: FULL_CUSTOM,
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      const cx = W / 2, cy = sc(70, p);
      const armLen = sc(22, p);
      const armW = sc(5, p);
      const tipR = sc(5, p);
      return [
        // Vertical bar
        mkRect({ name: "Cross V", x: cx - armW / 2, y: cy - armLen, w: armW, h: armLen * 2, fill: sp(pc(p), o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "bar"]) }),
        // Horizontal bar
        mkRect({ name: "Cross H", x: cx - armLen, y: cy - armW / 2, w: armLen * 2, h: armW, fill: sp(pc(p), o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "bar"]) }),
        // Tips
        mkEllipse({ name: "Tip N", cx, cy: cy - armLen, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "tip"]) }),
        mkEllipse({ name: "Tip S", cx, cy: cy + armLen, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "tip"]) }),
        mkEllipse({ name: "Tip E", cx: cx + armLen, cy, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "tip"]) }),
        mkEllipse({ name: "Tip W", cx: cx - armLen, cy, rx: tipR, ry: tipR, fill: sp(p.accent, o * 0.5), tags: tags("ornament-cross-fleury", ["ornament", "tip"]) }),
        // Center jewel
        mkEllipse({ name: "Center Jewel", cx, cy, rx: sc(4, p), ry: sc(4, p), fill: sp(p.accent, o * 0.7), tags: tags("ornament-cross-fleury", ["ornament", "center"]) }),
      ];
    },
  },
];

// =============================================================================
// 4.  Master Registry
// =============================================================================

/** All certificate assets — single source of truth */
export const CERT_ASSETS: CertAsset[] = [
  ...frameAssets,
  ...borderAssets,
  ...ribbonAssets,
  ...sealAssets,
  ...cornerAssets,
  ...dividerAssets,
  ...backgroundAssets,
  ...ornamentAssets,
];

/** O(1) lookup by ID */
export const CERT_REGISTRY: Record<string, CertAsset> = Object.fromEntries(
  CERT_ASSETS.map(a => [a.id, a])
);

/** All category values */
export const CERT_CATEGORIES: CertCategory[] = [
  "frames", "borders", "ribbons", "seals",
  "corners", "dividers", "backgrounds", "ornaments",
];

/** Category labels for UI */
export const CERT_CATEGORY_LABELS: Record<CertCategory, string> = {
  frames: "Frames",
  borders: "Borders",
  ribbons: "Ribbons & Banners",
  seals: "Seals & Medallions",
  corners: "Corner Decorations",
  dividers: "Dividers & Separators",
  backgrounds: "Backgrounds & Textures",
  ornaments: "Ornaments & Flourishes",
};

// =============================================================================
// 5.  AI Helper Functions
// =============================================================================

/** Returns a compact string listing all cert assets for AI prompt injection */
export function getCertListForAI(): string {
  const lines: string[] = ["Available certificate decorative assets:"];
  for (const cat of CERT_CATEGORIES) {
    const assets = CERT_ASSETS.filter(a => a.category === cat);
    if (assets.length === 0) continue;
    lines.push(`\n[${CERT_CATEGORY_LABELS[cat]}]`);
    for (const a of assets) {
      lines.push(`  ${a.id}: ${a.aiDescription} (tags: ${a.tags.join(", ")})`);
    }
  }
  return lines.join("\n");
}

/** Search cert assets by keyword */
export function searchCertAssets(query: string): CertAsset[] {
  const q = query.toLowerCase();
  return CERT_ASSETS.filter(a =>
    a.id.includes(q) || a.label.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.tags.some(t => t.includes(q)) ||
    a.category.includes(q)
  );
}

/** Get all asset IDs */
export function getAllCertIds(): string[] {
  return CERT_ASSETS.map(a => a.id);
}

/** Get assets by category */
export function getCertsByCategory(category: CertCategory): CertAsset[] {
  return CERT_ASSETS.filter(a => a.category === category);
}

/** Get assets by mood */
export function getCertsByMood(mood: CertMood): CertAsset[] {
  return CERT_ASSETS.filter(a => a.mood.includes(mood));
}

/** Build an asset by ID with given params, returns LayerV2[] or empty array */
export function buildCertAsset(id: string, params: CertBuildParams): LayerV2[] {
  const asset = CERT_REGISTRY[id];
  if (!asset) return [];
  return asset.build(params);
}

/** Get suggested assets for a design brief (AI helper) */
export function suggestCertAssets(brief: {
  mood?: CertMood;
  wantFrame?: boolean;
  wantSeal?: boolean;
  wantRibbon?: boolean;
  wantCorners?: boolean;
  wantDivider?: boolean;
}): CertAsset[] {
  const results: CertAsset[] = [];
  const mood = brief.mood ?? "classic";
  if (brief.wantFrame !== false) {
    const frames = getCertsByCategory("frames").filter(a => a.mood.includes(mood));
    if (frames.length > 0) results.push(frames[0]);
  }
  if (brief.wantSeal) {
    const seals = getCertsByCategory("seals").filter(a => a.mood.includes(mood));
    if (seals.length > 0) results.push(seals[0]);
  }
  if (brief.wantRibbon) {
    const ribbons = getCertsByCategory("ribbons").filter(a => a.mood.includes(mood));
    if (ribbons.length > 0) results.push(ribbons[0]);
  }
  if (brief.wantCorners) {
    const corners = getCertsByCategory("corners").filter(a => a.mood.includes(mood));
    if (corners.length > 0) results.push(corners[0]);
  }
  if (brief.wantDivider) {
    const dividers = getCertsByCategory("dividers").filter(a => a.mood.includes(mood));
    if (dividers.length > 0) results.push(dividers[0]);
  }
  return results;
}
