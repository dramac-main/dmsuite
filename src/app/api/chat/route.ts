import { NextRequest } from "next/server";

/* ── Environment ──────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

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
  try {
    const { messages, provider: requestedProvider } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    // Determine which provider to use
    const provider = resolveProvider(requestedProvider);

    if (provider === "openai") {
      return streamOpenAI(messages);
    } else {
      return streamClaude(messages);
    }
  } catch (error) {
    console.error("Chat API error:", error);
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

async function streamClaude(messages: { role: string; content: string }[]) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      "ANTHROPIC_API_KEY is not configured. Add it to your .env.local file.",
      { status: 500 }
    );
  }

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
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; content: string }) => ({
          role: m.role === "user" ? "user" : "assistant",
          content: m.content,
        })),
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
              } catch {
                // Skip non-JSON lines
              }
            }
          }
        }
      } catch (error) {
        console.error("Claude stream error:", error);
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

/* ── OpenAI streaming ────────────────────────────────────── */

async function streamOpenAI(messages: { role: string; content: string }[]) {
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
          { role: "system", content: SYSTEM_PROMPT },
          ...messages.map((m: { role: string; content: string }) => ({
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
