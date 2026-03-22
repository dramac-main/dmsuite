import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";

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

const CHIKO_SYSTEM_PROMPT = `You are **Chiko** ✨ — DMSuite's personal AI assistant. DMSuite is an AI-powered design & business creative suite with 194 tools across 8 categories (Design, Documents, Video, Audio, Content, Marketing, Web, Utilities).

## Personality
Warm, witty, confident. Casual ("Hey!", "Great question!"). Concise — no walls of text. Honest when unsure. Occasional emoji. Sign-off (sparingly): "— Chiko ✨"

## Capabilities
1. **Navigate** — Guide users to tools. Paths: /tools/{categoryId}/{toolId}. Dashboard: /dashboard. Cmd+K for search.
2. **Tool Control** — When actions are available, call functions directly instead of describing manual steps.
3. **Creative Help** — Brainstorm, write copy, suggest approaches.
4. **Workflow** — Multi-tool project guidance.

## Response Rules
- Markdown formatting. Under 200 words unless complex.
- When suggesting tools, include path.
- Numbered lists for steps.
- **File-first rule:** When the user's message has an attached file, ALWAYS read and reference the extracted data BEFORE responding. Never ask for information that's already in the file. Use the data directly.

## Quick-Reply Buttons
End responses with clickable buttons when there's a clear next action:
__QUICK_REPLIES__:["Button 1", "Button 2"]
Max 4 buttons, 2-6 words each. Don't mention them in text. Always include after completing tool actions.`;

/* ── Tool registry — injected only for navigation/search queries ── */
const TOOL_REGISTRY = `
### Tool Categories (194 total: 88 ready ✅, 8 beta 🧪, 98 coming 🔜)
**Design (44):** logo-generator✅, brand-identity✅, business-card✅, letterhead✅, envelope✅, social-media-post✅, banner-ad✅, poster✅, flyer✅, brochure✅, infographic✅, background-remover✅, image-enhancer✅, photo-retoucher✅, ai-image-generator✅, mockup-generator✅, packaging-design✅, sticker-designer✅, signage✅, tshirt-merch✅, color-palette✅, icon-illustration✅, vehicle-wrap🧪, exhibition-stand🧪, uniform-designer🧪, +19🔜
**Documents (41):** sales-book-a4/a5✅, product-catalog✅, lookbook✅, price-list✅, line-sheet✅, company-profile✅, proposal-generator✅, presentation✅, report-generator✅, newsletter-print✅, invoice-designer✅, quote-estimate✅, receipt-designer✅, purchase-order✅, statement-of-account✅, contract-template✅, business-plan✅, certificate✅, diploma-designer✅, gift-voucher✅, menu-designer✅, real-estate-listing✅, event-program✅, ticket-designer✅, id-badge✅, calendar-designer✅, resume-cv✅, cover-letter✅, portfolio-builder✅, +12🔜
**Video (30):** video-editor✅, motion-graphics✅, logo-reveal✅, text-to-video✅, thumbnail-generator✅, subtitle-caption✅, video-script✅, gif-converter✅, video-compressor✅, +21🔜
**Audio (9):** text-to-speech✅, voice-cloning✅, podcast-editor✅, audio-transcription✅, music-generator✅, +4🔜
**Content (23):** blog-writer✅, landing-page-copy✅, social-caption✅, email-campaign✅, seo-optimizer✅, product-description✅, content-calendar✅, +16🔜
**Marketing (18):** sales-funnel✅, lead-magnet✅, email-sequence✅, analytics-dashboard✅, +14🔜
**Web (10):** wireframe-generator✅, ui-component-designer✅, email-template✅, +7🔜
**Utilities (19):** ai-chat✅, file-converter✅, batch-processor✅, pdf-tools✅, qr-code✅, +14🔜
Nav: /tools/{category}/{tool-id} | Dashboard: /dashboard | Cmd+K search`;

