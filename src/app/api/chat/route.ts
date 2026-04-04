// =============================================================================
// DMSuite — AI Chat Multi-Model Streaming API Route
// POST /api/chat
// Powered by Vercel AI SDK — supports Anthropic, OpenAI, Google, DeepSeek
// Streaming responses with credit system integration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { streamText, type ModelMessage, type TextPart, type ImagePart } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

// ---------------------------------------------------------------------------
// DeepSeek provider (OpenAI-compatible)
// ---------------------------------------------------------------------------

const deepseek = createOpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY ?? "",
});

// ---------------------------------------------------------------------------
// Types (client request body)
// ---------------------------------------------------------------------------

interface ChatRequestPart {
  type: string;
  text?: string;
  image_url?: { url: string };
}

interface ChatRequestMessage {
  role: "user" | "assistant" | "system";
  content: string | ChatRequestPart[];
}

interface ChatRequestBody {
  messages: ChatRequestMessage[];
  model: string;
  provider: "claude" | "openai" | "gemini" | "deepseek";
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// ---------------------------------------------------------------------------
// Provider → AI SDK model mapping
// ---------------------------------------------------------------------------

function getModel(provider: string, model: string) {
  switch (provider) {
    case "claude":
      return anthropic(model);
    case "openai":
      return openai(model);
    case "gemini":
      return google(model);
    case "deepseek":
      return deepseek(model);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

// ---------------------------------------------------------------------------
// Convert client messages → AI SDK CoreMessage[]
// (handles multimodal image_url → image conversion)
// ---------------------------------------------------------------------------

function convertMessages(
  messages: ChatRequestMessage[],
): ModelMessage[] {
  return messages
    .filter((m) => m.role !== "system")
    .map((m): ModelMessage => {
      if (typeof m.content === "string") {
        return { role: m.role as "user" | "assistant", content: m.content };
      }

      // Multimodal content (images) — only applicable to user messages
      const parts: (TextPart | ImagePart)[] = m.content.map((p) => {
        if (p.type === "image_url" && p.image_url?.url) {
          return { type: "image" as const, image: p.image_url.url };
        }
        return { type: "text" as const, text: p.text || "" };
      });

      return { role: "user" as const, content: parts };
    });
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Auth
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Credits
  const creditCheck = await checkCredits(user.id, "chat-message");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost },
      { status: 402 },
    );
  }

  const deduction = await deductCredits(user.id, "chat-message", "AI Chat message");
  if (!deduction.success) {
    return NextResponse.json({ error: deduction.error || "Credit deduction failed" }, { status: 402 });
  }

  try {
    const body = (await request.json()) as ChatRequestBody;
    const { messages, model, provider, systemPrompt, temperature, maxTokens } = body;

    if (!messages?.length || !model || !provider) {
      await refundCredits(user.id, creditCheck.cost, "Refund: missing params");
      return NextResponse.json({ error: "messages, model, and provider are required" }, { status: 400 });
    }

    const sysPrompt = systemPrompt || "You are a helpful AI assistant.";
    const temp = typeof temperature === "number" ? Math.min(Math.max(temperature, 0), 2) : 0.7;
    const tokens = typeof maxTokens === "number" ? Math.min(maxTokens, 8192) : 4096;

    let aiModel;
    try {
      aiModel = getModel(provider, model);
    } catch {
      await refundCredits(user.id, creditCheck.cost, "Refund: unsupported provider");
      return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    const result = streamText({
      model: aiModel,
      system: sysPrompt,
      messages: convertMessages(messages),
      temperature: temp,
      maxOutputTokens: tokens,
    });

    return result.toTextStreamResponse({
      headers: {
        "Cache-Control": "no-cache",
      },
    });
  } catch (err) {
    await refundCredits(user.id, creditCheck.cost, "Refund: stream error");
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
