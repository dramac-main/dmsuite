/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric.js Export Pipeline
 *  Handles PNG, JPG, SVG, PDF, and JSON export from a Fabric.Canvas.
 *  PDF uses pdf-lib for vector-quality output with embedded fonts.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import { fabric } from "fabric";
import { JSON_KEYS } from "./types";
import type { ExportFormat } from "./types";
import { transformText } from "./utils";

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExportOptions {
  format: ExportFormat;
  /** Quality for PNG/JPG (0–1). Default 1. */
  quality?: number;
  /** DPI multiplier (e.g. 1 = 72 DPI, ~4.17 = 300 DPI). Default 1. */
  multiplier?: number;
  /** Custom file name (without extension). Default "design". */
  fileName?: string;
}

interface WorkspaceBounds {
  width: number;
  height: number;
  left: number;
  top: number;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getWorkspace(canvas: fabric.Canvas): fabric.Object | undefined {
  return canvas.getObjects().find((o) => o.name === "clip");
}

function getWorkspaceBounds(canvas: fabric.Canvas): WorkspaceBounds {
  const ws = getWorkspace(canvas) as fabric.Rect | undefined;
  return {
    width: ws?.width ?? canvas.getWidth(),
    height: ws?.height ?? canvas.getHeight(),
    left: ws?.left ?? 0,
    top: ws?.top ?? 0,
  };
}

/** Generate a raster data URL from the canvas at the workspace bounds. */
function generateDataUrl(
  canvas: fabric.Canvas,
  format: "png" | "jpeg",
  quality: number,
  multiplier: number,
): string {
  const bounds = getWorkspaceBounds(canvas);
  const prevTransform = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];

  // Reset transform so export is pixel-perfect at workspace coords
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  const dataUrl = canvas.toDataURL({
    format,
    quality,
    multiplier,
    width: bounds.width,
    height: bounds.height,
    left: bounds.left,
    top: bounds.top,
  });

  // Restore viewport transform
  canvas.setViewportTransform(prevTransform as number[]);
  return dataUrl;
}

function triggerDownload(dataUrl: string, fileName: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Export as PNG ────────────────────────────────────────────────────────────

export function exportPng(
  canvas: fabric.Canvas,
  opts?: Partial<ExportOptions>,
): string {
  const quality = opts?.quality ?? 1;
  const multiplier = opts?.multiplier ?? 1;
  const fileName = `${opts?.fileName ?? "design"}.png`;

  const dataUrl = generateDataUrl(canvas, "png", quality, multiplier);
  triggerDownload(dataUrl, fileName);
  return dataUrl;
}

// ── Export as JPG ────────────────────────────────────────────────────────────

export function exportJpg(
  canvas: fabric.Canvas,
  opts?: Partial<ExportOptions>,
): string {
  const quality = opts?.quality ?? 0.92;
  const multiplier = opts?.multiplier ?? 1;
  const fileName = `${opts?.fileName ?? "design"}.jpg`;

  const dataUrl = generateDataUrl(canvas, "jpeg", quality, multiplier);
  triggerDownload(dataUrl, fileName);
  return dataUrl;
}

// ── Export as SVG ────────────────────────────────────────────────────────────

export function exportSvg(
  canvas: fabric.Canvas,
  opts?: Partial<ExportOptions>,
): string {
  const fileName = `${opts?.fileName ?? "design"}.svg`;
  const bounds = getWorkspaceBounds(canvas);

  const prevTransform = canvas.viewportTransform?.slice() ?? [1, 0, 0, 1, 0, 0];
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

  const svgString = canvas.toSVG({
    viewBox: {
      x: bounds.left,
      y: bounds.top,
      width: bounds.width,
      height: bounds.height,
    },
    width: `${bounds.width}px`,
    height: `${bounds.height}px`,
  });

  canvas.setViewportTransform(prevTransform as number[]);

  const blob = new Blob([svgString], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);

  return svgString;
}

// ── Export as JSON (Fabric.js JSON for project saving) ──────────────────────

export async function exportJson(
  canvas: fabric.Canvas,
  opts?: Partial<ExportOptions>,
): Promise<string> {
  const data = canvas.toJSON(JSON_KEYS as unknown as string[]);
  await transformText(data.objects);

  const jsonString = JSON.stringify(data);
  const fileName = `${opts?.fileName ?? "design"}.json`;
  const blob = new Blob([jsonString], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);

  return jsonString;
}

// ── Export as PDF (raster-based, high DPI) ──────────────────────────────────

export async function exportPdf(
  canvas: fabric.Canvas,
  opts?: Partial<ExportOptions>,
): Promise<Uint8Array> {
  // Dynamic import pdf-lib to keep bundle lighter for non-PDF use
  const { PDFDocument } = await import("pdf-lib");

  const bounds = getWorkspaceBounds(canvas);
  const fileName = `${opts?.fileName ?? "design"}.pdf`;

  // Render canvas at 300 DPI (4.17× multiplier from 72 DPI base)
  const multiplier = opts?.multiplier ?? 300 / 72;
  const dataUrl = generateDataUrl(canvas, "png", 1, multiplier);

  // Convert data URL to bytes
  const response = await fetch(dataUrl);
  const pngBytes = new Uint8Array(await response.arrayBuffer());

  // Build PDF
  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBytes);

  // Page size in points (1pt = 1/72 inch)
  const page = pdfDoc.addPage([bounds.width, bounds.height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: bounds.width,
    height: bounds.height,
  });

  const pdfBytes = await pdfDoc.save();

  // Download
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, fileName);
  URL.revokeObjectURL(url);

  return pdfBytes;
}

// ── Get canvas JSON (for project saving, no download) ───────────────────────

export async function getCanvasJson(canvas: fabric.Canvas): Promise<string> {
  const data = canvas.toJSON(JSON_KEYS as unknown as string[]);
  await transformText(data.objects);
  return JSON.stringify(data);
}

// ── Get data URL (no download, for thumbnails / previews) ───────────────────

export function getCanvasDataUrl(
  canvas: fabric.Canvas,
  format: "png" | "jpeg" = "png",
  multiplier = 0.5,
): string {
  return generateDataUrl(canvas, format, 1, multiplier);
}

// ── Print via hidden iframe ─────────────────────────────────────────────────

export function printCanvas(canvas: fabric.Canvas): void {
  const bounds = getWorkspaceBounds(canvas);
  const dataUrl = generateDataUrl(canvas, "png", 1, 300 / 72);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          @page { size: ${bounds.width}pt ${bounds.height}pt; margin: 0; }
          body { margin: 0; padding: 0; }
          img { width: 100%; height: auto; display: block; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" />
      </body>
    </html>
  `;

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.top = "-10000px";
  iframe.style.left = "-10000px";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!iframeDoc) {
    document.body.removeChild(iframe);
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  iframe.addEventListener(
    "load",
    () => {
      const win = iframe.contentWindow;
      if (win) {
        win.focus();
        win.print();
      }
      setTimeout(() => document.body.removeChild(iframe), 500);
    },
    { once: true },
  );
}

// ── Unified export dispatcher ───────────────────────────────────────────────

export async function exportCanvas(
  canvas: fabric.Canvas,
  opts: ExportOptions,
): Promise<void> {
  switch (opts.format) {
    case "png":
      exportPng(canvas, opts);
      break;
    case "jpg":
      exportJpg(canvas, opts);
      break;
    case "svg":
      exportSvg(canvas, opts);
      break;
    case "json":
      await exportJson(canvas, opts);
      break;
    case "pdf":
      await exportPdf(canvas, opts);
      break;
  }
}
