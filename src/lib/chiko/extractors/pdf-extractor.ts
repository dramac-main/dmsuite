// =============================================================================
// DMSuite — PDF Extractor
// Extracts text, metadata, and page info from PDF buffers using pdf-parse v2.
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
  destroy: () => Promise<void>;
}) | null = null;

async function getPDFParseClass() {
  if (PDFParseClass) return PDFParseClass;
  ensureDomPolyfills();
  // Dynamic import to avoid top-level evaluation crash
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mod = require("pdf-parse");
  PDFParseClass = mod.PDFParse;
  return PDFParseClass!;
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
  };
}
