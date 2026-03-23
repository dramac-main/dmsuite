// =============================================================================
// DMSuite — Chiko Website Scan API Route
// Server-side endpoint that accepts a URL, fetches and parses the website,
// and returns structured business data. Never stores page content on disk.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/supabase/auth";
import { checkCredits, deductCredits, refundCredits } from "@/lib/supabase/credits";
import { extractWebsite, validateUrl } from "@/lib/chiko/extractors/website-extractor";
import type { ExtractedWebsiteData } from "@/lib/chiko/extractors/website-extractor";

export interface WebsiteScanResponse {
  success: boolean;
  data?: ExtractedWebsiteData;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<WebsiteScanResponse>> {
  // ── Auth check ──────────────────────────────────────────
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // ── Credit check ────────────────────────────────────────
  const creditCheck = await checkCredits(user.id, "website-scan");
  if (!creditCheck.allowed) {
    return NextResponse.json(
      { success: false, error: "Insufficient credits" },
      { status: 402 }
    );
  }

  try {
    let body: { url?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { url } = body;

    // ── Validate URL ──────────────────────────────────────
    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Missing 'url' field in request body" },
        { status: 400 }
      );
    }

    if (url.length > 2048) {
      return NextResponse.json(
        { success: false, error: "URL is too long (max 2048 characters)" },
        { status: 400 }
      );
    }

    // Server-side URL validation (SSRF protection)
    const validation = validateUrl(url);
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid URL" },
        { status: 400 }
      );
    }

    // ── Deduct credits ────────────────────────────────────
    const deduction = await deductCredits(user.id, "website-scan", `Website scan: ${url}`);
    if (!deduction.success) {
      return NextResponse.json(
        { success: false, error: "Failed to deduct credits" },
        { status: 402 }
      );
    }

    // ── Extract website data ──────────────────────────────
    const data = await extractWebsite(url);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[Chiko Scan] Website extraction error:", error);
    // Refund credits on failure
    await refundCredits(user.id, creditCheck.cost, "Refund: website scan failed");
    const message =
      error instanceof Error
        ? error.message.replace(/[A-Z]:\\[^\s]*/gi, "[path]") // Strip Windows paths
        : "Website scanning failed";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
