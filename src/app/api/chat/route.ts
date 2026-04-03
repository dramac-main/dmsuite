import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits, getCreditCost, logTokenUsage } from "@/lib/supabase/credits";

/* ── Environment ──────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

type Provider = "claude" | "openai";

const SYSTEM_PROMPT = `You are DMSuite AI — a professional creative assistant built into an AI-powered design & business suite. You help users with:

- Copywriting (taglines, product descriptions, blog posts, social captions)
- Creative brainstorming (campaign ideas, naming, brand strategy)
- Business writing (proposals, emails, presentations)
- Code assistance (web development, scripting, automation)
- Design guidance (color theory, typography, layout advice)
- Marketing strategy (SEO, content planning, audience research)
- Logo design (SVG generation, branding concepts)
- Social media content (post copy, engagement hooks)

Guidelines:
- Be concise but thorough. Quality over quantity.
- Use markdown formatting for readability (bold, lists, code blocks).
- When generating copy, provide 2-3 variations unless asked for a specific number.
- Always sound professional yet approachable.
- If asked about design assets (logos, images, videos), explain what the user can do with the relevant DMSuite tools.
- When asked to generate SVG logos, output clean valid SVG code directly.`;

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const creditCheck = await checkCredits(user.id, "chat-message");
    if (!creditCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, provider: requestedProvider, systemPrompt: clientSystemPrompt } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    // Allow per-conversation system prompt override (sanitized — max 2000 chars)
    const activeSystemPrompt =
      typeof clientSystemPrompt === "string" && clientSystemPrompt.trim()
        ? clientSystemPrompt.slice(0, 2000)
        : SYSTEM_PROMPT;

    // Deduct credits before making AI call
    const deduction = await deductCredits(user.id, "chat-message", "AI Chat message");
    if (!deduction.success) {
      return new Response(
        JSON.stringify({ error: deduction.error || "Credit deduction failed" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine which provider to use
    const provider = resolveProvider(requestedProvider);

    let response: Response;
    if (provider === "openai") {
      response = await streamOpenAI(messages, activeSystemPrompt);
    } else {
      response = await streamClaude(messages, user.id, activeSystemPrompt);
    }

    // If the AI call itself failed, refund the credit
    if (!response.ok) {
      await refundCredits(user.id, creditCheck.cost, "Refund: AI Chat message failed");
    }

    return response;
  } catch (error) {
    console.error("Chat API error:", error);
    await refundCredits(user.id, getCreditCost("chat-message"), "Refund: AI Chat error");
    return new Response("Internal server error", { status: 500 });
  }
}

/* ── Provider resolution ─────────────────────────────────── */

function resolveProvider(requested?: string): Provider {
  if (requested === "openai" && OPENAI_API_KEY) return "openai";
  if (requested === "claude" && ANTHROPIC_API_KEY) return "claude";
  if (ANTHROPIC_API_KEY) return "claude";
  if (OPENAI_API_KEY) return "openai";
  return "claude";
}

/* ── Anthropic Claude streaming ──────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamClaude(messages: { role: string; content: string | any[] }[], userId: string, sysPrompt: string = SYSTEM_PROMPT) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.",
      { status: 500 }
    );
  }

  // Convert messages to Anthropic format, handling multimodal content
  const anthropicMessages = messages.map((m) => {
    const role = m.role === "user" ? "user" : "assistant";
    // If content is a string, pass directly
    if (typeof m.content === "string") {
      return { role, content: m.content };
    }
    // If content is an array (multimodal), convert image_url parts to Anthropic format
    const parts = (m.content as Array<Record<string, unknown>>).map((part) => {
      if (part.type === "image_url") {
        const url = (part.image_url as { url: string })?.url ?? "";
        // Extract base64 data and media type from data URL
        const match = url.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
          return {
            type: "image",
            source: { type: "base64", media_type: match[1], data: match[2] },
          };
        }
        // Fallback: URL-based image (not base64)
        return { type: "image", source: { type: "url", url } };
      }
      return part;
    });
    return { role, content: parts };
  });

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
        max_tokens: 4096,
        system: sysPrompt,
        messages: anthropicMessages,
        stream: true,
      }),
    }
  );

  if (!anthropicResponse.ok) {
    const errorText = await anthropicResponse.text();
    console.error("Anthropic API error:", anthropicResponse.status, errorText);
    return new Response(
      `Anthropic API error: ${anthropicResponse.status}`,
      { status: anthropicResponse.status }
    );
  }

  const reader = anthropicResponse.body?.getReader();
  if (!reader) {
    return new Response("No response body from Anthropic", { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";
      let inputTokens = 0;
      let outputTokens = 0;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta"
                ) {
                  controller.enqueue(encoder.encode(event.delta.text));
                }
                // Capture token usage from stream events
                if (event.type === "message_start" && event.message?.usage) {
                  inputTokens = event.message.usage.input_tokens ?? 0;
                }
                if (event.type === "message_delta" && event.usage) {
                  outputTokens = event.usage.output_tokens ?? 0;
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error("Claude stream error:", error);
      } finally {
        // Log token usage after stream completes
        if (inputTokens > 0 || outputTokens > 0) {
          logTokenUsage(userId, "chat-message", {
            inputTokens,
            outputTokens,
            model: ANTHROPIC_MODEL,
          }).catch((e) => console.error("Failed to log token usage:", e));
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

/* ── OpenAI streaming ────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function streamOpenAI(messages: { role: string; content: string | any[] }[], sysPrompt: string = SYSTEM_PROMPT) {
  if (!OPENAI_API_KEY) {
    return new Response(
      "OPENAI_API_KEY is not configured. Add it to your .env.local file.",
      { status: 500 }
    );
  }

  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        max_tokens: 4096,
        messages: [
          { role: "system", content: sysPrompt },
          ...messages.map((m) => ({
            role: m.role === "user" ? "user" : ("assistant" as const),
            content: m.content,
          })),
        ],
        stream: true,
      }),
    }
  );

  if (!openaiResponse.ok) {
    const errorText = await openaiResponse.text();
    console.error("OpenAI API error:", openaiResponse.status, errorText);
    return new Response(
      `OpenAI API error: ${openaiResponse.status}`,
      { status: openaiResponse.status }
    );
  }

  const reader = openaiResponse.body?.getReader();
  if (!reader) {
    return new Response("No response body from OpenAI", { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6).trim();
              if (data === "[DONE]") continue;

              try {
                const event = JSON.parse(data);
                const content = event.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(encoder.encode(content));
                }
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error("OpenAI stream error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "Transfer-Encoding": "chunked",
    },
  });
}

/* ── GET: Provider status endpoint ───────────────────────── */

export async function GET() {
  return Response.json({
    providers: {
      claude: { available: !!ANTHROPIC_API_KEY, model: ANTHROPIC_MODEL },
      openai: { available: !!OPENAI_API_KEY, model: OPENAI_MODEL },
    },
    defaultProvider: resolveProvider(),
  });
}