/** Check if user message is specifically asking about navigation or tool discovery */
function needsToolRegistry(messages: { role: string; content: string }[]): boolean {
  const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() || "";
  const navWords = /\b(navigate|go to|open tool|find.*tool|search.*tool|browse tools|which tool|help me find|what tools|show me tools|available tools|recommend.*tool|suggest.*tool|\/navigate|\/go|\/open|\/tools|\/search|\/category|\/help)\b/i;
  return navWords.test(lastMsg);
}

/* ── POST handler ────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return new Response("Invalid JSON in request body", { status: 400 });
    }
    const { messages, context, actions, toolState, fileContext, businessProfile, workflowContext, logoImage, logoColors } = body as {
      messages: { role: string; content: string }[];
      context?: {
        currentPath?: string;
        pageType?: string;
        currentToolId?: string;
        currentCategoryId?: string;
      };
      actions?: { name: string; description: string; input_schema: Record<string, unknown> }[];
      toolState?: Record<string, unknown>;
      fileContext?: {
        fileName: string;
        extractionType: string;
        summary: string;
        text?: string;
        detectedFields?: Record<string, string>;
        tables?: { title?: string; headers?: string[]; rowCount: number }[];
        images?: { name: string; width: number; height: number; mimeType: string }[];
        documentFonts?: string[];
        documentColors?: string[];
      };
      businessProfile?: string;
      workflowContext?: string;
      /** Base64 logo image (without data URI prefix) for vision input */
      logoImage?: { data: string; mediaType: string };
      /** Dominant colors extracted from the logo, as hex strings */
      logoColors?: string[];
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

    // ── Auth & credit check ───────────────────────────────
    const user = await getAuthUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const creditCheck = await checkCredits(user.id, "chiko-message");
    if (!creditCheck.allowed) {
      return new Response(
        JSON.stringify({ error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    const deduction = await deductCredits(user.id, "chiko-message", "Chiko AI message");
    if (!deduction.success) {
      return new Response(
        JSON.stringify({ error: deduction.error || "Credit deduction failed" }),
        { status: 402, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build context-aware system message
    let systemPrompt = CHIKO_SYSTEM_PROMPT;

    // ── Inject Business Memory profile when available ──
    if (businessProfile && typeof businessProfile === "string" && businessProfile.trim() !== "") {
      systemPrompt += `\n\n## User's Business Profile\n${businessProfile}\n\nInstructions for Business Memory:\n- When the user mentions business details, offer to save them\n- When a design tool is open and you have saved data, proactively offer to pre-fill\n- NEVER auto-fill without explicit user confirmation\n- Compare uploaded file fields with stored profile — offer to update differences\n- Profile is local-only — reassure about privacy if asked\n- Respond to "what do you know about me" with the stored profile\n- If no profile: "I don't have any business details saved yet. Tell me about your business!"`;
    }

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

    // ── Inject tool registry only for navigation/search queries ──
    if (needsToolRegistry(messages)) {
      systemPrompt += `\n\n${TOOL_REGISTRY}`;
    }

    // ── Add file context when files are attached ──
    if (fileContext && typeof fileContext === "object") {
      systemPrompt += `\n\n## Uploaded File Context
The user has uploaded a file. Here are the extracted details:

File: ${fileContext.fileName} (${fileContext.extractionType}, ${fileContext.summary})`;

      if (fileContext.detectedFields && Object.keys(fileContext.detectedFields).length > 0) {
        systemPrompt += `\n\nDetected Business Fields:\n${JSON.stringify(fileContext.detectedFields, null, 2)}`;
      }

      // Include full document text so the AI can deeply understand the content
      if (fileContext.text && fileContext.text.length > 0) {
        systemPrompt += `\n\n### Full Document Text\n\`\`\`\n${fileContext.text}\n\`\`\``;
      }

      if (fileContext.tables && fileContext.tables.length > 0) {
        systemPrompt += `\n\nTables Found: ${fileContext.tables.length}`;
        for (const t of fileContext.tables) {
          systemPrompt += `\n- ${t.title || "Untitled"}: ${t.headers?.join(", ") || "no headers"} (${t.rowCount} rows)`;
        }
      }

      if (fileContext.images && fileContext.images.length > 0) {
        systemPrompt += `\n\nImages Found: ${fileContext.images.length}`;
        for (const img of fileContext.images) {
          systemPrompt += `\n- ${img.name}: ${img.width}\u00d7${img.height} ${img.mimeType}`;
        }
      }

      // ── Inject document styling data (fonts & colors extracted from the file) ──
      if (fileContext.documentFonts && fileContext.documentFonts.length > 0) {
        systemPrompt += `\n\n### Document Fonts (extracted from file rendering data)\nThe following font families are used IN THE ACTUAL DOCUMENT: ${fileContext.documentFonts.join(", ")}\nThese are the REAL fonts the document was designed with. Match your font pairing to these — pick the closest available pairing.`;
      }

      if (fileContext.documentColors && fileContext.documentColors.length > 0) {
        systemPrompt += `\n\n### Document Colors (extracted from file rendering data)\nThe following colors are used IN THE ACTUAL DOCUMENT (sorted by prominence): ${fileContext.documentColors.join(", ")}\nThe FIRST color is the most prominent brand color. Use it as the accent color. These are EXACT hex values from the document — do NOT guess different colors.`;
      }

      systemPrompt += `\n\n### CRITICAL: Brand-Aware File Handling
You have the FULL document content above. You MUST:

1. **Read & understand the ENTIRE document** — company description, services, industry, brand personality, colors, tagline — BEFORE responding.
2. **Use ALL extracted data directly** — do NOT ask for information that is already in the file. Fill in company name, phone, email, address, etc. from the detected fields.
3. **Identify the brand identity using EXTRACTED styling data:**
   - **FONTS:** If "Document Fonts" are provided above, match them to the closest available font pairing. Do NOT invent fonts — use the fonts FROM the document. Map: Montserrat→montserrat-opensans, Poppins→poppins-inter, Playfair→playfair-source, Raleway→raleway-lato, Inter→inter-inter, Open Sans→montserrat-opensans, Roboto→inter-inter, Lato→raleway-lato, Source Sans→playfair-source, DM Sans→dmserif-dmsans, IBM Plex→ibmplex-ibmplex, Space Grotesk→spacegrotesk-inter, Crimson→crimsonpro-worksans, Bitter→bitter-inter, Cormorant→cormorant-proza, JetBrains→jetbrains-inter.
   - **COLORS:** If "Document Colors" are provided above, use the FIRST (most prominent) color as the accent color. These are EXACT hex values — use them directly. Do NOT substitute with a different color unless the user asks.
   - If no document fonts/colors are extracted, THEN fall back to industry-appropriate choices.
   - Industry/sector: Use the detected industry to choose appropriate design tone (corporate, creative, medical, tech, etc.).
   - Company personality: Infer from the description and services — formal vs. casual, traditional vs. innovative, luxury vs. accessible.
4. **Make HOLISTIC design decisions** — don't just fill text fields. Adapt to whichever tool is currently open:
   - **Sales Book / Invoice / Quotation tools:** Call updateBranding/updateBusinessInfo with business fields from the file, AND updateStyle/updateStyling with template, accentColor, fontPairing chosen to match the brand. Combine actions in one response.
   - **Resume / CV Builder:** Call updateBasics with personal details from the file (name, email, phone, headline, location, website), AND updateStyling with template, accentColor, fontPairing that match the person's industry/profession.
   - **Any design tool:** When style/design actions are available (setAccentColor, setFontPairing, changeTemplate, etc.), choose values that match the brand from the file. Don't use generic defaults.
5. **For images in the file:** set as company logo using "__ATTACHED_IMAGE_0__" placeholder.
6. **Only ask clarifying questions for info that is genuinely NOT in the file.**
7. If no tool actions are available yet (e.g. on dashboard), navigate to the right tool first.`;
    }

    // ── Inject active workflow context when present ──
    const hasWorkflow = typeof workflowContext === "string" && workflowContext.trim() !== "";
    if (hasWorkflow) {
      systemPrompt += `\n\n## Active Workflow\n${workflowContext}\n\n### Workflow Behavioral Rules\n- You are executing a multi-step workflow. Focus ONLY on the current step.\n- After completing each step's actions, emit ALL required tool actions, then call advanceWorkflow to move to the next step.\n- IMPORTANT: Always call advanceWorkflow after you finish a step's work. Do not rely on the orchestrator to detect completion.\n- Do NOT ask the user for confirmation between workflow steps — keep moving.\n- If a step fails, report the error concisely and suggest skipping or retrying.\n- Keep responses SHORT during workflows — one or two sentences max per step.`;
    }

    // ── Add action system context when tools are registered ──
    const hasActions = actions && Array.isArray(actions) && actions.length > 0;
    if (hasActions) {
      systemPrompt += `\n## Tool Control
You can control the user's current design tool by calling the available functions.
When the user asks you to change something, use the appropriate function instead of just describing what they should do.
Always confirm what you changed after executing an action.
For destructive actions (reset, delete), ask for confirmation before proceeding — do NOT call the function without asking first.
Prefer calling actions over describing manual steps.
For ambiguous requests, ask one clarifying question (don't guess).
When changing multiple fields of the same type, combine them into a single action call when possible.
Never fabricate state — read it from the provided context below.

### Important: Current Tool State
The current tool state is provided in the "Current Tool State" section below. You already have this data — **you do NOT need to call readCurrentState** before making changes. Use readCurrentState ONLY if you suspect the state has changed since the conversation started (e.g. the user says they manually edited something). In most cases, just look at the state below and proceed directly with the changes.

### Design Rules
- **Brand-first design:** When file context provides document fonts and/or document colors, ALWAYS use them. These are the EXACT styling from the uploaded document — never override with guesses.
- **Font matching:** If document fonts are extracted (e.g. "Montserrat", "Roboto"), pick the font pairing that includes that font. Never invent a different font when the document's actual font is available.
- **Color matching:** If document colors are extracted (e.g. "#1a5276"), use the first/most prominent color as the accent color. Never substitute with a different color.
- Be opinionated: combine template + color + font in one cohesive call. Explain WHY you chose each element based on the brand.
- When a file is attached, call BOTH updateBranding (business fields) AND updateStyle (template, accentColor, fontPairing) in the SAME response. Don't just fill fields — design the entire document to match the brand.
- Match fonts to industry: serif=law/finance/luxury, sans-serif=tech/modern/agency, display=creative/fashion.
- Font pairings: inter-inter, poppins-inter, playfair-source, montserrat-opensans, raleway-lato, dmserif-dmsans, bitter-inter, ibmplex-ibmplex, jetbrains-inter, cormorant-proza, spacegrotesk-inter, crimsonpro-worksans.
- Accent colors: use brand colors from the document first. Otherwise: blue(#1e40af)=corporate, teal(#0f766e)=modern, purple(#7c3aed)=creative, emerald(#059669)=fresh, rose(#e11d48)=fashion/beauty, amber(#d97706)=food/hospitality, slate(#475569)=legal/finance.
- Brand consistency: ALL elements must use the same accent color family. Never mix unrelated colors. Match new additions to the existing template tone.
- Color persistence: user-chosen accent colors persist across template switches. Changing template changes layout/fonts but NOT the user's colors.
- **Logo color matching**: When the user asks to match their logo colors, the "Logo Colors" section (if present) contains the EXACT hex values extracted from the image. Use the most prominent brand color as the accent. You can also see the logo image directly attached to the last message for visual reference. NEVER guess colors — always use the provided hex values.

### Activity Log & Revert
You have access to an activity log that records every action. When the user asks to undo, revert, or go back:
1. Call getActivityLog to see recent actions with entry IDs
2. Identify the right entry (the state BEFORE the unwanted change)
3. Call revertToState with that entry ID to restore
Users may say "undo that", "go back", "revert the colors", etc. — use the log to find the right restore point.\n`;

      if (toolState && typeof toolState === "object") {
        // Only include a reasonable chunk of state to avoid token overflow
        const stateStr = JSON.stringify(toolState, null, 2);
        const truncated = stateStr.length > 8000 ? stateStr.slice(0, 8000) + "\n..." : stateStr;
        systemPrompt += `\n## Current Tool State\n\`\`\`json\n${truncated}\n\`\`\`\n`;
      }
    }

    // ── Inject extracted logo colors into tool state context ──
    if (logoColors && logoColors.length > 0) {
      systemPrompt += `\n\n## Logo Colors\nThe user's logo contains these dominant colors (extracted automatically): ${logoColors.map(c => c).join(", ")}\nWhen asked to match logo colors, use THESE exact hex values for the accent color. Pick the most prominent non-white, non-black brand color.\n`;
    }

    const provider = resolveProvider();

    // Validate logo image format for vision API (only jpeg/png/gif/webp)
    const SUPPORTED_VISION_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp"]);
    const validLogoImage = logoImage?.data && logoImage?.mediaType && SUPPORTED_VISION_TYPES.has(logoImage.mediaType)
      ? logoImage
      : undefined;

    if (provider === "openai") {
      return streamOpenAI(messages, systemPrompt, hasActions ? actions : undefined, hasWorkflow);
    }
    return streamClaude(messages, systemPrompt, hasActions ? actions : undefined, hasWorkflow, validLogoImage);
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
  hasWorkflow?: boolean,
  logoImage?: { data: string; mediaType: string },
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

  // Build messages — last user message may be multimodal if logo image is provided
  const apiMessages = messages.map((m: { role: string; content: string }, i: number) => {
    const role = m.role === "user" ? "user" as const : "assistant" as const;
    // For the LAST user message, attach the logo image as a vision block
    if (logoImage && role === "user" && i === messages.length - 1) {
      return {
        role,
        content: [
          {
            type: "image" as const,
            source: {
              type: "base64" as const,
              media_type: logoImage.mediaType,
              data: logoImage.data,
            },
          },
          { type: "text" as const, text: m.content },
        ],
      };
    }
    return { role, content: m.content };
  });

  const apiBody: Record<string, unknown> = {
    model: ANTHROPIC_MODEL,
    max_tokens: hasWorkflow ? 4096 : 2048,
    system: systemPrompt,
    messages: apiMessages,
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
    // Include status hint in dev mode for debugging
    const hint = process.env.NODE_ENV === "development" ? ` (API ${response.status})` : "";
    return new Response(
      JSON.stringify({
        fallback: true,
        content: `Hmm, I'm having a little trouble connecting right now.${hint} Try again in a sec! — Chiko ✨`,
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
      let currentToolUseId = "";
      let insideToolUse = false;
      let streamStopReason = "";
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
                  currentToolUseId = event.content_block.id || "";
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
                    toolUseId: currentToolUseId,
                  });
                  controller.enqueue(encoder.encode(`\n__CHIKO_ACTION__:${actionEvent}\n`));
                  currentToolName = "";
                  currentToolInput = "";
                  currentToolUseId = "";
                }

                // Capture stop_reason from message_delta
                if (event.type === "message_delta" && event.delta?.stop_reason) {
                  streamStopReason = event.delta.stop_reason;
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
        // Emit stop_reason so the client knows if Claude expects tool results
        if (streamStopReason) {
          try {
            const stopEvent = JSON.stringify({ stop_reason: streamStopReason });
            controller.enqueue(encoder.encode(`\n__CHIKO_STOP__:${stopEvent}\n`));
          } catch {
            // Controller may already be errored
          }
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

async function streamOpenAI(
  messages: { role: string; content: string }[],
  systemPrompt: string,
  tools?: { name: string; description: string; input_schema: Record<string, unknown> }[],
  hasWorkflow?: boolean,
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
    max_tokens: hasWorkflow ? 4096 : 2048,
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
                // Emit stop marker — if tool calls were emitted, stop_reason is "tool_use"
                const openaiStopReason = toolCalls.size > 0 ? "tool_use" : "end_turn";
                const openaiStopEvent = JSON.stringify({ stop_reason: openaiStopReason });
                controller.enqueue(encoder.encode(`\n__CHIKO_STOP__:${openaiStopEvent}\n`));
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
