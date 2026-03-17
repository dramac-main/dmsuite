// =============================================================================
// DMSuite — DOCX Extractor
// Extracts text, headings, tables, and embedded images from DOCX buffers
// using mammoth.
// =============================================================================

import mammoth from "mammoth";
import {
  detectBusinessFields,
  buildFieldsSummary,
} from "./field-detector";
import type {
  ExtractedFileData,
  TextBlock,
  ExtractedTable,
  ExtractedImage,
} from "./index";

const MAX_IMAGE_TOTAL_BYTES = 5 * 1024 * 1024; // 5 MB total for all images

/**
 * Strip HTML tags and decode basic entities to get plain text.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<\/tr>/gi, "\n")
    .replace(/<\/td>/gi, "\t")
    .replace(/<\/th>/gi, "\t")
    .replace(/<li>/gi, "- ")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Parse HTML tables into ExtractedTable objects.
 */
function parseHtmlTables(html: string): ExtractedTable[] {
  const tables: ExtractedTable[] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch: RegExpExecArray | null;

  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const tableHtml = tableMatch[1];
    const rows: string[][] = [];
    const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let rowMatch: RegExpExecArray | null;

    while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
      const rowHtml = rowMatch[1];
      const cells: string[] = [];
      const cellRegex = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
        cells.push(stripHtml(cellMatch[1]).trim());
      }
      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    if (rows.length > 0) {
      const hasHeaders = rows.length > 1;
      tables.push({
        hasHeaders,
        headers: hasHeaders ? rows[0] : undefined,
        rows: hasHeaders ? rows.slice(1) : rows,
      });
    }
  }

  return tables;
}

/**
 * Parse headings and paragraphs from HTML into TextBlock objects.
 */
function parseHtmlBlocks(html: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  // Match headings and paragraphs
  const blockRegex = /<(h[1-6]|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;

  while ((match = blockRegex.exec(html)) !== null) {
    const tag = match[1].toLowerCase();
    const content = stripHtml(match[2]).trim();
    if (!content) continue;

    if (tag.startsWith("h")) {
      const level = parseInt(tag[1], 10) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, content });
    } else if (tag === "li") {
      blocks.push({ type: "list-item", content });
    } else {
      blocks.push({ type: "paragraph", content });
    }
  }

  return blocks;
}

/**
 * Extract text, headings, tables, and embedded images from a DOCX buffer.
 */
export async function extractDocx(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedFileData> {
  const images: ExtractedImage[] = [];
  let totalImageBytes = 0;
  let imagesOmitted = 0;

  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.imgElement(function (image) {
        return image.read("base64").then(function (base64) {
          const imgContentType = image.contentType || "image/png";
          const dataUri = `data:${imgContentType};base64,${base64}`;
          const byteSize = Math.ceil((base64.length * 3) / 4);

          if (totalImageBytes + byteSize > MAX_IMAGE_TOTAL_BYTES) {
            imagesOmitted++;
            return { src: "" };
          }

          totalImageBytes += byteSize;
          images.push({
            dataUri,
            width: 0,  // mammoth doesn't provide dimensions
            height: 0,
            mimeType: imgContentType,
            name: `embedded-image-${images.length + 1}`,
          });

          return { src: dataUri };
        });
      }),
    }
  );

  const html = result.value;
  const text = stripHtml(html);

  // Parse structured content
  const textBlocks = parseHtmlBlocks(html);
  const tables = parseHtmlTables(html);

  // Count headings
  const headingCount = textBlocks.filter((b) => b.type === "heading").length;

  // Detect business fields
  const detectedFields = detectBusinessFields(text);
  const fieldsSummary = buildFieldsSummary(detectedFields);

  const summaryParts = ["DOCX document"];
  if (headingCount > 0) summaryParts.push(`${headingCount} heading${headingCount !== 1 ? "s" : ""}`);
  if (tables.length > 0) summaryParts.push(`${tables.length} table${tables.length !== 1 ? "s" : ""}`);
  if (images.length > 0) summaryParts.push(`${images.length} image${images.length !== 1 ? "s" : ""}`);
  if (imagesOmitted > 0) summaryParts.push(`${imagesOmitted} image${imagesOmitted !== 1 ? "s" : ""} omitted (size limit)`);
  if (fieldsSummary) summaryParts.push(fieldsSummary);

  return {
    fileName,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: buffer.length,
    extractionType: "docx",
    text,
    textBlocks,
    tables: tables.length > 0 ? tables : undefined,
    images: images.length > 0 ? images : undefined,
    summary: summaryParts.join(". "),
    detectedFields,
  };
}
