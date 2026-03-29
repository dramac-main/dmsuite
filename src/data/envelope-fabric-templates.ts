/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Envelope Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Envelope Designer.
 *  Default canvas: 624 × 312 px (DL envelope 220×110mm).
 *
 *  Named objects for quick-edit targeting:
 *    env-company-name, env-return-address, env-recipient-name,
 *    env-recipient-address, env-stamp-zone
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 624;
const H = 312;

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

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildEnvelope(opts: {
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
    // Company name (top-left)
    txt("env-company-name", "DMSuite Solutions", {
      left: 25, top: 20, width: 200, fontSize: 12,
      fontFamily: headingFont, fontWeight: "700", fill: accent,
    }),
    // Return address (below company)
    txt("env-return-address", "Plot 1234, Cairo Road\nLusaka, Zambia", {
      left: 25, top: 40, width: 220, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      lineHeight: 1.5,
    }),
    // Stamp zone (top-right)
    rect("env-stamp-zone", {
      left: W - 80, top: 15, width: 60, height: 50,
      fill: "transparent", stroke: "#cbd5e1", strokeWidth: 1.5,
      strokeDashArray: [4, 3], rx: 2, ry: 2,
    }),
    txt("env-stamp-label", "STAMP", {
      left: W - 80, top: 32, width: 60, fontSize: 8,
      fontFamily: bodyFont, fontWeight: "500", fill: "#94a3b8",
      textAlign: "center",
    }),
    // Recipient name (center-right)
    txt("env-recipient-name", "John Doe", {
      left: W * 0.4, top: H * 0.45, width: 250, fontSize: 16,
      fontFamily: headingFont, fontWeight: "600", fill: textColor,
    }),
    // Recipient address
    txt("env-recipient-address", "123 Main Street\nKitwe, Zambia", {
      left: W * 0.4, top: H * 0.45 + 28, width: 250, fontSize: 12,
      fontFamily: bodyFont, fontWeight: "400", fill: subColor,
      lineHeight: 1.5,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const ENVELOPE_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "envelope-minimal",
    name: "Minimal Clean",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#1e293b",
      textColor: "#1e293b",
      subColor: "#64748b",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "envelope-corporate-blue",
    name: "Corporate Blue",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#1e40af",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-top-bar", { left: 0, top: 0, width: W, height: 4, fill: "#1e40af" }),
        rect("env-bottom-bar", { left: 0, top: H - 4, width: W, height: 4, fill: "#1e40af" }),
      ],
    }),
  },
  {
    id: "envelope-elegant-border",
    name: "Elegant Border",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#4f46e5",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-border", {
          left: 15, top: 15, width: W - 30, height: H - 30,
          fill: "transparent", stroke: "#4f46e540", strokeWidth: 1.5,
        }),
      ],
    }),
  },
  {
    id: "envelope-modern-left",
    name: "Modern Left",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#0f766e",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-left-bar", { left: 0, top: 0, width: 4, height: H, fill: "#0f766e" }),
      ],
    }),
  },
  {
    id: "envelope-bold-bars",
    name: "Bold Bars",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#dc2626",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-top-bar", { left: 0, top: 0, width: W, height: 4, fill: "#dc2626" }),
        rect("env-bottom-bar", { left: 0, top: H - 4, width: W, height: 4, fill: "#dc2626" }),
      ],
    }),
  },
  {
    id: "envelope-creative-tint",
    name: "Creative Tint",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#f0f9ff",
      accent: "#0284c7",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "envelope-purple-stripe",
    name: "Purple Stripe",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#7c3aed",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-left-bar", { left: 0, top: 0, width: 4, height: H, fill: "#7c3aed" }),
      ],
    }),
  },
  {
    id: "envelope-emerald-fresh",
    name: "Emerald Fresh",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#059669",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-top-bar", { left: 0, top: 0, width: W, height: 4, fill: "#059669" }),
      ],
    }),
  },
  {
    id: "envelope-dark-gold",
    name: "Dark Gold",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildEnvelope({
      bg: "#0f172a",
      accent: "#c09c2c",
      textColor: "#e2e8f0",
      subColor: "#94a3b8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "envelope-orange-warm",
    name: "Orange Warm",
    category: "envelope",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildEnvelope({
      bg: "#ffffff",
      accent: "#ea580c",
      textColor: "#1e293b",
      subColor: "#475569",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("env-border", {
          left: 15, top: 15, width: W - 30, height: H - 30,
          fill: "transparent", stroke: "#ea580c40", strokeWidth: 1.5,
        }),
      ],
    }),
  },
];
