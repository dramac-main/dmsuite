/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Signage & Large Format Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Signage Designer.
 *  Default canvas: 425 × 1000 px (pull-up banner).
 *
 *  Named objects for quick-edit targeting:
 *    sgn-headline, sgn-subheadline, sgn-body-text, sgn-cta-text,
 *    sgn-business-name, sgn-phone, sgn-website, sgn-address
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 425;
const H = 1000;

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

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildSignage(opts: {
  bg: string;
  accent: string;
  textColor: string;
  subColor: string;
  headingFont: string;
  bodyFont: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, accent, textColor, subColor, headingFont, bodyFont, extraObjects = [] } = opts;

  const objects: Record<string, unknown>[] = [
    // Business name (top)
    txt("sgn-business-name", "DMSuite Store", {
      left: 30, top: 30, width: W - 60, fontSize: 16,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
      textAlign: "center", charSpacing: 200,
    }),
    // Headline
    txt("sgn-headline", "GRAND\nOPENING", {
      left: 30, top: 200, width: W - 60, fontSize: 64,
      fontFamily: headingFont, fontWeight: "900", fill: textColor,
      textAlign: "center", lineHeight: 1.1,
    }),
    // Subheadline
    txt("sgn-subheadline", "Now Open in Lusaka", {
      left: 30, top: 400, width: W - 60, fontSize: 22,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center",
    }),
    // Divider
    rect("sgn-divider", {
      left: W * 0.25, top: 450, width: W * 0.5, height: 3,
      fill: accent,
    }),
    // Body text
    txt("sgn-body-text", "Visit our new store for amazing deals on all products", {
      left: 40, top: 480, width: W - 80, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      textAlign: "center", lineHeight: 1.6,
    }),
    // CTA button bg
    rect("sgn-cta-bg", {
      left: W * 0.15, top: 600, width: W * 0.7, height: 56,
      fill: accent, rx: 8, ry: 8,
    }),
    // CTA text
    txt("sgn-cta-text", "VISIT TODAY", {
      left: W * 0.15, top: 615, width: W * 0.7, fontSize: 20,
      fontFamily: bodyFont, fontWeight: "700",
      fill: bg === "#ffffff" || bg === "#fef3c7" || bg === "#fbbf24" ? "#ffffff" : bg,
      textAlign: "center", charSpacing: 200,
    }),
    // Contact section
    txt("sgn-phone", "+260 977 123 456", {
      left: 30, top: 750, width: W - 60, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: textColor,
      textAlign: "center",
    }),
    txt("sgn-website", "www.dmsuite.com", {
      left: 30, top: 780, width: W - 60, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "500", fill: accent,
      textAlign: "center",
    }),
    txt("sgn-address", "Plot 123, Cairo Road, Lusaka", {
      left: 30, top: 810, width: W - 60, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      textAlign: "center", opacity: 0.7,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const SIGNAGE_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "signage-retail-blue",
    name: "Retail Blue",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#1e40af",
      accent: "#ffffff",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-event-dark",
    name: "Event Dark",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#111827",
      accent: "#84cc16",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-directional-slate",
    name: "Directional Slate",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#1e293b",
      accent: "#3b82f6",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-promotional-warm",
    name: "Promotional Warm",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#fef3c7",
      accent: "#dc2626",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-real-estate",
    name: "Real Estate Gold",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#0f172a",
      accent: "#c09c2c",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-construction",
    name: "Construction Bold",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildSignage({
      bg: "#fbbf24",
      accent: "#1e293b",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-teal-modern",
    name: "Teal Modern",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#0f766e",
      accent: "#ffffff",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-purple-event",
    name: "Purple Event",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#7c3aed",
      accent: "#ffffff",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-orange-retail",
    name: "Orange Retail",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildSignage({
      bg: "#ea580c",
      accent: "#ffffff",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "signage-emerald-clean",
    name: "Emerald Clean",
    category: "signage",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSignage({
      bg: "#059669",
      accent: "#ffffff",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
