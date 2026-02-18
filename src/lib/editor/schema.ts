// =============================================================================
// DMSuite — Canvas Editor vNext Schema
// The canonical, JSON-serializable scene-graph that every layer, renderer,
// editor interaction, AI engine, and export pipeline operates on.
//
// Design goals:
//   • One model used everywhere (editor, thumbnails, export, AI patch)
//   • Supports "Illustrator-lite" pro features: blend modes, masks/clipping,
//     per-layer gradients, effects pipelines, vector paths, rich text runs
//   • Backward-compatible migration from legacy canvas-layers.ts types
//   • AI-friendly: every property has a deterministic JSON pointer path
// =============================================================================

// ---------------------------------------------------------------------------
// 0.  Primitives
// ---------------------------------------------------------------------------

/** RGBA color — canonical color representation */
export interface RGBA {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
  a: number; // 0-1
}

/** 2D point */
export interface Vec2 {
  x: number;
  y: number;
}

/** Axis-aligned bounding box (computed, never persisted) */
export interface AABB {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** 2×3 affine transform matrix [a, b, c, d, tx, ty] */
export type Matrix2D = [number, number, number, number, number, number];

/** Identity matrix constant */
export const IDENTITY_MATRIX: Matrix2D = [1, 0, 0, 1, 0, 0];

/** Unique layer identifier */
export type LayerId = string;

/** Unique document identifier */
export type DocId = string;

// ---------------------------------------------------------------------------
// 1.  Paint System (fills & strokes for ANY layer)
// ---------------------------------------------------------------------------

export interface SolidPaint {
  kind: "solid";
  color: RGBA;
}

export interface GradientStop {
  offset: number; // 0-1
  color: RGBA;
}

export interface GradientPaint {
  kind: "gradient";
  gradientType: "linear" | "radial" | "angular" | "diamond";
  stops: GradientStop[];
  /** Transform applied to the gradient coordinate space */
  transform: Matrix2D;
  spread: "pad" | "reflect" | "repeat";
}

export interface ImagePaint {
  kind: "image";
  imageRef: string; // reference to document resource
  fit: "cover" | "contain" | "stretch" | "tile";
  opacity: number; // 0-1
  transform: Matrix2D;
}

export interface PatternPaint {
  kind: "pattern";
  patternType:
    | "dots" | "lines" | "diagonal-lines" | "crosshatch"
    | "waves" | "triangles" | "hexagons" | "circles"
    | "chevrons" | "diamond" | "noise" | "grid";
  color: RGBA;
  scale: number;
  rotation: number; // degrees
  opacity: number;  // 0-1
  spacing: number;  // px
}

/** Union of all paint types */
export type Paint = SolidPaint | GradientPaint | ImagePaint | PatternPaint;

// ---------------------------------------------------------------------------
// 2.  Stroke System
// ---------------------------------------------------------------------------

export interface StrokeSpec {
  paint: Paint;
  width: number;
  align: "center" | "inside" | "outside";
  dash: number[];      // [] = solid
  cap: "butt" | "round" | "square";
  join: "miter" | "round" | "bevel";
  miterLimit: number;
}

/** Default stroke factory */
export function defaultStroke(color: RGBA, width = 1): StrokeSpec {
  return {
    paint: { kind: "solid", color },
    width,
    align: "center",
    dash: [],
    cap: "butt",
    join: "miter",
    miterLimit: 10,
  };
}

// ---------------------------------------------------------------------------
// 3.  Effects Pipeline (stackable, non-destructive)
// ---------------------------------------------------------------------------

export interface DropShadowEffect {
  type: "drop-shadow";
  enabled: boolean;
  color: RGBA;
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
}

export interface InnerShadowEffect {
  type: "inner-shadow";
  enabled: boolean;
  color: RGBA;
  offsetX: number;
  offsetY: number;
  blur: number;
}

export interface BlurEffect {
  type: "blur";
  enabled: boolean;
  blurType: "gaussian" | "motion";
  radius: number;
  angle: number; // for motion blur
}

export interface GlowEffect {
  type: "glow";
  enabled: boolean;
  color: RGBA;
  radius: number;
  intensity: number; // 0-1
  inner: boolean;
}

export interface OutlineEffect {
  type: "outline";
  enabled: boolean;
  color: RGBA;
  width: number;
}

export interface ColorAdjustEffect {
  type: "color-adjust";
  enabled: boolean;
  brightness: number;   // -100 to 100
  contrast: number;      // -100 to 100
  saturation: number;    // -100 to 100
  temperature: number;   // -100 to 100 (cool to warm)
  tint: number;          // -100 to 100
  hueRotate: number;     // 0-360 degrees
}

export interface NoiseEffect {
  type: "noise";
  enabled: boolean;
  intensity: number; // 0-1
  monochrome: boolean;
}

/** Union of all effect types */
export type Effect =
  | DropShadowEffect
  | InnerShadowEffect
  | BlurEffect
  | GlowEffect
  | OutlineEffect
  | ColorAdjustEffect
  | NoiseEffect;

// ---------------------------------------------------------------------------
// 4.  Blend Modes
// ---------------------------------------------------------------------------

export type BlendMode =
  | "normal"
  | "multiply"
  | "screen"
  | "overlay"
  | "darken"
  | "lighten"
  | "color-dodge"
  | "color-burn"
  | "hard-light"
  | "soft-light"
  | "difference"
  | "exclusion"
  | "hue"
  | "saturation"
  | "color"
  | "luminosity";

/** Map our blend modes to Canvas globalCompositeOperation values */
export const BLEND_MODE_TO_COMPOSITE: Record<BlendMode, GlobalCompositeOperation> = {
  "normal": "source-over",
  "multiply": "multiply",
  "screen": "screen",
  "overlay": "overlay",
  "darken": "darken",
  "lighten": "lighten",
  "color-dodge": "color-dodge",
  "color-burn": "color-burn",
  "hard-light": "hard-light",
  "soft-light": "soft-light",
  "difference": "difference",
  "exclusion": "exclusion",
  "hue": "hue",
  "saturation": "saturation",
  "color": "color",
  "luminosity": "luminosity",
};

// ---------------------------------------------------------------------------
// 5.  Clipping & Masks
// ---------------------------------------------------------------------------

export interface ClipSpec {
  /** ID of a shape/path layer used as clip mask */
  clipLayerId: LayerId;
  /** Whether to clip content or stroke */
  clipMode: "content" | "stroke";
}

export interface MaskSpec {
  /** ID of a layer used as luminance/alpha mask */
  maskLayerId: LayerId;
  maskMode: "alpha" | "luminance";
  invert: boolean;
}

// ---------------------------------------------------------------------------
// 6.  Constraints (for responsive layout inside frames)
// ---------------------------------------------------------------------------

export interface Constraints {
  horizontal: "left" | "right" | "center" | "stretch" | "scale";
  vertical: "top" | "bottom" | "center" | "stretch" | "scale";
}

// ---------------------------------------------------------------------------
// 7.  Transform (decomposed for editing; can derive matrix)
// ---------------------------------------------------------------------------

export interface Transform {
  position: Vec2;
  size: Vec2;       // width, height
  rotation: number; // degrees
  skewX: number;    // degrees
  skewY: number;    // degrees
  pivot: Vec2;      // 0-1 normalized (0.5, 0.5 = center)
}

export function defaultTransform(x = 0, y = 0, w = 100, h = 100): Transform {
  return {
    position: { x, y },
    size: { x: w, y: h },
    rotation: 0,
    skewX: 0,
    skewY: 0,
    pivot: { x: 0.5, y: 0.5 },
  };
}

/** Decomposed transform → affine matrix */
export function transformToMatrix(t: Transform): Matrix2D {
  const cx = t.position.x + t.size.x * t.pivot.x;
  const cy = t.position.y + t.size.y * t.pivot.y;
  const rad = (t.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // translate to pivot, rotate, translate back
  return [
    cos, sin,
    -sin, cos,
    cx - cos * cx + sin * cy,
    cy - sin * cx - cos * cy,
  ];
}

/** Get world-space AABB from transform (rotation-aware) */
export function transformToAABB(t: Transform): AABB {
  const m = transformToMatrix(t);
  const corners: Vec2[] = [
    { x: t.position.x, y: t.position.y },
    { x: t.position.x + t.size.x, y: t.position.y },
    { x: t.position.x + t.size.x, y: t.position.y + t.size.y },
    { x: t.position.x, y: t.position.y + t.size.y },
  ];
  const transformed = corners.map(p => ({
    x: m[0] * p.x + m[2] * p.y + m[4],
    y: m[1] * p.x + m[3] * p.y + m[5],
  }));
  return {
    minX: Math.min(...transformed.map(p => p.x)),
    minY: Math.min(...transformed.map(p => p.y)),
    maxX: Math.max(...transformed.map(p => p.x)),
    maxY: Math.max(...transformed.map(p => p.y)),
  };
}

// ---------------------------------------------------------------------------
// 8.  Rich Text
// ---------------------------------------------------------------------------

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  letterSpacing: number;
  lineHeight: number;
  fill: Paint;
  stroke?: StrokeSpec;
  uppercase: boolean;
}

export interface TextRun {
  /** Character range [start, end) */
  start: number;
  end: number;
  style: Partial<TextStyle>;
}

export interface ParagraphStyle {
  align: "left" | "center" | "right" | "justify";
  indent: number;
  spaceBefore: number;
  spaceAfter: number;
}

// ---------------------------------------------------------------------------
// 9.  Path Geometry (for vector paths / pen tool)
// ---------------------------------------------------------------------------

export type PathCommand =
  | { type: "M"; x: number; y: number }                                     // moveTo
  | { type: "L"; x: number; y: number }                                     // lineTo
  | { type: "C"; cp1x: number; cp1y: number; cp2x: number; cp2y: number; x: number; y: number } // cubic bezier
  | { type: "Q"; cpx: number; cpy: number; x: number; y: number }          // quadratic bezier
  | { type: "A"; rx: number; ry: number; rotation: number; largeArc: boolean; sweep: boolean; x: number; y: number }
  | { type: "Z" };                                                          // close

export interface PathGeometry {
  commands: PathCommand[];
  fillRule: "nonzero" | "evenodd";
  closed: boolean;
}

// ---------------------------------------------------------------------------
// 10.  Layer Types (vNext — backward compatible with legacy)
// ---------------------------------------------------------------------------

/** Base properties shared by ALL layer types */
export interface LayerBaseV2 {
  id: LayerId;
  type: LayerTypeV2;
  name: string;
  /** Tags for AI targeting (e.g., "logo", "headline", "contact-email") */
  tags: string[];
  parentId: LayerId | null;
  transform: Transform;
  opacity: number;         // 0-1
  blendMode: BlendMode;
  visible: boolean;
  locked: boolean;
  /** Non-destructive effects stack (rendered in order) */
  effects: Effect[];
  /** Clipping mask specification */
  clip?: ClipSpec;
  /** Luminance/alpha mask specification */
  mask?: MaskSpec;
  /** Responsive constraints (when inside a frame) */
  constraints: Constraints;
}

export type LayerTypeV2 =
  | "text"
  | "shape"
  | "image"
  | "frame"
  | "path"
  | "icon"
  | "boolean-group"
  | "group";

// -- Text Layer ---------------------------------------------------------------

export interface TextLayerV2 extends LayerBaseV2 {
  type: "text";
  /** Raw text content */
  text: string;
  /** Default text style (applies to whole text unless overridden by runs) */
  defaultStyle: TextStyle;
  /** Per-range style overrides (rich text) */
  runs: TextRun[];
  /** Per-paragraph style */
  paragraphs: ParagraphStyle[];
  /** Text box behavior */
  overflow: "clip" | "ellipsis" | "expand";
  verticalAlign: "top" | "middle" | "bottom";
  /** Text on path */
  textPath?: {
    pathLayerId: LayerId;
    startOffset: number;
    align: "start" | "center" | "end";
    reverse: boolean;
  };
}

// -- Shape Layer (rectangle, ellipse, polygon, star, etc.) --------------------

export interface ShapeLayerV2 extends LayerBaseV2 {
  type: "shape";
  shapeType: "rectangle" | "ellipse" | "triangle" | "polygon" | "star" | "line";
  fills: Paint[];
  strokes: StrokeSpec[];
  /** Per-corner radii [topLeft, topRight, bottomRight, bottomLeft] */
  cornerRadii: [number, number, number, number];
  /** For polygon/star */
  sides: number;
  /** For star: inner radius ratio (0-1) */
  innerRadiusRatio: number;
}

// -- Image Layer --------------------------------------------------------------

export interface ImageLayerV2 extends LayerBaseV2 {
  type: "image";
  /** Reference to resource (URL or resource ID) */
  imageRef: string;
  /** Loaded image element (runtime only, not serialized) */
  _imageElement?: HTMLImageElement;
  fit: "cover" | "contain" | "stretch" | "fill";
  /** Focal point for cover cropping (0-1 normalized) */
  focalPoint: Vec2;
  /** Non-destructive crop rect (normalized 0-1 relative to image) */
  cropRect: { x: number; y: number; w: number; h: number };
  /** Image filters */
  imageFilters: {
    brightness: number;   // -100 to 100
    contrast: number;      // -100 to 100
    saturation: number;    // -100 to 100
    temperature: number;   // -100 to 100
    blur: number;          // 0+
    grayscale: boolean;
    sepia: boolean;
  };
  fills: Paint[];      // overlays on top of image
  strokes: StrokeSpec[];
  cornerRadius: number;
}

// -- Frame Layer (artboard / container with clip) -----------------------------

export interface FrameLayerV2 extends LayerBaseV2 {
  type: "frame";
  /** Background fills (rendered behind children) */
  fills: Paint[];
  strokes: StrokeSpec[];
  cornerRadii: [number, number, number, number];
  /** Whether children are clipped to frame bounds */
  clipContent: boolean;
  /** Child layer IDs (ordered front-to-back, 0 = topmost) */
  children: LayerId[];
  /** For print: bleed in mm */
  bleedMm: number;
  /** For print: safe area inset in mm */
  safeAreaMm: number;
  /** Grid/guide definitions */
  guides: GuideSpec[];
}

export interface GuideSpec {
  type: "horizontal" | "vertical";
  position: number; // px from frame origin
  label?: string;
  locked: boolean;
}

// -- Path Layer (vector paths / pen tool) -------------------------------------

export interface PathLayerV2 extends LayerBaseV2 {
  type: "path";
  geometry: PathGeometry;
  fills: Paint[];
  strokes: StrokeSpec[];
}

// -- Icon Layer (references icon library) -------------------------------------

export interface IconLayerV2 extends LayerBaseV2 {
  type: "icon";
  iconId: string;   // references icon-library.ts registry
  color: RGBA;
  strokeWidth: number;
}

// -- Boolean Group (union/subtract/intersect/exclude) -------------------------

export interface BooleanGroupLayerV2 extends LayerBaseV2 {
  type: "boolean-group";
  operation: "union" | "subtract" | "intersect" | "exclude";
  children: LayerId[];
  fills: Paint[];
  strokes: StrokeSpec[];
}

// -- Group Layer (logical grouping) -------------------------------------------

export interface GroupLayerV2 extends LayerBaseV2 {
  type: "group";
  children: LayerId[];
}

/** Union of all layer types */
export type LayerV2 =
  | TextLayerV2
  | ShapeLayerV2
  | ImageLayerV2
  | FrameLayerV2
  | PathLayerV2
  | IconLayerV2
  | BooleanGroupLayerV2
  | GroupLayerV2;

// ---------------------------------------------------------------------------
// 11.  Design Document (vNext)
// ---------------------------------------------------------------------------

export interface ResourceRef {
  id: string;
  type: "image" | "font";
  url: string;
  name: string;
}

export interface DesignDocumentV2 {
  id: DocId;
  version: 2;
  name: string;
  /** Tool that created this document (e.g., "business-card-designer") */
  toolId: string;
  /** Root frame (artboard) — always exactly one for single-page tools */
  rootFrameId: LayerId;
  /** All layers indexed by ID (the scene graph) */
  layersById: Record<LayerId, LayerV2>;
  /** Selection state */
  selection: {
    ids: LayerId[];
    primaryId: LayerId | null;
  };
  /** External resources (images, fonts) */
  resources: ResourceRef[];
  /** Document metadata */
  meta: {
    createdAt: number;
    updatedAt: number;
    /** DPI for print tools */
    dpi: number;
    /** Canvas units */
    units: "px" | "mm" | "in";
    /** Original tool-specific config snapshot (for migration/AI context) */
    toolConfig?: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// 12.  Document Factory
// ---------------------------------------------------------------------------

export function createDocumentV2(opts: {
  toolId: string;
  name: string;
  width: number;
  height: number;
  backgroundColor?: RGBA;
  dpi?: number;
  bleedMm?: number;
  safeAreaMm?: number;
}): DesignDocumentV2 {
  const rootFrame = createFrameLayer({
    name: "Artboard",
    x: 0, y: 0,
    width: opts.width,
    height: opts.height,
    fills: [solidPaint(opts.backgroundColor ?? { r: 255, g: 255, b: 255, a: 1 })],
    bleedMm: opts.bleedMm ?? 0,
    safeAreaMm: opts.safeAreaMm ?? 0,
  });

  return {
    id: crypto.randomUUID(),
    version: 2,
    name: opts.name,
    toolId: opts.toolId,
    rootFrameId: rootFrame.id,
    layersById: { [rootFrame.id]: rootFrame },
    selection: { ids: [], primaryId: null },
    resources: [],
    meta: {
      createdAt: Date.now(),
      updatedAt: Date.now(),
      dpi: opts.dpi ?? 300,
      units: "px",
    },
  };
}

// ---------------------------------------------------------------------------
// 13.  Layer Factories
// ---------------------------------------------------------------------------

let _idCounter = 0;
function nextLayerId(): LayerId {
  return crypto.randomUUID?.() ?? `layer-${++_idCounter}-${Date.now()}`;
}

function baseLayer<T extends LayerTypeV2>(type: T, name: string, x: number, y: number, w: number, h: number): LayerBaseV2 & { type: T } {
  return {
    id: nextLayerId(),
    type,
    name,
    tags: [],
    parentId: null,
    transform: defaultTransform(x, y, w, h),
    opacity: 1,
    blendMode: "normal",
    visible: true,
    locked: false,
    effects: [],
    constraints: { horizontal: "left", vertical: "top" },
  };
}

/** Helper: create solid paint */
export function solidPaint(color: RGBA): SolidPaint {
  return { kind: "solid", color };
}

/** Helper: create from hex string */
export function solidPaintHex(hex: string, alpha = 1): SolidPaint {
  return { kind: "solid", color: hexToRGBA(hex, alpha) };
}

/** Hex string → RGBA */
export function hexToRGBA(hex: string, alpha = 1): RGBA {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return { r, g, b, a: alpha };
}

/** RGBA → hex string */
export function rgbaToHex(c: RGBA): string {
  const r = Math.round(c.r).toString(16).padStart(2, "0");
  const g = Math.round(c.g).toString(16).padStart(2, "0");
  const b = Math.round(c.b).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}

export function createTextLayerV2(opts: {
  name?: string;
  x?: number; y?: number; width?: number; height?: number;
  text: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: number;
  color?: RGBA;
  align?: "left" | "center" | "right" | "justify";
  tags?: string[];
}): TextLayerV2 {
  const fontSize = opts.fontSize ?? 24;
  return {
    ...baseLayer("text", opts.name ?? "Text", opts.x ?? 0, opts.y ?? 0, opts.width ?? 400, opts.height ?? 60),
    text: opts.text,
    tags: opts.tags ?? [],
    defaultStyle: {
      fontFamily: opts.fontFamily ?? "Inter",
      fontSize,
      fontWeight: opts.fontWeight ?? 400,
      italic: false,
      underline: false,
      strikethrough: false,
      letterSpacing: 0,
      lineHeight: 1.4,
      fill: solidPaint(opts.color ?? { r: 0, g: 0, b: 0, a: 1 }),
      uppercase: false,
    },
    runs: [],
    paragraphs: [{ align: opts.align ?? "left", indent: 0, spaceBefore: 0, spaceAfter: 0 }],
    overflow: "expand",
    verticalAlign: "top",
  };
}

export function createShapeLayerV2(opts: {
  name?: string;
  x?: number; y?: number; width?: number; height?: number;
  shapeType?: ShapeLayerV2["shapeType"];
  fill?: Paint;
  stroke?: StrokeSpec;
  cornerRadii?: [number, number, number, number];
  tags?: string[];
}): ShapeLayerV2 {
  return {
    ...baseLayer("shape", opts.name ?? "Shape", opts.x ?? 0, opts.y ?? 0, opts.width ?? 200, opts.height ?? 200),
    shapeType: opts.shapeType ?? "rectangle",
    tags: opts.tags ?? [],
    fills: opts.fill ? [opts.fill] : [solidPaint({ r: 138, g: 230, b: 0, a: 1 })],
    strokes: opts.stroke ? [opts.stroke] : [],
    cornerRadii: opts.cornerRadii ?? [0, 0, 0, 0],
    sides: 6,
    innerRadiusRatio: 0.5,
  };
}

export function createImageLayerV2(opts: {
  name?: string;
  x?: number; y?: number; width?: number; height?: number;
  imageRef: string;
  fit?: "cover" | "contain" | "stretch" | "fill";
  tags?: string[];
}): ImageLayerV2 {
  return {
    ...baseLayer("image", opts.name ?? "Image", opts.x ?? 0, opts.y ?? 0, opts.width ?? 400, opts.height ?? 300),
    imageRef: opts.imageRef,
    tags: opts.tags ?? [],
    fit: opts.fit ?? "cover",
    focalPoint: { x: 0.5, y: 0.5 },
    cropRect: { x: 0, y: 0, w: 1, h: 1 },
    imageFilters: {
      brightness: 0,
      contrast: 0,
      saturation: 0,
      temperature: 0,
      blur: 0,
      grayscale: false,
      sepia: false,
    },
    fills: [],
    strokes: [],
    cornerRadius: 0,
  };
}

export function createFrameLayer(opts: {
  name?: string;
  x?: number; y?: number;
  width: number; height: number;
  fills?: Paint[];
  bleedMm?: number;
  safeAreaMm?: number;
}): FrameLayerV2 {
  return {
    ...baseLayer("frame", opts.name ?? "Frame", opts.x ?? 0, opts.y ?? 0, opts.width, opts.height),
    fills: opts.fills ?? [solidPaint({ r: 255, g: 255, b: 255, a: 1 })],
    strokes: [],
    cornerRadii: [0, 0, 0, 0],
    clipContent: true,
    children: [],
    bleedMm: opts.bleedMm ?? 0,
    safeAreaMm: opts.safeAreaMm ?? 0,
    guides: [],
  };
}

export function createIconLayerV2(opts: {
  name?: string;
  x?: number; y?: number; size?: number;
  iconId: string;
  color?: RGBA;
  strokeWidth?: number;
  tags?: string[];
}): IconLayerV2 {
  const sz = opts.size ?? 24;
  return {
    ...baseLayer("icon", opts.name ?? "Icon", opts.x ?? 0, opts.y ?? 0, sz, sz),
    iconId: opts.iconId,
    tags: opts.tags ?? [],
    color: opts.color ?? { r: 0, g: 0, b: 0, a: 1 },
    strokeWidth: opts.strokeWidth ?? 2,
  };
}

export function createPathLayerV2(opts: {
  name?: string;
  x?: number; y?: number; width?: number; height?: number;
  commands: PathCommand[];
  fill?: Paint;
  stroke?: StrokeSpec;
  closed?: boolean;
  tags?: string[];
}): PathLayerV2 {
  return {
    ...baseLayer("path", opts.name ?? "Path", opts.x ?? 0, opts.y ?? 0, opts.width ?? 100, opts.height ?? 100),
    tags: opts.tags ?? [],
    geometry: {
      commands: opts.commands,
      fillRule: "nonzero",
      closed: opts.closed ?? false,
    },
    fills: opts.fill ? [opts.fill] : [],
    strokes: opts.stroke ? [opts.stroke] : [],
  };
}

export function createGroupLayerV2(opts: {
  name?: string;
  children: LayerId[];
}): GroupLayerV2 {
  return {
    ...baseLayer("group", opts.name ?? "Group", 0, 0, 0, 0),
    children: opts.children,
  };
}

// ---------------------------------------------------------------------------
// 14.  Document Helpers
// ---------------------------------------------------------------------------

/** Get a layer by ID */
export function getLayer(doc: DesignDocumentV2, id: LayerId): LayerV2 | undefined {
  return doc.layersById[id];
}

/** Get all children of a frame/group */
export function getChildren(doc: DesignDocumentV2, parentId: LayerId): LayerV2[] {
  const parent = doc.layersById[parentId];
  if (!parent) return [];
  if (parent.type === "frame" || parent.type === "group" || parent.type === "boolean-group") {
    return parent.children.map(id => doc.layersById[id]).filter(Boolean);
  }
  return [];
}

/** Add a layer to the document under a parent frame/group */
export function addLayer(doc: DesignDocumentV2, layer: LayerV2, parentId?: LayerId): DesignDocumentV2 {
  const targetParent = parentId ?? doc.rootFrameId;
  const parent = doc.layersById[targetParent];
  if (!parent || (parent.type !== "frame" && parent.type !== "group" && parent.type !== "boolean-group")) {
    return doc;
  }

  const updatedParent = { ...parent, children: [layer.id, ...parent.children] } as LayerV2;
  const updatedLayer = { ...layer, parentId: targetParent };

  return {
    ...doc,
    layersById: {
      ...doc.layersById,
      [layer.id]: updatedLayer,
      [targetParent]: updatedParent,
    },
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
}

/** Remove a layer (and its subtree) from the document */
export function removeLayer(doc: DesignDocumentV2, layerId: LayerId): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer) return doc;

  // Collect all descendant IDs
  const toRemove = new Set<LayerId>();
  const queue = [layerId];
  while (queue.length > 0) {
    const id = queue.pop()!;
    toRemove.add(id);
    const l = doc.layersById[id];
    if (l && "children" in l && Array.isArray(l.children)) {
      queue.push(...l.children);
    }
  }

  // Remove from parent's children
  const newLayersById = { ...doc.layersById };
  for (const id of toRemove) {
    delete newLayersById[id];
  }

  // Update parent
  if (layer.parentId && newLayersById[layer.parentId]) {
    const parent = newLayersById[layer.parentId];
    if ("children" in parent && Array.isArray(parent.children)) {
      newLayersById[layer.parentId] = {
        ...parent,
        children: parent.children.filter((id: LayerId) => !toRemove.has(id)),
      } as LayerV2;
    }
  }

  // Update selection
  const newSelection = doc.selection.ids.filter(id => !toRemove.has(id));

  return {
    ...doc,
    layersById: newLayersById,
    selection: {
      ids: newSelection,
      primaryId: newSelection.includes(doc.selection.primaryId ?? "") ? doc.selection.primaryId : (newSelection[0] ?? null),
    },
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
}

/** Update a single layer's properties (shallow merge) */
export function updateLayer(doc: DesignDocumentV2, layerId: LayerId, changes: Partial<LayerV2>): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer) return doc;

