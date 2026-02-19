// =============================================================================
// DMSuite — Abstract Asset Library
//
// A global, shared asset bank of abstract decorative elements for use in
// business cards, posters, banners, social media, and any canvas workspace.
//
// Architecture follows Asset Bank Pattern (systemPatterns §2b):
//   - ZERO dependencies on other modules (imports only from ./schema)
//   - Exports: items array (with metadata), registry (O(1) lookup),
//     category list, AI helper functions
//   - Every asset has a `build()` function returning LayerV2[]
//   - Every layer is tagged `["abstract-asset", "abstract-{id}", ...]`
//     so it's immediately AI-targetable via ai-patch
//
// 90 assets across 9 categories:
//   modern (10), minimalist (10), vintage (10), corporate (10),
//   luxury (10), organic (10), tech (10), bold (10), geometric (10)
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

/** Style taxonomy for abstract assets */
export type AbstractCategory =
  | "modern"      // Geometric, futuristic, angular
  | "minimalist"  // Clean lines, whitespace-aware
  | "vintage"     // Art Deco, ornamental, badge-style
  | "corporate"   // Professional bands, formal frames
  | "luxury"      // Foil-style, marble veins, filigree
  | "organic"     // Waves, flowing curves, botanical
  | "tech"        // Circuit, grid, scanlines, data
  | "bold"        // High-contrast fills, impact shapes
  | "geometric";  // Pure form — tessellations, grids, polygons

export type AbstractAssetType =
  | "path-shape"        // SVG-like vector composition
  | "pattern-fill"      // Enhanced texture over full canvas
  | "frame-decoration"  // Corner/border/frame element set
  | "gradient-wash"     // Background gradient element
  | "shape-cluster"     // A group of related shapes
  | "texture-overlay"   // Grain, noise, halftone fill
  | "divider"           // Single rule / separator
  | "accent-mark";      // Small focal-point element

export type AbstractMood = "light" | "dark" | "vibrant" | "muted" | "metallic";

/** What can be customized on this asset */
export interface AbstractCustomizable {
  color: boolean;
  secondaryColor: boolean;
  scale: boolean;
  rotation: boolean;
  opacity: boolean;
  blendMode: boolean;
  position: boolean;
  spacing?: boolean;
}

/** Which config color roles this asset naturally uses */
export interface AbstractColorRoles {
  primary: boolean;
  secondary: boolean;
  background: boolean;
}

/** Parameters passed to the builder function */
export interface AbstractBuildParams {
  W: number;
  H: number;
  primary: string;
  secondary: string;
  text: string;
  bg: string;
  opacity?: number;       // 0–1, default 1
  scale?: number;         // 0.25–3, default 1
  rotation?: number;      // degrees
  xOffset?: number;       // px offset from default position
  yOffset?: number;       // px offset from default position
  blendMode?: string;
  colorOverride?: string; // Override primary with a custom hex
}

/** A complete abstract asset definition */
export interface AbstractAsset {
  id: string;
  label: string;
  description: string;       // Human-readable, precise
  aiDescription: string;     // Written for AI consumption
  tags: string[];            // Semantic tags — AI targetable
  category: AbstractCategory;
  type: AbstractAssetType;
  style: string[];           // e.g. ["angular", "bold", "geometric"]
  mood: AbstractMood[];
  customizable: AbstractCustomizable;
  colorRoles: AbstractColorRoles;
  /** Pure function: returns LayerV2[] with semantic tags */
  build: (params: AbstractBuildParams) => LayerV2[];
}

/** User-facing config for an abstract layer placed on a card */
export interface AbstractLayerConfig {
  assetId: string;
  opacity?: number;        // 0–1
  scale?: number;          // 0.25–3
  rotation?: number;       // degrees
  xOffset?: number;        // px
  yOffset?: number;        // px
  colorOverride?: string;  // hex — overrides primaryColor for this asset
  blendMode?: string;      // CSS blend mode
  zPosition?: "behind-content" | "above-content";
}

// =============================================================================
// 2.  Internal Helpers (paint, shape shortcuts)
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

function sp(hex: string, alpha = 1): Paint { return solidPaintHex(hex, alpha); }

function sk(hex: string, width: number, alpha = 1): StrokeSpec {
  return { paint: solidPaintHex(hex, alpha), width, align: "center", dash: [], cap: "butt", join: "miter", miterLimit: 10 };
}

function mkRect(opts: {
  name: string; x: number; y: number; w: number; h: number;
  fill?: Paint; stroke?: StrokeSpec; tags: string[];
  radii?: [number, number, number, number]; opacity?: number; blendMode?: string;
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
  if (opts.blendMode) (layer as unknown as { blendMode: string }).blendMode = opts.blendMode;
  return layer;
}

function mkEllipse(opts: {
  name: string; cx: number; cy: number; rx: number; ry: number;
  fill?: Paint; tags: string[]; opacity?: number; blendMode?: string;
}): ShapeLayerV2 {
  const layer = createShapeLayerV2({
    name: opts.name,
    x: opts.cx - opts.rx, y: opts.cy - opts.ry,
    width: opts.rx * 2, height: opts.ry * 2,
    shapeType: "ellipse",
    fill: opts.fill ?? solidPaintHex("#000000", 0.1),
    tags: opts.tags,
  });
  if (opts.opacity !== undefined) layer.opacity = opts.opacity;
  if (opts.blendMode) (layer as unknown as { blendMode: string }).blendMode = opts.blendMode;
  return layer;
}

function mkLine(opts: {
  name: string; x: number; y: number; w: number; h?: number;
  fill?: Paint; tags: string[]; opacity?: number;
}): ShapeLayerV2 {
  return createShapeLayerV2({
    name: opts.name,
    x: opts.x, y: opts.y,
    width: opts.w, height: opts.h ?? 1.5,
    shapeType: "rectangle",
    fill: opts.fill ?? solidPaintHex("#000000", 0.2),
    tags: opts.tags,
  });
}

/** Resolve primary color — apply override if set */
function pc(p: AbstractBuildParams): string {
  return p.colorOverride ?? p.primary;
}

/** Apply scale + offset to raw position/size */
function scaled(
  base: number, p: AbstractBuildParams, axis: "x" | "y" | "size"
): number {
  const s = p.scale ?? 1;
  if (axis === "size") return Math.round(base * s);
  if (axis === "x") return Math.round(base * s + (p.xOffset ?? 0));
  return Math.round(base * s + (p.yOffset ?? 0));
}

/** Build the base tag array for every abstract layer */
function baseTags(assetId: string, extraTags: string[], usesColor: "primary" | "secondary" | "both"): string[] {
  const tags = ["abstract-asset", `abstract-${assetId}`, ...extraTags];
  if (usesColor === "primary" || usesColor === "both") tags.push("color-primary");
  if (usesColor === "secondary" || usesColor === "both") tags.push("color-secondary");
  return tags;
}

/** Standard customizable defaults — most assets support everything */
const FULL_CUSTOM: AbstractCustomizable = {
  color: true, secondaryColor: true, scale: true, rotation: true,
  opacity: true, blendMode: true, position: true,
};

// =============================================================================
// 3.  Abstract Asset Definitions — 90 assets across 9 categories
// =============================================================================

// ─── MODERN (10) ────────────────────────────────────────────────────────────

const modernAssets: AbstractAsset[] = [
  {
    id: "modern-shard",
    label: "Diagonal Shard",
    description: "Angular polygon cut across one corner, creates a dynamic tension",
    aiDescription: "A sharp diagonal polygon shard cutting across the bottom-right corner of the card with a primary-to-secondary gradient. Creates dynamic visual tension and forward momentum.",
    tags: ["angular", "polygon", "corner"],
    category: "modern", type: "path-shape",
    style: ["angular", "dynamic", "bold"],
    mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H;
      return [createPathLayerV2({
        name: "Diagonal Shard",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.55, p, "x"), y: H },
          { type: "L", x: W, y: scaled(H * 0.3, p, "y") },
          { type: "L", x: W, y: H },
          { type: "Z" },
        ],
        fill: lg(135, [pc(p), 0], [p.secondary, 1]),
        closed: true,
        tags: baseTags("modern-shard", ["decorative", "panel"], "both"),
      })];
    },
  },
  {
    id: "modern-sphere-cluster",
    label: "Floating Spheres",
    description: "3 overlapping ellipses at varying opacities, creating layered depth",
    aiDescription: "Three overlapping circles of different sizes placed in the upper-right area. They use primary and secondary colors at low opacities to create a sense of layered, floating depth.",
    tags: ["circles", "overlap", "depth"],
    category: "modern", type: "shape-cluster",
    style: ["soft", "layered", "atmospheric"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkEllipse({ name: "Sphere Large", cx: scaled(W * 0.82, p, "x"), cy: scaled(H * 0.25, p, "y"), rx: scaled(W * 0.18, p, "size"), ry: scaled(W * 0.18, p, "size"), fill: sp(pc(p), 0.06 * o), tags: baseTags("modern-sphere-cluster", ["decorative"], "primary") }),
        mkEllipse({ name: "Sphere Medium", cx: scaled(W * 0.75, p, "x"), cy: scaled(H * 0.35, p, "y"), rx: scaled(W * 0.12, p, "size"), ry: scaled(W * 0.12, p, "size"), fill: sp(p.secondary, 0.05 * o), tags: baseTags("modern-sphere-cluster", ["decorative"], "secondary") }),
        mkEllipse({ name: "Sphere Small", cx: scaled(W * 0.88, p, "x"), cy: scaled(H * 0.15, p, "y"), rx: scaled(W * 0.06, p, "size"), ry: scaled(W * 0.06, p, "size"), fill: sp(pc(p), 0.04 * o), tags: baseTags("modern-sphere-cluster", ["decorative"], "primary") }),
      ];
    },
  },
  {
    id: "modern-halftone-arc",
    label: "Halftone Arc",
    description: "Quarter-circle dot pattern fading toward center, print-inspired feel",
    aiDescription: "A large quarter-arc in the bottom-right corner using the primary color at very low opacity. Simulates a halftone dot pattern that fades toward the center of the card.",
    tags: ["arc", "halftone", "dots", "corner"],
    category: "modern", type: "shape-cluster",
    style: ["print", "editorial", "graphic"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const dotCount = 8;
      for (let i = 0; i < dotCount; i++) {
        const t = i / dotCount;
        const angle = t * Math.PI / 2;
        const radius = scaled(W * 0.28, p, "size");
        const cx = W - Math.cos(angle) * radius + (p.xOffset ?? 0);
        const cy = H - Math.sin(angle) * radius + (p.yOffset ?? 0);
        const dotR = scaled(3 + i * 1.5, p, "size");
        layers.push(mkEllipse({
          name: `Halftone Dot ${i + 1}`, cx, cy, rx: dotR, ry: dotR,
          fill: sp(pc(p), (0.15 - t * 0.1) * o),
          tags: baseTags("modern-halftone-arc", ["decorative", "dot"], "primary"),
        }));
      }
      return layers;
    },
  },
  {
    id: "modern-grid-fade",
    label: "Grid Fade",
    description: "Structured grid lines that dissolve to the right, data-viz feel",
    aiDescription: "A set of evenly spaced horizontal and vertical grid lines on the right side of the card that fade from primary color to transparent, creating a data-visualization aesthetic.",
    tags: ["grid", "lines", "fade", "data"],
    category: "modern", type: "shape-cluster",
    style: ["structured", "technical", "precise"],
    mood: ["muted", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const count = 6;
      for (let i = 0; i < count; i++) {
        const alpha = (0.12 - i * 0.015) * o;
        // Horizontal
        layers.push(mkLine({
          name: `Grid H${i + 1}`, x: scaled(W * 0.55, p, "x"), y: scaled(H * 0.15 + i * H * 0.12, p, "y"),
          w: scaled(W * 0.35, p, "size"), h: 0.8,
          fill: sp(pc(p), alpha),
          tags: baseTags("modern-grid-fade", ["decorative", "grid-line"], "primary"),
        }));
        // Vertical
        if (i < 4) {
          layers.push(mkRect({
            name: `Grid V${i + 1}`, x: scaled(W * 0.6 + i * W * 0.09, p, "x"), y: scaled(H * 0.15, p, "y"),
            w: 0.8, h: scaled(H * 0.7, p, "size"),
            fill: sp(pc(p), alpha * 0.7),
            tags: baseTags("modern-grid-fade", ["decorative", "grid-line"], "primary"),
          }));
        }
      }
      return layers;
    },
  },
  {
    id: "modern-angular-cut",
    label: "Angular Cut",
    description: "Hard-edge polygon slice off bottom-right corner with gradient fill",
    aiDescription: "A clean, hard-edged triangular cut across the bottom-right corner filled with a primary-to-secondary gradient. Creates a strong modern asymmetrical composition.",
    tags: ["triangle", "cut", "corner", "asymmetric"],
    category: "modern", type: "path-shape",
    style: ["sharp", "geometric", "decisive"],
    mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H;
      return [createPathLayerV2({
        name: "Angular Cut",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.68, p, "x"), y: H },
          { type: "L", x: W, y: scaled(H * 0.5, p, "y") },
          { type: "L", x: W, y: H },
          { type: "Z" },
        ],
        fill: lg(120, [pc(p), 0, 0.12], [p.secondary, 1, 0.08]),
        closed: true,
        tags: baseTags("modern-angular-cut", ["decorative", "panel"], "both"),
      })];
    },
  },
  {
    id: "modern-neon-rings",
    label: "Neon Rings",
    description: "Concentric circles with glowing stroke style, futuristic neon feel",
    aiDescription: "Three concentric circles positioned off-center with primary-colored strokes at decreasing opacities. Simulates a neon glow ring effect for a futuristic aesthetic.",
    tags: ["circles", "neon", "glow", "rings"],
    category: "modern", type: "shape-cluster",
    style: ["futuristic", "glowing", "nightlife"],
    mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.85, p, "x"), cy = scaled(H * 0.3, p, "y");
      return [
        mkEllipse({ name: "Neon Ring Outer", cx, cy, rx: scaled(W * 0.14, p, "size"), ry: scaled(W * 0.14, p, "size"), fill: sp("#000000", 0), tags: baseTags("modern-neon-rings", ["decorative", "ring"], "primary"), opacity: o }),
        mkEllipse({ name: "Neon Ring Mid", cx, cy, rx: scaled(W * 0.1, p, "size"), ry: scaled(W * 0.1, p, "size"), fill: sp(pc(p), 0.04 * o), tags: baseTags("modern-neon-rings", ["decorative", "ring"], "primary") }),
        mkEllipse({ name: "Neon Ring Inner", cx, cy, rx: scaled(W * 0.06, p, "size"), ry: scaled(W * 0.06, p, "size"), fill: sp(pc(p), 0.08 * o), tags: baseTags("modern-neon-rings", ["decorative", "ring"], "primary") }),
      ];
    },
  },
  {
    id: "modern-hex-cluster",
    label: "Hex Cluster",
    description: "Honeycomb group of hexagons at corner, modular tech feel",
    aiDescription: "A cluster of 5 hexagonal shapes arranged in a honeycomb pattern in the top-right corner. Uses primary and secondary colors at low opacities for a modular, tech-forward appearance.",
    tags: ["hexagon", "honeycomb", "cluster", "modular"],
    category: "modern", type: "shape-cluster",
    style: ["modular", "tech", "structured"],
    mood: ["dark", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const hexSize = scaled(W * 0.05, p, "size");
      const positions = [
        [W * 0.85, H * 0.15], [W * 0.92, H * 0.15],
        [W * 0.81, H * 0.25], [W * 0.88, H * 0.25], [W * 0.95, H * 0.25],
      ];
      return positions.map((pos, i) => mkEllipse({
        name: `Hex ${i + 1}`, cx: pos[0] + (p.xOffset ?? 0), cy: pos[1] + (p.yOffset ?? 0),
        rx: hexSize, ry: hexSize * 0.88,
        fill: sp(i % 2 === 0 ? pc(p) : p.secondary, (0.06 - i * 0.008) * o),
        tags: baseTags("modern-hex-cluster", ["decorative", "hex"], i % 2 === 0 ? "primary" : "secondary"),
      }));
    },
  },
  {
    id: "modern-prism-split",
    label: "Prism Split",
    description: "Triangular light-split effect across midpoint, prismatic refraction",
    aiDescription: "A subtle triangular prism shape at the center-right of the card, splitting into primary and secondary colors. Creates a light-refraction/spectrum effect.",
    tags: ["prism", "triangle", "split", "spectrum"],
    category: "modern", type: "path-shape",
    style: ["optical", "scientific", "clean"],
    mood: ["light", "vibrant"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        createPathLayerV2({
          name: "Prism Top",
          x: 0, y: 0, width: W, height: H,
          commands: [
            { type: "M", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.35, p, "y") },
            { type: "L", x: scaled(W * 0.85, p, "x"), y: scaled(H * 0.5, p, "y") },
            { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.5, p, "y") },
            { type: "Z" },
          ],
          fill: solidPaintHex(pc(p), 0.06 * o),
          closed: true,
          tags: baseTags("modern-prism-split", ["decorative"], "primary"),
        }),
        createPathLayerV2({
          name: "Prism Bottom",
          x: 0, y: 0, width: W, height: H,
          commands: [
            { type: "M", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.5, p, "y") },
            { type: "L", x: scaled(W * 0.85, p, "x"), y: scaled(H * 0.5, p, "y") },
            { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.65, p, "y") },
            { type: "Z" },
          ],
          fill: solidPaintHex(p.secondary, 0.05 * o),
          closed: true,
          tags: baseTags("modern-prism-split", ["decorative"], "secondary"),
        }),
      ];
    },
  },
  {
    id: "modern-speed-lines",
    label: "Speed Lines",
    description: "Radiating directional lines from a point, kinetic feel",
    aiDescription: "Multiple thin horizontal lines of varying lengths radiating from the left edge, creating a sense of speed and forward motion. Uses primary color at low opacity.",
    tags: ["lines", "speed", "motion", "kinetic"],
    category: "modern", type: "shape-cluster",
    style: ["dynamic", "fast", "energetic"],
    mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const lines = [
        { y: 0.2, w: 0.35, a: 0.12 }, { y: 0.32, w: 0.25, a: 0.08 },
        { y: 0.44, w: 0.42, a: 0.1 }, { y: 0.56, w: 0.18, a: 0.06 },
        { y: 0.68, w: 0.3, a: 0.09 }, { y: 0.8, w: 0.22, a: 0.07 },
      ];
      for (let i = 0; i < lines.length; i++) {
        const l = lines[i];
        layers.push(mkLine({
          name: `Speed Line ${i + 1}`, x: p.xOffset ?? 0, y: scaled(H * l.y, p, "y"),
          w: scaled(W * l.w, p, "size"), h: 1,
          fill: sp(pc(p), l.a * o),
          tags: baseTags("modern-speed-lines", ["decorative", "line"], "primary"),
        }));
      }
      return layers;
    },
  },
  {
    id: "modern-tech-mesh",
    label: "Tech Mesh",
    description: "Light connected-node pattern, futuristic network feel",
    aiDescription: "A sparse network of small dots connected by faint lines in the upper-right corner. Simulates a technology mesh or constellation network with primary color at low opacity.",
    tags: ["mesh", "network", "nodes", "connected"],
    category: "modern", type: "shape-cluster",
    style: ["network", "futuristic", "connected"],
    mood: ["dark", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const nodes = [
        [0.78, 0.12], [0.88, 0.22], [0.82, 0.32],
        [0.92, 0.08], [0.72, 0.28],
      ];
      const layers: LayerV2[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const [nx, ny] = nodes[i];
        layers.push(mkEllipse({
          name: `Node ${i + 1}`,
          cx: scaled(W * nx, p, "x"), cy: scaled(H * ny, p, "y"),
          rx: scaled(2.5, p, "size"), ry: scaled(2.5, p, "size"),
          fill: sp(pc(p), 0.2 * o),
          tags: baseTags("modern-tech-mesh", ["decorative", "node"], "primary"),
        }));
      }
      // Connecting lines (approximated as thin rects)
      const connections = [[0, 1], [1, 2], [0, 3], [2, 4]];
      for (const [a, b] of connections) {
        const [ax, ay] = nodes[a];
        const [bx, by] = nodes[b];
        const lx = Math.min(ax, bx) * W, ly = Math.min(ay, by) * H;
        const lw = Math.abs(bx - ax) * W || 1;
        const lh = Math.abs(by - ay) * H || 1;
        layers.push(mkRect({
          name: `Link ${a}-${b}`, x: scaled(lx, p, "x"), y: scaled(ly, p, "y"),
          w: scaled(Math.max(lw, 1), p, "size"), h: Math.max(scaled(Math.min(lh, 0.8), p, "size"), 0.5),
          fill: sp(pc(p), 0.05 * o),
          tags: baseTags("modern-tech-mesh", ["decorative", "link"], "primary"),
        }));
      }
      return layers;
    },
  },
];

