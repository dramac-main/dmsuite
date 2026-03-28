// =============================================================================
// DMSuite — High-Fidelity SVG Renderer (Shared Infrastructure)
// Renders SVG strings to high-DPI PNG for print-quality PDF embedding.
// Uses client-side Canvas2D (Safari-compatible, no OffscreenCanvas).
// Benefits ALL EditorV2 tools that use SVG borders/assets.
// =============================================================================

// ---------------------------------------------------------------------------
// Public: Render SVG string to high-DPI PNG blob
// ---------------------------------------------------------------------------

/**
 * Render an SVG string to a high-DPI PNG blob using a temporary Canvas2D.
 *
 * @param svgString  - Raw SVG markup
 * @param targetWidth  - Desired output width in CSS pixels
 * @param targetHeight - Desired output height in CSS pixels
 * @param dpiScale     - DPI multiplier (default 4 = ~300 DPI for A4)
 * @returns PNG Blob
 */
export async function renderSvgToHighDpiPng(
  svgString: string,
  targetWidth: number,
  targetHeight: number,
  dpiScale: number = 4,
): Promise<Blob> {
  const pixelW = Math.round(targetWidth * dpiScale);
  const pixelH = Math.round(targetHeight * dpiScale);

  // Create a regular canvas element (NOT OffscreenCanvas — Safari compat)
  const canvas = document.createElement("canvas");
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create Canvas2D context for SVG rendering");

  // Create an SVG blob URL
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    // Load SVG as an Image
    const img = await loadImage(svgUrl);

    // Draw at the scaled resolution
    ctx.drawImage(img, 0, 0, pixelW, pixelH);

    // Export as PNG
    return await canvasToBlob(canvas);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

/**
 * Render an SVG string to a PNG data URL at high DPI.
 */
export async function renderSvgToHighDpiDataUrl(
  svgString: string,
  targetWidth: number,
  targetHeight: number,
  dpiScale: number = 4,
): Promise<string> {
  const pixelW = Math.round(targetWidth * dpiScale);
  const pixelH = Math.round(targetHeight * dpiScale);

  const canvas = document.createElement("canvas");
  canvas.width = pixelW;
  canvas.height = pixelH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to create Canvas2D context");

  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(svgUrl);
    ctx.drawImage(img, 0, 0, pixelW, pixelH);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas toBlob failed"));
      },
      "image/png",
    );
  });
}
