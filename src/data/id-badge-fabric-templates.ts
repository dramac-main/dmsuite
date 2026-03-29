/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — ID Badge & Lanyard Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the ID Badge Designer.
 *  CR80 standard card: 1013 × 638 px (85.6 × 54 mm @ 300 DPI).
 *
 *  Named objects for quick-edit targeting:
 *    badge-org-name, badge-org-subtitle, badge-first-name, badge-last-name,
 *    badge-title, badge-department, badge-employee-id, badge-role,
 *    badge-email, badge-phone, badge-access-level,
 *    badge-issue-date, badge-expiry-date,
 *    badge-photo-placeholder, badge-signatory-name, badge-signatory-title
 *
 *  Each template uses exact colors + font pairings from BADGE_TEMPLATES
 *  in id-badge-editor.ts.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

// ── Canvas dimensions (CR80 standard: 85.6 × 54 mm @ 300 DPI) ─────────────
const W = 1013;
const H = 638;

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

// ── Photo placeholder (rounded rectangle or circle area) ────────────────────

function photoPlaceholder(
  shape: "circle" | "rounded-square" | "square",
  x: number,
  y: number,
  size: number,
  borderColor: string,
): Record<string, unknown> {
  if (shape === "circle") {
    return circle("badge-photo-placeholder", {
      left: x, top: y, radius: size / 2,
      fill: "#e5e7eb", stroke: borderColor, strokeWidth: 3,
    });
  }
  return rect("badge-photo-placeholder", {
    left: x, top: y, width: size, height: size,
    fill: "#e5e7eb", stroke: borderColor, strokeWidth: 3,
    rx: shape === "rounded-square" ? 12 : 0,
    ry: shape === "rounded-square" ? 12 : 0,
  });
}

// ── Standard badge body builder ─────────────────────────────────────────────

