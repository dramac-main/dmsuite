import { NextRequest } from "next/server";

/* ── Chiko — DMSuite's Personal AI Assistant API ─────────────
   Dedicated streaming endpoint for Chiko with full platform
   knowledge, personality, and context awareness.
   ──────────────────────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o";

type Provider = "claude" | "openai";

/* ── Chiko's System Prompt ───────────────────────────────── */

const CHIKO_SYSTEM_PROMPT = `You are **Chiko** ✨ — DMSuite's brilliant personal AI assistant. You live inside DMSuite, an AI-powered design & business creative suite with 194 tools across 8 categories.

## Your Personality
- Warm, witty, and confident — like a super-talented creative director who's also your best friend
- You use occasional emoji naturally (not excessively)
- You're enthusiastic about helping but never condescending
- You address users casually ("Hey!", "Great question!", "Love that idea!")
- Keep responses concise and actionable — no walls of text unless asked
- When you don't know something, you're honest and charming about it
- Your signature sign-off (use sparingly): "— Chiko ✨"

## DMSuite Platform Knowledge — COMPLETE TOOL REGISTRY

### 🎨 Design Studio (design) — 44 tools
**Branding:** logo-generator ✅, logo-animation 🔜, brand-identity ✅, brand-guidelines 🔜
**Stationery:** business-card ✅, letterhead ✅, envelope ✅, compliment-slip 🔜, stamp-seal 🔜
**Social Media:** social-media-post ✅, social-media-story 🔜, social-media-carousel 🔜, social-profile-kit 🔜, pinterest-pin 🔜
**Print:** banner-ad ✅, poster ✅, flyer ✅, brochure ✅, rack-card 🔜, door-hanger 🔜
**Visuals:** infographic ✅, magazine-layout 🔜, book-cover 🔜, newspaper-ad 🔜, icon-illustration ✅
**Photo:** background-remover ✅, image-enhancer ✅, photo-retoucher ✅, ai-image-generator ✅, image-inpainting 🔜
**Product:** mockup-generator ✅, packaging-design ✅, label-designer 🔜, sticker-designer ✅
**Signage:** signage ✅, vehicle-wrap 🧪, window-graphics 🔜, exhibition-stand 🧪
**Apparel:** tshirt-merch ✅, uniform-designer 🧪
**Creative:** pattern-texture 🔜, color-palette ✅, typography-pairing 🔜, mood-board 🔜

### 📄 Document & Print Studio (documents) — 41 tools
**Sales:** sales-book-a4 ✅, sales-book-a5 ✅, product-catalog ✅, lookbook ✅, price-list ✅, line-sheet ✅
**Corporate:** company-profile ✅, proposal-generator ✅, presentation ✅, report-generator ✅, newsletter-print ✅
**Finance:** invoice-designer ✅, quote-estimate ✅, receipt-designer ✅, purchase-order ✅, statement-of-account ✅
**Legal/HR:** contract-template ✅, business-plan ✅, employee-handbook ✅, job-description ✅
**Awards:** certificate ✅, diploma-designer ✅, gift-voucher ✅
**Hospitality:** menu-designer ✅, real-estate-listing ✅, event-program ✅, ticket-designer ✅, id-badge ✅
**Education:** calendar-designer ✅, training-manual ✅, user-guide ✅, worksheet-designer ✅
**Content Docs:** white-paper ✅, case-study ✅, media-kit ✅, ebook-creator ✅
**Career:** resume-cv ✅, cover-letter ✅, portfolio-builder ✅
**Personal:** invitation-designer ✅, greeting-card ✅

### 🎬 Video & Motion Studio (video) — 30 tools
**Core:** video-editor ✅, video-trimmer 🔜, video-merger 🔜
**Motion:** motion-graphics ✅, logo-reveal ✅, intro-outro 🔜, text-animation 🔜, kinetic-typography 🔜
**Effects:** transition-effects 🔜, particle-effects 🧪, 3d-text 🧪
**AI Video:** text-to-video ✅, image-to-video 🔜, ai-b-roll 🧪
**Social:** social-video 🔜, product-demo 🔜, explainer-video 🔜, testimonial-video 🔜, promo-video 🔜, countdown-timer 🔜
**Utilities:** thumbnail-generator ✅, slideshow-video 🔜, subtitle-caption ✅, video-script ✅, gif-converter ✅
**Post:** color-grading 🔜, audio-sync 🔜, screen-recorder 🔜, video-background-remover 🧪, video-compressor ✅

### 🎵 Audio & Voice Studio (audio) — 9 tools
text-to-speech ✅, voice-cloning ✅, voiceover-studio 🔜, podcast-editor ✅, audio-transcription ✅, music-generator ✅, sound-effects 🔜, audio-enhancer 🔜, audio-converter 🔜

### ✍️ Content Creation (content) — 23 tools
**Writing:** blog-writer ✅, website-copy 🔜, landing-page-copy ✅, ebook-writer 🔜
**Social:** social-caption ✅, thread-writer 🔜, hashtag-generator 🔜
**Email:** email-campaign ✅, cold-outreach 🔜
**SEO:** seo-optimizer ✅, meta-description 🔜, ad-copy 🔜, product-description ✅
**Creative:** tagline-slogan 🔜, content-calendar ✅, content-repurposer 🔜
**Professional:** press-release 🔜, speech-writer 🔜, podcast-notes 🔜, youtube-description 🔜, testimonial-generator 🔜
**Utility:** ai-translator 🔜, grammar-checker 🔜

### 📈 Marketing & Sales (marketing) — 18 tools
**Strategy:** marketing-strategy 🔜, campaign-builder 🔜, social-strategy 🔜, brand-positioning 🔜, go-to-market 🔜
**Research:** customer-persona 🔜, competitor-analysis 🔜, market-research 🔜, swot-analysis 🔜
**Sales:** sales-funnel ✅, lead-magnet ✅, sales-deck 🔜, proposal-writer 🔜, ab-test-copy 🔜
**Automation:** email-sequence ✅, pricing-calculator 🔜, roi-calculator 🔜, analytics-dashboard ✅

### 🌐 Web & UI Design (web) — 10 tools
website-builder 🔜, wireframe-generator ✅, ui-component-designer ✅, app-screen-designer 🔜, email-template ✅, favicon-generator 🔜, og-image-generator 🔜, screenshot-beautifier 🔜, css-gradient 🔜, svg-animator 🧪

### 🔧 Utilities & Workflow (utilities) — 19 tools
ai-chat ✅, ai-image-chat 🔜, file-converter ✅, batch-processor ✅, image-compression 🔜, pdf-tools ✅, brand-kit-manager 🔜, asset-library 🔜, style-guide 🔜, project-manager 🔜, client-brief 🔜, feedback-collector 🔜, invoice-tracker 🔜, qr-code ✅, barcode-generator 🔜, watermark-tool 🔜, color-converter 🔜, unit-converter 🔜, contrast-checker 🔜

**Legend:** ✅ = Ready, 🧪 = Beta, 🔜 = Coming Soon
**Total:** 194 tools | 88 ready | 8 beta | 98 coming-soon

### Navigation
- Dashboard: /dashboard — The hub with all categories, search, quick access
- Tool pages: /tools/{categoryId}/{toolId} — e.g., /tools/design/logo-generator
- Command Palette: Ctrl+K / Cmd+K — Quick search across all tools

### Key Features
- **Part-Edit**: Many tools support editing individual elements without redoing the whole design
- **AI Providers**: Claude, Luma, Runway, ElevenLabs, Stable Diffusion, Flux, Midjourney, Suno, Whisper
- **Export Formats**: PNG, JPG, SVG, PDF, MP4, WebM, GIF, DOCX, PPTX, and more
- **Print-Ready**: Professional output with bleed/trim marks for A3-A6, Letter, Legal, DL
- **20 Resume Templates**: Modern Minimalist, Corporate Executive, Creative Bold, Elegant Sidebar, Infographic, Dark Professional, Gradient Creative, Classic Corporate, Artistic Portfolio, Tech Modern, Swiss Typographic, Newspaper Editorial, Brutalist Mono, Pastel Soft, Split Duotone, Architecture Blueprint, Retro Vintage, Medical Clean, Neon Glass, Corporate Stripe
- **Dark/Light Mode**: Toggle with the theme switch or Ctrl+/

### Slash Commands Users Can Use
- /navigate [tool] — Navigate to a specific tool
- /go [tool] — Same as navigate
- /open [tool] — Same as navigate
- /tools — Browse all categories
- /search [query] — Search tools by keyword
- /details [tool] — Get full tool details (providers, exports, features)
- /category [name] — List all tools in a category
- /create [type] — Quick-launch a creative tool (e.g. /create logo, /create resume)
- /shortcuts — Show keyboard shortcuts
- /theme — Toggle dark/light mode
- /help — Show all available commands
- /dashboard — Go to dashboard

## Your Capabilities
1. **Navigate Users** — Guide them to the right tool for their task (you know ALL 194 tools)
2. **Explain Features** — Describe what any tool does, its export formats, AI providers, and status
3. **Creative Help** — Brainstorm ideas, suggest approaches, write copy
4. **Technical Support** — Troubleshoot issues, explain features
5. **Workflow Advice** — Suggest optimal multi-tool workflows for complex projects
6. **Learning** — Teach design concepts, marketing strategy, content creation
7. **Tool Comparison** — Compare similar tools and recommend the best one for a task

## Context Awareness
You'll receive the user's current page context. Use it to:
- Offer relevant suggestions for the current tool they're using
- Provide contextual tips and pro-level advice
- Suggest related tools they might want to try next
- Give navigation paths when suggesting tools (e.g., /tools/design/logo-generator)

## Response Format
- Use **markdown** for formatting (bold, lists, code blocks)
- Keep most responses under 200 words unless explaining something complex
- When suggesting tools, include the navigation path
- When giving step-by-step instructions, use numbered lists
- Offer follow-up suggestions as questions at the end

Remember: You're Chiko, the friendliest and most capable creative AI assistant in the industry! 🚀`;

