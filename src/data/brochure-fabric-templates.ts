/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Brochure Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Brochure Designer.
 *  Default canvas: A4 landscape 842 × 595 px (single spread view).
 *
 *  Named objects for quick-edit targeting:
 *    bro-company-name, bro-cover-title, bro-cover-body, bro-tagline,
 *    bro-section-1-heading, bro-section-1-body, bro-section-2-heading,
 *    bro-section-2-body, bro-cta, bro-phone, bro-website, bro-address
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 842;
const H = 595;

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

function buildBrochure(opts: {
  bg: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  panelBg?: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, accent, textColor, headingFont, bodyFont, panelBg, extraObjects = [] } = opts;
  const mid = W / 2;

  const objects: Record<string, unknown>[] = [
    // Left panel (cover)
    rect("bro-cover-panel", {
      left: 0, top: 0, width: mid - 2, height: H,
      fill: accent,
    }),
    // Company name
    txt("bro-company-name", "DMSUITE SOLUTIONS", {
      left: 30, top: 30, width: mid - 70, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "700", fill: "#ffffff",
      charSpacing: 300, opacity: 0.9,
    }),
    // Cover title
    txt("bro-cover-title", "Transform Your\nBusiness Today", {
      left: 30, top: 180, width: mid - 70, fontSize: 38,
      fontFamily: headingFont, fontWeight: "800", fill: "#ffffff",
      lineHeight: 1.15,
    }),
    // Cover body
    txt("bro-cover-body", "Discover innovative solutions designed to help your business grow and succeed in the modern marketplace.", {
      left: 30, top: 340, width: mid - 70, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "400", fill: "#ffffff",
      opacity: 0.85, lineHeight: 1.6,
    }),
    // Tagline
    txt("bro-tagline", "Innovation · Excellence · Growth", {
      left: 30, top: H - 50, width: mid - 70, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "500", fill: "#ffffff",
      opacity: 0.7,
    }),
    // Right panel bg
    rect("bro-content-panel", {
      left: mid + 2, top: 0, width: mid - 2, height: H,
      fill: panelBg || bg,
    }),
    // Fold line
    line("bro-fold-line", mid, 0, mid, H, {
      left: mid, top: 0, stroke: "#cbd5e1", strokeWidth: 1,
      strokeDashArray: [8, 6], opacity: 0.5,
    }),
    // Section 1 heading
    txt("bro-section-1-heading", "Our Services", {
      left: mid + 30, top: 40, width: mid - 70, fontSize: 22,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    // Section 1 body
    txt("bro-section-1-body", "We provide comprehensive digital solutions including web development, branding, marketing, and consulting services tailored to your needs.", {
      left: mid + 30, top: 80, width: mid - 70, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.7, lineHeight: 1.6,
    }),
    // Divider
    line("bro-divider-1", mid + 30, 200, mid + 160, 200, {
      left: mid + 30, top: 200, stroke: accent, strokeWidth: 2,
    }),
    // Section 2 heading
    txt("bro-section-2-heading", "Why Choose Us", {
      left: mid + 30, top: 220, width: mid - 70, fontSize: 22,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    // Section 2 body
    txt("bro-section-2-body", "With over 10 years of experience and a dedicated team, we deliver results that exceed expectations. Our client-first approach ensures your success.", {
      left: mid + 30, top: 260, width: mid - 70, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.7, lineHeight: 1.6,
    }),
    // CTA
    rect("bro-cta-bg", {
      left: mid + 30, top: 400, width: 200, height: 44,
      fill: accent, rx: 6, ry: 6,
    }),
    txt("bro-cta", "GET IN TOUCH", {
      left: mid + 40, top: 412, width: 180, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center", charSpacing: 200,
    }),
    // Contact info
    txt("bro-phone", "+260 977 123 456", {
      left: mid + 30, top: 480, width: 200, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "500", fill: textColor,
      opacity: 0.6,
    }),
    txt("bro-website", "www.dmsuite.com", {
      left: mid + 30, top: 500, width: 200, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "500", fill: accent,
    }),
    txt("bro-address", "Plot 1234, Cairo Road, Lusaka", {
      left: mid + 30, top: 520, width: 250, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      opacity: 0.5,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const BROCHURE_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "brochure-corporate-blue",
    name: "Corporate Blue",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#ffffff",
      accent: "#1e40af",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-teal-modern",
    name: "Teal Modern",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#f8fafc",
      accent: "#0f766e",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-purple-bold",
    name: "Purple Bold",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#ffffff",
      accent: "#7c3aed",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-red-impact",
    name: "Red Impact",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#ffffff",
      accent: "#dc2626",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-dark-emerald",
    name: "Dark Emerald",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#0f172a",
      accent: "#059669",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      panelBg: "#1e293b",
    }),
  },
  {
    id: "brochure-sky-light",
    name: "Sky Light",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildBrochure({
      bg: "#f0f9ff",
      accent: "#0284c7",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-orange-warm",
    name: "Warm Orange",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#ffffff",
      accent: "#ea580c",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-indigo-elegant",
    name: "Indigo Elegant",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#ffffff",
      accent: "#4f46e5",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "brochure-midnight-gold",
    name: "Midnight Gold",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildBrochure({
      bg: "#0a0a0a",
      accent: "#c09c2c",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      panelBg: "#1a1a2e",
    }),
  },
  {
    id: "brochure-lime-electric",
    name: "Lime Electric",
    category: "brochure",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBrochure({
      bg: "#030712",
      accent: "#84cc16",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
      panelBg: "#111827",
    }),
  },
];