// ─── MINIMALIST (10) ────────────────────────────────────────────────────────

const minimalistAssets: AbstractAsset[] = [
  {
    id: "minimal-rule-set",
    label: "Rule Set",
    description: "3 horizontal lines of varying length, typographic rule style",
    aiDescription: "Three horizontal rules of different lengths stacked vertically in the top-left area. Creates a clean typographic grid reference for minimalist compositions.",
    tags: ["rules", "lines", "typographic"],
    category: "minimalist", type: "divider",
    style: ["clean", "editorial", "swiss"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkLine({ name: "Rule 1", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.1, p, "y"), w: scaled(W * 0.2, p, "size"), h: 1.5, fill: sp(pc(p), 0.3 * o), tags: baseTags("minimal-rule-set", ["decorative", "rule"], "primary") }),
        mkLine({ name: "Rule 2", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.14, p, "y"), w: scaled(W * 0.12, p, "size"), h: 1, fill: sp(pc(p), 0.2 * o), tags: baseTags("minimal-rule-set", ["decorative", "rule"], "primary") }),
        mkLine({ name: "Rule 3", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.18, p, "y"), w: scaled(W * 0.06, p, "size"), h: 0.8, fill: sp(pc(p), 0.12 * o), tags: baseTags("minimal-rule-set", ["decorative", "rule"], "primary") }),
      ];
    },
  },
  {
    id: "minimal-dot-float",
    label: "Floating Dot",
    description: "Single large circle, extremely subtle opacity",
    aiDescription: "One large circle placed off-center at very low opacity. A supremely minimal decorative touch that adds visual weight without demanding attention.",
    tags: ["circle", "single", "subtle"],
    category: "minimalist", type: "accent-mark",
    style: ["zen", "quiet", "restrained"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkEllipse({
        name: "Floating Dot", cx: scaled(W * 0.8, p, "x"), cy: scaled(H * 0.4, p, "y"),
        rx: scaled(W * 0.15, p, "size"), ry: scaled(W * 0.15, p, "size"),
        fill: sp(pc(p), 0.035 * o),
        tags: baseTags("minimal-dot-float", ["decorative", "dot"], "primary"),
      })];
    },
  },
  {
    id: "minimal-crosshair",
    label: "Crosshair Mark",
    description: "Registration mark style cross, precision aesthetic",
    aiDescription: "A small crosshair/registration mark in one corner using two perpendicular thin lines. Evokes precision printing and technical exactness.",
    tags: ["crosshair", "registration", "precision"],
    category: "minimalist", type: "accent-mark",
    style: ["technical", "precise", "print"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.92, p, "x"), cy = scaled(H * 0.08, p, "y");
      const sz = scaled(12, p, "size");
      return [
        mkLine({ name: "Cross H", x: cx - sz, y: cy, w: sz * 2, h: 0.8, fill: sp(pc(p), 0.2 * o), tags: baseTags("minimal-crosshair", ["decorative", "mark"], "primary") }),
        mkRect({ name: "Cross V", x: cx - 0.4, y: cy - sz, w: 0.8, h: sz * 2, fill: sp(pc(p), 0.2 * o), tags: baseTags("minimal-crosshair", ["decorative", "mark"], "primary") }),
      ];
    },
  },
  {
    id: "minimal-corner-mark",
    label: "Corner Mark",
    description: "Simple L-bracket in one corner only, architectural feel",
    aiDescription: "A single L-shaped bracket mark in the top-left corner. Evokes architectural blueprints and drafting precision with a clean, minimal aesthetic.",
    tags: ["bracket", "corner", "L-shape"],
    category: "minimalist", type: "frame-decoration",
    style: ["architectural", "drafting", "minimal"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const x0 = scaled(W * 0.05, p, "x"), y0 = scaled(H * 0.06, p, "y");
      const arm = scaled(20, p, "size");
      return [
        mkLine({ name: "Corner H", x: x0, y: y0, w: arm, h: 1.5, fill: sp(pc(p), 0.3 * o), tags: baseTags("minimal-corner-mark", ["decorative", "corner"], "primary") }),
        mkRect({ name: "Corner V", x: x0, y: y0, w: 1.5, h: arm, fill: sp(pc(p), 0.3 * o), tags: baseTags("minimal-corner-mark", ["decorative", "corner"], "primary") }),
      ];
    },
  },
  {
    id: "minimal-thin-frame",
    label: "Thin Frame",
    description: "Single hairline border with ample inner space",
    aiDescription: "A single very thin rectangular border inset from the card edges. Creates an elegant frame that defines the content area without visual clutter.",
    tags: ["frame", "border", "hairline"],
    category: "minimalist", type: "frame-decoration",
    style: ["elegant", "restrained", "classic"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const inset = scaled(14, p, "size");
      return [mkRect({
        name: "Thin Frame", x: inset + (p.xOffset ?? 0), y: inset + (p.yOffset ?? 0),
        w: W - inset * 2, h: H - inset * 2,
        stroke: sk(pc(p), 0.8, 0.2 * o),
        tags: baseTags("minimal-thin-frame", ["decorative", "border", "frame"], "primary"),
      })];
    },
  },
  {
    id: "minimal-wash",
    label: "Subtle Wash",
    description: "Ultra-light gradient covering 30% of one side",
    aiDescription: "A very subtle gradient wash covering the left 30% of the card from primary color at 3% opacity to transparent. Adds warmth without distraction.",
    tags: ["gradient", "wash", "subtle"],
    category: "minimalist", type: "gradient-wash",
    style: ["warm", "gentle", "ambient"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Subtle Wash", x: p.xOffset ?? 0, y: p.yOffset ?? 0, w: scaled(W * 0.35, p, "size"), h: H,
        fill: lg(0, [pc(p), 0, 0.03 * o], [pc(p), 1, 0]),
        tags: baseTags("minimal-wash", ["decorative", "background-gradient"], "primary"),
      })];
    },
  },
  {
    id: "minimal-line-accent",
    label: "Line Accent",
    description: "One bold horizontal rule, designer-grade placement",
    aiDescription: "A single strong horizontal line positioned at the visual golden ratio point of the card. A defining accent line used in professional editorial and Swiss-style design.",
    tags: ["line", "accent", "horizontal", "rule"],
    category: "minimalist", type: "divider",
    style: ["editorial", "bold", "swiss"],
    mood: ["light", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkLine({
        name: "Line Accent", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.618, p, "y"),
        w: scaled(W * 0.35, p, "size"), h: 2,
        fill: sp(pc(p), 0.35 * o),
        tags: baseTags("minimal-line-accent", ["decorative", "accent", "divider"], "primary"),
      })];
    },
  },
  {
    id: "minimal-margin-rules",
    label: "Margin Rules",
    description: "Two parallel lines defining a text column margin",
    aiDescription: "Two thin vertical parallel lines on the left side, mimicking a notebook margin. Establishes a strong left-aligned typographic structure.",
    tags: ["margin", "parallel", "vertical", "column"],
    category: "minimalist", type: "frame-decoration",
    style: ["notebook", "editorial", "structured"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const x1 = scaled(W * 0.065, p, "x"), x2 = scaled(W * 0.08, p, "x");
      return [
        mkRect({ name: "Margin Line 1", x: x1, y: scaled(H * 0.08, p, "y"), w: 0.8, h: scaled(H * 0.84, p, "size"), fill: sp(pc(p), 0.12 * o), tags: baseTags("minimal-margin-rules", ["decorative", "margin"], "primary") }),
        mkRect({ name: "Margin Line 2", x: x2, y: scaled(H * 0.08, p, "y"), w: 0.5, h: scaled(H * 0.84, p, "size"), fill: sp(pc(p), 0.06 * o), tags: baseTags("minimal-margin-rules", ["decorative", "margin"], "primary") }),
      ];
    },
  },
  {
    id: "minimal-serif-dot",
    label: "Serif Dot Column",
    description: "Three dots in a vertical column, typographic anchor",
    aiDescription: "Three small dots arranged vertically near the bottom-right corner. A subtle typographic device that creates a period/endpoint visual anchor.",
    tags: ["dots", "column", "vertical", "anchor"],
    category: "minimalist", type: "accent-mark",
    style: ["typographic", "editorial", "quiet"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const x = scaled(W * 0.92, p, "x"), baseY = scaled(H * 0.75, p, "y");
      const gap = scaled(10, p, "size"), r = scaled(2, p, "size");
      return [
        mkEllipse({ name: "Dot 1", cx: x, cy: baseY, rx: r, ry: r, fill: sp(pc(p), 0.3 * o), tags: baseTags("minimal-serif-dot", ["decorative", "dot"], "primary") }),
        mkEllipse({ name: "Dot 2", cx: x, cy: baseY + gap, rx: r, ry: r, fill: sp(pc(p), 0.2 * o), tags: baseTags("minimal-serif-dot", ["decorative", "dot"], "primary") }),
        mkEllipse({ name: "Dot 3", cx: x, cy: baseY + gap * 2, rx: r, ry: r, fill: sp(pc(p), 0.12 * o), tags: baseTags("minimal-serif-dot", ["decorative", "dot"], "primary") }),
      ];
    },
  },
  {
    id: "minimal-zero-noise",
    label: "Zero Noise",
    description: "Barely-there noise texture at 2% opacity over the full card",
    aiDescription: "A full-card noise/grain texture at extremely low opacity (2%). Adds tactile paper-like quality without any visible patterns.",
    tags: ["noise", "grain", "texture", "full-card"],
    category: "minimalist", type: "texture-overlay",
    style: ["tactile", "paper", "subtle"],
    mood: ["light", "muted"],
    customizable: { ...FULL_CUSTOM, scale: false, rotation: false, position: false },
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Zero Noise", x: 0, y: 0, w: W, h: H,
        fill: { kind: "pattern", patternType: "noise", color: hexToRGBA(pc(p)), scale: 1, rotation: 0, opacity: 0.02 * o, spacing: 4 },
        tags: baseTags("minimal-zero-noise", ["decorative", "texture", "noise"], "primary"),
      })];
    },
  },
];

