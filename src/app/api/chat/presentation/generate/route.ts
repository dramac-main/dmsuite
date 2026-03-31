// =============================================================================
// DMSuite — AI Presentation Generation API
// Non-streaming JSON endpoint — returns structured slide data.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits } from "@/lib/supabase/credits";
import type { TokenUsage } from "@/lib/supabase/credits";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
const FALLBACK_MODEL = "claude-haiku-4-5";
const RETRYABLE_STATUS = new Set([429, 529, 502, 503]);
const MAX_RETRIES = 2;

// ── AI prompt ───────────────────────────────────────────────────────────────

const VALID_LAYOUTS = [
  "title", "section", "content", "bullets", "two-column",
  "quote", "image-text", "big-number", "blank",
] as const;

function buildSystemPrompt(): string {
  return `You are a world-class presentation designer AI. You create professional, compelling slide decks.

RULES:
- Return ONLY a valid JSON array of slide objects. No markdown, no explanation, no code fences.
- Each slide must have: "layout" (one of: ${VALID_LAYOUTS.join(", ")}), and content fields relevant to that layout.
- Generate 8-12 slides that tell a coherent story.
- Use varied layouts — don't repeat the same layout more than 2-3 times.
- Always start with a "title" layout and end with a "title" layout (closing/thank-you slide).
- Include at least one "section" divider, one "big-number" or "quote", and one "two-column" or "bullets" slide.
- Write concise, impactful text. Bullet points should be 5-12 words each. Body text should be 1-3 sentences.
- For "big-number" slides, use realistic but impressive statistics (e.g., "87%", "$2.4M", "3x").
- For "quote" slides, use relevant quotes from notable figures.

SLIDE FIELD REFERENCE (include only fields relevant to the layout):
- title layout: title, subtitle
- section layout: title, sectionNumber (e.g., "01", "02")
- content layout: title, body
- bullets layout: title, bullets (array of 3-6 strings)
- two-column layout: title, leftHeading, leftBody, rightHeading, rightBody
- quote layout: quoteText, quoteAuthor
- big-number layout: title, bigNumber, bigNumberLabel
- image-text layout: title, body (imageUrl will be set by user)
- blank layout: (empty — user will fill in)

OPTIONAL for any slide: "notes" (speaker notes, 1-2 sentences)`;
}

function buildUserMessage(topic: string, author?: string, company?: string): string {
  let msg = `Create a professional presentation about: "${topic}"`;
  if (author) msg += `\nPresenter: ${author}`;
  if (company) msg += `\nCompany/Organization: ${company}`;
  msg += "\n\nReturn ONLY the JSON array of slides.";
  return msg;
}

// ── Retry helper ────────────────────────────────────────────────────────────

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
    console.warn(`[presentation-generate] ${response.status}, retrying in ${delay}ms (${attempt + 1}/${retries})`);
    await new Promise((r) => setTimeout(r, delay));
  }
  return lastResponse!;
}

// ── Parse AI response ───────────────────────────────────────────────────────

interface RawSlide {
  layout?: string;
  title?: string;
  subtitle?: string;
  body?: string;
  bullets?: string[];
  leftHeading?: string;
  leftBody?: string;
  rightHeading?: string;
  rightBody?: string;
  quoteText?: string;
  quoteAuthor?: string;
  bigNumber?: string;
  bigNumberLabel?: string;
  sectionNumber?: string;
  imageUrl?: string;
  notes?: string;
}

function parseSlides(text: string): RawSlide[] {
  // Strip markdown code fences if the model wraps them
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error("Response is not a non-empty array");
  }

  // Validate and sanitise each slide
  return parsed.map((s: RawSlide) => {
    const layout = VALID_LAYOUTS.includes(s.layout as typeof VALID_LAYOUTS[number])
      ? s.layout
      : "content";
    return {
      layout,
      title: typeof s.title === "string" ? s.title : "",
      subtitle: typeof s.subtitle === "string" ? s.subtitle : "",
      body: typeof s.body === "string" ? s.body : "",
      bullets: Array.isArray(s.bullets) ? s.bullets.filter((b): b is string => typeof b === "string") : [],
      leftHeading: typeof s.leftHeading === "string" ? s.leftHeading : "",
      leftBody: typeof s.leftBody === "string" ? s.leftBody : "",
      rightHeading: typeof s.rightHeading === "string" ? s.rightHeading : "",
      rightBody: typeof s.rightBody === "string" ? s.rightBody : "",
      quoteText: typeof s.quoteText === "string" ? s.quoteText : "",
      quoteAuthor: typeof s.quoteAuthor === "string" ? s.quoteAuthor : "",
      bigNumber: typeof s.bigNumber === "string" ? s.bigNumber : "",
      bigNumberLabel: typeof s.bigNumberLabel === "string" ? s.bigNumberLabel : "",
      sectionNumber: typeof s.sectionNumber === "string" ? s.sectionNumber : "",
      imageUrl: typeof s.imageUrl === "string" ? s.imageUrl : "",
      notes: typeof s.notes === "string" ? s.notes : "",
    };
  });
}

