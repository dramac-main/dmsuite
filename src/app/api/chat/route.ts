// =============================================================================
// DMSuite — AI Chat Multi-Model Streaming API Route
// POST /api/chat/route.ts
// Supports Claude (Anthropic), GPT-4o (OpenAI), Gemini (Google), DeepSeek
// Streaming responses with credit system integration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatRequestMessage {
  role: "user" | "assistant" | "system";
  content: string | Array<{ type: string; text?: string; image_url?: { url: string }; source?: { type: string; media_type: string; data: string } }>;
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
// Provider: Anthropic (Claude)
// ---------------------------------------------------------------------------

async function streamClaude(
  messages: ChatRequestMessage[],
  model: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream> {
  if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not configured");

  // Convert messages for Anthropic format (separate system prompt)
  const apiMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => {
      if (typeof m.content === "string") {
        return { role: m.role, content: m.content };
      }
      // Multimodal: convert to Anthropic format
      const parts = (m.content as Array<{ type: string; text?: string; image_url?: { url: string } }>).map((p) => {
        if (p.type === "text") return { type: "text" as const, text: p.text || "" };
        if (p.type === "image_url" && p.image_url?.url) {
          const match = p.image_url.url.match(/^data:(image\/\w+);base64,(.+)/);
          if (match) {
            return {
              type: "image" as const,
              source: { type: "base64" as const, media_type: match[1], data: match[2] },
            };
          }
        }
        return { type: "text" as const, text: "" };
      });
      return { role: m.role, content: parts };
    });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: apiMessages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Anthropic API error ${response.status}: ${err}`);
  }

  return transformSSE(response.body!, "claude");
}

// ---------------------------------------------------------------------------
// Provider: OpenAI (GPT-4o)
// ---------------------------------------------------------------------------

async function streamOpenAI(
  messages: ChatRequestMessage[],
  model: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream> {
  if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  return transformSSE(response.body!, "openai");
}

// ---------------------------------------------------------------------------
// Provider: Google Gemini
// ---------------------------------------------------------------------------

async function streamGemini(
  messages: ChatRequestMessage[],
  model: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream> {
  if (!GOOGLE_AI_API_KEY) throw new Error("GOOGLE_AI_API_KEY not configured");

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: typeof m.content === "string"
        ? [{ text: m.content }]
        : (m.content as Array<{ type: string; text?: string }>).map((p) =>
            p.type === "text" ? { text: p.text || "" } : { text: "" }
          ),
    }));

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { temperature, maxOutputTokens: maxTokens },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  return transformSSE(response.body!, "gemini");
}

// ---------------------------------------------------------------------------
// Provider: DeepSeek (OpenAI-compatible)
// ---------------------------------------------------------------------------

async function streamDeepSeek(
  messages: ChatRequestMessage[],
  model: string,
  systemPrompt: string,
  temperature: number,
  maxTokens: number,
): Promise<ReadableStream> {
  if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY not configured");

  const apiMessages = [
    { role: "system", content: systemPrompt },
    ...messages.filter((m) => m.role !== "system"),
  ];

  const response = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages: apiMessages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${err}`);
  }

  return transformSSE(response.body!, "openai"); // DeepSeek uses OpenAI-compatible SSE
}

// ---------------------------------------------------------------------------
// SSE → Text Stream Transform
// ---------------------------------------------------------------------------

function transformSSE(
  body: ReadableStream<Uint8Array>,
  format: "claude" | "openai" | "gemini",
): ReadableStream {
  const decoder = new TextDecoder();
  let buffer = "";

  return new ReadableStream({
    async start(controller) {
      const reader = body.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              let text = "";

              if (format === "claude") {
                if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                  text = parsed.delta.text;
                }
              } else if (format === "openai") {
                text = parsed.choices?.[0]?.delta?.content || "";
              } else if (format === "gemini") {
                text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || "";
              }

              if (text) {
                controller.enqueue(new TextEncoder().encode(text));
              }
            } catch {
              // Skip malformed JSON lines
            }
          }
        }
      } finally {
        reader.releaseLock();
        controller.close();
      }
    },
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

    let stream: ReadableStream;

    switch (provider) {
      case "claude":
        stream = await streamClaude(messages, model, sysPrompt, temp, tokens);
        break;
      case "openai":
        stream = await streamOpenAI(messages, model, sysPrompt, temp, tokens);
        break;
      case "gemini":
        stream = await streamGemini(messages, model, sysPrompt, temp, tokens);
        break;
      case "deepseek":
        stream = await streamDeepSeek(messages, model, sysPrompt, temp, tokens);
        break;
      default:
        await refundCredits(user.id, creditCheck.cost, "Refund: unsupported provider");
        return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
    }

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err) {
    await refundCredits(user.id, creditCheck.cost, "Refund: stream error");
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
