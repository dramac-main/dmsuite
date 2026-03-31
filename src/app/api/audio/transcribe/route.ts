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
  "audio/mp3",
  "audio/mp4",
  "audio/ogg",
  "audio/x-m4a",
  "audio/m4a",
  "audio/aac",
  "audio/flac",
  "audio/x-flac",
  "audio/x-wav",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB (Groq limit)

// Size thresholds for credit tiers
const SHORT_THRESHOLD = 2 * 1024 * 1024; // 2 MB — roughly < 5 min compressed
const STANDARD_THRESHOLD = 10 * 1024 * 1024; // 10 MB — roughly < 30 min
// Above 10MB = long

// WAV thresholds (uncompressed — much larger per minute)
const WAV_SHORT_THRESHOLD = 5 * 1024 * 1024;
const WAV_STANDARD_THRESHOLD = 20 * 1024 * 1024;

// Valid ISO 639-1 codes (2 lowercase alpha chars)
const LANG_RE = /^[a-z]{2}$/;

/* ── In-memory rate limiter ─────────────────────────────────── */

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per minute (lower than VoiceFlow — larger files)
const RATE_WINDOW = 60_000;

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

/* ── Groq verbose_json response types ───────────────────────── */

interface GroqSegment {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
}

interface GroqVerboseResponse {
  task: string;
  language: string;
  duration: number;
  text: string;
  segments: GroqSegment[];
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
    const translateParam = formData.get("translate");

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { error: "No audio/video file provided" },
        { status: 400 }
      );
    }

    /* 3. Validate MIME type */
    const mimeType = file.type.split(";")[0].trim().toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        {
          error: `Unsupported format: ${mimeType}. Accepted: MP3, MP4, M4A, WAV, OGG, WebM, MOV, AAC, FLAC.`,
        },
        { status: 400 }
      );
    }

    /* 4. Check file size */
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File exceeds 25 MB limit. Please compress or split the file." },
        { status: 400 }
      );
    }

    /* 5. Sanitize language */
    let language = "en";
    if (languageParam && typeof languageParam === "string") {
      const cleaned = languageParam.trim().toLowerCase();
      if (cleaned === "auto") {
        language = ""; // empty = auto-detect in Groq
      } else if (LANG_RE.test(cleaned)) {
        language = cleaned;
      }
    }

    const translateToEnglish = translateParam === "true";

    /* 6. Determine credit operation based on file size */
    const isWav =
      mimeType === "audio/wav" || mimeType === "audio/x-wav";
    const shortThreshold = isWav ? WAV_SHORT_THRESHOLD : SHORT_THRESHOLD;
    const standardThreshold = isWav ? WAV_STANDARD_THRESHOLD : STANDARD_THRESHOLD;

    let operation: string;
    if (file.size <= shortThreshold) {
      operation = "audio-transcription-short";
    } else if (file.size <= standardThreshold) {
      operation = "audio-transcription-standard";
    } else {
      operation = "audio-transcription-long";
    }

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
      "Audio Transcription"
    );
    if (!deduction.success) {
      return NextResponse.json(
        { error: deduction.error || "Credit deduction failed" },
        { status: 402 }
      );
    }

    /* 9. Build Groq API request */
    if (!GROQ_API_KEY) {
      console.error("[audio-transcription] GROQ_API_KEY is not set");
      await refundCredits(
        user.id,
        cost,
        "Audio Transcription: GROQ_API_KEY not configured"
      );
      return NextResponse.json(
        {
          error: "The transcription service is temporarily unavailable. Please try again later or contact support if the issue persists.",
          errorCode: "SERVICE_NOT_CONFIGURED",
        },
        { status: 500 }
      );
    }

    const groqForm = new FormData();
    groqForm.append("file", file, file.name || "upload.mp3");
    groqForm.append("model", "whisper-large-v3");
    groqForm.append("response_format", "verbose_json");

    if (translateToEnglish) {
      groqForm.append("task", "translate");
    }

    if (language && !translateToEnglish) {
      groqForm.append("language", language);
    }

    /* 10. Send to Groq with 60s timeout (larger files need more time) */
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

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
      await refundCredits(
        user.id,
        cost,
        "Audio Transcription failed (network)"
      );
      const isTimeout = err instanceof Error && err.name === "AbortError";
      return NextResponse.json(
        {
          error: isTimeout
            ? "Transcription timed out after 60 seconds. Try a shorter or smaller file."
            : "Could not reach the transcription service. Please check your internet connection and try again.",
          errorCode: isTimeout ? "TIMEOUT" : "NETWORK_ERROR",
        },
        { status: 502 }
      );
    } finally {
      clearTimeout(timeout);
    }

    /* 11. Handle Groq errors */
    if (!groqRes.ok) {
      await refundCredits(user.id, cost, "Audio Transcription failed");
      const errBody = await groqRes.text().catch(() => "");
      console.error(`[audio-transcription] Groq ${groqRes.status}:`, errBody);
      let detail = "Transcription failed. Please try again.";
      if (groqRes.status === 413) {
        detail = "File is too large for the transcription service. Please use a file under 25 MB.";
      } else if (groqRes.status === 429) {
        detail = "Transcription service is temporarily overloaded. Please wait a moment and try again.";
      } else if (groqRes.status >= 500) {
        detail = "Transcription service is temporarily unavailable. Please try again in a few minutes.";
      }
      return NextResponse.json(
        { error: detail, errorCode: "PROVIDER_ERROR" },
        { status: 502 }
      );
    }

    /* 12. Parse verbose_json response */
    const groqData = (await groqRes.json()) as GroqVerboseResponse;
    const transcript = groqData.text?.trim() ?? "";

    /* 13. Handle empty transcript */
    if (!transcript) {
      await refundCredits(
        user.id,
        cost,
        "Audio Transcription: no speech detected"
      );
      return NextResponse.json({
        transcript: "",
        segments: [],
        duration: groqData.duration ?? 0,
        language: groqData.language ?? language,
        creditsUsed: 0,
        message: "No speech detected in the file.",
      });
    }

    /* 14. Map segments */
    const segments = (groqData.segments ?? []).map((seg) => ({
      id: seg.id,
      start: seg.start,
      end: seg.end,
      text: seg.text.trim(),
    }));

    /* 15. Log token usage (non-critical) */
    const durationSec = groqData.duration ?? 0;
    await logTokenUsage(user.id, operation, {
      inputTokens: 0,
      outputTokens: 0,
      model: "whisper-large-v3",
    }).catch(() => {});

    /* 16. Return result */
    return NextResponse.json({
      transcript,
      segments,
      duration: durationSec,
      language: groqData.language ?? language,
      creditsUsed: cost,
    });
  } catch {
    return NextResponse.json(
      {
        error: "An unexpected error occurred while processing your transcription. Please try again.",
        errorCode: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
