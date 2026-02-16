import { NextRequest, NextResponse } from "next/server";

/* ── Environment ──────────────────────────────────────────── */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-20250514";

/* ── Types ────────────────────────────────────────────────── */

export interface ImageRegion {
  x: number;      // 0-1 normalized
  y: number;      // 0-1 normalized
  width: number;  // 0-1 normalized
  height: number; // 0-1 normalized
  label: string;
}

export interface ImageAnalysis {
  /** What the image is about */
  subject: string;
  /** Detected faces with bounding regions */
  faces: ImageRegion[];
  /** Detected products / key objects */
  products: ImageRegion[];
  /** Areas where text can safely be placed without covering important content */
  safeZones: Array<{
    position: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right";
    confidence: number; // 0-1
    /** Recommended text alignment for this zone */
    textAlign: "left" | "center" | "right";
  }>;
  /** Overall brightness: helps decide light vs dark text */
  brightness: "light" | "dark" | "mixed";
  /** Dominant colors extracted from the image */
  dominantColors: string[];
  /** Mood/aesthetic of the image */
  mood: string;
  /** Best overlay style for text readability */
  recommendedOverlay: "gradient-bottom" | "gradient-top" | "gradient-left" | "gradient-right" | "dark-vignette" | "light-frosted" | "color-wash";
  /** Where the visual weight / focus of the image is */
  focalPoint: { x: number; y: number };
  /** Suggested text color that would contrast well */
  suggestedTextColor: string;
  /** Suggested accent color extracted from image */
  suggestedAccentColor: string;
}

/* ── POST handler ─────────────────────────────────────────── */

export async function POST(request: NextRequest) {
  if (!ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 500 }
    );
  }

  try {
    const { imageUrl } = await request.json();

    if (!imageUrl || typeof imageUrl !== "string") {
      return NextResponse.json(
        { error: "imageUrl is required" },
        { status: 400 }
      );
    }

    // Fetch the image and convert to base64 for Claude Vision
    const imageResponse = await fetch(imageUrl, {
      headers: { "User-Agent": "DMSuite/1.0" },
    });

    if (!imageResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: 400 }
      );
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg";
    const mediaType = contentType.startsWith("image/")
      ? contentType.split(";")[0] as "image/jpeg" | "image/png" | "image/gif" | "image/webp"
      : "image/jpeg";

    // Call Claude Vision API
    const analysisResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: ANTHROPIC_MODEL,
          max_tokens: 2048,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Image,
                  },
                },
                {
                  type: "text",
                  text: `You are an expert image composition analyst for a professional social media design tool. Analyze this image and return a JSON object with the following structure. Be precise with spatial coordinates.

All coordinates are normalized 0-1 where (0,0) is top-left and (1,1) is bottom-right.

Return ONLY valid JSON, no markdown, no explanation:

{
  "subject": "Brief description of what the image shows",
  "faces": [
    { "x": 0.3, "y": 0.1, "width": 0.2, "height": 0.3, "label": "person" }
  ],
  "products": [
    { "x": 0.4, "y": 0.2, "width": 0.3, "height": 0.4, "label": "sunglasses" }
  ],
  "safeZones": [
    { "position": "bottom-left", "confidence": 0.9, "textAlign": "left" },
    { "position": "top-right", "confidence": 0.8, "textAlign": "right" }
  ],
  "brightness": "dark",
  "dominantColors": ["#2a3b4c", "#e8d5b0", "#8b6914"],
  "mood": "professional and sophisticated",
  "recommendedOverlay": "gradient-bottom",
  "focalPoint": { "x": 0.5, "y": 0.4 },
  "suggestedTextColor": "#ffffff",
  "suggestedAccentColor": "#e8d5b0"
}

RULES:
- faces: List ALL visible faces/heads with approximate bounding boxes
- products: List any commercial products, branded items, or key objects that should NOT have text overlaid
- safeZones: Areas with simple backgrounds (sky, solid colors, blurred areas) where text would be readable. Include at least 2-3 zones. Rate confidence 0-1
- brightness: Overall image brightness for choosing text color
- dominantColors: 3-5 hex colors from the image
- mood: 2-4 word mood description
- recommendedOverlay: Best overlay approach to make text readable without hiding the subject
- focalPoint: Where the viewer's eye naturally goes (the main subject center)
- suggestedTextColor: Hex color that contrasts well with the image
- suggestedAccentColor: A color from the image that could work as an accent/highlight color for buttons or underlines`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!analysisResponse.ok) {
      const errorText = await analysisResponse.text();
      console.error("Claude Vision API error:", analysisResponse.status, errorText);
      return NextResponse.json(
        { error: "Image analysis failed" },
        { status: 500 }
      );
    }

    const result = await analysisResponse.json();
    const textContent = result.content?.[0]?.text || "";

    // Extract JSON from the response
    let analysis: ImageAnalysis;
    try {
      // Try direct parse first
      analysis = JSON.parse(textContent);
    } catch {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = textContent.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                        textContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        console.error("Failed to parse analysis:", textContent);
        return NextResponse.json(
          { error: "Failed to parse image analysis" },
          { status: 500 }
        );
      }
    }

    // Validate and sanitize
    analysis = {
      subject: analysis.subject || "Image",
      faces: Array.isArray(analysis.faces) ? analysis.faces : [],
      products: Array.isArray(analysis.products) ? analysis.products : [],
      safeZones: Array.isArray(analysis.safeZones) ? analysis.safeZones : [
        { position: "bottom-left", confidence: 0.5, textAlign: "left" },
        { position: "top-right", confidence: 0.5, textAlign: "right" },
      ],
      brightness: analysis.brightness || "mixed",
      dominantColors: Array.isArray(analysis.dominantColors) ? analysis.dominantColors : ["#000000"],
      mood: analysis.mood || "neutral",
      recommendedOverlay: analysis.recommendedOverlay || "gradient-bottom",
      focalPoint: analysis.focalPoint || { x: 0.5, y: 0.5 },
      suggestedTextColor: analysis.suggestedTextColor || "#ffffff",
      suggestedAccentColor: analysis.suggestedAccentColor || "#8ae600",
    };

    return NextResponse.json(analysis, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200",
      },
    });
  } catch (error) {
    console.error("Image analysis error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
