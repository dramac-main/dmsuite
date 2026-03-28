// =============================================================================
// DMSuite — Font Loader (Shared Infrastructure)
// Ensures Google Fonts are fully loaded before Canvas2D rendering.
// Uses fontfaceobserver for reliable cross-browser detection.
// Benefits ALL EditorV2 tools (business cards, certificates, resumes, etc.)
// =============================================================================

import FontFaceObserver from "fontfaceobserver";
import type { DesignDocumentV2, TextLayerV2 } from "./schema";

// ---------------------------------------------------------------------------
// Module-level cache — fonts that have already been confirmed loaded
// ---------------------------------------------------------------------------

const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

// System fonts that are always available — no need to load
const SYSTEM_FONTS = new Set([
  "inter",
  "arial",
  "helvetica",
  "helvetica neue",
  "georgia",
  "times new roman",
  "courier new",
  "verdana",
  "tahoma",
  "trebuchet ms",
  "sans-serif",
  "serif",
  "monospace",
  "system-ui",
  "cursive",
  "fantasy",
  "jetbrains mono",
]);

// ---------------------------------------------------------------------------
// Google Fonts URL builder
// ---------------------------------------------------------------------------

function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function injectGoogleFontLink(families: string[]): void {
  const linkId = "dmsuite-font-loader";
  let link = document.getElementById(linkId) as HTMLLinkElement | null;

  const url = buildGoogleFontsUrl(families);

  if (link) {
    // Append new families to existing URL if needed
    if (!link.href.includes(encodeURIComponent(families[0]))) {
      // Re-create with all needed families
      const existingFamilies = extractFamiliesFromUrl(link.href);
      const allFamilies = [...new Set([...existingFamilies, ...families])];
      link.href = buildGoogleFontsUrl(allFamilies);
    }
    return;
  }

  link = document.createElement("link");
  link.id = linkId;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

function extractFamiliesFromUrl(url: string): string[] {
  const matches = url.matchAll(/family=([^:&]+)/g);
  return [...matches].map((m) => decodeURIComponent(m[1]));
}

// ---------------------------------------------------------------------------
// Public: Ensure a single font is loaded
// ---------------------------------------------------------------------------

/**
 * Ensure a Google Font family is loaded and ready for Canvas2D rendering.
 * Resolves immediately for system fonts. For Google Fonts, injects the
 * stylesheet and waits for FontFaceObserver to confirm availability.
 *
 * @param family - CSS font-family name (e.g., "Playfair Display")
 * @param weight - Font weight (default 400)
 * @param style  - "normal" or "italic" (default "normal")
 */
export async function ensureFontReady(
  family: string,
  weight: number = 400,
  style: string = "normal",
): Promise<void> {
  const key = `${family}|${weight}|${style}`;

  // Already confirmed loaded
  if (loadedFonts.has(key)) return;

  // System font — always available
  const normalized = family.toLowerCase().replace(/['"]/g, "").trim();
  if (SYSTEM_FONTS.has(normalized)) {
    loadedFonts.add(key);
    return;
  }

  // Return existing pending load if one is in progress
  if (pendingLoads.has(key)) {
    return pendingLoads.get(key)!;
  }

  const loadPromise = (async () => {
    try {
      // Inject the Google Fonts stylesheet
      injectGoogleFontLink([family]);

      // Wait for the font to be renderable
      const observer = new FontFaceObserver(family, {
        weight,
        style,
      });

      await observer.load(null, 10_000); // 10 second timeout
      loadedFonts.add(key);
    } catch {
      // Font failed to load — log warning but don't block
      console.warn(`[font-loader] Failed to load font: ${family} (${weight} ${style})`);
      loadedFonts.add(key); // Mark as done to prevent retry
    } finally {
      pendingLoads.delete(key);
    }
  })();

  pendingLoads.set(key, loadPromise);
  return loadPromise;
}

// ---------------------------------------------------------------------------
// Public: Ensure all fonts in a document are loaded
// ---------------------------------------------------------------------------

/**
 * Scan all text layers in a DesignDocumentV2, extract unique font+weight+style
 * combos, and wait for all of them to be ready for Canvas2D rendering.
 */
export async function ensureDocumentFontsReady(doc: DesignDocumentV2): Promise<void> {
  const fontSpecs = new Set<string>();

  for (const layer of Object.values(doc.layersById)) {
    if (layer.type !== "text") continue;
    const textLayer = layer as TextLayerV2;
    const ds = textLayer.defaultStyle;

    if (ds?.fontFamily) {
      const weight = ds.fontWeight ?? 400;
      const style = ds.italic ? "italic" : "normal";
      fontSpecs.add(`${ds.fontFamily}|${weight}|${style}`);
    }

    // Also check per-run overrides
    for (const run of textLayer.runs ?? []) {
      if (run.style?.fontFamily) {
        const weight = run.style.fontWeight ?? ds?.fontWeight ?? 400;
        const style = run.style.italic ?? ds?.italic ? "italic" : "normal";
        fontSpecs.add(`${run.style.fontFamily}|${weight}|${style}`);
      }
    }
  }

  if (fontSpecs.size === 0) return;

  const promises: Promise<void>[] = [];
  for (const spec of fontSpecs) {
    const [family, weightStr, style] = spec.split("|");
    promises.push(ensureFontReady(family, parseInt(weightStr, 10), style));
  }

  await Promise.all(promises);
}

// ---------------------------------------------------------------------------
// Public: Check if a font is already loaded (sync)
// ---------------------------------------------------------------------------

export function isFontLoaded(family: string, weight = 400, style = "normal"): boolean {
  const key = `${family}|${weight}|${style}`;
  if (loadedFonts.has(key)) return true;
  const normalized = family.toLowerCase().replace(/['"]/g, "").trim();
  return SYSTEM_FONTS.has(normalized);
}
