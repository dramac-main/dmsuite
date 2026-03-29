/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Poster & Flyer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Poster/Flyer Designer.
 *  Default canvas: A4 portrait 794 × 1123 px.
 *
 *  Named objects for quick-edit targeting:
 *    pst-headline, pst-subtext, pst-cta, pst-label, pst-event-date,
 *    pst-venue, pst-organizer, pst-brand, pst-description, pst-footer-note
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 794;
const H = 1123;

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

function line(
  name: string,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: Record<string, unknown>,
): Record<string, unknown> {
  return {
    type: "line",
    version: "5.3.0",
    originX: "left",
    originY: "top",
    name,
    x1, y1, x2, y2,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1) || 0,
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildPoster(opts: {
  bg: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, accent, textColor, headingFont, bodyFont, extraObjects = [] } = opts;

  const objects: Record<string, unknown>[] = [
    // Header accent bar
    rect("pst-header-bar", {
      left: 0, top: 0, width: W, height: 120,
      fill: accent, selectable: false,
    }),
    // Label
    txt("pst-label", "UPCOMING EVENT", {
      left: 60, top: 30, width: W - 120, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "600", fill: textColor,
      charSpacing: 300, textTransform: "uppercase",
    }),
    // Headline
    txt("pst-headline", "Event Headline\nGoes Here", {
      left: 60, top: 200, width: W - 120, fontSize: 64,
      fontFamily: headingFont, fontWeight: "800", fill: textColor,
      lineHeight: 1.1,
    }),
    // Subtext
    txt("pst-subtext", "Join us for an unforgettable experience featuring world-class performances, exhibitions, and networking opportunities.", {
      left: 60, top: 420, width: W - 120, fontSize: 18,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.8, lineHeight: 1.5,
    }),
    // Divider
    line("pst-divider", 60, 560, 200, 560, {
      left: 60, top: 560, stroke: accent, strokeWidth: 3,
    }),
    // Event date
    txt("pst-event-date", "Saturday, 15 March 2026", {
      left: 60, top: 590, width: 400, fontSize: 22,
      fontFamily: bodyFont, fontWeight: "700", fill: accent,
    }),
    // Venue
    txt("pst-venue", "Convention Centre, Lusaka", {
      left: 60, top: 625, width: 400, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.7,
    }),
    // CTA button bg
    rect("pst-cta-bg", {
      left: 60, top: 700, width: 280, height: 56,
      fill: accent, rx: 8, ry: 8,
    }),
    // CTA text
    txt("pst-cta", "GET YOUR TICKETS", {
      left: 80, top: 714, width: 240, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "700", fill: bg === "#ffffff" ? "#ffffff" : bg,
      textAlign: "center", charSpacing: 200,
    }),
    // Description / body
    txt("pst-description", "Featuring live music, food stalls, art exhibitions, and guest speakers from across Africa.", {
      left: 60, top: 800, width: W - 120, fontSize: 15,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.65, lineHeight: 1.6,
    }),
    // Organizer
    txt("pst-organizer", "Presented by DMSuite Events", {
      left: 60, top: 940, width: 400, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "500", fill: textColor,
      opacity: 0.5,
    }),
    // Brand
    txt("pst-brand", "DMSUITE", {
      left: 60, top: 970, width: 200, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "700", fill: accent,
      charSpacing: 400,
    }),
    // Footer bar
    rect("pst-footer-bar", {
      left: 0, top: H - 60, width: W, height: 60,
      fill: accent, opacity: 0.15,
    }),
    // Footer note
    txt("pst-footer-note", "www.dmsuite.com  |  Free entry for children under 12", {
      left: 60, top: H - 42, width: W - 120, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.5, textAlign: "center",
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const POSTER_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "poster-modern-lime",
    name: "Modern Lime",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#030712",
      accent: "#84cc16",
      textColor: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-midnight-indigo",
    name: "Midnight Indigo",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#0f0f23",
      accent: "#6366f1",
      textColor: "#ffffff",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-sunset-orange",
    name: "Sunset Orange",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#1a0a00",
      accent: "#f97316",
      textColor: "#ffffff",
      headingFont: "Oswald",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-rose-bold",
    name: "Rose Bold",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#1a0005",
      accent: "#f43f5e",
      textColor: "#ffffff",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-ocean-teal",
    name: "Ocean Teal",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#021a22",
      accent: "#06b6d4",
      textColor: "#ffffff",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-royal-purple",
    name: "Royal Purple",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPoster({
      bg: "#10002a",
      accent: "#a855f7",
      textColor: "#ffffff",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-clean-mono",
    name: "Clean Monochrome",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#ffffff",
      accent: "#18181b",
      textColor: "#18181b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-warm-ember",
    name: "Warm Ember",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#1c0800",
      accent: "#ea580c",
      textColor: "#fef2e8",
      headingFont: "Oswald",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-forest-green",
    name: "Forest Green",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPoster({
      bg: "#021a0a",
      accent: "#22c55e",
      textColor: "#ffffff",
      headingFont: "Merriweather",
      bodyFont: "Inter",
    }),
  },
  {
    id: "poster-ice-blue",
    name: "Ice Blue",
    category: "poster",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPoster({
      bg: "#f0f9ff",
      accent: "#0ea5e9",
      textColor: "#0c4a6e",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
];