  return {
    ...doc,
    layersById: {
      ...doc.layersById,
      [layerId]: { ...layer, ...changes, id: layerId, type: layer.type } as LayerV2,
    },
    meta: { ...doc.meta, updatedAt: Date.now() },
  };
}

/** Reorder a layer within its parent's children array */
export function reorderLayerV2(
  doc: DesignDocumentV2,
  layerId: LayerId,
  direction: "up" | "down" | "top" | "bottom"
): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer?.parentId) return doc;

  const parent = doc.layersById[layer.parentId];
  if (!parent || !("children" in parent)) return doc;

  const children = [...(parent as FrameLayerV2 | GroupLayerV2).children];
  const idx = children.indexOf(layerId);
  if (idx === -1) return doc;

  switch (direction) {
    case "up":
      if (idx > 0) [children[idx], children[idx - 1]] = [children[idx - 1], children[idx]];
      break;
    case "down":
      if (idx < children.length - 1) [children[idx], children[idx + 1]] = [children[idx + 1], children[idx]];
      break;
    case "top":
      children.splice(idx, 1);
      children.unshift(layerId);
      break;
    case "bottom":
      children.splice(idx, 1);
      children.push(layerId);
      break;
  }

  return {
    ...doc,
    layersById: {
      ...doc.layersById,
      [layer.parentId]: { ...parent, children } as LayerV2,
    },
  };
}

