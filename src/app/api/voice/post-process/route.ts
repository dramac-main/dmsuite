import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { logTokenUsage } from "@/lib/supabase/credits";

/* ── Constants ──────────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5-20241022";

const ALLOWED_TONES = new Set([
  "natural",
  "professional",
  "casual",
  "technical",
  "academic",
  "creative",
]);

const MAX_TRANSCRIPT_LENGTH = 10_000;
const MAX_VOCABULARY_LENGTH = 2_000;
const MAX_CONTEXT_LENGTH = 2_000;

/* ── System prompt ──────────────────────────────────────────── */

const SYSTEM_PROMPT = `You are a dictation post-processor for DMSuite VoiceFlow. You receive raw speech-to-text output and return clean text ready to be used.

Your job:
- Remove filler words (um, uh, you know, like, so, basically) unless they carry genuine meaning.
- Fix spelling, grammar, and punctuation errors introduced by the speech-to-text model.
- When the transcript contains a word that is a close misspelling of a name or term from the custom vocabulary, correct the spelling. Never insert names or terms that the speaker did not say.
- Adjust the tone to match the requested style while preserving the speaker's intent and meaning exactly.
- Format appropriately: add paragraph breaks for long passages, use proper capitalization, add punctuation.

Tone guidelines:
- natural: Keep close to how the person spoke, just clean up errors and filler.
- professional: Formal business language, complete sentences, no contractions.
- casual: Friendly and conversational, contractions OK, relaxed punctuation.
- technical: Precise terminology, structured sentences, no ambiguity.
- academic: Formal, citation-ready language, complex sentence structures.
- creative: Expressive, varied sentence lengths, literary flair.

Output rules:
- Return ONLY the cleaned text. No labels, no markdown, no quotes around the output, no explanations.
- If the transcript is empty or nonsensical, return exactly: EMPTY
- Do not add content the speaker did not say. Context and vocabulary are only for correcting existing words.
- Preserve the speaker's meaning. Do not rephrase ideas.`;

/* ── POST handler ──────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  /* 1. Auth */
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    /* 2. Parse & validate body */
    const body = await request.json();
    const transcript =
      typeof body.transcript === "string" ? body.transcript.trim() : "";

    if (!transcript || transcript.length > MAX_TRANSCRIPT_LENGTH) {
      return NextResponse.json(
        {
          error: transcript
            ? `Transcript exceeds ${MAX_TRANSCRIPT_LENGTH} character limit`
            : "Transcript is required",
        },
        { status: 400 }
      );
    }

    const tone =
      typeof body.tone === "string" && ALLOWED_TONES.has(body.tone)
        ? body.tone
        : "natural";

    const context =
      typeof body.context === "string"
        ? body.context.slice(0, MAX_CONTEXT_LENGTH).trim()
        : "";

    const vocabulary =
      typeof body.vocabulary === "string"
        ? body.vocabulary.slice(0, MAX_VOCABULARY_LENGTH).trim()
        : "";

    const language =
      typeof body.language === "string" ? body.language.trim() : "English";

    /* 3. No additional credits — bundled in transcription cost */

    /* 4. Check API key */
    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: "Post-processing service not configured" },
        { status: 500 }
      );
    }

    /* 5. Build user prompt */
    const userPrompt = `CONTEXT: "${context || "General dictation"}"
TONE: "${tone}"
CUSTOM VOCABULARY: "${vocabulary || "None"}"
LANGUAGE: "${language}"

RAW TRANSCRIPT:
"${transcript}"`;

    /* 6. Call Anthropic API */
    const anthropicRes = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 4096,
        temperature: 0.1,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!anthropicRes.ok) {
      return NextResponse.json(
        { error: "Post-processing failed" },
        { status: 502 }
      );
    }

    /* 7. Parse response */
    const data = (await anthropicRes.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };

    let cleaned =
      data.content?.find((b) => b.type === "text")?.text?.trim() ?? "";

    // Strip outer quotes if the model wrapped them
    if (
      cleaned.length >= 2 &&
      ((cleaned.startsWith('"') && cleaned.endsWith('"')) ||
        (cleaned.startsWith("'") && cleaned.endsWith("'")))
    ) {
      cleaned = cleaned.slice(1, -1).trim();
    }

    // Handle EMPTY sentinel
    if (cleaned === "EMPTY") {
      cleaned = "";
    }

    /* 8. Log token usage for analytics (non-critical) */
    const inputTokens = data.usage?.input_tokens ?? 0;
    const outputTokens = data.usage?.output_tokens ?? 0;

    await logTokenUsage(user.id, "voice-transcription", {
      inputTokens,
      outputTokens,
      model: MODEL,
    }).catch(() => {
      /* non-critical */
    });

    /* 9. Return cleaned text */
    return NextResponse.json({
      cleaned,
      model: MODEL,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