/* ── POST handler ────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, actions, toolState } = body as {
      messages: { role: string; content: string }[];
      context?: {
        currentPath?: string;
        pageType?: string;
        currentToolId?: string;
        currentCategoryId?: string;
      };
      actions?: { name: string; description: string; input_schema: Record<string, unknown> }[];
      toolState?: Record<string, unknown>;
    };

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid request: messages array required", {
        status: 400,
      });
    }

    // ── Input validation ──────────────────────────────────
    if (messages.length > 40) {
      return new Response("Too many messages", { status: 400 });
    }
    for (const msg of messages) {
      if (typeof msg.content !== "string" || msg.content.length > 10000) {
        return new Response("Invalid message content", { status: 400 });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return new Response("Invalid message role", { status: 400 });
      }
    }

    // Build context-aware system message
    let systemPrompt = CHIKO_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n## Current User Context\n`;
      if (context.currentPath) {
        systemPrompt += `- Page: ${context.currentPath}\n`;
      }
      if (context.pageType) {
        systemPrompt += `- Page type: ${context.pageType}\n`;
      }
      if (context.currentToolId) {
        systemPrompt += `- Current tool: ${context.currentToolId}\n`;
      }
      if (context.currentCategoryId) {
        systemPrompt += `- Current category: ${context.currentCategoryId}\n`;
      }
    }

    // ── Add action system context when tools are registered ──
    const hasActions = actions && Array.isArray(actions) && actions.length > 0;
    if (hasActions) {
      systemPrompt += `\n## Tool Control
You can control the user's current design tool by calling the available functions.
When the user asks you to change something, use the appropriate function instead of just describing what they should do.
Always confirm what you changed after executing an action.
For destructive actions (reset, delete), ask for confirmation before proceeding — do NOT call the function without asking first.
You can read the current state to answer questions about the design without making changes.
Prefer calling actions over describing manual steps.
For ambiguous requests, ask one clarifying question (don't guess).
When changing multiple fields of the same type, combine them into a single action call when possible.
Never fabricate state — read it from the provided context below.\n`;

      if (toolState && typeof toolState === "object") {
        // Only include a reasonable chunk of state to avoid token overflow
        const stateStr = JSON.stringify(toolState, null, 2);
        const truncated = stateStr.length > 4000 ? stateStr.slice(0, 4000) + "\n..." : stateStr;
        systemPrompt += `\n## Current Tool State\n\`\`\`json\n${truncated}\n\`\`\`\n`;
      }
    }

    const provider = resolveProvider();

    if (provider === "openai") {
      return streamOpenAI(messages, systemPrompt, hasActions ? actions : undefined);
    }
    return streamClaude(messages, systemPrompt, hasActions ? actions : undefined);
  } catch (error) {
    console.error("Chiko API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

/* ── Provider resolution ─────────────────────────────────── */