// ─── VINTAGE (10) ───────────────────────────────────────────────────────────

const vintageAssets: AbstractAsset[] = [
  {
    id: "vintage-sunburst",
    label: "Art Deco Sunburst",
    description: "Radiating fan lines from bottom center, 1920s feel",
    aiDescription: "Thin radiating lines fanning upward from the bottom-center of the card. Evokes 1920s Art Deco glamour and theatrical spotlight effects.",
    tags: ["sunburst", "fan", "radial", "deco"],
    category: "vintage", type: "shape-cluster",
    style: ["deco", "glamour", "theatrical"],
    mood: ["metallic", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const rays = 12;
      for (let i = 0; i < rays; i++) {
        const angle = -Math.PI / 2 + (i / (rays - 1) - 0.5) * Math.PI * 0.6;
        const len = scaled(H * 0.6, p, "size");
        const cx = W / 2 + (p.xOffset ?? 0), cy = H + (p.yOffset ?? 0);
        const ex = cx + Math.cos(angle) * len;
        const ey = cy + Math.sin(angle) * len;
        layers.push(mkRect({
          name: `Ray ${i + 1}`, x: Math.min(cx, ex), y: Math.min(cy, ey),
          w: Math.max(Math.abs(ex - cx), 1), h: Math.max(Math.abs(ey - cy), 0.8),
          fill: sp(pc(p), (0.06 - i * 0.003) * o),
          tags: baseTags("vintage-sunburst", ["decorative", "ray"], "primary"),
        }));
      }
      return layers;
    },
  },
  {
    id: "vintage-badge-ring",
    label: "Badge Ring",
    description: "Double-stroke circle, classic badge/emblem style",
    aiDescription: "Two concentric circles in the center creating a classic badge or emblem ring. The outer ring is slightly thicker than the inner, with primary color at medium opacity.",
    tags: ["badge", "emblem", "ring", "circle"],
    category: "vintage", type: "frame-decoration",
    style: ["classic", "emblem", "formal"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.5, p, "x"), cy = scaled(H * 0.45, p, "y");
      const r1 = scaled(Math.min(W, H) * 0.15, p, "size");
      const r2 = r1 * 0.85;
      return [
        mkEllipse({ name: "Badge Outer", cx, cy, rx: r1, ry: r1, fill: sp("#000000", 0), tags: baseTags("vintage-badge-ring", ["decorative", "ring", "badge"], "primary"), opacity: o }),
        mkEllipse({ name: "Badge Inner", cx, cy, rx: r2, ry: r2, fill: sp("#000000", 0), tags: baseTags("vintage-badge-ring", ["decorative", "ring", "badge"], "secondary"), opacity: o }),
      ];
    },
  },
  {
    id: "vintage-stamp-ring",
    label: "Stamp Circle",
    description: "Outer circle + inner dashed circle, postal stamp style",
    aiDescription: "A postal stamp-style decoration with a solid outer circle and a smaller dashed inner circle. Positioned in the bottom-right corner, evoking official postal and seal aesthetics.",
    tags: ["stamp", "postal", "circle", "dashed"],
    category: "vintage", type: "accent-mark",
    style: ["postal", "official", "nostalgic"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.85, p, "x"), cy = scaled(H * 0.8, p, "y");
      const r = scaled(Math.min(W, H) * 0.1, p, "size");
      return [
        mkEllipse({ name: "Stamp Outer", cx, cy, rx: r, ry: r, fill: sp("#000000", 0), tags: baseTags("vintage-stamp-ring", ["decorative", "stamp"], "primary"), opacity: 0.15 * o }),
        mkEllipse({ name: "Stamp Inner", cx, cy, rx: r * 0.8, ry: r * 0.8, fill: sp("#000000", 0), tags: baseTags("vintage-stamp-ring", ["decorative", "stamp"], "primary"), opacity: 0.08 * o }),
      ];
    },
  },
  {
    id: "vintage-flourish",
    label: "Flourish Swirl",
    description: "Calligraphic swirl element for top area, elegant scrollwork",
    aiDescription: "An elegant calligraphic swirl curve in the top-right area using a path shape. Evokes hand-engraved scrollwork found on premium vintage stationery.",
    tags: ["swirl", "calligraphy", "scrollwork"],
    category: "vintage", type: "path-shape",
    style: ["ornamental", "calligraphic", "handcrafted"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({
        name: "Flourish Swirl",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.65, p, "x"), y: scaled(H * 0.08, p, "y") },
          { type: "L", x: scaled(W * 0.75, p, "x"), y: scaled(H * 0.04, p, "y") },
          { type: "L", x: scaled(W * 0.85, p, "x"), y: scaled(H * 0.1, p, "y") },
          { type: "L", x: scaled(W * 0.9, p, "x"), y: scaled(H * 0.06, p, "y") },
        ],
        fill: solidPaintHex(pc(p), 0.06 * o),
        closed: false,
        tags: baseTags("vintage-flourish", ["decorative", "ornament"], "primary"),
      })];
    },
  },
  {
    id: "vintage-banner-wave",
    label: "Banner Wave",
    description: "Ribbon-style banner path across mid-card",
    aiDescription: "A flowing ribbon/banner shape stretching across the middle of the card. The ribbon has subtle folds creating a vintage award banner or certificate feel.",
    tags: ["ribbon", "banner", "wave", "award"],
    category: "vintage", type: "path-shape",
    style: ["ceremonial", "award", "classic"],
    mood: ["metallic", "vibrant"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({
        name: "Banner Wave",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.1, p, "x"), y: scaled(H * 0.48, p, "y") },
          { type: "L", x: scaled(W * 0.3, p, "x"), y: scaled(H * 0.44, p, "y") },
          { type: "L", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.46, p, "y") },
          { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.42, p, "y") },
          { type: "L", x: scaled(W * 0.9, p, "x"), y: scaled(H * 0.45, p, "y") },
          { type: "L", x: scaled(W * 0.9, p, "x"), y: scaled(H * 0.52, p, "y") },
          { type: "L", x: scaled(W * 0.1, p, "x"), y: scaled(H * 0.55, p, "y") },
          { type: "Z" },
        ],
        fill: solidPaintHex(pc(p), 0.04 * o),
        closed: true,
        tags: baseTags("vintage-banner-wave", ["decorative", "banner"], "primary"),
      })];
    },
  },
  {
    id: "vintage-seal-ring",
    label: "Seal Ring",
    description: "Embossed-style circular seal outline, authority mark",
    aiDescription: "A single circular seal outline positioned center-top with a thick stroke and low fill. Suggests official authority and verified authenticity like a wax seal.",
    tags: ["seal", "circle", "authority", "official"],
    category: "vintage", type: "accent-mark",
    style: ["official", "authoritative", "trustworthy"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.5, p, "x"), cy = scaled(H * 0.2, p, "y");
      const r = scaled(Math.min(W, H) * 0.08, p, "size");
      return [mkEllipse({
        name: "Seal Ring", cx, cy, rx: r, ry: r,
        fill: sp(pc(p), 0.03 * o),
        tags: baseTags("vintage-seal-ring", ["decorative", "seal"], "primary"),
      })];
    },
  },
  {
    id: "vintage-hatching",
    label: "Crosshatch Fill",
    description: "Fine diagonal hatching, engraved print aesthetic",
    aiDescription: "A full-card diagonal crosshatch pattern at very low opacity. Simulates the fine line engraving found on banknotes, securities, and premium letterpress prints.",
    tags: ["hatching", "crosshatch", "engraving"],
    category: "vintage", type: "texture-overlay",
    style: ["engraved", "fine", "premium"],
    mood: ["muted", "metallic"],
    customizable: { ...FULL_CUSTOM, scale: false, position: false },
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Crosshatch", x: 0, y: 0, w: W, h: H,
        fill: { kind: "pattern", patternType: "crosshatch", color: hexToRGBA(pc(p)), scale: 1, rotation: 45, opacity: 0.04 * o, spacing: 16 },
        tags: baseTags("vintage-hatching", ["decorative", "texture", "pattern"], "primary"),
      })];
    },
  },
  {
    id: "vintage-ornamental-corner",
    label: "Ornamental Corners",
    description: "Four-corner filigree decoration set, stationery style",
    aiDescription: "Small decorative L-shaped corner marks in all four corners of the card. Each corner has two perpendicular lines creating a framing filigree effect common in luxury stationery.",
    tags: ["corners", "filigree", "ornament", "frame"],
    category: "vintage", type: "frame-decoration",
    style: ["ornamental", "stationery", "luxury"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const arm = scaled(18, p, "size"), th = 1.5;
      const inset = scaled(16, p, "size");
      const corners = [
        // TL
        { x: inset, y: inset, hW: arm, hH: th, vW: th, vH: arm },
        // TR
        { x: W - inset - arm, y: inset, hW: arm, hH: th, vW: th, vH: arm, vX: W - inset - th },
        // BL
        { x: inset, y: H - inset - th, hW: arm, hH: th, vW: th, vH: arm, vY: H - inset - arm },
        // BR
        { x: W - inset - arm, y: H - inset - th, hW: arm, hH: th, vW: th, vH: arm, vX: W - inset - th, vY: H - inset - arm },
      ];
      const layers: LayerV2[] = [];
      corners.forEach((c, i) => {
        layers.push(mkRect({
          name: `Ornament ${["TL", "TR", "BL", "BR"][i]} H`,
          x: c.x + (p.xOffset ?? 0), y: c.y + (p.yOffset ?? 0),
          w: c.hW, h: c.hH,
          fill: sp(i < 2 ? pc(p) : p.secondary, 0.35 * o),
          tags: baseTags("vintage-ornamental-corner", ["decorative", "corner", "ornament"], i < 2 ? "primary" : "secondary"),
        }));
        layers.push(mkRect({
          name: `Ornament ${["TL", "TR", "BL", "BR"][i]} V`,
          x: (c.vX ?? c.x) + (p.xOffset ?? 0), y: (c.vY ?? c.y) + (p.yOffset ?? 0),
          w: c.vW, h: c.vH,
          fill: sp(i < 2 ? pc(p) : p.secondary, 0.35 * o),
          tags: baseTags("vintage-ornamental-corner", ["decorative", "corner", "ornament"], i < 2 ? "primary" : "secondary"),
        }));
      });
      return layers;
    },
  },
  {
    id: "vintage-arrow-banner",
    label: "Arrow Banner",
    description: "Pointed directional ribbon, vintage badge element",
    aiDescription: "A small arrow-tipped banner/ribbon element positioned below the logo area. Commonly seen in vintage badges, craft labels, and artisan branding.",
    tags: ["arrow", "banner", "ribbon", "badge"],
    category: "vintage", type: "path-shape",
    style: ["artisan", "craft", "handmade"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2 + (p.xOffset ?? 0), cy = scaled(H * 0.55, p, "y");
      const bw = scaled(W * 0.25, p, "size"), bh = scaled(H * 0.06, p, "size");
      return [createPathLayerV2({
        name: "Arrow Banner",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: cx - bw / 2 - bh * 0.4, y: cy },
          { type: "L", x: cx - bw / 2, y: cy - bh / 2 },
          { type: "L", x: cx + bw / 2, y: cy - bh / 2 },
          { type: "L", x: cx + bw / 2 + bh * 0.4, y: cy },
          { type: "L", x: cx + bw / 2, y: cy + bh / 2 },
          { type: "L", x: cx - bw / 2, y: cy + bh / 2 },
          { type: "Z" },
        ],
        fill: solidPaintHex(pc(p), 0.05 * o),
        closed: true,
        tags: baseTags("vintage-arrow-banner", ["decorative", "banner"], "primary"),
      })];
    },
  },
  {
    id: "vintage-rope-frame",
    label: "Rope Frame",
    description: "Ornamental border with braided/rope texture path",
    aiDescription: "A double-line rectangular border evoking a twisted rope or braided cord. Common in nautical, rustic, and western-themed business cards.",
    tags: ["rope", "frame", "border", "braided"],
    category: "vintage", type: "frame-decoration",
    style: ["nautical", "rustic", "western"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const inset1 = scaled(10, p, "size"), inset2 = scaled(14, p, "size");
      return [
        mkRect({ name: "Rope Outer", x: inset1 + (p.xOffset ?? 0), y: inset1 + (p.yOffset ?? 0), w: W - inset1 * 2, h: H - inset1 * 2, stroke: sk(pc(p), 1.5, 0.2 * o), tags: baseTags("vintage-rope-frame", ["decorative", "border", "frame"], "primary") }),
        mkRect({ name: "Rope Inner", x: inset2 + (p.xOffset ?? 0), y: inset2 + (p.yOffset ?? 0), w: W - inset2 * 2, h: H - inset2 * 2, stroke: sk(pc(p), 0.8, 0.1 * o), tags: baseTags("vintage-rope-frame", ["decorative", "border", "frame"], "primary") }),
      ];
    },
  },
];

