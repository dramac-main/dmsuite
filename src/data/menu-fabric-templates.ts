/*  ═══════════════════════════════════════════════════════════════════════════
 *  DMSuite — Menu Designer Fabric.js Templates
 *
 *  12 fully-editable Fabric.js JSON templates for the Menu Designer.
 *  Default: A4 Portrait — 794 × 1123 px (210 × 297 mm @ 96 DPI).
 *
 *  Named objects for quick-edit targeting:
 *    menu-restaurant-name, menu-tagline, menu-header-note, menu-footer-note,
 *    menu-section-{0,1,2}-title, menu-section-{0,1,2}-items,
 *    menu-currency-symbol
 *
 *  Each template uses exact colors + font pairings from MENU_TEMPLATES
 *  in menu-designer-editor.ts.
 *  ═══════════════════════════════════════════════════════════════════════════ */

import type { FabricTemplate } from "@/lib/fabric-editor";

// ── Canvas dimensions (A4 portrait @ 96 DPI) ───────────────────────────────
const W = 794;
const H = 1123;

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

// ── Section + items block ───────────────────────────────────────────────────

function menuSection(
  index: number,
  y: number,
  opts: {
    title: string;
    items: string;
    accent: string;
    textColor: string;
    subtextColor: string;
    headingFont: string;
    bodyFont: string;
    dividerColor: string;
    contentWidth: number;
    marginLeft: number;
  },
): Record<string, unknown>[] {
  return [
    // Section divider
    line(`menu-divider-${index}`, opts.marginLeft, y, opts.marginLeft + opts.contentWidth, y, {
      stroke: opts.dividerColor, strokeWidth: 1, opacity: 0.3,
      left: opts.marginLeft, top: y,
    }),
    // Section title
    txt(`menu-section-${index}-title`, opts.title, {
      left: opts.marginLeft, top: y + 12, width: opts.contentWidth, fontSize: 20,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.accent, textAlign: "center",
    }),
    // Items block (multi-line textbox with all items)
    txt(`menu-section-${index}-items`, opts.items, {
      left: opts.marginLeft, top: y + 46, width: opts.contentWidth, fontSize: 13,
      fontFamily: opts.bodyFont,
      fill: opts.textColor, lineHeight: 1.7,
    }),
  ];
}

// ── Default menu items text ─────────────────────────────────────────────────

const STARTERS = "Bruschetta  ·  $12\nClassic Caesar Salad  ·  $14\nSoup of the Day  ·  $10\nGarlic Prawns  ·  $16";
const MAINS = "Grilled Salmon  ·  $28\nFillet Mignon  ·  $36\nRisotto Primavera  ·  $22\nRoast Chicken  ·  $24\nPan-Seared Duck Breast  ·  $32";
const DESSERTS = "Crème Brûlée  ·  $12\nChocolate Fondant  ·  $14\nTiramisu  ·  $12\nCheesecake  ·  $13";

// ── Standard menu body builder ──────────────────────────────────────────────

