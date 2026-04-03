// =============================================================================
// DMSuite — AI Flow Builder API Route
// Handles LLM execution requests for flow nodes (models, agents, prompts).
// Auth → Credit check → Anthropic call → Credit deduction → Response
// =============================================================================

import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits } from "@/lib/supabase/credits";
import type { TokenUsage } from "@/lib/supabase/credits";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(request: NextRequest) {
  // ── Auth ──
  const user = await getAuthUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  // ── Credit check ──
  const creditCheck = await checkCredits(user.id, "chiko-message");
  if (!creditCheck.allowed) {
    return new Response(
      JSON.stringify({
        error: "Insufficient credits",
        needed: creditCheck.cost,
        balance: creditCheck.balance,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json();
    const {
      nodeType,
      systemPrompt,
      userMessage,
      model,
      temperature,
      maxTokens,
    } = body as {
      nodeType?: string;
      systemPrompt?: string;
      userMessage?: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
    };

    if (!userMessage) {
      return new Response("userMessage is required", { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return new Response(
        "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.",
        { status: 500 }
      );
    }

    const resolvedModel = model || ANTHROPIC_MODEL;
    const resolvedTemp = typeof temperature === "number" ? temperature : 0.7;
    const resolvedMaxTokens = maxTokens || 4096;

    // Build messages array
    const messages: Array<{ role: string; content: string }> = [
      { role: "user", content: userMessage },
    ];

    // ── Call Anthropic ──
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
          model: resolvedModel,
          max_tokens: resolvedMaxTokens,
          temperature: resolvedTemp,
          ...(systemPrompt ? { system: systemPrompt } : {}),
          messages,
          stream: false,
        }),
      }
    );

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error(
        `AI Flow Builder API error (${nodeType}):`,
        anthropicResponse.status,
        errorText
      );
      return new Response("AI service error — please try again", {
        status: 502,
      });
    }

    const result = await anthropicResponse.json();

    // Extract text from response
    const textBlocks = result.content?.filter(
      (block: { type: string }) => block.type === "text"
    );
    const text =
      textBlocks?.map((b: { text: string }) => b.text).join("") || "";

    if (!text) {
      return new Response("Empty response from AI", { status: 502 });
    }

    // ── Credit deduction with token tracking ──
    const tokenUsage: TokenUsage | undefined = result.usage
      ? {
          inputTokens: result.usage.input_tokens ?? 0,
          outputTokens: result.usage.output_tokens ?? 0,
          model: resolvedModel,
        }
      : undefined;

    const deduction = await deductCredits(
      user.id,
      "chiko-message",
      `AI Flow Builder: ${nodeType || "model"} execution`,
      undefined,
      tokenUsage
    );

    if (!deduction.success) {
      return new Response(
        JSON.stringify({ error: "Failed to deduct credits" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Return response ──
    return new Response(
      JSON.stringify({
        text,
        nodeType,
        model: resolvedModel,
        usage: tokenUsage,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error("AI Flow Builder API error:", error);
    return new Response(
      `Internal server error: ${error instanceof Error ? error.message : "Unknown"}`,
      { status: 500 }
    );
  }
}
