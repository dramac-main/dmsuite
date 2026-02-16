// =============================================================================
// DMSuite — Canvas Layer Engine
// A scene-graph-based object model for interactive, editable canvases.
// Objects (text, shapes, images, CTAs) can be selected, moved, resized, deleted.
// =============================================================================

import {
  hexToRgba,
  getCanvasFont,
  getLetterSpacing,
  getLineHeight,
  getContrastColor,
  drawTrackedText,
  wrapCanvasText,
  roundRect,
  type FontStyle,
} from "./canvas-utils";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LayerType =
  | "text"
  | "shape"
  | "image"
  | "cta"
  | "decorative"
  | "group";

export interface LayerBase {
  id: string;
  type: LayerType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees
  opacity: number; // 0-1
  visible: boolean;
  locked: boolean;
  /** Percentage-based position for responsive re-rendering (0-1) */
  anchorX: number;
  anchorY: number;
}

export interface TextLayer extends LayerBase {
  type: "text";
  text: string;
  fontSize: number;
  fontWeight: number;
  fontStyle: FontStyle;
  color: string;
  align: CanvasTextAlign;
  letterSpacing: number;
  lineHeight: number;
  maxWidth: number;
  shadow: boolean;
  uppercase: boolean;
}

export interface ShapeLayer extends LayerBase {
  type: "shape";
  shape:
    | "rectangle"
    | "circle"
    | "ellipse"
    | "line"
    | "triangle"
    | "polygon";
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
  cornerRadius: number;
  fillOpacity: number;
  /** For gradients */
  gradient?: {
    type: "linear" | "radial";
    stops: { offset: number; color: string }[];
    angle?: number; // degrees, for linear
  };
}

export interface ImageLayer extends LayerBase {
  type: "image";
  src: string;
  imageElement?: HTMLImageElement;
  fit: "cover" | "contain" | "stretch" | "fill";
  focalX: number;
  focalY: number;
  clipRadius: number;
}

export interface CtaLayer extends LayerBase {
  type: "cta";
  text: string;
  fontSize: number;
  fontStyle: FontStyle;
  bgColor: string;
  textColor: string;
  cornerRadius: number;
  paddingX: number;
  paddingY: number;
  glassMorphism: boolean;
}

export interface DecorativeLayer extends LayerBase {
  type: "decorative";
  decorationType:
    | "dot-grid"
    | "concentric-circles"
    | "corner-brackets"
    | "cross-marker"
    | "noise"
    | "gradient-mesh"
    | "accent-line"
    | "divider";
  color: string;
  config: Record<string, number | string>;
}

export interface GroupLayer extends LayerBase {
  type: "group";
  children: string[]; // child layer IDs
}

export type Layer =
  | TextLayer
  | ShapeLayer
  | ImageLayer
  | CtaLayer
  | DecorativeLayer
  | GroupLayer;

// ---------------------------------------------------------------------------
// Design Document
// ---------------------------------------------------------------------------

export interface DesignDocument {
  id: string;
  name: string;
  width: number;
  height: number;
  backgroundColor: string;
  layers: Layer[];
  /** Ordered layer IDs (front-to-back, index 0 = topmost) */
  layerOrder: string[];
  /** The currently selected layer IDs */
  selectedLayers: string[];
  /** Undo/redo history */
  history: DesignDocument[];
  historyIndex: number;
  /** Design metadata */
  meta: {
    category: string;
    platform?: string;
    layout?: string;
    fontStyle: FontStyle;
    accentColor: string;
    createdAt: number;
    updatedAt: number;
  };
}

// ---------------------------------------------------------------------------
// Layer Factory
// ---------------------------------------------------------------------------

let layerIdCounter = 0;
function nextId(): string {
  return `layer_${Date.now()}_${++layerIdCounter}`;
}

export function createTextLayer(
  partial: Partial<TextLayer> & { text: string }
): TextLayer {
  const fontSize = partial.fontSize ?? 48;
  return {
    x: 0,
    y: 0,
    width: 400,
    height: 60,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    anchorX: 0,
    anchorY: 0,
    ...partial,
    id: nextId(),
    type: "text" as const,
    name: partial.name ?? `Text`,
    text: partial.text,
    fontSize,
    fontWeight: partial.fontWeight ?? 700,
    fontStyle: partial.fontStyle ?? "modern",
    color: partial.color ?? "#ffffff",
    align: partial.align ?? "left",
    letterSpacing: partial.letterSpacing ?? getLetterSpacing(fontSize),
    lineHeight: partial.lineHeight ?? getLineHeight(fontSize),
    maxWidth: partial.maxWidth ?? 400,
    shadow: partial.shadow ?? true,
    uppercase: partial.uppercase ?? false,
  };
}

