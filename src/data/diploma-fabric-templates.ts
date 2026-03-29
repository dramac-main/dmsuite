/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Diploma & Accreditation Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Diploma Designer.
 *  Default: A4 Landscape — 1123 × 794 px (297 × 210 mm @ 96 DPI).
 *
 *  Named objects for quick-edit targeting:
 *    dip-institution, dip-institution-subtitle, dip-institution-motto,
 *    dip-recipient, dip-recipient-id, dip-program, dip-field-of-study,
 *    dip-honors, dip-conferral, dip-resolution, dip-date-conferred,
 *    dip-graduation-date, dip-registration, dip-serial,
 *    dip-accreditation-body, dip-accreditation-number,
 *    dip-signatory-{0,1}-name, dip-signatory-{0,1}-title,
 *    dip-sig-line-{0,1}, dip-seal-outer, dip-seal-text
 *
 *  Each template uses exact colors + font pairings from DIPLOMA_TEMPLATES
 *  in diploma-editor.ts.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

// ── Canvas dimensions (A4 landscape @ 96 DPI) ──────────────────────────────
const W = 1123;
const H = 794;

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

// ── Signatory block (signature line + name + title) ─────────────────────────

function makeSignatory(
  index: number,
  x: number,
  y: number,
  opts: { lineWidth?: number; lineColor: string; textColor: string; font: string },
): Record<string, unknown>[] {
  const lw = opts.lineWidth ?? 160;
  return [
    line(`dip-sig-line-${index}`, x, y, x + lw, y, {
      stroke: opts.lineColor, strokeWidth: 1,
      left: x, top: y,
    }),
    txt(`dip-signatory-${index}-name`, index === 0 ? "Chancellor" : "Registrar", {
      left: x, top: y + 6, width: lw, fontSize: 13,
      fontWeight: "bold", fontFamily: opts.font,
      fill: opts.textColor, textAlign: "center",
    }),
    txt(`dip-signatory-${index}-title`, index === 0 ? "Chancellor" : "University Registrar", {
      left: x, top: y + 24, width: lw, fontSize: 11,
      fontFamily: opts.font,
      fill: opts.textColor, textAlign: "center", opacity: 0.7,
    }),
  ];
}

// ── Seal (circular emblem) ──────────────────────────────────────────────────

function makeSeal(
  x: number,
  y: number,
  color: string,
  radius?: number,
): Record<string, unknown>[] {
  const r = radius ?? 36;
  return [
    circle("dip-seal-outer", {
      left: x, top: y, radius: r,
      fill: "transparent", stroke: color, strokeWidth: 3, opacity: 0.5,
    }),
    circle("dip-seal-inner", {
      left: x + 6, top: y + 6, radius: r - 6,
      fill: "transparent", stroke: color, strokeWidth: 1, opacity: 0.3,
    }),
    txt("dip-seal-text", "SEAL", {
      left: x, top: y + r - 8, width: r * 2, fontSize: 12,
      fontWeight: "bold", fill: color, textAlign: "center", opacity: 0.4,
    }),
  ];
}

// ── Standard diploma body builder ───────────────────────────────────────────

