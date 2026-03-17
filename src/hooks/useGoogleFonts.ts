// =============================================================================
// DMSuite — Dynamic Google Fonts Loader
// Injects/updates a <link> in <head> when the active font pairing changes.
// Skips system fonts (Georgia, system-ui) and Inter (loaded via next/font).
// =============================================================================

"use client";

import { useEffect, useRef } from "react";
import { FONT_PAIRINGS } from "@/lib/resume/schema";

// ---------------------------------------------------------------------------
// Fonts that are either system fonts or already loaded via next/font
// ---------------------------------------------------------------------------

const SKIP_FONTS = new Set([
  "Georgia",
  "system-ui",
  "sans-serif",
  "serif",
  "monospace",
  "ui-sans-serif",
  "Inter", // loaded via next/font/google in layout.tsx
]);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the primary font family name from a CSS font-family string.
 * e.g. "'Playfair Display', serif" → "Playfair Display"
 *      "Georgia, serif" → "Georgia"
 */
function extractFontFamily(cssFontFamily: string): string | null {
  const first = cssFontFamily.split(",")[0].trim().replace(/'/g, "").replace(/"/g, "");
  if (SKIP_FONTS.has(first)) return null;
  return first;
}

/**
 * Build a Google Fonts CSS2 API URL for the given families.
 */
function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Dynamically loads Google Fonts for the active font pairing.
 * Call this in any component that renders the resume preview.
 *
 * @param fontPairingId — The key into FONT_PAIRINGS (e.g. "playfair-source")
 */
export function useGoogleFonts(fontPairingId: string) {
  const linkRef = useRef<HTMLLinkElement | null>(null);

  // Update the <link> whenever the pairing changes
  useEffect(() => {
    const pairing = FONT_PAIRINGS[fontPairingId];
    if (!pairing) return;

    // Collect unique font families that need Google Fonts loading
    const families = new Set<string>();
    const headingFont = extractFontFamily(pairing.heading);
    const bodyFont = extractFontFamily(pairing.body);
    if (headingFont) families.add(headingFont);
    if (bodyFont) families.add(bodyFont);

    // If no external fonts needed, remove any existing <link>
    if (families.size === 0) {
      if (linkRef.current) {
        linkRef.current.remove();
        linkRef.current = null;
      }
      return;
    }

    const url = buildGoogleFontsUrl(Array.from(families));

    // Create <link> if it doesn't exist
    if (!linkRef.current) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.id = "resume-google-fonts";
      document.head.appendChild(link);
      linkRef.current = link;
    }

    // Update href (browser skips re-fetch if unchanged)
    linkRef.current.href = url;
  }, [fontPairingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (linkRef.current) {
        linkRef.current.remove();
        linkRef.current = null;
      }
    };
  }, []);
}
