// =============================================================================
// DMSuite — Chiko File Extractors — Barrel Export + Router
// Single entry point that routes a file buffer to the correct extractor
// based on MIME type. Exports all types and individual extractors.
// =============================================================================

import type { DetectedBusinessFields } from "./field-detector";

// ── TypeScript Contracts ─────────────────────────────────────────────────────

/** Unified output from any file extractor */
export interface ExtractedFileData {
  /** Original filename */
  fileName: string;
  /** MIME type of the uploaded file */
  mimeType: string;
  /** File size in bytes */
  fileSize: number;
  /** Type of extraction that was performed */
  extractionType: "pdf" | "docx" | "xlsx" | "image";
  /** Extracted text content (full text, paragraphs joined by newlines) */
  text?: string;
  /** Structured text blocks (headings, paragraphs, with hierarchy) */
  textBlocks?: TextBlock[];
  /** Extracted tables (2D arrays of cell strings) */
  tables?: ExtractedTable[];
  /** Extracted or uploaded images as base64 data URIs */
  images?: ExtractedImage[];
  /** Document metadata (author, title, dates) */
  metadata?: Record<string, string>;
  /** For XLSX: sheet names and basic info */
  sheets?: SheetInfo[];
  /** Summary of what was found */
  summary: string;
  /** Detected business fields (from field-detector) */
  detectedFields?: DetectedBusinessFields;
  /** Thumbnail preview for images (small base64 data URI) */
  thumbnail?: string;
}

export interface TextBlock {
  /** Block type */
  type: "heading" | "paragraph" | "list-item";
  /** Heading level (1-6) if type is "heading" */
  level?: number;
  /** The text content */
  content: string;
}

export interface ExtractedTable {
  /** Optional table title or caption */
  title?: string;
  /** Whether the first row appears to be headers */
  hasHeaders: boolean;
  /** Header row (if hasHeaders is true) */
  headers?: string[];
  /** Data rows — each row is an array of cell strings */
  rows: string[][];
}

export interface ExtractedImage {
  /** Base64 data URI (e.g., "data:image/png;base64,...") */
  dataUri: string;
  /** Image width in pixels */
  width: number;
  /** Image height in pixels */
  height: number;
  /** MIME type (image/png, image/jpeg, image/svg+xml) */
  mimeType: string;
  /** Original filename or generated name */
  name: string;
}

export interface SheetInfo {
  /** Sheet name */
  name: string;
  /** Number of data rows (excluding empty) */
  rowCount: number;
  /** Column headers (first row values) */
  columns: string[];
}

/** Server responds with this */
export interface FileUploadResponse {
  success: boolean;
  data?: ExtractedFileData;
  error?: string;
}

// ── Re-exports ───────────────────────────────────────────────────────────────

export { extractPdf } from "./pdf-extractor";
export { extractDocx } from "./docx-extractor";
export { extractXlsx } from "./xlsx-extractor";
export { extractImage } from "./image-extractor";
export { detectBusinessFields, buildFieldsSummary } from "./field-detector";
export type { DetectedBusinessFields } from "./field-detector";

// ── MIME type → extractor routing ────────────────────────────────────────────

import { extractPdf } from "./pdf-extractor";
import { extractDocx } from "./docx-extractor";
import { extractXlsx } from "./xlsx-extractor";
import { extractImage } from "./image-extractor";

const MIME_TO_EXTRACTOR: Record<
  string,
  (buffer: Buffer, fileName: string, mimeType: string) => Promise<ExtractedFileData>
> = {
  "application/pdf": (buf, name) => extractPdf(buf, name),
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": (buf, name) =>
    extractDocx(buf, name),
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": (buf, name) =>
    extractXlsx(buf, name),
  "application/vnd.ms-excel": (buf, name) => extractXlsx(buf, name),
  "image/png": extractImage,
  "image/jpeg": extractImage,
  "image/jpg": extractImage,
  "image/svg+xml": extractImage,
  "image/webp": extractImage,
};

/**
 * Route a file buffer to the correct extractor based on MIME type.
 */
export async function extractFile(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedFileData> {
  const extractor = MIME_TO_EXTRACTOR[mimeType];
  if (!extractor) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
  return extractor(buffer, fileName, mimeType);
}

/** All supported MIME types */
export const SUPPORTED_MIME_TYPES = Object.keys(MIME_TO_EXTRACTOR);