function buildBadge(opts: {
  bg: string;
  headerBg: string;
  accent: string;
  textColor: string;
  subtextColor: string;
  headingFont: string;
  bodyFont: string;
  photoShape: "circle" | "rounded-square" | "square";
  headerHeight?: number;
  isPro?: boolean;
  extraObjects?: Record<string, unknown>[];
}): string {
  const headerH = opts.headerHeight ?? 170;
  const photoSize = 130;
  const photoX = 60;
  const photoY = headerH + 30;
  const infoX = photoX + photoSize + 30;
  const infoY = headerH + 30;

  const objects: Record<string, unknown>[] = [
    // ── Header band ──
    rect("badge-header-bar", {
      left: 0, top: 0, width: W, height: headerH,
      fill: opts.headerBg, selectable: false,
    }),

    // ── Organization name ──
    txt("badge-org-name", "Organization Name", {
      left: 30, top: 30, width: W - 60, fontSize: 28,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: "#ffffff", textAlign: "center",
    }),

    // ── Organization subtitle ──
    txt("badge-org-subtitle", "Department / Division", {
      left: 30, top: 68, width: W - 60, fontSize: 16,
      fontFamily: opts.bodyFont,
      fill: "rgba(255,255,255,0.8)", textAlign: "center",
    }),

    // ── Role badge (small pill in header) ──
    rect("badge-role-bg", {
      left: W / 2 - 50, top: headerH - 38, width: 100, height: 26,
      fill: "rgba(255,255,255,0.2)", rx: 13, ry: 13,
    }),
    txt("badge-role", "STAFF", {
      left: W / 2 - 50, top: headerH - 36, width: 100, fontSize: 12,
      fontWeight: "bold", fontFamily: opts.bodyFont,
      fill: "#ffffff", textAlign: "center",
    }),

    // ── Photo placeholder ──
    photoPlaceholder(opts.photoShape, photoX, photoY, photoSize, opts.accent),

    // ── Person name (first + last on separate lines) ──
    txt("badge-first-name", "First Name", {
      left: infoX, top: infoY, width: W - infoX - 40, fontSize: 26,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.textColor,
    }),
    txt("badge-last-name", "Last Name", {
      left: infoX, top: infoY + 32, width: W - infoX - 40, fontSize: 26,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.textColor,
    }),

    // ── Title ──
    txt("badge-title", "Job Title", {
      left: infoX, top: infoY + 72, width: W - infoX - 40, fontSize: 16,
      fontFamily: opts.bodyFont,
      fill: opts.accent,
    }),

    // ── Department ──
    txt("badge-department", "Department", {
      left: infoX, top: infoY + 96, width: W - infoX - 40, fontSize: 14,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Divider line ──
    line("badge-divider", infoX, infoY + 122, W - 40, infoY + 122, {
      stroke: opts.accent, strokeWidth: 1, opacity: 0.3,
      left: infoX, top: infoY + 122,
    }),

    // ── Employee ID ──
    txt("badge-employee-id", "ID: EMP-0001", {
      left: infoX, top: infoY + 132, width: 200, fontSize: 13,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Access Level ──
    txt("badge-access-level", "Access: Level 1", {
      left: infoX + 220, top: infoY + 132, width: 200, fontSize: 13,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Email ──
    txt("badge-email", "email@company.com", {
      left: infoX, top: infoY + 155, width: W - infoX - 40, fontSize: 12,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Phone ──
    txt("badge-phone", "+1 (555) 000-0000", {
      left: infoX, top: infoY + 175, width: W - infoX - 40, fontSize: 12,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Bottom bar with dates ──
    rect("badge-footer-bar", {
      left: 0, top: H - 60, width: W, height: 60,
      fill: opts.accent, opacity: 0.08, selectable: false,
    }),

    txt("badge-issue-date", "Issued: 01/01/2025", {
      left: 30, top: H - 46, width: 200, fontSize: 11,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    txt("badge-expiry-date", "Expires: 01/01/2026", {
      left: 250, top: H - 46, width: 200, fontSize: 11,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor,
    }),

    // ── Signatory ──
    txt("badge-signatory-name", "Authorized By", {
      left: W - 250, top: H - 50, width: 220, fontSize: 11,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "right",
    }),
    txt("badge-signatory-title", "Director of HR", {
      left: W - 250, top: H - 34, width: 220, fontSize: 10,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "right", opacity: 0.7,
    }),
  ];

  if (opts.extraObjects) objects.push(...opts.extraObjects);

  return buildJson(opts.bg, objects);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Templates
// ═══════════════════════════════════════════════════════════════════════════

export const ID_BADGE_FABRIC_TEMPLATES: FabricTemplate[] = [
  // ── 1  Modern Corporate ────────────────────────────────────────────────
  {
    id: "modern-corporate",
    name: "Modern Corporate",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#1e40af",
      accent: "#1e40af",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Inter",
      bodyFont: "Inter",
      photoShape: "rounded-square",
      extraObjects: [
        // Subtle blue accent strip at very bottom
        rect("badge-accent-strip", {
          left: 0, top: H - 4, width: W, height: 4,
          fill: "#1e40af",
        }),
      ],
    }),
  },

  // ── 2  Gradient Flow ───────────────────────────────────────────────────
  {
    id: "gradient-flow",
    name: "Gradient Flow",
    category: "Creative",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#7c3aed",
      accent: "#7c3aed",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Poppins",
      bodyFont: "Inter",
      photoShape: "circle",
      extraObjects: [
        // Decorative gradient circle in header
        circle("badge-header-deco", {
          left: W - 120, top: -30, radius: 80,
          fill: "rgba(255,255,255,0.1)",
        }),
        circle("badge-header-deco-2", {
          left: W - 80, top: 20, radius: 50,
          fill: "rgba(255,255,255,0.07)",
        }),
      ],
    }),
  },

  // ── 3  Minimalist Clean ────────────────────────────────────────────────
  {
    id: "minimalist-clean",
    name: "Minimalist Clean",
    category: "Professional",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#18181b",
      accent: "#18181b",
      textColor: "#18181b",
      subtextColor: "#71717a",
      headingFont: "DM Serif Display",
      bodyFont: "DM Sans",
      photoShape: "rounded-square",
      headerHeight: 150,
    }),
  },

  // ── 4  Bold Accent ─────────────────────────────────────────────────────
  {
    id: "bold-accent",
    name: "Bold Accent",
    category: "Creative",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#dc2626",
      accent: "#dc2626",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Oswald",
      bodyFont: "Roboto",
      photoShape: "square",
      extraObjects: [
        // Bold diagonal accent stripe in header
        rect("badge-diagonal-accent", {
          left: W - 160, top: 0, width: 8, height: 170,
          fill: "rgba(255,255,255,0.15)", angle: -15,
        }),
        rect("badge-diagonal-accent-2", {
          left: W - 130, top: 0, width: 4, height: 170,
          fill: "rgba(255,255,255,0.1)", angle: -15,
        }),
      ],
    }),
  },

  // ── 5  Executive Premium (dark theme) ──────────────────────────────────
  {
    id: "executive-premium",
    name: "Executive Premium",
    category: "Premium",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildBadge({
      bg: "#0f0f23",
      headerBg: "#1a1a2e",
      accent: "#b8860b",
      textColor: "#f5f5f5",
      subtextColor: "#9ca3af",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
      photoShape: "circle",
      extraObjects: [
        // Gold accent lines
        line("badge-gold-line-top", 30, 170, W - 30, 170, {
          stroke: "#b8860b", strokeWidth: 2, opacity: 0.6,
          left: 30, top: 170,
        }),
        line("badge-gold-line-bottom", 30, H - 62, W - 30, H - 62, {
          stroke: "#b8860b", strokeWidth: 1, opacity: 0.4,
          left: 30, top: H - 62,
        }),
        // Corner decorations
        rect("badge-corner-tl", {
          left: 10, top: 10, width: 30, height: 2,
          fill: "#b8860b", opacity: 0.5,
        }),
        rect("badge-corner-tl-v", {
          left: 10, top: 10, width: 2, height: 30,
          fill: "#b8860b", opacity: 0.5,
        }),
        rect("badge-corner-br", {
          left: W - 40, top: H - 12, width: 30, height: 2,
          fill: "#b8860b", opacity: 0.5,
        }),
        rect("badge-corner-br-v", {
          left: W - 12, top: H - 40, width: 2, height: 30,
          fill: "#b8860b", opacity: 0.5,
        }),
      ],
    }),
  },

  // ── 6  Academic Classic ────────────────────────────────────────────────
  {
    id: "academic-classic",
    name: "Academic Classic",
    category: "Education",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#f9f5eb",
      headerBg: "#1e3a5f",
      accent: "#1e3a5f",
      textColor: "#1e293b",
      subtextColor: "#64748b",
      headingFont: "Merriweather",
      bodyFont: "Open Sans",
      photoShape: "rounded-square",
      extraObjects: [
        // Classic border
        rect("badge-border", {
          left: 6, top: 6, width: W - 12, height: H - 12,
          fill: "transparent", stroke: "#1e3a5f", strokeWidth: 1, opacity: 0.2,
          rx: 4, ry: 4,
        }),
      ],
    }),
  },

  // ── 7  Healthcare Pro ──────────────────────────────────────────────────
  {
    id: "healthcare-pro",
    name: "Healthcare Pro",
    category: "Healthcare",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#f0fdfa",
      headerBg: "#0891b2",
      accent: "#0891b2",
      textColor: "#134e4a",
      subtextColor: "#5eead4",
      headingFont: "Inter",
      bodyFont: "Inter",
      photoShape: "circle",
      extraObjects: [
        // Medical cross icon placeholder in header
        rect("badge-cross-h", {
          left: W - 70, top: 72, width: 30, height: 8,
          fill: "rgba(255,255,255,0.25)", rx: 2, ry: 2,
        }),
        rect("badge-cross-v", {
          left: W - 59, top: 61, width: 8, height: 30,
          fill: "rgba(255,255,255,0.25)", rx: 2, ry: 2,
        }),
      ],
    }),
  },

  // ── 8  Tech Modern ─────────────────────────────────────────────────────
  {
    id: "tech-modern",
    name: "Tech Modern",
    category: "Technology",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#0f172a",
      accent: "#6366f1",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Poppins",
      bodyFont: "Inter",
      photoShape: "rounded-square",
      extraObjects: [
        // Indigo accent bar at top of header
        rect("badge-accent-bar", {
          left: 0, top: 0, width: W, height: 6,
          fill: "#6366f1",
        }),
        // Dot grid decoration
        circle("badge-dot-1", { left: W - 50, top: 140, radius: 3, fill: "#6366f1", opacity: 0.2 }),
        circle("badge-dot-2", { left: W - 35, top: 140, radius: 3, fill: "#6366f1", opacity: 0.15 }),
        circle("badge-dot-3", { left: W - 20, top: 140, radius: 3, fill: "#6366f1", opacity: 0.1 }),
      ],
    }),
  },

  // ── 9  Event Vibrant ───────────────────────────────────────────────────
  {
    id: "event-vibrant",
    name: "Event Vibrant",
    category: "Events",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#ea580c",
      accent: "#ea580c",
      textColor: "#111827",
      subtextColor: "#78716c",
      headingFont: "Oswald",
      bodyFont: "Roboto",
      photoShape: "circle",
      headerHeight: 180,
      extraObjects: [
        // Large event badge text in header
        txt("badge-event-label", "EVENT", {
          left: W - 180, top: 30, width: 150, fontSize: 48,
          fontWeight: "bold", fontFamily: "Oswald",
          fill: "rgba(255,255,255,0.12)", textAlign: "right",
        }),
      ],
    }),
  },

  // ── 10 Government Formal ───────────────────────────────────────────────
  {
    id: "government-formal",
    name: "Government Formal",
    category: "Government",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildBadge({
      bg: "#ffffff",
      headerBg: "#166534",
      accent: "#166534",
      textColor: "#111827",
      subtextColor: "#6b7280",
      headingFont: "Crimson Text",
      bodyFont: "Source Sans 3",
      photoShape: "square",
      extraObjects: [
        // Formal double border
        rect("badge-outer-border", {
          left: 4, top: 4, width: W - 8, height: H - 8,
          fill: "transparent", stroke: "#166534", strokeWidth: 2, opacity: 0.3,
          rx: 6, ry: 6,
        }),
        rect("badge-inner-border", {
          left: 10, top: 10, width: W - 20, height: H - 20,
          fill: "transparent", stroke: "#166534", strokeWidth: 1, opacity: 0.15,
          rx: 4, ry: 4,
        }),
        // Official seal placeholder
        circle("badge-seal", {
          left: W - 100, top: H - 120, radius: 30,
          fill: "transparent", stroke: "#166534", strokeWidth: 2, opacity: 0.2,
        }),
        txt("badge-seal-text", "SEAL", {
          left: W - 100, top: H - 100, width: 60, fontSize: 10,
          fontWeight: "bold", fontFamily: "Crimson Text",
          fill: "#166534", textAlign: "center", opacity: 0.3,
        }),
      ],
    }),
  },
];