/** Get flat ordered list of all layers (depth-first, front-to-back) */
export function getLayerOrder(doc: DesignDocumentV2, rootId?: LayerId): LayerV2[] {
  const result: LayerV2[] = [];
  const root = doc.layersById[rootId ?? doc.rootFrameId];
  if (!root) return result;

  function walk(layer: LayerV2) {
    result.push(layer);
    if ("children" in layer && Array.isArray(layer.children)) {
      for (const childId of layer.children) {
        const child = doc.layersById[childId];
        if (child) walk(child);
      }
    }
  }

  walk(root);
  return result;
}

/** Duplicate a layer (deep clone with new IDs) */
export function duplicateLayerV2(doc: DesignDocumentV2, layerId: LayerId): DesignDocumentV2 {
  const layer = doc.layersById[layerId];
  if (!layer) return doc;

  const idMap = new Map<LayerId, LayerId>();

  function cloneLayer(l: LayerV2): LayerV2 {
    const newId = nextLayerId();
    idMap.set(l.id, newId);

    const cloned = JSON.parse(JSON.stringify(l)) as LayerV2;
    (cloned as LayerBaseV2).id = newId;
    (cloned as LayerBaseV2).name = `${l.name} copy`;

    // Offset position
    cloned.transform.position.x += 20;
    cloned.transform.position.y += 20;

    // Clone children recursively
    if ("children" in cloned && Array.isArray(cloned.children)) {
      cloned.children = cloned.children.map((childId: LayerId) => {
        const child = doc.layersById[childId];
        if (child) {
          const clonedChild = cloneLayer(child);
          doc = {
            ...doc,
            layersById: { ...doc.layersById, [clonedChild.id]: clonedChild },
          };
          return clonedChild.id;
        }
        return childId;
      });
    }

    return cloned;
  }

  const cloned = cloneLayer(layer);
  let newDoc = {
    ...doc,
    layersById: { ...doc.layersById, [cloned.id]: cloned },
    selection: { ids: [cloned.id], primaryId: cloned.id },
    meta: { ...doc.meta, updatedAt: Date.now() },
  };

  // Add to parent's children
  if (layer.parentId) {
    const parent = newDoc.layersById[layer.parentId];
    if (parent && "children" in parent && Array.isArray(parent.children)) {
      const idx = parent.children.indexOf(layerId);
      const newChildren = [...parent.children];
      newChildren.splice(idx, 0, cloned.id);
      newDoc = {
        ...newDoc,
        layersById: {
          ...newDoc.layersById,
          [layer.parentId]: { ...parent, children: newChildren } as LayerV2,
        },
      };
    }
  }

  return newDoc;
}