// ─── CORPORATE (10) ─────────────────────────────────────────────────────────

const corporateAssets: AbstractAsset[] = [
  {
    id: "corp-power-band",
    label: "Power Band",
    description: "Bold color band spanning full width, anchors composition",
    aiDescription: "A full-width horizontal color band across the top of the card using a primary-to-secondary gradient. Establishes strong corporate identity and visual hierarchy.",
    tags: ["band", "horizontal", "full-width"],
    category: "corporate", type: "gradient-wash",
    style: ["strong", "corporate", "anchored"],
    mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Power Band", x: p.xOffset ?? 0, y: p.yOffset ?? 0,
        w: W, h: scaled(H * 0.35, p, "size"),
        fill: lg(0, [pc(p), 0], [p.secondary, 1]),
        opacity: 0.9 * o,
        tags: baseTags("corp-power-band", ["decorative", "panel", "band"], "both"),
      })];
    },
  },
  {
    id: "corp-header-bar",
    label: "Header Bar",
    description: "Thin top bar + slightly taller accent cap, professional header",
    aiDescription: "Two stacked bars at the very top of the card: a thin 4px primary-color bar and a slightly taller 2px secondary bar below it. A clean corporate header treatment.",
    tags: ["header", "bar", "top", "stacked"],
    category: "corporate", type: "shape-cluster",
    style: ["clean", "professional", "corporate"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, o = p.opacity ?? 1;
      return [
        mkRect({ name: "Header Primary", x: p.xOffset ?? 0, y: p.yOffset ?? 0, w: W, h: scaled(4, p, "size"), fill: sp(pc(p), 0.9 * o), tags: baseTags("corp-header-bar", ["decorative", "accent", "bar"], "primary") }),
        mkRect({ name: "Header Secondary", x: p.xOffset ?? 0, y: scaled(4, p, "size") + (p.yOffset ?? 0), w: W, h: scaled(2, p, "size"), fill: sp(p.secondary, 0.5 * o), tags: baseTags("corp-header-bar", ["decorative", "accent", "bar"], "secondary") }),
      ];
    },
  },
  {
    id: "corp-block-accent",
    label: "Block Accent",
    description: "Solid color block anchored to one corner, structural element",
    aiDescription: "A solid rectangular block in the bottom-left corner taking up about 15% width and 40% height. Creates a strong structural anchor in the composition using primary color.",
    tags: ["block", "corner", "structural"],
    category: "corporate", type: "shape-cluster",
    style: ["structural", "bold", "anchored"],
    mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Block Accent", x: p.xOffset ?? 0, y: H * 0.6 + (p.yOffset ?? 0),
        w: scaled(W * 0.15, p, "size"), h: H * 0.4,
        fill: sp(pc(p), 0.08 * o),
        tags: baseTags("corp-block-accent", ["decorative", "block", "accent"], "primary"),
      })];
    },
  },
  {
    id: "corp-corner-bracket",
    label: "Corner Bracket",
    description: "Clean right-angle bracket in each corner, formal framing",
    aiDescription: "Four clean right-angle corner brackets framing the card content area. A formal, corporate framing device that defines boundaries without being ornamental.",
    tags: ["bracket", "corner", "frame", "formal"],
    category: "corporate", type: "frame-decoration",
    style: ["formal", "framed", "structured"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const arm = scaled(16, p, "size"), th = 1.2, inset = scaled(12, p, "size");
      const positions = [
        { x: inset, y: inset }, { x: W - inset - arm, y: inset },
        { x: inset, y: H - inset - th }, { x: W - inset - arm, y: H - inset - th },
      ];
      const layers: LayerV2[] = [];
      for (let i = 0; i < 4; i++) {
        const pos = positions[i];
        layers.push(mkRect({ name: `Bracket ${i + 1} H`, x: pos.x + (p.xOffset ?? 0), y: pos.y + (p.yOffset ?? 0), w: arm, h: th, fill: sp(pc(p), 0.25 * o), tags: baseTags("corp-corner-bracket", ["decorative", "corner", "bracket"], "primary") }));
        const vx = i % 2 === 0 ? pos.x : pos.x + arm - th;
        const vy = i < 2 ? pos.y : pos.y - arm + th;
        layers.push(mkRect({ name: `Bracket ${i + 1} V`, x: vx + (p.xOffset ?? 0), y: vy + (p.yOffset ?? 0), w: th, h: arm, fill: sp(pc(p), 0.25 * o), tags: baseTags("corp-corner-bracket", ["decorative", "corner", "bracket"], "primary") }));
      }
      return layers;
    },
  },
  {
    id: "corp-double-rule",
    label: "Double Rule",
    description: "Two parallel horizontal lines as section divider",
    aiDescription: "Two thin parallel horizontal lines acting as a divider in the middle area of the card. A classic corporate document separator used in letterheads and formal stationery.",
    tags: ["double", "rule", "divider", "parallel"],
    category: "corporate", type: "divider",
    style: ["formal", "clean", "traditional"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [
        mkLine({ name: "Double Rule 1", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.52, p, "y"), w: scaled(W * 0.84, p, "size"), h: 1.2, fill: sp(pc(p), 0.2 * o), tags: baseTags("corp-double-rule", ["decorative", "divider", "rule"], "primary") }),
        mkLine({ name: "Double Rule 2", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.535, p, "y"), w: scaled(W * 0.84, p, "size"), h: 0.6, fill: sp(pc(p), 0.1 * o), tags: baseTags("corp-double-rule", ["decorative", "divider", "rule"], "primary") }),
      ];
    },
  },
  {
    id: "corp-signature-line",
    label: "Signature Line",
    description: "Long single rule at bottom, documents-style",
    aiDescription: "A single long horizontal line near the bottom of the card spanning most of the width. Evokes official documents, letterheads, and signature lines.",
    tags: ["signature", "line", "bottom", "document"],
    category: "corporate", type: "divider",
    style: ["official", "document", "formal"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkLine({
        name: "Signature Line", x: scaled(W * 0.06, p, "x"), y: scaled(H * 0.9, p, "y"),
        w: scaled(W * 0.88, p, "size"), h: 1,
        fill: sp(pc(p), 0.15 * o),
        tags: baseTags("corp-signature-line", ["decorative", "divider", "line"], "primary"),
      })];
    },
  },
  {
    id: "corp-column-divider",
    label: "Column Divider",
    description: "Vertical rule splitting the card into two zones",
    aiDescription: "A vertical divider line splitting the card into two columns at approximately the 40% mark. Creates a clear two-zone layout common in corporate card designs.",
    tags: ["column", "vertical", "divider", "split"],
    category: "corporate", type: "divider",
    style: ["structured", "two-column", "editorial"],
    mood: ["muted", "light"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Column Divider", x: scaled(W * 0.4, p, "x"), y: scaled(H * 0.1, p, "y"),
        w: 1.2, h: scaled(H * 0.8, p, "size"),
        fill: sp(pc(p), 0.12 * o),
        tags: baseTags("corp-column-divider", ["decorative", "divider"], "primary"),
      })];
    },
  },
  {
    id: "corp-grid-rule",
    label: "Grid Rule",
    description: "Professional grid of light lines, structured feel",
    aiDescription: "A subtle grid of horizontal and vertical lines covering the card background. Creates a structured, professional feel reminiscent of graph paper and data sheets.",
    tags: ["grid", "lines", "structured", "professional"],
    category: "corporate", type: "texture-overlay",
    style: ["structured", "precise", "analytical"],
    mood: ["muted", "light"],
    customizable: { ...FULL_CUSTOM, rotation: false, position: false },
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Grid Rule", x: 0, y: 0, w: W, h: H,
        fill: { kind: "pattern", patternType: "grid", color: hexToRGBA(pc(p)), scale: 1, rotation: 0, opacity: 0.03 * o, spacing: 32 },
        tags: baseTags("corp-grid-rule", ["decorative", "texture", "grid"], "primary"),
      })];
    },
  },
  {
    id: "corp-formal-seal",
    label: "Formal Seal",
    description: "Circular stamp with ring, professional authority seal",
    aiDescription: "A subtle circular seal with a thick outer ring and lighter inner fill. Positioned in the bottom-right, suggesting official certification or corporate authority.",
    tags: ["seal", "stamp", "authority", "circular"],
    category: "corporate", type: "accent-mark",
    style: ["official", "authoritative", "certified"],
    mood: ["muted", "metallic"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.88, p, "x"), cy = scaled(H * 0.82, p, "y");
      const r = scaled(Math.min(W, H) * 0.07, p, "size");
      return [
        mkEllipse({ name: "Seal Outer", cx, cy, rx: r, ry: r, fill: sp(pc(p), 0.06 * o), tags: baseTags("corp-formal-seal", ["decorative", "seal"], "primary") }),
        mkEllipse({ name: "Seal Inner", cx, cy, rx: r * 0.7, ry: r * 0.7, fill: sp(pc(p), 0.03 * o), tags: baseTags("corp-formal-seal", ["decorative", "seal"], "primary") }),
      ];
    },
  },
  {
    id: "corp-arrow-strip",
    label: "Arrow Strip",
    description: "Directional chevron strip, progressive feel",
    aiDescription: "A horizontal strip of three chevron/arrow shapes pointing right, positioned in the bottom area. Conveys forward momentum, progress, and corporate dynamism.",
    tags: ["arrow", "chevron", "strip", "directional"],
    category: "corporate", type: "shape-cluster",
    style: ["dynamic", "progressive", "forward"],
    mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      for (let i = 0; i < 3; i++) {
        const x = scaled(W * (0.7 + i * 0.08), p, "x");
        const y = scaled(H * 0.88, p, "y");
        const sz = scaled(8, p, "size");
        layers.push(createPathLayerV2({
          name: `Chevron ${i + 1}`,
          x: 0, y: 0, width: W, height: H,
          commands: [
            { type: "M", x, y: y - sz },
            { type: "L", x: x + sz, y },
            { type: "L", x, y: y + sz },
          ],
          fill: solidPaintHex(pc(p), (0.2 - i * 0.05) * o),
          closed: false,
          tags: baseTags("corp-arrow-strip", ["decorative", "chevron"], "primary"),
        }));
      }
      return layers;
    },
  },
];

// ─── LUXURY (10) ────────────────────────────────────────────────────────────