// ── POST handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Credit pre-flight
  const creditCheck = await checkCredits(user.id, "presentation-design");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost },
      { status: 402 },
    );
  }

  try {
    const body = await request.json();
    const topic = typeof body.topic === "string" ? body.topic.trim() : "";
    const author = typeof body.author === "string" ? body.author.trim() : "";
    const company = typeof body.company === "string" ? body.company.trim() : "";

    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // No API key → signal unavailable (don't silently fall back)
    if (!ANTHROPIC_API_KEY) {
      console.warn("[presentation-generate] ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "AI service is not configured. Please contact support.", aiUnavailable: true },
        { status: 503 },
      );
    }

    const systemPrompt = buildSystemPrompt();
    const userMessage = buildUserMessage(topic, author, company);

    // Try primary model, then fallback
    const modelsToTry = ANTHROPIC_MODEL !== FALLBACK_MODEL
      ? [ANTHROPIC_MODEL, FALLBACK_MODEL]
      : [ANTHROPIC_MODEL];

    let aiResponse: Response | null = null;
    let usedModel = ANTHROPIC_MODEL;

    for (const model of modelsToTry) {
      console.log(`[presentation-generate] Trying model: ${model}`);
      aiResponse = await fetchWithRetry(
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
            max_tokens: 4096,
            system: systemPrompt,
            messages: [{ role: "user", content: userMessage }],
            stream: false,
          }),
        },
      );
      if (aiResponse.ok) {
        usedModel = model;
        break;
      }
      console.warn(`[presentation-generate] Model ${model} failed: ${aiResponse.status}`);
    }

    // AI is unreachable — return 503 so the client can warn the user
    if (!aiResponse || !aiResponse.ok) {
      const errorText = aiResponse ? await aiResponse.text() : "no response";
      console.error("[presentation-generate] AI API error:", aiResponse?.status, errorText);
      return NextResponse.json(
        { error: "AI service is temporarily unavailable. Please try again later.", aiUnavailable: true },
        { status: 503 },
      );
    }

    const result = await aiResponse.json();

    // Extract text from Anthropic response
    const textBlocks = result.content?.filter(
      (block: { type: string }) => block.type === "text",
    );
    const text = textBlocks?.map((b: { text: string }) => b.text).join("") || "";

    if (!text) {
      console.warn("[presentation-generate] Empty AI response");
      return NextResponse.json(
        { error: "AI returned an empty response. Please try again.", aiUnavailable: true },
        { status: 503 },
      );
    }

    // Parse slides from AI response
    let slides: RawSlide[];
    try {
      slides = parseSlides(text);
    } catch (parseError) {
      console.error("[presentation-generate] Failed to parse AI response:", parseError);
      return NextResponse.json(
        { error: "AI response could not be parsed. Please try again.", aiUnavailable: true },
        { status: 503 },
      );
    }

    // Deduct credits AFTER successful generation (with token tracking)
    const tokenUsage: TokenUsage | undefined = result.usage
      ? {
          inputTokens: result.usage.input_tokens ?? 0,
          outputTokens: result.usage.output_tokens ?? 0,
          model: usedModel,
        }
      : undefined;

    const deduction = await deductCredits(
      user.id,
      "presentation-design",
      "AI Presentation generation",
      "presentation",
      tokenUsage,
    );

    if (!deduction.success) {
      return NextResponse.json({ error: "Failed to deduct credits" }, { status: 402 });
    }

    return NextResponse.json({ slides });
  } catch (error) {
    console.error("[presentation-generate] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
