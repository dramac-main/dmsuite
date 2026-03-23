// =============================================================================
// DMSuite — Resume Parse API Route
// Accepts uploaded files (PDF, DOCX, images) and extracts structured resume
// data using text extraction + Claude AI parsing.
// POST /api/chat/resume/parse  (multipart/form-data)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-haiku-4-5";

// ---------------------------------------------------------------------------
// Supported file types
// ---------------------------------------------------------------------------

const SUPPORTED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc (limited support)
  "image/png",
  "image/jpeg",
  "image/webp",
  "text/plain",
]);

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // ── Auth + Credits ──
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const creditCheck = await checkCredits(user.id, "file-parsing");
  if (!creditCheck.allowed) {
    return NextResponse.json({ error: "Insufficient credits", needed: creditCheck.cost, balance: creditCheck.balance }, { status: 402 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (!SUPPORTED_MIME_TYPES.has(file.type) && !file.name.endsWith(".doc")) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}. Accepted: PDF, DOCX, DOC, PNG, JPEG, TXT` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // -----------------------------------------------------------------------
    // Step 1: Extract text from file
    // -----------------------------------------------------------------------

    let extractedText = "";
    let imageBase64: string | null = null;
    let imageMimeType: string | null = null;

    if (IMAGE_MIME_TYPES.has(file.type)) {
      // Images: send to Claude Vision directly
      imageBase64 = buffer.toString("base64");
      imageMimeType = file.type;
    } else if (file.type === "application/pdf") {
      extractedText = await extractPdfText(buffer);
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.endsWith(".docx")
    ) {
      extractedText = await extractDocxText(buffer);
    } else if (file.type === "text/plain") {
      extractedText = buffer.toString("utf-8");
    } else if (file.type === "application/msword" || file.name.endsWith(".doc")) {
      // Legacy .doc — try raw text extraction
      extractedText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
      if (extractedText.length < 50) {
        return NextResponse.json(
          { error: "Could not extract text from .doc file. Please convert to .docx or PDF and try again." },
          { status: 422 }
        );
      }
    }

    if (!imageBase64 && extractedText.length < 20) {
      return NextResponse.json(
        { error: "Could not extract enough text from the file. The file may be empty, corrupted, or image-only. Try uploading a different format." },
        { status: 422 }
      );
    }

    // -----------------------------------------------------------------------
    // Step 2: Send to Claude for structured extraction
    // -----------------------------------------------------------------------

    if (!ANTHROPIC_API_KEY) {
      // No API key — return raw text so client can show it
      return NextResponse.json({
        success: true,
        rawText: extractedText || "(image file — text not extracted)",
        parsed: null,
        message: "AI parsing unavailable (no API key). Raw text extracted successfully.",
      });
    }

    const deduction = await deductCredits(user.id, "file-parsing", "Resume file parsing");
    if (!deduction.success) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 402 });
    }

    const parsed = await parseWithClaude(extractedText, imageBase64, imageMimeType);

    return NextResponse.json({
      success: true,
      parsed,
      rawText: extractedText || null,
    });
  } catch (error) {
    console.error("Resume parse API error:", error);
    await refundCredits(user.id, creditCheck.cost, "Refund: resume parse failed");
    return NextResponse.json(
      { error: `Failed to parse file: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// PDF text extraction (using pdfjs-dist legacy build — no worker needed)
// ---------------------------------------------------------------------------

function ensurePdfPolyfills() {
  if (typeof globalThis.DOMMatrix === "undefined") {
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
}

async function extractPdfText(buffer: Buffer): Promise<string> {
  ensurePdfPolyfills();
  // Legacy build bundles the worker inline — no separate worker file needed.
  // Dynamic string prevents Turbopack from resolving the subpath at build time.
  const legacyPath = "pdfjs-dist" + "/legacy/build/pdf.mjs";
  const pdfjsLib = await import(/* webpackIgnore: true */ legacyPath);
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = "";
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pageText = content.items
        .filter((item: Record<string, unknown>) => typeof item.str === "string")
        .map((item: Record<string, unknown>) => item.str)
        .join(" ");
      text += pageText + "\n";
      page.cleanup();
    }
  } finally {
    await doc.destroy();
  }
  return text.trim();
}

// ---------------------------------------------------------------------------
// DOCX text extraction
// ---------------------------------------------------------------------------

async function extractDocxText(buffer: Buffer): Promise<string> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });
  return result.value || "";
}

