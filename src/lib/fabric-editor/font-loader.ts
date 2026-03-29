/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Fabric Editor Font Loader
 *  Ensures Google Fonts are fully loaded before Fabric.js rendering.
 *  Uses fontfaceobserver for reliable cross-browser detection.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import FontFaceObserver from "fontfaceobserver";

// Module-level cache
const loadedFonts = new Set<string>();
const pendingLoads = new Map<string, Promise<void>>();

const SYSTEM_FONTS = new Set([
  "inter", "arial", "arial black", "helvetica", "helvetica neue",
  "georgia", "times new roman", "courier new", "verdana", "tahoma",
  "trebuchet ms", "sans-serif", "serif", "monospace", "system-ui",
  "cursive", "fantasy", "jetbrains mono", "impact", "lucida sans unicode",
  "palatino", "garamond",
]);

function buildGoogleFontsUrl(families: string[]): string {
  const params = families
    .map((f) => `family=${encodeURIComponent(f)}:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,300;1,400;1,500;1,600;1,700`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

function injectGoogleFontLink(families: string[]): void {
  const linkId = "dmsuite-fabric-font-loader";
  let link = document.getElementById(linkId) as HTMLLinkElement | null;
  const url = buildGoogleFontsUrl(families);

  if (link) {
    if (!link.href.includes(encodeURIComponent(families[0]))) {
      const existing = extractFamiliesFromUrl(link.href);
      const all = [...new Set([...existing, ...families])];
      link.href = buildGoogleFontsUrl(all);
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

/**
 * Ensure a Google Font family is loaded and ready for rendering.
 * Resolves immediately for system fonts.
 */
export async function ensureFontReady(
  family: string,
  weight: number = 400,
  style: string = "normal",
): Promise<void> {
  const key = `${family}|${weight}|${style}`;
  if (loadedFonts.has(key)) return;

  const normalized = family.toLowerCase().replace(/['"]/g, "").trim();
  if (SYSTEM_FONTS.has(normalized)) {
    loadedFonts.add(key);
    return;
  }

  if (pendingLoads.has(key)) return pendingLoads.get(key)!;

  const loadPromise = (async () => {
    try {
      injectGoogleFontLink([family]);
      const observer = new FontFaceObserver(family, { weight, style });
      await observer.load(null, 10_000);
      loadedFonts.add(key);
    } catch {
      console.warn(`[fabric-font-loader] Failed to load: ${family} (${weight} ${style})`);
      loadedFonts.add(key);
    } finally {
      pendingLoads.delete(key);
    }
  })();

  pendingLoads.set(key, loadPromise);
  return loadPromise;
}