function buildDiploma(opts: {
  bg: string;
  accent: string;
  textColor: string;
  subtextColor: string;
  headingFont: string;
  bodyFont: string;
  borderColor?: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const cx = W / 2;
  const borderC = opts.borderColor ?? opts.accent;

  const objects: Record<string, unknown>[] = [
    // ── Decorative border ──
    rect("dip-border-outer", {
      left: 20, top: 20, width: W - 40, height: H - 40,
      fill: "transparent", stroke: borderC, strokeWidth: 2, opacity: 0.35,
    }),
    rect("dip-border-inner", {
      left: 30, top: 30, width: W - 60, height: H - 60,
      fill: "transparent", stroke: borderC, strokeWidth: 1, opacity: 0.2,
    }),

    // ── Institution name ──
    txt("dip-institution", "University Name", {
      left: 60, top: 60, width: W - 120, fontSize: 32,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.accent, textAlign: "center",
    }),

    // ── Institution subtitle ──
    txt("dip-institution-subtitle", "School of Graduate Studies", {
      left: 60, top: 100, width: W - 120, fontSize: 16,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center",
    }),

    // ── Motto ──
    txt("dip-institution-motto", "Excellence in Education", {
      left: 60, top: 124, width: W - 120, fontSize: 12,
      fontFamily: opts.bodyFont, fontStyle: "italic",
      fill: opts.subtextColor, textAlign: "center", opacity: 0.7,
    }),

    // ── Conferral text ──
    txt("dip-conferral", "This is to certify that", {
      left: 60, top: 180, width: W - 120, fontSize: 14,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center",
    }),

    // ── Recipient name ──
    txt("dip-recipient", "Recipient Full Name", {
      left: 60, top: 210, width: W - 120, fontSize: 36,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.textColor, textAlign: "center",
    }),

    // ── Recipient ID ──
    txt("dip-recipient-id", "Student ID: 000000", {
      left: 60, top: 256, width: W - 120, fontSize: 11,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center", opacity: 0.6,
    }),

    // ── Resolution text ──
    txt("dip-resolution", "having successfully completed all requirements prescribed by the Senate, is hereby awarded the degree of", {
      left: 100, top: 286, width: W - 200, fontSize: 13,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center",
    }),

    // ── Program name ──
    txt("dip-program", "Bachelor of Science", {
      left: 60, top: 330, width: W - 120, fontSize: 28,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.accent, textAlign: "center",
    }),

    // ── Field of study ──
    txt("dip-field-of-study", "in Computer Science", {
      left: 60, top: 366, width: W - 120, fontSize: 18,
      fontFamily: opts.bodyFont,
      fill: opts.textColor, textAlign: "center",
    }),

    // ── Honors ──
    txt("dip-honors", "Cum Laude", {
      left: 60, top: 396, width: W - 120, fontSize: 16,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.accent, textAlign: "center", fontStyle: "italic",
    }),

    // ── Accreditation ──
    txt("dip-accreditation-body", "Accredited by National Board of Education", {
      left: 60, top: 434, width: W - 120, fontSize: 10,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center", opacity: 0.6,
    }),
    txt("dip-accreditation-number", "Accreditation No: ACC-2025-001", {
      left: 60, top: 450, width: W - 120, fontSize: 10,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center", opacity: 0.6,
    }),

    // ── Dates ──
    txt("dip-date-conferred", "Conferred: January 1, 2025", {
      left: 60, top: 490, width: (W - 120) / 2, fontSize: 12,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center",
    }),
    txt("dip-graduation-date", "Graduation: December 15, 2024", {
      left: cx, top: 490, width: (W - 120) / 2, fontSize: 12,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center",
    }),

    // ── Registration / Serial ──
    txt("dip-registration", "Reg. No: REG-2025-00001", {
      left: 60, top: H - 50, width: 250, fontSize: 9,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, opacity: 0.5,
    }),
    txt("dip-serial", "Serial: DIP-2025-00001", {
      left: W - 310, top: H - 50, width: 250, fontSize: 9,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, opacity: 0.5, textAlign: "right",
    }),

    // ── Signatories (2 default) ──
    ...makeSignatory(0, 120, 580, {
      lineColor: borderC, textColor: opts.textColor, font: opts.bodyFont,
    }),
    ...makeSignatory(1, W - 280, 580, {
      lineColor: borderC, textColor: opts.textColor, font: opts.bodyFont,
    }),

    // ── Seal ──
    ...makeSeal(cx - 36, 540, opts.accent),
  ];

  if (opts.extraObjects) objects.push(...opts.extraObjects);

  return buildJson(opts.bg, objects);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Templates
// ═══════════════════════════════════════════════════════════════════════════

export const DIPLOMA_FABRIC_TEMPLATES: FabricTemplate[] = [
  // ── 1  University Classic ──────────────────────────────────────────────
  {
    id: "university-classic",
    name: "University Classic",
    category: "Academic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#faf6ef",
      accent: "#1e3a5f",
      textColor: "#1e293b",
      subtextColor: "#64748b",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
    }),
  },

  // ── 2  Institutional Formal ────────────────────────────────────────────
  {
    id: "institutional-formal",
    name: "Institutional Formal",
    category: "Academic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#ffffff",
      accent: "#166534",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Merriweather",
      bodyFont: "Open Sans",
      extraObjects: [
        // Corner flourishes
        rect("dip-corner-tl", { left: 14, top: 14, width: 40, height: 2, fill: "#166534", opacity: 0.4 }),
        rect("dip-corner-tl-v", { left: 14, top: 14, width: 2, height: 40, fill: "#166534", opacity: 0.4 }),
        rect("dip-corner-br", { left: W - 54, top: H - 16, width: 40, height: 2, fill: "#166534", opacity: 0.4 }),
        rect("dip-corner-br-v", { left: W - 16, top: H - 54, width: 2, height: 40, fill: "#166534", opacity: 0.4 }),
      ],
    }),
  },

  // ── 3  Modern Professional ─────────────────────────────────────────────
  {
    id: "modern-professional",
    name: "Modern Professional",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#ffffff",
      accent: "#1e40af",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        rect("dip-accent-bar", {
          left: 0, top: 0, width: W, height: 6, fill: "#1e40af",
        }),
        rect("dip-accent-bar-bottom", {
          left: 0, top: H - 4, width: W, height: 4, fill: "#1e40af",
        }),
      ],
    }),
  },

  // ── 4  Ivy League ──────────────────────────────────────────────────────
  {
    id: "ivy-league",
    name: "Ivy League",
    category: "Academic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#fef9ef",
      accent: "#7c2d12",
      textColor: "#1c1917",
      subtextColor: "#78716c",
      headingFont: "Cormorant Garamond",
      bodyFont: "Montserrat",
      extraObjects: [
        // Ornate triple border
        rect("dip-border-ornate", {
          left: 12, top: 12, width: W - 24, height: H - 24,
          fill: "transparent", stroke: "#7c2d12", strokeWidth: 3, opacity: 0.25,
        }),
      ],
    }),
  },

  // ── 5  Executive ───────────────────────────────────────────────────────
  {
    id: "executive",
    name: "Executive",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#fdfcf8",
      accent: "#18181b",
      textColor: "#18181b",
      subtextColor: "#71717a",
      headingFont: "DM Serif Display",
      bodyFont: "DM Sans",
      extraObjects: [
        line("dip-divider-top", 100, 155, W - 100, 155, {
          stroke: "#18181b", strokeWidth: 1, opacity: 0.15,
          left: 100, top: 155,
        }),
      ],
    }),
  },

  // ── 6  Technical / TVET ────────────────────────────────────────────────
  {
    id: "technical-vocational",
    name: "Technical / TVET",
    category: "Vocational",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#f8fafc",
      accent: "#0891b2",
      textColor: "#0f172a",
      subtextColor: "#64748b",
      headingFont: "Poppins",
      bodyFont: "Inter",
      extraObjects: [
        rect("dip-header-band", {
          left: 0, top: 0, width: W, height: 50, fill: "#0891b2", opacity: 0.08,
        }),
      ],
    }),
  },

  // ── 7  Medical / Health ────────────────────────────────────────────────
  {
    id: "medical-health",
    name: "Medical / Health",
    category: "Healthcare",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#f0fdf4",
      accent: "#047857",
      textColor: "#064e3b",
      subtextColor: "#6b7280",
      headingFont: "Crimson Text",
      bodyFont: "Source Sans 3",
      extraObjects: [
        // Medical cross in top-right
        rect("dip-cross-h", {
          left: W - 80, top: 32, width: 24, height: 6, fill: "#047857", opacity: 0.15, rx: 2, ry: 2,
        }),
        rect("dip-cross-v", {
          left: W - 71, top: 23, width: 6, height: 24, fill: "#047857", opacity: 0.15, rx: 2, ry: 2,
        }),
      ],
    }),
  },

  // ── 8  Legal / Bar ─────────────────────────────────────────────────────
  {
    id: "legal-bar",
    name: "Legal / Bar",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#faf5ff",
      accent: "#4c1d95",
      textColor: "#1e1b4b",
      subtextColor: "#7c3aed",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
      extraObjects: [
        rect("dip-border-vintage", {
          left: 10, top: 10, width: W - 20, height: H - 20,
          fill: "transparent", stroke: "#4c1d95", strokeWidth: 2, opacity: 0.2,
          rx: 8, ry: 8,
        }),
      ],
    }),
  },

  // ── 9  Vintage Academic ────────────────────────────────────────────────
  {
    id: "vintage-academic",
    name: "Vintage Academic",
    category: "Academic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#faf3e3",
      accent: "#92400e",
      textColor: "#451a03",
      subtextColor: "#92400e",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
      extraObjects: [
        // Ornate double border
        rect("dip-border-vintage-outer", {
          left: 8, top: 8, width: W - 16, height: H - 16,
          fill: "transparent", stroke: "#92400e", strokeWidth: 3, opacity: 0.3,
        }),
        rect("dip-border-vintage-inner", {
          left: 16, top: 16, width: W - 32, height: H - 32,
          fill: "transparent", stroke: "#92400e", strokeWidth: 1, opacity: 0.2,
        }),
      ],
    }),
  },

  // ── 10 International ───────────────────────────────────────────────────
  {
    id: "international",
    name: "International",
    category: "Academic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildDiploma({
      bg: "#ffffff",
      accent: "#1d4ed8",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Inter",
      bodyFont: "Inter",
      extraObjects: [
        // Corner accents
        rect("dip-corner-accent-tl", {
          left: 0, top: 0, width: 60, height: 60,
          fill: "#1d4ed8", opacity: 0.06,
        }),
        rect("dip-corner-accent-br", {
          left: W - 60, top: H - 60, width: 60, height: 60,
          fill: "#1d4ed8", opacity: 0.06,
        }),
      ],
    }),
  },
];
