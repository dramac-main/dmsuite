// =============================================================================
// DMSuite — Resume Revision API Route
// Non-streaming endpoint for AI-powered resume revisions.
// Called by ai-revision-engine.ts → POST /api/chat/resume/revise
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

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
    console.warn(`[resume-revise] ${response.status}, retrying in ${delay}ms (${attempt + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, delay));
  }
  return lastResponse!;
}

export async function POST(request: NextRequest) {
  // ── Auth + Credits ──
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const creditCheck = await checkCredits(user.id, "resume-revision");
  if (!creditCheck.allowed) {
    return NextResponse.json({ error: "Insufficient credits", needed: creditCheck.cost, balance: creditCheck.balance }, { status: 402 });
  }

  try {
    const { systemPrompt, userMessage } = (await request.json()) as {
      systemPrompt: string;
      userMessage: string;
    };

    if (!systemPrompt || !userMessage) {
      return NextResponse.json(
        { error: "systemPrompt and userMessage are required" },
        { status: 400 }
      );
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY not configured" },
        { status: 500 }
      );
    }

    const deduction = await deductCredits(user.id, "resume-revision", "Resume revision");
    if (!deduction.success) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 402 });
    }

    // Try primary model, then fallback
    const modelsToTry = ANTHROPIC_MODEL !== FALLBACK_MODEL
      ? [ANTHROPIC_MODEL, FALLBACK_MODEL]
      : [ANTHROPIC_MODEL];

    let anthropicResponse: Response | null = null;

    for (const model of modelsToTry) {
      console.log(`[resume-revise] Trying model: ${model}`);
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
      console.warn(`[resume-revise] Model ${model} failed: ${anthropicResponse.status}`);
    }

    if (!anthropicResponse || !anthropicResponse.ok) {
      const errText = anthropicResponse ? await anthropicResponse.text() : "no response";
      console.error("Anthropic API error:", errText);
      return NextResponse.json(
        { error: `Anthropic API error: ${anthropicResponse?.status}` },
        { status: 502 }
      );
    }

    const anthropicData = await anthropicResponse.json();
    const textBlock = anthropicData.content?.find(
      (block: { type: string }) => block.type === "text"
    );

    if (!textBlock?.text) {
      return NextResponse.json(
        { error: "No text content in AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: textBlock.text });
  } catch (err) {
    console.error("Resume revision API error:", err);
    await refundCredits(user.id, creditCheck.cost, "Refund: resume revision failed");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
