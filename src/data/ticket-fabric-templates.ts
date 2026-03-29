/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Ticket & Pass Fabric.js Templates
 *
 *  10 fully-editable Fabric.js JSON templates for the Ticket Designer.
 *  Standard event ticket: 816 × 336 px (8.5 × 3.5 in @ 96 DPI).
 *
 *  Named objects for quick-edit targeting:
 *    tkt-event-name, tkt-event-subtitle, tkt-venue, tkt-date, tkt-time,
 *    tkt-section, tkt-row, tkt-seat, tkt-gate, tkt-price, tkt-attendee,
 *    tkt-organizer, tkt-barcode-label, tkt-serial
 *
 *  Each template uses exact colors + font pairings from TICKET_TEMPLATES
 *  in ticket-editor.ts.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

// ── Canvas dimensions (standard ticket: 8.5 × 3.5 in) ─────────────────────
const W = 816;
const H = 336;

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

// ── Stub perforation (dashed vertical line) ─────────────────────────────────
function stubLine(x: number, color: string): Record<string, unknown> {
  return line("tkt-stub-line", x, 0, x, H, {
    stroke: color, strokeWidth: 2, strokeDashArray: [8, 6],
    left: x, top: 0, opacity: 0.5,
  });
}

// ── Standard ticket body builder ────────────────────────────────────────────
function buildTicket(opts: {
  bg: string;
  accent: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  stubX?: number;    // x position for stub perforation line (default: 620)
  extraObjects?: Record<string, unknown>[];
}): string {
  const stubX = opts.stubX ?? 620;

  const objects: Record<string, unknown>[] = [
    // Decorative extras behind text
    ...(opts.extraObjects ?? []),

    // Accent header bar
    rect("tkt-header-bar", {
      left: 0, top: 0, width: stubX, height: 6,
      fill: opts.accent, stroke: "", strokeWidth: 0,
    }),

    // Event name (large)
    txt("tkt-event-name", "Event Name", {
      left: 24, top: 20, width: stubX - 48,
      fontSize: 28, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.textColor, textAlign: "left",
    }),

    // Event subtitle
    txt("tkt-event-subtitle", "Event Subtitle / Tour Name", {
      left: 24, top: 56, width: stubX - 48,
      fontSize: 13, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "left", opacity: 0.7,
    }),

    // Venue
    txt("tkt-venue", "Venue Name", {
      left: 24, top: 85, width: 280,
      fontSize: 12, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.accent, textAlign: "left",
    }),

    // Date
    txt("tkt-date", "Jan 1, 2026", {
      left: 24, top: 110, width: 140,
      fontSize: 11, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "left", opacity: 0.8,
    }),

    // Time
    txt("tkt-time", "7:00 PM", {
      left: 170, top: 110, width: 100,
      fontSize: 11, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "left", opacity: 0.8,
    }),

    // Divider
    line("tkt-divider", 24, 135, stubX - 24, 135, {
      stroke: opts.textColor, strokeWidth: 1, left: 24, top: 135, opacity: 0.15,
    }),

    // Seating info row
    // Section
    txt("tkt-section-label", "SECTION", {
      left: 24, top: 148, width: 80,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-section", "A1", {
      left: 24, top: 162, width: 80,
      fontSize: 18, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.textColor, textAlign: "left",
    }),

    // Row
    txt("tkt-row-label", "ROW", {
      left: 130, top: 148, width: 60,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-row", "12", {
      left: 130, top: 162, width: 60,
      fontSize: 18, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.textColor, textAlign: "left",
    }),

    // Seat
    txt("tkt-seat-label", "SEAT", {
      left: 220, top: 148, width: 60,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-seat", "5", {
      left: 220, top: 162, width: 60,
      fontSize: 18, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.textColor, textAlign: "left",
    }),

    // Gate
    txt("tkt-gate-label", "GATE", {
      left: 310, top: 148, width: 60,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-gate", "B", {
      left: 310, top: 162, width: 60,
      fontSize: 18, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.textColor, textAlign: "left",
    }),

    // Price
    txt("tkt-price-label", "PRICE", {
      left: 24, top: 200, width: 80,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-price", "$50.00", {
      left: 24, top: 214, width: 120,
      fontSize: 16, fontFamily: opts.headingFont, fontWeight: 700,
      fill: opts.accent, textAlign: "left",
    }),

    // Attendee
    txt("tkt-attendee-label", "ATTENDEE", {
      left: 24, top: 248, width: 120,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "left", charSpacing: 100, opacity: 0.5,
    }),
    txt("tkt-attendee", "Attendee Name", {
      left: 24, top: 262, width: 200,
      fontSize: 12, fontFamily: opts.bodyFont, fontWeight: 500,
      fill: opts.textColor, textAlign: "left",
    }),

    // Organizer
    txt("tkt-organizer", "Organizer Name", {
      left: 24, top: 300, width: 300,
      fontSize: 9, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "left", opacity: 0.5,
    }),

    // Stub perforation line
    stubLine(stubX, opts.textColor),

    // Right stub area — QR placeholder
    rect("tkt-barcode-area", {
      left: stubX + 20, top: 20, width: W - stubX - 40, height: W - stubX - 40,
      fill: "#ffffff", stroke: opts.textColor, strokeWidth: 1, rx: 4, ry: 4,
      opacity: 0.9,
    }),
    txt("tkt-barcode-label", "QR CODE", {
      left: stubX + 20, top: W - stubX - 10, width: W - stubX - 40,
      fontSize: 8, fontFamily: opts.bodyFont, fontWeight: 600,
      fill: opts.textColor, textAlign: "center", charSpacing: 150, opacity: 0.5,
    }),

    // Serial number on stub
    txt("tkt-serial", "TKT-001", {
      left: stubX + 20, top: H - 40, width: W - stubX - 40,
      fontSize: 10, fontFamily: opts.bodyFont, fontWeight: 400,
      fill: opts.textColor, textAlign: "center", opacity: 0.6,
    }),

    // Bottom accent bar
    rect("tkt-footer-bar", {
      left: 0, top: H - 4, width: W, height: 4,
      fill: opts.accent, stroke: "", strokeWidth: 0,
    }),
  ];

  return buildJson(opts.bg, objects);
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. Classic Elegant
// ═══════════════════════════════════════════════════════════════════════════
const classicElegant = buildTicket({
  bg: "#faf6ef",
  accent: "#b8860b",
  textColor: "#1a1a1a",
  headingFont: "Playfair Display",
  bodyFont: "Lato",
  extraObjects: [
    rect("deco-border", {
      left: 4, top: 4, width: W - 8, height: H - 8,
      fill: "transparent", stroke: "#b8860b", strokeWidth: 2, rx: 0, ry: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Modern Minimal
// ═══════════════════════════════════════════════════════════════════════════
const modernMinimal = buildTicket({
  bg: "#ffffff",
  accent: "#3b82f6",
  textColor: "#111827",
  headingFont: "Inter",
  bodyFont: "Inter",
  extraObjects: [
    rect("accent-side", {
      left: 0, top: 0, width: 5, height: H,
      fill: "#3b82f6", stroke: "", strokeWidth: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. Bold Vibrant
// ═══════════════════════════════════════════════════════════════════════════
const boldVibrant = buildTicket({
  bg: "#fef2f2",
  accent: "#ef4444",
  textColor: "#1a1a1a",
  headingFont: "Poppins",
  bodyFont: "Inter",
  extraObjects: [
    rect("accent-top", {
      left: 0, top: 0, width: W, height: 50,
      fill: "#ef4444", stroke: "", strokeWidth: 0,
    }),
    // Override title to white on red bar
    txt("tkt-event-name-overlay", "", {
      left: 24, top: 12, width: 580,
      fontSize: 28, fontFamily: "Poppins", fontWeight: 700,
      fill: "#ffffff", textAlign: "left", opacity: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Dark Premium
// ═══════════════════════════════════════════════════════════════════════════
const darkPremium = buildTicket({
  bg: "#0f0f0f",
  accent: "#a78bfa",
  textColor: "#f9fafb",
  headingFont: "DM Serif Display",
  bodyFont: "DM Sans",
  extraObjects: [
    rect("glow-accent", {
      left: 0, top: 0, width: 3, height: H,
      fill: "#a78bfa", stroke: "", strokeWidth: 0,
    }),
    rect("glow-accent-r", {
      left: W - 3, top: 0, width: 3, height: H,
      fill: "#a78bfa", stroke: "", strokeWidth: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Retro Vintage
// ═══════════════════════════════════════════════════════════════════════════
const retroVintage = buildTicket({
  bg: "#faf3e3",
  accent: "#92400e",
  textColor: "#1c1917",
  headingFont: "Playfair Display",
  bodyFont: "Lato",
  extraObjects: [
    rect("border-outer", {
      left: 6, top: 6, width: W - 12, height: H - 12,
      fill: "transparent", stroke: "#92400e", strokeWidth: 3,
    }),
    rect("border-inner", {
      left: 12, top: 12, width: W - 24, height: H - 24,
      fill: "transparent", stroke: "#92400e", strokeWidth: 1,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Corporate Clean
// ═══════════════════════════════════════════════════════════════════════════
const corporateClean = buildTicket({
  bg: "#ffffff",
  accent: "#1e40af",
  textColor: "#111827",
  headingFont: "Inter",
  bodyFont: "Inter",
  extraObjects: [
    rect("corp-header", {
      left: 0, top: 0, width: W, height: 8,
      fill: "#1e40af", stroke: "", strokeWidth: 0,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Festival Neon
// ═══════════════════════════════════════════════════════════════════════════
const festivalNeon = buildTicket({
  bg: "#0a0a0a",
  accent: "#22d3ee",
  textColor: "#f9fafb",
  headingFont: "Oswald",
  bodyFont: "Roboto",
  extraObjects: [
    rect("neon-top", {
      left: 0, top: 0, width: W, height: 3,
      fill: "#22d3ee", stroke: "", strokeWidth: 0,
    }),
    rect("neon-bottom", {
      left: 0, top: H - 3, width: W, height: 3,
      fill: "#22d3ee", stroke: "", strokeWidth: 0,
    }),
    // Glow circles
    circle("glow-1", {
      left: -30, top: -30, radius: 80,
      fill: "#22d3ee", stroke: "", strokeWidth: 0, opacity: 0.06,
    }),
    circle("glow-2", {
      left: W - 120, top: H - 120, radius: 80,
      fill: "#22d3ee", stroke: "", strokeWidth: 0, opacity: 0.06,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. Sports Dynamic
// ═══════════════════════════════════════════════════════════════════════════
const sportsDynamic = buildTicket({
  bg: "#ffffff",
  accent: "#ea580c",
  textColor: "#0f172a",
  headingFont: "Oswald",
  bodyFont: "Roboto",
  extraObjects: [
    // Diagonal accent stripe
    rect("sport-stripe", {
      left: -50, top: -40, width: 200, height: H + 80,
      fill: "#ea580c", stroke: "", strokeWidth: 0,
      angle: -15, opacity: 0.08,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. Airline Standard
// ═══════════════════════════════════════════════════════════════════════════
const airlineStandard = buildTicket({
  bg: "#ffffff",
  accent: "#0369a1",
  textColor: "#0f172a",
  headingFont: "Inter",
  bodyFont: "Inter",
  stubX: 580,
  extraObjects: [
    rect("airline-bar", {
      left: 0, top: 0, width: W, height: 40,
      fill: "#0369a1", stroke: "", strokeWidth: 0,
    }),
    txt("airline-brand", "AIRLINE", {
      left: 16, top: 8, width: 200,
      fontSize: 18, fontFamily: "Inter", fontWeight: 800,
      fill: "#ffffff", textAlign: "left", charSpacing: 200,
    }),
  ],
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Cinema Classic
// ═══════════════════════════════════════════════════════════════════════════
const cinemaClassic = buildTicket({
  bg: "#1a1a1a",
  accent: "#dc2626",
  textColor: "#f9fafb",
  headingFont: "DM Serif Display",
  bodyFont: "DM Sans",
  extraObjects: [
    rect("cinema-top", {
      left: 0, top: 0, width: W, height: 6,
      fill: "#dc2626", stroke: "", strokeWidth: 0,
    }),
    // Film strip decorations on sides
    rect("film-strip-l", {
      left: 0, top: 0, width: 16, height: H,
      fill: "#dc2626", stroke: "", strokeWidth: 0, opacity: 0.15,
    }),
    rect("film-strip-r", {
      left: W - 16, top: 0, width: 16, height: H,
      fill: "#dc2626", stroke: "", strokeWidth: 0, opacity: 0.15,
    }),
  ],
});

// ── Export all templates ────────────────────────────────────────────────────

export const TICKET_FABRIC_TEMPLATES: FabricTemplate[] = [
  {
    id: "tkt-classic-elegant",
    name: "Classic Elegant",
    category: "Formal",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: classicElegant,
  },
  {
    id: "tkt-modern-minimal",
    name: "Modern Minimal",
    category: "Modern",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: modernMinimal,
  },
  {
    id: "tkt-bold-vibrant",
    name: "Bold Vibrant",
    category: "Modern",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: boldVibrant,
  },
  {
    id: "tkt-dark-premium",
    name: "Dark Premium",
    category: "Modern",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: darkPremium,
    isPro: true,
  },
  {
    id: "tkt-retro-vintage",
    name: "Retro Vintage",
    category: "Formal",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: retroVintage,
  },
  {
    id: "tkt-corporate-clean",
    name: "Corporate Clean",
    category: "Minimal",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: corporateClean,
  },
  {
    id: "tkt-festival-neon",
    name: "Festival Neon",
    category: "Modern",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: festivalNeon,
    isPro: true,
  },
  {
    id: "tkt-sports-dynamic",
    name: "Sports Dynamic",
    category: "Modern",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: sportsDynamic,
  },
  {
    id: "tkt-airline-standard",
    name: "Airline Standard",
    category: "Minimal",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: airlineStandard,
  },
  {
    id: "tkt-cinema-classic",
    name: "Cinema Classic",
    category: "Formal",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: cinemaClassic,
  },
];
