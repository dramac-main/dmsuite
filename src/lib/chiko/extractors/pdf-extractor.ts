// =============================================================================
// DMSuite — PDF Extractor
// Extracts text, metadata, fonts, and colors from PDF buffers using pdf-parse v2
// and pdfjs-dist directly for rich styling data.
// Uses lazy loading with DOM polyfills to avoid server-side DOMMatrix crash.
// =============================================================================

import {
  detectBusinessFields,
  buildFieldsSummary,
} from "./field-detector";
import type { ExtractedFileData, TextBlock } from "./index";

/**
 * Ensure DOM globals required by pdfjs-dist exist in Node.js.
 * Must be called before importing pdf-parse.
 */
function ensureDomPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
    // Lightweight 6-value affine matrix stub
    globalThis.DOMMatrix = class DOMMatrix {
      a: number; b: number; c: number; d: number; e: number; f: number;
      constructor(init?: number[]) {
        this.a = init?.[0] ?? 1; this.b = init?.[1] ?? 0;
        this.c = init?.[2] ?? 0; this.d = init?.[3] ?? 1;
        this.e = init?.[4] ?? 0; this.f = init?.[5] ?? 0;
      }
    } as unknown as typeof DOMMatrix;
  }
  if (typeof globalThis.Path2D === "undefined") {
    globalThis.Path2D = class Path2D {
      constructor(_d?: string | Path2D) { /* stub */ }
    } as unknown as typeof Path2D;
  }
  if (typeof globalThis.ImageData === "undefined") {
    globalThis.ImageData = class ImageData {
      data: Uint8ClampedArray; width: number; height: number;
      constructor(sw: number, sh: number) {
        this.width = sw; this.height = sh;
        this.data = new Uint8ClampedArray(sw * sh * 4);
      }
    } as unknown as typeof ImageData;
  }
}

// Cached reference to PDFParse class (lazy-loaded)
let PDFParseClass: (new (opts: { data: Uint8Array }) => {
  getText: () => Promise<{ text: string; total: number }>;
  getInfo: () => Promise<{ info?: Record<string, unknown>; total: number }>;
  load: () => Promise<PdfjsDocProxy>;
  destroy: () => Promise<void>;
}) | null = null;

// Minimal pdfjs-dist type stubs for what we need
interface PdfjsDocProxy {
  numPages: number;
  getPage: (n: number) => Promise<PdfjsPageProxy>;
}
interface PdfjsPageProxy {
  getTextContent: () => Promise<{
    items: Array<{ str?: string; fontName?: string }>;
    styles: Record<string, { fontFamily?: string }>;
  }>;
  getOperatorList: () => Promise<{
    fnArray: number[];
    argsArray: unknown[][];
  }>;
  cleanup: () => void;
}

// pdfjs-dist OPS codes for color operators
const OPS_SET_FILL_RGB = 59;
const OPS_SET_STROKE_RGB = 58;
const OPS_SET_FILL_CMYK = 61;
const OPS_SET_STROKE_CMYK = 60;

async function getPDFParseClass() {
  if (PDFParseClass) return PDFParseClass;
  ensureDomPolyfills();
  // Dynamic import to avoid top-level evaluation crash
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("pdf-parse");
  PDFParseClass = mod.PDFParse;
  return PDFParseClass!;
}

/** Convert CMYK (0–1) to hex */
function cmykToHex(c: number, m: number, y: number, k: number): string {
  const r = Math.round(255 * (1 - c) * (1 - k));
  const g = Math.round(255 * (1 - m) * (1 - k));
  const b = Math.round(255 * (1 - y) * (1 - k));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

/** Convert RGB (0–1) to hex */
function rgbToHex(r: number, g: number, b: number): string {
  const ri = Math.round(r * 255);
  const gi = Math.round(g * 255);
  const bi = Math.round(b * 255);
  return `#${ri.toString(16).padStart(2, "0")}${gi.toString(16).padStart(2, "0")}${bi.toString(16).padStart(2, "0")}`;
}

/** Check if a color is near-white or near-black (not brand-relevant) */
function isNeutralColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.92 || lum < 0.08;
}

/** Clean a pdfjs fontFamily string into a recognizable font name */
function cleanFontName(raw: string): string | null {
  if (!raw) return null;
  // pdfjs returns names like "g_d0_f1" (embedded subset) or "ABCDEF+Montserrat-Bold"
  // Remove subset prefix (6 uppercase letters + '+')
  let name = raw.replace(/^[A-Z]{6}\+/, "");
  // Remove common suffixes
  name = name.replace(/-(Bold|Regular|Italic|Light|Medium|SemiBold|ExtraBold|Thin|Black|BoldItalic|MediumItalic|LightItalic|Condensed|Narrow)$/i, "");
  name = name.replace(/,?(Bold|Italic|Regular)$/i, "");
  // Skip generic/internal names
  if (/^g_d\d+_f\d+$/i.test(name)) return null;
  if (name.length < 2) return null;
  // Convert CamelCase or hyphenated to spaced: "TimesNewRoman" → "Times New Roman"
  name = name.replace(/([a-z])([A-Z])/g, "$1 $2");
  name = name.replace(/-/g, " ");
  return name.trim();
}

