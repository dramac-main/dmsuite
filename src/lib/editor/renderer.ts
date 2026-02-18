// =============================================================================
// DMSuite — vNext Canvas Renderer
// A single renderer that paints a DesignDocumentV2 to a CanvasRenderingContext2D.
// Used by: interactive editor, thumbnail generation, PNG/PDF export.
// Supports: blend modes, effects, masks, gradients, patterns, paths, icons, text.
// =============================================================================

import type {
  DesignDocumentV2, LayerV2, LayerId,
  TextLayerV2, ShapeLayerV2, ImageLayerV2, FrameLayerV2,
  PathLayerV2, IconLayerV2, GroupLayerV2, BooleanGroupLayerV2,
  Paint, GradientPaint, StrokeSpec,
  DropShadowEffect,
  RGBA,
} from "./schema";
import { BLEND_MODE_TO_COMPOSITE, rgbaToHex } from "./schema";
import { drawIcon } from "@/lib/icon-library";
import { roundRect, drawTrackedText, wrapCanvasText } from "@/lib/canvas-utils";
import { drawPattern } from "@/lib/graphics-engine";
import type { PatternPaint } from "./schema";

// ---------------------------------------------------------------------------
// Render Options
// ---------------------------------------------------------------------------

export interface RenderOptions {
  /** Show selection handles */
  showSelection?: boolean;
  /** Show guides and grids */
  showGuides?: boolean;
  /** Show bleed/safe areas */
  showBleedSafe?: boolean;
  /** Scale factor (for export at different DPI) */
  scaleFactor?: number;
  /** Whether to skip effects (for performance during interaction) */
  skipEffects?: boolean;
  /** Only render specific layer IDs (for partial re-render) */
  onlyLayers?: Set<LayerId>;
}

// ---------------------------------------------------------------------------
// Main Render Function
// ---------------------------------------------------------------------------

