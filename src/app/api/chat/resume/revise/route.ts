// =============================================================================
// DMSuite — Resume AI Revise API Route
// POST /api/chat/resume/revise
// Revises existing resume based on natural language instruction.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";
import {
  RESUME_REVISE_SYSTEM_PROMPT,
  buildReviseMessages,
  type ResumeRevisionRequest,
} from "@/lib/resume/ai-engine";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";

export async function POST(request: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const creditCheck = await checkCredits(user.id, "resume-revise");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { error: "Insufficient credits", balance: creditCheck.balance, cost: creditCheck.cost },
      { status: 402 },
    );
  }

  const deduction = await deductCredits(user.id, "resume-revise", "Resume AI Revision");
  if (!deduction.success) {
    return NextResponse.json({ error: deduction.error || "Credit deduction failed" }, { status: 402 });
  }

  try {
    const body = (await request.json()) as ResumeRevisionRequest;
    if (!body.resume || !body.instruction?.trim()) {
      await refundCredits(user.id, creditCheck.cost, "Refund: missing params");
      return NextResponse.json({ error: "resume and instruction are required" }, { status: 400 });
    }

    const messages = buildReviseMessages(body);

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
        max_tokens: 8192,
        system: RESUME_REVISE_SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!response.ok) {
      await refundCredits(user.id, creditCheck.cost, "Refund: AI API error");
      return NextResponse.json({ error: "AI revision failed" }, { status: 502 });
    }

    const result = await response.json();
    const text = result.content?.[0]?.text ?? "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await refundCredits(user.id, creditCheck.cost, "Refund: no valid JSON");
      return NextResponse.json({ error: "AI returned invalid format" }, { status: 502 });
    }

    const resumeData = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ resume: resumeData });
  } catch (err) {
    await refundCredits(user.id, creditCheck.cost, "Refund: resume revise error");
    return NextResponse.json({ error: "Revision failed" }, { status: 500 });
  }
}