function buildMenu(opts: {
  bg: string;
  accent: string;
  textColor: string;
  subtextColor: string;
  headingFont: string;
  bodyFont: string;
  headerBg?: string;
  dividerColor?: string;
  extraObjects?: Record<string, unknown>[];
}): string {
  const mx = 60;  // margin-left
  const cw = W - 120;  // content width
  const divC = opts.dividerColor ?? opts.accent;

  const objects: Record<string, unknown>[] = [
    // ── Restaurant name ──
    txt("menu-restaurant-name", "Restaurant Name", {
      left: mx, top: 50, width: cw, fontSize: 36,
      fontWeight: "bold", fontFamily: opts.headingFont,
      fill: opts.accent, textAlign: "center",
    }),

    // ── Tagline ──
    txt("menu-tagline", "Fine Dining & Cocktails", {
      left: mx, top: 96, width: cw, fontSize: 14,
      fontFamily: opts.bodyFont, fontStyle: "italic",
      fill: opts.subtextColor, textAlign: "center",
    }),

    // ── Header note ──
    txt("menu-header-note", "All prices inclusive of tax. Please inform us of any allergies.", {
      left: mx, top: 124, width: cw, fontSize: 10,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center", opacity: 0.7,
    }),

    // ── Top decorative line ──
    line("menu-top-rule", mx, 150, mx + cw, 150, {
      stroke: divC, strokeWidth: 1, opacity: 0.4,
      left: mx, top: 150,
    }),

    // ── Section 0: Starters ──
    ...menuSection(0, 170, {
      title: "Starters",
      items: STARTERS,
      accent: opts.accent,
      textColor: opts.textColor,
      subtextColor: opts.subtextColor,
      headingFont: opts.headingFont,
      bodyFont: opts.bodyFont,
      dividerColor: divC,
      contentWidth: cw,
      marginLeft: mx,
    }),

    // ── Section 1: Main Course ──
    ...menuSection(1, 380, {
      title: "Main Course",
      items: MAINS,
      accent: opts.accent,
      textColor: opts.textColor,
      subtextColor: opts.subtextColor,
      headingFont: opts.headingFont,
      bodyFont: opts.bodyFont,
      dividerColor: divC,
      contentWidth: cw,
      marginLeft: mx,
    }),

    // ── Section 2: Desserts ──
    ...menuSection(2, 630, {
      title: "Desserts",
      items: DESSERTS,
      accent: opts.accent,
      textColor: opts.textColor,
      subtextColor: opts.subtextColor,
      headingFont: opts.headingFont,
      bodyFont: opts.bodyFont,
      dividerColor: divC,
      contentWidth: cw,
      marginLeft: mx,
    }),

    // ── Footer note ──
    txt("menu-footer-note", "V = Vegetarian  |  VG = Vegan  |  GF = Gluten Free", {
      left: mx, top: H - 70, width: cw, fontSize: 10,
      fontFamily: opts.bodyFont,
      fill: opts.subtextColor, textAlign: "center", opacity: 0.6,
    }),

    // ── Bottom decorative line ──
    line("menu-bottom-rule", mx, H - 50, mx + cw, H - 50, {
      stroke: divC, strokeWidth: 1, opacity: 0.3,
      left: mx, top: H - 50,
    }),
  ];

  if (opts.extraObjects) objects.push(...opts.extraObjects);

  return buildJson(opts.bg, objects);
}

// ═══════════════════════════════════════════════════════════════════════════
//  Templates
// ═══════════════════════════════════════════════════════════════════════════

