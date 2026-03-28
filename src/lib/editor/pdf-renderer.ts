// =============================================================================
// DMSuite — Vector PDF Renderer (pdf-lib)
//
// Renders a DesignDocumentV2 to a vector PDF. Text is selectable/searchable,
// shapes are true vector paths, and images are embedded at full resolution.
// Icons use a small raster fallback (Canvas2D → PNG → embed) since they're
// defined as imperative Canvas2D draw functions.
//
// Replaces the old raster pipeline: renderToCanvas() → jsPDF.addImage()
//
// Usage:
//   import { renderDocumentToPdf } from "@/lib/editor/pdf-renderer";
//   const pdfBytes = await renderDocumentToPdf(doc, { fileName: "certificate" });
//   // or: downloadPdf(pdfBytes, "certificate.pdf");
// =============================================================================

import {
  PDFDocument,
  PDFPage,
  PDFFont,
  StandardFonts,
  rgb,
  degrees,
  LineCapStyle,
  LineJoinStyle,
} from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

import type {
  DesignDocumentV2,
  LayerV2,
  TextLayerV2,
  ShapeLayerV2,
  ImageLayerV2,
  FrameLayerV2,
  PathLayerV2,
  IconLayerV2,
  GroupLayerV2,
  BooleanGroupLayerV2,
  RGBA,
  Paint,
  StrokeSpec,
  PathCommand,
} from "./schema";
import { renderDocumentV2 } from "./renderer";

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PdfRenderOptions {
  /** Optional filename (without .pdf extension) — used for metadata */
  fileName?: string;
  /** Author metadata */
  author?: string;
  /** Scale factor from canvas px to PDF points (default: auto-calculated) */
  scaleFactor?: number;
  /** Whether to include a raster fallback for complex layers like icons (default: true) */
  rasterFallback?: boolean;
}

/**
 * Render a DesignDocumentV2 to a PDF as Uint8Array.
 * Text layers are vector (selectable), shapes are vector paths.
 * Icons and complex paints fall back to embedded raster images.
 */
export async function renderDocumentToPdf(
  doc: DesignDocumentV2,
  opts: PdfRenderOptions = {},
): Promise<Uint8Array> {
  const rootFrame = doc.layersById[doc.rootFrameId] as FrameLayerV2 | undefined;
  if (!rootFrame) throw new Error("Document has no root frame");

  const canvasW = rootFrame.transform.size.x;
  const canvasH = rootFrame.transform.size.y;

  // PDF page size in points (1pt = 1/72 inch)
  // Canvas px → points:  px / dpi * 72
  const dpi = doc.meta.dpi || 300;
  const pxToPt = 72 / dpi;
  // But our canvas units are design pixels at 72dpi equivalent for screen layout
  // So typically: 1 canvas px ≈ 1 PDF point for screen-resolution designs
  // For print designs at 300dpi: the document already has correct pixel dimensions
  // We'll use a scale that maps the full canvas to a standard page size
  const scale = opts.scaleFactor ?? 1;
  const pageW = canvasW * scale;
  const pageH = canvasH * scale;

  const pdfDoc = await PDFDocument.create();

  // Metadata
  pdfDoc.setTitle(opts.fileName ?? doc.name ?? "DMSuite Export");
  pdfDoc.setProducer("DMSuite AI Creative Suite");
  if (opts.author) pdfDoc.setAuthor(opts.author);
  pdfDoc.setCreationDate(new Date());

  const page = pdfDoc.addPage([pageW, pageH]);

  // Embed standard fonts for text rendering
  const fontCache = await loadFontCache(pdfDoc);

  // Load custom Google Fonts for accurate text rendering
  const customFontCache = await loadCustomFonts(pdfDoc, doc);

  const ctx: PdfRenderContext = {
    pdfDoc,
    page,
    doc,
    scale,
    pageH,
    fontCache,
    customFontCache,
    rasterFallback: opts.rasterFallback ?? true,
  };

  // Render the root frame
  await renderLayerToPdf(ctx, rootFrame);

  return pdfDoc.save();
}

/**
 * Download PDF bytes as a file in the browser.
 */
