/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Greeting Card Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Greeting Card tool.
 *  Default canvas: A5 portrait 420 × 595 px (front cover).
 *
 *  Named objects for quick-edit targeting:
 *    gc-title, gc-subtitle, gc-recipient, gc-message, gc-sender,
 *    gc-occasion-label, gc-footer-note
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

function buildJson(bg: string, objects: Record<string, unknown>[]): string {
  return JSON.stringify({ version: "5.3.0", objects, background: bg });
}

// ── Template builder ────────────────────────────────────────────────────────

function buildCard(opts: {
  bg: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  title: string;
  subtitle: string;
  message: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const { bg, accent, textColor, headingFont, bodyFont, title, subtitle, message, extraObjects = [] } = opts;
  const m = 35;
  const cw = W - m * 2;

  const objects: Record<string, unknown>[] = [
    // Border frame
    rect("gc-frame", {
      left: m - 2, top: m - 2, width: cw + 4, height: H - m * 2 + 4,
      fill: "transparent", stroke: accent, strokeWidth: 1,
      selectable: false, opacity: 0.3,
    }),
    // Occasion label
    txt("gc-occasion-label", "CELEBRATION", {
      left: m + 10, top: m + 20, width: cw - 20, fontSize: 10,
      fontFamily: bodyFont, fontWeight: "600", fill: accent,
      textAlign: "center", charSpacing: 400,
    }),
    // Top decorative line
    line("gc-top-line", W / 2 - 30, 0, W / 2 + 30, 0, {
      left: W / 2 - 30, top: m + 42, stroke: accent, strokeWidth: 1, opacity: 0.4,
    }),
    // Title
    txt("gc-title", title, {
      left: m + 10, top: m + 65, width: cw - 20, fontSize: 36,
      fontFamily: headingFont, fontWeight: "800", fill: textColor,
      textAlign: "center", lineHeight: 1.1,
    }),
    // Subtitle
    txt("gc-subtitle", subtitle, {
      left: m + 10, top: m + 140, width: cw - 20, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", fontStyle: "italic", opacity: 0.6,
    }),
    // Decorative accent circle
    circle("gc-deco-circle", {
      left: W / 2 - 25, top: m + 175, radius: 25,
      fill: accent, opacity: 0.1,
    }),
    // Recipient
    txt("gc-recipient", "Dear Chanda,", {
      left: m + 10, top: m + 240, width: cw - 20, fontSize: 18,
      fontFamily: headingFont, fontWeight: "600", fill: textColor,
      textAlign: "center",
    }),
    // Message body
    txt("gc-message", message, {
      left: m + 10, top: m + 280, width: cw - 20, fontSize: 13,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", lineHeight: 1.6, opacity: 0.8,
    }),
    // Sender
    txt("gc-sender", "With love, Mwila", {
      left: m + 10, top: m + 420, width: cw - 20, fontSize: 15,
      fontFamily: headingFont, fontWeight: "500", fill: accent,
      textAlign: "center", fontStyle: "italic",
    }),
    // Bottom decorative line
    line("gc-bottom-line", W / 2 - 30, 0, W / 2 + 30, 0, {
      left: W / 2 - 30, top: m + 465, stroke: accent, strokeWidth: 1, opacity: 0.4,
    }),
    // Footer note
    txt("gc-footer-note", "Designed with love using DMSuite", {
      left: m + 10, top: H - m - 30, width: cw - 20, fontSize: 8,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.3,
    }),
    ...extraObjects,
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const GREETING_CARD_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "gc-birthday-amber",
    name: "Birthday Amber",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#fffbeb",
      accent: "#fbbf24",
      textColor: "#78350f",
      headingFont: "Poppins",
      bodyFont: "Inter",
      title: "Happy\nBirthday!",
      subtitle: "A Special Day for a Special Person",
      message: "Wishing you a day filled with joy, laughter, and all the wonderful things you deserve. May this year bring you happiness beyond your wildest dreams.",
    }),
  },
  {
    id: "gc-thankyou-emerald",
    name: "Thank You Emerald",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#f0fdf4",
      accent: "#10b981",
      textColor: "#064e3b",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
      title: "Thank\nYou!",
      subtitle: "Your Kindness Means the World",
      message: "Words cannot express how grateful I am for your thoughtfulness and generosity. You have made a real difference and I truly appreciate everything you have done.",
    }),
  },
  {
    id: "gc-holiday-red",
    name: "Holiday Red",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#fef2f2",
      accent: "#dc2626",
      textColor: "#7f1d1d",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      title: "Season's\nGreetings",
      subtitle: "Wishing You a Joyous Holiday Season",
      message: "May this festive season bring you warmth, peace, and the company of those you love most. Here's to a wonderful holiday and a bright new year ahead.",
    }),
  },
  {
    id: "gc-congrats-violet",
    name: "Congratulations Violet",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#f5f3ff",
      accent: "#8b5cf6",
      textColor: "#4c1d95",
      headingFont: "Poppins",
      bodyFont: "Inter",
      title: "Congrat-\nulations!",
      subtitle: "What an Achievement",
      message: "Your hard work and dedication have truly paid off. This is a moment to celebrate and be proud of everything you have accomplished. The best is yet to come!",
    }),
  },
  {
    id: "gc-sympathy-slate",
    name: "Sympathy Slate",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#f8fafc",
      accent: "#94a3b8",
      textColor: "#334155",
      headingFont: "Crimson Text",
      bodyFont: "Inter",
      title: "With Deepest\nSympathy",
      subtitle: "Thinking of You",
      message: "During this difficult time, please know that you are in our thoughts and prayers. May you find comfort in the love of family and friends who surround you.",
    }),
  },
  {
    id: "gc-love-rose",
    name: "Love Rose",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCard({
      bg: "#fff1f2",
      accent: "#e11d48",
      textColor: "#881337",
      headingFont: "Cormorant Garamond",
      bodyFont: "Inter",
      title: "With All\nMy Love",
      subtitle: "You Mean Everything to Me",
      message: "Every day with you is a gift. You fill my life with love, laughter, and joy. I am so grateful to have you by my side. Today and always, you are my everything.",
    }),
  },
  {
    id: "gc-graduation-blue",
    name: "Graduation Blue",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#eff6ff",
      accent: "#3b82f6",
      textColor: "#1e3a8a",
      headingFont: "DM Serif Display",
      bodyFont: "Inter",
      title: "Happy\nGraduation!",
      subtitle: "The World is Yours",
      message: "Your dedication and perseverance have brought you to this incredible milestone. The future is bright and full of possibilities. Go out and make your mark!",
    }),
  },
  {
    id: "gc-celebration-gold",
    name: "Celebration Gold",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCard({
      bg: "#fffef8",
      accent: "#c09c2c",
      textColor: "#713f12",
      headingFont: "Playfair Display",
      bodyFont: "Inter",
      title: "Let's\nCelebrate!",
      subtitle: "A Moment to Remember",
      message: "Life is made of special moments like these. Here's to celebrating the joy, the love, and the memories that make life beautiful. Cheers to many more!",
    }),
  },
  {
    id: "gc-babyshower-teal",
    name: "Baby Shower Teal",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#f0fdfa",
      accent: "#14b8a6",
      textColor: "#134e4a",
      headingFont: "Poppins",
      bodyFont: "Inter",
      title: "Welcome\nLittle One!",
      subtitle: "A Bundle of Joy is on the Way",
      message: "Congratulations on this exciting new chapter! May your little one bring endless love, giggles, and happiness into your lives. We cannot wait to meet them!",
    }),
  },
  {
    id: "gc-newYear-midnight",
    name: "New Year Midnight",
    category: "greeting-card",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCard({
      bg: "#0f0f23",
      accent: "#fbbf24",
      textColor: "#e2e8f0",
      headingFont: "Oswald",
      bodyFont: "Inter",
      title: "Happy\nNew Year!",
      subtitle: "Here's to New Beginnings",
      message: "As we welcome a fresh start, may this new year bring you prosperity, good health, and all the success you deserve. Make it a year to remember!",
    }),
  },
];