// ---------------------------------------------------------------------------
// Claude AI structured extraction
// ---------------------------------------------------------------------------

const PARSE_SYSTEM_PROMPT = `You are an expert resume parser. Extract ALL information from the provided resume/CV into a structured JSON format. Be thorough — capture every detail.

Return ONLY valid JSON, no markdown, no commentary, no code fences.

## Output Format
{
  "personal": {
    "name": "string (full name)",
    "email": "string or empty",
    "phone": "string or empty",
    "location": "string (city, state/country) or empty",
    "linkedin": "string (LinkedIn URL) or empty",
    "website": "string (portfolio/personal site URL) or empty"
  },
  "targetRole": {
    "jobTitle": "string (most recent or prominent job title)",
    "experienceLevel": "entry" | "mid" | "senior" | "executive",
    "industry": "string (best guess from experience)",
    "additionalContext": ""
  },
  "experiences": [
    {
      "company": "string",
      "position": "string",
      "startDate": "string (e.g., 'Jan 2020')",
      "endDate": "string (e.g., 'Dec 2023' or 'Present')",
      "isCurrent": boolean,
      "description": "string (all bullet points/descriptions combined, each on new line with '- ' prefix)"
    }
  ],
  "education": [
    {
      "institution": "string",
      "degree": "string (e.g., 'Bachelor of Science')",
      "field": "string (e.g., 'Computer Science')",
      "graduationYear": "string (e.g., '2020')"
    }
  ],
  "skills": ["string", "string", ...],
  "certifications": [
    { "name": "string", "issuer": "string", "year": "string" }
  ],
  "languages": [
    { "name": "string", "proficiency": "native" | "fluent" | "intermediate" | "basic" }
  ],
  "projects": [
    { "name": "string", "description": "string", "url": "string or empty" }
  ],
  "volunteer": [
    { "organization": "string", "role": "string", "description": "string" }
  ],
  "summary": "string (professional summary if present, otherwise empty)"
}

## Rules
- Extract EVERY job listed, in chronological order (most recent first)
- If dates are ambiguous, make your best estimate
- For experienceLevel: "entry" = 0-2 years, "mid" = 3-7 years, "senior" = 8-14 years, "executive" = 15+ years or C-level/VP/Director titles
- Combine all skills into a flat array (remove duplicates)
- If a section doesn't exist in the CV, return an empty array [] or empty string ""
- Preserve the person's original wording for descriptions
- For the targetRole.jobTitle, use their most recent or most prominent position title`;

// ---------------------------------------------------------------------------
// Retry helper — handles 429 (rate limit) and 529 (overloaded)
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS = new Set([429, 529, 502, 503]);
const MAX_RETRIES = 3;

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  retries = MAX_RETRIES,
): Promise<Response> {
  let lastResponse: Response | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, init);

    if (response.ok) return response;

    lastResponse = response;

    // Only retry on transient errors
    if (!RETRYABLE_STATUS.has(response.status) || attempt === retries) {
      break;
    }

    // Exponential backoff: 1s, 2s, 4s
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
    console.warn(
      `Anthropic returned ${response.status}, retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`,
    );
    await new Promise((r) => setTimeout(r, delay));
  }

  return lastResponse!;
}

// ---------------------------------------------------------------------------
// Map Anthropic status codes to user-friendly messages
// ---------------------------------------------------------------------------

