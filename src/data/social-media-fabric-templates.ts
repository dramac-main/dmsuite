/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Social Media Post Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Social Media Post tool.
 *  Default canvas: 1080 × 1080 px (Instagram Post / square).
 *
 *  Named objects for quick-edit targeting:
 *    smp-headline, smp-subtext, smp-cta, smp-label, smp-brand,
 *    smp-handle, smp-hashtag, smp-body, smp-date
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 1080;
const H = 1080;

// ── Helpers ─────────────────────────────────────────────────────────────────

function txt(
  name: string,
  text: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "textbox",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    text,
    styles: [],
    selectable: true,
    hasControls: true,
    editable: true,
    ...opts,
  };
}

function rect(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "rect",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function circle(
  name: string,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "circle",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildPost(opts: {
  bg: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, accent, textColor, headingFont, bodyFont, extraObjects = [] } = opts;

  const objects: Record<string, unknown>[] = [
    // Top accent strip
    rect("smp-top-strip", {
      left: 0, top: 0, width: W, height: 8,
      fill: accent, selectable: false,
    }),
    // Label tag
    rect("smp-label-bg", {
      left: 60, top: 80, width: 160, height: 36,
      fill: accent, rx: 18, ry: 18,
    }),
    txt("smp-label", "ANNOUNCEMENT", {
      left: 72, top: 87, width: 140, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "700", fill: bg === "#ffffff" ? "#ffffff" : bg,
      textAlign: "center", charSpacing: 200,
    }),
    // Headline
    txt("smp-headline", "Your Bold\nHeadline Here", {
      left: 60, top: 180, width: W - 120, fontSize: 72,
      fontFamily: headingFont, fontWeight: "800", fill: textColor,
      lineHeight: 1.05,
    }),
    // Subtext
    txt("smp-subtext", "Add supporting context that tells your audience what this post is about.", {
      left: 60, top: 420, width: W - 120, fontSize: 22,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.75, lineHeight: 1.5,
    }),
    // Body
    txt("smp-body", "Share your message, promote your offer, or tell your story.", {
      left: 60, top: 560, width: W - 120, fontSize: 18,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.6, lineHeight: 1.6,
    }),
    // CTA pill
    rect("smp-cta-bg", {
      left: 60, top: 700, width: 260, height: 52,
      fill: accent, rx: 26, ry: 26,
    }),
    txt("smp-cta", "LEARN MORE", {
      left: 80, top: 714, width: 220, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "700", fill: bg === "#ffffff" ? "#ffffff" : bg,
      textAlign: "center", charSpacing: 200,
    }),
    // Date
    txt("smp-date", "March 2026", {
      left: 60, top: 800, width: 200, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "500", fill: textColor,
      opacity: 0.5,
    }),
    // Hashtag
    txt("smp-hashtag", "#DMSuite #Design", {
      left: 60, top: 840, width: 400, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "400", fill: accent,
      opacity: 0.7,
    }),
    // Footer divider
    rect("smp-footer-divider", {
      left: 60, top: 920, width: W - 120, height: 1,
      fill: textColor, opacity: 0.15,
    }),
    // Brand
    txt("smp-brand", "DMSUITE", {
      left: 60, top: 950, width: 200, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "700", fill: accent,
      charSpacing: 400,
    }),
    // Handle
    txt("smp-handle", "@dmsuite", {
      left: W - 200, top: 950, width: 140, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.5, textAlign: "right",
    }),
    // Decorative circle (top-right)
    circle("smp-deco-circle", {
      left: W - 200, top: -60, radius: 120,
      fill: accent, opacity: 0.08,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const SOCIAL_MEDIA_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "smp-lime-dark",
    name: "Lime Dark",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#030712",
      accent: "#84cc16",
      textColor: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-midnight-indigo",
    name: "Midnight Indigo",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#0f0f23",
      accent: "#6366f1",
      textColor: "#ffffff",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-sunset-flame",
    name: "Sunset Flame",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#1a0a00",
      accent: "#f97316",
      textColor: "#ffffff",
      headingFont: "Oswald",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-rose-pop",
    name: "Rose Pop",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#1a0005",
      accent: "#f43f5e",
      textColor: "#ffffff",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-ocean-cyan",
    name: "Ocean Cyan",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#021a22",
      accent: "#06b6d4",
      textColor: "#ffffff",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-royal-purple",
    name: "Royal Purple",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPost({
      bg: "#10002a",
      accent: "#a855f7",
      textColor: "#ffffff",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-clean-light",
    name: "Clean Light",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#ffffff",
      accent: "#18181b",
      textColor: "#18181b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-warm-ember",
    name: "Warm Ember",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#1c0800",
      accent: "#ea580c",
      textColor: "#fef2e8",
      headingFont: "Oswald",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-forest-green",
    name: "Forest Green",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPost({
      bg: "#021a0a",
      accent: "#22c55e",
      textColor: "#ffffff",
      headingFont: "Merriweather",
      bodyFont: "Inter",
    }),
  },
  {
    id: "smp-ice-fresh",
    name: "Ice Fresh",
    category: "social",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPost({
      bg: "#f0f9ff",
      accent: "#0ea5e9",
      textColor: "#0c4a6e",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
];
