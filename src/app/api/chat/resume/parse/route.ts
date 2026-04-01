// =============================================================================
// DMSuite — Resume ATS Parse/Score API Route
// POST /api/chat/resume/parse
// Scores a resume against ATS criteria, optionally against a job description.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";
import {
  RESUME_ATS_SYSTEM_PROMPT,
  buildATSMessages,
} from "@/lib/resume/ai-engine";
import type { ResumeData } from "@/lib/resume/schema";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creditCheck = await checkCredits(user.id, "resume-ats");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost },
      { status: 402 },
    );
  }

  const deduction = await deductCredits(user.id, "resume-ats", "Resume ATS Score");
  if (!deduction.success) {
    return NextResponse.json({ error: deduction.error || "Credit deduction failed" }, { status: 402 });
  }

  try {
    const body = (await request.json()) as { resume: ResumeData; jobDescription?: string };
    if (!body.resume) {
      await refundCredits(user.id, creditCheck.cost, "Refund: missing resume");
      return NextResponse.json({ error: "resume data is required" }, { status: 400 });
    }

    const messages = buildATSMessages(body.resume, body.jobDescription);

    if (!ANTHROPIC_API_KEY) {
      await refundCredits(user.id, creditCheck.cost, "Refund: no API key");
      return NextResponse.json({ error: "AI provider not configured" }, { status: 503 });
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
        max_tokens: 4096,
        system: RESUME_ATS_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      await refundCredits(user.id, creditCheck.cost, "Refund: AI API error");
      return NextResponse.json({ error: "ATS scoring failed" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await refundCredits(user.id, creditCheck.cost, "Refund: no JSON");
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 502 });
    }

    const atsResult = JSON.parse(jsonMatch[0]);
    return NextResponse.json(atsResult);
  } catch (err) {
    await refundCredits(user.id, creditCheck.cost, "Refund: ATS error");
    return NextResponse.json({ error: "ATS scoring failed" }, { status: 500 });
  }
}