export const MENU_FABRIC_TEMPLATES: FabricTemplate[] = [
  // ── 1  Elegant Serif ───────────────────────────────────────────────────
  {
    id: "elegant-serif",
    name: "Elegant Serif",
    category: "Fine Dining",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#faf6ef",
      accent: "#b8860b",
      textColor: "#1a1a1a",
      subtextColor: "#78716c",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
    }),
  },

  // ── 2  Modern Minimal ──────────────────────────────────────────────────
  {
    id: "modern-minimal",
    name: "Modern Minimal",
    category: "Contemporary",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#ffffff",
      accent: "#18181b",
      textColor: "#18181b",
      subtextColor: "#71717a",
      headingFont: "Inter",
      bodyFont: "Inter",
    }),
  },

  // ── 3  Rustic Kraft ────────────────────────────────────────────────────
  {
    id: "rustic-kraft",
    name: "Rustic Kraft",
    category: "Casual",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#f5ebe0",
      accent: "#92400e",
      textColor: "#3d2c1e",
      subtextColor: "#78716c",
      headingFont: "Crimson Text",
      bodyFont: "Source Sans 3",
    }),
  },

  // ── 4  Bistro Classic ──────────────────────────────────────────────────
  {
    id: "bistro-classic",
    name: "Bistro Classic",
    category: "European",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#fffbf0",
      accent: "#7c2d12",
      textColor: "#292524",
      subtextColor: "#78716c",
      headingFont: "Cormorant Garamond",
      bodyFont: "Montserrat",
      extraObjects: [
        rect("menu-border", {
          left: 20, top: 20, width: W - 40, height: H - 40,
          fill: "transparent", stroke: "#7c2d12", strokeWidth: 1, opacity: 0.2,
        }),
      ],
    }),
  },

  // ── 5  Cocktail Bar (dark) ─────────────────────────────────────────────
  {
    id: "cocktail-bar",
    name: "Cocktail Bar",
    category: "Bar & Lounge",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildMenu({
      bg: "#0f0f23",
      accent: "#c084fc",
      textColor: "#e2e8f0",
      subtextColor: "#94a3b8",
      headingFont: "Poppins",
      bodyFont: "Inter",
      dividerColor: "#7c3aed",
    }),
  },

  // ── 6  Farm to Table ───────────────────────────────────────────────────
  {
    id: "farm-to-table",
    name: "Farm to Table",
    category: "Organic",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#f7fdf4",
      accent: "#65a30d",
      textColor: "#1a2e05",
      subtextColor: "#6b7280",
      headingFont: "Merriweather",
      bodyFont: "Open Sans",
    }),
  },

  // ── 7  Asian Fusion ────────────────────────────────────────────────────
  {
    id: "asian-fusion",
    name: "Asian Fusion",
    category: "International",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#fefce8",
      accent: "#dc2626",
      textColor: "#1c1917",
      subtextColor: "#78716c",
      headingFont: "DM Serif Display",
      bodyFont: "DM Sans",
    }),
  },

  // ── 8  Italian Trattoria ───────────────────────────────────────────────
  {
    id: "italian-trattoria",
    name: "Italian Trattoria",
    category: "European",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#fef9f0",
      accent: "#b91c1c",
      textColor: "#292524",
      subtextColor: "#78716c",
      headingFont: "Playfair Display",
      bodyFont: "Lato",
      extraObjects: [
        rect("menu-double-border-outer", {
          left: 16, top: 16, width: W - 32, height: H - 32,
          fill: "transparent", stroke: "#b91c1c", strokeWidth: 2, opacity: 0.15,
        }),
        rect("menu-double-border-inner", {
          left: 22, top: 22, width: W - 44, height: H - 44,
          fill: "transparent", stroke: "#b91c1c", strokeWidth: 1, opacity: 0.1,
        }),
      ],
    }),
  },

  // ── 9  Seafood Coastal ─────────────────────────────────────────────────
  {
    id: "seafood-coastal",
    name: "Seafood Coastal",
    category: "Seafood",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#f0f9ff",
      accent: "#0369a1",
      textColor: "#0c4a6e",
      subtextColor: "#6b7280",
      headingFont: "Oswald",
      bodyFont: "Roboto",
    }),
  },

  // ── 10 Steakhouse Bold (dark) ──────────────────────────────────────────
  {
    id: "steakhouse-bold",
    name: "Steakhouse Bold",
    category: "Steakhouse",
    thumbnailUrl: "",
    width: W,
    height: H,
    isPro: true,
    json: buildMenu({
      bg: "#1c1917",
      accent: "#991b1b",
      textColor: "#fafaf9",
      subtextColor: "#a8a29e",
      headingFont: "Oswald",
      bodyFont: "Roboto",
      dividerColor: "#991b1b",
    }),
  },

  // ── 11 Café Playful ────────────────────────────────────────────────────
  {
    id: "cafe-playful",
    name: "Café Playful",
    category: "Café",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#fff7ed",
      accent: "#ea580c",
      textColor: "#431407",
      subtextColor: "#78716c",
      headingFont: "Poppins",
      bodyFont: "Inter",
    }),
  },

  // ── 12 Prix Fixe Luxury ────────────────────────────────────────────────
  {
    id: "prix-fixe-luxury",
    name: "Prix Fixe Luxury",
    category: "Fine Dining",
    thumbnailUrl: "",
    width: W,
    height: H,
    json: buildMenu({
      bg: "#fafaf9",
      accent: "#78716c",
      textColor: "#1c1917",
      subtextColor: "#a8a29e",
      headingFont: "Cormorant Garamond",
      bodyFont: "Montserrat",
      extraObjects: [
        line("menu-ornamental-top", W / 2 - 60, 148, W / 2 + 60, 148, {
          stroke: "#78716c", strokeWidth: 1, opacity: 0.4,
          left: W / 2 - 60, top: 148,
        }),
      ],
    }),
  },
];