export function createShapeLayer(
  partial: Partial<ShapeLayer> & { shape: ShapeLayer["shape"] }
): ShapeLayer {
  return {
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    anchorX: 0,
    anchorY: 0,
    ...partial,
    id: nextId(),
    type: "shape" as const,
    name: partial.name ?? `Shape`,
    shape: partial.shape,
    fillColor: partial.fillColor ?? "#8ae600",
    strokeColor: partial.strokeColor ?? "transparent",
    strokeWidth: partial.strokeWidth ?? 0,
    cornerRadius: partial.cornerRadius ?? 0,
    fillOpacity: partial.fillOpacity ?? 1,
    gradient: partial.gradient,
  };
}

export function createImageLayer(
  partial: Partial<ImageLayer> & { src: string }
): ImageLayer {
  return {
    x: 0,
    y: 0,
    width: 400,
    height: 300,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    anchorX: 0,
    anchorY: 0,
    ...partial,
    id: nextId(),
    type: "image" as const,
    name: partial.name ?? `Image`,
    src: partial.src,
    fit: partial.fit ?? "cover",
    focalX: partial.focalX ?? 0.5,
    focalY: partial.focalY ?? 0.5,
    clipRadius: partial.clipRadius ?? 0,
  };
}

export function createCtaLayer(
  partial: Partial<CtaLayer> & { text: string }
): CtaLayer {
  return {
    x: 0,
    y: 0,
    width: 200,
    height: 50,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    anchorX: 0,
    anchorY: 0,
    ...partial,
    id: nextId(),
    type: "cta" as const,
    name: partial.name ?? `CTA Button`,
    text: partial.text,
    fontSize: partial.fontSize ?? 16,
    fontStyle: partial.fontStyle ?? "modern",
    bgColor: partial.bgColor ?? "#8ae600",
    textColor: partial.textColor ?? "#000000",
    cornerRadius: partial.cornerRadius ?? 6,
    paddingX: partial.paddingX ?? 32,
    paddingY: partial.paddingY ?? 14,
    glassMorphism: partial.glassMorphism ?? true,
  };
}

export function createDecorativeLayer(
  partial: Partial<DecorativeLayer> & {
    decorationType: DecorativeLayer["decorationType"];
  }
): DecorativeLayer {
  return {
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    visible: true,
    locked: false,
    anchorX: 0,
    anchorY: 0,
    ...partial,
    id: nextId(),
    type: "decorative" as const,
    name: partial.name ?? `Decoration`,
    decorationType: partial.decorationType,
    color: partial.color ?? hexToRgba("#ffffff", 0.1),
    config: partial.config ?? {},
  };
}

// ---------------------------------------------------------------------------
// Layer Renderer
// ---------------------------------------------------------------------------

