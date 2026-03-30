import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import {
  checkCredits,
  deductCredits,
  refundCredits,
  logTokenUsage,
  getCreditCost,
} from "@/lib/supabase/credits";

/* ── Constants ──────────────────────────────────────────────── */

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_TRANSCRIPTION_URL =
  "https://api.groq.com/openai/v1/audio/transcriptions";

const ALLOWED_MIME_TYPES = new Set([
  "audio/webm",
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (Groq limit)

// Size thresholds for "long" recording heuristic
const COMPRESSED_LONG_THRESHOLD = 2 * 1024 * 1024; // 2 MB
const WAV_LONG_THRESHOLD = 5 * 1024 * 1024; // 5 MB

// Valid ISO 639-1 codes (2 lowercase alpha chars)
const LANG_RE = /^[a-z]{2}$/;

/* ── Simple in-memory rate limiter ──────────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30; // requests per minute
const RATE_WINDOW = 60_000; // 1 minute

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now >= entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

/* ── POST handler ──────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  /* 1. Auth */
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  /* Rate limit */
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment." },
      { status: 429 }
    );
  }

  try {
    /* 2. Parse multipart form */
    const formData = await request.formData();
    const file = formData.get("file");
    const languageParam = formData.get("language");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    /* 3. Validate MIME type */
    const mimeType = file.type.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${mimeType}. Accepted: webm, wav, mp3, mp4, ogg, m4a.`,
        },
        { status: 400 }
      );
    }

    /* 4. Check file size */
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 25 MB limit" },
        { status: 400 }
      );
    }

    /* 5. Sanitize language */
    let language = "en";
    if (languageParam && typeof languageParam === "string") {
      const cleaned = languageParam.trim().toLowerCase();
      if (LANG_RE.test(cleaned)) {
        language = cleaned;
      }
    }

    /* 6. Determine credit operation */
    const isWav = mimeType === "audio/wav";
    const longThreshold = isWav ? WAV_LONG_THRESHOLD : COMPRESSED_LONG_THRESHOLD;
    const operation =
      file.size > longThreshold
        ? "voice-transcription-long"
        : "voice-transcription";
    const cost = getCreditCost(operation);

    /* 7. Check credits */
    const creditCheck = await checkCredits(user.id, operation);
    if (!creditCheck.allowed) {
      return NextResponse.json(
        {
          error: "Insufficient credits",
          balance: creditCheck.balance,
          cost: creditCheck.cost,
        },
        { status: 402 }
      );
    }

    /* 8. Deduct credits upfront */
    const deduction = await deductCredits(
      user.id,
      operation,
      "VoiceFlow transcription"
    );
    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || "Credit deduction failed" },
        { status: 402 }
      );
    }

    /* 9. Build Groq API request */
    if (!GROQ_API_KEY) {
      await refundCredits(user.id, cost, "VoiceFlow: GROQ_API_KEY not configured");
      return NextResponse.json(
        {
          error: "Transcription service is not configured. The GROQ_API_KEY environment variable is missing — please contact the administrator.",
          errorCode: "SERVICE_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", file, file.name || "recording.webm");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("response_format", "json");
    if (language !== "en") {
      groqForm.append("language", language);
    }

    /* 10. Send to Groq */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    let groqRes: Response;
    try {
      groqRes = await fetch(GROQ_TRANSCRIPTION_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: groqForm,
        signal: controller.signal,
      });
    } catch (err) {
      clearTimeout(timeout);
      await refundCredits(user.id, cost, "VoiceFlow transcription failed (network)");
      const message =
        err instanceof Error && err.name === "AbortError"
          ? "Transcription timed out (30s)"
          : "Failed to reach transcription service";
      return NextResponse.json({ error: message }, { status: 502 });
    } finally {
      clearTimeout(timeout);
    }

    /* 11. Handle Groq errors */
    if (!groqRes.ok) {
      await refundCredits(user.id, cost, "VoiceFlow transcription failed");
      await groqRes.text().catch(() => {});
      return NextResponse.json(
        { error: `Transcription failed: ${groqRes.status}` },
        { status: 502 }
      );
    }

    /* 12. Parse response */
    const groqData = (await groqRes.json()) as { text?: string };
    const transcript = groqData.text?.trim() ?? "";

    /* 13. Handle empty transcript */
    if (!transcript) {
      await refundCredits(user.id, cost, "VoiceFlow: no speech detected");
      return NextResponse.json({
        transcript: "",
        language,
        creditsUsed: 0,
        message: "No speech detected in the recording",
      });
    }

    /* 14. Log token usage (Whisper has no tokens — use 0) */
    await logTokenUsage(user.id, operation, {
      inputTokens: 0,
      outputTokens: 0,
      model: "whisper-large-v3",
    }).catch(() => {
      /* non-critical */
    });

    /* 15. Return success */
    return NextResponse.json({
      transcript,
      language,
      creditsUsed: cost,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
