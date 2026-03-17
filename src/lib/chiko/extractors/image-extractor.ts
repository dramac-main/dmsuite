// =============================================================================
// DMSuite — Image Extractor
// Validates, processes, and returns uploaded images as base64 data URIs.
// Supports PNG, JPEG, WebP, and SVG. Uses sharp for resizing/thumbnails.
// =============================================================================

import sharp from "sharp";
import type { ExtractedFileData, ExtractedImage } from "./index";

const MAX_BASE64_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_DIMENSION = 2000;
const THUMBNAIL_WIDTH = 200;

// Magic bytes for common image formats
const MAGIC_BYTES: Record<string, number[]> = {
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

/**
 * Validate image buffer magic bytes against declared MIME type.
 */
function validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
  if (mimeType === "image/svg+xml") {
    // SVG is text-based: check for XML/SVG declaration
    const head = buffer.subarray(0, 256).toString("utf-8").trim();
    return head.includes("<svg") || head.includes("<?xml");
  }

  const expected = MAGIC_BYTES[mimeType];
  if (!expected) return true; // Unknown type, skip check

  if (buffer.length < expected.length) return false;
  return expected.every((byte, i) => buffer[i] === byte);
}

/**
 * Sanitize SVG content by removing dangerous elements and attributes.
 */
function sanitizeSvg(svgContent: string): string {
  let sanitized = svgContent;
  // Remove <script> tags
  sanitized = sanitized.replace(/<script[\s\S]*?<\/script>/gi, "");
  sanitized = sanitized.replace(/<script[^>]*\/>/gi, "");
  // Remove on* event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  // Remove xlink:href to external URLs (keep internal #refs)
  sanitized = sanitized.replace(
    /xlink:href\s*=\s*(?:"(?:https?:|\/\/)[^"]*"|'(?:https?:|\/\/)[^']*')/gi,
    ""
  );
  // Remove href to external URLs on non-<a> elements
  sanitized = sanitized.replace(
    /(<(?!a\b)[^>]*)\s+href\s*=\s*(?:"(?:https?:|\/\/)[^"]*"|'(?:https?:|\/\/)[^']*')/gi,
    "$1"
  );
  // Remove <use> with external references
  sanitized = sanitized.replace(
    /<use[^>]*href\s*=\s*(?:"(?:https?:|\/\/)[^"]*"|'(?:https?:|\/\/)[^']*')[^>]*\/?>/gi,
    ""
  );
  // Remove data: URIs in xlink:href (potential data exfiltration)
  sanitized = sanitized.replace(
    /xlink:href\s*=\s*(?:"data:[^"]*"|'data:[^']*')/gi,
    ""
  );
  return sanitized;
}

/**
 * Format file size in human-readable form.
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Extract image data, dimensions, and thumbnail from an image buffer.
 */
export async function extractImage(
  buffer: Buffer,
  fileName: string,
  mimeType: string
): Promise<ExtractedFileData> {
  // Validate magic bytes
  if (!validateMagicBytes(buffer, mimeType)) {
    throw new Error(`Invalid image data: buffer does not match declared MIME type ${mimeType}`);
  }

  // Handle SVG separately
  if (mimeType === "image/svg+xml") {
    return extractSvg(buffer, fileName);
  }

  // Use sharp for raster images
  let imageBuffer = buffer;
  const metadata = await sharp(buffer).metadata();
  let width = metadata.width || 0;
  let height = metadata.height || 0;

  // Check base64 size and resize if needed
  const estimatedBase64Size = Math.ceil((imageBuffer.length * 4) / 3);
  if (estimatedBase64Size > MAX_BASE64_BYTES || width > MAX_DIMENSION || height > MAX_DIMENSION) {
    // Resize to fit within MAX_DIMENSION
    const resized = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer();
    imageBuffer = resized;
    const newMeta = await sharp(resized).metadata();
    width = newMeta.width || width;
    height = newMeta.height || height;
  }

  // Generate thumbnail
  const thumbnailBuffer = await sharp(imageBuffer)
    .resize(THUMBNAIL_WIDTH, undefined, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();
  const thumbnail = `data:image/png;base64,${thumbnailBuffer.toString("base64")}`;

  // Build full data URI
  const base64 = imageBuffer.toString("base64");
  const outputMime = mimeType === "image/webp" ? "image/png" : mimeType;
  const dataUri = `data:${outputMime};base64,${base64}`;

  const image: ExtractedImage = {
    dataUri,
    width,
    height,
    mimeType: outputMime,
    name: fileName,
  };

  return {
    fileName,
    mimeType,
    fileSize: buffer.length,
    extractionType: "image",
    images: [image],
    summary: `${width}×${height} ${mimeType.replace("image/", "").toUpperCase()} image (${formatSize(buffer.length)})`,
    thumbnail,
  };
}

/**
 * Extract and sanitize SVG images.
 */
async function extractSvg(
  buffer: Buffer,
  fileName: string
): Promise<ExtractedFileData> {
  let svgContent = buffer.toString("utf-8");
  svgContent = sanitizeSvg(svgContent);

  // Try to extract dimensions from SVG attributes
  let width = 0;
  let height = 0;
  const widthMatch = svgContent.match(/\bwidth\s*=\s*["']?(\d+)/);
  const heightMatch = svgContent.match(/\bheight\s*=\s*["']?(\d+)/);
  if (widthMatch) width = parseInt(widthMatch[1], 10);
  if (heightMatch) height = parseInt(heightMatch[1], 10);

  // If no explicit dimensions, try viewBox
  if (!width || !height) {
    const viewBoxMatch = svgContent.match(
      /viewBox\s*=\s*["']?\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/
    );
    if (viewBoxMatch) {
      width = Math.round(parseFloat(viewBoxMatch[1]));
      height = Math.round(parseFloat(viewBoxMatch[2]));
    }
  }

  const dataUri = `data:image/svg+xml;base64,${Buffer.from(svgContent, "utf-8").toString("base64")}`;

  const image: ExtractedImage = {
    dataUri,
    width,
    height,
    mimeType: "image/svg+xml",
    name: fileName,
  };

  // Generate a simple thumbnail for SVG — convert to PNG via sharp
  let thumbnail: string | undefined;
  try {
    const thumbBuffer = await sharp(Buffer.from(svgContent, "utf-8"))
      .resize(THUMBNAIL_WIDTH, undefined, { fit: "inside" })
      .png()
      .toBuffer();
    thumbnail = `data:image/png;base64,${thumbBuffer.toString("base64")}`;
  } catch {
    // SVG might not be renderable by sharp — skip thumbnail
  }

  return {
    fileName,
    mimeType: "image/svg+xml",
    fileSize: buffer.length,
    extractionType: "image",
    images: [image],
    summary: `${width}×${height} SVG image (${formatSize(buffer.length)})`,
    thumbnail,
  };
}
