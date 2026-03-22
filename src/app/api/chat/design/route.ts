// =============================================================================
// DMSuite — Design Generation API Route
// Non-streaming endpoint that returns complete JSON for business card designs.
// =============================================================================

import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(request: NextRequest) {
  // ── Auth + Credits ──
  const user = await getAuthUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  const creditCheck = await checkCredits(user.id, "business-card-design");
  if (!creditCheck.allowed) {
    return new Response(JSON.stringify({ error: "Insufficient credits", needed: creditCheck.cost, balance: creditCheck.balance }), { status: 402, headers: { "Content-Type": "application/json" } });
  }

  try {
    const { systemPrompt, userMessage } = await request.json();

    if (!systemPrompt || !userMessage) {
      return new Response("Invalid request: systemPrompt and userMessage required", {
        status: 400,
      });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.",
        { status: 500 }
      );
    }

    const deduction = await deductCredits(user.id, "business-card-design", "Business card design generation");
    if (!deduction.success) {
      return new Response("Failed to deduct credits", { status: 402 });
    }

    // Non-streaming call — 24576 tokens allows full front+back card generation
    const anthropicResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 24576,
          system: systemPrompt,
          messages: [{ role: "user", content: userMessage }],
          stream: false,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic design API error:", anthropicResponse.status, errorText);
      return new Response(
        `Anthropic API error: ${anthropicResponse.status} — ${errorText}`,
        { status: anthropicResponse.status }
      );
    }

    const result = await anthropicResponse.json();

    // Extract text from the Anthropic response format
    const textBlocks = result.content?.filter(
      (block: { type: string }) => block.type === "text"
    );
    const text = textBlocks?.map((b: { text: string }) => b.text).join("") || "";

    if (!text) {
      return new Response("Empty response from AI", { status: 502 });
    }

    // Detect if response was truncated due to max_tokens
    const wasTruncated = result.stop_reason === "max_tokens";

    // Return the raw text with truncation hint header
    return new Response(text, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        ...(wasTruncated ? { "X-Truncated": "true" } : {}),
      },
    });
  } catch (error) {
    console.error("Design API error:", error);
    await refundCredits(user.id, creditCheck.cost, "Refund: design generation failed");
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : "Unknown"}`,
      { status: 500 }
    );
  }
}