export function downloadPdf(pdfBytes: Uint8Array, fileName: string): void {
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Internal Types
// ---------------------------------------------------------------------------

interface PdfRenderContext {
  pdfDoc: PDFDocument;
  page: PDFPage;
  doc: DesignDocumentV2;
  scale: number;
  pageH: number; // page height for Y-flip
  fontCache: FontCache;
  customFontCache: Map<string, PDFFont>;
  rasterFallback: boolean;
}

interface FontCache {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  boldItalic: PDFFont;
}

// ---------------------------------------------------------------------------
// Font Loading
// ---------------------------------------------------------------------------

async function loadFontCache(pdfDoc: PDFDocument): Promise<FontCache> {
  const [regular, bold, italic, boldItalic] = await Promise.all([
    pdfDoc.embedFont(StandardFonts.Helvetica),
    pdfDoc.embedFont(StandardFonts.HelveticaBold),
    pdfDoc.embedFont(StandardFonts.HelveticaOblique),
    pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
  ]);
  return { regular, bold, italic, boldItalic };
}

/**
 * Load custom Google Fonts for PDF embedding via the server-side font API.
 * Scans all text layers in the document and fetches the needed TTF binaries.
 */
async function loadCustomFonts(
  pdfDoc: PDFDocument,
  doc: DesignDocumentV2,
): Promise<Map<string, PDFFont>> {
  const customFonts = new Map<string, PDFFont>();

  // Collect unique font specs from text layers
  const fontSpecs = new Set<string>();
  const SYSTEM_FONTS = new Set([
    "inter", "arial", "helvetica", "helvetica neue", "georgia",
    "times new roman", "courier new", "sans-serif", "serif", "monospace",
  ]);

  for (const layer of Object.values(doc.layersById)) {
    if (layer.type !== "text") continue;
    const textLayer = layer as TextLayerV2;
    const ds = textLayer.defaultStyle;
    if (ds?.fontFamily) {
      const normalized = ds.fontFamily.toLowerCase().replace(/['"]/g, "").trim();
      if (!SYSTEM_FONTS.has(normalized)) {
        const weight = ds.fontWeight ?? 400;
        const style = ds.italic ? "italic" : "normal";
        fontSpecs.add(`${ds.fontFamily}|${weight}|${style}`);
      }
    }
    for (const run of textLayer.runs ?? []) {
      if (run.style?.fontFamily) {
        const normalized = run.style.fontFamily.toLowerCase().replace(/['"]/g, "").trim();
        if (!SYSTEM_FONTS.has(normalized)) {
          const weight = run.style.fontWeight ?? ds?.fontWeight ?? 400;
          const style = (run.style.italic ?? ds?.italic) ? "italic" : "normal";
          fontSpecs.add(`${run.style.fontFamily}|${weight}|${style}`);
        }
      }
    }
  }

  if (fontSpecs.size === 0) return customFonts;

  // Register fontkit for custom font embedding
  pdfDoc.registerFontkit(fontkit);

  // Fetch and embed each font
  const promises = [...fontSpecs].map(async (spec) => {
    const [family, weight, style] = spec.split("|");
    const key = spec;
    try {
      const url = `/api/fonts?family=${encodeURIComponent(family)}&weight=${weight}&style=${style}`;
      const response = await fetch(url);
      if (!response.ok) return;

      const ttfBytes = await response.arrayBuffer();
      const pdfFont = await pdfDoc.embedFont(new Uint8Array(ttfBytes), { subset: true });
      customFonts.set(key, pdfFont);
    } catch {
      console.warn(`[pdf-renderer] Failed to embed font: ${family} ${weight} ${style}`);
    }
  });

  await Promise.all(promises);
  return customFonts;
}

function selectFont(cache: FontCache, weight: number, isItalic: boolean, fontFamily?: string, customFonts?: Map<string, PDFFont>): PDFFont {
  // Try custom font first
  if (fontFamily && customFonts && customFonts.size > 0) {
    const style = isItalic ? "italic" : "normal";
    const key = `${fontFamily}|${weight}|${style}`;
    const custom = customFonts.get(key);
    if (custom) return custom;

    // Try exact family with different weight (fallback to closest)
    for (const [k, font] of customFonts) {
      if (k.startsWith(`${fontFamily}|`)) return font;
    }
  }

  // Fallback to Helvetica variants
  const isBold = weight >= 600;
  if (isBold && isItalic) return cache.boldItalic;
  if (isBold) return cache.bold;
  if (isItalic) return cache.italic;
  return cache.regular;
}

// ---------------------------------------------------------------------------
// Color Helpers
// ---------------------------------------------------------------------------

function rgbaToRgb(c: RGBA) {
  return rgb(
    Math.max(0, Math.min(1, (c.r ?? 0) / 255)),
    Math.max(0, Math.min(1, (c.g ?? 0) / 255)),
    Math.max(0, Math.min(1, (c.b ?? 0) / 255)),
  );
}

function rgbaOpacity(c: RGBA): number {
  return c.a ?? 1;
}

function paintToRgb(paint: Paint | undefined) {
  if (!paint) return { color: rgb(0, 0, 0), opacity: 1, needsRaster: false };
  if (paint.kind === "solid" && paint.color) {
    return { color: rgbaToRgb(paint.color), opacity: rgbaOpacity(paint.color), needsRaster: false };
  }
  // Non-solid paints (gradient, pattern, image) need raster fallback
  return { color: rgb(0, 0, 0), opacity: 1, needsRaster: true };
}

// ---------------------------------------------------------------------------
// Coordinate System
//
// pdf-lib uses bottom-left origin; our canvas uses top-left origin.
// flipY(y, h) converts from canvas coords to PDF coords.
// ---------------------------------------------------------------------------

function flipY(ctx: PdfRenderContext, y: number): number {
  return ctx.pageH - y * ctx.scale;
}

function s(ctx: PdfRenderContext, v: number): number {
  return v * ctx.scale;
}

// ---------------------------------------------------------------------------
// Raster Fallback — for layers with gradients, patterns, or complex effects
// Renders the layer via Canvas2D at high DPI and embeds as PNG in PDF
// ---------------------------------------------------------------------------

async function renderLayerAsRaster(ctx: PdfRenderContext, layer: LayerV2): Promise<void> {
  const x = layer.transform.position.x;
  const y = layer.transform.position.y;
  const w = layer.transform.size.x;
  const h = layer.transform.size.y;
  if (w <= 0 || h <= 0) return;

  const dpr = 4; // 4x for print quality
  const pad = 50 * dpr; // Padding for effects overflow
  const canvasW = Math.ceil(w * dpr) + pad * 2;
  const canvasH = Math.ceil(h * dpr) + pad * 2;

  try {
    const tmpCanvas = document.createElement("canvas");
    tmpCanvas.width = canvasW;
    tmpCanvas.height = canvasH;
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return;

    // Set up coordinate system to center the layer
    tmpCtx.translate(pad, pad);
    tmpCtx.scale(dpr, dpr);
    tmpCtx.translate(-x, -y);

    // Create a mini-doc with just this layer and its parent frame
    // Render via the Canvas2D renderer
    renderDocumentV2(tmpCtx, ctx.doc, {
      scaleFactor: 1,
      onlyLayers: new Set([layer.id]),
    });

    const pngDataUrl = tmpCanvas.toDataURL("image/png");
    const pngBytes = dataUrlToUint8Array(pngDataUrl);
    const pdfImage = await ctx.pdfDoc.embedPng(pngBytes);

    const padPt = (pad / dpr) * ctx.scale;
    ctx.page.drawImage(pdfImage, {
      x: s(ctx, x) - padPt,
      y: flipY(ctx, y + h) - padPt,
      width: s(ctx, w) + padPt * 2,
      height: s(ctx, h) + padPt * 2,
      opacity: layer.opacity,
    });
  } catch {
    // Silently fall back to vector rendering if raster fails
  }
}

/** Check if a layer has complex effects that need raster fallback */
function hasComplexEffects(layer: LayerV2): boolean {
  return layer.effects.some(
    (e) => e.enabled && e.type !== "drop-shadow",
  );
}

/** Check if a layer has non-solid fills that need raster fallback */
function hasNonSolidFills(layer: LayerV2): boolean {
  if ("fills" in layer) {
    const fills = (layer as ShapeLayerV2).fills;
    return fills?.some((f) => f.kind !== "solid") ?? false;
  }
  if (layer.type === "text") {
    const textLayer = layer as TextLayerV2;
    const fill = textLayer.defaultStyle?.fill;
    return fill ? fill.kind !== "solid" : false;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Layer Dispatcher (recursive)
// ---------------------------------------------------------------------------

async function renderLayerToPdf(ctx: PdfRenderContext, layer: LayerV2): Promise<void> {
  if (!layer.visible) return;
  if (layer.opacity <= 0) return;

  // Use raster fallback for layers with complex effects or non-solid paints
  if (ctx.rasterFallback && (hasComplexEffects(layer) || hasNonSolidFills(layer))) {
    await renderLayerAsRaster(ctx, layer);
    return;
  }

  switch (layer.type) {
    case "frame":
      await renderFrameToPdf(ctx, layer as FrameLayerV2);
      break;
    case "text":
      renderTextToPdf(ctx, layer as TextLayerV2);
      break;
    case "shape":
      renderShapeToPdf(ctx, layer as ShapeLayerV2);
      break;
    case "image":
      await renderImageToPdf(ctx, layer as ImageLayerV2);
      break;
    case "icon":
      await renderIconToPdf(ctx, layer as IconLayerV2);
      break;
    case "path":
      renderPathToPdf(ctx, layer as PathLayerV2);
      break;
    case "group":
    case "boolean-group":
      await renderGroupToPdf(ctx, layer as GroupLayerV2 | BooleanGroupLayerV2);
      break;
  }
}

// ---------------------------------------------------------------------------
// Frame
// ---------------------------------------------------------------------------

async function renderFrameToPdf(ctx: PdfRenderContext, frame: FrameLayerV2): Promise<void> {
  const x = frame.transform.position.x;
  const y = frame.transform.position.y;
  const w = frame.transform.size.x;
  const h = frame.transform.size.y;

  // Draw frame fills
  for (const fill of frame.fills) {
    const { color, opacity } = paintToRgb(fill);
    if (fill.kind === "solid") {
      ctx.page.drawRectangle({
        x: s(ctx, x),
        y: flipY(ctx, y + h),
        width: s(ctx, w),
        height: s(ctx, h),
        color,
        opacity: opacity * frame.opacity,
      });
    }
  }

  // Draw frame strokes
  for (const stroke of frame.strokes) {
    drawStrokeRect(ctx, x, y, w, h, stroke, frame.opacity);
  }

  // Render children (in order: first = back, last = front)
  for (const childId of frame.children) {
    const child = ctx.doc.layersById[childId];
    if (child) await renderLayerToPdf(ctx, child);
  }
}

// ---------------------------------------------------------------------------
// Text (VECTOR — selectable, searchable)
// ---------------------------------------------------------------------------

function renderTextToPdf(ctx: PdfRenderContext, layer: TextLayerV2): void {
  if (!layer.text) return;
  const st = layer.defaultStyle;
  if (!st) return;

  const x = layer.transform.position.x;
  const y = layer.transform.position.y;
  const boxW = layer.transform.size.x;

  const displayText = st.uppercase ? layer.text.toUpperCase() : layer.text;
  const fontSize = (st.fontSize || 16) * ctx.scale;
  const weight = st.fontWeight || 400;
  const isItalic = st.italic || false;
  const font = selectFont(ctx.fontCache, weight, isItalic, st.fontFamily, ctx.customFontCache);
  const lineHeight = (st.lineHeight || 1.4) * fontSize;
  const align = layer.paragraphs?.[0]?.align ?? "left";

  // Fill color from paint
  const fillPaint = st.fill;
  const { color, opacity } = paintToRgb(fillPaint);
  const layerOpacity = layer.opacity * opacity;

  // Word-wrap text to box width
  const lines = wrapTextForPdf(font, displayText, fontSize, s(ctx, boxW));

  // Handle rotation
  const rotation = layer.transform.rotation || 0;
  const rotOpt = rotation !== 0 ? { rotate: degrees(-rotation) } : {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineW = font.widthOfTextAtSize(line, fontSize);
    const lineY = y + i * (lineHeight / ctx.scale) + fontSize / ctx.scale;

    let lineX = x;
    if (align === "center") lineX = x + (boxW - lineW / ctx.scale) / 2;
    else if (align === "right") lineX = x + boxW - lineW / ctx.scale;

    ctx.page.drawText(line, {
      x: s(ctx, lineX),
      y: flipY(ctx, lineY),
      size: fontSize,
      font,
      color,
      opacity: layerOpacity,
      ...rotOpt,
    });
  }

  // Underline
  if (st.underline) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineW = font.widthOfTextAtSize(line, fontSize);
      const lineY = y + (i + 1) * (lineHeight / ctx.scale);
      let lineX = x;
      if (align === "center") lineX = x + (boxW - lineW / ctx.scale) / 2;
      else if (align === "right") lineX = x + boxW - lineW / ctx.scale;

      ctx.page.drawLine({
        start: { x: s(ctx, lineX), y: flipY(ctx, lineY + 2) },
        end: { x: s(ctx, lineX) + lineW, y: flipY(ctx, lineY + 2) },
        thickness: Math.max(1, fontSize * 0.05),
        color,
        opacity: layerOpacity,
      });
    }
  }
}

/** Simple word-wrap for PDF text rendering */
function wrapTextForPdf(font: PDFFont, text: string, fontSize: number, maxWidth: number): string[] {
  if (maxWidth <= 0) return [text];
  const paragraphs = text.split("\n");
  const result: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      result.push("");
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = font.widthOfTextAtSize(testLine, fontSize);

      if (testWidth > maxWidth && currentLine) {
        result.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) result.push(currentLine);
  }

  return result.length > 0 ? result : [""];
}

// ---------------------------------------------------------------------------
// Shape (VECTOR — true vector paths)
// ---------------------------------------------------------------------------

function renderShapeToPdf(ctx: PdfRenderContext, layer: ShapeLayerV2): void {
  const x = layer.transform.position.x;
  const y = layer.transform.position.y;
  const w = layer.transform.size.x;
  const h = layer.transform.size.y;
  const [tl, tr, br, bl] = layer.cornerRadii;

  switch (layer.shapeType) {
    case "rectangle": {
      // Fills
      for (const fill of layer.fills) {
        const { color, opacity } = paintToRgb(fill);
        if (fill.kind === "solid") {
          if (tl || tr || br || bl) {
            drawRoundedRect(ctx, x, y, w, h, tl, tr, br, bl, {
              fillColor: color,
              fillOpacity: opacity * layer.opacity,
            });
          } else {
            ctx.page.drawRectangle({
              x: s(ctx, x),
              y: flipY(ctx, y + h),
              width: s(ctx, w),
              height: s(ctx, h),
              color,
              opacity: opacity * layer.opacity,
            });
          }
        }
      }
      // Strokes
      for (const stroke of layer.strokes) {
        if (tl || tr || br || bl) {
          drawRoundedRect(ctx, x, y, w, h, tl, tr, br, bl, {
            strokeColor: paintToRgb(stroke.paint).color,
            strokeOpacity: paintToRgb(stroke.paint).opacity * layer.opacity,
            strokeWidth: s(ctx, stroke.width),
          });
        } else {
          drawStrokeRect(ctx, x, y, w, h, stroke, layer.opacity);
        }
      }
      break;
    }
    case "ellipse": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      for (const fill of layer.fills) {
        const { color, opacity } = paintToRgb(fill);
        if (fill.kind === "solid") {
          ctx.page.drawEllipse({
            x: s(ctx, cx),
            y: flipY(ctx, cy),
            xScale: s(ctx, w / 2),
            yScale: s(ctx, h / 2),
            color,
            opacity: opacity * layer.opacity,
          });
        }
      }
      for (const stroke of layer.strokes) {
        const { color, opacity } = paintToRgb(stroke.paint);
        ctx.page.drawEllipse({
          x: s(ctx, cx),
          y: flipY(ctx, cy),
          xScale: s(ctx, w / 2),
          yScale: s(ctx, h / 2),
          borderColor: color,
          borderWidth: s(ctx, stroke.width),
          borderOpacity: opacity * layer.opacity,
        });
      }
      break;
    }
    case "triangle": {
      const pts = [
        { x: x + w / 2, y: y },
        { x: x + w, y: y + h },
        { x: x, y: y + h },
      ];
      for (const fill of layer.fills) {
        const { color, opacity } = paintToRgb(fill);
        if (fill.kind === "solid") {
          drawPolygonPath(ctx, pts, { fillColor: color, fillOpacity: opacity * layer.opacity });
        }
      }
      for (const stroke of layer.strokes) {
        const { color, opacity } = paintToRgb(stroke.paint);
        drawPolygonPath(ctx, pts, {
          strokeColor: color,
          strokeOpacity: opacity * layer.opacity,
          strokeWidth: s(ctx, stroke.width),
        });
      }
      break;
    }
    case "polygon":
    case "star": {
      const cx = x + w / 2;
      const cy = y + h / 2;
      const outerR = Math.min(w, h) / 2;
      const innerR = outerR * (layer.shapeType === "star" ? layer.innerRadiusRatio : 1);
      const isStar = layer.innerRadiusRatio < 1 && layer.shapeType === "star";
      const numPoints = isStar ? layer.sides * 2 : layer.sides;
      const angleStep = (Math.PI * 2) / numPoints;
      const startAngle = -Math.PI / 2;

      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < numPoints; i++) {
        const angle = startAngle + i * angleStep;
        const r = isStar ? (i % 2 === 0 ? outerR : innerR) : outerR;
        pts.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
      }
      for (const fill of layer.fills) {
        const { color, opacity } = paintToRgb(fill);
        if (fill.kind === "solid") {
          drawPolygonPath(ctx, pts, { fillColor: color, fillOpacity: opacity * layer.opacity });
        }
      }
      for (const stroke of layer.strokes) {
        const { color, opacity } = paintToRgb(stroke.paint);
        drawPolygonPath(ctx, pts, {
          strokeColor: color,
          strokeOpacity: opacity * layer.opacity,
          strokeWidth: s(ctx, stroke.width),
        });
      }
      break;
    }
    case "line": {
      for (const stroke of layer.strokes) {
        const { color, opacity } = paintToRgb(stroke.paint);
        ctx.page.drawLine({
          start: { x: s(ctx, x), y: flipY(ctx, y) },
          end: { x: s(ctx, x + w), y: flipY(ctx, y + h) },
          thickness: s(ctx, stroke.width),
          color,
          opacity: opacity * layer.opacity,
          lineCap: mapLineCap(stroke.cap),
        });
      }
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Path (VECTOR — bezier/arc paths)
// ---------------------------------------------------------------------------

function renderPathToPdf(ctx: PdfRenderContext, layer: PathLayerV2): void {
  if (!layer.geometry?.commands?.length) return;

  const ox = layer.transform.position.x;
  const oy = layer.transform.position.y;
  const cmds = layer.geometry.commands;

  // Build SVG-like path string for pdf-lib drawSvgPath
  const pathStr = commandsToSvgPath(cmds, ox, oy, ctx);

  if (!pathStr) return;

  for (const fill of layer.fills ?? []) {
    const { color, opacity } = paintToRgb(fill);
    ctx.page.drawSvgPath(pathStr, {
      x: 0,
      y: ctx.pageH,
      color,
      opacity: opacity * layer.opacity,
    });
  }

  for (const stroke of layer.strokes ?? []) {
    const { color, opacity } = paintToRgb(stroke.paint);
    ctx.page.drawSvgPath(pathStr, {
      x: 0,
      y: ctx.pageH,
      borderColor: color,
      borderWidth: s(ctx, stroke.width),
      borderOpacity: opacity * layer.opacity,
    });
  }
}

function commandsToSvgPath(
  cmds: PathCommand[],
  ox: number,
  oy: number,
  ctx: PdfRenderContext,
): string {
  const parts: string[] = [];

  for (const cmd of cmds) {
    switch (cmd.type) {
      case "M":
        parts.push(`M ${s(ctx, cmd.x + ox)} ${s(ctx, cmd.y + oy)}`);
        break;
      case "L":
        parts.push(`L ${s(ctx, cmd.x + ox)} ${s(ctx, cmd.y + oy)}`);
        break;
      case "C":
        parts.push(
          `C ${s(ctx, cmd.cp1x + ox)} ${s(ctx, cmd.cp1y + oy)} ` +
          `${s(ctx, cmd.cp2x + ox)} ${s(ctx, cmd.cp2y + oy)} ` +
          `${s(ctx, cmd.x + ox)} ${s(ctx, cmd.y + oy)}`,
        );
        break;
      case "Q":
        parts.push(
          `Q ${s(ctx, cmd.cpx + ox)} ${s(ctx, cmd.cpy + oy)} ` +
          `${s(ctx, cmd.x + ox)} ${s(ctx, cmd.y + oy)}`,
        );
        break;
      case "Z":
        parts.push("Z");
        break;
      // Arc commands are converted to bezier approximation if needed
      // For now skip 'A' type — uncommon in our scene graph
    }
  }

  return parts.join(" ");
}

// ---------------------------------------------------------------------------
// Image (embedded raster)
// ---------------------------------------------------------------------------

async function renderImageToPdf(ctx: PdfRenderContext, layer: ImageLayerV2): Promise<void> {
  const imgEl = layer._imageElement;
  if (!imgEl) return;

  const x = layer.transform.position.x;
  const y = layer.transform.position.y;
  const w = layer.transform.size.x;
  const h = layer.transform.size.y;

  try {
    // Render image to a temporary canvas to get PNG bytes
    const tmpCanvas = document.createElement("canvas");
    const dpr = 2; // high-res
    tmpCanvas.width = Math.round(w * dpr);
    tmpCanvas.height = Math.round(h * dpr);
    const tmpCtx = tmpCanvas.getContext("2d");
    if (!tmpCtx) return;

    tmpCtx.scale(dpr, dpr);

    // Apply corner radius clip
    if (layer.cornerRadius > 0) {
      tmpCtx.beginPath();
      tmpCtx.moveTo(layer.cornerRadius, 0);
      tmpCtx.lineTo(w - layer.cornerRadius, 0);
      tmpCtx.arcTo(w, 0, w, layer.cornerRadius, layer.cornerRadius);
      tmpCtx.lineTo(w, h - layer.cornerRadius);
      tmpCtx.arcTo(w, h, w - layer.cornerRadius, h, layer.cornerRadius);
      tmpCtx.lineTo(layer.cornerRadius, h);
      tmpCtx.arcTo(0, h, 0, h - layer.cornerRadius, layer.cornerRadius);
      tmpCtx.lineTo(0, h - layer.cornerRadius);
      tmpCtx.arcTo(0, 0, layer.cornerRadius, 0, layer.cornerRadius);
      tmpCtx.clip();
    }

    // Draw image with fit logic
    if (layer.fit === "cover") {
      const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
      const layerAspect = w / h;
      let sw: number, sh: number, sx: number, sy: number;
      if (imgAspect > layerAspect) {
        sh = imgEl.naturalHeight;
        sw = sh * layerAspect;
        sx = (imgEl.naturalWidth - sw) * layer.focalPoint.x;
        sy = 0;
      } else {
        sw = imgEl.naturalWidth;
        sh = sw / layerAspect;
        sx = 0;
        sy = (imgEl.naturalHeight - sh) * layer.focalPoint.y;
      }
      tmpCtx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, w, h);
    } else if (layer.fit === "contain") {
      const imgAspect = imgEl.naturalWidth / imgEl.naturalHeight;
      const layerAspect = w / h;
      let dw: number, dh: number;
      if (imgAspect > layerAspect) { dw = w; dh = dw / imgAspect; }
      else { dh = h; dw = dh * imgAspect; }
      tmpCtx.drawImage(imgEl, (w - dw) / 2, (h - dh) / 2, dw, dh);
    } else {
      tmpCtx.drawImage(imgEl, 0, 0, w, h);
    }

    // Convert to PNG and embed
    const pngDataUrl = tmpCanvas.toDataURL("image/png");
    const pngBytes = dataUrlToUint8Array(pngDataUrl);
    const pdfImage = await ctx.pdfDoc.embedPng(pngBytes);

    ctx.page.drawImage(pdfImage, {
      x: s(ctx, x),
      y: flipY(ctx, y + h),
      width: s(ctx, w),
      height: s(ctx, h),
      opacity: layer.opacity,
    });
  } catch {
    // Silently skip images that fail to embed
  }
}

// ---------------------------------------------------------------------------
// Icon (raster fallback — icons are Canvas2D imperative draw functions)
// ---------------------------------------------------------------------------

async function renderIconToPdf(ctx: PdfRenderContext, layer: IconLayerV2): Promise<void> {
  if (!ctx.rasterFallback) return;

  const x = layer.transform.position.x;
  const y = layer.transform.position.y;
  const sz = Math.min(layer.transform.size.x, layer.transform.size.y);

  try {
    // Dynamically import to avoid SSR issues
    const { drawIcon } = await import("@/lib/icon-library");

    const dpr = 4; // high-res for icons
    const iconCanvas = document.createElement("canvas");
    iconCanvas.width = Math.round(sz * dpr);
    iconCanvas.height = Math.round(sz * dpr);
    const iconCtx = iconCanvas.getContext("2d");
    if (!iconCtx) return;

    iconCtx.scale(dpr, dpr);
    const hexColor = rgbaToHexStr(layer.color);
    drawIcon(iconCtx, layer.iconId, sz / 2, sz / 2, sz, hexColor, layer.strokeWidth);

    const pngDataUrl = iconCanvas.toDataURL("image/png");
    const pngBytes = dataUrlToUint8Array(pngDataUrl);
    const pdfImage = await ctx.pdfDoc.embedPng(pngBytes);

    ctx.page.drawImage(pdfImage, {
      x: s(ctx, x),
      y: flipY(ctx, y + sz),
      width: s(ctx, sz),
      height: s(ctx, sz),
      opacity: layer.opacity,
    });
  } catch {
    // Silently skip icons that fail
  }
}

// ---------------------------------------------------------------------------
// Group (recursive)
// ---------------------------------------------------------------------------

async function renderGroupToPdf(
  ctx: PdfRenderContext,
  group: GroupLayerV2 | BooleanGroupLayerV2,
): Promise<void> {
  for (const childId of group.children) {
    const child = ctx.doc.layersById[childId];
    if (child) await renderLayerToPdf(ctx, child);
  }
}

// ---------------------------------------------------------------------------
// Drawing Helpers
// ---------------------------------------------------------------------------

function drawStrokeRect(
  ctx: PdfRenderContext, x: number, y: number, w: number, h: number,
  stroke: StrokeSpec, layerOpacity: number,
): void {
  const { color, opacity } = paintToRgb(stroke.paint);
  ctx.page.drawRectangle({
    x: s(ctx, x),
    y: flipY(ctx, y + h),
    width: s(ctx, w),
    height: s(ctx, h),
    borderColor: color,
    borderWidth: s(ctx, stroke.width),
    borderOpacity: opacity * layerOpacity,
  });
}

interface PolygonDrawOpts {
  fillColor?: ReturnType<typeof rgb>;
  fillOpacity?: number;
  strokeColor?: ReturnType<typeof rgb>;
  strokeOpacity?: number;
  strokeWidth?: number;
}

function drawPolygonPath(
  ctx: PdfRenderContext,
  pts: { x: number; y: number }[],
  opts: PolygonDrawOpts,
): void {
  if (pts.length < 2) return;

  // Build SVG path from polygon points
  const parts = pts.map((p, i) => {
    const prefix = i === 0 ? "M" : "L";
    return `${prefix} ${s(ctx, p.x)} ${s(ctx, p.y)}`;
  });
  parts.push("Z");
  const pathStr = parts.join(" ");

  ctx.page.drawSvgPath(pathStr, {
    x: 0,
    y: ctx.pageH,
    color: opts.fillColor,
    opacity: opts.fillOpacity,
    borderColor: opts.strokeColor,
    borderWidth: opts.strokeWidth,
    borderOpacity: opts.strokeOpacity,
  });
}

function drawRoundedRect(
  ctx: PdfRenderContext,
  x: number, y: number, w: number, h: number,
  tl: number, tr: number, br: number, bl: number,
  opts: PolygonDrawOpts,
): void {
  // Build SVG rounded-rect path
  const sx = (v: number) => s(ctx, v);
  // Clamp radii to half of smallest dimension
  const maxR = Math.min(w, h) / 2;
  const rtl = Math.min(tl, maxR);
  const rtr = Math.min(tr, maxR);
  const rbr = Math.min(br, maxR);
  const rbl = Math.min(bl, maxR);

  // SVG path for a rounded rectangle (clockwise)
  const d = [
    `M ${sx(x + rtl)} ${sx(y)}`,
    `L ${sx(x + w - rtr)} ${sx(y)}`,
    rtr > 0 ? `A ${sx(rtr)} ${sx(rtr)} 0 0 1 ${sx(x + w)} ${sx(y + rtr)}` : `L ${sx(x + w)} ${sx(y)}`,
    `L ${sx(x + w)} ${sx(y + h - rbr)}`,
    rbr > 0 ? `A ${sx(rbr)} ${sx(rbr)} 0 0 1 ${sx(x + w - rbr)} ${sx(y + h)}` : `L ${sx(x + w)} ${sx(y + h)}`,
    `L ${sx(x + bl)} ${sx(y + h)}`,
    rbl > 0 ? `A ${sx(rbl)} ${sx(rbl)} 0 0 1 ${sx(x)} ${sx(y + h - rbl)}` : `L ${sx(x)} ${sx(y + h)}`,
    `L ${sx(x)} ${sx(y + rtl)}`,
    rtl > 0 ? `A ${sx(rtl)} ${sx(rtl)} 0 0 1 ${sx(x + rtl)} ${sx(y)}` : `L ${sx(x)} ${sx(y)}`,
    "Z",
  ].join(" ");

  ctx.page.drawSvgPath(d, {
    x: 0,
    y: ctx.pageH,
    color: opts.fillColor,
    opacity: opts.fillOpacity,
    borderColor: opts.strokeColor,
    borderWidth: opts.strokeWidth,
    borderOpacity: opts.strokeOpacity,
  });
}

// ---------------------------------------------------------------------------
// Line cap/join mapping
// ---------------------------------------------------------------------------

function mapLineCap(cap?: string): LineCapStyle {
  switch (cap) {
    case "round": return LineCapStyle.Round;
    case "square": return LineCapStyle.Projecting;
    default: return LineCapStyle.Butt;
  }
}

// Unused for now but keeping for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function mapLineJoin(join?: string): LineJoinStyle {
  switch (join) {
    case "round": return LineJoinStyle.Round;
    case "bevel": return LineJoinStyle.Bevel;
    default: return LineJoinStyle.Miter;
  }
}

// ---------------------------------------------------------------------------
// Data URL → Uint8Array
// ---------------------------------------------------------------------------

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1];
  if (!base64) return new Uint8Array(0);
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    arr[i] = raw.charCodeAt(i);
  }
  return arr;
}

function rgbaToHexStr(c: RGBA): string {
  const r = Math.round(c.r ?? 0).toString(16).padStart(2, "0");
  const g = Math.round(c.g ?? 0).toString(16).padStart(2, "0");
  const b = Math.round(c.b ?? 0).toString(16).padStart(2, "0");
  return `#${r}${g}${b}`;
}