/** Render an entire DesignDocumentV2 to a canvas context */
export function renderDocumentV2(
  ctx: CanvasRenderingContext2D,
  doc: DesignDocumentV2,
  opts: RenderOptions = {}
): void {
  const scale = opts.scaleFactor ?? 1;
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (!rootFrame) return;

  const w = rootFrame.transform.size.x;
  const h = rootFrame.transform.size.y;

  ctx.save();
  ctx.scale(scale, scale);

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Render root frame (which recursively renders children)
  renderLayerV2(ctx, rootFrame, doc, opts);

  // Show bleed/safe guides
  if (opts.showBleedSafe && rootFrame.bleedMm > 0) {
    const dpi = doc.meta.dpi;
    const bleedPx = (rootFrame.bleedMm / 25.4) * dpi;
    const safePx = (rootFrame.safeAreaMm / 25.4) * dpi;

    // Bleed (red dashed)
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(-bleedPx, -bleedPx, w + bleedPx * 2, h + bleedPx * 2);
    ctx.setLineDash([]);

    // Safe area (blue dashed)
    ctx.strokeStyle = "rgba(0, 100, 255, 0.5)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(safePx, safePx, w - safePx * 2, h - safePx * 2);
    ctx.setLineDash([]);
  }

  // Show guides
  if (opts.showGuides && rootFrame.guides.length > 0) {
    ctx.strokeStyle = "rgba(0, 180, 255, 0.4)";
    ctx.lineWidth = 1;
    for (const guide of rootFrame.guides) {
      ctx.beginPath();
      if (guide.type === "horizontal") {
        ctx.moveTo(0, guide.position);
        ctx.lineTo(w, guide.position);
      } else {
        ctx.moveTo(guide.position, 0);
        ctx.lineTo(guide.position, h);
      }
      ctx.stroke();
    }
  }

  // Selection handles
  if (opts.showSelection && doc.selection.ids.length > 0) {
    for (const id of doc.selection.ids) {
      const layer = doc.layersById[id];
      if (layer) {
        drawSelectionHandlesV2(ctx, layer);
      }
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Layer Renderer (recursive)
// ---------------------------------------------------------------------------

function renderLayerV2(
  ctx: CanvasRenderingContext2D,
  layer: LayerV2,
  doc: DesignDocumentV2,
  opts: RenderOptions
): void {
  if (!layer.visible) return;
  if (opts.onlyLayers && !opts.onlyLayers.has(layer.id)) return;

  ctx.save();

  // Apply opacity
  ctx.globalAlpha *= layer.opacity;

  // Apply blend mode
  if (layer.blendMode !== "normal") {
    ctx.globalCompositeOperation = BLEND_MODE_TO_COMPOSITE[layer.blendMode] as GlobalCompositeOperation;
  }

  // Apply transform (rotation around pivot)
  const t = layer.transform;
  if (t.rotation !== 0) {
    const cx = t.position.x + t.size.x * t.pivot.x;
    const cy = t.position.y + t.size.y * t.pivot.y;
    ctx.translate(cx, cy);
    ctx.rotate((t.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  // Apply effects: pre-effects (shadows go before the main draw)
  if (!opts.skipEffects) {
    applyPreEffects(ctx, layer);
  }

  // Render by type
  switch (layer.type) {
    case "frame":
      renderFrame(ctx, layer as FrameLayerV2, doc, opts);
      break;
    case "text":
      renderText(ctx, layer as TextLayerV2);
      break;
    case "shape":
      renderShape(ctx, layer as ShapeLayerV2);
      break;
    case "image":
      renderImage(ctx, layer as ImageLayerV2);
      break;
    case "icon":
      renderIcon(ctx, layer as IconLayerV2);
      break;
    case "path":
      renderPath(ctx, layer as PathLayerV2);
      break;
    case "group":
    case "boolean-group":
      renderGroup(ctx, layer as GroupLayerV2, doc, opts);
      break;
  }

  // Apply effects: post-effects (outline, glow, noise)
  if (!opts.skipEffects) {
    applyPostEffects(ctx, layer);
  }

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Type-specific renderers
// ---------------------------------------------------------------------------

function renderFrame(ctx: CanvasRenderingContext2D, frame: FrameLayerV2, doc: DesignDocumentV2, opts: RenderOptions): void {
  const { x, y } = frame.transform.position;
  const { x: w, y: h } = frame.transform.size;
  const [tl, tr, br, bl] = frame.cornerRadii;

  // Frame fills
  for (const fill of frame.fills) {
    ctx.save();
    applyPaint(ctx, fill, x, y, w, h);
    if (tl || tr || br || bl) {
      roundRectVarying(ctx, x, y, w, h, tl, tr, br, bl);
      ctx.fill();
    } else {
      ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }

  // Frame strokes
  for (const stroke of frame.strokes) {
    applyStroke(ctx, stroke, x, y, w, h);
    if (tl || tr || br || bl) {
      roundRectVarying(ctx, x, y, w, h, tl, tr, br, bl);
      ctx.stroke();
    } else {
      ctx.strokeRect(x, y, w, h);
    }
  }

  // Clip children if enabled
  if (frame.clipContent) {
    ctx.save();
    ctx.beginPath();
    if (tl || tr || br || bl) {
      roundRectVarying(ctx, x, y, w, h, tl, tr, br, bl);
    } else {
      ctx.rect(x, y, w, h);
    }
    ctx.clip();
  }

  // Render children (back-to-front: last child in array renders first, then earlier ones on top)
  for (let i = frame.children.length - 1; i >= 0; i--) {
    const child = doc.layersById[frame.children[i]];
    if (child) renderLayerV2(ctx, child, doc, opts);
  }

  if (frame.clipContent) {
    ctx.restore();
  }
}

function renderText(ctx: CanvasRenderingContext2D, layer: TextLayerV2): void {
  const { x, y } = layer.transform.position;
  const { x: w } = layer.transform.size;
  const s = layer.defaultStyle;

  const displayText = s.uppercase ? layer.text.toUpperCase() : layer.text;
  const italic = s.italic ? "italic " : "";
  ctx.font = `${italic}${s.fontWeight} ${s.fontSize}px ${s.fontFamily}`;
  ctx.textBaseline = "top";

  const lines = wrapCanvasText(ctx, displayText, w);
  const leading = s.lineHeight * s.fontSize;

  let textX = x;
  const align = layer.paragraphs[0]?.align ?? "left";
  if (align === "center") textX = x + w / 2;
  else if (align === "right") textX = x + w;

  // Apply fill
  const fillColor = paintToCSS(s.fill);
  ctx.fillStyle = fillColor;

  for (let i = 0; i < lines.length; i++) {
    const ly = y + i * leading;
    drawTrackedText(ctx, lines[i], textX, ly, s.letterSpacing, align as CanvasTextAlign);
  }
}

function renderShape(ctx: CanvasRenderingContext2D, layer: ShapeLayerV2): void {
  const { x, y } = layer.transform.position;
  const { x: w, y: h } = layer.transform.size;
  const [tl, tr, br, bl] = layer.cornerRadii;

  // Fills
  for (const fill of layer.fills) {
    ctx.save();
    applyPaint(ctx, fill, x, y, w, h);

    switch (layer.shapeType) {
      case "rectangle":
        if (tl || tr || br || bl) {
          roundRectVarying(ctx, x, y, w, h, tl, tr, br, bl);
          ctx.fill();
        } else {
          ctx.fillRect(x, y, w, h);
        }
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        break;
      case "polygon":
      case "star":
        drawPolygonOrStar(ctx, x, y, w, h, layer.sides, layer.shapeType === "star" ? layer.innerRadiusRatio : 1);
        ctx.fill();
        break;
      case "line":
        // Lines only have strokes
        break;
    }
    ctx.restore();
  }

  // Strokes
  for (const stroke of layer.strokes) {
    applyStroke(ctx, stroke, x, y, w, h);
    switch (layer.shapeType) {
      case "rectangle":
        if (tl || tr || br || bl) {
          roundRectVarying(ctx, x, y, w, h, tl, tr, br, bl);
          ctx.stroke();
        } else {
          ctx.strokeRect(x, y, w, h);
        }
        break;
      case "ellipse":
        ctx.beginPath();
        ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
        ctx.stroke();
        break;
      case "triangle":
        ctx.beginPath();
        ctx.moveTo(x + w / 2, y);
        ctx.lineTo(x + w, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.stroke();
        break;
      case "polygon":
      case "star":
        drawPolygonOrStar(ctx, x, y, w, h, layer.sides, layer.shapeType === "star" ? layer.innerRadiusRatio : 1);
        ctx.stroke();
        break;
      case "line":
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + h);
        ctx.stroke();
        break;
    }
  }
}

function renderImage(ctx: CanvasRenderingContext2D, layer: ImageLayerV2): void {
  const img = layer._imageElement;
  if (!img) return;

  const { x, y } = layer.transform.position;
  const { x: w, y: h } = layer.transform.size;

  ctx.save();

  // Corner clip
  if (layer.cornerRadius > 0) {
    roundRect(ctx, x, y, w, h, layer.cornerRadius);
    ctx.clip();
  }

  // Image filters
  const f = layer.imageFilters;
  const filters: string[] = [];
  if (f.brightness !== 0) filters.push(`brightness(${1 + f.brightness / 100})`);
  if (f.contrast !== 0) filters.push(`contrast(${1 + f.contrast / 100})`);
  if (f.saturation !== 0) filters.push(`saturate(${1 + f.saturation / 100})`);
  if (f.blur > 0) filters.push(`blur(${f.blur}px)`);
  if (f.grayscale) filters.push("grayscale(1)");
  if (f.sepia) filters.push("sepia(1)");
  if (filters.length > 0) ctx.filter = filters.join(" ");

  // Draw image with fit
  if (layer.fit === "cover") {
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const layerAspect = w / h;
    let sw: number, sh: number, sx: number, sy: number;
    if (imgAspect > layerAspect) {
      sh = img.naturalHeight;
      sw = sh * layerAspect;
      sx = (img.naturalWidth - sw) * layer.focalPoint.x;
      sy = 0;
    } else {
      sw = img.naturalWidth;
      sh = sw / layerAspect;
      sx = 0;
      sy = (img.naturalHeight - sh) * layer.focalPoint.y;
    }
    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
  } else if (layer.fit === "contain") {
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const layerAspect = w / h;
    let dw: number, dh: number;
    if (imgAspect > layerAspect) { dw = w; dh = dw / imgAspect; }
    else { dh = h; dw = dh * imgAspect; }
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    ctx.drawImage(img, x, y, w, h);
  }

  ctx.filter = "none";

  // Overlay fills
  for (const fill of layer.fills) {
    ctx.save();
    applyPaint(ctx, fill, x, y, w, h);
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  ctx.restore();
}

function renderIcon(ctx: CanvasRenderingContext2D, layer: IconLayerV2): void {
  const { x, y } = layer.transform.position;
  const sz = Math.min(layer.transform.size.x, layer.transform.size.y);
  const color = rgbaToHex(layer.color);
  drawIcon(ctx, layer.iconId, x + sz / 2, y + sz / 2, sz, color, layer.strokeWidth);
}

function renderPath(ctx: CanvasRenderingContext2D, layer: PathLayerV2): void {
  const { x, y } = layer.transform.position;
  const path2d = geometryToPath2D(layer.geometry.commands, x, y);

  for (const fill of layer.fills) {
    ctx.save();
    applyPaintDirect(ctx, fill);
    ctx.fill(path2d, layer.geometry.fillRule);
    ctx.restore();
  }

  for (const stroke of layer.strokes) {
    ctx.save();
    applyPaintDirect(ctx, stroke.paint);
    ctx.lineWidth = stroke.width;
    ctx.lineCap = stroke.cap;
    ctx.lineJoin = stroke.join;
    ctx.miterLimit = stroke.miterLimit;
    if (stroke.dash.length > 0) ctx.setLineDash(stroke.dash);
    ctx.stroke(path2d);
    ctx.restore();
  }
}

function renderGroup(ctx: CanvasRenderingContext2D, group: GroupLayerV2 | BooleanGroupLayerV2, doc: DesignDocumentV2, opts: RenderOptions): void {
  for (let i = group.children.length - 1; i >= 0; i--) {
    const child = doc.layersById[group.children[i]];
    if (child) renderLayerV2(ctx, child, doc, opts);
  }
}

// ---------------------------------------------------------------------------
// Paint Helpers
// ---------------------------------------------------------------------------

function applyPaint(ctx: CanvasRenderingContext2D, paint: Paint, x: number, y: number, w: number, h: number): void {
  switch (paint.kind) {
    case "solid":
      ctx.fillStyle = rgbaToCSS(paint.color);
      break;
    case "gradient": {
      const grad = createCanvasGradient(ctx, paint, x, y, w, h);
      if (grad) ctx.fillStyle = grad;
      break;
    }
    case "pattern": {
      // Render the actual pattern using graphics-engine drawPattern
      const pp = paint as PatternPaint;
      const ppColor = rgbaToCSS(pp.color);
      drawPattern(ctx, x, y, w, h, pp.patternType as Parameters<typeof drawPattern>[5], ppColor, pp.opacity, pp.spacing);
      return; // drawPattern handles everything, skip ctx.fill()
    }
    case "image":
      // Image paint handled separately
      break;
  }
}

function applyPaintDirect(ctx: CanvasRenderingContext2D, paint: Paint): void {
  if (paint.kind === "solid") {
    ctx.fillStyle = rgbaToCSS(paint.color);
    ctx.strokeStyle = rgbaToCSS(paint.color);
  }
}

function applyStroke(ctx: CanvasRenderingContext2D, stroke: StrokeSpec, x: number, y: number, w: number, h: number): void {
  if (stroke.paint.kind === "solid") {
    ctx.strokeStyle = rgbaToCSS(stroke.paint.color);
  } else if (stroke.paint.kind === "gradient") {
    const grad = createCanvasGradient(ctx, stroke.paint, x, y, w, h);
    if (grad) ctx.strokeStyle = grad;
  }
  ctx.lineWidth = stroke.width;
  ctx.lineCap = stroke.cap;
  ctx.lineJoin = stroke.join;
  ctx.miterLimit = stroke.miterLimit;
  if (stroke.dash.length > 0) ctx.setLineDash(stroke.dash);
}

function createCanvasGradient(
  ctx: CanvasRenderingContext2D,
  paint: GradientPaint,
  x: number, y: number, w: number, h: number
): CanvasGradient | null {
  let grad: CanvasGradient;
  const cx = x + w / 2;
  const cy = y + h / 2;

  switch (paint.gradientType) {
    case "linear": {
      // Use transform to determine angle
      const angle = Math.atan2(paint.transform[1], paint.transform[0]);
      const len = Math.max(w, h) / 2;
      grad = ctx.createLinearGradient(
        cx - Math.cos(angle) * len, cy - Math.sin(angle) * len,
        cx + Math.cos(angle) * len, cy + Math.sin(angle) * len
      );
      break;
    }
    case "radial":
      grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) / 2);
      break;
    default:
      // Angular/diamond fallback to linear
      grad = ctx.createLinearGradient(x, y, x + w, y + h);
  }

  for (const stop of paint.stops) {
    grad.addColorStop(stop.offset, rgbaToCSS(stop.color));
  }
  return grad;
}

// ---------------------------------------------------------------------------
// Effects
// ---------------------------------------------------------------------------

function applyPreEffects(ctx: CanvasRenderingContext2D, layer: LayerV2): void {
  for (const effect of layer.effects) {
    if (!effect.enabled) continue;
    switch (effect.type) {
      case "drop-shadow": {
        const e = effect as DropShadowEffect;
        ctx.shadowColor = rgbaToCSS(e.color);
        ctx.shadowBlur = e.blur;
        ctx.shadowOffsetX = e.offsetX;
        ctx.shadowOffsetY = e.offsetY;
        break;
      }
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function applyPostEffects(_ctx: CanvasRenderingContext2D, _layer: LayerV2): void {
  // Post-effects (outline, glow, noise) require off-screen compositing
  // Placeholder for future implementation
}

// ---------------------------------------------------------------------------
// Selection Handles
// ---------------------------------------------------------------------------

export function drawSelectionHandlesV2(ctx: CanvasRenderingContext2D, layer: LayerV2): void {
  const { x, y } = layer.transform.position;
  const { x: w, y: h } = layer.transform.size;
  const handleSize = 8;
  const half = handleSize / 2;

  ctx.save();

  // Apply rotation for selection handles to match layer
  if (layer.transform.rotation !== 0) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    ctx.translate(cx, cy);
    ctx.rotate((layer.transform.rotation * Math.PI) / 180);
    ctx.translate(-cx, -cy);
  }

  // Selection outline
  ctx.strokeStyle = "#8ae600";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(x - 1, y - 1, w + 2, h + 2);
  ctx.setLineDash([]);

  // Corner + edge handles
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#8ae600";
  ctx.lineWidth = 2;

  const handles = [
    { cx: x, cy: y },           // NW
    { cx: x + w, cy: y },       // NE
    { cx: x, cy: y + h },       // SW
    { cx: x + w, cy: y + h },   // SE
    { cx: x + w / 2, cy: y },         // N
    { cx: x + w / 2, cy: y + h },     // S
    { cx: x, cy: y + h / 2 },         // W
    { cx: x + w, cy: y + h / 2 },     // E
  ];

  for (const handle of handles) {
    ctx.fillRect(handle.cx - half, handle.cy - half, handleSize, handleSize);
    ctx.strokeRect(handle.cx - half, handle.cy - half, handleSize, handleSize);
  }

  // Rotation handle (above top center)
  const rotHandleY = y - 24;
  ctx.beginPath();
  ctx.arc(x + w / 2, rotHandleY, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#8ae600";
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Line from rotation handle to top center
  ctx.strokeStyle = "#8ae600";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + w / 2, rotHandleY + 5);
  ctx.lineTo(x + w / 2, y);
  ctx.stroke();

  ctx.restore();
}

// ---------------------------------------------------------------------------
// Geometry Helpers
// ---------------------------------------------------------------------------

function roundRectVarying(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  tl: number, tr: number, br: number, bl: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  if (tr) ctx.arcTo(x + w, y, x + w, y + tr, tr);
  ctx.lineTo(x + w, y + h - br);
  if (br) ctx.arcTo(x + w, y + h, x + w - br, y + h, br);
  ctx.lineTo(x + bl, y + h);
  if (bl) ctx.arcTo(x, y + h, x, y + h - bl, bl);
  ctx.lineTo(x, y + tl);
  if (tl) ctx.arcTo(x, y, x + tl, y, tl);
  ctx.closePath();
}

function drawPolygonOrStar(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  sides: number, innerRatio: number
): void {
  const cx = x + w / 2;
  const cy = y + h / 2;
  const outerR = Math.min(w, h) / 2;
  const innerR = outerR * innerRatio;
  const isStar = innerRatio < 1;
  const points = isStar ? sides * 2 : sides;
  const angleStep = (Math.PI * 2) / points;
  const startAngle = -Math.PI / 2;

  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = startAngle + i * angleStep;
    const r = isStar ? (i % 2 === 0 ? outerR : innerR) : outerR;
    const px = cx + r * Math.cos(angle);
    const py = cy + r * Math.sin(angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function geometryToPath2D(commands: PathLayerV2["geometry"]["commands"], offsetX: number, offsetY: number): Path2D {
  const p = new Path2D();
  for (const cmd of commands) {
    switch (cmd.type) {
      case "M": p.moveTo(cmd.x + offsetX, cmd.y + offsetY); break;
      case "L": p.lineTo(cmd.x + offsetX, cmd.y + offsetY); break;
      case "C": p.bezierCurveTo(cmd.cp1x + offsetX, cmd.cp1y + offsetY, cmd.cp2x + offsetX, cmd.cp2y + offsetY, cmd.x + offsetX, cmd.y + offsetY); break;
      case "Q": p.quadraticCurveTo(cmd.cpx + offsetX, cmd.cpy + offsetY, cmd.x + offsetX, cmd.y + offsetY); break;
      case "Z": p.closePath(); break;
    }
  }
  return p;
}

/** Convert RGBA to CSS string */
function rgbaToCSS(c: RGBA): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${c.a})`;
}

/** Convert a Paint to a single CSS color string (for simple cases) */
function paintToCSS(paint: Paint): string {
  if (paint.kind === "solid") return rgbaToCSS(paint.color);
  return "#000000";
}

// ---------------------------------------------------------------------------
// Export: render to off-screen canvas
// ---------------------------------------------------------------------------

/** Render document to an off-screen canvas at specified scale */
export function renderToCanvas(doc: DesignDocumentV2, scale = 1): HTMLCanvasElement {
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (!rootFrame) throw new Error("No root frame");

  const w = rootFrame.transform.size.x;
  const h = rootFrame.transform.size.y;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d")!;

  renderDocumentV2(ctx, doc, { scaleFactor: scale });
  return canvas;
}