function friendlyApiError(status: number): string {
  switch (status) {
    case 400: return "Invalid request sent to AI. Please try a different file.";
    case 401: return "AI service authentication failed. Please check API key configuration.";
    case 403: return "AI service access denied. The API key may not have permission for this model.";
    case 404: return "AI model not found. Please check the model configuration.";
    case 413: return "File is too large for AI processing. Please use a smaller or lower-resolution file.";
    case 429: return "AI service is rate-limited. Please wait a moment and try again.";
    case 500: return "AI service encountered an internal error. Please try again.";
    case 529: return "AI service is temporarily overloaded. Please try again in a few seconds.";
    default:
      return `AI service returned an unexpected error (${status}). Please try again.`;
  }
}

// ---------------------------------------------------------------------------
// Claude AI structured extraction
// ---------------------------------------------------------------------------

async function parseWithClaude(
  text: string,
  imageBase64: string | null,
  imageMimeType: string | null,
): Promise<Record<string, unknown>> {
  // Build message content
  const content: Array<Record<string, unknown>> = [];

  if (imageBase64 && imageMimeType) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: imageMimeType,
        data: imageBase64,
      },
    });
    content.push({
      type: "text",
      text: "Extract all information from this resume/CV image into structured JSON format.",
    });
  } else {
    content.push({
      type: "text",
      text: `Extract all information from this resume/CV text into structured JSON format.\n\n--- RESUME TEXT START ---\n${text}\n--- RESUME TEXT END ---`,
    });
  }

  // Try primary model first, fall back to secondary if overloaded/unavailable
  const modelsToTry = ANTHROPIC_MODEL !== FALLBACK_MODEL
    ? [ANTHROPIC_MODEL, FALLBACK_MODEL]
    : [ANTHROPIC_MODEL];

  let lastError: Error | null = null;

  for (const model of modelsToTry) {
    try {
      console.log(`[resume-parse] Trying model: ${model}`);
      const result = await callClaude(model, content);
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      console.warn(`[resume-parse] Model ${model} failed: ${lastError.message}`);
      // Continue to next model
    }
  }

  throw lastError ?? new Error("All AI models failed. Please try again later.");
}

// ---------------------------------------------------------------------------
// Call Claude with a specific model and parse the JSON response
// ---------------------------------------------------------------------------

async function callClaude(
  model: string,
  content: Array<Record<string, unknown>>,
): Promise<Record<string, unknown>> {
  const body = JSON.stringify({
    model,
    max_tokens: 4096,
    system: PARSE_SYSTEM_PROMPT,
    messages: [{ role: "user", content }],
    stream: false,
  });

  const response = await fetchWithRetry("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body,
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`Claude parse error (${model}):`, response.status, errText);
    throw new Error(friendlyApiError(response.status));
  }

  const result = await response.json();
  const textBlocks = result.content?.filter(
    (block: { type: string }) => block.type === "text"
  );
  const rawOutput = textBlocks?.map((b: { text: string }) => b.text).join("") || "";

  if (!rawOutput.trim()) {
    throw new Error("AI returned an empty response. Please try again with a clearer file.");
  }

  // Extract JSON from response — Claude may wrap in code fences
  let jsonStr = rawOutput.trim();
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (codeBlockMatch) jsonStr = codeBlockMatch[1].trim();
  if (!jsonStr.startsWith("{")) {
    const start = jsonStr.indexOf("{");
    if (start >= 0) jsonStr = jsonStr.slice(start);
  }
  const lastBrace = jsonStr.lastIndexOf("}");
  if (lastBrace >= 0) jsonStr = jsonStr.slice(0, lastBrace + 1);

  try {
    return JSON.parse(jsonStr);
  } catch {
    console.error("Failed to parse Claude response as JSON:", rawOutput.slice(0, 500));
    throw new Error("AI returned invalid data. Please try again.");
  }
}
