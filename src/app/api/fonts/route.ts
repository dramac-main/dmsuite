// =============================================================================
// DMSuite — Server-Side Google Font TTF Fetcher
// Fetches TTF/OTF font binaries from Google Fonts API for PDF embedding.
// Avoids CORS issues by running server-side (User-Agent header allowed).
// =============================================================================

import { NextRequest, NextResponse } from "next/server";

// Module-level cache: family+weight+style → TTF bytes
const fontCache = new Map<string, ArrayBuffer>();

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const family = searchParams.get("family");
  const weight = searchParams.get("weight") ?? "400";
  const style = searchParams.get("style") ?? "normal";

  if (!family) {
    return NextResponse.json({ error: "Missing 'family' parameter" }, { status: 400 });
  }

  // Validate family name — only allow alphanumeric, spaces, and some special chars
  if (!/^[a-zA-Z0-9 +\-_]+$/.test(family)) {
    return NextResponse.json({ error: "Invalid font family name" }, { status: 400 });
  }

  const cacheKey = `${family}|${weight}|${style}`;

  // Return from cache if available
  if (fontCache.has(cacheKey)) {
    return new NextResponse(fontCache.get(cacheKey)!, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  try {
    // Step 1: Fetch the CSS from Google Fonts with a User-Agent that triggers TTF format
    // Using a basic browser-like User-Agent that causes Google to serve TTF/OTF
    // instead of WOFF2 (which pdf-lib cannot embed)
    const italStr = style === "italic" ? "1" : "0";
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:ital,wght@${italStr},${weight}&display=swap`;

    const cssResponse = await fetch(cssUrl, {
      headers: {
        // This User-Agent string causes Google Fonts to serve TTF format
        "User-Agent": "Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)",
      },
    });

    if (!cssResponse.ok) {
      return NextResponse.json(
        { error: `Google Fonts returned ${cssResponse.status}` },
        { status: 502 },
      );
    }

    const cssText = await cssResponse.text();

    // Step 2: Extract the font URL from the CSS
    // Google Fonts CSS contains: src: url(...) format('truetype');
    const urlMatch = cssText.match(/src:\s*url\(([^)]+)\)/);
    if (!urlMatch?.[1]) {
      return NextResponse.json(
        { error: "Could not extract font URL from Google Fonts CSS" },
        { status: 502 },
      );
    }

    const fontUrl = urlMatch[1];

    // Step 3: Fetch the actual font binary
    const fontResponse = await fetch(fontUrl);
    if (!fontResponse.ok) {
      return NextResponse.json(
        { error: `Font binary fetch failed: ${fontResponse.status}` },
        { status: 502 },
      );
    }

    const fontBuffer = await fontResponse.arrayBuffer();

    // Cache for future requests
    fontCache.set(cacheKey, fontBuffer);

    return new NextResponse(fontBuffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[api/fonts] Error fetching font:", err);
    return NextResponse.json(
      { error: "Failed to fetch font from Google Fonts" },
      { status: 500 },
    );
  }
}
