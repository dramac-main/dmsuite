/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Calendar Designer Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Calendar Designer.
 *  Default canvas: 1200 × 900 px (wall calendar landscape).
 *
 *  Named objects for quick-edit targeting:
 *    cal-title, cal-subtitle, cal-month-label, cal-year-label,
 *    cal-footer-text
 *
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

const W = 1200;
const H = 900;

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

function buildCalendar(opts: {
  bg: string;
  headerBg: string;
  accent: string;
  textColor: string;
  headerText: string;
  gridBg: string;
  headingFont: string;
  bodyFont: string;
}): string {
  const { bg, headerBg, accent, textColor, headerText, gridBg, headingFont, bodyFont } = opts;
  const headerH = 180;

  const objects: Record<string, unknown>[] = [
    // Header band
    rect("cal-header", {
      left: 0, top: 0, width: W, height: headerH,
      fill: headerBg,
    }),
    // Month label
    txt("cal-month-label", "MARCH", {
      left: 60, top: 40, width: 400, fontSize: 52,
      fontFamily: headingFont, fontWeight: "800", fill: headerText,
      charSpacing: 200,
    }),
    // Year label
    txt("cal-year-label", "2026", {
      left: 60, top: 110, width: 200, fontSize: 28,
      fontFamily: bodyFont, fontWeight: "300", fill: headerText,
      opacity: 0.7,
    }),
    // Title (right side of header)
    txt("cal-title", "", {
      left: W - 360, top: 50, width: 300, fontSize: 20,
      fontFamily: headingFont, fontWeight: "600", fill: headerText,
      textAlign: "right",
    }),
    // Subtitle
    txt("cal-subtitle", "", {
      left: W - 360, top: 80, width: 300, fontSize: 14,
      fontFamily: bodyFont, fontWeight: "400", fill: headerText,
      textAlign: "right", opacity: 0.7,
    }),
    // Grid background
    rect("cal-grid-bg", {
      left: 0, top: headerH, width: W, height: H - headerH - 50,
      fill: gridBg,
    }),
    // Day headers row
    ...["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"].map((day, i) => {
      const colW = (W - 80) / 7;
      return txt(`cal-day-${day.toLowerCase()}`, day, {
        left: 40 + i * colW, top: headerH + 12, width: colW, fontSize: 12,
        fontFamily: bodyFont, fontWeight: "600", fill: textColor,
        textAlign: "center", charSpacing: 200, opacity: 0.5,
      });
    }),
    // Grid lines
    line("cal-grid-top", 40, headerH + 40, W - 40, headerH + 40, {
      left: 40, top: headerH + 40, stroke: textColor, strokeWidth: 0.5, opacity: 0.15,
    }),
    // Accent on today (decorative)
    rect("cal-today-accent", {
      left: W / 2 - 20, top: headerH + 60, width: 40, height: 40,
      fill: accent, rx: 20, ry: 20, opacity: 0.3,
    }),
    // Footer bar
    rect("cal-footer-bar", {
      left: 0, top: H - 50, width: W, height: 50,
      fill: headerBg, opacity: 0.05,
    }),
    // Footer text
    txt("cal-footer-text", "www.dmsuite.com — Lusaka, Zambia", {
      left: 60, top: H - 35, width: W - 120, fontSize: 11,
      fontFamily: bodyFont, fontWeight: "400", fill: textColor,
      textAlign: "center", opacity: 0.4,
    }),
  ];

  return buildJson(bg, objects);
}

// ── Templates ───────────────────────────────────────────────────────────────

export const CALENDAR_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "calendar-corporate-blue",
    name: "Corporate Blue",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#ffffff",
      headerBg: "#1e40af",
      accent: "#1e40af",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-nature-green",
    name: "Nature Green",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#f0fdf4",
      headerBg: "#065f46",
      accent: "#059669",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#f0fdf4",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-minimal-light",
    name: "Minimal Light",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#ffffff",
      headerBg: "#f8fafc",
      accent: "#1e293b",
      textColor: "#1e293b",
      headerText: "#1e293b",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-vibrant-purple",
    name: "Vibrant Purple",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#faf5ff",
      headerBg: "#7c3aed",
      accent: "#7c3aed",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#faf5ff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-dark-mode",
    name: "Dark Mode",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#0f172a",
      headerBg: "#111827",
      accent: "#84cc16",
      textColor: "#e5e7eb",
      headerText: "#f9fafb",
      gridBg: "#1f2937",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-elegant-gold",
    name: "Elegant Gold",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCalendar({
      bg: "#fefce8",
      headerBg: "#1c1917",
      accent: "#c09c2c",
      textColor: "#1e293b",
      headerText: "#fbbf24",
      gridBg: "#fefce8",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-teal-modern",
    name: "Teal Modern",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#ffffff",
      headerBg: "#0f766e",
      accent: "#0f766e",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-red-bold",
    name: "Red Bold",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#ffffff",
      headerBg: "#dc2626",
      accent: "#dc2626",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-sky-fresh",
    name: "Sky Fresh",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildCalendar({
      bg: "#f0f9ff",
      headerBg: "#0284c7",
      accent: "#0284c7",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
  {
    id: "calendar-orange-warm",
    name: "Orange Warm",
    category: "calendar-designer",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildCalendar({
      bg: "#ffffff",
      headerBg: "#ea580c",
      accent: "#ea580c",
      textColor: "#1e293b",
      headerText: "#ffffff",
      gridBg: "#ffffff",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },
];