const luxuryAssets: AbstractAsset[] = [
  {
    id: "luxury-gold-vine",
    label: "Gold Vine",
    description: "Delicate branching line drawing, precious metals feel",
    aiDescription: "A delicate branching vine/stem pattern flowing from the bottom-left corner upward. Uses primary color at low opacity to simulate gold leaf engraving on luxury stationery.",
    tags: ["vine", "branch", "gold", "engraving"],
    category: "luxury", type: "path-shape",
    style: ["organic", "precious", "handcrafted"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({
        name: "Gold Vine",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.05, p, "x"), y: scaled(H * 0.9, p, "y") },
          { type: "L", x: scaled(W * 0.1, p, "x"), y: scaled(H * 0.7, p, "y") },
          { type: "L", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.55, p, "y") },
          { type: "L", x: scaled(W * 0.12, p, "x"), y: scaled(H * 0.4, p, "y") },
          { type: "L", x: scaled(W * 0.15, p, "x"), y: scaled(H * 0.5, p, "y") },
        ],
        fill: solidPaintHex(pc(p), 0.06 * o),
        closed: false,
        tags: baseTags("luxury-gold-vine", ["decorative", "vine", "ornament"], "primary"),
      })];
    },
  },
  {
    id: "luxury-marble-vein",
    label: "Marble Vein",
    description: "Flowing diagonal path simulating marble veining",
    aiDescription: "A gentle diagonal flowing line path simulating natural marble veining across the card. Uses secondary color at very low opacity for a luxurious stone-like texture.",
    tags: ["marble", "vein", "stone", "flowing"],
    category: "luxury", type: "path-shape",
    style: ["natural", "stone", "elegant"],
    mood: ["light", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: false, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({
        name: "Marble Vein",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.1, p, "x"), y: scaled(H * 0.15, p, "y") },
          { type: "L", x: scaled(W * 0.3, p, "x"), y: scaled(H * 0.35, p, "y") },
          { type: "L", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.25, p, "y") },
          { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.55, p, "y") },
          { type: "L", x: scaled(W * 0.9, p, "x"), y: scaled(H * 0.45, p, "y") },
        ],
        fill: solidPaintHex(p.secondary, 0.04 * o),
        closed: false,
        tags: baseTags("luxury-marble-vein", ["decorative", "vein", "texture"], "secondary"),
      })];
    },
  },
  {
    id: "luxury-filigree-corner",
    label: "Filigree Corner",
    description: "Intricate corner ornament, high-end stationery feel",
    aiDescription: "An intricate filigree decoration composed of multiple small shapes in the top-right corner. Evokes the finest handmade stationery, wedding invitations, and luxury brands.",
    tags: ["filigree", "corner", "intricate", "ornament"],
    category: "luxury", type: "frame-decoration",
    style: ["intricate", "handcrafted", "premium"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const base = W * 0.85 + (p.xOffset ?? 0), ty = H * 0.05 + (p.yOffset ?? 0);
      const s = p.scale ?? 1;
      return [
        mkRect({ name: "Filigree H1", x: base, y: ty, w: 25 * s, h: 1.5, fill: sp(pc(p), 0.3 * o), tags: baseTags("luxury-filigree-corner", ["decorative", "corner", "filigree"], "primary") }),
        mkRect({ name: "Filigree V1", x: base + 25 * s - 1.5, y: ty, w: 1.5, h: 25 * s, fill: sp(pc(p), 0.3 * o), tags: baseTags("luxury-filigree-corner", ["decorative", "corner", "filigree"], "primary") }),
        mkEllipse({ name: "Filigree Dot", cx: base + 12 * s, cy: ty + 12 * s, rx: 3 * s, ry: 3 * s, fill: sp(p.secondary, 0.2 * o), tags: baseTags("luxury-filigree-corner", ["decorative", "filigree"], "secondary") }),
      ];
    },
  },
  {
    id: "luxury-embossed-border",
    label: "Embossed Border",
    description: "Double-stroke frame with inner shadow simulation",
    aiDescription: "A double-line rectangular border creating an embossed/raised effect. The outer line is stronger, inner line softer, simulating letterpress or blind embossing on premium paper stock.",
    tags: ["embossed", "border", "frame", "raised"],
    category: "luxury", type: "frame-decoration",
    style: ["embossed", "letterpress", "premium"],
    mood: ["metallic", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const i1 = scaled(12, p, "size"), i2 = scaled(18, p, "size");
      return [
        mkRect({ name: "Emboss Outer", x: i1, y: i1, w: W - i1 * 2, h: H - i1 * 2, stroke: sk(pc(p), 1.5, 0.25 * o), tags: baseTags("luxury-embossed-border", ["decorative", "border", "frame"], "primary") }),
        mkRect({ name: "Emboss Inner", x: i2, y: i2, w: W - i2 * 2, h: H - i2 * 2, stroke: sk(pc(p), 0.5, 0.1 * o), tags: baseTags("luxury-embossed-border", ["decorative", "border", "frame"], "primary") }),
      ];
    },
  },
  {
    id: "luxury-foil-shimmer",
    label: "Foil Shimmer",
    description: "Diagonal gradient strip simulating metallic foil",
    aiDescription: "A thin diagonal gradient strip running from top-left to bottom-right, simulating hot-stamped metallic foil catching light. Uses primary-to-secondary color gradient.",
    tags: ["foil", "shimmer", "metallic", "diagonal"],
    category: "luxury", type: "gradient-wash",
    style: ["metallic", "premium", "reflective"],
    mood: ["metallic", "vibrant"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Foil Shimmer", x: p.xOffset ?? 0, y: p.yOffset ?? 0,
        w: W, h: scaled(H * 0.03, p, "size"),
        fill: lg(0, [pc(p), 0, 0.15 * o], [p.secondary, 0.5, 0.25 * o], [pc(p), 1, 0.1 * o]),
        tags: baseTags("luxury-foil-shimmer", ["decorative", "foil", "accent"], "both"),
      })];
    },
  },
  {
    id: "luxury-pearl-grid",
    label: "Pearl Dot Grid",
    description: "Evenly spaced small dots in an ordered grid, pearl-like",
    aiDescription: "A grid of tiny evenly-spaced dots covering a portion of the card. Simulates a pearl or bead grid pattern found on luxury packaging and couture brand materials.",
    tags: ["pearls", "dots", "grid", "ordered"],
    category: "luxury", type: "texture-overlay",
    style: ["precious", "ordered", "couture"],
    mood: ["metallic", "light"],
    customizable: { ...FULL_CUSTOM, rotation: false },
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Pearl Grid", x: scaled(W * 0.6, p, "x"), y: scaled(H * 0.1, p, "y"),
        w: scaled(W * 0.35, p, "size"), h: scaled(H * 0.8, p, "size"),
        fill: { kind: "pattern", patternType: "dots", color: hexToRGBA(pc(p)), scale: 0.6, rotation: 0, opacity: 0.06 * o, spacing: 14 },
        tags: baseTags("luxury-pearl-grid", ["decorative", "texture", "dots"], "primary"),
      })];
    },
  },
  {
    id: "luxury-wax-seal",
    label: "Wax Seal Circle",
    description: "Circle with radial fill, stamped wax appearance",
    aiDescription: "A filled circle with a radial gradient simulating a traditional wax seal impression. Positioned center-bottom, conveying authenticity and ceremonial importance.",
    tags: ["wax", "seal", "circle", "stamp"],
    category: "luxury", type: "accent-mark",
    style: ["ceremonial", "authentic", "traditional"],
    mood: ["metallic", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.5, p, "x"), cy = scaled(H * 0.85, p, "y");
      const r = scaled(Math.min(W, H) * 0.06, p, "size");
      return [mkEllipse({
        name: "Wax Seal", cx, cy, rx: r, ry: r,
        fill: sp(pc(p), 0.08 * o),
        tags: baseTags("luxury-wax-seal", ["decorative", "seal"], "primary"),
      })];
    },
  },
  {
    id: "luxury-velvet-fold",
    label: "Velvet Fold",
    description: "Subtle shadow fold at card edge, tactile suggestion",
    aiDescription: "A very subtle vertical gradient strip at the left edge simulating a fabric fold or paper crease. Suggests tactile quality, as if the card were made of velvet or heavy cotton stock.",
    tags: ["fold", "shadow", "velvet", "tactile"],
    category: "luxury", type: "gradient-wash",
    style: ["tactile", "material", "premium"],
    mood: ["dark", "muted"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: false, secondary: false, background: true },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Velvet Fold", x: p.xOffset ?? 0, y: 0,
        w: scaled(W * 0.04, p, "size"), h: H,
        fill: lg(0, ["#000000", 0, 0.06 * o], ["#000000", 1, 0]),
        tags: baseTags("luxury-velvet-fold", ["decorative", "shadow"], "primary"),
      })];
    },
  },
  {
    id: "luxury-deco-arch",
    label: "Deco Arch",
    description: "Pointed arch framing the logo zone, cathedral-inspired",
    aiDescription: "A pointed arch shape framing the upper-center area of the card, inspired by Gothic cathedral arches. Creates an elegant visual frame for the logo/name area.",
    tags: ["arch", "deco", "gothic", "frame"],
    category: "luxury", type: "path-shape",
    style: ["architectural", "gothic", "majestic"],
    mood: ["metallic", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({
        name: "Deco Arch",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: scaled(W * 0.3, p, "x"), y: scaled(H * 0.5, p, "y") },
          { type: "L", x: scaled(W * 0.35, p, "x"), y: scaled(H * 0.15, p, "y") },
          { type: "L", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.05, p, "y") },
          { type: "L", x: scaled(W * 0.65, p, "x"), y: scaled(H * 0.15, p, "y") },
          { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.5, p, "y") },
        ],
        fill: solidPaintHex(pc(p), 0.04 * o),
        closed: false,
        tags: baseTags("luxury-deco-arch", ["decorative", "arch"], "primary"),
      })];
    },
  },
  {
    id: "luxury-crown-topper",
    label: "Crown Topper",
    description: "Stylized crown/crest above logo zone, regal authority",
    aiDescription: "A small stylized crown/crest shape positioned above the center-top of the card. Conveys royalty, premium quality, and distinguished brand authority.",
    tags: ["crown", "crest", "regal", "authority"],
    category: "luxury", type: "path-shape",
    style: ["regal", "royal", "distinguished"],
    mood: ["metallic", "dark"],
    customizable: FULL_CUSTOM,
    colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = W / 2 + (p.xOffset ?? 0), cy = scaled(H * 0.06, p, "y");
      const cw = scaled(30, p, "size"), ch = scaled(12, p, "size");
      return [createPathLayerV2({
        name: "Crown Topper",
        x: 0, y: 0, width: W, height: H,
        commands: [
          { type: "M", x: cx - cw, y: cy + ch },
          { type: "L", x: cx - cw * 0.6, y: cy },
          { type: "L", x: cx - cw * 0.2, y: cy + ch * 0.5 },
          { type: "L", x: cx, y: cy - ch * 0.3 },
          { type: "L", x: cx + cw * 0.2, y: cy + ch * 0.5 },
          { type: "L", x: cx + cw * 0.6, y: cy },
          { type: "L", x: cx + cw, y: cy + ch },
          { type: "Z" },
        ],
        fill: solidPaintHex(pc(p), 0.08 * o),
        closed: true,
        tags: baseTags("luxury-crown-topper", ["decorative", "crown", "crest"], "primary"),
      })];
    },
  },
];

// ─── ORGANIC (10) ───────────────────────────────────────────────────────────

const organicAssets: AbstractAsset[] = [
  {
    id: "organic-wave-form",
    label: "Wave Form",
    description: "Smooth undulating path as a divider, natural flow",
    aiDescription: "A gentle wave-shaped path flowing horizontally across the mid-section. Evokes natural water, sound waves, or gentle terrain — a calming organic divider.",
    tags: ["wave", "flowing", "divider", "natural"],
    category: "organic", type: "path-shape", style: ["flowing", "natural", "calm"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Wave Form", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: scaled(H * 0.5, p, "y") }, { type: "L", x: scaled(W * 0.2, p, "x"), y: scaled(H * 0.45, p, "y") },
        { type: "L", x: scaled(W * 0.4, p, "x"), y: scaled(H * 0.55, p, "y") }, { type: "L", x: scaled(W * 0.6, p, "x"), y: scaled(H * 0.42, p, "y") },
        { type: "L", x: scaled(W * 0.8, p, "x"), y: scaled(H * 0.52, p, "y") }, { type: "L", x: W, y: scaled(H * 0.48, p, "y") },
        { type: "L", x: W, y: H }, { type: "L", x: 0, y: H }, { type: "Z" },
      ], fill: solidPaintHex(pc(p), 0.03 * o), closed: true, tags: baseTags("organic-wave-form", ["decorative", "wave"], "primary") })];
    },
  },
  {
    id: "organic-leaf-silhouette",
    label: "Leaf Silhouette",
    description: "Botanical leaf path, clean and modern",
    aiDescription: "A single stylized leaf silhouette in the bottom-left corner. Clean botanical element that adds organic warmth to modern compositions.",
    tags: ["leaf", "botanical", "silhouette", "nature"],
    category: "organic", type: "path-shape", style: ["botanical", "modern", "clean"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Leaf Silhouette", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: scaled(W * 0.08, p, "x"), y: scaled(H * 0.9, p, "y") },
        { type: "L", x: scaled(W * 0.12, p, "x"), y: scaled(H * 0.7, p, "y") },
        { type: "L", x: scaled(W * 0.18, p, "x"), y: scaled(H * 0.65, p, "y") },
        { type: "L", x: scaled(W * 0.15, p, "x"), y: scaled(H * 0.75, p, "y") },
        { type: "L", x: scaled(W * 0.1, p, "x"), y: scaled(H * 0.85, p, "y") }, { type: "Z" },
      ], fill: solidPaintHex(pc(p), 0.05 * o), closed: true, tags: baseTags("organic-leaf-silhouette", ["decorative", "leaf", "botanical"], "primary") })];
    },
  },
  {
    id: "organic-flowing-curve",
    label: "Flowing Curve",
    description: "Single bezier curve sweeping across the card",
    aiDescription: "A single sweeping curve from bottom-left to upper-right, creating a natural flow line. Suggests organic movement, wind, or breath.",
    tags: ["curve", "sweep", "flowing", "organic"],
    category: "organic", type: "path-shape", style: ["flowing", "graceful", "dynamic"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Flowing Curve", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: scaled(H * 0.8, p, "y") },
        { type: "L", x: scaled(W * 0.3, p, "x"), y: scaled(H * 0.6, p, "y") },
        { type: "L", x: scaled(W * 0.6, p, "x"), y: scaled(H * 0.4, p, "y") },
        { type: "L", x: scaled(W * 0.9, p, "x"), y: scaled(H * 0.2, p, "y") },
        { type: "L", x: W, y: scaled(H * 0.15, p, "y") },
      ], fill: solidPaintHex(pc(p), 0.04 * o), closed: false, tags: baseTags("organic-flowing-curve", ["decorative", "curve"], "primary") })];
    },
  },
  {
    id: "organic-ripple-rings",
    label: "Ripple Rings",
    description: "3 concentric circles at increasing opacity, water ripple",
    aiDescription: "Three concentric circles expanding outward from a center point, mimicking water ripples or sound waves. Each ring increases in size and decreases in opacity.",
    tags: ["ripple", "rings", "concentric", "water"],
    category: "organic", type: "shape-cluster", style: ["zen", "calm", "expanding"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.75, p, "x"), cy = scaled(H * 0.4, p, "y");
      return [
        mkEllipse({ name: "Ripple 1", cx, cy, rx: scaled(W * 0.06, p, "size"), ry: scaled(W * 0.06, p, "size"), fill: sp(pc(p), 0.08 * o), tags: baseTags("organic-ripple-rings", ["decorative", "ring"], "primary") }),
        mkEllipse({ name: "Ripple 2", cx, cy, rx: scaled(W * 0.1, p, "size"), ry: scaled(W * 0.1, p, "size"), fill: sp(pc(p), 0.04 * o), tags: baseTags("organic-ripple-rings", ["decorative", "ring"], "primary") }),
        mkEllipse({ name: "Ripple 3", cx, cy, rx: scaled(W * 0.15, p, "size"), ry: scaled(W * 0.15, p, "size"), fill: sp(pc(p), 0.02 * o), tags: baseTags("organic-ripple-rings", ["decorative", "ring"], "primary") }),
      ];
    },
  },
  {
    id: "organic-terrain-line",
    label: "Terrain Line",
    description: "Contour-map style horizon line, topographic feel",
    aiDescription: "A gentle undulating line near the bottom of the card evoking topographic contour lines or a mountain horizon. Creates a grounded, earthy composition.",
    tags: ["terrain", "contour", "topographic", "horizon"],
    category: "organic", type: "path-shape", style: ["earthy", "grounded", "topographic"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Terrain Line", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: scaled(H * 0.75, p, "y") }, { type: "L", x: scaled(W * 0.15, p, "x"), y: scaled(H * 0.7, p, "y") },
        { type: "L", x: scaled(W * 0.35, p, "x"), y: scaled(H * 0.73, p, "y") }, { type: "L", x: scaled(W * 0.55, p, "x"), y: scaled(H * 0.68, p, "y") },
        { type: "L", x: scaled(W * 0.75, p, "x"), y: scaled(H * 0.72, p, "y") }, { type: "L", x: W, y: scaled(H * 0.7, p, "y") },
        { type: "L", x: W, y: H }, { type: "L", x: 0, y: H }, { type: "Z" },
      ], fill: solidPaintHex(pc(p), 0.025 * o), closed: true, tags: baseTags("organic-terrain-line", ["decorative", "terrain"], "primary") })];
    },
  },
  {
    id: "organic-petal-ring",
    label: "Petal Ring",
    description: "Circular arrangement of 6 petal shapes, floral ring",
    aiDescription: "Six petal-shaped ellipses arranged in a circular pattern like flower petals. A delicate floral accent for wellness, beauty, and nature-themed brands.",
    tags: ["petal", "flower", "ring", "floral"],
    category: "organic", type: "shape-cluster", style: ["floral", "delicate", "feminine"], mood: ["light", "vibrant"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.85, p, "x"), cy = scaled(H * 0.2, p, "y");
      const petals = 6, petalR = scaled(8, p, "size"), dist = scaled(14, p, "size");
      const layers: LayerV2[] = [];
      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2;
        layers.push(mkEllipse({
          name: `Petal ${i + 1}`, cx: cx + Math.cos(angle) * dist, cy: cy + Math.sin(angle) * dist,
          rx: petalR, ry: petalR * 0.6,
          fill: sp(pc(p), (0.06 - i * 0.005) * o),
          tags: baseTags("organic-petal-ring", ["decorative", "petal", "floral"], "primary"),
        }));
      }
      return layers;
    },
  },
  {
    id: "organic-cloud-form",
    label: "Cloud Form",
    description: "Rounded cloud-like shape for soft compositions",
    aiDescription: "A soft, rounded cloud-like cluster of overlapping circles creating an airy, dreamy background element. Perfect for gentle, approachable brand identities.",
    tags: ["cloud", "soft", "rounded", "airy"],
    category: "organic", type: "shape-cluster", style: ["soft", "dreamy", "gentle"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const baseX = scaled(W * 0.7, p, "x"), baseY = scaled(H * 0.15, p, "y");
      return [
        mkEllipse({ name: "Cloud 1", cx: baseX, cy: baseY, rx: scaled(W * 0.08, p, "size"), ry: scaled(H * 0.08, p, "size"), fill: sp(pc(p), 0.03 * o), tags: baseTags("organic-cloud-form", ["decorative", "cloud"], "primary") }),
        mkEllipse({ name: "Cloud 2", cx: baseX + W * 0.06, cy: baseY - H * 0.02, rx: scaled(W * 0.06, p, "size"), ry: scaled(H * 0.06, p, "size"), fill: sp(pc(p), 0.025 * o), tags: baseTags("organic-cloud-form", ["decorative", "cloud"], "primary") }),
        mkEllipse({ name: "Cloud 3", cx: baseX + W * 0.1, cy: baseY + H * 0.01, rx: scaled(W * 0.05, p, "size"), ry: scaled(H * 0.05, p, "size"), fill: sp(pc(p), 0.02 * o), tags: baseTags("organic-cloud-form", ["decorative", "cloud"], "primary") }),
      ];
    },
  },
  {
    id: "organic-moss-texture",
    label: "Moss Texture",
    description: "Organic noise cluster with low opacity, natural feel",
    aiDescription: "A noise/grain texture confined to a circular region, simulating organic moss or lichen growth. Adds a natural, lived-in texture to the design.",
    tags: ["moss", "noise", "organic", "texture"],
    category: "organic", type: "texture-overlay", style: ["natural", "textured", "earthy"], mood: ["muted", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkEllipse({
        name: "Moss Texture", cx: scaled(W * 0.15, p, "x"), cy: scaled(H * 0.8, p, "y"),
        rx: scaled(W * 0.12, p, "size"), ry: scaled(W * 0.12, p, "size"),
        fill: sp(pc(p), 0.03 * o),
        tags: baseTags("organic-moss-texture", ["decorative", "texture", "organic"], "primary"),
      })];
    },
  },
  {
    id: "organic-stem-arch",
    label: "Stem Arch",
    description: "Graceful arching stem from one corner, botanical sweep",
    aiDescription: "A graceful arching stem/branch path sweeping from the bottom-left corner upward across the card. Adds elegant botanical movement to the composition.",
    tags: ["stem", "arch", "botanical", "sweep"],
    category: "organic", type: "path-shape", style: ["botanical", "graceful", "sweeping"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Stem Arch", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: scaled(H * 0.95, p, "y") },
        { type: "L", x: scaled(W * 0.15, p, "x"), y: scaled(H * 0.7, p, "y") },
        { type: "L", x: scaled(W * 0.35, p, "x"), y: scaled(H * 0.45, p, "y") },
        { type: "L", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.35, p, "y") },
      ], fill: solidPaintHex(pc(p), 0.04 * o), closed: false, tags: baseTags("organic-stem-arch", ["decorative", "stem", "botanical"], "primary") })];
    },
  },
  {
    id: "organic-botanical-branch",
    label: "Botanical Branch",
    description: "Branching stem with minimal leaf nodes, elegant botany",
    aiDescription: "A branching stem with small leaf-like nodes growing from the side. An elegant botanical illustration element for nature, wellness, and eco brands.",
    tags: ["branch", "stem", "leaves", "botanical"],
    category: "organic", type: "shape-cluster", style: ["botanical", "illustrated", "natural"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const x0 = scaled(W * 0.9, p, "x"), y0 = scaled(H * 0.1, p, "y");
      return [
        mkRect({ name: "Stem", x: x0, y: y0, w: 1, h: scaled(H * 0.4, p, "size"), fill: sp(pc(p), 0.1 * o), tags: baseTags("organic-botanical-branch", ["decorative", "stem"], "primary") }),
        mkEllipse({ name: "Leaf 1", cx: x0 - 6, cy: y0 + H * 0.1, rx: scaled(5, p, "size"), ry: scaled(3, p, "size"), fill: sp(p.secondary, 0.06 * o), tags: baseTags("organic-botanical-branch", ["decorative", "leaf"], "secondary") }),
        mkEllipse({ name: "Leaf 2", cx: x0 + 6, cy: y0 + H * 0.2, rx: scaled(4, p, "size"), ry: scaled(2.5, p, "size"), fill: sp(p.secondary, 0.05 * o), tags: baseTags("organic-botanical-branch", ["decorative", "leaf"], "secondary") }),
        mkEllipse({ name: "Leaf 3", cx: x0 - 5, cy: y0 + H * 0.3, rx: scaled(3.5, p, "size"), ry: scaled(2, p, "size"), fill: sp(p.secondary, 0.04 * o), tags: baseTags("organic-botanical-branch", ["decorative", "leaf"], "secondary") }),
      ];
    },
  },
];

