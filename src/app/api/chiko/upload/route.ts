// =============================================================================
// DMSuite — Chiko File Upload API Route
// Server-side endpoint that accepts file uploads via multipart/form-data,
// extracts structured data, and returns it. Files never touch disk.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { extractFile, SUPPORTED_MIME_TYPES } from "@/lib/chiko/extractors";
import type { FileUploadResponse } from "@/lib/chiko/extractors";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest): Promise<NextResponse<FileUploadResponse>> {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    // ── Validate file exists ──────────────────────────────
    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "No file provided. Include a 'file' field in the form data." },
        { status: 400 }
      );
    }

    // ── Validate file size ────────────────────────────────
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          error: `File too large (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maximum is ${MAX_FILE_SIZE / (1024 * 1024)} MB.`,
        },
        { status: 400 }
      );
    }

    // ── Validate MIME type ────────────────────────────────
    const mimeType = file.type;
    if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Unsupported file type: ${mimeType}. Supported types: PDF, DOCX, XLSX, PNG, JPEG, SVG, WebP.`,
        },
        { status: 400 }
      );
    }

    // ── Read file into memory buffer ──────────────────────
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // ── Extract structured data ───────────────────────────
    const data = await extractFile(buffer, file.name, mimeType);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Chiko Upload] Extraction error:", error);
    // Never expose internal paths or stack traces
    const message =
      error instanceof Error
        ? error.message.replace(/[A-Z]:\\[^\s]*/gi, "[path]") // Strip Windows paths
        : "File processing failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
