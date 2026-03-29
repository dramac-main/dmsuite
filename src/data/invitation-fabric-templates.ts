/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Invitation Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Invitation Designer.
 *  Default canvas: A5 portrait 420 × 595 px.
 *
 *  Named objects for quick-edit targeting:
 *    inv-host-names, inv-event-title, inv-event-subtitle, inv-date,
 *    inv-time, inv-venue, inv-venue-address, inv-city, inv-dress-code,
 *    inv-additional-info, inv-rsvp-phone, inv-rsvp-email, inv-rsvp-deadline
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 420;
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

function buildInvitation(opts: {
  bg: string;
  primary: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, primary, accent, textColor, headingFont, bodyFont, extraObjects = [] } = opts;
  const m = 32; // margin
  const cw = W - m * 2;

  const objects: Record<string, unknown>[] = [
    // Border frame
    rect("inv-border", {
      left: m - 4, top: m - 4, width: cw + 8, height: H - m * 2 + 8,
      fill: "transparent", stroke: primary, strokeWidth: 1.5,
      selectable: false,
    }),
    // Inner border
    rect("inv-inner-border", {
      left: m + 4, top: m + 4, width: cw - 8, height: H - m * 2 - 8,
      fill: "transparent", stroke: primary, strokeWidth: 0.5,
      selectable: false, opacity: 0.4,
    }),
    // Host names
    txt("inv-host-names", "Mr. & Mrs. Joseph Mwansa", {
      left: m + 12, top: m + 30, width: cw - 24, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.7,
    }),
    // "request the honour of your presence"
    txt("inv-preamble", "request the honour of your presence at", {
      left: m + 12, top: m + 58, width: cw - 24, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", fontStyle: "italic", opacity: 0.5,
    }),
    // Top divider
    line("inv-top-divider", W / 2 - 40, 0, W / 2 + 40, 0, {
      left: W / 2 - 40, top: m + 82, stroke: accent, strokeWidth: 1, opacity: 0.4,
    }),
    // Event title
    txt("inv-event-title", "The Wedding\nCelebration", {
      left: m + 12, top: m + 100, width: cw - 24, fontSize: 32,
      fontFamily: headingFont, fontWeight: "700", fill: primary,
      textAlign: "center", lineHeight: 1.15,
    }),
    // Event subtitle
    txt("inv-event-subtitle", "of their daughter", {
      left: m + 12, top: m + 185, width: cw - 24, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", fontStyle: "italic", opacity: 0.6,
    }),
    // Mid divider
    line("inv-mid-divider", W / 2 - 30, 0, W / 2 + 30, 0, {
      left: W / 2 - 30, top: m + 215, stroke: accent, strokeWidth: 1, opacity: 0.3,
    }),
    // Date
    txt("inv-date", "Saturday, 21 March 2026", {
      left: m + 12, top: m + 235, width: cw - 24, fontSize: 16,
      fontFamily: bodyFont, fontWeight: "600", fill: primary,
      textAlign: "center",
    }),
    // Time
    txt("inv-time", "at 14:00", {
      left: m + 12, top: m + 262, width: cw - 24, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center",
    }),
    // Venue
    txt("inv-venue", "Cathedral of the Holy Cross", {
      left: m + 12, top: m + 295, width: cw - 24, fontSize: 14,
      fontFamily: headingFont, fontWeight: "600", fill: textColor,
      textAlign: "center",
    }),
    // Venue address
    txt("inv-venue-address", "Freedom Way", {
      left: m + 12, top: m + 318, width: cw - 24, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.6,
    }),
    // City
    txt("inv-city", "Lusaka, Zambia", {
      left: m + 12, top: m + 338, width: cw - 24, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.6,
    }),
    // Dress code
    txt("inv-dress-code", "Dress Code: Formal / Traditional", {
      left: m + 12, top: m + 370, width: cw - 24, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "500", fill: accent,
      textAlign: "center",
    }),
    // Additional info
    txt("inv-additional-info", "Reception to follow at Mulungushi International Conference Centre", {
      left: m + 12, top: m + 400, width: cw - 24, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.55, lineHeight: 1.4,
    }),
    // RSVP divider
    line("inv-rsvp-divider", W / 2 - 50, 0, W / 2 + 50, 0, {
      left: W / 2 - 50, top: m + 445, stroke: accent, strokeWidth: 0.5, opacity: 0.4,
    }),
    // RSVP label
    txt("inv-rsvp-label", "RSVP", {
      left: m + 12, top: m + 458, width: cw - 24, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "700", fill: primary,
      textAlign: "center", charSpacing: 300,
    }),
    // RSVP phone
    txt("inv-rsvp-phone", "+260 97 1234567", {
      left: m + 12, top: m + 478, width: cw - 24, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.6,
    }),
    // RSVP email
    txt("inv-rsvp-email", "rsvp@mwansawedding.com", {
      left: m + 12, top: m + 495, width: cw - 24, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.6,
    }),
    // RSVP deadline
    txt("inv-rsvp-deadline", "Kindly respond by 1 March 2026", {
      left: m + 12, top: m + 515, width: cw - 24, fontSize: 9,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", fontStyle: "italic", opacity: 0.45,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const INVITATION_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "inv-navy-gold",
    name: "Navy Gold",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fffef8",
      primary: "#1e3a5f",
      accent: "#c09c2c",
      textColor: "#1e3a5f",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-rose-gold",
    name: "Rose Gold",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fffef8",
      primary: "#831843",
      accent: "#d4a574",
      textColor: "#831843",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-sage-green",
    name: "Sage Garden",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fdf8f0",
      primary: "#065f46",
      accent: "#6ee7b7",
      textColor: "#065f46",
      headingFont: "Merriweather",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-burgundy-classic",
    name: "Burgundy Classic",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fffef8",
      primary: "#7f1d1d",
      accent: "#fca5a5",
      textColor: "#7f1d1d",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-royal-purple",
    name: "Royal Purple",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildInvitation({
      bg: "#f5f3ff",
      primary: "#4a1d96",
      accent: "#c4b5fd",
      textColor: "#4a1d96",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-classic-gold",
    name: "Classic Gold",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fffef8",
      primary: "#713f12",
      accent: "#fef3c7",
      textColor: "#713f12",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-teal-modern",
    name: "Teal Modern",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#ffffff",
      primary: "#0d7377",
      accent: "#99f6e4",
      textColor: "#0d7377",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-midnight-elegant",
    name: "Midnight Elegant",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildInvitation({
      bg: "#1a1a2e",
      primary: "#c09c2c",
      accent: "#fef3c7",
      textColor: "#e2e8f0",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-blush-pink",
    name: "Blush Pink",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#fff1f2",
      primary: "#be185d",
      accent: "#fce7f3",
      textColor: "#be185d",
      headingFont: "Crimson Text",
      bodyFont: "Inter",
    }),
  },
  {
    id: "inv-ocean-blue",
    name: "Ocean Blue",
    category: "invitation",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildInvitation({
      bg: "#ffffff",
      primary: "#1e40af",
      accent: "#bfdbfe",
      textColor: "#1e40af",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
    }),
  },
];
