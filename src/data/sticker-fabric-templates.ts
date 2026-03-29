/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Sticker & Decal Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Sticker Designer.
 *  Default canvas: 300 × 300 px (3" square sticker).
 *
 *  Named objects for quick-edit targeting:
 *    stk-title, stk-subtitle, stk-line1, stk-line2, stk-line3, stk-price
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 300;
const H = 300;

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

function buildSticker(opts: {
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
    rect("stk-top-strip", {
      left: 0, top: 0, width: W, height: 60,
      fill: accent,
    }),
    // Title (brand)
    txt("stk-title", "DMSuite", {
      left: 20, top: 14, width: W - 40, fontSize: 20,
      fontFamily: headingFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center",
    }),
    // Divider line
    rect("stk-divider", {
      left: W * 0.2, top: 72, width: W * 0.6, height: 2,
      fill: accent, opacity: 0.4,
    }),
    // Subtitle
    txt("stk-subtitle", "Premium Quality", {
      left: 20, top: 84, width: W - 40, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "500", fill: textColor,
      textAlign: "center", fontStyle: "italic",
    }),
    // Line 1
    txt("stk-line1", "Handmade in Lusaka", {
      left: 20, top: 140, width: W - 40, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.7,
    }),
    // Line 2
    txt("stk-line2", "Zambia", {
      left: 20, top: 165, width: W - 40, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.7,
    }),
    // Line 3
    txt("stk-line3", "www.dmsuite.com", {
      left: 20, top: 190, width: W - 40, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: accent,
      textAlign: "center",
    }),
    // Price
    txt("stk-price", "K49.99", {
      left: 20, top: 230, width: W - 40, fontSize: 28,
      fontFamily: headingFont, fontWeight: "800", fill: accent,
      textAlign: "center",
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const STICKER_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "sticker-classic-dark",
    name: "Classic Dark",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#1e293b",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-lime-pro",
    name: "Lime Pro",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#84cc16",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-gold-label",
    name: "Gold Label",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#fffef5",
      accent: "#c09c2c",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-red-bold",
    name: "Red Bold",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#dc2626",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-navy-blue",
    name: "Navy Blue",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#1e40af",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-forest-green",
    name: "Forest Green",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#16a34a",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-dark-mode",
    name: "Dark Mode",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildSticker({
      bg: "#0f172a",
      accent: "#84cc16",
      textColor: "#e2e8f0",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-kraft-vintage",
    name: "Kraft Vintage",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#fef3c7",
      accent: "#78350f",
      textColor: "#451a03",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-purple-pop",
    name: "Purple Pop",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildSticker({
      bg: "#ffffff",
      accent: "#7c3aed",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "sticker-cyan-fresh",
    name: "Cyan Fresh",
    category: "sticker-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildSticker({
      bg: "#ecfeff",
      accent: "#0891b2",
      textColor: "#1e293b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
