// =============================================================================
// DMSuite — Resume AI Generate API Route
// POST /api/chat/resume/generate
// Generates a full resume from a target role + optional context.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";
import {
  RESUME_GENERATE_SYSTEM_PROMPT,
  buildGenerateMessages,
  type ResumeGenerateRequest,
} from "@/lib/resume/ai-engine";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creditCheck = await checkCredits(user.id, "resume-generate");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost },
      { status: 402 },
    );
  }

  const deduction = await deductCredits(user.id, "resume-generate", "Resume AI Generation");
  if (!deduction.success) {
    return NextResponse.json({ error: deduction.error || "Credit deduction failed" }, { status: 402 });
  }

  try {
    const body = (await request.json()) as ResumeGenerateRequest;
    if (!body.targetRole?.trim()) {
      await refundCredits(user.id, creditCheck.cost, "Refund: missing targetRole");
      return NextResponse.json({ error: "targetRole is required" }, { status: 400 });
    }

    const messages = buildGenerateMessages(body);

    if (!ANTHROPIC_API_KEY) {
      await refundCredits(user.id, creditCheck.cost, "Refund: no API key configured");
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
        max_tokens: 8192,
        system: RESUME_GENERATE_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      await refundCredits(user.id, creditCheck.cost, "Refund: AI API error");
      return NextResponse.json({ error: "AI generation failed" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text ?? "";

    // Extract JSON from response (handles markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await refundCredits(user.id, creditCheck.cost, "Refund: no valid JSON");
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 502 });
    }

    const resumeData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ resume: resumeData });
  } catch (err) {
    await refundCredits(user.id, creditCheck.cost, "Refund: resume generate error");
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
