/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Certificate Fabric.js Templates
 *
 *  8 fully-editable Fabric.js JSON templates for the Certificate Designer.
 *  A4 Landscape at 300 DPI: 3508 × 2480 px.
 *
 *  Named objects for quick-edit targeting:
 *    cert-title, cert-subtitle, cert-recipient, cert-description,
 *    cert-org, cert-date, cert-ref, cert-signatory-0-name,
 *    cert-signatory-0-title, cert-sig-line-0, cert-seal-text
 *
 *  Template metadata (colors, fonts, SVG border path) is kept in the
 *  existing certificate-templates.ts registry — these Fabric templates
 *  are the visual representations.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";
import { CERTIFICATE_TEMPLATES as CERT_META } from "./certificate-templates";

// ── Canvas dimensions (A4 landscape @ 300 DPI) ─────────────────────────────
const W = 3508;
const H = 2480;
const MARGIN = 200;

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

function buildJson(
  bg: string,
  objects: Record<string, unknown>[],
): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Shared signatory block builder ──────────────────────────────────────────
function makeSignatoryBlock(
  index: number,
  xCenter: number,
  yBase: number,
  lineWidth: number,
  nameFont: string,
  nameColor: string,
  lineColor: string,
): Record<string, unknown>[] {
  return [
    line(`cert-sig-line-${index}`, xCenter - lineWidth / 2, yBase, xCenter + lineWidth / 2, yBase, {
      stroke: lineColor, strokeWidth: 3,
      left: xCenter - lineWidth / 2, top: yBase,
    }),
    txt(`cert-signatory-${index}-name`, "Signatory Name", {
      left: xCenter - lineWidth / 2, top: yBase + 15, width: lineWidth,
      fontSize: 48, fontFamily: nameFont, fontWeight: 600,
      fill: nameColor, textAlign: "center",
    }),
    txt(`cert-signatory-${index}-title`, "Position / Title", {
      left: xCenter - lineWidth / 2, top: yBase + 75, width: lineWidth,
      fontSize: 36, fontFamily: nameFont, fontWeight: 400,
      fill: nameColor, textAlign: "center", opacity: 0.7,
    }),
  ];
}