// ─── TECH (10) ──────────────────────────────────────────────────────────────

const techAssets: AbstractAsset[] = [
  {
    id: "tech-circuit-node",
    label: "Circuit Node",
    description: "PCB-style path with node dots, electronic circuit trace",
    aiDescription: "A path resembling a PCB (printed circuit board) trace with circular connection nodes. Perfect for tech companies, startups, and electronics brands.",
    tags: ["circuit", "pcb", "nodes", "electronic"],
    category: "tech", type: "shape-cluster", style: ["electronic", "technical", "precise"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const points = [[0.7, 0.15], [0.78, 0.15], [0.78, 0.3], [0.85, 0.3], [0.85, 0.45]];
      const layers: LayerV2[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const [x1, y1] = points[i], [x2, y2] = points[i + 1];
        layers.push(mkRect({ name: `Trace ${i + 1}`, x: scaled(Math.min(x1, x2) * W, p, "x"), y: scaled(Math.min(y1, y2) * H, p, "y"), w: Math.max(Math.abs(x2 - x1) * W, 1.5), h: Math.max(Math.abs(y2 - y1) * H, 1.5), fill: sp(pc(p), 0.12 * o), tags: baseTags("tech-circuit-node", ["decorative", "trace"], "primary") }));
      }
      for (const [nx, ny] of points) {
        layers.push(mkEllipse({ name: `Node`, cx: scaled(nx * W, p, "x"), cy: scaled(ny * H, p, "y"), rx: scaled(3, p, "size"), ry: scaled(3, p, "size"), fill: sp(pc(p), 0.2 * o), tags: baseTags("tech-circuit-node", ["decorative", "node"], "primary") }));
      }
      return layers;
    },
  },
  {
    id: "tech-scanlines",
    label: "Scan Lines",
    description: "Evenly spaced horizontal lines, CRT monitor feel",
    aiDescription: "A full-card overlay of evenly-spaced horizontal scan lines at very low opacity. Evokes CRT monitors, retro computing, and cyberpunk aesthetics.",
    tags: ["scanlines", "crt", "horizontal", "retro"],
    category: "tech", type: "texture-overlay", style: ["retro", "crt", "cyberpunk"], mood: ["dark", "muted"],
    customizable: { ...FULL_CUSTOM, rotation: false, position: false }, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Scan Lines", x: 0, y: 0, w: W, h: H, fill: { kind: "pattern", patternType: "lines", color: hexToRGBA(pc(p)), scale: 1, rotation: 0, opacity: 0.03 * o, spacing: 3 }, tags: baseTags("tech-scanlines", ["decorative", "texture", "scanlines"], "primary") })];
    },
  },
  {
    id: "tech-data-grid",
    label: "Data Grid",
    description: "Precise orthogonal grid, spreadsheet aesthetic",
    aiDescription: "A clean orthogonal grid overlay in one section of the card. Creates a data-sheet, spreadsheet, or analytical visualization background.",
    tags: ["grid", "data", "orthogonal", "spreadsheet"],
    category: "tech", type: "texture-overlay", style: ["analytical", "precise", "data"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Data Grid", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.1, p, "y"), w: scaled(W * 0.45, p, "size"), h: scaled(H * 0.8, p, "size"), fill: { kind: "pattern", patternType: "grid", color: hexToRGBA(pc(p)), scale: 0.8, rotation: 0, opacity: 0.04 * o, spacing: 20 }, tags: baseTags("tech-data-grid", ["decorative", "texture", "grid"], "primary") })];
    },
  },
  {
    id: "tech-frequency-bar",
    label: "Frequency Bar",
    description: "Vertical bars of varying heights, audio visualizer",
    aiDescription: "Vertical bars of varying heights arranged in a row, resembling an audio frequency visualizer or equalizer. Perfect for music, audio, and media brands.",
    tags: ["frequency", "bars", "audio", "equalizer"],
    category: "tech", type: "shape-cluster", style: ["audio", "dynamic", "rhythmic"], mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const bars = [0.3, 0.5, 0.8, 0.6, 0.9, 0.4, 0.7, 0.5, 0.3];
      const bw = scaled(4, p, "size"), gap = scaled(3, p, "size");
      const startX = scaled(W * 0.7, p, "x"), baseY = scaled(H * 0.9, p, "y");
      return bars.map((h, i) => mkRect({
        name: `Bar ${i + 1}`, x: startX + i * (bw + gap), y: baseY - scaled(H * 0.15 * h, p, "size"),
        w: bw, h: scaled(H * 0.15 * h, p, "size"),
        fill: sp(i % 2 === 0 ? pc(p) : p.secondary, (0.15 - i * 0.01) * o),
        tags: baseTags("tech-frequency-bar", ["decorative", "bar"], i % 2 === 0 ? "primary" : "secondary"),
      }));
    },
  },
  {
    id: "tech-satellite-ring",
    label: "Satellite Ring",
    description: "Elliptical orbit path with node points, space tech feel",
    aiDescription: "An elliptical orbit ring with small satellite node points placed along it. Evokes space technology, satellite networks, and orbital mechanics.",
    tags: ["orbit", "satellite", "ring", "space"],
    category: "tech", type: "shape-cluster", style: ["space", "orbital", "futuristic"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.8, p, "x"), cy = scaled(H * 0.35, p, "y");
      const rx = scaled(W * 0.12, p, "size"), ry = scaled(H * 0.2, p, "size");
      const layers: LayerV2[] = [
        mkEllipse({ name: "Orbit Ring", cx, cy, rx, ry, fill: sp("#000000", 0), tags: baseTags("tech-satellite-ring", ["decorative", "orbit"], "primary"), opacity: 0.1 * o }),
      ];
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI * 2;
        layers.push(mkEllipse({ name: `Satellite ${i + 1}`, cx: cx + Math.cos(angle) * rx, cy: cy + Math.sin(angle) * ry, rx: scaled(2.5, p, "size"), ry: scaled(2.5, p, "size"), fill: sp(i === 0 ? pc(p) : p.secondary, 0.25 * o), tags: baseTags("tech-satellite-ring", ["decorative", "satellite"], i === 0 ? "primary" : "secondary") }));
      }
      return layers;
    },
  },
  {
    id: "tech-ping-pulse",
    label: "Ping Pulse",
    description: "Concentric expanding rings from center point, radar pulse",
    aiDescription: "Concentric expanding rings emanating from a single point, like a radar ping or sonar pulse. Creates a radiating signal/broadcast effect.",
    tags: ["ping", "pulse", "radar", "signal"],
    category: "tech", type: "shape-cluster", style: ["radar", "signal", "broadcast"], mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.12, p, "x"), cy = scaled(H * 0.15, p, "y");
      return [
        mkEllipse({ name: "Ping Core", cx, cy, rx: scaled(3, p, "size"), ry: scaled(3, p, "size"), fill: sp(pc(p), 0.3 * o), tags: baseTags("tech-ping-pulse", ["decorative", "pulse"], "primary") }),
        mkEllipse({ name: "Ping Wave 1", cx, cy, rx: scaled(W * 0.04, p, "size"), ry: scaled(W * 0.04, p, "size"), fill: sp(pc(p), 0.08 * o), tags: baseTags("tech-ping-pulse", ["decorative", "pulse"], "primary") }),
        mkEllipse({ name: "Ping Wave 2", cx, cy, rx: scaled(W * 0.08, p, "size"), ry: scaled(W * 0.08, p, "size"), fill: sp(pc(p), 0.04 * o), tags: baseTags("tech-ping-pulse", ["decorative", "pulse"], "primary") }),
        mkEllipse({ name: "Ping Wave 3", cx, cy, rx: scaled(W * 0.13, p, "size"), ry: scaled(W * 0.13, p, "size"), fill: sp(pc(p), 0.02 * o), tags: baseTags("tech-ping-pulse", ["decorative", "pulse"], "primary") }),
      ];
    },
  },
  {
    id: "tech-matrix-dot",
    label: "Matrix Dots",
    description: "Dense grid of small dots, code rain static feel",
    aiDescription: "A dense grid of small dots in the right portion of the card. Simulates a matrix/LED display or code rain effect at very low opacity.",
    tags: ["matrix", "dots", "dense", "led"],
    category: "tech", type: "texture-overlay", style: ["digital", "matrix", "code"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Matrix Dots", x: scaled(W * 0.55, p, "x"), y: 0, w: scaled(W * 0.45, p, "size"), h: H, fill: { kind: "pattern", patternType: "dots", color: hexToRGBA(pc(p)), scale: 0.5, rotation: 0, opacity: 0.04 * o, spacing: 8 }, tags: baseTags("tech-matrix-dot", ["decorative", "texture", "dots"], "primary") })];
    },
  },
  {
    id: "tech-wireframe-sphere",
    label: "Wireframe Sphere",
    description: "Latitude/longitude arc sphere outline, 3D wireframe",
    aiDescription: "A wireframe sphere drawn with latitude and longitude arcs. Suggests global connectivity, 3D modeling, and technological precision.",
    tags: ["wireframe", "sphere", "3d", "globe"],
    category: "tech", type: "shape-cluster", style: ["3d", "global", "wireframe"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.82, p, "x"), cy = scaled(H * 0.35, p, "y");
      const r = scaled(Math.min(W, H) * 0.12, p, "size");
      return [
        mkEllipse({ name: "Sphere Outer", cx, cy, rx: r, ry: r, fill: sp("#000000", 0), tags: baseTags("tech-wireframe-sphere", ["decorative", "wireframe"], "primary"), opacity: 0.08 * o }),
        mkEllipse({ name: "Sphere Mid H", cx, cy, rx: r * 0.7, ry: r, fill: sp("#000000", 0), tags: baseTags("tech-wireframe-sphere", ["decorative", "wireframe"], "primary"), opacity: 0.05 * o }),
        mkEllipse({ name: "Sphere Mid V", cx, cy, rx: r, ry: r * 0.7, fill: sp("#000000", 0), tags: baseTags("tech-wireframe-sphere", ["decorative", "wireframe"], "primary"), opacity: 0.05 * o }),
      ];
    },
  },
  {
    id: "tech-binary-fade",
    label: "Binary Fade",
    description: "Fading gradient of pixel dots, data stream feel",
    aiDescription: "A grid of dots that fades from dense to sparse, simulating a data stream or binary data transfer visualization. Creates a digital-dissolve effect.",
    tags: ["binary", "fade", "data", "stream"],
    category: "tech", type: "shape-cluster", style: ["data", "digital", "streaming"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < 8 - row; col++) {
          layers.push(mkEllipse({
            name: `Bit ${row}-${col}`,
            cx: scaled(W * (0.6 + col * 0.04), p, "x"), cy: scaled(H * (0.15 + row * 0.08), p, "y"),
            rx: scaled(1.5, p, "size"), ry: scaled(1.5, p, "size"),
            fill: sp(pc(p), (0.15 - row * 0.025) * o),
            tags: baseTags("tech-binary-fade", ["decorative", "bit"], "primary"),
          }));
        }
      }
      return layers;
    },
  },
  {
    id: "tech-code-rain",
    label: "Code Rain",
    description: "Vertical columns of marks, Matrix-style code rain",
    aiDescription: "Vertical columns of small rectangular marks falling down the right edge of the card. Simulates the iconic 'code rain' effect from digital/hacker culture.",
    tags: ["code", "rain", "vertical", "matrix"],
    category: "tech", type: "shape-cluster", style: ["hacker", "digital", "matrix"], mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const cols = 5;
      for (let c = 0; c < cols; c++) {
        const x = scaled(W * (0.82 + c * 0.035), p, "x");
        const marks = 4 + Math.floor(c * 1.5);
        for (let m = 0; m < marks; m++) {
          layers.push(mkRect({
            name: `Code ${c}-${m}`, x, y: scaled(H * (0.05 + m * 0.08 + c * 0.03), p, "y"),
            w: scaled(3, p, "size"), h: scaled(5 + m, p, "size"),
            fill: sp(pc(p), (0.12 - m * 0.015) * o),
            tags: baseTags("tech-code-rain", ["decorative", "code"], "primary"),
          }));
        }
      }
      return layers;
    },
  },
];

