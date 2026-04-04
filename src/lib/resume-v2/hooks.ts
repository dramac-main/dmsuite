/**
 * Resume V2 Hooks — CSS Variables & Webfonts
 * Adapted from Reactive Resume v5
 */
import { useMemo, useEffect, useRef } from "react";
import type { ResumeData } from "./schema";
import { PAGE_DIMENSIONS } from "./schema";

type CSSVarsInput = Pick<ResumeData, "picture" | "metadata">;

/** Generates CSS custom properties for resume page rendering */
export function useCSSVariables({ picture, metadata }: CSSVarsInput) {
  const fontWeightStyles = useMemo(() => {
    const bw = metadata.typography.body.fontWeights.map(Number);
    const hw = metadata.typography.heading.fontWeights.map(Number);
    const lo_b = Math.min(...bw);
    const lo_h = Math.min(...hw);
    const raw_hi_b = Math.max(...bw);
    const raw_hi_h = Math.max(...hw);
    return {
      lowestBodyFontWeight: lo_b,
      lowestHeadingFontWeight: lo_h,
      highestBodyFontWeight: raw_hi_b <= lo_b ? 700 : raw_hi_b,
      highestHeadingFontWeight: raw_hi_h <= lo_h ? 700 : raw_hi_h,
    };
  }, [metadata.typography.body.fontWeights, metadata.typography.heading.fontWeights]);

  const dims = PAGE_DIMENSIONS[metadata.page.format];

  return {
    "--picture-border-radius": `${picture.borderRadius}pt`,
    "--page-width": `${dims.width}mm`,
    "--page-height": metadata.page.format === "free-form" ? "auto" : `${dims.height}mm`,
    "--page-sidebar-width": `${metadata.layout.sidebarWidth}%`,
    "--page-text-color": metadata.design.colors.text,
    "--page-primary-color": metadata.design.colors.primary,
    "--page-background-color": metadata.design.colors.background,
    "--page-body-font-family": `'${metadata.typography.body.fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    "--page-body-font-weight": fontWeightStyles.lowestBodyFontWeight,
    "--page-body-font-weight-bold": fontWeightStyles.highestBodyFontWeight,
    "--page-body-font-size": metadata.typography.body.fontSize,
    "--page-body-line-height": metadata.typography.body.lineHeight,
    "--page-heading-font-family": `'${metadata.typography.heading.fontFamily}', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`,
    "--page-heading-font-weight": fontWeightStyles.lowestHeadingFontWeight,
    "--page-heading-font-weight-bold": fontWeightStyles.highestHeadingFontWeight,
    "--page-heading-font-size": metadata.typography.heading.fontSize,
    "--page-heading-line-height": metadata.typography.heading.lineHeight,
    "--page-margin-x": `${metadata.page.marginX}pt`,
    "--page-margin-y": `${metadata.page.marginY}pt`,
    "--page-gap-x": `${metadata.page.gapX}pt`,
    "--page-gap-y": `${metadata.page.gapY}pt`,
  } as React.CSSProperties;
}

/** Loads Google Fonts via FontFace API for body + heading typography */
export function useWebfonts(typography: ResumeData["metadata"]["typography"]) {
  const loadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    async function loadFont(family: string, weights: string[]) {
      const key = `${family}:${weights.join(",")}`;
      if (loadedRef.current.has(key)) return;
      loadedRef.current.add(key);

      const sanitizedFamily = encodeURIComponent(family);
      const weightList = weights.join(";");
      const url = `https://fonts.googleapis.com/css2?family=${sanitizedFamily}:ital,wght@0,${weightList};1,${weightList}&display=swap`;

      try {
        const res = await fetch(url);
        const css = await res.text();
        // Extract @font-face URLs from CSS
        const fontFaceRegex = /url\(([^)]+)\)[\s\S]*?font-weight:\s*(\d+)/g;
        let match;
        while ((match = fontFaceRegex.exec(css)) !== null) {
          const fontUrl = match[1].replace(/['"]/g, "");
          const weight = match[2];
          try {
            const face = new FontFace(family, `url("${fontUrl}")`, { weight, display: "swap" });
            const loaded = await face.load();
            if (!document.fonts.has(loaded)) document.fonts.add(loaded);
          } catch {
            // Font loading failed silently
          }
        }
      } catch {
        // CSS fetch failed silently
      }
    }

    void Promise.all([
      loadFont(typography.body.fontFamily, typography.body.fontWeights),
      loadFont(typography.heading.fontFamily, typography.heading.fontWeights),
    ]);
  }, [typography]);
}

/** Generates a unique ID */
export function createId(): string {
  return crypto.randomUUID();
}

/** Strip HTML tags from string */
export function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}