/**
 * Extract fonts and colors from PDF pages using pdfjs-dist's low-level APIs.
 * Scans up to maxPages pages to keep extraction fast.
 */
async function extractStyling(
  doc: PdfjsDocProxy,
  maxPages = 3
): Promise<{ fonts: string[]; colors: string[] }> {
  const fontSet = new Set<string>();
  const colorCounts = new Map<string, number>();
  const pagesToScan = Math.min(doc.numPages, maxPages);

  for (let i = 1; i <= pagesToScan; i++) {
    const page = await doc.getPage(i);

    // ── Font extraction via getTextContent ──
    try {
      const content = await page.getTextContent();
      // styles maps fontName → { fontFamily }
      if (content.styles) {
        for (const style of Object.values(content.styles)) {
          if (style.fontFamily) {
            const cleaned = cleanFontName(style.fontFamily);
            if (cleaned) fontSet.add(cleaned);
          }
        }
      }
      // Also check items for fontName → styles lookup
      for (const item of content.items) {
        if (item.fontName && content.styles[item.fontName]?.fontFamily) {
          const cleaned = cleanFontName(content.styles[item.fontName].fontFamily!);
          if (cleaned) fontSet.add(cleaned);
        }
      }
    } catch { /* font extraction is best-effort */ }

    // ── Color extraction via getOperatorList ──
    try {
      const ops = await page.getOperatorList();
      for (let j = 0; j < ops.fnArray.length; j++) {
        const fn = ops.fnArray[j];
        const args = ops.argsArray[j];
        let hex: string | null = null;

        if ((fn === OPS_SET_FILL_RGB || fn === OPS_SET_STROKE_RGB) && args.length >= 3) {
          hex = rgbToHex(args[0] as number, args[1] as number, args[2] as number);
        } else if ((fn === OPS_SET_FILL_CMYK || fn === OPS_SET_STROKE_CMYK) && args.length >= 4) {
          hex = cmykToHex(args[0] as number, args[1] as number, args[2] as number, args[3] as number);
        }

        if (hex && !isNeutralColor(hex)) {
          colorCounts.set(hex, (colorCounts.get(hex) || 0) + 1);
        }
      }
    } catch { /* color extraction is best-effort */ }

    page.cleanup();
  }

  // Sort colors by frequency (most used first) and take top 8
  const sortedColors = [...colorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([hex]) => hex);

  return {
    fonts: [...fontSet],
    colors: sortedColors,
  };
}

/**
 * Extract text, metadata, and detected business fields from a PDF buffer.
 */
export async function extractPdf(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedFileData> {
  const PDFParse = await getPDFParseClass();
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  let text = "";
  let pageCount = 0;
  const metadata: Record<string, string> = {};
  let documentFonts: string[] | undefined;
  let documentColors: string[] | undefined;

  try {
    const textResult = await parser.getText();
    text = textResult.text || "";
    pageCount = textResult.total || 0;

    const infoResult = await parser.getInfo();
    if (infoResult.info) {
      const info = infoResult.info;
      if (info.Title) metadata.title = String(info.Title);
      if (info.Author) metadata.author = String(info.Author);
      if (info.Creator) metadata.creator = String(info.Creator);
      if (info.CreationDate) metadata.creationDate = String(info.CreationDate);
      if (info.ModDate) metadata.modificationDate = String(info.ModDate);
    }

    // Extract fonts and colors from the PDF's rendering data
    const doc = await parser.load();
    const styling = await extractStyling(doc);
    if (styling.fonts.length > 0) documentFonts = styling.fonts;
    if (styling.colors.length > 0) documentColors = styling.colors;
  } finally {
    await parser.destroy();
  }

  // Build text blocks (split by double newlines for paragraphs)
  const textBlocks: TextBlock[] = [];
  const paragraphs = text.split(/\n{2,}/).filter((p: string) => p.trim().length > 0);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    const isHeading =
      trimmed.length < 80 &&
      (trimmed === trimmed.toUpperCase() || /^[A-Z][A-Z\s]+$/.test(trimmed));
    textBlocks.push({
      type: isHeading ? "heading" : "paragraph",
      level: isHeading ? 1 : undefined,
      content: trimmed,
    });
  }

  // Detect business fields
  const detectedFields = detectBusinessFields(text);
  const fieldsSummary = buildFieldsSummary(detectedFields);

  const summary = [
    `PDF document, ${pageCount} page${pageCount !== 1 ? "s" : ""}`,
    metadata.title ? `Title: "${metadata.title}"` : "",
    fieldsSummary,
  ]
    .filter(Boolean)
    .join(". ");

  return {
    fileName,
    mimeType: "application/pdf",
    fileSize: buffer.length,
    extractionType: "pdf",
    text,
    textBlocks,
    metadata,
    summary,
    detectedFields,
    documentFonts,
    documentColors,
  };
}
