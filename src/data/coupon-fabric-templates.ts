/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Coupon & Gift Voucher Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Coupon Designer.
 *  Default canvas: 900 × 400 px (standard coupon landscape).
 *
 *  Named objects for quick-edit targeting:
 *    cpn-business-name, cpn-headline, cpn-discount-value, cpn-discount-label,
 *    cpn-description, cpn-coupon-code, cpn-expiry-date, cpn-terms
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 900;
const H = 400;

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

const TEAR_X = Math.round(W * 0.68); // 612px

function buildCoupon(opts: {
  leftBg: string;
  rightBg: string;
  accent: string;
  textColor: string;
  subColor: string;
  headingFont: string;
  bodyFont: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { leftBg, rightBg, accent, textColor, subColor, headingFont, bodyFont, extraObjects = [] } = opts;

  const objects: Record<string, unknown>[] = [
    // Left panel
    rect("cpn-left-panel", {
      left: 0, top: 0, width: TEAR_X, height: H,
      fill: leftBg,
    }),
    // Right panel
    rect("cpn-right-panel", {
      left: TEAR_X, top: 0, width: W - TEAR_X, height: H,
      fill: rightBg,
    }),
    // Tear line
    line("cpn-tear-line", TEAR_X, 0, TEAR_X, H, {
      left: TEAR_X, top: 0, stroke: "#94a3b8", strokeWidth: 1.5,
      strokeDashArray: [8, 6], opacity: 0.5,
    }),
    // Scissors icon
    txt("cpn-scissors", "✂", {
      left: TEAR_X - 10, top: H / 2 - 10, width: 20, fontSize: 16,
      fontFamily: bodyFont, fill: "#94a3b8", textAlign: "center",
    }),
    // Business name
    txt("cpn-business-name", "DMSuite Store", {
      left: 30, top: 25, width: 300, fontSize: 16,
      fontFamily: headingFont, fontWeight: "700", fill: textColor,
    }),
    // Headline
    txt("cpn-headline", "SPECIAL OFFER", {
      left: 30, top: 65, width: 400, fontSize: 18,
      fontFamily: headingFont, fontWeight: "600", fill: textColor,
      charSpacing: 200,
    }),
    // Discount value
    txt("cpn-discount-value", "25%", {
      left: 30, top: 110, width: 250, fontSize: 72,
      fontFamily: headingFont, fontWeight: "800", fill: textColor,
    }),
    // Discount label
    txt("cpn-discount-label", "OFF", {
      left: 220, top: 135, width: 120, fontSize: 32,
      fontFamily: headingFont, fontWeight: "700", fill: accent,
    }),
    // Description
    txt("cpn-description", "On all products in-store and online", {
      left: 30, top: 210, width: TEAR_X - 60, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      lineHeight: 1.5,
    }),
    // Expiry date
    txt("cpn-expiry-date", "Valid until: 30 April 2026", {
      left: 30, top: 280, width: 300, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "500", fill: subColor,
      opacity: 0.8,
    }),
    // Terms
    txt("cpn-terms", "Cannot be combined with other offers. One per customer.", {
      left: 30, top: H - 40, width: TEAR_X - 60, fontSize: 9,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      opacity: 0.5, lineHeight: 1.4,
    }),
    // Right side — CODE label
    txt("cpn-code-label", "YOUR CODE", {
      left: TEAR_X + 20, top: 50, width: W - TEAR_X - 40, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "700", fill: "#1e293b",
      textAlign: "center", charSpacing: 200,
    }),
    // Code box
    rect("cpn-code-box", {
      left: TEAR_X + 30, top: 80, width: W - TEAR_X - 60, height: 44,
      fill: "transparent", stroke: accent, strokeWidth: 2,
      strokeDashArray: [6, 4], rx: 4, ry: 4,
    }),
    // Coupon code
    txt("cpn-coupon-code", "DMS-A7K3X2", {
      left: TEAR_X + 30, top: 90, width: W - TEAR_X - 60, fontSize: 20,
      fontFamily: "monospace", fontWeight: "700", fill: accent,
      textAlign: "center",
    }),
    // QR placeholder
    rect("cpn-qr-zone", {
      left: TEAR_X + 70, top: 160, width: 100, height: 100,
      fill: "#e5e7eb", stroke: "#d1d5db", strokeWidth: 1, rx: 4, ry: 4,
    }),
    txt("cpn-qr-text", "QR", {
      left: TEAR_X + 70, top: 195, width: 100, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: "#9ca3af",
      textAlign: "center",
    }),
    // Scan instruction
    txt("cpn-scan-text", "Scan to redeem", {
      left: TEAR_X + 20, top: 275, width: W - TEAR_X - 40, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: "#64748b",
      textAlign: "center",
    }),
    ...extraObjects,
  ];

  return buildJson("#ffffff", objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const COUPON_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "coupon-modern-blue",
    name: "Modern Blue",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#1e40af",
      rightBg: "#f1f5f9",
      accent: "#1e40af",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-classic-cream",
    name: "Classic Cream",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#fefce8",
      rightBg: "#f1f5f9",
      accent: "#1e40af",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-bold-gradient",
    name: "Bold Dark",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#111827",
      rightBg: "#f1f5f9",
      accent: "#fbbf24",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-elegant-indigo",
    name: "Elegant Indigo",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#1e1b4b",
      rightBg: "#f1f5f9",
      accent: "#fbbf24",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-festive-red",
    name: "Festive Red",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#dc2626",
      rightBg: "#f1f5f9",
      accent: "#dc2626",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-minimal-light",
    name: "Minimal Light",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#f8fafc",
      rightBg: "#f1f5f9",
      accent: "#1e293b",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-teal-fresh",
    name: "Teal Fresh",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCoupon({
      leftBg: "#0f766e",
      rightBg: "#f1f5f9",
      accent: "#0f766e",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-orange-warm",
    name: "Orange Warm",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#ea580c",
      rightBg: "#f1f5f9",
      accent: "#ea580c",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-purple-luxe",
    name: "Purple Luxe",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCoupon({
      leftBg: "#7c3aed",
      rightBg: "#f1f5f9",
      accent: "#7c3aed",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "coupon-emerald-clean",
    name: "Emerald Clean",
    category: "gift-voucher",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCoupon({
      leftBg: "#059669",
      rightBg: "#f1f5f9",
      accent: "#059669",
      textColor: "#ffffff",
      subColor: "#ffffffcc",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
