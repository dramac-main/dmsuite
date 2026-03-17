// =============================================================================
// DMSuite — Resume Generation API Route
// Non-streaming endpoint that returns complete JSON for AI-generated resumes.
// Called by StepGeneration.tsx → POST /api/chat/resume/generate
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import {
  buildResumeGenerationPrompt,
  parseResumeResponse,
  buildFallbackResume,
  type ResumeGenerationInput,
} from "@/lib/resume/ai-resume-generator";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-haiku-4-5";
const RETRYABLE_STATUS = new Set([429, 529, 502, 503]);
const MAX_RETRIES = 2;

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
    if (!RETRYABLE_STATUS.has(response.status) || attempt === retries) break;
    const delay = Math.min(1000 * Math.pow(2, attempt), 8000);
    console.warn(`[resume-generate] ${response.status}, retrying in ${delay}ms (${attempt + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, delay));
  }
  return lastResponse!;
}

export async function POST(request: NextRequest) {
  try {
    let payload: ResumeGenerationInput;
    try {
      payload = (await request.json()) as ResumeGenerationInput;
    } catch {
      return NextResponse.json(
        { error: "Invalid or empty request body" },
        { status: 400 }
      );
    }

    // Basic validation
    if (!payload.personal?.name || !payload.personal?.email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // If no API key, use fallback
    if (!ANTHROPIC_API_KEY) {
      console.warn("ANTHROPIC_API_KEY not configured — using fallback resume generation");
      const resume = buildFallbackResume(payload);
      return NextResponse.json({ resume });
    }

    // Build prompts
    const { systemPrompt, userMessage } = buildResumeGenerationPrompt(payload);

    // Try primary model, then fallback
    const modelsToTry = ANTHROPIC_MODEL !== FALLBACK_MODEL
      ? [ANTHROPIC_MODEL, FALLBACK_MODEL]
      : [ANTHROPIC_MODEL];

    let anthropicResponse: Response | null = null;

    for (const model of modelsToTry) {
      console.log(`[resume-generate] Trying model: ${model}`);
      anthropicResponse = await fetchWithRetry(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 8192,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            stream: false,
          }),
        }
      );
      if (anthropicResponse.ok) break;
      console.warn(`[resume-generate] Model ${model} failed: ${anthropicResponse.status}`);
    }

    if (!anthropicResponse || !anthropicResponse.ok) {
      const errorText = anthropicResponse ? await anthropicResponse.text() : "no response";
      console.error("Anthropic resume API error:", anthropicResponse?.status, errorText);

      // Fallback on API error
      console.warn("Falling back to local resume generation");
      const resume = buildFallbackResume(payload);
      return NextResponse.json({ resume });
    }

    const result = await anthropicResponse.json();

    // Extract text from Anthropic response format
    const textBlocks = result.content?.filter(
      (block: { type: string }) => block.type === "text"
    );
    const text = textBlocks?.map((b: { text: string }) => b.text).join("") || "";

    if (!text) {
      console.warn("Empty AI response — using fallback");
      const resume = buildFallbackResume(payload);
      return NextResponse.json({ resume });
    }

    // Detect truncation
    const wasTruncated = result.stop_reason === "max_tokens";

    // Parse and validate the response
    try {
      const resume = parseResumeResponse(text, wasTruncated);
      return NextResponse.json({ resume });
    } catch (parseError) {
      console.error("Failed to parse AI resume response:", parseError);
      console.warn("Falling back to local resume generation");
      const resume = buildFallbackResume(payload);
      return NextResponse.json({ resume });
    }
  } catch (error) {
    console.error("Resume generation API error:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
