// =============================================================================
// DMSuite — Client-Side Color Extractor
// Extracts dominant colors from an image data URI using Canvas API.
// Runs in the browser only. Returns hex color strings.
// =============================================================================

/**
 * Extract the top N dominant colors from an image data URI.
 * Uses k-means-style bucketing on sampled pixels.
 *
 * @param dataUri  Full data URI (data:image/png;base64,...)
 * @param count    Number of dominant colors to extract (default 5)
 * @returns        Array of hex color strings (e.g. ["#1a73e8", "#0d47a1"])
 */
export async function extractDominantColors(
  dataUri: string,
  count = 5,
): Promise<string[]> {
  if (typeof window === "undefined" || !dataUri) return [];

  return new Promise<string[]>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        // Sample at a small size for performance
        const sampleSize = 64;
        const canvas = document.createElement("canvas");
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve([]);
          return;
        }

        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
        const pixels = imageData.data;

        // Collect non-white, non-black, non-transparent pixels
        const colorCounts = new Map<string, number>();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          // Skip transparent pixels
          if (a < 128) continue;

          // Skip near-white (background likely)
          if (r > 240 && g > 240 && b > 240) continue;

          // Skip near-black (text likely)
          if (r < 15 && g < 15 && b < 15) continue;

          // Bucket colors by rounding to reduce noise (groups of ~8)
          const br = Math.round(r / 8) * 8;
          const bg = Math.round(g / 8) * 8;
          const bb = Math.round(b / 8) * 8;
          const key = `${br},${bg},${bb}`;
          colorCounts.set(key, (colorCounts.get(key) || 0) + 1);
        }

        // Sort by frequency
        const sorted = Array.from(colorCounts.entries())
          .sort((a, b) => b[1] - a[1]);

        // Convert top colors to hex, filtering out very similar ones
        const result: string[] = [];
        const MIN_DISTANCE = 30; // Minimum color distance between results

        for (const [key] of sorted) {
          if (result.length >= count) break;
          const [r, g, b] = key.split(",").map(Number);
          const hex = rgbToHex(r, g, b);

          // Check if too similar to any already-picked color
          const tooSimilar = result.some((existing) => {
            const [er, eg, eb] = hexToRgb(existing);
            return colorDistance(r, g, b, er, eg, eb) < MIN_DISTANCE;
          });

          if (!tooSimilar) {
            result.push(hex);
          }
        }

        resolve(result);
      } catch {
        resolve([]);
      }
    };
    img.onerror = () => resolve([]);
    img.src = dataUri;
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rgbToHex(r: number, g: number, b: number): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, "0"))
      .join("")
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

function colorDistance(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

// ---------------------------------------------------------------------------
// Cached extraction — prevents re-extracting for the same logo
// ---------------------------------------------------------------------------

let _cachedUri = "";
let _cachedColors: string[] = [];

/**
 * Cached version: extracts colors only if the data URI changed.
 * Safe to call on every getState() construction.
 */
export async function extractDominantColorsCached(
  dataUri: string,
  count = 5,
): Promise<string[]> {
  if (!dataUri) return [];
  if (dataUri === _cachedUri && _cachedColors.length > 0) return _cachedColors;
  _cachedColors = await extractDominantColors(dataUri, count);
  _cachedUri = dataUri;
  return _cachedColors;
}

/**
 * Synchronous version: returns cached colors immediately, or empty array.
 * Call extractDominantColorsCached() first to prime the cache.
 */
export function getCachedLogoColors(): string[] {
  return _cachedColors;
}

/**
 * Prime the cache for a data URI. Call when logo is loaded/changed.
 */
export function primeColorCache(dataUri: string): void {
  if (dataUri && dataUri !== _cachedUri) {
    extractDominantColorsCached(dataUri);
  }
}