function resolveProvider(): Provider {
  if (ANTHROPIC_API_KEY) return "claude";
  if (OPENAI_API_KEY) return "openai";
  return "claude";
}

/* ── Claude streaming ────────────────────────────────────── */

async function streamClaude(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[],
) {
  if (!ANTHROPIC_API_KEY) {
    return new Response(
      JSON.stringify({
        fallback: true,
        content: getFallbackResponse(messages[messages.length - 1]?.content || ""),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const apiBody: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "assistant",
      content: m.content,
    })),
    stream: true,
  };

  // Add tools if provided
  if (tools && tools.length > 0) {
    apiBody.tools = tools.map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(apiBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Chiko Claude error:", response.status, errorText);
    return new Response(
      JSON.stringify({
        fallback: true,
        content: "Hmm, I'm having a little trouble connecting right now. Try again in a sec! — Chiko ✨",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return new Response("No response body", { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";
      // Track tool_use blocks being streamed
      let currentToolName = "";
      let currentToolInput = "";
      let insideToolUse = false;
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

                // Text delta — pass through as plain text
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "text_delta"
                ) {
                  controller.enqueue(encoder.encode(event.delta.text));
                }

                // Tool use block starts
                if (
                  event.type === "content_block_start" &&
                  event.content_block?.type === "tool_use"
                ) {
                  insideToolUse = true;
                  currentToolName = event.content_block.name || "";
                  currentToolInput = "";
                }

                // Tool use input JSON delta
                if (
                  event.type === "content_block_delta" &&
                  event.delta?.type === "input_json_delta"
                ) {
                  currentToolInput += event.delta.partial_json || "";
                }

                // Content block stop — emit action event if we were in a tool_use block
                if (event.type === "content_block_stop" && insideToolUse) {
                  insideToolUse = false;
                  let parsedParams: Record<string, unknown> = {};
                  try {
                    parsedParams = currentToolInput ? JSON.parse(currentToolInput) : {};
                  } catch {
                    // If partial JSON, try to recover
                  }
                  // Emit action event as a specially formatted line
                  const actionEvent = JSON.stringify({
                    __chiko_action__: true,
                    action: currentToolName,
                    params: parsedParams,
                  });
                  controller.enqueue(encoder.encode(`\n__CHIKO_ACTION__:${actionEvent}\n`));
                  currentToolName = "";
                  currentToolInput = "";
                }
              } catch {
                // skip
              }
            }
          }
        }
      } catch (err) {
        console.error("Chiko stream error:", err);
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

async function streamOpenAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[],
) {
  if (!OPENAI_API_KEY) {
    return new Response(
      JSON.stringify({
        fallback: true,
        content: getFallbackResponse(messages[messages.length - 1]?.content || ""),
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  }

  const apiBody: Record<string, unknown> = {
    model: OPENAI_MODEL,
    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role === "user" ? "user" : ("assistant" as const),
        content: m.content,
      })),
    ],
    stream: true,
  };

  // Add tools if provided (OpenAI format)
  if (tools && tools.length > 0) {
    apiBody.tools = tools.map((t) => ({
      type: "function" as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.input_schema,
      },
    }));
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(apiBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Chiko OpenAI error:", response.status, errorText);
    return new Response(
      JSON.stringify({
        fallback: true,
        content: "Oops, having a brief hiccup! Try again? — Chiko ✨",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }

  const reader = response.body?.getReader();
  if (!reader) {
    return new Response("No response body", { status: 500 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const decoder = new TextDecoder();
      let buffer = "";
      // Track tool calls being streamed
      const toolCalls: Map<number, { name: string; args: string }> = new Map();
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
              if (data === "[DONE]") {
                // Emit any pending tool calls
                for (const [, tc] of toolCalls) {
                  let parsedParams: Record<string, unknown> = {};
                  try {
                    parsedParams = tc.args ? JSON.parse(tc.args) : {};
                  } catch {
                    // partial JSON
                  }
                  const actionEvent = JSON.stringify({
                    __chiko_action__: true,
                    action: tc.name,
                    params: parsedParams,
                  });
                  controller.enqueue(encoder.encode(`\n__CHIKO_ACTION__:${actionEvent}\n`));
                }
                continue;
              }
              try {
                const event = JSON.parse(data);
                const delta = event.choices?.[0]?.delta;
                // Text content
                if (delta?.content) {
                  controller.enqueue(encoder.encode(delta.content));
                }
                // Tool calls delta
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls as { index: number; function?: { name?: string; arguments?: string } }[]) {
                    const idx = tc.index;
                    if (!toolCalls.has(idx)) {
                      toolCalls.set(idx, { name: "", args: "" });
                    }
                    const existing = toolCalls.get(idx)!;
                    if (tc.function?.name) {
                      existing.name = tc.function.name;
                    }
                    if (tc.function?.arguments) {
                      existing.args += tc.function.arguments;
                    }
                  }
                }
              } catch {
                // skip
              }
            }
          }
        }
      } catch (err) {
        console.error("Chiko OpenAI stream error:", err);
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

/* ── Fallback responses (no API key) ─────────────────────── */

function getFallbackResponse(userMessage: string): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("/tools") || msg.includes("what tools") || msg.includes("what can")) {
    return `Hey there! 🎨 DMSuite has **194 AI-powered tools** across 8 categories:\n\n1. 🎨 **Design Studio** (44 tools) — Logos, business cards, social media, posters, packaging, signage, apparel\n2. 📄 **Documents & Print** (41 tools) — Resumes (20 templates!), invoices, proposals, contracts, certificates\n3. 🎬 **Video & Motion** (30 tools) — Editor, text-to-video, logo reveal, motion graphics, subtitles\n4. 🎵 **Audio & Voice** (9 tools) — Text-to-speech, voice cloning, podcast editing, music generator\n5. ✍️ **Content Creation** (23 tools) — Blog writer, email campaigns, SEO optimizer, social captions\n6. 📈 **Marketing & Sales** (18 tools) — Sales funnels, lead magnets, email sequences, analytics\n7. 🌐 **Web & UI** (10 tools) — Wireframes, UI components, email templates\n8. 🔧 **Utilities** (19 tools) — AI chat, file converter, QR codes, PDF tools, batch processing\n\n88 tools are ready to use right now! Use **Ctrl+K** to search, or type **/navigate [tool]** to jump to any tool! What would you like to create?`;
  }

  if (msg.includes("/navigate") || msg.includes("go to") || msg.includes("take me")) {
    return `I'd love to navigate you there! 🧭 Here are some popular spots:\n\n- **Logo Generator**: /tools/design/logo-generator\n- **Resume Builder**: /tools/documents/resume-cv\n- **Business Card**: /tools/design/business-card\n- **Video Editor**: /tools/video/video-editor\n- **AI Chat**: /tools/utilities/ai-chat\n- **Invoice Designer**: /tools/documents/invoice-designer\n- **Social Post**: /tools/design/social-media-post\n- **Dashboard**: /dashboard\n\nType **/navigate [tool name]** to jump to any of our 194 tools! Or tell me what you want to create and I'll suggest the perfect tool.`;
  }

  if (msg.includes("/help") || msg.includes("how do") || msg.includes("how to")) {
    return `Happy to help! 🙋‍♂️ Here's what I can do:\n\n## Commands\n- **/tools** — Browse all 194 tools\n- **/navigate [tool]** — Jump to any tool\n- **/search [query]** — Search by keyword\n- **/details [tool]** — Full tool info (AI providers, exports)\n- **/category [name]** — List tools in a category\n- **/create [type]** — Quick-launch (logo, resume, video...)\n- **/shortcuts** — Keyboard shortcuts\n- **/theme** — Toggle dark/light\n\n## Or Just Ask!\n- "Create a logo for my bakery"\n- "What tool is best for social media?"\n- "Help me build a resume"\n- "Compare poster vs flyer"\n\nI know every single tool in detail! What do you need help with?`;
  }

  if (msg.includes("hello") || msg.includes("hi") || msg.includes("hey")) {
    return `Hey there! 👋 I'm **Chiko**, your personal creative assistant!\n\nI know everything about DMSuite's **194 tools** across 8 categories. I can navigate you to any tool, explain features, brainstorm ideas, write copy, suggest workflows, and much more.\n\nWhat are we building today? 🚀`;
  }

  if (msg.includes("/shortcuts") || msg.includes("keyboard") || msg.includes("shortcut")) {
    return `Here are the key shortcuts! ⌨️\n\n- **Ctrl+K** — Command Palette (search all tools)\n- **Ctrl+.** — Summon me (Chiko!)\n- **Ctrl+/** — Toggle dark/light mode\n- **Ctrl+B** — Toggle sidebar\n- **Ctrl+H** — Go to Dashboard\n- **?** — Shortcuts help overlay\n- **Esc** — Close panels/modals\n\nOn mobile, I'm always one tap away in the corner! 📱`;
  }

  if (msg.includes("resume") || msg.includes("cv")) {
    return `Great choice! 📄 The **Resume & CV Builder** is one of our most powerful tools!\n\n✨ **Features:**\n- 20 professional templates (Modern Minimalist to Neon Glass)\n- AI-powered content generation\n- Smart auto-pagination (no content overflow!)\n- Export to PDF, DOCX, and more\n- Real-time preview with page breaks\n- Print-ready with professional margins\n\n👉 Navigate to **/tools/documents/resume-cv** to get started!\n\nWant me to recommend a template style?`;
  }

  if (msg.includes("logo")) {
    return `Let's create a stunning logo! 🎨\n\nThe **Logo Generator** supports:\n- Wordmarks, icon marks, emblems, lettermarks & combo marks\n- AI-powered generation (Claude, Stable Diffusion, Flux)\n- Export: SVG, PNG, PDF, EPS, AI\n- Part-edit: change colors/text without redoing everything\n\n👉 Head to **/tools/design/logo-generator**\n\nWant help brainstorming logo concepts for your brand?`;
  }

  if (msg.includes("video") || msg.includes("motion")) {
    return `Let's make some video magic! 🎬\n\nReady-to-use video tools:\n- **AI Video Editor** — Full editing with AI assistance\n- **Text-to-Video** — Generate videos from descriptions\n- **Logo Reveal** — Cinematic logo animations\n- **Motion Graphics** — Animated designs\n- **Subtitle Generator** — Auto-caption your videos\n- **GIF Converter** — Turn videos into GIFs\n\n👉 Start at **/tools/video/video-editor**\n\nWhat kind of video are you looking to create?`;
  }

  if (msg.includes("design") || msg.includes("graphic")) {
    return `I love design! 🎨 The Design Studio has **44 tools** covering:\n\n- **Branding**: Logo, brand identity, brand guidelines\n- **Print**: Posters, flyers, brochures, infographics\n- **Social Media**: Posts, stories, carousels, banners\n- **Packaging**: Product packaging, labels, stickers\n- **Photo**: Background remover, enhancer, AI image gen\n- **Signage**: Signs, vehicle wraps, exhibition stands\n- **Apparel**: T-shirts, uniforms\n\nWhat do you want to design? I'll pick the perfect tool! 🎯`;
  }

  return `Hey! 👋 I'm **Chiko**, your DMSuite assistant!\n\nI can help you:\n- 🔍 **Find tools** — Tell me what you want to create\n- 💡 **Get ideas** — I'll brainstorm with you\n- 🎓 **Learn features** — I know all 194 tools inside out\n- 🧭 **Navigate** — I'll take you where you need to go\n- ✍️ **Write copy** — Headlines, descriptions, anything\n\nTry **/tools**, **/help**, **/navigate [tool]**, or just describe what you want to build!\n\n*Note: Connect an AI API key in .env.local for full conversational AI!*`;
}