// ─── BOLD (10) ──────────────────────────────────────────────────────────────

const boldAssets: AbstractAsset[] = [
  {
    id: "bold-color-block",
    label: "Color Block",
    description: "Full half-card solid color block, maximum impact",
    aiDescription: "A solid color block covering the left half of the card with a primary-to-secondary gradient. Creates maximum visual impact with a strong color field.",
    tags: ["block", "half", "solid", "impact"],
    category: "bold", type: "gradient-wash", style: ["impact", "strong", "decisive"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Color Block", x: p.xOffset ?? 0, y: p.yOffset ?? 0, w: scaled(W * 0.45, p, "size"), h: H, fill: lg(180, [pc(p), 0], [p.secondary, 0.6, 0.85], [pc(p), 1, 0.7]), opacity: 0.9 * o, tags: baseTags("bold-color-block", ["decorative", "panel", "block"], "both") })];
    },
  },
  {
    id: "bold-impact-stripe",
    label: "Impact Stripe",
    description: "Oversized diagonal stripe crossing the whole card",
    aiDescription: "A wide diagonal stripe crossing the entire card from top-left to bottom-right. A bold, high-impact design element that demands attention.",
    tags: ["stripe", "diagonal", "wide", "crossing"],
    category: "bold", type: "path-shape", style: ["dynamic", "crossing", "energetic"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Impact Stripe", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: scaled(W * 0.2, p, "x"), y: 0 }, { type: "L", x: scaled(W * 0.4, p, "x"), y: 0 },
        { type: "L", x: scaled(W * 0.8, p, "x"), y: H }, { type: "L", x: scaled(W * 0.6, p, "x"), y: H }, { type: "Z" },
      ], fill: lg(135, [pc(p), 0, 0.1 * o], [p.secondary, 1, 0.06 * o]), closed: true, tags: baseTags("bold-impact-stripe", ["decorative", "stripe"], "both") })];
    },
  },
  {
    id: "bold-burst-star",
    label: "Burst Star",
    description: "Starburst/sun ray emanation from one corner",
    aiDescription: "Radiating triangular rays emanating from the top-right corner like a starburst or sunburst. Creates explosive energy and dynamic visual tension.",
    tags: ["starburst", "rays", "corner", "explosive"],
    category: "bold", type: "shape-cluster", style: ["explosive", "energetic", "dramatic"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const layers: LayerV2[] = [];
      const rays = 8;
      for (let i = 0; i < rays; i++) {
        const angle = (i / rays) * Math.PI / 2 + Math.PI;
        const len = scaled(W * 0.3, p, "size");
        const cx = W + (p.xOffset ?? 0), cy = p.yOffset ?? 0;
        layers.push(createPathLayerV2({ name: `Ray ${i + 1}`, x: 0, y: 0, width: W, height: H, commands: [
          { type: "M", x: cx, y: cy },
          { type: "L", x: cx + Math.cos(angle - 0.05) * len, y: cy + Math.sin(angle - 0.05) * len },
          { type: "L", x: cx + Math.cos(angle + 0.05) * len, y: cy + Math.sin(angle + 0.05) * len }, { type: "Z" },
        ], fill: solidPaintHex(pc(p), (0.06 - i * 0.005) * o), closed: true, tags: baseTags("bold-burst-star", ["decorative", "ray"], "primary") }));
      }
      return layers;
    },
  },
  {
    id: "bold-mega-dot",
    label: "Mega Dot",
    description: "Single enormous circle, mostly off-canvas, dramatic crop",
    aiDescription: "A massive circle mostly extending beyond the card edge, creating a dramatic cropped geometric element. Only about 25% of the circle is visible.",
    tags: ["circle", "mega", "cropped", "dramatic"],
    category: "bold", type: "accent-mark", style: ["dramatic", "cropped", "oversized"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const r = scaled(W * 0.4, p, "size");
      return [mkEllipse({ name: "Mega Dot", cx: W + r * 0.4 + (p.xOffset ?? 0), cy: H * 0.5 + (p.yOffset ?? 0), rx: r, ry: r, fill: sp(pc(p), 0.06 * o), tags: baseTags("bold-mega-dot", ["decorative", "circle"], "primary") })];
    },
  },
  {
    id: "bold-contrast-split",
    label: "Contrast Split",
    description: "Clean straight line dividing the card in two tonal zones",
    aiDescription: "A clean vertical dividing line with contrasting fills on each side, splitting the card into two distinct tonal zones for maximum contrast.",
    tags: ["split", "contrast", "vertical", "dual-tone"],
    category: "bold", type: "shape-cluster", style: ["contrasting", "dual", "decisive"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const splitX = scaled(W * 0.42, p, "x");
      return [
        mkRect({ name: "Left Zone", x: p.xOffset ?? 0, y: 0, w: splitX, h: H, fill: sp(pc(p), 0.04 * o), tags: baseTags("bold-contrast-split", ["decorative", "zone"], "primary") }),
        mkRect({ name: "Split Line", x: splitX, y: 0, w: 2, h: H, fill: sp(p.secondary, 0.15 * o), tags: baseTags("bold-contrast-split", ["decorative", "divider"], "secondary") }),
      ];
    },
  },
  {
    id: "bold-frame-crop",
    label: "Frame Crop",
    description: "Bold thick-border frame that crops the design",
    aiDescription: "A thick, bold rectangular border frame with substantial width. Creates a strong visual boundary that crops and contains the design elements.",
    tags: ["frame", "thick", "border", "crop"],
    category: "bold", type: "frame-decoration", style: ["framed", "contained", "gallery"], mood: ["dark", "vibrant"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Bold Frame", x: scaled(8, p, "size") + (p.xOffset ?? 0), y: scaled(8, p, "size") + (p.yOffset ?? 0), w: W - scaled(16, p, "size"), h: H - scaled(16, p, "size"), stroke: sk(pc(p), scaled(3, p, "size"), 0.2 * o), tags: baseTags("bold-frame-crop", ["decorative", "border", "frame"], "primary") })];
    },
  },
  {
    id: "bold-power-diagonal",
    label: "Power Diagonal",
    description: "Full diagonal band from corner to corner, maximum energy",
    aiDescription: "A strong diagonal band stretching from the top-left to the bottom-right corner. The most energetic and dynamic composition element, conveying unstoppable momentum.",
    tags: ["diagonal", "band", "full", "power"],
    category: "bold", type: "path-shape", style: ["maximum", "power", "unstoppable"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const bw = scaled(W * 0.08, p, "size");
      return [createPathLayerV2({ name: "Power Diagonal", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: 0 }, { type: "L", x: bw, y: 0 }, { type: "L", x: W, y: H - bw },
        { type: "L", x: W, y: H }, { type: "L", x: W - bw, y: H }, { type: "L", x: 0, y: bw }, { type: "Z" },
      ], fill: lg(135, [pc(p), 0, 0.08 * o], [p.secondary, 1, 0.05 * o]), closed: true, tags: baseTags("bold-power-diagonal", ["decorative", "diagonal", "band"], "both") })];
    },
  },
  {
    id: "bold-color-flood",
    label: "Color Flood",
    description: "Gradient flooding from bottom-left corner, rising color",
    aiDescription: "A gradient color wash flooding upward from the bottom-left corner, covering about 40% of the card area. Suggests rising energy and growing intensity.",
    tags: ["flood", "gradient", "corner", "rising"],
    category: "bold", type: "gradient-wash", style: ["rising", "growing", "intense"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Color Flood", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: 0, y: H * 0.5 }, { type: "L", x: W * 0.6, y: H },
        { type: "L", x: 0, y: H }, { type: "Z" },
      ], fill: lg(135, [pc(p), 0, 0.1 * o], [p.secondary, 1, 0.06 * o]), closed: true, tags: baseTags("bold-color-flood", ["decorative", "flood"], "both") })];
    },
  },
  {
    id: "bold-splash-cut",
    label: "Splash Cut",
    description: "Irregular polygon cut through the composition",
    aiDescription: "An irregular angular polygon shape cutting through the center of the composition. Creates a dynamic, disrupted energy perfect for creative and entertainment brands.",
    tags: ["splash", "irregular", "polygon", "cut"],
    category: "bold", type: "path-shape", style: ["disruptive", "creative", "edgy"], mood: ["vibrant", "dark"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [createPathLayerV2({ name: "Splash Cut", x: 0, y: 0, width: W, height: H, commands: [
        { type: "M", x: scaled(W * 0.3, p, "x"), y: scaled(H * 0.2, p, "y") },
        { type: "L", x: scaled(W * 0.5, p, "x"), y: scaled(H * 0.15, p, "y") },
        { type: "L", x: scaled(W * 0.7, p, "x"), y: scaled(H * 0.35, p, "y") },
        { type: "L", x: scaled(W * 0.65, p, "x"), y: scaled(H * 0.55, p, "y") },
        { type: "L", x: scaled(W * 0.4, p, "x"), y: scaled(H * 0.5, p, "y") }, { type: "Z" },
      ], fill: solidPaintHex(pc(p), 0.05 * o), closed: true, tags: baseTags("bold-splash-cut", ["decorative", "splash"], "primary") })];
    },
  },
  {
    id: "bold-oversized-glyph",
    label: "Oversized Glyph",
    description: "Massive ampersand or symbol as background element",
    aiDescription: "A very large decorative ampersand/symbol shape used as a background watermark element at extremely low opacity. Adds typographic character without interfering with content.",
    tags: ["glyph", "symbol", "oversized", "watermark"],
    category: "bold", type: "accent-mark", style: ["typographic", "watermark", "oversized"], mood: ["dark", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({
        name: "Oversized Glyph", x: scaled(W * 0.3, p, "x"), y: scaled(-H * 0.1, p, "y"),
        w: scaled(W * 0.5, p, "size"), h: scaled(H * 1.2, p, "size"),
        fill: sp(pc(p), 0.02 * o),
        tags: baseTags("bold-oversized-glyph", ["decorative", "glyph", "watermark"], "primary"),
      })];
    },
  },
];

// ─── GEOMETRIC (10) ─────────────────────────────────────────────────────────