// ── Seal builder ────────────────────────────────────────────────────────────
function makeSeal(
  xCenter: number,
  yCenter: number,
  radius: number,
  outerColor: string,
  innerColor: string,
  textColor: string,
): Record<string, unknown>[] {
  return [
    circle("cert-seal-outer", {
      left: xCenter - radius, top: yCenter - radius, radius,
      fill: outerColor, stroke: "", strokeWidth: 0,
    }),
    circle("cert-seal-inner", {
      left: xCenter - radius + 25, top: yCenter - radius + 25, radius: radius - 25,
      fill: innerColor, stroke: outerColor, strokeWidth: 4,
    }),
    txt("cert-seal-text", "CERTIFIED", {
      left: xCenter - radius + 30, top: yCenter - 30, width: (radius - 30) * 2,
      fontSize: 36, fontFamily: "Inter", fontWeight: 700,
      fill: textColor, textAlign: "center", charSpacing: 200,
    }),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// Build certificate body (shared structure across all templates)
// ═══════════════════════════════════════════════════════════════════════════
function buildCertBody(opts: {
  bg: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  accentColor: string;
  headingFont: string;
  bodyFont: string;
  accentFont: string;
  sealX: number;
  sealY: number;
  sealOuter: string;
  sealInner: string;
  sealTextColor: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const cx = W / 2;

  const objects: Record<string, unknown>[] = [
    // Extra objects (decorative elements) first — they go behind text
    ...(opts.extraObjects ?? []),

    // Organization name
    txt("cert-org", "Organization Name", {
      left: MARGIN, top: 350, width: W - MARGIN * 2,
      fontSize: 48, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.primaryColor, textAlign: "center", charSpacing: 150,
    }),

    // Certificate title
    txt("cert-title", "CERTIFICATE OF ACHIEVEMENT", {
      left: MARGIN, top: 500, width: W - MARGIN * 2,
      fontSize: 140, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.primaryColor, textAlign: "center",
    }),

    // Decorative divider
    line("cert-divider", cx - 400, 720, cx + 400, 720, {
      stroke: opts.secondaryColor, strokeWidth: 3,
      left: cx - 400, top: 720,
    }),

    // Subtitle
    txt("cert-subtitle", "This certificate is proudly presented to", {
      left: MARGIN, top: 780, width: W - MARGIN * 2,
      fontSize: 48, fontFamily: opts.bodyFont, fontWeight: 300,
      fill: opts.textColor, textAlign: "center", fontStyle: "italic",
      opacity: 0.8,
    }),

    // Recipient name (large, accent font)
    txt("cert-recipient", "Recipient Name", {
      left: MARGIN, top: 880, width: W - MARGIN * 2,
      fontSize: 120, fontFamily: opts.accentFont, fontWeight: 400,
      fill: opts.primaryColor, textAlign: "center",
    }),

    // Recipient underline
    line("cert-recipient-line", cx - 600, 1030, cx + 600, 1030, {
      stroke: opts.secondaryColor, strokeWidth: 2,
      left: cx - 600, top: 1030,
    }),

    // Description
    txt("cert-description", "For outstanding performance and dedication in completing the program requirements with distinction and excellence.", {
      left: MARGIN + 200, top: 1080, width: W - MARGIN * 2 - 400,
      fontSize: 44, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "center", lineHeight: 1.5,
    }),

    // Date
    txt("cert-date", "Date: January 1, 2026", {
      left: MARGIN + 200, top: 1350, width: 800,
      fontSize: 36, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "left",
    }),

    // Reference number
    txt("cert-ref", "Ref: CERT-2026-001", {
      left: W - MARGIN - 1000, top: 1350, width: 800,
      fontSize: 36, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "right",
      opacity: 0.6,
    }),

    // Signatory blocks (3 spread across bottom)
    ...makeSignatoryBlock(0, cx - 1000, 1800, 650, opts.bodyFont, opts.textColor, opts.secondaryColor),
    ...makeSignatoryBlock(1, cx, 1800, 650, opts.bodyFont, opts.textColor, opts.secondaryColor),
    ...makeSignatoryBlock(2, cx + 1000, 1800, 650, opts.bodyFont, opts.textColor, opts.secondaryColor),

    // Seal
    ...makeSeal(opts.sealX, opts.sealY, 140, opts.sealOuter, opts.sealInner, opts.sealTextColor),
  ];

  return buildJson(opts.bg, objects);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Classic Gold
// ═══════════════════════════════════════════════════════════════════════════
const classicGold = buildCertBody({
  bg: "#faf6e8",
  primaryColor: "#b8860b",
  secondaryColor: "#d4af37",
  textColor: "#2c1810",
  accentColor: "#8b6914",
  headingFont: "Playfair Display",
  bodyFont: "Lato",
  accentFont: "Great Vibes",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#d4a843", sealInner: "#b8860b", sealTextColor: "#ffffff",
  extraObjects: [
    // Double border frame
    rect("border-outer", {
      left: 60, top: 60, width: W - 120, height: H - 120,
      fill: "transparent", stroke: "#d4af37", strokeWidth: 8, rx: 0, ry: 0,
    }),
    rect("border-inner", {
      left: 90, top: 90, width: W - 180, height: H - 180,
      fill: "transparent", stroke: "#b8860b", strokeWidth: 3, rx: 0, ry: 0,
    }),
    // Corner ornaments (gold squares)
    rect("corner-tl", { left: 50, top: 50, width: 40, height: 40, fill: "#d4af37", stroke: "", strokeWidth: 0 }),
    rect("corner-tr", { left: W - 90, top: 50, width: 40, height: 40, fill: "#d4af37", stroke: "", strokeWidth: 0 }),
    rect("corner-bl", { left: 50, top: H - 90, width: 40, height: 40, fill: "#d4af37", stroke: "", strokeWidth: 0 }),
    rect("corner-br", { left: W - 90, top: H - 90, width: 40, height: 40, fill: "#d4af37", stroke: "", strokeWidth: 0 }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Classic Blue
// ═══════════════════════════════════════════════════════════════════════════
const classicBlue = buildCertBody({
  bg: "#f0f4f8",
  primaryColor: "#35517D",
  secondaryColor: "#4a6fa5",
  textColor: "#1a2744",
  accentColor: "#8faabe",
  headingFont: "Playfair Display",
  bodyFont: "Lato",
  accentFont: "Dancing Script",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#4a6fa5", sealInner: "#35517D", sealTextColor: "#ffffff",
  extraObjects: [
    rect("border-outer", {
      left: 60, top: 60, width: W - 120, height: H - 120,
      fill: "transparent", stroke: "#4a6fa5", strokeWidth: 8,
    }),
    rect("border-inner", {
      left: 90, top: 90, width: W - 180, height: H - 180,
      fill: "transparent", stroke: "#35517D", strokeWidth: 3,
    }),
    // Top accent bar
    rect("accent-bar-top", { left: 60, top: 60, width: W - 120, height: 20, fill: "#35517D", stroke: "", strokeWidth: 0 }),
    rect("accent-bar-bottom", { left: 60, top: H - 80, width: W - 120, height: 20, fill: "#35517D", stroke: "", strokeWidth: 0 }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Burgundy Ornate
// ═══════════════════════════════════════════════════════════════════════════
const burgundyOrnate = buildCertBody({
  bg: "#f9f3f0",
  primaryColor: "#4C0C1E",
  secondaryColor: "#7a1f3a",
  textColor: "#2a0a14",
  accentColor: "#c4a35a",
  headingFont: "Crimson Text",
  bodyFont: "Source Sans 3",
  accentFont: "Parisienne",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#c4a35a", sealInner: "#8b6914", sealTextColor: "#ffffff",
  extraObjects: [
    rect("border-outer", {
      left: 50, top: 50, width: W - 100, height: H - 100,
      fill: "transparent", stroke: "#c4a35a", strokeWidth: 10,
    }),
    rect("border-mid", {
      left: 75, top: 75, width: W - 150, height: H - 150,
      fill: "transparent", stroke: "#7a1f3a", strokeWidth: 4,
    }),
    rect("border-inner", {
      left: 95, top: 95, width: W - 190, height: H - 190,
      fill: "transparent", stroke: "#c4a35a", strokeWidth: 2,
    }),
    // Ornamental corner diamonds
    rect("orn-tl", { left: 45, top: 45, width: 60, height: 60, fill: "#c4a35a", stroke: "", strokeWidth: 0, angle: 45 }),
    rect("orn-tr", { left: W - 105, top: 45, width: 60, height: 60, fill: "#c4a35a", stroke: "", strokeWidth: 0, angle: 45 }),
    rect("orn-bl", { left: 45, top: H - 105, width: 60, height: 60, fill: "#c4a35a", stroke: "", strokeWidth: 0, angle: 45 }),
    rect("orn-br", { left: W - 105, top: H - 105, width: 60, height: 60, fill: "#c4a35a", stroke: "", strokeWidth: 0, angle: 45 }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Teal Modern
// ═══════════════════════════════════════════════════════════════════════════
const tealModern = buildCertBody({
  bg: "#f0fafa",
  primaryColor: "#1a7f8f",
  secondaryColor: "#20b2aa",
  textColor: "#1a1a2a",
  accentColor: "#14b8a6",
  headingFont: "Poppins",
  bodyFont: "Inter",
  accentFont: "Caveat",
  sealX: W / 2, sealY: H - 450,
  sealOuter: "#20b2aa", sealInner: "#1a7f8f", sealTextColor: "#ffffff",
  extraObjects: [
    // Simple geometric border
    rect("border-main", {
      left: 80, top: 80, width: W - 160, height: H - 160,
      fill: "transparent", stroke: "#20b2aa", strokeWidth: 4, rx: 20, ry: 20,
    }),
    // Top teal accent band
    rect("accent-band", {
      left: 0, top: 0, width: W, height: 30,
      fill: "#1a7f8f", stroke: "", strokeWidth: 0,
    }),
    // Bottom teal accent band
    rect("accent-band-bottom", {
      left: 0, top: H - 30, width: W, height: 30,
      fill: "#1a7f8f", stroke: "", strokeWidth: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Silver Minimal
// ═══════════════════════════════════════════════════════════════════════════
const silverMinimal = buildCertBody({
  bg: "#ffffff",
  primaryColor: "#4a4a4a",
  secondaryColor: "#c0c0c0",
  textColor: "#1a1a1a",
  accentColor: "#808080",
  headingFont: "Cormorant Garamond",
  bodyFont: "Montserrat",
  accentFont: "Satisfy",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#c0c0c0", sealInner: "#808080", sealTextColor: "#ffffff",
  extraObjects: [
    // Double-line border
    rect("border-outer", {
      left: 70, top: 70, width: W - 140, height: H - 140,
      fill: "transparent", stroke: "#c0c0c0", strokeWidth: 3,
    }),
    rect("border-inner", {
      left: 85, top: 85, width: W - 170, height: H - 170,
      fill: "transparent", stroke: "#c0c0c0", strokeWidth: 1,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Antique Parchment
// ═══════════════════════════════════════════════════════════════════════════
const antiqueParchment = buildCertBody({
  bg: "#f5eed7",
  primaryColor: "#3F3F41",
  secondaryColor: "#8b7355",
  textColor: "#2c2418",
  accentColor: "#a08c5a",
  headingFont: "Cormorant Garamond",
  bodyFont: "Montserrat",
  accentFont: "Pinyon Script",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#8b7355", sealInner: "#6b5435", sealTextColor: "#f5eed7",
  extraObjects: [
    // Ornate triple borders
    rect("border-outer", {
      left: 50, top: 50, width: W - 100, height: H - 100,
      fill: "transparent", stroke: "#a08c5a", strokeWidth: 6,
    }),
    rect("border-mid", {
      left: 70, top: 70, width: W - 140, height: H - 140,
      fill: "transparent", stroke: "#8b7355", strokeWidth: 2,
    }),
    rect("border-inner", {
      left: 90, top: 90, width: W - 180, height: H - 180,
      fill: "transparent", stroke: "#a08c5a", strokeWidth: 6,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Botanical Modern
// ═══════════════════════════════════════════════════════════════════════════
const botanicalModern = buildCertBody({
  bg: "#f8faf5",
  primaryColor: "#1B2650",
  secondaryColor: "#6b8e5b",
  textColor: "#1a2040",
  accentColor: "#8cb07a",
  headingFont: "Cormorant Garamond",
  bodyFont: "Montserrat",
  accentFont: "Sacramento",
  sealX: W / 2, sealY: H - 450,
  sealOuter: "#6b8e5b", sealInner: "#4a6b3b", sealTextColor: "#ffffff",
  extraObjects: [
    // Corner botanical accent circles
    circle("corner-tl-leaf", {
      left: -40, top: -40, radius: 200,
      fill: "#8cb07a", stroke: "", strokeWidth: 0, opacity: 0.15,
    }),
    circle("corner-tr-leaf", {
      left: W - 360, top: -40, radius: 200,
      fill: "#8cb07a", stroke: "", strokeWidth: 0, opacity: 0.15,
    }),
    circle("corner-bl-leaf", {
      left: -40, top: H - 360, radius: 200,
      fill: "#6b8e5b", stroke: "", strokeWidth: 0, opacity: 0.12,
    }),
    circle("corner-br-leaf", {
      left: W - 360, top: H - 360, radius: 200,
      fill: "#6b8e5b", stroke: "", strokeWidth: 0, opacity: 0.12,
    }),
    // Simple border
    rect("border-main", {
      left: 100, top: 100, width: W - 200, height: H - 200,
      fill: "transparent", stroke: "#6b8e5b", strokeWidth: 2,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Dark Prestige
// ═══════════════════════════════════════════════════════════════════════════
const darkPrestige = buildCertBody({
  bg: "#1a1a2e",
  primaryColor: "#d4af37",
  secondaryColor: "#f0d060",
  textColor: "#e8e0d0",
  accentColor: "#b8860b",
  headingFont: "Playfair Display",
  bodyFont: "Inter",
  accentFont: "Alex Brush",
  sealX: W - MARGIN - 300, sealY: H - 500,
  sealOuter: "#d4af37", sealInner: "#b8860b", sealTextColor: "#1a1a2e",
  extraObjects: [
    // Gold borders on dark background
    rect("border-outer", {
      left: 60, top: 60, width: W - 120, height: H - 120,
      fill: "transparent", stroke: "#d4af37", strokeWidth: 6,
    }),
    rect("border-inner", {
      left: 85, top: 85, width: W - 170, height: H - 170,
      fill: "transparent", stroke: "#d4af37", strokeWidth: 2, opacity: 0.5,
    }),
    // Gold top/bottom accent lines
    line("gold-line-top", 120, 120, W - 120, 120, {
      stroke: "#f0d060", strokeWidth: 1, left: 120, top: 120, opacity: 0.4,
    }),
    line("gold-line-bottom", 120, H - 120, W - 120, H - 120, {
      stroke: "#f0d060", strokeWidth: 1, left: 120, top: H - 120, opacity: 0.4,
    }),
  ],
});

// ── Export all templates ────────────────────────────────────────────────────

export const CERTIFICATE_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "cert-classic-gold",
    name: "Classic Gold",
    category: "Formal",
    thumbnailUrl: CERT_META[0]?.thumbnail ?? "",
    width: W,
    height: H,
    json: classicGold,
  },
  {
    id: "cert-classic-blue",
    name: "Classic Blue",
    category: "Formal",
    thumbnailUrl: CERT_META[1]?.thumbnail ?? "",
    width: W,
    height: H,
    json: classicBlue,
  },
  {
    id: "cert-burgundy-ornate",
    name: "Burgundy Ornate",
    category: "Formal",
    thumbnailUrl: CERT_META[2]?.thumbnail ?? "",
    width: W,
    height: H,
    json: burgundyOrnate,
  },
  {
    id: "cert-teal-modern",
    name: "Teal Modern",
    category: "Modern",
    thumbnailUrl: CERT_META[3]?.thumbnail ?? "",
    width: W,
    height: H,
    json: tealModern,
  },
  {
    id: "cert-silver-minimal",
    name: "Silver Minimal",
    category: "Minimal",
    thumbnailUrl: CERT_META[4]?.thumbnail ?? "",
    width: W,
    height: H,
    json: silverMinimal,
  },
  {
    id: "cert-antique-parchment",
    name: "Antique Parchment",
    category: "Formal",
    thumbnailUrl: CERT_META[5]?.thumbnail ?? "",
    width: W,
    height: H,
    json: antiqueParchment,
  },
  {
    id: "cert-botanical-modern",
    name: "Botanical Modern",
    category: "Artistic",
    thumbnailUrl: CERT_META[6]?.thumbnail ?? "",
    width: W,
    height: H,
    json: botanicalModern,
  },
  {
    id: "cert-dark-prestige",
    name: "Dark Prestige",
    category: "Modern",
    thumbnailUrl: CERT_META[7]?.thumbnail ?? "",
    width: W,
    height: H,
    json: darkPrestige,
    isPro: true,
  },
];