export function renderLayer(
  ctx: CanvasRenderingContext2D,
  layer: Layer,
  _allLayers?: Layer[]
): void {
  if (!layer.visible) return;

  ctx.save();
  ctx.globalAlpha = layer.opacity;

  // Apply rotation around layer center
  if (layer.rotation !== 0) {
    const cx = layer.x + layer.width / 2;
    const cy = layer.y + layer.height / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  switch (layer.type) {
    case "text":
      renderTextLayer(ctx, layer);
      break;
    case "shape":
      renderShapeLayer(ctx, layer);
      break;
    case "image":
      renderImageLayer(ctx, layer);
      break;
    case "cta":
      renderCtaLayer(ctx, layer);
      break;
    case "decorative":
      renderDecorativeLayer(ctx, layer);
      break;
    case "group":
      // Group rendering handled by iterating children
      break;
  }

  ctx.restore();
}

function renderTextLayer(
  ctx: CanvasRenderingContext2D,
  layer: TextLayer
): void {
  const displayText = layer.uppercase
    ? layer.text.toUpperCase()
    : layer.text;

  ctx.font = getCanvasFont(layer.fontWeight, layer.fontSize, layer.fontStyle);
  ctx.textBaseline = "top";

  const lines = wrapCanvasText(ctx, displayText, layer.maxWidth);
  const leading = layer.lineHeight * layer.fontSize;

  let textX = layer.x;
  if (layer.align === "center") textX = layer.x + layer.width / 2;
  else if (layer.align === "right") textX = layer.x + layer.width;

  for (let i = 0; i < lines.length; i++) {
    const ly = layer.y + i * leading;

    // Multi-layer shadow
    if (layer.shadow) {
      ctx.fillStyle = hexToRgba("#000000", 0.15);
      drawTrackedText(ctx, lines[i], textX + 1, ly + 3, layer.letterSpacing, layer.align);
      ctx.fillStyle = hexToRgba("#000000", 0.08);
      drawTrackedText(ctx, lines[i], textX, ly + 6, layer.letterSpacing, layer.align);
    }

    ctx.fillStyle = layer.color;
    drawTrackedText(ctx, lines[i], textX, ly, layer.letterSpacing, layer.align);
  }

  // Update computed height
  layer.height = lines.length * leading;
}

function renderShapeLayer(
  ctx: CanvasRenderingContext2D,
  layer: ShapeLayer
): void {
  ctx.globalAlpha *= layer.fillOpacity;

  // Set fill
  if (layer.gradient) {
    const g = layer.gradient;
    let grad: CanvasGradient;
    if (g.type === "linear") {
      const angle = ((g.angle ?? 0) * Math.PI) / 180;
      const cx = layer.x + layer.width / 2;
      const cy = layer.y + layer.height / 2;
      const len = Math.max(layer.width, layer.height) / 2;
      grad = ctx.createLinearGradient(
        cx - Math.cos(angle) * len,
        cy - Math.sin(angle) * len,
        cx + Math.cos(angle) * len,
        cy + Math.sin(angle) * len
      );
    } else {
      grad = ctx.createRadialGradient(
        layer.x + layer.width / 2,
        layer.y + layer.height / 2,
        0,
        layer.x + layer.width / 2,
        layer.y + layer.height / 2,
        Math.max(layer.width, layer.height) / 2
      );
    }
    for (const stop of g.stops) {
      grad.addColorStop(stop.offset, stop.color);
    }
    ctx.fillStyle = grad;
  } else {
    ctx.fillStyle = layer.fillColor;
  }

  switch (layer.shape) {
    case "rectangle":
      if (layer.cornerRadius > 0) {
        roundRect(
          ctx,
          layer.x,
          layer.y,
          layer.width,
          layer.height,
          layer.cornerRadius
        );
        ctx.fill();
        if (layer.strokeWidth > 0) {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.stroke();
        }
      } else {
        ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
        if (layer.strokeWidth > 0) {
          ctx.strokeStyle = layer.strokeColor;
          ctx.lineWidth = layer.strokeWidth;
          ctx.strokeRect(layer.x, layer.y, layer.width, layer.height);
        }
      }
      break;

    case "circle":
    case "ellipse": {
      const rx = layer.width / 2;
      const ry = layer.shape === "circle" ? rx : layer.height / 2;
      ctx.beginPath();
      ctx.ellipse(layer.x + rx, layer.y + ry, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth;
        ctx.stroke();
      }
      break;
    }

    case "triangle": {
      ctx.beginPath();
      ctx.moveTo(layer.x + layer.width / 2, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
      ctx.lineTo(layer.x, layer.y + layer.height);
      ctx.closePath();
      ctx.fill();
      if (layer.strokeWidth > 0) {
        ctx.strokeStyle = layer.strokeColor;
        ctx.lineWidth = layer.strokeWidth;
        ctx.stroke();
      }
      break;
    }

    case "line": {
      ctx.strokeStyle = layer.fillColor;
      ctx.lineWidth = layer.strokeWidth || 2;
      ctx.beginPath();
      ctx.moveTo(layer.x, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
      ctx.stroke();
      break;
    }

    default:
      ctx.fillRect(layer.x, layer.y, layer.width, layer.height);
  }
}

function renderImageLayer(
  ctx: CanvasRenderingContext2D,
  layer: ImageLayer
): void {
  if (!layer.imageElement) return;

  ctx.save();

  // Clip with rounded corners if needed
  if (layer.clipRadius > 0) {
    roundRect(ctx, layer.x, layer.y, layer.width, layer.height, layer.clipRadius);
    ctx.clip();
  }

  const img = layer.imageElement;

  if (layer.fit === "cover") {
    const imgAspect = img.width / img.height;
    const layerAspect = layer.width / layer.height;
    let sw: number, sh: number, sx: number, sy: number;

    if (imgAspect > layerAspect) {
      sh = img.height;
      sw = sh * layerAspect;
      sx = (img.width - sw) * layer.focalX;
      sy = 0;
    } else {
      sw = img.width;
      sh = sw / layerAspect;
      sx = 0;
      sy = (img.height - sh) * layer.focalY;
    }
    ctx.drawImage(img, sx, sy, sw, sh, layer.x, layer.y, layer.width, layer.height);
  } else if (layer.fit === "contain") {
    const imgAspect = img.width / img.height;
    const layerAspect = layer.width / layer.height;
    let dw: number, dh: number;
    if (imgAspect > layerAspect) {
      dw = layer.width;
      dh = dw / imgAspect;
    } else {
      dh = layer.height;
      dw = dh * imgAspect;
    }
    const dx = layer.x + (layer.width - dw) / 2;
    const dy = layer.y + (layer.height - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  } else {
    ctx.drawImage(img, layer.x, layer.y, layer.width, layer.height);
  }

  ctx.restore();
}

function renderCtaLayer(
  ctx: CanvasRenderingContext2D,
  layer: CtaLayer
): void {
  const label = layer.text.toUpperCase();
  ctx.font = getCanvasFont(700, layer.fontSize, layer.fontStyle);
  const tw = ctx.measureText(label).width;
  const bw = tw + layer.paddingX * 2;
  const bh = layer.fontSize + layer.paddingY * 2;

  // Update computed size
  layer.width = bw;
  layer.height = bh;

  // Drop shadow
  ctx.fillStyle = hexToRgba("#000000", 0.2);
  roundRect(ctx, layer.x + 2, layer.y + 3, bw, bh, layer.cornerRadius);
  ctx.fill();

  // Main fill
  ctx.fillStyle = layer.bgColor;
  roundRect(ctx, layer.x, layer.y, bw, bh, layer.cornerRadius);
  ctx.fill();

  // Glass morphism
  if (layer.glassMorphism) {
    const glassGrad = ctx.createLinearGradient(
      layer.x,
      layer.y,
      layer.x,
      layer.y + bh
    );
    glassGrad.addColorStop(0, hexToRgba("#ffffff", 0.25));
    glassGrad.addColorStop(0.4, hexToRgba("#ffffff", 0.08));
    glassGrad.addColorStop(0.6, "transparent");
    glassGrad.addColorStop(1, hexToRgba("#000000", 0.1));
    ctx.fillStyle = glassGrad;
    roundRect(ctx, layer.x, layer.y, bw, bh, layer.cornerRadius);
    ctx.fill();

    // Subtle border
    ctx.strokeStyle = hexToRgba("#ffffff", 0.15);
    ctx.lineWidth = 1;
    roundRect(
      ctx,
      layer.x + 0.5,
      layer.y + 0.5,
      bw - 1,
      bh - 1,
      layer.cornerRadius
    );
    ctx.stroke();
  }

  // Text
  const textColor =
    layer.textColor || getContrastColor(layer.bgColor);
  ctx.fillStyle = textColor;
  const spacing = getLetterSpacing(layer.fontSize) + 1.5;
  ctx.textBaseline = "middle";
  drawTrackedText(
    ctx,
    label,
    layer.x + bw / 2,
    layer.y + bh / 2,
    spacing,
    "center"
  );
  ctx.textBaseline = "alphabetic";
}

function renderDecorativeLayer(
  ctx: CanvasRenderingContext2D,
  layer: DecorativeLayer
): void {
  const { decorationType, color, config: cfg } = layer;

  switch (decorationType) {
    case "dot-grid": {
      const cols = (cfg.cols as number) || 5;
      const rows = (cfg.rows as number) || 5;
      const spacing = (cfg.spacing as number) || 12;
      ctx.fillStyle = color;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          ctx.beginPath();
          ctx.arc(
            layer.x + col * spacing,
            layer.y + row * spacing,
            1.5,
            0,
            Math.PI * 2
          );
          ctx.fill();
        }
      }
      break;
    }
    case "concentric-circles": {
      const count = (cfg.count as number) || 3;
      const gap = (cfg.gap as number) || 12;
      const startR = (cfg.startRadius as number) || 20;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      for (let i = 0; i < count; i++) {
        ctx.beginPath();
        ctx.arc(layer.x, layer.y, startR + i * gap, 0, Math.PI * 2);
        ctx.stroke();
      }
      break;
    }
    case "corner-brackets": {
      const bs = (cfg.bracketSize as number) || 30;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      // TL
      ctx.beginPath();
      ctx.moveTo(layer.x, layer.y + bs);
      ctx.lineTo(layer.x, layer.y);
      ctx.lineTo(layer.x + bs, layer.y);
      ctx.stroke();
      // TR
      ctx.beginPath();
      ctx.moveTo(layer.x + layer.width - bs, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y + bs);
      ctx.stroke();
      // BL
      ctx.beginPath();
      ctx.moveTo(layer.x, layer.y + layer.height - bs);
      ctx.lineTo(layer.x, layer.y + layer.height);
      ctx.lineTo(layer.x + bs, layer.y + layer.height);
      ctx.stroke();
      // BR
      ctx.beginPath();
      ctx.moveTo(layer.x + layer.width - bs, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height);
      ctx.lineTo(layer.x + layer.width, layer.y + layer.height - bs);
      ctx.stroke();
      break;
    }
    case "cross-marker": {
      const sz = (cfg.size as number) || 8;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(layer.x - sz, layer.y);
      ctx.lineTo(layer.x + sz, layer.y);
      ctx.moveTo(layer.x, layer.y - sz);
      ctx.lineTo(layer.x, layer.y + sz);
      ctx.stroke();
      break;
    }
    case "accent-line": {
      ctx.fillStyle = color;
      ctx.fillRect(layer.x, layer.y, layer.width, layer.height || 3);
      break;
    }
    case "divider": {
      ctx.strokeStyle = color;
      ctx.lineWidth = (cfg.lineWidth as number) || 1;
      if (cfg.dashed) {
        ctx.setLineDash([6, 4]);
      }
      ctx.beginPath();
      ctx.moveTo(layer.x, layer.y);
      ctx.lineTo(layer.x + layer.width, layer.y);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
    default:
      break;
  }
}

// ---------------------------------------------------------------------------
// Hit Testing — Detect which layer is under a click
// ---------------------------------------------------------------------------

export function hitTest(
  layers: Layer[],
  layerOrder: string[],
  point: Point
): Layer | null {
  // Test from top (front) to bottom (back)
  for (const id of layerOrder) {
    const layer = layers.find((l) => l.id === id);
    if (!layer || !layer.visible || layer.locked) continue;

    if (isPointInBounds(point, layer)) {
      return layer;
    }
  }
  return null;
}

function isPointInBounds(point: Point, bounds: Bounds): boolean {
  return (
    point.x >= bounds.x &&
    point.x <= bounds.x + bounds.width &&
    point.y >= bounds.y &&
    point.y <= bounds.y + bounds.height
  );
}

// ---------------------------------------------------------------------------
// Selection Handles
// ---------------------------------------------------------------------------

export function drawSelectionHandles(
  ctx: CanvasRenderingContext2D,
  layer: Layer
): void {
  const { x, y, width, height } = layer;
  const handleSize = 8;
  const half = handleSize / 2;

  // Selection outline
  ctx.strokeStyle = "#8ae600";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - 1, y - 1, width + 2, height + 2);
  ctx.setLineDash([]);

  // Corner handles
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#8ae600";
  ctx.lineWidth = 2;

  const handles = [
    { cx: x, cy: y },
    { cx: x + width, cy: y },
    { cx: x, cy: y + height },
    { cx: x + width, cy: y + height },
    // Edge midpoints
    { cx: x + width / 2, cy: y },
    { cx: x + width / 2, cy: y + height },
    { cx: x, cy: y + height / 2 },
    { cx: x + width, cy: y + height / 2 },
  ];

  for (const h of handles) {
    ctx.fillRect(h.cx - half, h.cy - half, handleSize, handleSize);
    ctx.strokeRect(h.cx - half, h.cy - half, handleSize, handleSize);
  }
}

/** Get which resize handle is at a point, if any */
export function getResizeHandle(
  layer: Layer,
  point: Point
): string | null {
  const { x, y, width, height } = layer;
  const threshold = 6;

  const handles: Record<string, Point> = {
    "nw": { x, y },
    "ne": { x: x + width, y },
    "sw": { x, y: y + height },
    "se": { x: x + width, y: y + height },
    "n": { x: x + width / 2, y },
    "s": { x: x + width / 2, y: y + height },
    "w": { x, y: y + height / 2 },
    "e": { x: x + width, y: y + height / 2 },
  };

  for (const [dir, hp] of Object.entries(handles)) {
    if (
      Math.abs(point.x - hp.x) <= threshold &&
      Math.abs(point.y - hp.y) <= threshold
    ) {
      return dir;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Document Helpers
// ---------------------------------------------------------------------------

/** Render entire design document to a canvas */
export function renderDocument(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocument,
  opts?: { showSelection?: boolean; showGrid?: boolean }
): void {
  const { width, height, backgroundColor, layers, layerOrder } = doc;

  // Clear
  ctx.clearRect(0, 0, width, height);

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  // Render layers back-to-front (reverse layerOrder since 0 = topmost)
  for (let i = layerOrder.length - 1; i >= 0; i--) {
    const id = layerOrder[i];
    const layer = layers.find((l) => l.id === id);
    if (layer) {
      renderLayer(ctx, layer, layers);
    }
  }

  // Selection handles
  if (opts?.showSelection) {
    for (const id of doc.selectedLayers) {
      const layer = layers.find((l) => l.id === id);
      if (layer) {
        drawSelectionHandles(ctx, layer);
      }
    }
  }
}

/** Re-render a design into different dimensions (for multi-format export) */
export function renderToSize(
  doc: DesignDocument,
  targetWidth: number,
  targetHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d")!;

  const scaleX = targetWidth / doc.width;
  const scaleY = targetHeight / doc.height;

  // Background
  ctx.fillStyle = doc.backgroundColor;
  ctx.fillRect(0, 0, targetWidth, targetHeight);

  // Render each layer scaled
  for (let i = doc.layerOrder.length - 1; i >= 0; i--) {
    const id = doc.layerOrder[i];
    const layer = doc.layers.find((l) => l.id === id);
    if (!layer || !layer.visible) continue;

    // Create a scaled copy
    const scaled = { ...layer };
    scaled.x = layer.x * scaleX;
    scaled.y = layer.y * scaleY;
    scaled.width = layer.width * scaleX;
    scaled.height = layer.height * scaleY;

    // Scale font sizes for text and CTA layers
    if (scaled.type === "text") {
      const t = scaled as TextLayer;
      t.fontSize = Math.round(t.fontSize * Math.min(scaleX, scaleY));
      t.maxWidth = t.maxWidth * scaleX;
      t.letterSpacing = getLetterSpacing(t.fontSize);
      t.lineHeight = getLineHeight(t.fontSize);
    } else if (scaled.type === "cta") {
      const c = scaled as CtaLayer;
      c.fontSize = Math.round(c.fontSize * Math.min(scaleX, scaleY));
      c.paddingX = c.paddingX * scaleX;
      c.paddingY = c.paddingY * scaleY;
    }

    renderLayer(ctx, scaled);
  }

  return canvas;
}

/** Delete a layer from a document */
export function deleteLayer(
  doc: DesignDocument,
  layerId: string
): DesignDocument {
  return {
    ...doc,
    layers: doc.layers.filter((l) => l.id !== layerId),
    layerOrder: doc.layerOrder.filter((id) => id !== layerId),
    selectedLayers: doc.selectedLayers.filter((id) => id !== layerId),
  };
}

/** Move layer in Z-order */
export function reorderLayer(
  doc: DesignDocument,
  layerId: string,
  direction: "up" | "down" | "top" | "bottom"
): DesignDocument {
  const order = [...doc.layerOrder];
  const idx = order.indexOf(layerId);
  if (idx === -1) return doc;

  switch (direction) {
    case "up":
      if (idx > 0) {
        [order[idx], order[idx - 1]] = [order[idx - 1], order[idx]];
      }
      break;
    case "down":
      if (idx < order.length - 1) {
        [order[idx], order[idx + 1]] = [order[idx + 1], order[idx]];
      }
      break;
    case "top":
      order.splice(idx, 1);
      order.unshift(layerId);
      break;
    case "bottom":
      order.splice(idx, 1);
      order.push(layerId);
      break;
  }

  return { ...doc, layerOrder: order };
}

/** Duplicate a layer */
export function duplicateLayer(
  doc: DesignDocument,
  layerId: string
): DesignDocument {
  const layer = doc.layers.find((l) => l.id === layerId);
  if (!layer) return doc;

  const newLayer: Layer = {
    ...JSON.parse(JSON.stringify(layer)),
    id: nextId(),
    name: `${layer.name} copy`,
    x: layer.x + 20,
    y: layer.y + 20,
  };

  const orderIdx = doc.layerOrder.indexOf(layerId);
  const newOrder = [...doc.layerOrder];
  newOrder.splice(orderIdx, 0, newLayer.id);

  return {
    ...doc,
    layers: [...doc.layers, newLayer],
    layerOrder: newOrder,
    selectedLayers: [newLayer.id],
  };
}
