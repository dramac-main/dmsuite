import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";

/* ── Grammar Polish Endpoint for Voice Transcription ─────────
   Takes raw speech-to-text output and returns a grammar-corrected,
   punctuated version. Uses a tiny Claude prompt — FREE (no credits
   charged) since it enhances the input experience, not the output.
   ──────────────────────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

const POLISH_SYSTEM = `You are a grammar and punctuation corrector for voice-to-text input. Your ONLY job is to clean up raw speech transcription output.

Rules:
- Fix grammar, spelling, and punctuation errors
- Add proper capitalization and sentence structure
- Preserve the user's original meaning and intent EXACTLY
- Do NOT add, remove, or rephrase content
- Do NOT add pleasantries, explanations, or commentary
- Do NOT wrap in quotes or add any markup
- If the input is already correct, return it unchanged
- Keep the same language and tone
- Handle common speech-to-text errors (homophones, missing words, run-on sentences)
- Output ONLY the corrected text, nothing else`;

export async function POST(request: NextRequest) {
  try {
    // Auth check (no credits charged)
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { text?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { text } = body;
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text field" }, { status: 400 });
    }

    // Cap input length to prevent abuse
    if (text.length > 2000) {
      return NextResponse.json({ error: "Text too long (max 2000 chars)" }, { status: 400 });
    }

    // If input is very short (1-2 words), skip polishing
    if (text.trim().split(/\s+/).length <= 2) {
      return NextResponse.json({ polished: text.trim() });
    }

    if (!ANTHROPIC_API_KEY) {
      // No API key — return raw text (graceful degradation)
      return NextResponse.json({ polished: text });
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        system: POLISH_SYSTEM,
        messages: [{ role: "user", content: text }],
      }),
    });

    if (!response.ok) {
      // API error — return raw text
      return NextResponse.json({ polished: text });
    }

    const data = await response.json();
    const polished = data?.content?.[0]?.text?.trim() || text;

    return NextResponse.json({ polished });
  } catch {
    // Any error — gracefully return raw text
    return NextResponse.json({ polished: (await request.clone().json().catch(() => ({ text: "" }))).text || "" });
  }
}
