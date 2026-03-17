// =============================================================================
// DMSuite — PDF Extractor
// Extracts text, metadata, and page info from PDF buffers using pdf-parse.
// =============================================================================

// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{
  text: string;
  numpages: number;
  info?: Record<string, unknown>;
}>;
import {
  detectBusinessFields,
  buildFieldsSummary,
} from "./field-detector";
import type { ExtractedFileData, TextBlock } from "./index";

/**
 * Extract text, metadata, and detected business fields from a PDF buffer.
 */
export async function extractPdf(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedFileData> {
  const result = await pdfParse(buffer);

  const text = result.text || "";
  const pageCount = result.numpages || 0;

  // Build metadata
  const metadata: Record<string, string> = {};
  if (result.info) {
    if (result.info.Title) metadata.title = String(result.info.Title);
    if (result.info.Author) metadata.author = String(result.info.Author);
    if (result.info.Creator) metadata.creator = String(result.info.Creator);
    if (result.info.CreationDate)
      metadata.creationDate = String(result.info.CreationDate);
    if (result.info.ModDate)
      metadata.modificationDate = String(result.info.ModDate);
  }

  // Build text blocks (split by double newlines for paragraphs)
  const textBlocks: TextBlock[] = [];
  const paragraphs = text.split(/\n{2,}/).filter((p: string) => p.trim().length > 0);
  for (const p of paragraphs) {
    const trimmed = p.trim();
    // Heuristic: short ALL-CAPS lines or short bold-looking lines are headings
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
