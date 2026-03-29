/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Packaging Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Packaging Designer.
 *  Default canvas: 900 × 700 px (box die-cut layout).
 *
 *  Named objects for quick-edit targeting:
 *    pkg-product-name, pkg-brand-name, pkg-tagline, pkg-weight,
 *    pkg-ingredients, pkg-barcode
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 900;
const H = 700;

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
    selectable: true,
    hasControls: true,
    ...opts,
  };
}

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

const FACE_W = Math.round(W * 0.3);  // 270
const SIDE_W = Math.round(W * 0.15); // 135
const FLAP_H = Math.round(H * 0.12); // 84

function buildPackaging(opts: {
  bg: string;
  primary: string;
  secondary: string;
  textColor: string;
  subColor: string;
  headingFont: string;
  bodyFont: string;
}): string {
  const { bg, primary, secondary, textColor, subColor, headingFont, bodyFont } = opts;

  const frontLeft = SIDE_W;
  const backLeft = SIDE_W + FACE_W;
  const bodyTop = FLAP_H;
  const bodyH = H - FLAP_H * 2;

  const objects: Record<string, unknown>[] = [
    // Left side panel
    rect("pkg-side-left", {
      left: 0, top: bodyTop, width: SIDE_W, height: bodyH,
      fill: secondary, opacity: 0.15,
    }),
    // Front panel
    rect("pkg-front-panel", {
      left: frontLeft, top: bodyTop, width: FACE_W, height: bodyH,
      fill: primary,
    }),
    // Back panel
    rect("pkg-back-panel", {
      left: backLeft, top: bodyTop, width: FACE_W, height: bodyH,
      fill: bg,
    }),
    // Right side panel
    rect("pkg-side-right", {
      left: backLeft + FACE_W, top: bodyTop, width: SIDE_W, height: bodyH,
      fill: secondary, opacity: 0.15,
    }),
    // Top flap
    rect("pkg-top-flap", {
      left: frontLeft, top: 0, width: FACE_W, height: FLAP_H,
      fill: primary, opacity: 0.1,
    }),
    txt("pkg-top-flap-text", "TOP FLAP — GLUE AREA", {
      left: frontLeft, top: FLAP_H / 2 - 8, width: FACE_W, fontSize: 9,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center", opacity: 0.5,
    }),
    // Bottom flap
    rect("pkg-bottom-flap", {
      left: frontLeft, top: H - FLAP_H, width: FACE_W, height: FLAP_H,
      fill: primary, opacity: 0.1,
    }),
    txt("pkg-bottom-flap-text", "BOTTOM FLAP — TUCK IN", {
      left: frontLeft, top: H - FLAP_H / 2 - 8, width: FACE_W, fontSize: 9,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      textAlign: "center", opacity: 0.5,
    }),
    // Fold lines (vertical)
    line("pkg-fold-1", SIDE_W, 0, SIDE_W, H, {
      left: SIDE_W, top: 0, stroke: "#3b82f6", strokeWidth: 1,
      strokeDashArray: [8, 4], opacity: 0.4,
    }),
    line("pkg-fold-2", SIDE_W + FACE_W, 0, SIDE_W + FACE_W, H, {
      left: SIDE_W + FACE_W, top: 0, stroke: "#3b82f6", strokeWidth: 1,
      strokeDashArray: [8, 4], opacity: 0.4,
    }),
    line("pkg-fold-3", SIDE_W + FACE_W * 2, 0, SIDE_W + FACE_W * 2, H, {
      left: SIDE_W + FACE_W * 2, top: 0, stroke: "#3b82f6", strokeWidth: 1,
      strokeDashArray: [8, 4], opacity: 0.4,
    }),
    // Fold lines (horizontal)
    line("pkg-fold-h1", 0, FLAP_H, W, FLAP_H, {
      left: 0, top: FLAP_H, stroke: "#3b82f6", strokeWidth: 1,
      strokeDashArray: [8, 4], opacity: 0.4,
    }),
    line("pkg-fold-h2", 0, H - FLAP_H, W, H - FLAP_H, {
      left: 0, top: H - FLAP_H, stroke: "#3b82f6", strokeWidth: 1,
      strokeDashArray: [8, 4], opacity: 0.4,
    }),
    // FRONT PANEL content
    txt("pkg-brand-name", "DMSUITE FOODS", {
      left: frontLeft + 20, top: bodyTop + 30, width: FACE_W - 40, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center", charSpacing: 300,
    }),
    txt("pkg-product-name", "Zambian\nGold", {
      left: frontLeft + 20, top: bodyTop + 100, width: FACE_W - 40, fontSize: 36,
      fontFamily: headingFont, fontWeight: "800", fill: "#ffffff",
      textAlign: "center", lineHeight: 1.15,
    }),
    txt("pkg-tagline", "Naturally Delicious", {
      left: frontLeft + 20, top: bodyTop + 220, width: FACE_W - 40, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "400", fill: "#ffffffcc",
      textAlign: "center", fontStyle: "italic",
    }),
    // Weight badge
    rect("pkg-weight-badge-bg", {
      left: frontLeft + FACE_W / 2 - 30, top: bodyTop + bodyH - 80, width: 60, height: 60,
      fill: "#ffffff", rx: 30, ry: 30, opacity: 0.2,
    }),
    txt("pkg-weight", "500g", {
      left: frontLeft + 20, top: bodyTop + bodyH - 65, width: FACE_W - 40, fontSize: 16,
      fontFamily: headingFont, fontWeight: "700", fill: "#ffffff",
      textAlign: "center",
    }),
    // BACK PANEL content
    txt("pkg-back-title", "Ingredients", {
      left: backLeft + 20, top: bodyTop + 30, width: FACE_W - 40, fontSize: 14,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    txt("pkg-ingredients", "Maize, Sugar, Salt, Natural Flavours", {
      left: backLeft + 20, top: bodyTop + 55, width: FACE_W - 40, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      lineHeight: 1.6,
    }),
    // Barcode zone
    rect("pkg-barcode-zone", {
      left: backLeft + 20, top: bodyTop + bodyH - 80, width: 140, height: 50,
      fill: "#ffffff", stroke: "#e5e7eb", strokeWidth: 1,
    }),
    txt("pkg-barcode", "6009876543210", {
      left: backLeft + 20, top: bodyTop + bodyH - 40, width: 140, fontSize: 9,
      fontFamily: "monospace", fontWeight: "400", fill: "#1e293b",
      textAlign: "center",
    }),
    // Made in label
    txt("pkg-made-in", "Made in Zambia 🇿🇲", {
      left: backLeft + 20, top: bodyTop + bodyH - 20, width: FACE_W - 40, fontSize: 9,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      opacity: 0.6,
    }),
  ];

  return buildJson("#f8fafc", objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const PACKAGING_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "packaging-luxury-gold",
    name: "Luxury Gold",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#0a0a0a",
      primary: "#c09c2c",
      secondary: "#1a1a1a",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-organic-green",
    name: "Organic Green",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#f0fdf4",
      primary: "#16a34a",
      secondary: "#86efac",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-tech-blue",
    name: "Tech Blue",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#0f172a",
      primary: "#3b82f6",
      secondary: "#1e293b",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-food-red",
    name: "Food Red",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#ffffff",
      primary: "#dc2626",
      secondary: "#fbbf24",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-beverage-cyan",
    name: "Beverage Cyan",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#ecfeff",
      primary: "#0891b2",
      secondary: "#06b6d4",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-cosmetics-purple",
    name: "Cosmetics Purple",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPackaging({
      bg: "#faf5ff",
      primary: "#a855f7",
      secondary: "#e9d5ff",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-teal-modern",
    name: "Teal Modern",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#ffffff",
      primary: "#0f766e",
      secondary: "#2dd4bf",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-dark-lime",
    name: "Dark Lime",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#111827",
      primary: "#84cc16",
      secondary: "#1e293b",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-orange-warm",
    name: "Orange Warm",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildPackaging({
      bg: "#ffffff",
      primary: "#ea580c",
      secondary: "#fdba74",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "packaging-indigo-elegant",
    name: "Indigo Elegant",
    category: "packaging-design",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildPackaging({
      bg: "#ffffff",
      primary: "#4f46e5",
      secondary: "#c7d2fe",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