const geometricAssets: AbstractAsset[] = [
  {
    id: "geo-tessellation",
    label: "Tessellation",
    description: "Repeating triangle or hexagon tessellation, mathematical beauty",
    aiDescription: "A repeating triangular tessellation pattern covering a section of the card. Evokes mathematical precision, Islamic art, and architectural tiling.",
    tags: ["tessellation", "triangles", "repeating", "tiling"],
    category: "geometric", type: "texture-overlay", style: ["mathematical", "tiling", "precise"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Tessellation", x: scaled(W * 0.6, p, "x"), y: 0, w: scaled(W * 0.4, p, "size"), h: H, fill: { kind: "pattern", patternType: "triangles", color: hexToRGBA(pc(p)), scale: 1, rotation: 0, opacity: 0.04 * o, spacing: 24 }, tags: baseTags("geo-tessellation", ["decorative", "texture", "tessellation"], "primary") })];
    },
  },
  {
    id: "geo-golden-spiral",
    label: "Golden Spiral",
    description: "Logarithmic spiral based on φ proportions, divine geometry",
    aiDescription: "Quarter-circle arcs nesting by golden ratio proportions, creating a logarithmic spiral. Represents divine proportion and mathematical harmony in design.",
    tags: ["spiral", "golden-ratio", "fibonacci", "mathematical"],
    category: "geometric", type: "shape-cluster", style: ["mathematical", "harmonious", "divine"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const PHI = 1.618;
      const cx = scaled(W * 0.7, p, "x"), cy = scaled(H * 0.4, p, "y");
      const layers: LayerV2[] = [];
      let r = scaled(W * 0.15, p, "size");
      for (let i = 0; i < 4; i++) {
        layers.push(mkEllipse({ name: `Spiral Arc ${i + 1}`, cx, cy, rx: r, ry: r, fill: sp("#000000", 0), tags: baseTags("geo-golden-spiral", ["decorative", "spiral"], "primary"), opacity: (0.08 - i * 0.015) * o }));
        r = r / PHI;
      }
      return layers;
    },
  },
  {
    id: "geo-diamond-grid",
    label: "Diamond Grid",
    description: "Rotated square grid (45°), diamond lattice pattern",
    aiDescription: "A diamond/rotated-square lattice pattern covering a portion of the card. Creates an elegant geometric texture often seen in luxury packaging and architectural details.",
    tags: ["diamond", "grid", "rotated", "lattice"],
    category: "geometric", type: "texture-overlay", style: ["lattice", "elegant", "architectural"], mood: ["muted", "metallic"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      return [mkRect({ name: "Diamond Grid", x: scaled(W * 0.55, p, "x"), y: scaled(H * 0.1, p, "y"), w: scaled(W * 0.4, p, "size"), h: scaled(H * 0.8, p, "size"), fill: { kind: "pattern", patternType: "diamond", color: hexToRGBA(pc(p)), scale: 1, rotation: 0, opacity: 0.04 * o, spacing: 20 }, tags: baseTags("geo-diamond-grid", ["decorative", "texture", "diamond"], "primary") })];
    },
  },
  {
    id: "geo-isometric-cube",
    label: "Isometric Cube",
    description: "Single isometric cube, architectural 3D feel",
    aiDescription: "A single isometric cube shape rendered with three visible faces at different opacities. Suggests 3D space, architecture, and technical precision.",
    tags: ["cube", "isometric", "3d", "architectural"],
    category: "geometric", type: "path-shape", style: ["3d", "architectural", "technical"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.85, p, "x"), cy = scaled(H * 0.2, p, "y");
      const s = scaled(25, p, "size");
      return [
        createPathLayerV2({ name: "Cube Top", x: 0, y: 0, width: W, height: H, commands: [
          { type: "M", x: cx, y: cy - s }, { type: "L", x: cx + s, y: cy - s * 0.5 }, { type: "L", x: cx, y: cy }, { type: "L", x: cx - s, y: cy - s * 0.5 }, { type: "Z" },
        ], fill: solidPaintHex(pc(p), 0.06 * o), closed: true, tags: baseTags("geo-isometric-cube", ["decorative", "cube"], "primary") }),
        createPathLayerV2({ name: "Cube Left", x: 0, y: 0, width: W, height: H, commands: [
          { type: "M", x: cx - s, y: cy - s * 0.5 }, { type: "L", x: cx, y: cy }, { type: "L", x: cx, y: cy + s }, { type: "L", x: cx - s, y: cy + s * 0.5 }, { type: "Z" },
        ], fill: solidPaintHex(pc(p), 0.04 * o), closed: true, tags: baseTags("geo-isometric-cube", ["decorative", "cube"], "primary") }),
        createPathLayerV2({ name: "Cube Right", x: 0, y: 0, width: W, height: H, commands: [
          { type: "M", x: cx + s, y: cy - s * 0.5 }, { type: "L", x: cx, y: cy }, { type: "L", x: cx, y: cy + s }, { type: "L", x: cx + s, y: cy + s * 0.5 }, { type: "Z" },
        ], fill: solidPaintHex(p.secondary, 0.03 * o), closed: true, tags: baseTags("geo-isometric-cube", ["decorative", "cube"], "secondary") }),
      ];
    },
  },
  {
    id: "geo-sacred-circle",
    label: "Sacred Circle",
    description: "Vesica piscis / overlapping circles, sacred geometry",
    aiDescription: "Two overlapping circles creating a vesica piscis (almond-shaped intersection). A fundamental form in sacred geometry symbolizing unity and creation.",
    tags: ["vesica", "sacred", "overlapping", "circles"],
    category: "geometric", type: "shape-cluster", style: ["sacred", "spiritual", "harmonious"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const r = scaled(Math.min(W, H) * 0.1, p, "size");
      const cx = scaled(W * 0.5, p, "x"), cy = scaled(H * 0.5, p, "y");
      const offset = r * 0.55;
      return [
        mkEllipse({ name: "Sacred Left", cx: cx - offset, cy, rx: r, ry: r, fill: sp(pc(p), 0.04 * o), tags: baseTags("geo-sacred-circle", ["decorative", "circle"], "primary") }),
        mkEllipse({ name: "Sacred Right", cx: cx + offset, cy, rx: r, ry: r, fill: sp(p.secondary, 0.04 * o), tags: baseTags("geo-sacred-circle", ["decorative", "circle"], "secondary") }),
      ];
    },
  },
  {
    id: "geo-polygon-cluster",
    label: "Polygon Cluster",
    description: "5–7 sided polygons loosely grouped, organic geometry",
    aiDescription: "A cluster of 3 polygon shapes (pentagon, hexagon, heptagon) loosely grouped together. Bridges the gap between strict geometry and organic arrangement.",
    tags: ["polygon", "cluster", "grouped", "multi-sided"],
    category: "geometric", type: "shape-cluster", style: ["organic-geometry", "clustered", "varied"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const positions = [[0.78, 0.2, 0.06], [0.86, 0.28, 0.045], [0.82, 0.36, 0.035]];
      return positions.map(([fx, fy, fr], i) => mkEllipse({
        name: `Polygon ${i + 1}`, cx: scaled(W * fx, p, "x"), cy: scaled(H * fy, p, "y"),
        rx: scaled(W * fr, p, "size"), ry: scaled(W * fr, p, "size"),
        fill: sp(i === 0 ? pc(p) : p.secondary, (0.06 - i * 0.015) * o),
        tags: baseTags("geo-polygon-cluster", ["decorative", "polygon"], i === 0 ? "primary" : "secondary"),
      }));
    },
  },
  {
    id: "geo-radial-division",
    label: "Radial Division",
    description: "Pie-slice divisions from center point, radial symmetry",
    aiDescription: "Thin lines radiating from a point creating pie-slice divisions. Evokes radar displays, clock faces, and radial symmetry found in nature.",
    tags: ["radial", "divisions", "pie", "symmetry"],
    category: "geometric", type: "shape-cluster", style: ["radial", "symmetric", "precise"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.15, p, "x"), cy = scaled(H * 0.85, p, "y");
      const layers: LayerV2[] = [];
      const slices = 6;
      for (let i = 0; i < slices; i++) {
        const angle = (i / slices) * Math.PI / 2 - Math.PI / 2;
        const len = scaled(W * 0.2, p, "size");
        const ex = cx + Math.cos(angle) * len, ey = cy + Math.sin(angle) * len;
        layers.push(mkRect({
          name: `Division ${i + 1}`, x: Math.min(cx, ex), y: Math.min(cy, ey),
          w: Math.max(Math.abs(ex - cx), 0.8), h: Math.max(Math.abs(ey - cy), 0.8),
          fill: sp(pc(p), (0.08 - i * 0.01) * o),
          tags: baseTags("geo-radial-division", ["decorative", "division"], "primary"),
        }));
      }
      return layers;
    },
  },
  {
    id: "geo-star-polygon",
    label: "Star Polygon",
    description: "5–8 pointed star, clean geometric precision",
    aiDescription: "A clean 6-pointed star polygon shape. Represents precision, achievement, and geometric perfection. Commonly used in rating, quality, and excellence branding.",
    tags: ["star", "polygon", "pointed", "precision"],
    category: "geometric", type: "path-shape", style: ["precise", "symbolic", "clean"], mood: ["metallic", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.88, p, "x"), cy = scaled(H * 0.15, p, "y");
      const outerR = scaled(18, p, "size"), innerR = outerR * 0.5;
      const points = 6;
      const cmds: PathCommand[] = [];
      for (let i = 0; i < points * 2; i++) {
        const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        cmds.push({ type: i === 0 ? "M" : "L", x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r } as PathCommand);
      }
      cmds.push({ type: "Z" } as PathCommand);
      return [createPathLayerV2({ name: "Star Polygon", x: 0, y: 0, width: W, height: H, commands: cmds, fill: solidPaintHex(pc(p), 0.06 * o), closed: true, tags: baseTags("geo-star-polygon", ["decorative", "star"], "primary") })];
    },
  },
  {
    id: "geo-concentric-squares",
    label: "Concentric Squares",
    description: "Nested squares as a target pattern, focused composition",
    aiDescription: "Three nested/concentric squares creating a target or bullseye pattern. Draws the eye inward, creating focus and centered visual weight.",
    tags: ["squares", "concentric", "nested", "target"],
    category: "geometric", type: "shape-cluster", style: ["focused", "targeted", "centered"], mood: ["muted", "light"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: true, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.82, p, "x"), cy = scaled(H * 0.3, p, "y");
      const sizes = [scaled(30, p, "size"), scaled(20, p, "size"), scaled(10, p, "size")];
      return sizes.map((s, i) => mkRect({
        name: `Square ${i + 1}`, x: cx - s, y: cy - s, w: s * 2, h: s * 2,
        stroke: sk(i === 0 ? pc(p) : p.secondary, 0.8, (0.12 - i * 0.03) * o),
        tags: baseTags("geo-concentric-squares", ["decorative", "square"], i === 0 ? "primary" : "secondary"),
      }));
    },
  },
  {
    id: "geo-fibonacci-arc",
    label: "Fibonacci Arc",
    description: "Quarter-circle arcs nesting by golden ratio, mathematical beauty",
    aiDescription: "Nested quarter-circle arcs following Fibonacci proportions. Each arc is a quarter turn of the golden spiral, creating a mathematically harmonious pattern.",
    tags: ["fibonacci", "arc", "golden", "mathematical"],
    category: "geometric", type: "shape-cluster", style: ["mathematical", "golden", "harmonious"], mood: ["light", "muted"],
    customizable: FULL_CUSTOM, colorRoles: { primary: true, secondary: false, background: false },
    build: (p) => {
      const W = p.W, H = p.H, o = p.opacity ?? 1;
      const cx = scaled(W * 0.9, p, "x"), cy = scaled(H * 0.9, p, "y");
      const fib = [89, 55, 34, 21, 13];
      return fib.map((f, i) => {
        const r = scaled(f * 0.8, p, "size");
        return mkEllipse({
          name: `Fib Arc ${i + 1}`, cx, cy, rx: r, ry: r,
          fill: sp("#000000", 0),
          tags: baseTags("geo-fibonacci-arc", ["decorative", "arc"], "primary"),
          opacity: (0.06 - i * 0.01) * o,
        });
      });
    },
  },
];

// =============================================================================
// 4.  Master Registry
// =============================================================================

/** All abstract assets — the single source of truth */
export const ABSTRACT_ASSETS: AbstractAsset[] = [
  ...modernAssets,
  ...minimalistAssets,
  ...vintageAssets,
  ...corporateAssets,
  ...luxuryAssets,
  ...organicAssets,
  ...techAssets,
  ...boldAssets,
  ...geometricAssets,
];

/** O(1) lookup by ID */
export const ABSTRACT_REGISTRY: Record<string, AbstractAsset> = Object.fromEntries(
  ABSTRACT_ASSETS.map(a => [a.id, a])
);

/** All category values */
export const ABSTRACT_CATEGORIES: AbstractCategory[] = [
  "modern", "minimalist", "vintage", "corporate", "luxury",
  "organic", "tech", "bold", "geometric",
];

/** Category labels for UI */
export const ABSTRACT_CATEGORY_LABELS: Record<AbstractCategory, string> = {
  modern: "Modern",
  minimalist: "Minimalist",
  vintage: "Vintage / Retro",
  corporate: "Corporate",
  luxury: "Luxury",
  organic: "Organic / Nature",
  tech: "Tech / Digital",
  bold: "Bold / Expressive",
  geometric: "Geometric",
};

// =============================================================================
// 5.  AI Helper Functions
// =============================================================================

/** Returns a compact string listing all abstract assets for AI prompt injection */
export function getAbstractListForAI(): string {
  const lines: string[] = ["Available abstract decorative assets:"];
  for (const cat of ABSTRACT_CATEGORIES) {
    const assets = ABSTRACT_ASSETS.filter(a => a.category === cat);
    lines.push(`\n[${ABSTRACT_CATEGORY_LABELS[cat]}]`);
    for (const a of assets) {
      lines.push(`  ${a.id}: ${a.aiDescription} (tags: ${a.tags.join(", ")})`);
    }
  }
  return lines.join("\n");
}

/** Search abstract assets by keyword (matches id, label, description, tags) */
export function searchAbstractAssets(query: string): AbstractAsset[] {
  const q = query.toLowerCase();
  return ABSTRACT_ASSETS.filter(a =>
    a.id.includes(q) || a.label.toLowerCase().includes(q) ||
    a.description.toLowerCase().includes(q) ||
    a.tags.some(t => t.includes(q)) ||
    a.style.some(s => s.includes(q)) ||
    a.category.includes(q)
  );
}

/** Get all asset IDs */
export function getAllAbstractIds(): string[] {
  return ABSTRACT_ASSETS.map(a => a.id);
}

/** Get assets by category */
export function getAbstractsByCategory(category: AbstractCategory): AbstractAsset[] {
  return ABSTRACT_ASSETS.filter(a => a.category === category);
}

/** Get assets by mood */
export function getAbstractsByMood(mood: AbstractMood): AbstractAsset[] {
  return ABSTRACT_ASSETS.filter(a => a.mood.includes(mood));
}

/** Get assets by type */
export function getAbstractsByType(type: AbstractAssetType): AbstractAsset[] {
  return ABSTRACT_ASSETS.filter(a => a.type === type);
}

/**
 * Build layers for an abstract asset with the given params.
 * Returns empty array if assetId is unknown.
 */
export function buildAbstractAsset(
  assetId: string,
  params: AbstractBuildParams
): LayerV2[] {
  const asset = ABSTRACT_REGISTRY[assetId];
  if (!asset) return [];
  const layers = asset.build(params);
  // Apply blendMode if specified
  if (params.blendMode) {
    for (const layer of layers) {
      (layer as unknown as { blendMode: string }).blendMode = params.blendMode;
    }
  }
  return layers;
}

/** Get asset count by category for UI stats */
export function getAbstractCountByCategory(): Record<AbstractCategory, number> {
  const counts = {} as Record<AbstractCategory, number>;
  for (const cat of ABSTRACT_CATEGORIES) counts[cat] = 0;
  for (const a of ABSTRACT_ASSETS) counts[a.category]++;
  return counts;
}
